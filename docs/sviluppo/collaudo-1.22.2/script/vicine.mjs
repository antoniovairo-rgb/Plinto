// Collaudo 1.22.2 - regressioni vicine a PO-043: le altre domande di ConfermaPerdita
// (riprova, altra sfida, nuova libera, avviso della Torre) hanno ancora il pulsante che non
// perde niente pieno, primo e con il fuoco; Escape non perde niente.
import { apri, nuovoBrowser, tocca, da, voceAMeta, leggiDomanda, liberaAMeta, sfidaAMeta, OUT, FORMATI } from './comune.mjs';

const browser = await nuovoBrowser();
const formati = process.env.FORMATI ? process.env.FORMATI.split(',') : Object.keys(FORMATI);
const lingue = ['it', 'en'];
let problemi = 0;
const log = (s) => console.log(s);
const p = (s) => { problemi += 1; log(`  PROBLEMA ${s}`); };

const ieri = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
const L = {
  it: { menu: /menu/i, riprova: /^Riprova$/, sfida: /^Sfida del giorno/, libera: /^Nuova partita libera/, torna: { R: /^Torna alla partita/, S: /^Riprendi la sfida del/, N: /^Riprendi la partita$/, T: /^Entra nella Torre$/ } },
  en: { menu: /menu/i, riprova: /^Try again$/, sfida: /^Daily challenge/, libera: /^New free game/, torna: { R: /^Back to the game/i, S: /^Resume the .* challenge$/, N: /^Resume game$/, T: /^Enter the Tower$/ } },
};

const chiavi = (page) => page.evaluate(() => {
  const g = (k) => JSON.parse(localStorage.getItem(k) ?? 'null');
  return { quadro: g('plinto:partita-quadro')?.partita?.stats?.moves ?? null, libera: g('plinto:partita')?.stats?.moves ?? null, sfida: g('plinto:partita-sfida') ? `${g('plinto:partita-sfida').seedLabel}/${g('plinto:partita-sfida').stats.moves}` : null };
});

for (const formato of formati) for (const lingua of lingue) {
  const l = L[lingua];
  const casi = [
    { id: 'R', nome: 'Riprova con mosse fatte', prepara: { livelli: da(1, 3), aMeta: voceAMeta(4, 2), extra: { 'plinto:ripresa': { dove: 'quadro', quadro: 4, quando: Date.now() - 60000 } }, attendi: '.pl-hud' },
      apri: async (page) => { await page.locator('.pl-hud__menu').first().click(); await page.waitForTimeout(300); await tocca(page, page.getByRole('button', { name: l.riprova }).first()); } },
    { id: 'S', nome: 'Sfida di oggi con quella di ieri a meta\'', prepara: { extra: { 'plinto:partita-sfida': sfidaAMeta(ieri, 2) } },
      apri: async (page) => { await tocca(page, page.getByRole('button', { name: l.sfida }).first()); } },
    { id: 'N', nome: 'Nuova partita libera con una libera a meta\'', prepara: { extra: { 'plinto:partita': liberaAMeta(2) } },
      apri: async (page) => { await tocca(page, page.getByRole('button', { name: l.libera }).first()); } },
    { id: 'T', nome: 'Avviso della Torre (Ponte finito, mai vista)', prepara: { livelli: da(1, 100), settings: { avvisoTorre: false } },
      apri: async () => {} },
  ];
  for (const caso of casi) {
    const tag = `${caso.id} ${formato} ${lingua}`;
    const { contesto, page, errori } = await apri(browser, { formato, lingua, ...caso.prepara });
    const prima = await chiavi(page);
    await caso.apri(page);
    await page.waitForSelector('.pl-azzera--perdita', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(250);
    const d = await leggiDomanda(page);
    if (!d) { p(`${tag}: nessuna domanda`); await contesto.close(); continue; }
    log(`${tag} | «${d.nome}» | ${JSON.stringify(d.pulsanti)}`);
    const [a, b] = d.pulsanti;
    if (!a || !l.torna[caso.id].test(a.nome) || !a.pieno || !a.fuoco) p(`${tag}: il primo e' «${a?.nome}» pieno=${a?.pieno} fuoco=${a?.fuoco}`);
    if (!b || b.pieno || b.fuoco) p(`${tag}: il secondo «${b?.nome}» pieno=${b?.pieno}`);
    if (formato === '360x640') await page.screenshot({ path: `${OUT}/vicine-${caso.id}-${formato}-${lingua}.png` });
    if (caso.id !== 'T') {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      const dopo = await chiavi(page);
      const aperta = await page.locator('.pl-azzera--perdita').count();
      log(`  Escape: finestra ${aperta ? 'APERTA' : 'chiusa'} | prima ${JSON.stringify(prima)} dopo ${JSON.stringify(dopo)}`);
      if (aperta || JSON.stringify(prima) !== JSON.stringify(dopo)) p(`${tag}: Escape ha cambiato qualcosa`);
    }
    if (errori.length) p(`${tag}: errori ${errori.join(' ; ')}`);
    await contesto.close();
  }
}
await browser.close();
log(`\nPROBLEMI: ${problemi}`);
process.exit(problemi ? 1 : 0);
