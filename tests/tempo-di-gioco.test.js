import { describe, it, expect } from 'vitest';
import {
  createGame, placePiece, serializeGame, deserializeGame, summarize, gameDuration,
  PAUSA_MASSIMA_MS,
} from '../src/core/engine.js';
import { allPlacements } from '../src/core/grid.js';

/**
 * La durata di una partita e' il tempo GIOCATO, non quello trascorso.
 *
 * Era "fine meno inizio": una partita libera ripresa dopo tre giorni risultava lunga tre
 * giorni, e quel numero finiva nella schermata di fine partita, nel "Tempo di gioco" delle
 * statistiche e nel profilo. Trovato dal test massivo prima della domanda di accesso alla
 * produzione: cinque minuti giocati, 4.325 registrati.
 */

const T0 = Date.UTC(2026, 8, 20, 20, 0);
const MINUTO = 60_000;

/** Gioca una mossa qualunque che entri, all'istante dato. */
function unaMossa(stato, istante) {
  const i = stato.hand.findIndex((p) => p && allPlacements(stato.grid, p.shape).length);
  const [r, c] = allPlacements(stato.grid, stato.hand[i].shape)[0];
  return placePiece(stato, i, r, c, istante);
}

describe('tempo di gioco', () => {
  it('conta gli intervalli fra una mossa e l altra', () => {
    let s = createGame({ seed: 5, now: T0 });
    s = unaMossa(s, T0 + 10_000);
    s = unaMossa(s, T0 + 25_000);
    expect(s.tempoGiocatoMs).toBe(25_000);
    expect(gameDuration(s, T0 + 25_000)).toBe(25_000);
  });

  it('una partita ripresa dopo tre giorni non dura tre giorni', () => {
    let s = createGame({ seed: 5, now: T0 });
    let t = T0;
    for (let k = 0; k < 6; k += 1) { t += 10_000; s = unaMossa(s, t); }   // un minuto
    const salvato = JSON.parse(JSON.stringify(serializeGame(s)));
    t += 3 * 24 * 60 * MINUTO;                                               // l'app resta chiusa
    s = deserializeGame(salvato);
    while (s.status === 'playing') { t += 10_000; s = unaMossa(s, t); }
    const r = summarize(s, t);
    // Ogni mossa conta dieci secondi, tranne la prima dopo la ripresa, che ne conta al
    // massimo PAUSA_MASSIMA_MS: prima erano tre giorni.
    expect(r.durationMs).toBe((r.moves - 1) * 10_000 + PAUSA_MASSIMA_MS);
    expect(r.durationMs).toBeLessThan(60 * MINUTO);
  });

  it('anche lasciata aperta in secondo piano, una pausa lunga vale il tetto', () => {
    let s = createGame({ seed: 7, now: T0 });
    s = unaMossa(s, T0 + 5_000);
    s = unaMossa(s, T0 + 5_000 + 8 * 60 * MINUTO);
    expect(s.tempoGiocatoMs).toBe(5_000 + PAUSA_MASSIMA_MS);
  });

  it('una partita ancora aperta conta anche il tratto in corso, con lo stesso tetto', () => {
    let s = createGame({ seed: 5, now: T0 });
    s = unaMossa(s, T0 + 10_000);
    expect(gameDuration(s, T0 + 40_000)).toBe(40_000);
    expect(gameDuration(s, T0 + 10 * 24 * 60 * MINUTO)).toBe(10_000 + PAUSA_MASSIMA_MS);
  });

  it('un orologio che torna indietro non toglie tempo', () => {
    let s = createGame({ seed: 5, now: T0 });
    s = unaMossa(s, T0 + 10_000);
    s = unaMossa(s, T0 - 50_000);
    expect(s.tempoGiocatoMs).toBe(10_000);
  });

  it('salvataggio e ripresa conservano il tempo giocato', () => {
    let s = createGame({ seed: 5, now: T0 });
    s = unaMossa(s, T0 + 12_000);
    const ripresa = deserializeGame(JSON.parse(JSON.stringify(serializeGame(s))));
    expect(ripresa.tempoGiocatoMs).toBe(12_000);
    expect(ripresa.ultimaAttivitaAt).toBe(T0 + 12_000);
  });

  it('un salvataggio di prima della correzione si legge, e riparte da zero invece che dai giorni', () => {
    let s = createGame({ seed: 5, now: T0 });
    s = unaMossa(s, T0 + 12_000);
    const vecchio = JSON.parse(JSON.stringify(serializeGame(s)));
    delete vecchio.tempoGiocatoMs;
    delete vecchio.ultimaAttivitaAt;
    const ripresa = deserializeGame(vecchio);
    expect(ripresa).not.toBeNull();
    expect(ripresa.tempoGiocatoMs).toBe(0);
    const dopo = unaMossa(ripresa, T0 + 5 * 24 * 60 * MINUTO);
    expect(dopo.tempoGiocatoMs).toBe(0);
  });

  it('un valore manomesso non passa', () => {
    const s = createGame({ seed: 5, now: T0 });
    const grezzo = { ...serializeGame(s), tempoGiocatoMs: -40, ultimaAttivitaAt: 'ieri' };
    const ripresa = deserializeGame(grezzo);
    expect(ripresa.tempoGiocatoMs).toBe(0);
    expect(ripresa.ultimaAttivitaAt).toBeNull();
  });
});
