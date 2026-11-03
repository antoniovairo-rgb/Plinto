import { apri, nuovoBrowser, pulsanteGrande, testo, tocca, da } from './comune.mjs';
const browser = await nuovoBrowser();

// a) l'esportazione porta avvisoTorre
{
  const { contesto, page } = await apri(browser, { livelli: da(1, 100), formato: '1366x768', settings: { avvisoTorre: true } });
  await contesto.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: /^Impostazioni/ }).click();
  await page.getByRole('button', { name: /^Copia il testo$/ }).click();
  await page.waitForTimeout(300);
  const f = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  console.log('ESPORTA settings:', JSON.stringify(f.dati?.settings ?? f.dati?.['plinto:settings'] ?? Object.keys(f.dati)), 'versioneGioco', f.versioneGioco);
  await contesto.close();
}

// c) libera e sfida: avvio, uscita, ripresa
for (const formato of ['360x640', '640x360', '768x1024', '1366x768']) {
  for (const modo of ['libera', 'sfida']) {
    const { contesto, page, errori } = await apri(browser, { formato, livelli: da(1, 100) });
    const card = modo === 'libera' ? page.getByRole('button', { name: /^Partita libera/ }).first() : page.getByRole('button', { name: /^Sfida del giorno/ }).first();
    await tocca(page, card);
    await page.waitForSelector('.pl-hud', { timeout: 8000 });
    await page.waitForTimeout(400);
    const seme = await page.evaluate((m) => { const k = m === 'libera' ? 'plinto:partita' : 'plinto:partita-sfida'; const v = JSON.parse(localStorage.getItem(k) ?? 'null'); return v ? (v.seedLabel ?? v.seed ?? 'presente') : null; }, modo);
    // esci dal menu: Indietro del browser
    await page.goBack();
    await page.waitForTimeout(600);
    const inHome = await page.locator('.pl-home__menu').count();
    const snap = inHome ? (await page.locator('.pl-home__azioni').ariaSnapshot()).split('\n').filter((r) => /libera|Sfida|Riprendi/i.test(r)).join(' || ') : (await testo(page)).slice(0, 100);
    // ripresa
    let ripresa = '-';
    if (inHome) {
      const rip = modo === 'libera' ? page.getByRole('button', { name: /Riprendi la partita|^Partita libera, / }).first() : page.getByRole('button', { name: /^Sfida del giorno/ }).first();
      if (await rip.count()) {
        await tocca(page, rip);
        await page.waitForTimeout(600);
        const dlg = await page.locator('[role="dialog"]').count();
        ripresa = `${(await page.locator('.pl-hud').count()) ? 'plancia' : 'altro'}${dlg ? ' + domanda' : ''} «${(await testo(page)).slice(0, 60)}»`;
      }
    }
    console.log(`${modo} ${formato} | salvata ${seme} | Indietro -> home ${inHome} | ${snap} | ripresa: ${ripresa} | errori ${errori.length}`);
    await contesto.close();
  }
}
await browser.close();
