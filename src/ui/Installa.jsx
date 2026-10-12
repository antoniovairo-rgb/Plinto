import { useEffect, useState } from 'react';
import { PLAY_URL } from '../config/progetto.js';
import { nellAppPlay } from '../persistence/recensione.js';
import { IconaScarica } from './IconeMenu.jsx';

/**
 * Installazione sul telefono o sul tablet.
 *
 * I due mondi si comportano in modo diverso, e fingere che siano uguali produce una
 * schermata che mente a meta' dei giocatori:
 *
 *   - ANDROID: dalla 1.21.5 niente installazione del sito: la voce «Scarica l'app» del
 *     menu porta all'app sul Play Store (`VoceScaricaApp`, in fondo al file).
 *   - Chrome altrove: il browser lancia `beforeinstallprompt` quando ritiene il sito
 *     installabile. L'evento va CATTURATO e conservato: e' l'unico modo di aprire la
 *     finestra di installazione dopo, quando il giocatore tocca il pulsante. Se non
 *     arriva, il pulsante non esiste, perche' non ci sarebbe niente da aprire.
 *   - iOS / Safari: quell'evento non esiste e non esistera'. L'installazione si fa a
 *     mano dal menu Condividi. L'unica cosa onesta e' spiegare come, con le parole
 *     esatte che compaiono sullo schermo di quel telefono.
 *
 * E se il gioco e' GIA' installato non si mostra niente: chi sta giocando
 * dall'applicazione non ha bisogno di sapere come installarla.
 */

/** Il gioco e' gia' aperto come applicazione installata? */
function giaInstallato() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches
      // Safari su iOS non supporta display-mode: standalone e usa una sua proprieta'.
      || window.navigator.standalone === true;
  } catch {
    return false;
  }
}

/** Siamo su un telefono o tablet Android? */
function eAndroid() {
  try {
    return /Android/i.test(window.navigator.userAgent);
  } catch {
    return false;
  }
}

/** Siamo su iPhone o iPad, dove l'installazione e' solo manuale? */
function eApple() {
  try {
    const ua = window.navigator.userAgent;
    // iPadOS recente si dichiara "Macintosh": lo si riconosce dal tocco.
    return /iPhone|iPad|iPod/.test(ua)
      || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1);
  } catch {
    return false;
  }
}

export function Installa({ t }) {
  const [invito, setInvito] = useState(null);      // l'evento catturato, se arriva
  const [istruzioni, setIstruzioni] = useState(false);
  const [installato, setInstallato] = useState(() => giaInstallato());

  useEffect(() => {
    if (installato) return undefined;

    const cattura = (e) => {
      // Senza preventDefault il browser mostra la sua barra a sorpresa: qui si vuole
      // che sia il giocatore a chiedere l'installazione, non il gioco a proporla.
      e.preventDefault();
      setInvito(e);
    };
    const installata = () => { setInstallato(true); setInvito(null); };

    window.addEventListener('beforeinstallprompt', cattura);
    window.addEventListener('appinstalled', installata);
    return () => {
      window.removeEventListener('beforeinstallprompt', cattura);
      window.removeEventListener('appinstalled', installata);
    };
  }, [installato]);

  if (installato) return null;

  // Android: niente installazione del sito. Si manda al Play Store con la voce del menu
  // (`VoceScaricaApp`, qui sotto), che non allunga la home.
  if (eAndroid() && PLAY_URL) return null;

  // Altri browser con un invito vero da aprire (Chrome sul computer, per esempio).
  if (invito) {
    return (
      <button
        type="button"
        className="pl-btn pl-btn--fantasma pl-btn--largo pl-installa"
        onClick={async () => {
          invito.prompt();
          const esito = await invito.userChoice.catch(() => null);
          // L'invito si puo' usare una volta sola: dopo va buttato, o il secondo tocco
          // non farebbe niente e il pulsante sembrerebbe rotto.
          setInvito(null);
          if (esito?.outcome === 'accepted') setInstallato(true);
        }}
      >
        {t('installa.azione')}
      </button>
    );
  }

  // iOS: nessun invito, ma si puo' spiegare come si fa.
  if (eApple()) {
    return (
      <div className="pl-installa">
        <button
          type="button"
          className="pl-btn pl-btn--fantasma pl-btn--largo"
          onClick={() => setIstruzioni((x) => !x)}
          aria-expanded={istruzioni}
        >
          {t('installa.azione')}
        </button>
        {istruzioni ? (
          <p className="pl-installa__come">{t('installa.apple')}</p>
        ) : null}
      </div>
    );
  }

  // Altrove (desktop, o browser che non offrono l'installazione) non si promette
  // niente: un pulsante che non fa niente e' peggio di un pulsante che manca.
  return null;
}

/**
 * «Scarica l'app»: la voce del menu della home per chi gioca dal BROWSER di un telefono
 * Android (richiesta del proprietario, 12 ottobre 2026).
 *
 * L'installazione del sito non passa dal Play Store: non entra nei numeri della Play
 * Console, e chi la fa non vede mai la scheda ne' puo' recensire. L'app del Play Store e'
 * lo stesso gioco, quindi non si perde niente.
 *
 * E' una voce del menu, non un pulsante in piu': con cinque voci la griglia ha un posto
 * libero, e un pulsante sotto le modalita' faceva scorrere la home di 70 pixel a 360x640.
 *
 * Non compare dentro l'app: la si riconosce dalla modalita' a schermo intero
 * (`display-mode: standalone`) e dal segno lasciato all'avvio (`nellAppPlay`, che legge
 * il referrer `android-app://`, il controllo indicato da web.dev). Con un browser
 * diverso da Chrome i due segnali non sono garantiti: e' un caso noto, da tenere d'occhio.
 */
export function VoceScaricaApp({ t }) {
  const [visibile] = useState(() => eAndroid() && Boolean(PLAY_URL) && !giaInstallato() && !nellAppPlay());
  if (!visibile) return null;
  return (
    <a
      className="pl-btn pl-btn--fantasma pl-home__voce pl-home__voce--scarica"
      href={PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('installa.play')}
    >
      <span className="pl-home__voce-icona"><IconaScarica /></span>
      <span>{t('installa.voce')}</span>
    </a>
  );
}
