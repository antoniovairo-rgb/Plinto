/**
 * La modalita' con l'anteprima, in un browser vero.
 *
 * Il test unitario prova che la terna mostrata e' quella consegnata su piu' di mille
 * mani. Questo scenario prova la cosa che il test unitario non puo' vedere: che quella
 * terna arrivi davvero SULLO SCHERMO, e che a mano esaurita quello che compare nel tray
 * sia proprio quello che era in anteprima.
 *
 * Uso: npm run anteprima
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { createGame, serializeGame } from '../../src/core/engine.js';
import { getShape } from '../../src/core/shapes.js';
import { MODALITA } from '../../src/config/rules.js';

/**
 * Una partita in modalita' anteprima con TRE PEZZI DA UNA CELLA in mano.
 *
 * La prima versione di questo scenario provava a esaurire la mano cliccando le celle una
 * dopo l'altra finche' una accettava il pezzo: con un blocco 3x3 in mano non ci riusciva,
 * e lo scenario accusava il gioco di non consegnare la terna. Il difetto era nel pilota.
 * Con tre pezzi da una cella su griglia vuota, esaurire la mano e' deterministico -- e
 * cio' che si vuole misurare non e' il trascinamento, che ha gia' il suo scenario, ma la
 * consegna della terna.
 *
 * `manoSuccessiva` NON viene toccata: e' quella vera, estratta dal motore.
 */

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-e2e';
await (await import('node:fs/promises')).mkdir(OUT, { recursive: true });
const errori = [];

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
    introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true,
  }));
});
await page.reload({ waitUntil: 'networkidle' });

// ---------- 1. Si entra nella modalita, e lo dice ----------
const conTrePunti = (() => {
  const base = createGame({ seed: 20260907, modalita: MODALITA.ANTEPRIMA });
  return serializeGame({
    ...base,
    hand: [
      { uid: 'n1', shapeId: 'p1', shape: getShape('p1'), color: 1 },
      { uid: 'n2', shapeId: 'p1', shape: getShape('p1'), color: 2 },
      { uid: 'n3', shapeId: 'p1', shape: getShape('p1'), color: 3 },
    ],
  });
})();
await page.evaluate((dati) => {
  window.localStorage.setItem('plinto:partita-anteprima', JSON.stringify(dati));
}, conTrePunti);
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Partita con anteprima/ }).click();
await page.waitForSelector('.pl-plancia');
const modalita = (await page.locator('.pl-modalita').innerText()).trim();
const strisce = await page.locator('.pl-anteprima').count();
await page.screenshot({ path: `${OUT}/anteprima-01.png` });
console.log(`1. modalita a schermo: "${modalita}" | strisce di anteprima: ${strisce}`);
if (!/anteprima/i.test(modalita)) errori.push(`ANTEPRIMA: la modalita a schermo dice "${modalita}"`);
if (strisce !== 1) errori.push(`ANTEPRIMA: ${strisce} strisce invece di una`);

// ---------- 1b. La striscia si deve VEDERE, non solo esistere ----------
// Questo controllo esiste perche' la prima versione passava con celle da 6 px e una
// striscia alta 23: c'era, e un giocatore ha aperto la modalita' e ha detto "non vedo
// l'anteprima dei pezzi". Aveva ragione. Verificare che un elemento sia nel DOM non
// e' verificare che qualcuno lo veda.
const dimensioni = await page.evaluate(() => {
  const striscia = document.querySelector('.pl-anteprima')?.getBoundingClientRect();
  const cella = document.querySelector('.pl-anteprima__cella')?.getBoundingClientRect();
  const tray = document.querySelector('.pl-tray .pl-pezzo .pl-pezzo__cella')?.getBoundingClientRect();
  return {
    altezza: striscia ? Math.round(striscia.height) : 0,
    larghezza: striscia ? Math.round(striscia.width) : 0,
    cella: cella ? Math.round(cella.width) : 0,
    cellaTray: tray ? Math.round(tray.width) : 0,
  };
});
console.log(
  `1b. striscia ${dimensioni.larghezza}x${dimensioni.altezza} px, `
  + `cella ${dimensioni.cella} px (nel tray ${dimensioni.cellaTray} px)`,
);
if (dimensioni.cella < 9) {
  errori.push(`ANTEPRIMA: celle da ${dimensioni.cella} px, illeggibili su un telefono`);
}
if (dimensioni.altezza < 34) {
  errori.push(`ANTEPRIMA: striscia alta ${dimensioni.altezza} px, passa inosservata`);
}
// E deve restare piu' piccola della mano vera: si distingue per DIMENSIONE, non per
// opacita' -- un'anteprima sbiadita farebbe fallire i contrasti.
if (dimensioni.cellaTray > 0 && dimensioni.cella >= dimensioni.cellaTray) {
  errori.push(
    `ANTEPRIMA: celle da ${dimensioni.cella} px, non piu' piccole di quelle del tray `
    + `(${dimensioni.cellaTray} px): si confonde con la mano vera`,
  );
}

/** Le forme mostrate in anteprima, come dimensioni della griglietta. */
const formeAnteprima = () => page.evaluate(() => (
  [...document.querySelectorAll('.pl-anteprima__pezzo')].map((p) => {
    const stile = getComputedStyle(p);
    return `${stile.gridTemplateRows.split(' ').length}x${stile.gridTemplateColumns.split(' ').length}`;
  })
));
/** Le forme nel tray, nello stesso formato. */
const formeTray = () => page.evaluate(() => (
  [...document.querySelectorAll('.pl-tray .pl-pezzo')].map((p) => {
    const stile = getComputedStyle(p);
    return `${stile.gridTemplateRows.split(' ').length}x${stile.gridTemplateColumns.split(' ').length}`;
  })
));

const previste = await formeAnteprima();
console.log(`2. terna in anteprima: ${previste.join(', ')}`);
if (previste.length !== 3) errori.push(`ANTEPRIMA: mostra ${previste.length} pezzi invece di 3`);

// ---------- 3. Si esauriscono i tre pezzi in mano ----------
/** Appoggia il primo pezzo disponibile su una cella vuota nota, a due tocchi. */
async function appoggiaSu(cella) {
  const prima = await page.locator('.pl-plancia .pl-blocco').count();
  await page.locator('.pl-tray .pl-pezzo-presa').first().click();
  await page.waitForTimeout(60);
  await page.locator('.pl-plancia .pl-cella').nth(cella).click();
  await page.waitForTimeout(80);
  return (await page.locator('.pl-plancia .pl-blocco').count()) !== prima;
}

let appoggiati = 0;
// Tre celle libere e lontane fra loro: nessuna riga, colonna o quadrante si chiude,
// quindi la mano si esaurisce senza che succeda nient'altro.
for (const cella of [0, 40, 80]) {
  if (await appoggiaSu(cella)) appoggiati += 1;
}
await page.waitForTimeout(200);
const consegnate = await formeTray();
const nuoveAnteprima = await formeAnteprima();
await page.screenshot({ path: `${OUT}/anteprima-02.png` });
console.log(`3. appoggiati ${appoggiati} pezzi | nel tray ora: ${consegnate.join(', ')}`);
console.log(`   nuova anteprima: ${nuoveAnteprima.join(', ')}`);

if (appoggiati !== 3) {
  errori.push(`ANTEPRIMA: appoggiati solo ${appoggiati} pezzi, la mano non si e esaurita`);
} else if (consegnate.join(',') !== previste.join(',')) {
  errori.push(
    `ANTEPRIMA: consegnata "${consegnate.join(', ')}" ma era stata mostrata "${previste.join(', ')}"`,
  );
}
if (nuoveAnteprima.join(',') === '' ) errori.push('ANTEPRIMA: dopo la consegna non c e piu nessuna anteprima');

// ---------- 4. Il tasto P porta il fuoco sull anteprima ----------
await page.locator('.pl-plancia').click({ position: { x: 5, y: 5 } }).catch(() => {});
await page.keyboard.press('p');
await page.waitForTimeout(120);
const fuoco = await page.evaluate(() => document.activeElement?.id ?? '');
console.log(`4. tasto P: fuoco su "${fuoco}"`);
if (fuoco !== 'pl-anteprima') errori.push(`TASTIERA: il tasto P non porta all anteprima (fuoco su "${fuoco}")`);

// ---------- 5. La partita base non ha nessuna anteprima ----------
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^(Partita libera|Riprendi la partita)(,|$)/ }).click();
await page.waitForSelector('.pl-plancia');
const nellaBase = await page.locator('.pl-anteprima').count();
console.log(`5. strisce di anteprima nella partita base: ${nellaBase}`);
if (nellaBase !== 0) errori.push('ANTEPRIMA: compare anche nella partita base');

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Anteprima: la terna mostrata e quella consegnata, e resta fuori dalla modalita base.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
