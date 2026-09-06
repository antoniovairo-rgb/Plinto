import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plancia } from './Plancia.jsx';
import { Tray } from './Tray.jsx';
import { Hud, BarraCatena } from './Hud.jsx';
import { Pezzo } from './Pezzo.jsx';
import { useTrascinamento, origineDaCella } from './useTrascinamento.js';
import { useTastiera } from './useTastiera.js';
import { Annunci, frasePerMossa } from './Annunci.jsx';
import { BarraObiettivo } from './BarraObiettivo.jsx';
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
  partita, record, pezziMorti, onGioca, onMenu, aiutoVisivo, animazioni,
  quadro = null, statoQuadro = null, t,
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

  const tastiera = useTastiera({
    attivo: partita.status === 'playing',
    selezionato: drag.selezionato,
    mano: partita.hand,
    onAnnulla: drag.annulla,
    onPosiziona: (indice, row, col) => {
      const pezzo = partita.hand[indice];
      if (!pezzo) return;
      const origine = origineDaCella(pezzo.shape, row, col);
      posiziona(indice, origine.row, origine.col);
      drag.annulla();
    },
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
    // L'intenzione puo' arrivare da tre strade diverse — dito, tocco doppio, tastiera —
    // ma da qui in giu' il gioco non deve sapere quale: l'anteprima e' una sola.
    let indice = null;
    let destinazione = null;
    if (drag.preso) {
      indice = drag.preso.handIndex;
      destinazione = drag.destinazione;
    } else if (drag.selezionato !== null && tastiera.cursore) {
      indice = drag.selezionato;
      const pezzoSelezionato = partita.hand[indice];
      destinazione = pezzoSelezionato
        ? origineDaCella(pezzoSelezionato.shape, tastiera.cursore.row, tastiera.cursore.col)
        : null;
    }
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
  }, [drag.preso, drag.destinazione, drag.selezionato, tastiera.cursore,
      partita.hand, partita.grid, aiutoVisivo]);

  const pezzoTrascinato = drag.preso ? partita.hand[drag.preso.handIndex] : null;

  /**
   * Posizione dei punti volanti, in percentuale sulla plancia.
   *
   * I valori vengono riportati verso il centro: l'etichetta e' larga (un "+612" con
   * sotto la scritta ECCELLENTE) ed e' centrata sulla cella, quindi su una mossa fatta
   * nell'ultima colonna finiva mezza fuori dallo schermo. Meglio un numero spostato di
   * mezza cella che un numero tagliato: serve a far vedere quanto hai guadagnato.
   */
  const puntiVolanti = effetti.puntiVolanti;
  const dentro = (percentuale, margine) =>
    Math.max(margine, Math.min(100 - margine, percentuale));
  const posizionePunti = puntiVolanti != null
    ? {
      left: `${dentro(((colOf(puntiVolanti.cella) + 0.5) / 9) * 100, 22)}%`,
      top: `${dentro(((rowOf(puntiVolanti.cella) + 0.5) / 9) * 100, 12)}%`,
    }
    : null;

  return (
    <div className="pl-screen pl-screen--gioco">
      <Hud
        punteggio={partita.score}
        record={record.best}
        onMenu={onMenu}
        scatta={Boolean(puntiVolanti)}
        t={t}
      />

      {/* Nei Quadri l'obiettivo sta sopra la plancia: e' l'unica informazione che
          serve PRIMA di muovere, mentre il punteggio si guarda dopo. */}
      {quadro && statoQuadro ? (
        <BarraObiettivo quadro={quadro} stato={statoQuadro} t={t} />
      ) : null}

      {/* Catena, plancia e suggerimento formano un blocco unico centrato: su schermi
          alti lo spazio che avanza diventa respiro attorno al tavolo da gioco, non
          tre buchi scollegati fra elementi che parlano della stessa cosa. */}
      <div className="pl-plancia-area">
        <div className="pl-tavolo">
          <BarraCatena livello={partita.chain} t={t} />

          <div className="pl-plancia-involucro">
            <Plancia
              ref={plancia}
              grid={partita.grid}
              anteprima={anteprima?.celle}
              anteprimaColore={anteprima?.colore}
              anteprimaValida={anteprima?.valida ?? true}
              incandidate={anteprima?.incandidate}
              appoggiate={effetti.appoggiate}
              esplosioni={effetti.esplosioni}
              celleEsplose={effetti.celleEsplose}
              cursore={tastiera.cursore}
              pezzoInMano={drag.selezionato !== null}
              t={t}
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
                className={`pl-punti-volanti pl-punti-volanti--${puntiVolanti.tier ?? 'buona'}`}
                style={posizionePunti}
              >
                +{puntiVolanti.punti}
                {puntiVolanti.tier && puntiVolanti.tier !== 'buona' ? (
                  <span className="pl-etichetta-mossa">{puntiVolanti.tier}</span>
                ) : null}
              </span>
            ) : null}
          </div>

          <p className="pl-suggerimento">
            {drag.selezionato !== null ? t('gioca.tocca') : t('gioca.trascina')}
          </p>
          <p className="pl-sr">{t('a11y.istruzioni')}</p>
        </div>
      </div>

      <Tray
        mano={partita.hand}
        pezziMorti={pezziMorti}
        selezionato={drag.selezionato}
        presoIndex={drag.preso?.handIndex ?? null}
        onPointerDownPezzo={prendi}
        onTapPezzo={drag.selezionaPezzo}
        t={t}
      />

      {pezzoTrascinato && drag.preso ? (
        <div
          className="pl-trascinato"
          style={{ left: `${drag.preso.x}px`, top: `${drag.preso.y}px` }}
        >
          <Pezzo
            shape={pezzoTrascinato.shape}
            color={pezzoTrascinato.color}
            bombe={pezzoTrascinato.bombe}
            cella={drag.preso.cella}
          />
        </div>
      ) : null}

      <Annunci testo={frasePerMossa(partita.lastMove, t)} />
    </div>
  );
}
