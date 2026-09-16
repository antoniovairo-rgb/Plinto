import { describe, it, expect } from 'vitest';
import {
  createGame, placePiece, scavaCella, appoggiaSullaMensola, riprendiDallaMensola,
  restaUnaMossa, serializeGame, deserializeGame, annullabile,
} from '../src/core/engine.js';
import { HAND_SIZE } from '../src/config/rules.js';
import { gridFromString, idx, filledCount } from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';

/** Stato di prova con griglia e mano scelte a mano. */
function scenario(gridText, shapeIds) {
  const base = createGame({ seed: 11 });
  return {
    ...base,
    grid: gridFromString(gridText),
    hand: shapeIds.map((id, i) => (
      id ? { uid: `t${i}`, shapeId: id, shape: getShape(id), color: 1 } : null
    )),
  };
}

const VUOTA = '.........\n'.repeat(8) + '.........';

describe('il piccone', () => {
  it('toglie la casella toccata e nessun altra', () => {
    const s = scenario('###......\n' + '.........\n'.repeat(7) + '.........', ['p1', 'p1', 'p1']);
    const prima = filledCount(s.grid);
    const dopo = scavaCella(s, idx(0, 1));
    expect(dopo.grid[idx(0, 1)]).toBe(0);
    expect(dopo.grid[idx(0, 0)]).not.toBe(0);
    expect(dopo.grid[idx(0, 2)]).not.toBe(0);
    expect(filledCount(dopo.grid)).toBe(prima - 1);
  });

  it('non da punti, non tocca la Catena e non conta come mossa', () => {
    // E' LA REGOLA PIU' IMPORTANTE DI QUESTO ATTREZZO. Se scavare pagasse, il piccone
    // sarebbe una macchina da punteggio; se costasse una mossa, sarebbe inutile proprio
    // nei livelli a mosse contate, cioe' dove serve.
    const base = scenario('#........\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']);
    const s = { ...base, score: 4321, chain: 3, chainDigiuno: 2 };
    const dopo = scavaCella(s, idx(0, 0));
    expect(dopo.score).toBe(4321);
    expect(dopo.chain).toBe(3);
    expect(dopo.chainDigiuno).toBe(2);
    expect(dopo.stats.moves).toBe(s.stats.moves);
    expect(dopo.stats.cellsPlaced).toBe(s.stats.cellsPlaced);
    expect(dopo.hand).toEqual(s.hand);
    expect(dopo.rngState).toBe(s.rngState);
  });

  it('non accende il "rimetti a posto": uno scavo non e una mossa', () => {
    const s = scenario('#........\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']);
    expect(annullabile(s, scavaCella(s, idx(0, 0)))).toBe(false);
  });

  it('non tocca lastMove, altrimenti la festa dell eliminazione si rifarebbe', () => {
    const s = scenario('########.\n' + '.........\n'.repeat(7) + '#........', ['p1', 'p1', 'p1']);
    const mossa = placePiece(s, 0, 0, 8);
    const scavato = scavaCella(mossa, idx(8, 0));
    expect(scavato.lastMove).toBe(mossa.lastMove);
  });

  it('non si paga per niente: su una casella vuota, fuori griglia o a partita finita da null', () => {
    const s = scenario('#........\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']);
    expect(scavaCella(s, idx(4, 4))).toBeNull();     // casella gia vuota
    expect(scavaCella(s, -1)).toBeNull();
    expect(scavaCella(s, 999)).toBeNull();
    expect(scavaCella({ ...s, status: 'over' }, idx(0, 0))).toBeNull();
  });

  it('non muta lo stato di partenza', () => {
    const s = scenario('#........\n' + '.........\n'.repeat(8), ['p1', 'p1', 'p1']);
    scavaCella(s, idx(0, 0));
    expect(s.grid[idx(0, 0)]).not.toBe(0);
  });
});

describe('la mensola', () => {
  it('prende il pezzo dalla mano e lo tiene da parte', () => {
    const s = scenario(VUOTA, ['p1', 'h2', 'v2']);
    const dopo = appoggiaSullaMensola(s, 1);
    expect(dopo.hand[1]).toBeNull();
    expect(dopo.mensola.shapeId).toBe('h2');
    expect(dopo.hand[0].shapeId).toBe('p1');
    expect(dopo.stats.moves).toBe(s.stats.moves);
  });

  it('ci sta un pezzo solo, e su uno slot vuoto non si paga', () => {
    const s = appoggiaSullaMensola(scenario(VUOTA, ['p1', 'h2', 'v2']), 1);
    expect(appoggiaSullaMensola(s, 0)).toBeNull();   // mensola gia occupata
    expect(appoggiaSullaMensola(scenario(VUOTA, [null, 'h2', 'v2']), 0)).toBeNull();
  });

  it('riprendere rimette il pezzo in uno slot libero e svuota la mensola', () => {
    const s = appoggiaSullaMensola(scenario(VUOTA, ['p1', 'h2', 'v2']), 1);
    const dopo = riprendiDallaMensola(s, 1);
    expect(dopo.hand[1].shapeId).toBe('h2');
    expect(dopo.mensola).toBeNull();
  });

  it('se la mano e piena i due si SCAMBIANO, ed e cio che evita il vicolo cieco', () => {
    // Senza lo scambio: appoggi un pezzo, giochi gli altri due, la mano si rifa' con tre
    // pezzi nuovi, e quello sulla mensola non ha piu' dove tornare. Resterebbe li' per
    // sempre mentre la partita lo conta come giocabile.
    const s = appoggiaSullaMensola(scenario(VUOTA, ['p1', 'h2', 'v2']), 1);
    const manoPiena = { ...s, hand: s.hand.map((p, i) => p ?? { uid: 'x', shapeId: 'b22', shape: getShape('b22'), color: 2 }) };
    const dopo = riprendiDallaMensola(manoPiena, 1);
    expect(dopo.hand[1].shapeId).toBe('h2');
    expect(dopo.mensola.shapeId).toBe('b22');
    expect(dopo.hand.filter(Boolean)).toHaveLength(HAND_SIZE);
  });

  it('con la mensola vuota non c e niente da riprendere', () => {
    const s = scenario(VUOTA, ['p1', 'h2', 'v2']);
    expect(riprendiDallaMensola(s, 0)).toBeNull();
    const conPezzo = appoggiaSullaMensola(s, 0);
    expect(riprendiDallaMensola(conPezzo, 99)).toBeNull();
  });
});

describe('la mensola e la fine della partita', () => {
  it('appoggiare l ultimo pezzo giocabile NON fa perdere', () => {
    // E' il difetto che questo attrezzo poteva introdurre, e sarebbe stato il peggiore
    // possibile: l'aiuto che ti fa perdere. La griglia lascia entrare solo il punto
    // singolo; gli altri due pezzi della mano non entrano da nessuna parte.
    const righe = Array.from({ length: 9 }, () => Array(9).fill('#'));
    righe[0][0] = '.';
    const s = {
      ...scenario(righe.map((r) => r.join('')).join('\n'), ['b33', 'h5', 'p1']),
    };
    expect(restaUnaMossa(s.grid, s.hand, null)).toBe(true);
    const dopo = appoggiaSullaMensola(s, 2);          // via il punto, l'unico giocabile
    expect(restaUnaMossa(dopo.grid, dopo.hand, null)).toBe(false);
    expect(restaUnaMossa(dopo.grid, dopo.hand, dopo.mensola)).toBe(true);
  });

  it('la partita finisce comunque quando non entra piu nulla, mensola compresa', () => {
    // Griglia con ESATTAMENTE due caselle vuote per ogni riga, colonna e quadrante:
    // riempirne una non chiude niente, quindi il tabellone non si svuota e la prova
    // misura davvero la fine della partita e non un'eliminazione fortunata.
    const vuote = [
      [0, 0], [1, 3], [2, 6], [3, 1], [4, 4], [5, 7], [6, 2], [7, 5], [8, 8],
      [0, 4], [1, 7], [2, 1], [3, 5], [4, 8], [5, 2], [6, 6], [7, 0], [8, 3],
    ];
    const righe = Array.from({ length: 9 }, () => Array(9).fill('#'));
    vuote.forEach(([r, c]) => { righe[r][c] = '.'; });
    const s = scenario(righe.map((r) => r.join('')).join('\n'), ['p1', 'b33', 'h5']);

    // Il punto va sulla mensola e poi si riprende: il giro completo dell'attrezzo non
    // deve lasciare traccia nello stato.
    const riporta = riprendiDallaMensola(appoggiaSullaMensola(s, 0), 0);
    expect(riporta.mensola).toBeNull();

    const dopo = placePiece(riporta, 0, 0, 0);
    expect(dopo.lastMove.groups).toHaveLength(0);   // niente si e chiuso: la prova tiene
    expect(dopo.mensola).toBeNull();
    expect(dopo.status).toBe('over');
  });
});

describe('la mensola attraverso un salvataggio', () => {
  it('il pezzo appoggiato sopravvive a salvataggio e riapertura', () => {
    const s = appoggiaSullaMensola(scenario(VUOTA, ['p1', 'h2', 'v2']), 1);
    const riletto = deserializeGame(JSON.parse(JSON.stringify(serializeGame(s))));
    expect(riletto.mensola.shapeId).toBe('h2');
    expect(riletto.mensola.shape).toEqual(getShape('h2'));
  });

  it('un salvataggio della 1.15, che la mensola non ce l aveva, resta valido', () => {
    // Nessuna migrazione e nessun salto di STATE_VERSION: "campo assente" si legge
    // "mensola vuota", che e' esattamente com'era quella partita.
    const vecchio = serializeGame(scenario(VUOTA, ['p1', 'h2', 'v2']));
    delete vecchio.mensola;
    const riletto = deserializeGame(vecchio);
    expect(riletto).not.toBeNull();
    expect(riletto.mensola).toBeNull();
    expect(riletto.hand).toHaveLength(HAND_SIZE);
  });
});
