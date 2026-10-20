/**
 * Collaudo 1.21.18: le prove "a mano" della card della Partita libera (PO-020) e della
 * pillola «Gioca ›» (PO-021), scritte come script per poterle rifare. NON e' nel gate:
 * e' il verbale del collaudo (docs/sviluppo/COLLAUDO-1.21.18.md).
 *
 * Uso: PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/ node docs/sviluppo/collaudo-1.21.18/prove-a-mano.mjs
 * Scrive il risultato in JSON su stdout (ultima riga) e le schermate in PLINTO_E2E_OUT.
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import testiIt from '../../../src/i18n/it.js';
import testiEn from '../../../src/i18n/en.js';
import { createGame, serializeGame, canPlaceHandPiece, placePiece } from '../../../src/core/engine.js';
import { giornoDiOggi } from '../../../src/core/sfida.js';

const URL = process.env.PLINTO_E2E_URL ?? 'http://localhost:4173/';
const OUT = process.env.PLINTO_E2E_OUT ?? null;
if (OUT) mkdirSync(OUT, { recursive: true });
const LINGUE = { it: testiIt, en: testiEn };
const FORMATI = [
  { nome: '320x700', w: 320, h: 700, tocco: true },
  { nome: '360x640', w: 360, h: 640, tocco: true },
  { nome: '390x844', w: 390, h: 844, tocco: true },
  { nome: '412x915', w: 412, h: 915, tocco: true },
  { nome: 'PC 1366x768', w: 1366, h: 768, tocco: false },
];

// Partite vere, come in tests/e2e/home-spiegazione.mjs.
const LIBERA_ZERO = serializeGame(createGame({ seed: 'collaudo-zero', now: 0 }));
const LIBERA_META = (() => {
  const s = createGame({ seed: 'collaudo-meta', now: 0 });
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (canPlaceHandPiece(s, 0, r, c)) return serializeGame(placePiece(s, 0, r, c, 0));
  }
  throw new Error('nessuna mossa');
})();

/** La sfida di oggi giocata col primo posto libero fino all'ultima mossa: lo stato prima e la mossa. */
function sfidaAllUltimaMossa() {
  let s = createGame({ seed: giornoDiOggi(), now: 0 });
  let prima = null; let mossa = null;
  for (let n = 0; n < 2000 && s.status === 'playing'; n += 1) {
    let trovata = null;
    for (let h = 0; h < s.hand.length && !trovata; h += 1) {
      if (!s.hand[h]) continue;
      for (let r = 0; r < 9 && !trovata; r += 1) for (let c = 0; c < 9 && !trovata; c += 1) {
        if (canPlaceHandPiece(s, h, r, c)) trovata = { handIndex: h, row: r, col: c };
      }
    }
    if (!trovata) break;
    prima = s; mossa = trovata;
    s = placePiece(s, trovata.handIndex, trovata.row, trovata.col, n * 1000);
  }
  return { prima: serializeGame(prima), mossa, finale: s.status, punti: s.score };
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const risultati = [];
const nota = (r) => { risultati.push(r); console.error(JSON.stringify(r)); };

async function apri(formato, lingua, prep) {
  const ctx = await browser.newContext({
    viewport: { width: formato.w, height: formato.h }, locale: lingua,
    isMobile: formato.tocco, hasTouch: formato.tocco, deviceScaleFactor: formato.tocco ? 2 : 1,
  });
  const page = await ctx.newPage();
  const errori = [];
  page.on('pageerror', (e) => errori.push(e.message));
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.evaluate(([l, p]) => {
    localStorage.clear();
    localStorage.setItem('plinto:settings', JSON.stringify({
      versione: 2, introVista: true, lingua: l, audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true,
    }));
    for (const [k, v] of Object.entries(p)) localStorage.setItem(k, JSON.stringify(v));
  }, [lingua, prep]);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.pl-home__azioni');
  return { ctx, page, errori };
}

async function tocca(page, formato, x, y) {
  if (formato.tocco) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
  await page.waitForTimeout(500);
}

/** Dove siamo dopo un'azione. */
async function dove(page, t) {
  await page.waitForTimeout(300);
  return page.evaluate((titolo) => {
    const dlg = document.querySelector('[role="dialog"]');
    if (dlg) return { schermo: dlg.getAttribute('aria-label') === titolo ? 'conferma-libera' : `dialogo:${dlg.getAttribute('aria-label')}` };
    if (document.querySelector('.pl-plancia')) {
      const p = JSON.parse(localStorage.getItem('plinto:partita') ?? 'null');
      const sf = JSON.parse(localStorage.getItem('plinto:partita-sfida') ?? 'null');
      return { schermo: 'gioco', seedLibera: p?.seed ?? null, pieneLibera: p ? p.grid.filter((v) => v).length : null, seedSfida: sf?.seedLabel ?? null };
    }
    if (document.querySelector('.pl-home__azioni')) return { schermo: 'home' };
    return { schermo: 'altro', testo: document.body.innerText.slice(0, 80) };
  }, t.conferma.liberaTitolo);
}

const pienePrima = LIBERA_META.grid.filter((v) => v).length;

for (const lingua of ['it', 'en']) {
  const t = LINGUE[lingua];
  for (const f of FORMATI) {
    const caso = (nome, esito, ok, extra = {}) => nota({ lingua, formato: f.nome, caso: nome, esito, ok, ...extra });

    // 1. «Nuova» a zero mosse: comincia subito, senza conferma.
    {
      const { ctx, page, errori } = await apri(f, lingua, { 'plinto:partita': LIBERA_ZERO });
      const b = await page.locator('.pl-sfida-avvio__nuova').boundingBox();
      await tocca(page, f, b.x + b.width / 2, b.y + b.height / 2);
      const d = await dove(page, t);
      caso('Nuova, 0 mosse', d, d.schermo === 'gioco' && d.seedLibera !== LIBERA_ZERO.seed, { errori });
      await ctx.close();
    }
    // 2. «Nuova» con una mossa: conferma, poi «Riprendi la partita» e poi «Nuova partita».
    {
      const { ctx, page, errori } = await apri(f, lingua, { 'plinto:partita': LIBERA_META });
      const b = await page.locator('.pl-sfida-avvio__nuova').boundingBox();
      await tocca(page, f, b.x + b.width / 2, b.y + b.height / 2);
      const d1 = await dove(page, t);
      const testo = await page.locator('[role="dialog"] .pl-azzera__testo').textContent().catch(() => null);
      const fuoco = await page.evaluate(() => document.activeElement?.textContent ?? null);
      if (OUT && lingua === 'it') await page.screenshot({ path: `${OUT}/conferma-${f.nome.replace(/\W/g, '')}.png` });
      caso('Nuova, 1 mossa: conferma', { ...d1, testo, fuocoSu: fuoco }, d1.schermo === 'conferma-libera' && testo === t.conferma.liberaTesto, { errori });
      const torna = page.getByRole('button', { name: t.conferma.riprendiLibera, exact: true });
      const bt = await torna.boundingBox();
      await tocca(page, f, bt.x + bt.width / 2, bt.y + bt.height / 2);
      const d2 = await dove(page, t);
      caso('conferma → «Riprendi la partita»', d2, d2.schermo === 'gioco' && d2.seedLibera === LIBERA_META.seed && d2.pieneLibera === pienePrima, { errori });
      await ctx.close();

      const s2 = await apri(f, lingua, { 'plinto:partita': LIBERA_META });
      const b2 = await s2.page.locator('.pl-sfida-avvio__nuova').boundingBox();
      await tocca(s2.page, f, b2.x + b2.width / 2, b2.y + b2.height / 2);
      const nuova = s2.page.getByRole('button', { name: t.conferma.nuovaLibera, exact: true });
      const bn = await nuova.boundingBox();
      await tocca(s2.page, f, bn.x + bn.width / 2, bn.y + bn.height / 2);
      const d3 = await dove(s2.page, t);
      caso('conferma → «Nuova partita»', d3, d3.schermo === 'gioco' && d3.seedLibera !== LIBERA_META.seed, { errori: s2.errori });
      await s2.ctx.close();
    }
    // 3. Tocchi sulla card: pillola «Riprendi ›», nome, spazio vuoto, riga di spiegazione.
    const punti = {
      'pillola «Riprendi ›»': (m) => [m.rip.x + m.rip.width / 2, m.rip.y + m.rip.height / 2],
      'nome della card': (m) => [m.nome.x + 6, m.nome.y + m.nome.height / 2],
      'spazio fra nome e «Nuova»': (m) => [(m.nome.x + m.nome.width + m.nuova.x) / 2, m.nuova.y + m.nuova.height / 2],
      'riga di spiegazione, a sinistra': (m) => [m.spiega.x + 6, m.spiega.y + m.spiega.height / 2],
      'riga di spiegazione, sotto «Nuova»': (m) => [m.nuova.x + m.nuova.width / 2, m.spiega.y + m.spiega.height / 2],
      'riga di spiegazione, sotto «Riprendi ›»': (m) => [m.rip.x + m.rip.width / 2, m.spiega.y + m.spiega.height / 2],
      'bordo basso della card sotto «Nuova»': (m) => [m.nuova.x + m.nuova.width / 2, m.card.y + m.card.height - 2],
    };
    for (const [nome, punto] of Object.entries(punti)) {
      const { ctx, page, errori } = await apri(f, lingua, { 'plinto:partita': LIBERA_META });
      const m = await page.evaluate(() => {
        const box = (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
        const card = document.querySelector('.pl-sfida-avvio--doppia');
        return {
          card: box(card), nome: box(card.querySelector(':scope > span')),
          nuova: box(card.querySelector('.pl-sfida-avvio__nuova')), rip: box(card.querySelector('.pl-sfida-avvio__riprendi')),
          spiega: box(card.querySelector('.pl-sfida-avvio__spiega')),
        };
      });
      const [x, y] = punto(m);
      const colpito = await page.evaluate(([px, py]) => {
        const e = document.elementFromPoint(px, py);
        const b = e?.closest('button');
        return b ? (b.getAttribute('aria-label') ?? b.textContent) : e?.className ?? null;
      }, [x, y]);
      await tocca(page, f, x, y);
      const d = await dove(page, t);
      // Le due domande aperte («dove arriva?»): si registra, non si giudica.
      const esplorativo = nome.startsWith('riga di spiegazione, sotto «Nuova»') || nome.startsWith('bordo');
      const atteso = nome.includes('Nuova') && !nome.startsWith('spazio') ? 'conferma-libera' : 'gioco';
      caso(`tocco: ${nome}`, { ...d, punto: [Math.round(x), Math.round(y)], elementoSottoIlDito: colpito }, esplorativo ? null : (atteso === 'gioco' ? d.schermo === 'gioco' && d.seedLibera === LIBERA_META.seed : d.schermo === atteso), { errori, misure: nome === 'pillola «Riprendi ›»' ? m : undefined });
      if (OUT && nome === 'nome della card' && lingua === 'it') {
        // schermata della home prima del tocco, per il rapporto
      }
      await ctx.close();
    }
    // Schermata della home con la libera a meta'.
    if (OUT) {
      const { ctx, page } = await apri(f, lingua, { 'plinto:partita': LIBERA_META });
      await page.screenshot({ path: `${OUT}/home-libera-${lingua}-${f.nome.replace(/\W/g, '')}.png` });
      await ctx.close();
    }
    // 4. Tastiera: ordine dei fuochi dall'inizio della pagina, Invio su «Nuova» e su «Riprendi ›».
    {
      const { ctx, page, errori } = await apri(f, lingua, { 'plinto:partita': LIBERA_META });
      const ordine = [];
      for (let i = 0; i < 12; i += 1) {
        await page.keyboard.press('Tab');
        ordine.push(await page.evaluate(() => {
          const e = document.activeElement;
          if (!e || e === document.body) return '(body)';
          const anello = e.matches(':focus-visible');
          return `${e.getAttribute('aria-label') ?? e.textContent.trim().slice(0, 30)}${anello ? '' : ' [senza :focus-visible]'}`;
        }));
      }
      caso('Tab: ordine dei fuochi', { ordine }, true, { errori });
      await page.locator('.pl-sfida-avvio__nuova').focus();
      await page.keyboard.press('Enter');
      const d1 = await dove(page, t);
      const fuocoDialogo = await page.evaluate(() => document.activeElement?.textContent ?? null);
      caso('Invio su «Nuova»', { ...d1, fuocoDialogo }, d1.schermo === 'conferma-libera', { errori });
      await page.keyboard.press('Escape');
      const d2 = await dove(page, t);
      const fuocoDopo = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? null);
      caso('Esc sulla conferma', { ...d2, fuocoDopo }, d2.schermo === 'home', { errori });
      await page.locator('.pl-sfida-avvio__riprendi').focus();
      // L'anello del fuoco: sulla card intera (::after di «Riprendi ›»).
      const anello = await page.evaluate(() => getComputedStyle(document.querySelector('.pl-sfida-avvio__riprendi'), '::after').outlineStyle);
      await page.keyboard.press('Enter');
      const d3 = await dove(page, t);
      caso('Invio su «Riprendi ›»', { ...d3, anelloDopoFocusDaScript: anello }, d3.schermo === 'gioco' && d3.seedLibera === LIBERA_META.seed, { errori });
      await ctx.close();
    }
    // 5. Lettore di schermo: l'albero di accessibilita' delle azioni.
    {
      const { ctx, page } = await apri(f, lingua, { 'plinto:partita': LIBERA_META });
      const albero = await page.locator('.pl-home__azioni').ariaSnapshot();
      const descr = await page.locator('.pl-sfida-avvio__riprendi').evaluate((e) => {
        const ids = (e.getAttribute('aria-describedby') ?? '').split(' ');
        return ids.map((i) => document.getElementById(i)?.textContent).join(' ');
      });
      caso('albero di accessibilita\'', { albero, descrizioneRiprendi: descr }, true);
      await ctx.close();
    }
    // 6. Sfida: «Gioca ›» apre la sfida di oggi; iniziata -> «Riprendi ›»; finita -> record.
    {
      const { ctx, page, errori } = await apri(f, lingua, {});
      const pill = page.locator('.pl-sfida-avvio--sfida .pl-sfida-avvio__esito');
      const statoPrima = { testo: await pill.textContent(), classi: await pill.getAttribute('class') };
      const b = await pill.boundingBox();
      await tocca(page, f, b.x + b.width / 2, b.y + b.height / 2);
      const d = await dove(page, t);
      const testata = await page.locator('header, .pl-hud, .pl-gioco__testata').first().innerText().catch(() => null);
      caso('«Gioca ›» → sfida', { statoPrima, ...d, testata: testata?.replace(/\s+/g, ' ').slice(0, 120) }, d.schermo === 'gioco' && statoPrima.testo === t.home.giocaStato);
      // Torna alla home senza mosse, poi con una mossa.
      await page.goBack().catch(() => {}); await page.waitForTimeout(600);
      const dopoZero = await dove(page, t);
      const statoZero = dopoZero.schermo === 'home' ? await pill.textContent() : null;
      caso('sfida aperta senza mosse, indietro', { ...dopoZero, statoCard: statoZero }, true, { errori });
      await ctx.close();
    }
    {
      const { prima, mossa, finale, punti: puntiFinali } = sfidaAllUltimaMossa();
      const { ctx, page, errori } = await apri(f, lingua, { 'plinto:partita-sfida': prima });
      const pill = page.locator('.pl-sfida-avvio--sfida .pl-sfida-avvio__esito');
      const iniziata = { testo: await pill.textContent(), nome: await page.locator('.pl-sfida-avvio--sfida').getAttribute('aria-label') };
      caso('sfida iniziata: la card', iniziata, iniziata.testo === t.home.riprendiStato);
      const b = await pill.boundingBox();
      await tocca(page, f, b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForSelector('.pl-plancia');
      // L'ultima mossa trascinata col mouse (come tests/e2e/schermi.mjs).
      const p = await page.evaluate(({ handIndex, row, col }) => {
        const pezzo = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex]?.querySelector('.pl-pezzo');
        if (!pezzo) return null;
        const rp = pezzo.getBoundingClientRect();
        const ct = pezzo.firstElementChild.getBoundingClientRect();
        const celle = document.querySelectorAll('.pl-plancia .pl-cella');
        const c0 = celle[0].getBoundingClientRect();
        const passo = (celle[8].getBoundingClientRect().left - c0.left) / 8;
        const px = rp.left + rp.width / 2; const py = rp.top + rp.height / 2;
        return { px, py, cx: c0.left + col * passo + ((px - rp.left) / ct.width) * c0.width, cy: c0.top + row * passo + ((py - rp.top) / ct.height) * c0.height };
      }, mossa);
      let finita = null;
      if (p) {
        // Col mouse anche nei formati telefono: col dito (eventi touch del protocollo) il
        // pezzo non si e' appoggiato al primo giro, punteggio fermo (vedi il rapporto).
        await page.mouse.move(p.px, p.py); await page.mouse.down();
        await page.mouse.move(p.cx, p.cy, { steps: 6 }); await page.mouse.up();
        await page.waitForTimeout(2500);
        finita = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:sfide') ?? '{}'));
      }
      // Alla home: ricarico la pagina (la partita finita non si riprende).
      await page.goto(URL, { waitUntil: 'networkidle' });
      await page.waitForSelector('.pl-home__azioni', { timeout: 8000 }).catch(() => {});
      const card = await page.evaluate(() => {
        const e = document.querySelector('.pl-sfida-avvio--sfida .pl-sfida-avvio__esito');
        if (!e) return null;
        const s = getComputedStyle(e);
        return { testo: e.textContent, classi: e.className, fondo: s.backgroundColor, nome: e.closest('button').getAttribute('aria-label') };
      });
      const oggi = giornoDiOggi();
      const registrata = finita?.giorni?.[oggi] ?? null;
      const dopoFine = card ? null : await page.evaluate(() => ({ url: location.href, testo: document.body.innerText.slice(0, 160) }));
      caso('sfida finita: la card', { motore: { finale, puntiFinali }, registrata, card, dopoFine },
        !!card && !!registrata && card.testo.includes(String(registrata.best).slice(-3)) && !card.classi.includes('riprendi') && /rgba\(0, 0, 0, 0\)|transparent/.test(card.fondo), { errori });
      if (OUT && lingua === 'it') await page.screenshot({ path: `${OUT}/home-sfida-finita-${f.nome.replace(/\W/g, '')}.png` });
      await ctx.close();
    }
  }
}

await browser.close();
console.log(JSON.stringify(risultati));
