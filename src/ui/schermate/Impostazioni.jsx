import { useState } from 'react';
import { Pagina, Interruttore } from './Pagina.jsx';
import { LINGUE } from '../../i18n/index.js';
import { Salvataggio } from './Salvataggio.jsx';
import { quantiSuperati } from '../../persistence/progressi.js';
import { loadRecords, loadStats } from '../../persistence/records.js';
import { caricaSfide } from '../../persistence/sfide.js';
import { ConfermaDoppia, VoceCancellata } from '../ConfermaDoppia.jsx';
import { numero } from '../../i18n/formato.js';

/**
 * Impostazioni. Ogni voce e' una scelta reale del giocatore, non una preferenza
 * finta: audio e vibrazione si spengono davvero.
 *
 * QUI NON SI SPEGNE IL GIOCO. Animazioni, evidenziazione dei gruppi e attrezzi del
 * cantiere non hanno piu' un interruttore, ed e' una scelta di disegno: erano tre modi
 * di giocare a un gioco diverso da quello che tutti gli altri stanno giocando, nascosti
 * in una schermata che quasi nessuno apre. Un'impostazione che cambia le regole non e'
 * una preferenza, e' una seconda versione del gioco da mantenere.
 *
 * Il movimento ridotto resta rispettato, ma lo chiede il TELEFONO e non questa
 * schermata: `prefers-reduced-motion` spegne le animazioni da solo (vedi
 * src/state/useImpostazioni.js). Chi ha bisogno di meno movimento lo ha gia' detto al
 * sistema operativo, e non deve ridirlo a ogni applicazione.
 */
export function SchermoImpostazioni({ impostazioni, cambia, inverti, onAzzera, onIndietro, t }) {
  // Zero e' il primo passo, uno e due sono le due conferme. Lo stesso meccanismo del
  // "ricomincia dal livello 1", e per la stessa ragione: questa e' l'azione piu'
  // distruttiva del gioco, e stava dietro un tocco solo.
  const [passo, setPasso] = useState(0);
  const [fatto, setFatto] = useState(false);
  // Si legge una volta sola, all'apertura della schermata: dopo l'azzeramento questi
  // numeri sono tutti zero, e ricalcolarli farebbe lampeggiare l'elenco a vuoto.
  const [posta] = useState(() => ({
    livelli: quantiSuperati(),
    partite: loadStats().partite ?? 0,
    record: loadRecords().best ?? 0,
    sfide: Object.keys(caricaSfide()).length,
  }));

  return (
    <Pagina titolo={t('impostazioni.titolo')} onIndietro={onIndietro} t={t}>
      <div className="pl-lista">
        <Interruttore etichetta={t('impostazioni.audio')} attivo={impostazioni.audio}
                      onCambia={() => inverti('audio')} />
        <Interruttore etichetta={t('impostazioni.vibrazione')} attivo={impostazioni.vibrazione}
                      onCambia={() => inverti('vibrazione')} />
      </div>

      <div className="pl-gruppo">
        <span className="pl-hud__etichetta">{t('impostazioni.tema')}</span>
        <div className="pl-segmenti">
          {[['scuro', t('impostazioni.temaScuro')], ['chiaro', t('impostazioni.temaChiaro')]].map(
            ([valore, testo]) => (
              <button key={valore} type="button"
                      className={`pl-segmento ${impostazioni.tema === valore ? 'pl-segmento--attivo' : ''}`}
                      onClick={() => cambia('tema', valore)} aria-pressed={impostazioni.tema === valore}>
                {testo}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="pl-gruppo">
        <span className="pl-hud__etichetta">{t('impostazioni.lingua')}</span>
        <div className="pl-segmenti">
          {Object.entries(LINGUE).map(([codice, { nome }]) => (
            <button key={codice} type="button"
                    className={`pl-segmento ${impostazioni.lingua === codice ? 'pl-segmento--attivo' : ''}`}
                    onClick={() => cambia('lingua', codice)} aria-pressed={impostazioni.lingua === codice}>
              {nome}
            </button>
          ))}
        </div>
      </div>

      <Salvataggio t={t} />

      {/* AZZERARE TUTTO: DUE CONFERME, come il "ricomincia dal livello 1".
          Era l'azione piu' distruttiva del gioco -- toglie i livelli, i record, le
          statistiche, il profilo, l'archivio delle sfide e la partita in corso -- e stava
          dietro un tocco solo, in fondo a una schermata che si scorre col pollice.

          E l'avviso diceva meno del vero: "record, statistiche e partita in corso"
          ometteva proprio i livelli, cioe' la cosa che costa mesi. Adesso il primo passo
          mette in cima il numero dei livelli che si perdono, e l'elenco e' completo. */}
      <div className="pl-gruppo">
        {fatto ? (
          <p className="pl-nota">{t('impostazioni.azzeraFatto')}</p>
        ) : passo === 0 ? (
          <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={() => setPasso(1)}>
            {t('impostazioni.azzera')}
          </button>
        ) : (
          <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={() => setPasso(1)}>
            {t('impostazioni.azzera')}
          </button>
        )}
      </div>

      {passo > 0 && !fatto ? (
        <ConfermaDoppia
          passo={passo}
          titolo={t('impostazioni.azzera')}
          etichettaFinale={t('impostazioni.azzeraDavvero')}
          onAnnulla={() => setPasso(0)}
          onAvanti={() => setPasso(2)}
          onConferma={() => { onAzzera(); setFatto(true); setPasso(0); }}
          t={t}
        >
          {passo === 1 ? (
            <>
              <p className="pl-azzera__etichetta">{t('impostazioni.azzeraElenco')}</p>
              <ul className="pl-azzera__elenco">
                {posta.livelli > 0 ? (
                  <VoceCancellata etichetta={t('impostazioni.voceLivelli')} valore={numero(posta.livelli)} />
                ) : null}
                {posta.partite > 0 ? (
                  <VoceCancellata etichetta={t('impostazioni.vocePartite')} valore={numero(posta.partite)} />
                ) : null}
                {posta.record > 0 ? (
                  <VoceCancellata etichetta={t('impostazioni.voceRecord')} valore={numero(posta.record)} />
                ) : null}
                {posta.sfide > 0 ? (
                  <VoceCancellata etichetta={t('impostazioni.voceSfide')} valore={numero(posta.sfide)} />
                ) : null}
              </ul>
              <p className="pl-azzera__resta">{t('impostazioni.azzeraConferma')}</p>
            </>
          ) : (
            <>
              <p className="pl-azzera__testo pl-azzera__testo--forte">
                {t('impostazioni.azzeraSicuro')}
              </p>
              {/* L'unica via di ritorno che esiste davvero, e sta in questa schermata. */}
              <p className="pl-azzera__resta">{t('impostazioni.azzeraResta')}</p>
            </>
          )}
        </ConfermaDoppia>
      ) : null}
    </Pagina>
  );
}
