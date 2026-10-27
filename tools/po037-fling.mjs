/**
 * PO-037: quanto vive il fling di Chromium dopo un trascinamento "frettoloso", e se il
 * primo tocco che lo trova vivo perde il click. Su PLINTO (partita libera) e su pagine
 * minime costruite pezzo per pezzo verso la fine del livello.
 *
 *   node tools/po037-fling.mjs
 *   PO037_SCENE=libera,m0,m1 PO037_ATTESE=500,1500 PO037_GIRI=3 node tools/po037-fling.mjs
 *
 * Scene (ognuna aggiunge qualcosa alla precedente, tranne `libera`):
 *   libera  PLINTO, partita libera: primo pezzo sulla casella centrale, poi «Menu»
 *   libera14  PLINTO, partita libera: 14 trascinamenti a 150 ms (sempre il primo pezzo
 *           rimasto nel vassoio verso il centro della griglia), poi «Menu»
 *   m0      riquadro `touch-action: none`, un quadrato che segue il dito, pulsante fisso
 *           in alto (la pagina minima di tools/sonda-tocco.mjs)
 *   m1      + al distacco la schermata si sostituisce con una "fine": colonna flex, area
 *           `overflow-y: auto` che NON scorre, pulsanti in fondo; il tocco va sul pulsante
 *   m2      + radice `touch-action: manipulation; overscroll-behavior: none` come PLINTO
 *   m3      + animazioni d'ingresso (salto, coriandoli, barra che si riempie)
 *   m4      + l'area della fine scorre davvero (contenuto piu' alto dello schermo)
 *   m5      m2 ma il pezzo si trascina con 14 mosse a 150 ms come il livello 1
 *   m6      m5 + `preventDefault()` sui touchmove del trascinamento (ascoltatore non passivo):
 *           prova di una correzione, non il gioco
 *   m7      m5 + `preventDefault()` sul solo touchend del trascinamento
 *   m8      m0 (niente fine, niente radice come PLINTO) con 14 trascinamenti a 150 ms
 *
 * Per ogni giro: click arrivato o no, e il riassunto dei gesti (tools/po037-gesti.mjs).
 * Strumento di misura, non un controllo del gate.
 */
import { chromium } from 'playwright';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { chiudiAllUscita } from './server-di-prova.mjs';
import { registraGesti, riassumi, rigaRiassunto } from './po037-gesti.mjs';

const ESEGUIBILE = [process.env.PLINTO_CHROMIUM, '/opt/pw-browsers/chromium'].find((p) => p && existsSync(p));
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://127.0.0.1:4173/';
const SCENE = (process.env.PO037_SCENE ?? 'libera,libera14,m0,m1,m2,m3,m4,m5').split(',');
const ATTESE = (process.env.PO037_ATTESE ?? '500,1000,1500,2500').split(',').map(Number);
const GIRI = Number(process.env.PO037_GIRI ?? 3);
const [W, H] = (process.env.PO037_FORMATO ?? '360x640').split('x').map(Number);
const CARTELLA = new URL('../docs/sviluppo/po037/', import.meta.url).pathname;

async function risponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(3000) })).ok; } catch { return false; }
}
if (SCENE.some((s) => s.startsWith('libera')) && !(await risponde())) {
  const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    cwd: new URL('..', import.meta.url).pathname, stdio: 'ignore', detached: true,
  });
  chiudiAllUscita(server);
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await risponde())) await new Promise((r) => setTimeout(r, 400));
}

/** La pagina minima, con i pezzi accesi dalla scena. */
function paginaMinima(scena) {
  const n = Number(scena.slice(1));
  const radice = n >= 2 && n !== 8 ? 'touch-action:manipulation;overscroll-behavior:none;' : '';
  const anim = n >= 3 && n < 5;
  const lunga = n === 4;
  return `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
html,body{margin:0;height:100%;background:#112;color:#eee;font:16px sans-serif;${radice}}
#area{position:fixed;inset:0;touch-action:none;background:#223}
#pezzo{position:fixed;width:60px;height:60px;background:#c84;left:0;top:0;touch-action:none}
#menu{position:fixed;top:12px;right:12px;width:96px;height:44px}
.screen{position:fixed;inset:0;display:flex;flex-direction:column;min-height:0}
.scroll{flex:1;overflow-y:auto;padding:0 20px 28px;text-align:center}
.azioni{display:grid;gap:8px;padding:12px 24px 20px}
.azioni button{height:52px;font-size:16px}
.salta{animation:salta 700ms both}
@keyframes salta{0%{transform:translateY(40px) scale(.6);opacity:0}60%{transform:translateY(-12px) scale(1.1);opacity:1}100%{transform:none}}
.coriandolo{position:absolute;width:8px;height:14px;background:#fc4;animation:cade 1200ms linear both}
@keyframes cade{from{transform:translateY(-40px) rotate(0)}to{transform:translateY(300px) rotate(540deg);opacity:0}}
.barra{height:10px;background:#444}.barra>i{display:block;height:100%;background:#6c6;animation:riempi 900ms both}
@keyframes riempi{from{width:0}to{width:70%}}
</style>
<div id="radice"><div id="area"></div><div id="pezzo"></div><button id="menu">Menu</button></div>
<script>
window.__click = false;
const fine = ${n >= 1 && n !== 8 ? 'true' : 'false'};
const pezzo = document.getElementById('pezzo');
let trascinamenti = 0;
const daFare = ${n >= 5 ? 14 : 1};
${n === 6 ? "document.getElementById('area').addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });" : ''}
${n === 7 ? "document.getElementById('area').addEventListener('touchend', (e) => e.preventDefault(), { passive: false });" : ''}
document.addEventListener('pointermove', (e) => {
  if (!document.getElementById('pezzo')) return;
  pezzo.style.transform = 'translate(' + (e.clientX - 30) + 'px,' + (e.clientY - 30) + 'px)';
}, { passive: true });
document.addEventListener('pointerup', () => {
  trascinamenti += 1;
  if (!fine || trascinamenti < daFare || document.querySelector('.screen')) return;
  // La "vittoria": come in PLINTO, la schermata della partita sparisce intera nello
  // stesso istante del distacco e al suo posto c'e' la fine del livello.
  document.getElementById('radice').innerHTML =
    '<div class="screen"><div class="scroll">'
    + '<p>LIVELLO 1</p><div class="${anim ? 'salta' : ''}" style="position:relative;width:92px;height:92px;margin:0 auto;background:#c84;border-radius:20px">'
    + ${anim ? "Array.from({length:12},(_, i)=>'<span class=\"coriandolo\" style=\"left:'+(i*8)+'px;animation-delay:'+(i*40)+'ms\"></span>').join('')" : "''"}
    + '</div><h2>Livello superato!</h2><p>Mosse</p><p style="font-size:60px;margin:0">14</p>'
    + '${anim ? '<div class="barra"><i></i></div>' : ''}'
    + '${lunga ? '<div style="height:900px">contenuto lungo</div>' : ''}'
    + '</div><div class="azioni"><button>Livello successivo</button><button id="bottone">Torna ai livelli</button></div></div>';
  document.getElementById('bottone').addEventListener('click', () => { window.__click = true; });
});
document.getElementById('menu').addEventListener('click', () => { window.__click = true; });
</script>`;
}

async function trascinaFrettoloso(cdp, da, a) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: da.x, y: da.y }] });
  for (let i = 1; i <= 12; i += 1) {
    const x = da.x + ((a.x - da.x) * i) / 12, y = da.y + ((a.y - da.y) * i) / 12;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

async function giro(browser, scena, attesa) {
  const contesto = await browser.newContext({
    viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, locale: 'it-IT',
  });
  const page = await contesto.newPage();
  page.setDefaultTimeout(8000);
  let da, a, selettore, riuscito;
  if (scena.startsWith('libera')) {
    await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
    await page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem('plinto:settings', JSON.stringify({
        introVista: true, tema: 'scuro', lingua: 'it', audio: false, vibrazione: false, animazioni: true, aiutoVisivo: true,
      }));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /^Partita libera/ }).tap();
    await page.waitForSelector('.pl-plancia .pl-cella', { state: 'attached' });
    await page.waitForTimeout(250);
    const g = await page.evaluate(() => {
      const r = document.querySelector('.pl-tray .pl-pezzo').getBoundingClientRect();
      const c = document.querySelectorAll('.pl-plancia .pl-cella')[40].getBoundingClientRect();
      return { px: r.left + r.width / 2, py: r.top + r.height / 2, cx: c.left + c.width / 2, cy: c.top + c.height / 2 + 1.35 * c.height };
    });
    da = { x: g.px, y: g.py }; a = { x: g.cx, y: g.cy };
    selettore = '.pl-hud__menu';
    riuscito = async () => (await page.locator('.pl-menu').count()) > 0;
  } else {
    await page.setContent(paginaMinima(scena));
    // Stessa geometria del livello 1 a 360x640: dal vassoio in basso verso la griglia.
    da = { x: 0.5 * W, y: 0.82 * H }; a = { x: 0.5 * W, y: 0.45 * H };
    selettore = Number(scena.slice(1)) >= 1 && scena !== 'm8' ? '#bottone' : '#menu';
    riuscito = () => page.evaluate(() => window.__click);
  }
  const cdp = await contesto.newCDPSession(page);
  const ferma = await registraGesti(cdp);
  const volte = Number(scena.slice(1)) >= 5 || scena === 'libera14' ? 14 : 1;
  for (let i = 0; i < volte; i += 1) {
    if (scena === 'libera14' && i > 0) {
      const r = await page.evaluate(() => document.querySelector('.pl-tray .pl-pezzo')?.getBoundingClientRect().toJSON());
      if (r) da = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    await trascinaFrettoloso(cdp, da, a);
    if (i < volte - 1) await page.waitForTimeout(150);
  }
  await page.waitForTimeout(attesa);
  const b = await page.locator(selettore).boundingBox();
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(600);
  const ok = await riuscito();
  const gesti = riassumi(await ferma());
  await contesto.close();
  return { ok, gesti };
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
console.log(`Chromium ${browser.version()}; ${W}x${H}; ${GIRI} giri per riga`);
const tutti = [];
for (const scena of SCENE) for (const attesa of ATTESE) {
  const giri = [];
  for (let i = 0; i < GIRI; i += 1) giri.push(await giro(browser, scena, attesa));
  const persi = giri.filter((g) => !g.ok).length;
  const vivi = giri.filter((g) => g.gesti.vivo).length;
  const durate = giri.filter((g) => g.gesti.fling && !g.gesti.vivo).map((g) => g.gesti.durata);
  console.log(`${scena.padEnd(7)} attesa ${String(attesa).padStart(5)} ms: click persi ${persi} su ${GIRI}; fling vivo al tocco ${vivi} su ${GIRI}`
    + (durate.length ? `; durata dei fling finiti ${Math.min(...durate)}-${Math.max(...durate)} ms` : ''));
  for (const [i, g] of giri.entries()) console.log(`    giro ${i + 1}: click ${g.ok ? 'si' : 'NO'}; ${rigaRiassunto(g.gesti)}`);
  tutti.push({ scena, attesa, giri });
}
mkdirSync(CARTELLA, { recursive: true });
writeFileSync(`${CARTELLA}fling-${process.env.PO037_NOME ?? `${W}x${H}`}.json`, JSON.stringify(tutti, null, 1));
await browser.close();
