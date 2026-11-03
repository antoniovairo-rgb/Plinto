// Collaudo 1.22.1 - PO-041 e casi limite, sul sito pubblicato.
import { mkdirSync } from 'node:fs';
import { apri, nuovoBrowser, pulsanteGrande, salvato, testo, tocca, da, voceAMeta, OUT } from './comune.mjs';

mkdirSync(OUT, { recursive: true });
const browser = await nuovoBrowser();
const righe = [];
const log = (s) => { console.log(s); righe.push(s); };

const tutti = (n) => da(1, n);
const insistenza = (base, extra) => { const m = {}; for (const n of base) m[n] = { mosse: 12, punteggio: 300, tentativi: 1 }; Object.assign(m, extra); return m; };

const CASI = [
  { id: 'A', nome: 'Ponte finito, 100 a meta\' (1 mossa)', livelli: tutti(100), aMeta: voceAMeta(100, 1), atteso: 101 },
  { id: 'A0', nome: 'Ponte finito, 100 aperto senza mosse', livelli: tutti(100), aMeta: voceAMeta(100, 0), atteso: 101 },
  { id: 'T1', nome: '200 su 200, 150 a meta\'', livelli: tutti(200), aMeta: voceAMeta(150, 1), atteso: 200 },
  { id: 'T2', nome: '200 su 200, 200 a meta\'', livelli: tutti(200), aMeta: voceAMeta(200, 1), atteso: 200 },
  { id: 'T3', nome: '200 su 200, 1 a meta\'', livelli: tutti(200), aMeta: voceAMeta(1, 1), atteso: 200 },
  { id: 'W1', nome: '1-110 superati, 105 (Torre, superato) a meta\'', livelli: tutti(110), aMeta: voceAMeta(105, 1), atteso: 111 },
  { id: 'W2', nome: '1-110 superati, 101 (primo della Torre) a meta\'', livelli: tutti(110), aMeta: voceAMeta(101, 1), atteso: 111 },
  { id: 'I1', nome: '1-4, 5 con 8 tentativi non superato, 6 aperto per insistenza a meta\'', livelli: insistenza(da(1, 4), { 5: { tentativi: 8 } }), aMeta: voceAMeta(6, 1), atteso: 6 },
  { id: 'I2', nome: '1-4, 5 con 8 tentativi, 6-7 superati, 5 a meta\'', livelli: insistenza([...da(1, 4), 6, 7], { 5: { tentativi: 8 } }), aMeta: voceAMeta(5, 1), atteso: 5 },
  { id: 'I3', nome: '1-4, 5 con 8 tentativi, 6-7 superati, 6 a meta\'', livelli: insistenza([...da(1, 4), 6, 7], { 5: { tentativi: 8 } }), aMeta: voceAMeta(6, 1), atteso: 8 },
  { id: 'I4', nome: '1-98 superati, 99 con 8 tentativi, 99 a meta\'', livelli: insistenza(da(1, 98), { 99: { tentativi: 8 } }), aMeta: voceAMeta(99, 1), atteso: 99 },
  { id: 'N', nome: 'nessun livello a meta\', 1-57', livelli: tutti(57), aMeta: null, atteso: 58 },
];

for (const lingua of ['it', 'en']) {
  for (const caso of CASI) {
    const { contesto, page, errori } = await apri(browser, { lingua, livelli: caso.livelli, aMeta: caso.aMeta });
    const scritta = (await pulsanteGrande(page).textContent()).trim();
    const nome = await pulsanteGrande(page).evaluate((b) => b.getAttribute('aria-label') ?? '(nessun aria-label)');
    const mappa = await page.locator('.pl-sfida-avvio--mappa').getAttribute('aria-label');
    const prima = await salvato(page);
    const parola = lingua === 'it' ? 'Livello' : 'Level';
    const ok = scritta === `${parola} ${caso.atteso}`;
    // Tocco: si apre davvero quel livello?
    await tocca(page, pulsanteGrande(page));
    await page.waitForSelector('.pl-apertura, .pl-plancia, .pl-hud', { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(300);
    const dopo = await testo(page);
    const m = dopo.match(new RegExp(`${parola}\\s+(\\d+)`, 'i'));
    const aperto = m ? Number(m[1]) : null;
    const apertura = await page.locator('.pl-apertura').count();
    const plancia = await page.locator('.pl-plancia, .pl-griglia').count();
    // Se si apre la presentazione, tocca Gioca e guarda se arriva una domanda (PO-008 E1)
    let domanda = '-';
    if (apertura) {
      await tocca(page, page.locator('.pl-apertura .pl-btn--primario').first());
      await page.waitForTimeout(400);
      const velo = page.locator('.pl-velo [role="dialog"], [role="alertdialog"], [role="dialog"]');
      if (await velo.count()) domanda = (await velo.first().innerText()).replace(/\s+/g, ' ');
      else domanda = 'nessuna';
      if (caso.id === 'A' && lingua === 'it') await page.screenshot({ path: `${OUT}/po041-A-dopo-gioca-360x640-it.png` });
    }
    const dopoSalvato = await salvato(page);
    if (['A', 'T1', 'W1', 'I2'].includes(caso.id)) {
      // screenshot della home di questo caso
    }
    log(`${lingua} ${caso.id} | ${caso.nome} | pulsante «${scritta}» ${ok ? 'OK' : `ATTESO «${parola} ${caso.atteso}»`} | aria-label ${nome} | mappa «${mappa}» | tocco -> ${apertura ? 'presentazione' : plancia ? 'plancia' : 'altro'} livello ${aperto} | domanda: ${domanda} | salvato prima ${prima?.numero ?? null} dopo ${dopoSalvato?.numero ?? null} | errori ${errori.length}${errori.length ? ' ' + errori.join(' ; ') : ''}`);
    await contesto.close();
  }
}

// Screenshot home dei casi principali, it
for (const id of ['A', 'T1', 'W1', 'I2']) {
  const caso = CASI.find((c) => c.id === id);
  const { contesto, page } = await apri(browser, { livelli: caso.livelli, aMeta: caso.aMeta });
  await page.screenshot({ path: `${OUT}/po041-${id}-home-360x640-it.png` });
  await contesto.close();
}

await browser.close();
