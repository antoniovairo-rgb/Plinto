/**
 * PO-017: quanto tarda la reazione al tocco su mappa e livello, a seconda di quanti
 * livelli sono superati e della CPU (misura, non gate).
 *
 * "Reazione" = prima modifica del DOM dopo il tocco (MutationObserver), e "pronto" =
 * comparsa della schermata attesa. Long task raccolti per tutta la prova.
 * Uso: node docs/sviluppo/po017-non-risponde/latenza-mappa.mjs <url> <etichetta>
 */
import { chromium } from 'playwright';

const [URL0 = 'http://localhost:4173/', ETICHETTA = 'locale'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function prova(superati, cpu) {
  const c = await b.newContext({ viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3, locale: 'it-IT' });
  await c.addInitScript(() => {
    window.__lt = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(Math.round(e.duration)); }).observe({ type: 'longtask', buffered: true }); } catch {}
  });
  const p = await c.newPage();
  await p.goto(`${URL0}?origine=play`);
  await p.evaluate((n) => {
    localStorage.clear();
    localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true }));
    const livelli = {};
    for (let i = 2; i <= n + 1; i += 1) livelli[i] = { mosse: 12, punteggio: 300, tentativi: 1 };
    localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
  }, superati);
  await p.reload();
  await p.waitForSelector('.pl-home__menu');
  const cdp = await c.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await p.evaluate(() => { window.__lt = []; });
  const tocco = async (sel, attesa) => {
    // Il bersaglio si porta in vista prima (con 99 livelli la mappa si apre altrove).
    await p.locator(sel).first().scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    const box = await p.locator(sel).first().boundingBox();
    await p.evaluate(() => {
      window.__t0 = performance.now(); window.__tm = null;
      window.__mo = new MutationObserver(() => { if (window.__tm === null) window.__tm = performance.now() - window.__t0; });
      window.__mo.observe(document.body, { subtree: true, childList: true, attributes: true });
    });
    const t0 = Date.now();
    await p.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await p.waitForSelector(attesa, { state: 'attached', timeout: 60000 });
    const pronto = Date.now() - t0;
    const reazione = await p.evaluate(() => { window.__mo.disconnect(); return Math.round(window.__tm ?? -1); });
    return { reazione, pronto };
  };
  const r = {};
  r.homeMappa = await tocco('.pl-sfida-avvio--mappa', '.pl-tappe');
  await p.waitForTimeout(800);
  r.mappaLivello = await tocco('.pl-tappa >> nth=0', '.pl-apertura__azioni');
  await p.waitForTimeout(800);
  r.gioca = await tocco('.pl-apertura__azioni .pl-btn--primario', '.pl-plancia');
  r.longTask = await p.evaluate(() => window.__lt.filter((d) => d >= 50));
  await c.close();
  return r;
}

for (const cpu of [1, 4, 6]) {
  for (const superati of [0, 99]) {
    try { console.log(JSON.stringify({ etichetta: ETICHETTA, cpu, superati, ...(await prova(superati, cpu)) })); }
    catch (e) { console.log(JSON.stringify({ etichetta: ETICHETTA, cpu, superati, errore: String(e.message).split('\n')[0] })); }
  }
}
await b.close();
