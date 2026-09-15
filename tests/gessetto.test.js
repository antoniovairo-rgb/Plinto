/**
 * Il gessetto: consiglia, e NON tocca la partita.
 *
 * La prova che conta e' la seconda: chiedere un consiglio e non seguirlo deve lasciare la
 * partita identica, byte per byte. Se il suggeritore consumasse il generatore della
 * partita, i pezzi successivi cambierebbero solo per aver chiesto aiuto.
 */
import { describe, it, expect } from 'vitest';
import { createGame, placePiece, canPlaceHandPiece } from '../src/core/engine.js';
import { suggerisciMossa } from '../src/core/suggerimento.js';
import { quadroNumero } from '../src/config/quadri.js';

const quadro = quadroNumero(1);
const partita = (seed) => createGame({ seed });

describe('il gessetto', () => {
  it('consiglia una mossa che si puo davvero fare', () => {
    for (let s = 1; s <= 30; s += 1) {
      const p = partita(s * 7919);
      const m = suggerisciMossa(quadro, p);
      expect(m, `seme ${s}`).not.toBeNull();
      expect(canPlaceHandPiece(p, m.handIndex, m.row, m.col), `seme ${s}`).toBe(true);
    }
  });

  it('NON tocca la partita: chiedere un consiglio non cambia niente', () => {
    const p = partita(4242);
    const prima = JSON.stringify(p);
    suggerisciMossa(quadro, p);
    suggerisciMossa(quadro, p);
    suggerisciMossa(quadro, p);
    expect(JSON.stringify(p)).toBe(prima);
  });

  it('chiedere due volte nella stessa posizione da la stessa risposta', () => {
    const p = partita(999);
    expect(suggerisciMossa(quadro, p)).toEqual(suggerisciMossa(quadro, p));
  });

  it('i pezzi che arrivano dopo sono gli stessi, con o senza consiglio', () => {
    // Il difetto vero che questo file evita: il consiglio che consuma casualita'.
    const senza = placePiece(partita(31337), 0, 0, 0);
    const con = (() => {
      const p = partita(31337);
      suggerisciMossa(quadro, p);
      return placePiece(p, 0, 0, 0);
    })();
    expect(con.hand.map((x) => x?.shapeId)).toEqual(senza.hand.map((x) => x?.shapeId));
    expect(con.rngState).toBe(senza.rngState);
  });

  it('a partita finita o a mani vuote non consiglia niente', () => {
    expect(suggerisciMossa(quadro, { ...partita(1), status: 'over' })).toBeNull();
    expect(suggerisciMossa(quadro, { ...partita(1), hand: [null, null, null] })).toBeNull();
    expect(suggerisciMossa(null, partita(1))).toBeNull();
  });
});
