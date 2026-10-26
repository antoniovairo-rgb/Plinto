/**
 * Sonda del "tocco perso dopo un trascinamento" (PO-036, E1).
 *
 * Domanda: un tocco su un pulsante, dato 1,2 s dopo aver trascinato col dito e staccato,
 * a volte non produce il `click`. E' il gioco o il Chromium di prova? Si risponde solo
 * confrontando la stessa sequenza su PLINTO e su una pagina minima che di PLINTO non ha
 * niente (un riquadro con `touch-action: none` e un pulsante, niente React).
 *
 * Per ogni giro: contesto nuovo, trascinamento col dito (eventi touch del protocollo,
 * come `tests/e2e/schermi.mjs`: 12 movimenti senza pausa), con o senza il dito che si
 * ferma sul punto d'arrivo prima di staccarsi (6 movimenti nello stesso punto a 50 ms,
 * la pausa misurata nel collaudo 1.21.25), attesa, tocco al centro del pulsante. Si
 * contano i giri in cui il `click` non arriva, e quali eventi sono arrivati.
 *
 *   node tools/sonda-tocco.mjs                       (build in dist/, `vite preview`)
 *   SONDA_GIRI=15 SONDA_FORMATI=1024x600,1280x620 SONDA_ATTESA=1200 node tools/sonda-tocco.mjs
 *
 * Strumento di misura, non un controllo del gate: il gate e' `tests/e2e/schermi.mjs`.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chiudiAllUscita } from './server-di-prova.mjs';

const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome']
  .find((p) => p && existsSync(p));
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://127.0.0.1:4173/';
const GIRI = Number(process.env.SONDA_GIRI ?? 15);
const ATTESA = Number(process.env.SONDA_ATTESA ?? 1200);
const FORMATI = (process.env.SONDA_FORMATI ?? '1024x600,1280x620').split(',').map((s) => {
  const [w, h] = s.split('x').map(Number);
  return { w, h };
});
const PAGINE = (process.env.SONDA_PAGINE ?? 'plinto,minima').split(',');
const PAUSE = (process.env.SONDA_PAUSA ?? 'no,si').split(',').map((s) => s === 'si');

async function risponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; }
}
if (PAGINE.includes('plinto') && !(await risponde())) {
  const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await risponde())) await new Promise((r) => setTimeout(r, 400));
  if (!(await risponde())) { console.error('Nessun server su', INDIRIZZO, '(manca npm run build?)'); process.exit(1); }
}

// La pagina minima: niente di PLINTO. Il riquadro segue il dito come un pezzo.
const MINIMA = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;height:100%}#area{position:fixed;inset:0;touch-action:none;background:#223}
#pezzo{position:fixed;width:60px;height:60px;background:#c84;left:0;top:0}
#bottone{position:fixed;top:12px;right:12px;width:96px;height:44px}</style>
<div id="area"></div><div id="pezzo"></div><button id="bottone">Menu</button>
<script>
const pezzo = document.getElementById('pezzo');
document.getElementById('area').addEventListener('pointermove', (e) => {
  pezzo.style.transform = 'translate(' + (e.clientX - 30) + 'px,' + (e.clientY - 30) + 'px)';
});
</script>`;

/** Registra gli eventi che arrivano al pulsante (o a un suo figlio). */
function ascolta(selettore) {
  window.__eventi = [];
  const el = document.querySelector(selettore);
  for (const t of ['touchstart', 'touchend', 'pointerdown', 'pointerup', 'click']) {
    document.addEventListener(t, (e) => { if (el.contains(e.target)) window.__eventi.push(t); }, true);
  }
}

async function trascina(cdp, da, a, pausa) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: da.x, y: da.y }] });
  for (let i = 1; i <= 12; i += 1) {
    const x = da.x + ((a.x - da.x) * i) / 12, y = da.y + ((a.y - da.y) * i) / 12;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  if (pausa) for (let i = 0; i < 6; i += 1) {
    await new Promise((r) => setTimeout(r, 50));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x, y: a.y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function giro(browser, { w, h }, pagina, pausa) {
  const contesto = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'it-IT',
  });
  const page = await contesto.newPage();
  page.setDefaultTimeout(8000);
  let da, a, selettore, aperto;
  if (pagina === 'minima') {
    await page.setContent(MINIMA);
    da = { x: 0.8 * w, y: 0.7 * h }; a = { x: 0.35 * w, y: 0.45 * h };
    selettore = '#bottone';
    aperto = () => page.evaluate(() => window.__eventi.includes('click'));
  } else {
    await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('plinto:settings', JSON.stringify({
        introVista: true, tema: 'scuro', lingua: 'it', audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Partita libera/ }).tap();
    await page.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
    await page.waitForTimeout(250);
    // Il primo pezzo del vassoio sulla casella centrale (vuota a inizio partita); col dito
    // il pezzo si disegna 1,35 caselle sopra il dito (useTrascinamento.js).
    const g = await page.evaluate(() => {
      const r = document.querySelector('.pl-tray .pl-pezzo').getBoundingClientRect();
      const c = document.querySelectorAll('.pl-plancia .pl-cella')[40].getBoundingClientRect();
      return { px: r.left + r.width / 2, py: r.top + r.height / 2, cx: c.left + c.width / 2, cy: c.top + c.height / 2 + 1.35 * c.height };
    });
    da = { x: g.px, y: g.py }; a = { x: g.cx, y: g.cy };
    selettore = '.pl-hud__menu';
    aperto = async () => (await page.locator('.pl-menu').count()) > 0;
  }
  await page.evaluate(ascolta, selettore);
  const pezzi = () => page.locator('.pl-tray .pl-pezzo').count();
  const prima = pagina === 'plinto' ? await pezzi() : 0;
  const cdp = await contesto.newCDPSession(page);
  await trascina(cdp, da, a, pausa);
  await page.waitForTimeout(ATTESA);
  // Il trascinamento deve aver fatto qualcosa, se no la sonda non misura niente.
  const appoggiato = pagina === 'plinto' ? (await pezzi()) < prima : true;
  const b = await page.locator(selettore).boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(700);
  const ok = await aperto();
  const eventi = await page.evaluate(() => window.__eventi.join(' '));
  await contesto.close();
  return { ok, eventi, appoggiato };
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
console.log(`Chromium: ${ESEGUIBILE ?? 'quello di Playwright'} ${browser.version()}; attesa ${ATTESA} ms; ${GIRI} giri`);
const righe = [];
for (const f of FORMATI) for (const pagina of PAGINE) for (const pausa of PAUSE) {
  let persi = 0, nonAppoggiati = 0;
  const visti = new Map();
  for (let i = 0; i < GIRI; i += 1) {
    const { ok, eventi, appoggiato } = await giro(browser, f, pagina, pausa);
    if (!appoggiato) nonAppoggiati += 1;
    if (!ok) { persi += 1; visti.set(eventi, (visti.get(eventi) ?? 0) + 1); }
  }
  const riga = `${f.w}x${f.h}  ${pagina.padEnd(6)}  pausa del dito: ${pausa ? 'si' : 'no'}  click persi ${persi} su ${GIRI}`
    + (nonAppoggiati ? `  PEZZO NON APPOGGIATO in ${nonAppoggiati} giri` : '')
    + (persi ? `  (eventi nei persi: ${[...visti].map(([e, n]) => `«${e || 'nessuno'}» x${n}`).join(', ')})` : '');
  console.log(riga);
  righe.push(riga);
}
await browser.close();
