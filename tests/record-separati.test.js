import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Il record della Partita libera e quello della Sfida del giorno sono due (collaudo
 * 1.21.6, B7). Prima erano uno: chi aveva giocato una sola Sfida leggeva in home
 * «Partita libera / Record 395». Decisione del PO in docs/DECISIONI.md: separare, e il
 * record che c'era resta alla Partita libera. Con RECORD_SEPARATI spento questi test
 * devono cadere: e' la prova che controllano davvero la separazione.
 */

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

const { loadRecords, loadStats, recordGame } = await import('../src/persistence/records.js');
const { clearAll } = await import('../src/persistence/storage.js');
const {
  componiSalvataggio, serializza, leggiSalvataggio, applicaSalvataggio, impronta,
} = await import('../src/persistence/salvataggio.js');

const scrivi = (chiave, valore) => memoria.set(`plinto:${chiave}`, JSON.stringify(valore));
const leggi = (chiave) => JSON.parse(memoria.get(`plinto:${chiave}`) ?? 'null');
const partita = (score, extra = {}) => ({
  score, bestChain: 2, bestMovePoints: 40, bestIntreccio: 1,
  moves: 10, clearedGroups: 3, boardClears: 0, durationMs: 60000, ...extra,
});

beforeEach(() => memoria.clear());

describe('record separati (B7)', () => {
  it('una Sfida giocata non da\' un record alla Partita libera', () => {
    recordGame(partita(395), 'sfida');
    expect(loadRecords('libera').best).toBe(0);
    expect(loadRecords('sfida').best).toBe(395);
  });

  it('una Partita libera non tocca il record della Sfida', () => {
    recordGame(partita(120), 'sfida');
    recordGame(partita(900), 'libera');
    expect(loadRecords('sfida').best).toBe(120);
    expect(loadRecords('libera').best).toBe(900);
  });

  it('il record che c\'era resta alla Partita libera, intatto', () => {
    const vecchio = { versione: 1, best: 4321, bestChain: 7, bestMove: 250, bestGroupsInOneMove: 3 };
    scrivi('records', vecchio);
    recordGame(partita(5000, { bestChain: 9 }), 'sfida');
    expect(leggi('records')).toEqual(vecchio);
    expect(loadRecords('libera').best).toBe(4321);
    expect(loadRecords('sfida').best).toBe(5000);
  });

  it('la Sfida parte dal punteggio migliore del suo archivio, senza scrivere niente', () => {
    scrivi('sfide', {
      versione: 2,
      giorni: {
        '2026-10-10': { best: 300, partite: 2, regole: null },
        '2026-10-12': { best: 812, partite: 1, regole: null },
      },
    });
    expect(loadRecords('sfida')).toMatchObject({ best: 812, bestChain: 0, bestMove: 0 });
    expect(memoria.has('plinto:records-sfida')).toBe(false);
    // Un punteggio sotto l'archivio non diventa record.
    expect(recordGame(partita(500), 'sfida').nuoviRecord).not.toContain('punteggio');
    expect(loadRecords('sfida').best).toBe(812);
  });

  it('le statistiche restano una sola e contano tutte e due le modalita\'', () => {
    recordGame(partita(100), 'libera');
    recordGame(partita(200), 'sfida');
    expect(loadStats()).toMatchObject({ partite: 2, punteggioTotale: 300 });
  });

  it('il salvataggio porta via e rimette anche il record della Sfida', () => {
    recordGame(partita(700), 'sfida');
    recordGame(partita(100), 'libera');
    const testo = serializza(componiSalvataggio({ versioneGioco: 'prova' }));
    memoria.clear();
    const letto = leggiSalvataggio(testo);
    expect(letto.ok).toBe(true);
    applicaSalvataggio(letto.salvataggio, { sostituisci: false });
    expect(loadRecords('sfida').best).toBe(700);
    expect(loadRecords('libera').best).toBe(100);
  });

  it('un record della Sfida rovinato a mano si ripulisce come gli altri', () => {
    const dati = { 'records-sfida': { versione: 1, best: 'abc', bestChain: 4 } };
    applicaSalvataggio({ gioco: 'plinto', formato: 1, impronta: impronta(dati), dati });
    expect(leggi('records-sfida')).toEqual({ versione: 1, bestChain: 4 });
  });

  it('«Azzera i miei dati» toglie anche il record della Sfida', () => {
    recordGame(partita(700), 'sfida');
    clearAll();
    expect(memoria.has('plinto:records-sfida')).toBe(false);
    expect(loadRecords('sfida').best).toBe(0);
  });
});
