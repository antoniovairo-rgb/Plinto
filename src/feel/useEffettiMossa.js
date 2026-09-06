import { useEffect, useRef, useState } from 'react';
import { COLOR_COUNT } from '../config/rules.js';
import {
  suonoAppoggio, suonoEliminazione, suonoGrandeCombo, suonoGrigliaVuota, suonoFinePartita,
} from '../audio/suoni.js';
import {
  vibraAppoggio, vibraEliminazione, vibraCelebrazione, vibraFinePartita,
} from './vibrazione.js';

/**
 * Traduce una mossa del motore in cose che si vedono, si sentono e si sentono nel palmo.
 *
 * Il motore descrive COSA e' successo (celle appoggiate, gruppi chiusi, celle esplose,
 * punti, livello di celebrazione) e non sa nulla di animazioni. Qui, e solo qui, quella
 * descrizione diventa feedback. Cambiare il gioco non richiede di toccare questo file, e
 * cambiare gli effetti non richiede di toccare le regole.
 *
 * Le celle eliminate vengono ridisegnate per una frazione di secondo DOPO essere sparite
 * dallo stato: senza questo, l'eliminazione sarebbe uno scatto istantaneo e la mossa piu'
 * bella del gioco passerebbe inosservata.
 */

import { DURATA_ATTERRAGGIO, DURATA_ESPLOSIONE, DURATA_PUNTI } from './durate.js';

/** Legge dal foglio di stile il colore reale di una famiglia cromatica. */
function coloreBlocco(indice) {
  if (typeof window === 'undefined') return '#ffffff';
  const valore = getComputedStyle(document.documentElement)
    .getPropertyValue(`--pl-block-${((indice - 1) % COLOR_COUNT) + 1}`);
  return valore.trim() || '#ffffff';
}

export function useEffettiMossa({ lastMove, campo, cellRefs, plancia, animazioni }) {
  const [appoggiate, setAppoggiate] = useState(null);
  const [esplosioni, setEsplosioni] = useState(null);
  const [puntiVolanti, setPuntiVolanti] = useState(null);
  const ultimaMossa = useRef(null);

  useEffect(() => {
    if (!lastMove || lastMove === ultimaMossa.current) return undefined;
    ultimaMossa.current = lastMove;

    const gruppi = lastMove.groups.length;
    const timers = [];

    // --- suono e vibrazione -------------------------------------------------
    if (gruppi > 0) {
      suonoEliminazione(gruppi, lastMove.chainBefore);
      vibraEliminazione(gruppi);
      if (lastMove.tier === 'eccellente' || lastMove.tier === 'perfetta') {
        suonoGrandeCombo(lastMove.chainBefore);
      }
      if (lastMove.boardCleared) { suonoGrigliaVuota(); vibraCelebrazione(); }
    } else {
      suonoAppoggio();
      vibraAppoggio();
    }
    if (lastMove.gameOver) {
      timers.push(setTimeout(() => { suonoFinePartita(); vibraFinePartita(); }, 420));
    }

    if (!animazioni) return () => timers.forEach(clearTimeout);

    // --- pop delle celle appena appoggiate ----------------------------------
    setAppoggiate(new Set(lastMove.placedCells));
    timers.push(setTimeout(() => setAppoggiate(null), DURATA_ATTERRAGGIO));

    // --- celle che stanno sparendo ------------------------------------------
    if (gruppi > 0) {
      const colore = coloreBlocco(lastMove.color);
      setEsplosioni({ celle: new Set(lastMove.clearedCells), colore });
      timers.push(setTimeout(() => setEsplosioni(null), DURATA_ESPLOSIONE));

      // --- particelle ------------------------------------------------------
      if (campo.current && plancia.current) {
        const base = plancia.current.getBoundingClientRect();
        const punti = [];
        for (const indice of lastMove.clearedCells) {
          const nodo = cellRefs.current[indice];
          if (!nodo) continue;
          const r = nodo.getBoundingClientRect();
          punti.push({ x: r.left - base.left, y: r.top - base.top, lato: r.width, colore });
        }
        campo.current.esplodi(punti, gruppi);
      }
    }

    // --- punti che salgono ---------------------------------------------------
    if (lastMove.points > 0) {
      setPuntiVolanti({
        chiave: lastMove.moveNumber,
        punti: lastMove.points,
        tier: lastMove.tier,
        cella: lastMove.placedCells[0],
      });
      timers.push(setTimeout(() => setPuntiVolanti(null), DURATA_PUNTI));
    }

    return () => timers.forEach(clearTimeout);
  }, [lastMove, campo, cellRefs, plancia, animazioni]);

  return { appoggiate, esplosioni, puntiVolanti };
}
