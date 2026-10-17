// C1: la home non scorre a 360x640, 375x667, 412x915 (it/en, con e senza partita/sfida).
import { apri, esito } from './lib.mjs';
const e = esito();
for (const [w, h] of [[360, 640], [375, 667], [412, 915], [320, 568], [360, 600]]) {
  for (const lingua of ['it', 'en']) {
    const { browser, page, errori } = await apri({ w, h, lingua });
    const m = await page.evaluate(() => { const d = document.documentElement; const b = document.body;
      const sc = [...document.querySelectorAll('*')].filter((x) => x.scrollHeight > x.clientHeight + 1 && ['auto','scroll'].includes(getComputedStyle(x).overflowY)).map((x) => x.className.toString().slice(0,40) + ':' + (x.scrollHeight - x.clientHeight));
      const az = document.querySelector('.pl-home__azioni');
      const last = [...document.querySelectorAll('.pl-home *')].reduce((mx, x) => Math.max(mx, x.getBoundingClientRect().bottom), 0);
      return { sH: d.scrollHeight, cH: d.clientHeight, bsH: b.scrollHeight, scroll: sc, ultimoBottom: Math.round(last), vh: innerHeight, classe: d.className, az: !!az }; });
    await page.screenshot({ path: `uscite/home-${w}x${h}-${lingua}.png` });
    const scorre = m.sH > m.cH || m.scroll.length > 0 || m.ultimoBottom > m.vh;
    e.ok(!scorre, `home ${w}x${h} ${lingua} non scorre`, JSON.stringify(m));
    e.ok(errori.length === 0, `nessun errore console ${w}x${h} ${lingua}`, errori.join('|'));
    await browser.close();
  }
}
process.exit(e.ko ? 1 : 0);
