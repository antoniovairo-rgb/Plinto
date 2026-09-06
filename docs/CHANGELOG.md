# Changelog

Tutte le modifiche degne di nota a QUADRA. Il formato segue una versione semplificata di
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa
[Versionamento Semantico](https://semver.org/lang/it/).

La versione è dichiarata in un solo posto — il campo `version` di `package.json` — e
`vite.config.js` la inietta nel bundle come `__APP_VERSION__`.

## [0.1.0] — non ancora rilasciata

Primo nucleo del progetto: il motore di gioco, il generatore, gli strumenti di misura e una
prima interfaccia. Il progetto compila (`npm run build` riesce), i 75 test unitari passano e
lo scenario `npm run e2e` guida un browser reale attraverso una partita completa. Che
compili non dimostra che si giochi. Da considerarsi non rilasciabile.

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
- 75 test Vitest su griglia, punteggio, generatore e motore.

**Interfaccia e contorno — scritti, non ancora collaudati**
- `src/ui/`: componenti React della plancia, del tray, dell'HUD e delle schermate; hook di
  trascinamento con pointer events.
- `src/state/`: hook `usePartita` e `useImpostazioni`.
- `src/persistence/`: wrapper protetto su `localStorage` e registro dei record personali.
- `src/i18n/`: dizionari italiano e inglese con fallback a catena.
- `src/styles/tokens.css`: sistema di design (colori, geometria, tempi, tema chiaro,
  riduzione delle animazioni) e `app.css`.
- `index.html`, `src/main.jsx`, `src/config/progetto.js`.
- `public/icon.svg` (icona originale in SVG) e `public/manifest.webmanifest`.

**Documentazione**
- `README.md` e i documenti in `docs/`: architettura, regole di gioco, test, questo changelog
  e il registro degli asset.

### Deciso durante lo sviluppo (bilanciamento)

- La prima versione del generatore imponeva che ogni pezzo avesse almeno **4 posizioni valide**
  finché il riempimento era sotto il **50%**. Misurato: la mediana delle mosse per partita è
  salita **da 83 a 191** e la difficoltà si è appiattita. La regola è stata ridotta ad **almeno
  2 posizioni valide, solo sotto il 30% di riempimento** (`MIN_PLACEMENTS_EARLY = 2`,
  `RISKY_PIECE_FILL = 0.3`).
- Il moltiplicatore Catena applicato a una mossa è quello **precedente** alla mossa, cioè
  quello che il giocatore vedeva nell'interfaccia. È una scelta di trasparenza, non di
  bilanciamento.

### Noto e non risolto

- I profili di simulazione `esperto` e `normale` producono risultati praticamente identici
  (media 1443 contro 1393, mediana 1082 contro 1030). Non è ancora chiaro se il difetto sia
  nell'euristica del giocatore artificiale o nel gioco, che potrebbe non premiare abbastanza la
  strategia. Misura in corso con il profilo `stratega`; vedi `docs/TESTING.md`.
- L'interfaccia è coperta solo dallo scenario `npm run e2e`; non esistono test unitari sui
  componenti. `playwright` è fra le
  dipendenze di sviluppo, ma non esiste ancora nessun test che lo usi.
- Il link di donazione in `src/config/progetto.js` è volutamente vuoto e va inserito a mano
  dal proprietario del progetto.
