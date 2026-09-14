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
 * superato, `incoraggia` a uno fallito, `stupito` quando succede qualcosa di grosso.
 *
 * PERCHE' A UN LIVELLO FALLITO NON C'E' PIU' `deluso`. C'era, e visto sul telefono al
 * livello 65 era quello che era: sopracciglia a V e bocca all'ingiu', cioe' un personaggio
 * arrabbiato CON il giocatore nel momento in cui ha appena perso. La domanda che il
 * progetto si fa da sempre e' "quando perdi, ti sembra colpa tua?": una faccia cosi'
 * rispondeva di si'.
 * `incoraggia` guarda il giocatore, non il fallimento: sopracciglia distese e un
 * sorriso aperto, non il ghigno pieno della vittoria. `deluso` resta nel vocabolario
 * perche' un giorno potrebbe servire a dire un'altra cosa, non questa.
 */
/**
 * Il sopracciglio: e' quasi tutto quello che decide l'umore di una faccia disegnata.
 *   giu    a V, con l'estremo interno piu' basso: rabbia o delusione.
 *   su     sollevato, con l'estremo interno piu' alto: sorpresa.
 *   dolce  un arco morbido e simmetrico, un po' alzato: attenzione benevola.
 * `i` e' 0 per l'occhio sinistro e 1 per il destro: le forme asimmetriche si specchiano.
 */
function sopracciglio(tipo, cx, i) {
  const x = cx - 7;
  if (tipo === 'giu') return `M ${x} 38 l 14 ${i === 0 ? 4 : -4}`;
  if (tipo === 'su') return `M ${x} ${36 + (i === 0 ? 3 : 0)} l 14 ${i === 0 ? -3 : 3}`;
  return `M ${x} 37.5 q 7 -3.5 14 0`;
}

export function Plinto({ espressione = 'normale', dimensione = 72, className = '' }) {
  const occhi = {
    normale:  { rx: 5.4, ry: 6.2, pupillaY: 0, sopracciglia: null },
    contento: { rx: 5.4, ry: 3.2, pupillaY: -1, sopracciglia: null },
    deluso:   { rx: 5.0, ry: 5.6, pupillaY: 2, sopracciglia: 'giu' },
    incoraggia: { rx: 5.4, ry: 6.0, pupillaY: -0.6, sopracciglia: 'dolce' },
    stupito:  { rx: 6.6, ry: 7.4, pupillaY: 0, sopracciglia: 'su' },
    dorme:    { rx: 5.4, ry: 0.8, pupillaY: 0, sopracciglia: null },
  }[espressione] ?? {};

  const bocca = {
    normale:  'M 40 66 Q 50 72 60 66',
    contento: 'M 36 62 Q 50 78 64 62 Z',
    deluso:   'M 40 71 Q 50 63 60 71',
    // Aperto e sincero, ma non riempito: il sorriso pieno e' della vittoria.
    incoraggia: 'M 39 65 Q 50 76 61 65',
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
              d={sopracciglio(occhi.sopracciglia, Number(cx), i)}
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
