/**
 * Precisione del trascinamento.
 *
 * E' il gesto che il giocatore ripete centinaia di volte in una partita: se il pezzo
 * atterra una cella piu' in la' di dove lo si e' lasciato, il gioco sembra rotto anche
 * se tutte le regole sono giuste. Qui si verifica cella per cella, per ogni forma del
 * catalogo e in piu' punti della griglia, che il pezzo finisca ESATTAMENTE dove deve.
 *
 * Uso: npm run precisione
 */

import { chromium } from 'playwright';
import { createGame, serializeGame, deserializeGame } from '../../src/core/engine.js';
import {
  createGrid, shapeCellsAt, placeShape, findCompletedGroups, clearGroups,
} from '../../src/core/grid.js';
import { SHAPES, getShape } from '../../src/core/shapes.js';
import { existsSync } from 'node:fs';

/**
 * Percorso del browser.
 *
 * In questo ambiente di sviluppo Chromium e' preinstallato in una posizione fissa;
 * in integrazione continua e sulle macchine altrui lo installa Playwright, e quel
 * percorso non esiste. Se il percorso noto non c'e', si lascia decidere a Playwright
 * passando `undefined`: cosi' gli stessi script girano ovunque senza modifiche.
 */
const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;


const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

const errori = [];
let verifiche = 0;

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
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate(() => window.localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true })));

/** Prepara una partita con griglia vuota e una mano scelta, poi la apre. */
async function preparaPartita(idForme) {
  const base = createGame({ seed: 1, now: 0 });
  const stato = {
    ...base,
    grid: createGrid(),
    hand: idForme.map((id, i) => ({ uid: `p${i}`, shapeId: id, shape: getShape(id), color: 1 })),
  };
  await page.evaluate((s) => {
    window.localStorage.setItem('plinto:partita', JSON.stringify(s));
  }, serializeGame(stato));
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Riprendi la partita/ }).click();
  await page.waitForSelector('.pl-plancia');
}

/** Trascina il pezzo nello slot indicato in modo che la sua origine cada in (riga, colonna). */
async function trascina(slot, riga, colonna) {
  const punti = await page.evaluate(({ slot: s, riga: r, colonna: c }) => {
    const posto = document.querySelectorAll('.pl-tray .pl-tray__posto')[s];
    const pezzo = posto?.querySelector('.pl-pezzo');
    if (!pezzo) return null;
    const rp = pezzo.getBoundingClientRect();
    const cellaTray = pezzo.firstElementChild.getBoundingClientRect();
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const c0 = celle[0].getBoundingClientRect();
    const passoX = (celle[8].getBoundingClientRect().left - c0.left) / 8;
    const passoY = (celle[72].getBoundingClientRect().top - c0.top) / 8;
    const px = rp.left + rp.width / 2;
    const py = rp.top + rp.height / 2;
    const presaX = (px - rp.left) / cellaTray.width;
    const presaY = (py - rp.top) / cellaTray.height;
    return {
      px, py,
      cx: c0.left + c * passoX + presaX * c0.width,
      cy: c0.top + r * passoY + presaY * c0.height,
    };
  }, { slot, riga, colonna });
  if (!punti) return false;

  const prima = await page.evaluate(() => window.localStorage.getItem('plinto:partita'));
  await page.mouse.move(punti.px, punti.py);
  await page.mouse.down();
  await page.mouse.move(punti.cx, punti.cy, { steps: 6 });
  await page.mouse.up();
  // Si aspetta che il salvataggio CAMBI, non un tempo fisso: e' l'unico segnale
  // affidabile che la mossa e' stata registrata davvero.
  //
  // La finestra e' larga di proposito. Con 500 ms questa prova ha segnalato uno
  // scostamento inesistente mentre la macchina era occupata da un altro browser: il
  // pezzo era atterrato benissimo, solo qualche decina di millisecondi piu' tardi.
  // Una prova che accusa il codice giusto quando la macchina e' carica e' peggio di
  // inutile, perche' insegna a non fidarsi dei propri controlli. Attendere piu' a
  // lungo non costa niente quando le cose funzionano -- si esce al primo cambiamento
  // -- e toglie di mezzo l'unica causa di falsi allarmi che questa prova abbia avuto.
  const scadenza = Date.now() + 3000;
  while (Date.now() < scadenza) {
    const ora = await page.evaluate(() => window.localStorage.getItem('plinto:partita'));
    if (ora !== prima) return true;
    await page.waitForTimeout(15);
  }
  return false;
}

/** Griglia attuale letta dal salvataggio. */
async function grigliaAttuale() {
  const raw = await page.evaluate(() => window.localStorage.getItem('plinto:partita'));
  return deserializeGame(JSON.parse(raw)).grid;
}

// Posizioni di prova: angoli, bordi e centro. Sono i punti dove uno sfasamento
// di mezza cella si trasforma in una mossa rifiutata o in una casella sbagliata.
const POSIZIONI = [[0, 0], [0, 4], [4, 0], [3, 3], [6, 6]];

for (const forma of SHAPES) {
  for (const [riga, colonna] of POSIZIONI) {
    if (shapeCellsAt(forma, riga, colonna) === null) continue;  // la forma non ci sta li'

    // L'attesa deve tenere conto dell'eliminazione: un 3x3 appoggiato su un quadrante
    // allineato lo chiude e sparisce nello stesso istante. La prima versione di questo
    // test lo segnalava come errore di posizionamento, quando invece era il gioco che
    // funzionava. L'attesa si calcola quindi con il motore, non a mano.
    const posato = placeShape(createGrid(), forma, riga, colonna, 1);
    const attesoDopo = clearGroups(posato.grid, findCompletedGroups(posato.grid)).grid;
    const atteso = [];
    for (let i = 0; i < attesoDopo.length; i += 1) if (attesoDopo[i] !== 0) atteso.push(i);

    await preparaPartita([forma.id, 'p1', 'p1']);
    const fatto = await trascina(0, riga, colonna);
    verifiche += 1;

    if (!fatto) {
      errori.push(`${forma.id} verso (${riga},${colonna}): il pezzo non e stato posato`);
      continue;
    }
    const griglia = await grigliaAttuale();
    const piene = [];
    for (let i = 0; i < griglia.length; i += 1) if (griglia[i] !== 0) piene.push(i);
    const attesoOrdinato = [...atteso].sort((a, b) => a - b);
    if (JSON.stringify(piene) !== JSON.stringify(attesoOrdinato)) {
      const dove = (i) => `${Math.floor(i / 9)},${i % 9}`;
      errori.push(
        `${forma.id} verso (${riga},${colonna}): atteso [${attesoOrdinato.map(dove).join(' ')}] `
        + `ma trovato [${piene.map(dove).join(' ')}]`,
      );
    }
  }
}

await browser.close();
if (server) server.kill();

console.log(`\nPLINTO — precisione del trascinamento: ${verifiche} prove su ${SHAPES.length} forme\n`);
console.log('================ ESITO ================');
if (errori.length === 0) console.log(`Nessuno scostamento: ogni pezzo e atterrato esattamente dove doveva.`);
else {
  console.log(`${errori.length} scostamenti su ${verifiche} prove:`);
  errori.slice(0, 25).forEach((e) => console.log('  ', e));
}
process.exit(errori.length === 0 ? 0 : 1);
