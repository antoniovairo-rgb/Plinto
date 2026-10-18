// Collaudo 1.21.11 in produzione: pillola «Riprendi ›», ripresa dalla home, G1, Indietro.
import { chromium } from 'playwright';
import { createGame, serializeGame } from '../src/core/engine.js';
import { giornoDiOggi } from '../src/core/sfida.js';
const SITO = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const OUT = new URL('./schermate/', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const log = (...a) => console.log(...a);
const errs = [];
const LIB = serializeGame(createGame({ seed: 'collaudo', now: 0 }));
const SF = serializeGame(createGame({ seed: giornoDiOggi(), now: 0 }));

async function apri(lingua, stato, vp = [360, 640]) {
  const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, locale: lingua });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto(SITO, { waitUntil: 'networkidle' });
  await p.evaluate(([l, st, lib, sf]) => {
    localStorage.clear();
    localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: l, audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true }));
    if (st === 'nuova') return;
    localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
    if (st.includes('libera')) localStorage.setItem('plinto:partita', JSON.stringify(lib));
    if (st.includes('sfida')) localStorage.setItem('plinto:partita-sfida', JSON.stringify(sf));
  }, [lingua, stato, LIB, SF]);
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForSelector('.pl-home__azioni');
  return p;
}
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const cr = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// 1. Contrasto pillola (e dell'alone) in IT/EN, sfida e libera
for (const lang of ['it', 'en']) {
  const p = await apri(lang, 'libera+sfida');
  const m = await p.evaluate(() => {
    const num = (c) => c.match(/[\d.]+/g).map(Number).slice(0, 3);
    return [...document.querySelectorAll('.pl-sfida-avvio__esito--evidenza')].map((e) => {
      const s = getComputedStyle(e), r = e.getBoundingClientRect(), c = e.closest('a,button').getBoundingClientRect();
      return { testo: e.textContent, fondo: s.backgroundColor, colore: s.color, corpo: s.fontSize, peso: s.fontWeight, w: r.width, h: r.height, cardH: c.height, card: e.closest('a,button').className, nome: e.closest('a,button').getAttribute('aria-label') };
    });
  });
  for (const x of m) { const n = (c) => c.match(/[\d.]+/g).map(Number).slice(0, 3); log(lang, 'pillola', JSON.stringify(x), 'contrasto', cr(n(x.fondo), n(x.colore)).toFixed(2)); }
  await p.screenshot({ path: `${OUT}360x640-${lang}-libera+sfida.png` });
  await p.close();
}
for (const lang of ['it', 'en']) for (const st of ['libera', 'nuova']) {
  const p = await apri(lang, st); await p.screenshot({ path: `${OUT}360x640-${lang}-${st}.png` });
  log(lang, st, 'scroll', await p.evaluate(() => { const h = document.querySelector('.pl-home'); return h.scrollHeight - h.clientHeight; }));
  await p.close();
}

// 2. Ripresa dalla home: tocco sulla card e confronto con la partita salvata
{
  const p = await apri('it', 'libera');
  const prima = await p.evaluate(() => localStorage.getItem('plinto:partita'));
  await p.locator('.pl-sfida-avvio--libera').click();
  await p.waitForTimeout(800);
  log('dopo tocco card: hash', await p.evaluate(() => location.hash), 'plancia', await p.locator('.pl-plancia, .pl-griglia, [class*=plancia]').count(),
    'domanda', await p.locator('[role=dialog],[role=alertdialog]').count());
  const dopo = await p.evaluate(() => localStorage.getItem('plinto:partita'));
  log('partita salvata invariata (seed/stato):', JSON.stringify(JSON.parse(prima)).slice(0,0) + (JSON.parse(prima).seed === JSON.parse(dopo).seed), 'uguale testo:', prima === dopo);
  await p.screenshot({ path: `${OUT}ripresa-libera.png` });
  // Indietro
  await p.goBack(); await p.waitForTimeout(600);
  log('dopo Indietro: home?', await p.locator('.pl-home__azioni').count(), 'pillola?', await p.locator('.pl-sfida-avvio--libera .pl-sfida-avvio__esito--evidenza').count(), 'hash', await p.evaluate(() => location.hash));
  // Nuova partita libera
  await p.locator('.pl-home__nuova-libera').click(); await p.waitForTimeout(600);
  log('Nuova partita libera: dialog', await p.locator('[role=dialog],[role=alertdialog]').count(), 'testo', (await p.locator('[role=dialog],[role=alertdialog]').allInnerTexts()).join('|').replace(/\n/g, ' '), 'hash', await p.evaluate(() => location.hash));
  await p.screenshot({ path: `${OUT}nuova-libera.png` });
  await p.close();
}
// 3. Tastiera: Invio sulla card
{
  const p = await apri('en', 'libera');
  await p.locator('.pl-sfida-avvio--libera').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(700);
  log('Invio su card EN: home ancora?', await p.locator('.pl-home__azioni').count(), 'hash', await p.evaluate(() => location.hash));
  await p.close();
}
// 4. G1: gioco aperto, poi #/sfida/<giorno>
{
  const p = await apri('it', 'libera');
  await p.locator('.pl-sfida-avvio--libera').click(); await p.waitForTimeout(600);
  const g = giornoDiOggi();
  await p.evaluate((g) => { location.hash = `#/sfida/${g}`; }, g); await p.waitForTimeout(900);
  log('G1: hash', await p.evaluate(() => location.hash), 'titolo/sfida visibile:', (await p.locator('body').innerText()).replace(/\n/g, ' ').slice(0, 160));
  await p.screenshot({ path: `${OUT}g1.png` });
  await p.close();
}
log('errori pagina/console:', JSON.stringify(errs));
await b.close();
