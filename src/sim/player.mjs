/**
 * Giocatori artificiali per le simulazioni di bilanciamento.
 *
 * Servono a rispondere a domande che nessun test unitario puo' rispondere:
 * quanto dura una partita? quanto punteggio fa un principiante rispetto a un esperto?
 * quanto spesso si muore? le sequenze di pezzi sono ingiuste?
 *
 * Tre livelli, che approssimano i tre profili di playtest del progetto:
 *   - casuale  -> chi non guarda la griglia (limite inferiore assoluto)
 *   - normale  -> chi vede le eliminazioni ovvie e non ama i buchi
 *   - esperto  -> chi valuta anche la Catena e la compattezza della griglia
 */

import {
  allPlacements,
  findCompletedGroups,
  clearGroups,
  placeShape,
  fillRatio,
  idx,
} from '../core/grid.js';
import { GRID_SIZE, QUADRANT_SIZE } from '../config/rules.js';
import { quadrantCells, QUADRANT_COUNT } from '../core/grid.js';
import { createRng } from '../core/rng.js';
import { accoglienza } from './accoglienza.mjs';

/** Tutte le mosse legali disponibili nello stato corrente. */
export function legalMoves(state) {
  const moves = [];
  state.hand.forEach((piece, i) => {
    if (!piece) return;
    for (const [row, col] of allPlacements(state.grid, piece.shape)) {
      moves.push({ handIndex: i, row, col, piece });
    }
  });
  return moves;
}

/** Numero di celle vuote isolate (senza vicini vuoti): i buchi che uccidono le partite. */
function isolatedHoles(grid) {
  let holes = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (grid[idx(r, c)] !== 0) continue;
      const up = r > 0 && grid[idx(r - 1, c)] === 0;
      const down = r < GRID_SIZE - 1 && grid[idx(r + 1, c)] === 0;
      const left = c > 0 && grid[idx(r, c - 1)] === 0;
      const right = c < GRID_SIZE - 1 && grid[idx(r, c + 1)] === 0;
      if (!up && !down && !left && !right) holes += 1;
    }
  }
  return holes;
}

/**
 * Quanto e' "promettente" una griglia: quanti gruppi sono quasi chiusi.
 *
 * I QUADRANTI CONTANO. Nella prima versione questa funzione guardava solo righe e
 * colonne, cioe' era cieca proprio sulla meccanica che distingue PLINTO: un giocatore
 * simulato che non vede i quadranti non puo' giocare meglio di uno che li ignora, e
 * questo falsava il confronto fra i profili.
 */
function nearCompletions(grid) {
  let score = 0;

  for (let r = 0; r < GRID_SIZE; r += 1) {
    let filled = 0;
    for (let c = 0; c < GRID_SIZE; c += 1) if (grid[idx(r, c)] !== 0) filled += 1;
    if (filled >= GRID_SIZE - 2 && filled < GRID_SIZE) score += filled - (GRID_SIZE - 3);
  }
  for (let c = 0; c < GRID_SIZE; c += 1) {
    let filled = 0;
    for (let r = 0; r < GRID_SIZE; r += 1) if (grid[idx(r, c)] !== 0) filled += 1;
    if (filled >= GRID_SIZE - 2 && filled < GRID_SIZE) score += filled - (GRID_SIZE - 3);
  }

  const celleQuadrante = QUADRANT_SIZE * QUADRANT_SIZE;
  for (let q = 0; q < QUADRANT_COUNT; q += 1) {
    let filled = 0;
    for (const cella of quadrantCells(q)) if (grid[cella] !== 0) filled += 1;
    if (filled >= celleQuadrante - 2 && filled < celleQuadrante) {
      score += filled - (celleQuadrante - 3);
    }
  }
  return score;
}

/** Valuta una mossa senza applicarla al motore (piu' veloce e senza effetti collaterali). */
function evaluate(state, move, weights) {
  const { grid: after } = placeShape(state.grid, move.piece.shape, move.row, move.col, 1);
  const groups = findCompletedGroups(after);
  const holes = isolatedHoles(after);
  const fill = fillRatio(after);
  const near = nearCompletions(after);
  return (
    groups.length * weights.groups +
    (groups.length > 0 ? state.chain * weights.chain : 0) -
    holes * weights.holes -
    fill * weights.fill +
    near * weights.near
  );
}

const PROFILES = {
  casuale: null,
  normale: { groups: 100, chain: 0, holes: 6, fill: 20, near: 1 },
  esperto: { groups: 120, chain: 14, holes: 14, fill: 45, near: 4 },
  // Lo "stratega" non e' un giocatore realistico: e' il metro del TETTO DI ABILITA'.
  // Pianifica tutti i pezzi della mano insieme invece di scegliere una mossa alla volta.
  // Se il suo punteggio non e' molto piu' alto di quello del giocatore avido,
  // significa che il gioco non premia la pianificazione: e' un difetto di design.
  stratega: { groups: 120, chain: 14, holes: 14, fill: 45, near: 4, lookahead: true },
};

const BEAM = 8;

// Quante sequenze complete della mano vengono rigiudicate alla luce della terna
// successiva, quando il gioco la mostra. Non tutte: quelle sotto le prime dieci perdono
// gia' sul merito della mano che si ha davanti.
const ALTERNATIVE_CON_ANTEPRIMA = 10;
// L'anteprima pesa meno della mano vera: una mossa buona adesso e' certa, una comodita'
// fra tre mosse e' una previsione.
const PESO_ANTEPRIMA = 0.6;
// Un pezzo della terna successiva senza posto e' la fine della partita, non una mossa
// meno buona.
const PENALITA_BLOCCO = 1200;

/** Applica una mossa alla sola griglia (senza motore): posa, chiude, svuota. */
function applyToGrid(grid, shape, row, col) {
  const { grid: placed } = placeShape(grid, shape, row, col, 1);
  const groups = findCompletedGroups(placed);
  const { grid: after } = clearGroups(placed, groups);
  return { grid: after, groupCount: groups.length };
}

/** Valore statico di una griglia (nessun gruppo appena chiuso da contare). */
function gridValue(grid, weights) {
  return -isolatedHoles(grid) * weights.holes
    - fillRatio(grid) * weights.fill
    + nearCompletions(grid) * weights.near;
}

/**
 * Cerca la sequenza migliore usando tutti i pezzi ancora in mano.
 * Beam search: a ogni livello prova solo le BEAM posizioni piu' promettenti per pezzo.
 * @returns {{value:number, first:object|null}}
 */
function ramiDiRadice(grid, pieces, weights, depth) {
  const rami = [];
  for (let i = 0; i < pieces.length; i += 1) {
    const piece = pieces[i];
    if (!piece) continue;
    const spots = allPlacements(grid, piece.shape);
    if (spots.length === 0) continue;

    const ranked = spots
      .map(([row, col]) => {
        const step = applyToGrid(grid, piece.shape, row, col);
        return {
          row,
          col,
          step,
          immediate: step.groupCount * weights.groups + gridValue(step.grid, weights),
        };
      })
      .sort((a, b) => b.immediate - a.immediate)
      .slice(0, BEAM);

    const rest = pieces.slice();
    rest[i] = null;

    for (const option of ranked) {
      const sub = planHand(option.step.grid, rest, weights, depth - 1);
      rami.push({
        value: option.step.groupCount * weights.groups + sub.value,
        first: { handIndex: i, row: option.row, col: option.col, piece },
        griglia: sub.griglia,
      });
    }
  }
  return rami;
}

function planHand(grid, pieces, weights, depth) {
  // Il valore "fermati qui" vale solo se davvero non si puo' piazzare piu' nulla:
  // altrimenti una sequenza corta competerebbe contro sequenze lunghe misurate su
  // una scala diversa, e la ricerca preferirebbe non giocare. Il giocatore invece
  // DEVE piazzare, quindi il confronto va fatto solo fra sequenze complete.
  const fermarsi = { value: gridValue(grid, weights), first: null, griglia: grid };
  if (depth === 0) return fermarsi;
  return ramiDiRadice(grid, pieces, weights, depth)
    .reduce((a, b) => (b.value > a.value ? b : a), fermarsi);
}

/**
 * Come `planHand`, ma sapendo gia' quale terna arrivera'.
 *
 * Lo stratega e' il metro del tetto di abilita': se il gioco mostra un'informazione e
 * il metro non la usa, il metro non misura piu' il tetto. Fra le sequenze migliori
 * della mano corrente sceglie quella che lascia la griglia piu' pronta ad accogliere la
 * terna successiva -- che e' l'unica cosa che l'anteprima permette di fare davvero.
 */
function planHandConAnteprima(grid, pieces, weights, depth, manoDopo) {
  const rami = ramiDiRadice(grid, pieces, weights, depth);
  if (rami.length === 0) return { value: gridValue(grid, weights), first: null, griglia: grid };

  const metro = (dopo, gruppi) => gruppi.length * weights.groups + gridValue(dopo, weights);
  return [...rami]
    .sort((a, b) => b.value - a.value)
    .slice(0, ALTERNATIVE_CON_ANTEPRIMA)
    .map((r) => {
      const acc = accoglienza(r.griglia, manoDopo, metro);
      return { ...r, value: r.value + PESO_ANTEPRIMA * acc.valore - (acc.bloccato ? PENALITA_BLOCCO : 0) };
    })
    .reduce((a, b) => (b.value > a.value ? b : a));
}

/**
 * Sceglie una mossa per il profilo indicato.
 * @returns {object|null} null se non ci sono mosse legali
 */
export function chooseMove(state, profile, rng) {
  const moves = legalMoves(state);
  if (moves.length === 0) return null;

  const weights = PROFILES[profile];
  if (!weights) return moves[rng.int(moves.length)];

  if (weights.lookahead) {
    const remaining = state.hand.filter(Boolean).length;
    const plan = state.manoSuccessiva
      ? planHandConAnteprima(state.grid, state.hand, weights, remaining, state.manoSuccessiva)
      : planHand(state.grid, state.hand, weights, remaining);
    if (plan.first) return plan.first;
  }

  let best = null;
  let bestValue = -Infinity;
  for (const move of moves) {
    const value = evaluate(state, move, weights) + rng.float() * 0.5;
    if (value > bestValue) { bestValue = value; best = move; }
  }
  return best;
}

export const PROFILE_NAMES = Object.keys(PROFILES);
export { createRng };
