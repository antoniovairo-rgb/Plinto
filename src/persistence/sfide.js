/**
 * I risultati delle Sfide del Giorno, giorno per giorno.
 *
 * La sfida e' volutamente povera di meccanica:
 *   - non c'e' un limite di tentativi (un tentativo solo, senza classifica, sarebbe
 *     solo frustrazione);
 *   - non c'e' nulla da sbloccare, nessuna ricompensa, nessuna valuta;
 *   - non c'e' una serie da mantenere e quindi non c'e' niente da "perdere" saltando
 *     un giorno. Le serie giornaliere funzionano perche' fanno paura, e questo gioco
 *     non usa la paura per farsi riaprire. Vale anche per l'archivio: rigiocare un
 *     giorno passato non recupera niente, perche' non c'era niente da perdere.
 * Resta solo il motivo onesto per tornare: oggi la partita e' la stessa per tutti e
 * puoi provare a giocarla meglio di ieri.
 *
 * QUI NON SI SALVANO PARTITE, SOLO RISULTATI. Le sfide passate non sono conservate:
 * vengono ricalcolate dal giorno (vedi `core/sfida.js`). Quello che sta qui e' una riga
 * per ogni giorno giocato -- punteggio migliore, tentativi, impronta delle regole -- e
 * un anno di gioco quotidiano resta nell'ordine delle decine di kilobyte. C'e' un test
 * che lo misura su 365 giorni invece di fidarsi di questa frase.
 *
 * NIENTE PIU' POTATURA. Fino alla 0.5.2 lo storico veniva tagliato ai 60 giorni piu'
 * recenti, per un'idea di risparmio che non regge il conto: un archivio che dimentica
 * dopo due mesi non e' un archivio, ed e' proprio l'archivio la ragione per cui questi
 * dati esistono. I risultati piu' vecchi restano.
 *
 * Nessun dato lascia il dispositivo: non esiste classifica perche' non esiste server.
 */

import { KEYS } from './storage.js';
import { leggiDocumento, scriviDocumento } from './documenti.js';
import { IMPRONTA_REGOLE } from '../core/impronta.js';
import { giornoDiOggi } from '../core/sfida.js';

const CHIAVE = KEYS.CHALLENGES;

/**
 * Versione del documento delle sfide.
 *
 *   1 -> i giorni entrano in un contenitore (`{versione, giorni}`), perche' un campo
 *        `versione` accanto alle date sarebbe diventato un giorno di nome "versione".
 *   2 -> ogni giorno porta l'impronta delle regole con cui e' stato ottenuto quel
 *        punteggio. I risultati piu' vecchi non ce l'hanno e non se la possono
 *        inventare: restano con `regole: null`, che vuol dire "non lo so" ed e'
 *        un'informazione onesta, al contrario di un'impronta messa a caso.
 */
const VERSIONE = 2;

/** Migrazione dalle forme precedenti. Non perde un solo risultato. */
function migra(dati, da) {
  const giorni = da === 0 ? dati : (dati.giorni ?? {});
  const conImpronta = {};
  for (const [giorno, voce] of Object.entries(giorni ?? {})) {
    if (!voce || typeof voce !== 'object') continue;
    conImpronta[giorno] = { regole: null, ...voce };
  }
  return { giorni: conImpronta };
}

/** Il documento completo, sempre nella forma corrente. */
function documento() {
  return leggiDocumento(CHIAVE, { versione: VERSIONE, predefiniti: { giorni: {} }, migra });
}

/** @returns {Record<string, {best:number, partite:number, regole:string|null}>} */
export function caricaSfide() {
  const giorni = documento().giorni;
  return giorni && typeof giorni === 'object' ? giorni : {};
}

/** Risultato del giocatore per un giorno. */
export function sfidaDelGiorno(giorno = giornoDiOggi()) {
  return caricaSfide()[giorno] ?? { best: 0, partite: 0, regole: null };
}

/**
 * Registra una partita della sfida. Conserva solo il punteggio migliore del giorno.
 *
 * L'impronta si aggiorna solo quando il punteggio migliora: un record vecchio deve
 * restare accompagnato dalle regole con cui e' stato ottenuto, altrimenti l'unica cosa
 * che l'impronta serve a dire -- "questi due punteggi non sono confrontabili" --
 * diventerebbe falsa proprio nel caso in cui serve.
 *
 * @returns {{best:number, partite:number, regole:string|null, nuovoRecordDiGiornata:boolean}}
 */
export function registraSfida(punteggio, giorno = giornoDiOggi()) {
  const tutte = caricaSfide();
  const precedente = tutte[giorno] ?? { best: 0, partite: 0, regole: null };
  const nuovoRecordDiGiornata = punteggio > precedente.best;

  tutte[giorno] = {
    best: Math.max(precedente.best, punteggio),
    partite: precedente.partite + 1,
    regole: nuovoRecordDiGiornata ? IMPRONTA_REGOLE : (precedente.regole ?? null),
  };

  scriviDocumento(CHIAVE, VERSIONE, { giorni: tutte });
  return { ...tutte[giorno], nuovoRecordDiGiornata };
}

/**
 * Il punteggio di quel giorno e' stato ottenuto con le regole di adesso?
 *
 * `null` quando non si puo' dire: nessun punteggio, oppure un risultato salvato prima
 * che l'impronta esistesse. "Non lo so" e "sono diverse" sono due cose diverse, e
 * confonderle farebbe comparire un avviso su ogni risultato vecchio di chi gioca da
 * mesi -- che e' il modo piu' rapido di rendere un avviso invisibile.
 */
export function regoleCoincidono(voce) {
  if (!voce || !voce.regole) return null;
  return voce.regole === IMPRONTA_REGOLE;
}

/** Gli ultimi giorni giocati, dal piu' recente. Usato dalla schermata statistiche. */
export function storicoSfide(quanti = 14) {
  const tutte = caricaSfide();
  return Object.keys(tutte)
    .sort()
    .reverse()
    .slice(0, quanti)
    .map((giorno) => ({ giorno, ...tutte[giorno] }));
}

/** Quanti giorni sono stati giocati in tutto. Serve all'intestazione dell'archivio. */
export function giorniGiocati() {
  return Object.keys(caricaSfide()).length;
}
