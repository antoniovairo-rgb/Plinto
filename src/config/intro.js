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

/**
 * I passi della guida iniziale, in ordine.
 *
 * Sta qui per la stessa ragione di REGOLE_INTRO, ed e' la stessa lezione pagata una
 * seconda volta: il NUMERO dei passi serve agli script che pilotano un browser, i quali
 * girano in Node e non possono importare un .jsx. Scritto a mano in piu' posti,
 * invecchia in tutti tranne uno.
 *
 * L'ordine non e' casuale. Prima cosa si fa (`base`), poi le due cose che danno
 * profondita' e che nessuno indovina guardando (`catena`, `intreccio`), poi quella che
 * i giocatori davano gia' per scontata senza che fosse vera (`tinta`), poi l'unica che
 * non si puo' dedurre e che va detta PRIMA di subirla (`bomba`), e infine `percorso`:
 * che questo gioco e' cento livelli, non una partita senza fine.
 *
 * `percorso` sta per ultimo di proposito. E' l'informazione che i primi tester non
 * hanno avuto -- hanno creduto che il gioco fosse solo la partita libera -- ed e' anche
 * quella che si ricorda meglio, perche' e' l'ultima cosa letta prima di giocare.
 */
export const PASSI_GUIDA = ['base', 'catena', 'intreccio', 'tinta', 'bomba', 'percorso'];
