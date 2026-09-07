/**
 * Le tre distribuzioni di una partita: non "quanto" ha fatto il giocatore, ma COME.
 *
 * I contatori che il gioco teneva finora sono massimi e somme: punteggio, mosse,
 * Catena massima. Dicono il risultato e non dicono il modo. Queste tre invece
 * raccontano il modo, e sono la materia prima del profilo di gioco:
 *
 *   1. ISTOGRAMMA DELLA CATENA — quante mosse sono state giocate a ciascun livello
 *      di Catena. E' indicizzato sulla Catena **applicata** (`lastMove.chainBefore`),
 *      cioe' il moltiplicatore che il giocatore vedeva prima di muovere, non quello
 *      che si e' trovato dopo. E' la stessa regola di trasparenza del punteggio: si
 *      misura cio' che il giocatore ha davvero usato.
 *   2. ISTOGRAMMA DELL'INTRECCIO — quante mosse hanno chiuso 0, 1, 2, ... gruppi.
 *   3. MAPPA DEGLI APPOGGI — 81 contatori, uno per cella, incrementati sulla cella di
 *      ancoraggio del pezzo appoggiato. E' l'unico dato davvero personale del gioco:
 *      due giocatori con lo stesso punteggio hanno mappe diverse.
 *
 * Tutto qui dentro e' puro: nessun DOM, nessuna data, nessuna sorpresa. Il motore
 * chiama `conMossa` una volta per mossa e non sa altro.
 */

import { GRID_SIZE, CHAIN_MAX } from '../config/rules.js';
import { SHAPES } from './shapes.js';
import { quadrantOf, idx } from './grid.js';

/** Celle della griglia: la lunghezza della mappa degli appoggi. */
export const CELLE = GRID_SIZE * GRID_SIZE;

/**
 * Massimo numero di gruppi che UNA sola mossa puo' chiudere.
 *
 * Non e' un numero scelto a mano: e' dedotto dal catalogo delle forme, provando ogni
 * forma in ogni posizione e contando quante righe, colonne e quadranti distinti tocca.
 * Se domani si aggiunge una forma piu' larga, questo valore cresce da solo e l'array
 * non va ritoccato.
 *
 * Serve perche' l'intuizione qui sbaglia: sembra che una mossa possa chiudere al
 * massimo tre o quattro gruppi, e invece un blocco 3x3 appoggiato al centro di un
 * incrocio di quadranti ne tocca dieci (3 righe + 3 colonne + 4 quadranti). Un array
 * dimensionato "a occhio" avrebbe perso in silenzio proprio le mosse piu' rare, che
 * sono le uniche interessanti.
 */
export const MAX_GRUPPI_PER_MOSSA = (() => {
  let massimo = 0;
  for (const forma of SHAPES) {
    const altezza = Math.max(...forma.cells.map(([r]) => r));
    const larghezza = Math.max(...forma.cells.map(([, c]) => c));
    for (let riga = 0; riga + altezza < GRID_SIZE; riga += 1) {
      for (let colonna = 0; colonna + larghezza < GRID_SIZE; colonna += 1) {
        const righe = new Set();
        const colonne = new Set();
        const quadranti = new Set();
        for (const [dr, dc] of forma.cells) {
          righe.add(riga + dr);
          colonne.add(colonna + dc);
          quadranti.add(quadrantOf(riga + dr, colonna + dc));
        }
        massimo = Math.max(massimo, righe.size + colonne.size + quadranti.size);
      }
    }
  }
  return massimo;
})();

/** Le tre distribuzioni azzerate. */
export function distribuzioniVuote() {
  return {
    istogrammaCatena: new Array(CHAIN_MAX + 1).fill(0),
    istogrammaIntreccio: new Array(MAX_GRUPPI_PER_MOSSA + 1).fill(0),
    mappaAppoggi: new Array(CELLE).fill(0),
  };
}

/** Un array di interi non negativi della lunghezza attesa? */
function arrayValido(valore, lunghezza) {
  return Array.isArray(valore)
    && valore.length === lunghezza
    && valore.every((n) => Number.isInteger(n) && n >= 0);
}

/**
 * Riporta a una forma valida le distribuzioni lette da un salvataggio.
 *
 * Un array della lunghezza sbagliata (salvataggio di una versione con un catalogo
 * di forme diverso, o manomesso a mano) non va corretto a meta': si riparte da zero
 * per quella distribuzione. Meglio un istogramma vuoto, che si vede, di un istogramma
 * lungo nove che il codice tratta come lungo undici.
 */
export function normalizzaDistribuzioni(dati = {}) {
  const vuote = distribuzioniVuote();
  return {
    istogrammaCatena: arrayValido(dati.istogrammaCatena, CHAIN_MAX + 1)
      ? dati.istogrammaCatena.slice() : vuote.istogrammaCatena,
    istogrammaIntreccio: arrayValido(dati.istogrammaIntreccio, MAX_GRUPPI_PER_MOSSA + 1)
      ? dati.istogrammaIntreccio.slice() : vuote.istogrammaIntreccio,
    mappaAppoggi: arrayValido(dati.mappaAppoggi, CELLE)
      ? dati.mappaAppoggi.slice() : vuote.mappaAppoggi,
  };
}

/** Indice sempre dentro l'array. Vedi il commento di `conMossa`. */
function dentro(valore, lunghezza) {
  return Math.max(0, Math.min(lunghezza - 1, Math.trunc(valore)));
}

/**
 * Le distribuzioni dopo una mossa. Funzione pura: gli array in ingresso non si toccano.
 *
 * Gli indici sono **limitati** agli estremi invece che scartati, e la differenza conta:
 * un valore fuori scala verrebbe da un salvataggio manomesso o da un difetto, e in
 * entrambi i casi scartare la mossa romperebbe l'invariante che tiene in piedi tutto
 * il resto (la somma dell'istogramma della Catena e' il numero di mosse giocate). Un
 * conteggio finito nella casella sbagliata si nota; un conteggio sparito, no.
 *
 * @param {object} distribuzioni le tre distribuzioni correnti
 * @param {object} mossa
 * @param {number} mossa.catenaApplicata livello di Catena usato per il punteggio
 * @param {number} mossa.gruppi gruppi chiusi con questa mossa
 * @param {number} mossa.riga riga di ancoraggio del pezzo appoggiato
 * @param {number} mossa.colonna colonna di ancoraggio
 */
export function conMossa(distribuzioni, { catenaApplicata, gruppi, riga, colonna }) {
  const base = normalizzaDistribuzioni(distribuzioni);

  base.istogrammaCatena[dentro(catenaApplicata, base.istogrammaCatena.length)] += 1;
  base.istogrammaIntreccio[dentro(gruppi, base.istogrammaIntreccio.length)] += 1;
  base.mappaAppoggi[dentro(idx(dentro(riga, GRID_SIZE), dentro(colonna, GRID_SIZE)), CELLE)] += 1;

  return base;
}
