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

/** @returns {(chiave: string) => string} funzione di traduzione per la lingua data */
export function traduttore(lingua) {
  const scelte = LINGUE[lingua]?.strings ?? it;
  return (chiave) => leggi(scelte, chiave) ?? leggi(it, chiave) ?? chiave;
}
