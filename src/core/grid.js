/**
 * Griglia di PLINTO: funzioni pure, zero DOM, zero React.
 *
 * Rappresentazione: Uint8Array di GRID_SIZE*GRID_SIZE celle.
 *   0        = cella vuota
 *   1..6     = cella piena, il valore e' la famiglia cromatica (solo estetica)
 *   11..16   = come sopra, ma la cella e' una BOMBA (colore + VALORE_BOMBA)
 *   30       = un MASSO (vedi MASSO qui sotto)
 *   41..46   = un MATTONE RINFORZATO intatto, del colore 1..6 (vedi MATTONE qui sotto)
 *   51..56   = lo stesso mattone, incrinato
 * Un array solo invece di due: copie, salvataggi e simulazioni restano quelli di prima.
 */

import { GRID_SIZE, QUADRANT_SIZE, VALORE_BOMBA, BOMBA_RAGGIO } from '../config/rules.js';

export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const QUADRANTS_PER_SIDE = GRID_SIZE / QUADRANT_SIZE;
export const QUADRANT_COUNT = QUADRANTS_PER_SIDE * QUADRANTS_PER_SIDE;

/**
 * IL MASSO, la meccanica della Torre: «un masso conta come pieno, ma non sparisce mai».
 *
 * Conta come pieno per chiudere una riga, una colonna o un quadrante, e non ci si puo'
 * appoggiare sopra: per tutto questo basta che il suo valore sia diverso da zero, e il
 * resto del motore lo tratta gia' cosi'. Le eccezioni sono quattro, decise il 3 ottobre
 * 2026 e scritte qui una per una, perche' ognuna e' una regola che il giocatore legge:
 *   1. quando il suo gruppo si chiude, il masso RESTA (svuotaCelle lo salta);
 *   2. una bomba non lo distrugge (detonaBombe lo salta);
 *   3. il piccone non lo toglie (scavaCella in engine.js);
 *   4. non ha colore: non conta per la Tinta, e una griglia con solo massi conta come
 *      svuotata (isEmpty lo ignora).
 *
 * STA QUI E NON IN config/rules.js, e non per caso: l'impronta delle regole e' calcolata
 * da ogni costante numerica di quel file, e cambiarla marcherebbe come «ottenuti con una
 * versione precedente» tutti i record delle sfide passate -- per una meccanica che nelle
 * sfide e nella partita libera non compare mai. I massi esistono solo nelle griglie di
 * partenza dei livelli che li mettono (lettera `M` in gridFromString).
 */
export const MASSO = 30;

/** La cella e' un masso? */
export function eMasso(valore) {
  return valore === MASSO;
}

/**
 * IL MATTONE RINFORZATO, la meccanica dell'Arena: «va eliminato due volte».
 *
 * Conta come pieno, come ogni casella diversa da zero. La prima volta che viene eliminato
 * -- il suo gruppo si chiude, una bomba lo raggiunge, il piccone lo colpisce -- si
 * INCRINA e resta al suo posto; la seconda volta sparisce come un blocco qualunque.
 * Casi decisi il 4 ottobre 2026 (docs/OPERA-ARENA.md):
 *   1. una mossa fa al massimo UN passo per mattone, anche se il mattone sta all'incrocio
 *      di due gruppi chiusi insieme (un Intreccio) o anche dentro un'esplosione: le celle
 *      da eliminare sono un insieme, e ogni cella ci compare una volta sola;
 *   2. un'esplosione conta come un'eliminazione;
 *   3. il piccone conta come un'eliminazione (scavaCella in engine.js);
 *   4. il mattone ha un colore e conta per la Tinta, come gli altri blocchi.
 *
 * Il colore e' l'unita' del valore, come per le bombe: 41 e 51 sono il colore 1. Fuori da
 * config/rules.js per la stessa ragione del masso: l'impronta delle regole non cambia, e
 * le sfide passate restano confrontabili. Nelle griglie dei livelli: `R` intatto, `r`
 * incrinato.
 */
export const MATTONE = 40;
export const MATTONE_INCRINATO = 50;

/** La cella e' un mattone rinforzato, intatto o incrinato? */
export function eMattone(valore) {
  return eMattoneIntatto(valore) || eMattoneIncrinato(valore);
}

/** La cella e' un mattone ancora intatto? */
export function eMattoneIntatto(valore) {
  return valore > MATTONE && valore <= MATTONE + 6;
}

/** La cella e' un mattone gia' incrinato? */
export function eMattoneIncrinato(valore) {
  return valore > MATTONE_INCRINATO && valore <= MATTONE_INCRINATO + 6;
}

if (!Number.isInteger(QUADRANTS_PER_SIDE)) {
  throw new Error('GRID_SIZE deve essere divisibile per QUADRANT_SIZE');
}

/** Colore di una cella, bomba o no. 0 se vuota, e 0 anche per un masso: non ha colore. */
export function coloreDi(valore) {
  if (valore === 0 || valore === MASSO) return 0;
  return ((valore - 1) % VALORE_BOMBA) + 1;
}

/** La cella contiene una bomba? Solo 11..16: masso e mattoni hanno valori piu' alti. */
export function eBomba(valore) {
  return valore > VALORE_BOMBA && valore <= VALORE_BOMBA + 6;
}

/** Valore di cella per un blocco-bomba del colore dato. */
export function conBomba(colore) {
  return colore + VALORE_BOMBA;
}

/**
 * Espande un insieme di celle da eliminare facendo detonare le bombe che contiene.
 *
 * Una bomba porta via il quadrato BOMBA_RAGGIO attorno a se'. Se dentro quel quadrato
 * c'e' un'altra bomba, anche quella detona: la propagazione continua finche' non si
 * aggiunge piu' nulla, quindi tre bombe vicine si innescano a vicenda.
 *
 * @param {Uint8Array} grid griglia DOPO il posizionamento del pezzo
 * @param {Iterable<number>} celleIniziali indici delle celle dei gruppi completati
 * @returns {{tutte:Set<number>, esplose:number[], bombe:number[]}}
 *   `tutte` = da svuotare; `esplose` = solo quelle aggiunte dalle bombe;
 *   `bombe` = le bombe detonate, in ordine di detonazione (serve alle animazioni)
 */
export function detonaBombe(grid, celleIniziali) {
  const tutte = new Set(celleIniziali);
  const bombe = [];
  const daEsaminare = [...tutte];
  const esaminate = new Set();

  while (daEsaminare.length > 0) {
    const cella = daEsaminare.pop();
    if (esaminate.has(cella)) continue;
    esaminate.add(cella);
    if (!eBomba(grid[cella])) continue;

    bombe.push(cella);
    const r0 = rowOf(cella);
    const c0 = colOf(cella);
    for (let r = r0 - BOMBA_RAGGIO; r <= r0 + BOMBA_RAGGIO; r += 1) {
      for (let c = c0 - BOMBA_RAGGIO; c <= c0 + BOMBA_RAGGIO; c += 1) {
        if (r < 0 || c < 0 || r >= GRID_SIZE || c >= GRID_SIZE) continue;
        const vicina = idx(r, c);
        if (grid[vicina] === 0) continue;          // il vuoto non si elimina
        if (grid[vicina] === MASSO) continue;      // e il masso resiste all'esplosione
        if (!tutte.has(vicina)) {
          tutte.add(vicina);
          daEsaminare.push(vicina);
        } else if (!esaminate.has(vicina)) {
          daEsaminare.push(vicina);                // gia' da eliminare, ma va innescata
        }
      }
    }
  }

  const iniziali = new Set(celleIniziali);
  return {
    tutte,
    esplose: [...tutte].filter((c) => !iniziali.has(c)),
    bombe,
  };
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
    Math.floor(row / QUADRANT_SIZE) * QUADRANTS_PER_SIDE +
    Math.floor(col / QUADRANT_SIZE)
  );
}

/** Indici piatti delle celle di un quadrante. */
export function quadrantCells(quadrant) {
  const baseRow = Math.floor(quadrant / QUADRANTS_PER_SIDE) * QUADRANT_SIZE;
  const baseCol = (quadrant % QUADRANTS_PER_SIDE) * QUADRANT_SIZE;
  const cells = [];
  for (let r = 0; r < QUADRANT_SIZE; r += 1) {
    for (let c = 0; c < QUADRANT_SIZE; c += 1) {
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
export function placeShape(grid, shape, row, col, color, bombe = null) {
  const cells = shapeCellsAt(shape, row, col);
  if (cells === null) throw new Error('Posizionamento fuori griglia');
  const next = grid.slice();
  const conBombe = bombe && bombe.length ? new Set(bombe) : null;
  for (let i = 0; i < cells.length; i += 1) {
    if (next[cells[i]] !== 0) throw new Error('Posizionamento su cella occupata');
    next[cells[i]] = conBombe && conBombe.has(i) ? conBomba(color) : color;
  }
  return { grid: next, cells };
}

/**
 * Le celle di ogni gruppo, calcolate una volta sola: `findCompletedGroups` gira a ogni
 * mossa e, nel generatore dei livelli, milioni di volte. Nell'ordine di sempre: righe,
 * colonne, quadranti.
 */
const TUTTI_I_GRUPPI = [
  ...Array.from({ length: GRID_SIZE }, (_, r) => ({ type: 'row', index: r, cells: rowCells(r) })),
  ...Array.from({ length: GRID_SIZE }, (_, c) => ({ type: 'col', index: c, cells: colCells(c) })),
  ...Array.from({ length: QUADRANT_COUNT }, (_, q) => ({ type: 'quadrant', index: q, cells: quadrantCells(q) })),
];

/**
 * Un gruppo e' chiuso se non ha caselle vuote. Un gruppo fatto SOLO di massi non conta:
 * sarebbe pieno per sempre, e darebbe punti e Catena a ogni mossa senza svuotare niente.
 */
function gruppoChiuso(grid, cells) {
  let soloMassi = true;
  for (let i = 0; i < cells.length; i += 1) {
    const v = grid[cells[i]];
    if (v === 0) return false;
    if (v !== MASSO) soloMassi = false;
  }
  return !soloMassi;
}

/**
 * Trova righe, colonne e quadranti completi.
 * Tutti e tre i tipi valgono contemporaneamente: una singola mossa puo' chiudere
 * una riga, una colonna e un quadrante insieme.
 * @returns {{type: 'row'|'col'|'quadrant', index: number, cells: number[]}[]}
 */
export function findCompletedGroups(grid) {
  const groups = [];
  for (let k = 0; k < TUTTI_I_GRUPPI.length; k += 1) {
    const { type, index, cells } = TUTTI_I_GRUPPI[k];
    if (gruppoChiuso(grid, cells)) groups.push({ type, index, cells: cells.slice() });
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
  const seen = new Set();
  for (const group of groups) for (const cell of group.cells) seen.add(cell);
  return svuotaCelle(grid, seen);
}

/**
 * Svuota un insieme qualsiasi di celle. Usato anche dalle esplosioni.
 * I massi restano dove sono e non compaiono fra le celle svuotate: non contano per
 * «Elimina N caselle», perche' non sono stati eliminati.
 *
 * I mattoni rinforzati fanno un passo: l'intatto si incrina e resta (non e' fra le celle
 * svuotate, perche' non e' sparito), l'incrinato sparisce (e' fra le svuotate, ed e'
 * anche un mattone demolito). Le celle sono un insieme, quindi ogni mattone fa un passo
 * solo anche se compare in due gruppi o in un gruppo e in un'esplosione.
 *
 * @returns {{grid: Uint8Array, clearedCells: number[], incrinati: number[], demoliti: number[]}}
 */
export function svuotaCelle(grid, celle) {
  const next = grid.slice();
  const clearedCells = [];
  const incrinati = [];
  const demoliti = [];
  for (const cella of new Set(celle)) {
    const v = grid[cella];
    if (v === MASSO) continue;
    if (eMattoneIntatto(v)) {
      next[cella] = v + (MATTONE_INCRINATO - MATTONE);
      incrinati.push(cella);
      continue;
    }
    if (eMattoneIncrinato(v)) demoliti.push(cella);
    next[cella] = 0;
    clearedCells.push(cella);
  }
  return { grid: next, clearedCells, incrinati, demoliti };
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

/** La griglia e' vuota? I massi non contano: «svuotata» vuol dire nessun pezzo rimasto. */
export function isEmpty(grid) {
  for (let i = 0; i < grid.length; i += 1) if (grid[i] !== 0 && grid[i] !== MASSO) return false;
  return true;
}

/** Rappresentazione testuale, usata dai test e dal debug. */
export function gridToString(grid) {
  const lines = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    let line = '';
    for (let c = 0; c < GRID_SIZE; c += 1) {
      const v = grid[idx(r, c)];
      line += v === 0 ? '.' : v === MASSO ? 'M' : eMattoneIntatto(v) ? 'R' : eMattoneIncrinato(v) ? 'r' : '#';
    }
    lines.push(line);
  }
  return lines.join('\n');
}

/**
 * Inverso di gridToString: comodo per costruire scenari nei test, ed e' anche il formato
 * delle griglie di partenza dei livelli. `.` vuota, `M` masso, `R` mattone rinforzato
 * intatto e `r` incrinato (del colore indicato), qualunque altro carattere una casella
 * piena del colore indicato.
 */
export function gridFromString(text, color = 1) {
  const lines = text.trim().split('\n').map((l) => l.trim());
  const grid = createGrid();
  lines.forEach((line, r) => {
    for (let c = 0; c < line.length; c += 1) {
      if (line[c] === 'M') grid[idx(r, c)] = MASSO;
      else if (line[c] === 'R') grid[idx(r, c)] = MATTONE + color;
      else if (line[c] === 'r') grid[idx(r, c)] = MATTONE_INCRINATO + color;
      else if (line[c] !== '.' && line[c] !== ' ') grid[idx(r, c)] = color;
    }
  });
  return grid;
}
