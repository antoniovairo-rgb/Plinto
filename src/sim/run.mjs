/**
 * Harness di simulazione di PLINTO.
 *
 * Uso:  node src/sim/run.mjs [partite] [profilo] [tetto di mosse]
 *       node src/sim/run.mjs 5000 normale
 *       node src/sim/run.mjs 200 stratega 250
 *
 * Il tetto di mosse serve a confrontare profili di abilita' diversa a parita' di
 * occasioni: senza, il giocatore piu' bravo fa piu' punti anche solo perche' sopravvive
 * piu' a lungo, e non si capisce se sta giocando MEGLIO o soltanto di piu'.
 *
 * Non e' un test di regressione: e' lo strumento di BILANCIAMENTO. Risponde a
 * "quanto dura una partita", "quanto e' distribuito il punteggio", "quanto spesso
 * si muore presto", "quale forma esce troppo o troppo poco".
 */

import { createGame, placePiece, summarize } from '../core/engine.js';
import { fillRatio } from '../core/grid.js';
import { chooseMove, createRng, PROFILE_NAMES } from './player.mjs';
import { SHAPES } from '../core/shapes.js';

const GAMES = Number(process.argv[2] ?? 2000);
const PROFILE = process.argv[3] ?? 'normale';
const TETTO = Number(process.argv[4] ?? Infinity);
// Quarta posizione: la modalita' di gioco. Serve al confronto fra il gioco base e la
// modalita' anteprima, che NON e' una differenza di interfaccia -- cambia quando il
// generatore legge la griglia, e quindi cambia la difficolta'.
const MODALITA_SIM = process.argv[5] === 'anteprima' ? 'anteprima' : 'base';

if (!PROFILE_NAMES.includes(PROFILE)) {
  console.error(`Profilo sconosciuto: ${PROFILE}. Disponibili: ${PROFILE_NAMES.join(', ')}`);
  process.exit(1);
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[i];
}

function stats(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  return {
    n: sorted.length,
    media: sum / sorted.length,
    min: sorted[0],
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    mediana: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1],
  };
}

function fmt(s) {
  const r = (n) => (Number.isInteger(n) ? n : n.toFixed(1));
  return `media ${r(s.media)} | min ${r(s.min)} | p10 ${r(s.p10)} | mediana ${r(s.mediana)} | p90 ${r(s.p90)} | max ${r(s.max)}`;
}

const scores = [];
const moves = [];
const durationsGroups = [];
const bestChains = [];
const fillAtDeath = [];
const shapeCount = Object.fromEntries(SHAPES.map((s) => [s.id, 0]));
let earlyDeaths = 0;   // partite finite sotto le 15 mosse
let veryEarlyDeaths = 0; // partite finite sotto le 8 mosse: potenziale ingiustizia
let boardClears = 0;
let sopravvissute = 0;   // partite ancora vive al raggiungimento del tetto

// Il seme della simulazione e' fisso per default (due esecuzioni identiche danno lo
// stesso risultato) ma si puo' cambiare: serve a capire se una differenza fra due
// misure e' un effetto vero o soltanto il campione che e' andato cosi'.
const SEME_SIM = Number(process.env.PLINTO_SEME ?? 20260906);
const rng = createRng(SEME_SIM);
const t0 = Date.now();

for (let g = 0; g < GAMES; g += 1) {
  let state = createGame({ seed: rng.int(0xffffffff) , modalita: MODALITA_SIM });
  state.hand.forEach((p) => { shapeCount[p.shapeId] += 1; });

  let guard = 0;
  while (state.status === 'playing' && guard < 10000 && guard < TETTO) {
    const move = chooseMove(state, PROFILE, rng);
    if (!move) break;
    const before = state.stats.handsDealt;
    state = placePiece(state, move.handIndex, move.row, move.col);
    if (state.stats.handsDealt > before) {
      state.hand.forEach((p) => { if (p) shapeCount[p.shapeId] += 1; });
    }
    guard += 1;
  }

  if (state.status === 'playing') sopravvissute += 1;
  const s = summarize(state);
  scores.push(s.score);
  moves.push(s.moves);
  durationsGroups.push(s.clearedGroups);
  bestChains.push(s.bestChain);
  fillAtDeath.push(Math.round(fillRatio(state.grid) * 100));
  boardClears += s.boardClears;
  if (s.moves < 15) earlyDeaths += 1;
  if (s.moves < 8) veryEarlyDeaths += 1;
}

const elapsed = Date.now() - t0;
const totalPieces = Object.values(shapeCount).reduce((a, b) => a + b, 0);
const totalWeight = SHAPES.reduce((a, s) => a + s.weight, 0);

console.log(`\nPLINTO — simulazione: ${GAMES} partite, profilo "${PROFILE}", modalita "${MODALITA_SIM}", tetto ${TETTO} (${elapsed} ms)\n`);
console.log(`Punteggio     ${fmt(stats(scores))}`);
console.log(`Mosse         ${fmt(stats(moves))}`);
console.log(`Gruppi chiusi ${fmt(stats(durationsGroups))}`);
console.log(`Catena max    ${fmt(stats(bestChains))}`);
console.log(`Riemp. finale ${fmt(stats(fillAtDeath))} %`);
console.log(`\nSvuotamenti totali della griglia: ${boardClears} (eventi, non partite)`);
if (Number.isFinite(TETTO)) {
  console.log(`Ancora vive al tetto di ${TETTO} mosse: ${sopravvissute}/${GAMES} (${((sopravvissute / GAMES) * 100).toFixed(1)}%)`);
}
console.log(`Partite sotto 15 mosse: ${earlyDeaths} (${((earlyDeaths / GAMES) * 100).toFixed(1)}%)`);
console.log(`Partite sotto  8 mosse: ${veryEarlyDeaths} (${((veryEarlyDeaths / GAMES) * 100).toFixed(2)}%)  <- deve restare vicino a zero`);

const buckets = [0, 0, 0, 0, 0, 0];
for (const f of fillAtDeath) {
  if (f < 30) buckets[0] += 1;
  else if (f < 40) buckets[1] += 1;
  else if (f < 50) buckets[2] += 1;
  else if (f < 60) buckets[3] += 1;
  else if (f < 70) buckets[4] += 1;
  else buckets[5] += 1;
}
const labels = ['<30%', '30-40%', '40-50%', '50-60%', '60-70%', '>=70%'];
console.log('\nRiempimento della griglia al game over (equita\': le partite morte con la griglia');
console.log("quasi vuota sono quelle che il giocatore percepisce come ingiuste):");
buckets.forEach((n, i) => {
  const pct = (n / GAMES) * 100;
  console.log(`  ${labels[i].padEnd(7)} ${String(n).padStart(5)}  ${pct.toFixed(1).padStart(5)}%  ${'#'.repeat(Math.round(pct))}`);
});

console.log('\nDistribuzione forme (atteso da peso -> osservato):');
const rows = SHAPES.map((s) => {
  const expected = (s.weight / totalWeight) * 100;
  const observed = (shapeCount[s.id] / totalPieces) * 100;
  return { id: s.id, size: s.size, expected, observed, delta: observed - expected };
}).sort((a, b) => b.observed - a.observed);
for (const r of rows) {
  const bar = '#'.repeat(Math.round(r.observed * 3));
  console.log(
    `  ${r.id.padEnd(5)} (${r.size}) atteso ${r.expected.toFixed(2)}%  osservato ${r.observed.toFixed(2)}%  ${r.delta >= 0 ? '+' : ''}${r.delta.toFixed(2)}  ${bar}`,
  );
}
console.log('');
