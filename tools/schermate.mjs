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
import { gridFromString, allPlacements } from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';

const USCITA = new URL('../store/', import.meta.url).pathname;
const INDIRIZZO = process.env.QUADRA_E2E_URL ?? 'http://localhost:5173/';
const ESEGUIBILE = process.env.QUADRA_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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

async function prepara({ partita = null, record = null, statistiche = null, sfide = null }) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate((dati) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify(dati.impostazioni));
    if (dati.partita) window.localStorage.setItem('plinto:partita', JSON.stringify(dati.partita));
    if (dati.record) window.localStorage.setItem('plinto:records', JSON.stringify(dati.record));
    if (dati.statistiche) window.localStorage.setItem('plinto:statistiche', JSON.stringify(dati.statistiche));
    if (dati.sfide) window.localStorage.setItem('plinto:sfide', JSON.stringify(dati.sfide));
  }, { impostazioni, partita, record, statistiche, sfide });
  await page.reload({ waitUntil: 'networkidle' });
}

function partitaCon(grigliaTesto, forme, punteggio, catena = 0) {
  const base = createGame({ seed: 77, now: 0 });
  return serializeGame({
    ...base,
    grid: gridFromString(grigliaTesto),
    hand: forme.map((id, i) => ({ uid: `s${i}`, shapeId: id, shape: getShape(id), color: (i % 6) + 1 })),
    score: punteggio,
    chain: catena,
  });
}

const RECORD = { best: 18740, bestChain: 7, bestMove: 612, bestGroupsInOneMove: 3 };
const STATISTICHE = {
  partite: 84, punteggioTotale: 268400, mosseTotali: 9120,
  gruppiTotali: 3180, griglieSvuotate: 6, tempoTotaleMs: 27_600_000,
};

// --- 1. Home ------------------------------------------------------------------
await prepara({ record: RECORD, sfide: { [new Date().toISOString().slice(0, 10)]: { best: 4120, partite: 3 } } });
await page.screenshot({ path: `${USCITA}1-home.png` });

// --- 2. Partita in corso, con la Catena accesa --------------------------------
await prepara({
  record: RECORD,
  partita: partitaCon(`
    ###...##.
    ##..##.#.
    #..###..#
    .###..##.
    ##..##..#
    .#.##..##
    ##..#.##.
    .##..##..
    #.##..#.#
  `, ['a5ne', 'b22', 'h3'], 7460, 5),
});
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
await page.screenshot({ path: `${USCITA}2-partita.png` });

// --- 3. Il momento dell'eliminazione, con particelle e punti ------------------
await prepara({
  record: RECORD,
  partita: partitaCon(`
    ########.
    ##.###.##
    #.##..###
    ###.###.#
    .##.##.##
    ##.###..#
    #.##..##.
    .###.##.#
    ##.#.##..
  `, ['p1', 'b22', 'h3'], 9880, 6),
});
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
const bersaglio = await page.evaluate(() => {
  const c = document.querySelectorAll('.pl-plancia .pl-cella')[8].getBoundingClientRect();
  const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
  const cella = p.firstElementChild ? null : null;
  return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 };
});
await page.mouse.move(bersaglio.px, bersaglio.py);
await page.mouse.down();
await page.mouse.move(bersaglio.cx, bersaglio.cy, { steps: 8 });
await page.mouse.up();
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
    return partitaCon(righe.map((r) => r.join('')).join('\n'), ['p1', 'b33', 'h5'], 15230, 4);
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

await browser.close();
if (server) server.kill();

console.log(`\nSchermate generate in store/ a ${LARGHEZZA * DENSITA}x${ALTEZZA * DENSITA} px:`);
console.log('  1-home  2-partita  3-eliminazione  4-fine-partita  5-statistiche  6-impostazioni');
