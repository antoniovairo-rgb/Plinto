// Service worker: offline dopo il primo caricamento e aggiornamento di versione (build A -> build B servita dallo stesso indirizzo).
import { apri, testo } from './lib.mjs';
import { execSync } from 'node:child_process';
const S = '/tmp/claude-0/-home-user-Plinto/cef19c88-5f4e-5c35-9d19-f9638d39a3cc/scratchpad';
const URL4 = 'http://127.0.0.1:4190/';
const ver = async (page) => { await page.evaluate(() => { for (const k of ['ripresa']) localStorage.removeItem('plinto:'+k); }); const s = await page.evaluate(() => [...document.scripts].map((x) => x.src.split('/').pop()).join(',')); return `${(await testo(page)).match(/v\d+\.\d+\.\d+/)?.[0] ?? '(non in home)'} [${s}]`; };
const { browser, ctx, page, errori } = await apri({ url: URL4, mobile: false, storage: { settings: { versione: 1, introVista: true } } });
await page.waitForTimeout(1500);
console.log('versione dopo il primo caricamento:', await ver(page));
console.log('SW:', await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); return r ? { stato: (r.active || r.installing || r.waiting)?.state, script: (r.active || r.installing || r.waiting)?.scriptURL } : null; }));
console.log('cache:', await page.evaluate(async () => { const k = await caches.keys(); const out = {}; for (const n of k) out[n] = (await (await caches.open(n)).keys()).length; return out; }));
// OFFLINE
await ctx.setOffline(true);
await page.reload({ waitUntil: 'load' }).catch((e) => console.log('reload offline errore:', e.message.slice(0, 80)));
await page.waitForTimeout(800);
console.log('OFFLINE: home visibile?', /PLINTO/.test(await testo(page)), await ver(page));
await page.getByRole('button', { name: 'Partita libera' }).click(); await page.waitForTimeout(400);
console.log('OFFLINE: partita si apre?', !!(await page.$('.pl-plancia')));
await page.evaluate(() => location.reload()); await page.waitForTimeout(800);
// anche un indirizzo con ancora e con query
await page.goto(URL4 + '?x=1#/sfida/2026-10-10').catch((e) => console.log('goto offline con query:', e.message.slice(0, 80)));
await page.waitForTimeout(800);
console.log('OFFLINE con query+ancora:', (await testo(page)).replace(/\n+/g, ' | ').slice(0, 80));
await ctx.setOffline(false);
// AGGIORNAMENTO: si sostituisce il contenuto servito con la build B (1.21.7)
execSync(`rm -rf ${S}/servito/* && cp -r ${S}/copiaB/dist/* ${S}/servito/`);
await page.evaluate(() => { localStorage.removeItem('plinto:ripresa'); localStorage.removeItem('plinto:partita'); });
await page.goto(URL4); await page.waitForTimeout(2500);
console.log('dopo avere pubblicato 1.21.7 - primo ricaricamento:', await ver(page));
await page.reload(); await page.waitForTimeout(2500);
console.log('secondo ricaricamento:', await ver(page));
console.log('cache dopo l\'aggiornamento:', await page.evaluate(async () => { const k = await caches.keys(); const out = {}; for (const n of k) out[n] = (await (await caches.open(n)).keys()).length; return out; }));
console.log('SW script:', await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL));
console.log('errori:', [...new Set(errori)]);
await browser.close();
