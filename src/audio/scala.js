/**
 * La scala del gioco: dieci gradi, uno per ogni livello di Catena.
 *
 * IL SUONO NON DECORA, DICE. Il livello di Catena si deve capire a orecchio, senza
 * guardare la barra: sale di intonazione quando sale, scende quando scende. E' anche un
 * guadagno di accessibilita' vero, non solo un vezzo -- oggi quell'informazione passa
 * solo dagli occhi.
 *
 * PERCHE' UNA PENTATONICA MINORE DI LA. In una pentatonica qualunque combinazione di
 * note suona consonante: una raffica di eliminazioni ravvicinate resta piacevole invece
 * di diventare un frastuono, e non serve nessuna regola su quali note si possono
 * sovrapporre. La minore, invece della maggiore che il gioco usava prima, perche' con
 * dieci gradi la maggiore arrivava a suonare da carillon.
 *
 * LE FREQUENZE SONO CALCOLATE, NON TRASCRITTE. Temperamento equabile, La4 = 440 Hz:
 * ogni nota e' 440 * 2^(semitoni/12). Una tabella di numeri copiata a mano e' una
 * tabella in cui prima o poi c'e' un numero sbagliato, e un numero sbagliato qui non
 * rompe niente -- si limita a stonare, che e' il difetto che nessuno segnala.
 *
 * Tutto questo file e' PURO: nessun AudioContext, nessun oscillatore, niente browser.
 * Si prova a tavolino.
 */

import { CHAIN_MAX } from '../config/rules.js';

/** La4, il riferimento dell'accordatura. */
export const LA4 = 440;

/**
 * I dieci gradi, in semitoni rispetto al La4.
 * La3 Do4 Re4 Mi4 Sol4 La4 Do5 Re5 Mi5 Sol5 — pentatonica minore di La su due ottave.
 */
const SEMITONI = [-12, -9, -7, -5, -2, 0, 3, 5, 7, 10];

/** Frequenza di un numero di semitoni rispetto al La4. */
export function frequenzaDiSemitoni(semitoni) {
  return LA4 * (2 ** (semitoni / 12));
}

/**
 * La nota di un livello di Catena. Livello 0 -> La3, livello 9 -> Sol5.
 * Il livello viene limitato agli estremi: un valore fuori scala e' un difetto altrove,
 * e qui deve produrre una nota della scala, non un fischio.
 */
export function frequenzaDiCatena(livello) {
  const grado = Math.max(0, Math.min(SEMITONI.length - 1, Math.round(livello) || 0));
  return frequenzaDiSemitoni(SEMITONI[grado]);
}

/** Quanti gradi ha la scala. Deve coprire tutti i livelli di Catena, zero compreso. */
export const GRADI = SEMITONI.length;

/**
 * Di quanti semitoni si sale per ricominciare la scala dall'inizio.
 *
 * VENTIQUATTRO, cioe' DUE ottave, non dodici: questa scala parte dal La3 e arriva al
 * Sol5, quindi copre gia' due ottave. Salendo di dodici, il grado dopo il Sol5 sarebbe
 * il La4 -- piu' BASSO di dove eravamo -- e l'arpeggio, invece di salire, scenderebbe di
 * colpo a meta' della raffica. E' esattamente l'errore che aveva la prima versione di
 * questo file, e non l'avrei sentito: succede solo chiudendo quattro gruppi con la
 * Catena al massimo.
 */
const AMPIEZZA = 24;

/**
 * La frequenza di un grado qualsiasi, anche oltre l'ultimo: sopra la scala si ricomincia
 * dall'inizio due ottave sopra, restando sulle stesse note.
 */
export function frequenzaDiGrado(grado) {
  const g = Math.max(0, Math.round(grado) || 0);
  const giri = Math.floor(g / GRADI);
  return frequenzaDiSemitoni(SEMITONI[g % GRADI] + giri * AMPIEZZA);
}

/**
 * Le note di un Intreccio: un arpeggio ascendente di N note a partire dalla Catena
 * corrente. Chiudere riga + colonna + quadrante SUONA diverso da chiudere una riga sola,
 * ed e' l'unico modo che il gioco ha di dirlo senza scriverlo.
 *
 * L'arpeggio non esce mai dalla scala: sopra l'ultimo grado si sale di ottava restando
 * sulle stesse note, invece di inventarne di nuove.
 *
 * @param {number} gruppi quanti gruppi ha chiuso la mossa
 * @param {number} catena livello di Catena applicato
 * @returns {number[]} le frequenze, in ordine di esecuzione
 */
export function noteIntreccio(gruppi, catena) {
  const quante = Math.max(0, Math.round(gruppi) || 0);
  const partenza = Math.max(0, Math.min(GRADI - 1, Math.round(catena) || 0));
  const note = [];
  for (let i = 0; i < quante; i += 1) note.push(frequenzaDiGrado(partenza + i));
  return note;
}

/**
 * La nota della Catena che SCENDE: un grado sotto quello che si aveva.
 * Serve a far sentire la perdita senza punire -- e' una nota della scala, non un errore.
 */
export function frequenzaCatenaGiu(livelloPrecedente) {
  return frequenzaDiCatena(Math.max(0, (Math.round(livelloPrecedente) || 0) - 1));
}

/** Il livello di Catena piu' alto che la scala sa suonare. Deve coprire il regolamento. */
export const LIVELLO_MASSIMO = GRADI - 1;

if (LIVELLO_MASSIMO < CHAIN_MAX) {
  // Non e' un controllo di runtime per il giocatore: e' un errore di programmazione che
  // deve esplodere subito, perche' altrimenti i livelli piu' alti suonerebbero tutti
  // uguali e nessuno lo segnalerebbe mai.
  throw new Error(`La scala ha ${GRADI} gradi ma la Catena arriva a ${CHAIN_MAX}`);
}
