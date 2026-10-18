/** Collaudo 1.21.14 sul sito pubblicato: PO-013, il pulsante grande dice «Livello N» anche con un livello a meta'. */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const URL_ = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const CR = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: existsSync(CR) ? CR : undefined });
const errori = []; const righe = [];
const mossa = async (page) => {
  const p = await page.evaluate(() => {
    const pz = document.querySelector('.pl-tray .pl-pezzo');
    const v = [...document.querySelectorAll('.pl-plancia .pl-cella')].filter((c) => !c.className.includes('piena'));
    const rp = pz.getBoundingClientRect(); const rc = v[Math.floor(v.length / 2)].getBoundingClientRect();
    return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 };
  });
  await page.mouse.move(p.px, p.py); await page.mouse.down(); await page.mouse.move(p.cx, p.cy, { steps: 5 }); await page.mouse.up(); await page.waitForTimeout(250);
};
const firma = (page) => page.evaluate(() => {
  const hud = document.querySelector('.pl-hud')?.innerText.replace(/\s+/g, ' ') ?? '';
  const piene = [...document.querySelectorAll('.pl-plancia .pl-cella')].filter((c) => c.className.includes('piena')).length;
  const n = JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null')?.numero ?? null;
  return `liv ${n} / ${hud} / ${piene} piene`;
});
const dove = (page) => page.evaluate(() => document.querySelector('.pl-plancia') ? 'partita' : document.querySelector('.pl-apertura') ? 'obiettivo' : document.querySelector('.pl-tappe') ? 'mappa' : document.querySelector('.pl-home') ? 'home' : '?');
const gioca = async (page) => { await page.waitForTimeout(300); if (await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^(Gioca|Play)$/ }).click(); await page.waitForSelector('.pl-plancia .pl-cella'); };
const grande = (page) => page.locator('.pl-btn--primario.pl-btn--largo').textContent();

for (const lingua of ['it', 'en']) for (const [w, h] of [[390, 844], [360, 640]]) for (const caso of ['L1', 'L2corrente', 'L1rigioco']) {
  const nome = `${lingua} ${w}x${h} ${caso}`;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: lingua === 'it' ? 'it-IT' : 'en-US' });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errori.push(`${nome}: ${e.message}`));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  const seed = caso === 'L1' ? null : { versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } };
  await page.evaluate(([l, s]) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: l })); if (s) localStorage.setItem('plinto:quadri', JSON.stringify(s)); }, [lingua, seed]);
  await page.goto(URL_, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('.pl-home__menu');
  const prima = await grande(page);
  // L1: livello 1 da casa; L2corrente: il livello 2 e' quello corrente; L1rigioco: dalla mappa si rigioca il 1 con il corrente a 2
  if (caso === 'L1rigioco') {
    await page.locator('.pl-sfida-avvio--mappa').click(); await page.waitForSelector('.pl-tappe'); await page.locator('.pl-tappa').first().click();
  } else await page.locator('.pl-btn--primario.pl-btn--largo').click();
  await gioca(page); for (let i = 0; i < 3; i += 1) await mossa(page); await page.waitForTimeout(400);
  const f1 = await firma(page); const atteso = caso === 'L2corrente' ? '2' : '1';
  await page.goBack(); await page.waitForSelector('.pl-tappe'); await page.goBack(); await page.waitForSelector('.pl-home__menu'); await page.waitForTimeout(300);
  const testo = await grande(page); const esatto = lingua === 'it' ? `Livello ${atteso}` : `Level ${atteso}`;
  const sc = await page.evaluate(() => document.documentElement.scrollHeight > innerHeight || document.documentElement.scrollWidth > innerWidth);
  await page.screenshot({ path: `collaudo/schermate/1.21.14-${lingua}-${w}x${h}-${caso}-home.png` });
  await page.locator('.pl-btn--primario.pl-btn--largo').click(); await page.waitForTimeout(700);
  const d = await dove(page); const f2 = d === 'partita' ? await firma(page) : '';
  righe.push({ nome, prima, testo, dopoTocco: d, f1, f2, scorre: sc });
  if (testo.replace(/\s+/g, ' ') !== esatto) errori.push(`${nome}: pulsante «${testo}», atteso «${esatto}»`);
  if (/Riprendi|Resume/i.test(testo)) errori.push(`${nome}: il pulsante contiene «riprendi»`);
  if (d !== 'partita') errori.push(`${nome}: dopo il tocco sono su «${d}», non in partita`);
  else if (f1 !== f2) errori.push(`${nome}: ripreso male: «${f1}» -> «${f2}»`);
  await ctx.close();
}
await browser.close();
for (const r of righe) console.log(JSON.stringify(r));
console.log(errori.length ? `\n${errori.length} problemi:\n - ${errori.join('\n - ')}` : '\nTutto a posto.');
