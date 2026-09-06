import { Logo } from '../Logo.jsx';
import { numero } from '../../i18n/formato.js';

/**
 * La home ha un solo protagonista: il pulsante per giocare.
 * Tutto il resto e' piu' piccolo, piu' scuro e piu' in basso.
 */
export function SchermoHome({
  record, cePartitaSalvata, sfidaOggi, sfidaInCorso, quadriFatti, quadriTotali,
  onGioca, onRiprendi, onSfida, onQuadri, onVai, t,
}) {
  return (
    <div className="pl-screen pl-home">
      <div className="pl-home__testata">
        <Logo />
        <p className="pl-home__claim">{t('gioco.claim')}</p>
      </div>

      <div className="pl-home__azioni">
        {cePartitaSalvata ? (
          <>
            <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onRiprendi}>
              {t('home.riprendi')}
            </button>
            <button type="button" className="pl-btn pl-btn--largo" onClick={onGioca}>
              {t('home.nuovaPartita')}
            </button>
          </>
        ) : (
          <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onGioca}>
            {t('home.gioca')}
          </button>
        )}

        <p className="pl-home__record">
          {record.best > 0
            ? `${t('home.record')} ${numero(record.best)}`
            : t('home.nessunRecord')}
        </p>

        {/* Il percorso a Quadri e la Sfida del Giorno sono due pulsanti, non due
            richiami: non lampeggiano, non hanno contatori alla rovescia e non hanno
            serie da mantenere. Il pulsante grande resta uno solo. */}
        <button type="button" className="pl-btn pl-btn--largo pl-sfida-avvio" onClick={onQuadri}>
          <span>{t('quadri.breve')}</span>
          <span className="pl-sfida-avvio__esito">
            {t('quadri.avanzamento').replace('{fatti}', quadriFatti).replace('{totale}', quadriTotali)}
          </span>
        </button>

        <button type="button" className="pl-btn pl-btn--largo pl-sfida-avvio" onClick={onSfida}>
          <span>{sfidaInCorso ? t('sfida.riprendi') : t('sfida.breve')}</span>
          <span className="pl-sfida-avvio__esito">
            {sfidaOggi.partite > 0 ? numero(sfidaOggi.best) : '—'}
          </span>
        </button>
      </div>

      <nav className="pl-home__menu">
        <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => onVai('statistiche')}>
          {t('home.statistiche')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => onVai('impostazioni')}>
          {t('home.impostazioni')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => onVai('info')}>
          {t('home.info')}
        </button>
      </nav>
    </div>
  );
}
