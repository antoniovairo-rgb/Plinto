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
