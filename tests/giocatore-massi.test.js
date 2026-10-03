import { describe, it, expect } from 'vitest';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../src/core/quadro.js';
import { createRng, seedFromString } from '../src/core/rng.js';
import { MASSO } from '../src/core/grid.js';
import { preferenze, scegliMossa } from '../src/sim/giocatore-quadri.mjs';

/**
 * Il giocatore artificiale tara i livelli della Torre: deve saper giocare una griglia
 * con i massi senza mosse illegali e senza che un masso sparisca, e raggiungere un
 * obiettivo semplice.
 */

const GRIGLIA = [
  'M...M...M', '.........', '.........',
  'M...M...M', '.........', '.........',
  'M...M...M', '.........', '.........',
].join('\n');

function gioca(quadro, tentativo) {
  const rng = createRng(seedFromString(`prova-${quadro.numero}-${tentativo}`));
  let partita = iniziaQuadro(quadro, { now: 0 });
  const pref = preferenze(quadro);
  for (let mossa = 0; mossa < quadro.maxMosse && !statoQuadro(quadro, partita).finito; mossa += 1) {
    const scelta = scegliMossa(partita, pref, rng);
    if (!scelta) break;
    const dopo = giocaNelQuadro(quadro, partita, scelta.handIndex, scelta.row, scelta.col, mossa * 1000);
    expect(dopo).not.toBe(partita);   // la mossa scelta era legale
    partita = dopo;
  }
  return partita;
}

describe('il giocatore artificiale sui massi', () => {
  it('gioca senza mosse illegali, i massi restano tutti, e l'obiettivo si raggiunge', () => {
    const quadro = { numero: 1001, nome: 'prova', obiettivi: [{ tipo: 'righe', quanti: 2 }], maxMosse: 12, griglia: GRIGLIA };
    const partita = gioca(quadro, 0);
    expect(partita.grid.filter((v) => v === MASSO).length).toBe(9);
    expect(partita.stats.clearedRows).toBeGreaterThanOrEqual(2);
  });
});
