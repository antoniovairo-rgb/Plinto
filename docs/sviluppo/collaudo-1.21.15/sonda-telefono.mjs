/**
 * Sonda del collaudo 1.21.15: regressioni sul telefono, confronto fra due build.
 *
 * NON e' un controllo del gate: misura e scrive. Attraversa sullo STESSO percorso due
 * indirizzi (di solito il sito pubblicato e la build locale della versione precedente) e
 * per ogni telefono e schermata registra: scorrimento del documento e di ogni `.pl-scroll`,
 * posizione e misura di ogni pulsante e titolo visibile (testo + rettangolo), errori in
 * console. Poi stampa le differenze. La 1.21.15 dichiara di non cambiare niente sotto i
 * 720 px di larghezza: qualunque differenza qui e' da spiegare.
 *
 * Schermate: home, partita libera, menu della partita, sfida del giorno, mappa, apertura
 * del livello 1, livello 1 giocato fino alla fine (sequenza del motore, come e2e-quadri),
 * archivio.
 *
 * Uso: SONDA_A=<url> SONDA_B=<url> node docs/sviluppo/collaudo-1.21.15/sonda-telefono.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { quadroNumero } from '../../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../../../src/core/grid.js';
import { createRng } from '../../../src/core/rng.js';

const ESEGUIBILE = process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const A = process.env.SONDA_A, B = process.env.SONDA_B;
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-sonda-telefono';
await mkdir(OUT, { recursive: true });
const TELEFONI = (process.env.SONDA_TELEFONI ?? '360x640,390x844,412x915').split(',').map((s) => s.split('x').map(Number));

function buchi(g) {
  let n = 0;
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (g[idx(r, c)] !== 0) continue;
    const su = r > 0 && g[idx(r - 1, c)] === 0, giu = r < 8 && g[idx(r + 1, c)] === 0;
    const sx = c > 0 && g[idx(r, c - 1)] === 0, dx = c < 8 && g[idx(r, c + 1)] === 0;
    if (!su && !giu && !sx && !dx) n += 1;
  }
  return n;
}
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
const VINCE = sequenzaVincente(quadroNumero(1));

async function fotografa(page) {
  return page.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
    const scroll = [...document.querySelectorAll('.pl-scroll')].filter(vis).map((s) => s.scrollHeight - s.clientHeight);
    const elementi = [...document.querySelectorAll('button, h1, h2, a, .pl-plancia')].filter(vis).map((el) => {
      const r = el.getBoundingClientRect();
      const testo = (el.getAttribute('aria-label') || el.textContent || el.className).trim().replace(/\s+/g, ' ').replace(/\d+/g, '#').slice(0, 40);
      return `${el.tagName.toLowerCase()} "${testo}" ${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`;
    });
    return { doc: document.documentElement.scrollHeight - innerHeight, scroll, elementi };
  });
}

async function giro(url, etichetta, w, h) {
  const browser = await chromium.launch({ executablePath: ESEGUIBILE });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: 'it-IT' });
  const page = await ctx.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
  const foto = {};
  const passo = async (nome, fn) => {
    try { await fn(); await page.waitForTimeout(500); foto[nome] = await fotografa(page); await page.screenshot({ path: `${OUT}/${etichetta}-${w}x${h}-${nome}.png` }); }
    catch (e) { foto[nome] = { errore: e.message.split('\n')[0] }; }
  };
  // Ogni tratto riparte da una home pulita: con una partita a meta' il gioco la riprende
  // da solo all'apertura, e il tratto dopo non troverebbe la home.
  const homePulita = async () => {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true })); });
    await page.reload({ waitUntil: 'networkidle' });
  };
  await homePulita();
  await passo('home', async () => {});
  await passo('libera', async () => { await page.getByRole('button', { name: /Partita libera/ }).first().click(); await page.waitForSelector('.pl-plancia'); });
  await passo('menu', async () => { await page.locator('.pl-hud__menu').click(); await page.waitForTimeout(300); });
  await passo('sfida', async () => { await homePulita(); await page.getByRole('button', { name: /Sfida del giorno/ }).first().click(); await page.waitForSelector('.pl-plancia'); });
  await passo('mappa', async () => { await homePulita(); await page.getByRole('button', { name: /^Mappa dei livelli/ }).click(); await page.waitForSelector('.pl-tappe'); });
  await passo('apertura', async () => { await page.locator('.pl-tappa').nth(0).click(); await page.waitForSelector('.pl-apertura'); });
  await passo('livello', async () => { await page.getByRole('button', { name: /^Gioca/ }).first().click(); await page.waitForSelector('.pl-plancia .pl-cella'); });
  await passo('fine', async () => {
    for (const mossa of VINCE) {
      const p = await page.evaluate(({ handIndex, row, col }) => {
        const pezzo = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex]?.querySelector('.pl-pezzo');
        if (!pezzo) return null;
        const rp = pezzo.getBoundingClientRect(), ct = pezzo.firstElementChild.getBoundingClientRect();
        const celle = document.querySelectorAll('.pl-plancia .pl-cella');
        const c0 = celle[0].getBoundingClientRect();
        const px = (celle[8].getBoundingClientRect().left - c0.left) / 8, py = (celle[72].getBoundingClientRect().top - c0.top) / 8;
        const x = rp.left + rp.width / 2, y = rp.top + rp.height / 2;
        return { x, y, cx: c0.left + col * px + ((x - rp.left) / ct.width) * c0.width, cy: c0.top + row * py + ((y - rp.top) / ct.height) * c0.height };
      }, mossa);
      if (!p) break;
      await page.mouse.move(p.x, p.y); await page.mouse.down();
      await page.mouse.move(p.cx, p.cy, { steps: 5 }); await page.mouse.up();
      await page.waitForTimeout(45);
      if (await page.locator('.pl-quadro-esito').count() > 0) break;
    }
    await page.waitForSelector('.pl-quadro-esito', { timeout: 5000 });
  });
  await passo('archivio', async () => {
    await homePulita();
    await page.getByRole('button', { name: /Archivio|Sfide passate/ }).first().click();
    await page.waitForTimeout(400);
  });
  await browser.close();
  return { foto, errori };
}

let differenze = 0;
for (const [w, h] of TELEFONI) {
  const a = await giro(A, 'A', w, h), b = await giro(B, 'B', w, h);
  for (const nome of Object.keys(a.foto)) {
    const fa = a.foto[nome], fb = b.foto[nome] ?? {};
    const riga = { telefono: `${w}x${h}`, schermata: nome, A: { doc: fa.doc, scroll: fa.scroll, errore: fa.errore }, B: { doc: fb.doc, scroll: fb.scroll, errore: fb.errore } };
    const sa = new Set(fa.elementi ?? []), sb = new Set(fb.elementi ?? []);
    riga.soloA = [...sa].filter((x) => !sb.has(x));
    riga.soloB = [...sb].filter((x) => !sa.has(x));
    riga.uguale = JSON.stringify([fa.doc, fa.scroll, fa.errore]) === JSON.stringify([fb.doc, fb.scroll, fb.errore]) && !riga.soloA.length && !riga.soloB.length;
    if (!riga.uguale) differenze += 1;
    console.log(JSON.stringify(riga));
  }
  console.log(JSON.stringify({ telefono: `${w}x${h}`, erroriA: a.errori, erroriB: b.errori }));
}
console.log(JSON.stringify({ differenze }));
