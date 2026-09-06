/**
 * Prova di resistenza: una sessione lunga, come quella di chi gioca sul serio.
 *
 * Non verifica le regole (ci pensano i test unitari): verifica che dopo centinaia di
 * mosse il gioco sia ancora fluido, non abbia accumulato memoria e non abbia lasciato
 * per strada nodi, timer o cicli di animazione. Sono i difetti che non si vedono mai
 * in una partita di prova da dieci mosse e che rovinano quelle vere.
 *
 * Uso: npm run soak    (oppure: node tests/e2e/resistenza.mjs [mosse])
 */

import { chromium } from 'playwright';
import { deserializeGame } from '../../src/core/engine.js';
import { allPlacements, findCompletedGroups, placeShape, fillRatio } from '../../src/core/grid.js';

const MOSSE = Number(process.argv[2] ?? 400);
const INDIRIZZO = process.env.QUADRA_E2E_URL ?? 'http://localhost:5173/';
const ESEGUIBILE = process.env.QUADRA_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const errori = [];

async function serverRisponde() {
  try {
    const r = await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore',
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) {
    await new Promise((r) => setTimeout(r, 400));
  }
}

const browser = await chromium.launch({
  executablePath: ESEGUIBILE,
  args: ['--js-flags=--expose-gc'],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate(() => window.localStorage.setItem('quadra:settings', JSON.stringify({ introVista: true })));
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.q-plancia');

/** Memoria JS occupata, se il browser la espone. */
const memoria = () => page.evaluate(() => performance.memory?.usedJSHeapSize ?? 0);

// Contatore di fotogrammi: serve a stimare la fluidita' reale durante il gioco.
await page.evaluate(() => {
  window.__fotogrammi = [];
  let precedente = performance.now();
  const conta = (ora) => {
    window.__fotogrammi.push(ora - precedente);
    precedente = ora;
    requestAnimationFrame(conta);
  };
  requestAnimationFrame(conta);
});

const memoriaIniziale = await memoria();
const nodiIniziali = await page.evaluate(() => document.querySelectorAll('*').length);
const inizio = Date.now();

let mosseRiuscite = 0;
let mosseFallite = 0;
const fallimenti = [];
let partite = 1;

/**
 * Sceglie una mossa sensata leggendo la partita dal salvataggio locale.
 *
 * Il gioco salva lo stato a ogni mossa, quindi qui si puo' usare il motore VERO per
 * decidere dove giocare, invece di cliccare a caso. Senza questo, la prova di
 * resistenza produceva pochissime mosse valide e non metteva sotto sforzo niente:
 * misurava la fluidita' di un gioco fermo.
 */
function scegliMossa(stato) {
  let migliore = null;
  let valoreMigliore = -Infinity;
  stato.hand.forEach((pezzo, indice) => {
    if (!pezzo) return;
    for (const [row, col] of allPlacements(stato.grid, pezzo.shape)) {
      const { grid: dopo } = placeShape(stato.grid, pezzo.shape, row, col, 1);
      const valore = findCompletedGroups(dopo).length * 100 - fillRatio(dopo) * 30 + Math.random();
      if (valore > valoreMigliore) {
        valoreMigliore = valore;
        migliore = { indice, row, col, forma: { w: pezzo.shape.width, h: pezzo.shape.height } };
      }
    }
  });
  return migliore;
}

for (let i = 0; i < MOSSE; i += 1) {
  const salvata = await page.evaluate(() => window.localStorage.getItem('quadra:partita'));
  const stato = salvata ? deserializeGame(JSON.parse(salvata)) : null;
  if (!stato) { await page.waitForTimeout(60); continue; }

  const mossa = scegliMossa(stato);
  if (!mossa) { await page.waitForTimeout(60); continue; }

  // Coordinate esatte del trascinamento: si afferra il pezzo al centro del suo
  // riquadro e lo si lascia dove quel centro fa cadere l'origine sulla cella voluta.
  const punti = await page.evaluate(({ indice, row, col, forma }) => {
    // Si parte dallo SLOT, non dal disegno: il tray disegna un .q-pezzo solo per gli
    // slot ancora pieni, quindi l'indice del pezzo in mano non coincide con l'indice
    // nella lista dei disegni appena uno dei tre e' stato usato.
    const slot = document.querySelectorAll('.q-tray .q-tray__posto')[indice];
    const pezzo = slot?.querySelector('.q-pezzo');
    if (!pezzo) return null;
    const rp = pezzo.getBoundingClientRect();
    const celle = document.querySelectorAll('.q-plancia .q-cella');
    const c0 = celle[0].getBoundingClientRect();
    const c8 = celle[8].getBoundingClientRect();
    const c72 = celle[72].getBoundingClientRect();
    const passoX = (c8.left - c0.left) / 8;
    const passoY = (c72.top - c0.top) / 8;

    // La presa va calcolata ESATTAMENTE come la calcola il gioco: in unita' di cella
    // del tray, spaziature comprese. Approssimare con "meta' della larghezza in celle"
    // introduce un errore di quasi un quarto di cella sui pezzi larghi, che a volte
    // supera la meta' cella dell'arrotondamento e fa fallire mosse legittime.
    const primaCellaTray = pezzo.firstElementChild.getBoundingClientRect();
    const px = rp.left + rp.width / 2;
    const py = rp.top + rp.height / 2;
    const presaX = (px - rp.left) / primaCellaTray.width;
    const presaY = (py - rp.top) / primaCellaTray.height;

    return {
      px,
      py,
      cx: c0.left + col * passoX + presaX * c0.width,
      cy: c0.top + row * passoY + presaY * c0.height,
      diagnostica: { presaX, presaY, formaW: forma.w, formaH: forma.h },
    };
  }, mossa);
  if (!punti) { mosseFallite += 1; continue; }

  const prima = await page.locator('.q-plancia .q-blocco').count();
  await page.mouse.move(punti.px, punti.py);
  await page.mouse.down();
  await page.mouse.move(punti.cx, punti.cy, { steps: 4 });
  await page.mouse.up();

  // Si aspetta che il salvataggio rifletta la mossa invece di contare su un ritardo
  // fisso: il gioco scrive lo stato in un effetto, dopo il disegno. Con una pausa a
  // occhio si finiva per calcolare la mossa successiva su una griglia vecchia, e la
  // colpa sembrava del trascinamento.
  const scadenzaSalvataggio = Date.now() + 400;
  while (Date.now() < scadenzaSalvataggio) {
    const ora = await page.evaluate(() => window.localStorage.getItem('quadra:partita'));
    if (ora !== salvata) break;
    await page.waitForTimeout(15);
  }
  const dopo = await page.locator('.q-plancia .q-blocco').count();
  if (dopo !== prima) mosseRiuscite += 1;
  else {
    mosseFallite += 1;
    if (fallimenti.length < 8) {
      fallimenti.push(`pezzo ${mossa.forma.w}x${mossa.forma.h} verso riga ${mossa.row} colonna ${mossa.col}`);
    }
  }

  // Se la partita e' finita si ricomincia: una sessione vera e' fatta di piu' partite.
  if (await page.locator('.q-fine__numero').count() > 0) {
    await page.getByRole('button', { name: /Gioca ancora/ }).click();
    await page.waitForSelector('.q-plancia');
    partite += 1;
  }
}

const durata = Date.now() - inizio;
await page.waitForTimeout(1200);

const fotogrammi = await page.evaluate(() => window.__fotogrammi.slice(30));
const ordinati = [...fotogrammi].sort((a, b) => a - b);
const mediana = ordinati[Math.floor(ordinati.length / 2)] ?? 0;
const p95 = ordinati[Math.floor(ordinati.length * 0.95)] ?? 0;
const lunghi = fotogrammi.filter((f) => f > 50).length;

await page.evaluate(() => window.gc?.());
await page.waitForTimeout(600);
const memoriaFinale = await memoria();
const nodiFinali = await page.evaluate(() => document.querySelectorAll('*').length);
const particelleVive = await page.evaluate(() => {
  const cv = document.querySelector('.q-plancia__particelle');
  if (!cv) return -1;
  const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  let opachi = 0;
  for (let i = 3; i < d.length; i += 4) if (d[i] > 0) opachi += 1;
  return opachi;
});

await browser.close();
if (server) server.kill();

const mb = (n) => (n / 1048576).toFixed(1);
console.log(`\nQUADRA — prova di resistenza: ${mosseRiuscite} mosse valide su ${MOSSE} tentativi, ${partite} partite (${(durata / 1000).toFixed(1)} s)\n`);
console.log(`Fotogrammi        mediana ${mediana.toFixed(1)} ms | p95 ${p95.toFixed(1)} ms | sopra 50 ms: ${lunghi} su ${fotogrammi.length}`);
console.log(`Memoria JS        ${mb(memoriaIniziale)} MB -> ${mb(memoriaFinale)} MB`);
console.log(`Nodi nel DOM      ${nodiIniziali} -> ${nodiFinali}`);
console.log(`Particelle rimaste sul canvas a riposo: ${particelleVive} pixel`);
if (fallimenti.length > 0) {
  console.log(`\nMosse non andate a segno (prime ${fallimenti.length}):`);
  fallimenti.forEach((f) => console.log(`  ${f}`));
}

// Soglie: non sono gusti, sono i limiti oltre i quali il difetto si vede giocando.
if (mediana > 20) errori.push(`FLUIDITA: fotogramma mediano ${mediana.toFixed(1)} ms, sopra i 20 ms`);
if (lunghi / Math.max(1, fotogrammi.length) > 0.02) {
  errori.push(`FLUIDITA: ${((lunghi / fotogrammi.length) * 100).toFixed(1)}% di fotogrammi sopra 50 ms`);
}
if (memoriaIniziale > 0 && memoriaFinale > memoriaIniziale * 2.5 + 8 * 1048576) {
  errori.push(`MEMORIA: da ${mb(memoriaIniziale)} MB a ${mb(memoriaFinale)} MB, crescita sospetta`);
}
if (nodiFinali > nodiIniziali * 1.5 + 50) {
  errori.push(`DOM: da ${nodiIniziali} a ${nodiFinali} nodi, qualcosa non viene smontato`);
}
if (particelleVive > 0) errori.push('PARTICELLE: il canvas non viene ripulito quando il gioco e a riposo');
// Se il pilota non riesce a giocare, la prova non ha misurato niente e non va creduta.
if (mosseRiuscite < MOSSE * 0.8) {
  errori.push(`PILOTAGGIO: solo ${mosseRiuscite} mosse valide su ${MOSSE} (${mosseFallite} fallite): la prova non e significativa`);
}

console.log('\n================ ESITO ================');
if (errori.length === 0) console.log('Nessun problema rilevato.');
else errori.forEach((e) => console.log('PROBLEMA -', e));
process.exit(errori.length === 0 ? 0 : 1);
