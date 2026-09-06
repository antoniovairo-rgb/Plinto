import { Pagina } from './Pagina.jsx';
import { PAYPAL_URL } from '../../config/progetto.js';

/**
 * Sostegno volontario.
 *
 * Regole autoimposte, da non violare nelle versioni future:
 *  - non compare mai da sola: ci si arriva solo scegliendo di entrarci;
 *  - non interrompe mai una partita;
 *  - non sblocca niente, non toglie niente, non promette niente;
 *  - non usa senso di colpa, urgenza o conteggi alla rovescia.
 */
export function SchermoSostieni({ onIndietro, t }) {
  return (
    <Pagina titolo={t('sostieni.titolo')} onIndietro={onIndietro} t={t}>
      <p className="pl-testo">{t('sostieni.testo')}</p>

      {PAYPAL_URL ? (
        <a className="pl-btn pl-btn--primario pl-btn--largo" href={PAYPAL_URL}
           target="_blank" rel="noopener noreferrer">
          {t('sostieni.bottone')}
        </a>
      ) : (
        <p className="pl-nota">{t('varie.donazioneNonAttiva')}</p>
      )}

      <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onIndietro}>
        {t('sostieni.noGrazie')}
      </button>
    </Pagina>
  );
}
