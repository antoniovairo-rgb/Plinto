import { Pagina, Voce } from './Pagina.jsx';
import { numero, data } from '../../i18n/formato.js';

function tempo(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
}

/**
 * Statistiche personali. Sono l'unica progressione del gioco: nessun livello,
 * nessuna valuta, nessuna ricompensa a tempo. Si torna per battere se stessi.
 */
export function SchermoStatistiche({ record, stats, storicoSfide = [], onIndietro, t }) {
  const vuoto = stats.partite === 0;
  return (
    <Pagina titolo={t('stats.titolo')} onIndietro={onIndietro} t={t}>
      {vuoto ? (
        <p className="pl-vuoto">{t('stats.vuoto')}</p>
      ) : (
        <div className="pl-lista">
          <Voce etichetta={t('stats.migliore')} valore={numero(record.best)} />
          <Voce etichetta={t('stats.partite')} valore={stats.partite} />
          <Voce
            etichetta={t('stats.mediaPunteggio')}
            valore={Math.round(stats.punteggioTotale / numero(stats.partite))}
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
