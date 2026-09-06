/**
 * Misura la difficolta' reale di ogni Quadro.
 *
 * I numeri di src/config/quadri.js sono scelte di progetto, ma "quanti punti in quante
 * mosse" non e' una cosa che si possa indovinare: un obiettivo troppo alto rende il
 * livello impossibile, uno troppo basso lo rende inutile, e in entrambi i casi il
 * giocatore se ne accorge prima di noi.
 *
 * Qui ogni Quadro viene giocato piu' volte dal giocatore artificiale che pianifica
 * l'intera mano, e si misura quante volte riesce. Non e' il giocatore umano medio: e'
 * un metro coerente. Serve a leggere la CURVA, non a stabilire una verita' assoluta.
 *
 * Come si legge il risultato:
 *   riuscite alte in tutti i quadri  -> il percorso non chiede niente
 *   riuscite a zero                  -> il quadro e' probabilmente impossibile
 *   curva che scende irregolarmente  -> la progressione non e' una progressione
 *
 * Uso: npm run quadri [tentativi]
 */

import { QUADRI } from '../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../src/core/quadro.js';
import { createRng } from '../src/core/rng.js';
import {
  allPlacements, placeShape, findCompletedGroups, clearGroups, fillRatio, idx,
  quadrantCells, QUADRANT_COUNT,
} from '../src/core/grid.js';
import { GRID_SIZE, QUADRANT_SIZE } from '../src/config/rules.js';

/**
 * Un giocatore che SA qual e' l'obiettivo del Quadro.
 *
 * La prima versione di questo strumento usava il giocatore generico delle simulazioni
 * di bilanciamento, che chiude qualunque gruppo gli venga comodo. Risultato: "chiudi
 * una riga in 12 mosse" risultava impossibile mentre "chiudi un quadrante in 12 mosse"
 * riusciva in tre. Non era il quadro a essere sbagliato: era il metro. Un quadrante
 * sono nove celle in un fazzoletto 3x3, una riga sono nove celle larghe tutta la
 * plancia, e un giocatore a cui e' stato detto "fai una riga" punta alla riga.
 *
 * Qui il giocatore riceve l'obiettivo e ci mira. Resta un metro, non una persona: serve
 * a leggere la curva, non a stabilire quanto sia difficile per un essere umano.
 */

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
function preferenze(quadro) {
  const p = { row: 1, col: 1, quadrant: 1, svuotare: 0, mira: 6, nonSpezzare: 0 };
  for (const { tipo } of quadro.obiettivi) {
    if (tipo === 'righe') p.row = 6;
    else if (tipo === 'colonne') p.col = 6;
    else if (tipo === 'quadranti') p.quadrant = 6;
    else if (tipo === 'pulizia') p.svuotare = 260;
    // Il punteggio dipende quasi tutto dalla Catena: chi punta ai punti, di fatto,
    // punta a non spezzarla mai.
    else if (tipo === 'catena') p.nonSpezzare = 900;
    else if (tipo === 'punteggio') p.nonSpezzare = 500;
  }
  return p;
}

/** Valore di una griglia dopo una mossa, dal punto di vista dell'obiettivo. */
function valuta(grigliaDopo, gruppi, pref) {
  const vic = vicinanza(grigliaDopo);
  let valore = 0;
  // Non spezzare la Catena vale piu' di qualunque singolo gruppo in piu'.
  if (gruppi.length === 0) valore -= pref.nonSpezzare;
  for (const g of gruppi) valore += 150 * pref[g.type];
  valore += gruppi.length > 1 ? 120 * (gruppi.length - 1) : 0;   // gli intrecci valgono
  valore -= buchiIsolati(grigliaDopo) * 16;
  valore -= fillRatio(grigliaDopo) * (45 + pref.svuotare);
  valore += (vic.row * pref.row + vic.col * pref.col + vic.quadrant * pref.quadrant) * pref.mira;
  return valore;
}

const AMPIEZZA = 7;

/** Cerca la sequenza migliore usando tutti i pezzi rimasti in mano. */
function pianifica(grid, pezzi, pref, profondita) {
  if (profondita === 0) return { valore: 0, prima: null };
  let migliore = null;

  for (let i = 0; i < pezzi.length; i += 1) {
    const pezzo = pezzi[i];
    if (!pezzo) continue;
    const case_ = allPlacements(grid, pezzo.shape);
    if (case_.length === 0) continue;

    const candidate = case_.map(([row, col]) => {
      const { grid: posata } = placeShape(grid, pezzo.shape, row, col, 1);
      const gruppi = findCompletedGroups(posata);
      const { grid: dopo } = clearGroups(posata, gruppi);
      return { row, col, dopo, valore: valuta(dopo, gruppi, pref) };
    }).sort((a, b) => b.valore - a.valore).slice(0, AMPIEZZA);

    const resto = pezzi.slice();
    resto[i] = null;

    for (const c of candidate) {
      const sotto = pianifica(c.dopo, resto, pref, profondita - 1);
      const valore = c.valore + sotto.valore * 0.85;
      if (migliore === null || valore > migliore.valore) {
        migliore = { valore, prima: { handIndex: i, row: c.row, col: c.col } };
      }
    }
  }
  return migliore ?? { valore: 0, prima: null };
}

/** Sceglie la mossa per il Quadro dato. */
function scegliMossa(partita, pref, rng) {
  const piano = pianifica(partita.grid, partita.hand, pref, partita.hand.filter(Boolean).length);
  if (piano.prima) return piano.prima;
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

const TENTATIVI = Number(process.argv[2] ?? 10);
const rng = createRng(20260906);

/** Gioca un Quadro fino alla fine. @returns {{vinto:boolean, mosse:number, punti:number}} */
function gioca(quadro) {
  let partita = iniziaQuadro(quadro, { now: 0 });
  const pref = preferenze(quadro);
  let guardia = 0;
  const tetto = quadro.maxMosse ?? 300;

  while (guardia < tetto + 5) {
    const stato = statoQuadro(quadro, partita);
    if (stato.finito) break;
    const mossa = scegliMossa(partita, pref, rng);
    if (!mossa) break;
    partita = giocaNelQuadro(quadro, partita, mossa.handIndex, mossa.row, mossa.col, guardia * 1000);
    guardia += 1;
  }

  const finale = statoQuadro(quadro, partita);
  return {
    vinto: finale.completato,
    mosse: partita.stats.moves,
    punti: partita.score,
    motivo: finale.motivo,
  };
}

console.log(`\nPLINTO — difficolta' dei Quadri: ${QUADRI.length} quadri x ${TENTATIVI} tentativi\n`);
console.log('  #  nome              obiettivo                mosse  riuscite  mosse usate  motivo del fallimento');
console.log('  ' + '-'.repeat(96));

const esiti = [];
for (const quadro of QUADRI) {
  const prove = [];
  for (let i = 0; i < TENTATIVI; i += 1) prove.push(gioca(quadro));

  const vinte = prove.filter((p) => p.vinto);
  const percentuale = (vinte.length / TENTATIVI) * 100;
  const mosseMedie = vinte.length
    ? Math.round(vinte.reduce((a, p) => a + p.mosse, 0) / vinte.length)
    : null;
  const motivi = {};
  prove.filter((p) => !p.vinto).forEach((p) => { motivi[p.motivo ?? 'ignoto'] = (motivi[p.motivo ?? 'ignoto'] ?? 0) + 1; });

  esiti.push({ quadro, percentuale, mosseMedie });

  const obiettivo = quadro.obiettivi.map((o) => `${o.tipo} ${o.quanti}`).join(' + ');
  const barra = '#'.repeat(Math.round(percentuale / 10)).padEnd(10, '.');
  console.log(
    `  ${String(quadro.numero).padStart(2)}  ${quadro.nome.padEnd(17)} ${obiettivo.padEnd(24)} `
    + `${String(quadro.maxMosse ?? '-').padStart(5)}  ${barra} ${String(Math.round(percentuale)).padStart(3)}%  `
    + `${String(mosseMedie ?? '-').padStart(11)}  ${Object.entries(motivi).map(([k, v]) => `${k} x${v}`).join(', ')}`,
  );
}

console.log('\n  ' + '-'.repeat(96));
const impossibili = esiti.filter((e) => e.percentuale === 0);
const banali = esiti.filter((e) => e.percentuale === 100 && e.quadro.numero > 6);
console.log(`  Quadri mai superati dall'IA: ${impossibili.length ? impossibili.map((e) => e.quadro.numero).join(', ') : 'nessuno'}`);
console.log(`  Quadri superati sempre, oltre i primi sei: ${banali.length ? banali.map((e) => e.quadro.numero).join(', ') : 'nessuno'}`);

// La curva: media delle riuscite per blocchi di dieci quadri.
console.log('\n  Andamento della curva (riuscite medie per gruppo di dieci):');
for (let i = 0; i < esiti.length; i += 10) {
  const gruppo = esiti.slice(i, i + 10);
  const media = gruppo.reduce((a, e) => a + e.percentuale, 0) / gruppo.length;
  console.log(`    quadri ${String(i + 1).padStart(2)}-${String(Math.min(i + 10, esiti.length)).padStart(2)}: ${'#'.repeat(Math.round(media / 5)).padEnd(20, '.')} ${media.toFixed(0)}%`);
}
console.log('');
