import { useState } from 'react';
import { Pagina, Interruttore } from './Pagina.jsx';
import { LINGUE } from '../../i18n/index.js';

/**
 * Impostazioni. Ogni voce e' una scelta reale del giocatore, non una preferenza
 * finta: audio, vibrazione e animazioni si spengono davvero, e l'aiuto visivo
 * si puo' togliere per chi vuole leggere la griglia da solo.
 */
export function SchermoImpostazioni({ impostazioni, cambia, inverti, onAzzera, onIndietro, t }) {
  const [conferma, setConferma] = useState(false);
  const [fatto, setFatto] = useState(false);

  return (
    <Pagina titolo={t('impostazioni.titolo')} onIndietro={onIndietro} t={t}>
      <div className="q-lista">
        <Interruttore etichetta={t('impostazioni.audio')} attivo={impostazioni.audio}
                      onCambia={() => inverti('audio')} />
        <Interruttore etichetta={t('impostazioni.vibrazione')} attivo={impostazioni.vibrazione}
                      onCambia={() => inverti('vibrazione')} />
        <Interruttore etichetta={t('impostazioni.animazioni')} attivo={impostazioni.animazioni}
                      onCambia={() => inverti('animazioni')} />
        <Interruttore etichetta={t('impostazioni.aiutoVisivo')} attivo={impostazioni.aiutoVisivo}
                      onCambia={() => inverti('aiutoVisivo')} />
      </div>

      <div className="q-gruppo">
        <span className="q-hud__etichetta">{t('impostazioni.tema')}</span>
        <div className="q-segmenti">
          {[['scuro', t('impostazioni.temaScuro')], ['chiaro', t('impostazioni.temaChiaro')]].map(
            ([valore, testo]) => (
              <button key={valore} type="button"
                      className={`q-segmento ${impostazioni.tema === valore ? 'q-segmento--attivo' : ''}`}
                      onClick={() => cambia('tema', valore)} aria-pressed={impostazioni.tema === valore}>
                {testo}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="q-gruppo">
        <span className="q-hud__etichetta">{t('impostazioni.lingua')}</span>
        <div className="q-segmenti">
          {Object.entries(LINGUE).map(([codice, { nome }]) => (
            <button key={codice} type="button"
                    className={`q-segmento ${impostazioni.lingua === codice ? 'q-segmento--attivo' : ''}`}
                    onClick={() => cambia('lingua', codice)} aria-pressed={impostazioni.lingua === codice}>
              {nome}
            </button>
          ))}
        </div>
      </div>

      <div className="q-gruppo">
        {fatto ? (
          <p className="q-nota">{t('impostazioni.azzeraFatto')}</p>
        ) : conferma ? (
          <>
            <p className="q-nota q-nota--allarme">{t('impostazioni.azzeraConferma')}</p>
            <div className="q-segmenti">
              <button type="button" className="q-btn q-btn--fantasma" onClick={() => setConferma(false)}>
                {t('comune.no')}
              </button>
              <button type="button" className="q-btn q-btn--pericolo"
                      onClick={() => { onAzzera(); setFatto(true); setConferma(false); }}>
                {t('comune.si')}
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="q-btn q-btn--fantasma q-btn--largo" onClick={() => setConferma(true)}>
            {t('impostazioni.azzera')}
          </button>
        )}
      </div>
    </Pagina>
  );
}
