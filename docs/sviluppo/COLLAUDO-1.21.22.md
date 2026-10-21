# Collaudo 1.21.22 (PO-026)

Ramo `collaudo-1.21.22`, 21 ottobre 2026. Nessuna correzione: solo misure. Classi: **E** errore
grave, **D** difetto, **O** osservazione. Per ogni voce le opzioni, la consigliata per prima.

**Sintesi**: le due novità fanno ciò che promettono in tutti i formati e le lingue
provati (libera, sfida e livello), i sei e2e chiesti sono verdi contro il sito, la partita si
gioca con la sola tastiera (scegli, muovi, posa, annulla, gessetto, carriola), nessuna
regressione su PO-023 e PO-024. Nessun E. Un D che **non nasce con la 1.21.22** (c'è uguale
nella 1.21.21, misurato): il **pannello degli attrezzi** è un velo che la correzione non
copre, e con un pezzo scelto Invio e Spazio posano il pezzo sotto il pannello, spendendo una
mossa del livello (D1). Tre O, tutte già presenti nella 1.21.21 o nel codice di prima.

## 0. Che cosa è stato collaudato

- Sito: `https://antoniovairo-rgb.github.io/Plinto/`. L'HTML carica `assets/index-CSCcVQz9.js`;
  nel bundle «1.21.22» compare 4 volte, nessun'altra versione 1.21.2x.
- `npm run build` sul commit `7430d69` (punta di `main`, ramo `collaudo-1.21.22` partito da
  lì) produce lo stesso nome, `dist/assets/index-CSCcVQz9.js`: il sito pubblicato è la build
  di questo commit (la 1.21.22 è entrata con il merge `2d9e4ca`).
- CI su `main` (API di GitHub, lettura delle ~11:50 UTC): «pubblica su Pages» verde per
  `7430d69` (run 200) e `2d9e4ca` (run 199); «verifica» run 203 (`7430d69`) e 202
  (`2d9e4ca`) **in corso**. Il loro esito: **non posso confermarlo**. L'ultima «verifica»
  conclusa su `main` è la run 201 (`d7cab9a`, prima della 1.21.22), verde.
- Ambiente: container figlio, Chromium `/opt/pw-browsers/chromium` (`chromium-1194`), font
  del container, rete verso GitHub Pages attraverso il proxy. Nessun telefono vero, nessuna
  tastiera fisica su un telefono, nessun TalkBack/VoiceOver, nessun iOS.

## 1. Script del progetto contro il sito pubblicato

`npm ci` riuscito. Tutti con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/` (il
sito risponde, quindi nessuno script ha avviato un server locale), uno dopo l'altro.

| Script | Uscita | Durata | Ultima riga / esito |
|---|---|---|---|
| `npm run e2e-po008` | 0 | 134 s | «Tutto a posto.» (24 righe, casi A–R) |
| `npm run home-spiegazione` | 0 | 160 s | «La riga c'e' in italiano e in inglese, … «Nuova» sta dentro la card della libera.» |
| `npm run e2e` | 0 | 18 s | «Nessun problema rilevato.» |
| `npm run indietro` | 0 | 13 s | «Tutte le verifiche del tasto Indietro sono passate.» |
| `npm run annulla` | 0 | 5 s | «Il "rimetti a posto" compare quando deve, ripristina esattamente, e poi sparisce.» |
| `npm run e2e-attrezzi` | 0 | 41 s | «Nessun problema rilevato.» |

- `e2e-po008` caso R (la novità): «menu Invio: pezzo scelto, fuoco Menu; menu Spazio: pezzo
  scelto, fuoco Menu; menu Escape: pezzo scelto, fuoco Menu; domanda sopra il menu Escape:
  pezzo scelto, fuoco menu: Nuova partita; domanda sopra il menu Invio: pezzo scelto, fuoco
  Menu; domanda sopra il menu Spazio: pezzo scelto, fuoco Menu; Riprova Invio: pezzo scelto,
  fuoco Menu; Riprova Escape: pezzo scelto, fuoco Menu; tastiera a menu chiuso: pezzo
  posato». Casi P e Q (PO-023, PO-024) come nel collaudo 1.21.21.
- `e2e-quadri` e `recensione` (i due rossi noti dei container figli) non lanciati: non erano
  nell'elenco.

## 2. Prove a mano (Playwright, sito pubblicato)

Uno script mio (fuori dal repository, nello scratchpad), 4 formati × 2 lingue: 320x700,
360x640, 390x844, 1366x768, it ed en; un contesto nuovo per ogni scenario (libera, livello 13
con dodici livelli fatti e 3 gettoni, sfida con una libera a metà). Il pezzo si sceglie con la
tastiera (Tab fino al pezzo, Invio) e il cursore si sposta di due righe in su; il menu si
apre con un **clic** su «Menu», perché con la sola tastiera Invio su «Menu» posa il pezzo
(PO-027, limite noto). **624 controlli: 612 come atteso, 12 diversi** (8 sono D1, 4 sono
un'attesa sbagliata mia, sotto), più 56 righe di sola misura.

### 2.1 `TASTI_TACCIONO_SOTTO_IL_VELO`

Uguale negli 8 casi e nei tre modi, salvo dove scritto. «Uguale» vuol dire: pezzo ancora
scelto, cursore nella stessa casella (es. 22 → 22), firma della partita (punteggio, obiettivo,
mosse, caselle occupate) identica.

| Finestra aperta, pezzo scelto | Tasti | Esito |
|---|---|---|
| menu (libera, sfida, livello) | → , D, W, P | niente sotto il velo, fuoco resta su «Torna alla partita» |
| menu | Invio / Spazio / Escape | menu chiuso, fuoco su «Menu», pezzo scelto, cursore e partita uguali |
| … poi, a menu chiuso | → | il cursore si sposta di una casella (22 → 23): la tastiera è tornata alla partita |
| … poi | Escape | il pezzo viene lasciato |
| domanda «Nuova partita» sopra il menu della libera (aperta con Tab+Invio dentro il menu) | → , D, W, P | niente; fuoco resta su «Riprendi la partita» |
| … | Escape | chiude solo la domanda; menu aperto, fuoco su «Nuova partita» del menu, pezzo scelto |
| … Invio di nuovo | Invio | la domanda si riapre |
| domanda di «Riprova» del livello (2 mosse fatte) | → , D, W, P | niente; fuoco resta su «Torna alla partita» della domanda |
| … | Spazio / Invio / Escape | domanda chiusa, livello uguale, fuoco su «Menu», pezzo scelto |
| domanda «Nuova partita» sopra il menu della **sfida** (libera a metà) | → , D, W, P, poi Escape | niente sotto il velo; Escape chiude solo la domanda, fuoco su «Nuova partita» del menu |

Il tasto P (solo nel livello, che è in modalità anteprima): a menu chiuso porta il fuoco su
«Prossimi tre pezzi» / anteprima (8 su 8); sotto il velo non lo sposta (8 su 8).
Schermate: `collaudo-1.21.22/menu-pezzo-scelto-it-390x844.png`,
`collaudo-1.21.22/riprova-pezzo-scelto-it-360x640.png`,
`collaudo-1.21.22/domanda-sopra-menu-en-320x700.png`.

### 2.2 `RIPRENDI_TORNA_A_MENU`

| Prova | Esito (8 casi) |
|---|---|
| Libera, domanda sopra il menu, Invio su «Riprendi la partita» / «Resume game» | tutto chiuso, fuoco su «Menu», pezzo scelto, partita uguale |
| … stessa cosa con Spazio | uguale |
| … poi Tab | fuoco sul primo pezzo («Pezzo 1, … caselle» / «Piece 1, … squares») |
| … poi Escape | il pezzo viene lasciato |
| Livello, domanda di «Riprova», Invio o Spazio su «Torna alla partita» | fuoco su «Menu» (vedi 2.1) |
| Sfida, domanda sopra il menu, Invio su «Riprendi la partita» | si va nella libera, fuoco `<body>` (16 su 16 fra 2.1 e le prove a parte). È la scelta aperta 2 di PO-026, lasciata com'era: non è una voce. Vedi però O1 |

### 2.3 Partita con la sola tastiera

| Prova | Esito |
|---|---|
| Home → libera / sfida / «Gioca livello» con Tab+Invio | entra in 1–3 Tab; la presentazione del livello si passa con 1–2 Tab e Invio su «Gioca» / «Play» |
| Tre mosse (libera) / due mosse (livello, sfida): Tab al pezzo, Invio, frecce, Invio | tutte posate, 8 su 8 in ogni modo |
| W e A | muovono il cursore (22 → 12) |
| «Rimetti a posto» con Tab+Invio | la partita torna identica (5–6 Tab), 8 su 8 in ogni modo |
| Pastiglia degli attrezzi con Tab+Invio | il pannello si apre (fuoco `<body>`: vedi O3) |
| Gessetto con Tab+Invio | 4 caselle segnate, un gettone in meno, 8 su 8 |
| Carriola con Tab+Invio, poi Tab al pezzo e Invio | il pezzo cambia, un gettone in meno, 8 su 8 |
| Piccone con Tab+Invio | si entra nello scavo, ma non si può scegliere la casella: vedi O2 |
| «Lascia stare» / «Never mind» con Tab+Invio | esce dallo scavo, 8 su 8 |

Mensola: **non provata** con la tastiera.

### 2.4 Regressioni PO-023 e PO-024

| Prova | Esito (8 casi) |
|---|---|
| Menu aperto con Invio su «Menu» (nessun pezzo scelto) | fuoco su «Torna alla partita», `role="dialog"` |
| Escape; tocco sul velo | menu chiuso, fuoco su «Menu» |
| Domanda sopra il menu, seconda scelta («Nuova partita») | partita nuova, griglia vuota |
| Home, libera a metà: «Nuova» con Tab+Invio, poi Escape | domanda chiusa, fuoco torna su «Nuova» («Nuova partita libera» / «New free game») |
| Nessun errore di pagina né di console | 0 in tutti i 24 contesti |

**Attesa sbagliata mia** (4 dei 12 «diversi»): in inglese avevo scritto che il nome di «Nuova»
fosse «New game», mentre è «New free game» (`src/i18n/en.js:20`, `home.nuovaLibera`). Il
fuoco è tornato al pulsante giusto in tutti e 4 i casi: non è un difetto.

## 3. Voci

### D1 — Con un pezzo scelto, Invio e Spazio sul pannello degli attrezzi posano il pezzo sotto il velo

**Misura** (livello 13, sito 1.21.22, 8 formati×lingua nello script di § 2 più 3 prove a parte
a 390x844 it): pezzo scelto con la tastiera e cursore in un posto dove entra (anteprima senza
caselle vietate), pannello aperto con un **clic** sulla pastiglia, poi un tasto.

| Tasto | Esito |
|---|---|
| Invio | **pezzo posato** sotto il pannello, il pannello resta aperto: punteggio 0 → 3, **mosse 18 → 17** (prova a parte); nello script 6 → 10, mosse 16 → 15, 8 su 8 |
| Spazio | uguale: 0 → 3, mosse 18 → 17 |
| Freccia destra | il cursore si sposta sotto il pannello (22 → 23) |
| Escape | chiude il pannello, il pezzo resta scelto (giusto) |

Stessa sequenza sulla build locale della **1.21.21** (`815adc8`, `index-K6eW_1CD.js`, lo stesso
nome del bundle pubblicato allora, servita da `127.0.0.1:4174` e poi fermata per PID): Invio
posa uguale (0 → 3, mosse 18 → 17). **Non nasce con la 1.21.22.**

Schermate: `collaudo-1.21.22/pannello-attrezzi-prima-invio-it-390x844.png` (pannello aperto,
pezzo scelto) e `…-dopo-invio-…` (pannello ancora aperto, pezzo sparito dal vassoio, punteggio
3 dietro il velo).

**Causa** (dal codice, non provata modificandolo): il velo del pannello
(`src/ui/Attrezzi.jsx:143-147`, `pl-velo` e `role="dialog"`) vive dentro `SchermoGioco` come
`modoAttrezzo === 'scelta'` (`src/ui/SchermoGioco.jsx:558-572`), mentre `tastiAttivi` guarda
solo `coperto` (`src/ui/SchermoGioco.jsx:118`), che `App.jsx` calcola come
`menuAperto || !!conferma` (`src/ui/App.jsx:717` e `:761`). Il pannello non è né l'uno né
l'altro.

**Perché D e non E**: serve un pezzo scelto e poi il pannello aperto col tocco o col mouse
(con la sola tastiera Invio sulla pastiglia posa già il pezzo: è PO-027). Ma nel livello costa
**una mossa** che il giocatore non vede (il pannello copre la griglia), e il pannello dice
«Torna alla partita».

**Opzioni**:
- A **(consigliata)**: estendere la stessa regola al pannello: `tastiAttivi` falso anche con
  `modoAttrezzo === 'scelta'` (e P muto), sotto lo stesso interruttore o uno nuovo; un
  sotto-caso nel caso R di `e2e-po008` (o in `e2e-attrezzi`).
- B: chiudere il pannello (o lasciare il pezzo) quando si sceglie un pezzo, o lasciare il
  pezzo quando si apre il pannello.
- C: lasciare com'è e scriverlo fra i limiti noti.

### O1 — Dalla sfida a «Riprendi la partita»: nella libera c'è un pezzo già scelto

**Misura** (390x844 it, prove a parte, 4 su 4 sul sito, 2 su 2 sulla build 1.21.21): libera
con due mosse, poi sfida con una mossa, pezzo 3 della sfida scelto (col tocco o con la
tastiera), menu → «Nuova partita» → domanda → «Riprendi la partita» (clic o Invio). Si apre la
libera (griglia identica a prima: caselle 32.33.34.39.40.41.43.52), ma il **posto 3 del vassoio
è scelto** e la riga dice «Tocca un pezzo, poi tocca dove metterlo»: è un altro pezzo (nella
sfida era da 1 casella, nella libera da 4), che il giocatore non ha mai scelto in questa
partita. Se il pezzo della sfida era stato scelto con la tastiera, nella libera compare anche
il cursore al centro con l'anteprima del nuovo pezzo (6 caselle). Il fuoco è su `<body>`. Un
Invio successivo lascia il pezzo (lì non entrava). Schermata:
`collaudo-1.21.22/libera-pezzo-ereditato-it-390x844.png`.

Uguale nella 1.21.21 con il clic; con Invio, nella 1.21.21 il pezzo veniva posato nella
sfida sotto il velo (il D1 del collaudo 1.21.21), quindi questa strada con la tastiera la
1.21.22 la rende raggiungibile. **Causa**: non posso confermarlo. Ipotesi dal codice, non
provata: libera e sfida usano lo stesso `SchermoGioco` (`src/ui/App.jsx:752-766`), e la scelta
del pezzo (`useTrascinamento`, `src/ui/SchermoGioco.jsx:218`) non si azzera quando cambia la
partita.

**Opzioni**:
- A **(consigliata)**: azzerare la scelta del pezzo (e il cursore) quando cambia la partita a
  schermo (modo o seme), con un caso in `e2e-po008`.
- B: lasciarla com'è (il pezzo si può lasciare con un tocco o con Escape) e scriverla.

### O2 — Il piccone non si usa con la tastiera

**Misura** (8 su 8): pannello e piccone con Tab+Invio, si entra nello scavo; nessuna casella
può avere il fuoco (0 caselle con `tabIndex` ≥ 0), il giro del Tab è «Menu → Lascia stare →
pezzi → `<body>`», frecce e Invio non tolgono niente (caselle occupate 14 → 14; prova a parte
8 → 8); col clic su una casella occupata lo scavo funziona (8 → 7 blocchi). Le caselle sono
`div` senza `tabIndex` e lo scavo ascolta solo `onPointerUp` (`src/ui/Plancia.jsx:60-72`,
`src/ui/SchermoGioco.jsx:366-371`). Non è una novità della 1.21.22 (codice non toccato). In
più, con un pezzo scelto **nello scavo** Tab+Invio su un pezzo lo sceglie (cursore al centro,
anteprima) restando nello scavo; Escape lo lascia.

**Opzioni**:
- A **(consigliata)**: nello scavo le frecce muovono il cursore della griglia e Invio scava,
  come per posare un pezzo; scriverlo nell'aiuto (`aiuto.tastiera`).
- B: scriverlo fra i limiti noti e nell'aiuto («il piccone si usa col tocco»).
- C: lasciare com'è.

### O3 — Il pannello degli attrezzi non prende il fuoco

**Misura** (8 su 8): aperto con Tab+Invio o col clic sulla pastiglia, il fuoco resta su
`<body>` (la pastiglia sparisce mentre il pannello è aperto); dopo una scelta (gessetto,
piccone) il fuoco è su `<body>`; a pannello aperto, un Tab porta il fuoco sui pezzi dietro il
velo («Pezzo 1, 3 caselle», prova a parte). Il menu della partita invece, dalla 1.21.21
(PO-024), mette il fuoco su «Torna alla partita» e alla chiusura lo riporta su «Menu». Escape
chiude il pannello (`src/ui/Attrezzi.jsx:137-141`). Nessun dato su TalkBack: non posso
confermarlo.

**Opzioni**:
- A **(consigliata)**: trattare il pannello come il menu (fuoco sul primo attrezzo o su «Torna
  alla partita», alla chiusura senza scelta fuoco sulla pastiglia), insieme a D1.
- B: lasciare com'è e aggiungerlo a O2 del collaudo 1.21.21 (il Tab che esce dal menu).

### Note, non voci

- PO-027 (pezzo scelto, Tab su «Menu», Invio posa il pezzo): limite noto, non riportato.
  Rivisto di passaggio: vale anche per la pastiglia degli attrezzi (D1, ultima riga).
- Sfida → «Riprendi la partita» con fuoco su `<body>`: scelta aperta 2 di PO-026.
- `e2e-quadri` e `recensione` non lanciati (non chiesti).

## 4. Che cosa non è stato verificato

- Telefono vero, tastiera fisica collegata a un telefono, TalkBack, VoiceOver, iOS: **non posso
  confermarlo**.
- Esito della CI «verifica» sulla 1.21.22 (run 202 e 203 in corso alla lettura): **non posso
  confermarlo**.
- La mensola con la tastiera, e i livelli di altri atti: non provati.
