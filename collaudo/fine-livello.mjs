// Fine livello nel browser: vittoria, fine atto, festa finale (percorso completo), sconfitta. Sequenze calcolate col motore vero e rigiocate trascinando.
import { apri, testo, shot, overflow, SCHERMI } from './lib.mjs';
import { quadroNumero, TOTALE_QUADRI } from '../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../src/core/grid.js';
import { createRng } from '../src/core/rng.js';

function buchi(grid) { let n = 0; for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) { if (grid[idx(r, c)] !== 0) continue; const v = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([y, x]) => y >= 0 && y < 9 && x >= 0 && x < 9); if (v.every(([y, x]) => grid[idx(y, x)] !== 0)) n += 1; } return n; }
function sequenza(quadro, vinci = true, tentativi = 60) {
  for (let prova = 0; prova < tentativi; prova += 1) {
    const rng = createRng(1000 + prova); let partita = iniziaQuadro(quadro, { now: 0 }); const mosse = []; let g = 0;
    while (g < (quadro.maxMosse ?? 80)) {
      if (statoQuadro(quadro, partita).finito) break;
      let best = null, val = -1e9;
      partita.hand.forEach((pz, i) => { if (!pz) return; for (const [r, c] of allPlacements(partita.grid, pz.shape)) {
        const { grid: dopo } = placeShape(partita.grid, pz.shape, r, c, 1); const gr = findCompletedGroups(dopo);
        // per perdere: si cerca di NON chiudere niente e di riempire
        const v = vinci ? gr.length * 400 + (gr.length ? 200 : 0) - buchi(dopo) * 16 - fillRatio(dopo) * 60 + rng.float() * 40 : -gr.length * 400 + rng.float() * 40 + fillRatio(dopo) * 10;
        if (v > val) { val = v; best = { handIndex: i, row: r, col: c }; } } });
      if (!best) break; mosse.push(best); partita = giocaNelQuadro(quadro, partita, best.handIndex, best.row, best.col, g * 1000); g += 1;
    }
    const st = statoQuadro(quadro, partita);
    if (vinci ? st.completato : st.fallito) return mosse;
  }
  return null;
}
async function rigioca(page, mosse) {
  for (const m of mosse) {
    if (await page.locator('.pl-quadro-esito, .pl-trionfo, .pl-fine-quadro, [class*="esito"]').count() > 0) break;
    const p = await page.evaluate(({ handIndex, row, col }) => {
      const posto = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex]; const pezzo = posto?.querySelector('.pl-pezzo'); if (!pezzo) return null;
      const rp = pezzo.getBoundingClientRect(); const ct = pezzo.firstElementChild.getBoundingClientRect(); const celle = document.querySelectorAll('.pl-plancia .pl-cella');
      const c0 = celle[0].getBoundingClientRect(); const px = (celle[8].getBoundingClientRect().left - c0.left) / 8, py = (celle[72].getBoundingClientRect().top - c0.top) / 8;
      const ax = rp.left + rp.width / 2, ay = rp.top + rp.height / 2; const prx = (ax - rp.left) / ct.width, pry = (ay - rp.top) / ct.height;
      return { ax, ay, cx: c0.left + col * px + prx * c0.width, cy: c0.top + row * py + pry * c0.height };
    }, m);
    if (!p) break;
    await page.mouse.move(p.ax, p.ay); await page.mouse.down(); await page.mouse.move(p.cx, p.cy, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(50);
  }
  await page.waitForTimeout(900);
}
const casi = [
  { id: 'fine-atto', n: 10, superati: [...Array(9).keys()].map((k) => k + 1), vinci: true },
  { id: 'vittoria-5', n: 5, superati: [1, 2, 3, 4], vinci: true },
  { id: 'sconfitta-5', n: 5, superati: [1, 2, 3, 4], vinci: false },
  { id: 'festa-finale', n: 1, superati: Array.from({ length: TOTALE_QUADRI - 1 }, (_, i) => i + 2), vinci: true },
  { id: 'attrezzo-5', n: 5, superati: [1, 2, 3, 4], vinci: true },
];
const formati = process.argv[2] === 'tutti' ? Object.entries(SCHERMI) : [['s360', SCHERMI.s360]];
for (const caso of casi) {
  const seq = sequenza(quadroNumero(caso.n), caso.vinci);
  console.log(`\n## ${caso.id}: livello ${caso.n}, sequenza ${seq ? seq.length + ' mosse' : 'NON TROVATA'}`);
  if (!seq) continue;
  for (const [nome, vp] of formati) for (const lingua of ['it', 'en']) {
    const livelli = {}; for (const k of caso.superati) livelli[k] = { mosse: 12, punteggio: 300, tentativi: 1 };
    const { browser, page, errori } = await apri({ viewport: vp, mobile: vp.width < 800, locale: lingua === 'it' ? 'it-IT' : 'en-US',
      storage: { settings: { versione: 1, introVista: true, lingua }, quadri: { versione: 1, livelli }, ...(caso.id === 'attrezzo-5' ? { attrezzi: { versione: 1, disponibili: 3, riscossi: 0 } } : {}) } });
    // Apri il livello n dalla mappa
    await page.getByRole('button', { name: /^(Mappa dei livelli|Level map)/ }).click(); await page.waitForSelector('.pl-tappe');
    await page.locator('.pl-tappa').nth(caso.n - 1).click(); await page.waitForTimeout(300);
    const g = page.getByRole('button', { name: /^(Gioca|Play|Start)/i }); if (await g.count()) await g.first().click();
    await page.waitForSelector('.pl-plancia .pl-cella'); await page.waitForTimeout(300);
    await rigioca(page, seq);
    const t = (await testo(page)).replace(/\n+/g, ' | ');
    const o = (await overflow(page)).filter((x) => !/pl-sr/.test(x));
    const sc = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight }));
    await shot(page, `fine-${caso.id}-${nome}-${lingua}`);
    console.log(`${nome} ${lingua}: ${t.slice(0, 230)}\n   overflow=${JSON.stringify(o)} scroll=${sc.sh > sc.ch + 1 ? sc.sh + '>' + sc.ch : 'no'} errori=${JSON.stringify([...new Set(errori)])}`);
    await browser.close();
  }
}
