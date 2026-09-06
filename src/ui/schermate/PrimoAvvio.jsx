import { Logo } from '../Logo.jsx';
import { Pezzo } from '../Pezzo.jsx';
import { getShape } from '../../core/shapes.js';
import { Plinto } from '../Plinto.jsx';
import { Bomba } from '../Bomba.jsx';
import { REGOLE_INTRO } from '../../config/intro.js';

/**
 * Presentazione al primo avvio.
 *
 * UNA schermata, un pulsante. Non e' un tutorial guidato e non blocca niente: si legge
 * in pochi secondi. Il brief chiede che il giocatore possa aprire il gioco e giocare
 * quasi subito, e un corso introduttivo su un gioco che si capisce guardandolo sarebbe
 * una tassa d'ingresso inutile.
 *
 * Le righe erano tre e sono diventate quattro. La quarta e' la BOMBA, e la sua assenza
 * era un difetto vero: la bomba e' l'unica cosa del gioco che cambia l'esito di una
 * mossa senza che si possa dedurla guardando: un blocco appoggiato si comporta come
 * tutti gli altri finche' non lo elimini, e a quel punto ne porta via altri otto. Chi
 * non lo sa in anticipo non lo impara osservando: gli succede e basta. Tutto il resto
 * -- righe, colonne, quadranti, Catena -- si vede accadere ed e' spiegabile dopo; la
 * bomba no, e per questo va spiegata prima.
 */
export function PrimoAvvio({ onInizia, t }) {
  return (
    <div className="pl-screen pl-intro">
      <div className="pl-scroll">
        <div className="pl-intro__testata">
          <Plinto espressione="contento" dimensione={84} className="pl-plinto--vivo" />
          <Logo />
        </div>

        {/* Le regole vengono da REGOLE_INTRO e non sono scritte una per una: e' la
            stessa lista che i due script nel browser usano per sapere quante
            aspettarsene, quindi il numero non puo' piu' scollarsi. */}
        <ol className="pl-intro__regole">
          {REGOLE_INTRO.map((chiave, i) => (
            <li key={chiave}>
              <span className="pl-intro__numero">{i + 1}</span>
              <span>{t(`intro.${chiave}`)}</span>
            </li>
          ))}
        </ol>

        {/* Un esempio vale piu' di una spiegazione. I due pezzi mostrati chiudono
            DAVVERO un quadrante: 5 celle + 4 celle = le 9 di un 3x3. Un esempio che
            non torna insegnerebbe la regola sbagliata proprio a chi non la conosce. */}
        <div className="pl-intro__esempio" aria-hidden="true">
          <Pezzo shape={getShape('a5ne')} color={4} cella={17} />
          <span className="pl-intro__piu">+</span>
          <Pezzo shape={getShape('b22')} color={2} cella={17} />
          <span className="pl-intro__piu">=</span>
          <span className="pl-intro__risultato">{t('intro.esempio')}</span>
        </div>

        {/* La bomba si mostra com'e' davvero -- il segno sul blocco -- accanto a cio'
            che fa: il quadrato 3x3 che porta via. Il disegno dice in un colpo quello
            che la riga 4 dice a parole, ed e' quello che si ricorda. */}
        <div className="pl-intro__esempio pl-intro__bomba" aria-hidden="true">
          <span className="pl-intro__blocco-bomba">
            <span className="pl-blocco pl-blocco--5"><Bomba /></span>
          </span>
          <span className="pl-intro__piu">=</span>
          <span className="pl-intro__scoppio">
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} className={`pl-intro__scheggia ${i === 4 ? 'pl-intro__scheggia--centro' : ''}`} />
            ))}
          </span>
          <span className="pl-intro__risultato">{t('intro.esempioBomba')}</span>
        </div>
      </div>

      <div className="pl-intro__azioni">
        <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onInizia}>
          {t('home.gioca')}
        </button>
      </div>
    </div>
  );
}
