/**
 * IL GESSETTO: dove conviene appoggiare il prossimo pezzo.
 *
 * Il cervello esiste gia' ed e' quello che nel gate gioca e vince tutti e cento i livelli
 * (`src/sim/giocatore-quadri.mjs`). Qui non se ne scrive un altro: se ne scrivessimo uno
 * "leggero" per l'applicazione, il gioco darebbe consigli diversi da quelli con cui i
 * livelli sono stati tarati, e la garanzia "ogni livello e' superabile" varrebbe per un
 * giocatore che non e' quello che consiglia.
 *
 * LA TRAPPOLA, ED E' LA RAGIONE PRINCIPALE PER CUI QUESTO FILE ESISTE. `scegliMossa` vuole
 * un generatore di numeri casuali. Passandogli quello della partita, chiedere un consiglio
 * CONSUMEREBBE casualita' e cambierebbe i pezzi che arrivano dopo: il suggerimento
 * modificherebbe la partita su cui e' stato chiesto, e due giocatori nella stessa
 * situazione riceverebbero mani diverse a seconda di quanti consigli hanno chiesto. Qui si
 * usa un generatore SEPARATO, seminato in modo deterministico dalla situazione: stessa
 * partita, stesso consiglio, e la partita non si muove di un millimetro.
 *
 * NON E' INDEBOLITO DI PROPOSITO. Un consiglio volutamente mediocre e' una bugia verso chi
 * ha speso un attrezzo per averlo: il limite dev'essere la scarsita' -- uno ogni cinque
 * livelli, massimo tre da parte -- non la qualita'.
 */

import { createRng } from './rng.js';
import { preferenze, scegliMossa } from '../sim/giocatore-quadri.mjs';

/**
 * @param {object} quadro il livello in corso (serve a sapere che cosa conta vincere)
 * @param {object} partita lo stato della partita
 * @returns {{handIndex:number, row:number, col:number}|null} null se non c'e' niente da
 *   consigliare, e in quel caso chi chiama NON deve scalare l'attrezzo.
 */
export function suggerisciMossa(quadro, partita) {
  if (!quadro || !partita || partita.status !== 'playing') return null;
  if (!partita.hand?.some(Boolean)) return null;

  // Il seme viene dalla situazione, non dall'orologio: chiedere due volte lo stesso
  // consiglio nella stessa posizione deve dare la stessa risposta, altrimenti sembra che
  // il gioco cambi idea.
  const seme = (partita.rngState ^ (partita.stats?.moves ?? 0) * 2654435761) >>> 0;
  const mossa = scegliMossa(partita, preferenze(quadro), createRng(seme));
  if (!mossa) return null;
  return { handIndex: mossa.handIndex, row: mossa.row, col: mossa.col };
}
