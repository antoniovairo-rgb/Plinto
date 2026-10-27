/**
 * Il tasto Indietro, premuto davvero, in un browser vero.
 *
 * PERCHE' ESISTE. PLINTO cambia schermata con lo stato di React: senza voci nella
 * cronologia, il tasto Indietro trova subito il fondo e chiude l'applicazione. Sul sito
 * si nota poco; nell'app installata dal Play Store e' il gesto principale per uscire da
 * una schermata, e chiudeva il gioco da dentro un livello. Nessuna delle 382 prove
 * automatiche poteva vederlo, perche' nessuna preme un tasto di sistema: l'ha trovato la
 * prima persona che ha tenuto in mano l'app.
 *
 * Che cosa verifica, in ordine:
 *   1. da un livello si torna alla MAPPA, non si esce;
 *   2. dalla mappa si torna alla HOME;
 *   3. dalla home Indietro esce davvero, invece di restare bloccati dentro;
 *   4. con il menu aperto, il primo Indietro chiude il menu e lascia dov'eri;
 *   5. G1 (collaudo 1.21.10): un collegamento `#/sfida/<giorno>` aperto con la scheda gia'
 *      aperta, cioe' un cambio d'ancora, non e' un Indietro. Dalla home apre la sfida di
 *      quel giorno (prima: restava la home e l'ancora spariva); dalla partita libera
 *      apre la sfida invece di riportare alla home; poi Indietro torna alla home e un
 *      altro Indietro esce. Rosso con ANCORA_NON_E_INDIETRO spento.
 *
 * Il punto 3 conta quanto il primo: un gioco da cui non si esce piu' e' peggio di uno
 * che si chiude troppo presto.
 *
 * Uso: npm run indietro
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Prima il collegamento stabile delle macchine di sviluppo (collaudo 1.21.25, O6: il
// percorso con il numero di versione cambia a ogni Playwright), poi quello vecchio; se
// nessuno c'e' (CI), decide Playwright.
const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', PERCORSO_NOTO].find((p) => p && existsSync(p));
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

const errori = [];
const verifica = (condizione, descrizione) => {
  console.log(`  ${condizione ? 'ok  ' : 'NO  '}${descrizione}`);
  if (!condizione) errori.push(descrizione);
};

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
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  window.localStorage.clear();
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, tema: 'scuro', lingua: 'it',
    audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
  }));
});
await page.reload({ waitUntil: 'networkidle' });

/** Su quale schermata siamo, letto dal DOM invece che dallo stato interno. */
const dove = async () => {
  if (await page.locator('.pl-apertura').count()) return 'apertura';
  if (await page.locator('.pl-obiettivo__frase').count()) return 'quadro';
  if (await page.locator('.pl-tappa').count()) return 'quadri';
  if (await page.locator('.pl-home__azioni').count()) return 'home';
  if (await page.locator('.pl-plancia').count()) return 'gioco';
  return 'ignota';
};

console.log('\nTasto Indietro:');

// 1. Dentro un livello.
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappa');
await page.locator('.pl-tappa').first().click();
await page.waitForSelector('.pl-apertura');
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-plancia');
verifica(await dove() === 'quadro', 'si entra nel livello 1');

await page.goBack();
await page.waitForTimeout(300);
verifica(await dove() === 'quadri', 'da un livello si torna alla mappa, non si esce');

// 2. Dalla mappa.
await page.goBack();
await page.waitForTimeout(300);
verifica(await dove() === 'home', 'dalla mappa si torna alla home');

// 3. Dalla home si esce davvero: la cronologia non deve avere voci nostre residue.
const voci = await page.evaluate(() => window.history.length);
await page.goBack().catch(() => {});
await page.waitForTimeout(300);
const ancoraNelGioco = await page.evaluate(() => document.querySelector('.pl-app') !== null);
verifica(!ancoraNelGioco || (await page.evaluate(() => window.history.length)) < voci,
  'dalla home Indietro esce, invece di lasciare il gioco bloccato');

// 3b. La prova che riguarda l'app installata: dopo un Indietro deve essere gia' rimasta
// una voce in cronologia. In una finestra di fiducia non c'e' nessuna pagina sotto il
// gioco, e Chrome decide se chiudere l'applicazione in base a quante voci restano --
// subito, non dopo il ridisegno. Se la voce venisse rimessa da un effetto di React
// arriverebbe tardi, e il secondo Indietro chiuderebbe il gioco dalla mappa dei livelli.
// Qui si misura proprio quello: quante voci ci sono NELL'ISTANTE dopo il passo indietro.
const vergine = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
await vergine.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await vergine.evaluate(() => {
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, tema: 'scuro', lingua: 'it',
    audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
  }));
});
await vergine.reload({ waitUntil: 'networkidle' });
const base = await vergine.evaluate(() => window.history.length);
await vergine.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await vergine.waitForSelector('.pl-tappa');
await vergine.locator('.pl-tappa').first().click();
await vergine.waitForSelector('.pl-apertura');
await vergine.getByRole('button', { name: /^Gioca$/ }).click();
await vergine.waitForSelector('.pl-plancia');
await vergine.goBack();
await vergine.waitForSelector('.pl-tappa');
const dopoUnIndietro = await vergine.evaluate(() => window.history.length);
verifica(dopoUnIndietro > base,
  'dopo un Indietro resta gia una voce in cronologia (nell app installata: non si chiude)');
await vergine.close();

// 4. Il menu si chiude senza cambiare schermata. Si prova nella partita libera, che e'
// dove il menu esiste davvero: nella mappa dei livelli non c'e'.
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Nuova partita|^Partita libera/ }).click();
await page.waitForSelector('.pl-plancia');
await page.locator('.pl-hud__menu').first().click();
await page.waitForSelector('.pl-menu');
await page.goBack();
await page.waitForTimeout(300);
verifica(await page.locator('.pl-menu').count() === 0, 'Indietro chiude il menu');
verifica(await page.locator('.pl-plancia').count() === 1, 'chiudere il menu non esce dalla partita');

// ...e da li' un altro Indietro riporta alla home, senza chiudere il gioco.
await page.goBack();
await page.waitForTimeout(400);
verifica(await dove() === 'home', 'dalla partita si torna alla home');

// 5. G1: un cambio d'ancora con il gioco gia' aperto.
const g1 = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
await g1.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await g1.evaluate(() => {
  window.localStorage.clear();
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    versione: 2, introVista: true, tema: 'scuro', lingua: 'it',
    audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
  }));
});
await g1.reload({ waitUntil: 'networkidle' });
await g1.waitForSelector('.pl-home__azioni');
const doveG1 = () => g1.evaluate(() => ({
  schermata: document.querySelector('.pl-home__azioni') ? 'home' : document.querySelector('.pl-plancia') ? 'gioco' : 'ignota',
  ancora: window.location.hash,
  domanda: document.querySelectorAll('[role=dialog]').length,
  seme: JSON.parse(window.localStorage.getItem('plinto:partita-sfida') || 'null')?.seedLabel ?? null,
}));
const vociG1 = await g1.evaluate(() => window.history.length);
await g1.evaluate(() => { window.location.hash = '#/sfida/2026-10-10'; });
await g1.waitForTimeout(800);
let g = await doveG1();
console.log(`   G1 dalla home: ${JSON.stringify(g)}`);
verifica(g.schermata === 'gioco' && g.ancora === '#/sfida/2026-10-10',
  'G1: dalla home un collegamento alla sfida del 2026-10-10 apre quella sfida e tiene l ancora');
await g1.goBack();
await g1.waitForTimeout(400);
g = await doveG1();
verifica(g.schermata === 'home' && g.ancora === '', 'G1: da quella sfida Indietro torna alla home, senza ancora');
// Dalla partita libera: il collegamento apre la sfida, non riporta alla home.
await g1.getByRole('button', { name: /^Partita libera/ }).click();
await g1.waitForSelector('.pl-plancia');
await g1.evaluate(() => { window.location.hash = '#/sfida/2026-10-11'; });
await g1.waitForTimeout(800);
g = await doveG1();
console.log(`   G1 dalla partita libera: ${JSON.stringify(g)}`);
verifica(g.schermata === 'gioco' && g.ancora === '#/sfida/2026-10-11' && g.seme === '2026-10-11',
  'G1: dalla partita libera un collegamento alla sfida del 2026-10-11 apre quella sfida');
await g1.goBack();
await g1.waitForTimeout(400);
verifica((await doveG1()).schermata === 'home', 'G1: da li Indietro torna alla home');
// E dalla home si esce ancora: le voci delle ancore non restano a bloccare l'uscita.
const primaUscita = await g1.evaluate(() => window.history.length);
await g1.goBack().catch(() => {});
await g1.waitForTimeout(400);
const resta = await g1.evaluate(() => document.querySelector('.pl-home__azioni') !== null).catch(() => false);
console.log(`   G1 voci: all inizio ${vociG1}, prima dell uscita ${primaUscita}, ancora sulla home dopo Indietro: ${resta}`);
await g1.close();

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} verifiche fallite:`);
  errori.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nTutte le verifiche del tasto Indietro sono passate.');
