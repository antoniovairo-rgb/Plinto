/**
 * Il segno della bomba, disegnato sopra il blocco che la porta.
 *
 * La prima versione era un anello bianco al centro della cella. Rispettava la regola
 * giusta — segno GEOMETRICO e non cromatico, cosi' lo vede anche chi non distingue i
 * colori — ma sbagliava quella piu' importante: non sembrava una bomba. Un cerchio
 * puo' essere un bersaglio, un bottone, un buco. Un giocatore che non riconosce il
 * simbolo non sa che quella cella cambiera' l'esito della sua mossa, e il simbolo
 * tanto vale non averlo.
 *
 * Adesso e' una bomba vera e propria: corpo tondo, tappo, miccia e scintilla. Resta
 * geometrica e monocroma nel corpo (nero, che si stacca da tutte e sei le famiglie
 * cromatiche in entrambi i temi) con la sola scintilla accesa, che e' anche la parte
 * che si muove: l'occhio va li' e il resto si legge di conseguenza.
 *
 * E' un SVG dentro il codice come tutto il resto: nessun file, nessuna licenza da
 * tracciare, nessuna richiesta di rete. Scala con la cella perche' usa un viewBox.
 */
export function Bomba({ className = '' }) {
  return (
    <svg className={`pl-bomba ${className}`} viewBox="0 0 100 100" aria-hidden="true">
      {/* Alone chiaro dietro al corpo: serve sulle tinte piu' scure (il viola), dove
          un nero su colore scuro perderebbe i contorni. */}
      <circle cx="46" cy="60" r="30" className="pl-bomba__alone" />
      <circle cx="46" cy="60" r="26" className="pl-bomba__corpo" />
      {/* Riflesso: due tratti curvi in alto a sinistra. Bastano a far leggere una
          sfera invece di un disco piatto. */}
      <path d="M 32 50 Q 38 42 48 41" className="pl-bomba__luce" />

      {/* Tappo e miccia. La miccia esce in alto a destra, dove c'e' piu' spazio
          libero nella cella qualunque sia la forma del pezzo. */}
      <rect x="52" y="28" width="14" height="11" rx="3" transform="rotate(28 59 33)" className="pl-bomba__corpo" />
      <path d="M 64 28 Q 76 20 72 10" className="pl-bomba__miccia" />

      {/* La scintilla: quattro punte, l'unica cosa colorata e l'unica che si muove. */}
      <g className="pl-bomba__scintilla">
        <path d="M 72 3 L 75 11 L 83 14 L 75 17 L 72 25 L 69 17 L 61 14 L 69 11 Z" />
      </g>
    </svg>
  );
}
