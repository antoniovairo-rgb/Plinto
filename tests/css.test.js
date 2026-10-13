import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { transform } from 'esbuild';

/**
 * I fogli di stile devono essere CSS valido, senza avvisi.
 *
 * PERCHE' ESISTE. Nella 1.21.2 un ritocco a `finiture.css` ha cancellato la prima riga di
 * un commento: il resto del commento e' diventato testo libero, e il browser ha scartato
 * in silenzio la regola che seguiva (le voci del menu sui telefoni stretti). La build
 * non si fermava: stampava solo un avviso («Unexpected ";»), e nessuna prova lo leggeva.
 * Visto per caso il 13 ottobre 2026. Qui l'avviso diventa un errore.
 */
const CARTELLA = new URL('../src/styles/', import.meta.url).pathname;
const fogli = readdirSync(CARTELLA).filter((f) => f.endsWith('.css'));

describe('fogli di stile', () => {
  it('ce ne sono (la prova non passa a vuoto)', () => {
    expect(fogli.length).toBeGreaterThan(3);
  });

  for (const nome of fogli) {
    it(`${nome} e' CSS valido, senza avvisi`, async () => {
      const { warnings } = await transform(readFileSync(join(CARTELLA, nome), 'utf8'), { loader: 'css' });
      expect(warnings.map((w) => `${w.location?.line}: ${w.text}`)).toEqual([]);
    });
  }
});
