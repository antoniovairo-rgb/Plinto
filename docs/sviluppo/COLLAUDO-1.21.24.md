# Collaudo 1.21.24

Figlia di collaudo, 22 ottobre 2026. Ramo `collaudo-1.21.24`, partito da `main` a `d2deb21`
(«ROADMAP: 1.21.24 pubblicata»). Nessun file del gioco toccato, niente su `main`: solo questo
rapporto e le schermate in `docs/sviluppo/collaudo-1.21.24/`. Non ho corretto niente.

Classi: **E** errore grave, **D** difetto, **O** osservazione. Per ogni voce le opzioni, la
consigliata per prima.

Ambiente: container, Chromium `/opt/pw-browsers/chromium`, Playwright del progetto dopo
`npm ci`, font del container. Le prove sono contro il sito pubblicato
`https://antoniovairo-rgb.github.io/Plinto/`. Per il solo confronto del tocco con la versione
precedente (§ 3, O1) ho costruito la 1.21.23 da `28c280f` in una cartella temporanea e l'ho
servita con `vite preview` sulla porta 4174; poi fermata per PID (letti da `/proc/<pid>/exe`:
3089, 3106, 3114) e cartella tolta. Su un telefono vero, con una tastiera fisica collegata a
un telefono, con TalkBack o su iOS: **non posso confermarlo**.

## Sintesi

| Voce | Classe | In breve |
|---|---|---|
| O1 | O | **Il tocco è cambiato in un punto**: un pezzo toccato (scelto) prima di scegliere mensola, carriola o piccone, nella 1.21.23 restava scelto dopo l'attrezzo e il tocco seguente su una casella lo posava; nella 1.21.24 non è più scelto e va toccato di nuovo. È l'effetto di `SCELTA_AZZERATA_CON_L_ATTREZZO`, che il changelog annuncia senza dire che vale anche per il tocco |
| O2 | O | Nello **scavo con la tastiera**, Tab su un pezzo del vassoio e Invio lo scelgono: sulla griglia compare l'**anteprima del pezzo** sotto «Quale casella svuoto?». Invio da `<body>` poi **scava** (nessuna mossa spesa) e il pezzo resta scelto |

Nessun errore grave (E), nessun difetto (D). Le novità della 1.21.24 funzionano come
descritto in tutte le misure e nelle due lingue (§ 2, **162 OK su 162**). I cinque script
richiesti sono verdi contro il sito pubblicato (§ 1). La partita col tocco con tutti gli
attrezzi dà gli stessi esiti della 1.21.23, tranne O1 (§ 2, prova P; § 3).

## 0. Che cosa è pubblicato

- `index.html` del sito carica `assets/index-Bh0vTJYj.js`; quel bundle contiene la stringa
  `1.21.24` (4 occorrenze, `curl` + `grep -o '1\.21\.2[0-9]'`). È la versione da collaudare.
- `package.json` di `main` a `d2deb21`: `"version": "1.21.24"`.
- La 1.21.23 costruita da `28c280f` ha prodotto `assets/index-BiMDBRRy.js`, lo stesso nome con
  impronta che il collaudo 1.21.23 aveva letto sul sito di allora: il confronto di O1 è contro
  lo stesso codice che era pubblicato.

## 1. Script del progetto contro il sito pubblicato

`npm ci` riuscito. Poi, con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/` e
`PLINTO_CHROMIUM=/opt/pw-browsers/chromium` (i cinque script leggono `PLINTO_E2E_URL`:
`tests/e2e/ripresa-livello.mjs:79`, `attrezzi.mjs:23`, `annulla.mjs:31`, `partita.mjs:67`,
`indietro.mjs:35`; nessun server locale acceso in quel momento, controllato con
`/proc/<pid>/exe`):

| Script | Uscita | Esito |
|---|---|---|
| `npm run e2e-po008` | 0 | «Tutto a posto.»; «Mosse di unaMossa: 94 tentate, 0 ritentate, 0 non fatte.» Casi W e X verdi (sotto) |
| `npm run e2e-attrezzi` | 0 | «Nessun problema rilevato.» |
| `npm run annulla` | 0 | «Il "rimetti a posto" compare quando deve, ripristina esattamente, e poi sparisce.» |
| `npm run e2e` | 0 | «Nessun problema rilevato.» |
| `npm run indietro` | 0 | «Tutte le verifiche del tasto Indietro sono passate.» |

Righe W e X di `e2e-po008`, copiate dall'uscita:

- W: «La mensola: mosse uguali, gettoni 3 -> 2, fuoco Pezzo 3, 4 caselle; La carriola: mosse
  uguali, gettoni 3 -> 2, fuoco <body>; scambio (mensola e mano piene): mosse uguali, fuoco
  Pezzo 3, 3 caselle; riprendi dalla mensola: fuoco Pezzo 1, 3 caselle; Escape nell'attesa
  (La mensola / La carriola / La mensola, pezzo scelto prima / Il piccone): domanda chiusa».
- X: «piccone, Invio: occupate 8 -> 7, gettoni 3 -> 2, cursore all'ingresso si; piccone,
  Spazio: uguale; piccone col tocco: occupate 8 -> 7, gettoni 3 -> 2, cursore no».

Il fuoco su `<body>` dopo la carriola è il limite noto PO-034: non riportato.

## 2. Prove a mano (Playwright, sito pubblicato)

Script mio, non versionato (scratchpad). Un contesto nuovo per ogni prova, `localStorage`
azzerato; livello 13 con i livelli 1–12 fatti e 3 gettoni (come `livello13()` di
`e2e-po008`). Misure **360x640, 390x844, 1366x768**, lingue **it** ed **en**: 6
combinazioni. Da tastiera tutto con **Tab veri** (contati) partendo da `<body>`, Invio, Spazio,
frecce, Escape; nessun `focus()` dello script sui comandi. La mossa da tastiera si fa portando
il cursore a serpentina finché l'anteprima non è più vietata, poi Invio. Il tocco a 360x640 e
390x844 è con eventi di tocco veri (CDP `Input.dispatchTouchEvent`, `hasTouch`, `isMobile`);
a 1366x768 col mouse.

| Prova | Che cosa | Esito nelle 6 combinazioni |
|---|---|---|
| K1 piccone, Invio e Spazio | 2 Tab alla pastiglia, Invio; 8 Tab a «Il piccone», Invio | «Quale casella svuoto?» / «Which square do I empty?», **cursore al centro (4,4)**, fuoco `<body>` |
| | frecce su una casella libera, Invio (o Spazio) | niente cambia (occupate 8 → 8), la domanda resta |
| | frecce sulla casella occupata più vicina, Invio (o Spazio) | **occupate 8 → 7, gettoni 3 → 2**, punteggio uguale, domanda e cursore via |
| | poi una mossa con la sola tastiera | posata |
| K2 mensola | pezzo 1 scelto (3 Tab, Invio, 4 frecce su: cursore 0,4, 3 caselle di anteprima); 5 Tab alla pastiglia, Invio; 9 Tab a «La mensola», Invio | domanda a schermo, **nessun cursore, 0 caselle di anteprima** |
| | 4 Tab al pezzo 2, Invio | messo da parte (mano 2), **punteggio e caselle occupate uguali**, gettoni 3 → 2, domanda via, **fuoco su «Pezzo 3»** |
| | poi una mossa con la sola tastiera | posata |
| K3 carriola | come K2, 6 Tab a «La carriola» | in attesa nessun cursore né anteprima; Invio sul pezzo 2: **pezzo cambiato, punteggio e caselle occupate uguali**, gettoni 3 → 2; poi una mossa: posata |
| K4 scambio | mensola piena e mano piena (preparate con la tastiera), pezzo 1 scelto, 5 Tab alla mensola, Invio | «La mano è piena: con quale pezzo lo scambio?», nessun cursore né anteprima |
| | 4 Tab al pezzo 3, Invio | **scambiato, punteggio e caselle occupate uguali**, gettoni 2 → 2, fuoco su «Pezzo 3» |
| K5 Escape | nell'attesa di mensola, carriola, piccone, scambio | domanda chiusa, partita e gettoni uguali, menu **non** aperto, nessun cursore; un secondo Escape non apre niente. Dopo lo scambio il fuoco resta su «Riprendi il pezzo dalla mensola» |
| A1 aiuto | home, «Come si gioca» / «How to play» | la frase c'è: «Col piccone le frecce scelgono la casella e Invio la svuota.» / «With the pickaxe, the arrows choose the square and Enter empties it.» (schermate `a1-aiuto-*`) |
| P partita col tocco (col mouse a 1366) | 1 mossa trascinando; gessetto; tocco su un pezzo, poi mensola, tocco su un altro pezzo; tocco sulla mensola (riprende); carriola; nuova partita: piccone su una casella occupata; mensola, due mosse, tocco sulla mensola con la mano piena, tocco su un pezzo (scambio); 3 mosse | tutto riuscito: gessetto 4 caselle segnate e un gettone; mensola mano 1, gettone; ripreso mano 1 → 2; carriola pezzo cambiato, gettone; piccone **senza cursore**, occupate 8 → 7, punteggio uguale; scambio fatto, gettoni uguali; 3 mosse su 3 |

Errori di pagina e di console: **zero** in tutte le corse. Conteggio: **162 OK, 0 NO**.

Limite del mio script: in K e P «partita uguale» confronta punteggio, record e caselle
occupate (`.pl-hud` e l'etichetta delle caselle), **non** il contatore MOSSE della barra
dell'obiettivo. Un pezzo posato cambia le caselle occupate, quindi una mossa spesa per errore si
vedrebbe; il numero MOSSE in sé l'ho letto solo in O1, O2 e lo leggono i casi W e X di
`e2e-po008` (§ 1).

La prova P, ripetuta uguale sulla 1.21.23 costruita da `28c280f`: 6 OK su 6, con **una sola
differenza**: «pezzo scelto dopo la mensola» è `true` nella 1.21.23 e `false` nella 1.21.24
(→ O1).

Nota sul mio script: al primo giro il trascinamento col tocco del pezzo 1 «falliva» perché
portavo il dito dove cade il pezzo col mouse; col tocco il gioco disegna il pezzo 1,35 caselle
sopra il dito (`src/ui/useTrascinamento.js:40`, `SOLLEVAMENTO_TOCCO`). Corretto lo script, non
è un difetto del gioco: con lo stesso trascinamento la 1.21.23 e la 1.21.24 si comportano uguale.

## 3. Voci

### O1 — Col tocco, un pezzo scelto prima di un attrezzo non resta più scelto

**Misura** (390x844 it, livello 13, tocco vero; script a parte, uguale su 1.21.23 e 1.21.24):
tocco sul pezzo 1 (scelto), pastiglia, attrezzo, poi il bersaglio dell'attrezzo (pezzo 2 per
mensola e carriola, una casella occupata per il piccone); poi un tocco su ogni casella libera,
una alla volta, finché qualcosa cambia.

| Attrezzo | 1.21.23: pezzo 1 scelto dopo l'attrezzo | 1.21.23: tocchi sulle libere | 1.21.24: pezzo 1 scelto dopo | 1.21.24: tocchi sulle libere |
|---|---|---|---|---|
| mensola | sì | al **1°** tocco il pezzo 1 è posato: PUNTEGGIO 0 → 3, **MOSSE 18 → 17** | no | 73 su 73, niente posato |
| carriola | sì | al 1° tocco posato, MOSSE 18 → 17 | no | 73 su 73, niente posato |
| piccone | sì (nella 1.21.23 resta evidenziato anche durante l'attesa) | al 1° tocco posato, MOSSE 18 → 17 | no | 74 su 74, niente posato |

Schermate dopo la mensola: `collaudo-1.21.24/o1-tocco-dopo-mensola-1.21.23-390x844-it.png`
(pezzo 1 evidenziato, «Tocca un pezzo, poi tocca dove metterlo») e
`o1-tocco-dopo-mensola-1.21.24-390x844-it.png` (nessun pezzo evidenziato).

**Perché**: `SCELTA_AZZERATA_CON_L_ATTREZZO` chiama `drag.annulla()` alla scelta
dell'attrezzo dal pannello (`src/ui/SchermoGioco.jsx:706`) e all'ingresso nello scambio
(`SchermoGioco.jsx:604`), senza guardare se il pezzo era stato scelto con la tastiera o col
tocco. Il changelog 1.21.24 lo dice («con un pezzo scelto, scegliere la mensola, la carriola o
il piccone [...] lascia il pezzo»), ma non dice che vale anche per il tocco, e la decisione
PO-032 in `docs/DECISIONI.md:132` parla del pezzo «scelto con la tastiera». Che il cambio sia
voluto anche per il tocco: **non posso confermarlo** dai documenti.

Effetto per chi gioca col dito: dopo un attrezzo serve un tocco in più per riprendere il pezzo.
Nella 1.21.23, al contrario, il pezzo tornava scelto dopo l'attrezzo e un tocco sulla griglia
lo posava, spendendo una mossa.

**Opzioni**
1. **(consigliata, mia opinione)** Lasciare così e scriverlo: una riga nel changelog (o nella
   prossima voce) che dica che vale anche col tocco. Motivo: è coerente con la domanda a
   schermo (l'attrezzo chiede un pezzo, la scelta vecchia sparisce), e toglie il caso della
   1.21.23 in cui la scelta nascosta ricompariva e il tocco seguente spendeva una mossa.
2. Azzerare la scelta solo se il pezzo è stato scelto con la tastiera
   (`drag.selezionatoDaTastiera`): il tocco torna come nella 1.21.23. Prova da aggiungere: un
   caso col tocco in `e2e-attrezzi` come la tabella sopra.
3. Chiedere al PO quale dei due comportamenti vuole per il tocco, prima di toccare il codice.

### O2 — Nello scavo con la tastiera si può scegliere un pezzo, e la sua anteprima appare

**Riproduzione** (sito pubblicato, 390x844 it, livello 13):

1. pastiglia (Invio), «Il piccone» (Invio): «Quale casella svuoto?», cursore 4,4, fuoco `<body>`;
2. 3 Tab: fuoco su «Pezzo 1, 3 caselle»; Invio;
3. fuoco tolto, freccia sinistra, Invio.

| Passo | domanda | pezzo scelto | cursore | caselle di anteprima | occupate | MOSSE |
|---|---|---|---|---|---|---|
| 1 | «Quale casella svuoto? Lascia stare» | nessuno | 4,4 | 0 | 8 | 18 |
| 2 (Invio sul pezzo) | resta | **pezzo 1** | 4,4 | **3** | 8 | 18 |
| 3 (freccia) | resta | pezzo 1 | 4,3 | 3 | 8 | 18 |
| 3 (Invio da `<body>`) | via | **pezzo 1, resta** | 4,3 | 3 | **7** | 18 |
| poi Escape | — | nessuno | — | 0 | 7 | 18 |

Schermata del passo 2: `collaudo-1.21.24/scavo-pezzo-scelto-390x844-it.png` (anteprima viola
del pezzo sulla griglia, «Quale casella svuoto?» sotto). Nessun errore di pagina.

Nessuna mossa persa: Invio fa quello che chiede la domanda (scava). Ma per il tempo dello scavo
la griglia mostra dove andrebbe il pezzo, cioè la stessa contraddizione fra domanda e anteprima
che PO-032 ha tolto per mensola, carriola e scambio. Dopo lo scavo il pezzo resta scelto con il
cursore: un altro Invio lo posa (è quello che il giocatore ha chiesto al passo 2, quindi non
lo conto come mossa persa).

**Perché** (lettura del codice): nello scavo il vassoio non è in «scelta pezzo»
(`sceltaPezzo` è vero solo per carriola, mensola, scambio), quindi il clic su un pezzo va a
`drag.selezionaPezzo` (`src/ui/SchermoGioco.jsx:667`); `useTastiera` lascia il tasto al
pulsante (`src/ui/useTastiera.js:127`, «anche i pezzi del vassoio (col tocco si possono
scegliere anche li')»), e l'anteprima nasce da `drag.selezionato` più il cursore
(`SchermoGioco.jsx:391-396`), che nello scavo c'è. Col tocco l'anteprima non compare (nessun
cursore): è un caso della sola tastiera, nato con `SCAVO_CON_LA_TASTIERA`. Che la scelta di un
pezzo durante lo scavo sia voluta (il commento lo fa pensare): **non posso confermarlo**.

**Opzioni**
1. **(consigliata)** Durante lo scavo non disegnare l'anteprima del pezzo (o non accendere il
   cursore del pezzo): la scelta resta possibile come col tocco, ma la griglia mostra solo la
   casella da svuotare. Prova: un caso X in `e2e-po008` con Tab al pezzo e Invio nello scavo,
   fatto fallire prima.
2. Trattare il vassoio nello scavo come nelle altre attese: Invio su un pezzo non lo sceglie
   finché il piccone aspetta. Cambia anche il tocco (oggi un pezzo si può scegliere durante il
   piccone): va deciso insieme a O1.
3. Lasciare così e metterlo fra i limiti noti di PO-034.

## 4. Che cosa non ho provato

- Trascinare un pezzo sulla griglia **durante** l'attesa del piccone (col tocco o col mouse):
  non provato, non posso dire che cosa succede.
- Tastiera fisica su un telefono, TalkBack, iOS, l'app Android: **non posso confermarlo**.
- Limiti noti non riportati, come chiesto: PO-034 (fuoco dopo carriola — misurato `<body>` —,
  dopo «Lascia stare»/Escape e dopo lo scavo — misurato `<body>` —; «riprendi» dalla mensola
  con un pezzo scelto), PO-035 (orizzontale), il Tab che esce dai veli, TalkBack.
