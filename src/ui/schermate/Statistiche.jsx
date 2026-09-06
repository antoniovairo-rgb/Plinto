import { Pagina, Voce } from './Pagina.jsx';

function tempo(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`;
}

/**
 * Statistiche personali. Sono l'unica progressione del gioco: nessun livello,
 * nessuna valuta, nessuna ricompensa a tempo. Si torna per battere se stessi.
 */
export function SchermoStatistiche({ record, stats, onIndietro, t }) {
  const vuoto = stats.partite === 0;
  return (
    <Pagina titolo={t('stats.titolo')} onIndietro={onIndietro} t={t}>
      {vuoto ? (
        <p className="q-vuoto">{t('stats.vuoto')}</p>
      ) : (
        <div className="q-lista">
          <Voce etichetta={t('stats.migliore')} valore={record.best.toLocaleString('it-IT')} />
          <Voce etichetta={t('stats.partite')} valore={stats.partite} />
          <Voce
            etichetta={t('stats.mediaPunteggio')}
            valore={Math.round(stats.punteggioTotale / stats.partite).toLocaleString('it-IT')}
          />
          <Voce etichetta={t('stats.mosseTotali')} valore={stats.mosseTotali.toLocaleString('it-IT')} />
          <Voce etichetta={t('stats.gruppiTotali')} valore={stats.gruppiTotali.toLocaleString('it-IT')} />
          <Voce etichetta={t('stats.griglieSvuotate')} valore={stats.griglieSvuotate} />
          <Voce etichetta={t('stats.tempoTotale')} valore={tempo(stats.tempoTotaleMs)} />
          <Voce etichetta={t('stats.recordCatena')} valore={record.bestChain} />
          <Voce etichetta={t('stats.recordMossa')} valore={record.bestMove.toLocaleString('it-IT')} />
          <Voce etichetta={t('stats.recordIntreccio')} valore={record.bestGroupsInOneMove} />
        </div>
      )}
    </Pagina>
  );
}
