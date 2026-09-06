import { describe, it, expect } from 'vitest';
import { placePiece, createGame } from '../src/core/engine.js';
import {
  gridFromString, idx, conBomba, eBomba, coloreDi, detonaBombe, filledCount, gridToString,
} from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';
import { scoreMove } from '../src/core/scoring.js';
import { generateHand } from '../src/core/generator.js';
import { createRng } from '../src/core/rng.js';
import {
  PUNTI_CELLA_ESPLOSA, COLOR_COUNT, VALORE_BOMBA, BOMBA_PROBABILITA,
} from '../src/config/rules.js';

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


/**
 * Generazione delle bombe.
 *
 * La detonazione era coperta da test fin dal primo giorno; la REGOLA CHE DECIDE QUANDO
 * arriva una bomba, no. Ed e' quella che porta la promessa piu' importante del gioco:
 * la probabilita' e' fissa e non guarda come sta andando la partita. Una promessa di
 * equita' senza test e' un'opinione, quindi qui si misura.
 */
describe('generazione delle bombe', () => {
  /** Estrae molte mani da griglie diverse e raccoglie le bombe uscite. */
  function mani(quante, grigliaTesto = VUOTA) {
    const grid = gridFromString(grigliaTesto);
    const risultati = [];
    let stato = createRng(20240601).state;
    let storia = [];
    for (let i = 0; i < quante; i += 1) {
      const mano = generateHand(grid, stato, storia);
      stato = mano.rngState;
      storia = mano.history;
      risultati.push(mano.pieces);
    }
    return risultati;
  }

  const CAMPIONE = mani(3000);

  it('mai piu di una bomba per mano', () => {
    for (const pezzi of CAMPIONE) {
      const conBombe = pezzi.filter((p) => (p.bombe?.length ?? 0) > 0);
      expect(conBombe.length).toBeLessThanOrEqual(1);
      for (const p of conBombe) expect(p.bombe.length).toBe(1);
    }
  });

  it('mai su un pezzo da una cella sola: sarebbe una bomba senza decisioni', () => {
    for (const pezzi of CAMPIONE) {
      for (const p of pezzi) {
        if ((p.bombe?.length ?? 0) > 0) expect(p.shape.size).toBeGreaterThan(1);
      }
    }
  });

  it('la bomba sta sempre dentro il pezzo che la porta', () => {
    for (const pezzi of CAMPIONE) {
      for (const p of pezzi) {
        for (const cella of p.bombe ?? []) {
          expect(cella).toBeGreaterThanOrEqual(0);
          expect(cella).toBeLessThan(p.shape.size);
        }
      }
    }
  });

  it('la frequenza osservata corrisponde a BOMBA_PROBABILITA', () => {
    const conBomba = CAMPIONE.filter((pezzi) => pezzi.some((p) => (p.bombe?.length ?? 0) > 0));
    const osservata = conBomba.length / CAMPIONE.length;
    // Su 3000 mani lo scarto tipo e' circa 0,0076: due punti percentuali di
    // tolleranza sono abbondanti e non nascondono un errore vero di regolazione.
    expect(Math.abs(osservata - BOMBA_PROBABILITA)).toBeLessThan(0.02);
  });

  it('la frequenza non cambia con la griglia piena: non e una leva sulla difficolta', () => {
    // Riempimento molto alto: se il generatore "aiutasse" o "punisse" in base a come
    // sta andando la partita, e' qui che si vedrebbe.
    const piena = [
      '#########', '#########', '#########', '#########', '#########',
      '########.', '########.', '########.', '.........',
    ].join('\n');
    const conGrigliaPiena = mani(1500, piena)
      .filter((pezzi) => pezzi.some((p) => (p.bombe?.length ?? 0) > 0)).length / 1500;
    expect(Math.abs(conGrigliaPiena - BOMBA_PROBABILITA)).toBeLessThan(0.035);
  });

  it('a parita di seme la sequenza di bombe e identica', () => {
    const primo = mani(200).map((pezzi) => pezzi.map((p) => (p.bombe ?? []).join(',')).join('|'));
    const secondo = mani(200).map((pezzi) => pezzi.map((p) => (p.bombe ?? []).join(',')).join('|'));
    expect(primo).toEqual(secondo);
  });
});
