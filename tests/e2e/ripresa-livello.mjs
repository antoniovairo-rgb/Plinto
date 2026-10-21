/**
 * PO-008: «quando l'app viene messa in background per qualche secondo la partita /
 * missione non deve partire da 0».
 *
 * Ogni caso porta il giocatore dentro un livello (o una partita libera), lo fa giocare,
 * lo interrompe in un modo diverso e poi prova a TORNARE DENTRO come farebbe lui: da
 * solo, oppure toccando la mappa o il pulsante grande della home. Si confronta la
 * "firma" della partita (punteggio, obiettivo, caselle occupate) prima e dopo: se cambia,
 * il livello e' ripartito da zero.
 *
 *   A  Indietro dal livello porta alla mappa; riaprire il livello lo riprende.
 *   B  passate piu' di due ore, la home offre di riprendere il livello.
 *   C  uscendo mentre si legge l'obiettivo (presentazione) il livello e' gia' salvato.
 *   D  secondo piano simulato (visibilitychange, pagehide, freeze vero via CDP).
 *   E  ricarica (il sistema butta via la pagina).
 *   F  nuova navigazione all'indirizzo di avvio dell'app, `?origine=play`.
 *   G  `introVista` falso ("salta per ora"): la ripresa automatica avviene lo stesso.
 *   H  come G, per la partita libera.
 *   I  guardare solo l'obiettivo di un altro livello non copre quello a meta'.
 *   J  con il livello 2 a meta', «Gioca» sul livello 1 chiede conferma (collaudo 1.21.9, E1).
 *   K  «Riprova» nel menu del livello chiede conferma (collaudo 1.21.9, E2).
 *   L  con la sfida di ieri a meta', aprire quella di oggi chiede conferma.
 *   N  con una partita libera a meta', iniziarne una nuova chiede conferma da ogni strada:
 *      home, menu della partita, profilo, statistiche, festa finale (collaudo 1.21.11, H1).
 *      A zero mosse non chiede niente.
 *   O  dentro una sfida, menu -> «Nuova partita» (o «Riprendi la partita» nella domanda):
 *      la libera che si gioca e' quella che si ritrova dopo una ricarica, non la sfida
 *      (collaudo 1.21.12, I1). L'indirizzo non tiene piu' `#/sfida/<giorno>`.
 *   P  chiusa la domanda senza scegliere (Escape o tocco sul velo) il fuoco torna al
 *      pulsante che l'ha aperta: «Nuova» della home (tastiera), «Riprova» nel menu del
 *      livello, «Gioca» sull'obiettivo (collaudo 1.21.18, D1; PO-023).
 *   Q  il menu della partita come le domande: Escape lo chiude, all'apertura il fuoco entra
 *      su «Torna alla partita», chiuso senza scegliere (Escape, velo, «Torna alla
 *      partita», Indietro) il fuoco torna a «Menu»; con una domanda sopra il menu, Escape
 *      chiude solo la domanda (collaudo 1.21.20, O2; PO-024, MENU_COME_LE_DOMANDE).
 *   R  con un pezzo scelto e il menu o una domanda aperti, i tasti della partita tacciono:
 *      Invio e Spazio premono il pulsante che ha il fuoco e non posano il pezzo sotto il
 *      velo, Escape chiude solo la finestra e il pezzo resta scelto (collaudo 1.21.21, D1;
 *      PO-026, TASTI_TACCIONO_SOTTO_IL_VELO). «Riprendi la partita» nella domanda sopra il
 *      menu, che lascia la stessa partita, riporta il fuoco su «Menu» (O1,
 *      RIPRENDI_TORNA_A_MENU). A menu chiuso la partita si gioca con la tastiera come prima.
 *   S  solo tastiera, con un pezzo scelto: Invio e Spazio su «Menu» o sulla pastiglia degli
 *      attrezzi premono il pulsante e non posano il pezzo; con il fuoco sul pezzo del vassoio
 *      o su <body> posano come prima (rapporto PO-026, scelta 4; PO-027,
 *      INVIO_PREME_I_PULSANTI).
 *   T  con un pezzo scelto e il pannello degli attrezzi aperto, i tasti della partita
 *      tacciono (Invio, Spazio, frecce, P); il pannello come il menu: fuoco su «Torna alla
 *      partita» all'apertura, alla pastiglia chiuso senza scelta (collaudo 1.21.22, D1 e O3;
 *      PO-028, TASTI_TACCIONO_SOTTO_IL_PANNELLO e PANNELLO_COME_IL_MENU).
 *   U  dalla sfida, menu -> «Nuova partita» -> «Riprendi la partita»: nella libera nessun
 *      pezzo scelto e nessun cursore (collaudo 1.21.22, O1; PO-029,
 *      SCELTA_AZZERATA_CAMBIANDO_PARTITA).
 *   W  mensola, carriola e scambio con un pezzo scelto dalla tastiera: scegliere l'attrezzo
 *      lascia il pezzo, Invio sul vassoio fa l'attrezzo e non posa; Escape nell'attesa come
 *      «Lascia stare»; dopo la mensola il fuoco va sul vassoio (collaudo 1.21.23, D1, O1, O2;
 *      PO-032).
 *   V  la firma vede una griglia diversa con lo stesso punteggio: si cambia solo la griglia
 *      salvata e si ricarica (PO-031, la firma contava una classe che non esiste).
 *   In J, K, L e N il tasto Indietro chiude la domanda e non perde niente; il pulsante sicuro
 *   riporta dentro la partita lasciata, l'altro fa davvero quello che si era chiesto.
 *
 * Stampa una tabella; esce con 1 se in almeno un caso si riparte da zero.
 * Uso: npm run e2e-po008
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { FINESTRA_RIPRESA } from '../../src/persistence/ripresa.js';
import { sequenzaVincente, posizioneMossa } from '../../tools/sequenza-vincente.mjs';
import { quadroNumero, TOTALE_QUADRI } from '../../src/config/quadri.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const errori = [];
const righe = [];
// Le mosse che `unaMossa` ha tentato e la griglia non ha preso: un caso che crede di aver
// giocato e non ha giocato non prova niente.
const mosseMancate = [];
let mosseTentate = 0;
let mosseRitentate = 0;

async function prepara({ introVista = true } = {}) {
  const contesto = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
  const page = await contesto.newPage();
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.evaluate((vista) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: vista, lingua: 'it' }));
  }, introVista);
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(introVista ? '.pl-home__menu' : 'text=Salta per ora');
  return { contesto, page };
}

/** Dove si trova il giocatore adesso. */
const dove = (page) => page.evaluate(() => {
  if (document.querySelector('.pl-plancia')) return 'partita';
  if (document.querySelector('.pl-apertura')) return 'obiettivo';
  if (document.querySelector('.pl-tappe')) return 'mappa';
  if (document.querySelector('.pl-home')) return 'home';
  if ([...document.querySelectorAll('button')].some((b) => /Salta per ora/.test(b.innerText))) return 'guida';
  return '?';
});

/**
 * Le caselle occupate, lette dall'etichetta che la griglia scrive per i lettori di schermo:
 * nasce da `grid[i] !== 0` (`Plancia.jsx`), quindi non conta l'anteprima ne' i blocchi che
 * stanno sparendo. PRIMA SI CONTAVA LA CLASSE `piena`, che le caselle non hanno (la casella
 * occupata ha dentro un `.pl-blocco`): il numero era sempre 0 e la firma reggeva solo sul
 * punteggio e sull'obiettivo (rapporto PO-027/029, scelta 4; PO-031). Il caso V qui sotto
 * fa fallire di proposito la firma con una griglia diversa e lo stesso punteggio.
 */
const OCCUPATA = /, (occupata|filled)$/;
const occupate = (page) => page.evaluate((fonte) => {
  const re = new RegExp(fonte);
  return [...document.querySelectorAll('.pl-plancia .pl-cella')]
    .filter((c) => re.test(c.getAttribute('aria-label') ?? '')).length;
}, OCCUPATA.source);

/** Punteggio, obiettivo e caselle occupate: se cambia uno dei tre, e' un'altra partita. */
const firma = async (page) => {
  const [hud, ob] = await page.evaluate(() => [
    document.querySelector('.pl-hud')?.innerText.replace(/\s+/g, ' ') ?? '',
    document.querySelector('.pl-obiettivo, .pl-barra-obiettivo')?.innerText.replace(/\s+/g, ' ') ?? '',
  ]);
  return `${hud} / ${ob} / ${await occupate(page)} occupate`;
};

/**
 * Trascina il primo pezzo del vassoio dove ENTRA. Prima puntava la casella di mezzo fra
 * quelle "vuote" secondo la stessa classe `piena` che non esiste, cioe' sempre la casella
 * 40, e su una griglia ingombra il pezzo poteva essere rifiutato: la "mossa" non succedeva
 * e il caso proseguiva lo stesso (PO-031). Adesso la forma si legge dal disegno del pezzo,
 * le caselle libere dalla griglia, e si sceglie il posto libero piu' vicino al centro; il
 * puntatore si porta dove il trascinamento (`useTrascinamento.js`, `rilascia`) fa cadere
 * l'origine della forma su quel posto. Restituisce vero se la griglia e' cambiata.
 */
async function unaMossa(page, giro = 1) {
  if (giro === 1) mosseTentate += 1;
  const prima = await occupate(page);
  const p = await page.evaluate((fonte) => {
    const re = new RegExp(fonte);
    const pezzo = document.querySelector('.pl-tray .pl-pezzo');
    const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    if (!pezzo || celle.length !== 81) return null;
    const piena = celle.map((c) => re.test(c.getAttribute('aria-label') ?? ''));
    const colonne = pezzo.style.gridTemplateColumns.match(/repeat\((\d+),\s*([\d.]+)px\)/);
    if (!colonne) return null;
    const larghe = Number(colonne[1]);
    const cellaVassoio = Number(colonne[2]);
    const forma = [...pezzo.children].map((c, i) => (c.querySelector('.pl-blocco') ? [Math.floor(i / larghe), i % larghe] : null)).filter(Boolean);
    const alte = Math.max(...forma.map(([r]) => r)) + 1;
    let meglio = null;
    for (let r = 0; r + alte <= 9; r += 1) {
      for (let c = 0; c + larghe <= 9; c += 1) {
        if (forma.some(([dr, dc]) => piena[(r + dr) * 9 + c + dc])) continue;
        const d = (r + (alte - 1) / 2 - 4) ** 2 + (c + (larghe - 1) / 2 - 4) ** 2;
        if (!meglio || d < meglio.d) meglio = { r, c, d };
      }
    }
    if (!meglio) return null;
    // La presa al centro del disegno, in caselle del vassoio, come la calcola `iniziaTrascinamento`.
    const rp = pezzo.getBoundingClientRect();
    const dentro = (v, m) => Math.max(0.5, Math.min(m - 0.5, v));
    const presaX = dentro((rp.width / 2) / cellaVassoio, larghe);
    const presaY = dentro((rp.height / 2) / cellaVassoio, alte);
    const origine = celle[meglio.r * 9 + meglio.c].getBoundingClientRect();
    return {
      px: rp.left + rp.width / 2, py: rp.top + rp.height / 2,
      cx: origine.left + presaX * origine.width, cy: origine.top + presaY * origine.height,
    };
  }, OCCUPATA.source);
  if (!p) { mosseMancate.push('nessun posto libero per il primo pezzo'); return false; }
  await page.mouse.move(p.px, p.py);
  await page.mouse.down();
  await page.mouse.move(p.cx, p.cy, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(150);
  // Con la macchina carica il disegno puo' arrivare dopo i 150 ms: si aspetta fino a 2 s
  // prima di dire che la mossa non c'e' stata.
  let fatta = (await occupate(page)) !== prima;
  for (let i = 0; !fatta && i < 20; i += 1) {
    await page.waitForTimeout(100);
    fatta = (await occupate(page)) !== prima;
  }
  // Una volta su una dozzina di corse, e solo con tre corse insieme sulla stessa macchina, la
  // prima mossa non e' arrivata (misurato una volta, causa non trovata): si ritenta una volta
  // sola, e i ritentativi si contano e si stampano, cosi' un peggioramento si vede.
  if (!fatta && giro === 1) { mosseRitentate += 1; return unaMossa(page, 2); }
  if (!fatta) mosseMancate.push(`il pezzo non e' stato posato (${prima} occupate prima e dopo, ${await dove(page)})`);
  return fatta;
}

async function aspetta(page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(900);
}

/** Dalla home: mappa, primo livello, "Gioca" se c'e' la presentazione. */
async function apriLivello1DallaMappa(page) {
  if (await dove(page) === 'home') {
    await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
  }
  await page.locator('.pl-tappa').first().click();
  await page.waitForTimeout(300);
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
}

async function entraEGioca(page, mosse = 3) {
  await apriLivello1DallaMappa(page);
  for (let i = 0; i < mosse; i += 1) await unaMossa(page);
  await page.waitForTimeout(500);
  return firma(page);
}

/** Torna nel livello come farebbe il giocatore, da qualunque schermata. */
async function tornaNelLivello(page) {
  if (await dove(page) === 'guida') {
    await page.getByRole('button', { name: /Salta per ora/ }).click();
    await page.waitForTimeout(300);
  }
  if (await dove(page) === 'home') {
    await page.locator('.pl-home__azioni .pl-btn--primario').click();
    await page.waitForTimeout(300);
  }
  if (await dove(page) === 'mappa') {
    await page.locator('.pl-tappa').first().click();
    await page.waitForTimeout(300);
  }
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  return firma(page);
}

function registra(caso, { primo, prima, dopo, nota = '' }) {
  const daZero = prima !== dopo;
  righe.push({ caso, primo, daZero, nota });
  if (daZero) errori.push(`${caso}: si riparte da zero ("${prima}" -> "${dopo}")`);
}

// ---------- A ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.goBack();
  await page.waitForTimeout(500);
  const primo = await dove(page);
  const salvato = await page.evaluate(() => localStorage.getItem('plinto:partita-quadro') !== null);
  const dopo = await tornaNelLivello(page);
  registra('A Indietro dal livello, poi riapro il livello dalla mappa', { primo, prima, dopo, nota: `salvataggio dopo Indietro: ${salvato}` });
  // Il B6 resta: dopo la mappa, Indietro va alla home.
  if (primo !== 'mappa') errori.push(`A: Indietro dal livello porta a "${primo}", non alla mappa`);
  await contesto.close();
}

// ---------- B ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.evaluate((f) => {
    const voce = JSON.parse(localStorage.getItem('plinto:ripresa'));
    voce.quando = Date.now() - f - 60_000;
    localStorage.setItem('plinto:ripresa', JSON.stringify(voce));
  }, FINESTRA_RIPRESA);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  const etichetta = primo === 'home'
    ? (await page.locator('.pl-home__azioni .pl-btn--primario').innerText()).replace(/\s+/g, ' ') : '';
  const dopo = await tornaNelLivello(page);
  registra('B oltre 2 ore, poi pulsante grande della home', { primo, prima, dopo, nota: `pulsante: «${etichetta}»` });
  // PO-013: il pulsante dice «Livello N», non «Riprendi il livello N» (il tocco riprende comunque).
  if (primo === 'home' && !/^LIVELLO \d+$/i.test(etichetta.trim())) errori.push(`B: il pulsante grande dice «${etichetta}» invece di «Livello N» (PO-013)`);
  if (primo !== 'home') errori.push(`B: oltre la finestra il gioco non apre la home ma "${primo}"`);
  await contesto.close();
}

// ---------- C ----------
{
  const { contesto, page } = await prepara();
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').first().click();
  await page.waitForSelector('.pl-apertura');
  await page.waitForTimeout(300);
  const salvato = await page.evaluate(() => localStorage.getItem('plinto:partita-quadro') !== null);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  righe.push({ caso: 'C esco mentre leggo l obiettivo, ricarico', primo, daZero: !salvato, nota: `salvato durante la presentazione: ${salvato}` });
  if (!salvato) errori.push('C: durante la presentazione dell obiettivo il livello non e salvato');
  if (primo !== 'obiettivo') errori.push(`C: dopo la ricarica non si torna all obiettivo del livello ma a "${primo}"`);
  await contesto.close();
}

// ---------- D ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    document.dispatchEvent(new Event('freeze'));
  });
  const cdp = await contesto.newCDPSession(page);
  await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
  await new Promise((r) => setTimeout(r, 3000));
  await cdp.send('Page.setWebLifecycleState', { state: 'active' });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('resume'));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.waitForTimeout(500);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('D secondo piano (visibilitychange, pagehide, freeze CDP 3 s)', { primo, prima, dopo });
  await contesto.close();
}

// ---------- E ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('E ricarica (pagina buttata via)', { primo, prima, dopo });
  await contesto.close();
}

// ---------- F ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  await page.goto(`${INDIRIZZO}?origine=play`);
  await aspetta(page);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('F nuova navigazione a ?origine=play', { primo, prima, dopo });
  await contesto.close();
}

// ---------- G ----------
{
  const { contesto, page } = await prepara({ introVista: false });
  await page.getByRole('button', { name: /Salta per ora/ }).click();
  await page.waitForSelector('.pl-home__menu');
  const prima = await entraEGioca(page);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  const dopo = await tornaNelLivello(page);
  registra('G introVista falso, livello, ricarica', { primo, prima, dopo });
  if (primo !== 'partita') errori.push(`G: con introVista falso la ripresa automatica non avviene (si apre "${primo}")`);
  await contesto.close();
}

// ---------- H ----------
{
  const { contesto, page } = await prepara({ introVista: false });
  await page.getByRole('button', { name: /Salta per ora/ }).click();
  await page.waitForSelector('.pl-home__menu');
  await page.getByRole('button', { name: /^Partita libera/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(500);
  const prima = await firma(page);
  await page.reload();
  await aspetta(page);
  const primo = await dove(page);
  if (primo === 'guida') await page.getByRole('button', { name: /Salta per ora/ }).click();
  if (await dove(page) === 'home') {
    await page.getByRole('button', { name: /^Partita libera, riprendi/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await page.waitForTimeout(500);
  }
  const dopo = await firma(page);
  registra('H introVista falso, partita libera, ricarica', { primo, prima, dopo });
  if (primo !== 'partita') errori.push(`H: con introVista falso la partita libera non si riapre da sola (si apre "${primo}")`);
  await contesto.close();
}

// ---------- I ----------
// Il livello 2 giocato a meta' non si perde se si apre soltanto l'obiettivo del livello 1.
{
  const { contesto, page } = await prepara();
  await page.evaluate(() => localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } })));
  await page.reload();
  await page.waitForSelector('.pl-home__menu');
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(1).click();
  await page.waitForTimeout(300);
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  const prima = await firma(page);
  await page.goBack();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').first().click();
  await page.waitForSelector('.pl-apertura');
  await page.waitForTimeout(400);
  const numero = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null')?.numero ?? null);
  righe.push({ caso: 'I guardo solo l obiettivo di un altro livello', primo: 'obiettivo', daZero: numero !== 2, nota: `livello salvato: ${numero}` });
  if (numero !== 2) errori.push(`I: aprire l obiettivo del livello 1 ha sovrascritto il livello 2 a meta (salvato: ${numero}; prima: «${prima}»)`);
  await contesto.close();
}

// ---------- J, K, L: le tre strade che perdevano la partita con un tocco ----------
/** La domanda di conferma, se e' a schermo: il testo e il pulsante che ha il fuoco. */
const domanda = (page) => page.evaluate(() => {
  // `.pl-azzera`: le domande. Anche il menu e' una finestra (PO-024), e con la libera a
  // meta' «Nuova partita» apre la domanda SOPRA il menu ancora aperto.
  const d = document.querySelector('.pl-azzera[role="dialog"]');
  if (!d) return null;
  return {
    testo: d.innerText.replace(/\s+/g, ' '),
    fuoco: d.contains(document.activeElement) ? document.activeElement.innerText.trim() : '',
  };
});

/** Il fuoco deve stare sul pulsante che NON perde niente. */
function fuocoSicuro(caso, d, atteso) {
  if (d && !atteso.test(d.fuoco)) errori.push(`${caso}: il fuoco e' su «${d.fuoco}», non sul pulsante che torna indietro`);
}

// ---------- J ----------
{
  const { contesto, page } = await prepara();
  await page.evaluate(() => localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } })));
  await page.reload();
  await page.waitForSelector('.pl-home__menu');
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(1).click();
  await page.waitForTimeout(300);
  if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  const prima = await firma(page);
  await page.goBack();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').first().click();
  await page.waitForSelector('.pl-apertura');
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForTimeout(400);
  const d = await domanda(page);
  let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
  let dopo = '';
  if (d) {
    fuocoSicuro('J', d, /Riprendi il livello 2/);
    await page.goBack();
    await page.waitForTimeout(400);
    const dopoIndietro = await dove(page);
    if (await domanda(page) || dopoIndietro !== 'obiettivo') errori.push(`J: Indietro non chiude la domanda restando sull obiettivo (sono su "${dopoIndietro}")`);
    await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Riprendi il livello 2$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    dopo = await firma(page);
  }
  const numero = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null')?.numero ?? null);
  nota += `; livello salvato: ${numero}`;
  registra('J livello 2 a meta, «Gioca» sul livello 1', { primo: d ? 'domanda' : await dove(page), prima, dopo: d ? dopo : `${numero}`, nota });
  if (!d) errori.push(`J: «Gioca» sul livello 1 non chiede niente e il livello 2 a meta sparisce (salvato: ${numero})`);
  await contesto.close();
}

// ---------- K ----------
{
  const { contesto, page } = await prepara();
  const prima = await entraEGioca(page);
  const riprova = async () => {
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Riprova$/ }).click();
    await page.waitForTimeout(400);
  };
  await riprova();
  const d = await domanda(page);
  let dopo = await firma(page);
  let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
  if (d) {
    fuocoSicuro('K', d, /Torna alla partita/);
    await page.goBack();
    await page.waitForTimeout(400);
    dopo = await firma(page);
    if (await domanda(page) || await dove(page) !== 'partita') errori.push('K: Indietro non chiude la domanda restando nel livello');
    // Il pulsante che perde deve ricominciare davvero: una domanda che blocca e basta non e' una correzione.
    await riprova();
    await page.getByRole('button', { name: /^Sì, ricomincia da capo$/ }).click();
    await page.waitForTimeout(500);
    const ricominciato = await firma(page);
    nota += `; dopo la scelta che perde: ${ricominciato === prima ? 'NON ricomincia' : 'ricomincia'}`;
    if (ricominciato === prima) errori.push('K: il pulsante che perde non ricomincia il livello');
  }
  registra('K «Riprova» nel menu del livello', { primo: d ? 'domanda' : await dove(page), prima, dopo, nota });
  if (!d) errori.push('K: «Riprova» azzera il livello senza chiedere');
  await contesto.close();
}

// ---------- L ----------
{
  const { contesto, page } = await prepara();
  const ieri = await page.evaluate(() => {
    const g = new Date(); g.setDate(g.getDate() - 1);
    return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, '0')}-${String(g.getDate()).padStart(2, '0')}`;
  });
  // Dall'archivio, come farebbe il giocatore. Il primo del mese il giorno prima sta nel
  // mese precedente: il calendario si apre sul mese corrente, e lo si sfoglia indietro.
  await page.getByRole('button', { name: /Archivio delle sfide/ }).click();
  await page.waitForSelector('.pl-calendario');
  const cella = () => page.locator(`button.pl-giorno[aria-label^="${Number(ieri.slice(8))} "]`).first();
  if (!(await cella().count())) await page.getByRole('button', { name: /Mese precedente/ }).click().catch(() => {});
  await cella().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  const prima = await firma(page);
  await page.locator('.pl-hud__menu').click();
  await page.getByRole('button', { name: /^Torna alla home$/ }).click();
  await page.waitForSelector('.pl-home__menu');
  await page.locator('.pl-sfida-avvio--sfida').click();
  await page.waitForTimeout(400);
  const d = await domanda(page);
  let dopo = await firma(page);
  let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
  if (d) {
    fuocoSicuro('L', d, /Riprendi la sfida/);
    await page.goBack();
    await page.waitForTimeout(400);
    if (await domanda(page) || await dove(page) !== 'home') errori.push('L: Indietro non chiude la domanda restando sulla home');
    await page.locator('.pl-sfida-avvio--sfida').click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Riprendi la sfida/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(400);
    dopo = await firma(page);
  }
  const salvata = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-sfida') ?? 'null')?.seedLabel ?? null);
  nota += `; sfida salvata: ${salvata}`;
  if (d) {
    // Il pulsante che perde deve aprire davvero quella di oggi.
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
    await page.locator('.pl-sfida-avvio--sfida').click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: /^Apri la sfida di oggi$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    const oggi = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-sfida') ?? 'null')?.seedLabel ?? null);
    nota += `; dopo la scelta che perde: ${oggi}`;
    if (oggi === ieri || await dove(page) !== 'partita') errori.push(`L: il pulsante che perde non apre la sfida di oggi (salvata: ${oggi})`);
  }
  registra('L sfida di ieri a meta, apro quella di oggi', { primo: d ? 'domanda' : await dove(page), prima, dopo, nota });
  if (!d) errori.push('L: aprire la sfida di oggi non chiede niente e quella di ieri a meta sparisce');
  await contesto.close();
}

// ---------- M ----------
// Dall'archivio, dopo la domanda, la sfida aperta tiene il suo indirizzo `#/sfida/<giorno>`.
{
  const { contesto, page } = await prepara();
  const giornoFa = (d) => page.evaluate((d) => { const g = new Date(); g.setDate(g.getDate() - d); return `${g.getFullYear()}-${String(g.getMonth() + 1).padStart(2, '0')}-${String(g.getDate()).padStart(2, '0')}`; }, d);
  const ieri = await giornoFa(1), altro = await giornoFa(2);
  async function apri(giorno) {
    await page.getByRole('button', { name: /Archivio delle sfide/ }).click();
    await page.waitForSelector('.pl-calendario');
    const c = () => page.locator(`button.pl-giorno[aria-label^="${Number(giorno.slice(8))} "]`).first();
    if (!(await c().count())) await page.getByRole('button', { name: /Mese precedente/ }).click().catch(() => {});
    await c().click();
    await page.waitForTimeout(400);
  }
  await apri(ieri);
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 2; i += 1) await unaMossa(page);
  await page.locator('.pl-hud__menu').click();
  await page.getByRole('button', { name: /^Torna alla home$/ }).click();
  await page.waitForSelector('.pl-home__menu');
  await apri(altro);
  await page.getByRole('button', { name: /^Riprendi la sfida/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(700);
  const ancora = await page.evaluate(() => location.hash);
  righe.push({ caso: 'M dall archivio, dopo la domanda, l indirizzo della sfida', primo: await dove(page), daZero: false, nota: `ancora: «${ancora}»` });
  if (ancora !== `#/sfida/${ieri}`) errori.push(`M: dopo la domanda dall archivio l indirizzo e «${ancora}», atteso «#/sfida/${ieri}»`);
  await contesto.close();
}

// ---------- N ----------
// Una partita libera a meta' (due mosse) e una nuova libera chiesta da ogni strada che ne
// comincia una. Per ogni punto di partenza: c'e' la domanda, il fuoco e' su «Riprendi la
// partita», Indietro la chiude senza perdere niente, «Riprendi la partita» riporta dentro
// quella di prima. Il pulsante che perde si prova una volta (dalla home).
{
  const finestra = (page) => page.locator('.pl-azzera[role="dialog"]');
  async function liberaAMeta(page) {
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.waitForTimeout(400);
    return firma(page);
  }
  async function allaHome(page) {
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
  }
  async function vaiDallaHome(page, voce, selettore) {
    await page.locator('.pl-home__voce', { hasText: voce }).click();
    await page.waitForTimeout(300);
    await page.waitForSelector(selettore);
  }
  // Ogni punto: come ci si arriva (dalla home, con la libera gia' a meta') e quale
  // pulsante comincia una nuova libera; `dove` e' la schermata su cui Indietro ci lascia.
  const punti = [
    { nome: 'home', arriva: async () => {}, tocca: (p) => p.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera').click(), dove: 'home' },
    { nome: 'menu della partita', arriva: async (p) => {
      await p.getByRole('button', { name: /^Partita libera, riprendi/ }).click();
      await p.waitForSelector('.pl-plancia .pl-cella');
      await p.locator('.pl-hud__menu').click();
    }, tocca: (p) => p.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click(), dove: 'partita' },
    { nome: 'profilo', arriva: (p) => vaiDallaHome(p, 'Il tuo profilo di gioco', '.pl-vuoto, .pl-schermo'),
      tocca: (p) => p.getByRole('button', { name: /^Gioca una partita$/ }).click(), dove: 'profilo' },
    { nome: 'statistiche', arriva: (p) => vaiDallaHome(p, 'Statistiche', '.pl-vuoto, .pl-schermo'),
      tocca: (p) => p.getByRole('button', { name: /^Gioca una partita$/ }).click(), dove: 'statistiche' },
  ];
  const titoloSchermo = (page) => page.evaluate(() => document.querySelector('h1, h2')?.innerText.trim() ?? '');

  for (const punto of punti) {
    const { contesto, page } = await prepara();
    const prima = await liberaAMeta(page);
    await allaHome(page);
    await punto.arriva(page);
    const titolo = await titoloSchermo(page);
    await punto.tocca(page);
    await page.waitForTimeout(400);
    const d = await domanda(page);
    let dopo = await firma(page);
    let nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
    if (d) {
      fuocoSicuro(`N ${punto.nome}`, d, /^Riprendi la partita$/);
      await page.goBack();
      await page.waitForTimeout(400);
      const qui = await dove(page);
      const restaQui = punto.dove === 'home' ? qui === 'home'
        : punto.dove === 'partita' ? qui === 'partita'
          : (await titoloSchermo(page)) === titolo;
      if (await domanda(page) || !restaQui) errori.push(`N ${punto.nome}: Indietro non chiude la domanda restando dov'ero (sono su "${qui}")`);
      // Dal menu, Indietro ha chiuso la domanda: il menu si riapre per toccare di nuovo.
      if (punto.dove === 'partita' && !(await page.locator('.pl-menu').count())) await page.locator('.pl-hud__menu').click();
      await punto.tocca(page);
      await page.waitForTimeout(300);
      await finestra(page).getByRole('button', { name: /^Riprendi la partita$/ }).click();
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      dopo = await firma(page);
      if (await dove(page) !== 'partita') errori.push(`N ${punto.nome}: «Riprendi la partita» non riporta nella partita`);
    } else {
      // Senza domanda la libera a meta' e' gia' stata coperta da una nuova.
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      dopo = await firma(page);
    }
    if (d && punto.nome === 'home') {
      await allaHome(page);
      await punto.tocca(page);
      await page.waitForTimeout(300);
      await finestra(page).getByRole('button', { name: /^Nuova partita$/ }).click();
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      const nuova = await firma(page);
      nota += `; dopo «Nuova partita»: ${nuova === prima ? 'la stessa partita' : 'una partita nuova'}`;
      if (nuova === prima || await dove(page) !== 'partita') errori.push('N home: «Nuova partita» non comincia una partita nuova');
    }
    registra(`N libera a meta, nuova libera da ${punto.nome}`, { primo: d ? 'domanda' : await dove(page), prima, dopo, nota });
    if (!d) errori.push(`N ${punto.nome}: una nuova partita libera cancella quella a meta senza chiedere`);
    await contesto.close();
  }

  // Festa finale: novantanove livelli scritti come superati, la libera a meta', il
  // livello 1 vinto davvero; «Gioca in partita libera» deve chiedere.
  {
    const { contesto, page } = await prepara();
    const prima = await liberaAMeta(page);
    await allaHome(page);
    await page.evaluate((n) => {
      const livelli = {};
      for (let i = 2; i <= n; i += 1) livelli[i] = { mosse: 12, punteggio: 300, tentativi: 1 };
      localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
    }, TOTALE_QUADRI);
    await page.reload();
    await page.waitForSelector('.pl-home__menu');
    await apriLivello1DallaMappa(page);
    for (const mossa of sequenzaVincente(quadroNumero(1)) ?? []) {
      const punti = await posizioneMossa(page, mossa);
      if (!punti) break;
      await page.mouse.move(punti.px, punti.py);
      await page.mouse.down();
      await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(45);
      if (await page.locator('.pl-quadro-esito, .pl-trionfo').count() > 0) break;
    }
    await page.waitForSelector('.pl-trionfo', { timeout: 5000 }).catch(() => {});
    const festa = await page.locator('.pl-trionfo').count() > 0;
    let d = null, dopo = '', nota = '';
    if (!festa) {
      errori.push('N festa finale: non ci si arriva, il caso non prova niente');
      nota = 'festa finale non raggiunta';
    } else {
      await page.getByRole('button', { name: /^Gioca in partita libera$/ }).click();
      await page.waitForTimeout(400);
      d = await domanda(page);
      nota = d ? `domanda: «${d.testo}»` : 'nessuna domanda';
      if (d) {
        fuocoSicuro('N festa finale', d, /^Riprendi la partita$/);
        await page.goBack();
        await page.waitForTimeout(400);
        if (await domanda(page) || !(await page.locator('.pl-trionfo').count())) errori.push('N festa finale: Indietro non chiude la domanda restando sulla festa');
        await page.getByRole('button', { name: /^Gioca in partita libera$/ }).click();
        await page.waitForTimeout(300);
        await finestra(page).getByRole('button', { name: /^Riprendi la partita$/ }).click();
      }
      await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(400);
      dopo = await firma(page);
      if (!d) errori.push('N festa finale: «Gioca in partita libera» cancella quella a meta senza chiedere');
    }
    registra('N libera a meta, nuova libera dalla festa finale', { primo: d ? 'domanda' : await dove(page), prima, dopo: festa ? dopo : prima, nota });
    await contesto.close();
  }

  // Zero mosse: niente da perdere, niente domanda.
  {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await allaHome(page);
    // PO-020: «Nuova» dentro la card; .pl-home__nuova-libera e' il collegamento di prima.
    const link = await page.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera').count();
    if (link) await page.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera').click();
    await page.waitForTimeout(400);
    const d = await domanda(page);
    const qui = await dove(page);
    righe.push({ caso: 'N libera a zero mosse, nuova libera dalla home', primo: d ? 'domanda' : qui, daZero: false, nota: `collegamento: ${link ? 'si' : 'no'}` });
    if (d) errori.push('N zero mosse: chiede conferma anche se non c e niente da perdere');
    if (link && qui !== 'partita') errori.push(`N zero mosse: la nuova partita non parte (sono su "${qui}")`);
    await contesto.close();
  }
}

// ---------- O ----------
// Dentro una sfida, menu -> «Nuova partita»: si gioca la libera e si ricarica. Si deve
// ritrovare la libera, non la sfida (collaudo 1.21.12, I1). Due strade: senza libera a
// meta' (nessuna domanda) e con la libera a meta' («Riprendi la partita» nella domanda).
// Poi Indietro: si torna alla home e la sfida non si riapre.
// Il punteggio da solo non basta a distinguere le due partite (possono coincidere):
// conta l'intestazione della sfida (`.pl-modalita--sfida`), che la libera non ha.
const modo = (page) => page.evaluate(() => (!document.querySelector('.pl-plancia') ? 'fuori'
  : document.querySelector('.pl-modalita--sfida') ? 'sfida' : 'libera'));
for (const conLibera of [false, true]) {
  const nome = conLibera ? 'O sfida, menu, Riprendi la partita (libera), ricarico' : 'O sfida, menu, Nuova partita, ricarico';
  const { contesto, page } = await prepara();
  if (conLibera) {
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
  }
  await page.locator('.pl-sfida-avvio--sfida').click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 3; i += 1) await unaMossa(page);
  await page.waitForTimeout(400);
  await page.locator('.pl-hud__menu').click();
  await page.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click();
  await page.waitForTimeout(400);
  if (conLibera) {
    if (!(await domanda(page))) errori.push(`${nome}: manca la domanda`);
    else await page.locator('.pl-azzera[role="dialog"]').getByRole('button', { name: /^Riprendi la partita$/ }).click();
    await page.waitForTimeout(400);
  } else {
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
  }
  await page.waitForTimeout(500);
  const prima = await firma(page);
  const modoPrima = await modo(page);
  const ancoraPrima = await page.evaluate(() => location.hash);
  if (modoPrima !== 'libera') errori.push(`${nome}: dopo «Nuova partita» si e' in "${modoPrima}", non nella libera`);
  await page.reload();
  await aspetta(page);
  const dopo = await firma(page);
  const modoDopo = await modo(page);
  const ancoraDopo = await page.evaluate(() => location.hash);
  await page.goBack();
  await page.waitForTimeout(700);
  const dopoIndietro = await dove(page);
  const ancoraIndietro = await page.evaluate(() => location.hash);
  registra(nome, { primo: modoDopo, prima, dopo,
    nota: `ancora prima «${ancoraPrima}», dopo «${ancoraDopo}»; Indietro: ${dopoIndietro} «${ancoraIndietro}»` });
  if (modoDopo !== 'libera') errori.push(`${nome}: dopo la ricarica si ritrova la SFIDA, non la libera`);
  if (ancoraPrima !== '') errori.push(`${nome}: nella libera l'indirizzo e' «${ancoraPrima}»`);
  if (dopoIndietro !== 'home' || ancoraIndietro !== '') errori.push(`${nome}: Indietro dopo la ricarica porta a "${dopoIndietro}" «${ancoraIndietro}»`);
  await contesto.close();
}

// ---------- P ----------
// Chiusa la domanda senza scegliere, il fuoco deve tornare al pulsante che l'ha aperta
// (collaudo 1.21.18, D1: finiva su <body> e il Tab ripartiva da «Livello 1»). Tre domande
// diverse, aperte da tre posti diversi, chiuse con Escape e col tocco sul velo.
{
  const fuocoOra = (page) => page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return '<body>';
    return (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().replace(/\s+/g, ' ');
  });
  // Un angolo del velo, fuori dalla finestra: se li' non c'e' il velo il caso non prova niente.
  async function toccaVelo(page) {
    const ok = await page.evaluate(() => document.elementFromPoint(4, 4)?.classList.contains('pl-velo'));
    if (!ok) return false;
    await page.mouse.click(4, 4);
    return true;
  }
  async function chiudiE(page, caso, come, atteso) {
    const d = await domanda(page);
    if (!d) { errori.push(`P ${caso}: la domanda non si apre, il caso non prova niente`); return ''; }
    if (come === 'Escape') await page.keyboard.press('Escape');
    else if (!(await toccaVelo(page))) { errori.push(`P ${caso}: nell'angolo non c'e' il velo`); return ''; }
    await page.waitForTimeout(300);
    if (await domanda(page)) { errori.push(`P ${caso}: ${come} non chiude la domanda`); return ''; }
    const f = await fuocoOra(page);
    if (!atteso.test(f)) errori.push(`P ${caso}, ${come}: il fuoco e' su «${f}», non sul pulsante che ha aperto la domanda`);
    return f;
  }
  const note = [];

  // Home, con la tastiera: fuoco su «Nuova», Invio, Escape; poi Invio, velo; poi Tab.
  {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
    const nuova = page.locator('.pl-sfida-avvio__nuova, .pl-home__nuova-libera');
    await nuova.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    note.push(`home Esc: ${await chiudiE(page, 'home', 'Escape', /^Nuova partita libera$/)}`);
    await nuova.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    note.push(`home velo: ${await chiudiE(page, 'home', 'velo', /^Nuova partita libera$/)}`);
    await page.keyboard.press('Tab');
    const dopoTab = await fuocoOra(page);
    note.push(`Tab dopo: ${dopoTab}`);
    if (!/^Partita libera, riprendi/.test(dopoTab)) errori.push(`P home: il Tab dopo la chiusura va su «${dopoTab}», non sul pulsante dopo «Nuova»`);
    await contesto.close();
  }

  // «Riprova» nel menu del livello, Escape. Il menu si chiude con lo stesso tocco, quindi
  // «Riprova» non c'e' piu': il fuoco va al pulsante che riapre il menu.
  {
    const { contesto, page } = await prepara();
    await apriLivello1DallaMappa(page);
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Riprova$/ }).click();
    await page.waitForTimeout(400);
    note.push(`Riprova Esc: ${await chiudiE(page, 'Riprova', 'Escape', /^Menu$/)}`);
    await contesto.close();
  }

  // «Gioca» sul livello 1 con il livello 2 a meta', velo.
  {
    const { contesto, page } = await prepara();
    await page.evaluate(() => localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } })));
    await page.reload();
    await page.waitForSelector('.pl-home__menu');
    await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    await page.locator('.pl-tappa').nth(1).click();
    await page.waitForTimeout(300);
    if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.goBack();
    await page.waitForSelector('.pl-tappe');
    await page.locator('.pl-tappa').first().click();
    await page.waitForSelector('.pl-apertura');
    await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForTimeout(400);
    note.push(`Gioca velo: ${await chiudiE(page, 'Gioca', 'velo', /^Gioca$/)}`);
    await contesto.close();
  }
  righe.push({ caso: 'P chiusa la domanda senza scegliere, dove va il fuoco', primo: '-', daZero: false, nota: note.join('; ') });
}

// ---------- Q ----------
// Il menu della partita come le domande (collaudo 1.21.20, O2; PO-024): Escape non lo
// chiudeva, all'apertura il fuoco restava su «Menu» dietro il velo, chiuso col velo o con
// «Torna alla partita» il fuoco finiva su <body>. Aperto sempre con la tastiera (fuoco su
// «Menu», Invio), come fa chi non usa il dito.
{
  const fuocoOra = (page) => page.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return '<body>';
    const nome = (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().replace(/\s+/g, ' ');
    return a.closest('.pl-menu') ? `menu: ${nome}` : nome;
  });
  const menuAperto = (page) => page.evaluate(() => !!document.querySelector('.pl-menu'));
  async function apriMenu(page, caso) {
    await page.locator('.pl-hud__menu').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    if (!(await menuAperto(page))) { errori.push(`Q ${caso}: il menu non si apre, il caso non prova niente`); return false; }
    const f = await fuocoOra(page);
    if (f !== 'menu: Torna alla partita') errori.push(`Q ${caso}: aperto il menu il fuoco e' su «${f}», non su «Torna alla partita»`);
    const ruolo = await page.evaluate(() => {
      const m = document.querySelector('.pl-menu');
      return `${m.getAttribute('role')}/${m.getAttribute('aria-modal')}/${m.getAttribute('aria-label')}`;
    });
    if (ruolo !== 'dialog/true/Menu') errori.push(`Q ${caso}: il menu non e' una finestra per chi legge lo schermo (${ruolo})`);
    return true;
  }
  async function chiudi(page, caso, come) {
    if (come === 'Escape') await page.keyboard.press('Escape');
    else if (come === 'velo') {
      const ok = await page.evaluate(() => document.elementFromPoint(4, 4)?.classList.contains('pl-velo'));
      if (!ok) { errori.push(`Q ${caso}: nell'angolo non c'e' il velo`); return ''; }
      await page.mouse.click(4, 4);
    } else if (come === 'Torna alla partita') await page.locator('.pl-menu').getByRole('button', { name: /^Torna alla partita$/ }).click();
    else await page.goBack();
    await page.waitForTimeout(400);
    if (await menuAperto(page)) { errori.push(`Q ${caso}: ${come} non chiude il menu`); return ''; }
    if (await dove(page) !== 'partita') errori.push(`Q ${caso}: ${come} non lascia nella partita (${await dove(page)})`);
    const f = await fuocoOra(page);
    if (f !== 'Menu') errori.push(`Q ${caso}, ${come}: il fuoco e' su «${f}», non su «Menu»`);
    return f;
  }
  const note = [];

  // Partita libera a meta': le quattro chiusure senza scelta.
  {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    for (const come of ['Escape', 'velo', 'Torna alla partita', 'Indietro']) {
      if (await apriMenu(page, `libera ${come}`)) note.push(`libera ${come}: ${await chiudi(page, 'libera', come)}`);
    }
    // Una domanda sopra il menu: Escape chiude la domanda e il menu resta; il secondo
    // Escape chiude il menu e il fuoco torna a «Menu».
    if (await apriMenu(page, 'libera, domanda sopra')) {
      await page.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click();
      await page.waitForTimeout(400);
      if (!(await domanda(page))) errori.push('Q libera: «Nuova partita» non apre la domanda, il caso non prova niente');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
      const restaMenu = await menuAperto(page);
      if (await domanda(page)) errori.push('Q libera: Escape non chiude la domanda sopra il menu');
      if (!restaMenu) errori.push('Q libera: un Escape sulla domanda ha chiuso anche il menu');
      else note.push(`domanda sopra, poi Esc: ${await chiudi(page, 'libera dopo la domanda', 'Escape')}`);
    }
    // Una scelta che cambia schermata: si va alla home, come prima.
    if (await apriMenu(page, 'libera, scelta')) {
      await page.locator('.pl-menu').getByRole('button', { name: /^Torna alla home$/ }).click();
      await page.waitForTimeout(400);
      if (await dove(page) !== 'home') errori.push(`Q libera: «Torna alla home» porta a «${await dove(page)}»`);
      note.push(`Torna alla home: ${await dove(page)}, fuoco ${await fuocoOra(page)}`);
    }
    await contesto.close();
  }

  // Livello: l'altro menu, Escape.
  {
    const { contesto, page } = await prepara();
    await apriLivello1DallaMappa(page);
    await unaMossa(page);
    if (await apriMenu(page, 'livello')) note.push(`livello Escape: ${await chiudi(page, 'livello', 'Escape')}`);
    await contesto.close();
  }
  righe.push({ caso: 'Q il menu della partita come le domande', primo: '-', daZero: false, nota: note.join('; ') });
}

// ---------- R ----------
// I tasti della partita sotto il velo (collaudo 1.21.21, D1 e O1; PO-026). Il pezzo si
// sceglie col clic e il cursore va in cima con le frecce, come nel collaudo. Il segno che
// il tasto e' arrivato alla partita e' il pezzo che non e' piu' scelto: Invio lo posa (o lo
// rifiuta, se li' non entra) e lo lascia comunque, Escape lo lascia. Accanto, la firma
// della partita, che non deve cambiare.
{
  const stato = (page) => page.evaluate(() => {
    const a = document.activeElement;
    let fuoco = '<body>';
    if (a && a !== document.body) {
      const nome = (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().replace(/\s+/g, ' ');
      fuoco = a.closest('.pl-menu') ? `menu: ${nome}` : a.closest('.pl-azzera') ? `domanda: ${nome}` : nome;
    }
    return {
      scelto: !!document.querySelector('.pl-tray__posto--selezionato'),
      menu: !!document.querySelector('.pl-menu'),
      domanda: !!document.querySelector('.pl-azzera[role="dialog"]'),
      fuoco,
    };
  });
  async function scegli(page) {
    await page.locator('.pl-tray .pl-pezzo-presa').first().click();
    for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(200);
  }
  const nome = { Enter: 'Invio', ' ': 'Spazio', Escape: 'Escape' };
  const note = [];
  // Controlla l'esito di un tasto: `atteso` dice dove deve stare il fuoco e che cosa resta
  // aperto; il pezzo deve essere ancora scelto e la partita uguale.
  async function prova(page, caso, tasto, atteso, prima) {
    const s0 = await stato(page);
    if (!s0.scelto) { errori.push(`R ${caso}: il pezzo non e' scelto prima del tasto, il caso non prova niente`); return; }
    await page.keyboard.press(tasto);
    await page.waitForTimeout(400);
    const s = await stato(page);
    const dopo = await firma(page);
    const tag = `R ${caso}, ${nome[tasto]}`;
    if (!s.scelto) errori.push(`${tag}: il tasto e' arrivato alla partita sotto il velo, il pezzo non e' piu' scelto`);
    if (dopo !== prima) errori.push(`${tag}: la partita e' cambiata sotto il velo ("${prima}" -> "${dopo}")`);
    if (s.menu !== atteso.menu) errori.push(`${tag}: menu ${s.menu ? 'aperto' : 'chiuso'}, atteso ${atteso.menu ? 'aperto' : 'chiuso'}`);
    if (s.domanda !== atteso.domanda) errori.push(`${tag}: domanda ${s.domanda ? 'aperta' : 'chiusa'}, attesa ${atteso.domanda ? 'aperta' : 'chiusa'}`);
    if (s.fuoco !== atteso.fuoco) errori.push(`${tag}: il fuoco e' su «${s.fuoco}», non su «${atteso.fuoco}»`);
    note.push(`${caso} ${nome[tasto]}: ${s.scelto ? 'pezzo scelto' : 'PEZZO LASCIATO'}, fuoco ${s.fuoco}`);
  }
  async function liberaAMeta() {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.waitForTimeout(300);
    return { contesto, page };
  }
  const apriMenu = async (page) => { await page.locator('.pl-hud__menu').click(); await page.waitForTimeout(300); };
  const nuovaPartita = async (page) => {
    await page.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click();
    await page.waitForTimeout(300);
  };
  const chiuso = { menu: false, domanda: false, fuoco: 'Menu' };

  // Il menu: Invio e Spazio su «Torna alla partita», Escape.
  for (const tasto of ['Enter', ' ', 'Escape']) {
    const { contesto, page } = await liberaAMeta();
    await scegli(page);
    const prima = await firma(page);
    await apriMenu(page);
    await prova(page, 'menu', tasto, chiuso, prima);
    // Chiuso il menu i tasti tornano alla partita: Escape lascia il pezzo.
    if (tasto === 'Escape') {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
      if ((await stato(page)).scelto) errori.push('R menu: chiuso il menu, Escape non lascia piu\' il pezzo');
    }
    await contesto.close();
  }

  // La domanda sopra il menu: Escape chiude solo la domanda; Invio e Spazio su «Riprendi la
  // partita» chiudono tutte e due e il fuoco va su «Menu» (O1).
  for (const tasto of ['Escape', 'Enter', ' ']) {
    const { contesto, page } = await liberaAMeta();
    await scegli(page);
    const prima = await firma(page);
    await apriMenu(page);
    await nuovaPartita(page);
    if (!(await stato(page)).domanda) { errori.push('R domanda sopra il menu: «Nuova partita» non apre la domanda, il caso non prova niente'); await contesto.close(); continue; }
    const atteso = tasto === 'Escape'
      ? { menu: true, domanda: false, fuoco: 'menu: Nuova partita' }
      : chiuso;
    await prova(page, 'domanda sopra il menu', tasto, atteso, prima);
    await contesto.close();
  }

  // «Riprova» del livello: la domanda sopra la partita, col menu gia' chiuso.
  for (const tasto of ['Enter', 'Escape']) {
    const { contesto, page } = await prepara();
    await apriLivello1DallaMappa(page);
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.waitForTimeout(300);
    await scegli(page);
    const prima = await firma(page);
    await apriMenu(page);
    await page.locator('.pl-menu').getByRole('button', { name: /^Riprova$/ }).click();
    await page.waitForTimeout(300);
    if (!(await stato(page)).domanda) { errori.push('R Riprova: la domanda non si apre, il caso non prova niente'); await contesto.close(); continue; }
    await prova(page, 'Riprova', tasto, chiuso, prima);
    await contesto.close();
  }

  // A menu chiuso, solo tastiera, come prima: Tab fino al primo pezzo, Invio lo sceglie, Invio
  // lo posa al centro (la griglia e' vuota: entra sempre); poi Escape lascia il secondo.
  {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    const prima = await firma(page);
    await page.locator('.pl-tray .pl-pezzo-presa').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    const preso = (await stato(page)).scelto;
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const dopo = await firma(page);
    if (!preso) errori.push('R tastiera: Invio sul pezzo non lo sceglie');
    else if (dopo === prima) errori.push('R tastiera: a menu chiuso Invio non posa il pezzo');
    await page.locator('.pl-tray .pl-pezzo-presa').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    if ((await stato(page)).scelto) errori.push('R tastiera: a menu chiuso Escape non lascia il pezzo');
    note.push(`tastiera a menu chiuso: ${dopo !== prima ? 'pezzo posato' : 'NON POSATO'}`);
    await contesto.close();
  }
  righe.push({ caso: 'R i tasti della partita sotto il velo', primo: '-', daZero: false, nota: note.join('; ') });
}

// ---------- S, T, U ----------
// La tastiera fuori dal vassoio, il pannello degli attrezzi e il cambio di partita
// (collaudo 1.21.22; PO-027, PO-028, PO-029). Il pezzo si sceglie con la tastiera (fuoco sul
// pezzo, Invio), cosi' c'e' anche il cursore, che si porta in cima con quattro frecce.
{
  const stato = (page) => page.evaluate(() => {
    const a = document.activeElement;
    let fuoco = '<body>';
    if (a && a !== document.body) {
      const nome = (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().replace(/\s+/g, ' ');
      fuoco = a.closest('.pl-menu') ? `menu: ${nome}`
        : a.closest('.pl-attrezzi__pannello') ? `pannello: ${nome}`
          : a.classList.contains('pl-attrezzi__pastiglia') ? 'pastiglia' : nome;
    }
    return {
      scelto: !!document.querySelector('.pl-tray__posto--selezionato'),
      cursore: !!document.querySelector('.pl-plancia .pl-cella--cursore'),
      menu: !!document.querySelector('.pl-menu'),
      pannello: !!document.querySelector('.pl-attrezzi__pannello'),
      sfida: !!document.querySelector('.pl-modalita--sfida'),
      fuoco,
    };
  });
  // Questi casi avevano una firma loro, che contava i blocchi ma leggeva l'obiettivo da
  // `.pl-barra-obiettivo`, una classe che non esiste (la barra e' `.pl-obiettivo`): le MOSSE
  // non c'entravano (PO-031). Adesso e' la `firma` di sopra.
  const firmaPiena = firma;
  async function scegliDaTastiera(page, posto = 0) {
    await page.locator('.pl-tray .pl-pezzo-presa').nth(posto).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    for (let i = 0; i < 4; i += 1) await page.keyboard.press('ArrowUp');
    await page.waitForTimeout(150);
  }
  async function libera(mosse) {
    const { contesto, page } = await prepara();
    await page.getByRole('button', { name: /^Partita libera/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    for (let i = 0; i < mosse; i += 1) await unaMossa(page);
    await page.waitForTimeout(300);
    return { contesto, page };
  }
  // Il livello 13 con dodici livelli fatti e tre gettoni: la pastiglia c'e'.
  async function livello13() {
    const contesto = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
    const page = await contesto.newPage();
    page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
    await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: 'it', animazioni: false }));
      const v = {};
      for (let k = 1; k <= 12; k += 1) v[k] = { mosse: 12, punteggio: 300, tentativi: 1 };
      window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: v }));
      window.localStorage.setItem('plinto:attrezzi', JSON.stringify({ versione: 1, disponibili: 3, riscossi: 2 }));
    });
    await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    const tappa = page.locator('.pl-tappa').nth(12);
    await tappa.scrollIntoViewIfNeeded();
    await tappa.click();
    await page.waitForTimeout(300);
    if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await page.waitForTimeout(300);
    return { contesto, page };
  }
  const nome = { Enter: 'Invio', ' ': 'Spazio', ArrowRight: 'freccia destra', p: 'P', Escape: 'Escape' };
  const note = [];

  // S: Tab vero fino a «Menu» (dal pezzo scelto), poi Invio o Spazio: si apre il menu.
  for (const tasto of ['Enter', ' ']) {
    const { contesto, page } = await libera(2);
    await scegliDaTastiera(page);
    let tab = 0;
    while (tab < 30 && !(await page.evaluate(() => document.activeElement?.classList.contains('pl-hud__menu')))) {
      await page.keyboard.press('Tab');
      tab += 1;
    }
    const prima = await firmaPiena(page);
    const s0 = await stato(page);
    const tag = `S «Menu», ${nome[tasto]}`;
    if (s0.fuoco !== 'Menu' || !s0.scelto) {
      errori.push(`${tag}: dopo ${tab} Tab il fuoco e' su «${s0.fuoco}», pezzo ${s0.scelto ? '' : 'non '}scelto: il caso non prova niente`);
      await contesto.close();
      continue;
    }
    await page.keyboard.press(tasto);
    await page.waitForTimeout(400);
    const s = await stato(page);
    const dopo = await firmaPiena(page);
    if (dopo !== prima) errori.push(`${tag}: il pezzo e' stato posato invece di premere «Menu» ("${prima}" -> "${dopo}")`);
    if (!s.menu) errori.push(`${tag}: il menu non si apre`);
    if (!s.scelto) errori.push(`${tag}: il pezzo non e' piu' scelto`);
    note.push(`${tag}: ${s.menu ? 'menu aperto' : 'MENU CHIUSO'}, ${dopo === prima ? 'partita uguale' : 'PEZZO POSATO'}`);
    await contesto.close();
  }
  // S: la pastiglia degli attrezzi, nel livello: Invio apre il pannello e non spende una mossa.
  {
    const { contesto, page } = await livello13();
    await scegliDaTastiera(page);
    await page.locator('.pl-attrezzi__pastiglia').focus();
    const prima = await firmaPiena(page);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const s = await stato(page);
    const dopo = await firmaPiena(page);
    const tag = 'S pastiglia, Invio';
    if (dopo !== prima) errori.push(`${tag}: il pezzo e' stato posato invece di aprire il pannello ("${prima}" -> "${dopo}")`);
    if (!s.pannello) errori.push(`${tag}: il pannello non si apre`);
    note.push(`${tag}: ${s.pannello ? 'pannello aperto' : 'PANNELLO CHIUSO'}, ${dopo === prima ? 'mosse uguali' : 'MOSSA SPESA'}`);
    await contesto.close();
  }
  // S: posare come prima, con il fuoco sul pezzo del vassoio e con il fuoco su <body>.
  for (const doveFuoco of ['vassoio', 'body']) {
    const { contesto, page } = await libera(0);
    await scegliDaTastiera(page);
    if (doveFuoco === 'body') await page.evaluate(() => document.activeElement?.blur());
    const prima = await firmaPiena(page);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const dopo = await firmaPiena(page);
    const s = await stato(page);
    // La griglia e' vuota e il cursore in cima: il pezzo entra sempre.
    if (dopo === prima) errori.push(`S posare con il fuoco su ${doveFuoco}: Invio non posa il pezzo`);
    if (s.menu || s.pannello) errori.push(`S posare con il fuoco su ${doveFuoco}: si e' aperta una finestra`);
    note.push(`posa con fuoco su ${doveFuoco}: ${dopo !== prima ? 'pezzo posato' : 'NON POSATO'}`);
    await contesto.close();
  }

  // T: pannello aperto col clic, pezzo scelto, poi un tasto. Il pezzo resta scelto, il
  // cursore resta dove era, la partita non cambia.
  const attesiPannello = {
    Enter: { pannello: false, fuoco: 'pastiglia' }, // «Torna alla partita»
    ' ': { pannello: false, fuoco: 'pastiglia' },
    ArrowRight: { pannello: true, fuoco: 'pannello: Torna alla partita' },
    p: { pannello: true, fuoco: 'pannello: Torna alla partita' },
    Escape: { pannello: false, fuoco: 'pastiglia' },
  };
  for (const tasto of Object.keys(attesiPannello)) {
    const { contesto, page } = await livello13();
    await scegliDaTastiera(page);
    const cursorePrima = await page.evaluate(() => [...document.querySelectorAll('.pl-plancia .pl-cella')].findIndex((c) => c.className.includes('cursore')));
    await page.locator('.pl-attrezzi__pastiglia').click();
    await page.waitForTimeout(300);
    const s0 = await stato(page);
    const tag = `T pannello, ${nome[tasto]}`;
    if (!s0.pannello || !s0.scelto) { errori.push(`${tag}: pannello ${s0.pannello} pezzo ${s0.scelto}: il caso non prova niente`); await contesto.close(); continue; }
    if (s0.fuoco !== 'pannello: Torna alla partita') errori.push(`T pannello aperto: il fuoco e' su «${s0.fuoco}», non su «Torna alla partita»`);
    const prima = await firmaPiena(page);
    await page.keyboard.press(tasto);
    await page.waitForTimeout(400);
    const s = await stato(page);
    const dopo = await firmaPiena(page);
    const cursoreDopo = await page.evaluate(() => [...document.querySelectorAll('.pl-plancia .pl-cella')].findIndex((c) => c.className.includes('cursore')));
    const atteso = attesiPannello[tasto];
    if (!s.scelto) errori.push(`${tag}: il tasto e' arrivato alla partita sotto il pannello, il pezzo non e' piu' scelto`);
    if (dopo !== prima) errori.push(`${tag}: la partita e' cambiata sotto il pannello ("${prima}" -> "${dopo}")`);
    if (cursoreDopo !== cursorePrima) errori.push(`${tag}: il cursore si e' mosso sotto il pannello (${cursorePrima} -> ${cursoreDopo})`);
    if (s.pannello !== atteso.pannello) errori.push(`${tag}: pannello ${s.pannello ? 'aperto' : 'chiuso'}, atteso ${atteso.pannello ? 'aperto' : 'chiuso'}`);
    if (s.fuoco !== atteso.fuoco) errori.push(`${tag}: il fuoco e' su «${s.fuoco}», non su «${atteso.fuoco}»`);
    note.push(`${tag}: ${s.scelto ? 'pezzo scelto' : 'PEZZO LASCIATO'}, fuoco ${s.fuoco}`);
    await contesto.close();
  }
  // T: come nel collaudo, il fuoco su <body> a pannello aperto (un clic sul pannello lo
  // toglie dal pulsante): Invio e Spazio non devono arrivare alla partita. Senza questo
  // sotto-caso il fuoco sta su «Torna alla partita», e il pulsante preso il tasto basta da
  // solo a nascondere il difetto.
  for (const tasto of ['Enter', ' ']) {
    const { contesto, page } = await livello13();
    await scegliDaTastiera(page);
    await page.locator('.pl-attrezzi__pastiglia').click();
    await page.waitForTimeout(300);
    await page.evaluate(() => document.activeElement?.blur());
    const prima = await firmaPiena(page);
    await page.keyboard.press(tasto);
    await page.waitForTimeout(400);
    const s = await stato(page);
    const dopo = await firmaPiena(page);
    const tag = `T pannello, fuoco <body>, ${nome[tasto]}`;
    if (!s.scelto) errori.push(`${tag}: il tasto e' arrivato alla partita sotto il pannello, il pezzo non e' piu' scelto`);
    if (dopo !== prima) errori.push(`${tag}: la partita e' cambiata sotto il pannello ("${prima}" -> "${dopo}")`);
    if (!s.pannello) errori.push(`${tag}: il pannello si e' chiuso`);
    note.push(`${tag}: ${dopo === prima ? 'partita uguale' : 'PEZZO POSATO'}`);
    await contesto.close();
  }
  // T: senza pezzo, aperto con la tastiera; chiuso col velo il fuoco torna alla pastiglia;
  // dopo una scelta (gessetto) il fuoco non torna alla pastiglia, come prima.
  for (const come of ['velo', 'gessetto']) {
    const { contesto, page } = await livello13();
    await page.locator('.pl-attrezzi__pastiglia').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    const s0 = await stato(page);
    if (s0.fuoco !== 'pannello: Torna alla partita') errori.push(`T aperto con Invio: il fuoco e' su «${s0.fuoco}», non su «Torna alla partita»`);
    if (come === 'velo') await page.mouse.click(5, 5);
    else await page.locator('.pl-attrezzi__pannello').getByRole('button', { name: /gessetto/i }).click();
    await page.waitForTimeout(400);
    const s = await stato(page);
    if (s.pannello) errori.push(`T ${come}: il pannello resta aperto`);
    if (come === 'velo' && s.fuoco !== 'pastiglia') errori.push(`T velo: il fuoco e' su «${s.fuoco}», non sulla pastiglia`);
    if (come === 'gessetto' && s.fuoco === 'pastiglia') errori.push('T gessetto: dopo una scelta il fuoco e\' andato sulla pastiglia');
    note.push(`T ${come}: fuoco ${s.fuoco}`);
    await contesto.close();
  }

  // U: libera a meta', sfida, un pezzo scelto (col clic e con la tastiera), menu -> «Nuova
  // partita» -> «Riprendi la partita». Nella libera niente pezzo scelto e niente cursore.
  for (const via of ['clic', 'tastiera']) {
    const { contesto, page } = await libera(2);
    await page.locator('.pl-hud__menu').click();
    await page.getByRole('button', { name: /^Torna alla home$/ }).click();
    await page.waitForSelector('.pl-home__menu');
    await page.locator('.pl-sfida-avvio--sfida').click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    await unaMossa(page);
    if (via === 'clic') await page.locator('.pl-tray .pl-pezzo-presa').last().click();
    else await scegliDaTastiera(page, 1);
    await page.waitForTimeout(200);
    const s0 = await stato(page);
    const tag = `U sfida -> libera (${via})`;
    if (!s0.sfida || !s0.scelto || (via === 'tastiera' && !s0.cursore)) {
      errori.push(`${tag}: prima della prova sfida ${s0.sfida}, pezzo ${s0.scelto}, cursore ${s0.cursore}: il caso non prova niente`);
      await contesto.close();
      continue;
    }
    await page.locator('.pl-hud__menu').click();
    await page.locator('.pl-menu').getByRole('button', { name: /^Nuova partita$/ }).click();
    await page.waitForTimeout(300);
    if (!(await domanda(page))) { errori.push(`${tag}: manca la domanda`); await contesto.close(); continue; }
    await page.locator('.pl-azzera[role="dialog"]').getByRole('button', { name: /^Riprendi la partita$/ }).click();
    await page.waitForTimeout(500);
    const s = await stato(page);
    if (s.sfida) errori.push(`${tag}: si e' ancora nella sfida`);
    if (s.scelto) errori.push(`${tag}: nella libera c'e' un pezzo scelto che il giocatore non ha scelto`);
    if (s.cursore) errori.push(`${tag}: nella libera c'e' il cursore della sfida`);
    note.push(`${tag}: ${s.scelto ? 'PEZZO SCELTO' : 'nessun pezzo scelto'}, ${s.cursore ? 'CURSORE' : 'nessun cursore'}`);
    await contesto.close();
  }
  righe.push({ caso: 'S, T, U tastiera fuori dal vassoio, pannello, cambio di partita', primo: '-', daZero: false, nota: note.join('; ') });

  // W: mensola, carriola e scambio con un pezzo scelto con la tastiera (collaudo 1.21.23, D1,
  // O1, O2; PO-032). Si sceglie il pezzo 1 (cursore in cima), si apre il pannello con Invio
  // sulla pastiglia e si sceglie l'attrezzo con Invio: il pezzo non e' piu' scelto, sulla
  // griglia ne' cursore ne' anteprima (SCELTA_AZZERATA_CON_L_ATTREZZO). Poi Invio sul pezzo 2
  // del vassoio fa l'attrezzo e non posa il pezzo 1: mosse e caselle occupate uguali. Escape
  // nell'attesa fa quello che fa «Lascia stare» (ESCAPE_LASCIA_STARE). Messo un pezzo da
  // parte o ripreso, il fuoco va su un pezzo del vassoio (FUOCO_SUL_VASSOIO_DOPO_LA_MENSOLA).
  const statoW = (page) => page.evaluate(() => {
    const a = document.activeElement;
    const posti = [...document.querySelectorAll('.pl-tray .pl-tray__posto')];
    const presa = a?.closest?.('.pl-tray .pl-tray__posto');
    return {
      invito: document.querySelector('.pl-attrezzi__invito')?.innerText.replace(/\s+/g, ' ') ?? null,
      mano: document.querySelectorAll('.pl-tray .pl-pezzo-presa').length,
      vuoti: posti.map((p, i) => (p.querySelector('.pl-pezzo-presa') ? null : i)).filter((i) => i !== null),
      mensola: !!document.querySelector('.pl-mensola'),
      cursore: !!document.querySelector('.pl-plancia .pl-cella--cursore'),
      anteprima: document.querySelectorAll('.pl-plancia .pl-cella--anteprima').length,
      forme: posti.map((p) => p.querySelector('.pl-pezzo')?.innerHTML.length ?? 0).join(','),
      fuocoPosto: presa ? posti.indexOf(presa) : null,
      fuoco: a && a !== document.body ? (a.getAttribute('aria-label') || a.textContent || a.tagName).trim().replace(/\s+/g, ' ') : '<body>',
    };
  });
  // La pastiglia c'e' solo fuori dall'attesa: senza, il numero non si legge (null).
  const gettoni = async (page) => ((await page.locator('.pl-attrezzi__pastiglia').count())
    ? page.locator('.pl-attrezzi__posto--pieno').count() : null);
  // Pastiglia (Invio) e voce del pannello (Invio), tutto da tastiera.
  async function attrezzoDaTastiera(page, voce) {
    await page.locator('.pl-attrezzi__pastiglia').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    await page.locator('.pl-attrezzi__pannello').getByRole('button', { name: new RegExp(voce) }).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
  }
  const noteW = [];
  for (const [voce, invito] of [['La mensola', 'Quale pezzo metto da parte?'], ['La carriola', 'Quale pezzo cambio?']]) {
    const { contesto, page } = await livello13();
    const g0 = await gettoni(page);
    await scegliDaTastiera(page);
    await attrezzoDaTastiera(page, voce);
    const s0 = await statoW(page);
    const tag = `W ${voce}`;
    if (!s0.invito?.startsWith(invito)) { errori.push(`${tag}: manca «${invito}» (${s0.invito}), il caso non prova niente`); await contesto.close(); continue; }
    if (s0.cursore || s0.anteprima) errori.push(`${tag} in attesa: sulla griglia restano ${s0.cursore ? 'il cursore e ' : ''}${s0.anteprima} caselle di anteprima del pezzo scelto prima`);
    const prima = await firmaPiena(page);
    await page.locator('.pl-tray .pl-pezzo-presa').nth(1).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
    const s = await statoW(page);
    const dopo = await firmaPiena(page);
    const g = await gettoni(page);
    if (dopo !== prima) errori.push(`${tag}, Invio sul pezzo 2: il pezzo scelto prima e' stato posato ("${prima}" -> "${dopo}")`);
    if (s.invito) errori.push(`${tag}, Invio sul pezzo 2: la domanda resta («${s.invito}»)`);
    if (g !== null && g !== g0 - 1) errori.push(`${tag}, Invio sul pezzo 2: gettoni ${g0} -> ${g}, atteso ${g0 - 1}`);
    if (voce === 'La mensola') {
      if (!s.mensola || s.mano !== 2) errori.push(`${tag}, Invio sul pezzo 2: mensola ${s.mensola ? 'piena' : 'vuota'}, mano ${s.mano}: il pezzo non e' stato messo da parte`);
      // Il pezzo 2 e' andato via: i vicini sono il pezzo 1 e il pezzo 3, a un posto di
      // distanza tutti e due; si va avanti (il 3), come quando si toglie una voce da un elenco.
      if (s.fuocoPosto !== 2) errori.push(`${tag}, Invio sul pezzo 2: il fuoco e' su «${s.fuoco}», non sul pezzo 3 del vassoio`);
    } else if (s.forme === s0.forme) errori.push(`${tag}, Invio sul pezzo 2: il pezzo non e' cambiato`);
    noteW.push(`${tag}: ${dopo === prima ? 'mosse uguali' : 'PEZZO POSATO'}, gettoni ${g0} -> ${g}, fuoco ${s.fuoco}`);

    await contesto.close();
  }
  // W: la mensola piena e la mano piena, lo scambio. Il pezzo 1 va sulla mensola SENZA un pezzo
  // scelto (cosi' la preparazione non dipende dalla correzione), si posano i due che restano e
  // la mano si riempie; poi pezzo 1 scelto con la tastiera, Invio sulla mensola, Invio sul 3.
  {
    const { contesto, page } = await livello13();
    await attrezzoDaTastiera(page, 'La mensola');
    await page.locator('.pl-tray .pl-pezzo-presa').nth(0).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    for (let i = 0; i < 2; i += 1) await unaMossa(page);
    await page.waitForTimeout(300);
    await scegliDaTastiera(page);
    await page.locator('.pl-mensola').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);
    const t0 = await statoW(page);
    const tagS = 'W scambio (mensola e mano piene)';
    if (!t0.invito?.startsWith('La mano è piena') || t0.mano !== 3) {
      errori.push(`${tagS}: domanda «${t0.invito}», mano ${t0.mano}: il caso non prova niente`);
    } else {
      if (t0.cursore || t0.anteprima) errori.push(`${tagS} in attesa: sulla griglia restano ${t0.cursore ? 'il cursore e ' : ''}${t0.anteprima} caselle di anteprima`);
      const primaS = await firmaPiena(page);
      await page.locator('.pl-tray .pl-pezzo-presa').nth(2).focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      const t = await statoW(page);
      const dopoS = await firmaPiena(page);
      if (dopoS !== primaS) errori.push(`${tagS}, Invio sul pezzo 3: il pezzo scelto prima e' stato posato ("${primaS}" -> "${dopoS}")`);
      if (t.invito) errori.push(`${tagS}, Invio sul pezzo 3: la domanda resta («${t.invito}»)`);
      if (t.forme === t0.forme) errori.push(`${tagS}, Invio sul pezzo 3: niente scambio`);
      // Lo scambio mette il pezzo della mensola nel posto 3: il fuoco va li'.
      if (t.fuocoPosto !== 2) errori.push(`${tagS}, Invio sul pezzo 3: il fuoco e' su «${t.fuoco}», non sul pezzo ripreso (posto 3)`);
      noteW.push(`${tagS}: ${dopoS === primaS ? 'mosse uguali' : 'PEZZO POSATO'}, fuoco ${t.fuoco}`);
    }
    await contesto.close();
  }
  // W: ripreso dalla mensola con un posto libero nella mano, il fuoco va sul pezzo ripreso.
  {
    const { contesto, page } = await livello13();
    await attrezzoDaTastiera(page, 'La mensola');
    await page.locator('.pl-tray .pl-pezzo-presa').nth(0).focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const s0 = await statoW(page);
    await page.locator('.pl-mensola').focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    const s = await statoW(page);
    const tag = 'W riprendi dalla mensola';
    if (!s0.mensola || s0.vuoti.length !== 1) errori.push(`${tag}: mensola ${s0.mensola}, posti vuoti ${s0.vuoti}: il caso non prova niente`);
    else {
      if (s.mensola || s.mano !== 3) errori.push(`${tag}: il pezzo non e' tornato nella mano`);
      if (s.fuocoPosto !== s0.vuoti[0]) errori.push(`${tag}: il fuoco e' su «${s.fuoco}», non sul pezzo ripreso (posto ${s0.vuoti[0] + 1})`);
    }
    noteW.push(`${tag}: fuoco ${s.fuoco}`);
    await contesto.close();
  }
  // W: Escape nell'attesa fa quello che fa «Lascia stare»: la domanda sparisce, la partita e i
  // gettoni restano. Anche con un pezzo scelto prima (che l'attrezzo ha gia' lasciato).
  for (const [voce, conPezzo] of [['La mensola', false], ['La carriola', false], ['La mensola', true], ['Il piccone', false]]) {
    const { contesto, page } = await livello13();
    const g0 = await gettoni(page);
    if (conPezzo) await scegliDaTastiera(page);
    await attrezzoDaTastiera(page, voce);
    const s0 = await statoW(page);
    const prima = await firmaPiena(page);
    const tag = `W Escape nell'attesa (${voce}${conPezzo ? ', pezzo scelto prima' : ''})`;
    if (!s0.invito) { errori.push(`${tag}: manca la domanda, il caso non prova niente`); await contesto.close(); continue; }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const s = await statoW(page);
    const dopo = await firmaPiena(page);
    const g = await gettoni(page);
    if (s.invito) errori.push(`${tag}: la domanda resta («${s.invito}»)`);
    if (dopo !== prima) errori.push(`${tag}: la partita e' cambiata ("${prima}" -> "${dopo}")`);
    if (g !== null && g !== g0) errori.push(`${tag}: gettoni ${g0} -> ${g}`);
    noteW.push(`${tag}: ${s.invito ? 'DOMANDA RESTA' : 'domanda chiusa'}, fuoco ${s.fuoco}`);
    await contesto.close();
  }
  righe.push({ caso: 'W mensola, carriola e scambio con la tastiera', primo: '-', daZero: false, nota: noteW.join('; ') });
}

// ---------- V ----------
// La firma deve saper fallire (PO-031). Una partita libera con due mosse; si cambia SOLO la
// griglia salvata (una casella libera diventa occupata, punteggio e mosse uguali) e si
// ricarica: la partita che riapre e' un'altra, e la firma lo deve dire. Con la firma di
// prima, che contava la classe `piena`, le due firme erano uguali e il caso era rosso.
{
  const { contesto, page } = await prepara();
  await page.getByRole('button', { name: /^Partita libera/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  for (let i = 0; i < 2; i += 1) await unaMossa(page);
  await page.waitForTimeout(500);
  const prima = await firma(page);
  const cambiata = await page.evaluate(() => {
    const salvata = JSON.parse(localStorage.getItem('plinto:partita') ?? 'null');
    const libera = salvata?.grid?.findIndex((v) => v === 0) ?? -1;
    if (libera < 0) return false;
    salvata.grid[libera] = 2;
    localStorage.setItem('plinto:partita', JSON.stringify(salvata));
    return true;
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);
  const dopo = await firma(page);
  const punti = (f) => f.split(' / ')[0];
  if (!cambiata) errori.push('V: nessuna casella libera nella partita salvata, il caso non prova niente');
  else if (punti(prima) !== punti(dopo)) errori.push(`V: e' cambiato anche il punteggio ("${prima}" -> "${dopo}"), il caso non prova la griglia`);
  else if (prima === dopo) errori.push(`V: la firma non vede una griglia diversa con lo stesso punteggio ("${prima}")`);
  righe.push({ caso: 'V la firma vede una griglia diversa con lo stesso punteggio', primo: await dove(page), daZero: false, nota: `"${prima}" -> "${dopo}"` });
  await contesto.close();
}

await browser.close();
if (server) server.kill();

console.log('\n| Caso | Dove si riapre | Riparte da 0 | Nota |\n|---|---|---|---|');
for (const r of righe) console.log(`| ${r.caso} | ${r.primo} | ${r.daZero ? 'SI' : 'no'} | ${r.nota} |`);

console.log(`\nMosse di unaMossa: ${mosseTentate} tentate, ${mosseRitentate} ritentate, ${mosseMancate.length} non fatte.`);
if (mosseMancate.length) {
  errori.push(`unaMossa: ${mosseMancate.length} mosse non fatte (${[...new Set(mosseMancate)].join('; ')})`);
}
if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log('\nTutto a posto.');
