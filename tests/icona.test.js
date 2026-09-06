import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * L'icona in public/ non puo' usare i token CSS: e' un file statico servito prima
 * dell'applicazione. I suoi colori sono quindi scritti a mano in esadecimale, ed e'
 * esattamente il tipo di duplicazione che si scolla senza che nessuno se ne accorga:
 * quando la palette e' passata da smorzata a satura, il marchio nell'applicazione e'
 * cambiato e l'icona della scheda del browser e' rimasta indietro per due versioni.
 *
 * Qui si verifica che ogni colore dell'icona sia ancora uno dei token del tema scuro.
 */

const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const icona = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');

function token(nome) {
  const trovato = new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens);
  expect(trovato, `token ${nome} non trovato`).toBeTruthy();
  return trovato[1].toLowerCase();
}

describe('icona statica', () => {
  it('usa gli stessi colori del marchio nel tema scuro', () => {
    const attesi = [
      token('pl-ink'),
      token('pl-block-4'),
      token('pl-block-2'),
      token('pl-block-3'),
      token('pl-line-strong'),
    ];
    const usati = [...icona.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g)]
      .map((m) => m[1].toLowerCase());
    expect(usati).toEqual(attesi);
  });

  it('mantiene la geometria del logo (quarto riquadro tratteggiato e vuoto)', () => {
    expect(icona).toContain('stroke-dasharray="4 3"');
    expect((icona.match(/rx="5"/g) ?? []).length).toBe(4);
  });
});
