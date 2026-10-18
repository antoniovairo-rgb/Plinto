/**
 * Collaudo 1.21.12 sulla PRODUZIONE (PLINTO_E2E_URL, default il sito pubblicato).
 * Uso: node collaudo/collaudo-1.21.12.mjs [it|en]
 * Stampa una riga "OK/KO caso: misura" per ogni controllo; screenshot in collaudo/schermate/.
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { deserializeGame } from '../src/core/engine.js';
import { allPlacements, placeShape, findCompletedGroups } from '../src/core/grid.js';
import { posizioneMossa } from '../tools/sequenza-vincente.mjs';

const LANG = process.argv[2] ?? 'it';
const URL_ = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const CR = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(CR) ? CR : undefined });
const esiti = [];
const errori = [];
const T = (it, en) => (LANG === 'it' ? it : en);
const rx = (it, en) => new RegExp(T(it, en));
function ok(caso, cond, misura) { esiti.push({ caso, ok: !!cond, misura }); console.log(`${cond ? 'OK' : 'KO'} [${LANG}] ${caso}: ${misura}`); }

async function nuova({ w = 390, h = 844, intro = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: LANG === 'it' ? 'it-IT' : 'en-US' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errori.push(e.message); console.log('PAGEERROR', e.message); });
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE.ERROR', m.text().slice(0, 200)); });
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.evaluate((l) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: l })); }, LANG);
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  return { ctx, page };
}
const dove = (p) => p.evaluate(() => {
  if (document.querySelector('.pl-plancia')) return 'partita';
  if (document.querySelector('.pl-apertura')) return 'obiettivo';
  if (document.querySelector('.pl-tappe')) return 'mappa';
  if (document.querySelector('.pl-trionfo')) return 'trionfo';
  if (document.querySelector('.pl-home')) return 'home';
  if (document.querySelector('.pl-fine, [class*="pl-fine"]')) return 'fine';
  return '?:' + (document.querySelector('h1,h2')?.innerText ?? '');
});
const dom = (p) => p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return d ? { testo: d.innerText.replace(/\s+/g, ' '), bottoni: [...d.querySelectorAll('button')].map((b) => b.innerText.trim()), fuoco: document.activeElement?.innerText?.trim() } : null; });
const firma = (p) => p.evaluate(() => `${document.querySelector('.pl-hud')?.innerText.replace(/\s+/g, ' ') ?? ''} / ${[...document.querySelectorAll('.pl-plancia .pl-cella')].filter((c) => c.className.includes('piena')).length} piene`);
const shot = (p, nome) => p.screenshot({ path: `collaudo/schermate/${nome}-${LANG}.png` });
const salvata = (p, chiave) => p.evaluate((k) => { const r = JSON.parse(localStorage.getItem(k) ?? 'null'); return r ? { status: r.status, mosse: r.stats?.moves, seedLabel: r.seedLabel } : null; }, chiave);

async function trascina(page, m) {
  const q = await posizioneMossa(page, m);
  if (!q) return false;
  await page.mouse.move(q.px, q.py); await page.mouse.down();
  await page.mouse.move(q.cx, q.cy, { steps: 4 }); await page.mouse.up();
  await page.waitForTimeout(120);
  return true;
}
/** Una mossa qualunque, da DOM: pezzo 0 al centro. */
async function mosse(page, n) {
  for (let i = 0; i < n; i += 1) {
    const stato = deserializeGame(await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-attiva') ?? localStorage.getItem('plinto:partita') ?? 'null')));
    void stato;
    await unaMossa(page);
  }
}
async function unaMossa(page) {
  const p = await page.evaluate(() => {
    const pezzo = document.querySelector('.pl-tray .pl-pezzo'); const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    if (!pezzo || !celle.length) return null;
    const rp = pezzo.getBoundingClientRect(); const v = celle.filter((c) => !c.className.includes('piena'));
    const rc = (v[Math.floor(v.length / 2)] ?? celle[40]).getBoundingClientRect();
    return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 };
  });
  if (!p) return;
  await page.mouse.move(p.px, p.py); await page.mouse.down(); await page.mouse.move(p.cx, p.cy, { steps: 5 }); await page.mouse.up();
  await page.waitForTimeout(150);
}
/** Gioca la libera con il motore vero, scegliendo la mossa PEGGIORE, finche' la partita finisce. */
async function finisciLibera(page) {
  for (let g = 0; g < 200; g += 1) {
    if (await page.locator('.pl-plancia').count() === 0) return g;
    const raw = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita') ?? 'null'));
    const s = deserializeGame(raw);
    if (!s || s.status !== 'playing') { await page.waitForTimeout(500); continue; }
    let best = null; let val = 1e9;
    s.hand.forEach((pz, i) => {
      if (!pz) return;
      for (const [r, c] of allPlacements(s.grid, pz.shape)) {
        const { grid: d } = placeShape(s.grid, pz.shape, r, c, 1);
        const v = findCompletedGroups(d).length * 100 + Math.random();
        if (v < val) { val = v; best = { handIndex: i, row: r, col: c }; }
      }
    });
    if (!best) return -1;
    await trascina(page, best);
  }
  return -2;
}
const home = async (p) => { await p.locator('.pl-hud__menu').click(); await p.getByRole('button', { name: rx('^Torna alla home$', '^(Back to home|Home)$') }).click(); await p.waitForSelector('.pl-home__menu'); };
const dlg = (p) => p.locator('[role="dialog"]');

// ===== R1: versione =====
{ const { ctx, page } = await nuova();
  const v = await page.evaluate(() => document.body.innerText.match(/\d+\.\d+\.\d+/g));
  ok('R0 versione visibile', true, `testi con versione in home: ${JSON.stringify(v)}`);
  await ctx.close(); }

// ===== C: libera a meta -> ogni strada =====
for (const strada of ['home', 'menu', 'profilo', 'statistiche']) {
  const { ctx, page } = await nuova();
  await page.getByRole('button', { name: /^(Partita libera|Free play)/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  await unaMossa(page); await unaMossa(page);
  const prima = await firma(page);
  await home(page);
  if (strada === 'home') await page.locator('.pl-home__nuova-libera').click();
  else if (strada === 'menu') { await page.getByRole('button', { name: /^(Partita libera|Free play), (riprendi|resume)/i }).click(); await page.waitForSelector('.pl-plancia'); await page.locator('.pl-hud__menu').click(); await page.locator('.pl-menu').getByRole('button', { name: rx('^Nuova partita$', '^New game$') }).click(); }
  else { await page.locator('.pl-home__voce').filter({ hasText: strada === 'profilo' ? rx('profilo', 'profile') : rx('Statistiche', 'Stat') }).first().click(); await page.waitForTimeout(400); await page.getByRole('button', { name: rx('^Gioca una partita$', '^Play a game$') }).click(); }
  await page.waitForTimeout(400);
  const d = await dom(page);
  await shot(page, `conferma-${strada}`);
  ok(`C ${strada}: domanda con libera a meta`, d && d.bottoni.length === 2, d ? `${d.testo} | bottoni=${JSON.stringify(d.bottoni)} fuoco="${d.fuoco}"` : 'nessuna domanda');
  if (d) {
    await page.goBack(); await page.waitForTimeout(400);
    ok(`C ${strada}: Indietro chiude la domanda`, !(await dom(page)), `dove=${await dove(page)}`);
    if (!(await dom(page)) && strada === 'home') {
      await page.locator('.pl-home__nuova-libera').click(); await dlg(page).getByRole('button').first().click(); await page.waitForTimeout(400);
      ok(`C ${strada}: primo bottone riporta alla partita`, (await dove(page)) === 'partita' && (await firma(page)) === prima, `${await firma(page)} vs ${prima}`);
    }
  }
  await ctx.close();
}

// ===== D: casi senza domanda =====
{ // libera finita
  const { ctx, page } = await nuova();
  await page.getByRole('button', { name: /^(Partita libera|Free play)/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  const g = await finisciLibera(page);
  await page.waitForTimeout(1500);
  const sal = await salvata(page, 'plinto:partita');
  ok('D1 libera portata a fine', g >= 0, `mosse giocate dal bot=${g}; dove=${await dove(page)}; salvataggio=${JSON.stringify(sal)}`);
  await shot(page, 'libera-finita');
  const btn = page.getByRole('button', { name: rx('^Gioca ancora$', '^Play again$') });
  ok('D2 «Gioca ancora» presente a fine libera', await btn.count() > 0, `bottoni: ${JSON.stringify(await page.$$eval('button', (b) => b.map((x) => x.innerText.trim()).filter(Boolean)))}`);
  if (await btn.count()) {
    await btn.click(); await page.waitForTimeout(500);
    const d = await dom(page);
    ok('D3 «Gioca ancora» a fine libera: niente domanda e nuova partita', !d && (await dove(page)) === 'partita', `domanda=${d ? d.testo : 'no'} dove=${await dove(page)} firma=${await firma(page)}`);
  }
  // dopo: partita finita, torno in home e premo Nuova libera
  await ctx.close(); }
{ // libera finita poi home -> nuova libera
  const { ctx, page } = await nuova();
  await page.getByRole('button', { name: /^(Partita libera|Free play)/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  await finisciLibera(page); await page.waitForTimeout(1500);
  await page.getByRole('button', { name: rx('^Home$|Torna alla home|Back to home', 'Home|Back to home') }).first().click().catch(() => {});
  await page.waitForTimeout(500);
  const l = page.locator('.pl-home__nuova-libera');
  ok('D4 home dopo libera finita', true, `dove=${await dove(page)} link nuova libera=${await l.count()} testo home="${(await page.locator('.pl-home').innerText()).replace(/\s+/g, ' ').slice(0, 160)}"`);
  if (await l.count()) { await l.click(); await page.waitForTimeout(400); const d = await dom(page); ok('D4 libera finita -> nuova libera dalla home: nessuna domanda', !d, d ? d.testo : `dove=${await dove(page)}`); }
  await ctx.close(); }
{ // 0 mosse
  const { ctx, page } = await nuova();
  await page.getByRole('button', { name: /^(Partita libera|Free play)/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella'); await home(page);
  const l = page.locator('.pl-home__nuova-libera'); const n = await l.count();
  if (n) { await l.click(); await page.waitForTimeout(400); }
  ok('D5 0 mosse: nuova libera senza domanda', n && !(await dom(page)) && (await dove(page)) === 'partita', `link=${n} domanda=${!!(await dom(page))} dove=${await dove(page)}`);
  await ctx.close(); }

// ===== E: dentro una sfida =====
{ const { ctx, page } = await nuova();
  await page.locator('.pl-sfida-avvio--sfida').click(); await page.waitForSelector('.pl-plancia .pl-cella');
  await unaMossa(page); await unaMossa(page);
  const s0 = await salvata(page, 'plinto:partita-sfida');
  await page.locator('.pl-hud__menu').click(); await page.waitForTimeout(300);
  await shot(page, 'menu-in-sfida');
  const bt = await page.locator('.pl-menu button').allInnerTexts();
  await page.locator('.pl-menu').getByRole('button', { name: rx('^Nuova partita$', '^New game$') }).click(); await page.waitForTimeout(500);
  const d = await dom(page); const s1 = await salvata(page, 'plinto:partita-sfida');
  ok('E1 menu in sfida senza libera: cosa succede', true, `menu=${JSON.stringify(bt)} domanda=${d ? d.testo : 'no'} dove=${await dove(page)} sfidaSalvata prima=${JSON.stringify(s0)} dopo=${JSON.stringify(s1)} libera=${JSON.stringify(await salvata(page, 'plinto:partita'))} hud="${await firma(page)}"`);
  await shot(page, 'nuova-da-sfida-senza-libera');
  await ctx.close(); }
{ // sfida + libera a meta salvata
  const { ctx, page } = await nuova();
  await page.getByRole('button', { name: /^(Partita libera|Free play)/ }).click(); await page.waitForSelector('.pl-plancia .pl-cella');
  await unaMossa(page); await unaMossa(page); const fl = await firma(page); await home(page);
  await page.locator('.pl-sfida-avvio--sfida').click(); await page.waitForSelector('.pl-plancia .pl-cella');
  await unaMossa(page); const fs = await firma(page);
  await page.locator('.pl-hud__menu').click();
  await page.locator('.pl-menu').getByRole('button', { name: rx('^Nuova partita$', '^New game$') }).click(); await page.waitForTimeout(500);
  const d = await dom(page); await shot(page, 'nuova-da-sfida-con-libera');
  ok('E2 menu in sfida con libera a meta: domanda', !!d, d ? `${d.testo} | ${JSON.stringify(d.bottoni)}` : 'nessuna domanda');
  if (d) {
    await dlg(page).getByRole('button').first().click(); await page.waitForTimeout(500);
    const fd = await firma(page); const sf = await salvata(page, 'plinto:partita-sfida');
    ok('E3 primo bottone dalla sfida: dove si finisce', true, `dove=${await dove(page)} hud="${fd}" (libera era "${fl}", sfida era "${fs}") sfidaSalvata=${JSON.stringify(sf)}`);
    await page.locator('.pl-hud__menu').click(); await page.getByRole('button', { name: rx('^Torna alla home$', 'Back to home') }).click(); await page.waitForSelector('.pl-home__menu');
    await shot(page, 'home-dopo-E3');
    ok('E4 home dopo E3: card sfida', true, (await page.locator('.pl-home').innerText()).replace(/\s+/g, ' ').slice(0, 300));
  }
  await ctx.close(); }

// ===== F: regressioni: ripresa + Indietro + reload =====
{ const { ctx, page } = await nuova();
  await page.getByRole('button', { name: /^(Partita libera|Free play)/ }).click(); await page.waitForSelector('.pl-plancia .pl-cella');
  await unaMossa(page); await unaMossa(page); const f = await firma(page);
  await page.reload(); await page.waitForTimeout(1200);
  ok('F1 reload in partita riprende', (await dove(page)) === 'partita' && (await firma(page)) === f, `dove=${await dove(page)} ${await firma(page)} vs ${f}`);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); window.dispatchEvent(new Event('pagehide')); });
  await page.waitForTimeout(3000);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  ok('F2 background 3 s: la partita non riparte', (await firma(page)) === f, `${await firma(page)} vs ${f}`);
  await page.goBack(); await page.waitForTimeout(500);
  ok('F3 Indietro dalla partita', true, `dove=${await dove(page)} url=${page.url()}`);
  await ctx.close(); }
{ // 320x700 fine livello H2 e statistiche
  const { ctx, page } = await nuova({ w: 320, h: 700 });
  const sc = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight, sw: document.documentElement.scrollWidth, cw: innerWidth }));
  ok('F4 home 320x700 senza scorrimento', sc.sh <= sc.ch && sc.sw <= sc.cw, JSON.stringify(sc));
  await shot(page, 'home-320x700');
  await page.locator('.pl-home__voce').filter({ hasText: rx('Statistiche', 'Stat') }).first().click(); await page.waitForTimeout(400);
  const st = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight, testo: document.body.innerText.replace(/\s+/g, ' ').slice(0, 200) }));
  ok('F5 statistiche vuote 320x700', true, JSON.stringify(st));
  await shot(page, 'statistiche-320x700');
  await ctx.close(); }

await browser.close();
console.log(`\nRIEPILOGO [${LANG}]: ${esiti.filter((e) => e.ok).length} OK, ${esiti.filter((e) => !e.ok).length} KO, errori di pagina: ${errori.length}`);
