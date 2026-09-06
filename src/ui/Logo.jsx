/**
 * Marchio QUADRA: quattro tessere che compongono un quadrante 3x3 incompleto.
 * E' disegnato in SVG e non e' un font: resta identico su ogni dispositivo e non
 * richiede risorse esterne.
 */
export function Logo({ dimensione = 44 }) {
  return (
    <div className="q-logo">
      <svg width={dimensione} height={dimensione} viewBox="0 0 48 48" role="img" aria-label="QUADRA">
        <rect x="3" y="3" width="19" height="19" rx="5" fill="var(--q-block-4)" />
        <rect x="26" y="3" width="19" height="19" rx="5" fill="var(--q-block-2)" />
        <rect x="3" y="26" width="19" height="19" rx="5" fill="var(--q-block-3)" />
        <rect
          x="26" y="26" width="19" height="19" rx="5"
          fill="none" stroke="var(--q-line-strong)" strokeWidth="2" strokeDasharray="4 3"
        />
      </svg>
      <span className="q-logo__testo">QUADRA</span>
    </div>
  );
}
