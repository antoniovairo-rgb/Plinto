/**
 * Le icone delle cinque voci di menu della home.
 *
 * PERCHE' ESISTONO. Le voci erano cinque etichette di solo testo dentro una riga che
 * andava a capo: due, due, e "Info" spaiata in mezzo. Il blocco si leggeva come un
 * elenco non finito, e senza nessun appiglio per l'occhio bisognava rileggerle tutte per
 * trovare quella giusta. Un simbolo accanto alla parola si riconosce prima di leggerla,
 * ed e' il motivo per cui ci sono.
 *
 * Stesso disegno delle icone degli attrezzi -- 24 di lato, tratto 1.8, `currentColor` --
 * perche' due grammatiche grafiche nella stessa app si notano subito e non aggiungono
 * niente.
 */
const COMUNI = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

/** Come si gioca: un libretto aperto. */
export function IconaAiuto() {
  return (
    <svg {...COMUNI}>
      <path d="M3.5 5.5h6a2.5 2.5 0 0 1 2.5 2.5v11a2 2 0 0 0-2-2h-6.5z" />
      <path d="M20.5 5.5h-6A2.5 2.5 0 0 0 12 8v11a2 2 0 0 1 2-2h6.5z" />
    </svg>
  );
}

/** Statistiche: tre colonne di altezza diversa. */
export function IconaStatistiche() {
  return (
    <svg {...COMUNI}>
      <path d="M5 19.5v-6" />
      <path d="M12 19.5v-11" />
      <path d="M19 19.5v-8" />
    </svg>
  );
}

/** Profilo di gioco: la mappa degli appoggi, cioe' una griglia con una casella accesa. */
export function IconaProfilo() {
  return (
    <svg {...COMUNI}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.5h16M4 14.5h16M9.5 4v16M14.5 4v16" strokeWidth="1.1" />
      <rect x="9.9" y="9.9" width="4.2" height="4.2" rx="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Impostazioni: due cursori. */
export function IconaImpostazioni() {
  return (
    <svg {...COMUNI}>
      <path d="M4 8.5h16M4 15.5h16" />
      <circle cx="9" cy="8.5" r="2.2" />
      <circle cx="15" cy="15.5" r="2.2" />
    </svg>
  );
}

/** Info: la i nel cerchio. */
export function IconaInfo() {
  return (
    <svg {...COMUNI}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 11v5.2" />
      <path d="M12 7.9v.1" strokeWidth="2.4" />
    </svg>
  );
}
