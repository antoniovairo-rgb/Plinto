import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { DURATA_ATTERRAGGIO, DURATA_ESPLOSIONE, DURATA_PUNTI } from '../src/feel/durate.js';

/**
 * Le durate degli effetti vivono per forza in due posti: in JavaScript, per sapere
 * quando togliere un elemento temporaneo dallo stato, e in CSS, per animarlo.
 * Se si scollano, l'elemento sparisce prima della fine dell'animazione (uno scatto)
 * oppure resta appeso dopo (un residuo). Nessuno se ne accorgerebbe leggendo il codice:
 * i due numeri stanno in file diversi e sembrano entrambi giusti.
 */
describe('allineamento fra durate JavaScript e CSS', () => {
  const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');

  function millisecondi(nomeToken) {
    const trovato = new RegExp(`--${nomeToken}:\\s*(\\d+)ms`).exec(tokens);
    return trovato ? Number(trovato[1]) : null;
  }

  it('il token dell atterraggio corrisponde alla costante JavaScript', () => {
    expect(millisecondi('pl-t-atterraggio')).toBe(DURATA_ATTERRAGGIO);
  });

  it('il token dell esplosione corrisponde alla costante JavaScript', () => {
    expect(millisecondi('pl-t-esplosione')).toBe(DURATA_ESPLOSIONE);
  });

  it('il token dei punti volanti corrisponde alla costante JavaScript', () => {
    expect(millisecondi('pl-t-punti')).toBe(DURATA_PUNTI);
  });

  it('le animazioni del foglio di stile non scrivono durate a mano', () => {
    // Una durata letterale dentro una animation: e' esattamente il modo in cui i due
    // file tornano a scollarsi, e in piu' ignora prefers-reduced-motion.
    const app = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
    const letterali = [...app.matchAll(/animation:\s*[\w-]+\s+(\d+m?s)/g)].map((m) => m[1]);
    // L'unica eccezione ammessa e' la pulsazione continua dell'aiuto visivo, che non
    // e' un effetto di mossa e non ha una controparte in JavaScript.
    expect(letterali.filter((d) => d !== '1s')).toEqual([]);
  });
});
