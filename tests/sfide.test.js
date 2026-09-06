import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGame } from '../src/core/engine.js';

// localStorage minimale: i test girano in Node, non in un browser.
const memoria = new Map();
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
    setItem: (k, v) => memoria.set(k, String(v)),
    removeItem: (k) => memoria.delete(k),
    key: (i) => [...memoria.keys()][i] ?? null,
    get length() { return memoria.size; },
  },
});

const { giornoDiOggi, sfidaDelGiorno, registraSfida, storicoSfide } = await import('../src/persistence/sfide.js');

describe('Sfida del Giorno', () => {
  beforeEach(() => memoria.clear());

  it('la data locale ha il formato atteso e non usa il fuso UTC', () => {
    expect(giornoDiOggi(new Date(2026, 8, 6))).toBe('2026-09-06');
    expect(giornoDiOggi(new Date(2026, 0, 1))).toBe('2026-01-01');
    // Alle 23:30 del 6, in un fuso a est di Greenwich, UTC sarebbe gia' il 7:
    // il "giorno" deve restare quello del giocatore.
    expect(giornoDiOggi(new Date(2026, 8, 6, 23, 30))).toBe('2026-09-06');
  });

  it('a parita di giorno la partita e identica per tutti', () => {
    const a = createGame({ seed: '2026-09-06' });
    const b = createGame({ seed: '2026-09-06' });
    const c = createGame({ seed: '2026-09-07' });
    expect(a.hand.map((p) => p.shapeId)).toEqual(b.hand.map((p) => p.shapeId));
    expect(a.seed).toBe(b.seed);
    expect(a.seed).not.toBe(c.seed);
  });

  it('conserva solo il punteggio migliore della giornata', () => {
    registraSfida(500, '2026-09-06');
    registraSfida(300, '2026-09-06');
    const esito = registraSfida(900, '2026-09-06');
    expect(esito.best).toBe(900);
    expect(esito.partite).toBe(3);
    expect(esito.nuovoRecordDiGiornata).toBe(true);
    expect(registraSfida(100, '2026-09-06').nuovoRecordDiGiornata).toBe(false);
    expect(sfidaDelGiorno('2026-09-06').best).toBe(900);
  });

  it('un giorno mai giocato non esiste, non vale zero per errore', () => {
    expect(sfidaDelGiorno('2020-01-01')).toEqual({ best: 0, partite: 0 });
    expect(storicoSfide()).toEqual([]);
  });

  it('lo storico e ordinato dal giorno piu recente', () => {
    registraSfida(10, '2026-09-04');
    registraSfida(30, '2026-09-06');
    registraSfida(20, '2026-09-05');
    expect(storicoSfide().map((s) => s.giorno)).toEqual(['2026-09-06', '2026-09-05', '2026-09-04']);
  });

  it('lo storico non cresce all infinito', () => {
    for (let g = 1; g <= 80; g += 1) {
      registraSfida(g, `2026-01-${String(g).padStart(2, '0')}`);
    }
    expect(Object.keys(JSON.parse(memoria.get('plinto:sfide'))).length).toBeLessThanOrEqual(60);
  });
});
