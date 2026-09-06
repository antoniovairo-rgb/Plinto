/**
 * Controllo dell'aspetto su schermo grande.
 *
 * Il gioco e' disegnato per il telefono e viene verificato su viewport da telefono:
 * su un monitor la stessa interfaccia puo' sfilacciarsi senza che nessun test se ne
 * accorga. Qui si misura una cosa concreta e non opinabile: la distanza fra la fine
 * del contenuto e il pulsante principale.
 *
 * Uso: node tools/prova-desktop.mjs
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const USCITA = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-desktop';

await (await import('node:fs/promises')).mkdir(USCITA, { recursive: true });

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore',
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const errori = [];
const browser = await chromium.launch({ executablePath: ESEGUIBILE });

// La misura dello schermo della segnalazione, piu' un paio di casi limite.
const SCHERMI = [
  { nome: 'desktop', width: 1631, height: 1030 },
  { nome: 'monitor-grande', width: 1920, height: 1200 },
  { nome: 'portatile-basso', width: 1440, height: 700 },
  { nome: 'tablet', width: 820, height: 1180 },
];

for (const schermo of SCHERMI) {
  const page = await browser.newPage({ viewport: { width: schermo.width, height: schermo.height }, locale: 'it-IT' });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const misure = await page.evaluate(() => {
    const esempio = document.querySelector('.pl-intro__esempio');
    const bottone = document.querySelector('.pl-intro__azioni .pl-btn');
    if (!esempio || !bottone) return null;
    const e = esempio.getBoundingClientRect();
    const b = bottone.getBoundingClientRect();
    return { distanza: Math.round(b.top - e.bottom), larghezzaBottone: Math.round(b.width) };
  });
  await page.screenshot({ path: `${USCITA}/${schermo.nome}-intro.png` });

  if (!misure) { errori.push(`${schermo.nome}: presentazione non trovata`); await page.close(); continue; }
  console.log(`${schermo.nome.padEnd(18)} ${schermo.width}x${schermo.height}  vuoto sotto il contenuto: ${misure.distanza} px  pulsante largo ${misure.larghezzaBottone} px`);
  // Oltre due dita di vuoto fra il contenuto e l'azione principale, l'interfaccia
  // non sembra piu' progettata: sembra rotta.
  if (misure.distanza > 180) {
    errori.push(`${schermo.nome}: ${misure.distanza} px di vuoto fra il contenuto e il pulsante GIOCA`);
  }

  // E si deve poter giocare, non solo guardare.
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia', { timeout: 5000 }).catch(() => errori.push(`${schermo.nome}: la plancia non compare`));
  const plancia = await page.locator('.pl-plancia').boundingBox();
  if (plancia && plancia.height < 240) errori.push(`${schermo.nome}: plancia alta solo ${Math.round(plancia.height)} px`);
  await page.screenshot({ path: `${USCITA}/${schermo.nome}-partita.png` });
  await page.close();
}

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) console.log('Aspetto coerente su tutti gli schermi provati.');
else errori.forEach((e) => console.log('PROBLEMA -', e));
process.exit(errori.length === 0 ? 0 : 1);
