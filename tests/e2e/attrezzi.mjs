/**
 * Gli attrezzi del cantiere, nel gioco vero.
 *
 * Le regole stanno gia' nelle prove pure (attrezzi, gru, gessetto). Qui si prova il
 * cablaggio, cioe' quello che quelle non possono vedere: che la pastiglia compaia, che il
 * pannello si apra senza costare niente, che la gru cambi davvero il pezzo toccato e che
 * il gessetto segni delle caselle. E due cose che sarebbero difetti silenziosi: guardare
 * il pannello e chiuderlo non deve scalare niente, e spegnendo l'interruttore la pastiglia
 * deve sparire.
 *
 * Uso: npm run e2e-attrezzi
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-attrezzi';
await mkdir(OUT, { recursive: true });

const errori = [];
const controlla = (cosa, ok) => { if (!ok) errori.push(cosa); };

async function risponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; }
}
let server = null;
if (!(await risponde())) {
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'],
    { cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore' });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await risponde())) await new Promise((r) => setTimeout(r, 400));
}
process.on('exit', () => { try { server?.kill(); } catch { /* gia' morto */ } });

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text().slice(0, 160)}`); });

/** Apre il livello 13 con `quanti` attrezzi in magazzino. */
async function apriPartita(quanti, conAttrezzi = true) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(({ n, acceso }) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true, attrezzi: acceso,
    }));
    const v = {};
    for (let k = 1; k <= 12; k += 1) v[k] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: v }));
    window.localStorage.setItem('plinto:attrezzi', JSON.stringify({ versione: 1, disponibili: n, riscossi: 2 }));
  }, { n: quanti, acceso: conAttrezzi });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  const tappa = page.locator('.pl-tappa').nth(12);
  await tappa.scrollIntoViewIfNeeded();
  await tappa.click();
  const gioca = page.getByRole('button', { name: /^Gioca$/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-plancia');
}

const pieni = () => page.locator('.pl-attrezzi__posto--pieno').count();

console.log('\n1. la pastiglia c e e dice quanti attrezzi hai...');
await apriPartita(2);
controlla('la pastiglia degli attrezzi non compare', await page.locator('.pl-attrezzi__pastiglia').count() === 1);
controlla(`la pastiglia mostra ${await pieni()} attrezzi invece di 2`, (await pieni()) === 2);
await page.screenshot({ path: `${OUT}/1-pastiglia.png` });

console.log('2. guardare il pannello e chiuderlo NON costa niente...');
await page.locator('.pl-attrezzi__pastiglia').click();
await page.waitForSelector('.pl-attrezzi__pannello');
await page.screenshot({ path: `${OUT}/2-pannello.png` });
await page.getByRole('button', { name: /^Torna alla partita$/ }).click();
await page.waitForTimeout(200);
controlla(`chiudere il pannello ha scalato un attrezzo (ne restano ${await pieni()})`, (await pieni()) === 2);

console.log('3. il gessetto segna delle caselle e costa uno...');
await page.locator('.pl-attrezzi__pastiglia').click();
await page.getByRole('button', { name: /Il gessetto/ }).click();
await page.waitForTimeout(300);
const segnate = await page.locator('.pl-cella--segnata').count();
controlla('il gessetto non ha segnato nessuna casella', segnate > 0);
controlla(`dopo il gessetto restano ${await pieni()} attrezzi invece di 1`, (await pieni()) === 1);
await page.screenshot({ path: `${OUT}/3-gessetto.png` });

console.log('4. la gru cambia il pezzo che tocchi, e non costa una mossa...');
const mosseDi = async () => Number((await page.locator('.pl-obiettivo__mosse strong').first().innerText()).trim());
const mossePrima = await mosseDi();
await page.locator('.pl-attrezzi__pastiglia').click();
await page.getByRole('button', { name: /La gru/ }).click();
await page.waitForTimeout(200);
controlla('in modo gru il vassoio non si illumina', await page.locator('.pl-tray-scelta').count() === 1);
await page.screenshot({ path: `${OUT}/4-gru.png` });
const prima = await page.locator('.pl-tray__posto').nth(1).innerHTML();
await page.locator('.pl-tray__posto').nth(1).click();
await page.waitForTimeout(400);
controlla('la gru non ha cambiato il pezzo toccato', prima !== await page.locator('.pl-tray__posto').nth(1).innerHTML());
controlla(`la gru ha consumato una mossa (${mossePrima} -> ${await mosseDi()})`, (await mosseDi()) === mossePrima);
controlla(`dopo la gru restano ${await pieni()} attrezzi invece di 0`, (await pieni()) === 0);
controlla('il segno del gesso non si e cancellato dopo la gru', await page.locator('.pl-cella--segnata').count() === 0);

console.log('5. a magazzino vuoto il pannello spiega come si guadagnano...');
await page.locator('.pl-attrezzi__pastiglia').click();
await page.waitForSelector('.pl-attrezzi__pannello');
const vuoto = await page.locator('.pl-attrezzi__pannello').innerText();
controlla(`il pannello vuoto non spiega niente: "${vuoto.replace(/\n/g, ' | ')}"`, /5 livelli/.test(vuoto));
await page.screenshot({ path: `${OUT}/5-vuoto.png` });
await page.getByRole('button', { name: /^Torna alla partita$/ }).click();

console.log('6. con l interruttore spento la pastiglia sparisce...');
await apriPartita(3, false);
controlla('spegnendo gli attrezzi la pastiglia resta a schermo', await page.locator('.pl-attrezzi__pastiglia').count() === 0);

await browser.close();
server?.kill();

console.log('\n================ ESITO ================');
if (errori.length) {
  console.log(`${errori.length} problemi:`);
  for (const e of errori) console.log(`  - ${e}`);
  process.exit(1);
}
console.log('Nessun problema rilevato.');
