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

const {
  sfidaDelGiorno, registraSfida, storicoSfide, caricaSfide, regoleCoincidono, giorniGiocati,
} = await import('../src/persistence/sfide.js');
const { giornoDiOggi } = await import('../src/core/sfida.js');
const { IMPRONTA_REGOLE } = await import('../src/core/impronta.js');

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
    expect(sfidaDelGiorno('2020-01-01')).toEqual({ best: 0, partite: 0, regole: null });
    expect(storicoSfide()).toEqual([]);
  });

  it('lo storico e ordinato dal giorno piu recente', () => {
    registraSfida(10, '2026-09-04');
    registraSfida(30, '2026-09-06');
    registraSfida(20, '2026-09-05');
    expect(storicoSfide().map((s) => s.giorno)).toEqual(['2026-09-06', '2026-09-05', '2026-09-04']);
  });

  it('NIENTE viene potato: un archivio che dimentica non e un archivio', () => {
    // Fino alla 0.5.2 lo storico veniva tagliato ai 60 giorni piu' recenti. Con
    // l'archivio quella potatura cancellava proprio i risultati che l'archivio esiste
    // per mostrare, quindi e' stata tolta.
    for (let g = 1; g <= 80; g += 1) {
      registraSfida(g, `2026-01-${String(g).padStart(2, '0')}`.slice(0, 10));
    }
    expect(giorniGiocati()).toBe(80);
    expect(sfidaDelGiorno('2026-01-01').best, 'il giorno piu vecchio deve esserci ancora').toBe(1);
  });

  it('un anno di gioco quotidiano resta nelle decine di kilobyte', () => {
    // La frase "un anno sta in poche decine di kB" e' facile da scrivere e facile da
    // sbagliare: qui viene misurata invece che dichiarata.
    const inizio = new Date(2026, 0, 1);
    for (let g = 0; g < 365; g += 1) {
      const d = new Date(inizio.getFullYear(), inizio.getMonth(), inizio.getDate() + g, 12);
      registraSfida(100000 + g, giornoDiOggi(d));
    }
    expect(giorniGiocati()).toBe(365);
    const byte = memoria.get('plinto:sfide').length;
    expect(byte, `365 giorni occupano ${byte} byte`).toBeLessThan(50 * 1024);
  });
});

describe('impronta delle regole', () => {
  beforeEach(() => memoria.clear());

  it('il punteggio salvato porta le regole con cui e stato ottenuto', () => {
    registraSfida(500, '2026-09-06');
    expect(caricaSfide()['2026-09-06'].regole).toBe(IMPRONTA_REGOLE);
    expect(regoleCoincidono(sfidaDelGiorno('2026-09-06'))).toBe(true);
  });

  it('un risultato ottenuto con altre regole viene riconosciuto come diverso', () => {
    registraSfida(500, '2026-09-06');
    const tutte = caricaSfide();
    tutte['2026-09-06'].regole = 'deadbeef';
    expect(regoleCoincidono(tutte['2026-09-06'])).toBe(false);
  });

  it('"non lo so" e "sono diverse" restano due cose diverse', () => {
    // Un risultato salvato prima che l'impronta esistesse non se la puo' inventare.
    // Se "sconosciuta" valesse "diversa", ogni risultato vecchio di chi gioca da mesi
    // mostrerebbe un avviso -- ed e' il modo piu' rapido di rendere un avviso invisibile.
    expect(regoleCoincidono({ best: 10, partite: 1, regole: null })).toBe(null);
    expect(regoleCoincidono(undefined)).toBe(null);
  });

  it('migliorare il punteggio aggiorna l impronta, non migliorarlo la lascia stare', () => {
    registraSfida(500, '2026-09-06');
    const tutte = caricaSfide();
    tutte['2026-09-06'].regole = 'vecchie00';
    scriviGiorni(tutte);
    registraSfida(100, '2026-09-06');   // non migliora: l'impronta del record resta quella
    expect(caricaSfide()['2026-09-06'].regole).toBe('vecchie00');
    registraSfida(900, '2026-09-06');   // migliora: adesso il record e' delle regole di ora
    expect(caricaSfide()['2026-09-06'].regole).toBe(IMPRONTA_REGOLE);
  });
});

/** Scrive direttamente i giorni, per costruire situazioni che il gioco non produce. */
function scriviGiorni(giorni) {
  memoria.set('plinto:sfide', JSON.stringify({ versione: 2, giorni }));
}
