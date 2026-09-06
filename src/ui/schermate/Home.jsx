import { Logo } from '../Logo.jsx';
import { numero } from '../../i18n/formato.js';

/**
 * La home ha un solo protagonista: il pulsante per giocare.
 * Tutto il resto e' piu' piccolo, piu' scuro e piu' in basso.
 */
export function SchermoHome({
  record, cePartitaSalvata, sfidaOggi, sfidaInCorso, onGioca, onRiprendi, onSfida, onVai, t,
}) {
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
            ? `${t('home.record')} ${numero(record.best)}`
            : t('home.nessunRecord')}
        </p>

        {/* La Sfida del Giorno e' un secondo pulsante, non un richiamo insistente:
            non lampeggia, non ha contatori alla rovescia e non ha serie da mantenere. */}
        <button type="button" className="q-btn q-btn--largo q-sfida-avvio" onClick={onSfida}>
          <span>{sfidaInCorso ? t('sfida.riprendi') : t('sfida.breve')}</span>
          <span className="q-sfida-avvio__esito">
            {sfidaOggi.partite > 0 ? numero(sfidaOggi.best) : '—'}
          </span>
        </button>
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
