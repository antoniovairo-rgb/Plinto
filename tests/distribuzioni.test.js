import { describe, it, expect } from 'vitest';
import {
  CELLE, MAX_GRUPPI_PER_MOSSA, distribuzioniVuote, normalizzaDistribuzioni, conMossa,
} from '../src/core/distribuzioni.js';
import { SHAPES } from '../src/core/shapes.js';
import { quadrantOf, idx } from '../src/core/grid.js';
import { GRID_SIZE, CHAIN_MAX } from '../src/config/rules.js';

/**
 * Le tre distribuzioni di una partita.
 *
 * Sono contatori, quindi sembra che non ci sia niente da sbagliare. Le cose che si
 * possono sbagliare, e che qui vengono controllate, sono tre: dimensionare un array
 * "a occhio" e perdere in silenzio i casi rari; indicizzare sulla Catena sbagliata
 * (quella dopo la mossa invece di quella applicata); e mutare l'array in ingresso,
 * che in un motore che promette stati immutabili e' un difetto vero.
 */

describe('dimensioni degli istogrammi', () => {
  it('la lunghezza dell istogramma dell Intreccio copre il massimo teorico del catalogo', () => {
    // Ricalcolo indipendente dal modulo: se domani entra una forma piu' larga e la
    // costante non lo segue, l'array perderebbe le mosse migliori senza dirlo.
    let massimo = 0;
    for (const forma of SHAPES) {
      const altezza = Math.max(...forma.cells.map(([r]) => r));
      const larghezza = Math.max(...forma.cells.map(([, c]) => c));
      for (let riga = 0; riga + altezza < GRID_SIZE; riga += 1) {
        for (let colonna = 0; colonna + larghezza < GRID_SIZE; colonna += 1) {
          const righe = new Set();
          const colonne = new Set();
          const quadranti = new Set();
          for (const [dr, dc] of forma.cells) {
            righe.add(riga + dr);
            colonne.add(colonna + dc);
            quadranti.add(quadrantOf(riga + dr, colonna + dc));
          }
          massimo = Math.max(massimo, righe.size + colonne.size + quadranti.size);
        }
      }
    }
    expect(MAX_GRUPPI_PER_MOSSA).toBe(massimo);
    // Il valore atteso oggi e' 10 (blocco 3x3 su un incrocio di quadranti): se questo
    // controllo cade dopo aver aggiunto una forma, la costante ha fatto il suo lavoro.
    expect(massimo).toBeGreaterThanOrEqual(3);
  });

  it('gli array vuoti hanno la lunghezza dichiarata', () => {
    const d = distribuzioniVuote();
    expect(d.istogrammaCatena).toHaveLength(CHAIN_MAX + 1);
    expect(d.istogrammaIntreccio).toHaveLength(MAX_GRUPPI_PER_MOSSA + 1);
    expect(d.mappaAppoggi).toHaveLength(CELLE);
    expect(CELLE).toBe(GRID_SIZE * GRID_SIZE);
    expect(d.istogrammaCatena.every((n) => n === 0)).toBe(true);
  });
});

describe('conMossa', () => {
  it('conta la mossa nella casella della Catena applicata', () => {
    const dopo = conMossa(distribuzioniVuote(), {
      catenaApplicata: 4, gruppi: 2, riga: 0, colonna: 0,
    });
    expect(dopo.istogrammaCatena[4]).toBe(1);
    expect(dopo.istogrammaCatena[5], 'la Catena dopo la mossa non deve entrarci').toBe(0);
    expect(dopo.istogrammaIntreccio[2]).toBe(1);
    expect(dopo.mappaAppoggi[0]).toBe(1);
  });

  it('non modifica le distribuzioni ricevute', () => {
    const prima = distribuzioniVuote();
    conMossa(prima, { catenaApplicata: 3, gruppi: 1, riga: 4, colonna: 4 });
    expect(prima.istogrammaCatena.every((n) => n === 0), 'array in ingresso mutato').toBe(true);
    expect(prima.mappaAppoggi.every((n) => n === 0)).toBe(true);
  });

  it('la cella di ancoraggio finisce nella posizione giusta della mappa', () => {
    const dopo = conMossa(distribuzioniVuote(), {
      catenaApplicata: 0, gruppi: 0, riga: 5, colonna: 7,
    });
    expect(dopo.mappaAppoggi[idx(5, 7)]).toBe(1);
    expect(dopo.mappaAppoggi.reduce((s, n) => s + n, 0)).toBe(1);
  });

  it('un valore fuori scala viene limitato, MAI scartato', () => {
    // Verrebbe da un salvataggio manomesso. Scartarlo romperebbe l'invariante
    // "somma dell'istogramma = mosse giocate", che e' cio' che rende leggibile
    // tutto il resto: un conteggio nella casella sbagliata si nota, uno sparito no.
    const dopo = conMossa(distribuzioniVuote(), {
      catenaApplicata: 99, gruppi: -3, riga: 40, colonna: -1,
    });
    expect(dopo.istogrammaCatena.reduce((s, n) => s + n, 0)).toBe(1);
    expect(dopo.istogrammaCatena[CHAIN_MAX]).toBe(1);
    expect(dopo.istogrammaIntreccio[0]).toBe(1);
    expect(dopo.mappaAppoggi.reduce((s, n) => s + n, 0)).toBe(1);
  });
});

describe('normalizzaDistribuzioni', () => {
  it('un array della lunghezza sbagliata riparte da zero invece di passare intatto', () => {
    const rotte = normalizzaDistribuzioni({
      istogrammaCatena: [1, 2, 3],
      istogrammaIntreccio: null,
      mappaAppoggi: 'non un array',
    });
    expect(rotte.istogrammaCatena).toHaveLength(CHAIN_MAX + 1);
    expect(rotte.istogrammaCatena.every((n) => n === 0)).toBe(true);
    expect(rotte.mappaAppoggi).toHaveLength(CELLE);
  });

  it('rifiuta valori non interi o negativi', () => {
    const catena = new Array(CHAIN_MAX + 1).fill(0);
    catena[2] = -1;
    expect(normalizzaDistribuzioni({ istogrammaCatena: catena }).istogrammaCatena[2]).toBe(0);
  });

  it('un documento assente non fa esplodere niente', () => {
    expect(normalizzaDistribuzioni().mappaAppoggi).toHaveLength(CELLE);
    expect(normalizzaDistribuzioni(undefined).istogrammaCatena).toHaveLength(CHAIN_MAX + 1);
  });
});
