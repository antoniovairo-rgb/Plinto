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

/**
 * Interruttore della correzione B7 (collaudo 1.21.6): la Partita libera e la Sfida del
 * giorno hanno ciascuna il proprio record. Prima lo condividevano, e la home presentava
 * come «Record» della Partita libera il punteggio di una Sfida (395 a chi non aveva mai
 * giocato una partita libera). Decisione del PO in docs/DECISIONI.md: «Separo i due
 * record», e quello esistente resta alla Partita libera. Con `false` si torna al record
 * condiviso: la chiave della Sfida non viene piu' ne' letta ne' scritta, e niente si perde.
 */
export const RECORD_SEPARATI = true;

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
  // Il record della Sfida del giorno, separato da quello della partita libera (B7).
  RECORDS_SFIDA: 'records-sfida',
  SETTINGS: 'settings',
  CURRENT_GAME: 'partita',
  CURRENT_CHALLENGE: 'partita-sfida',
  CHALLENGES: 'sfide',
  PROGRESS: 'quadri',
  // La partita di un livello lasciata a meta', e il posto in cui il giocatore era.
  CURRENT_LEVEL: 'partita-quadro',
  RIPRESA: 'ripresa',
  STATS: 'statistiche',
  PROFILO: 'profilo',
  // Gli attrezzi del cantiere: quanti se ne hanno e fin dove si e' gia' convertito.
  ATTREZZI: 'attrezzi',
  // Il gioco e' aperto dall'app del Play Store, e l'invito a recensirlo gia' toccato.
  ORIGINE: 'origine',
  RECENSIONE: 'recensione',
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
 * La partita libera tiene la chiave di sempre, `records`, cosi' il record di chi gioca
 * gia' resta suo senza migrare niente. La Sfida del giorno ha la sua (vedi
 * RECORD_SEPARATI). I Quadri non ne hanno: si superano o no.
 */
export function chiaveRecord(modalita = 'libera') {
  if (RECORD_SEPARATI && modalita === 'sfida') return KEYS.RECORDS_SFIDA;
  return KEYS.RECORDS;
}

