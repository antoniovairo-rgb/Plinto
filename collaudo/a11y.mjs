// Accessibilita' evidente: lang del documento, titolo, focus visibile, nomi dei pulsanti, ordine di Tab, tastiera in partita.
import { apri, testo, shot } from './lib.mjs';
const { browser, page, errori } = await apri({ mobile: false, viewport: { width: 1280, height: 800 }, storage: { settings: { versione: 1, introVista: true, lingua: 'it' } } });
console.log('html lang (IT):', await page.evaluate(() => document.documentElement.lang), '| title:', await page.title());
await page.getByRole('button', { name: 'Impostazioni' }).click();
await page.getByRole('button', { name: 'English' }).click(); await page.waitForTimeout(300);
console.log('html lang dopo cambio a EN:', await page.evaluate(() => document.documentElement.lang), '| title:', await page.title());
await page.locator('.pl-hud__menu').first().click();
// pulsanti senza nome accessibile
const senzaNome = await page.evaluate(() => [...document.querySelectorAll('button, a, [role=button], input')].filter((e) => !((e.getAttribute('aria-label') || e.innerText || e.title || '').trim())).map((e) => e.outerHTML.slice(0, 100)));
console.log('home: elementi interattivi senza nome:', senzaNome);
// Tab e focus visibile
const focus = [];
for (let i = 0; i < 14; i += 1) {
  await page.keyboard.press('Tab');
  focus.push(await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return '(body)'; const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return `${(e.getAttribute('aria-label') || e.innerText || e.tagName).replace(/\n/g, ' ').slice(0, 28)} | outline=${cs.outlineStyle} ${cs.outlineWidth} shadow=${cs.boxShadow !== 'none' ? 'si' : 'no'} | ${r.width | 0}x${r.height | 0}`; }));
}
console.log(focus.join('\n'));
// dimensione bersagli tocco < 44
await page.setViewportSize({ width: 360, height: 640 }); await page.waitForTimeout(300);
const piccoli = await page.evaluate(() => [...document.querySelectorAll('.pl-home button, .pl-home a')].map((e) => { const r = e.getBoundingClientRect(); return { t: (e.innerText || e.getAttribute('aria-label')).replace(/\n/g, ' ').slice(0, 24), w: r.width | 0, h: r.height | 0 }; }).filter((x) => x.h < 40 || x.w < 40));
console.log('home 360: bersagli < 40px:', piccoli);
console.log(errori);
await browser.close();
