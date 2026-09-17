/**
 * Genera il percorso dei 100 Quadri.
 *
 * Il PROGETTO e' qui e in chiaro: quale obiettivo, quante mosse, quale griglia, e con
 * che passo cresce la difficolta'. I BERSAGLI invece non si scrivono a mano: vengono
 * calcolati facendo giocare il livello al giocatore artificiale e prendendo un
 * percentile della sua prestazione, cosi' un "fai N punti" e' sempre commisurato a
 * quanti punti si possono davvero fare in quel livello.
 *
 * Serve a evitare i due difetti opposti della prima stesura scritta a mano: livelli
 * impossibili (1500 punti dove se ne fanno 325) e livelli che si superano senza
 * accorgersene.
 *
 * LA MODALITA' FA PARTE DELLA TARATURA. I Quadri si giocano vedendo la terna
 * successiva, e vedere avanti cambia due cose insieme: il giocatore sceglie meglio, e
 * il generatore legge la griglia in un altro momento (quindi lo STESSO seme produce
 * un'altra partita). Tarare i bersagli senza anteprima e poi giocarli con l'anteprima
 * significherebbe pubblicare bersagli misurati su livelli che non esistono. Qui il
 * giocatore artificiale gioca nella stessa modalita' in cui giochera' la persona.
 *
 * Uso: node tools/genera-quadri.mjs [tentativi]   (riscrive src/config/quadri.js)
 */

import { writeFileSync } from 'node:fs';
import { placePiece, createGame } from '../src/core/engine.js';
import { OBIETTIVI } from '../src/core/quadro.js';
import { createRng } from '../src/core/rng.js';
import { seedFromString } from '../src/core/rng.js';
import {
  gridFromString, findCompletedGroups, filledCount, allPlacements, placeShape,
  clearGroups, fillRatio, idx, quadrantCells, QUADRANT_COUNT,
} from '../src/core/grid.js';
import { GRID_SIZE, QUADRANT_SIZE } from '../src/config/rules.js';
import { MODALITA_QUADRI } from '../src/core/quadro.js';
import { accoglienza } from '../src/sim/accoglienza.mjs';
// Il giocatore che MIRA all'obiettivo: lo stesso, identico, che usa `npm run quadri` per
// verificare. Qui sotto ce n'e' un altro, che gioca SENZA obiettivo e serve a tarare: sono
// due mestieri diversi e vanno tenuti distinti. Quello che non si puo' fare -- e fino alla
// 1.1.0 si faceva -- e' avere due versioni diverse del giocatore che MIRA, una per chi
// promette che il livello e' superabile e una per chi lo controlla.
import {
  preferenze as preferenzeObiettivo, scegliMossa as scegliMossaObiettivo,
} from '../src/sim/giocatore-quadri.mjs';

const TENTATIVI = Number(process.argv[2] ?? 7);
/**
 * PROVA A VUOTO: `QUADRI_PROVA=8` genera solo i primi otto livelli, `QUADRI_PROVA=41-58`
 * solo quel tratto, e in nessuno dei due casi si scrive niente.
 *
 * Una generazione intera dura decine di minuti, e quasi tutto quel tempo se ne va nelle
 * partite. Quando si cambia la ricetta o un controllo si vuole sapere in due minuti se il
 * codice regge, non aspettare mezz'ora per scoprire un errore di battitura al passaggio
 * finale. Il file generato NON viene scritto, cosi' una prova non puo' lasciare in giro
 * cento livelli tarati male.
 */
const PROVA = process.env.QUADRI_PROVA ?? '';
const [PROVA_DA, PROVA_A] = PROVA.includes('-')
  ? PROVA.split('-').map(Number)
  : [1, Number(PROVA || 0)];
const TOTALE = 100;

// ---------------------------------------------------------------- le griglie ---
// Ogni motivo e' pensato per lasciare corridoi veri: le celle isolate una per una
// rendono il quadro ingiocabile, ed e' un errore gia' commesso e gia' misurato.
//
// NON E' LA DENSITA', E' LA FORMA DEI VUOTI. Misurato: `labirinto` riempie 43 celle su 81
// -- il piu' pieno di tutti -- e il giocatore artificiale ci chiude 14 gruppi in trenta
// mosse. Le due versioni precedenti di `fitto` e `assedio` ne riempivano 36 e ne chiudevano
// zero. La differenza: `assedio` lasciava i vuoti come CELLE SINGOLE isolate (colonne 2, 5
// e 8 di una riga altrimenti piena), e chiudere quella riga chiedeva tre pezzi da una cella
// che non arrivano a comando; `fitto` spezzava ogni quadrante in due domino separati. Un
// motivo deve lasciare tratti liberi lunghi almeno due, e regioni libere connesse.
//
// Il controllo piu' in basso non descrive questa regola: la MISURA, giocando ogni motivo.
const MOTIVI = {
  nessuno: null,
  angoli:   ['##.....##', '##.....##', '.........', '.........', '.........', '.........', '.........', '##.....##', '##.....##'],
  croce:    ['.........', '.........', '.........', '...###...', '...#.#...', '...###...', '.........', '.........', '.........'],
  cornice:  ['########.', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '.########'],
  scala:    ['##.......', '##.......', '..##.....', '..##.....', '....##...', '....##...', '......##.', '......##.', '........#'],
  isole:    ['##....##.', '##....##.', '.........', '.........', '...##....', '...##....', '.........', '.##....##', '.##....##'],
  colonne:  ['##.##.##.', '##.##.##.', '##.##.##.', '.........', '.........', '.........', '##.##.##.', '##.##.##.', '##.##.##.'],
  muro:     ['########.', '########.', '.........', '.........', '.........', '.........', '.........', '.########', '.########'],
  strettoia:['##....##.', '#.#...#.#', '###...###', '.........', '.........', '.........', '###...###', '#.#...#.#', '##....##.'],
  diagonale:['##.......', '.##......', '..##.....', '...##....', '....##...', '.....##..', '......##.', '.......##', '........#'],
  clessidra:['#######..', '.#####...', '..###....', '...#.....', '.........', '.....#...', '....###..', '...#####.', '..#######'],
  blocchi:  ['##...##..', '##...##..', '.....##..', '..##.....', '..##...##', '.......##', '##...##..', '##...##..', '.........'],
  fitto:    ['###...###', '###...###', '.........', '...###...', '...###...', '.........', '###...###', '###...###', '.........'],
  labirinto:['#.#####.#', '#.......#', '#.#####.#', '#.#...#.#', '..#.#.#..', '#.#...#.#', '#.#####.#', '#.......#', '#.#####.#'],
  assedio:  ['###...###', '##.....##', '#.......#', '.........', '.........', '.........', '#.......#', '##.....##', '###...###'],
  briciole: ['#........', '.#.......', '..#......', '.........', '.........', '.........', '......#..', '.......#.', '........#'],
};

// ------------------------------------------------------------------ la curva ---
// Il percorso e' diviso in atti. Ogni atto introduce qualcosa e alza l'asticella.
//
// NIENTE `pulizia` FRA I TIPI, ED E' UNA MISURA NON UN GUSTO. L'ultimo atto chiedeva, al
// quadro 97, di svuotare completamente la plancia in 40 mosse. Misurato con un giocatore
// che ottimizza SOLO quello -- il riempimento pesa piu' di ogni altra cosa -- su trenta
// partite: svuotata zero volte con 40 mosse, zero con 80, zero con 160, zero con 320. Il
// riempimento non e' mai sceso sotto l'11%, e non scendeva piu' a nessun tetto di mosse:
// dare piu' tempo non serviva a niente. Nella partita libera lo svuotamento capita, ma
// una volta ogni ~2400 mosse di gioco esperto: in un livello da 40 mosse e' un biglietto
// della lotteria, non una prova di abilita'.
//
// Un livello che promette un obiettivo deve poterlo mantenere. `pulizia` resta un tipo di
// obiettivo che il motore sa leggere -- e resta il bonus piu' bello del gioco quando
// capita -- ma non ci si costruisce sopra un livello.
/**
 * I TIPI SONO ORDINATI PER DIFFICOLTA' MISURATA, non per varieta'.
 *
 * Misurato su 30 tentativi per livello (`npm run quadri 30`), la riuscita media del
 * giocatore artificiale per tipo di obiettivo:
 *
 *     intreccio 98%   colonne 94%   righe 93%   gruppi 92%
 *     quadranti 91%   catena 88%    punteggio 69%   celle 68%
 *
 * Trenta punti fra il tipo piu' facile e il piu' difficile, ovunque si trovino nel
 * percorso. E i tipi ruotavano dentro ogni atto con un ciclo fisso, quindi la difficolta'
 * oscillava con il ciclo mentre la curva dei percentili saliva piano: il risultato,
 * misurato, era una correlazione fra numero del livello e difficolta' di -0,05, cioe'
 * NESSUNA. Il percorso era appena meglio di un ordine casuale.
 *
 * Il caso peggiore stava nel secondo atto, che conteneva `celle` -- il tipo piu' duro di
 * tutti -- ai livelli 11-24: era la ragione per cui i livelli 11-20 risultavano piu'
 * difficili dei 21-30.
 *
 * Adesso i due tipi duri (`punteggio` e `celle`) entrano dal quarto atto in poi, e i due
 * facili (`intreccio`, `colonne`) escono di scena presto.
 *
 * L'INTRECCIO E' STATO SOSTITUITO DAL SUO CONTEGGIO. `intreccio` misura un PICCO -- la
 * mossa migliore della partita -- e un picco non cresce: praticamente si ferma a 2,
 * perche' tre gruppi con una mossa sola sono un evento raro. Misurato con il metro che
 * ci prova: l'Intreccio da 3 arriva 2 volte su 40 sul quadro 47, 1 su 40 sul 52. Il
 * controllo di superabilita' ne chiede 4 su 12, quindi chiedere 3 sarebbe un muro.
 *
 * Un obiettivo che non cresce non puo' stare in un atto avanzato: il tetto di mosse e'
 * l'unica leva rimasta, e su un livello che si vince alla seconda mossa non morde. Il
 * quadro 47 e' rimasto banale per tre generazioni proprio per questo, e nessuna delle
 * cure automatiche poteva prenderlo.
 *
 * `intrecci` conta invece QUANTE VOLTE si e' chiuso piu' di un gruppo insieme. E' un
 * cumulo come `righe` o `celle`, quindi si puo' chiedere in dose crescente, il generatore
 * lo tara come tutti gli altri, e la stessa meccanica smette di essere un colpo di
 * fortuna per diventare una richiesta di costanza.
 */
/**
 * TRE CAMPI NUOVI, E LE MISURE CHE LI HANNO CHIESTI.
 *
 * `doppi` -- OGNI QUANTI LIVELLI DELL'ATTO UNO NE CHIEDE DUE COSE INSIEME.
 *
 * Tutti e cento i livelli chiedevano una cosa sola. Motore, giocatore artificiale e
 * schermo dell'obiettivo sapevano gia' maneggiare una LISTA di obiettivi -- `quadro.js`
 * mappa su `quadro.obiettivi` da sempre -- ma nessun livello ne aveva mai piu' di uno,
 * quindi la capacita' c'era e non si vedeva. "Chiudi 3 righe E fai 400 punti" non e' la
 * somma dei suoi pezzi: da solo, "chiudi 3 righe" si gioca in automatico chiudendo righe,
 * e il punteggio arriva da se'; insieme, obbligano a scegliere quale mossa serve a quale
 * meta'. E' l'unico modo di aumentare la richiesta senza toccare il motore.
 *
 * Solo dagli atti avanzati: nei primi il livello insegna una regola alla volta.
 *
 * `intrecci` PIU' SPESSO. Era in due atti soli: cinque livelli su cento, di cui quattro
 * consecutivi nello stesso tratto (42, 47, 52, 57) e uno in fondo (97). Una meccanica che
 * il gioco ha, che il generatore sa tarare come ogni altro cumulo, e che praticamente non
 * chiede mai. Ora e' in cinque atti su sette: circa tredici livelli su cento.
 *
 * NOTA DI METODO, perche' e' costata una diagnosi sbagliata. Lo strumento di taratura
 * (`tools/taratura.mjs`) non conosceva il tipo `intrecci`: aveva il ramo per `intreccio`,
 * il picco ormai in disuso, e non quello per il conteggio. Il giocatore non veniva mai
 * spinto a chiudere piu' gruppi insieme, e i cinque livelli a intrecci risultavano i piu'
 * duri del gioco (mediana 1 contro un bersaglio di 3) per un difetto del METRO. Il
 * generatore il ramo giusto ce l'aveva, quindi i livelli erano tarati bene. Corretto lo
 * strumento, le stesse mediane stanno fra 1 e 3, cioe' in mezzo al gruppo.
 *
 * `riuscite` -- LA BANDA DI DIFFICOLTA' DELL'ATTO: quante partite su venti il metro
 * puo' vincere, al minimo e al massimo.
 *
 * E' il campo che cambia il mestiere di questo file, e vale la pena dire da dove viene.
 *
 * Fino a ieri la difficolta' non era un obiettivo: era una CONSEGUENZA SPERATA di tre
 * leve mosse a mano atto per atto -- il percentile del bersaglio, il tetto di mosse, il
 * margine -- piu' un unico vincolo valido per tutti e cento i livelli: "almeno 4 riuscite
 * su 12". Un solo pavimento, nessun soffitto, il livello 3 e il livello 99 con lo stesso
 * requisito. Misurata a 24 partite per livello, la curva che ne usciva era questa, in
 * riuscite medie per gruppo di dieci:
 *
 *     84  85  74  61  57  60  56  54  44  63
 *
 * Quattro inversioni e un rimbalzo in fondo. Il punto piu' duro del gioco cadeva al
 * livello 90, e gli ultimi dieci si vincevano il 63% delle volte contro il 44% dei dieci
 * precedenti: il finale si allentava.
 *
 * E non era il bersaglio. Misurato come rapporto fra cio' che si chiede e cio' che il
 * metro raggiunge davvero, gli ultimi dieci stavano a 1,09 e i dieci prima a 1,09:
 * identici. Era il TETTO DI MOSSE -- 26-40 nell'ultimo atto contro 22-32 nel penultimo.
 * Con piu' tempo lo stesso bersaglio si raggiunge piu' spesso.
 *
 * Il controllo "nessun livello banale" non poteva prenderlo, perche' chiede DUE condizioni
 * insieme: vinto quasi sempre E con molto tempo che avanza. Serviva a non bocciare i
 * livelli tesi, quelli in cui o si vince presto o si perde. Ma lascia passare il caso
 * opposto, il livello vinto quasi sempre SENZA tempo che avanza: il quadro 96 chiedeva 14
 * gruppi in 33 mosse, si vinceva 96 volte su 100 e il giocatore ne usava 30 su 33.
 *
 * Adesso ogni atto ha pavimento E soffitto, e il generatore li fa rispettare: si tolgono
 * mosse per far scendere la riuscita, se ne aggiungono per farla salire, e solo quando il
 * tetto e' al minimo si tocca il bersaglio. L'ordine e' quello di tutto il resto del file:
 * togliere tempo lascia il livello quello che era, cambiare il bersaglio ne fa un altro.
 *
 * LE BANDE SI SOVRAPPONGONO DI PROPOSITO. Dentro un atto i livelli devono variare,
 * altrimenti il percorso diventa un metronomo: sedici livelli tutti al 55% sono noiosi
 * quanto sedici livelli banali. Ma i due estremi scendono entrambi a ogni atto, quindi la
 * curva complessiva non puo' piu' risalire.
 *
 * IL PRIMO ATTO HA UN SOFFITTO DI VENTI SU VENTI, cioe' nessun soffitto: i primi dieci
 * livelli insegnano, e un livello che insegna si deve poter vincere sempre.
 */
const ATTI = [
  { da:  1, a: 10, id: 'fondamenta',   tipi: ['righe','colonne','quadranti','gruppi'],                            motivi: ['nessuno'],                                             mosse: [12, 16], percentile: [12, 30], margine: [1.30, 1.22], riuscite: [15, 20] },
  { da: 11, a: 24, id: 'pilastri',     tipi: ['gruppi','quadranti','righe','colonne','catena'],                   motivi: ['nessuno','angoli','croce'],                            mosse: [16, 22], percentile: [20, 32], margine: [1.26, 1.20], riuscite: [13, 18] },
  { da: 25, a: 40, id: 'roccia',       tipi: ['gruppi','quadranti','righe','colonne','catena','intrecci'],        motivi: ['scala','isole','cornice','colonne','blocchi'],         mosse: [18, 26], percentile: [26, 38], margine: [1.22, 1.18], riuscite: [11, 17] },
  { da: 41, a: 58, id: 'vuoto',        tipi: ['catena','intrecci','gruppi','quadranti','punteggio'],              motivi: ['muro','strettoia','diagonale','angoli','croce'],       mosse: [16, 24], percentile: [28, 42], margine: [1.22, 1.16], doppi: 4, riuscite: [9, 15] },
  { da: 59, a: 76, id: 'strada',       tipi: ['punteggio','catena','intrecci','gruppi','celle','righe'],          motivi: ['clessidra','labirinto','fitto','assedio','isole'],     mosse: [20, 30], percentile: [34, 50], margine: [1.16, 1.12], doppi: 4, riuscite: [8, 13] },
  { da: 77, a: 92, id: 'arco',         tipi: ['punteggio','catena','celle','intrecci','quadranti','gruppi'],      motivi: ['fitto','assedio','strettoia','labirinto','clessidra'], mosse: [22, 32], percentile: [42, 58], margine: [1.12, 1.08], doppi: 4, riuscite: [7, 12] },
  { da: 93, a:100, id: 'ultimaPietra', tipi: ['punteggio','celle','catena','gruppi','intrecci'],                  motivi: ['briciole','clessidra','labirinto','assedio'],          mosse: [26, 40], percentile: [48, 64], margine: [1.08, 1.05], doppi: 4, riuscite: [6, 10] },
];

const NOMI = {
  righe: 'righe', colonne: 'colonne', quadranti: 'quadranti', gruppi: 'gruppi',
  catena: 'catena', punteggio: 'punti', celle: 'celle', intreccio: 'intreccio', intrecci: 'intrecci',
  pulizia: 'pulizia', sopravvivi: 'resistenza',
};

function attoDi(n) { return ATTI.find((a) => n >= a.da && n <= a.a); }
function interpola(intervallo, quota) {
  return Math.round(intervallo[0] + (intervallo[1] - intervallo[0]) * quota);
}

/** Progetto di un Quadro: tutto tranne il bersaglio, che si misura. */
/**
 * QUANTO SI SCONTA IL BERSAGLIO DI UN LIVELLO A DUE OBIETTIVI.
 *
 * Chiedere due cose insieme e' strettamente piu' difficile che chiederne una: le mosse
 * sono le stesse e vanno divise. Lasciare a ciascuna meta' il percentile che avrebbe da
 * sola vorrebbe dire fare un livello quasi doppio e poi lasciare che il controllo di
 * superabilita' lo smonti a forza di gradini -- cioe' inventare la difficolta' e
 * correggerla dopo, invece di progettarla.
 *
 * Quindici punti di percentile a testa, con un pavimento a dieci. Non e' un numero
 * misurato: e' una partenza ragionevole che il controllo di superabilita' (almeno 4
 * riuscite su 12) e quello di banalita' correggono in entrambe le direzioni. Se dopo la
 * generazione i livelli doppi risultassero sistematicamente abbassati o sistematicamente
 * banali, e' QUESTO il numero da cambiare.
 */
const SCONTO_DOPPIO = 15;
const PERCENTILE_MINIMO = 10;

/**
 * I tipi di obiettivo di un livello: uno, o due sui livelli "doppi" dell'atto.
 *
 * Il secondo tipo non e' quello successivo nel giro ma quello DUE passi avanti: con il
 * successivo, due livelli vicini finirebbero per chiedere la stessa coppia scambiata
 * ("righe + colonne" al 44 e "colonne + quadranti" al 45), e la coppia si riconoscerebbe
 * come un motivo ripetuto invece che come un livello a se'.
 */
const coppieUsate = new Set();
function tipiDi(atto, n) {
  const giro = atto.tipi;
  const i = n - atto.da;
  const primo = giro[i % giro.length];
  if (!atto.doppi || giro.length < 3) return [primo];
  if (i % atto.doppi !== atto.doppi - 1) return [primo];

  // MAI DUE VOLTE LA STESSA COPPIA, in tutto il percorso.
  //
  // Con un passo fisso la coppia si ripete: i livelli doppi distano quattro, i tipi del
  // giro sono cinque o sei, e i due cicli vanno a tempo. Misurato sulla ricetta: "gruppi +
  // righe" usciva al 62 e di nuovo al 74, e "catena + gruppi" al 66 in ordine scambiato --
  // che per chi legge l'obiettivo e' la stessa richiesta. Qui la seconda meta' avanza nel
  // giro finche' la coppia non e' nuova. La coppia si confronta SENZA ORDINE, perche'
  // "3 righe e 400 punti" e "400 punti e 3 righe" sono lo stesso livello.
  //
  // Lo stato vive fra una chiamata e l'altra: `progetta` scorre i livelli una volta sola e
  // in ordine, quindi l'insieme e' esattamente la storia del percorso fin qui.
  for (let passo = 2; passo < giro.length; passo += 1) {
    const secondo = giro[(i + passo) % giro.length];
    if (secondo === primo) continue;
    const coppia = [primo, secondo].sort().join('+');
    if (coppiaUsate(coppia)) continue;
    coppieUsate.add(coppia);
    return [primo, secondo];
  }
  return [primo];
}
function coppiaUsate(coppia) { return coppieUsate.has(coppia); }

function progetta(n) {
  const atto = attoDi(n);
  const quota = (n - atto.da) / Math.max(1, atto.a - atto.da);
  const tipi = tipiDi(atto, n);
  const motivo = atto.motivi[(n - atto.da) % atto.motivi.length];
  // Le mosse oscillano dentro l'intervallo dell'atto invece di crescere dritte:
  // un percorso che sale sempre uguale diventa prevedibile a occhio.
  const oscilla = ((n * 7) % 5) / 4;
  const percentilePieno = interpola(atto.percentile, quota);
  return {
    numero: n,
    nome: `${tipi.map((t) => NOMI[t]).join('')}${n}`,
    tipi,
    motivo,
    // Tetto PROVVISORIO: serve solo a far giocare la taratura del bersaglio. Quello vero
    // si calcola dopo, misurando quante mosse servono davvero (vedi `margine`).
    maxMosse: interpola(atto.mosse, oscilla),
    percentile: tipi.length > 1
      ? Math.max(PERCENTILE_MINIMO, percentilePieno - SCONTO_DOPPIO)
      : percentilePieno,
    riuscite: atto.riuscite,
    // Di quanto il tetto di mosse deve superare le mosse davvero necessarie. 1,45 vuol
    // dire "quasi meta' del tempo di margine", 1,05 "appena il fiato". E' la leva che
    // fa salire la difficolta' lungo il percorso, e l'unica che funzioni sugli obiettivi
    // di PICCO -- `intreccio` e `catena` -- dove il bersaglio non ha spazio per crescere:
    // il metro arriva quasi sempre a Intreccio 2, quindi il 20esimo percentile e il
    // 60esimo danno lo stesso numero, e l'unico modo di rendere duro il livello e' dare
    // meno tempo. E' cosi' che nasceva "intreccio 2 in 24 mosse", vinto in 2.
    margine: atto.margine[0] + (atto.margine[1] - atto.margine[0]) * quota,
    griglia: MOTIVI[motivo] ? MOTIVI[motivo].join('\n') : null,
  };
}

// ------------------------------------------------------- il giocatore di prova ---
function buchi(g) {
  let n = 0;
  for (let r = 0; r < GRID_SIZE; r += 1) for (let c = 0; c < GRID_SIZE; c += 1) {
    if (g[idx(r, c)] !== 0) continue;
    const s = r > 0 && g[idx(r-1,c)] === 0, d = r < 8 && g[idx(r+1,c)] === 0;
    const x = c > 0 && g[idx(r,c-1)] === 0, y = c < 8 && g[idx(r,c+1)] === 0;
    if (!s && !d && !x && !y) n += 1;
  }
  return n;
}
function vicinanza(grid) {
  const v = { row: 0, col: 0, quadrant: 0 };
  for (let r = 0; r < 9; r += 1) { let p = 0;
    for (let c = 0; c < 9; c += 1) if (grid[idx(r,c)] !== 0) p += 1;
    if (p < 9) v.row += (p/9) ** 3; }
  for (let c = 0; c < 9; c += 1) { let p = 0;
    for (let r = 0; r < 9; r += 1) if (grid[idx(r,c)] !== 0) p += 1;
    if (p < 9) v.col += (p/9) ** 3; }
  for (let q = 0; q < QUADRANT_COUNT; q += 1) { let p = 0;
    for (const cella of quadrantCells(q)) if (grid[cella] !== 0) p += 1;
    if (p < 9) v.quadrant += (p/9) ** 3; }
  return v;
}
/**
 * Pesi del giocatore di prova, orientati ai tipi di obiettivo del livello.
 *
 * Prende una LISTA, non un tipo: su un livello a due obiettivi il giocatore deve badare a
 * entrambi, e tarare "chiudi 3 righe e fai 400 punti" con un giocatore che pensa solo
 * alle righe misurerebbe un livello che nessuno gioca. Dove i due tipi tirano in
 * direzioni opposte -- `catena` non vuole saltare mosse, `intrecci` vuole aspettare per
 * chiudere insieme -- vince l'ultimo assegnato: e' un compromesso dichiarato, non un
 * caso, e il controllo di superabilita' ha comunque l'ultima parola.
 */
function preferenze(tipi) {
  const p = { row: 1, col: 1, quadrant: 1, svuotare: 0, nonSpezzare: 240 };
  for (const tipo of [].concat(tipi)) {
    if (tipo === 'righe') p.row = 6;
    else if (tipo === 'colonne') p.col = 6;
    else if (tipo === 'quadranti') p.quadrant = 6;
    else if (tipo === 'pulizia') { p.svuotare = 320; p.nonSpezzare = 40; }
    else if (tipo === 'catena') p.nonSpezzare = 900;
    else if (tipo === 'intreccio' || tipo === 'intrecci') p.nonSpezzare = 40;
  }
  return p;
}
function valuta(dopo, gruppi, pref, rumore) {
  const v = vicinanza(dopo);
  let val = gruppi.length === 0 ? -pref.nonSpezzare : 0;
  for (const g of gruppi) val += 150 * pref[g.type];
  val += gruppi.length > 1 ? 280 * (gruppi.length - 1) : 0;
  val -= buchi(dopo) * 16;
  val -= fillRatio(dopo) * (45 + pref.svuotare);
  val += (v.row * pref.row + v.col * pref.col + v.quadrant * pref.quadrant) * 6;
  return val + rumore;
}
// Gli stessi tre numeri di tools/taratura.mjs e tools/quadri.mjs: chi tara e chi
// verifica devono usare lo stesso metro.
const ALTERNATIVE_CON_ANTEPRIMA = 10;
const PESO_ANTEPRIMA = 0.6;
const PENALITA_BLOCCO = 1200;

function ramiDiRadice(grid, pezzi, pref, prof, rng) {
  const rami = [];
  for (let i = 0; i < pezzi.length; i += 1) {
    const pezzo = pezzi[i];
    if (!pezzo) continue;
    const case_ = allPlacements(grid, pezzo.shape);
    if (!case_.length) continue;
    const cand = case_.map(([row, col]) => {
      const { grid: posata } = placeShape(grid, pezzo.shape, row, col, 1, pezzo.bombe);
      const gruppi = findCompletedGroups(posata);
      const { grid: dopo } = clearGroups(posata, gruppi);
      return { row, col, dopo, valore: valuta(dopo, gruppi, pref, rng.float() * 45) };
    }).sort((a, b) => b.valore - a.valore).slice(0, 6);
    const resto = pezzi.slice(); resto[i] = null;
    for (const c of cand) {
      const sotto = pianifica(c.dopo, resto, pref, prof - 1, rng);
      rami.push({
        valore: c.valore + sotto.valore * 0.85,
        prima: { handIndex: i, row: c.row, col: c.col },
        griglia: sotto.griglia,
      });
    }
  }
  return rami;
}

function pianifica(grid, pezzi, pref, prof, rng) {
  const fermarsi = { valore: 0, prima: null, griglia: grid };
  if (prof === 0) return fermarsi;
  return ramiDiRadice(grid, pezzi, pref, prof, rng)
    .reduce((a, b) => (b.valore > a.valore ? b : a), fermarsi);
}

/** La mossa da giocare: con l'anteprima, scelta guardando anche la terna successiva. */
function scegliMossa(partita, pref, rng) {
  const rami = ramiDiRadice(partita.grid, partita.hand, pref, partita.hand.filter(Boolean).length, rng);
  if (!rami.length) return null;
  const dopo = partita.manoSuccessiva;
  const candidate = dopo
    ? [...rami].sort((a, b) => b.valore - a.valore).slice(0, ALTERNATIVE_CON_ANTEPRIMA)
      .map((r) => {
        const acc = accoglienza(r.griglia, dopo, (g, gruppi) => valuta(g, gruppi, pref, 0));
        return { ...r, valore: r.valore + PESO_ANTEPRIMA * acc.valore - (acc.bloccato ? PENALITA_BLOCCO : 0) };
      })
    : rami;
  return candidate.reduce((a, b) => (b.valore > a.valore ? b : a)).prima;
}

function gioca(progetto, rng) {
  let partita = createGame({
    seed: seedFromString(`plinto-quadro-${progetto.numero}`),
    grigliaIniziale: progetto.griglia ? gridFromString(progetto.griglia, 3) : undefined,
    now: 0,
    modalita: MODALITA_QUADRI,
  });
  const pref = preferenze(progetto.tipi);
  for (let m = 0; m < progetto.maxMosse; m += 1) {
    if (partita.status !== 'playing') break;
    const mossa = scegliMossa(partita, pref, rng);
    if (!mossa) break;
    partita = placePiece(partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
  }
  return partita;
}

/** Gli obiettivi del livello nella forma che hanno in src/config/quadri.js. */
function obiettiviDi(progetto, bersagli) {
  return progetto.tipi.map((tipo, i) => ({ tipo, quanti: bersagli[i] }));
}

/** Tutti gli obiettivi raggiunti? Su un livello a due, uno solo non basta. */
function tuttiRaggiunti(partita, progetto, bersagli) {
  return progetto.tipi.every((tipo, i) => OBIETTIVI[tipo].progresso(partita) >= bersagli[i]);
}

/**
 * "IL LIVELLO SI SUPERA?" NON HA PIU' UNA FUNZIONE PROPRIA, ed e' un miglioramento.
 *
 * C'era un `superato()` che rigiocava la partita fermandosi appena il bersaglio era
 * raggiunto. Faceva esattamente lo stesso lavoro di `mosseNecessarie` qui sotto, che pero'
 * restituisce anche QUANTE mosse sono servite -- e quel numero risponde a "si supera?" per
 * ogni tetto in un colpo solo, invece che per uno. Tenere le due funzioni significava
 * giocare due volte le stesse partite e, peggio, rischiare che un giorno divergessero:
 * chi decide e chi verifica devono usare lo stesso metro, ed e' la lezione che questo file
 * ha gia' imparato tre volte. Adesso la domanda e' una conta su `mosseSeme`.
 */

/**
 * Quante mosse servono davvero per raggiungere il bersaglio, se ci si riesce.
 * @returns {number|null} il numero di mosse usate, o null se non ci si arriva
 */
function mosseNecessarie(progetto, bersagli, tetto, rng) {
  let partita = createGame({
    seed: seedFromString(`plinto-quadro-${progetto.numero}`),
    grigliaIniziale: progetto.griglia ? gridFromString(progetto.griglia, 3) : undefined,
    now: 0,
    modalita: MODALITA_QUADRI,
  });
  const pref = preferenzeObiettivo({ obiettivi: obiettiviDi(progetto, bersagli) });
  for (let m = 0; m < tetto; m += 1) {
    if (tuttiRaggiunti(partita, progetto, bersagli)) return m;
    if (partita.status !== 'playing') return null;
    const mossa = scegliMossaObiettivo(partita, pref, rng);
    if (!mossa) return null;
    partita = placePiece(partita, mossa.handIndex, mossa.row, mossa.col, m * 1000);
  }
  return tuttiRaggiunti(partita, progetto, bersagli) ? tetto : null;
}

/** Il gradino SOPRA un bersaglio, nella scala del suo tipo. */
function gradinoSopra(tipo, bersaglio) {
  if (tipo === 'punteggio') return bersaglio + 25;
  if (tipo === 'celle') return bersaglio + 3;
  return bersaglio + 1;
}

/** Il gradino sotto un bersaglio, nella scala del suo tipo. */
function scendiDiUno(tipo, bersaglio) {
  if (tipo === 'punteggio') return Math.max(100, bersaglio - 25);
  if (tipo === 'celle') return Math.max(9, bersaglio - 3);
  return Math.max(1, bersaglio - 1);
}

/** Il bersaglio piu' basso che il tipo ammette: sotto, il livello sarebbe gia' vinto. */
function fondoScala(tipo) {
  if (tipo === 'punteggio') return 100;
  if (tipo === 'celle') return 9;
  return 1;
}

function percentile(v, p) {
  const o = [...v].sort((a, b) => a - b);
  return o[Math.max(0, Math.min(o.length - 1, Math.floor((p / 100) * o.length)))];
}

// ----------------------------------------------------------------- controlli ---
for (const [nome, righe] of Object.entries(MOTIVI)) {
  if (!righe) continue;
  const g = gridFromString(righe.join('\n'), 3);
  const gruppi = findCompletedGroups(g);
  if (gruppi.length) throw new Error(`motivo "${nome}" contiene gia' ${gruppi.map((x) => x.type).join(',')}`);
  if (filledCount(g) > 48) throw new Error(`motivo "${nome}" riempie troppo: ${filledCount(g)} celle`);
  if (righe.length !== 9 || righe.some((r) => r.length !== 9)) throw new Error(`motivo "${nome}" malformato`);
}
console.log(`Motivi verificati: ${Object.keys(MOTIVI).length - 1}, nessuno con gruppi gia' completi.`);

/**
 * E poi il controllo che mancava: ogni motivo dev'essere GIOCABILE.
 *
 * I due controlli qui sopra guardano la griglia FERMA -- nessun gruppo gia' chiuso, non
 * troppo piena, nove per nove -- e li passavano anche due motivi su cui il giocatore
 * artificiale, in trenta mosse, non chiudeva NEMMENO UN GRUPPO. Minimo, mediana e massimo
 * a zero: non un bersaglio troppo alto (il minimo possibile e' 1, e neanche quello era
 * raggiungibile) ma una griglia che blocca la plancia. Cinque livelli su cento erano
 * imbattibili per questo, e nessun controllo se ne accorgeva perche' nessuno PROVAVA A
 * GIOCARLI.
 *
 * Il difetto tipico non e' la densita': e' la FORMA dei vuoti. Un motivo che lascia buchi
 * da una cella isolata chiede pezzi da una cella, e quelli non arrivano a comando.
 * Questo controllo non prova a descrivere la regola -- la misura.
 */
const PROVE_MOTIVO = 3;
const MOSSE_PROVA = 30;
console.log(`\nGiocabilita' dei motivi: ${PROVE_MOTIVO} partite da ${MOSSE_PROVA} mosse ciascuno`);
const inguocabili = [];
for (const [nome, righe] of Object.entries(MOTIVI)) {
  if (!righe) continue;
  const chiusi = [];
  for (let p = 0; p < PROVE_MOTIVO; p += 1) {
    const finto = {
      numero: 9000 + p, nome, tipi: ['gruppi'], motivo: nome,
      maxMosse: MOSSE_PROVA, percentile: 50, griglia: righe.join('\n'),
    };
    const fine = gioca(finto, createRng(seedFromString(`motivo-${nome}-${p}`)));
    chiusi.push(fine.stats.clearedRows + fine.stats.clearedCols + fine.stats.clearedQuadrants);
  }
  const minimo = Math.min(...chiusi);
  const media = chiusi.reduce((a, b) => a + b, 0) / chiusi.length;
  console.log(
    `  ${nome.padEnd(10)} celle piene ${String(filledCount(gridFromString(righe.join('\n'), 3))).padStart(2)}`
    + `  gruppi chiusi: ${chiusi.join(', ')}  (minimo ${minimo}, media ${media.toFixed(1)})`,
  );
  // La soglia e' bassa di proposito: non si chiede che il motivo sia facile, si chiede
  // che sia GIOCABILE. Chiudere un gruppo in trenta mosse e' il minimo sindacale.
  if (minimo < 1) inguocabili.push(`${nome} (gruppi chiusi: ${chiusi.join(', ')})`);
}
if (inguocabili.length) {
  throw new Error(
    `Motivi su cui in ${MOSSE_PROVA} mosse non si chiude nemmeno un gruppo: `
    + `${inguocabili.join('; ')}. I livelli che li usano sarebbero imbattibili.`,
  );
}
console.log('');

// ------------------------------------------------------------------ taratura ---
const quadri = [];
const PRIMO = PROVA_A > 0 ? PROVA_DA : 1;
const ULTIMO = PROVA_A > 0 ? PROVA_A : TOTALE;
for (let n = PRIMO; n <= ULTIMO; n += 1) {
  const progetto = progetta(n);
  const rng = createRng(seedFromString(`taratura-${n}`));
  const finali = [];
  for (let i = 0; i < TENTATIVI; i += 1) finali.push(gioca(progetto, rng));

  // Un bersaglio per obiettivo, tarato sulla STESSA serie di partite: le mosse sono le
  // stesse per tutti e due, quindi misurarli in partite separate direbbe quanto si arriva
  // lontano dedicandosi a una cosa sola -- che e' esattamente cio' che un livello doppio
  // non concede.
  const bersagli = [];
  const massimi = [];
  const mediane = [];
  for (const tipo of progetto.tipi) {
    const valori = finali.map((s) => OBIETTIVI[tipo].progresso(s));
    let bersaglio = percentile(valori, progetto.percentile);
    if (tipo === 'punteggio') bersaglio = Math.max(100, Math.round(bersaglio / 25) * 25);
    else if (tipo === 'celle') bersaglio = Math.max(9, Math.round(bersaglio / 3) * 3);
    else bersaglio = Math.max(1, Math.round(bersaglio));
    bersagli.push(bersaglio);
    mediane.push(percentile(valori, 50));
    massimi.push(Math.max(...valori));
  }

  quadri.push({ ...progetto, bersagli, mediane, massimi });
  if (n % 10 === 0) process.stdout.write(`  tarati ${n}/${ULTIMO}\n`);
}

/**
 * NESSUN LIVELLO IMBATTIBILE. Non un auspicio: un controllo che ferma la generazione.
 *
 * Un percorso a livelli si gioca in fila, e ogni livello si apre superando il precedente:
 * un solo muro non rende difficile QUEL livello, chiude tutti i novantanove che vengono
 * dopo. Il gioco deve essere divertente, non una tortura, e "divertente" qui ha un
 * significato che si puo' misurare: ogni livello dev'essere superabile.
 *
 * Il bersaglio viene da un percentile di quanto il giocatore artificiale ottiene giocando
 * SENZA obiettivo. E' una buona stima, ma resta una stima: chi punta a una cosa gioca
 * diversamente da chi gioca bene e basta, e su qualche livello i due possono non
 * coincidere. Qui il livello viene giocato PUNTANDO al suo bersaglio, e se non si arriva
 * alla soglia il bersaglio scende di un gradino alla volta finche' non ci si arriva.
 *
 * QUANTO ALTA LA SOGLIA, E QUANTE PROVE. Ci sono voluti tre giri per arrivarci, e i due
 * scarti valgono piu' del risultato.
 *
 * Una riuscita su quattro bastava a togliere i MURI -- nessun livello imbattibile -- ma non
 * le TORTURE: restavano livelli superati una volta su dieci. Possibile non e' divertente.
 *
 * Due riuscite su sei sembravano sistemarlo e non lo facevano: con sei prove non si
 * distingue un livello al 10% da uno al 40%. E' esattamente cosi' che il quadro 44 e'
 * passato -- per fortuna, non per merito.
 *
 * La tentazione successiva era "tre su dodici", che suona piu' severo. Non lo e'. Ecco la
 * probabilita' che un livello con la riuscita vera indicata in colonna passi il criterio:
 *
 *     criterio      p=0,10   p=0,20   p=0,30   p=0,40   p=0,60
 *     1 su  4        34,4%    59,0%    76,0%    87,0%    97,4%
 *     2 su  6        11,4%    34,5%    58,0%    76,7%    95,9%
 *     3 su 12        11,1%    44,2%    74,7%    91,7%    99,7%
 *     4 su 12         2,6%    20,5%    50,7%    77,5%    98,5%
 *     5 su 12         0,4%     7,3%    27,6%    56,2%    94,3%
 *
 * "Tre su dodici" lascia passare un livello al 10% con la stessa frequenza di "due su
 * sei": alzare le prove senza alzare la soglia non misura meglio, misura solo piu' a
 * lungo. "Cinque su dodici" invece boccerebbe la meta' dei livelli al 40%, che sono i
 * livelli duri legittimi -- il senso degli ultimi atti.
 *
 * QUATTRO SU DODICI e' il compromesso: lascia passare un livello-macina due volte su
 * cento, e ne conserva tre su quattro fra quelli che si superano il 40% delle volte.
 *
 * Se nemmeno al fondo della scala ci si arriva, la generazione FALLISCE nominando il
 * livello: vuol dire che il problema non e' il bersaglio ma il progetto -- la griglia, il
 * tetto di mosse, il tipo di obiettivo -- e va corretto qui sopra, non nascosto con un
 * numero piu' basso.
 *
 * Cosa NON garantisce: il metro non e' una persona. "Superato due volte su sei dal
 * giocatore artificiale" e' una soglia misurabile e ripetibile, non una promessa che il
 * livello sia piacevole. Quella la puo' dire solo chi gioca.
 */
/**
 * DENTRO UNO STESSO TIPO, IL BERSAGLIO NON SCENDE MAI E NON SI RIPETE ALL'INFINITO.
 *
 * E' il difetto che spiega la lamentela piu' concreta arrivata da chi gioca -- "il livello
 * 6 e' molto banale" -- e che nessuno dei controlli precedenti poteva vedere, perche' tutti
 * guardavano UN livello alla volta.
 *
 * Il livello 6 chiedeva "chiudi 1 colonna". Lo stesso, identico, dei livelli 2 e 10. E il
 * livello 5 chiedeva "1 riga" dopo che il livello 1 ne aveva chieste 2: il bersaglio
 * SCENDEVA. In tutto il percorso "intreccio 2" compariva otto volte, "gruppi 5" sei,
 * "quadranti 8" cinque. Un livello che chiede la stessa cosa che hai gia' fatto quattro
 * livelli prima e' banale per definizione, per quante mosse gli si tolgano.
 *
 * La causa: il bersaglio nasce da un percentile della prestazione su QUEL livello, con
 * QUELLA griglia. Griglie diverse danno distribuzioni diverse, il percentile sale piano, e
 * l'arrotondamento a numeri interi schiaccia tutto su pochi valori. Niente teneva insieme
 * la sequenza.
 *
 * La regola qui e' minima e non inventa numeri: il bersaglio di un tipo non puo' essere
 * piu' basso di quello gia' chiesto prima per lo stesso tipo, e dopo due richieste identiche
 * la terza sale di un gradino -- ma solo fino a dove la MISURA dice che si puo' arrivare
 * (il massimo che il metro ha davvero raggiunto su quel livello). Dove la misura
 * non lo permette, il bersaglio resta dov'e': meglio una ripetizione onesta di un bersaglio
 * inventato. Il controllo di superabilita' piu' in basso ha comunque l'ultima parola.
 */
/**
 * I LIVELLI DOPPI RESTANO FUORI DA QUESTA REGOLA, e vale la pena dire perche'.
 *
 * La regola esiste contro una sensazione precisa: "questo me l'hai gia' chiesto". Su un
 * livello che chiede due cose insieme quella sensazione non c'e', perche' la richiesta e'
 * visibilmente un'altra: "chiudi 3 righe E fai 400 punti" non e' "chiudi 3 righe", nemmeno
 * se il numero delle righe e' piu' basso di quello chiesto dieci livelli prima. Anzi: i
 * livelli doppi partono apposta da un percentile scontato, e costringerli a non scendere
 * mai sotto l'ultimo bersaglio singolo cancellerebbe lo sconto -- cioe' farebbe con la
 * mano destra il contrario di quello che la sinistra ha appena progettato.
 *
 * Per lo stesso motivo non aggiornano `ultimo`: un bersaglio scontato non deve diventare
 * il pavimento dei livelli singoli che vengono dopo.
 */
console.log('  Rendo i bersagli crescenti dentro ogni tipo');
const ultimo = {};
const ripetuti = {};
const alzati = [];
for (const q of quadri) {
  if (q.tipi.length > 1) continue;
  const tipo = q.tipi[0];
  const partenza = q.bersagli[0];
  const massimo = q.massimi[0];
  const precedente = ultimo[tipo];

  // Non scendere sotto quello gia' chiesto -- ma mai oltre cio' che la misura dice
  // raggiungibile su questo livello: alzare oltre il massimo misurato sarebbe inventare
  // un numero.
  if (precedente !== undefined) {
    q.bersagli[0] = Math.max(q.bersagli[0], Math.min(precedente, massimo));
  }

  if (precedente !== undefined && q.bersagli[0] === precedente) {
    ripetuti[tipo] = (ripetuti[tipo] ?? 0) + 1;
    // MAI due richieste identiche di fila dentro lo stesso tipo. La prima versione ne
    // tollerava due, ragionando che due griglie diverse fanno due problemi diversi. E'
    // vero, ma non basta a chi legge "chiudi 1 colonna" per la seconda volta: il livello
    // 6 chiedeva la stessa cosa del 2, ed e' quello che un giocatore ha chiamato "molto
    // banale". La ripetizione resta possibile solo dove la MISURA la impone -- cioe' dove
    // su quella griglia il metro non arriva a un gradino piu' su.
    if (ripetuti[tipo] >= 1) {
      const su = gradinoSopra(tipo, q.bersagli[0]);
      if (su <= massimo) { q.bersagli[0] = su; ripetuti[tipo] = 0; }
    }
  } else {
    ripetuti[tipo] = 0;
  }

  ultimo[tipo] = q.bersagli[0];
  if (q.bersagli[0] !== partenza) {
    alzati.push(`quadro ${q.numero}: ${tipo} da ${partenza} a ${q.bersagli[0]}`);
  }
}
if (alzati.length) {
  console.log(`  Bersagli alzati per non scendere o non ripetersi (${alzati.length}):`);
  alzati.slice(0, 12).forEach((r) => console.log(`    ${r}`));
  if (alzati.length > 12) console.log(`    ... e altri ${alzati.length - 12}`);
} else {
  console.log('  Nessun bersaglio da alzare: la sequenza saliva gia.');
}

/**
 * IL TETTO DI MOSSE SI MISURA, non si prende dall'atto.
 *
 * Era una costante dell'atto, uguale per ogni tipo di obiettivo. Ma "chiudi 1 colonna" e
 * "fai 500 punti" non chiedono lo stesso tempo, e dare a entrambi 14 mosse vuol dire fare
 * due livelli diversissimi con lo stesso numero. Misurato: 19 livelli su 100 si vincevano
 * SEMPRE con piu' del 45% delle mosse avanzate, e uno -- "intreccio 2 in 24 mosse" -- si
 * vinceva alla seconda mossa. Un giocatore lo ha detto con parole piu' semplici delle mie:
 * "il livello 6 e' molto banale". Chiedeva una colonna in 14 mosse e se ne usavano 7.
 *
 * Qui si misura quante mosse servono davvero per arrivare al bersaglio, e il tetto diventa
 * quel numero moltiplicato per il MARGINE dell'atto: 1,45 all'inizio (quasi meta' del tempo
 * di respiro) e 1,05 alla fine (appena il fiato). E' questa la leva che fa salire davvero la
 * difficolta' lungo il percorso: il percentile del bersaglio da solo non ci riusciva.
 *
 * NON la mediana, e nemmeno il minimo: il SETTANTESIMO PERCENTILE. Il minimo e' la partita
 * fortunata, e tarare sul caso fortunato vuol dire chiedere a tutti di essere fortunati. Ma
 * anche la mediana e' troppo tirata dove il tempo necessario ha una varianza enorme: sui
 * livelli a punteggio si possono fare trecento punti in una mossa con una catena di bombe
 * oppure in dieci accumulandoli, e la mediana finiva per dare un tetto da partita fortunata.
 *
 * E UN PAVIMENTO DI OTTO MOSSE. Il pavimento era quattro, e produceva livelli che non sono
 * problemi ma monetine: "325 punti in 4 mosse" si vinceva sempre alla prima mossa, e
 * chiedendone 350 non ci si arrivava quasi mai. Fra i due valori non c'e' una salita, c'e'
 * un gradino -- perche' in quattro mosse o capita la catena giusta o non capita, e non c'e'
 * spazio per costruire niente. Sotto le otto mosse un livello smette di essere una prova di
 * abilita' e diventa un sorteggio.
 */
const MOSSE_MINIME = 8;
const PROVE_MOSSE = 12;
console.log('  Misuro quante mosse servono davvero, e stringo il tetto');
const tettiCambiati = [];
for (const q of quadri) {
  const necessarie = [];
  for (let i = 0; i < PROVE_MOSSE; i += 1) {
    const m = mosseNecessarie(q, q.bersagli, q.maxMosse, createRng(seedFromString(`mosse-${q.numero}-${i}`)));
    if (m !== null) necessarie.push(m);
  }
  // Nessuna vittoria con il tetto generoso: il tetto non e' il problema di questo livello,
  // e stringerlo peggiorerebbe soltanto. Ci pensa il controllo di superabilita' qui sotto.
  if (necessarie.length === 0) continue;

  const tipico = percentile(necessarie, 70);
  const nuovo = Math.max(MOSSE_MINIME, Math.min(q.maxMosse, Math.ceil(tipico * q.margine)));
  if (nuovo !== q.maxMosse) {
    tettiCambiati.push({ numero: q.numero, tipo: q.tipi.join('+'), da: q.maxMosse, a: nuovo, tipico });
    q.maxMosse = nuovo;
  }
}
if (tettiCambiati.length) {
  const stretti = tettiCambiati.filter((t) => t.a < t.da);
  const tolte = stretti.reduce((a, t) => a + (t.da - t.a), 0);
  console.log(
    `  Tetti stretti: ${stretti.length} livelli, ${tolte} mosse tolte in totale `
    + `(la piu' grande: quadro ${stretti.sort((a, b) => (b.da - b.a) - (a.da - a.a))[0].numero}, `
    + `da ${stretti[0].da} a ${stretti[0].a})`,
  );
}

/**
 * VENTI PROVE, NON DODICI, e il motivo e' aritmetico.
 *
 * Dodici prove misurano a scalini di un dodicesimo, cioe' circa otto punti percentuali:
 * con dodici partite non si distingue un livello al 40% da uno al 50%. Finche' l'unico
 * requisito era un pavimento unico ("almeno 4 su 12") quella grana bastava, perche' si
 * chiedeva una cosa sola e grossolana: che il livello si potesse vincere. Le bande per
 * atto chiedono invece proprio la distinzione che dodici prove non sanno fare.
 *
 * Venti prove costano un terzo di tempo in piu' sui tre controlli che decidono, e portano
 * lo scalino al 5%. Non e' precisione da laboratorio -- per quella servirebbero centinaia
 * di partite per livello e ore di generazione -- ma e' abbastanza fine per le bande qui
 * sopra, ed e' ripetibile: i semi sono fissi, quindi due generazioni sullo stesso progetto
 * danno lo stesso risultato.
 *
 * Le soglie restano scritte come CONTEGGI SU VENTI e non come percentuali, per non far
 * finta di una precisione che non c'e'.
 */
const PROVE_SUPERAMENTO = 20;

/**
 * Il pavimento ASSOLUTO, sotto il quale nessun atto puo' scendere per quanto la sua banda
 * sia bassa: sei riuscite su venti, cioe' il 30%. Serve come rete: se un domani una banda
 * venisse scritta troppo severa, il livello resterebbe comunque superabile.
 */
const MINIME_RIUSCITE = 6;

/** Il pavimento di questo livello: quello del suo atto, mai sotto la rete assoluta. */
function pavimentoDi(q) { return Math.max(MINIME_RIUSCITE, q.riuscite[0]); }
/** Il soffitto di questo livello: quello del suo atto. */
function soffittoDi(q) { return q.riuscite[1]; }

/**
 * LE MOSSE CHE SERVONO, SEME PER SEME: la misura che i tre controlli si passano.
 *
 * Il giocatore artificiale NON GUARDA il tetto di mosse -- sceglie la mossa dalla griglia,
 * dalla mano e dai suoi pesi -- quindi con lo stesso seme gioca la stessa identica partita
 * qualunque tetto gli si dia. Quante mosse gli servono per arrivare al bersaglio e' percio'
 * una proprieta' del SEME e del BERSAGLIO, non del tetto.
 *
 * Da qui due conseguenze, e sono la ragione per cui questa funzione esiste.
 *
 * PRIMA: misurata una volta col tetto piu' largo dell'atto, la riuscita a QUALUNQUE tetto
 * piu' stretto e' una conta -- quanti di quei numeri stanno sotto il tetto -- non altre
 * partite. Prima ogni controllo rigiocava venti partite per ogni tetto tentato.
 *
 * SECONDA: i tre controlli che seguono -- superabilita', banalita', banda dell'atto --
 * misurano tutti la stessa cosa sugli stessi semi. Tenendo il risultato in memoria, il
 * secondo e il terzo non giocano niente finche' il bersaglio non cambia. Il risparmio non
 * e' un lusso: senza, una generazione dura ore e ritoccare la ricetta diventa impossibile.
 *
 * Non e' un'approssimazione: e' lo stesso identico numero che si otterrebbe rigiocando.
 */
const misurato = new Map();
/** Il tetto piu' largo che l'atto possa mai concedere: si misura sempre a quello. */
function tettoDiMisura(q) { return interpola(attoDi(q.numero).mosse, 1); }
function mosseSeme(q, bersagli) {
  const tetto = Math.max(tettoDiMisura(q), q.maxMosse);
  const chiave = `${q.numero}|${bersagli.join(',')}|${tetto}`;
  if (misurato.has(chiave)) return misurato.get(chiave);
  const n = [];
  for (let i = 0; i < PROVE_SUPERAMENTO; i += 1) {
    n.push(mosseNecessarie(q, bersagli, tetto, createRng(seedFromString(`prova-${q.numero}-${i}`))));
  }
  misurato.set(chiave, n);
  return n;
}
/** Quante di quelle partite si vincono entro un dato tetto. */
function vinteEntro(n, tetto) { return n.filter((m) => m !== null && m <= tetto).length; }

console.log(
  `  Controllo che ogni livello stia nella banda del suo atto, su ${PROVE_SUPERAMENTO} tentativi`,
);
const abbassati = [];
const allargati = [];
const muri = [];
for (const q of quadri) {
  // I semi sono gli STESSI a ogni gradino della discesa. Non e' un dettaglio: con lo
  // stesso seme il giocatore fa le stesse mosse e si ferma solo prima, quindi un bersaglio
  // piu' basso non puo' mai riuscire meno di uno piu' alto. Con semi nuovi a ogni gradino
  // la discesa diventerebbe un sorteggio, e si fermerebbe al primo colpo fortunato.
  const pavimento = pavimentoDi(q);
  const prova = (bersagli) => vinteEntro(mosseSeme(q, bersagli), q.maxMosse) >= pavimento;

  if (prova(q.bersagli)) continue;

  // PRIMA si allarga il tetto, POI si abbassa il bersaglio. L'ordine non e' arbitrario: il
  // tetto lo abbiamo appena stretto noi, quindi e' il sospettato numero uno, e restituire
  // mosse costa meno che rinunciare a cio' che il livello chiede. Abbassare il bersaglio e'
  // l'ultima risorsa perche' cambia l'IDENTITA' del livello: "chiudi 6 righe" che diventa
  // "chiudine 4" e' un altro livello, mentre "in 12 mosse invece che in 10" e' lo stesso.
  //
  // Le mosse necessarie sono gia' in mano, quindi il tetto giusto non si cerca a tentoni:
  // si prende il piu' STRETTO che basti, invece del primo multiplo di due che capita.
  const tettoStretto = q.maxMosse;
  const tettoLargo = tettoDiMisura(q);
  const mosse = mosseSeme(q, q.bersagli);
  let allargato = false;
  for (let t = tettoStretto + 1; t <= tettoLargo; t += 1) {
    if (vinteEntro(mosse, t) >= pavimento) { q.maxMosse = t; allargato = true; break; }
  }
  if (allargato) {
    allargati.push(`quadro ${q.numero}: da ${tettoStretto} a ${q.maxMosse} mosse`);
    continue;
  }
  q.maxMosse = tettoStretto;

  // SU UN LIVELLO DOPPIO SI SCENDE A TURNO, un gradino per obiettivo.
  //
  // L'alternativa -- svuotare prima un obiettivo e poi l'altro -- arriverebbe allo stesso
  // punto per una strada che passa da livelli sbilanciati ("chiudi 1 riga e fai 700
  // punti"), e siccome la discesa si ferma al primo bersaglio che funziona, e' proprio uno
  // di quelli sbilanciati che finirebbe nel gioco. A turno, invece, le due meta' restano
  // nella stessa proporzione in cui sono state progettate.
  const partenza = [...q.bersagli];
  const bersagli = [...q.bersagli];
  let riuscito = false;
  let giro = 0;
  while (bersagli.some((b, i) => b > fondoScala(q.tipi[i]))) {
    const i = giro % q.tipi.length;
    giro += 1;
    if (bersagli[i] <= fondoScala(q.tipi[i])) continue;
    bersagli[i] = scendiDiUno(q.tipi[i], bersagli[i]);
    if (prova(bersagli)) { riuscito = true; break; }
  }
  if (!riuscito) {
    muri.push(`quadro ${q.numero} (${q.tipi.join('+')}, ${q.maxMosse} mosse, motivo "${q.motivo}", pavimento ${pavimento}/${PROVE_SUPERAMENTO})`);
    continue;
  }
  q.bersagli = bersagli;
  abbassati.push(`quadro ${q.numero}: ${q.tipi.join('+')} da ${partenza.join('+')} a ${bersagli.join('+')}`);
}

if (allargati.length) {
  console.log(`  Tetti riallargati perche' li avevo stretti troppo (${allargati.length}):`);
  allargati.forEach((r) => console.log(`    ${r}`));
}
if (abbassati.length) {
  console.log(`  Bersagli abbassati perche' sotto la soglia (${abbassati.length}):`);
  abbassati.forEach((r) => console.log(`    ${r}`));
} else {
  console.log('  Nessun bersaglio da abbassare: ogni livello si supera com era tarato.');
}
if (muri.length) {
  throw new Error(
    `Livelli sotto la soglia anche al bersaglio minimo: ${muri.join('; ')}. `
    + 'Non e il bersaglio a essere sbagliato: e il progetto del livello.',
  );
}

/**
 * NESSUN LIVELLO BANALE. Il controllo speculare a quello qui sopra.
 *
 * Ieri ho messo il pavimento e non il tetto: il generatore si rifiutava di produrre un
 * livello troppo difficile, e non aveva niente da dire su uno che si vince senza
 * accorgersene. La regola era "dev'essere divertente, non una tortura", e l'avevo applicata
 * da un lato solo -- mentre un livello banale e' l'altro modo di non essere divertente,
 * quello che fa saltare i primi venti livelli a chi gioca.
 *
 * "Banale" qui e' misurabile: superato QUASI SEMPRE e con molto tempo che avanza. Le due
 * condizioni servono entrambe. Solo "superato sempre" boccerebbe i primi livelli, che
 * devono essere facili -- insegnano. Solo "tempo che avanza" boccerebbe i livelli in cui si
 * vince presto o si perde, che sono tesi e non banali. Insieme descrivono la cosa giusta:
 * un livello che non chiede niente e nemmeno finge.
 *
 * La cura e' togliere mosse, non alzare il bersaglio: alzare il bersaglio cambierebbe
 * l'identita' del livello, e su `intreccio` e `catena` non funzionerebbe comunque perche'
 * il bersaglio non ha spazio per crescere.
 */
const QUOTA_BANALE = 0.85;    // superato piu' spesso di cosi'...
const MARGINE_BANALE = 0.45;  // ...e con piu' di questa frazione di mosse avanzate
console.log('  Controllo che nessun livello sia banale');
const sgonfiati = [];
const alzatiPerBanalita = [];
const restanoBanali = [];
for (const q of quadri) {
  // GLI STESSI SEMI del controllo di superabilita', non semi propri.
  //
  // La prima versione ne usava di suoi, per non "riusare" lo stesso campione. Il
  // risultato: il quadro 55 risultava vinto 12 volte su 12 al controllo di banalita' e
  // meno di 4 su 12 a quello di superabilita', sullo STESSO bersaglio. Non era rumore
  // statistico -- era che i due controlli guardavano partite diverse e si
  // contraddicevano, cosi' il ciclo che alza il bersaglio si fermava subito
  // lasciando il livello banale.
  //
  // Su un livello al limite -- "325 punti in 4 mosse" si vince solo con una catena di
  // bombe fortunata -- l'esito dipende quasi solo da come il giocatore rompe i pareggi,
  // e due flussi casuali diversi danno due risposte opposte. E' la stessa lezione gia'
  // imparata due volte oggi: chi decide e chi verifica devono usare lo stesso metro,
  // e il metro comprende i semi.
  //
  // E SI GIOCA UNA VOLTA SOLA PER BERSAGLIO. Il giocatore non guarda il tetto -- sceglie
  // la mossa dalla griglia, dalla mano e dai suoi pesi -- quindi con lo stesso seme gioca
  // la stessa partita qualunque tetto gli si dia, e le mosse che gli servono per arrivare
  // al bersaglio sono una proprieta' del SEME. Misurate una volta col tetto piu' largo,
  // la riuscita e il margine a qualunque tetto piu' stretto sono una conta, non altre
  // partite. Prima questo ciclo rigiocava venti partite per ogni singola mossa tolta.
  const necessarieCon = (bersagli) => mosseSeme(q, bersagli);
  let mosseNec = necessarieCon(q.bersagli);
  const misuraDa = (n, tetto) => {
    const vinte = n.filter((m) => m !== null && m <= tetto);
    const usateTotali = vinte.reduce((t, m) => t + m, 0);
    return {
      quota: vinte.length / PROVE_SUPERAMENTO,
      margine: vinte.length === 0 ? 0 : (tetto - usateTotali / vinte.length) / tetto,
    };
  };
  const misura = (tetto) => misuraDa(mosseNec, tetto);

  let { quota, margine } = misura(q.maxMosse);
  if (quota <= QUOTA_BANALE || margine <= MARGINE_BANALE) continue;

  // Si stringe finche' smette di essere banale, senza mai scendere sotto la soglia di
  // superabilita': la cura non deve creare il difetto opposto.
  const partenza = q.maxMosse;
  let tetto = q.maxMosse;
  while (tetto > MOSSE_MINIME && quota > QUOTA_BANALE && margine > MARGINE_BANALE) {
    const provato = tetto - 1;
    const dopo = misura(provato);
    if (dopo.quota * PROVE_SUPERAMENTO < pavimentoDi(q)) break;
    tetto = provato;
    quota = dopo.quota;
    margine = dopo.margine;
  }
  if (tetto !== partenza) {
    q.maxMosse = tetto;
    sgonfiati.push(`quadro ${q.numero}: ${q.tipi.join('+')} da ${partenza} a ${tetto} mosse`);
  }

  /**
   * Se il tetto e' gia' al minimo e il livello resta banale, si alza il BERSAGLIO.
   *
   * E' l'ultima risorsa, non la prima, perche' alzare il bersaglio cambia l'identita' del
   * livello. Ma quando la si salta si ottengono livelli come "250 punti in 4 mosse", che
   * si vincono alla PRIMA mossa con una buona catena di bombe: togliere altro tempo non
   * serve, perche' il tempo non era il problema.
   *
   * L'origine di quei bersagli troppo bassi merita di essere scritta, perche' e' lo stesso
   * difetto gia' trovato altrove in questo file: il bersaglio lo tara un giocatore che
   * gioca SENZA obiettivo, e a usarlo e' un giocatore che ci MIRA. Sui punteggi i due non
   * si somigliano affatto -- chi punta ai punti costruisce una catena e in una mossa ne
   * fa duecento, chi gioca bene e basta li accumula piano. Tarare con l'uno e verificare
   * con l'altro produce bersagli scollegati. Qui non lo si corregge alla radice, perche'
   * "fin dove arriva chi gioca bene" resta la domanda giusta per costruire una curva: lo
   * si corregge dove il divario si vede, cioe' quando il livello risulta banale.
   */
  if (quota > QUOTA_BANALE && margine > MARGINE_BANALE) {
    const partenzaBersagli = q.bersagli.join('+');
    let giro = 0;
    while (quota > QUOTA_BANALE && margine > MARGINE_BANALE) {
      // A turno come nella discesa, e per la stessa ragione: le due meta' devono
      // crescere insieme, non una sola fino a sbilanciare il livello.
      const i = giro % q.tipi.length;
      giro += 1;
      const tenta = [...q.bersagli];
      tenta[i] = gradinoSopra(q.tipi[i], tenta[i]);
      // Il bersaglio e' cambiato, quindi le mosse necessarie vanno rimisurate: sono
      // l'unica cosa che dipende dal bersaglio e non dal tetto.
      const nuove = necessarieCon(tenta);
      const vinte = nuove.filter((m) => m !== null && m <= q.maxMosse).length;
      if (vinte < pavimentoDi(q)) break;   // oltre si scavallerebbe nel troppo difficile
      q.bersagli = tenta;
      mosseNec = nuove;
      ({ quota, margine } = misura(q.maxMosse));
    }
    if (q.bersagli.join('+') !== partenzaBersagli) {
      alzatiPerBanalita.push(`quadro ${q.numero}: ${q.tipi.join('+')} da ${partenzaBersagli} a ${q.bersagli.join('+')}`);
    }
  }

  if (quota > QUOTA_BANALE && margine > MARGINE_BANALE) {
    restanoBanali.push(
      `quadro ${q.numero} (${q.tipi.join('+')} ${q.bersagli.join('+')}, ${q.maxMosse} mosse): `
      + `vinto nel ${Math.round(quota * 100)}% dei tentativi con il ${Math.round(margine * 100)}% di mosse avanzate`,
    );
  }
}
if (sgonfiati.length) {
  console.log(`  Tetti stretti perche' il livello era banale (${sgonfiati.length}):`);
  sgonfiati.forEach((r) => console.log(`    ${r}`));
} else {
  console.log('  Nessun livello banale da correggere.');
}
if (alzatiPerBanalita.length) {
  console.log(`  Bersagli alzati perche' il tetto era gia al minimo (${alzatiPerBanalita.length}):`);
  alzatiPerBanalita.forEach((r) => console.log(`    ${r}`));
}
if (restanoBanali.length) {
  // Non ferma la generazione: un livello che resta facile anche col tetto al minimo e'
  // un livello il cui OBIETTIVO non chiede abbastanza, e si corregge nel progetto degli
  // atti qui sopra -- non stringendo ancora, che a un certo punto lo rende impossibile.
  console.log(`\n  ATTENZIONE — livelli ancora banali col tetto stretto al minimo (${restanoBanali.length}):`);
  restanoBanali.forEach((r) => console.log(`    ${r}`));
  console.log('    Non e il tetto: e il tipo di obiettivo che non chiede abbastanza.\n');
}

/**
 * LA BANDA DELL'ATTO: il livello deve starci dentro, da sopra e da sotto.
 *
 * Il controllo di superabilita' piu' in alto guarda solo il pavimento, e quello di
 * banalita' guarda un soffitto fatto di DUE condizioni insieme -- vinto quasi sempre E con
 * molto tempo che avanza -- che serviva a non bocciare i livelli tesi. Fra i due resta
 * scoperto il caso che ha allentato il finale del gioco: il livello vinto quasi sempre
 * SENZA tempo che avanza. Il quadro 96 chiedeva 14 gruppi in 33 mosse, si vinceva 96 volte
 * su 100 e il giocatore ne usava 30 su 33: nessuna delle due condizioni bastava a
 * prenderlo, e il risultato era un ultimo atto piu' facile del penultimo.
 *
 * Qui il livello viene portato dentro la banda del suo atto. LA LEVA E' IL TETTO DI MOSSE
 * in entrambe le direzioni: toglierne fa scendere la riuscita, aggiungerne la fa salire, e
 * in nessuno dei due casi il livello diventa un altro livello. Il bersaglio si tocca solo
 * quando il tetto ha finito la corsa.
 *
 * VENTI PARTITE BASTANO A PROVARE TUTTI I TETTI, e questo merita di essere scritto perche'
 * e' cio' che rende il controllo eseguibile. La prima stesura rigiocava venti partite per
 * ogni tetto tentato: fino a ventiquattro tetti per livello, cioe' quasi cinquecento
 * partite a livello e ore di generazione. Ma il giocatore NON GUARDA il tetto -- sceglie
 * la mossa dalla griglia, dalla mano e dai suoi pesi -- quindi con lo stesso seme gioca la
 * stessa identica partita qualunque tetto gli si dia. Il numero di mosse che gli servono
 * per arrivare al bersaglio e' quindi una proprieta' del SEME, non del tetto.
 *
 * Si misura una volta sola, col tetto piu' largo dell'atto, e si ottengono venti numeri:
 * le mosse necessarie seme per seme (o "mai", se quella partita non ci arriva). Da li' la
 * riuscita a QUALSIASI tetto e' una conta, non altre partite: quanti di quei numeri stanno
 * sotto il tetto. Venti partite per livello invece di cinquecento, e lo stesso risultato
 * esatto -- non un'approssimazione.
 *
 * IL PAVIMENTO VINCE SEMPRE SUL SOFFITTO. Stringere un livello fino a portarlo sotto la
 * sua banda sarebbe sostituire un difetto con il suo opposto, e fra i due il muro e'
 * peggio: un livello troppo facile annoia, uno imbattibile chiude i novantanove che
 * vengono dopo.
 *
 * QUANDO NON CI SI RIESCE non si ferma la generazione, si SCRIVE. Un livello che resta
 * fuori banda anche con le leve a fondo corsa non ha un difetto di taratura: ha un difetto
 * di progetto -- il tipo di obiettivo, il motivo della griglia, l'intervallo di mosse
 * dell'atto -- e si corregge nella ricetta qui sopra, non forzando la misura.
 */
/**
 * Quanti gradini di bersaglio provare prima di arrendersi.
 *
 * Erano dodici e si fermavano al primo gradino che non migliorava. Misurato: il quadro 55
 * chiedeva 350 punti in 8 mosse, si vinceva 20 volte su 20 contro un soffitto di 15, e il
 * generatore lo lasciava li'. Alzare di 25 punti su 350 non sposta niente -- e' il 7% --
 * quindi il primo gradino pareggiava e il ciclo si arrendeva. Ma alzare un bersaglio non
 * puo' MAI allontanare dalla banda quando si sta sopra il soffitto: al peggio non serve.
 * Quindi non ci si ferma su un pareggio, ci si ferma solo se peggiora, e i gradini
 * disponibili raddoppiano: ventiquattro gradini sono +600 punti, abbastanza da mordere.
 */
const PASSI_BERSAGLIO = 24;
console.log('  Porto ogni livello dentro la banda del suo atto');
const tettiPerTensione = [];
const bersagliPerTensione = [];
const fuoriBanda = [];
for (const q of quadri) {
  const pavimento = pavimentoDi(q);
  const soffitto = soffittoDi(q);
  const tettoLargo = Math.max(q.maxMosse, tettoDiMisura(q));

  // Le mosse necessarie seme per seme, misurate una volta sola col tetto piu' largo.
  // Gli STESSI semi degli altri due controlli: chi decide e chi verifica devono guardare
  // le stesse partite.
  const necessarie = (bersagli) => mosseSeme(q, bersagli);
  const vinteA = (n, tetto) => vinteEntro(n, tetto);
  /** Il tetto piu' STRETTO che tiene la riuscita dentro la banda, se esiste. */
  const tettoMigliore = (n) => {
    let scelto = null;
    for (let t = MOSSE_MINIME; t <= tettoLargo; t += 1) {
      const v = vinteA(n, t);
      if (v >= pavimento && v <= soffitto) { scelto = t; break; }
    }
    return scelto;
  };

  let mosse = necessarie(q.bersagli);
  let vinte = vinteA(mosse, q.maxMosse);
  q.riusciteMisurate = vinte;
  if (vinte >= pavimento && vinte <= soffitto) continue;

  const tettoPartenza = q.maxMosse;
  const scelto = tettoMigliore(mosse);
  if (scelto !== null) {
    q.maxMosse = scelto;
    vinte = vinteA(mosse, scelto);
  } else {
    // Nessun tetto fa rientrare il livello: si tiene quello che ci va piu' vicino, e poi
    // si passa al bersaglio.
    let migliore = q.maxMosse;
    let distanza = Infinity;
    for (let t = MOSSE_MINIME; t <= tettoLargo; t += 1) {
      const v = vinteA(mosse, t);
      const d = v < pavimento ? pavimento - v : v - soffitto;
      if (d < distanza) { distanza = d; migliore = t; }
    }
    q.maxMosse = migliore;
    vinte = vinteA(mosse, migliore);
  }
  if (q.maxMosse !== tettoPartenza) {
    tettiPerTensione.push(
      `quadro ${q.numero}: da ${tettoPartenza} a ${q.maxMosse} mosse `
      + `(riuscite ${vinte}/${PROVE_SUPERAMENTO}, banda ${pavimento}-${soffitto})`,
    );
  }

  // Il tetto ha finito la corsa e il livello e' ancora fuori: si tocca il bersaglio, a
  // turno fra gli obiettivi, nella direzione che serve. Dopo ogni gradino il tetto viene
  // riscelto, perche' un bersaglio diverso cambia le mosse necessarie.
  if (vinte > soffitto || vinte < pavimento) {
    const partenzaBersagli = q.bersagli.join('+');
    const tettoPrimaDelBersaglio = q.maxMosse;
    let giro = 0;
    for (let passo = 0; passo < PASSI_BERSAGLIO; passo += 1) {
      if (vinte >= pavimento && vinte <= soffitto) break;
      const i = giro % q.tipi.length;
      giro += 1;
      const tenta = [...q.bersagli];
      if (vinte > soffitto) {
        tenta[i] = gradinoSopra(q.tipi[i], tenta[i]);
      } else {
        if (tenta[i] <= fondoScala(q.tipi[i])) continue;
        tenta[i] = scendiDiUno(q.tipi[i], tenta[i]);
      }
      const m = necessarie(tenta);
      const t = tettoMigliore(m);
      if (t !== null) {
        q.bersagli = tenta; q.maxMosse = t; mosse = m; vinte = vinteA(m, t);
        break;
      }
      // Non rientra nemmeno cosi': si tiene il gradino solo se avvicina alla banda.
      const tOra = q.maxMosse;
      const vNuovo = vinteA(m, tOra);
      const dOra = vinte < pavimento ? pavimento - vinte : vinte - soffitto;
      const dNuovo = vNuovo < pavimento ? pavimento - vNuovo : vNuovo - soffitto;
      if (dNuovo > dOra) break;
      q.bersagli = tenta; mosse = m; vinte = vNuovo;
    }
    if (q.bersagli.join('+') !== partenzaBersagli) {
      bersagliPerTensione.push(
        `quadro ${q.numero}: ${q.tipi.join('+')} da ${partenzaBersagli} a ${q.bersagli.join('+')} `
        + `(riuscite ${vinte}/${PROVE_SUPERAMENTO}, banda ${pavimento}-${soffitto})`,
      );
    }
    if (q.maxMosse !== tettoPrimaDelBersaglio && !tettiPerTensione.some((r) => r.startsWith(`quadro ${q.numero}:`))) {
      tettiPerTensione.push(
        `quadro ${q.numero}: da ${tettoPartenza} a ${q.maxMosse} mosse `
        + `(riuscite ${vinte}/${PROVE_SUPERAMENTO}, banda ${pavimento}-${soffitto})`,
      );
    }
  }

  q.riusciteMisurate = vinte;
  if (vinte > soffitto || vinte < pavimento) {
    fuoriBanda.push(
      `quadro ${q.numero} (${q.tipi.join('+')} ${q.bersagli.join('+')}, ${q.maxMosse} mosse): `
      + `${vinte}/${PROVE_SUPERAMENTO} riuscite, banda dell'atto ${pavimento}-${soffitto}`,
    );
  }
}
if (tettiPerTensione.length) {
  console.log(`  Tetti cambiati per rientrare nella banda (${tettiPerTensione.length}):`);
  tettiPerTensione.forEach((r) => console.log(`    ${r}`));
}
if (bersagliPerTensione.length) {
  console.log(`  Bersagli cambiati perche' il tetto era a fondo corsa (${bersagliPerTensione.length}):`);
  bersagliPerTensione.forEach((r) => console.log(`    ${r}`));
}
if (fuoriBanda.length) {
  console.log(`\n  ATTENZIONE — livelli rimasti fuori dalla banda del loro atto (${fuoriBanda.length}):`);
  fuoriBanda.forEach((r) => console.log(`    ${r}`));
  console.log('    Non e la taratura: e il progetto dell atto (tipo, motivo, intervallo di mosse).\n');
} else {
  console.log('  Tutti i livelli stanno nella banda del loro atto.');
}

/**
 * LA CURVA CHE E' USCITA DAVVERO, stampata atto per atto.
 *
 * E' il controllo che mancava a tutti gli altri: ognuno guardava UN livello, e la curva
 * del percorso non era responsabilita' di nessuno. Qui il file dichiara il risultato del
 * proprio lavoro con lo stesso metro con cui lo ha prodotto, cosi' la ricetta si giudica
 * da cio' che ha fatto e non da cio' che voleva fare.
 */
console.log('\n  La curva misurata, atto per atto:');
console.log('    atto          quadri   riuscite del metro          mosse  bersaglio al');
const curva = [];
for (const atto of ATTI) {
  const dentro = quadri.filter((q) => q.numero >= atto.da && q.numero <= atto.a);
  if (!dentro.length) continue;   // prova a vuoto su un tratto solo
  const media = dentro.reduce((t, q) => t + q.riusciteMisurate, 0) / dentro.length;
  curva.push({ id: atto.id, media });
  const quota = media / PROVE_SUPERAMENTO;
  const barra = '#'.repeat(Math.round(quota * 20)).padEnd(20, '.');
  const mosse = (dentro.reduce((t, q) => t + q.maxMosse, 0) / dentro.length).toFixed(0);
  const pc = (dentro.reduce((t, q) => t + q.percentile, 0) / dentro.length).toFixed(0);
  console.log(
    `    ${atto.id.padEnd(13)} ${String(atto.da).padStart(3)}-${String(atto.a).padEnd(3)} `
    + `${barra} ${String(Math.round(quota * 100)).padStart(3)}%   `
    + `(banda ${Math.round((atto.riuscite[0] / PROVE_SUPERAMENTO) * 100)}-${Math.round((atto.riuscite[1] / PROVE_SUPERAMENTO) * 100)}%)`
    + `   ${String(mosse).padStart(3)}   ${String(pc).padStart(3)}° perc.`,
  );
}
const risalite = curva
  .map((v, i) => (i > 0 && v.media > curva[i - 1].media + 0.5 ? v.id : null))
  .filter(Boolean);
if (risalite.length) {
  console.log(`\n  ATTENZIONE — la curva risale in questi atti: ${risalite.join(', ')}.`);
  console.log('    Un percorso che si allenta andando avanti e il difetto che le bande devono togliere.\n');
} else {
  console.log('\n  La curva scende a ogni atto: nessun tratto si allenta andando avanti.\n');
}

/**
 * I bersagli che NON sono stati misurati, ma inventati da un arrotondamento.
 *
 * I tre `Math.max` qui sopra danno un pavimento al bersaglio -- 100 punti, 9 celle, 1
 * gruppo -- perche' un bersaglio zero sarebbe un livello gia' vinto. Ma quando il
 * giocatore artificiale non arriva MAI a niente, cioe' quando il massimo misurato e' zero,
 * quel pavimento smette di essere una protezione e diventa esattamente la cosa che questo
 * file dichiara di non fare: un numero scritto a mano, spacciato per misura. Il livello
 * risulta imbattibile e il file non lo dice.
 *
 * Non e' un errore da fermare la generazione: "il metro non ci arriva mai" non e'
 * "nessuno ci arriva mai", e un obiettivo come svuotare la plancia una persona che ci
 * punta lo raggiunge dove un giocatore avido non ci prova. Ma va DETTO, ogni volta.
 */
const inventati = quadri.filter((q) => q.massimi.some((m) => m === 0));
if (inventati.length) {
  console.log('\n  ATTENZIONE — bersagli non misurati ma imposti dal pavimento:');
  inventati.forEach((q) => {
    console.log(
      `    quadro ${String(q.numero).padStart(3)}  ${q.tipi.join('+').padEnd(10)} bersaglio ${q.bersagli.join('+')}  `
      + `(il metro non ci e' mai arrivato in ${q.maxMosse} mosse, su ${TENTATIVI} partite)`,
    );
  });
  console.log('    Questi livelli risultano imbattibili al metro. Non e una misura: e un pavimento.\n');
} else {
  console.log('\n  Nessun bersaglio imposto dal pavimento: tutti misurati davvero.\n');
}

// -------------------------------------------------------------------- scrive ---
const righe = quadri.map((q) => {
  const griglia = q.griglia
    ? `\n    griglia: MOTIVI.${q.motivo},`
    : '';
  const obiettivi = q.tipi
    .map((tipo, i) => `{ tipo: '${tipo}', quanti: ${q.bersagli[i]} }`)
    .join(', ');
  return `  { numero: ${q.numero}, nome: '${q.nome}', atto: ${JSON.stringify(attoDi(q.numero).id)}, `
    + `obiettivi: [${obiettivi}], maxMosse: ${q.maxMosse},${griglia} },`;
});

const motiviTesto = Object.entries(MOTIVI)
  .filter(([, v]) => v)
  .map(([nome, righeMotivo]) => `  ${nome}: [\n${righeMotivo.map((r) => `    '${r}',`).join('\n')}\n  ].join('\\n'),`)
  .join('\n');

const file = `/**
 * I Quadri di PLINTO: cento livelli a difficolta' crescente.
 *
 * QUESTO FILE E' GENERATO da tools/genera-quadri.mjs. Modificarlo a mano funziona,
 * ma la prossima rigenerazione cancella le modifiche: meglio cambiare il progetto
 * nel generatore, dove stanno gli atti, i motivi delle griglie e la curva.
 *
 * I BERSAGLI NON SONO INVENTATI. Ogni livello e' stato giocato ${TENTATIVI} volte dal
 * giocatore artificiale senza obiettivo, e il bersaglio e' un percentile di quanto ha
 * effettivamente ottenuto in quel livello, con quella griglia e quel tetto di mosse.
 * Il percentile sale lungo il percorso: e' cosi' che cresce la difficolta'.
 * La prima stesura, scritta a mano, chiedeva 1500 punti dove se ne facevano 325.
 *
 * TARATI NELLA MODALITA' "${MODALITA_QUADRI}", cioe' la stessa in cui i Quadri si giocano.
 * Non e' un dettaglio: vedere la terna successiva cambia l'ordine in cui il generatore
 * legge la griglia, quindi lo stesso seme produce un'altra partita. Un bersaglio tarato
 * senza anteprima e giocato con l'anteprima e' un bersaglio misurato su un livello che
 * non esiste. MODALITA_TARATURA qui sotto lo dichiara, e un test controlla che
 * coincida con la modalita' davvero giocata.
 *
 * Le griglie iniziali sono verificate: nessuna contiene una riga, una colonna o un
 * quadrante gia' completi, e nessuna e' fatta di celle isolate (un motivo del genere
 * rende il livello ingiocabile, ed e' un errore gia' commesso e gia' misurato).
 */

/** Motivi delle griglie di ostacoli, condivisi fra piu' Quadri. */
const MOTIVI = {
${motiviTesto}
};

/** La modalita' di gioco in cui questi bersagli sono stati misurati. */
export const MODALITA_TARATURA = '${MODALITA_QUADRI}';

export const QUADRI = [
${righe.join('\n')}
];

/**
 * Gli atti del percorso: servono a far vedere dove si e' arrivati.
 *
 * Qui c'e' l'IDENTIFICATIVO, non il nome. Il nome visibile sta nelle traduzioni, sotto
 * "atti.<id>": finche' e' stato scritto qui, in italiano, chi giocava in inglese leggeva
 * "Le basi" e "La vetta" dentro un'interfaccia inglese, e nessuno se n'era accorto perche'
 * i dati generati non passano da nessun controllo sulle traduzioni.
 */
export const ATTI = ${JSON.stringify(ATTI.map((a) => ({ id: a.id, da: a.da, a: a.a })), null, 2).replace(/"([a-z]+)":/g, '$1:')};

/**
 * Le opere: i gruppi di livelli, ognuno con i suoi atti.
 *
 * Oggi ce n'e' UNA, il Ponte, e sono i cento livelli che esistono. La struttura e' al
 * plurale lo stesso, perche' e' il punto: aggiungere un gruppo nuovo deve voler dire
 * aggiungere una voce qui e i suoi livelli, non rimettere mano a come il gioco e' fatto.
 * I progressi sono gia' salvati per numero di livello, quindi un secondo gruppo che parte
 * dal 101 non chiede nessuna migrazione di quello che le persone hanno gia' fatto.
 *
 * Il nome sta nelle traduzioni, sotto "opere.<id>", per la stessa ragione degli atti.
 */
export const OPERE = [
  { id: 'ponte', da: 1, a: ${quadri.length} },
];

/** @param {number} numero */
export function quadroNumero(numero) {
  return QUADRI.find((q) => q.numero === numero) ?? null;
}

/**
 * L'opera a cui appartiene un Quadro: oggi c'e' solo il Ponte, e sono tutti e cento.
 * Esiste per la stessa ragione di \`attoDelQuadro\`: chi deve NOMINARE il gruppo non deve
 * sapere dove comincia e dove finisce, altrimenti quel confine finisce scritto in due
 * posti e uno dei due invecchia.
 */
export function operaDelQuadro(numero) {
  return OPERE.find((o) => numero >= o.da && numero <= o.a) ?? OPERE[OPERE.length - 1];
}

/** L'atto a cui appartiene un Quadro. */
export function attoDelQuadro(numero) {
  return ATTI.find((a) => numero >= a.da && numero <= a.a) ?? ATTI[ATTI.length - 1];
}

export const TOTALE_QUADRI = QUADRI.length;
`;

if (PROVA_A > 0) {
  console.log(`\n  PROVA A VUOTO (quadri ${PRIMO}-${ULTIMO}): non scrivo src/config/quadri.js.\n`);
} else {
  writeFileSync(new URL('../src/config/quadri.js', import.meta.url), file);
}

console.log(PROVA_A > 0
  ? `\nProvati ${quadri.length} Quadri, niente scritto su disco.\n`
  : `\nScritti ${quadri.length} Quadri in src/config/quadri.js\n`);
