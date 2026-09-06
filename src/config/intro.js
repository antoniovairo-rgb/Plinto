/**
 * Le regole mostrate nella presentazione al primo avvio.
 *
 * Sta qui, in un modulo di configurazione senza JSX, e non dentro il componente, per
 * un motivo preciso: il loro NUMERO viene verificato da due script che pilotano un
 * browser (`tests/e2e/partita.mjs` e `tools/prova-sottocartella.mjs`), i quali girano
 * in Node e non possono importare un file .jsx.
 *
 * Prima quel numero era scritto a mano in tre posti: il componente, e i due script.
 * Aggiungendo la quarta regola — la bomba — ne ho aggiornati due su tre, e il terzo ha
 * fatto fallire la pubblicazione. E' la stessa identica categoria di errore che in
 * questo progetto ha gia' prodotto una costante dichiarata due volte e una palette
 * rimasta indietro nell'icona: una modifica meccanica applicata a QUASI tutti i posti.
 *
 * L'elenco e' l'unica fonte. Aggiungere una regola significa aggiungere una voce qui e
 * la traduzione corrispondente: il componente ne disegna una in piu' e i due script si
 * aspettano una in piu', senza toccarli.
 */
export const REGOLE_INTRO = ['uno', 'due', 'tre', 'quattro'];
