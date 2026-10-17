/**
 * PO-008: «quando l'app viene messa in background per qualche secondo la partita /
 * missione non deve partire da 0».
 *
 * Ogni caso porta il giocatore dentro un livello (o una partita libera), lo fa giocare,
 * lo interrompe in un modo diverso e poi prova a TORNARE DENTRO come farebbe lui: da
 * solo, oppure toccando la mappa o il pulsante grande della home. Si confronta la
 * "firma" della partita (punteggio, obiettivo, caselle piene) prima e dopo: se cambia,
 * il livello e' ripartito da zero.
 *
 *   A  Indietro dal livello porta alla mappa; riaprire il livello lo riprende.
 *   B  passate piu' di due ore, la home offre di riprendere il livello.
 *   C  uscendo mentre si legge l'obiettivo (presentazione) il livello e' gia' salvato.
 *   D  secondo piano simulato (visibilitychange, pagehide, freeze vero via CDP).
 *   E  ricarica (il sistema butta via la pagina).
 *   F  nuova navigazione all'indirizzo di avvio dell'app, `?origine=play`.
 *   G  `introVista` falso ("salta per ora"): la ripresa automatica avviene lo stesso.
 *   H  come G, per la partita libera.
 *
 * Stampa una tabella; esce con 1 se in almeno un caso si riparte da zero.
 * Uso: npm run e2e-po008
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { FINESTRA_RIPRESA } from '../../src/persistence/ripresa.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const errori = [];
const righe = [];

async function prepara({ introVista = true } = {}) {
  const contesto = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
  const page = await contesto.newPage();
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.evaluate((vista) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: vista, lingua: 'it' }));
  }, introVista);
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(introVista ? '.pl-home__menu' : 'text=Salta per ora');
  return { contesto, page };
}

/** Dove si trova il giocatore adesso. */
const dove = (page) => page.evaluate(() => {
  if (document.querySelector('.pl-plancia')) return 'partita';
  if (document.querySelector('.pl-apertura')) return 'obiettivo';
  if (document.querySelector('.pl-tappe')) return 'mappa';
  if (document.querySelector('.pl-home')) return 'home';
  if ([...document.querySelectorAll('button')].some((b) => /Salta per ora/.test(b.innerText))) return 'guida';
  return '?';
});

/** Punteggio, obiettivo e caselle piene: se cambia uno dei tre, e' un'altra partita. */
const firma = (page) => page.evaluate(() => {
  const hud = document.querySelector('.pl-hud')?.innerText.replace(/\s+/g, ' ') ?? '';
  const ob = document.querySelector('.pl-obiettivo, .pl-barra-obiettivo')?.innerText.replace(/\s+/g, ' ') ?? '';
  const piene = [...document.querySelectorAll('.pl-plancia .pl-cella')].filter((c) => c.className.includes('piena')).length;
  return `${hud} / ${ob} / ${piene} piene`;
});

async function unaMossa(page) {
  const p = await page.evaluate(() => {
    const pezzo = document.querySelector('.pl-tray .pl-pezzo');
    const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    if (!pezzo || !celle.length) return null;
    const rp = pezzo.getBoundingClientRect();
    const vuote = celle.filter((c) => !c.className.includes('piena'));
    const rc = (vuote[Math.floor(vuote.length / 2)] ?? celle[40]).getBoundingClientRect();
    return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 };
  });
  if (!p) return;
  await page.mouse.move(p.px, p.py);
  await page.mouse.down();
  await page.mouse.move(p.cx, p.cy, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(150);
}

async function aspetta(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(900);
}

/** Dalla home: mappa, primo livello, "Gioca" se c'e' la presentazione. */
async function apriLivello1DallaMappa(page) {
  if (await dove(page) === 'home') {
    await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
  }
  await page.locator('.pl-tappa').first().click();
  await page.waitForTimeout(300);
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
}

async function entraEGioca(page, mosse = 3) {
  await apriLivello1DallaMappa(page);
  for (let i = 0; i < mosse; i += 1) await unaMossa(page);
  await page.waitForTimeout(500);
  return firma(page);
}

/** Torna nel livello come farebbe il giocatore, da qualunque schermata. */
async function tornaNelLivello(page) {
  if (await dove(page) === 'guida') {
    await page.getByRole('button', { name: /Salta per ora/ }).click();
    await page.waitForTimeout(300);
  }
  if (await dove(page) === 'home') {
    await page.locator('.pl-home__azioni .pl-btn--primario').click();
    await page.waitForTimeout(300);
  }
  if (await dove(page) === 'mappa') {
    await page.locator('.pl-tappa').first().click();
    await page.waitForTimeout(300);
  }
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  return firma(page);
}

function registra(caso, { primo, prima, dopo, nota = '' }) {
  const daZero = prima !== dopo;
  righe.push({ caso, primo, daZero, nota });
  if (daZero) errori.push(`${caso}: si riparte da zero ("${prima}" -> "${dopo}")`);
}

// ---------- A ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.goBack();
  await page.waitForTimeout(500);
  const primo = await dove(page);
  const salvato = await page.evaluate(() => localStorage.getItem('plinto:partita-quadro') !== null);
  const dopo = await tornaNelLivello(page);
  registra('A Indietro dal livello, poi riapro il livello dalla mappa', { primo, prima, dopo, nota: `salvataggio dopo Indietro: ${salvato}` });
  // Il B6 resta: dopo la mappa, Indietro va alla home.
  if (primo !== 'mappa') errori.push(`A: Indietro dal livello porta a "${primo}", non alla mappa`);
  await contesto.close();
}

// ---------- B ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.evaluate((f) => {
    const voce = JSON.parse(localStorage.getItem('plinto:ripresa'));
    voce.quando = Date.now() - f - 60_000;
    localStorage.setItem('plinto:ripresa', JSON.stringify(voce));
  }, FINESTRA_RIPRESA);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  const etichetta = primo === 'home'
    ? (await page.locator('.pl-home__azioni .pl-btn--primario').innerText()).replace(/\s+/g, ' ') : '';
  const dopo = await tornaNelLivello(page);
  registra('B oltre 2 ore, poi pulsante grande della home', { primo, prima, dopo, nota: `pulsante: «${etichetta}»` });
  if (primo !== 'home') errori.push(`B: oltre la finestra il gioco non apre la home ma "${primo}"`);
  await contesto.close();
}

// ---------- C ----------
{
  const { contesto, page } = await prepara();
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').first().click();
  await page.waitForSelector('.pl-apertura');
  await page.waitForTimeout(300);
  const salvato = await page.evaluate(() => localStorage.getItem('plinto:partita-quadro') !== null);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  righe.push({ caso: 'C esco mentre leggo l obiettivo, ricarico', primo, daZero: !salvato, nota: `salvato durante la presentazione: ${salvato}` });
  if (!salvato) errori.push('C: durante la presentazione dell obiettivo il livello non e salvato');
  if (primo !== 'obiettivo') errori.push(`C: dopo la ricarica non si torna all obiettivo del livello ma a "${primo}"`);
  await contesto.close();
}

// ---------- D ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    document.dispatchEvent(new Event('freeze'));
  });
  const cdp = await contesto.newCDPSession(page);
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  await new Promise((r) => setTimeout(r, 3000));
  await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('resume'));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('D secondo piano (visibilitychange, pagehide, freeze CDP 3 s)', { primo, prima, dopo });
  await contesto.close();
}

// ---------- E ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('E ricarica (pagina buttata via)', { primo, prima, dopo });
  await contesto.close();
}

// ---------- F ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.goto(`${INDIRIZZO}?origine=play`);
  await aspetta(page);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('F nuova navigazione a ?origine=play', { primo, prima, dopo });
  await contesto.close();
}

// ---------- G ----------
{
  const { contesto, page } = await prepara({ introVista: false });
  await page.getByRole('button', { name: /Salta per ora/ }).click();
  await page.waitForSelector('.pl-home__menu');
  const prima = await entraEGioca(page);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('G introVista falso, livello, ricarica', { primo, prima, dopo });
  if (primo !== 'partita') errori.push(`G: con introVista falso la ripresa automatica non avviene (si apre "${primo}")`);
  await contesto.close();
}

// ---------- H ----------
{
  const { contesto, page } = await prepara({ introVista: false });
  await page.getByRole('button', { name: /Salta per ora/ }).click();
  await page.waitForSelector('.pl-home__menu');
  await page.getByRole('button', { name: /^Partita libera/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(500);
  const prima = await firma(page);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  if (primo === 'guida') await page.getByRole('button', { name: /Salta per ora/ }).click();
  if (await dove(page) === 'home') {
    await page.getByRole('button', { name: /^Riprendi la partita/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await page.waitForTimeout(500);
  }
  const dopo = await firma(page);
  registra('H introVista falso, partita libera, ricarica', { primo, prima, dopo });
  if (primo !== 'partita') errori.push(`H: con introVista falso la partita libera non si riapre da sola (si apre "${primo}")`);
  await contesto.close();
}

await browser.close();
if (server) server.kill();

console.log('\n| Caso | Dove si riapre | Riparte da 0 | Nota |\n|---|---|---|---|');
for (const r of righe) console.log(`| ${r.caso} | ${r.primo} | ${r.daZero ? 'SI' : 'no'} | ${r.nota} |`);

if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log('\nTutto a posto.');
