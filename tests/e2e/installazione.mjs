/**
 * Il service worker e l'installazione.
 *
 * Un service worker serve a rendere il gioco installabile e utilizzabile senza rete, ma
 * e' anche il modo piu' rapido di lasciare un giocatore su una versione vecchia PER
 * SEMPRE. In questo progetto abbiamo gia' pagato caro il dubbio su che cosa ci fosse
 * davvero online: qui si verifica proprio quello, con un aggiornamento vero.
 *
 * Lo scenario:
 *   1. serve una "versione 1" da una cartella temporanea e la apre;
 *   2. controlla che il service worker si registri e che il gioco funzioni senza rete;
 *   3. SOSTITUISCE i file con una "versione 2" e ricarica;
 *   4. controlla che il giocatore veda la versione 2, non la 1.
 *
 * Il passaggio 4 e' l'unico che conta davvero. Gli altri tre servono ad arrivarci.
 *
 * Uso: npm run installazione
 */

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, rm, cp, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const RADICE = new URL('../..', import.meta.url).pathname;
const DIST = join(RADICE, 'dist');
const SERVITA = join(RADICE, '.prova-sw');

if (!existsSync(join(DIST, 'index.html'))) {
  console.error('Manca dist/: eseguire prima `npm run build`.');
  process.exit(1);
}

const errori = [];

// --- una copia della build, che potremo sostituire a caldo ---
await rm(SERVITA, { recursive: true, force: true });
await mkdir(SERVITA, { recursive: true });
await cp(DIST, SERVITA, { recursive: true });

const TIPI = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
};

// Il gioco vive in una sottocartella, come su GitHub Pages: e' anche il caso in cui
// l'ambito di un service worker si sbaglia piu' facilmente.
const BASE = '/plinto/';
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith(BASE)) { res.writeHead(404); res.end(); return; }
  let relativo = url.pathname.slice(BASE.length) || 'index.html';
  if (relativo.endsWith('/')) relativo += 'index.html';
  const file = join(SERVITA, normalize(relativo).replace(/^(\.\.[/\\])+/, ''));
  try {
    const dati = await readFile(file);
    res.writeHead(200, {
      'Content-Type': TIPI[extname(file)] ?? 'application/octet-stream',
      // Nessuna cache HTTP: cosi' cio' che si osserva e' l'effetto del service worker
      // e non quello della cache del browser, che qui confonderebbe le idee.
      'Cache-Control': 'no-store',
    });
    res.end(dati);
  } catch {
    res.writeHead(404); res.end('non trovato');
  }
});
await new Promise((r) => server.listen(4174, r));
const INDIRIZZO = `http://localhost:4174${BASE}`;

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const contesto = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'it-IT',
});
const page = await contesto.newPage();
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));

// ---------- 1. Il service worker si registra ----------
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
const registrato = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'non supportato';
  const r = await navigator.serviceWorker.ready.catch(() => null);
  return r ? r.active?.scriptURL ?? 'attivo senza script' : 'nessuna registrazione';
});
console.log(`1. service worker: ${registrato}`);
if (!String(registrato).includes('sw.js')) {
  errori.push(`SW: non si e registrato (${registrato})`);
}
// L'ambito deve essere la sottocartella, non la radice del dominio.
if (!String(registrato).includes(BASE)) {
  errori.push(`SW: registrato fuori dalla sottocartella (${registrato})`);
}

// ---------- 2. La versione servita e quella che ci aspettiamo ----------
const versione1 = (await page.locator('.pl-home__versione').innerText().catch(() => '')).trim()
  || (await page.locator('.pl-intro').count() ? 'presentazione' : '');
console.log(`2. prima versione a schermo: ${versione1 || '(home non raggiunta)'}`);

// ---------- 3. Senza rete il gioco si apre lo stesso ----------
await contesto.setOffline(true);
await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
await page.waitForTimeout(600);
const vivoSenzaRete = await page.locator('#root *').count();
console.log(`3. senza rete: ${vivoSenzaRete > 0 ? 'il gioco si apre' : 'PAGINA VUOTA'}`);
if (vivoSenzaRete === 0) errori.push('SW: senza rete il gioco non si apre');
await contesto.setOffline(false);

// ---------- 4. Una versione NUOVA deve arrivare al giocatore ----------
// E' il controllo per cui esiste questo scenario. Si sostituisce il contenuto servito
// e si verifica che il giocatore lo veda: un service worker che serve per sempre la
// versione vecchia e' il difetto piu' grave che possa avere, e non si nota provando
// una volta sola.
// Il segnale va messo FUORI da #root: React svuota il contenitore quando si monta,
// e la prima versione di questo controllo cercava un elemento che l'applicazione
// aveva appena cancellato. Segnalava un difetto inesistente.
const html = await readFile(join(SERVITA, 'index.html'), 'utf8');
await writeFile(join(SERVITA, 'index.html'), html.replace('<div id="root">', '<i data-nuova="si"></i><div id="root">'));

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(800);
let nuovaVista = await page.locator('[data-nuova="si"]').count();
if (nuovaVista === 0) {
  // Una seconda ricarica e' ammessa: il service worker nuovo puo' attivarsi durante la
  // prima. Restare indietro DUE ricariche invece no: vorrebbe dire non aggiornarsi.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  nuovaVista = await page.locator('[data-nuova="si"]').count();
}
console.log(`4. dopo un aggiornamento: ${nuovaVista > 0 ? 'il giocatore vede la versione nuova' : 'RESTA SULLA VECCHIA'}`);
if (nuovaVista === 0) {
  errori.push('SW: dopo un aggiornamento il giocatore resta sulla versione vecchia');
}

// ---------- 5. Il manifest ha quello che serve per installare ----------
const manifest = JSON.parse(await readFile(join(SERVITA, 'manifest.webmanifest'), 'utf8'));
const dimensioni = (manifest.icons ?? []).map((i) => i.sizes);
const richieste = ['192x192', '512x512'];
for (const d of richieste) {
  if (!dimensioni.includes(d)) errori.push(`MANIFEST: manca l icona ${d}, senza la quale non si installa`);
}
if (manifest.display !== 'standalone') errori.push(`MANIFEST: display e "${manifest.display}" invece di standalone`);
if (!(manifest.icons ?? []).some((i) => i.purpose === 'maskable')) {
  errori.push('MANIFEST: manca l icona maskable, su Android l icona verrebbe ritagliata male');
}
console.log(`5. manifest: ${dimensioni.join(', ')} · display ${manifest.display}`);

await browser.close();
server.close();
await rm(SERVITA, { recursive: true, force: true });

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Il gioco e installabile, funziona senza rete e si aggiorna.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
