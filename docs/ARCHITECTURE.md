# Architettura di QUADRA

> Fotografia del codice al **6 settembre 2026**. Il repository è in sviluppo attivo e i
> layer superiori stavano crescendo mentre questo documento veniva scritto: quello che segue
> descrive solo file e comportamenti verificati leggendo il sorgente in quel momento. Dove una
> cosa non esiste, è scritto che non esiste; dove esiste ma non è ancora verificabile, è
> scritto anche quello. Solo `src/config/`, `src/core/` e `src/sim/` sono committati
> (`532b716`): tutto il resto è ancora lavoro non committato.

## 1. I layer

| Cartella | Contenuto reale | Dipende da | Ambiente |
| --- | --- | --- | --- |
| `src/config/` | `rules.js` — tutte le costanti di regolamento | niente | neutro |
| `src/core/` | `rng.js`, `shapes.js`, `grid.js`, `scoring.js`, `generator.js`, `engine.js` | solo `config/` e se stesso | neutro (né DOM né React) |
| `src/sim/` | `player.mjs` (giocatori artificiali), `run.mjs` (harness da riga di comando) | `core/`, `config/` | Node |
| `src/persistence/` | `storage.js` (wrapper `localStorage`), `records.js` (record e statistiche di vita) | fra loro | **browser** (usa `window`) |
| `src/styles/` | `tokens.css` — variabili CSS del sistema di design | niente | browser |
| `src/i18n/` | `index.js`, `it.js`, `en.js` — dizionari e funzione `t()` | fra loro | browser (legge `navigator.language`, con `try/catch`) |
| `src/ui/` | componenti/hook React (`Plancia`, `Tray`, `Pezzo`, `Hud`, `Logo`, `SchermoGioco`, `useTrascinamento`) e 7 schermate | `core/`, `config/`, React | browser |
| `src/state/` | `usePartita.js`, `useImpostazioni.js` — hook che avvolgono motore e storage | `core/`, `persistence/`, `i18n/`, React | browser |
| `src/feel/` | **vuota** | — | — |
| `src/audio/` | **vuota** | — | — |
| `tests/` | 4 file Vitest sul solo `core/` | `core/`, `config/` | Node |

Stato dei comandi, verificato eseguendoli alle 09:41 del 6 settembre 2026:
`npm test` passa (75 test), `npm run sim` funziona e `npm run build` **riesce**
(60 moduli, `dist/assets` da 180 kB di JS e 12 kB di CSS, rispettivamente 57.6 kB e 3.2 kB
compressi con gzip).

Quello che **non** è verificabile da qui: nessun test copre l'interfaccia, e il gioco non è
mai stato aperto in un browser nel corso di questa analisi. Che compili non dimostra che si
giochi. Tutto ciò che questo documento afferma sull'interfaccia va letto come "così è scritto
oggi il sorgente", non come "così si comporta il gioco".

### Perché i layer sono separati

Il confine che conta è uno solo: **`core/` non sa che esiste un browser**. Non importa React,
non tocca il DOM, non usa timer, non legge `Date` se non per due campi informativi
(`startedAt`/`endedAt`). Questo permette tre cose che altrimenti sarebbero impossibili:

1. i test girano in Node senza jsdom e senza mock;
2. `src/sim/run.mjs` gioca migliaia di partite complete importando gli stessi moduli che
   userà l'interfaccia — non una copia semplificata delle regole;
3. il giorno in cui l'interfaccia esisterà, un bug di regole resterà un bug di `core/`,
   non qualcosa da cercare dentro un componente.

`persistence/` e `i18n/` **non** rispettano quel confine (usano `window` e `navigator`) ed è
corretto così: sono layer di piattaforma, non di regole. Ogni loro accesso è protetto da
`try/catch`, quindi il gioco deve funzionare anche con `localStorage` bloccato — solo senza
memoria fra una partita e l'altra.

## 2. JavaScript + JSDoc, non TypeScript

Decisione presa. Motivi:

- **Coerenza con l'ecosistema del proprietario del progetto**, che sviluppa in JSX puro senza
  passo di tipizzazione. Un secondo linguaggio nel toolchain è attrito quotidiano, non un
  guadagno una tantum.
- **Minore attrito di manutenzione**: nessuna configurazione di compilatore, nessun file di
  definizione, nessun disallineamento fra tipi e realtà a runtime.
- Il costo — perdere il controllo statico — è compensato in parte dai commenti `@param` /
  `@returns` presenti su tutte le funzioni pubbliche del `core/` e in parte dalla suite di
  test, che sul `core/` è densa (75 test).

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
- `seedFromString` permette di derivare un seed da una stringa (per esempio una data). Nel
  codice questo è già usato e testato (`createGame({ seed: '2026-09-06' })`); una modalità di
  gioco che la sfrutti **non è ancora implementata**: esiste solo il campo `seedLabel`.

## 5. `lastMove`: l'unico canale verso il game feel

Dopo ogni mossa `placePiece` scrive in `state.lastMove` un oggetto che descrive *cosa è
successo*, mai *come animarlo*: numero di mossa, `handIndex`, `pieceUid`, `shapeId`, `color`,
`origin`, `placedCells`, `groups` (tipo, indice e celle di ciascun gruppo chiuso),
`clearedCells`, `points`, `breakdown` del punteggio, `chainBefore`, `chainAfter`, `tier`
(`moveTier`: `buona` / `ottima` / `eccellente` / `perfetta`, oppure `null`), `boardCleared`,
`handRefilled`, `gameOver`, `fillAfter`.

È il contratto con il futuro layer `src/feel/` (oggi vuoto): quel layer leggerà `lastMove` e
deciderà scosse, particelle, suoni e intensità. Il motore resta ignaro. Nota verificata:
`deserializeGame` riporta sempre `lastMove: null`, quindi al caricamento di una partita
salvata non si riproduce l'animazione dell'ultima mossa.

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

## 7. Non ancora deciso

Aperti davvero, cioè: non esiste codice che li implementi.

- **Rendering della griglia: scelto ma non verificato.** `src/ui/Plancia.jsx` disegna 81
  `<div>` con un livello sovrapposto per le linee spesse dei quadranti; `<canvas>` e SVG sono
  stati scartati implicitamente, senza che risulti da nessuna parte una misura di prestazioni
  su dispositivi reali. Resta aperto se 81 nodi DOM reggano l'animazione di eliminazione su
  telefoni lenti: non è mai stato provato.
- **Interazione: scelta ma non verificata.** `src/ui/useTrascinamento.js` implementa il drag &
  drop con pointer events, sollevamento del pezzo sopra il dito (1.35 celle su touch), scala
  alla dimensione della griglia e snap al centro di cella più vicino. Nessuna di queste
  costanti è stata tarata su utenti reali, e non esiste un'alternativa tap-per-appoggiare per
  chi non riesce a trascinare.
- **Sistema audio.** `src/audio/` è vuota. È aperta anche la scelta di fondo: campioni
  registrati contro sintesi procedurale via Web Audio (che eviterebbe qualunque asset esterno;
  vedi `ASSET_LICENSES.md`).
- **Game feel.** `src/feel/` è vuota. Il contratto d'ingresso (`lastMove`) c'è, ciò che ne
  esce no.
- **Persistenza: scritta, mai eseguita.** `storage.js` dichiara quattro chiavi (`records`,
  `settings`, `partita`, `statistiche`); `records.js` usa le prime e le ultime, e gli hook di
  `src/state/` leggono e scrivono le altre. Nulla di tutto ciò ha test, perché richiederebbe un
  ambiente con `localStorage` che oggi non è configurato.
- **i18n: quanto lontano andare.** Esistono italiano e inglese e un fallback a catena
  (chiave mancante → italiano → la chiave stessa). Non è deciso se altre lingue seguiranno né
  come si sceglie la lingua in interfaccia.
- **Gestione dello stato di UI: scelta ma non collaudata.** `src/state/usePartita.js` avvolge
  il motore in un hook con `useState`, senza reducer e senza libreria esterna. Non è ancora
  passato attraverso una partita reale, quindi non si sa se regge (per esempio) il rientro
  dall'app in background.
