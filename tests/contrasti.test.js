import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

/**
 * I contrasti dichiarati nei token devono essere veri.
 *
 * Due volte in questo progetto i commenti di src/styles/tokens.css hanno dichiarato
 * contrasti WCAG che non erano stati misurati: la prima volta il tema chiaro era
 * inutilizzabile (punteggio a 1.53:1), la seconda --pl-text-faint era dichiarato
 * "4.5" quando sul fondo piu' sfavorevole stava a 3.94. Un commento sbagliato fa
 * passare per verificato cio' che non lo e', quindi la verifica non puo' restare
 * un'operazione manuale.
 *
 * tools/contrasti.mjs rimisura tutti i token leggendo il CSS ed esce con codice 1 se
 * anche uno solo scende sotto soglia. Qui lo si esegue: una sola implementazione,
 * nessun numero copiato a mano in due posti.
 */

const RADICE = new URL('..', import.meta.url).pathname;

describe('contrasti dei token', () => {
  it('nessun token scende sotto la soglia WCAG AA', () => {
    expect(() => {
      execFileSync('node', [join(RADICE, 'tools', 'contrasti.mjs')], { stdio: 'pipe' });
    }).not.toThrow();
  });
});
