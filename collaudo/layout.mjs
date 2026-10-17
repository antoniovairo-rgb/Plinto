// Scorre tutte le schermate a 4 formati x 2 lingue e cerca scroll orizzontale, elementi fuori schermo, testi tagliati, errori.
import { apri, overflow, shot, SCHERMI, LOCALE } from './lib.mjs';
const url = process.argv[2] ?? LOCALE;
const tag = process.argv[3] ?? 'locale';
const risultati = [];
for (const [nome, vp] of Object.entries(SCHERMI)) {
  for (const lingua of ['it', 'en']) {
    const { browser, page, errori } = await apri({ url, viewport: vp, locale: lingua === 'it' ? 'it-IT' : 'en-US', mobile: vp.width < 800,
      storage: { settings: { versione: 1, introVista: true, lingua } } });
    const voci = await page.$$eval('.pl-home button', (bs) => bs.map((b) => b.innerText.replace(/\n/g, ' ').trim()));
    const home = async () => { /* torna alla home col Back del browser non affidabile: ricarica */ await page.evaluate(() => { for (const k of ['ripresa','partita','partita-quadro','partita-sfida']) localStorage.removeItem('plinto:'+k); }); await page.goto(url); await page.waitForTimeout(400); };
    const controlla = async (etichetta) => {
      const o = await overflow(page);
      const sY = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight }));
      risultati.push({ nome, lingua, etichetta, overflow: o, scrollV: sY.sh > sY.ch + 1 ? `${sY.sh}>${sY.ch}` : '' });
      await shot(page, `layout-${tag}-${nome}-${lingua}-${etichetta}`);
    };
    await controlla('home');
    // schermate raggiungibili dalle voci della home (per indice)
    const n = await page.$$eval('.pl-home button', (bs) => bs.length);
    for (let i = 0; i < n; i += 1) {
      await home();
      const bt = (await page.$$('.pl-home button'))[i];
      const nomeVoce = (await bt.innerText()).replace(/\n/g, ' ').trim().slice(0, 14).replace(/[^\wàèéìòù]+/gi, '_');
      if (/Sostieni|Support/i.test(nomeVoce)) { await bt.click(); await page.waitForTimeout(400); await controlla('sostieni'); continue; }
      await bt.click(); await page.waitForTimeout(700);
      await controlla(`v${i}-${nomeVoce}`);
    }
    risultati.push({ nome, lingua, etichetta: 'errori', errori: [...new Set(errori)] });
    await browser.close();
  }
}
for (const r of risultati) {
  if (r.errori?.length) console.log(JSON.stringify(r));
  else if (r.overflow?.length || r.scrollV) console.log(JSON.stringify(r));
}
console.log('fatto', risultati.length);
