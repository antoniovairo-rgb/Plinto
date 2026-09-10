/**
 * Il giocatore artificiale che punta all'OBIETTIVO di un Quadro.
 *
 * PERCHE' UN MODULO E NON UNA COPIA PER STRUMENTO. Fino alla 1.1.0 questo giocatore
 * viveva dentro `tools/quadri.mjs`, e il generatore dei livelli ne aveva una versione
 * PROPRIA con pesi diversi: il generatore evitava sempre di spezzare la Catena, il
 * verificatore solo su certi obiettivi. Il risultato e' che il generatore poteva
 * promuovere un livello che il verificatore bocciava. E' successo davvero: il quadro 44
 * passava il controllo di superabilita' del generatore e risultava superato una volta su
 * dieci nella verifica.
 *
 * Una garanzia come "nessun livello e' imbattibile" non vale niente se chi la rilascia e
 * chi la controlla usano due metri diversi: vale solo contro se stessa. Da qui in avanti
 * il metro e' uno solo, e sta qui.
 *
 * COS'E' E COSA NON E'. E' un metro coerente e ripetibile, non una persona. Sa mirare
 * all'obiettivo del livello -- un giocatore a cui e' stato detto "fai una riga" punta
 * alla riga, e senza questa distinzione tutti i quadri di Catena risultavano impossibili
 * mentre non lo erano -- ma gioca a un pezzo alla volta dentro la mano, e usa l'anteprima
 * in modo volutamente modesto. Serve a leggere la CURVA e a escludere i muri; non dice se
 * un livello sia bello.
 */

import {
  allPlacements, placeShape, findCompletedGroups, clearGroups, fillRatio, idx,
  quadrantCells, QUADRANT_COUNT,
} from '../core/grid.js';
import { GRID_SIZE, QUADRANT_SIZE } from '../config/rules.js';
import { accoglienza } from './accoglienza.mjs';

/** Celle vuote senza vicini vuoti: i buchi che uccidono le partite. */
function buchiIsolati(grid) {
  let buchi = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (grid[idx(r, c)] !== 0) continue;
      const su = r > 0 && grid[idx(r - 1, c)] === 0;
      const giu = r < GRID_SIZE - 1 && grid[idx(r + 1, c)] === 0;
      const sx = c > 0 && grid[idx(r, c - 1)] === 0;
      const dx = c < GRID_SIZE - 1 && grid[idx(r, c + 1)] === 0;
      if (!su && !giu && !sx && !dx) buchi += 1;
    }
  }
  return buchi;
}

/** Quanto e' vicino a chiudersi ciascun tipo di gruppo. */
function vicinanza(grid) {
  const conta = { row: 0, col: 0, quadrant: 0 };
  for (let r = 0; r < GRID_SIZE; r += 1) {
    let piene = 0;
    for (let c = 0; c < GRID_SIZE; c += 1) if (grid[idx(r, c)] !== 0) piene += 1;
    if (piene < GRID_SIZE) conta.row += (piene / GRID_SIZE) ** 3;
  }
  for (let c = 0; c < GRID_SIZE; c += 1) {
    let piene = 0;
    for (let r = 0; r < GRID_SIZE; r += 1) if (grid[idx(r, c)] !== 0) piene += 1;
    if (piene < GRID_SIZE) conta.col += (piene / GRID_SIZE) ** 3;
  }
  const celle = QUADRANT_SIZE * QUADRANT_SIZE;
  for (let q = 0; q < QUADRANT_COUNT; q += 1) {
    let piene = 0;
    for (const cella of quadrantCells(q)) if (grid[cella] !== 0) piene += 1;
    if (piene < celle) conta.quadrant += (piene / celle) ** 3;
  }
  return conta;
}

/**
 * Peso che il giocatore da' a ciascun tipo di gruppo, dato l'obiettivo del Quadro.
 *
 * `catena` merita una spiegazione. Chiudere gruppi in totale non basta: la Catena sale
 * solo se si chiude qualcosa a OGNI mossa, e cala di uno appena si salta un turno.
 * Un giocatore che punta alla Catena non cerca la mossa che elimina di piu': cerca la
 * mossa che elimina ADESSO, anche poco, per non spezzare la sequenza. Senza questa
 * distinzione tutti i quadri di Catena risultavano impossibili, e non era vero: era il
 * metro che giocava per il punteggio invece che per l'obiettivo.
 */
export function preferenze(quadro) {
  const p = { row: 1, col: 1, quadrant: 1, svuotare: 0, mira: 6, nonSpezzare: 0, intreccio: 0 };
  for (const { tipo } of quadro.obiettivi) {
    if (tipo === 'righe') p.row = 6;
    else if (tipo === 'colonne') p.col = 6;
    else if (tipo === 'quadranti') p.quadrant = 6;
    else if (tipo === 'pulizia') p.svuotare = 260;
    // Il punteggio dipende quasi tutto dalla Catena: chi punta ai punti, di fatto,
    // punta a non spezzarla mai.
    else if (tipo === 'catena') p.nonSpezzare = 900;
    else if (tipo === 'punteggio') p.nonSpezzare = 500;
    /**
     * L'INTRECCIO MANCAVA, e la mancanza si e' vista molto piu' tardi.
     *
     * Senza questo caso, un livello che chiede "chiudi N gruppi con una sola mossa"
     * faceva giocare il metro con le preferenze predefinite: nessuna mira. Il generatore
     * chiedeva "riesci ad arrivare a 3?", il metro non ci provava, e la risposta era no.
     * Il quadro 47 e' rimasto per due generazioni un livello banale che nessuno riusciva
     * ad alzare -- non perche' fosse impossibile, perche' nessuno stava provando.
     *
     * Un Intreccio non si trova, si PREPARA: servono una riga, una colonna e un quadrante
     * vicini alla chiusura nello stesso punto. Alzare le tre mire INSIEME e' il modo di
     * dire "portale avanti in parallelo" invece di finirne una e perdere le altre due.
     */
    else if (tipo === 'intreccio' || tipo === 'intrecci') {
      p.row = 4; p.col = 4; p.quadrant = 4;
      p.intreccio = 900;
    }
  }
  return p;
}

/**
 * Valore di una griglia dopo una mossa, dal punto di vista dell'obiettivo.
 *
 * `rumore` non e' un dettaglio. Senza, il pianificatore e' completamente deterministico:
 * dieci tentativi dello stesso Quadro sono dieci volte la STESSA partita, e la colonna
 * "riuscite" puo' valere solo 0% o 100%. Era esattamente cosi' fino alla versione 1.0.2,
 * e sembrava una misura mentre era un tiro di moneta gia' truccato dal seme. Un pizzico
 * di casualita' nel rompere i pareggi fa dei dieci tentativi dieci partite diverse, e
 * la percentuale torna a dire qualcosa. La stessa lezione era gia' scritta in
 * tools/taratura.mjs: qui non era mai stata applicata.
 */
function valuta(grigliaDopo, gruppi, pref, rumore = 0) {
  const vic = vicinanza(grigliaDopo);
  let valore = 0;
  // Non spezzare la Catena vale piu' di qualunque singolo gruppo in piu'.
  if (gruppi.length === 0) valore -= pref.nonSpezzare;
  for (const g of gruppi) valore += 150 * pref[g.type];
  // Gli intrecci valgono sempre; su un livello che li chiede valgono moltissimo, al punto
  // che chiudere un gruppo da solo diventa uno spreco della vicinanza che serviva.
  valore += gruppi.length > 1 ? (120 + pref.intreccio) * (gruppi.length - 1) : 0;
  valore -= buchiIsolati(grigliaDopo) * 16;
  valore -= fillRatio(grigliaDopo) * (45 + pref.svuotare);
  valore += (vic.row * pref.row + vic.col * pref.col + vic.quadrant * pref.quadrant) * pref.mira;
  return valore + rumore;
}

const AMPIEZZA = 7;

// Quante sequenze complete della mano vengono rigiudicate alla luce della terna
// successiva. Non serve rigiudicarle tutte: quelle sotto le prime dieci perdono gia'
// sul merito della mano che si sta giocando, e il peso dell'anteprima non le
// recupererebbe. Serve invece a scegliere FRA sequenze quasi equivalenti quella che
// lascia il posto giusto -- che e' esattamente cio' che fa una persona quando vede
// cosa sta per arrivare.
const ALTERNATIVE_CON_ANTEPRIMA = 10;

// L'anteprima conta, ma meno della mano che si ha davvero in mano: una mossa buona
// adesso e' certa, una comodita' fra tre mosse e' una previsione.
const PESO_ANTEPRIMA = 0.6;

// Un pezzo della terna successiva che non trova posto e' la fine della partita, non
// una mossa meno buona: pesa piu' di qualunque gruppo chiuso.
const PENALITA_BLOCCO = 1200;

/**
 * Tutte le sequenze di primo livello, ciascuna con il suo valore e la griglia a cui
 * porta. `pianifica` e' semplicemente la migliore fra queste: tenerle separate serve a
 * poterle rigiudicare con la terna successiva senza duplicare la ricerca.
 */
function ramiDiRadice(grid, pezzi, pref, profondita, rng) {
  const rami = [];

  for (let i = 0; i < pezzi.length; i += 1) {
    const pezzo = pezzi[i];
    if (!pezzo) continue;
    const case_ = allPlacements(grid, pezzo.shape);
    if (case_.length === 0) continue;

    const candidate = case_.map(([row, col]) => {
      const { grid: posata } = placeShape(grid, pezzo.shape, row, col, 1, pezzo.bombe);
      const gruppi = findCompletedGroups(posata);
      const { grid: dopo } = clearGroups(posata, gruppi);
      return { row, col, dopo, valore: valuta(dopo, gruppi, pref, rng.float() * 45) };
    }).sort((a, b) => b.valore - a.valore).slice(0, AMPIEZZA);

    const resto = pezzi.slice();
    resto[i] = null;

    for (const c of candidate) {
      const sotto = pianifica(c.dopo, resto, pref, profondita - 1, rng);
      rami.push({
        valore: c.valore + sotto.valore * 0.85,
        prima: { handIndex: i, row: c.row, col: c.col },
        griglia: sotto.griglia,
      });
    }
  }
  return rami;
}

/** Cerca la sequenza migliore usando tutti i pezzi rimasti in mano. */
function pianifica(grid, pezzi, pref, profondita, rng) {
  const fermarsi = { valore: 0, prima: null, griglia: grid };
  if (profondita === 0) return fermarsi;
  const rami = ramiDiRadice(grid, pezzi, pref, profondita, rng);
  return rami.reduce((a, b) => (b.valore > a.valore ? b : a), fermarsi);
}

/** Sceglie la mossa per il Quadro dato. */
export function scegliMossa(partita, pref, rng) {
  const rami = ramiDiRadice(partita.grid, partita.hand, pref, partita.hand.filter(Boolean).length, rng);
  if (rami.length) {
    // Senza anteprima si prende la sequenza migliore e basta. Con l'anteprima le
    // prime alternative vengono rigiudicate su quanto bene la griglia a cui portano
    // accoglie la terna che il giocatore VEDE gia'.
    const dopo = partita.manoSuccessiva;
    const candidate = dopo
      ? [...rami].sort((a, b) => b.valore - a.valore).slice(0, ALTERNATIVE_CON_ANTEPRIMA)
        .map((r) => {
          const acc = accoglienza(r.griglia, dopo, (g, gruppi) => valuta(g, gruppi, pref));
          return { ...r, valore: r.valore + PESO_ANTEPRIMA * acc.valore - (acc.bloccato ? PENALITA_BLOCCO : 0) };
        })
      : rami;
    return candidate.reduce((a, b) => (b.valore > a.valore ? b : a)).prima;
  }
  // Nessun piano: si prova qualunque mossa legale pur di non fermarsi.
  for (let i = 0; i < partita.hand.length; i += 1) {
    const pezzo = partita.hand[i];
    if (!pezzo) continue;
    const case_ = allPlacements(partita.grid, pezzo.shape);
    if (case_.length) {
      const [row, col] = case_[rng.int(case_.length)];
      return { handIndex: i, row, col };
    }
  }
  return null;
}
