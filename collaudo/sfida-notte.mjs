// Sfida iniziata ieri e lasciata a meta': che cosa offre la home il giorno dopo?
import { apri, testo, ls } from './lib.mjs';
import { leggi, mosseValide, tocca2 } from './gioco.mjs';
const { browser, ctx, page, errori } = await apri({ clock: '2026-10-15T23:50:00+02:00', ctxOpts: { timezoneId: 'Europe/Rome' }, storage: { settings: { versione: 1, introVista: true } } });
const card = async () => (await page.locator('.pl-sfida-avvio--sfida').innerText()).replace(/\n/g, ' / ');
await page.getByRole('button', { name: 'Sfida del giorno' }).click();
await page.waitForSelector('.pl-plancia .pl-cella');
for (let i = 0; i < 4; i += 1) { const s = await leggi(page); await tocca2(page, mosseValide(s)[0], s); }
const hud1 = await page.$eval('.pl-hud', (e) => e.innerText.replace(/\n/g, ' '));
console.log('giorno 15, HUD:', hud1);
await page.locator('.pl-hud__menu').click(); await page.getByRole('button', { name: /home/i }).click(); await page.waitForTimeout(300);
console.log('CARD (15):', await card());
await ctx.clock.fastForward(3 * 60 * 60 * 1000); // 02:50 del 16
await page.reload(); await page.waitForTimeout(500);
console.log('dopo 3 ore e ricarica, giorno', await page.evaluate(() => new Date().toLocaleDateString('it-IT')), 'CARD (16):', await card());
await page.getByRole('button', { name: /Riprendi la sfida|Sfida del giorno/ }).click(); await page.waitForTimeout(500);
const hud2 = await page.$eval('.pl-hud', (e) => e.innerText.replace(/\n/g, ' '));
const lab = JSON.parse((await ls(page))['plinto:partita-sfida']);
console.log('cliccando la card: HUD', hud2, 'seedLabel', lab.seedLabel, 'mosse', lab.stats.moves);
await browser.close();
console.log(errori);
