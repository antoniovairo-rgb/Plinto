/**
 * Generatore della mano di PLINTO — casualita' controllata.
 *
 * Principio guida (vedi docs/GAMEPLAY_RULES.md, "Equita'"):
 *   il generatore puo' solo AIUTARE il giocatore, mai ostacolarlo.
 *   Non esiste una sola regola che renda il gioco piu' difficile in funzione di
 *   quanto bene stai andando. Niente difficolta' occulta, niente falsi quasi-successi.
 *
 * Le regole attive sono CINQUE, tutte elencate anche in docs/GAMEPLAY_RULES.md:
 *   1. PRESSIONE DA AFFOLLAMENTO — sopra CROWD_PRESSURE_START (45%) le forme grandi
 *      diventano progressivamente meno probabili. Aiuto, non ostacolo.
 *   2. MEMORIA — le forme uscite nelle ultime HISTORY_SIZE estrazioni pesano meno:
 *      alza la varieta' percepita senza rendere la sequenza prevedibile.
 *   3. PEZZI A RISCHIO — sotto RISKY_PIECE_FILL (30%) un pezzo con meno di
 *      MIN_PLACEMENTS_EARLY case possibili viene sostituito.
 *   4. MANO MORTA — sotto EARLY_MERCY_FILL (50%) una mano in cui NESSUN pezzo e'
 *      piazzabile viene rigenerata.
 *   5. PEZZO PICCOLO GARANTITO — sopra CROWDED_FILL_RATIO (60%) almeno un pezzo
 *      della mano ha al massimo SMALL_PIECE_MAX_CELLS celle.
 * Sopra quelle soglie il gioco non interviene: il game over e' possibile ed e' meritato.
 */

import { SHAPES } from './shapes.js';
import { hasAnyPlacement, countPlacements, fillRatio } from './grid.js';
import { createRng } from './rng.js';
import {
  HAND_SIZE,
  COLOR_COUNT,
  EARLY_MERCY_FILL,
  MERCY_ATTEMPTS,
  HISTORY_SIZE,
  HISTORY_PENALTY,
  MAX_SAME_SHAPE_IN_HAND,
  CROWD_PRESSURE_START,
  CROWD_PRESSURE_BASE,
  CROWD_NEUTRAL_SIZE,
  CROWDED_FILL_RATIO,
  SMALL_PIECE_MAX_CELLS,
  MIN_PLACEMENTS_EARLY,
  RISKY_PIECE_FILL,
  BOMBA_PROBABILITA,
} from '../config/rules.js';

/** Contatore per gli identificativi dei pezzi (chiavi React stabili). */
let uidCounter = 0;

/** Azzera il contatore: usato solo dai test per avere id deterministici. */
export function resetUid() {
  uidCounter = 0;
}

function makePiece(shape, color, bombe = []) {
  uidCounter += 1;
  return { uid: `pz${uidCounter}`, shapeId: shape.id, shape, color, bombe };
}

/**
 * Mette al massimo UNA bomba nella mano, con probabilita' fissa.
 *
 * Fissa e' la parola importante: la probabilita' non guarda ne' il punteggio, ne'
 * quanto sta andando bene la partita, ne' da quanto non ne esce una. Un giocatore
 * che va forte non riceve piu' bombe per premiarlo e nemmeno meno per rallentarlo.
 * E' l'unico modo perche' una sorpresa resti una sorpresa e non una leva.
 *
 * La bomba non finisce mai su un pezzo da una cella sola: sarebbe una bomba da
 * appoggiare dove capita, senza nessuna decisione da prendere.
 */
function forseUnaBomba(rng, pezzi) {
  if (rng.float() >= BOMBA_PROBABILITA) return pezzi;
  const candidati = pezzi
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.shape.size > 1);
  if (candidati.length === 0) return pezzi;
  const scelto = candidati[rng.int(candidati.length)];
  const cella = rng.int(scelto.p.shape.size);
  const conBomba = pezzi.slice();
  conBomba[scelto.i] = { ...scelto.p, bombe: [cella] };
  return conBomba;
}

/**
 * Peso effettivo di una forma date le condizioni correnti.
 * @param {object} shape
 * @param {number} fill riempimento della griglia in [0,1]
 * @param {string[]} history id delle forme uscite di recente
 */
export function effectiveWeight(shape, fill, history) {
  let weight = shape.weight;

  // 1. Pressione da affollamento: penalizza le forme oltre CROWD_NEUTRAL_SIZE celle.
  if (fill > CROWD_PRESSURE_START) {
    const pressure = (fill - CROWD_PRESSURE_START) / (1 - CROWD_PRESSURE_START);
    const excess = Math.max(0, shape.size - CROWD_NEUTRAL_SIZE);
    if (excess > 0) weight *= CROWD_PRESSURE_BASE ** (pressure * excess);
  }

  // 2. Memoria: le forme appena viste pesano meno.
  if (history.includes(shape.id)) weight *= HISTORY_PENALTY;

  return weight;
}

/** Estrazione pesata da un elenco di forme. @returns {object} forma */
function weightedPick(rng, candidates, fill, history) {
  let total = 0;
  const weights = new Array(candidates.length);
  for (let i = 0; i < candidates.length; i += 1) {
    const w = effectiveWeight(candidates[i], fill, history);
    weights[i] = w;
    total += w;
  }
  if (total <= 0) return rng.pick(candidates);
  let roll = rng.float() * total;
  for (let i = 0; i < candidates.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Colore estetico del pezzo; evita tre pezzi identici di colore nella stessa mano. */
function pickColor(rng, used) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const color = rng.int(COLOR_COUNT) + 1;
    if (used.filter((c) => c === color).length < 2) return color;
  }
  return rng.int(COLOR_COUNT) + 1;
}

/** Costruisce una mano candidata senza applicare la clemenza. */
function drawHand(rng, fill, history) {
  const shapes = [];
  const colors = [];
  const localHistory = [...history];

  for (let slot = 0; slot < HAND_SIZE; slot += 1) {
    let shape = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = weightedPick(rng, SHAPES, fill, localHistory);
      const alreadyInHand = shapes.filter((s) => s.id === candidate.id).length;
      if (alreadyInHand < MAX_SAME_SHAPE_IN_HAND) { shape = candidate; break; }
    }
    // Se otto tentativi non bastano si sceglie ESPLICITAMENTE fra le sole forme
    // ammesse: prima questo ramo ripescava senza vincolo e poteva far entrare in mano
    // una terza copia della stessa forma. Raro, ma "raro" non e' "mai".
    if (shape === null) {
      const ammesse = SHAPES.filter(
        (c) => shapes.filter((s2) => s2.id === c.id).length < MAX_SAME_SHAPE_IN_HAND,
      );
      shape = weightedPick(rng, ammesse.length > 0 ? ammesse : SHAPES, fill, localHistory);
    }
    shapes.push(shape);
    localHistory.push(shape.id);
    colors.push(pickColor(rng, colors));
  }

  return shapes.map((shape, i) => makePiece(shape, colors[i]));
}

/** Almeno un pezzo della mano e' piazzabile sulla griglia data? */
function handIsAlive(grid, pieces) {
  return pieces.some((piece) => hasAnyPlacement(grid, piece.shape));
}

/**
 * Un pezzo e' "a rischio" se su griglia ancora libera ha pochissime case possibili:
 * il giocatore appoggia gli altri due pezzi, quelle case spariscono, e la partita
 * finisce senza che lui abbia sbagliato niente.
 */
function isRiskyPiece(grid, shape) {
  return countPlacements(grid, shape, MIN_PLACEMENTS_EARLY) < MIN_PLACEMENTS_EARLY;
}

/**
 * Genera la mano successiva.
 * @param {Uint8Array} grid griglia corrente
 * @param {number} rngState stato del generatore pseudo-casuale
 * @param {string[]} history id delle forme uscite di recente
 * @returns {{pieces: object[], rngState: number, history: string[], mercyApplied: boolean}}
 */
export function generateHand(grid, rngState, history = []) {
  const rng = createRng(rngState);
  const fill = fillRatio(grid);

  let pieces = drawHand(rng, fill, history);
  let mercyApplied = false;

  // Regola 3 — pezzi a rischio.
  // Solo nel primissimo terzo di partita (sotto RISKY_PIECE_FILL, cioe' il 30% di
  // riempimento) sostituiamo i pezzi che hanno pochissime case possibili: sono quelli
  // che generano i game over percepiti come ingiusti. Sopra quella soglia non tocchiamo
  // piu' nulla, ed e' una soglia molto piu' bassa di quella della regola 4.
  if (fill < RISKY_PIECE_FILL) {
    for (let slot = 0; slot < pieces.length; slot += 1) {
      let guard = 0;
      while (isRiskyPiece(grid, pieces[slot].shape) && guard < MERCY_ATTEMPTS) {
        const safe = SHAPES.filter((s) => !isRiskyPiece(grid, s));
        if (safe.length === 0) break;
        pieces[slot] = makePiece(
          weightedPick(rng, safe, fill, history),
          pieces[slot].color,
        );
        mercyApplied = true;
        guard += 1;
      }
    }
  }

  // Regola 4 — mano morta in partenza (soglia piu' alta: meta' griglia).
  if (fill < EARLY_MERCY_FILL && !handIsAlive(grid, pieces)) {
    for (let attempt = 0; attempt < MERCY_ATTEMPTS && !handIsAlive(grid, pieces); attempt += 1) {
      pieces = drawHand(rng, fill, history);
      mercyApplied = true;
    }
    if (!handIsAlive(grid, pieces)) {
      const placeable = SHAPES.filter((s) => hasAnyPlacement(grid, s));
      if (placeable.length > 0) {
        const rescue = weightedPick(rng, placeable, fill, history);
        pieces[pieces.length - 1] = makePiece(rescue, pickColor(rng, pieces.map((p) => p.color)));
      }
    }
  }

  // Regola 5 — con la griglia molto piena garantiamo almeno un pezzo piccolo.
  if (fill >= CROWDED_FILL_RATIO && !pieces.some((p) => p.shape.size <= SMALL_PIECE_MAX_CELLS)) {
    const small = SHAPES.filter((s) => s.size <= SMALL_PIECE_MAX_CELLS);
    const chosen = weightedPick(rng, small, fill, history);
    pieces[HAND_SIZE - 1] = makePiece(chosen, pickColor(rng, pieces.map((p) => p.color)));
  }

  const conBombe = forseUnaBomba(rng, pieces);
  const nextHistory = [...history, ...pieces.map((p) => p.shapeId)].slice(-HISTORY_SIZE);

  return { pieces: conBombe, rngState: rng.state, history: nextHistory, mercyApplied };
}
