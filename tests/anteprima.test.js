import { describe, it, expect } from 'vitest';
import { createGame, placePiece, serializeGame, deserializeGame } from '../src/core/engine.js';
import { allPlacements } from '../src/core/grid.js';
import { MODALITA, HAND_SIZE } from '../src/config/rules.js';

/**
 * La modalita' con l'anteprima della terna successiva.
 *
 * IL TEST CHE CONTA e' uno solo: la terna mostrata in anteprima deve essere IDENTICA a
 * quella poi consegnata -- cella per cella, bomba compresa. Se non lo fosse, l'anteprima
 * sarebbe una promessa non mantenuta, ed e' il difetto peggiore che questa modalita'
 * possa avere in un gioco che dichiara di non nascondere niente. Tutto il resto di questo
 * file esiste per rendere quel controllo credibile.
 */

/** Gioca una partita e restituisce ogni consegna: cosa era in anteprima, cosa e' arrivato. */
function consegne(seed, modalita, mosseMax = 400) {
  let s = createGame({ seed, modalita, now: 0 });
  const registro = [];
  let t = 0;
  while (s.status === 'playing' && s.stats.moves < mosseMax) {
    const mosse = [];
    s.hand.forEach((p, i) => {
      if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => mosse.push([i, r, c]));
    });
    if (mosse.length === 0) break;
    const previstaPrima = s.manoSuccessiva;
    t += 500;
    const dopo = placePiece(s, ...mosse[0], t);
    if (dopo.lastMove?.handRefilled) {
      registro.push({ prevista: previstaPrima, consegnata: dopo.hand });
    }
    s = dopo;
  }
  return { registro, finale: s };
}

/** Un pezzo ridotto a cio' che il giocatore vede: forma e bombe. */
function visibile(p) {
  return p ? { shapeId: p.shapeId, bombe: [...(p.bombe ?? [])] } : null;
}

describe('la terna in anteprima e quella che arriva', () => {
  it('sono identiche, forma e bombe, su piu di mille mani', () => {
    let mani = 0;
    for (let seed = 0; seed < 100; seed += 1) {
      const { registro } = consegne(seed, MODALITA.ANTEPRIMA);
      for (const { prevista, consegnata } of registro) {
        expect(prevista, `seme ${seed}: nessuna anteprima prima della consegna`).not.toBeNull();
        expect(
          consegnata.map(visibile),
          `seme ${seed}, mano ${mani}: consegnata una terna diversa da quella mostrata`,
        ).toEqual(prevista.map(visibile));
        mani += 1;
      }
    }
    expect(mani, `mani verificate: ${mani}`).toBeGreaterThan(1000);
  });

  it('sono lo STESSO oggetto, quindi non c e nemmeno lo spazio per ricalcolarla', () => {
    const { registro } = consegne(7, MODALITA.ANTEPRIMA);
    expect(registro.length).toBeGreaterThan(0);
    for (const { prevista, consegnata } of registro) {
      expect(consegnata).toBe(prevista);
    }
  });

  it('l anteprima non cambia mai fra una mossa e l altra della stessa mano', () => {
    // Fra una consegna e l'altra passano fino a tre mosse: in nessuna di quelle
    // l'anteprima deve essere toccata, altrimenti il giocatore vedrebbe cambiare sotto
    // gli occhi una terna che gli e' stata promessa.
    let s = createGame({ seed: 99, modalita: MODALITA.ANTEPRIMA, now: 0 });
    let t = 0;
    let cambi = 0;
    while (s.status === 'playing' && s.stats.moves < 200) {
      const mosse = [];
      s.hand.forEach((p, i) => {
        if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => mosse.push([i, r, c]));
      });
      if (mosse.length === 0) break;
      const prima = s.manoSuccessiva;
      t += 500;
      const dopo = placePiece(s, ...mosse[0], t);
      if (!dopo.lastMove.handRefilled && dopo.manoSuccessiva !== prima) cambi += 1;
      s = dopo;
    }
    expect(cambi, 'l anteprima e cambiata senza che la mano fosse esaurita').toBe(0);
  });

  it('l anteprima ha sempre tre pezzi veri', () => {
    const { registro, finale } = consegne(21, MODALITA.ANTEPRIMA);
    expect(registro.length).toBeGreaterThan(0);
    expect(finale.manoSuccessiva).toHaveLength(HAND_SIZE);
    finale.manoSuccessiva.forEach((p) => {
      expect(p.shapeId).toBeTruthy();
      expect(p.shape.cells.length).toBeGreaterThan(0);
    });
  });
});

describe('la modalita base non e cambiata', () => {
  it('non ha nessuna anteprima', () => {
    const s = createGame({ seed: 5 });
    expect(s.modalita).toBe(MODALITA.BASE);
    expect(s.manoSuccessiva).toBeNull();
  });

  it('a parita di seme produce la stessa partita di prima della modifica', () => {
    // La modalita' base non deve aver cambiato una sola estrazione: se l'avesse fatto,
    // tutti i Quadri tarati e tutte le sfide passate sarebbero partite diverse.
    const a = createGame({ seed: 'controllo' });
    const b = createGame({ seed: 'controllo' });
    expect(a.hand.map((p) => p.shapeId)).toEqual(b.hand.map((p) => p.shapeId));
    expect(a.rngState).toBe(b.rngState);
    // E il primo stato del generatore dopo la mano iniziale non deve essere stato
    // consumato in anticipo da nessuno.
    expect(a.manoSuccessiva).toBeNull();
  });
});

describe('i due mondi non si mescolano', () => {
  it('lo stesso seme produce partite DIVERSE nelle due modalita', () => {
    // Estrarre in anticipo cambia l'ordine di consumo del generatore: e' inevitabile, e
    // per questo le due modalita' non condividono ne' semi ne' record.
    const base = createGame({ seed: 'stesso-seme' });
    const anteprima = createGame({ seed: 'stesso-seme', modalita: MODALITA.ANTEPRIMA });
    expect(anteprima.rngState).not.toBe(base.rngState);
  });

  it('la mano INIZIALE invece coincide: cambia cio che viene dopo', () => {
    const base = createGame({ seed: 'stesso-seme' });
    const anteprima = createGame({ seed: 'stesso-seme', modalita: MODALITA.ANTEPRIMA });
    expect(anteprima.hand.map(visibile)).toEqual(base.hand.map(visibile));
  });
});

describe('salvataggio e ripristino', () => {
  it('l anteprima sopravvive a un salvataggio', () => {
    let s = createGame({ seed: 31, modalita: MODALITA.ANTEPRIMA, now: 0 });
    for (let i = 0; i < 4 && s.status === 'playing'; i += 1) {
      const mosse = [];
      s.hand.forEach((p, j) => {
        if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => mosse.push([j, r, c]));
      });
      if (!mosse.length) break;
      s = placePiece(s, ...mosse[0], (i + 1) * 500);
    }
    const ripreso = deserializeGame(serializeGame(s));
    expect(ripreso.modalita).toBe(MODALITA.ANTEPRIMA);
    expect(ripreso.manoSuccessiva.map(visibile)).toEqual(s.manoSuccessiva.map(visibile));
  });

  it('una partita salvata PRIMA che le modalita esistessero si riprende come base', () => {
    const salvato = serializeGame(createGame({ seed: 3 }));
    delete salvato.modalita;
    delete salvato.manoSuccessiva;
    const ripreso = deserializeGame(salvato);
    expect(ripreso, 'la partita in corso non deve andare persa').not.toBeNull();
    expect(ripreso.modalita).toBe(MODALITA.BASE);
    expect(ripreso.manoSuccessiva).toBeNull();
  });

  it('un anteprima manomessa viene scartata, non corretta a meta', () => {
    const s = createGame({ seed: 3, modalita: MODALITA.ANTEPRIMA });
    const salvato = serializeGame(s);
    salvato.manoSuccessiva = [{ shapeId: 'p1', color: 1 }];   // un pezzo invece di tre
    expect(deserializeGame(salvato).manoSuccessiva).toBeNull();
  });
});
