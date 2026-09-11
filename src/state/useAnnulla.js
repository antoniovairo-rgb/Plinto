import { useEffect, useRef, useState } from 'react';
import { annullabile } from '../core/engine.js';

/**
 * Il "rimetti a posto": ricordare lo stato di un istante fa, e saperci tornare.
 *
 * PERCHE' UN EFFETTO E NON UN CALCOLO DENTRO LA MOSSA. Chi gioca chiama una funzione che
 * aggiorna lo stato; per sapere com'era PRIMA bisognerebbe leggerlo mentre lo si
 * sostituisce, che e' proprio il momento in cui non e' affidabile. Qui invece si guarda
 * lo stato DOPO che React lo ha reso: si confronta con quello reso la volta prima, e la
 * regola decide. Nessun effetto collaterale durante il disegno, e funziona uguale per la
 * partita libera, per la sfida e per i livelli.
 *
 * La memoria e' lunga UNA mossa, di proposito. Non serve una pila: chi sbaglia il dito
 * se ne accorge subito, e una pila lunga sarebbe un'altra cosa -- la possibilita' di
 * riavvolgere la partita, che e' esattamente cio' che questa funzione non vuole essere.
 *
 * @param {object|null} partita lo stato corrente
 * @param {(s:object)=>void} ripristina come rimettere in gioco uno stato precedente
 * @returns {{siPuoAnnullare: boolean, annulla: () => boolean}}
 */
export function useAnnulla(partita, ripristina) {
  const reso = useRef(null);        // lo stato visto all'ultimo disegno
  const indietro = useRef(null);    // lo stato a cui si puo' tornare, se si puo'
  const [siPuoAnnullare, setSiPuoAnnullare] = useState(false);

  useEffect(() => {
    const prima = reso.current;
    reso.current = partita;
    const puo = annullabile(prima, partita);
    indietro.current = puo ? prima : null;
    setSiPuoAnnullare(puo);
  }, [partita]);

  function annulla() {
    const meta = indietro.current;
    if (!meta) return false;
    // Si azzera PRIMA di ripristinare: senza, l'effetto qui sopra vedrebbe il ritorno
    // come un cambio di stato qualunque e potrebbe lasciare il pulsante acceso su una
    // mossa che non esiste piu'.
    indietro.current = null;
    reso.current = meta;
    setSiPuoAnnullare(false);
    ripristina(meta);
    return true;
  }

  return { siPuoAnnullare, annulla };
}
