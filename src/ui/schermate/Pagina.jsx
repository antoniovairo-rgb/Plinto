/** Impalcatura comune delle pagine secondarie: testata con titolo e ritorno. */
export function Pagina({ titolo, onIndietro, children, t }) {
  return (
    <div className="q-screen">
      <header className="q-pagina__testata">
        <button type="button" className="q-hud__menu" onClick={onIndietro} aria-label={t('comune.indietro')}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path d="M11 3 5 9l6 6" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="q-pagina__titolo">{titolo}</h1>
        <span aria-hidden="true" />
      </header>
      <div className="q-scroll">{children}</div>
    </div>
  );
}

/** Riga di una lista di valori. */
export function Voce({ etichetta, valore }) {
  return (
    <div className="q-voce">
      <span>{etichetta}</span>
      <strong>{valore}</strong>
    </div>
  );
}

/** Interruttore acceso/spento accessibile da tastiera e da lettore di schermo. */
export function Interruttore({ etichetta, descrizione, attivo, onCambia }) {
  return (
    <button type="button" className="q-interruttore" onClick={onCambia} role="switch" aria-checked={attivo}>
      <span className="q-interruttore__testi">
        <span className="q-interruttore__etichetta">{etichetta}</span>
        {descrizione ? <span className="q-interruttore__desc">{descrizione}</span> : null}
      </span>
      <span className={`q-interruttore__leva ${attivo ? 'q-interruttore__leva--on' : ''}`} aria-hidden="true">
        <span className="q-interruttore__pallino" />
      </span>
    </button>
  );
}
