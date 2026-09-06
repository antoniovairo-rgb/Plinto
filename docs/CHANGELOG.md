# Changelog

Tutte le modifiche degne di nota a PLINTO. Il formato segue una versione semplificata di
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa
[Versionamento Semantico](https://semver.org/lang/it/).

La versione è dichiarata in un solo posto — il campo `version` di `package.json` — e
`vite.config.js` la inietta nel bundle come `__APP_VERSION__`.

## [0.1.0] — non ancora rilasciata

Primo nucleo del progetto: il motore di gioco, il generatore, gli strumenti di misura,
l'interfaccia, il game feel, l'accessibilità e la Sfida del Giorno. Il progetto compila
(`npm run build` riesce), gli **89 test unitari** passano e lo scenario `npm run e2e` guida un
browser reale attraverso primo avvio, partita con mouse, partita a due tocchi, partita da
tastiera, eliminazione con particelle, ripresa dopo ricarica, game over e Sfida del Giorno.
Restano fuori dalla verifica: dispositivi reali, tocco vero, audio e playtest umano. Da
considerarsi non rilasciabile.

### Aggiunto

**Regole e motore (`src/config/`, `src/core/`)**
- `rules.js`: tutte le costanti di regolamento in un solo file, ognuna commentata.
- `rng.js`: PRNG deterministico mulberry32 a stato esplicito, con derivazione del seed da una
  stringa.
- `shapes.js`: catalogo di 41 forme senza rotazioni, divise in 6 famiglie (punto, linea,
  angolo, tetro, blocco, diagonale) e pesate per l'estrazione (peso totale 183).
- `grid.js`: griglia 9x9 come `Uint8Array`, posizionamento, ricerca di righe/colonne/quadranti
  completi e loro eliminazione con le celle d'incrocio contate una volta sola.
- `scoring.js`: punteggio a tre livelli — celle appoggiate, Intreccio (più gruppi in una
  mossa), Catena (moltiplicatore persistente che sale di quanti gruppi hai chiuso e scende di
  uno quando non elimini, senza mai azzerarsi) — più il bonus di svuotamento della griglia e
  il livello di celebrazione `moveTier`.
- `generator.js`: generatore della terna con casualità controllata; pressione da affollamento,
  memoria delle forme recenti e tre reti di sicurezza dichiarate a favore del giocatore.
- `engine.js`: riduttore puro della partita — `createGame`, `placePiece`, rilevamento del game
  over, statistiche, `summarize`, `serializeGame`/`deserializeGame` con rifiuto dei salvataggi
  incompatibili o corrotti.

**Misura (`src/sim/`, `tests/`)**
- `sim/player.mjs`: quattro giocatori artificiali (`casuale`, `normale`, `esperto` e lo
  `stratega` con beam search sull'intera terna).
- `sim/run.mjs`: harness da riga di comando con seed fisso; stampa distribuzione di punteggio
  e mosse, istogramma del riempimento della griglia al game over e confronto fra frequenza
  attesa e osservata di ogni forma.
- 89 test Vitest: griglia, punteggio, generatore, motore (compresa la robustezza dei
  salvataggi manomessi), parità delle traduzioni, Sfida del Giorno, e un file di **invarianti
  su partite intere** che gioca 240 partite fino al game over controllando dopo ogni mossa che
  lo stato resti possibile.
- **Tetto di mosse nel simulatore** (`node src/sim/run.mjs [partite] [profilo] [tetto]`): mette
  tutti i profili davanti allo stesso numero di occasioni, perché senza, il giocatore più
  bravo segna di più anche solo perché sopravvive più a lungo.
- `tests/e2e/partita.mjs`: scenario in Chromium reale che avvia da solo il server di
  sviluppo, costruisce gli stati difficili con il motore vero e li inietta in `localStorage`.

**Interfaccia (`src/ui/`, `src/state/`, `src/persistence/`, `src/i18n/`, `src/styles/`)**
- Componenti React di plancia, tray, HUD, barra della Catena, logo e otto schermate
  (primo avvio, home, gioco, fine, statistiche, impostazioni, info, sostegno).
- `useTrascinamento`: drag & drop scritto a mano con pointer events — il pezzo si solleva
  sopra il dito, cresce alla scala della griglia, mantiene il punto di presa e si aggancia al
  centro di cella più vicino. Più una modalità alternativa **a due tocchi** per chi non riesce
  a trascinare.
- Anteprima della mossa: dove finirebbe il pezzo, se è legale, e **quali celle sparirebbero**
  (aiuto visivo disattivabile).
- `usePartita` e `useImpostazioni`; salvataggio della partita a ogni mossa.
- `src/persistence/`: wrapper protetto su `localStorage` e registro dei record personali.
- `src/i18n/`: dizionari italiano e inglese con fallback a catena.
- `src/styles/tokens.css` e `app.css`: sistema di design minerale (vedi
  `docs/DESIGN_SYSTEM.md`), tema chiaro su richiesta esplicita, layout orizzontale per il
  telefono coricato e adattamento agli schermi bassi.
- `index.html`, `src/main.jsx`, `src/config/progetto.js`.
- `public/icon.svg` (icona originale in SVG) e `public/manifest.webmanifest`.

**Game feel (`src/audio/`, `src/feel/`)**
- `audio/suoni.js`: **audio interamente sintetizzato** con oscillatori e inviluppi della Web
  Audio API — nessun file audio nel progetto. Scala pentatonica maggiore, così anche una
  raffica di eliminazioni resta consonante; l'arpeggio dell'eliminazione parte da un gradino
  più alto man mano che la Catena sale, quindi il moltiplicatore **si sente** prima di
  leggerlo. Il contesto audio nasce solo dentro un gesto del giocatore.
- `feel/particelle.js`: esplosioni su **un solo canvas** sovrapposto alla plancia, non decine
  di nodi DOM animati; il ciclo di `requestAnimationFrame` esiste solo finché ci sono
  particelle vive, per non consumare batteria mentre il giocatore pensa.
- `feel/useEffettiMossa.js`: unico punto in cui `lastMove` diventa suoni, vibrazioni,
  particelle e animazioni. Il motore resta ignaro del feedback.
- Animazioni: il blocco appoggiato atterra (260 ms); il blocco eliminato viene **ridisegnato
  per 420 ms dopo essere già uscito dallo stato**, altrimenti l'eliminazione sarebbe uno
  scatto invisibile; i punti volano via dalla cella con dimensione e colore legati al valore
  della mossa; il punteggio in testata scatta e la barra della Catena lampeggia quando sale.
- `feel/vibrazione.js`: pattern brevi per `navigator.vibrate`, protetti sui dispositivi che
  non la supportano.
- Una mossa rifiutata ha un suono e una vibrazione propri: in un gioco a trascinamento il
  silenzio si legge come "è rotto".
- Tutto rispetta le impostazioni del giocatore (audio, vibrazione, animazioni).

**Accessibilità**
- **La partita si gioca interamente da tastiera**: Tab sceglie il pezzo, Invio lo prende, le
  frecce (o WASD) muovono un cursore sulla griglia, Invio lo appoggia, Esc annulla. Il cursore
  parte dal centro, cioè dal punto da cui si raggiunge ogni casella in meno pressioni.
- Il cursore da tastiera è un **anello spesso, non una tinta**: non dipende dal colore.
- `ui/Annunci.jsx`: regione `aria-live="polite"` che descrive a parole cosa è successo
  ("2 righe, 1 quadrante eliminate. piu 96 punti. Catena 3."). In `polite` e non `assertive`,
  altrimenti in una raffica di mosse diventerebbe inascoltabile.
- Ogni cella ha un'etichetta con riga, colonna e stato; la barra della Catena è un
  `progressbar` con i valori corretti; gli interruttori sono `role="switch"`.
- **Contrasti misurati, non stimati.** `--pl-text-faint` era `#626b83`, cioè 3.55:1 sul fondo e
  **2.88:1** sui pannelli, sotto la soglia WCAG AA di 4.5 per testo normale: sostituito con
  `#838ca1` (5.60 e 4.54). `--pl-danger` è stato schiarito da `#e4587e` (**4.37:1** sui
  pannelli) a `#ec6d8e` (5.21). I numeri sono scritti nel commento di `tokens.css` così che la
  prossima modifica parta da una misura e non da un'impressione.

**Primo avvio e adattamento allo schermo**
- Presentazione al primo avvio: una schermata, tre righe, un pulsante, e non torna mai più.
  Non è un tutorial e non blocca niente. L'esempio mostrato era sbagliato nella prima stesura
  (3+3 celle per chiudere un quadrante che ne richiede 9); ora usa due pezzi che chiudono
  davvero un 3x3, verificato eseguendo il motore.
- Layout orizzontale: su telefono coricato la plancia va a sinistra, punteggio e pezzi a
  destra, senza cambiare un solo componente. Realizzato con una classe esplicita invece che
  con `:has()`, per non dipendere dal supporto del selettore.

**Sfida del Giorno (`src/persistence/sfide.js`)**
- Il seme della partita è la **data locale** (non UTC: il "giorno" è quello del giocatore),
  quindi nello stesso giorno griglia e sequenza dei pezzi sono identiche per tutti.
- Volutamente povera di meccanica: nessun limite di tentativi, niente da sbloccare, nessuna
  ricompensa, nessuna valuta e **nessuna serie giornaliera da mantenere** — le serie
  funzionano perché fanno paura di perdere qualcosa, e questo gioco non usa la paura per
  farsi riaprire. Nessuna classifica, perché non esiste server e nessun dato lascia il
  dispositivo.
- Slot di salvataggio **separati** per partita libera e sfida (`KEYS.CURRENT_CHALLENGE`):
  aprire la sfida non cancella la partita lasciata a metà.
- Storico dei risultati potato a 60 giorni; della giornata si conserva solo il punteggio
  migliore.
- Nella home è un secondo pulsante con lo stesso peso visivo degli altri comandi: non
  lampeggia e non ha contatori alla rovescia.

**Documentazione**
- `README.md` e i documenti in `docs/`: architettura, regole di gioco, sistema di design,
  test, questo changelog e il registro degli asset.

### Deciso durante lo sviluppo (bilanciamento)

- La prima versione del generatore imponeva che ogni pezzo avesse almeno **4 posizioni valide**
  finché il riempimento era sotto il **50%**. Misurato: la mediana delle mosse per partita è
  salita **da 83 a 191** e la difficoltà si è appiattita. La regola è stata ridotta ad **almeno
  2 posizioni valide, solo sotto il 30% di riempimento** (`MIN_PLACEMENTS_EARLY = 2`,
  `RISKY_PIECE_FILL = 0.3`).
- Il moltiplicatore Catena applicato a una mossa è quello **precedente** alla mossa, cioè
  quello che il giocatore vedeva nell'interfaccia. È una scelta di trasparenza, non di
  bilanciamento.

### Corretto durante lo sviluppo

- **La presa del pezzo veniva misurata sul bottone invece che sul disegno.** L'imbottitura del
  bottone sfasava il posizionamento di quasi una cella: invisibile su griglia vuota,
  paralizzante su griglia piena. Trovato dallo scenario e2e, non da un test unitario.
- **Il file di test delle traduzioni non veniva raccolto.** Importava i dizionari come `it` ed
  `en`, e `it` collide con la funzione di test di Vitest; la suite continuava a dichiarare
  tutti i test verdi pur avendo un file fallito. Ora gli import si chiamano `italiano` e
  `inglese`; l'avvertimento è in `docs/TESTING.md`.
- Commenti del generatore che dichiaravano una soglia di equità del 50% mentre il codice usa
  il 30%, e che elencavano 3 regole su 5.
- `deserializeGame` accettava salvataggi manomessi (punteggio non numerico, stato inventato,
  Catena fuori scala): ora li rifiuta, con cinque test dedicati.
- La durata della partita usava `Date.now()` non iniettabile, unico valore non riproducibile a
  parità di seed: ora è un parametro.

### Noto e non risolto

- I profili di simulazione `esperto` e `normale` producono risultati praticamente identici
  (media 1443 contro 1393, mediana 1082 contro 1030). Non è ancora chiaro se il difetto sia
  nell'euristica del giocatore artificiale o nel gioco, che potrebbe non premiare abbastanza la
  strategia. Misura in corso con il profilo `stratega`; vedi `docs/TESTING.md`.
- L'interfaccia è coperta **solo** dallo scenario `npm run e2e`, che è un percorso felice: non
  esistono test unitari sui componenti né un ambiente di test con DOM.
- Lo scenario e2e usa il mouse, quindi il ramo del trascinamento pensato per il tocco (il
  pezzo che si solleva sopra il dito) non viene mai eseguito. Il percorso di Chromium è inoltre
  scritto nel file e va corretto a mano su un'altra macchina.
- **Il tema chiaro non è conforme ai contrasti**: i contrasti sono stati misurati e corretti
  solo per il tema scuro. Vedi `docs/DESIGN_SYSTEM.md`, sezione 3.
- Il bersaglio tattile del pezzo da una cella nel tray misura 34 × 34 px su un viewport da
  390 px (29 × 29 su 360 px), sotto i 44 px raccomandati.
- `prefers-reduced-motion` riduce solo le transizioni: le animazioni a fotogrammi chiave e le
  particelle restano a durata piena. Solo l'impostazione "Animazioni" le spegne davvero.
- Alcuni testi sono ancora scritti nel JSX invece che nei dizionari (etichetta accessibile dei
  pezzi nel tray, note di `Info.jsx` e `Sostieni.jsx`) e restano in italiano anche scegliendo
  l'inglese; i numeri usano `toLocaleString('it-IT')` fisso.
- `suonoRecord()` è definito e importato in `App.jsx` ma non viene mai chiamato: il suono del
  nuovo record non si sente.
- Il link di donazione in `src/config/progetto.js` è volutamente vuoto e va inserito a mano
  dal proprietario del progetto.
