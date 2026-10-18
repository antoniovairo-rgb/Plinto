import { Logo } from '../Logo.jsx';
import { numero } from '../../i18n/formato.js';
import {
  IconaAiuto, IconaStatistiche, IconaProfilo, IconaImpostazioni, IconaInfo,
} from '../IconeMenu.jsx';
import { Installa, VoceScaricaApp } from '../Installa.jsx';
import { VoceRecensione } from '../Recensisci.jsx';
import { CONTATTO } from '../../config/progetto.js';
import { IconaCaffe, IconaIdea } from '../IconePie.jsx';

/**
 * Interruttore della riga che spiega le due modalita' (PO-009).
 *
 * Il PO: «nella home non si capisce bene la distinzione tra partita libera e sfida del
 * giorno, si confonde il player». Le due card avevano il nome e lo stato, e nient'altro
 * che dicesse in che cosa sono diverse. Acceso, sotto il nome c'e' una riga fissa che lo
 * dice; spento, la home torna quella della 1.21.9. `npm run home-spiegazione` e' rosso
 * da spento.
 */
const SPIEGAZIONE_MODI = true;

/**
 * Interruttore PO-010: le card hanno un NOME FISSO, e lo stato sta a destra.
 *
 * Il PO, dal telefono: «Non si capisce il riprendeli partita, che cosa riprende...
 * confonde». Con una partita libera in corso la card verde cambiava nome e diventava
 * «Riprendi la partita · Record 1836»: il nome della modalita' spariva proprio quando
 * c'erano due cose da riprendere (la libera e un livello), e niente diceva quale. Lo
 * stesso per la Sfida («Riprendi la sfida · In corso», F2 di PO-004). Decisione del PO
 * (docs/DECISIONI.md, 2026-10-18, «Nome fisso + stato»): il nome resta «Partita libera»
 * e «Sfida del giorno»; con una partita in corso a destra c'e' «Riprendi ›» al posto del
 * record (che resta in Statistiche), e sotto la libera torna il collegamento, che si
 * chiama «Nuova partita libera» perche' dica anche lui di quale partita parla.
 * Spento, le card cambiano nome come nella 1.21.10 e il collegamento non c'e' (come F1):
 * `npm run home-spiegazione` e' rosso.
 */
const NOME_FISSO_E_STATO = true;

/**
 * Interruttore PO-010, impaginazione: la home bassa si stringe per far posto a «Nuova
 * partita libera».
 *
 * A 360x640 la home avanzava di 2 px (misura in docs/sviluppo/RAPPORTO-F1-F3.md): il
 * collegamento, anche piccolo (28 px), la farebbe scorrere. I pixel si prendono dai
 * respiri e dai pulsanti secondari, solo sotto i 680 px di altezza in verticale, e in
 * TUTTI gli stati, non solo quando il collegamento c'e': una home che cambia ritmo a
 * seconda di che cosa hai in corso era l'opzione scartata in F1. Le misure sono in
 * docs/sviluppo/RAPPORTO-PO-010-G1.md. Spento, la home con la libera in corso scorre a
 * 360x640 e 375x667: `npm run home-spiegazione` e `npm run impaginazione` sono rossi.
 */
const HOME_BASSA_COMPATTA = true;

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
  livelloCorrente, livelloInSospeso = null, versione,
  onGioca, onRiprendi, onSfida, onArchivio, onQuadri, onGiocaLivello, onVai, onSostieni, t,
}) {
  const progressoTesto = t('quadri.avanzamento')
    .replace('{fatti}', numero(quadriFatti))
    .replace('{totale}', numero(quadriTotali));
  const recordTesto = record.best > 0 ? `${t('home.record')} ${numero(record.best)}` : '';
  const sfidaTesto = sfidaOggi.partite > 0 ? `${t('home.record')} ${numero(sfidaOggi.best)}` : '';
  // PO-010: il nome e' quello della modalita' in ogni stato; «Riprendi ›» e' lo stato.
  // Il nome accessibile dice tutte e due le cose, in quest'ordine, in una frase.
  const etichettaLibera = cePartitaSalvata && !NOME_FISSO_E_STATO ? t('home.riprendi') : t('home.partitaLibera');
  const statoLibera = cePartitaSalvata && NOME_FISSO_E_STATO ? t('home.riprendiStato') : (recordTesto || t('home.maiGiocata'));
  const nomeLibera = cePartitaSalvata && NOME_FISSO_E_STATO
    ? `${etichettaLibera}, ${t('home.riprendiLibera')}`
    : (recordTesto ? `${etichettaLibera}, ${recordTesto}` : etichettaLibera);
  const etichettaSfida = sfidaInCorso && !NOME_FISSO_E_STATO ? t('sfida.riprendi') : t('sfida.breve');
  const sfidaStato = sfidaInCorso && NOME_FISSO_E_STATO ? t('home.riprendiStato') : (sfidaTesto || t('home.daGiocare'));
  const nomeSfida = sfidaInCorso && NOME_FISSO_E_STATO
    ? `${etichettaSfida}, ${t('home.riprendiSfida')}`
    : (sfidaTesto ? `${etichettaSfida}, ${sfidaTesto}` : etichettaSfida);

  return (
    <div className={`pl-screen pl-home${HOME_BASSA_COMPATTA ? ' pl-home--compatta' : ''}`}>
      <div className="pl-home__testata">
        <Logo />
        <p className="pl-home__claim">{t('gioco.claim')}</p>
      </div>

      <div className="pl-home__azioni">
        {/* Il percorso e' il gioco: sta nel pulsante grande, e dice a quale livello sei. */}
        {/* Con un livello lasciato a meta' lo dice, come «Riprendi la partita» qui sotto:
            stesso pulsante, nessuna riga in piu' (la home non deve scorrere a 360x640). */}
        <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onGiocaLivello}>
          {livelloInSospeso
            ? t('quadri.riprendiLivello').replace('{n}', livelloInSospeso)
            : t('quadri.quadro').replace('{n}', livelloCorrente)}
        </button>

        {/* Questi pulsanti hanno due scritte, e senza aria-label il nome che arriva a
            un lettore di schermo e' la loro concatenazione: "Partita libera —". Non e'
            una frase, ed e' anche il motivo per cui i selettori delle prove nel browser
            diventavano fragili. L'etichetta esplicita risolve tutte e due le cose. */}
        <button
          type="button"
          className="pl-btn pl-btn--largo pl-sfida-avvio pl-sfida-avvio--mappa"
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
          className="pl-btn pl-btn--largo pl-sfida-avvio pl-sfida-avvio--libera"
          onClick={cePartitaSalvata ? onRiprendi : onGioca}
          aria-label={nomeLibera}
          aria-describedby={SPIEGAZIONE_MODI ? 'pl-spiega-libera' : undefined}
        >
          <span>{etichettaLibera}</span>
          {/* Il numero da solo non direbbe di che cosa e' il record: la parola serve. */}
          {/* IL TRATTINO SEMBRAVA UN VALORE MANCANTE. Un "—" a destra di una voce di
              menu si legge come un dato che non e' arrivato, non come "non c'e' ancora
              niente": per un giocatore nuovo, cioe' l'unico che lo vede, e' la prima
              impressione sbagliata. La parola lo dice e basta. */}
          <span className={`pl-sfida-avvio__esito${cePartitaSalvata && NOME_FISSO_E_STATO ? ' pl-sfida-avvio__esito--riprendi' : ''}`}>{statoLibera}</span>
          {SPIEGAZIONE_MODI ? (
            <span id="pl-spiega-libera" className="pl-sfida-avvio__spiega">{t('home.spiegaLibera')}</span>
          ) : null}
        </button>

        {/* PO-010: un collegamento e non un pulsante largo. Il pulsante di prima (52 px
            piu' lo spazio) faceva scorrere la home di 60 px a 360x640 (F1); il
            collegamento e' alto 28, sopra i 24 di B10, e sta attaccato alla card di cui
            parla. Senza partita in corso non serve: la card stessa ne comincia una. */}
        {cePartitaSalvata && NOME_FISSO_E_STATO ? (
          <button type="button" className="pl-home__nuova-libera" onClick={onGioca}>
            {t('home.nuovaLibera')}
          </button>
        ) : null}

        <button
          type="button"
          className="pl-btn pl-btn--largo pl-sfida-avvio pl-sfida-avvio--sfida"
          onClick={onSfida}
          aria-label={nomeSfida}
          aria-describedby={SPIEGAZIONE_MODI ? 'pl-spiega-sfida' : undefined}
        >
          <span>{etichettaSfida}</span>
          <span className={`pl-sfida-avvio__esito${sfidaInCorso && NOME_FISSO_E_STATO ? ' pl-sfida-avvio__esito--riprendi' : ''}`}>{sfidaStato}</span>
          {SPIEGAZIONE_MODI ? (
            <span id="pl-spiega-sfida" className="pl-sfida-avvio__spiega">{t('home.spiegaSfida')}</span>
          ) : null}
        </button>

        {/* L'archivio sta SOTTO la sfida di oggi e non accanto: oggi e' la sfida che
            conta, quella che stanno giocando tutti. I giorni passati sono un di piu'
            che si va a cercare, non un'alternativa messa sullo stesso piano. */}
        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onArchivio}>
          {t('archivio.titolo')}
        </button>
      </div>

      {/* Sta fra le azioni e il menu: si vede scorrendo, ma non compete con il
          pulsante per giocare. E compare solo dove l'installazione e' possibile
          davvero — non e' un pulsante decorativo. */}
      <Installa t={t} />

      {/* LE CINQUE VOCI SONO UNA GRIGLIA, non una riga che va a capo.
          Erano cinque etichette dentro un `flex-wrap`: uscivano due, due e "Info" da
          sola in mezzo, cioe' un blocco che sembrava un elenco interrotto a meta'. Due
          colonne fisse mettono ordine, e l'ultima voce occupa tutta la riga: cosi' lo
          spaiamento diventa una scelta invece che un effetto del ritorno a capo.
          Il profilo sta qui accanto alle statistiche, non fra i pulsanti per giocare:
          e' una cosa che si guarda fra una partita e l'altra, non un modo di iniziare. */}
      <nav className="pl-home__menu">
        {[
          ['aiuto', t('aiuto.titolo'), <IconaAiuto key="i" />],
          ['statistiche', t('home.statistiche'), <IconaStatistiche key="i" />],
          ['profilo', t('profilo.titolo'), <IconaProfilo key="i" />],
          ['impostazioni', t('home.impostazioni'), <IconaImpostazioni key="i" />],
          ['info', t('home.info'), <IconaInfo key="i" />],
        ].map(([dove, etichetta, icona]) => (
          <button
            key={dove}
            type="button"
            className="pl-btn pl-btn--fantasma pl-home__voce"
            onClick={() => onVai(dove)}
          >
            <span className="pl-home__voce-icona">{icona}</span>
            <span>{etichetta}</span>
          </button>
        ))}
        {/* La sesta voce, solo nell'app del Play Store: chiude la griglia pari (tre righe
            da due) invece di aggiungerne una, quindi la home non si allunga. */}
        <VoceRecensione t={t} />
        {/* Oppure, nel browser di un telefono Android, la sesta voce porta all'app. */}
        <VoceScaricaApp t={t} />
      </nav>

      {/* Il sostegno sta in fondo e in piccolo, sotto tutto il resto e sopra la sola
          versione. Non e' timidezza: un gioco senza pubblicita' e senza acquisti perde
          la sua promessa nel momento in cui chiede soldi con la stessa voce con cui
          dice "gioca". Chi vuole cercarlo lo trova; a chi vuole solo giocare non
          capita davanti. */}
      {/* Versione in chiaro: serve a chi segnala un problema e a chi lo deve capire,
          per sapere quale build era sullo schermo. Stava solo dentro Info, cioe' dove
          nessuno la cerca proprio quando servirebbe.

          Sostegno e versione stanno sulla STESSA riga, e non e' una scelta estetica:
          messo su una riga propria, il collegamento faceva scorrere la home su uno
          schermo da 640px (lo ha misurato `npm run impaginazione`). Un pie' di pagina
          e' anche il posto giusto per entrambi. */}
      <p className="pl-home__pie">
        <button type="button" className="pl-home__sostieni" onClick={onSostieni}>
          <IconaCaffe />
          <span>{t('home.sostieni')}</span>
        </button>
        {CONTATTO ? (
          <>
            <span aria-hidden="true"> · </span>
            {/* La versione finisce nell'oggetto del messaggio: chi segnala un problema
                quasi mai sa dire quale versione aveva, e senza quel dato una
                segnalazione vale meta'. */}
            <a
              className="pl-home__sostieni"
              href={`mailto:${CONTATTO}?subject=${encodeURIComponent(`PLINTO ${versione} - idee e segnalazioni`)}`}
            >
              <IconaIdea />
              <span>{t('home.feedback')}</span>
            </a>
          </>
        ) : null}
        <span aria-hidden="true"> · </span>
        <span className="pl-home__versione">v{versione}</span>
      </p>
    </div>
  );
}
