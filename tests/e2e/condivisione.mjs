/**
 * La scheda condivisibile, in un browser vero.
 *
 * Il passo che conta e' il TERZO: `navigator.share` non c'e' ovunque -- su desktop manca
 * quasi sempre -- e un pulsante che in quel caso non fa niente e' peggio di un pulsante
 * che manca, perche' chi lo tocca crede di aver condiviso. Qui `navigator.share` viene
 * TOLTO di proposito, e si verifica che il testo finisca comunque negli appunti con una
 * conferma a schermo.
 *
 * Gli altri passi guardano il testo vero, quello che il giocatore manderebbe agli amici:
 * che ci sia il collegamento, che sia sotto i 280 caratteri, e che non contenga spoiler.
 *
 * Uso: npm run condivisione
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { createGame, serializeGame } from '../../src/core/engine.js';
import { gridFromString } from '../../src/core/grid.js';
import { getShape } from '../../src/core/shapes.js';
import { LIMITE } from '../../src/core/scheda.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-e2e';
await (await import('node:fs/promises')).mkdir(OUT, { recursive: true });
const errori = [];

// Una partita libera a una mossa dalla fine, con due celle libere per ogni riga,
// colonna e quadrante: la mossa non chiude niente e gli altri due pezzi non entrano.
const quasiFinita = (() => {
  const base = createGame({ seed: 4242 });
  return serializeGame({
    ...base,
    grid: (() => {
      const vuote = [
        [0, 0], [1, 3], [2, 6], [3, 1], [4, 4], [5, 7], [6, 2], [7, 5], [8, 8],
        [0, 4], [1, 7], [2, 1], [3, 5], [4, 8], [5, 2], [6, 6], [7, 0], [8, 3],
      ];
      const righe = Array.from({ length: 9 }, () => Array(9).fill('#'));
      vuote.forEach(([r, c]) => { righe[r][c] = '.'; });
      return gridFromString(righe.map((r) => r.join('')).join('\n'));
    })(),
    hand: [
      { uid: 'c1', shapeId: 'p1', shape: getShape('p1'), color: 1 },
      { uid: 'c2', shapeId: 'b33', shape: getShape('b33'), color: 2 },
      { uid: 'c3', shapeId: 'h5', shape: getShape('h5'), color: 3 },
    ],
    score: 12345,
    stats: { ...base.stats, moves: 40, serieCatena: Array.from({ length: 40 }, (_, i) => i % 10) },
  });
})();

let server = null;
async function serverRisponde() {
  try {
    const r = await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: false,
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) {
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!(await serverRisponde())) {
    console.error('Impossibile avviare il server di sviluppo su', INDIRIZZO);
    process.exit(1);
  }
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const contesto = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'it-IT',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await contesto.newPage();
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));

// navigator.share viene tolto PRIMA che la pagina si carichi: e' la situazione di
// chiunque giochi da un computer, ed e' quella in cui il ripiego deve funzionare.
await contesto.addInitScript(() => {
  try { delete Navigator.prototype.share; } catch { /* gia' assente */ }
});

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate((dati) => {
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
  }));
  window.localStorage.setItem('plinto:partita', JSON.stringify(dati));
}, quasiFinita);
await page.reload({ waitUntil: 'networkidle' });

console.log(`0. navigator.share presente: ${await page.evaluate(() => Boolean(navigator.share))}`);

// ---------- 1. Si finisce una partita ----------
await page.getByRole('button', { name: /^(Riprendi la partita|Partita libera)(,|$)/ }).click();
await page.waitForSelector('.pl-plancia');
const bersaglio = await page.evaluate(() => {
  const c = document.querySelectorAll('.pl-plancia .pl-cella')[0].getBoundingClientRect();
  const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
  return {
    cx: c.left + c.width / 2, cy: c.top + c.height / 2,
    px: p.left + p.width / 2, py: p.top + p.height / 2,
  };
});
await page.mouse.move(bersaglio.px, bersaglio.py);
await page.mouse.down();
await page.mouse.move(bersaglio.cx, bersaglio.cy, { steps: 10 });
await page.mouse.up();
await page.waitForSelector('.pl-fine', { timeout: 10000 });
console.log('1. partita finita: schermata di fine mostrata');

// ---------- 2. La scheda e' a schermo, ed e' testo ----------
const scheda = (await page.locator('.pl-scheda').innerText()).trim();
await page.screenshot({ path: `${OUT}/condivisione-01.png`, fullPage: true });
const righe = scheda.split('\n');
console.log(`2. scheda a schermo: ${righe.length} righe, ${scheda.length} caratteri`);
righe.forEach((r) => console.log(`     ${r}`));

if (scheda.length === 0) errori.push('SCHEDA: non compare nessun testo');
if (scheda.length > LIMITE) {
  errori.push(`SCHEDA: ${scheda.length} caratteri, oltre il limite di ${LIMITE}`);
}
if (!/PLINTO/.test(scheda)) errori.push('SCHEDA: non nomina il gioco');
if (!/[▁▂▃▄▅▆▇█]/u.test(scheda)) errori.push('SCHEDA: manca la riga con la forma della partita');
if (!/https?:\/\//.test(scheda)) errori.push('SCHEDA: manca il collegamento al gioco');
if (/undefined|NaN|null/.test(scheda)) errori.push(`SCHEDA: contiene un valore rotto — ${scheda}`);
// Niente spoiler: gli identificativi delle forme non devono comparire.
if (/\b[bhvpd]\d{1,2}\b/.test(scheda)) errori.push('SCHEDA: contiene identificativi di forme (spoiler)');

// ---------- 3. Il ripiego sugli appunti, che e' il motivo di questo scenario ----------
await page.getByRole('button', { name: /Condividi il risultato/ }).click();
await page.waitForTimeout(400);
const conferma = await page.locator('.pl-condividi .pl-nota').innerText().catch(() => '');
const appunti = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
console.log(`3. senza navigator.share: conferma "${conferma.trim()}"`);
console.log(`   negli appunti: ${appunti.length} caratteri`);

if (!conferma.trim()) errori.push('CONDIVISIONE: nessuna conferma a schermo dopo il tocco');
if (appunti.trim() !== scheda) {
  errori.push('CONDIVISIONE: negli appunti non c e lo stesso testo mostrato a schermo');
}

// ---------- 4. La riga di blocchi e' decorativa ----------
const nascosta = await page.locator('.pl-scheda__forma[aria-hidden="true"]').count();
console.log(`4. riga di blocchi nascosta ai lettori di schermo: ${nascosta === 1}`);
if (nascosta !== 1) {
  errori.push('ACCESSIBILITA: la riga di blocchi non e marcata come decorativa');
}

// ---------- 5. La scheda del PERCORSO, presa dalla mappa ----------
// Esiste perche' la condivisione a fine livello si puo' cogliere solo nell'istante in
// cui quel livello finisce: chi vuole raccontare a che punto e' arrivato dovrebbe
// altrimenti rigiocare un livello apposta.
await page.evaluate(() => {
  // Sette livelli superati: abbastanza da riempire un pezzo di barra e non tutta.
  // La forma e' quella di `progressi.js`: un contenitore con `versione` e `livelli`,
  // e un livello si considera superato dalla presenza di `mosse`.
  const livelli = {};
  for (let n = 1; n <= 7; n += 1) livelli[n] = { mosse: 10, punteggio: 100, tentativi: 1 };
  window.localStorage.setItem('plinto:quadri', JSON.stringify({ livelli, versione: 1 }));
});
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappe');

const pulsantePercorso = page.getByRole('button', { name: /Condividi il tuo percorso/ });
const cePercorso = await pulsantePercorso.count();
// Sulla mappa l'anteprima e' spenta: la scheda starebbe fra l'avanzamento e i cento
// livelli, spingendoli tutti piu' giu' per mostrare un testo che nessuno ha chiesto.
const anteprimaPrima = await page.locator('.pl-condividi .pl-scheda').count();
console.log(`5. mappa: pulsante del percorso presente ${cePercorso === 1}, anteprima prima del tocco ${anteprimaPrima}`);
if (cePercorso !== 1) {
  errori.push('PERCORSO: dalla mappa non si puo condividere l avanzamento');
} else {
  if (anteprimaPrima !== 0) errori.push('PERCORSO: l anteprima occupa la mappa prima ancora di toccare il pulsante');
  await pulsantePercorso.click();
  await page.waitForTimeout(400);
  const schedaPercorso = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  schedaPercorso.split('\n').forEach((r) => console.log(`     ${r}`));
  if (!/PLINTO/.test(schedaPercorso)) errori.push('PERCORSO: la scheda non nomina il gioco');
  if (!/7 livelli su 100/.test(schedaPercorso)) errori.push(`PERCORSO: avanzamento sbagliato — "${schedaPercorso}"`);
  if (!/[█▁]{16}/u.test(schedaPercorso)) errori.push('PERCORSO: manca la barra dell avanzamento');
  if (!/https?:\/\//.test(schedaPercorso)) errori.push('PERCORSO: manca il collegamento al gioco');
  if (/undefined|NaN|null/.test(schedaPercorso)) errori.push(`PERCORSO: valore rotto — "${schedaPercorso}"`);
  // Il terzo gradino del ripiego non dipende da un parametro: se copiare non riesce, il
  // testo deve tornare a schermo anche dove l'anteprima e' spenta.
  const anteprimaDopo = await page.locator('.pl-condividi .pl-scheda').count();
  if (anteprimaDopo !== 1) errori.push('PERCORSO: dopo il tocco la scheda non compare a schermo');
  await page.screenshot({ path: `${OUT}/condivisione-02-percorso.png`, fullPage: true });
}

// ---------- 6. A zero livelli il pulsante non c'e' ----------
// "0 livelli su 100" non e' un vanto, ed e' una domanda a cui nessuno vuole rispondere.
await page.evaluate(() => window.localStorage.removeItem('plinto:quadri'));
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappe');
const aZero = await page.getByRole('button', { name: /Condividi il tuo percorso/ }).count();
console.log(`6. senza nessun livello superato il pulsante non compare: ${aZero === 0}`);
if (aZero !== 0) errori.push('PERCORSO: si puo condividere un percorso ancora vuoto');

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Scheda condivisibile: testo corretto, sotto il limite, e il ripiego sugli appunti funziona.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
