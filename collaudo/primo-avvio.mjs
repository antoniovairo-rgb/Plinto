// Primo avvio senza dati: la guida passo per passo, a 4 formati, IT/EN, su locale (argomento 'locale') o sito pubblicato ('pubblico').
import { apri, testo, shot, overflow, SCHERMI, LOCALE, PUBBLICO } from './lib.mjs';
const url = process.argv[2] === 'pubblico' ? PUBBLICO : LOCALE;
const tag = process.argv[2] === 'pubblico' ? 'pub' : 'loc';
for (const [nome, vp] of Object.entries(SCHERMI)) {
  for (const lingua of ['it-IT', 'en-US']) {
    const { browser, page, errori } = await apri({ url, viewport: vp, locale: lingua, mobile: vp.width < 800 });
    const passi = [];
    let i = 0;
    for (; i < 10; i += 1) {
      const o = (await overflow(page)).filter((x) => !/pl-sr/.test(x));
      const sc = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight }));
      const t = (await testo(page)).replace(/\n+/g, ' | ').slice(0, 70);
      passi.push(`${i}: ${t}${o.length ? ' OVERFLOW ' + JSON.stringify(o) : ''}${sc.sh > sc.ch + 1 ? ' SCROLL ' + sc.sh + '>' + sc.ch : ''}`);
      if (i === 0 || i === 3) await shot(page, `primo-${tag}-${nome}-${lingua}-${i}`);
      const avanti = page.getByRole('button', { name: /^(Avanti|Next|Continua|Continue)/i });
      if (await avanti.count() === 0) break;
      await avanti.first().click(); await page.waitForTimeout(250);
    }
    const fine = (await testo(page)).replace(/\n+/g, ' | ').slice(0, 90);
    console.log(`${tag} ${nome} ${lingua}: ${i} passi; ultimo: ${fine}; errori: ${JSON.stringify([...new Set(errori)])}`);
    if (passi.some((p) => /OVERFLOW|SCROLL/.test(p))) console.log(passi.filter((p) => /OVERFLOW|SCROLL/.test(p)).join('\n'));
    await browser.close();
  }
}
