import { useEffect, useRef } from 'react';
import { CLASSE_VELO } from './velo.js';

/*
 * MENU_COME_LE_DOMANDE (collaudo 1.21.20, O2; decisione PO-024): il menu della partita non
 * si chiudeva con Escape, all'apertura il fuoco restava su «Menu» dietro il velo, e
 * chiuso col velo o con «Torna alla partita» il fuoco finiva su <body> (il Tab ripartiva
 * dall'inizio della pagina). Le domande di `ConfermaPerdita` fanno gia' tutte e tre le
 * cose (PO-023, D1). Acceso, il menu si comporta come loro: Escape lo chiude, il fuoco
 * entra sul primo pulsante, e chiuso SENZA una scelta torna al pulsante che l'ha aperto.
 * E' anche una finestra per chi legge lo schermo (`role="dialog"`, `aria-modal`), come le
 * domande e il pannello degli attrezzi. A schermo non cambia niente. Spento, torna il
 * difetto: caso Q di `tests/e2e/ripresa-livello.mjs` rosso.
 */
export const MENU_COME_LE_DOMANDE = true;

/**
 * Il menu che si apre dal pulsante «Menu» durante una partita (libera, sfida o livello).
 *
 * «Torna alla partita» e' sempre il primo pulsante, e sta qui perche' e' l'unico che
 * chiude SENZA scegliere: gli altri (`children`) sono scelte. Dopo una scelta il fuoco non
 * si sposta, come dopo la scelta in una domanda: si cambia schermata o parte un'altra
 * partita.
 *
 * `coperto` e' vero quando sopra il menu c'e' una domanda (con la libera a meta', «Nuova
 * partita» chiede prima di perderla e il menu resta aperto sotto). Allora Escape e' della
 * domanda, non del menu: senza, un solo Escape chiudeva tutte e due. E se la domanda si
 * chiude senza scelta il menu e' ancora li': la scelta che l'aveva aperta non conta piu'.
 */
export function MenuPartita({ etichetta, etichettaTorna, onChiudi, coperto, children }) {
  const torna = useRef(null);
  // Letto al primo disegno, prima che il fuoco entri nel menu: e' il pulsante «Menu». Su
  // iOS un tocco non da' il fuoco e qui c'e' <body>: si ripiega sul pulsante «Menu».
  const origine = useRef(typeof document !== 'undefined' ? document.activeElement : null);
  const scelto = useRef(false);
  useEffect(() => {
    if (MENU_COME_LE_DOMANDE) torna.current?.focus();
  }, []);
  // Alla chiusura e non in `onChiudi`: cosi' vale anche per Indietro, che chiude il menu
  // da App (`passoIndietro`) senza passare di qui.
  useEffect(() => () => {
    if (!MENU_COME_LE_DOMANDE || scelto.current) return;
    const el = origine.current?.isConnected && origine.current !== document.body
      ? origine.current : document.querySelector('.pl-hud__menu');
    el?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (!coperto) scelto.current = false;
  }, [coperto]);
  useEffect(() => {
    if (!MENU_COME_LE_DOMANDE || coperto) return undefined;
    const esci = (e) => { if (e.key === 'Escape') onChiudi(); };
    window.addEventListener('keydown', esci);
    return () => window.removeEventListener('keydown', esci);
  }, [coperto, onChiudi]);

  const finestra = MENU_COME_LE_DOMANDE
    ? { role: 'dialog', 'aria-modal': 'true', 'aria-label': etichetta }
    : {};
  return (
    <div className={CLASSE_VELO} onClick={onChiudi}>
      <div
        className="pl-menu"
        {...finestra}
        onClick={(e) => e.stopPropagation()}
        onClickCapture={(e) => {
          const b = e.target.closest('button');
          if (b && b !== torna.current) scelto.current = true;
        }}
      >
        <button ref={torna} type="button" className="pl-btn pl-btn--largo" onClick={onChiudi}>
          {etichettaTorna}
        </button>
        {children}
      </div>
    </div>
  );
}
