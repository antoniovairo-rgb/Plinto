/**
 * Dati di progetto che dipendono dal proprietario e non dal codice.
 *
 * PAYPAL_URL puo' restare VUOTO: nessuno puo' inventare l'indirizzo di donazione di
 * qualcun altro, e finche' e' vuoto la schermata di sostegno dichiara che la donazione
 * non e' ancora attiva invece di mostrare un pulsante che porta da nessuna parte.
 * Per attivarlo si incolla qui il link creato su https://www.paypal.com/paypalme/.
 *
 * NOTA SUL NOME DEL LINK. "elevoraCPM" non e' il nome di questo gioco: e'
 * l'identificativo del conto, condiviso con l'altro progetto dello stesso autore.
 * PayPal consente UN SOLO link PayPal.Me per conto e non permette di modificarlo dopo
 * la creazione, quindi un link dedicato richiederebbe un secondo conto. Non si spiega
 * niente al giocatore: chi apre la pagina di PayPal vede il nome del conto, come
 * succede con qualunque donazione, e non e' una cosa che vada giustificata dentro il
 * gioco. Al momento della pubblicazione sugli store l'identita' sara' comunque
 * diversa, quindi non vale la pena costruirci sopra.
 *
 * COSA NON PUO' DIVENTARE. Questa e' una donazione ESTERNA e volontaria: il gioco non
 * da' NIENTE in cambio -- nessun contenuto, nessun vantaggio, nessuna comparsa nei
 * ringraziamenti. E' la condizione con cui il progetto si dichiara senza acquisti
 * in-app. Il giorno in cui la donazione desse qualcosa in cambio, non sarebbe piu' una
 * donazione ma un acquisto, e cambierebbero le regole degli store e le informative.
 */
export const PAYPAL_URL = 'https://paypal.me/elevoraCPM';

/** Contatto mostrato nella schermata Info. Vuoto = non mostrato. */
export const CONTATTO = '';

/** Anno di partenza del progetto, per la nota di copyright. */
export const ANNO = 2026;
