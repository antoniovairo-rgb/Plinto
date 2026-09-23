/**
 * Ritrovare il posto dopo che il sistema ha buttato via la pagina.
 *
 * IL DIFETTO CHE QUESTO FILE ESISTE PER NON RIFARE. Segnalato da chi ci gioca:
 * "mettendo temporaneamente l'app in secondo piano si perde la partita in corso, e' come
 * se scadesse la sessione". Misurato: la partita libera restava salvata ma l'app
 * ripartiva dalla home; un livello a meta' spariva del tutto, perche' non veniva salvato.
 *
 * COME SI SIMULA. Su Android l'app e' una Trusted Web Activity: quando il sistema ha
 * bisogno di memoria butta via la pagina, e riaprendo l'app la TWA la ricarica da zero.
 * Nel browser la stessa cosa e' un `reload`. Non e' un'approssimazione comoda: e'
 * letteralmente quello che succede, cioe' la pagina che riparte senza nessuno stato in
 * memoria e con il solo localStorage.
 *
 * I QUATTRO CASI SONO DUE COPPIE. Due dicono che il gioco deve tornare dov'era (partita
 * libera, livello); due dicono che NON deve (assenza lunga, uscita volontaria). Senza la
 * seconda coppia questo file approverebbe anche un gioco che ti risucchia dentro una
 * partita di tre giorni fa ogni volta che lo apri.
 *
 * Uso: npm run e2e-ripresa
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { FINESTRA_RIPRESA } from '../../src/persistence/ripresa.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-ripresa';
await mkdir(OUT, { recursive: true });

const errori = [];

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
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

/** Appoggia un pezzo in un punto libero: serve solo a far avanzare la partita. */
async function unaMossa() {
  const punti = await page.evaluate(() => {
    const pezzo = document.querySelector('.pl-tray .pl-pezzo');
    const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    if (!pezzo || !celle.length) return null;
    const rp = pezzo.getBoundingClientRect();
    const vuote = celle.filter((c) => !c.className.includes('piena'));
    const c = vuote[Math.floor(vuote.length / 2)] ?? celle[40];
    const rc = c.getBoundingClientRect();
    return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 };
  });
  if (!punti) return false;
  await page.mouse.move(punti.px, punti.py);
  await page.mouse.down();
  await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(120);
  return true;
}

/** Quello che si vede adesso: schermata, punteggio, obiettivo del livello. */
const istantanea = () => page.evaluate(() => ({
  inGioco: Boolean(document.querySelector('.pl-screen--gioco')),
  inHome: Boolean(document.querySelector('.pl-home')),
  hud: document.querySelector('.pl-hud')?.innerText.replace(/\n/g, ' | ') ?? '',
  obiettivo: document.querySelector('.pl-obiettivo, .pl-barra-obiettivo')?.innerText.replace(/\n/g, ' | ') ?? '',
}));

/** Il sistema butta via la pagina e l'app la ricarica. */
async function ricarica() {
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
}

async function daCapo() {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
}

/** Apre il primo livello e ci gioca qualche mossa. */
async function apriIlPrimoLivello() {
  await page.getByRole('button', { name: 'Mappa dei livelli' }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(0).click();
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
}

// ---------- 1. Partita libera: si torna dentro, allo stesso punto ----------
console.log('1. partita libera interrotta: deve riaprirsi dov era...');
await daCapo();
await page.getByRole('button', { name: 'Partita libera' }).click();
await page.waitForSelector('.pl-plancia .pl-cella');
for (let i = 0; i < 4; i += 1) await unaMossa();
const liberaPrima = await istantanea();
await ricarica();
const liberaDopo = await istantanea();
await page.screenshot({ path: `${OUT}/1-libera.png` });
console.log(`   prima: ${liberaPrima.hud}\n   dopo : ${liberaDopo.hud}`);
if (!liberaDopo.inGioco) {
  errori.push('RIPRESA: dopo l interruzione la partita libera non si riapre, resta la home');
} else if (liberaDopo.hud !== liberaPrima.hud) {
  errori.push(`RIPRESA: la partita libera si riapre a un punto diverso ("${liberaPrima.hud}" -> "${liberaDopo.hud}")`);
}

// ---------- 2. Livello: si torna dentro, con lo stesso obiettivo e le stesse mosse ----------
// E' il caso che prima si perdeva sul serio: il livello non veniva salvato da nessuna parte.
console.log('2. livello interrotto: deve riaprirsi dov era...');
await daCapo();
await apriIlPrimoLivello();
for (let i = 0; i < 3; i += 1) await unaMossa();
const livelloPrima = await istantanea();
const salvato = await page.evaluate(() => window.localStorage.getItem('plinto:partita-quadro') !== null);
if (!salvato) errori.push('RIPRESA: il livello in corso non viene salvato in memoria');
await ricarica();
const livelloDopo = await istantanea();
await page.screenshot({ path: `${OUT}/2-livello.png` });
console.log(`   prima: ${livelloPrima.obiettivo}\n   dopo : ${livelloDopo.obiettivo}`);
if (!livelloDopo.inGioco) {
  errori.push('RIPRESA: dopo l interruzione il livello non si riapre, resta la home');
} else {
  // L'obiettivo porta sia l'avanzamento (0/2) sia le mosse rimaste: se una delle due
  // cambiasse, il livello sarebbe ripartito da capo pur sembrando lo stesso.
  if (livelloDopo.obiettivo !== livelloPrima.obiettivo) {
    errori.push(`RIPRESA: il livello riparte da un punto diverso ("${livelloPrima.obiettivo}" -> "${livelloDopo.obiettivo}")`);
  }
  if (livelloDopo.hud !== livelloPrima.hud) {
    errori.push(`RIPRESA: il punteggio del livello non e quello di prima ("${livelloPrima.hud}" -> "${livelloDopo.hud}")`);
  }
}

// ---------- 3. Assenza lunga: la home, non la partita di ieri ----------
console.log('3. assenza piu lunga della finestra: NON deve riaprirsi...');
await page.evaluate((finestra) => {
  const voce = JSON.parse(window.localStorage.getItem('plinto:ripresa'));
  voce.quando = Date.now() - finestra - 60_000;
  window.localStorage.setItem('plinto:ripresa', JSON.stringify(voce));
}, FINESTRA_RIPRESA);
await ricarica();
const dopoTanto = await istantanea();
await page.screenshot({ path: `${OUT}/3-assenza-lunga.png` });
if (dopoTanto.inGioco) {
  errori.push('RIPRESA: il gioco riapre da solo una partita lasciata oltre la finestra. Chi torna il giorno dopo si aspetta il menu.');
}
// Ma il livello e' ancora li' da riprendere a mano: la finestra decide se TORNARCI DA
// SOLI, non se buttare via il salvataggio.
const ancoraSalvato = await page.evaluate(() => window.localStorage.getItem('plinto:partita-quadro') !== null);
if (!ancoraSalvato) {
  errori.push('RIPRESA: passata la finestra il livello salvato viene buttato via. La finestra decide solo se tornarci da soli.');
}

// ---------- 4. Uscita volontaria: la home ----------
console.log('4. uscita volontaria dal livello: NON deve riaprirsi...');
await daCapo();
await apriIlPrimoLivello();
for (let i = 0; i < 2; i += 1) await unaMossa();
// Il tasto Indietro di Android, che e' il modo in cui si esce davvero.
await page.goBack();
await page.waitForTimeout(400);
const uscito = await page.evaluate(() => ({
  salvato: window.localStorage.getItem('plinto:partita-quadro') !== null,
  posto: window.localStorage.getItem('plinto:ripresa') !== null,
}));
if (uscito.salvato || uscito.posto) {
  errori.push(`RIPRESA: uscendo dal livello resta qualcosa da riprendere (salvato: ${uscito.salvato}, posto: ${uscito.posto})`);
}
await ricarica();
const dopoUscita = await istantanea();
await page.screenshot({ path: `${OUT}/4-uscita.png` });
if (dopoUscita.inGioco) {
  errori.push('RIPRESA: il gioco riapre un livello che il giocatore aveva lasciato di sua volonta');
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log(`\nTutto a posto. Immagini in ${OUT}`);
