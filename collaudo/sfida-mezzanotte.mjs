// Sfida del giorno e cambio di giorno a mezzanotte con orologio simulato (Playwright clock).
import { apri, testo, shot, ls } from './lib.mjs';
import { leggi, mosseValide, tocca2 } from './gioco.mjs';
const fuso = process.argv[2] ?? 'Europe/Rome';
const inizio = process.argv[3] ?? '2026-10-15T23:58:30';
const { browser, ctx, page, errori } = await apri({ clock: inizio, ctxOpts: { timezoneId: fuso }, storage: { settings: { versione: 1, introVista: true } } });
const card = async () => (await page.locator('.pl-sfida-avvio--sfida').innerText()).replace(/\n/g, ' / ');
console.log('inizio', await page.evaluate(() => new Date().toString()));
console.log('CARD SFIDA:', await card());
await page.getByRole('button', { name: 'Sfida del giorno' }).click();
await page.waitForSelector('.pl-plancia .pl-cella');
console.log('seedLabel:', JSON.parse((await ls(page))['plinto:partita-sfida']).seedLabel);
for (let i = 0; i < 80; i += 1) {
  if (await page.$('.pl-fine, .pl-screen--fine')) break;
  const s = await leggi(page); const v = mosseValide(s); if (!v.length) break;
  await tocca2(page, v[0], s);
}
console.log('FINE:', (await testo(page)).replace(/\n+/g, ' | ').slice(0, 120));
await page.getByRole('button', { name: /Torna alla home/i }).click(); await page.waitForTimeout(300);
console.log('CARD dopo partita (giorno 15):', await card());
await ctx.clock.fastForward(5 * 60 * 1000);  // superata la mezzanotte
console.log('ora ->', await page.evaluate(() => new Date().toString()));
await page.waitForTimeout(500);
console.log('CARD senza ricaricare (giorno 16):', await card());
await shot(page, 'sfida-card-dopo-mezzanotte');
await page.getByRole('button', { name: 'Sfida del giorno' }).click(); await page.waitForTimeout(400);
console.log('seedLabel dopo mezzanotte:', JSON.parse((await ls(page))['plinto:partita-sfida'])?.seedLabel);
await page.locator('.pl-hud__menu').click(); await page.waitForTimeout(200);
await page.getByRole('button', { name: /home/i }).click(); await page.waitForTimeout(300);
console.log('CARD dopo tornare in home:', await card());
await browser.close();
console.log(errori);
