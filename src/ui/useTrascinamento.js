import { useCallback, useEffect, useRef, useState } from 'react';
import { idx } from '../core/grid.js';
import { GRID_SIZE } from '../config/rules.js';

/**
 * Trascinamento dei pezzi. E' il gesto che il giocatore ripete centinaia di volte
 * in una partita: qui si decide se il gioco e' piacevole o irritante.
 *
 * Scelte di game feel, tutte deliberate:
 *
 * 1. IL PEZZO SI SOLLEVA SOPRA IL DITO. Su touch il pezzo viene disegnato circa una
 *    cella e mezza piu' in alto del punto toccato. Senza questo, su telefono il dito
 *    copre esattamente la parte di griglia che serve guardare.
 * 2. IL PEZZO CRESCE ALLA SCALA DELLA GRIGLIA. Nel tray e' piu' piccolo; appena viene
 *    preso assume la dimensione esatta delle celle, cosi' l'anteprima e' letterale.
 * 3. LA PRESA RESTA COERENTE. Il punto della forma che hai afferrato resta sotto il
 *    dito anche dopo l'ingrandimento: si converte l'offset in unita' di cella.
 * 4. LO SNAP E' AL CENTRO PIU' VICINO, non al bordo: perdonare mezza cella di
 *    imprecisione elimina quasi tutti i posizionamenti sbagliati.
 * 5. MISURA REALE DELLE CELLE. Le coordinate si ricavano dai nodi DOM delle celle,
 *    non da calcoli su padding e gap: funziona a qualunque dimensione di schermo.
 */

/**
 * Dove finisce l'origine di una forma se il giocatore indica la cella (row, col).
 * La forma viene centrata sulla cella indicata e poi riportata dentro la griglia.
 * Usata dalla modalita' a due tocchi e da quella a tastiera: indicare una casella
 * deve voler dire la stessa cosa in entrambe.
 */
export function origineDaCella(shape, row, col) {
  const r = row - Math.floor((shape.height - 1) / 2);
  const c = col - Math.floor((shape.width - 1) / 2);
  return {
    row: Math.max(0, Math.min(GRID_SIZE - shape.height, r)),
    col: Math.max(0, Math.min(GRID_SIZE - shape.width, c)),
  };
}

/** Di quante celle il pezzo viene sollevato sopra il dito (solo su touch). */
const SOLLEVAMENTO_TOCCO = 1.35;

/** Misura la geometria reale della griglia leggendo i nodi delle celle. */
function misuraGriglia(cellRefs) {
  const primo = cellRefs.current[idx(0, 0)]?.getBoundingClientRect();
  const destra = cellRefs.current[idx(0, 8)]?.getBoundingClientRect();
  const basso = cellRefs.current[idx(8, 0)]?.getBoundingClientRect();
  if (!primo || !destra || !basso) return null;
  return {
    left: primo.left,
    top: primo.top,
    cella: primo.width,
    passoX: (destra.left - primo.left) / 8,
    passoY: (basso.top - primo.top) / 8,
  };
}

/**
 * @param {object} args
 * @param {object[]} args.mano pezzi attualmente in mano (null dove gia' usati)
 * @param {{current: (HTMLElement|null)[]}} args.cellRefs nodi delle 81 celle
 * @param {(handIndex:number, row:number, col:number) => void} args.onPosiziona
 * @param {boolean} args.attivo false blocca ogni interazione (es. a partita finita)
 */
export function useTrascinamento({ mano, cellRefs, onPosiziona, attivo = true }) {
  const [preso, setPreso] = useState(null);        // trascinamento in corso
  const [selezionato, setSelezionato] = useState(null); // modalita' a tocchi
  const geometria = useRef(null);
  const presoRef = useRef(null);

  presoRef.current = preso;

  const annulla = useCallback(() => {
    setPreso(null);
    setSelezionato(null);
  }, []);

  /** Inizio del trascinamento da un pezzo del tray. */
  const iniziaTrascinamento = useCallback(
    (evento, handIndex, cellaTray) => {
      if (!attivo || !mano[handIndex]) return;
      const g = misuraGriglia(cellRefs);
      if (!g) return;
      geometria.current = g;

      // Si misura il DISEGNO del pezzo, non il bottone che lo contiene: il bottone ha
      // un'imbottitura per essere comodo da toccare, e usare la sua origine sfasava il
      // posizionamento di quasi una cella. Su griglia vuota non si notava; su griglia
      // piena rendeva il gioco inutilizzabile.
      const nodo = evento.currentTarget.querySelector('.pl-pezzo') ?? evento.currentTarget;
      const rect = nodo.getBoundingClientRect();

      // Offset della presa espresso in unita' di cella: sopravvive al cambio di scala.
      // Viene riportato DENTRO il pezzo perche' l'area toccabile e' tutto lo slot,
      // piu' grande del disegno: senza questo, afferrare un angolo vuoto dello slot
      // farebbe comparire il pezzo spostato di una cella rispetto al dito.
      const forma = mano[handIndex].shape;
      const dentro = (valore, massimo) => Math.max(0.5, Math.min(massimo - 0.5, valore));
      const presaX = dentro((evento.clientX - rect.left) / cellaTray, forma.width);
      const presaY = dentro((evento.clientY - rect.top) / cellaTray, forma.height);
      const sollevamento = evento.pointerType === 'mouse' ? 0 : SOLLEVAMENTO_TOCCO * g.cella;

      setSelezionato(null);
      setPreso({
        handIndex,
        pointerId: evento.pointerId,
        presaX,
        presaY,
        sollevamento,
        x: evento.clientX - presaX * g.cella,
        y: evento.clientY - presaY * g.cella - sollevamento,
        cella: g.cella,
      });
    },
    [attivo, mano, cellRefs],
  );

  // Movimento e rilascio si ascoltano sulla finestra: il dito esce spesso dal pezzo.
  useEffect(() => {
    if (!preso) return undefined;

    const muovi = (e) => {
      if (e.pointerId !== presoRef.current?.pointerId) return;
      const g = geometria.current;
      if (!g) return;
      setPreso((p) =>
        p && {
          ...p,
          x: e.clientX - p.presaX * g.cella,
          y: e.clientY - p.presaY * g.cella - p.sollevamento,
        },
      );
    };

    const rilascia = (e) => {
      const p = presoRef.current;
      if (!p || e.pointerId !== p.pointerId) return;
      const g = geometria.current;
      setPreso(null);
      if (!g) return;
      const row = Math.round((p.y - g.top) / g.passoY);
      const col = Math.round((p.x - g.left) / g.passoX);
      onPosiziona(p.handIndex, row, col);
    };

    window.addEventListener('pointermove', muovi, { passive: true });
    window.addEventListener('pointerup', rilascia);
    window.addEventListener('pointercancel', rilascia);
    return () => {
      window.removeEventListener('pointermove', muovi);
      window.removeEventListener('pointerup', rilascia);
      window.removeEventListener('pointercancel', rilascia);
    };
  }, [preso !== null, onPosiziona]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Cella di destinazione attuale del pezzo trascinato. */
  const destinazione = (() => {
    if (!preso) return null;
    const g = geometria.current;
    if (!g) return null;
    return {
      row: Math.round((preso.y - g.top) / g.passoY),
      col: Math.round((preso.x - g.left) / g.passoX),
    };
  })();

  /**
   * Modalita' alternativa a due tocchi: serve a chi non riesce a trascinare
   * (difficolta' motorie, schermi molto piccoli, mouse senza drag comodo).
   *
   * Il pezzo viene centrato sulla cella toccata e poi RIPORTATO DENTRO la griglia.
   * Senza questo rientro, toccare una cella sul bordo con un pezzo alto tre non
   * faceva assolutamente nulla, e un gesto che non produce effetto e' peggio di
   * un gesto che produce un effetto leggermente spostato.
   */
  const selezionaPezzo = useCallback(
    (handIndex) => {
      if (!attivo || !mano[handIndex]) return;
      setSelezionato((prec) => (prec === handIndex ? null : handIndex));
    },
    [attivo, mano],
  );

  const posizionaSuCella = useCallback(
    (row, col) => {
      if (selezionato === null) return;
      const pezzo = mano[selezionato];
      if (!pezzo) return;
      const origine = origineDaCella(pezzo.shape, row, col);
      onPosiziona(selezionato, origine.row, origine.col);
      setSelezionato(null);
    },
    [selezionato, mano, onPosiziona],
  );

  return {
    preso,
    destinazione,
    selezionato,
    iniziaTrascinamento,
    selezionaPezzo,
    posizionaSuCella,
    annulla,
  };
}
