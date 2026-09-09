import { useEffect, useRef } from 'react';

/**
 * Il tasto Indietro di Android, dentro un gioco che non ha un router.
 *
 * PERCHE' ESISTE. PLINTO cambia schermata con lo stato di React: la cronologia del
 * browser resta ferma su una sola voce, e il tasto Indietro trova subito il fondo. Sul
 * sito e' un dettaglio; nell'app installata dal Play Store e' il gesto principale per
 * uscire da una schermata, e chiudeva il gioco da dentro un livello.
 *
 * COME, E PERCHE' COSI'. Si tiene in cronologia UNA VOCE PER OGNI LIVELLO DI PROFONDITA',
 * messa nel momento in cui si entra. Dalla home (0) alla mappa (1) se ne aggiunge una;
 * dalla mappa a un livello (2) un'altra. Il tasto Indietro consuma una voce e il gioco
 * risale di un gradino: i due conteggi restano allineati senza che nessuno debba
 * aggiungere niente mentre l'evento e' in corso.
 *
 * La versione precedente teneva una voce sola e la rimetteva DURANTE il ritorno indietro.
 * Sul browser da scrivania funzionava, e la prova automatica passava; nell'app installata
 * no, e il secondo Indietro chiudeva il gioco dalla mappa dei livelli. Non e' stato
 * possibile riprodurlo fuori da un telefono, e per questo la soluzione non e' un
 * tempismo migliore ma l'eliminazione del tempismo: qui, quando arriva un Indietro, la
 * voce che serve al prossimo c'e' gia' da prima.
 *
 * Quando si risale con un pulsante disegnato sullo schermo, invece, le voci in piu' vanno
 * tolte: si torna indietro di quanti gradini si e' saliti, e il `popstate` che ne deriva
 * si riconosce e si ignora. Senza, il primo Indietro dopo un pulsante non farebbe niente.
 *
 * L'ANCORA. Il gioco riscrive `#/sfida/AAAA-MM-GG` sulla voce corrente (`scriviRotta`,
 * che usa `replaceState`). Le voci lasciate indietro se la tengono: tornandoci sopra, il
 * gioco riaprirebbe la sfida invece di andare alla home. Per questo dopo ogni ritorno
 * indietro si chiama `normalizza`, dentro il gestore di `popstate`, che per specifica
 * arriva prima di `hashchange`: chi ascolta l'ancora legge quella giusta.
 *
 * @param {number} profondita quanti gradini si e' scesi dalla schermata iniziale
 * @param {() => void} passoIndietro risale di UN gradino
 * @param {() => void} [normalizza] rimette l'indirizzo coerente con la schermata
 */
export function useTastoIndietro(profondita, passoIndietro, normalizza) {
  // Quante voci abbiamo messo noi. Riferimento e non stato: cambia dentro il gestore di
  // un evento, e deve essere gia' aggiornato quando l'effetto lo rilegge.
  const messe = useRef(0);
  // Quanti `popstate` in arrivo sono provocati da noi e non dall'utente.
  const daIgnorare = useRef(0);
  const passo = useRef(passoIndietro);
  passo.current = passoIndietro;
  const rimetti = useRef(normalizza);
  rimetti.current = normalizza;

  useEffect(() => {
    try {
      if (profondita > messe.current) {
        for (let i = messe.current; i < profondita; i += 1) {
          window.history.pushState({ plinto: i + 1 }, '');
        }
        messe.current = profondita;
      } else if (profondita < messe.current) {
        // Si e' risaliti con un pulsante: le voci in piu' vanno consumate, altrimenti
        // il prossimo Indietro le troverebbe e sembrerebbe non fare niente.
        const gradini = messe.current - profondita;
        messe.current = profondita;
        daIgnorare.current += 1;   // `go(-n)` produce un solo popstate
        window.history.go(-gradini);
      }
    } catch {
      // Un browser che non permette di scrivere la cronologia non deve rompere il gioco:
      // si perde solo il tasto Indietro, e i pulsanti sullo schermo restano.
    }
  }, [profondita]);

  useEffect(() => {
    const suIndietro = () => {
      if (daIgnorare.current > 0) {
        daIgnorare.current -= 1;
        rimetti.current?.();
        return;
      }
      messe.current = Math.max(0, messe.current - 1);
      rimetti.current?.();
      passo.current();
    };
    window.addEventListener('popstate', suIndietro);
    return () => window.removeEventListener('popstate', suIndietro);
  }, []);
}

/**
 * Quanti gradini sotto la home sta ogni schermata.
 *
 * E' la stessa cosa che raccontano i pulsanti "indietro" disegnati sullo schermo, scritta
 * in un posto solo: se le due strade divergessero, il tasto di sistema e il pulsante
 * porterebbero in due punti diversi.
 */
export const PROFONDITA = {
  home: 0,
  gioco: 1,
  quadri: 1,
  quadro: 2,
  archivio: 1,
  profilo: 1,
  statistiche: 1,
  impostazioni: 1,
  aiuto: 1,
  info: 1,
  sostieni: 2,
};

/** Da quale schermata si torna a quale. */
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
