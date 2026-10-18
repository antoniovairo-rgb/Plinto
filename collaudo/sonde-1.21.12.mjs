/** Sonde mirate sulla produzione: indirizzo della sfida, ripresa dopo il menu, fine livello 320x700. */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { sequenzaVincente, posizioneMossa } from '../tools/sequenza-vincente.mjs';
import { quadroNumero } from '../src/config/quadri.js';
const URL_ = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const CR = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(CR) ? CR : undefined });
async function nuova(w = 390, h = 844, lingua = 'it') {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: 'it-IT' });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.evaluate((l) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: l })); }, lingua);
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  return { ctx, page };
}
async function unaMossa(page) {
  const p = await page.evaluate(() => {
    const pezzo = document.querySelector('.pl-tray .pl-pezzo'); const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    const rp = pezzo.getBoundingClientRect(); const v = celle.filter((c) => !c.className.includes('piena'));
    const rc = v[Math.floor(v.length / 2)].getBoundingClientRect();
    return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 };
  });
  await page.mouse.move(p.px, p.py); await page.mouse.down(); await page.mouse.move(p.cx, p.cy, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(150);
}
const sal = (p, k) => p.evaluate((k) => { const r = JSON.parse(localStorage.getItem(k) ?? 'null'); return r ? `${r.seedLabel ?? 'libera'}:${r.stats.moves}mosse` : null; }, k);
const stato = async (p, et) => console.log(et, '| hash=', await p.evaluate(() => location.hash), '| libera=', await sal(p, 'plinto:partita'), '| sfida=', await sal(p, 'plinto:partita-sfida'), '| ripresa=', await p.evaluate(() => localStorage.getItem('plinto:ripresa')));

// S1: libera a meta, poi sfida, menu->Nuova->Riprendi: quale partita e dove punta l'indirizzo
{ const { ctx, page } = await nuova();
  await page.getByRole('button', { name: /^Partita libera/ }).click(); await page.waitForSelector('.pl-plancia .pl-cella');
  await unaMossa(page); await unaMossa(page); await unaMossa(page);
  await page.locator('.pl-hud__menu').click(); await page.getByRole('button', { name: /^Torna alla home$/ }).click(); await page.waitForSelector('.pl-home__menu');
  await page.locator('.pl-sfida-avvio--sfida').click(); await page.waitForSelector('.pl-plancia .pl-cella'); await unaMossa(page);
  await stato(page, 'S1 in sfida');
  await page.locator('.pl-hud__menu').click(); await page.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click();
  await page.getByRole('button', { name: /^Riprendi la partita$/ }).click(); await page.waitForTimeout(500);
  await stato(page, 'S1 dopo Riprendi (libera da 3 mosse attesa)');
  console.log('S1 HUD', await page.locator('.pl-hud').innerText().then((t) => t.replace(/\s+/g, ' ')), '| mosse a schermo (celle piene)', await page.evaluate(() => document.querySelectorAll('.pl-plancia .pl-cella[class*=piena]').length));
  await page.reload(); await page.waitForTimeout(1200);
  await stato(page, 'S1 dopo reload'); console.log('S1 dove', await page.evaluate(() => document.querySelector('.pl-plancia') ? 'partita' : 'altro'));
  await ctx.close(); }
// S2: in sfida, senza libera: Nuova partita -> libera nuova con indirizzo?
{ const { ctx, page } = await nuova();
  await page.locator('.pl-sfida-avvio--sfida').click(); await page.waitForSelector('.pl-plancia .pl-cella'); await unaMossa(page);
  await page.locator('.pl-hud__menu').click(); await page.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click(); await page.waitForTimeout(500);
  await stato(page, 'S2 dopo Nuova partita da sfida');
  await unaMossa(page); await stato(page, 'S2 dopo una mossa');
  await page.reload(); await page.waitForTimeout(1200);
  await stato(page, 'S2 dopo reload');
  console.log('S2 dopo reload: hud', await page.locator('.pl-hud').innerText().then((t) => t.replace(/\s+/g, ' ')).catch(() => 'nessun hud'));
  await page.goBack(); await page.waitForTimeout(500); await stato(page, 'S2 dopo Indietro');
  console.log('S2 dove', await page.evaluate(() => document.querySelector('.pl-plancia') ? 'partita' : document.querySelector('.pl-home') ? 'home' : 'altro'));
  await ctx.close(); }
// S3: fine livello a 320x700 con l'atto chiuso (H2): livello 1 vinto
{ const { ctx, page } = await nuova(320, 700);
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click(); await page.waitForSelector('.pl-tappe'); await page.locator('.pl-tappa').first().click(); await page.waitForTimeout(300);
  const g = page.getByRole('button', { name: /^Gioca$/ }); if (await g.count()) await g.click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (const m of sequenzaVincente(quadroNumero(1)) ?? []) { const q = await posizioneMossa(page, m); if (!q) break; await page.mouse.move(q.px, q.py); await page.mouse.down(); await page.mouse.move(q.cx, q.cy, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(60); if (await page.locator('.pl-quadro-esito').count()) break; }
  await page.waitForSelector('.pl-quadro-esito', { timeout: 6000 }).catch(() => {}); await page.waitForTimeout(2500);
  const m = await page.evaluate(() => { const e = document.querySelector('.pl-quadro-esito'); const r = e?.getBoundingClientRect(); const b = [...document.querySelectorAll('button')].map((x) => x.getBoundingClientRect().bottom); return { esito: !!e, sh: document.documentElement.scrollHeight, ch: innerHeight, scrollEsito: e ? e.scrollHeight - e.clientHeight : null, fondoBottoni: Math.max(...b), testo: e?.innerText.replace(/\s+/g, ' ').slice(0, 200) }; });
  console.log('S3 fine livello 320x700', JSON.stringify(m));
  await page.screenshot({ path: 'collaudo/schermate/fine-livello-320x700-it.png' });
  await ctx.close(); }
await browser.close();
