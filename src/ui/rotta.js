import { useEffect, useState } from 'react';
import { giornoValido } from '../core/sfida.js';

/**
 * L'unico indirizzo che questo gioco riconosce: `#/sfida/AAAA-MM-GG`.
 *
 * PERCHE' NELL'ANCORA (`#`) E NON NEL PERCORSO. Un indirizzo come
 * `/Plinto/sfida/2026-09-06` richiede che il server risponda con la pagina del gioco a
 * QUALUNQUE percorso. GitHub Pages non lo fa: restituisce 404. E il service worker che
 * rende il gioco installabile e utilizzabile senza rete non salverebbe la situazione,
 * perche' anche lui va in rete per primo sul documento. L'ancora invece non arriva
 * nemmeno al server: la pagina e' sempre la stessa, ed e' il gioco a leggerla. Meno
 * elegante da guardare, e l'unica che funziona da una sottocartella, offline e da
 * un'applicazione installata.
 *
 * QUESTO NON E' UN ROUTER, ed e' voluto: il gioco ha una schermata sola e uno stato
 * interno. L'ancora serve a UNA cosa, aprire la sfida di un giorno preciso da un
 * collegamento. Tutto il resto della navigazione resta dove sta.
 */

/** Il collegamento alla sfida di un giorno. */
export function rottaSfida(giorno) {
  return `#/sfida/${giorno}`;
}

/**
 * Che cosa chiede l'indirizzo corrente.
 * @returns {{nome:'sfida', giorno:string}|null} null se non chiede niente di sensato
 */
export function leggiRotta(ancora) {
  const testo = String(ancora ?? '').replace(/^#/, '');
  const m = /^\/sfida\/([0-9-]{1,20})$/.exec(testo);
  if (!m) return null;
  // La data si valida QUI: l'indirizzo lo puo' scrivere chiunque a mano, e una data
  // inventata deve fermarsi sulla soglia invece di arrivare al motore.
  return giornoValido(m[1]) ? { nome: 'sfida', giorno: m[1] } : null;
}

/** Scrive l'indirizzo senza aggiungere una voce alla cronologia del browser. */
export function scriviRotta(ancora) {
  try {
    const nuovo = `${window.location.pathname}${window.location.search}${ancora || ''}`;
    window.history.replaceState(null, '', nuovo);
  } catch {
    // Un browser che non permette di riscrivere l'indirizzo non deve rompere il gioco:
    // la navigazione interna funziona lo stesso, si perde solo il collegamento diretto.
  }
}

/**
 * La rotta corrente, aggiornata quando l'ancora cambia.
 *
 * Serve anche il caso in cui l'ancora cambia mentre il gioco e' gia' aperto: un
 * collegamento a una sfida ricevuto e aperto con la scheda gia' viva non ricarica la
 * pagina, cambia solo l'ancora, e senza `hashchange` non succederebbe niente.
 */
export function usaRotta() {
  const [rotta, setRotta] = useState(() => {
    try {
      return leggiRotta(window.location.hash);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const aggiorna = () => setRotta(leggiRotta(window.location.hash));
    window.addEventListener('hashchange', aggiorna);
    return () => window.removeEventListener('hashchange', aggiorna);
  }, []);

  return rotta;
}
