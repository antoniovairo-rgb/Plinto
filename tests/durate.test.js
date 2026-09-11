import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DURATA_ATTERRAGGIO, DURATA_ESPLOSIONE, DURATA_PUNTI, DURATA_INCITAMENTO,
} from '../src/feel/durate.js';

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

  it('il token della frase di incitamento corrisponde alla costante JavaScript', () => {
    expect(millisecondi('pl-t-incitamento')).toBe(DURATA_INCITAMENTO);
  });

  it('la frase di incitamento resta leggibile anche con meno movimento', () => {
    // Le altre durate vengono azzerate sotto prefers-reduced-motion perche' misurano
    // un movimento. Questa misura per quanto tempo si puo' leggere una frase: se
    // finisse anche lei nell'elenco, chi ha chiesto meno animazioni smetterebbe di
    // ricevere i messaggi invece di riceverli fermi.
    const blocco = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n  \}/.exec(tokens);
    expect(blocco, 'il blocco prefers-reduced-motion deve esistere').toBeTruthy();
    expect(blocco[1]).not.toMatch(/--pl-t-incitamento/);
  });

  it('le animazioni del foglio di stile non scrivono durate a mano', () => {
    // Una durata letterale dentro una animation: e' esattamente il modo in cui i due
    // file tornano a scollarsi, e in piu' ignora prefers-reduced-motion.
    //
    // La prima versione di questo controllo cercava `\\d+m?s` e quindi non vedeva
    // nemmeno una durata con la virgola: `1.6s` e `3.2s` passavano indisturbate, e il
    // test dichiarava di garantire qualcosa che non stava verificando.
    const app = readFileSync(new URL('../src/styles/app.css', import.meta.url), 'utf8');
    const letterali = [...app.matchAll(/animation:\s*([\w-]+)\s+([\d.]+m?s)/g)]
      .map((m) => ({ nome: m[1], durata: m[2] }));

    // Le uniche eccezioni ammesse sono i cicli continui di "vita" (respiri, pulsazioni):
    // non sono effetti di mossa, non hanno controparte in JavaScript e ognuno di essi
    // deve avere il proprio interruttore sotto prefers-reduced-motion.
    const CICLI_CONTINUI = ['pl-pulsa', 'pl-bomba-respira', 'pl-plinto-respira'];

    expect(letterali.filter((l) => !CICLI_CONTINUI.includes(l.nome))).toEqual([]);

    // Il test non deve passare a vuoto: se qualcuno rinomina i cicli, ce ne accorgiamo.
    expect(letterali.map((l) => l.nome).sort()).toEqual([...CICLI_CONTINUI].sort());

    // E ognuno resta spegnibile da chi ha chiesto meno movimento: il selettore che
    // porta il ciclo deve ricomparire, con animation: none, dentro un blocco
    // prefers-reduced-motion. Per saperlo serve il selettore che RACCHIUDE la
    // dichiarazione, non la riga in cui si trova: quasi sempre sono righe diverse.
    const blocchi = [...app.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .map((m) => ({ selettore: m[1].trim().split('\n').pop().trim(), corpo: m[2] }));

    const spenti = new Set(
      blocchi.filter((b) => /animation:\s*none/.test(b.corpo)).map((b) => b.selettore),
    );

    for (const nome of CICLI_CONTINUI) {
      const portante = blocchi.find((b) => new RegExp(`animation:\\s*${nome}\\b`).test(b.corpo));
      expect(portante, `${nome} deve avere una regola che lo applica`).toBeTruthy();
      expect(
        spenti.has(portante.selettore),
        `${portante.selettore} (${nome}) non ha un animation: none sotto prefers-reduced-motion`,
      ).toBe(true);
    }
  });
});
