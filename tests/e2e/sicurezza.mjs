/**
 * La politica di sicurezza dei contenuti, provata sulla pagina COSTRUITA.
 *
 * PERCHE' ESISTE. Per mesi il progetto ha avuto una CSP severa dentro `netlify.toml`,
 * cioe' dentro un file che nessuno leggeva: il gioco sta su GitHub Pages, che quel file
 * non lo apre nemmeno. Sembrava protetto e non lo era, e nessun controllo poteva
 * accorgersene perche' nessun controllo guardava. Adesso la politica sta in un <meta>
 * dentro la pagina, che il browser applica ovunque, e questo file esiste per due ragioni:
 * che ci sia davvero, e che non rompa niente.
 *
 * SI PROVA SULLA BUILD, NON SUL SERVER DI SVILUPPO. In sviluppo Vite inietta codice suo
 * nella pagina e la politica non viene applicata apposta (vedi vite.config.js): provarla
 * li' misurerebbe una pagina che nessuno riceve.
 *
 * DUE META', E LA SECONDA E' QUELLA CHE RENDE LA PRIMA CREDIBILE.
 *   1. Il gioco intero viene attraversato -- home, tutte le schermate, una partita vera
 *      con audio e particelle, il service worker, e il salvataggio che si scarica con un
 *      indirizzo `blob:` -- e NON deve produrre nessuna violazione. Zero, non poche.
 *   2. Poi si prova a caricare di proposito uno script, un'immagine e una chiamata di
 *      rete da un altro dominio: DEVONO essere bloccati. Senza questa parte, un giorno in
 *      cui il <meta> sparisse per sbaglio la prima meta' continuerebbe a passare -- zero
 *      violazioni perche' non c'e' niente che violi -- e il controllo direbbe "tutto bene"
 *      mentre la protezione non c'e' piu'.
 *
 * Uso: npm run e2e-sicurezza
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const PORTA = Number(process.env.PLINTO_PORTA_SICUREZZA ?? 4180);
const INDIRIZZO = `http://127.0.0.1:${PORTA}/`;

const errori = [];
const controlla = (cosa, condizione) => { if (!condizione) errori.push(cosa); };

const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORTA)], {
  cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore',
});
// Si spegne SEMPRE, anche uscendo per un errore. Un `server.kill()` solo in fondo al file
// vale solo quando tutto va bene, e quando qualcosa va male lascia acceso un server che
// il prossimo giro trova e riusa: e' successo, e ha fatto misurare una versione vecchia a
// tutti i controlli di un intero gate.
process.on('exit', () => { try { server.kill(); } catch { /* gia' morto */ } });
for (const segnale of ['SIGINT', 'SIGTERM']) process.on(segnale, () => process.exit(1));
const risponde = async () => {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; }
};
const scadenza = Date.now() + 30000;
while (Date.now() < scadenza && !(await risponde())) await new Promise((r) => setTimeout(r, 400));
if (!(await risponde())) {
  console.error('Non riesco a servire la build. Hai lanciato npm run build?');
  process.exit(1);
}

// La politica c'e' nella pagina servita, prima ancora di aprire un browser.
const pagina = await (await fetch(INDIRIZZO)).text();
const meta = pagina.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/);
controlla('la pagina costruita non contiene nessuna Content-Security-Policy', Boolean(meta));
if (meta) {
  console.log('politica trovata nella pagina:\n  ', meta[1].replace(/; /g, '\n   '));
  for (const voce of ['default-src', 'script-src', 'base-uri', 'object-src', 'form-action']) {
    controlla(`la politica non dichiara ${voce}`, meta[1].includes(voce));
  }
  // Il <meta> non puo' applicarle: dichiararle sarebbe una bugia scritta nel codice.
  for (const inutile of ['frame-ancestors', 'report-uri', 'sandbox']) {
    controlla(`la politica dichiara ${inutile}, che da un <meta> viene ignorato`,
      !meta[1].includes(inutile));
  }
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
const inConsole = [];
page.on('console', (m) => { if (m.type() === 'error') inConsole.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => inConsole.push(`errore di pagina: ${e.message.slice(0, 200)}`));
await page.addInitScript(() => {
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', (e) => {
    window.__csp.push(`${e.violatedDirective} <- ${e.blockedURI || e.sourceFile || '?'}`);
  });
});

const violazioni = [];
async function raccogli(dove) {
  const viste = await page.evaluate(() => { const c = window.__csp ?? []; window.__csp = []; return c; });
  for (const v of viste) violazioni.push(`${dove}: ${v}`);
}

async function daCapo() {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
    }));
    const v = {};
    for (let n = 1; n <= 30; n += 1) v[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: v }));
    // Il segnaposto della ripresa riaprirebbe la partita di prima invece della home.
    window.localStorage.removeItem('plinto:ripresa');
  });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
}

console.log('\n1. il gioco intero, con la politica attiva...');
await daCapo();
await page.waitForTimeout(700);
await raccogli('home');

const registrati = await page.evaluate(() => navigator.serviceWorker.getRegistrations().then((r) => r.length));
controlla('il service worker non si registra con la politica attiva', registrati > 0);
await raccogli('service worker');
console.log('   service worker registrati:', registrati);

for (const [nome, bottone, attesa] of [
  ['mappa dei livelli', /^Mappa dei livelli/, '.pl-tappe'],
  ['come si gioca', /^Come si gioca/, '.pl-aiuto__saluto'],
  ['statistiche', /^Statistiche/, '.pl-lista'],
  ['profilo', /^Il tuo profilo/, '.pl-lista'],
  ['impostazioni', /^Impostazioni/, '.pl-interruttore'],
  ['info', /^Info/, '.pl-testo'],
  ['sostieni', /^Sostieni/, '.pl-testo'],
]) {
  await daCapo();
  const b = page.getByRole('button', { name: bottone });
  if (await b.count() === 0) { errori.push(`la schermata "${nome}" non e raggiungibile dalla home`); continue; }
  await b.first().click();
  await page.waitForSelector(attesa, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(250);
  await raccogli(nome);
}
console.log('   attraversate home e sette schermate');

// Una partita vera: audio dagli oscillatori, particelle, vibrazione.
await daCapo();
await page.getByRole('button', { name: /^Partita libera/ }).click().catch(() => {});
await page.waitForSelector('.pl-plancia', { timeout: 5000 }).catch(() => {});
for (let i = 0; i < 12; i += 1) {
  const pezzi = page.locator('.pl-tray__posto .pl-pezzo-presa');
  if (await pezzi.count() === 0) break;
  await pezzi.first().click();
  await page.locator('.pl-plancia .pl-cella').nth((i * 11 + 3) % 81).click({ force: true }).catch(() => {});
  await page.waitForTimeout(40);
}
await raccogli('partita');
console.log('   giocata una partita');

// IL PUNTO PIU' A RISCHIO: il salvataggio crea il file con un indirizzo blob:, ed e'
// esattamente il genere di cosa che una politica scritta a occhio blocca in silenzio.
await daCapo();
await page.getByRole('button', { name: /^Impostazioni/ }).click();
await page.waitForSelector('.pl-interruttore');
const scaricato = await Promise.all([
  page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
  page.getByRole('button', { name: /^Scarica il file$/ }).click(),
]).then(([d]) => d);
await page.waitForTimeout(400);
await raccogli('salvataggio (blob:)');
controlla('con la politica attiva il salvataggio non si scarica piu', scaricato !== null);
console.log('   salvataggio scaricato:', scaricato ? scaricato.suggestedFilename() : 'NON PARTITO');

if (violazioni.length) {
  errori.push(`il gioco viola la sua stessa politica in ${violazioni.length} punti`);
  for (const v of [...new Set(violazioni)]) errori.push(`  ${v}`);
}
for (const e of [...new Set(inConsole)]) errori.push(`errore in console: ${e}`);

console.log('\n2. la controprova: roba da fuori DEVE essere bloccata...');
await page.evaluate(() => { window.__csp = []; });
await page.evaluate(async () => {
  const img = document.createElement('img');
  img.src = 'https://esempio.invalido/figura.png';
  document.body.appendChild(img);
  const s = document.createElement('script');
  s.src = 'https://esempio.invalido/codice.js';
  document.body.appendChild(s);
  try { await fetch('https://esempio.invalido/dati'); } catch { /* deve fallire */ }
  await new Promise((r) => setTimeout(r, 700));
});
const bloccate = await page.evaluate(() => window.__csp ?? []);
const direttive = new Set(bloccate.map((b) => b.split(' <- ')[0]));
console.log('   bloccate:', [...new Set(bloccate)].join(' | ') || 'NIENTE');
controlla('uno script da un altro dominio NON e stato bloccato: la politica non e attiva',
  [...direttive].some((d) => d.startsWith('script-src')));
controlla('un immagine da un altro dominio NON e stata bloccata',
  [...direttive].some((d) => d.startsWith('img-src')));
controlla('una chiamata di rete verso un altro dominio NON e stata bloccata',
  [...direttive].some((d) => d.startsWith('connect-src')));

await browser.close();
server.kill();

console.log('\n================ ESITO ================');
if (errori.length) {
  console.log(`${errori.length} problemi:`);
  for (const e of errori) console.log(`  - ${e}`);
  process.exit(1);
}
console.log('Nessun problema rilevato.');
