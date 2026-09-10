/**
 * Tutte le comunicazioni del gioco, viste come le vede il giocatore.
 *
 * Gli altri scenari controllano che le cose FUNZIONINO. Questo controlla che quello che
 * il gioco DICE sia leggibile: attraversa ogni schermata, in ogni lingua, e legge il
 * testo che finisce davvero sullo schermo.
 *
 * Nasce da tre difetti veri, tutti trovati da una persona e nessuno da un test:
 *
 *   - una chiave di traduzione mostrata al posto della frase ("intro.cinque");
 *   - un segnaposto non sostituito ("fino a x{max}");
 *   - l'italiano scritto senza accenti, dove "e" significa un'altra cosa da "e'".
 *
 * Nessuno dei tre rompe niente: il gioco continua a funzionare benissimo mentre dice
 * cose sbagliate. Per questo servono controlli sul testo e non solo sul comportamento.
 *
 * Uso: npm run comunicazioni
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { REGOLE_INTRO } from '../../src/config/intro.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

async function serverRisponde() {
  try {
    const r = await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
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

/**
 * Difetti che si vedono guardando il testo, non il comportamento.
 *
 * Ogni voce e' un difetto gia' accaduto in questo progetto, non un'ipotesi.
 */
const TRAPPOLE = [
  {
    nome: 'chiave di traduzione non risolta',
    // "quadri.spiegazioni.righe" invece della frase. Due o piu' segmenti minuscoli
    // separati da punti, senza spazi: nessun testo italiano o inglese e' fatto cosi'.
    regola: /\b[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*){1,3}\b/,
    // I nomi di file e i domini legittimi vanno esclusi, o si accusa il testo giusto.
    ammesse: [/\.js\b/, /\.mjs\b/, /\.css\b/, /\.md\b/, /paypal\.me/, /github\.io/, /claude\.ai/],
  },
  { nome: 'segnaposto non sostituito', regola: /\{[a-zA-Z]+\}/ },
  { nome: 'undefined a schermo', regola: /\bundefined\b/ },
  { nome: 'NaN a schermo', regola: /\bNaN\b/ },
  { nome: 'null a schermo', regola: /\bnull\b/ },
];

/** Controlla il testo visibile di una schermata. */
function controlla(dove, testo, lingua) {
  if (!testo || !testo.trim()) {
    errori.push(`${lingua} · ${dove}: la schermata non mostra nessun testo`);
    return;
  }
  // Un indirizzo di posta non e' una frase, e va tolto prima di guardare il testo:
  // dentro "qualcuno@gmail.com" c'e' "gmail.com", che alla trappola delle chiavi non
  // risolte somiglia in tutto e per tutto a "quadri.spiegazioni.righe". E' successo
  // davvero, appena l'indirizzo di contatto e' comparso nella schermata Info.
  //
  // Si toglie l'indirizzo invece di aggiungere "gmail.com" ai domini ammessi: quell'
  // elenco descriverebbe l'indirizzo di OGGI, e il giorno che cambia il controllo
  // tornerebbe a fallire senza che niente sia rotto davvero.
  const visibile = testo.replace(/\S+@\S+\.\S+/g, ' ');
  for (const trappola of TRAPPOLE) {
    const trovato = visibile.match(trappola.regola);
    if (!trovato) continue;
    if (trappola.ammesse?.some((ok) => ok.test(trovato[0]))) continue;
    errori.push(`${lingua} · ${dove}: ${trappola.nome} — "${trovato[0]}"`);
  }
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });

for (const lingua of ['it', 'en']) {
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: lingua === 'it' ? 'it-IT' : 'en-US',
  });
  page.on('pageerror', (e) => errori.push(`${lingua} · errore di pagina: ${e.message}`));

  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });

  // Un profilo di gioco gia' popolato: senza, la schermata del profilo mostra la sua
  // riga di cortesia ("serve almeno una partita finita") e nessuna delle tabelle, cioe'
  // proprio i testi che qui si vogliono leggere. Il profilo si costruisce con numeri
  // qualunque: quello che si controlla sono le parole, non i valori.
  await page.evaluate(() => {
    window.localStorage.setItem('plinto:profilo', JSON.stringify({
      versione: 1,
      partite: 12, mosse: 340, pezzi: 340, punteggioTotale: 41000, tempoTotaleMs: 900000,
      migliorPunteggio: 8200, migliorMossa: 410, migliorCatena: 7, migliorIntreccio: 3,
      righe: 40, colonne: 22, quadranti: 9, svuotamenti: 2, bombe: 11, celleEsplose: 63,
      istogrammaCatena: [80, 60, 50, 40, 35, 30, 20, 15, 6, 4],
      istogrammaIntreccio: [200, 100, 30, 8, 2, 0, 0, 0, 0, 0, 0],
      mappaAppoggi: Array.from({ length: 81 }, (_, i) => (i * 7) % 13),
      andamento: [{ punteggio: 100, mosse: 10 }],
    }));
  });
  await page.reload({ waitUntil: 'networkidle' });

  // --- presentazione al primo avvio ---
  await page.waitForSelector('.pl-intro__regole');
  const regole = await page.locator('.pl-intro__regole li').count();
  if (regole !== REGOLE_INTRO.length) {
    errori.push(`${lingua} · presentazione: ${regole} regole invece di ${REGOLE_INTRO.length}`);
  }
  controlla('presentazione', await page.locator('.pl-intro').innerText(), lingua);
  await page.locator('.pl-intro__azioni .pl-btn--primario').click();
  await page.waitForSelector('.pl-plancia');

  // --- partita libera: il nome della modalita' deve esserci ---
  const modalita = (await page.locator('.pl-modalita').innerText().catch(() => '')).trim();
  if (!modalita) errori.push(`${lingua} · partita: la modalita non e scritta`);
  controlla('partita libera', await page.locator('.pl-screen--gioco').innerText(), lingua);

  await page.locator('.pl-hud__menu').first().click();
  await page.locator('.pl-menu .pl-btn').last().click();   // torna alla home
  await page.waitForSelector('.pl-home');
  controlla('home', await page.locator('.pl-home').innerText(), lingua);

  // --- ogni pagina secondaria ---
  const voci = await page.locator('.pl-home__menu .pl-btn').count();
  for (let i = 0; i < voci; i += 1) {
    const nome = (await page.locator('.pl-home__menu .pl-btn').nth(i).innerText()).trim();
    await page.locator('.pl-home__menu .pl-btn').nth(i).click();
    await page.waitForSelector('.pl-pagina__titolo');
    const titolo = (await page.locator('.pl-pagina__titolo').innerText()).trim();
    if (!titolo) errori.push(`${lingua} · ${nome}: la pagina non ha titolo`);
    controlla(nome, await page.locator('.pl-scroll').innerText(), lingua);
    await page.locator('.pl-pagina__testata .pl-hud__menu').click();
    await page.waitForSelector('.pl-home');
  }

  // --- mappa dei livelli ---
  await page.locator('.pl-home__azioni .pl-btn').nth(1).click();
  await page.waitForSelector('.pl-tappe');
  controlla('mappa dei livelli', await page.locator('.pl-scroll').innerText(), lingua);
  await page.locator('.pl-pagina__testata .pl-hud__menu').click();
  await page.waitForSelector('.pl-home');

  // --- apertura di un livello: e' la schermata che spiega, e va guardata a fondo ---
  await page.locator('.pl-home__azioni .pl-btn--primario').click();
  await page.waitForSelector('.pl-apertura');
  controlla('apertura del livello', await page.locator('.pl-apertura').innerText(), lingua);
  const didascalia = (await page.locator('.pl-apertura__didascalia').innerText().catch(() => '')).trim();
  if (!didascalia) errori.push(`${lingua} · apertura: il disegno dell obiettivo non ha didascalia`);

  // --- il livello, con l'obiettivo sopra la plancia ---
  await page.locator('.pl-apertura__azioni .pl-btn--primario').click();
  await page.waitForSelector('.pl-plancia');
  const obiettivo = (await page.locator('.pl-obiettivo__frase').innerText()).trim();
  if (!obiettivo) errori.push(`${lingua} · livello: l obiettivo non e scritto sopra la plancia`);
  controlla('livello in corso', await page.locator('.pl-screen--gioco').innerText(), lingua);

  // --- sfida del giorno ---
  // Dal menu di un livello l'ultima voce porta alla MAPPA, non alla home: da li' si
  // torna indietro con la freccia. E' una differenza reale fra i due menu, e uno
  // scenario che la ignora fallisce dopo trenta secondi senza dire perche'.
  await page.locator('.pl-hud__menu').first().click();
  await page.locator('.pl-menu .pl-btn').last().click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-pagina__testata .pl-hud__menu').click();
  await page.waitForSelector('.pl-home');
  // --- archivio delle sfide: e' una schermata di soli testi e numeri, quindi e'
  //     esattamente il posto in cui una chiave non tradotta passerebbe inosservata ---
  await page.locator('.pl-home__azioni .pl-btn').last().click();
  await page.waitForSelector('.pl-calendario');
  controlla('archivio delle sfide', await page.locator('.pl-scroll').innerText(), lingua);
  const etichette = await page.locator('button.pl-giorno').evaluateAll(
    (nodi) => nodi.map((n) => n.getAttribute('aria-label') ?? ''),
  );
  // Le etichette delle caselle non compaiono a schermo: le legge solo chi ascolta, ed
  // e' l'unico posto del gioco in cui un testo puo' restare rotto senza che si veda.
  controlla('archivio, etichette delle caselle', etichette.join(' · '), lingua);
  if (etichette.some((e) => !e.trim())) errori.push(`${lingua} · archivio: una casella non ha etichetta`);
  await page.locator('.pl-pagina__testata .pl-hud__menu').click();
  await page.waitForSelector('.pl-home');

  // La sfida di oggi si prende PER NOME e non per posizione: questo passaggio usava
  // l'ultimo pulsante della home, e ha smesso di funzionare appena sotto la sfida e'
  // comparso l'archivio. Un selettore posizionale racconta la schermata di ieri.
  await page.locator('.pl-home__azioni .pl-sfida-avvio').last().click();
  await page.waitForSelector('.pl-plancia');
  controlla('sfida del giorno', await page.locator('.pl-screen--gioco').innerText(), lingua);

  // La rete di sicurezza non deve essere entrata in funzione da nessuna parte.
  if (await page.locator('.pl-crash').count() > 0) {
    errori.push(`${lingua} · e entrata in funzione la rete di sicurezza`);
  }

  console.log(`${lingua}: attraversate presentazione, partita, home, ${voci} pagine, mappa, apertura, livello, archivio e sfida`);
  await page.close();
}

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length === 0) {
  console.log('Tutte le comunicazioni sono leggibili in entrambe le lingue.');
} else {
  errori.forEach((e) => console.error(`PROBLEMA - ${e}`));
  process.exit(1);
}
