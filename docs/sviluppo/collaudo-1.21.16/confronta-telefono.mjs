/**
 * Confronta due giri di sonda-telefono.mjs (per esempio 1.21.15 e 1.21.16): scorrimenti,
 * pulsanti fuori o sovrapposti, geometria di pulsanti e titoli, e quanti pixel cambiano fra
 * le due schermate. I pixel si contano in Chromium (canvas), per non aggiungere dipendenze.
 *
 * Uso: node docs/sviluppo/collaudo-1.21.16/confronta-telefono.mjs <cartella> <etichettaA> <etichettaB>
 */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';

const [cartella, A, B] = process.argv.slice(2);
const a = JSON.parse(await readFile(`${cartella}/${A}.json`, 'utf8'));
const b = JSON.parse(await readFile(`${cartella}/${B}.json`, 'utf8'));
const browser = await chromium.launch({ executablePath: process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();

async function pixelDiversi(fa, fb) {
  const [da, db] = await Promise.all([readFile(fa), readFile(fb)]).then((x) => x.map((buf) => `data:image/png;base64,${buf.toString('base64')}`));
  return page.evaluate(async ([ua, ub]) => {
    const carica = (u) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = u; });
    const [ia, ib] = await Promise.all([carica(ua), carica(ub)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { diversi: -1, totale: 0 };
    const leggi = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height).data; };
    const pa = leggi(ia), pb = leggi(ib);
    let n = 0;
    for (let k = 0; k < pa.length; k += 4) if (Math.abs(pa[k] - pb[k]) + Math.abs(pa[k + 1] - pb[k + 1]) + Math.abs(pa[k + 2] - pb[k + 2]) > 24) n += 1;
    return { diversi: n, totale: pa.length / 4 };
  }, [da, db]);
}

console.log(`| formato | schermata | scorre ${A} | scorre ${B} | fuori/sovrapposti ${B} | geometria diversa | pixel diversi |`);
console.log('|---|---|---|---|---|---|---|');
for (const rb of b) {
  const ra = a.find((x) => x.formato === rb.formato && x.schermata === rb.schermata);
  if (!ra) { console.log(`| ${rb.formato} | ${rb.schermata} | manca in ${A} | | | | |`); continue; }
  const sa = new Set(ra.geometria), sb = new Set(rb.geometria);
  const solo = [...sb].filter((g) => !sa.has(g)).concat([...sa].filter((g) => !sb.has(g)).map((g) => `(${A}) ${g}`));
  const px = await pixelDiversi(ra.file, rb.file);
  const quota = px.totale ? `${px.diversi} (${(100 * px.diversi / px.totale).toFixed(2)}%)` : 'misure diverse';
  const fs = [...rb.fuori.map((x) => `fuori: ${x}`), ...rb.sovrapposti.map((x) => `sovr.: ${x}`)].join('; ') || '—';
  console.log(`| ${rb.formato} | ${rb.schermata} | ${ra.scorrono.join(', ') || '0'} | ${rb.scorrono.join(', ') || '0'} | ${fs} | ${solo.length ? solo.slice(0, 4).join('<br>') : 'identica'} | ${quota} |`);
}
await browser.close();
