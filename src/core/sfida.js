/**
 * La Sfida del Giorno e il suo archivio.
 *
 * Il seme della partita e' la data: tutti quelli che giocano lo stesso giorno ricevono
 * la stessa griglia e la stessa sequenza di pezzi. Da qui discende una cosa che il
 * gioco non aveva ancora sfruttato: se il seme e' la data, allora **anche i giorni
 * passati sono giocabili**, e non perche' siano stati salvati da qualche parte -- non
 * esiste nessun archivio di contenuti -- ma perche' si possono ricalcolare. Chi
 * installa il gioco oggi trova mesi di partite invece di una sola.
 *
 * Tutto quello che sta qui dentro e' PURO: nessun DOM, nessun localStorage, nessuna
 * lettura dell'orologio se non attraverso il parametro `adesso`. Cosi' e' verificabile
 * a tavolino su qualunque data, compresi i giorni in cui le date si rompono di solito
 * (cambio dell'ora, 29 febbraio, fine anno).
 *
 * TRE DECISIONI DICHIARATE, tutte scritte anche in docs/GAMEPLAY_RULES.md:
 *
 * 1. IL GIORNO E' QUELLO LOCALE DEL DISPOSITIVO, non UTC. Chi gioca alle 23:30 sta
 *    giocando la sfida di oggi, non quella di domani. La conversione data -> giorno
 *    avviene in UN SOLO punto (`giornoDiOggi`), perche' due conversioni scritte in due
 *    posti diversi finiscono sempre per non essere d'accordo su qualche fuso.
 *
 * 2. IL FUTURO E' CHIUSO, IL PASSATO NO. Non si puo' aprire la sfida di domani: sarebbe
 *    un modo per arrivare preparati al giorno dopo, e toglierebbe l'unica cosa che
 *    rende la sfida una sfida. Il passato invece e' aperto senza limiti, fino a
 *    PRIMA_SFIDA.
 *
 * 3. L'OROLOGIO DEL DISPOSITIVO NON E' VERIFICABILE, e non proviamo a verificarlo.
 *    Senza un server non si puo': chiunque puo' spostare l'orologio avanti e aprire la
 *    sfida di domani. Non esiste una classifica globale da proteggere, quindi l'unico
 *    danno che uno si fa e' a se' stesso. Meglio dirlo che costruire una finta
 *    protezione che darebbe l'impressione di una garanzia inesistente.
 */

import { seedFromString } from './rng.js';

/**
 * Il primo giorno che ha una sfida.
 *
 * Non e' una data scelta a sentimento: e' il giorno in cui la Sfida del Giorno e'
 * entrata nel gioco (commit f31b2d5, 6 settembre 2026). Prima di quella data una
 * "sfida" non e' mai esistita, e offrirla sarebbe inventare un passato che non c'e'
 * stato: nessuno l'ha giocata quel giorno, quindi non e' la stessa partita per tutti,
 * che e' l'unica cosa che rende la sfida diversa da una partita libera con un seme.
 */
export const PRIMA_SFIDA = '2026-09-06';

/** Formato accettato: AAAA-MM-GG. */
const FORMATO = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Data locale in formato AAAA-MM-GG.
 *
 * LOCALE e non UTC, ed e' l'unico punto del gioco in cui una data diventa un giorno.
 * `toISOString()` darebbe il giorno UTC: alle 23:30 del 6 settembre in Italia sarebbe
 * gia' il 7, e il giocatore si vedrebbe cambiare la sfida sotto le mani mezz'ora prima
 * di mezzanotte.
 */
export function giornoDiOggi(adesso = new Date()) {
  const anno = adesso.getFullYear();
  const mese = String(adesso.getMonth() + 1).padStart(2, '0');
  const giorno = String(adesso.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giorno}`;
}

/**
 * La stringa e' un giorno vero del calendario?
 *
 * Non basta la forma: '2026-02-30' e '2026-13-01' hanno la forma giusta e non esistono.
 * Si costruisce la data e si controlla che i pezzi tornino, perche' `new Date(2026, 1, 30)`
 * non fallisce -- scivola al 2 marzo, in silenzio.
 */
export function giornoValido(giorno) {
  const m = FORMATO.exec(String(giorno ?? ''));
  if (!m) return false;
  const [, a, me, g] = m.map(Number);
  const data = new Date(a, me - 1, g);
  return data.getFullYear() === a && data.getMonth() === me - 1 && data.getDate() === g;
}

/**
 * Il seme della sfida di un giorno. Funzione pura: stesso giorno, stesso seme, sempre.
 *
 * E' un passaggio banale in una riga, e proprio per questo merita un nome e un posto
 * suo: e' il contratto su cui si regge tutto l'archivio. Finche' questa funzione non
 * cambia, la sfida del 12 marzo rigiocata fra un anno e' la stessa di oggi.
 */
export function semeDaData(giorno) {
  return seedFromString(giorno);
}

/**
 * Che tipo di giorno e' questo, rispetto a oggi.
 * @returns {'oggi'|'archivio'|'futura'|'preistoria'|'malformata'}
 */
export function tipoDiGiorno(giorno, oggi = giornoDiOggi()) {
  if (!giornoValido(giorno)) return 'malformata';
  if (giorno === oggi) return 'oggi';
  // Le date in formato AAAA-MM-GG si confrontano come stringhe: e' l'unico vantaggio
  // vero di questo formato, e vale piu' di qualunque libreria di date.
  if (giorno > oggi) return 'futura';
  if (giorno < PRIMA_SFIDA) return 'preistoria';
  return 'archivio';
}

/** Il giorno e' giocabile? Vero per oggi e per l'archivio, falso per tutto il resto. */
export function sfidaGiocabile(giorno, oggi = giornoDiOggi()) {
  const tipo = tipoDiGiorno(giorno, oggi);
  return tipo === 'oggi' || tipo === 'archivio';
}

/** Il giorno spostato di `giorni` (anche negativo). Attraversa mesi e anni da solo. */
export function giornoPiu(giorno, giorni) {
  const m = FORMATO.exec(giorno);
  if (!m) return giorno;
  const [, a, me, g] = m.map(Number);
  // Mezzogiorno e non mezzanotte: nei fusi in cui l'ora legale scatta all'una di notte,
  // una data costruita a mezzanotte piu' 24 ore puo' cadere sullo stesso giorno o
  // saltarne uno. A mezzogiorno l'ora spostata non basta a cambiare giorno.
  const data = new Date(a, me - 1, g, 12);
  data.setDate(data.getDate() + giorni);
  return giornoDiOggi(data);
}

/** Anno e mese (1-12) di un giorno. */
export function meseDi(giorno) {
  const m = FORMATO.exec(giorno);
  if (!m) return null;
  return { anno: Number(m[1]), mese: Number(m[2]) };
}

/** Il primo giorno di un mese, in formato AAAA-MM-GG. */
export function primoDelMese(anno, mese) {
  return `${anno}-${String(mese).padStart(2, '0')}-01`;
}

/** Quanti giorni ha il mese. Il giorno 0 del mese successivo e' l'ultimo di questo. */
export function giorniNelMese(anno, mese) {
  return new Date(anno, mese, 0).getDate();
}

/**
 * Il mese come lo disegna un calendario: righe da sette giorni, da lunedi' a domenica.
 * Le caselle prima del primo e dopo l'ultimo sono `null`.
 * @returns {(string|null)[][]}
 */
export function settimaneDelMese(anno, mese) {
  const quanti = giorniNelMese(anno, mese);
  // getDay(): 0 = domenica. In Italia la settimana comincia di lunedi'.
  const primoGiornoSettimana = (new Date(anno, mese - 1, 1).getDay() + 6) % 7;

  const celle = new Array(primoGiornoSettimana).fill(null);
  for (let g = 1; g <= quanti; g += 1) {
    celle.push(`${anno}-${String(mese).padStart(2, '0')}-${String(g).padStart(2, '0')}`);
  }
  while (celle.length % 7 !== 0) celle.push(null);

  const settimane = [];
  for (let i = 0; i < celle.length; i += 7) settimane.push(celle.slice(i, i + 7));
  return settimane;
}

/** Il mese spostato di `mesi` (anche negativo), come {anno, mese}. */
export function mesePiu(anno, mese, mesi) {
  const totale = (anno * 12 + (mese - 1)) + mesi;
  return { anno: Math.floor(totale / 12), mese: (totale % 12) + 1 };
}

/** Esiste almeno un giorno giocabile in questo mese? Serve a spegnere le frecce. */
export function meseHaSfide(anno, mese, oggi = giornoDiOggi()) {
  const ultimo = `${anno}-${String(mese).padStart(2, '0')}-${String(giorniNelMese(anno, mese)).padStart(2, '0')}`;
  const primo = primoDelMese(anno, mese);
  return ultimo >= PRIMA_SFIDA && primo <= oggi;
}
