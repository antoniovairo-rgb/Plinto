/**
 * Dove si era il giocatore, e quando.
 *
 * PERCHE' ESISTE. Su Android PLINTO gira dentro una Trusted Web Activity, cioe' una
 * pagina di Chrome a tutto schermo. Quando l'app va in secondo piano il sistema puo'
 * buttare via quella pagina per liberare memoria, e alla riapertura la TWA la ricarica
 * da zero. Il gioco non puo' impedirlo -- non e' un'app nativa con uno stato suo -- ma
 * puo' ritrovarsi dov'era. Segnalato da chi ci gioca: "mettendo temporaneamente l'app in
 * secondo piano si perde la partita in corso, e' come se scadesse la sessione".
 *
 * MISURATO PRIMA DI SCRIVERE. Ricaricando la pagina a partita libera iniziata, la
 * partita c'era ancora (si salva a ogni mossa) ma l'app ripartiva dalla home: non si
 * perdeva il gioco, si perdeva il POSTO. Un livello invece spariva davvero, perche' non
 * veniva salvato da nessuna parte.
 *
 * LA FINESTRA, E PERCHE' NON E' "SEMPRE". Tornare dentro la partita ha senso se sei
 * stato via poco: una telefonata, una notifica, la spesa da pagare. Se riapri il gioco
 * il giorno dopo, ti aspetti il menu -- e ritrovarti dentro una partita di ieri, con la
 * griglia a meta' e un punteggio che non ricordi, e' una sorpresa, non una comodita'.
 * Due ore separano le due cose con un margine largo: piu' di qualunque interruzione, meno
 * di "sono tornato domani".
 *
 * NON E' IL SALVATAGGIO. La partita la salvano usePartita e useQuadro, a ogni mossa, e
 * resta li' comunque: il pulsante "Riprendi" in home continua a funzionare anche fuori
 * dalla finestra. Questo modulo risponde a una domanda sola, e piu' piccola: "ci devo
 * tornare da solo?".
 */

import { KEYS, read, write, remove } from './storage.js';

/**
 * Quanto puo' essere durata l'assenza perche' il gioco torni dentro da solo.
 *
 * Due ore. Non e' una misura, e' una scelta, e va detto: non esiste un dato che dica
 * dove finisce "mi hanno interrotto" e comincia "sono tornato piu' tardi". Il valore
 * sta qui, da solo, perche' cambiarlo sia una riga e non una caccia.
 */
export const FINESTRA_RIPRESA = 2 * 60 * 60 * 1000;

/** I posti in cui ha senso riportare il giocatore. */
const POSTI = ['gioco', 'sfida', 'quadro'];

/**
 * Segna dove si sta giocando adesso. Si chiama a ogni mossa: costa una scrittura in
 * localStorage, la stessa che gia' salva la partita accanto.
 */
export function segnaPosto(dove, quadro = null, adesso = Date.now()) {
  if (!POSTI.includes(dove)) return false;
  return write(KEYS.RIPRESA, { dove, quadro, quando: adesso });
}

/**
 * Dimentica il posto: il giocatore se n'e' andato di sua volonta', o la partita e'
 * finita. Da qui in poi il gioco riapre dalla home, come ha sempre fatto.
 */
export function dimenticaPosto() {
  return remove(KEYS.RIPRESA);
}

/**
 * Dove riprendere, se ha senso riprendere. `null` in tutti gli altri casi.
 *
 * Restituisce null anche per una voce scritta nel FUTURO: puo' capitare davvero, se
 * l'orologio del telefono viene spostato indietro, e un'assenza negativa non e' una cosa
 * di cui fidarsi. Meglio la home che una decisione presa su un dato assurdo.
 */
export function leggiRipresa(adesso = Date.now()) {
  const voce = read(KEYS.RIPRESA, null);
  if (!voce || !POSTI.includes(voce.dove)) return null;
  if (typeof voce.quando !== 'number' || !Number.isFinite(voce.quando)) return null;
  const assenza = adesso - voce.quando;
  if (assenza < 0 || assenza > FINESTRA_RIPRESA) return null;
  return { dove: voce.dove, quadro: voce.quadro ?? null, assenza };
}
