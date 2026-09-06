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

  const apri = useCallback((definizione) => {
    setQuadro(definizione);
    setPartita(iniziaQuadro(definizione));
    setEsito(null);
    setRegistrato(false);
  }, []);

  const chiudi = useCallback(() => {
    setQuadro(null);
    setPartita(null);
    setEsito(null);
    setRegistrato(false);
  }, []);

  const riprova = useCallback(() => {
    if (quadro) apri(quadro);
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
        const registrazione = registraTentativo(quadro.numero, {
          superato: stato.completato,
          mosse: riepilogo.moves,
          punteggio: riepilogo.score,
        });
        setEsito({ ...stato, ...registrazione, riepilogo });
      }
      return dopo;
    });
  }, [quadro, registrato]);

  return {
    quadro,
    partita,
    esito,
    stato: quadro && partita ? statoQuadro(quadro, partita) : null,
    apri,
    chiudi,
    riprova,
    gioca,
  };
}
