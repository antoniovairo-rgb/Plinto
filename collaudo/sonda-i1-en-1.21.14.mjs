/** I1: dopo "Nuova partita" dal menu di una sfida, l'indirizzo #/sfida/<giorno> resta; un ricaricamento riapre la SFIDA, non la libera in corso. */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const URL_ = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const CR = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(CR) ? CR : undefined });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'en-US' });
const page = await ctx.newPage();
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: 'en' })); });
await page.goto(URL_, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('.pl-home__menu');
const gioca = async (n) => { for (let i = 0; i < n; i += 1) {
  const p = await page.evaluate((i) => { const pz = document.querySelectorAll('.pl-tray .pl-pezzo')[0]; const ce = [...document.querySelectorAll('.pl-plancia .pl-cella')].filter((c) => !c.className.includes('piena')); const rp = pz.getBoundingClientRect(); const rc = ce[(i * 17) % ce.length].getBoundingClientRect(); return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 }; }, i);
  await page.mouse.move(p.px, p.py); await page.mouse.down(); await page.mouse.move(p.cx, p.cy, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(200); } };
const hud = () => page.locator('.pl-hud').innerText().then((t) => t.replace(/\s+/g, ' '));
const salv = () => page.evaluate(() => ['plinto:partita', 'plinto:partita-sfida'].map((k) => { const r = JSON.parse(localStorage.getItem(k) ?? 'null'); return r ? `${r.seedLabel ?? 'LIBERA'} punti=${r.score} mosse=${r.stats.moves}` : null; }));
// Sfida con qualche mossa
await page.locator('.pl-sfida-avvio--sfida').click(); await page.waitForSelector('.pl-plancia .pl-cella');
await gioca(4); console.log('1. in SFIDA        ', await hud(), '| hash', await page.evaluate(() => location.hash));
// Dal menu: Nuova partita (libera nuova) e qualche mossa diversa
await page.locator('.pl-hud__menu').click(); await page.locator('.pl-menu').getByRole('button', { name: /^New game$/ }).click(); await page.waitForTimeout(400);
await gioca(2); console.log('2. in LIBERA nuova ', await hud(), '| hash', await page.evaluate(() => location.hash));
console.log('   salvate [libera, sfida]:', JSON.stringify(await salv()));
await page.reload(); await page.waitForTimeout(1500);
console.log('3. dopo RELOAD     ', await hud(), '| hash', await page.evaluate(() => location.hash));
await page.screenshot({ path: 'collaudo/schermate/i1-dopo-reload-en.png' });
await browser.close();
