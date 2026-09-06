/**
 * PLINTO — costanti di regolamento.
 * Fonte unica di verita per il bilanciamento: nessun numero magico sparso nel codice.
 * Ogni valore qui e' documentato in docs/GAMEPLAY_RULES.md.
 */

/** Lato della griglia. 9 => 81 celle, 9 quadranti 3x3. */
export const GRID_SIZE = 9;

/** Lato di un quadrante. GRID_SIZE deve essere divisibile per questo valore. */
export const QUADRANT_SIZE = 3;

/** Quanti pezzi vengono offerti contemporaneamente al giocatore. */
export const HAND_SIZE = 3;

/** Punti per ogni cella piazzata (feedback continuo, peso volutamente basso). */
export const POINTS_PER_CELL = 1;

/** Punti base per tipo di gruppo eliminato. Il quadrante vale di piu': e' piu' difficile. */
export const GROUP_BASE_POINTS = {
  row: 18,
  col: 18,
  quadrant: 27,
};

/**
 * Bonus "Intreccio": eliminare piu' gruppi con una sola mossa.
 * Moltiplicatore = 1 + INTRECCIO_STEP * (gruppi - 1).
 */
export const INTRECCIO_STEP = 0.5;

/** Livello massimo della Catena. */
export const CHAIN_MAX = 9;

/** Moltiplicatore Catena = 1 + CHAIN_STEP * livello. Livello 9 => x3.25. */
export const CHAIN_STEP = 0.25;

/** Quanto scende la Catena quando scade la tolleranza. */
export const CHAIN_DECAY = 1;

/**
 * Quante mosse senza eliminazioni la Catena sopporta prima di calare.
 *
 * Vale una MANO INTERA, cioe' i tre pezzi. Non e' un numero scelto a sentimento:
 * con la regola precedente (calo a ogni mossa a vuoto) la Catena risultava >= 3
 * soltanto nel 2% delle mosse giocate, e il moltiplicatore che dovrebbe essere la
 * firma del gioco era di fatto decorativo. Misurato su 200 partite:
 *
 *   tolleranza 0 (prima) ->  2% delle mosse con Catena attiva, mai oltre 6
 *   tolleranza 1         -> 11%
 *   tolleranza 2 (ora)   -> 24%, e il 23% delle partite arriva a Catena 7
 *
 * Due mosse di tolleranza corrispondono al ritmo naturale del gioco: con tre pezzi
 * in mano si elimina all'incirca una volta ogni tre mosse. La regola si racconta in
 * una riga: "la Catena cala se non elimini niente per un'intera mano".
 */
export const CHAIN_GRACE = 2;

/** Bonus una tantum per aver svuotato completamente la griglia. */
export const BOARD_CLEAR_BONUS = 300;

/** Sopra questa densita' di riempimento il generatore garantisce almeno un pezzo piccolo. */
export const CROWDED_FILL_RATIO = 0.6;

/** Un pezzo e' "piccolo" (rete di sicurezza anti-morte-ingiusta) fino a questo numero di celle. */
export const SMALL_PIECE_MAX_CELLS = 4;

/** Numero di famiglie cromatiche dei blocchi. Il colore e' puramente estetico: non ha regole. */
export const COLOR_COUNT = 6;

/**
 * Sotto questo riempimento una mano completamente impiazzabile viene rigenerata.
 * Motivo (vedi docs/GAMEPLAY_RULES.md, sezione Equita'): morire con la griglia
 * mezza vuota e' sfortuna pura, non un errore del giocatore.
 */
export const EARLY_MERCY_FILL = 0.5;

/** Tentativi massimi di rigenerazione della mano prima di forzare un pezzo piazzabile. */
export const MERCY_ATTEMPTS = 12;

/** Quante estrazioni recenti il generatore ricorda per evitare ripetitivita' percepita. */
export const HISTORY_SIZE = 6;

/** Moltiplicatore di peso per una forma uscita di recente (0..1: piu' basso = piu' varieta'). */
export const HISTORY_PENALTY = 0.45;

/** Quante volte al massimo la stessa forma puo' comparire nella stessa mano. */
export const MAX_SAME_SHAPE_IN_HAND = 2;

/**
 * Pressione da affollamento: sopra questo riempimento le forme grandi diventano
 * progressivamente meno probabili. E' un aiuto al giocatore, mai un ostacolo.
 */
export const CROWD_PRESSURE_START = 0.45;

/** Base della penalita' esponenziale sulle forme grandi sotto pressione. */
export const CROWD_PRESSURE_BASE = 0.55;

/** Le forme fino a questa dimensione non sono mai penalizzate dall'affollamento. */
export const CROWD_NEUTRAL_SIZE = 3;

/**
 * Soglia di riempimento sotto la quale scatta il controllo sui "pezzi a rischio".
 * Volutamente bassa: e' l'inizio partita, dove un game over e' sempre ingiusto.
 * Sopra questa soglia il gioco non interviene piu': lo spazio che resta e' quello
 * che il giocatore si e' costruito, e le forme scomode sono parte della sfida.
 */
export const RISKY_PIECE_FILL = 0.3;

/**
 * Sotto RISKY_PIECE_FILL ogni pezzo deve avere almeno questo numero di posizioni valide.
 * Un pezzo con una sola casa possibile su griglia quasi vuota diventa un game over a
 * sorpresa appena il giocatore appoggia gli altri due: non e' difficolta', e' sfortuna.
 */
export const MIN_PLACEMENTS_EARLY = 2;
