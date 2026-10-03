import { describe, it, expect } from 'vitest';
import {
  createGame, placePiece, scavaCella, serializeGame, deserializeGame,
} from '../src/core/engine.js';
import {
  MASSO, eMasso, eBomba, coloreDi, conBomba, canPlace, isEmpty, idx, rowCells,
  gridFromString, gridToString, findCompletedGroups,
} from '../src/core/grid.js';
import { maggioranzaColore } from '../src/core/scoring.js';
import { getShape } from '../src/core/shapes.js';
import * as regole from '../src/config/rules.js';

/**
 * I MASSI, la meccanica della Torre: «un masso conta come pieno, ma non sparisce mai».
 *
 * Le quattro eccezioni sono state decise il 3 ottobre 2026 (docs/OPERA-TORRE.md) e ogni
 * prova qui sotto ne controlla una: il masso resta quando il suo gruppo si chiude, una
 * bomba non lo distrugge, il piccone non lo toglie, non ha colore e non impedisce alla
 * griglia di contare come svuotata.
 */

/** Stato di prova con griglia e mano scelte a mano. */
function scenario(gridText, shapeIds) {
  const base = createGame({ seed: 11 });
  return {
    ...base,
    grid: gridFromString(gridText),
    hand: shapeIds.map((id, i) => (
      id ? { uid: `t${i}`, shapeId: id, shape: getShape(id), color: 1, bombe: [] } : null
    )),
  };
}

const VUOTE = '.........\n'.repeat(8);

describe('il masso', () => {
  it('conta come pieno: una riga con un masso si chiude riempiendo le altre otto caselle', () => {
    const s = scenario(`M#######.\n${VUOTE}`, ['p1', 'p1', 'p1']);
    const dopo = placePiece(s, 0, 0, 8);
    expect(dopo.stats.clearedRows).toBe(1);
  });

  it('non sparisce quando il suo gruppo si chiude, e non conta fra le caselle eliminate', () => {
    const s = scenario(`M#######.\n${VUOTE}`, ['p1', 'p1', 'p1']);
    const dopo = placePiece(s, 0, 0, 8);
    expect(dopo.grid[idx(0, 0)]).toBe(MASSO);
    for (let c = 1; c < 9; c += 1) expect(dopo.grid[idx(0, c)]).toBe(0);
    expect(dopo.stats.clearedCells).toBe(8);
  });

  it('non ci si puo appoggiare sopra', () => {
    const s = scenario(`M........\n${VUOTE}`, ['p1', 'p1', 'p1']);
    expect(canPlace(s.grid, getShape('p1'), 0, 0)).toBe(false);
    expect(canPlace(s.grid, getShape('p1'), 0, 1)).toBe(true);
  });

  it('resiste alle bombe: l esplosione porta via tutto intorno tranne il masso', () => {
    const s = scenario(`#########\n#M.......\n${'.........\n'.repeat(7)}`, ['p1', 'p1', 'p1']);
    // Una bomba nella riga 0, colonna 1, appena sopra il masso. L'ultima casella della
    // riga resta vuota: la riempie il pezzo, la riga si chiude e la bomba esplode.
    s.grid[idx(0, 1)] = conBomba(1);
    s.grid[idx(0, 8)] = 0;
    const dopo = placePiece(s, 0, 0, 8);
    expect(dopo.grid[idx(1, 1)]).toBe(MASSO);   // il masso resta
    expect(dopo.grid[idx(1, 0)]).toBe(0);       // la casella accanto e' esplosa
  });

  it('non si scava: il piccone su un masso non fa niente e non costa il gettone', () => {
    const s = scenario(`M........\n${VUOTE}`, ['p1', 'p1', 'p1']);
    expect(scavaCella(s, idx(0, 0))).toBeNull();
  });

  it('non ha colore: non conta per la Tinta', () => {
    const grid = gridFromString(`MMM######\n${VUOTE}`);
    expect(maggioranzaColore(grid, rowCells(0))).toBe(6);
    expect(coloreDi(MASSO)).toBe(0);
    expect(eBomba(MASSO)).toBe(false);
    expect(eMasso(MASSO)).toBe(true);
  });

  it('non impedisce di svuotare la griglia: se restano solo massi, e svuotata', () => {
    const s = scenario(`M#######.\n....M....\n${'.........\n'.repeat(7)}`, ['p1', 'p1', 'p1']);
    const dopo = placePiece(s, 0, 0, 8);
    expect(isEmpty(dopo.grid)).toBe(true);
    expect(dopo.stats.boardClears).toBe(1);
  });

  it('un gruppo fatto solo di massi non si chiude, altrimenti darebbe punti a ogni mossa', () => {
    const grid = gridFromString(`MMMMMMMMM\n${VUOTE}`);
    expect(findCompletedGroups(grid)).toEqual([]);
    const s = scenario(`MMMMMMMMM\n${VUOTE}`, ['p1', 'p1', 'p1']);
    const dopo = placePiece(s, 0, 5, 5);
    expect(dopo.score).toBe(s.score + 1);       // solo il punto della casella appoggiata
    expect(dopo.stats.clearedRows).toBe(0);
  });

  it('si scrive e si legge con la lettera M', () => {
    const testo = `M#.......\n${'.........\n'.repeat(7)}........M`;
    expect(gridToString(gridFromString(testo))).toBe(testo);
  });

  it('sopravvive al salvataggio e alla ripresa della partita', () => {
    const s = scenario(`M........\n${VUOTE}`, ['p1', 'p1', 'p1']);
    const ripresa = deserializeGame(JSON.parse(JSON.stringify(serializeGame(s))));
    expect(ripresa.grid[idx(0, 0)]).toBe(MASSO);
  });

  it('non sta nelle regole: le sfide passate restano confrontabili', () => {
    // L'impronta delle regole si calcola da ogni costante numerica di config/rules.js.
    // Se il masso finisse li', tutti i record delle sfide passate verrebbero marcati
    // come ottenuti con un'altra versione del gioco, per una meccanica che nelle sfide
    // non compare. Vedi il commento su MASSO in src/core/grid.js.
    expect(regole.MASSO).toBeUndefined();
  });
});
