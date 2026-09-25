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

/**
 * La lingua per chi non parla nessuna delle nostre: l'inglese.
 *
 * PRIMA RICADEVA SULL'ITALIANO, cioe' su LINGUA_PREDEFINITA, che e' la lingua di
 * riferimento delle traduzioni e non quella da offrire a uno sconosciuto. Con il gioco
 * pubblicato in 177 paesi, un telefono in spagnolo, tedesco o portoghese si ritrovava
 * il gioco in italiano, con la scelta della lingua nascosta nelle impostazioni -- scritte
 * anche loro in italiano. Fra le due lingue che abbiamo, l'inglese e' quella che uno
 * straniero ha piu' probabilita' di leggere.
 */
export const LINGUA_PER_GLI_ALTRI = 'en';

/**
 * Lingua suggerita dal browser: la prima che conosciamo fra quelle preferite dal
 * telefono, nell'ordine in cui il telefono le mette. Chi ha il telefono in tedesco con
 * l'italiano come seconda lingua gioca in italiano; chi non ne ha nessuna delle nostre,
 * in inglese.
 */
export function linguaDelBrowser() {
  try {
    const preferite = [...(navigator.languages ?? []), navigator.language ?? ''];
    for (const voce of preferite) {
      const lang = String(voce).slice(0, 2).toLowerCase();
      if (LINGUE[lang]) return lang;
    }
    return LINGUA_PER_GLI_ALTRI;
  } catch {
    // Senza `navigator` (non succede in un browser) non c'e' niente da leggere: resta la
    // lingua di riferimento.
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
