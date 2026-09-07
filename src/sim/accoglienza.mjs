/**
 * Quanto bene una griglia ACCOGLIE la terna successiva.
 *
 * A COSA SERVE. I giocatori artificiali del progetto pianificano l'intera mano che
 * hanno davanti, ma finora si fermavano li': nessuno di loro guardava la terna
 * successiva, nemmeno quando il gioco gliela mostrava. Questo rendeva le misure
 * sull'anteprima meta' vere -- registravano il COSTO di estrarre in anticipo (il
 * generatore legge la griglia prima invece che dopo) e non il BENEFICIO di vedere cosa
 * arriva. Una misura che pesa solo il piatto sfavorevole non e' una misura prudente:
 * e' una misura sbagliata.
 *
 * COME. Non con una ricerca piu' profonda: aggiungere tre livelli di beam search a una
 * ricerca che ne ha gia' tre moltiplica il costo per centinaia, e le misure sui cento
 * livelli passerebbero da minuti a ore. Qui la terna successiva viene giocata AVIDAMENTE
 * -- un pezzo alla volta, la mossa migliore secondo il metro di chi chiama, senza
 * ramificare. E' un modello volutamente modesto di cosa fa una persona quando vede la
 * terna dopo: non ricalcola l'albero, guarda dove lasciare spazio.
 *
 * COSA NON MISURA. Un giocatore umano fortissimo con l'anteprima gioca meglio di cosi'.
 * Quindi il vantaggio misurato qui e' un LIMITE INFERIORE del vantaggio vero: se anche
 * questo modello modesto dice che i livelli diventano piu' facili, lo diventano almeno
 * di tanto.
 */

import { allPlacements, placeShape, findCompletedGroups, clearGroups } from '../core/grid.js';

/**
 * Gioca avidamente `pezzi` sulla griglia e restituisce quanto vale l'operazione.
 *
 * @param {Uint8Array} grid la griglia di partenza
 * @param {Array} pezzi la terna successiva (puo' contenere buchi)
 * @param {(grigliaDopo: Uint8Array, gruppi: object[]) => number} valuta
 *        il metro di chi chiama: la stessa funzione con cui valuta le proprie mosse
 * @returns {{valore: number, bloccato: boolean}}
 *          `bloccato` e' vero se almeno un pezzo non trova posto: non e' un dettaglio
 *          di punteggio, e' la fine della partita, e chi chiama lo pesa a modo suo.
 */
export function accoglienza(grid, pezzi, valuta) {
  let corrente = grid;
  let valore = 0;
  let bloccato = false;

  for (const pezzo of pezzi ?? []) {
    if (!pezzo) continue;
    const case_ = allPlacements(corrente, pezzo.shape);
    if (case_.length === 0) { bloccato = true; break; }

    let migliore = null;
    for (const [row, col] of case_) {
      const { grid: posata } = placeShape(corrente, pezzo.shape, row, col, 1, pezzo.bombe);
      const gruppi = findCompletedGroups(posata);
      const { grid: dopo } = clearGroups(posata, gruppi);
      const v = valuta(dopo, gruppi);
      if (migliore === null || v > migliore.v) migliore = { v, dopo };
    }
    valore += migliore.v;
    corrente = migliore.dopo;
  }

  return { valore, bloccato };
}
