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
 * LA MODALITA' FA PARTE DELLA TARATURA. I Quadri si giocano vedendo la terna
 * successiva, e vedere avanti cambia due cose insieme: il giocatore sceglie meglio, e
 * il generatore legge la griglia in un altro momento (quindi lo STESSO seme produce
 * un'altra partita). Tarare i bersagli senza anteprima e poi giocarli con l'anteprima
 * significherebbe pubblicare bersagli misurati su livelli che non esistono. Qui il
 * giocatore artificiale gioca nella stessa modalita' in cui giochera' la persona.
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
import { MODALITA_QUADRI } from '../src/core/quadro.js';
import { accoglienza } from '../src/sim/accoglienza.mjs';
// Il giocatore che MIRA all'obiettivo: lo stesso, identico, che usa `npm run quadri` per
// verificare. Qui sotto ce n'e' un altro, che gioca SENZA obiettivo e serve a tarare: sono
// due mestieri diversi e vanno tenuti distinti. Quello che non si puo' fare -- e fino alla
// 1.1.0 si faceva -- e' avere due versioni diverse del giocatore che MIRA, una per chi
// promette che il livello e' superabile e una per chi lo controlla.
import {
  preferenze as preferenzeObiettivo, scegliMossa as scegliMossaObiettivo,
} from '../src/sim/giocatore-quadri.mjs';

const TENTATIVI = Number(process.argv[2] ?? 7);
const TOTALE = 100;

// ---------------------------------------------------------------- le griglie ---
// Ogni motivo e' pensato per lasciare corridoi veri: le celle isolate una per una
// rendono il quadro ingiocabile, ed e' un errore gia' commesso e gia' misurato.
//
// NON E' LA DENSITA', E' LA FORMA DEI VUOTI. Misurato: `labirinto` riempie 43 celle su 81
// -- il piu' pieno di tutti -- e il giocatore artificiale ci chiude 14 gruppi in trenta
// mosse. Le due versioni precedenti di `fitto` e `assedio` ne riempivano 36 e ne chiudevano
// zero. La differenza: `assedio` lasciava i vuoti come CELLE SINGOLE isolate (colonne 2, 5
// e 8 di una riga altrimenti piena), e chiudere quella riga chiedeva tre pezzi da una cella
// che non arrivano a comando; `fitto` spezzava ogni quadrante in due domino separati. Un
// motivo deve lasciare tratti liberi lunghi almeno due, e regioni libere connesse.
//
// Il controllo piu' in basso non descrive questa regola: la MISURA, giocando ogni motivo.
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
  fitto:    ['###...###', '###...###', '.........', '...###...', '...###...', '.........', '###...###', '###...###', '.........'],
  labirinto:['#.#####.#', '#.......#', '#.#####.#', '#.#...#.#', '..#.#.#..', '#.#...#.#', '#.#####.#', '#.......#', '#.#####.#'],
  assedio:  ['###...###', '##.....##', '#.......#', '.........', '.........', '.........', '#.......#', '##.....##', '###...###'],
  briciole: ['#........', '.#.......', '..#......', '.........', '.........', '.........', '......#..', '.......#.', '........#'],
};

// ------------------------------------------------------------------ la curva ---
// Il percorso e' diviso in atti. Ogni atto introduce qualcosa e alza l'asticella.
//
// NIENTE `pulizia` FRA I TIPI, ED E' UNA MISURA NON UN GUSTO. L'ultimo atto chiedeva, al
// quadro 97, di svuotare completamente la plancia in 40 mosse. Misurato con un giocatore
// che ottimizza SOLO quello -- il riempimento pesa piu' di ogni altra cosa -- su trenta
// partite: svuotata zero volte con 40 mosse, zero con 80, zero con 160, zero con 320. Il
// riempimento non e' mai sceso sotto l'11%, e non scendeva piu' a nessun tetto di mosse:
// dare piu' tempo non serviva a niente. Nella partita libera lo svuotamento capita, ma
// una volta ogni ~2400 mosse di gioco esperto: in un livello da 40 mosse e' un biglietto
// della lotteria, non una prova di abilita'.
//
// Un livello che promette un obiettivo deve poterlo mantenere. `pulizia` resta un tipo di
// obiettivo che il motore sa leggere -- e resta il bonus piu' bello del gioco quando
// capita -- ma non ci si costruisce sopra un livello.
const ATTI = [
  { da:  1, a: 10, nome: 'Le basi',      tipi: ['righe','colonne','quadranti','gruppi'],                          motivi: ['nessuno'],                                  mosse: [12, 16], percentile: [10, 18] },
  { da: 11, a: 24, nome: 'Il ritmo',     tipi: ['gruppi','catena','punteggio','quadranti','celle'],               motivi: ['nessuno','angoli','croce'],                 mosse: [16, 22], percentile: [16, 26] },
  { da: 25, a: 40, nome: 'Gli ostacoli', tipi: ['gruppi','quadranti','righe','punteggio','colonne'],              motivi: ['scala','isole','cornice','colonne','blocchi'], mosse: [18, 26], percentile: [22, 34] },
  { da: 41, a: 58, nome: 'La pressione', tipi: ['catena','intreccio','gruppi','punteggio','quadranti'],            motivi: ['muro','strettoia','diagonale','angoli','croce'], mosse: [16, 24], percentile: [28, 42] },
  { da: 59, a: 76, nome: 'Il mestiere',  tipi: ['punteggio','gruppi','catena','celle','righe','colonne'],          motivi: ['clessidra','labirinto','fitto','assedio','isole'], mosse: [20, 30], percentile: [34, 50] },
  { da: 77, a: 92, nome: 'La maestria',  tipi: ['intreccio','catena','punteggio','quadranti','gruppi'],            motivi: ['fitto','assedio','strettoia','labirinto','clessidra'], mosse: [22, 32], percentile: [42, 58] },
  { da: 93, a:100, nome: 'La vetta',     tipi: ['punteggio','catena','intreccio','gruppi','celle'],                motivi: ['briciole','clessidra','labirinto','assedio'], mosse: [26, 40], percentile: [48, 64] },
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
// Gli stessi tre numeri di tools/taratura.mjs e tools/quadri.mjs: chi tara e chi
// verifica devono usare lo stesso metro.
const ALTERNATIVE_CON_ANTEPRIMA = 10;
const PESO_ANTEPRIMA = 0.6;
const PENALITA_BLOCCO = 1200;

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
    }).sort((a, b) => b.valore - a.valore).slice(0, 6);
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
        const acc = accoglienza(r.griglia, dopo, (g, gruppi) => valuta(g, gruppi, pref, 0));
        return { ...r, valore: r.valore + PESO_ANTEPRIMA * acc.valore - (acc.bloccato ? PENALITA_BLOCCO : 0) };
      })
    : rami;
  return candidate.reduce((a, b) => (b.valore > a.valore ? b : a)).prima;
}

function gioca(progetto, rng) {
  let partita = createGame({
    seed: seedFromString(`plinto-quadro-${progetto.numero}`),
    grigliaIniziale: progetto.griglia ? gridFromString(progetto.griglia, 3) : undefined,
    now: 0,
    modalita: MODALITA_QUADRI,
  });
  const pref = preferenze(progetto.tipo);
  for (let m = 0; m < progetto.maxMosse; m += 1) {
    if (partita.status !== 'playing') break;
    const mossa = scegliMossa(partita, pref, rng);
    if (!mossa) break;
    partita = placePiece(partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
  }
  return partita;
}

/**
 * Gioca un Quadro PUNTANDO al suo bersaglio, e dice se ce l'ha fatta.
 *
 * Differenza dal `gioca` qui sopra, che serve a tarare: quello gioca senza obiettivo e
 * arriva in fondo alle mosse, perche' misura FIN DOVE si arriva. Questo si ferma appena
 * il bersaglio e' raggiunto, perche' misura una cosa sola: il livello si supera, si' o no.
 */
function superato(progetto, bersaglio, rng) {
  const leggi = OBIETTIVI[progetto.tipo].progresso;
  let partita = createGame({
    seed: seedFromString(`plinto-quadro-${progetto.numero}`),
    grigliaIniziale: progetto.griglia ? gridFromString(progetto.griglia, 3) : undefined,
    now: 0,
    modalita: MODALITA_QUADRI,
  });
  // `preferenze` del modulo condiviso vuole il QUADRO, non il tipo: prende l'obiettivo
  // dalla stessa forma che ha il livello in src/config/quadri.js.
  const pref = preferenzeObiettivo({ obiettivi: [{ tipo: progetto.tipo, quanti: bersaglio }] });
  for (let m = 0; m < progetto.maxMosse; m += 1) {
    if (leggi(partita) >= bersaglio) return true;
    if (partita.status !== 'playing') break;
    const mossa = scegliMossaObiettivo(partita, pref, rng);
    if (!mossa) break;
    partita = placePiece(partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
  }
  return leggi(partita) >= bersaglio;
}

/** Il gradino sotto un bersaglio, nella scala del suo tipo. */
function scendiDiUno(tipo, bersaglio) {
  if (tipo === 'punteggio') return Math.max(100, bersaglio - 25);
  if (tipo === 'celle') return Math.max(9, bersaglio - 3);
  return Math.max(1, bersaglio - 1);
}

/** Il bersaglio piu' basso che il tipo ammette: sotto, il livello sarebbe gia' vinto. */
function fondoScala(tipo) {
  if (tipo === 'punteggio') return 100;
  if (tipo === 'celle') return 9;
  return 1;
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
console.log(`Motivi verificati: ${Object.keys(MOTIVI).length - 1}, nessuno con gruppi gia' completi.`);

/**
 * E poi il controllo che mancava: ogni motivo dev'essere GIOCABILE.
 *
 * I due controlli qui sopra guardano la griglia FERMA -- nessun gruppo gia' chiuso, non
 * troppo piena, nove per nove -- e li passavano anche due motivi su cui il giocatore
 * artificiale, in trenta mosse, non chiudeva NEMMENO UN GRUPPO. Minimo, mediana e massimo
 * a zero: non un bersaglio troppo alto (il minimo possibile e' 1, e neanche quello era
 * raggiungibile) ma una griglia che blocca la plancia. Cinque livelli su cento erano
 * imbattibili per questo, e nessun controllo se ne accorgeva perche' nessuno PROVAVA A
 * GIOCARLI.
 *
 * Il difetto tipico non e' la densita': e' la FORMA dei vuoti. Un motivo che lascia buchi
 * da una cella isolata chiede pezzi da una cella, e quelli non arrivano a comando.
 * Questo controllo non prova a descrivere la regola -- la misura.
 */
const PROVE_MOTIVO = 3;
const MOSSE_PROVA = 30;
console.log(`\nGiocabilita' dei motivi: ${PROVE_MOTIVO} partite da ${MOSSE_PROVA} mosse ciascuno`);
const inguocabili = [];
for (const [nome, righe] of Object.entries(MOTIVI)) {
  if (!righe) continue;
  const chiusi = [];
  for (let p = 0; p < PROVE_MOTIVO; p += 1) {
    const finto = {
      numero: 9000 + p, nome, tipo: 'gruppi', motivo: nome,
      maxMosse: MOSSE_PROVA, percentile: 50, griglia: righe.join('\n'),
    };
    const fine = gioca(finto, createRng(seedFromString(`motivo-${nome}-${p}`)));
    chiusi.push(fine.stats.clearedRows + fine.stats.clearedCols + fine.stats.clearedQuadrants);
  }
  const minimo = Math.min(...chiusi);
  const media = chiusi.reduce((a, b) => a + b, 0) / chiusi.length;
  console.log(
    `  ${nome.padEnd(10)} celle piene ${String(filledCount(gridFromString(righe.join('\n'), 3))).padStart(2)}`
    + `  gruppi chiusi: ${chiusi.join(', ')}  (minimo ${minimo}, media ${media.toFixed(1)})`,
  );
  // La soglia e' bassa di proposito: non si chiede che il motivo sia facile, si chiede
  // che sia GIOCABILE. Chiudere un gruppo in trenta mosse e' il minimo sindacale.
  if (minimo < 1) inguocabili.push(`${nome} (gruppi chiusi: ${chiusi.join(', ')})`);
}
if (inguocabili.length) {
  throw new Error(
    `Motivi su cui in ${MOSSE_PROVA} mosse non si chiude nemmeno un gruppo: `
    + `${inguocabili.join('; ')}. I livelli che li usano sarebbero imbattibili.`,
  );
}
console.log('');

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

/**
 * NESSUN LIVELLO IMBATTIBILE. Non un auspicio: un controllo che ferma la generazione.
 *
 * Un percorso a livelli si gioca in fila, e ogni livello si apre superando il precedente:
 * un solo muro non rende difficile QUEL livello, chiude tutti i novantanove che vengono
 * dopo. Il gioco deve essere divertente, non una tortura, e "divertente" qui ha un
 * significato che si puo' misurare: ogni livello dev'essere superabile.
 *
 * Il bersaglio viene da un percentile di quanto il giocatore artificiale ottiene giocando
 * SENZA obiettivo. E' una buona stima, ma resta una stima: chi punta a una cosa gioca
 * diversamente da chi gioca bene e basta, e su qualche livello i due possono non
 * coincidere. Qui il livello viene giocato PUNTANDO al suo bersaglio, e se non si arriva
 * alla soglia il bersaglio scende di un gradino alla volta finche' non ci si arriva.
 *
 * QUANTO ALTA LA SOGLIA, E QUANTE PROVE. Ci sono voluti tre giri per arrivarci, e i due
 * scarti valgono piu' del risultato.
 *
 * Una riuscita su quattro bastava a togliere i MURI -- nessun livello imbattibile -- ma non
 * le TORTURE: restavano livelli superati una volta su dieci. Possibile non e' divertente.
 *
 * Due riuscite su sei sembravano sistemarlo e non lo facevano: con sei prove non si
 * distingue un livello al 10% da uno al 40%. E' esattamente cosi' che il quadro 44 e'
 * passato -- per fortuna, non per merito.
 *
 * La tentazione successiva era "tre su dodici", che suona piu' severo. Non lo e'. Ecco la
 * probabilita' che un livello con la riuscita vera indicata in colonna passi il criterio:
 *
 *     criterio      p=0,10   p=0,20   p=0,30   p=0,40   p=0,60
 *     1 su  4        34,4%    59,0%    76,0%    87,0%    97,4%
 *     2 su  6        11,4%    34,5%    58,0%    76,7%    95,9%
 *     3 su 12        11,1%    44,2%    74,7%    91,7%    99,7%
 *     4 su 12         2,6%    20,5%    50,7%    77,5%    98,5%
 *     5 su 12         0,4%     7,3%    27,6%    56,2%    94,3%
 *
 * "Tre su dodici" lascia passare un livello al 10% con la stessa frequenza di "due su
 * sei": alzare le prove senza alzare la soglia non misura meglio, misura solo piu' a
 * lungo. "Cinque su dodici" invece boccerebbe la meta' dei livelli al 40%, che sono i
 * livelli duri legittimi -- il senso degli ultimi atti.
 *
 * QUATTRO SU DODICI e' il compromesso: lascia passare un livello-macina due volte su
 * cento, e ne conserva tre su quattro fra quelli che si superano il 40% delle volte.
 *
 * Se nemmeno al fondo della scala ci si arriva, la generazione FALLISCE nominando il
 * livello: vuol dire che il problema non e' il bersaglio ma il progetto -- la griglia, il
 * tetto di mosse, il tipo di obiettivo -- e va corretto qui sopra, non nascosto con un
 * numero piu' basso.
 *
 * Cosa NON garantisce: il metro non e' una persona. "Superato due volte su sei dal
 * giocatore artificiale" e' una soglia misurabile e ripetibile, non una promessa che il
 * livello sia piacevole. Quella la puo' dire solo chi gioca.
 */
const PROVE_SUPERAMENTO = 12;
const MINIME_RIUSCITE = 4;
console.log(
  `  Controllo che ogni livello sia superabile: almeno ${MINIME_RIUSCITE} riuscite `
  + `su ${PROVE_SUPERAMENTO} tentativi`,
);
const abbassati = [];
const muri = [];
for (const q of quadri) {
  // I sei semi sono gli STESSI a ogni gradino della discesa. Non e' un dettaglio: con lo
  // stesso seme il giocatore fa le stesse mosse e si ferma solo prima, quindi un bersaglio
  // piu' basso non puo' mai riuscire meno di uno piu' alto. Con semi nuovi a ogni gradino
  // la discesa diventerebbe un sorteggio, e si fermerebbe al primo colpo fortunato.
  const prova = (bersaglio) => {
    let vinte = 0;
    for (let i = 0; i < PROVE_SUPERAMENTO; i += 1) {
      if (superato(q, bersaglio, createRng(seedFromString(`prova-${q.numero}-${i}`)))) {
        vinte += 1;
        if (vinte >= MINIME_RIUSCITE) return true;
      }
      // Se le prove rimaste non bastano piu' a raggiungere la soglia, e' gia' deciso.
      if (vinte + (PROVE_SUPERAMENTO - i - 1) < MINIME_RIUSCITE) return false;
    }
    return false;
  };

  if (prova(q.bersaglio)) continue;

  const partenza = q.bersaglio;
  let bersaglio = q.bersaglio;
  const fondo = fondoScala(q.tipo);
  let riuscito = false;
  while (bersaglio > fondo) {
    bersaglio = scendiDiUno(q.tipo, bersaglio);
    if (prova(bersaglio)) { riuscito = true; break; }
  }
  if (!riuscito) {
    muri.push(`quadro ${q.numero} (${q.tipo}, ${q.maxMosse} mosse, motivo "${q.motivo}")`);
    continue;
  }
  q.bersaglio = bersaglio;
  abbassati.push(`quadro ${q.numero}: ${q.tipo} da ${partenza} a ${bersaglio}`);
}

if (abbassati.length) {
  console.log(`  Bersagli abbassati perche' sotto la soglia (${abbassati.length}):`);
  abbassati.forEach((r) => console.log(`    ${r}`));
} else {
  console.log('  Nessun bersaglio da abbassare: ogni livello si supera com era tarato.');
}
if (muri.length) {
  throw new Error(
    `Livelli sotto la soglia anche al bersaglio minimo: ${muri.join('; ')}. `
    + 'Non e il bersaglio a essere sbagliato: e il progetto del livello.',
  );
}

/**
 * I bersagli che NON sono stati misurati, ma inventati da un arrotondamento.
 *
 * I tre `Math.max` qui sopra danno un pavimento al bersaglio -- 100 punti, 9 celle, 1
 * gruppo -- perche' un bersaglio zero sarebbe un livello gia' vinto. Ma quando il
 * giocatore artificiale non arriva MAI a niente, cioe' quando il massimo misurato e' zero,
 * quel pavimento smette di essere una protezione e diventa esattamente la cosa che questo
 * file dichiara di non fare: un numero scritto a mano, spacciato per misura. Il livello
 * risulta imbattibile e il file non lo dice.
 *
 * Non e' un errore da fermare la generazione: "il metro non ci arriva mai" non e'
 * "nessuno ci arriva mai", e un obiettivo come svuotare la plancia una persona che ci
 * punta lo raggiunge dove un giocatore avido non ci prova. Ma va DETTO, ogni volta.
 */
const inventati = quadri.filter((q) => q.max === 0);
if (inventati.length) {
  console.log('\n  ATTENZIONE — bersagli non misurati ma imposti dal pavimento:');
  inventati.forEach((q) => {
    console.log(
      `    quadro ${String(q.numero).padStart(3)}  ${q.tipo.padEnd(10)} bersaglio ${q.bersaglio}  `
      + `(il metro non ci e' mai arrivato in ${q.maxMosse} mosse, su ${TENTATIVI} partite)`,
    );
  });
  console.log('    Questi livelli risultano imbattibili al metro. Non e una misura: e un pavimento.\n');
} else {
  console.log('\n  Nessun bersaglio imposto dal pavimento: tutti misurati davvero.\n');
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
 * TARATI NELLA MODALITA' "${MODALITA_QUADRI}", cioe' la stessa in cui i Quadri si giocano.
 * Non e' un dettaglio: vedere la terna successiva cambia l'ordine in cui il generatore
 * legge la griglia, quindi lo stesso seme produce un'altra partita. Un bersaglio tarato
 * senza anteprima e giocato con l'anteprima e' un bersaglio misurato su un livello che
 * non esiste. MODALITA_TARATURA qui sotto lo dichiara, e un test controlla che
 * coincida con la modalita' davvero giocata.
 *
 * Le griglie iniziali sono verificate: nessuna contiene una riga, una colonna o un
 * quadrante gia' completi, e nessuna e' fatta di celle isolate (un motivo del genere
 * rende il livello ingiocabile, ed e' un errore gia' commesso e gia' misurato).
 */

/** Motivi delle griglie di ostacoli, condivisi fra piu' Quadri. */
const MOTIVI = {
${motiviTesto}
};

/** La modalita' di gioco in cui questi bersagli sono stati misurati. */
export const MODALITA_TARATURA = '${MODALITA_QUADRI}';

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
