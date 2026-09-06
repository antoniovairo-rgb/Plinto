import { useCallback, useState } from 'react';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../core/quadro.js';
import { summarize } from '../core/engine.js';
import { registraTentativo } from '../persistence/progressi.js';

/**
 * Gestisce la partita di un Quadro.
 *
 * Sta separato da usePartita di proposito. La partita libera e la Sfida del Giorno
 * durano a lungo e vanno salvate; un Quadro dura poche mosse, ha un seme fisso e si
 * riparte da capo in un secondo. Metterli nello stesso posto avrebbe significato
 * infilare condizioni dappertutto per una modalita' che si comporta in un altro modo.
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

  const apri = useCallback((definizione) => {
    setQuadro(definizione);
    setPartita(iniziaQuadro(definizione));
    setEsito(null);
    setRegistrato(false);
    setDaPresentare(true);
  }, []);

  const chiudi = useCallback(() => {
    setQuadro(null);
    setPartita(null);
    setEsito(null);
    setRegistrato(false);
    setDaPresentare(false);
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

  const gioca = useCallback((handIndex, row, col) => {
    if (!quadro) return;
    setPartita((prec) => {
      if (!prec) return prec;
      const dopo = giocaNelQuadro(quadro, prec, handIndex, row, col);
      if (dopo === prec) return prec;

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
        setEsito({ ...stato, miglioramento, primaVolta, riepilogo });
      }
      return dopo;
    });
  }, [quadro, registrato]);

  return {
    quadro,
    partita,
    esito,
    daPresentare,
    stato: quadro && partita ? statoQuadro(quadro, partita) : null,
    apri,
    avvia,
    chiudi,
    riprova,
    gioca,
  };
}
