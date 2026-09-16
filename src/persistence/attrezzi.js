/**
 * Gli attrezzi del cantiere: si guadagnano giocando, si spendono quando ci si blocca.
 *
 * COSA SONO. Una risorsa sola per piu' usi. Si guadagna un attrezzo ogni cinque livelli
 * superati, se ne tengono al massimo tre, e al momento di usarlo si sceglie quale:
 *   gru       cambia un pezzo della mano, senza toccare la griglia
 *   gessetto  segna dove conviene appoggiare, come si fa in cantiere col gesso
 *   piccone   toglie una casella gia' posata, quella che tocchi
 *   mensola   ci appoggi un pezzo e te lo riprendi quando vuoi
 *
 * UNA RISORSA SOLA, E NON E' PIGRIZIA: cosi' la scelta di quale attrezzo usare e' una
 * decisione del giocatore invece di una dotazione automatica. Con quattro contatori
 * separati non si sceglierebbe niente, si spenderebbe quello che avanza.
 *
 * IL TETTO FA PERDERE DAVVERO QUELLO CHE ARRIVA A MAGAZZINO PIENO, ed e' voluto. L'altra
 * strada -- tenere il credito in sospeso e consegnarlo appena si libera un posto --
 * sembra piu' gentile ma svuota il tetto di significato: chi arriva all'ultimo atto
 * avrebbe tre attrezzi in mano e diciassette in attesa, cioe' esattamente l'accumulo che
 * il tetto doveva impedire. Chi gioca deve saperlo prima, non scoprirlo dopo: quando il
 * magazzino e' pieno l'interfaccia lo dice.
 *
 * NIENTE ATTREZZI NELLA SFIDA DEL GIORNO. E' la stessa partita per tutti, e due punteggi
 * ottenuti con un numero diverso di attrezzi non sono piu' confrontabili.
 */

import { KEYS } from './storage.js';
import { leggiDocumento, scriviDocumento } from './documenti.js';

const VERSIONE = 1;

/** Un attrezzo ogni quanti livelli superati. */
export const OGNI_LIVELLI = 5;

/** Quanti se ne possono tenere da parte. */
export const MASSIMO = 3;

/** Gli attrezzi esistenti, nell'ordine in cui si mostrano. */
export const ATTREZZI = ['gru', 'gessetto', 'piccone', 'mensola'];

const PREDEFINITI = { disponibili: 0, riscossi: 0 };

/** @returns {{disponibili:number, riscossi:number, versione:number}} */
export function caricaAttrezzi() {
  return leggiDocumento(KEYS.ATTREZZI, { versione: VERSIONE, predefiniti: PREDEFINITI });
}

/**
 * Converte i livelli superati in attrezzi. Idempotente: si puo' chiamare a ogni apertura
 * di schermata senza regalare niente, perche' `riscossi` ricorda fin dove si e' gia'
 * pagato. Serve proprio cosi': un salvataggio importato da un altro dispositivo puo'
 * portare livelli che qui non erano mai stati convertiti.
 *
 * @param {number} superati quanti livelli risultano superati adesso
 * @returns {{attrezzi:object, guadagnati:number, persi:number}}
 *   `persi` sono quelli maturati e non entrati perche' il magazzino era pieno.
 */
export function riscuoti(superati) {
  const stato = caricaAttrezzi();
  const spettanti = Math.floor(Math.max(0, superati) / OGNI_LIVELLI);
  const nuovi = Math.max(0, spettanti - stato.riscossi);
  if (nuovi === 0) return { attrezzi: stato, guadagnati: 0, persi: 0 };

  const dopo = Math.min(MASSIMO, stato.disponibili + nuovi);
  const guadagnati = dopo - stato.disponibili;
  const aggiornato = { ...stato, disponibili: dopo, riscossi: spettanti };
  scriviDocumento(KEYS.ATTREZZI, VERSIONE, aggiornato);
  return { attrezzi: aggiornato, guadagnati, persi: nuovi - guadagnati };
}

/**
 * Spende un attrezzo. Restituisce false se il magazzino e' vuoto, e in quel caso non
 * scrive niente: chi chiama non deve poter applicare l'effetto di un attrezzo che non
 * c'era.
 */
export function usaAttrezzo() {
  const stato = caricaAttrezzi();
  if (stato.disponibili <= 0) return false;
  scriviDocumento(KEYS.ATTREZZI, VERSIONE, { ...stato, disponibili: stato.disponibili - 1 });
  return true;
}

/** Quanti ne restano, senza toccare niente. */
export function quantiAttrezzi() {
  return caricaAttrezzi().disponibili;
}

/** Il magazzino e' pieno? Serve a dirlo PRIMA che un attrezzo maturato vada perso. */
export function magazzinoPieno(stato = caricaAttrezzi()) {
  return stato.disponibili >= MASSIMO;
}
