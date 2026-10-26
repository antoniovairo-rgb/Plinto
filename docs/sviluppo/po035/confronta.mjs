/**
 * PO-035: confronta le firme d'impaginazione di due corse di `misura.mjs`.
 * Per ogni formato e scena: identica (ogni elemento di #root nello stesso rettangolo) o
 * diversa, con le prime differenze.
 *
 * Uso: node docs/sviluppo/po035/confronta.mjs <prima/misure.json> <dopo/misure.json>
 */
import { readFile } from 'node:fs/promises';

const [A, B] = process.argv.slice(2);
const prima = JSON.parse(await readFile(A, 'utf8'));
const dopo = JSON.parse(await readFile(B, 'utf8'));
const chiave = (r) => `${r.formato} ${r.scena}`;
const mappa = new Map(dopo.map((r) => [chiave(r), r]));
let diverse = 0;
for (const a of prima) {
  const b = mappa.get(chiave(a));
  if (!b) { console.log(`${chiave(a).padEnd(32)} manca dopo`); continue; }
  if (a.errore || b.errore) { console.log(`${chiave(a).padEnd(32)} errore: prima ${a.errore ?? '-'} | dopo ${b.errore ?? '-'}`); continue; }
  // La classe del vassoio e quella della schermata di gioco sono nuove per costruzione:
  // si confrontano i rettangoli, non i nomi.
  const norma = (f) => f.map((x) => x.replace(/^DIV\.pl-tray-involucro /, 'DIV. ').replace(/^DIV\.pl-tray-scelta /, 'DIV. '));
  const fa = norma(a.firma), fb = norma(b.firma);
  const diff = [];
  for (let i = 0; i < Math.max(fa.length, fb.length); i += 1) if (fa[i] !== fb[i]) diff.push(`${fa[i] ?? '-'}  ->  ${fb[i] ?? '-'}`);
  if (diff.length === 0) console.log(`${chiave(a).padEnd(32)} identica (${fa.length} elementi)`);
  else { diverse += 1; console.log(`${chiave(a).padEnd(32)} DIVERSA in ${diff.length} elementi su ${fa.length}: ${diff.slice(0, 2).join(' | ')}`); }
}
console.log(`\n${diverse} scene diverse`);
