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

import { KEYS, RECORD_SEPARATI, chiaveRecord, read, remove, write } from './storage.js';
import { giornoValido } from '../core/sfida.js';
import { loadRecords, recordSfidaIniziale } from './records.js';

/**
 * Unendo, il record della Sfida non scende sotto il massimo dell'archivio delle sfide
 * (collaudo 1.21.8, D1). Spento, chi non ha ancora il documento `records-sfida` (era
 * sulla 1.21.7 e non ha chiuso una Sfida con la 1.21.8) fondeva con `null`, quindi
 * vinceva il file: archivio con 900, file con record 100, e Statistiche passava da 900 a
 * 100. Regola B7: il record della Sfida parte dal massimo dell'archivio. Interruttore
 * per la prova rosso/verde in `tests/correzioni-d1-d3.test.js` e `npm run correzioni`.
 */
export const RECORD_SFIDA_DALL_ARCHIVIO = true;

/**
 * «Sostituisci tutto» toglie i documenti locali che il file non contiene (collaudo
 * 1.21.8, D2). Spento, un file della 1.21.7 (senza `records-sfida`) lasciava il record
 * della Sfida, l'archivio e le statistiche di questo telefono mescolati a quelli del
 * file, mentre la conferma prometteva «resta solo quello che c'e' nel salvataggio».
 * Si tocca solo l'elenco DOCUMENTI, e non le impostazioni: partite a meta', ripresa,
 * origine e recensione restano. Interruttore per la prova rosso/verde come sopra.
 */
export const SOSTITUISCI_TOGLIE_ASSENTI = true;

/**
 * Record, statistiche e sfide gia' guasti in localStorage si ripuliscono in LETTURA
 * (collaudo 1.21.8, D3). C2 ripulisce solo all'importazione: chi aveva importato un file
 * guasto con la 1.21.7 o prima continuava a leggere «NaN» e «10 ott 99 (undefined)» in
 * Statistiche. Lo usano `records.js` e `sfide.js`. Interruttore come sopra.
 */
export const LETTURA_RIPULITA = true;

/**
 * Unendo, i gettoni degli attrezzi spesi non tornano (collaudo 1.21.6, B11). Spento, il
 * documento degli attrezzi si fonde come gli altri numeri, e `disponibili` prende il piu'
 * alto: esporti con 3 gettoni, li spendi, reimporti, e sono di nuovo 3. Interruttore per
 * la prova rosso/verde in `tests/salvataggio.test.js`.
 */
export const GETTONI_SPESI_NON_TORNANO = true;

/**
 * Una voce delle sfide senza `best` e `partite` numerici, o un attrezzo che non e' un
 * intero non negativo, si scarta importando (collaudo 1.21.7, C2). Spento, un giorno con
 * `best: '99'` entrava come `{regole: null}` e Statistiche scriveva «NaN (undefined)»;
 * `registraSfida` (in `sfide.js`) partiva da quella voce e salvava NaN. Interruttore per
 * la prova rosso/verde in `tests/salvataggio.test.js` e `npm run correzioni`.
 */
export const VOCI_GUASTE_SCARTATE = true;

/** Versione del FORMATO del file, non del gioco. Cambia solo se cambia la busta. */
export const FORMATO = 1;

/** Quello che vale la pena portarsi dietro. L'ordine e' quello del file, per leggibilita'. */
export const DOCUMENTI = [
  KEYS.PROGRESS,
  KEYS.ATTREZZI,
  chiaveRecord(),
  KEYS.RECORDS_SFIDA,
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
 * Gli attrezzi: `disponibili` e' un saldo, non un traguardo, e scende a ogni gettone
 * speso. Il "piu' alto vince" degli altri numeri qui restituisce i gettoni spesi dopo
 * l'esportazione (B11). Si tiene invece il documento che ha RISCOSSO di piu', cioe' quello
 * che ha convertito piu' livelli: e' l'unico confronto che dice chi e' andato piu' avanti.
 * A pari riscossione i due hanno guadagnato gli stessi gettoni, e quello con meno in mano
 * li ha spesi: vince il piu' basso. Cosi' un file vecchio non regala niente, e un file
 * da un telefono che ha convertito piu' livelli porta i suoi gettoni.
 */
function fondiAttrezzi(locale, entrante) {
  const unione = fondiNumeri(locale, entrante);
  const rL = Number.isFinite(locale?.riscossi) ? locale.riscossi : 0;
  const rE = Number.isFinite(entrante?.riscossi) ? entrante.riscossi : 0;
  const dL = Number.isFinite(locale?.disponibili) ? locale.disponibili : 0;
  const dE = Number.isFinite(entrante?.disponibili) ? entrante.disponibili : 0;
  const disponibili = rE > rL ? dE : rL > rE ? dL : Math.min(dL, dE);
  return { ...unione, disponibili, riscossi: Math.max(rL, rE) };
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

  if (chiave === KEYS.ATTREZZI && GETTONI_SPESI_NON_TORNANO) {
    return { ...fondiAttrezzi(locale, entrante), ...(versione ? { versione } : {}) };
  }

  return { ...fondiNumeri(locale, entrante), ...(versione ? { versione } : {}) };
}

const vuoto = (x) => !x || typeof x !== 'object' || Array.isArray(x);
export const numeroBuono = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

/** Solo i campi numerici sensati (piu' la versione del documento). */
function soloNumeri(documento) {
  const uscita = {};
  for (const [chiave, valore] of Object.entries(documento)) {
    if (chiave === 'versione' || numeroBuono(valore)) uscita[chiave] = valore;
  }
  return uscita;
}

/**
 * Ripulisce un documento entrante PRIMA di scriverlo.
 *
 * L'impronta garantisce che il file non si sia rovinato per strada, non che il contenuto
 * abbia senso: un file modificato a mano, con l'impronta ricalcolata, faceva comparire
 * «NaN» nel record e nelle statistiche e «Invalid Date» nello storico delle sfide
 * (collaudo 1.21.6, B9). Qui si tengono solo numeri veri e giorni veri; il resto si
 * scarta in silenzio, perche' non c'e' niente che il giocatore possa farci.
 */
function ripulisci(chiave, documento) {
  if (vuoto(documento)) return null;
  if (chiave === KEYS.STATS || chiave === chiaveRecord() || chiave === KEYS.RECORDS_SFIDA) return soloNumeri(documento);
  if (chiave === KEYS.CHALLENGES) {
    const giorni = {};
    for (const [giorno, voce] of Object.entries(vuoto(documento.giorni) ? {} : documento.giorni)) {
      if (!giornoValido(giorno) || vuoto(voce)) continue;
      if (VOCI_GUASTE_SCARTATE && !(numeroBuono(voce.best) && numeroBuono(voce.partite))) continue;
      giorni[giorno] = {
        ...soloNumeri(voce),
        regole: typeof voce.regole === 'string' ? voce.regole : null,
      };
    }
    return { ...documento, giorni };
  }
  if (chiave === KEYS.ATTREZZI && VOCI_GUASTE_SCARTATE) {
    // Sono gettoni: si contano a uno a uno. Un campo che non e' un intero non negativo
    // si scarta; se non ne resta nessuno, si scarta il documento.
    const uscita = {};
    for (const campo of ['disponibili', 'riscossi']) {
      if (Number.isInteger(documento[campo]) && documento[campo] >= 0) uscita[campo] = documento[campo];
    }
    if (!Object.keys(uscita).length) return null;
    return { ...(documento.versione !== undefined ? { versione: documento.versione } : {}), ...uscita };
  }
  return documento;
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
  const rimossi = [];

  for (const chiave of DOCUMENTI) {
    const entrante = ripulisci(chiave, salvataggio.dati?.[chiave]);
    if (!entrante) {
      // Le impostazioni sono del telefono: senza le loro nel file, restano quelle di qui.
      if (sostituisci && SOSTITUISCI_TOGLIE_ASSENTI && !SOLO_SE_SOSTITUISCI.has(chiave)
        && read(chiave, null) !== null && remove(chiave)) rimossi.push(chiave);
      continue;
    }
    if (!sostituisci && SOLO_SE_SOSTITUISCI.has(chiave)) continue;

    // Senza documento, il record della Sfida locale e' quello che Statistiche mostra: il
    // massimo dell'archivio (B7), non null. Con l'archivio vuoto resta null, e il
    // documento entra com'e' (lo vuole `tests/record-separati.test.js`).
    let locale = read(chiave, null);
    if (locale === null && RECORD_SFIDA_DALL_ARCHIVIO && RECORD_SEPARATI && chiave === KEYS.RECORDS_SFIDA
      && recordSfidaIniziale().best > 0) locale = loadRecords('sfida');
    const daScrivere = sostituisci ? entrante : fondiDocumento(chiave, locale, entrante);
    if (write(chiave, daScrivere)) scritti.push(chiave);
  }

  // L'archivio si fonde DOPO il record (ordine di DOCUMENTI): un giorno importato piu'
  // alto del record lo rialza. Solo se il documento c'e': senza, la lettura lo deriva.
  if (RECORD_SFIDA_DALL_ARCHIVIO && RECORD_SEPARATI) {
    const record = read(KEYS.RECORDS_SFIDA, null);
    const massimo = recordSfidaIniziale().best;
    if (record && typeof record === 'object' && massimo > 0 && !(numeroBuono(record.best) && record.best >= massimo)
      && write(KEYS.RECORDS_SFIDA, { ...record, best: massimo }) && !scritti.includes(KEYS.RECORDS_SFIDA)) {
      scritti.push(KEYS.RECORDS_SFIDA);
    }
  }

  return { scritti, rimossi, livelliPrima, livelliDopo: quantiLivelli(read(KEYS.PROGRESS, null)) };
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
