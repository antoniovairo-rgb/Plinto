/**
 * Portare via il salvataggio, e riportarlo indietro.
 *
 * PERCHE' ESISTE. Tutto quello che il gioco ricorda sta nel browser di chi gioca: nessun
 * account, nessun server, nessuna copia da nessun'altra parte. E' una scelta dichiarata
 * nella prima riga del readme, e ha un prezzo che nessuno vede finche' non capita:
 * cancellare i dati del sito, cambiare telefono o disinstallare l'applicazione butta via
 * i cento livelli superati. Il prezzo cresce con il gioco: quando i livelli saranno
 * duecento, perderli varra' il doppio.
 *
 * Questo modulo non toglie quel prezzo, lo rende pagabile: un file, che si porta dove si
 * vuole e si rimette quando serve. NON e' una sincronizzazione, e non va raccontata come
 * tale: protegge chi si ricorda di esportare.
 *
 * COSA ENTRA NEL FILE. Quello che costa fatica: livelli superati, record, statistiche,
 * profilo di gioco, archivio delle sfide, impostazioni. NON entrano le partite lasciate a
 * meta' ne' il segnaposto della ripresa. Sono roba del momento, legata a una sessione: in
 * un file di salvataggio diventerebbero un livello a meta' che l'altro telefono non
 * ricorda di aver iniziato.
 *
 * LA REGOLA CHE NON SI ROMPE. Reimportare un file vecchio non deve MAI cancellare
 * progressi piu' recenti. Per questo l'unione e' il comportamento normale e la
 * sostituzione integrale e' una scelta esplicita: chi esporta oggi e importa fra un mese
 * su un telefono dove ha continuato a giocare si aspetta di non perdere niente, e ha
 * ragione.
 *
 * NIENTE E' UNA SOMMA. Unendo si tiene il valore migliore, mai la somma: un file importato
 * due volte raddoppierebbe le partite giocate, e un numero che cresce da solo e' peggio di
 * un numero fermo. La conseguenza da dire in chiaro: unendo due telefoni su cui si e'
 * giocato davvero, i totali non si sommano.
 */

import { KEYS, chiaveRecord, read, write } from './storage.js';

/** Versione del FORMATO del file, non del gioco. Cambia solo se cambia la busta. */
export const FORMATO = 1;

/** Quello che vale la pena portarsi dietro. L'ordine e' quello del file, per leggibilita'. */
export const DOCUMENTI = [
  KEYS.PROGRESS,
  chiaveRecord(),
  KEYS.STATS,
  KEYS.PROFILO,
  KEYS.CHALLENGES,
  KEYS.SETTINGS,
];

/**
 * Le impostazioni sono di QUESTO telefono, non del giocatore: tema, lingua, animazioni.
 * Unendo restano quelle locali -- importare un salvataggio non deve cambiare il tema a
 * chi lo stava usando. Sostituendo tutto invece arrivano anche loro, perche' la' si sta
 * chiedendo di ripristinare un telefono com'era.
 */
const SOLO_SE_SOSTITUISCI = new Set([KEYS.SETTINGS]);

/**
 * Impronta del contenuto (FNV-1a a 32 bit, in esadecimale).
 *
 * Serve a una cosa sola: accorgersi che il file e' stato troncato o modificato a mano,
 * e rifiutarlo con un messaggio invece di far entrare dati rotti nel salvataggio. NON e'
 * una firma e non protegge da chi vuole barare: chi vuole cambiarsi i record puo'
 * ricalcolarsela, e va benissimo cosi'. Il nemico qui e' il file corrotto, non il furbo.
 */
export function impronta(valore) {
  const testo = canonico(valore);
  let h = 0x811c9dc5;
  for (let i = 0; i < testo.length; i += 1) {
    h ^= testo.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

/** JSON con le chiavi in ordine: due oggetti uguali devono dare la stessa impronta. */
function canonico(valore) {
  if (valore === null || typeof valore !== 'object') return JSON.stringify(valore) ?? 'null';
  if (Array.isArray(valore)) return `[${valore.map(canonico).join(',')}]`;
  const chiavi = Object.keys(valore).sort();
  return `{${chiavi.map((k) => `${JSON.stringify(k)}:${canonico(valore[k])}`).join(',')}}`;
}

/**
 * Il salvataggio di adesso, pronto da scrivere su file.
 * I documenti mai creati non compaiono: un file con dentro dei null non e' piu' completo,
 * e' solo piu' difficile da leggere.
 */
export function componiSalvataggio({ versioneGioco, adesso = Date.now() } = {}) {
  const dati = {};
  for (const chiave of DOCUMENTI) {
    const documento = read(chiave, null);
    if (documento && typeof documento === 'object') dati[chiave] = documento;
  }
  return {
    gioco: 'plinto',
    formato: FORMATO,
    versioneGioco: versioneGioco ?? null,
    esportatoIl: new Date(adesso).toISOString(),
    impronta: impronta(dati),
    dati,
  };
}

/** Il file come testo, indentato: chi lo apre deve poterci capire qualcosa. */
export function serializza(salvataggio) {
  return `${JSON.stringify(salvataggio, null, 2)}\n`;
}

/**
 * Legge un file e dice se e' accettabile, senza toccare niente.
 * @returns {{ok:true, salvataggio:object}|{ok:false, motivo:string}}
 *   `motivo` e' una chiave di traduzione, non una frase: il messaggio lo sceglie chi mostra.
 */
export function leggiSalvataggio(testo) {
  let busta;
  try { busta = JSON.parse(testo); } catch { return { ok: false, motivo: 'illeggibile' }; }
  if (!busta || typeof busta !== 'object' || Array.isArray(busta)) return { ok: false, motivo: 'illeggibile' };
  if (busta.gioco !== 'plinto') return { ok: false, motivo: 'altroGioco' };
  // Un formato piu' NUOVO di quello che questa versione conosce non si prova nemmeno ad
  // aprire: leggerlo a meta' e' il modo migliore di perdere quello che si voleva salvare.
  if (!Number.isInteger(busta.formato) || busta.formato > FORMATO) return { ok: false, motivo: 'formatoIgnoto' };
  if (!busta.dati || typeof busta.dati !== 'object' || Array.isArray(busta.dati)) return { ok: false, motivo: 'illeggibile' };
  if (busta.impronta !== impronta(busta.dati)) return { ok: false, motivo: 'rovinato' };
  return { ok: true, salvataggio: busta };
}

/** Il migliore fra due risultati su uno stesso livello: meno mosse, poi piu' punti. */
function migliorLivello(locale, entrante) {
  const tentativi = Math.max(locale?.tentativi ?? 0, entrante?.tentativi ?? 0);
  const localeVinto = Number.isFinite(locale?.mosse);
  const entranteVinto = Number.isFinite(entrante?.mosse);
  if (!entranteVinto) return { ...(locale ?? {}), tentativi };
  if (!localeVinto) return { ...entrante, tentativi };
  const meglio = entrante.mosse < locale.mosse
    || (entrante.mosse === locale.mosse && (entrante.punteggio ?? 0) > (locale.punteggio ?? 0));
  return { ...(meglio ? entrante : locale), tentativi };
}

/** Numeri: vince il piu' alto. Mai la somma (vedi la nota in testa al file). */
function fondiNumeri(locale, entrante) {
  const uscita = { ...locale };
  for (const [chiave, valore] of Object.entries(entrante ?? {})) {
    if (chiave === 'versione') continue;
    const mio = locale?.[chiave];
    if (typeof valore === 'number' && Number.isFinite(valore)) {
      uscita[chiave] = typeof mio === 'number' && Number.isFinite(mio) ? Math.max(mio, valore) : valore;
    } else if (mio === undefined) {
      uscita[chiave] = valore;
    }
  }
  return uscita;
}

/**
 * Fonde un documento entrante sopra quello locale.
 *
 * Si parte SEMPRE dal locale: cosi' un campo che questa versione del gioco non conosce,
 * o che il file piu' vecchio non aveva, non sparisce. Il file entrante puo' solo
 * migliorare quello che c'e', mai toglierlo.
 */
function fondiDocumento(chiave, locale, entrante) {
  if (!entrante || typeof entrante !== 'object') return locale;
  if (!locale || typeof locale !== 'object') return entrante;
  const versione = Math.max(locale.versione ?? 0, entrante.versione ?? 0) || undefined;

  if (chiave === KEYS.PROGRESS) {
    const livelli = { ...(locale.livelli ?? {}) };
    for (const [numero, voce] of Object.entries(entrante.livelli ?? {})) {
      livelli[numero] = migliorLivello(livelli[numero], voce);
    }
    return { ...locale, ...(versione ? { versione } : {}), livelli };
  }

  if (chiave === KEYS.CHALLENGES) {
    const giorni = { ...(locale.giorni ?? {}) };
    for (const [giorno, voce] of Object.entries(entrante.giorni ?? {})) {
      giorni[giorno] = fondiNumeri(giorni[giorno] ?? {}, voce);
    }
    return { ...locale, ...(versione ? { versione } : {}), giorni };
  }

  return { ...fondiNumeri(locale, entrante), ...(versione ? { versione } : {}) };
}

/**
 * Mette il salvataggio nel gioco.
 *
 * @param {object} salvataggio gia' passato da leggiSalvataggio()
 * @param {{sostituisci?:boolean}} opzioni sostituisci = butta via quello che c'e' adesso
 * @returns {{scritti:string[], livelliPrima:number, livelliDopo:number}}
 */
export function applicaSalvataggio(salvataggio, { sostituisci = false } = {}) {
  const livelliPrima = quantiLivelli(read(KEYS.PROGRESS, null));
  const scritti = [];

  for (const chiave of DOCUMENTI) {
    const entrante = salvataggio.dati?.[chiave];
    if (!entrante || typeof entrante !== 'object') continue;
    if (!sostituisci && SOLO_SE_SOSTITUISCI.has(chiave)) continue;

    const daScrivere = sostituisci ? entrante : fondiDocumento(chiave, read(chiave, null), entrante);
    if (write(chiave, daScrivere)) scritti.push(chiave);
  }

  return { scritti, livelliPrima, livelliDopo: quantiLivelli(read(KEYS.PROGRESS, null)) };
}

/** Quanti livelli risultano superati in un documento dei progressi. */
export function quantiLivelli(documento) {
  const livelli = documento?.livelli;
  if (!livelli || typeof livelli !== 'object') return 0;
  return Object.values(livelli).filter((v) => Number.isFinite(v?.mosse)).length;
}

/** Il nome del file: leggibile, ordinabile, senza caratteri che i sistemi non amano. */
export function nomeFile(adesso = Date.now()) {
  const g = new Date(adesso).toISOString().slice(0, 10);
  return `plinto-salvataggio-${g}.json`;
}
