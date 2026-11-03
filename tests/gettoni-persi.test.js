/**
 * O6 del collaudo 1.22.0: i gettoni guadagnati e persi nella stessa vittoria.
 *
 * Il caso vero: un salvataggio importato con 112 livelli superati e nessun documento
 * degli attrezzi. Alla vittoria del 113 `riscuoti` paga 22 gettoni, ne entrano 3 e 19 si
 * perdono. La frase deve essere una sola e vera: non «Avevi gia' il massimo», perche'
 * prima della vittoria ne aveva 0. Il percorso nel browser, con l'importazione da file,
 * e' il caso O6 di `npm run correzioni`.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { riscuoti } from '../src/persistence/attrezzi.js';
import { fraseGettoniPersi } from '../src/ui/schermate/FineQuadro.jsx';
import { traduttore } from '../src/i18n/index.js';

const memoria = new Map();
globalThis.window = globalThis.window ?? {};
globalThis.window.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, String(v)),
  removeItem: (k) => memoria.delete(k),
  clear: () => memoria.clear(),
  key: (i) => [...memoria.keys()][i] ?? null,
  get length() { return memoria.size; },
};

const it_ = traduttore('it');
const en = traduttore('en');

describe('gettoni persi nella stessa vittoria (O6)', () => {
  beforeEach(() => memoria.clear());

  it('113 livelli senza documento: 3 guadagnati, 19 persi, una frase sola e vera', () => {
    const paga = riscuoti(113);
    expect(paga.guadagnati).toBe(3);
    expect(paga.persi).toBe(19);
    const esito = { attrezzoGuadagnato: paga.guadagnati, attrezzoPerso: paga.persi };
    const frase = fraseGettoniPersi(esito, it_);
    expect(frase).toBe('Puoi tenerne al massimo 3: gli altri 19 sono andati persi.');
    expect(frase).not.toMatch(/Avevi già/);
    expect(fraseGettoniPersi(esito, en)).toBe('You can keep at most 3: the other 19 were lost.');
  });

  it('uno solo perso, insieme a uno guadagnato', () => {
    const frase = fraseGettoniPersi({ attrezzoGuadagnato: 1, attrezzoPerso: 1 }, it_);
    expect(frase).toBe('Puoi tenerne al massimo 3: l\'altro è andato perso.');
  });

  it('con il magazzino gia\' pieno resta la frase di prima, che li\' e\' vera', () => {
    memoria.set('plinto:attrezzi', JSON.stringify({ versione: 1, disponibili: 3, riscossi: 1 }));
    const paga = riscuoti(10);
    expect(paga).toMatchObject({ guadagnati: 0, persi: 1 });
    const frase = fraseGettoniPersi({ attrezzoGuadagnato: paga.guadagnati, attrezzoPerso: paga.persi }, it_);
    expect(frase).toMatch(/^Avevi già il massimo di 3 gettoni/);
  });

  it('nessun gettone perso: nessuna frase', () => {
    expect(fraseGettoniPersi({ attrezzoGuadagnato: 1, attrezzoPerso: 0 }, it_)).toBeNull();
  });
});
