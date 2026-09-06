import { numero } from '../../i18n/formato.js';
import { suonoRecord } from '../../audio/suoni.js';
import { useEffect } from 'react';
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
/**
 * Il suono del nuovo record esisteva in src/audio/suoni.js ed era pure importato,
 * ma non veniva mai eseguito: a schermo compariva il nastro "Nuovo record" e non si
 * sentiva niente. E' il momento piu' bello di una partita ed era muto.
 */
function useSuonoRecord(attivo) {
  useEffect(() => { if (attivo) suonoRecord(); }, [attivo]);
}

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

export function SchermoFine({
  riepilogo, record, nuoviRecord, modalita, esitoSfida, onRigioca, onHome, t,
}) {
  const eSfida = modalita === 'sfida';
  // Nella Sfida del Giorno il confronto che conta e' con il proprio risultato di oggi,
  // non con il record di sempre: la partita e' un'altra e paragonarle sarebbe scorretto.
  const eRecord = eSfida
    ? Boolean(esitoSfida?.nuovoRecordDiGiornata)
    : nuoviRecord.includes('punteggio');
  useSuonoRecord(eRecord);
  return (
    <div className="q-screen q-fine">
      <div className="q-scroll">
        <p className="q-fine__titolo">{eSfida ? t('sfida.titolo') : t('fine.titolo')}</p>
        <p className="q-fine__motivo">
          {eSfida ? t('sfida.spiegazione') : t('fine.motivo')}
        </p>

        <div className={`q-fine__punteggio ${eRecord ? 'q-fine__punteggio--record' : ''}`}>
          <span className="q-hud__etichetta">{t('fine.punteggio')}</span>
          <span className="q-fine__numero">{numero(riepilogo.score)}</span>
          {eRecord ? (
            <span className="q-fine__nastro">
              {eSfida ? t('sfida.nuovoRecordOggi') : t('fine.nuovoRecord')}
            </span>
          ) : (
            <span className="q-fine__precedente">
              {eSfida
                ? `${t('sfida.tuoRecordOggi')} ${(esitoSfida?.best ?? numero(0))}`
                : `${t('hud.record')} ${numero(record.best)}`}
            </span>
          )}
        </div>

        {!eSfida && nuoviRecord.includes('catena') ? (
          <p className="q-fine__extra">{t('fine.recordCatena')}</p>
        ) : null}
        {!eSfida && nuoviRecord.includes('mossa') ? (
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
          {eSfida && esitoSfida ? (
            <Riga etichetta={t('sfida.tentativi')} valore={esitoSfida.partite} />
          ) : null}
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
