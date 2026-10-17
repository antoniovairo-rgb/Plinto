// pointercancel durante il trascinamento (gesto di sistema, bordo schermo, palmo): il pezzo viene appoggiato o no?
import { apri } from './lib.mjs';
import { leggi, mosseValide, trascinaTocco } from './gioco.mjs';
const { browser, page } = await apri({ storage: { settings: { versione: 1, introVista: true } } });
await page.getByRole('button', { name: 'Partita libera' }).click();
await page.waitForSelector('.pl-plancia .pl-cella');
const s = await leggi(page); const m = mosseValide(s)[0];
const n = (x) => x.griglia.flat().reduce((a, b) => a + b, 0);
await trascinaTocco(page, m, { annulla: true });
const d = await leggi(page);
console.log(`caselle piene prima=${n(s)} dopo touchCancel=${n(d)} pezzi in mano prima=${s.pezzi.filter(Boolean).length} dopo=${d.pezzi.filter(Boolean).length}; punteggio ${s.hud} -> ${d.hud}`);
console.log(n(d) > n(s) ? 'RIPRODOTTO: un gesto annullato dal sistema appoggia il pezzo' : 'non riprodotto');
await browser.close();
