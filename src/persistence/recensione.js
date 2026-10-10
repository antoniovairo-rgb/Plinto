import { read, write, KEYS } from './storage.js';
import { PLAY_URL } from '../config/progetto.js';

/**
 * L'invito a recensire il gioco sul Play Store.
 *
 * HA SENSO SOLO DENTRO L'APP DEL PLAY STORE. Recensire un'app richiede di averla
 * installata da li': a chi gioca dal browser l'invito proporrebbe una cosa che non puo'
 * fare. Il gioco pero' e' un sito, e l'app Android (una Trusted Web Activity) lo mostra
 * cosi' com'e': il codice e' lo stesso nei due casi, e bisogna capire da dove si gioca.
 *
 * DUE SEGNALI, perche' nessuno dei due basta da solo:
 *   - `?origine=play` nell'indirizzo di avvio. E' il metodo indicato da Google per far
 *     sapere qualcosa al sito ("passare dati nell'URL"), ma richiede che l'app Android
 *     apra quell'indirizzo: arriva con il primo pacchetto Android che lo dichiara.
 *   - il referrer `android-app://<pacchetto>`, che Chrome PUO' impostare quando la pagina
 *     e' aperta da un'app. Funziona con l'app gia' installata, ma nessuna documentazione
 *     ufficiale lo garantisce per le TWA: va verificato su un telefono vero.
 *
 * Il segnale arriva solo all'apertura, quindi si RICORDA: una pagina ricaricata dentro
 * l'app non ha piu' ne' il parametro ne' il referrer. Il ricordo vive nell'archivio
 * del sito, che l'app condivide con Chrome sullo stesso telefono: in Chrome, su un
 * telefono dove l'app e' installata, l'invito puo' quindi comparire anche li'. E' un
 * effetto accettato -- chi lo vede ha l'app e puo' recensirla davvero.
 *
 * Nessun dato lascia il telefono: si salva un valore, non un identificativo.
 */

/** Il nome del pacchetto Android, letto dal collegamento al Play Store (non ricopiato). */
function pacchetto() {
  try {
    return new URL(PLAY_URL).searchParams.get('id') ?? '';
  } catch {
    return '';
  }
}

/**
 * La pagina e' stata aperta dall'app del Play Store?
 * Funzione pura: riceve l'indirizzo e il referrer invece di leggerli, cosi' si prova.
 * @param {string} cerca la parte `?...` dell'indirizzo
 * @param {string} referrer `document.referrer`
 */
export function apertaDallApp(cerca, referrer) {
  try {
    if (new URLSearchParams(cerca ?? '').get('origine') === 'play') return true;
  } catch {
    // un indirizzo illeggibile non e' un segnale
  }
  const id = pacchetto();
  if (!id || typeof referrer !== 'string') return false;
  const atteso = `android-app://${id}`;
  return referrer === atteso || referrer.startsWith(`${atteso}/`);
}

/** Da chiamare all'avvio: se la pagina viene dall'app, lo ricorda. */
export function registraOrigine() {
  try {
    if (apertaDallApp(window.location.search, document.referrer)) write(KEYS.ORIGINE, 'play');
  } catch {
    // senza window o senza archivio l'invito semplicemente non compare
  }
}

/** Si sta giocando dall'app del Play Store (adesso o in un'apertura precedente)? */
export function nellAppPlay() {
  return read(KEYS.ORIGINE, null) === 'play';
}

/** Il giocatore ha gia' toccato l'invito almeno una volta? */
export function recensioneToccata() {
  return read(KEYS.RECENSIONE, false) === true;
}

/** Da chiamare quando il giocatore tocca l'invito. */
export function segnaRecensione() {
  write(KEYS.RECENSIONE, true);
}
