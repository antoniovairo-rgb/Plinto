// Tasto Indietro: sequenza normale e dopo una ricarica a meta' livello (ripresa).
import { apri, testo } from './lib.mjs';
const schermata = (page) => page.evaluate(() => document.querySelector('.pl-home') ? 'home' : document.querySelector('.pl-tappe') ? 'mappa' : document.querySelector('.pl-plancia') ? 'gioco' : document.querySelector('.pl-velo') ? 'menu' : (document.querySelector('h1,h2')?.innerText ?? '?').slice(0, 20));
async function indietroFinoAUscire(page, max = 12) {
  const passi = [];
  for (let i = 0; i < max; i += 1) {
    const url0 = page.url();
    await page.goBack({ waitUntil: 'load', timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(250);
    const u = page.url();
    passi.push(`${u.startsWith('http://127.0.0.1:4180') ? await schermata(page) : 'USCITO(' + u.slice(0, 20) + ')'}`);
    if (!u.startsWith('http://127.0.0.1:4180')) break;
  }
  return passi;
}
for (const caso of ['normale', 'dopo-ricarica']) {
  const { browser, page, errori } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
  await page.goto('about:blank'); await page.goto('http://127.0.0.1:4180/'); await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click(); await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(0).click();
  const g = page.getByRole('button', { name: /^Gioca/ }); if (await g.count()) await g.first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  if (caso === 'dopo-ricarica') { await page.reload(); await page.waitForTimeout(600); }
  console.log(caso, 'schermata:', await schermata(page), 'history.length', await page.evaluate(() => history.length));
  console.log(caso, 'Indietro ripetuto ->', (await indietroFinoAUscire(page)).join(' > '));
  console.log(errori);
  await browser.close();
}
