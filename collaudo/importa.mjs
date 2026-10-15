// Importazione di un salvataggio dalla schermata Impostazioni e stato mostrato al ritorno nella home.
import { apri, testo, shot } from './lib.mjs';
import { impronta } from '../src/persistence/salvataggio.js';
import { writeFileSync } from 'node:fs';

function file(dati, extra = {}) {
  return { gioco: 'plinto', formato: 1, versioneGioco: '1.21.6', esportatoIl: new Date().toISOString(), impronta: impronta(dati), dati, ...extra };
}
const livelli = {}; for (let n = 1; n <= 12; n += 1) livelli[n] = { mosse: 10 + n, punteggio: 100 * n, tentativi: 1 };
const dati = {
  quadri: { versione: 1, livelli },
  records: { versione: 1, best: 4321, bestChain: 7, bestMove: 250, bestGroupsInOneMove: 3 },
  statistiche: { versione: 1, partite: 17, punteggioTotale: 9000, mosseTotali: 500, gruppiTotali: 80, griglieSvuotate: 1, tempoTotaleMs: 600000 },
  sfide: { versione: 2, giorni: { '2026-10-10': { best: 777, partite: 2, regole: null } } },
  settings: { versione: 1, introVista: true, lingua: 'en', tema: 'chiaro' },
};
const p = '/tmp/claude-0/-home-user-Plinto/cef19c88-5f4e-5c35-9d19-f9638d39a3cc/scratchpad/salvataggio-ok.json';
writeFileSync(p, JSON.stringify(file(dati), null, 2));

const { browser, page, errori } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
const home0 = await testo(page);
console.log('HOME PRIMA:', home0.split('\n').filter((l) => /LIVELLO|di 100|Record|Partita|Sfida/.test(l)).join(' | '));
await page.getByRole('button', { name: 'Impostazioni' }).click();
await page.waitForTimeout(300);
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: /Scegli un file/ }).click()]);
await chooser.setFiles(p);
await page.waitForTimeout(300);
console.log('DOPO FILE:', (await testo(page)).split('\n').filter((l) => /trovat|Unisci|Sostituisci|livell/i.test(l)).join(' | '));
await page.getByRole('button', { name: /Unisci/ }).click();
await page.waitForTimeout(300);
console.log('DOPO UNISCI:', (await testo(page)).split('\n').filter((l) => /livell|fatto|import/i.test(l)).join(' | '));
await shot(page, 'importa-1-impostazioni');
// Ritorno alla home dal pulsante indietro della schermata
await page.locator('.pl-hud__menu').first().click();
await page.waitForTimeout(500);
const home1 = await testo(page);
console.log('HOME DOPO IMPORT (senza ricaricare):', home1.split('\n').filter((l) => /LIVELLO|di 100|Record|Partita|Sfida/.test(l)).join(' | '));
await shot(page, 'importa-2-home-dopo');
await page.reload(); await page.waitForTimeout(500);
const home2 = await testo(page);
console.log('HOME DOPO RICARICA:', home2.split('\n').filter((l) => /LIVELLO|di 100|Record|Partita|Sfida/.test(l)).join(' | '));
console.log(errori);
await browser.close();
