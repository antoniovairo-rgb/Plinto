/**
 * PLINTO, il personaggio.
 *
 * E' un blocco di pietra squadrato che ha preso vita: la stessa forma che il giocatore
 * appoggia sulla plancia cento volte a partita. Non e' un animale ne' una faccina
 * generica, e' il pezzo del gioco. Cosi' il personaggio spiega il gioco anche da solo,
 * e non c'e' niente da giustificare quando qualcuno chiede "ma cosa c'entra".
 *
 * E' disegnato in SVG dentro il codice: nessun file, nessuna licenza da tracciare,
 * nessuna richiesta di rete, e i colori arrivano dai token del tema, quindi Plinto
 * cambia insieme al resto quando si passa al tema chiaro.
 *
 * Le espressioni servono a dire qualcosa, non a fare simpatia: `contento` a un Quadro
 * superato, `deluso` a uno fallito, `stupito` quando succede qualcosa di grosso.
 */
export function Plinto({ espressione = 'normale', dimensione = 72, className = '' }) {
  const occhi = {
    normale:  { rx: 5.4, ry: 6.2, pupillaY: 0, sopracciglia: null },
    contento: { rx: 5.4, ry: 3.2, pupillaY: -1, sopracciglia: null },
    deluso:   { rx: 5.0, ry: 5.6, pupillaY: 2, sopracciglia: 'giu' },
    stupito:  { rx: 6.6, ry: 7.4, pupillaY: 0, sopracciglia: 'su' },
    dorme:    { rx: 5.4, ry: 0.8, pupillaY: 0, sopracciglia: null },
  }[espressione] ?? {};

  const bocca = {
    normale:  'M 40 66 Q 50 72 60 66',
    contento: 'M 36 62 Q 50 78 64 62 Z',
    deluso:   'M 40 71 Q 50 63 60 71',
    stupito:  null,
    dorme:    'M 43 68 h 14',
  }[espressione];

  return (
    <svg
      className={`pl-plinto ${className}`}
      width={dimensione}
      height={dimensione}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Plinto"
    >
      {/* Ombra a terra: appoggia il personaggio invece di lasciarlo galleggiare. */}
      <ellipse cx="50" cy="92" rx="26" ry="4.5" fill="rgba(0,0,0,0.28)" />

      {/* Corpo: il blocco. Stesso raggio d'angolo dei pezzi sulla plancia. */}
      <rect x="16" y="20" width="68" height="68" rx="16" fill="var(--pl-brand)" />
      {/* Faccia leggermente incassata, come il rilievo dei blocchi. */}
      <rect x="16" y="20" width="68" height="10" rx="16" fill="rgba(255,255,255,0.30)" />
      <rect x="16" y="80" width="68" height="8" rx="14" fill="rgba(0,0,0,0.18)" />

      {/* Piedini: due tacche, quel tanto che basta a farlo stare in piedi. */}
      <rect x="28" y="86" width="14" height="7" rx="3.5" fill="var(--pl-brand-deep)" />
      <rect x="58" y="86" width="14" height="7" rx="3.5" fill="var(--pl-brand-deep)" />

      {/* Occhi */}
      {['38', '62'].map((cx, i) => (
        <g key={cx}>
          <ellipse cx={cx} cy="48" rx={occhi.rx} ry={occhi.ry} fill="#12151d" />
          {espressione !== 'dorme' ? (
            <circle cx={Number(cx) + 1.4} cy={46.4 + (occhi.pupillaY ?? 0)} r="1.7" fill="#fff" opacity="0.9" />
          ) : null}
          {occhi.sopracciglia ? (
            <path
              d={occhi.sopracciglia === 'giu'
                ? `M ${Number(cx) - 7} ${38 + i * 0} l 14 ${i === 0 ? 4 : -4}`
                : `M ${Number(cx) - 7} ${36 + (i === 0 ? 3 : 0)} l 14 ${i === 0 ? -3 : 3}`}
              stroke="#12151d"
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
          ) : null}
        </g>
      ))}

      {/* Bocca */}
      {bocca ? (
        <path
          d={bocca}
          stroke="#12151d"
          strokeWidth="3"
          strokeLinecap="round"
          fill={espressione === 'contento' ? '#12151d' : 'none'}
        />
      ) : (
        <ellipse cx="50" cy="68" rx="6" ry="7.5" fill="#12151d" />
      )}
    </svg>
  );
}
