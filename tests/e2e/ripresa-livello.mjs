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
 *   I  guardare solo l'obiettivo di un altro livello non copre quello a meta'.
 *   J  con il livello 2 a meta', «Gioca» sul livello 1 chiede conferma (collaudo 1.21.9, E1).
 *   K  «Riprova» nel menu del livello chiede conferma (collaudo 1.21.9, E2).
 *   L  con la sfida di ieri a meta', aprire quella di oggi chiede conferma.
 *   N  con una partita libera a meta', iniziarne una nuova chiede conferma da ogni strada:
 *      home, menu della partita, profilo, statistiche, festa finale (collaudo 1.21.11, H1).
 *      A zero mosse non chiede niente.
 *   O  dentro una sfida, menu -> «Nuova partita» (o «Riprendi la partita» nella domanda):
 *      la libera che si gioca e' quella che si ritrova dopo una ricarica, non la sfida
 *      (collaudo 1.21.12, I1). L'indirizzo non tiene piu' `#/sfida/<giorno>`.
 *   P  chiusa la domanda senza scegliere (Escape o tocco sul velo) il fuoco torna al
 *      pulsante che l'ha aperta: «Nuova» della home (tastiera), «Riprova» nel menu del
 *      livello, «Gioca» sull'obiettivo (collaudo 1.21.18, D1; PO-023).
 *   In J, K, L e N il tasto Indietro chiude la domanda e non perde niente; il pulsante sicuro
 *   riporta dentro la partita lasciata, l'altro fa davvero quello che si era chiesto.
 *
 * Stampa una tabella; esce con 1 se in almeno un caso si riparte da zero.
 * Uso: npm run e2e-po008
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { FINESTRA_RIPRESA } from '../../src/persistence/ripresa.js';
import { sequenzaVincente, posizioneMossa } from '../../tools/sequenza-vincente.mjs';
import { quadroNumero, TOTALE_QUADRI } from '../../src/config/quadri.js';

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
  // PO-013: il pulsante dice «Livello N», non «Riprendi il livello N» (il tocco riprende comunque).
  if (primo === 'home' && !/^LIVELLO \d+$/i.test(etichetta.trim())) errori.push(`B: il pulsante grande dice «${etichetta}» invece di «Livello N» (PO-013)`);
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
    await page.getByRole('button', { name: /^Partita libera, riprendi/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await page.waitForTimeout(500);
  }
  const dopo = await firma(page);
  registra('H introVista falso, partita libera, ricarica', { primo, prima, dopo });
  if (primo !== 'partita') errori.push(`H: con introVista falso la partita libera non si riapre da sola (si apre "${primo}")`);
  await contesto.close();
}

// ---------- I ----------
// Il livello 2 giocato a meta' non si perde se si apre soltanto l'obiettivo del livello 1.
{
  const { contesto, page } = await prepara();
  await page.evaluate(() => localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } })));
  await page.reload();
  await page.waitForSelector('.pl-home__menu');
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(1).click();
  await page.waitForTimeout(300);
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  const prima = await firma(page);
  await page.goBack();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').first().click();
  await page.waitForSelector('.pl-apertura');
  await page.waitForTimeout(400);
  const numero = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null')?.numero ?? null);
  righe.push({ caso: 'I guardo solo l obiettivo di un altro livello', primo: 'obiettivo', daZero: numero !== 2, nota: `livello salvato: ${numero}` });
  if (numero !== 2) errori.push(`I: aprire l obiettivo del livello 1 ha sovrascritto il livello 2 a meta (salvato: ${numero}; prima: «${prima}»)`);
  await contesto.close();
}

// ---------- J, K, L: le tre strade che perdevano la partita con un tocco ----------
/** La domanda di conferma, se e' a schermo: il testo e il pulsante che ha il fuoco. */
const domanda = (page) => page.evaluate(() => {
  const d = document.querySelector('[role="dialog"]');
  if (!d) return null;
  return {
    testo: d.innerText.replace(/\s+/g, ' '),
    fuoco: d.contains(document.activeElement) ? document.activeElement.innerText.trim() : '',
  };
});

/** Il fuoco deve stare sul pulsante che NON perde niente. */
function fuocoSicuro(caso, d, atteso) {
  if (d && !atteso.test(d.fuoco)) errori.push(`${caso}: il fuoco e' su «${d.fuoco}», non sul pulsante che torna indietro`);
}

// ---------- J ----------
{
  const { contesto, page } = await prepara();
  await page.evaluate(() => localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } })));
  await page.reload();
  await page.waitForSelector('.pl-home__menu');
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(1).click();
  await page.waitForTimeout(300);
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  const prima = await firma(page);
  await page.goBack();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').first().click();
  await page.waitForSelector('.pl-apertura');
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForTimeout(400);
  const d = await domanda(page);
  let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
  let dopo = '';
  if (d) {
    fuocoSicuro('J', d, /Riprendi il livello 2/);
    await page.goBack();
    await page.waitForTimeout(400);
    const dopoIndietro = await dove(page);
    if (await domanda(page) || dopoIndietro !== 'obiettivo') errori.push(`J: Indietro non chiude la domanda restando sull obiettivo (sono su "${dopoIndietro}")`);
    await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Riprendi il livello 2$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    dopo = await firma(page);
  }
  const numero = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null')?.numero ?? null);
  nota += `; livello salvato: ${numero}`;
  registra('J livello 2 a meta, «Gioca» sul livello 1', { primo: d ? 'domanda' : await dove(page), prima, dopo: d ? dopo : `${numero}`, nota });
  if (!d) errori.push(`J: «Gioca» sul livello 1 non chiede niente e il livello 2 a meta sparisce (salvato: ${numero})`);
  await contesto.close();
}

// ---------- K ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  const riprova = async () => {
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Riprova$/ }).click();
    await page.waitForTimeout(400);
  };
  await riprova();
  const d = await domanda(page);
  let dopo = await firma(page);
  let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
  if (d) {
    fuocoSicuro('K', d, /Torna alla partita/);
    await page.goBack();
    await page.waitForTimeout(400);
    dopo = await firma(page);
    if (await domanda(page) || await dove(page) !== 'partita') errori.push('K: Indietro non chiude la domanda restando nel livello');
    // Il pulsante che perde deve ricominciare davvero: una domanda che blocca e basta non e' una correzione.
    await riprova();
    await page.getByRole('button', { name: /^Sì, ricomincia da capo$/ }).click();
    await page.waitForTimeout(500);
    const ricominciato = await firma(page);
    nota += `; dopo la scelta che perde: ${ricominciato === prima ? 'NON ricomincia' : 'ricomincia'}`;
    if (ricominciato === prima) errori.push('K: il pulsante che perde non ricomincia il livello');
  }
  registra('K «Riprova» nel menu del livello', { primo: d ? 'domanda' : await dove(page), prima, dopo, nota });
  if (!d) errori.push('K: «Riprova» azzera il livello senza chiedere');
  await contesto.close();
}

// ---------- L ----------
{
  const { contesto, page } = await prepara();
  const ieri = await page.evaluate(() => {
    const g = new Date(); g.setDate(g.getDate() - 1);
    return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, '0')}-${String(g.getDate()).padStart(2, '0')}`;
  });
  // Dall'archivio, come farebbe il giocatore. Il primo del mese il giorno prima sta nel
  // mese precedente: il calendario si apre sul mese corrente, e lo si sfoglia indietro.
  await page.getByRole('button', { name: /Archivio delle sfide/ }).click();
  await page.waitForSelector('.pl-calendario');
  const cella = () => page.locator(`button.pl-giorno[aria-label^="${Number(ieri.slice(8))} "]`).first();
  if (!(await cella().count())) await page.getByRole('button', { name: /Mese precedente/ }).click().catch(() => {});
  await cella().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  const prima = await firma(page);
  await page.locator('.pl-hud__menu').click();
  await page.getByRole('button', { name: /^Torna alla home$/ }).click();
  await page.waitForSelector('.pl-home__menu');
  await page.locator('.pl-sfida-avvio--sfida').click();
  await page.waitForTimeout(400);
  const d = await domanda(page);
  let dopo = await firma(page);
  let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
  if (d) {
    fuocoSicuro('L', d, /Riprendi la sfida/);
    await page.goBack();
    await page.waitForTimeout(400);
    if (await domanda(page) || await dove(page) !== 'home') errori.push('L: Indietro non chiude la domanda restando sulla home');
    await page.locator('.pl-sfida-avvio--sfida').click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Riprendi la sfida/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    dopo = await firma(page);
  }
  const salvata = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-sfida') ?? 'null')?.seedLabel ?? null);
  nota += `; sfida salvata: ${salvata}`;
  if (d) {
    // Il pulsante che perde deve aprire davvero quella di oggi.
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
    await page.locator('.pl-sfida-avvio--sfida').click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Apri la sfida di oggi$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    const oggi = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-sfida') ?? 'null')?.seedLabel ?? null);
    nota += `; dopo la scelta che perde: ${oggi}`;
    if (oggi === ieri || await dove(page) !== 'partita') errori.push(`L: il pulsante che perde non apre la sfida di oggi (salvata: ${oggi})`);
  }
  registra('L sfida di ieri a meta, apro quella di oggi', { primo: d ? 'domanda' : await dove(page), prima, dopo, nota });
  if (!d) errori.push('L: aprire la sfida di oggi non chiede niente e quella di ieri a meta sparisce');
  await contesto.close();
}

// ---------- M ----------
// Dall'archivio, dopo la domanda, la sfida aperta tiene il suo indirizzo `#/sfida/<giorno>`.
{
  const { contesto, page } = await prepara();
  const giornoFa = (d) => page.evaluate((d) => { const g = new Date(); g.setDate(g.getDate() - d); return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, '0')}-${String(g.getDate()).padStart(2, '0')}`; }, d);
  const ieri = await giornoFa(1), altro = await giornoFa(2);
  async function apri(giorno) {
    await page.getByRole('button', { name: /Archivio delle sfide/ }).click();
    await page.waitForSelector('.pl-calendario');
    const c = () => page.locator(`button.pl-giorno[aria-label^="${Number(giorno.slice(8))} "]`).first();
    if (!(await c().count())) await page.getByRole('button', { name: /Mese precedente/ }).click().catch(() => {});
    await c().click();
    await page.waitForTimeout(400);
  }
  await apri(ieri);
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 2; i += 1) await unaMossa(page);
  await page.locator('.pl-hud__menu').click();
  await page.getByRole('button', { name: /^Torna alla home$/ }).click();
  await page.waitForSelector('.pl-home__menu');
  await apri(altro);
  await page.getByRole('button', { name: /^Riprendi la sfida/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
  const ancora = await page.evaluate(() => location.hash);
  righe.push({ caso: 'M dall archivio, dopo la domanda, l indirizzo della sfida', primo: await dove(page), daZero: false, nota: `ancora: «${ancora}»` });
  if (ancora !== `#/sfida/${ieri}`) errori.push(`M: dopo la domanda dall archivio l indirizzo e «${ancora}», atteso «#/sfida/${ieri}»`);
  await contesto.close();
}

// ---------- N ----------
// Una partita libera a meta' (due mosse) e una nuova libera chiesta da ogni strada che ne
// comincia una. Per ogni punto di partenza: c'e' la domanda, il fuoco e' su «Riprendi la
// partita», Indietro la chiude senza perdere niente, «Riprendi la partita» riporta dentro
// quella di prima. Il pulsante che perde si prova una volta (dalla home).
{
  const finestra = (page) => page.locator('[role="dialog"]');
  async function liberaAMeta(page) {
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.waitForTimeout(400);
    return firma(page);
  }
  async function allaHome(page) {
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
  }
  async function vaiDallaHome(page, voce, selettore) {
    await page.locator('.pl-home__voce', { hasText: voce }).click();
    await page.waitForTimeout(300);
    await page.waitForSelector(selettore);
  }
  // Ogni punto: come ci si arriva (dalla home, con la libera gia' a meta') e quale
  // pulsante comincia una nuova libera; `dove` e' la schermata su cui Indietro ci lascia.
  const punti = [
    { nome: 'home', arriva: async () => {}, tocca: (p) => p.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera').click(), dove: 'home' },
    { nome: 'menu della partita', arriva: async (p) => {
      await p.getByRole('button', { name: /^Partita libera, riprendi/ }).click();
      await p.waitForSelector('.pl-plancia .pl-cella');
      await p.locator('.pl-hud__menu').click();
    }, tocca: (p) => p.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click(), dove: 'partita' },
    { nome: 'profilo', arriva: (p) => vaiDallaHome(p, 'Il tuo profilo di gioco', '.pl-vuoto, .pl-schermo'),
      tocca: (p) => p.getByRole('button', { name: /^Gioca una partita$/ }).click(), dove: 'profilo' },
    { nome: 'statistiche', arriva: (p) => vaiDallaHome(p, 'Statistiche', '.pl-vuoto, .pl-schermo'),
      tocca: (p) => p.getByRole('button', { name: /^Gioca una partita$/ }).click(), dove: 'statistiche' },
  ];
  const titoloSchermo = (page) => page.evaluate(() => document.querySelector('h1, h2')?.innerText.trim() ?? '');

  for (const punto of punti) {
    const { contesto, page } = await prepara();
    const prima = await liberaAMeta(page);
    await allaHome(page);
    await punto.arriva(page);
    const titolo = await titoloSchermo(page);
    await punto.tocca(page);
    await page.waitForTimeout(400);
    const d = await domanda(page);
    let dopo = await firma(page);
    let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
    if (d) {
      fuocoSicuro(`N ${punto.nome}`, d, /^Riprendi la partita$/);
      await page.goBack();
      await page.waitForTimeout(400);
      const qui = await dove(page);
      const restaQui = punto.dove === 'home' ? qui === 'home'
        : punto.dove === 'partita' ? qui === 'partita'
          : (await titoloSchermo(page)) === titolo;
      if (await domanda(page) || !restaQui) errori.push(`N ${punto.nome}: Indietro non chiude la domanda restando dov'ero (sono su "${qui}")`);
      // Dal menu, Indietro ha chiuso la domanda: il menu si riapre per toccare di nuovo.
      if (punto.dove === 'partita' && !(await page.locator('.pl-menu').count())) await page.locator('.pl-hud__menu').click();
      await punto.tocca(page);
      await page.waitForTimeout(300);
      await finestra(page).getByRole('button', { name: /^Riprendi la partita$/ }).click();
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      dopo = await firma(page);
      if (await dove(page) !== 'partita') errori.push(`N ${punto.nome}: «Riprendi la partita» non riporta nella partita`);
    } else {
      // Senza domanda la libera a meta' e' gia' stata coperta da una nuova.
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      dopo = await firma(page);
    }
    if (d && punto.nome === 'home') {
      await allaHome(page);
      await punto.tocca(page);
      await page.waitForTimeout(300);
      await finestra(page).getByRole('button', { name: /^Nuova partita$/ }).click();
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      const nuova = await firma(page);
      nota += `; dopo «Nuova partita»: ${nuova === prima ? 'la stessa partita' : 'una partita nuova'}`;
      if (nuova === prima || await dove(page) !== 'partita') errori.push('N home: «Nuova partita» non comincia una partita nuova');
    }
    registra(`N libera a meta, nuova libera da ${punto.nome}`, { primo: d ? 'domanda' : await dove(page), prima, dopo, nota });
    if (!d) errori.push(`N ${punto.nome}: una nuova partita libera cancella quella a meta senza chiedere`);
    await contesto.close();
  }

  // Festa finale: novantanove livelli scritti come superati, la libera a meta', il
  // livello 1 vinto davvero; «Gioca in partita libera» deve chiedere.
  {
    const { contesto, page } = await prepara();
    const prima = await liberaAMeta(page);
    await allaHome(page);
    await page.evaluate((n) => {
      const livelli = {};
      for (let i = 2; i <= n; i += 1) livelli[i] = { mosse: 12, punteggio: 300, tentativi: 1 };
      localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
    }, TOTALE_QUADRI);
    await page.reload();
    await page.waitForSelector('.pl-home__menu');
    await apriLivello1DallaMappa(page);
    for (const mossa of sequenzaVincente(quadroNumero(1)) ?? []) {
      const punti = await posizioneMossa(page, mossa);
      if (!punti) break;
      await page.mouse.move(punti.px, punti.py);
      await page.mouse.down();
      await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(45);
      if (await page.locator('.pl-quadro-esito, .pl-trionfo').count() > 0) break;
    }
    await page.waitForSelector('.pl-trionfo', { timeout: 5000 }).catch(() => {});
    const festa = await page.locator('.pl-trionfo').count() > 0;
    let d = null, dopo = '', nota = '';
    if (!festa) {
      errori.push('N festa finale: non ci si arriva, il caso non prova niente');
      nota = 'festa finale non raggiunta';
    } else {
      await page.getByRole('button', { name: /^Gioca in partita libera$/ }).click();
      await page.waitForTimeout(400);
      d = await domanda(page);
      nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
      if (d) {
        fuocoSicuro('N festa finale', d, /^Riprendi la partita$/);
        await page.goBack();
        await page.waitForTimeout(400);
        if (await domanda(page) || !(await page.locator('.pl-trionfo').count())) errori.push('N festa finale: Indietro non chiude la domanda restando sulla festa');
        await page.getByRole('button', { name: /^Gioca in partita libera$/ }).click();
        await page.waitForTimeout(300);
        await finestra(page).getByRole('button', { name: /^Riprendi la partita$/ }).click();
      }
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      dopo = await firma(page);
      if (!d) errori.push('N festa finale: «Gioca in partita libera» cancella quella a meta senza chiedere');
    }
    registra('N libera a meta, nuova libera dalla festa finale', { primo: d ? 'domanda' : await dove(page), prima, dopo: festa ? dopo : prima, nota });
    await contesto.close();
  }

  // Zero mosse: niente da perdere, niente domanda.
  {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await allaHome(page);
    // PO-020: «Nuova» dentro la card; .pl-home__nuova-libera e' il collegamento di prima.
    const link = await page.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera').count();
    if (link) await page.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera').click();
    await page.waitForTimeout(400);
    const d = await domanda(page);
    const qui = await dove(page);
    righe.push({ caso: 'N libera a zero mosse, nuova libera dalla home', primo: d ? 'domanda' : qui, daZero: false, nota: `collegamento: ${link ? 'si' : 'no'}` });
    if (d) errori.push('N zero mosse: chiede conferma anche se non c e niente da perdere');
    if (link && qui !== 'partita') errori.push(`N zero mosse: la nuova partita non parte (sono su "${qui}")`);
    await contesto.close();
  }
}

// ---------- O ----------
// Dentro una sfida, menu -> «Nuova partita»: si gioca la libera e si ricarica. Si deve
// ritrovare la libera, non la sfida (collaudo 1.21.12, I1). Due strade: senza libera a
// meta' (nessuna domanda) e con la libera a meta' («Riprendi la partita» nella domanda).
// Poi Indietro: si torna alla home e la sfida non si riapre.
// Il punteggio da solo non basta a distinguere le due partite (possono coincidere):
// conta l'intestazione della sfida (`.pl-modalita--sfida`), che la libera non ha.
const modo = (page) => page.evaluate(() => (!document.querySelector('.pl-plancia') ? 'fuori'
  : document.querySelector('.pl-modalita--sfida') ? 'sfida' : 'libera'));
for (const conLibera of [false, true]) {
  const nome = conLibera ? 'O sfida, menu, Riprendi la partita (libera), ricarico' : 'O sfida, menu, Nuova partita, ricarico';
  const { contesto, page } = await prepara();
  if (conLibera) {
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
  }
  await page.locator('.pl-sfida-avvio--sfida').click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  await page.locator('.pl-hud__menu').click();
  await page.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click();
  await page.waitForTimeout(400);
  if (conLibera) {
    if (!(await domanda(page))) errori.push(`${nome}: manca la domanda`);
    else await page.locator('[role="dialog"]').getByRole('button', { name: /^Riprendi la partita$/ }).click();
    await page.waitForTimeout(400);
  } else {
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
  }
  await page.waitForTimeout(500);
  const prima = await firma(page);
  const modoPrima = await modo(page);
  const ancoraPrima = await page.evaluate(() => location.hash);
  if (modoPrima !== 'libera') errori.push(`${nome}: dopo «Nuova partita» si e' in "${modoPrima}", non nella libera`);
  await page.reload();
  await aspetta(page);
  const dopo = await firma(page);
  const modoDopo = await modo(page);
  const ancoraDopo = await page.evaluate(() => location.hash);
  await page.goBack();
  await page.waitForTimeout(700);
  const dopoIndietro = await dove(page);
  const ancoraIndietro = await page.evaluate(() => location.hash);
  registra(nome, { primo: modoDopo, prima, dopo,
    nota: `ancora prima «${ancoraPrima}», dopo «${ancoraDopo}»; Indietro: ${dopoIndietro} «${ancoraIndietro}»` });
  if (modoDopo !== 'libera') errori.push(`${nome}: dopo la ricarica si ritrova la SFIDA, non la libera`);
  if (ancoraPrima !== '') errori.push(`${nome}: nella libera l'indirizzo e' «${ancoraPrima}»`);
  if (dopoIndietro !== 'home' || ancoraIndietro !== '') errori.push(`${nome}: Indietro dopo la ricarica porta a "${dopoIndietro}" «${ancoraIndietro}»`);
  await contesto.close();
}

// ---------- P ----------
// Chiusa la domanda senza scegliere, il fuoco deve tornare al pulsante che l'ha aperta
// (collaudo 1.21.18, D1: finiva su <body> e il Tab ripartiva da «Livello 1»). Tre domande
// diverse, aperte da tre posti diversi, chiuse con Escape e col tocco sul velo.
{
  const fuocoOra = (page) => page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return '<body>';
    return (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().replace(/\s+/g, ' ');
  });
  // Un angolo del velo, fuori dalla finestra: se li' non c'e' il velo il caso non prova niente.
  async function toccaVelo(page) {
    const ok = await page.evaluate(() => document.elementFromPoint(4, 4)?.classList.contains('pl-velo'));
    if (!ok) return false;
    await page.mouse.click(4, 4);
    return true;
  }
  async function chiudiE(page, caso, come, atteso) {
    const d = await domanda(page);
    if (!d) { errori.push(`P ${caso}: la domanda non si apre, il caso non prova niente`); return ''; }
    if (come === 'Escape') await page.keyboard.press('Escape');
    else if (!(await toccaVelo(page))) { errori.push(`P ${caso}: nell'angolo non c'e' il velo`); return ''; }
    await page.waitForTimeout(300);
    if (await domanda(page)) { errori.push(`P ${caso}: ${come} non chiude la domanda`); return ''; }
    const f = await fuocoOra(page);
    if (!atteso.test(f)) errori.push(`P ${caso}, ${come}: il fuoco e' su «${f}», non sul pulsante che ha aperto la domanda`);
    return f;
  }
  const note = [];

  // Home, con la tastiera: fuoco su «Nuova», Invio, Escape; poi Invio, velo; poi Tab.
  {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
    const nuova = page.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera');
    await nuova.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    note.push(`home Esc: ${await chiudiE(page, 'home', 'Escape', /^Nuova partita libera$/)}`);
    await nuova.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    note.push(`home velo: ${await chiudiE(page, 'home', 'velo', /^Nuova partita libera$/)}`);
    await page.keyboard.press('Tab');
    const dopoTab = await fuocoOra(page);
    note.push(`Tab dopo: ${dopoTab}`);
    if (!/^Partita libera, riprendi/.test(dopoTab)) errori.push(`P home: il Tab dopo la chiusura va su «${dopoTab}», non sul pulsante dopo «Nuova»`);
    await contesto.close();
  }

  // «Riprova» nel menu del livello, Escape. Il menu si chiude con lo stesso tocco, quindi
  // «Riprova» non c'e' piu': il fuoco va al pulsante che riapre il menu.
  {
    const { contesto, page } = await prepara();
    await apriLivello1DallaMappa(page);
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Riprova$/ }).click();
    await page.waitForTimeout(400);
    note.push(`Riprova Esc: ${await chiudiE(page, 'Riprova', 'Escape', /^Menu$/)}`);
    await contesto.close();
  }

  // «Gioca» sul livello 1 con il livello 2 a meta', velo.
  {
    const { contesto, page } = await prepara();
    await page.evaluate(() => localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } })));
    await page.reload();
    await page.waitForSelector('.pl-home__menu');
    await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    await page.locator('.pl-tappa').nth(1).click();
    await page.waitForTimeout(300);
    if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.goBack();
    await page.waitForSelector('.pl-tappe');
    await page.locator('.pl-tappa').first().click();
    await page.waitForSelector('.pl-apertura');
    await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForTimeout(400);
    note.push(`Gioca velo: ${await chiudiE(page, 'Gioca', 'velo', /^Gioca$/)}`);
    await contesto.close();
  }
  righe.push({ caso: 'P chiusa la domanda senza scegliere, dove va il fuoco', primo: '-', daZero: false, nota: note.join('; ') });
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
