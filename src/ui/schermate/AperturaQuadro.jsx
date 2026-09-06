import { Plinto } from '../Plinto.jsx';
import { descriviObiettivi } from './Quadri.jsx';

/**
 * Apertura di un Quadro: Plinto spiega l'obiettivo prima che si cominci.
 *
 * Perche' esiste. La striscia sopra la plancia dice COSA fare ("Chiudi una riga") ma
 * non dice mai che cosa SIA una riga, ne' come conviene affrontarla. Chi conosce il
 * genere lo deduce in un secondo; chi non lo conosce si trova un contatore 0/1 e nessun
 * appiglio. La presentazione al primo avvio non copre il buco: e' una schermata sola,
 * si vede una volta e non si puo' piu' rileggere.
 *
 * Cosa dice, e in quest'ordine: la frase dell'obiettivo (la stessa, identica, che
 * restera' sopra la plancia), che cosa significa, un consiglio su come ottenerlo, e
 * quante mosse ci sono. Il consiglio e' un consiglio vero, non un incoraggiamento:
 * "scegline una e finiscila" e' un'informazione, "ce la puoi fare" non lo e'.
 *
 * Non blocca niente e non si puo' sbagliare: un pulsante grande, e si gioca.
 */
export function AperturaQuadro({ quadro, onGioca, onElenco, t }) {
  return (
    <div className="pl-screen pl-apertura">
      <div className="pl-scroll">
        <p className="pl-apertura__atto">{quadro.atto}</p>
        <p className="pl-fine__titolo">{t('quadri.quadro').replace('{n}', quadro.numero)}</p>

        <div className="pl-apertura__scena">
          <Plinto espressione="normale" dimensione={84} className="pl-plinto--vivo" />
          <div className="pl-apertura__fumetto">
            <p className="pl-apertura__obiettivo">{descriviObiettivi(quadro, t)}</p>
            {/* Un obiettivo per riga: i Quadri con due obiettivi ne hanno due da
                spiegare, e riassumerli insieme li renderebbe piu' vaghi entrambi. */}
            {quadro.obiettivi.map(({ tipo }) => (
              <p className="pl-apertura__spiega" key={tipo}>
                {t(`quadri.spiegazioni.${tipo}`)}
              </p>
            ))}
          </div>
        </div>

        {quadro.obiettivi.map(({ tipo }) => (
          <p className="pl-apertura__consiglio" key={tipo}>
            <span className="pl-hud__etichetta">{t('quadri.consiglio')}</span>
            {t(`quadri.consigli.${tipo}`)}
          </p>
        ))}

        <p className="pl-apertura__mosse">
          {quadro.maxMosse != null
            ? t('quadri.hai').replace('{n}', quadro.maxMosse)
            : t('quadri.senzaLimite')}
        </p>
      </div>

      <div className="pl-apertura__azioni">
        <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onGioca}>
          {t('home.gioca')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onElenco}>
          {t('quadri.elenco')}
        </button>
      </div>
    </div>
  );
}
