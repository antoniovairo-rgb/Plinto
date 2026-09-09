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
 *   4. con il menu aperto, il primo Indietro chiude il menu e lascia dov'eri.
 *
 * Il punto 3 conta quanto il primo: un gioco da cui non si esce piu' e' peggio di uno
 * che si chiude troppo presto.
 *
 * Uso: npm run indietro
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
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
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore',
  });
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

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} verifiche fallite:`);
  errori.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nTutte le verifiche del tasto Indietro sono passate.');
