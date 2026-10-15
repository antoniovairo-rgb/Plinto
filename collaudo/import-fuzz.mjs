// File di salvataggio con busta valida (impronta corretta) ma contenuto strano: importato davvero dall'interfaccia (incolla + Sostituisci/Unisci).
// Poi si ricarica e si visitano tutte le schermate cercando eccezioni, schermo vuoto, NaN/undefined/[object Object] a schermo.
import { apri, testo, shot } from './lib.mjs';
import { impronta } from '../src/persistence/salvataggio.js';
const busta = (dati) => JSON.stringify({ gioco: 'plinto', formato: 1, versioneGioco: '1.21.6', esportatoIl: new Date().toISOString(), impronta: impronta(dati), dati });
const ok = { quadri: { versione: 1, livelli: { 1: { mosse: 10, punteggio: 100, tentativi: 1 } } } };
const casi = {
  'livelli array': { quadri: { versione: 1, livelli: [1, 2, 3] } },
  'livelli stringa': { quadri: { versione: 1, livelli: 'x' } },
  'livello null': { quadri: { versione: 1, livelli: { 1: null, 2: { mosse: '7' }, 3: { mosse: -5, punteggio: 'a' } } } },
  'livelli fuori range': { quadri: { versione: 1, livelli: { 0: { mosse: 3 }, 101: { mosse: 3 }, '-1': { mosse: 3 }, abc: { mosse: 3 }, 1.5: { mosse: 3 } } } },
  'mosse enormi': { quadri: { versione: 1, livelli: { 1: { mosse: 1e308, punteggio: 1e308, tentativi: 1e9 } } } },
  'records stringhe': { records: { versione: 1, best: 'abc', bestChain: null, bestMove: {}, bestGroupsInOneMove: [1] } },
  'statistiche stringhe': { statistiche: { versione: 1, partite: '5', punteggioTotale: 'x', mosseTotali: null, tempoTotaleMs: -1 } },
  'sfide strane': { sfide: { versione: 2, giorni: { '2026-13-45': { best: 5 }, x: 1, '2026-10-10': { best: '99', partite: 'a' }, '2099-01-01': { best: 1, partite: 1 } } } },
  'sfide array': { sfide: { versione: 2, giorni: [1, 2] } },
  'attrezzi strani': { attrezzi: { versione: 1, disponibili: 99, riscossi: -3 } },
  'attrezzi stringa': { attrezzi: { versione: 1, disponibili: '2', riscossi: 'x' } },
  'settings strani': { settings: { versione: 1, introVista: 'no', lingua: 'fr', tema: 'x', audio: 'si' } },
  'profilo strano': { profilo: { versione: 1, partite: '3', andamento: 'x', mappaAppoggi: [1, 2, 3], istogrammaCatena: 'a' } },
  'versione futura': { quadri: { versione: 99, livelli: { 1: { mosse: 4, punteggio: 1, tentativi: 1 } }, nuovoCampo: true } },
  'proto': JSON.parse('{"quadri":{"versione":1,"livelli":{"__proto__":{"mosse":1},"1":{"mosse":4,"punteggio":1,"tentativi":1}}}}'),
};
const schermate = ['Mappa dei livelli', 'Statistiche', 'Il tuo profilo di gioco', 'Archivio delle sfide', 'Impostazioni', 'Come si gioca', 'Info'];
for (const modo of ['Sostituisci tutto', 'Unisci']) {
  for (const [nome, dati] of Object.entries(casi)) {
    const { browser, page, errori } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
    await page.getByRole('button', { name: 'Impostazioni' }).click();
    await page.getByRole('button', { name: /Oppure incolla/ }).click();
    await page.locator('textarea').fill(busta(dati));
    await page.getByRole('button', { name: /^Leggi/ }).click(); await page.waitForTimeout(200);
    const msg = (await testo(page)).split('\n').filter((l) => /salvataggio ci sono|Fatto|non|illeggibile|rovinat/i.test(l)).join(' | ');
    const btn = page.getByRole('button', { name: new RegExp('^' + (modo === 'Unisci' ? 'Unisci' : 'Sostituisci tutto')) });
    if (await btn.count()) { await btn.click(); if (modo !== 'Unisci') await page.getByRole('button', { name: /^Sì$/ }).click(); }
    await page.waitForTimeout(200);
    await page.reload(); await page.waitForTimeout(500);
    const problemi = [];
    const controllaTesto = async (dove) => { const t = await testo(page); if (!t.trim()) problemi.push(`${dove}: schermo vuoto`); const m = t.match(/NaN|undefined|\[object Object\]|Infinity/); if (m) problemi.push(`${dove}: compare "${m[0]}" -> ${t.replace(/\n+/g, ' | ').slice(0, 160)}`); };
    await controllaTesto('home');
    for (const s of schermate) {
      const b = page.getByRole('button', { name: new RegExp('^' + s) });
      if (!(await b.count())) { problemi.push(`home: pulsante ${s} assente`); continue; }
      await b.first().click(); await page.waitForTimeout(250); await controllaTesto(s);
      await page.locator('.pl-hud__menu').first().click().catch(() => {}); await page.waitForTimeout(150);
    }
    // una partita libera con una mossa
    await page.getByRole('button', { name: /Partita libera|Riprendi la partita/ }).first().click().catch(() => {}); await page.waitForTimeout(300);
    await controllaTesto('partita');
    const ls = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([k]) => /quadri|statist|records|attrezzi|sfide/.test(k)).map(([k, v]) => [k.replace('plinto:', ''), v.slice(0, 90)])));
    const eccez = [...new Set(errori)].filter((e) => !/AudioContext/.test(e));
    if (problemi.length || eccez.length) console.log(`[${modo}] ${nome}: msg="${msg}"\n   PROBLEMI ${JSON.stringify(problemi)}\n   ERRORI ${JSON.stringify(eccez)}\n   storage ${JSON.stringify(ls)}`);
    else console.log(`[${modo}] ${nome}: ok (${msg.slice(0, 70)})`);
    await browser.close();
  }
}
