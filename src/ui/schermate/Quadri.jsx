import { useEffect, useRef, useState } from 'react';
import { Pagina } from './Pagina.jsx';
import { Plinto } from '../Plinto.jsx';
import { QUADRI, ATTI, TOTALE_QUADRI } from '../../config/quadri.js';
import { caricaProgressi, quadroSbloccato, prossimoQuadro, azzeraProgressi } from '../../persistence/progressi.js';
import { numero } from '../../i18n/formato.js';

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

  return (
    <Pagina titolo={t('quadri.titolo')} onIndietro={onIndietro} t={t}>
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

      {ATTI.map((atto) => {
        const dellAtto = QUADRI.filter((q) => q.numero >= atto.da && q.numero <= atto.a);
        const fattiQui = dellAtto.filter((q) => progressi[q.numero]).length;
        const apertoQui = dellAtto.some((q) => quadroSbloccato(q.numero, progressi));
        return (
          <section key={atto.nome} className={`pl-atto ${apertoQui ? '' : 'pl-atto--chiuso'}`}>
            <header className="pl-atto__testata">
              <h2 className="pl-atto__nome">{atto.nome}</h2>
              <span className="pl-atto__conteggio">{fattiQui}/{dellAtto.length}</span>
            </header>

            <ol className="pl-tappe">
              {dellAtto.map((quadro) => {
                const fatto = progressi[quadro.numero];
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

            {apertoQui ? (
              <p className="pl-atto__obiettivo">
                {(() => {
                  const prossima = dellAtto.find((q) => q.numero === corrente);
                  return prossima
                    ? `${t('quadri.quadro').replace('{n}', prossima.numero)} · ${descriviObiettivi(prossima, t)} · ${prossima.maxMosse} ${t('quadri.mosse').toLowerCase()}`
                    : '';
                })()}
              </p>
            ) : (
              <p className="pl-atto__obiettivo">{t('quadri.bloccato')}</p>
            )}
          </section>
        );
      })}

      {/* Ricominciare da capo. In fondo alla mappa, dopo tutti i livelli: chi la cerca
          la trova, chi non la cerca non ci inciampa. */}
      <div className="pl-ricomincia">
        {superati === 0 ? null : passoConferma === 0 ? (
          <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo"
                  onClick={() => setPassoConferma(1)}>
            {t('quadri.ricomincia')}
          </button>
        ) : passoConferma === 1 ? (
          <>
            <p className="pl-nota pl-nota--allarme">
              {t('quadri.ricominciaAvviso').replace('{n}', numero(superati))}
            </p>
            <div className="pl-segmenti">
              <button type="button" className="pl-btn pl-btn--fantasma"
                      onClick={() => setPassoConferma(0)}>
                {t('comune.no')}
              </button>
              <button type="button" className="pl-btn" onClick={() => setPassoConferma(2)}>
                {t('comune.si')}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Seconda conferma: dice cosa NON si perde, perche' il timore ragionevole
                a questo punto e' di star cancellando anche record e statistiche. */}
            <p className="pl-nota pl-nota--allarme">{t('quadri.ricominciaSicuro')}</p>
            <p className="pl-nota">{t('quadri.ricominciaResta')}</p>
            <div className="pl-segmenti">
              <button type="button" className="pl-btn pl-btn--fantasma"
                      onClick={() => setPassoConferma(0)}>
                {t('comune.no')}
              </button>
              <button type="button" className="pl-btn pl-btn--pericolo"
                      onClick={() => { azzeraProgressi(); setPassoConferma(0); onAzzerato?.(); }}>
                {t('quadri.ricominciaConferma')}
              </button>
            </div>
          </>
        )}
      </div>
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
