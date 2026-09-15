import { Plinto } from '../Plinto.jsx';
import { OPERE } from '../../config/quadri.js';
import { CondividiTrionfo } from '../Condividi.jsx';

/**
 * La schermata di chi ha finito TUTTI i livelli.
 *
 * E' l'unico momento in cui il gioco alza la voce, e per questo e' anche l'unico in cui
 * puo' permetterselo: chi arriva qui ha giocato cento livelli, e liquidarlo con la
 * stessa schermata del livello 37 sarebbe la cosa piu' fredda che il gioco possa fare.
 *
 * TRE COSE, IN QUEST'ORDINE, PERCHE' E' L'ORDINE IN CUI CONTANO.
 *
 * 1. La festa. Blocchi che cadono nei sei colori del gioco, Plinto che salta, il titolo
 *    che entra. Esagerata rispetto a tutto il resto, ma dentro il carattere: sono i
 *    pezzi del gioco, non fuochi d'artificio presi altrove.
 * 2. I numeri del percorso. Sono la parte che non si puo' inventare: mosse spese,
 *    livelli caduti al primo colpo, il livello che ha resistito di piu'. Servono a dire
 *    "questo l'hai fatto tu", che e' una cosa diversa da "bravo".
 * 3. Cosa succede adesso. Onesta, senza date: altri livelli sono in lavorazione, e
 *    quando ci saranno si troveranno qui. Promettere un mese sarebbe la cosa piu' facile
 *    da scrivere e la piu' facile da tradire, e chi ha finito cento livelli e' proprio
 *    la persona che tornerebbe a controllare.
 *
 * LA PIOGGIA E' DECORATIVA E DICHIARATA TALE: `aria-hidden`, nessun testo, e sparisce
 * del tutto con il moto ridotto. Chi ascolta il gioco sente il titolo, i numeri e
 * l'annuncio -- cioe' tutto quello che significa qualcosa.
 */

/** Quanti blocchi cadono. Ventiquattro: piena a vedersi, leggera da animare. */
const BLOCCHI_PIOGGIA = 24;

/**
 * Le posizioni della pioggia sono FISSE, non casuali.
 *
 * Il generatore casuale del gioco e' seminato -- ci gira sopra la Sfida del Giorno -- e
 * pescare da li' per una decorazione cambierebbe la partita di chi gioca. Math.random()
 * eviterebbe quel problema ma ne porta un altro: la stessa schermata renderizzata due
 * volte (React in modalita' rigorosa lo fa) muoverebbe i blocchi sotto gli occhi.
 * Una serie scritta a mano non ha nessuno dei due difetti e si vede identica.
 */
const PIOGGIA = Array.from({ length: BLOCCHI_PIOGGIA }, (_, i) => ({
  sinistra: (i * 37) % 100,
  ritardo: (i * 83) % 900,
  durata: 1400 + ((i * 173) % 900),
  colore: (i % 6) + 1,
  lato: 14 + ((i * 7) % 12),
}));

export function SchermoTrionfo({
  riepilogo, animazioni = true, onElenco, onLibera, t,
}) {
  return (
    <div className="pl-screen pl-trionfo">
      {animazioni ? (
        <div className="pl-pioggia" aria-hidden="true">
          {PIOGGIA.map((b, i) => (
            <span
              key={i}
              className="pl-pioggia__blocco"
              style={{
                left: `${b.sinistra}%`,
                width: `${b.lato}px`,
                height: `${b.lato}px`,
                background: `var(--pl-block-${b.colore})`,
                animationDelay: `${b.ritardo}ms`,
                animationDuration: `${b.durata}ms`,
              }}
            />
          ))}
        </div>
      ) : null}

      <div className="pl-scroll pl-trionfo__dentro">
        <div className={`pl-trionfo__plinto ${animazioni ? 'pl-festa' : ''}`}>
          <Plinto espressione="contento" dimensione={112} className="pl-plinto--vivo" />
        </div>

        {/* Titolo e sottotitolo stanno dentro un VELO, e non e' una scelta estetica.

            I blocchi cadono dietro il testo -- questo e' garantito e provato -- ma
            "dietro" non basta: un quadrato pieno di colore dietro una parola lascia la
            parola leggibile solo se i due colori contrastano, e qui i colori dei blocchi
            sono sei e capitano dove capita. E' esattamente il difetto gia' trovato con
            le frasi di incitamento sulla griglia, dove il contrasto misurato scendeva a
            1,09: li' si e' risolto con un velo, e la soluzione vale qui uguale.

            I riquadri dei numeri e dell'annuncio il problema non ce l'hanno: hanno gia'
            un fondo pieno. Il velo serve solo al testo nudo. */}
        <div className="pl-trionfo__intestazione">
          <h1 className="pl-trionfo__titolo">
            {t('trionfo.titolo').replace('{opera}', t(`opere.${OPERE[0].id}`))}
          </h1>
          <p className="pl-trionfo__sotto">
            {t('trionfo.sotto').replace('{totale}', riepilogo.totale)}
          </p>
        </div>

        {/* I numeri del percorso. Ognuno esiste solo se ha qualcosa da dire: una riga
            "0 al primo colpo" non e' un dato, e' un rimprovero. */}
        <div className="pl-trionfo__numeri">
          <Numero valore={riepilogo.superati} etichetta={t('trionfo.livelli')} />
          {riepilogo.mosseTotali > 0 ? (
            <Numero valore={riepilogo.mosseTotali} etichetta={t('trionfo.mosse')} />
          ) : null}
          {riepilogo.alPrimoColpo > 0 ? (
            <Numero valore={riepilogo.alPrimoColpo} etichetta={t('trionfo.primoColpo')} />
          ) : null}
        </div>

        {riepilogo.piuOstinato ? (
          <p className="pl-trionfo__nota">
            {t('trionfo.ostinato')
              .replace('{n}', riepilogo.piuOstinato.numero)
              .replace('{tentativi}', riepilogo.piuOstinato.tentativi)}
          </p>
        ) : null}

        {/* L'annuncio dell'opera successiva. Sta QUI e in nessun altro posto: alla fine
            della prima si vede la seconda, e non prima. Metterla anche nella mappa dei
            livelli vorrebbe dire mostrarla a chi e' al livello 3, cioe' promettere una
            cosa che non esiste a chi non ha ancora finito quella che esiste.

            Senza date: vedi il commento in testa al file. La Torre non ha livelli dietro,
            e finche' non li ha si dice che e' in lavorazione, non che sta per arrivare. */}
        <div className="pl-trionfo__annuncio">
          <p className="pl-trionfo__annuncioTitolo">{t('trionfo.prossimiTitolo')}</p>
          <p className="pl-trionfo__annuncioOpera">{t('opere.torre')}</p>
          <p className="pl-trionfo__annuncioTesto">{t('trionfo.prossimiTesto')}</p>
        </div>

        <CondividiTrionfo
          totale={riepilogo.totale}
          mosseTotali={riepilogo.mosseTotali}
          alPrimoColpo={riepilogo.alPrimoColpo}
          t={t}
        />
      </div>

      <div className="pl-fine__azioni">
        <button type="button" className="pl-btn pl-btn--primario pl-btn--largo" onClick={onLibera}>
          {t('trionfo.libera')}
        </button>
        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={onElenco}>
          {t('quadri.elenco')}
        </button>
      </div>
    </div>
  );
}

/** Un numero del riepilogo: la cifra grande, l'etichetta piccola sotto. */
function Numero({ valore, etichetta }) {
  return (
    <div className="pl-trionfo__numero">
      <strong>{valore}</strong>
      <span>{etichetta}</span>
    </div>
  );
}
