/**
 * Il disegno del masso della Torre: una pietra grigia puntinata.
 *
 * Sta in un componente suo, come la bomba, perche' lo stesso disegno compare sulla
 * plancia, nella presentazione dei livelli e nella pagina delle regole: tre copie a mano
 * finirebbero per raccontare tre massi diversi. Il fondo grigio lo da' la classe
 * `pl-blocco--masso` di chi lo contiene.
 *
 * ERA UNA CREPA, ed e' diventata una puntinatura il 4 ottobre 2026: la crepa serve al
 * mattone rinforzato incrinato dell'Arena, e due caselle con la crepa -- una che non
 * sparisce mai, una che sparisce al prossimo colpo -- direbbero la stessa cosa per due
 * regole opposte. I puntini sono tanti, piccoli e irregolari: con cinque puntini ordinati
 * la prima versione sembrava la faccia di un dado.
 */
const PUNTINI = [
  [4.2, 5.1, 0.9], [7.8, 3.6, 0.6], [11.4, 5.8, 1.1], [15.6, 3.9, 0.7], [5.6, 9.4, 0.6],
  [9.3, 9.9, 0.8], [14.2, 9.1, 1], [3.8, 13.8, 1.1], [8.1, 14.6, 0.7], [12.2, 13.4, 0.6],
  [16.1, 14.8, 0.9], [10.6, 17.1, 0.6],
];

export function Masso() {
  return (
    <svg className="pl-masso__segni" viewBox="0 0 20 20" aria-hidden="true">
      {PUNTINI.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)}
    </svg>
  );
}
