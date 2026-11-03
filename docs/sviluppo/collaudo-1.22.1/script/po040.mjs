// Collaudo 1.22.1 - PO-040 (O1, O2, O3) e regressioni vicine sulla mappa, sul sito pubblicato.
import { apri, nuovoBrowser, pulsanteGrande, testo, tocca, da, FORMATI, OUT } from './comune.mjs';

const browser = await nuovoBrowser();
const FORM = Object.keys(FORMATI);

// ---------- O1: avviso della Torre ----------
for (const formato of (process.env.SALTA_O1 ? [] : FORM)) {
  for (const lingua of ['it', 'en']) {
    const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: da(1, 100), settings: { avvisoTorre: false } });
    const dlg = page.locator('[role="dialog"]');
    const c = await dlg.count();
    const txt = c ? (await dlg.first().innerText()).replace(/\s+/g, ' ') : '-';
    const fuoco = await page.evaluate(() => document.activeElement?.textContent?.trim());
    const nomeDlg = c ? await dlg.first().evaluate((d) => d.getAttribute('aria-label') ?? (d.getAttribute('aria-labelledby') ? document.getElementById(d.getAttribute('aria-labelledby'))?.textContent : null)) : null;
    const box = c ? await dlg.first().boundingBox() : null;
    const vw = FORMATI[formato].viewport;
    const dentro = box ? box.x >= 0 && box.y >= 0 && box.x + box.width <= vw.width + 0.5 && box.y + box.height <= vw.height + 0.5 : null;
    const flag = await page.evaluate(() => JSON.parse(localStorage.getItem('plinto:settings')).avvisoTorre);
    if (lingua === 'it' || formato === '360x640') await page.screenshot({ path: `${OUT}/o1-avviso-${formato}-${lingua}.png` });
    let esito = '-';
    if (c) {
      await tocca(page, dlg.first().locator('button').first());
      await page.waitForTimeout(400);
      const scelta = await page.locator('[role="tab"][aria-selected="true"]').innerText().catch(() => '?');
      esito = `dopo il primo pulsante: scheda scelta «${scelta.replace(/\s+/g, ' ')}»`;
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.pl-home__menu');
    await page.waitForTimeout(500);
    const dopo = await page.locator('[role="dialog"]').count();
    console.log(`O1 ${formato} ${lingua} | finestra ${c} | nome «${nomeDlg}» | «${txt}» | fuoco «${fuoco}» | dentro lo schermo ${dentro} | avvisoTorre ${flag} | ${esito} | dopo ricarica finestre ${dopo} | errori ${errori.length}`);
    await contesto.close();
  }
}
// O1 negativo: Non ora, poi mappa e ritorno; 101 superato; 99 su 100
{
  const { contesto, page } = await apri(browser, { livelli: da(1, 100), settings: { avvisoTorre: false } });
  await page.getByRole('button', { name: 'Non ora' }).click();
  await page.waitForTimeout(300);
  await pulsanteGrande(page).count();
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForTimeout(400);
  await page.locator('.pl-hud__menu').first().click();
  await page.waitForTimeout(400);
  console.log(`O1 Non ora -> mappa -> home: finestre ${await page.locator('[role="dialog"]').count()}`);
  await contesto.close();
}
for (const [nome, liv] of [['101 superato', da(1, 101)], ['99 su 100', da(1, 99)], ['nessun livello', []]]) {
  const { contesto, page } = await apri(browser, { livelli: liv, settings: { avvisoTorre: false } });
  console.log(`O1 ${nome}: finestre ${await page.locator('[role="dialog"]').count()}`);
  await contesto.close();
}
// O1 con la guida non vista: la guida prima, poi l'avviso?
{
  const { contesto, page } = await apri(browser, { livelli: da(1, 100), settings: { avvisoTorre: false, introVista: false }, attendi: null });
  await page.waitForTimeout(1500);
  const guida = await page.locator('.pl-primo-avvio, [class*="primo"]').count();
  console.log(`O1 con la guida non vista: elementi guida ${guida}, finestre ${await page.locator('[role="dialog"]').count()}, testo «${(await testo(page)).slice(0, 120)}»`);
  // salta la guida
  const salta = page.getByRole('button', { name: /Salta|Non mostrarmela/ });
  if (await salta.count()) { await salta.first().click(); await page.waitForTimeout(700); }
  console.log(`O1 dopo aver saltato la guida: finestre ${await page.locator('[role="dialog"]').count()} «${(await page.locator('[role="dialog"]').first().innerText().catch(() => '-')).replace(/\s+/g, ' ')}»`);
  await contesto.close();
}

// ---------- O2 e O3: mappa ----------
for (const formato of FORM) {
  for (const lingua of ['it', 'en']) {
    for (const [nome, liv] of [['57', da(1, 57)], ['ponte', da(1, 100)], ['99', da(1, 99)]]) {
      const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: liv });
      await tocca(page, page.locator('.pl-sfida-avvio--mappa'));
      await page.waitForSelector('[role="tab"]');
      await page.waitForTimeout(700);
      const vw = FORMATI[formato].viewport;
      const schede = await page.locator('[role="tab"]').evaluateAll((els) => els.map((e) => {
        const r = e.getBoundingClientRect();
        return { t: e.innerText.replace(/\s+/g, ' '), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), sel: e.getAttribute('aria-selected'), tab: e.tabIndex, nome: e.getAttribute('aria-label') };
      }));
      const corrente = await page.locator('.pl-tappa--corrente, [aria-current="step"], [aria-current="true"]').first().boundingBox().catch(() => null);
      const sporge = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      let txt = '';
      if (nome !== 'ponte') {
        // tocca la scheda della Torre chiusa
        await tocca(page, page.locator('[role="tab"]').nth(1));
        await page.waitForTimeout(500);
        txt = await testo(page);
        if (formato === '360x640' || formato === '640x360') await page.screenshot({ path: `${OUT}/o2o3-torre-chiusa-${nome}-${formato}-${lingua}.png` });
      } else if (formato === '360x640' || formato === '640x360') {
        await page.screenshot({ path: `${OUT}/o2-mappa-ponte-finito-${formato}-${lingua}.png` });
      }
      const riga = /Si apre quando arrivi al livello|Opens when you reach level/i.test(txt);
      const riquadro = (txt.match(/(Te ne mancano \d+|Te ne manca \d+|\d+ to go[^.]*)/) ?? [''])[0];
      // tastiera: freccia destra dalla scheda scelta
      await page.locator('[role="tab"][aria-selected="true"]').focus();
      await page.keyboard.press('ArrowLeft');
      await page.waitForTimeout(200);
      const dopoFreccia = await page.evaluate(() => document.activeElement?.getAttribute('role') + ':' + document.activeElement?.innerText.replace(/\s+/g, ' ') + ':' + document.activeElement?.getAttribute('aria-selected'));
      console.log(`O2 ${formato} ${lingua} ${nome} | schede ${JSON.stringify(schede)} | corrente ${corrente ? `${Math.round(corrente.y)}-${Math.round(corrente.y + corrente.height)}` : '-'} | sporge ${sporge} | Torre chiusa: riga «Si apre…» ${riga}, riquadro «${riquadro}» | freccia sinistra -> ${dopoFreccia} | errori ${errori.length}`);
      await contesto.close();
    }
  }
}
await browser.close();
