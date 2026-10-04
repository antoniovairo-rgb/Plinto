import { describe, it, expect } from 'vitest';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../src/core/quadro.js';
import { createRng, seedFromString } from '../src/core/rng.js';
import { preferenze, scegliMossa } from '../src/sim/giocatore-quadri.mjs';

/**
 * Il giocatore artificiale tara i livelli dell'Arena: con l'obiettivo «Demolisci N
 * mattoni» deve mirare ai mattoni, perche' conta solo la seconda eliminazione e chi non
 * lo sa chiude i gruppi comodi e lascia i mattoni dove sono. Misurato il 4 ottobre 2026:
 * con «Demolisci 4» in 25 mosse, senza mira 3 vittorie su 12, con la mira 8.
 */

const GRIGLIA = [
  'R.......R', '.........', '..R...R..', '.........', '....R....',
  '.........', '..R...R..', '.........', 'R.......R',
].join('\n');

function gioca(quadro, seme, pref) {
  const rng = createRng(seedFromString(seme));
  let partita = iniziaQuadro(quadro, { now: 0 });
  for (let m = 0; m < quadro.maxMosse && !statoQuadro(quadro, partita).finito; m += 1) {
    const s = scegliMossa(partita, pref, rng);
    if (!s) break;
    const dopo = giocaNelQuadro(quadro, partita, s.handIndex, s.row, s.col, m);
    expect(dopo).not.toBe(partita);   // la mossa scelta era legale
    partita = dopo;
  }
  return partita;
}

describe('il giocatore artificiale sui mattoni rinforzati', () => {
  const quadro = { numero: 4000, nome: 'prova', obiettivi: [{ tipo: 'demolizioni', quanti: 4 }], maxMosse: 25, griglia: GRIGLIA };

  it('con l obiettivo delle demolizioni sa che cosa vale', () => {
    const pref = preferenze(quadro);
    expect(pref.demolire).toBeGreaterThan(pref.incrinare);
    expect(pref.incrinare).toBeGreaterThan(0);
    expect(preferenze({ obiettivi: [{ tipo: 'righe', quanti: 3 }] }).demolire).toBe(0);
  });

  it('mirando ai mattoni ne demolisce di piu che senza mira, sugli stessi semi', () => {
    let conMira = 0;
    let senzaMira = 0;
    for (let i = 0; i < 4; i += 1) {
      conMira += gioca(quadro, `gm-${i}`, preferenze(quadro)).stats.mattoniDemoliti;
      senzaMira += gioca(quadro, `gm-${i}`, { ...preferenze(quadro), incrinare: 0, demolire: 0 }).stats.mattoniDemoliti;
    }
    expect(conMira).toBeGreaterThan(senzaMira);
  });
});
