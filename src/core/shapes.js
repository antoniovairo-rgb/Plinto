/**
 * Catalogo delle forme di QUADRA.
 *
 * Scelte di design:
 * - NESSUNA ROTAZIONE in partita. Su mobile ruotare un pezzo richiede un gesto in piu'
 *   e rompe l'immediatezza; le varianti ruotate sono quindi forme distinte del catalogo,
 *   cosi' la varieta' resta alta ma il controllo resta "prendi e appoggia".
 * - Ogni forma ha un PESO: il generatore non usa random puro (vedi generator.js).
 * - Le famiglie servono al generatore per garantire varieta' percepita e per le statistiche.
 * - Le diagonali sono una firma di QUADRA: rare, spiazzanti, obbligano a leggere la griglia
 *   in un modo che le forme ortogonali non richiedono.
 */

/**
 * Costruisce una forma da un disegno ASCII ('#' = cella piena, '.' = vuota).
 * @param {string} id identificativo stabile (usato in salvataggi e statistiche)
 * @param {string} family famiglia della forma
 * @param {number} weight peso relativo nel sacchetto del generatore
 * @param {string[]} rows righe del disegno
 */
function shape(id, family, weight, rows) {
  const cells = [];
  rows.forEach((line, r) => {
    for (let c = 0; c < line.length; c += 1) {
      if (line[c] === '#') cells.push([r, c]);
    }
  });
  if (cells.length === 0) throw new Error(`Forma vuota: ${id}`);
  const height = rows.length;
  const width = Math.max(...rows.map((line) => line.length));
  return Object.freeze({
    id,
    family,
    weight,
    cells: Object.freeze(cells.map((cell) => Object.freeze(cell))),
    size: cells.length,
    width,
    height,
  });
}

export const SHAPES = Object.freeze([
  // --- Punto: la valvola di sfogo. Sempre piazzabile finche' c'e' una casella libera.
  shape('p1', 'punto', 6, ['#']),

  // --- Linee orizzontali e verticali.
  shape('h2', 'linea', 10, ['##']),
  shape('v2', 'linea', 10, ['#', '#']),
  shape('h3', 'linea', 10, ['###']),
  shape('v3', 'linea', 10, ['#', '#', '#']),
  shape('h4', 'linea', 6, ['####']),
  shape('v4', 'linea', 6, ['#', '#', '#', '#']),
  shape('h5', 'linea', 3, ['#####']),
  shape('v5', 'linea', 3, ['#', '#', '#', '#', '#']),

  // --- Blocchi pieni.
  shape('b22', 'blocco', 9, ['##', '##']),
  shape('b23', 'blocco', 5, ['###', '###']),
  shape('b32', 'blocco', 5, ['##', '##', '##']),
  shape('b33', 'blocco', 2, ['###', '###', '###']),

  // --- Angoli a 3 celle: il pezzo piu' versatile del gioco.
  shape('a3ne', 'angolo', 8, ['##', '.#']),
  shape('a3nw', 'angolo', 8, ['##', '#.']),
  shape('a3se', 'angolo', 8, ['.#', '##']),
  shape('a3sw', 'angolo', 8, ['#.', '##']),

  // --- Angoli a 5 celle (L grande su base 3x3): chiudono i quadranti.
  shape('a5ne', 'angolo', 3, ['###', '..#', '..#']),
  shape('a5nw', 'angolo', 3, ['###', '#..', '#..']),
  shape('a5se', 'angolo', 3, ['..#', '..#', '###']),
  shape('a5sw', 'angolo', 3, ['#..', '#..', '###']),

  // --- Tetromini a L / J.
  shape('l4a', 'tetro', 3, ['#.', '#.', '##']),
  shape('l4b', 'tetro', 3, ['.#', '.#', '##']),
  shape('l4c', 'tetro', 3, ['##', '#.', '#.']),
  shape('l4d', 'tetro', 3, ['##', '.#', '.#']),
  shape('l4e', 'tetro', 3, ['###', '#..']),
  shape('l4f', 'tetro', 3, ['###', '..#']),
  shape('l4g', 'tetro', 3, ['#..', '###']),
  shape('l4h', 'tetro', 3, ['..#', '###']),

  // --- Tetromini a T.
  shape('t4n', 'tetro', 4, ['###', '.#.']),
  shape('t4s', 'tetro', 4, ['.#.', '###']),
  shape('t4e', 'tetro', 4, ['#.', '##', '#.']),
  shape('t4w', 'tetro', 4, ['.#', '##', '.#']),

  // --- Tetromini S / Z: i piu' odiati, quindi rari.
  shape('s4h', 'tetro', 2, ['.##', '##.']),
  shape('z4h', 'tetro', 2, ['##.', '.##']),
  shape('s4v', 'tetro', 2, ['#.', '##', '.#']),
  shape('z4v', 'tetro', 2, ['.#', '##', '#.']),

  // --- Diagonali: firma di QUADRA. Rare per scelta.
  shape('d2a', 'diagonale', 2, ['#.', '.#']),
  shape('d2b', 'diagonale', 2, ['.#', '#.']),
  shape('d3a', 'diagonale', 1, ['#..', '.#.', '..#']),
  shape('d3b', 'diagonale', 1, ['..#', '.#.', '#..']),
]);

/** Mappa id -> forma, per ricostruire i pezzi da un salvataggio. */
export const SHAPES_BY_ID = Object.freeze(
  Object.fromEntries(SHAPES.map((s) => [s.id, s])),
);

/** Somma dei pesi: usata dal generatore. */
export const TOTAL_WEIGHT = SHAPES.reduce((sum, s) => sum + s.weight, 0);

/** @param {string} id */
export function getShape(id) {
  const found = SHAPES_BY_ID[id];
  if (!found) throw new Error(`Forma sconosciuta: ${id}`);
  return found;
}
