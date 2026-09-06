/**
 * Persistenza locale di PLINTO.
 *
 * Privacy by design: TUTTO resta nel browser del giocatore. Nessun account,
 * nessun server, nessun identificativo, nessuna telemetria. Se il giocatore
 * cancella i dati del sito, il gioco riparte da zero e non esiste altra copia.
 *
 * localStorage puo' fallire (navigazione privata, quota piena, storage bloccato):
 * ogni accesso e' protetto e il gioco deve funzionare comunque, solo senza memoria.
 */

const PREFIX = 'plinto:';

/** true se lo storage e' utilizzabile in questo contesto. */
export function storageAvailable() {
  try {
    const probe = `${PREFIX}__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Legge un valore JSON. Restituisce `fallback` se manca o e' illeggibile. */
export function read(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

/** Scrive un valore JSON. Restituisce false se non e' stato possibile salvare. */
export function write(key, value) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Rimuove una chiave. */
export function remove(key) {
  try {
    window.localStorage.removeItem(PREFIX + key);
    return true;
  } catch {
    return false;
  }
}

/** Cancella tutti i dati di PLINTO (usato dal pulsante "azzera i miei dati"). */
export function clearAll() {
  try {
    const keys = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
    return true;
  } catch {
    return false;
  }
}

export const KEYS = {
  RECORDS: 'records',
  SETTINGS: 'settings',
  CURRENT_GAME: 'partita',
  CURRENT_CHALLENGE: 'partita-sfida',
  CHALLENGES: 'sfide',
  STATS: 'statistiche',
};

/**
 * Slot di salvataggio della partita in corso, uno per modalita'.
 * Sono separati di proposito: iniziare la Sfida del Giorno non deve cancellare
 * la partita libera che il giocatore aveva lasciato a meta'.
 */
export function chiavePartita(modalita) {
  return modalita === 'sfida' ? KEYS.CURRENT_CHALLENGE : KEYS.CURRENT_GAME;
}
