/**
 * Controllo dell'aspetto: schermi grandi, e telefoni piccoli con la home piu' affollata.
 *
 * DUE MISURE, DUE MOTIVI DIVERSI.
 *
 * 1. SU SCHERMO GRANDE il gioco puo' sfilacciarsi: e' disegnato per il telefono e
 *    provato su viewport da telefono. Si misura la distanza fra la fine del contenuto
 *    della presentazione e il pulsante principale.
 *
 * 2. SU TELEFONO PICCOLO la home puo' TAGLIARE. Ed e' successo davvero: la schermata
 *    centrava il contenuto senza scorrimento, il contenuto e' cresciuto di tre voci in
 *    tre versioni -- archivio, profilo, partita con anteprima -- e su un telefono da
 *    360x800, con una partita e una sfida entrambe in corso, il logo e' finito sotto la
 *    barra di stato e la versione sotto il bordo inferiore. Irraggiungibili, non solo
 *    invisibili. L'ha segnalato un giocatore guardando lo schermo, non un test.
 *
 *    La home viene quindi aperta nello stato PIU' AFFOLLATO possibile -- che e' anche
 *    l'unico in cui il difetto compare -- sui formati di telefono piu' stretti in giro.
 *
 * Uso: node tools/prova-desktop.mjs
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const USCITA = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-desktop';

await (await import('node:fs/promises')).mkdir(USCITA, { recursive: true });

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore',
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const errori = [];
const browser = await chromium.launch({ executablePath: ESEGUIBILE });

// La misura dello schermo della segnalazione, piu' un paio di casi limite.
const SCHERMI = [
  { nome: 'desktop', width: 1631, height: 1030 },
  { nome: 'monitor-grande', width: 1920, height: 1200 },
  { nome: 'portatile-basso', width: 1440, height: 700 },
  { nome: 'tablet', width: 820, height: 1180 },
];

for (const schermo of SCHERMI) {
  const page = await browser.newPage({ viewport: { width: schermo.width, height: schermo.height }, locale: 'it-IT' });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.localStorage.clear());
  await page.reload({ waitUntil: 'networkidle' });

  const misure = await page.evaluate(() => {
    const esempio = document.querySelector('.pl-intro__esempio');
    const bottone = document.querySelector('.pl-intro__azioni .pl-btn');
    if (!esempio || !bottone) return null;
    const e = esempio.getBoundingClientRect();
    const b = bottone.getBoundingClientRect();
    return { distanza: Math.round(b.top - e.bottom), larghezzaBottone: Math.round(b.width) };
  });
  await page.screenshot({ path: `${USCITA}/${schermo.nome}-intro.png` });

  if (!misure) { errori.push(`${schermo.nome}: presentazione non trovata`); await page.close(); continue; }
  console.log(`${schermo.nome.padEnd(18)} ${schermo.width}x${schermo.height}  vuoto sotto il contenuto: ${misure.distanza} px  pulsante largo ${misure.larghezzaBottone} px`);
  // Oltre due dita di vuoto fra il contenuto e l'azione principale, l'interfaccia
  // non sembra piu' progettata: sembra rotta.
  if (misure.distanza > 180) {
    errori.push(`${schermo.nome}: ${misure.distanza} px di vuoto fra il contenuto e il pulsante GIOCA`);
  }

  // E si deve poter giocare, non solo guardare.
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia', { timeout: 5000 }).catch(() => errori.push(`${schermo.nome}: la plancia non compare`));
  const plancia = await page.locator('.pl-plancia').boundingBox();
  if (plancia && plancia.height < 240) errori.push(`${schermo.nome}: plancia alta solo ${Math.round(plancia.height)} px`);
  await page.screenshot({ path: `${USCITA}/${schermo.nome}-partita.png` });
  await page.close();
}

// ---------------------------------------------------------------------------
// La home nello stato piu' affollato, sui telefoni piu' piccoli.
// ---------------------------------------------------------------------------
const { createGame, serializeGame } = await import('../src/core/engine.js');
// Una partita libera E una sfida entrambe in corso: e' la configurazione con piu' righe
// possibili in home (compare anche "Nuova partita"), ed e' quella del giocatore che ha
// segnalato il problema.
const PARTITA = serializeGame(createGame({ seed: 1 }));
const SFIDA = serializeGame(createGame({ seed: '2026-09-07' }));

const TELEFONI = [
  { nome: 'telefono-alto', width: 393, height: 873 },
  { nome: 'telefono-comune', width: 360, height: 800 },
  { nome: 'telefono-piccolo', width: 360, height: 740 },
  { nome: 'telefono-stretto', width: 320, height: 700 },
];

for (const schermo of TELEFONI) {
  const page = await browser.newPage({
    viewport: { width: schermo.width, height: schermo.height }, locale: 'it-IT',
  });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(([partita, sfida]) => {
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
    }));
    window.localStorage.setItem('plinto:quadri', JSON.stringify({
      versione: 1,
      livelli: Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [i + 1, { mosse: 8, punteggio: 400, tentativi: 1 }]),
      ),
    }));
    window.localStorage.setItem('plinto:records', JSON.stringify({ versione: 1, best: 454 }));
    window.localStorage.setItem('plinto:partita', JSON.stringify(partita));
    window.localStorage.setItem('plinto:partita-sfida', JSON.stringify(sfida));
  }, [PARTITA, SFIDA]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-home');

  const misure = await page.evaluate(() => {
    const home = document.querySelector('.pl-home');
    const testata = document.querySelector('.pl-home__testata');
    const versione = document.querySelector('.pl-home__versione');
    const primo = document.querySelector('.pl-home__azioni .pl-btn');
    return {
      testataTop: testata ? Math.round(testata.getBoundingClientRect().top) : null,
      versioneTrovata: Boolean(versione),
      scorrimento: home.scrollHeight - home.clientHeight,
      puoScorrere: getComputedStyle(home).overflowY !== 'visible',
      primoAltezza: primo ? Math.round(primo.getBoundingClientRect().height) : 0,
    };
  });
  await page.screenshot({ path: `${USCITA}/${schermo.nome}-home.png` });
  console.log(
    `${schermo.nome.padEnd(17)} ${schermo.width}x${schermo.height}  `
    + `testata y=${String(misure.testataTop).padStart(4)}  `
    + `${misure.scorrimento > 0 ? `da scorrere ${misure.scorrimento} px` : 'sta tutto'}`,
  );

  // Il taglio in alto e' il difetto vero: quello che si vede e non si puo' recuperare.
  if (misure.testataTop < 0) {
    errori.push(`${schermo.nome}: la testata e tagliata in alto (y=${misure.testataTop})`);
  }
  if (!misure.versioneTrovata) errori.push(`${schermo.nome}: la versione non c'e' in fondo alla home`);
  // Se qualcosa avanza, deve essere raggiungibile: sporgere senza poter scorrere
  // significa nascondere una parte della schermata per sempre.
  if (misure.scorrimento > 0 && !misure.puoScorrere) {
    errori.push(`${schermo.nome}: ${misure.scorrimento} px di contenuto fuori schermo e NON scorribili`);
  }
  // Il pulsante principale deve restare premibile col pollice anche quando si stringe.
  if (misure.primoAltezza < 44) {
    errori.push(`${schermo.nome}: il pulsante principale e alto ${misure.primoAltezza} px`);
  }
  await page.close();
}

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) console.log('Aspetto coerente su tutti gli schermi provati, dal monitor al telefono stretto.');
else errori.forEach((e) => console.log('PROBLEMA -', e));
process.exit(errori.length === 0 ? 0 : 1);
