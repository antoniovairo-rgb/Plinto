import { useEffect, useRef } from 'react';
import { CLASSE_VELO } from './velo.js';

/**
 * La conferma in due passi per le azioni che cancellano.
 *
 * PERCHE' UNA FINESTRA SOSPESA E NON UN RIQUADRO NELLA PAGINA. Prima le conferme stavano
 * in fondo a schermate lunghe -- cento livelli, o tutte le impostazioni -- e si leggevano
 * come un avviso comparso da solo fra le altre cose. Una finestra prende lo schermo: non
 * si puo' scorrere oltre, non si confonde con il resto, e chiede una risposta. E' la
 * forma giusta per una domanda che cancella mesi di gioco.
 *
 * PERCHE' UNA SOLA, USATA DA TUTTE E DUE. Azzerare i dati e ricominciare i livelli sono
 * due azioni diverse ma la stessa domanda. Tenerle in due pezzi di codice separati vuol
 * dire che un giorno una avra' due conferme e l'altra una sola, e nessuno se ne
 * accorgera' finche' qualcuno non perdera' qualcosa.
 *
 * QUELLO CHE IL COMPONENTE GARANTISCE, e che chi lo usa non puo' dimenticare: i passi
 * sono sempre due e sono sempre dichiarati; il "no" e' sempre il pulsante pieno e il
 * "si" quello trasparente, perche' la strada che cancella non deve essere anche la piu'
 * facile da toccare; si esce con Escape, toccando fuori o con "no", da tutti e due i
 * passi. Il contenuto -- che cosa si sta per perdere -- lo mette chi chiama, perche'
 * quello cambia.
 */
export function ConfermaDoppia({
  passo, titolo, etichettaFinale, onAnnulla, onAvanti, onConferma, t, children,
}) {
  useEffect(() => {
    const esci = (e) => { if (e.key === 'Escape') onAnnulla(); };
    window.addEventListener('keydown', esci);
    return () => window.removeEventListener('keydown', esci);
  }, [onAnnulla]);

  return (
    <div className={CLASSE_VELO} onClick={onAnnulla}>
      <div
        className={`pl-azzera ${passo === 2 ? 'pl-azzera--ultimo' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={titolo}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="pl-azzera__passo">{t('comune.passoConferma').replace('{n}', passo)}</p>
        <p className="pl-azzera__titolo">{titolo}</p>
        {children}
        <div className="pl-segmenti">
          <button type="button" className="pl-btn" onClick={onAnnulla}>
            {t('comune.no')}
          </button>
          {passo === 1 ? (
            <button type="button" className="pl-btn pl-btn--fantasma" onClick={onAvanti}>
              {t('comune.si')}
            </button>
          ) : (
            <button type="button" className="pl-btn pl-btn--pericolo" onClick={onConferma}>
              {etichettaFinale}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Una riga dell'elenco "che cosa sparisce": la voce a sinistra, quanto ce n'e' a destra. */
export function VoceCancellata({ etichetta, valore }) {
  return (
    <li className="pl-azzera__voce">
      <span>{etichetta}</span>
      <strong>{valore}</strong>
    </li>
  );
}

/*
 * FUOCO_TORNA_A_CHI_APRE (collaudo 1.21.18, D1; decisione PO-023): chiusa la domanda senza
 * scegliere (Escape, tocco sul velo, Indietro) il fuoco finiva su <body>, e il Tab dopo
 * ripartiva da «Livello 1» invece che da dove si era. Misurato uguale sulla 1.21.17: non
 * era una regressione. Acceso, torna al pulsante che ha aperto la domanda. Spento, torna
 * il difetto: caso P di `tests/e2e/ripresa-livello.mjs` rosso.
 */
export const FUOCO_TORNA_A_CHI_APRE = true;

/**
 * La domanda prima di perdere una partita lasciata a meta' (PO-008, collaudo 1.21.9: E1,
 * E2 e la sfida dall'archivio). Decisione del PO: «Chiedo conferma».
 *
 * UN PASSO SOLO, e non i due di `ConfermaDoppia`: qui si perde una partita, non mesi di
 * gioco, e chi ha toccato «Riprova» di solito vuole davvero riprovare. Due passi per ogni
 * riprova sarebbero un pedaggio. Lo stile e il velo sono gli stessi, cosi' il giocatore
 * riconosce la forma: una finestra che chiede, sopra tutto il resto.
 *
 * OGNI PULSANTE DICE CHE COSA FA («Riprendi il livello 2», «Gioca il livello 1»). La
 * prima versione aveva «Continua», e il proprietario l'ha trovata poco chiara: continuare
 * che cosa? Il titolo dice che cosa c'e' a meta', il testo che cosa si perde.
 *
 * LA STRADA SICURA E' QUELLA FACILE: quella che non perde niente e' il pulsante pieno, in
 * alto, e ha il fuoco appena la finestra si apre; l'altra e' trasparente. Escape, il tocco fuori e
 * il tasto Indietro di Android (gestito da App) chiudono la domanda senza perdere niente.
 */
export function ConfermaPerdita({
  titolo, testo, etichettaTorna, etichettaContinua, onTorna, onContinua, onAnnulla, ripiego,
}) {
  const sicuro = useRef(null);
  // Letto al primo disegno, prima che il fuoco passi al pulsante sicuro: e' il pulsante
  // che ha aperto la domanda (su iOS un tocco non da' il fuoco, e allora e' <body>).
  const origine = useRef(typeof document !== 'undefined' ? document.activeElement : null);
  const scelto = useRef(false);
  useEffect(() => { sicuro.current?.focus(); }, []);
  // Alla chiusura e non a ogni `onAnnulla`: cosi' vale anche per Indietro, che chiude la
  // domanda da App senza passare di qui. Dopo una scelta no: si cambia schermata.
  // `ripiego` serve quando il pulsante non c'e' piu': «Riprova» chiude il menu che lo
  // contiene con lo stesso tocco, e allora si torna al pulsante che apre il menu.
  const ripiegoAttuale = useRef(ripiego);
  ripiegoAttuale.current = ripiego;
  useEffect(() => () => {
    if (!FUOCO_TORNA_A_CHI_APRE || scelto.current) return;
    const el = origine.current?.isConnected && origine.current !== document.body
      ? origine.current : ripiegoAttuale.current?.();
    el?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    const esci = (e) => { if (e.key === 'Escape') onAnnulla(); };
    window.addEventListener('keydown', esci);
    return () => window.removeEventListener('keydown', esci);
  }, [onAnnulla]);

  return (
    <div className={CLASSE_VELO} onClick={onAnnulla}>
      <div
        className="pl-azzera pl-azzera--perdita"
        role="dialog"
        aria-modal="true"
        aria-label={titolo}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="pl-azzera__titolo">{titolo}</p>
        <p className="pl-azzera__testo">{testo}</p>
        <div className="pl-azzera__scelte">
          <button ref={sicuro} type="button" className="pl-btn pl-btn--largo" onClick={() => { scelto.current = true; onTorna(); }}>
            {etichettaTorna}
          </button>
          <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={() => { scelto.current = true; onContinua(); }}>
            {etichettaContinua}
          </button>
        </div>
      </div>
    </div>
  );
}
