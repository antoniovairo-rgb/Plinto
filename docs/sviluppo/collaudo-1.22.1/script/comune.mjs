// Strumenti comuni del collaudo 1.22.1, contro il sito pubblicato.
import { chromium, devices } from '/home/user/Plinto/node_modules/playwright/index.mjs';
import { quadroNumero } from '/home/user/Plinto/src/config/quadri.js';
import { iniziaQuadro } from '/home/user/Plinto/src/core/quadro.js';
import { serializeGame, canPlaceHandPiece, placePiece } from '/home/user/Plinto/src/core/engine.js';

export const URL_SITO = process.env.URL_SITO ?? 'https://antoniovairo-rgb.github.io/Plinto/';
export const OUT = '/home/user/Plinto/docs/sviluppo/collaudo-1.22.1';
export const da = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const FORMATI = {
  '360x640': { viewport: { width: 360, height: 640 }, hasTouch: true, isMobile: true },
  '640x360': { viewport: { width: 640, height: 360 }, hasTouch: true, isMobile: true },
  '768x1024': { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true },
  '1366x768': { viewport: { width: 1366, height: 768 }, hasTouch: false, isMobile: false },
};

/** Il livello `numero` lasciato a meta', come lo scrive useQuadro.js; `mosse` mosse fatte. */
export function voceAMeta(numero, mosse = 1) {
  let p = iniziaQuadro(quadroNumero(numero), { now: 0 });
  for (let m = 0; m < mosse; m += 1) {
    let fatto = false;
    for (let h = 0; h < 3 && !fatto; h += 1) {
      for (let r = 0; r < 9 && !fatto; r += 1) {
        for (let c = 0; c < 9 && !fatto; c += 1) {
          if (p.hand[h] && canPlaceHandPiece(p, h, r, c)) { p = placePiece(p, h, r, c, 1000 * (m + 1)); fatto = true; }
        }
      }
    }
    if (!fatto) throw new Error('nessuna mossa possibile');
  }
  return { numero, partita: serializeGame(p), presentazione: false };
}

export async function nuovoBrowser() { return chromium.launch(); }

/**
 * Apre il sito con la memoria scritta come la scrive il gioco.
 * livelli: { numero: {mosse,punteggio,tentativi} } oppure array di numeri superati.
 */
export async function apri(browser, { formato = '360x640', lingua = 'it', livelli = [], aMeta = null, extra = {}, settings = {}, attendi = '.pl-home__menu' } = {}) {
  const contesto = await browser.newContext({
    ...FORMATI[formato], deviceScaleFactor: 1, locale: lingua === 'it' ? 'it-IT' : 'en-US',
    serviceWorkers: 'block',
  });
  const page = await contesto.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
  let mappa = livelli;
  if (Array.isArray(livelli)) { mappa = {}; for (const n of livelli) mappa[n] = { mosse: 12, punteggio: 300, tentativi: 1 }; }
  await page.goto(URL_SITO, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ mappa, voce, lingua, extra, settings }) => {
    localStorage.clear();
    localStorage.setItem('plinto:settings', JSON.stringify({
      versione: 2, introVista: true, lingua, animazioni: false, avvisoTorre: true, ...settings,
    }));
    localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: mappa }));
    if (voce) localStorage.setItem('plinto:partita-quadro', JSON.stringify(voce));
    for (const [k, v] of Object.entries(extra)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, { mappa, voce: aMeta, lingua, extra, settings });
  await page.goto(URL_SITO, { waitUntil: 'domcontentloaded' });
  if (attendi) await page.waitForSelector(attendi, { timeout: 15000 });
  await page.waitForTimeout(300);
  return { contesto, page, errori };
}

export const pulsanteGrande = (page) => page.locator('.pl-home__azioni .pl-btn--primario').first();
export const salvato = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null'));
export const testo = (page) => page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
export async function tocca(page, locator) {
  const box = await locator.boundingBox();
  if (!box) throw new Error('elemento non visibile');
  const ctxTouch = page.context()._options?.hasTouch;
  if (ctxTouch) await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  else await locator.click();
}
