import { describe, it, expect } from 'vitest';
import { createGame, placePiece, handHasMove, serializeGame, deserializeGame } from '../src/core/engine.js';
import {
  allPlacements, hasAnyPlacement, filledCount, CELL_COUNT, gridToString, coloreDi, eBomba,
} from '../src/core/grid.js';
import { HAND_SIZE, COLOR_COUNT, CHAIN_MAX, VALORE_BOMBA } from '../src/config/rules.js';
import { SHAPES_BY_ID } from '../src/core/shapes.js';
import { createRng } from '../src/core/rng.js';

/**
 * Verifica delle invarianti su partite intere.
 *
 * I test unitari controllano una regola alla volta su uno scenario costruito a mano.
 * Questi controllano che, giocando partite vere dall'inizio alla fine, non esista
 * NESSUNA sequenza di mosse capace di portare il gioco in uno stato impossibile.
 * E' la rete che prende i difetti che nessuno ha pensato di cercare.
 */

/** Sceglie una mossa: preferisce chiudere gruppi, altrimenti tira a caso. */
function mossaQualsiasi(stato, rng) {
  const mosse = [];
  stato.hand.forEach((pezzo, i) => {
    if (!pezzo) return;
    for (const [r, c] of allPlacements(stato.grid, pezzo.shape)) mosse.push([i, r, c]);
  });
  if (mosse.length === 0) return null;
  return mosse[rng.int(mosse.length)];
}

/** Controlla tutto cio' che deve essere sempre vero, qualunque cosa sia successo. */
function verificaStato(stato, contesto) {
  const dove = `${contesto}\n${gridToString(stato.grid)}`;

  expect(stato.grid.length, dove).toBe(CELL_COUNT);
  for (let i = 0; i < stato.grid.length; i += 1) {
    const valore = stato.grid[i];
    // Una cella e' vuota, oppure un colore, oppure una bomba di quel colore.
    // Non basta accettare l'intervallo piu' ampio: un valore fra 7 e 10 sarebbe un
    // colore inesistente e verrebbe disegnato come blocco senza tinta.
    const valida = valore === 0
      || (valore >= 1 && valore <= COLOR_COUNT)
      || (valore > VALORE_BOMBA && valore <= VALORE_BOMBA + COLOR_COUNT);
    expect(valida, `${dove}\ncella ${i} ha valore ${valore}`).toBe(true);
    if (valore !== 0) {
      const colore = coloreDi(valore);
      expect(colore, `${dove}\ncella ${i}`).toBeGreaterThanOrEqual(1);
      expect(colore, `${dove}\ncella ${i}`).toBeLessThanOrEqual(COLOR_COUNT);
      expect(eBomba(valore)).toBe(valore > VALORE_BOMBA);
    }
  }

  expect(stato.hand.length, dove).toBe(HAND_SIZE);
  stato.hand.forEach((pezzo) => {
    if (pezzo === null) return;
    expect(SHAPES_BY_ID[pezzo.shapeId], `${dove}\nforma ${pezzo.shapeId}`).toBeDefined();
    expect(pezzo.color).toBeGreaterThanOrEqual(1);
    expect(pezzo.color).toBeLessThanOrEqual(COLOR_COUNT);
  });

  expect(Number.isInteger(stato.score), dove).toBe(true);
  expect(stato.score, dove).toBeGreaterThanOrEqual(0);

  expect(Number.isInteger(stato.chain), dove).toBe(true);
  expect(stato.chain, dove).toBeGreaterThanOrEqual(0);
  expect(stato.chain, dove).toBeLessThanOrEqual(CHAIN_MAX);

  expect(['playing', 'over'], dove).toContain(stato.status);

  // La coerenza piu' importante di tutte: lo stato "in corso" deve corrispondere
  // all'esistenza reale di una mossa possibile. Se questa salta, il giocatore o
  // resta bloccato davanti a una partita che non finisce, o si vede dichiarare
  // finita una partita che poteva continuare.
  const puoMuovere = handHasMove(stato.grid, stato.hand);
  if (stato.status === 'playing') expect(puoMuovere, `${dove}\npartita in corso senza mosse`).toBe(true);
  else expect(puoMuovere, `${dove}\npartita finita con mosse ancora possibili`).toBe(false);

  expect(filledCount(stato.grid), dove).toBeLessThanOrEqual(CELL_COUNT);
}

describe('invarianti su partite complete', () => {
  it('nessuna sequenza di mosse porta il gioco in uno stato impossibile', () => {
    const rng = createRng(20260906);
    let mosseTotali = 0;

    for (let partita = 0; partita < 240; partita += 1) {
      let stato = createGame({ seed: rng.int(0xffffffff), now: 0 });
      verificaStato(stato, `partita ${partita}, inizio`);

      let punteggioPrec = 0;
      let mosse = 0;
      let statsPrec = stato.stats;

      while (stato.status === 'playing' && mosse < 3000) {
        const mossa = mossaQualsiasi(stato, rng);
        if (mossa === null) break;

        const pieneDopoPrec = filledCount(stato.grid);
        const pezzo = stato.hand[mossa[0]];
        const dopo = placePiece(stato, ...mossa, mosse * 1000);
        mosse += 1;
        mosseTotali += 1;

        const dove = `partita ${partita}, mossa ${mosse}`;
        verificaStato(dopo, dove);

        // Il punteggio non torna mai indietro.
        expect(dopo.score, `${dove}: punteggio sceso`).toBeGreaterThanOrEqual(punteggioPrec);
        punteggioPrec = dopo.score;

        // Le statistiche sono cumulative e non calano mai.
        expect(dopo.stats.moves).toBe(statsPrec.moves + 1);
        expect(dopo.stats.cellsPlaced).toBe(statsPrec.cellsPlaced + pezzo.shape.size);
        expect(dopo.stats.clearedCells).toBeGreaterThanOrEqual(statsPrec.clearedCells);
        statsPrec = dopo.stats;

        // La mossa descritta corrisponde a quello che e' successo davvero.
        const m = dopo.lastMove;
        expect(m.placedCells.length, `${dove}: celle posate diverse dalla forma`).toBe(pezzo.shape.size);
        expect(new Set(m.placedCells).size).toBe(m.placedCells.length);
        expect(new Set(m.clearedCells).size).toBe(m.clearedCells.length);

        // Il conteggio delle celle piene torna: prima + posate - eliminate.
        // Le celle fatte saltare dalle bombe sono gia' dentro clearedCells: se non lo
        // fossero, questo controllo lo direbbe subito.
        expect(filledCount(dopo.grid), `${dove}: bilancio delle celle sbagliato`)
          .toBe(pieneDopoPrec + m.placedCells.length - m.clearedCells.length);

        // Ogni cella dichiarata "fatta saltare" deve essere anche fra le eliminate.
        const eliminate = new Set(m.clearedCells);
        (m.celleEsplose ?? []).forEach((cella) => {
          expect(eliminate.has(cella), `${dove}: cella ${cella} esplosa ma non eliminata`).toBe(true);
        });

        // Ogni cella dichiarata eliminata e' davvero vuota adesso.
        m.clearedCells.forEach((cella) => {
          expect(dopo.grid[cella], `${dove}: cella ${cella} dichiarata eliminata ma piena`).toBe(0);
        });

        // La mano si ricarica solo quando e' stata svuotata del tutto.
        if (m.handRefilled) expect(dopo.hand.filter(Boolean).length).toBe(HAND_SIZE);

        stato = dopo;
      }

      expect(mosse, `partita ${partita} non e finita entro 3000 mosse`).toBeLessThan(3000);
      expect(stato.status).toBe('over');
    }

    // Se questo numero crolla, il generatore o il rilevamento di fine partita e' cambiato.
    expect(mosseTotali).toBeGreaterThan(1000);
  }, 120000);

  it('ogni stato attraversato sopravvive a salvataggio e ripristino', () => {
    const rng = createRng(4711);
    for (let partita = 0; partita < 12; partita += 1) {
      let stato = createGame({ seed: rng.int(0xffffffff), now: 0 });
      let passi = 0;
      while (stato.status === 'playing' && passi < 400) {
        const mossa = mossaQualsiasi(stato, rng);
        if (!mossa) break;
        stato = placePiece(stato, ...mossa, passi * 1000);
        passi += 1;

        const ripristinato = deserializeGame(JSON.parse(JSON.stringify(serializeGame(stato))));
        expect(ripristinato, `partita ${partita} passo ${passi}`).not.toBeNull();
        expect(gridToString(ripristinato.grid)).toBe(gridToString(stato.grid));
        expect(ripristinato.score).toBe(stato.score);
        expect(ripristinato.chain).toBe(stato.chain);
        expect(ripristinato.hand.map((p) => p?.shapeId ?? null))
          .toEqual(stato.hand.map((p) => p?.shapeId ?? null));
      }
    }
  }, 60000);

  it('il generatore non consegna mai una mano gia morta a inizio partita', () => {
    // Le prime mani sono quelle in cui una sfortuna sarebbe piu' inaccettabile:
    // il giocatore non ha ancora fatto nulla di sbagliato.
    for (let seed = 0; seed < 400; seed += 1) {
      const stato = createGame({ seed: seed * 6151, now: 0 });
      expect(stato.hand.some((p) => hasAnyPlacement(stato.grid, p.shape)), `seed ${seed}`).toBe(true);
      expect(stato.status).toBe('playing');
    }
  });
});
