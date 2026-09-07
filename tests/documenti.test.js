import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Documenti versionati su localStorage.
 *
 * Due cose vanno provate qui, e nessuna delle due si vede giocando:
 *   1. che i dati scritti dalla versione PRECEDENTE del gioco -- quella senza il campo
 *      `versione` -- continuino a essere letti, migrati e riscritti senza perdere
 *      nulla. Un aggiornamento che azzera i record di chi gioca da mesi e' il danno
 *      peggiore che questo progetto possa fare, perche' non esiste nessuna copia
 *      altrove da cui recuperarli;
 *   2. che uno storage che LANCIA non faccia uscire nessuna eccezione dal modulo di
 *      persistenza. Se salvare un record puo' spegnere la partita in corso, il gioco
 *      punisce chi gioca in navigazione privata o con la quota esaurita.
 */

// localStorage minimale, con un interruttore per farlo fallire come nel mondo reale.
const memoria = new Map();
let esplode = false;
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k) => {
      if (esplode) throw new DOMException('storage non disponibile');
      return memoria.has(k) ? memoria.get(k) : null;
    },
    setItem: (k, v) => {
      if (esplode) throw new DOMException('QuotaExceededError');
      memoria.set(k, String(v));
    },
    removeItem: (k) => { if (esplode) throw new DOMException('no'); memoria.delete(k); },
    key: (i) => [...memoria.keys()][i] ?? null,
    get length() { return memoria.size; },
  },
});

const { leggiDocumento, scriviDocumento } = await import('../src/persistence/documenti.js');
const records = await import('../src/persistence/records.js');
const sfide = await import('../src/persistence/sfide.js');
const progressi = await import('../src/persistence/progressi.js');

const PREDEFINITI = { a: 1, b: 2 };

beforeEach(() => { memoria.clear(); esplode = false; });

describe('leggiDocumento', () => {
  it('senza niente in memoria restituisce i predefiniti timbrati', () => {
    const d = leggiDocumento('prova', { versione: 3, predefiniti: PREDEFINITI });
    expect(d).toEqual({ a: 1, b: 2, versione: 3 });
  });

  it('una forma SENZA versione viene migrata dalla versione 0', () => {
    memoria.set('plinto:prova', JSON.stringify({ a: 9 }));
    const visto = [];
    const d = leggiDocumento('prova', {
      versione: 2,
      predefiniti: PREDEFINITI,
      migra: (dati, da) => { visto.push(da); return { ...dati, b: dati.a * 2 }; },
    });
    expect(visto, 'la migrazione deve sapere che parte dalla forma senza versione').toEqual([0]);
    expect(d).toEqual({ a: 9, b: 18, versione: 2 });
  });

  it('una versione gia corrente non viene migrata', () => {
    memoria.set('plinto:prova', JSON.stringify({ a: 5, versione: 2 }));
    const d = leggiDocumento('prova', {
      versione: 2,
      predefiniti: PREDEFINITI,
      migra: () => { throw new Error('non doveva essere chiamata'); },
    });
    expect(d).toEqual({ a: 5, b: 2, versione: 2 });
  });

  it('un documento scritto da una versione FUTURA non viene ne frainteso ne cancellato', () => {
    // Succede davvero: una scheda rimasta aperta sulla versione vecchia legge quello
    // che ha scritto la nuova. I campi che non conosce devono sopravvivere.
    memoria.set('plinto:prova', JSON.stringify({ a: 7, futuro: 'x', versione: 99 }));
    const d = leggiDocumento('prova', { versione: 2, predefiniti: PREDEFINITI });
    expect(d.futuro).toBe('x');
    expect(d.versione, 'non si finge di aver migrato quello che non si capisce').toBe(99);
  });

  it('un contenuto illeggibile o di tipo sbagliato ricade sui predefiniti', () => {
    memoria.set('plinto:prova', 'non e json');
    expect(leggiDocumento('prova', { versione: 1, predefiniti: PREDEFINITI }).a).toBe(1);
    memoria.set('plinto:prova', JSON.stringify([1, 2, 3]));
    expect(leggiDocumento('prova', { versione: 1, predefiniti: PREDEFINITI }).a).toBe(1);
  });

  it('scriviDocumento timbra la versione e la rilettura la ritrova', () => {
    expect(scriviDocumento('prova', 4, { a: 10 })).toBe(true);
    expect(JSON.parse(memoria.get('plinto:prova'))).toEqual({ a: 10, versione: 4 });
  });
});

describe('migrazione dei dati veri di chi gioca gia', () => {
  it('i record salvati senza versione non si perdono', () => {
    memoria.set('plinto:records', JSON.stringify({ best: 4321, bestChain: 7 }));
    const letti = records.loadRecords();
    expect(letti.best).toBe(4321);
    expect(letti.bestChain).toBe(7);
    expect(letti.versione).toBe(1);
  });

  it('le statistiche di vita salvate senza versione non si perdono', () => {
    memoria.set('plinto:statistiche', JSON.stringify({ partite: 120, punteggioTotale: 900000 }));
    expect(records.loadStats().partite).toBe(120);
    expect(records.loadStats().punteggioTotale).toBe(900000);
  });

  it('le sfide passano dalla mappa nuda al contenitore senza perdere un giorno', () => {
    memoria.set('plinto:sfide', JSON.stringify({
      '2026-09-05': { best: 100, partite: 1 },
      '2026-09-06': { best: 250, partite: 3 },
    }));
    expect(sfide.sfidaDelGiorno('2026-09-06').best).toBe(250);
    expect(sfide.storicoSfide().map((s) => s.giorno)).toEqual(['2026-09-06', '2026-09-05']);
    // E soprattutto: "versione" non deve diventare un giorno giocato.
    sfide.registraSfida(999, '2026-09-07');
    expect(Object.keys(sfide.caricaSfide()).sort())
      .toEqual(['2026-09-05', '2026-09-06', '2026-09-07']);
  });

  it('i livelli passano dalla mappa nuda al contenitore e il conteggio resta giusto', () => {
    memoria.set('plinto:quadri', JSON.stringify({
      1: { mosse: 8, punteggio: 400, tentativi: 2 },
      2: { mosse: 11, punteggio: 620, tentativi: 1 },
    }));
    expect(progressi.quantiSuperati(), 'la versione non deve contare come un livello').toBe(2);
    expect(progressi.quadroSuperato(2)).toBe(true);
    expect(progressi.quadroSbloccato(3)).toBe(true);
    progressi.registraTentativo(3, { superato: true, mosse: 9, punteggio: 500 });
    expect(progressi.quantiSuperati()).toBe(3);
    expect(Object.keys(progressi.caricaProgressi()).sort()).toEqual(['1', '2', '3']);
  });

  it('una volta riscritti, i documenti portano la versione', () => {
    memoria.set('plinto:quadri', JSON.stringify({ 1: { mosse: 8, punteggio: 400, tentativi: 1 } }));
    progressi.registraTentativo(2, { superato: true, mosse: 7, punteggio: 300 });
    const salvato = JSON.parse(memoria.get('plinto:quadri'));
    expect(salvato.versione).toBe(1);
    expect(Object.keys(salvato.livelli).sort()).toEqual(['1', '2']);
  });
});

describe('storage che fallisce', () => {
  it('nessuna eccezione esce dal modulo, in lettura o in scrittura', () => {
    esplode = true;
    expect(() => leggiDocumento('prova', { versione: 1, predefiniti: PREDEFINITI })).not.toThrow();
    expect(() => scriviDocumento('prova', 1, { a: 1 })).not.toThrow();
    expect(scriviDocumento('prova', 1, { a: 1 }), 'la scrittura fallita deve DIRLO').toBe(false);
  });

  it('con lo storage rotto il gioco continua a funzionare con i valori predefiniti', () => {
    esplode = true;
    expect(() => records.loadRecords()).not.toThrow();
    expect(records.loadRecords().best).toBe(0);
    expect(() => records.recordGame({
      score: 10, moves: 3, durationMs: 1000, clearedGroups: 1,
      bestChain: 1, bestMovePoints: 10, bestIntreccio: 1, boardClears: 0,
    })).not.toThrow();
    expect(() => progressi.registraTentativo(1, { superato: true, mosse: 5, punteggio: 100 }))
      .not.toThrow();
    expect(() => sfide.registraSfida(500, '2026-09-06')).not.toThrow();
  });
});
