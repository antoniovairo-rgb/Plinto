import { forwardRef, useMemo } from 'react';
import { GRID_SIZE, QUADRANT_SIZE } from '../config/rules.js';
import { idx, coloreDi, eBomba, eMasso } from '../core/grid.js';
import { Bomba } from './Bomba.jsx';
import { Masso } from './Masso.jsx';
import { ritardoOnda } from '../feel/onda.js';

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
/** Dove sta la scia di un gruppo, in caselle: prima riga, prima colonna, quante. */
function posizioneScia({ type, index }) {
  if (type === 'row') return { '--r': index, '--c': 0, '--nr': 1, '--nc': GRID_SIZE };
  if (type === 'col') return { '--r': 0, '--c': index, '--nr': GRID_SIZE, '--nc': 1 };
  const lato = QUADRANT_SIZE;
  const perRiga = GRID_SIZE / lato;
  return {
    '--r': Math.floor(index / perRiga) * lato, '--c': (index % perRiga) * lato, '--nr': lato, '--nc': lato,
  };
}

export const Plancia = forwardRef(function Plancia(
  {
    grid, anteprima, anteprimaColore, anteprimaValida, incandidate,
    appoggiate, esplosioni, celleEsplose, svuotata, intreccio, cursore, pezzoInMano,
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
        const masso = eMasso(valore);
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
                valore === 0 ? t('a11y.cellaLibera') : (masso ? t('a11y.cellaMasso') : t('a11y.cellaOccupata'))}`
              : undefined}
            onPointerUp={onCellPointerUp ? (e) => onCellPointerUp(e, r, c) : undefined}
          >
            {/* Il masso della Torre non ha colore (`coloreDi` da' zero), quindi non puo'
                passare dal ramo dei blocchi: avrebbe la classe di un colore che non c'e'
                e nessun fondo. Ha un disegno suo, grigio e scolpito, che si distingue dai
                sei colori anche per forma e non solo per tinta. */}
            {masso ? (
              <div className="pl-blocco pl-blocco--masso"><Masso /></div>
            ) : null}
            {valore !== 0 && !masso ? (
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
                style={{ '--esploso': esplosioni.colore, '--ritardo': `${ritardoOnda(i, esplosioni.origine)}ms` }}
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
      className={`pl-plancia${intreccio ? ' pl-plancia--scossa' : ''}`}
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
      {/* Le scie: una striscia di luce che corre lungo ogni riga o colonna chiusa, un
          lampo dal centro per ogni quadrante. La posizione si calcola qui, in caselle,
          e non in CSS con mod()/round(): i browser un po' vecchi non li conoscono. */}
      {esplosioni?.gruppi?.map((g) => (
        <div
          key={`${g.type}${g.index}`}
          aria-hidden="true"
          className={`pl-scia pl-scia--${g.type}`}
          style={{ '--colore': esplosioni.colore, ...posizioneScia(g) }}
        />
      ))}
      {/* L'Intreccio: due o piu' gruppi con una mossa. Nascosto ai lettori di schermo,
          che i punti della mossa li sentono gia' dall'annuncio. */}
      {intreccio ? (
        <div key={intreccio.chiave} className="pl-colpo" aria-hidden="true">
          <span className="pl-colpo__testo">{t('plancia.intreccio')}</span>
          <span className="pl-colpo__per">{`\u00d7${intreccio.n}!`}</span>
        </div>
      ) : null}
    </div>
  );
});
