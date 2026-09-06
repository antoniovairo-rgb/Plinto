import { useEffect, useRef } from 'react';
import { CHAIN_MAX } from '../config/rules.js';
import { chainMultiplier } from '../core/scoring.js';
import { numero } from '../i18n/formato.js';

/** Testata della partita: punteggio, record, accesso al menu. */
export function Hud({ punteggio, record, onMenu, scatta, t }) {
  return (
    <header className="pl-hud">
      <div className="pl-hud__punteggio">
        <span className="pl-hud__etichetta">{t('hud.punteggio')}</span>
        <span className={`pl-hud__valore ${scatta ? 'pl-hud__valore--scatta' : ''}`}>
          {numero(punteggio)}
        </span>
      </div>
      <button type="button" className="pl-hud__menu" onClick={onMenu} aria-label={t('hud.menu')}>
        <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
          <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
          <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
        </svg>
      </button>
      <div className="pl-hud__record">
        <span className="pl-hud__etichetta">{t('hud.record')}</span>
        <span className="pl-hud__valore pl-hud__valore--piccolo">
          {numero(record)}
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
  const precedente = useRef(livello);
  const cresciuta = livello > precedente.current;
  useEffect(() => { precedente.current = livello; }, [livello]);
  const percentuale = (livello / CHAIN_MAX) * 100;
  const moltiplicatore = chainMultiplier(livello);
  const attiva = livello > 0;
  return (
    <div className="pl-catena">
      <span className="pl-hud__etichetta">{t('hud.catena')}</span>
      <div
        className="pl-catena__barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={CHAIN_MAX}
        aria-valuenow={livello}
        aria-label={t('hud.catena')}
      >
        <div
          key={cresciuta ? `su-${livello}` : `giu-${livello}`}
          className={`pl-catena__riempimento ${cresciuta ? 'pl-catena__riempimento--cresciuta' : ''}`}
          style={{ width: `${percentuale}%` }}
        />
      </div>
      <span className={`pl-catena__valore ${attiva ? 'pl-catena__valore--attiva' : ''}`}>
        &times;{moltiplicatore.toFixed(2)}
      </span>
    </div>
  );
}
