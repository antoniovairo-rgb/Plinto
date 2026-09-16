import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
// Attenzione: NON importarle come `it`/`en`: `it` collide con la funzione di test.
import italiano from '../src/i18n/it.js';
import inglese from '../src/i18n/en.js';
import {
  formattaScheda, formattaSchedaQuadro, formattaSchedaPercorso, collegamentoScheda,
  formaPartita, serieDaIstogramma, LIMITE, COLONNE_FORMA, RIGA_DISEGNATA,
} from '../src/core/scheda.js';
import { CHAIN_MAX } from '../src/config/rules.js';
import { createGame, placePiece, summarize } from '../src/core/engine.js';
import { allPlacements } from '../src/core/grid.js';

/**
 * La scheda condivisibile.
 *
 * E' un testo, quindi sembra che non ci sia niente da provare. Le cose che si possono
 * sbagliare, e che qui vengono controllate, sono tre: superare il limite e farsi tagliare
 * proprio il collegamento; far comparire uno spoiler; e produrre "undefined" o "NaN"
 * dentro un messaggio che poi qualcuno manda agli amici.
 */

const TESTI = {
  gioco: 'PLINTO',
  sfidaDel: 'Sfida del',
  partitaLibera: 'Partita libera',
  punti: 'punti',
  mosse: 'mosse',
  catenaMax: 'Catena max',
  intrecciMax: 'Intreccio max',
  righe: 'Righe',
  colonne: 'Colonne',
  quadranti: 'Quadranti',
  mossaMigliore: 'Mossa migliore',
  separatoreMigliaia: '.',
};

/** Una partita vera, per non provare la scheda su numeri inventati. */
function partitaVera(seed, mosseMax = 400) {
  let s = createGame({ seed, now: 0 });
  let t = 0;
  while (s.status === 'playing' && s.stats.moves < mosseMax) {
    const mosse = [];
    s.hand.forEach((p, i) => {
      if (p) allPlacements(s.grid, p.shape).forEach(([r, c]) => mosse.push([i, r, c]));
    });
    if (mosse.length === 0) break;
    t += 500;
    s = placePiece(s, ...mosse[0], t);
  }
  return summarize(s, t);
}

describe('la forma della partita', () => {
  it('ha al massimo sedici colonne, e meno se la partita e stata corta', () => {
    expect(formaPartita(new Array(100).fill(0))).toHaveLength(COLONNE_FORMA);
    expect(formaPartita([0, 1, 2])).toHaveLength(3);
    expect(formaPartita([5])).toHaveLength(1);
  });

  it('non disegna niente quando non c e niente da disegnare', () => {
    expect(formaPartita([])).toBe('');
    expect(formaPartita(null)).toBe('');
    expect(formaPartita(undefined)).toBe('');
  });

  it('una Catena sempre a zero e piatta in basso, una al massimo e piatta in alto', () => {
    expect(formaPartita(new Array(20).fill(0))).toBe('▁'.repeat(COLONNE_FORMA));
    expect(formaPartita(new Array(20).fill(CHAIN_MAX))).toBe('█'.repeat(COLONNE_FORMA));
  });

  it('un picco non viene cancellato dalla media', () => {
    // Una salita in mezzo a una partita piatta e' un momento della partita: se la
    // colonna facesse la media, sparirebbe proprio mentre si cerca di raccontarla.
    const serie = new Array(32).fill(0);
    serie[16] = CHAIN_MAX;
    const forma = formaPartita(serie);
    expect(forma).toContain('█');
  });

  it('usa solo i blocchi previsti', () => {
    const forma = formaPartita(Array.from({ length: 50 }, (_, i) => i % (CHAIN_MAX + 1)));
    expect(forma).toMatch(/^[▁▂▃▄▅▆▇█]+$/u);
  });

  it('da un istogramma si ricava una serie ordinata, non una inventata', () => {
    expect(serieDaIstogramma([2, 0, 1])).toEqual([0, 0, 2]);
    expect(serieDaIstogramma(null)).toEqual([]);
  });
});

describe('formattaScheda', () => {
  it('sta sempre sotto il limite, anche con numeri enormi', () => {
    const testo = formattaScheda({
      score: 9876543, moves: 999999, bestChain: 9, bestIntreccio: 10,
      clearedRows: 12345, clearedCols: 12345, clearedQuadrants: 12345,
      bestMovePoints: 1234567,
      istogrammaCatena: new Array(CHAIN_MAX + 1).fill(50),
    }, {
      testi: TESTI,
      giorno: '2026-09-12',
      indirizzo: 'https://antoniovairo-rgb.github.io/Plinto/#/sfida/2026-09-12',
    });
    expect(testo.length).toBeLessThanOrEqual(LIMITE);
  });

  it('il collegamento c e sempre, ed e l ultima riga', () => {
    const indirizzo = 'https://antoniovairo-rgb.github.io/Plinto/#/sfida/2026-09-12';
    const testo = formattaScheda(partitaVera(5), { testi: TESTI, giorno: '2026-09-12', indirizzo });
    expect(testo.split('\n').at(-1)).toBe(indirizzo);
  });

  it('NON contiene spoiler: ne la sequenza dei pezzi ne la griglia', () => {
    const riepilogo = partitaVera(9);
    const testo = formattaScheda(riepilogo, { testi: TESTI, giorno: '2026-09-12' });
    // Gli identificativi delle forme (b33, h5, v3...) non devono comparire da nessuna
    // parte: chi riceve il messaggio deve poter giocare la stessa sfida senza sapere
    // gia' che cosa arriva.
    expect(testo).not.toMatch(/\b[bhvpd]\d{1,2}\b/);
    expect(testo).not.toContain('#');
    expect(testo).not.toMatch(/mappaAppoggi|grid|griglia/i);
  });

  it('nessun parametro di provenienza nell indirizzo', () => {
    const testo = formattaScheda(partitaVera(4), {
      testi: TESTI,
      indirizzo: 'https://antoniovairo-rgb.github.io/Plinto/#/sfida/2026-09-12',
    });
    expect(testo).not.toMatch(/[?&](utm_|ref=|from=|src=)/i);
  });

  it('mai "undefined", "NaN" o "null" in un messaggio che poi si manda', () => {
    for (const riepilogo of [{}, undefined, { score: NaN, moves: undefined }]) {
      const testo = formattaScheda(riepilogo, { testi: TESTI });
      expect(testo).not.toMatch(/undefined|NaN|null/);
    }
  });

  it('una partita vuota produce comunque un testo leggibile', () => {
    const testo = formattaScheda({ score: 0, moves: 0 }, { testi: TESTI });
    expect(testo.split('\n').length).toBeGreaterThanOrEqual(4);
    expect(testo).toContain('0 punti');
  });

  it('la partita libera non dichiara un giorno che non ha', () => {
    const libera = formattaScheda(partitaVera(6), { testi: TESTI });
    expect(libera).toContain('Partita libera');
    expect(libera).not.toContain('Sfida del');
  });

  it('una durata sopra l ora non compare: la scheda non parla di tempo', () => {
    // Scelta dichiarata: il tempo non e' una misura di bravura in un gioco senza timer,
    // e metterlo suggerirebbe che lo sia.
    const testo = formattaScheda({ ...partitaVera(8), durationMs: 5_400_000 }, { testi: TESTI });
    expect(testo).not.toMatch(/\d+\s*(h|min|ora|ore)/i);
  });

  it('ogni dato della riga di blocchi esiste anche a parole', () => {
    // La riga di blocchi e' decorativa: chi non la vede -- lettore di schermo, font che
    // la disallinea -- non deve perdere nessuna informazione.
    const riepilogo = partitaVera(12);
    const testo = formattaScheda(riepilogo, { testi: TESTI });
    const senzaBlocchi = testo.replace(/[▁▂▃▄▅▆▇█]/gu, '');
    expect(senzaBlocchi).toContain(`Catena max ${riepilogo.bestChain}`);
  });

  it('sei righe piu il collegamento, nell ordine dichiarato', () => {
    const righe = formattaScheda(partitaVera(13), {
      testi: TESTI, giorno: '2026-09-12', indirizzo: 'https://esempio/x',
    }).split('\n');
    expect(righe).toHaveLength(7);
    expect(righe[0]).toContain('PLINTO');
    expect(righe[1]).toContain('punti');
    expect(righe[2]).toContain('Catena max');
    expect(righe[3]).toContain('Righe');
    expect(righe[4]).toContain('Mossa migliore');
    expect(righe[5]).toMatch(/^[▁▂▃▄▅▆▇█]+$/u);
  });

  it('la forma viene dalla serie vera quando c e, non dall istogramma', () => {
    const serie = [0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 9, 9, 9, 9, 9];
    const conSerie = formattaScheda({ score: 1, moves: 16 }, { testi: TESTI, serie });
    // Con la serie: prima bassa, poi alta. Dall'istogramma ordinato uscirebbe uguale
    // solo per caso, e qui il caso e' escluso perche' l'istogramma non c'e' affatto.
    const riga = conSerie.split('\n').find((r) => /^[▁▂▃▄▅▆▇█]+$/u.test(r));
    expect(riga.startsWith('▁')).toBe(true);
    expect(riga.endsWith('█')).toBe(true);
  });
});

describe('la scheda di un livello', () => {
  const TESTI = {
    gioco: 'PLINTO',
    livello: 'Livello {n}',
    superatoIn: 'Superato in {mosse} mosse',
    record: 'record personale',
    percorso: 'Percorso {fatti} di {totale}',
  };
  const DATI = { numero: 47, obiettivo: 'Fai 3 Intrecci', mosse: 22, superati: 47, totale: 100 };

  it('racconta le mosse, non i punti', () => {
    // Nel percorso il punteggio non distingue nessuno: due giocatori che superano il
    // quadro 47 hanno fatto la stessa cosa, e li separa in quante mosse ci sono
    // riusciti. Se un giorno qui ricomparissero i punti, questa prova lo direbbe.
    const testo = formattaSchedaQuadro(DATI, { testi: TESTI });
    expect(testo).toContain('Livello 47');
    expect(testo).toContain('Fai 3 Intrecci');
    expect(testo).toContain('Superato in 22 mosse');
    expect(testo).toContain('Percorso 47 di 100');
    expect(testo).not.toContain('punti');
  });

  it('il record personale si dice solo quando c e', () => {
    expect(formattaSchedaQuadro(DATI, { testi: TESTI })).not.toContain('record personale');
    expect(formattaSchedaQuadro({ ...DATI, record: true }, { testi: TESTI }))
      .toContain('record personale');
  });

  it('non supera mai il limite delle applicazioni di messaggistica', () => {
    // Il caso peggiore possibile: obiettivo lunghissimo e collegamento lungo. Se si
    // sfora, l'applicazione taglia la fine -- cioe' proprio il collegamento, l'unica
    // riga che serve a chi riceve.
    const testo = formattaSchedaQuadro(
      { ...DATI, obiettivo: 'x'.repeat(300), record: true },
      { testi: TESTI, indirizzo: `https://esempio.example/${'y'.repeat(80)}`, serie: [1, 2, 3] },
    );
    expect(testo.length).toBeLessThanOrEqual(LIMITE);
  });

  it('senza serie della Catena non inventa una riga di blocchi', () => {
    const righe = formattaSchedaQuadro(DATI, { testi: TESTI }).split('\n');
    expect(righe.some((r) => /^[▁▂▃▄▅▆▇█]+$/u.test(r))).toBe(false);
  });
});

describe('la scheda del percorso', () => {
  const TESTI = {
    gioco: 'PLINTO',
    percorsoTitolo: 'Il percorso',
    livelliSu: '{fatti} livelli su {totale}',
  };

  it('la barra e lunga COLONNE_FORMA e si riempie in proporzione', () => {
    const meta = formattaSchedaPercorso({ superati: 50, totale: 100 }, { testi: TESTI })
      .split('\n').find((r) => /^[■□]+$/u.test(r));
    expect(meta).toHaveLength(COLONNE_FORMA);
    expect([...meta].filter((c) => c === '■')).toHaveLength(COLONNE_FORMA / 2);
  });

  it('a zero la barra e vuota, a percorso finito e piena', () => {
    const riga = (s, tot) => formattaSchedaPercorso({ superati: s, totale: tot }, { testi: TESTI })
      .split('\n').find((r) => /^[■□]+$/u.test(r));
    expect(riga(0, 100)).toBe('□'.repeat(COLONNE_FORMA));
    expect(riga(100, 100)).toBe('■'.repeat(COLONNE_FORMA));
  });

  it('piu livelli superati del totale non fanno traboccare la barra', () => {
    // Non dovrebbe succedere, ma se il totale cambiasse fra una versione e l'altra i
    // progressi salvati potrebbero superarlo, e una barra piu' lunga della sua cornice
    // sarebbe l'unico segno visibile di un dato incoerente.
    const riga = formattaSchedaPercorso({ superati: 250, totale: 100 }, { testi: TESTI })
      .split('\n').find((r) => /^[■□]+$/u.test(r));
    expect(riga).toHaveLength(COLONNE_FORMA);
  });

  it('un totale a zero non divide per zero', () => {
    expect(() => formattaSchedaPercorso({ superati: 0, totale: 0 }, { testi: TESTI })).not.toThrow();
  });
});

describe('il collegamento in fondo alla scheda', () => {
  const SITO = 'https://esempio.example/plinto/';
  const PLAY = 'https://play.google.com/store/apps/details?id=io.github.esempio.plinto';

  it('la sfida del giorno porta SEMPRE il giorno, anche col Play Store configurato', () => {
    // E' la prova piu' importante di questo file. Il collegamento di una sfida non
    // serve a far scaricare il gioco: serve a far giocare a chi lo riceve la STESSA
    // partita, e il giorno e' l'unico dato che glielo permette. Sostituirlo con un
    // indirizzo dello store non peggiora la condivisione, cancella la funzione -- e
    // non se ne accorgerebbe nessuno, perche' la scheda continuerebbe a comparire.
    const link = collegamentoScheda({ base: SITO, giorno: '2026-09-12', play: PLAY });
    expect(link).toBe(`${SITO}#/sfida/2026-09-12`);
    expect(link).not.toContain('play.google.com');
  });

  it('tutto il resto preferisce il Play Store', () => {
    expect(collegamentoScheda({ base: SITO, play: PLAY })).toBe(PLAY);
  });

  it('senza Play Store si ricade sul sito', () => {
    // E' il caso di oggi finche' la scheda sullo store non e' pubblica, e deve
    // funzionare: meglio il sito che un collegamento vuoto.
    expect(collegamentoScheda({ base: SITO, play: '' })).toBe(SITO);
    expect(collegamentoScheda({ base: SITO })).toBe(SITO);
  });

  it('senza sito e senza store non inventa un indirizzo', () => {
    expect(collegamentoScheda({})).toBe('');
  });

  it('usa la funzione dell ancora quando gliela si passa', () => {
    const link = collegamentoScheda({
      base: SITO, giorno: '2026-01-02', play: PLAY, ancora: (g) => `#/x/${g}`,
    });
    expect(link).toBe(`${SITO}#/x/2026-01-02`);
  });
});

describe('le righe disegnate della scheda', () => {
  it('riconosce sia la forma della partita sia la barra del percorso', () => {
    // Chi mostra la scheda a schermo le nasconde a chi ascolta, perche' ripetono in
    // simboli quello che le righe sopra dicono a parole. Quando la barra e' passata dai
    // blocchi pieni ai quadrati questo elenco viveva dentro il componente e sarebbe
    // rimasto indietro: la riga avrebbe continuato a comparire uguale, e l'unico a
    // notarlo sarebbe stato qualcuno che il gioco lo ascolta invece di guardarlo.
    expect(RIGA_DISEGNATA.test('▂▃▅█▃▂')).toBe(true);
    expect(RIGA_DISEGNATA.test('■■■■□□□□□□□□□□□□')).toBe(true);
    expect(RIGA_DISEGNATA.test('□'.repeat(16))).toBe(true);
    // Una frase non e' un disegno, e non va nascosta a nessuno.
    expect(RIGA_DISEGNATA.test('23 livelli su 100')).toBe(false);
    expect(RIGA_DISEGNATA.test('PLINTO — Il percorso')).toBe(false);
    expect(RIGA_DISEGNATA.test('')).toBe(false);
  });
});

/**
 * LE DUE SCHEDE DEVONO NOMINARE L'OPERA, E DEVONO FARLO TUTTE E DUE.
 *
 * I cento livelli hanno un nome -- il Ponte -- ed e' meta' del motivo per cui esiste un
 * gruppo: si sta costruendo qualcosa. "Percorso 76 di 100" non dice a chi riceve il
 * messaggio DI CHE COSA sono quei livelli.
 *
 * Questa prova esiste perche' il difetto e' gia' capitato nella forma peggiore: le schede
 * sono due -- quella presa dalla mappa e quella di fine livello -- ne ho sistemata una
 * sola, e l'altra ha continuato a dire "Percorso" per un giorno intero. Due posti che
 * devono dire la stessa cosa sono due posti di cui uno invecchia.
 */
describe('le schede nominano l opera', () => {
  /* Il codice senza i commenti: la prova qui sotto vieta il nome scritto a mano, e il
     commento che SPIEGA perche' non va scritto a mano lo contiene alla lettera. Una
     prova che costringe a cancellare la spiegazione per passare peggiora il codice. */
  const sorgente = readFileSync(new URL('../src/ui/Condividi.jsx', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  it('la riga del percorso ha un posto per il nome dell opera, in tutte e due le lingue', () => {
    for (const [lingua, testi] of [['it', italiano], ['en', inglese]]) {
      expect(testi.scheda.percorso, `${lingua}: la riga del percorso non nomina l opera`)
        .toContain('{opera}');
    }
  });

  it('tutte e due le schede chiedono il nome a OPERE invece di scriverlo', () => {
    // Due chiamate: una per la scheda di fine livello, una per quella dalla mappa.
    const chiamate = sorgente.match(/operaDelQuadro\(/g) ?? [];
    expect(chiamate).toHaveLength(2);
    // E nessuna delle due deve avere il nome scritto a mano: quando arrivera' la Torre,
    // le schede lo devono dire da sole.
    expect(sorgente).not.toMatch(/'Il Ponte'|"Il Ponte"/);
  });
});
