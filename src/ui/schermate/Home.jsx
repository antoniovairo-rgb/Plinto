import { Logo } from '../Logo.jsx';
import { numero } from '../../i18n/formato.js';

/**
 * La home.
 *
 * L'ORDINE DI QUESTA SCHERMATA E' STATO SBAGLIATO, e vale la pena scrivere come.
 *
 * Il pulsante grande avviava la PARTITA LIBERA — il gioco senza fine, senza obiettivi —
 * mentre il percorso a livelli stava in un pulsante secondario piu' in basso. Un
 * giocatore ha aperto il gioco, ha premuto il pulsante grande, si e' trovato in una
 * partita senza obiettivo e ha detto: "gia' al primo livello non si capisce
 * l'obiettivo". Aveva ragione due volte: non era il livello 1, e non c'era modo di
 * accorgersene.
 *
 * La colpa non era della spiegazione dei livelli, che nel frattempo era stata scritta,
 * disegnata e testata: era di questa schermata, che non ci portava. Il pulsante piu'
 * grande dice al giocatore che cosa fa il gioco, e questo diceva la cosa sbagliata.
 *
 * Adesso il primo pulsante e' il LIVELLO a cui sei arrivato, che e' il percorso vero del
 * gioco — cento livelli con una mappa. La partita libera resta, e resta a un tocco, ma
 * come alternativa dichiarata invece che come modalita' predefinita non annunciata.
 */
export function SchermoHome({
  record, cePartitaSalvata, sfidaOggi, sfidaInCorso, quadriFatti, quadriTotali,
  livelloCorrente, versione,
  onGioca, onRiprendi, onSfida, onQuadri, onGiocaLivello, onVai, t,
}) {
  const progressoTesto = t('quadri.avanzamento')
    .replace('{fatti}', numero(quadriFatti))
    .replace('{totale}', numero(quadriTotali));
  const etichettaLibera = cePartitaSalvata ? t('home.riprendi') : t('home.partitaLibera');
  const recordTesto = record.best > 0 ? `${t('home.record')} ${numero(record.best)}` : '';
  const etichettaSfida = sfidaInCorso ? t('sfida.riprendi') : t('sfida.breve');
  const sfidaTesto = sfidaOggi.partite > 0 ? `${t('home.record')} ${numero(sfidaOggi.best)}` : '';

  return (
    <div className="pl-screen pl-home">
      <div className="pl-home__testata">
        <Logo />
        <p className="pl-home__claim">{t('gioco.claim')}</p>
      </div>

      <div className="pl-home__azioni">
        {/* Il percorso e' il gioco: sta nel pulsante grande, e dice a quale livello sei. */}
        <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onGiocaLivello}>
          {t('quadri.quadro').replace('{n}', livelloCorrente)}
        </button>

        {/* Questi pulsanti hanno due scritte, e senza aria-label il nome che arriva a
            un lettore di schermo e' la loro concatenazione: "Partita libera —". Non e'
            una frase, ed e' anche il motivo per cui i selettori delle prove nel browser
            diventavano fragili. L'etichetta esplicita risolve tutte e due le cose. */}
        <button
          type="button"
          className="pl-btn pl-btn--largo pl-sfida-avvio"
          onClick={onQuadri}
          aria-label={`${t('home.mappa')}, ${progressoTesto}`}
        >
          <span>{t('home.mappa')}</span>
          <span className="pl-sfida-avvio__esito">{progressoTesto}</span>
        </button>

        {/* La partita libera e' un'ALTRA modalita', e adesso lo dice. Il record che le
            sta accanto e' il suo, non un record generale del gioco. */}
        <button
          type="button"
          className="pl-btn pl-btn--largo pl-sfida-avvio"
          onClick={cePartitaSalvata ? onRiprendi : onGioca}
          aria-label={recordTesto ? `${etichettaLibera}, ${recordTesto}` : etichettaLibera}
        >
          <span>{etichettaLibera}</span>
          {/* Il numero da solo non direbbe di che cosa e' il record: la parola serve. */}
          <span className="pl-sfida-avvio__esito">{recordTesto || '—'}</span>
        </button>

        {cePartitaSalvata ? (
          <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onGioca}>
            {t('home.nuovaPartita')}
          </button>
        ) : null}

        <button
          type="button"
          className="pl-btn pl-btn--largo pl-sfida-avvio"
          onClick={onSfida}
          aria-label={sfidaTesto ? `${etichettaSfida}, ${sfidaTesto}` : etichettaSfida}
        >
          <span>{etichettaSfida}</span>
          <span className="pl-sfida-avvio__esito">{sfidaTesto || '—'}</span>
        </button>
      </div>

      <nav className="pl-home__menu">
        <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => onVai('aiuto')}>
          {t('aiuto.titolo')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => onVai('statistiche')}>
          {t('home.statistiche')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => onVai('impostazioni')}>
          {t('home.impostazioni')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => onVai('info')}>
          {t('home.info')}
        </button>
      </nav>

      {/* Versione in chiaro: serve a chi segnala un problema e a chi lo deve capire,
          per sapere quale build era sullo schermo. Stava solo dentro Info, cioe' dove
          nessuno la cerca proprio quando servirebbe. */}
      <p className="pl-home__versione">v{versione}</p>
    </div>
  );
}
