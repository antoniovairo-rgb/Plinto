import { descriviObiettivi } from './Quadri.jsx';
import { Plinto } from '../Plinto.jsx';
import { numero } from '../../i18n/formato.js';

/**
 * Esito di un Quadro.
 *
 * Se hai perso, dice PERCHE' in una riga e mette "Riprova" come primo pulsante: un
 * Quadro fallito deve costare un tocco, non una navigazione. Se hai vinto, il pulsante
 * principale porta al Quadro successivo, che e' quello che si vuole fare dopo.
 */
export function SchermoFineQuadro({ quadro, esito, ultimo, onRiprova, onProssimo, onElenco, t }) {
  const vinto = esito.completato;
  const motivo = esito.motivo === 'mosse' ? t('quadri.persoMosse') : t('quadri.persoBloccato');

  return (
    <div className="pl-screen pl-fine">
      <div className="pl-scroll">
        <p className="pl-fine__titolo">{t('quadri.quadro').replace('{n}', quadro.numero)}</p>

        {/* Plinto dice l'esito prima delle parole: si legge in mezzo secondo. */}
        <div className="pl-fine__plinto">
          <Plinto espressione={vinto ? 'contento' : 'deluso'} dimensione={92} className="pl-plinto--vivo" />
        </div>

        <p className={`pl-quadro-esito ${vinto ? 'pl-quadro-esito--vinto' : ''}`}>
          {vinto ? t('quadri.vinto') : t('quadri.perso')}
        </p>
        <p className="pl-fine__motivo">{vinto ? descriviObiettivi(quadro, t) : motivo}</p>

        {vinto ? (
          <div className="pl-fine__punteggio">
            <span className="pl-hud__etichetta">{t('quadri.mosse')}</span>
            <span className="pl-fine__numero">{esito.riepilogo.moves}</span>
            {esito.primaVolta || esito.miglioramento ? (
              <span className="pl-fine__nastro">
                {t('quadri.nuovoRecord').replace('{mosse}', esito.riepilogo.moves)}
              </span>
            ) : null}
          </div>
        ) : (
          <div className="pl-fine__dettagli">
            {esito.progressi.map((p) => (
              <div className="pl-fine__riga" key={p.tipo}>
                <span>{t(`quadri.obiettivi.${p.tipo}`).replace('{n}', numero(p.quanti))}</span>
                <strong className={p.completo ? 'pl-quadro-esito--vinto' : ''}>
                  {p.fatto} / {p.quanti}
                </strong>
              </div>
            ))}
          </div>
        )}

        {vinto && ultimo ? <p className="pl-fine__extra">{t('quadri.finito')}</p> : null}
      </div>

      <div className="pl-fine__azioni">
        {vinto && !ultimo ? (
          <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onProssimo}>
            {t('quadri.prossimo')}
          </button>
        ) : (
          <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onRiprova}>
            {t('quadri.riprova')}
          </button>
        )}
        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onElenco}>
          {t('quadri.elenco')}
        </button>
      </div>
    </div>
  );
}
