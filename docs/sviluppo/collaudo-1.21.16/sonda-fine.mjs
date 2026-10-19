/**
 * Sonda del collaudo 1.21.16: la fine del livello in tutti i casi, in italiano e in
 * inglese, su telefono, tablet e PC. Copia adattata di docs/sviluppo/po015/sonda-fine.mjs.
 *
 * NON e' un controllo del gate: misura e scrive (JSON su stdout, schermate in PLINTO_E2E_OUT).
 *
 * Differenze dalla sonda di PO-015:
 *  - casi "atto-N" (N = 24, 58, 76, 92): superati 1..N-1, vinco N. L'atto si chiude e il
 *    conto dei superati (N) non e' multiplo di OGNI_LIVELLI, quindi niente gettone. Il
 *    documento plinto:attrezzi e' scritto con `riscossi` gia' allineato a N-1, altrimenti
 *    riscuoti() pagherebbe al primo livello vinto i gettoni "arretrati" e il caso
 *    diventerebbe atto+gettone senza che nessuno se ne accorga.
 *  - la linea vincente viene dal giocatore artificiale di src/sim/giocatore-quadri.mjs
 *    (lo stesso di e2e-tutti-i-livelli): il giocatore goloso della sonda di PO-015 non
 *    vince i livelli 24, 76 e 92 in 400 semi (misurato).
 *  - SONDA_LINGUE=it,en; per ogni caso si registra cosa e' comparso davvero (premio, atto,
 *    uscita, esito) per non scambiare un caso per un altro.
 *  - SONDA_DIRETTO=1: invece di ridimensionare, si rigioca il caso arrivando gia' al
 *    formato (per controllare che il ridimensionamento non nasconda differenze).
 *
 * Uso: PLINTO_E2E_URL=<indirizzo> node docs/sviluppo/collaudo-1.21.16/sonda-fine.mjs
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { quadroNumero } from '../../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../../../src/core/grid.js';
import { createRng, seedFromString } from '../../../src/core/rng.js';
import { preferenze, scegliMossa } from '../../../src/sim/giocatore-quadri.mjs';

const ESEGUIBILE = process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-sonda-fine';
const ETICHETTA = process.env.SONDA_ETICHETTA ?? 'build';
await mkdir(OUT, { recursive: true });

const FORMATI = (process.env.SONDA_FORMATI ?? '320x700,360x640,390x844,412x915,1366x768,1366x657,1280x720,1024x768')
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

async function prepara({ livelli, attrezzi, numero }, lingua, [w, h] = [390, 844]) {
  await page.setViewportSize({ width: w, height: h });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(({ liv, att, lingua: l }) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: l, tema: 'scuro', animazioni: true, aiutoVisivo: true,
    }));
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: liv }));
    if (att) window.localStorage.setItem('plinto:attrezzi', JSON.stringify({ versione: 1, ...att }));
  }, { liv: livelli, att: attrezzi, lingua });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^(Mappa dei livelli|Level map)/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(numero - 1).click();
  const gioca = page.getByRole('button', { name: /^(Gioca|Play)/ });
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
      // Spazio libero nella colonna della fine (negativo = quanto scorre): quanto margine
      // resta prima che un font piu' largo faccia scorrere di nuovo.
      margine: (() => { const cs = getComputedStyle(fine); const libero = fine.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom); const occ = [...fine.children].reduce((a, c) => { const st = getComputedStyle(c); return a + r(c).height + parseFloat(st.marginTop) + parseFloat(st.marginBottom); }, 0) + (parseFloat(cs.rowGap) || 0) * (fine.children.length - 1); return Math.round(libero - occ - (s.scrollHeight - s.clientHeight)); })(),
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
  return sequenzaVincente(quadro);
}

const q1 = quadroNumero(1);
const vince = lineaVincente(q1);
const perde = sequenzaPerdente(q1);
const sup = (a, b) => Object.fromEntries(Array.from({ length: b - a + 1 }, (_, i) => [a + i, { mosse: 12, punteggio: 300, tentativi: 1 }]));
const ATTI_SENZA_GETTONE = (process.env.SONDA_ATTI ?? '24,58,76,92').split(',').filter(Boolean).map(Number);
const CASI = [
  { nome: 'normale', numero: 1, livelli: {}, seq: vince },
  { nome: 'gettone', numero: 1, livelli: sup(2, 5), seq: vince },
  ...ATTI_SENZA_GETTONE.map((n) => ({
    nome: `atto-${n}`, numero: n, livelli: sup(1, n - 1),
    attrezzi: { disponibili: 0, riscossi: Math.floor((n - 1) / 5) },
    seq: lineaVincente(quadroNumero(n)),
  })),
  // Con `riscossi: 1` come chi ha davvero superato 2..10 (nove livelli, un gettone gia'
  // riscosso): senza, riscuoti() paga DUE gettoni e il testo dice «2 gettoni», un caso
  // che nel gioco vero non capita (la sonda di PO-015 misurava quello).
  { nome: 'atto+gettone', numero: 1, livelli: sup(2, 10), attrezzi: { disponibili: 1, riscossi: 1 }, seq: vince },
  { nome: 'atto+gettone-2', numero: 1, livelli: sup(2, 10), seq: vince },
  { nome: 'sconfitta', numero: 1, livelli: {}, seq: perde },
  { nome: 'sconfitta+strada', numero: 1, livelli: { 1: { tentativi: 7 } }, seq: perde },
].filter((c) => !process.env.SONDA_CASI || process.env.SONDA_CASI.split(',').includes(c.nome));
const LINGUE = (process.env.SONDA_LINGUE ?? 'it,en').split(',');
const DIRETTO = process.env.SONDA_DIRETTO === '1';

async function registra(caso, lingua, w, h, arrivo) {
  const m = await misura();
  const testo = await page.evaluate(() => (document.querySelector('.pl-fine')?.innerText ?? '').replace(/\s+/g, ' ').slice(0, 400));
  await page.screenshot({ path: `${OUT}/${ETICHETTA}-${lingua}-${caso.nome}-${w}x${h}${arrivo === 'diretto' ? '-d' : ''}.png` });
  console.log(JSON.stringify({ etichetta: ETICHETTA, lingua, caso: caso.nome, formato: `${w}x${h}`, arrivo, errori: errori.length, ...m, testo }));
}

for (const lingua of LINGUE) for (const caso of CASI) {
  if (!caso.seq) { console.log(JSON.stringify({ lingua, caso: caso.nome, errore: 'sequenza non calcolata' })); continue; }
  if (DIRETTO) {
    for (const [w, h] of FORMATI) {
      await prepara(caso, lingua, [w, h]);
      await giocaSequenza(caso.seq);
      await registra(caso, lingua, w, h, 'diretto');
    }
    continue;
  }
  await prepara(caso, lingua);
  await giocaSequenza(caso.seq);
  for (const [w, h] of FORMATI) {
    await page.setViewportSize({ width: w, height: h });
    await page.waitForTimeout(250);
    await registra(caso, lingua, w, h, 'ridimensionata');
  }
}
console.log(JSON.stringify({ etichetta: ETICHETTA, errori }));
await browser.close();
