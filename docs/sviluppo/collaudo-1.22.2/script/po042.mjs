// Collaudo 1.22.2 - PO-042: un livello salvato a meta' conta solo se e' ancora aperto.
// Importazioni vere: il file si esporta dal gioco con «Copia il testo» e si incolla in
// «Oppure incolla qui un salvataggio». Contro il sito pubblicato, service worker bloccato.
import { apri, nuovoBrowser, pulsanteGrande, tocca, da, voceAMeta, OUT, FORMATI } from './comune.mjs';

const browser = await nuovoBrowser();
const L = {
  it: { imp: /^Impostazioni/, copia: /^Copia il testo$/, incolla: /incolla qui/i, leggi: /^Leggi$/, unisci: /^Unisci ai miei/, sost: /^Sostituisci tutto/, si: /^Sì/, mappa: /^Mappa dei livelli/, liv: 'Livello' },
  en: { imp: /^Settings/, copia: /^Copy the text$/, incolla: /paste a save file here/i, leggi: /^Read it$/, unisci: /^Merge with mine/, sost: /^Replace everything/, si: /^Yes/, mappa: /^Level map/, liv: 'Level' },
};
let problemi = 0;
const log = (s) => console.log(s);
const p = (s) => { problemi += 1; log(`  PROBLEMA ${s}`); };

const voce = (page) => page.evaluate(() => {
  const v = JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null');
  return v ? `${v.numero}/${v.partita?.stats?.moves ?? '?'}m` : 'null';
});
const ripresa = (page) => page.evaluate(() => localStorage.getItem('plinto:ripresa'));
const dove = (page) => page.evaluate(() => {
  if (document.querySelector('.pl-apertura')) return `presentazione ${document.querySelector('.pl-apertura').innerText.match(/(Livello|Level)\s+(\d+)/i)?.[2]}`;
  if (document.querySelector('.pl-hud') && !document.querySelector('.pl-home__menu')) {
    const t = document.body.innerText.replace(/\s+/g, ' ');
    return `plancia ${t.match(/(LIVELLO|LEVEL)\s+(\d+)/i)?.[2]} mosse=${t.match(/(MOSSE|MOVES)\s+(\d+)/i)?.[2]}`;
  }
  if (document.querySelector('.pl-home__menu')) return 'home';
  return 'altro';
});
const grande = async (page) => ((await pulsanteGrande(page).count()) ? (await pulsanteGrande(page).textContent()).trim() : '(non in home)');

async function esporta(livelli, lingua = 'it') {
  const { contesto, page } = await apri(browser, { livelli, formato: '1366x768', lingua });
  await contesto.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: L[lingua].imp }).click();
  await page.waitForSelector('.pl-lista');
  await page.getByRole('button', { name: L[lingua].copia }).click();
  await page.waitForTimeout(300);
  const t = await page.evaluate(() => navigator.clipboard.readText());
  await contesto.close();
  return t;
}

/** Impostazioni -> incolla -> Leggi -> Unisci/Sostituisci (+ Si') -> torna in home. */
async function importa(page, file, modo, lingua) {
  const l = L[lingua];
  await page.getByRole('button', { name: l.imp }).click();
  await page.waitForSelector('.pl-lista');
  await page.getByRole('button', { name: l.incolla }).click();
  await page.locator('textarea').fill(file);
  await page.getByRole('button', { name: l.leggi }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: modo === 'Unisci' ? l.unisci : l.sost }).click();
  await page.waitForTimeout(300);
  const conf = page.getByRole('button', { name: l.si });
  if (await conf.count()) { await conf.first().click(); await page.waitForTimeout(300); }
  const nota = (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').match(/(Fatto|Done)\.[^.]*\./)?.[0] ?? '(nessun «Fatto.»)'));
  await page.locator('.pl-hud__menu').first().click();
  await page.waitForSelector('.pl-home__menu');
  await page.waitForTimeout(300);
  return nota;
}
async function ricarica(page) {
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.pl-home__menu, .pl-hud, .pl-apertura', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}
async function tappa(page, numero, lingua) {
  await page.getByRole('button', { name: L[lingua].mappa }).click();
  await page.waitForSelector('.pl-tappa');
  const t = page.locator(`.pl-tappa[aria-label^="${L[lingua].liv} ${numero}:"]`);
  if (!(await t.count())) await page.getByRole('tab', { name: numero > 100 ? /Torre|Tower/ : /Ponte|Bridge/ }).click();
  // Al centro: con le schede fisse in cima, scrollIntoViewIfNeeded lascia la tappa sotto le
  // schede (misurato a 640x360: il tocco cadeva su «Il Ponte»).
  await t.evaluate((el) => el.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(200);
  const info = { disabled: await t.isDisabled(), nome: await t.getAttribute('aria-label') };
  return { t, info };
}

const FILE = {};
for (const lingua of ['it', 'en']) {
  FILE[lingua] = {
    p10: await esporta(da(1, 10), lingua), p5: await esporta(da(1, 5), lingua),
    p100: await esporta(da(1, 100), lingua), p110: await esporta(da(1, 110), lingua),
  };
}
const oraMeno = (min) => ({ 'plinto:ripresa': { dove: 'quadro', quadro: null, quando: Date.now() - min * 60000 } });

const formati = process.env.FORMATI ? process.env.FORMATI.split(',') : ['360x640'];
const lingue = process.env.LINGUE ? process.env.LINGUE.split(',') : ['it', 'en'];

for (const formato of formati) for (const lingua of lingue) {
  const F = FILE[lingua];
  const tag = (id) => `${id} ${formato} ${lingua}`;

  // ---- R1: Ponte finito, 100 a meta' (3 mosse), ripresa di 10 minuti fa sul 100.
  {
    const extra = oraMeno(10); extra['plinto:ripresa'].quadro = 100;
    const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: da(1, 100), aMeta: voceAMeta(100, 3), extra, attendi: '.pl-hud, .pl-home__menu' });
    log(`${tag('R1')} avvio: ${await dove(page)} (ripresa automatica del 100 attesa: il 100 e' aperto)`);
    if (!(await dove(page)).startsWith('plancia 100')) p(`${tag('R1')}: all'avvio non riprende il 100`);
    // Torno in home con il menu della plancia? Piu' semplice: ricarico senza ripresa.
    await page.evaluate((r) => localStorage.setItem('plinto:ripresa', JSON.stringify(r)), extra['plinto:ripresa']);
    await page.goto(page.url().split('#')[0] + '#', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('plinto:ripresa'));
    await ricarica(page);
    await page.evaluate((r) => localStorage.setItem('plinto:ripresa', JSON.stringify({ ...r, quando: Date.now() - 600000 })), extra['plinto:ripresa']);
    log(`  home: «${await grande(page)}» voce ${await voce(page)}`);
    const nota = await importa(page, F.p10, 'Sostituisci', lingua);
    const g1 = await grande(page);
    log(`  Sostituisci con 1-10: nota «${nota.slice(0, 120)}» | grande «${g1}» | voce ${await voce(page)} | ripresa ${await ripresa(page)}`);
    if (g1 !== `${L[lingua].liv} 11`) p(`${tag('R1')}: dopo Sostituisci 1-10 il pulsante dice «${g1}»`);
    if (formato === '360x640') await page.screenshot({ path: `${OUT}/po042-R1-dopo-sostituisci-${formato}-${lingua}.png` });
    await ricarica(page);
    const d1 = await dove(page);
    log(`  ricarica (ripresa del 100 di 10 min fa ancora scritta): ${d1} | grande «${await grande(page)}» | voce ${await voce(page)}`);
    if (d1 !== 'home') p(`${tag('R1')}: ricaricando si e' finiti in ${d1}`);
    {
      const { info } = await tappa(page, 100, lingua);
      log(`  mappa, tappa 100: disabled=${info.disabled} «${info.nome}»`);
      if (!info.disabled) p(`${tag('R1')}: la tappa 100 non e' chiusa`);
      await page.goBack(); await page.waitForTimeout(300);
    }
    // Rimetto il salvataggio completo.
    const nota2 = await importa(page, F.p100, 'Sostituisci', lingua);
    const g2 = await grande(page);
    log(`  Sostituisci con 1-100: nota «${nota2.slice(0, 120)}» | grande «${g2}» | voce ${await voce(page)} | ripresa ${await ripresa(page)}`);
    if (g2 !== `${L[lingua].liv} 101`) p(`${tag('R1')}: dopo il ripristino il pulsante dice «${g2}»`);
    await ricarica(page);
    const d2 = await dove(page);
    log(`  ricarica dopo il ripristino (ripresa entro due ore): ${d2} | voce ${await voce(page)}`);
    if (d2 === 'home') {
      const { t, info } = await tappa(page, 100, lingua);
      log(`  mappa, tappa 100: disabled=${info.disabled}`);
      await tocca(page, t); await page.waitForTimeout(500);
      const d3 = await dove(page);
      log(`  tocco sul 100 dalla mappa: ${d3} | voce ${await voce(page)}`);
      if (!/^plancia 100/.test(d3) || !(await voce(page)).startsWith('100/3m')) p(`${tag('R1')}: il 100 non torna riprendibile con le 3 mosse (${d3})`);
    } else if (!/^plancia 100/.test(d2) || !(await voce(page)).startsWith('100/3m')) p(`${tag('R1')}: dopo ricarica ${d2}`);
    if (errori.length) p(`${tag('R1')}: errori ${errori.join(' ; ')}`);
    await contesto.close();
  }

  // ---- R2: come R1 ma «Unisci» con 1-10: non cambia niente.
  {
    const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: da(1, 100), aMeta: voceAMeta(100, 3) });
    await importa(page, F.p10, 'Unisci', lingua);
    const g = await grande(page);
    const { t, info } = await tappa(page, 100, lingua);
    await tocca(page, t); await page.waitForTimeout(500);
    const d = await dove(page);
    log(`${tag('R2')} Unisci 1-10 su Ponte finito + 100 a meta': grande «${g}» | tappa 100 disabled=${info.disabled} | tocco: ${d} | voce ${await voce(page)}`);
    if (g !== `${L[lingua].liv} 101` || !/^plancia 100/.test(d)) p(`${tag('R2')}: atteso «Livello 101» e il 100 ripreso`);
    if (errori.length) p(`${tag('R2')}: errori ${errori.join(' ; ')}`);
    await contesto.close();
  }

  // ---- R3: livello NON superato a meta' (l'11, 3 mosse), ripresa di 30 min fa sull'11.
  {
    const extra = oraMeno(30); extra['plinto:ripresa'].quadro = 11;
    const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: da(1, 10), aMeta: voceAMeta(11, 3), attendi: '.pl-home__menu' });
    const nota = await importa(page, F.p5, 'Sostituisci', lingua);
    const g1 = await grande(page);
    log(`${tag('R3')} 1-10 + 11 a meta', Sostituisci con 1-5: grande «${g1}» | voce ${await voce(page)}`);
    if (g1 !== `${L[lingua].liv} 6`) p(`${tag('R3')}: pulsante «${g1}» invece di «${L[lingua].liv} 6»`);
    await page.evaluate((r) => localStorage.setItem('plinto:ripresa', JSON.stringify({ ...r, quando: Date.now() - 1800000 })), extra['plinto:ripresa']);
    await ricarica(page);
    const d1 = await dove(page);
    log(`  ricarica con la ripresa dell'11 (30 min): ${d1}`);
    if (d1 !== 'home') p(`${tag('R3')}: ricaricando ${d1}`);
    const nota2 = await importa(page, F.p10, 'Sostituisci', lingua);
    const g2 = await grande(page);
    log(`  Sostituisci con 1-10 (ripristino): grande «${g2}» | voce ${await voce(page)} | ripresa ${await ripresa(page)}`);
    if (g2 !== `${L[lingua].liv} 11`) p(`${tag('R3')}: dopo il ripristino «${g2}»`);
    await ricarica(page);
    const d2 = await dove(page);
    log(`  ricarica dopo il ripristino (ripresa ancora entro due ore): ${d2} | voce ${await voce(page)}`);
    if (d2 === 'home') {
      await tocca(page, pulsanteGrande(page)); await page.waitForTimeout(500);
      const d3 = await dove(page);
      log(`  tocco su «${g2}»: ${d3} | voce ${await voce(page)}`);
      if (!/^plancia 11/.test(d3) || !(await voce(page)).startsWith('11/3m')) p(`${tag('R3')}: l'11 non si riprende con 3 mosse (${d3})`);
    } else if (!/^plancia 11/.test(d2)) p(`${tag('R3')}: dopo il ripristino ${d2}`);
    if (errori.length) p(`${tag('R3')}: errori ${errori.join(' ; ')}`);
    void nota; void nota2;
    await contesto.close();
  }

  // ---- R4: Torre. 1-110 + 105 a meta' (superato); Sostituisci con 1-100; poi con 1-110.
  {
    const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: da(1, 110), aMeta: voceAMeta(105, 3) });
    await importa(page, F.p100, 'Sostituisci', lingua);
    const g1 = await grande(page);
    const { info } = await tappa(page, 105, lingua);
    log(`${tag('R4')} 1-110 + 105 a meta', Sostituisci con 1-100: grande «${g1}» | tappa 105 disabled=${info.disabled} | voce ${await voce(page)}`);
    if (g1 !== `${L[lingua].liv} 101` || !info.disabled) p(`${tag('R4')}: atteso «Livello 101» e il 105 chiuso`);
    await page.goBack(); await page.waitForTimeout(300);
    await importa(page, F.p110, 'Sostituisci', lingua);
    const g2 = await grande(page);
    const { t } = await tappa(page, 105, lingua);
    await tocca(page, t); await page.waitForTimeout(500);
    const d = await dove(page);
    log(`  Sostituisci con 1-110: grande «${g2}» | tocco sul 105: ${d} | voce ${await voce(page)}`);
    if (!/^plancia 105/.test(d)) p(`${tag('R4')}: il 105 non torna riprendibile (${d})`);
    if (errori.length) p(`${tag('R4')}: errori ${errori.join(' ; ')}`);
    await contesto.close();
  }

  // ---- R5: il limite dichiarato. Dopo il Sostituisci povero si apre la presentazione dell'11.
  {
    const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: da(1, 100), aMeta: voceAMeta(100, 3) });
    await importa(page, F.p10, 'Sostituisci', lingua);
    await tocca(page, pulsanteGrande(page)); await page.waitForTimeout(500);
    const d0 = await dove(page);
    const v0 = await voce(page);
    for (let i = 0; i < 3 && !(await page.locator('.pl-home__menu').count()); i += 1) { await page.goBack(); await page.waitForTimeout(300); }
    await importa(page, F.p100, 'Sostituisci', lingua);
    const { t } = await tappa(page, 100, lingua);
    await tocca(page, t); await page.waitForTimeout(500);
    const d = await dove(page);
    log(`${tag('R5')} dopo Sostituisci 1-10 apro «Livello 11»: ${d0}, voce ${v0}; ripristino 1-100, tocco il 100: ${d} | voce ${await voce(page)}`);
    if (errori.length) p(`${tag('R5')}: errori ${errori.join(' ; ')}`);
    await contesto.close();
  }
}
await browser.close();
log(`\nPROBLEMI: ${problemi}`);
process.exit(problemi ? 1 : 0);
