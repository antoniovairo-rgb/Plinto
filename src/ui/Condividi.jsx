import { useState } from 'react';
import {
  formattaScheda, formattaSchedaQuadro, formattaSchedaPercorso, collegamentoScheda, RIGA_DISEGNATA,
} from '../core/scheda.js';
import { rottaSfida } from './rotta.js';
import { PLAY_URL } from '../config/progetto.js';

/**
 * Condividere il risultato.
 *
 * IL RIPIEGO NON E' FACOLTATIVO. `navigator.share` non c'e' ovunque: su desktop manca
 * quasi sempre, e anche dove c'e' puo' rifiutare una condivisione di solo testo. Un
 * pulsante che in quei casi non fa niente e' peggio di un pulsante che manca, perche'
 * chi lo tocca crede di aver condiviso. Quindi: si prova a condividere, e se non si puo'
 * si copia negli appunti, sempre con una conferma a schermo.
 *
 * E se NON SI PUO' NEMMENO COPIARE (permesso negato, contesto non sicuro) il testo resta
 * comunque visibile qui sotto, selezionabile a mano. Tre gradini, e l'ultimo non puo'
 * fallire perche' non chiede niente a nessuno.
 *
 * LA CARD E' TESTO, NON UN'IMMAGINE. Un'immagine peserebbe di piu', non sarebbe leggibile
 * da un lettore di schermo e non si potrebbe incollare in una chat come testo. Quello che
 * si vede qui e' esattamente quello che verra' condiviso.
 */

/**
 * Il collegamento da mettere in fondo alla scheda.
 *
 * DUE DESTINAZIONI DIVERSE, e la differenza non e' un dettaglio.
 *
 * Per la SFIDA DEL GIORNO e' sempre l'indirizzo del sito con il giorno nell'ancora:
 * quel collegamento serve a far giocare a chi lo riceve la STESSA identica partita, e
 * il giorno e' il dato che glielo permette. Nessun indirizzo del Play Store puo'
 * portarlo, quindi li' non si tocca.
 *
 * Per tutto il resto e' la scheda del Play Store, quando c'e': chi riceve un risultato
 * e ha voglia di provare deve poter INSTALLARE il gioco, non aprirlo una volta sola nel
 * browser e dimenticarselo. Se `PLAY_URL` e' vuota si ricade sul sito, che e' anche
 * quello che succede finche' la scheda del Play Store non e' pubblica.
 *
 * L'indirizzo del sito si legge da `window.location` e non da una costante, perche' il
 * gioco gira anche da una sottocartella e da un'applicazione installata: scritto a mano
 * sarebbe giusto in un posto solo.
 */
function indirizzoDelGioco(giorno) {
  let base = '';
  try {
    const { origin, pathname } = window.location;
    base = `${origin}${pathname}`.replace(/index\.html$/, '');
  } catch {
    // Un contesto senza `location` non deve far saltare la condivisione: resta il
    // collegamento allo store, che e' assoluto e non dipende da dove gira il gioco.
  }
  return collegamentoScheda({ base, giorno, play: PLAY_URL, ancora: rottaSfida });
}

/**
 * Il meccanismo: condividi, altrimenti copia, altrimenti mostra.
 *
 * Sta in un componente suo perche' i posti da cui si condivide sono diventati tre --
 * fine partita, fine livello, mappa dei livelli -- e la scala dei tre ripieghi deve
 * restare UNA. Tre copie della stessa logica vorrebbe dire che prima o poi due si
 * comportano diversamente, e il posto in cui accadrebbe per primo e' proprio il ramo
 * che quasi nessuno vede: quello di chi non puo' nemmeno copiare.
 *
 * L'ANTEPRIMA SI PUO' SPEGNERE, e in un posto sola lo e'. Di norma la scheda sta a
 * schermo prima ancora di toccare il pulsante: quello che si vede e' esattamente quello
 * che verra' condiviso, e non c'e' niente da scoprire dopo. Sulla mappa dei livelli
 * invece la scheda starebbe fra l'avanzamento e i cento livelli, spingendoli tutti piu'
 * giu' per mostrare un testo che nessuno ha ancora chiesto di vedere.
 *
 * Anche spenta, l'anteprima RIAPPARE quando serve davvero: se copiare non riesce, il
 * testo torna a schermo da solo. Il terzo gradino del ripiego non puo' dipendere da un
 * parametro, perche' e' l'unico che non ha altro sotto di se'.
 *
 * @param {string} testo      la scheda gia' composta
 * @param {string} etichetta  il testo del pulsante
 * @param {boolean} [anteprima] false per mostrare la scheda solo dopo l'azione
 */
export function CondividiTesto({ testo, etichetta, anteprima = true, t }) {
  const [esito, setEsito] = useState(null);   // null | 'condiviso' | 'copiato' | 'manuale'

  async function condividi() {
    try {
      if (navigator.share) {
        await navigator.share({ text: testo });
        setEsito('condiviso');
        return;
      }
    } catch (errore) {
      // L'utente che annulla la finestra di condivisione produce un'eccezione: non e'
      // un errore, e non deve mostrare niente. Si distingue dal nome.
      if (errore?.name === 'AbortError') return;
    }
    try {
      await navigator.clipboard.writeText(testo);
      setEsito('copiato');
    } catch {
      setEsito('manuale');
    }
  }

  return (
    <div className="pl-condividi">
      <button type="button" className="pl-btn pl-btn--largo" onClick={condividi}>
        {etichetta}
      </button>

      {esito === 'copiato' ? <p className="pl-nota">{t('scheda.copiato')}</p> : null}
      {esito === 'condiviso' ? <p className="pl-nota">{t('scheda.condiviso')}</p> : null}
      {esito === 'manuale' ? <p className="pl-nota">{t('scheda.copiaAMano')}</p> : null}

      {/* Il testo e' sempre a schermo: e' la card, ed e' leggibile da chiunque. Le righe
          di blocchi sono decorative e vengono nascoste a chi ascolta, perche' ripeterebbero
          in simboli quello che le righe sopra dicono a parole. */}
      {anteprima || esito !== null ? (
      <pre className="pl-scheda" aria-label={t('scheda.anteprima')}>
        {testo.split('\n').map((riga, i) => (
          RIGA_DISEGNATA.test(riga)
            ? <span key={i} aria-hidden="true" className="pl-scheda__forma">{`${riga}\n`}</span>
            : <span key={i}>{`${riga}\n`}</span>
        ))}
      </pre>
      ) : null}
    </div>
  );
}

export function Condividi({ riepilogo, giorno, t }) {
  const testo = formattaScheda(riepilogo, {
    giorno,
    indirizzo: indirizzoDelGioco(giorno),
    serie: riepilogo?.serieCatena,
    testi: {
      gioco: 'PLINTO',
      sfidaDel: t('scheda.sfidaDel'),
      partitaLibera: t('scheda.partitaLibera'),
      punti: t('scheda.punti'),
      mosse: t('scheda.mosse'),
      catenaMax: t('scheda.catenaMax'),
      intrecciMax: t('scheda.intrecciMax'),
      righe: t('scheda.righe'),
      colonne: t('scheda.colonne'),
      quadranti: t('scheda.quadranti'),
      mossaMigliore: t('scheda.mossaMigliore'),
      separatoreMigliaia: t('scheda.separatoreMigliaia'),
    },
  });

  return <CondividiTesto testo={testo} etichetta={t('scheda.condividi')} t={t} />;
}

/**
 * La scheda di un livello superato.
 *
 * L'obiettivo arriva gia' tradotto da chi chiama: la frase che lo descrive vive in
 * `Quadri.jsx` insieme alla schermata che la mostra, e duplicarla qui vorrebbe dire
 * due frasi per la stessa cosa, destinate a divergere alla prima modifica.
 */
export function CondividiQuadro({ numero, obiettivo, mosse, record, superati, totale, serie, t }) {
  const testo = formattaSchedaQuadro(
    { numero, obiettivo, mosse, record, superati, totale },
    {
      indirizzo: indirizzoDelGioco(null),
      serie,
      testi: {
        gioco: 'PLINTO',
        livello: t('scheda.livello'),
        superatoIn: t('scheda.superatoIn'),
        record: t('scheda.record'),
        percorso: t('scheda.percorso'),
      },
    },
  );
  return <CondividiTesto testo={testo} etichetta={t('scheda.condividiQuadro')} t={t} />;
}

/** La scheda dell'avanzamento sul percorso, presa dalla mappa. */
export function CondividiPercorso({ superati, totale, t }) {
  const testo = formattaSchedaPercorso(
    { superati, totale },
    {
      indirizzo: indirizzoDelGioco(null),
      testi: {
        gioco: 'PLINTO',
        percorsoTitolo: t('scheda.percorsoTitolo'),
        livelliSu: t('scheda.livelliSu'),
      },
    },
  );
  return (
    <CondividiTesto
      testo={testo}
      etichetta={t('scheda.condividiPercorso')}
      anteprima={false}
      t={t}
    />
  );
}
