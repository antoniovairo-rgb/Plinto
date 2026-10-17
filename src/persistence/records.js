/**
 * Record personali e statistiche di vita del giocatore.
 * Sono l'unica forma di progressione di PLINTO: nessun livello, nessuna valuta,
 * nessuna ricompensa a tempo. Si torna a giocare per battere se stessi.
 */

import { KEYS, chiaveRecord } from './storage.js';
import { leggiDocumento, scriviDocumento } from './documenti.js';
import { caricaSfide } from './sfide.js';

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

/**
 * Il punto di partenza del record della Sfida, per chi ha giocato sfide prima che il
 * record fosse separato (B7): il punteggio migliore fra i giorni dell'archivio delle
 * sfide. L'archivio conserva solo il punteggio di ogni giorno, quindi catena, mossa e
 * Intreccio partono da zero: non si possono ricostruire, e inventarli sarebbe peggio.
 * Non si scrive niente finche' non si chiude una sfida: tornare indietro resta gratis.
 */
function recordSfidaIniziale() {
  let best = 0;
  for (const voce of Object.values(caricaSfide())) {
    const punti = voce?.best;
    if (typeof punti === 'number' && Number.isFinite(punti) && punti > best) best = punti;
  }
  return { ...RECORD_PREDEFINITI, best };
}

/**
 * @param {'libera'|'sfida'} [modalita]
 * @returns {{best:number, bestChain:number, bestMove:number, bestGroupsInOneMove:number}}
 */
export function loadRecords(modalita = 'libera') {
  const chiave = chiaveRecord(modalita);
  const predefiniti = chiave === KEYS.RECORDS_SFIDA ? recordSfidaIniziale() : RECORD_PREDEFINITI;
  return leggiDocumento(chiave, { versione: VERSIONE, predefiniti });
}

/** @returns {{partite:number, punteggioTotale:number, mosseTotali:number, gruppiTotali:number, griglieSvuotate:number, tempoTotaleMs:number}} */
export function loadStats() {
  return leggiDocumento(KEYS.STATS, { versione: VERSIONE, predefiniti: STATISTICHE_PREDEFINITE });
}

/**
 * Registra una partita conclusa.
 * I record sono della modalita' giocata; le statistiche restano una sola, per tutte e due.
 * @param {object} summary output di summarize() del motore
 * @param {'libera'|'sfida'} [modalita]
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
