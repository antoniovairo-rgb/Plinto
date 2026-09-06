import { chromium } from 'playwright';
import { createGame, serializeGame } from '../../src/core/engine.js';
import { gridFromString } from '../../src/core/grid.js';
import { getShape } from '../../src/core/shapes.js';

const OUT = process.env.QUADRA_E2E_OUT ?? '/tmp/quadra-e2e';
await (await import('node:fs/promises')).mkdir(OUT, { recursive: true });
const errori = [];

// Partita costruita a mano: una sola mossa possibile, poi game over.
const quasiFinita = (() => {
  const base = createGame({ seed: 1 });
  const stato = {
    ...base,
    // Griglia quasi piena costruita in modo che NESSUN gruppo sia gia' completo:
    // esattamente due celle vuote per ogni riga, per ogni colonna e per ogni quadrante.
    // Riempirne una non chiude nulla, e gli altri due pezzi (3x3 e linea da 5) non
    // entrano piu' da nessuna parte: game over legittimo alla mossa successiva.
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
      { uid: 'x1', shapeId: 'p1', shape: getShape('p1'), color: 1 },
      { uid: 'x2', shapeId: 'b33', shape: getShape('b33'), color: 2 },
      { uid: 'x3', shapeId: 'h5', shape: getShape('h5'), color: 3 },
    ],
    score: 4321,
  };
  return serializeGame(stato);
})();

// Il server di sviluppo viene avviato qui se non risponde gia': cosi' `npm run e2e`
// funziona da solo, senza ricordarsi di aprire prima un altro terminale.
const INDIRIZZO = process.env.QUADRA_E2E_URL ?? 'http://localhost:5173/';
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

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'it-IT' });
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));

const contaBlocchi = () => page.locator('.q-plancia .q-blocco').count();
const punteggio = () => page.locator('.q-hud__punteggio .q-hud__valore').innerText();

// ---------- 0. Primo avvio: la presentazione deve comparire una volta sola ----------
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
const introVisibile = await page.locator('.q-intro__regole li').count();
await page.screenshot({ path: `${OUT}/00-primo-avvio.png` });
console.log('0. presentazione al primo avvio: regole mostrate', introVisibile);
if (introVisibile !== 3) errori.push('PRIMO AVVIO: la presentazione non mostra le tre regole');
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.q-plancia');
await page.reload({ waitUntil: 'networkidle' });
if (await page.locator('.q-intro__regole').count() !== 0) {
  errori.push('PRIMO AVVIO: la presentazione ricompare dopo il primo avvio');
}

// ---------- 1. Home ----------
await page.evaluate(() => window.localStorage.removeItem('quadra:partita'));
await page.reload({ waitUntil: 'networkidle' });
await page.screenshot({ path: `${OUT}/01-home.png` });
console.log('1. home caricata, titolo:', await page.title());

// ---------- 2. Avvio partita ----------
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.q-plancia');
await page.screenshot({ path: `${OUT}/02-partita.png` });
console.log('2. partita avviata. Blocchi sulla griglia:', await contaBlocchi(), '| punteggio:', await punteggio());

// ---------- 3. Trascinamento con mouse ----------
const geo = await page.evaluate(() => {
  const pezzo = document.querySelectorAll('.q-tray .q-pezzo')[0];
  const r = pezzo.getBoundingClientRect();
  const celle = document.querySelectorAll('.q-plancia .q-cella');
  const c40 = celle[4 * 9 + 4].getBoundingClientRect();
  const stile = getComputedStyle(pezzo);
  const colonne = stile.gridTemplateColumns.split(' ').length;
  const righe = stile.gridTemplateRows.split(' ').length;
  return {
    pezzo: { x: r.left + r.width / 2, y: r.top + r.height / 2, w: colonne, h: righe },
    bersaglio: { x: c40.left + c40.width / 2, y: c40.top + c40.height / 2, cella: c40.width },
  };
});

const prima = await contaBlocchi();
await page.mouse.move(geo.pezzo.x, geo.pezzo.y);
await page.mouse.down();
await page.mouse.move(geo.bersaglio.x, geo.bersaglio.y, { steps: 12 });
await page.screenshot({ path: `${OUT}/03-trascinamento.png` });
const anteprima = await page.locator('.q-cella--anteprima').count();
await page.mouse.up();
await page.waitForTimeout(120);
const dopo = await contaBlocchi();
await page.screenshot({ path: `${OUT}/04-posizionato.png` });
console.log(`3. trascinamento mouse: celle in anteprima ${anteprima} | blocchi ${prima} -> ${dopo}`);
if (dopo <= prima) errori.push('TRASCINAMENTO: nessun blocco posizionato dopo il drag con mouse');
if (anteprima === 0) errori.push('ANTEPRIMA: nessuna cella evidenziata durante il trascinamento');

// ---------- 3b. Eliminazione: animazioni, particelle e punti volanti ----------
// Griglia con la riga 0 piena tranne l'ultima cella e la mano che comincia con un punto:
// una sola mossa e la riga sparisce. Serve a verificare il feedback, non le regole.
const quasiRiga = (() => {
  const base = createGame({ seed: 2 });
  const righe = Array.from({ length: 9 }, () => Array(9).fill('.'));
  for (let c = 0; c < 8; c += 1) righe[0][c] = '#';
  righe[5][5] = '#';
  return serializeGame({
    ...base,
    grid: gridFromString(righe.map((r) => r.join('')).join('\n')),
    hand: [
      { uid: 'y1', shapeId: 'p1', shape: getShape('p1'), color: 4 },
      { uid: 'y2', shapeId: 'h2', shape: getShape('h2'), color: 2 },
      { uid: 'y3', shapeId: 'v2', shape: getShape('v2'), color: 3 },
    ],
  });
})();

await page.evaluate((s) => window.localStorage.setItem('quadra:partita', JSON.stringify(s)), quasiRiga);
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Riprendi/ }).click();
await page.waitForSelector('.q-plancia');
const bersaglioRiga = await page.evaluate(() => {
  const c = document.querySelectorAll('.q-plancia .q-cella')[8].getBoundingClientRect();
  const p = document.querySelectorAll('.q-tray .q-pezzo')[0].getBoundingClientRect();
  return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 };
});
await page.mouse.move(bersaglioRiga.px, bersaglioRiga.py);
await page.mouse.down();
await page.mouse.move(bersaglioRiga.cx, bersaglioRiga.cy, { steps: 10 });
const incandidate = await page.locator('.q-cella--incandidata').count();
await page.mouse.up();
await page.waitForTimeout(60);
const esplosi = await page.locator('.q-blocco--esploso').count();
const punti = await page.locator('.q-punti-volanti').count();
const particelleDisegnate = await page.evaluate(() => {
  const cv = document.querySelector('.q-plancia__particelle');
  const ctx = cv.getContext('2d');
  const dati = ctx.getImageData(0, 0, cv.width, cv.height).data;
  let opachi = 0;
  for (let i = 3; i < dati.length; i += 4) if (dati[i] > 0) opachi += 1;
  return opachi;
});
await page.screenshot({ path: `${OUT}/03b-eliminazione.png` });
console.log(`3b. eliminazione: celle preannunciate ${incandidate} | blocchi in esplosione ${esplosi} | punti volanti ${punti} | pixel di particelle ${particelleDisegnate}`);
if (incandidate !== 9) errori.push(`AIUTO VISIVO: la riga che sta per chiudersi dovrebbe evidenziare 9 celle, ne evidenzia ${incandidate}`);
if (esplosi === 0) errori.push('ANIMAZIONE: nessun blocco in esplosione dopo un eliminazione');
if (punti === 0) errori.push('FEEDBACK: nessun punteggio volante dopo un eliminazione');
if (particelleDisegnate === 0) errori.push('PARTICELLE: il canvas resta vuoto dopo un eliminazione');
await page.waitForTimeout(600);
const esplosiDopo = await page.locator('.q-blocco--esploso').count();
if (esplosiDopo !== 0) errori.push('ANIMAZIONE: i blocchi in esplosione non vengono ripuliti');

// ---------- 4. Modalita a due tocchi ----------
await page.evaluate(() => window.localStorage.removeItem('quadra:partita'));
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.q-plancia');
const primaTap = await contaBlocchi();
await page.locator('.q-tray .q-pezzo-presa').first().click();
await page.waitForTimeout(60);
const selezionato = await page.locator('.q-tray__posto--selezionato').count();
await page.locator('.q-plancia .q-cella').nth(8 * 9 + 4).click();
await page.waitForTimeout(120);
const dopoTap = await contaBlocchi();
console.log(`4. due tocchi: slot selezionato ${selezionato} | blocchi ${primaTap} -> ${dopoTap}`);
if (selezionato !== 1) errori.push('TAP: il pezzo toccato non risulta selezionato');
if (dopoTap <= primaTap) errori.push('TAP: nessun blocco posizionato con la modalita a due tocchi');

// ---------- 4b. Partita da tastiera, senza mai toccare il puntatore ----------
await page.evaluate(() => window.localStorage.removeItem('quadra:partita'));
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.q-plancia');
const primaTastiera = await contaBlocchi();
// Tab fino al primo pezzo, Invio per prenderlo, frecce per muoversi, Invio per appoggiare.
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
await page.keyboard.press('Enter');
await page.waitForTimeout(80);
const cursoreVisibile = await page.locator('.q-cella--cursore').count();
const anteprimaTastiera = await page.locator('.q-cella--anteprima').count();
await page.keyboard.press('ArrowUp');
await page.keyboard.press('ArrowLeft');
await page.keyboard.press('Enter');
await page.waitForTimeout(150);
const dopoTastiera = await contaBlocchi();
await page.screenshot({ path: `${OUT}/04b-tastiera.png` });
console.log(`4b. tastiera: cursore ${cursoreVisibile} | anteprima ${anteprimaTastiera} | blocchi ${primaTastiera} -> ${dopoTastiera}`);
if (cursoreVisibile !== 1) errori.push('TASTIERA: il cursore sulla griglia non compare dopo aver preso un pezzo');
if (anteprimaTastiera === 0) errori.push('TASTIERA: nessuna anteprima del pezzo mentre si muove il cursore');
if (dopoTastiera <= primaTastiera) errori.push('TASTIERA: Invio non appoggia il pezzo');

// Esc deve annullare la selezione.
await page.keyboard.press('Tab');
await page.keyboard.press('Enter');
await page.waitForTimeout(60);
await page.keyboard.press('Escape');
await page.waitForTimeout(60);
if (await page.locator('.q-cella--cursore').count() !== 0) {
  errori.push('TASTIERA: Esc non annulla la selezione del pezzo');
}

// L'annuncio per i lettori di schermo deve descrivere la mossa.
const annuncio = await page.locator('[role="status"]').innerText();
console.log(`   annuncio per lettore di schermo: "${annuncio.trim()}"`);
if (!annuncio.trim()) errori.push('ACCESSIBILITA: la regione di annuncio resta vuota dopo una mossa');

// ---------- 5. Persistenza: ricarico e la partita deve essere la stessa ----------
const punteggioPrima = await punteggio();
const blocchiPrima = await contaBlocchi();
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Riprendi/ }).click();
await page.waitForSelector('.q-plancia');
const punteggioDopo = await punteggio();
const blocchiDopo = await contaBlocchi();
console.log(`5. ripresa dopo ricarica: punteggio ${punteggioPrima} -> ${punteggioDopo} | blocchi ${blocchiPrima} -> ${blocchiDopo}`);
if (punteggioPrima !== punteggioDopo || blocchiPrima !== blocchiDopo) {
  errori.push('PERSISTENZA: la partita ripresa non coincide con quella salvata');
}

// ---------- 6. Fine partita ----------
await page.evaluate((salvataggio) => {
  window.localStorage.setItem('quadra:partita', JSON.stringify(salvataggio));
}, quasiFinita);
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Riprendi/ }).click();
await page.waitForSelector('.q-plancia');
await page.screenshot({ path: `${OUT}/05-quasi-finita.png` });
console.log('   dopo la ripresa: blocchi sulla griglia', await contaBlocchi(), '| punteggio', await punteggio());
// L'unica mossa possibile: il punto in una delle quattro celle libere (riga 0, colonna 0).
const cellaLibera = await page.evaluate(() => {
  const c = document.querySelectorAll('.q-plancia .q-cella')[0].getBoundingClientRect();
  const p = document.querySelectorAll('.q-tray .q-pezzo')[0].getBoundingClientRect();
  return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 };
});
await page.mouse.move(cellaLibera.px, cellaLibera.py);
await page.mouse.down();
await page.mouse.move(cellaLibera.cx, cellaLibera.cy, { steps: 10 });
await page.mouse.up();
await page.waitForTimeout(300);
console.log('   dopo la mossa: blocchi', await contaBlocchi(), '| pezzi in mano', await page.locator('.q-tray .q-pezzo').count());
const fineVisibile = await page.locator('.q-fine__numero').count();
await page.screenshot({ path: `${OUT}/06-fine.png` });
console.log('6. schermata di fine partita mostrata:', fineVisibile === 1);
if (fineVisibile !== 1) errori.push('FINE PARTITA: la schermata di riepilogo non e comparsa');
else console.log('   punteggio finale mostrato:', await page.locator('.q-fine__numero').innerText());

// ---------- 7. Navigazione delle altre schermate ----------
await page.getByRole('button', { name: /Torna alla home/ }).click();
for (const [nome, selettore] of [['Statistiche', '.q-lista'], ['Impostazioni', '.q-interruttore'], ['Info', '.q-testo']]) {
  await page.getByRole('button', { name: nome }).click();
  await page.waitForTimeout(150);
  const ok = await page.locator(selettore).count();
  await page.screenshot({ path: `${OUT}/07-${nome.toLowerCase()}.png` });
  if (ok === 0) errori.push(`NAVIGAZIONE: la schermata ${nome} non mostra contenuto`);
  await page.locator('.q-pagina__testata .q-hud__menu').click();
  await page.waitForTimeout(120);
}
console.log('7. schermate secondarie visitate');

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) console.log('Nessun problema rilevato.');
else errori.forEach((e) => console.log('PROBLEMA -', e));
process.exit(errori.length === 0 ? 0 : 1);
