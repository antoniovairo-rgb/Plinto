import { describe, it, expect } from 'vitest';
import {
  createGame, placePiece, scavaCella, serializeGame, deserializeGame,
} from '../src/core/engine.js';
import {
  MATTONE, MATTONE_INCRINATO, eMattone, eMattoneIntatto, eMattoneIncrinato, eBomba, coloreDi,
  conBomba, isEmpty, idx, rowCells, gridFromString, gridToString,
} from '../src/core/grid.js';
import { maggioranzaColore } from '../src/core/scoring.js';
import { OBIETTIVI } from '../src/core/quadro.js';
import { getShape } from '../src/core/shapes.js';
import * as regole from '../src/config/rules.js';

/**
 * I MATTONI RINFORZATI, la meccanica dell'Arena: «un mattone rinforzato va eliminato due
 * volte». La prima volta si incrina e resta, la seconda sparisce.
 *
 * I casi limite sono stati decisi il 4 ottobre 2026 (docs/OPERA-ARENA.md) e ognuno ha
 * qui la sua prova: un Intreccio fa un passo solo, la bomba e il piccone valgono come
 * un'eliminazione, il mattone ha un colore e conta per la Tinta.
 */

function scenario(gridText, shapeIds) {
  const base = createGame({ seed: 11 });
  return {
    ...base,
    grid: gridFromString(gridText, 1),
    hand: shapeIds.map((id, i) => (
      id ? { uid: `t${i}`, shapeId: id, shape: getShape(id), color: 1, bombe: [] } : null
    )),
  };
}

const VUOTE = '.........\n'.repeat(8);
const INTATTO = MATTONE + 1;
const INCRINATO = MATTONE_INCRINATO + 1;

describe('il mattone rinforzato', () => {
  it('conta come pieno: una riga con un mattone si chiude riempiendo le altre otto caselle', () => {
    const dopo = placePiece(scenario(`R#######.\n${VUOTE}`, ['p1', 'p1', 'p1']), 0, 0, 8);
    expect(dopo.stats.clearedRows).toBe(1);
  });

  it('la prima eliminazione lo incrina: resta al suo posto e non conta fra le caselle eliminate', () => {
    const dopo = placePiece(scenario(`R#######.\n${VUOTE}`, ['p1', 'p1', 'p1']), 0, 0, 8);
    expect(dopo.grid[idx(0, 0)]).toBe(INCRINATO);
    for (let c = 1; c < 9; c += 1) expect(dopo.grid[idx(0, c)]).toBe(0);
    expect(dopo.stats.clearedCells).toBe(8);
    expect(dopo.stats.mattoniDemoliti).toBe(0);
    expect(dopo.lastMove.mattoniIncrinati).toEqual([idx(0, 0)]);
  });

  it('la seconda eliminazione lo fa sparire, e conta come mattone demolito', () => {
    const dopo = placePiece(scenario(`r#######.\n${VUOTE}`, ['p1', 'p1', 'p1']), 0, 0, 8);
    expect(dopo.grid[idx(0, 0)]).toBe(0);
    expect(dopo.stats.clearedCells).toBe(9);
    expect(dopo.stats.mattoniDemoliti).toBe(1);
    expect(OBIETTIVI.demolizioni.progresso(dopo)).toBe(1);
  });

  it('un Intreccio fa un passo solo: il mattone in due gruppi chiusi insieme si incrina e basta', () => {
    // Riga 0 e quadrante 0 si chiudono con la stessa casella (0,2); il mattone in (0,0)
    // sta in tutti e due.
    const s = scenario(`R#.######\n###......\n###......\n${'.........\n'.repeat(6)}`, ['p1', 'p1', 'p1']);
    const dopo = placePiece(s, 0, 0, 2);
    expect(dopo.lastMove.groups.length).toBe(2);
    expect(dopo.grid[idx(0, 0)]).toBe(INCRINATO);
    expect(dopo.stats.mattoniDemoliti).toBe(0);
  });

  it('una bomba vale come un eliminazione: incrina il mattone intatto, fa sparire quello incrinato', () => {
    for (const [lettera, atteso, demoliti] of [['R', INCRINATO, 0], ['r', 0, 1]]) {
      const s = scenario(`#########\n#${lettera}.......\n${'.........\n'.repeat(7)}`, ['p1', 'p1', 'p1']);
      s.grid[idx(0, 1)] = conBomba(1);
      s.grid[idx(0, 8)] = 0;
      const dopo = placePiece(s, 0, 0, 8);
      expect(dopo.grid[idx(1, 1)], `mattone ${lettera}`).toBe(atteso);
      expect(dopo.stats.mattoniDemoliti, `mattone ${lettera}`).toBe(demoliti);
    }
  });

  it('il piccone vale come un eliminazione, ma non conta fra i mattoni demoliti', () => {
    const s = scenario(`R........\n${VUOTE}`, ['p1', 'p1', 'p1']);
    const incrinato = scavaCella(s, idx(0, 0));
    expect(incrinato.grid[idx(0, 0)]).toBe(INCRINATO);
    const tolto = scavaCella(incrinato, idx(0, 0));
    expect(tolto.grid[idx(0, 0)]).toBe(0);
    expect(tolto.stats.mattoniDemoliti).toBe(0);
  });

  it('ha un colore e conta per la Tinta; non e mai una bomba', () => {
    const grid = gridFromString(`RRRrrr###\n${VUOTE}`, 4);
    expect(maggioranzaColore(grid, rowCells(0))).toBe(9);
    for (let colore = 1; colore <= 6; colore += 1) {
      expect(coloreDi(MATTONE + colore)).toBe(colore);
      expect(coloreDi(MATTONE_INCRINATO + colore)).toBe(colore);
      expect(eBomba(MATTONE + colore)).toBe(false);
      expect(eBomba(MATTONE_INCRINATO + colore)).toBe(false);
      expect(eBomba(conBomba(colore))).toBe(true);
    }
    expect(eMattone(INTATTO) && eMattoneIntatto(INTATTO) && !eMattoneIncrinato(INTATTO)).toBe(true);
    expect(eMattone(INCRINATO) && eMattoneIncrinato(INCRINATO) && !eMattoneIntatto(INCRINATO)).toBe(true);
  });

  it('finche resta un mattone, anche incrinato, la griglia non e svuotata', () => {
    expect(isEmpty(gridFromString(`r........\n${VUOTE}`))).toBe(false);
    const dopo = placePiece(scenario(`R#######.\n${VUOTE}`, ['p1', 'p1', 'p1']), 0, 0, 8);
    expect(dopo.stats.boardClears).toBe(0);
  });

  it('si scrive e si legge con le lettere R e r', () => {
    const testo = `R#r......\n${'.........\n'.repeat(7)}........r`;
    expect(gridToString(gridFromString(testo))).toBe(testo);
  });

  it('sopravvive al salvataggio e alla ripresa della partita', () => {
    const s = scenario(`Rr.......\n${VUOTE}`, ['p1', 'p1', 'p1']);
    const ripresa = deserializeGame(JSON.parse(JSON.stringify(serializeGame(s))));
    expect(ripresa.grid[idx(0, 0)]).toBe(INTATTO);
    expect(ripresa.grid[idx(0, 1)]).toBe(INCRINATO);
  });

  it('non sta nelle regole: le sfide passate restano confrontabili', () => {
    expect(regole.MATTONE).toBeUndefined();
    expect(regole.MATTONE_INCRINATO).toBeUndefined();
  });
});
