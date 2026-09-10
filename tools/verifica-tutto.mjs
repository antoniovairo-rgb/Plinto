/**
 * Esegue TUTTE le verifiche, in ordine, e riassume l'esito.
 *
 * Perche' esiste. I controlli di questo progetto sono diciotto, e sono comandi separati:
 * chi pubblica deve ricordarseli tutti. Non me li sono ricordati tutti — ho pubblicato
 * saltando `prova-pages`, l'integrazione continua ha bloccato il rilascio, e il difetto
 * era proprio nel controllo che non avevo eseguito. Un elenco da ricordare a memoria e'
 * un elenco che prima o poi si dimentica: qui e' scritto una volta sola, e il comando
 * fallisce se anche uno solo di loro fallisce. Il numero non si ripete a parole piu' di
 * una volta di proposito: era rimasto "quattordici" per tre controlli aggiunti dopo.
 *
 * L'ordine non e' casuale: prima i controlli che costano secondi e trovano gli errori
 * piu' grossolani, poi quelli che aprono un browser. Chi ha rotto la sintassi lo scopre
 * in cinque secondi e non in cinque minuti.
 *
 * Nessuna verifica viene saltata quando un'altra fallisce: si arriva sempre in fondo e
 * si stampa il quadro completo, perche' sapere che tre cose sono rotte e' piu' utile
 * che scoprirle una alla volta in tre esecuzioni.
 *
 * Tutto l'output viene anche SCRITTO SU FILE (`verifica.log`). Serve per una ragione
 * imparata sul posto: un controllo e' fallito una volta sola, il suo messaggio era a
 * schermo, e chi guardava aveva incanalato l'output in `tail` per leggere il riassunto.
 * Il riassunto e' arrivato, la diagnosi no, e il fallimento non si e' piu' ripresentato.
 * Un fallimento intermittente di cui si e' perso il messaggio e' peggio di un
 * fallimento e basta: resta il sospetto e non resta niente su cui lavorare.
 *
 * Uso: npm run verifica
 */

import { spawn, execFileSync } from 'node:child_process';
import { createWriteStream, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const VERIFICHE = [
  { nome: 'test unitari', comando: 'npm', argomenti: ['test'] },
  { nome: 'contrasti WCAG', comando: 'npm', argomenti: ['run', 'contrasti'] },
  { nome: 'build di produzione', comando: 'npm', argomenti: ['run', 'build'] },
  { nome: 'comunicazioni (ogni schermata, ogni lingua)', comando: 'npm', argomenti: ['run', 'comunicazioni'] },
  { nome: 'partita completa nel browser', comando: 'npm', argomenti: ['run', 'e2e'] },
  { nome: 'livelli nel browser (vittoria e sconfitta)', comando: 'npm', argomenti: ['run', 'e2e-quadri'] },
  // La guida al primo avvio: e' l'unica schermata che ogni giocatore vede una volta
  // sola, quindi un suo difetto non lo segnala mai nessuno. Chi lo incontra e' nuovo,
  // non sa che sia un difetto, e non torna indietro a raccontarlo.
  { nome: 'guida al primo avvio (sei passi, due modi di saltarla)', comando: 'npm', argomenti: ['run', 'guida'] },
  { nome: 'archivio delle sfide nel browser', comando: 'npm', argomenti: ['run', 'archivio'] },
  { nome: 'scheda condivisibile e ripiego sugli appunti', comando: 'npm', argomenti: ['run', 'condivisione'] },
  { nome: 'anteprima della terna nel browser', comando: 'npm', argomenti: ['run', 'anteprima'] },
  { nome: 'tasto Indietro di Android', comando: 'npm', argomenti: ['run', 'indietro'] },
  { nome: 'la home entra nello schermo', comando: 'npm', argomenti: ['run', 'impaginazione'] },
  // Il cuore del gioco: tutti e cento i livelli vinti giocandoli nell'app, toccando il
  // pezzo e poi la casella. `e2e-quadri` prova che il percorso FUNZIONI (vittoria,
  // sconfitta, sblocco) su due livelli; questo prova che i cento livelli siano davvero
  // vincibili con le dita, e non solo dentro il motore.
  { nome: 'tutti e cento i livelli, giocati nell app', comando: 'npm', argomenti: ['run', 'livelli'] },
  { nome: 'precisione del trascinamento', comando: 'npm', argomenti: ['run', 'precisione'] },
  { nome: 'build servita da una sottocartella', comando: 'npm', argomenti: ['run', 'prova-pages'] },
  { nome: 'installabile, senza rete e aggiornabile', comando: 'npm', argomenti: ['run', 'installazione'] },
  { nome: 'aspetto su schermi grandi', comando: 'npm', argomenti: ['run', 'prova-desktop'] },
  // La prova di resistenza e' entrata in questo elenco dopo essersi rotta in silenzio:
  // cercava un pulsante della home che non esisteva piu' da due versioni, e nessuno
  // se n'era accorto perche' era l'unico controllo che restava fuori di qui. Un
  // controllo che si lancia solo quando qualcuno se lo ricorda e' un controllo che
  // prima o poi non si lancia piu'.
  { nome: 'resistenza: memoria e fluidita dopo centinaia di mosse', comando: 'npm', argomenti: ['run', 'soak'] },
];

/**
 * LA CORSIA VELOCE, E PERCHE' NON SI FIDA DI CHI LA USA.
 *
 * Il controllo dei cento livelli e' 56 minuti sui 63 di questo comando. Per una modifica
 * a un'icona o a un testo e' sproporzionato, e chi rilascia tre volte in un pomeriggio
 * finisce per saltarlo -- che e' esattamente il modo in cui questo file e' nato, dopo
 * una pubblicazione fatta saltando un controllo e bloccata dall'integrazione continua.
 *
 * Quindi la scorciatoia esiste, ma NON decide chi la lancia: decide il diff. Con
 * `--veloce` il comando guarda quali file sono cambiati rispetto a cio' che e' gia'
 * pubblicato e salta i cento livelli solo se nessuno di quelli elencati qui sotto e'
 * stato toccato. Se anche uno solo lo e', rifiuta e fa il giro intero.
 *
 * COSA C'E' NELL'ELENCO, e perche' e' piu' lungo di "il motore". Quel controllo non
 * prova solo le regole: prova che i cento livelli si vincano TOCCANDO pezzi e caselle
 * nell'app vera. Quindi ci entra anche tutto cio' che sposta la plancia sotto il dito --
 * il foglio di stile compreso. Non e' prudenza eccessiva: due caratteri di icona in piu'
 * hanno fatto tornare lo scorrimento della home nella 1.7.1.
 *
 * Al posto dei cento livelli resta `e2e-quadri`, che gioca vittoria e sconfitta su due
 * livelli veri: non e' la stessa cosa, e infatti il riassunto lo dice a chiare lettere.
 */
const TOCCA_IL_GIOCO = [
  // Tutto il motore, TRANNE la scheda condivisibile: `scheda.js` sta qui dentro per
  // comodita' di collocazione, ma e' un formattatore di testo puro che nessuna parte del
  // gioco importa -- solo la condivisione e le sue prove. Verificato prima di scriverlo,
  // e se un giorno qualcuno gliela facesse importare da altrove questa riga andrebbe
  // tolta.
  /^src\/core\/(?!scheda\.js$)/,
  /^src\/sim\//,
  /^src\/state\//,
  /^src\/styles\//,
  /^src\/config\/(rules|quadri)\.js$/,
  // I componenti con cui si gioca davvero: la plancia, i pezzi, come si trascinano.
  /^src\/ui\/(Plancia|Tray|Pezzo|Bomba|MiniGriglia|Hud|BarraObiettivo|AnteprimaTerna|Salvagente|SchermoGioco)\.jsx$/,
  /^src\/ui\/use(Trascinamento|Tastiera)\.js$/,
  /^src\/ui\/schermate\/(AperturaQuadro|FineQuadro|Quadri)\.jsx$/,
  /^tools\/genera-quadri\.mjs$/,
  /^tests\/e2e\/tutti-i-livelli\.mjs$/,
  /^index\.html$/,
  /^vite\.config\.js$/,
];

/**
 * L'IMPRONTA DEL GIOCO: che aspetto aveva il codice l'ultima volta che i cento livelli
 * sono stati rigiocati per intero e sono passati.
 *
 * Prima la corsia veloce confrontava con cio' che e' PUBBLICATO, e sbagliava domanda.
 * Dopo un giro completo andato bene, correggere una riga in uno script di prova
 * costringeva a rigiocare cento livelli gia' verificati su quel medesimo codice: la
 * stessa ora buttata che la corsia doveva evitare.
 *
 * La domanda giusta e' un'altra: "il codice che decide come si gioca e' ancora quello su
 * cui i cento livelli sono passati?". Si risponde con le impronte dei file, non con un
 * giudizio, e la risposta e' un si' o un no verificabile.
 *
 * Il registro non si versiona: descrive che cosa e' stato eseguito SU QUESTA MACCHINA.
 * Una copia appena clonata non ce l'ha, quindi fa il giro completo -- che e' giusto,
 * perche' li' nessuno ha mai rigiocato niente.
 */
const REGISTRO_LIVELLI = new URL('../verifica-livelli.json', import.meta.url).pathname;

/** Le impronte di tutti i file che decidono come si gioca, una per file. */
function improntaDelGioco() {
  try {
    const tutti = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
      .split('\n').map((r) => r.trim()).filter(Boolean);
    const impronte = {};
    for (const file of tutti.filter((f) => TOCCA_IL_GIOCO.some((r) => r.test(f)))) {
      impronte[file] = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 16);
    }
    return impronte;
  } catch {
    return null;
  }
}

/** Che cosa e' cambiato rispetto all'ultimo giro completo passato. `null` = non lo so. */
function cambiatoDallUltimoGiro(adesso) {
  if (!adesso || !existsSync(REGISTRO_LIVELLI)) return null;
  try {
    const prima = JSON.parse(readFileSync(REGISTRO_LIVELLI, 'utf8')).impronte ?? {};
    const nomi = new Set([...Object.keys(prima), ...Object.keys(adesso)]);
    return [...nomi].filter((f) => prima[f] !== adesso[f]);
  } catch {
    return null;
  }
}

const LOG = new URL('../verifica.log', import.meta.url).pathname;
const registro = createWriteStream(LOG, { flags: 'w' });

/** Scrive a schermo e sul registro, senza incanalare niente. */
function eco(testo, dove = 'stdout') {
  process[dove].write(testo);
  registro.write(testo);
}

/**
 * Esegue un comando mostrandone l'output dal vivo e conservandolo sul registro.
 * L'output NON viene incanalato in nessun altro comando: il codice di uscita di una
 * pipeline e' quello dell'ultimo comando, e con `| tail` un fallimento risulta un
 * successo. E' gia' successo, ed e' il motivo per cui questo file esiste.
 * @returns {Promise<boolean>}
 */
function esegui({ comando, argomenti }) {
  return new Promise((risolvi) => {
    const p = spawn(comando, argomenti, {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: process.platform === 'win32',
    });
    p.stdout.on('data', (d) => eco(d.toString()));
    p.stderr.on('data', (d) => eco(d.toString(), 'stderr'));
    p.on('close', (codice) => risolvi(codice === 0));
    p.on('error', () => risolvi(false));
  });
}

const inizio = Date.now();
const esiti = [];

// --- La corsia veloce: si apre solo se il diff lo permette ---------------------
let saltati = [];
const improntaOra = improntaDelGioco();
if (process.argv.includes('--veloce')) {
  const cambiati = cambiatoDallUltimoGiro(improntaOra);
  if (cambiati === null) {
    eco('\n\u001b[1mCorsia veloce NEGATA\u001b[0m: non risulta nessun giro completo passato su'
      + ' questa macchina, quindi i cento livelli non li ha mai rigiocati nessuno qui.\n');
  } else if (cambiati.length > 0) {
    eco('\n\u001b[1mCorsia veloce NEGATA\u001b[0m: dall\'ultimo giro completo sono cambiati file'
      + ' che decidono come si gioca.\n');
    cambiati.forEach((f) => eco(`  - ${f}\n`));
  } else {
    saltati = ['tutti e cento i livelli, giocati nell app'];
    eco('\n\u001b[1mCorsia veloce\u001b[0m: il codice che decide come si gioca e\' identico,'
      + ' file per file, a quello dell\'ultimo giro completo passato. Salto i cento livelli e'
      + ' mi tengo e2e-quadri.\n');
  }
}

for (const verifica of VERIFICHE.filter((v) => !saltati.includes(v.nome))) {
  const da = Date.now();
  eco(`\n\u001b[1m\u25b6 ${verifica.nome}\u001b[0m\n`);
  const ok = await esegui(verifica);
  esiti.push({ ...verifica, ok, secondi: Math.round((Date.now() - da) / 1000) });
}

const falliti = esiti.filter((e) => !e.ok);

eco(`\n${'='.repeat(60)}\n`);
eco(`VERIFICA COMPLETA \u2014 ${esiti.length} controlli in ${Math.round((Date.now() - inizio) / 1000)}s\n\n`);
for (const e of esiti) {
  eco(`  ${e.ok ? '\u2713' : '\u2717'}  ${e.nome.padEnd(46)} ${String(e.secondi).padStart(4)}s\n`);
}
eco('\n');

// Il salto si dice a chiare lettere, sia a schermo sia nel registro: un riassunto che
// non distingue "passato" da "non eseguito" e' peggio di nessun riassunto.
for (const nome of saltati) {
  eco(`  \u25cb  ${nome.padEnd(46)}  SALTATO (corsia veloce)\n`);
}
if (saltati.length > 0) {
  eco('\nAttenzione: i cento livelli NON sono stati rigiocati. Al loro posto e2e-quadri ha'
    + ' provato vittoria e sconfitta su due livelli, che non e\' la stessa cosa.\n');
}

// Un giro COMPLETO andato bene lascia l'impronta: e' quello che permette alla prossima
// corsia veloce di dire "questi cento livelli li ho gia' giocati su questo identico
// codice" invece di doverlo dare per buono.
if (falliti.length === 0 && saltati.length === 0 && improntaOra) {
  try {
    writeFileSync(REGISTRO_LIVELLI, `${JSON.stringify({
      quando: new Date().toISOString(),
      impronte: improntaOra,
    }, null, 2)}\n`);
    eco('Impronta del gioco registrata: la prossima verifica potra\' saltare i cento livelli'
      + ' finche\' quel codice non cambia.\n');
  } catch {
    eco('Non sono riuscito a registrare l\'impronta del gioco: la prossima verifica fara\' il'
      + ' giro completo.\n', 'stderr');
  }
}

if (falliti.length > 0) {
  eco(`${falliti.length} controlli su ${esiti.length} sono falliti. NON pubblicare.\n`, 'stderr');
  eco(`Output completo di ogni controllo, senza niente perso: ${LOG}\n\n`, 'stderr');
  registro.end(() => process.exit(1));
} else {
  eco(`Tutti i controlli sono passati. Registro: ${LOG}\n\n`);
  registro.end();
}
