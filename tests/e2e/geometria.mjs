/**
 * La geometria del tavolo da gioco: dove sono le caselle, e dove finisce un tocco.
 *
 * PERCHE' ESISTE. La corsia veloce del gate saltava i cento livelli solo se nessun file
 * "che decide come si gioca" era cambiato, e in quell'elenco c'era tutto `src/styles/`.
 * E' un'approssimazione grossolana: un cambio di CSS PUO' rendere invincibile un livello
 * -- e' successo, quando abbiamo cambiato la misura delle celle -- ma la regola non
 * guarda COSA e' cambiato, guarda solo CHE e' cambiato. Un anello attorno alla barra
 * della Catena costava un'ora di controlli quanto una riscrittura della plancia.
 *
 * La domanda giusta non e' "e' cambiato il foglio di stile?". E' questa:
 *
 *   1. la griglia e' ancora grande e posizionata come quando i cento livelli sono stati
 *      giocati e vinti?
 *   2. un tocco al centro di una casella arriva ancora SU QUELLA casella, o c'e'
 *      qualcosa sopra che se lo prende?
 *
 * A queste due si risponde in una decina di secondi. Il gate le usa per decidere se i
 * cento livelli vanno davvero rigiocati.
 *
 * LA SECONDA DOMANDA NON LA FACEVA NESSUNO. La regola vecchia non guardava affatto le
 * sovrimpressioni: un elemento messo davanti alla griglia che si mangia i tocchi sarebbe
 * passato inosservato se il suo file non era nell'elenco. E' esattamente il difetto della
 * 1.8.0, che fu trovato da un giocatore e non da un controllo.
 *
 * DUE FORMATI, NON UNO. Le misure dipendono dal viewport: un solo formato non vedrebbe
 * un cambiamento che scatta solo sugli schermi stretti.
 *
 * Uso: npm run geometria
 */

import { chromium } from 'playwright';
import { existsSync, writeFileSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

/** Dove finisce la firma, letta poi dal gate. */
export const FIRMA = new URL('../../geometria.json', import.meta.url).pathname;

/** I formati su cui si misura. Stretto e comune: i due estremi che contano. */
const FORMATI = [
  { nome: 'stretto', larghezza: 360, altezza: 640 },
  { nome: 'comune', larghezza: 400, altezza: 756 },
];

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}

let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: false,
  });
  for (let i = 0; i < 30 && !(await serverRisponde()); i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!(await serverRisponde())) {
    console.error('Impossibile avviare il server di sviluppo su', INDIRIZZO);
    process.exit(1);
  }
}

const errori = [];
const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const firma = {};

for (const formato of FORMATI) {
  const page = await browser.newPage({
    viewport: { width: formato.larghezza, height: formato.altezza }, locale: 'it-IT',
  });
  page.on('pageerror', (e) => errori.push(`${formato.nome}: errore di pagina: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errori.push(`${formato.nome}: console: ${m.text()}`);
  });

  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true,
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.pl-home__azioni .pl-sfida-avvio').nth(1).click();
  await page.waitForSelector('.pl-plancia');
  await page.waitForTimeout(250);

  const misura = await page.evaluate(() => {
    const arr = (r) => [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)];
    const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    const plancia = document.querySelector('.pl-plancia').getBoundingClientRect();
    const primo = celle[0].getBoundingClientRect();
    const destra = celle[8].getBoundingClientRect();
    const basso = celle[72].getBoundingClientRect();

    // Il tocco: al centro di ogni casella deve rispondere QUELLA casella. Si prova su
    // tutte e ottantuno, che costa millisecondi e non lascia scoperto nessun angolo.
    const rubati = [];
    celle.forEach((c, i) => {
      const r = c.getBoundingClientRect();
      const sotto = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!sotto || (sotto !== c && !c.contains(sotto))) {
        rubati.push({ cella: i, preso: sotto ? `${sotto.tagName}.${String(sotto.className).slice(0, 30)}` : 'niente' });
      }
    });

    // Stessa domanda per i pezzi in mano: prenderli e' meta' di una mossa.
    const slot = [...document.querySelectorAll('.pl-tray .pl-pezzo-presa, .pl-tray__posto')];
    const pezziRubati = [];
    slot.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      if (r.width < 4) return;
      const sotto = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!sotto || (sotto !== s && !s.contains(sotto))) {
        pezziRubati.push({ slot: i, preso: sotto ? `${sotto.tagName}.${String(sotto.className).slice(0, 30)}` : 'niente' });
      }
    });

    return {
      plancia: arr(plancia),
      cella: Math.round(primo.width),
      passoX: Math.round((destra.left - primo.left) / 8),
      passoY: Math.round((basso.top - primo.top) / 8),
      primaCella: arr(primo),
      slot: slot.filter((s) => s.getBoundingClientRect().width >= 4).map((s) => arr(s.getBoundingClientRect())),
      rubati,
      pezziRubati,
    };
  });

  const { rubati, pezziRubati, ...geometria } = misura;
  firma[formato.nome] = { viewport: [formato.larghezza, formato.altezza], ...geometria };

  console.log(`${formato.nome.padEnd(8)} ${formato.larghezza}x${formato.altezza}  `
    + `plancia ${geometria.plancia[2]}x${geometria.plancia[3]}  cella ${geometria.cella}px  `
    + `passo ${geometria.passoX}/${geometria.passoY}  slot ${geometria.slot.length}  `
    + `tocchi rubati ${rubati.length + pezziRubati.length}`);

  if (rubati.length) {
    errori.push(`${formato.nome}: ${rubati.length} caselle non rispondono al tocco al proprio centro `
      + `(qualcosa ci sta sopra): ${rubati.slice(0, 4).map((r) => `#${r.cella} -> ${r.preso}`).join(', ')}`);
  }
  if (pezziRubati.length) {
    errori.push(`${formato.nome}: ${pezziRubati.length} pezzi in mano non rispondono al tocco: `
      + pezziRubati.slice(0, 3).map((r) => `#${r.slot} -> ${r.preso}`).join(', '));
  }
  await page.close();
}

await browser.close();
if (server) server.kill();

writeFileSync(FIRMA, `${JSON.stringify(firma, null, 2)}\n`);

console.log('\n================ ESITO ================');
if (errori.length) {
  console.error('PROBLEMI:');
  errori.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('La griglia e i pezzi rispondono al tocco dove devono. Firma scritta in geometria.json');
