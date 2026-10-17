import { apri } from './lib.mjs';
const { browser, page } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
await page.getByRole('button', { name: 'Partita libera' }).click();
await page.waitForSelector('.pl-plancia .pl-cella');
console.log(await page.evaluate(() => document.querySelector('.pl-tray').outerHTML.replace(/<svg[\s\S]*?<\/svg>/g,'<svg/>').slice(0, 3500)));
console.log(await page.evaluate(() => [...document.querySelectorAll('.pl-screen--gioco > *:not(.pl-plancia-area)')].map(e=>e.className).join(' ; ')));
await browser.close();
