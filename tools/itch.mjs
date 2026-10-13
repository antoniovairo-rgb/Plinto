/**
 * Lo ZIP per itch.io: la stessa build del sito, impacchettata per la pagina HTML5.
 *
 * itch.io vuole un archivio con `index.html` in cima e percorsi RELATIVI, perche' serve
 * il gioco da una sua sottocartella, dentro un riquadro (iframe) della pagina del
 * progetto. Limiti dichiarati nella guida (https://itch.io/docs/creators/html5): al
 * massimo 1.000 file, 500 MB in tutto, 200 MB per file, percorsi fino a 240 caratteri.
 *
 * Lo script non si fida: dopo aver fatto lo ZIP lo riapre, lo serve da una sottocartella
 * di un indirizzo e lo carica dentro un iframe di un ALTRO indirizzo, come fa itch.io.
 * Se la home non compare o la console segnala errori, si ferma.
 *
 * Uso: npm run itch    (esce in dist-itch/plinto-itch-<versione>.zip)
 */

import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { chromium } from 'playwright';

const RADICE = new URL('..', import.meta.url).pathname;
const DIST = join(RADICE, 'dist');
const USCITA = join(RADICE, 'dist-itch');
const versione = JSON.parse(readFileSync(join(RADICE, 'package.json'), 'utf8')).version;
const ZIP = join(USCITA, `plinto-itch-${versione}.zip`);

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const errori = [];
function esegui(comando, argomenti, opzioni = {}) {
  const r = spawnSync(comando, argomenti, { cwd: RADICE, stdio: 'inherit', ...opzioni });
  if (r.status !== 0) {
    console.error(`\n${comando} ${argomenti.join(' ')} e' fallito.`);
    process.exit(1);
  }
}

function fileIn(cartella) {
  const trovati = [];
  for (const voce of readdirSync(cartella, { withFileTypes: true })) {
    const percorso = join(cartella, voce.name);
    if (voce.isDirectory()) trovati.push(...fileIn(percorso));
    else trovati.push(percorso);
  }
  return trovati;
}

// 1. La build, la stessa che va sul sito.
console.log('1. build di produzione...');
esegui('npm', ['run', 'build']);

// 2. I limiti di itch.io, controllati prima di impacchettare.
console.log('2. controllo i limiti di itch.io...');
const tutti = fileIn(DIST);
if (!existsSync(join(DIST, 'index.html'))) errori.push('manca index.html in cima alla build');
if (tutti.length > 1000) errori.push(`${tutti.length} file: itch.io ne accetta al massimo 1.000`);
let totale = 0;
for (const f of tutti) {
  const peso = statSync(f).size;
  totale += peso;
  if (peso > 200 * 1024 * 1024) errori.push(`${relative(DIST, f)} supera 200 MB`);
  if (relative(DIST, f).length > 240) errori.push(`${relative(DIST, f)}: percorso oltre 240 caratteri`);
}
if (totale > 500 * 1024 * 1024) errori.push('la build supera 500 MB');
// Un percorso assoluto ("/assets/...") su itch.io punterebbe alla radice del loro dominio.
const indice = readFileSync(join(DIST, 'index.html'), 'utf8');
const assoluti = [...indice.matchAll(/(?:src|href)="(\/[^/][^"]*)"/g)].map((m) => m[1]);
if (assoluti.length) errori.push(`percorsi assoluti in index.html: ${assoluti.join(', ')}`);
if (errori.length) fine();
console.log(`   ${tutti.length} file, ${(totale / 1024).toFixed(0)} KB`);

// 3. Lo ZIP, con index.html in cima (si zippa DA DENTRO la cartella).
console.log('3. creo lo ZIP...');
mkdirSync(USCITA, { recursive: true });
rmSync(ZIP, { force: true });
esegui('zip', ['-q', '-r', '-X', ZIP, '.'], { cwd: DIST });

// 4. La prova: lo ZIP riaperto, servito da una sottocartella e caricato in un iframe
//    di un altro indirizzo, come sulla pagina di itch.io.
console.log('4. provo lo ZIP dentro un iframe, come su itch.io...');
const PROVA = join(USCITA, '.prova');
rmSync(PROVA, { recursive: true, force: true });
mkdirSync(join(PROVA, 'html', '123'), { recursive: true });
esegui('unzip', ['-q', ZIP, '-d', join(PROVA, 'html', '123')]);
if (!existsSync(join(PROVA, 'html', '123', 'index.html'))) {
  errori.push('nello ZIP index.html non e\' in cima');
  fine();
}

const TIPI = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
};
const giochi = createServer((req, res) => {
  const percorso = join(PROVA, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!percorso.startsWith(PROVA) || !existsSync(percorso) || statSync(percorso).isDirectory()) {
    res.writeHead(404); res.end(); return;
  }
  res.writeHead(200, { 'Content-Type': TIPI[extname(percorso)] ?? 'application/octet-stream' });
  res.end(readFileSync(percorso));
});
const pagina = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<!doctype html><title>pagina</title><body style="margin:0">'
    + '<iframe src="http://127.0.0.1:5191/html/123/index.html" style="width:412px;height:732px;border:0"></iframe>');
});
await new Promise((r) => giochi.listen(5191, '127.0.0.1', r));
await new Promise((r) => pagina.listen(5192, 'localhost', r));

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 412, height: 732 } });
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
await page.goto('http://localhost:5192/', { waitUntil: 'networkidle' });
const riquadro = page.frameLocator('iframe');
try {
  // Primo avvio: la guida. Si salta, e la home deve comparire.
  const salta = riquadro.getByRole('button', { name: /Salta|Skip/ });
  if (await salta.count() > 0) await salta.first().click();
  await riquadro.locator('.pl-home__menu').waitFor({ timeout: 10000 });
  // E si gioca davvero: si apre la partita libera.
  await riquadro.getByRole('button', { name: /Partita libera|Free play/ }).first().click();
  await riquadro.locator('.pl-plancia .pl-cella').first().waitFor({ timeout: 10000 });
} catch (e) {
  errori.push(`nel riquadro il gioco non parte: ${e.message.split('\n')[0]}`);
}
await page.screenshot({ path: join(USCITA, 'prova-iframe.png') });

await browser.close();
giochi.close();
pagina.close();
rmSync(PROVA, { recursive: true, force: true });

// 5. La copertina della pagina (630x500): la disegna lo strumento dell'immagine dello
//    store, con la stessa grafica ricomposta (vedi `--copertina` in immagine-store.mjs).
console.log('5. copertina 630x500...');
esegui('node', ['tools/immagine-store.mjs', '--copertina']);
fine();

function fine() {
  if (errori.length) {
    console.error(`\n${errori.length} problemi:`);
    errori.forEach((e) => console.error(` - ${e}`));
    process.exit(1);
  }
  console.log(`\nPronto: ${relative(RADICE, ZIP)} (${(statSync(ZIP).size / 1024).toFixed(0)} KB)`);
  console.log(`Prova nel riquadro: ${relative(RADICE, join(USCITA, 'prova-iframe.png'))}`);
  console.log(`Copertina: ${relative(RADICE, join(USCITA, 'copertina-630x500.png'))}`);
  process.exit(0);
}
