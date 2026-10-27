/**
 * Sonda del "primo tocco perso a fine livello" (PO-037, O1 del collaudo 1.21.26).
 *
 * Fatto di partenza (collaudo 1.21.26): livello 1 vinto col dito "frettoloso" (12
 * movimenti e distacco subito, 150 ms fra le mosse), il primo tocco su «Torna ai livelli»
 * entro ~1,5 s dalla vittoria riceve pointerdown/touchstart/pointerup/touchend ma non
 * `click`. Questa sonda lo rifa' e, a richiesta, registra la traccia di Chromium per
 * vedere che cosa decide il riconoscitore dei gesti (GestureTap, GestureTapCancel,
 * GestureFlingStart, GestureScrollEnd...).
 *
 *   node tools/sonda-fine-livello.mjs                    (dist/ con `vite preview`)
 *   PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/ node tools/sonda-fine-livello.mjs
 *   SONDA_ATTESE=500,1000,1500,2000,3000 SONDA_GIRI=4 SONDA_DITO=frettoloso,fermo \
 *   SONDA_TRACCIA=si SONDA_FORMATO=360x640 node tools/sonda-fine-livello.mjs
 *
 * SONDA_TRACCIA=si registra i gesti di Chromium (tools/po037-gesti.mjs), stampa per ogni
 * giro se il fling dell'ultimo distacco era vivo al tocco e scrive in docs/sviluppo/po037/
 * gli eventi della pagina e il riassunto dei gesti, giro per giro.
 *
 * Strumento di misura, non un controllo del gate.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chiudiAllUscita } from './server-di-prova.mjs';
import { quadroNumero } from '../src/config/quadri.js';
import { sequenzaVincente, posizioneMossa } from './sequenza-vincente.mjs';
import { registraGesti, riassumi, rigaRiassunto } from './po037-gesti.mjs';

const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
  .find((p) => p && existsSync(p));
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://127.0.0.1:4173/';
const GIRI = Number(process.env.SONDA_GIRI ?? 4);
const ATTESE = (process.env.SONDA_ATTESE ?? '1000,1500,2000,3000').split(',').map(Number);
const DITI = (process.env.SONDA_DITO ?? 'frettoloso,fermo').split(',');
const PASSO = Number(process.env.SONDA_PASSO ?? 150);
const [W, H] = (process.env.SONDA_FORMATO ?? '360x640').split('x').map(Number);
const TRACCIA = process.env.SONDA_TRACCIA === 'si';
const ANIMAZIONI = process.env.SONDA_ANIMAZIONI !== 'no';
const CARTELLA = new URL('../docs/sviluppo/po037/', import.meta.url).pathname;

async function risponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; }
}
if (!(await risponde())) {
  const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await risponde())) await new Promise((r) => setTimeout(r, 400));
  if (!(await risponde())) { console.error('Nessun server su', INDIRIZZO, '(manca npm run build?)'); process.exit(1); }
}

const SEQUENZA = sequenzaVincente(quadroNumero(1));
if (!SEQUENZA) { console.error('il motore non supera il livello 1: la sonda non misura niente'); process.exit(1); }

/**
 * Registra, con l'ora, ogni evento d'ingresso della pagina (dove e' finito) e ogni
 * scorrimento. Sta nella pagina da prima che React parta, cosi' vede anche la partita.
 */
function registratore() {
  window.__eventi = [];
  const nome = (n) => (n && n.nodeType === 1
    ? `${n.tagName.toLowerCase()}${n.className && typeof n.className === 'string' ? '.' + n.className.trim().split(/\s+/)[0] : ''}`
    : String(n?.nodeName ?? n));
  for (const t of ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'pointerdown', 'pointerup', 'pointercancel',
    'click', 'scroll', 'gotpointercapture', 'lostpointercapture', 'contextmenu']) {
    document.addEventListener(t, (e) => {
      if (t === 'touchmove' || (t === 'scroll' && window.__eventi.at(-1)?.t === 'scroll')) return;
      window.__eventi.push({ t, ora: Math.round(performance.now()), su: nome(e.target), testo: (e.target?.textContent ?? '').slice(0, 24), annullabile: e.cancelable });
    }, { capture: true, passive: true });
  }
}

async function tocca(cdp, x, y) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function trascina(cdp, da, a, fermo) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: da.x, y: da.y }] });
  for (let i = 1; i <= 12; i += 1) {
    const x = da.x + ((a.x - da.x) * i) / 12, y = da.y + ((a.y - da.y) * i) / 12;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  if (fermo) for (let i = 0; i < 6; i += 1) {
    await new Promise((r) => setTimeout(r, 50));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x, y: a.y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function giro(browser, attesa, dito, conTraccia) {
  const contesto = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'it-IT',
  });
  await contesto.addInitScript(registratore);
  const page = await contesto.newPage();
  page.setDefaultTimeout(10000);
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate((anim) => {
    localStorage.clear();
    localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', audio: false, vibrazione: false, animazioni: anim, aiutoVisivo: true,
    }));
  }, ANIMAZIONI);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).tap();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(0).tap();
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  await gioca.first().waitFor();
  await gioca.first().tap();
  await page.waitForSelector('.pl-plancia .pl-cella');
  await page.waitForTimeout(400);

  const cdp = await contesto.newCDPSession(page);
  const fermaGesti = conTraccia ? await registraGesti(cdp) : null;

  let mosse = 0;
  for (const mossa of SEQUENZA) {
    const p = await posizioneMossa(page, mossa);
    if (!p) break;
    // Col dito il pezzo si disegna 1,35 caselle sopra il dito (useTrascinamento.js): il
    // dito va sotto il punto in cui il pezzo deve finire.
    const passo = await page.evaluate(() => document.querySelector('.pl-plancia .pl-cella').getBoundingClientRect().height);
    const ultima = mosse === SEQUENZA.length - 1;
    const fermo = dito === 'fermo' || (dito === 'fermo-ultima' && ultima);
    await trascina(cdp, { x: p.px, y: p.py }, { x: p.cx, y: p.cy + 1.35 * passo }, fermo);
    mosse += 1;
    if (await page.locator('.pl-quadro-esito').count() > 0) break;
    await page.waitForTimeout(PASSO);
  }
  // La vittoria compare nello stesso fotogramma del distacco o subito dopo.
  const vinto = await page.locator('.pl-quadro-esito--vinto').waitFor({ timeout: 4000 }).then(() => true, () => false);
  const oraVittoria = await page.evaluate(() => Math.round(performance.now()));
  await page.waitForTimeout(attesa);
  const b = await page.getByRole('button', { name: 'Torna ai livelli' }).boundingBox();
  const prima = await page.evaluate(() => ({
    oraTocco: Math.round(performance.now()),
    scrollTop: document.querySelector('.pl-fine .pl-scroll')?.scrollTop ?? null,
    scorre: (() => { const s = document.querySelector('.pl-fine .pl-scroll'); return s ? s.scrollHeight - s.clientHeight : null; })(),
  }));
  await tocca(cdp, b.x + b.width / 2, b.y + b.height / 2);
  const andato = await page.waitForSelector('.pl-tappe', { timeout: 1500 }).then(() => true, () => false);
  const eventi = await page.evaluate(() => window.__eventi);
  const gesti = fermaGesti ? riassumi(await fermaGesti()) : null;
  await contesto.close();
  const dopoVittoria = eventi.filter((e) => e.ora >= oraVittoria - 5);
  return { vinto, mosse, andato, oraVittoria, ...prima, dopoVittoria, gesti };
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
console.log(`Chromium ${browser.version()} (${ESEGUIBILE ?? 'Playwright'}); ${INDIRIZZO}; ${W}x${H}; passo ${PASSO} ms; `
  + `animazioni ${ANIMAZIONI ? 'si' : 'no'}; ${GIRI} giri per riga`);
if (TRACCIA) mkdirSync(CARTELLA, { recursive: true });
const rapporto = [];
for (const dito of DITI) for (const attesa of ATTESE) {
  let persi = 0, nonVinti = 0;
  const firme = new Map();
  for (let i = 0; i < GIRI; i += 1) {
    const r = await giro(browser, attesa, dito, TRACCIA);
    if (!r.vinto) { nonVinti += 1; continue; }
    if (!r.andato) {
      persi += 1;
      const sulPulsante = r.dopoVittoria.filter((e) => e.ora >= r.oraTocco).map((e) => e.t).join(' ');
      firme.set(sulPulsante, (firme.get(sulPulsante) ?? 0) + 1);
    }
    rapporto.push({ dito, attesa, giro: i, andato: r.andato, mosse: r.mosse, scrollTop: r.scrollTop, scorre: r.scorre,
      eventi: r.dopoVittoria.map((e) => ({ ...e, ora: e.ora - r.oraVittoria })),
      gesti: r.gesti });
    if (r.gesti) console.log(`  giro ${i + 1}: click ${r.andato ? 'si' : 'NO'}; ${rigaRiassunto(r.gesti)}`);
  }
  console.log(`dito ${dito.padEnd(12)} attesa ${String(attesa).padStart(5)} ms: click persi ${persi} su ${GIRI - nonVinti}`
    + (nonVinti ? `  (NON VINTO in ${nonVinti} giri)` : '')
    + (persi ? `  eventi dal tocco nei persi: ${[...firme].map(([f, n]) => `«${f}» x${n}`).join(', ')}` : ''));
}
if (TRACCIA) {
  writeFileSync(`${CARTELLA}fine-livello-${process.env.SONDA_NOME ?? `${W}x${H}`}.json`, JSON.stringify(rapporto, null, 1));
  console.log(`riassunto in ${CARTELLA}fine-livello-${process.env.SONDA_NOME ?? `${W}x${H}`}.json`);
}
await browser.close();
