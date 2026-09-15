import { useEffect } from 'react';

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
    <div className="pl-velo" onClick={onAnnulla}>
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
