/**
 * La Torre per chi c'e' gia' arrivato, e la mappa per chi ci sta arrivando (PO-040).
 *
 * Tre decisioni del collaudo 1.22.0 (`docs/sviluppo/COLLAUDO-1.22.0.md`), provate nel
 * gioco vero con i progressi scritti nella memoria del browser come li scrive il gioco:
 *
 *  O1  Ponte finito (100 su 100) e nessun livello della Torre superato: la home mostra
 *      UNA VOLTA la finestra «La Torre è aperta...» con «Entra nella Torre», che apre la
 *      mappa sulla scheda della Torre. Non torna ricaricando, non torna dopo «Non ora»,
 *      non compare a chi ha gia' superato un livello della Torre, ne' a chi il Ponte lo
 *      finisce giocando (li' c'e' la festa del Ponte), e viaggia con il salvataggio
 *      («Sostituisci tutto» porta le impostazioni).
 *  O2  La fila delle schede «Ponte / Torre» resta in cima mentre la mappa si apre sul
 *      livello corrente, in tutti i formati di `e2e-schermi` (anche coricati e col testo
 *      x2) e nei telefoni; la scheda chiusa dice quanti livelli mancano; le frecce
 *      spostano la scelta fra le schede.
 *  O3  Sull'opera chiusa gli atti non dicono «Si apre quando arrivi al livello 101».
 *
 * Interruttori: AVVISO_TORRE (App.jsx), SCHEDE_FISSE e ATTI_SENZA_RIGA_SE_CHIUSA
 * (Quadri.jsx). Ciascuno spento fa rossa questa prova.
 *
 * Uso: npm run e2e-torre-aperta
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { OPERE, livelliDellOpera, quadroNumero } from '../../src/config/quadri.js';
import { traduttore } from '../../src/i18n/index.js';
import { impronta } from '../../src/persistence/salvataggio.js';
import { posizioneMossa } from '../../tools/sequenza-vincente.mjs';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../src/core/quadro.js';
import { createRng, seedFromString } from '../../src/core/rng.js';
import { preferenze, scegliMossa } from '../../src/sim/giocatore-quadri.mjs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', PERCORSO_NOTO].find((p) => p && existsSync(p));
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-torre-aperta';
await mkdir(OUT, { recursive: true });

const errori = [];
const it = traduttore('it');
const en = traduttore('en');
const PONTE = OPERE[0];
const TORRE = OPERE.find((o) => o.id === 'torre');

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

const vinto = (n) => ({ mosse: 12, punteggio: 300, tentativi: 1 });
const da = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const ponteFinito = () => da(PONTE.da, PONTE.a);

/** Una pagina con i livelli `superati` gia' vinti e le impostazioni indicate. */
async function apri({ superati = [], lingua = 'it', viewport = { width: 360, height: 640 }, impostazioni = {}, tocco = false } = {}) {
  const contesto = await browser.newContext({
    viewport, locale: lingua === 'it' ? 'it-IT' : 'en-GB', hasTouch: tocco, isMobile: tocco,
  });
  const page = await contesto.newPage();
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ numeri, lingua: l, extra }) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      versione: 2, introVista: true, lingua: l, animazioni: false, ...extra,
    }));
    const livelli = {};
    for (const n of numeri) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
  }, { numeri: superati, lingua, extra: impostazioni });
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  await page.waitForTimeout(250);
  return { contesto, page };
}

const finestra = (page) => page.locator('[role="dialog"]');
const leggiImpostazioni = (page) => page.evaluate(() => JSON.parse(window.localStorage.getItem('plinto:settings') ?? '{}'));

// ---------- O1 ----------
for (const [lingua, t] of [['it', it], ['en', en]]) {
  console.log(`O1 (${lingua}). Ponte finito, Torre a zero: la finestra compare una volta, «${t('trionfo.vai.torre')}» apre la Torre...`);
  const { contesto, page } = await apri({ superati: ponteFinito(), lingua });
  const quante = await finestra(page).count();
  const testo = quante ? await finestra(page).innerText() : '';
  await page.screenshot({ path: `${OUT}/o1-avviso-${lingua}.png` });
  if (quante !== 1) errori.push(`O1 (${lingua}): con il Ponte finito la finestra della Torre non compare (trovate ${quante})`);
  else if (!testo.includes(t('avvisoTorre.testo'))) errori.push(`O1 (${lingua}): la finestra non dice «${t('avvisoTorre.testo')}»: «${testo}»`);
  const segnato = (await leggiImpostazioni(page)).avvisoTorre;
  if (quante && segnato !== true) errori.push(`O1 (${lingua}): mostrata, ma «avvisoTorre» nelle impostazioni e' ${segnato}`);
  if (quante) {
    // Il fuoco sta sul pulsante pieno, come in tutte le finestre del gioco.
    const fuoco = await page.evaluate(() => document.activeElement?.textContent);
    if (fuoco !== t('trionfo.vai.torre')) errori.push(`O1 (${lingua}): il fuoco e' su «${fuoco}», non su «${t('trionfo.vai.torre')}»`);
    await page.getByRole('button', { name: t('trionfo.vai.torre') }).click();
    await page.waitForSelector('.pl-tappe');
    const scelta = await page.locator('[role="tab"][aria-selected="true"]').innerText();
    if (!scelta.includes(t('opere.torre'))) errori.push(`O1 (${lingua}): «${t('trionfo.vai.torre')}» apre la mappa su «${scelta}», non sulla Torre`);
    await page.screenshot({ path: `${OUT}/o1-mappa-torre-${lingua}.png` });
  }
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  await page.waitForTimeout(250);
  if (await finestra(page).count()) errori.push(`O1 (${lingua}): ricaricando la finestra della Torre ricompare`);
  await contesto.close();
}

console.log('O1. «Non ora» la chiude, e non torna (nemmeno andando e tornando dalla mappa)...');
{
  const { contesto, page } = await apri({ superati: ponteFinito() });
  if (!(await finestra(page).count())) errori.push('O1 «Non ora»: la finestra non compare: la prova non prova nulla');
  else {
    await page.getByRole('button', { name: it('avvisoTorre.nonOra') }).click();
    if (await finestra(page).count()) errori.push('O1: «Non ora» non chiude la finestra');
    await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    await page.getByRole('button', { name: 'Indietro' }).first().click();
    await page.waitForSelector('.pl-home__menu');
    await page.waitForTimeout(250);
    if (await finestra(page).count()) errori.push('O1: dopo «Non ora» la finestra torna rientrando in home');
  }
  await contesto.close();
}

console.log('O1. Chi ha gia\' superato il 101, o il Ponte non l\'ha finito, non la vede...');
for (const [nome, superati] of [['101 superato', [...ponteFinito(), 101]], ['99 su 100', da(1, 99)], ['nessun livello', []]]) {
  const { contesto, page } = await apri({ superati });
  if (await finestra(page).count()) errori.push(`O1 (${nome}): la finestra della Torre compare, e non doveva`);
  await contesto.close();
}

console.log('O1. Le impostazioni viaggiano col salvataggio: «Sostituisci tutto» con avvisoTorre gia\' visto...');
{
  const livelli = Object.fromEntries(ponteFinito().map((n) => [n, vinto(n)]));
  const dati = {
    quadri: { versione: 1, livelli },
    settings: { versione: 2, introVista: true, lingua: 'it', avvisoTorre: true },
  };
  const file = `${OUT}/o1-salvataggio.json`;
  writeFileSync(file, JSON.stringify({ gioco: 'plinto', formato: 1, versioneGioco: '1.22.1', impronta: impronta(dati), dati }));
  const { contesto, page } = await apri({ superati: [] });
  await page.getByRole('button', { name: 'Impostazioni' }).click();
  const [scelta] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /Scegli un file/ }).click(),
  ]);
  await scelta.setFiles(file);
  await page.getByRole('button', { name: /^Sostituisci tutto/ }).click();
  await page.getByRole('button', { name: /^Sì$/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Indietro' }).first().click();
  await page.waitForSelector('.pl-home__menu');
  await page.waitForTimeout(250);
  const home = await page.locator('.pl-home').innerText();
  if (!/LIVELLO 101/i.test(home)) errori.push('O1 salvataggio: dopo l importazione la home non porta al 101: la prova non prova nulla');
  if (await finestra(page).count()) errori.push('O1 salvataggio: importato «avvisoTorre: true» con Sostituisci, la finestra compare lo stesso');
  // E il contrario: l'esportazione porta il campo.
  const esportato = await page.evaluate(async () => {
    const m = await import('/src/persistence/salvataggio.js');
    return m.componiSalvataggio({ versioneGioco: 'prova' }).dati.settings;
  }).catch(() => null);
  if (esportato && esportato.avvisoTorre !== true) errori.push(`O1 salvataggio: il file esportato non porta «avvisoTorre»: ${JSON.stringify(esportato)}`);
  await contesto.close();
}

/** Le mosse che vincono un livello: lo stesso giocatore e gli stessi semi di `npm run livelli`. */
function lineaVincente(quadro) {
  for (let s = 0; s < 20; s += 1) {
    const rng = createRng(seedFromString(`prova-${quadro.numero}-${s}`));
    const pref = preferenze(quadro);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    for (let m = 0; m < (quadro.maxMosse ?? 300); m += 1) {
      if (statoQuadro(quadro, partita).finito) break;
      const mossa = scegliMossa(partita, pref, rng);
      if (!mossa) break;
      partita = giocaNelQuadro(quadro, partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
      mosse.push({ handIndex: mossa.handIndex, row: mossa.row, col: mossa.col });
    }
    if (statoQuadro(quadro, partita).completato) return mosse;
  }
  return null;
}

console.log('O1. Chi finisce il Ponte giocando vede la festa del Ponte, e poi in home nessuna finestra...');
{
  const { contesto, page } = await apri({ superati: da(1, 99), viewport: { width: 412, height: 915 } });
  await page.getByRole('button', { name: /^Livello 100$/i }).click();
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  const mosse = lineaVincente(quadroNumero(100));
  if (!mosse) errori.push('O1 festa: il motore non supera il 100: la prova non prova nulla');
  for (const mossa of mosse ?? []) {
    const punti = await posizioneMossa(page, mossa);
    if (!punti) break;
    await page.mouse.move(punti.px, punti.py);
    await page.mouse.down();
    await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(45);
    if (await page.locator('.pl-trionfo, .pl-quadro-esito, .pl-pausa-fine').count() > 0) break;
  }
  await page.waitForSelector('.pl-trionfo', { timeout: 6000 }).catch(() => {});
  if (!(await page.locator('.pl-trionfo').count())) errori.push('O1 festa: vinto il 100, la festa del Ponte non compare: la prova non prova nulla');
  else {
    const segnato = (await leggiImpostazioni(page)).avvisoTorre;
    if (segnato !== true) errori.push(`O1 festa: la festa del Ponte non segna l avviso come visto (avvisoTorre = ${segnato})`);
    await page.getByRole('button', { name: it('quadri.elenco') }).click();
    await page.waitForSelector('.pl-tappe');
    await page.getByRole('button', { name: 'Indietro' }).first().click();
    await page.waitForSelector('.pl-home__menu');
    await page.waitForTimeout(250);
    if (await finestra(page).count()) errori.push('O1 festa: dopo la festa del Ponte la home mostra anche la finestra della Torre (due volte)');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.pl-home__menu');
    await page.waitForTimeout(250);
    if (await finestra(page).count()) errori.push('O1 festa: dopo la festa del Ponte, ricaricando, compare la finestra della Torre');
  }
  await contesto.close();
}

// ---------- O2 e O3 ----------
/*
 * I formati: quelli di `tests/e2e/schermi.mjs` (tablet e PC, coricati, testo x2) piu' i
 * telefoni del collaudo. Il testo x2 e' la stessa simulazione di schermi.mjs: ogni
 * `font-size` dei fogli di stile per due.
 */
const FORMATI = [
  ...[[360, 640], [412, 915], [320, 700], [375, 667]].map(([w, h]) => ({ nome: `telefono ${w}x${h}`, w, h, tocco: true })),
  ...[[768, 1024], [1024, 768], [1024, 1366], [1366, 1024]].flatMap(([w, h]) => [
    { nome: `tablet ${w}x${h}`, w, h, tocco: false }, { nome: `tablet ${w}x${h} tocco`, w, h, tocco: true }]),
  ...[[1366, 768], [1920, 1080], [1280, 720], [1366, 657], [1920, 969]].map(([w, h]) => ({ nome: `PC ${w}x${h}`, w, h, tocco: false })),
  ...[[640, 360], [800, 360], [915, 412], [1024, 600], [1280, 620]].map(([w, h]) => ({ nome: `orizzontale ${w}x${h}`, w, h, tocco: true })),
  ...[[360, 800], [412, 915]].map(([w, h]) => ({ nome: `testo x2 ${w}x${h}`, w, h, tocco: true, testoDoppio: true })),
];
function scalaTesto(f) {
  const molt = (v) => v.replace(/(-?\d*\.?\d+)px/g, (_, n) => `${(Number(n) * f).toFixed(2)}px`);
  const giro = (regole) => {
    for (const r of regole) {
      if (r.style && r.style.fontSize) r.style.fontSize = molt(r.style.fontSize);
      if (r.style && r.style.font) r.style.font = molt(r.style.font);
      if (r.cssRules) giro(r.cssRules);
    }
  };
  for (const s of document.styleSheets) { try { giro(s.cssRules); } catch { /* altro dominio */ } }
}

/** Dove stanno schede, testata, tappa corrente e scorrimento, letti dal browser. */
const misura = (page) => page.evaluate(() => {
  const r = (el) => (el ? el.getBoundingClientRect() : null);
  const scroll = document.querySelector('.pl-scroll');
  const lista = r(document.querySelector('.pl-opere'));
  const testata = r(document.querySelector('.pl-pagina__testata'));
  const qui = r(document.querySelector('.pl-tappa--qui'));
  const cornice = r(scroll);
  return {
    schede: lista && { top: Math.round(lista.top), bottom: Math.round(lista.bottom), w: Math.round(lista.width) },
    testata: testata && Math.round(testata.bottom),
    qui: qui && { top: Math.round(qui.top), bottom: Math.round(qui.bottom) },
    scroll: scroll ? Math.round(scroll.scrollTop) : null,
    fondo: cornice ? Math.round(cornice.bottom) : null,
    sporge: document.documentElement.scrollWidth > window.innerWidth,
    chiusa: document.querySelector('.pl-opere__scheda--chiusa')?.innerText.replace(/\s+/g, ' ') ?? '',
  };
});

console.log(`O2. 57 livelli del Ponte superati, ${FORMATI.length} formati: le schede restano in vista, la scheda chiusa dice «mancano 43 livelli»...`);
const misure = [];
for (const formato of FORMATI) {
  const { contesto, page } = await apri({ superati: da(1, 57), viewport: { width: formato.w, height: formato.h }, tocco: formato.tocco });
  if (formato.testoDoppio) await page.evaluate(scalaTesto, 2);
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.waitForTimeout(200);
  const m = await misura(page);
  misure.push({ formato: formato.nome, ...m });
  const nome = formato.nome;
  if (!m.schede) errori.push(`O2 ${nome}: le schede non ci sono`);
  else {
    // In vista: sotto la testata della pagina, e dentro lo schermo.
    if (m.schede.top < m.testata - 1 || m.schede.bottom > formato.h) {
      errori.push(`O2 ${nome}: all'apertura le schede non si vedono (da ${m.schede.top} a ${m.schede.bottom} px, testata fino a ${m.testata})`);
    }
    if (m.scroll <= 0 && !formato.testoDoppio) avvisoScroll(nome, m);
    if (m.qui && (m.qui.top < m.schede.bottom || m.qui.bottom > m.fondo + 1)) {
      errori.push(`O2 ${nome}: il livello corrente (${m.qui.top}-${m.qui.bottom}) e' coperto dalle schede (fino a ${m.schede.bottom}) o fuori (fondo ${m.fondo})`);
    }
  }
  if (!/mancano 43 livelli/.test(m.chiusa)) errori.push(`O2 ${nome}: la scheda chiusa dice «${m.chiusa}», non «mancano 43 livelli»`);
  if (m.sporge) errori.push(`O2 ${nome}: la pagina sporge di lato`);
  // Scorrendo fino in fondo le schede restano dove sono.
  await page.evaluate(() => { const s = document.querySelector('.pl-scroll'); s.scrollTop = s.scrollHeight; });
  await page.waitForTimeout(100);
  const giu = await misura(page);
  if (giu.schede && (giu.schede.top < giu.testata - 1 || giu.schede.top > m.testata + 12)) {
    errori.push(`O2 ${nome}: in fondo alla mappa le schede sono a ${giu.schede.top} px (testata ${giu.testata})`);
  }
  if (['telefono 360x640', 'orizzontale 640x360', 'testo x2 360x800', 'PC 1366x768'].includes(nome)) {
    await page.evaluate(() => { const s = document.querySelector('.pl-scroll'); s.scrollTop = 0; document.querySelector('.pl-tappa--qui')?.scrollIntoView({ block: 'center' }); });
    await page.screenshot({ path: `${OUT}/o2-${nome.replace(/\s+/g, '-')}.png` });
  }
  await contesto.close();
}
function avvisoScroll(nome, m) {
  // Con la mappa abbastanza alta da starci tutta non scorre niente: allora le schede si
  // vedono comunque, e non e' un errore.
  console.log(`  ${nome}: la mappa non scorre all'apertura (scrollTop ${m.scroll})`);
}
console.log('  misure (schede top-bottom / testata / tappa corrente / scrollTop):');
for (const m of misure) console.log(`  ${m.formato.padEnd(26)} ${m.schede?.top}-${m.schede?.bottom} / ${m.testata} / ${m.qui?.top}-${m.qui?.bottom} / ${m.scroll}`);

console.log('O2. La scheda chiusa dice «manca 1 livello» con 99 su 100, e in inglese «43 levels to go»...');
{
  const { contesto, page } = await apri({ superati: da(1, 99) });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  const chiusa = (await misura(page)).chiusa;
  if (!/manca 1 livello/.test(chiusa)) errori.push(`O2: con 99 su 100 la scheda chiusa dice «${chiusa}»`);
  await contesto.close();
}
{
  const { contesto, page } = await apri({ superati: da(1, 57), lingua: 'en' });
  await page.getByRole('button', { name: /^Level map/ }).click();
  await page.waitForSelector('.pl-tappe');
  const chiusa = (await misura(page)).chiusa;
  if (!/43 levels to go/.test(chiusa)) errori.push(`O2 (en): la scheda chiusa dice «${chiusa}»`);
  await contesto.close();
}

console.log('O2. Tastiera: Tab arriva alla scheda scelta, le frecce cambiano scheda e spostano il fuoco...');
{
  const { contesto, page } = await apri({ superati: da(1, 57), viewport: { width: 1366, height: 768 } });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  const tabindex = await page.locator('[role="tab"]').evaluateAll((els) => els.map((e) => e.tabIndex));
  if (tabindex.filter((x) => x === 0).length !== 1) errori.push(`O2 tastiera: le schede raggiungibili con Tab sono ${tabindex.filter((x) => x === 0).length}, non 1 (${tabindex})`);
  await page.locator('[role="tab"][aria-selected="true"]').focus();
  const leggi = () => page.evaluate(() => ({
    scelta: document.querySelector('[role="tab"][aria-selected="true"]')?.innerText.split('\n')[0],
    fuoco: document.activeElement?.getAttribute('role') === 'tab' ? document.activeElement.innerText.split('\n')[0] : null,
    titolo: document.querySelector('.pl-pagina__titolo')?.innerText,
  }));
  await page.keyboard.press('ArrowRight');
  const destra = await leggi();
  if (destra.scelta !== 'La Torre' || destra.fuoco !== 'La Torre' || destra.titolo?.toLowerCase() !== 'la torre') errori.push(`O2 tastiera: freccia a destra -> ${JSON.stringify(destra)}`);
  await page.keyboard.press('ArrowLeft');
  const sinistra = await leggi();
  if (sinistra.scelta !== 'Il Ponte' || sinistra.fuoco !== 'Il Ponte') errori.push(`O2 tastiera: freccia a sinistra -> ${JSON.stringify(sinistra)}`);
  await page.keyboard.press('End');
  const fine = await leggi();
  if (fine.scelta !== 'La Torre') errori.push(`O2 tastiera: Fine -> ${JSON.stringify(fine)}`);
  await page.keyboard.press('Home');
  const inizio = await leggi();
  if (inizio.scelta !== 'Il Ponte') errori.push(`O2 tastiera: Inizio -> ${JSON.stringify(inizio)}`);
  await contesto.close();
}

console.log('O3. Torre chiusa: nessun atto dice «Si apre quando arrivi al livello...»; Torre aperta: gli atti chiusi lo dicono ancora...');
{
  const { contesto, page } = await apri({ superati: da(1, 57) });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.getByRole('tab', { name: /La Torre/ }).click();
  await page.waitForTimeout(150);
  const righe = await page.locator('.pl-atto__obiettivo').allInnerTexts();
  const riquadro = await page.locator('.pl-opera-chiusa').innerText().catch(() => '');
  await page.screenshot({ path: `${OUT}/o3-torre-chiusa-360x640.png`, fullPage: false });
  if (!/Te ne mancano 43/.test(riquadro)) errori.push(`O3: il riquadro della Torre chiusa non dice «Te ne mancano 43»: «${riquadro}»`);
  const doppie = righe.filter((r) => /Si apre quando arrivi/.test(r));
  if (doppie.length) errori.push(`O3: sulla Torre chiusa ${doppie.length} atti dicono ancora «${doppie[0]}»`);
  await contesto.close();
}
{
  const { contesto, page } = await apri({ superati: ponteFinito(), impostazioni: { avvisoTorre: true } });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  const righe = await page.locator('.pl-atto__obiettivo').allInnerTexts();
  const secondo = TORRE.atti?.[1]?.da ?? null;
  if (!righe.some((r) => /Si apre quando arrivi al livello \d+/.test(r))) {
    errori.push(`O3: con la Torre aperta gli atti chiusi non dicono piu' da quale livello si aprono (${secondo ?? '?'}): ${JSON.stringify(righe)}`);
  }
  await contesto.close();
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log(`\nTutto a posto: avviso della Torre una volta sola, schede in vista in ${FORMATI.length} formati, opera chiusa senza righe doppie.`);
