/**
 * Generatore pseudo-casuale deterministico (mulberry32).
 *
 * Perche' non Math.random(): serve riproducibilita' per i test, per le simulazioni
 * di migliaia di partite e per la Sfida del Giorno (stesso seed = stessa partita).
 * Lo stato e' un singolo intero a 32 bit, quindi e' serializzabile dentro lo stato
 * di gioco senza strutture aggiuntive.
 */

/** Converte una stringa in un seed intero a 32 bit (algoritmo cyrb53 semplificato). */
export function seedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Un seed casuale da usare quando non serve riproducibilita'. */
export function randomSeed() {
  return (Math.random() * 4294967296) >>> 0;
}

/**
 * Avanza lo stato e restituisce [valoreFloat in [0,1), nuovoStato].
 * Funzione pura: nessuno stato nascosto.
 */
export function nextRandom(state) {
  let t = (state + 0x6d2b79f5) >>> 0;
  let r = t;
  r = Math.imul(r ^ (r >>> 15), r | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

/** Intero in [0, max). */
export function nextInt(state, max) {
  const [value, next] = nextRandom(state);
  return [Math.floor(value * max), next];
}

/**
 * Crea un piccolo oggetto mutabile attorno allo stato, comodo quando servono
 * molte estrazioni di fila (generatore, simulazioni). `rng.state` resta leggibile.
 */
export function createRng(state) {
  return {
    state: state >>> 0,
    float() {
      const [value, next] = nextRandom(this.state);
      this.state = next;
      return value;
    },
    int(max) {
      return Math.floor(this.float() * max);
    },
    pick(array) {
      return array[this.int(array.length)];
    },
  };
}
