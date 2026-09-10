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
import { MODALITA } from '../config/rules.js';

/**
 * I Quadri si giocano VEDENDO la terna successiva.
 *
 * PERCHE' STANDARD E NON UN'OPZIONE. Un Quadro e' un problema con una soluzione: ha un
 * obiettivo dichiarato, un tetto di mosse e una griglia fissa. Un problema si risolve
 * ragionando, e non si puo' ragionare su un pezzo che non si sa se arrivera'. Senza
 * anteprima il livello resta in parte una scommessa; con l'anteprima quello che si
 * chiede al giocatore e' esattamente quello che il livello promette.
 *
 * PERCHE' NON UNA SCELTA FRA DUE MODI. Vedere avanti cambia l'ordine in cui il
 * generatore legge la griglia: lo stesso seme produce un'altra partita. Due modalita'
 * vorrebbero dire due tarature dei cento bersagli, e nessuna delle due sarebbe quella
 * vera per chi gioca nell'altra. Misurato: fra le due modalita' otto livelli su cento
 * cambiano completamente esito, non perche' uno sia piu' difficile ma perche' sono
 * problemi diversi con lo stesso numero.
 *
 * LA PARTITA LIBERA RESTA SENZA. La' non c'e' niente da risolvere: si dura finche' si
 * dura, e non sapere cosa arriva e' parte di cosa la rende una partita libera.
 */
export const MODALITA_QUADRI = MODALITA.ANTEPRIMA;

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
  // Quante volte, non quanto in alto. Il `?? 0` non e' difensivo per abitudine: una
  // partita salvata prima che questo contatore esistesse non ce l'ha, e senza il
  // ripiego un livello ripreso mostrerebbe NaN al posto dell'avanzamento.
  intrecci:   { progresso: (s) => s.stats.intrecci ?? 0 },
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
 * @param {object} [opzioni] `now` per rendere deterministica anche la durata,
 *   `modalita` solo per gli strumenti di misura, che devono poter giocare lo stesso
 *   livello nei due modi per confrontarli. Il gioco non la passa mai: usa
 *   MODALITA_QUADRI, che e' la definizione del percorso e non una preferenza.
 */
export function iniziaQuadro(quadro, opzioni = {}) {
  return createGame({
    seed: semeDelQuadro(quadro.numero),
    grigliaIniziale: quadro.griglia ? gridFromString(quadro.griglia, 3) : undefined,
    now: opzioni.now,
    modalita: opzioni.modalita ?? MODALITA_QUADRI,
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
