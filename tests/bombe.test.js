import { describe, it, expect } from 'vitest';
import { placePiece, createGame } from '../src/core/engine.js';
import {
  gridFromString, idx, conBomba, eBomba, coloreDi, detonaBombe, filledCount, gridToString,
} from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';
import { scoreMove } from '../src/core/scoring.js';
import { PUNTI_CELLA_ESPLOSA, COLOR_COUNT, VALORE_BOMBA } from '../src/config/rules.js';

/** Stato di prova con griglia e mano scelte a mano. */
function scenario(gridText, pezzi) {
  const base = createGame({ seed: 1, now: 0 });
  return {
    ...base,
    grid: gridFromString(gridText),
    hand: pezzi.map((p, i) => (p ? {
      uid: `b${i}`, shapeId: p.id, shape: getShape(p.id), color: p.color ?? 1, bombe: p.bombe ?? [],
    } : null)),
  };
}

const VUOTA = '.........\n'.repeat(9);

describe('codifica delle bombe nella griglia', () => {
  it('una bomba conserva il proprio colore', () => {
    for (let colore = 1; colore <= COLOR_COUNT; colore += 1) {
      const valore = conBomba(colore);
      expect(eBomba(valore)).toBe(true);
      expect(coloreDi(valore)).toBe(colore);
    }
  });

  it('una cella normale non e una bomba', () => {
    for (let colore = 1; colore <= COLOR_COUNT; colore += 1) {
      expect(eBomba(colore)).toBe(false);
      expect(coloreDi(colore)).toBe(colore);
    }
    expect(eBomba(0)).toBe(false);
    expect(coloreDi(0)).toBe(0);
  });

  it('il valore di una bomba non invade l intervallo dei colori', () => {
    expect(conBomba(COLOR_COUNT)).toBeGreaterThan(VALORE_BOMBA);
    expect(conBomba(1)).toBeGreaterThan(COLOR_COUNT);
  });
});

describe('detonazione', () => {
  const piena = () => gridFromString(Array(9).fill('#########').join('\n'), 2);

  it('una bomba porta via il quadrato 3x3 attorno a se', () => {
    const g = piena();
    g[idx(4, 4)] = conBomba(1);
    const esito = detonaBombe(g, [idx(4, 4)]);
    expect(esito.bombe).toEqual([idx(4, 4)]);
    expect(esito.tutte.size).toBe(9);
    expect(esito.esplose).toHaveLength(8);
  });

  it('le bombe adiacenti si innescano a vicenda', () => {
    const g = piena();
    [[4, 3], [4, 4], [4, 5]].forEach(([r, c]) => { g[idx(r, c)] = conBomba(1); });
    const esito = detonaBombe(g, [idx(4, 4)]);
    expect(esito.bombe).toHaveLength(3);
    expect(esito.tutte.size).toBe(15);
  });

  it('le bombe distanti due celle NON si innescano', () => {
    const g = piena();
    [[4, 2], [4, 4], [4, 6]].forEach(([r, c]) => { g[idx(r, c)] = conBomba(1); });
    const esito = detonaBombe(g, [idx(4, 4)]);
    expect(esito.bombe).toHaveLength(1);
  });

  it('una bomba sul bordo non esce dalla griglia', () => {
    const g = piena();
    g[idx(0, 0)] = conBomba(1);
    const esito = detonaBombe(g, [idx(0, 0)]);
    expect(esito.tutte.size).toBe(4);      // solo il quarto di quadrato che esiste
    [...esito.tutte].forEach((cella) => {
      expect(cella).toBeGreaterThanOrEqual(0);
      expect(cella).toBeLessThan(81);
    });
  });

  it('l esplosione non tocca le celle vuote', () => {
    const g = gridFromString(VUOTA);
    g[idx(4, 4)] = conBomba(1);
    const esito = detonaBombe(g, [idx(4, 4)]);
    expect(esito.tutte.size).toBe(1);
    expect(esito.esplose).toHaveLength(0);
  });

  it('senza bombe non succede niente', () => {
    const g = piena();
    const esito = detonaBombe(g, [idx(4, 4), idx(4, 5)]);
    expect(esito.bombe).toHaveLength(0);
    expect(esito.esplose).toHaveLength(0);
    expect(esito.tutte.size).toBe(2);
  });
});

describe('le bombe in partita', () => {
  it('una bomba appoggiata NON esplode finche non viene eliminata', () => {
    const s = scenario(VUOTA, [{ id: 'h2', bombe: [0] }, { id: 'p1' }, { id: 'p1' }]);
    const dopo = placePiece(s, 0, 4, 4, 0);
    expect(dopo.lastMove.bombeDetonate).toHaveLength(0);
    expect(dopo.lastMove.clearedCells).toHaveLength(0);
    expect(eBomba(dopo.grid[idx(4, 4)])).toBe(true);
    expect(filledCount(dopo.grid)).toBe(2);
  });

  it('una bomba eliminata con la riga porta via anche le celle vicine', () => {
    // Riga 4 piena tranne l ultima cella; la bomba cadra' proprio li', in (4,8).
    // Le celle da far saltare stanno quindi negli angoli attorno a quel punto,
    // non al centro della plancia: il raggio dell esplosione e' di una cella.
    const s = scenario(
      '.........\n.........\n.........\n.......##\n########.\n.......##\n.........\n.........\n.........',
      [{ id: 'p1', color: 2, bombe: [0] }, { id: 'p1' }, { id: 'p1' }],
    );
    const primaDelColpo = filledCount(s.grid);
    const dopo = placePiece(s, 0, 4, 8, 0);

    expect(dopo.lastMove.groups.map((g) => g.type)).toEqual(['row']);
    expect(dopo.lastMove.bombeDetonate).toHaveLength(1);
    // La riga sono 9 celle; l esplosione aggiunge le quattro sopra e sotto.
    expect(dopo.lastMove.celleEsplose).toHaveLength(4);
    expect(dopo.lastMove.clearedCells).toHaveLength(13);
    expect(filledCount(dopo.grid))
      .toBe(primaDelColpo + 1 - dopo.lastMove.clearedCells.length);
  });

  it('le celle fatte saltare valgono punti, e seguono la Catena', () => {
    const senza = scoreMove({
      placedCellCount: 1, groups: [{ type: 'row' }], chainLevel: 0, boardCleared: false,
    });
    const con = scoreMove({
      placedCellCount: 1, groups: [{ type: 'row' }], chainLevel: 0, boardCleared: false,
      explodedCellCount: 5,
    });
    expect(con.points - senza.points).toBe(5 * PUNTI_CELLA_ESPLOSA);
    expect(con.breakdown.esplosioni).toBe(5 * PUNTI_CELLA_ESPLOSA);

    // Con la Catena a 4 (moltiplicatore x2) anche le esplosioni raddoppiano.
    const conCatena = scoreMove({
      placedCellCount: 1, groups: [{ type: 'row' }], chainLevel: 4, boardCleared: false,
      explodedCellCount: 5,
    });
    expect(conCatena.breakdown.esplosioni).toBe(5 * PUNTI_CELLA_ESPLOSA * 2);
  });

  it('una mossa con molte celle saltate viene celebrata di piu', () => {
    const forma = '.........\n.........\n.........\n.......##\n########.\n.......##\n.........\n.........\n.........';
    const s = scenario(forma, [{ id: 'p1', color: 2, bombe: [0] }, { id: 'p1' }, { id: 'p1' }]);
    const conBombaTier = placePiece(s, 0, 4, 8, 0).lastMove.tier;
    const senza = scenario(forma, [{ id: 'p1', color: 2 }, { id: 'p1' }, { id: 'p1' }]);
    const senzaBombaTier = placePiece(senza, 0, 4, 8, 0).lastMove.tier;
    const ordine = ['buona', 'ottima', 'eccellente', 'perfetta'];
    expect(ordine.indexOf(conBombaTier)).toBeGreaterThanOrEqual(ordine.indexOf(senzaBombaTier));
  });

  it('una partita con bombe sopravvive a salvataggio e ripristino', async () => {
    const { serializeGame, deserializeGame } = await import('../src/core/engine.js');
    const s = scenario(VUOTA, [{ id: 'h3', bombe: [1] }, { id: 'p1' }, { id: 'v2', bombe: [0] }]);
    const dopo = placePiece(s, 0, 0, 0, 0);
    const ripristinato = deserializeGame(JSON.parse(JSON.stringify(serializeGame(dopo))));
    expect(ripristinato).not.toBeNull();
    expect(gridToString(ripristinato.grid)).toBe(gridToString(dopo.grid));
    expect(ripristinato.hand.map((p) => p?.bombe ?? null))
      .toEqual(dopo.hand.map((p) => p?.bombe ?? null));
    // La bomba deve essere ancora una bomba anche dopo il giro in JSON.
    expect(eBomba(ripristinato.grid[idx(0, 1)])).toBe(true);
  });
});
