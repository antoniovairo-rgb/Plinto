/**
 * Le due iconcine del pie' di pagina della home.
 *
 * Disegnate qui dentro come tutto il resto del gioco: nessun file, nessuna libreria di
 * icone, nessuna licenza da tracciare e nessuna richiesta di rete. E' la stessa regola
 * che vale per il marchio, per Plinto e per la bomba, ed e' anche quello che permette
 * all'informativa di dire che il gioco non contatta nessuno.
 *
 * SONO A TRATTO, NON PIENE. A dodici pixel una forma piena diventa una macchia: il
 * tratto tiene i buchi aperti -- il manico della tazza, la finestra della busta -- e
 * sono proprio i buchi a far riconoscere l'oggetto. Lo spessore e' 1.6 su un riquadro
 * di 24, cioe' circa un pixel a questa misura: piu' sottile sparisce sugli schermi a
 * densita' bassa, piu' spesso chiude i buchi e torna la macchia.
 *
 * `currentColor` invece di un colore: cosi' seguono il testo accanto, compreso lo
 * schiarirsi quando ci passi sopra, e non c'e' un secondo posto in cui ricordarsi di
 * cambiare il grigio del pie' di pagina.
 *
 * Sono DECORATIVE. Ogni icona sta accanto alla sua parola, quindi a un lettore di
 * schermo non aggiungono niente e verrebbero lette due volte: `aria-hidden`.
 */

/** Sostieni il progetto: una tazza di caffe' che fuma. */
export function IconaCaffe({ className = '' }) {
  return (
    <svg className={`pl-icona ${className}`} viewBox="0 0 24 24" aria-hidden="true"
         fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
      {/* Il vapore: due filetti brevi e sfalsati. Sono la parte che fa leggere "caffe'"
          invece di "secchio", e stanno sopra la tazza dove c'e' spazio vuoto. */}
      <path d="M 9 2.5 q 1.4 1.3 0 2.6" />
      <path d="M 13 2.5 q 1.4 1.3 0 2.6" />
      {/* Il corpo: piu' stretto in basso, come una tazza vera. */}
      <path d="M 4 8.5 h 12 v 6.5 a 3.2 3.2 0 0 1 -3.2 3.2 h -5.6 A 3.2 3.2 0 0 1 4 15 Z" />
      {/* Il manico: e' il dettaglio che distingue una tazza da un bicchiere. */}
      <path d="M 16 10 h 2.2 a 2.4 2.4 0 0 1 0 4.8 H 16" />
      {/* Il piattino: chiude la figura in basso e le da' una base su cui appoggiare. */}
      <path d="M 3 21 h 15" />
    </svg>
  );
}

/**
 * Idee e segnalazioni: una lampadina che sta uscendo da una busta.
 *
 * Erano nate come due icone separate, una accanto all'altra. A dodici pixel non si
 * capiva niente: due oggetti piccoli attaccati si leggono come un unico scarabocchio,
 * e nessuno dei due si riconosce. Una figura sola che le tiene insieme dice la stessa
 * cosa -- un'idea che ti arriva per posta -- e si legge alla prima occhiata.
 */
export function IconaIdea({ className = '' }) {
  return (
    <svg className={`pl-icona ${className}`} viewBox="0 0 24 24" aria-hidden="true"
         fill="none" stroke="currentColor" strokeWidth="1.6"
         strokeLinecap="round" strokeLinejoin="round">
      {/* La busta sta in basso a sinistra: bordo e lembo. Il lembo e' quello che la fa
          riconoscere anche quando e' alta sei pixel -- un rettangolo da solo e' una
          scatola qualunque. */}
      <path d="M 1.6 12.6 h 12 v 8.6 H 1.6 Z" />
      <path d="M 1.6 12.6 l 6 4.6 l 6 -4.6" />
      {/* La lampadina sta in alto a destra, dove la busta non arriva, e il vetro e' un
          CERCHIO INTERO. La prima versione usava un arco, che a dodici pixel si leggeva
          come un palloncino con lo spago: mancava la cosa che rende una lampadina una
          lampadina, cioe' lo zoccolo a righe sotto il vetro. */}
      <circle cx="17.4" cy="6.4" r="3.6" />
      {/* Il collo: due tratti brevi che scendono dal vetro allo zoccolo. Senza, il
          cerchio resta appoggiato alle righe e si legge come una lente. */}
      <path d="M 15.9 9.4 v 1.3" />
      <path d="M 18.9 9.4 v 1.3" />
      {/* Lo zoccolo: due righe, non una. Una riga sola sotto un cerchio e' un
          palloncino con lo spago; sono le DUE righe a dire "si avvita". */}
      <path d="M 15.7 11.2 h 3.4" />
      <path d="M 16.3 13.2 h 2.2" />
    </svg>
  );
}
