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

/**
 * La carriola: vasca, ruota e manici.
 *
 * Prima era una gru, e una gru non e' un attrezzo da cassetta: e' una macchina, e stonava
 * in fila con gessetto, piccone e mensola, che sono tutti oggetti che si tengono in mano.
 * La carriola fa anche il gesto giusto: carichi il blocco che non ti va, lo porti via e
 * torni con un altro.
 */
function IconaCarriola() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h9l3.4 7H7.5z" />
      <path d="M16.4 14 21 18" />
      <path d="M7.5 14 5.4 18" />
      <circle cx="9.2" cy="19.2" r="1.9" />
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

/**
 * La cassetta: e' il MAGAZZINO, non uno degli attrezzi.
 *
 * Prima la pastiglia disegnava la carriola, e guardandola si capiva "ho una carriola" invece di
 * "ho un attrezzo, e scelgo io quale". Segnalato da chi giocava: "non riesco a capire
 * quale attrezzo ho a disposizione". La risposta e' che non ne hai uno in particolare
 * -- ne hai TANTI QUANTI dicono i pallini, e quale diventa lo decidi quando lo usi --
 * e un'icona che nomina un attrezzo solo diceva il contrario.
 */
function IconaCassetta() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true" fill="none"
         stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8.5" width="18" height="11" rx="1.6" />
      <path d="M9 8.5V6.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M3 13h18" />
    </svg>
  );
}

const ICONE = {
  carriola: IconaCarriola, gessetto: IconaGessetto, piccone: IconaPiccone, mensola: IconaMensola,
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
      <IconaCassetta />
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

        {/* QUANTI NE HAI, SCRITTO. Il numero c'era solo nell'etichetta per i lettori di
            schermo e nei pallini della pastiglia, e i pallini da soli non dicono che
            cosa contano. Chi apriva il pannello vedeva quattro voci tutte accese e
            capiva "ho tutti e quattro gli attrezzi", mentre ne ha UNO e sceglie quale
            farne. Segnalato da chi giocava. */}
        {quanti > 0 ? (
          <p className="pl-attrezzi__conto">
            {t(quanti === 1 ? 'attrezzi.quantiHaiUno' : 'attrezzi.quantiHai').replace('{n}', quanti)}
          </p>
        ) : null}

        {/* CON IL MAGAZZINO VUOTO L'ELENCO C'E' LO STESSO, come legenda.
            Prima a zero attrezzi si leggeva solo "ne guadagni uno ogni 5 livelli": chi
            non ne aveva ancora avuto uno sapeva COME ottenerli e non sapeva CHE COSA
            fossero, cioe' l'unica cosa che poteva fargli venire voglia di ottenerli. La
            paura era di mostrare pulsanti spenti che non dicono perche', e resta giusta:
            infatti a zero non sono pulsanti, sono voci. Si vede quello che ti aspetta, e
            non c'e' niente da premere per sbaglio. */}
        {quanti === 0 ? (
          <p className="pl-attrezzi__vuoto">
            {t('attrezzi.comeSiGuadagnano').replace('{n}', ogniLivelli)}
          </p>
        ) : null}

        <div className={`pl-attrezzi__scelte ${quanti === 0 ? 'pl-attrezzi__scelte--legenda' : ''}`}>
          {ATTREZZI.map((nome) => {
            const Icona = ICONE[nome];
            const contenuto = (
              <>
                <span className="pl-attrezzi__icona"><Icona /></span>
                <span className="pl-attrezzi__testi">
                  <strong>{t(`attrezzi.${nome}`)}</strong>
                  <span>{t(`attrezzi.${nome}Spiega`)}</span>
                </span>
              </>
            );
            return quanti === 0 ? (
              <div key={nome} className="pl-attrezzi__scelta pl-attrezzi__scelta--voce">
                {contenuto}
              </div>
            ) : (
              <button key={nome} type="button" className="pl-attrezzi__scelta"
                      disabled={disabilitati?.includes(nome)}
                      onClick={() => onScegli(nome)}>
                {contenuto}
              </button>
            );
          })}
        </div>

        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onChiudi}>
          {t('comune.tornaAllaPartita')}
        </button>
      </div>
    </div>
  );
}


/**
 * LA MENSOLA A SCHERMO: il pezzo messo da parte.
 *
 * STA DENTRO LA RIGA CHE C'ERA GIA', non in una riga sua. La prima versione si prendeva
 * una striscia fra la plancia e i pezzi, e su un telefono quella striscia la paga il
 * tabellone: la griglia si rimpiccioliva appena si usava l'attrezzo. Un aiuto che come
 * prima cosa ti restringe il tavolo da gioco e' un aiuto che costa.
 *
 * La riga sotto la plancia e' una griglia di tre colonne, con la pastiglia degli attrezzi
 * a destra e il messaggio al centro: la colonna di SINISTRA era vuota e larga uguale a
 * quella della pastiglia. La mensola ci sta dentro senza rubare un pixel in altezza.
 *
 * E' un <button> e basta, senza involucri: quella riga e' un <p>, e un <div> dentro un
 * <p> lo chiude a meta' -- il browser lo fa da solo, in silenzio, e il risultato e' un
 * pezzo di interfaccia che finisce fuori posto senza che nessuno abbia sbagliato a
 * scrivere il CSS.
 *
 * Senza etichetta scritta: il nome lo dice il pannello nell'istante in cui lo scegli, e
 * chi usa un lettore di schermo lo sente dall'etichetta accessibile. Una parola in piu'
 * qui vorrebbe dire togliere spazio al messaggio, che e' quello che si legge giocando.
 */
export function Mensola({ pezzo, onRiprendi, t }) {
  if (!pezzo) return null;
  return (
    <button
      type="button"
      className="pl-mensola"
      onClick={onRiprendi}
      /* L'etichetta dice COSA FA, non come si chiama: "Riprendi il pezzo dalla mensola"
         e' quello che serve sapere a chi la sente, e non si confonde con la voce del
         pannello che si chiama "La mensola". */
      aria-label={t('attrezzi.mensolaRiprendi')}
    >
      <Pezzo shape={pezzo.shape} color={pezzo.color} bombe={pezzo.bombe} cella={11} />
    </button>
  );
}
