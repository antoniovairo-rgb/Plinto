/**
 * La guida al primo avvio: sei passi, e due modi diversi di saltarla.
 *
 * Perche' esiste una prova a se'. Questa schermata la vede OGNI giocatore nuovo, una
 * volta sola, ed e' l'unica del gioco in cui un difetto non si scopre mai: chi lo
 * incontra e' nuovo, non sa che sia un difetto, e non torna indietro a raccontarlo.
 * Le altre schermate le riguardi mille volte, questa no.
 *
 * La cosa piu' facile da rompere qui non e' il disegno: e' la DIFFERENZA fra i due
 * pulsanti in basso. "Salta per ora" e "Non mostrarmela piu'" fanno la stessa cosa
 * adesso -- ti portano alla home -- e cose opposte domani. Un errore che li rendesse
 * identici non si vedrebbe provando il gioco per cinque minuti.
 *
 * Uso: npm run guida
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { PASSI_GUIDA, REGOLE_INTRO } from '../../src/config/intro.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-guida';

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

await mkdir(OUT, { recursive: true });
const errori = [];
const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));

const conteggio = () => page.locator('.pl-guida__passo').innerText();
const avanti = () => page.getByRole('button', { name: /^Avanti$/ });
const indietro = () => page.getByRole('button', { name: /^Indietro$/ });

async function daCapo() {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-guida');
}

// ---------- 1. Tutti i passi, uno per volta ----------
await daCapo();
console.log(`1. la guida ha ${PASSI_GUIDA.length} passi`);
for (let i = 0; i < PASSI_GUIDA.length; i += 1) {
  const detto = (await conteggio()).trim();
  const atteso = `Passo ${i + 1} di ${PASSI_GUIDA.length}`;
  if (detto.toLowerCase() !== atteso.toLowerCase()) {
    errori.push(`PASSI: al passo ${i + 1} il conteggio dice "${detto}" invece di "${atteso}"`);
  }
  // Ogni passo deve MOSTRARE qualcosa: un passo vuoto e' l'errore che si fa
  // aggiungendo una voce a PASSI_GUIDA e dimenticando di disegnarla.
  const titolo = (await page.locator('.pl-scroll .pl-sezione').innerText().catch(() => '')).trim();
  const corpo = (await page.locator('.pl-scroll').innerText()).trim();
  if (!titolo) errori.push(`PASSI: il passo ${i + 1} (${PASSI_GUIDA[i]}) non ha titolo`);
  if (corpo.length < 60) errori.push(`PASSI: il passo ${i + 1} (${PASSI_GUIDA[i]}) e quasi vuoto`);
  if (/\{[a-zA-Z]+\}/.test(corpo)) errori.push(`PASSI: il passo ${i + 1} mostra un segnaposto non sostituito`);
  if (/undefined|NaN|null/.test(corpo)) errori.push(`PASSI: il passo ${i + 1} mostra un valore rotto`);
  await page.screenshot({ path: `${OUT}/passo-${i + 1}-${PASSI_GUIDA[i]}.png` });

  if (i === 0) {
    const regole = await page.locator('.pl-intro__regole li').count();
    if (regole !== REGOLE_INTRO.length) {
      errori.push(`PASSI: il primo passo mostra ${regole} regole invece di ${REGOLE_INTRO.length}`);
    }
    // Al primo passo "Indietro" deve esserci ma non fare niente: se sparisse,
    // "Avanti" scivolerebbe sotto il pollice in un punto diverso a ogni passo.
    if (await indietro().count() !== 1) errori.push('PASSI: al primo passo manca il pulsante Indietro');
    if (!(await indietro().isDisabled())) errori.push('PASSI: al primo passo Indietro non e disabilitato');
  }

  // La bomba e' l'unica regola che non si puo' dedurre giocando: un blocco appoggiato
  // si comporta come tutti gli altri finche' non lo elimini, e a quel punto ne porta
  // via altri otto. Chi non lo sa in anticipo non lo impara osservando: gli succede e
  // basta. Se sparisce di qui, il giocatore la scopre subendola.
  if (PASSI_GUIDA[i] === 'bomba') {
    const disegnata = await page.locator('.pl-intro__bomba .pl-bomba').count();
    const detta = /bomba|bomb/i.test(corpo);
    console.log(`   passo della bomba: illustrata ${disegnata === 1}, nominata ${detta}`);
    if (disegnata !== 1) errori.push('BOMBA: il passo della bomba non la illustra');
    if (!detta) errori.push('BOMBA: il passo della bomba non la nomina');
  }

  if (i < PASSI_GUIDA.length - 1) {
    if (await avanti().count() !== 1) errori.push(`PASSI: al passo ${i + 1} manca il pulsante Avanti`);
    await avanti().click();
  }
}

// All'ultimo passo il pulsante grande deve invitare a giocare, non ad andare avanti.
if (await avanti().count() !== 0) errori.push('PASSI: all ultimo passo c e ancora "Avanti"');
const gioca = await page.getByRole('button', { name: /^Gioca$/ }).count();
if (gioca !== 1) errori.push('PASSI: all ultimo passo manca il pulsante per giocare');
console.log(`   ultimo passo: pulsante per giocare presente ${gioca === 1}`);

// ---------- 2. Si torna indietro ----------
await indietro().click();
const tornato = (await conteggio()).trim();
console.log(`2. dopo Indietro: "${tornato}"`);
if (!tornato.includes(String(PASSI_GUIDA.length - 1))) {
  errori.push(`INDIETRO: da ultimo passo si torna a "${tornato}"`);
}

// ---------- 3. "Salta per ora": la guida TORNA al prossimo avvio ----------
await daCapo();
await page.getByRole('button', { name: /Salta per ora/ }).click();
await page.waitForSelector('.pl-home');
console.log('3. "Salta per ora" porta alla home');
await page.reload({ waitUntil: 'networkidle' });
const tornata = await page.locator('.pl-guida').count();
console.log(`   dopo un riavvio la guida ricompare: ${tornata === 1}`);
if (tornata !== 1) {
  errori.push('SALTA PER ORA: la guida non ricompare al riavvio, quindi si comporta come "non mostrarmela piu"');
}

// ---------- 4. "Non mostrarmela piu'": non torna ----------
await daCapo();
await page.getByRole('button', { name: /Non mostrarmela/ }).click();
await page.waitForSelector('.pl-home');
await page.reload({ waitUntil: 'networkidle' });
const risparmiata = await page.locator('.pl-guida').count();
console.log(`4. "Non mostrarmela piu": dopo un riavvio la guida NON ricompare: ${risparmiata === 0}`);
if (risparmiata !== 0) errori.push('NON MOSTRARE: la guida ricompare lo stesso');

// ---------- 5. Finirla vale come "non mostrarmela piu'" ----------
await daCapo();
for (let i = 0; i < PASSI_GUIDA.length - 1; i += 1) await avanti().click();
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-home');
await page.reload({ waitUntil: 'networkidle' });
const dopoAverlaFinita = await page.locator('.pl-guida').count();
console.log(`5. chi la finisce non se la ritrova: ${dopoAverlaFinita === 0}`);
if (dopoAverlaFinita !== 0) errori.push('FINE GUIDA: chi arriva in fondo se la ritrova al riavvio');

// ---------- 6. Le regole restano rileggibili ----------
// Una guida che si puo' spegnere per sempre deve lasciare un posto dove tornare,
// altrimenti "non mostrarmela piu" e' una porta che si chiude alle spalle.
await page.getByRole('button', { name: /Come si gioca/ }).click();
await page.waitForSelector('.pl-pagina__titolo');
const aiuto = (await page.locator('.pl-scroll').innerText()).trim();
console.log(`6. "Come si gioca" resta raggiungibile dalla home: ${aiuto.length > 200}`);
if (aiuto.length < 200) errori.push('AIUTO: la pagina delle regole non e raggiungibile o e vuota');

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log(`Guida: ${PASSI_GUIDA.length} passi, si torna indietro, e i due modi di saltarla si comportano in modo diverso.`);
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
