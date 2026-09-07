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
 * Scelte musicali: scala PENTATONICA MINORE DI LA, dieci gradi, uno per ogni livello di
 * Catena (vedi audio/scala.js, dove le frequenze sono CALCOLATE e non trascritte). In una
 * pentatonica qualunque combinazione di note suona consonante, quindi anche una raffica
 * di eliminazioni ravvicinate resta piacevole invece di diventare un frastuono.
 *
 * IL SUONO DICE IL LIVELLO DI CATENA. Non e' decorazione: si deve capire a orecchio se
 * la Catena sta salendo o scendendo senza guardare la barra. E' anche un guadagno di
 * accessibilita' reale -- l'ultima chiamata, cioe' "la prossima mossa a vuoto ti costa il
 * moltiplicatore", passava solo dagli occhi.
 *
 * Il contesto audio viene creato solo al primo gesto del giocatore: i browser
 * bloccano l'audio non richiesto, e sarebbe comunque scorretto partire da soli. Quando la
 * scheda passa in secondo piano il contesto viene sospeso: un gioco che continua a
 * suonare da una scheda che non guardi piu' e' il modo piu' rapido di farsi silenziare
 * per sempre.
 */

import {
  frequenzaDiCatena, frequenzaCatenaGiu, noteIntreccio, frequenzaDiGrado,
} from './scala.js';


let ctx = null;
let master = null;
let attivo = true;

/**
 * Tetto di voci simultanee.
 *
 * Ogni nota crea un oscillatore e un guadagno. Senza un tetto, una raffica di
 * eliminazioni con bombe puo' aprirne decine nello stesso istante: il suono diventa
 * fango e la memoria cresce. Oltre il tetto le note nuove vengono semplicemente saltate
 * -- meglio una nota in meno che un rumore in piu'.
 */
const VOCI_MAX = 24;
let vociVive = 0;

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

/**
 * Silenzio quando la scheda non e' in primo piano.
 *
 * Registrato una volta sola, e non fa nulla finche' un contesto non esiste: se il
 * giocatore non ha mai toccato niente, non c'e' niente da sospendere.
 */
try {
  document.addEventListener('visibilitychange', () => {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (attivo) ctx.resume().catch(() => {});
  });
} catch {
  // Nessun documento (test in Node): il gioco non ne ha bisogno per funzionare.
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

  if (vociVive >= VOCI_MAX) return;

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

  // I nodi vanno SCOLLEGATI a fine inviluppo. Un oscillatore fermo ma ancora connesso
  // resta agganciato al grafo audio: e' una perdita di memoria lenta, invisibile in una
  // partita di prova e misurabile dopo centinaia di mosse -- cioe' esattamente cio' che
  // `npm run soak` va a cercare.
  vociVive += 1;
  osc.onended = () => {
    vociVive = Math.max(0, vociVive - 1);
    try { osc.disconnect(); gain.disconnect(); } catch { /* gia' scollegati */ }
  };
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
  sorgente.onended = () => {
    try { sorgente.disconnect(); filtro.disconnect(); gain.disconnect(); } catch { /* gia' */ }
  };
}

/**
 * Nota della scala, per grado, con le ottave sopra il decimo grado.
 *
 * Il gioco aveva DUE scale: una pentatonica di Do maggiore per le celebrazioni e questa
 * per la Catena. Due scale nello stesso gioco stonano fra loro -- non abbastanza da far
 * dire "e' sbagliato", abbastanza da far suonare tutto un po' storto. Adesso ce n'e' una.
 */
function gradino(indice) {
  return frequenzaDiGrado(indice);
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
  // Le note vengono dalla scala: la prima E' il livello di Catena applicato, le
  // successive salgono di un grado per ogni gruppo chiuso insieme.
  noteIntreccio(gruppi, catena).forEach((freq, i) => {
    nota(freq, { ritardo: i * 0.055, durata: 0.3, volume: 0.2, forma: 'triangle' });
    nota(freq * 2, { ritardo: i * 0.055 + 0.01, durata: 0.24, volume: 0.07, forma: 'sine' });
  });
  rumore({ durata: 0.09, volume: 0.07, taglio: 5200 });
}

/**
 * La Catena scende di un gradino.
 *
 * Stessa scala, un grado sotto, timbro piu' spento e volume basso: si sente che si e'
 * perso qualcosa senza che suoni come un errore. Perdere la Catena e' una conseguenza
 * del gioco, non una punizione da sottolineare.
 */
export function suonoCatenaGiu(livelloPrecedente) {
  nota(frequenzaCatenaGiu(livelloPrecedente), {
    durata: 0.26, volume: 0.11, forma: 'sine', glide: 0.94,
  });
}

/**
 * ULTIMA CHIAMATA: il respiro e' finito, la prossima mossa senza eliminazioni fa calare
 * il moltiplicatore.
 *
 * E' il suono piu' utile del gioco, perche' e' l'unico che dice qualcosa che non si e'
 * ancora visto: fino a ieri quell'informazione stava solo nella barra, cioe' solo per
 * chi la sta guardando in quel momento. Due note vicine e brevi, riconoscibili e non
 * allarmanti: un avviso, non una sirena.
 */
export function suonoUltimaChiamata(livello) {
  const base = frequenzaDiCatena(livello);
  nota(base, { ritardo: 0, durata: 0.09, volume: 0.13, forma: 'square' });
  nota(base, { ritardo: 0.13, durata: 0.09, volume: 0.1, forma: 'square' });
}

/** Mossa eccezionale: un accordo aperto sopra l'arpeggio. */
export function suonoGrandeCombo(catena) {
  const base = Math.min(8, catena);
  [0, 2, 4, 7].forEach((salto, i) => {
    nota(gradino(base + salto), { ritardo: i * 0.03, durata: 0.55, volume: 0.16, forma: 'triangle' });
  });
}

/**
 * Esplosione di una o piu' bombe.
 * Rumore grave filtrato piu' una discesa rapida: e' l'unico suono del gioco che non
 * appartiene alla scala, e deve essere cosi'. Una bomba non e' una nota: e' un colpo.
 * Con piu' bombe il colpo diventa piu' profondo e piu' lungo, senza diventare piu'
 * forte: il volume che cresce stanca, la profondita' no.
 */
export function suonoEsplosione(bombe = 1) {
  const forza = Math.min(3, bombe);
  rumore({ durata: 0.16 + forza * 0.05, volume: 0.16, taglio: 900 - forza * 180 });
  nota(90 - forza * 12, {
    durata: 0.3 + forza * 0.08,
    volume: 0.2,
    forma: 'sawtooth',
    glide: 0.35,
  });
  for (let i = 1; i < forza; i += 1) {
    rumore({ ritardo: i * 0.09, durata: 0.14, volume: 0.11, taglio: 1400 });
  }
}

/** Griglia completamente svuotata: evento raro, merita un suono che nessun altro evento usa. */
export function suonoGrigliaVuota() {
  // L'evento piu' raro del gioco (46 volte su 1200 partite nelle simulazioni): merita
  // l'unico suono davvero grosso, e soprattutto l'unico che RISOLVE -- l'arpeggio sale
  // per tutta la scala e si ferma sulla fondamentale un'ottava sopra.
  [0, 2, 4, 6, 8].forEach((grado, i) => {
    nota(frequenzaDiCatena(grado), { ritardo: i * 0.07, durata: 0.7, volume: 0.16, forma: 'sine' });
  });
  nota(frequenzaDiCatena(0) * 4, { ritardo: 0.36, durata: 0.9, volume: 0.14, forma: 'triangle' });
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
