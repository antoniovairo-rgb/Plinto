/**
 * Motore di PLINTO: riduttore puro. Nessun DOM, nessun React, nessun timer.
 *
 * Tutto lo stato di una partita e' un oggetto serializzabile; ogni azione e' una
 * funzione (stato, argomenti) -> nuovo stato. Questo rende il gioco:
 *   - testabile senza browser,
 *   - simulabile a migliaia di partite in Node,
 *   - salvabile e ripristinabile con una JSON.stringify,
 *   - riproducibile bit per bit a parita' di seed.
 *
 * Il campo `lastMove` e' il canale verso il layer di game feel: descrive
 * COSA e' successo (celle appoggiate, gruppi chiusi, celle esplose, punti, livello
 * di celebrazione) senza sapere nulla di come verra' animato.
 */

import { HAND_SIZE, CHAIN_MAX, MODALITA } from '../config/rules.js';
import {
  createGrid,
  placeShape,
  findCompletedGroups,
  detonaBombe,
  svuotaCelle,
  canPlace,
  hasAnyPlacement,
  isEmpty,
  fillRatio,
  filledCount,
} from './grid.js';
import { generateHand, resetUid } from './generator.js';
import { conMossa, distribuzioniVuote, normalizzaDistribuzioni } from './distribuzioni.js';
import { getShape } from './shapes.js';
import { scoreMove, moveTier } from './scoring.js';
import { randomSeed, seedFromString } from './rng.js';

/**
 * Versione dello schema di stato: incrementarla se cambia la forma dei salvataggi.
 *
 * "Cambia la forma" vuol dire che un salvataggio vecchio non si puo' piu' leggere
 * correttamente, perche' `deserializeGame` RIFIUTA qualunque versione diversa da
 * questa: alzarla butta via la partita in corso di ogni giocatore che aggiorna. Per
 * un'aggiunta compatibile -- come i tre istogrammi, che i salvataggi vecchi non
 * hanno e che vengono semplicemente azzerati alla lettura -- il numero resta dov'e'.
 * Il campo si alza quando serve, non quando cambia qualcosa.
 */
export const STATE_VERSION = 1;

/** @returns {object} statistiche azzerate di una partita */
function emptyStats() {
  return {
    moves: 0,
    piecesPlaced: 0,
    cellsPlaced: 0,
    clearedRows: 0,
    clearedCols: 0,
    clearedQuadrants: 0,
    clearedCells: 0,
    bestMovePoints: 0,
    bestChain: 0,
    bestIntreccio: 0,
    // QUANTE VOLTE si e' chiuso piu' di un gruppo con una mossa sola, non solo il
    // massimo raggiunto. `bestIntreccio` e' un PICCO: sale a 2 la prima volta e non si
    // muove piu', quindi un obiettivo costruito su di lui e' un colpo solo e non puo'
    // crescere. Contare le occorrenze lo rende una richiesta di costanza, che si puo'
    // chiedere in dose crescente come tutte le altre.
    intrecci: 0,
    boardClears: 0,
    bombeEsplose: 0,
    celleEsplose: 0,
    handsDealt: 0,
    // Le tre distribuzioni: non quanto, ma COME si e' giocato. Vedi distribuzioni.js.
    ...distribuzioniVuote(),
    // La Catena applicata mossa per mossa, in ORDINE. L'istogramma dice quante mosse a
    // ciascun livello, non in che ordine: da lui si puo' disegnare una forma plausibile,
    // non quella vera. Questa serie e' cio' che rende la riga di blocchi della scheda
    // condivisibile la cronaca della partita invece di un suo riassunto riordinato.
    serieCatena: [],
  };
}

/**
 * Crea una nuova partita.
 * @param {object} [options]
 * @param {number|string} [options.seed] numero, oppure stringa (es. la data per la Sfida del Giorno)
 * @param {Uint8Array} [options.grigliaIniziale] griglia di partenza gia' popolata.
 *   Serve ai Quadri, che partono da una configurazione di ostacoli invece che dal
 *   vuoto. La mano iniziale viene generata CONTRO questa griglia, non contro una
 *   griglia vuota: altrimenti il primo turno potrebbe arrivare gia' morto.
 * @returns {object} stato di gioco
 */
export function createGame(options = {}) {
  const seed =
    typeof options.seed === 'string'
      ? seedFromString(options.seed)
      : typeof options.seed === 'number'
        ? options.seed >>> 0
        : randomSeed();

  const grid = options.grigliaIniziale ? Uint8Array.from(options.grigliaIniziale) : createGrid();
  const modalita = options.modalita === MODALITA.ANTEPRIMA ? MODALITA.ANTEPRIMA : MODALITA.BASE;
  const dealt = generateHand(grid, seed, []);

  // In modalita' anteprima la terna successiva si estrae SUBITO, insieme alla prima, e
  // da li' non cambia piu'. E' cio' che rende l'anteprima onesta -- quello che si vede
  // e' quello che arriva -- ed e' anche cio' che la rende diversa dal gioco base, perche'
  // il generatore legge la griglia di ADESSO invece di quella fra tre mosse.
  const successiva = modalita === MODALITA.ANTEPRIMA
    ? generateHand(grid, dealt.rngState, dealt.history)
    : null;

  return {
    version: STATE_VERSION,
    modalita,
    seedLabel: typeof options.seed === 'string' ? options.seed : null,
    seed,
    rngState: successiva ? successiva.rngState : dealt.rngState,
    shapeHistory: successiva ? successiva.history : dealt.history,
    grid,
    hand: dealt.pieces,
    manoSuccessiva: successiva ? successiva.pieces : null,
    score: 0,
    chain: 0,
    // Mosse consecutive senza eliminazioni. La Catena cala solo quando questo
    // supera la tolleranza di una mano: vedi CHAIN_GRACE in config/rules.js.
    chainDigiuno: 0,
    status: 'playing',
    stats: { ...emptyStats(), handsDealt: 1 },
    lastMove: null,
    startedAt: options.now ?? Date.now(),
    endedAt: null,
  };
}

/** Il pezzo indicato puo' essere appoggiato in (row, col)? */
export function canPlaceHandPiece(state, handIndex, row, col) {
  const piece = state.hand[handIndex];
  if (!piece || state.status !== 'playing') return false;
  return canPlace(state.grid, piece.shape, row, col);
}

/** Esiste almeno un pezzo in mano ancora piazzabile? */
export function handHasMove(grid, hand) {
  return hand.some((piece) => piece && hasAnyPlacement(grid, piece.shape));
}

/** Elenco dei pezzi in mano che non entrano piu' da nessuna parte. */
export function deadPieces(state) {
  return state.hand
    .map((piece, i) => (piece && !hasAnyPlacement(state.grid, piece.shape) ? i : -1))
    .filter((i) => i >= 0);
}

/**
 * Appoggia un pezzo della mano sulla griglia. Unico modo di far progredire la partita.
 * @param {object} state
 * @param {number} handIndex indice del pezzo nella mano
 * @param {number} row riga di destinazione dell'origine della forma
 * @param {number} col colonna di destinazione
 * @param {number} [now] istante da registrare come fine partita. Esiste per non
 *   rompere la promessa di riproducibilita': con Date.now() implicito la durata
 *   della partita era l'unico valore non deterministico a parita' di seed.
 * @returns {object} nuovo stato (lo stato precedente non viene mai mutato)
 */
export function placePiece(state, handIndex, row, col, now = Date.now()) {
  if (state.status !== 'playing') return state;
  const piece = state.hand[handIndex];
  if (!piece) return state;
  if (!canPlace(state.grid, piece.shape, row, col)) return state;

  // 1. Appoggio.
  const placed = placeShape(state.grid, piece.shape, row, col, piece.color, piece.bombe);

  // 2. Gruppi completati (riga, colonna, quadrante: valutati insieme).
  const groups = findCompletedGroups(placed.grid);

  // 3. Detonazioni. Le bombe entrano in gioco SOLO se qualcosa viene eliminato:
  //    una bomba appoggiata sulla plancia resta un blocco come gli altri finche'
  //    non e' il gruppo che la contiene a sparire.
  const celleGruppi = [];
  for (const gruppo of groups) for (const cella of gruppo.cells) celleGruppi.push(cella);
  const detonazione = groups.length > 0
    ? detonaBombe(placed.grid, celleGruppi)
    : { tutte: new Set(), esplose: [], bombe: [] };
  const cleared = groups.length > 0
    ? svuotaCelle(placed.grid, detonazione.tutte)
    : { grid: placed.grid, clearedCells: [] };
  const boardCleared = groups.length > 0 && isEmpty(cleared.grid);

  // 4. Punteggio, con il moltiplicatore Catena che il giocatore vedeva prima di muovere.
  const scored = scoreMove({
    placedCellCount: placed.cells.length,
    groups,
    chainLevel: state.chain,
    chainFast: state.chainDigiuno ?? 0,
    boardCleared,
    explodedCellCount: detonazione.esplose.length,
    // La griglia con il pezzo gia' appoggiato e i gruppi ancora pieni: dopo `svuotaCelle`
    // i colori non esistono piu'.
    grid: placed.grid,
  });

  // 5. Mano: si rigenera solo quando tutti i pezzi sono stati usati.
  const hand = state.hand.slice();
  hand[handIndex] = null;
  const handEmpty = hand.every((p) => p === null);

  let grid = cleared.grid;
  let rngState = state.rngState;
  let shapeHistory = state.shapeHistory;
  let nextHand = hand;
  let handsDealt = state.stats.handsDealt;

  let manoSuccessiva = state.manoSuccessiva ?? null;

  if (handEmpty) {
    if (state.modalita === MODALITA.ANTEPRIMA && manoSuccessiva) {
      // Si consegna ESATTAMENTE la terna che il giocatore ha visto. Non viene ricalcolata
      // ne' ritoccata: se lo fosse, l'anteprima sarebbe una promessa non mantenuta, ed e'
      // il difetto peggiore che questa modalita' possa avere in un gioco che promette di
      // non nascondere niente.
      nextHand = manoSuccessiva;
      // E nello stesso istante si estrae quella dopo, sulla griglia di adesso.
      const dopo = generateHand(grid, rngState, shapeHistory);
      manoSuccessiva = dopo.pieces;
      rngState = dopo.rngState;
      shapeHistory = dopo.history;
    } else {
      const dealt = generateHand(grid, rngState, shapeHistory);
      nextHand = dealt.pieces;
      rngState = dealt.rngState;
      shapeHistory = dealt.history;
    }
    handsDealt += 1;
  }

  // 6. Game over: nessuno dei pezzi rimasti entra piu' da nessuna parte.
  const alive = handHasMove(grid, nextHand);

  const distribuzioni = conMossa(state.stats, {
    catenaApplicata: scored.chainUsed,
    gruppi: groups.length,
    riga: row,
    colonna: col,
  });

  const stats = {
    ...distribuzioni,
    serieCatena: [...(state.stats.serieCatena ?? []), scored.chainUsed],
    moves: state.stats.moves + 1,
    piecesPlaced: state.stats.piecesPlaced + 1,
    cellsPlaced: state.stats.cellsPlaced + placed.cells.length,
    clearedRows: state.stats.clearedRows + groups.filter((g) => g.type === 'row').length,
    clearedCols: state.stats.clearedCols + groups.filter((g) => g.type === 'col').length,
    clearedQuadrants:
      state.stats.clearedQuadrants + groups.filter((g) => g.type === 'quadrant').length,
    clearedCells: state.stats.clearedCells + cleared.clearedCells.length,
    bestMovePoints: Math.max(state.stats.bestMovePoints, scored.points),
    bestChain: Math.max(state.stats.bestChain, scored.chainAfter),
    bestIntreccio: Math.max(state.stats.bestIntreccio, groups.length),
    intrecci: state.stats.intrecci + (groups.length > 1 ? 1 : 0),
    boardClears: state.stats.boardClears + (boardCleared ? 1 : 0),
    bombeEsplose: (state.stats.bombeEsplose ?? 0) + detonazione.bombe.length,
    celleEsplose: (state.stats.celleEsplose ?? 0) + detonazione.esplose.length,
    handsDealt,
  };

  return {
    ...state,
    grid,
    hand: nextHand,
    manoSuccessiva,
    rngState,
    shapeHistory,
    score: state.score + scored.points,
    chain: scored.chainAfter,
    chainDigiuno: scored.chainFastAfter,
    status: alive ? 'playing' : 'over',
    stats,
    endedAt: alive ? null : now,
    lastMove: {
      moveNumber: stats.moves,
      handIndex,
      pieceUid: piece.uid,
      shapeId: piece.shapeId,
      color: piece.color,
      origin: { row, col },
      placedCells: placed.cells,
      groups: groups.map((g) => ({ type: g.type, index: g.index, cells: g.cells })),
      clearedCells: cleared.clearedCells,
      celleEsplose: detonazione.esplose,
      bombeDetonate: detonazione.bombe,
      points: scored.points,
      breakdown: scored.breakdown,
      chainBefore: scored.chainUsed,
      chainAfter: scored.chainAfter,
      chainDigiunoAfter: scored.chainFastAfter,
      tier: moveTier(groups.length, scored.chainUsed, detonazione.esplose.length),
      boardCleared,
      handRefilled: handEmpty,
      gameOver: !alive,
      fillAfter: fillRatio(grid),
    },
  };
}

/**
 * Durata della partita in millisecondi.
 * @param {object} state
 * @param {number} [now] istante di riferimento per una partita ancora in corso.
 */
export function gameDuration(state, now = Date.now()) {
  return (state.endedAt ?? now) - state.startedAt;
}

/** Riepilogo leggibile a fine partita. */
export function summarize(state, now = Date.now()) {
  return {
    score: state.score,
    moves: state.stats.moves,
    durationMs: gameDuration(state, now),
    clearedGroups:
      state.stats.clearedRows + state.stats.clearedCols + state.stats.clearedQuadrants,
    clearedRows: state.stats.clearedRows,
    clearedCols: state.stats.clearedCols,
    clearedQuadrants: state.stats.clearedQuadrants,
    bestChain: state.stats.bestChain,
    bestMovePoints: state.stats.bestMovePoints,
    bestIntreccio: state.stats.bestIntreccio,
    intrecci: state.stats.intrecci,
    boardClears: state.stats.boardClears,
    filledCells: filledCount(state.grid),
    piecesPlaced: state.stats.piecesPlaced,
    // Le bombe non erano nel riepilogo perche' nessuno le leggeva: il profilo di gioco
    // le legge, ed erano l'unica cosa del tabellone che il riepilogo non raccontava.
    bombeEsplose: state.stats.bombeEsplose ?? 0,
    celleEsplose: state.stats.celleEsplose ?? 0,
    // Le distribuzioni escono da qui perche' e' da qui che passano il profilo di
    // gioco e la scheda condivisibile: nessuno dei due deve leggere lo stato interno.
    ...normalizzaDistribuzioni(state.stats),
    serieCatena: Array.isArray(state.stats.serieCatena) ? state.stats.serieCatena.slice() : [],
  };
}

/** Stato -> oggetto JSON-safe (per il salvataggio della partita in corso). */
/** Un pezzo in forma JSON-safe. */
function pezzoSerializzato(p) {
  return p ? { uid: p.uid, shapeId: p.shapeId, color: p.color, bombe: p.bombe ?? [] } : null;
}

export function serializeGame(state) {
  return {
    version: state.version,
    modalita: state.modalita ?? MODALITA.BASE,
    manoSuccessiva: state.manoSuccessiva ? state.manoSuccessiva.map(pezzoSerializzato) : null,
    seed: state.seed,
    seedLabel: state.seedLabel,
    rngState: state.rngState,
    shapeHistory: state.shapeHistory,
    grid: Array.from(state.grid),
    hand: state.hand.map(pezzoSerializzato),
    score: state.score,
    chain: state.chain,
    chainDigiuno: state.chainDigiuno ?? 0,
    status: state.status,
    stats: state.stats,
    startedAt: state.startedAt,
    endedAt: state.endedAt,
  };
}

/** true se il valore e' un numero finito non negativo. */
function numeroValido(v) {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0;
}

/**
 * Oggetto JSON -> stato. Restituisce null se il salvataggio e' di una versione
 * incompatibile o corrotto: meglio ricominciare che caricare una partita rotta.
 *
 * La validazione controlla anche i valori, non solo la forma: un salvataggio
 * manomesso (punteggio non numerico, stato inventato, catena fuori scala) veniva
 * caricato lo stesso e produceva un'interfaccia incoerente invece di un errore netto.
 * `lastMove` non viene ripristinato di proposito: descrive un'animazione gia' avvenuta.
 */
export function deserializeGame(raw) {
  try {
    if (!raw || raw.version !== STATE_VERSION) return null;
    if (!Array.isArray(raw.grid) || raw.grid.length !== createGrid().length) return null;
    if (raw.grid.some((v) => !Number.isInteger(v) || v < 0 || v > 255)) return null;
    if (!numeroValido(raw.score) || !numeroValido(raw.rngState)) return null;
    if (!Number.isInteger(raw.chain) || raw.chain < 0 || raw.chain > CHAIN_MAX) return null;
    if (raw.status !== 'playing' && raw.status !== 'over') return null;
    if (!numeroValido(raw.startedAt)) return null;
    if (!Array.isArray(raw.hand)) return null;
    const grid = Uint8Array.from(raw.grid);
    const ricostruisci = (p) => (p ? {
      uid: p.uid,
      shapeId: p.shapeId,
      shape: getShape(p.shapeId),
      color: p.color,
      bombe: Array.isArray(p.bombe) ? p.bombe.filter((i) => Number.isInteger(i) && i >= 0) : [],
    } : null);
    const hand = raw.hand.map(ricostruisci);
    if (hand.length !== HAND_SIZE) return null;
    return {
      version: raw.version,
      // Una partita salvata PRIMA che le modalita' esistessero e' una partita base: e'
      // l'unica lettura possibile, ed e' anche quella giusta.
      modalita: raw.modalita === MODALITA.ANTEPRIMA ? MODALITA.ANTEPRIMA : MODALITA.BASE,
      manoSuccessiva: Array.isArray(raw.manoSuccessiva) && raw.manoSuccessiva.length === HAND_SIZE
        ? raw.manoSuccessiva.map(ricostruisci)
        : null,
      seed: raw.seed,
      seedLabel: raw.seedLabel ?? null,
      rngState: raw.rngState,
      shapeHistory: raw.shapeHistory ?? [],
      grid,
      hand,
      score: raw.score,
      chain: raw.chain,
      chainDigiuno: Number.isInteger(raw.chainDigiuno) && raw.chainDigiuno >= 0 ? raw.chainDigiuno : 0,
      status: raw.status,
      // Le distribuzioni di un salvataggio vanno normalizzate, non fuse alla cieca:
      // un array della lunghezza sbagliata passerebbe intatto e romperebbe gli
      // istogrammi. E' lo stesso genere di errore che ha gia' spento il gioco una
      // volta (vedi il commento di registraTentativo in persistence/progressi.js).
      stats: {
        ...emptyStats(),
        ...raw.stats,
        ...normalizzaDistribuzioni(raw.stats),
        // Una serie manomessa (non un array, o con valori non numerici) va scartata e
        // non corretta a meta': se ne ricava una forma sbagliata invece di nessuna forma.
        serieCatena: Array.isArray(raw.stats?.serieCatena)
          && raw.stats.serieCatena.every((n) => Number.isInteger(n) && n >= 0 && n <= CHAIN_MAX)
          ? raw.stats.serieCatena
          : [],
      },
      lastMove: null,
      startedAt: raw.startedAt,
      endedAt: raw.endedAt ?? null,
    };
  } catch {
    return null;
  }
}

export { resetUid };
