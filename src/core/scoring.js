/**
 * Sistema di punteggio di PLINTO.
 *
 * Tre livelli, tutti visibili al giocatore mentre gioca:
 *   1. CELLE      -> punti minimi per ogni cella appoggiata: feedback continuo.
 *   2. INTRECCIO  -> chiudere piu' gruppi con una sola mossa moltiplica il valore.
 *   3. CATENA     -> moltiplicatore persistente che CRESCE quando elimini e cala di
 *                    uno solo se stai fermo per un'intera mano. Non si azzera mai.
 *   4. TINTA      -> un gruppo chiuso vale di piu' se molte delle sue celle hanno lo
 *                    stesso colore. Non e' un quarto moltiplicatore: aumenta il VALORE
 *                    del gruppo, quindi passa sotto Intreccio e Catena come tutto il
 *                    resto. Un bonus che scavalcasse la Catena sarebbe punteggio
 *                    scollegato dal ritmo della partita.
 *
 * La Catena e' la firma di PLINTO: trasforma la partita in una tensione continua
 * ("non spezzare la catena") senza aggiungere una sola regola sul tabellone.
 *
 * Trasparenza (regola di equita'): il moltiplicatore applicato e' quello che il
 * giocatore VEDE nell'interfaccia prima di muovere, cioe' la Catena PRIMA della mossa.
 * L'aumento vale dalla mossa successiva. Nessun calcolo nascosto.
 */

import {
  POINTS_PER_CELL,
  GROUP_BASE_POINTS,
  INTRECCIO_STEP,
  CHAIN_MAX,
  CHAIN_STEP,
  CHAIN_DECAY,
  CHAIN_GRACE,
  CHAIN_STEP_UP,
  BOARD_CLEAR_BONUS,
  PUNTI_CELLA_ESPLOSA,
  TINTA_SOGLIA,
  TINTA_PASSO,
  COLOR_COUNT,
  VALORE_BOMBA,
} from '../config/rules.js';

/**
 * Quante celle dello stesso colore ci sono, al massimo, in un insieme di celle.
 *
 * Le bombe contano per il loro colore: sulla plancia una bomba e' un blocco come gli
 * altri, e chi guarda vede un blocco arancione, non "una bomba". Farla contare a parte
 * significherebbe che una riga che SEMBRA tutta arancione non paga, senza che niente
 * spieghi perche'.
 */
export function maggioranzaColore(grid, cells) {
  const conteggi = new Uint8Array(COLOR_COUNT + 1);
  for (const cella of cells) {
    const valore = grid[cella];
    if (valore === 0) continue;
    const colore = valore > VALORE_BOMBA ? valore - VALORE_BOMBA : valore;
    if (colore >= 1 && colore <= COLOR_COUNT) conteggi[colore] += 1;
  }
  let massimo = 0;
  for (let c = 1; c <= COLOR_COUNT; c += 1) if (conteggi[c] > massimo) massimo = conteggi[c];
  return massimo;
}

/**
 * Di quanto la Tinta aumenta il valore di un gruppo: 0 sotto la soglia, poi lineare.
 * @returns {number} frazione da aggiungere (0 = niente, 0.2 = +20%)
 */
export function fattoreTinta(maggioranza) {
  if (maggioranza < TINTA_SOGLIA) return 0;
  return (maggioranza - (TINTA_SOGLIA - 1)) * TINTA_PASSO;
}

/** Moltiplicatore associato a un livello di Catena. Livello 0 => x1. */
export function chainMultiplier(level) {
  return 1 + CHAIN_STEP * level;
}

/** Moltiplicatore Intreccio per un numero di gruppi chiusi nella stessa mossa. */
export function intrecciMultiplier(groupCount) {
  if (groupCount <= 0) return 0;
  return 1 + INTRECCIO_STEP * (groupCount - 1);
}

/**
 * Nuovo stato della Catena dopo una mossa.
 *
 * `digiuno` conta le mosse di fila senza eliminazioni. La Catena non cala finche' il
 * digiuno resta entro CHAIN_GRACE: si perde solo se si sta fermi per un'intera mano.
 *
 * @param {number} level livello attuale
 * @param {number} groupCount gruppi chiusi con questa mossa
 * @param {number} digiuno mosse consecutive senza eliminazioni prima di questa
 * @returns {{livello:number, digiuno:number}}
 */
export function nextChainState(level, groupCount, digiuno = 0) {
  if (groupCount > 0) {
    return { livello: Math.min(CHAIN_MAX, level + CHAIN_STEP_UP), digiuno: 0 };
  }
  const prossimoDigiuno = digiuno + 1;
  if (prossimoDigiuno <= CHAIN_GRACE) return { livello: level, digiuno: prossimoDigiuno };
  return { livello: Math.max(0, level - CHAIN_DECAY), digiuno: prossimoDigiuno };
}

/** Mosse di tolleranza ancora disponibili prima che la Catena cali. */
export function respiroRimasto(digiuno) {
  return Math.max(0, CHAIN_GRACE - digiuno);
}

/**
 * Calcola il punteggio di una singola mossa.
 * @param {object} move
 * @param {number} move.placedCellCount celle appoggiate dal pezzo
 * @param {{type:string}[]} move.groups gruppi completati
 * @param {number} move.chainLevel livello di Catena PRIMA della mossa
 * @param {boolean} move.boardCleared la griglia e' rimasta completamente vuota
 * @returns {{
 *   points:number, chainAfter:number, chainUsed:number,
 *   breakdown:{placement:number, groupsBase:number, intreccio:number, chain:number, clearPoints:number, boardClear:number}
 * }}
 */
export function scoreMove({
  placedCellCount, groups, chainLevel, chainFast = 0, boardCleared, explodedCellCount = 0,
  // La griglia DOPO la posa e PRIMA di svuotare: e' l'unico istante in cui i colori del
  // gruppo chiuso esistono ancora. Facoltativa perche' senza di lei il punteggio resta
  // quello di prima, e le prove che non la passano continuano a valere.
  grid = null,
}) {
  const placement = placedCellCount * POINTS_PER_CELL;

  let groupsBase = 0;
  let tinta = 0;
  let tintaMassima = 0;
  for (const group of groups) {
    const base = GROUP_BASE_POINTS[group.type] ?? 0;
    groupsBase += base;
    if (grid && group.cells) {
      const maggioranza = maggioranzaColore(grid, group.cells);
      tinta += base * fattoreTinta(maggioranza);
      if (fattoreTinta(maggioranza) > 0 && maggioranza > tintaMassima) tintaMassima = maggioranza;
    }
  }

  const intreccio = intrecciMultiplier(groups.length);
  const chain = chainMultiplier(chainLevel);
  const clearPoints = groups.length > 0 ? Math.round((groupsBase + tinta) * intreccio * chain) : 0;
  // Le celle portate via dalle bombe oltre al gruppo: seguono la Catena come tutto
  // il resto, altrimenti sarebbero un punteggio scollegato dal ritmo della partita.
  const esplosioni = Math.round(explodedCellCount * PUNTI_CELLA_ESPLOSA * chain);
  const boardClear = boardCleared && groups.length > 0 ? BOARD_CLEAR_BONUS : 0;

  const dopo = nextChainState(chainLevel, groups.length, chainFast);

  return {
    points: placement + clearPoints + esplosioni + boardClear,
    chainAfter: dopo.livello,
    chainFastAfter: dopo.digiuno,
    chainUsed: chainLevel,
    breakdown: {
      placement, groupsBase, intreccio, chain, clearPoints, esplosioni, boardClear,
      // `tintaMassima` serve all'interfaccia: senza dirlo, la Tinta resterebbe invisibile
      // esattamente come il colore che l'ha fatta nascere.
      tinta: Math.round(tinta), tintaMassima,
    },
  };
}

/**
 * Etichetta con cui l'interfaccia celebra una mossa.
 * Serve al layer di game feel per scegliere l'intensita' del feedback.
 * @returns {null|'buona'|'ottima'|'eccellente'|'perfetta'}
 */
export function moveTier(groupCount, chainLevel, celleEsplose = 0) {
  if (groupCount <= 0) return null;
  const heat = groupCount + Math.floor(chainLevel / 3) + Math.floor(celleEsplose / 8);
  if (heat >= 6) return 'perfetta';
  if (heat >= 4) return 'eccellente';
  if (heat >= 2) return 'ottima';
  return 'buona';
}
