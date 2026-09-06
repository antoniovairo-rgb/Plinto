import { describe, it, expect } from 'vitest';
// Attenzione: NON importare queste traduzioni come `it` ed `en`: `it` collide con
// la funzione di test di Vitest e il file non viene nemmeno raccolto.
import italiano from '../src/i18n/it.js';
import inglese from '../src/i18n/en.js';
import { traduttore, LINGUE, LINGUA_PREDEFINITA } from '../src/i18n/index.js';
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
  /** Tutte le chiavi passate a t('...') nel sorgente dell'interfaccia. */
  function chiaviUsate() {
    const radice = new URL('../src/', import.meta.url).pathname;
    const trovate = new Set();
    const visita = (cartella) => {
      for (const voce of readdirSync(cartella, { withFileTypes: true })) {
        const percorso = join(cartella, voce.name);
        // La cartella i18n si esclude: nei suoi commenti c'e' un esempio di chiamata
        // che non e' un uso reale e falserebbe entrambi i controlli.
        if (voce.isDirectory()) { if (voce.name !== 'i18n') visita(percorso); continue; }
        if (!/\.(jsx?|mjs)$/.test(voce.name)) continue;
        const testo = readFileSync(percorso, 'utf8');
        for (const m of testo.matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) trovate.add(m[1]);
      }
    };
    visita(radice);
    return trovate;
  }

  it('non esistono chiavi definite che nessuno usa', () => {
    // Una chiave orfana e' un testo che qualcuno ha scritto e tradotto due volte
    // per niente, e che al primo sguardo sembra invece una funzionalita' esistente.
    const usate = chiaviUsate();
    const orfane = chiavi(italiano).filter((k) => !usate.has(k));
    expect(orfane).toEqual([]);
  });

  it('non si usano chiavi che non esistono in nessun dizionario', () => {
    // Questo e' il difetto peggiore: a schermo comparirebbe la chiave grezza.
    const definite = new Set(chiavi(italiano));
    const inventate = [...chiaviUsate()].filter((k) => !definite.has(k));
    expect(inventate).toEqual([]);
  });
});
