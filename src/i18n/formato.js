/**
 * Formattazione di numeri e date secondo la lingua scelta dal giocatore.
 *
 * Prima esisteva un `toLocaleString('it-IT')` scritto a mano in ogni componente e,
 * nello stesso schermo, date formattate senza lingua: un giocatore inglese leggeva
 * i punteggi con il punto delle migliaia italiano e le date nel formato del sistema.
 * Due politiche diverse a un centimetro di distanza.
 *
 * La lingua e' tenuta qui a livello di modulo invece di essere passata di componente
 * in componente: e' una preferenza globale che cambia raramente, e attraversarla in
 * ogni firma avrebbe aggiunto rumore a tutta l'interfaccia.
 */

let linguaCorrente = 'it';

/** Chiamata dalla radice dell'app quando la lingua cambia. */
export function impostaLingua(lingua) {
  linguaCorrente = lingua || 'it';
}

/** Numero intero con i separatori della lingua corrente. */
export function numero(valore) {
  try {
    return Number(valore).toLocaleString(linguaCorrente);
  } catch {
    return String(valore);
  }
}

/**
 * Data distesa: "8 settembre" invece di "8 set".
 *
 * Serve dove la data e' il TITOLO di quello che si sta guardando -- la sfida che si sta
 * giocando -- e non un'etichetta di contorno: li' l'abbreviazione fa risparmiare tre
 * lettere e costa un attimo di lettura in piu' proprio a chi sta cercando di capire dove
 * si trova.
 */
export function dataDistesa(giornoIso) {
  try {
    return new Date(`${giornoIso}T12:00:00`).toLocaleDateString(linguaCorrente, {
      day: 'numeric', month: 'long',
    });
  } catch {
    return giornoIso;
  }
}

/** Data in formato AAAA-MM-GG resa leggibile nella lingua corrente. */
export function data(giornoIso) {
  try {
    return new Date(`${giornoIso}T12:00:00`).toLocaleDateString(linguaCorrente, {
      day: 'numeric', month: 'short',
    });
  } catch {
    return giornoIso;
  }
}
