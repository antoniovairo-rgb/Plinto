import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plancia } from './Plancia.jsx';
import { Tray } from './Tray.jsx';
import { Hud, BarraCatena } from './Hud.jsx';
import { Pezzo } from './Pezzo.jsx';
import { useTrascinamento } from './useTrascinamento.js';
import { useEffettiMossa } from '../feel/useEffettiMossa.js';
import { CampoParticelle } from '../feel/particelle.js';
import { suonoPresa, suonoRifiuto, sbloccaAudio } from '../audio/suoni.js';
import { vibraRifiuto } from '../feel/vibrazione.js';
import { canPlace, placeShape, findCompletedGroups, shapeCellsAt, rowOf, colOf } from '../core/grid.js';

/**
 * La schermata di gioco: e' l'unica che conta davvero.
 *
 * Tutto quello che non e' la griglia sta ai bordi e in secondo piano. Il punteggio
 * e la Catena stanno in alto perche' li si guarda tra una mossa e l'altra; i pezzi
 * stanno in basso perche' li' arriva il pollice.
 */
export function SchermoGioco({
  partita, record, pezziMorti, onGioca, onMenu, aiutoVisivo, animazioni, t,
}) {
  const cellRefs = useRef([]);
  const plancia = useRef(null);
  const canvas = useRef(null);
  const campo = useRef(null);

  // --- canvas delle particelle: creato una volta, ridimensionato con la plancia ---
  useEffect(() => {
    if (!canvas.current) return undefined;
    campo.current = new CampoParticelle(canvas.current);
    const adegua = () => {
      const r = plancia.current?.getBoundingClientRect();
      if (r) campo.current?.ridimensiona(r.width, r.height);
    };
    adegua();
    const osservatore = new ResizeObserver(adegua);
    if (plancia.current) osservatore.observe(plancia.current);
    return () => { osservatore.disconnect(); campo.current?.distruggi(); campo.current = null; };
  }, []);

  useEffect(() => { campo.current?.imposta(animazioni); }, [animazioni]);

  const effetti = useEffettiMossa({
    lastMove: partita.lastMove,
    campo,
    cellRefs,
    plancia,
    animazioni,
  });

  /** Una mossa rifiutata deve dirlo: il silenzio sembra un gioco rotto. */
  const posiziona = useCallback(
    (handIndex, row, col) => {
      const pezzo = partita.hand[handIndex];
      if (pezzo && !canPlace(partita.grid, pezzo.shape, row, col)) {
        suonoRifiuto();
        vibraRifiuto();
        return;
      }
      onGioca(handIndex, row, col);
    },
    [onGioca, partita.hand, partita.grid],
  );

  const drag = useTrascinamento({
    mano: partita.hand,
    cellRefs,
    onPosiziona: posiziona,
    attivo: partita.status === 'playing',
  });

  const prendi = useCallback((evento, handIndex, cella) => {
    sbloccaAudio();
    suonoPresa();
    drag.iniziaTrascinamento(evento, handIndex, cella);
  }, [drag]);

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

  // Posizione dei punti volanti, in percentuale sulla plancia.
  const puntiVolanti = effetti.puntiVolanti;
  const posizionePunti = puntiVolanti != null
    ? {
      left: `${((colOf(puntiVolanti.cella) + 0.5) / 9) * 100}%`,
      top: `${((rowOf(puntiVolanti.cella) + 0.5) / 9) * 100}%`,
    }
    : null;

  return (
    <div className="q-screen">
      <Hud
        punteggio={partita.score}
        record={record.best}
        onMenu={onMenu}
        scatta={Boolean(puntiVolanti)}
        t={t}
      />

      {/* Catena, plancia e suggerimento formano un blocco unico centrato: su schermi
          alti lo spazio che avanza diventa respiro attorno al tavolo da gioco, non
          tre buchi scollegati fra elementi che parlano della stessa cosa. */}
      <div className="q-plancia-area">
        <div className="q-tavolo">
          <BarraCatena livello={partita.chain} t={t} />

          <div className="q-plancia-involucro">
            <Plancia
              ref={plancia}
              grid={partita.grid}
              anteprima={anteprima?.celle}
              anteprimaColore={anteprima?.colore}
              anteprimaValida={anteprima?.valida ?? true}
              incandidate={anteprima?.incandidate}
              appoggiate={effetti.appoggiate}
              esplosioni={effetti.esplosioni}
              cellRefs={cellRefs}
              canvasRef={canvas}
              onCellPointerUp={
                drag.selezionato !== null
                  ? (e, r, c) => { e.preventDefault(); drag.posizionaSuCella(r, c); }
                  : undefined
              }
            />
            {puntiVolanti ? (
              <span
                key={puntiVolanti.chiave}
                className={`q-punti-volanti q-punti-volanti--${puntiVolanti.tier ?? 'buona'}`}
                style={posizionePunti}
              >
                +{puntiVolanti.punti}
                {puntiVolanti.tier && puntiVolanti.tier !== 'buona' ? (
                  <span className="q-etichetta-mossa">{puntiVolanti.tier}</span>
                ) : null}
              </span>
            ) : null}
          </div>

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
        onPointerDownPezzo={prendi}
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
