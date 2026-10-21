# Collaudo 1.21.21 (PO-024, PO-025)

Ramo `collaudo-1.21.21`, 21 ottobre 2026. Nessuna correzione: solo misure. Classi: **E** errore
grave, **D** difetto, **O** osservazione. Per ogni voce le opzioni, la consigliata per prima.

**Sintesi**: le due novità fanno ciò che promettono in tutti i formati e le lingue
provati, i sei e2e chiesti sono verdi contro il sito, nessuna regressione su PO-023, sui
pulsanti dei menu e sul gioco. Nessun E. Un D che **non nasce con la 1.21.21** (c'è uguale
nella 1.21.20) ma che la 1.21.21 rende più visibile: con un pezzo scelto, Invio/Spazio
sul menu aperto posano il pezzo sotto il velo (D1). Tre O.

## 0. Che cosa è stato collaudato

- Sito: `https://antoniovairo-rgb.github.io/Plinto/`. L'HTML carica `assets/index-K6eW_1CD.js`;
  nel bundle «1.21.21» compare 4 volte, nessun'altra versione 1.21.x.
- `npm run build` sul commit `3a7d879` (punta di `main`) produce lo stesso nome,
  `dist/assets/index-K6eW_1CD.js`: il sito pubblicato è la build di questo commit.
- CI su `main` (letta con l'API di GitHub alle 05:39 e alle 05:47 UTC): «pubblica su Pages»
  verde per `3a7d879` (run 196) e per il merge `d4cfba4` (run 195); «verifica» run 199
  (`3a7d879`) e run 198 (`d4cfba4`) ancora **in corso** a entrambe le letture. Il loro
  esito: **non posso confermarlo**. L'ultima «verifica» conclusa su `main` è la run 196
  (`0219293`, prima della 1.21.21), verde.
- Ambiente: container figlio, Chromium `/opt/pw-browsers/chromium` (→ `chromium-1194`),
  font del container, rete verso GitHub Pages attraverso il proxy. Nessun telefono vero,
  nessun TalkBack/VoiceOver, nessun iOS.

## 1. Script del progetto contro il sito pubblicato

`npm ci` riuscito. Tutti con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`,
Chromium di `/opt/pw-browsers` (`chromium-1194`), font del container, uno dopo l'altro.

| Script | Uscita | Durata | Ultima riga / esito |
|---|---|---|---|
| `npm run home-spiegazione` | 0 | 165 s | «La riga c'e' in italiano e in inglese, … «Nuova» sta dentro la card della libera.» |
| `npm run e2e-po008` | 0 | 110 s | «Tutto a posto.» (casi A–Q) |
| `npm run e2e` | 0 | 20 s | «Nessun problema rilevato.» |
| `npm run indietro` | 0 | 13 s | «Tutte le verifiche del tasto Indietro sono passate.» |
| `npm run annulla` | 0 | 6 s | «Il "rimetti a posto" compare quando deve, ripristina esattamente, e poi sparisce.» |
| `npm run e2e-attrezzi` | 0 | 43 s | «Nessun problema rilevato.» |

- `home-spiegazione`: colonna `morti` **0** in tutti gli stati `libera` e `tutte`, 8 formati,
  it ed en, con gli stessi pixel di card del rapporto PO-024/025 (it 320x700 `0/18367`,
  en 320x700 `0/14015`, 360x640 `0/16388`, 390x844 `0/17978`, 1366x768 `0/19631`…);
  colonna «Nuova» `102/102` o `105/105` come prima (PO-023 invariato); colonna «scorre» 0
  ovunque.
- `e2e-po008` caso Q: «libera Escape: Menu; libera velo: Menu; libera Torna alla partita:
  Menu; libera Indietro: Menu; domanda sopra, poi Esc: Menu; Torna alla home: home, fuoco
  <body>; livello Escape: Menu». Caso P (PO-023): «home Esc: Nuova partita libera; home
  velo: Nuova partita libera; … Riprova Esc: Menu; Gioca velo: Gioca».
- `e2e-quadri` e `recensione` (i due rossi noti dei container figli) non lanciati: non
  erano nell'elenco.

## 2. Prove a mano (Playwright, sito pubblicato)

Uno script mio (fuori dal repository, nello scratchpad), 4 formati × 2 lingue: 320x700,
360x640, 390x844, 1366x768, it ed en. Stato iniziale scritto in `localStorage` come fa
`home-spiegazione` (record, dieci livelli, libera con una mossa; nello stato `tutte` anche
sfida di oggi e livello 11). 568 controlli: **552 come atteso**, 16 diversi dall'atteso,
spiegati sotto (8 sono un'attesa sbagliata mia, 8 sono D1).

### 2.1 PO-025, angoli della card della libera

| Misura | Esito (tutti gli 8 casi) |
|---|---|
| Spazzata di ogni pixel della card, punto a +0,25 px (diverso dal +0,5 di `home-spiegazione`) | **0 morti**. Es. it 320x700: 18 375 punti, «Nuova» 3 886, «Riprendi ›» 14 489; en 390x844: 17 983, 2 652, 15 331 |
| `border-radius` del `::after` di «Riprendi ›» / della card | 14px / 14px ovunque |
| Punti a 5 px da ciascuno dei quattro angoli | tutti «Riprendi ›» |
| Punti a 1–3 px dagli angoli | fuori dalla card (cadono oltre la curva di 14 px: lì la card non si disegna), quindi non contano; a 1366x768 a 3 px l'angolo alto-sinistro è già dentro, «Riprendi ›» |
| Schermata della card con e senza la classe `pl-sfida-avvio--riprendi-angoli` | **byte identici** in tutti gli 8 casi: a schermo non cambia niente |
| Senza la classe (tolta a mano nel DOM) | il punto a (2,2) dentro la card torna «morto»: la misura sa fallire |
| Tocco vero (mouse) a 5 px dall'angolo alto-destro | si apre la partita libera in corso |
| Tocco vero a 5 px dall'angolo basso-sinistro | si apre la partita (non la domanda di «Nuova»). Era l'**attesa sbagliata** mia: «Nuova» sta a metà riga, non nell'angolo; la spazzata dice che lì c'è «Riprendi ›». Non è un difetto |
| PO-023, colonna sotto «Nuova» (`home-spiegazione`) | 102/102 o 105/105, invariata |

Schermata: `collaudo-1.21.21/card-libera-it-320x700.png`.

### 2.2 La home non scorre

Stati `vuota`, `libera`, `tutte`, 8 casi: `.pl-home` 0 px di scorrimento, documento 0 px,
orizzontale 0 px in tutti e 24. Con `home-spiegazione` (8 formati × 5 stati × 2 lingue)
colonna «scorre» 0 ovunque. Schermata: `collaudo-1.21.21/home-tutte-it-320x700.png`.

### 2.3 PO-024, il menu della partita

Menu aperto con la tastiera (fuoco su «Menu», Invio), salvo dove scritto. Uguale negli 8
casi, libera, sfida e livello:

| Prova | Esito |
|---|---|
| All'apertura | fuoco su «Torna alla partita» / «Back to the game»; `role="dialog"`, `aria-modal="true"`, `aria-label` «Menu» |
| Aperto col mouse | fuoco su «Torna alla partita» |
| Chiuso con Escape, velo (3,3), «Torna alla partita», Indietro | chiuso, si resta nella partita, fuoco su «Menu» (libera, sfida, livello) |
| Libera a metà, «Nuova partita» | si apre la domanda, il menu resta sotto, fuoco nella domanda su «Riprendi la partita» |
| … Escape | si chiude solo la domanda, fuoco su «Nuova partita» del menu; secondo Escape: menu chiuso, fuoco su «Menu», griglia invariata |
| … tocco sul velo della domanda, poi Escape | come sopra |
| … Indietro, poi Indietro | il primo chiude la domanda (menu aperto), il secondo il menu; si resta nella partita, fuoco su «Menu» |
| … «Nuova partita» nella domanda | menu e domanda chiusi, griglia vuota, fuoco `<body>` (scelta: come deciso) |
| … «Riprendi la partita» nella domanda | menu e domanda chiusi, griglia invariata, fuoco `<body>`: vedi O1 |
| «Nuova partita» a zero mosse | nessuna domanda, partita nuova, fuoco `<body>` (scelta aperta 2 di PO-024, come prima) |
| «Torna alla home» (libera e sfida) | home |
| Livello, «Riprova» con mosse → domanda → Escape | domanda chiusa, fuoco su «Menu» (PO-023 intatta) |
| Livello, «Riprova» → «Sì, ricomincia da capo» | livello ricominciato, griglia vuota |
| Livello, «Riprova» a zero mosse | nessuna domanda, menu chiuso |
| Livello, «Torna ai livelli» | mappa |
| Voci del menu della sfida | «Torna alla partita», «Nuova partita», «Torna alla home» |
| Tab dall'ultimo pulsante del menu | `<body>`, poi «Menu» dietro il velo: vedi O2 |

Schermata: `collaudo-1.21.21/menu-livello-en-320x700.png`.

### 2.4 PO-023, domande della home (regressioni)

«Nuova» della card con la libera a metà, aperta con Invio, 8 casi: chiusa con Escape o col
velo il fuoco torna su «Nuova» (nome «Nuova partita libera»); il primo pulsante della
domanda («Riprendi la partita» / «Resume game») apre la partita. Caso P di `e2e-po008`
verde.

### 2.5 Gioco

Una mossa trascinata col mouse posa il pezzo e il punteggio sale (es. «PUNTEGGIO 0» →
«PUNTEGGIO 5», it 390x844); `npm run e2e`, `annulla`, `e2e-attrezzi` verdi (§1).

## 3. Voci

### D1 — Con un pezzo scelto, Invio e Spazio sul menu aperto posano il pezzo sotto il velo

**Misura** (390x844 it, script a parte, stessa sequenza sul sito 1.21.21 e su una build
locale di `e77570c` = 1.21.20, servita da `127.0.0.1` e poi fermata): pezzo scelto con un
tocco (clic) nel vassoio, «Menu» col clic, poi un tasto.

| Tasto | 1.21.20 | 1.21.21 |
|---|---|---|
| Invio | pezzo posato sotto il velo, menu aperto, fuoco su «Menu» | pezzo posato sotto il velo, **menu aperto**, fuoco su «Torna alla partita» |
| Spazio | uguale: pezzo posato, menu aperto | uguale: pezzo posato, menu aperto |
| Freccia destra | cursore e anteprima si spostano sotto il velo | uguale |
| Escape | pezzo lasciato, menu **resta aperto** | pezzo lasciato **e** menu chiuso con un solo tasto, fuoco su «Menu» |

Con la sola tastiera (pezzo scelto con Invio, poi Tab su «Menu» e Invio) il menu **non si
apre**: Invio posa il pezzo (identico in 1.21.20 e 1.21.21).

**Causa** (dal codice, non provata modificandolo): `useTastiera` ascolta `keydown` su
`window` finché la partita è `playing` (`src/ui/SchermoGioco.jsx:207-208`,
`src/ui/useTastiera.js:83-88` e `:91`), senza sapere del menu; con un pezzo scelto Invio e
Spazio fanno `preventDefault()` e posano, quindi il pulsante che ha il fuoco non riceve il
clic. Anche il menu ascolta Escape su `window` (`src/ui/MenuPartita.jsx:50-52`), così Escape
vale per tutti e due (`useTastiera.js:63-64`).

**Perché è D e non E**: serve un pezzo scelto (tocco o tastiera) e poi la tastiera col menu
aperto; non perde partite, ma posa un pezzo che il giocatore non vede (il velo è sfocato,
schermata `collaudo-1.21.21/pezzo-invio-1.21.21.png`) mentre il menu dice «Torna alla
partita». Non è una regressione della 1.21.21; la 1.21.21 però mette il fuoco su «Torna
alla partita» e promette «il menu si usa come le domande», e con un pezzo in mano non è
così. Se capita anche con le domande sopra la partita (es. «Riprova»): **non posso
confermarlo**, non l'ho provato.

Opzioni:
- A **(consigliata)**: i tasti della partita tacciono mentre è aperto il menu (o una
  domanda): `useTastiera` con `attivo` falso quando `menuAperto`/`conferma`; un caso in
  `e2e-po008` con un pezzo scelto, rosso prima.
- B: aprire il menu lascia il pezzo scelto (come un tocco fuori); Escape torna a fare una
  cosa sola.
- C: lasciare com'è e scriverlo nei limiti noti.

### O1 — «Riprendi la partita» nella domanda sopra il menu lascia il fuoco su `<body>`

Libera a metà, menu, «Nuova partita», «Riprendi la partita»: menu e domanda si chiudono, si
resta nella stessa partita, griglia invariata, fuoco `<body>` (8 casi su 8). Per il codice è
una scelta (`ConfermaDoppia.jsx:139` mette `scelto`; `MenuPartita.jsx:67` l'aveva già messo
per «Nuova partita»), coerente con «dopo una scelta il fuoco non si sposta». Ma per chi
gioca è la stessa cosa di «Torna alla partita» del menu, che invece riporta il fuoco su
«Menu». Il Tab dopo riparte dall'inizio della pagina.
- A **(consigliata)**: quando «Riprendi la partita» lascia la stessa schermata, il fuoco
  va su «Menu» come per «Torna alla partita» (stesso ripiego `.pl-hud__menu` già usato da
  «Riprova»).
- B: lasciare com'è (decisione PO-023/PO-024 «dopo una scelta no»), scriverlo.

### O2 — Il Tab esce dal menu `aria-modal`

Dal menu: Tab → «Nuova partita» → «Torna alla home» → `<body>` → «Menu» dietro il velo (8
casi). Dichiarato nel rapporto PO-024/025 («Nessuna trappola del Tab… non c'è nemmeno nelle
domande»), quindi atteso; lo segnalo perché ora il menu si dichiara `aria-modal="true"` e il
fuoco può andare dove il lettore di schermo dice che non si va. Escape dopo il Tab chiude
comunque il menu e il fuoco torna su «Menu». Con TalkBack: **non posso confermarlo**.
- A **(consigliata)**: decidere insieme a O3 di PO-023 (ascolto con TalkBack), per menu e
  domande insieme.
- B: chiudere il giro del Tab dentro menu e domande.
- C: lasciare com'è.

### O3 — Verifiche che da qui non si possono fare

- Esito della CI «verifica» per `d4cfba4` e `3a7d879`: in corso alle 05:47 UTC, **non posso
  confermarlo**.
- TalkBack sul menu `dialog` e sulle due finestre `aria-modal` insieme (domanda sopra il
  menu); iOS (fuoco dopo un tocco, ripiego su `.pl-hud__menu`); telefono vero e font del
  telefono: **non posso confermarlo**.
- Opzioni: A **(consigliata)** ascolto e prova su telefono prima della prossima versione
  che tocca menu o domande; B leggere solo la CI e chiudere.

## 4. Pulizia

Server della build 1.21.20 fermato per PID (`/proc/<pid>/exe` = python3, poi la porta non
risponde più), worktree temporaneo rimosso. Nessun `vite` lanciato da me. Niente toccato
fuori da `docs/sviluppo/COLLAUDO-1.21.21.md` e `docs/sviluppo/collaudo-1.21.21/`.
