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

/**
 * Dove arrivano idee e segnalazioni. Vuoto = il collegamento non compare, come per
 * PayPal: meglio niente che un pulsante che non porta da nessuna parte.
 *
 * E' un `mailto:`, non un modulo. Un modulo vorrebbe dire un servizio di terze parti,
 * cioe' una richiesta di rete verso un altro dominio, cioe' l'unica cosa che
 * l'informativa privacy di questo gioco promette di non fare. Un `mailto:` apre
 * l'applicazione di posta del telefono e non contatta nessun server: il gioco non sa
 * nemmeno se il messaggio e' stato scritto.
 *
 * ATTENZIONE: questo indirizzo diventa PUBBLICO. Compare nel gioco e sulla scheda del
 * Play Store. Cambiarlo qui lo cambia ovunque.
 *
 * NON E' UN INDIRIZZO PERSONALE, ed e' una scelta. Il primo che era scritto qui portava
 * nome e cognome dell'autore, ed era l'unico posto in tutto il gioco in cui comparivano
 * in chiaro davanti a chi gioca: piu' esposto del nome del pacchetto dentro un URL, che
 * non legge nessuno. Questo e' lo stesso indirizzo che il profilo sviluppatore mostra
 * gia' sul Play Store, quindi i due coincidono e non c'e' un secondo dato in giro.
 */
export const CONTATTO = 'korward.devteam@gmail.com';

/**
 * Dove vive il gioco sul web. Serve dove serve un indirizzo ASSOLUTO, cioe' nei tag
 * dell'anteprima dei collegamenti: quelli non possono essere relativi, perche' chi li
 * legge e' il server di WhatsApp o di Facebook e non ha nessuna pagina da cui contare.
 */
export const SITO = 'https://antoniovairo-rgb.github.io/Plinto/';

/**
 * La scheda del gioco sul Play Store. Vuoto = si condivide il sito.
 *
 * PERCHE' IL PLAY STORE E NON IL SITO. Chi riceve un risultato e vuole giocare deve
 * poter INSTALLARE il gioco, non solo aprirlo una volta nel browser. Dal sito ci si
 * arriva comunque, ma il passaggio in piu' lo fa quasi nessuno.
 *
 * ATTENZIONE, E' UNA DECISIONE CHE HA UNA DATA. Finche' l'app e' in test chiuso questa
 * pagina NON e' pubblica: chi non e' fra i tester iscritti apre il link e non trova
 * niente. Lasciare la costante vuota fino all'accesso alla produzione significa
 * continuare a condividere il sito, che funziona per tutti e su qualunque sistema.
 *
 * LA SFIDA DEL GIORNO NON LA USA MAI, e non e' una dimenticanza: il suo collegamento
 * porta scritto il giorno (`#/sfida/2026-09-12`) e serve a far giocare al destinatario
 * la stessa identica partita. Un indirizzo del Play Store non puo' portare quel dato, e
 * sostituirlo li' vorrebbe dire cancellare la funzione invece di migliorarla.
 */
export const PLAY_URL = 'https://play.google.com/store/apps/details?id=io.github.antoniovairo_rgb.plinto';

/** Anno di partenza del progetto, per la nota di copyright. */
export const ANNO = 2026;
