import { useEffect, useRef, useState } from 'react';

/**
 * Il tasto Indietro di Android, dentro un gioco che non ha un router.
 *
 * PERCHE' ESISTE. PLINTO cambia schermata con lo stato di React: la cronologia del
 * browser resta ferma su una sola voce, e il tasto Indietro trova subito il fondo. Sul
 * sito e' un dettaglio; nell'app installata dal Play Store e' un difetto grave, perche'
 * la' Indietro e' il gesto principale per uscire da una schermata, e chiudeva il gioco
 * di colpo da dentro un livello. L'ha trovato la prima persona che ha tenuto in mano
 * l'app: nessuna delle prove automatiche puo' premere un tasto di sistema.
 *
 * COME. Finche' c'e' qualcosa da cui tornare indietro, si tiene UNA voce fittizia nella
 * cronologia. Quando arriva `popstate` quella voce e' gia' stata consumata: si esegue un
 * passo indietro nel gioco e, se si resta dentro, se ne mette un'altra. Se invece si
 * torna alla home con un pulsante, la voce fittizia va tolta, altrimenti il primo
 * Indietro dalla home non farebbe niente e sembrerebbe un blocco.
 *
 * Non si toccano ne' il percorso ne' l'ancora: `#/sfida/AAAA-MM-GG` continua a essere
 * l'unico indirizzo del gioco, e questa voce e' senza indirizzo proprio.
 *
 * L'ANCORA. Il gioco riscrive `#/sfida/AAAA-MM-GG` sulla voce di cronologia corrente
 * (`scriviRotta`, che usa `replaceState` per non sporcare la cronologia). La voce
 * fittizia ne aggiunge un'altra sopra: tornando indietro si atterra su quella di prima,
 * che l'ancora ce l'ha ancora, e il gioco riapre la sfida invece di andare alla home.
 * Per questo, subito dopo un ritorno indietro provocato da noi, si chiama `normalizza`,
 * che rimette l'indirizzo giusto. Va fatto DENTRO il gestore di `popstate`, che per
 * specifica arriva prima di `hashchange`: cosi' chi ascolta l'ancora legge quella
 * corretta invece di quella appena lasciata.
 *
 * QUANDO SI RIMETTE LA VOCE. Dentro il gestore di `popstate`, non in un effetto. La
 * differenza si vede solo su un telefono: in una finestra di fiducia, Chrome decide se
 * chiudere l'applicazione in base a quante voci restano, e lo decide subito. Un effetto
 * di React arriva dopo il ridisegno -- sul browser da scrivania in tempo, nell'app
 * installata troppo tardi, e il secondo Indietro chiudeva il gioco dalla mappa dei
 * livelli invece di riportare alla home. Qui la voce c'e' gia' prima che il gestore
 * finisca.
 *
 * @param {boolean} dentro c'e' qualcosa da cui tornare indietro
 * @param {() => boolean} passoIndietro esegue UN passo indietro e dice se, dopo, c'e'
 *   ancora qualcosa da cui tornare
 * @param {() => void} [normalizza] rimette l'indirizzo coerente con la schermata
 */
export function useTastoIndietro(dentro, passoIndietro, normalizza) {
  // Stato e non riferimento, e la differenza non e' stilistica: passando da un livello
  // alla mappa si resta "dentro" in entrambi i casi, quindi un effetto che dipendesse
  // solo da `dentro` non ripartirebbe e la voce fittizia non verrebbe rimessa. Il
  // secondo Indietro uscirebbe dall'app. E' successo, e l'ha trovato tests/e2e/indietro.mjs.
  const [sentinella, setSentinella] = useState(false);
  // Il `popstate` provocato da noi stessi non e' una richiesta dell'utente.
  const nostro = useRef(false);
  const passo = useRef(passoIndietro);
  passo.current = passoIndietro;
  const rimetti = useRef(normalizza);
  rimetti.current = normalizza;

  useEffect(() => {
    try {
      if (dentro && !sentinella) {
        window.history.pushState({ plinto: 'indietro' }, '');
        setSentinella(true);
      } else if (!dentro && sentinella) {
        nostro.current = true;
        setSentinella(false);
        window.history.back();
      }
    } catch {
      // Un browser che non permette di scrivere la cronologia non deve rompere il gioco:
      // si perde solo il tasto Indietro, e i pulsanti sullo schermo restano.
    }
  }, [dentro, sentinella]);

  useEffect(() => {
    const suIndietro = () => {
      if (nostro.current) {
        nostro.current = false;
        rimetti.current?.();
        return;
      }
      rimetti.current?.();
      const restaDentro = passo.current();
      if (restaDentro) {
        // Subito, non fra un ridisegno: e' questa riga a impedire che il prossimo
        // Indietro chiuda l'app.
        window.history.pushState({ plinto: 'indietro' }, '');
      } else {
        setSentinella(false);
      }
    };
    window.addEventListener('popstate', suIndietro);
    return () => window.removeEventListener('popstate', suIndietro);
  }, []);
}

/**
 * Da quale schermata si torna a quale.
 *
 * E' la stessa cosa che fanno i pulsanti "indietro" disegnati sullo schermo, raccolta in
 * un posto solo: se le due strade divergessero, il tasto di sistema e il pulsante
 * porterebbero in due punti diversi.
 */
export const GENITORE = {
  gioco: 'home',
  quadro: 'quadri',
  quadri: 'home',
  archivio: 'home',
  profilo: 'home',
  statistiche: 'home',
  impostazioni: 'home',
  aiuto: 'home',
  info: 'home',
  sostieni: 'info',
};
