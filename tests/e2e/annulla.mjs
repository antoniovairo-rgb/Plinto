/**
 * Il "rimetti a posto": che il collegamento fra regola e schermo funzioni davvero.
 *
 * La REGOLA -- quando si puo' annullare e quando no -- e' provata senza browser in
 * tests/engine.test.js, dove costa millisecondi. Qui si prova l'altra meta': che il
 * pulsante compaia quando deve, che premerlo rimetta la partita esattamente com'era, e
 * che sparisca dopo. E' la parte che i test unitari non possono vedere, perche' vive
 * fra tre hook, un componente e il dito di chi gioca.
 *
 * Uso: npm run annulla
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

async function serverRisponde() {
  try {
    const r = await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: false,
  });
  for (let i = 0; i < 30 && !(await serverRisponde()); i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!(await serverRisponde())) {
    console.error('Impossibile avviare il server di sviluppo su', INDIRIZZO);
    process.exit(1);
  }
}

const errori = [];
const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));

const pulsante = () => page.getByRole('button', { name: /Rimetti a posto/ });
const blocchi = () => page.locator('.pl-plancia .pl-blocco').count();
const pezziInMano = () => page.locator('.pl-tray .pl-pezzo').count();
const punteggio = () => page.locator('.pl-hud__punteggio .pl-hud__valore').innerText();

/** Trascina il primo pezzo della mano sulla cella indicata. */
async function posa(cella) {
  const g = await page.evaluate((n) => {
    const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
    const c = document.querySelectorAll('.pl-plancia .pl-cella')[n].getBoundingClientRect();
    return {
      px: p.left + p.width / 2, py: p.top + p.height / 2,
      cx: c.left + c.width / 2, cy: c.top + c.height / 2,
    };
  }, cella);
  await page.mouse.move(g.px, g.py);
  await page.mouse.down();
  await page.mouse.move(g.cx, g.cy, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(180);
}

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  window.localStorage.clear();
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true,
  }));
});
await page.reload({ waitUntil: 'networkidle' });

// ---------- 1. A inizio partita non c'e' niente da rimettere a posto ----------
await page.locator('.pl-home__azioni .pl-sfida-avvio').nth(1).click();
await page.waitForSelector('.pl-plancia');
const primaDiGiocare = await pulsante().count();
console.log(`1. prima della prima mossa il pulsante non c'e': ${primaDiGiocare === 0}`);
if (primaDiGiocare !== 0) errori.push('Il pulsante compare prima ancora di aver giocato');

// ---------- 2. Dopo una mossa che non elimina niente, compare ----------
const bloccchiPrima = await blocchi();
const manoPrima = await pezziInMano();
const puntiPrima = await punteggio();
await posa(40);                                   // il centro: griglia vuota, non chiude niente
const bloccchiDopo = await blocchi();
const compare = await pulsante().count();
console.log(`2. dopo una mossa pulita: blocchi ${bloccchiPrima} -> ${bloccchiDopo}, pulsante presente ${compare === 1}`);
if (bloccchiDopo <= bloccchiPrima) errori.push('La mossa non ha appoggiato niente: lo scenario non prova quello che dice');
if (compare !== 1) errori.push('Dopo una mossa senza eliminazioni il pulsante NON compare');

// ---------- 3. Premerlo rimette la partita esattamente com'era ----------
if (compare === 1) {
  await pulsante().click();
  await page.waitForTimeout(200);
  const b = await blocchi();
  const m = await pezziInMano();
  const p = await punteggio();
  console.log(`3. dopo il ritorno: blocchi ${b} (attesi ${bloccchiPrima}), pezzi in mano ${m} (attesi ${manoPrima}), punteggio "${p}" (atteso "${puntiPrima}")`);
  if (b !== bloccchiPrima) errori.push(`RITORNO: ${b} blocchi invece di ${bloccchiPrima}`);
  if (m !== manoPrima) errori.push(`RITORNO: ${m} pezzi in mano invece di ${manoPrima}`);
  // I punti della posa devono tornare indietro insieme al resto: se restassero, un
  // giocatore potrebbe appoggiare e annullare all'infinito per fare punteggio.
  if (p !== puntiPrima) errori.push(`RITORNO: punteggio "${p}" invece di "${puntiPrima}"`);

  // ---------- 4. E sparisce: la memoria e' lunga una mossa ----------
  const dopoIlRitorno = await pulsante().count();
  console.log(`4. dopo averlo usato sparisce: ${dopoIlRitorno === 0}`);
  if (dopoIlRitorno !== 0) errori.push('Il pulsante resta acceso dopo essere stato usato');
}

// ---------- 5. Nei livelli vale lo stesso, e le mosse tornano indietro ----------
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.locator('.pl-home__azioni .pl-btn--primario').click();
await page.waitForSelector('.pl-apertura');
await page.locator('.pl-apertura__azioni .pl-btn--primario').click();
await page.waitForSelector('.pl-plancia');
const mosse = () => page.locator('.pl-obiettivo__mosse .pl-obiettivo__valore, .pl-obiettivo__mosse')
  .first().innerText().catch(() => '');
const mossePrima = (await mosse()).trim();
await posa(40);
const mosseDopo = (await mosse()).trim();
const nelLivello = await pulsante().count();
if (nelLivello === 1) {
  await pulsante().click();
  await page.waitForTimeout(200);
}
const mosseTornate = (await mosse()).trim();
console.log(`5. nel livello: mosse "${mossePrima}" -> "${mosseDopo}" -> "${mosseTornate}", pulsante presente ${nelLivello === 1}`);
if (nelLivello !== 1) errori.push('Nei livelli il pulsante non compare');
if (mosseTornate !== mossePrima) {
  errori.push(`LIVELLO: le mosse restano "${mosseTornate}" invece di tornare a "${mossePrima}"`);
}

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Il "rimetti a posto" compare quando deve, ripristina esattamente, e poi sparisce.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
