import { useEffect, useState } from 'react';
import { QUADRI, attoDelQuadro, operaDelQuadro, livelliDellOpera } from '../config/quadri.js';
import { numero } from '../i18n/formato.js';
import { Plinto } from './Plinto.jsx';

/** Quante tappe mostrare a sinistra e a destra di quella appena superata. */
const INTORNO = 3;

/**
 * Avanzamento sul percorso, mostrato subito dopo aver superato un livello.
 *
 * Perche' non basta la mappa completa. La mappa si apre da un menu, mostra cento
 * tappe e va cercata: e' uno strumento per orientarsi, non un momento. Qui invece
 * serve la cosa opposta — un pezzetto di strada, quello appena percorso, con il segno
 * che si SPOSTA da una tappa alla successiva. Il progresso si sente quando lo si vede
 * accadere; una barra che e' gia' piu' lunga di prima non e' la stessa cosa di una
 * barra che si allunga mentre la guardi.
 *
 * Il movimento parte a montaggio avvenuto, non subito: senza il rinvio il browser
 * disegna direttamente lo stato finale e la transizione non si vede proprio.
 *
 * Chi ha chiesto meno movimento riceve lo stato di arrivo e basta: nessun ritardo,
 * nessuna animazione, la stessa informazione.
 */
export function AvanzamentoMappa({ superato, superatiTotali, animazioni = true, t }) {
  const [mosso, setMosso] = useState(!animazioni);

  useEffect(() => {
    if (!animazioni) return undefined;
    // Due fotogrammi: uno per far disegnare lo stato di partenza, uno per cambiarlo.
    const primo = requestAnimationFrame(() => {
      const secondo = requestAnimationFrame(() => setMosso(true));
      return secondo;
    });
    return () => cancelAnimationFrame(primo);
  }, [animazioni]);

  // La strada e i conteggi sono quelli dell'opera del livello appena superato: il
  // pezzetto di strada non scavalca il confine fra il Ponte e la Torre.
  const opera = operaDelQuadro(superato);
  const totale = livelliDellOpera(opera);
  const da = Math.max(opera.da, superato - INTORNO);
  const a = Math.min(opera.a, superato + INTORNO);
  const tappe = QUADRI.filter((q) => q.numero >= da && q.numero <= a);

  // Prima della vittoria eri fermo su questo livello; adesso sei su quello dopo.
  const primaEra = superato;
  const adesso = Math.min(opera.a, superato + 1);
  const attivo = mosso ? adesso : primaEra;

  const fattiPrima = Math.max(0, superatiTotali - 1);
  const quota = ((mosso ? superatiTotali : fattiPrima) / totale) * 100;
  const atto = attoDelQuadro(adesso);

  return (
    <div className="pl-avanza">
      <p className="pl-avanza__atto">{atto ? t(`atti.${atto.id}`) : ''}</p>

      <ol className="pl-avanza__strada" aria-hidden="true">
        {tappe.map((q) => {
          const fatta = q.numero <= superato;
          const qui = q.numero === attivo;
          return (
            <li key={q.numero} className={`pl-avanza__tappa ${fatta ? 'pl-avanza__tappa--fatta' : ''} ${qui ? 'pl-avanza__tappa--qui' : ''}`}>
              <span className="pl-avanza__numero">{fatta ? '✓' : q.numero}</span>
              {qui ? (
                <span className="pl-avanza__plinto">
                  <Plinto espressione="contento" dimensione={34} className="pl-plinto--vivo" />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* La riga leggibile a voce: l'elenco sopra e' decorativo, questa e' l'informazione. */}
      <p className="pl-avanza__conteggio">
        {t('quadri.avanzamento')
          .replace('{fatti}', numero(superatiTotali))
          .replace('{totale}', numero(totale))}
      </p>
      <div
        className="pl-avanza__barra"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totale}
        aria-valuenow={superatiTotali}
      >
        <div className="pl-avanza__riempimento" style={{ width: `${quota}%` }} />
      </div>
    </div>
  );
}
