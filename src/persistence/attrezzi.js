/**
 * Gli attrezzi del cantiere: si guadagnano giocando, si spendono quando ci si blocca.
 *
 * COSA SONO. Una risorsa sola per piu' usi. Si guadagna un attrezzo ogni cinque livelli
 * superati, se ne tengono al massimo tre, e al momento di usarlo si sceglie quale:
 *   carriola       cambia un pezzo della mano, senza toccare la griglia
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
export const ATTREZZI = ['carriola', 'gessetto', 'piccone', 'mensola'];

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
 * QUALI LIVELLI PORTANO AL PROSSIMO ATTREZZO, per segnarli sulla mappa.
 *
 * L'attrezzo matura ogni OGNI_LIVELLI livelli SUPERATI, e non ai livelli 5, 10, 15: per
 * chi ne ha aperto uno per insistenza -- otto tentativi e si va avanti lo stesso -- i due
 * conti divergono, e un segno fisso sulla quinta casella direbbe una cosa falsa proprio a
 * chi ha gia' faticato di piu'.
 *
 * Quindi si conta come conta la regola. I livelli NON ancora superati, in ordine, sono
 * gli unici che possono far salire il totale: il k-esimo di quelli porta il conto a
 * `superati + k`, e dove quel numero e' un multiplo esatto si guadagna un attrezzo.
 *
 * E' una previsione, e si comporta da previsione: se salti un livello il segno si sposta
 * in avanti da solo, perche' quel livello non ha fatto salire il conto.
 *
 * Sta qui e non nella schermata perche' e' una regola sugli attrezzi, non un disegno: la
 * schermata la mostra, questa la decide, e cosi' si puo' provare senza un browser.
 *
 * @param {number[]} daSuperare i numeri dei livelli non ancora superati, in ordine
 * @param {number} superati quanti ne sono gia' stati superati
 * @returns {Set<number>} i numeri dei livelli su cui mettere il segno
 */
export function tappeDelProssimoAttrezzo(daSuperare, superati) {
  const segnate = new Set();
  daSuperare.forEach((numero, i) => {
    if ((superati + i + 1) % OGNI_LIVELLI === 0) segnate.add(numero);
  });
  return segnate;
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
