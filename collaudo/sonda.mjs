import { apri, testo, shot, overflow } from './lib.mjs';
const { browser, page, errori } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
console.log(await testo(page));
console.log(await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => `${b.className} | ${b.innerText.replace(/\n/g, ' ')} | ${b.getAttribute('aria-label')}`).join('\n')));
await shot(page, 'sonda-home');
console.log(await overflow(page), errori);
await browser.close();
