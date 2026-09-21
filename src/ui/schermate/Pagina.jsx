import { Plinto } from '../Plinto.jsx';
/** Impalcatura comune delle pagine secondarie: testata con titolo e ritorno. */
export function Pagina({ titolo, onIndietro, children, t }) {
  return (
    <div className="pl-screen">
      <header className="pl-pagina__testata">
        <button type="button" className="pl-hud__menu" onClick={onIndietro} aria-label={t('comune.indietro')}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M11 3 5 9l6 6" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="pl-pagina__titolo">{titolo}</h1>
        <span aria-hidden="true" />
      </header>
      <div className="pl-scroll">{children}</div>
    </div>
  );
}

/** Riga di una lista di valori. */
/**
 * LA SCHERMATA VUOTA, quando non c'e' ancora niente da mostrare.
 *
 * Era una frase grigia sospesa in mezzo a ottocento pixel di nero. Statistiche, profilo e
 * archivio sono i primi posti dove va un giocatore curioso -- spesso PRIMA di giocare,
 * perche' vuole capire che cosa il gioco tiene da conto -- e trovarci una riga sola in un
 * vuoto restituisce l'impressione che il gioco sia incompiuto, non che manchino i dati.
 *
 * Tre cose, nell'ordine in cui servono: la faccia del gioco, che cosa comparira' qui, e
 * la strada per farlo comparire. L'invito e' opzionale perche' non ogni schermata vuota
 * ne ha uno sensato: dove non c'e', restano le prime due e la composizione regge lo
 * stesso.
 */
export function Vuoto({ testo, invito, onInvito, children }) {
  return (
    <div className="pl-vuoto">
      <Plinto espressione="normale" dimensione={72} className="pl-plinto--vivo" />
      <p className="pl-vuoto__testo">{testo}</p>
      {children}
      {invito && onInvito ? (
        <button type="button" className="pl-btn pl-btn--primario" onClick={onInvito}>
          {invito}
        </button>
      ) : null}
    </div>
  );
}

export function Voce({ etichetta, valore }) {
  return (
    <div className="pl-voce">
      <span>{etichetta}</span>
      <strong>{valore}</strong>
    </div>
  );
}

/** Interruttore acceso/spento accessibile da tastiera e da lettore di schermo. */
export function Interruttore({ etichetta, descrizione, attivo, onCambia }) {
  return (
    <button type="button" className="pl-interruttore" onClick={onCambia} role="switch" aria-checked={attivo}>
      <span className="pl-interruttore__testi">
        <span className="pl-interruttore__etichetta">{etichetta}</span>
        {descrizione ? <span className="pl-interruttore__desc">{descrizione}</span> : null}
      </span>
      <span className={`pl-interruttore__leva ${attivo ? 'pl-interruttore__leva--on' : ''}`} aria-hidden="true">
        <span className="pl-interruttore__pallino" />
      </span>
    </button>
  );
}
