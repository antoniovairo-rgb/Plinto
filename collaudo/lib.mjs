import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
export const URL_PROD = process.env.PLINTO_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const CAND = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'];
const ESE = CAND.find(existsSync);
export async function apri({ w = 390, h = 844, lingua = 'it', seed = null, impostazioni = {} } = {}) {
  const opz = { executablePath: ESE };
  if (process.env.HTTPS_PROXY) opz.proxy = { server: process.env.HTTPS_PROXY };
  const browser = await chromium.launch(opz);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: lingua === 'it' ? 'it-IT' : 'en-US', ignoreHTTPSErrors: !!process.env.PLINTO_IGNORA_TLS, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errori.push('console: ' + m.text()); });
  await page.goto(URL_PROD, { waitUntil: 'networkidle' });
  await page.evaluate(({ seed, lingua, impostazioni }) => {
    localStorage.clear();
    localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true, tema: 'scuro', lingua, audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true, ...impostazioni }));
    for (const [k, v] of Object.entries(seed ?? {})) localStorage.setItem('plinto:' + k, JSON.stringify(v));
  }, { seed, lingua, impostazioni });
  await page.reload({ waitUntil: 'networkidle' });
  return { browser, page, errori };
}
export const ls = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => k.startsWith('plinto:')).map((k) => [k.slice(7), JSON.parse(localStorage.getItem(k))])));
export function esito() {
  const righe = []; let ko = 0;
  return { ok: (c, d, extra = '') => { console.log(`  ${c ? 'ok  ' : 'NO  '}${d}${extra ? '  [' + extra + ']' : ''}`); if (!c) ko++; righe.push({ c, d, extra }); }, get ko() { return ko; } };
}
