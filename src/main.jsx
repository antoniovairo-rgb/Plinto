import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App.jsx';
import { Salvagente } from './ui/Salvagente.jsx';
import { traduttore, linguaDelBrowser } from './i18n/index.js';
import './styles/app.css';

/**
 * La rete di sicurezza sta FUORI da App e usa un traduttore proprio.
 *
 * Deve poter disegnare qualcosa anche quando e' App stessa a essersi rotta, e quindi
 * non puo' dipendere da niente che venga da dentro: nemmeno dalla lingua scelta dal
 * giocatore, che App tiene nel suo stato. Ricade sulla lingua del browser, che e' la
 * stessa scelta predefinita che farebbe il gioco al primo avvio.
 */
const t = traduttore(linguaDelBrowser());

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Salvagente t={t}>
      <App />
    </Salvagente>
  </React.StrictMode>,
);
