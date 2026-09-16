import { useCallback, useEffect, useState } from 'react';
import { useAnnulla } from './useAnnulla.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../core/quadro.js';
import { summarize, serializeGame, deserializeGame } from '../core/engine.js';
import { registraTentativo, quantiSuperati } from '../persistence/progressi.js';
import { riscuoti, usaAttrezzo, quantiAttrezzi } from '../persistence/attrezzi.js';
import {
  cambiaPezzo, scavaCella, appoggiaSullaMensola, riprendiDallaMensola,
} from '../core/engine.js';
import { suggerisciMossa } from '../core/suggerimento.js';
import { read, write, remove, KEYS } from '../persistence/storage.js';
import { segnaPosto, dimenticaPosto } from '../persistence/ripresa.js';
import { quadroNumero } from '../config/quadri.js';

/**
 * Gestisce la partita di un Quadro.
 *
 * Sta separato da usePartita di proposito: la registrazione del risultato, lo sblocco
 * del livello successivo e la schermata di apertura sono cose che la partita libera non
 * ha, e infilarle li' avrebbe voluto dire condizioni dappertutto.
 *
 * ANCHE IL LIVELLO SI SALVA, e prima non era cosi'. Il motivo scritto qui era "un Quadro
 * dura poche mosse e si riparte da capo in un secondo": vale se sei tu a decidere di
 * uscire, non se il sistema butta via la pagina mentre rispondi al telefono. Misurato:
 * ricaricando a meta' del livello, in memoria restava solo `plinto:settings` e il
 * tentativo spariva. Adesso il livello si salva a ogni mossa come tutto il resto, e la
 * voce sparisce appena il livello finisce -- vinto o perso -- perche' una partita finita
 * non si riprende.
 *
 * Il risultato viene registrato UNA volta sola per tentativo: senza il controllo, il
 * ridisegno che segue la mossa finale lo registrerebbe di nuovo.
 */
export function useQuadro() {
  const [quadro, setQuadro] = useState(null);
  const [partita, setPartita] = useState(null);
  const [esito, setEsito] = useState(null);
  const [registrato, setRegistrato] = useState(false);
  // Vero finche' l'apertura con la spiegazione di Plinto e' ancora sullo schermo.
  const [daPresentare, setDaPresentare] = useState(false);

  // GLI ATTREZZI VIVONO QUI, e non in usePartita, ed e' la ragione per cui non esistono
  // nella Sfida del giorno: quella passa dall'altro gestore. La Sfida e' la stessa partita
  // per tutti, e due punteggi ottenuti con un numero diverso di attrezzi non sarebbero
  // piu' confrontabili.
  const [attrezzi, setAttrezzi] = useState(() => quantiAttrezzi());
  // Il consiglio del gessetto, finche' resta a schermo. Non e' stato della partita: la
  // partita non sa che esiste, ed e' esattamente la garanzia che si voleva.
  const [suggerimento, setSuggerimento] = useState(null);

  const apri = useCallback((definizione) => {
    setQuadro(definizione);
    setPartita(iniziaQuadro(definizione));
    setEsito(null);
    setRegistrato(false);
    setDaPresentare(true);
  }, []);

  const chiudi = useCallback(() => {
    // Uscire di propria volonta' cancella sia il salvataggio sia il posto: chi torna
    // all'elenco ha deciso di lasciare quel livello, e ritrovarcisi dentro al prossimo
    // avvio sarebbe il contrario di quello che ha chiesto.
    remove(KEYS.CURRENT_LEVEL);
    dimenticaPosto();
    setQuadro(null);
    setPartita(null);
    setEsito(null);
    setRegistrato(false);
    setDaPresentare(false);
  }, []);

  /**
   * Riprende il livello lasciato a meta', se ce n'e' uno leggibile.
   *
   * Controlla che il numero corrisponda a un livello che esiste davvero: la voce in
   * memoria puo' essere stata scritta da una versione con meno livelli, o modificata a
   * mano. Un livello inventato porterebbe su una schermata senza obiettivi.
   */
  const riprendiSalvato = useCallback(() => {
    const voce = read(KEYS.CURRENT_LEVEL, null);
    if (!voce || !Number.isFinite(voce.numero)) return null;
    const definizione = quadroNumero(voce.numero);
    if (!definizione) return null;
    const stato = deserializeGame(voce.partita);
    if (!stato || stato.status !== 'playing') return null;
    setQuadro(definizione);
    setPartita(stato);
    setEsito(null);
    setRegistrato(false);
    setDaPresentare(false);
    return definizione;
  }, []);

  /** Chiude l'apertura e comincia a giocare. */
  const avvia = useCallback(() => setDaPresentare(false), []);

  /**
   * Riprova dopo un fallimento.
   *
   * Non rimostra la spiegazione: l'obiettivo e' lo stesso ed e' stato letto meno di un
   * minuto fa. Dopo un Quadro fallito si vuole ritentare subito, e rileggere la stessa
   * schermata a ogni tentativo la trasformerebbe da aiuto in pedaggio. Resta comunque
   * raggiungibile: si torna all'elenco e si riapre il Quadro.
   */
  const riprova = useCallback(() => {
    if (!quadro) return;
    apri(quadro);
    setDaPresentare(false);
  }, [quadro, apri]);

  /**
   * Salva il livello in corso, a ogni cambiamento della partita.
   *
   * Sta in un effetto e non dentro `gioca` perche' cosi' copre anche il "rimetti a
   * posto": annullare una mossa cambia la partita senza passare da `gioca`, e senza
   * questo la copia salvata resterebbe quella di prima dell'annullamento. Sarebbe il
   * difetto peggiore di tutti, un salvataggio che esiste e racconta il falso.
   */
  useEffect(() => {
    if (!quadro || !partita || esito) return;
    // Finche' e' sullo schermo la presentazione di Plinto non si e' ancora giocato
    // niente, e non si salva niente. Non e' un risparmio: riprendendo da li' il
    // giocatore si ritroverebbe DENTRO il livello senza aver letto l'obiettivo, che e'
    // proprio la cosa che quella schermata esiste per dirgli. Senza salvataggio riparte
    // dalla home e riapre il livello leggendola, come la prima volta.
    if (daPresentare) return;
    write(KEYS.CURRENT_LEVEL, { numero: quadro.numero, partita: serializeGame(partita) });
    segnaPosto('quadro', quadro.numero);
  }, [quadro, partita, esito, daPresentare]);

  /**
   * Livello finito: si cancella il salvataggio.
   *
   * Sta in un effetto SUO e non nel ramo "altrimenti" di quello sopra, e la differenza
   * non e' di stile. Un unico effetto con la cancellazione nel caso `!quadro` avrebbe
   * cancellato il livello salvato AL MONTAGGIO, quando non c'e' ancora niente di aperto:
   * cioe' esattamente nell'istante in cui l'avvio sta per andarlo a riprendere. Il
   * salvataggio sarebbe sparito un attimo prima di essere letto, e il difetto si sarebbe
   * visto solo sul telefono vero.
   */
  useEffect(() => {
    if (!esito) return;
    remove(KEYS.CURRENT_LEVEL);
    dimenticaPosto();
  }, [esito]);

  const gioca = useCallback((handIndex, row, col) => {
    if (!quadro) return;
    setPartita((prec) => {
      if (!prec) return prec;
      const dopo = giocaNelQuadro(quadro, prec, handIndex, row, col);
      if (dopo === prec) return prec;
      setSuggerimento(null);

      const stato = statoQuadro(quadro, dopo);
      if (stato.finito && !registrato) {
        setRegistrato(true);
        const riepilogo = summarize(dopo);
        const { miglioramento, primaVolta } = registraTentativo(quadro.numero, {
          superato: stato.completato,
          mosse: riepilogo.moves,
          punteggio: riepilogo.score,
        });
        // Si prende SOLO cio' che serve alla schermata, invece di riversarci dentro
        // tutto quello che la funzione restituisce. Prima era `{ ...stato,
        // ...registrazione }`, e un campo omonimo dell'una sovrascriveva quello
        // dell'altra: la schermata di sconfitta chiamava .map() su un oggetto e il
        // gioco si spegneva. Elencare i campi costa una riga e chiude la categoria.
        // Il livello vinto la PRIMA volta puo' maturare un attrezzo. Si riscuote qui,
        // dove si sa che e' la prima volta: rigiocare un livello gia' vinto non paga.
        const paga = stato.completato && primaVolta ? riscuoti(quantiSuperati()) : null;
        if (paga) setAttrezzi(paga.attrezzi.disponibili);
        setEsito({
          ...stato, miglioramento, primaVolta, riepilogo,
          attrezzoGuadagnato: paga?.guadagnati ?? 0,
          attrezzoPerso: paga?.persi ?? 0,
        });
      }
      return dopo;
    });
  }, [quadro, registrato]);

  // Anche nei livelli: e' anzi il posto dove serve di piu', perche' li' ogni mossa e'
  // contata e uno scivolone costa il record.
  const { siPuoAnnullare, annulla } = useAnnulla(partita, setPartita);

  /**
   * LA GRU. L'attrezzo si scala SOLO se il cambio e' davvero avvenuto: `cambiaPezzo`
   * restituisce null su uno slot vuoto o a partita finita, e in quel caso il giocatore
   * non deve pagare niente.
   */
  const usaGru = useCallback((handIndex) => {
    if (!partita || quantiAttrezzi() <= 0) return false;
    const dopo = cambiaPezzo(partita, handIndex);
    if (!dopo) return false;
    if (!usaAttrezzo()) return false;
    setPartita(dopo);
    setAttrezzi(quantiAttrezzi());
    setSuggerimento(null);   // il consiglio di prima parlava di una mano che non c'e' piu'
    return true;
  }, [partita]);

  /** IL GESSETTO. Stessa regola: se non c'e' niente da consigliare, non si paga. */
  const usaGessetto = useCallback(() => {
    if (!quadro || !partita || quantiAttrezzi() <= 0) return false;
    const mossa = suggerisciMossa(quadro, partita);
    if (!mossa) return false;
    if (!usaAttrezzo()) return false;
    setSuggerimento(mossa);
    setAttrezzi(quantiAttrezzi());
    return true;
  }, [quadro, partita]);

  /**
   * IL PICCONE. Si paga solo se una casella viene tolta davvero: toccare una casella
   * gia' vuota non e' uno scavo, e' un dito storto, e un attrezzo perso per un dito
   * storto e' il modo piu' rapido di far odiare un aiuto.
   */
  const usaPiccone = useCallback((indice) => {
    if (!partita || quantiAttrezzi() <= 0) return false;
    const dopo = scavaCella(partita, indice);
    if (!dopo) return false;
    if (!usaAttrezzo()) return false;
    setPartita(dopo);
    setAttrezzi(quantiAttrezzi());
    // La griglia non e' piu' quella di cui parlava il gesso.
    setSuggerimento(null);
    return true;
  }, [partita]);

  /** LA MENSOLA: appoggiare costa un attrezzo. Stessa regola di sempre sul pagamento. */
  const usaMensola = useCallback((handIndex) => {
    if (!partita || quantiAttrezzi() <= 0) return false;
    const dopo = appoggiaSullaMensola(partita, handIndex);
    if (!dopo) return false;
    if (!usaAttrezzo()) return false;
    setPartita(dopo);
    setAttrezzi(quantiAttrezzi());
    setSuggerimento(null);   // il consiglio parlava di una mano che non c'e' piu'
    return true;
  }, [partita]);

  /** Riprendere NON costa: l'attrezzo si e' gia' pagato appoggiando il pezzo. */
  const riprendiMensola = useCallback((handIndex) => {
    if (!partita) return false;
    const dopo = riprendiDallaMensola(partita, handIndex);
    if (!dopo) return false;
    setPartita(dopo);
    setSuggerimento(null);
    return true;
  }, [partita]);

  /** Il segno del gesso si cancella appena si muove: parlava della mano di prima. */
  const scordaSuggerimento = useCallback(() => setSuggerimento(null), []);

  return {
    quadro,
    partita,
    siPuoAnnullare,
    annulla,
    esito,
    daPresentare,
    stato: quadro && partita ? statoQuadro(quadro, partita) : null,
    apri,
    avvia,
    chiudi,
    riprova,
    riprendiSalvato,
    gioca,
    attrezzi,
    suggerimento,
    usaGru,
    usaGessetto,
    usaPiccone,
    usaMensola,
    riprendiMensola,
    scordaSuggerimento,
  };
}
