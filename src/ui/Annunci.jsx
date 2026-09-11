import { incitamento } from '../core/incitamenti.js';

/**
 * Regione di cortesia per i lettori di schermo.
 *
 * Il gioco comunica quasi tutto per via visiva: blocchi che esplodono, particelle,
 * numeri che volano. Chi non vede lo schermo deve ricevere le stesse informazioni,
 * e riceverle come frasi, non come numeri sparsi.
 *
 * `aria-live="polite"` e non "assertive": l'annuncio non deve interrompere quello che
 * il lettore sta gia' dicendo, altrimenti in una raffica di mosse diventa inascoltabile.
 */
export function Annunci({ testo }) {
  return (
    <div className="pl-sr" role="status" aria-live="polite" aria-atomic="true">
      {testo}
    </div>
  );
}

/**
 * Costruisce la frase da annunciare dopo una mossa.
 *
 * L'incitamento apre l'annuncio invece di essere solo disegnato sulla griglia. Una
 * funzione che incoraggia solo chi guarda lo schermo e' una funzione che decide chi
 * merita di essere incoraggiato.
 *
 * Qui la variante e' sempre la prima, e non sorteggiata come nel disegno: un lettore di
 * schermo legge una frase alla volta in mezzo a dei numeri, la varieta' non si nota, e
 * un annuncio che cambia a caso e' piu' difficile da seguire, non piu' vivace.
 */
export function frasePerMossa(lastMove, t) {
  if (!lastMove) return '';
  const parti = [];

  const premio = incitamento(lastMove);
  if (premio) parti.push(t(`incita.${premio.categoria}.0`, { quanti: premio.catena }));

  if (lastMove.groups.length > 0) {
    const tipi = { row: 0, col: 0, quadrant: 0 };
    lastMove.groups.forEach((g) => { tipi[g.type] += 1; });
    const elenco = [];
    if (tipi.row) elenco.push(`${tipi.row} ${tipi.row === 1 ? t('a11y.riga') : t('a11y.righe')}`);
    if (tipi.col) elenco.push(`${tipi.col} ${tipi.col === 1 ? t('a11y.colonna') : t('a11y.colonne')}`);
    if (tipi.quadrant) {
      elenco.push(`${tipi.quadrant} ${tipi.quadrant === 1 ? t('a11y.quadrante') : t('a11y.quadranti')}`);
    }
    parti.push(`${elenco.join(', ')} ${t('a11y.eliminate')}`);
  }

  parti.push(`${t('a11y.piu')} ${lastMove.points} ${t('a11y.punti')}`);
  if (lastMove.chainAfter > 0) parti.push(`${t('hud.catena')} ${lastMove.chainAfter}`);
  if (lastMove.boardCleared) parti.push(t('a11y.grigliaVuota'));
  if (lastMove.gameOver) parti.push(t('fine.titolo'));

  return `${parti.join('. ')}.`;
}
