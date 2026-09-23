/**
 * Genera le schermate per gli store, dal gioco vero.
 *
 * Non sono mockup: ogni immagine e' una fotografia del gioco che gira, con stati
 * costruiti apposta perche' mostrino qualcosa di significativo invece di una griglia
 * a caso. Rifarle dopo una modifica all'interfaccia costa un comando.
 *
 * Uso: npm run schermate    (le immagini finiscono in store/)
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { createGame, serializeGame, placePiece } from '../src/core/engine.js';
import { allPlacements, fillRatio } from '../src/core/grid.js';
import { createRng } from '../src/core/rng.js';
import { chooseMove } from '../src/sim/player.mjs';
import { findCompletedGroups, placeShape } from '../src/core/grid.js';
import { existsSync } from 'node:fs';

/**
 * Percorso del browser.
 *
 * In questo ambiente di sviluppo Chromium e' preinstallato in una posizione fissa;
 * in integrazione continua e sulle macchine altrui lo installa Playwright, e quel
 * percorso non esiste. Se il percorso noto non c'e', si lascia decidere a Playwright
 * passando `undefined`: cosi' gli stessi script girano ovunque senza modifiche.
 */
const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;


const USCITA = new URL('../store/', import.meta.url).pathname;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

// 412x732 a densita' 3 = 1236x2196, cioe' 9:16.
//
// PRIMA ERA 390x844 (1170x2532), e la Play Console non l'avrebbe accettato: la guida di
// Google chiede che il lato lungo non superi il DOPPIO di quello corto, e 2532/1170 fa
// 2,16. Raccomanda inoltre 9:16 con almeno 1080 px sul lato corto. 412x732 e' anche uno
// dei formati che la prova di impaginazione controlla gia' ("schermo basso"), quindi
// l'interfaccia e' verificata a questa misura e non solo fotografata.
const LARGHEZZA = 412;
const ALTEZZA = 732;
const DENSITA = 3;

// La Play Console accetta AL MASSIMO otto schermate per tipo di dispositivo.
const MASSIMO_SCHERMATE = 8;

await mkdir(USCITA, { recursive: true });

// I NUMERI DEI FILE SONO L'ORDINE DI CARICAMENTO sulla scheda, deciso e motivato in
// android/SCHEDA-PLAY-STORE.md: prima i livelli, che sono il percorso principale. Prima
// i numeri seguivano l'ordine di produzione e serviva una tabella per tradurli.
//
// Le schermate di un giro precedente si tolgono prima di cominciare: con la numerazione
// cambiata, una vecchia `9-livello.png` resterebbe li' e verrebbe caricata per sbaglio.
{
  const { readdir, unlink } = await import('node:fs/promises');
  for (const nome of await readdir(USCITA)) {
    if (/^(\d+|riserva)-.+\.png$/.test(nome)) await unlink(`${USCITA}${nome}`);
  }
}

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  // In un GRUPPO DI PROCESSI suo, per poterlo chiudere tutto. `npx` lancia `vite` come
  // processo figlio, e `server.kill()` fermava solo `npx`: vite restava acceso a servire
  // la versione di allora, ed e' proprio il server vecchio che fa fallire il gate al
  // controllo "il server di prova serve questa versione". Visto succedere.
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({
  viewport: { width: LARGHEZZA, height: ALTEZZA },
  deviceScaleFactor: DENSITA,
  locale: 'it-IT',
});

const impostazioni = {
  introVista: true, lingua: 'it',
  audio: true, vibrazione: true, animazioni: true, aiutoVisivo: true,
};

async function prepara({
  partita = null, record = null, statistiche = null, sfide = null, quadri = null, attrezzi = null,
}) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate((dati) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify(dati.impostazioni));
    if (dati.partita) window.localStorage.setItem('plinto:partita', JSON.stringify(dati.partita));
    if (dati.record) window.localStorage.setItem('plinto:records', JSON.stringify(dati.record));
    if (dati.statistiche) window.localStorage.setItem('plinto:statistiche', JSON.stringify(dati.statistiche));
    if (dati.sfide) window.localStorage.setItem('plinto:sfide', JSON.stringify(dati.sfide));
    if (dati.quadri) window.localStorage.setItem('plinto:quadri', JSON.stringify(dati.quadri));
    if (dati.attrezzi) window.localStorage.setItem('plinto:attrezzi', JSON.stringify(dati.attrezzi));
  }, { impostazioni, partita, record, statistiche, sfide, quadri, attrezzi });
  await page.reload({ waitUntil: 'networkidle' });
}

/**
 * Una partita VERA, giocata fino a quando lo stato serve.
 *
 * Le griglie scritte a mano hanno un difetto che si vede solo guardando l'immagine
 * finita: non sono posizioni che il gioco produce. Una di esse lasciava due pezzi su
 * tre senza un posto dove andare -- tre riquadri spenti nel punto in cui l'occhio
 * cerca la mossa successiva. Qui gioca il giocatore simulato, con il motore vero:
 * qualunque stato esca e' uno stato raggiungibile, e finche' la partita non e' finita
 * almeno un pezzo entra per costruzione.
 *
 * @param {number} seme
 * @param {(stato:object) => boolean} basta si ferma al primo stato che soddisfa questa
 * @returns {object} lo stato del motore, non serializzato
 */
function giocaFinche(seme, basta, { profilo = 'esperto', massimo = 400 } = {}) {
  let stato = createGame({ seed: seme, now: 0 });
  const rng = createRng((seme ^ 0x9e3779b9) >>> 0);
  for (let m = 0; m < massimo; m += 1) {
    if (stato.status !== 'playing') break;
    if (basta(stato)) return stato;
    const mossa = chooseMove(stato, profilo, rng);
    if (!mossa) break;
    stato = placePiece(stato, mossa.handIndex, mossa.row, mossa.col, m * 1000);
  }
  return stato;
}

/** La mossa in mano che chiude piu' gruppi, se ce n'e' una. */
function mossaPiuGrossa(stato) {
  let migliore = null;
  stato.hand.forEach((pezzo, handIndex) => {
    if (!pezzo) return;
    for (const [row, col] of allPlacements(stato.grid, pezzo.shape)) {
      const { grid } = placeShape(stato.grid, pezzo.shape, row, col, pezzo.color, pezzo.bombe);
      const gruppi = findCompletedGroups(grid).length;
      if (gruppi > (migliore?.gruppi ?? 0)) migliore = { handIndex, row, col, gruppi, pezzo };
    }
  });
  return migliore;
}

/**
 * Dove toccare per posare un pezzo con l'origine in (row, col).
 * Il gesto a due tocchi CENTRA il pezzo sulla cella toccata: l'inversa di
 * `origineDaCella` in `src/ui/useTrascinamento.js`. Scritta qui e non importata perche'
 * e' l'unico punto in cui serve, ma se quella cambia questa va cambiata con lei.
 */
function cellaDaToccare(shape, row, col) {
  return { row: row + Math.floor((shape.height - 1) / 2), col: col + Math.floor((shape.width - 1) / 2) };
}

/** Avanzamento finto: i primi `quanti` livelli superati, per mostrare la mappa viva. */
function progressiFinoA(quanti) {
  const livelli = {};
  for (let n = 1; n <= quanti; n += 1) {
    livelli[n] = { mosse: 9 + (n % 5), punteggio: 400 + n * 37, tentativi: 1 + (n % 3) };
  }
  return { versione: 1, livelli };
}

const RECORD = { best: 18740, bestChain: 7, bestMove: 612, bestGroupsInOneMove: 3 };
const STATISTICHE = {
  partite: 84, punteggioTotale: 268400, mosseTotali: 9120,
  gruppiTotali: 3180, griglieSvuotate: 6, tempoTotaleMs: 27_600_000,
};

// --- Home (riserva, fuori dalle otto) ----------------------------------------
// Lo stesso avanzamento della mappa (schermata 1): una home a "Livello 1, 0 di 100"
// accanto a una mappa con ventitre' livelli superati raccontava due giocatori diversi.
await prepara({
  record: RECORD,
  sfide: { [new Date().toISOString().slice(0, 10)]: { best: 4120, partite: 3 } },
  quadri: progressiFinoA(23),
  attrezzi: { disponibili: 2, riscossi: 4, versione: 1 },
});

/**
 * La versione mostrata dev'essere QUESTA versione.
 *
 * E' successo davvero: un server di sviluppo rimasto acceso da prima di un cambio di
 * versione ha prodotto schermate che dicevano `v1.6.0` mentre il gioco era alla 1.7.0.
 * Il numero della versione viene iniettato quando il server PARTE, non a ogni richiesta,
 * quindi le modifiche al codice si vedevano e quella no: il tipo di sbaglio che passa
 * inosservato proprio perche' tutto il resto e' aggiornato.
 *
 * Non e' un dettaglio da poco: queste immagini finiscono sulla scheda del Play Store, e
 * una schermata che dichiara una versione che non esiste piu' e' l'unica bugia che il
 * negozio racconterebbe al posto tuo.
 */
{
  const { readFile } = await import('node:fs/promises');
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  const mostrata = (await page.locator('.pl-home__versione').innerText().catch(() => '')).trim();
  if (mostrata !== `v${pkg.version}`) {
    throw new Error(
      `La home mostra "${mostrata}" invece di "v${pkg.version}". `
      + 'Quasi sempre e\' un server di sviluppo rimasto acceso da prima del cambio di '
      + 'versione: fermalo e rilancia questo comando.',
    );
  }
}

// La home NON e' fra le otto: mostra bene l'insieme delle modalita' ma dice meno di una
// schermata di gioco a chi scorre in fretta (vedi android/SCHEDA-PLAY-STORE.md). Resta
// pronta come ricambio, con un nome che il controllo delle otto non conta.
await page.screenshot({ path: `${USCITA}riserva-home.png` });

// --- 5. Partita in corso, con la Catena accesa --------------------------------
// Lo stato non e' scritto a mano: e' il primo momento, in una partita vera giocata dal
// giocatore simulato, in cui la Catena e' alta, la plancia e' piena a meta' e tutti e
// tre i pezzi hanno un posto dove andare.
const CATENA_ALTA = (x) => x.score >= 6000 && x.chain >= 6
  && x.hand.filter(Boolean).length === 3
  && x.hand.every((p) => allPlacements(x.grid, p.shape).length > 0);

const inCorso = giocaFinche(1, (x) => CATENA_ALTA(x) && fillRatio(x.grid) >= 0.33 && fillRatio(x.grid) <= 0.46);
if (!inCorso) throw new Error('Nessuno stato adatto alla schermata 5');
await prepara({ record: RECORD, partita: serializeGame(inCorso) });
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
await page.waitForTimeout(250);
await page.screenshot({ path: `${USCITA}5-partita.png` });

// --- 4. Il momento dell'eliminazione, con particelle e punti ------------------
// Stessa partita, e la mossa che chiude due gruppi insieme: e' l'Intreccio, la mossa
// che il gioco esiste per insegnare. Viene eseguita davvero, con i due tocchi.
const primaDelColpo = giocaFinche(1, (x) => CATENA_ALTA(x) && (mossaPiuGrossa(x)?.gruppi ?? 0) >= 2);
if (!primaDelColpo) throw new Error('Nessuno stato adatto alla schermata 4');
const colpo = mossaPiuGrossa(primaDelColpo);
const tocco = cellaDaToccare(colpo.pezzo.shape, colpo.row, colpo.col);

await prepara({ record: RECORD, partita: serializeGame(primaDelColpo) });
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
await page.locator('.pl-tray .pl-pezzo').nth(colpo.handIndex).click();
await page.locator('.pl-plancia .pl-cella').nth(tocco.row * 9 + tocco.col).click();
await page.waitForTimeout(150);   // a meta' animazione: particelle in volo e punti visibili
await page.screenshot({ path: `${USCITA}4-eliminazione.png` });

// --- 6. Fine partita ----------------------------------------------------------
// UNA PARTITA VERA, fino all'ultima mossa. Prima lo stato era scritto a mano: una griglia
// a scacchiera con 15.230 punti inventati, e il riepilogo lo tradiva -- "Mosse 1",
// "Mossa migliore 1" e una durata di 29 milioni di minuti, perche' la partita finta
// cominciava all'istante zero del 1970. Qui gioca il giocatore simulato finche' la mossa
// successiva non chiuderebbe la partita; quella mossa la fa il dito, nel gioco vero.
const ultima = (() => {
  let stato = createGame({ seed: 3, now: 0 });
  const rng = createRng((3 ^ 0x9e3779b9) >>> 0);
  for (let m = 0; m < 2000 && stato.status === 'playing'; m += 1) {
    const mossa = chooseMove(stato, 'esperto', rng);
    if (!mossa) break;
    const dopo = placePiece(stato, mossa.handIndex, mossa.row, mossa.col, m * 1000);
    if (dopo.status === 'over') return { stato, mossa };
    stato = dopo;
  }
  throw new Error('Nessuna partita finita per la schermata 6');
})();
// L'inizio si sposta a qualche minuto fa, altrimenti la durata sarebbe di nuovo quella
// dal 1970: e' lo stesso campo, e si legge alla fine della partita.
const minutiDiGioco = 11;
const salvataggioFinale = {
  ...serializeGame(ultima.stato),
  startedAt: Date.now() - minutiDiGioco * 60_000,
};
await prepara({ record: { ...RECORD, best: Math.floor(ultima.stato.score * 0.9) }, partita: salvataggioFinale });
await page.getByRole('button', { name: /Riprendi la partita/ }).click();
await page.waitForSelector('.pl-plancia');
{
  const { handIndex, row, col } = ultima.mossa;
  const tocco7 = cellaDaToccare(ultima.stato.hand[handIndex].shape, row, col);
  // Per POSTO del vassoio e non per pezzo: all'ultima mossa la mano ha dei buchi, e
  // l'ennesimo pezzo disegnato non e' l'ennesimo della mano.
  await page.locator('.pl-tray .pl-tray__posto').nth(handIndex).locator('.pl-pezzo-presa').click();
  await page.locator('.pl-plancia .pl-cella').nth(tocco7.row * 9 + tocco7.col).click();
}
await page.waitForSelector('.pl-fine', { timeout: 8000 });
await page.waitForTimeout(900);
await page.screenshot({ path: `${USCITA}6-fine-partita.png` });

// --- 7. Statistiche -----------------------------------------------------------
await prepara({ record: RECORD, statistiche: STATISTICHE });
await page.getByRole('button', { name: 'Statistiche' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${USCITA}7-statistiche.png` });

// --- 8. Impostazioni: si vede che non c'e' niente da comprare ---------------------
await page.locator('.pl-pagina__testata .pl-hud__menu').click();
await page.getByRole('button', { name: 'Impostazioni' }).click();
await page.waitForTimeout(200);
await page.screenshot({ path: `${USCITA}8-impostazioni.png` });

// --- 1. La mappa dei livelli, con un percorso gia' fatto ----------------------
// Cento livelli sono la meta' del gioco, e finora nessuna schermata li mostrava. Con
// ventitre' livelli superati se ne sono guadagnati quattro attrezzi; il magazzino ne tiene
// tre e qui ne restano due, cosi' la schermata del livello mostra la cassetta in uso.
await prepara({ record: RECORD, quadri: progressiFinoA(23), attrezzi: { disponibili: 2, riscossi: 4, versione: 1 } });
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappa');
// LA MAPPA SI PORTA DA SOLA SUL LIVELLO CORRENTE, e in una schermata dello store quel
// punto di arrivo taglia a meta' il pulsante "Condividi il tuo percorso": resta sotto
// l'intestazione, e la prima immagine della scheda mostrerebbe un elemento mozzato.
//
// Qui c'era `window.scrollTo(0, 0)`, che era CODICE MORTO: a scorrere non e' la
// finestra ma un contenitore interno, `div.pl-scroll`, quindi window.scrollY era gia'
// zero e quella riga non ha mai spostato niente. Sembrava una precauzione presa, e per
// questo nessuno e' andato a controllare il risultato.
await page.evaluate(() => {
  const scorrevole = [...document.querySelectorAll('*')].find((n) => n.scrollTop > 0);
  if (scorrevole) scorrevole.scrollTop = 0;
});
await page.waitForTimeout(300);
// E si verifica, invece di sperarlo: niente di cliccabile deve restare sotto la testata.
const mozzato = await page.evaluate(() => {
  const testata = document.querySelector('.pl-pagina__testata, header');
  const sotto = testata ? testata.getBoundingClientRect().bottom : 0;
  // I comandi DENTRO la testata non sono mozzati: sono la testata. La prima stesura di
  // questo controllo li segnalava, e il primo che ha fermato la generazione era la
  // freccia "indietro". Un controllo che grida al primo giro insegna a spegnerlo.
  const sopra = [...document.querySelectorAll('button')]
    .filter((b) => !testata || !testata.contains(b))
    .map((b) => ({ testo: b.textContent.trim().slice(0, 40), top: Math.round(b.getBoundingClientRect().top) }))
    .filter((b) => b.top < sotto - 1 && b.top > -200);
  return { sotto: Math.round(sotto), sopra };
});
if (mozzato.sopra.length) {
  throw new Error(`La mappa dei livelli ha ${mozzato.sopra.length} comandi sotto la testata `
    + `(che finisce a ${mozzato.sotto}px): ${mozzato.sopra.map((b) => `"${b.testo}" a ${b.top}px`).join(', ')}`);
}
await page.screenshot({ path: `${USCITA}1-mappa-livelli.png` });

// --- 2. L'apertura di un livello: l'obiettivo detto prima di giocare ----------
await page.locator('.pl-tappa').nth(23).click();
await page.waitForSelector('.pl-apertura');
await page.waitForTimeout(300);
await page.screenshot({ path: `${USCITA}2-apertura-livello.png` });

// --- 3. Un livello in corso, con obiettivo e mosse in cima -------------------
// Appena aperto, un livello e' quasi vuoto e l'obiettivo segna zero: non e' il livello,
// e' il suo primo istante. Qui se ne giocano alcune mosse davvero, cercando a tentativi
// una posa valida -- non serve sapere quale sia, serve solo che il gioco l'accetti.
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-plancia');

const mosseRimaste = () => page.locator('.pl-obiettivo__mosse strong').innerText();
for (let fatte = 0; fatte < 6; fatte += 1) {
  const prima = await mosseRimaste();
  let riuscita = false;
  for (let pezzo = 0; pezzo < 3 && !riuscita; pezzo += 1) {
    for (let cella = 0; cella < 81 && !riuscita; cella += 1) {
      // Le celle centrali per prime: una plancia che si riempie dal centro si legge
      // meglio di una che si riempie dai bordi.
      const ordinata = (cella * 37 + 40) % 81;
      await page.locator('.pl-tray .pl-pezzo').nth(pezzo).click().catch(() => {});
      await page.locator('.pl-plancia .pl-cella').nth(ordinata).click().catch(() => {});
      if (await mosseRimaste() !== prima) riuscita = true;
    }
  }
  if (!riuscita) break;
  await page.waitForTimeout(120);
}
await page.waitForTimeout(400);
await page.screenshot({ path: `${USCITA}3-livello.png` });

await browser.close();
if (server) {
  try { process.kill(-server.pid); } catch { server.kill(); }
}

// I requisiti della Play Console si controllano sui FILE, non sulle costanti qui sopra:
// e' il file che si carica. Guida di Google Play, "Add preview assets": PNG a 24 bit senza
// trasparenza, lato fra 320 e 3840 px, lato lungo non oltre il doppio del corto, al
// massimo otto per tipo di dispositivo.
{
  const { readdir, readFile } = await import('node:fs/promises');
  const nomi = (await readdir(USCITA)).filter((n) => /^\d+-.+\.png$/.test(n)).sort();
  const problemi = [];
  if (nomi.length > MASSIMO_SCHERMATE) problemi.push(`${nomi.length} schermate, il massimo e' ${MASSIMO_SCHERMATE}`);
  for (const nome of nomi) {
    const png = await readFile(`${USCITA}${nome}`);
    const larghezza = png.readUInt32BE(16);
    const altezza = png.readUInt32BE(20);
    const profondita = png[24];
    const tipoColore = png[25];   // 2 = RGB senza alfa
    const corto = Math.min(larghezza, altezza);
    const lungo = Math.max(larghezza, altezza);
    if (corto < 320 || lungo > 3840) problemi.push(`${nome}: ${larghezza}x${altezza} fuori da 320-3840`);
    if (lungo > 2 * corto) problemi.push(`${nome}: lato lungo oltre il doppio del corto`);
    if (tipoColore !== 2 || profondita !== 8) problemi.push(`${nome}: non e' PNG RGB a 24 bit senza alfa`);
  }
  if (problemi.length) throw new Error(`Schermate non caricabili sulla Play Console:\n- ${problemi.join('\n- ')}`);
  console.log(`\n${nomi.length} schermate in store/ a ${LARGHEZZA * DENSITA}x${ALTEZZA * DENSITA} px, conformi alla Play Console:`);
  console.log(`  ${nomi.join('\n  ')}`);
}
