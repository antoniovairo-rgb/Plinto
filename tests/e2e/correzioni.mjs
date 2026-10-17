/**
 * Le correzioni del collaudo della 1.21.6 (rapporto sul ramo `collaudo-produzione`),
 * provate nel browser. Una prova per difetto, con il numero del rapporto:
 *
 *   B1  importare un salvataggio aggiorna subito la home (livello, avanzamento, record);
 *   B2  «Azzera i miei dati» toglie anche il record dalla home;
 *   B3  a mezzanotte la card della sfida passa al giorno nuovo senza ricaricare;
 *   B4  la sfida di ieri lasciata a meta' non fa dire «Riprendi la sfida» oggi;
 *   B5  un gesto annullato dal sistema (pointercancel) non posa il pezzo;
 *   B6  dopo una ricarica dentro un livello, Indietro fa mappa › home › uscita;
 *   B7  una Sfida del giorno giocata non da' un record alla Partita libera;
 *   B8  nei livelli con due obiettivi la frase non e' tagliata a 360 px;
 *   B10 i collegamenti in fondo alla home sono alti almeno 24 px da toccare.
 *
 * E quelle del collaudo della 1.21.7 (rapporto sul ramo `collaudo-1.21.7`):
 *
 *   C1  a 360x640 la home non scorre nemmeno con il pie' di pagina a capo, con qualunque font;
 *   C2  una sfida importata con numeri guasti non fa comparire «NaN» in Statistiche e Archivio.
 *
 * E quelle del collaudo della 1.21.8 (rapporto sul ramo `collaudo-1.21.8`):
 *
 *   D1  unendo, il record della Sfida non scende sotto il massimo dell'archivio;
 *   D2  «Sostituisci tutto» toglie i documenti locali che il file non contiene;
 *   D3  record, statistiche e sfide gia' guasti in localStorage non mostrano «NaN».
 *
 * Uso: npm run correzioni
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { impronta } from '../../src/persistence/salvataggio.js';
import { createGame, serializeGame } from '../../src/core/engine.js';
import { gridFromString } from '../../src/core/grid.js';
import { getShape } from '../../src/core/shapes.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-correzioni';
mkdirSync(OUT, { recursive: true });

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

/** Una pagina nuova con l'archivio preparato; `orologio` ferma il tempo a quell'istante. */
async function apri({ dati = {}, orologio = null, viewport = { width: 360, height: 640 } } = {}) {
  const contesto = await browser.newContext({ viewport, locale: 'it-IT', timezoneId: 'Europe/Rome' });
  const page = await contesto.newPage();
  page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
  if (orologio) await page.clock.install({ time: new Date(orologio) });
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.evaluate((d) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: 'it' }));
    for (const [k, v] of Object.entries(d)) window.localStorage.setItem(`plinto:${k}`, JSON.stringify(v));
  }, dati);
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  return { contesto, page };
}
const testoHome = (page) => page.locator('.pl-home').innerText();
// Il record si cerca senza separatore delle migliaia. Con i dati CLDR piu' recenti
// l'italiano non raggruppa i numeri di quattro cifre («4321», ma «14.321»): il Chromium
// di prova in locale scrive «4.321», quello piu' nuovo dell'integrazione continua no,
// e la 1.21.7 e' caduta li'. Si tolgono solo i separatori fra cifre.
const conRecord = (testo) => /(^|\D)4321(\D|$)/.test(testo.replace(/(\d)[.,\s\u00a0\u202f'](?=\d{3}(\D|$))/g, '$1'));
const riassunto = (testo) => testo.replace(/\s+/g, ' ').slice(0, 200);
const vinto = (n) => ({ mosse: 10 + n, punteggio: 100 * n, tentativi: 1 });

// ---------- B1 ----------
console.log('B1. importo un salvataggio: la home si aggiorna senza ricaricare...');
{
  const livelli = {};
  for (let n = 1; n <= 12; n += 1) livelli[n] = vinto(n);
  const dati = {
    quadri: { versione: 1, livelli },
    records: { versione: 1, best: 4321, bestChain: 7, bestMove: 250, bestGroupsInOneMove: 3 },
  };
  const file = `${OUT}/salvataggio.json`;
  writeFileSync(file, JSON.stringify({ gioco: 'plinto', formato: 1, versioneGioco: '1.21.6', impronta: impronta(dati), dati }));
  const { contesto, page } = await apri();
  await page.getByRole('button', { name: 'Impostazioni' }).click();
  const [scelta] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: /Scegli un file/ }).click(),
  ]);
  await scelta.setFiles(file);
  await page.getByRole('button', { name: /Unisci/ }).click();
  await page.getByRole('button', { name: 'Indietro' }).first().click();
  await page.waitForSelector('.pl-home__menu');
  const home = await testoHome(page);
  if (!/12 di 100/.test(home)) errori.push(`B1: dopo l importazione la home non dice «12 di 100»: ${home.replace(/\s+/g, ' ').slice(0, 160)}`);
  if (!/LIVELLO 13/i.test(home)) errori.push('B1: il pulsante grande non porta al livello 13');
  if (!conRecord(home)) errori.push(`B1: il record importato (4.321) non compare in home: ${riassunto(home)}`);
  await contesto.close();
}

// ---------- B2 ----------
console.log('B2. azzero i dati: il record sparisce anche dalla home...');
{
  const { contesto, page } = await apri({ dati: { records: { versione: 1, best: 4321, bestChain: 7, bestMove: 250, bestGroupsInOneMove: 3 } } });
  const partenza = await testoHome(page);
  if (!conRecord(partenza)) errori.push(`B2: il record di partenza non compare, la prova non prova nulla: ${riassunto(partenza)}`);
  await page.getByRole('button', { name: 'Impostazioni' }).click();
  await page.getByRole('button', { name: 'Azzera i miei dati' }).last().click();
  for (let i = 0; i < 3; i += 1) {
    const avanti = page.getByRole('button', { name: /^(Sì|Sì, azzera tutto)$/ });
    if (await avanti.count() === 0) break;
    await avanti.last().click();
  }
  await page.getByRole('button', { name: 'Indietro' }).first().click();
  await page.waitForSelector('.pl-home__menu');
  if (conRecord(await testoHome(page))) errori.push('B2: dopo l azzeramento la home mostra ancora il record 4.321');
  await contesto.close();
}

// ---------- B3 ----------
console.log('B3. home aperta a cavallo della mezzanotte: la card della sfida cambia giorno...');
{
  const { contesto, page } = await apri({
    orologio: '2026-10-15T23:58:30+02:00',
    dati: { sfide: { versione: 2, giorni: { '2026-10-15': { best: 395, partite: 1, regole: null } } } },
  });
  const card = page.locator('.pl-sfida-avvio--sfida');
  if (!/395/.test(await card.innerText())) errori.push('B3: prima di mezzanotte la card non mostra il risultato di oggi: la prova non prova nulla');
  await page.clock.runFor(3 * 60 * 1000);
  await page.waitForTimeout(200);
  if (/395/.test(await card.innerText())) errori.push('B3: dopo mezzanotte la card mostra ancora il risultato di ieri');
  await contesto.close();
}

// ---------- B4 ----------
console.log('B4. sfida di ieri lasciata a meta: oggi la home non dice «Riprendi la sfida»...');
{
  const ieri = serializeGame(createGame({ seed: '2026-10-15', now: 0 }));
  const { contesto, page } = await apri({ orologio: '2026-10-16T10:00:00+02:00', dati: { 'partita-sfida': ieri } });
  const card = await page.locator('.pl-sfida-avvio--sfida').innerText();
  if (/Riprendi/.test(card)) errori.push(`B4: con la sfida di ieri in sospeso la card dice «${card.split('\n')[0]}»`);
  await contesto.close();
  // E la sfida di OGGI lasciata a meta' si riprende ancora.
  const oggi = serializeGame(createGame({ seed: '2026-10-16', now: 0 }));
  const b = await apri({ orologio: '2026-10-16T10:00:00+02:00', dati: { 'partita-sfida': oggi } });
  if (!/Riprendi/.test(await b.page.locator('.pl-sfida-avvio--sfida').innerText())) errori.push('B4: la sfida di oggi in sospeso non si propone piu come «Riprendi»');
  await b.contesto.close();
}

// ---------- B5 ----------
console.log('B5. trascino un pezzo e il sistema annulla il gesto: il pezzo non si posa...');
{
  const { contesto, page } = await apri({ viewport: { width: 412, height: 915 } });
  await page.getByRole('button', { name: /^Partita libera/ }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  const piene = () => page.locator('.pl-plancia .pl-blocco').count();
  const prima = await piene();
  const pezzo = page.locator('.pl-tray .pl-pezzo').first();
  const p = await pezzo.boundingBox();
  const centro = await page.locator('.pl-plancia').boundingBox();
  await page.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
  await page.mouse.down();
  await page.mouse.move(centro.x + centro.width / 2, centro.y + centro.height / 2, { steps: 6 });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 1, bubbles: true })));
  await page.mouse.up();
  await page.waitForTimeout(300);
  const dopo = await piene();
  if (dopo !== prima) errori.push(`B5: dopo pointercancel le caselle piene passano da ${prima} a ${dopo}: il pezzo e stato posato`);
  await contesto.close();
}

// ---------- B6 ----------
console.log('B6. ricarico dentro un livello, poi Indietro: mappa, home, fuori...');
{
  // Una scheda nuova con una sola pagina prima del gioco: `apri` apre l'indirizzo due
  // volte, e il secondo Indietro dalla home finirebbe sulla prima copia invece di uscire.
  const { contesto, page: preparata } = await apri();
  await preparata.close();
  const page = await contesto.newPage();
  await page.goto('about:blank');
  await page.goto(INDIRIZZO, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  const dove = () => page.evaluate(() => (document.querySelector('.pl-plancia') ? 'livello'
    : document.querySelector('.pl-tappe') ? 'mappa' : document.querySelector('.pl-home') ? 'home' : '?'));
  await page.getByRole('button', { name: /Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').first().click();
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  if (await gioca.count()) await gioca.first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-plancia .pl-cella', { timeout: 5000 }).catch(() => {});
  const partenza = await dove();
  const passi = [];
  for (let i = 0; i < 6; i += 1) {
    await page.goBack({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(250);
    if (!page.url().startsWith(INDIRIZZO)) { passi.push('fuori'); break; }
    passi.push(await dove());
  }
  const atteso = 'mappa > home > fuori';
  if (partenza !== 'livello') errori.push(`B6: dopo la ricarica non si riparte dal livello (${partenza}): la prova non prova nulla`);
  else if (passi.join(' > ') !== atteso) errori.push(`B6: dopo una ricarica Indietro fa «${passi.join(' > ')}», atteso «${atteso}»`);
  else console.log(`  ${passi.join(' > ')}`);
  await contesto.close();
}

// ---------- B7 ----------
console.log('B7. finisco una Sfida del giorno: la Partita libera resta senza record...');
{
  // Una sfida di oggi a una mossa dalla fine: lo stesso schema di tests/e2e/partita.mjs
  // (due caselle vuote per riga, colonna e quadrante; il punto chiude la partita).
  const GIORNO = '2026-10-16';
  const base = createGame({ seed: GIORNO, now: 0 });
  const vuote = [
    [0, 0], [1, 3], [2, 6], [3, 1], [4, 4], [5, 7], [6, 2], [7, 5], [8, 8],
    [0, 4], [1, 7], [2, 1], [3, 5], [4, 8], [5, 2], [6, 6], [7, 0], [8, 3],
  ];
  const righe = Array.from({ length: 9 }, () => Array(9).fill('#'));
  vuote.forEach(([r, c]) => { righe[r][c] = '.'; });
  const quasiFinita = serializeGame({
    ...base,
    grid: gridFromString(righe.map((r) => r.join('')).join('\n')),
    hand: [
      { uid: 'x1', shapeId: 'p1', shape: getShape('p1'), color: 1 },
      { uid: 'x2', shapeId: 'b33', shape: getShape('b33'), color: 2 },
      { uid: 'x3', shapeId: 'h5', shape: getShape('h5'), color: 3 },
    ],
    score: 395,
  });
  const finisciLaSfida = async (page) => {
    await page.locator('.pl-sfida-avvio--sfida').click();
    await page.waitForSelector('.pl-plancia .pl-cella');
    const g = await page.evaluate(() => {
      const c = document.querySelectorAll('.pl-plancia .pl-cella')[0].getBoundingClientRect();
      const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
      return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 };
    });
    await page.mouse.move(g.px, g.py);
    await page.mouse.down();
    await page.mouse.move(g.cx, g.cy, { steps: 10 });
    await page.mouse.up();
    await page.waitForSelector('.pl-fine__numero', { timeout: 5000 });
    await page.getByRole('button', { name: /Torna alla home/ }).click();
    await page.waitForSelector('.pl-home__menu');
  };
  const orologio = `${GIORNO}T10:00:00+02:00`;

  // a) Chi non ha mai giocato la Partita libera: dopo la sfida deve leggere «Mai giocata».
  const a = await apri({ orologio, dati: { 'partita-sfida': quasiFinita } });
  await finisciLaSfida(a.page);
  const libera = await a.page.locator('.pl-sfida-avvio--libera').innerText();
  console.log(`   a) card della Partita libera dopo una sola sfida: «${riassunto(libera)}»`);
  if (!/Mai giocata/.test(libera)) errori.push(`B7: dopo una sola Sfida la Partita libera dice «${riassunto(libera)}» invece di «Mai giocata»`);
  const sfida = await a.page.locator('.pl-sfida-avvio--sfida').innerText();
  if (!/396/.test(sfida)) errori.push(`B7: la card della Sfida non mostra il 396 appena fatto (395 + 1 del punto): «${riassunto(sfida)}»`);
  await a.contesto.close();

  // b) Chi ha gia' un record: resta alla Partita libera, e la sfida non lo tocca.
  const b = await apri({
    orologio,
    dati: {
      'partita-sfida': quasiFinita,
      records: { versione: 1, best: 4321, bestChain: 7, bestMove: 250, bestGroupsInOneMove: 3 },
    },
  });
  await finisciLaSfida(b.page);
  const liberaB = await b.page.locator('.pl-sfida-avvio--libera').innerText();
  console.log(`   b) con un record di 4321 gia' salvato: «${riassunto(liberaB)}»`);
  if (!conRecord(liberaB)) errori.push(`B7: il record esistente non e' piu' della Partita libera: «${riassunto(liberaB)}»`);
  await b.contesto.close();
}

// ---------- B8 ----------
console.log('B8. livello con due obiettivi a 360x640: la frase non e tagliata...');
{
  const livelli = {};
  for (let n = 1; n <= 43; n += 1) livelli[n] = vinto(n);
  const { contesto, page } = await apri({ dati: { quadri: { versione: 1, livelli } } });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(43).click();
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-obiettivo__frase');
  const misura = await page.locator('.pl-obiettivo__frase').evaluate((el) => ({
    testo: el.textContent, tagliata: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
  }));
  await page.screenshot({ path: `${OUT}/b8-livello-44.png` });
  if (!/\+/.test(misura.testo)) errori.push(`B8: il livello 44 non ha due obiettivi («${misura.testo}»): la prova non prova nulla`);
  if (misura.tagliata) errori.push(`B8: la frase «${misura.testo}» e ancora tagliata a 360 px`);
  await contesto.close();
}

// ---------- B10 ----------
console.log('B10. collegamenti in fondo alla home: almeno 24 px da toccare...');
{
  const { contesto, page } = await apri();
  const altezze = await page.locator('.pl-home__pie .pl-home__sostieni').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  if (!altezze.length) errori.push('B10: collegamenti non trovati');
  for (const h of altezze) if (h < 24) errori.push(`B10: un collegamento in fondo alla home e alto ${h} px`);
  const scorre = await page.evaluate(() => { const el = document.querySelector('.pl-home'); return el.scrollHeight - el.clientHeight; });
  if (scorre > 0) errori.push(`B10: con il bersaglio piu grande la home scorre di ${scorre} px a 360x640`);
  await contesto.close();
}

// ---------- C1 ----------
console.log('C1. home a 360x640 con il pie di pagina a capo: non scorre, con qualunque font...');
{
  // Il difetto dipendeva dal font: con Inter (il ripiego dei container di prova) il pie'
  // a capo e' alto 32 px e la home scorreva di 2; con DejaVu e' alto 30 e non scorreva.
  // Per essere rosso in qualunque container, il caso peggiore si fabbrica: interlinea
  // fissa a 1.21 (quella di Inter) su tutta la home, cosi' le altezze non dipendono piu'
  // dal font, e il pie' forzato su due righe. Misurato con otto font (Inter, DejaVu Sans
  // e Serif, Liberation Sans, FreeSans, Carlito, Caladea): senza la correzione scorre di
  // 3 px con tutti, con la correzione di 0.
  const { contesto, page } = await apri();
  const scorre = () => page.evaluate(() => { const el = document.querySelector('.pl-home'); return el.scrollHeight - el.clientHeight; });
  const reale = await scorre();
  if (reale > 0) errori.push(`C1: con il font di questo container la home scorre di ${reale} px a 360x640`);
  await page.addStyleTag({ content: '.pl-home, .pl-home * { line-height: 1.21 !important; } .pl-home__pie .pl-home__sostieni { white-space: nowrap; }' });
  const righe = await page.evaluate(() => {
    const pie = document.querySelector('.pl-home__pie');
    pie.querySelector('.pl-home__sostieni').after(document.createElement('br'));
    return Math.round(pie.getBoundingClientRect().height / (12 * 1.21));
  });
  const peggio = await scorre();
  const altezze = await page.locator('.pl-home__pie .pl-home__sostieni').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
  // La stessa pagina senza la classe dell'interruttore: deve scorrere, o la prova non prova nulla.
  const acceso = await page.evaluate(() => document.documentElement.classList.contains('pl-home-stretta'));
  await page.evaluate(() => document.documentElement.classList.remove('pl-home-stretta'));
  const senza = await scorre();
  console.log(`   reale ${reale} px; caso peggiore (pie su ${righe} righe): ${peggio} px; senza la correzione: ${senza} px; collegamenti ${altezze.join(', ')} px`);
  if (!acceso) errori.push('C1: la radice non ha la classe pl-home-stretta (interruttore HOME_STRETTA_COMPATTA spento?)');
  if (righe < 2) errori.push('C1: il pie di pagina non e andato a capo: la prova non prova nulla');
  if (peggio > 0) errori.push(`C1: con il pie di pagina a capo la home scorre di ${peggio} px a 360x640`);
  if (senza <= 0) errori.push('C1: anche senza la correzione la home non scorre: la prova non prova nulla');
  for (const h of altezze) if (h < 24) errori.push(`C1: un collegamento in fondo alla home e alto ${h} px (B10 chiede 24)`);
  await contesto.close();
}

// ---------- C2 ----------
console.log('C2. importo sfide con numeri guasti: niente «NaN» in Statistiche e Archivio...');
{
  // Il caso «sfide strane» di collaudo/import-fuzz.mjs, incollato come farebbe chi gioca.
  const dati = {
    sfide: { versione: 2, giorni: { '2026-13-45': { best: 5 }, x: 1, '2026-10-10': { best: '99', partite: 'a' }, '2026-10-12': { best: 210, partite: 3, regole: null } } },
    attrezzi: { versione: 1, disponibili: '2', riscossi: 'x' },
  };
  const testo = JSON.stringify({ gioco: 'plinto', formato: 1, versioneGioco: '1.21.7', impronta: impronta(dati), dati });
  const { contesto, page } = await apri({ orologio: '2026-10-16T10:00:00+02:00' });
  await page.getByRole('button', { name: 'Impostazioni' }).click();
  await page.getByRole('button', { name: /Oppure incolla/ }).click();
  await page.locator('textarea').fill(testo);
  await page.getByRole('button', { name: /^Leggi/ }).click();
  await page.getByRole('button', { name: /^Sostituisci tutto/ }).click();
  await page.getByRole('button', { name: /^Sì$/ }).click();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  let visti = 0;
  for (const schermata of ['Statistiche', 'Archivio delle sfide']) {
    await page.getByRole('button', { name: schermata }).first().click();
    await page.waitForTimeout(300);
    const t = await page.locator('body').innerText();
    const guasto = t.match(/NaN|undefined|Infinity/);
    if (guasto) errori.push(`C2: in ${schermata} compare «${guasto[0]}»: ${riassunto(t)}`);
    if (/210/.test(t)) visti += 1;
    await page.getByRole('button', { name: 'Indietro' }).first().click();
    await page.waitForSelector('.pl-home__menu');
  }
  // La voce buona deve arrivare: senza, «niente NaN» vorrebbe solo dire «niente importato».
  if (!visti) errori.push('C2: il giorno buono (210 punti) non compare ne in Statistiche ne nell Archivio: la prova non prova nulla');
  await contesto.close();
}

// ---------- D1, D2, D3 (collaudo 1.21.8) ----------

/** Incolla un salvataggio e sceglie Unisci o Sostituisci, come farebbe chi gioca. */
async function importaIncollando(page, dati, modo) {
  const testo = JSON.stringify({ gioco: 'plinto', formato: 1, versioneGioco: '1.21.7', impronta: impronta(dati), dati });
  await page.getByRole('button', { name: 'Impostazioni' }).click();
  await page.getByRole('button', { name: /Oppure incolla/ }).click();
  await page.locator('textarea').fill(testo);
  await page.getByRole('button', { name: /^Leggi/ }).click();
  if (modo === 'sostituisci') {
    await page.getByRole('button', { name: /^Sostituisci tutto/ }).click();
    await page.getByRole('button', { name: /^Sì$/ }).click();
  } else {
    await page.getByRole('button', { name: /^Unisci ai miei/ }).click();
  }
  await page.waitForTimeout(300);
}
const leggiTutto = (page) => page.evaluate(() => Object.fromEntries(
  Object.keys(window.localStorage).filter((k) => k.startsWith('plinto:'))
    .map((k) => [k.slice(7), JSON.parse(window.localStorage.getItem(k))]),
));
async function testoStatistiche(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu');
  await page.getByRole('button', { name: 'Statistiche' }).first().click();
  await page.waitForTimeout(300);
  return page.locator('body').innerText();
}
const ARCHIVIO = { versione: 2, giorni: { '2026-10-10': { best: 900, partite: 2, regole: null }, '2026-10-11': { best: 300, partite: 1, regole: null } } };
const STAT = { versione: 1, partite: 4, punteggioTotale: 2000, mosseTotali: 40, gruppiTotali: 8, griglieSvuotate: 0, tempoTotaleMs: 600000 };

console.log('D1. unisco un file con record della Sfida 100 su un archivio con 900: il record resta 900...');
{
  const { contesto, page } = await apri({ dati: { sfide: ARCHIVIO, statistiche: STAT }, orologio: '2026-10-16T10:00:00+02:00' });
  await importaIncollando(page, { 'records-sfida': { versione: 1, best: 100, bestChain: 0, bestMove: 0, bestGroupsInOneMove: 0 } }, 'unisci');
  const s = await leggiTutto(page);
  console.log('  records-sfida dopo Unisci:', JSON.stringify(s['records-sfida']));
  if (!(s['records-sfida']?.best >= 900)) errori.push(`D1: dopo Unisci records-sfida.best = ${s['records-sfida']?.best}, atteso 900`);
  const t = await testoStatistiche(page);
  const riga = t.match(/Record della Sfida del giorno\s*([\d.,\s]+)/)?.[1]?.replace(/\D/g, '');
  console.log('  Statistiche, Record della Sfida del giorno:', riga);
  if (riga !== '900') errori.push(`D1: Statistiche mostra il record della Sfida «${riga}», atteso 900`);
  await contesto.close();
}

console.log('D2. sostituisco con un file senza records-sfida, sfide e statistiche: quelli locali spariscono...');
{
  const { contesto, page } = await apri({
    dati: { 'records-sfida': { versione: 1, best: 5000, bestChain: 1, bestMove: 1, bestGroupsInOneMove: 1 }, sfide: ARCHIVIO, statistiche: STAT },
    orologio: '2026-10-16T10:00:00+02:00',
  });
  await importaIncollando(page, { records: { versione: 1, best: 50, bestChain: 1, bestMove: 1, bestGroupsInOneMove: 1 }, quadri: { versione: 1, livelli: { 1: vinto(1) } } }, 'sostituisci');
  const s = await leggiTutto(page);
  console.log('  dopo Sostituisci:', JSON.stringify({ rs: s['records-sfida'], sf: s.sfide, st: s.statistiche, r: s.records?.best, settings: Boolean(s.settings) }));
  for (const via of ['records-sfida', 'sfide', 'statistiche']) {
    if (s[via] !== undefined) errori.push(`D2: dopo «Sostituisci tutto» resta il documento locale «${via}»: ${JSON.stringify(s[via])}`);
  }
  if (s.records?.best !== 50) errori.push(`D2: il record del file (50) non e' arrivato: ${JSON.stringify(s.records)}`);
  if (!s.settings) errori.push('D2: le impostazioni sono sparite, e non dovevano');
  await contesto.close();
}

console.log('D3. dati gia guasti in localStorage: niente «NaN» ne «undefined» in Statistiche...');
{
  const { contesto, page } = await apri({
    dati: {
      records: { versione: 1, best: 'x', bestChain: 2, bestMove: -5, bestGroupsInOneMove: 1 },
      statistiche: { ...STAT, punteggioTotale: 'a' },
      sfide: { versione: 2, giorni: { '2026-10-10': { best: '99', regole: null }, '2026-10-12': { best: 210, partite: 3, regole: null } } },
    },
    orologio: '2026-10-16T10:00:00+02:00',
  });
  const t = await testoStatistiche(page);
  const guasto = t.match(/NaN|undefined|Infinity|-5/);
  console.log('  Statistiche:', riassunto(t));
  if (guasto) errori.push(`D3: in Statistiche compare «${guasto[0]}»: ${riassunto(t)}`);
  // La voce buona deve restare: senza, «niente NaN» vorrebbe dire «niente di niente».
  if (!/210 \(3\)/.test(t)) errori.push('D3: il giorno buono (210, 3 partite) non compare: la prova non prova nulla');
  await contesto.close();
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log('\nTutto a posto: le correzioni del collaudo tengono.');
