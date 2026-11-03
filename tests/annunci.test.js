/**
 * O5 del collaudo 1.22.0: l'annuncio per il lettore di schermo dopo una mossa.
 *
 * Il collaudo ha sentito «1 riga eliminate», «piu' 1 punti» e «Eccellente!. 1 riga...».
 * Qui si costruisce la frase con le traduzioni vere, senza browser: la frase e' una
 * funzione pura di `lastMove`. Con ANNUNCI_ACCORDATI spento questi casi sono rossi.
 */
import { describe, it, expect } from 'vitest';
import { frasePerMossa } from '../src/ui/Annunci.jsx';
import { traduttore } from '../src/i18n/index.js';

const it_ = traduttore('it');
const en = traduttore('en');

/** Una mossa senza incitamento (nessun gruppo) o con i gruppi e il livello indicati. */
function mossa({ gruppi = [], punti = 10, tier = 'buona', catena = 0 } = {}) {
  return {
    groups: gruppi.map((type) => ({ type })),
    points: punti,
    tier,
    chainAfter: catena,
    catenaMigliorePrima: 99,
    fillBefore: 0,
    fillAfter: 0,
    boardCleared: false,
    gameOver: false,
  };
}

describe('annunci: accordi e punteggiatura (O5)', () => {
  it('una riga: «1 riga eliminata», non «eliminate»', () => {
    const frase = frasePerMossa(mossa({ gruppi: ['row'] }), it_);
    expect(frase).toContain('1 riga eliminata.');
    expect(frase).not.toContain('eliminate');
  });

  it('una colonna e un quadrante prendono il loro genere', () => {
    expect(frasePerMossa(mossa({ gruppi: ['col'] }), it_)).toContain('1 colonna eliminata.');
    expect(frasePerMossa(mossa({ gruppi: ['quadrant'] }), it_)).toContain('1 quadrante eliminato.');
  });

  it('al plurale: femminile con sole righe e colonne, maschile se c\'e\' un quadrante', () => {
    expect(frasePerMossa(mossa({ gruppi: ['row', 'row'] }), it_)).toContain('2 righe eliminate.');
    expect(frasePerMossa(mossa({ gruppi: ['row', 'col'] }), it_)).toContain('1 riga, 1 colonna eliminate.');
    expect(frasePerMossa(mossa({ gruppi: ['row', 'quadrant'] }), it_)).toContain('1 riga, 1 quadrante eliminati.');
    expect(frasePerMossa(mossa({ gruppi: ['quadrant', 'quadrant'] }), it_)).toContain('2 quadranti eliminati.');
  });

  it('«più 1 punto» al singolare, «più 2 punti» al plurale', () => {
    expect(frasePerMossa(mossa({ punti: 1 }), it_)).toBe('più 1 punto.');
    expect(frasePerMossa(mossa({ punti: 2 }), it_)).toBe('più 2 punti.');
    expect(frasePerMossa(mossa({ punti: 1 }), en)).toBe('plus 1 point.');
    expect(frasePerMossa(mossa({ punti: 2 }), en)).toBe('plus 2 points.');
  });

  it('niente punto dopo il punto esclamativo dell\'incitamento', () => {
    const frase = frasePerMossa(mossa({ gruppi: ['row'], tier: 'eccellente', punti: 1 }), it_);
    expect(frase).toBe('Eccellente! 1 riga eliminata. più 1 punto.');
    expect(frase).not.toMatch(/[!?]\./);
    const inglese = frasePerMossa(mossa({ gruppi: ['row'], tier: 'eccellente', punti: 1 }), en);
    expect(inglese).not.toMatch(/[!?]\./);
    expect(inglese).toContain('1 row cleared.');
  });

  it('una frase senza punto finale lo riceve, come prima', () => {
    const frase = frasePerMossa(mossa({ gruppi: ['row'], tier: 'buona' }), it_);
    expect(frase).toBe('Bene. 1 riga eliminata. più 10 punti.');
  });
});
