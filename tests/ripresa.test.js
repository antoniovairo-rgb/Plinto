/**
 * Tornare dov'eravamo.
 *
 * La regola e' piccola e le conseguenze no: sbagliarla in un senso butta il giocatore
 * fuori dalla partita (il difetto segnalato), sbagliarla nell'altro lo butta DENTRO una
 * partita di ieri che non aveva chiesto. Qui si prova la decisione, che e' pura; che poi
 * l'app ci vada davvero lo prova tests/e2e/ripresa.mjs.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

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
const {
  segnaPosto, leggiRipresa, dimenticaPosto, FINESTRA_RIPRESA,
} = await import('../src/persistence/ripresa.js');

const ORA = 1_800_000_000_000;

beforeEach(() => memoria.clear());

describe('il posto in cui si stava giocando', () => {
  it('si ricorda, se l assenza e stata breve', () => {
    segnaPosto('gioco', null, ORA);
    const r = leggiRipresa(ORA + 60_000);
    expect(r).toMatchObject({ dove: 'gioco', quadro: null });
    expect(r.assenza).toBe(60_000);
  });

  it('conserva il numero del livello', () => {
    segnaPosto('quadro', 37, ORA);
    expect(leggiRipresa(ORA + 1000)).toMatchObject({ dove: 'quadro', quadro: 37 });
  });

  it('si dimentica appena l assenza supera la finestra', () => {
    segnaPosto('gioco', null, ORA);
    // Al limite esatto vale ancora; un millisecondo dopo no.
    expect(leggiRipresa(ORA + FINESTRA_RIPRESA)).not.toBe(null);
    expect(leggiRipresa(ORA + FINESTRA_RIPRESA + 1)).toBe(null);
  });

  it('non si fida di un istante nel futuro', () => {
    // Capita davvero: basta che l'orologio del telefono venga spostato indietro. Da
    // un'assenza negativa non si ricava niente, e la home e' la risposta prudente.
    segnaPosto('gioco', null, ORA + 60_000);
    expect(leggiRipresa(ORA)).toBe(null);
  });

  it('dimenticare cancella davvero', () => {
    segnaPosto('sfida', null, ORA);
    dimenticaPosto();
    expect(leggiRipresa(ORA + 1000)).toBe(null);
  });

  it('senza niente in memoria non riprende niente', () => {
    expect(leggiRipresa(ORA)).toBe(null);
  });

  it('rifiuta un posto che non esiste', () => {
    // Le voci in memoria si possono modificare a mano, e un posto inventato manderebbe
    // l'avvio su una schermata che non c'e'.
    expect(segnaPosto('cucina', null, ORA)).toBe(false);
    expect(leggiRipresa(ORA)).toBe(null);
  });

  it('rifiuta una voce senza istante o con un istante non numerico', () => {
    memoria.set('plinto:ripresa', JSON.stringify({ dove: 'gioco' }));
    expect(leggiRipresa(ORA)).toBe(null);
    memoria.set('plinto:ripresa', JSON.stringify({ dove: 'gioco', quando: 'ieri' }));
    expect(leggiRipresa(ORA)).toBe(null);
  });

  it('sopravvive a una voce illeggibile invece di rompersi', () => {
    memoria.set('plinto:ripresa', '{ questo non e JSON');
    expect(() => leggiRipresa(ORA)).not.toThrow();
    expect(leggiRipresa(ORA)).toBe(null);
  });

  it('la finestra e di due ore, e il valore sta in un posto solo', () => {
    // Se un giorno la si cambia, la si cambia li'. Questo controllo serve a rendere la
    // scelta esplicita: due ore non sono una misura, sono una decisione.
    expect(FINESTRA_RIPRESA).toBe(2 * 60 * 60 * 1000);
  });
});
