/**
 * L'invito a recensire PLINTO sul Play Store, provato nel browser.
 *
 * Quattro promesse, una per blocco:
 *   1. nel browser l'invito NON c'e': ne' nel menu, ne' sulla vittoria di fine atto;
 *   2. aperto con `?origine=play` (l'app del Play Store) la home ha la sesta voce, con
 *      l'indirizzo giusto, e la home non si allunga ne' scorre;
 *   3. chiudendo un atto nell'app compare il pulsante, visibile senza scorrere anche a
 *      360x640, e dopo averlo toccato non torna (la voce del menu invece resta);
 *   4. la festa finale ha l'invito.
 *
 * Il Play Store non si contatta mai: le richieste verso play.google.com sono
 * intercettate e risposte qui.
 *
 * Uso: npm run recensione
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { quadroNumero, TOTALE_QUADRI, ATTI } from '../../src/config/quadri.js';
import { PLAY_URL } from '../../src/config/progetto.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../../src/core/grid.js';
import { createRng } from '../../src/core/rng.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-recensione';
await mkdir(OUT, { recursive: true });

const errori = [];

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

/** Le celle vuote senza vicine vuote: un pezzo non ci entrera' mai. */
function buchi(grid) {
  let n = 0;
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (grid[idx(r, c)] !== 0) continue;
    const vicine = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([y, x]) => y >= 0 && y < 9 && x >= 0 && x < 9);
    if (vicine.every(([y, x]) => grid[idx(y, x)] !== 0)) n += 1;
  }
  return n;
}

/** La sequenza che supera il Quadro, calcolata con il motore vero. */
function sequenzaVincente(quadro, tentativi = 40) {
  for (let prova = 0; prova < tentativi; prova += 1) {
    const rng = createRng(1000 + prova);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    let guardia = 0;
    while (guardia < (quadro.maxMosse ?? 60)) {
      if (statoQuadro(quadro, partita).finito) break;
      let migliore = null, valore = -1e9;
      partita.hand.forEach((pezzo, i) => {
        if (!pezzo) return;
        for (const [r, c] of allPlacements(partita.grid, pezzo.shape)) {
          const { grid: dopo } = placeShape(partita.grid, pezzo.shape, r, c, 1);
          const gruppi = findCompletedGroups(dopo);
          const v = gruppi.length * 400 + (gruppi.length ? 200 : 0)
            - buchi(dopo) * 16 - fillRatio(dopo) * 60 + rng.float() * 40;
          if (v > valore) { valore = v; migliore = { handIndex: i, row: r, col: c }; }
        }
      });
      if (!migliore) break;
      mosse.push(migliore);
      partita = giocaNelQuadro(quadro, partita, migliore.handIndex, migliore.row, migliore.col, guardia * 1000);
      guardia += 1;
    }
    if (statoQuadro(quadro, partita).completato) return mosse;
  }
  return null;
}


const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const contesto = await browser.newContext({ viewport: { width: 360, height: 640 }, locale: 'it-IT' });
await contesto.route('https://play.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>scheda</p>' }));
const page = await contesto.newPage();
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

async function posizioneMossa(mossa) {
  return page.evaluate(({ handIndex, row, col }) => {
    const posto = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex];
    const pezzo = posto?.querySelector('.pl-pezzo');
    if (!pezzo) return null;
    const rp = pezzo.getBoundingClientRect();
    const cellaTray = pezzo.firstElementChild.getBoundingClientRect();
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const c0 = celle[0].getBoundingClientRect();
    const passoX = (celle[8].getBoundingClientRect().left - c0.left) / 8;
    const passoY = (celle[72].getBoundingClientRect().top - c0.top) / 8;
    const px = rp.left + rp.width / 2, py = rp.top + rp.height / 2;
    const presaX = (px - rp.left) / cellaTray.width, presaY = (py - rp.top) / cellaTray.height;
    return { px, py, cx: c0.left + col * passoX + presaX * c0.width, cy: c0.top + row * passoY + presaY * c0.height };
  }, mossa);
}

/** Azzera, segna i livelli superati e (se `app`) che si gioca dall'app; poi la home. */
async function prepara(superati, { app = false, cerca = '' } = {}) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(({ numeri, app: inApp }) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
    }));
    const livelli = {};
    for (const n of numeri) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
    if (inApp) window.localStorage.setItem('plinto:origine', JSON.stringify('play'));
  }, { numeri: superati, app });
  await page.goto(`${INDIRIZZO}${cerca}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-home__menu');
}

/** Dalla home: mappa, livello 1, gioca e vinci. */
async function vinciIlPrimo() {
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(0).click();
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  const sequenza = sequenzaVincente(quadroNumero(1));
  if (!sequenza) { errori.push('il motore non riesce a superare il livello 1: il controllo non prova nulla'); return false; }
  for (const mossa of sequenza) {
    const punti = await posizioneMossa(mossa);
    if (!punti) break;
    await page.mouse.move(punti.px, punti.py);
    await page.mouse.down();
    await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(45);
    if (await page.locator('.pl-quadro-esito, .pl-trionfo').count() > 0) break;
  }
  await page.waitForTimeout(1200);
  return true;
}

const menu = () => page.evaluate(() => {
  const m = document.querySelector('.pl-home__menu');
  return {
    voci: m.children.length,
    altezza: Math.round(m.getBoundingClientRect().height),
    scorre: document.scrollingElement.scrollHeight - window.innerHeight,
    href: m.querySelector('.pl-home__voce--recensisci')?.getAttribute('href') ?? null,
  };
});

const primoAtto = ATTI[0];
const restoDelPrimoAtto = Array.from({ length: primoAtto.a - primoAtto.da }, (_, i) => primoAtto.da + 1 + i);

// ---------- 1. Nel browser l'invito non c'e' ----------
console.log('1. nel browser: niente voce nel menu e niente pulsante chiudendo il primo atto...');
await prepara(restoDelPrimoAtto);
const menuBrowser = await menu();
if (menuBrowser.voci !== 5 || menuBrowser.href) errori.push(`BROWSER: il menu ha ${menuBrowser.voci} voci (attese 5) o la voce Recensisci`);
if (await vinciIlPrimo()) {
  await page.screenshot({ path: `${OUT}/1-atto-browser.png` });
  if (await page.locator('.pl-atto-chiuso').count() !== 1) errori.push('BROWSER: la fascia dell atto chiuso non c e: il controllo non prova nulla');
  if (await page.locator('.pl-recensisci').count() !== 0) errori.push('BROWSER: l invito a recensire compare nel browser, dove non si puo recensire');
}

// ---------- 2. Nell'app: la sesta voce ----------
console.log('2. aperto con ?origine=play: sesta voce nel menu, home che non scorre...');
await prepara([], { cerca: '?origine=play' });
const menuApp = await menu();
await page.screenshot({ path: `${OUT}/2-home-app.png` });
if (menuApp.voci !== 6) errori.push(`APP: il menu ha ${menuApp.voci} voci, attese 6`);
if (menuApp.href !== PLAY_URL) errori.push(`APP: la voce Recensisci porta a ${menuApp.href}, non a ${PLAY_URL}`);
if (menuApp.altezza > menuBrowser.altezza + 1) errori.push(`APP: il menu si e allungato (${menuApp.altezza}px contro ${menuBrowser.altezza}px)`);
if (menuApp.scorre > 0) errori.push(`APP: la home scorre di ${menuApp.scorre}px a 360x640`);
// Il ricordo: ricaricata senza parametro, la voce resta.
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.waitForSelector('.pl-home__menu');
if ((await menu()).voci !== 6) errori.push('APP: ricaricando senza ?origine=play la voce sparisce: il gioco non ricorda di essere nell app');

// ---------- 3. Nell'app: chiudere un atto ----------
console.log('3. nell app chiudo il primo atto: pulsante visibile senza scorrere, poi non torna...');
await prepara(restoDelPrimoAtto, { app: true });
if (await vinciIlPrimo()) {
  await page.screenshot({ path: `${OUT}/3-atto-app.png` });
  const invito = page.locator('.pl-atto-chiuso .pl-recensisci');
  if (await invito.count() !== 1) {
    errori.push('APP: chiudendo un atto l invito a recensire non compare');
  } else {
    if (await invito.getAttribute('href') !== PLAY_URL) errori.push('APP: l invito non porta alla scheda del Play Store');
    // Deve vedersi SENZA scorrere: sopra la barra dei pulsanti in basso, per intero.
    // (L'area puo' scorrere comunque: la condivisione sta in fondo apposta.)
    const posto = await page.evaluate(() => {
      const r = document.querySelector('.pl-atto-chiuso .pl-recensisci').getBoundingClientRect();
      const barra = document.querySelector('.pl-fine__azioni').getBoundingClientRect();
      return { fondo: Math.round(r.bottom), barra: Math.round(barra.top), alto: Math.round(r.height) };
    });
    if (posto.fondo > posto.barra) {
      errori.push(`APP: a 360x640 l invito finisce ${posto.fondo - posto.barra}px sotto la barra dei pulsanti: non si vede senza scorrere`);
    }
    if (posto.alto > 44) errori.push(`APP: l invito nella fascia e alto ${posto.alto}px: e andato a capo`);
    const [scheda] = await Promise.all([contesto.waitForEvent('page'), invito.click()]);
    await scheda.close();
    const toccata = await page.evaluate(() => window.localStorage.getItem('plinto:recensione'));
    if (toccata !== 'true') errori.push('APP: toccare l invito non viene ricordato');
  }
  // Rigiocato da capo con l'invito gia' toccato: la fascia c'e', il pulsante no.
  await page.evaluate((numeri) => {
    const livelli = {};
    for (const n of numeri) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
  }, restoDelPrimoAtto);
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-home__menu');
  if ((await menu()).voci !== 6) errori.push('APP: dopo aver toccato l invito sparisce anche la voce del menu, che deve restare');
  if (await vinciIlPrimo()) {
    if (await page.locator('.pl-atto-chiuso').count() !== 1) errori.push('APP: la seconda chiusura dell atto non mostra la fascia: il controllo non prova nulla');
    if (await page.locator('.pl-recensisci').count() !== 0) errori.push('APP: l invito torna dopo che il giocatore l ha gia toccato');
  }
}

// ---------- 4. La festa finale ----------
console.log('4. nell app vinco l ultimo livello che manca: la festa finale ha l invito...');
await page.setViewportSize({ width: 390, height: 844 });
await prepara(Array.from({ length: TOTALE_QUADRI - 1 }, (_, i) => i + 2), { app: true });
if (await vinciIlPrimo()) {
  await page.waitForSelector('.pl-trionfo');
  await page.screenshot({ path: `${OUT}/4-trionfo-app.png` });
  const invito = page.locator('.pl-trionfo .pl-recensisci');
  if (await invito.count() !== 1) errori.push('TRIONFO: la festa finale non ha l invito a recensire');
  else if (await invito.getAttribute('href') !== PLAY_URL) errori.push('TRIONFO: l invito non porta alla scheda del Play Store');
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log(`\nTutto a posto. Immagini in ${OUT}`);
