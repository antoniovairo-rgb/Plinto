import { describe, it, expect } from 'vitest';
import {
  LA4, GRADI, LIVELLO_MASSIMO, frequenzaDiSemitoni, frequenzaDiCatena, frequenzaCatenaGiu,
  noteIntreccio,
} from '../src/audio/scala.js';
import { CHAIN_MAX } from '../src/config/rules.js';

/**
 * La scala del gioco.
 *
 * Che il suono ESCA davvero non lo prova nessun test automatico, ed e' scritto anche in
 * docs/TESTING.md: serve un orecchio. Quello che si puo' provare a tavolino e' che le
 * note siano quelle giuste, ed e' proprio la parte che sbaglia in silenzio -- una nota
 * fuori scala non rompe niente, si limita a stonare, e stonare non lo segnala nessuno.
 */

/** La tabella dichiarata: pentatonica minore di La, dieci gradi, temperamento equabile. */
const ATTESE = [
  ['La3', 220.00], ['Do4', 261.63], ['Re4', 293.66], ['Mi4', 329.63], ['Sol4', 392.00],
  ['La4', 440.00], ['Do5', 523.25], ['Re5', 587.33], ['Mi5', 659.26], ['Sol5', 783.99],
];

describe('le frequenze', () => {
  it('la scala ha un grado per ogni livello di Catena', () => {
    expect(GRADI).toBe(CHAIN_MAX + 1);
    expect(LIVELLO_MASSIMO).toBe(CHAIN_MAX);
  });

  it.each(ATTESE)('il grado di %s vale %f Hz', (nome, attesa) => {
    const livello = ATTESE.findIndex(([n]) => n === nome);
    expect(frequenzaDiCatena(livello)).toBeCloseTo(attesa, 1);
  });

  it('sono calcolate dal temperamento equabile, non trascritte', () => {
    expect(frequenzaDiSemitoni(0)).toBe(LA4);
    expect(frequenzaDiSemitoni(12)).toBeCloseTo(LA4 * 2, 10);
    expect(frequenzaDiSemitoni(-12)).toBeCloseTo(LA4 / 2, 10);
  });

  it('la scala sale sempre: nessun livello suona piu basso del precedente', () => {
    for (let l = 1; l <= CHAIN_MAX; l += 1) {
      expect(frequenzaDiCatena(l)).toBeGreaterThan(frequenzaDiCatena(l - 1));
    }
  });

  it('un livello fuori scala produce comunque una nota della scala', () => {
    expect(frequenzaDiCatena(-5)).toBe(frequenzaDiCatena(0));
    expect(frequenzaDiCatena(99)).toBe(frequenzaDiCatena(CHAIN_MAX));
    expect(frequenzaDiCatena(undefined)).toBe(frequenzaDiCatena(0));
    expect(Number.isFinite(frequenzaDiCatena(NaN))).toBe(true);
  });
});

describe('l arpeggio dell Intreccio', () => {
  it('ha una nota per ogni gruppo chiuso', () => {
    expect(noteIntreccio(1, 0)).toHaveLength(1);
    expect(noteIntreccio(3, 0)).toHaveLength(3);
    expect(noteIntreccio(0, 5)).toEqual([]);
  });

  it('sale: chiudere tre gruppi suona diverso da chiuderne uno', () => {
    const tre = noteIntreccio(3, 2);
    expect(tre[1]).toBeGreaterThan(tre[0]);
    expect(tre[2]).toBeGreaterThan(tre[1]);
    expect(tre[0]).toBe(frequenzaDiCatena(2));
  });

  it('parte dalla Catena applicata: piu alta la Catena, piu alta la prima nota', () => {
    expect(noteIntreccio(1, 7)[0]).toBeGreaterThan(noteIntreccio(1, 2)[0]);
  });

  it('sopra l ultimo grado sale di ottava invece di uscire dalla scala', () => {
    // Con Catena 9 e quattro gruppi si va oltre i dieci gradi: le note in eccesso
    // devono essere le stesse un'ottava sopra, non frequenze inventate.
    const note = noteIntreccio(4, CHAIN_MAX);
    expect(note).toHaveLength(4);
    // Il grado dopo il Sol5 e' il La5: la scala ricomincia DUE ottave sopra il La3,
    // non una. Salendo di una sola, l'arpeggio scenderebbe a meta' della raffica.
    expect(note[1]).toBeCloseTo(frequenzaDiCatena(0) * 4, 6);
    note.forEach((f) => expect(f).toBeGreaterThan(0));
    for (let i = 1; i < note.length; i += 1) {
      expect(note[i], 'l arpeggio deve restare ascendente').toBeGreaterThan(note[i - 1]);
    }
  });

  it('un numero di gruppi assurdo non produce frequenze assurde', () => {
    const note = noteIntreccio(30, 0);
    expect(note).toHaveLength(30);
    // Nessuna nota oltre l'udibile: 30 gruppi non capitano, ma se capitassero non
    // devono produrre un fischio.
    note.forEach((f) => expect(Number.isFinite(f)).toBe(true));
  });
});

describe('la Catena che scende', () => {
  it('suona un grado sotto quello che si aveva', () => {
    expect(frequenzaCatenaGiu(5)).toBe(frequenzaDiCatena(4));
    expect(frequenzaCatenaGiu(1)).toBe(frequenzaDiCatena(0));
  });

  it('da zero non scende sotto zero', () => {
    expect(frequenzaCatenaGiu(0)).toBe(frequenzaDiCatena(0));
  });
});
