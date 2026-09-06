/**
 * Disegno di un pezzo: una griglietta larga quanto il riquadro della forma.
 * Usato in tre posti con la sola differenza della dimensione della cella:
 * nel tray, sotto il dito durante il trascinamento, e nelle schermate di aiuto.
 */
export function Pezzo({ shape, color, bombe = [], cella, gap = 2, className = '', style = {} }) {
  // `bombe` contiene indici dentro shape.cells, non coordinate: qui si costruisce la
  // corrispondenza fra posizione nel riquadro e posizione nell'elenco delle celle.
  const indicePerCella = new Map(shape.cells.map(([r, c], i) => [`${r}:${c}`, i]));
  const conBomba = new Set(bombe);
  const celle = [];
  for (let r = 0; r < shape.height; r += 1) {
    for (let c = 0; c < shape.width; c += 1) {
      const indice = indicePerCella.get(`${r}:${c}`);
      const attiva = indice !== undefined;
      celle.push(
        <div key={`${r}:${c}`} className="pl-pezzo__cella">
          {attiva ? (
            <div
              className={`pl-blocco pl-blocco--${color} ${conBomba.has(indice) ? 'pl-blocco--bomba' : ''}`}
            />
          ) : null}
        </div>,
      );
    }
  }
  return (
    <div
      className={`pl-pezzo ${className}`}
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
