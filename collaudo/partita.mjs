// Partita libera giocata fino alla fine con mosse casuali; ricarica a intervalli e confronto UI <-> memoria salvata.
import { apri, testo, shot } from './lib.mjs';
import { leggi, mosseValide, tocca2, trascina, migliore } from './gioco.mjs';
import { deserializeGame, summarize } from '../src/core/engine.js';
const seed = Number(process.argv[2] ?? 1);
let rnd = seed; const r = () => { rnd = (rnd * 1664525 + 1013904223) >>> 0; return rnd / 2 ** 32; };
const vp = process.argv[3] === 'piccolo' ? { width: 360, height: 640 } : { width: 390, height: 844 };
const { browser, page, errori } = await apri({ viewport: vp, storage: { settings: { versione: 1, introVista: true } } });
await page.getByRole('button', { name: 'Partita libera' }).click();
await page.waitForSelector('.pl-plancia .pl-cella');
const problemi = [];
let mosse = 0, finita = false;
while (mosse < Number(process.argv[4] ?? 400)) {
  const fine = await page.$('.pl-fine, .pl-screen--fine');
  if (fine) { finita = true; break; }
  const s = await leggi(page);
  const val = mosseValide(s);
  if (!val.length) { await page.waitForTimeout(400); if (await page.$('.pl-fine, .pl-screen--fine')) { finita = true; break; } problemi.push(`nessuna mossa valida ma niente schermata di fine (mossa ${mosse})`); break; }
  // preferisco mosse che completano righe: scelta casuale pesata
  const m = migliore(s, val);
  const prima = s.griglia.flat().reduce((a, b) => a + b, 0);
  const modo = r() < 0.5 ? 'tocca' : 'trascina';
  if (modo === 'tocca') await tocca2(page, m, s); else await trascina(page, m, 5, { tocco: false });
  await page.waitForTimeout(60);
  mosse += 1;
  // confronto con la memoria salvata
  const raw = await page.evaluate(() => localStorage.getItem('plinto:partita'));
  if (raw) {
    const st = deserializeGame(JSON.parse(raw));
    const hud = (await page.$eval('.pl-hud__punteggio .pl-hud__valore', (e) => e.innerText)).replace(/\D/g, '');
    if (st && String(st.score) !== hud) problemi.push(`mossa ${mosse}: punteggio HUD ${hud} != salvato ${st.score}`);
    const celle = st ? [...st.grid].filter(Boolean).length : -1;
    const dom = (await leggi(page)).griglia.flat().reduce((a, b) => a + b, 0);
    if (st && celle !== dom) problemi.push(`mossa ${mosse}: caselle piene DOM ${dom} != salvato ${celle}`);
  }
  if (mosse % 25 === 0) {
    const h1 = await page.$eval('.pl-hud', (e) => e.innerText); const g1 = JSON.stringify((await leggi(page)).griglia);
    await page.reload(); await page.waitForTimeout(500);
    if (!(await page.$('.pl-plancia'))) { problemi.push(`mossa ${mosse}: dopo la ricarica non si rientra in partita`); break; }
    const h2 = await page.$eval('.pl-hud', (e) => e.innerText); const g2 = JSON.stringify((await leggi(page)).griglia);
    if (h1 !== h2 || g1 !== g2) problemi.push(`mossa ${mosse}: ricarica cambia HUD/griglia (${h1.replace(/\n/g, ' ')} -> ${h2.replace(/\n/g, ' ')})`);
  }
}
console.log(`seed ${seed} ${vp.width}: mosse=${mosse} finita=${finita}`);
await shot(page, `partita-fine-${seed}-${vp.width}`);
if (finita) console.log((await testo(page)).replace(/\n+/g, ' | ').slice(0, 500));
const stats = await page.evaluate(() => ({ rec: localStorage.getItem('plinto:records'), st: localStorage.getItem('plinto:statistiche'), partita: localStorage.getItem('plinto:partita'), ripresa: localStorage.getItem('plinto:ripresa') }));
console.log(stats);
console.log('PROBLEMI', problemi, 'ERRORI', errori);
await browser.close();
