/**
 * Il disegno del masso della Torre: una crepa e una scheggia sulla pietra grigia.
 *
 * Sta in un componente suo, come la bomba, perche' lo stesso disegno compare sulla
 * plancia, nella presentazione dei livelli e nella pagina delle regole: tre copie a mano
 * finirebbero per raccontare tre massi diversi. Il fondo grigio lo da' la classe
 * `pl-blocco--masso` di chi lo contiene.
 */
export function Masso() {
  return (
    <svg className="pl-masso__segni" viewBox="0 0 20 20" aria-hidden="true">
      {/* Una crepa e una scheggia, irregolari: due segni simmetrici sembravano frecce. */}
      <path d="M6 4 L9 8 L7.5 11 L11 15.5" />
      <path d="M13.5 6 L15.5 9.5" />
    </svg>
  );
}
