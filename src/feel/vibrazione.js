/**
 * Vibrazione (haptics).
 *
 * L'API Vibration esiste solo su una parte dei dispositivi, quindi ogni chiamata e'
 * protetta e l'assenza di vibrazione non e' mai un errore. I pattern sono volutamente
 * BREVI: una vibrazione lunga durante un gioco che si tocca in continuazione diventa
 * fastidiosa nel giro di due minuti e fa spegnere l'opzione.
 */

let attiva = true;

export function impostaVibrazione(accesa) {
  attiva = accesa;
}

function vibra(pattern) {
  if (!attiva) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Un dispositivo che non vibra non e' un problema da segnalare.
  }
}

/** Pezzo appoggiato: il minimo percettibile. */
export function vibraAppoggio() { vibra(8); }

/** Mossa rifiutata: due tocchi brevissimi, leggibili come "no". */
export function vibraRifiuto() { vibra([12, 40, 12]); }

/** Eliminazione: intensita' proporzionale ai gruppi chiusi, con un tetto. */
export function vibraEliminazione(gruppi) {
  if (gruppi <= 1) vibra(18);
  else if (gruppi === 2) vibra([18, 45, 18]);
  else vibra([22, 40, 22, 40, 30]);
}

/** Esplosione di bombe: un colpo solo, piu' lungo con piu' bombe. */
export function vibraEsplosione(bombe = 1) {
  vibra(Math.min(70, 26 + bombe * 16));
}

/** Nuovo record o griglia svuotata. */
export function vibraCelebrazione() { vibra([30, 60, 30, 60, 60]); }

/** Fine partita. */
export function vibraFinePartita() { vibra(90); }
