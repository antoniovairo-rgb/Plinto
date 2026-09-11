import { useEffect, useRef, useState } from 'react';
import { COLOR_COUNT } from '../config/rules.js';
import {
  suonoAppoggio, suonoEliminazione, suonoGrandeCombo, suonoGrigliaVuota, suonoFinePartita,
  suonoCatenaGiu, suonoUltimaChiamata,
  suonoEsplosione,
} from '../audio/suoni.js';
import {
  vibraAppoggio, vibraEliminazione, vibraCelebrazione, vibraFinePartita, vibraEsplosione,
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

import {
  DURATA_ATTERRAGGIO, DURATA_ESPLOSIONE, DURATA_PUNTI, DURATA_INCITAMENTO,
} from './durate.js';
import { respiroRimasto } from '../core/scoring.js';
import { incitamento } from '../core/incitamenti.js';
import { VARIANTI_INCITA } from '../i18n/index.js';
import { creaSacchetti } from './sacchetto.js';

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
  const [celleEsplose, setCelleEsplose] = useState(null);
  const [puntiVolanti, setPuntiVolanti] = useState(null);
  const [incita, setIncita] = useState(null);
  const ultimaMossa = useRef(null);
  // I sacchetti delle frasi, uno per categoria: si pesca senza rimettere dentro, cosi'
  // escono tutte prima che una si ripeta. Vivono in un ref e non in uno stato perche'
  // cambiarli non deve ridisegnare niente: sono memoria, non interfaccia.
  const sacchetti = useRef(null);
  if (sacchetti.current === null) sacchetti.current = creaSacchetti();
  // Il digiuno della mossa precedente: serve a far suonare l'ultima chiamata UNA volta,
  // nel momento in cui il respiro finisce, e non a ogni mossa successiva.
  const ultimoDigiuno = useRef(0);

  useEffect(() => {
    if (!lastMove || lastMove === ultimaMossa.current) return undefined;
    ultimaMossa.current = lastMove;

    const gruppi = lastMove.groups.length;
    const timers = [];

    // --- suono e vibrazione -------------------------------------------------
    if (gruppi > 0) {
      suonoEliminazione(gruppi, lastMove.chainBefore);
      vibraEliminazione(gruppi);
      const bombe = lastMove.bombeDetonate?.length ?? 0;
      if (bombe > 0) {
        // Poco dopo l'eliminazione, non insieme: prima sparisce la riga, poi scoppia.
        timers.push(setTimeout(() => { suonoEsplosione(bombe); vibraEsplosione(bombe); }, 90));
      }
      if (lastMove.tier === 'eccellente' || lastMove.tier === 'perfetta') {
        suonoGrandeCombo(lastMove.chainBefore);
      }
      if (lastMove.boardCleared) { suonoGrigliaVuota(); vibraCelebrazione(); }
    } else {
      suonoAppoggio();
      vibraAppoggio();
      // La Catena e' scesa: si sente, un grado sotto e con un timbro piu' spento. Non
      // e' un suono di errore, perche' perdere la Catena non e' un errore -- e' una
      // conseguenza, e va raccontata come tale.
      if (lastMove.chainAfter < lastMove.chainBefore) {
        timers.push(setTimeout(() => suonoCatenaGiu(lastMove.chainBefore), 120));
      }
    }

    // ULTIMA CHIAMATA: il respiro e' finito e la Catena e' ancora accesa, quindi la
    // prossima mossa a vuoto la fa calare. E' l'unica informazione del gioco che fino a
    // ieri passava SOLO dagli occhi: chi non guarda la barra in quel momento non la
    // riceveva affatto. Suona una volta sola, quando il respiro finisce, non a ogni
    // mossa: un avviso che si ripete non e' un avviso.
    if (
      lastMove.chainAfter > 0
      && respiroRimasto(lastMove.chainDigiunoAfter ?? 0) === 0
      && (lastMove.chainDigiunoAfter ?? 0) > 0
      && (ultimoDigiuno.current ?? 0) === 0
    ) {
      timers.push(setTimeout(() => suonoUltimaChiamata(lastMove.chainAfter), 200));
    }
    ultimoDigiuno.current = lastMove.chainDigiunoAfter ?? 0;
    if (lastMove.gameOver) {
      timers.push(setTimeout(() => { suonoFinePartita(); vibraFinePartita(); }, 420));
    }

    // --- la frase di incitamento ---------------------------------------------
    // Sta PRIMA della guardia sulle animazioni di proposito. Chi ha spento gli effetti
    // ha chiesto uno schermo piu' calmo, non un gioco che smette di parlargli: la frase
    // resta, e' il modo in cui compare che cambia (lo decide il foglio di stile).
    const premio = incitamento(lastMove);
    if (premio) {
      const quante = VARIANTI_INCITA[premio.categoria] ?? 1;
      const variante = sacchetti.current(premio.categoria, quante);
      setIncita({ chiave: lastMove.moveNumber, ...premio, variante });
      timers.push(setTimeout(() => setIncita(null), DURATA_INCITAMENTO));
    }

    if (!animazioni) return () => timers.forEach(clearTimeout);

    // --- pop delle celle appena appoggiate ----------------------------------
    setAppoggiate(new Set(lastMove.placedCells));
    timers.push(setTimeout(() => setAppoggiate(null), DURATA_ATTERRAGGIO));

    // --- celle che stanno sparendo ------------------------------------------
    if (gruppi > 0) {
      const colore = coloreBlocco(lastMove.color);
      setEsplosioni({ celle: new Set(lastMove.clearedCells), colore });
      setCelleEsplose(new Set(lastMove.celleEsplose ?? []));
      timers.push(setTimeout(() => { setEsplosioni(null); setCelleEsplose(null); }, DURATA_ESPLOSIONE));

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
        // Quante celle dello stesso colore aveva il gruppo chiuso. Senza portarla fin
        // qui la Tinta pagherebbe in silenzio, e sarebbe di nuovo una regola che il
        // giocatore deve indovinare: e' esattamente il difetto da cui e' nata.
        tinta: lastMove.breakdown?.tintaMassima ?? 0,
        cella: lastMove.placedCells[0],
      });
      timers.push(setTimeout(() => setPuntiVolanti(null), DURATA_PUNTI));
    }

    return () => timers.forEach(clearTimeout);
  }, [lastMove, campo, cellRefs, plancia, animazioni]);

  return { appoggiate, esplosioni, celleEsplose, puntiVolanti, incita };
}
