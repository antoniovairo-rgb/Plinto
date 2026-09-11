import { describe, it, expect } from 'vitest';
import { creaSacchetti } from '../src/feel/sacchetto.js';

describe('il sacchetto delle frasi', () => {
  it('dice tutte le frasi prima di ripeterne una', () => {
    // E' la proprieta' per cui il sacchetto esiste. Sorteggiando con rimpiazzo, su
    // trenta frasi il primo doppione arriva in media dopo sette estrazioni (paradosso
    // del compleanno): tante frasi non bastano se il modo di pescarle e' sbagliato.
    for (const quante of [2, 6, 14, 30]) {
      const pesca = creaSacchetti();
      const giro = Array.from({ length: quante }, () => pesca('prova', quante));
      expect(new Set(giro).size, `con ${quante} frasi`).toBe(quante);
    }
  });

  it('non dice mai la stessa frase due volte di fila, nemmeno fra un giro e l altro', () => {
    // Il punto scoperto e' la cucitura: l'ultima frase di un giro e la prima del
    // successivo sono estratte da due mescolate diverse e possono coincidere. E' il
    // doppione piu' visibile di tutti, perche' e' attaccato.
    for (let prova = 0; prova < 300; prova += 1) {
      const pesca = creaSacchetti();
      let precedente = null;
      for (let i = 0; i < 40; i += 1) {
        const ora = pesca('prova', 6);
        expect(ora, `giro ${prova}, estrazione ${i}`).not.toBe(precedente);
        precedente = ora;
      }
    }
  });

  it('tiene i sacchetti separati per categoria', () => {
    const pesca = creaSacchetti();
    const a = Array.from({ length: 5 }, () => pesca('a', 5));
    const b = Array.from({ length: 5 }, () => pesca('b', 5));
    expect(new Set(a).size).toBe(5);
    expect(new Set(b).size).toBe(5);
  });

  it('distribuisce in modo uniforme sul lungo periodo', () => {
    const pesca = creaSacchetti();
    const conta = new Array(10).fill(0);
    for (let i = 0; i < 10000; i += 1) conta[pesca('prova', 10)] += 1;
    // Estraendo senza rimpiazzo su multipli esatti del sacchetto la distribuzione e'
    // perfetta per costruzione, non "quasi": ogni frase esce esattamente mille volte.
    conta.forEach((n, i) => expect(n, `frase ${i}`).toBe(1000));
  });

  it('non si rompe con una frase sola, e non entra in ciclo', () => {
    const pesca = creaSacchetti();
    for (let i = 0; i < 20; i += 1) expect(pesca('unica', 1)).toBe(0);
    expect(pesca('assente', 0)).toBe(0);
    expect(pesca('rotta', undefined)).toBe(0);
  });

  it('si rifa da capo se il numero di frasi cambia', () => {
    // Succede cambiando lingua a partita in corso. Un indice rimasto fuori elenco
    // mostrerebbe la chiave al posto della frase.
    const pesca = creaSacchetti();
    for (let i = 0; i < 3; i += 1) pesca('prova', 30);
    for (let i = 0; i < 50; i += 1) expect(pesca('prova', 4)).toBeLessThan(4);
  });
});
