/**
 * Genera le schermate per gli store, dal gioco vero.
 *
 * Non sono mockup: ogni immagine e' una fotografia del gioco che gira, con stati
 * costruiti apposta perche' mostrino qualcosa di significativo invece di una griglia
 * a caso. Rifarle dopo una modifica all'interfaccia costa un comando.
 *
 * Uso: npm run schermate    (le immagini finiscono in store/)
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { createGame, serializeGame, placePiece } from '../src/core/engine.js';
import { gridFromString, allPlacements, fillRatio } from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';
import { COLOR_COUNT } from '../src/config/rules.js';
import { createRng } from '../src/core/rng.js';
import { chooseMove } from '../src/sim/player.mjs';
import { findCompletedGroups, placeShape } from '../src/core/grid.js';
import { existsSync } from 'node:fs';

/**
 * Percorso del browser.
 *
 * In questo ambiente di sviluppo Chromium e' preinstallato in una posizione fissa;
 * in integrazione continua e sulle macchine altrui lo installa Playwright, e quel
 * percorso non esiste. Se il percorso noto non c'e', si lascia decidere a Playwright
 * passando `undefined`: cosi' gli stessi script girano ovunque senza modifiche.
 */
const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;


const USCITA = new URL('../store/', import.meta.url).pathname;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

// 390x844 a densita' 3 = 1170x2532, la proporzione dei telefoni piu' diffusi.
const LARGHEZZA = 390;
const ALTEZZA = 844;
const DENSITA = 3;

await mkdir(USCITA, { recursive: true });

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore',
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({
  viewport: { width: LARGHEZZA, height: ALTEZZA },
  deviceScaleFactor: DENSITA,
  locale: 'it-IT',
});

const impostazioni = {
  introVista: true, tema: 'scuro', lingua: 'it',
  audio: true, vibrazione: true, animazioni: true, aiutoVisivo: true,
};

async function prepara({ partita = null, record = null, statistiche = null, sfide = null, quadri = null }) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate((dati) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify(dati.impostazioni));
    if (dati.partita) window.localStorage.setItem('plinto:partita', JSON.stringify(dati.partita));
    if (dati.record) window.localStorage.setItem('plinto:records', JSON.stringify(dati.record));
    if (dati.statistiche) window.localStorage.setItem('plinto:statistiche', JSON.stringify(dati.statistiche));
    if (dati.sfide) window.localStorage.setItem('plinto:sfide', JSON.stringify(dati.sfide));
    if (dati.quadri) window.localStorage.setItem('plinto:quadri', JSON.stringify(dati.quadri));
  }, { impostazioni, partita, record, statistiche, sfide, quadri });
  await page.reload({ waitUntil: 'networkidle' });
}

/**
 * Ridipinge una griglia con tutti i colori.
 *
 * `gridFromString` riempie ogni cella con lo stesso colore, perche' nasce per i test,
 * dove il colore non conta. In una schermata dello store conta eccome: una plancia
 * monocroma non e' il gioco che si vede giocando, e non c'e' motivo di mostrarne una.
 * Il seme e' fisso, quindi la stessa griglia produce sempre gli stessi colori.
 */
function colora(grid, seme) {
  const rng = createRng(seme);
  const fuori = new Uint8Array(grid);
  for (let i = 0; i < fuori.length; i += 1) {
    if (fuori[i] !== 0) fuori[i] = rng.int(COLOR_COUNT) + 1;
  }
  return fuori;
}

/**
 * @param {object} [opzioni]
 * @param {boolean} [opzioni.manoPiazzabile=true] pretende che ogni pezzo in mano abbia un
 *   posto dove andare. Va spento SOLO per la schermata di fine partita, dove i pezzi che
 *   non entrano non sono un difetto: sono il motivo per cui la partita e' finita.
 */
function partitaCon(grigliaTesto, forme, punteggio, catena = 0, seme = 77, { manoPiazzabile = true } = {}) {
  const base = createGame({ seed: 77, now: 0 });
  const grid = colora(gridFromString(grigliaTesto), seme);

  // Una schermata con dei pezzi che non entrano mostra tre riquadri spenti nel punto
  // in cui l'occhio cerca la mossa successiva. E' successo: la prima versione di questo
  // strumento ne produceva due su tre. Qui si controlla, invece di guardare l'immagine
  // e sperare.
  const senzaPosto = forme.filter((id) => allPlacements(grid, getShape(id)).length === 0);
  if (manoPiazzabile && senzaPosto.length > 0) {
    throw new Error(`Pezzi senza posto sulla griglia: ${senzaPosto.join(', ')}`);
  }

  return serializeGame({
    ...base,
    grid,
    hand: forme.map((id, i) => ({ uid: `s${i}`, shapeId: id, shape: getShape(id), color: (i % 6) + 1 })),
    score: punteggio,
    chain: catena,
  });
}

/**
 * Una partita VERA, giocata fino a quando lo stato serve.
 *
 * Le griglie scritte a mano hanno un difetto che si vede solo guardando l'immagine
 * finita: non sono posizioni che il gioco produce. Una di esse lasciava due pezzi su
 * tre senza un posto dove andare -- tre riquadri spenti nel punto in cui l'occhio
 * cerca la mossa successiva. Qui gioca il giocatore simulato, con il motore vero:
 * qualunque stato esca e' uno stato raggiungibile, e finche' la partita non e' finita
 * almeno un pezzo entra per costruzione.
 *
 * @param {number} seme
 * @param {(stato:object) => boolean} basta si ferma al primo stato che soddisfa questa
 * @returns {object} lo stato del motore, non serializzato
 */
function giocaFinche(seme, basta, { profilo = 'esperto', massimo = 400 } = {}) {
  let stato = createGame({ seed: seme, now: 0 });
  const rng = createRng((seme ^ 0x9e3779b9) >>> 0);
  for (let m = 0; m < massimo; m += 1) {
    if (stato.status !== 'playing') break;
    if (basta(stato)) return stato;
    const mossa = chooseMove(stato, profilo, rng);
    if (!mossa) break;
    stato = placePiece(stato, mossa.handIndex, mossa.row, mossa.col, m * 1000);
  }
  return stato;
}

/** La mossa in mano che chiude piu' gruppi, se ce n'e' una. */
function mossaPiuGrossa(stato) {
  let migliore = null;
  stato.hand.forEach((pezzo, handIndex) => {
    if (!pezzo) return;
    for (const [row, col] of allPlacements(stato.grid, pezzo.shape)) {
      const { grid } = placeShape(stato.grid, pezzo.shape, row, col, pezzo.color, pezzo.bombe);
      const gruppi = findCompletedGroups(grid).length;
      if (gruppi > (migliore?.gruppi ?? 0)) migliore = { handIndex, row, col, gruppi, pezzo };
    }
  });
  return migliore;
}

/**
 * Dove toccare per posare un pezzo con l'origine in (row, col).
 * Il gesto a due tocchi CENTRA il pezzo sulla cella toccata: l'inversa di
 * `origineDaCella` in `src/ui/useTrascinamento.js`. Scritta qui e non importata perche'
 * e' l'unico punto in cui serve, ma se quella cambia questa va cambiata con lei.
 */
function cellaDaToccare(shape, row, col) {
  return { row: row + Math.floor((shape.height - 1) / 2), col: col + Math.floor((shape.width - 1) / 2) };
}

/** Avanzamento finto: i primi `quanti` livelli superati, per mostrare la mappa viva. */
function progressiFinoA(quanti) {
  const livelli = {};
  for (let n = 1; n <= quanti; n += 1) {
    livelli[n] = { mosse: 9 + (n % 5), punteggio: 400 + n * 37, tentativi: 1 + (n % 3) };
  }
  return { versione: 1, livelli };
}

const RECORD = { best: 18740, bestChain: 7, bestMove: 612, bestGroupsInOneMove: 3 };
const STATISTICHE = {
  partite: 84, punteggioTotale: 268400, mosseTotali: 9120,
  gruppiTotali: 3180, griglieSvuotate: 6, tempoTotaleMs: 27_600_000,
};

// --- 1. Home ------------------------------------------------------------------
await prepara({ record: RECORD, sfide: { [new Date().toISOString().slice(0, 10)]: { best: 4120, partite: 3 } } });

/**
 * La versione mostrata dev'essere QUESTA versione.
 *
 * E' successo davvero: un server di sviluppo rimasto acceso da prima di un cambio di
 * versione ha prodotto schermate che dicevano `v1.6.0` mentre il gioco era alla 1.7.0.
 * Il numero della versione viene iniettato quando il server PARTE, non a ogni richiesta,
 * quindi le modifiche al codice si vedevano e quella no: il tipo di sbaglio che passa
 * inosservato proprio perche' tutto il resto e' aggiornato.
 *
 * Non e' un dettaglio da poco: queste immagini finiscono sulla scheda del Play Store, e
 * una schermata che dichiara una versione che non esiste piu' e' l'unica bugia che il
 * negozio racconterebbe al posto tuo.
 */
{
  const { readFile } = await import('node:fs/promises');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const mostrata = (await page.locator('.pl-home__versione').innerText().catch(() => '')).trim();
  if (mostrata !== `v${pkg.version}`) {
    throw new Error(
      `La home mostra "${mostrata}" invece di "v${pkg.version}". `
      + 'Quasi sempre e\' un server di sviluppo rimasto acceso da prima del cambio di '
      + 'versione: fermalo e rilancia questo comando.',
    );
  }
}

await page.screenshot({ path: `${USCITA}1-home.png` });

// --- 2. Partita in corso, con la Catena accesa --------------------------------
// Lo stato non e' scritto a mano: e' il primo momento, in una partita vera giocata dal
// giocatore simulato, in cui la Catena e' alta, la plancia e' piena a meta' e tutti e
// tre i pezzi hanno un posto dove andare.
const CATENA_ALTA = (x) => x.score >= 6000 && x.chain >= 6
  && x.hand.filter(Boolean).length === 3
  && x.hand.every((p) => allPlacements(x.grid, p.shape).length > 0);

const inCorso = giocaFinche(1, (x) => CATENA_ALTA(x) && fillRatio(x.grid) >= 0.33 && fillRatio(x.grid) <= 0.46);
if (!inCorso) throw new Error('Nessuno stato adatto alla schermata 2');
await prepara({ record: RECORD, partita: serializeGame(inCorso) });
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
await page.waitForTimeout(250);
await page.screenshot({ path: `${USCITA}2-partita.png` });

// --- 3. Il momento dell'eliminazione, con particelle e punti ------------------
// Stessa partita, e la mossa che chiude due gruppi insieme: e' l'Intreccio, la mossa
// che il gioco esiste per insegnare. Viene eseguita davvero, con i due tocchi.
const primaDelColpo = giocaFinche(1, (x) => CATENA_ALTA(x) && (mossaPiuGrossa(x)?.gruppi ?? 0) >= 2);
if (!primaDelColpo) throw new Error('Nessuno stato adatto alla schermata 3');
const colpo = mossaPiuGrossa(primaDelColpo);
const tocco = cellaDaToccare(colpo.pezzo.shape, colpo.row, colpo.col);

await prepara({ record: RECORD, partita: serializeGame(primaDelColpo) });
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
await page.locator('.pl-tray .pl-pezzo').nth(colpo.handIndex).click();
await page.locator('.pl-plancia .pl-cella').nth(tocco.row * 9 + tocco.col).click();
await page.waitForTimeout(150);   // a meta' animazione: particelle in volo e punti visibili
await page.screenshot({ path: `${USCITA}3-eliminazione.png` });

// --- 4. Fine partita ----------------------------------------------------------
await page.waitForTimeout(1200);
await prepara({
  record: { ...RECORD, best: 12000 },
  partita: (() => {
    const vuote = [
      [0, 0], [1, 3], [2, 6], [3, 1], [4, 4], [5, 7], [6, 2], [7, 5], [8, 8],
      [0, 4], [1, 7], [2, 1], [3, 5], [4, 8], [5, 2], [6, 6], [7, 0], [8, 3],
    ];
    const righe = Array.from({ length: 9 }, () => Array(9).fill('#'));
    vuote.forEach(([r, c]) => { righe[r][c] = '.'; });
    return partitaCon(
      righe.map((r) => r.join('')).join('\n'), ['p1', 'b33', 'h5'], 15230, 4, 77,
      { manoPiazzabile: false },   // e' la fine partita: e' proprio questo il punto
    );
  })(),
});
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
const finale = await page.evaluate(() => {
  const c = document.querySelectorAll('.pl-plancia .pl-cella')[0].getBoundingClientRect();
  const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
  return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 };
});
await page.mouse.move(finale.px, finale.py);
await page.mouse.down();
await page.mouse.move(finale.cx, finale.cy, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(700);
await page.screenshot({ path: `${USCITA}4-fine-partita.png` });

// --- 5. Statistiche -----------------------------------------------------------
await prepara({ record: RECORD, statistiche: STATISTICHE });
await page.getByRole('button', { name: 'Statistiche' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${USCITA}5-statistiche.png` });

// --- 6. Impostazioni: si vede che non c'e' niente da comprare -----------------
await page.locator('.pl-pagina__testata .pl-hud__menu').click();
await page.getByRole('button', { name: 'Impostazioni' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${USCITA}6-impostazioni.png` });

// --- 7. La mappa dei livelli, con un percorso gia' fatto ----------------------
// Cento livelli sono la meta' del gioco, e finora nessuna schermata li mostrava.
await prepara({ record: RECORD, quadri: progressiFinoA(23) });
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappa');
// LA MAPPA SI PORTA DA SOLA SUL LIVELLO CORRENTE, e in una schermata dello store quel
// punto di arrivo taglia a meta' il pulsante "Condividi il tuo percorso": resta sotto
// l'intestazione, e la prima immagine della scheda mostrerebbe un elemento mozzato.
//
// Qui c'era `window.scrollTo(0, 0)`, che era CODICE MORTO: a scorrere non e' la
// finestra ma un contenitore interno, `div.pl-scroll`, quindi window.scrollY era gia'
// zero e quella riga non ha mai spostato niente. Sembrava una precauzione presa, e per
// questo nessuno e' andato a controllare il risultato.
await page.evaluate(() => {
  const scorrevole = [...document.querySelectorAll('*')].find((n) => n.scrollTop > 0);
  if (scorrevole) scorrevole.scrollTop = 0;
});
await page.waitForTimeout(300);
// E si verifica, invece di sperarlo: niente di cliccabile deve restare sotto la testata.
const mozzato = await page.evaluate(() => {
  const testata = document.querySelector('.pl-pagina__testata, header');
  const sotto = testata ? testata.getBoundingClientRect().bottom : 0;
  // I comandi DENTRO la testata non sono mozzati: sono la testata. La prima stesura di
  // questo controllo li segnalava, e il primo che ha fermato la generazione era la
  // freccia "indietro". Un controllo che grida al primo giro insegna a spegnerlo.
  const sopra = [...document.querySelectorAll('button')]
    .filter((b) => !testata || !testata.contains(b))
    .map((b) => ({ testo: b.textContent.trim().slice(0, 40), top: Math.round(b.getBoundingClientRect().top) }))
    .filter((b) => b.top < sotto - 1 && b.top > -200);
  return { sotto: Math.round(sotto), sopra };
});
if (mozzato.sopra.length) {
  throw new Error(`La mappa dei livelli ha ${mozzato.sopra.length} comandi sotto la testata `
    + `(che finisce a ${mozzato.sotto}px): ${mozzato.sopra.map((b) => `"${b.testo}" a ${b.top}px`).join(', ')}`);
}
await page.screenshot({ path: `${USCITA}7-mappa-livelli.png` });

// --- 8. L'apertura di un livello: l'obiettivo detto prima di giocare ----------
await page.locator('.pl-tappa').nth(23).click();
await page.waitForSelector('.pl-apertura');
await page.waitForTimeout(300);
await page.screenshot({ path: `${USCITA}8-apertura-livello.png` });

// --- 9. Un livello in corso, con obiettivo e mosse in cima -------------------
// Appena aperto, un livello e' quasi vuoto e l'obiettivo segna zero: non e' il livello,
// e' il suo primo istante. Qui se ne giocano alcune mosse davvero, cercando a tentativi
// una posa valida -- non serve sapere quale sia, serve solo che il gioco l'accetti.
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-plancia');

const mosseRimaste = () => page.locator('.pl-obiettivo__mosse strong').innerText();
for (let fatte = 0; fatte < 6; fatte += 1) {
  const prima = await mosseRimaste();
  let riuscita = false;
  for (let pezzo = 0; pezzo < 3 && !riuscita; pezzo += 1) {
    for (let cella = 0; cella < 81 && !riuscita; cella += 1) {
      // Le celle centrali per prime: una plancia che si riempie dal centro si legge
      // meglio di una che si riempie dai bordi.
      const ordinata = (cella * 37 + 40) % 81;
      await page.locator('.pl-tray .pl-pezzo').nth(pezzo).click().catch(() => {});
      await page.locator('.pl-plancia .pl-cella').nth(ordinata).click().catch(() => {});
      if (await mosseRimaste() !== prima) riuscita = true;
    }
  }
  if (!riuscita) break;
  await page.waitForTimeout(120);
}
await page.waitForTimeout(400);
await page.screenshot({ path: `${USCITA}9-livello.png` });

await browser.close();
if (server) server.kill();

console.log(`\nSchermate generate in store/ a ${LARGHEZZA * DENSITA}x${ALTEZZA * DENSITA} px:`);
console.log('  1-home            2-partita          3-eliminazione');
console.log('  4-fine-partita    5-statistiche      6-impostazioni');
console.log('  7-mappa-livelli   8-apertura-livello 9-livello');
