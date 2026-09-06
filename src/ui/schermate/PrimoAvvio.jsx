import { Logo } from '../Logo.jsx';
import { Pezzo } from '../Pezzo.jsx';
import { getShape } from '../../core/shapes.js';

/**
 * Presentazione al primo avvio.
 *
 * UNA schermata, tre righe, un pulsante. Non e' un tutorial guidato e non blocca
 * niente: si legge in cinque secondi e non torna mai piu'. Il brief chiede che il
 * giocatore possa aprire il gioco e giocare quasi subito, e un corso introduttivo
 * su un gioco che si capisce guardandolo sarebbe una tassa d'ingresso inutile.
 */
export function PrimoAvvio({ onInizia, t }) {
  return (
    <div className="q-screen q-intro">
      <div className="q-scroll">
        <div className="q-intro__testata"><Logo /></div>

        <ol className="q-intro__regole">
          <li>
            <span className="q-intro__numero">1</span>
            <span>{t('intro.uno')}</span>
          </li>
          <li>
            <span className="q-intro__numero">2</span>
            <span>{t('intro.due')}</span>
          </li>
          <li>
            <span className="q-intro__numero">3</span>
            <span>{t('intro.tre')}</span>
          </li>
        </ol>

        {/* Un esempio vale piu' di una spiegazione. I due pezzi mostrati chiudono
            DAVVERO un quadrante: 5 celle + 4 celle = le 9 di un 3x3. Un esempio che
            non torna insegnerebbe la regola sbagliata proprio a chi non la conosce. */}
        <div className="q-intro__esempio" aria-hidden="true">
          <Pezzo shape={getShape('a5ne')} color={4} cella={17} />
          <span className="q-intro__piu">+</span>
          <Pezzo shape={getShape('b22')} color={2} cella={17} />
          <span className="q-intro__piu">=</span>
          <span className="q-intro__risultato">{t('intro.esempio')}</span>
        </div>
      </div>

      <div className="q-intro__azioni">
        <button type="button" className="q-btn q-btn--primario q-btn--largo" onClick={onInizia}>
          {t('home.gioca')}
        </button>
      </div>
    </div>
  );
}
