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
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
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
const SEQUENZA_1 = sequenzaVincente(quadroNumero(1));
if (!SEQUENZA_1) errori.push('LIVELLO 1: il motore non trova una sequenza vincente, non si puo provare la fine del livello');

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
  const sottoIlPunto = (el, r) => {
    const x = Math.min(Math.max(r.left + r.width / 2, 0), vw - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), vh - 1);
    const sopra = document.elementFromPoint(x, y);
    return sopra && (sopra === el || el.contains(sopra) || sopra.contains(el));
  };

  const tutti = [...root.querySelectorAll('*')];
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

  // Testi sovrapposti: i rettangoli veri delle righe di testo, solo dove il testo e'
  // quello che si vede in quel punto (un velo sopra la partita copre legittimamente).
  const righe = [];
  const giro = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = giro.nextNode(); n; n = giro.nextNode()) {
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || !visibile(el) || el.closest('[aria-hidden="true"]') || el.closest('.pl-sr, .sr-only')) continue;
    const intervallo = document.createRange();
    intervallo.selectNodeContents(n);
    for (const r of intervallo.getClientRects()) {
      if (r.width < 2 || r.height < 2) continue;
      if (r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
      if (!sottoIlPunto(el, r)) continue;
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
    if (!sottoIlPunto(el, r)) continue;
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
    const rif = riferimento[schermata]?.verticali ?? {};
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
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    return anteprima;
  }

  // --- home
  await home();
  await misura('home');

  // --- partita libera: un pezzo col puntatore, uno da tastiera
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

  // --- menu della partita
  await page.locator('.pl-hud__menu').click();
  await page.waitForSelector('.pl-menu');
  await misura('menu');

  // --- sfida del giorno
  await home();
  await page.getByRole('button', { name: /^(Sfida del giorno|Riprendi la sfida)/ }).click();
  await page.waitForSelector('.pl-plancia');
  await misura('sfida');

  // --- mappa dei livelli
  await home();
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await misura('mappa');

  // --- livello 1: apertura, partita, fine
  await home();
  await page.locator('.pl-home__azioni .pl-btn--primario').click();
  await page.waitForSelector('.pl-apertura');
  await misura('apertura');
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia');
  await misura('livello');
  if (SEQUENZA_1) {
    for (const mossa of SEQUENZA_1) {
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
      if (!punti) { difetto('fine-livello', 'pezzo non trovato durante la partita'); break; }
      await page.mouse.move(punti.px, punti.py);
      await page.mouse.down();
      await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
      await page.mouse.up();
      await page.waitForTimeout(60);
      if (await page.locator('.pl-quadro-esito').count() > 0) break;
    }
    const esito = await page.locator('.pl-quadro-esito').innerText({ timeout: 3000 }).catch(() => '');
    if (!/superato/i.test(esito)) difetto('fine-livello', `il livello 1 giocato non risulta superato (esito: «${esito.trim()}»)`);
    else {
      await page.waitForTimeout(1200);
      await misura('fine-livello');
    }
  }

  // --- come si gioca, statistiche, archivio
  for (const [schermata, nome] of [['come-si-gioca', /^Come si gioca$/], ['statistiche', /^Statistiche$/], ['archivio', /^Archivio delle sfide$/]]) {
    await home();
    await page.getByRole('button', { name: nome }).first().click();
    await page.waitForTimeout(300);
    await misura(schermata);
  }

  if (erroriConsole.length) {
    for (const e of erroriConsole.slice(0, 3)) difetto('console', e.slice(0, 160));
    riga.console = 'NO';
  } else riga.console = 'ok';
  await contesto.close();
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
console.log(`\nPLINTO su tablet e PC (${INDIRIZZO})`);
const misureCornici = [...new Set(DA_PROVARE.map((f) => { const c = corniceDi(f); return `${c.w}x${c.h}`; }))];
for (const misura of misureCornici) {
  const [w, h] = misura.split('x').map(Number);
  await provaFormato({ nome: `telefono ${misura} (riferimento)`, w, h, tocco: true }, { eRiferimento: true });
}
for (const formato of DA_PROVARE) await provaFormato(formato);
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
console.log(`\nTutto a posto su ${DA_PROVARE.length} formati. Schermate in ${OUT}`);
