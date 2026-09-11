/**
 * Esegue TUTTE le verifiche, in ordine, e riassume l'esito.
 *
 * Perche' esiste. I controlli di questo progetto sono ventuno, e sono comandi separati:
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

/** Il nome del controllo della geometria, citato in piu' punti. */
const NOME_GEOMETRIA = 'geometria della plancia e dei tocchi';

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
  // Il "rimetti a posto": la regola sta nei test unitari, qui si prova il collegamento
  // fra regola e schermo, che vive fra tre hook e un componente e nessun test unitario
  // puo' vedere.
  { nome: 'rimetti a posto il pezzo', comando: 'npm', argomenti: ['run', 'annulla'] },
  // Le frasi di incitamento. QUALE frase dire e' provato dai test unitari; qui si prova
  // che compaia sopra la plancia senza rubarle il tocco. E' la stessa famiglia di
  // difetto della 1.8.0 -- qualcosa di decorativo che si mette davanti a una cosa che
  // si tocca -- e quella volta se ne accorse un giocatore, non un controllo.
  { nome: 'frasi di incitamento sulla plancia', comando: 'npm', argomenti: ['run', 'incitamenti'] },
  { nome: 'archivio delle sfide nel browser', comando: 'npm', argomenti: ['run', 'archivio'] },
  { nome: 'scheda condivisibile e ripiego sugli appunti', comando: 'npm', argomenti: ['run', 'condivisione'] },
  { nome: 'anteprima della terna nel browser', comando: 'npm', argomenti: ['run', 'anteprima'] },
  { nome: 'tasto Indietro di Android', comando: 'npm', argomenti: ['run', 'indietro'] },
  { nome: 'la home entra nello schermo', comando: 'npm', argomenti: ['run', 'impaginazione'] },
  // La geometria del tavolo: dove sono le caselle e dove finisce un tocco. Costa dieci
  // secondi ed e' cio' che permette a una modifica di solo disegno di non pagarne
  // tremilaottocento: il giro completo registra questa firma, e la corsia veloce la
  // riconfronta invece di dare per scontato che il foglio di stile abbia spostato
  // qualcosa. Trova anche una cosa che prima non guardava nessuno: qualsiasi
  // sovrimpressione che si metta davanti alla griglia e si mangi i tocchi.
  { nome: NOME_GEOMETRIA, comando: 'npm', argomenti: ['run', 'geometria'] },
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
/**
 * DUE ELENCHI, NON UNO, E LA DIFFERENZA E' UN'ORA DI CONTROLLI.
 *
 * Il primo elenco raccoglie i file che DECIDONO come si gioca: il motore, il
 * generatore, la configurazione dei livelli, i componenti con cui si posa un pezzo. Se
 * cambia uno di questi, i cento livelli vanno rigiocati e non c'e' misura che possa
 * sostituirli: solo giocarli dice se sono ancora vincibili.
 *
 * Il secondo raccoglie i file che DISEGNANO il tavolo senza decidere le regole: il
 * foglio di stile e i componenti che stanno intorno alla plancia. Qui la regola
 * precedente era grossolana e lo pagava chi lavorava: qualunque riga di CSS costava
 * un'ora, un anello attorno alla barra della Catena quanto una riscrittura della
 * plancia. Segnalato da chi usa questo progetto, tre volte, e aveva ragione tutte e tre.
 *
 * La domanda giusta non e' "e' cambiato il foglio di stile?" ma "la plancia e' ancora
 * quella su cui i cento livelli sono stati vinti, e un tocco arriva ancora dove deve?".
 * A quella risponde `npm run geometria` in una decina di secondi, misurando la
 * geometria della griglia sui formati stretto e comune e provando il tocco al centro di
 * tutte e ottantuno le caselle e di ogni pezzo in mano. Se la firma e' identica a quella
 * registrata all'ultimo giro completo andato bene, i cento livelli non hanno niente di
 * nuovo da dire.
 *
 * QUESTO CONTROLLO E' PIU' SEVERO DEL PRECEDENTE, NON MENO. La regola vecchia guardava
 * i nomi dei file e non guardava affatto le sovrimpressioni: un elemento messo davanti
 * alla griglia che si mangia i tocchi passava inosservato se il suo file non era
 * nell'elenco. Verificato che il controllo nuovo lo trovi: con un velo sopra la plancia
 * segnala tutte e ottantuno le caselle, su entrambi i formati.
 */
const DECIDE_IL_GIOCO = [
  // Tutto il motore, TRANNE la scheda condivisibile: `scheda.js` sta qui dentro per
  // comodita' di collocazione, ma e' un formattatore di testo puro che nessuna parte del
  // gioco importa -- solo la condivisione e le sue prove. Verificato prima di scriverlo,
  // e se un giorno qualcuno gliela facesse importare da altrove questa riga andrebbe
  // tolta.
  /^src\/core\/(?!scheda\.js$)/,
  /^src\/sim\//,
  /^src\/state\//,
  /^src\/config\/(rules|quadri)\.js$/,
  // I componenti con cui si posa davvero un pezzo. Il vassoio resta qui e non fra i
  // "disegnano": quale pezzo si afferra non e' una questione di geometria.
  /^src\/ui\/(Plancia|Tray|Pezzo|Bomba|MiniGriglia|Salvagente|SchermoGioco)\.jsx$/,
  /^src\/ui\/use(Trascinamento|Tastiera)\.js$/,
  /^src\/ui\/schermate\/(AperturaQuadro|FineQuadro|Quadri)\.jsx$/,
  /^tools\/genera-quadri\.mjs$/,
  /^tests\/e2e\/tutti-i-livelli\.mjs$/,
  /^index\.html$/,
  /^vite\.config\.js$/,
];

/** Disegnano il tavolo senza decidere le regole: basta che la geometria non cambi. */
const DISEGNA_IL_GIOCO = [
  /^src\/styles\//,
  // Stanno sopra e sotto la plancia: possono cambiarle lo spazio, e quindi la misura
  // delle celle, ma quel cambiamento lo vede la firma della geometria.
  /^src\/ui\/(Hud|BarraObiettivo|AnteprimaTerna)\.jsx$/,
  /^tests\/e2e\/geometria\.mjs$/,
];

const TOCCA_IL_GIOCO = [...DECIDE_IL_GIOCO, ...DISEGNA_IL_GIOCO];

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

/**
 * Le impronte di tutti i file che decidono come si gioca, una per file.
 *
 * SI CHIEDONO A GIT ANCHE I FILE NON ANCORA VERSIONATI, e non e' un dettaglio. La prima
 * versione usava `git ls-files` e basta, che elenca solo cio' che e' gia' committato: un
 * file nuovo, scritto ma non ancora aggiunto, era invisibile all'impronta. E' successo
 * davvero -- `src/core/incitamenti.js` e' rimasto fuori dal registro di un giro completo
 * andato a buon fine, perche' al momento di scriverlo non era ancora versionato.
 *
 * Quella volta e' finita nel verso innocuo: al giro dopo il file risultava "comparso dal
 * nulla" e la corsia veloce e' stata negata. Ma il verso pericoloso e' l'altro. Un file
 * che decide come si gioca e che resta non versionato non viene visto CAMBIARE, e la
 * corsia veloce salterebbe i cento livelli su codice modificato: esattamente la cosa che
 * questo meccanismo esiste per impedire.
 *
 * `--others --exclude-standard` aggiunge i file presenti ma non versionati, rispettando
 * il .gitignore: cosi' l'impronta descrive il codice che c'e' sul disco, che e' quello
 * che i cento livelli hanno davvero giocato.
 */
function improntaDelGioco() {
  try {
    const tutti = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
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

const FIRMA_GEOMETRIA = new URL('../geometria.json', import.meta.url).pathname;

/** La firma appena misurata da `npm run geometria`, o null se non c'e'. */
function leggiGeometria() {
  try { return JSON.parse(readFileSync(FIRMA_GEOMETRIA, 'utf8')); } catch { return null; }
}

/**
 * In che cosa il tavolo differisce da quello dell'ultimo giro completo. `null` = non lo
 * so, e non sapere vale come "e' cambiato": si rigiocano i cento livelli.
 *
 * Il confronto e' su numeri arrotondati al pixel, non sui byte del foglio di stile: una
 * regola CSS riscritta che produce la stessa identica plancia non ha niente da dire ai
 * cento livelli, e una che sposta una casella ce l'ha anche se ha cambiato un carattere.
 */
function geometriaCambiata(adesso) {
  if (!adesso) return null;
  let prima;
  try {
    prima = JSON.parse(readFileSync(REGISTRO_LIVELLI, 'utf8')).geometria;
  } catch { return null; }
  if (!prima) return null;

  const differenze = [];
  const formati = new Set([...Object.keys(prima), ...Object.keys(adesso)]);
  for (const formato of formati) {
    const a = prima[formato];
    const b = adesso[formato];
    if (!a || !b) { differenze.push(`formato ${formato}: misurato solo in uno dei due giri`); continue; }
    for (const chiave of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const va = JSON.stringify(a[chiave]);
      const vb = JSON.stringify(b[chiave]);
      if (va !== vb) differenze.push(`${formato} · ${chiave}: ${va} -> ${vb}`);
    }
  }
  return differenze;
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
// I controlli gia' eseguiti per decidere la corsia: si registrano come fatti, non si
// rifanno. Sono cosa diversa da `saltati`, che sono quelli NON eseguiti.
const giaFatti = new Set();
const improntaOra = improntaDelGioco();
let geometriaOra = null;
if (process.argv.includes('--veloce')) {
  const cambiati = cambiatoDallUltimoGiro(improntaOra);
  const decidono = (cambiati ?? []).filter((f) => DECIDE_IL_GIOCO.some((r) => r.test(f)));
  const disegnano = (cambiati ?? []).filter((f) => DISEGNA_IL_GIOCO.some((r) => r.test(f)));

  if (cambiati === null) {
    eco('\n\u001b[1mCorsia veloce NEGATA\u001b[0m: non risulta nessun giro completo passato su'
      + ' questa macchina, quindi i cento livelli non li ha mai rigiocati nessuno qui.\n');
  } else if (decidono.length > 0) {
    eco('\n\u001b[1mCorsia veloce NEGATA\u001b[0m: dall\'ultimo giro completo sono cambiati file'
      + ' che DECIDONO come si gioca. Solo giocarli dice se i livelli sono ancora vincibili.\n');
    decidono.forEach((f) => eco(`  - ${f}\n`));
  } else if (disegnano.length > 0) {
    // Sono cambiati solo file che DISEGNANO il tavolo. La domanda non e' piu' "quali
    // file", e' "la plancia e' ancora quella?": si misura, e la misura decide.
    eco('\n\u001b[1mCorsia veloce\u001b[0m: sono cambiati solo file che disegnano il tavolo,'
      + ' non le regole. Misuro la geometria prima di decidere.\n');
    disegnano.forEach((f) => eco(`  - ${f}\n`));

    const daQui = Date.now();
    const misurata = await esegui({
      nome: NOME_GEOMETRIA, comando: 'npm', argomenti: ['run', 'geometria'],
    });
    const secondiGeometria = Math.round((Date.now() - daQui) / 1000);
    giaFatti.add(NOME_GEOMETRIA);
    esiti.push({ nome: NOME_GEOMETRIA, ok: misurata, secondi: secondiGeometria });
    geometriaOra = leggiGeometria();
    const differenze = geometriaCambiata(geometriaOra);

    if (!misurata) {
      eco('\n\u001b[1mCorsia veloce NEGATA\u001b[0m: la misura della geometria e\' fallita.\n');
    } else if (differenze === null) {
      eco('\n\u001b[1mCorsia veloce NEGATA\u001b[0m: l\'ultimo giro completo non ha registrato'
        + ' nessuna geometria, quindi non c\'e\' niente con cui confrontare.\n');
    } else if (differenze.length > 0) {
      eco('\n\u001b[1mCorsia veloce NEGATA\u001b[0m: il tavolo non e\' piu\' quello su cui i'
        + ' cento livelli sono stati vinti.\n');
      differenze.forEach((d) => eco(`  - ${d}\n`));
    } else {
      saltati = ['tutti e cento i livelli, giocati nell app'];
      eco('\n\u001b[1mCorsia veloce\u001b[0m: la geometria della plancia e i tocchi sono'
        + ' identici a quelli dell\'ultimo giro completo. I cento livelli non hanno niente di'
        + ' nuovo da dire: li salto e mi tengo e2e-quadri.\n');
    }
  } else {
    saltati = ['tutti e cento i livelli, giocati nell app'];
    eco('\n\u001b[1mCorsia veloce\u001b[0m: il codice che decide come si gioca e\' identico,'
      + ' file per file, a quello dell\'ultimo giro completo passato. Salto i cento livelli e'
      + ' mi tengo e2e-quadri.\n');
  }
}

for (const verifica of VERIFICHE.filter((v) => !saltati.includes(v.nome) && !giaFatti.has(v.nome))) {
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
      // La geometria su cui questi cento livelli sono stati vinti. E' cio' che permette
      // a una modifica di solo disegno di non pagare un'ora: si confronta questa,
      // invece di dare per scontato che il foglio di stile abbia spostato qualcosa.
      geometria: leggiGeometria(),
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
