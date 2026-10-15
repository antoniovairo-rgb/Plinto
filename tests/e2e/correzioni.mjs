/**
 * Le correzioni del collaudo della 1.21.6 (rapporto sul ramo `collaudo-produzione`),
 * provate nel browser. Una prova per difetto, con il numero del rapporto:
 *
 *   B1  importare un salvataggio aggiorna subito la home (livello, avanzamento, record);
 *   B2  «Azzera i miei dati» toglie anche il record dalla home;
 *   B3  a mezzanotte la card della sfida passa al giorno nuovo senza ricaricare;
 *   B4  la sfida di ieri lasciata a meta' non fa dire «Riprendi la sfida» oggi;
 *   B5  un gesto annullato dal sistema (pointercancel) non posa il pezzo;
 *   B8  nei livelli con due obiettivi la frase non e' tagliata a 360 px;
 *   B10 i collegamenti in fondo alla home sono alti almeno 24 px da toccare.
 *
 * Uso: npm run correzioni
 */

import { chiudiAllUscita } from '../../tools/server-di-prova.mjs';
import { chromium } from 'playwright';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { impronta } from '../../src/persistence/salvataggio.js';
import { createGame, serializeGame } from '../../src/core/engine.js';

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
  if (!/4\.321/.test(home)) errori.push('B1: il record importato (4.321) non compare in home');
  await contesto.close();
}

// ---------- B2 ----------
console.log('B2. azzero i dati: il record sparisce anche dalla home...');
{
  const { contesto, page } = await apri({ dati: { records: { versione: 1, best: 4321, bestChain: 7, bestMove: 250, bestGroupsInOneMove: 3 } } });
  if (!/4\.321/.test(await testoHome(page))) errori.push('B2: il record di partenza non compare: la prova non prova nulla');
  await page.getByRole('button', { name: 'Impostazioni' }).click();
  await page.getByRole('button', { name: 'Azzera i miei dati' }).last().click();
  for (let i = 0; i < 3; i += 1) {
    const avanti = page.getByRole('button', { name: /^(Sì|Sì, azzera tutto)$/ });
    if (await avanti.count() === 0) break;
    await avanti.last().click();
  }
  await page.getByRole('button', { name: 'Indietro' }).first().click();
  await page.waitForSelector('.pl-home__menu');
  if (/4\.321/.test(await testoHome(page))) errori.push('B2: dopo l azzeramento la home mostra ancora il record 4.321');
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

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log('\nTutto a posto: le correzioni del collaudo tengono.');
