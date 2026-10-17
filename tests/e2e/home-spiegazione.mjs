/**
 * PO-009: sotto «Partita libera» e «Sfida del giorno» la home dice che cosa sono.
 *
 * PERCHE' ESISTE. Il PO: «nella home non si capisce bene la distinzione tra partita
 * libera e sfida del giorno, si confonde il player». Le due card avevano solo il nome a
 * sinistra e lo stato a destra («Mai giocata», «Da giocare», un record): niente diceva
 * che una non finisce a un livello e l'altra cambia ogni giorno. La decisione
 * (docs/DECISIONI.md, PO-009) e' una riga piccola e FISSA sotto il nome.
 *
 * Che cosa prova, in italiano e in inglese:
 *   1. la riga c'e', dice il testo del dizionario, si vede intera dentro la card ed e'
 *      la descrizione accessibile della card (`aria-describedby`);
 *   2. la home NON scorre a 360x640, 375x667, 390x844, 412x915 e su due desktop, nello
 *      stato piu' pieno (partita libera e sfida in corso, record, livelli) e con un
 *      numero di versione lungo apposta, come `npm run impaginazione`;
 *   3. le card restano alte almeno 44 px e i collegamenti in fondo almeno 24 (B10);
 *   4. la riga ha un contrasto di almeno 4.5:1 sul punto PIU' CHIARO del fondo della
 *      card, che e' una sfumatura: misurare sul colore medio sarebbe barare.
 *
 * Con l'interruttore SPIEGAZIONE_MODI spento (src/ui/schermate/Home.jsx) la home torna
 * quella della 1.21.9 e questo controllo deve essere ROSSO: e' la prova che sa fallire.
 *
 * Uso: npm run home-spiegazione   (PLINTO_E2E_OUT=cartella per le schermate)
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import testiIt from '../../src/i18n/it.js';
import testiEn from '../../src/i18n/en.js';
import { createGame, serializeGame } from '../../src/core/engine.js';
import { giornoDiOggi } from '../../src/core/sfida.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? null;
if (OUT) mkdirSync(OUT, { recursive: true });

const FORMATI = [
  [360, 640], [375, 667], [390, 844], [412, 915], [1280, 800], [1366, 768],
];
const LINGUE = { it: testiIt, en: testiEn };

const errori = [];

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

/** La home piu' alta possibile (come impaginazione.mjs) oppure quella di chi arriva ora. */
// Partite VERE, non segnaposto: un segnaposto non supera la lettura dell'archivio, la
// home lo ignora e il pulsante «Nuova partita» non compare (misurato: con i segnaposto
// la home "piena" era alta quanto quella di un giocatore nuovo).
const PARTITA_LIBERA = serializeGame(createGame({ seed: 'po009', now: 0 }));
const PARTITA_SFIDA = serializeGame(createGame({ seed: giornoDiOggi(), now: 0 }));

/**
 * Tre stati della home:
 *  - `nuova`: chi apre il gioco la prima volta;
 *  - `piena`: record, dieci livelli, sfida di oggi in corso. E' lo stato che
 *    `npm run impaginazione` crede di provare con i suoi segnaposto;
 *  - `libera`: come `piena` piu' una partita libera in corso, che aggiunge «Nuova
 *    partita». SU MAIN QUESTA HOME SCORRE GIA' (60 px a 360x640, 35 a 375x667, 25 a
 *    1366x768, misurato prima di PO-009 e scritto in docs/sviluppo/RAPPORTO-PO-009.md).
 *    Qui non si pretende che entri -- non e' un difetto di questa riga -- ma che la riga
 *    NON AGGIUNGA NEMMENO UN PIXEL: si misura con e senza.
 */
const STATI = ['nuova', 'piena', 'libera'];

async function apri(lingua, [larghezza, altezza], stato) {
  const page = await browser.newPage({ viewport: { width: larghezza, height: altezza }, locale: lingua });
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(([l, p, libera, sfida]) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      versione: 2, introVista: true, lingua: l,
      audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
    }));
    if (p === 'nuova') return;
    window.localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
    window.localStorage.setItem('plinto:quadri', JSON.stringify({
      versione: 1,
      livelli: Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [i + 1, { mosse: 9, punteggio: 400, tentativi: 1 }]),
      ),
    }));
    if (p === 'libera') window.localStorage.setItem('plinto:partita', JSON.stringify(libera));
    window.localStorage.setItem('plinto:partita-sfida', JSON.stringify(sfida));
  }, [lingua, stato, PARTITA_LIBERA, PARTITA_SFIDA]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-home__azioni');
  return page;
}

/** Tutto quello che si misura in una home, in una sola lettura. */
function misura() {
  const home = document.querySelector('.pl-home');
  const ver = home.querySelector('.pl-home__versione');
  const eccesso = home.scrollHeight - home.clientHeight;
  let eccessoLungo = eccesso;
  if (ver) {
    const vero = ver.textContent;
    ver.textContent = 'v10.20.30';
    eccessoLungo = home.scrollHeight - home.clientHeight;
    ver.textContent = vero;
  }
  // Un colore CSS qualunque in [r, g, b], passando da un elemento di prova: Chromium
  // risolve color-mix() e le variabili, e restituisce rgb() oppure color(srgb ...).
  const rgb = (css, dove) => {
    const prova = document.createElement('span');
    prova.style.color = css;
    dove.appendChild(prova);
    const c = getComputedStyle(prova).color;
    prova.remove();
    const n = c.match(/[\d.]+/g).map(Number);
    return c.startsWith('color(') ? n.slice(0, 3).map((v) => v * 255) : n.slice(0, 3);
  };
  const lum = ([r, g, b]) => {
    const f = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const rapporto = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const card = (sel) => {
    const el = home.querySelector(sel);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const riga = el.querySelector('.pl-sfida-avvio__spiega');
    const ids = (el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    const descrizione = ids.map((id) => document.getElementById(id)?.textContent ?? '').join(' ').trim();
    let riga_ = null;
    if (riga) {
      const rr = riga.getBoundingClientRect();
      const stile = getComputedStyle(riga);
      // Il fondo e' la sfumatura di finiture.css: il punto piu' chiaro e' il 22% del
      // colore della voce sopra --pl-ink, all'angolo in alto a sinistra.
      const fondo = rgb('color-mix(in srgb, var(--voce) 22%, var(--pl-ink))', el);
      const testo = rgb(stile.color, el);
      riga_ = {
        testo: riga.textContent,
        visibile: rr.width > 0 && rr.height > 0 && stile.visibility !== 'hidden' && stile.display !== 'none',
        dentro: rr.left >= r.left - 0.5 && rr.right <= r.right + 0.5 && rr.top >= r.top - 0.5 && rr.bottom <= r.bottom + 0.5,
        tagliata: riga.scrollWidth > riga.clientWidth + 1,
        righe: Math.round(rr.height / parseFloat(stile.lineHeight || '1')),
        altezza: Math.round(rr.height),
        corpo: stile.fontSize,
        // Non arrotondato: 4.497 arrotondato a 4.5 passava, ed e' successo alla prima misura.
        contrasto: Math.floor(rapporto(testo, fondo) * 1000) / 1000,
      };
    }
    return {
      altezza: Math.round(r.height), nome: el.getAttribute('aria-label'), descrizione, riga: riga_,
    };
  };
  const collegamenti = [...home.querySelectorAll('.pl-home__pie .pl-home__sostieni')]
    .map((e) => Math.round(e.getBoundingClientRect().height));
  // Quanto spazio verticale avanza fra il primo e l'ultimo blocco: scrollHeight dice solo
  // se scorre, non quanto manca perche' cominci a farlo.
  const figli = [...home.children].map((c) => c.getBoundingClientRect()).filter((r) => r.height > 0);
  const st = getComputedStyle(home);
  const libero = Math.round(home.clientHeight - parseFloat(st.paddingTop) - parseFloat(st.paddingBottom)
    - (Math.max(...figli.map((r) => r.bottom)) - Math.min(...figli.map((r) => r.top))));
  // Quanto pesa la riga: la stessa home con le righe tolte dal disegno.
  const righe = [...home.querySelectorAll('.pl-sfida-avvio__spiega')];
  const conRiga = home.scrollHeight;
  righe.forEach((r) => { r.style.display = 'none'; });
  const aggiunta = conRiga - home.scrollHeight;
  righe.forEach((r) => { r.style.display = ''; });
  return {
    aggiunta, libero, eccesso, eccessoLungo, alta: home.scrollHeight, finestra: home.clientHeight,
    libera: card('.pl-sfida-avvio--libera'), sfida: card('.pl-sfida-avvio--sfida'),
    mappa: card('.pl-sfida-avvio--mappa'), collegamenti,
  };
}

const tabella = [];
for (const [lingua, testi] of Object.entries(LINGUE)) {
  const attese = { libera: testi.home.spiegaLibera, sfida: testi.home.spiegaSfida };
  if (!attese.libera || !attese.sfida) errori.push(`${lingua}: mancano home.spiegaLibera o home.spiegaSfida nel dizionario`);
  for (const formato of FORMATI) {
    for (const stato of STATI) {
      const page = await apri(lingua, formato, stato);
      const m = await page.evaluate(misura);
      const dove = `${lingua} ${formato.join('x')} ${stato}`;
      const peggio = Math.max(m.eccesso, m.eccessoLungo);
      tabella.push({
        dove, home: `${m.alta}/${m.finestra}`, libero: m.libero, scorre: peggio, riga: m.aggiunta,
        libera: m.libera?.altezza, sfida: m.sfida?.altezza, mappa: m.mappa?.altezza,
        righe: [m.libera?.riga?.righe, m.sfida?.riga?.righe].join('+'),
        contrasto: [m.libera?.riga?.contrasto, m.sfida?.riga?.contrasto].join(' / '),
        pie: m.collegamenti.join(','),
      });
      if (m.aggiunta !== 0) errori.push(`${dove}: la riga di spiegazione allunga la home di ${m.aggiunta}px`);
      if (stato !== 'libera' && m.eccesso > 0) errori.push(`${dove}: la home scorre di ${m.eccesso}px`);
      if (stato !== 'libera' && m.eccessoLungo > m.eccesso) errori.push(`${dove}: con una versione lunga la home scorre di ${m.eccessoLungo}px`);
      for (const h of m.collegamenti) if (h < 24) errori.push(`${dove}: un collegamento in fondo e alto ${h}px (B10 chiede 24)`);
      if (!m.collegamenti.length) errori.push(`${dove}: collegamenti in fondo non trovati`);
      for (const quale of ['libera', 'sfida']) {
        const c = m[quale];
        if (!c) { errori.push(`${dove}: la card ${quale} non c'e`); continue; }
        if (c.altezza < 44) errori.push(`${dove}: la card ${quale} e alta ${c.altezza}px (minimo 44)`);
        if (!c.riga) { errori.push(`${dove}: la card ${quale} non ha la riga di spiegazione`); continue; }
        if (c.riga.testo !== attese[quale]) errori.push(`${dove}: la riga della card ${quale} dice «${c.riga.testo}» invece di «${attese[quale]}»`);
        if (!c.riga.visibile) errori.push(`${dove}: la riga della card ${quale} non si vede`);
        if (!c.riga.dentro) errori.push(`${dove}: la riga della card ${quale} esce dalla card`);
        if (c.riga.tagliata) errori.push(`${dove}: la riga della card ${quale} ha il testo tagliato`);
        if (c.riga.contrasto < 4.5) errori.push(`${dove}: la riga della card ${quale} ha contrasto ${c.riga.contrasto}:1 (minimo 4.5)`);
        if (c.descrizione !== attese[quale]) errori.push(`${dove}: la descrizione accessibile della card ${quale} e «${c.descrizione}»`);
      }
      if (OUT && stato === 'piena' && [[360, 640], [390, 844]].some(([l, a]) => l === formato[0] && a === formato[1])) {
        await page.screenshot({ path: `${OUT}/home-${lingua}-${formato.join('x')}.png` });
      }
      await page.close();
    }
  }
}

await browser.close();
if (server) server.kill();

console.log('\nPO-009: riga di spiegazione sotto Partita libera e Sfida del giorno');
console.table(tabella);
if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  [...new Set(errori)].forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nLa riga c\'e\' in italiano e in inglese, si legge, non allunga la home, e la home non scorre'
  + ' (stato «libera» escluso: scorreva gia\' prima, vedi l\'intestazione).');
