import { describe, it, expect } from 'vitest';
// Attenzione: NON importare queste traduzioni come `it` ed `en`: `it` collide con
// la funzione di test di Vitest e il file non viene nemmeno raccolto.
import italiano from '../src/i18n/it.js';
import inglese from '../src/i18n/en.js';
import { traduttore, LINGUE, LINGUA_PREDEFINITA } from '../src/i18n/index.js';
import { REGOLE_INTRO } from '../src/config/intro.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Elenco piatto delle chiavi annidate, es. "home.gioca". */
function chiavi(oggetto, prefisso = '') {
  return Object.entries(oggetto).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? chiavi(v, `${prefisso}${k}.`) : [`${prefisso}${k}`],
  );
}

describe('traduzioni', () => {
  const chiaviIt = chiavi(italiano);
  const chiaviEn = chiavi(inglese);

  it('inglese e italiano hanno esattamente le stesse chiavi', () => {
    // Senza questo test una stringa aggiunta in fretta in una sola lingua
    // arriva in produzione e l'utente inglese vede una frase in italiano.
    expect(chiaviEn.filter((k) => !chiaviIt.includes(k))).toEqual([]);
    expect(chiaviIt.filter((k) => !chiaviEn.includes(k))).toEqual([]);
  });

  it('nessuna traduzione e vuota', () => {
    Object.entries(LINGUE).forEach(([codice, { strings }]) => {
      const t = traduttore(codice);
      chiaviIt.forEach((chiave) => {
        expect(t(chiave), `${codice} -> ${chiave}`).toBeTruthy();
        expect(t(chiave).trim().length, `${codice} -> ${chiave}`).toBeGreaterThan(0);
      });
      expect(strings).toBeDefined();
    });
  });

  it('una chiave inesistente restituisce la chiave, non una stringa vuota', () => {
    // Un testo sbagliato si vede e si corregge; un testo sparito no.
    expect(traduttore('it')('non.esiste.affatto')).toBe('non.esiste.affatto');
  });

  it('una lingua sconosciuta ricade sull italiano invece di rompersi', () => {
    expect(traduttore('xx')('home.gioca')).toBe(italiano.home.gioca);
    expect(LINGUE[LINGUA_PREDEFINITA]).toBeDefined();
  });

  it('i segnaposto delle etichette di cella esistono in tutte le lingue', () => {
    Object.keys(LINGUE).forEach((codice) => {
      const testo = traduttore(codice)('a11y.cella');
      expect(testo).toContain('{r}');
      expect(testo).toContain('{c}');
    });
  });
});

describe('chiavi effettivamente usate', () => {
  /**
   * Tutte le chiavi passate a t() nel sorgente dell'interfaccia.
   *
   * Riconosce due forme. Quella letterale, t('sezione.chiave'), e quella composta a
   * runtime, t(`sezione.chiave.${variabile}`): della seconda si registra il prefisso,
   * perche' quale chiave finale verra' usata dipende dai dati e non si puo' sapere
   * leggendo il file. Senza questo, dieci chiavi degli obiettivi dei Quadri
   * risultavano orfane pur essendo l'unica cosa che quella schermata mostra.
   */
  function chiaviUsate() {
    const radice = new URL('../src/', import.meta.url).pathname;
    const trovate = new Set();
    const prefissi = new Set();
    const visita = (cartella) => {
      for (const voce of readdirSync(cartella, { withFileTypes: true })) {
        const percorso = join(cartella, voce.name);
        // La cartella i18n si esclude: nei suoi commenti c'e' un esempio di chiamata
        // che non e' un uso reale e falserebbe entrambi i controlli.
        if (voce.isDirectory()) { if (voce.name !== 'i18n') visita(percorso); continue; }
        if (!/\.(jsx?|mjs)$/.test(voce.name)) continue;
        const testo = readFileSync(percorso, 'utf8');
        for (const m of testo.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) trovate.add(m[1]);
        for (const m of testo.matchAll(/\bt\(\s*`([a-zA-Z0-9_.]+)\.\$\{/g)) prefissi.add(m[1]);
      }
    };
    visita(radice);
    return { trovate, prefissi };
  }

  /** Una chiave e' usata se compare per intero, o se sta sotto un prefisso dinamico. */
  function eUsata({ trovate, prefissi }, chiave) {
    if (trovate.has(chiave)) return true;
    return [...prefissi].some((p) => chiave.startsWith(`${p}.`));
  }

  it('non esistono chiavi definite che nessuno usa', () => {
    // Una chiave orfana e' un testo che qualcuno ha scritto e tradotto due volte
    // per niente, e che al primo sguardo sembra invece una funzionalita' esistente.
    const usate = chiaviUsate();
    const orfane = chiavi(italiano).filter((k) => !eUsata(usate, k));
    expect(orfane).toEqual([]);
  });

  it('non si usano chiavi che non esistono in nessun dizionario', () => {
    // Questo e' il difetto peggiore: a schermo comparirebbe la chiave grezza.
    const definite = new Set(chiavi(italiano));
    const { trovate } = chiaviUsate();
    const inventate = [...trovate].filter((k) => !definite.has(k));
    expect(inventate).toEqual([]);
  });
});

/**
 * L'italiano deve essere scritto in italiano.
 *
 * Per parecchie versioni tutto `it.js` e' stato in ASCII puro. In italiano non e' una
 * semplificazione tipografica: cambia le parole. "Un gruppo e una riga" significa
 * "un gruppo E una riga"; quello che si voleva dire era "un gruppo E' una riga". Lo
 * stesso per "il gioco e gratuito", "la partita e la stessa per tutti" e per il
 * pulsante "Si", che senza accento e' un pronome, non una risposta.
 *
 * Nessuno se n'era accorto perche' il testo si legge lo stesso e il difetto non rompe
 * niente: semplicemente fa sembrare tradotto male un gioco che in italiano ci nasce.
 *
 * Qui si controllano le parole che in italiano NON esistono senza accento. Non e' un
 * correttore ortografico e non pretende di esserlo: e' una rete su una categoria di
 * errore precisa, gia' vista, e facile da reintrodurre scrivendo in fretta.
 */
describe('ortografia italiana', () => {
  const SENZA_ACCENTO = [
    'piu', 'perche', 'poiche', 'finche', 'benche', 'affinche',
    'puo', 'gia', 'cosi', 'meta', 'citta', 'qualita', 'liberta', 'novita',
    'pubblicita', 'sara', 'fara', 'verra', 'potra', 'dovra', 'cio', 'piu',
  ];

  /** Coppie chiave/testo di tutte le stringhe italiane. */
  function testiItaliani(oggetto, prefisso = '') {
    return Object.entries(oggetto).flatMap(([k, v]) => (
      typeof v === 'object' && v !== null
        ? testiItaliani(v, `${prefisso}${k}.`)
        : [[`${prefisso}${k}`, v]]
    ));
  }

  const testi = testiItaliani(italiano);

  it('trova davvero delle stringhe (il test non deve passare a vuoto)', () => {
    expect(testi.length).toBeGreaterThan(50);
  });

  it.each(SENZA_ACCENTO)('nessun testo contiene "%s" senza accento', (parola) => {
    // Il confine di parola va calcolato sulle LETTERE, non su `\b`.
    //
    // In JavaScript `\b` considera "parola" solo [A-Za-z0-9_]: una lettera accentata
    // non lo e', quindi `\bcio\b` trova "cio" dentro «cioè» -- e il test accusava di
    // errore una parola scritta giusta. Con i lookaround su \p{L} il confine cade dove
    // cade davvero in italiano, e «cioè» smette di somigliare a «cio».
    const confine = new RegExp(`(?<!\\p{L})${parola}(?!\\p{L})`, 'iu');
    const rotti = testi.filter(([, testo]) => confine.test(testo));
    expect(rotti.map(([chiave, testo]) => `${chiave}: "${testo}"`)).toEqual([]);
  });

  it('gli accenti ci sono davvero, cioe il file non e tornato in ASCII', () => {
    const conAccento = testi.filter(([, testo]) => /[àèéìòù]/.test(testo));
    expect(conAccento.length).toBeGreaterThan(10);
  });

  it('la risposta affermativa e "Si" con accento', () => {
    expect(italiano.comune.si).toBe('Sì');
  });
});


/**
 * Le regole della presentazione.
 *
 * Il loro numero era scritto a mano in tre posti — il componente e i due script che
 * pilotano un browser — e aggiungendo la quarta regola ne ho aggiornati due su tre:
 * la pubblicazione e' fallita sul terzo. Ora la fonte e' una sola, `REGOLE_INTRO`, ma
 * una lista puo' comunque crescere senza che qualcuno scriva la traduzione: in quel
 * caso il giocatore leggerebbe "intro.cinque" al primo avvio, cioe' la prima cosa che
 * vede del gioco.
 */
describe('regole della presentazione', () => {
  it('ce ne sono, e sono poche come deve essere una presentazione', () => {
    expect(REGOLE_INTRO.length).toBeGreaterThanOrEqual(3);
    expect(REGOLE_INTRO.length).toBeLessThanOrEqual(6);
  });

  it.each(Object.keys(LINGUE))('in %s ogni regola ha il suo testo', (lingua) => {
    const t = traduttore(lingua);
    for (const chiave of REGOLE_INTRO) {
      const testo = t(`intro.${chiave}`);
      expect(testo, `${lingua}: manca intro.${chiave}`).not.toBe(`intro.${chiave}`);
      expect(testo.length, `${lingua}: intro.${chiave} e troppo corto`).toBeGreaterThan(20);
    }
  });
});
