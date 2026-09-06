/**
 * Fine partita.
 *
 * Regole di questa schermata:
 *  - il pulsante per rigiocare e' il primo elemento raggiungibile dal pollice;
 *  - si dice CHIARAMENTE perche' la partita e' finita, cosi' il game over sembra
 *    una conseguenza e non un capriccio;
 *  - i numeri servono a farti dire "la prossima volta faccio meglio", non a
 *    farti sentire in colpa: nessun paragone con altri giocatori, nessun punteggio
 *    "che avresti potuto fare".
 */
function Riga({ etichetta, valore }) {
  return (
    <div className="q-fine__riga">
      <span>{etichetta}</span>
      <strong>{valore}</strong>
    </div>
  );
}

function durata(ms) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`;
}

export function SchermoFine({ riepilogo, record, nuoviRecord, onRigioca, onHome, t }) {
  const eRecord = nuoviRecord.includes('punteggio');
  return (
    <div className="q-screen q-fine">
      <div className="q-scroll">
        <p className="q-fine__titolo">{t('fine.titolo')}</p>
        <p className="q-fine__motivo">{t('fine.motivo')}</p>

        <div className={`q-fine__punteggio ${eRecord ? 'q-fine__punteggio--record' : ''}`}>
          <span className="q-hud__etichetta">{t('fine.punteggio')}</span>
          <span className="q-fine__numero">{riepilogo.score.toLocaleString('it-IT')}</span>
          {eRecord ? (
            <span className="q-fine__nastro">{t('fine.nuovoRecord')}</span>
          ) : (
            <span className="q-fine__precedente">
              {t('hud.record')} {record.best.toLocaleString('it-IT')}
            </span>
          )}
        </div>

        {nuoviRecord.includes('catena') ? (
          <p className="q-fine__extra">{t('fine.recordCatena')}</p>
        ) : null}
        {nuoviRecord.includes('mossa') ? (
          <p className="q-fine__extra">{t('fine.recordMossa')}</p>
        ) : null}

        <div className="q-fine__dettagli">
          <Riga etichetta={t('fine.mosse')} valore={riepilogo.moves} />
          <Riga etichetta={t('fine.gruppi')} valore={riepilogo.clearedGroups} />
          <Riga etichetta={t('fine.catenaMax')} valore={riepilogo.bestChain} />
          <Riga etichetta={t('fine.mossaMigliore')} valore={riepilogo.bestMovePoints} />
          {riepilogo.boardClears > 0 ? (
            <Riga etichetta={t('fine.griglieSvuotate')} valore={riepilogo.boardClears} />
          ) : null}
          <Riga etichetta={t('fine.durata')} valore={durata(riepilogo.durationMs)} />
        </div>
      </div>

      <div className="q-fine__azioni">
        <button type="button" className="q-btn q-btn--primario q-btn--largo" onClick={onRigioca}>
          {t('fine.rigioca')}
        </button>
        <button type="button" className="q-btn q-btn--fantasma q-btn--largo" onClick={onHome}>
          {t('fine.home')}
        </button>
      </div>
    </div>
  );
}
