/**
 * Le scenografie della mossa: onde d'urto, Tinta, deflagrazioni, griglia svuotata.
 *
 * PERCHE' ESISTE. Questi effetti vivono tutti nello stesso punto cieco: nascono da un
 * campo `lastMove` letto in un hook, finiscono su un canvas o su una classe CSS, e
 * nessuna prova pura puo' vederli. Se domani qualcuno rinomina `celleEsplose` o
 * cambia la soglia della Tinta, il gioco continua a funzionare e a dare gli stessi
 * punti -- semplicemente smette di festeggiare, in silenzio, e nessuno se ne accorge
 * finche' non lo nota un giocatore. E' successo con le particelle, ed e' il motivo per
 * cui `partita.mjs` conta i pixel del canvas invece di fidarsi.
 *
 * Ogni scena costruisce una partita a mano, fa UNA mossa e guarda cosa compare.
 * Le scene sono verificate anche "al contrario": una mossa senza Tinta non deve
 * accendere l'alone della Tinta, e una mossa che non svuota non deve accendere il lampo.
 * Senza questa meta', il controllo passerebbe anche se gli effetti fossero sempre accesi.
 *
 * Uso: npm run e2e-scenografie
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createGame, serializeGame } from '../../src/core/engine.js';
import { gridFromString, conBomba } from '../../src/core/grid.js';
import { getShape } from '../../src/core/shapes.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-scenografie';
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
page.on('pageerror', (e) => errori.push(`ERRORE DI PAGINA: ${e.message}`));
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
if (await page.locator('.pl-intro__regole').count() > 0) {
  await page.getByRole('button', { name: /Non mostrarmela/ }).click();
  await page.waitForSelector('.pl-home');
}

const base = createGame({ seed: 7 });
const vuote = () => Array.from({ length: 9 }, () => Array(9).fill('.'));
const mano = () => [
  { uid: 'z1', shapeId: 'p1', shape: getShape('p1'), color: 1 },
  { uid: 'z2', shapeId: 'h2', shape: getShape('h2'), color: 2 },
  { uid: 'z3', shapeId: 'v2', shape: getShape('v2'), color: 3 },
];

/** Griglia da righe di testo, con un colore per tutte le celle piene. */
function tinteggia(righe, colore) {
  const g = gridFromString(righe.map((r) => r.join('')).join('\n'));
  for (let i = 0; i < g.length; i += 1) if (g[i] !== 0) g[i] = colore;
  return g;
}

/** Griglia da righe di testo, con i colori mescolati (niente Tinta). */
function mescola(righe) {
  const g = gridFromString(righe.map((r) => r.join('')).join('\n'));
  for (let i = 0; i < g.length; i += 1) if (g[i] !== 0) g[i] = ((i % 4) + 1);
  return g;
}

/**
 * Gioca una mossa sola su una partita costruita a mano e riferisce cosa si vede
 * mentre l'eliminazione e' ancora in corso.
 */
async function scena(nome, stato, bersaglio) {
  await page.evaluate((s) => {
    window.localStorage.setItem('plinto:partita', JSON.stringify(s));
    window.localStorage.removeItem('plinto:ripresa');
  }, serializeGame(stato));
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Riprendi/ }).click();
  await page.waitForSelector('.pl-plancia');
  const b = await page.evaluate((i) => {
    const c = document.querySelectorAll('.pl-plancia .pl-cella')[i].getBoundingClientRect();
    const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
    return {
      cx: c.left + c.width / 2, cy: c.top + c.height / 2,
      px: p.left + p.width / 2, py: p.top + p.height / 2,
    };
  }, bersaglio);
  await page.mouse.move(b.px, b.py);
  await page.mouse.down();
  await page.mouse.move(b.cx, b.cy, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(60);
  const visto = await page.evaluate(() => {
    const canvas = document.querySelector('.pl-plancia__particelle');
    const ctx = canvas.getContext('2d');
    const dati = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let opachi = 0;
    for (let i = 3; i < dati.length; i += 4) if (dati[i] > 0) opachi += 1;
    return {
      esplosi: document.querySelectorAll('.pl-blocco--esploso').length,
      saltati: document.querySelectorAll('.pl-blocco--saltato').length,
      tinta: document.querySelectorAll('.pl-blocco--tinta').length,
      lampo: document.querySelectorAll('.pl-plancia__lampo').length,
      pixel: opachi,
    };
  });
  await page.screenshot({ path: `${OUT}/${nome}.png` });
  console.log(`${nome}: esplosi ${visto.esplosi} | saltati ${visto.saltati} | con Tinta ${visto.tinta}`
    + ` | lampo ${visto.lampo} | pixel disegnati ${visto.pixel}`);
  return visto;
}

// ---------- 1. Tinta: riga tutta di un colore ----------
console.log('1. la Tinta ha un alone tutto suo...');
{
  const r = vuote();
  for (let c = 0; c < 8; c += 1) r[0][c] = '#';
  r[5][5] = '#';
  const v = await scena('1-tinta', { ...base, grid: tinteggia(r, 1), hand: mano() }, 8);
  controlla('TINTA: la riga non sparisce', v.esplosi === 9);
  controlla('TINTA: i blocchi non prendono l alone della Tinta', v.tinta === 9);
  controlla('TINTA: il canvas resta vuoto (niente onda ne schegge)', v.pixel > 0);
  controlla('TINTA: si accende il lampo dello svuotamento senza che la griglia sia vuota',
    v.lampo === 0);
}

// ---------- 2. Nessuna Tinta: stessa riga, colori mescolati ----------
// La meta' "al contrario": senza questa, il controllo passerebbe anche con l'alone
// sempre acceso, cioe' senza provare niente.
console.log('2. senza Tinta l alone non si accende...');
{
  const r = vuote();
  for (let c = 0; c < 8; c += 1) r[0][c] = '#';
  r[5][5] = '#';
  const v = await scena('2-senza-tinta', { ...base, grid: mescola(r), hand: mano() }, 8);
  controlla('SENZA TINTA: la riga non sparisce', v.esplosi === 9);
  controlla('SENZA TINTA: l alone della Tinta si accende comunque', v.tinta === 0);
  controlla('SENZA TINTA: il canvas resta vuoto', v.pixel > 0);
}

// ---------- 3. Bomba: cinque celle portate via dall esplosione ----------
console.log('3. la bomba fa saltare le celle attorno...');
{
  const r = vuote();
  for (let c = 0; c < 8; c += 1) r[4][c] = '#';
  for (const c of [1, 2]) r[3][c] = '#';
  for (const c of [0, 1, 2]) r[5][c] = '#';
  const g = mescola(r);
  g[4 * 9 + 1] = conBomba(g[4 * 9 + 1]);
  const v = await scena('3-bomba', { ...base, grid: g, hand: mano() }, 4 * 9 + 8);
  controlla(`BOMBA: le celle fatte saltare non sono cinque (${v.saltati})`, v.saltati === 5);
  controlla('BOMBA: il canvas resta vuoto', v.pixel > 0);
}

// ---------- 4. Griglia svuotata: il lampo ----------
console.log('4. la griglia svuotata accende il lampo...');
{
  const r = vuote();
  for (let c = 0; c < 8; c += 1) r[4][c] = '#';
  const v = await scena('4-svuotamento', { ...base, grid: tinteggia(r, 3), hand: mano() }, 4 * 9 + 8);
  controlla('SVUOTAMENTO: la griglia si svuota ma il lampo non compare', v.lampo === 1);
}

// ---------- 5. A riposo il canvas torna pulito ----------
// Le onde d'urto vivono nello stesso ciclo delle schegge: se una di loro non scadesse,
// il requestAnimationFrame resterebbe acceso per sempre a ridisegnare un anello fermo.
console.log('5. a riposo il canvas si ripulisce...');
await page.waitForTimeout(1600);
const residuo = await page.evaluate(() => {
  const canvas = document.querySelector('.pl-plancia__particelle');
  const dati = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let opachi = 0;
  for (let i = 3; i < dati.length; i += 4) if (dati[i] > 0) opachi += 1;
  return opachi;
});
console.log(`5. pixel rimasti sul canvas a riposo: ${residuo}`);
controlla('RIPOSO: il canvas non si ripulisce dopo la fine degli effetti', residuo === 0);

// ---------- 6. Il canvas sopravvive al secondo piano ----------
/*
 * IL DIFETTO CHE QUESTO CONTROLLO IMPEDISCE. Su un telefono vero, mettendo l'app in
 * secondo piano e riaprendola, al posto della plancia compariva un rettangolo BIANCO con
 * l'icona dell'immagine rotta. Non e' un'immagine che non si carica: in quella schermata
 * non ce n'e' nemmeno una. E' il canvas delle particelle, che sta sopra la plancia e la
 * copre tutta: Android ne aveva buttato via la memoria di disegno per far posto, e il
 * browser al ritorno ci aveva messo il segnaposto.
 *
 * Qui non si puo' far recuperare memoria ad Android, ma si puo' provare la difesa: che
 * nascondendo la pagina il canvas venga azzerato (niente memoria da buttare via, niente
 * che possa tornare rotto), che al ritorno venga ricostruito alle misure giuste, e --
 * la parte che conta davvero -- che DOPO quel giro gli effetti funzionino ancora. Una
 * difesa che spegne le particelle per sempre sarebbe un difetto peggiore di quello che
 * cura.
 */
console.log('6. il canvas sopravvive al secondo piano...');
const misure = () => page.evaluate(() => {
  const c = document.querySelector('.pl-plancia__particelle');
  const r = c.getBoundingClientRect();
  return { w: c.width, h: c.height, largo: Math.round(r.width), alto: Math.round(r.height) };
});
const prima = await misure();
controlla('il canvas non ha una memoria di disegno prima di nascondere la pagina',
  prima.w > 0 && prima.h > 0);

/** Finge che la pagina vada in secondo piano e poi torni. */
async function visibilita(stato) {
  await page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { value: s, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, stato);
  await page.waitForTimeout(120);
}

await visibilita('hidden');
const nascosto = await misure();
console.log(`   in secondo piano: memoria del canvas ${nascosto.w}x${nascosto.h}`);
controlla(`in secondo piano il canvas tiene ancora ${nascosto.w}x${nascosto.h} di memoria da perdere`,
  nascosto.w === 0 && nascosto.h === 0);

await visibilita('visible');
const tornato = await misure();
console.log(`   al ritorno: memoria del canvas ${tornato.w}x${tornato.h} su ${tornato.largo}x${tornato.alto} CSS`);
controlla(`al ritorno il canvas non e stato ricostruito (${tornato.w}x${tornato.h})`,
  tornato.w === prima.w && tornato.h === prima.h);
controlla('al ritorno il canvas non e vuoto: resterebbe a schermo il disegno di prima',
  (await page.evaluate(() => {
    const c = document.querySelector('.pl-plancia__particelle');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) return false;
    return true;
  })));

// E adesso la parte che conta: gli effetti devono funzionare ancora.
{
  const r = vuote();
  for (let c = 0; c < 8; c += 1) r[0][c] = '#';
  r[5][5] = '#';
  const v = await scena('6-dopo-secondo-piano', { ...base, grid: tinteggia(r, 1), hand: mano() }, 8);
  controlla('dopo un giro in secondo piano le particelle non si disegnano piu', v.pixel > 0);
  controlla('dopo un giro in secondo piano l eliminazione non si vede piu', v.esplosi === 9);
}

// ---------- 7. Un contesto perso si riprende ----------
// La seconda difesa, per quando la memoria salta a pagina visibile: il browser manda
// `contextlost`, e senza un preventDefault il canvas resta rotto per sempre.
console.log('7. un contesto perso viene ripreso...');
const ripreso = await page.evaluate(() => {
  const c = document.querySelector('.pl-plancia__particelle');
  const perso = new Event('contextlost', { cancelable: true });
  c.dispatchEvent(perso);
  const fermato = perso.defaultPrevented;
  c.dispatchEvent(new Event('contextrestored'));
  return { fermato, w: c.width, h: c.height };
});
console.log(`   contextlost fermato: ${ripreso.fermato} | canvas ${ripreso.w}x${ripreso.h}`);
controlla('contextlost non viene fermato: il browser non ripristinera il canvas',
  ripreso.fermato === true);
controlla('dopo contextrestored il canvas resta senza memoria di disegno',
  ripreso.w > 0 && ripreso.h > 0);

await browser.close();
server?.kill();

console.log('\n================ ESITO ================');
if (errori.length) {
  console.log(`${errori.length} problemi:`);
  for (const e of errori) console.log(`  - ${e}`);
  process.exit(1);
}
console.log('Nessun problema rilevato.');
