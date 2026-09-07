import { useMemo, useRef, useState } from 'react';
import { Pagina } from './Pagina.jsx';
import { numero } from '../../i18n/formato.js';
import {
  PRIMA_SFIDA, giornoDiOggi, meseDi, mesePiu, settimaneDelMese, tipoDiGiorno, meseHaSfide,
  giornoPiu,
} from '../../core/sfida.js';
import { caricaSfide, regoleCoincidono } from '../../persistence/sfide.js';

/**
 * L'archivio delle Sfide del Giorno.
 *
 * Le sfide passate non sono conservate da nessuna parte: si RICALCOLANO dal giorno.
 * Chi installa il gioco oggi trova quindi mesi di partite gia' pronte, e non perche'
 * qualcuno le abbia salvate.
 *
 * PERCHE' UNA <table> VERA E NON UNA GRIGLIA DI <div>. Un calendario e' una tabella:
 * ogni casella appartiene a un giorno della settimana e a una settimana, e quelle due
 * appartenenze sono l'informazione. Con dei <div> un lettore di schermo annuncia
 * quaranta numeri di fila senza dire che il 12 e' un giovedi'; con una tabella
 * annuncia la colonna insieme alla cella. E' la trappola classica di questa schermata,
 * ed e' anche il motivo per cui tanti calendari sul web sono inutilizzabili al buio.
 *
 * QUATTRO STATI, DISTINTI NON DAL SOLO COLORE:
 *   - non giocata  -> il numero del giorno e basta
 *   - giocata      -> il numero piu' il punteggio, e un segno geometrico
 *   - oggi         -> un contorno pieno e la parola "oggi" nell'etichetta
 *   - non apribile -> casella spenta, e l'etichetta dice PERCHE' (futura, o precedente
 *                     alla prima sfida). Una casella disattivata che non spiega niente
 *                     e' l'unico caso in cui un giocatore pensa che il gioco sia rotto.
 *
 * DA TASTIERA: frecce fra i giorni, PagSu/PagGiu fra i mesi, Invio per aprire. Il fuoco
 * si sposta con la tecnica del "tabindex mobile" -- una sola casella e' raggiungibile
 * con Tab, e le frecce muovono quella -- perche' quaranta caselle nel ciclo di Tab
 * renderebbero la pagina interminabile per chi non usa il mouse.
 */

/** I giorni della settimana, dal lunedi', come iniziali per l'intestazione. */
function intestazioni(t) {
  return t('archivio.giorni').split(',');
}

export function SchermoArchivio({ onIndietro, onApri, t }) {
  const oggi = giornoDiOggi();
  const [{ anno, mese }, setMese] = useState(() => meseDi(oggi));
  const [fuoco, setFuoco] = useState(oggi);
  const celle = useRef(new Map());

  const risultati = useMemo(() => caricaSfide(), []);
  const settimane = useMemo(() => settimaneDelMese(anno, mese), [anno, mese]);
  const giocatiNelMese = settimane.flat().filter((g) => g && risultati[g]).length;

  const precedente = mesePiu(anno, mese, -1);
  const successivo = mesePiu(anno, mese, 1);
  const cePrima = meseHaSfide(precedente.anno, precedente.mese, oggi);
  const ceDopo = meseHaSfide(successivo.anno, successivo.mese, oggi);

  /** Porta il fuoco su un giorno, cambiando mese se necessario. */
  function spostaFuoco(giorno) {
    const m = meseDi(giorno);
    if (!m) return;
    if (m.anno !== anno || m.mese !== mese) setMese(m);
    setFuoco(giorno);
    // Dopo il cambio di mese la casella non esiste ancora: si aspetta il disegno.
    requestAnimationFrame(() => celle.current.get(giorno)?.focus());
  }

  function vaiAlMese(delta) {
    const m = mesePiu(anno, mese, delta);
    if (!meseHaSfide(m.anno, m.mese, oggi)) return;
    setMese(m);
    // Restare sullo stesso numero di giorno e' l'unico comportamento che non sorprende;
    // se quel giorno nel mese nuovo non esiste (il 31 in un mese da 30) si torna al
    // primo, invece di far sparire il fuoco.
    const stesso = `${m.anno}-${String(m.mese).padStart(2, '0')}-${fuoco.slice(8)}`;
    const destinazione = settimaneDelMese(m.anno, m.mese).flat().includes(stesso)
      ? stesso
      : `${m.anno}-${String(m.mese).padStart(2, '0')}-01`;
    setFuoco(destinazione);
    requestAnimationFrame(() => celle.current.get(destinazione)?.focus());
  }

  function tasti(evento, giorno) {
    const passi = {
      ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7,
    };
    if (passi[evento.key] !== undefined) {
      evento.preventDefault();
      spostaFuoco(giornoPiu(giorno, passi[evento.key]));
      return;
    }
    if (evento.key === 'PageUp') { evento.preventDefault(); vaiAlMese(-1); }
    if (evento.key === 'PageDown') { evento.preventDefault(); vaiAlMese(1); }
    if (evento.key === 'Home') { evento.preventDefault(); spostaFuoco(`${giorno.slice(0, 8)}01`); }
  }

  const nomeMese = t('archivio.mesi').split(',')[mese - 1];

  return (
    <Pagina titolo={t('archivio.titolo')} onIndietro={onIndietro} t={t}>
      <p className="pl-testo">{t('archivio.spiegazione')}</p>

      <div className="pl-archivio__navigazione">
        <button
          type="button"
          className="pl-btn pl-btn--fantasma pl-archivio__freccia"
          onClick={() => vaiAlMese(-1)}
          disabled={!cePrima}
          aria-label={t('archivio.mesePrecedente')}
        >
          ‹
        </button>
        <h2 className="pl-archivio__mese" aria-live="polite">{`${nomeMese} ${anno}`}</h2>
        <button
          type="button"
          className="pl-btn pl-btn--fantasma pl-archivio__freccia"
          onClick={() => vaiAlMese(1)}
          disabled={!ceDopo}
          aria-label={t('archivio.meseSuccessivo')}
        >
          ›
        </button>
      </div>

      <table className="pl-calendario">
        <caption className="pl-sr">
          {t('archivio.didascalia').replace('{mese}', `${nomeMese} ${anno}`)}
        </caption>
        <thead>
          <tr>
            {/* La colonna delle settimane: intestazione vuota a schermo, non per chi ascolta. */}
            <th scope="col"><span className="pl-sr">{t('archivio.settimana')}</span></th>
            {intestazioni(t).map((giorno, i) => (
              <th key={giorno + i} scope="col" abbr={giorno}>{giorno}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {settimane.map((settimana, indice) => (
            <tr key={settimana.find(Boolean) ?? indice}>
              <th scope="row" className="pl-calendario__settimana">
                <span className="pl-sr">
                  {t('archivio.settimanaN').replace('{n}', indice + 1)}
                </span>
                <span aria-hidden="true">{indice + 1}</span>
              </th>
              {settimana.map((giorno, colonna) => {
                if (!giorno) return <td key={`vuoto-${colonna}`} className="pl-calendario__fuori" />;

                const tipo = tipoDiGiorno(giorno, oggi);
                const apribile = tipo === 'oggi' || tipo === 'archivio';
                const esito = risultati[giorno];
                const numeroGiorno = Number(giorno.slice(8));
                const stesseRegole = regoleCoincidono(esito);

                const etichetta = [
                  `${numeroGiorno} ${nomeMese}`,
                  tipo === 'oggi' ? t('archivio.oggi') : '',
                  esito ? t('archivio.tuoPunteggio').replace('{punti}', numero(esito.best)) : '',
                  esito && stesseRegole === false ? t('archivio.regoleDiverse') : '',
                  // Le chiavi si scrivono per intero e non si compongono a runtime: il
                  // test sull'i18n le cerca nel sorgente cosi' come sono scritte, ed e'
                  // l'unica cosa che impedisce a una traduzione mancante di arrivare a
                  // schermo come testo grezzo. Una chiave costruita al volo gli sfugge.
                  // (Nota: quel test legge anche i commenti, quindi qui non si scrivono
                  // chiavi di esempio -- risulterebbero usate, o inesistenti.)
                  tipo === 'futura' ? t('archivio.nonAncora') : '',
                  tipo === 'preistoria' ? t('archivio.troppoIndietro') : '',
                ].filter(Boolean).join('. ');

                return (
                  <td key={giorno} className="pl-calendario__cella">
                    <button
                      type="button"
                      ref={(nodo) => {
                        if (nodo) celle.current.set(giorno, nodo);
                        else celle.current.delete(giorno);
                      }}
                      className={[
                        'pl-giorno',
                        tipo === 'oggi' ? 'pl-giorno--oggi' : '',
                        esito ? 'pl-giorno--giocato' : '',
                        !apribile ? 'pl-giorno--spento' : '',
                      ].filter(Boolean).join(' ')}
                      // Un solo giorno nel ciclo di Tab: le frecce muovono il fuoco.
                      tabIndex={giorno === fuoco ? 0 : -1}
                      disabled={!apribile}
                      aria-label={etichetta}
                      aria-current={tipo === 'oggi' ? 'date' : undefined}
                      onFocus={() => setFuoco(giorno)}
                      onKeyDown={(e) => tasti(e, giorno)}
                      onClick={() => onApri(giorno)}
                    >
                      <span className="pl-giorno__numero">{numeroGiorno}</span>
                      {esito ? (
                        <>
                          {/* Il segno geometrico, non il solo colore, dice "giocato". */}
                          <span className="pl-giorno__segno" aria-hidden="true">◆</span>
                          <span className="pl-giorno__punti">{numero(esito.best)}</span>
                        </>
                      ) : null}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="pl-nota">
        {t('archivio.riepilogo')
          .replace('{giocati}', numero(giocatiNelMese))
          .replace('{mese}', nomeMese)}
      </p>
      <p className="pl-nota">{t('archivio.orologio')}</p>
      <p className="pl-nota">{t('archivio.daQuando').replace('{giorno}', PRIMA_SFIDA)}</p>
    </Pagina>
  );
}
