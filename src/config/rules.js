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
 * Non e' un numero scelto a sentimento, ed e' stato sbagliato due volte in due
 * direzioni opposte. Misurato con `npm run catena` (tools/misura-catena.mjs), profilo
 * stratega, 120 partite con tetto di 250 mosse:
 *
 *   regola                        Catena >= 3   al tetto (9)   Catena media
 *   passo=gruppi, tolleranza 0           1.3%           0.0%           0.61
 *   passo=gruppi, tolleranza 2          95.4%          77.4%           8.21
 *   passo=1,      tolleranza 0           0.4%           0.0%           0.48
 *   passo=1,      tolleranza 1 (ora)    75.4%          15.0%           5.15
 *   passo=1,      tolleranza 2          94.9%          74.3%           8.11
 *
 * Senza tolleranza la Catena non si accende mai: il moltiplicatore che dovrebbe essere
 * la firma del gioco resta decorativo. Con due mosse di tolleranza si accende e non si
 * spegne piu': tre mosse su quattro giocate al tetto, cioe' non un moltiplicatore ma
 * una costante. Una mossa di tolleranza e' l'unico valore che lascia la Catena
 * distribuita su tutta la scala, ed e' il punto: deve essere qualcosa da difendere.
 *
 * La regola si racconta comunque in una riga: "la Catena cala se non elimini niente per
 * due mosse di fila". Vedi docs/GAMEPLAY_RULES.md per la cronaca completa delle tre
 * versioni e per il limite delle righe controfattuali di quella tabella.
 */
export const CHAIN_GRACE = 1;

/**
 * Di quanto sale la Catena a ogni mossa che elimina qualcosa.
 *
 * Sale di UNO, non di quanti gruppi hai chiuso. Chiudere tre gruppi insieme e' gia'
 * premiato dal moltiplicatore Intreccio: farlo contare due volte faceva schizzare la
 * Catena al massimo e li' restava, cioe' il moltiplicatore diventava un numero fisso
 * invece che una tensione — esattamente inutile quanto quando non saliva mai.
 * Le quote sono nella tabella di CHAIN_GRACE qui sopra: le righe "passo=gruppi" sono
 * quella versione. Si rifanno con `npm run catena`.
 */
export const CHAIN_STEP_UP = 1;

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

/**
 * BOMBE
 *
 * Ogni tanto uno dei pezzi in mano contiene una cella-bomba. La bomba non fa niente
 * finche' resta sulla plancia: esplode SOLO quando viene eliminata insieme al gruppo
 * che la contiene, e allora porta via anche le celle intorno. Le bombe colpite da
 * un'esplosione esplodono a loro volta, quindi tre bombe vicine fanno un buco grosso.
 *
 * La regola sta in una riga e non aggiunge nessuna eccezione al resto del gioco:
 * una bomba e' un blocco normale che, quando sparisce, se ne porta dietro altri.
 */

/**
 * Scarto che distingue una cella-bomba nella griglia: il valore di una cella e' il
 * colore (1..6), e una bomba e' colore + 10 (11..16). Un solo array invece di due,
 * quindi salvataggi e copie restano quelli di prima.
 */
export const VALORE_BOMBA = 10;

/** Probabilita' che una mano contenga UNA cella-bomba. Tarata con le simulazioni. */
export const BOMBA_PROBABILITA = 0.22;

/** Raggio dell'esplosione, in celle. 1 = il quadrato 3x3 attorno alla bomba. */
export const BOMBA_RAGGIO = 1;

/** Punti per ogni cella portata via dall'esplosione oltre al gruppo eliminato. */
export const PUNTI_CELLA_ESPLOSA = 6;

/**
 * Modalita' di gioco che cambiano il MOTORE, non solo l'interfaccia.
 *
 * 'base'      -> la terna successiva viene estratta quando serve, cioe' quando la mano
 *                si e' svuotata, sulla griglia com'e' in quel momento.
 * 'anteprima' -> la terna successiva viene estratta NELLO STESSO ISTANTE in cui viene
 *                consegnata quella corrente, e da li' non cambia piu'. E' l'unico modo
 *                onesto di mostrarla: rigenerarla all'uso vorrebbe dire far vedere una
 *                terna diversa da quella che arriva.
 *
 * Le due modalita' NON sono confrontabili e non condividono i record: vedere avanti e'
 * un vantaggio informativo. E lo stesso seme produce partite diverse, perche' estrarre
 * prima cambia l'ordine di consumo del generatore -- per questo la modalita' entra nel
 * seme (vedi `semeDiModalita` in core/engine.js).
 *
 * Il prezzo della modalita' anteprima e' misurato e dichiarato in docs/GAMEPLAY_RULES.md:
 * le reti di sicurezza del generatore leggono la griglia al momento dell'ESTRAZIONE, che
 * ora avviene fino a tre mosse prima dell'uso, cioe' su una griglia piu' vuota.
 */
export const MODALITA = Object.freeze({ BASE: 'base', ANTEPRIMA: 'anteprima' });
