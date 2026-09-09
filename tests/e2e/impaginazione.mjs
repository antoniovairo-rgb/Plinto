/**
 * La home deve ENTRARE nello schermo, su tutti i telefoni.
 *
 * PERCHE' ESISTE. La home ha sette voci piu' il marchio, e il respiro fra i gruppi era
 * proporzionale all'altezza dello schermo con un tetto alto. Su uno schermo da 640px
 * sforava di una cinquantina di pixel: la prima schermata del gioco scorreva. Se ne e'
 * accorto un giocatore, non una prova -- perche' nessuna misurava l'altezza.
 *
 * Nell'app installata il problema si nota di piu' proprio DOPO averla sistemata: senza
 * la barra dell'indirizzo lo schermo e' piu' alto, e uno scorrimento residuo di pochi
 * pixel sembra un difetto invece che una necessita'.
 *
 * Si prova con lo stato PIU' PIENO possibile: partita libera in corso, sfida in corso,
 * livelli superati, record. E' la home piu' alta che il gioco possa produrre; se entra
 * quella, entrano tutte.
 *
 * Uso: npm run impaginazione
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

// I formati veri dei telefoni in circolazione. 320x568 non c'e': e' l'iPhone SE del
// 2016, sotto qualunque Android che possa installare PLINTO (minimo Android 7).
const FORMATI = [
  [360, 640, 'Android di base'],
  [360, 780, 'Xiaomi stretto'],
  [390, 844, 'iPhone 12-15'],
  [393, 873, 'Pixel 7'],
  [412, 732, 'schermo basso'],
  [412, 915, 'Redmi / Galaxy'],
];

const errori = [];

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

console.log('\nLa home entra nello schermo?');
for (const [larghezza, altezza, nome] of FORMATI) {
  const page = await browser.newPage({ viewport: { width: larghezza, height: altezza }, locale: 'it-IT' });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, tema: 'scuro', lingua: 'it',
      audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
    }));
    window.localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
    window.localStorage.setItem('plinto:quadri', JSON.stringify({
      versione: 1,
      livelli: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i + 1, { mosse: 9, punteggio: 400, tentativi: 1 }]),
      ),
    }));
    // Le due partite in corso aggiungono due righe: e' la home piu' alta possibile.
    window.localStorage.setItem('plinto:partita', JSON.stringify({ segnaposto: true }));
    window.localStorage.setItem('plinto:partita-sfida', JSON.stringify({ segnaposto: true }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-home__azioni');

  const eccesso = await page.evaluate(() => {
    const el = document.querySelector('.pl-home');
    return el.scrollHeight - el.clientHeight;
  });
  const esito = eccesso > 0 ? `SCORRE di ${eccesso}px` : 'entra';
  console.log(`  ${eccesso > 0 ? 'NO  ' : 'ok  '}${nome.padEnd(18)} ${larghezza}x${altezza}  ${esito}`);
  if (eccesso > 0) errori.push(`${nome} (${larghezza}x${altezza}): la home scorre di ${eccesso}px`);
  await page.close();
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} formati su ${FORMATI.length} fanno scorrere la home:`);
  errori.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nLa home entra su tutti i formati provati.');
