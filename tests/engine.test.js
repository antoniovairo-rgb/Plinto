import { describe, it, expect } from 'vitest';
import {
  createGame, placePiece, canPlaceHandPiece, handHasMove, deadPieces,
  serializeGame, deserializeGame, summarize, STATE_VERSION,
} from '../src/core/engine.js';
import { getShape } from '../src/core/shapes.js';
import {
  gridFromString, idx, gridToString, isEmpty, allPlacements, placeShape, findCompletedGroups,
} from '../src/core/grid.js';
import { HAND_SIZE, GROUP_BASE_POINTS, BOARD_CLEAR_BONUS } from '../src/config/rules.js';

/** Costruisce uno stato di prova con griglia e mano scelte a mano. */
function scenario(gridText, shapeIds) {
  const base = createGame({ seed: 1 });
  return {
    ...base,
    grid: gridFromString(gridText),
    hand: shapeIds.map((id, i) =>
      id ? { uid: `t${i}`, shapeId: id, shape: getShape(id), color: 1 } : null,
    ),
  };
}

const VUOTA = '.........\n'.repeat(9);

/** Trova una mossa legale che non chiude nessun gruppo. */
function mossaCheNonEliminaNulla(stato) {
  for (let i = 0; i < stato.hand.length; i += 1) {
    const pezzo = stato.hand[i];
    if (!pezzo) continue;
    for (const [r, c] of allPlacements(stato.grid, pezzo.shape)) {
      const { grid: dopo } = placeShape(stato.grid, pezzo.shape, r, c, pezzo.color);
      if (findCompletedGroups(dopo).length === 0) return [i, r, c];
    }
  }
  throw new Error('nessuna mossa che non elimini nulla');
}

describe('creazione della partita', () => {
  it('parte da griglia vuota, punteggio zero, catena zero, mano piena', () => {
    const s = createGame({ seed: 7 });
    expect(s.version).toBe(STATE_VERSION);
    expect(isEmpty(s.grid)).toBe(true);
    expect(s.score).toBe(0);
    expect(s.chain).toBe(0);
    expect(s.status).toBe('playing');
    expect(s.hand.filter(Boolean)).toHaveLength(HAND_SIZE);
  });

  it('lo stesso seed produce la stessa partita, mossa per mossa', () => {
    const play = (seed) => {
      let s = createGame({ seed });
      for (let i = 0; i < 40 && s.status === 'playing'; i += 1) {
        const options = [];
        s.hand.forEach((p, hi) => {
          if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => options.push([hi, r, c]));
        });
        if (!options.length) break;
        const [hi, r, c] = options[0];
        s = placePiece(s, hi, r, c);
      }
      return s;
    };
    const a = play(999);
    const b = play(999);
    expect(a.score).toBe(b.score);
    expect(gridToString(a.grid)).toBe(gridToString(b.grid));
  });

  it('un seed testuale rende la partita ripetibile (base per la Sfida del Giorno)', () => {
    const a = createGame({ seed: '2026-09-06' });
    const b = createGame({ seed: '2026-09-06' });
    expect(a.seed).toBe(b.seed);
    expect(a.seedLabel).toBe('2026-09-06');
    expect(a.hand.map((p) => p.shapeId)).toEqual(b.hand.map((p) => p.shapeId));
  });
});

describe('mosse', () => {
  it('non muta mai lo stato precedente', () => {
    const s = scenario(VUOTA, ['h3', 'p1', 'p1']);
    const before = gridToString(s.grid);
    const after = placePiece(s, 0, 0, 0);
    expect(gridToString(s.grid)).toBe(before);
    expect(after).not.toBe(s);
  });

  it('rifiuta una mossa illegale restituendo lo stato invariato', () => {
    const s = scenario(VUOTA, ['h3', 'p1', 'p1']);
    expect(placePiece(s, 0, 0, 7)).toBe(s);      // fuori griglia
    expect(placePiece(s, 5, 0, 0)).toBe(s);      // indice inesistente
    const occupata = scenario('#'.repeat(9) + '\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']);
    expect(placePiece(occupata, 0, 0, 0)).toBe(occupata);
  });

  it('canPlaceHandPiece riflette esattamente cio che placePiece accetta', () => {
    const s = scenario(VUOTA, ['b33', 'p1', 'p1']);
    expect(canPlaceHandPiece(s, 0, 6, 6)).toBe(true);
    expect(canPlaceHandPiece(s, 0, 7, 7)).toBe(false);
    expect(placePiece(s, 0, 7, 7)).toBe(s);
  });

  it('la mano si ricarica SOLO quando tutti e tre i pezzi sono stati usati', () => {
    let s = scenario(VUOTA, ['p1', 'p1', 'p1']);
    s = placePiece(s, 0, 0, 0);
    expect(s.hand[0]).toBeNull();
    expect(s.lastMove.handRefilled).toBe(false);
    s = placePiece(s, 1, 2, 2);
    expect(s.lastMove.handRefilled).toBe(false);
    s = placePiece(s, 2, 4, 4);
    expect(s.lastMove.handRefilled).toBe(true);
    expect(s.hand.filter(Boolean)).toHaveLength(HAND_SIZE);
  });
});

describe('eliminazioni e punteggio in partita', () => {
  it('completare una riga la fa sparire e paga i punti del gruppo', () => {
    // Una cella isolata in fondo evita che la griglia si svuoti: qui vogliamo
    // misurare il solo valore del gruppo, senza il bonus di svuotamento.
    const s = scenario('########.\n' + '.........\n'.repeat(7) + '#........', ['p1', 'v3', 'h4']);
    const after = placePiece(s, 0, 0, 8);
    expect(after.lastMove.groups).toHaveLength(1);
    expect(after.lastMove.groups[0].type).toBe('row');
    expect(after.lastMove.clearedCells).toHaveLength(9);
    expect(after.score).toBe(1 + GROUP_BASE_POINTS.row);
    expect(after.chain).toBe(1);
    expect(after.lastMove.boardCleared).toBe(false);
  });

  it('completare un quadrante 3x3 paga piu di una riga', () => {
    const s = scenario(
      '##.......\n##.......\n##.......\n' + '.........\n'.repeat(5) + '........#',
      ['v3', 'p1', 'p1'],
    );
    const after = placePiece(s, 0, 0, 2);
    expect(after.lastMove.groups[0].type).toBe('quadrant');
    expect(after.score).toBe(3 + GROUP_BASE_POINTS.quadrant);
  });

  it('la Catena regge una mossa a vuoto prima di calare', () => {
    // Regola cambiata dopo averla misurata: con il calo a ogni mossa a vuoto la
    // Catena era >= 3 solo nel 2% delle mosse giocate, cioe' non contava quasi mai.
    let s = scenario('########.\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']);
    s = placePiece(s, 0, 0, 8);
    expect(s.chain).toBe(1);

    s = placePiece(s, 1, 5, 5);
    expect(s.chain, 'prima mossa a vuoto: la Catena tiene').toBe(1);

    // La seconda mossa a vuoto supera la tolleranza. La mossa va CERCATA: dopo tre
    // pezzi la mano si ricarica con forme non note al test.
    s = placePiece(s, ...mossaCheNonEliminaNulla(s));
    expect(s.chain, 'seconda mossa a vuoto: ora cala').toBe(0);
  });

  it('svuotare completamente la griglia paga il bonus una tantum', () => {
    const s = scenario('########.\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']);
    const after = placePiece(s, 0, 0, 8);
    expect(after.lastMove.boardCleared).toBe(true);
    expect(after.lastMove.breakdown.boardClear).toBe(BOARD_CLEAR_BONUS);
  });

  it('lastMove descrive tutto cio che serve ad animare la mossa', () => {
    const s = scenario('########.\n' + '.........\n'.repeat(8), ['p1', 'v3', 'h4']);
    const m = placePiece(s, 0, 0, 8).lastMove;
    expect(m.placedCells).toEqual([idx(0, 8)]);
    expect(m.origin).toEqual({ row: 0, col: 8 });
    expect(m.clearedCells).toHaveLength(9);
    expect(m.tier).toBe('buona');
    expect(m.chainBefore).toBe(0);
    expect(m.chainAfter).toBe(1);
    expect(m.points).toBeGreaterThan(0);
  });
});

describe('fine partita', () => {
  const PIENA_TRANNE_UNA = '########.\n' + '#########\n'.repeat(8);

  it('finisce quando nessun pezzo rimasto entra piu da nessuna parte', () => {
    const s = scenario(PIENA_TRANNE_UNA, ['h3', 'v3', 'b22']);
    expect(handHasMove(s.grid, s.hand)).toBe(false);
    expect(deadPieces(s)).toEqual([0, 1, 2]);
  });

  it('non finisce finche resta anche un solo pezzo piazzabile', () => {
    const s = scenario(PIENA_TRANNE_UNA, ['h3', 'p1', 'b22']);
    expect(handHasMove(s.grid, s.hand)).toBe(true);
    expect(deadPieces(s)).toEqual([0, 2]);
  });

  it('dopo il game over ogni ulteriore mossa e ignorata', () => {
    let s = scenario('########.\n' + '#########\n'.repeat(7) + '.........', ['p1', 'h3', 'v3']);
    s = { ...s, status: 'over' };
    expect(placePiece(s, 0, 8, 0)).toBe(s);
  });

  it('una partita casuale finisce sempre, senza cicli infiniti', () => {
    for (let seed = 0; seed < 25; seed += 1) {
      let s = createGame({ seed: seed * 7717 });
      let guard = 0;
      while (s.status === 'playing' && guard < 5000) {
        const options = [];
        s.hand.forEach((p, hi) => {
          if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => options.push([hi, r, c]));
        });
        if (!options.length) break;
        const [hi, r, c] = options[guard % options.length];
        s = placePiece(s, hi, r, c);
        guard += 1;
      }
      expect(s.status).toBe('over');
      expect(guard).toBeLessThan(5000);
    }
  });
});

describe('salvataggio e ripristino', () => {
  it('un giro completo di serializzazione conserva la partita', () => {
    let s = createGame({ seed: 5150 });
    for (let i = 0; i < 12 && s.status === 'playing'; i += 1) {
      const options = [];
      s.hand.forEach((p, hi) => {
        if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => options.push([hi, r, c]));
      });
      if (!options.length) break;
      s = placePiece(s, ...options[0]);
    }
    const back = deserializeGame(JSON.parse(JSON.stringify(serializeGame(s))));
    expect(back).not.toBeNull();
    expect(back.score).toBe(s.score);
    expect(back.chain).toBe(s.chain);
    expect(gridToString(back.grid)).toBe(gridToString(s.grid));
    expect(back.hand.map((p) => p?.shapeId)).toEqual(s.hand.map((p) => p?.shapeId));
    expect(back.stats).toEqual(s.stats);
  });

  it('la partita ripristinata prosegue identica a quella originale', () => {
    let s = createGame({ seed: 31337 });
    s = placePiece(s, 0, ...allPlacements(s.grid, s.hand[0].shape)[0]);
    const back = deserializeGame(serializeGame(s));
    const spot = allPlacements(s.grid, s.hand[1].shape)[0];
    expect(placePiece(back, 1, ...spot).score).toBe(placePiece(s, 1, ...spot).score);
  });

  it('rifiuta salvataggi corrotti o di versione diversa invece di caricarli a meta', () => {
    expect(deserializeGame(null)).toBeNull();
    expect(deserializeGame({})).toBeNull();
    expect(deserializeGame({ version: 999 })).toBeNull();
    expect(deserializeGame({ version: STATE_VERSION, grid: [1, 2, 3] })).toBeNull();
    const ok = serializeGame(createGame({ seed: 1 }));
    expect(deserializeGame({ ...ok, hand: [] })).toBeNull();
    expect(deserializeGame({ ...ok, hand: [{ shapeId: 'inesistente', color: 1 }, null, null] })).toBeNull();
  });
});

describe('riepilogo di fine partita', () => {
  it('riporta i numeri che il giocatore vuole vedere', () => {
    const s = placePiece(scenario('########.\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']), 0, 0, 8);
    const r = summarize(s);
    expect(r.score).toBe(s.score);
    expect(r.moves).toBe(1);
    expect(r.clearedRows).toBe(1);
    expect(r.clearedGroups).toBe(1);
    expect(r.boardClears).toBe(1);
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('robustezza dei salvataggi manomessi', () => {
  const buono = () => serializeGame(createGame({ seed: 4242 }));

  it('rifiuta un punteggio non numerico', () => {
    expect(deserializeGame({ ...buono(), score: 'tantissimo' })).toBeNull();
  });

  it('rifiuta uno stato di partita inventato', () => {
    expect(deserializeGame({ ...buono(), status: 'vinta' })).toBeNull();
  });

  it('rifiuta una Catena fuori scala', () => {
    expect(deserializeGame({ ...buono(), chain: 99 })).toBeNull();
    expect(deserializeGame({ ...buono(), chain: -1 })).toBeNull();
    expect(deserializeGame({ ...buono(), chain: 1.5 })).toBeNull();
  });

  it('rifiuta una griglia con valori impossibili', () => {
    const rotto = buono();
    rotto.grid[0] = -3;
    expect(deserializeGame(rotto)).toBeNull();
  });

  it('rifiuta uno stato del generatore mancante', () => {
    expect(deserializeGame({ ...buono(), rngState: null })).toBeNull();
  });
});

describe('riproducibilita completa', () => {
  it('a parita di seed anche la DURATA e deterministica', () => {
    // Senza il parametro `now` questo era l'unico valore che cambiava tra due
    // esecuzioni identiche, in contraddizione con quanto promette il motore.
    const gioca = () => {
      let s = createGame({ seed: 777, now: 1000 });
      let t = 1000;
      while (s.status === 'playing') {
        const opzioni = [];
        s.hand.forEach((p, hi) => {
          if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => opzioni.push([hi, r, c]));
        });
        if (!opzioni.length) break;
        t += 500;
        s = placePiece(s, ...opzioni[0], t);
      }
      return summarize(s, t);
    };
    expect(gioca()).toEqual(gioca());
  });
});

describe('distribuzioni dentro lo stato di gioco', () => {
  it('un salvataggio scritto PRIMA che esistessero riparte da zero senza rompersi', () => {
    // E' il caso di chiunque aggiorni con una partita a meta'. Il salvataggio resta
    // della versione 1 di proposito: alzare STATE_VERSION per un'aggiunta compatibile
    // butterebbe via la partita in corso di ogni giocatore.
    const stato = createGame({ seed: 4242 });
    const salvato = serializeGame(stato);
    delete salvato.stats.istogrammaCatena;
    delete salvato.stats.istogrammaIntreccio;
    delete salvato.stats.mappaAppoggi;

    const ripreso = deserializeGame(salvato);
    expect(ripreso, 'una partita in corso non deve andare persa').not.toBeNull();
    expect(ripreso.stats.istogrammaCatena.every((n) => n === 0)).toBe(true);
    expect(ripreso.stats.mappaAppoggi).toHaveLength(81);

    // E da lì in poi conta regolarmente.
    const dopo = placePiece(ripreso, ...primaMossa(ripreso));
    expect(dopo.stats.istogrammaCatena.reduce((s, n) => s + n, 0)).toBe(1);
  });

  it('la mossa viene contata sulla Catena APPLICATA, non su quella che lascia dietro', () => {
    // La distinzione non e' un dettaglio: e' la stessa regola di trasparenza del
    // punteggio. Chiudendo una riga da Catena 0 si guadagna il livello 1, ma il
    // moltiplicatore usato per quella mossa era ancora quello del livello 0, ed e'
    // quello che il giocatore vedeva. Un istogramma indicizzato sulla Catena
    // successiva racconterebbe una partita giocata meglio di com'e' andata.
    const s = scenario('########.\n' + '.........\n'.repeat(7) + '#........', ['p1', 'v3', 'h4']);
    const dopo = placePiece(s, 0, 0, 8);
    expect(dopo.chain, 'la Catena sale davvero').toBe(1);
    expect(dopo.stats.istogrammaCatena[0], 'la mossa vale come giocata a Catena 0').toBe(1);
    expect(dopo.stats.istogrammaCatena[1], 'e NON a Catena 1').toBe(0);
    expect(dopo.stats.istogrammaIntreccio[1]).toBe(1);
    expect(dopo.stats.mappaAppoggi[0 * 9 + 8], 'ancorata dove e stata appoggiata').toBe(1);
  });

  it('un salvataggio con istogrammi della lunghezza sbagliata viene azzerato, non accettato', () => {
    const salvato = serializeGame(createGame({ seed: 7 }));
    salvato.stats.istogrammaCatena = [1, 2, 3];
    const ripreso = deserializeGame(salvato);
    expect(ripreso.stats.istogrammaCatena).toHaveLength(10);
    expect(ripreso.stats.istogrammaCatena.every((n) => n === 0)).toBe(true);
  });

  it('salvataggio e ripristino conservano le distribuzioni gia accumulate', () => {
    let stato = createGame({ seed: 99 });
    for (let i = 0; i < 6 && stato.status === 'playing'; i += 1) {
      stato = placePiece(stato, ...primaMossa(stato));
    }
    const ripreso = deserializeGame(serializeGame(stato));
    expect(ripreso.stats.istogrammaCatena).toEqual(stato.stats.istogrammaCatena);
    expect(ripreso.stats.mappaAppoggi).toEqual(stato.stats.mappaAppoggi);
  });

  it('summarize espone le distribuzioni e i totali combaciano con le mosse', () => {
    let stato = createGame({ seed: 12345 });
    for (let i = 0; i < 20 && stato.status === 'playing'; i += 1) {
      stato = placePiece(stato, ...primaMossa(stato));
    }
    const r = summarize(stato);
    expect(r.istogrammaCatena.reduce((s, n) => s + n, 0)).toBe(r.moves);
    expect(r.mappaAppoggi.reduce((s, n) => s + n, 0)).toBe(r.piecesPlaced);
  });
});

/** La prima mossa legale disponibile: serve solo a far avanzare la partita. */
function primaMossa(stato) {
  for (let i = 0; i < stato.hand.length; i += 1) {
    const pezzo = stato.hand[i];
    if (!pezzo) continue;
    const posizioni = allPlacements(stato.grid, pezzo.shape);
    if (posizioni.length > 0) return [i, posizioni[0][0], posizioni[0][1]];
  }
  return [0, 0, 0];
}
