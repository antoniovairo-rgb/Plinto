/**
 * La gru: cambia un pezzo e nient'altro.
 *
 * Le regole che questi test difendono sono quelle che rendono l'attrezzo un aiuto invece
 * di una fregatura: il pezzo nuovo deve entrare sulla griglia, deve essere diverso da
 * quelli rimasti in mano, e non deve costare una mossa.
 */
import { describe, it, expect } from 'vitest';
import { createGame, cambiaPezzo, placePiece } from '../src/core/engine.js';
import { hasAnyPlacement, idx } from '../src/core/grid.js';

const partita = (seed = 12345) => createGame({ seed });

describe('la gru', () => {
  it('cambia solo il pezzo scelto e lascia gli altri', () => {
    const prima = partita();
    const dopo = cambiaPezzo(prima, 1);
    expect(dopo).not.toBeNull();
    expect(dopo.hand[0].uid).toBe(prima.hand[0].uid);
    expect(dopo.hand[2].uid).toBe(prima.hand[2].uid);
    expect(dopo.hand[1].uid).not.toBe(prima.hand[1].uid);
  });

  it('NON consuma una mossa e non tocca griglia, punteggio e Catena', () => {
    // E' la regola che rende la gru un aiuto: in un livello a mosse contate, un attrezzo
    // che costa una mossa ti fa perdere prima.
    const prima = partita();
    const dopo = cambiaPezzo(prima, 0);
    expect(dopo.stats.moves).toBe(prima.stats.moves);
    expect(dopo.score).toBe(prima.score);
    expect(dopo.chainLevel).toBe(prima.chainLevel);
    expect([...dopo.grid]).toEqual([...prima.grid]);
  });

  it('il pezzo nuovo e DIVERSO da quelli rimasti in mano', () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      const prima = partita(seed * 7919);
      const dopo = cambiaPezzo(prima, 0);
      const restanti = [prima.hand[1].shapeId, prima.hand[2].shapeId];
      expect(restanti, `seed ${seed}`).not.toContain(dopo.hand[0].shapeId);
    }
  });

  it('il pezzo nuovo ENTRA sulla griglia, anche quando e quasi piena', () => {
    // Si riempie la griglia lasciando pochi buchi: e' la situazione in cui si usa la gru.
    let stato = partita(4242);
    const grid = new Uint8Array(stato.grid);
    for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
      if (!(r === 8 && c >= 5)) grid[idx(r, c)] = 1;
    }
    stato = { ...stato, grid };
    for (let i = 0; i < 20; i += 1) {
      const dopo = cambiaPezzo(stato, 0);
      expect(hasAnyPlacement(dopo.grid, dopo.hand[0].shape), `giro ${i}`).toBe(true);
    }
  });

  it('non porta mai bombe: cambiare pezzi non deve diventare il modo per coltivarle', () => {
    for (let seed = 1; seed <= 60; seed += 1) {
      const dopo = cambiaPezzo(partita(seed * 104729), 0);
      expect(dopo.hand[0].bombe ?? [], `seed ${seed}`).toHaveLength(0);
    }
  });

  it('su uno slot vuoto o a partita finita non fa niente, e lo dice', () => {
    const vuoto = { ...partita(), hand: [null, null, null] };
    expect(cambiaPezzo(vuoto, 0)).toBeNull();
    const finita = { ...partita(), status: 'over' };
    expect(cambiaPezzo(finita, 0)).toBeNull();
  });

  it('la partita resta giocabile dopo la gru', () => {
    let stato = cambiaPezzo(partita(777), 2);
    const pezzo = stato.hand[2];
    expect(hasAnyPlacement(stato.grid, pezzo.shape)).toBe(true);
    // e si puo' davvero appoggiare, senza che il motore protesti
    const dopo = placePiece(stato, 2, 0, 0);
    expect(dopo.stats.moves).toBe(1);
  });
});
