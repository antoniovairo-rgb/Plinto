import { useEffect, useState } from 'react';

/**
 * Installazione sul telefono o sul tablet.
 *
 * I due mondi si comportano in modo diverso, e fingere che siano uguali produce una
 * schermata che mente a meta' dei giocatori:
 *
 *   - ANDROID / Chrome: il browser lancia `beforeinstallprompt` quando ritiene il sito
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

  // Android: c'e' un invito vero da aprire.
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
