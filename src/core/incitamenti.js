/**
 * Che cosa dire al giocatore dopo una mossa.
 *
 * PERCHE' ESISTE. Il gioco sapeva gia' giudicare una mossa -- `moveTier` la classifica
 * da "buona" a "perfetta" -- ma mostrava quel giudizio come una parola sola, in
 * maiuscoletto, sopra i punti che volano via. Una parola non e' un incoraggiamento: e'
 * un'etichetta. E soprattutto restavano muti i momenti che un incoraggiamento lo
 * meriterebbero davvero, perche' non sono mosse ben fatte, sono SVOLTE: la griglia
 * ripulita del tutto, la Catena che arriva in cima, la risalita da un tabellone che
 * stava per chiudersi.
 *
 * PERCHE' E' UN MODULO PURO E SEPARATO. Sceglie solo la CATEGORIA del messaggio, non la
 * frase. La frase la pesca l'interfaccia, perche' le frasi sono piu' d'una per categoria
 * e vanno alternate: alla decima volta la stessa identica parola smette di essere un
 * elogio e diventa un tic. Tenendo qui solo la decisione, questa resta una funzione che
 * un test puo' interrogare senza montare niente.
 *
 * PERCHE' NON PESCA LA VARIANTE QUI. Servirebbe del caso, e il caso in questo gioco e'
 * seminato: `rngState` genera la sequenza dei pezzi, ed e' cio' che rende la sfida del
 * giorno identica per tutti. Un sorteggio di comodo fatto da qui consumerebbe quello
 * stesso flusso e cambierebbe i pezzi -- una frase decorativa che sposta la partita. La
 * variante si sceglie fuori dal motore, dove il caso non ha conseguenze.
 *
 * PERCHE' NON SI SCONTRA CON IL "RIMETTI A POSTO". Un incitamento nasce solo da una
 * mossa che ha eliminato qualcosa; `annullabile()` in engine.js e' vera solo per una
 * mossa che non ha eliminato NIENTE. Sono mutuamente esclusivi per costruzione, e per
 * questo possono dividersi la stessa riga di schermo senza contendersela mai.
 */

import { CHAIN_MAX } from '../config/rules.js';

/**
 * Quanto piena deve essere la griglia perche' la mossa dopo conti come recupero.
 * Sotto questa quota il tabellone non e' in affanno e "che recupero!" sarebbe una
 * bugia gentile, cioe' il tipo di elogio che insegna a non fidarsi degli elogi.
 *
 * MISURATA, NON SCELTA. La prima stesura metteva 0,62 a sentimento. Sul simulatore,
 * su 120 partite per profilo, il riempimento prima di una mossa ha mediana 28% e
 * novantanovesimo percentile 53%: una griglia al 62% capitava nello 0,1% delle mosse,
 * e insieme all'altra condizione il messaggio non usciva praticamente mai. Al 50% il
 * tabellone e' davvero stretto e capita nel 2% delle mosse, che e' la frequenza giusta
 * per una cosa che deve significare "ti sei salvato".
 */
export const AFFANNO = 0.50;

/**
 * Di quanto deve sgonfiarsi la griglia perche' sia un recupero e non un respiro.
 * Il calo mediano di una mossa che elimina e' 7,4 punti e il novantesimo percentile
 * 9,9: chiedere 10 punti voleva dire chiedere una mossa su dieci. Otto punti e' poco
 * sopra la mediana, cioe' "piu' del solito" senza essere eccezionale.
 */
export const RESPIRO = 0.08;

/**
 * I livelli di Catena che meritano una parola la prima volta che si raggiungono
 * in una partita. Il tetto della Catena e' CHAIN_MAX, quindi sono due gradini: uno
 * a meta' strada e la cima.
 */
export const TRAGUARDI_CATENA = [5, CHAIN_MAX];

/**
 * La categoria di messaggio per una mossa, o null se la mossa non ha niente da dire.
 *
 * L'ORDINE E' UNA CLASSIFICA, NON UN ELENCO. Una mossa puo' essere insieme una
 * "perfetta", un recupero e un traguardo di Catena: si dice UNA cosa sola, e si dice la
 * piu' rara. Misurate sul simulatore su 75.623 mosse: griglia svuotata 1 ogni 5.017
 * mosse, "perfetta" 1 ogni 328, Catena al massimo e recupero piu' spesso. Dire la piu'
 * rara significa che il messaggio grosso non viene mai rubato da uno piccolo.
 *
 * @param {object|null} lastMove il campo `lastMove` dello stato dopo la mossa
 * @returns {null|{categoria: string, livello: 1|2|3|4}}
 */
export function incitamento(lastMove) {
  if (!lastMove) return null;
  if ((lastMove.groups?.length ?? 0) <= 0) return null;

  // 1. La griglia ripulita del tutto: il colpo piu' raro del gioco.
  if (lastMove.boardCleared) return { categoria: 'svuotata', livello: 4 };

  // 2. L'intreccio massimo. Per costruzione di `moveTier` non lo si ottiene senza.
  if (lastMove.tier === 'perfetta') return { categoria: 'perfetta', livello: 4 };

  // 3. La Catena che arriva in cima, LA PRIMA VOLTA DELLA PARTITA. Vale piu' di una
  //    mossa eccellente perche' e' il risultato di una serie, non di un colpo: dice
  //    "stai tenendo il ritmo". Il confronto e' con il record della partita e non con
  //    la Catena della mossa prima, e la differenza non e' un dettaglio: la Catena
  //    tocca il tetto, cala di un livello alla prima mossa a vuoto e risale subito
  //    dopo. Misurato, festeggiare ogni risalita voleva dire festeggiare una volta
  //    ogni ventuno mosse -- cioe' trasformare il traguardo piu' alto in sottofondo.
  if (lastMove.chainAfter >= CHAIN_MAX && (lastMove.catenaMigliorePrima ?? 0) < CHAIN_MAX) {
    return { categoria: 'catenaMassima', livello: 4 };
  }

  if (lastMove.tier === 'eccellente') return { categoria: 'eccellente', livello: 3 };

  // 4. Il recupero: la griglia era in affanno e questa mossa l'ha fatta respirare.
  //    Sta sopra "ottima" di proposito. Una mossa media fatta con il tabellone quasi
  //    chiuso vale piu' di una mossa buona fatta in mezzo al vuoto, e chi gioca lo sa
  //    gia': il messaggio serve a dargli ragione, non a informarlo.
  if (lastMove.fillBefore >= AFFANNO && lastMove.fillBefore - lastMove.fillAfter >= RESPIRO) {
    return { categoria: 'recupero', livello: 3 };
  }

  // 5. Gli altri traguardi di Catena, quelli intermedi. Stesso criterio: la prima
  //    volta della partita, non ogni volta che ci si ripassa.
  const traguardo = TRAGUARDI_CATENA.find(
    (soglia) => lastMove.chainAfter >= soglia && (lastMove.catenaMigliorePrima ?? 0) < soglia,
  );
  if (traguardo !== undefined) return { categoria: 'catena', livello: 2, catena: traguardo };

  if (lastMove.tier === 'ottima') return { categoria: 'ottima', livello: 2 };
  return { categoria: 'buona', livello: 1 };
}
