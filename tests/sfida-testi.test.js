import { describe, it, expect } from 'vitest';
import testiIt from '../src/i18n/it.js';
import testiEn from '../src/i18n/en.js';

/**
 * F3 (PO-004): nessun testo dice che la Sfida del giorno e' la stessa partita per tutti.
 *
 * E' falso: il seme e' la data, quindi griglia e primi pezzi coincidono, ma il generatore
 * legge la griglia per decidere i pezzi e due persone che giocano diversamente divergono
 * dopo sei mani (docs/GAMEPLAY_RULES.md, «La Sfida del Giorno e il suo archivio"). La home
 * lo diceva gia' giusto («parte uguale per tutti», PO-009); la schermata di fine, la guida
 * e l'aiuto dicevano «stessi pezzi, nello stesso ordine» e «exact same game for everyone».
 * Le formule vietate qui sotto sono quelle che c'erano: con i testi della 1.21.10 la
 * prova e' rossa.
 */

function testiDi(oggetto, strada = []) {
  if (typeof oggetto === 'string') return [[strada.join('.'), oggetto]];
  if (Array.isArray(oggetto)) return oggetto.flatMap((v, i) => testiDi(v, [...strada, i]));
  if (oggetto && typeof oggetto === 'object') {
    return Object.entries(oggetto).flatMap(([k, v]) => testiDi(v, [...strada, k]));
  }
  return [];
}

const VIETATE = {
  it: [/stess[ai] (identica )?partita/i, /stessi pezzi/i, /stesso ordine/i, /identica partita/i],
  en: [/same game/i, /same pieces/i, /same order/i],
};

describe('F3: la Sfida parte uguale per tutti, non e\' la stessa partita', () => {
  for (const [lingua, testi] of Object.entries({ it: testiIt, en: testiEn })) {
    it(`${lingua}: nessun testo promette la stessa partita o gli stessi pezzi`, () => {
      const sbagliati = testiDi(testi)
        .filter(([, s]) => VIETATE[lingua].some((r) => r.test(s)))
        .map(([k, s]) => `${k}: ${s}`);
      expect(sbagliati).toEqual([]);
    });
  }

  it('i testi che parlano della sfida dicono che parte uguale', () => {
    for (const k of ['sfidaCosa']) expect(testiIt.modo[k]).toMatch(/parte uguale per tutti/);
    expect(testiIt.sfida.spiegazione).toMatch(/parte uguale per tutti/);
    expect(testiIt.guida.altreModalita).toMatch(/parte uguale per tutti/);
    expect(testiEn.modo.sfidaCosa).toMatch(/starts the same for everyone/);
    expect(testiEn.sfida.spiegazione).toMatch(/starts the same for everyone/);
    expect(testiEn.guida.altreModalita).toMatch(/same start for everyone/);
  });
});
