import { CHAIN_MAX } from '../config/rules.js';
import { chainMultiplier } from '../core/scoring.js';

/** Testata della partita: punteggio, record, accesso al menu. */
export function Hud({ punteggio, record, onMenu, t }) {
  return (
    <header className="q-hud">
      <div className="q-hud__punteggio">
        <span className="q-hud__etichetta">{t('hud.punteggio')}</span>
        <span className="q-hud__valore">{punteggio.toLocaleString('it-IT')}</span>
      </div>
      <button type="button" className="q-hud__menu" onClick={onMenu} aria-label={t('hud.menu')}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
      <div className="q-hud__record">
        <span className="q-hud__etichetta">{t('hud.record')}</span>
        <span className="q-hud__valore q-hud__valore--piccolo">
          {record.toLocaleString('it-IT')}
        </span>
      </div>
    </header>
  );
}

/**
 * Barra della Catena.
 * Mostra il moltiplicatore ESATTO che verra' applicato alla prossima eliminazione:
 * e' la promessa di trasparenza del gioco, quindi non deve mai mentire ne' arrotondare.
 */
export function BarraCatena({ livello, t }) {
  const percentuale = (livello / CHAIN_MAX) * 100;
  const moltiplicatore = chainMultiplier(livello);
  const attiva = livello > 0;
  return (
    <div className="q-catena">
      <span className="q-hud__etichetta">{t('hud.catena')}</span>
      <div
        className="q-catena__barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={CHAIN_MAX}
        aria-valuenow={livello}
        aria-label={t('hud.catena')}
      >
        <div className="q-catena__riempimento" style={{ width: `${percentuale}%` }} />
      </div>
      <span className={`q-catena__valore ${attiva ? 'q-catena__valore--attiva' : ''}`}>
        &times;{moltiplicatore.toFixed(2)}
      </span>
    </div>
  );
}
