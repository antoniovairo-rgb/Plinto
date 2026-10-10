/**
 * Il video per la scheda dello store: un montaggio, non una partita qualunque.
 *
 * PERCHE' NON BASTA REGISTRARE E BASTA. Chi guarda un video di un gioco decide in tre
 * secondi. Una partita ripresa dall'inizio alla fine mostra tutto e non dice niente:
 * il tabellone si riempie, i punti salgono, e non si capisce ne' che cosa distingue
 * questo gioco dagli altri ne' che cosa si e' chiamati a fare.
 *
 * Qui le parti sono in un ordine deciso: la home, il percorso, un livello che dichiara
 * il suo obiettivo PRIMA di farti giocare, il livello giocato fino alla vittoria, e alla
 * fine un tratto di partita libera con gli Intrecci piu' grossi.
 *
 * VELOCE E PIENO DI ANIMAZIONI (richiesta del proprietario, 10 ottobre 2026). Il video
 * di prima durava oltre due minuti: un algoritmo giocava a passo lento ventidue mosse di
 * un livello qualunque. Adesso le mosse sono decise PRIMA, in Node, con il motore vero:
 * fra i primi sessanta livelli si e' cercato quello che si vince con meno mosse e piu'
 * eliminazioni (il 46: sette mosse, sei eliminazioni, un Intreccio e cinque Tinte), e per
 * la partita libera una posizione di partenza in cui la prima mossa chiude quattro gruppi
 * e le due dopo eliminano ancora (la prima scelta aveva due mosse a vuoto di fila).
 * Le ricerche stanno qui sotto, con i loro semi: il video si rifa' identico.
 *
 * Uso: npm run video
 */

import { chiudiAllUscita } from './server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawn as avvia } from 'node:child_process';
import { quadroNumero } from '../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../src/core/quadro.js';
import { createGame, placePiece, serializeGame } from '../src/core/engine.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio } from '../src/core/grid.js';
import { createRng } from '../src/core/rng.js';

/** L'ffmpeg che Playwright si porta dietro: nessuna dipendenza in piu' da installare. */
const FFMPEG = process.env.PLINTO_FFMPEG ?? '/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const USCITA = new URL('../store/video/', import.meta.url).pathname;

/**
 * LA RISOLUZIONE: 390x844 punti a densita' 2, cioe' 780x1688 pixel. Il primo video era
 * 390x844 PIXEL e su YouTube arrivava sfocato; i fotogrammi si chiedono al browser
 * (Page.startScreencast) alla densita' vera, non ridotti alla misura in punti CSS.
 *
 * Perche' 2 e non 3. A densita' 3 (1170x2532) il browser senza scheda grafica non stava
 * dietro agli aloni e alle animazioni della 1.21: circa 15 fotogrammi al secondo, e nei
 * momenti piu' carichi -- l'Intreccio, proprio quello da mostrare -- la scritta passava
 * in tre fotogrammi senza il suo «×4». A densita' 2 ne arrivano circa 35 al secondo
 * (misurato il 10 ottobre 2026) e l'Intreccio si vede intero. PLINTO_VIDEO_DENSITA=3
 * rifa' il video alla densita' piena, su una macchina che regge.
 */
const LARGHEZZA = 390;
const ALTEZZA = 844;
const DENSITA = Number(process.env.PLINTO_VIDEO_DENSITA ?? 2);
/** Fotogrammi al secondo del video finale: il browser ne manda solo quando cambia qualcosa. */
const FPS = 30;
const FOTOGRAMMI = `${USCITA}.fotogrammi/`;

/** Il livello da mostrare e il seme del giocatore che lo vince (vedi l'intestazione). */
const LIVELLO = 46;
const SEME_LIVELLO = 1004;
const SUPERATI = LIVELLO - 1;
/** La partita libera: il seme della posizione di partenza e quante mosse mostrarne. */
const SEME_LIBERA = 17671;
const MOSSE_LIBERA = 3;

/**
 * Il giocatore delle due ricerche: sceglie la posa che chiude piu' gruppi (al quadrato,
 * cosi' un Intreccio vale molto piu' di due mosse semplici), a parita' quella che lascia
 * la griglia piu' vuota, con un po' di caso deciso dal seme.
 */
function migliorPosa(grid, mano, rng, conCaso = true) {
  let migliore = null; let valore = -1e9;
  mano.forEach((pezzo, handIndex) => {
    if (!pezzo) return;
    for (const [row, col] of allPlacements(grid, pezzo.shape)) {
      const dopo = placeShape(grid, pezzo.shape, row, col, pezzo.color, pezzo.bombe).grid;
      const gruppi = findCompletedGroups(dopo).length;
      const v = conCaso
        ? gruppi * gruppi * 300 + (gruppi ? 150 : 0) - fillRatio(dopo) * 40 + rng.float() * 60
        : gruppi * gruppi * 100 + rng.float();
      if (v > valore) { valore = v; migliore = { handIndex, row, col }; }
    }
  });
  return migliore;
}

/** Le mosse che vincono il livello, giocate in Node con il motore vero. */
function mosseDelLivello() {
  const quadro = quadroNumero(LIVELLO);
  const rng = createRng(SEME_LIVELLO);
  let partita = iniziaQuadro(quadro, { now: 0 });
  const mosse = [];
  for (let m = 0; m < (quadro.maxMosse ?? 40) && !statoQuadro(quadro, partita).finito; m += 1) {
    const posa = migliorPosa(partita.grid, partita.hand, rng);
    if (!posa) break;
    partita = giocaNelQuadro(quadro, partita, posa.handIndex, posa.row, posa.col, (m + 1) * 1000);
    mosse.push(posa);
  }
  if (!statoQuadro(quadro, partita).completato) throw new Error(`Il livello ${LIVELLO} non si vince con il seme ${SEME_LIVELLO}`);
  return mosse;
}

/** La partita libera preparata: griglia di partenza, e le mosse che la sfruttano. */
function partitaLibera() {
  const rng = createRng(SEME_LIBERA * 7919);
  const riempimento = 0.55 + rng.float() * 0.15;
  const griglia = new Uint8Array(81);
  for (let i = 0; i < 81; i += 1) if (rng.float() < riempimento) griglia[i] = rng.int(6) + 1;
  let stato = createGame({ seed: SEME_LIBERA, grigliaIniziale: griglia, now: 0 });
  const iniziale = serializeGame(stato);
  const mosse = []; const gruppi = [];
  for (let m = 0; m < MOSSE_LIBERA; m += 1) {
    const posa = migliorPosa(stato.grid, stato.hand, rng, false);
    if (!posa) break;
    stato = placePiece(stato, posa.handIndex, posa.row, posa.col, (m + 1) * 1000);
    mosse.push(posa); gruppi.push(stato.lastMove?.groups?.length ?? 0);
  }
  return { iniziale, mosse, gruppi };
}

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}

let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  for (let i = 0; i < 30 && !(await serverRisponde()); i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!(await serverRisponde())) { console.error('Server non raggiungibile'); process.exit(1); }
}

mkdirSync(USCITA, { recursive: true });
rmSync(FOTOGRAMMI, { recursive: true, force: true });
mkdirSync(FOTOGRAMMI, { recursive: true });
// Senza questa opzione il browser senza finestra manda i fotogrammi in punti CSS anche
// con deviceScaleFactor 3: misurato, 390x844 invece di 1170x2532.
const browser = await chromium.launch({
  executablePath: ESEGUIBILE, args: [`--force-device-scale-factor=${DENSITA}`],
});
const context = await browser.newContext({
  viewport: { width: LARGHEZZA, height: ALTEZZA },
  deviceScaleFactor: DENSITA,
  locale: 'it-IT',
});
const page = await context.newPage();

// I fotogrammi arrivano con l'istante in cui il browser li ha disegnati. Si scrivono su
// disco e non in memoria: un minuto a 1170x2532 sono duemila immagini.
const fotogrammi = [];
const cdp = await context.newCDPSession(page);
/** Larghezza e altezza di un JPEG, lette dall'intestazione del fotogramma. */
function misuraJpeg(buf) {
  for (let i = 2; i + 9 < buf.length;) {
    const marcatore = buf[i + 1];
    if (marcatore === 0xc0 || marcatore === 0xc2) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return [0, 0];
}
let scartati = 0;
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  const buf = Buffer.from(data, 'base64');
  // Un video ha una misura sola: il primo fotogramma, disegnato mentre la finestra nasce,
  // e' alto 247 punti. Si scarta tutto cio' che non e' a piena misura.
  const [l, a] = misuraJpeg(buf);
  if (l !== LARGHEZZA * DENSITA || a !== ALTEZZA * DENSITA) { scartati += 1; return; }
  const file = `${FOTOGRAMMI}${String(fotogrammi.length).padStart(6, '0')}.jpg`;
  writeFileSync(file, buf);
  fotogrammi.push({ file, t: metadata.timestamp * 1000 });
});
await cdp.send('Page.startScreencast', {
  format: 'jpeg', quality: 92,
  maxWidth: LARGHEZZA * DENSITA, maxHeight: ALTEZZA * DENSITA, everyNthFrame: 1,
});

const livelli = {};
for (let n = 1; n <= SUPERATI; n += 1) {
  livelli[n] = { mosse: 9 + (n % 5), punteggio: 400 + n * 37, tentativi: 1 };
}

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate((q) => {
  window.localStorage.clear();
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, lingua: 'it', animazioni: true, aiutoVisivo: true }));
  // Chi e' al livello 46 ha superato 45 livelli, cioe' riscosso nove gettoni: ne tiene
  // due, cosi' nel livello si vede la cassetta accanto al gioco.
  window.localStorage.setItem('plinto:attrezzi', JSON.stringify({
    disponibili: 2, riscossi: 9, versione: 1 }));
  window.localStorage.setItem('plinto:records', JSON.stringify({
    best: 18740, bestChain: 7, bestMove: 612, bestGroupsInOneMove: 3 }));
  window.localStorage.setItem('plinto:quadri', JSON.stringify(q));
}, { versione: 1, livelli });
await page.reload({ waitUntil: 'networkidle' });

const pausa = (ms) => page.waitForTimeout(ms);

async function unaMossa({ handIndex, row, col }, respiro = 700) {
  const punti = await page.evaluate((m) => {
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const primo = celle[0]?.getBoundingClientRect();
    const destra = celle[8]?.getBoundingClientRect();
    const basso = celle[72]?.getBoundingClientRect();
    // Per POSTO del vassoio: dopo una mossa la mano ha dei buchi, e l'ennesimo pezzo
    // disegnato non e' l'ennesimo della mano.
    const pezzo = document.querySelectorAll('.pl-tray .pl-tray__posto')[m.handIndex]?.querySelector('.pl-pezzo');
    if (!primo || !destra || !basso || !pezzo) return null;
    const disegno = pezzo.getBoundingClientRect();
    const cellaVassoio = pezzo.firstElementChild.getBoundingClientRect();
    const passoX = (destra.left - primo.left) / 8;
    const passoY = (basso.top - primo.top) / 8;
    const presaX = disegno.left + disegno.width / 2;
    const presaY = disegno.top + disegno.height / 2;
    return {
      presaX, presaY,
      lasciaX: primo.left + m.col * passoX + ((presaX - disegno.left) / cellaVassoio.width) * primo.width,
      lasciaY: primo.top + m.row * passoY + ((presaY - disegno.top) / cellaVassoio.height) * primo.height,
    };
  }, { handIndex, row, col });
  if (!punti) return false;

  // Il gesto, svelto: presa, due tratti, rilascio. Il respiro dopo lascia vedere
  // l'eliminazione intera (onda, scie, Intreccio), che e' la ragione del video.
  await page.mouse.move(punti.presaX, punti.presaY);
  await page.mouse.down();
  await pausa(60);
  for (let i = 1; i <= 2; i += 1) {
    await page.mouse.move(
      punti.presaX + ((punti.lasciaX - punti.presaX) * i) / 2,
      punti.presaY + ((punti.lasciaY - punti.presaY) * i) / 2,
      { steps: 6 },
    );
  }
  await pausa(60);
  await page.mouse.up();
  await pausa(respiro);
  return true;
}

const tappe = [];
const segna = (nome) => tappe.push({ nome, a: Date.now() });

// LA REGISTRAZIONE E' GIA' PARTITA da quando e' nato il contesto, quindi ha filmato
// anche il caricamento e la preparazione dei dati: nel primo montaggio erano due secondi
// di schermo nero in apertura, e sfasavano tutte le parti successive. Si segna qui
// l'istante in cui la home e' davvero a schermo, e alla fine si taglia il video fin li'.
await page.waitForSelector('.pl-home__azioni');
await pausa(400);
const inizio = Date.now();

const sequenza = mosseDelLivello();
const libera = partitaLibera();

// --- 1. La home: che cosa c'e' dentro ----------------------------------------
segna('home');
await pausa(1600);

// --- 2. La mappa: esiste un percorso, e sei a un punto preciso ----------------
segna('mappa');
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappa');
// La mappa si porta da sola sul livello corrente: un istante per vederla, poi si entra.
await pausa(1700);

// --- 3. L'apertura: l'obiettivo detto PRIMA di giocare ------------------------
segna('apertura');
await page.locator('.pl-tappa').nth(LIVELLO - 1).click();
await page.waitForSelector('.pl-apertura');
await pausa(2300);

// --- 4. Il livello, vinto ------------------------------------------------------
segna('livello');
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-plancia');
await pausa(500);
for (const mossa of sequenza) {
  // La schermata di fine livello e' `.pl-screen.pl-fine`, la stessa della fine partita.
  if (await page.locator('.pl-fine').count()) break;
  if (!(await unaMossa(mossa))) break;
}

// --- 5. L'esito del livello ---------------------------------------------------
segna('esito livello');
await page.waitForSelector('.pl-fine', { timeout: 4000 }).catch(() => {});
// Se ha vinto lo dicono i progressi salvati, non l'aspetto della schermata.
const vinto = await page.evaluate((n) => {
  try {
    const p = JSON.parse(window.localStorage.getItem('plinto:quadri') ?? '{}');
    return Boolean(p?.livelli?.[n]);
  } catch { return false; }
}, LIVELLO);
await pausa(2600);

// --- 6. La partita libera: gli Intrecci piu' grossi ----------------------------
segna('partita libera');
await page.evaluate((stato) => {
  window.localStorage.setItem('plinto:partita', JSON.stringify(
    { ...stato, startedAt: Date.now(), ultimaAttivitaAt: Date.now() }));
}, libera.iniziale);
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
await pausa(500);
for (let i = 0; i < libera.mosse.length; i += 1) {
  // Dopo un Intreccio si aspetta che la scritta finisca; una mossa a vuoto passa svelta.
  if (!(await unaMossa(libera.mosse[i], libera.gruppi[i] >= 2 ? 1150 : 700))) break;
}
// Il video non si chiude a meta' di un'animazione: la prima stesura finiva proprio
// mentre compariva la scritta dell'Intreccio, tagliandola.
await pausa(1400);

const fine = Date.now();
await cdp.send('Page.stopScreencast').catch(() => {});
await context.close();
await browser.close();
if (server) server.kill();

/**
 * DA FOTOGRAMMI SPARSI A UN VIDEO A CADENZA FISSA. Il browser manda un'immagine solo
 * quando lo schermo cambia: a ogni istante del video finale si mette l'ultima arrivata.
 * Il video comincia da `inizio`, quando la home e' gia' a schermo: il caricamento e la
 * preparazione dei dati restano fuori, come prima.
 */
if (fotogrammi.length === 0) { console.error('Nessun fotogramma catturato'); process.exit(1); }
const finale = `${USCITA}plinto-montaggio.webm`;
const ffmpeg = avvia(FFMPEG, [
  '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', 'pipe:0',
  '-c:v', 'libvpx', '-b:v', '12M', '-crf', '8', '-qmin', '2', '-qmax', '24',
  '-deadline', 'good', '-cpu-used', '1', '-pix_fmt', 'yuv420p', finale,
], { stdio: ['pipe', 'ignore', 'ignore'] });
const chiuso = new Promise((ok) => ffmpeg.on('close', ok));
let indice = 0;
let buchi = 0;
for (let t = inizio; t <= fine; t += 1000 / FPS) {
  while (indice + 1 < fotogrammi.length && fotogrammi[indice + 1].t <= t) indice += 1;
  const scritto = ffmpeg.stdin.write(readFileSync(fotogrammi[indice].file));
  if (!scritto) await new Promise((ok) => ffmpeg.stdin.once('drain', ok));
}
// Il buco piu' lungo fra due fotogrammi: se lo screencast si fermasse (per esempio al
// cambio di pagina della sezione 6), il video mostrerebbe un'immagine ferma e lo si
// deve sapere, non scoprirlo guardandolo.
for (let i = 1; i < fotogrammi.length; i += 1) {
  if (fotogrammi[i].t >= inizio) buchi = Math.max(buchi, fotogrammi[i].t - fotogrammi[i - 1].t);
}
ffmpeg.stdin.end();
const codice = await chiuso;
rmSync(FOTOGRAMMI, { recursive: true, force: true });
if (codice !== 0) { console.error(`ffmpeg ha chiuso con codice ${codice}`); process.exit(1); }

console.log(`\nVideo: ${finale}`);
console.log(`${LARGHEZZA * DENSITA}x${ALTEZZA * DENSITA} a ${FPS} fotogrammi al secondo, `
  + `durata ${Math.round((fine - inizio) / 1000)}s, ${fotogrammi.length} fotogrammi catturati `
  + `(${scartati} scartati perche' non a piena misura), `
  + `pausa piu' lunga fra due fotogrammi ${Math.round(buchi)} ms`);
console.log('\nLe parti, nell ordine:');
tappe.forEach((t, i) => {
  const termine = tappe[i + 1]?.a ?? fine;
  console.log(`  ${String(Math.round((t.a - inizio) / 1000)).padStart(3)}s  ${t.nome.padEnd(16)} ${Math.round((termine - t.a) / 1000)}s`);
});
console.log(`\nLivello ${LIVELLO} ${vinto ? `superato in ${sequenza.length} mosse` : 'NON superato: il montaggio non ha la parte della vittoria'}`);
console.log(`Partita libera: gruppi chiusi mossa per mossa ${libera.gruppi.join(', ')}`);
