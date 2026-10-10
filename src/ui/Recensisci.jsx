import { useState } from 'react';
import { PLAY_URL } from '../config/progetto.js';
import { nellAppPlay, recensioneToccata, segnaRecensione } from '../persistence/recensione.js';
import { IconaCuore } from './IconeMenu.jsx';

/**
 * L'invito a recensire PLINTO sul Play Store, nei momenti belli del gioco.
 *
 * E' UN COLLEGAMENTO, NON LA SCHEDA DI GOOGLE. La scheda di recensione dentro l'app
 * (In-App Review API) e' una libreria Android, e l'app Android di PLINTO non ha codice
 * suo. Il collegamento porta alla pagina del gioco sul Play Store, che e' la via che
 * Google stesso indica come alternativa a un pulsante.
 *
 * Regole, da non violare nelle versioni future (vengono dalle norme di Google Play):
 *  - niente premi in cambio, niente stelle chieste, niente "ti piace?";
 *  - mai durante una partita, mai in una finestra che si apre da sola;
 *  - solo nell'app del Play Store (vedi persistence/recensione.js).
 *
 * Sulle schermate di vittoria compare finche' il giocatore non l'ha toccato una volta;
 * la voce del menu della home invece resta sempre.
 */
export function InvitoRecensione({ t, className = '' }) {
  const [visibile] = useState(() => nellAppPlay() && !recensioneToccata());
  if (!visibile) return null;
  return (
    <a
      className={`pl-btn pl-btn--largo pl-recensisci ${className}`.trim()}
      href={PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={segnaRecensione}
    >
      <IconaCuore />
      <span>{t('recensione.invito')}</span>
    </a>
  );
}

/** La voce del menu della home: stessa forma delle altre cinque. */
export function VoceRecensione({ t }) {
  const [visibile] = useState(() => nellAppPlay());
  if (!visibile) return null;
  return (
    <a
      className="pl-btn pl-btn--fantasma pl-home__voce pl-home__voce--recensisci"
      href={PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={segnaRecensione}
    >
      <span className="pl-home__voce-icona"><IconaCuore /></span>
      <span>{t('recensione.voce')}</span>
    </a>
  );
}
