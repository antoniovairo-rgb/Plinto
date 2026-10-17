import { afterEach, describe, expect, it } from 'vitest';
import { mediaPunteggio, MEDIA_VERA } from '../src/ui/schermate/Statistiche.jsx';
import { impostaLingua } from '../src/i18n/formato.js';

// D4: la media va calcolata sul NUMERO delle partite, non sul numero gia' formattato.
// I casi sono quelli che rompevano il calcolo vecchio: 1000 partite in inglese («1,000»
// -> NaN) e 10 000 in italiano («10.000» -> 10, media mille volte troppo alta).
describe('punteggio medio in Statistiche (D4)', () => {
  afterEach(() => impostaLingua('it'));

  it("l'interruttore e' acceso", () => {
    expect(MEDIA_VERA).toBe(true);
  });

  for (const [lingua, partite] of [['it', 4], ['it', 10000], ['it', 12345], ['en', 1000], ['en', 12345]]) {
    it(`${lingua}, ${partite} partite: media = totale / partite`, () => {
      impostaLingua(lingua);
      expect(mediaPunteggio({ partite, punteggioTotale: partite * 5000 })).toBe(5000);
    });
  }
});
