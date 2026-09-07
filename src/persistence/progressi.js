/**
 * Avanzamento nei Quadri.
 *
 * Si conserva il minimo indispensabile: quali Quadri sono stati superati e con quale
 * risultato migliore. Nessun punteggio globale, nessuna valuta, nessuna stellina da
 * collezionare: il senso di avanzare viene dal percorso, non da una moneta.
 *
 * Sblocco: si gioca il primo Quadro, e ogni Quadro successivo si apre superando il
 * precedente. Niente scorciatoie a pagamento perche' non esistono pagamenti, e niente
 * attese perche' non esistono timer.
 */

import { KEYS } from './storage.js';
import { leggiDocumento, scriviDocumento } from './documenti.js';

/**
 * Versione del documento dell'avanzamento.
 *
 * Come per le sfide, alla 1 i livelli finiscono dentro un campo `livelli` invece di
 * stare nudi nell'oggetto: un campo `versione` accanto ai numeri dei livelli sarebbe
 * stato contato come un livello superato da `quantiSuperati`. La migrazione dalla
 * forma precedente non perde nessun progresso.
 */
const VERSIONE = 1;

/** Dalla mappa nuda dei livelli alla forma con contenitore. */
function migra(dati, da) {
  if (da === 0) return { livelli: dati };
  return dati;
}

/** Salva la mappa dei livelli nella forma corrente. */
function salva(livelli) {
  return scriviDocumento(KEYS.PROGRESS, VERSIONE, { livelli });
}

/** @returns {Record<string, {mosse:number, punteggio:number, tentativi:number}>} */
export function caricaProgressi() {
  const livelli = leggiDocumento(
    KEYS.PROGRESS, { versione: VERSIONE, predefiniti: { livelli: {} }, migra },
  ).livelli;
  return livelli && typeof livelli === 'object' ? livelli : {};
}

/** Il Quadro e' stato superato almeno una volta? */
export function quadroSuperato(numero, progressi = caricaProgressi()) {
  return Boolean(progressi[numero]);
}

/** Il Quadro e' giocabile? Il primo lo e' sempre; gli altri dopo il precedente. */
export function quadroSbloccato(numero, progressi = caricaProgressi()) {
  return numero === 1 || quadroSuperato(numero - 1, progressi);
}

/** Il primo Quadro non ancora superato: e' quello che il giocatore vuole aprire. */
export function prossimoQuadro(totale, progressi = caricaProgressi()) {
  for (let n = 1; n <= totale; n += 1) if (!quadroSuperato(n, progressi)) return n;
  return totale;   // percorso finito: si torna sull'ultimo
}

/**
 * Registra un tentativo. Conserva il risultato migliore: meno mosse a parita' di
 * successo, e a parita' di mosse il punteggio piu' alto.
 *
 * Il campo con la mappa salvata si chiama `salvati` e NON `progressi`. Si chiamava
 * cosi', e ha causato un difetto che ha portato allo schermo nero: `statoQuadro()`
 * restituisce anche lei un campo `progressi`, ma e' un ARRAY (le righe "obiettivo: 3
 * su 5"), mentre questo e' un OGGETTO (la mappa dei livelli superati). Fusi in un
 * unico oggetto di esito, il secondo sovrascriveva il primo, e la schermata di
 * sconfitta -- l'unica che quelle righe le disegna -- chiamava .map() su un oggetto.
 * Vincendo non succedeva niente, perdendo il gioco si spegneva.
 *
 * Due nomi uguali per due cose diverse nello stesso oggetto: il tipo di errore che
 * nessuno vede rileggendo, perche' ogni singolo pezzo e' giusto.
 *
 * @returns {{salvati:object, miglioramento:boolean, primaVolta:boolean}}
 */
export function registraTentativo(numero, { superato, mosse, punteggio }) {
  const progressi = caricaProgressi();
  const precedente = progressi[numero] ?? null;
  const tentativi = (precedente?.tentativi ?? 0) + 1;

  if (!superato) {
    // Anche un tentativo fallito viene contato, ma non crea un record dal nulla.
    if (precedente) progressi[numero] = { ...precedente, tentativi };
    salva(progressi);
    return { salvati: progressi, miglioramento: false, primaVolta: false };
  }

  const meglio = !precedente
    || mosse < precedente.mosse
    || (mosse === precedente.mosse && punteggio > precedente.punteggio);

  progressi[numero] = meglio
    ? { mosse, punteggio, tentativi }
    : { ...precedente, tentativi };

  salva(progressi);
  return { salvati: progressi, miglioramento: meglio && Boolean(precedente), primaVolta: !precedente };
}

/**
 * Cancella tutto l'avanzamento nei livelli e riporta al livello 1.
 *
 * Tocca SOLO i livelli. Record della partita libera, statistiche e Sfida del Giorno
 * restano dove sono: chi vuole rigiocare il percorso da capo non sta chiedendo di
 * buttare via mesi di partite. Per cancellare tutto c'e' gia' "Azzera i miei dati"
 * nelle impostazioni, ed e' giusto che siano due cose distinte.
 */
export function azzeraProgressi() {
  salva({});
}

/** Quanti Quadri sono stati superati. */
export function quantiSuperati(progressi = caricaProgressi()) {
  return Object.keys(progressi).filter((n) => progressi[n]).length;
}
