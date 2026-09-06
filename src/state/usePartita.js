import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame, placePiece, serializeGame, deserializeGame, summarize, deadPieces,
} from '../core/engine.js';
import { read, write, remove, KEYS } from '../persistence/storage.js';
import { loadRecords, recordGame } from '../persistence/records.js';

/**
 * Collega il motore puro a React.
 *
 * Il motore non sa nulla di React e React non conosce le regole: qui c'e' l'unico
 * punto di contatto. Ogni mossa produce un nuovo stato immutabile, quindi il
 * rendering e' banale e non servono riconciliazioni manuali.
 *
 * La partita in corso viene salvata a ogni mossa: chiudere l'app o ricevere una
 * telefonata non deve costare la partita.
 */
export function usePartita() {
  const [partita, setPartita] = useState(null);
  const [record, setRecord] = useState(() => loadRecords());
  const [nuoviRecord, setNuoviRecord] = useState([]);
  const registrata = useRef(false);

  /** Riprende una partita salvata, se ce n'e' una ancora in corso. */
  const partitaSalvata = useCallback(() => {
    const raw = read(KEYS.CURRENT_GAME, null);
    if (!raw) return null;
    const stato = deserializeGame(raw);
    return stato && stato.status === 'playing' ? stato : null;
  }, []);

  const nuovaPartita = useCallback((opzioni = {}) => {
    registrata.current = false;
    setNuoviRecord([]);
    const stato = createGame(opzioni);
    setPartita(stato);
    write(KEYS.CURRENT_GAME, serializeGame(stato));
    return stato;
  }, []);

  const riprendi = useCallback(() => {
    const stato = partitaSalvata();
    if (!stato) return null;
    registrata.current = false;
    setNuoviRecord([]);
    setPartita(stato);
    return stato;
  }, [partitaSalvata]);

  const abbandona = useCallback(() => {
    setPartita(null);
    setNuoviRecord([]);
  }, []);

  const gioca = useCallback((handIndex, row, col) => {
    let esito = null;
    setPartita((prev) => {
      if (!prev) return prev;
      const dopo = placePiece(prev, handIndex, row, col);
      if (dopo === prev) return prev;         // mossa illegale: nessun effetto
      esito = dopo.lastMove;
      return dopo;
    });
    return esito;
  }, []);

  // Salvataggio automatico e registrazione dei record a fine partita.
  useEffect(() => {
    if (!partita) return;
    if (partita.status === 'playing') {
      write(KEYS.CURRENT_GAME, serializeGame(partita));
      return;
    }
    if (registrata.current) return;
    registrata.current = true;
    remove(KEYS.CURRENT_GAME);
    const esito = recordGame(summarize(partita));
    setRecord(esito.records);
    setNuoviRecord(esito.nuoviRecord);
  }, [partita]);

  return {
    partita,
    record,
    nuoviRecord,
    pezziMorti: partita ? deadPieces(partita) : [],
    riepilogo: partita ? summarize(partita) : null,
    nuovaPartita,
    riprendi,
    abbandona,
    gioca,
    cePartitaSalvata: () => partitaSalvata() !== null,
  };
}
