import { describe, it, expect } from 'vitest';
import testiIt from '../src/i18n/it.js';
import testiEn from '../src/i18n/en.js';

/**
 * UNA COSA, UN NOME SOLO.
 *
 * I testi del gioco sono stati scritti in momenti diversi e hanno accumulato sinonimi:
 * lo stesso quadratino della griglia era "casella" sedici volte e "cella" due, e in
 * inglese "square" quasi sempre e "cell" dentro la frase delle bombe -- che parlava di
 * "cells" a due righe da una che parlava di "squares". Per chi ha scritto il gioco sono
 * ovviamente la stessa cosa. Per chi legge le regole la prima volta sono due cose, e la
 * seconda non e' spiegata da nessuna parte.
 *
 * Non e' una questione di stile: e' la ragione per cui un tester dice che i testi sono
 * poco chiari senza saper indicare la frase. Qui i sinonimi vietati falliscono la prova.
 *
 * COME LEGGE I TESTI. Scorre i VALORI dei dizionari, non il sorgente: le chiavi possono
 * chiamarsi `celle` quanto vogliono -- e infatti il tipo di obiettivo si chiama cosi' --
 * perche' nessuno le legge. I segnaposto fra graffe vengono tolti prima del confronto,
 * per la stessa ragione: `{celle}` e' il nome di un buco, non una parola.
 */

/** Tutte le stringhe che un giocatore puo' leggere, con il percorso della chiave. */
function testiDi(oggetto, strada = []) {
  if (typeof oggetto === 'string') return [[strada.join('.'), oggetto]];
  if (Array.isArray(oggetto)) return oggetto.flatMap((v, i) => testiDi(v, [...strada, i]));
  if (oggetto && typeof oggetto === 'object') {
    return Object.entries(oggetto).flatMap(([k, v]) => testiDi(v, [...strada, k]));
  }
  return [];
}

const senzaSegnaposto = (s) => s.replace(/\{[^}]*\}/g, ' ');

const VIETATE = {
  it: [[/\bcell[ae]\b/i, 'cella/celle', 'casella/caselle']],
  en: [[/\bcells?\b/i, 'cell/cells', 'square/squares']],
};

describe('una cosa, un nome solo', () => {
  for (const [lingua, testi] of [['it', testiIt], ['en', testiEn]]) {
    it(`${lingua}: nessun sinonimo vietato nei testi del giocatore`, () => {
      const colpevoli = [];
      for (const [chiave, testo] of testiDi(testi)) {
        for (const [regola, sbagliato, giusto] of VIETATE[lingua]) {
          if (regola.test(senzaSegnaposto(testo))) {
            colpevoli.push(`${chiave}: dice "${sbagliato}", si dice "${giusto}"`);
          }
        }
      }
      expect(colpevoli.join('\n')).toBe('');
    });
  }

  it('la parola "gruppo" viene spiegata dove compare per la prima volta', () => {
    /**
     * "Gruppo" e' la parola piu' usata dalle regole -- Intreccio, Tinta, bombe e una
     * dozzina di obiettivi la danno per nota -- e per chi legge la guida al primo avvio
     * compariva senza che nessuno l'avesse mai definita: la spiegazione esisteva solo
     * nella schermata di apertura di un livello che chiede proprio "chiudi N gruppi",
     * cioe' molto piu' tardi e solo per alcuni.
     *
     * La seconda delle quattro regole di base e' il primo posto in cui il giocatore
     * incontra righe, colonne e quadranti: e' li' che il nome collettivo va dato.
     */
    expect(testiIt.intro.due).toMatch(/gruppi/);
    expect(testiEn.intro.due).toMatch(/groups/);
  });
});
