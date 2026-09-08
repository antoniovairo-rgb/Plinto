/**
 * L'archivio delle sfide, in un browser vero.
 *
 * Che cosa verifica, in ordine:
 *   1. il calendario e' una TABELLA vera, con intestazioni di riga e di colonna;
 *   2. i giorni futuri sono spenti, e la loro etichetta dice PERCHE';
 *   3. si naviga da tastiera: frecce fra i giorni, PagSu/PagGiu fra i mesi;
 *   4. aprendo un giorno passato parte la sfida DI QUEL GIORNO;
 *   5. finendo quella partita il punteggio finisce nel giorno giusto -- non in oggi;
 *   6. tornando nell'archivio, quel giorno mostra il punteggio.
 *
 * Il passo 5 e' quello che conta di piu' e non si vede giocando: prima dell'archivio il
 * risultato veniva sempre registrato sulla data di oggi, perche' non esisteva altro
 * giorno possibile. Un punteggio finito nel giorno sbagliato non rompe niente, non
 * genera nessun errore, e falsifica in silenzio l'unica cosa che l'archivio racconta.
 *
 * Uso: npm run archivio
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { createGame, serializeGame } from '../../src/core/engine.js';
import { gridFromString } from '../../src/core/grid.js';
import { getShape } from '../../src/core/shapes.js';
import { PRIMA_SFIDA, giornoDiOggi, giornoPiu } from '../../src/core/sfida.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-e2e';
await (await import('node:fs/promises')).mkdir(OUT, { recursive: true });
const errori = [];

// Il giorno d'archivio su cui si lavora: ieri, se esiste una sfida di ieri; altrimenti
// la primissima. Non si sceglie una data fissa, che scadrebbe.
const OGGI = giornoDiOggi();
const IERI = giornoPiu(OGGI, -1);
const GIORNO = IERI >= PRIMA_SFIDA ? IERI : PRIMA_SFIDA;

// Una partita di QUEL giorno a una mossa dalla fine.
//
// La griglia ha ESATTAMENTE DUE CELLE LIBERE per ogni riga, per ogni colonna e per ogni
// quadrante. Serve perche' la prima versione di questo scenario riempiva tutto tranne
// due caselle in fondo: cosi' facendo lasciava otto righe GIA' complete sul tabellone,
// e la mossa successiva non finiva la partita -- svuotava la griglia e la partita
// continuava. Lo scenario accusava il gioco di non registrare il punteggio; il difetto
// era qui. Con due celle libere per gruppo, appoggiare un pezzo da una cella non chiude
// niente, e gli altri due pezzi in mano (3x3 e linea da 5) non entrano piu': game over
// legittimo.
const quasiFinita = (() => {
  const base = createGame({ seed: GIORNO });
  return serializeGame({
    ...base,
    grid: (() => {
      const vuote = [
        [0, 0], [1, 3], [2, 6], [3, 1], [4, 4], [5, 7], [6, 2], [7, 5], [8, 8],
        [0, 4], [1, 7], [2, 1], [3, 5], [4, 8], [5, 2], [6, 6], [7, 0], [8, 3],
      ];
      const righe = Array.from({ length: 9 }, () => Array(9).fill('#'));
      vuote.forEach(([r, c]) => { righe[r][c] = '.'; });
      return gridFromString(righe.map((r) => r.join('')).join('\n'));
    })(),
    hand: [
      { uid: 'a1', shapeId: 'p1', shape: getShape('p1'), color: 1 },
      { uid: 'a2', shapeId: 'b33', shape: getShape('b33'), color: 2 },
      { uid: 'a3', shapeId: 'h5', shape: getShape('h5'), color: 3 },
    ],
    score: 1234,
  });
})();

let server = null;
async function serverRisponde() {
  try {
    const r = await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: false,
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) {
    await new Promise((r) => setTimeout(r, 400));
  }
  if (!(await serverRisponde())) {
    console.error('Impossibile avviare il server di sviluppo su', INDIRIZZO);
    process.exit(1);
  }
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'it-IT',
});
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
  }));
  window.localStorage.removeItem('plinto:sfide');
  window.localStorage.removeItem('plinto:partita-sfida');
});
await page.reload({ waitUntil: 'networkidle' });

// ---------- 1. Il calendario e' una tabella vera ----------
await page.getByRole('button', { name: /Archivio delle sfide/ }).click();
await page.waitForSelector('.pl-calendario');
const struttura = await page.evaluate(() => {
  const tabella = document.querySelector('table.pl-calendario');
  if (!tabella) return null;
  return {
    colonne: tabella.querySelectorAll('th[scope="col"]').length,
    righe: tabella.querySelectorAll('th[scope="row"]').length,
    didascalia: Boolean(tabella.querySelector('caption')),
    giorni: tabella.querySelectorAll('button.pl-giorno').length,
  };
});
await page.screenshot({ path: `${OUT}/archivio-01.png` });
console.log(`1. calendario: ${struttura?.colonne} intestazioni di colonna, ${struttura?.righe} di riga, ${struttura?.giorni} giorni`);
if (!struttura) errori.push('ARCHIVIO: il calendario non e una <table>');
else {
  // Sette giorni della settimana piu' la colonna delle settimane.
  if (struttura.colonne !== 8) errori.push(`ARCHIVIO: ${struttura.colonne} intestazioni di colonna invece di 8`);
  if (struttura.righe < 4) errori.push(`ARCHIVIO: solo ${struttura.righe} intestazioni di riga`);
  if (!struttura.didascalia) errori.push('ARCHIVIO: la tabella non ha didascalia');
  if (struttura.giorni < 28) errori.push(`ARCHIVIO: solo ${struttura.giorni} giorni nel mese`);
}

// ---------- 2. Il futuro e spento, e dice perche ----------
const futuro = await page.evaluate(() => {
  const spenti = [...document.querySelectorAll('button.pl-giorno[disabled]')];
  return {
    quanti: spenti.length,
    conMotivo: spenti.filter((b) => /futur|esisteva/i.test(b.getAttribute('aria-label') ?? '')).length,
    esempio: spenti[0]?.getAttribute('aria-label') ?? '',
  };
});
console.log(`2. giorni non apribili: ${futuro.quanti}, di cui con la spiegazione ${futuro.conMotivo}`);
if (futuro.quanti > 0 && futuro.conMotivo !== futuro.quanti) {
  errori.push(`ARCHIVIO: ${futuro.quanti - futuro.conMotivo} giorni spenti non dicono perche`);
}

// ---------- 3. Tastiera: frecce fra i giorni, PagSu fra i mesi ----------
await page.locator('button.pl-giorno[tabindex="0"]').focus();
const partenza = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
await page.keyboard.press('ArrowLeft');
await page.waitForTimeout(80);
const dopoFreccia = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
const mesePrima = await page.locator('.pl-archivio__mese').innerText();
// Il mese precedente esiste solo se contiene almeno una sfida: appena dopo la prima
// sfida in assoluto non c'e' nessun mese dove andare, e allora PagSu NON deve fare
// niente. La prova si adatta invece di dare per scontato un calendario lungo -- una
// prova che pretende di poter tornare indietro fallirebbe per il motivo sbagliato.
const cePrima = await page.locator('.pl-archivio__freccia').first().isEnabled();
await page.keyboard.press('PageUp');
await page.waitForTimeout(200);
const meseDopo = await page.locator('.pl-archivio__mese').innerText();
console.log(`3. tastiera: "${partenza?.slice(0, 14)}" -> "${dopoFreccia?.slice(0, 14)}" | mese ${mesePrima} -> ${meseDopo} (mese precedente disponibile: ${cePrima})`);
if (!dopoFreccia || dopoFreccia === partenza) errori.push('ARCHIVIO: la freccia sinistra non sposta il fuoco');
if (cePrima && meseDopo === mesePrima) errori.push('ARCHIVIO: PagSu non cambia mese');
if (!cePrima && meseDopo !== mesePrima) {
  errori.push('ARCHIVIO: PagSu porta in un mese senza sfide');
}

// ---------- 4. Aprire un giorno passato apre la sfida DI QUEL GIORNO ----------
// La partita a una mossa dalla fine viene messa nello slot della sfida: aprendo quel
// giorno il gioco deve RIPRENDERLA, non ricominciarla da capo.
await page.evaluate((dati) => {
  window.localStorage.setItem('plinto:partita-sfida', JSON.stringify(dati));
}, quasiFinita);
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Archivio delle sfide/ }).click();
await page.waitForSelector('.pl-calendario');
await page.locator(`button.pl-giorno[aria-label^="${Number(GIORNO.slice(8))} "]`).first().click();
await page.waitForSelector('.pl-plancia');
const ripresa = await page.evaluate(() => ({
  blocchi: document.querySelectorAll('.pl-plancia .pl-blocco').length,
  modalita: document.querySelector('.pl-modalita')?.textContent ?? '',
}));
await page.screenshot({ path: `${OUT}/archivio-02.png` });
console.log(`4. sfida del ${GIORNO} ripresa: ${ripresa.blocchi} blocchi sulla plancia, intestazione "${ripresa.modalita.replace(/\s+/g, ' ').trim()}"`);
if (ripresa.blocchi !== 63) {
  errori.push(`ARCHIVIO: la partita ripresa ha ${ripresa.blocchi} blocchi invece dei 63 salvati`);
}

/**
 * L'intestazione deve dire QUALE giorno si sta giocando.
 *
 * Diceva solo "Sfida del giorno", cioe' il nome della modalita': dentro la partita, la
 * sfida di oggi e una qualunque riaperta dall'archivio erano indistinguibili. Un giocatore
 * ha aperto la schermata e ha detto "non si capisce qual e' la sfida del giorno" -- e aveva
 * ragione due volte, perche' non si capiva ne' quale giorno ne' che cosa chiedesse.
 */
const giornoDelMese = String(Number(GIORNO.slice(8)));
if (!ripresa.modalita.includes(giornoDelMese)) {
  errori.push(
    `ARCHIVIO: l intestazione dice "${ripresa.modalita.replace(/\s+/g, ' ').trim()}" `
    + `e non nomina il giorno ${giornoDelMese} che si sta giocando`,
  );
}
if (/di oggi/i.test(ripresa.modalita)) {
  errori.push('ARCHIVIO: una sfida passata viene presentata come quella di oggi');
}

// ---------- 5. Il punteggio finisce nel giorno giusto ----------
const bersaglio = await page.evaluate(() => {
  const c = document.querySelectorAll('.pl-plancia .pl-cella')[0].getBoundingClientRect();
  const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
  return {
    cx: c.left + c.width / 2, cy: c.top + c.height / 2,
    px: p.left + p.width / 2, py: p.top + p.height / 2,
  };
});
await page.mouse.move(bersaglio.px, bersaglio.py);
await page.mouse.down();
await page.mouse.move(bersaglio.cx, bersaglio.cy, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(900);

const salvate = await page.evaluate(() => JSON.parse(window.localStorage.getItem('plinto:sfide') ?? 'null'));
const giorni = Object.keys(salvate?.giorni ?? {});
console.log(`5. giorni registrati: ${giorni.join(', ') || '(nessuno)'}`);
if (!giorni.includes(GIORNO)) {
  errori.push(`ARCHIVIO: il punteggio non e stato registrato sul ${GIORNO} (registrati: ${giorni.join(', ') || 'nessuno'})`);
}
if (GIORNO !== OGGI && giorni.includes(OGGI)) {
  errori.push(`ARCHIVIO: il punteggio di una sfida d archivio e finito su OGGI (${OGGI})`);
}
if (salvate?.giorni?.[GIORNO] && !salvate.giorni[GIORNO].regole) {
  errori.push('ARCHIVIO: il risultato non porta l impronta delle regole');
}

// ---------- 6. Il calendario mostra quel punteggio ----------
await page.getByRole('button', { name: /Torna|Home|Chiudi/ }).first().click().catch(() => {});
await page.waitForTimeout(200);
if (await page.locator('.pl-home').count() === 0) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
}
await page.getByRole('button', { name: /Archivio delle sfide/ }).click();
await page.waitForSelector('.pl-calendario');
const cella = await page.evaluate((giorno) => {
  const numero = Number(giorno.slice(8));
  const bottone = [...document.querySelectorAll('button.pl-giorno')]
    .find((b) => Number(b.querySelector('.pl-giorno__numero')?.textContent) === numero);
  return {
    etichetta: bottone?.getAttribute('aria-label') ?? '',
    punti: bottone?.querySelector('.pl-giorno__punti')?.textContent ?? '',
    segno: bottone?.querySelector('.pl-giorno__segno')?.textContent ?? '',
  };
}, GIORNO);
await page.screenshot({ path: `${OUT}/archivio-03.png` });
console.log(`6. la casella del ${GIORNO}: punti "${cella.punti}", segno "${cella.segno}"`);
if (!cella.punti) errori.push('ARCHIVIO: il giorno giocato non mostra il punteggio nel calendario');
if (!cella.segno) errori.push('ARCHIVIO: il giorno giocato non ha il segno geometrico (il colore da solo non basta)');
if (!/record/i.test(cella.etichetta)) {
  errori.push(`ARCHIVIO: l etichetta del giorno giocato non nomina il record: "${cella.etichetta}"`);
}

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Archivio: calendario accessibile, giorni passati giocabili, punteggi nel giorno giusto.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
