import { describe, it, expect } from 'vitest';
import {
  createGrid, idx, quadrantOf, quadrantCells, canPlace, placeShape, shapeCellsAt,
  findCompletedGroups, clearGroups, hasAnyPlacement, countPlacements, allPlacements,
  fillRatio, isEmpty, gridFromString, gridToString, CELL_COUNT,
} from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';

const p1 = getShape('p1');
const h3 = getShape('h3');
const b33 = getShape('b33');
const v5 = getShape('v5');

describe('geometria della griglia', () => {
  it('la griglia nuova e 81 celle vuote', () => {
    const g = createGrid();
    expect(g.length).toBe(81);
    expect(CELL_COUNT).toBe(81);
    expect(isEmpty(g)).toBe(true);
    expect(fillRatio(g)).toBe(0);
  });

  it('assegna ogni cella al quadrante 3x3 giusto', () => {
    expect(quadrantOf(0, 0)).toBe(0);
    expect(quadrantOf(2, 2)).toBe(0);
    expect(quadrantOf(0, 3)).toBe(1);
    expect(quadrantOf(4, 4)).toBe(4);
    expect(quadrantOf(8, 8)).toBe(8);
  });

  it('ogni quadrante contiene esattamente 9 celle distinte', () => {
    const seen = new Set();
    for (let q = 0; q < 9; q += 1) {
      const cells = quadrantCells(q);
      expect(cells.length).toBe(9);
      cells.forEach((c) => seen.add(c));
    }
    expect(seen.size).toBe(81);
  });
});

describe('posizionamento', () => {
  it('accetta una posizione libera', () => {
    expect(canPlace(createGrid(), h3, 4, 3)).toBe(true);
  });

  it('rifiuta una forma che esce dal bordo destro', () => {
    expect(canPlace(createGrid(), h3, 0, 7)).toBe(false);
    expect(shapeCellsAt(h3, 0, 7)).toBeNull();
  });

  it('rifiuta una forma che esce dal bordo inferiore', () => {
    expect(canPlace(createGrid(), v5, 5, 0)).toBe(false);
  });

  it('rifiuta coordinate negative', () => {
    expect(canPlace(createGrid(), p1, -1, 0)).toBe(false);
    expect(canPlace(createGrid(), p1, 0, -1)).toBe(false);
  });

  it('rifiuta la sovrapposizione anche su una sola cella', () => {
    const g = createGrid();
    g[idx(0, 2)] = 3;
    expect(canPlace(g, h3, 0, 0)).toBe(false);
    expect(canPlace(g, h3, 0, 3)).toBe(true);
  });

  it('placeShape non muta la griglia originale', () => {
    const g = createGrid();
    const { grid: after, cells } = placeShape(g, h3, 0, 0, 2);
    expect(isEmpty(g)).toBe(true);
    expect(cells.length).toBe(3);
    expect(after[idx(0, 0)]).toBe(2);
  });

  it('placeShape solleva un errore su cella occupata', () => {
    const g = createGrid();
    g[idx(0, 0)] = 1;
    expect(() => placeShape(g, p1, 0, 0, 1)).toThrow();
  });

  it('conta le posizioni possibili e si ferma al limite richiesto', () => {
    const g = createGrid();
    expect(countPlacements(g, p1)).toBe(81);
    expect(countPlacements(g, b33)).toBe(49);
    expect(countPlacements(g, p1, 5)).toBe(5);
    expect(allPlacements(g, b33).length).toBe(49);
  });

  it('riconosce quando una forma non entra piu da nessuna parte', () => {
    const g = gridFromString(`
      .#.#.#.#.
      #.#.#.#.#
      .#.#.#.#.
      #.#.#.#.#
      .#.#.#.#.
      #.#.#.#.#
      .#.#.#.#.
      #.#.#.#.#
      .#.#.#.#.
    `);
    expect(hasAnyPlacement(g, p1)).toBe(true);
    expect(hasAnyPlacement(g, h3)).toBe(false);
    expect(hasAnyPlacement(g, b33)).toBe(false);
  });
});

describe('eliminazione di riga, colonna e quadrante', () => {
  it('trova una riga completa', () => {
    const g = gridFromString(`
      #########
      .........
      .........
      .........
      .........
      .........
      .........
      .........
      .........
    `);
    const groups = findCompletedGroups(g);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ type: 'row', index: 0 });
  });

  it('trova una colonna completa', () => {
    const g = createGrid();
    for (let r = 0; r < 9; r += 1) g[idx(r, 4)] = 1;
    const groups = findCompletedGroups(g);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ type: 'col', index: 4 });
  });

  it('trova un quadrante completo — la regola che distingue QUADRA', () => {
    const g = gridFromString(`
      .........
      .........
      .........
      ...###...
      ...###...
      ...###...
      .........
      .........
      .........
    `);
    const groups = findCompletedGroups(g);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ type: 'quadrant', index: 4 });
  });

  it('riconosce riga, colonna e quadrante insieme nella stessa mossa', () => {
    const g = createGrid();
    for (let c = 0; c < 9; c += 1) g[idx(0, c)] = 1;
    for (let r = 0; r < 9; r += 1) g[idx(r, 0)] = 1;
    for (let r = 0; r < 3; r += 1) for (let c = 0; c < 3; c += 1) g[idx(r, c)] = 1;
    const groups = findCompletedGroups(g);
    expect(groups.map((x) => x.type).sort()).toEqual(['col', 'quadrant', 'row']);
  });

  it('svuota una cella condivisa da piu gruppi una volta sola', () => {
    const g = createGrid();
    for (let c = 0; c < 9; c += 1) g[idx(0, c)] = 1;
    for (let r = 0; r < 9; r += 1) g[idx(r, 0)] = 1;
    const groups = findCompletedGroups(g);
    const { grid: after, clearedCells } = clearGroups(g, groups);
    // 9 + 9 celle meno l'incrocio contato una volta sola.
    expect(clearedCells.length).toBe(17);
    expect(new Set(clearedCells).size).toBe(17);
    expect(isEmpty(after)).toBe(true);
  });

  it('non elimina nulla se nessun gruppo e completo', () => {
    const g = createGrid();
    for (let c = 0; c < 8; c += 1) g[idx(0, c)] = 1;
    expect(findCompletedGroups(g)).toHaveLength(0);
    const { clearedCells } = clearGroups(g, []);
    expect(clearedCells).toHaveLength(0);
  });

  it('gridFromString e gridToString sono inversi', () => {
    const text = '#........\n.#.......\n..#......\n...#.....\n....#....\n.....#...\n......#..\n.......#.\n........#';
    expect(gridToString(gridFromString(text))).toBe(text);
  });
});
