import { describe, it, expect } from 'vitest';
import { incitamento, AFFANNO, RESPIRO, TRAGUARDI_CATENA } from '../src/core/incitamenti.js';
import { annullabile, createGame, placePiece } from '../src/core/engine.js';
import { chooseMove, createRng } from '../src/sim/player.mjs';
import { CHAIN_MAX } from '../src/config/rules.js';
import italiano from '../src/i18n/it.js';
import inglese from '../src/i18n/en.js';

/** Una mossa finta, con i soli campi che la scelta del messaggio legge davvero. */
function mossa(extra = {}) {
  return {
    groups: [{ type: 'row' }],
    tier: 'buona',
    chainBefore: 0,
    chainAfter: 1,
    catenaMigliorePrima: 0,
    boardCleared: false,
    fillBefore: 0.2,
    fillAfter: 0.12,
    ...extra,
  };
}

describe('scelta del messaggio di incitamento', () => {
  it('una mossa che non elimina niente non dice niente', () => {
    expect(incitamento(mossa({ groups: [] }))).toBeNull();
    expect(incitamento(null)).toBeNull();
  });

  it('la griglia svuotata batte qualunque altra cosa', () => {
    // E' il colpo piu' raro del gioco: 1 ogni 5.017 mosse sul simulatore. Se un
    // messaggio piu' comune glielo rubasse, il giocatore non lo vedrebbe mai.
    const tutto = mossa({
      boardCleared: true, tier: 'perfetta', chainBefore: 8, chainAfter: CHAIN_MAX,
      fillBefore: 0.8, fillAfter: 0,
    });
    expect(incitamento(tutto).categoria).toBe('svuotata');
  });

  it('la Catena al massimo si dice una volta per partita, non a ogni risalita', () => {
    // La Catena tocca il tetto, cala di un livello alla prima mossa a vuoto e risale
    // subito. Festeggiare ogni rientro voleva dire, misurato, una volta ogni 21 mosse.
    const primaVolta = mossa({ chainBefore: 8, chainAfter: CHAIN_MAX, catenaMigliorePrima: 8 });
    expect(incitamento(primaVolta).categoria).toBe('catenaMassima');

    const rientro = mossa({ chainBefore: 8, chainAfter: CHAIN_MAX, catenaMigliorePrima: CHAIN_MAX });
    expect(incitamento(rientro).categoria).not.toBe('catenaMassima');
  });

  it('lo stesso vale per i traguardi intermedi della Catena', () => {
    const soglia = TRAGUARDI_CATENA[0];
    const arrivo = mossa({ chainBefore: soglia - 1, chainAfter: soglia, catenaMigliorePrima: soglia - 1 });
    expect(incitamento(arrivo).categoria).toBe('catena');
    expect(incitamento(arrivo).catena).toBe(soglia);

    const ripassaggio = mossa({ chainBefore: soglia - 1, chainAfter: soglia, catenaMigliorePrima: CHAIN_MAX });
    expect(incitamento(ripassaggio).categoria).not.toBe('catena');
  });

  it('il recupero chiede sia la griglia in affanno sia il respiro', () => {
    const salvato = mossa({ fillBefore: AFFANNO + 0.05, fillAfter: AFFANNO + 0.05 - RESPIRO });
    expect(incitamento(salvato).categoria).toBe('recupero');

    // Griglia piena ma la mossa libera poco: non e' un recupero, e dirlo lo stesso
    // sarebbe un elogio gratuito, cioe' il tipo che insegna a ignorare gli elogi.
    const respiroCorto = mossa({ fillBefore: AFFANNO + 0.05, fillAfter: AFFANNO + 0.04 });
    expect(incitamento(respiroCorto).categoria).not.toBe('recupero');

    // Tanto spazio liberato ma la griglia era vuota: non c'era niente da cui salvarsi.
    const grigliaLarga = mossa({ fillBefore: AFFANNO - 0.15, fillAfter: AFFANNO - 0.15 - RESPIRO });
    expect(incitamento(grigliaLarga).categoria).not.toBe('recupero');
  });

  it('ogni categoria decisa ha delle frasi in tutte e due le lingue', () => {
    // Senza questo controllo una categoria nuova arriva in partita e il giocatore
    // legge la chiave al posto della frase.
    const categorie = new Set();
    const rng = createRng(9);
    for (let p = 0; p < 40; p += 1) {
      let s = createGame({ seed: 700 + p });
      while (s.status === 'playing' && s.stats.moves < 300) {
        const m = chooseMove(s, 'normale', rng);
        if (!m) break;
        s = placePiece(s, m.handIndex, m.row, m.col);
        const premio = incitamento(s.lastMove);
        if (premio) categorie.add(premio.categoria);
      }
    }
    expect(categorie.size).toBeGreaterThan(3);
    for (const categoria of categorie) {
      expect(Array.isArray(italiano.incita[categoria]), `it: ${categoria}`).toBe(true);
      expect(italiano.incita[categoria].length, `it: ${categoria}`).toBeGreaterThan(0);
      expect(inglese.incita[categoria].length, `en: ${categoria}`).toBe(italiano.incita[categoria].length);
    }
  });

  it('le categorie frequenti hanno abbastanza frasi da non annoiare', () => {
    /**
     * QUANTE FRASI SERVONO DIPENDE DA QUANTO SPESSO ESCONO, e i numeri vengono dal
     * simulatore: in una partita da 240 mosse la "buona" compare 39 volte, la "ottima"
     * 33, la "eccellente" 10, e tutte le altre meno di due.
     *
     * Con il sacchetto (src/feel/sacchetto.js) si estrae senza rimettere dentro, quindi
     * escono tutte prima che una torni: il numero di frasi decide QUANTE se ne sentono
     * di diverse in una partita, non se ci sono doppioni attaccati. Sotto queste soglie
     * la stessa frase tornerebbe piu' volte nella stessa partita, ed e' esattamente il
     * punto in cui un complimento diventa un tic.
     *
     * Questo test esiste perche' ridurre un elenco di testi sembra sempre innocuo.
     */
    const MINIME = {
      buona: 24,          // 39 messaggi a partita
      ottima: 20,         // 33
      eccellente: 10,     // 10
      perfetta: 6,        // meno di 1
      catenaMassima: 4,
      catena: 4,
      recupero: 6,        // fino a 5 a partita per chi fatica
      svuotata: 4,
    };
    for (const [categoria, minimo] of Object.entries(MINIME)) {
      expect(italiano.incita[categoria]?.length, `it: ${categoria}`).toBeGreaterThanOrEqual(minimo);
      expect(inglese.incita[categoria]?.length, `en: ${categoria}`).toBeGreaterThanOrEqual(minimo);
    }
  });

  it('nessuna frase e cosi lunga da non entrare sulla plancia', () => {
    // Stanno dentro un riquadro largo al massimo il 92% della plancia. Una frase molto
    // lunga va a capo tre volte e copre mezza griglia proprio mentre si cerca dove
    // mettere il pezzo dopo. Il limite e' sui caratteri perche' e' l'unica misura
    // disponibile senza browser; il controllo vero, in pixel, e' in e2e/incitamenti.
    //
    // Si misura la frase COME SI LEGGE, non come e' scritta: `{quanti}` occupa otto
    // caratteri nel sorgente e uno solo a schermo, visto che la Catena si ferma a 9.
    // La prima stesura contava il segnaposto e bocciava una frase che sullo schermo e'
    // fra le piu' corte: un limite misurato sulla cosa sbagliata boccia a caso.
    for (const lingua of [italiano, inglese]) {
      for (const [categoria, frasi] of Object.entries(lingua.incita)) {
        for (const frase of frasi) {
          const letta = frase.replace(/\{quanti\}/g, String(CHAIN_MAX));
          expect(letta.length, `${categoria}: "${letta}"`).toBeLessThanOrEqual(26);
        }
      }
    }
  });

  it('nessuna frase e ripetuta dentro la stessa categoria', () => {
    // Un doppione nell'elenco vale come una frase in meno, e non si nota rileggendo.
    for (const lingua of [italiano, inglese]) {
      for (const [categoria, frasi] of Object.entries(lingua.incita)) {
        expect(new Set(frasi).size, `${categoria}`).toBe(frasi.length);
      }
    }
  });

  it('un incitamento e il "rimetti a posto" non compaiono mai insieme', () => {
    // Si dividono la stessa zona di schermo. L'esclusione e' strutturale -- un
    // incitamento nasce da una mossa che ha eliminato, `annullabile` da una che non
    // ha eliminato -- ma vale la pena verificarla giocando, perche' e' il tipo di
    // invariante che una modifica futura puo' rompere senza accorgersene.
    const rng = createRng(55);
    let scontri = 0;
    let visti = 0;
    for (let p = 0; p < 25; p += 1) {
      let s = createGame({ seed: 40 + p });
      while (s.status === 'playing' && s.stats.moves < 300) {
        const m = chooseMove(s, 'normale', rng);
        if (!m) break;
        const prima = s;
        s = placePiece(s, m.handIndex, m.row, m.col);
        if (incitamento(s.lastMove)) visti += 1;
        if (incitamento(s.lastMove) && annullabile(prima, s)) scontri += 1;
      }
    }
    expect(visti).toBeGreaterThan(100);
    expect(scontri).toBe(0);
  });
});
