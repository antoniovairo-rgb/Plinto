import { describe, it, expect } from 'vitest';
import { caccia } from '../tools/caccia-bug.mjs';

/**
 * La caccia ai difetti del motore, in piccolo: partite a caso che mescolano mosse,
 * carriola, piccone, mensola, gessetto e salvataggio/ripresa, in partita libera (base e
 * con anteprima) e in tutti i cento livelli, con le invarianti controllate dopo ogni
 * passo. Le altre prove giocano solo con le mosse; i difetti di confine, come la terna
 * che non arrivava dopo la mensola, stanno proprio negli incroci con gli attrezzi.
 *
 * Il giro grande si lancia a mano: `node tools/caccia-bug.mjs 20000`.
 */
describe('caccia ai difetti del motore', () => {
  it('nessuna invariante violata mescolando tutte le azioni del giocatore', () => {
    const esito = caccia(30, 20260923);
    const elenco = [...esito.difetti].map(([firma, { conta, primo }]) =>
      `${firma} x${conta} (${primo.etichetta}, passo ${primo.passo})`);
    expect(elenco).toEqual([]);
    // Che la caccia abbia davvero esercitato ogni azione: una prova verde perche' non
    // ha fatto niente sarebbe peggio di nessuna prova.
    for (const azione of ['mossa', 'carriola', 'piccone', 'mensola-appoggia', 'mensola-riprendi', 'ripresa']) {
      expect(esito.contatori[azione] ?? 0, azione).toBeGreaterThan(20);
    }
    expect(esito.tentate.gessetto ?? 0).toBeGreaterThan(20);
    expect(esito.tentate['mossa-illegale'] ?? 0).toBeGreaterThan(20);
  }, 60_000);
});
