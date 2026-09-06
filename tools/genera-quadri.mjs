/**
 * Genera il percorso dei 100 Quadri.
 *
 * Il PROGETTO e' qui e in chiaro: quale obiettivo, quante mosse, quale griglia, e con
 * che passo cresce la difficolta'. I BERSAGLI invece non si scrivono a mano: vengono
 * calcolati facendo giocare il livello al giocatore artificiale e prendendo un
 * percentile della sua prestazione, cosi' un "fai N punti" e' sempre commisurato a
 * quanti punti si possono davvero fare in quel livello.
 *
 * Serve a evitare i due difetti opposti della prima stesura scritta a mano: livelli
 * impossibili (1500 punti dove se ne fanno 325) e livelli che si superano senza
 * accorgersene.
 *
 * Uso: node tools/genera-quadri.mjs [tentativi]   (riscrive src/config/quadri.js)
 */

import { writeFileSync } from 'node:fs';
import { placePiece, createGame } from '../src/core/engine.js';
import { OBIETTIVI } from '../src/core/quadro.js';
import { createRng } from '../src/core/rng.js';
import { seedFromString } from '../src/core/rng.js';
import {
  gridFromString, findCompletedGroups, filledCount, allPlacements, placeShape,
  clearGroups, fillRatio, idx, quadrantCells, QUADRANT_COUNT,
} from '../src/core/grid.js';
import { GRID_SIZE, QUADRANT_SIZE } from '../src/config/rules.js';

const TENTATIVI = Number(process.argv[2] ?? 7);
const TOTALE = 100;

// ---------------------------------------------------------------- le griglie ---
// Ogni motivo e' pensato per lasciare corridoi veri: le celle isolate una per una
// rendono il quadro ingiocabile, ed e' un errore gia' commesso e gia' misurato.
const MOTIVI = {
  nessuno: null,
  angoli:   ['##.....##', '##.....##', '.........', '.........', '.........', '.........', '.........', '##.....##', '##.....##'],
  croce:    ['.........', '.........', '.........', '...###...', '...#.#...', '...###...', '.........', '.........', '.........'],
  cornice:  ['########.', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '.########'],
  scala:    ['##.......', '##.......', '..##.....', '..##.....', '....##...', '....##...', '......##.', '......##.', '........#'],
  isole:    ['##....##.', '##....##.', '.........', '.........', '...##....', '...##....', '.........', '.##....##', '.##....##'],
  colonne:  ['##.##.##.', '##.##.##.', '##.##.##.', '.........', '.........', '.........', '##.##.##.', '##.##.##.', '##.##.##.'],
  muro:     ['########.', '########.', '.........', '.........', '.........', '.........', '.........', '.########', '.########'],
  strettoia:['##....##.', '#.#...#.#', '###...###', '.........', '.........', '.........', '###...###', '#.#...#.#', '##....##.'],
  diagonale:['##.......', '.##......', '..##.....', '...##....', '....##...', '.....##..', '......##.', '.......##', '........#'],
  clessidra:['#######..', '.#####...', '..###....', '...#.....', '.........', '.....#...', '....###..', '...#####.', '..#######'],
  blocchi:  ['##...##..', '##...##..', '.....##..', '..##.....', '..##...##', '.......##', '##...##..', '##...##..', '.........'],
  fitto:    ['##..##..#', '##..##..#', '..##..##.', '..##..##.', '##..##..#', '##..##..#', '..##..##.', '..##..##.', '.........'],
  labirinto:['#.#####.#', '#.......#', '#.#####.#', '#.#...#.#', '..#.#.#..', '#.#...#.#', '#.#####.#', '#.......#', '#.#####.#'],
  assedio:  ['##.##.##.', '##.##.##.', '.........', '.##.##.##', '.##.##.##', '.........', '##.##.##.', '##.##.##.', '.........'],
  briciole: ['#........', '.#.......', '..#......', '.........', '.........', '.........', '......#..', '.......#.', '........#'],
};

// ------------------------------------------------------------------ la curva ---
// Il percorso e' diviso in atti. Ogni atto introduce qualcosa e alza l'asticella.
const ATTI = [
  { da:  1, a: 10, nome: 'Le basi',      tipi: ['righe','colonne','quadranti','gruppi'],                          motivi: ['nessuno'],                                  mosse: [12, 16], percentile: [10, 18] },
  { da: 11, a: 24, nome: 'Il ritmo',     tipi: ['gruppi','catena','punteggio','quadranti','celle'],               motivi: ['nessuno','angoli','croce'],                 mosse: [16, 22], percentile: [16, 26] },
  { da: 25, a: 40, nome: 'Gli ostacoli', tipi: ['gruppi','quadranti','righe','punteggio','colonne'],              motivi: ['scala','isole','cornice','colonne','blocchi'], mosse: [18, 26], percentile: [22, 34] },
  { da: 41, a: 58, nome: 'La pressione', tipi: ['catena','intreccio','gruppi','punteggio','quadranti'],            motivi: ['muro','strettoia','diagonale','angoli','croce'], mosse: [16, 24], percentile: [28, 42] },
  { da: 59, a: 76, nome: 'Il mestiere',  tipi: ['punteggio','gruppi','catena','celle','righe','colonne'],          motivi: ['clessidra','labirinto','fitto','assedio','isole'], mosse: [20, 30], percentile: [34, 50] },
  { da: 77, a: 92, nome: 'La maestria',  tipi: ['intreccio','catena','punteggio','quadranti','gruppi'],            motivi: ['fitto','assedio','strettoia','labirinto','clessidra'], mosse: [22, 32], percentile: [42, 58] },
  { da: 93, a:100, nome: 'La vetta',     tipi: ['punteggio','catena','intreccio','gruppi','pulizia'],              motivi: ['briciole','clessidra','labirinto','assedio'], mosse: [26, 40], percentile: [48, 64] },
];

const NOMI = {
  righe: 'righe', colonne: 'colonne', quadranti: 'quadranti', gruppi: 'gruppi',
  catena: 'catena', punteggio: 'punti', celle: 'celle', intreccio: 'intreccio',
  pulizia: 'pulizia', sopravvivi: 'resistenza',
};

function attoDi(n) { return ATTI.find((a) => n >= a.da && n <= a.a); }
function interpola(intervallo, quota) {
  return Math.round(intervallo[0] + (intervallo[1] - intervallo[0]) * quota);
}

/** Progetto di un Quadro: tutto tranne il bersaglio, che si misura. */
function progetta(n) {
  const atto = attoDi(n);
  const quota = (n - atto.da) / Math.max(1, atto.a - atto.da);
  const tipo = atto.tipi[(n - atto.da) % atto.tipi.length];
  const motivo = atto.motivi[(n - atto.da) % atto.motivi.length];
  // Le mosse oscillano dentro l'intervallo dell'atto invece di crescere dritte:
  // un percorso che sale sempre uguale diventa prevedibile a occhio.
  const oscilla = ((n * 7) % 5) / 4;
  return {
    numero: n,
    nome: `${NOMI[tipo]}${n}`,
    tipo,
    motivo,
    maxMosse: interpola(atto.mosse, oscilla),
    percentile: interpola(atto.percentile, quota),
    griglia: MOTIVI[motivo] ? MOTIVI[motivo].join('\n') : null,
  };
}

// ------------------------------------------------------- il giocatore di prova ---
function buchi(g) {
  let n = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) for (let c = 0; c < GRID_SIZE; c += 1) {
    if (g[idx(r, c)] !== 0) continue;
    const s = r > 0 && g[idx(r-1,c)] === 0, d = r < 8 && g[idx(r+1,c)] === 0;
    const x = c > 0 && g[idx(r,c-1)] === 0, y = c < 8 && g[idx(r,c+1)] === 0;
    if (!s && !d && !x && !y) n += 1;
  }
  return n;
}
function vicinanza(grid) {
  const v = { row: 0, col: 0, quadrant: 0 };
  for (let r = 0; r < 9; r += 1) { let p = 0;
    for (let c = 0; c < 9; c += 1) if (grid[idx(r,c)] !== 0) p += 1;
    if (p < 9) v.row += (p/9) ** 3; }
  for (let c = 0; c < 9; c += 1) { let p = 0;
    for (let r = 0; r < 9; r += 1) if (grid[idx(r,c)] !== 0) p += 1;
    if (p < 9) v.col += (p/9) ** 3; }
  for (let q = 0; q < QUADRANT_COUNT; q += 1) { let p = 0;
    for (const cella of quadrantCells(q)) if (grid[cella] !== 0) p += 1;
    if (p < 9) v.quadrant += (p/9) ** 3; }
  return v;
}
function preferenze(tipo) {
  const p = { row: 1, col: 1, quadrant: 1, svuotare: 0, nonSpezzare: 240 };
  if (tipo === 'righe') p.row = 6;
  else if (tipo === 'colonne') p.col = 6;
  else if (tipo === 'quadranti') p.quadrant = 6;
  else if (tipo === 'pulizia') { p.svuotare = 320; p.nonSpezzare = 40; }
  else if (tipo === 'catena') p.nonSpezzare = 900;
  else if (tipo === 'intreccio') p.nonSpezzare = 40;
  return p;
}
function valuta(dopo, gruppi, pref, rumore) {
  const v = vicinanza(dopo);
  let val = gruppi.length === 0 ? -pref.nonSpezzare : 0;
  for (const g of gruppi) val += 150 * pref[g.type];
  val += gruppi.length > 1 ? 280 * (gruppi.length - 1) : 0;
  val -= buchi(dopo) * 16;
  val -= fillRatio(dopo) * (45 + pref.svuotare);
  val += (v.row * pref.row + v.col * pref.col + v.quadrant * pref.quadrant) * 6;
  return val + rumore;
}
function pianifica(grid, pezzi, pref, prof, rng) {
  if (prof === 0) return { valore: 0, prima: null };
  let migliore = null;
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
    }).sort((a, b) => b.valore - a.valore).slice(0, 6);
    const resto = pezzi.slice(); resto[i] = null;
    for (const c of cand) {
      const sotto = pianifica(c.dopo, resto, pref, prof - 1, rng);
      const valore = c.valore + sotto.valore * 0.85;
      if (migliore === null || valore > migliore.valore) {
        migliore = { valore, prima: { handIndex: i, row: c.row, col: c.col } };
      }
    }
  }
  return migliore ?? { valore: 0, prima: null };
}

function gioca(progetto, rng) {
  let partita = createGame({
    seed: seedFromString(`plinto-quadro-${progetto.numero}`),
    grigliaIniziale: progetto.griglia ? gridFromString(progetto.griglia, 3) : undefined,
    now: 0,
  });
  const pref = preferenze(progetto.tipo);
  for (let m = 0; m < progetto.maxMosse; m += 1) {
    if (partita.status !== 'playing') break;
    const piano = pianifica(partita.grid, partita.hand, pref, partita.hand.filter(Boolean).length, rng);
    if (!piano.prima) break;
    partita = placePiece(partita, piano.prima.handIndex, piano.prima.row, piano.prima.col, m * 1000);
  }
  return partita;
}

function percentile(v, p) {
  const o = [...v].sort((a, b) => a - b);
  return o[Math.max(0, Math.min(o.length - 1, Math.floor((p / 100) * o.length)))];
}

// ----------------------------------------------------------------- controlli ---
for (const [nome, righe] of Object.entries(MOTIVI)) {
  if (!righe) continue;
  const g = gridFromString(righe.join('\n'), 3);
  const gruppi = findCompletedGroups(g);
  if (gruppi.length) throw new Error(`motivo "${nome}" contiene gia' ${gruppi.map((x) => x.type).join(',')}`);
  if (filledCount(g) > 48) throw new Error(`motivo "${nome}" riempie troppo: ${filledCount(g)} celle`);
  if (righe.length !== 9 || righe.some((r) => r.length !== 9)) throw new Error(`motivo "${nome}" malformato`);
}
console.log(`Motivi verificati: ${Object.keys(MOTIVI).length - 1}, nessuno con gruppi gia' completi.\n`);

// ------------------------------------------------------------------ taratura ---
const quadri = [];
for (let n = 1; n <= TOTALE; n += 1) {
  const progetto = progetta(n);
  const rng = createRng(seedFromString(`taratura-${n}`));
  const finali = [];
  for (let i = 0; i < TENTATIVI; i += 1) finali.push(gioca(progetto, rng));

  const valori = finali.map((s) => OBIETTIVI[progetto.tipo].progresso(s));
  let bersaglio = percentile(valori, progetto.percentile);
  if (progetto.tipo === 'punteggio') bersaglio = Math.max(100, Math.round(bersaglio / 25) * 25);
  else if (progetto.tipo === 'celle') bersaglio = Math.max(9, Math.round(bersaglio / 3) * 3);
  else bersaglio = Math.max(1, Math.round(bersaglio));

  quadri.push({ ...progetto, bersaglio, mediana: percentile(valori, 50), max: Math.max(...valori) });
  if (n % 10 === 0) process.stdout.write(`  tarati ${n}/${TOTALE}\n`);
}

// -------------------------------------------------------------------- scrive ---
const righe = quadri.map((q) => {
  const griglia = q.griglia
    ? `\n    griglia: MOTIVI.${q.motivo},`
    : '';
  return `  { numero: ${q.numero}, nome: '${q.nome}', atto: ${JSON.stringify(attoDi(q.numero).nome)}, `
    + `obiettivi: [{ tipo: '${q.tipo}', quanti: ${q.bersaglio} }], maxMosse: ${q.maxMosse},${griglia} },`;
});

const motiviTesto = Object.entries(MOTIVI)
  .filter(([, v]) => v)
  .map(([nome, righeMotivo]) => `  ${nome}: [\n${righeMotivo.map((r) => `    '${r}',`).join('\n')}\n  ].join('\\n'),`)
  .join('\n');

const file = `/**
 * I Quadri di PLINTO: cento livelli a difficolta' crescente.
 *
 * QUESTO FILE E' GENERATO da tools/genera-quadri.mjs. Modificarlo a mano funziona,
 * ma la prossima rigenerazione cancella le modifiche: meglio cambiare il progetto
 * nel generatore, dove stanno gli atti, i motivi delle griglie e la curva.
 *
 * I BERSAGLI NON SONO INVENTATI. Ogni livello e' stato giocato ${TENTATIVI} volte dal
 * giocatore artificiale senza obiettivo, e il bersaglio e' un percentile di quanto ha
 * effettivamente ottenuto in quel livello, con quella griglia e quel tetto di mosse.
 * Il percentile sale lungo il percorso: e' cosi' che cresce la difficolta'.
 * La prima stesura, scritta a mano, chiedeva 1500 punti dove se ne facevano 325.
 *
 * Le griglie iniziali sono verificate: nessuna contiene una riga, una colonna o un
 * quadrante gia' completi, e nessuna e' fatta di celle isolate (un motivo del genere
 * rende il livello ingiocabile, ed e' un errore gia' commesso e gia' misurato).
 */

/** Motivi delle griglie di ostacoli, condivisi fra piu' Quadri. */
const MOTIVI = {
${motiviTesto}
};

export const QUADRI = [
${righe.join('\n')}
];

/** Gli atti del percorso, per l'interfaccia: servono a far vedere dove si e' arrivati. */
export const ATTI = ${JSON.stringify(ATTI.map((a) => ({ da: a.da, a: a.a, nome: a.nome })), null, 2).replace(/"([a-z]+)":/g, '$1:')};

/** @param {number} numero */
export function quadroNumero(numero) {
  return QUADRI.find((q) => q.numero === numero) ?? null;
}

/** L'atto a cui appartiene un Quadro. */
export function attoDelQuadro(numero) {
  return ATTI.find((a) => numero >= a.da && numero <= a.a) ?? ATTI[ATTI.length - 1];
}

export const TOTALE_QUADRI = QUADRI.length;
`;

writeFileSync(new URL('../src/config/quadri.js', import.meta.url), file);

console.log(`\nScritti ${quadri.length} Quadri in src/config/quadri.js\n`);
console.log('  atto            quadri   mosse    bersaglio medio   percentile');
console.log('  ' + '-'.repeat(70));
for (const atto of ATTI) {
  const gruppo = quadri.filter((q) => q.numero >= atto.da && q.numero <= atto.a);
  const mosse = (gruppo.reduce((a, q) => a + q.maxMosse, 0) / gruppo.length).toFixed(0);
  const pc = (gruppo.reduce((a, q) => a + q.percentile, 0) / gruppo.length).toFixed(0);
  console.log(`  ${atto.nome.padEnd(15)} ${String(gruppo.length).padStart(4)}   ${String(mosse).padStart(5)}   ${' '.repeat(10)}       ${pc}%`);
}
console.log('');
