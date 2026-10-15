import { apri, testo, shot, ls } from './lib.mjs';
const livelli = {}; for (let n = 1; n <= 6; n += 1) livelli[n] = { mosse: 10 + n, punteggio: 100 * n, tentativi: 1 };
const { browser, page, errori } = await apri({ storage: {
  settings: { versione: 1, introVista: true, lingua: 'it' },
  quadri: { versione: 1, livelli },
  records: { versione: 1, best: 4321, bestChain: 7, bestMove: 250, bestGroupsInOneMove: 3 },
  statistiche: { versione: 1, partite: 17, punteggioTotale: 9000, mosseTotali: 500, gruppiTotali: 80, griglieSvuotate: 1, tempoTotaleMs: 600000 },
  sfide: { versione: 2, giorni: { '2026-10-10': { best: 777, partite: 2, regole: null } } },
} });
const righe = (s) => s.split('\n').filter((l) => /LIVELLO|di 100|Record|Partita|Sfida|giocate|Partite/.test(l)).join(' | ');
console.log('HOME PRIMA:', righe(await testo(page)));
await page.getByRole('button', { name: 'Impostazioni' }).click();
await page.getByRole('button', { name: 'Azzera i miei dati' }).click();
await page.waitForTimeout(300);
console.log('BOTTONI:', await page.$$eval('button', (bs) => bs.map((b) => b.innerText.replace(/\n/g, ' ')).filter(Boolean)));
await shot(page, 'azzera-1');
for (let i = 0; i < 4; i += 1) {
  const b = page.getByRole('button', { name: /Continua|Avanti|Sì|Si,|Azzera davvero|Cancella tutto/i }).last();
  if (await b.count() === 0) break;
  console.log('click', await b.innerText()); await b.click(); await page.waitForTimeout(300);
}
console.log('localStorage dopo azzeramento:', Object.keys(await ls(page)));
await page.locator('.pl-hud__menu').first().click(); await page.waitForTimeout(400);
console.log('HOME DOPO AZZERA:', righe(await testo(page)));
await page.getByRole('button', { name: 'Statistiche' }).click(); await page.waitForTimeout(300);
console.log('STATISTICHE:', (await testo(page)).replace(/\n/g, ' | ').slice(0, 400));
await page.locator('.pl-hud__menu').first().click(); await page.waitForTimeout(300);
await page.getByRole('button', { name: 'Partita libera' }).click(); await page.waitForTimeout(500);
console.log('HUD in partita:', await page.$eval('.pl-hud', (e) => e.innerText.replace(/\n/g, ' ')));
console.log(errori);
await browser.close();
