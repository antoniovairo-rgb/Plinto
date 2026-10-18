/**
 * Sonda del collaudo 1.21.15: la fine del livello in cinque casi, su PC, tablet e telefono.
 *
 * NON e' un controllo del gate (non e' in tools/verifica-tutto.mjs e non fallisce): misura
 * e scrive. Serve al rapporto COLLAUDO-1.21.15.md, che riporta i numeri. Le prove del gate
 * (e2e-quadri, trionfo, e2e-schermi) misurano la fine normale, l'atto chiuso e la
 * sconfitta semplice a 6 formati; nessuna misura la fine col SOLO gettone, la sconfitta
 * con la strada aperta per insistenza (un riquadro e un pulsante in piu'), ne' i formati
 * 1366x657, 1280x720, 1024x768, 1920x969 per i casi affollati.
 *
 * Casi (progressi scritti in localStorage come in tests/e2e/trionfo.mjs, poi il livello 1
 * giocato davvero trascinando):
 *   normale        nessun livello superato, vinco il livello 1
 *   gettone        superati 2..5, vinco l'1: quinto superato, gettone (OGNI_LIVELLI = 5)
 *   atto+gettone   superati 2..10, vinco l'1: atto chiuso e gettone insieme
 *   sconfitta      perdo il livello 1
 *   sconfitta+strada  livello 1 con 7 tentativi, lo perdo: l'ottavo apre il 2
 *
 * Per ogni caso si arriva alla fine a 390x844 e poi si ridimensiona a ogni formato (come
 * misuraFine in tests/e2e/quadri.mjs): la classe affollata non dipende dalla misura.
 *
 * Uso: PLINTO_E2E_URL=<indirizzo> node docs/sviluppo/collaudo-1.21.15/sonda-fine.mjs
 * Uscita: JSON su stdout (una riga per caso e formato) e schermate in PLINTO_E2E_OUT.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { quadroNumero } from '../../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../../../src/core/grid.js';
import { createRng } from '../../../src/core/rng.js';

const ESEGUIBILE = process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-sonda-fine';
const ETICHETTA = process.env.SONDA_ETICHETTA ?? 'build';
await mkdir(OUT, { recursive: true });

const FORMATI = (process.env.SONDA_FORMATI ?? '1366x657,1280x720,1366x768,1024x768,1920x969,360x640,320x700,390x844,412x915')
  .split(',').map((s) => s.split('x').map(Number));

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
// Copia di tests/e2e/quadri.mjs (sequenzaVincente, sequenzaPerdente).
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
function sequenzaPerdente(quadro) {
  let partita = iniziaQuadro(quadro, { now: 0 });
  const mosse = [];
  for (let m = 0; m < (quadro.maxMosse ?? 40) + 2; m += 1) {
    if (statoQuadro(quadro, partita).finito) break;
    let scelta = null;
    for (let i = 0; i < partita.hand.length && !scelta; i += 1) {
      const pezzo = partita.hand[i];
      if (!pezzo) continue;
      for (const [row, col] of allPlacements(partita.grid, pezzo.shape)) {
        const { grid } = placeShape(partita.grid, pezzo.shape, row, col, 1, pezzo.bombe);
        if (findCompletedGroups(grid).length === 0) { scelta = { handIndex: i, row, col }; break; }
      }
    }
    if (!scelta) break;
    mosse.push(scelta);
    partita = giocaNelQuadro(quadro, partita, scelta.handIndex, scelta.row, scelta.col, m * 1000);
  }
  return statoQuadro(quadro, partita).fallito ? mosse : null;
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
const errori = [];
page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

async function prepara(livelli) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate((liv) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
    }));
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: liv }));
  }, livelli);
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(0).click();
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
}

async function giocaSequenza(seq) {
  for (const mossa of seq) {
    const p = await page.evaluate(({ handIndex, row, col }) => {
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
    if (!p) break;
    await page.mouse.move(p.px, p.py);
    await page.mouse.down();
    await page.mouse.move(p.cx, p.cy, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(45);
    if (await page.locator('.pl-quadro-esito, .pl-trionfo').count() > 0) break;
  }
  await page.waitForTimeout(1200);
}

/** Tutto quello che serve a dire "scorre? tagliato? sovrapposto?" in un colpo. */
async function misura() {
  return page.evaluate(() => {
    const r = (el) => el.getBoundingClientRect();
    const fine = document.querySelector('.pl-fine');
    const s = document.querySelector('.pl-fine .pl-scroll');
    const az = document.querySelector('.pl-fine__azioni');
    const root = document.getElementById('root');
    if (!fine || !s) return { manca: true };
    const rs = r(s), ra = az ? r(az) : null, rr = r(root);
    // Figli diretti dell'area che scorre che finiscono sotto il suo bordo visibile:
    // per chi non scorre sono "tagliati" (non si vedono senza scorrere).
    const sottoBordo = [...s.children].filter((c) => r(c).height > 0 && r(c).bottom > rs.bottom + 0.5)
      .map((c) => `${c.className || c.tagName} (${Math.round(r(c).bottom - rs.bottom)}px)`);
    // Sovrapposizione fra contenuto dell'area che scorre (cio' che si vede) e pulsanti.
    let sovrapp = 0;
    if (ra) for (const c of s.querySelectorAll('*')) {
      const rc = r(c);
      if (rc.height === 0 || rc.bottom > rs.bottom + 0.5) continue; // nascosto dallo scorrimento
      const h = Math.min(rc.bottom, ra.bottom) - Math.max(rc.top, ra.top);
      if (h > 0.5 && Math.min(rc.right, ra.right) > Math.max(rc.left, ra.left)) sovrapp = Math.max(sovrapp, h);
    }
    // Pulsanti dentro la cornice e la finestra.
    const fuori = [...fine.querySelectorAll('button')].filter((b) => {
      const rb = r(b);
      return rb.height > 0 && (rb.bottom > Math.min(rr.bottom, innerHeight) + 0.5 || rb.top < rr.top - 0.5);
    }).map((b) => b.textContent.trim());
    const num = document.querySelector('.pl-fine__numero');
    const pl = document.querySelector('.pl-fine__plinto svg');
    return {
      eccesso: s.scrollHeight - s.clientHeight,
      docEccesso: document.documentElement.scrollHeight - innerHeight,
      classi: fine.className.replace(/pl-screen |pl-fine /g, ''),
      numeroPx: num ? getComputedStyle(num).fontSize : null,
      plintoPx: pl ? Math.round(r(pl).height) : null,
      root: `${Math.round(rr.width)}x${Math.round(rr.height)}`,
      scrollVisibile: Math.round(rs.height),
      sottoBordo, sovrapp: Math.round(sovrapp), fuori,
      premio: Boolean(document.querySelector('.pl-fine__premio')),
      atto: Boolean(document.querySelector('.pl-atto-chiuso')),
      uscita: Boolean(document.querySelector('.pl-fine__uscita')),
      pulsanti: [...(az?.querySelectorAll('button') ?? [])].map((b) => b.textContent.trim()),
    };
  });
}

const q1 = quadroNumero(1);
const vince = sequenzaVincente(q1);
const perde = sequenzaPerdente(q1);
const sup = (a, b) => Object.fromEntries(Array.from({ length: b - a + 1 }, (_, i) => [a + i, { mosse: 12, punteggio: 300, tentativi: 1 }]));
const CASI = [
  { nome: 'normale', livelli: {}, seq: vince },
  { nome: 'gettone', livelli: sup(2, 5), seq: vince },
  { nome: 'atto+gettone', livelli: sup(2, 10), seq: vince },
  { nome: 'sconfitta', livelli: {}, seq: perde },
  { nome: 'sconfitta+strada', livelli: { 1: { tentativi: 7 } }, seq: perde },
].filter((c) => !process.env.SONDA_CASI || process.env.SONDA_CASI.split(',').includes(c.nome));

for (const caso of CASI) {
  if (!caso.seq) { console.log(JSON.stringify({ caso: caso.nome, errore: 'sequenza non calcolata' })); continue; }
  await prepara(caso.livelli);
  await giocaSequenza(caso.seq);
  for (const [w, h] of FORMATI) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    const m = await misura();
    await page.screenshot({ path: `${OUT}/${ETICHETTA}-${caso.nome}-${w}x${h}.png` });
    console.log(JSON.stringify({ etichetta: ETICHETTA, caso: caso.nome, formato: `${w}x${h}`, ...m }));
  }
}
console.log(JSON.stringify({ etichetta: ETICHETTA, errori }));
await browser.close();
