/**
 * Sistema di punteggio di PLINTO.
 *
 * Tre livelli, tutti visibili al giocatore mentre gioca:
 *   1. CELLE      -> punti minimi per ogni cella appoggiata: feedback continuo.
 *   2. INTRECCIO  -> chiudere piu' gruppi con una sola mossa moltiplica il valore.
 *   3. CATENA     -> moltiplicatore persistente che CRESCE quando elimini e
 *                    CALA DI UNO quando non elimini. Non si azzera mai di colpo.
 *
 * La Catena e' la firma di PLINTO: trasforma la partita in una tensione continua
 * ("non spezzare la catena") senza aggiungere una sola regola sul tabellone.
 *
 * Trasparenza (regola di equita'): il moltiplicatore applicato e' quello che il
 * giocatore VEDE nell'interfaccia prima di muovere, cioe' la Catena PRIMA della mossa.
 * L'aumento vale dalla mossa successiva. Nessun calcolo nascosto.
 */

import {
  POINTS_PER_CELL,
  GROUP_BASE_POINTS,
  INTRECCIO_STEP,
  CHAIN_MAX,
  CHAIN_STEP,
  CHAIN_DECAY,
  BOARD_CLEAR_BONUS,
} from '../config/rules.js';

/** Moltiplicatore associato a un livello di Catena. Livello 0 => x1. */
export function chainMultiplier(level) {
  return 1 + CHAIN_STEP * level;
}

/** Moltiplicatore Intreccio per un numero di gruppi chiusi nella stessa mossa. */
export function intrecciMultiplier(groupCount) {
  if (groupCount <= 0) return 0;
  return 1 + INTRECCIO_STEP * (groupCount - 1);
}

/** Nuovo livello di Catena dopo una mossa. */
export function nextChainLevel(level, groupCount) {
  if (groupCount > 0) return Math.min(CHAIN_MAX, level + groupCount);
  return Math.max(0, level - CHAIN_DECAY);
}

/**
 * Calcola il punteggio di una singola mossa.
 * @param {object} move
 * @param {number} move.placedCellCount celle appoggiate dal pezzo
 * @param {{type:string}[]} move.groups gruppi completati
 * @param {number} move.chainLevel livello di Catena PRIMA della mossa
 * @param {boolean} move.boardCleared la griglia e' rimasta completamente vuota
 * @returns {{
 *   points:number, chainAfter:number, chainUsed:number,
 *   breakdown:{placement:number, groupsBase:number, intreccio:number, chain:number, clearPoints:number, boardClear:number}
 * }}
 */
export function scoreMove({ placedCellCount, groups, chainLevel, boardCleared }) {
  const placement = placedCellCount * POINTS_PER_CELL;

  let groupsBase = 0;
  for (const group of groups) {
    groupsBase += GROUP_BASE_POINTS[group.type] ?? 0;
  }

  const intreccio = intrecciMultiplier(groups.length);
  const chain = chainMultiplier(chainLevel);
  const clearPoints = groups.length > 0 ? Math.round(groupsBase * intreccio * chain) : 0;
  const boardClear = boardCleared && groups.length > 0 ? BOARD_CLEAR_BONUS : 0;

  return {
    points: placement + clearPoints + boardClear,
    chainAfter: nextChainLevel(chainLevel, groups.length),
    chainUsed: chainLevel,
    breakdown: { placement, groupsBase, intreccio, chain, clearPoints, boardClear },
  };
}

/**
 * Etichetta con cui l'interfaccia celebra una mossa.
 * Serve al layer di game feel per scegliere l'intensita' del feedback.
 * @returns {null|'buona'|'ottima'|'eccellente'|'perfetta'}
 */
export function moveTier(groupCount, chainLevel) {
  if (groupCount <= 0) return null;
  const heat = groupCount + Math.floor(chainLevel / 3);
  if (heat >= 6) return 'perfetta';
  if (heat >= 4) return 'eccellente';
  if (heat >= 2) return 'ottima';
  return 'buona';
}
