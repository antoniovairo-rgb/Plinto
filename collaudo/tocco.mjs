// Trascinamento col dito (eventi touch veri), a 360x640 e 412x915: piazzamento esatto, rilascio fuori griglia, annullamento, due dita.
import { apri } from './lib.mjs';
import { leggi, mosseValide, trascinaTocco } from './gioco.mjs';
for (const vp of [{ width: 360, height: 640 }, { width: 412, height: 915 }]) {
  const { browser, page, errori } = await apri({ viewport: vp, storage: { settings: { versione: 1, introVista: true } } });
  await page.getByRole('button', { name: 'Partita libera' }).click();
  await page.waitForSelector('.pl-plancia .pl-cella');
  let s = await leggi(page); const dif = [];
  for (let i = 0; i < 12; i += 1) {
    s = await leggi(page);
    const v = mosseValide(s); if (!v.length) break;
    const m = v[Math.floor(Math.random() * v.length)];
    const prima = s.griglia.map((r) => r.slice());
    await trascinaTocco(page, m);
    const dopo = (await leggi(page)).griglia;
    // atteso: le caselle del pezzo piene (se qualcosa si e' svuotato, il confronto e' parziale)
    const p = s.pezzi[m.pezzo];
    const attese = p.celle.map((f) => [m.r + f.r, m.c + f.c]);
    const ok = attese.every(([r, c]) => dopo[r][c] === 1) || JSON.stringify(dopo) !== JSON.stringify(prima) && attese.some(([r,c]) => prima[r][c] === 0 && dopo[r][c] === 0);
    const piene = dopo.flat().reduce((a, b) => a + b, 0), pp = prima.flat().reduce((a, b) => a + b, 0);
    if (piene !== pp + p.celle.length && !attese.every(([r, c]) => dopo[r][c] === 1)) dif.push(`mossa ${i}: origine (${m.r},${m.c}) pezzo ${p.celle.length} caselle: piene ${pp}->${piene}`);
  }
  console.log(`${vp.width}x${vp.height}: discrepanze tocco`, dif.length, dif.slice(0, 5));
  // rilascio fuori dalla griglia / annullato: niente deve cambiare
  s = await leggi(page); const pien0 = s.griglia.flat().reduce((a, b) => a + b, 0);
  const v = mosseValide(s);
  if (v.length) {
    const m = v[0];
    await trascinaTocco(page, { ...m, r: m.r }, { annulla: true });
    const s2 = await leggi(page); console.log('  touchCancel: caselle piene', pien0, '->', s2.griglia.flat().reduce((a, b) => a + b, 0), '(atteso uguale)');
    const cdp = page._cdp; const pb = await page.locator('.pl-tray .pl-pezzo-presa').nth(m.pezzo).boundingBox();
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: pb.x + pb.width / 2, y: pb.y + pb.height / 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 5, y: 5 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(150);
    const s3 = await leggi(page); console.log('  rilascio fuori dalla griglia: caselle piene', s3.griglia.flat().reduce((a, b) => a + b, 0), '(atteso uguale)', 'pezzi in mano', s3.pezzi.filter((p) => p).length);
  }
  console.log('  errori', [...new Set(errori)]);
  await browser.close();
}
