/**
 * Documenti versionati su localStorage.
 *
 * PERCHE' ESISTE. Fino a ieri ogni cosa salvata dal gioco -- record, statistiche,
 * impostazioni, sfide, avanzamento nei livelli -- era un oggetto JSON senza alcuna
 * indicazione di quale versione del gioco lo avesse scritto. Finche' i campi si
 * aggiungono e basta non e' un problema (chi legge fonde sopra i valori predefiniti),
 * ma il primo campo che cambia SIGNIFICATO diventa un difetto silenzioso: il gioco
 * legge un numero vecchio credendolo nuovo e non ha modo di accorgersene. Un campo
 * `versione` costa nulla oggi e rende possibile una migrazione onesta domani.
 *
 * COSA NON FA. Non protegge da niente e non e' un controllo di integrita': chi apre
 * gli strumenti per sviluppatori puo' scrivere quello che vuole nel proprio storage,
 * ed e' giusto cosi' -- sono i suoi dati, sul suo dispositivo, e non c'e' nessuna
 * classifica da difendere. Serve solo a sapere COME leggere quello che si trova.
 *
 * LE QUATTRO SITUAZIONI, tutte dichiarate:
 *
 *   niente         -> si parte dai valori predefiniti.
 *   senza versione -> e' la forma precedente a questo modulo: si applica `migra` con
 *                     versione 0 e si timbra la versione corrente alla prima scrittura.
 *   versione nota  -> si usa, fondendo sopra i predefiniti (i campi nuovi arrivano
 *                     con il loro valore iniziale invece che come `undefined`).
 *   versione futura-> il dato l'ha scritto una versione del gioco piu' recente di
 *                     quella aperta ora. Non si finge di capirlo: si legge in modo
 *                     tollerante e i campi sconosciuti restano nell'oggetto, cosi'
 *                     sopravvivono alla riscrittura invece di essere cancellati da
 *                     una versione vecchia rimasta in cache.
 *
 * Ogni accesso passa da `storage.js`, che e' gia' interamente protetto: se lo storage
 * non e' disponibile o la quota e' esaurita, la lettura restituisce i predefiniti e
 * la scrittura restituisce `false`. Nessuna eccezione esce da questo modulo, e una
 * partita in corso non si perde mai perche' non si e' potuto salvare un record.
 */

import { read, write } from './storage.js';

/** Versione della forma "prima che esistessero le versioni". */
export const SENZA_VERSIONE = 0;

/**
 * Legge un documento versionato.
 *
 * @param {string} chiave chiave di storage (senza prefisso)
 * @param {object} opzioni
 * @param {number} opzioni.versione versione corrente attesa dal codice
 * @param {object} opzioni.predefiniti valori iniziali di ogni campo
 * @param {(dati:object, da:number) => object} [opzioni.migra] trasforma una forma
 *   precedente nella forma corrente. Riceve la versione di partenza (0 = senza versione).
 * @returns {object} il documento, sempre completo, mai `null`
 */
export function leggiDocumento(chiave, { versione, predefiniti, migra = (dati) => dati }) {
  const grezzo = read(chiave, null);
  if (!grezzo || typeof grezzo !== 'object' || Array.isArray(grezzo)) {
    return { ...predefiniti, versione };
  }

  const trovata = Number.isInteger(grezzo.versione) ? grezzo.versione : SENZA_VERSIONE;
  const { versione: _ignorata, ...contenuto } = grezzo;

  if (trovata === versione) return { ...predefiniti, ...contenuto, versione };
  if (trovata > versione) return { ...predefiniti, ...contenuto, versione: trovata };

  return { ...predefiniti, ...migra(contenuto, trovata), versione };
}

/**
 * Scrive un documento timbrandolo con la versione.
 * @returns {boolean} false se non e' stato possibile salvare (quota, storage bloccato)
 */
export function scriviDocumento(chiave, versione, dati) {
  return write(chiave, { ...dati, versione });
}
