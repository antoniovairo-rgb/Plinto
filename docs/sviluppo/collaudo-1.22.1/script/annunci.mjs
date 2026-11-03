import { apri, nuovoBrowser } from './comune.mjs';
import { createGame, serializeGame } from '/home/user/Plinto/src/core/engine.js';
import { gridFromString } from '/home/user/Plinto/src/core/grid.js';
import { getShape } from '/home/user/Plinto/src/core/shapes.js';

const browser = await nuovoBrowser();
const righe = Array.from({ length: 9 }, () => Array(9).fill('.'));
for (let c = 1; c < 9; c += 1) righe[0][c] = '#';
const base = createGame({ seed: 'collaudo-1.22.1', now: 0 });
const pezzo = (i) => ({ uid: `x${i}`, shapeId: 'p1', shape: getShape('p1'), color: 1 + i });
const voce = serializeGame({ ...base, grid: gridFromString(righe.map((r) => r.join('')).join('\n')), hand: [pezzo(1), pezzo(2), pezzo(3)] });

async function posa(page, cella) {
  const g = await page.evaluate((i) => {
    const c = document.querySelectorAll('.pl-plancia .pl-cella')[i].getBoundingClientRect();
    const p = [...document.querySelectorAll('.pl-tray .pl-pezzo')].find((e) => e.getBoundingClientRect().width > 0).getBoundingClientRect();
    return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 };
  }, cella);
  await page.mouse.move(g.px, g.py);
  await page.mouse.down();
  await page.mouse.move(g.cx, g.cy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(900);
  return page.locator('[role="status"]').allInnerTexts();
}

for (const lingua of ['it', 'en']) {
  const { contesto, page, errori } = await apri(browser, { formato: '1366x768', lingua, extra: { 'plinto:partita': voce } });
  await page.locator('.pl-sfida-avvio__riprendi, [aria-label*="iprend"], [aria-label*="esume"]').first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  await page.waitForTimeout(500);
  const a1 = await posa(page, 5 * 9 + 5);
  const a2 = await posa(page, 0);
  const punti = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita')).score);
  console.log(`${lingua} | mossa 1 (nessuna riga): ${JSON.stringify(a1.filter(Boolean))} | mossa 2 (chiude la riga 1): ${JSON.stringify(a2.filter(Boolean))} | punteggio ${punti} | errori ${errori.length}`);
  await contesto.close();
}
await browser.close();
