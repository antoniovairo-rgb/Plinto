import { useEffect, useRef, useState } from 'react';
import { COLOR_COUNT, TINTA_SOGLIA } from '../config/rules.js';
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
  ATTESA_INCITAMENTO, DURATA_SVUOTAMENTO,
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

/**
 * Il colore con cui brucia una bomba: lo stesso giallo della miccia che il giocatore
 * vede acceso sul blocco prima di farlo saltare. Letto dal foglio di stile, cosi' se
 * i temi cambiano la bomba cambia con loro invece di restare indietro.
 */
function coloreBomba() {
  if (typeof window === 'undefined') return '#ffd23d';
  const valore = getComputedStyle(document.documentElement)
    .getPropertyValue('--pl-bomba-scintilla');
  return valore.trim() || '#ffd23d';
}

export function useEffettiMossa({ lastMove, campo, cellRefs, plancia, animazioni }) {
  const [appoggiate, setAppoggiate] = useState(null);
  const [esplosioni, setEsplosioni] = useState(null);
  const [celleEsplose, setCelleEsplose] = useState(null);
  const [puntiVolanti, setPuntiVolanti] = useState(null);
  const [incita, setIncita] = useState(null);
  const [svuotata, setSvuotata] = useState(null);
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
      // La frase entra DOPO i punti, non insieme: vedi ATTESA_INCITAMENTO in durate.js.
      timers.push(setTimeout(
        () => setIncita({ chiave: lastMove.moveNumber, ...premio, variante }),
        ATTESA_INCITAMENTO,
      ));
      timers.push(setTimeout(() => setIncita(null), ATTESA_INCITAMENTO + DURATA_INCITAMENTO));
    }

    if (!animazioni) return () => timers.forEach(clearTimeout);

    // --- pop delle celle appena appoggiate ----------------------------------
    setAppoggiate(new Set(lastMove.placedCells));
    timers.push(setTimeout(() => setAppoggiate(null), DURATA_ATTERRAGGIO));

    // --- celle che stanno sparendo ------------------------------------------
    if (gruppi > 0) {
      const colore = coloreBlocco(lastMove.color);
      const tintaPiena = (lastMove.breakdown?.tintaMassima ?? 0) >= TINTA_SOGLIA;
      setEsplosioni({ celle: new Set(lastMove.clearedCells), colore, tinta: tintaPiena });
      setCelleEsplose(new Set(lastMove.celleEsplose ?? []));
      timers.push(setTimeout(() => { setEsplosioni(null); setCelleEsplose(null); }, DURATA_ESPLOSIONE));

      // --- particelle ------------------------------------------------------
      if (campo.current && plancia.current) {
        const base = plancia.current.getBoundingClientRect();
        // Dove sta ogni cella sulla plancia, in coordinate del canvas. Si misura una
        // volta sola e serve a tutti gli effetti qui sotto: chiedere due volte al
        // browser la stessa posizione costa un ricalcolo del layout per cella.
        const posizioni = new Map();
        for (const indice of lastMove.clearedCells) {
          const nodo = cellRefs.current[indice];
          if (!nodo) continue;
          const r = nodo.getBoundingClientRect();
          posizioni.set(indice, { x: r.left - base.left, y: r.top - base.top, lato: r.width });
        }

        const esplose = new Set(lastMove.celleEsplose ?? []);
        // La Tinta e' scattata: e' un premio raro (una eliminazione su dieci), quindi
        // ha diritto a schegge piu' grosse e piu' lente. Senza questo pagherebbe in
        // silenzio, che e' il difetto da cui la Tinta era nata.
        const tinta = (lastMove.breakdown?.tintaMassima ?? 0) >= TINTA_SOGLIA;
        const brillantezza = tinta ? 1.45 : 1;

        const normali = [];
        const bomba = [];
        for (const [indice, p] of posizioni) {
          (esplose.has(indice) ? bomba : normali).push({ ...p, colore });
        }
        if (normali.length > 0) campo.current.esplodi(normali, gruppi, brillantezza);
        // Le celle fatte saltare dalle bombe bruciano invece di sbriciolarsi: colore
        // proprio della bomba e schegge piu' violente. Ora che un'esplosione grossa
        // vale piu' punti di una piccola, deve anche VEDERSI piu' grossa.
        if (bomba.length > 0) {
          const fuoco = coloreBomba();
          campo.current.esplodi(
            bomba.map((p) => ({ ...p, colore: fuoco })),
            gruppi + 2,
            1.6 + Math.min(1, bomba.length / 12),
          );
        }

        // --- onde d'urto: una per gruppo chiuso, piu' una per le bombe ---------
        const centri = [];
        for (const gruppo of lastMove.groups) {
          const celle = gruppo.cells.map((i) => posizioni.get(i)).filter(Boolean);
          if (celle.length === 0) continue;
          const lato = celle[0].lato;
          const cx = celle.reduce((a, p) => a + p.x + lato / 2, 0) / celle.length;
          const cy = celle.reduce((a, p) => a + p.y + lato / 2, 0) / celle.length;
          // La forma dell'onda segue la forma di cio' che e' sparito: e' cosi' che si
          // capisce a colpo d'occhio SE e' caduta una riga, una colonna o un quadrante.
          // I tre casi hanno misure proprie e NON derivate dal numero di celle: riga,
          // colonna e quadrante ne hanno nove ciascuno, e calcolando dal conteggio il
          // quadrante riceveva l'onda larga della riga -- un cerchio che copriva mezzo
          // tabellone senza dire da dove veniva. Visto a schermo prima di correggerlo.
          const lunga = lato * 5;
          const corta = lato * 1.4;
          const tonda = lato * 2.2;
          const dimensioni = gruppo.type === 'quadrant'
            ? { raggioX: tonda, raggioY: tonda }
            : {
              raggioX: gruppo.type === 'col' ? corta : lunga,
              raggioY: gruppo.type === 'col' ? lunga : corta,
            };
          centri.push({
            x: cx,
            y: cy,
            ...dimensioni,
            colore,
            spessore: tinta ? 4.5 : 3,
          });
        }
        if (bomba.length > 0) {
          const celle = bomba;
          const lato = celle[0].lato;
          const cx = celle.reduce((a, p) => a + p.x + lato / 2, 0) / celle.length;
          const cy = celle.reduce((a, p) => a + p.y + lato / 2, 0) / celle.length;
          // Raggio contenuto e anello piu' acceso degli altri: la deflagrazione deve
          // vedersi PIU' delle onde del gruppo, non piu' larga. Un cerchio grande e
          // pallido, provato a schermo, non sembrava un'esplosione: sembrava un errore
          // di disegno.
          const raggio = lato * (0.8 + celle.length * 0.1);
          centri.push({
            x: cx,
            y: cy,
            raggioX: raggio,
            raggioY: raggio,
            colore: coloreBomba(),
            spessore: 5,
            opacita: 0.85,
          });
        }
        if (centri.length > 0) campo.current.onda(centri);
      }
    }

    // --- griglia svuotata: il lampo su tutta la plancia -----------------------
    // Va DOPO le esplosioni di proposito: prima i blocchi se ne vanno, poi si vede
    // che non ne e' rimasto nessuno. E' l'ordine in cui il giocatore capisce cosa e'
    // successo, non il contrario.
    if (lastMove.boardCleared) {
      setSvuotata(lastMove.moveNumber);
      timers.push(setTimeout(() => setSvuotata(null), DURATA_SVUOTAMENTO));
      if (campo.current && plancia.current) {
        const r = plancia.current.getBoundingClientRect();
        campo.current.onda([{
          x: r.width / 2,
          y: r.height / 2,
          raggioX: r.width * 0.62,
          raggioY: r.height * 0.62,
          colore: coloreBlocco(lastMove.color),
          spessore: 6,
        }]);
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

  return { appoggiate, esplosioni, celleEsplose, puntiVolanti, incita, svuotata };
}
