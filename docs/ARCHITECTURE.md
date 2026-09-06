# Architettura di PLINTO

> Fotografia del codice al **6 settembre 2026**, aggiornata a `f31b2d5`, cioè dopo i commit
> `9253cc7` (interfaccia), `ee7b452` (game feel e audio), `fe290f7` (tastiera, accessibilità,
> primo avvio, orizzontale) e `f31b2d5` (Sfida del Giorno, invarianti). Descrive solo file e
> comportamenti verificati leggendo il sorgente ed eseguendo i comandi. Dove una cosa non
> esiste, è scritto che non esiste.

## 1. I layer

| Cartella | Contenuto reale | Dipende da | Ambiente |
| --- | --- | --- | --- |
| `src/config/` | `rules.js` (costanti di regolamento), `progetto.js` (link di donazione, contatto, anno) | niente | neutro |
| `src/core/` | `rng.js`, `shapes.js`, `grid.js`, `scoring.js`, `generator.js`, `engine.js` | solo `config/` e se stesso | neutro (né DOM né React) |
| `src/sim/` | `player.mjs` (giocatori artificiali), `run.mjs` (harness da riga di comando) | `core/`, `config/` | Node |
| `src/persistence/` | `storage.js` (wrapper protetto su `localStorage`, chiavi con prefisso `plinto:`), `records.js` (record personali e statistiche di vita), `sfide.js` (Sfida del Giorno: giorno locale, miglior punteggio di giornata, storico potato a 60 giorni) | fra loro | **browser** (usa `window`) |
| `src/styles/` | `tokens.css` (variabili del sistema di design, vedi `DESIGN_SYSTEM.md`), `app.css` (~770 righe, tutto il resto) | niente | browser |
| `src/i18n/` | `index.js` (`traduttore()`, `LINGUE`, `linguaDelBrowser()`), `it.js`, `en.js` | fra loro | browser (legge `navigator.language`, con `try/catch`) |
| `src/audio/` | `suoni.js` — sintesi Web Audio: nove voci del gioco, **nessun file audio** | niente | browser (`AudioContext`) |
| `src/feel/` | `useEffettiMossa.js` (traduce `lastMove` in effetti), `particelle.js` (classe `CampoParticelle`, un canvas), `vibrazione.js` (pattern per `navigator.vibrate`) | `config/`, `audio/`, React (solo l'hook) | browser |
| `src/ui/` | `App.jsx`, `SchermoGioco.jsx`, i componenti `Plancia`, `Tray`, `Pezzo`, `Hud`+`BarraCatena`, `Logo`, `Annunci`, gli hook `useTrascinamento` e `useTastiera`, e in `schermate/` le schermate (fra cui `Quadri`, `AperturaQuadro`, `FineQuadro`, `AvanzamentoMappa`, `ComeSiGioca`, `Bomba`, `MiniGriglia`, `Salvagente`) più l'impalcatura comune `Pagina.jsx` | `core/`, `config/`, `state/`, `feel/`, `audio/`, `i18n/`, React | browser |
| `src/state/` | `usePartita.js`, `useImpostazioni.js` — hook che avvolgono motore e storage | `core/`, `persistence/`, `i18n/`, React | browser |
| `tests/` | 14 file Vitest (`grid`, `scoring`, `bombe`, `generator`, `engine`, `quadri`, `i18n`, `sfide`, `invarianti`, `privacy`, `script`, `durate`, `contrasti`, `icona`) più gli scenari in `e2e/` (`partita`, `precisione`, `resistenza`, `quadri`) | `core/`, `config/`, `i18n/`, `persistence/`, `styles/`, Playwright | Node |
| `tools/` | strumenti di misura e di produzione fuori dalla suite: `schermate`, `icone`, `prova-sottocartella`, `prova-desktop`, `quadri`, `taratura`, `genera-quadri`, `contrasti`, `misura-catena` | `core/`, `config/`, Playwright | Node |

Stato dei comandi, verificato eseguendoli il 6 settembre 2026 su `f31b2d5`:

- `npm test` passa: **204 test in 14 file**, ~12.5 s (undici e mezzo dei quali spesi nel solo
  `invarianti.test.js`, che gioca 240 partite complete);
- `npm run e2e` passa: scenario in Chromium reale, "Nessun problema rilevato";
- `npm run sim` funziona;
- `npm run build` riesce: 68 moduli, `dist/assets` da **196.10 kB di JS** (63.19 kB gzip) e
  **16.17 kB di CSS** (4.11 kB gzip).

Il gioco **è stato aperto in un browser reale**: lo scenario e2e lo guida attraverso primo
avvio, trascinamento con mouse, eliminazione con particelle, modalità a due tocchi, partita
da tastiera, ripresa dopo ricarica, game over e schermate secondarie. Restano fuori dalla
verifica automatica: le prestazioni su un dispositivo lento reale, il tocco vero (l'e2e usa
il mouse), l'audio (nessuna asserzione lo verifica) e il playtest umano.

### Perché i layer sono separati

Il confine che conta è uno solo: **`core/` non sa che esiste un browser**. Non importa React,
non tocca il DOM, non usa timer, non legge `Date` se non per due campi informativi
(`startedAt`/`endedAt`). Questo permette tre cose che altrimenti sarebbero impossibili:

1. i test girano in Node senza jsdom e senza mock;
2. `src/sim/run.mjs` gioca migliaia di partite complete importando gli stessi moduli che usa
   l'interfaccia — non una copia semplificata delle regole;
3. un bug di regole è un bug di `core/`, non qualcosa da cercare dentro un componente.

`persistence/`, `i18n/`, `audio/` e `feel/` **non** rispettano quel confine (usano `window`,
`navigator`, `AudioContext`, il canvas) ed è corretto così: sono layer di piattaforma, non di
regole. Ogni loro accesso è protetto da `try/catch` o da un controllo di esistenza, quindi il
gioco deve funzionare anche con `localStorage` bloccato, senza `AudioContext` e su un
dispositivo che non vibra — solo con meno feedback e senza memoria fra una partita e l'altra.

Gli altri confini, in ordine dal basso verso l'alto:

- **`state/` è l'unico punto di contatto fra motore e React.** `usePartita` chiama
  `createGame` / `placePiece` / `summarize` / `serializeGame` e nient'altro sa di React;
  nessun componente importa direttamente `engine.js` per far progredire la partita.
  `SchermoGioco` importa da `core/grid.js`, ma solo funzioni **di sola lettura**
  (`canPlace`, `placeShape` su una copia, `findCompletedGroups`, `shapeCellsAt`) per
  calcolare l'anteprima della mossa: guarda, non muove.
- **`feel/` legge, non decide.** `useEffettiMossa` riceve `partita.lastMove` e lo traduce in
  suoni, vibrazioni, classi CSS e particelle. Non conosce le regole e non può cambiare lo
  stato: cambiare il gioco non richiede di toccarlo, cambiare gli effetti non richiede di
  toccare le regole.
- **`audio/` e `feel/vibrazione.js` non sono React.** Tengono una variabile di modulo
  (`attivo` / `attiva`) e la si allinea alle impostazioni con due `useEffect` in `App.jsx`
  (`impostaAudio`, `impostaVibrazione`), così le funzioni-voce non vanno passate di mano in
  mano attraverso i componenti.
- **`ui/` non parla con `persistence/` se non per due letture di comodo** (`loadStats` e
  `loadRecords` in `App.jsx`); tutte le scritture passano da `state/`.

## 2. JavaScript + JSDoc, non TypeScript

Decisione presa. Motivi:

- **Coerenza con l'ecosistema del proprietario del progetto**, che sviluppa in JSX puro senza
  passo di tipizzazione. Un secondo linguaggio nel toolchain è attrito quotidiano, non un
  guadagno una tantum.
- **Minore attrito di manutenzione**: nessuna configurazione di compilatore, nessun file di
  definizione, nessun disallineamento fra tipi e realtà a runtime.
- Il costo — perdere il controllo statico — è compensato in parte dai commenti `@param` /
  `@returns` presenti su tutte le funzioni pubbliche del `core/` e in parte dalla suite di
  test, che sul `core/` resta la parte più densa: dei 204 test, 102 riguardano il `core/`
  (griglia, punteggio, bombe, generatore, motore, invarianti), 33 i Quadri (definizione, svolgimento e testi della schermata di apertura), 35 l'i18n (chiavi, traduzioni, ortografia italiana e regole della presentazione), 6 la
  Sfida del Giorno e 28 le promesse del progetto su se stesso (privacy, sintassi degli script,
  allineamento delle durate, contrasti WCAG, colori dell'icona).

Il prezzo va detto con onestà: nulla impedisce oggi di passare a `scoreMove` un oggetto con
un campo sbagliato. Il controllo è nei test, non nel linguaggio.

## 3. Stato serializzabile, azioni pure

Lo stato di una partita è un singolo oggetto (`createGame` in `src/core/engine.js`) con campi
`grid`, `hand`, `score`, `chain`, `status`, `stats`, `lastMove`, `seed`, `rngState`,
`shapeHistory`. L'unica azione che fa progredire la partita è `placePiece(state, handIndex,
row, col)`, che **non muta mai** lo stato ricevuto: costruisce e restituisce un oggetto nuovo
(se la mossa è illegale restituisce l'identico oggetto di partenza, verificato dai test con
`toBe`).

Cosa ci si guadagna, concretamente:

- **Testabilità senza browser.** Un test costruisce una griglia da una stringa ASCII
  (`gridFromString`), chiama `placePiece` e confronta il punteggio. Nessun rendering.
- **Simulazione di massa.** `run.mjs` esegue migliaia di partite in pochi secondi perché una
  partita è un ciclo di chiamate di funzione.
- **Salvataggio con `JSON.stringify`.** `serializeGame` converte la `Uint8Array` in array e
  tiene solo `shapeId` dei pezzi; `deserializeGame` ricostruisce le forme dal catalogo e
  **rifiuta** (restituendo `null`) i salvataggi di versione diversa, con griglia della
  lunghezza sbagliata, con mano di dimensione sbagliata o con una forma sconosciuta. Meglio
  ricominciare che caricare una partita rotta.
- **Riproducibilità a parità di seed.** Verificata da un test: la stessa sequenza di mosse
  con lo stesso seed produce lo stesso punteggio e la stessa griglia.

La griglia è una `Uint8Array` di 81 celle: `0` = vuota, `1..6` = piena con la famiglia
cromatica (il colore **non ha regole di gioco**, è solo identità visiva del pezzo). Un array
piatto rende la copia banale (`grid.slice()`) e le simulazioni veloci.

## 4. PRNG deterministico invece di `Math.random`

`src/core/rng.js` implementa **mulberry32**. `nextRandom(state)` è una funzione pura che
restituisce `[valore, nuovoStato]`; `createRng(state)` è un piccolo involucro mutabile per
quando servono molte estrazioni di fila.

Perché non `Math.random()`:

- lo stato del PRNG è **un solo intero a 32 bit**, quindi entra nel salvataggio senza
  strutture aggiuntive (campo `rngState`) e la partita ripresa continua identica;
- i test possono asserire su mani e punteggi esatti;
- le simulazioni di bilanciamento sono ripetibili: se un profilo peggiora, si può rieseguire
  la stessa serie di partite;
- `seedFromString` permette di derivare un seed da una stringa. È ciò che rende possibile la
  **Sfida del Giorno**: il seme è la data locale in formato `AAAA-MM-GG`
  (`createGame({ seed: '2026-09-06' })`), quindi nello stesso giorno tutti ricevono la stessa
  griglia e la stessa sequenza di pezzi. Il seme di partenza resta nel campo `seedLabel` dello
  stato, e la partita della sfida ha uno **slot di salvataggio separato**
  (`KEYS.CURRENT_CHALLENGE`) da quello della partita libera, così aprirne una non cancella
  l'altra. Non esiste classifica: non esiste server, e nessun dato lascia il dispositivo.

## 5. `lastMove`: l'unico canale verso il game feel

Dopo ogni mossa `placePiece` scrive in `state.lastMove` un oggetto che descrive *cosa è
successo*, mai *come animarlo*: numero di mossa, `handIndex`, `pieceUid`, `shapeId`, `color`,
`origin`, `placedCells`, `groups` (tipo, indice e celle di ciascun gruppo chiuso),
`clearedCells`, `points`, `breakdown` del punteggio, `chainBefore`, `chainAfter`, `tier`
(`moveTier`: `buona` / `ottima` / `eccellente` / `perfetta`, oppure `null`), `boardCleared`,
`handRefilled`, `gameOver`, `fillAfter`.

È il contratto con `src/feel/`, che oggi esiste: quel layer legge `lastMove` e decide
particelle, suoni, vibrazioni e animazioni. Il motore resta ignaro. Nota verificata:
`deserializeGame` riporta sempre `lastMove: null`, quindi al caricamento di una partita
salvata non si riproduce l'animazione dell'ultima mossa.

### Il flusso completo di una mossa

```
  dito / tocco / tastiera
        |
        v
  useTrascinamento  oppure  useTastiera        (src/ui/)
        |  handIndex, row, col
        v
  SchermoGioco.posiziona()                     controlla canPlace: se la mossa e' illegale
        |                                      si ferma qui e suona suonoRifiuto + vibraRifiuto
        v
  usePartita.gioca()                           (src/state/)
        |
        v
  placePiece(state, i, r, c)                   (src/core/engine.js) -> nuovo stato immutabile
        |                                      con state.lastMove compilato
        +--> useEffect di usePartita: write(KEYS.CURRENT_GAME, serializeGame(stato))
        |                             e, a partita finita, recordGame(summarize(stato))
        v
  partita.lastMove  ->  useEffettiMossa()      (src/feel/)
        |
        +--> audio/suoni.js        suonoEliminazione(gruppi, chainBefore) / suonoAppoggio /
        |                          suonoGrandeCombo / suonoGrigliaVuota / suonoFinePartita
        +--> feel/vibrazione.js    vibraAppoggio / vibraEliminazione / vibraCelebrazione /
        |                          vibraFinePartita
        +--> feel/particelle.js    campo.esplodi(punti, gruppi) sul canvas sovrapposto
        +--> stato locale React    appoggiate (260ms), esplosioni (420ms), puntiVolanti (950ms)
                    |
                    v
              Plancia / Hud                    classi CSS: pl-blocco--posato, pl-blocco--esploso,
                                               pl-hud__valore--scatta, pl-punti-volanti
```

Tre cose che questo flusso rende vere, e che vale la pena non rompere:

1. **Il motore non sa che esistono suoni e animazioni.** `lastMove` descrive *cosa* è
   successo (`groups`, `clearedCells`, `points`, `tier`, `boardCleared`, `gameOver`), mai
   *come* rappresentarlo.
2. **Le celle eliminate vengono ridisegnate per 420 ms dopo essere già uscite dallo stato.**
   `useEffettiMossa` tiene un `Set` di celle "in esplosione" e `Plancia` disegna un
   `.pl-blocco--esploso` dove la griglia dice già `0`. Senza, l'eliminazione sarebbe uno
   scatto istantaneo.
3. **L'impostazione "Animazioni" spegne la parte visiva ma non l'audio.** `useEffettiMossa`
   suona e vibra, poi esce prima di impostare classi e particelle. È deliberato: chi riduce
   il movimento non perde il feedback.

Da sapere: le durate dei tre effetti (260 / 420 / 950 ms) sono scritte **due volte**, in
`useEffettiMossa.js` come costanti JS e in `app.css` dentro le `@keyframes`. Nulla verifica
che restino allineate.

## 6. Decisioni architetturali (ADR brevi)

### ADR-1 — Stack: Vite + React, nessun framework di stato
**Contesto.** Serve un gioco che apra in un browser mobile in pochi decimi di secondo, senza
account e senza pubblicità; il proprietario del progetto sviluppa in JSX.
**Decisione.** Vite 5 come bundler, React 18 come layer di vista, nessuna libreria di stato,
nessun router, nessuna libreria UI. Le dipendenze di produzione sono due: `react` e
`react-dom`.
**Conseguenze.** Bundle minimo e nessuna catena di aggiornamenti di terze parti da inseguire.
Ma tutta la gestione di stato dell'interfaccia va scritta a mano — ed è ciò che stanno facendo
`src/state/usePartita.js` e `src/state/useImpostazioni.js`, con `useState` e nient'altro.

### ADR-2 — JavaScript con JSDoc, non TypeScript
**Contesto.** Il `core/` è la parte in cui un errore di tipo costa di più.
**Decisione.** JS puro, JSDoc sulle API pubbliche, test come rete di sicurezza.
**Conseguenze.** Zero attrito di build e coerenza con il resto dell'ecosistema del
proprietario; in cambio, nessun controllo statico: la correttezza dei confini fra moduli è
garantita solo dai test.

### ADR-3 — Core puro, senza DOM
**Contesto.** Le domande di bilanciamento (quanto dura una partita? quanto spesso si muore
presto?) non si rispondono giocando a mano.
**Decisione.** Regole, punteggio, generatore e motore in moduli senza dipendenze di
piattaforma; la simulazione importa esattamente quei moduli.
**Conseguenze.** Il bilanciamento è misurabile su migliaia di partite e i test non hanno
bisogno di un DOM. In cambio, il `core/` non può fare nulla di ciò che è naturale in un
browser: niente timer, niente accesso allo storage, niente animazioni. Tutto questo dovrà
vivere nei layer sopra.

### ADR-4 — PRNG seeded (mulberry32) al posto di `Math.random`
**Contesto.** Servono test deterministici, simulazioni ripetibili e salvataggi che riprendano
la partita esattamente dov'era.
**Decisione.** PRNG a stato esplicito da 32 bit, salvato dentro lo stato di gioco.
**Conseguenze.** Riproducibilità completa e salvataggi piccoli. In cambio il PRNG va passato
a mano a ogni funzione che ne ha bisogno, e ogni chiamata in più al generatore sposta la
sequenza: una modifica al `generator.js` cambia tutte le partite a parità di seed.

### ADR-5 — Un solo file di costanti di regolamento
**Contesto.** Il bilanciamento si fa spostando numeri e rimisurando.
**Decisione.** Tutte le costanti in `src/config/rules.js`, importate ovunque; nessun numero
magico nei moduli.
**Conseguenze.** Una modifica di bilanciamento è un diff di una riga ed è immediatamente
visibile nei test (che importano le costanti invece di ricopiarne i valori). In cambio,
`rules.js` è un file che tutti importano: cambiarne un nome tocca molti file.

### ADR-6 — Audio sintetizzato, nessun campione registrato
**Contesto.** Il gioco deve poter essere pubblicato senza dubbi di licenza, restare leggero e
non fare richieste di rete.
**Decisione.** `src/audio/suoni.js` genera ogni suono a runtime con oscillatori, inviluppi e
un buffer di rumore filtrato della Web Audio API. Le note stanno su una scala pentatonica
maggiore; l'`AudioContext` nasce solo dentro un gesto dell'utente (`sbloccaAudio()`).
**Conseguenze.** Zero byte di asset audio, zero campioni di terzi da giustificare (vedi
`ASSET_LICENSES.md`) e un suono che può seguire lo stato del gioco: l'arpeggio
dell'eliminazione parte da un gradino più alto man mano che la Catena sale. In cambio la
tavolozza timbrica è quella che quattro forme d'onda permettono, e non esiste alcun test che
verifichi che il suono esca davvero.

### ADR-7 — Game feel a valle di `lastMove`, in un layer separato
**Contesto.** Le animazioni e i suoni sono la parte che cambia più spesso, e sono anche la
parte in cui è più facile intrecciare per sbaglio la logica di gioco.
**Decisione.** Un solo hook (`useEffettiMossa`) legge `lastMove` e produce tutto il feedback;
il motore non conosce il feedback e il feedback non può modificare lo stato. Le particelle
vivono su **un solo canvas** invece che su decine di nodi DOM animati, e il ciclo di
`requestAnimationFrame` esiste solo finché ci sono particelle vive.
**Conseguenze.** Gli effetti si spengono con un interruttore (`animazioni`) senza toccare le
regole, e nessun loop gira a vuoto mentre il giocatore pensa. In cambio le durate degli
effetti sono duplicate fra JS e CSS, e `prefers-reduced-motion` non è sufficiente a fermarli
(vedi `DESIGN_SYSTEM.md`, sezione 6).

## 7. Non ancora deciso

Molte voci di questo elenco sono state chiuse dai commit `9253cc7`, `ee7b452` e `fe290f7`.
Restano aperte queste, e sono aperte per davvero.

- **Prestazioni su dispositivo reale.** `src/ui/Plancia.jsx` disegna 81 `<div>` più un canvas
  sovrapposto; `<canvas>` e SVG per la griglia sono stati scartati implicitamente, senza una
  misura. Lo scenario e2e gira in Chromium su una macchina da sviluppo: **nessuno ha ancora
  aperto PLINTO su un telefono lento**, e con quattro gruppi chiusi insieme si parla di oltre
  trenta celle animate più fino a 900 particelle.
- **Taratura del game feel.** Le costanti dell'interazione — sollevamento del pezzo sopra il
  dito a 1.35 celle, snap al centro più vicino, dimensione della cella nel tray limitata a
  `[11, 28]` px — sono scelte a tavolino e non sono mai state provate su utenti reali.
  L'alternativa a due tocchi e il gioco da tastiera esistono, ma nemmeno quelli sono stati
  osservati in mano a qualcuno.
- **Persistenza: coperta solo a metà.** `sfide.js` ha sei test (`tests/sfide.test.js`), che
  girano grazie a un `localStorage` finto costruito con `vi.stubGlobal`. `storage.js` e
  `records.js` non hanno test propri e sono coperti solo di rimbalzo: nel progetto non è
  configurato nessun ambiente con DOM (`vite.config.js` non definisce una sezione `test`,
  Vitest gira in Node puro). L'altra verifica reale è indiretta: il passo 5 dell'e2e ricarica
  la pagina e controlla che la partita ripresa coincida con quella salvata.
- **i18n: quanto lontano andare.** Esistono italiano e inglese, un fallback a catena (chiave
  mancante → italiano → la chiave stessa) e un test di parità delle chiavi. Non è deciso se
  altre lingue seguiranno. Resta inoltre irrisolto che alcuni testi siano ancora scritti nel
  JSX invece che nei dizionari (etichette dei pezzi nel tray, note di `Info.jsx` e
  `Sostieni.jsx`) e che i numeri siano formattati con `toLocaleString('it-IT')` fisso anche
  in inglese.
- **Accessibilità del tema chiaro.** I contrasti sono stati misurati e corretti solo per il
  tema scuro; il tema chiaro non è conforme e nessuno ha ancora deciso se correggerlo o
  ritirarlo (vedi `DESIGN_SYSTEM.md`, sezione 3).
- **Rientro dall'app in background.** La partita viene salvata a ogni mossa, quindi la
  perdita è al massimo di zero mosse; ma non esiste nessuna gestione esplicita di
  `visibilitychange`, e il comportamento dell'`AudioContext` sospeso dal sistema operativo
  non è mai stato provato su un dispositivo vero.
