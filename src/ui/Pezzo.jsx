/**
 * Disegno di un pezzo: una griglietta larga quanto il riquadro della forma.
 * Usato in tre posti con la sola differenza della dimensione della cella:
 * nel tray, sotto il dito durante il trascinamento, e nelle schermate di aiuto.
 */
export function Pezzo({ shape, color, cella, gap = 2, className = '', style = {} }) {
  const pieni = new Set(shape.cells.map(([r, c]) => `${r}:${c}`));
  const celle = [];
  for (let r = 0; r < shape.height; r += 1) {
    for (let c = 0; c < shape.width; c += 1) {
      const attiva = pieni.has(`${r}:${c}`);
      celle.push(
        <div key={`${r}:${c}`} className="q-pezzo__cella">
          {attiva ? <div className={`q-blocco q-blocco--${color}`} /> : null}
        </div>,
      );
    }
  }
  return (
    <div
      className={`q-pezzo ${className}`}
      style={{
        gridTemplateColumns: `repeat(${shape.width}, ${cella}px)`,
        gridTemplateRows: `repeat(${shape.height}, ${cella}px)`,
        gap: `${gap}px`,
        ...style,
      }}
      aria-hidden="true"
    >
      {celle}
    </div>
  );
}
