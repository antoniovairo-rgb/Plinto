/**
 * Il sacchetto delle frasi: estrarre senza rimettere dentro.
 *
 * PERCHE' NON BASTA AVERNE TANTE. In una partita da duecentoquaranta mosse la frase
 * piu' comune esce trentanove volte e la seconda trentatre (misurato sul simulatore).
 * Sorteggiando ogni volta fra trenta frasi, il doppione non e' raro: e' inevitabile, e
 * capita anche a due mosse di distanza. Chi gioca non conta le frasi, si accorge delle
 * ripetizioni -- e due volte la stessa parola a distanza ravvicinata fa sembrare finto
 * tutto il resto.
 *
 * COME FUNZIONA. Le frasi di una categoria vengono mescolate e messe in un sacchetto.
 * Ogni messaggio ne pesca una e NON la rimette dentro. Quando il sacchetto e' vuoto si
 * rimescola da capo. Cosi' tutte escono una volta prima che una qualsiasi si ripeta:
 * con trenta frasi e trentanove messaggi in una partita, si sentono tutte e trenta e
 * solo nove tornano una seconda volta, mai due di fila.
 *
 * LA CUCITURA. Fra un sacchetto e il successivo ci sarebbe un punto scoperto: l'ultima
 * frase del vecchio potrebbe essere la prima del nuovo, che e' proprio il doppione
 * attaccato che si vuole evitare. Quando capita, la prima del sacchetto nuovo viene
 * scambiata con la seconda.
 *
 * IL CASO NON E' QUELLO DEL GIOCO. Qui si usa Math.random e non `rngState`: quel flusso
 * genera la sequenza dei pezzi ed e' cio' che rende la sfida del giorno identica per
 * tutti. Pescarci dentro una frase decorativa cambierebbe i pezzi di chi gioca.
 */

/** Mescola in place con Fisher-Yates. */
function mescola(elenco) {
  for (let i = elenco.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [elenco[i], elenco[j]] = [elenco[j], elenco[i]];
  }
  return elenco;
}

/**
 * Crea i sacchetti, uno per categoria, creati alla prima richiesta.
 * @returns {(categoria: string, quante: number) => number} l'indice della frase da dire
 */
export function creaSacchetti() {
  const sacchetti = new Map();

  return function pesca(categoria, quante) {
    if (!Number.isFinite(quante) || quante <= 1) return 0;
    let s = sacchetti.get(categoria);

    // Il sacchetto si rifa' anche se il numero di frasi e' cambiato: succede solo
    // cambiando lingua a partita in corso, ma un indice fuori elenco mostrerebbe la
    // chiave al posto della frase, che e' il difetto piu' brutto di tutti.
    if (!s || s.quante !== quante || s.resto.length === 0) {
      const ultima = s?.ultima ?? -1;
      const resto = mescola([...Array(quante).keys()]);
      if (resto[resto.length - 1] === ultima && resto.length > 1) {
        [resto[resto.length - 1], resto[resto.length - 2]] =
          [resto[resto.length - 2], resto[resto.length - 1]];
      }
      s = { resto, quante, ultima };
      sacchetti.set(categoria, s);
    }

    const scelta = s.resto.pop();
    s.ultima = scelta;
    return scelta;
  };
}
