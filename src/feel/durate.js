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
