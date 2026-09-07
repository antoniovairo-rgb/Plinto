/**
 * Record personali e statistiche di vita del giocatore.
 * Sono l'unica forma di progressione di PLINTO: nessun livello, nessuna valuta,
 * nessuna ricompensa a tempo. Si torna a giocare per battere se stessi.
 */

import { KEYS, chiaveRecord } from './storage.js';
import { leggiDocumento, scriviDocumento } from './documenti.js';

/**
 * Versione dei due documenti di questo modulo.
 * Alla 1 si passa dalla forma senza versione: i campi sono gli stessi, cambia solo
 * il fatto che adesso il documento dice da dove viene.
 */
const VERSIONE = 1;

const RECORD_PREDEFINITI = {
  best: 0,
  bestChain: 0,
  bestMove: 0,
  bestGroupsInOneMove: 0,
};

const STATISTICHE_PREDEFINITE = {
  partite: 0,
  punteggioTotale: 0,
  mosseTotali: 0,
  gruppiTotali: 0,
  griglieSvuotate: 0,
  tempoTotaleMs: 0,
};

/** @returns {{best:number, bestChain:number, bestMove:number, bestGroupsInOneMove:number}} */
export function loadRecords(modalita = 'libera') {
  return leggiDocumento(chiaveRecord(modalita), {
    versione: VERSIONE, predefiniti: RECORD_PREDEFINITI,
  });
}

/** @returns {{partite:number, punteggioTotale:number, mosseTotali:number, gruppiTotali:number, griglieSvuotate:number, tempoTotaleMs:number}} */
export function loadStats() {
  return leggiDocumento(KEYS.STATS, { versione: VERSIONE, predefiniti: STATISTICHE_PREDEFINITE });
}

/**
 * Registra una partita conclusa.
 * @param {object} summary output di summarize() del motore
 * @returns {{records:object, stats:object, nuoviRecord:string[]}}
 */
export function recordGame(summary, modalita = 'libera') {
  const records = loadRecords(modalita);
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

  scriviDocumento(chiaveRecord(modalita), VERSIONE, records);
  scriviDocumento(KEYS.STATS, VERSIONE, stats);

  return { records, stats, nuoviRecord };
}
