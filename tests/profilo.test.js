import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createGame, placePiece, summarize } from '../src/core/engine.js';
import { allPlacements } from '../src/core/grid.js';
import { CHAIN_MAX } from '../src/config/rules.js';
import { CELLE, MAX_GRUPPI_PER_MOSSA } from '../src/core/distribuzioni.js';

const memoria = new Map();
let esplode = false;
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k) => { if (esplode) throw new DOMException('no'); return memoria.has(k) ? memoria.get(k) : null; },
    setItem: (k, v) => { if (esplode) throw new DOMException('quota'); memoria.set(k, String(v)); },
    removeItem: (k) => { if (esplode) throw new DOMException('no'); memoria.delete(k); },
    key: (i) => [...memoria.keys()][i] ?? null,
    get length() { return memoria.size; },
  },
});

const {
  profiloVuoto, aggrega, quoteCatena, caricaProfilo, registraPartita, azzeraProfilo,
  esportaProfilo, ANDAMENTO_MAX,
} = await import('../src/persistence/profilo.js');

/** Una partita vera giocata fino in fondo, per avere un riepilogo non inventato. */
function partitaVera(seed) {
  let s = createGame({ seed, now: 0 });
  let t = 0;
  while (s.status === 'playing' && s.stats.moves < 200) {
    const mosse = [];
    s.hand.forEach((p, i) => {
      if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => mosse.push([i, r, c]));
    });
    if (mosse.length === 0) break;
    t += 500;
    s = placePiece(s, ...mosse[0], t);
  }
  return summarize(s, t);
}

describe('aggrega, la funzione pura', () => {
  it('un profilo vuoto ha gli istogrammi della lunghezza giusta', () => {
    const p = profiloVuoto();
    expect(p.partite).toBe(0);
    expect(p.istogrammaCatena).toHaveLength(CHAIN_MAX + 1);
    expect(p.istogrammaIntreccio).toHaveLength(MAX_GRUPPI_PER_MOSSA + 1);
    expect(p.mappaAppoggi).toHaveLength(CELLE);
    expect(p.andamento).toEqual([]);
  });

  it('la prima partita entra tutta', () => {
    const r = partitaVera(11);
    const p = aggrega(profiloVuoto(), r);
    expect(p.partite).toBe(1);
    expect(p.mosse).toBe(r.moves);
    expect(p.righe).toBe(r.clearedRows);
    expect(p.quadranti).toBe(r.clearedQuadrants);
    expect(p.migliorPunteggio).toBe(r.score);
    expect(p.istogrammaCatena.reduce((s, n) => s + n, 0)).toBe(r.moves);
    expect(p.mappaAppoggi.reduce((s, n) => s + n, 0)).toBe(r.piecesPlaced);
  });

  it('non modifica il profilo che riceve', () => {
    const prima = profiloVuoto();
    aggrega(prima, partitaVera(3));
    expect(prima.partite, 'il profilo in ingresso e stato mutato').toBe(0);
    expect(prima.istogrammaCatena.every((n) => n === 0)).toBe(true);
  });

  it('cento partite: le somme restano coerenti e i massimi sono massimi', () => {
    let p = profiloVuoto();
    let mosseAttese = 0;
    let migliore = 0;
    for (let i = 0; i < 100; i += 1) {
      const r = partitaVera(1000 + i);
      mosseAttese += r.moves;
      migliore = Math.max(migliore, r.score);
      p = aggrega(p, r);
    }
    expect(p.partite).toBe(100);
    expect(p.mosse).toBe(mosseAttese);
    expect(p.migliorPunteggio).toBe(migliore);
    // Le invarianti della Fase 1 valgono anche sull'aggregato: sono la stessa promessa,
    // fatta su cento partite invece che su una.
    expect(p.istogrammaCatena.reduce((s, n) => s + n, 0)).toBe(p.mosse);
    expect(p.istogrammaIntreccio.reduce((s, n) => s + n, 0)).toBe(p.mosse);
    expect(p.mappaAppoggi.reduce((s, n) => s + n, 0)).toBe(p.pezzi);
  });

  it('l andamento si ferma alle ultime venti partite', () => {
    let p = profiloVuoto();
    for (let i = 0; i < 30; i += 1) p = aggrega(p, { score: i, moves: 1 });
    expect(p.andamento).toHaveLength(ANDAMENTO_MAX);
    expect(p.andamento[0].punteggio, 'le piu vecchie escono').toBe(10);
    expect(p.andamento.at(-1).punteggio).toBe(29);
    expect(p.partite, 'ma il conteggio delle partite non si ferma').toBe(30);
  });

  it('una partita da zero mosse conta come partita e non rompe niente', () => {
    const p = aggrega(profiloVuoto(), { score: 0, moves: 0, piecesPlaced: 0 });
    expect(p.partite).toBe(1);
    expect(p.mosse).toBe(0);
    expect(p.istogrammaCatena.reduce((s, n) => s + n, 0)).toBe(0);
  });

  it('un riepilogo con campi mancanti non produce NaN', () => {
    const p = aggrega(profiloVuoto(), {});
    for (const [chiave, valore] of Object.entries(p)) {
      if (typeof valore === 'number') {
        expect(Number.isFinite(valore), `${chiave} e ${valore}`).toBe(true);
      }
    }
    expect(aggrega(profiloVuoto(), undefined).partite).toBe(1);
  });

  it('un profilo di una versione vecchia, senza i campi nuovi, si completa da solo', () => {
    const vecchio = { partite: 5, mosse: 100, migliorPunteggio: 900 };
    const p = aggrega(vecchio, { score: 100, moves: 10 });
    expect(p.partite).toBe(6);
    expect(p.migliorPunteggio).toBe(900);
    expect(p.mappaAppoggi).toHaveLength(CELLE);
    expect(p.svuotamenti).toBe(0);
  });

  it('un istogramma della lunghezza sbagliata non contamina l aggregato', () => {
    const p = aggrega(profiloVuoto(), { score: 1, moves: 1, istogrammaCatena: [1, 2, 3] });
    expect(p.istogrammaCatena).toHaveLength(CHAIN_MAX + 1);
    expect(p.istogrammaCatena.every((n) => n === 0)).toBe(true);
  });
});

describe('quoteCatena', () => {
  it('un profilo senza mosse non ha una distribuzione, e non ne inventa una piatta', () => {
    expect(quoteCatena(profiloVuoto())).toBe(null);
  });

  it('le quote sommano a uno', () => {
    const p = aggrega(profiloVuoto(), partitaVera(7));
    const quote = quoteCatena(p);
    expect(quote).toHaveLength(CHAIN_MAX + 1);
    expect(quote.reduce((s, n) => s + n, 0)).toBeCloseTo(1, 10);
  });
});

describe('il profilo salvato', () => {
  beforeEach(() => { memoria.clear(); esplode = false; });

  it('si accumula fra una partita e l altra', () => {
    registraPartita(partitaVera(21));
    const dopo = registraPartita(partitaVera(22));
    expect(dopo.partite).toBe(2);
    expect(caricaProfilo().partite).toBe(2);
    expect(JSON.parse(memoria.get('plinto:profilo')).versione).toBe(1);
  });

  it('azzerare riporta a zero, e il profilo riparte senza errori', () => {
    registraPartita(partitaVera(31));
    azzeraProfilo();
    expect(caricaProfilo().partite).toBe(0);
    expect(caricaProfilo().mappaAppoggi.every((n) => n === 0)).toBe(true);
    expect(registraPartita(partitaVera(32)).partite, 'riparte da uno').toBe(1);
  });

  it('azzerare il profilo NON tocca record, statistiche, livelli e sfide', () => {
    memoria.set('plinto:records', JSON.stringify({ best: 4321, versione: 1 }));
    memoria.set('plinto:sfide', JSON.stringify({ versione: 2, giorni: { '2026-09-06': { best: 10 } } }));
    registraPartita(partitaVera(41));
    azzeraProfilo();
    expect(JSON.parse(memoria.get('plinto:records')).best).toBe(4321);
    expect(JSON.parse(memoria.get('plinto:sfide')).giorni['2026-09-06'].best).toBe(10);
  });

  it('esportare produce JSON valido e completo', () => {
    registraPartita(partitaVera(51));
    const testo = esportaProfilo();
    const letto = JSON.parse(testo);
    expect(letto.partite).toBe(1);
    expect(letto.mappaAppoggi).toHaveLength(CELLE);
  });

  it('con lo storage rotto non esce nessuna eccezione e il gioco continua', () => {
    esplode = true;
    expect(() => caricaProfilo()).not.toThrow();
    expect(caricaProfilo().partite).toBe(0);
    expect(() => registraPartita(partitaVera(61))).not.toThrow();
    expect(() => azzeraProfilo()).not.toThrow();
    expect(() => esportaProfilo()).not.toThrow();
  });
});

describe('il riferimento dello stratega', () => {
  it('esiste, ha la forma giusta e le quote sommano a uno', async () => {
    const { default: riferimento } = await import('../src/data/riferimento-catena.json');
    expect(riferimento.distribuzione).toHaveLength(CHAIN_MAX + 1);
    expect(riferimento.distribuzione.reduce((s, n) => s + n, 0)).toBeCloseTo(1, 2);
    expect(riferimento.profilo).toBe('stratega');
    expect(riferimento.partite).toBeGreaterThan(0);
    expect(riferimento.mosse).toBeGreaterThan(0);
    expect(riferimento.misuratoIl).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('e stato misurato con le regole di ADESSO', async () => {
    // Se questo test fallisce non c'e' un difetto nel gioco: vuol dire che una costante
    // di regolamento o un peso delle forme e' cambiato, e il riferimento e' rimasto
    // indietro. Il gioco se ne accorge da solo e nasconde il confronto -- meglio nessun
    // paragone che uno sbagliato -- ma la cosa giusta da fare e' rigenerarlo:
    //
    //     npm run catena
    //
    const { default: riferimento } = await import('../src/data/riferimento-catena.json');
    const { IMPRONTA_REGOLE } = await import('../src/core/impronta.js');
    expect(
      riferimento.regole,
      'riferimento non aggiornato: rigeneralo con `npm run catena`',
    ).toBe(IMPRONTA_REGOLE);
  });
});
