/**
 * I Quadri, provati nel browser.
 *
 * Il metodo merita una nota. Un Quadro parte da un seme fisso, quindi la partita e'
 * riproducibile: qui la sequenza vincente viene calcolata in Node con il motore vero,
 * e poi RIGIOCATA nel browser trascinando i pezzi. Se il gioco nel browser e il motore
 * in Node divergessero anche di una mossa, la sequenza non porterebbe alla vittoria e
 * questo test fallirebbe. E' quindi anche una verifica che i due siano lo stesso gioco.
 *
 * Uso: npm run e2e-quadri
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { quadroNumero, TOTALE_QUADRI } from '../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../../src/core/grid.js';
import { createRng } from '../../src/core/rng.js';
import { TENTATIVI_PER_APRIRE } from '../../src/persistence/progressi.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-quadri';
await mkdir(OUT, { recursive: true });

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

/** Buchi isolati: le celle vuote senza vicine vuote. */
function buchi(g) {
  let n = 0;
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (g[idx(r, c)] !== 0) continue;
    const su = r > 0 && g[idx(r - 1, c)] === 0, giu = r < 8 && g[idx(r + 1, c)] === 0;
    const sx = c > 0 && g[idx(r, c - 1)] === 0, dx = c < 8 && g[idx(r, c + 1)] === 0;
    if (!su && !giu && !sx && !dx) n += 1;
  }
  return n;
}

/** Calcola in Node una sequenza di mosse che supera il Quadro. */
/**
 * Sequenza che PERDE il livello: piazza sempre senza mai chiudere un gruppo.
 *
 * Serve a coprire la schermata di sconfitta, che per tre versioni non e' mai stata
 * disegnata da nessuna prova. Ci si e' rotta dentro -- schermo nero e gioco bloccato --
 * e l'ha trovata un giocatore, non i test: coprivano solo la vittoria.
 */
function sequenzaPerdente(quadro) {
  let partita = iniziaQuadro(quadro, { now: 0 });
  const mosse = [];
  for (let m = 0; m < (quadro.maxMosse ?? 40) + 2; m += 1) {
    if (statoQuadro(quadro, partita).finito) break;
    let scelta = null;
    for (let i = 0; i < partita.hand.length && !scelta; i += 1) {
      const pezzo = partita.hand[i];
      if (!pezzo) continue;
      for (const [row, col] of allPlacements(partita.grid, pezzo.shape)) {
        const { grid } = placeShape(partita.grid, pezzo.shape, row, col, 1, pezzo.bombe);
        if (findCompletedGroups(grid).length === 0) { scelta = { handIndex: i, row, col }; break; }
      }
    }
    if (!scelta) break;
    mosse.push(scelta);
    partita = giocaNelQuadro(quadro, partita, scelta.handIndex, scelta.row, scelta.col, m * 1000);
  }
  return statoQuadro(quadro, partita).fallito ? mosse : null;
}

function sequenzaVincente(quadro, tentativi = 40) {
  for (let prova = 0; prova < tentativi; prova += 1) {
    const rng = createRng(1000 + prova);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    let guardia = 0;
    while (guardia < (quadro.maxMosse ?? 60)) {
      if (statoQuadro(quadro, partita).finito) break;
      let migliore = null, valore = -1e9;
      partita.hand.forEach((pezzo, i) => {
        if (!pezzo) return;
        for (const [r, c] of allPlacements(partita.grid, pezzo.shape)) {
          const { grid: dopo } = placeShape(partita.grid, pezzo.shape, r, c, 1);
          const gruppi = findCompletedGroups(dopo);
          const v = gruppi.length * 400 + (gruppi.length ? 200 : 0)
            - buchi(dopo) * 16 - fillRatio(dopo) * 60 + rng.float() * 40;
          if (v > valore) { valore = v; migliore = { handIndex: i, row: r, col: c }; }
        }
      });
      if (!migliore) break;
      mosse.push(migliore);
      partita = giocaNelQuadro(quadro, partita, migliore.handIndex, migliore.row, migliore.col, guardia * 1000);
      guardia += 1;
    }
    if (statoQuadro(quadro, partita).completato) return mosse;
  }
  return null;
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));

/**
 * Dove afferrare il pezzo e dove lasciarlo, per una mossa calcolata dal motore.
 * Sta in un posto solo perche' la usano due sequenze: quella che vince e quella che
 * perde. Duplicarla significherebbe che una delle due invecchia.
 */
async function posizioneMossa(mossa) {
  return page.evaluate(({ handIndex, row, col }) => {
    const posto = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex];
    const pezzo = posto?.querySelector('.pl-pezzo');
    if (!pezzo) return null;
    const rp = pezzo.getBoundingClientRect();
    const cellaTray = pezzo.firstElementChild.getBoundingClientRect();
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const c0 = celle[0].getBoundingClientRect();
    const passoX = (celle[8].getBoundingClientRect().left - c0.left) / 8;
    const passoY = (celle[72].getBoundingClientRect().top - c0.top) / 8;
    const px = rp.left + rp.width / 2, py = rp.top + rp.height / 2;
    const presaX = (px - rp.left) / cellaTray.width, presaY = (py - rp.top) / cellaTray.height;
    return { px, py, cx: c0.left + col * passoX + presaX * c0.width, cy: c0.top + row * passoY + presaY * c0.height };
  }, mossa);
}
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  window.localStorage.clear();
  window.localStorage.setItem('plinto:settings', JSON.stringify({ introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true }));
});
await page.reload({ waitUntil: 'networkidle' });

// ---------- 0b. Il pulsante grande della home porta a un LIVELLO ----------
// E' il difetto che ha reso inutili tre versioni di lavoro sulla spiegazione: il
// pulsante piu' grande avviava la partita libera, e un giocatore ha creduto di essere
// al livello 1 mentre non c'era nessun livello. La spiegazione era giusta; nessuno ci
// arrivava. Quindi si verifica la STRADA, non solo la destinazione.
{
  const principale = page.locator('.pl-home__azioni .pl-btn--primario');
  const testoPrincipale = (await principale.innerText()).trim();
  // Il badge si legge ORA, finche' siamo sulla home: dopo il click siamo altrove.
  const versione = (await page.locator('.pl-home__versione').innerText().catch(() => '')).trim();
  if (!/livello/i.test(testoPrincipale)) {
    errori.push(`HOME: il pulsante principale dice "${testoPrincipale}" invece di portare a un livello`);
  }
  if (!/^v\d+\.\d+\.\d+$/.test(versione)) {
    errori.push(`HOME: il badge della versione dice "${versione}"`);
  }

  await principale.click();
  await page.waitForTimeout(300);
  // Deve aprirsi la presentazione del livello, non una partita senza obiettivi.
  if (await page.locator('.pl-apertura').count() === 0) {
    errori.push('HOME: il pulsante principale non apre la presentazione di un livello');
  }
  console.log(`0b. pulsante principale "${testoPrincipale}", versione ${versione}`);
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
}

// ---------- 1. Elenco dei livelli ----------
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappe');
const elencati = await page.locator('.pl-tappa').count();
const aperti = await page.locator('.pl-tappa:not(.pl-tappa--chiusa)').count();
await page.screenshot({ path: `${OUT}/1-elenco.png` });
console.log(`1. mappa: ${elencati} tappe, ${aperti} aperte`);
if (elencati !== TOTALE_QUADRI) errori.push(`MAPPA: mostra ${elencati} tappe invece di ${TOTALE_QUADRI}`);
if (aperti !== 1) errori.push(`MAPPA: ${aperti} tappe aperte all'inizio invece di 1`);

// Plinto deve stare sulla tappa a cui si e' arrivati, e deve esserci una sola volta.
const plintoSullaMappa = await page.locator('.pl-tappa__plinto').count();
if (plintoSullaMappa !== 1) errori.push(`MAPPA: Plinto compare ${plintoSullaMappa} volte sulle tappe invece di 1`);
const atti = await page.locator('.pl-atto').count();
console.log(`   atti mostrati: ${atti}, Plinto sulla tappa corrente: ${plintoSullaMappa === 1}`);
if (atti < 5) errori.push(`MAPPA: solo ${atti} atti mostrati`);

// ---------- 2. L'apertura: Plinto spiega l'obiettivo ----------
await page.locator('.pl-tappa').first().click();
await page.waitForSelector('.pl-apertura');
const obiettivoDetto = (await page.locator('.pl-apertura__obiettivo').innerText()).trim();
const spiegazioni = await page.locator('.pl-apertura__spiega').count();
const consigli = await page.locator('.pl-apertura__consiglio').count();
const plintoParla = await page.locator('.pl-apertura .pl-plinto').count();
await page.screenshot({ path: `${OUT}/2-apertura.png` });
console.log(`2. apertura: "${obiettivoDetto}" | spiegazioni ${spiegazioni} | consigli ${consigli}`);

// Il disegno dell'obiettivo: una riga sono NOVE caselle accese, non otto e non dieci.
// E' l'unica parte della schermata che spiega senza usare parole, quindi si controlla
// che dica il vero: una miniatura sbagliata insegnerebbe la regola sbagliata.
const celleAccese = await page.locator('.pl-mini__cella--accesa').count();
const celleTotali = await page.locator('.pl-mini__cella').count();
if (celleTotali !== 81) errori.push(`APERTURA: la miniatura ha ${celleTotali} caselle invece di 81`);
if (celleAccese !== 9) errori.push(`APERTURA: la riga illustrata ha ${celleAccese} caselle invece di 9`);
const didascalia = await page.locator('.pl-apertura__didascalia').innerText().catch(() => '');
if (!didascalia.trim()) errori.push('APERTURA: il disegno non ha didascalia');

const attesi = quadroNumero(1).obiettivi.length;
if (!obiettivoDetto) errori.push('APERTURA: l obiettivo non viene detto');
if (spiegazioni !== attesi) errori.push(`APERTURA: ${spiegazioni} spiegazioni invece di ${attesi}`);
if (consigli !== attesi) errori.push(`APERTURA: ${consigli} consigli invece di ${attesi}`);
if (plintoParla !== 1) errori.push(`APERTURA: Plinto compare ${plintoParla} volte invece di 1`);
// Una spiegazione che restituisce la chiave invece del testo e' peggio di nessuna
// spiegazione: sembra un errore del gioco proprio a chi sta imparando le regole.
const testoApertura = await page.locator('.pl-apertura').innerText();
if (/quadri\.(spiegazioni|consigli)\./.test(testoApertura)) {
  errori.push('APERTURA: compare una chiave di traduzione non risolta');
}

// ---------- 2b. Si comincia ----------
await page.getByRole('button', { name: /^Gioca$/ }).click();
await page.waitForSelector('.pl-plancia');
const obiettivo = await page.locator('.pl-obiettivo__frase').innerText();
const mosseMostrate = await page.locator('.pl-obiettivo__mosse strong').innerText();
await page.screenshot({ path: `${OUT}/2-quadro.png` });
console.log(`2c. quadro 1: obiettivo "${obiettivo}", mosse ${mosseMostrate}`);
if (!obiettivo.trim()) errori.push('QUADRO: l obiettivo non viene mostrato');
// La frase dell'apertura e quella sopra la plancia devono essere LA STESSA: se Plinto
// spiegasse un obiettivo e la striscia ne mostrasse un altro, il giocatore non
// saprebbe a quale credere.
if (obiettivo.trim() !== obiettivoDetto) {
  errori.push(`COERENZA: l apertura dice "${obiettivoDetto}" ma la striscia dice "${obiettivo.trim()}"`);
}
if (Number(mosseMostrate) !== quadroNumero(1).maxMosse) {
  errori.push(`QUADRO: mostra ${mosseMostrate} mosse invece di ${quadroNumero(1).maxMosse}`);
}

// ---------- 3. Rigioca nel browser la sequenza calcolata in Node ----------
const quadro = quadroNumero(1);
const sequenza = sequenzaVincente(quadro);
if (!sequenza) {
  errori.push('QUADRO 1: nemmeno il motore riesce a superarlo, il quadro e impossibile');
} else {
  console.log(`3. sequenza vincente calcolata in Node: ${sequenza.length} mosse. La rigioco nel browser...`);
  for (const mossa of sequenza) {
    const punti = await posizioneMossa(mossa);
    if (!punti) { errori.push('QUADRO: pezzo non trovato durante la riproduzione'); break; }
    await page.mouse.move(punti.px, punti.py);
    await page.mouse.down();
    await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(45);
    if (await page.locator('.pl-quadro-esito').count() > 0) break;
  }

  await page.waitForTimeout(200);
  const esito = await page.locator('.pl-quadro-esito').innerText().catch(() => '');
  console.log(`   esito nel browser: "${esito.trim()}"`);
  if (!/superato/i.test(esito)) {
    errori.push(`LIVELLO 1: la sequenza vincente calcolata in Node NON vince nel browser (esito: "${esito.trim()}"). Il motore e il gioco divergono.`);
  }

  // ---------- 3b. Festeggiamento e avanzamento sul percorso ----------
  // L'avanzamento e' animato: si aspetta che la barra abbia finito di allungarsi,
  // altrimenti si misurerebbe lo stato di PARTENZA e il controllo direbbe il falso.
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `${OUT}/3-esito.png` });

  const stradaVisibile = await page.locator('.pl-avanza__strada').count();
  const tappeMostrate = await page.locator('.pl-avanza__tappa').count();
  const plintoAvanzato = await page.locator('.pl-avanza__tappa--qui .pl-avanza__plinto').count();
  const conteggio = await page.locator('.pl-avanza__conteggio').innerText().catch(() => '');
  const barra = await page.locator('.pl-avanza__barra').getAttribute('aria-valuenow').catch(() => null);
  console.log(`3b. avanzamento: ${tappeMostrate} tappe, "${conteggio.trim()}", barra a ${barra}`);

  if (!stradaVisibile) errori.push('AVANZAMENTO: il percorso non viene mostrato dopo la vittoria');
  if (tappeMostrate < 3) errori.push(`AVANZAMENTO: solo ${tappeMostrate} tappe mostrate`);
  if (plintoAvanzato !== 1) errori.push(`AVANZAMENTO: Plinto compare ${plintoAvanzato} volte sulla tappa corrente invece di 1`);
  // ---------- 3c. Raccontarlo: la scheda del livello ----------
  // Per tre versioni il percorso e' stato l'unica modalita' MUTA: la scheda
  // condivisibile esisteva solo per la partita libera, cioe' per la modalita'
  // secondaria. Chi superava un livello non aveva modo di dirlo a nessuno.
  {
    const schedaQuadro = (await page.locator('.pl-fine .pl-scheda').innerText().catch(() => '')).trim();
    console.log(`3c. scheda del livello: ${schedaQuadro.split('\n').length} righe`);
    if (!schedaQuadro) {
      errori.push('SCHEDA LIVELLO: dopo la vittoria non compare nessuna scheda da condividere');
    } else {
      // Le mosse, non i punti: nel percorso due giocatori che superano lo stesso
      // quadro hanno fatto la stessa cosa, e li distingue solo in quante mosse.
      if (!/mosse/i.test(schedaQuadro)) errori.push(`SCHEDA LIVELLO: non dice le mosse — "${schedaQuadro}"`);
      if (!/Livello 1\b/.test(schedaQuadro)) errori.push(`SCHEDA LIVELLO: non dice quale livello — "${schedaQuadro}"`);
      if (!/1 di 100/.test(schedaQuadro)) errori.push(`SCHEDA LIVELLO: non dice l avanzamento — "${schedaQuadro}"`);
      if (!/https?:\/\//.test(schedaQuadro)) errori.push('SCHEDA LIVELLO: manca il collegamento al gioco');
      if (/undefined|NaN|null/.test(schedaQuadro)) errori.push(`SCHEDA LIVELLO: valore rotto — "${schedaQuadro}"`);
      // Niente spoiler: gli identificativi delle forme non devono comparire.
      if (/\b[bhvpd]\d{1,2}\b/.test(schedaQuadro)) errori.push('SCHEDA LIVELLO: contiene identificativi di forme');
    }
  }

  // Il livello 1 e' appena stato superato: il conteggio deve dire 1, non 0. E' il
  // difetto piu' facile da fare qui — mostrare il valore letto PRIMA della vittoria.
  if (barra !== '1') errori.push(`AVANZAMENTO: la barra dice ${barra} livelli superati invece di 1`);

  // Plinto deve stare sulla tappa 2, non piu' sulla 1: e' lo spostamento il punto.
  const numeroSottoPlinto = await page.locator('.pl-avanza__tappa--qui .pl-avanza__numero').innerText().catch(() => '');
  if (numeroSottoPlinto.trim() !== '2') {
    errori.push(`AVANZAMENTO: Plinto e fermo sulla tappa "${numeroSottoPlinto.trim()}" invece di essersi spostato sulla 2`);
  }
}

// ---------- 3d. PERDERE un livello non deve rompere niente ----------
// La schermata di sconfitta e' rimasta scoperta per tre versioni, e ci si e' rotta
// dentro: schermo nero, gioco bloccato, nessun modo di uscirne. L'ha trovata un
// giocatore. Qui si perde il livello 2 apposta e si controlla che la schermata ci sia
// DAVVERO e che nessun errore JavaScript sia arrivato alla pagina.
{
  const erroriPrima = errori.length;
  await page.getByRole('button', { name: /Torna ai livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(1).click();
  await page.waitForSelector('.pl-apertura');
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia');

  const daPerdere = quadroNumero(2);
  const perdente = sequenzaPerdente(daPerdere);
  if (!perdente) {
    errori.push('LIVELLO 2: non si riesce a costruire una sequenza perdente, il controllo non prova nulla');
  } else {
    for (const mossa of perdente) {
      const punti = await posizioneMossa(mossa);
      if (!punti) break;
      await page.mouse.move(punti.px, punti.py);
      await page.mouse.down();
      await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(45);
      if (await page.locator('.pl-quadro-esito').count() > 0) break;
    }
    await page.waitForTimeout(400);

    const esitoPerso = (await page.locator('.pl-quadro-esito').innerText().catch(() => '')).trim();
    const corpo = (await page.locator('body').innerText().catch(() => '')).trim();
    const righe = await page.locator('.pl-fine__riga').count();
    const riprova = await page.getByRole('button', { name: /Riprova/ }).count();
    await page.screenshot({ path: `${OUT}/3c-sconfitta.png` });
    console.log(`3d. sconfitta: "${esitoPerso}", ${righe} righe di obiettivo`);

    // Due modi in cui questo passaggio puo' andare male, ed entrambi sono fatali per
    // quelli successivi: la pagina vuota (React ha smontato tutto) oppure la rete di
    // sicurezza entrata in funzione. La rete evita lo schermo nero al giocatore, ma
    // per una prova resta un fallimento pieno: il gioco si e' rotto lo stesso.
    const retePresente = await page.locator('.pl-crash').count();
    if (corpo.length === 0 || retePresente > 0) {
      errori.push(retePresente > 0
        ? 'SCONFITTA: e entrata in funzione la rete di sicurezza, cioe il gioco si e rotto perdendo un livello'
        : 'SCONFITTA: la pagina e VUOTA, il gioco si e spento perdendo un livello');
      console.error('\n================ ESITO ================');
      errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
      await browser.close();
      if (server) server.kill();
      process.exit(1);
    }
    if (!/non superato/i.test(esitoPerso)) {
      errori.push(`SCONFITTA: la schermata dice "${esitoPerso}" invece dell esito`);
    }
    if (righe !== daPerdere.obiettivi.length) {
      errori.push(`SCONFITTA: ${righe} righe di obiettivo invece di ${daPerdere.obiettivi.length}`);
    }
    if (riprova !== 1) errori.push('SCONFITTA: manca il pulsante per riprovare');
    if (errori.length > erroriPrima) {
      // Gli errori del browser finiscono in `errori` tramite i gestori in cima: se ne
      // sono comparsi ORA, e' successo perdendo.
      console.log('   (attenzione: sono comparsi errori durante la sconfitta)');
    }
  }
}

// ---------- 4. Superare un Quadro apre il successivo ----------
await page.getByRole('button', { name: /Torna ai livelli/ }).click();
await page.waitForSelector('.pl-tappe');
const apertiDopo = await page.locator('.pl-tappa:not(.pl-tappa--chiusa)').count();
const fatti = await page.locator('.pl-tappa--fatta').count();
await page.screenshot({ path: `${OUT}/4-elenco-dopo.png` });
console.log(`4. dopo la vittoria: ${fatti} superati, ${apertiDopo} aperti`);
if (fatti !== 1) errori.push(`SBLOCCO: ${fatti} quadri risultano superati invece di 1`);
if (apertiDopo !== 2) errori.push(`SBLOCCO: ${apertiDopo} quadri aperti invece di 2`);

// ---------- 5. L'avanzamento sopravvive alla ricarica ----------
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappe');
if (await page.locator('.pl-tappa--fatta').count() !== 1) {
  errori.push('PERSISTENZA: l avanzamento nei Quadri si perde ricaricando');
}
console.log('5. avanzamento conservato dopo la ricarica');

// ---------- 6. Ricominciare dal livello 1, con due conferme ----------
// Un'azione che cancella ore di gioco e non si puo' annullare, in una schermata che si
// apre per scegliere un livello. Si verifica che serva confermare DUE volte e che si
// possa tirarsi indietro a ogni passo: un solo tocco, da un pollice che scorre, la
// farebbe partire per sbaglio.
{
  // Si lascia un record finto della partita libera: senza, il controllo qui sotto
  // verificherebbe la sopravvivenza di una cosa che non e' mai esistita, cioe' niente.
  await page.evaluate(() => window.localStorage.setItem('plinto:records', JSON.stringify({ best: 4321 })));
  const primaDi = await page.locator('.pl-tappa--fatta').count();
  if (primaDi === 0) {
    errori.push('RICOMINCIA: non ci sono livelli superati, il controllo non prova nulla');
  } else {
    // Passo 1, poi ci si tira indietro: l'avanzamento non deve muoversi.
    await page.getByRole('button', { name: /Ricomincia dal livello 1/ }).click();
    await page.getByRole('button', { name: /^No$/ }).click();
    if (await page.locator('.pl-tappa--fatta').count() !== primaDi) {
      errori.push('RICOMINCIA: annullando alla prima conferma l avanzamento e cambiato lo stesso');
    }

    // Passo 1 e 2, e ci si tira indietro alla seconda: ancora niente deve cambiare.
    await page.getByRole('button', { name: /Ricomincia dal livello 1/ }).click();
    await page.getByRole('button', { name: /^Sì$/ }).click();
    // L'etichetta va cercata ESATTA: cercando "ricomincia" si trova anche il pulsante
    // di partenza, che ricompare dopo un azzeramento andato a buon fine — e il
    // controllo direbbe che la seconda conferma c'e' proprio quando non c'e'.
    const secondaConferma = await page.getByRole('button', { name: /^Sì, ricomincia$/ }).count();
    if (secondaConferma === 0) {
      errori.push('RICOMINCIA: manca la SECONDA conferma, basta un tocco solo per cancellare tutto');
    } else {
      await page.getByRole('button', { name: /^No$/ }).click();
      if (await page.locator('.pl-tappa--fatta').count() !== primaDi) {
        errori.push('RICOMINCIA: annullando alla seconda conferma l avanzamento e cambiato lo stesso');
      }
    }

    // E adesso fino in fondo. Solo se le due conferme ci sono davvero: se ne manca una
    // l'azzeramento e' gia' avvenuto, e insistere seppellirebbe la causa sotto un
    // timeout su un pulsante che non esiste.
    if (secondaConferma > 0) {
    await page.getByRole('button', { name: /Ricomincia dal livello 1/ }).click();
    await page.getByRole('button', { name: /^Sì$/ }).click();
    await page.getByRole('button', { name: /^Sì, ricomincia$/ }).click();
    await page.waitForTimeout(250);
    const dopo = await page.locator('.pl-tappa--fatta').count();
    const aperti = await page.locator('.pl-tappa:not(.pl-tappa--chiusa)').count();
    console.log(`6. ricomincia: da ${primaDi} livelli superati a ${dopo}, ${aperti} aperti`);
    if (dopo !== 0) errori.push(`RICOMINCIA: restano ${dopo} livelli superati invece di 0`);
    if (aperti !== 1) errori.push(`RICOMINCIA: ${aperti} livelli aperti invece del solo primo`);

    // Il record della partita libera NON deve essere stato toccato: azzerare i livelli
    // e' un'altra cosa da azzerare i dati, e chi preme qui non sta chiedendo quello.
    const recordRimasto = await page.evaluate(() => window.localStorage.getItem('plinto:records'));
    if (!recordRimasto || !recordRimasto.includes('4321')) {
      errori.push(`RICOMINCIA: ha toccato anche il record della partita libera (${recordRimasto})`);
    }
    }
  }
}

// ---------- 7. La strada non si chiude mai ----------
/**
 * Dopo abbastanza tentativi il livello successivo si apre lo stesso.
 *
 * Il controllo importante non e' che la porta si apra: e' che il gioco NON menta mentre la
 * apre. Il livello resta senza spunta e fuori dal conteggio dei superati. Se lo contasse
 * come vinto, la via d'uscita sarebbe un premio di consolazione travestito -- peggio di un
 * percorso che si blocca.
 *
 * I tentativi si scrivono direttamente nella memoria del browser invece di perdere otto
 * partite vere: perdere e' gia' provato al passaggio 3c, e otto sconfitte pilotate
 * renderebbero questo scenario lungo il doppio senza controllare niente di nuovo.
 */
await page.evaluate((soglia) => {
  window.localStorage.setItem('plinto:quadri', JSON.stringify({
    versione: 1,
    livelli: { 1: { tentativi: soglia } },
  }));
}, TENTATIVI_PER_APRIRE);
await page.reload({ waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
await page.waitForSelector('.pl-tappe');
const apertiPerInsistenza = await page.locator('.pl-tappa:not(.pl-tappa--chiusa)').count();
const spunte = await page.locator('.pl-tappa--fatta').count();
await page.screenshot({ path: `${OUT}/7-strada-aperta.png` });
console.log(
  `7. dopo ${TENTATIVI_PER_APRIRE} tentativi falliti sul primo: ${apertiPerInsistenza} livelli aperti, `
  + `${spunte} con la spunta`,
);
if (apertiPerInsistenza !== 2) {
  errori.push(`INSISTENZA: ${apertiPerInsistenza} livelli aperti invece di 2 dopo ${TENTATIVI_PER_APRIRE} tentativi`);
}
if (spunte !== 0) {
  errori.push(`INSISTENZA: ${spunte} livelli con la spunta di superato, e non ne e stato superato nessuno`);
}
// E il secondo si deve poter aprire davvero, non solo sembrare aperto.
await page.locator('.pl-tappa').nth(1).click();
await page.waitForSelector('.pl-apertura', { timeout: 4000 }).catch(() => {
  errori.push('INSISTENZA: il secondo livello sembra aperto ma non si apre');
});

await browser.close();
if (server) server.kill();


console.log('\n================ ESITO ================');
if (errori.length === 0) console.log('Nessun problema rilevato.');
else errori.forEach((e) => console.log('PROBLEMA -', e));
process.exit(errori.length === 0 ? 0 : 1);
