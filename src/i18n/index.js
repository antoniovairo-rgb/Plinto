/**
 * Traduzioni. Struttura minima e senza dipendenze: le stringhe sono oggetti annidati
 * e `t('sezione.chiave')` li attraversa. Se una chiave manca nella lingua scelta si
 * ricade sull'italiano, e se manca anche li' si mostra la chiave stessa: un testo
 * sbagliato e' visibile subito invece di sparire.
 */

import it from './it.js';
import en from './en.js';

export const LINGUE = { it: { nome: 'Italiano', strings: it }, en: { nome: 'English', strings: en } };
export const LINGUA_PREDEFINITA = 'it';

/**
 * Quante varianti ha ogni frase di incitamento, per categoria.
 *
 * Serve all'interfaccia per sorteggiare quale dire. Il conteggio si legge dall'italiano
 * e vale per tutte le lingue: tests/i18n.test.js pretende che le due lingue abbiano
 * esattamente le stesse chiavi, e gli indici di un elenco SONO chiavi, quindi una lingua
 * con una variante in meno fa fallire il test invece di far pescare una frase
 * inesistente in partita.
 */
export const VARIANTI_INCITA = Object.fromEntries(
  Object.entries(it.incita).map(([nome, frasi]) => [nome, Array.isArray(frasi) ? frasi.length : 1]),
);

/** Lingua suggerita dal browser, se la conosciamo. */
export function linguaDelBrowser() {
  try {
    const lang = (navigator.language || '').slice(0, 2).toLowerCase();
    return LINGUE[lang] ? lang : LINGUA_PREDEFINITA;
  } catch {
    return LINGUA_PREDEFINITA;
  }
}

function leggi(obj, percorso) {
  return percorso.split('.').reduce((acc, k) => (acc == null ? undefined : acc[k]), obj);
}

/**
 * Sostituisce i segnaposto `{nome}` con i valori dati.
 *
 * Un segnaposto senza valore resta scritto com'e', a vista: una frase che mostra
 * "{quante}" e' un difetto che si nota subito, mentre una che ha silenziosamente perso
 * un numero sembra corretta e non lo e'.
 */
function riempi(testo, valori) {
  if (!valori) return testo;
  return String(testo).replace(/\{(\w+)\}/g, (intero, nome) => (
    Object.prototype.hasOwnProperty.call(valori, nome) ? String(valori[nome]) : intero
  ));
}

/**
 * @returns {(chiave: string, valori?: object) => string} funzione di traduzione per la
 * lingua data
 */
export function traduttore(lingua) {
  const scelte = LINGUE[lingua]?.strings ?? it;
  return (chiave, valori) => riempi(leggi(scelte, chiave) ?? leggi(it, chiave) ?? chiave, valori);
}
