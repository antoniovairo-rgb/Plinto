/**
 * PLINTO su tablet e PC: lo stesso gioco, misurato dove nessun'altra prova guarda.
 *
 * PERCHE' ESISTE (PO-014). Tutti gli altri scenari aprono il gioco in una finestra da
 * telefono, da 360x640 a 420x900. Sopra i 720 px per lato pero' l'app cambia forma: sta
 * in una cornice da telefono centrata (`src/styles/app.css`, "schermi grandi") con la
 * plancia ricalcolata sulla cornice e le barre di scorrimento nascoste; sotto i 720 px di
 * altezza ma larga, sta in una colonna da 430 px. Due difetti di quella cornice li ha
 * trovati il proprietario da Chrome su PC (8 ottobre 2026: plancia tagliata a destra e
 * barre di scorrimento larghe), nessuno una prova. Questo scenario le prova.
 *
 * Su ogni formato si attraversano le schermate che un giocatore vede davvero: home,
 * partita libera (un pezzo trascinato col dito o col mouse e uno appoggiato da tastiera),
 * menu della partita, sfida del giorno, mappa, apertura del livello, livello 1 giocato
 * fino alla fine, come si gioca, statistiche, archivio. Su ognuna:
 *   - nulla tagliato dalla cornice: ogni elemento visibile sta dentro #root (e dentro la
 *     finestra), salvo quelli dentro un contenitore che scorre, che si raggiungono;
 *   - plancia quadrata, intera, dentro la cornice;
 *   - nessuno scorrimento orizzontale;
 *   - nessuno scorrimento verticale dove sul telefono di riferimento non c'e';
 *   - testi non sovrapposti (si misurano i rettangoli dei nodi di testo, non dei box);
 *   - bersagli da toccare di almeno 44 px, sui formati con il tocco; un bersaglio piu'
 *     piccolo anche sul telefono e' un fatto del gioco, non della cornice, e si elenca
 *     a parte senza far fallire;
 *   - zero errori in console.
 *
 * Il riferimento e' un telefono col tocco grande quanto la cornice di ogni formato (vedi
 * `corniceDi`): le altezze di scorrimento e i bersagli si confrontano con li', perche' la
 * domanda di questa prova e' "la cornice rompe qualcosa che sul telefono funziona?", non
 * "il gioco e' perfetto?".
 *
 * Uso: npm run e2e-schermi   (PLINTO_E2E_URL per provare la build: vedi docs/TESTING.md)
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { quadroNumero } from '../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../../src/core/grid.js';
import { createRng } from '../../src/core/rng.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Prima il collegamento stabile delle macchine di sviluppo (collaudo 1.21.25, O6: il
// percorso con il numero di versione cambia a ogni Playwright), poi quello vecchio; se
// nessuno c'e' (CI), decide Playwright.
const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', PERCORSO_NOTO].find((p) => p && existsSync(p));
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-schermi';
await mkdir(OUT, { recursive: true });

/** Sotto questa misura (in px CSS) un bersaglio e' difficile da prendere col dito. */
const BERSAGLIO_MIN = 44;

/*
 * I formati. I tablet si provano due volte: col mouse (un tablet con la tastiera, o una
 * finestra di quelle misure su PC) e col tocco vero, `isMobile` e densita' 2, che e' come
 * il gioco arriva su un iPad o un tablet Android. I PC solo col mouse.
 */
const FORMATI = [
  { nome: 'tablet 768x1024', w: 768, h: 1024, tocco: false },
  { nome: 'tablet 768x1024 tocco', w: 768, h: 1024, tocco: true },
  { nome: 'tablet 1024x768', w: 1024, h: 768, tocco: false },
  { nome: 'tablet 1024x768 tocco', w: 1024, h: 768, tocco: true },
  { nome: 'tablet 1024x1366', w: 1024, h: 1366, tocco: false },
  { nome: 'tablet 1024x1366 tocco', w: 1024, h: 1366, tocco: true },
  { nome: 'tablet 1366x1024', w: 1366, h: 1024, tocco: false },
  { nome: 'tablet 1366x1024 tocco', w: 1366, h: 1024, tocco: true },
  { nome: 'PC 1366x768', w: 1366, h: 768, tocco: false },
  { nome: 'PC 1920x1080', w: 1920, h: 1080, tocco: false },
  { nome: 'PC 1280x720', w: 1280, h: 720, tocco: false },
  // Gli stessi PC con le barre del browser (schede, indirizzo, barra delle applicazioni):
  // la pagina riceve circa 110 px in meno, come i telefoni "con barre" di
  // impaginazione.mjs. Un 1366x768 vero da' una finestra di circa 1366x657, sotto i 720
  // px: li' non c'e' la cornice ma la colonna da 430 px, un ramo che nessuna prova
  // apriva. Le misure esatte dipendono dal browser e dal sistema: Non posso confermarle
  // per ogni macchina, sono un ordine di grandezza.
  { nome: 'PC 1366x768 con barre', w: 1366, h: 657, tocco: false },
  { nome: 'PC 1920x1080 con barre', w: 1920, h: 969, tocco: false },
];

/**
 * Il telefono di riferimento di un formato: quello che ha le misure della SUA cornice.
 *
 * Il primo giro confrontava tutto con un 390x844 e accusava la cornice di far scorrere
 * l'apertura del livello a 1280x720. Falso: la cornice li' e' alta 662 px, e un telefono
 * 430x662 scorre degli stessi 92 px. Non e' la cornice, e' l'altezza. La domanda giusta e'
 * "dentro la cornice succede qualcosa che su un telefono grande come la cornice non
 * succede?", e risponde solo un telefono delle stesse misure. Le formule sono quelle di
 * `src/styles/app.css` (schermi grandi).
 */
function corniceDi({ w, h }) {
  if (w >= 720 && h >= 720) return { w: Math.floor(Math.min(430, 0.92 * w)), h: Math.floor(Math.min(920, 0.92 * h)) };
  if (w >= 720) return { w: 430, h };
  return { w, h };
}
// PLINTO_SCHERMI=1366x768,1280x720 restringe il giro mentre si indaga un difetto.
const FILTRO = process.env.PLINTO_SCHERMI?.split(',').map((s) => s.trim()).filter(Boolean);
const DA_PROVARE = FILTRO ? FORMATI.filter((f) => FILTRO.some((x) => f.nome.includes(x))) : FORMATI;

const errori = [];
const avvisi = [];

/*
 * DITO_CHE_SI_FERMA (collaudo 1.21.25, E1; decisione PO-036). Nel Chromium di prova un
 * tocco dato dopo un trascinamento col dito che si stacca ancora in corsa a volte non
 * produce il `click` (arrivano pointerdown, touchstart, pointerup, touchend; il click no),
 * anche 1,2 s dopo: CI «verifica» 230, «orizzontale 1280x620 / menu: non ci si arriva».
 * Succede uguale su una pagina minima senza PLINTO e sparisce se il dito si ferma prima di
 * staccarsi (`node tools/sonda-tocco.mjs`, misure in
 * docs/sviluppo/RAPPORTO-PO-036.md): e' la prova, non il gioco. Acceso, il dito resta fermo
 * sul punto d'arrivo per 6 movimenti a 50 ms prima del `touchEnd`, come fa un dito vero
 * che appoggia un pezzo. Spento, torna il rosso della CI 230 (intermittente).
 */
const DITO_CHE_SI_FERMA = true;
async function fermaIlDito(cdp, punto) {
  if (!DITO_CHE_SI_FERMA) return;
  for (let i = 0; i < 6; i += 1) {
    await new Promise((r) => setTimeout(r, 50));
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: punto.x, y: punto.y }] });
  }
}

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
  if (!(await serverRisponde())) {
    console.error('Impossibile avviare il server di sviluppo su', INDIRIZZO);
    process.exit(1);
  }
}

// ------------------------------------------------ il livello 1, calcolato in Node ---
// Stessa ricetta di tests/e2e/quadri.mjs: la sequenza vincente si calcola col motore vero
// e si rigioca trascinando. Qui serve solo ad arrivare alla fine del livello in modo
// onesto, cioe' giocando, su ogni formato.
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
/** Copia di tests/e2e/quadri.mjs: piazza sempre senza mai chiudere un gruppo. */
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
const SEQUENZA_1 = sequenzaVincente(quadroNumero(1));
if (!SEQUENZA_1) errori.push('LIVELLO 1: il motore non trova una sequenza vincente, non si puo provare la fine del livello');
const SEQUENZA_1_PERSA = sequenzaPerdente(quadroNumero(1));
if (!SEQUENZA_1_PERSA) errori.push('LIVELLO 1: il motore non trova una sequenza perdente, non si puo provare la sconfitta');

/*
 * I formati "larghi e bassi": quelli dove scatta la fine compatta (stessa formula delle
 * media query di `.pl-fine--compatta-larga` in app.css). Solo su questi si provano anche
 * la fine col solo gettone e la sconfitta (PO-015): altrove quelle regole non valgono, e
 * ogni caso in piu' e' un livello giocato in piu' per formato.
 */
const largoBasso = ({ w, h }) => w >= 720 && h <= 782;

// ------------------------------------------------------------ la misura di una schermata ---
/**
 * Misura nel browser. Restituisce solo numeri e descrizioni: i giudizi si danno in Node,
 * dove c'e' il riferimento del telefono.
 */
function misuraNellaPagina({ minimo }) {
  const root = document.getElementById('root');
  const rr = root.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  // Il riquadro utile e' la cornice, ma mai oltre la finestra.
  const box = {
    l: Math.max(rr.left, 0), t: Math.max(rr.top, 0),
    r: Math.min(rr.right, vw), b: Math.min(rr.bottom, vh),
  };
  const descrivi = (el) => {
    const cls = typeof el.className === 'string' && el.className.trim()
      ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : '';
    const testo = (el.innerText ?? el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 30);
    return `${el.tagName.toLowerCase()}${cls}${testo ? ` «${testo}»` : ''}`;
  };
  const visibile = (el) => {
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none') return false;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      if (getComputedStyle(a).opacity === '0') return false;
    }
    return true;
  };
  const scorre = (s, asse) => /(auto|scroll)/.test(asse === 'x' ? s.overflowX : s.overflowY);
  /** Il primo antenato che ritaglia: se scorre, il contenuto fuori vista si raggiunge. */
  const contenitoreCheScorre = (el) => {
    for (let a = el.parentElement; a && a !== root; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (scorre(s, 'x') || scorre(s, 'y')) return a;
    }
    return null;
  };
  const tutti = [...root.querySelectorAll('*')];
  /*
   * Lo strato in cima: un elemento fisso che copre la finestra e prende i tocchi (il velo
   * del menu, una conferma). Se c'e', testi e bersagli si guardano solo li' dentro:
   * quello che sta sotto e' coperto apposta.
   *
   * Prima si chiedeva a `elementFromPoint` se il testo era quello in vista nel suo
   * punto. Sembrava piu' preciso ed era cieco proprio al difetto cercato: di due testi
   * sovrapposti, quello sotto risultava "coperto" e si scartava, quindi la coppia non
   * veniva mai confrontata. Il sabotaggio di prova (un pulsante spinto sopra l'altro)
   * passava verde.
   */
  const strato = tutti.filter((el) => {
    if (el.closest('[aria-hidden="true"]')) return false;
    const s = getComputedStyle(el);
    if (s.position !== 'fixed' || s.pointerEvents === 'none' || !visibile(el)) return false;
    const r = el.getBoundingClientRect();
    return r.width >= vw * 0.9 && r.height >= vh * 0.9;
  }).at(-1) ?? null;
  const inVista = (el) => !strato || strato.contains(el);
  /** Il rettangolo entro cui un elemento si vede: i suoi antenati che ritagliano. */
  const ritaglioDi = (el) => {
    const q = { l: 0, t: 0, r: vw, b: vh };
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (s.overflowX === 'visible' && s.overflowY === 'visible') continue;
      const r = a.getBoundingClientRect();
      q.l = Math.max(q.l, r.left); q.t = Math.max(q.t, r.top);
      q.r = Math.min(q.r, r.right); q.b = Math.min(q.b, r.bottom);
    }
    return q;
  };
  // Nulla tagliato dalla cornice. Uno strato `position: fixed` (il velo del menu, le
  // finestre di conferma) non e' ritagliato dall'`overflow: hidden` di #root: si vede
  // anche fuori dalla cornice, quindi lo taglia solo la finestra. Il primo giro lo
  // contava come tagliato perche' il velo copre tutto lo schermo: si vede, non manca.
  const inStratoFisso = (el) => {
    for (let a = el; a && a !== root; a = a.parentElement) if (getComputedStyle(a).position === 'fixed') return true;
    return false;
  };
  const finestra = { l: 0, t: 0, r: vw, b: vh };
  const tagliati = [];
  for (const el of tutti) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue;
    if (el.closest('[aria-hidden="true"]')) continue; // decorazioni: sfondi, particelle
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || !visibile(el)) continue;
    if (contenitoreCheScorre(el)) continue;
    const lim = inStratoFisso(el) ? finestra : box;
    const fuori = Math.max(lim.l - r.left, lim.t - r.top, r.right - lim.r, r.bottom - lim.b);
    if (fuori > 1) tagliati.push(`${descrivi(el)} esce di ${Math.round(fuori)}px`);
  }

  // Scorrimenti. Il documento e ogni contenitore che dichiara di scorrere.
  const orizzontali = [];
  const verticali = {};
  const doc = document.scrollingElement;
  if (doc.scrollWidth > vw + 1) orizzontali.push(`documento ${doc.scrollWidth - vw}px`);
  if (doc.scrollHeight > vh + 1) verticali.documento = doc.scrollHeight - vh;
  for (const el of [root, ...tutti]) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || !visibile(el)) continue;
    if (scorre(s, 'x') && el.scrollWidth > el.clientWidth + 1) {
      orizzontali.push(`${descrivi(el)} ${el.scrollWidth - el.clientWidth}px`);
    }
    if (scorre(s, 'y') && el.scrollHeight > el.clientHeight + 1) {
      const chiave = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] || el.tagName : el.tagName;
      verticali[chiave] = Math.max(verticali[chiave] ?? 0, el.scrollHeight - el.clientHeight);
    }
  }

  // La plancia.
  let plancia = null;
  const p = root.querySelector('.pl-plancia');
  if (p) {
    const r = p.getBoundingClientRect();
    const celle = [...p.querySelectorAll('.pl-cella')];
    const celleFuori = celle.filter((c) => {
      const q = c.getBoundingClientRect();
      return q.left < box.l - 1 || q.top < box.t - 1 || q.right > box.r + 1 || q.bottom > box.b + 1;
    }).length;
    plancia = {
      w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10,
      celle: celle.length, celleFuori,
    };
  }

  // Testi sovrapposti: i rettangoli veri delle righe di testo, non i box degli elementi
  // (un paragrafo e' largo quanto la colonna anche se la sua riga e' corta).
  const righe = [];
  const giro = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = giro.nextNode(); n; n = giro.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || !visibile(el) || el.closest('[aria-hidden="true"]') || el.closest('.pl-sr, .sr-only')) continue;
    const intervallo = document.createRange();
    intervallo.selectNodeContents(n);
    const ritaglio = ritaglioDi(el);
    for (const q of intervallo.getClientRects()) {
      // La parte che si vede davvero: una riga scorsa fuori dal suo contenitore non e'
      // sovrapposta a niente. Senza, il paragrafo nascosto sotto «Come fare»
      // nell'apertura del livello risultava "sotto" il pulsante Gioca.
      const r = {
        left: Math.max(q.left, ritaglio.l), top: Math.max(q.top, ritaglio.t),
        right: Math.min(q.right, ritaglio.r), bottom: Math.min(q.bottom, ritaglio.b),
      };
      r.width = r.right - r.left; r.height = r.bottom - r.top;
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      if (!inVista(el)) continue;
      righe.push({ el, r, testo: n.textContent.trim().slice(0, 24) });
    }
  }
  const sovrapposti = [];
  for (let i = 0; i < righe.length; i += 1) {
    for (let j = i + 1; j < righe.length; j += 1) {
      const a = righe[i], b = righe[j];
      if (a.el === b.el) continue;
      const lx = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const ly = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      // 2 px di tolleranza: le righe contigue con interlinea stretta si sfiorano.
      if (lx > 2 && ly > 2) sovrapposti.push(`«${a.testo}» su «${b.testo}» (${Math.round(lx)}x${Math.round(ly)}px)`);
    }
  }

  // Bersagli da toccare.
  const piccoli = [];
  for (const el of root.querySelectorAll('button, a[href], [role="button"], input:not([type="hidden"]), select, summary')) {
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || !visibile(el)) continue;
    if (r.bottom < 0 || r.top > vh) continue;
    if (!inVista(el)) continue;
    const lato = Math.min(r.width, r.height);
    if (lato < minimo) piccoli.push({ chi: descrivi(el), lato: Math.round(lato) });
  }

  return {
    cornice: { w: Math.round(rr.width), h: Math.round(rr.height) },
    tagliati, orizzontali, verticali, plancia, sovrapposti, piccoli,
  };
}

// ------------------------------------------------------------------ un formato intero ---
const tabella = {}; // formato -> schermata -> esito
const riferimenti = {}; // "430x706" -> schermata -> misura sul telefono di quelle misure

async function provaFormato(formato, { eRiferimento = false } = {}) {
  const cornice = corniceDi(formato);
  const riferimento = (riferimenti[`${cornice.w}x${cornice.h}`] ??= {});
  const contesto = await browser.newContext({
    viewport: { width: formato.w, height: formato.h },
    deviceScaleFactor: formato.tocco ? 2 : 1,
    hasTouch: formato.tocco,
    isMobile: formato.tocco,
    locale: 'it-IT',
  });
  const page = await contesto.newPage();
  const erroriConsole = [];
  page.on('console', (m) => { if (m.type() === 'error') erroriConsole.push(m.text()); });
  page.on('pageerror', (e) => erroriConsole.push(e.message));
  const riga = (tabella[formato.nome] = {});
  const sigla = formato.nome.replace(/[^a-z0-9]+/gi, '-');
  const difetto = (schermata, testo) => {
    errori.push(`${formato.nome} / ${schermata}: ${testo}`);
    riga[schermata] = riga[schermata] === 'ok' || !riga[schermata] ? 'NO' : riga[schermata];
  };

  async function misura(schermata) {
    await page.waitForTimeout(250);
    const m = await page.evaluate(misuraNellaPagina, { minimo: BERSAGLIO_MIN });
    await page.screenshot({ path: `${OUT}/${sigla}-${schermata}.png` });
    riga[schermata] = riga[schermata] ?? 'ok';
    if (eRiferimento) { riferimento[schermata] = m; return m; }
    for (const t of m.tagliati.slice(0, 4)) difetto(schermata, `tagliato dalla cornice: ${t}`);
    if (m.tagliati.length > 4) difetto(schermata, `... e altri ${m.tagliati.length - 4} elementi tagliati`);
    for (const o of m.orizzontali) difetto(schermata, `scorrimento orizzontale: ${o}`);
    // La fine del livello non scorre su nessun PC o tablet provato, a prescindere dal
    // telefono di riferimento: la richiesta del proprietario arriva al portatile da
    // 1366x768, e con le barre del browser quel portatile e' sotto i 720 px (PO-014, P1).
    const rif = schermata.startsWith('fine-') ? {} : (riferimento[schermata]?.verticali ?? {});
    for (const [dove, px] of Object.entries(m.verticali)) {
      // 1 px di tolleranza: la cornice e' alta 706,56 px, il telefono di prova 706.
      if (px > (rif[dove] ?? 0) + 1) {
        difetto(schermata, `scorre in verticale di ${px}px (${dove}) mentre un telefono ${cornice.w}x${cornice.h} ${rif[dove] ? `scorre di ${rif[dove]}px` : 'non scorre'}`);
      }
    }
    if (m.plancia) {
      const { w, h, celle, celleFuori } = m.plancia;
      if (Math.abs(w - h) > 1) difetto(schermata, `plancia non quadrata: ${w}x${h}`);
      if (celle !== 81 || celleFuori > 0) difetto(schermata, `plancia non intera: ${celle} caselle, ${celleFuori} fuori dalla cornice`);
    }
    for (const s of m.sovrapposti) difetto(schermata, `testi sovrapposti: ${s}`);
    if (formato.tocco) {
      const giaSulTelefono = new Set((riferimento[schermata]?.piccoli ?? []).map((x) => x.chi.replace(/«.*»/, '')));
      for (const b of m.piccoli) {
        const chiave = b.chi.replace(/«.*»/, '');
        if (giaSulTelefono.has(chiave)) avvisi.push(`${formato.nome} / ${schermata}: ${b.chi} misura ${b.lato}px (identico sul telefono)`);
        else difetto(schermata, `bersaglio di ${b.lato}px: ${b.chi}`);
      }
    }
    return m;
  }

  // Un pezzo appoggiato si riconosce dal VASSOIO, che ne ha uno in meno, non dalle
  // caselle piene: la partita libera parte con la griglia gia' seminata e una mossa che
  // chiude un gruppo ne svuota piu' di quante ne riempie. Contando le caselle, il primo
  // giro ha scambiato una «Griglia pulita!» per un pezzo che non si appoggia.
  const pezziInMano = () => page.locator('.pl-tray .pl-pezzo').count();

  /** Torna alla home con uno stato noto: niente ripresa automatica, niente guida. */
  async function home() {
    await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem('plinto:settings', JSON.stringify({
        introVista: true, tema: 'scuro', lingua: 'it',
        audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
      }));
      window.localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.pl-home__azioni');
  }

  /** Dove sta il primo pezzo e il centro della plancia. */
  const geometria = () => page.evaluate(() => {
    const pezzo = document.querySelector('.pl-tray .pl-pezzo');
    const r = pezzo.getBoundingClientRect();
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const c = celle[4 * 9 + 4].getBoundingClientRect();
    return { px: r.left + r.width / 2, py: r.top + r.height / 2, cx: c.left + c.width / 2, cy: c.top + c.height / 2, cella: c.width };
  });

  /** Trascina col dito vero (eventi touch del protocollo, non simulati in pagina). */
  async function trascinaColDito(da, a) {
    const cdp = await contesto.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: da.x, y: da.y }] });
    for (let i = 1; i <= 12; i += 1) {
      const x = da.x + ((a.x - da.x) * i) / 12, y = da.y + ((a.y - da.y) * i) / 12;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    const anteprima = await page.locator('.pl-cella--anteprima').count();
    await fermaIlDito(cdp, a);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    return anteprima;
  }

  /**
   * Un passo che non riesce (un pulsante che non si trova, che non si puo' premere) e'
   * un difetto di quella schermata, non la fine della prova: si scrive e si va avanti,
   * cosi' il verdetto arriva sempre. Senza, il sabotaggio che spingeva una voce del menu
   * sopra l'altra faceva cadere lo script a meta', senza tabella e senza elenco.
   */
  async function passo(schermata, fn) {
    try { await fn(); }
    catch (e) { difetto(schermata, `non ci si arriva: ${String(e.message).split('\n')[0].slice(0, 140)}`); }
  }
  page.setDefaultTimeout(8000);

  /** Rigioca una sequenza calcolata in Node trascinando col mouse, fino all'esito. */
  async function giocaSequenza(sequenza, schermata) {
    for (const mossa of sequenza) {
      const punti = await page.evaluate(({ handIndex, row, col }) => {
        const pezzo = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex]?.querySelector('.pl-pezzo');
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
      if (!punti) { difetto(schermata, 'pezzo non trovato durante la partita'); break; }
      await page.mouse.move(punti.px, punti.py);
      await page.mouse.down();
      await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(60);
      if (await page.locator('.pl-quadro-esito, .pl-pausa-fine').count() > 0) break;
    }
    // PO-038: l'esito arriva dopo la pausa sulla plancia finale: si aspetta l'elemento.
    await page.waitForSelector('.pl-quadro-esito', { timeout: 6000 }).catch(() => {});
  }

  /** Scrive i progressi (numero -> dati del livello) e apre il livello 1 dalla mappa. */
  async function apriLivello1(livelli) {
    const pieni = Object.fromEntries(Object.keys(livelli).map((n) => [n, { mosse: 12, punteggio: 300, tentativi: 1, ...livelli[n] }]));
    await page.evaluate((liv) => {
      window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: liv }));
    }, pieni);
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    await page.locator('.pl-tappa').nth(0).click();
    await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForSelector('.pl-plancia .pl-cella');
  }

  // --- home
  await passo('home', async () => {
    await home();
    await misura('home');
  });

  // --- partita libera: un pezzo col puntatore, uno da tastiera
  await passo('libera', async () => {
    await page.getByRole('button', { name: /^(Partita libera|Riprendi la partita)(,|$)/ }).click();
    await page.waitForSelector('.pl-plancia');
    await misura('libera');
    {
      const g = await geometria();
      const prima = await pezziInMano();
      let anteprima;
      if (formato.tocco) {
        // Col dito il pezzo si disegna 1,35 caselle sopra il dito (useTrascinamento.js):
        // per appoggiarlo al centro il dito va altrettanto piu' in basso.
        anteprima = await trascinaColDito({ x: g.px, y: g.py }, { x: g.cx, y: g.cy + 1.35 * g.cella });
      } else {
        await page.mouse.move(g.px, g.py);
        await page.mouse.down();
        await page.mouse.move(g.cx, g.cy, { steps: 12 });
        anteprima = await page.locator('.pl-cella--anteprima').count();
        await page.mouse.up();
      }
      await page.waitForTimeout(200);
      const dopo = await pezziInMano();
      const come = formato.tocco ? 'col dito' : 'col mouse';
      riga['trascina'] = dopo < prima && anteprima > 0 ? 'ok' : 'NO';
      if (!eRiferimento && dopo >= prima) difetto('trascina', `${come}: il pezzo non si appoggia (pezzi in mano ${prima} -> ${dopo}, caselle in anteprima ${anteprima}, presa ${Math.round(g.px)},${Math.round(g.py)} -> ${Math.round(g.cx)},${Math.round(g.cy)})`);
      if (!eRiferimento && anteprima === 0) difetto('trascina', `${come}: nessuna anteprima durante il trascinamento`);
      if (eRiferimento && dopo >= prima) errori.push(`${formato.nome}: il trascinamento ${come} non funziona nemmeno sul telefono: la prova e' rotta`);
    }
    {
      const prima = await pezziInMano();
      await page.locator('body').click({ position: { x: 1, y: 1 } }).catch(() => {});
      let nelVassoio = false;
      for (let i = 0; i < 40 && !nelVassoio; i += 1) {
        await page.keyboard.press('Tab');
        nelVassoio = await page.evaluate(() => !!document.activeElement?.closest('.pl-tray'));
      }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(80);
      const cursore = await page.locator('.pl-cella--cursore').count();
      // Nell'angolo in alto a sinistra: il centro e' occupato dal pezzo appena trascinato,
      // e un Invio su caselle piene non appoggia niente per regola, non per difetto. Il
      // primo giro lo ha scambiato per un difetto su quattro formati su dodici.
      for (let i = 0; i < 4; i += 1) { await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowLeft'); }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(200);
      const dopo = await pezziInMano();
      riga['tastiera'] = nelVassoio && cursore === 1 && dopo < prima ? 'ok' : 'NO';
      if (!nelVassoio) difetto('tastiera', 'con Tab non si arriva ai pezzi');
      else if (cursore !== 1) difetto('tastiera', 'il cursore non compare sulla griglia dopo aver preso il pezzo');
      else if (dopo >= prima) difetto('tastiera', `Invio non appoggia il pezzo (pezzi in mano ${prima} -> ${dopo})`);
      await misura('libera-dopo');
    }
  });

  // --- menu della partita
  await passo('menu', async () => {
    await page.locator('.pl-hud__menu').click();
    await page.waitForSelector('.pl-menu');
    await misura('menu');
  });

  // --- sfida del giorno
  await passo('sfida', async () => {
    await home();
    await page.getByRole('button', { name: /^(Sfida del giorno|Riprendi la sfida)/ }).click();
    await page.waitForSelector('.pl-plancia');
    await misura('sfida');
  });

  // --- mappa dei livelli
  await passo('mappa', async () => {
    await home();
    await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
    await page.waitForSelector('.pl-tappe');
    await misura('mappa');
  });

  // --- livello 1: apertura, partita, fine
  await passo('livello', async () => {
    await home();
    await page.locator('.pl-home__azioni .pl-btn--primario').click();
    await page.waitForSelector('.pl-apertura');
    await misura('apertura');
    await page.getByRole('button', { name: /^Gioca$/ }).click();
    await page.waitForSelector('.pl-plancia');
    await misura('livello');
    if (SEQUENZA_1) {
      await giocaSequenza(SEQUENZA_1, 'fine-livello');
      const esito = await page.locator('.pl-quadro-esito').innerText({ timeout: 3000 }).catch(() => '');
      if (!/superato/i.test(esito)) difetto('fine-livello', `il livello 1 giocato non risulta superato (esito: «${esito.trim()}»)`);
      else {
        await page.waitForTimeout(1200);
        await misura('fine-livello');
      }
    }
  });

  // --- PO-015, solo sui formati larghi e bassi e non sul telefono di riferimento.
  if (!eRiferimento && largoBasso(formato)) {
    // La fine col solo gettone (livelli 2-5 gia' superati, si vince l'1: quinto livello
    // superato, gettone, atto ancora aperto). Scorreva di 16 px a 1366x768 e 1024x768, 61
    // a 1280x720, 66 a 1366x657 (collaudo 1.21.15, E1): la richiesta del proprietario
    // arriva al portatile da 1366x768, e la stessa regola della fine normale vale qui.
    await passo('fine-gettone', async () => {
      await home();
      await apriLivello1({ 2: {}, 3: {}, 4: {}, 5: {} });
      if (!SEQUENZA_1) return;
      await giocaSequenza(SEQUENZA_1, 'fine-gettone');
      await page.waitForTimeout(1200);
      if (await page.locator('.pl-fine__premio').count() !== 1) {
        difetto('fine-gettone', 'il riquadro del gettone non compare: il caso provato e\' un altro');
      } else {
        await misura('fine-gettone');
      }
    });
    // La sconfitta non scorreva neanche nella 1.21.14 e non deve farsi compatta: Plinto
    // dispiaciuto resta grande come sul telefono (92 px, `dimensione` in FineQuadro.jsx).
    // Nella 1.21.15 scendeva a 56 px su questi formati (collaudo 1.21.15, O1).
    await passo('fine-sconfitta', async () => {
      await home();
      await apriLivello1({});
      if (!SEQUENZA_1_PERSA) return;
      await giocaSequenza(SEQUENZA_1_PERSA, 'fine-sconfitta');
      await page.waitForTimeout(600);
      const esito = await page.locator('.pl-quadro-esito').innerText({ timeout: 3000 }).catch(() => '');
      // «Livello non superato»: cercare solo "superato" lo scambia per una vittoria.
      if (!/non superato/i.test(esito)) {
        difetto('fine-sconfitta', `il livello 1 non risulta perso (esito: «${esito.trim()}»)`);
        return;
      }
      await misura('fine-sconfitta');
      const plinto = await page.evaluate(() => {
        const svg = document.querySelector('.pl-fine__plinto svg');
        return svg ? Math.round(svg.getBoundingClientRect().height) : 0;
      });
      if (plinto < 88) difetto('fine-sconfitta', `Plinto dispiaciuto misura ${plinto}px invece di 92: la fine compatta vale solo per la vittoria`);
    });
  }

  // --- come si gioca, statistiche, archivio
  for (const [schermata, nome] of [['come-si-gioca', /^Come si gioca$/], ['statistiche', /^Statistiche$/], ['archivio', /^Archivio delle sfide$/]]) {
    await passo(schermata, async () => {
      await home();
      await page.getByRole('button', { name: nome }).first().click();
      await page.waitForTimeout(300);
      await misura(schermata);
    });
  }

  if (erroriConsole.length) {
    for (const e of erroriConsole.slice(0, 3)) difetto('console', e.slice(0, 160));
    riga.console = 'NO';
  } else riga.console = 'ok';
  await contesto.close();
}

// ------------------------------------------------------- telefono coricato (PO-035) ---
/*
 * IN ORIZZONTALE SI DEVE POTER GIOCARE. Fino alla 1.21.24, con lo schermo coricato e alto
 * fino a 620 px, la griglia della partita libera e della sfida era di 28x28 px e nei
 * livelli le caselle erano 0x0 (rapporto PO-017, E1): il gioco si apriva e rispondeva, ma
 * non si poteva giocare. Nessuna prova apriva il gioco in orizzontale sotto i 720 px di
 * altezza. Qui: i cinque formati della decisione del PO, col tocco vero.
 *
 * LA SOGLIA: il lato della griglia almeno l'85% dell'altezza della finestra. Il disegno
 * scelto ne da' il 97% a 640x360 (348 px su 360); un'impaginazione che lasciasse Catena e
 * riga degli attrezzi sopra e sotto la griglia arriverebbe al massimo al 76% (348 - 23 -
 * 44 - 8 = 273 px, calcolato dalle misure), il difetto all'8%. L'85% separa la griglia a
 * tutta altezza dalle due cose che non lo sono, e lascia 12 punti di margine per i bordi e
 * per le tacche dei telefoni.
 */
const ORIZZONTALI = [[640, 360], [800, 360], [915, 412], [1024, 600], [1280, 620]]
  .map(([w, h]) => ({ nome: `orizzontale ${w}x${h}`, w, h }));
const LATO_MINIMO = 0.85;

/*
 * CARATTERI AL 200% (PO-035, D1 e O1). Simulazione dichiarata, la stessa del rapporto
 * PO-017: ogni `font-size` dei fogli di stile per due. Come Chrome dentro la TWA applichi la
 * dimensione dei caratteri di Android non posso confermarlo. Con quella simulazione il
 * pannello degli attrezzi superava lo schermo e «Torna alla partita» non si raggiungeva
 * (D1), e la guida e il livello sporgevano di lato (O1, +52 e +35 px a 360x800).
 */
const TESTO_DOPPIO = [[360, 800], [412, 915]].map(([w, h]) => ({ nome: `testo x2 ${w}x${h}`, w, h }));
function scalaTesto(f) {
  const molt = (v) => v.replace(/(-?\d*\.?\d+)px/g, (_, n) => `${(Number(n) * f).toFixed(2)}px`);
  const giro = (regole) => {
    for (const r of regole) {
      if (r.style && r.style.fontSize) r.style.fontSize = molt(r.style.fontSize);
      if (r.style && r.style.font) r.style.font = molt(r.style.font);
      if (r.cssRules) giro(r.cssRules);
    }
  };
  for (const s of document.styleSheets) { try { giro(s.cssRules); } catch { /* foglio di un altro dominio */ } }
  const st = document.createElement('style');
  st.textContent = `html{font-size:${16 * f}px}`;
  document.head.appendChild(st);
}

/** Un contesto col tocco, con il giro di prova gia' pronto: stato noto e misure comuni. */
async function telefono(formato, { testo = 1 } = {}) {
  const contesto = await browser.newContext({
    viewport: { width: formato.w, height: formato.h },
    deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'it-IT',
  });
  const page = await contesto.newPage();
  page.setDefaultTimeout(8000);
  const erroriConsole = [];
  page.on('console', (m) => { if (m.type() === 'error') erroriConsole.push(m.text()); });
  page.on('pageerror', (e) => erroriConsole.push(e.message));
  const riga = (tabella[formato.nome] = {});
  const difetto = (schermata, t) => { errori.push(`${formato.nome} / ${schermata}: ${t}`); riga[schermata] = 'NO'; };
  const bene = (schermata) => { riga[schermata] = riga[schermata] ?? 'ok'; };
  const passo = async (schermata, fn) => {
    try { await fn(); bene(schermata); }
    catch (e) {
      difetto(schermata, `non ci si arriva: ${String(e.message).split('\n')[0].slice(0, 140)}`);
      await page.screenshot({ path: `${OUT}/${formato.nome.replace(/[^a-z0-9]+/gi, '-')}-${schermata}-errore.png` }).catch(() => {});
    }
  };
  /** Stato noto; `guida` lascia la guida al primo avvio, `livelli` e `attrezzi` i progressi. */
  async function apri({ guida = false, livelli = 0, attrezzi = 0 } = {}) {
    await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
    await page.evaluate(({ guida, livelli, attrezzi }) => {
      window.localStorage.clear();
      if (!guida) {
        window.localStorage.setItem('plinto:settings', JSON.stringify({
          introVista: true, tema: 'scuro', lingua: 'it',
          audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
        }));
      }
      const v = {};
      for (let k = 1; k <= livelli; k += 1) v[k] = { mosse: 12, punteggio: 300, tentativi: 1 };
      if (livelli) window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: v }));
      if (attrezzi) window.localStorage.setItem('plinto:attrezzi', JSON.stringify({ versione: 1, disponibili: attrezzi, riscossi: 2 }));
    }, { guida, livelli, attrezzi });
    await page.reload({ waitUntil: 'networkidle' });
    if (testo !== 1) await page.evaluate(scalaTesto, testo);
    await page.waitForSelector(guida ? '.pl-guida__navigazione' : '.pl-home__azioni');
  }
  /** Il livello 13 (ha l'obiettivo, i prossimi tre pezzi e, con i gettoni, gli attrezzi). */
  async function livello13() {
    await apri({ livelli: 12, attrezzi: 2 });
    await page.getByRole('button', { name: /^Mappa dei livelli/ }).tap();
    await page.waitForSelector('.pl-tappe');
    const tappa = page.locator('.pl-tappa').nth(12);
    await tappa.scrollIntoViewIfNeeded();
    await tappa.tap();
    await page.getByRole('button', { name: /^Gioca$/ }).first().tap();
    // `attached` e non `visible`: con il difetto le caselle sono 0x0, Playwright le conta
    // invisibili e l'attesa scadrebbe senza dire quanto e' grande la griglia.
    await page.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
    await page.waitForTimeout(250);
  }
  /** Quanto sporge la pagina, in orizzontale e in verticale. */
  const sporge = () => page.evaluate(() => {
    const d = document.scrollingElement;
    let lato = d.scrollWidth - window.innerWidth;
    // Anche un contenitore che scorre di lato senza che il gioco lo preveda.
    for (const el of document.querySelectorAll('#root *')) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowX) && el.clientWidth > 0) lato = Math.max(lato, el.scrollWidth - el.clientWidth);
    }
    return { x: lato, y: d.scrollHeight - window.innerHeight };
  });
  /**
   * Si raggiunge col dito? Portato in vista (come farebbe chi scorre), deve stare dentro
   * la finestra e il punto al suo centro deve essere suo: non coperto, non ritagliato.
   */
  const raggiungibile = (locator) => locator.evaluate((el) => {
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    if (r.width < 2 || r.height < 2 || x < 0 || y < 0 || x > window.innerWidth || y > window.innerHeight) return false;
    const chi = document.elementFromPoint(x, y);
    return !!chi && (chi === el || el.contains(chi));
  });
  async function trascinaColDito(da, a) {
    const cdp = await contesto.newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: da.x, y: da.y }] });
    for (let i = 1; i <= 12; i += 1) {
      const x = da.x + ((a.x - da.x) * i) / 12, y = da.y + ((a.y - da.y) * i) / 12;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    const anteprima = await page.locator('.pl-cella--anteprima').count();
    await fermaIlDito(cdp, a);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    return anteprima;
  }
  /**
   * Un pezzo preso col dito e appoggiato su una casella vuota della griglia. Si riconosce
   * dal vassoio, che ne ha uno in meno (vedi `pezziInMano` in provaFormato).
   */
  async function appoggiaColDito(schermata) {
    const g = await page.evaluate(() => {
      const pezzi = [...document.querySelectorAll('.pl-tray .pl-tray__posto')];
      const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
      const libera = (i) => celle[i] && !celle[i].querySelector('.pl-blocco');
      for (const posto of pezzi) {
        const pezzo = posto.querySelector('.pl-pezzo');
        if (!pezzo) continue;
        // Le caselle del pezzo sono in ordine di riga (Pezzo.jsx): la larghezza sta nella
        // griglia del pezzo, `repeat(<colonne>, <lato>px)`.
        const colonne = Number(/repeat\((\d+)/.exec(pezzo.style.gridTemplateColumns)?.[1] ?? 1);
        const forma = [...pezzo.children]
          .map((c, i) => ({ r: Math.floor(i / colonne), c: i % colonne, piena: c.querySelector('.pl-blocco') !== null }))
          .filter((x) => x.piena);
        // Il primo posto dove il pezzo intero cade su caselle vuote.
        for (let r0 = 0; r0 < 9; r0 += 1) for (let c0 = 0; c0 < 9; c0 += 1) {
          if (!forma.every(({ r, c }) => r0 + r < 9 && c0 + c < 9 && libera((r0 + r) * 9 + c0 + c))) continue;
          const rp = pezzo.getBoundingClientRect();
          const primo = pezzo.children[0].getBoundingClientRect();
          const c00 = celle[0].getBoundingClientRect();
          const passo = (celle[8].getBoundingClientRect().left - c00.left) / 8;
          const px = rp.left + rp.width / 2, py = rp.top + rp.height / 2;
          const presaX = (px - rp.left) / primo.width, presaY = (py - rp.top) / primo.height;
          return { px, py, cx: c00.left + c0 * passo + presaX * c00.width, cy: c00.top + r0 * passo + presaY * c00.height, cella: c00.width };
        }
      }
      return null;
    });
    if (!g) { difetto(schermata, 'nessun pezzo del vassoio entra nella griglia: la prova non sa dove appoggiarlo'); return; }
    const prima = await page.locator('.pl-tray .pl-pezzo').count();
    // Col dito il pezzo si disegna 1,35 caselle sopra il dito (useTrascinamento.js).
    const anteprima = await trascinaColDito({ x: g.px, y: g.py }, { x: g.cx, y: g.cy + 1.35 * g.cella });
    await page.waitForTimeout(200);
    const dopo = await page.locator('.pl-tray .pl-pezzo').count();
    if (anteprima === 0) difetto(schermata, 'col dito: nessuna anteprima sulla griglia durante il trascinamento');
    if (dopo >= prima) difetto(schermata, `col dito: il pezzo non si appoggia (pezzi in mano ${prima} -> ${dopo}, casella di ${Math.round(g.cella)} px)`);
    // UN SECONDO PRIMA DEL TOCCO SEGUENTE. Nel Chromium di prova un tocco che arriva dopo
    // un trascinamento col dito a volte non produce il `click` (pointerdown e pointerup si',
    // click no; rapporto PO-035). Il secondo da solo non bastava (CI 230, 1280x620): la
    // cura e' il dito che si ferma prima di staccarsi (DITO_CHE_SI_FERMA); l'attesa resta
    // per l'anteprima e le animazioni. Se succeda su un telefono vero non posso confermarlo.
    await page.waitForTimeout(1000);
  }
  async function chiudi() {
    if (erroriConsole.length) for (const e of erroriConsole.slice(0, 3)) difetto('console', e.slice(0, 160));
    else riga.console = 'ok';
    await contesto.close();
  }
  return { page, apri, livello13, sporge, raggiungibile, appoggiaColDito, passo, difetto, chiudi };
}

async function provaOrizzontale(formato) {
  const { page, apri, livello13, sporge, raggiungibile, appoggiaColDito, passo, difetto, chiudi } = await telefono(formato);
  const sigla = formato.nome.replace(/[^a-z0-9]+/gi, '-');
  /** La griglia a tutta altezza, intera, e niente fuori dallo schermo. */
  async function misuraGioco(schermata) {
    await page.waitForTimeout(250);
    const m = await page.evaluate(() => {
      const p = document.querySelector('.pl-plancia').getBoundingClientRect();
      const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
      const vw = window.innerWidth, vh = window.innerHeight;
      const fuori = (r) => r.left < -1 || r.top < -1 || r.right > vw + 1 || r.bottom > vh + 1;
      const celleFuori = celle.filter((c) => fuori(c.getBoundingClientRect())).length;
      const cellaMin = Math.min(...celle.map((c) => c.getBoundingClientRect().width));
      // Ogni comando della schermata di gioco dentro lo schermo: punteggio e menu,
      // obiettivo, attrezzi, «Rimetti a posto il pezzo», i pezzi.
      const comandi = [...document.querySelectorAll('.pl-screen--gioco button, .pl-screen--gioco .pl-tray__posto, .pl-obiettivo')]
        .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1 && fuori(r); })
        .map((el) => `${el.className.split(' ')[0]} «${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 20)}»`);
      return { w: p.width, h: p.height, vh, celle: celle.length, celleFuori, cellaMin, comandi };
    });
    await page.screenshot({ path: `${OUT}/${sigla}-${schermata}.png` });
    const lato = Math.min(m.w, m.h);
    if (lato < LATO_MINIMO * m.vh) difetto(schermata, `griglia di ${Math.round(m.w)}x${Math.round(m.h)} px su ${m.vh} di altezza (${Math.round((100 * lato) / m.vh)}%, minimo ${LATO_MINIMO * 100}%), caselle di ${Math.round(m.cellaMin)} px`);
    if (Math.abs(m.w - m.h) > 1) difetto(schermata, `griglia non quadrata: ${Math.round(m.w)}x${Math.round(m.h)}`);
    if (m.celle !== 81 || m.celleFuori > 0) difetto(schermata, `griglia non intera: ${m.celle} caselle, ${m.celleFuori} fuori dallo schermo`);
    for (const c of m.comandi) difetto(schermata, `fuori dallo schermo: ${c}`);
    const s = await sporge();
    if (s.x > 1) difetto(schermata, `la pagina sporge di lato di ${s.x}px`);
    if (s.y > 1) difetto(schermata, `la schermata di gioco scorre di ${s.y}px`);
  }

  await passo('libera', async () => {
    await apri();
    await page.getByRole('button', { name: /^Partita libera/ }).tap();
    await page.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
    await misuraGioco('libera');
    await appoggiaColDito('libera');
  });
  await passo('menu', async () => {
    await page.locator('.pl-hud__menu').tap();
    await page.waitForSelector('.pl-menu');
    for (const b of await page.locator('.pl-menu button').all()) {
      if (!(await raggiungibile(b))) difetto('menu', `«${(await b.innerText()).trim()}» non si raggiunge`);
    }
    await page.getByRole('button', { name: /^Torna alla partita$/ }).tap();
    await page.waitForSelector('.pl-menu', { state: 'detached' });
  });
  await passo('sfida', async () => {
    await apri();
    await page.getByRole('button', { name: /^Sfida del giorno/ }).tap();
    await page.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
    await misuraGioco('sfida');
    await appoggiaColDito('sfida');
  });
  await passo('livello', async () => {
    await livello13();
    await misuraGioco('livello');
    await appoggiaColDito('livello');
  });
  await passo('attrezzi', async () => {
    const pastiglia = page.locator('.pl-attrezzi__pastiglia');
    if (!(await raggiungibile(pastiglia))) { difetto('attrezzi', 'la pastiglia degli attrezzi non si raggiunge'); return; }
    await pastiglia.tap();
    await page.waitForSelector('.pl-attrezzi__pannello');
    // Il pannello si apre dall'alto, col fuoco su «Torna alla partita» (PANNELLO_DALL_ALTO
    // in src/ui/Attrezzi.jsx): prima, coricato, si apriva gia' scorso in fondo.
    await page.waitForTimeout(150);
    const aperto = await page.evaluate(() => {
      const p = document.querySelector('.pl-attrezzi__pannello');
      return { su: p.scrollTop, corsa: p.scrollHeight - p.clientHeight, fuoco: document.activeElement?.innerText?.trim() ?? '' };
    });
    if (aperto.su > 1) difetto('attrezzi', `il pannello si apre gia' scorso di ${Math.round(aperto.su)} px (corsa ${aperto.corsa} px)`);
    if (aperto.fuoco !== 'Torna alla partita') difetto('attrezzi', `all'apertura il fuoco e' su «${aperto.fuoco.slice(0, 30)}», non su «Torna alla partita»`);
    const torna = page.getByRole('button', { name: /^Torna alla partita$/ });
    if (!(await raggiungibile(torna))) { difetto('attrezzi', '«Torna alla partita» del pannello non si raggiunge'); return; }
    await torna.tap();
    await page.waitForSelector('.pl-attrezzi__pannello', { state: 'detached' });
  });
  await passo('fine-livello', async () => {
    if (!SEQUENZA_1) return;
    await apri();
    await page.locator('.pl-home__azioni .pl-btn--primario').tap();
    await page.getByRole('button', { name: /^Gioca$/ }).tap();
    await page.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
    for (const mossa of SEQUENZA_1) {
      const punti = await page.evaluate(({ handIndex, row, col }) => {
        const pezzo = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex]?.querySelector('.pl-pezzo');
        if (!pezzo) return null;
        const rp = pezzo.getBoundingClientRect();
        const cellaTray = pezzo.firstElementChild.getBoundingClientRect();
        const celle = document.querySelectorAll('.pl-plancia .pl-cella');
        const c0 = celle[0].getBoundingClientRect();
        const passo = (celle[8].getBoundingClientRect().left - c0.left) / 8;
        const px = rp.left + rp.width / 2, py = rp.top + rp.height / 2;
        const presaX = (px - rp.left) / cellaTray.width, presaY = (py - rp.top) / cellaTray.height;
        return { px, py, cx: c0.left + col * passo + presaX * c0.width, cy: c0.top + row * passo + presaY * c0.height };
      }, mossa);
      if (!punti) break;
      await page.mouse.move(punti.px, punti.py);
      await page.mouse.down();
      await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(60);
      if (await page.locator('.pl-quadro-esito, .pl-pausa-fine').count() > 0) break;
    }
    // PO-038: l'esito arriva dopo la pausa sulla plancia finale: si aspetta l'elemento.
    await page.waitForSelector('.pl-quadro-esito', { timeout: 6000 }).catch(() => {});
    const esito = await page.locator('.pl-quadro-esito').innerText({ timeout: 3000 }).catch(() => '');
    if (!/superato/i.test(esito)) { difetto('fine-livello', `il livello 1 giocato non risulta superato (esito: «${esito.trim()}»)`); return; }
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${sigla}-fine-livello.png` });
    for (const b of await page.locator('.pl-fine button, .pl-screen button').all()) {
      if (!(await b.isVisible())) continue;
      if (!(await raggiungibile(b))) difetto('fine-livello', `«${(await b.innerText()).trim().slice(0, 30)}» non si raggiunge`);
    }
    const s = await sporge();
    if (s.x > 1) difetto('fine-livello', `la pagina sporge di lato di ${s.x}px`);
  });
  await chiudi();
}

async function provaTestoDoppio(formato) {
  const { page, apri, livello13, sporge, raggiungibile, passo, difetto, chiudi } = await telefono(formato, { testo: 2 });
  const sigla = formato.nome.replace(/[^a-z0-9]+/gi, '-');
  await passo('guida', async () => {
    await apri({ guida: true });
    for (let n = 1; n <= 8; n += 1) {
      await page.waitForTimeout(150);
      const s = await sporge();
      if (s.x > 1) difetto('guida', `passo ${n}: la pagina sporge di lato di ${s.x}px`);
      if (n === 1) await page.screenshot({ path: `${OUT}/${sigla}-guida.png` });
      const avanti = page.locator('.pl-guida__navigazione .pl-btn--primario');
      if (!(await raggiungibile(avanti))) { difetto('guida', `passo ${n}: «${(await avanti.innerText()).trim()}» non si raggiunge`); return; }
      if (/^(Gioca|Inizia)/i.test((await avanti.innerText()).trim())) break;
      await avanti.tap();
    }
  });
  await passo('livello', async () => {
    await livello13();
    await page.screenshot({ path: `${OUT}/${sigla}-livello.png` });
    const s = await sporge();
    if (s.x > 1) difetto('livello', `la pagina sporge di lato di ${s.x}px`);
  });
  await passo('attrezzi', async () => {
    await page.locator('.pl-attrezzi__pastiglia').tap();
    await page.waitForSelector('.pl-attrezzi__pannello');
    const torna = page.getByRole('button', { name: /^Torna alla partita$/ });
    if (!(await raggiungibile(torna))) {
      const r = await page.locator('.pl-attrezzi__pannello').boundingBox();
      difetto('attrezzi', `«Torna alla partita» del pannello non si raggiunge (pannello da ${Math.round(r.y)} a ${Math.round(r.y + r.height)} px su ${formato.h})`);
      return;
    }
    await page.screenshot({ path: `${OUT}/${sigla}-attrezzi.png` });
    await torna.tap();
    await page.waitForSelector('.pl-attrezzi__pannello', { state: 'detached' });
  });
  await passo('menu', async () => {
    await page.locator('.pl-hud__menu').tap();
    await page.waitForSelector('.pl-menu');
    for (const b of await page.locator('.pl-menu button').all()) {
      if (!(await raggiungibile(b))) difetto('menu', `«${(await b.innerText()).trim()}» non si raggiunge`);
    }
  });
  await chiudi();
}

// ------------------------------------------------- lanci e tocco subito (PO-037) ---
/*
 * Collaudo 1.21.26, O1; decisione PO-037. Dopo trascinamenti staccati col dito ancora in
 * corsa Chromium avviava un fling che si sommava di lancio in lancio fino a ~2 s, e il primo
 * tocco che lo fermava veniva soppresso: niente `click` (docs/sviluppo/RAPPORTO-PO-037.md).
 * Qui il dito NON si ferma (niente `fermaIlDito`): 14 lanci di fila dal vassoio verso il
 * centro della griglia, 150 ms fra l'uno e l'altro, e subito un tocco su «Menu». Il menu deve
 * aprirsi al primo tocco in ognuno dei giri. Con NIENTE_LANCIO_DOPO_LA_PRESA spento
 * (src/ui/useTrascinamento.js) e' rosso; piu' giri perche' un giro solo puo' capitare su un
 * fling gia' finito.
 */
const LANCI = [[360, 640], [915, 412]].map(([w, h]) => ({ nome: `lanci ${w}x${h}`, w, h }));
const GIRI_LANCI = 3;
async function provaLanci(formato) {
  const { page, apri, passo, difetto, chiudi } = await telefono(formato);
  const dito = (cdp, type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  for (let giro = 1; giro <= GIRI_LANCI; giro += 1) {
    await passo('lanci', async () => {
      await apri();
      await page.getByRole('button', { name: /^Partita libera/ }).tap();
      await page.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
      await page.waitForTimeout(250);
      const cdp = await page.context().newCDPSession(page);
      // Col dito il pezzo si disegna 1,35 caselle sopra il dito (useTrascinamento.js).
      const a = await page.evaluate(() => {
        const c = document.querySelectorAll('.pl-plancia .pl-cella')[40].getBoundingClientRect();
        return { x: c.left + c.width / 2, y: c.top + c.height / 2 + 1.35 * c.height };
      });
      let lanci = 0;
      for (let i = 0; i < 14; i += 1) {
        const r = await page.evaluate(() => document.querySelector('.pl-tray .pl-pezzo')?.getBoundingClientRect().toJSON());
        if (!r) break;
        const da = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        await dito(cdp, 'touchStart', da.x, da.y);
        for (let k = 1; k <= 12; k += 1) await dito(cdp, 'touchMove', da.x + ((a.x - da.x) * k) / 12, da.y + ((a.y - da.y) * k) / 12);
        await dito(cdp, 'touchEnd');
        lanci += 1;
        await page.waitForTimeout(150);
      }
      if (lanci < 14) { difetto('lanci', `giro ${giro}: solo ${lanci} lanci su 14, il vassoio e' vuoto: la prova e' rotta`); return; }
      const b = await page.locator('.pl-hud__menu').boundingBox();
      await dito(cdp, 'touchStart', b.x + b.width / 2, b.y + b.height / 2);
      await dito(cdp, 'touchEnd');
      const aperto = await page.waitForSelector('.pl-menu', { timeout: 1000 }).then(() => true, () => false);
      await cdp.detach();
      if (!aperto) difetto('lanci', `giro ${giro}: dopo 14 lanci il primo tocco su «Menu» non apre il menu (click perso; PO-037)`);
    });
  }
  await chiudi();
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
console.log(`\nPLINTO su tablet e PC (${INDIRIZZO})`);
const misureCornici = [...new Set(DA_PROVARE.map((f) => { const c = corniceDi(f); return `${c.w}x${c.h}`; }))];
for (const misura of misureCornici) {
  const [w, h] = misura.split('x').map(Number);
  await provaFormato({ nome: `telefono ${misura} (riferimento)`, w, h, tocco: true }, { eRiferimento: true });
}
for (const formato of DA_PROVARE) await provaFormato(formato);
const filtra = (lista) => (FILTRO ? lista.filter((f) => FILTRO.some((x) => f.nome.includes(x))) : lista);
for (const formato of filtra(ORIZZONTALI)) await provaOrizzontale(formato);
for (const formato of filtra(TESTO_DOPPIO)) await provaTestoDoppio(formato);
for (const formato of filtra(LANCI)) await provaLanci(formato);
await browser.close();

// ------------------------------------------------------------------------- il verdetto ---
const colonne = [...new Set(Object.values(tabella).flatMap((r) => Object.keys(r)))];
console.log(`\n${'formato'.padEnd(32)} ${colonne.map((c) => c.slice(0, 7).padEnd(7)).join(' ')}`);
for (const [nome, r] of Object.entries(tabella)) {
  console.log(`${nome.padEnd(32)} ${colonne.map((c) => (r[c] ?? '-').padEnd(7)).join(' ')}`);
}
if (avvisi.length) {
  console.log(`\nBersagli sotto ${BERSAGLIO_MIN}px anche sul telefono (non dipendono dalla cornice, non fanno fallire):`);
  for (const a of [...new Set(avvisi.map((x) => x.replace(/^[^/]+\/ /, '')))]) console.log(`  - ${a}`);
}
if (errori.length) {
  console.log(`\nDIFETTI (${errori.length}):`);
  for (const e of errori) console.log(`  - ${e}`);
  console.log(`\nSchermate in ${OUT}`);
  process.exit(1);
}
console.log(`\nTutto a posto su ${DA_PROVARE.length} formati, ${filtra(ORIZZONTALI).length} coricati e ${filtra(TESTO_DOPPIO).length} col testo x2 e ${filtra(LANCI).length} coi lanci. Schermate in ${OUT}`);
