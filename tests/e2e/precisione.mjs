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

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { createGame, serializeGame, deserializeGame } from '../../src/core/engine.js';
import {
  createGrid, shapeCellsAt, placeShape, findCompletedGroups, clearGroups,
} from '../../src/core/grid.js';
import { SHAPES, getShape } from '../../src/core/shapes.js';
import { quadroNumero } from '../../src/config/quadri.js';
import { iniziaQuadro, giocaNelQuadro } from '../../src/core/quadro.js';
import { sequenzaVincente, posizioneMossa } from '../../tools/sequenza-vincente.mjs';
import { existsSync } from 'node:fs';

/*
 * NOTA SULLA RIPRESA (dalla 1.10.1).
 *
 * Riaprendosi, il gioco torna DENTRO la partita se l'ultima mossa e' di meno di due ore
 * fa: e' la correzione del difetto "mettendo l'app in secondo piano si perde la partita"
 * (vedi src/persistence/ripresa.js). Dove questo file si aspetta la HOME va disattivata,
 * e non per comodita': questi controlli preparano uno scenario e vogliono partire dal
 * menu. Cancellare `plinto:ripresa` dice "nessuno e' stato interrotto", che e'
 * esattamente la situazione che stanno simulando.
 */

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
// Prima il collegamento stabile delle macchine di sviluppo (collaudo 1.21.25, O6: il
// percorso con il numero di versione cambia a ogni Playwright), poi quello vecchio; se
// nessuno c'e' (CI), decide Playwright.
const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', PERCORSO_NOTO].find((p) => p && existsSync(p));


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
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT', serviceWorkers: 'block' });
// Una pagina vuota della stessa origine, senza il gioco: da qui si scrive la memoria della
// partita da preparare senza che il gioco, ancora aperto, la riscriva (vedi preparaPartita).
const VUOTA = new URL('__prepara-precisione.html', INDIRIZZO).href;
await page.route(VUOTA, (route) => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>vuota</title>' }));
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
  // PRIMA SI ESCE DAL GIOCO, POI SI SCRIVE. Scrivendo con il gioco ancora aperto, un suo
  // salvataggio in arrivo (la partita appena giocata e il posto in cui riprenderla,
  // `segnaPosto` in src/state/usePartita.js) poteva arrivare dopo e vincere: alla ricarica
  // il gioco riapriva la partita vecchia direttamente, senza passare dalla home, e il
  // pulsante «Riprendi» non c'era. Rossa a intermittenza in CI dalla corsa 183 (19-20
  // ottobre 2026, runner ubuntu-26.04), mai in locale.
  await page.goto(VUOTA);
  await page.evaluate((s) => {
    window.localStorage.setItem('plinto:partita', JSON.stringify(s));
    window.localStorage.removeItem('plinto:ripresa');
  }, serializeGame(stato));
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  const riprendi = page.getByRole('button', { name: /riprendi la partita/i });
  try {
    await riprendi.waitFor({ timeout: 30000 });
  } catch (e) {
    // Se il pulsante non c'e', il registro deve dire che cosa c'era al suo posto: in CI
    // non si vede lo schermo, e «Timeout» da solo non distingue una causa dall'altra.
    const visto = await page.evaluate(() => ({
      indirizzo: location.href,
      plancia: Boolean(document.querySelector('.pl-plancia')),
      dialogo: document.querySelector('[role="dialog"]')?.innerText?.slice(0, 160) ?? null,
      testo: document.body.innerText.replace(/\s+/g, ' ').slice(0, 300),
      chiavi: Object.keys(localStorage).sort(),
    }));
    console.error('PRECISIONE: «Riprendi la partita» non trovato dopo la ricarica.', JSON.stringify(visto));
    throw e;
  }
  await riprendi.click();
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

// PLINTO_PRECISIONE_SOLO_VELOCE=1 salta le prove col mouse mentre si indaga il rilascio.
for (const forma of process.env.PLINTO_PRECISIONE_SOLO_VELOCE ? [] : SHAPES) {
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

/*
 * RILASCIO VELOCE COL DITO SU CPU LENTA (collaudo 1.21.25, D1; RILASCIO_DOVE_SI_STACCA in
 * src/ui/useTrascinamento.js). Le prove sopra trascinano col mouse e aspettano: il pezzo
 * ha sempre il tempo di essere disegnato nel punto d'arrivo prima del rilascio. Un dito che
 * si stacca in fretta su un telefono lento no: il `pointerup` arriva prima che React abbia
 * disegnato l'ultimo movimento. Qui: 360x640 col tocco, CPU rallentata 4 volte, livello 1
 * giocato col dito con la sequenza vincente del motore (12 movimenti senza pausa; l'ultimo
 * e il distacco mandati insieme, nello stesso fotogramma), e dopo OGNI mossa le caselle
 * piene a schermo confrontate con quelle del motore. Lo stesso con il dito che si ferma prima di staccarsi (6 movimenti fermi a 50 ms):
 * quello deve andare bene comunque, e dice che la prova misura il rilascio, non altro.
 * Misurato il 26 ottobre 2026 con l'interruttore spento: vedi docs/sviluppo/RAPPORTO-PO-036.md.
 */
const SEQUENZA_1 = sequenzaVincente(quadroNumero(1));
const PARTITE_VELOCI = Number(process.env.PLINTO_PRECISIONE_VELOCI ?? 3);
async function livello1ColDito({ pausa }) {
  const contesto = await browser.newContext({
    viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true,
    locale: 'it-IT', serviceWorkers: 'block',
  });
  const p = await contesto.newPage();
  p.setDefaultTimeout(15000);
  await p.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await p.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, tema: 'scuro', lingua: 'it', audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
    }));
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.locator('.pl-home__azioni .pl-btn--primario').tap();
  await p.getByRole('button', { name: /^Gioca$/ }).tap();
  await p.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
  await p.waitForTimeout(300);
  const cdp = await contesto.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const quadro = quadroNumero(1);
  let partita = iniziaQuadro(quadro, { now: 0 });
  const pieneMotore = () => Array.from(partita.grid).flatMap((v, i) => (v !== 0 ? [i] : [])).join(',');
  const pieneSchermo = () => p.evaluate(() => [...document.querySelectorAll('.pl-plancia .pl-cella')]
    .flatMap((c, i) => (/occupata$/.test(c.getAttribute('aria-label') ?? '') ? [i] : [])).join(','));
  let esito = { mossa: null, giocate: 0 };
  for (const [n, mossa] of SEQUENZA_1.entries()) {
    const punti = await posizioneMossa(p, mossa);
    if (!punti) { esito = { mossa: n + 1, giocate: n, motivo: 'pezzo non trovato' }; break; }
    // Col dito il pezzo si disegna 1,35 caselle sopra il dito (useTrascinamento.js).
    const lato = await p.evaluate(() => document.querySelector('.pl-plancia .pl-cella').getBoundingClientRect().width);
    const a = { x: punti.cx, y: punti.cy + 1.35 * lato };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: punti.px, y: punti.py }] });
    for (let i = 1; i <= 11; i += 1) {
      const x = punti.px + ((a.x - punti.px) * i) / 12, y = punti.py + ((a.y - punti.py) * i) / 12;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    if (pausa) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [a] });
      for (let i = 0; i < 6; i += 1) {
        await p.waitForTimeout(50);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [a] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    } else {
      // L'ultimo movimento e il distacco partono insieme, senza aspettare la risposta del
      // primo: il dito arriva e si stacca nello stesso fotogramma.
      await Promise.all([
        cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [a] }),
        cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }),
      ]);
    }
    partita = giocaNelQuadro(quadro, partita, mossa.handIndex, mossa.row, mossa.col, n * 1000);
    // L'ultima mossa chiude il livello e la griglia lascia il posto alla fine del livello:
    // li' si guarda che sia vinto.
    if (n === SEQUENZA_1.length - 1) {
      const vinto = await p.waitForSelector('.pl-quadro-esito--vinto', { timeout: 5000 }).then(() => true, () => false);
      if (!vinto) esito = { mossa: n + 1, giocate: n + 1, motivo: 'il livello non risulta vinto' };
      else esito.giocate = n + 1;
      break;
    }
    // Si aspetta che lo schermo arrivi alla griglia del motore; se non ci arriva in 3 s
    // (CPU lenta), la mossa e' finita altrove.
    const atteso = pieneMotore();
    const scadenza = Date.now() + 3000;
    let visto = await pieneSchermo();
    while (visto !== atteso && Date.now() < scadenza) { await p.waitForTimeout(50); visto = await pieneSchermo(); }
    if (visto !== atteso) {
      const a1 = new Set(atteso.split(',')), v1 = new Set(visto.split(','));
      const diverse = [...a1].filter((x) => !v1.has(x)).length + [...v1].filter((x) => !a1.has(x)).length;
      esito = { mossa: n + 1, giocate: n + 1, motivo: `${diverse} caselle diverse dal motore` };
      break;
    }
    esito.giocate = n + 1;
    // Fra una mossa e l'altra il dito si sposta sul vassoio: un istante, non un'attesa
    // che nasconda il difetto (il distacco e' gia' avvenuto).
    await p.waitForTimeout(150);
    if (await p.locator('.pl-quadro-esito').count() > 0) break;
  }
  await contesto.close();
  return esito;
}
if (!SEQUENZA_1) errori.push('RILASCIO VELOCE: il motore non trova una sequenza vincente del livello 1');
else {
  for (const pausa of [false, true]) {
    const partite = pausa ? 1 : PARTITE_VELOCI;
    for (let k = 0; k < partite; k += 1) {
      const e = await livello1ColDito({ pausa });
      verifiche += 1;
      const nome = pausa ? 'dito che si ferma' : 'rilascio veloce';
      console.log(`  ${nome}, CPU 4x, 360x640, livello 1 (partita ${k + 1}): ${e.mossa ? `DIVERSA alla mossa ${e.mossa} (${e.motivo})` : `uguale al motore per ${e.giocate} mosse`}`);
      if (e.mossa) errori.push(`${nome} col dito, CPU 4x, 360x640, livello 1: alla mossa ${e.mossa} ${e.motivo}`);
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
