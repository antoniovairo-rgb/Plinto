// Collaudo 1.22.2 - PO-043: la domanda «Il livello M e' a meta'» quando M e' gia' superato.
// Contro il sito pubblicato (URL_SITO), service worker bloccato. Uscita: righe di testo.
import { apri, nuovoBrowser, pulsanteGrande, salvato, tocca, da, voceAMeta, leggiDomanda, OUT, FORMATI } from './comune.mjs';

const browser = await nuovoBrowser();
const formati = process.env.FORMATI ? process.env.FORMATI.split(',') : Object.keys(FORMATI);
const lingue = process.env.LINGUE ? process.env.LINGUE.split(',') : ['it', 'en'];
const righe = [];
const log = (s) => { righe.push(s); console.log(s); };
const voce = (page) => page.evaluate(() => {
  const v = JSON.parse(localStorage.getItem('plinto:partita-quadro') ?? 'null');
  return v ? `${v.numero}/${v.partita?.stats?.moves ?? '?'}m/${v.presentazione ? 'pres' : 'gioco'}` : 'null';
});
const dove = (page) => page.evaluate(() => {
  if (document.querySelector('.pl-apertura')) {
    const m = document.querySelector('.pl-apertura').innerText.match(/(Livello|Level)\s+(\d+)/i);
    return `presentazione ${m?.[2]}`;
  }
  if (document.querySelector('.pl-hud')) {
    const m = document.body.innerText.replace(/\s+/g, ' ').match(/(LIVELLO|LEVEL)\s+(\d+)/i);
    return `plancia ${m?.[2]}`;
  }
  if (document.querySelector('.pl-home__menu')) return 'home';
  return 'altro';
});

/** Arriva alla domanda: pulsante grande (o tappa della mappa), poi «Gioca». */
async function allaDomanda(page, { daMappa = null, lingua }) {
  if (daMappa) {
    await page.getByRole('button', { name: lingua === 'it' ? /^Mappa dei livelli/ : /^Level map/ }).click();
    const tappa = page.locator(`.pl-tappa[aria-label^="${lingua === 'it' ? 'Livello' : 'Level'} ${daMappa}:"]`);
    if (!(await tappa.count())) {
      // La scheda giusta dell'opera
      await page.getByRole('tab', { name: daMappa > 100 ? /Torre|Tower/ : /Ponte|Bridge/ }).click();
    }
    await tappa.evaluate((el) => el.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(200);
    await tocca(page, tappa);
  } else {
    await tocca(page, pulsanteGrande(page));
  }
  await page.waitForSelector('.pl-apertura', { timeout: 5000 });
  await tocca(page, page.locator('.pl-apertura .pl-btn--primario').first());
  await page.waitForSelector('.pl-azzera--perdita', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(250);
}

const CASI = [
  { id: 'E', nome: 'Ponte finito, 100 a meta\' (3 mosse)', livelli: da(1, 100), aMeta: voceAMeta(100, 3), nuovo: 101, lasciato: 100, superato: true },
  { id: 'W', nome: '1-110, il 105 della Torre a meta\' (3 mosse)', livelli: da(1, 110), aMeta: voceAMeta(105, 3), nuovo: 111, lasciato: 105, superato: true },
  { id: 'T', nome: '200 su 200, il 150 a meta\' (3 mosse)', livelli: da(1, 200), aMeta: voceAMeta(150, 3), nuovo: 200, lasciato: 150, superato: true },
  { id: 'E2', nome: '1-10 e 12, l\'11 a meta\' NON superato; 13 dalla mappa', livelli: [...da(1, 10), 12], aMeta: voceAMeta(11, 3), nuovo: 13, lasciato: 11, superato: false, daMappa: 13 },
];

const ETI = {
  it: { gioca: (n) => `Gioca il livello ${n}`, riprendi: (n) => `Riprendi il livello ${n}`, titolo: (n) => `Il livello ${n} è a metà.` },
  en: { gioca: (n) => `Play level ${n}`, riprendi: (n) => `Resume level ${n}`, titolo: (n) => `Level ${n} is in progress.` },
};

let problemi = 0;
const p = (s) => { problemi += 1; log(`  PROBLEMA ${s}`); };

for (const formato of formati) {
  for (const lingua of lingue) {
    const e = ETI[lingua];
    for (const caso of CASI) {
      const tag = `${caso.id} ${formato} ${lingua}`;
      const { contesto, page, errori } = await apri(browser, { formato, lingua, livelli: caso.livelli, aMeta: caso.aMeta });
      const etichettaGrande = (await pulsanteGrande(page).textContent()).trim();
      await allaDomanda(page, { daMappa: caso.daMappa, lingua });
      const d = await leggiDomanda(page);
      if (!d) { p(`${tag}: nessuna domanda (${await dove(page)})`); await contesto.close(); continue; }
      const atteso = caso.superato
        ? [e.gioca(caso.nuovo), e.riprendi(caso.lasciato)]
        : [e.riprendi(caso.lasciato), e.gioca(caso.nuovo)];
      log(`${tag} | grande «${etichettaGrande}» | dialog «${d.nome}» modale=${d.modale} | ${JSON.stringify(d.pulsanti)}`);
      if (d.pulsanti.length !== 2) p(`${tag}: ${d.pulsanti.length} pulsanti`);
      else {
        const [a, b] = d.pulsanti;
        if (a.nome !== atteso[0] || !a.pieno || !a.fuoco) p(`${tag}: primo «${a.nome}» pieno=${a.pieno} fuoco=${a.fuoco}, atteso «${atteso[0]}» pieno col fuoco`);
        if (b.nome !== atteso[1] || b.pieno || b.fuoco) p(`${tag}: secondo «${b.nome}» pieno=${b.pieno}, atteso «${atteso[1]}» trasparente`);
      }
      if (d.nome !== e.titolo(caso.lasciato)) p(`${tag}: nome della finestra «${d.nome}»`);
      // La finestra sta nello schermo?
      const box = await page.locator('.pl-azzera--perdita').boundingBox();
      const vp = page.viewportSize();
      const fuori = box && (box.y < 0 || box.y + box.height > vp.height || box.x < 0 || box.x + box.width > vp.width);
      log(`  finestra ${Math.round(box.x)},${Math.round(box.y)} ${Math.round(box.width)}x${Math.round(box.height)} in ${vp.width}x${vp.height}${fuori ? ' FUORI' : ''}`);
      if (fuori) p(`${tag}: la finestra esce dallo schermo`);
      // Albero di accessibilita' (solo it 360x640 ed en 360x640, per il rapporto)
      if (formato === '360x640') {
        const snap = await page.locator('.pl-azzera--perdita').ariaSnapshot();
        log(`  ariaSnapshot: ${snap.replace(/\n/g, ' / ')}`);
        await page.screenshot({ path: `${OUT}/po043-${caso.id}-domanda-${formato}-${lingua}.png` });
      } else if (caso.id === 'E') {
        await page.screenshot({ path: `${OUT}/po043-${caso.id}-domanda-${formato}-${lingua}.png` });
      }

      const primaVoce = await voce(page);
      // 1. Escape, 2. tocco fuori, 3. Indietro: niente si perde, si resta sulla presentazione.
      for (const via of ['Escape', 'fuori', 'Indietro']) {
        if (!(await page.locator('.pl-azzera--perdita').count())) {
          await tocca(page, page.locator('.pl-apertura .pl-btn--primario').first());
          await page.waitForSelector('.pl-azzera--perdita', { timeout: 3000 }).catch(() => {});
          await page.waitForTimeout(150);
        }
        if (via === 'Escape') await page.keyboard.press('Escape');
        else if (via === 'fuori') {
          if (FORMATI[formato].hasTouch) await page.touchscreen.tap(5, 5); else await page.mouse.click(5, 5);
        } else await page.goBack({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(350);
        const aperta = await page.locator('.pl-azzera--perdita').count();
        const v = await voce(page);
        const qui = await dove(page);
        const fuoco = await page.evaluate(() => (document.activeElement?.innerText ?? document.activeElement?.tagName ?? '').trim().slice(0, 30) || document.activeElement?.tagName);
        log(`  ${via}: finestra ${aperta ? 'APERTA' : 'chiusa'} | ${qui} | voce ${v} | fuoco «${fuoco}»`);
        if (aperta) p(`${tag} ${via}: la finestra resta aperta`);
        if (v !== primaVoce) p(`${tag} ${via}: la voce e' cambiata ${primaVoce} -> ${v}`);
        if (qui !== `presentazione ${caso.nuovo}`) p(`${tag} ${via}: si e' finiti in «${qui}»`);
      }
      // 4. La scelta: in 360x640 Spazio sul pulsante col fuoco; negli altri Invio; poi il secondo pulsante in un contesto nuovo.
      await tocca(page, page.locator('.pl-apertura .pl-btn--primario').first());
      await page.waitForSelector('.pl-azzera--perdita', { timeout: 3000 }).catch(() => {});
      await page.waitForTimeout(150);
      const tasto = formato === '360x640' ? 'Space' : 'Enter';
      await page.keyboard.press(tasto);
      await page.waitForTimeout(400);
      const dopoTasto = `${await dove(page)} | voce ${await voce(page)}`;
      log(`  ${tasto} sul pulsante col fuoco -> ${dopoTasto}`);
      const attesoTasto = caso.superato ? `plancia ${caso.nuovo}` : `plancia ${caso.lasciato}`;
      if (!dopoTasto.startsWith(attesoTasto)) p(`${tag} ${tasto}: atteso «${attesoTasto}», visto «${dopoTasto}»`);
      if (errori.length) p(`${tag}: errori ${errori.join(' ; ')}`);
      await contesto.close();

      // Il secondo pulsante, toccato (o cliccato), fa quello che dice.
      {
        const { contesto: c2, page: p2, errori: er2 } = await apri(browser, { formato, lingua, livelli: caso.livelli, aMeta: caso.aMeta });
        await allaDomanda(p2, { daMappa: caso.daMappa, lingua });
        await tocca(p2, p2.locator('.pl-azzera--perdita .pl-azzera__scelte button').nth(1));
        await p2.waitForTimeout(400);
        const r = `${await dove(p2)} | voce ${await voce(p2)}`;
        const att = caso.superato ? `plancia ${caso.lasciato}` : `plancia ${caso.nuovo}`;
        log(`  secondo pulsante toccato -> ${r}`);
        if (!r.startsWith(att)) p(`${tag} secondo pulsante: atteso «${att}», visto «${r}»`);
        if (caso.superato && !r.includes('/3m/')) p(`${tag} secondo pulsante: la ripresa non ha le 3 mosse (${r})`);
        if (er2.length) p(`${tag}: errori ${er2.join(' ; ')}`);
        await c2.close();
      }
    }
  }
}
await browser.close();
log(`\nPROBLEMI: ${problemi}`);
process.exit(problemi ? 1 : 0);
