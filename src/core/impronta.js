/**
 * L'impronta delle regole: un numero che cambia quando cambia il gioco.
 *
 * PERCHE' SERVE. La sfida di un giorno passato viene RICALCOLATA, non ricaricata: dal
 * giorno si ottiene il seme, e dal seme la griglia e la sequenza dei pezzi. Questo vale
 * finche' le regole restano le stesse. Se cambia un peso in `shapes.js` o una costante
 * in `rules.js`, lo stesso seme produce una partita diversa: la sfida del 12 marzo
 * rigiocata dopo un aggiornamento non e' piu' quella che hanno giocato gli altri quel
 * giorno. E' inevitabile con un generatore deterministico, e non e' un difetto da
 * nascondere: e' una cosa da DIRE.
 *
 * COME. Invece di un numero di versione da alzare a mano -- che prima o poi qualcuno
 * dimentica di alzare, ed e' esattamente il caso in cui il dato diventa una bugia --
 * l'impronta e' CALCOLATA dai valori veri: tutte le costanti di regolamento e tutto il
 * catalogo delle forme. Cambiare un peso la cambia da sola; non cambiarla e' impossibile
 * se si e' cambiato qualcosa che conta.
 *
 * COSA COPRE: ogni costante NUMERICA esportata da `config/rules.js` -- numeri singoli e
 * strutture di soli numeri, come i punti base dei gruppi -- e, di ogni forma,
 * identificativo, celle e peso.
 *
 * PERCHE' SOLO I NUMERI. La prima versione prendeva tutto, con l'idea che abbondare fosse
 * piu' sicuro. Poi ho aggiunto a `rules.js` una costante che elenca i NOMI delle modalita'
 * di gioco -- niente che tocchi la generazione -- e l'impronta e' cambiata: il gioco
 * avrebbe marcato come "ottenuti con regole diverse" tutti i risultati passati di chi
 * gioca da settimane, per una modifica che non ha spostato una sola estrazione. Un avviso
 * sbagliato mostrato a tutti e' peggio di nessun avviso, perche' insegna a ignorarlo.
 *
 * La regola "solo valori numerici" e' meccanica e non richiede di decidere caso per caso
 * quali costanti contino: le soglie, i pesi, le probabilita' e i punteggi sono numeri, e
 * un'etichetta di testo non ha mai cambiato una partita. Se un giorno una costante di
 * testo entrasse davvero nella generazione, questa regola andrebbe rivista -- ed e'
 * scritto qui perche' chi la scrivesse lo legga.
 *
 * COSA NON E'. Non e' un controllo di integrita' e non protegge da niente: chi vuole
 * puo' modificarsela nel proprio storage. Serve solo a sapere se due partite sono state
 * generate dalle stesse regole.
 */

import * as REGOLE from '../config/rules.js';
import { SHAPES } from './shapes.js';
import { seedFromString } from './rng.js';

/** Il valore e' un numero, o una struttura fatta solo di numeri? */
function soloNumeri(valore) {
  if (typeof valore === 'number') return Number.isFinite(valore);
  if (Array.isArray(valore)) return valore.every(soloNumeri);
  if (valore && typeof valore === 'object') return Object.values(valore).every(soloNumeri);
  return false;
}

/** Rappresentazione stabile e ordinata di tutto cio' che influenza una partita. */
function materiale() {
  const costanti = Object.keys(REGOLE)
    .sort()
    .filter((chiave) => soloNumeri(REGOLE[chiave]))
    .map((chiave) => `${chiave}=${JSON.stringify(REGOLE[chiave])}`)
    .join(';');

  const forme = SHAPES
    .map((f) => `${f.id}:${f.weight}:${f.cells.map(([r, c]) => `${r},${c}`).join('|')}`)
    .sort()
    .join(';');

  return `${costanti}#${forme}`;
}

/**
 * L'impronta delle regole con cui gira questa copia del gioco.
 * Otto caratteri esadecimali: abbastanza da distinguere due versioni, abbastanza corta
 * da poter comparire in un salvataggio senza pesare.
 */
export const IMPRONTA_REGOLE = seedFromString(materiale()).toString(16).padStart(8, '0');
