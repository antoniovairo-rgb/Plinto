/**
 * Avanzamento nei Quadri.
 *
 * Si conserva il minimo indispensabile: quali Quadri sono stati superati e con quale
 * risultato migliore. Nessun punteggio globale, nessuna valuta, nessuna stellina da
 * collezionare: il senso di avanzare viene dal percorso, non da una moneta.
 *
 * Sblocco: si gioca il primo Quadro, e ogni Quadro successivo si apre superando il
 * precedente -- OPPURE dopo un certo numero di tentativi su quello prima. Niente
 * scorciatoie a pagamento perche' non esistono pagamenti, e niente attese perche' non
 * esistono timer.
 *
 * PERCHE' LA SECONDA VIA. Un percorso a catena ha un difetto che non si vede finche' non
 * capita: un solo livello che non riesce non rende difficile QUEL livello, chiude tutti
 * quelli dopo. Il generatore garantisce che nessun livello sia imbattibile per il
 * giocatore artificiale, ma il giocatore artificiale non e' una persona: la garanzia
 * copre il progetto dei livelli, non l'incontro fra un livello e chi lo gioca. La
 * differenza fra "difficile" e "tortura" non sta nell'esistenza di un muro, sta nel
 * fatto che il muro sia definitivo.
 *
 * COME, SENZA MENTIRE. Dopo abbastanza tentativi il livello successivo si apre, ma quello
 * NON risulta superato: niente spunta, non entra nel conteggio, e resta li' da riprendere
 * quando si vuole. Non e' un premio di consolazione travestito da vittoria -- e' la
 * strada che non si chiude.
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

/**
 * Quanti tentativi su uno stesso livello aprono comunque il successivo.
 *
 * Otto: abbastanza da voler dire "ci ho provato davvero" e non "mi e' andata male una
 * volta", pochi abbastanza da non trasformare la via d'uscita in una seconda tortura. Un
 * livello dura in media sedici mosse, quindi otto tentativi sono una decina di minuti
 * sullo stesso problema.
 */
export const TENTATIVI_PER_APRIRE = 8;

/**
 * Il Quadro e' stato superato almeno una volta?
 *
 * Si riconosce dal campo `mosse`, non dalla semplice presenza della voce: da quando i
 * tentativi si contano anche sui livelli mai superati, esiste una voce senza `mosse` che
 * dice soltanto "ci ha provato N volte". Confondere le due cose metterebbe la spunta di
 * superato su un livello che non lo e', ed e' esattamente la bugia che questa via
 * d'uscita non deve raccontare.
 */
export function quadroSuperato(numero, progressi = caricaProgressi()) {
  return Number.isFinite(progressi[numero]?.mosse);
}

/** Quante volte si e' provato un Quadro, superato o no. */
export function tentativiDi(numero, progressi = caricaProgressi()) {
  return progressi[numero]?.tentativi ?? 0;
}

/**
 * Il Quadro e' giocabile? Il primo lo e' sempre; gli altri dopo aver superato il
 * precedente, oppure dopo averci provato abbastanza volte.
 */
export function quadroSbloccato(numero, progressi = caricaProgressi()) {
  if (numero === 1) return true;
  return quadroSuperato(numero - 1, progressi)
    || tentativiDi(numero - 1, progressi) >= TENTATIVI_PER_APRIRE;
}

/** Il Quadro e' aperto SOLO perche' ci si e' provati tanto, senza averlo superato? */
export function apertoPerInsistenza(numero, progressi = caricaProgressi()) {
  return numero > 1
    && !quadroSuperato(numero - 1, progressi)
    && tentativiDi(numero - 1, progressi) >= TENTATIVI_PER_APRIRE;
}

/**
 * Il Quadro che il pulsante grande della home deve aprire: la FRONTIERA del percorso,
 * cioe' il livello aperto piu' avanti che non e' ancora stato superato.
 *
 * Era "il primo non superato", e sembrava la stessa cosa: lo era finche' un livello si
 * apriva soltanto superando il precedente. Da quando dopo otto tentativi si puo' andare
 * avanti lasciandone uno indietro, quella regola avrebbe riportato sul livello 5, a ogni
 * avvio e per sempre, chi il 5 lo ha lasciato e ha poi superato il 6, il 7 e l'8.
 *
 * La regola giusta non e' nemmeno "il livello aperto piu' avanti": quella spingerebbe
 * oltre gia' all'ottava sconfitta, mentre chi ha appena perso probabilmente vuole
 * riprovare -- e infatti sulla schermata di sconfitta il pulsante grande resta "Riprova".
 *
 * Qui si riparte da DOPO l'ultimo livello superato. Finche' non si e' vinto niente oltre
 * il 5, il "continua" resta il 5; appena si vince il 6, diventa il 7. Il livello lasciato
 * indietro non sparisce: resta nella mappa, senza spunta, da riprendere quando si vuole.
 * Semplicemente smette di essere il punto in cui si riprende.
 */
export function prossimoQuadro(totale, progressi = caricaProgressi()) {
  let ultimoSuperato = 0;
  for (let n = 1; n <= totale; n += 1) if (quadroSuperato(n, progressi)) ultimoSuperato = n;
  for (let n = ultimoSuperato + 1; n <= totale; n += 1) {
    if (!quadroSuperato(n, progressi)) return n;
  }
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
    // Un tentativo fallito viene contato SEMPRE, anche sul livello mai superato: e' il
    // conteggio che apre la via d'uscita, e prima si teneva solo per i livelli gia'
    // vinti -- cioe' proprio quelli che la via d'uscita non serve ad aprire. La voce che
    // ne nasce non ha `mosse`, quindi non vale come superata da nessuna parte.
    progressi[numero] = { ...(precedente ?? {}), tentativi };
    salva(progressi);
    return { salvati: progressi, miglioramento: false, primaVolta: false };
  }

  // "C'e' gia' una voce" non vuol dire "e' gia' stato superato": da quando i tentativi si
  // contano anche sui livelli mai vinti, esiste una voce con il solo conteggio. Confondere
  // le due cose costava la vittoria a chi ce la faceva dopo aver perso: il confronto
  // "meno mosse della volta scorsa" veniva fatto contro una volta scorsa che non esisteva,
  // dava falso, e il risultato buono non veniva scritto. Trovato da un test, non a occhio.
  const giaSuperato = Number.isFinite(precedente?.mosse);

  const meglio = !giaSuperato
    || mosse < precedente.mosse
    || (mosse === precedente.mosse && punteggio > precedente.punteggio);

  progressi[numero] = meglio
    ? { mosse, punteggio, tentativi }
    : { ...precedente, tentativi };

  salva(progressi);
  return { salvati: progressi, miglioramento: meglio && giaSuperato, primaVolta: !giaSuperato };
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

/** Quanti Quadri sono stati superati davvero. Le voci dei soli tentativi non contano. */
export function quantiSuperati(progressi = caricaProgressi()) {
  return Object.keys(progressi).filter((n) => quadroSuperato(n, progressi)).length;
}
