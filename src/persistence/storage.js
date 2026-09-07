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
  PROGRESS: 'quadri',
  STATS: 'statistiche',
  PROFILO: 'profilo',
};

/**
 * Slot di salvataggio della partita in corso, uno per modalita'.
 * Sono separati di proposito: iniziare la Sfida del Giorno non deve cancellare
 * la partita libera che il giocatore aveva lasciato a meta'.
 */
export function chiavePartita(modalita) {
  if (modalita === 'sfida') return KEYS.CURRENT_CHALLENGE;
  return KEYS.CURRENT_GAME;
}

/**
 * Chiave dei record, per modalita'.
 *
 * Per ora ce n'e' una sola: la partita libera e la Sfida del Giorno condividono i
 * record, e i Quadri non ne hanno (si superano o no). La funzione resta perche' la
 * separazione per modalita' e' una decisione che va presa in un posto, non sparsa fra
 * i chiamanti.
 */
export function chiaveRecord() {
  return KEYS.RECORDS;
}

/**
 * Le chiavi di una modalita' che non esiste piu': la partita libera con l'anteprima.
 *
 * L'anteprima e' diventata parte dei Quadri e la modalita' a se' e' sparita dalla home.
 * Chi aveva giocato in quella modalita' si ritroverebbe due voci di storage che nessuno
 * legge piu': una partita a meta' che non si puo' riprendere e un record che non si puo'
 * piu' battere. Non e' un dato prezioso da conservare -- e' una traccia di una cosa che
 * non c'e' -- e lasciarla li' vorrebbe dire non sapere piu', fra un anno, se serve.
 */
const CHIAVI_ABBANDONATE = [
  `${KEYS.CURRENT_GAME}-anteprima`,
  `${KEYS.RECORDS}-anteprima`,
];

/** Cancella le voci delle modalita' che non esistono piu'. Si chiama una volta all'avvio. */
export function ripulisciChiaviAbbandonate() {
  CHIAVI_ABBANDONATE.forEach(remove);
}
