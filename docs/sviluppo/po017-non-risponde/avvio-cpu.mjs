/**
 * PO-017: avvio a freddo e transizioni con la CPU rallentata, poi senza rete.
 * Misura, non correzione; non fa parte del gate.
 *
 * Uso: node docs/sviluppo/po017-non-risponde/avvio-cpu.mjs <url> <etichetta>
 * Stampa una riga JSON per prova.
 */
import { chromium } from 'playwright';

const URL0 = process.argv[2] ?? 'http://localhost:4173/';
const ETICHETTA = process.argv[3] ?? 'locale';

const INIT = () => {
  window.__lt = [];
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration) }); })
      .observe({ type: 'longtask', buffered: true });
  } catch {}
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

async function prova(cpu, formato) {
  const contesto = await browser.newContext({
    viewport: { width: formato.w, height: formato.h }, deviceScaleFactor: 3, hasTouch: true, isMobile: true, locale: 'it-IT',
  });
  await contesto.addInitScript(INIT);
  const page = await contesto.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  const cdp = await contesto.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const fasi = {};
  const lt = async () => page.evaluate(() => { const v = window.__lt; window.__lt = []; return v; });
  // Il tempo dal tocco alla schermata nuova, misurato fuori dalla pagina.
  const transizione = async (nome, sel, attesa) => {
    const t0 = Date.now();
    const box = await page.locator(sel).first().boundingBox();
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForSelector(attesa, { timeout: 30000 });
    fasi[nome] = { ms: Date.now() - t0, longTask: await lt() };
  };

  let t0 = Date.now();
  await page.goto(`${URL0}?origine=play`, { waitUntil: 'commit' });
  await page.waitForSelector('.pl-guida', { timeout: 60000 });
  fasi.avvioFreddo = { ms: Date.now() - t0, longTask: await lt() };
  await transizione('guida->home (Non mostrarmela più)', '.pl-guida__link >> nth=1', '.pl-home__menu');
  await transizione('home->libera', '.pl-sfida-avvio--libera', '.pl-plancia');
  await transizione('libera->menu', '.pl-hud .pl-hud__menu', '.pl-menu');
  await transizione('menu->torna', '.pl-menu .pl-btn >> nth=0', '.pl-plancia');
  t0 = Date.now(); await page.goBack(); await page.waitForSelector('.pl-home__menu');
  fasi['libera->home (Indietro)'] = { ms: Date.now() - t0, longTask: await lt() };
  await transizione('home->mappa', '.pl-sfida-avvio--mappa', '.pl-tappe');
  await transizione('mappa->livello1', '.pl-tappa >> nth=0', '.pl-apertura__azioni, .pl-plancia');
  t0 = Date.now(); await page.goBack(); await page.waitForSelector('.pl-tappe');
  t0 = Date.now(); await page.goBack(); await page.waitForSelector('.pl-home__menu');
  await transizione('home->aiuto', '.pl-home__voce >> nth=0', '.pl-pagina__testata');

  // Avvio a caldo (dalla cache HTTP / service worker) e poi senza rete.
  t0 = Date.now();
  await page.reload({ waitUntil: 'commit' });
  await page.waitForSelector('#root .pl-screen', { timeout: 60000 });
  fasi.ricarica = { ms: Date.now() - t0, longTask: await lt() };
  const sw = await page.evaluate(async () => {
    if (!('serviceWorker' in navigator)) return 'assente';
    const r = await Promise.race([navigator.serviceWorker.ready.then(() => 'pronto'), new Promise((x) => setTimeout(() => x('non pronto in 10 s'), 10000))]);
    return `${r}, controlla la pagina: ${Boolean(navigator.serviceWorker.controller)}`;
  });
  await contesto.setOffline(true);
  t0 = Date.now();
  let offline;
  try {
    await page.reload({ waitUntil: 'commit', timeout: 30000 });
    await page.waitForSelector('#root .pl-screen', { timeout: 30000 });
    offline = { ms: Date.now() - t0, schermata: await page.evaluate(() => document.querySelector('#root .pl-screen')?.className) };
    await page.touchscreen.tap(...(await page.locator('.pl-sfida-avvio--libera').boundingBox().then((b) => [b.x + b.width / 2, b.y + b.height / 2])));
    await page.waitForSelector('.pl-plancia', { timeout: 10000 });
    offline.partitaSenzaRete = true;
  } catch (e) { offline = { errore: String(e.message).split('\n')[0] }; }
  await contesto.close();
  return { etichetta: ETICHETTA, cpu, formato: formato.nome, fasi, sw, offline, errori };
}

for (const cpu of [1, 4, 6]) {
  for (const formato of [{ nome: '360x640', w: 360, h: 640 }, { nome: '640x360', w: 640, h: 360 }]) {
    try { console.log(JSON.stringify(await prova(cpu, formato))); }
    catch (e) { console.log(JSON.stringify({ etichetta: ETICHETTA, cpu, formato: formato.nome, errore: String(e.message).split('\n')[0] })); }
  }
}
await browser.close();
