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
 *   2. la home NON scorre a 360x640, 375x667, 390x844, 412x915 e su due desktop, in
 *      TUTTI gli stati (nessuna partita, libera in corso, sfida in corso, livello a
 *      meta', tutte insieme) e con un numero di versione lungo apposta, come
 *      `npm run impaginazione`. Fino alla 1.21.10 lo stato «libera» era escluso perche'
 *      scorreva gia' (F1, PO-004): adesso non lo e' piu';
 *   3. le card restano alte almeno 44 px e i collegamenti in fondo almeno 24 (B10);
 *   4. la riga ha un contrasto di almeno 4.5:1 sul punto PIU' CHIARO del fondo della
 *      card, che e' una sfumatura: misurare sul colore medio sarebbe barare;
 *   5. PO-010, «nome fisso + stato»: le card si chiamano «Partita libera» e «Sfida del
 *      giorno» in OGNI stato; con una partita in corso a destra c'e' «Riprendi ›» e il
 *      nome accessibile lo dice («Partita libera, riprendi la partita in corso»);
 *   6. con la libera in corso, sotto la sua card c'e' «Nuova partita libera», alto
 *      almeno 24 px e dentro lo schermo senza scorrere; senza, non c'e'.
 *
 * (Fino a PO-010 il punto 5 controllava «Riprendi la sfida · In corso», F2 di PO-004:
 * quella scritta non c'e' piu'.)
 *
 * Con l'interruttore SPIEGAZIONE_MODI spento (src/ui/schermate/Home.jsx) la home torna
 * quella della 1.21.9 e questo controllo deve essere ROSSO: e' la prova che sa fallire.
 * Lo stesso con NOME_FISSO_E_STATO spento (le card cambiano nome, niente «Riprendi ›» e
 * niente collegamento) e con HOME_BASSA_COMPATTA spento (il collegamento fa scorrere la
 * home negli stati «libera» e «tutte» a 360x640 e 375x667).
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
// Un livello lasciato a meta': il pulsante grande diventa «Riprendi il livello 11».
const PARTITA_LIVELLO = { numero: 11, partita: serializeGame(createGame({ seed: 'po004-f1', now: 0 })) };

/**
 * Gli stati della home (F1, PO-004: la promessa «la home non scorre» vale in tutti):
 *  - `nuova`: chi apre il gioco la prima volta;
 *  - `sfida`: record, dieci livelli, sfida di oggi in corso (era `piena` in PO-009);
 *  - `libera`: record, dieci livelli, una partita libera in corso. Fino alla 1.21.10
 *    aggiungeva «Nuova partita» e la home scorreva (60 px a 360x640);
 *  - `livello`: record, dieci livelli, il livello 11 lasciato a meta';
 *  - `tutte`: libera, sfida e livello in corso insieme, la home piu' carica possibile.
 */
const STATI = ['nuova', 'sfida', 'libera', 'livello', 'tutte'];

async function apri(lingua, [larghezza, altezza], stato) {
  const page = await browser.newPage({ viewport: { width: larghezza, height: altezza }, locale: lingua });
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(([l, p, libera, sfida, livello]) => {
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
    if (p === 'libera' || p === 'tutte') window.localStorage.setItem('plinto:partita', JSON.stringify(libera));
    if (p === 'sfida' || p === 'tutte') window.localStorage.setItem('plinto:partita-sfida', JSON.stringify(sfida));
    if (p === 'livello' || p === 'tutte') window.localStorage.setItem('plinto:partita-quadro', JSON.stringify(livello));
  }, [lingua, stato, PARTITA_LIBERA, PARTITA_SFIDA, PARTITA_LIVELLO]);
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
      esito: el.querySelector('.pl-sfida-avvio__esito')?.textContent ?? null,
      // PO-010, «in evidenza»: la pillola ha un fondo pieno, il record no.
      esitoFondo: (() => { const e = el.querySelector('.pl-sfida-avvio__esito'); return e ? getComputedStyle(e).backgroundColor : null; })(),
      titolo: el.querySelector('span')?.textContent ?? null,
    };
  };
  const nl = home.querySelector('.pl-home__nuova-libera');
  const nuova = nl ? (() => {
    const r = nl.getBoundingClientRect();
    const c = home.querySelector('.pl-sfida-avvio--libera').getBoundingClientRect();
    return {
      testo: nl.textContent, altezza: Math.round(r.height),
      // Subito sotto la card della libera, non da un'altra parte della home.
      sotto: r.top >= c.bottom - 0.5 && r.top - c.bottom <= 12,
      dentro: r.bottom <= window.innerHeight + 0.5,
    };
  })() : null;
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
    mappa: card('.pl-sfida-avvio--mappa'), collegamenti, nuova,
    azioni: home.querySelectorAll('.pl-home__azioni > *').length,
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
        azioni: m.azioni, statoLibera: m.libera?.esito, statoSfida: m.sfida?.esito,
        nuova: m.nuova?.altezza ?? '-',
        libera: m.libera?.altezza, sfida: m.sfida?.altezza, mappa: m.mappa?.altezza,
        righe: [m.libera?.riga?.righe, m.sfida?.riga?.righe].join('+'),
        contrasto: [m.libera?.riga?.contrasto, m.sfida?.riga?.contrasto].join(' / '),
        pie: m.collegamenti.join(','),
      });
      if (m.aggiunta !== 0) errori.push(`${dove}: la riga di spiegazione allunga la home di ${m.aggiunta}px`);
      if (m.eccesso > 0) errori.push(`${dove}: la home scorre di ${m.eccesso}px`);
      if (m.eccessoLungo > m.eccesso) errori.push(`${dove}: con una versione lunga la home scorre di ${m.eccessoLungo}px`);
      // PO-010: il nome della card e' fisso; «Riprendi ›» e' lo stato, a destra.
      const conLibera = stato === 'libera' || stato === 'tutte';
      const conSfida = stato === 'sfida' || stato === 'tutte';
      if (m.libera?.titolo !== testi.home.partitaLibera) errori.push(`${dove}: la card della libera si chiama «${m.libera?.titolo}» invece di «${testi.home.partitaLibera}» (PO-010)`);
      if (m.sfida?.titolo !== testi.sfida.breve) errori.push(`${dove}: la card della sfida si chiama «${m.sfida?.titolo}» invece di «${testi.sfida.breve}» (PO-010)`);
      if (conLibera) {
        if (m.libera?.esito !== testi.home.riprendiStato) errori.push(`${dove}: con la libera in corso lo stato e «${m.libera?.esito}» invece di «${testi.home.riprendiStato}» (PO-010)`);
        if (/rgba\(0, 0, 0, 0\)|transparent/.test(m.libera?.esitoFondo ?? 'transparent')) errori.push(`${dove}: «${testi.home.riprendiStato}» della libera non e in evidenza (nessun fondo)`);
        const atteso = `${testi.home.partitaLibera}, ${testi.home.riprendiLibera}`;
        if (m.libera?.nome !== atteso) errori.push(`${dove}: il nome accessibile della libera e «${m.libera?.nome}» invece di «${atteso}»`);
        if (!m.nuova) errori.push(`${dove}: con la libera in corso manca «${testi.home.nuovaLibera}» (PO-010)`);
        else {
          if (m.nuova.testo !== testi.home.nuovaLibera) errori.push(`${dove}: il collegamento dice «${m.nuova.testo}» invece di «${testi.home.nuovaLibera}»`);
          if (m.nuova.altezza < 24) errori.push(`${dove}: «${testi.home.nuovaLibera}» e alto ${m.nuova.altezza}px (minimo 24)`);
          if (!m.nuova.sotto) errori.push(`${dove}: «${testi.home.nuovaLibera}» non sta subito sotto la card della libera`);
          if (!m.nuova.dentro) errori.push(`${dove}: «${testi.home.nuovaLibera}» esce dallo schermo`);
        }
      } else {
        if (m.nuova) errori.push(`${dove}: senza libera in corso c'e «${m.nuova.testo}»`);
        if (m.libera?.esito === testi.home.riprendiStato) errori.push(`${dove}: senza libera in corso la card dice «${m.libera.esito}»`);
      }
      if (conSfida) {
        if (m.sfida?.esito !== testi.home.riprendiStato) errori.push(`${dove}: con la sfida in corso lo stato e «${m.sfida?.esito}» invece di «${testi.home.riprendiStato}» (PO-010)`);
        if (/rgba\(0, 0, 0, 0\)|transparent/.test(m.sfida?.esitoFondo ?? 'transparent')) errori.push(`${dove}: «${testi.home.riprendiStato}» della sfida non e in evidenza (nessun fondo)`);
        const atteso = `${testi.sfida.breve}, ${testi.home.riprendiSfida}`;
        if (m.sfida?.nome !== atteso) errori.push(`${dove}: il nome accessibile della sfida e «${m.sfida?.nome}» invece di «${atteso}»`);
      } else if (m.sfida?.esito !== testi.home.daGiocare) {
        errori.push(`${dove}: senza sfida in corso la card dice «${m.sfida?.esito}» invece di «${testi.home.daGiocare}»`);
      }
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
      if (OUT && ['libera', 'sfida', 'tutte'].includes(stato) && [[360, 640], [390, 844]].some(([l, a]) => l === formato[0] && a === formato[1])) {
        await page.screenshot({ path: `${OUT}/home-${stato}-${lingua}-${formato.join('x')}.png` });
      }
      await page.close();
    }
  }
}

await browser.close();
if (server) server.kill();

console.log('\nPO-009 e PO-010: riga di spiegazione, nome fisso e «Riprendi ›», «Nuova partita libera»');
console.table(tabella);
if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  [...new Set(errori)].forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nLa riga c\'e\' in italiano e in inglese, si legge, non allunga la home, la home non scorre'
  + ' in nessuno dei cinque stati, le card hanno il nome fisso con «Riprendi ›» e c\'e\' «Nuova partita libera».');
