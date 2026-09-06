import { Pagina } from './Pagina.jsx';
import { PAYPAL_URL, CONTATTO, ANNO } from '../../config/progetto.js';

/**
 * Info e privacy.
 *
 * Il testo sulla privacy descrive esattamente cio' che il codice fa: nessuna
 * richiesta di rete, nessun identificativo, nessuna analitica, dati solo locali.
 * Se un giorno il gioco raccogliesse qualcosa, questo testo va cambiato PRIMA.
 */
export function SchermoInfo({ onIndietro, onSostieni, t }) {
  return (
    <Pagina titolo={t('info.titolo')} onIndietro={onIndietro} t={t}>
      <p className="pl-nota">
        {t('info.versione')} {__APP_VERSION__}
      </p>

      <h2 className="pl-sezione">{t('info.privacyTitolo')}</h2>
      <p className="pl-testo">{t('info.privacy')}</p>

      <h2 className="pl-sezione">{t('info.licenzeTitolo')}</h2>
      <p className="pl-testo">{t('varie.licenzeTesto')}</p>

      {CONTATTO ? <p className="pl-nota">{CONTATTO}</p> : null}

      <button type="button" className="pl-btn pl-btn--largo" onClick={onSostieni}>
        {t('home.sostieni')}
      </button>

      <p className="pl-nota pl-nota--piede">© {ANNO} PLINTO</p>
      {PAYPAL_URL ? null : (
        <p className="pl-nota pl-nota--piede">{t('varie.donazioneNonAttiva')}</p>
      )}
    </Pagina>
  );
}
