// B6: Indietro dopo una ricarica a meta' livello: mappa > home > fuori. (+ ricarica doppia, + cambio lingua)
import { apri, esito } from './lib.mjs';
const e = esito();
for (const [w, h] of [[390, 844], [360, 640]]) {
  const { browser, page, errori } = await apri({ w, h });
  const dove = async () => (await page.locator('.pl-obiettivo__frase').count()) ? 'quadro'
    : (await page.locator('.pl-tappa').count()) ? 'quadri' : (await page.locator('.pl-home__azioni').count()) ? 'home'
    : (await page.locator('.pl-plancia').count()) ? 'gioco' : (await page.locator('.pl-apertura').count()) ? 'apertura' : 'ignota';
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappa');
  await page.locator('.pl-tappa').first().click();
  await page.waitForSelector('.pl-apertura');
  await page.getByRole('button', { name: /^Gioca$/ }).click();
  await page.waitForSelector('.pl-plancia');
  // una mossa: trascina il primo pezzo sulla prima casella libera
  const b = await page.evaluate(() => { const c = document.querySelectorAll('.pl-plancia .pl-cella')[40].getBoundingClientRect(); const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect(); return { cx: c.left + c.width / 2, cy: c.top + c.height / 2, px: p.left + p.width / 2, py: p.top + p.height / 2 }; });
  await page.mouse.move(b.px, b.py); await page.mouse.down(); await page.mouse.move(b.cx, b.cy, { steps: 10 }); await page.mouse.up();
  await page.waitForTimeout(500);
  for (let r = 1; r <= 2; r++) {
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    e.ok(await dove() === 'quadro', `${w}x${h}: dopo ricarica #${r} si è riportati nel livello`, await dove());
  }
  const n0 = await page.evaluate(() => history.length);
  await page.goBack(); await page.waitForTimeout(400);
  e.ok(await dove() === 'quadri', `${w}x${h}: Indietro 1 -> mappa`, await dove());
  await page.goBack(); await page.waitForTimeout(400);
  e.ok(await dove() === 'home', `${w}x${h}: Indietro 2 -> home`, await dove());
  await page.goBack().catch(() => {}); await page.waitForTimeout(500);
  const url = page.url();
  e.ok(!url.startsWith('https://antoniovairo-rgb.github.io/Plinto'), `${w}x${h}: Indietro 3 -> fuori`, url + ' hist=' + n0);
  e.ok(errori.length === 0, 'nessun errore console', errori.join('|'));
  await browser.close();
}
process.exit(e.ko ? 1 : 0);
