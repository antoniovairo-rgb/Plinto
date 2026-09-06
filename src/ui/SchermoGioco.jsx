import { useCallback, useMemo, useRef } from 'react';
import { Plancia } from './Plancia.jsx';
import { Tray } from './Tray.jsx';
import { Hud, BarraCatena } from './Hud.jsx';
import { Pezzo } from './Pezzo.jsx';
import { useTrascinamento } from './useTrascinamento.js';
import { canPlace, placeShape, findCompletedGroups, shapeCellsAt } from '../core/grid.js';

/**
 * La schermata di gioco: e' l'unica che conta davvero.
 *
 * Tutto quello che non e' la griglia sta ai bordi e in secondo piano. Il punteggio
 * e la Catena stanno in alto perche' li si guarda tra una mossa e l'altra; i pezzi
 * stanno in basso perche' li' arriva il pollice.
 */
export function SchermoGioco({ partita, record, pezziMorti, onGioca, onMenu, aiutoVisivo, t }) {
  const cellRefs = useRef([]);

  const posiziona = useCallback(
    (handIndex, row, col) => { onGioca(handIndex, row, col); },
    [onGioca],
  );

  const drag = useTrascinamento({
    mano: partita.hand,
    cellRefs,
    onPosiziona: posiziona,
    attivo: partita.status === 'playing',
  });

  /**
   * Anteprima della mossa in corso: dove finirebbe il pezzo, se e' una mossa legale,
   * e quali celle sparirebbero. Quest'ultima informazione e' il vero aiuto strategico
   * del gioco: rende leggibile una mossa a tre gruppi che altrimenti si vede solo dopo.
   */
  const anteprima = useMemo(() => {
    const indice = drag.preso?.handIndex;
    const destinazione = drag.destinazione;
    if (indice == null || !destinazione) return null;
    const pezzo = partita.hand[indice];
    if (!pezzo) return null;

    const celle = shapeCellsAt(pezzo.shape, destinazione.row, destinazione.col);
    if (celle === null) return null;              // fuori griglia: niente da mostrare

    const valida = canPlace(partita.grid, pezzo.shape, destinazione.row, destinazione.col);
    let incandidate = null;
    if (valida && aiutoVisivo) {
      const { grid: dopo } = placeShape(
        partita.grid, pezzo.shape, destinazione.row, destinazione.col, pezzo.color,
      );
      const gruppi = findCompletedGroups(dopo);
      if (gruppi.length > 0) {
        incandidate = new Set();
        gruppi.forEach((g) => g.cells.forEach((c) => incandidate.add(c)));
      }
    }
    return { celle: new Set(celle), colore: pezzo.color, valida, incandidate };
  }, [drag.preso, drag.destinazione, partita.hand, partita.grid, aiutoVisivo]);

  const pezzoTrascinato = drag.preso ? partita.hand[drag.preso.handIndex] : null;

  return (
    <div className="q-screen">
      <Hud punteggio={partita.score} record={record.best} onMenu={onMenu} t={t} />

      {/* Catena, plancia e suggerimento formano un blocco unico centrato: su schermi
          alti lo spazio che avanza diventa respiro attorno al tavolo da gioco, non
          tre buchi scollegati fra elementi che parlano della stessa cosa. */}
      <div className="q-plancia-area">
        <div className="q-tavolo">
        <BarraCatena livello={partita.chain} t={t} />
        <Plancia
          grid={partita.grid}
          anteprima={anteprima?.celle}
          anteprimaColore={anteprima?.colore}
          anteprimaValida={anteprima?.valida ?? true}
          incandidate={anteprima?.incandidate}
          cellRefs={cellRefs}
          onCellPointerUp={
            drag.selezionato !== null
              ? (e, r, c) => { e.preventDefault(); drag.posizionaSuCella(r, c); }
              : undefined
          }
        />
        <p className="q-suggerimento">
          {drag.selezionato !== null ? t('gioca.tocca') : t('gioca.trascina')}
        </p>
        </div>
      </div>

      <Tray
        mano={partita.hand}
        pezziMorti={pezziMorti}
        selezionato={drag.selezionato}
        presoIndex={drag.preso?.handIndex ?? null}
        onPointerDownPezzo={drag.iniziaTrascinamento}
        onTapPezzo={drag.selezionaPezzo}
      />

      {pezzoTrascinato && drag.preso ? (
        <div
          className="q-trascinato"
          style={{ left: `${drag.preso.x}px`, top: `${drag.preso.y}px` }}
        >
          <Pezzo
            shape={pezzoTrascinato.shape}
            color={pezzoTrascinato.color}
            cella={drag.preso.cella}
          />
        </div>
      ) : null}
    </div>
  );
}
