import { useState } from 'react';
import { Logo } from '../Logo.jsx';
import { Pezzo } from '../Pezzo.jsx';
import { getShape } from '../../core/shapes.js';
import { Plinto } from '../Plinto.jsx';
import { Bomba } from '../Bomba.jsx';
import { MiniGriglia } from '../MiniGriglia.jsx';
import { REGOLE_INTRO, PASSI_GUIDA } from '../../config/intro.js';
import { CHAIN_MAX, INTRECCIO_STEP, CHAIN_GRACE, TINTA_SOGLIA, GRID_SIZE } from '../../config/rules.js';
import { chainMultiplier, fattoreTinta } from '../../core/scoring.js';
import { OGNI_LIVELLI } from '../../persistence/attrezzi.js';
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
/**
 * Il gradino a cui la barra disegnata e' ferma: cinque su nove, cioe' poco piu' di
 * meta'. Un disegno con la barra vuota non direbbe niente, uno con la barra piena
 * direbbe che il massimo si raggiunge sempre.
 */
const GRADINO_MOSTRATO = 5;

export function PrimoAvvio({ onInizia, onSaltaPerOra, t }) {
  const [passo, setPasso] = useState(0);
  const nome = PASSI_GUIDA[passo];
  const ultimo = passo === PASSI_GUIDA.length - 1;

  // Gli stessi numeri di "Come si gioca", presi dalla stessa fonte e scritti nello
  // stesso formato con cui compaiono sulla barra durante la partita.
  // I due estremi della Catena, chiesti alla funzione che li calcola davvero e scritti
  // nello stesso formato della barra: il giocatore deve riconoscerli, non convertirli.
  const catenaBase = chainMultiplier(0).toFixed(2);
  const catenaMassima = chainMultiplier(CHAIN_MAX).toFixed(2);
  const intreccioTre = (1 + INTRECCIO_STEP * 2).toFixed(2);
  const mosseAVuoto = CHAIN_GRACE + 1;
  // Lo stesso numero dell'aiuto, e dalla stessa fonte: la funzione che assegna i punti.
  // Erano due formule scritte a mano in due file, ed e' bastato un cambio di taratura
  // perche' una delle due mentisse.
  const tintaMassima = Math.round(fattoreTinta(GRID_SIZE) * 100);

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
              {t('aiuto.catena').replace('{base}', catenaBase).replace('{max}', catenaMassima).replace('{n}', mosseAVuoto)}
            </p>
            {/* La barra disegnata e' la stessa che si vede in partita, ferma a meta':
                serve a farla riconoscere dopo, non a spiegarla di nuovo.

                CON L'ETICHETTA E IL MOLTIPLICATORE, che prima non c'erano: una barra
                gialla e basta non somiglia a niente, e il testo parla della "barra" senza
                che si capisca quale. In partita quella riga e' "CATENA ---- x1.00", e
                riconoscerla e' tutto il lavoro che questo disegno deve fare. Il numero
                mostrato e' quello del gradino a cui la barra e' ferma, chiesto alla
                stessa funzione del gioco: un disegno che mostrasse un moltiplicatore
                impossibile insegnerebbe una regola falsa. */}
            <div className="pl-guida__catena" aria-hidden="true">
              <span className="pl-hud__etichetta">{t('hud.catena')}</span>
              <div className="pl-guida__barra">
                <div className="pl-guida__riempimento" style={{ width: `${(GRADINO_MOSTRATO / CHAIN_MAX) * 100}%` }} />
              </div>
              <span className="pl-guida__catena-valore">&times;{chainMultiplier(GRADINO_MOSTRATO).toFixed(2)}</span>
            </div>
          </>
        ) : null}

        {nome === 'intreccio' ? (
          <>
            <h2 className="pl-sezione">{t('guida.intreccioTitolo')}</h2>
            <p className="pl-testo">{t('aiuto.intreccio').replace('{n}', intreccioTre)}</p>
            {/* ERA L'UNICO PASSO SENZA DISEGNO, ed era anche il piu' astratto.
                Gli altri cinque mostrano la cosa di cui parlano -- i due pezzi che
                chiudono un quadrante, la barra della Catena, le sette caselle uguali, la
                bomba e il suo scoppio -- e questo chiedeva di immaginare "due gruppi
                chiusi con una mossa sola" a chi non ha ancora mai chiuso un gruppo.
                Il disegno e' lo STESSO che spiega l'Intreccio nell'apertura dei livelli:
                una riga e una colonna che si incrociano, cioe' il posto dove la mossa si
                trova davvero. */}
            <div className="pl-guida__disegno" aria-hidden="true">
              <MiniGriglia tipo="intreccio" />
            </div>
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
            <p className="pl-testo">{t('guida.percorso').replace('{n}', TOTALE_QUADRI).replace('{attrezziOgni}', OGNI_LIVELLI)}</p>
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
