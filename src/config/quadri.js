/**
 * I Quadri di PLINTO, opera per opera.
 *
 * QUESTO FILE NON E' GENERATO. I livelli stanno in src/config/opere/, un file per opera,
 * scritto da tools/genera-quadri.mjs; qui si mettono in fila e si risponde alle domande
 * che il resto del gioco fa sui livelli (quale opera, quale atto, quanti sono).
 *
 * PERCHE' UN FILE PER OPERA. Il seme di ogni livello dipende solo dal suo numero e i
 * progressi sono salvati per numero: per aggiungere la Torre non si deve rigenerare il
 * Ponte, che cambierebbe livelli gia' giocati e superati. Con un file per opera il
 * generatore scrive solo quello dell'opera nuova, e tests/opere.test.js controlla che i
 * cento livelli del Ponte restino quelli pubblicati.
 */

import * as ponte from './opere/ponte.js';
import * as torre from './opere/torre.js';

/**
 * L'ordine e' quello in cui si giocano. Il nome di ogni opera sta nelle traduzioni,
 * sotto "opere.<id>", per la stessa ragione degli atti.
 */
const ELENCO = [
  ['ponte', ponte],
  ['torre', torre],
];

for (const [id, opera] of ELENCO) {
  if (opera.MODALITA_TARATURA !== ponte.MODALITA_TARATURA) {
    throw new Error(`L'opera "${id}" e' tarata in un'altra modalita' (${opera.MODALITA_TARATURA})`);
  }
}

/** La modalita' di gioco in cui i bersagli di tutte le opere sono stati misurati. */
export const MODALITA_TARATURA = ponte.MODALITA_TARATURA;

export const QUADRI = ELENCO.flatMap(([, opera]) => opera.QUADRI);

/**
 * Gli atti di tutte le opere, in fila, ognuno con l'opera a cui appartiene.
 *
 * Qui c'e' l'IDENTIFICATIVO, non il nome: il nome visibile sta nelle traduzioni, sotto
 * "atti.<id>".
 */
export const ATTI = ELENCO.flatMap(([id, opera]) => opera.ATTI.map((atto) => ({ ...atto, opera: id })));

/**
 * Le opere: i gruppi di livelli, ognuno con i suoi atti. Dove comincia e dove finisce
 * ciascuna si ricava dai suoi livelli, cosi' quel confine non e' scritto in due posti.
 */
export const OPERE = ELENCO.map(([id, opera]) => ({
  id,
  da: opera.QUADRI[0].numero,
  a: opera.QUADRI[opera.QUADRI.length - 1].numero,
}));

/** @param {number} numero */
export function quadroNumero(numero) {
  return QUADRI.find((q) => q.numero === numero) ?? null;
}

/**
 * L'opera a cui appartiene un Quadro.
 * Esiste per la stessa ragione di `attoDelQuadro`: chi deve NOMINARE il gruppo non deve
 * sapere dove comincia e dove finisce, altrimenti quel confine finisce scritto in due
 * posti e uno dei due invecchia.
 */
export function operaDelQuadro(numero) {
  return OPERE.find((o) => numero >= o.da && numero <= o.a) ?? OPERE[OPERE.length - 1];
}

/** L'opera che viene dopo, o null se questa e' l'ultima. */
export function operaSuccessiva(opera) {
  const i = OPERE.findIndex((o) => o.id === opera.id);
  return i >= 0 && i < OPERE.length - 1 ? OPERE[i + 1] : null;
}

/** L'opera che viene prima, o null se questa e' la prima. */
export function operaPrecedente(opera) {
  const i = OPERE.findIndex((o) => o.id === opera.id);
  return i > 0 ? OPERE[i - 1] : null;
}

/** Quanti livelli ha un'opera. */
export function livelliDellOpera(opera) {
  return opera.a - opera.da + 1;
}

/** Gli atti di un'opera, nell'ordine in cui si giocano. */
export function attiDellOpera(opera) {
  return ATTI.filter((a) => a.opera === opera.id);
}

/** L'atto a cui appartiene un Quadro. */
export function attoDelQuadro(numero) {
  return ATTI.find((a) => numero >= a.da && numero <= a.a) ?? ATTI[ATTI.length - 1];
}

export const TOTALE_QUADRI = QUADRI.length;
