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
 *   6. PO-020, «Dentro la card»: con la libera in corso la card ha DUE pulsanti sulla
 *      riga del nome, «Nuova» e «Riprendi ›», dentro i bordi della card; non c'e' piu'
 *      il collegamento sottolineato sotto; nessun <button> dentro un <button>; il
 *      bersaglio di «Nuova» e' alto almeno 44 px; un tocco sul nome della card riprende
 *      (e' «Riprendi ›» a riceverlo) e «Nuova» apre la conferma H1 (PO-008).
 *      Senza libera in corso la card e' un pulsante solo, come prima.
 *
 * (Fino a PO-010 il punto 5 controllava «Riprendi la sfida · In corso», F2 di PO-004:
 * quella scritta non c'e' piu'.)
 *
 * Con l'interruttore SPIEGAZIONE_MODI spento (src/ui/schermate/Home.jsx) la home torna
 * quella della 1.21.9 e questo controllo deve essere ROSSO: e' la prova che sa fallire.
 * Lo stesso con NOME_FISSO_E_STATO spento (le card cambiano nome, niente «Riprendi ›» e
 * niente collegamento) e con HOME_BASSA_COMPATTA spento (il collegamento fa scorrere la
 * home negli stati «libera» e «tutte» a 360x640 e 375x667), e con NUOVA_DENTRO_LA_CARD
 * spento (torna il collegamento sottolineato sotto la card: PO-020 e' rosso).
 *
 * Uso: npm run home-spiegazione   (PLINTO_E2E_OUT=cartella per le schermate)
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import testiIt from '../../src/i18n/it.js';
import testiEn from '../../src/i18n/en.js';
import { createGame, serializeGame, canPlaceHandPiece, placePiece } from '../../src/core/engine.js';
import { giornoDiOggi } from '../../src/core/sfida.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? null;
if (OUT) mkdirSync(OUT, { recursive: true });

const FORMATI = [
  [320, 700], [360, 640], [360, 800], [375, 667], [390, 844], [412, 915], [1280, 800], [1366, 768],
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
// PO-020: la conferma H1 scatta solo con almeno una mossa (liberaAMeta in usePartita):
// a zero mosse «Nuova» comincia e basta, e la prova del tocco non proverebbe niente.
const PARTITA_LIBERA_META = (() => {
  const s = createGame({ seed: 'po009', now: 0 });
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (canPlaceHandPiece(s, 0, r, c)) return serializeGame(placePiece(s, 0, r, c, 0));
  }
  throw new Error('nessuna mossa possibile per la partita di prova');
})();
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
  await page.evaluate(([l, p, libera, sfida, livello, liberaMeta]) => {
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
    if (p === 'liberaMeta') window.localStorage.setItem('plinto:partita', JSON.stringify(liberaMeta));
    if (p === 'sfida' || p === 'tutte') window.localStorage.setItem('plinto:partita-sfida', JSON.stringify(sfida));
    if (p === 'livello' || p === 'tutte') window.localStorage.setItem('plinto:partita-quadro', JSON.stringify(livello));
  }, [lingua, stato, PARTITA_LIBERA, PARTITA_SFIDA, PARTITA_LIVELLO, PARTITA_LIBERA_META]);
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
    // PO-020: con «Nuova» dentro, la card e' un contenitore e il nome accessibile e la
    // spiegazione stanno su «Riprendi ›», il pulsante che riceve il tocco sulla card.
    const voce = el.matches('button') ? el : el.querySelector('.pl-sfida-avvio__riprendi');
    const ids = (voce?.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
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
      altezza: Math.round(r.height), nome: voce?.getAttribute('aria-label') ?? null, descrizione, riga: riga_,
      esito: el.querySelector('.pl-sfida-avvio__esito')?.textContent ?? null,
      // PO-010, «in evidenza»: la pillola ha un fondo pieno, il record no.
      esitoFondo: (() => { const e = el.querySelector('.pl-sfida-avvio__esito'); return e ? getComputedStyle(e).backgroundColor : null; })(),
      // PO-011: la pillola non sporge (niente alone) e finisce dove finisce il contenuto.
      esitoAlone: (() => { const e = el.querySelector('.pl-sfida-avvio__esito'); return e ? getComputedStyle(e).boxShadow : null; })(),
      esitoDestra: (() => { const e = el.querySelector('.pl-sfida-avvio__esito'); if (!e) return null; const cs = getComputedStyle(el); return Math.round(el.getBoundingClientRect().right - parseFloat(cs.paddingRight) - e.getBoundingClientRect().right); })(),
      titolo: el.querySelector('span')?.textContent ?? null,
    };
  };
  // PO-020: «Nuova» dentro la card della libera.
  const cardLibera = home.querySelector('.pl-sfida-avvio--libera');
  const dn = cardLibera?.querySelector('.pl-sfida-avvio__nuova') ?? null;
  const dentroCard = dn ? (() => {
    const c = cardLibera.getBoundingClientRect();
    const r = dn.getBoundingClientRect();
    const rip = cardLibera.querySelector('.pl-sfida-avvio__riprendi');
    const rr = rip?.getBoundingClientRect();
    const entro = (q) => q.left >= c.left - 0.5 && q.right <= c.right + 0.5 && q.top >= c.top - 0.5 && q.bottom <= c.bottom + 0.5;
    // Il bersaglio vero si misura come lo misura un dito: elementFromPoint lungo la
    // verticale al centro di «Nuova», pixel per pixel (il ::before non ha un rettangolo).
    const x = r.left + r.width / 2;
    let bersaglio = 0;
    for (let y = Math.floor(c.top) - 20; y <= Math.ceil(c.bottom) + 20; y += 1) {
      if (document.elementFromPoint(x, y)?.closest('button') === dn) bersaglio += 1;
    }
    // Il tocco sul nome della card deve arrivare a «Riprendi ›».
    const nome = cardLibera.querySelector('span').getBoundingClientRect();
    const sulNome = document.elementFromPoint(nome.left + 4, nome.top + nome.height / 2)?.closest('button');
    const stile = getComputedStyle(dn);
    return {
      testo: dn.textContent, nome: dn.getAttribute('aria-label'), altezza: Math.round(r.height), bersaglio,
      dentro: entro(r), riprendiDentro: rr ? entro(rr) : false,
      stessaRiga: rr ? Math.abs((r.top + r.bottom) / 2 - (rr.top + rr.bottom) / 2) <= 1.5 : false,
      sinistra: rr ? r.right <= rr.left : false,
      sottolineato: stile.textDecorationLine.includes('underline'),
      tattoSulNome: sulNome?.classList.contains('pl-sfida-avvio__riprendi') ?? false,
    };
  })() : null;
  const annidati = home.querySelectorAll('button button').length;
  const sottolineati = [...home.querySelectorAll('.pl-home__azioni button')]
    .filter((b) => getComputedStyle(b).textDecorationLine.includes('underline')).map((b) => b.textContent);
  const nl = [...home.querySelectorAll('.pl-home__nuova-libera')].find((e) => !cardLibera?.contains(e));
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
    mappa: card('.pl-sfida-avvio--mappa'), collegamenti, nuova, dentroCard, annidati, sottolineati,
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
        nuova: m.dentroCard ? `${m.dentroCard.altezza}/${m.dentroCard.bersaglio}` : (m.nuova ? `sotto ${m.nuova.altezza}` : '-'),
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
        if (m.libera?.esitoAlone && m.libera.esitoAlone !== 'none') errori.push(`${dove}: la pillola della libera ha un alone che la fa sporgere (PO-011)`);
        if (Math.abs(m.libera?.esitoDestra ?? 0) > 1) errori.push(`${dove}: la pillola della libera non finisce sul bordo del contenuto (scarto ${m.libera?.esitoDestra}px)`);
        const atteso = `${testi.home.partitaLibera}, ${testi.home.riprendiLibera}`;
        if (m.libera?.nome !== atteso) errori.push(`${dove}: il nome accessibile della libera e «${m.libera?.nome}» invece di «${atteso}»`);
        // PO-020: «Nuova» sta dentro la card; il collegamento sotto non c'e' piu'.
        if (m.nuova) errori.push(`${dove}: sotto la card c'e ancora il collegamento «${m.nuova.testo}» (PO-020)`);
        const d = m.dentroCard;
        if (!d) errori.push(`${dove}: con la libera in corso la card non ha il pulsante «${testi.home.nuovaBreve}» (PO-020)`);
        else {
          if (d.testo !== testi.home.nuovaBreve) errori.push(`${dove}: il pulsante dice «${d.testo}» invece di «${testi.home.nuovaBreve}»`);
          if (d.nome !== testi.home.nuovaLibera) errori.push(`${dove}: il nome accessibile di «${d.testo}» e «${d.nome}» invece di «${testi.home.nuovaLibera}»`);
          if (!d.dentro || !d.riprendiDentro) errori.push(`${dove}: «${d.testo}» o «${testi.home.riprendiStato}» escono dai bordi della card`);
          if (!d.stessaRiga || !d.sinistra) errori.push(`${dove}: «${d.testo}» non sta sulla riga di «${testi.home.riprendiStato}», alla sua sinistra`);
          if (d.sottolineato) errori.push(`${dove}: «${d.testo}» e sottolineato`);
          if (d.bersaglio < 44) errori.push(`${dove}: il bersaglio di «${d.testo}» e alto ${d.bersaglio}px (minimo 44)`);
          if (!d.tattoSulNome) errori.push(`${dove}: un tocco sul nome della card non arriva a «${testi.home.riprendiStato}»`);
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
      if (m.annidati) errori.push(`${dove}: ${m.annidati} <button> dentro un altro <button>`);
      if (m.sottolineati.length) errori.push(`${dove}: pulsanti sottolineati fra le azioni: ${m.sottolineati.join(', ')}`);
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
      // PO-020, i tocchi veri (una volta per lingua): «Nuova» apre la conferma H1 di
      // PO-008, il nome della card riprende la partita.
      if (stato === 'libera' && formato[0] === 360 && formato[1] === 640 && m.dentroCard) {
        const aMeta = await apri(lingua, formato, 'liberaMeta');
        await aMeta.locator('.pl-sfida-avvio--libera .pl-sfida-avvio__nuova').click();
        await aMeta.waitForTimeout(300);
        const conferma = await aMeta.getByText(testi.conferma.liberaTesto).count();
        await aMeta.close();
        if (!conferma) errori.push(`${dove}: «${testi.home.nuovaBreve}» non apre la conferma «${testi.conferma.liberaTesto.slice(0, 30)}…» (PO-008)`);
        // Una pagina nuova: dopo la conferma la rotta non e' piu' la home.
        const altra = await apri(lingua, formato, stato);
        // A coordinate, come un dito: Playwright rifiuterebbe il click sullo <span>
        // proprio perche' sopra c'e' la superficie di «Riprendi ›», che e' il disegno.
        const sp = await altra.locator('.pl-sfida-avvio--libera > span').first().boundingBox();
        await altra.mouse.click(sp.x + 4, sp.y + sp.height / 2);
        const inGioco = await altra.waitForSelector('.pl-plancia .pl-cella', { timeout: 3000 }).then(() => true, () => false);
        await altra.close();
        if (!inGioco) errori.push(`${dove}: un tocco sul nome della card non riprende la partita`);
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

console.log('\nPO-009, PO-010 e PO-020: riga di spiegazione, nome fisso e «Riprendi ›», «Nuova» dentro la card');
console.table(tabella);
if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  [...new Set(errori)].forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nLa riga c\'e\' in italiano e in inglese, si legge, non allunga la home, la home non scorre'
  + ' in nessuno dei cinque stati, le card hanno il nome fisso con «Riprendi ›» e «Nuova» sta dentro la card della libera.');
