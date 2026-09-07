/**
 * Taratura dei bersagli dei Quadri.
 *
 * I bersagli della prima stesura erano inventati, e la misura lo ha mostrato senza
 * pieta': "fai 1500 punti in 22 mosse" quando in 22 mosse se ne fanno 325.
 * Un bersaglio inventato produce due difetti opposti e ugualmente brutti, un livello
 * impossibile o un livello che si supera senza accorgersene.
 *
 * Qui i bersagli si CALCOLANO. Per ogni Quadro il giocatore artificiale gioca il
 * livello con la sua griglia e il suo tetto di mosse ma SENZA obiettivo, e si registra
 * fin dove arriva. Il bersaglio viene poi messo a un percentile di quella
 * distribuzione: piu' basso il percentile, piu' facile il livello.
 *
 * Non e' una misura di quanto sia difficile per una persona: e' un metro coerente che
 * mette tutti i Quadri sulla stessa scala. Serve a costruire una CURVA.
 *
 * Uso: node tools/taratura.mjs [tentativi] [base|anteprima]
 *
 * La modalita' conta: con l'anteprima il giocatore vede la terna successiva e sceglie,
 * fra sequenze quasi equivalenti, quella che le fa posto. Arriva piu' lontano, quindi
 * il percentile si sposta, quindi i bersagli vanno rifatti. Tararli in una modalita' e
 * giocarli in un'altra sarebbe la definizione di difficolta' nascosta.
 */

import { QUADRI } from '../src/config/quadri.js';
import { iniziaQuadro, OBIETTIVI, MODALITA_QUADRI } from '../src/core/quadro.js';
import { placePiece } from '../src/core/engine.js';
import { createRng } from '../src/core/rng.js';
import {
  allPlacements, placeShape, findCompletedGroups, clearGroups, fillRatio, idx,
  quadrantCells, QUADRANT_COUNT,
} from '../src/core/grid.js';
import { GRID_SIZE, QUADRANT_SIZE, MODALITA } from '../src/config/rules.js';
import { accoglienza } from '../src/sim/accoglienza.mjs';

const TENTATIVI = Number(process.argv[2] ?? 12);
// Il valore predefinito e' la modalita' in cui i Quadri si giocano DAVVERO: uno
// strumento che misura di default qualcosa che nessuno gioca misura il livello
// sbagliato. `base` resta esplicito, per il confronto fra le due modalita'.
const MODO = process.argv[3] === 'base' ? MODALITA.BASE : MODALITA_QUADRI;

function buchi(g) {
  let n = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) for (let c = 0; c < GRID_SIZE; c += 1) {
    if (g[idx(r, c)] !== 0) continue;
    const su = r > 0 && g[idx(r - 1, c)] === 0, giu = r < GRID_SIZE - 1 && g[idx(r + 1, c)] === 0;
    const sx = c > 0 && g[idx(r, c - 1)] === 0, dx = c < GRID_SIZE - 1 && g[idx(r, c + 1)] === 0;
    if (!su && !giu && !sx && !dx) n += 1;
  }
  return n;
}

function vicinanza(grid) {
  const v = { row: 0, col: 0, quadrant: 0 };
  for (let r = 0; r < GRID_SIZE; r += 1) {
    let p = 0;
    for (let c = 0; c < GRID_SIZE; c += 1) if (grid[idx(r, c)] !== 0) p += 1;
    if (p < GRID_SIZE) v.row += (p / GRID_SIZE) ** 3;
  }
  for (let c = 0; c < GRID_SIZE; c += 1) {
    let p = 0;
    for (let r = 0; r < GRID_SIZE; r += 1) if (grid[idx(r, c)] !== 0) p += 1;
    if (p < GRID_SIZE) v.col += (p / GRID_SIZE) ** 3;
  }
  const tot = QUADRANT_SIZE * QUADRANT_SIZE;
  for (let q = 0; q < QUADRANT_COUNT; q += 1) {
    let p = 0;
    for (const cella of quadrantCells(q)) if (grid[cella] !== 0) p += 1;
    if (p < tot) v.quadrant += (p / tot) ** 3;
  }
  return v;
}

/** Pesi del giocatore, orientati al tipo di obiettivo del Quadro. */
function preferenze(quadro) {
  const p = { row: 1, col: 1, quadrant: 1, svuotare: 0, nonSpezzare: 260 };
  for (const { tipo } of quadro.obiettivi) {
    if (tipo === 'righe') p.row = 6;
    else if (tipo === 'colonne') p.col = 6;
    else if (tipo === 'quadranti') p.quadrant = 6;
    else if (tipo === 'pulizia') { p.svuotare = 300; p.nonSpezzare = 60; }
    else if (tipo === 'catena') p.nonSpezzare = 900;
    else if (tipo === 'intreccio') p.nonSpezzare = 60;
  }
  return p;
}

/**
 * Valore di una griglia dopo una mossa.
 *
 * `rumore` non e' un dettaglio: senza, il pianificatore e' completamente deterministico
 * e tutte le partite di taratura risultano identiche. La prima versione di questo
 * strumento aveva minimo, mediana e massimo uguali su ogni singolo Quadro, quindi il
 * percentile non misurava nulla. Un pizzico di casualita' nel rompere i pareggi
 * restituisce una distribuzione vera.
 */
function valuta(dopo, gruppi, pref, rumore = 0) {
  const v = vicinanza(dopo);
  let val = gruppi.length === 0 ? -pref.nonSpezzare : 0;
  for (const g of gruppi) val += 150 * pref[g.type];
  val += gruppi.length > 1 ? 260 * (gruppi.length - 1) : 0;
  val -= buchi(dopo) * 16;
  val -= fillRatio(dopo) * (45 + pref.svuotare);
  val += (v.row * pref.row + v.col * pref.col + v.quadrant * pref.quadrant) * 6;
  return val + rumore;
}

const AMPIEZZA = 7;
// Gli stessi tre numeri di tools/quadri.mjs, e per la stessa ragione: i due strumenti
// devono misurare con lo STESSO metro, altrimenti si tarano i bersagli con un giocatore
// e si verifica la difficolta' con un altro.
const ALTERNATIVE_CON_ANTEPRIMA = 10;
const PESO_ANTEPRIMA = 0.6;
const PENALITA_BLOCCO = 1200;

/** Tutte le sequenze di primo livello, con il valore e la griglia a cui portano. */
function ramiDiRadice(grid, pezzi, pref, prof, rng) {
  const rami = [];
  for (let i = 0; i < pezzi.length; i += 1) {
    const pezzo = pezzi[i];
    if (!pezzo) continue;
    const case_ = allPlacements(grid, pezzo.shape);
    if (!case_.length) continue;
    const cand = case_.map(([row, col]) => {
      const { grid: posata } = placeShape(grid, pezzo.shape, row, col, 1, pezzo.bombe);
      const gruppi = findCompletedGroups(posata);
      const { grid: dopo } = clearGroups(posata, gruppi);
      return { row, col, dopo, valore: valuta(dopo, gruppi, pref, rng.float() * 45) };
    }).sort((a, b) => b.valore - a.valore).slice(0, AMPIEZZA);
    const resto = pezzi.slice(); resto[i] = null;
    for (const c of cand) {
      const sotto = pianifica(c.dopo, resto, pref, prof - 1, rng);
      rami.push({
        valore: c.valore + sotto.valore * 0.85,
        prima: { handIndex: i, row: c.row, col: c.col },
        griglia: sotto.griglia,
      });
    }
  }
  return rami;
}

function pianifica(grid, pezzi, pref, prof, rng) {
  const fermarsi = { valore: 0, prima: null, griglia: grid };
  if (prof === 0) return fermarsi;
  return ramiDiRadice(grid, pezzi, pref, prof, rng)
    .reduce((a, b) => (b.valore > a.valore ? b : a), fermarsi);
}

/** La mossa da giocare: con l'anteprima, scelta guardando anche la terna successiva. */
function scegliMossa(partita, pref, rng) {
  const rami = ramiDiRadice(partita.grid, partita.hand, pref, partita.hand.filter(Boolean).length, rng);
  if (!rami.length) return null;
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

/** Gioca il livello fino a esaurire le mosse, senza fermarsi a un obiettivo. */
function giocaFinoInFondo(quadro, rng) {
  let partita = iniziaQuadro(quadro, { now: 0, modalita: MODO });
  const pref = preferenze(quadro);
  const tetto = quadro.maxMosse ?? 80;
  for (let m = 0; m < tetto; m += 1) {
    if (partita.status !== 'playing') break;
    const mossa = scegliMossa(partita, pref, rng);
    if (!mossa) break;
    partita = placePiece(partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
  }
  return partita;
}

function percentile(valori, p) {
  const o = [...valori].sort((a, b) => a - b);
  return o[Math.max(0, Math.min(o.length - 1, Math.floor((p / 100) * o.length)))];
}

console.log(`\nPLINTO — taratura dei bersagli: ${QUADRI.length} quadri x ${TENTATIVI} partite senza obiettivo, modalita "${MODO}"\n`);
console.log('  #  nome              tipo         mosse   raggiunge (min/mediana/max)   bersaglio ora   proposto');
console.log('  ' + '-'.repeat(104));

const proposte = [];
for (const quadro of QUADRI) {
  const rng = createRng(31337 + quadro.numero);
  const finali = [];
  for (let i = 0; i < TENTATIVI; i += 1) finali.push(giocaFinoInFondo(quadro, rng));

  const righe = quadro.obiettivi.map(({ tipo, quanti }) => {
    const valori = finali.map((s) => OBIETTIVI[tipo].progresso(s));
    // Bersaglio al 35esimo percentile: il metro lo raggiunge in circa due casi su tre.
    let proposto = percentile(valori, 35);
    if (tipo === 'punteggio') proposto = Math.max(50, Math.round(proposto / 50) * 50);
    else proposto = Math.max(1, Math.round(proposto));
    return {
      tipo, quanti, proposto,
      min: Math.min(...valori), med: percentile(valori, 50), max: Math.max(...valori),
    };
  });
  proposte.push({ numero: quadro.numero, obiettivi: righe });

  righe.forEach((r, i) => {
    const cambia = r.proposto !== r.quanti ? `  ->  ${r.proposto}` : '';
    console.log(
      `  ${i === 0 ? String(quadro.numero).padStart(2) : '  '}  ${(i === 0 ? quadro.nome : '').padEnd(17)} `
      + `${r.tipo.padEnd(11)} ${String(quadro.maxMosse ?? '-').padStart(5)}   `
      + `${String(r.min).padStart(6)} ${String(r.med).padStart(7)} ${String(r.max).padStart(6)}   `
      + `${String(r.quanti).padStart(11)}${cambia}`,
    );
  });
}

console.log('\n  --- da incollare in src/config/quadri.js ---');
proposte.forEach(({ numero, obiettivi }) => {
  const testo = obiettivi.map((o) => `{ tipo: '${o.tipo}', quanti: ${o.proposto} }`).join(', ');
  console.log(`  quadro ${String(numero).padStart(2)}: [${testo}]`);
});
console.log('');
