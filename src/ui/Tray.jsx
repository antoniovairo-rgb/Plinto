import { useEffect, useRef, useState } from 'react';
import { Pezzo } from './Pezzo.jsx';

/** Larghezza massima di una forma del catalogo, in celle. Serve a dimensionare il tray. */
const CELLE_MAX = 5;

/**
 * I tre pezzi disponibili.
 *
 * La dimensione delle celle nel tray si adatta alla larghezza reale dello slot:
 * su un telefono stretto i pezzi restano interi invece di essere tagliati, e su
 * uno schermo largo non diventano francobolli.
 */
export function Tray({ mano, pezziMorti, selezionato, presoIndex, onPointerDownPezzo, onTapPezzo, t }) {
  const primoSlot = useRef(null);
  const [cella, setCella] = useState(18);

  useEffect(() => {
    const calcola = () => {
      const larghezza = primoSlot.current?.clientWidth ?? 100;
      const altezza = primoSlot.current?.clientHeight ?? 96;
      const perLarghezza = (larghezza - 16 - (CELLE_MAX - 1) * 2) / CELLE_MAX;
      const perAltezza = (altezza - 16 - (CELLE_MAX - 1) * 2) / CELLE_MAX;
      setCella(Math.max(11, Math.min(28, Math.floor(Math.min(perLarghezza, perAltezza)))));
    };
    calcola();
    window.addEventListener('resize', calcola);
    window.addEventListener('orientationchange', calcola);
    return () => {
      window.removeEventListener('resize', calcola);
      window.removeEventListener('orientationchange', calcola);
    };
  }, []);

  return (
    <div className="pl-tray">
      {mano.map((pezzo, i) => {
        const morto = pezziMorti.includes(i);
        const classi = ['pl-tray__posto'];
        if (!pezzo) classi.push('pl-tray__posto--vuoto');
        if (selezionato === i) classi.push('pl-tray__posto--selezionato');
        if (morto) classi.push('pl-tray__posto--morto');
        return (
          <div
            key={pezzo?.uid ?? `vuoto-${i}`}
            className={classi.join(' ')}
            ref={i === 0 ? primoSlot : null}
          >
            {pezzo ? (
              <button
                type="button"
                className="pl-pezzo-presa"
                onPointerDown={(e) => onPointerDownPezzo(e, i, cella)}
                onClick={() => onTapPezzo(i)}
                aria-label={
                  `${t('varie.pezzo').replace('{n}', i + 1).replace('{celle}', pezzo.shape.size)}`
                  + (morto ? `, ${t('varie.pezzoMorto')}` : '')
                }
                aria-pressed={selezionato === i}
              >
                <Pezzo
                  shape={pezzo.shape}
                  color={pezzo.color}
                  bombe={pezzo.bombe}
                  cella={cella}
                  className={presoIndex === i ? 'pl-pezzo--preso' : ''}
                />
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
