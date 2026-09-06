import { describe, it, expect } from 'vitest';
// Attenzione: NON importare queste traduzioni come `it` ed `en`: `it` collide con
// la funzione di test di Vitest e il file non viene nemmeno raccolto.
import italiano from '../src/i18n/it.js';
import inglese from '../src/i18n/en.js';
import { traduttore, LINGUE, LINGUA_PREDEFINITA } from '../src/i18n/index.js';

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
