// Il «Record» accanto a «Partita libera» in home: include i punteggi della Sfida del giorno?
import { apri, testo, ls } from './lib.mjs';
import { leggi, mosseValide, tocca2 } from './gioco.mjs';
const { browser, page } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
const card = async (sel) => (await page.locator(sel).innerText()).replace(/\n/g, ' / ');
console.log('prima:', await card('.pl-sfida-avvio--libera'));
await page.getByRole('button', { name: 'Sfida del giorno' }).click(); await page.waitForSelector('.pl-plancia .pl-cella');
for (let i = 0; i < 80; i += 1) { if (await page.$('.pl-screen--fine, .pl-fine')) break; const s = await leggi(page); const v = mosseValide(s); if (!v.length) break; await tocca2(page, v[0], s); }
await page.getByRole('button', { name: /Torna alla home/i }).click(); await page.waitForTimeout(300);
console.log('dopo UNA sfida (mai giocato la partita libera):', await card('.pl-sfida-avvio--libera'), '|', await card('.pl-sfida-avvio--sfida'));
console.log('records:', (await ls(page))['plinto:records']);
await browser.close();
