import { describe, it, expect } from 'vitest';
import { generateHand, effectiveWeight } from '../src/core/generator.js';
import { createGrid, gridFromString, fillRatio, hasAnyPlacement, countPlacements } from '../src/core/grid.js';
import { SHAPES, getShape } from '../src/core/shapes.js';
import {
  HAND_SIZE, MAX_SAME_SHAPE_IN_HAND, CROWDED_FILL_RATIO, SMALL_PIECE_MAX_CELLS,
  RISKY_PIECE_FILL, MIN_PLACEMENTS_EARLY, EARLY_MERCY_FILL,
} from '../src/config/rules.js';

describe('determinismo', () => {
  it('lo stesso seed produce la stessa mano', () => {
    const a = generateHand(createGrid(), 424242, []);
    const b = generateHand(createGrid(), 424242, []);
    expect(a.pieces.map((p) => p.shapeId)).toEqual(b.pieces.map((p) => p.shapeId));
    expect(a.rngState).toBe(b.rngState);
  });

  it('seed diversi producono mani diverse (su un campione ampio)', () => {
    const seen = new Set();
    for (let s = 0; s < 200; s += 1) {
      seen.add(generateHand(createGrid(), s * 7919, []).pieces.map((p) => p.shapeId).join('-'));
    }
    expect(seen.size).toBeGreaterThan(100);
  });
});

describe('forma della mano', () => {
  it('consegna sempre esattamente HAND_SIZE pezzi validi', () => {
    for (let s = 0; s < 300; s += 1) {
      const { pieces } = generateHand(createGrid(), s * 131, []);
      expect(pieces).toHaveLength(HAND_SIZE);
      pieces.forEach((p) => {
        expect(p.shape).toBeDefined();
        expect(p.color).toBeGreaterThanOrEqual(1);
        expect(p.uid).toMatch(/^pz\d+$/);
      });
    }
  });

  it('non ripete mai la stessa forma piu di MAX_SAME_SHAPE_IN_HAND volte', () => {
    for (let s = 0; s < 500; s += 1) {
      const { pieces } = generateHand(createGrid(), s * 31, []);
      const counts = {};
      pieces.forEach((p) => { counts[p.shapeId] = (counts[p.shapeId] ?? 0) + 1; });
      expect(Math.max(...Object.values(counts))).toBeLessThanOrEqual(MAX_SAME_SHAPE_IN_HAND);
    }
  });

  it('gli identificativi dei pezzi sono unici (chiavi di rendering stabili)', () => {
    const uids = new Set();
    for (let s = 0; s < 100; s += 1) {
      generateHand(createGrid(), s, []).pieces.forEach((p) => uids.add(p.uid));
    }
    expect(uids.size).toBe(300);
  });
});

describe('pressione da affollamento: aiuta, non ostacola', () => {
  it('su griglia vuota il peso e quello dichiarato nel catalogo', () => {
    const big = getShape('b33');
    expect(effectiveWeight(big, 0, [])).toBe(big.weight);
  });

  it('a griglia piena le forme grandi diventano molto meno probabili', () => {
    const big = getShape('b33');
    expect(effectiveWeight(big, 0.9, [])).toBeLessThan(big.weight * 0.3);
  });

  it('le forme piccole non vengono mai penalizzate', () => {
    const small = getShape('p1');
    expect(effectiveWeight(small, 0.95, [])).toBe(small.weight);
  });

  it('la memoria abbassa il peso delle forme appena uscite', () => {
    const s = getShape('h3');
    expect(effectiveWeight(s, 0, ['h3'])).toBeLessThan(effectiveWeight(s, 0, []));
  });
});

describe('reti di sicurezza dichiarate', () => {
  const quasiPiena = gridFromString(`
    ########.
    ########.
    ########.
    ########.
    ########.
    ########.
    ########.
    ........#
    .........
  `);

  it('con la griglia molto piena garantisce almeno un pezzo piccolo', () => {
    expect(fillRatio(quasiPiena)).toBeGreaterThanOrEqual(CROWDED_FILL_RATIO);
    for (let s = 0; s < 200; s += 1) {
      const { pieces } = generateHand(quasiPiena, s * 977, []);
      expect(pieces.some((p) => p.shape.size <= SMALL_PIECE_MAX_CELLS)).toBe(true);
    }
  });

  it('sotto meta griglia non consegna mai una mano gia morta', () => {
    const sparsa = gridFromString(`
      #.#.#.#.#
      .........
      #.#.#.#.#
      .........
      #.#.#.#.#
      .........
      .........
      .........
      .........
    `);
    expect(fillRatio(sparsa)).toBeLessThan(EARLY_MERCY_FILL);
    for (let s = 0; s < 200; s += 1) {
      const { pieces } = generateHand(sparsa, s * 613, []);
      expect(pieces.some((p) => hasAnyPlacement(sparsa, p.shape))).toBe(true);
    }
  });

  it('a inizio partita nessun pezzo ha pochissime case possibili', () => {
    const inizio = gridFromString(`
      ###......
      ###......
      ###......
      .........
      .........
      .........
      .........
      .........
      .........
    `);
    expect(fillRatio(inizio)).toBeLessThan(RISKY_PIECE_FILL);
    for (let s = 0; s < 150; s += 1) {
      const { pieces } = generateHand(inizio, s * 271, []);
      pieces.forEach((p) => {
        expect(countPlacements(inizio, p.shape, MIN_PLACEMENTS_EARLY))
          .toBeGreaterThanOrEqual(MIN_PLACEMENTS_EARLY);
      });
    }
  });

  it('sopra la soglia il gioco NON interviene piu: il game over deve restare possibile', () => {
    // Griglia oltre meta con soli buchi isolati: nessuna rete di sicurezza puo salvarla,
    // e infatti la mano puo essere completamente impiazzabile. E la difficolta legittima.
    const frammentata = gridFromString(`
      #.#.#.#.#
      #########
      #.#.#.#.#
      #########
      #.#.#.#.#
      #########
      #.#.#.#.#
      #########
      #.#.#.#.#
    `);
    expect(fillRatio(frammentata)).toBeGreaterThan(EARLY_MERCY_FILL);
    let mortali = 0;
    for (let s = 0; s < 200; s += 1) {
      const { pieces } = generateHand(frammentata, s * 149, []);
      if (!pieces.some((p) => hasAnyPlacement(frammentata, p.shape))) mortali += 1;
    }
    expect(mortali).toBeGreaterThan(0);
  });
});

describe('catalogo delle forme', () => {
  it('ogni forma ha id univoco, peso positivo e celle coerenti', () => {
    const ids = new Set();
    SHAPES.forEach((s) => {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      expect(s.weight).toBeGreaterThan(0);
      expect(s.size).toBe(s.cells.length);
      expect(s.width).toBeLessThanOrEqual(9);
      expect(s.height).toBeLessThanOrEqual(9);
      s.cells.forEach(([r, c]) => {
        expect(r).toBeGreaterThanOrEqual(0);
        expect(c).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('ogni forma tocca il bordo alto e il bordo sinistro del proprio riquadro', () => {
    // Senza questa normalizzazione lo snap del drag&drop sarebbe disallineato.
    SHAPES.forEach((s) => {
      expect(Math.min(...s.cells.map(([r]) => r))).toBe(0);
      expect(Math.min(...s.cells.map(([, c]) => c))).toBe(0);
    });
  });
});
