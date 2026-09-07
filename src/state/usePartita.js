import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame, placePiece, serializeGame, deserializeGame, summarize, deadPieces,
} from '../core/engine.js';
import { read, write, remove, chiavePartita } from '../persistence/storage.js';
import { loadRecords, recordGame } from '../persistence/records.js';
import { registraPartita } from '../persistence/profilo.js';
import { registraSfida } from '../persistence/sfide.js';
import { giornoDiOggi, sfidaGiocabile } from '../core/sfida.js';

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
  // 'libera' oppure 'sfida': cambia solo lo slot di salvataggio e la registrazione
  // del risultato. Le regole sono identiche, ed e' importante che restino tali.
  const [modalita, setModalita] = useState('libera');
  const [esitoSfida, setEsitoSfida] = useState(null);
  const [record, setRecord] = useState(() => loadRecords());
  const [nuoviRecord, setNuoviRecord] = useState([]);
  const registrata = useRef(false);

  /** Riprende una partita salvata, se ce n'e' una ancora in corso. */
  const partitaSalvata = useCallback((quale = 'libera') => {
    const raw = read(chiavePartita(quale), null);
    if (!raw) return null;
    const stato = deserializeGame(raw);
    return stato && stato.status === 'playing' ? stato : null;
  }, []);

  const nuovaPartita = useCallback((opzioni = {}, quale = 'libera') => {
    registrata.current = false;
    setNuoviRecord([]);
    setEsitoSfida(null);
    setModalita(quale);
    const stato = createGame(opzioni);
    setPartita(stato);
    write(chiavePartita(quale), serializeGame(stato));
    return stato;
  }, []);

  /**
   * Avvia la sfida di un giorno: il seme e' la data, quindi la partita e' uguale per
   * tutti quelli che giocano quel giorno.
   *
   * Il giorno e' un parametro perche' esiste l'archivio: le sfide passate non sono
   * salvate da nessuna parte, si RICALCOLANO dalla data. Un giorno non giocabile (il
   * futuro, o una data precedente alla prima sfida) non avvia niente e restituisce
   * null: il controllo sta qui e non solo nell'interfaccia, perche' l'indirizzo si puo'
   * scrivere a mano.
   */
  const nuovaSfida = useCallback((giorno = giornoDiOggi()) => (
    sfidaGiocabile(giorno) ? nuovaPartita({ seed: giorno }, 'sfida') : null
  ), [nuovaPartita]);

  const riprendi = useCallback((quale = 'libera') => {
    const stato = partitaSalvata(quale);
    if (!stato) return null;
    registrata.current = false;
    setNuoviRecord([]);
    setEsitoSfida(null);
    setModalita(quale);
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
      write(chiavePartita(modalita), serializeGame(partita));
      return;
    }
    if (registrata.current) return;
    registrata.current = true;
    remove(chiavePartita(modalita));
    const riepilogo = summarize(partita);
    const esito = recordGame(riepilogo);
    // Il profilo di gioco: entrano partita libera e sfida, non i livelli. I livelli
    // partono da griglie costruite a mano e falserebbero la mappa degli appoggi
    // facendola somigliare al loro disegno invece che al modo di giocare di chi guarda.
    registraPartita(riepilogo);
    setRecord(esito.records);
    setNuoviRecord(esito.nuoviRecord);
    // Il giorno della sfida e' quello della partita giocata, non quello di oggi: con
    // l'archivio le due cose non coincidono piu'. `seedLabel` conserva la data usata
    // come seme, quindi la partita sa da sola a quale giorno appartiene -- anche se e'
    // stata ripresa il giorno dopo averla lasciata a meta'.
    if (modalita === 'sfida') {
      setEsitoSfida(registraSfida(riepilogo.score, partita.seedLabel ?? giornoDiOggi()));
    }
  }, [partita, modalita]);

  return {
    partita,
    modalita,
    esitoSfida,
    record,
    nuoviRecord,
    pezziMorti: partita ? deadPieces(partita) : [],
    riepilogo: partita ? summarize(partita) : null,
    nuovaPartita,
    nuovaSfida,
    riprendi,
    abbandona,
    gioca,
    cePartitaSalvata: (quale = 'libera') => partitaSalvata(quale) !== null,
  };
}
