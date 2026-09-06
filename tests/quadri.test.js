import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QUADRI, quadroNumero, TOTALE_QUADRI } from '../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro, semeDelQuadro, OBIETTIVI } from '../src/core/quadro.js';
import { gridFromString, findCompletedGroups, filledCount, allPlacements } from '../src/core/grid.js';

const memoria = new Map();
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
    setItem: (k, v) => memoria.set(k, String(v)),
    removeItem: (k) => memoria.delete(k),
    key: (i) => [...memoria.keys()][i] ?? null,
    get length() { return memoria.size; },
  },
});
const progressi = await import('../src/persistence/progressi.js');

describe('definizione dei Quadri', () => {
  it('la numerazione e progressiva e senza buchi', () => {
    QUADRI.forEach((q, i) => expect(q.numero).toBe(i + 1));
    expect(TOTALE_QUADRI).toBe(QUADRI.length);
  });

  it('ogni Quadro ha almeno un obiettivo, e di un tipo che il motore conosce', () => {
    QUADRI.forEach((q) => {
      expect(q.obiettivi.length, `quadro ${q.numero}`).toBeGreaterThan(0);
      q.obiettivi.forEach((o) => {
        expect(OBIETTIVI[o.tipo], `quadro ${q.numero}: obiettivo ${o.tipo}`).toBeDefined();
        expect(o.quanti).toBeGreaterThan(0);
      });
    });
  });

  it('ogni nome di Quadro e unico', () => {
    const nomi = QUADRI.map((q) => q.nome);
    expect(new Set(nomi).size).toBe(nomi.length);
  });

  it('le griglie iniziali sono 9x9 e ben formate', () => {
    QUADRI.filter((q) => q.griglia).forEach((q) => {
      const righe = q.griglia.split('\n');
      expect(righe, `quadro ${q.numero}`).toHaveLength(9);
      righe.forEach((r) => expect(r, `quadro ${q.numero}`).toHaveLength(9));
    });
  });

  it('NESSUNA griglia iniziale contiene un gruppo gia completo', () => {
    // Se ci fosse, si eliminerebbe alla prima mossa regalando punti e falsando
    // l'obiettivo. Sei griglie su diciotto avevano questo difetto alla prima stesura.
    QUADRI.filter((q) => q.griglia).forEach((q) => {
      const gruppi = findCompletedGroups(gridFromString(q.griglia, 3));
      expect(gruppi, `quadro ${q.numero} (${q.nome})`).toHaveLength(0);
    });
  });

  it('nessuna griglia iniziale riempie piu di due terzi della plancia', () => {
    // Oltre quella soglia non resta abbastanza spazio per giocare.
    QUADRI.filter((q) => q.griglia).forEach((q) => {
      expect(filledCount(gridFromString(q.griglia, 3)), `quadro ${q.numero}`).toBeLessThan(54);
    });
  });

  it('ogni Quadro parte con almeno un pezzo piazzabile', () => {
    QUADRI.forEach((q) => {
      const partita = iniziaQuadro(q, { now: 0 });
      const giocabile = partita.hand.some((p) => p && allPlacements(partita.grid, p.shape).length > 0);
      expect(giocabile, `quadro ${q.numero} (${q.nome}) parte gia bloccato`).toBe(true);
    });
  });
});

describe('svolgimento di un Quadro', () => {
  it('lo stesso Quadro parte sempre dallo stesso problema', () => {
    const a = iniziaQuadro(quadroNumero(7), { now: 0 });
    const b = iniziaQuadro(quadroNumero(7), { now: 0 });
    expect(a.hand.map((p) => p.shapeId)).toEqual(b.hand.map((p) => p.shapeId));
    expect(semeDelQuadro(7)).toBe(semeDelQuadro(7));
    expect(semeDelQuadro(7)).not.toBe(semeDelQuadro(8));
  });

  it('lo stato iniziale non e ne vinto ne perso', () => {
    const q = quadroNumero(1);
    const stato = statoQuadro(q, iniziaQuadro(q, { now: 0 }));
    expect(stato.completato).toBe(false);
    expect(stato.fallito).toBe(false);
    expect(stato.finito).toBe(false);
    expect(stato.mosseRimaste).toBe(q.maxMosse);
  });

  it('finire le mosse senza obiettivo significa perdere', () => {
    const q = { numero: 99, nome: 'prova', obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 3 };
    let partita = iniziaQuadro(q, { now: 0 });
    for (let i = 0; i < 3; i += 1) {
      const pezzo = partita.hand.findIndex((p) => p && allPlacements(partita.grid, p.shape).length);
      const [r, c] = allPlacements(partita.grid, partita.hand[pezzo].shape)[0];
      partita = giocaNelQuadro(q, partita, pezzo, r, c, i * 1000);
    }
    const stato = statoQuadro(q, partita);
    expect(stato.mosseRimaste).toBe(0);
    expect(stato.fallito).toBe(true);
    expect(stato.motivo).toBe('mosse');
  });

  it('dopo la fine il Quadro non accetta altre mosse', () => {
    const q = { numero: 98, nome: 'prova', obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 1 };
    let partita = iniziaQuadro(q, { now: 0 });
    const pezzo = partita.hand.findIndex((p) => p && allPlacements(partita.grid, p.shape).length);
    const [r, c] = allPlacements(partita.grid, partita.hand[pezzo].shape)[0];
    partita = giocaNelQuadro(q, partita, pezzo, r, c, 0);
    expect(statoQuadro(q, partita).finito).toBe(true);

    const dopo = giocaNelQuadro(q, partita, 0, 0, 0, 1000);
    expect(dopo, 'la mossa dopo la fine deve essere ignorata').toBe(partita);
  });

  it('vincere con l ultima mossa disponibile e una vittoria, non una sconfitta', () => {
    // L'ordine dei controlli conta: chi raggiunge l'obiettivo esaurendo le mosse ha
    // vinto. Invertendo i controlli si toglierebbe la vittoria a chi ce l'ha fatta.
    const q = { numero: 97, nome: 'prova', obiettivi: [{ tipo: 'sopravvivi', quanti: 2 }], maxMosse: 2 };
    let partita = iniziaQuadro(q, { now: 0 });
    for (let i = 0; i < 2; i += 1) {
      const pezzo = partita.hand.findIndex((p) => p && allPlacements(partita.grid, p.shape).length);
      const [r, c] = allPlacements(partita.grid, partita.hand[pezzo].shape)[0];
      partita = giocaNelQuadro(q, partita, pezzo, r, c, i * 1000);
    }
    const stato = statoQuadro(q, partita);
    expect(stato.mosseRimaste).toBe(0);
    expect(stato.completato).toBe(true);
    expect(stato.fallito).toBe(false);
  });
});

describe('avanzamento nel percorso', () => {
  beforeEach(() => memoria.clear());

  it('solo il primo Quadro e aperto all inizio', () => {
    expect(progressi.quadroSbloccato(1)).toBe(true);
    expect(progressi.quadroSbloccato(2)).toBe(false);
    expect(progressi.prossimoQuadro(TOTALE_QUADRI)).toBe(1);
  });

  it('superare un Quadro apre il successivo', () => {
    progressi.registraTentativo(1, { superato: true, mosse: 9, punteggio: 400 });
    expect(progressi.quadroSuperato(1)).toBe(true);
    expect(progressi.quadroSbloccato(2)).toBe(true);
    expect(progressi.quadroSbloccato(3)).toBe(false);
    expect(progressi.prossimoQuadro(TOTALE_QUADRI)).toBe(2);
  });

  it('un tentativo fallito non sblocca niente', () => {
    progressi.registraTentativo(1, { superato: false, mosse: 12, punteggio: 100 });
    expect(progressi.quadroSuperato(1)).toBe(false);
    expect(progressi.quadroSbloccato(2)).toBe(false);
  });

  it('conserva il risultato migliore: meno mosse, poi piu punti', () => {
    progressi.registraTentativo(5, { superato: true, mosse: 10, punteggio: 500 });
    progressi.registraTentativo(5, { superato: true, mosse: 12, punteggio: 900 });
    expect(progressi.caricaProgressi()[5].mosse, 'dodici mosse non battono dieci').toBe(10);

    progressi.registraTentativo(5, { superato: true, mosse: 8, punteggio: 100 });
    expect(progressi.caricaProgressi()[5].mosse).toBe(8);

    progressi.registraTentativo(5, { superato: true, mosse: 8, punteggio: 700 });
    expect(progressi.caricaProgressi()[5].punteggio, 'a parita di mosse vince il punteggio').toBe(700);
  });

  it('conta i tentativi, anche quelli falliti', () => {
    progressi.registraTentativo(3, { superato: true, mosse: 5, punteggio: 200 });
    progressi.registraTentativo(3, { superato: false, mosse: 12, punteggio: 50 });
    progressi.registraTentativo(3, { superato: true, mosse: 6, punteggio: 300 });
    expect(progressi.caricaProgressi()[3].tentativi).toBe(3);
  });

  it('segnala la prima volta e i miglioramenti successivi', () => {
    expect(progressi.registraTentativo(2, { superato: true, mosse: 9, punteggio: 1 }).primaVolta).toBe(true);
    expect(progressi.registraTentativo(2, { superato: true, mosse: 7, punteggio: 1 }).miglioramento).toBe(true);
    expect(progressi.registraTentativo(2, { superato: true, mosse: 11, punteggio: 1 }).miglioramento).toBe(false);
  });
});
