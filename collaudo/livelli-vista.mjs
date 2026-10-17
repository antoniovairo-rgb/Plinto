// Apertura e partita dei livelli campione: impaginazione, testi, errori, a due formati e due lingue.
import { apri, testo, shot, overflow } from './lib.mjs';
const campioni = [1, 2, 11, 21, 41, 61, 81, 100];
const out = [];
for (const [nome, vp] of [['s360', { width: 360, height: 640 }], ['s412', { width: 412, height: 915 }]]) {
  for (const lingua of ['it', 'en']) {
    for (const n of campioni) {
      const livelli = {}; for (let k = 1; k < n; k += 1) livelli[k] = { mosse: 20, punteggio: 100, tentativi: 1 };
      const { browser, page, errori } = await apri({ viewport: vp, locale: lingua === 'it' ? 'it-IT' : 'en-US',
        storage: { settings: { versione: 1, introVista: true, lingua }, quadri: { versione: 1, livelli } } });
      await page.locator('.pl-btn--primario').first().click(); await page.waitForTimeout(500);
      const aper = await testo(page);
      const o1 = await overflow(page);
      const sc1 = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight }));
      await shot(page, `livello-${nome}-${lingua}-${n}-apertura`);
      const g = page.getByRole('button', { name: /^(Gioca|Play|Inizia|Start)/i });
      if (await g.count()) await g.first().click();
      await page.waitForTimeout(500);
      const o2 = await overflow(page);
      const inGioco = !!(await page.$('.pl-plancia'));
      const sc2 = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight }));
      await shot(page, `livello-${nome}-${lingua}-${n}-gioco`);
      out.push({ nome, lingua, n, inGioco, ap: o1.filter(x=>!/pl-sr/.test(x)), gi: o2.filter(x=>!/pl-sr/.test(x)), scrollAp: sc1.sh > sc1.ch + 1 ? `${sc1.sh}>${sc1.ch}` : '', scrollGi: sc2.sh > sc2.ch + 1 ? `${sc2.sh}>${sc2.ch}` : '', errori, titolo: aper.split('\n').slice(0, 6).join(' / ') });
      await browser.close();
    }
  }
}
for (const r of out) { if (!r.inGioco || r.ap.length || r.gi.length || r.scrollAp || r.scrollGi || r.errori.length) console.log(JSON.stringify(r)); }
console.log('livelli provati', out.length); console.log(out.filter(r=>r.nome==='s360'&&r.lingua==='it').map(r=>r.n+': '+r.titolo).join('\n'));
