/**
 * L'ONDA DELL'ELIMINAZIONE: i blocchi non spariscono tutti nello stesso istante, ma a
 * partire dal pezzo appena appoggiato, come un'onda che si allarga.
 *
 * La distanza e' quella "del re" degli scacchi (Chebyshev): un passo in qualunque
 * direzione, diagonale compresa. Con la distanza di Manhattan una riga chiusa da un
 * pezzo in mezzo partirebbe bene, ma un quadrante si svuoterebbe a rombo, che sulla
 * griglia quadrata si legge come un errore.
 *
 * Il tetto e' scelto per non far aspettare: l'ultimo blocco parte al massimo 210 ms dopo
 * il primo, quindi l'eliminazione intera resta sotto i due terzi di secondo.
 */
export const PASSO_ONDA = 30;
export const ONDA_MASSIMA = 210;

const LATO = 9;

/** Ritardo, in millisecondi, della casella `i` rispetto alle caselle `origine`. */
export function ritardoOnda(i, origine) {
  if (!origine?.length) return 0;
  const r = Math.floor(i / LATO);
  const c = i % LATO;
  let distanza = LATO;
  for (const o of origine) {
    const d = Math.max(Math.abs(Math.floor(o / LATO) - r), Math.abs((o % LATO) - c));
    if (d < distanza) distanza = d;
  }
  return Math.min(distanza * PASSO_ONDA, ONDA_MASSIMA);
}

/** Il ritardo piu' lungo fra le caselle che spariscono: serve a sapere quando ripulire. */
export function ritardoMassimo(celle, origine) {
  let massimo = 0;
  for (const i of celle) massimo = Math.max(massimo, ritardoOnda(i, origine));
  return massimo;
}
