import { apri, testo } from './lib.mjs';
const { browser, page } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
await page.getByRole('button', { name: 'Impostazioni' }).click();
await page.waitForTimeout(300);
console.log(await page.$$eval('button', (bs) => bs.map((b) => b.innerText.replace(/\n/g,' ')+' |'+b.className).join('\n')));
await browser.close();
