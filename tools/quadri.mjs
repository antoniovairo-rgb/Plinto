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
 * Uso: npm run quadri [tentativi] [base|anteprima]
 *
 * NOTA SULLA MISURA. Fino alla versione 1.0.2 il pianificatore simulava le posate
 * IGNORANDO le bombe (`placeShape` chiamata senza l'elenco dei blocchi esplosivi):
 * pianificava su una griglia leggermente diversa da quella che poi otteneva davvero.
 * Era un difetto del metro, non del gioco -- la mossa veniva comunque applicata dal
 * motore vero -- ma falsava i numeri con cui si tarano i bersagli. E' corretto da
 * qui in avanti, quindi le percentuali di riuscita NON sono confrontabili con quelle
 * pubblicate prima: vanno rimisurate entrambe le modalita'.
 */

import { QUADRI } from '../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro, MODALITA_QUADRI } from '../src/core/quadro.js';
import { createRng } from '../src/core/rng.js';
import {
  allPlacements, placeShape, findCompletedGroups, clearGroups, fillRatio, idx,
  quadrantCells, QUADRANT_COUNT,
} from '../src/core/grid.js';
import { GRID_SIZE, QUADRANT_SIZE, MODALITA } from '../src/config/rules.js';
import { accoglienza } from '../src/sim/accoglienza.mjs';

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
  valore += gruppi.length > 1 ? 120 * (gruppi.length - 1) : 0;   // gli intrecci valgono
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
function scegliMossa(partita, pref, rng) {
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

const TENTATIVI = Number(process.argv[2] ?? 10);
// Seconda posizione: la modalita'. `node tools/quadri.mjs 10 anteprima` misura gli
// stessi cento livelli giocati vedendo la terna successiva.
// Il valore predefinito e' la modalita' in cui i Quadri si giocano DAVVERO: uno
// strumento che misura di default qualcosa che nessuno gioca misura il livello
// sbagliato. `base` resta esplicito, per il confronto fra le due modalita'.
const MODO = process.argv[3] === 'base' ? MODALITA.BASE : MODALITA_QUADRI;
const rng = createRng(20260906);

/** Gioca un Quadro fino alla fine. @returns {{vinto:boolean, mosse:number, punti:number}} */
function gioca(quadro) {
  let partita = iniziaQuadro(quadro, { now: 0, modalita: MODO });
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
    // Quanto lontano e' arrivato: serve a capire DOVE mettere il bersaglio invece
    // di indovinarlo. Un quadro fallito al 90% e uno fallito al 10% sono due
    // problemi diversi e vanno corretti in modo diverso.
    progressi: finale.progressi.map((p) => ({ tipo: p.tipo, fatto: p.fatto, quanti: p.quanti })),
  };
}

console.log(`\nPLINTO — difficolta' dei Quadri: ${QUADRI.length} quadri x ${TENTATIVI} tentativi, modalita "${MODO}"\n`);
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

  // Per i quadri mai superati: quanto in media ci si e' avvicinati.
  const perse = prove.filter((p) => !p.vinto);
  const vicinanza = perse.length === 0 ? null : quadro.obiettivi.map((_, i) => {
    const medi = perse.reduce((a, p) => a + (p.progressi[i]?.fatto ?? 0), 0) / perse.length;
    const su = perse[0].progressi[i]?.quanti ?? 0;
    return `${perse[0].progressi[i]?.tipo ?? '?'} ${medi.toFixed(1)}/${su}`;
  }).join(', ');

  esiti.push({ quadro, percentuale, mosseMedie });

  const obiettivo = quadro.obiettivi.map((o) => `${o.tipo} ${o.quanti}`).join(' + ');
  const barra = '#'.repeat(Math.round(percentuale / 10)).padEnd(10, '.');
  console.log(
    `  ${String(quadro.numero).padStart(2)}  ${quadro.nome.padEnd(17)} ${obiettivo.padEnd(24)} `
    + `${String(quadro.maxMosse ?? '-').padStart(5)}  ${barra} ${String(Math.round(percentuale)).padStart(3)}%  `
    + `${String(mosseMedie ?? '-').padStart(11)}  `
    + `${percentuale === 0 ? `arrivato a ${vicinanza}` : Object.entries(motivi).map(([k, v]) => `${k} x${v}`).join(', ')}`,
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
