import { Bomba } from './Bomba.jsx';

/**
 * La striscia con la terna successiva.
 *
 * SAGOME, NON COLORI. Il colore dei pezzi e' dichiaratamente estetico: non entra in
 * nessuna regola, e mostrarlo in anteprima suggerirebbe che conti qualcosa. Qui le forme
 * sono grigie -- si legge la geometria, che e' l'unica informazione utile.
 *
 * LA BOMBA INVECE SI VEDE. Quella non e' estetica: cambia cosa conviene fare, e nasconderla
 * in un'anteprima che promette di mostrare la terna sarebbe mostrarne solo la meta'
 * comoda.
 *
 * DIMENSIONE E POSIZIONE, NON OPACITA'. Un'anteprima sbiadita e' la via piu' rapida per
 * far fallire `npm run contrasti`: se e' informazione, sta sopra AA come tutto il resto.
 * Si distingue dalla mano vera perche' e' piu' piccola e sta da un'altra parte.
 */

/** Una sagoma: la forma disegnata su una griglietta grande quanto il suo ingombro. */
function Sagoma({ pezzo }) {
  if (!pezzo) return null;
  const { cells, width, height } = pezzo.shape;
  const piene = new Set(cells.map(([r, c]) => `${r},${c}`));
  const bombe = new Set(pezzo.bombe ?? []);

  return (
    <div
      className="pl-anteprima__pezzo"
      style={{ gridTemplateColumns: `repeat(${width}, 1fr)`, gridTemplateRows: `repeat(${height}, 1fr)` }}
    >
      {Array.from({ length: height }, (_, r) => (
        Array.from({ length: width }, (_, c) => {
          const indice = cells.findIndex(([cr, cc]) => cr === r && cc === c);
          if (!piene.has(`${r},${c}`)) {
            return <span key={`${r}-${c}`} className="pl-anteprima__vuoto" />;
          }
          return (
            <span key={`${r}-${c}`} className="pl-anteprima__cella">
              {bombe.has(indice) ? <Bomba /> : null}
            </span>
          );
        })
      ))}
    </div>
  );
}

/** Descrive la terna a parole, per chi non la guarda. */
function descrizione(mano, t) {
  if (!mano) return t('anteprima.nessuna');
  const pezzi = mano.filter(Boolean).map((p) => {
    const forma = `${p.shape.height}×${p.shape.width}`;
    return (p.bombe ?? []).length > 0 ? `${forma} ${t('anteprima.conBomba')}` : forma;
  });
  return `${t('anteprima.titolo')}: ${pezzi.join(', ')}`;
}

export function AnteprimaTerna({ mano, t }) {
  return (
    <section
      className="pl-anteprima"
      // Il fuoco NON entra nel ciclo di Tab della scelta del pezzo: quel ciclo serve a
      // giocare, e allungarlo con elementi che non si possono appoggiare renderebbe il
      // gioco da tastiera piu' lento a ogni singola mossa. Ci si arriva con il tasto P.
      tabIndex={-1}
      id="pl-anteprima"
      aria-label={t('anteprima.titolo')}
    >
      <span className="pl-anteprima__etichetta">{t('anteprima.titolo')}</span>
      <div className="pl-anteprima__pezzi" aria-hidden="true">
        {(mano ?? []).map((pezzo) => <Sagoma key={pezzo?.uid ?? Math.random()} pezzo={pezzo} />)}
      </div>
      {/* L'annuncio esiste come testo, ma NON e' una regione che parla da sola: un
          annuncio automatico a ogni mossa renderebbe la partita illeggibile a chi
          ascolta. Si legge quando ci si arriva, e basta. */}
      <p className="pl-sr">{descrizione(mano, t)}</p>
    </section>
  );
}
