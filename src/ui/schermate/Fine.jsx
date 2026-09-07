import { numero } from '../../i18n/formato.js';
import { Condividi } from '../Condividi.jsx';
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
    <div className="pl-fine__riga">
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
  riepilogo, record, nuoviRecord, modalita, esitoSfida, giornoSfida, onRigioca, onHome, t,
}) {
  const eSfida = modalita === 'sfida';
  // Nella Sfida del Giorno il confronto che conta e' con il proprio risultato di oggi,
  // non con il record di sempre: la partita e' un'altra e paragonarle sarebbe scorretto.
  const eRecord = eSfida
    ? Boolean(esitoSfida?.nuovoRecordDiGiornata)
    : nuoviRecord.includes('punteggio');
  useSuonoRecord(eRecord);
  return (
    <div className="pl-screen pl-fine">
      <div className="pl-scroll">
        <p className="pl-fine__titolo">{eSfida ? t('sfida.titolo') : t('fine.titolo')}</p>
        <p className="pl-fine__motivo">
          {eSfida ? t('sfida.spiegazione') : t('fine.motivo')}
        </p>

        <div className={`pl-fine__punteggio ${eRecord ? 'pl-fine__punteggio--record' : ''}`}>
          <span className="pl-hud__etichetta">{t('fine.punteggio')}</span>
          <span className="pl-fine__numero">{numero(riepilogo.score)}</span>
          {eRecord ? (
            <span className="pl-fine__nastro">
              {eSfida ? t('sfida.nuovoRecordOggi') : t('fine.nuovoRecord')}
            </span>
          ) : (
            <span className="pl-fine__precedente">
              {eSfida
                ? `${t('sfida.tuoRecordOggi')} ${(esitoSfida?.best ?? numero(0))}`
                : `${t('hud.record')} ${numero(record.best)}`}
            </span>
          )}
        </div>

        {!eSfida && nuoviRecord.includes('catena') ? (
          <p className="pl-fine__extra">{t('fine.recordCatena')}</p>
        ) : null}
        {!eSfida && nuoviRecord.includes('mossa') ? (
          <p className="pl-fine__extra">{t('fine.recordMossa')}</p>
        ) : null}

        <div className="pl-fine__dettagli">
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

        {/* La condivisione sta DENTRO l'area che scorre, sotto i numeri: e' una cosa che
            si sceglie di fare dopo aver guardato il risultato, non un'alternativa al
            pulsante per rigiocare. Quello resta il primo elemento sotto il pollice. */}
        <Condividi riepilogo={riepilogo} giorno={eSfida ? giornoSfida : null} t={t} />
      </div>

      <div className="pl-fine__azioni">
        <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onRigioca}>
          {t('fine.rigioca')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onHome}>
          {t('fine.home')}
        </button>
      </div>
    </div>
  );
}
