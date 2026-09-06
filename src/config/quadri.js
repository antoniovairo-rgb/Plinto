/**
 * I Quadri di PLINTO: il percorso a difficolta' crescente.
 *
 * Ogni Quadro e' una partita normale con un obiettivo dichiarato e, quasi sempre, un
 * tetto di mosse. Le regole non cambiano mai: cambia solo cosa serve per vincere.
 *
 * COME SI LEGGE UNA VOCE
 *   numero      progressivo, determina anche il seme: stesso Quadro, stesso problema
 *   nome        chiave di traduzione in i18n (quadri.nomi.<chiave>)
 *   obiettivi   tutti devono essere raggiunti. Tipi in src/core/quadro.js
 *   maxMosse    tetto di mosse; null = si gioca finche' si hanno mosse possibili
 *   griglia     ostacoli iniziali. Sono blocchi normali: si eliminano come gli altri
 *
 * REGOLA SULLE GRIGLIE INIZIALI: nessuna deve contenere una riga, una colonna o un
 * quadrante gia' completi, altrimenti si eliminerebbero alla prima mossa regalando
 * punti. E' verificato da tests/quadri.test.js, non lasciato alla buona volonta'.
 *
 * I NUMERI DI QUESTO FILE NON SONO STATI INDOVINATI: sono stati misurati facendo
 * giocare ogni Quadro al giocatore artificiale (npm run quadri), e corretti dove la
 * difficolta' non seguiva la curva. Il rapporto e' in docs/QUADRI.md.
 */

/** Righe usate per costruire le griglie di ostacoli, per leggibilita'. */
const V = '.........';

export const QUADRI = [
  // ---------------------------------------------------------------- le basi ---
  // Griglia libera, tetti generosi: qui si impara cosa fa sparire i blocchi.
  { numero: 1, nome: 'primaRiga', obiettivi: [{ tipo: 'righe', quanti: 1 }], maxMosse: 12 },
  { numero: 2, nome: 'primaColonna', obiettivi: [{ tipo: 'colonne', quanti: 1 }], maxMosse: 12 },
  { numero: 3, nome: 'primoQuadrante', obiettivi: [{ tipo: 'quadranti', quanti: 1 }], maxMosse: 12 },
  { numero: 4, nome: 'treGruppi', obiettivi: [{ tipo: 'gruppi', quanti: 3 }], maxMosse: 18 },
  { numero: 5, nome: 'catenaTre', obiettivi: [{ tipo: 'catena', quanti: 3 }], maxMosse: 20 },
  { numero: 6, nome: 'trecentoPunti', obiettivi: [{ tipo: 'punteggio', quanti: 300 }], maxMosse: 22 },

  // -------------------------------------------------------------- stringere ---
  // Stessi obiettivi, meno mosse: comincia a contare dove metti i pezzi.
  { numero: 7, nome: 'dueQuadranti', obiettivi: [{ tipo: 'quadranti', quanti: 2 }], maxMosse: 18 },
  { numero: 8, nome: 'cinqueGruppi', obiettivi: [{ tipo: 'gruppi', quanti: 5 }], maxMosse: 20 },
  { numero: 9, nome: 'intrecciaDue', obiettivi: [{ tipo: 'intreccio', quanti: 2 }], maxMosse: 20 },
  { numero: 10, nome: 'catenaCinque', obiettivi: [{ tipo: 'catena', quanti: 5 }], maxMosse: 24 },
  { numero: 11, nome: 'ottocento', obiettivi: [{ tipo: 'punteggio', quanti: 800 }], maxMosse: 26 },
  { numero: 12, nome: 'quarantaCelle', obiettivi: [{ tipo: 'celle', quanti: 60 }], maxMosse: 22 },
  { numero: 13, nome: 'righeEColonne', obiettivi: [{ tipo: 'righe', quanti: 2 }, { tipo: 'colonne', quanti: 2 }], maxMosse: 26 },
  { numero: 14, nome: 'treQuadranti', obiettivi: [{ tipo: 'quadranti', quanti: 3 }], maxMosse: 24 },

  // --------------------------------------------------------------- ostacoli ---
  // La griglia non parte piu' vuota: lo spazio va guadagnato.
  {
    numero: 15,
    nome: 'angoli',
    obiettivi: [{ tipo: 'gruppi', quanti: 3 }],
    maxMosse: 20,
    griglia: ['##.....##', '##.....##', V, V, V, V, V, '##.....##', '##.....##'].join('\n'),
  },
  {
    numero: 16,
    nome: 'croce',
    obiettivi: [{ tipo: 'quadranti', quanti: 2 }],
    maxMosse: 22,
    griglia: [V, V, V, '...###...', '...#.#...', '...###...', V, V, V].join('\n'),
  },
  {
    numero: 17,
    nome: 'scacchiera',
    obiettivi: [{ tipo: 'gruppi', quanti: 4 }],
    maxMosse: 24,
    griglia: ['#.#.#.#.#', V, '#.#.#.#.#', V, '#.#.#.#.#', V, '#.#.#.#.#', V, '#.#.#.#.#'].join('\n'),
  },
  {
    numero: 18,
    nome: 'colonneVuote',
    obiettivi: [{ tipo: 'colonne', quanti: 3 }],
    maxMosse: 24,
    griglia: ['##.##.##.', '##.##.##.', '##.##.##.', V, V, V, '##.##.##.', '##.##.##.', '##.##.##.'].join('\n'),
  },
  {
    numero: 19,
    nome: 'scala',
    obiettivi: [{ tipo: 'punteggio', quanti: 1200 }],
    maxMosse: 26,
    griglia: ['##.......', '##.......', '..##.....', '..##.....', '....##...', '....##...', '......##.', '......##.', '........#'].join('\n'),
  },
  {
    numero: 20,
    nome: 'cornice',
    obiettivi: [{ tipo: 'gruppi', quanti: 5 }],
    maxMosse: 26,
    griglia: ['########.', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '#.......#', '.########'].join('\n'),
  },
  {
    numero: 21,
    nome: 'isole',
    obiettivi: [{ tipo: 'quadranti', quanti: 3 }],
    maxMosse: 26,
    griglia: ['##....##.', '##....##.', V, V, '...##....', '...##....', V, '.##....##', '.##....##'].join('\n'),
  },
  {
    numero: 22,
    nome: 'pettine',
    obiettivi: [{ tipo: 'righe', quanti: 3 }],
    maxMosse: 26,
    griglia: ['#.#.#.#.#', '#.#.#.#.#', '#.#.#.#.#', V, V, V, '#.#.#.#.#', '#.#.#.#.#', '#.#.#.#.#'].join('\n'),
  },
  {
    numero: 23,
    nome: 'diagonale',
    obiettivi: [{ tipo: 'gruppi', quanti: 6 }],
    maxMosse: 28,
    griglia: ['##.......', '.##......', '..##.....', '...##....', '....##...', '.....##..', '......##.', '.......##', '........#'].join('\n'),
  },
  {
    numero: 24,
    nome: 'clessidra',
    obiettivi: [{ tipo: 'catena', quanti: 6 }],
    maxMosse: 30,
    griglia: ['#######..', '.#####...', '..###....', '...#.....', V, '.....#...', '....###..', '...#####.', '..#######'].join('\n'),
  },

  // -------------------------------------------------------------- pressione ---
  // Ostacoli e tetti stretti insieme.
  {
    numero: 25,
    nome: 'strettoia',
    obiettivi: [{ tipo: 'quadranti', quanti: 2 }],
    maxMosse: 16,
    griglia: ['##....##.', '#.#...#.#', '###...###', V, V, V, '###...###', '#.#...#.#', '##....##.'].join('\n'),
  },
  {
    numero: 26,
    nome: 'nidoApi',
    obiettivi: [{ tipo: 'gruppi', quanti: 5 }],
    maxMosse: 20,
    griglia: ['.#..#..#.', '#..#..#..', '.#..#..#.', '#..#..#..', '.#..#..#.', '#..#..#..', '.#..#..#.', '#..#..#..', '.#..#..#.'].join('\n'),
  },
  { numero: 27, nome: 'milleCinque', obiettivi: [{ tipo: 'punteggio', quanti: 1500 }], maxMosse: 22 },
  { numero: 28, nome: 'intrecciaTre', obiettivi: [{ tipo: 'intreccio', quanti: 3 }], maxMosse: 28 },
  {
    numero: 29,
    nome: 'muro',
    obiettivi: [{ tipo: 'righe', quanti: 4 }],
    maxMosse: 26,
    griglia: ['########.', '########.', V, V, V, V, V, '.########', '.########'].join('\n'),
  },
  {
    numero: 30,
    nome: 'labirinto',
    obiettivi: [{ tipo: 'gruppi', quanti: 6 }],
    maxMosse: 26,
    griglia: ['#.#####.#', '#.......#', '#.#####.#', '#.#...#.#', '..#.#.#..', '#.#...#.#', '#.#####.#', '#.......#', '#.#####.#'].join('\n'),
  },
  { numero: 31, nome: 'catenaSette', obiettivi: [{ tipo: 'catena', quanti: 7 }], maxMosse: 32 },
  {
    numero: 32,
    nome: 'quattroAngoli',
    obiettivi: [{ tipo: 'quadranti', quanti: 4 }],
    maxMosse: 28,
    griglia: ['##.....##', '#.#...#.#', '.##...##.', V, V, V, '.##...##.', '#.#...#.#', '##.....##'].join('\n'),
  },

  // --------------------------------------------------------------- maestria ---
  { numero: 33, nome: 'duemila', obiettivi: [{ tipo: 'punteggio', quanti: 2000 }], maxMosse: 26 },
  { numero: 34, nome: 'ottoGruppi', obiettivi: [{ tipo: 'gruppi', quanti: 8 }], maxMosse: 24 },
  {
    numero: 35,
    nome: 'setaccio',
    obiettivi: [{ tipo: 'gruppi', quanti: 6 }],
    maxMosse: 20,
    griglia: ['#.#.#.#.#', '.#.#.#.#.', '#.#.#.#.#', '.#.#.#.#.', '#.#.#.#.#', '.#.#.#.#.', '#.#.#.#.#', '.#.#.#.#.', '#.#.#.#.#'].join('\n'),
  },
  { numero: 36, nome: 'intrecciaQuattro', obiettivi: [{ tipo: 'intreccio', quanti: 4 }], maxMosse: 34 },
  { numero: 37, nome: 'catenaNove', obiettivi: [{ tipo: 'catena', quanti: 9 }], maxMosse: 36 },
  {
    numero: 38,
    nome: 'assedio',
    obiettivi: [{ tipo: 'quadranti', quanti: 4 }, { tipo: 'righe', quanti: 2 }],
    maxMosse: 32,
    griglia: ['##.##.##.', '##.##.##.', V, '.##.##.##', '.##.##.##', V, '##.##.##.', '##.##.##.', V].join('\n'),
  },
  { numero: 39, nome: 'treMila', obiettivi: [{ tipo: 'punteggio', quanti: 3000 }], maxMosse: 32 },
  {
    numero: 40,
    nome: 'tabulaRasa',
    obiettivi: [{ tipo: 'pulizia', quanti: 1 }],
    maxMosse: 40,
    griglia: ['#........', '.#.......', '..#......', V, V, V, '......#..', '.......#.', '........#'].join('\n'),
  },
];

/** @param {number} numero */
export function quadroNumero(numero) {
  return QUADRI.find((q) => q.numero === numero) ?? null;
}

export const TOTALE_QUADRI = QUADRI.length;
