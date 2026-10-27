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

/*
 * RILASCIO_DOVE_SI_STACCA (collaudo 1.21.25, D1; decisione PO-036): al `pointerup` la
 * casella si calcolava da `presoRef.current`, che si aggiorna solo quando React ridisegna
 * dopo l'ultimo `pointermove`. Rilasciando in fretta su una CPU lenta l'ultimo movimento
 * non era ancora disegnato e il pezzo andava dove il dito era un movimento prima: livello 1
 * a 360x640 col dito, CPU 4x, griglia diversa dal motore in 3 partite su 4 (alla mossa 8,
 * 11, 9). Acceso, riga e colonna si calcolano dalle coordinate dello stesso `pointerup`,
 * con la formula di `muovi`; col dito che rallenta e col mouse le coordinate sono le
 * stesse di prima e non cambia niente. Spento, torna il difetto: caso «rilascio veloce»
 * di `npm run precisione` rosso.
 */
export const RILASCIO_DOVE_SI_STACCA = true;

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
  // Se la scelta del pezzo e' arrivata dalla tastiera: decide se il cursore sulla
  // griglia deve comparire subito o solo quando lo si muove davvero.
  const [daTastiera, setDaTastiera] = useState(false);
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
      const x = RILASCIO_DOVE_SI_STACCA ? e.clientX - p.presaX * g.cella : p.x;
      const y = RILASCIO_DOVE_SI_STACCA ? e.clientY - p.presaY * g.cella - p.sollevamento : p.y;
      const row = Math.round((y - g.top) / g.passoY);
      const col = Math.round((x - g.left) / g.passoX);
      onPosiziona(p.handIndex, row, col);
    };

    // Un gesto ANNULLATO non e' un rilascio. Il sistema manda `pointercancel` quando si
    // prende il gesto per se' (scorrimento dal bordo, palmo, notifica): prima finiva
    // nello stesso `rilascia` e il pezzo veniva posato dove si trovava, una mossa che
    // nessuno aveva fatto (collaudo 1.21.6, B5). Adesso il pezzo torna in mano.
    const annulla = (e) => {
      const p = presoRef.current;
      if (!p || e.pointerId !== p.pointerId) return;
      setPreso(null);
    };

    window.addEventListener('pointermove', muovi, { passive: true });
    window.addEventListener('pointerup', rilascia);
    window.addEventListener('pointercancel', annulla);
    return () => {
      window.removeEventListener('pointermove', muovi);
      window.removeEventListener('pointerup', rilascia);
      window.removeEventListener('pointercancel', annulla);
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
   * Sceglie un pezzo con un tocco (o con Invio sul pulsante del vassoio).
   *
   * E' il primo passo della modalita' alternativa a due tocchi, che serve a chi non
   * riesce a trascinare: difficolta' motorie, schermi molto piccoli, mouse senza un
   * drag comodo. Il secondo passo e' `posizionaSuCella`.
   *
   * SI RICORDA DA DOVE ARRIVA LA SCELTA, e non e' un dettaglio implementativo: il
   * cursore sulla griglia e' uno strumento della tastiera -- esiste perche' le frecce
   * lo muovano -- e comparire anche per chi gioca col dito significa accendere al
   * centro della griglia una destinazione che quel giocatore non ha scelto, e che non
   * e' nemmeno quella dove il pezzo andra': toccando una casella il pezzo va li'.
   *
   * `detail === 0` distingue le due strade in modo standard: un click prodotto da
   * Invio o Spazio su un pulsante non ha un numero di clic, un tocco si'.
   */
  const selezionaPezzo = useCallback(
    (handIndex, evento) => {
      if (!attivo || !mano[handIndex]) return;
      setDaTastiera(evento ? evento.detail === 0 : false);
      setSelezionato((prec) => (prec === handIndex ? null : handIndex));
    },
    [attivo, mano],
  );

  /**
   * Appoggia il pezzo scelto sulla cella toccata: il secondo passo dei due tocchi.
   *
   * Il pezzo viene centrato sulla cella e poi RIPORTATO DENTRO la griglia. Senza questo
   * rientro, toccare una cella sul bordo con un pezzo alto tre non faceva assolutamente
   * nulla, e un gesto che non produce effetto e' peggio di un gesto che produce un
   * effetto leggermente spostato.
   */
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
    selezionatoDaTastiera: daTastiera,
    posizionaSuCella,
    annulla,
  };
}
