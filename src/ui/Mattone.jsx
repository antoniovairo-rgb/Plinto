/**
 * Il disegno del mattone rinforzato dell'Arena: un muro di mattoncini sul colore del
 * blocco, e una crepa quando e' gia' stato colpito una volta.
 *
 * Le righe della malta dicono «mattone» anche a chi non distingue i colori; la crepa dice
 * «ancora un colpo». Il fondo colorato lo da' la classe del blocco (`pl-blocco--<colore>`)
 * di chi lo contiene, come per la bomba. Scelto fra cinque proposte il 4 ottobre 2026.
 */
export function Mattone({ incrinato = false }) {
  return (
    <svg className="pl-mattone__segni" viewBox="0 0 20 20" aria-hidden="true">
      <path className="pl-mattone__malta" d="M1 7 H19 M1 13 H19 M7 1 V7 M14 7 V13 M7 13 V19" />
      {incrinato ? <path className="pl-mattone__crepa" d="M5 2.5 L8.5 8 L6.5 11.5 L11 17.5" /> : null}
    </svg>
  );
}
