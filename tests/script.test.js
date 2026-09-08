import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
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

/**
 * Un metro solo per i livelli.
 *
 * Il generatore dei Quadri promette che ogni livello e' superabile, e `npm run quadri` lo
 * verifica. Fino alla 1.1.0 le due cose usavano due copie del giocatore artificiale che
 * si erano allontanate -- pesi diversi sulla Catena -- e il generatore poteva promuovere
 * un livello che il verificatore bocciava: e' successo col quadro 44, superato una volta
 * su dieci. Una garanzia rilasciata e controllata con due metri diversi vale solo contro
 * se stessa.
 *
 * Questo controllo non guarda i numeri, guarda il CODICE: che nessuno dei due strumenti si
 * sia ricostruito il giocatore in casa. E' l'unico modo di accorgersene prima che i due si
 * separino di nuovo, perche' finche' non si separano i numeri tornano.
 */
describe('il giocatore dei livelli e uno solo', () => {
  const leggi = (f) => readFileSync(join(RADICE, f), 'utf8');

  it.each([
    ['tools/quadri.mjs'],
    ['tools/genera-quadri.mjs'],
  ])('%s usa il modulo condiviso e non una copia propria', (file) => {
    const sorgente = leggi(file);
    expect(sorgente, `${file}: non importa src/sim/giocatore-quadri.mjs`)
      .toContain('sim/giocatore-quadri.mjs');
  });

  it('nessuno strumento ridefinisce scegliMossa o ramiDiRadice in casa', () => {
    // Il generatore ha un SECONDO giocatore, che gioca senza obiettivo e serve a tarare:
    // quello e' un altro mestiere e puo' restare. Cio' che non deve esistere e' una
    // seconda versione di quello che MIRA all'obiettivo, ed e' proprio `scegliMossa` a
    // portarne il nome nel modulo condiviso.
    for (const file of ['tools/quadri.mjs']) {
      const sorgente = leggi(file);
      expect(sorgente, `${file}: ridefinisce scegliMossa invece di importarlo`)
        .not.toMatch(/^function scegliMossa\b/m);
      expect(sorgente, `${file}: ridefinisce preferenze invece di importarlo`)
        .not.toMatch(/^function preferenze\b/m);
    }
  });
});
