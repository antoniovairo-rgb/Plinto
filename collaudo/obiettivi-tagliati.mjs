// Per ciascuno dei 100 livelli, a 360x640 e 390x844, in IT e EN: la frase dell'obiettivo nella partita e' tagliata?
import { chromium } from 'playwright';
import { CHROMIUM, LOCALE } from './lib.mjs';
const browser = await chromium.launch({ executablePath: CHROMIUM });
const tagliati = [];
for (const [nome, vp] of [['360', { width: 360, height: 640 }], ['390', { width: 390, height: 844 }]]) {
  for (const lingua of ['it', 'en']) {
    const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true, locale: lingua === 'it' ? 'it-IT' : 'en-US' });
    const page = await ctx.newPage();
    for (let n = 1; n <= 100; n += 1) {
      const livelli = {}; for (let k = 1; k < n; k += 1) livelli[k] = { mosse: 20, punteggio: 100, tentativi: 1 };
      await page.goto(LOCALE);
      await page.evaluate(({ livelli, lingua }) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 1, introVista: true, lingua })); localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli })); }, { livelli, lingua });
      await page.reload();
      try { await page.locator('.pl-btn--primario').first().click({ timeout: 5000 }); } catch (e) { tagliati.push(`${nome} ${lingua} L${n}: home senza pulsante primario (${(await page.evaluate(() => document.body.innerText.slice(0, 80))).replace(/\n/g, ' ')})`); continue; }
      const g = page.getByRole('button', { name: /^(Gioca|Play|Inizia|Start)/i });
      await page.waitForTimeout(150);
      if (await g.count()) await g.first().click();
      await page.waitForSelector('.pl-plancia', { timeout: 4000 }).catch(() => {});
      const r = await page.evaluate(() => {
        const e = document.querySelector('.pl-obiettivo__frase');
        return e ? { tagliato: e.scrollWidth > e.clientWidth + 1, testo: e.innerText, sw: e.scrollWidth, cw: e.clientWidth } : { assente: true };
      });
      if (r.tagliato) tagliati.push(`${nome} ${lingua} L${n}: "${r.testo}" ${r.sw}>${r.cw}`);
      if (r.assente) tagliati.push(`${nome} ${lingua} L${n}: frase assente`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(tagliati.join('\n') || 'nessuna frase tagliata'); console.log('totale', tagliati.length);
