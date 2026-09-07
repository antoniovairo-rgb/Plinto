import { useMemo, useState } from 'react';
import { Pagina } from './Pagina.jsx';
import { numero } from '../../i18n/formato.js';
import { CHAIN_MAX } from '../../config/rules.js';
import { IMPRONTA_REGOLE } from '../../core/impronta.js';
import { caricaProfilo, quoteCatena, azzeraProfilo, esportaProfilo } from '../../persistence/profilo.js';
import riferimento from '../../data/riferimento-catena.json';

/**
 * Il profilo di gioco: come giochi, non quanto hai fatto.
 *
 * OGNI GRAFICO HA IL SUO EQUIVALENTE IN TABELLA, e non e' una concessione: un grafico a
 * barre disegnato con dei <div> alti in percentuale, per chi ascolta, e' silenzio. La
 * mappa di calore in particolare -- come immagine e' una macchia, come tabella 9x9 con
 * intestazioni di riga e colonna e' leggibile da chiunque. L'intensita' del colore non
 * porta mai da sola un'informazione: accanto c'e' sempre il numero.
 *
 * IL CONFRONTO CON LO STRATEGA NON SI MOSTRA SEMPRE. Il riferimento viene generato da
 * `npm run catena` e porta con se' l'impronta delle regole con cui e' stato misurato. Se
 * quell'impronta non coincide con quella del gioco -- perche' e' cambiato un peso o una
 * costante -- il confronto sparisce del tutto: meglio nessun paragone che un paragone
 * sbagliato, che sembra identico a uno giusto.
 *
 * E il riferimento e' un GIOCATORE ARTIFICIALE, non una media di persone. E' scritto per
 * esteso sotto il grafico, perche' e' la differenza fra "gioco peggio di un programma" e
 * "gioco peggio della gente", e la seconda non e' un'informazione che abbiamo.
 */

/** Il confronto e' valido solo se il riferimento e' stato misurato con queste regole. */
function riferimentoValido() {
  return Boolean(riferimento)
    && Array.isArray(riferimento.distribuzione)
    && riferimento.distribuzione.length === CHAIN_MAX + 1
    && riferimento.regole === IMPRONTA_REGOLE;
}

/** Una riga di dati con etichetta e valore. */
function Dato({ etichetta, valore }) {
  return (
    <div className="pl-dato">
      <span className="pl-dato__etichetta">{etichetta}</span>
      <span className="pl-dato__valore">{valore}</span>
    </div>
  );
}

export function SchermoProfilo({ onIndietro, t }) {
  const [profilo, setProfilo] = useState(() => caricaProfilo());
  const [conferma, setConferma] = useState(false);
  const [copiato, setCopiato] = useState(false);

  const quote = useMemo(() => quoteCatena(profilo), [profilo]);
  const confronto = riferimentoValido();

  const gruppi = profilo.righe + profilo.colonne + profilo.quadranti;
  const quota = (parte) => (gruppi > 0 ? Math.round((parte / gruppi) * 100) : 0);

  const maxAppoggi = Math.max(1, ...profilo.mappaAppoggi);

  if (profilo.partite === 0) {
    return (
      <Pagina titolo={t('profilo.titolo')} onIndietro={onIndietro} t={t}>
        <p className="pl-testo">{t('profilo.vuoto')}</p>
      </Pagina>
    );
  }

  return (
    <Pagina titolo={t('profilo.titolo')} onIndietro={onIndietro} t={t}>
      <p className="pl-nota">{t('profilo.qualiPartite')}</p>

      <section className="pl-profilo__blocco">
        <h2 className="pl-profilo__titolo">{t('profilo.insieme')}</h2>
        <Dato etichetta={t('profilo.partite')} valore={numero(profilo.partite)} />
        <Dato etichetta={t('profilo.mosse')} valore={numero(profilo.mosse)} />
        <Dato etichetta={t('profilo.migliorPunteggio')} valore={numero(profilo.migliorPunteggio)} />
        <Dato etichetta={t('profilo.migliorMossa')} valore={numero(profilo.migliorMossa)} />
        <Dato etichetta={t('profilo.svuotamenti')} valore={numero(profilo.svuotamenti)} />
        <Dato etichetta={t('profilo.bombe')} valore={numero(profilo.bombe)} />
        <Dato etichetta={t('profilo.celleEsplose')} valore={numero(profilo.celleEsplose)} />
      </section>

      {/* --- come chiudi i gruppi: il dato che racconta davvero lo stile --- */}
      <section className="pl-profilo__blocco">
        <h2 className="pl-profilo__titolo">{t('profilo.comeChiudi')}</h2>
        <p className="pl-nota">{t('profilo.comeChiudiSpiega')}</p>
        <table className="pl-tabella">
          <caption className="pl-sr">{t('profilo.comeChiudi')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('profilo.gruppo')}</th>
              <th scope="col">{t('profilo.quanti')}</th>
              <th scope="col">{t('profilo.quota')}</th>
            </tr>
          </thead>
          <tbody>
            {[
              { nome: t('profilo.righe'), valore: profilo.righe },
              { nome: t('profilo.colonne'), valore: profilo.colonne },
              { nome: t('profilo.quadranti'), valore: profilo.quadranti },
            ].map(({ nome, valore }) => (
              <tr key={nome}>
                <th scope="row">{nome}</th>
                <td>{numero(valore)}</td>
                <td>
                  <span className="pl-barra" aria-hidden="true">
                    <span className="pl-barra__pieno" style={{ width: `${quota(valore)}%` }} />
                  </span>
                  {`${quota(valore)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* --- la Catena: dove hai passato le tue mosse --- */}
      <section className="pl-profilo__blocco">
        <h2 className="pl-profilo__titolo">{t('profilo.catena')}</h2>
        <p className="pl-nota">{t('profilo.catenaSpiega')}</p>
        <table className="pl-tabella">
          <caption className="pl-sr">{t('profilo.catena')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('profilo.livello')}</th>
              <th scope="col">{t('profilo.tue')}</th>
              {confronto ? <th scope="col">{t('profilo.stratega')}</th> : null}
            </tr>
          </thead>
          <tbody>
            {(quote ?? []).map((q, livello) => (
              <tr key={livello}>
                <th scope="row">{`×${(1 + 0.25 * livello).toFixed(2)}`}</th>
                <td>
                  <span className="pl-barra" aria-hidden="true">
                    <span className="pl-barra__pieno" style={{ width: `${Math.round(q * 100)}%` }} />
                  </span>
                  {`${(q * 100).toFixed(1)}%`}
                </td>
                {confronto ? (
                  <td className="pl-tabella__debole">
                    {`${(riferimento.distribuzione[livello] * 100).toFixed(1)}%`}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
        {confronto ? (
          <p className="pl-nota">
            {t('profilo.riferimento')
              .replace('{partite}', numero(riferimento.partite))
              .replace('{mosse}', numero(riferimento.mosse))
              .replace('{tetto}', numero(riferimento.tettoMosse))
              .replace('{data}', riferimento.misuratoIl)}
          </p>
        ) : (
          <p className="pl-nota">{t('profilo.senzaRiferimento')}</p>
        )}
      </section>

      {/* --- la mappa di calore: l'unica immagine personale del gioco --- */}
      <section className="pl-profilo__blocco">
        <h2 className="pl-profilo__titolo">{t('profilo.mappa')}</h2>
        <p className="pl-nota">{t('profilo.mappaSpiega')}</p>
        <table className="pl-mappa">
          <caption className="pl-sr">{t('profilo.mappaDidascalia')}</caption>
          <thead>
            <tr>
              <th scope="col"><span className="pl-sr">{t('profilo.riga')}</span></th>
              {Array.from({ length: 9 }, (_, c) => (
                <th key={c} scope="col">{c + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 9 }, (_, r) => (
              <tr key={r}>
                <th scope="row">{r + 1}</th>
                {Array.from({ length: 9 }, (_, c) => {
                  const quanti = profilo.mappaAppoggi[r * 9 + c] ?? 0;
                  return (
                    <td
                      key={c}
                      className="pl-mappa__cella"
                      // L'intensita' e' un aiuto a colpo d'occhio, non l'informazione:
                      // il numero c'e' sempre, e chi ascolta sente quello.
                      style={{ '--intensita': quanti / maxAppoggi }}
                    >
                      {numero(quanti)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* --- la porta d'uscita, in evidenza e non in un sottomenu --- */}
      <section className="pl-profilo__blocco">
        <h2 className="pl-profilo__titolo">{t('profilo.tuoiDati')}</h2>
        <p className="pl-nota">{t('profilo.tuoiDatiSpiega')}</p>
        <button
          type="button"
          className="pl-btn pl-btn--largo"
          onClick={async () => {
            const testo = esportaProfilo(profilo);
            try {
              await navigator.clipboard.writeText(testo);
              setCopiato(true);
            } catch {
              // Niente appunti (permesso negato, contesto non sicuro): non si finge che
              // sia andata bene. Il testo resta comunque leggibile qui sotto.
              setCopiato(false);
            }
          }}
        >
          {t('profilo.esporta')}
        </button>
        {copiato ? <p className="pl-nota">{t('profilo.esportato')}</p> : null}

        {conferma ? (
          <>
            <p className="pl-nota pl-nota--allarme">{t('profilo.cancellaConferma')}</p>
            <button
              type="button"
              className="pl-btn pl-btn--largo pl-btn--pericolo"
              onClick={() => { azzeraProfilo(); setProfilo(caricaProfilo()); setConferma(false); }}
            >
              {t('profilo.cancellaDavvero')}
            </button>
            <button
              type="button"
              className="pl-btn pl-btn--fantasma pl-btn--largo"
              onClick={() => setConferma(false)}
            >
              {t('profilo.annulla')}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="pl-btn pl-btn--fantasma pl-btn--largo"
            onClick={() => setConferma(true)}
          >
            {t('profilo.cancella')}
          </button>
        )}
      </section>
    </Pagina>
  );
}
