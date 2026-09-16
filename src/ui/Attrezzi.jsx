import { useEffect } from 'react';
import { ATTREZZI } from '../persistence/attrezzi.js';
import { Pezzo } from './Pezzo.jsx';

/**
 * Gli attrezzi del cantiere, a schermo.
 *
 * TRE COSE DA GUARDARE, E OGNUNA HA UNA RAGIONE.
 *
 * 1. IL MAGAZZINO SI VEDE SEMPRE, ANCHE VUOTO. Una pastiglia con tre posti: pieni quelli
 *    che hai, vuoti gli altri. Un numero solo direbbe quanti ne hai; i posti vuoti dicono
 *    anche quanti ne stanno ancora, che e' l'informazione che serve a capire perche' uno
 *    maturato puo' andare perso. Nascondere la pastiglia a zero sarebbe peggio: chi non
 *    ha mai visto un attrezzo non saprebbe che esistono.
 *
 * 2. APRIRE NON COSTA. Il pannello si puo' guardare, leggere e chiudere senza spendere
 *    niente: l'attrezzo si scala solo quando l'effetto si applica davvero. Con zero
 *    attrezzi il pannello si apre lo stesso e spiega come si guadagnano, invece di
 *    lasciare un pulsante spento che non dice niente.
 *
 * 3. SI ESCE DA OGNI PARTE. Escape, tocco fuori, e il pulsante "Torna alla partita": e'
 *    un pannello che si apre in mezzo a una partita a mosse contate, e restare
 *    intrappolati dentro un menu mentre si sta giocando e' il modo piu' veloce di far
 *    perdere una mossa a qualcuno.
 */

/** La gru: braccio, cavo e gancio. Cambia un pezzo. */
function IconaGru() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 21h6" />
      <path d="M8 21V4" />
      <path d="M8 4h11" />
      <path d="M8 4 4 9" />
      <path d="M16 4v5" />
      <rect x="13.5" y="9" width="5" height="4" rx="1" />
    </svg>
  );
}

/** Il gessetto: il gesso e il segno che lascia. Dice dove appoggiare. */
function IconaGessetto() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 3.5 20.5 7.5 9 19H5v-4z" />
      <path d="M14 6 18 10" />
      <path d="M4.5 4.5h3M6 3v3" />
    </svg>
  );
}

/** Il piccone: manico e punta. Toglie una casella. */
function IconaPiccone() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9q9-6 18 0" />
      <path d="M12 6.2V11" />
      <path d="M11.4 11 4.5 20.5" />
    </svg>
  );
}

/** La mensola: la tavola a muro e il pezzo che ci sta sopra. */
function IconaMensola() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h18" />
      <path d="M6 14l-2 4" />
      <path d="M18 14l2 4" />
      <rect x="8.5" y="5" width="7" height="7" rx="1.2" />
    </svg>
  );
}

const ICONE = {
  gru: IconaGru, gessetto: IconaGessetto, piccone: IconaPiccone, mensola: IconaMensola,
};

export { IconaMensola };

/** La pastiglia: quanti attrezzi hai, e quanti posti restano. */
export function MagazzinoAttrezzi({ quanti, massimo, onApri, t }) {
  return (
    <button
      type="button"
      className={`pl-attrezzi__pastiglia ${quanti === 0 ? 'pl-attrezzi__pastiglia--vuota' : ''}`}
      onClick={onApri}
      aria-label={`${t('attrezzi.titolo')}: ${quanti} ${t('attrezzi.su')} ${massimo}`}
    >
      <IconaGru />
      <span className="pl-attrezzi__posti" aria-hidden="true">
        {Array.from({ length: massimo }, (_, i) => (
          <span key={i} className={`pl-attrezzi__posto ${i < quanti ? 'pl-attrezzi__posto--pieno' : ''}`} />
        ))}
      </span>
    </button>
  );
}

/** Il pannello di scelta. */
export function PannelloAttrezzi({ quanti, ogniLivelli, disabilitati, onScegli, onChiudi, t }) {
  useEffect(() => {
    const esci = (e) => { if (e.key === 'Escape') onChiudi(); };
    window.addEventListener('keydown', esci);
    return () => window.removeEventListener('keydown', esci);
  }, [onChiudi]);

  return (
    <div className="pl-velo" onClick={onChiudi}>
      <div className="pl-attrezzi__pannello" role="dialog" aria-modal="true"
           aria-label={t('attrezzi.titolo')} onClick={(e) => e.stopPropagation()}>
        <p className="pl-attrezzi__intestazione">{t('attrezzi.titolo')}</p>

        {quanti === 0 ? (
          /* Con il magazzino vuoto si spiega come si riempie, invece di mostrare due voci
             spente: un pulsante che non si puo' premere e non dice perche' e' un vicolo. */
          <p className="pl-attrezzi__vuoto">
            {t('attrezzi.comeSiGuadagnano').replace('{n}', ogniLivelli)}
          </p>
        ) : (
          <div className="pl-attrezzi__scelte">
            {ATTREZZI.map((nome) => {
              const Icona = ICONE[nome];
              return (
                <button key={nome} type="button" className="pl-attrezzi__scelta"
                        disabled={disabilitati?.includes(nome)}
                        onClick={() => onScegli(nome)}>
                  <span className="pl-attrezzi__icona"><Icona /></span>
                  <span className="pl-attrezzi__testi">
                    <strong>{t(`attrezzi.${nome}`)}</strong>
                    <span>{t(`attrezzi.${nome}Spiega`)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onChiudi}>
          {t('comune.tornaAllaPartita')}
        </button>
      </div>
    </div>
  );
}


/**
 * LA MENSOLA A SCHERMO: il pezzo messo da parte, sopra la mano.
 *
 * COMPARE SOLO QUANDO C'E' QUALCOSA SOPRA. Una mensola vuota fissa ruberebbe altezza
 * alla plancia per non dire niente, e l'altezza della plancia su un telefono e' la cosa
 * piu' contesa che ci sia: il caso normale -- nessun pezzo messo da parte -- non deve
 * pagare niente per una funzione che in quel momento non si sta usando.
 *
 * STA SOPRA LA MANO E NON DENTRO IL PANNELLO DEGLI ATTREZZI. Un pezzo messo da parte
 * che non si vede e' un pezzo dimenticato, e un aiuto dimenticato e' un aiuto sprecato.
 */
export function Mensola({ pezzo, inScambio, onRiprendi, onAnnullaScambio, t }) {
  if (!pezzo) return null;
  return (
    <div className="pl-mensola">
      <span className="pl-mensola__etichetta">{t('attrezzi.mensola')}</span>
      <button
        type="button"
        className="pl-mensola__posto"
        onClick={onRiprendi}
        aria-label={t('attrezzi.mensolaRiprendi')}
      >
        <Pezzo shape={pezzo.shape} color={pezzo.color} bombe={pezzo.bombe} cella={14} />
      </button>
      {inScambio ? (
        <span className="pl-attrezzi__invito pl-mensola__invito">
          {t('attrezzi.mensolaScambia')}
          <button type="button" className="pl-attrezzi__annulla" onClick={onAnnullaScambio}>
            {t('attrezzi.lasciaStare')}
          </button>
        </span>
      ) : null}
    </div>
  );
}
