import { describe, it, expect } from 'vitest';
import { QUADRI } from '../src/config/quadri.js';
import { OBIETTIVI } from '../src/core/quadro.js';

/**
 * LA FORMA DEL PERCORSO, non la sua taratura.
 *
 * La difficolta' vera dei cento livelli si misura solo giocandoli, e la misurano il
 * generatore (`tools/genera-quadri.mjs`, che impone a ogni atto una banda di riuscite) e
 * il replay integrale del gate. Sono minuti di partite: non stanno in una prova unitaria.
 *
 * Qui si fissa cio' che di quel progetto si vede leggendo il file generato, e che una
 * rigenerazione distratta puo' cancellare senza che nulla protesti. Sono tutte cose che
 * erano gia' andate perse una volta: gli intrecci ridotti a cinque livelli su cento, i
 * livelli a due obiettivi mai nati benche' il motore li reggesse da sempre, il tetto di
 * mosse sceso sotto la soglia oltre la quale un livello non e' piu' una prova di abilita'
 * ma un sorteggio.
 */

const conDue = QUADRI.filter((q) => q.obiettivi.length === 2);
const conIntrecci = QUADRI.filter((q) => q.obiettivi.some((o) => o.tipo === 'intrecci'));

describe('forma del percorso dei Quadri', () => {
  it('i livelli a due obiettivi esistono, e non sono una rarita', () => {
    // Il motore, il giocatore artificiale e lo schermo dell'obiettivo maneggiano una
    // lista da sempre; per cento livelli nessuno ne ha mai avuti due. Dieci e' la soglia
    // sotto la quale la cosa torna a essere un'eccezione che non si incontra.
    expect(conDue.length).toBeGreaterThanOrEqual(10);
  });

  it('nessun livello chiede due volte la stessa cosa', () => {
    conDue.forEach((q) => {
      const tipi = q.obiettivi.map((o) => o.tipo);
      expect(new Set(tipi).size, `quadro ${q.numero}: ${tipi.join('+')}`).toBe(tipi.length);
    });
  });

  it('i livelli a due obiettivi stanno nella seconda meta del percorso', () => {
    // Un livello che insegna chiede una cosa alla volta.
    conDue.forEach((q) => expect(q.numero, `quadro ${q.numero}`).toBeGreaterThan(40));
  });

  it('gli intrecci sono chiesti in tutto il percorso, non in un solo tratto', () => {
    expect(conIntrecci.length).toBeGreaterThanOrEqual(10);
    const atti = new Set(conIntrecci.map((q) => q.atto));
    expect(atti.size, `intrecci solo negli atti: ${[...atti].join(', ')}`).toBeGreaterThanOrEqual(3);
  });

  it('ogni tipo usato compare almeno tre volte', () => {
    const quante = {};
    QUADRI.forEach((q) => q.obiettivi.forEach((o) => { quante[o.tipo] = (quante[o.tipo] ?? 0) + 1; }));
    Object.entries(quante).forEach(([tipo, n]) => {
      expect(n, `${tipo} compare ${n} volte`).toBeGreaterThanOrEqual(3);
      expect(OBIETTIVI[tipo], `tipo sconosciuto: ${tipo}`).toBeDefined();
    });
  });

  it('nessun livello scende sotto le otto mosse', () => {
    // Sotto le otto un livello smette di essere una prova di abilita' e diventa un
    // sorteggio: o capita la catena giusta o non capita, e non c'e' spazio per costruire.
    QUADRI.forEach((q) => expect(q.maxMosse, `quadro ${q.numero}`).toBeGreaterThanOrEqual(8));
  });

  it('ogni tipo di obiettivo copre un tratto, non un punto', () => {
    // Un tipo che compare solo in tre livelli vicini non e' una meccanica del gioco, e'
    // un episodio: e' quello che era diventato `intrecci`, chiesto quattro volte in
    // sedici livelli e mai piu'. La distanza fra la prima e l'ultima volta dice se il
    // gioco continua a chiederlo o se l'ha dimenticato.
    const dove = {};
    QUADRI.forEach((q) => q.obiettivi.forEach((o) => {
      (dove[o.tipo] ??= []).push(q.numero);
    }));
    Object.entries(dove).forEach(([tipo, numeri]) => {
      const arco = numeri[numeri.length - 1] - numeri[0];
      expect(arco, `${tipo}: dal ${numeri[0]} al ${numeri[numeri.length - 1]}`)
        .toBeGreaterThanOrEqual(20);
    });
  });
});

/**
 * IL FILE GENERATO DEVE ESPORTARE TUTTO QUELLO CHE L'APP GLI CHIEDE.
 *
 * `src/config/quadri.js` lo scrive `tools/genera-quadri.mjs` da un modello di testo, e il
 * modello e' una copia del file: due cose che devono restare uguali e non hanno niente
 * che le tenga insieme. E' successo: `operaDelQuadro` -- la funzione che dice a quale
 * opera appartiene un livello, usata dalla scheda condivisibile e dalla schermata di fine
 * livello -- era stata aggiunta a mano al file generato e mai rimessa nel modello. La
 * prima rigenerazione l'ha cancellata, e l'app non si avviava piu': schermo nero e un solo
 * errore in console.
 *
 * NESSUNA PROVA UNITARIA SE N'ERA ACCORTA, e vale la pena capire perche': 561 prove
 * passavano: nessuna importava quella funzione, e quella che conta le sue CHIAMATE legge
 * il sorgente delle schermate, dove le chiamate c'erano ancora. Mancava la definizione,
 * non l'uso. Se n'e' accorto un browser aperto a mano.
 *
 * Qui si legge chi importa da `config/quadri.js` e si controlla che ogni nome importato
 * esista davvero nel modulo. Costa niente e copre l'intera famiglia, non solo questo caso.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import * as moduloQuadri from '../src/config/quadri.js';

function tuttiISorgenti(cartella) {
  return readdirSync(cartella).flatMap((nome) => {
    const strada = `${cartella}/${nome}`;
    if (statSync(strada).isDirectory()) return tuttiISorgenti(strada);
    return /\.(js|jsx|mjs)$/.test(nome) ? [strada] : [];
  });
}

describe('il file generato dei Quadri', () => {
  const radice = new URL('../src', import.meta.url).pathname;
  const sorgenti = tuttiISorgenti(radice);

  it('trova davvero chi lo importa (la prova non deve passare a vuoto)', () => {
    const quanti = sorgenti.filter((f) => readFileSync(f, 'utf8').includes('config/quadri.js')).length;
    expect(quanti).toBeGreaterThanOrEqual(3);
  });

  it('esporta ogni nome che l app gli chiede', () => {
    const mancanti = [];
    for (const file of sorgenti) {
      const testo = readFileSync(file, 'utf8');
      for (const m of testo.matchAll(/import\s*\{([^}]*)\}\s*from\s*'[^']*config\/quadri\.js'/g)) {
        for (const pezzo of m[1].split(',')) {
          const nome = pezzo.trim().split(/\s+as\s+/)[0].trim();
          if (!nome) continue;
          if (!(nome in moduloQuadri)) {
            mancanti.push(`${file.replace(radice, 'src')} importa ${nome}, che il file generato non esporta`);
          }
        }
      }
    }
    expect(mancanti.join('\n')).toBe('');
  });
});
