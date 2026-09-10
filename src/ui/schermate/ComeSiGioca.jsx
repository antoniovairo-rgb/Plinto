import { Pagina } from './Pagina.jsx';
import { Pezzo } from '../Pezzo.jsx';
import { Bomba } from '../Bomba.jsx';
import { Plinto } from '../Plinto.jsx';
import { getShape } from '../../core/shapes.js';
import { REGOLE_INTRO } from '../../config/intro.js';
import { TOTALE_QUADRI } from '../../config/quadri.js';
import { CHAIN_MAX, CHAIN_STEP, INTRECCIO_STEP, CHAIN_GRACE , TINTA_SOGLIA, TINTA_PASSO } from '../../config/rules.js';

/**
 * "Come si gioca": le regole, rileggibili quando si vuole.
 *
 * La presentazione al primo avvio si vede UNA volta e poi sparisce per sempre. Va bene
 * che non torni — chi ha gia' giocato non deve rileggerla ogni volta — ma non che sia
 * IRRAGGIUNGIBILE: chi riapre il gioco dopo un mese, o chi lo passa a qualcun altro,
 * non aveva nessun posto dove guardare. Le uniche pagine esistenti parlavano di privacy
 * e di licenze.
 *
 * Qui c'e' piu' che nella presentazione, ed e' voluto. La presentazione deve far
 * cominciare a giocare in cinque secondi, quindi dice il minimo indispensabile; questa
 * pagina la si apre apposta, quindi puo' spiegare anche l'Intreccio, i due modi di
 * muovere e la tastiera — tre cose che finora non erano scritte da nessuna parte, e che
 * un giocatore non poteva scoprire se non per caso.
 *
 * Le regole della presentazione non sono ricopiate: arrivano dallo stesso REGOLE_INTRO,
 * quindi le due schermate non possono dire cose diverse. I numeri (moltiplicatori,
 * tolleranza della Catena) arrivano da config/rules.js per lo stesso motivo: un aiuto
 * che descrive regole diverse da quelle del gioco e' peggio di nessun aiuto.
 */
export function SchermoComeSiGioca({ onIndietro, t }) {
  // Due decimali come nella barra della Catena in partita: il numero scritto qui deve
  // essere scritto ESATTAMENTE come quello che il giocatore vede sullo schermo.
  const catenaMassima = (1 + CHAIN_STEP * CHAIN_MAX).toFixed(2);
  const intreccioTre = (1 + INTRECCIO_STEP * 2).toFixed(2);
  // Il giocatore conta le mosse a vuoto, non la "tolleranza": con tolleranza 1 la
  // Catena cala alla SECONDA mossa di fila senza eliminazioni.
  const mosseAVuoto = CHAIN_GRACE + 1;

  return (
    <Pagina titolo={t('aiuto.titolo')} onIndietro={onIndietro} t={t}>
      <div className="pl-aiuto__saluto">
        <Plinto espressione="contento" dimensione={64} className="pl-plinto--vivo" />
        <p className="pl-testo">{t('aiuto.intro')}</p>
      </div>

      {/* COM'E' FATTO IL GIOCO, e sta in cima di proposito.

          Questa pagina spiegava benissimo come si muovono i pezzi e non diceva da
          nessuna parte che il gioco sono cento livelli. Chi ne ha piu' bisogno e'
          proprio il giocatore che ha saltato la guida iniziale e non sa che il percorso
          esista: se la sezione stesse in fondo, sotto le bombe, non ci arriverebbe mai.
          Prima che cos'e' il gioco, poi come si gioca.

          I due paragrafi arrivano dalle stesse chiavi dell'ultimo passo della guida.
          Riscritti qui sarebbero due testi per la stessa cosa, destinati a divergere
          alla prima modifica -- ed e' anche il motivo per cui la guida NON si puo'
          riaprire da qui: sarebbe una seconda strada, piu' povera, verso quello che
          questa pagina dice gia' meglio. */}
      <h2 className="pl-sezione">{t('guida.percorsoTitolo')}</h2>
      <p className="pl-testo">{t('guida.percorso').replace('{n}', TOTALE_QUADRI)}</p>
      <p className="pl-testo">{t('guida.altreModalita')}</p>

      <h2 className="pl-sezione">{t('aiuto.baseTitolo')}</h2>
      <ol className="pl-intro__regole">
        {REGOLE_INTRO.map((chiave, i) => (
          <li key={chiave}>
            <span className="pl-intro__numero">{i + 1}</span>
            <span>{t(`intro.${chiave}`)}</span>
          </li>
        ))}
      </ol>

      <div className="pl-intro__esempio" aria-hidden="true">
        <Pezzo shape={getShape('a5ne')} color={4} cella={17} />
        <span className="pl-intro__piu">+</span>
        <Pezzo shape={getShape('b22')} color={2} cella={17} />
        <span className="pl-intro__piu">=</span>
        <span className="pl-intro__risultato">{t('intro.esempio')}</span>
      </div>

      <h2 className="pl-sezione">{t('aiuto.muovereTitolo')}</h2>
      <p className="pl-testo">{t('aiuto.trascinare')}</p>
      <p className="pl-testo">{t('aiuto.dueTocchi')}</p>
      <p className="pl-testo">{t('aiuto.tastiera')}</p>

      {/* Qui i tre paragrafi stanno sotto UN titolo solo, quindi ognuno ha bisogno della
          sua etichetta. Nella guida a passi ogni meccanica ha gia' il titolo del passo,
          e ripetere la parola due righe piu' sotto la faceva sembrare un errore.
          L'etichetta viene dalle stesse chiavi che intitolano quei passi: scritta due
          volte, prima o poi sarebbero diventate due parole diverse per la stessa cosa. */}
      <h2 className="pl-sezione">{t('aiuto.punteggioTitolo')}</h2>
      <p className="pl-testo">
        <strong>{t('guida.intreccioTitolo')}</strong>{' — '}
        {t('aiuto.intreccio').replace('{n}', intreccioTre)}
      </p>
      <p className="pl-testo">
        <strong>{t('guida.catenaTitolo')}</strong>{' — '}
        {t('aiuto.catena').replace('{max}', catenaMassima).replace('{n}', mosseAVuoto)}
      </p>
      <p className="pl-testo">
        <strong>{t('guida.tintaTitolo')}</strong>{' — '}
        {t('aiuto.tinta', { soglia: TINTA_SOGLIA, massimo: Math.round(TINTA_PASSO * 5 * 100) })}
      </p>

      <h2 className="pl-sezione">{t('aiuto.bombeTitolo')}</h2>
      <div className="pl-aiuto__bomba">
        <span className="pl-intro__blocco-bomba">
          <span className="pl-blocco pl-blocco--5"><Bomba /></span>
        </span>
        <p className="pl-testo">{t('aiuto.bombe')}</p>
      </div>
      <p className="pl-testo">{t('aiuto.bombeCatena')}</p>

      <h2 className="pl-sezione">{t('aiuto.equitaTitolo')}</h2>
      <p className="pl-testo">{t('aiuto.equita')}</p>
      {/* L'anteprima non e' una modalita' da scegliere: e' parte di come funzionano i
          livelli, e chi legge le regole deve trovarci il perche' della differenza fra
          il percorso e la partita libera. */}
      <section className="pl-regole__blocco">
        <h2 className="pl-regole__titolo">{t('anteprima.titolo')}</h2>
        <p className="pl-testo">{t('anteprima.spiegazione')}</p>
        <p className="pl-nota">{t('anteprima.tasto')}</p>
      </section>

    </Pagina>
  );
}
