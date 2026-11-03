import { incitamento } from '../core/incitamenti.js';

/*
 * ANNUNCI_ACCORDATI (collaudo 1.22.0, O5; decisione della madre): l'annuncio dopo la mossa
 * diceva «1 riga eliminate», «piu' 1 punti» e «Eccellente!. 1 riga...»: una sola parola per
 * singolare e plurale, e il punto aggiunto anche dopo il punto esclamativo. Acceso, il
 * participio si accorda (riga/colonna -> eliminata, quadrante -> eliminato; al plurale
 * eliminate, o eliminati se fra le cose eliminate c'e' un quadrante), «punto» al singolare,
 * e nessun punto dopo una frase che finisce gia' con «!», «?» o «.». Spento, tornano i tre
 * errori: `tests/annunci.test.js` e' rosso.
 */
export const ANNUNCI_ACCORDATI = true;

/** Le frasi unite in un annuncio solo, senza un punto dopo un punto esclamativo. */
function unisci(parti) {
  if (!ANNUNCI_ACCORDATI) return `${parti.join('. ')}.`;
  return parti.reduce((testo, parte) => {
    if (!testo) return parte;
    return `${testo}${/[.!?…]$/.test(testo) ? ' ' : '. '}${parte}`;
  }, '').replace(/([^.!?…])$/, '$1.');
}

/**
 * Il participio di «eliminare» accordato con quello che si e' eliminato. In italiano:
 * una cosa sola prende il suo genere (riga e colonna femminili, quadrante maschile); piu'
 * cose prendono il plurale, maschile se ce n'e' anche una sola maschile.
 */
function eliminate(tipi, t) {
  if (!ANNUNCI_ACCORDATI) return t('a11y.eliminate');
  const totale = tipi.row + tipi.col + tipi.quadrant;
  if (totale === 1) return tipi.quadrant ? t('a11y.eliminato') : t('a11y.eliminata');
  return tipi.quadrant ? t('a11y.eliminati') : t('a11y.eliminate');
}

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
    parti.push(`${elenco.join(', ')} ${eliminate(tipi, t)}`);
  }

  const punti = ANNUNCI_ACCORDATI && lastMove.points === 1 ? t('a11y.punto') : t('a11y.punti');
  parti.push(`${t('a11y.piu')} ${lastMove.points} ${punti}`);
  if (lastMove.chainAfter > 0) parti.push(`${t('hud.catena')} ${lastMove.chainAfter}`);
  if (lastMove.boardCleared) parti.push(t('a11y.grigliaVuota'));
  if (lastMove.gameOver) parti.push(t('fine.titolo'));

  return unisci(parti);
}
