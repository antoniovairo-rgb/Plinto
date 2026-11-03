import { apri, nuovoBrowser, pulsanteGrande, da, voceAMeta, OUT } from './comune.mjs';
const browser = await nuovoBrowser();
// stato DOPO l'importazione «Sostituisci» di M3, scritto direttamente: 1-10 superati, partita del 100 ancora salvata
const { contesto, page } = await apri(browser, { livelli: da(1, 10), aMeta: voceAMeta(100, 3) });
console.log('pulsante', (await pulsanteGrande(page).textContent()).trim());
await page.locator('.pl-sfida-avvio--mappa').click();
await page.waitForTimeout(600);
const t = page.locator('.pl-tappa[aria-label^="Livello 100:"]').first();
console.log('tappa 100:', await t.getAttribute('aria-label'), await t.getAttribute('class'), 'disabled', await t.isDisabled());
await t.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}/d1-tappa-100-chiusa-360x640-it.png` });
await page.screenshot({ path: `${OUT}/d1-tappa-100-chiusa-360x640-it.png` });
await page.goto(page.url().split('#')[0]); await page.waitForTimeout(800);
await page.locator('.pl-hud__menu').first().click().catch(()=>{}); await page.waitForTimeout(300);
await contesto.close(); await browser.close();
