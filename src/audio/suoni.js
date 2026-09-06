/**
 * Audio di PLINTO — sintetizzato, non registrato.
 *
 * Non esiste un solo file audio nel progetto: ogni suono viene generato al momento
 * con oscillatori e inviluppi della Web Audio API. Tre motivi, in ordine di importanza:
 *   1. LICENZE: nessun campione di terzi, nessun dubbio su cosa si puo' pubblicare.
 *   2. PESO: zero byte scaricati, quindi il primo suono e' istantaneo.
 *   3. ESPRESSIVITA': il suono puo' seguire lo stato del gioco invece di essere fisso.
 *      La Catena, per esempio, sale davvero di intonazione mentre cresce.
 *
 * Scelte musicali: scala PENTATONICA MAGGIORE. Qualunque combinazione di note di
 * questa scala suona consonante, quindi anche una raffica di eliminazioni ravvicinate
 * resta piacevole invece di diventare un frastuono.
 *
 * Il contesto audio viene creato solo al primo gesto del giocatore: i browser
 * bloccano l'audio non richiesto, e sarebbe comunque scorretto partire da soli.
 */

/** Do maggiore pentatonica su piu' ottave, in hertz. */
const PENTATONICA = [
  261.63, 293.66, 329.63, 392.00, 440.00,
  523.25, 587.33, 659.25, 783.99, 880.00,
  1046.50, 1174.66, 1318.51, 1567.98, 1760.00,
];

let ctx = null;
let master = null;
let attivo = true;

/** Crea il contesto audio, se non esiste. Va chiamato dentro un gesto dell'utente. */
function assicuraContesto() {
  if (ctx) return ctx;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Accende o spegne l'audio (impostazione del giocatore). */
export function impostaAudio(acceso) {
  attivo = acceso;
}

/** Da chiamare al primo tocco: sblocca l'audio sui browser che lo sospendono. */
export function sbloccaAudio() {
  const c = assicuraContesto();
  if (c && c.state === 'suspended') c.resume().catch(() => {});
}

/**
 * Una nota con inviluppo percussivo.
 * @param {number} freq frequenza in hertz
 * @param {object} opzioni
 */
function nota(freq, {
  ritardo = 0, durata = 0.18, volume = 0.22, forma = 'triangle', attacco = 0.004, glide = 0,
} = {}) {
  const c = assicuraContesto();
  if (!c || !attivo) return;
  const t0 = c.currentTime + ritardo;

  const osc = c.createOscillator();
  osc.type = forma;
  osc.frequency.setValueAtTime(freq, t0);
  if (glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * glide), t0 + durata);

  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + attacco);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durata);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + durata + 0.02);
}

/** Un colpo di rumore filtrato: serve per i suoni "fisici" come l'appoggio. */
function rumore({ ritardo = 0, durata = 0.06, volume = 0.12, taglio = 1800 } = {}) {
  const c = assicuraContesto();
  if (!c || !attivo) return;
  const t0 = c.currentTime + ritardo;
  const campioni = Math.floor(c.sampleRate * durata);
  const buffer = c.createBuffer(1, campioni, c.sampleRate);
  const dati = buffer.getChannelData(0);
  for (let i = 0; i < campioni; i += 1) {
    dati[i] = (Math.random() * 2 - 1) * (1 - i / campioni);
  }
  const sorgente = c.createBufferSource();
  sorgente.buffer = buffer;

  const filtro = c.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.value = taglio;

  const gain = c.createGain();
  gain.gain.value = volume;

  sorgente.connect(filtro);
  filtro.connect(gain);
  gain.connect(master);
  sorgente.start(t0);
}

/** Nota della scala pentatonica, con indice limitato agli estremi. */
function gradino(indice) {
  return PENTATONICA[Math.max(0, Math.min(PENTATONICA.length - 1, indice))];
}

// --------------------------------------------------------------------------
// Voci del gioco. Ogni evento ha un suono riconoscibile anche a occhi chiusi.
// --------------------------------------------------------------------------

/** Pezzo preso dal tray: appena percettibile, si ripete centinaia di volte. */
export function suonoPresa() {
  rumore({ durata: 0.03, volume: 0.05, taglio: 2600 });
}

/** Pezzo appoggiato senza eliminazioni: un tonfo secco e sordo. */
export function suonoAppoggio() {
  rumore({ durata: 0.05, volume: 0.09, taglio: 1200 });
  nota(146.83, { durata: 0.09, volume: 0.1, forma: 'sine', glide: 0.7 });
}

/** Mossa rifiutata: nessun suono aggressivo, solo un tocco basso e breve. */
export function suonoRifiuto() {
  nota(110, { durata: 0.08, volume: 0.09, forma: 'sawtooth', glide: 0.85 });
}

/**
 * Eliminazione. L'arpeggio parte da un gradino piu' alto man mano che la Catena sale:
 * il giocatore SENTE la catena crescere prima ancora di leggere il numero.
 * @param {number} gruppi quanti gruppi sono stati chiusi
 * @param {number} catena livello di Catena prima della mossa
 */
export function suonoEliminazione(gruppi, catena) {
  const base = Math.min(9, catena);
  for (let i = 0; i < gruppi; i += 1) {
    nota(gradino(base + i * 2), {
      ritardo: i * 0.055,
      durata: 0.3,
      volume: 0.2,
      forma: 'triangle',
    });
    nota(gradino(base + i * 2 + 5), {
      ritardo: i * 0.055 + 0.01,
      durata: 0.24,
      volume: 0.08,
      forma: 'sine',
    });
  }
  rumore({ durata: 0.09, volume: 0.07, taglio: 5200 });
}

/** Mossa eccezionale: un accordo aperto sopra l'arpeggio. */
export function suonoGrandeCombo(catena) {
  const base = Math.min(8, catena);
  [0, 2, 4, 7].forEach((salto, i) => {
    nota(gradino(base + salto), { ritardo: i * 0.03, durata: 0.55, volume: 0.16, forma: 'triangle' });
  });
}

/** Griglia completamente svuotata: evento raro, merita un suono che nessun altro evento usa. */
export function suonoGrigliaVuota() {
  [0, 3, 5, 8, 10].forEach((g, i) => {
    nota(gradino(g), { ritardo: i * 0.07, durata: 0.7, volume: 0.17, forma: 'sine' });
  });
}

/** Nuovo record. */
export function suonoRecord() {
  [7, 9, 11, 14].forEach((g, i) => {
    nota(gradino(g), { ritardo: i * 0.09, durata: 0.5, volume: 0.2, forma: 'triangle' });
  });
}

/** Fine partita: una discesa breve, senza drammi. Perdere non e' una punizione. */
export function suonoFinePartita() {
  [6, 4, 2, 0].forEach((g, i) => {
    nota(gradino(g), { ritardo: i * 0.11, durata: 0.4, volume: 0.15, forma: 'sine' });
  });
}

/** Interazione con l'interfaccia. */
export function suonoBottone() {
  nota(523.25, { durata: 0.05, volume: 0.08, forma: 'sine' });
}
