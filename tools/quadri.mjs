/**
 * Misura la difficolta' reale di ogni Quadro.
 *
 * I numeri di src/config/quadri.js sono scelte di progetto, ma "quanti punti in quante
 * mosse" non e' una cosa che si possa indovinare: un obiettivo troppo alto rende il
 * livello impossibile, uno troppo basso lo rende inutile, e in entrambi i casi il
 * giocatore se ne accorge prima di noi.
 *
 * Qui ogni Quadro viene giocato piu' volte dal giocatore artificiale che pianifica
 * l'intera mano, e si misura quante volte riesce. Non e' il giocatore umano medio: e'
 * un metro coerente. Serve a leggere la CURVA, non a stabilire una verita' assoluta.
 *
 * Come si legge il risultato:
 *   riuscite alte in tutti i quadri  -> il percorso non chiede niente
 *   riuscite a zero                  -> il quadro e' probabilmente impossibile
 *   curva che scende irregolarmente  -> la progressione non e' una progressione
 *
 * Uso: npm run quadri [tentativi] [base|anteprima]
 *
 * NOTA SULLA MISURA. Fino alla versione 1.0.2 il pianificatore simulava le posate
 * IGNORANDO le bombe (`placeShape` chiamata senza l'elenco dei blocchi esplosivi):
 * pianificava su una griglia leggermente diversa da quella che poi otteneva davvero.
 * Era un difetto del metro, non del gioco -- la mossa veniva comunque applicata dal
 * motore vero -- ma falsava i numeri con cui si tarano i bersagli. E' corretto da
 * qui in avanti, quindi le percentuali di riuscita NON sono confrontabili con quelle
 * pubblicate prima: vanno rimisurate entrambe le modalita'.
 */

import { QUADRI } from '../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro, MODALITA_QUADRI } from '../src/core/quadro.js';
import { createRng, seedFromString } from '../src/core/rng.js';
import { MODALITA } from '../src/config/rules.js';
import { preferenze, scegliMossa } from '../src/sim/giocatore-quadri.mjs';

/**
 * Il giocatore che mira all'obiettivo sta in src/sim/giocatore-quadri.mjs, e non qui.
 *
 * Ci stava, fino alla 1.1.0, e il generatore dei livelli ne aveva una copia con pesi
 * diversi: il generatore evitava sempre di spezzare la Catena, questo strumento solo su
 * certi obiettivi. Cosi' il generatore poteva dichiarare superabile un livello che questo
 * strumento bocciava, ed e' successo col quadro 44. Chi tara e chi verifica adesso usano
 * lo STESSO metro, perche' e' lo stesso modulo.
 */

const TENTATIVI = Number(process.argv[2] ?? 10);
// Seconda posizione: la modalita'. `node tools/quadri.mjs 10 anteprima` misura gli
// stessi cento livelli giocati vedendo la terna successiva.
// Il valore predefinito e' la modalita' in cui i Quadri si giocano DAVVERO: uno
// strumento che misura di default qualcosa che nessuno gioca misura il livello
// sbagliato. `base` resta esplicito, per il confronto fra le due modalita'.
const MODO = process.argv[3] === 'base' ? MODALITA.BASE : MODALITA_QUADRI;

/**
 * Il seme di un tentativo dipende SOLO dal livello e dal numero del tentativo.
 *
 * Prima c'era un unico generatore condiviso, che avanzava di livello in livello: il
 * tentativo numero 3 del quadro 44 dipendeva da quante mosse avevano richiesto i 43
 * quadri precedenti. Due conseguenze, entrambe brutte. La prima e' che cambiare un
 * bersaglio qualunque cambiava i risultati di TUTTI i livelli successivi, e non si capiva
 * piu' cosa avesse mosso cosa. La seconda e' che il generatore, che prova gli stessi
 * livelli con semi propri, misurava partite diverse da queste: il quadro 44 passava il
 * suo controllo di superabilita' e qui risultava superato una volta su dieci.
 *
 * Con questi semi il tentativo i-esimo di un livello e' LA STESSA PARTITA per il
 * generatore e per questo strumento. La garanzia che il generatore rilascia e la misura
 * che lo strumento pubblica parlano finalmente della stessa cosa.
 */
const semeTentativo = (numero, i) => seedFromString(`prova-${numero}-${i}`);

/** Gioca un Quadro fino alla fine. @returns {{vinto:boolean, mosse:number, punti:number}} */
function gioca(quadro, tentativo) {
  const rng = createRng(semeTentativo(quadro.numero, tentativo));
  let partita = iniziaQuadro(quadro, { now: 0, modalita: MODO });
  const pref = preferenze(quadro);
  let guardia = 0;
  const tetto = quadro.maxMosse ?? 300;

  while (guardia < tetto + 5) {
    const stato = statoQuadro(quadro, partita);
    if (stato.finito) break;
    const mossa = scegliMossa(partita, pref, rng);
    if (!mossa) break;
    partita = giocaNelQuadro(quadro, partita, mossa.handIndex, mossa.row, mossa.col, guardia * 1000);
    guardia += 1;
  }

  const finale = statoQuadro(quadro, partita);
  return {
    vinto: finale.completato,
    mosse: partita.stats.moves,
    punti: partita.score,
    motivo: finale.motivo,
    // Quanto lontano e' arrivato: serve a capire DOVE mettere il bersaglio invece
    // di indovinarlo. Un quadro fallito al 90% e uno fallito al 10% sono due
    // problemi diversi e vanno corretti in modo diverso.
    progressi: finale.progressi.map((p) => ({ tipo: p.tipo, fatto: p.fatto, quanti: p.quanti })),
  };
}

console.log(`\nPLINTO — difficolta' dei Quadri: ${QUADRI.length} quadri x ${TENTATIVI} tentativi, modalita "${MODO}"\n`);
console.log('  #  nome              obiettivo                mosse  riuscite  mosse usate  motivo del fallimento');
console.log('  ' + '-'.repeat(96));

const esiti = [];
for (const quadro of QUADRI) {
  const prove = [];
  for (let i = 0; i < TENTATIVI; i += 1) prove.push(gioca(quadro, i));

  const vinte = prove.filter((p) => p.vinto);
  const percentuale = (vinte.length / TENTATIVI) * 100;
  const mosseMedie = vinte.length
    ? Math.round(vinte.reduce((a, p) => a + p.mosse, 0) / vinte.length)
    : null;
  const motivi = {};
  prove.filter((p) => !p.vinto).forEach((p) => { motivi[p.motivo ?? 'ignoto'] = (motivi[p.motivo ?? 'ignoto'] ?? 0) + 1; });

  // Per i quadri mai superati: quanto in media ci si e' avvicinati.
  const perse = prove.filter((p) => !p.vinto);
  const vicinanza = perse.length === 0 ? null : quadro.obiettivi.map((_, i) => {
    const medi = perse.reduce((a, p) => a + (p.progressi[i]?.fatto ?? 0), 0) / perse.length;
    const su = perse[0].progressi[i]?.quanti ?? 0;
    return `${perse[0].progressi[i]?.tipo ?? '?'} ${medi.toFixed(1)}/${su}`;
  }).join(', ');

  esiti.push({ quadro, percentuale, mosseMedie });

  const obiettivo = quadro.obiettivi.map((o) => `${o.tipo} ${o.quanti}`).join(' + ');
  const barra = '#'.repeat(Math.round(percentuale / 10)).padEnd(10, '.');
  console.log(
    `  ${String(quadro.numero).padStart(2)}  ${quadro.nome.padEnd(17)} ${obiettivo.padEnd(24)} `
    + `${String(quadro.maxMosse ?? '-').padStart(5)}  ${barra} ${String(Math.round(percentuale)).padStart(3)}%  `
    + `${String(mosseMedie ?? '-').padStart(11)}  `
    + `${percentuale === 0 ? `arrivato a ${vicinanza}` : Object.entries(motivi).map(([k, v]) => `${k} x${v}`).join(', ')}`,
  );
}

console.log('\n  ' + '-'.repeat(96));
const impossibili = esiti.filter((e) => e.percentuale === 0);
const banali = esiti.filter((e) => e.percentuale === 100 && e.quadro.numero > 6);
console.log(`  Quadri mai superati dall'IA: ${impossibili.length ? impossibili.map((e) => e.quadro.numero).join(', ') : 'nessuno'}`);
console.log(`  Quadri superati sempre, oltre i primi sei: ${banali.length ? banali.map((e) => e.quadro.numero).join(', ') : 'nessuno'}`);

// La curva: media delle riuscite per blocchi di dieci quadri.
console.log('\n  Andamento della curva (riuscite medie per gruppo di dieci):');
for (let i = 0; i < esiti.length; i += 10) {
  const gruppo = esiti.slice(i, i + 10);
  const media = gruppo.reduce((a, e) => a + e.percentuale, 0) / gruppo.length;
  console.log(`    quadri ${String(i + 1).padStart(2)}-${String(Math.min(i + 10, esiti.length)).padStart(2)}: ${'#'.repeat(Math.round(media / 5)).padEnd(20, '.')} ${media.toFixed(0)}%`);
}
console.log('');
