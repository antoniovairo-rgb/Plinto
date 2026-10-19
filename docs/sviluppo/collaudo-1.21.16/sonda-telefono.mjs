/**
 * Sonda del collaudo 1.21.16: le schermate del telefono, per confrontare due build.
 *
 * NON e' un controllo del gate: misura e scrive. Si lancia una volta per build (per esempio
 * 1.21.15 da `e8dc0e8` e 1.21.16) con etichette diverse, poi `confronta-telefono.mjs`
 * mette a confronto le misure e le schermate.
 *
 * Schermate: home, libera, sfida, mappa, apertura del livello 1, livello 1 in corso, fine
 * del livello 1 vinto, archivio. Telefono emulato col tocco (isMobile, densita' 2).
 *
 * Perche' le schermate siano confrontabili pixel per pixel, Math.random e' sostituito da
 * un generatore con seme fisso PRIMA che parta l'app: la partita libera prende il seme da
 * Math.random (randomSeed in src/core/rng.js) e altrimenti ogni giro avrebbe una griglia
 * diversa. Animazioni spente per lo stesso motivo.
 *
 * Uso: PLINTO_E2E_URL=<indirizzo> SONDA_ETICHETTA=1.21.15 node docs/sviluppo/collaudo-1.21.16/sonda-telefono.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { quadroNumero } from '../../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../../src/core/quadro.js';
import { createRng, seedFromString } from '../../../src/core/rng.js';
import { preferenze, scegliMossa } from '../../../src/sim/giocatore-quadri.mjs';

const ESEGUIBILE = process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-sonda-telefono';
const ETICHETTA = process.env.SONDA_ETICHETTA ?? 'build';
await mkdir(OUT, { recursive: true });
const FORMATI = (process.env.SONDA_FORMATI ?? '360x640,390x844,412x915').split(',').map((s) => s.split('x').map(Number));

function lineaVincente(quadro) {
  for (let seme = 0; seme < 40; seme += 1) {
    const rng = createRng(seedFromString(`prova-${quadro.numero}-${seme}`));
    const pref = preferenze(quadro);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    for (let m = 0; m < (quadro.maxMosse ?? 300); m += 1) {
      if (statoQuadro(quadro, partita).finito) break;
      const mossa = scegliMossa(partita, pref, rng);
      if (!mossa) break;
      partita = giocaNelQuadro(quadro, partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
      mosse.push({ handIndex: mossa.handIndex, row: mossa.row, col: mossa.col });
    }
    if (statoQuadro(quadro, partita).completato) return mosse;
  }
  return null;
}
const VINCE_1 = lineaVincente(quadroNumero(1));

function misuraPagina() {
  const r = (el) => el.getBoundingClientRect();
  const visibile = (el) => { const b = r(el); const st = getComputedStyle(el); return b.width > 0 && b.height > 0 && st.visibility !== 'hidden' && st.display !== 'none'; };
  const nome = (el) => `${el.tagName.toLowerCase()}.${String(el.className).trim().split(/\s+/).join('.')}`.slice(0, 80);
  const scorrono = [];
  for (const el of document.querySelectorAll('*')) {
    const st = getComputedStyle(el);
    if (!/(auto|scroll)/.test(st.overflowY) || !visibile(el)) continue;
    const ecc = el.scrollHeight - el.clientHeight;
    if (ecc > 1) scorrono.push(`${nome(el)} ${ecc}px`);
  }
  const root = document.getElementById('root');
  const rr = r(root);
  const pulsanti = [...document.querySelectorAll('button, a[href]')].filter(visibile);
  const fuori = pulsanti.filter((b) => {
    const rb = r(b);
    // Fuori dalla finestra e NON dentro un contenitore che scorre (quelli si raggiungono).
    let p = b.parentElement, inScorrimento = false;
    while (p && p !== document.body) { if (/(auto|scroll)/.test(getComputedStyle(p).overflowY) && p.scrollHeight > p.clientHeight + 1) { inScorrimento = true; break; } p = p.parentElement; }
    return !inScorrimento && (rb.bottom > innerHeight + 0.5 || rb.right > innerWidth + 0.5 || rb.left < -0.5 || rb.top < -0.5);
  }).map((b) => b.textContent.trim().slice(0, 40) || nome(b));
  // Pulsanti che si coprono a vicenda (contenuti uno nell'altro esclusi).
  const sovrapposti = [];
  for (let i = 0; i < pulsanti.length; i += 1) for (let j = i + 1; j < pulsanti.length; j += 1) {
    const a = pulsanti[i], b = pulsanti[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = r(a), rb = r(b);
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left);
    const h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 1 && h > 1) sovrapposti.push(`${a.textContent.trim().slice(0, 20) || nome(a)} / ${b.textContent.trim().slice(0, 20) || nome(b)} (${Math.round(w)}x${Math.round(h)})`);
  }
  // Geometria per il confronto fra build: pulsanti, titoli, plancia, vassoio.
  const geometria = [...document.querySelectorAll('button, a[href], h1, h2, h3, .pl-plancia, .pl-tray, .pl-hud')]
    .filter(visibile).map((el) => {
      const b = r(el);
      return `${nome(el)}|${el.textContent.trim().replace(/\s+/g, ' ').slice(0, 30)}|${Math.round(b.left)},${Math.round(b.top)},${Math.round(b.width)}x${Math.round(b.height)}`;
    });
  return {
    docVerticale: document.documentElement.scrollHeight - innerHeight,
    docOrizzontale: document.documentElement.scrollWidth - innerWidth,
    root: `${Math.round(rr.width)}x${Math.round(rr.height)}`,
    scorrono, fuori, sovrapposti, geometria,
    testo: document.body.innerText.replace(/\s+/g, ' ').slice(0, 600),
  };
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const risultati = [];
for (const [w, h] of FORMATI) {
  const contesto = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'it-IT' });
  await contesto.addInitScript(() => {
    let s = 123456789;
    Math.random = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  });
  const page = await contesto.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

  const home = async () => {
    await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem('plinto:settings', JSON.stringify({
        introVista: true, tema: 'scuro', lingua: 'it', audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
      }));
      window.localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.pl-home__azioni');
  };
  const registra = async (schermata) => {
    await page.waitForTimeout(400);
    const m = await page.evaluate(misuraPagina);
    const file = `${OUT}/${ETICHETTA}-${w}x${h}-${schermata}.png`;
    await page.screenshot({ path: file });
    const riga = { etichetta: ETICHETTA, formato: `${w}x${h}`, schermata, ...m, file };
    risultati.push(riga);
    console.log(JSON.stringify({ ...riga, geometria: riga.geometria.length }));
  };
  const passo = async (nome, fn) => {
    try { await fn(); } catch (e) { console.log(JSON.stringify({ etichetta: ETICHETTA, formato: `${w}x${h}`, schermata: nome, eccezione: e.message.split('\n')[0] })); }
  };

  await passo('home', async () => { await home(); await registra('home'); });
  await passo('libera', async () => {
    await home();
    await page.getByRole('button', { name: /^(Partita libera|Riprendi la partita)(,|$)/ }).click();
    await page.waitForSelector('.pl-plancia');
    await registra('libera');
  });
  await passo('sfida', async () => {
    await home();
    await page.getByRole('button', { name: /^(Sfida del giorno|Riprendi la sfida)/ }).click();
    await page.waitForSelector('.pl-plancia');
    await registra('sfida');
  });
  await passo('mappa', async () => {
    await home();
    await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    await registra('mappa');
  });
  await passo('livello', async () => {
    await home();
    await page.locator('.pl-home__azioni .pl-btn--primario').click();
    await page.waitForSelector('.pl-apertura');
    await registra('apertura');
    await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await registra('livello');
    for (const mossa of VINCE_1 ?? []) {
      const p = await page.evaluate(({ handIndex, row, col }) => {
        const pezzo = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex]?.querySelector('.pl-pezzo');
        if (!pezzo) return null;
        const rp = pezzo.getBoundingClientRect();
        const ct = pezzo.firstElementChild.getBoundingClientRect();
        const celle = document.querySelectorAll('.pl-plancia .pl-cella');
        const c0 = celle[0].getBoundingClientRect();
        const passoX = (celle[8].getBoundingClientRect().left - c0.left) / 8;
        const passoY = (celle[72].getBoundingClientRect().top - c0.top) / 8;
        const px = rp.left + rp.width / 2, py = rp.top + rp.height / 2;
        return { px, py, cx: c0.left + col * passoX + ((px - rp.left) / ct.width) * c0.width, cy: c0.top + row * passoY + ((py - rp.top) / ct.height) * c0.height };
      }, mossa);
      if (!p) break;
      // Col mouse: il tocco del protocollo e' provato da e2e-schermi; qui conta la fine.
      await page.mouse.move(p.px, p.py);
      await page.mouse.down();
      await page.mouse.move(p.cx, p.cy, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(60);
      if (await page.locator('.pl-quadro-esito').count() > 0) break;
    }
    await page.waitForTimeout(1500);
    await registra('fine-livello');
  });
  await passo('archivio', async () => {
    await home();
    await page.getByRole('button', { name: /^Archivio delle sfide$/ }).first().click();
    await page.waitForTimeout(300);
    await registra('archivio');
  });
  console.log(JSON.stringify({ etichetta: ETICHETTA, formato: `${w}x${h}`, errori }));
  await contesto.close();
}
await (await import('node:fs/promises')).writeFile(`${OUT}/${ETICHETTA}.json`, JSON.stringify(risultati, null, 1));
await browser.close();
