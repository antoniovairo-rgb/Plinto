import { GRID_SIZE, QUADRANT_SIZE } from '../config/rules.js';

/**
 * Griglia in miniatura che ILLUSTRA l'obiettivo di un livello.
 *
 * Nasce da un difetto trovato da una persona che giocava, non da un test: al primo
 * livello "non si capisce l'obiettivo". La schermata di apertura c'era e la frase pure
 * — "Chiudi una riga" — ma diceva la cosa giusta nel modo sbagliato. A chi non conosce
 * il genere, "riga" non e' un'immagine: e' una parola. E il gioco non gli aveva ancora
 * mostrato una riga chiusa, quindi non aveva niente a cui agganciarla.
 *
 * Una parola si puo' fraintendere; nove caselle accese in fila no. Qui l'obiettivo si
 * VEDE sulla stessa griglia 9x9 su cui si giochera' un secondo dopo, con le stesse
 * linee spesse a separare i quadranti: e' la mappa fra la frase e il tabellone.
 *
 * Ha senso solo per gli obiettivi che sono una FORMA sulla griglia. "Fai 300 punti" o
 * "arriva a Catena 5" non hanno un disegno onesto: per quelli `celleDa` restituisce
 * null e il componente non si disegna affatto, invece di mostrare una figura inventata
 * che insegnerebbe una cosa sbagliata.
 */

/** Indice piatto di una cella. */
const cella = (r, c) => r * GRID_SIZE + c;

/**
 * Quali celle accendere per illustrare un tipo di obiettivo.
 * @returns {{celle:number[], secondo?:number[]}|null} null se il tipo non e' una forma
 */
export function celleDa(tipo) {
  const riga = 4;
  const colonna = 4;
  switch (tipo) {
    case 'righe':
      return { celle: Array.from({ length: GRID_SIZE }, (_, c) => cella(riga, c)) };
    case 'colonne':
      return { celle: Array.from({ length: GRID_SIZE }, (_, r) => cella(r, colonna)) };
    case 'quadranti': {
      const celleQ = [];
      for (let r = 3; r < 3 + QUADRANT_SIZE; r += 1) {
        for (let c = 3; c < 3 + QUADRANT_SIZE; c += 1) celleQ.push(cella(r, c));
      }
      return { celle: celleQ };
    }
    case 'gruppi':
      // Un gruppo e' una riga O una colonna O un quadrante: se ne mostrano due diversi,
      // con il secondo in tinta piu' tenue, perche' il punto e' che vale qualunque.
      return {
        celle: Array.from({ length: GRID_SIZE }, (_, c) => cella(riga, c)),
        secondo: Array.from({ length: GRID_SIZE }, (_, r) => cella(r, 1)),
      };
    case 'intreccio': {
      // Una riga e una colonna che si incrociano: e' esattamente la mossa che si chiede,
      // e il disegno spiega da solo perche' l'incrocio e' il posto dove cercarla.
      const orizzontale = Array.from({ length: GRID_SIZE }, (_, c) => cella(riga, c));
      const verticale = Array.from({ length: GRID_SIZE }, (_, r) => cella(r, colonna));
      return { celle: orizzontale, secondo: verticale.filter((i) => !orizzontale.includes(i)) };
    }
    case 'pulizia':
      // Nessuna cella accesa: la griglia vuota E' l'obiettivo.
      return { celle: [] };
    default:
      return null;
  }
}

export function MiniGriglia({ tipo }) {
  const forma = celleDa(tipo);
  if (!forma) return null;

  const accese = new Set(forma.celle);
  const tenui = new Set(forma.secondo ?? []);

  return (
    <div className="pl-mini" aria-hidden="true">
      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
        const classi = ['pl-mini__cella'];
        if (accese.has(i)) classi.push('pl-mini__cella--accesa');
        else if (tenui.has(i)) classi.push('pl-mini__cella--tenue');
        // Le linee spesse dei quadranti: la firma del tabellone, e qui servono a far
        // riconoscere che questa miniatura E' la griglia su cui si sta per giocare.
        const r = Math.floor(i / GRID_SIZE);
        const c = i % GRID_SIZE;
        if (c % QUADRANT_SIZE === 0 && c !== 0) classi.push('pl-mini__cella--stacco-sx');
        if (r % QUADRANT_SIZE === 0 && r !== 0) classi.push('pl-mini__cella--stacco-su');
        return <span key={i} className={classi.join(' ')} />;
      })}
    </div>
  );
}
