/**
 * PO-035: differenza in pixel fra due cartelle di schermate di `misura.mjs`.
 * Per ogni coppia: quanti pixel cambiano e il rettangolo che li contiene.
 * Uso: node docs/sviluppo/po035/pixel.mjs <prima> <dopo> [filtro-regex]
 */
import { chromium } from 'playwright';
import { readdir, readFile } from 'node:fs/promises';

const [A, B, FILTRO] = process.argv.slice(2);
const nomi = (await readdir(A)).filter((n) => n.endsWith('.png') && (!FILTRO || new RegExp(FILTRO).test(n)));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();
for (const n of nomi) {
  let b;
  try { b = await readFile(`${B}/${n}`); } catch { console.log(`${n} manca`); continue; }
  const a = await readFile(`${A}/${n}`);
  const r = await page.evaluate(async ([a, b]) => {
    const carica = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = `data:image/png;base64,${s}`; });
    const [ia, ib] = await Promise.all([carica(a), carica(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { misura: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
    const dati = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
    const da = dati(ia), db = dati(ib);
    let massimo = 0, n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let p = 0; p < da.length; p += 4) {
      const delta = Math.abs(da[p] - db[p]) + Math.abs(da[p + 1] - db[p + 1]) + Math.abs(da[p + 2] - db[p + 2]);
      if (delta > 0) {
        massimo = Math.max(massimo, delta);
        n += 1; const q = p / 4, x = q % ia.width, y = Math.floor(q / ia.width);
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
    }
    return { n, box: n ? `${x0},${y0}-${x1},${y1} (scarto massimo ${massimo} su 765)` : "" };
  }, [a.toString('base64'), b.toString('base64')]);
  console.log(`${n.padEnd(36)} ${r.misura ?? (r.n === 0 ? 'identica' : `${r.n} pixel diversi in ${r.box}`)}`);
}
await browser.close();
