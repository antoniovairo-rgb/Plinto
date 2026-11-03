/**
 * O1 del collaudo 1.22.0: l'avviso «La Torre e' aperta: altri cento livelli...».
 *
 * Il PO ha voluto «cento» in lettere, come nella festa del Ponte (trionfo.aperta.torre).
 * La regola del progetto vuole i numeri dalle regole: qui si controlla che la parola
 * scritta sia il numero vero dei livelli della Torre, in italiano e in inglese, cosi' il
 * giorno in cui la Torre cambia misura questo test lo dice.
 */
import { describe, it, expect } from 'vitest';
import { OPERE, livelliDellOpera } from '../src/config/quadri.js';
import { traduttore } from '../src/i18n/index.js';

const PAROLE = { it: { cento: 100, duecento: 200 }, en: { 'a hundred': 100, 'two hundred': 200 } };
const torre = OPERE.find((o) => o.id === 'torre');

/** I numeri scritti in lettere che compaiono in un testo. */
function numeriInLettere(testo, lingua) {
  return Object.entries(PAROLE[lingua])
    .filter(([parola]) => new RegExp(`\\b${parola}\\b`, 'i').test(testo))
    .map(([, n]) => n);
}

describe('avviso della Torre aperta (O1)', () => {
  for (const lingua of ['it', 'en']) {
    for (const chiave of ['avvisoTorre.testo', 'trionfo.aperta.torre']) {
      it(`${lingua} ${chiave}: il numero in lettere e' quello dei livelli della Torre`, () => {
        const testo = traduttore(lingua)(chiave);
        const numeri = numeriInLettere(testo, lingua);
        expect(numeri.length, testo).toBeGreaterThan(0);
        for (const n of numeri) expect(n, testo).toBe(livelliDellOpera(torre));
      });
    }
  }
  it('il controllo sa fallire: «duecento» non e\' cento', () => {
    expect(numeriInLettere('altri duecento livelli', 'it')).toEqual([200]);
  });
});
