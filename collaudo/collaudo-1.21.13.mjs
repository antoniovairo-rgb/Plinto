/** Collaudo 1.21.13 (PO-011) sulla versione pubblicata: pillola «Riprendi ›» in home. */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const URL_ = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const CR = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(CR) ? CR : undefined });
const errori = [];
const mossa = async (page) => {
  const p = await page.evaluate(() => {
    const pz = document.querySelector('.pl-tray .pl-pezzo');
    const v = [...document.querySelectorAll('.pl-plancia .pl-cella')].filter((c) => !c.className.includes('piena'));
    const rp = pz.getBoundingClientRect(); const rc = v[Math.floor(v.length / 2)].getBoundingClientRect();
    return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 };
  });
  await page.mouse.move(p.px, p.py); await page.mouse.down(); await page.mouse.move(p.cx, p.cy, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(250);
};
const allaHome = async (page) => { await page.locator('.pl-hud__menu').click(); await page.locator('.pl-menu button').last().click().catch(() => {}); };
async function giocaE(page, sel) {
  await page.locator(sel).click(); await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await mossa(page);
  await page.goBack(); await page.waitForSelector('.pl-home__menu');
}
const misura = () => {
  const card = (s) => { const el = document.querySelector(s); if (!el) return null; const e = el.querySelector('.pl-sfida-avvio__esito'); if (!e) return { esito: null };
    const cs = getComputedStyle(el); const re = e.getBoundingClientRect(); const t = el.querySelector('span').getBoundingClientRect();
    return { esito: e.textContent, alone: getComputedStyle(e).boxShadow, destra: +(el.getBoundingClientRect().right - parseFloat(cs.paddingRight) - re.right).toFixed(1), bordoDx: +re.right.toFixed(1), centroY: +((re.top + re.bottom) / 2 - (t.top + t.bottom) / 2).toFixed(1) }; };
  return { libera: card('.pl-sfida-avvio--libera'), sfida: card('.pl-sfida-avvio--sfida'), mappa: card('.pl-sfida-avvio--mappa'), scorreOrizz: document.documentElement.scrollWidth > innerWidth };
};
const righe = [];
for (const lingua of ['it', 'en']) for (const [w, h] of [[360, 800], [412, 915]]) for (const stato of ['libera', 'sfida']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: lingua === 'it' ? 'it-IT' : 'en-US' });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errori.push(`${lingua} ${w}x${h} ${stato}: ${e.message}`));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.evaluate((l) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: l })); }, lingua);
  await page.goto(URL_, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('.pl-home__menu');
  await giocaE(page, `.pl-sfida-avvio--${stato}`);
  await page.waitForTimeout(500);
  const m = await page.evaluate(misura);
  const ver = await page.evaluate(() => [...document.scripts].map((s) => s.src).join(' '));
  const nome = `${lingua} ${w}x${h} ${stato} in corso`;
  righe.push({ nome, ...m });
  await page.screenshot({ path: `collaudo/schermate/1.21.13-${lingua}-${w}x${h}-${stato}.png` });
  const pill = m[stato];
  if (!/›|Resume|Riprendi/.test(pill?.esito ?? '')) errori.push(`${nome}: la card della ${stato} dice «${pill?.esito}»`);
  if (pill?.alone !== 'none') errori.push(`${nome}: alone «${pill?.alone}»`);
  if (Math.abs(pill?.destra ?? 99) > 1) errori.push(`${nome}: scarto dal bordo ${pill?.destra}px`);
  for (const k of ['libera', 'sfida', 'mappa']) if (m[k]?.esito && Math.abs(m[k].bordoDx - pill.bordoDx) > 1) errori.push(`${nome}: bordo destro di ${k} ${m[k].bordoDx} vs pillola ${pill.bordoDx}`);
  if (m.scorreOrizz) errori.push(`${nome}: scorrimento orizzontale`);
  await ctx.close();
}
await browser.close();
for (const r of righe) console.log(r.nome, JSON.stringify({ libera: r.libera, sfida: r.sfida, mappa: r.mappa, scorreOrizz: r.scorreOrizz }));
console.log(errori.length ? `\n${errori.length} problemi:\n - ${errori.join('\n - ')}` : '\nTutto a posto.');
