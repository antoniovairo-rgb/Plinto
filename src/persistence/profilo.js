/**
 * Il profilo di gioco: non quanto hai fatto, ma COME giochi.
 *
 * I record dicono il risultato migliore. Le statistiche di vita dicono i totali. Nessuno
 * dei due dice il MODO, ed e' l'unica cosa che un giocatore non puo' ricavare da solo:
 * per sapere che chiude quasi solo righe dovrebbe contarsele, partita dopo partita.
 *
 * AGGREGATO, NON ARCHIVIO. Qui dentro ci sono contatori e somme, non l'elenco delle
 * partite: la dimensione resta costante nel tempo, che una persona giochi dieci partite
 * o diecimila. L'unica eccezione sono le ultime venti partite, tenute per mostrare un
 * andamento; la ventunesima esce e non torna. Un gioco senza account che accumulasse
 * l'intero storico finirebbe per occupare spazio senza che nessuno l'abbia chiesto.
 *
 * QUALI PARTITE ENTRANO. Partita libera e Sfida del Giorno, cioe' le partite che
 * cominciano da una griglia vuota. I livelli NO, ed e' una scelta: partono da griglie
 * costruite a mano, con ostacoli in posizioni decise da noi, e falserebbero la mappa
 * degli appoggi facendola somigliare al disegno dei livelli invece che al modo di
 * giocare di chi la guarda. E' scritto anche nella schermata.
 *
 * `aggrega` e' PURA: prende il profilo di prima e il riepilogo di una partita, e
 * restituisce il profilo nuovo. Nessuna lettura di storage, nessuna data implicita.
 * Tutto il resto di questo file e' la sottile buccia che la collega al browser.
 */

import { KEYS } from './storage.js';
import { leggiDocumento, scriviDocumento, SENZA_VERSIONE } from './documenti.js';
import { distribuzioniVuote, normalizzaDistribuzioni } from '../core/distribuzioni.js';

/** Versione del documento del profilo. La 1 e' la prima forma che sia mai esistita. */
const VERSIONE = 1;

/** Quante partite recenti conservare per l'andamento. Oltre non serve a leggere una curva. */
export const ANDAMENTO_MAX = 20;

/** Un profilo a zero, con gli istogrammi della lunghezza giusta. */
export function profiloVuoto() {
  return {
    partite: 0,
    mosse: 0,
    pezzi: 0,
    punteggioTotale: 0,
    tempoTotaleMs: 0,
    migliorPunteggio: 0,
    migliorMossa: 0,
    migliorCatena: 0,
    migliorIntreccio: 0,
    righe: 0,
    colonne: 0,
    quadranti: 0,
    svuotamenti: 0,
    bombe: 0,
    celleEsplose: 0,
    andamento: [],
    ...distribuzioniVuote(),
  };
}

/** Somma due array della stessa lunghezza. Se le lunghezze non coincidono, vince la base. */
function sommaArray(base, aggiunta) {
  if (!Array.isArray(aggiunta) || aggiunta.length !== base.length) return base.slice();
  return base.map((n, i) => n + (Number.isFinite(aggiunta[i]) ? aggiunta[i] : 0));
}

/** Numero valido, altrimenti zero. Un riepilogo di una versione vecchia puo' non avere tutto. */
function n(valore) {
  return Number.isFinite(valore) ? valore : 0;
}

/**
 * Il profilo dopo una partita. Funzione pura.
 *
 * @param {object} precedente il profilo di prima (anche parziale, anche vuoto)
 * @param {object} riepilogo l'output di `summarize()` del motore
 * @returns {object} il profilo nuovo; quello ricevuto non viene toccato
 */
export function aggrega(precedente, riepilogo) {
  const base = { ...profiloVuoto(), ...(precedente ?? {}) };
  const distribuzioni = normalizzaDistribuzioni(base);
  const r = riepilogo ?? {};

  const andamento = [
    ...(Array.isArray(base.andamento) ? base.andamento : []),
    { punteggio: n(r.score), mosse: n(r.moves) },
  ].slice(-ANDAMENTO_MAX);

  return {
    partite: base.partite + 1,
    mosse: base.mosse + n(r.moves),
    pezzi: base.pezzi + n(r.piecesPlaced),
    punteggioTotale: base.punteggioTotale + n(r.score),
    tempoTotaleMs: base.tempoTotaleMs + n(r.durationMs),

    migliorPunteggio: Math.max(base.migliorPunteggio, n(r.score)),
    migliorMossa: Math.max(base.migliorMossa, n(r.bestMovePoints)),
    migliorCatena: Math.max(base.migliorCatena, n(r.bestChain)),
    migliorIntreccio: Math.max(base.migliorIntreccio, n(r.bestIntreccio)),

    righe: base.righe + n(r.clearedRows),
    colonne: base.colonne + n(r.clearedCols),
    quadranti: base.quadranti + n(r.clearedQuadrants),
    svuotamenti: base.svuotamenti + n(r.boardClears),
    bombe: base.bombe + n(r.bombeEsplose),
    celleEsplose: base.celleEsplose + n(r.celleEsplose),

    istogrammaCatena: sommaArray(distribuzioni.istogrammaCatena, r.istogrammaCatena),
    istogrammaIntreccio: sommaArray(distribuzioni.istogrammaIntreccio, r.istogrammaIntreccio),
    mappaAppoggi: sommaArray(distribuzioni.mappaAppoggi, r.mappaAppoggi),

    andamento,
  };
}

/**
 * La distribuzione della Catena come quote, pronte da confrontare.
 * Un profilo senza mosse restituisce `null`: una distribuzione di zero mosse non e'
 * piatta, non esiste, e disegnarla piatta racconterebbe una partita mai giocata.
 */
export function quoteCatena(profilo) {
  const istogramma = normalizzaDistribuzioni(profilo).istogrammaCatena;
  const totale = istogramma.reduce((s, x) => s + x, 0);
  if (totale === 0) return null;
  return istogramma.map((x) => x / totale);
}

/** Migrazione dalla forma senza versione: non e' mai esistita, ma il ramo c'e' lo stesso. */
function migra(dati, da) {
  return da === SENZA_VERSIONE ? dati : dati;
}

/** Il profilo salvato, sempre completo. */
export function caricaProfilo() {
  const documento = leggiDocumento(KEYS.PROFILO, {
    versione: VERSIONE, predefiniti: profiloVuoto(), migra,
  });
  // Gli istogrammi vanno normalizzati e non fusi alla cieca: un array della lunghezza
  // sbagliata passerebbe intatto e falserebbe ogni grafico costruito su di lui.
  return { ...documento, ...normalizzaDistribuzioni(documento) };
}

/**
 * Registra una partita conclusa nel profilo.
 * @returns {object} il profilo aggiornato
 */
export function registraPartita(riepilogo) {
  const nuovo = aggrega(caricaProfilo(), riepilogo);
  scriviDocumento(KEYS.PROFILO, VERSIONE, nuovo);
  return nuovo;
}

/** Cancella il profilo e basta: record, statistiche, livelli e sfide restano. */
export function azzeraProfilo() {
  return scriviDocumento(KEYS.PROFILO, VERSIONE, profiloVuoto());
}

/**
 * Il profilo come testo JSON, per il pulsante "esporta".
 *
 * Un gioco senza account che accumula statistiche deve dare la porta d'uscita senza
 * farla cercare: questi dati sono di chi gioca, e portarseli via non deve richiedere
 * di sapere dove il browser tiene lo storage.
 */
export function esportaProfilo(profilo = caricaProfilo()) {
  return JSON.stringify(profilo, null, 2);
}
