/**
 * CACCIA AI DIFETTI DEL MOTORE: partite a caso con TUTTE le azioni del giocatore mescolate.
 *
 *   node tools/caccia-bug.mjs [partite] [seme]     (predefiniti: 300 e 20260923)
 *
 * Il simulatore (src/sim) serve a tarare, e gioca sempre e solo con placePiece. Le prove
 * delle invarianti fanno lo stesso. Nessuno dei due mescola le mosse con carriola,
 * piccone, mensola, gessetto e salvataggio/ripresa, che e' proprio dove si annidano i
 * difetti di confine: il bug della mensola sull'ultimo pezzo della terna ne e' la prova.
 *
 * Qui ogni passo sceglie a caso un'azione -- anche illegale, anche su partita finita -- e
 * dopo ogni passo si controllano le invarianti. Un difetto si stampa con modalita', seme
 * e numero di passo, cosi' si riproduce con lo stesso comando.
 *
 * Esce con codice 1 se trova anche un solo difetto.
 */

import {
  createGame, placePiece, cambiaPezzo, scavaCella, appoggiaSullaMensola,
  riprendiDallaMensola, serializeGame, deserializeGame, restaUnaMossa, annullabile,
  canPlaceHandPiece, summarize,
} from '../src/core/engine.js';
import { findCompletedGroups, filledCount, canPlace, allPlacements, CELL_COUNT } from '../src/core/grid.js';
import { getShape } from '../src/core/shapes.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../src/core/quadro.js';
import { suggerisciMossa } from '../src/core/suggerimento.js';
import { QUADRI } from '../src/config/quadri.js';
import { CHAIN_MAX, HAND_SIZE, MODALITA, VALORE_BOMBA, COLOR_COUNT } from '../src/config/rules.js';

import { pathToFileURL } from 'node:url';

const PASSI_MAX = 600;
const ORA = 1_700_000_000_000;

/** Generatore delle AZIONI, separato da quello della partita. */
function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let difetti = new Map();   // firma -> {conta, primo}
let tentate = {};
function difetto(firma, dove, dettaglio) {
  const voce = difetti.get(firma);
  if (voce) { voce.conta += 1; return; }
  difetti.set(firma, { conta: 1, primo: { ...dove, dettaglio } });
}

/** JSON con le chiavi in ordine: due oggetti uguali devono dare la stessa stringa. */
function canonico(v) {
  if (Array.isArray(v)) return v.map(canonico);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v).sort().map((k) => [k, canonico(v[k])]));
  }
  return v;
}

/** Il salvataggio senza uid, che vengono da un contatore globale e non dal seme. */
function impronta(stato) {
  const s = serializeGame(stato);
  const via = (p) => (p ? { ...p, uid: 0 } : null);
  return JSON.stringify(canonico({
    ...s, hand: s.hand.map(via), mensola: via(s.mensola),
    manoSuccessiva: s.manoSuccessiva ? s.manoSuccessiva.map(via) : null,
  }));
}

function pezzoValido(p) {
  if (p === null) return true;
  if (!p || typeof p !== 'object') return false;
  let forma;
  try { forma = getShape(p.shapeId); } catch { return false; }
  return forma && p.shape && p.shape.id === forma.id
    && Number.isInteger(p.color) && p.color >= 1 && p.color <= COLOR_COUNT
    && Array.isArray(p.bombe ?? []);
}

/** Tutte le invarianti di uno stato, qualunque strada lo abbia prodotto. */
function controllaStato(s, dove, celleIniziali, scavate) {
  const g = s.grid;
  if (!(g instanceof Uint8Array) || g.length !== CELL_COUNT) difetto('griglia-forma', dove, g?.length);
  for (let i = 0; i < g.length; i += 1) {
    const v = g[i];
    const ok = v === 0 || (v >= 1 && v <= COLOR_COUNT) || (v > VALORE_BOMBA && v <= VALORE_BOMBA + COLOR_COUNT);
    if (!ok) { difetto('griglia-valore', dove, { i, v }); break; }
  }
  if (!Array.isArray(s.hand) || s.hand.length !== HAND_SIZE) difetto('mano-lunghezza', dove, s.hand?.length);
  if (!s.hand.every(pezzoValido)) difetto('mano-pezzo', dove, s.hand);
  if (!pezzoValido(s.mensola ?? null)) difetto('mensola-pezzo', dove, s.mensola);

  // Uid distinti fra mano, mensola e anteprima: lo stesso pezzo in due posti e' una copia.
  const uid = [...s.hand, s.mensola, ...(s.manoSuccessiva ?? [])].filter(Boolean).map((p) => p.uid);
  if (new Set(uid).size !== uid.length) difetto('pezzo-duplicato', dove, uid);

  if (s.status !== 'playing' && s.status !== 'over') difetto('status-ignoto', dove, s.status);
  const vivo = restaUnaMossa(g, s.hand, s.mensola ?? null);
  if (s.status === 'playing' && !vivo) difetto('in-gioco-senza-mosse', dove, null);
  if (s.status === 'over' && vivo) difetto('finita-con-mosse', dove, null);
  if (s.status === 'playing' && s.hand.every((p) => p === null)) difetto('mano-vuota-in-gioco', dove, null);
  if (s.status === 'over' && s.endedAt == null) difetto('finita-senza-ora', dove, null);
  if (s.status === 'playing' && s.endedAt != null) difetto('in-gioco-con-ora-fine', dove, s.endedAt);

  if (!Number.isInteger(s.score) || s.score < 0) difetto('punteggio-non-intero', dove, s.score);
  if (!Number.isInteger(s.chain) || s.chain < 0 || s.chain > CHAIN_MAX) difetto('catena-fuori', dove, s.chain);
  if (!Number.isInteger(s.chainDigiuno) || s.chainDigiuno < 0) difetto('digiuno-fuori', dove, s.chainDigiuno);

  // Dopo qualunque azione non resta sulla griglia un gruppo pieno: si svuota subito.
  if (findCompletedGroups(g).length > 0) difetto('gruppo-pieno-rimasto', dove, findCompletedGroups(g).map((x) => x.type + x.index));

  const st = s.stats;
  if (st.moves !== st.piecesPlaced) difetto('mosse-vs-pezzi', dove, [st.moves, st.piecesPlaced]);
  if ((st.serieCatena ?? []).length !== st.moves) difetto('serie-catena', dove, [st.serieCatena?.length, st.moves]);
  const somma = (a) => a.reduce((x, y) => x + y, 0);
  if (somma(st.istogrammaCatena) !== st.moves) difetto('istogramma-catena', dove, null);
  if (somma(st.istogrammaIntreccio) !== st.moves) difetto('istogramma-intreccio', dove, null);
  if (somma(st.mappaAppoggi) !== st.moves) difetto('mappa-appoggi', dove, null);
  if (st.bestChain > CHAIN_MAX) difetto('record-catena', dove, st.bestChain);

  // Conservazione delle celle: quelle sulla griglia sono le iniziali, piu' le appoggiate,
  // meno le eliminate, meno quelle tolte col piccone.
  const attese = celleIniziali + st.cellsPlaced - st.clearedCells - scavate;
  if (filledCount(g) !== attese) difetto('celle-non-tornano', dove, { griglia: filledCount(g), attese });

  if (s.modalita === MODALITA.ANTEPRIMA) {
    if (!Array.isArray(s.manoSuccessiva) || s.manoSuccessiva.length !== HAND_SIZE || s.manoSuccessiva.some((p) => !p)) {
      difetto('anteprima-mancante', dove, s.manoSuccessiva);
    }
  } else if (s.manoSuccessiva != null) difetto('anteprima-in-base', dove, null);
}

/** I percorsi dei campi che differiscono fra due oggetti JSON (i primi cinque). */
function differenze(a, b, via = '', out = []) {
  if (out.length >= 5 || JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) differenze(a[k], b[k], `${via}.${k}`, out);
  } else out.push(`${via}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
  return out;
}

/** Salvataggio e ripresa: la copia ripresa deve essere indistinguibile. */
function controllaRipresa(s, dove) {
  const json = JSON.parse(JSON.stringify(serializeGame(s)));
  const ripresa = deserializeGame(json);
  if (!ripresa) { difetto('ripresa-rifiutata', dove, null); return null; }
  if (impronta(ripresa) !== impronta(s)) difetto('ripresa-diversa', dove, differenze(JSON.parse(impronta(s)), JSON.parse(impronta(ripresa))));
  return ripresa;
}

/** Sceglie una mossa legale a caso (null se non ce n'e'). */
function mossaACaso(s, rnd) {
  const opzioni = [];
  s.hand.forEach((p, i) => {
    if (!p) return;
    for (const [row, col] of allPlacements(s.grid, p.shape)) opzioni.push([i, row, col]);
  });
  return opzioni.length ? opzioni[Math.floor(rnd() * opzioni.length)] : null;
}

/**
 * Una partita. `quadro` e' facoltativo: se c'e', si gioca dentro il livello.
 * Restituisce il numero di passi fatti.
 */
function giocaUna({ modalita, seme, quadro }, rnd, contatori) {
  let s = quadro
    ? iniziaQuadro(quadro, { now: ORA })
    : createGame({ seed: seme, modalita, now: ORA });
  const celleIniziali = filledCount(s.grid);
  let scavate = 0;
  let prevStato = quadro ? statoQuadro(quadro, s) : null;
  const etichetta = quadro ? `livello ${quadro.numero}` : `${modalita} seme ${seme}`;
  controllaStato(s, { etichetta, passo: 0, azione: 'inizio' }, celleIniziali, 0);

  for (let passo = 1; passo <= PASSI_MAX; passo += 1) {
    const prima = s;
    const r = rnd();
    let azione;
    let dopo = s;
    const finita = s.status !== 'playing';

    if (r < 0.62) {
      // Mossa legale, oppure (1 volta su 12) una illegale che deve lasciare tutto com'era.
      if (rnd() < 1 / 12) {
        azione = 'mossa-illegale';
        const i = Math.floor(rnd() * HAND_SIZE);
        const row = Math.floor(rnd() * 11) - 1;
        const col = Math.floor(rnd() * 11) - 1;
        const p = s.hand[i];
        const legale = p && s.status === 'playing' && row >= 0 && col >= 0 && canPlace(s.grid, p.shape, row, col);
        if (legale) { azione = 'mossa'; }
        dopo = quadro ? giocaNelQuadro(quadro, s, i, row, col, ORA) : placePiece(s, i, row, col, ORA);
        if (!legale && dopo !== s) difetto('illegale-accettata', { etichetta, passo, azione }, { i, row, col });
        if (legale && canPlaceHandPiece(s, i, row, col) !== true) difetto('canPlace-discorde', { etichetta, passo }, null);
      } else {
        azione = 'mossa';
        const m = mossaACaso(s, rnd);
        if (m) dopo = quadro ? giocaNelQuadro(quadro, s, m[0], m[1], m[2], ORA) : placePiece(s, ...m, ORA);
        else if (s.status === 'playing' && !s.mensola) difetto('nessuna-mossa-in-gioco', { etichetta, passo }, null);
      }
    } else if (r < 0.70) {
      azione = 'carriola';
      const x = cambiaPezzo(s, Math.floor(rnd() * HAND_SIZE));
      if (x) dopo = x; else if (!finita && x === null) { /* slot vuoto: nessun pagamento */ }
      if (x && finita) difetto('carriola-a-partita-finita', { etichetta, passo }, null);
    } else if (r < 0.78) {
      azione = 'piccone';
      const piene = [];
      for (let i = 0; i < s.grid.length; i += 1) if (s.grid[i]) piene.push(i);
      const bersaglio = rnd() < 0.85 && piene.length
        ? piene[Math.floor(rnd() * piene.length)]
        : Math.floor(rnd() * 90) - 4;
      const x = scavaCella(s, bersaglio);
      if (x) {
        dopo = x; scavate += 1;
        if (finita) difetto('piccone-a-partita-finita', { etichetta, passo }, null);
      } else if (!finita && s.grid[bersaglio] > 0) difetto('piccone-rifiutato', { etichetta, passo }, bersaglio);
    } else if (r < 0.86) {
      azione = 'mensola-appoggia';
      const x = appoggiaSullaMensola(s, Math.floor(rnd() * HAND_SIZE));
      if (x) { dopo = x; if (finita || s.mensola) difetto('appoggia-non-dovuto', { etichetta, passo }, null); }
    } else if (r < 0.92) {
      azione = 'mensola-riprendi';
      const x = riprendiDallaMensola(s, Math.floor(rnd() * HAND_SIZE));
      if (x) { dopo = x; if (finita || !s.mensola) difetto('riprendi-non-dovuto', { etichetta, passo }, null); }
    } else if (r < 0.96) {
      azione = 'ripresa';
      const x = controllaRipresa(s, { etichetta, passo, azione });
      if (x) dopo = x;
    } else {
      azione = 'gessetto';
      if (quadro) {
        const prima = impronta(s);
        const m = suggerisciMossa(quadro, s);
        if (impronta(s) !== prima) difetto('gessetto-modifica', { etichetta, passo }, null);
        const m2 = suggerisciMossa(quadro, s);
        if (JSON.stringify(m) !== JSON.stringify(m2)) difetto('gessetto-non-deterministico', { etichetta, passo }, [m, m2]);
        if (m && !canPlaceHandPiece(s, m.handIndex, m.row, m.col)) difetto('gessetto-illegale', { etichetta, passo }, m);
        if (!m && s.status === 'playing' && s.hand.some((p, i) => p && allPlacements(s.grid, p.shape).length)) {
          contatori.gessettoMuto = (contatori.gessettoMuto ?? 0) + 1;
        }
      }
    }
    contatori[azione] = (contatori[azione] ?? 0) + (dopo !== s ? 1 : 0);
    tentate[azione] = (tentate[azione] ?? 0) + 1;

    const dove = { etichetta, passo, azione };
    controllaStato(dopo, dove, celleIniziali, scavate);

    // Regole di cio' che ogni azione PUO' toccare.
    const pa = prima.stats; const da = dopo.stats;
    if (dopo !== prima && azione !== 'mossa' && azione !== 'mossa-illegale') {
      if (dopo.score !== prima.score || da.moves !== pa.moves || dopo.chain !== prima.chain) {
        difetto(`attrezzo-tocca-punti:${azione}`, dove, null);
      }
    }
    if (azione === 'carriola' && dopo !== prima) {
      const cambiati = dopo.hand.filter((p, i) => p?.uid !== prima.hand[i]?.uid).length;
      if (cambiati !== 1) difetto('carriola-cambia-altro', dove, cambiati);
      if (impronta({ ...dopo, hand: prima.hand, rngState: prima.rngState, shapeHistory: prima.shapeHistory }) !== impronta(prima)) {
        difetto('carriola-tocca-altro', dove, null);
      }
    }
    if (azione === 'mensola-riprendi' && dopo !== prima && dopo.stats.handsDealt !== pa.handsDealt) {
      difetto('riprendi-rifornisce', dove, null);
    }
    if (azione === 'mossa' && dopo !== prima) {
      if (da.moves !== pa.moves + 1) difetto('mossa-non-conta', dove, null);
      if (dopo.score <= prima.score) difetto('mossa-senza-punti', dove, [prima.score, dopo.score]);
      if (dopo.lastMove?.points !== dopo.score - prima.score) difetto('punti-lastMove', dove, null);
      // In anteprima la terna nuova e' ESATTAMENTE quella che si vedeva.
      if (dopo.lastMove?.handRefilled && prima.modalita === MODALITA.ANTEPRIMA) {
        const visti = prima.manoSuccessiva.map((p) => p.uid).join();
        if (dopo.hand.map((p) => p?.uid).join() !== visti) difetto('anteprima-tradita', dove, null);
      }
      if (annullabile(prima, dopo) && ((dopo.lastMove.groups?.length ?? 0) > 0 || dopo.status !== 'playing')) {
        difetto('annulla-concesso-male', dove, null);
      }
    }
    if (azione === 'mensola-appoggia' && dopo !== prima && prima.modalita === MODALITA.ANTEPRIMA
      && prima.hand.filter(Boolean).length === 1) {
      const visti = prima.manoSuccessiva.map((p) => p.uid).join();
      if (dopo.hand.map((p) => p?.uid).join() !== visti) difetto('anteprima-tradita-mensola', dove, null);
    }

    if (quadro) {
      const st = statoQuadro(quadro, dopo);
      st.progressi.forEach((p, i) => {
        if (p.fatto < 0 || p.fatto > p.quanti || !Number.isFinite(p.fatto)) difetto('quadro-progresso', dove, p);
        if (p.fatto < prevStato.progressi[i].fatto) difetto('quadro-progresso-cala', dove, [prevStato.progressi[i], p]);
      });
      if (st.mosseRimaste !== null && (st.mosseRimaste < 0 || !Number.isInteger(st.mosseRimaste))) difetto('quadro-mosse', dove, st.mosseRimaste);
      if (prevStato.finito && dopo.stats.moves !== prima.stats.moves) difetto('quadro-mossa-dopo-fine', dove, null);
      if (st.completato && st.fallito) difetto('quadro-vinto-e-perso', dove, null);
      // Un livello non ancora finito con la partita chiusa e' un livello senza uscita.
      if (!st.finito && dopo.status === 'over') difetto('quadro-bloccato-senza-fine', dove, null);
      prevStato = st;
    }

    s = dopo;
    if (s.status !== 'playing' && rnd() < 0.5) return passo;
    if (quadro && prevStato.finito && rnd() < 0.5) return passo;
  }
  return PASSI_MAX;
}

/** Determinismo: la stessa sequenza di azioni sullo stesso seme da' lo stesso stato. */
function controllaDeterminismo(seme) {
  const giro = () => {
    const rnd = mulberry(seme);
    let s = createGame({ seed: seme, modalita: seme % 2 ? MODALITA.ANTEPRIMA : MODALITA.BASE, now: ORA });
    for (let i = 0; i < 200 && s.status === 'playing'; i += 1) {
      const r = rnd();
      if (r < 0.8) { const m = mossaACaso(s, rnd); if (m) s = placePiece(s, ...m, ORA); }
      else if (r < 0.9) s = cambiaPezzo(s, Math.floor(rnd() * 3)) ?? s;
      else s = appoggiaSullaMensola(s, Math.floor(rnd() * 3)) ?? riprendiDallaMensola(s, Math.floor(rnd() * 3)) ?? s;
    }
    return impronta(s) + JSON.stringify(summarize(s, ORA));
  };
  return giro() === giro();
}

/**
 * La caccia vera e propria, importabile: la prova in tests/ ne fa girare una versione
 * piccola a ogni `npm test`, questo file da riga di comando quella grande.
 *
 * @param {number} partite partite libere (meta' base, meta' con anteprima); i livelli si
 *   giocano tutti, `partite/100` volte ciascuno e almeno una
 * @param {number} seme da cui discendono tutti gli altri
 */
export function caccia(partite, seme) {
  difetti = new Map();
  tentate = {};
  const rnd = mulberry(seme);
  const contatori = {};
  let passi = 0;
  let giocate = 0;

  for (let n = 0; n < partite; n += 1) {
    const semePartita = Math.floor(rnd() * 2 ** 31);
    const modalita = n % 2 ? MODALITA.ANTEPRIMA : MODALITA.BASE;
    passi += giocaUna({ modalita, seme: semePartita }, mulberry(semePartita), contatori);
    giocate += 1;
    if (!controllaDeterminismo(semePartita)) {
      difetto('non-deterministico', { etichetta: `seme ${semePartita}`, passo: 0 }, null);
    }
  }
  // Tutti i livelli, piu' giri ciascuno con semi d'azione diversi.
  const giriLivello = Math.max(1, Math.round(partite / 100));
  for (const quadro of QUADRI) {
    for (let k = 0; k < giriLivello; k += 1) {
      passi += giocaUna({ quadro }, mulberry(quadro.numero * 7919 + k + seme), contatori);
      giocate += 1;
    }
  }
  return { difetti, giocate, passi, giriLivello, tentate, contatori };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const partite = Number(process.argv[2] ?? 300);
  const seme = Number(process.argv[3] ?? 20260923);
  const inizio = Date.now();
  const esito = caccia(partite, seme);
  const secondi = ((Date.now() - inizio) / 1000).toFixed(1);
  console.log(`Partite: ${esito.giocate} (${partite} libere + ${QUADRI.length}x${esito.giriLivello} livelli), `
    + `passi: ${esito.passi}, ${secondi} s, seme ${seme}`);
  console.log('Azioni tentate:', JSON.stringify(esito.tentate));
  console.log('Azioni che hanno cambiato lo stato:', JSON.stringify(esito.contatori));
  if (esito.difetti.size === 0) {
    console.log('Nessun difetto trovato.');
  } else {
    console.log(`DIFETTI: ${esito.difetti.size} tipi`);
    for (const [firma, { conta, primo }] of esito.difetti) {
      console.log(`- ${firma} x${conta} — primo: ${primo.etichetta}, passo ${primo.passo}, azione ${primo.azione ?? '-'}`);
      if (primo.dettaglio !== undefined && primo.dettaglio !== null) console.log('    ', JSON.stringify(primo.dettaglio).slice(0, 300));
    }
    process.exitCode = 1;
  }
}
