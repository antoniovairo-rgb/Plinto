/**
 * Tutti e cento i livelli, giocati DENTRO L'APP.
 *
 * PERCHE' ESISTE, VISTO CHE C'E' GIA' `npm run quadri`. Quello strumento gioca i livelli
 * chiamando il motore: risponde a "il livello e' superabile?" e lo fa bene, ma non tocca
 * una sola volta l'interfaccia. Fra il motore e il giocatore ci sono la mano da toccare,
 * la casella da centrare, il conteggio delle mosse, la barra dell'obiettivo e la
 * schermata di fine -- e un livello puo' essere perfettamente superabile nel motore e
 * irraggiungibile nell'app, per un pezzo che non si riesce a selezionare o una vittoria
 * che non viene riconosciuta. Il percorso a livelli e' il cuore del gioco: merita una
 * prova che lo attraversi tutto per la porta principale.
 *
 * COME. Per ogni livello si calcola prima, con il motore, una sequenza di mosse che lo
 * vince (lo stesso giocatore artificiale di `npm run quadri`, gli stessi semi). Poi
 * quella sequenza viene rigiocata NEL BROWSER toccando il pezzo e poi la casella, e si
 * controlla che l'app dichiari il livello superato.
 *
 * UN DETTAGLIO CHE HA FATTO FALLIRE LA PRIMA VERSIONE. Il motore ragiona per ORIGINE del
 * pezzo -- la cella in alto a sinistra del suo ingombro -- mentre il tocco a due passaggi
 * CENTRA il pezzo sulla casella toccata: chi gioca punta il dito dove vuole il centro del
 * pezzo, non il suo angolo. Toccando la cella dell'origine il pilota chiedeva un'altra
 * posizione, e dopo poche mosse l'app rifiutava. Sembrava un difetto dell'app ed era il
 * pilota. La conversione la fa `origineDaCella`, importata dall'app: cosi' se un giorno
 * quella regola cambiasse, il pilota cambierebbe con lei.
 *
 * Cosa dimostra: che i cento livelli sono vincibili con le dita, non solo in teoria, e
 * che l'app e il motore raccontano la stessa partita mossa per mossa. Se l'interfaccia
 * perdesse una mossa, ne applicasse un'altra o non riconoscesse la vittoria, qui si
 * vedrebbe -- ed e' esattamente cio' che nessun'altra prova puo' vedere.
 *
 * Cosa NON dimostra: che sia divertente. Quella parte la puo' dire solo una persona.
 *
 * Uso: npm run livelli            (tutti e cento)
 *      npm run livelli -- 1 20    (solo un tratto, per lavorarci)
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { QUADRI } from '../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../src/core/quadro.js';
import { createRng, seedFromString } from '../../src/core/rng.js';
import { preferenze, scegliMossa } from '../../src/sim/giocatore-quadri.mjs';
// La stessa funzione che usa l'app, non una sua copia: se un giorno il tocco a due
// passaggi cambiasse regola, questo pilota cambierebbe con lei invece di accusare l'app.
import { origineDaCella } from '../../src/ui/useTrascinamento.js';

const DA = Number(process.argv[2] ?? 1);
const A = Number(process.argv[3] ?? QUADRI.length);
// Gli stessi dodici semi con cui il generatore garantisce che il livello sia superabile.
// Non e' una comodita': se qui si usassero semi diversi, questa prova misurerebbe partite
// che nessuno ha mai promesso vincibili, e i suoi fallimenti non direbbero niente.
const SEMI = 12;

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-e2e';
await (await import('node:fs/promises')).mkdir(OUT, { recursive: true });

const errori = [];

/**
 * La sequenza di mosse che vince il livello, calcolata col motore.
 * @returns {{mosse: {handIndex:number,row:number,col:number}[], forme: {height:number,width:number}[], seme:number}|null}
 */
function lineaVincente(quadro) {
  for (let s = 0; s < SEMI; s += 1) {
    const rng = createRng(seedFromString(`prova-${quadro.numero}-${s}`));
    const pref = preferenze(quadro);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    const forme = [];
    for (let m = 0; m < (quadro.maxMosse ?? 300); m += 1) {
      if (statoQuadro(quadro, partita).finito) break;
      const mossa = scegliMossa(partita, pref, rng);
      if (!mossa) break;
      const { shape } = partita.hand[mossa.handIndex];
      partita = giocaNelQuadro(quadro, partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
      mosse.push({ handIndex: mossa.handIndex, row: mossa.row, col: mossa.col });
      forme.push({ height: shape.height, width: shape.width });
    }
    if (statoQuadro(quadro, partita).completato) return { mosse, forme, seme: s };
  }
  return null;
}

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
const page = await browser.newPage({ viewport: { width: 420, height: 900 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
// Tutti i livelli sbloccati: qui non si sta provando la progressione (ha gia' il suo
// scenario) ma che ogni livello, aperto, si possa vincere con le dita.
await page.evaluate((totale) => {
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true,
  }));
  window.localStorage.setItem('plinto:quadri', JSON.stringify({
    versione: 1,
    livelli: Object.fromEntries(
      Array.from({ length: totale }, (_, i) => [i + 1, { mosse: 9, punteggio: 100, tentativi: 1 }]),
    ),
  }));
}, QUADRI.length);

console.log(`\nPLINTO — i livelli da ${DA} a ${A}, giocati nell'app\n`);
console.log('   #  mosse  esito');
console.log('  ' + '-'.repeat(64));

const falliti = [];
let vinti = 0;
let senzaLinea = 0;

for (let n = DA; n <= A; n += 1) {
  const quadro = QUADRI.find((q) => q.numero === n);
  const linea = lineaVincente(quadro);
  if (!linea) {
    // Il motore stesso non trova una vittoria in dodici tentativi: e' un problema di
    // taratura, non dell'app, e va corretto rigenerando i livelli. Qui si annota e basta,
    // perche' questa prova non puo' dire niente su un livello che non sa come si vince.
    senzaLinea += 1;
    falliti.push(`${n}: nessuna vittoria nel motore in ${SEMI} tentativi`);
    console.log(`  ${String(n).padStart(3)}      -  IL MOTORE NON LO VINCE (non provato nell'app)`);
    continue;
  }

  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  const tappa = page.locator('.pl-tappa').nth(n - 1);
  await tappa.scrollIntoViewIfNeeded();
  await tappa.click();
  await page.waitForSelector('.pl-apertura');
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia');

  /**
   * Le mosse rimaste, lette dalla barra dell'obiettivo.
   *
   * La prima versione contava i blocchi sulla plancia per capire se la mossa fosse stata
   * accettata, e sbagliava: una mossa che chiude un gruppo AGGIUNGE celle e poi ne toglie
   * nove, e il conto puo' tornare identico. Dieci livelli su cento risultavano falliti
   * proprio nel momento in cui la mossa era riuscita meglio -- tutti su righe e colonne
   * multiple di tre, cioe' sui bordi dei quadranti. Il contatore delle mosse invece cala
   * di uno per ogni mossa accettata e di zero per ogni mossa rifiutata, sempre.
   */
  const mosseRimaste = async () => {
    const testo = await page.locator('.pl-obiettivo__mosse strong').first().innerText().catch(() => null);
    return testo === null ? null : Number(testo.trim());
  };

  let applicate = 0;
  let rifiutata = null;
  for (const mossa of linea.mosse) {
    const prima = await mosseRimaste();
    const pezzo = page.locator('.pl-tray__posto').nth(mossa.handIndex).locator('.pl-pezzo-presa');
    if ((await pezzo.count()) === 0) { rifiutata = `${applicate + 1}: nessun pezzo nello slot ${mossa.handIndex}`; break; }
    await pezzo.click();
    // Dall'origine che vuole il motore alla casella che va toccata: si tocca il centro.
    const forma = linea.forme[applicate];
    const tocco = {
      row: mossa.row + Math.floor((forma.height - 1) / 2),
      col: mossa.col + Math.floor((forma.width - 1) / 2),
    };
    const verifica = origineDaCella(forma, tocco.row, tocco.col);
    if (verifica.row !== mossa.row || verifica.col !== mossa.col) {
      rifiutata = `${applicate + 1}: il pilota non sa dove toccare per l origine ${mossa.row},${mossa.col}`;
      break;
    }
    await page.locator('.pl-plancia .pl-cella').nth(tocco.row * 9 + tocco.col).click();
    await page.waitForTimeout(15);
    const finita = (await page.locator('.pl-fine').count()) > 0;
    const dopo = await mosseRimaste();
    if (!finita && prima !== null && dopo !== null && dopo >= prima) {
      rifiutata = `${applicate + 1}: l app non ha accettato il pezzo ${mossa.handIndex} in riga ${mossa.row} colonna ${mossa.col}`;
      break;
    }
    applicate += 1;
    if (finita) break;
  }

  await page.waitForTimeout(60);
  const vinto = await page.locator('.pl-quadro-esito--vinto').count() > 0;
  const finito = await page.locator('.pl-fine').count() > 0;

  if (vinto) {
    vinti += 1;
    console.log(`  ${String(n).padStart(3)}  ${String(applicate).padStart(5)}  vinto`);
  } else {
    const dettaglio = rifiutata ?? (finito ? 'finito ma non vinto' : 'nessuna schermata di fine');
    falliti.push(`${n}: ${dettaglio}`);
    await page.screenshot({ path: `${OUT}/livello-${n}-fallito.png` });
    console.log(`  ${String(n).padStart(3)}  ${String(applicate).padStart(5)}  FALLITO — ${dettaglio}`);
  }
}

await browser.close();
if (server) server.kill();

const provati = A - DA + 1;
console.log('  ' + '-'.repeat(64));
console.log(`  vinti nell'app: ${vinti}/${provati}`);
if (senzaLinea) console.log(`  livelli che il motore non vince: ${senzaLinea}`);

console.log('\n================ ESITO ================');
if (falliti.length === 0 && errori.length === 0) {
  console.log(`Tutti i livelli da ${DA} a ${A} si vincono giocandoli nell'app.`);
} else {
  falliti.forEach((f) => console.error(`PROBLEMA - livello ${f}`));
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
