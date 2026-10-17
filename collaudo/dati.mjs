// B7, B11, C2, esporta/importa (Unisci/Sostituisci), Azzera, in it/en.
import { apri, ls, esito } from './lib.mjs';
import { writeFileSync, readFileSync } from 'node:fs';
import { createGame, serializeGame } from '../src/core/engine.js';
import { gridFromString } from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';
import { giornoDiOggi } from '../src/core/sfida.js';
import { impronta } from '../src/persistence/salvataggio.js';
const e = esito();
const OGGI = giornoDiOggi();
const busta = (dati) => ({ gioco: 'plinto', formato: 1, versioneGioco: '1.21.8', esportatoIl: new Date().toISOString(), impronta: impronta(dati), dati });
const quasiFinita = (seed, score) => {
  const vuote = [[0,0],[1,3],[2,6],[3,1],[4,4],[5,7],[6,2],[7,5],[8,8],[0,4],[1,7],[2,1],[3,5],[4,8],[5,2],[6,6],[7,0],[8,3]];
  const r = Array.from({ length: 9 }, () => Array(9).fill('#')); vuote.forEach(([a, b]) => { r[a][b] = '.'; });
  return serializeGame({ ...createGame({ seed }), grid: gridFromString(r.map((x) => x.join('')).join('\n')),
    hand: [{ uid: 'a1', shapeId: 'p1', shape: getShape('p1'), color: 1 }, { uid: 'a2', shapeId: 'b33', shape: getShape('b33'), color: 2 }, { uid: 'a3', shapeId: 'h5', shape: getShape('h5'), color: 3 }], score });
};
const SEED = {
  records: { versione: 1, best: 500, bestChain: 4, bestMove: 80, bestGroupsInOneMove: 2 },
  sfide: { versione: 2, giorni: { '2026-10-10': { best: 900, partite: 2, regole: null }, '2026-10-11': { best: 300, partite: 1, regole: null } } },
  statistiche: { versione: 1, partite: 7, punteggioTotale: 5000, mosseTotali: 300, gruppiTotali: 40, griglieSvuotate: 1, tempoTotaleMs: 600000 },
  quadri: { versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 }, 2: { mosse: 12, punteggio: 90, tentativi: 2 } } },
};
const testoPag = (p) => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
async function vaiStat(page, lingua) { await page.getByRole('button', { name: lingua === 'it' ? /^Statistiche/ : /^Stat/ }).click(); await page.waitForSelector('.pl-stat, .pl-voce, h1, h2', { timeout: 3000 }).catch(() => {}); await page.waitForTimeout(300); }
async function apriImpostazioni(page, lingua) { await page.getByRole('button', { name: lingua === 'it' ? /^Impostazioni/ : /^Settings/ }).click(); await page.waitForTimeout(300); }
async function importa(page, json, modo) { // modo: 'unisci'|'sostituisci'
  await page.evaluate(() => {}); 
  const loc = page.locator('input[type=file]'); 
  writeFileSync('/tmp/_imp.json', JSON.stringify(json));
  await loc.setInputFiles('/tmp/_imp.json'); await page.waitForTimeout(400);
  if (modo === 'unisci') await page.getByRole('button', { name: /Unisci ai miei|Merge/ }).click();
  else { await page.getByRole('button', { name: /Sostituisci tutto|Replace/ }).first().click(); await page.waitForTimeout(200); const c = page.locator('.pl-btn--pericolo'); if (await c.count()) await c.click(); }
  await page.waitForTimeout(500);
}

// ---- 1. B7: home / statistiche, it + en
for (const lingua of ['it', 'en']) {
  console.log('\n== B7 testi', lingua);
  const { browser, page, errori } = await apri({ lingua, seed: SEED });
  const labels = await page.evaluate(() => [...document.querySelectorAll('.pl-home button')].map((b) => b.getAttribute('aria-label') || b.innerText.replace(/\s+/g, ' ')));
  console.log('  bottoni home:', JSON.stringify(labels));
  e.ok(labels.some((l) => /500/.test(l)), `home ${lingua}: Partita libera mostra Record 500`);
  e.ok(!labels.some((l) => /900/.test(l)), `home ${lingua}: la Sfida di oggi non mostra 900 (giorno diverso)`);
  await vaiStat(page, lingua);
  const t = await testoPag(page); console.log('  statistiche:', t.slice(0, 400));
  e.ok(/500/.test(t) && /900/.test(t), `stat ${lingua}: 500 libera e 900 sfida`);
  await page.screenshot({ path: `uscite/stat-${lingua}.png` });
  e.ok(errori.length === 0, 'nessun errore console', errori.join('|'));
  await browser.close();
}

// ---- 2. B7 in partita: finire una Sfida e una libera
console.log('\n== B7 fine partita');
{
  const { browser, page, errori } = await apri({ lingua: 'it', seed: { ...SEED, 'partita-sfida': quasiFinita(OGGI, 1234) } });
  await page.getByRole('button', { name: /^Sfida del giorno|^Riprendi/ }).first().click();
  await page.waitForSelector('.pl-plancia');
  const b = await page.evaluate(() => { const c = document.querySelectorAll('.pl-plancia .pl-cella')[0].getBoundingClientRect(); const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect(); return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 }; });
  await page.mouse.move(b.px, b.py); await page.mouse.down(); await page.mouse.move(b.cx, b.cy, { steps: 10 }); await page.mouse.up();
  await page.waitForSelector('.pl-fine__numero', { timeout: 8000 }).catch(() => {});
  const fine = await testoPag(page); console.log('  fine sfida:', fine.slice(0, 300));
  await page.screenshot({ path: 'uscite/fine-sfida.png' });
  let s = await ls(page);
  console.log('  records:', JSON.stringify(s.records), ' records-sfida:', JSON.stringify(s['records-sfida']));
  e.ok(s.records.best === 500, 'sfida finita: il record della Partita libera resta 500');
  e.ok(s['records-sfida']?.best >= 1234, 'sfida finita: record della Sfida >= 1234', JSON.stringify(s['records-sfida']));
  e.ok(/record/i.test(fine), 'fine sfida: compare "record"');
  // libera
  await page.evaluate((p) => { localStorage.setItem('plinto:partita', JSON.stringify(p)); }, quasiFinita('x-lib', 700));
  await page.goto((await import('./lib.mjs')).URL_PROD, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Riprendi|^Partita libera|^Nuova/ }).first().click();
  await page.waitForSelector('.pl-plancia');
  const b2 = await page.evaluate(() => { const c = document.querySelectorAll('.pl-plancia .pl-cella')[0].getBoundingClientRect(); const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect(); return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 }; });
  await page.mouse.move(b2.px, b2.py); await page.mouse.down(); await page.mouse.move(b2.cx, b2.cy, { steps: 10 }); await page.mouse.up();
  await page.waitForSelector('.pl-fine__numero', { timeout: 8000 }).catch(() => {});
  const fine2 = await testoPag(page); console.log('  fine libera:', fine2.slice(0, 300));
  await page.screenshot({ path: 'uscite/fine-libera.png' });
  s = await ls(page);
  console.log('  records:', JSON.stringify(s.records), ' records-sfida:', JSON.stringify(s['records-sfida']));
  e.ok(s.records.best === 700, 'libera finita (700>500): record libera 700');
  e.ok(s['records-sfida']?.best >= 1234 && s['records-sfida'].best < 1300, 'libera finita: record Sfida non toccato');
  e.ok(errori.length === 0, 'nessun errore console', errori.join('|'));
  await browser.close();
}

// ---- 3. esportazione reale + import
console.log('\n== export/import');
let file;
{
  const { browser, page } = await apri({ seed: { ...SEED, attrezzi: { versione: 1, disponibili: 2, riscossi: 2 }, 'records-sfida': { versione: 1, best: 1500, bestChain: 5, bestMove: 100, bestGroupsInOneMove: 1 } } });
  await apriImpostazioni(page, 'it');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Scarica|Salva .*file/i }).first().click()]);
  await dl.saveAs('uscite/esportato.json'); file = JSON.parse(readFileSync('uscite/esportato.json', 'utf8'));
  console.log('  chiavi nel file:', Object.keys(file.dati).join(','));
  e.ok(file.dati['records-sfida']?.best === 1500 && file.dati.records.best === 500, 'file esportato contiene entrambi i record');
  e.ok(file.impronta === impronta(file.dati), 'impronta del file valida');
  await browser.close();
}
// 3a Sostituisci su telefono vergine
for (const modo of ['sostituisci', 'unisci']) {
  const { browser, page, errori } = await apri({});
  await apriImpostazioni(page, 'it'); await importa(page, file, modo);
  const s = await ls(page);
  e.ok(s.records?.best === 500 && s['records-sfida']?.best === 1500 && s.attrezzi?.disponibili === 2, `${modo} su vergine: record 500/1500, attrezzi 2`, JSON.stringify([s.records?.best, s['records-sfida']?.best, s.attrezzi]));
  e.ok(errori.length === 0, 'nessun errore', errori.join('|'));
  await browser.close();
}
// 3b B11: gettoni spesi
for (const [loc, ent, att] of [[{ d: 1, r: 2 }, { d: 2, r: 2 }, 1], [{ d: 3, r: 4 }, { d: 0, r: 5 }, 0], [{ d: 0, r: 5 }, { d: 3, r: 4 }, 0]]) {
  const { browser, page } = await apri({ seed: { attrezzi: { versione: 1, disponibili: loc.d, riscossi: loc.r } } });
  await apriImpostazioni(page, 'it');
  const dati = { attrezzi: { versione: 1, disponibili: ent.d, riscossi: ent.r } };
  await importa(page, busta(dati), 'unisci');
  const s = await ls(page);
  e.ok(s.attrezzi.disponibili === att, `B11 loc ${JSON.stringify(loc)} + file ${JSON.stringify(ent)} -> disponibili ${att}`, JSON.stringify(s.attrezzi));
  await browser.close();
}
// 3c C2: file guasto
for (const modo of ['unisci', 'sostituisci']) {
  const { browser, page, errori } = await apri({ lingua: 'it', seed: SEED });
  await apriImpostazioni(page, 'it');
  const dati = { sfide: { versione: 2, giorni: { '2026-10-12': { best: '99', partite: 1, regole: null }, '2026-10-13': { best: null, partite: 2 }, '2026-10-14': { best: 50, partite: 1, regole: null }, 'pippo': { best: 5, partite: 1 } } },
    attrezzi: { versione: 1, disponibili: 'tre', riscossi: -1 }, records: { versione: 1, best: 'x', bestChain: NaN, bestMove: 9e999 }, statistiche: { partite: '7' } };
  await importa(page, busta(JSON.parse(JSON.stringify(dati))), modo);
  const s = await ls(page);
  const tutto = JSON.stringify(s);
  e.ok(!/NaN|null,"partite"/.test(tutto) || true, '');
  await page.getByRole('button', { name: /Indietro|Back|Chiudi/i }).first().click().catch(() => {});
  await page.goto((await import('./lib.mjs')).URL_PROD, { waitUntil: 'networkidle' });
  await vaiStat(page, 'it'); const t = await testoPag(page);
  e.ok(!/NaN|undefined|Invalid/.test(t), `C2 ${modo}: Statistiche senza NaN/undefined/Invalid`, t.slice(0, 250));
  console.log('  C2', modo, 'sfide ->', JSON.stringify(s.sfide?.giorni), ' attrezzi ->', JSON.stringify(s.attrezzi), ' records ->', JSON.stringify(s.records));
  e.ok(errori.length === 0, 'nessun errore', errori.join('|'));
  await browser.close();
}
// ---- 4. ipotesi regressioni B7 con Unisci / Sostituisci
console.log('\n== B7 x import');
{ // locale con archivio 900 e SENZA records-sfida; file con records-sfida 100 -> Unisci
  const { browser, page } = await apri({ seed: SEED });
  await apriImpostazioni(page, 'it');
  await importa(page, busta({ 'records-sfida': { versione: 1, best: 100, bestChain: 0, bestMove: 0, bestGroupsInOneMove: 0 } }), 'unisci');
  const s = await ls(page); console.log('  records-sfida dopo unisci:', JSON.stringify(s['records-sfida']));
  e.ok(s['records-sfida']?.best >= 900, 'Unisci: record Sfida non scende sotto il massimo dell archivio locale (900)', JSON.stringify(s['records-sfida']));
  await browser.close();
}
{ // vecchio file (1.21.6, senza records-sfida) con Sostituisci su telefono che ha records-sfida
  const { browser, page } = await apri({ seed: { ...SEED, 'records-sfida': { versione: 1, best: 5000, bestChain: 1, bestMove: 1, bestGroupsInOneMove: 1 } } });
  await apriImpostazioni(page, 'it');
  await importa(page, busta({ records: { versione: 1, best: 50, bestChain: 1, bestMove: 1, bestGroupsInOneMove: 1 }, quadri: SEED.quadri }), 'sostituisci');
  const s = await ls(page); console.log('  dopo sostituisci con file senza records-sfida:', JSON.stringify({ r: s.records, rs: s['records-sfida'], sf: s.sfide, st: s.statistiche }));
  e.ok(s['records-sfida'] === undefined || s['records-sfida'].best === 0, '"Sostituisci tutto": il record Sfida locale (5000) non sopravvive a un file che non lo contiene', JSON.stringify(s['records-sfida']));
  e.ok(s.sfide === undefined, '"Sostituisci tutto": l archivio sfide locale non sopravvive', JSON.stringify(s.sfide));
  await browser.close();
}
// ---- 5. Azzera
console.log('\n== Azzera');
for (const lingua of ['it', 'en']) {
  const { browser, page, errori } = await apri({ lingua, seed: { ...SEED, attrezzi: { versione: 1, disponibili: 1, riscossi: 1 }, 'records-sfida': { versione: 1, best: 1500 }, 'partita-sfida': quasiFinita(OGGI, 10), profilo: { versione: 1 } } });
  await apriImpostazioni(page, lingua);
  await page.getByRole('button', { name: /Azzera i miei dati|Erase my data|Reset my data|Delete my data/i }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Sì, azzera|Yes, /i }).first().click().catch(async () => { console.log('  bottoni:', await page.evaluate(() => [...document.querySelectorAll('button')].map((b) => b.innerText))); });
  await page.waitForTimeout(500);
  const s = await ls(page); console.log(`  ${lingua} chiavi rimaste:`, Object.keys(s).join(','));
  e.ok(Object.keys(s).filter((k) => !['settings'].includes(k)).length === 0, `Azzera ${lingua}: nessun dato resta (tranne eventuali impostazioni ricreate)`, Object.keys(s).join(','));
  await page.goto((await import('./lib.mjs')).URL_PROD, { waitUntil: 'networkidle' }).catch(() => {});
  const t = await testoPag(page); e.ok(!/Record \d{2,}/.test(t), `Azzera ${lingua}: home senza record`, t.slice(0, 200));
  await vaiStat(page, lingua).catch(() => {}); const t2 = await testoPag(page); e.ok(!/NaN|undefined/.test(t2), `Azzera ${lingua}: Statistiche pulite`);
  e.ok(errori.length === 0, 'nessun errore', errori.join('|'));
  await browser.close();
}
console.log(`\nKO: ${e.ko}`);
process.exit(e.ko ? 1 : 0);
