/**
 * Verifica che la build funzioni servita da una SOTTOCARTELLA, come su GitHub Pages
 * (https://utente.github.io/plinto/) e non solo dalla radice di un dominio.
 *
 * E' un caso che si rompe in silenzio: con i percorsi assoluti la pagina si apre
 * bianca perche' cerca /assets/... alla radice, e nessun test che gira in locale
 * dalla radice se ne accorgerebbe mai.
 *
 * Uso: npm run prova-pages
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { chromium } from 'playwright';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SOTTOCARTELLA = '/plinto/';
const PORTA = 4319;

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const TIPI = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
};

const errori = [];
const richieste = [];

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORTA}`);
  richieste.push(url.pathname);
  if (!url.pathname.startsWith(SOTTOCARTELLA)) {
    res.writeHead(404).end('fuori dalla sottocartella');
    return;
  }
  let relativo = url.pathname.slice(SOTTOCARTELLA.length) || 'index.html';
  if (relativo.endsWith('/')) relativo += 'index.html';
  const file = join(DIST, normalize(relativo).replace(/^(\.\.[/\\])+/, ''));
  try {
    const contenuto = await readFile(file);
    res.writeHead(200, { 'Content-Type': TIPI[extname(file)] ?? 'application/octet-stream' });
    res.end(contenuto);
  } catch {
    res.writeHead(404).end('non trovato');
  }
});

await new Promise((r) => server.listen(PORTA, r));

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });
page.on('requestfailed', (r) => errori.push(`richiesta fallita: ${r.url()}`));
page.on('response', (r) => { if (r.status() === 404) errori.push(`404: ${new URL(r.url()).pathname}`); });

const indirizzo = `http://localhost:${PORTA}${SOTTOCARTELLA}`;
await page.goto(indirizzo, { waitUntil: 'networkidle' });

// Deve comparire la presentazione, e da li' si deve poter giocare.
const regole = await page.locator('.pl-intro__regole li').count();
if (regole !== 3) errori.push(`la presentazione non compare (trovate ${regole} regole)`);

await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-plancia', { timeout: 5000 }).catch(() => {
  errori.push('la plancia non compare dopo aver premuto Gioca');
});
const celle = await page.locator('.pl-plancia .pl-cella').count();
if (celle !== 81) errori.push(`la griglia ha ${celle} celle invece di 81`);

// Una mossa vera: se gli asset non fossero caricati, questo non funzionerebbe.
const punti = await page.evaluate(() => {
  const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
  const c = document.querySelectorAll('.pl-plancia .pl-cella')[40].getBoundingClientRect();
  return { px: p.left + p.width / 2, py: p.top + p.height / 2, cx: c.left + c.width / 2, cy: c.top + c.height / 2 };
});
await page.mouse.move(punti.px, punti.py);
await page.mouse.down();
await page.mouse.move(punti.cx, punti.cy, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(150);
const blocchi = await page.locator('.pl-plancia .pl-blocco').count();
if (blocchi === 0) errori.push('non si riesce a posare un pezzo');

// Il manifest e l'icona devono essere raggiungibili dalla sottocartella.
for (const risorsa of ['manifest.webmanifest', 'icon.svg', 'icone/icona-192.png']) {
  const esito = await page.evaluate(async (r) => {
    const risposta = await fetch(r);
    return risposta.status;
  }, risorsa);
  if (esito !== 200) errori.push(`${risorsa} risponde ${esito} dalla sottocartella`);
}

const fuoriRadice = richieste.filter((p) => !p.startsWith(SOTTOCARTELLA));
if (fuoriRadice.length > 0) {
  errori.push(`richieste alla radice del dominio invece che alla sottocartella: ${[...new Set(fuoriRadice)].join(', ')}`);
}

await browser.close();
server.close();

console.log(`\nPLINTO — build servita da ${SOTTOCARTELLA} : ${richieste.length} richieste, ${blocchi} blocchi posati\n`);
console.log('================ ESITO ================');
if (errori.length === 0) console.log('La build funziona anche da una sottocartella.');
else errori.forEach((e) => console.log('PROBLEMA -', e));
process.exit(errori.length === 0 ? 0 : 1);
