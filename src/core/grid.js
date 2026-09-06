/**
 * Griglia di PLINTO: funzioni pure, zero DOM, zero React.
 *
 * Rappresentazione: Uint8Array di GRID_SIZE*GRID_SIZE celle.
 *   0        = cella vuota
 *   1..N     = cella piena, il valore e' la famiglia cromatica (solo estetica)
 * L'array piatto rende banali le copie e velocissime le simulazioni di massa.
 */

import { GRID_SIZE, PLINTONT_SIZE } from '../config/rules.js';

export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const PLINTONTS_PER_SIDE = GRID_SIZE / PLINTONT_SIZE;
export const PLINTONT_COUNT = PLINTONTS_PER_SIDE * PLINTONTS_PER_SIDE;

if (!Number.isInteger(PLINTONTS_PER_SIDE)) {
  throw new Error('GRID_SIZE deve essere divisibile per PLINTONT_SIZE');
}

/** @returns {Uint8Array} griglia vuota */
export function createGrid() {
  return new Uint8Array(CELL_COUNT);
}

/** Indice piatto della cella (row, col). */
export function idx(row, col) {
  return row * GRID_SIZE + col;
}

/** Riga della cella con indice piatto i. */
export function rowOf(i) {
  return Math.floor(i / GRID_SIZE);
}

/** Colonna della cella con indice piatto i. */
export function colOf(i) {
  return i % GRID_SIZE;
}

/** Indice del quadrante 3x3 che contiene (row, col). */
export function quadrantOf(row, col) {
  return (
    Math.floor(row / PLINTONT_SIZE) * PLINTONTS_PER_SIDE +
    Math.floor(col / PLINTONT_SIZE)
  );
}

/** Indici piatti delle celle di un quadrante. */
export function quadrantCells(quadrant) {
  const baseRow = Math.floor(quadrant / PLINTONTS_PER_SIDE) * PLINTONT_SIZE;
  const baseCol = (quadrant % PLINTONTS_PER_SIDE) * PLINTONT_SIZE;
  const cells = [];
  for (let r = 0; r < PLINTONT_SIZE; r += 1) {
    for (let c = 0; c < PLINTONT_SIZE; c += 1) {
      cells.push(idx(baseRow + r, baseCol + c));
    }
  }
  return cells;
}

/** Indici piatti di una riga. */
export function rowCells(row) {
  const cells = [];
  for (let c = 0; c < GRID_SIZE; c += 1) cells.push(idx(row, c));
  return cells;
}

/** Indici piatti di una colonna. */
export function colCells(col) {
  const cells = [];
  for (let r = 0; r < GRID_SIZE; r += 1) cells.push(idx(r, col));
  return cells;
}

/**
 * Le celle assolute occupate da una forma se la sua origine (angolo alto-sinistra
 * del suo riquadro) viene appoggiata in (row, col).
 * @returns {number[]|null} null se la forma esce dalla griglia
 */
export function shapeCellsAt(shape, row, col) {
  const out = new Array(shape.cells.length);
  for (let i = 0; i < shape.cells.length; i += 1) {
    const r = row + shape.cells[i][0];
    const c = col + shape.cells[i][1];
    if (r < 0 || c < 0 || r >= GRID_SIZE || c >= GRID_SIZE) return null;
    out[i] = idx(r, c);
  }
  return out;
}

/** La forma sta nella griglia e non si sovrappone a celle piene? */
export function canPlace(grid, shape, row, col) {
  const cells = shapeCellsAt(shape, row, col);
  if (cells === null) return false;
  for (let i = 0; i < cells.length; i += 1) {
    if (grid[cells[i]] !== 0) return false;
  }
  return true;
}

/** Esiste almeno una posizione valida per questa forma? */
export function hasAnyPlacement(grid, shape) {
  const maxRow = GRID_SIZE - shape.height;
  const maxCol = GRID_SIZE - shape.width;
  for (let r = 0; r <= maxRow; r += 1) {
    for (let c = 0; c <= maxCol; c += 1) {
      if (canPlace(grid, shape, r, c)) return true;
    }
  }
  return false;
}

/**
 * Quante posizioni valide ha una forma. Si ferma appena raggiunge `limit`:
 * al generatore serve sapere "almeno N", non il totale esatto.
 */
export function countPlacements(grid, shape, limit = Infinity) {
  let n = 0;
  const maxRow = GRID_SIZE - shape.height;
  const maxCol = GRID_SIZE - shape.width;
  for (let r = 0; r <= maxRow; r += 1) {
    for (let c = 0; c <= maxCol; c += 1) {
      if (canPlace(grid, shape, r, c)) {
        n += 1;
        if (n >= limit) return n;
      }
    }
  }
  return n;
}

/** Tutte le posizioni valide per una forma. Usato da IA di simulazione e suggerimenti. */
export function allPlacements(grid, shape) {
  const out = [];
  const maxRow = GRID_SIZE - shape.height;
  const maxCol = GRID_SIZE - shape.width;
  for (let r = 0; r <= maxRow; r += 1) {
    for (let c = 0; c <= maxCol; c += 1) {
      if (canPlace(grid, shape, r, c)) out.push([r, c]);
    }
  }
  return out;
}

/**
 * Copia la griglia scrivendoci la forma. Non elimina nulla: l'eliminazione e' un passo
 * separato (findCompletedGroups + clearGroups) cosi' il layer di game feel puo'
 * animare "prima appoggia, poi esplode".
 * @returns {{grid: Uint8Array, cells: number[]}}
 */
export function placeShape(grid, shape, row, col, color) {
  const cells = shapeCellsAt(shape, row, col);
  if (cells === null) throw new Error('Posizionamento fuori griglia');
  const next = grid.slice();
  for (let i = 0; i < cells.length; i += 1) {
    if (next[cells[i]] !== 0) throw new Error('Posizionamento su cella occupata');
    next[cells[i]] = color;
  }
  return { grid: next, cells };
}

/**
 * Trova righe, colonne e quadranti completi.
 * Tutti e tre i tipi valgono contemporaneamente: una singola mossa puo' chiudere
 * una riga, una colonna e un quadrante insieme.
 * @returns {{type: 'row'|'col'|'quadrant', index: number, cells: number[]}[]}
 */
export function findCompletedGroups(grid) {
  const groups = [];

  for (let r = 0; r < GRID_SIZE; r += 1) {
    let full = true;
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (grid[idx(r, c)] === 0) { full = false; break; }
    }
    if (full) groups.push({ type: 'row', index: r, cells: rowCells(r) });
  }

  for (let c = 0; c < GRID_SIZE; c += 1) {
    let full = true;
    for (let r = 0; r < GRID_SIZE; r += 1) {
      if (grid[idx(r, c)] === 0) { full = false; break; }
    }
    if (full) groups.push({ type: 'col', index: c, cells: colCells(c) });
  }

  for (let q = 0; q < PLINTONT_COUNT; q += 1) {
    const cells = quadrantCells(q);
    let full = true;
    for (let i = 0; i < cells.length; i += 1) {
      if (grid[cells[i]] === 0) { full = false; break; }
    }
    if (full) groups.push({ type: 'quadrant', index: q, cells });
  }

  return groups;
}

/**
 * Svuota le celle dei gruppi indicati.
 * Una cella che appartiene a piu' gruppi (l'incrocio riga/colonna/quadrante) viene
 * svuotata una volta sola e conteggiata una volta sola: il punteggio premia i GRUPPI,
 * non le celle, quindi non serve nessun accorgimento anti-doppio-conteggio nello scoring.
 * @returns {{grid: Uint8Array, clearedCells: number[]}}
 */
export function clearGroups(grid, groups) {
  if (groups.length === 0) return { grid, clearedCells: [] };
  const next = grid.slice();
  const seen = new Set();
  for (const group of groups) {
    for (const cell of group.cells) {
      if (!seen.has(cell)) {
        seen.add(cell);
        next[cell] = 0;
      }
    }
  }
  return { grid: next, clearedCells: [...seen] };
}

/** Numero di celle piene. */
export function filledCount(grid) {
  let n = 0;
  for (let i = 0; i < grid.length; i += 1) if (grid[i] !== 0) n += 1;
  return n;
}

/** Rapporto di riempimento in [0,1]. */
export function fillRatio(grid) {
  return filledCount(grid) / CELL_COUNT;
}

/** La griglia e' completamente vuota? */
export function isEmpty(grid) {
  for (let i = 0; i < grid.length; i += 1) if (grid[i] !== 0) return false;
  return true;
}

/** Rappresentazione testuale, usata dai test e dal debug. */
export function gridToString(grid) {
  const lines = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    let line = '';
    for (let c = 0; c < GRID_SIZE; c += 1) line += grid[idx(r, c)] === 0 ? '.' : '#';
    lines.push(line);
  }
  return lines.join('\n');
}

/** Inverso di gridToString: comodo per costruire scenari nei test. */
export function gridFromString(text, color = 1) {
  const lines = text.trim().split('\n').map((l) => l.trim());
  const grid = createGrid();
  lines.forEach((line, r) => {
    for (let c = 0; c < line.length; c += 1) {
      if (line[c] !== '.' && line[c] !== ' ') grid[idx(r, c)] = color;
    }
  });
  return grid;
}
