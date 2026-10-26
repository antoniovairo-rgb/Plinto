import { useEffect, useRef } from 'react';

/**
 * Dopo una ricarica, riprendersi le voci di cronologia messe prima (collaudo 1.21.6, B6).
 * Spento, l'hook riparte da zero voci e la ripresa del livello ne aggiunge altre due
 * sopra quelle rimaste: `mappa > home > home > home > uscito`. Interruttore per la prova
 * rosso/verde in `tests/e2e/correzioni.mjs`.
 */
export const ADOTTA_VOCI_DOPO_RICARICA = true;

/**
 * Interruttore G1 (collaudo 1.21.10): un cambio d'ancora non e' un Indietro.
 *
 * Aprire `#/sfida/<giorno>` con la scheda gia' aperta non faceva niente: il browser mette
 * una voce nuova di cronologia, SENZA il nostro `plinto`, e manda `popstate` prima di
 * `hashchange`. `suIndietro` lo prendeva per un Indietro: riduceva `messe`, chiamava
 * `normalizza` (che dalla home cancella l'ancora prima che `hashchange` la legga) e,
 * dalla partita, risaliva alla home. Acceso:
 *  - ogni voce nostra ha `plinto`, anche quella di partenza (`plinto: 0`) e anche dopo
 *    `scriviRotta`, che prima la riscriveva con `null` (`rotta.js`): senza, il ritorno
 *    alla home da una schermata qualunque sarebbe sembrato un cambio d'ancora;
 *  - un `popstate` su una voce senza `plinto` si ignora: la voce prende il gradino in cui
 *    si e', e decide `hashchange` / `usaRotta`.
 * Spento, torna il difetto: `npm run indietro` (caso G1) e' rosso.
 */
export const ANCORA_NON_E_INDIETRO = true;

/**
 * Interruttore PO-019: il primo giro resta il primo anche se React rifa' l'effetto.
 *
 * Con `<React.StrictMode>` e il server di sviluppo (quello su cui gira `npm run
 * correzioni`, anche in CI) React esegue ogni effetto due volte al montaggio. Il primo
 * giro spegneva `primoGiro`, il secondo trovava la home con due voci adottate e faceva
 * proprio quello che il commento di `primoGiro` vieta: `go(-2)`, mentre la ripresa del
 * livello rimetteva due voci. Se le due `pushState` arrivano prima che il browser compia
 * il `go(-2)`, la cronologia resta sulla voce di partenza con quattro voci sopra, e il
 * primo Indietro esce dal gioco: la corsa 161 della CI (caso B6). Acceso, il primo giro
 * finisce solo quando la profondita' cambia davvero; in produzione l'effetto gira una
 * volta per profondita', e non cambia niente. Spento, `npm run correzioni` (caso B6,
 * «go() dopo la ricarica») e' rosso. Rapporto: `docs/sviluppo/RAPPORTO-PO-019.md`.
 */
export const PRIMO_GIRO_REGGE_IL_DOPPIO_EFFETTO = true;

/** Il gradino scritto su una voce di cronologia, o null se la voce non e' nostra. */
function gradinoDi(stato) {
  const n = stato?.plinto;
  return Number.isInteger(n) && n >= 0 ? n : null;
}

/** Quante voci nostre stanno sotto quella corrente, lette dalla cronologia. */
function vociGiaMesse() {
  try {
    const n = window.history.state?.plinto;
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

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
  //
  // DOPO UNA RICARICA la cronologia NON riparte: le voci messe prima ci sono ancora, e
  // ognuna si ricorda il suo gradino (`{ plinto: n }`). Ripartire da zero le lasciava li'
  // a vuoto e ne aggiungeva altre: due Indietro che non facevano niente per ogni
  // ricarica dentro un livello (collaudo 1.21.6, B6). Quindi si parte da quelle.
  const messe = useRef(null);
  if (messe.current === null) messe.current = ADOTTA_VOCI_DOPO_RICARICA ? vociGiaMesse() : 0;
  // Il primo giro dell'effetto avviene con la home, PRIMA che la ripresa riporti dentro
  // il livello (`App.jsx`, effetto della ripresa): se qui si tornasse indietro delle voci
  // adottate, la ripresa ne rimetterebbe due mentre `go()` e' ancora in viaggio, e i
  // conti salterebbero. Al primo giro quindi si aggiunge se serve, ma non si toglie: se
  // la ripresa non c'e', le voci in piu' si consumano alla prossima risalita.
  const primoGiro = useRef(true);
  // La profondita' con cui si e' montato: finche' non cambia, si e' ancora al primo giro.
  const profonditaIniziale = useRef(profondita);
  // Quanti `popstate` in arrivo sono provocati da noi e non dall'utente.
  const daIgnorare = useRef(0);
  const passo = useRef(passoIndietro);
  passo.current = passoIndietro;
  const rimetti = useRef(normalizza);
  rimetti.current = normalizza;

  useEffect(() => {
    try {
      // G1: anche la voce di partenza e' nostra, cosi' tornarci non sembra un'ancora.
      if (ANCORA_NON_E_INDIETRO && primoGiro.current && gradinoDi(window.history.state) === null) {
        window.history.replaceState({ ...(window.history.state ?? {}), plinto: messe.current }, '');
      }
      if (profondita > messe.current) {
        for (let i = messe.current; i < profondita; i += 1) {
          window.history.pushState({ plinto: i + 1 }, '');
        }
        messe.current = profondita;
      } else if (profondita < messe.current && !primoGiro.current) {
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
    if (!PRIMO_GIRO_REGGE_IL_DOPPIO_EFFETTO || profondita !== profonditaIniziale.current) {
      primoGiro.current = false;
    }
  }, [profondita]);

  useEffect(() => {
    const suIndietro = (evento) => {
      // G1: una voce senza `plinto` l'ha messa il browser per un'ancora nuova, non e' un
      // ritorno su una voce nostra. Si adotta al gradino corrente e non si tocca niente:
      // ne' la schermata, ne' l'ancora, ne' il conto delle voci.
      if (ANCORA_NON_E_INDIETRO && daIgnorare.current === 0 && gradinoDi(evento?.state) === null) {
        try {
          window.history.replaceState({ plinto: messe.current }, '');
        } catch {
          // Senza cronologia scrivibile si perde solo l'adozione della voce.
        }
        return;
      }
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
