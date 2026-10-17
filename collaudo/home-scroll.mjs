// C1: la home scorre a 360x640? Misura scrollHeight-clientHeight per lingua, stato e schermo.
import { apri, SCHERMI } from './lib.mjs';
const URL = process.env.COLLAUDO_URL;
const stati = {
  nuovo: { settings: { versione: 2, introVista: true } },
  record: { settings: { versione: 2, introVista: true }, stats: null },
};
for (const lingua of ['it', 'en']) for (const [n, v] of Object.entries(SCHERMI)) {
  const { browser, page } = await apri({ url: URL, viewport: v, locale: lingua === 'it' ? 'it-IT' : 'en-US', storage: { settings: { versione: 2, introVista: true, lingua } } });
  const r = await page.evaluate(() => { const el = document.querySelector('.pl-home'); const f = getComputedStyle(document.body).fontFamily;
    const kids = [...el.children].map((c) => `${c.className.split(' ')[0]}:${Math.round(c.getBoundingClientRect().height)}`);
    return { sh: el.scrollHeight, ch: el.clientHeight, extra: el.scrollHeight - el.clientHeight, f, kids, ov: getComputedStyle(el).overflowY }; });
  console.log(lingua, n, JSON.stringify(r));
  await browser.close();
}
