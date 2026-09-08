import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QUADRI, quadroNumero, TOTALE_QUADRI } from '../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro, semeDelQuadro, OBIETTIVI, MODALITA_QUADRI } from '../src/core/quadro.js';
import { gridFromString, findCompletedGroups, filledCount, allPlacements, placeShape } from '../src/core/grid.js';
import { createGame } from '../src/core/engine.js';
import { traduttore, LINGUE } from '../src/i18n/index.js';
import { celleDa } from '../src/ui/MiniGriglia.jsx';
import { descriviObiettivo } from '../src/ui/schermate/Quadri.jsx';
import { GRID_SIZE, MODALITA, HAND_SIZE } from '../src/config/rules.js';
import { MODALITA_TARATURA } from '../src/config/quadri.js';

const memoria = new Map();
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
    setItem: (k, v) => memoria.set(k, String(v)),
    removeItem: (k) => memoria.delete(k),
    key: (i) => [...memoria.keys()][i] ?? null,
    get length() { return memoria.size; },
  },
});
const progressi = await import('../src/persistence/progressi.js');

describe('definizione dei Quadri', () => {
  it('la numerazione e progressiva e senza buchi', () => {
    QUADRI.forEach((q, i) => expect(q.numero).toBe(i + 1));
    expect(TOTALE_QUADRI).toBe(QUADRI.length);
  });

  it('ogni Quadro ha almeno un obiettivo, e di un tipo che il motore conosce', () => {
    QUADRI.forEach((q) => {
      expect(q.obiettivi.length, `quadro ${q.numero}`).toBeGreaterThan(0);
      q.obiettivi.forEach((o) => {
        expect(OBIETTIVI[o.tipo], `quadro ${q.numero}: obiettivo ${o.tipo}`).toBeDefined();
        expect(o.quanti).toBeGreaterThan(0);
      });
    });
  });

  it('ogni nome di Quadro e unico', () => {
    const nomi = QUADRI.map((q) => q.nome);
    expect(new Set(nomi).size).toBe(nomi.length);
  });

  it('le griglie iniziali sono 9x9 e ben formate', () => {
    QUADRI.filter((q) => q.griglia).forEach((q) => {
      const righe = q.griglia.split('\n');
      expect(righe, `quadro ${q.numero}`).toHaveLength(9);
      righe.forEach((r) => expect(r, `quadro ${q.numero}`).toHaveLength(9));
    });
  });

  it('NESSUNA griglia iniziale contiene un gruppo gia completo', () => {
    // Se ci fosse, si eliminerebbe alla prima mossa regalando punti e falsando
    // l'obiettivo. Sei griglie su diciotto avevano questo difetto alla prima stesura.
    QUADRI.filter((q) => q.griglia).forEach((q) => {
      const gruppi = findCompletedGroups(gridFromString(q.griglia, 3));
      expect(gruppi, `quadro ${q.numero} (${q.nome})`).toHaveLength(0);
    });
  });

  it('nessuna griglia iniziale riempie piu di due terzi della plancia', () => {
    // Oltre quella soglia non resta abbastanza spazio per giocare.
    QUADRI.filter((q) => q.griglia).forEach((q) => {
      expect(filledCount(gridFromString(q.griglia, 3)), `quadro ${q.numero}`).toBeLessThan(54);
    });
  });

  it('ogni Quadro parte con almeno un pezzo piazzabile', () => {
    QUADRI.forEach((q) => {
      const partita = iniziaQuadro(q, { now: 0 });
      const giocabile = partita.hand.some((p) => p && allPlacements(partita.grid, p.shape).length > 0);
      expect(giocabile, `quadro ${q.numero} (${q.nome}) parte gia bloccato`).toBe(true);
    });
  });
});

describe('i Quadri si giocano vedendo la terna successiva', () => {
  it('ogni livello si apre con l anteprima, senza che nessuno debba chiederla', () => {
    // Non e' un'opzione e non e' una preferenza: e' come funziona il percorso. Se un
    // giorno qualcuno la rendesse facoltativa, i cento bersagli tarati in una modalita'
    // verrebbero giocati nell'altra.
    for (const numero of [1, 25, 50, 75, 100]) {
      const partita = iniziaQuadro(quadroNumero(numero), { now: 0 });
      expect(partita.modalita, `quadro ${numero}`).toBe(MODALITA.ANTEPRIMA);
      expect(partita.manoSuccessiva, `quadro ${numero}`).toHaveLength(HAND_SIZE);
    }
  });

  it('i bersagli sono stati tarati NELLA modalita in cui si gioca', () => {
    // Il difetto peggiore possibile qui non e' un bersaglio sbagliato: e' un bersaglio
    // misurato su una partita che non esiste. Vedere avanti cambia l'ordine in cui il
    // generatore legge la griglia, quindi lo stesso seme produce un'altra partita:
    // otto livelli su cento cambiano completamente esito fra le due modalita'.
    // `MODALITA_TARATURA` la scrive il generatore di src/config/quadri.js con la
    // modalita' che ha davvero usato; qui si controlla che sia quella giocata.
    expect(MODALITA_TARATURA).toBe(MODALITA_QUADRI);
  });

  it('la partita libera invece resta senza', () => {
    // La' non c'e' niente da risolvere: non sapere cosa arriva e' parte di cosa la
    // rende una partita libera.
    expect(createGame({ seed: 'libera' }).modalita).toBe(MODALITA.BASE);
  });
});

describe('svolgimento di un Quadro', () => {
  it('lo stesso Quadro parte sempre dallo stesso problema', () => {
    const a = iniziaQuadro(quadroNumero(7), { now: 0 });
    const b = iniziaQuadro(quadroNumero(7), { now: 0 });
    expect(a.hand.map((p) => p.shapeId)).toEqual(b.hand.map((p) => p.shapeId));
    expect(semeDelQuadro(7)).toBe(semeDelQuadro(7));
    expect(semeDelQuadro(7)).not.toBe(semeDelQuadro(8));
  });

  it('lo stato iniziale non e ne vinto ne perso', () => {
    const q = quadroNumero(1);
    const stato = statoQuadro(q, iniziaQuadro(q, { now: 0 }));
    expect(stato.completato).toBe(false);
    expect(stato.fallito).toBe(false);
    expect(stato.finito).toBe(false);
    expect(stato.mosseRimaste).toBe(q.maxMosse);
  });

  it('finire le mosse senza obiettivo significa perdere', () => {
    const q = { numero: 99, nome: 'prova', obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 3 };
    let partita = iniziaQuadro(q, { now: 0 });
    for (let i = 0; i < 3; i += 1) {
      const pezzo = partita.hand.findIndex((p) => p && allPlacements(partita.grid, p.shape).length);
      const [r, c] = allPlacements(partita.grid, partita.hand[pezzo].shape)[0];
      partita = giocaNelQuadro(q, partita, pezzo, r, c, i * 1000);
    }
    const stato = statoQuadro(q, partita);
    expect(stato.mosseRimaste).toBe(0);
    expect(stato.fallito).toBe(true);
    expect(stato.motivo).toBe('mosse');
  });

  it('dopo la fine il Quadro non accetta altre mosse', () => {
    const q = { numero: 98, nome: 'prova', obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 1 };
    let partita = iniziaQuadro(q, { now: 0 });
    const pezzo = partita.hand.findIndex((p) => p && allPlacements(partita.grid, p.shape).length);
    const [r, c] = allPlacements(partita.grid, partita.hand[pezzo].shape)[0];
    partita = giocaNelQuadro(q, partita, pezzo, r, c, 0);
    expect(statoQuadro(q, partita).finito).toBe(true);

    const dopo = giocaNelQuadro(q, partita, 0, 0, 0, 1000);
    expect(dopo, 'la mossa dopo la fine deve essere ignorata').toBe(partita);
  });

  it('vincere con l ultima mossa disponibile e una vittoria, non una sconfitta', () => {
    // L'ordine dei controlli conta: chi raggiunge l'obiettivo esaurendo le mosse ha
    // vinto. Invertendo i controlli si toglierebbe la vittoria a chi ce l'ha fatta.
    const q = { numero: 97, nome: 'prova', obiettivi: [{ tipo: 'sopravvivi', quanti: 2 }], maxMosse: 2 };
    let partita = iniziaQuadro(q, { now: 0 });
    for (let i = 0; i < 2; i += 1) {
      const pezzo = partita.hand.findIndex((p) => p && allPlacements(partita.grid, p.shape).length);
      const [r, c] = allPlacements(partita.grid, partita.hand[pezzo].shape)[0];
      partita = giocaNelQuadro(q, partita, pezzo, r, c, i * 1000);
    }
    const stato = statoQuadro(q, partita);
    expect(stato.mosseRimaste).toBe(0);
    expect(stato.completato).toBe(true);
    expect(stato.fallito).toBe(false);
  });
});

describe('avanzamento nel percorso', () => {
  beforeEach(() => memoria.clear());

  it('solo il primo Quadro e aperto all inizio', () => {
    expect(progressi.quadroSbloccato(1)).toBe(true);
    expect(progressi.quadroSbloccato(2)).toBe(false);
    expect(progressi.prossimoQuadro(TOTALE_QUADRI)).toBe(1);
  });

  it('superare un Quadro apre il successivo', () => {
    progressi.registraTentativo(1, { superato: true, mosse: 9, punteggio: 400 });
    expect(progressi.quadroSuperato(1)).toBe(true);
    expect(progressi.quadroSbloccato(2)).toBe(true);
    expect(progressi.quadroSbloccato(3)).toBe(false);
    expect(progressi.prossimoQuadro(TOTALE_QUADRI)).toBe(2);
  });

  it('un tentativo fallito non sblocca niente', () => {
    progressi.registraTentativo(1, { superato: false, mosse: 12, punteggio: 100 });
    expect(progressi.quadroSuperato(1)).toBe(false);
    expect(progressi.quadroSbloccato(2)).toBe(false);
  });
});

/**
 * La via d'uscita: dopo abbastanza tentativi il livello successivo si apre lo stesso.
 *
 * Un percorso a catena ha un difetto che non si vede finche' non capita: un solo livello
 * che non riesce non rende difficile QUEL livello, chiude tutti quelli dopo. Il generatore
 * garantisce che nessun livello sia imbattibile per il giocatore artificiale, ma quello non
 * e' una persona.
 *
 * Il test che conta di piu' qui non e' che la porta si apra: e' che il gioco NON dica una
 * bugia mentre la apre. Un livello aperto per insistenza resta non superato, senza spunta,
 * fuori dal conteggio. Se lo contasse come vinto, la via d'uscita diventerebbe un premio di
 * consolazione travestito, ed e' peggio di un percorso che si blocca.
 */
describe('la strada non si chiude mai', () => {
  beforeEach(() => memoria.clear());

  const fallisci = (numero, volte) => {
    for (let i = 0; i < volte; i += 1) {
      progressi.registraTentativo(numero, { superato: false, mosse: 12, punteggio: 100 });
    }
  };

  it('prima della soglia il successivo resta chiuso', () => {
    fallisci(1, progressi.TENTATIVI_PER_APRIRE - 1);
    expect(progressi.tentativiDi(1)).toBe(progressi.TENTATIVI_PER_APRIRE - 1);
    expect(progressi.quadroSbloccato(2)).toBe(false);
  });

  it('alla soglia il successivo si apre', () => {
    fallisci(1, progressi.TENTATIVI_PER_APRIRE);
    expect(progressi.quadroSbloccato(2)).toBe(true);
    expect(progressi.apertoPerInsistenza(2)).toBe(true);
  });

  it('ma il livello NON risulta superato, e non entra nel conteggio', () => {
    fallisci(1, progressi.TENTATIVI_PER_APRIRE + 5);
    expect(progressi.quadroSuperato(1), 'un livello aperto per insistenza non e vinto').toBe(false);
    expect(progressi.quantiSuperati(), 'il conteggio dei superati non deve gonfiarsi').toBe(0);
    expect(progressi.prossimoQuadro(TOTALE_QUADRI), 'resta lui il prossimo da superare').toBe(1);
  });

  it('superandolo davvero, l apertura non e piu per insistenza', () => {
    fallisci(1, progressi.TENTATIVI_PER_APRIRE);
    progressi.registraTentativo(1, { superato: true, mosse: 9, punteggio: 400 });
    expect(progressi.quadroSuperato(1)).toBe(true);
    expect(progressi.apertoPerInsistenza(2)).toBe(false);
    expect(progressi.quantiSuperati()).toBe(1);
  });

  it('la home punta avanti, non riporta indietro al livello lasciato', () => {
    // Chi ha scelto di andare oltre non deve vedersi riportare sul livello che ha
    // lasciato a ogni avvio: sarebbe annullargli la scelta in silenzio.
    fallisci(1, progressi.TENTATIVI_PER_APRIRE);
    expect(progressi.prossimoQuadro(TOTALE_QUADRI), 'il primo resta il prossimo da superare').toBe(1);

    progressi.registraTentativo(2, { superato: true, mosse: 9, punteggio: 400 });
    expect(progressi.prossimoQuadro(TOTALE_QUADRI), 'superato il secondo, si va sul terzo').toBe(3);
    expect(progressi.quadroSuperato(1), 'il primo resta non superato').toBe(false);
    expect(progressi.quadroSbloccato(1), 'e resta riprendibile').toBe(true);
  });

  it('la porta si apre di UNO alla volta, non su tutto il resto del percorso', () => {
    fallisci(1, progressi.TENTATIVI_PER_APRIRE);
    expect(progressi.quadroSbloccato(2)).toBe(true);
    expect(progressi.quadroSbloccato(3), 'il terzo non deve aprirsi da solo').toBe(false);
  });

  it('i tentativi si contano anche sul livello mai superato', () => {
    // Prima si tenevano SOLO per i livelli gia' vinti, cioe' proprio quelli che questa
    // via d'uscita non serve ad aprire: il contatore restava a zero per sempre.
    fallisci(7, 3);
    expect(progressi.tentativiDi(7)).toBe(3);
  });

  it('un avanzamento salvato prima che questa via esistesse si legge uguale', () => {
    progressi.registraTentativo(1, { superato: true, mosse: 9, punteggio: 400 });
    expect(progressi.quadroSuperato(1)).toBe(true);
    expect(progressi.quantiSuperati()).toBe(1);
    expect(progressi.quadroSbloccato(2)).toBe(true);
  });
});

describe('avanzamento nel percorso, seguito', () => {
  beforeEach(() => memoria.clear());

  it('conserva il risultato migliore: meno mosse, poi piu punti', () => {
    progressi.registraTentativo(5, { superato: true, mosse: 10, punteggio: 500 });
    progressi.registraTentativo(5, { superato: true, mosse: 12, punteggio: 900 });
    expect(progressi.caricaProgressi()[5].mosse, 'dodici mosse non battono dieci').toBe(10);

    progressi.registraTentativo(5, { superato: true, mosse: 8, punteggio: 100 });
    expect(progressi.caricaProgressi()[5].mosse).toBe(8);

    progressi.registraTentativo(5, { superato: true, mosse: 8, punteggio: 700 });
    expect(progressi.caricaProgressi()[5].punteggio, 'a parita di mosse vince il punteggio').toBe(700);
  });

  it('conta i tentativi, anche quelli falliti', () => {
    progressi.registraTentativo(3, { superato: true, mosse: 5, punteggio: 200 });
    progressi.registraTentativo(3, { superato: false, mosse: 12, punteggio: 50 });
    progressi.registraTentativo(3, { superato: true, mosse: 6, punteggio: 300 });
    expect(progressi.caricaProgressi()[3].tentativi).toBe(3);
  });

  it('segnala la prima volta e i miglioramenti successivi', () => {
    expect(progressi.registraTentativo(2, { superato: true, mosse: 9, punteggio: 1 }).primaVolta).toBe(true);
    expect(progressi.registraTentativo(2, { superato: true, mosse: 7, punteggio: 1 }).miglioramento).toBe(true);
    expect(progressi.registraTentativo(2, { superato: true, mosse: 11, punteggio: 1 }).miglioramento).toBe(false);
  });
});

/**
 * Ogni Quadro apre con Plinto che spiega l'obiettivo.
 *
 * La spiegazione e' costruita a runtime, `t(`quadri.spiegazioni.${tipo}`)`, quindi un
 * tipo di obiettivo senza testo non fa fallire niente: mostra al giocatore la CHIAVE
 * al posto della frase, e la mostra proprio a chi sta imparando le regole. E' un
 * difetto che si vede solo aprendo il Quadro giusto fra cento, cioe' quasi mai in
 * fase di sviluppo. Qui si controllano tutti e cento in un colpo, in tutte le lingue.
 */
describe('apertura dei Quadri', () => {
  const tipiUsati = [...new Set(QUADRI.flatMap((q) => q.obiettivi.map((o) => o.tipo)))];

  it('trova davvero dei tipi di obiettivo (il test non deve passare a vuoto)', () => {
    expect(tipiUsati.length).toBeGreaterThanOrEqual(5);
  });

  it.each(Object.keys(LINGUE))('in %s ogni obiettivo ha spiegazione e consiglio', (lingua) => {
    const t = traduttore(lingua);
    for (const tipo of tipiUsati) {
      for (const gruppo of ['spiegazioni', 'consigli']) {
        const chiave = `quadri.${gruppo}.${tipo}`;
        const testo = t(chiave);
        // Il traduttore restituisce la chiave stessa quando il testo manca.
        expect(testo, `${lingua}: manca ${chiave}`).not.toBe(chiave);
        expect(testo.length, `${lingua}: ${chiave} troppo corto per spiegare qualcosa`)
          .toBeGreaterThan(20);
      }
    }
  });

  it('anche i tipi di obiettivo non ancora usati sono spiegati', () => {
    // OBIETTIVI ne dichiara piu' di quanti il percorso ne usi oggi. Chi ne mettera'
    // uno in un Quadro nuovo non deve scoprire da un giocatore che manca il testo.
    const t = traduttore('it');
    for (const tipo of Object.keys(OBIETTIVI)) {
      expect(t(`quadri.spiegazioni.${tipo}`), `manca la spiegazione di ${tipo}`)
        .not.toBe(`quadri.spiegazioni.${tipo}`);
      expect(t(`quadri.consigli.${tipo}`), `manca il consiglio di ${tipo}`)
        .not.toBe(`quadri.consigli.${tipo}`);
    }
  });
});

/**
 * Il disegno dell'obiettivo.
 *
 * E' l'unica parte della schermata di apertura che spiega SENZA usare parole, ed e'
 * nata perche' le parole non bastavano: al primo livello "Chiudi una riga" non diceva
 * niente a chi non aveva mai visto una riga chiudersi. Proprio per questo una miniatura
 * sbagliata sarebbe peggio di nessuna miniatura: insegnerebbe la regola sbagliata a chi
 * non ha modo di accorgersene.
 *
 * Qui si verifica che la figura corrisponda alla geometria vera del gioco, e che per
 * gli obiettivi che NON sono una forma sulla griglia (punti, Catena) non venga disegnato
 * niente, invece di una figura inventata.
 */
describe('disegno dell obiettivo', () => {
  it('una riga e nove caselle sulla stessa riga', () => {
    const { celle } = celleDa('righe');
    expect(celle).toHaveLength(GRID_SIZE);
    expect(new Set(celle.map((i) => Math.floor(i / GRID_SIZE))).size).toBe(1);
  });

  it('una colonna e nove caselle sulla stessa colonna', () => {
    const { celle } = celleDa('colonne');
    expect(celle).toHaveLength(GRID_SIZE);
    expect(new Set(celle.map((i) => i % GRID_SIZE)).size).toBe(1);
  });

  it('un quadrante e nove caselle dentro un solo riquadro 3x3', () => {
    const { celle } = celleDa('quadranti');
    expect(celle).toHaveLength(GRID_SIZE);
    const riquadri = new Set(celle.map((i) => {
      const r = Math.floor(i / GRID_SIZE);
      const c = i % GRID_SIZE;
      return `${Math.floor(r / 3)}:${Math.floor(c / 3)}`;
    }));
    expect(riquadri.size).toBe(1);
  });

  it('l Intreccio mostra una riga e una colonna che si incrociano', () => {
    const { celle, secondo } = celleDa('intreccio');
    // 9 + 9 - 1 casella in comune: se le due figure non si incrociassero, il disegno
    // spiegherebbe "due gruppi qualsiasi" invece di "due gruppi con una sola mossa".
    expect(celle.length + secondo.length).toBe(GRID_SIZE * 2 - 1);
    const righe = new Set(celle.map((i) => Math.floor(i / GRID_SIZE)));
    const colonne = new Set(secondo.map((i) => i % GRID_SIZE));
    expect(righe.size).toBe(1);
    expect(colonne.size).toBe(1);
  });

  it('la pulizia si illustra con la griglia vuota', () => {
    expect(celleDa('pulizia').celle).toEqual([]);
  });

  it('gli obiettivi che non sono una forma non vengono disegnati affatto', () => {
    // Meglio nessuna figura che una figura inventata: "fai 300 punti" non ha un
    // disegno onesto sulla griglia, e inventarne uno insegnerebbe una cosa falsa.
    for (const tipo of ['punteggio', 'catena', 'celle', 'sopravvivi']) {
      expect(celleDa(tipo), `${tipo} non deve avere un disegno`).toBeNull();
    }
  });

  it('ogni tipo con un disegno ha anche la sua didascalia, in ogni lingua', () => {
    const conDisegno = Object.keys(OBIETTIVI).filter((tipo) => celleDa(tipo) !== null);
    expect(conDisegno.length).toBeGreaterThanOrEqual(4);
    for (const lingua of Object.keys(LINGUE)) {
      const t = traduttore(lingua);
      for (const tipo of conDisegno) {
        const chiave = `quadri.didascalie.${tipo}`;
        expect(t(chiave), `${lingua}: manca ${chiave}`).not.toBe(chiave);
      }
    }
  });

  it('ogni cella disegnata sta dentro la griglia', () => {
    for (const tipo of Object.keys(OBIETTIVI)) {
      const forma = celleDa(tipo);
      if (!forma) continue;
      for (const i of [...forma.celle, ...(forma.secondo ?? [])]) {
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(GRID_SIZE * GRID_SIZE);
      }
    }
  });
});

/**
 * La sconfitta di un livello.
 *
 * Un difetto arrivato fino a un giocatore, con l'effetto peggiore possibile: schermo
 * nero e gioco bloccato. La causa era una COLLISIONE DI NOMI. `statoQuadro()`
 * restituisce `progressi` come ARRAY (le righe "obiettivo: 3 su 5");
 * `registraTentativo()` restituiva `progressi` come OGGETTO (la mappa dei livelli
 * superati). L'esito era costruito con `{ ...stato, ...registrazione }` e il secondo
 * sovrascriveva il primo; la schermata di sconfitta -- l'unica che quelle righe le
 * disegna -- chiamava .map() su un oggetto e React smontava tutto.
 *
 * Vincendo non succedeva niente, perche' quel campo non viene mai letto. E' il motivo
 * per cui nessun test lo ha visto: coprivano la vittoria, non la sconfitta.
 *
 * Qui si controlla la causa (i due nomi non devono tornare a coincidere) e la forma
 * dell'esito. Il rendering vero e' coperto da `npm run e2e-quadri`, che adesso perde
 * un livello apposta.
 */
describe('sconfitta di un livello', () => {
  beforeEach(() => memoria.clear());

  it('registraTentativo non restituisce un campo che si chiama progressi', () => {
    // Il nome e' quello che ha causato il difetto: se torna, torna anche il difetto.
    for (const superato of [true, false]) {
      const esito = progressi.registraTentativo(1, { superato, mosse: 9, punteggio: 100 });
      expect(Object.keys(esito)).not.toContain('progressi');
      expect(esito.salvati).toBeTypeOf('object');
    }
  });

  it('lo stato di un livello perso elenca i progressi come array', () => {
    const quadro = quadroNumero(1);
    let partita = iniziaQuadro(quadro, { now: 0 });
    // Si gioca fino a esaurire le mosse senza mai chiudere niente.
    for (let m = 0; m < quadro.maxMosse; m += 1) {
      const stato = statoQuadro(quadro, partita);
      if (stato.finito) break;
      let scelta = null;
      for (let i = 0; i < partita.hand.length && !scelta; i += 1) {
        const pezzo = partita.hand[i];
        if (!pezzo) continue;
        for (const [row, col] of allPlacements(partita.grid, pezzo.shape)) {
          const { grid } = placeShape(partita.grid, pezzo.shape, row, col, 1, pezzo.bombe);
          if (findCompletedGroups(grid).length === 0) { scelta = { i, row, col }; break; }
        }
      }
      if (!scelta) break;
      partita = giocaNelQuadro(quadro, partita, scelta.i, scelta.row, scelta.col, m * 1000);
    }

    const finale = statoQuadro(quadro, partita);
    expect(finale.fallito).toBe(true);
    // La forma che la schermata di sconfitta si aspetta, e che era stata sostituita.
    expect(Array.isArray(finale.progressi)).toBe(true);
    expect(finale.progressi.length).toBe(quadro.obiettivi.length);
    for (const p of finale.progressi) {
      expect(p).toHaveProperty('tipo');
      expect(p).toHaveProperty('fatto');
      expect(p).toHaveProperty('quanti');
    }
  });

  it('un obiettivo da uno si legge al singolare', () => {
    // "Chiudi 1 righe" e' il genere di dettaglio che fa sembrare tradotto male un
    // gioco scritto bene. La schermata di sconfitta lo scriveva cosi'.
    const t = traduttore('it');
    expect(descriviObiettivo('righe', 1, t)).toBe('Chiudi una riga');
    expect(descriviObiettivo('righe', 3, t)).toBe('Chiudi 3 righe');
  });
});
