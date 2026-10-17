// Collaudo 1.21.9: sovrascrittura del livello a meta', Riprova, fine livello, ricarica. Produzione.
import { chromium } from 'playwright';
const URL_ = process.argv[2] ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const browser = await chromium.launch({ executablePath: process.env.PLINTO_CHROMIUM });
const errs = [];
const log = (k, v) => console.log(`${k}: ${v}`);
async function nuova(lingua = 'it', progressi = { 1: { mosse: 9, punteggio: 90, tentativi: 1 }, 2: { mosse: 9, punteggio: 90, tentativi: 1 } }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: lingua === 'it' ? 'it-IT' : 'en-US' });
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(URL_, { waitUntil: 'domcontentloaded' });
  await page.evaluate(([l, pr]) => { localStorage.clear(); localStorage.setItem('plinto:settings', JSON.stringify({ versione: 2, introVista: true, lingua: l })); localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: pr })); }, [lingua, progressi]);
  await page.goto(URL_, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('.pl-home__menu');
  return { ctx, page };
}
const dove = (p) => p.evaluate(() => document.querySelector('.pl-fine') ? 'fine' : document.querySelector('.pl-plancia') ? 'partita' : document.querySelector('.pl-apertura') ? 'obiettivo' : document.querySelector('.pl-tappe') ? 'mappa' : document.querySelector('.pl-home') ? 'home' : '?');
const firma = (p) => p.evaluate(() => `${document.querySelector('.pl-hud')?.innerText.replace(/\s+/g, ' ')} / ${document.querySelector('.pl-quadro-barra, .pl-barra-obiettivo, .pl-obiettivo')?.innerText.replace(/\s+/g, ' ') ?? ''}`);
async function mossa(page) {
  const p = await page.evaluate(() => {
    const pezzo = document.querySelector('.pl-tray .pl-pezzo'); const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    if (!pezzo || !celle.length) return null;
    const rp = pezzo.getBoundingClientRect(); const v = celle.filter((c) => !c.className.includes('piena'));
    const rc = (v[Math.floor(Math.random() * v.length)] ?? celle[40]).getBoundingClientRect();
    return { px: rp.left + rp.width / 2, py: rp.top + rp.height / 2, cx: rc.left + rc.width / 2, cy: rc.top + rc.height / 2 };
  });
  if (!p) return; await page.mouse.move(p.px, p.py); await page.mouse.down(); await page.mouse.move(p.cx, p.cy, { steps: 4 }); await page.mouse.up(); await page.waitForTimeout(120);
}
async function apri(page, i, gioca = true) {
  if (await dove(page) === 'home') { await page.locator('.pl-home button').filter({ hasText: /mapp|map/i }).first().click(); await page.waitForSelector('.pl-tappe'); }
  await page.locator('.pl-tappa').nth(i).click(); await page.waitForTimeout(300);
  if (gioca && await dove(page) === 'obiettivo') await page.getByRole('button', { name: /^(Gioca|Play)$/ }).click();
  await page.waitForTimeout(300);
}
const salv = (p) => p.evaluate(() => { const v = JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null'); return v ? `liv${v.numero}${v.presentazione ? '(pres)' : ''}` : 'nessuno'; });
const label = (p) => p.locator('.pl-home__azioni .pl-btn--primario').innerText().then((t) => t.replace(/\s+/g, ' '));

// T1: livello 2 a meta'; apro livello 1 e premo Gioca: il 2 sparisce?
{
  const { ctx, page } = await nuova();
  await apri(page, 2); for (let i = 0; i < 3; i++) await mossa(page);
  log('T1 firma liv3 a meta', await firma(page)); log('T1 salvato', await salv(page));
  await page.goBack(); await page.waitForTimeout(300);
  await apri(page, 0, false); log('T1 guardo obiettivo liv1, salvato', await salv(page));
  await page.getByRole('button', { name: /^(Gioca|Play)$/ }).click(); await page.waitForTimeout(400);
  await mossa(page); await page.waitForTimeout(300);
  log('T1 dopo Gioca su liv1, salvato', await salv(page));
  await page.goBack(); await page.waitForTimeout(300); await page.goBack(); await page.waitForTimeout(400);
  log('T1 home etichetta', await label(page));
  await ctx.close();
}
// T2: menu Riprova a meta' (nessuna conferma?), poi ricarica
{
  const { ctx, page } = await nuova();
  await apri(page, 2); for (let i = 0; i < 4; i++) await mossa(page);
  const prima = await firma(page);
  await page.locator('button[aria-label*="enu"], .pl-menu-btn').first().click(); await page.waitForTimeout(200);
  await page.locator('.pl-menu button').nth(1).click(); await page.waitForTimeout(500);
  log('T2 Riprova', `${prima} -> ${await firma(page)} | dove ${await dove(page)} | salvato ${await salv(page)} | conferma? ${await page.locator('[role=dialog], .pl-conferma').count()}`);
  await page.reload(); await page.waitForTimeout(900);
  log('T2 dopo ricarica', `${await dove(page)} ${await salv(page)}`);
  await ctx.close();
}
// T3: gioco a caso fino alla fine del livello; poi ricarica nella schermata di fine, Riprova
{
  const { ctx, page } = await nuova();
  await apri(page, 2);
  let n = 0; while (await dove(page) === 'partita' && n < 200) { await mossa(page); n++; }
  log('T3 mosse prima della fine', `${n} dove ${await dove(page)}`);
  if (await dove(page) === 'fine') {
    log('T3 fine: salvato/ripresa', `${await salv(page)} / ${await page.evaluate(() => localStorage.getItem('plinto:ripresa'))}`);
    await page.reload(); await page.waitForTimeout(900);
    log('T3 ricarica sulla schermata di fine', `${await dove(page)} etichetta ${await label(page).catch(() => '-')}`);
    await page.goBack().catch(() => {}); await page.waitForTimeout(300);
    await apri(page, 2, false);
    await page.getByRole('button', { name: /^(Gioca|Play)$/ }).click(); await page.waitForTimeout(400);
    log('T3 riaperto dopo la fine', `${await dove(page)} ${await firma(page)}`);
  }
  await ctx.close();
}
// T4: Riprova dalla schermata di fine, poi sfondo/ricarica subito
{
  const { ctx, page } = await nuova();
  await apri(page, 2);
  let n = 0; while (await dove(page) === 'partita' && n < 200) { await mossa(page); n++; }
  if (await dove(page) === 'fine') {
    const b = page.getByRole('button', { name: /Riprova|Try again|Retry/ });
    log('T4 pulsante riprova', await b.count());
    if (await b.count()) { await b.first().click(); await page.waitForTimeout(500); log('T4 dopo Riprova', `${await dove(page)} salvato ${await salv(page)}`); await mossa(page); log('T4 salvato dopo 1 mossa', await salv(page)); await page.reload(); await page.waitForTimeout(900); log('T4 ricarica', `${await dove(page)} ${await firma(page)}`); }
  }
  await ctx.close();
}
log('errori di pagina', errs.length ? errs.join(' | ') : 'nessuno');
await browser.close();
