/**
 * Il confronto: gli stessi cento livelli, giocati con e senza l'anteprima.
 *
 * PERCHE' UNO STRUMENTO E NON UNA TABELLA SCRITTA A MANO. La regola del progetto e' che
 * ogni numero pubblicato debba essere rifatto da un comando. Questo legge le due uscite
 * di `tools/taratura.mjs` -- che misura FIN DOVE ARRIVA il giocatore artificiale, senza
 * fermarsi a un obiettivo -- e ne fa la differenza, atto per atto.
 *
 * PERCHE' LA TARATURA E NON LE RIUSCITE. `tools/quadri.mjs` misura quante volte il
 * livello viene superato, ed e' la domanda giusta per il giocatore ma la misura
 * sbagliata per questo confronto: con i bersagli attuali il metro supera quasi tutto,
 * quindi la percentuale e' schiacciata contro il cento e non ha spazio per salire.
 * "Fin dove arriva" invece e' una misura continua: si vede eccome, se il giocatore
 * arriva piu' lontano.
 *
 * Uso:
 *   node tools/taratura.mjs 12 base      > /tmp/base.txt
 *   node tools/taratura.mjs 12 anteprima > /tmp/anteprima.txt
 *   node tools/confronto-anteprima.mjs /tmp/base.txt /tmp/anteprima.txt
 */

import { readFileSync } from 'node:fs';
import { QUADRI } from '../src/config/quadri.js';

const [fileBase, fileAnteprima] = process.argv.slice(2);
if (!fileBase || !fileAnteprima) {
  console.error('Uso: node tools/confronto-anteprima.mjs <uscita base> <uscita anteprima>');
  process.exit(1);
}

/**
 * Legge le righe della tabella di taratura.
 * Formato: `  12  catena12          catena         22        2       4      6             3  ->  4`
 * @returns {Map<string, {min:number, med:number, max:number}>} chiave `numero/tipo`
 */
function leggi(percorso) {
  const misure = new Map();
  let numero = null;
  for (const riga of readFileSync(percorso, 'utf8').split('\n')) {
    const m = riga.match(/^\s{2}(\s*\d+|\s+)\s{2}\S*\s+(\w+)\s+(\S+)\s+(-?\d+)\s+(-?\d+)\s+(-?\d+)\s/);
    if (!m) continue;
    if (m[1].trim()) numero = Number(m[1]);
    if (numero === null) continue;
    misure.set(`${numero}/${m[2]}`, { min: Number(m[4]), med: Number(m[5]), max: Number(m[6]) });
  }
  return misure;
}

const base = leggi(fileBase);
const ante = leggi(fileAnteprima);
if (base.size === 0 || ante.size === 0) {
  console.error('Nessuna riga letta: le due uscite non hanno il formato atteso.');
  process.exit(1);
}

/** Gli atti: sette blocchi di livelli, come nel percorso. */
const ATTI = [[1, 12], [13, 26], [27, 42], [43, 58], [59, 74], [75, 90], [91, 100]];

console.log('\nPLINTO — quanto lontano arriva il metro, con e senza anteprima');
console.log(`  base:      ${fileBase}`);
console.log(`  anteprima: ${fileAnteprima}\n`);
console.log('  atto        obiettivi  mediana base  mediana ant.  differenza  livelli meglio / uguale / peggio');
console.log('  ' + '-'.repeat(94));

let totMeglio = 0; let totUguale = 0; let totPeggio = 0;
const righeTotali = [];

for (const [da, a] of ATTI) {
  const chiavi = [];
  for (const q of QUADRI) {
    if (q.numero < da || q.numero > a) continue;
    for (const o of q.obiettivi) {
      const k = `${q.numero}/${o.tipo}`;
      if (base.has(k) && ante.has(k)) chiavi.push(k);
    }
  }
  if (chiavi.length === 0) continue;

  // Le mediane si confrontano in RAPPORTO, non in differenza assoluta: "arrivare a 3
  // invece che a 1" e "arrivare a 300 punti invece che a 100" sono lo stesso salto, e
  // sommare righe e punteggi come se fossero la stessa unita' non vorrebbe dire niente.
  let rapporti = 0; let meglio = 0; let uguale = 0; let peggio = 0;
  let sommaBase = 0; let sommaAnte = 0;
  for (const k of chiavi) {
    const b = base.get(k); const n = ante.get(k);
    sommaBase += b.med; sommaAnte += n.med;
    rapporti += b.med > 0 ? n.med / b.med : (n.med > 0 ? 2 : 1);
    if (n.med > b.med) meglio += 1; else if (n.med === b.med) uguale += 1; else peggio += 1;
  }
  totMeglio += meglio; totUguale += uguale; totPeggio += peggio;
  righeTotali.push(...chiavi);

  const rapporto = rapporti / chiavi.length;
  console.log(
    `  ${String(da).padStart(3)}-${String(a).padEnd(3)}  ${String(chiavi.length).padStart(9)}  `
    + `${(sommaBase / chiavi.length).toFixed(1).padStart(12)}  ${(sommaAnte / chiavi.length).toFixed(1).padStart(12)}  `
    + `${(rapporto >= 1 ? '+' : '') + ((rapporto - 1) * 100).toFixed(0).padStart(9)}%  `
    + `${String(meglio).padStart(7)} / ${String(uguale).padStart(6)} / ${String(peggio).padStart(6)}`,
  );
}

console.log('  ' + '-'.repeat(94));
console.log(`  su ${righeTotali.length} obiettivi misurati: `
  + `${totMeglio} il metro arriva piu' lontano con l'anteprima, `
  + `${totUguale} uguale, ${totPeggio} meno lontano.`);
console.log(`\n  Comando: node tools/confronto-anteprima.mjs ${fileBase} ${fileAnteprima}`);
console.log(`  Misurato il ${new Date().toISOString().slice(0, 10)}\n`);
