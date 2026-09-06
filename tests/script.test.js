import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Controllo sintattico degli script che NON vengono importati da nessun test.
 *
 * Gli strumenti in tools/ e le prove in tests/e2e/ girano solo quando li si lancia a
 * mano. Un errore di sintassi li' dentro non lo vede nessuno finche' qualcuno non
 * esegue proprio quello script: e' successo davvero, con una costante dichiarata due
 * volte dopo una modifica meccanica su piu' file. Il difetto e' arrivato fino
 * all'integrazione continua perche' in locale avevo rilanciato solo uno dei quattro.
 *
 * `node --check` analizza il file senza eseguirlo: costa millisecondi e chiude
 * definitivamente questa categoria di errore.
 */

const RADICE = new URL('..', import.meta.url).pathname;

function scriptDa(...cartelle) {
  return cartelle.flatMap((cartella) => {
    const percorso = join(RADICE, cartella);
    return readdirSync(percorso)
      .filter((n) => n.endsWith('.mjs') || n.endsWith('.js'))
      .map((n) => join(cartella, n));
  });
}

describe('script eseguibili', () => {
  const script = scriptDa('tools', 'tests/e2e', 'src/sim');

  it('ne trova davvero (il test non deve passare a vuoto)', () => {
    expect(script.length).toBeGreaterThanOrEqual(6);
  });

  it.each(script)('%s non contiene errori di sintassi', (relativo) => {
    expect(() => {
      execFileSync('node', ['--check', join(RADICE, relativo)], { stdio: 'pipe' });
    }).not.toThrow();
  });
});
