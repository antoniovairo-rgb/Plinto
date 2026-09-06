import { describe, it, expect } from 'vitest';
import { scoreMove, chainMultiplier, intrecciMultiplier, nextChainState, respiroRimasto, moveTier } from '../src/core/scoring.js';
import { CHAIN_MAX, CHAIN_GRACE, BOARD_CLEAR_BONUS, GROUP_BASE_POINTS } from '../src/config/rules.js';

const row = { type: 'row' };
const col = { type: 'col' };
const quad = { type: 'quadrant' };

describe('Catena', () => {
  it('parte da x1 e cresce di un quarto per livello', () => {
    expect(chainMultiplier(0)).toBe(1);
    expect(chainMultiplier(4)).toBe(2);
    expect(chainMultiplier(CHAIN_MAX)).toBeCloseTo(3.25);
  });

  it('sale di UNO per mossa che elimina, non di quanti gruppi hai chiuso', () => {
    // Contare i gruppi qui sarebbe premiarli due volte, visto che l'Intreccio ha gia'
    // il suo moltiplicatore. Misurato: con la crescita a gruppi il 59,5% delle mosse
    // finiva giocato al tetto e la Catena diventava un numero fisso.
    expect(nextChainState(0, 1, 0)).toEqual({ livello: 1, digiuno: 0 });
    expect(nextChainState(1, 3, 0)).toEqual({ livello: 2, digiuno: 0 });
    expect(nextChainState(5, 9, 0)).toEqual({ livello: 6, digiuno: 0 });
  });

  it('non supera mai il livello massimo', () => {
    expect(nextChainState(CHAIN_MAX, 3, 0).livello).toBe(CHAIN_MAX);
    expect(nextChainState(CHAIN_MAX - 1, 5, 0).livello).toBe(CHAIN_MAX);
  });

  it('raggiungere il massimo richiede una salita lunga, non una mossa fortunata', () => {
    let stato = { livello: 0, digiuno: 0 };
    let mosse = 0;
    while (stato.livello < CHAIN_MAX) {
      stato = nextChainState(stato.livello, 3, stato.digiuno);
      mosse += 1;
    }
    expect(mosse, 'servono almeno CHAIN_MAX eliminazioni per arrivare in cima').toBe(CHAIN_MAX);
  });

  it('SOPPORTA una mano intera senza eliminazioni prima di calare', () => {
    // E' la correzione che rende viva la meccanica: misurato, con il calo a ogni
    // mossa la Catena era >= 3 solo nel 2% delle mosse giocate.
    let stato = { livello: 5, digiuno: 0 };
    for (let mossa = 1; mossa <= CHAIN_GRACE; mossa += 1) {
      stato = nextChainState(stato.livello, 0, stato.digiuno);
      expect(stato.livello, `mossa a vuoto numero ${mossa}`).toBe(5);
      expect(stato.digiuno).toBe(mossa);
    }
    // La mossa oltre la tolleranza fa calare.
    stato = nextChainState(stato.livello, 0, stato.digiuno);
    expect(stato.livello).toBe(4);
  });

  it('una sola eliminazione azzera il digiuno e riparte la tolleranza', () => {
    // Si consuma tutta la tolleranza senza eliminare, poi si elimina: il livello
    // riparte da dove era e il contatore delle mosse a vuoto torna a zero.
    let stato = { livello: 4, digiuno: 0 };
    for (let i = 0; i < CHAIN_GRACE; i += 1) {
      stato = nextChainState(stato.livello, 0, stato.digiuno);
    }
    expect(stato.livello, 'entro la tolleranza il livello non cala').toBe(4);
    expect(stato.digiuno).toBe(CHAIN_GRACE);

    stato = nextChainState(stato.livello, 1, stato.digiuno);
    expect(stato).toEqual({ livello: 5, digiuno: 0 });
  });

  it('CALA DI UNO invece di azzerarsi: e la firma del gioco', () => {
    expect(nextChainState(5, 0, CHAIN_GRACE).livello).toBe(4);
    expect(nextChainState(1, 0, CHAIN_GRACE).livello).toBe(0);
  });

  it('non scende sotto zero', () => {
    expect(nextChainState(0, 0, CHAIN_GRACE).livello).toBe(0);
  });

  it('il respiro rimasto e leggibile dall interfaccia', () => {
    expect(respiroRimasto(0)).toBe(CHAIN_GRACE);
    expect(respiroRimasto(CHAIN_GRACE)).toBe(0);
    expect(respiroRimasto(99)).toBe(0);
  });
});

describe('Intreccio', () => {
  it('vale x1 con un solo gruppo e cresce di mezzo per gruppo', () => {
    expect(intrecciMultiplier(1)).toBe(1);
    expect(intrecciMultiplier(2)).toBe(1.5);
    expect(intrecciMultiplier(3)).toBe(2);
  });

  it('vale zero se non hai chiuso nulla', () => {
    expect(intrecciMultiplier(0)).toBe(0);
  });
});

describe('punteggio di una mossa', () => {
  it('una mossa senza eliminazioni vale solo le celle appoggiate', () => {
    const r = scoreMove({ placedCellCount: 4, groups: [], chainLevel: 0, boardCleared: false });
    expect(r.points).toBe(4);
    expect(r.breakdown.clearPoints).toBe(0);
  });

  it('il quadrante vale piu di riga e colonna perche e piu difficile', () => {
    expect(GROUP_BASE_POINTS.quadrant).toBeGreaterThan(GROUP_BASE_POINTS.row);
  });

  it('applica il moltiplicatore che il giocatore VEDEVA prima di muovere', () => {
    // Catena 4 => x2. Una riga (18) x intreccio 1 x catena 2 = 36, piu 3 celle.
    const r = scoreMove({ placedCellCount: 3, groups: [row], chainLevel: 4, boardCleared: false });
    expect(r.points).toBe(3 + 36);
    expect(r.chainUsed).toBe(4);
    expect(r.chainAfter).toBe(5); // l'aumento vale dalla mossa dopo
  });

  it('chiudere tre gruppi insieme raddoppia il valore', () => {
    const one = scoreMove({ placedCellCount: 0, groups: [row], chainLevel: 0, boardCleared: false });
    const three = scoreMove({ placedCellCount: 0, groups: [row, col, quad], chainLevel: 0, boardCleared: false });
    const base = GROUP_BASE_POINTS.row * 2 + GROUP_BASE_POINTS.quadrant;
    expect(one.points).toBe(GROUP_BASE_POINTS.row);
    expect(three.points).toBe(Math.round(base * 2));
  });

  it('paga il bonus solo se la griglia si e svuotata con una eliminazione', () => {
    const cleared = scoreMove({ placedCellCount: 1, groups: [row], chainLevel: 0, boardCleared: true });
    expect(cleared.breakdown.boardClear).toBe(BOARD_CLEAR_BONUS);
    const notCleared = scoreMove({ placedCellCount: 1, groups: [], chainLevel: 0, boardCleared: true });
    expect(notCleared.breakdown.boardClear).toBe(0);
  });

  it('il punteggio non e mai negativo ne frazionario', () => {
    for (let chain = 0; chain <= CHAIN_MAX; chain += 1) {
      for (let groups = 0; groups <= 4; groups += 1) {
        const r = scoreMove({
          placedCellCount: 5,
          groups: Array.from({ length: groups }, () => row),
          chainLevel: chain,
          boardCleared: false,
        });
        expect(Number.isInteger(r.points)).toBe(true);
        expect(r.points).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('livello di celebrazione', () => {
  it('non celebra una mossa che non elimina nulla', () => {
    expect(moveTier(0, 5)).toBeNull();
  });

  it('cresce con i gruppi chiusi e con la Catena', () => {
    expect(moveTier(1, 0)).toBe('buona');
    expect(moveTier(2, 0)).toBe('ottima');
    expect(moveTier(3, 3)).toBe('eccellente');
    expect(moveTier(3, 9)).toBe('perfetta');
  });
});
