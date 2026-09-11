/**
 * Durate degli effetti, in millisecondi.
 *
 * Questi numeri esistono in DUE posti: qui, per sapere quando togliere un elemento
 * temporaneo dallo stato, e in src/styles/tokens.css, per animarlo. Se i due valori
 * si scollano, l'elemento sparisce prima della fine dell'animazione (uno scatto) o
 * resta appeso dopo (un residuo). Il test tests/durate.test.js confronta i due file
 * e fallisce se qualcuno ne cambia uno solo.
 */
export const DURATA_ATTERRAGGIO = 260;
export const DURATA_ESPLOSIONE = 420;
export const DURATA_PUNTI = 950;

/**
 * Quanto resta a schermo la frase di incitamento.
 *
 * Piu' lunga dei punti volanti (950ms) perche' un numero si coglie con la coda
 * dell'occhio mentre una frase va letta, e piu' corta di un secondo e mezzo perche'
 * sta SOPRA la griglia: oltre quella soglia non e' piu' un complimento, e' un
 * ostacolo fra il giocatore e la mossa successiva.
 */
export const DURATA_INCITAMENTO = 1250;

/**
 * Quanto la frase aspetta prima di comparire.
 *
 * PERCHE' NON ARRIVA SUBITO. La frase sta al centro della plancia e i punti salgono
 * dalla cella dove hai appoggiato: quando quella cella e' al centro, il riquadro della
 * frase si mette davanti al numero. Visto su una schermata dello store: "+198" letto
 * come "+1 98", con l'etichetta della Tinta tagliata a meta'.
 *
 * Spostare la frase non risolve, perche' i punti possono partire da qualunque casella.
 * Separarli nel TEMPO invece si': i punti durano 950ms, la frase entra a 480 e resta
 * fino a 1730. Si sovrappongono per meno di mezzo secondo, mentre il numero sta gia'
 * sbiadendo, e la celebrazione diventa una sequenza -- prima quanto hai fatto, poi
 * com'e' andata -- invece di due cose che si contendono lo stesso punto dello schermo.
 */
export const ATTESA_INCITAMENTO = 480;
