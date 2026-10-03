import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';
import {
  QUADRI, ATTI, OPERE, TOTALE_QUADRI, operaDelQuadro, operaSuccessiva, attiDellOpera,
  livelliDellOpera, attoDelQuadro,
} from '../src/config/quadri.js';
import * as ponte from '../src/config/opere/ponte.js';
import {
  quadroSbloccato, apertoPerInsistenza, prossimoQuadro, riepilogoPercorso, riepilogoAtto,
  operaCompletata, superatiNellOpera, TENTATIVI_PER_APRIRE,
} from '../src/persistence/progressi.js';
import { gridFromString, findCompletedGroups, MASSO } from '../src/core/grid.js';

/**
 * LE OPERE: il Ponte (livelli 1-100) e la Torre (101-200).
 *
 * Tre promesse, ognuna con la sua prova:
 *   1. il Ponte resta quello pubblicato, livello per livello;
 *   2. la Torre si apre solo finendo TUTTO il Ponte, ogni livello con la spunta;
 *   3. conteggi, atti e festa finale si leggono opera per opera.
 */

/** Progressi finti: i livelli indicati superati, con un tentativo ciascuno. */
function superati(numeri, extra = {}) {
  const p = {};
  for (const n of numeri) p[n] = { mosse: 10, punteggio: 100, tentativi: 1 };
  return { ...p, ...extra };
}
const intervallo = (da, a) => Array.from({ length: a - da + 1 }, (_, i) => da + i);

describe('il Ponte non cambia', () => {
  it('i cento livelli del Ponte sono identici a quelli pubblicati (1.19.4)', () => {
    // L'impronta e' stata presa sui livelli pubblicati, prima di dividere il file per
    // opere. Se cambia, qualcuno ha rigenerato o ritoccato il Ponte: livelli che le
    // persone hanno gia' giocato e superato sarebbero diversi. Non si aggiorna questo
    // numero per far passare la prova: si rimette il Ponte com'era.
    const impronta = createHash('sha256').update(JSON.stringify(ponte.QUADRI)).digest('hex');
    expect(ponte.QUADRI).toHaveLength(100);
    expect(impronta).toBe('395884bc809d126938266fa278ece18d118027a61081d0b6c06be979af89b1b9');
  });

  it('il Ponte non ha massi: la meccanica vive solo nella Torre', () => {
    for (const q of ponte.QUADRI) expect(q.griglia ?? '').not.toContain('M');
  });
});

describe('le opere in fila', () => {
  it('due opere, la Torre subito dopo il Ponte, numeri senza buchi', () => {
    expect(OPERE.map((o) => o.id)).toEqual(['ponte', 'torre']);
    expect(OPERE[0]).toMatchObject({ da: 1, a: 100 });
    expect(OPERE[1]).toMatchObject({ da: 101, a: 200 });
    expect(TOTALE_QUADRI).toBe(200);
    QUADRI.forEach((q, i) => expect(q.numero).toBe(i + 1));
    expect(operaSuccessiva(OPERE[0]).id).toBe('torre');
    expect(operaSuccessiva(OPERE[1])).toBeNull();
  });

  it('ogni livello sta nell atto e nell opera giusti', () => {
    for (const q of QUADRI) {
      const opera = operaDelQuadro(q.numero);
      const atto = attoDelQuadro(q.numero);
      expect(atto.id).toBe(q.atto);
      expect(atto.opera).toBe(opera.id);
    }
    for (const opera of OPERE) {
      const atti = attiDellOpera(opera);
      expect(atti).toHaveLength(7);
      expect(atti[0].da).toBe(opera.da);
      expect(atti[atti.length - 1].a).toBe(opera.a);
    }
    expect(new Set(ATTI.map((a) => a.id)).size).toBe(ATTI.length);
  });

  it('ogni livello della Torre ha massi, e nessuna griglia parte con un gruppo chiuso o fatto solo di massi', () => {
    for (const q of QUADRI.filter((x) => x.numero > 100)) {
      expect(q.griglia, `livello ${q.numero}`).toContain('M');
      const g = gridFromString(q.griglia, 3);
      expect(findCompletedGroups(g), `livello ${q.numero}`).toEqual([]);
      for (let r = 0; r < 9; r += 1) {
        const riga = q.griglia.split('\n')[r];
        expect(riga, `livello ${q.numero}, riga ${r}`).not.toBe('MMMMMMMMM');
      }
      expect(g.some((v) => v === MASSO)).toBe(true);
    }
  });
});

describe('la Torre si apre solo finendo tutto il Ponte', () => {
  it('chiusa all inizio, chiusa con 99 livelli del Ponte, aperta con tutti e 100', () => {
    expect(quadroSbloccato(101, {})).toBe(false);
    expect(quadroSbloccato(101, superati(intervallo(1, 99)))).toBe(false);
    expect(quadroSbloccato(101, superati(intervallo(1, 100)))).toBe(true);
    expect(operaCompletata(OPERE[0], superati(intervallo(1, 100)))).toBe(true);
  });

  it('un livello del Ponte lasciato indietro tiene chiusa la Torre, anche vincendo il centesimo', () => {
    const progressi = superati(intervallo(1, 100).filter((n) => n !== 37));
    expect(quadroSbloccato(101, progressi)).toBe(false);
    expect(superatiNellOpera(OPERE[0], progressi)).toBe(99);
  });

  it('l insistenza non apre la Torre: otto tentativi sul centesimo non bastano', () => {
    const progressi = superati(intervallo(1, 99), { 100: { tentativi: TENTATIVI_PER_APRIRE } });
    expect(quadroSbloccato(101, progressi)).toBe(false);
    expect(apertoPerInsistenza(101, progressi)).toBe(false);
  });

  it('dentro la Torre vale la regola di sempre, insistenza compresa', () => {
    const ponteFatto = intervallo(1, 100);
    expect(quadroSbloccato(102, superati(ponteFatto))).toBe(false);
    expect(quadroSbloccato(102, superati([...ponteFatto, 101]))).toBe(true);
    const insistito = superati(ponteFatto, { 101: { tentativi: TENTATIVI_PER_APRIRE } });
    expect(quadroSbloccato(102, insistito)).toBe(true);
    expect(apertoPerInsistenza(102, insistito)).toBe(true);
  });
});

describe('da dove si riprende', () => {
  it('Ponte finito: si riparte dal primo livello della Torre', () => {
    expect(prossimoQuadro(TOTALE_QUADRI, superati(intervallo(1, 100)))).toBe(101);
  });

  it('centesimo vinto con un buco dietro: si riprende dal buco, non da una Torre chiusa', () => {
    const progressi = superati(intervallo(1, 100).filter((n) => n !== 37));
    expect(prossimoQuadro(TOTALE_QUADRI, progressi)).toBe(37);
  });

  it('a meta Torre si riprende dopo l ultimo superato', () => {
    expect(prossimoQuadro(TOTALE_QUADRI, superati(intervallo(1, 130)))).toBe(131);
  });
});

describe('conteggi e feste, opera per opera', () => {
  it('il riepilogo del Ponte non conta i livelli della Torre', () => {
    const progressi = superati(intervallo(1, 110));
    const ponteR = riepilogoPercorso(progressi, livelliDellOpera(OPERE[0]), OPERE[0].da);
    expect(ponteR.superati).toBe(100);
    expect(ponteR.completo).toBe(true);
    const torreR = riepilogoPercorso(progressi, livelliDellOpera(OPERE[1]), OPERE[1].da);
    expect(torreR.superati).toBe(10);
    expect(torreR.completo).toBe(false);
  });

  it('gli atti si contano dentro la loro opera: la vetta e il settimo di sette', () => {
    const vetta = attoDelQuadro(200);
    const r = riepilogoAtto(vetta, null, superati(intervallo(1, 200)));
    expect(r.opera).toBe('torre');
    expect(r.indice).toBe(7);
    expect(r.totaleAtti).toBe(7);
    expect(r.intensita).toBe(3);
    expect(r.attiChiusi).toBe(7);
    expect(r.mancanti).toBe(0);
    const primoTorre = riepilogoAtto(attoDelQuadro(101), null, superati(intervallo(1, 100)));
    expect(primoTorre.indice).toBe(1);
    expect(primoTorre.mancanti).toBe(100);
  });
});

describe('i massi si spiegano', () => {
  it('la guida nomina tutte e due le opere, e le regole hanno la sezione dei massi', async () => {
    const { readFileSync } = await import('node:fs');
    const testiIt = (await import('../src/i18n/it.js')).default;
    const testiEn = (await import('../src/i18n/en.js')).default;
    for (const [lingua, testi] of [['it', testiIt], ['en', testiEn]]) {
      expect(testi.guida.percorso, lingua).toContain('{ponte}');
      expect(testi.guida.percorso, lingua).toContain('{torre}');
      for (const chiave of ['massiTitolo', 'massi', 'massiEccezioni']) {
        expect(typeof testi.aiuto[chiave], `${lingua}: aiuto.${chiave}`).toBe('string');
      }
      expect(typeof testi.quadri.massiRegola, `${lingua}: quadri.massiRegola`).toBe('string');
      expect(typeof testi.a11y.cellaMasso, `${lingua}: a11y.cellaMasso`).toBe('string');
    }
    const regole = readFileSync(new URL('../src/ui/schermate/ComeSiGioca.jsx', import.meta.url), 'utf8');
    expect(regole).toContain("t('aiuto.massi')");
    const apertura = readFileSync(new URL('../src/ui/schermate/AperturaQuadro.jsx', import.meta.url), 'utf8');
    expect(apertura).toContain("t('quadri.massiRegola')");
  });
});
