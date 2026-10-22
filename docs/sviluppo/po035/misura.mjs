/**
 * PO-035: misura prima/dopo dell'impaginazione di gioco (non e' nel gate).
 *
 * Per ogni formato e scena: schermata, geometria della plancia e dei pezzi, e una
 * "firma" dell'impaginazione (rettangolo di ogni elemento dentro #root), che si confronta
 * fra due corse con `confronta.mjs` per dire se il verticale e i tablet sono rimasti
 * identici. Le partite sono fisse (seme scritto in localStorage), le animazioni spente.
 *
 * Uso: node docs/sviluppo/po035/misura.mjs <url> <cartella> [formati] [testo]
 *   formati: "640x360,915x412" (predefinito: tutti quelli di FORMATI)
 *   testo: moltiplicatore delle font-size (simulazione dei caratteri grandi, come in PO-017)
 */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { createGame, serializeGame } from '../../../src/core/engine.js';

const [URL0 = 'http://127.0.0.1:4173/', OUT = '/tmp/po035', SCELTI, TESTO] = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
const FORMATI = [
  [640, 360], [740, 360], [800, 360], [851, 393], [915, 412], [960, 600], [1024, 600], [1280, 620],
  [320, 640], [360, 640], [360, 800], [390, 844], [412, 915], [412, 805],
  [768, 1024], [1024, 768], [800, 1280], [1280, 800], [1280, 720], [1366, 657], [1366, 768], [1920, 1080],
];
const DA_FARE = SCELTI
  ? SCELTI.split(',').map((s) => s.split('x').map(Number))
  : FORMATI;
const LIBERA = serializeGame(createGame({ seed: 'po035-libera', now: 0 }));

const SCALA_TESTO = (f) => {
  const molt = (v) => v.replace(/(-?\d*\.?\d+)px/g, (_, n) => `${(Number(n) * f).toFixed(2)}px`);
  const giro = (regole) => {
    for (const r of regole) {
      if (r.style && r.style.fontSize) r.style.fontSize = molt(r.style.fontSize);
      if (r.style && r.style.font) r.style.font = molt(r.style.font);
      if (r.cssRules) giro(r.cssRules);
    }
  };
  for (const s of document.styleSheets) { try { giro(s.cssRules); } catch {} }
  const st = document.createElement('style');
  st.textContent = `html{font-size:${16 * f}px}`;
  document.head.appendChild(st);
};

const MISURA = () => {
  const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }; };
  const celle = document.querySelectorAll('.pl-plancia .pl-cella');
  const cella = celle.length ? celle[0].getBoundingClientRect() : null;
  const firma = [];
  const root = document.getElementById('root');
  for (const e of root.querySelectorAll('*')) {
    if (e.closest('svg') && e.tagName !== 'svg') continue;
    const r = e.getBoundingClientRect();
    const cls = typeof e.className === 'string' ? e.className.trim().split(/\s+/)[0] : e.tagName;
    firma.push(`${e.tagName}.${cls} ${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  const doc = document.scrollingElement;
  return {
    vw: innerWidth, vh: innerHeight,
    plancia: q('.pl-plancia'), cella: cella ? Math.round(cella.width * 10) / 10 : null,
    tray: q('.pl-tray'), hud: q('.pl-hud'), obiettivo: q('.pl-obiettivo'), catena: q('.pl-tavolo .pl-catena'),
    sporgeX: doc.scrollWidth - innerWidth, sporgeY: doc.scrollHeight - innerHeight,
    pannello: q('.pl-attrezzi__pannello'), menu: q('.pl-menu'),
    firma,
  };
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const righe = [];
for (const [w, h] of DA_FARE) {
  const tocco = w < 1100 || h < 700;
  const contesto = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: tocco, isMobile: tocco, deviceScaleFactor: 2, locale: 'it-IT' });
  const page = await contesto.newPage();
  page.setDefaultTimeout(8000);
  const nome = `${w}x${h}${TESTO ? `-testo${TESTO}` : ''}`;
  const scatta = async (scena) => {
    await page.waitForTimeout(300);
    const m = await page.evaluate(MISURA);
    await page.screenshot({ path: `${OUT}/${nome}-${scena}.png`, scale: 'css' });
    righe.push({ formato: nome, scena, ...m });
    const { firma, ...resto } = m;
    console.log(nome, scena, JSON.stringify(resto));
  };
  const prepara = async (extra) => {
    await page.goto(URL0, { waitUntil: 'networkidle' });
    await page.evaluate(([libera, extra]) => {
      localStorage.clear();
      localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true, tema: 'scuro', lingua: 'it', audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true }));
      localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
      localStorage.setItem('plinto:partita', JSON.stringify(libera));
      for (const [k, v] of Object.entries(extra ?? {})) localStorage.setItem(k, JSON.stringify(v));
    }, [LIBERA, extra]);
    await page.reload({ waitUntil: 'networkidle' });
    if (TESTO) await page.evaluate(SCALA_TESTO, Number(TESTO));
    await page.waitForSelector('.pl-home__azioni');
  };
  const passo = async (n, fn) => { try { await fn(); } catch (e) { console.log(nome, n, 'ERRORE', String(e.message).split('\n')[0]); righe.push({ formato: nome, scena: n, errore: String(e.message).split('\n')[0] }); } };

  await passo('libera', async () => {
    await prepara();
    await page.getByRole('button', { name: /^Partita libera, riprendi/ }).click();
    await page.waitForSelector('.pl-plancia');
    await scatta('libera');
    await page.locator('.pl-hud__menu').click();
    await page.waitForSelector('.pl-menu');
    await scatta('libera-menu');
  });
  await passo('sfida', async () => {
    await prepara();
    await page.getByRole('button', { name: /^(Sfida del giorno|Riprendi la sfida)/ }).click();
    await page.waitForSelector('.pl-plancia');
    await scatta('sfida');
  });
  await passo('livello', async () => {
    const v = {};
    for (let k = 1; k <= 12; k += 1) v[k] = { mosse: 12, punteggio: 300, tentativi: 1 };
    await prepara({ 'plinto:quadri': { versione: 1, livelli: v }, 'plinto:attrezzi': { versione: 1, disponibili: 2, riscossi: 2 } });
    await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    const tappa = page.locator('.pl-tappa').nth(12);
    await tappa.scrollIntoViewIfNeeded();
    await tappa.click();
    await page.getByRole('button', { name: /^Gioca$/ }).first().click();
    await page.waitForSelector('.pl-plancia');
    await scatta('livello13');
    await page.locator('.pl-attrezzi__pastiglia').click();
    await page.waitForSelector('.pl-attrezzi__pannello');
    await scatta('livello13-attrezzi');
  });
  await contesto.close();
}
await browser.close();
await writeFile(`${OUT}/misure${TESTO ? `-testo${TESTO}` : ''}.json`, JSON.stringify(righe));
