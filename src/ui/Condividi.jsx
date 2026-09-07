import { useState } from 'react';
import { formattaScheda } from '../core/scheda.js';
import { rottaSfida } from './rotta.js';

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

/** Dove vive il gioco. Serve a costruire il collegamento da mettere nella scheda. */
function indirizzoDelGioco(giorno) {
  try {
    const { origin, pathname } = window.location;
    const base = `${origin}${pathname}`.replace(/index\.html$/, '');
    return giorno ? `${base}${rottaSfida(giorno)}` : base;
  } catch {
    return '';
  }
}

export function Condividi({ riepilogo, giorno, t }) {
  const [esito, setEsito] = useState(null);   // null | 'condiviso' | 'copiato' | 'manuale'

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
        {t('scheda.condividi')}
      </button>

      {esito === 'copiato' ? <p className="pl-nota">{t('scheda.copiato')}</p> : null}
      {esito === 'condiviso' ? <p className="pl-nota">{t('scheda.condiviso')}</p> : null}
      {esito === 'manuale' ? <p className="pl-nota">{t('scheda.copiaAMano')}</p> : null}

      {/* Il testo e' sempre a schermo: e' la card, ed e' leggibile da chiunque. La riga
          di blocchi e' decorativa e viene nascosta a chi ascolta, perche' ripeterebbe
          in simboli quello che le righe sopra dicono a parole. */}
      <pre className="pl-scheda" aria-label={t('scheda.anteprima')}>
        {testo.split('\n').map((riga, i) => (
          /^[▁▂▃▄▅▆▇█]+$/u.test(riga)
            ? <span key={i} aria-hidden="true" className="pl-scheda__forma">{`${riga}\n`}</span>
            : <span key={i}>{`${riga}\n`}</span>
        ))}
      </pre>
    </div>
  );
}
