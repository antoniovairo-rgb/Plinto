/**
 * I Quadri di PLINTO: cento livelli a difficolta' crescente.
 *
 * QUESTO FILE E' GENERATO da tools/genera-quadri.mjs. Modificarlo a mano funziona,
 * ma la prossima rigenerazione cancella le modifiche: meglio cambiare il progetto
 * nel generatore, dove stanno gli atti, i motivi delle griglie e la curva.
 *
 * I BERSAGLI NON SONO INVENTATI. Ogni livello e' stato giocato 7 volte dal
 * giocatore artificiale senza obiettivo, e il bersaglio e' un percentile di quanto ha
 * effettivamente ottenuto in quel livello, con quella griglia e quel tetto di mosse.
 * Il percentile sale lungo il percorso: e' cosi' che cresce la difficolta'.
 * La prima stesura, scritta a mano, chiedeva 1500 punti dove se ne facevano 325.
 *
 * TARATI NELLA MODALITA' "anteprima", cioe' la stessa in cui i Quadri si giocano.
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
  angoli: [
    '##.....##',
    '##.....##',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '##.....##',
    '##.....##',
  ].join('\n'),
  croce: [
    '.........',
    '.........',
    '.........',
    '...###...',
    '...#.#...',
    '...###...',
    '.........',
    '.........',
    '.........',
  ].join('\n'),
  cornice: [
    '########.',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
    '#.......#',
    '.########',
  ].join('\n'),
  scala: [
    '##.......',
    '##.......',
    '..##.....',
    '..##.....',
    '....##...',
    '....##...',
    '......##.',
    '......##.',
    '........#',
  ].join('\n'),
  isole: [
    '##....##.',
    '##....##.',
    '.........',
    '.........',
    '...##....',
    '...##....',
    '.........',
    '.##....##',
    '.##....##',
  ].join('\n'),
  colonne: [
    '##.##.##.',
    '##.##.##.',
    '##.##.##.',
    '.........',
    '.........',
    '.........',
    '##.##.##.',
    '##.##.##.',
    '##.##.##.',
  ].join('\n'),
  muro: [
    '########.',
    '########.',
    '.........',
    '.........',
    '.........',
    '.........',
    '.........',
    '.########',
    '.########',
  ].join('\n'),
  strettoia: [
    '##....##.',
    '#.#...#.#',
    '###...###',
    '.........',
    '.........',
    '.........',
    '###...###',
    '#.#...#.#',
    '##....##.',
  ].join('\n'),
  diagonale: [
    '##.......',
    '.##......',
    '..##.....',
    '...##....',
    '....##...',
    '.....##..',
    '......##.',
    '.......##',
    '........#',
  ].join('\n'),
  clessidra: [
    '#######..',
    '.#####...',
    '..###....',
    '...#.....',
    '.........',
    '.....#...',
    '....###..',
    '...#####.',
    '..#######',
  ].join('\n'),
  blocchi: [
    '##...##..',
    '##...##..',
    '.....##..',
    '..##.....',
    '..##...##',
    '.......##',
    '##...##..',
    '##...##..',
    '.........',
  ].join('\n'),
  fitto: [
    '###...###',
    '###...###',
    '.........',
    '...###...',
    '...###...',
    '.........',
    '###...###',
    '###...###',
    '.........',
  ].join('\n'),
  labirinto: [
    '#.#####.#',
    '#.......#',
    '#.#####.#',
    '#.#...#.#',
    '..#.#.#..',
    '#.#...#.#',
    '#.#####.#',
    '#.......#',
    '#.#####.#',
  ].join('\n'),
  assedio: [
    '###...###',
    '##.....##',
    '#.......#',
    '.........',
    '.........',
    '.........',
    '#.......#',
    '##.....##',
    '###...###',
  ].join('\n'),
  briciole: [
    '#........',
    '.#.......',
    '..#......',
    '.........',
    '.........',
    '.........',
    '......#..',
    '.......#.',
    '........#',
  ].join('\n'),
};

/** La modalita' di gioco in cui questi bersagli sono stati misurati. */
export const MODALITA_TARATURA = 'anteprima';

export const QUADRI = [
  { numero: 1, nome: 'righe1', atto: "fondamenta", obiettivi: [{ tipo: 'righe', quanti: 2 }], maxMosse: 14, },
  { numero: 2, nome: 'colonne2', atto: "fondamenta", obiettivi: [{ tipo: 'colonne', quanti: 1 }], maxMosse: 12, },
  { numero: 3, nome: 'quadranti3', atto: "fondamenta", obiettivi: [{ tipo: 'quadranti', quanti: 3 }], maxMosse: 13, },
  { numero: 4, nome: 'gruppi4', atto: "fondamenta", obiettivi: [{ tipo: 'gruppi', quanti: 4 }], maxMosse: 15, },
  { numero: 5, nome: 'righe5', atto: "fondamenta", obiettivi: [{ tipo: 'righe', quanti: 2 }], maxMosse: 12, },
  { numero: 6, nome: 'colonne6', atto: "fondamenta", obiettivi: [{ tipo: 'colonne', quanti: 2 }], maxMosse: 14, },
  { numero: 7, nome: 'quadranti7', atto: "fondamenta", obiettivi: [{ tipo: 'quadranti', quanti: 4 }], maxMosse: 16, },
  { numero: 8, nome: 'gruppi8', atto: "fondamenta", obiettivi: [{ tipo: 'gruppi', quanti: 3 }], maxMosse: 13, },
  { numero: 9, nome: 'righe9', atto: "fondamenta", obiettivi: [{ tipo: 'righe', quanti: 3 }], maxMosse: 15, },
  { numero: 10, nome: 'colonne10', atto: "fondamenta", obiettivi: [{ tipo: 'colonne', quanti: 3 }], maxMosse: 12, },
  { numero: 11, nome: 'gruppi11', atto: "pilastri", obiettivi: [{ tipo: 'gruppi', quanti: 4 }], maxMosse: 19, },
  { numero: 12, nome: 'quadranti12', atto: "pilastri", obiettivi: [{ tipo: 'quadranti', quanti: 8 }], maxMosse: 22,
    griglia: MOTIVI.angoli, },
  { numero: 13, nome: 'righe13', atto: "pilastri", obiettivi: [{ tipo: 'righe', quanti: 4 }], maxMosse: 18,
    griglia: MOTIVI.croce, },
  { numero: 14, nome: 'colonne14', atto: "pilastri", obiettivi: [{ tipo: 'colonne', quanti: 4 }], maxMosse: 21, },
  { numero: 15, nome: 'catena15', atto: "pilastri", obiettivi: [{ tipo: 'catena', quanti: 2 }], maxMosse: 10,
    griglia: MOTIVI.angoli, },
  { numero: 16, nome: 'gruppi16', atto: "pilastri", obiettivi: [{ tipo: 'gruppi', quanti: 5 }], maxMosse: 19,
    griglia: MOTIVI.croce, },
  { numero: 17, nome: 'quadranti17', atto: "pilastri", obiettivi: [{ tipo: 'quadranti', quanti: 6 }], maxMosse: 22, },
  { numero: 18, nome: 'righe18', atto: "pilastri", obiettivi: [{ tipo: 'righe', quanti: 5 }], maxMosse: 18,
    griglia: MOTIVI.angoli, },
  { numero: 19, nome: 'colonne19', atto: "pilastri", obiettivi: [{ tipo: 'colonne', quanti: 5 }], maxMosse: 19,
    griglia: MOTIVI.croce, },
  { numero: 20, nome: 'catena20', atto: "pilastri", obiettivi: [{ tipo: 'catena', quanti: 3 }], maxMosse: 19, },
  { numero: 21, nome: 'gruppi21', atto: "pilastri", obiettivi: [{ tipo: 'gruppi', quanti: 6 }], maxMosse: 19,
    griglia: MOTIVI.angoli, },
  { numero: 22, nome: 'quadranti22', atto: "pilastri", obiettivi: [{ tipo: 'quadranti', quanti: 7 }], maxMosse: 22,
    griglia: MOTIVI.croce, },
  { numero: 23, nome: 'righe23', atto: "pilastri", obiettivi: [{ tipo: 'righe', quanti: 5 }], maxMosse: 18, },
  { numero: 24, nome: 'colonne24', atto: "pilastri", obiettivi: [{ tipo: 'colonne', quanti: 7 }], maxMosse: 21,
    griglia: MOTIVI.angoli, },
  { numero: 25, nome: 'gruppi25', atto: "roccia", obiettivi: [{ tipo: 'gruppi', quanti: 7 }], maxMosse: 18,
    griglia: MOTIVI.scala, },
  { numero: 26, nome: 'quadranti26', atto: "roccia", obiettivi: [{ tipo: 'quadranti', quanti: 8 }], maxMosse: 22,
    griglia: MOTIVI.isole, },
  { numero: 27, nome: 'righe27', atto: "roccia", obiettivi: [{ tipo: 'righe', quanti: 7 }], maxMosse: 24,
    griglia: MOTIVI.cornice, },
  { numero: 28, nome: 'colonne28', atto: "roccia", obiettivi: [{ tipo: 'colonne', quanti: 8 }], maxMosse: 20,
    griglia: MOTIVI.colonne, },
  { numero: 29, nome: 'catena29', atto: "roccia", obiettivi: [{ tipo: 'catena', quanti: 4 }], maxMosse: 24,
    griglia: MOTIVI.blocchi, },
  { numero: 30, nome: 'gruppi30', atto: "roccia", obiettivi: [{ tipo: 'gruppi', quanti: 8 }], maxMosse: 20,
    griglia: MOTIVI.scala, },
  { numero: 31, nome: 'quadranti31', atto: "roccia", obiettivi: [{ tipo: 'quadranti', quanti: 8 }], maxMosse: 22,
    griglia: MOTIVI.isole, },
  { numero: 32, nome: 'righe32', atto: "roccia", obiettivi: [{ tipo: 'righe', quanti: 9 }], maxMosse: 26,
    griglia: MOTIVI.cornice, },
  { numero: 33, nome: 'colonne33', atto: "roccia", obiettivi: [{ tipo: 'colonne', quanti: 9 }], maxMosse: 20,
    griglia: MOTIVI.colonne, },
  { numero: 34, nome: 'catena34', atto: "roccia", obiettivi: [{ tipo: 'catena', quanti: 5 }], maxMosse: 23,
    griglia: MOTIVI.blocchi, },
  { numero: 35, nome: 'gruppi35', atto: "roccia", obiettivi: [{ tipo: 'gruppi', quanti: 6 }], maxMosse: 18,
    griglia: MOTIVI.scala, },
  { numero: 36, nome: 'quadranti36', atto: "roccia", obiettivi: [{ tipo: 'quadranti', quanti: 8 }], maxMosse: 22,
    griglia: MOTIVI.isole, },
  { numero: 37, nome: 'righe37', atto: "roccia", obiettivi: [{ tipo: 'righe', quanti: 10 }], maxMosse: 26,
    griglia: MOTIVI.cornice, },
  { numero: 38, nome: 'colonne38', atto: "roccia", obiettivi: [{ tipo: 'colonne', quanti: 10 }], maxMosse: 20,
    griglia: MOTIVI.colonne, },
  { numero: 39, nome: 'catena39', atto: "roccia", obiettivi: [{ tipo: 'catena', quanti: 5 }], maxMosse: 24,
    griglia: MOTIVI.blocchi, },
  { numero: 40, nome: 'gruppi40', atto: "roccia", obiettivi: [{ tipo: 'gruppi', quanti: 7 }], maxMosse: 20,
    griglia: MOTIVI.scala, },
  { numero: 41, nome: 'catena41', atto: "vuoto", obiettivi: [{ tipo: 'catena', quanti: 4 }], maxMosse: 20,
    griglia: MOTIVI.muro, },
  { numero: 42, nome: 'intrecci42', atto: "vuoto", obiettivi: [{ tipo: 'intrecci', quanti: 3 }], maxMosse: 24,
    griglia: MOTIVI.strettoia, },
  { numero: 43, nome: 'gruppi43', atto: "vuoto", obiettivi: [{ tipo: 'gruppi', quanti: 7 }], maxMosse: 18,
    griglia: MOTIVI.diagonale, },
  { numero: 44, nome: 'quadranti44', atto: "vuoto", obiettivi: [{ tipo: 'quadranti', quanti: 7 }], maxMosse: 22,
    griglia: MOTIVI.angoli, },
  { numero: 45, nome: 'punti45', atto: "vuoto", obiettivi: [{ tipo: 'punteggio', quanti: 200 }], maxMosse: 16,
    griglia: MOTIVI.croce, },
  { numero: 46, nome: 'catena46', atto: "vuoto", obiettivi: [{ tipo: 'catena', quanti: 5 }], maxMosse: 9,
    griglia: MOTIVI.muro, },
  { numero: 47, nome: 'intrecci47', atto: "vuoto", obiettivi: [{ tipo: 'intrecci', quanti: 3 }], maxMosse: 24,
    griglia: MOTIVI.strettoia, },
  { numero: 48, nome: 'gruppi48', atto: "vuoto", obiettivi: [{ tipo: 'gruppi', quanti: 7 }], maxMosse: 18,
    griglia: MOTIVI.diagonale, },
  { numero: 49, nome: 'quadranti49', atto: "vuoto", obiettivi: [{ tipo: 'quadranti', quanti: 8 }], maxMosse: 22,
    griglia: MOTIVI.angoli, },
  { numero: 50, nome: 'punti50', atto: "vuoto", obiettivi: [{ tipo: 'punteggio', quanti: 225 }], maxMosse: 16,
    griglia: MOTIVI.croce, },
  { numero: 51, nome: 'catena51', atto: "vuoto", obiettivi: [{ tipo: 'catena', quanti: 6 }], maxMosse: 20,
    griglia: MOTIVI.muro, },
  { numero: 52, nome: 'intrecci52', atto: "vuoto", obiettivi: [{ tipo: 'intrecci', quanti: 3 }], maxMosse: 24,
    griglia: MOTIVI.strettoia, },
  { numero: 53, nome: 'gruppi53', atto: "vuoto", obiettivi: [{ tipo: 'gruppi', quanti: 7 }], maxMosse: 20,
    griglia: MOTIVI.diagonale, },
  { numero: 54, nome: 'quadranti54', atto: "vuoto", obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 24,
    griglia: MOTIVI.angoli, },
  { numero: 55, nome: 'punti55', atto: "vuoto", obiettivi: [{ tipo: 'punteggio', quanti: 350 }], maxMosse: 8,
    griglia: MOTIVI.croce, },
  { numero: 56, nome: 'catena56', atto: "vuoto", obiettivi: [{ tipo: 'catena', quanti: 3 }], maxMosse: 20,
    griglia: MOTIVI.muro, },
  { numero: 57, nome: 'intrecci57', atto: "vuoto", obiettivi: [{ tipo: 'intrecci', quanti: 2 }], maxMosse: 24,
    griglia: MOTIVI.strettoia, },
  { numero: 58, nome: 'gruppi58', atto: "vuoto", obiettivi: [{ tipo: 'gruppi', quanti: 7 }], maxMosse: 20,
    griglia: MOTIVI.diagonale, },
  { numero: 59, nome: 'punti59', atto: "strada", obiettivi: [{ tipo: 'punteggio', quanti: 575 }], maxMosse: 28,
    griglia: MOTIVI.clessidra, },
  { numero: 60, nome: 'catena60', atto: "strada", obiettivi: [{ tipo: 'catena', quanti: 7 }], maxMosse: 19,
    griglia: MOTIVI.labirinto, },
  { numero: 61, nome: 'gruppi61', atto: "strada", obiettivi: [{ tipo: 'gruppi', quanti: 13 }], maxMosse: 25,
    griglia: MOTIVI.fitto, },
  { numero: 62, nome: 'celle62', atto: "strada", obiettivi: [{ tipo: 'celle', quanti: 102 }], maxMosse: 30,
    griglia: MOTIVI.assedio, },
  { numero: 63, nome: 'righe63', atto: "strada", obiettivi: [{ tipo: 'righe', quanti: 7 }], maxMosse: 23,
    griglia: MOTIVI.isole, },
  { numero: 64, nome: 'punti64', atto: "strada", obiettivi: [{ tipo: 'punteggio', quanti: 600 }], maxMosse: 30,
    griglia: MOTIVI.clessidra, },
  { numero: 65, nome: 'catena65', atto: "strada", obiettivi: [{ tipo: 'catena', quanti: 8 }], maxMosse: 13,
    griglia: MOTIVI.labirinto, },
  { numero: 66, nome: 'gruppi66', atto: "strada", obiettivi: [{ tipo: 'gruppi', quanti: 12 }], maxMosse: 25,
    griglia: MOTIVI.fitto, },
  { numero: 67, nome: 'celle67', atto: "strada", obiettivi: [{ tipo: 'celle', quanti: 111 }], maxMosse: 30,
    griglia: MOTIVI.assedio, },
  { numero: 68, nome: 'righe68', atto: "strada", obiettivi: [{ tipo: 'righe', quanti: 8 }], maxMosse: 23,
    griglia: MOTIVI.isole, },
  { numero: 69, nome: 'punti69', atto: "strada", obiettivi: [{ tipo: 'punteggio', quanti: 625 }], maxMosse: 30,
    griglia: MOTIVI.clessidra, },
  { numero: 70, nome: 'catena70', atto: "strada", obiettivi: [{ tipo: 'catena', quanti: 7 }], maxMosse: 20,
    griglia: MOTIVI.labirinto, },
  { numero: 71, nome: 'gruppi71', atto: "strada", obiettivi: [{ tipo: 'gruppi', quanti: 12 }], maxMosse: 25,
    griglia: MOTIVI.fitto, },
  { numero: 72, nome: 'celle72', atto: "strada", obiettivi: [{ tipo: 'celle', quanti: 114 }], maxMosse: 30,
    griglia: MOTIVI.assedio, },
  { numero: 73, nome: 'righe73', atto: "strada", obiettivi: [{ tipo: 'righe', quanti: 9 }], maxMosse: 23,
    griglia: MOTIVI.isole, },
  { numero: 74, nome: 'punti74', atto: "strada", obiettivi: [{ tipo: 'punteggio', quanti: 512 }], maxMosse: 28,
    griglia: MOTIVI.clessidra, },
  { numero: 75, nome: 'catena75', atto: "strada", obiettivi: [{ tipo: 'catena', quanti: 8 }], maxMosse: 20,
    griglia: MOTIVI.labirinto, },
  { numero: 76, nome: 'gruppi76', atto: "strada", obiettivi: [{ tipo: 'gruppi', quanti: 13 }], maxMosse: 27,
    griglia: MOTIVI.fitto, },
  { numero: 77, nome: 'punti77', atto: "arco", obiettivi: [{ tipo: 'punteggio', quanti: 650 }], maxMosse: 32,
    griglia: MOTIVI.fitto, },
  { numero: 78, nome: 'catena78', atto: "arco", obiettivi: [{ tipo: 'catena', quanti: 4 }], maxMosse: 25,
    griglia: MOTIVI.assedio, },
  { numero: 79, nome: 'celle79', atto: "arco", obiettivi: [{ tipo: 'celle', quanti: 114 }], maxMosse: 30,
    griglia: MOTIVI.strettoia, },
  { numero: 80, nome: 'quadranti80', atto: "arco", obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 22,
    griglia: MOTIVI.labirinto, },
  { numero: 81, nome: 'gruppi81', atto: "arco", obiettivi: [{ tipo: 'gruppi', quanti: 13 }], maxMosse: 29,
    griglia: MOTIVI.clessidra, },
  { numero: 82, nome: 'punti82', atto: "arco", obiettivi: [{ tipo: 'punteggio', quanti: 623 }], maxMosse: 32,
    griglia: MOTIVI.fitto, },
  { numero: 83, nome: 'catena83', atto: "arco", obiettivi: [{ tipo: 'catena', quanti: 5 }], maxMosse: 29,
    griglia: MOTIVI.assedio, },
  { numero: 84, nome: 'celle84', atto: "arco", obiettivi: [{ tipo: 'celle', quanti: 119 }], maxMosse: 30,
    griglia: MOTIVI.strettoia, },
  { numero: 85, nome: 'quadranti85', atto: "arco", obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 24,
    griglia: MOTIVI.labirinto, },
  { numero: 86, nome: 'gruppi86', atto: "arco", obiettivi: [{ tipo: 'gruppi', quanti: 13 }], maxMosse: 29,
    griglia: MOTIVI.clessidra, },
  { numero: 87, nome: 'punti87', atto: "arco", obiettivi: [{ tipo: 'punteggio', quanti: 775 }], maxMosse: 32,
    griglia: MOTIVI.fitto, },
  { numero: 88, nome: 'catena88', atto: "arco", obiettivi: [{ tipo: 'catena', quanti: 6 }], maxMosse: 29,
    griglia: MOTIVI.assedio, },
  { numero: 89, nome: 'celle89', atto: "arco", obiettivi: [{ tipo: 'celle', quanti: 116 }], maxMosse: 30,
    griglia: MOTIVI.strettoia, },
  { numero: 90, nome: 'quadranti90', atto: "arco", obiettivi: [{ tipo: 'quadranti', quanti: 9 }], maxMosse: 22,
    griglia: MOTIVI.labirinto, },
  { numero: 91, nome: 'gruppi91', atto: "arco", obiettivi: [{ tipo: 'gruppi', quanti: 12 }], maxMosse: 27,
    griglia: MOTIVI.clessidra, },
  { numero: 92, nome: 'punti92', atto: "arco", obiettivi: [{ tipo: 'punteggio', quanti: 608 }], maxMosse: 32,
    griglia: MOTIVI.fitto, },
  { numero: 93, nome: 'punti93', atto: "ultimaPietra", obiettivi: [{ tipo: 'punteggio', quanti: 494 }], maxMosse: 30,
    griglia: MOTIVI.briciole, },
  { numero: 94, nome: 'celle94', atto: "ultimaPietra", obiettivi: [{ tipo: 'celle', quanti: 150 }], maxMosse: 39,
    griglia: MOTIVI.clessidra, },
  { numero: 95, nome: 'catena95', atto: "ultimaPietra", obiettivi: [{ tipo: 'catena', quanti: 6 }], maxMosse: 21,
    griglia: MOTIVI.labirinto, },
  { numero: 96, nome: 'gruppi96', atto: "ultimaPietra", obiettivi: [{ tipo: 'gruppi', quanti: 14 }], maxMosse: 33,
    griglia: MOTIVI.assedio, },
  { numero: 97, nome: 'intrecci97', atto: "ultimaPietra", obiettivi: [{ tipo: 'intrecci', quanti: 3 }], maxMosse: 36,
    griglia: MOTIVI.briciole, },
  { numero: 98, nome: 'punti98', atto: "ultimaPietra", obiettivi: [{ tipo: 'punteggio', quanti: 669 }], maxMosse: 30,
    griglia: MOTIVI.clessidra, },
  { numero: 99, nome: 'celle99', atto: "ultimaPietra", obiettivi: [{ tipo: 'celle', quanti: 148 }], maxMosse: 39,
    griglia: MOTIVI.labirinto, },
  { numero: 100, nome: 'catena100', atto: "ultimaPietra", obiettivi: [{ tipo: 'catena', quanti: 5 }], maxMosse: 26,
    griglia: MOTIVI.assedio, },
];

/**
 * Gli atti del percorso: servono a far vedere dove si e' arrivati.
 *
 * Qui c'e' l'IDENTIFICATIVO, non il nome. Il nome visibile sta nelle traduzioni, sotto
 * "atti.<id>": finche' e' stato scritto qui, in italiano, chi giocava in inglese leggeva
 * "Le basi" e "La vetta" dentro un'interfaccia inglese, e nessuno se n'era accorto perche'
 * i dati generati non passano da nessun controllo sulle traduzioni.
 */
export const ATTI = [
  {
    id: "fondamenta",
    da: 1,
    a: 10
  },
  {
    id: "pilastri",
    da: 11,
    a: 24
  },
  {
    id: "roccia",
    da: 25,
    a: 40
  },
  {
    id: "vuoto",
    da: 41,
    a: 58
  },
  {
    id: "strada",
    da: 59,
    a: 76
  },
  {
    id: "arco",
    da: 77,
    a: 92
  },
  {
    id: "ultimaPietra",
    da: 93,
    a: 100
  }
];

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
  { id: 'ponte', da: 1, a: 100 },
];

/** @param {number} numero */
export function quadroNumero(numero) {
  return QUADRI.find((q) => q.numero === numero) ?? null;
}

/** L'atto a cui appartiene un Quadro. */
export function attoDelQuadro(numero) {
  return ATTI.find((a) => numero >= a.da && numero <= a.a) ?? ATTI[ATTI.length - 1];
}

export const TOTALE_QUADRI = QUADRI.length;
