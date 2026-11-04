/**
 * PO-041: «Strano avevo terminato il ponte, c'e' qualcosa che non va».
 *
 * Sul telefono del PO (1.22.0) il Ponte era finito e la Torre aperta, ma il pulsante
 * grande della home diceva «Livello 100»: il 100, gia' vinto, era stato riaperto e
 * lasciato, e il pulsante preferisce il livello lasciato a meta' (PO-008) senza dire
 * «Riprendi» (PO-013). Qui la memoria del browser e' scritta come la scrive il gioco:
 * i progressi in `plinto:quadri`, il livello a meta' in `plinto:partita-quadro`.
 *
 *   A  Ponte finito, livello 100 a meta': il pulsante dice «Livello 101» e lo apre;
 *      la partita del 100 resta salvata (si riprende dalla mappa).
 *   B  livello 11 a meta' NON superato, livello corrente 13: il pulsante dice ancora
 *      «Livello 11» (PO-008 non cambia per i livelli da superare).
 *   C  livello corrente a meta': «Livello 11», come prima.
 *   D  (PO-042, collaudo 1.22.1 D1) Ponte finito e 100 a meta', poi Impostazioni ->
 *      «incolla qui» -> salvataggio con i livelli 1-10 -> «Leggi» -> «Sostituisci tutto»
 *      -> «Sì»: il 100 adesso e' chiuso. Il pulsante dice «Livello 11» e apre l'11;
 *      ricaricando con la ripresa automatica ancora valida non si riapre il 100.
 *   E  (PO-043) Ponte finito, 100 a meta' con una mossa, «Gioca» sul 101: nella domanda
 *      il pulsante pieno, primo e con il fuoco, e' «Gioca il livello 101»; «Riprendi il
 *      livello 100» e' il secondo, trasparente. In italiano e in inglese, per nome
 *      accessibile. E2: con l'11 a meta' NON superato e «Gioca» sul 13 (dalla mappa) la
 *      domanda resta com'era: pieno, primo e con il fuoco «Riprendi il livello 11».
 *
 * Interruttori: SOSPESO_SOLO_SE_DA_SUPERARE (App.jsx): spento, A e' rosso.
 * RIPRENDI_SOLO_SE_APERTO (useQuadro.js): spento, D e' rosso.
 * GIOCA_PIENO_SE_SUPERATO (App.jsx): spento, E e' rosso (E2 resta verde).
 *
 * Uso: npm run e2e-po041
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { OPERE, quadroNumero } from '../../src/config/quadri.js';
import { iniziaQuadro } from '../../src/core/quadro.js';
import { serializeGame } from '../../src/core/engine.js';
import { allPlacements } from '../../src/core/grid.js';
import { giocaNelQuadro } from '../../src/core/quadro.js';
import { impronta } from '../../src/persistence/salvataggio.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', PERCORSO_NOTO].find((p) => p && existsSync(p));
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

const errori = [];
const PONTE = OPERE[0];
const da = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

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
  if (!(await serverRisponde())) { console.error('Impossibile avviare il server su', INDIRIZZO); process.exit(1); }
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });

/** Il livello `numero` lasciato a meta', come lo scrive useQuadro.js (partita in corso). */
const voceAMeta = (numero, conUnaMossa = false) => {
  const quadro = quadroNumero(numero);
  let partita = iniziaQuadro(quadro, { now: 0 });
  if (conUnaMossa) {
    // Una mossa vera, con il motore: la domanda di PO-008 compare solo con delle mosse.
    const [row, col] = allPlacements(partita.grid, partita.hand[0].shape)[0];
    partita = giocaNelQuadro(quadro, partita, 0, row, col, 1000);
  }
  return { numero, partita: serializeGame(partita), presentazione: false };
};

async function apri(superati, aMeta, { lingua = 'it', conUnaMossa = false } = {}) {
  const contesto = await browser.newContext({ viewport: { width: 360, height: 640 }, locale: lingua === 'it' ? 'it-IT' : 'en-GB' });
  const page = await contesto.newPage();
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ numeri, voce, lingua: l }) => {
    window.localStorage.clear();
    // avvisoTorre: la finestra della Torre (PO-040) e' gia' stata vista: qui conta il pulsante.
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      versione: 2, introVista: true, lingua: l, animazioni: false, avvisoTorre: true,
    }));
    const livelli = {};
    for (const n of numeri) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
    window.localStorage.setItem('plinto:partita-quadro', JSON.stringify(voce));
  }, { numeri: superati, voce: voceAMeta(aMeta, conUnaMossa), lingua });
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  await page.waitForTimeout(250);
  return { contesto, page };
}

const pulsante = (page) => page.locator('.pl-home__azioni .pl-btn--primario').first();
const salvato = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null')?.numero ?? null);

// ---------- A ----------
{
  const { contesto, page } = await apri(da(PONTE.da, PONTE.a), PONTE.a);
  const scritta = (await pulsante(page).textContent()).trim();
  const atteso = `Livello ${PONTE.a + 1}`;
  console.log(`A. Ponte finito, ${PONTE.a} a meta': il pulsante dice «${scritta}» (atteso «${atteso}»)`);
  if (scritta !== atteso) errori.push(`A: il pulsante dice «${scritta}» invece di «${atteso}»`);
  if ((await salvato(page)) !== PONTE.a) errori.push(`A: la partita del ${PONTE.a} non e' piu' salvata dopo l'avvio`);
  await pulsante(page).click();
  await page.waitForSelector('.pl-apertura, .pl-plancia', { timeout: 5000 }).catch(() => {});
  const testo = await page.evaluate(() => document.body.innerText);
  const aperto = /Livello\s+101\b/i.test(testo);
  console.log(`A. toccandolo si apre il livello 101: ${aperto}`);
  if (!aperto) errori.push(`A: il pulsante non apre il livello 101: «${testo.replace(/\s+/g, ' ').slice(0, 160)}»`);
  await contesto.close();
}

// ---------- B ----------
{
  const { contesto, page } = await apri([...da(1, 10), 12], 11);
  const scritta = (await pulsante(page).textContent()).trim();
  console.log(`B. 11 a meta' da superare, corrente 13: il pulsante dice «${scritta}» (atteso «Livello 11»)`);
  if (scritta !== 'Livello 11') errori.push(`B: il pulsante dice «${scritta}» invece di «Livello 11» (PO-008)`);
  await contesto.close();
}

// ---------- C ----------
{
  const { contesto, page } = await apri(da(1, 10), 11);
  const scritta = (await pulsante(page).textContent()).trim();
  console.log(`C. corrente 11 a meta': il pulsante dice «${scritta}» (atteso «Livello 11»)`);
  if (scritta !== 'Livello 11') errori.push(`C: il pulsante dice «${scritta}» invece di «Livello 11»`);
  await contesto.close();
}

// ---------- D ----------
{
  // Il salvataggio con i livelli 1-10, scritto come lo scrive «Copia il testo».
  const livelli = Object.fromEntries(da(1, 10).map((n) => [n, { mosse: 12, punteggio: 300, tentativi: 1 }]));
  const dati = {
    quadri: { versione: 1, livelli },
    settings: { versione: 2, introVista: true, lingua: 'it', animazioni: false, avvisoTorre: true },
  };
  const testoFile = JSON.stringify({ gioco: 'plinto', formato: 1, versioneGioco: 'prova', impronta: impronta(dati), dati });

  const { contesto, page } = await apri(da(PONTE.da, PONTE.a), PONTE.a);
  const prima = (await pulsante(page).textContent()).trim();
  if (prima !== `Livello ${PONTE.a + 1}`) errori.push(`D: prima dell'importazione il pulsante dice «${prima}»: la prova non parte dal caso giusto`);
  await page.getByRole('button', { name: /^Impostazioni/ }).click();
  await page.getByRole('button', { name: /incolla qui/i }).click();
  await page.locator('textarea').fill(testoFile);
  await page.getByRole('button', { name: /^Leggi$/ }).click();
  await page.getByRole('button', { name: /^Sostituisci tutto/ }).click();
  await page.getByRole('button', { name: /^Sì$/ }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: 'Indietro' }).first().click();
  await page.waitForSelector('.pl-home__menu');
  await page.waitForTimeout(250);
  const scritta = (await pulsante(page).textContent()).trim();
  console.log(`D. Sostituisci con 1-10, ${PONTE.a} a meta' e chiuso: il pulsante dice «${scritta}» (atteso «Livello 11»)`);
  if (scritta !== 'Livello 11') errori.push(`D: il pulsante dice «${scritta}» invece di «Livello 11»`);

  // La ripresa automatica come la lascia una mossa fatta da poco nel 100 (ripresa.js).
  await page.evaluate((n) => localStorage.setItem('plinto:ripresa', JSON.stringify({ dove: 'quadro', quadro: n, quando: Date.now() })), PONTE.a);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu, .pl-apertura, .pl-plancia', { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  const inHome = await page.locator('.pl-home__menu').count() > 0;
  const dopo = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 160));
  console.log(`D. ricaricando con la ripresa del ${PONTE.a} ancora valida si resta in home: ${inHome}`);
  if (!inHome) errori.push(`D: ricaricando si e' riaperto da solo un livello chiuso: «${dopo}»`);

  if (inHome) {
    await pulsante(page).click();
    await page.waitForSelector('.pl-apertura, .pl-plancia', { timeout: 5000 }).catch(() => {});
    const testo = await page.evaluate(() => document.body.innerText);
    const undici = /Livello\s+11\b/i.test(testo) && !/Livello\s+100\b/i.test(testo);
    console.log(`D. toccandolo si apre il livello 11: ${undici}`);
    if (!undici) errori.push(`D: il pulsante non apre il livello 11: «${testo.replace(/\s+/g, ' ').slice(0, 160)}»`);
  }
  await contesto.close();
}

// ---------- E ----------
/**
 * Apre il livello `nuovo` dal pulsante grande, tocca «Gioca» e legge la domanda: i due
 * pulsanti in ordine, quale e' pieno e chi ha il fuoco.
 */
async function domanda(superati, aMeta, lingua) {
  const { contesto, page } = await apri(superati, aMeta, { lingua, conUnaMossa: true });
  await pulsante(page).click();
  await page.waitForSelector('.pl-apertura', { timeout: 5000 });
  await page.locator('.pl-apertura .pl-btn--primario').first().click();
  await page.waitForSelector('.pl-azzera--perdita', { timeout: 5000 }).catch(() => {});
  const pulsanti = await page.locator('.pl-azzera--perdita .pl-azzera__scelte button').evaluateAll((bb) => bb.map((b) => ({
    nome: b.textContent.trim(),
    pieno: !b.classList.contains('pl-btn--fantasma'),
    fuoco: document.activeElement === b,
  })));
  // Il nome accessibile, come lo legge un lettore di schermo.
  const nomi = await Promise.all([0, 1].map(async (i) => {
    const b = page.locator('.pl-azzera--perdita .pl-azzera__scelte button').nth(i);
    return (await b.count()) ? (await b.evaluate((el) => el.getAttribute('aria-label') ?? el.textContent)).trim() : null;
  }));
  return { contesto, page, pulsanti, nomi };
}

const ETICHETTE = {
  it: { gioca: (n) => `Gioca il livello ${n}`, riprendi: (n) => `Riprendi il livello ${n}` },
  en: { gioca: (n) => `Play level ${n}`, riprendi: (n) => `Resume level ${n}` },
};

for (const lingua of ['it', 'en']) {
  const e = ETICHETTE[lingua];
  {
    const { contesto, page, pulsanti, nomi } = await domanda(da(PONTE.da, PONTE.a), PONTE.a, lingua);
    const nuovo = PONTE.a + 1;
    console.log(`E (${lingua}). 100 superato a meta', «Gioca» sul ${nuovo}: ${JSON.stringify(pulsanti)}`);
    const [primo, secondo] = pulsanti;
    if (pulsanti.length !== 2) errori.push(`E ${lingua}: la domanda non ha due pulsanti (${pulsanti.length})`);
    else {
      if (primo.nome !== e.gioca(nuovo) || nomi[0] !== e.gioca(nuovo)) errori.push(`E ${lingua}: il primo pulsante e' «${primo.nome}» invece di «${e.gioca(nuovo)}»`);
      if (!primo.pieno) errori.push(`E ${lingua}: «${primo.nome}» non e' il pulsante pieno`);
      if (!primo.fuoco) errori.push(`E ${lingua}: il fuoco non e' su «${primo.nome}»`);
      if (secondo.nome !== e.riprendi(PONTE.a) || secondo.pieno) errori.push(`E ${lingua}: il secondo pulsante e' «${secondo.nome}» (pieno: ${secondo.pieno}) invece di «${e.riprendi(PONTE.a)}» trasparente`);
      // Il pulsante pieno fa quello che dice: si gioca il 101, la partita del 100 si perde.
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const salvatoOra = await salvato(page);
      if (salvatoOra !== nuovo) errori.push(`E ${lingua}: Invio sul pulsante pieno non gioca il ${nuovo} (salvato: ${salvatoOra})`);
    }
    await contesto.close();
  }
  {
    // E2: l'11 a meta' NON superato (corrente 13): il pulsante va sull'11 (caso B), quindi
    // il 13 si apre dalla mappa, come farebbe il giocatore.
    const { contesto, page } = await apri([...da(1, 10), 12], 11, { lingua, conUnaMossa: true });
    await page.getByRole('button', { name: lingua === 'it' ? /^Mappa dei livelli/ : /^Level map/ }).click();
    const tappa = page.locator(`.pl-tappa[aria-label^="${lingua === 'it' ? 'Livello' : 'Level'} 13:"]`);
    await tappa.scrollIntoViewIfNeeded();
    await tappa.click();
    await page.waitForSelector('.pl-apertura', { timeout: 5000 });
    await page.locator('.pl-apertura .pl-btn--primario').first().click();
    await page.waitForSelector('.pl-azzera--perdita', { timeout: 5000 }).catch(() => {});
    const pulsanti = await page.locator('.pl-azzera--perdita .pl-azzera__scelte button').evaluateAll((bb) => bb.map((b) => ({
      nome: b.textContent.trim(), pieno: !b.classList.contains('pl-btn--fantasma'), fuoco: document.activeElement === b,
    })));
    console.log(`E2 (${lingua}). 11 a meta' NON superato, «Gioca» sul 13: ${JSON.stringify(pulsanti)}`);
    const [primo, secondo] = pulsanti;
    if (pulsanti.length !== 2) errori.push(`E2 ${lingua}: la domanda non compare (${pulsanti.length} pulsanti)`);
    else {
      if (primo.nome !== e.riprendi(11) || !primo.pieno || !primo.fuoco) errori.push(`E2 ${lingua}: il primo pulsante e' «${primo.nome}» (pieno ${primo.pieno}, fuoco ${primo.fuoco}) invece di «${e.riprendi(11)}» pieno con il fuoco`);
      if (secondo.nome !== e.gioca(13) || secondo.pieno) errori.push(`E2 ${lingua}: il secondo pulsante e' «${secondo.nome}» invece di «${e.gioca(13)}» trasparente`);
    }
    await contesto.close();
  }
}

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Il pulsante grande porta al livello corrente; un livello da superare lasciato a meta\' resta sul pulsante.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
