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
 *
 * Interruttore: SOSPESO_SOLO_SE_DA_SUPERARE (App.jsx). Spento, A e' rosso.
 *
 * Uso: npm run e2e-po041
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { OPERE, quadroNumero } from '../../src/config/quadri.js';
import { iniziaQuadro } from '../../src/core/quadro.js';
import { serializeGame } from '../../src/core/engine.js';

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
const voceAMeta = (numero) => ({
  numero, partita: serializeGame(iniziaQuadro(quadroNumero(numero), { now: 0 })), presentazione: false,
});

async function apri(superati, aMeta) {
  const contesto = await browser.newContext({ viewport: { width: 360, height: 640 }, locale: 'it-IT' });
  const page = await contesto.newPage();
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ numeri, voce }) => {
    window.localStorage.clear();
    // avvisoTorre: la finestra della Torre (PO-040) e' gia' stata vista: qui conta il pulsante.
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      versione: 2, introVista: true, lingua: 'it', animazioni: false, avvisoTorre: true,
    }));
    const livelli = {};
    for (const n of numeri) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
    window.localStorage.setItem('plinto:partita-quadro', JSON.stringify(voce));
  }, { numeri: superati, voce: voceAMeta(aMeta) });
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

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Il pulsante grande porta al livello corrente; un livello da superare lasciato a meta\' resta sul pulsante.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
