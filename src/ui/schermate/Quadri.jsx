import { useEffect, useRef, useState } from 'react';
import { Pagina } from './Pagina.jsx';
import { Plinto } from '../Plinto.jsx';
import { QUADRI, ATTI, OPERE, TOTALE_QUADRI } from '../../config/quadri.js';
import { ConfermaDoppia, VoceCancellata } from '../ConfermaDoppia.jsx';
import { caricaProgressi, quadroSbloccato, quadroSuperato, prossimoQuadro, azzeraProgressi } from '../../persistence/progressi.js';
import { numero } from '../../i18n/formato.js';
import { CondividiPercorso } from '../Condividi.jsx';

/**
 * La mappa del percorso.
 *
 * Non e' un elenco: e' una strada che si vede tutta, divisa in atti con un nome.
 * Vedere le cento tappe, comprese quelle ancora chiuse, e' il punto: sapere quanto
 * manca e cosa arriva dopo e' esattamente cio' che fa venire voglia di continuare.
 * Nascondere il futuro renderebbe il percorso piu' misterioso e meno motivante.
 *
 * Plinto sta sulla tappa a cui sei arrivato, e la mappa ci scorre sopra da sola
 * all'apertura: chi torna dopo una settimana non deve cercarsi.
 *
 * Le tappe chiuse restano leggibili, spente ma non nascoste, e dicono cosa chiedono.
 */
export function SchermoQuadri({ onApri, onIndietro, onAzzerato, t }) {
  // Ricominciare da capo si conferma DUE volte. Non e' burocrazia: e' un'azione che
  // cancella ore di gioco e non si puo' annullare, e sta nella stessa schermata che
  // si apre per scegliere un livello. Un tocco solo, da un pollice che scorre, la
  // farebbe partire per sbaglio; due volte no.
  const [passoConferma, setPassoConferma] = useState(0);
  const progressi = caricaProgressi();
  const superati = QUADRI.filter((q) => progressi[q.numero]).length;
  const corrente = prossimoQuadro(TOTALE_QUADRI, progressi);
  const tappaCorrente = useRef(null);

  // Si va dove sta il giocatore, senza animazione: all'apertura di una schermata
  // uno scorrimento animato e' solo attesa.
  useEffect(() => {
    tappaCorrente.current?.scrollIntoView({ block: 'center' });
  }, []);

  // Il titolo e' il nome dell'opera, non la parola "Livelli": i cento livelli sono UNA
  // cosa, il Ponte, e quando ce ne sara' un'altra questa schermata sapra' gia' dire quale
  // si sta guardando.
  return (
    <Pagina titolo={t(`opere.${OPERE[0].id}`)} onIndietro={onIndietro} t={t}>
      <div className="pl-mappa__testata">
        <Plinto espressione={superati >= TOTALE_QUADRI ? 'contento' : 'normale'} dimensione={56} className="pl-plinto--vivo" />
        <div>
          <p className="pl-mappa__conteggio">
            {t('quadri.avanzamento').replace('{fatti}', numero(superati)).replace('{totale}', numero(TOTALE_QUADRI))}
          </p>
          <div className="pl-mappa__barra">
            <div className="pl-mappa__riempimento" style={{ width: `${(superati / TOTALE_QUADRI) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Condividere il percorso sta QUI, accanto al numero che racconta, e non in fondo
          alla mappa. In fondo ci sono cento livelli di distanza: una cosa che nessuno
          trova e' una cosa che non esiste.

          Il primo tester che ha superato dei livelli non aveva modo di dirlo a nessuno:
          la scheda condivisibile esisteva solo per la partita libera, cioe' per la
          modalita' secondaria. Il percorso, che e' il gioco, era l'unica cosa muta.

          Compare solo dopo il primo livello superato: "0 livelli su 100" non e' un
          vanto, e un pulsante per raccontare che non hai ancora fatto niente e' una
          domanda a cui nessuno vuole rispondere. */}
      {superati > 0 ? (
        <CondividiPercorso superati={superati} totale={TOTALE_QUADRI} t={t} />
      ) : null}

      {ATTI.map((atto) => {
        const dellAtto = QUADRI.filter((q) => q.numero >= atto.da && q.numero <= atto.a);
        const fattiQui = dellAtto.filter((q) => progressi[q.numero]).length;
        const apertoQui = dellAtto.some((q) => quadroSbloccato(q.numero, progressi));
        return (
          <section key={atto.id} className={`pl-atto ${apertoQui ? '' : 'pl-atto--chiuso'}`}>
            <header className="pl-atto__testata">
              <h2 className="pl-atto__nome">{t(`atti.${atto.id}`)}</h2>
              <span className="pl-atto__conteggio">{fattiQui}/{dellAtto.length}</span>
            </header>

            <ol className="pl-tappe">
              {dellAtto.map((quadro) => {
                // `quadroSuperato` e non la semplice presenza della voce: da quando i
                // tentativi si contano anche sui livelli mai superati, esiste una voce
                // che dice solo "ci ha provato N volte" e non merita la spunta.
                const fatto = quadroSuperato(quadro.numero, progressi) ? progressi[quadro.numero] : null;
                const aperto = quadroSbloccato(quadro.numero, progressi);
                const qui = quadro.numero === corrente;
                const classi = ['pl-tappa'];
                if (fatto) classi.push('pl-tappa--fatta');
                if (!aperto) classi.push('pl-tappa--chiusa');
                if (qui) classi.push('pl-tappa--qui');
                return (
                  <li key={quadro.numero} ref={qui ? tappaCorrente : null}>
                    <button
                      type="button"
                      className={classi.join(' ')}
                      onClick={() => aperto && onApri(quadro)}
                      disabled={!aperto}
                      aria-current={qui ? 'step' : undefined}
                      aria-label={`${t('quadri.quadro').replace('{n}', quadro.numero)}: ${
                        aperto ? descriviObiettivi(quadro, t) : t('quadri.bloccato')}${
                        fatto ? `. ${t('quadri.superato')}, ${t('quadri.tuoRecord').replace('{mosse}', fatto.mosse)}` : ''}`}
                    >
                      <span className="pl-tappa__numero">{fatto ? '✓' : quadro.numero}</span>
                      {qui ? (
                        <span className="pl-tappa__plinto" aria-hidden="true">
                          <Plinto dimensione={38} className="pl-plinto--vivo" />
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ol>

            {/*
              * LA DIDASCALIA DELL'ATTO, in tre casi e non due.
              *  - aperto e in corso: il livello a cui si e' arrivati, con obiettivo e mosse;
              *  - chiuso: da quale livello si apre. NON "supera il livello precedente":
              *    quella frase e' scritta per un livello solo -- come etichetta del suo
              *    pulsante, dove "il precedente" e' davvero quello prima -- e sotto otto
              *    livelli diceva una cosa falsa, cioe' che ne mancasse uno;
              *  - finito: NIENTE. Prima usciva un paragrafo vuoto, che non dice niente e
              *    l'altezza se la prende lo stesso: su una mappa con sette atti erano
              *    cinque buchi.
              */}
            {(() => {
              const inCorso = dellAtto.find((q) => q.numero === corrente);
              const testo = apertoQui
                ? (inCorso
                  ? `${t('quadri.quadro').replace('{n}', inCorso.numero)} · ${descriviObiettivi(inCorso, t)} · ${inCorso.maxMosse} ${t('quadri.mosse').toLowerCase()}`
                  : '')
                : t('quadri.attoDaAprire').replace('{n}', atto.da);
              return testo ? <p className="pl-atto__obiettivo">{testo}</p> : null;
            })()}
          </section>
        );
      })}

      {/* Ricominciare da capo. In fondo alla mappa, dopo tutti i livelli: chi la cerca
          la trova, chi non la cerca non ci inciampa. */}
      <div className="pl-ricomincia">
        {superati === 0 ? null : (
          <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo"
                  onClick={() => setPassoConferma(1)}>
            {t('quadri.ricomincia')}
          </button>
        )}
      </div>

      {/* LA DOMANDA STA IN UNA FINESTRA SOSPESA, non in fondo alla mappa.
          Sotto cento livelli, due righe di testo rosso in coda alla pagina si leggevano
          come un avviso comparso da solo, non come una domanda a cui rispondere -- e la
          domanda cancella ore di gioco. Una finestra prende lo schermo: non si puo'
          scorrere oltre e non si confonde con il resto.

          E' lo stesso componente che usa "Azzera i miei dati", perche' e' la stessa
          domanda: tenerne due copie vorrebbe dire che un giorno una avra' due conferme e
          l'altra una sola, e nessuno se ne accorgerebbe finche' qualcuno non perde
          qualcosa. Le etichette dei pulsanti restano identiche, perche' il controllo che
          verifica le due conferme cerca esattamente quelle parole. */}
      {passoConferma > 0 ? (
        <ConfermaDoppia
          passo={passoConferma}
          titolo={t('quadri.ricomincia')}
          etichettaFinale={t('quadri.ricominciaConferma')}
          onAnnulla={() => setPassoConferma(0)}
          onAvanti={() => setPassoConferma(2)}
          onConferma={() => { azzeraProgressi(); setPassoConferma(0); onAzzerato?.(); }}
          t={t}
        >
          {passoConferma === 1 ? (
            <>
              <p className="pl-azzera__etichetta">{t('impostazioni.azzeraElenco')}</p>
              <ul className="pl-azzera__elenco">
                <VoceCancellata
                  etichetta={t('impostazioni.voceLivelli')}
                  valore={numero(superati)}
                />
              </ul>
              <p className="pl-azzera__testo">{t('quadri.ricominciaAvviso')}</p>
            </>
          ) : (
            <>
              <p className="pl-azzera__testo pl-azzera__testo--forte">
                {t('quadri.ricominciaSicuro')}
              </p>
              {/* Dice cosa NON si perde: il timore ragionevole a questo punto e' di star
                  cancellando anche record e statistiche. */}
              <p className="pl-azzera__resta">{t('quadri.ricominciaResta')}</p>
            </>
          )}
        </ConfermaDoppia>
      ) : null}
    </Pagina>
  );
}

/**
 * Traduce gli obiettivi di un Quadro in una frase leggibile.
 *
 * Al singolare si usa una forma dedicata: "Chiudi 1 righe" e' il genere di dettaglio
 * che fa sembrare tradotto male un gioco scritto bene. Se la forma singolare non
 * esiste per quel tipo, il traduttore restituisce la chiave stessa e si ricade sul
 * plurale, quindi aggiungerne una nuova non richiede di toccare questo codice.
 */
export function descriviObiettivo(tipo, quanti, t) {
  if (quanti === 1) {
    const singolare = t(`quadri.obiettivi.${tipo}Uno`);
    if (!singolare.startsWith('quadri.obiettivi.')) return singolare;
  }
  return t(`quadri.obiettivi.${tipo}`).replace('{n}', numero(quanti));
}

export function descriviObiettivi(quadro, t) {
  return quadro.obiettivi.map(({ tipo, quanti }) => descriviObiettivo(tipo, quanti, t)).join(' + ');
}
