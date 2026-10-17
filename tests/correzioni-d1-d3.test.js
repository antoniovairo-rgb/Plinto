/**
 * I tre difetti del collaudo 1.21.8 (collaudo/RAPPORTO-1.21.8.md sul ramo collaudo-1.21.8).
 *
 *   D1  «Unisci» non abbassa il record della Sfida sotto il massimo dell'archivio;
 *   D2  «Sostituisci tutto» toglie i documenti locali che il file non contiene;
 *   D3  dati gia' guasti in localStorage non arrivano a Statistiche come NaN o «undefined».
 *
 * Ognuno ha il suo interruttore: spento, il suo blocco qui deve diventare rosso.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

const { applicaSalvataggio } = await import('../src/persistence/salvataggio.js');
const { loadRecords, loadStats } = await import('../src/persistence/records.js');
const { storicoSfide, caricaSfide } = await import('../src/persistence/sfide.js');

const scrivi = (chiave, valore) => memoria.set(`plinto:${chiave}`, JSON.stringify(valore));
const leggi = (chiave) => JSON.parse(memoria.get(`plinto:${chiave}`) ?? 'null');
const ARCHIVIO = {
  versione: 2,
  giorni: { '2026-10-10': { best: 900, partite: 2, regole: null }, '2026-10-11': { best: 300, partite: 1, regole: null } },
};

beforeEach(() => memoria.clear());

describe('D1: Unisci e il record della Sfida', () => {
  it('senza documento locale, il record resta al massimo dell archivio (900), non al file (100)', () => {
    scrivi('sfide', ARCHIVIO);
    expect(loadRecords('sfida').best).toBe(900);
    applicaSalvataggio({ dati: { 'records-sfida': { versione: 1, best: 100 } } });
    expect(leggi('records-sfida').best).toBe(900);
    expect(loadRecords('sfida').best).toBe(900);
  });

  it('un archivio importato piu alto del record rialza il record', () => {
    scrivi('records-sfida', { versione: 1, best: 200, bestChain: 3, bestMove: 0, bestGroupsInOneMove: 0 });
    applicaSalvataggio({ dati: { sfide: ARCHIVIO } });
    expect(loadRecords('sfida')).toMatchObject({ best: 900, bestChain: 3 });
  });

  it('un record del file piu alto dell archivio vince ancora', () => {
    scrivi('sfide', ARCHIVIO);
    applicaSalvataggio({ dati: { 'records-sfida': { versione: 1, best: 5000 } } });
    expect(loadRecords('sfida').best).toBe(5000);
  });
});

describe('D2: Sostituisci tutto', () => {
  it('toglie i documenti locali che il file non contiene, e lascia il resto', () => {
    scrivi('records-sfida', { versione: 1, best: 5000 });
    scrivi('sfide', ARCHIVIO);
    scrivi('statistiche', { versione: 1, partite: 40 });
    scrivi('attrezzi', { versione: 1, disponibili: 2, riscossi: 3 });
    scrivi('settings', { tema: 'scuro' });
    scrivi('partita', { grid: [1] });
    scrivi('origine', 'play');
    const esito = applicaSalvataggio({ dati: { records: { versione: 1, best: 50 }, quadri: { versione: 1, livelli: {} } } }, { sostituisci: true });
    expect(leggi('records').best).toBe(50);
    for (const via of ['records-sfida', 'sfide', 'statistiche', 'attrezzi']) expect(leggi(via)).toBeNull();
    // Non sono nel file, ma non sono roba del giocatore da ripristinare: restano.
    expect(leggi('settings')).toEqual({ tema: 'scuro' });
    expect(leggi('partita')).toEqual({ grid: [1] });
    expect(leggi('origine')).toBe('play');
    expect(esito.rimossi.sort()).toEqual(['attrezzi', 'records-sfida', 'sfide', 'statistiche']);
  });

  it('Unisci non toglie niente', () => {
    scrivi('statistiche', { versione: 1, partite: 40 });
    applicaSalvataggio({ dati: { records: { versione: 1, best: 50 } } });
    expect(leggi('statistiche').partite).toBe(40);
  });
});

describe('D3: dati gia guasti in localStorage', () => {
  it('record, statistiche e sfide si leggono senza valori che non sono numeri', () => {
    scrivi('records', { versione: 1, best: 'x', bestChain: 4, bestMove: -5, bestGroupsInOneMove: null });
    scrivi('statistiche', { versione: 1, partite: 'a', punteggioTotale: 1000, mosseTotali: NaN });
    scrivi('sfide', {
      versione: 2,
      giorni: {
        '2026-10-10': { best: '99', regole: null },
        '2026-10-11': { best: 120, partite: 2, regole: 'abc' },
      },
    });
    expect(loadRecords('libera')).toMatchObject({ best: 0, bestChain: 4, bestMove: 0, bestGroupsInOneMove: 0 });
    expect(loadStats()).toMatchObject({ partite: 0, punteggioTotale: 1000, mosseTotali: 0 });
    expect(storicoSfide()).toEqual([{ giorno: '2026-10-11', best: 120, partite: 2, regole: 'abc' }]);
    expect(Object.keys(caricaSfide())).toEqual(['2026-10-11']);
  });
});
