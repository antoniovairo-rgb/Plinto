import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App.jsx';
import { Salvagente } from './ui/Salvagente.jsx';
import { traduttore, linguaDelBrowser } from './i18n/index.js';
import { registraOrigine } from './persistence/recensione.js';
import './styles/app.css';
import './styles/finiture.css';
import './styles/animazioni.css';

/**
 * La rete di sicurezza sta FUORI da App e usa un traduttore proprio.
 *
 * Deve poter disegnare qualcosa anche quando e' App stessa a essersi rotta, e quindi
 * non puo' dipendere da niente che venga da dentro: nemmeno dalla lingua scelta dal
 * giocatore, che App tiene nel suo stato. Ricade sulla lingua del browser, che e' la
 * stessa scelta predefinita che farebbe il gioco al primo avvio.
 */
const t = traduttore(linguaDelBrowser());

/**
 * Interruttore della correzione C1 (collaudo 1.21.7): a 360x640 la home scorreva di 2 px
 * perche' il pie' di pagina, andato a capo, e' piu' alto. La regola CSS che lo avvicina
 * al menu vale solo con questa classe sulla radice (`src/styles/app.css`, cerca
 * `pl-home-stretta`). Spento, torna la misura della 1.21.7; `npm run correzioni` lo
 * prova nei due sensi togliendo la classe dalla pagina.
 */
const HOME_STRETTA_COMPATTA = true;
if (HOME_STRETTA_COMPATTA) document.documentElement.classList.add('pl-home-stretta');

/**
 * Registrazione del service worker.
 *
 * L'indirizzo porta la VERSIONE: `sw.js?v=<versione>`. Cambiando versione cambia
 * l'indirizzo, il browser considera il file modificato e reinstalla il service worker,
 * che all'attivazione cancella le cache delle versioni precedenti. Senza questo
 * dettaglio un service worker puo' restare quello di mesi prima, e con lui la versione
 * del gioco che serve.
 *
 * Solo in produzione: durante lo sviluppo intercettare le richieste servirebbe solo a
 * far dubitare di quale codice si stia guardando.
 */
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`./sw.js?v=${__APP_VERSION__}`).catch(() => {
      // Un service worker che non si registra non impedisce di giocare: si perdono
      // l'installazione e il gioco senza rete, non la partita. Silenzio voluto.
    });
  });
}

/**
 * Da dove si gioca: va letto PRIMA del primo disegno, perche' il parametro e il
 * referrer ci sono solo all'apertura (vedi persistence/recensione.js).
 */
registraOrigine();

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Salvagente t={t}>
      <App />
    </Salvagente>
  </React.StrictMode>,
);
