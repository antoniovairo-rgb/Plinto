/**
 * Record personali e statistiche di vita del giocatore.
 * Sono l'unica forma di progressione di QUADRA: nessun livello, nessuna valuta,
 * nessuna ricompensa a tempo. Si torna a giocare per battere se stessi.
 */

import { read, write, KEYS } from './storage.js';

/** @returns {{best:number, bestChain:number, bestMove:number, bestGroupsInOneMove:number}} */
export function loadRecords() {
  return {
    best: 0,
    bestChain: 0,
    bestMove: 0,
    bestGroupsInOneMove: 0,
    ...(read(KEYS.RECORDS, {}) ?? {}),
  };
}

/** @returns {{partite:number, punteggioTotale:number, mosseTotali:number, gruppiTotali:number, griglieSvuotate:number, tempoTotaleMs:number}} */
export function loadStats() {
  return {
    partite: 0,
    punteggioTotale: 0,
    mosseTotali: 0,
    gruppiTotali: 0,
    griglieSvuotate: 0,
    tempoTotaleMs: 0,
    ...(read(KEYS.STATS, {}) ?? {}),
  };
}

/**
 * Registra una partita conclusa.
 * @param {object} summary output di summarize() del motore
 * @returns {{records:object, stats:object, nuoviRecord:string[]}}
 */
export function recordGame(summary) {
  const records = loadRecords();
  const stats = loadStats();
  const nuoviRecord = [];

  if (summary.score > records.best) { records.best = summary.score; nuoviRecord.push('punteggio'); }
  if (summary.bestChain > records.bestChain) { records.bestChain = summary.bestChain; nuoviRecord.push('catena'); }
  if (summary.bestMovePoints > records.bestMove) { records.bestMove = summary.bestMovePoints; nuoviRecord.push('mossa'); }
  if (summary.bestIntreccio > records.bestGroupsInOneMove) {
    records.bestGroupsInOneMove = summary.bestIntreccio;
    nuoviRecord.push('intreccio');
  }

  stats.partite += 1;
  stats.punteggioTotale += summary.score;
  stats.mosseTotali += summary.moves;
  stats.gruppiTotali += summary.clearedGroups;
  stats.griglieSvuotate += summary.boardClears;
  stats.tempoTotaleMs += summary.durationMs;

  write(KEYS.RECORDS, records);
  write(KEYS.STATS, stats);

  return { records, stats, nuoviRecord };
}
