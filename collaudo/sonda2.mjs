import { apri, testo, shot } from './lib.mjs';
const { browser, page, errori } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
await page.getByRole('button', { name: 'Partita libera' }).click();
await page.waitForSelector('.pl-plancia .pl-cella');
console.log(await page.evaluate(() => document.querySelector('.pl-screen--gioco').outerHTML.replace(/<svg[\s\S]*?<\/svg>/g,'<svg/>').slice(0, 6000)));
await browser.close();
