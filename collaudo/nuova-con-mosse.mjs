// «Nuova partita libera» con una partita libera che ha già mosse: chiede conferma? Si perde la partita?
import { chromium } from 'playwright';
import { createGame, placePiece, serializeGame } from '../src/core/engine.js';
const SITO = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
let s = createGame({ seed: 'mosse', now: 0 }), fatte = 0;
for (let i = 0; i < 3; i++) for (let r = 0; r < 9 && fatte <= i; r++) for (let c = 0; c < 9 && fatte <= i; c++) {
  const n = placePiece(s, 0, r, c, 1000 + i); if (n !== s) { s = n; fatte++; }
}
console.log('mosse fatte nel salvataggio:', fatte, 'punteggio', s.score);
const salv = serializeGame(s);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await (await b.newContext({ viewport: { width: 360, height: 640 }, locale: 'it' })).newPage();
await p.goto(SITO, { waitUntil: 'networkidle' });
await p.evaluate(([x]) => { localStorage.clear();
  localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: 'it', audio: false, vibrazione: false, animazioni: false, aiutoVisivo: true }));
  localStorage.setItem('plinto:records', JSON.stringify({ best: 18740 }));
  localStorage.setItem('plinto:partita', JSON.stringify(x)); }, [salv]);
await p.reload({ waitUntil: 'networkidle' });
const prima = await p.evaluate(() => localStorage.getItem('plinto:partita'));
await p.locator('.pl-home__nuova-libera').click(); await p.waitForTimeout(800);
const dopo = await p.evaluate(() => localStorage.getItem('plinto:partita'));
console.log('dialog dopo «Nuova partita libera»:', await p.locator('[role=dialog],[role=alertdialog]').count());
console.log('schermata:', (await p.locator('body').innerText()).replace(/\n/g, ' ').slice(0, 120));
console.log('partita salvata cambiata:', prima !== dopo, '| lunghezze', prima?.length, dopo?.length);
await p.screenshot({ path: new URL('./schermate/nuova-con-mosse.png', import.meta.url).pathname });
await b.close();
