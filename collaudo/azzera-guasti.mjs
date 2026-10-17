// "Azzera i miei dati" (it/en) e salvataggi GIA' guasti in localStorage (non via importazione).
import { apri, ls, esito, URL_PROD } from './lib.mjs';
const e = esito();
const testo = (p) => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
for (const lingua of ['it', 'en']) {
  const seed = { records: { versione: 1, best: 500 }, 'records-sfida': { versione: 1, best: 1500 }, sfide: { versione: 2, giorni: { '2026-10-10': { best: 900, partite: 2, regole: null } } }, attrezzi: { versione: 1, disponibili: 1, riscossi: 1 }, quadri: { versione: 1, livelli: { 1: { mosse: 10, punteggio: 1, tentativi: 1 } } }, profilo: { versione: 1 } };
  const { browser, page, errori } = await apri({ lingua, seed });
  await page.getByRole('button', { name: lingua === 'it' ? /^Impostazioni/ : /^Settings/ }).click();
  await page.getByRole('button', { name: /^Azzera i miei dati|^Erase my data/ }).click();
  await page.waitForTimeout(200);
  const msg = await testo(page); console.log(' ', lingua, 'conferma:', msg.slice(0, 700));
  await page.getByRole('button', { name: /^Sì$|^Yes$/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: /^Sì, azzera tutto|^Yes, erase everything/ }).click();
  await page.waitForTimeout(600);
  const s = await ls(page); console.log('  chiavi rimaste', lingua, Object.keys(s).join(','), JSON.stringify(s.settings));
  e.ok(!Object.keys(s).some((k) => !['settings', 'ripresa'].includes(k)), `Azzera ${lingua}: nessun documento di gioco resta`, Object.keys(s).join(','));
  const t = await testo(page); e.ok(!/Record \d{2,}|Best \d{2,}|500|1\.500/.test(t), `Azzera ${lingua}: la schermata non mostra più record`, t.slice(0, 160));
  await page.screenshot({ path: `uscite/azzera-${lingua}.png` });
  await page.goto(URL_PROD, { waitUntil: 'networkidle' });
  const h = await testo(page); e.ok(!/\b(500|900|1\.500)\b/.test(h) && !/2 di 100|2 of 100/.test(h), `Azzera ${lingua}: dopo ricarica home pulita`, h.slice(0, 200));
  e.ok(errori.length === 0, 'nessun errore', errori.join('|'));
  await browser.close();
}
// Salvataggio gia' guasto nel localStorage
{
  const seed = { records: { versione: 1, best: 'x', bestChain: null, bestMove: -5 }, 'records-sfida': { versione: 1, best: '77' }, statistiche: { versione: 1, partite: 'a', punteggioTotale: null }, sfide: { versione: 2, giorni: { '2026-10-10': { best: '99', regole: null }, '2026-10-11': { best: 40, partite: 1, regole: null } } }, attrezzi: { versione: 1, disponibili: 'tre', riscossi: 2.5 }, quadri: { versione: 1, livelli: { 1: { mosse: 'dieci' }, 2: null } } };
  const { browser, page, errori } = await apri({ seed });
  const h = await testo(page); console.log('  home guasta:', h.slice(0, 260));
  e.ok(!/NaN|undefined|Invalid|\[object/.test(h), 'localStorage guasto: home senza NaN/undefined');
  await page.getByRole('button', { name: /^Statistiche/ }).click(); await page.waitForTimeout(300);
  const t = await testo(page); console.log('  stat guasta:', t.slice(0, 400));
  e.ok(!/NaN|undefined|Invalid|\[object/.test(t), 'localStorage guasto: Statistiche senza NaN/undefined/Invalid', t.slice(0, 300));
  await page.screenshot({ path: 'uscite/stat-guasta.png' });
  e.ok(errori.length === 0, 'nessun errore console con dati guasti', errori.join('|'));
  await browser.close();
}
console.log('KO', e.ko); process.exit(e.ko ? 1 : 0);
