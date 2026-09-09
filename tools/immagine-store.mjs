/**
 * L'immagine in evidenza del Play Store: 1024x500, l'unica grafica obbligatoria che
 * non esiste gia' dentro il gioco.
 *
 * E' disegnata con i colori veri dei blocchi e con lo stesso marchio dell'app -- letti
 * dai token, non ricopiati -- perche' una grafica di negozio che non somiglia al gioco
 * e' una promessa che il gioco non mantiene. La plancia disegnata qui mostra la cosa
 * che distingue PLINTO: una riga, una colonna e un quadrante 3x3 chiusi dalla stessa
 * mossa.
 *
 * Uso: npm run immagine-store    (esce in store/immagine-in-evidenza.png)
 */

import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const RADICE = new URL('..', import.meta.url).pathname;
const USCITA = `${RADICE}store/`;
await mkdir(USCITA, { recursive: true });

/**
 * I colori NON sono ricopiati: si leggono dal foglio dei token.
 * Ricopiarli significherebbe che il giorno in cui la palette cambia questa immagine
 * resta indietro senza che nessuno se ne accorga.
 */
const css = await readFile(`${RADICE}src/styles/tokens.css`, 'utf8');
function token(nome) {
  const trovato = css.match(new RegExp(`--${nome}:\\s*([^;]+);`));
  if (!trovato) throw new Error(`Token mancante nei token CSS: --${nome}`);
  return trovato[1].trim();
}
const C = {
  fondo: token('pl-ink'),
  plancia: token('pl-ink-2'),
  linea: token('pl-line'),
  lineaForte: token('pl-line-strong'),
  testo: token('pl-text'),
  tenue: token('pl-text-dim'),
  marchio: token('pl-brand'),
  b: [1, 2, 3, 4, 5, 6].map((n) => token(`pl-block-${n}`)),
};

// La plancia: la riga 4 e il quadrante centrale sono pieni, cioe' la mossa che chiude
// due gruppi insieme -- l'Intreccio. Il resto e' sparso, come una partita vera.
const PIENE = `
.5..4....
..3...6..
.1..2..5.
444444444
...444...
...444...
.2..1..3.
..6...2..
.4..5....
`.trim().split('\n');

const pagina = `
<!doctype html><meta charset="utf-8">
<style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1024px; height: 500px; overflow: hidden;
    background:
      radial-gradient(900px 500px at 78% 50%, #1a2133 0%, ${C.fondo} 62%),
      ${C.fondo};
    color: ${C.testo};
    font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    display: flex; align-items: center; gap: 40px; padding: 0 64px;
  }
  .sinistra { flex: 1; }
  .marchio { display: flex; align-items: center; gap: 20px; margin-bottom: 22px; }
  .nome { font-size: 76px; font-weight: 800; letter-spacing: 0.16em; line-height: 1; }
  .claim {
    font-size: 21px; letter-spacing: 0.22em; color: ${C.tenue};
    text-transform: uppercase; margin-bottom: 34px;
  }
  .punti { display: flex; flex-direction: column; gap: 12px; font-size: 20px; color: ${C.testo}; }
  .punto { display: flex; align-items: center; gap: 12px; }
  .pallino { width: 11px; height: 11px; border-radius: 3px; flex: none; }
  .plancia {
    width: 414px; height: 414px; flex: none; padding: 9px; border-radius: 26px;
    background: ${C.plancia};
    box-shadow: 0 24px 60px rgba(0,0,0,0.55), inset 0 0 0 1px ${C.linea};
    display: grid; grid-template-columns: repeat(9, 1fr); gap: 3px;
  }
  .cella { border-radius: 22%; background: rgba(255,255,255,0.035); }
  .cella.piena { box-shadow: inset 0 -3px 0 rgba(0,0,0,0.25); }
  /* I separatori dei quadranti: la firma del tabellone, e l'unica cosa che distingue
     questa plancia da quella di ogni altro gioco a blocchi. Devono VEDERSI. */
  .cella:nth-child(9n+4), .cella:nth-child(9n+7) { margin-left: 9px; }
  .r3, .r6 { margin-top: 9px; }
</style>
<div class="sinistra">
  <div class="marchio">
    <svg width="72" height="72" viewBox="0 0 48 48">
      <rect x="3" y="3" width="19" height="19" rx="5" fill="${C.b[3]}"/>
      <rect x="26" y="3" width="19" height="19" rx="5" fill="${C.b[1]}"/>
      <rect x="3" y="26" width="19" height="19" rx="5" fill="${C.b[2]}"/>
      <rect x="26" y="26" width="19" height="19" rx="5" fill="none"
            stroke="${C.lineaForte}" stroke-width="2" stroke-dasharray="4 3"/>
    </svg>
    <div class="nome">PLINTO</div>
  </div>
  <div class="claim">Riga, colonna, quadrante.</div>
  <div class="punti">
    <div class="punto"><span class="pallino" style="background:${C.b[3]}"></span>100 livelli e una sfida ogni giorno</div>
    <div class="punto"><span class="pallino" style="background:${C.b[1]}"></span>Nessuna pubblicità, nessun acquisto</div>
    <div class="punto"><span class="pallino" style="background:${C.b[5]}"></span>Funziona senza connessione</div>
  </div>
</div>
<div class="plancia">
  ${PIENE.flatMap((riga, r) => [...riga].map((ch, c) => {
    const classe = ['cella'];
    if (r === 3 || r === 6) classe.push(`r${r}`);
    if (ch !== '.') classe.push('piena');
    const colore = ch === '.' ? '' : `background:${C.b[Number(ch) - 1]}`;
    return `<div class="${classe.join(' ')}" style="${colore}"></div>`;
  })).join('')}
</div>
`;

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 1024, height: 500 }, deviceScaleFactor: 1 });
await page.setContent(pagina, { waitUntil: 'load' });
await page.screenshot({ path: `${USCITA}immagine-in-evidenza.png` });

const { width, height } = await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
await browser.close();

// Play rifiuta qualunque misura diversa da 1024x500 esatti.
if (width !== 1024 || height !== 500) throw new Error(`Misura sbagliata: ${width}x${height}`);
console.log('store/immagine-in-evidenza.png — 1024x500');
