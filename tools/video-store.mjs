/**
 * Il video per la scheda dello store: un montaggio, non una partita qualunque.
 *
 * PERCHE' NON BASTA REGISTRARE E BASTA. Chi guarda un video di un gioco decide in tre
 * secondi. Una partita ripresa dall'inizio alla fine mostra tutto e non dice niente:
 * il tabellone si riempie, i punti salgono, e non si capisce ne' che cosa distingue
 * questo gioco dagli altri ne' che cosa si e' chiamati a fare.
 *
 * Qui le sei parti sono in un ordine deciso: prima che cosa c'e' dentro (la home), poi
 * che esiste un percorso di cento livelli, poi che ogni livello dichiara il suo
 * obiettivo PRIMA di farti giocare, poi il gioco vero, poi la vittoria, e alla fine la
 * partita libera per chi non vuole obiettivi. Ogni parte risponde a una domanda che chi
 * guarda si sta facendo in quel momento.
 *
 * Il giocatore e' un algoritmo: sceglie la posa che chiude piu' gruppi. Si vede che non
 * esita mai, ed e' un limite dichiarato -- ma le mosse sono vere, le regole sono quelle
 * del gioco, e quello che si vede e' quello che si scarica.
 *
 * Uso: npm run video
 */

import { chiudiAllUscita } from './server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';
import { spawn as avvia } from 'node:child_process';

/** L'ffmpeg che Playwright si porta dietro: nessuna dipendenza in piu' da installare. */
const FFMPEG = process.env.PLINTO_FFMPEG ?? '/opt/pw-browsers/ffmpeg-1011/ffmpeg-linux';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const USCITA = new URL('../store/video/', import.meta.url).pathname;

/**
 * LA RISOLUZIONE E' QUELLA DI UN TELEFONO VERO: 390x844 punti a densita' 3, cioe'
 * 1170x2532 pixel. Il video di prima era 390x844 PIXEL: il registratore di Playwright
 * riduce i fotogrammi alla misura in punti CSS, e su YouTube il gioco arrivava sfocato,
 * a 219 kb/s. Ingrandirlo dopo non recupera niente, rende solo piu' grande la sfocatura.
 * Qui i fotogrammi si chiedono al browser (Page.startScreencast) alla densita' vera.
 */
const LARGHEZZA = 390;
const ALTEZZA = 844;
const DENSITA = 3;
/** Fotogrammi al secondo del video finale: il browser ne manda solo quando cambia qualcosa. */
const FPS = 30;
const FOTOGRAMMI = `${USCITA}.fotogrammi/`;

/** Il livello da mostrare: obiettivo semplice da leggere, vittoria alla portata. */
const LIVELLO = 11;
const SUPERATI = LIVELLO - 1;

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
  // Dieci livelli superati valgono due attrezzi: cosi' nel livello si vede la cassetta
  // accanto al gioco, com'e' per chi ci arriva davvero.
  window.localStorage.setItem('plinto:attrezzi', JSON.stringify({
    disponibili: 2, riscossi: 2, versione: 1 }));
  window.localStorage.setItem('plinto:records', JSON.stringify({
    best: 18740, bestChain: 7, bestMove: 612, bestGroupsInOneMove: 3 }));
  window.localStorage.setItem('plinto:quadri', JSON.stringify(q));
}, { versione: 1, livelli });
await page.reload({ waitUntil: 'networkidle' });

const pausa = (ms) => page.waitForTimeout(ms);

/** La posa che chiude di piu'. Stessa logica del controllo delle frasi. */
const scegliMossa = () => page.evaluate(() => {
  const L = 9;
  const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
  if (celle.length !== L * L) return null;
  const pieno = celle.map((c) => !!c.querySelector('.pl-blocco'));
  const forme = [...document.querySelectorAll('.pl-tray .pl-pezzo')].map((n) => {
    const col = getComputedStyle(n).gridTemplateColumns.split(' ').filter(Boolean).length;
    const riq = [...n.children]; const punti = [];
    riq.forEach((c, i) => { if (c.querySelector('.pl-blocco')) punti.push([Math.floor(i / col), i % col]); });
    return { col, righe: riq.length / col, punti };
  });
  const chiusure = (d) => {
    let n = 0;
    for (let r = 0; r < L; r += 1) { let t = true; for (let c = 0; c < L; c += 1) if (!d[r*L+c]) { t = false; break; } if (t) n += 1; }
    for (let c = 0; c < L; c += 1) { let t = true; for (let r = 0; r < L; r += 1) if (!d[r*L+c]) { t = false; break; } if (t) n += 1; }
    for (let q = 0; q < L; q += 1) {
      const r0 = Math.floor(q / 3) * 3; const c0 = (q % 3) * 3; let t = true;
      for (let r = r0; r < r0 + 3 && t; r += 1) for (let c = c0; c < c0 + 3; c += 1) if (!d[r*L+c]) { t = false; break; }
      if (t) n += 1;
    }
    return n;
  };
  let best = null;
  forme.forEach((f, i) => {
    for (let r = 0; r + f.righe <= L; r += 1) for (let c = 0; c + f.col <= L; c += 1) {
      const b = f.punti.map(([dr, dc]) => (r + dr) * L + (c + dc));
      if (b.some((x) => pieno[x])) continue;
      const d = pieno.slice(); b.forEach((x) => { d[x] = true; });
      const voto = chiusure(d) * 1000 - (r * L + c);
      if (!best || voto > best.voto) {
        best = { voto, pezzo: i, riga: r, colonna: c, larghezza: f.col, altezza: f.righe };
      }
    }
  });
  return best;
});

/**
 * Una mossa TRASCINATA, non toccata.
 *
 * PERCHE' NON BASTAVANO I DUE TOCCHI. Il primo montaggio guidava il gioco con la
 * modalita' a due tocchi -- tocca il pezzo, tocca la casella -- che nel gioco esiste
 * davvero ed e' la strada di chi non riesce a trascinare. Ma a video il pezzo spariva
 * dal vassoio e ricompariva sulla griglia senza percorrere niente, e il risultato
 * sembrava un gioco che scatta. Non era il gioco: era il modo di filmarlo. Un video
 * dello store deve mostrare il gesto con cui si gioca davvero.
 *
 * DOVE ATTERRA IL PEZZO. Il trascinamento non centra il pezzo sulla casella sotto il
 * dito: tiene il punto in cui l'hai AFFERRATO e da li' calcola l'angolo. Prendendolo
 * esattamente al centro del disegno, la presa vale meta' larghezza e meta' altezza in
 * unita' di cella, quindi per far atterrare l'angolo in (riga, colonna) si lascia a
 * mezza forma di distanza. La formula e' ricopiata da useTrascinamento.js: se quella
 * cambia, questa smette di funzionare e il video lo mostra subito.
 */
async function unaMossa(respiro = 520) {
  const s = await scegliMossa();
  if (!s) return false;

  const punti = await page.evaluate((m) => {
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const primo = celle[0]?.getBoundingClientRect();
    const destra = celle[8]?.getBoundingClientRect();
    const basso = celle[72]?.getBoundingClientRect();
    const disegno = document.querySelectorAll('.pl-tray .pl-pezzo')[m.pezzo]?.getBoundingClientRect();
    if (!primo || !destra || !basso || !disegno) return null;
    const passoX = (destra.left - primo.left) / 8;
    const passoY = (basso.top - primo.top) / 8;
    return {
      presaX: disegno.left + disegno.width / 2,
      presaY: disegno.top + disegno.height / 2,
      lasciaX: primo.left + m.colonna * passoX + (m.larghezza / 2) * primo.width,
      lasciaY: primo.top + m.riga * passoY + (m.altezza / 2) * primo.width,
    };
  }, s);
  if (!punti) return false;

  // Il gesto: presa, un istante di sollevamento, tre tratti di percorso, rilascio.
  // A tappe e non in un balzo solo, perche' e' il percorso a raccontare il gioco --
  // l'anteprima che segue il pezzo, le caselle che si accendono sotto.
  await page.mouse.move(punti.presaX, punti.presaY);
  await page.mouse.down();
  await pausa(140);
  const tratti = 3;
  for (let i = 1; i <= tratti; i += 1) {
    await page.mouse.move(
      punti.presaX + ((punti.lasciaX - punti.presaX) * i) / tratti,
      punti.presaY + ((punti.lasciaY - punti.presaY) * i) / tratti,
      { steps: 10 },
    );
    await pausa(70);
  }
  await pausa(120);
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

// --- 1. La home: che cosa c'e' dentro ----------------------------------------
segna('home');
await pausa(3200);

// --- 2. La mappa: esiste un percorso, e sei a un punto preciso ----------------
segna('mappa');
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappa');
await page.evaluate(() => {
  const s = [...document.querySelectorAll('*')].find((n) => n.scrollTop > 0);
  if (s) s.scrollTop = 0;
});
await pausa(2200);
// Una scorsa lenta: cento livelli non si raccontano con un fotogramma fermo.
await page.evaluate(async () => {
  const s = [...document.querySelectorAll('*')].find((n) => n.scrollHeight > n.clientHeight + 40);
  if (!s) return;
  const meta = Math.min(s.scrollHeight - s.clientHeight, 1500);
  const passi = 90;
  for (let i = 1; i <= passi; i += 1) {
    s.scrollTop = (meta * i) / passi;
    await new Promise((r) => setTimeout(r, 26));
  }
});
await pausa(900);

// --- 3. L'apertura: l'obiettivo detto PRIMA di giocare ------------------------
segna('apertura');
await page.evaluate(() => {
  const s = [...document.querySelectorAll('*')].find((n) => n.scrollTop > 0);
  if (s) s.scrollTop = 0;
});
await pausa(500);
await page.locator('.pl-tappa').nth(LIVELLO - 1).click();
await page.waitForSelector('.pl-apertura');
await pausa(3600);

// --- 4. Il livello: il gioco vero ---------------------------------------------
segna('livello');
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-plancia');
await pausa(700);
for (let i = 0; i < 22; i += 1) {
  // La schermata di fine livello e' `.pl-screen.pl-fine`, la stessa della fine partita.
  // Il primo tentativo cercava `.pl-fine-quadro`, che non esiste: il montaggio veniva
  // dichiarato senza vittoria mentre la vittoria c'era. Un selettore inventato non
  // fallisce, mente.
  if (await page.locator('.pl-fine').count()) break;
  if (!(await unaMossa())) break;
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
await pausa(4200);

// --- 6. La partita libera: per chi non vuole obiettivi -------------------------
segna('partita libera');
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await pausa(900);
await page.locator('.pl-home__azioni .pl-sfida-avvio').nth(1).click();
await page.waitForSelector('.pl-plancia');
await pausa(700);
// Otto mosse. Erano sedici, poi undici: ogni taratura e' stata rifatta dopo aver
// MISURATO il video, non stimato. Col trascinamento vero una mossa costa piu' tempo di
// quanto ne costasse col tocco, e il conto andava rifatto.
for (let i = 0; i < 8; i += 1) {
  if (!(await unaMossa(620))) break;
}
await pausa(1800);

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
console.log(`\nLivello ${LIVELLO} ${vinto ? 'superato' : 'NON superato: il montaggio non ha la parte della vittoria'}`);
