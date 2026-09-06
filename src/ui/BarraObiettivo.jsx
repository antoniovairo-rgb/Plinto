import { descriviObiettivi } from './schermate/Quadri.jsx';

/**
 * Striscia con l'obiettivo del Quadro e le mosse rimaste.
 *
 * Sta sopra la plancia perche' e' l'unica informazione che serve PRIMA di muovere:
 * il punteggio si guarda dopo, l'obiettivo si guarda mentre si decide.
 * Le mosse rimaste diventano rosse solo sull'ultima: un contatore che allarma tutto
 * il tempo smette di allarmare.
 */
export function BarraObiettivo({ quadro, stato, t }) {
  const agliSgoccioli = stato.mosseRimaste !== null && stato.mosseRimaste <= 1;

  return (
    <div className="pl-obiettivo">
      <div className="pl-obiettivo__testi">
        <span className="pl-hud__etichetta">
          {t('quadri.quadro').replace('{n}', quadro.numero)}
        </span>
        <span className="pl-obiettivo__frase">{descriviObiettivi(quadro, t)}</span>
      </div>

      <div className="pl-obiettivo__progressi" aria-hidden="true">
        {stato.progressi.map((p) => (
          <span
            key={p.tipo}
            className={`pl-obiettivo__quota ${p.completo ? 'pl-obiettivo__quota--completo' : ''}`}
          >
            {p.fatto}<span className="pl-obiettivo__su">/{p.quanti}</span>
          </span>
        ))}
      </div>

      {stato.mosseRimaste !== null ? (
        <div className={`pl-obiettivo__mosse ${agliSgoccioli ? 'pl-obiettivo__mosse--poche' : ''}`}>
          <span className="pl-hud__etichetta">{t('quadri.mosse')}</span>
          <strong>{stato.mosseRimaste}</strong>
        </div>
      ) : null}
    </div>
  );
}
