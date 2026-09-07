import { describe, it, expect } from 'vitest';
import { accoglienza } from '../src/sim/accoglienza.mjs';
import { createGame } from '../src/core/engine.js';
import { createGrid, gridFromString, idx, fillRatio } from '../src/core/grid.js';
import { SHAPES } from '../src/core/shapes.js';
import { MODALITA } from '../src/config/rules.js';

/**
 * L'accoglienza: quanto bene una griglia riceve la terna successiva.
 *
 * E' il pezzo che permette ai giocatori artificiali di USARE l'anteprima invece di
 * limitarsi a subirne il costo. Se sbagliasse, le misure con cui si tarano i cento
 * bersagli direbbero il falso -- e sarebbero un falso comodo, perche' direbbero che
 * l'anteprima non cambia niente. Per questo qui si controlla proprio che RICONOSCA la
 * differenza fra una griglia che fa posto e una che non ne fa.
 */

/** Un metro semplice: meno riempita e' la griglia dopo, meglio e'. */
const metroSemplice = (dopo, gruppi) => gruppi.length * 100 - fillRatio(dopo) * 50;

/** Una terna finta fatta con le forme del catalogo. */
function terna(...ids) {
  return ids.map((id, i) => {
    const shape = SHAPES.find((s) => s.id === id);
    if (!shape) throw new Error(`forma inesistente: ${id}`);
    return { uid: `t${i}`, shapeId: id, shape, color: 1, bombe: [] };
  });
}

describe('accoglienza', () => {
  it('su una griglia vuota piazza tutta la terna e non e bloccata', () => {
    const { valore, bloccato } = accoglienza(createGrid(), terna('h3', 'b22', 'v3'), metroSemplice);
    expect(bloccato).toBe(false);
    expect(Number.isFinite(valore)).toBe(true);
  });

  it('dichiara bloccato quando un pezzo non ha piu posto', () => {
    // Griglia piena tranne due celle isolate agli angoli: nessun pezzo da tre celle entra.
    const righe = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => (
      (r === 0 && c === 0) || (r === 8 && c === 8) ? '.' : '1'
    )).join(''));
    const piena = gridFromString(righe.join('\n'), 3);
    const { bloccato } = accoglienza(piena, terna('h3'), metroSemplice);
    expect(bloccato).toBe(true);
  });

  it('si ferma al primo pezzo che non entra, senza saltarlo', () => {
    // Se saltasse il pezzo impiazzabile e continuasse con i successivi, un giocatore
    // che usa questa funzione crederebbe di sopravvivere a una mano che lo uccide.
    const righe = Array.from({ length: 9 }, (_, r) => Array.from({ length: 9 }, (_, c) => (
      r === 0 && c < 2 ? '.' : '1'
    )).join(''));
    const quasiPiena = gridFromString(righe.join('\n'), 3);
    // 'h3' non entra (servono tre celle in fila), 'p1' entrerebbe: l'ordine conta.
    const esito = accoglienza(quasiPiena, terna('h3', 'p1'), metroSemplice);
    expect(esito.bloccato).toBe(true);
    expect(esito.valore).toBe(0);   // nemmeno il primo pezzo e' stato valutato
  });

  it('distingue una griglia che fa posto da una che non ne fa', () => {
    // Stessa terna, due griglie con LO STESSO numero di celle piene ma disposte
    // diversamente: una lascia una fascia libera, l'altra lascia buchi sparsi.
    const ordinata = gridFromString([
      '111111111', '111111111', '111111111', '111111111',
      '.........', '.........', '.........', '.........', '.........',
    ].join('\n'), 3);
    const sparsa = gridFromString([
      '1.1.1.1.1', '.1.1.1.1.', '1.1.1.1.1', '.1.1.1.1.',
      '1.1.1.1.1', '.1.1.1.1.', '1.1.1.1.1', '.1.1.1.1.', '1.1.1.1.1',
    ].join('\n'), 3);
    const t = terna('h3', 'h3', 'h3');
    const a = accoglienza(ordinata, t, metroSemplice);
    const b = accoglienza(sparsa, t, metroSemplice);
    expect(b.bloccato, 'nessun h3 entra in una scacchiera').toBe(true);
    expect(a.bloccato).toBe(false);
    expect(a.valore).toBeGreaterThan(b.valore);
  });

  it('non tocca la griglia che riceve', () => {
    const partenza = createGrid();
    partenza[idx(4, 4)] = 1;
    const copia = partenza.slice();
    accoglienza(partenza, terna('h3', 'b22'), metroSemplice);
    expect([...partenza]).toEqual([...copia]);
  });

  it('una terna vuota o assente vale zero e non blocca', () => {
    expect(accoglienza(createGrid(), [], metroSemplice)).toEqual({ valore: 0, bloccato: false });
    expect(accoglienza(createGrid(), null, metroSemplice)).toEqual({ valore: 0, bloccato: false });
    expect(accoglienza(createGrid(), [null, null], metroSemplice)).toEqual({ valore: 0, bloccato: false });
  });

  it('legge la terna VERA che il motore consegnera', () => {
    // Non un pezzo qualunque: quella in `manoSuccessiva`. E' l'unica informazione che
    // l'anteprima concede, e usarne un'altra sarebbe barare nella misura.
    const s = createGame({ seed: 'accoglienza', modalita: MODALITA.ANTEPRIMA });
    expect(s.manoSuccessiva).toHaveLength(3);
    const esito = accoglienza(s.grid, s.manoSuccessiva, metroSemplice);
    expect(esito.bloccato).toBe(false);
  });
});
