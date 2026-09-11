/**
 * Le misure delle icone, in un posto solo.
 *
 * Stanno qui e non dentro tools/icone.mjs perche' le legge anche il test: quel file, se
 * importato, apre un browser e rigenera tutto, cosa che un test unitario non deve fare.
 *
 * PERCHE' ESISTE QUESTO FILE. Il generatore dichiarava in un commento che il marchio
 * stava "dentro il cerchio sicuro di Android". Misurato: il marchio aveva raggio 187
 * pixel su una tela da 432 e il cerchio sicuro ne ammette 132. Sporgeva di 55 pixel, e
 * sul telefono l'icona arrivava con gli angoli dei blocchi rasati dalla maschera del
 * launcher. Il commento non era una svista di scrittura: era una misura mai presa.
 * Adesso i numeri sono dati, non prosa, e un controllo li verifica sul PNG vero.
 */

/**
 * LE DUE ZONE SICURE, CHE NON SONO LA STESSA COSA.
 *
 * Android, icona adattiva: la tela e' 108dp, il sistema ne mostra al massimo 72 centrali
 * (il resto serve per il movimento di parallasse di alcuni launcher), e la porzione
 * garantita visibile QUALUNQUE forma scelga il produttore -- cerchio, quadrato con
 * angoli, goccia -- e' un CERCHIO di 66dp su 108. Il marchio di PLINTO e' quadrato,
 * quindi sono i suoi angoli a decidere: vanno dentro quel cerchio, non dentro il
 * quadrato che lo contiene.
 *
 * Web, icona "maskable": la specifica garantisce un cerchio di diametro pari all'80%
 * del lato. E' piu' generosa di Android, e per una versione i due file erano lo stesso:
 * sul sito il marchio si vedeva intero, sul telefono arrivava tagliato.
 */
export const ZONA_SICURA_ANDROID = 66 / 108 / 2;   // raggio, in frazione del lato
export const ZONA_SICURA_WEB = 0.80 / 2;

/** Dimensioni richieste dalle piattaforme, con la ragione di ciascuna. */
export const MISURE = [
  { nome: 'icona-192.png', lato: 192, margine: 0, uso: 'PWA, elenco applicazioni' },
  { nome: 'icona-512.png', lato: 512, margine: 0, uso: 'PWA, schermata iniziale' },
  {
    nome: 'icona-maskable-512.png',
    lato: 512,
    // 0,18 porta il marchio dentro il cerchio dell'80% della specifica web. Era 0,12, e
    // a quel valore il raggio del marchio era 230 pixel contro i 205 ammessi.
    margine: 0.18,
    zonaSicura: ZONA_SICURA_WEB,
    uso: 'Android, ritaglio adattivo',
  },
  { nome: 'icona-apple-180.png', lato: 180, margine: 0, uso: 'iOS, aggiunta alla schermata home' },
  { nome: 'icona-1024.png', lato: 1024, margine: 0, uso: 'schede degli store' },
  { nome: 'favicon-32.png', lato: 32, margine: 0, uso: 'scheda del browser' },
  // 432 = 108dp alla densita' xxxhdpi, la tela di un'icona adattiva.
  {
    nome: 'icona-android-primopiano-432.png',
    lato: 432,
    // 0,28 porta gli angoli del marchio a raggio 129 su un cerchio sicuro da 132.
    // Era 0,18, cioe' raggio 187: il valore scelto guardando il QUADRATO visibile
    // (72 su 108) invece del CERCHIO garantito (66 su 108). Su un marchio quadrato la
    // differenza fra le due misure e' proprio quella che si perde agli angoli.
    margine: 0.28,
    zonaSicura: ZONA_SICURA_ANDROID,
    trasparente: true,
    uso: 'Android, primo piano dell\'icona adattiva',
  },
  // L'icona CLASSICA di Android, quella usata dove l'adattiva non arriva. Non e' un
  // residuo storico: alcuni sistemi (MIUI in particolare) applicano una propria maschera
  // anche a questa, e il marchio a tutto campo ci finisce sotto. Stesso margine
  // dell'adattiva, ma con il fondo dipinto: qui non c'e' un livello sotto a metterlo.
  {
    nome: 'icona-android-classica-432.png',
    lato: 432,
    margine: 0.28,
    zonaSicura: ZONA_SICURA_ANDROID,
    soloMarchio: true,
    uso: 'Android, icona classica',
  },
  // La schermata d'avvio. 768 = 192dp alla densita' xxxhdpi: un marchio grande ma non
  // invadente, sopra il colore di fondo che mette la libreria.
  //
  // La misura non e' un dettaglio estetico. Prima qui c'era l'icona a 512px messa in
  // `res/drawable/`, la cartella SENZA densita': Android la interpreta come 1x e la
  // moltiplica per la densita' dello schermo, quindi su un telefono a 3x diventava un
  // marchio da 1536px che riempiva lo schermo per due secondi. Sta in `drawable-xxxhdpi/`
  // proprio per dire ad Android a quale densita' e' disegnata.
  //
  // Non ha zona sicura: la schermata d'avvio non viene ritagliata da nessuna maschera.
  {
    nome: 'icona-splash-768.png',
    lato: 768,
    margine: 0.28,
    trasparente: true,
    uso: 'Android, schermata d\'avvio',
  },
];

/** Dove il generatore scrive le misure prese sui PNG veri. */
export const REGISTRO = new URL('./icone-misurate.json', import.meta.url).pathname;
