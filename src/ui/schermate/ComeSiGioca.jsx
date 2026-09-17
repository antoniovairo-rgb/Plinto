import { Pagina } from './Pagina.jsx';
import { Pezzo } from '../Pezzo.jsx';
import { Bomba } from '../Bomba.jsx';
import { Plinto } from '../Plinto.jsx';
import { getShape } from '../../core/shapes.js';
import { REGOLE_INTRO } from '../../config/intro.js';
import { TOTALE_QUADRI } from '../../config/quadri.js';
import {
  CHAIN_MAX, INTRECCIO_STEP, CHAIN_GRACE, TINTA_SOGLIA,
  ESPLOSIONE_SOGLIA, PUNTI_CELLA_ESPLOSA, GRID_SIZE,
} from '../../config/rules.js';
import { chainMultiplier, fattoreEsplosione, fattoreTinta } from '../../core/scoring.js';
import { ATTREZZI, OGNI_LIVELLI, MASSIMO as ATTREZZI_MASSIMO } from '../../persistence/attrezzi.js';

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
  // I due estremi della Catena, chiesti alla funzione che li calcola davvero e scritti
  // nello stesso formato della barra: il giocatore deve riconoscerli, non convertirli.
  const catenaBase = chainMultiplier(0).toFixed(2);
  const catenaMassima = chainMultiplier(CHAIN_MAX).toFixed(2);
  const intreccioTre = (1 + INTRECCIO_STEP * 2).toFixed(2);
  // Il giocatore conta le mosse a vuoto, non la "tolleranza": con tolleranza 1 la
  // Catena cala alla SECONDA mossa di fila senza eliminazioni.
  const mosseAVuoto = CHAIN_GRACE + 1;
  /*
   * I DUE NUMERI DELLA TINTA E DELLE ESPLOSIONI LI CHIEDE AL MOTORE, non li ricalcola.
   *
   * Qui c'era una formula scritta a mano -- `TINTA_PASSO * 5 * 100` -- che valeva finche'
   * la soglia era 5. Cambiata la taratura nella 1.15.0, questa pagina ha continuato a
   * dire "+100%" mentre il gioco ne pagava 60: un aiuto che descrive regole diverse da
   * quelle del gioco e' peggio di nessun aiuto, ed e' esattamente la cosa che questo
   * file dichiarava in cima di voler evitare. La formula stava in DUE posti (anche nella
   * guida al primo avvio) e ne e' invecchiato uno solo, che e' il modo in cui questi
   * errori capitano sempre.
   *
   * Adesso la fonte e' una sola: la funzione che assegna i punti. Una prova confronta
   * questi numeri con quelli del motore e fallisce se qualcuno ritocca la taratura
   * senza riaprire l'aiuto.
   */
  const tintaMassima = Math.round(fattoreTinta(GRID_SIZE) * 100);
  /**
   * LA SOGLIA SI DICE COM'E', non spostata di uno.
   *
   * Qui si passava `ESPLOSIONE_SOGLIA + 1`, cioe' la prima esplosione premiata, e la
   * frase diceva "da 4 caselle in su vale il 25% in piu' per ogni cella oltre la
   * soglia": letta alla lettera, a quattro caselle il premio sarebbe zero, perche' di
   * caselle oltre quattro non ce n'e' nessuna. Il numero era giusto e la frase no.
   *
   * Adesso la frase dice "oltre le {soglia} caselle, ogni casella in piu' vale il
   * {premio}% in piu'", e la soglia e' quella vera: oltre tre, la quarta paga il 25%,
   * la quinta il 50%. E' esattamente la formula di `fattoreEsplosione`.
   */
  const esplosioneSoglia = ESPLOSIONE_SOGLIA;
  const esplosionePremio = Math.round((fattoreEsplosione(ESPLOSIONE_SOGLIA + 1) - 1) * 100);

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
      <p className="pl-testo">{t('guida.percorso').replace('{n}', TOTALE_QUADRI).replace('{attrezziOgni}', OGNI_LIVELLI)}</p>
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
      <p className="pl-testo">{t('aiuto.rimetti')}</p>

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
        {t('aiuto.catena').replace('{base}', catenaBase).replace('{max}', catenaMassima).replace('{n}', mosseAVuoto)}
      </p>
      <p className="pl-testo">
        <strong>{t('guida.tintaTitolo')}</strong>{' — '}
        {t('aiuto.tinta', { soglia: TINTA_SOGLIA, massimo: tintaMassima })}
      </p>

      <h2 className="pl-sezione">{t('aiuto.bombeTitolo')}</h2>
      <div className="pl-aiuto__bomba">
        <span className="pl-intro__blocco-bomba">
          <span className="pl-blocco pl-blocco--5"><Bomba /></span>
        </span>
        <p className="pl-testo">{t('aiuto.bombe')}</p>
      </div>
      <p className="pl-testo">{t('aiuto.bombeCatena')}</p>
      <p className="pl-testo">
        {t('aiuto.bombeGrandi', {
          soglia: esplosioneSoglia,
          premio: esplosionePremio,
          punti: PUNTI_CELLA_ESPLOSA,
        })}
      </p>

      {/* GLI ATTREZZI. Stanno qui e non solo nel pannello che si apre in partita: quel
          pannello lo trova chi ha gia' capito che esistono, e chi non lo ha ancora
          aperto non ha nessun posto dove leggere che cosa fa ognuno dei quattro. */}
      <h2 className="pl-sezione">{t('attrezzi.titolo')}</h2>
      <p className="pl-testo">
        {t('aiuto.attrezzi', { ogni: OGNI_LIVELLI, massimo: ATTREZZI_MASSIMO })}
      </p>
      <ul className="pl-aiuto__elenco">
        {ATTREZZI.map((nome) => (
          <li key={nome} className="pl-testo">
            <strong>{t(`attrezzi.${nome}`)}</strong>{' — '}{t(`attrezzi.${nome}Spiega`)}
          </li>
        ))}
      </ul>
      <p className="pl-testo">{t('aiuto.attrezziSfida')}</p>

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
