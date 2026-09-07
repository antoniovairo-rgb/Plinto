/**
 * Misura della Catena.
 *
 * Il commento di CHAIN_GRACE e CHAIN_STEP_UP in src/config/rules.js cita dei numeri:
 * questo strumento e' quello che li produce, cosi' non restano affermazioni che nessuno
 * puo' rifare. La regola della Catena e' stata riscritta due volte proprio perche' la
 * misura diceva che non funzionava, e i numeri delle versioni vecchie sono rimasti nei
 * commenti piu' a lungo della regola che descrivevano.
 *
 * Usa lo `stratega` di src/sim/player.mjs, lo stesso metro di tutte le altre misure del
 * progetto: non e' un giocatore realistico, e' il TETTO DI ABILITA'. Se la Catena non si
 * accende nemmeno per lui, non si accendera' per nessuno.
 *
 * La regola della Catena dipende SOLO dalla sequenza "quanti gruppi ha chiuso ogni
 * mossa": la stessa sequenza si puo' quindi rigiocare con regole diverse e confrontarle a
 * parita' di partite, senza il rumore che introdurrebbe rigiocare tutto da capo.
 *
 * ATTENZIONE, limite da dichiarare. Le partite sono giocate con la regola ATTUALE, e lo
 * stratega guarda il livello di Catena quando sceglie (peso 14 su una mossa che elimina).
 * Le righe delle regole SCARTATE sono quindi controfattuali: dicono che cosa avrebbe fatto
 * quella regola su queste partite, non che cosa avrebbe giocato un giocatore che vedeva
 * quella regola. Solo la riga ATTUALE e' una misura esatta. Il confronto resta utile
 * — l'ordine di grandezza fra "non si accende mai" e "resta incollata al tetto" non
 * dipende da quel peso — ma non va spacciato per una simulazione delle vecchie regole.
 *
 * Uso: node tools/misura-catena.mjs [partite] [tetto di mosse]
 */

import { createGame, placePiece } from '../src/core/engine.js';
import { writeFileSync, mkdirSync } from 'node:fs';
import { chooseMove, createRng } from '../src/sim/player.mjs';
import { IMPRONTA_REGOLE } from '../src/core/impronta.js';
import { CHAIN_MAX, CHAIN_STEP_UP, CHAIN_DECAY, CHAIN_GRACE } from '../src/config/rules.js';

const PARTITE = Number(process.argv[2] ?? 120);
const TETTO = Number(process.argv[3] ?? 250);

/** Registra, per una partita intera, quanti gruppi ha chiuso ogni mossa. */
function sequenzaGruppi(seed, rng) {
  let partita = createGame({ seed, now: 0 });
  const gruppi = [];
  for (let m = 0; m < TETTO && !partita.gameOver; m += 1) {
    const mossa = chooseMove(partita, 'stratega', rng);
    if (!mossa) break;
    partita = placePiece(partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
    gruppi.push(partita.lastMove?.groups?.length ?? 0);
  }
  return gruppi;
}

/**
 * Rigioca la regola della Catena su una sequenza gia' registrata.
 * @param {number[]} gruppi quanti gruppi ha chiuso ogni mossa
 * @param {number} tolleranza mosse a vuoto sopportate prima del calo
 * @param {'uno'|'gruppi'} passo di quanto sale a ogni mossa che elimina
 */
function livelli(gruppi, tolleranza, passo) {
  let livello = 0;
  let digiuno = 0;
  const serie = [];
  for (const g of gruppi) {
    if (g > 0) {
      livello = Math.min(CHAIN_MAX, livello + (passo === 'gruppi' ? g : CHAIN_STEP_UP));
      digiuno = 0;
    } else {
      digiuno += 1;
      if (digiuno > tolleranza) livello = Math.max(0, livello - CHAIN_DECAY);
    }
    serie.push(livello);
  }
  return serie;
}

const rng = createRng(20260906);
const partite = [];
for (let i = 0; i < PARTITE; i += 1) partite.push(sequenzaGruppi(`catena-${i}`, rng));

const mosseTotali = partite.reduce((s, p) => s + p.length, 0);
console.log('\nPLINTO — misura della Catena');
console.log(`  stratega, ${PARTITE} partite, tetto ${TETTO} mosse, ${mosseTotali} mosse giocate\n`);

const pct = (n, tot) => `${((n / tot) * 100).toFixed(1)}%`;

/** Distribuzione dei livelli di Catena per una configurazione di regola. */
function misura(tolleranza, passo) {
  const conteggio = new Array(CHAIN_MAX + 1).fill(0);
  let attiva = 0;
  let somma = 0;
  for (const gruppi of partite) {
    for (const l of livelli(gruppi, tolleranza, passo)) {
      conteggio[l] += 1;
      if (l >= 3) attiva += 1;
      somma += l;
    }
  }
  return { conteggio, attiva, media: somma / mosseTotali };
}

const CONFIGURAZIONI = [
  { etichetta: 'v1: passo=gruppi, tolleranza 0', tolleranza: 0, passo: 'gruppi' },
  { etichetta: 'v2: passo=gruppi, tolleranza 2', tolleranza: 2, passo: 'gruppi' },
  { etichetta: 'v3: passo=1, tolleranza 0', tolleranza: 0, passo: 'uno' },
  {
    etichetta: `ATTUALE: passo=${CHAIN_STEP_UP}, tolleranza ${CHAIN_GRACE}`,
    tolleranza: CHAIN_GRACE,
    passo: 'uno',
  },
  { etichetta: 'v5: passo=1, tolleranza 2', tolleranza: 2, passo: 'uno' },
];

console.log('  regola                          Catena>=3   al tetto   media   distribuzione dei livelli 0..9');
console.log(`  ${'-'.repeat(112)}`);
for (const { etichetta, tolleranza, passo } of CONFIGURAZIONI) {
  const { conteggio, attiva, media } = misura(tolleranza, passo);
  const distribuzione = conteggio.map((n) => pct(n, mosseTotali).padStart(6)).join(' ');
  console.log(
    `  ${etichetta.padEnd(30)} ${pct(attiva, mosseTotali).padStart(9)}  `
    + `${pct(conteggio[CHAIN_MAX], mosseTotali).padStart(9)}  ${media.toFixed(2).padStart(6)}   ${distribuzione}`,
  );
}
console.log('');

// ---------------------------------------------------------------------------
// Il riferimento per il profilo di gioco.
//
// PERCHE' VIENE SCRITTO E NON TRASCRITTO. La schermata del profilo confronta la
// distribuzione della Catena del giocatore con quella dello stratega. Se quei numeri
// li copiasse una persona dentro il codice, prima o poi resterebbero indietro rispetto
// alle regole -- ed e' il caso peggiore, perche' un confronto sbagliato sembra un
// confronto giusto. Quindi li scrive questo script, insieme a tutto cio' che serve per
// sapere se sono ancora validi: profilo usato, partite, tetto di mosse, data e
// IMPRONTA DELLE REGOLE. Se l'impronta non coincide con quella del gioco, la schermata
// non mostra il confronto affatto: meglio nessun paragone che uno sbagliato.
//
// Si rigenera con: npm run catena
// ---------------------------------------------------------------------------
const attuale = misura(CHAIN_GRACE, 'uno');
const riferimento = {
  distribuzione: attuale.conteggio.map((n) => Number((n / mosseTotali).toFixed(5))),
  media: Number(attuale.media.toFixed(3)),
  quotaAttiva: Number((attuale.attiva / mosseTotali).toFixed(5)),
  profilo: 'stratega',
  partite: PARTITE,
  tettoMosse: TETTO,
  mosse: mosseTotali,
  regole: IMPRONTA_REGOLE,
  misuratoIl: new Date().toISOString().slice(0, 10),
  comando: `npm run catena ${PARTITE} ${TETTO}`,
};

const DESTINAZIONE = new URL('../src/data/riferimento-catena.json', import.meta.url).pathname;
mkdirSync(new URL('../src/data/', import.meta.url).pathname, { recursive: true });
writeFileSync(DESTINAZIONE, `${JSON.stringify(riferimento, null, 2)}\n`);
console.log(`  Riferimento scritto in src/data/riferimento-catena.json (impronta ${IMPRONTA_REGOLE}).`);
console.log('  Lo legge la schermata del profilo; se l impronta non coincide, il confronto non si mostra.\n');
