import { Logo } from '../Logo.jsx';

/**
 * La home ha un solo protagonista: il pulsante per giocare.
 * Tutto il resto e' piu' piccolo, piu' scuro e piu' in basso.
 */
export function SchermoHome({ record, cePartitaSalvata, onGioca, onRiprendi, onVai, t }) {
  return (
    <div className="q-screen q-home">
      <div className="q-home__testata">
        <Logo />
        <p className="q-home__claim">{t('gioco.claim')}</p>
      </div>

      <div className="q-home__azioni">
        {cePartitaSalvata ? (
          <>
            <button type="button" className="q-btn q-btn--primario q-btn--largo" onClick={onRiprendi}>
              {t('home.riprendi')}
            </button>
            <button type="button" className="q-btn q-btn--largo" onClick={onGioca}>
              {t('home.nuovaPartita')}
            </button>
          </>
        ) : (
          <button type="button" className="q-btn q-btn--primario q-btn--largo" onClick={onGioca}>
            {t('home.gioca')}
          </button>
        )}

        <p className="q-home__record">
          {record.best > 0
            ? `${t('home.record')} ${record.best.toLocaleString('it-IT')}`
            : t('home.nessunRecord')}
        </p>
      </div>

      <nav className="q-home__menu">
        <button type="button" className="q-btn q-btn--fantasma" onClick={() => onVai('statistiche')}>
          {t('home.statistiche')}
        </button>
        <button type="button" className="q-btn q-btn--fantasma" onClick={() => onVai('impostazioni')}>
          {t('home.impostazioni')}
        </button>
        <button type="button" className="q-btn q-btn--fantasma" onClick={() => onVai('info')}>
          {t('home.info')}
        </button>
      </nav>
    </div>
  );
}
