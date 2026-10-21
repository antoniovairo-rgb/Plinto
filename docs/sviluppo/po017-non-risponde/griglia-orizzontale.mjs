/**
 * PO-017: dimensioni della griglia nella partita libera, per formato (misura, non gate).
 * Uso: node docs/sviluppo/po017-non-risponde/griglia-orizzontale.mjs <url> <etichetta> [cartella-foto]
 */
import { chromium } from 'playwright';
const [URL0 = 'http://localhost:4173/', ETICHETTA = 'locale', FOTO] = process.argv.slice(2);
const FORMATI = [[320, 640], [360, 640], [360, 800], [412, 915], [640, 360], [800, 360], [915, 412], [740, 360], [851, 393], [1024, 600], [960, 600], [1280, 620], [800, 1280], [1280, 800]];
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [w, h] of FORMATI) {
  const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, locale: 'it-IT' });
  const p = await c.newPage();
  await p.goto(`${URL0}?origine=play`);
  await p.evaluate(() => localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true })));
  await p.reload();
  // Le versioni vecchie non hanno la classe della card: si cerca anche per testo.
  const libera = p.locator('.pl-sfida-avvio--libera, button:has-text("Partita libera")').first();
  await libera.waitFor();
  await libera.tap();
  await p.waitForSelector('.pl-plancia', { state: 'attached' });
  await p.waitForTimeout(600);
  const m = await p.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return `${Math.round(q.width)}x${Math.round(q.height)}@${Math.round(q.left)},${Math.round(q.top)}`; };
    return { plancia: r('.pl-plancia'), area: r('.pl-plancia-area'), tavolo: r('.pl-tavolo'), tray: r('.pl-tray'), schermo: r('.pl-screen--gioco') };
  });
  if (FOTO) await p.screenshot({ path: `${FOTO}/${ETICHETTA}-libera-${w}x${h}.png`, scale: 'css' });
  console.log(`${ETICHETTA} ${w}x${h} ${JSON.stringify(m)}`);
  await c.close();
}
await b.close();
