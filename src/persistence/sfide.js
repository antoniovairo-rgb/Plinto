/**
 * Sfida del Giorno.
 *
 * Ogni giorno il seme della partita e' la data: tutti ricevono la stessa griglia e la
 * stessa sequenza di pezzi. E' l'unica forma di "evento ricorrente" del gioco, ed e'
 * volutamente povera di meccanica:
 *   - non c'e' un limite di tentativi (un tentativo solo, senza classifica, sarebbe
 *     solo frustrazione);
 *   - non c'e' nulla da sbloccare, nessuna ricompensa, nessuna valuta;
 *   - non c'e' una serie da mantenere e quindi non c'e' niente da "perdere" saltando
 *     un giorno. Le serie giornaliere funzionano perche' fanno paura, e questo gioco
 *     non usa la paura per farsi riaprire.
 * Resta solo il motivo onesto per tornare: oggi la partita e' la stessa per tutti e
 * puoi provare a giocarla meglio di ieri.
 *
 * Nessun dato lascia il dispositivo: non esiste classifica perche' non esiste server.
 */

import { read, write } from './storage.js';

const CHIAVE = 'sfide';

/** Quanti giorni di storico conservare. Oltre non serve e occupa spazio inutilmente. */
const GIORNI_CONSERVATI = 60;

/** Data locale in formato AAAA-MM-GG. Locale e non UTC: il "giorno" e' quello del giocatore. */
export function giornoDiOggi(adesso = new Date()) {
  const anno = adesso.getFullYear();
  const mese = String(adesso.getMonth() + 1).padStart(2, '0');
  const giorno = String(adesso.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giorno}`;
}

/** @returns {Record<string, {best:number, partite:number}>} */
export function caricaSfide() {
  const dati = read(CHIAVE, {});
  return dati && typeof dati === 'object' ? dati : {};
}

/** Risultato del giocatore per un giorno. */
export function sfidaDelGiorno(giorno = giornoDiOggi()) {
  return caricaSfide()[giorno] ?? { best: 0, partite: 0 };
}

/**
 * Registra una partita della sfida. Conserva solo il punteggio migliore del giorno.
 * @returns {{best:number, partite:number, nuovoRecordDiGiornata:boolean}}
 */
export function registraSfida(punteggio, giorno = giornoDiOggi()) {
  const tutte = caricaSfide();
  const precedente = tutte[giorno] ?? { best: 0, partite: 0 };
  const nuovoRecordDiGiornata = punteggio > precedente.best;

  tutte[giorno] = {
    best: Math.max(precedente.best, punteggio),
    partite: precedente.partite + 1,
  };

  // Potatura dello storico: si tengono solo i giorni piu' recenti.
  const giorni = Object.keys(tutte).sort();
  while (giorni.length > GIORNI_CONSERVATI) {
    delete tutte[giorni.shift()];
  }

  write(CHIAVE, tutte);
  return { ...tutte[giorno], nuovoRecordDiGiornata };
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
