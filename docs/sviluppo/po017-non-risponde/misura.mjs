/**
 * PO-017, «Unresponsive app»: misura, NON correzione. Non fa parte del gate.
 *
 * Percorre il gioco come un revisore di Google da installazione pulita (nessun dato,
 * guida al primo avvio, `?origine=play`), in emulazione di telefono col tocco vero
 * (`hasTouch`, `isMobile`, gesti mandati con CDP `Input.dispatchTouchEvent`, mai la
 * rotellina), e su ogni schermata misura:
 *   - se il contenuto e' piu' alto dello schermo e chi scorre (documento o contenitore);
 *   - se col dito si arriva in fondo (scorrimenti ripetuti finche' la posizione si ferma);
 *   - quali elementi toccabili non diventano MAI toccabili (fuori schermo e non
 *     raggiungibili scorrendo, o coperti da altro: `elementFromPoint` al centro);
 *   - se il tocco su ogni pulsante usato nel percorso cambia qualcosa (MutationObserver);
 *   - long task e durata degli eventi (PerformanceObserver).
 *
 * Uso (dalla radice del progetto):
 *   node docs/sviluppo/po017-non-risponde/misura.mjs <url> <etichetta> [formati] [lingue] [cpu]
 *   formati: elenco separato da virgole di nomi in FORMATI, oppure "tutti"
 * Scrive JSON in $PO017_OUT (default: scratchpad) e schermate se PO017_FOTO=1.
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { quadroNumero, ATTI } from '../../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx, gridFromString } from '../../../src/core/grid.js';
import { createRng } from '../../../src/core/rng.js';
import { createGame, serializeGame } from '../../../src/core/engine.js';
import { getShape } from '../../../src/core/shapes.js';

const URL0 = process.argv[2] ?? 'http://localhost:4173/';
const ETICHETTA = process.argv[3] ?? 'locale';
const SCELTA = (process.argv[4] ?? 'tutti').split(',');
const LINGUE = (process.argv[5] ?? 'it,en').split(',');
const CPU = Number(process.argv[6] ?? 1);
const OUT = process.env.PO017_OUT ?? '/tmp/po017';
const FOTO = process.env.PO017_FOTO === '1';
await mkdir(`${OUT}/foto`, { recursive: true });

// `zoom` simula lo zoom di pagina (finestra CSS piu' piccola, stessa finestra fisica);
// `testo` moltiplica solo le dimensioni dei caratteri nei fogli di stile (come lo
// "zoom testo"). Entrambe sono SIMULAZIONI: come Chrome dentro una TWA applichi la
// dimensione dei caratteri di Android non e' misurabile da qui.
const FORMATI = [
  { nome: '320x640', w: 320, h: 640, dpr: 2 },
  { nome: '360x640', w: 360, h: 640, dpr: 3 },
  { nome: '360x800', w: 360, h: 800, dpr: 3 },
  { nome: '412x915', w: 412, h: 915, dpr: 2.625 },
  { nome: '640x360', w: 640, h: 360, dpr: 3 },
  { nome: '800x360', w: 800, h: 360, dpr: 3 },
  { nome: '915x412', w: 915, h: 412, dpr: 2.625 },
  { nome: '800x1280', w: 800, h: 1280, dpr: 2 },
  { nome: '1280x800', w: 1280, h: 800, dpr: 2 },
  { nome: '360x800 testo130', w: 360, h: 800, dpr: 3, testo: 1.3 },
  { nome: '360x800 testo200', w: 360, h: 800, dpr: 3, testo: 2.0 },
  { nome: '412x915 testo200', w: 412, h: 915, dpr: 2.625, testo: 2.0 },
  { nome: '360x800 zoom130', w: 277, h: 615, dpr: 3.9 },
  { nome: '360x800 zoom200', w: 180, h: 400, dpr: 6 },
];
const scelti = SCELTA[0] === 'tutti' ? FORMATI : FORMATI.filter((f) => SCELTA.includes(f.nome));

// ------------------------------------------------------------- motore per vincere ---
function buchi(grid) {
  let n = 0;
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (grid[idx(r, c)] !== 0) continue;
    const v = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && y < 9 && x >= 0 && x < 9);
    if (v.every(([y, x]) => grid[idx(y, x)] !== 0)) n += 1;
  }
  return n;
}
function sequenzaVincente(quadro) {
  for (let prova = 0; prova < 40; prova += 1) {
    const rng = createRng(1000 + prova);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    let g = 0;
    while (g < (quadro.maxMosse ?? 60)) {
      if (statoQuadro(quadro, partita).finito) break;
      let migliore = null, valore = -1e9;
      partita.hand.forEach((pezzo, i) => {
        if (!pezzo) return;
        for (const [r, c] of allPlacements(partita.grid, pezzo.shape)) {
          const { grid: dopo } = placeShape(partita.grid, pezzo.shape, r, c, 1);
          const gr = findCompletedGroups(dopo);
          const v = gr.length * 400 + (gr.length ? 200 : 0) - buchi(dopo) * 16 - fillRatio(dopo) * 60 + rng.float() * 40;
          if (v > valore) { valore = v; migliore = { handIndex: i, row: r, col: c }; }
        }
      });
      if (!migliore) break;
      mosse.push(migliore);
      partita = giocaNelQuadro(quadro, partita, migliore.handIndex, migliore.row, migliore.col, g * 1000);
      g += 1;
    }
    if (statoQuadro(quadro, partita).completato) return mosse;
  }
  return null;
}
const SEQ1 = sequenzaVincente(quadroNumero(1));

// La stessa partita "quasi finita" di tests/e2e/condivisione.mjs: un pezzo da una
// casella e poi niente entra piu'.
const QUASI_FINITA = (() => {
  const base = createGame({ seed: 4242 });
  const vuote = [[0, 0], [1, 3], [2, 6], [3, 1], [4, 4], [5, 7], [6, 2], [7, 5], [8, 8],
    [0, 4], [1, 7], [2, 1], [3, 5], [4, 8], [5, 2], [6, 6], [7, 0], [8, 3]];
  const righe = Array.from({ length: 9 }, () => Array(9).fill('#'));
  vuote.forEach(([r, c]) => { righe[r][c] = '.'; });
  return serializeGame({
    ...base,
    grid: gridFromString(righe.map((r) => r.join('')).join('\n')),
    hand: [
      { uid: 'c1', shapeId: 'p1', shape: getShape('p1'), color: 1 },
      { uid: 'c2', shapeId: 'b33', shape: getShape('b33'), color: 2 },
      { uid: 'c3', shapeId: 'h5', shape: getShape('h5'), color: 3 },
    ],
    score: 12345,
    stats: { ...base.stats, moves: 40, serieCatena: Array.from({ length: 40 }, (_, i) => i % 10) },
  });
})();

// ------------------------------------------------------------- dentro la pagina ---
const INIT = () => {
  window.__lt = [];
  window.__ev = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); })
      .observe({ type: 'longtask', buffered: true });
  } catch {}
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__ev.push({ n: e.name, t: Math.round(e.startTime), d: Math.round(e.duration) }); })
      .observe({ type: 'event', buffered: true, durationThreshold: 16 });
  } catch {}
};

/** Moltiplica le dimensioni dei caratteri di tutti i fogli di stile (simulazione). */
const SCALA_TESTO = (f) => {
  const molt = (v) => v.replace(/(-?\d*\.?\d+)px/g, (_, n) => `${(Number(n) * f).toFixed(2)}px`);
  const giro = (regole) => {
    for (const r of regole) {
      if (r.style && r.style.fontSize) r.style.fontSize = molt(r.style.fontSize);
      if (r.style && r.style.font) r.style.font = molt(r.style.font);
      if (r.cssRules) giro(r.cssRules);
    }
  };
  for (const s of document.styleSheets) { try { giro(s.cssRules); } catch {} }
  const st = document.createElement('style');
  st.textContent = `html{font-size:${16 * f}px}`;
  document.head.appendChild(st);
};

/** Fotografia della schermata: chi scorre, elementi toccabili, coperture. */
const FOTOGRAFIA = () => {
  const vw = innerWidth, vh = innerHeight;
  const visibile = (e) => {
    const s = getComputedStyle(e);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) return false;
    const r = e.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const sel = (e) => {
    if (!e || e === document) return 'document';
    if (e === document.scrollingElement) return 'document';
    const c = (e.className && typeof e.className === 'string') ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    return e.tagName.toLowerCase() + c;
  };
  const scrollers = [];
  const de = document.scrollingElement;
  if (de.scrollHeight > vh + 1) scrollers.push({ id: 'document', sel: 'document', h: vh, sh: de.scrollHeight, top: de.scrollTop });
  let k = 0;
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e);
    if (!/(auto|scroll)/.test(s.overflowY)) continue;
    if (e.scrollHeight <= e.clientHeight + 1 || !visibile(e)) continue;
    if (!e.dataset.po017s) e.dataset.po017s = `s${k++}`;
    scrollers.push({ id: e.dataset.po017s, sel: sel(e), h: e.clientHeight, sh: e.scrollHeight, top: e.scrollTop });
  }
  const veloInCima = [...document.querySelectorAll('.pl-velo, [aria-modal="true"]')].filter(visibile).pop();
  const inter = [...(veloInCima ?? document).querySelectorAll('button, a[href], input, select, textarea, [role=button], [role=switch], [tabindex]:not([tabindex="-1"])')]
    .filter((e) => visibile(e) && !e.closest('[aria-hidden="true"]'));
  let j = 0;
  const elementi = inter.map((e) => {
    if (!e.dataset.po017) e.dataset.po017 = `e${j++}`;
    const r = e.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let stato = 'fuori';
    let copre = null;
    if (cx >= 0 && cx <= vw - 1 && cy >= 0 && cy <= vh - 1) {
      const t = document.elementFromPoint(cx, cy);
      if (t && (t === e || e.contains(t) || t.contains(e) && false)) stato = 'ok';
      else { stato = 'coperto'; copre = sel(t); }
    }
    return {
      id: e.dataset.po017,
      nome: (e.getAttribute('aria-label') || e.innerText || e.value || '').replace(/\s+/g, ' ').trim().slice(0, 50),
      stato, copre, w: Math.round(r.width), h: Math.round(r.height),
    };
  });
  // Veli: elementi fixed che coprono piu' di meta' della finestra.
  const veli = [];
  for (const e of document.querySelectorAll('body *')) {
    const s = getComputedStyle(e);
    if (s.position !== 'fixed' || !visibile(e)) continue;
    const r = e.getBoundingClientRect();
    const area = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    if (area > vw * vh * 0.5) {
      veli.push({ sel: sel(e), pe: s.pointerEvents, overflowY: s.overflowY, sh: e.scrollHeight, h: e.clientHeight });
    }
  }
  return {
    vw, vh,
    orizzontale: de.scrollWidth > vw + 1 ? de.scrollWidth - vw : 0,
    scrollers, elementi, veli,
    schermata: [...document.querySelectorAll('#root .pl-screen, #root [class*="pl-"]')].slice(0, 1).map((e) => e.className)[0] ?? '',
  };
};

/** Punto di partenza per uno scorrimento dentro un contenitore, e chi lo blocca. */
const PUNTO_SWIPE = ({ id, verso }) => {
  const vw = innerWidth, vh = innerHeight;
  const el = id === 'document' ? document.scrollingElement : document.querySelector(`[data-po017s="${id}"]`);
  if (!el) return null;
  const r = id === 'document' ? { left: 0, top: 0, right: vw, bottom: vh } : el.getBoundingClientRect();
  const top = Math.max(r.top, 0), bottom = Math.min(r.bottom, vh), left = Math.max(r.left, 0), right = Math.min(r.right, vw);
  if (bottom - top < 20) return { bloccato: 'contenitore fuori schermo' };
  const blocca = (t) => {
    for (let n = t; n && n !== document.documentElement; n = n.parentElement) {
      const ta = getComputedStyle(n).touchAction;
      if (ta === 'none' || (ta !== 'auto' && ta !== 'manipulation' && !ta.includes('pan-y'))) return `${n.tagName.toLowerCase()}.${String(n.className).split(' ')[0]} touch-action:${ta}`;
    }
    return null;
  };
  let primoBlocco = null;
  for (const fx of [0.5, 0.15, 0.85, 0.3, 0.7]) {
    for (const fy of [0.5, 0.35, 0.65]) {
      const x = left + (right - left) * fx, y = top + (bottom - top) * fy;
      const t = document.elementFromPoint(x, y);
      if (!t) continue;
      if (id !== 'document' && !el.contains(t)) continue;
      const b = blocca(t);
      if (b) { primoBlocco ??= b; continue; }
      const corsa = Math.min((bottom - top) * 0.6, 400);
      return { x, y0: verso > 0 ? Math.min(y + corsa / 2, bottom - 4) : Math.max(y - corsa / 2, top + 4), y1: verso > 0 ? Math.max(y - corsa / 2, top + 4) : Math.min(y + corsa / 2, bottom - 4), primoBlocco };
    }
  }
  return { bloccato: primoBlocco ?? 'nessun punto libero nel contenitore' };
};

// ------------------------------------------------------------- gesti di tocco ---
async function swipe(cdp, x, y0, y1, passi = 8) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  for (let i = 1; i <= passi; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 + ((y1 - y0) * i) / passi }] });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await new Promise((r) => setTimeout(r, 380));
}
async function trascina(cdp, a, b, passi = 10) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: a.x, y: a.y }] });
  await new Promise((r) => setTimeout(r, 40));
  for (let i = 1; i <= passi; i += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: a.x + ((b.x - a.x) * i) / passi, y: a.y + ((b.y - a.y) * i) / passi }] });
    await new Promise((r) => setTimeout(r, 16));
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

// ------------------------------------------------------------- misura di una schermata ---
async function misura(page, cdp, nome, ctx) {
  await page.waitForTimeout(500);
  const f0 = await page.evaluate(FOTOGRAFIA);
  const visti = new Map(f0.elementi.map((e) => [e.id, e]));
  const raggiunti = new Set(f0.elementi.filter((e) => e.stato === 'ok').map((e) => e.id));
  const scorrimenti = [];
  // I contenitori piu' grandi prima; al massimo 4 per schermata.
  for (const s of [...f0.scrollers].sort((a, b) => b.h - a.h).slice(0, 4)) {
    const esito = { sel: s.sel, alto: s.h, contenuto: s.sh, eccedenza: s.sh - s.h, gesti: 0, inFondo: false, bloccato: null, avviso: null };
    // Prima in cima col dito (la mappa si apre scorsa sul livello corrente), poi in fondo.
    for (let g = 0; g < 60 && s.top > 0; g += 1) {
      const p = await page.evaluate(PUNTO_SWIPE, { id: s.id, verso: -1 });
      if (!p || p.bloccato) break;
      await swipe(cdp, p.x, p.y0, p.y1);
      esito.gestiSu = (esito.gestiSu ?? 0) + 1;
      const fs = await page.evaluate(FOTOGRAFIA);
      for (const e of fs.elementi) { if (!visti.has(e.id)) visti.set(e.id, e); if (e.stato === 'ok') raggiunti.add(e.id); }
      const top = await page.evaluate((id) => (id === 'document' ? document.scrollingElement : document.querySelector(`[data-po017s="${id}"]`))?.scrollTop ?? 0, s.id);
      if (top <= 1) { esito.inCima = true; break; }
    }
    let ultimo = -1, fermo = 0;
    for (let g = 0; g < 80; g += 1) {
      const p = await page.evaluate(PUNTO_SWIPE, { id: s.id, verso: 1 });
      if (!p) { esito.bloccato = 'contenitore sparito'; break; }
      if (p.bloccato) { esito.bloccato = p.bloccato; break; }
      if (p.primoBlocco) esito.avviso = p.primoBlocco;
      await swipe(cdp, p.x, p.y0, p.y1);
      esito.gesti += 1;
      const st = await page.evaluate((id) => {
        const el = id === 'document' ? document.scrollingElement : document.querySelector(`[data-po017s="${id}"]`);
        return el ? { top: el.scrollTop, max: el.scrollHeight - el.clientHeight } : null;
      }, s.id);
      if (!st) break;
      const fs = await page.evaluate(FOTOGRAFIA);
      for (const e of fs.elementi) { if (!visti.has(e.id)) visti.set(e.id, e); if (e.stato === 'ok') raggiunti.add(e.id); else if (!raggiunti.has(e.id)) visti.set(e.id, e); }
      esito.top = Math.round(st.top); esito.max = Math.round(st.max);
      if (st.top >= st.max - 2) { esito.inFondo = true; break; }
      if (Math.abs(st.top - ultimo) < 1) { fermo += 1; if (fermo >= 2) break; } else fermo = 0;
      ultimo = st.top;
    }
    scorrimenti.push(esito);
  }
  const mai = [...visti.values()].filter((e) => !raggiunti.has(e.id));
  if (FOTO) {
    await page.screenshot({ path: `${OUT}/foto/${ctx.foto}-${nome}.jpg`, type: 'jpeg', quality: 55, scale: 'css' }).catch(() => {});
  }
  // Si torna in cima: scorrimento programmatico, la raggiungibilita' l'ha gia' misurata il dito.
  await page.evaluate(() => {
    document.scrollingElement.scrollTop = 0;
    for (const e of document.querySelectorAll('[data-po017s]')) e.scrollTop = 0;
  });
  const riga = {
    schermata: nome, vw: f0.vw, vh: f0.vh, orizzontale: f0.orizzontale,
    scorre: f0.scrollers.length > 0, scorrimenti, veli: f0.veli,
    maiToccabili: mai.map((e) => ({ nome: e.nome, stato: e.stato, copre: e.copre })),
    piccoli: f0.elementi.filter((e) => e.w < 40 || e.h < 40).map((e) => `${e.nome} ${e.w}x${e.h}`),
  };
  ctx.righe.push(riga);
  return riga;
}

/** Tocca un elemento col dito vero e misura se la pagina reagisce. */
async function tocca(page, locator, nome, ctx, { attesa = 1500 } = {}) {
  const l = locator.first();
  if (await l.count() === 0) { ctx.tocchi.push({ nome, esito: 'assente' }); return false; }
  await l.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'center' })).catch(() => {});
  await page.waitForTimeout(150);
  const info = await l.evaluate((e) => {
    const r = e.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const t = document.elementFromPoint(x, y);
    window.__mut = 0;
    window.__t0 = performance.now();
    window.__tm = null;
    const mo = new MutationObserver(() => { window.__mut += 1; if (window.__tm === null) window.__tm = performance.now() - window.__t0; });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    window.__mo = mo;
    const ok = t && (t === e || e.contains(t));
    return { x, y, ok, sopra: ok ? null : (t ? `${t.tagName.toLowerCase()}.${String(t.className).split(' ')[0]}` : 'niente') };
  });
  const t0 = Date.now();
  await page.touchscreen.tap(info.x, info.y);
  let mut = 0, tm = null;
  while (Date.now() - t0 < attesa) {
    await page.waitForTimeout(50);
    ({ mut, tm } = await page.evaluate(() => ({ mut: window.__mut, tm: window.__tm })).catch(() => ({ mut: 1, tm: -1 })));
    if (mut > 0) break;
  }
  await page.evaluate(() => window.__mo?.disconnect()).catch(() => {});
  ctx.tocchi.push({ nome, esito: mut > 0 ? 'risponde' : 'NESSUNA REAZIONE', ms: tm === null ? null : Math.round(tm), coperto: info.ok ? null : info.sopra });
  await page.waitForTimeout(350);
  return mut > 0;
}

async function posizioneMossa(page, { handIndex, row, col }) {
  return page.evaluate(({ handIndex: h, row: r, col: c }) => {
    const posto = document.querySelectorAll('.pl-tray .pl-tray__posto')[h];
    const pezzo = posto?.querySelector('.pl-pezzo');
    if (!pezzo) return null;
    const rp = pezzo.getBoundingClientRect();
    const ct = pezzo.firstElementChild.getBoundingClientRect();
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const c0 = celle[0].getBoundingClientRect();
    const px = (celle[8].getBoundingClientRect().left - c0.left) / 8;
    const py = (celle[72].getBoundingClientRect().top - c0.top) / 8;
    const x = rp.left + rp.width / 2, y = rp.top + rp.height / 2;
    const sx = (x - rp.left) / ct.width, sy = (y - rp.top) / ct.height;
    // Al tocco il pezzo e' disegnato 1,35 celle sopra il dito (useTrascinamento.js:40).
    return { a: { x, y }, b: { x: c0.left + c * px + sx * c0.width, y: c0.top + r * py + sy * c0.height + 1.35 * c0.height } };
  }, { handIndex, row, col });
}

async function vinciLivello1(page, cdp, ctx) {
  let mosse = 0;
  for (const m of SEQ1 ?? []) {
    const p = await posizioneMossa(page, m);
    if (!p) break;
    await trascina(cdp, p.a, p.b, 6);
    mosse += 1;
    await page.waitForTimeout(120);
    if (await page.locator('.pl-quadro-esito, .pl-trionfo').count() > 0) break;
  }
  await page.waitForTimeout(1500);
  ctx.note.push(`livello 1: ${mosse} mosse trascinate col dito`);
}

/** Una mossa qualsiasi col dito: il primo pezzo al centro della griglia. Risponde? */
async function unaMossa(page, cdp, ctx, nome) {
  const prima = await page.evaluate(() => document.querySelectorAll('.pl-tray .pl-pezzo').length + '|' + document.querySelector('.pl-hud__punteggio')?.innerText);
  const p = await page.evaluate(() => {
    const pz = document.querySelector('.pl-tray .pl-pezzo');
    const pl = document.querySelector('.pl-plancia');
    if (!pz || !pl) return null;
    const a = pz.getBoundingClientRect(), b = pl.getBoundingClientRect();
    const cella = document.querySelector('.pl-plancia .pl-cella').getBoundingClientRect().height;
    return { a: { x: a.left + a.width / 2, y: a.top + a.height / 2 }, b: { x: b.left + b.width / 2, y: b.top + b.height / 2 + 1.35 * cella } };
  });
  if (!p) { ctx.tocchi.push({ nome, esito: 'pezzo o griglia assenti' }); return; }
  await trascina(cdp, p.a, p.b);
  await page.waitForTimeout(700);
  const dopo = await page.evaluate(() => document.querySelectorAll('.pl-tray .pl-pezzo').length + '|' + document.querySelector('.pl-hud__punteggio')?.innerText);
  ctx.tocchi.push({ nome, esito: prima !== dopo ? 'risponde' : 'NESSUNA REAZIONE (pezzo non appoggiato)', prima, dopo });
}

const tornaIndietroPagina = (page) => page.locator('.pl-pagina__testata .pl-hud__menu');

// ------------------------------------------------------------- un percorso completo ---
async function percorso(browser, formato, lingua) {
  const ctx = { formato: formato.nome, lingua, righe: [], tocchi: [], note: [], errori: [], foto: `${ETICHETTA}-${formato.nome.replace(/\s+/g, '_')}-${lingua}` };
  const contesto = await browser.newContext({
    viewport: { width: formato.w, height: formato.h }, deviceScaleFactor: formato.dpr,
    hasTouch: true, isMobile: true, locale: lingua === 'en' ? 'en-US' : 'it-IT',
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  });
  await contesto.route('https://play.google.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>scheda</p>' }));
  await contesto.addInitScript(INIT);
  const page = await contesto.newPage();
  page.on('pageerror', (e) => ctx.errori.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') ctx.errori.push(`console: ${m.text()}`); });
  const cdp = await contesto.newCDPSession(page);
  if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU });
  const vai = async (cerca = '?origine=play') => {
    const t0 = Date.now();
    await page.goto(`${URL0}${cerca}`, { waitUntil: 'load' });
    await page.waitForSelector('#root *', { timeout: 30000 });
    if (formato.testo) await page.evaluate(SCALA_TESTO, formato.testo);
    return Date.now() - t0;
  };
  const passo = async (nome, fn) => {
    try { await fn(); } catch (e) { ctx.errori.push(`${nome}: ${String(e.message).split('\n')[0]}`); }
  };

  try {
    // --- 1. guida al primo avvio, tutti i passi ---
    ctx.avvio = await vai();
    await passo('guida', async () => {
      for (let i = 1; i <= 8; i += 1) {
        if (await page.locator('.pl-guida').count() === 0) break;
        await misura(page, cdp, `guida-${i}`, ctx);
        const avanti = page.locator('.pl-guida .pl-btn--primario, .pl-guida .pl-btn').filter({ hasText: /avanti|next|inizia|start|let/i });
        if (await avanti.count() === 0) break;
        await tocca(page, avanti, `guida passo ${i}: Avanti/Inizia`, ctx);
      }
    });
    // ha finito la guida ("Inizia" = introVista): si azzera e si provano i due modi di saltarla
    await passo('salta per ora', async () => {
      await page.evaluate(() => localStorage.clear());
      await vai();
      await tocca(page, page.locator('.pl-guida__link').nth(0), 'guida: Salta per ora', ctx);
      ctx.note.push(`dopo «Salta per ora»: home ${await page.locator('.pl-home__menu').count() > 0}`);
      await page.evaluate(() => localStorage.clear());
      await vai();
      await tocca(page, page.locator('.pl-guida__link').nth(1), 'guida: Non mostrarmela più', ctx);
      ctx.note.push(`dopo «Non mostrarmela più»: home ${await page.locator('.pl-home__menu').count() > 0}`);
    });

    // --- 2. home ---
    await passo('home', async () => {
      await page.waitForSelector('.pl-home__menu', { timeout: 5000 });
      await misura(page, cdp, 'home', ctx);
    });

    // --- 3. partita libera ---
    await passo('libera', async () => {
      await tocca(page, page.locator('.pl-sfida-avvio--libera'), 'home: Partita libera', ctx);
      await page.waitForSelector('.pl-plancia', { timeout: 5000 });
      await misura(page, cdp, 'libera', ctx);
      await unaMossa(page, cdp, ctx, 'libera: trascina un pezzo col dito');
      await tocca(page, page.locator('.pl-hud .pl-hud__menu'), 'libera: Menu', ctx);
      await misura(page, cdp, 'libera-menu', ctx);
      // l'ultimo pulsante del menu (di solito «torna alla home»): raggiungibile?
      await tocca(page, page.locator('.pl-menu .pl-btn').first(), 'menu: Torna alla partita', ctx);
      await tocca(page, page.locator('.pl-hud .pl-hud__menu'), 'libera: Menu (2)', ctx);
      await tocca(page, page.locator('.pl-menu .pl-btn').last(), 'menu: ultima voce', ctx);
      await page.waitForTimeout(400);
      if (await page.locator('.pl-velo').count() > 0) {
        await misura(page, cdp, 'libera-conferma', ctx);
        await tocca(page, page.locator('.pl-velo .pl-btn').last(), 'conferma: ultima scelta', ctx);
      }
      if (await page.locator('.pl-home__menu').count() === 0) {
        ctx.note.push('libera: dal menu non si e\' tornati alla home; uso Indietro');
        await page.goBack().catch(() => {});
      }
      await page.waitForSelector('.pl-home__menu', { timeout: 5000 });
      await misura(page, cdp, 'home-con-libera', ctx);
    });

    // --- 4. sfida del giorno ---
    await passo('sfida', async () => {
      await tocca(page, page.locator('.pl-sfida-avvio--sfida'), 'home: Sfida del giorno', ctx);
      await page.waitForTimeout(500);
      if (await page.locator('.pl-velo').count() > 0) {
        await misura(page, cdp, 'sfida-domanda', ctx);
        await tocca(page, page.locator('.pl-velo .pl-btn').last(), 'domanda prima della sfida: ultima scelta', ctx);
      }
      await page.waitForSelector('.pl-plancia', { timeout: 5000 });
      await misura(page, cdp, 'sfida', ctx);
      await unaMossa(page, cdp, ctx, 'sfida: trascina un pezzo col dito');
      // Il tasto Indietro di Android
      await page.goBack();
      await page.waitForTimeout(600);
      if (await page.locator('.pl-velo').count() > 0) {
        await misura(page, cdp, 'sfida-indietro-domanda', ctx);
        await tocca(page, page.locator('.pl-velo .pl-btn').last(), 'domanda all\'Indietro: ultima scelta', ctx);
      }
      ctx.note.push(`sfida -> Indietro di sistema: home ${await page.locator('.pl-home__menu').count() > 0}`);
      if (await page.locator('.pl-home__menu').count() === 0) await vai();
    });

    // --- 5. mappa, livello 1, apertura, gioco, menu, vittoria ---
    await passo('mappa', async () => {
      await tocca(page, page.locator('.pl-sfida-avvio--mappa'), 'home: Mappa dei livelli', ctx);
      await page.waitForSelector('.pl-tappe', { timeout: 5000 });
      await misura(page, cdp, 'mappa', ctx);
      await tocca(page, page.locator('.pl-tappa').first(), 'mappa: livello 1', ctx);
      if (await page.locator('.pl-apertura__azioni').count() > 0) {
        await misura(page, cdp, 'apertura-livello', ctx);
        await tocca(page, page.locator('.pl-apertura__azioni .pl-btn--primario'), 'apertura: Gioca', ctx);
      }
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 });
      await misura(page, cdp, 'livello', ctx);
      if (await page.locator('.pl-attrezzi__pastiglia').count() > 0) {
        await tocca(page, page.locator('.pl-attrezzi__pastiglia'), 'livello: attrezzi', ctx);
        if (await page.locator('.pl-attrezzi__pannello').count() > 0) {
          await misura(page, cdp, 'livello-attrezzi', ctx);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
          if (await page.locator('.pl-attrezzi__pannello').count() > 0) await page.touchscreen.tap(5, 5);
        }
      }
      await tocca(page, page.locator('.pl-hud .pl-hud__menu'), 'livello: Menu', ctx);
      await misura(page, cdp, 'livello-menu', ctx);
      await tocca(page, page.locator('.pl-menu .pl-btn').first(), 'menu livello: torna', ctx);
      await vinciLivello1(page, cdp, ctx);
      await page.waitForSelector('.pl-quadro-esito', { timeout: 8000 });
      await misura(page, cdp, 'fine-livello', ctx);
      const ultimo = page.locator('.pl-screen .pl-btn').last();
      await tocca(page, ultimo, 'fine livello: ultimo pulsante', ctx);
      ctx.note.push(`dopo la fine del livello: ${await page.evaluate(() => document.querySelector('.pl-screen')?.className)}`);
    });

    // --- 6. home e voci del menu della home ---
    const voci = [
      ['archivio', '.pl-home__azioni .pl-btn--fantasma.pl-btn--largo:not(.pl-sfida-avvio)'],
      ['aiuto', '.pl-home__voce >> nth=0'], ['statistiche', '.pl-home__voce >> nth=1'],
      ['profilo', '.pl-home__voce >> nth=2'], ['impostazioni', '.pl-home__voce >> nth=3'],
      ['info', '.pl-home__voce >> nth=4'], ['sostieni', '.pl-home__sostieni >> nth=0'],
    ];
    for (const [nome, s] of voci) {
      await passo(nome, async () => {
        await page.evaluate(() => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true })); });
        await vai('');
        await page.waitForSelector('.pl-home__menu', { timeout: 5000 });
        await tocca(page, page.locator(s), `home: ${nome}`, ctx);
        await page.waitForTimeout(300);
        await misura(page, cdp, nome, ctx);
        if (nome === 'impostazioni') {
          // Il primo passo dell'azzeramento: domanda in linea, si annulla.
          const az = page.locator('.pl-gruppo .pl-btn--fantasma.pl-btn--largo').last();
          if (await az.count()) {
            await tocca(page, az, 'impostazioni: azzera (passo 1)', ctx);
            await misura(page, cdp, 'impostazioni-azzera', ctx);
            if (await page.locator('.pl-velo').count()) await tocca(page, page.locator('.pl-velo .pl-btn').first(), 'azzera: annulla', ctx);
          }
        }
        if (nome === 'profilo') {
          const inc = page.locator('.pl-screen .pl-btn--fantasma.pl-btn--largo').last();
          if (await inc.count()) {
            await tocca(page, inc, 'profilo: ultimo pulsante', ctx);
            await misura(page, cdp, 'profilo-dopo', ctx);
          }
        }
        if (nome === 'info') {
          await tocca(page, page.locator('.pl-screen .pl-btn--largo').last(), 'info: Sostieni', ctx);
          await misura(page, cdp, 'info-sostieni', ctx);
        }
        await tocca(page, tornaIndietroPagina(page), `${nome}: freccia indietro`, ctx);
        ctx.note.push(`${nome} -> freccia: home ${await page.locator('.pl-home__menu').count() > 0}`);
      });
    }

    // --- 7. fine partita libera e condivisione ---
    await passo('fine-libera', async () => {
      await page.evaluate((d) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true })); localStorage.setItem('plinto:partita', JSON.stringify(d)); }, QUASI_FINITA);
      await vai('');
      await tocca(page, page.getByRole('button', { name: /^(Riprendi|Resume|Partita libera|Free play)/i }), 'home: riprendi libera', ctx);
      await page.waitForSelector('.pl-plancia', { timeout: 5000 });
      const p = await page.evaluate(() => {
        const c = document.querySelectorAll('.pl-plancia .pl-cella')[0].getBoundingClientRect();
        const pz = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
        return { a: { x: pz.left + pz.width / 2, y: pz.top + pz.height / 2 }, b: { x: c.left + c.width / 2, y: c.top + c.height / 2 + 1.35 * c.height } };
      });
      await trascina(cdp, p.a, p.b);
      await page.waitForSelector('.pl-fine', { timeout: 8000 });
      await misura(page, cdp, 'fine-libera', ctx);
      const cond = page.locator('.pl-condividi button').first();
      if (await cond.count()) await tocca(page, cond, 'fine: Condividi', ctx);
      await tocca(page, page.locator('.pl-fine .pl-btn').last(), 'fine: ultimo pulsante', ctx);
    });

    // --- 8. atto chiuso con l'invito a recensire (app del Play Store) ---
    await passo('recensione', async () => {
      const primo = ATTI[0];
      const resto = Array.from({ length: primo.a - primo.da }, (_, i) => primo.da + 1 + i);
      await page.evaluate((numeri) => {
        localStorage.clear();
        localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true }));
        localStorage.setItem('plinto:origine', JSON.stringify('play'));
        const livelli = {};
        for (const n of numeri) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
        localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
      }, resto);
      await vai();
      await tocca(page, page.locator('.pl-sfida-avvio--mappa'), 'home: mappa (atto)', ctx);
      await page.waitForSelector('.pl-tappe');
      await tocca(page, page.locator('.pl-tappa').first(), 'mappa: livello 1 (atto)', ctx);
      if (await page.locator('.pl-apertura__azioni').count()) await tocca(page, page.locator('.pl-apertura__azioni .pl-btn--primario'), 'apertura: Gioca (atto)', ctx);
      await page.waitForSelector('.pl-plancia .pl-cella');
      await vinciLivello1(page, cdp, ctx);
      await misura(page, cdp, 'fine-atto-recensione', ctx);
      const r = page.locator('.pl-recensisci');
      ctx.note.push(`invito a recensire presente: ${await r.count()}`);
      if (await r.count()) await tocca(page, r, 'fine atto: Recensisci', ctx);
    });

    // --- 9. festa finale (tutti i livelli) ---
    await passo('trionfo', async () => {
      await page.evaluate(() => {
        localStorage.clear();
        localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true }));
        const livelli = {};
        for (let n = 2; n <= 100; n += 1) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
        localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
      });
      await vai();
      await tocca(page, page.locator('.pl-sfida-avvio--mappa'), 'home: mappa (trionfo)', ctx);
      await page.waitForSelector('.pl-tappe');
      await misura(page, cdp, 'mappa-completa', ctx);
      await tocca(page, page.locator('.pl-tappa').first(), 'mappa: livello 1 (trionfo)', ctx);
      if (await page.locator('.pl-apertura__azioni').count()) await tocca(page, page.locator('.pl-apertura__azioni .pl-btn--primario'), 'apertura: Gioca (trionfo)', ctx);
      await page.waitForSelector('.pl-plancia .pl-cella');
      await vinciLivello1(page, cdp, ctx);
      await page.waitForTimeout(1500);
      await misura(page, cdp, 'trionfo', ctx);
    });

    // --- 10. Indietro di sistema dalla home: deve uscire, non restare ---
    await passo('indietro-home', async () => {
      await page.evaluate(() => localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true })));
      const nuova = await contesto.newPage();
      await nuova.goto(`${URL0}?origine=play`, { waitUntil: 'load' });
      await nuova.waitForSelector('.pl-home__menu');
      const prima = nuova.url();
      await nuova.goBack().catch(() => {});
      await nuova.waitForTimeout(500);
      ctx.note.push(`Indietro dalla home su scheda nuova: ${nuova.url() === prima ? 'RESTA nel gioco' : `esce (${nuova.url()})`}`);
      await nuova.close();
    });
  } catch (e) {
    ctx.errori.push(`percorso: ${e.message}`);
  }
  ctx.longTask = await page.evaluate(() => window.__lt).catch(() => []);
  ctx.eventiLenti = await page.evaluate(() => (window.__ev || []).filter((e) => e.d >= 200)).catch(() => []);
  await contesto.close();
  return ctx;
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const risultati = [];
for (const f of scelti) {
  for (const l of LINGUE) {
    const t0 = Date.now();
    const r = await percorso(browser, f, l);
    r.durata = Date.now() - t0;
    risultati.push(r);
    const mai = r.righe.filter((x) => x.maiToccabili.length || x.scorrimenti.some((s) => !s.inFondo));
    console.log(`${ETICHETTA} ${f.nome} ${l}: ${r.righe.length} schermate, ${r.tocchi.filter((t) => t.esito !== 'risponde').length} tocchi senza reazione, ${mai.length} schermate con problemi, ${r.errori.length} errori, ${Math.round(r.durata / 1000)} s`);
  }
}
await writeFile(`${OUT}/${ETICHETTA}-${SCELTA.join('_').replace(/\s+/g, '')}-${LINGUE.join('')}-cpu${CPU}.json`, JSON.stringify(risultati, null, 1));
await browser.close();
