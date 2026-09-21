import { forwardRef, useMemo } from 'react';
import { GRID_SIZE } from '../config/rules.js';
import { idx, coloreDi, eBomba } from '../core/grid.js';
import { Bomba } from './Bomba.jsx';

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
    appoggiate, esplosioni, celleEsplose, svuotata, cursore, pezzoInMano,
    // Le caselle segnate col gesso: dove il gessetto dice di appoggiare.
    segnate,
    cellRefs, canvasRef, onCellPointerUp, t,
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
        const colore = coloreDi(valore);
        const bomba = eBomba(valore);
        const saltata = valore === 0 && celleEsplose?.has(i);

        const classi = ['pl-cella'];
        if (sottoCursore) classi.push('pl-cella--cursore');
        if (inAnteprima) classi.push('pl-cella--anteprima');
        if (inAnteprima && !anteprimaValida) classi.push('pl-cella--vietata');
        if (daEliminare) classi.push('pl-cella--incandidata');
        if (segnate?.has(i)) classi.push('pl-cella--segnata');

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
              <div className={`pl-blocco pl-blocco--${colore} ${appenaPosata ? 'pl-blocco--posato' : ''}`}>
                {bomba ? <Bomba /> : null}
              </div>
            ) : null}
            {valore === 0 && inAnteprima ? (
              <div className={`pl-blocco pl-blocco--${anteprimaColore}`} />
            ) : null}
            {/* Il blocco che sta sparendo viene ridisegnato per una frazione di secondo
                dopo essere gia' uscito dallo stato: senza, l'eliminazione sarebbe uno
                scatto e la mossa piu' soddisfacente del gioco passerebbe inosservata. */}
            {inEsplosione ? (
              <div
                className={[
                  'pl-blocco', 'pl-blocco--esploso',
                  saltata ? 'pl-blocco--saltato' : '',
                  // La Tinta e' scattata: il blocco se ne va con un alone del proprio
                  // colore invece di sbiancare e basta. Succede una eliminazione su
                  // dieci, quindi si nota senza diventare rumore.
                  esplosioni.tinta ? 'pl-blocco--tinta' : '',
                ].filter(Boolean).join(' ')}
                style={{ '--esploso': esplosioni.colore }}
              />
            ) : null}
          </div>,
        );
      }
    }
    return out;
  }, [grid, segnate, anteprima, anteprimaColore, anteprimaValida, incandidate, appoggiate, esplosioni,
      celleEsplose, cursore, cellRefs, onCellPointerUp, t]);

  return (
    <div
      className="pl-plancia"
      ref={ref}
      role="grid"
      aria-label="PLINTO"
      data-in-mano={pezzoInMano ? 'si' : 'no'}
    >
      {/* La scacchiera dei quadranti sta PRIMA delle celle, e non e' un dettaglio:
          le celle sono `position: relative`, quindi fra elementi posizionati decide
          l'ordine nel DOM. Messa qui resta SOTTO le caselle -- che hanno un fondo
          semitrasparente e la lasciano trasparire -- e sotto i blocchi, che sono opachi:
          cambia il colore del vuoto e non tocca il contrasto dei pezzi. */}
      <div className="pl-plancia__scacchi" aria-hidden="true" />
      {celle}
      <div className="pl-plancia__quadranti" />
      {/* Il lampo dello svuotamento. E' un elemento a se' e non uno sfondo della
          plancia perche' deve stare SOPRA le caselle e sotto le particelle, e perche'
          rimontandolo a ogni svuotamento l'animazione riparte davvero: una classe
          rimessa sullo stesso nodo, in CSS, non fa ripartire niente. */}
      {svuotata ? <div key={svuotata} className="pl-plancia__lampo" aria-hidden="true" /> : null}
      <canvas className="pl-plancia__particelle" ref={canvasRef} aria-hidden="true" />
    </div>
  );
});
