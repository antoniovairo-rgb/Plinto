/**
 * Quadri: il percorso a livelli di PLINTO.
 *
 * Un Quadro e' una partita normale con due aggiunte: uno o piu' OBIETTIVI da
 * raggiungere e, spesso, un TETTO DI MOSSE entro cui farlo. Le regole del gioco non
 * cambiano di una virgola: cambia solo la condizione di vittoria.
 *
 * Scelte di progetto
 *
 * 1. SEME FISSATO PER QUADRO. Il generatore parte sempre dallo stesso seme, quindi lo
 *    stesso Quadro e' lo stesso problema per tutti e per ogni tentativo. Non e' pero'
 *    una sequenza di pezzi imparabile a memoria: il generatore reagisce alla griglia,
 *    quindi giocando diversamente si ricevono pezzi diversi. Si puo' ragionare sul
 *    livello senza poterlo mandare a memoria.
 *
 * 2. GLI OSTACOLI SONO BLOCCHI NORMALI. Le celle gia' piene all'inizio si eliminano
 *    come tutte le altre. Nessuna regola speciale da imparare: la difficolta' viene
 *    dallo spazio che manca, non da un'eccezione.
 *
 * 3. SI PERDE IN DUE MODI SOLI, entrambi dichiarati prima di cominciare: finire le
 *    mosse, oppure restare senza mosse possibili. Nessun tempo, nessuna penalita'
 *    nascosta, nessuna vita da consumare.
 */

import { createGame, placePiece } from './engine.js';
import { gridFromString } from './grid.js';
import { seedFromString } from './rng.js';

/**
 * Tipi di obiettivo riconosciuti.
 * Ogni voce sa leggere il progresso dallo stato della partita: aggiungere un tipo
 * significa aggiungere una riga qui, non toccare il motore.
 */
export const OBIETTIVI = {
  punteggio:  { progresso: (s) => s.score },
  gruppi:     { progresso: (s) => s.stats.clearedRows + s.stats.clearedCols + s.stats.clearedQuadrants },
  righe:      { progresso: (s) => s.stats.clearedRows },
  colonne:    { progresso: (s) => s.stats.clearedCols },
  quadranti:  { progresso: (s) => s.stats.clearedQuadrants },
  celle:      { progresso: (s) => s.stats.clearedCells },
  catena:     { progresso: (s) => s.stats.bestChain },
  intreccio:  { progresso: (s) => s.stats.bestIntreccio },
  pulizia:    { progresso: (s) => s.stats.boardClears },
  sopravvivi: { progresso: (s) => s.stats.moves },
};

/** Il seme di un Quadro dipende solo dal suo numero: stesso quadro, stesso problema. */
export function semeDelQuadro(numero) {
  return seedFromString(`plinto-quadro-${numero}`);
}

/**
 * Avvia la partita di un Quadro.
 * @param {object} quadro definizione presa da src/config/quadri.js
 * @param {object} [opzioni] `now` per rendere deterministica anche la durata
 */
export function iniziaQuadro(quadro, opzioni = {}) {
  return createGame({
    seed: semeDelQuadro(quadro.numero),
    grigliaIniziale: quadro.griglia ? gridFromString(quadro.griglia, 3) : undefined,
    now: opzioni.now,
  });
}

/**
 * Stato di avanzamento di un Quadro.
 *
 * @returns {{
 *   progressi: {tipo:string, quanti:number, fatto:number, completo:boolean}[],
 *   completato: boolean, fallito: boolean, finito: boolean,
 *   mosseRimaste: number|null, motivo: 'mosse'|'bloccato'|null
 * }}
 */
export function statoQuadro(quadro, partita) {
  const progressi = quadro.obiettivi.map(({ tipo, quanti }) => {
    const lettore = OBIETTIVI[tipo];
    if (!lettore) throw new Error(`Obiettivo sconosciuto: ${tipo}`);
    const fatto = Math.min(quanti, lettore.progresso(partita));
    return { tipo, quanti, fatto, completo: fatto >= quanti };
  });

  const completato = progressi.every((p) => p.completo);

  const mosseRimaste = quadro.maxMosse == null
    ? null
    : Math.max(0, quadro.maxMosse - partita.stats.moves);

  // L'ordine conta: chi raggiunge l'obiettivo con l'ultima mossa disponibile ha vinto,
  // non perso. Il controllo della vittoria viene sempre per primo.
  let motivo = null;
  if (!completato) {
    if (mosseRimaste === 0) motivo = 'mosse';
    else if (partita.status === 'over') motivo = 'bloccato';
  }

  return {
    progressi,
    completato,
    fallito: !completato && motivo !== null,
    finito: completato || motivo !== null,
    mosseRimaste,
    motivo,
  };
}

/** Il giocatore puo' ancora muovere in questo Quadro? */
export function quadroInCorso(quadro, partita) {
  return !statoQuadro(quadro, partita).finito;
}

/**
 * Applica una mossa dentro un Quadro. Rifiuta la mossa se il Quadro e' gia' finito:
 * senza questo, si potrebbe continuare a giocare dopo aver esaurito le mosse.
 */
export function giocaNelQuadro(quadro, partita, handIndex, row, col, now) {
  if (statoQuadro(quadro, partita).finito) return partita;
  return placePiece(partita, handIndex, row, col, now);
}
