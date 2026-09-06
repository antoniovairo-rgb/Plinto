import { forwardRef, useMemo } from 'react';
import { GRID_SIZE } from '../config/rules.js';
import { idx } from '../core/grid.js';

/**
 * La griglia 9x9.
 *
 * Non contiene logica di gioco: riceve la griglia e la descrizione degli effetti in
 * corso, e disegna. Le linee spesse dei quadranti e il canvas delle particelle sono
 * livelli sovrapposti, cosi' non entrano nel flusso delle celle.
 *
 * `cellRefs` viene riempito con i nodi delle celle: servono al trascinamento per
 * misurare con esattezza dove cade il dito, e alle particelle per sapere da dove partire.
 */
export const Plancia = forwardRef(function Plancia(
  {
    grid, anteprima, anteprimaColore, anteprimaValida, incandidate,
    appoggiate, esplosioni, cursore, pezzoInMano, cellRefs, canvasRef, onCellPointerUp, t,
  },
  ref,
) {
  const celle = useMemo(() => {
    const out = [];
    for (let r = 0; r < GRID_SIZE; r += 1) {
      for (let c = 0; c < GRID_SIZE; c += 1) {
        const i = idx(r, c);
        const valore = grid[i];
        const inAnteprima = anteprima?.has(i);
        const daEliminare = incandidate?.has(i);
        const appenaPosata = appoggiate?.has(i);
        const inEsplosione = valore === 0 && esplosioni?.celle.has(i);
        const sottoCursore = cursore && cursore.row === r && cursore.col === c;

        const classi = ['q-cella'];
        if (sottoCursore) classi.push('q-cella--cursore');
        if (inAnteprima) classi.push('q-cella--anteprima');
        if (inAnteprima && !anteprimaValida) classi.push('q-cella--vietata');
        if (daEliminare) classi.push('q-cella--incandidata');

        out.push(
          <div
            key={i}
            ref={(node) => { if (cellRefs) cellRefs.current[i] = node; }}
            className={classi.join(' ')}
            data-riga={r}
            data-colonna={c}
            role="gridcell"
            aria-label={t
              ? `${t('a11y.cella').replace('{r}', r + 1).replace('{c}', c + 1)}, ${
                valore === 0 ? t('a11y.cellaLibera') : t('a11y.cellaOccupata')}`
              : undefined}
            onPointerUp={onCellPointerUp ? (e) => onCellPointerUp(e, r, c) : undefined}
          >
            {valore !== 0 ? (
              <div className={`q-blocco q-blocco--${valore} ${appenaPosata ? 'q-blocco--posato' : ''}`} />
            ) : null}
            {valore === 0 && inAnteprima ? (
              <div className={`q-blocco q-blocco--${anteprimaColore}`} />
            ) : null}
            {/* Il blocco che sta sparendo viene ridisegnato per una frazione di secondo
                dopo essere gia' uscito dallo stato: senza, l'eliminazione sarebbe uno
                scatto e la mossa piu' soddisfacente del gioco passerebbe inosservata. */}
            {inEsplosione ? (
              <div
                className="q-blocco q-blocco--esploso"
                style={{ '--esploso': esplosioni.colore }}
              />
            ) : null}
          </div>,
        );
      }
    }
    return out;
  }, [grid, anteprima, anteprimaColore, anteprimaValida, incandidate, appoggiate, esplosioni,
      cursore, cellRefs, onCellPointerUp, t]);

  return (
    <div className="q-plancia" ref={ref} role="grid" aria-label="QUADRA" data-in-mano={pezzoInMano ? 'si' : 'no'}>
      {celle}
      <div className="q-plancia__quadranti" />
      <canvas className="q-plancia__particelle" ref={canvasRef} aria-hidden="true" />
    </div>
  );
});
