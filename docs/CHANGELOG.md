# Changelog

Tutte le modifiche degne di nota a PLINTO. Il formato segue una versione semplificata di
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa
[Versionamento Semantico](https://semver.org/lang/it/).

La versione è dichiarata in un solo posto — il campo `version` di `package.json` — e
`vite.config.js` la inietta nel bundle come `__APP_VERSION__`.

## [0.1.0] — non ancora rilasciata

Primo nucleo del progetto: il motore di gioco, il generatore, gli strumenti di misura,
l'interfaccia, il game feel, l'accessibilità e la Sfida del Giorno. Il progetto compila
(`npm run build` riesce), i **150 test unitari in 12 file** passano (misurato il 6 settembre
2026 con `npm test`) e lo scenario `npm run e2e` guida un
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
  mossa), Catena (moltiplicatore persistente, senza mai azzerarsi) — più il bonus di
  svuotamento della griglia e il livello di celebrazione `moveTier`. La regola della Catena è
  poi cambiata due volte: vedi "Cambiato" qui sotto.
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
- Test Vitest su griglia, punteggio, generatore, motore (compresa la robustezza dei
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

### Cambiato

**Il gioco si chiama PLINTO, non più QUADRA**
- Il nome precedente era già usato da giochi esistenti nello stesso genere. Motivazioni e
  verifica in `docs/DIFFERENZIAZIONE.md`.
- La rinomina è passata anche per i nomi delle costanti. Un passaggio automatico aveva
  trasformato `QUADRANT_SIZE` in `PLINTONT_SIZE`, sostituendo la sottostringa "QUADRA" dentro
  una parola che non c'entrava: **corretto**, la costante si chiama di nuovo `QUADRANT_SIZE` e
  i quadranti restano quadranti. Non restano tracce di "PLINTONT" nel codice né nei documenti.

**La regola della Catena, riscritta due volte perché la misura diceva che non funzionava**

Cronologia, con i numeri prodotti dal giocatore artificiale forte:

1. *Versione originale.* La Catena saliva di **quanti gruppi** chiudeva la mossa e calava di
   uno a **ogni** mossa che non eliminava nulla. Misurato: Catena ≥ 3 solo nel **2%** delle
   mosse giocate, mai sopra 6. Il moltiplicatore che doveva essere la firma del gioco era
   decorativo.
2. *Seconda versione.* Due mosse di tolleranza prima del calo, crescita ancora pari al numero
   di gruppi. Misurato: **93%** delle mosse con Catena attiva, ma **59,5%** giocate al tetto
   massimo. Un moltiplicatore fisso è inutile esattamente quanto uno che non arriva mai.
3. *Versione attuale.* La Catena sale di **uno** per mossa che elimina — non di quanti gruppi,
   perché l'Intreccio li premia già e contarli due volte incollava la Catena al tetto — con
   **una** mossa di tolleranza prima di calare (`CHAIN_STEP_UP = 1`, `CHAIN_GRACE = 1`).
   Misurato: **79,5%** delle mosse con Catena attiva, **13,6%** al tetto, e la distribuzione
   è piatta su tutti i livelli 0-9, fra il 6,0% e il 13,6% per livello.

Conseguenze sul codice: `nextChainLevel` è diventata `nextChainState`, che restituisce
livello **e** digiuno; lo stato della partita ha un campo `chainDigiuno` in più, serializzato
e validato; `respiroRimasto` espone la tolleranza residua (per ora nessun componente la usa).

**Palette dei blocchi: da smorzata a satura**
- Le sei famiglie cromatiche erano coerenti con la direzione minerale ma spente su schermo. I
  blocchi sono l'unica cosa colorata dell'interfaccia: ora sono saturi, con la luminosità
  scelta perché ognuno resti sopra 3:1 sul fondo della plancia **in entrambi i temi**.
  Scuro: `#ff6a2b` `#12e1b0` `#9b4dff` `#ffc212` `#ff3d71` `#2e97ff`.
- **Il tema chiaro è stato ridefinito per intero e misurato.** Prima ridefiniva solo fondali e
  testi: il punteggio in ottone stava a **1.53:1** e **cinque blocchi su sei** sotto 3:1 sulla
  plancia. Ora ha tinte proprie per blocchi, `--pl-brand`, `--pl-brand-deep`, `--pl-ok`,
  `--pl-danger` e `--pl-cella-vuota`, e tutti e sei i blocchi passano (peggiore: 3.31).
- Nuovo token `--pl-danger-fondo` (`#b81f47`): il pulsante che **cancella i dati del
  giocatore** scriveva bianco su `--pl-danger`, cioè **2.94:1**. Adesso 6.32:1. `--pl-danger`
  resta il colore del testo di allarme; il fondo è un token separato.
- `--pl-text-faint` e la tinta delle celle libere: quest'ultima è diventata il token
  `--pl-cella-vuota`, perché un velo bianco trasparente su fondo chiaro è invisibile.

### Aggiunto dopo il primo nucleo

**Le bombe (`src/config/rules.js`, `src/core/grid.js`, `src/core/generator.js`,
`src/core/engine.js`)**
- Ogni tanto una cella di un pezzo è una bomba. Non fa niente sulla plancia: **esplode solo se
  eliminata insieme al gruppo che la contiene**, e allora porta via il quadrato di raggio 1
  attorno a sé. Le bombe colpite detonano a loro volta; quelle a distanza 2 no.
- `BOMBA_PROBABILITA = 0.22`, estratta **una volta per mano**: mai due bombe nella stessa
  terna, mai su un pezzo da una cella. La probabilità è **fissa** e non guarda punteggio,
  Catena o andamento della partita — la stessa dichiarazione di equità del generatore.
  Misurato su 40.697 mani: 22,2%.
- Codifica in **un solo array**: il valore di una cella è il colore (1..6), una bomba è
  colore + 10 (11..16). Salvataggi, copie e simulazioni restano quelli di prima.
- Punteggio: `PUNTI_CELLA_ESPLOSA = 6` per ogni cella portata via oltre al gruppo, moltiplicata
  per la Catena ma non per l'Intreccio. Una detonazione non conta come gruppo chiuso.
- Segno visivo **geometrico e non cromatico**: un anello bianco al centro della cella, visibile
  già nel tray. Il colore in PLINTO non porta informazione, e una bomba segnalata da una tinta
  sarebbe invisibile a chi non distingue i colori.
- `tests/bombe.test.js`: 14 test su codifica, raggio, reazione a catena, bordi, celle vuote,
  punteggio e sopravvivenza al salvataggio.

**Strumenti e controlli automatici**
- `tools/schermate.mjs` (`npm run schermate`), `tools/icone.mjs` (`npm run icone`),
  `tools/prova-sottocartella.mjs` (`npm run prova-pages`), `tools/prova-desktop.mjs`
  (`npm run prova-desktop`), `tools/quadri.mjs` (`npm run quadri`). Descritti in
  `docs/TESTING.md`.
- `tests/e2e/precisione.mjs` (`npm run precisione`) e `tests/e2e/resistenza.mjs`
  (`npm run soak`).
- `tests/privacy.test.js`: la promessa "nessuna richiesta di rete" ora è verificata da un test
  che legge i file del prodotto, invece di essere solo scritta in un documento.
- `tests/script.test.js`: `node --check` su tutti gli script di `tools/`, `tests/e2e/` e
  `src/sim/`, che nessun altro test importa.
- `tests/durate.test.js` e `src/feel/durate.js`: le durate degli effetti vivono per forza in
  CSS e in JavaScript, e ora un test fallisce se qualcuno ne cambia solo una.

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
- Nel tema chiaro `--pl-text-faint` resta a **4.27:1** sul fondo pagina e **4.19:1** sui
  pannelli, sotto la soglia AA di 4.5. È l'ultimo contrasto non conforme rimasto; il resto
  del tema chiaro è stato ridefinito e misurato. Vedi `docs/DESIGN_SYSTEM.md`, sezione 3.
- Il commento di `tokens.css` sui testi del tema chiaro dichiara «15.9, 7.7 e 4.5 su
  `--pl-ink`»: i valori misurati sono 15.65, 6.48 e 4.27.
- `public/icon.svg` ha ancora i colori della palette smorzata, quindi l'icona e il marchio
  disegnato nel gioco non coincidono più.
- Il bersaglio tattile del pezzo da una cella nel tray misura 34 × 34 px su un viewport da
  390 px (29 × 29 su 360 px), sotto i 44 px raccomandati.
- `prefers-reduced-motion` ora riduce anche le animazioni a fotogrammi chiave (usano i token
  di durata) e spegne le due animazioni infinite. **Restano** le particelle sul canvas, che
  non passano dal CSS: per quelle serve l'impostazione "Animazioni".
- Alcuni testi sono ancora scritti nel JSX invece che nei dizionari (etichetta accessibile dei
  pezzi nel tray, note di `Info.jsx` e `Sostieni.jsx`) e restano in italiano anche scegliendo
  l'inglese; i numeri usano `toLocaleString('it-IT')` fisso.
- `suonoRecord()` è definito e importato in `App.jsx` ma non viene mai chiamato: il suono del
  nuovo record non si sente.
- Il link di donazione in `src/config/progetto.js` è volutamente vuoto e va inserito a mano
  dal proprietario del progetto.
