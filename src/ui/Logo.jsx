/**
 * Marchio PLINTO: quattro tessere che compongono un quadrante 3x3 incompleto.
 * E' disegnato in SVG e non e' un font: resta identico su ogni dispositivo e non
 * richiede risorse esterne.
 */
export function Logo({ dimensione = 44 }) {
  return (
    <div className="pl-logo">
      <svg width={dimensione} height={dimensione} viewBox="0 0 48 48" role="img" aria-label="PLINTO">
        <rect x="3" y="3" width="19" height="19" rx="5" fill="var(--pl-block-4)" />
        <rect x="26" y="3" width="19" height="19" rx="5" fill="var(--pl-block-2)" />
        <rect x="3" y="26" width="19" height="19" rx="5" fill="var(--pl-block-3)" />
        <rect
          x="26" y="26" width="19" height="19" rx="5"
          fill="none" stroke="var(--pl-line-strong)" strokeWidth="2" strokeDasharray="4 3"
        />
      </svg>
      <span className="pl-logo__testo">PLINTO</span>
    </div>
  );
}
