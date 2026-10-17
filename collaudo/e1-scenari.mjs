// Collaudo 1.21.9 in produzione: scenari di ripresa/mappa/home/Indietro/Riprova/layout.
// Uso: PLINTO_CHROMIUM=... node collaudo/e1-scenari.mjs [url]
import { chromium } from 'playwright';
const URL_ = process.argv[2] ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const browser = await chromium.launch({ executablePath: process.env.PLINTO_CHROMIUM });
const out = [];
const log = (k, v) => { out.push(`${k}: ${v}`); console.log(`${k}: ${v}`); };
const errs = [];

async function nuova(lingua = 'it', vp = { width: 390, height: 844 }) {
  const ctx = await browser.newContext({ viewport: vp, locale: lingua === 'it' ? 'it-IT' : 'en-US' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.evaluate((l) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: l })); }, lingua);
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  return { ctx, page };
}
const dove = (p) => p.evaluate(() => document.querySelector('.pl-plancia') ? 'partita' : document.querySelector('.pl-apertura') ? 'obiettivo' : document.querySelector('.pl-tappe') ? 'mappa' : document.querySelector('.pl-home') ? 'home' : '?');
const firma = (p) => p.evaluate(() => {
  const hud = document.querySelector('.pl-hud')?.innerText.replace(/\s+/g, ' ') ?? '';
  const piene = [...document.querySelectorAll('.pl-plancia .pl-cella')].filter((c) => c.className.includes('piena')).length;
  return `${hud} / ${piene} piene`;
});
async function mossa(page) {
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
async function apriTappa(page, i, gioca = true) {
  if (await dove(page) === 'home') { await page.locator('.pl-home__menu button, .pl-home button').filter({ hasText: /mapp|map/i }).first().click(); await page.waitForSelector('.pl-tappe'); }
  await page.locator('.pl-tappa').nth(i).click(); await page.waitForTimeout(300);
  if (gioca && await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^(Gioca|Play|Start|Go)$/ }).click();
  await page.waitForTimeout(300);
}
const salv = (p) => p.evaluate(() => { const v = JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null'); return v ? `liv${v.numero}${v.presentazione ? '(pres)' : ''}` : 'nessuno'; });
const ripr = (p) => p.evaluate(() => localStorage.getItem('plinto:ripresa'));

// S2: livello 1 a meta', apro livello 2, Gioca: il livello 1 viene sovrascritto?
{
  const { ctx, page } = await nuova();
  await apriTappa(page, 0); for (let i = 0; i < 3; i++) await mossa(page);
  const f1 = await firma(page); await page.goBack(); await page.waitForTimeout(400);
  log('S2 salvato dopo Indietro', await salv(page));
  // il livello 2 e' sbloccato?
  const bloccata = await page.locator('.pl-tappa').nth(1).evaluate((e) => e.disabled || /bloccat|locked/i.test(e.className + e.getAttribute('aria-label')));
  log('S2 tappa 2 bloccata', bloccata);
  await ctx.close();
}
// S3: sblocca livelli via progressi finti? guardo struttura progressi
{
  const { ctx, page } = await nuova();
  log('S3 chiavi', await page.evaluate(() => Object.keys(localStorage).join(',')));
  await ctx.close();
}
// S4: partita libera + livello a meta' insieme; home mostra cosa? ricarica?
{
  const { ctx, page } = await nuova();
  await page.locator('.pl-home__azioni button').filter({ hasText: /Partita libera|Free/ }).first().click().catch(() => {});
  await page.waitForTimeout(500);
  log('S4 dove dopo click libera', await dove(page));
  if (await dove(page) === 'partita') { for (let i = 0; i < 3; i++) await mossa(page); const fl = await firma(page); log('S4 firma libera', fl); await page.goBack(); await page.waitForTimeout(400); }
  log('S4 home azioni', await page.locator('.pl-home__azioni').innerText().then((t) => t.replace(/\s+/g, ' ')));
  await apriTappa(page, 0); for (let i = 0; i < 2; i++) await mossa(page);
  await page.goBack(); await page.waitForTimeout(300); await page.goBack(); await page.waitForTimeout(400);
  log('S4 dove dopo due indietro', await dove(page));
  log('S4 home azioni con entrambi', await page.locator('.pl-home__azioni').innerText().then((t) => t.replace(/\s+/g, ' ')));
  await page.reload(); await page.waitForTimeout(900);
  log('S4 dopo ricarica dove', await dove(page));
  await ctx.close();
}
// S5: layout home con livello in sospeso, IT/EN, tre viewport
for (const lingua of ['it', 'en']) for (const vp of [{ width: 360, height: 640 }, { width: 412, height: 915 }, { width: 1280, height: 800 }]) {
  const { ctx, page } = await nuova(lingua, vp);
  await apriTappa(page, 0); for (let i = 0; i < 2; i++) await mossa(page);
  await page.evaluate(() => { const v = JSON.parse(localStorage.getItem('plinto:partita-quadro')); v.numero = 1; localStorage.setItem('plinto:partita-quadro', JSON.stringify(v)); });
  await page.goBack(); await page.waitForTimeout(300); await page.goBack(); await page.waitForTimeout(500);
  const r = await page.evaluate(() => {
    const b = document.querySelector('.pl-home__azioni .pl-btn--primario');
    const sc = document.scrollingElement; const rb = b?.getBoundingClientRect();
    return { testo: b?.innerText.replace(/\s+/g, ' '), scrollH: sc.scrollHeight, clientH: sc.clientHeight, ovX: sc.scrollWidth > sc.clientWidth, btnTaglio: b ? b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1 : null, btnBottom: rb && Math.round(rb.bottom) };
  });
  log(`S5 ${lingua} ${vp.width}x${vp.height}`, JSON.stringify(r));
  await ctx.close();
}
// S6: sfida del giorno a meta', home, ricarica
{
  const { ctx, page } = await nuova();
  const sfida = page.locator('.pl-home button, .pl-home a').filter({ hasText: /Sfida|Challenge/ }).first();
  await sfida.click().catch(() => log('S6', 'click sfida fallito'));
  await page.waitForTimeout(700); log('S6 dove', await dove(page));
  if (await dove(page) === 'partita') {
    for (let i = 0; i < 3; i++) await mossa(page); const f = await firma(page);
    await page.reload(); await page.waitForTimeout(1000);
    log('S6 dopo ricarica', `${await dove(page)} | ${f} -> ${await firma(page)}`);
    await page.goBack(); await page.waitForTimeout(400); log('S6 indietro dove', await dove(page));
    await page.reload(); await page.waitForTimeout(900); log('S6 ricarica da home', await dove(page));
    log('S6 azioni', await page.locator('.pl-home__azioni').innerText().then((t) => t.replace(/\s+/g, ' ')));
  }
  await ctx.close();
}
// S7: Riprova dal menu del livello, poi ricarica: ricomincia (atteso) ma senza perdere? + Indietro
{
  const { ctx, page } = await nuova();
  await apriTappa(page, 0); for (let i = 0; i < 3; i++) await mossa(page);
  const f = await firma(page);
  const menu = page.locator('button[aria-label*="enu"], .pl-menu-btn, button:has-text("Menu")').first();
  log('S7 menu presente', await menu.count());
  await page.reload(); await page.waitForTimeout(1000);
  log('S7 ricarica', `${await dove(page)} ${f} -> ${await firma(page)}`);
  // Indietro dopo ricarica
  await page.goBack(); await page.waitForTimeout(400); log('S7 indietro1', await dove(page));
  await page.goBack().catch(() => {}); await page.waitForTimeout(400); log('S7 indietro2', await dove(page).catch(() => 'uscito'));
  await ctx.close();
}
log('errori di pagina', errs.length ? errs.join(' | ') : 'nessuno');
await browser.close();
