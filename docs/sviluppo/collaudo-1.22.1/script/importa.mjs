// Collaudo 1.22.1 - PO-041 con un salvataggio importato (via «incolla qui»).
import { apri, nuovoBrowser, pulsanteGrande, salvato, testo, tocca, da, voceAMeta, OUT } from './comune.mjs';

const browser = await nuovoBrowser();

async function esporta(livelli) {
  const { contesto, page } = await apri(browser, { livelli, formato: '1366x768' });
  await contesto.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: /^Impostazioni/ }).click();
  await page.waitForSelector('.pl-lista');
  await page.getByRole('button', { name: /^Copia il testo$/ }).click();
  await page.waitForTimeout(300);
  const t = await page.evaluate(() => navigator.clipboard.readText());
  await contesto.close();
  return t;
}

const FILE_PONTE = await esporta(da(1, 100));
const FILE_VUOTO = await esporta([]);
const FILE_10 = await esporta(da(1, 10));

const CASI = [
  { id: 'M1', nome: 'telefono 1-10 + 11 a meta\'; Unisci file Ponte finito', livelli: da(1, 10), aMeta: voceAMeta(11, 1), file: FILE_PONTE, modo: 'Unisci', atteso: 'Livello 101' },
  { id: 'M2', nome: 'telefono 1-10 + 11 a meta\'; Sostituisci con file Ponte finito', livelli: da(1, 10), aMeta: voceAMeta(11, 1), file: FILE_PONTE, modo: 'Sostituisci', atteso: 'Livello 101' },
  { id: 'M3', nome: 'telefono Ponte finito + 100 a meta\'; Sostituisci con file 1-10', livelli: da(1, 100), aMeta: voceAMeta(100, 1), file: FILE_10, modo: 'Sostituisci', atteso: 'Livello 11 (100 chiuso)' },
  { id: 'M4', nome: 'telefono Ponte finito + 100 a meta\'; Sostituisci con file vuoto', livelli: da(1, 100), aMeta: voceAMeta(100, 1), file: FILE_VUOTO, modo: 'Sostituisci', atteso: 'Livello 1 (100 chiuso)' },
  { id: 'M5', nome: 'telefono Ponte finito + 105? no: 1-110 + 105 a meta\'; Sostituisci con file Ponte finito', livelli: da(1, 110), aMeta: voceAMeta(105, 1), file: FILE_PONTE, modo: 'Sostituisci', atteso: 'Livello 101 (105 chiuso)' },
];

for (const caso of CASI) {
  const { contesto, page, errori } = await apri(browser, { livelli: caso.livelli, aMeta: caso.aMeta });
  const prima = (await pulsanteGrande(page).textContent()).trim();
  await page.getByRole('button', { name: /^Impostazioni/ }).click();
  await page.waitForSelector('.pl-lista');
  await page.getByRole('button', { name: /incolla qui/i }).click();
  await page.locator('textarea').fill(caso.file);
  await page.getByRole('button', { name: /^Leggi$/ }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: new RegExp(`^${caso.modo}`) }).click();
  await page.waitForTimeout(300);
  // Sostituisci potrebbe chiedere conferma
  const conf = page.getByRole('button', { name: /^Sì/ });
  if (await conf.count()) { await conf.first().click(); await page.waitForTimeout(300); }
  const nota = (await page.locator('.pl-nota').allInnerTexts()).join(' | ').replace(/\s+/g, ' ');
  await page.locator('.pl-hud__menu').first().click();
  await page.waitForSelector('.pl-home__menu');
  await page.waitForTimeout(300);
  const dopo = (await pulsanteGrande(page).textContent()).trim();
  const mappa = await page.locator('.pl-sfida-avvio--mappa').getAttribute('aria-label');
  const sv = await salvato(page);
  await page.screenshot({ path: `${OUT}/po041-import-${caso.id}-home-360x640-it.png` });
  await tocca(page, pulsanteGrande(page));
  await page.waitForTimeout(600);
  const t = await testo(page);
  const m = t.match(/Livello\s+(\d+)/);
  const apertura = await page.locator('.pl-apertura').count();
  const hud = await page.locator('.pl-hud').count();
  // Ricarica: stesso pulsante?
  await page.goto(page.url().split('#')[0], { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu, .pl-hud', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(400);
  const dopoRicarica = await pulsanteGrande(page).count() ? (await pulsanteGrande(page).textContent()).trim() : `(non in home: ${(await testo(page)).slice(0, 80)})`;
  console.log(`${caso.id} | ${caso.nome} | prima «${prima}» | nota: ${nota.slice(0, 160)} | dopo «${dopo}» (atteso ${caso.atteso}) | mappa «${mappa}» | partita-quadro ${sv?.numero ?? null} | tocco -> ${apertura ? 'presentazione' : hud ? 'plancia' : 'altro'} livello ${m?.[1]} | dopo ricarica «${dopoRicarica}» | errori ${errori.length} ${errori.join(';')}`);
  await contesto.close();
}
await browser.close();
