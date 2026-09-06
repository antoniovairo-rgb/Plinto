import { useCallback, useEffect, useState } from 'react';
import { GRID_SIZE } from '../config/rules.js';

/**
 * Gioco da tastiera.
 *
 * Un puzzle che si gioca solo trascinando esclude chi usa la tastiera, chi naviga con
 * un lettore di schermo e chi ha difficolta' motorie fini. Qui la partita e' completa
 * senza mai toccare il puntatore:
 *
 *   Tab            scorre i tre pezzi
 *   Invio / Spazio prende o lascia il pezzo su cui sei
 *   Frecce         muovono il cursore sulla griglia
 *   Invio          appoggia il pezzo dove sei
 *   Esc            annulla la selezione
 *
 * Il cursore parte dal centro della griglia e non dall'angolo: e' il punto da cui si
 * raggiunge qualunque casella nel minor numero di pressioni.
 */

const CENTRO = { row: 4, col: 4 };

export function useTastiera({ attivo, selezionato, onPosiziona, onAnnulla, mano }) {
  const [cursore, setCursore] = useState(null);

  // Il cursore compare quando si sceglie un pezzo e sparisce quando si annulla.
  useEffect(() => {
    if (selezionato === null) setCursore(null);
    else setCursore((prec) => prec ?? { ...CENTRO });
  }, [selezionato]);

  const muovi = useCallback((dRiga, dColonna) => {
    setCursore((prec) => {
      const base = prec ?? { ...CENTRO };
      return {
        row: Math.max(0, Math.min(GRID_SIZE - 1, base.row + dRiga)),
        col: Math.max(0, Math.min(GRID_SIZE - 1, base.col + dColonna)),
      };
    });
  }, []);

  useEffect(() => {
    if (!attivo) return undefined;

    const premuto = (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      if (e.key === 'Escape') {
        if (selezionato !== null) { e.preventDefault(); onAnnulla(); }
        return;
      }

      // Le frecce servono solo quando un pezzo e' in mano: altrimenti la pagina
      // deve restare navigabile come qualunque altra.
      if (selezionato === null) return;

      const passi = {
        ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
        w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
      };
      const passo = passi[e.key];
      if (passo) {
        e.preventDefault();
        muovi(passo[0], passo[1]);
        return;
      }

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const pezzo = mano[selezionato];
        const posizione = cursore ?? CENTRO;
        if (pezzo) onPosiziona(selezionato, posizione.row, posizione.col);
      }
    };

    window.addEventListener('keydown', premuto);
    return () => window.removeEventListener('keydown', premuto);
  }, [attivo, selezionato, cursore, muovi, onPosiziona, onAnnulla, mano]);

  return { cursore, muovi };
}
