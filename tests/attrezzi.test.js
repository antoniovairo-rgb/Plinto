/**
 * Gli attrezzi: come si guadagnano, come si spendono, e cosa NON deve succedere.
 *
 * Le due regole che questi test difendono sono quelle che un giocatore noterebbe subito
 * se saltassero: non si guadagna due volte per lo stesso livello, e non si spende un
 * attrezzo che non c'e'.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  caricaAttrezzi, riscuoti, usaAttrezzo, quantiAttrezzi, magazzinoPieno,
  OGNI_LIVELLI, MASSIMO, ATTREZZI,
} = await import('../src/persistence/attrezzi.js');

beforeEach(() => memoria.clear());

describe('guadagnare attrezzi', () => {
  it('uno ogni cinque livelli superati', () => {
    expect(riscuoti(4).guadagnati).toBe(0);
    expect(quantiAttrezzi()).toBe(0);
    expect(riscuoti(5).guadagnati).toBe(1);
    expect(quantiAttrezzi()).toBe(1);
    expect(riscuoti(9).guadagnati).toBe(0);
    expect(riscuoti(10).guadagnati).toBe(1);
    expect(quantiAttrezzi()).toBe(2);
  });

  it('NON si guadagna due volte per gli stessi livelli', () => {
    // Il caso vero: `riscuoti` viene chiamata a ogni apertura della schermata.
    riscuoti(10);
    for (let i = 0; i < 20; i += 1) riscuoti(10);
    expect(quantiAttrezzi()).toBe(2);
  });

  it('un salvataggio importato porta con se i livelli mai convertiti', () => {
    // Su questo dispositivo non si era mai giocato: arrivano trenta livelli in blocco.
    const esito = riscuoti(30);
    expect(esito.guadagnati).toBe(MASSIMO);
    expect(esito.persi).toBe(6 - MASSIMO);
  });

  it('a magazzino pieno quello che matura si perde, e si sa quanti', () => {
    riscuoti(15);
    expect(quantiAttrezzi()).toBe(3);
    expect(magazzinoPieno()).toBe(true);
    const esito = riscuoti(25);
    expect(esito.guadagnati).toBe(0);
    expect(esito.persi).toBe(2);
    expect(quantiAttrezzi()).toBe(3);
  });

  it('dopo averne speso uno, i livelli gia contati non ne regalano altri', () => {
    // La prova che il tetto conta davvero: se i crediti restassero in sospeso, qui
    // il magazzino tornerebbe pieno da solo e il tetto non vorrebbe dire niente.
    riscuoti(50);
    expect(quantiAttrezzi()).toBe(3);
    usaAttrezzo();
    expect(quantiAttrezzi()).toBe(2);
    riscuoti(50);
    expect(quantiAttrezzi()).toBe(2);
  });

  it('livelli negativi o strani non rompono niente', () => {
    expect(riscuoti(-10).guadagnati).toBe(0);
    expect(quantiAttrezzi()).toBe(0);
  });
});

describe('spendere attrezzi', () => {
  it('spendere ne toglie uno', () => {
    riscuoti(10);
    expect(usaAttrezzo()).toBe(true);
    expect(quantiAttrezzi()).toBe(1);
  });

  it('a magazzino vuoto non si spende, e non si scrive niente', () => {
    expect(usaAttrezzo()).toBe(false);
    expect(quantiAttrezzi()).toBe(0);
    expect(caricaAttrezzi().disponibili).toBe(0);
  });

  it('la cassetta e completa: gru, gessetto, piccone e mensola', () => {
    // L'ordine non e' un dettaglio: e' l'ordine in cui il pannello li mostra, e va dal
    // piu' semplice da capire al piu' strategico.
    expect(ATTREZZI).toEqual(['gru', 'gessetto', 'piccone', 'mensola']);
    // La scarsita' NON e' cambiata aggiungendo due attrezzi: sempre uno ogni cinque
    // livelli, sempre tre al massimo. Raddoppiare le scelte senza raddoppiare la
    // risorsa e' proprio cio' che rende la scelta una decisione invece di un elenco.
    expect(OGNI_LIVELLI).toBe(5);
    expect(MASSIMO).toBe(3);
  });
});
