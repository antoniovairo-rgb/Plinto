// Utilita' comuni degli script di collaudo. Non toccano il codice del gioco.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

export const LOCALE = process.env.COLLAUDO_URL ?? 'http://127.0.0.1:4180/';
export const PUBBLICO = 'https://antoniovairo-rgb.github.io/Plinto/';
export const PROVE = new URL('./prove/', import.meta.url).pathname;
mkdirSync(PROVE, { recursive: true });
export const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export const SCHERMI = {
  s360: { width: 360, height: 640 },
  s390: { width: 390, height: 844 },
  s412: { width: 412, height: 915 },
  d1280: { width: 1280, height: 800 },
};

export async function apri({ clock = null, url = LOCALE, viewport = SCHERMI.s390, locale = 'it-IT', storage = null, mobile = true, ua, init, ctxOpts = {} } = {}) {
  const browser = await chromium.launch({ executablePath: CHROMIUM });
  const ctx = await browser.newContext({ viewport, locale, hasTouch: mobile, isMobile: mobile && viewport.width < 800, userAgent: ua, ...ctxOpts });
  const errori = [];
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errori.push(`console.${m.type()}: ${m.text()}`); });
  page.on('requestfailed', (r) => errori.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  if (storage) {
    await ctx.addInitScript((s) => {
      if (sessionStorage.getItem('__seeded')) return;
      sessionStorage.setItem('__seeded', '1');
      for (const [k, v] of Object.entries(s)) localStorage.setItem('plinto:' + k, typeof v === 'string' ? v : JSON.stringify(v));
    }, storage);
  }
  if (init) await ctx.addInitScript(init);
  if (clock) await ctx.clock.install({ time: new Date(clock) });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  return { browser, ctx, page, errori };
}
export const testo = (page) => page.evaluate(() => document.body.innerText);
export const shot = (page, nome) => page.screenshot({ path: PROVE + nome + '.png' });
export const ls = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
// Rileva elementi che escono dallo schermo / testi tagliati
export async function overflow(page) {
  return page.evaluate(() => {
    const out = [];
    const W = document.documentElement.clientWidth, H = innerHeight;
    if (document.documentElement.scrollWidth > W + 1) out.push(`scroll orizzontale: ${document.documentElement.scrollWidth}>${W}`);
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (r.right > W + 1 || r.left < -1) out.push(`fuori orizzontale: <${el.tagName.toLowerCase()} class="${el.className}"> "${(el.innerText || '').slice(0, 30)}" l=${r.left | 0} r=${r.right | 0}`);
      if (el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX) && el.children.length === 0) out.push(`testo tagliato: <${el.tagName.toLowerCase()} class="${el.className}"> "${(el.innerText || '').slice(0, 40)}" sw=${el.scrollWidth} cw=${el.clientWidth}`);
    }
    return [...new Set(out)].slice(0, 25);
  });
}
