import { chromium } from 'playwright'; import { URL_PROD } from './lib.mjs'; import { existsSync } from 'node:fs';
const x = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: existsSync(x) ? x : undefined, proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
for (const q of ['', '?origine=play']) {
  const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' })).newPage();
  await p.goto(URL_PROD + q, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true, lingua: 'it', animazioni: false })));
  await p.goto(URL_PROD + q, { waitUntil: 'networkidle' });
  const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
  console.log(JSON.stringify(q), 'Recensisci presente:', /Recensisci/.test(t), '| origine in LS:', await p.evaluate(() => localStorage.getItem('plinto:origine')), '| url finale:', p.url());
}
await b.close();
