import { Pagina, Voce, Vuoto } from './Pagina.jsx';
import { numero, data } from '../../i18n/formato.js';

// D4 (collaudo 1.21.9): il punteggio medio divideva il totale per `numero(partite)`,
// che e' una STRINGA formattata per la lingua. Da 1000 partite in inglese «1,000» non e'
// un numero e la media diventava NaN; da 10 000 in italiano «10.000» vale 10 e la media
// usciva mille volte troppo alta. Con l'interruttore spento torna il calcolo vecchio:
// serve solo a far vedere rossa la prova (tests/statistiche-media.test.js, D4 in
// tests/e2e/correzioni.mjs).
export const MEDIA_VERA = true;

function tempo(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
}

/** Punteggio medio: il totale diviso per il numero di partite (libera e sfida insieme). */
export function mediaPunteggio(stats, mediaVera = MEDIA_VERA) {
  const divisore = mediaVera ? stats.partite : numero(stats.partite);
  return Math.round(stats.punteggioTotale / divisore);
}

/**
 * Statistiche personali. Sono l'unica progressione del gioco: nessun livello,
 * nessuna valuta, nessuna ricompensa a tempo. Si torna per battere se stessi.
 */
export function SchermoStatistiche({ record, recordSfida = null, stats, storicoSfide = [], onIndietro, onGioca, t }) {
  const vuoto = stats.partite === 0;
  return (
    <Pagina titolo={t('stats.titolo')} onIndietro={onIndietro} t={t}>
      {vuoto ? (
        <Vuoto testo={t('stats.vuoto')} invito={onGioca ? t('stats.vuotoInvito') : null} onInvito={onGioca} />
      ) : (
        <div className="pl-lista">
          <Voce etichetta={t('stats.migliore')} valore={numero(record.best)} />
          {/* Il record della Sfida e' un altro numero (B7): accanto, e con il suo nome. */}
          {recordSfida && recordSfida.best > 0 ? (
            <Voce etichetta={t('stats.recordSfida')} valore={numero(recordSfida.best)} />
          ) : null}
          <Voce etichetta={t('stats.partite')} valore={stats.partite} />
          <Voce
            etichetta={t('stats.mediaPunteggio')}
            valore={mediaPunteggio(stats)}
          />
          <Voce etichetta={t('stats.mosseTotali')} valore={numero(stats.mosseTotali)} />
          <Voce etichetta={t('stats.gruppiTotali')} valore={numero(stats.gruppiTotali)} />
          <Voce etichetta={t('stats.griglieSvuotate')} valore={stats.griglieSvuotate} />
          <Voce etichetta={t('stats.tempoTotale')} valore={tempo(stats.tempoTotaleMs)} />
          <Voce etichetta={t('stats.recordCatena')} valore={record.bestChain} />
          <Voce etichetta={t('stats.recordMossa')} valore={numero(record.bestMove)} />
          <Voce etichetta={t('stats.recordIntreccio')} valore={record.bestGroupsInOneMove} />
        </div>
      )}

      {storicoSfide.length > 0 ? (
        <>
          <h2 className="pl-sezione">{t('sfida.storico')}</h2>
          <div className="pl-lista">
            {storicoSfide.map(({ giorno, best, partite }) => (
              <Voce
                key={giorno}
                etichetta={data(giorno)}
                valore={`${numero(best)} (${partite})`}
              />
            ))}
          </div>
        </>
      ) : null}
    </Pagina>
  );
}
