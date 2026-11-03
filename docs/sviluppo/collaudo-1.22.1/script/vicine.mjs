// Collaudo 1.22.1 - regressioni vicine: nomi accessibili della home, ripresa del 100 dalla mappa.
import { apri, nuovoBrowser, pulsanteGrande, salvato, testo, tocca, da, voceAMeta, OUT } from './comune.mjs';

const browser = await nuovoBrowser();

// 1. Nomi accessibili della home in vari stati
for (const lingua of (process.env.SALTA1 ? [] : ["it","en"])) {
  for (const [nome, opz] of [
    ['nuovo', { livelli: [] }],
    ['ponte finito, 100 a meta\'', { livelli: da(1, 100), aMeta: voceAMeta(100, 1) }],
    ['200 su 200', { livelli: da(1, 200) }],
  ]) {
    const { contesto, page } = await apri(browser, { lingua, ...opz });
    const snap = await page.locator('.pl-home').ariaSnapshot();
    console.log(`\n== HOME ${lingua} ${nome} ==\n${snap}`);
    await contesto.close();
  }
}

// 2. Caso A: il 100 a meta' (3 mosse) si riprende dalla mappa, con le mosse
for (const formato of ['360x640', '640x360', '768x1024', '1366x768']) {
  const voce = voceAMeta(100, 3);
  const { contesto, page, errori } = await apri(browser, { formato, livelli: da(1, 100), aMeta: voce });
  await tocca(page, page.locator('.pl-sfida-avvio--mappa'));
  await page.waitForSelector('[role="tab"]');
  await page.waitForTimeout(500);
  const sceltaAll = await page.locator('[role="tab"][aria-selected="true"]').innerText();
  // vai al Ponte e tocca il 100
  await tocca(page, page.locator('[role="tab"]').first());
  await page.waitForTimeout(500);
  const t100 = page.locator('.pl-tappa[aria-label^="Livello 100:"]').first();
  await t100.scrollIntoViewIfNeeded();
  await tocca(page, t100);
  await page.waitForTimeout(700);
  const txt = await testo(page);
  const apertura = await page.locator('.pl-apertura').count();
  const hud = await page.locator('.pl-hud').count();
  const mosse = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:partita-quadro'))?.partita?.stats?.moves);
  console.log(`MAPPA->100 ${formato} | all'apertura scheda «${sceltaAll}» | dopo il tocco sul 100: ${apertura ? 'presentazione' : hud ? 'plancia' : 'altro'} | «${txt.slice(0, 110)}» | mosse salvate ${mosse} | errori ${errori.length}`);
  if (formato === '360x640') await page.screenshot({ path: `${OUT}/po008-ripresa-100-dalla-mappa-360x640-it.png` });
  // Indietro di sistema: dove si torna?
  await page.goBack().catch(() => {});
  await page.waitForTimeout(600);
  const dove = await page.evaluate(() => (document.querySelector('[role="tab"]') ? 'mappa' : document.querySelector('.pl-home__menu') ? 'home' : document.querySelector('.pl-hud') ? 'livello' : 'altro') + ' ' + location.hash);
  const btn = (await pulsanteGrande(page).count()) ? (await pulsanteGrande(page).textContent()).trim() : '-';
  console.log(`   Indietro -> ${dove} | salvato ${(await salvato(page))?.numero} | pulsante home ${btn}`);
  await contesto.close();
}

// 3. Nel caso A: «Gioca il livello 101» nella domanda -> il 100 si perde? E «Riprendi il livello 100» -> riprende?
for (const scelta of ['Riprendi il livello 100', 'Gioca il livello 101']) {
  const { contesto, page } = await apri(browser, { livelli: da(1, 100), aMeta: voceAMeta(100, 3) });
  await tocca(page, pulsanteGrande(page));
  await page.waitForSelector('.pl-apertura');
  await tocca(page, page.locator('.pl-apertura .pl-btn--primario').first());
  await page.waitForTimeout(400);
  const fuoco = await page.evaluate(() => document.activeElement?.textContent?.trim());
  await tocca(page, page.getByRole('button', { name: scelta }));
  await page.waitForTimeout(600);
  const txt = await testo(page);
  const sv = await salvato(page);
  console.log(`DOMANDA scelta «${scelta}» (fuoco iniziale su «${fuoco}") -> «${txt.slice(0, 80)}» | salvato ${sv?.numero} mosse ${sv?.partita?.stats?.moves}`);
  await contesto.close();
}
await browser.close();
