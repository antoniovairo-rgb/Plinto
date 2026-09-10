/**
 * La scheda del risultato: il testo che si manda agli amici.
 *
 * E' il canale di crescita di un gioco che non fa pubblicita' e non ha un budget: se
 * qualcuno lo scopre, e' perche' qualcun altro gliel'ha mandato. Quindi questo testo ha
 * un compito preciso -- far venire voglia di provare -- e due divieti che vengono prima.
 *
 * 1. NIENTE SPOILER. Mai la sequenza dei pezzi, mai la griglia finale. Chi riceve il
 *    messaggio deve poter giocare LA STESSA sfida senza sapere gia' cosa arriva:
 *    altrimenti il collegamento che gli mandi e' proprio la cosa che glielo rovina.
 * 2. NIENTE TRACCIAMENTO. Nessun parametro di provenienza nell'indirizzo, nessun
 *    identificativo: il link e' quello della sfida e basta, uguale per tutti.
 *
 * LA RIGA DI BLOCCHI e' la forma della partita: il livello di Catena campionato a
 * intervalli regolari. E' l'elemento riconoscibile a colpo d'occhio -- due partite con
 * lo stesso punteggio hanno righe diverse -- ed e' DECORATIVA: ogni dato che contiene
 * esiste anche a parole nelle righe sopra. Chi legge con un lettore di schermo non perde
 * niente, e chi ha un font che disallinea i blocchi nemmeno.
 *
 * Tutto qui dentro e' puro: nessun DOM, nessuna data implicita, nessuna lettura di
 * storage. Si prova al 100% senza browser.
 */

import { CHAIN_MAX } from '../config/rules.js';

/** Gli otto gradini dei blocchi, dal piu' basso al piu' alto. */
const BLOCCHI = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/** Quante colonne ha la riga di blocchi. Sedici sta su una riga di chat ovunque. */
export const COLONNE_FORMA = 16;

/** Il limite oltre il quale il testo viene troncato dalle applicazioni di messaggistica. */
export const LIMITE = 280;

/**
 * La "forma della partita": la Catena campionata a intervalli regolari.
 *
 * Si campiona invece di comprimere perche' l'informazione che interessa e' l'andamento,
 * non il dettaglio: dove hai tenuto viva la Catena e dove l'hai persa. Una partita piu'
 * corta di COLONNE_FORMA mosse produce meno blocchi -- non si allunga con blocchi finti.
 *
 * @param {number[]} serie livello di Catena mossa per mossa
 * @returns {string} la riga di blocchi (vuota se non c'e' niente da disegnare)
 */
export function formaPartita(serie) {
  if (!Array.isArray(serie) || serie.length === 0) return '';
  const colonne = Math.min(COLONNE_FORMA, serie.length);
  const passo = serie.length / colonne;

  let riga = '';
  for (let i = 0; i < colonne; i += 1) {
    // Ogni colonna e' il MASSIMO della sua fetta: un picco di Catena e' un momento della
    // partita, e una media lo cancellerebbe proprio mentre si cerca di raccontarlo.
    const da = Math.floor(i * passo);
    const a = Math.max(da + 1, Math.floor((i + 1) * passo));
    let massimo = 0;
    for (let j = da; j < a && j < serie.length; j += 1) {
      massimo = Math.max(massimo, Number.isFinite(serie[j]) ? serie[j] : 0);
    }
    const quota = Math.max(0, Math.min(1, massimo / CHAIN_MAX));
    riga += BLOCCHI[Math.round(quota * (BLOCCHI.length - 1))];
  }
  return riga;
}

/**
 * Ricostruisce la serie della Catena da un istogramma.
 *
 * L'istogramma dice QUANTE mosse a ciascun livello, non IN CHE ORDINE: da lui si puo'
 * disegnare una forma plausibile ma non quella vera. Serve quando la serie mossa per
 * mossa non c'e' -- una partita ripresa da un salvataggio, per esempio -- e in quel caso
 * e' meglio una riga ordinata, che si vede subito essere un riassunto, che una riga
 * inventata che finge di essere la cronaca della partita.
 */
export function serieDaIstogramma(istogramma) {
  if (!Array.isArray(istogramma)) return [];
  const serie = [];
  istogramma.forEach((quante, livello) => {
    for (let i = 0; i < quante; i += 1) serie.push(livello);
  });
  return serie;
}

/** Numero con il separatore delle migliaia, senza dipendere dalla lingua dell'interfaccia. */
function numero(n, separatore) {
  return String(Math.round(Number.isFinite(n) ? n : 0))
    .replace(/\B(?=(\d{3})+(?!\d))/g, separatore);
}

/**
 * Il testo da condividere.
 *
 * @param {object} riepilogo output di `summarize()`
 * @param {object} contesto
 * @param {object} contesto.testi le sei etichette, gia' tradotte (vedi i18n)
 * @param {string} [contesto.giorno] il giorno della sfida, se e' una sfida
 * @param {string} [contesto.indirizzo] il collegamento da mettere in fondo
 * @param {number[]} [contesto.serie] la Catena mossa per mossa, se disponibile
 * @returns {string} sei righe, sempre sotto il limite
 */
export function formattaScheda(riepilogo, contesto = {}) {
  const r = riepilogo ?? {};
  const { testi = {}, giorno, indirizzo, serie } = contesto;
  const sep = testi.separatoreMigliaia ?? '.';

  const intestazione = giorno
    ? `${testi.gioco ?? 'PLINTO'} — ${testi.sfidaDel ?? 'Sfida del'} ${giorno}`
    : `${testi.gioco ?? 'PLINTO'} — ${testi.partitaLibera ?? 'Partita libera'}`;

  const gruppi = [
    `${testi.righe ?? 'Righe'} ${r.clearedRows ?? 0}`,
    `${testi.colonne ?? 'Colonne'} ${r.clearedCols ?? 0}`,
    `${testi.quadranti ?? 'Quadranti'} ${r.clearedQuadrants ?? 0}`,
  ].join(' · ');

  const forma = formaPartita(
    Array.isArray(serie) && serie.length > 0
      ? serie
      : serieDaIstogramma(r.istogrammaCatena),
  );

  const righe = [
    intestazione,
    `${numero(r.score, sep)} ${testi.punti ?? 'punti'} · ${numero(r.moves, sep)} ${testi.mosse ?? 'mosse'}`,
    `${testi.catenaMax ?? 'Catena max'} ${r.bestChain ?? 0} · ${testi.intrecciMax ?? 'Intreccio max'} ${r.bestIntreccio ?? 0}`,
    gruppi,
    `${testi.mossaMigliore ?? 'Mossa migliore'}: ${numero(r.bestMovePoints, sep)}`,
    forma,
    indirizzo ?? '',
  ].filter((riga) => riga !== '');

  const testo = righe.join('\n');
  // Il limite non si supera MAI: se lo si superasse, l'applicazione di messaggistica
  // taglierebbe proprio la fine, cioe' il collegamento -- che e' l'unica riga che serve
  // a chi riceve. Nel caso limite si toglie la forma, che e' decorativa per definizione.
  if (testo.length <= LIMITE) return testo;
  return righe.filter((riga) => riga !== forma).join('\n').slice(0, LIMITE);
}

/**
 * La scheda di un LIVELLO superato.
 *
 * Perche' non basta quella della partita libera. Nel percorso a livelli il punteggio
 * non e' il punto: due giocatori che superano il quadro 47 hanno fatto la stessa cosa,
 * e quello che li distingue e' in quante MOSSE ci sono riusciti. La scheda della
 * partita libera racconta i punti, e qui racconterebbe la cosa sbagliata.
 *
 * Che cosa dice, in ordine: quale livello, che cosa chiedeva, in quante mosse, e a che
 * punto sei del percorso. L'ultima riga e' quella che fa venire voglia di provare a chi
 * legge, perche' dice che i livelli sono cento e che tu sei a meta'.
 *
 * L'OBIETTIVO NON E' UNO SPOILER. Il divieto scritto in cima a questo file riguarda la
 * sequenza dei pezzi e la griglia finale, cioe' le cose che tolgono a chi riceve la
 * possibilita' di giocare la stessa partita. L'obiettivo di un livello e' la prima cosa
 * che il gioco stesso mostra quando quel livello si apre, ed e' anche l'unica che rende
 * comprensibile il vanto: "superato in 22 mosse" da solo non dice niente.
 *
 * @param {object} dati
 * @param {number} dati.numero        il numero del livello
 * @param {string} dati.obiettivo     l'obiettivo, gia' tradotto
 * @param {number} dati.mosse         le mosse usate
 * @param {boolean} [dati.record]     se e' il proprio record personale
 * @param {number} dati.superati      quanti livelli superati in tutto
 * @param {number} dati.totale        quanti livelli esistono
 * @param {object} contesto           come in `formattaScheda`
 */
export function formattaSchedaQuadro(dati = {}, contesto = {}) {
  const { testi = {}, indirizzo, serie } = contesto;
  const { numero: n = 0, obiettivo = '', mosse = 0, record = false } = dati;
  const superati = dati.superati ?? 0;
  const totale = dati.totale ?? 0;

  const inMosse = (testi.superatoIn ?? 'Superato in {mosse} mosse').replace('{mosse}', mosse);
  const righe = [
    `${testi.gioco ?? 'PLINTO'} — ${(testi.livello ?? 'Livello {n}').replace('{n}', n)}`,
    obiettivo,
    record ? `${inMosse} · ${testi.record ?? 'record personale'}` : inMosse,
    (testi.percorso ?? 'Percorso {fatti} di {totale}')
      .replace('{fatti}', superati).replace('{totale}', totale),
    formaPartita(serie),
    indirizzo ?? '',
  ].filter((riga) => riga !== '');

  const testo = righe.join('\n');
  if (testo.length <= LIMITE) return testo;
  return righe.filter((riga) => riga !== formaPartita(serie)).join('\n').slice(0, LIMITE);
}

/**
 * La scheda dell'AVANZAMENTO sul percorso, senza aver appena finito niente.
 *
 * Esiste perche' la condivisione a fine livello si puo' cogliere solo nell'istante in
 * cui quel livello finisce: chi vuole raccontare a che punto e' arrivato dovrebbe
 * rigiocare un livello apposta. Questa si prende dalla mappa, quando gli pare.
 *
 * LA BARRA E' FATTA COI BLOCCHI PIENI, non con i gradini della Catena. Sono due cose
 * diverse e devono sembrarlo: la forma della partita racconta un andamento, questa dice
 * quanta strada e' fatta. Usare gli stessi simboli per due significati diversi e' il
 * modo piu' rapido di rendere illeggibili tutte e due.
 */
export function formattaSchedaPercorso(dati = {}, contesto = {}) {
  const { testi = {}, indirizzo } = contesto;
  const superati = Math.max(0, dati.superati ?? 0);
  const totale = Math.max(1, dati.totale ?? 1);

  const pieni = Math.round((Math.min(superati, totale) / totale) * COLONNE_FORMA);
  const barra = '█'.repeat(pieni) + '▁'.repeat(COLONNE_FORMA - pieni);

  const righe = [
    `${testi.gioco ?? 'PLINTO'} — ${testi.percorsoTitolo ?? 'Il percorso'}`,
    (testi.livelliSu ?? '{fatti} livelli su {totale}')
      .replace('{fatti}', superati).replace('{totale}', totale),
    barra,
    indirizzo ?? '',
  ].filter((riga) => riga !== '');

  return righe.join('\n').slice(0, LIMITE);
}
