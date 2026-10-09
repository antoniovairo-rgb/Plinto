import { describe, it, expect } from 'vitest';
import { ritardoOnda, ritardoMassimo, PASSO_ONDA, ONDA_MASSIMA } from '../src/feel/onda.js';

const idx = (r, c) => r * 9 + c;

describe("l'onda dell'eliminazione", () => {
  it('parte dalle caselle del pezzo appena appoggiato', () => {
    expect(ritardoOnda(idx(4, 4), [idx(4, 4)])).toBe(0);
  });

  it('si allarga di un passo per casella, anche in diagonale', () => {
    expect(ritardoOnda(idx(4, 5), [idx(4, 4)])).toBe(PASSO_ONDA);
    expect(ritardoOnda(idx(5, 5), [idx(4, 4)])).toBe(PASSO_ONDA);
    expect(ritardoOnda(idx(4, 7), [idx(4, 4)])).toBe(3 * PASSO_ONDA);
  });

  it('conta la casella del pezzo piu vicina', () => {
    expect(ritardoOnda(idx(0, 8), [idx(0, 0), idx(0, 7)])).toBe(PASSO_ONDA);
  });

  it('non fa mai aspettare oltre il tetto', () => {
    expect(ritardoOnda(idx(0, 8), [idx(8, 0)])).toBe(ONDA_MASSIMA);
    const riga = Array.from({ length: 9 }, (_, c) => idx(0, c));
    expect(ritardoMassimo(riga, [idx(0, 0)])).toBe(ONDA_MASSIMA);
  });

  it('senza origine (partita ripresa, mossa senza pezzo) parte tutto insieme', () => {
    expect(ritardoOnda(idx(3, 3), [])).toBe(0);
    expect(ritardoOnda(idx(3, 3), undefined)).toBe(0);
  });
});
