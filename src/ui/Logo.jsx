import { useId } from 'react';

/**
 * Marchio PLINTO: quattro tessere che compongono un quadrante 3x3 incompleto.
 * E' disegnato in SVG e non e' un font: resta identico su ogni dispositivo e non
 * richiede risorse esterne.
 *
 * Nella Torre ha le stesse finiture di public/icon.svg: blocchi come gemme (piu' chiari
 * in alto, piu' scuri in basso, con un riflesso e un alone del loro colore) e il quarto
 * riquadro tratteggiato in ottone. I colori vengono dai token, le sfumature da
 * `color-mix`: un solo posto da cambiare.
 *
 * `useId` perche' le sfumature hanno un id e il logo compare in piu' schermate: due
 * loghi con gli stessi id si ruberebbero i gradienti a vicenda.
 */
const TESSERE = [
  { x: 3, y: 3, colore: 'var(--pl-block-4)' },
  { x: 26, y: 3, colore: 'var(--pl-block-2)' },
  { x: 3, y: 26, colore: 'var(--pl-block-3)' },
];

export function Logo({ dimensione = 44 }) {
  const id = useId().replace(/:/g, '');
  return (
    <div className="pl-logo">
      <svg width={dimensione} height={dimensione} viewBox="0 0 48 48" role="img" aria-label="PLINTO">
        <defs>
          {TESSERE.map(({ colore }, i) => (
            <linearGradient key={i} id={`${id}g${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${colore} 55%, white)` }} />
              <stop offset="0.45" style={{ stopColor: colore }} />
              <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${colore} 75%, black)` }} />
            </linearGradient>
          ))}
          <linearGradient id={`${id}r`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="white" stopOpacity="0.55" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id={`${id}a`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
        </defs>
        {TESSERE.map(({ x, y, colore }, i) => (
          <g key={i}>
            <rect x={x} y={y} width="19" height="19" rx="5" style={{ fill: colore }} opacity="0.55" filter={`url(#${id}a)`} />
            <rect x={x} y={y} width="19" height="19" rx="5" fill={`url(#${id}g${i})`} />
            <rect x={x + 2.5} y={y + 1.5} width="14" height="6" rx="3" fill={`url(#${id}r)`} />
            <rect x={x + 0.6} y={y + 0.6} width="17.8" height="17.8" rx="4.4" fill="none" stroke="white" strokeOpacity="0.28" strokeWidth="1.2" />
          </g>
        ))}
        <rect
          x="26" y="26" width="19" height="19" rx="5"
          fill="none" stroke="var(--pl-ottone)" strokeWidth="2" strokeDasharray="4 3"
        />
      </svg>
      <span className="pl-logo__testo">PLINTO</span>
    </div>
  );
}
