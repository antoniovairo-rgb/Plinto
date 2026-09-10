import { useState } from 'react';
import { Logo } from '../Logo.jsx';
import { Pezzo } from '../Pezzo.jsx';
import { getShape } from '../../core/shapes.js';
import { Plinto } from '../Plinto.jsx';
import { Bomba } from '../Bomba.jsx';
import { REGOLE_INTRO, PASSI_GUIDA } from '../../config/intro.js';
import { CHAIN_MAX, CHAIN_STEP, INTRECCIO_STEP, CHAIN_GRACE, TINTA_SOGLIA, TINTA_PASSO } from '../../config/rules.js';
import { TOTALE_QUADRI } from '../../config/quadri.js';

/**
 * La guida al primo avvio.
 *
 * ERA UNA SCHERMATA SOLA, e il commento che stava qui diceva perche': "un corso
 * introduttivo su un gioco che si capisce guardandolo sarebbe una tassa d'ingresso
 * inutile". Il ragionamento non era sbagliato, era incompleto -- e i primi giocatori
 * veri lo hanno mostrato in due modi diversi.
 *
 * Uno: hanno creduto che PLINTO fosse solo la partita senza fine, e non si sono accorti
 * che esistessero cento livelli. Due: hanno dato per scontato che il colore contasse
 * qualcosa, cioe' hanno immaginato una regola che non c'era. Un gioco "che si capisce
 * guardandolo" viene capito, si', ma non e' detto che venga capito GIUSTO.
 *
 * Quindi sei passi, uno per volta, ognuno con una cosa sola da leggere.
 *
 * NON E' UNA TASSA, e la differenza sta tutta nei due pulsanti in basso. Chi vuole
 * giocare subito puo' saltarla per ora -- e la ritrova al prossimo avvio, perche' aver
 * fretta oggi non vuol dire non volerla mai -- oppure dire che non gliela si mostri
 * piu'. Sono due intenzioni diverse e meritano due pulsanti diversi: un solo "Salta"
 * costringerebbe a scegliere fra rileggere per sempre e rinunciare per sempre.
 *
 * I TESTI NON SONO SCRITTI QUI. Arrivano dalle stesse chiavi di "Come si gioca"
 * (`aiuto.*`) e dalle stesse costanti di `rules.js` da cui il gioco calcola davvero i
 * punti. Una guida che spiega regole diverse da quelle applicate e' peggio di nessuna
 * guida, e l'unico modo per impedirlo e' non avere due copie del testo.
 */
export function PrimoAvvio({ onInizia, onSaltaPerOra, t }) {
  const [passo, setPasso] = useState(0);
  const nome = PASSI_GUIDA[passo];
  const ultimo = passo === PASSI_GUIDA.length - 1;

  // Gli stessi numeri di "Come si gioca", presi dalla stessa fonte e scritti nello
  // stesso formato con cui compaiono sulla barra durante la partita.
  const catenaMassima = (1 + CHAIN_STEP * CHAIN_MAX).toFixed(2);
  const intreccioTre = (1 + INTRECCIO_STEP * 2).toFixed(2);
  const mosseAVuoto = CHAIN_GRACE + 1;
  const tintaMassima = Math.round(TINTA_PASSO * (9 - TINTA_SOGLIA + 1) * 100);

  return (
    <div className="pl-screen pl-intro pl-guida">
      <div className="pl-scroll">
        <div className="pl-intro__testata">
          <Plinto espressione="contento" dimensione={72} className="pl-plinto--vivo" />
          <Logo />
        </div>

        {/* Il conteggio dei passi si vede SEMPRE, prima del contenuto: chi apre un
            gioco per la prima volta deve sapere quanto dura la cosa che sta leggendo,
            altrimenti la salta per prudenza invece che per scelta. */}
        <p className="pl-guida__passo">
          {t('guida.passo').replace('{n}', passo + 1).replace('{totale}', PASSI_GUIDA.length)}
        </p>

        {nome === 'base' ? (
          <>
            <h2 className="pl-sezione">{t('aiuto.baseTitolo')}</h2>
            {/* Le regole vengono da REGOLE_INTRO e non sono scritte una per una: e' la
                stessa lista che gli script nel browser usano per sapere quante
                aspettarsene, quindi il numero non puo' scollarsi. */}
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
          </>
        ) : null}

        {nome === 'catena' ? (
          <>
            <h2 className="pl-sezione">{t('guida.catenaTitolo')}</h2>
            <p className="pl-testo">
              {t('aiuto.catena').replace('{max}', catenaMassima).replace('{n}', mosseAVuoto)}
            </p>
            {/* La barra disegnata e' la stessa che si vede in partita, ferma a meta':
                serve a farla riconoscere dopo, non a spiegarla di nuovo. */}
            <div className="pl-guida__barra" aria-hidden="true">
              <div className="pl-guida__riempimento" style={{ width: '55%' }} />
            </div>
          </>
        ) : null}

        {nome === 'intreccio' ? (
          <>
            <h2 className="pl-sezione">{t('guida.intreccioTitolo')}</h2>
            <p className="pl-testo">{t('aiuto.intreccio').replace('{n}', intreccioTre)}</p>
          </>
        ) : null}

        {nome === 'tinta' ? (
          <>
            <h2 className="pl-sezione">{t('guida.tintaTitolo')}</h2>
            <p className="pl-testo">
              {t('aiuto.tinta').replace('{soglia}', TINTA_SOGLIA).replace('{massimo}', tintaMassima)}
            </p>
            {/* Sette caselle su nove dello stesso colore: la maggioranza si vede, non si
                spiega. E' la regola che due giocatori su tre avevano immaginato prima
                che esistesse. */}
            <div className="pl-guida__tinta" aria-hidden="true">
              {[4, 4, 2, 4, 4, 4, 3, 4, 4].map((colore, i) => (
                <span key={i} className="pl-guida__cella">
                  <span className={`pl-blocco pl-blocco--${colore}`} />
                </span>
              ))}
            </div>
          </>
        ) : null}

        {nome === 'bomba' ? (
          <>
            <h2 className="pl-sezione">{t('aiuto.bombeTitolo')}</h2>
            <p className="pl-testo">{t('aiuto.bombe')}</p>
            {/* La bomba si mostra com'e' davvero -- il segno sul blocco -- accanto a
                cio' che fa: il quadrato 3x3 che porta via. Il disegno dice in un colpo
                quello che il testo dice a parole, ed e' quello che si ricorda. */}
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
          </>
        ) : null}

        {nome === 'percorso' ? (
          <>
            <h2 className="pl-sezione">{t('guida.percorsoTitolo')}</h2>
            <p className="pl-testo">{t('guida.percorso').replace('{n}', TOTALE_QUADRI)}</p>
            <p className="pl-testo">{t('guida.altreModalita')}</p>
          </>
        ) : null}
      </div>

      <div className="pl-intro__azioni">
        <div className="pl-guida__navigazione">
          {/* "Indietro" c'e' sempre, anche al primo passo dove non fa niente: un
              pulsante che compare e scompare sposta l'altro sotto il pollice fra un
              passo e il successivo, ed e' il modo piu' facile per far premere la cosa
              sbagliata. Al primo passo e' disabilitato, non assente. */}
          <button
            type="button"
            className="pl-btn pl-btn--fantasma"
            onClick={() => setPasso((p) => Math.max(0, p - 1))}
            disabled={passo === 0}
          >
            {t('guida.indietro')}
          </button>
          <button
            type="button"
            className="pl-btn pl-btn--primario pl-btn--largo"
            onClick={() => (ultimo ? onInizia() : setPasso((p) => p + 1))}
          >
            {ultimo ? t('home.gioca') : t('guida.avanti')}
          </button>
        </div>

        {/* Due intenzioni diverse, due pulsanti. "Per ora" ha fretta adesso; "mai piu'"
            ha deciso. Un solo "Salta" costringerebbe a scegliere fra rileggere la guida
            per sempre e rinunciarci per sempre, che non e' la domanda giusta. */}
        <p className="pl-guida__salta">
          <button type="button" className="pl-guida__link" onClick={onSaltaPerOra}>
            {t('guida.saltaPerOra')}
          </button>
          <span aria-hidden="true"> · </span>
          <button type="button" className="pl-guida__link" onClick={onInizia}>
            {t('guida.nonMostrare')}
          </button>
        </p>
      </div>
    </div>
  );
}
