/**
 * La home deve ENTRARE nello schermo, su tutti i telefoni.
 *
 * PERCHE' ESISTE. La home ha sette voci piu' il marchio, e il respiro fra i gruppi era
 * proporzionale all'altezza dello schermo con un tetto alto. Su uno schermo da 640px
 * sforava di una cinquantina di pixel: la prima schermata del gioco scorreva. Se ne e'
 * accorto un giocatore, non una prova -- perche' nessuna misurava l'altezza.
 *
 * Nell'app installata il problema si nota di piu' proprio DOPO averla sistemata: senza
 * la barra dell'indirizzo lo schermo e' piu' alto, e uno scorrimento residuo di pochi
 * pixel sembra un difetto invece che una necessita'.
 *
 * Si prova con lo stato PIU' PIENO possibile: partita libera in corso, sfida in corso,
 * livelli superati, record. E' la home piu' alta che il gioco possa produrre; se entra
 * quella, entrano tutte.
 *
 * Uso: npm run impaginazione
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

// I formati veri dei telefoni in circolazione. 320x568 non c'e': e' l'iPhone SE del
// 2016, sotto qualunque Android che possa installare PLINTO (minimo Android 7).
const FORMATI = [
  [360, 640, 'Android di base'],
  [360, 780, 'Xiaomi stretto'],
  [390, 844, 'iPhone 12-15'],
  [393, 873, 'Pixel 7'],
  [412, 732, 'schermo basso'],
  [412, 915, 'Redmi / Galaxy'],
];

/**
 * Gli stessi telefoni, ma con l'altezza che il gioco ha DAVVERO.
 *
 * I numeri qui sopra sono quelli nominali dei dispositivi. Sullo schermo di un telefono
 * vero, pero', la barra di stato in alto e quella di navigazione in basso si prendono
 * un pezzo di quell'altezza: l'applicazione ne riceve un centinaio di pixel in meno.
 *
 * Non e' una sottigliezza. Un difetto grave e' stato pubblicato proprio perche' questo
 * scenario provava 412x915 -- dove tutto entrava -- mentre il telefono che lo ha trovato
 * aveva circa 400x756, e li' la plancia copriva un pulsante. Provare la misura della
 * scatola invece di quella dello schermo vuol dire non provare niente.
 */
const FORMATI_CON_BARRE = FORMATI.map(([l, a, nome]) => [l, a - 110, `${nome} (con barre)`]);

const errori = [];

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

console.log('\nLa home entra nello schermo?');
for (const [larghezza, altezza, nome] of FORMATI) {
  const page = await browser.newPage({ viewport: { width: larghezza, height: altezza }, locale: 'it-IT' });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, tema: 'scuro', lingua: 'it',
      audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
    }));
    window.localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
    window.localStorage.setItem('plinto:quadri', JSON.stringify({
      versione: 1,
      livelli: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i + 1, { mosse: 9, punteggio: 400, tentativi: 1 }]),
      ),
    }));
    // Le due partite in corso aggiungono due righe: e' la home piu' alta possibile.
    window.localStorage.setItem('plinto:partita', JSON.stringify({ segnaposto: true }));
    window.localStorage.setItem('plinto:partita-sfida', JSON.stringify({ segnaposto: true }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-home__azioni');

  const eccesso = await page.evaluate(() => {
    const el = document.querySelector('.pl-home');
    return el.scrollHeight - el.clientHeight;
  });
  const esito = eccesso > 0 ? `SCORRE di ${eccesso}px` : 'entra';
  console.log(`  ${eccesso > 0 ? 'NO  ' : 'ok  '}${nome.padEnd(18)} ${larghezza}x${altezza}  ${esito}`);
  if (eccesso > 0) errori.push(`${nome} (${larghezza}x${altezza}): la home scorre di ${eccesso}px`);
  await page.close();
}

// ---------------------------------------------------------------------------
// Dentro un LIVELLO: il tavolo da gioco non deve sbordare sui pezzi in mano.
//
// Perche' un controllo a se'. La plancia era limitata da `min(96vw, 58vh)`, cioe' da
// una frazione dello schermo, che pero' non sa che cos'altro c'e' sopra. Nei livelli
// ci sono in piu' la fascia dell'obiettivo e l'avviso della Catena: su 360x640 il
// blocco del tavolo diventava alto 416px in uno spazio di 355, sbordava di 61 e --
// essendo centrato -- ne colava meta' sotto, sopra i pezzi in mano. La scritta
// "Trascina un pezzo sulla griglia" si leggeva addosso ai pezzi.
//
// In partita libera non succedeva, perche' quei due elementi non ci sono. E' il motivo
// per cui e' passato inosservato: chi prova il gioco apre la partita libera, e la
// schermata che si rompe e' l'altra.
console.log('\nDentro un livello, DOPO una mossa: niente si copre a vicenda');
for (const [larghezza, altezza, nome] of [...FORMATI, ...FORMATI_CON_BARRE]) {
  const page = await browser.newPage({ viewport: { width: larghezza, height: altezza }, locale: 'it-IT' });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, tema: 'scuro', lingua: 'it', animazioni: false, aiutoVisivo: true,
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.pl-home__azioni .pl-btn--primario').click();
  await page.waitForSelector('.pl-apertura');
  await page.locator('.pl-apertura__azioni .pl-btn--primario').click();
  await page.waitForSelector('.pl-plancia');
  await page.waitForTimeout(250);

  // UNA MOSSA, perche' e' dopo una mossa che compare "Rimetti a posto il pezzo" -- ed e'
  // esattamente lo stato in cui la plancia lo copriva. Provare il livello appena aperto
  // guardava l'unico istante in cui il difetto non c'era.
  const g = await page.evaluate(() => {
    const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
    const c = document.querySelectorAll('.pl-plancia .pl-cella')[40].getBoundingClientRect();
    return {
      px: p.left + p.width / 2, py: p.top + p.height / 2,
      cx: c.left + c.width / 2, cy: c.top + c.height / 2,
    };
  });
  await page.mouse.move(g.px, g.py);
  await page.mouse.down();
  await page.mouse.move(g.cx, g.cy, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(250);

  const m = await page.evaluate(() => {
    const area = document.querySelector('.pl-plancia-area').getBoundingClientRect();
    const tavolo = document.querySelector('.pl-tavolo').getBoundingClientRect();
    const suggerimento = document.querySelector('.pl-suggerimento')?.getBoundingClientRect();
    const pezzi = [...document.querySelectorAll('.pl-tray .pl-pezzo')]
      .map((p) => p.getBoundingClientRect());
    const piuAlto = pezzi.length ? Math.min(...pezzi.map((r) => r.top)) : Infinity;
    const plancia = document.querySelector('.pl-plancia').getBoundingClientRect();
    const involucro = document.querySelector('.pl-plancia-involucro').getBoundingClientRect();
    return {
      sborda: Math.round(tavolo.height - area.height),
      // Quanto il tavolo entra dentro il pezzo piu' alto: e' il difetto visibile.
      sovrapposizione: Math.round(Math.max(0, tavolo.bottom - piuAlto)),
      suggerimentoSuiPezzi: suggerimento
        ? Math.round(Math.max(0, suggerimento.bottom - piuAlto)) : 0,
      // La plancia dentro il proprio riquadro: e' il difetto della 1.8.0, dove sforava
      // e finiva sopra il pulsante senza che il tavolo risultasse sbordare.
      planciaSfora: Math.round(Math.max(0, plancia.height - involucro.height)),
      planciaSulSuggerimento: suggerimento
        ? Math.round(Math.max(0, plancia.bottom - suggerimento.top)) : 0,
      pulsante: !!document.querySelector('.pl-annulla'),
    };
  });
  const rotto = m.sborda > 0 || m.sovrapposizione > 0 || m.planciaSfora > 0
    || m.planciaSulSuggerimento > 0;
  console.log(`  ${rotto ? 'NO  ' : 'ok  '}${nome.padEnd(22)} ${larghezza}x${altezza}  `
    + `tavolo ${m.sborda > 0 ? `sborda di ${m.sborda}px` : 'entra'}`
    + `${m.planciaSfora > 0 ? `, plancia fuori dal riquadro di ${m.planciaSfora}px` : ''}`
    + `${m.planciaSulSuggerimento > 0 ? `, copre il pulsante di ${m.planciaSulSuggerimento}px` : ''}`
    + `${m.sovrapposizione > 0 ? `, copre i pezzi di ${m.sovrapposizione}px` : ''}`);
  if (!m.pulsante) errori.push(`${nome} (${larghezza}x${altezza}): dopo la mossa il pulsante non c'e, lo scenario non prova quello che dice`);
  if (m.sborda > 0) errori.push(`${nome} (${larghezza}x${altezza}): il tavolo sborda di ${m.sborda}px`);
  if (m.planciaSfora > 0) errori.push(`${nome} (${larghezza}x${altezza}): la plancia esce dal suo riquadro di ${m.planciaSfora}px`);
  if (m.planciaSulSuggerimento > 0) {
    errori.push(`${nome} (${larghezza}x${altezza}): la plancia copre il pulsante di ${m.planciaSulSuggerimento}px`);
  }
  if (m.sovrapposizione > 0) {
    errori.push(`${nome} (${larghezza}x${altezza}): il tavolo copre i pezzi in mano di ${m.sovrapposizione}px`);
  }
  await page.close();
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} problemi di impaginazione:`);
  errori.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nLa home entra su tutti i formati provati, e nei livelli il tavolo non tocca i pezzi.');
