# PO-023 — Accessibilità: fuoco dopo la conferma, bersaglio di «Nuova», nome della sfida

Decisioni della madre (DECISIONI, 20 ottobre) sulle voci D1, O1 e O2 di
`docs/sviluppo/COLLAUDO-1.21.18.md` (ramo `collaudo-1.21.18`). Ramo `po023-accessibilita`,
nessun cambio di versione, `android/` non toccato, niente su `main`.

Misure fatte nel container: Chromium 1194 di `/opt/pw-browsers`, font del container,
`vite` di sviluppo. Su un telefono vero, con TalkBack o con un altro font: **non posso
confermarlo**.

## 1. D1 — chiusa la domanda senza scegliere, il fuoco torna a chi l'ha aperta

**Che cosa cambia** (`src/ui/ConfermaDoppia.jsx`, `ConfermaPerdita`): al primo disegno la
domanda si ricorda `document.activeElement`, cioè il pulsante che l'ha aperta, prima di
dare il fuoco al pulsante sicuro. Quando la domanda si chiude **senza una scelta** il fuoco
torna lì. Vale per tutte le domande di `ConfermaPerdita` (libera a metà, altro livello,
Riprova, altra sfida), perché il codice sta nel componente e non nei chiamanti.

- La restituzione è nella pulizia dell'effetto (alla chiusura), non nel solo `onAnnulla`:
  così vale per Escape, per il tocco sul velo **e anche per il tasto Indietro di Android**,
  che chiude la domanda da `App.jsx` (`passoIndietro`) senza passare da `onAnnulla`.
  Indietro non era nella decisione, ma è lo stesso caso («chiusa senza scelta»); il tasto
  Indietro vero della TWA non l'ho provato: **non posso confermarlo**.
- Dopo una scelta («Riprendi…», «Nuova partita»…) il fuoco **non** viene spostato: si
  cambia schermata o si chiude il menu, come prima.
- Su iOS un tocco non dà il fuoco al pulsante: allora l'elemento ricordato è `<body>` e
  non si fa niente (comportamento di prima). Non provato su iOS.
- **Caso particolare, «Riprova» nel menu del livello**: lo stesso tocco chiude il menu
  (`riprovaLivello` in `src/ui/App.jsx`, `setMenuAperto(false)`), quindi alla chiusura
  della domanda «Riprova» non esiste più. Lì il fuoco va al pulsante «Menu» dell'intestazione
  (`ripiego` nella domanda, `.pl-hud__menu`). Vedi scelta aperta 1.
- Interruttore: `FUOCO_TORNA_A_CHI_APRE` in `src/ui/ConfermaDoppia.jsx`.

**Prova** — caso **P** nuovo in `npm run e2e-po008` (`tests/e2e/ripresa-livello.mjs`):

| Domanda | Aperta da | Chiusa con | Acceso: fuoco su | Spento: fuoco su |
|---|---|---|---|---|
| libera a metà | «Nuova» della home, con la tastiera (Invio) | Escape | «Nuova partita libera» | `<body>` |
| libera a metà | «Nuova» della home, con la tastiera | tocco sul velo (4,4) | «Nuova partita libera» | `<body>` |
| — | Tab subito dopo | — | «Partita libera, riprendi la partita in corso» | «Livello 1» |
| Riprova | «Riprova» nel menu del livello (clic) | Escape | «Menu» | `<body>` |
| altro livello | «Gioca» sull'obiettivo del livello 1, livello 2 a metà | tocco sul velo | «Gioca» | `<body>` |

- Acceso: **verde**, «Tutto a posto.», uscita 0 (tutti i casi A–P).
- Spento: **rosso**, uscita 1, **5 problemi**, tutti del caso P (gli altri casi verdi).
- Il caso controlla anche che nell'angolo (4,4) ci sia davvero il velo e che la domanda si
  sia chiusa, altrimenti fallisce per «non prova niente».

## 2. O1 — il bersaglio di «Nuova» arriva al bordo basso della card

**Che cosa cambia** (`src/styles/app.css`, classe `.pl-sfida-avvio--nuova-al-bordo` messa
da `Home.jsx`): il `::before` di «Nuova» scende ben oltre la pillola (`bottom: -200px`) e
la card lo taglia al suo bordo con `overflow: clip`, che taglia anche il tocco e non solo
il disegno. Così la colonna sotto «Nuova» arriva al bordo basso **qualunque sia l'altezza
della card** (52 o 68), senza numeri scritti a mano per un formato.

Il taglio avrebbe nascosto l'anello del fuoco di «Riprendi ›», che stava sul `::after`
2 px fuori dalla card. L'anello passa alla card stessa (`:has(... :focus-visible)`), che
non taglia il proprio contorno: stesso rettangolo (la card non ha bordo e `::after` era
`inset: 0`), stesso raggio, stessi 2 px di distacco. Il tocco sul resto della card resta
«Riprendi»: lo dice il controllo «tocco sul nome della card» di `home-spiegazione`, verde.

Interruttore: `NUOVA_FINO_AL_BORDO` in `src/ui/schermate/Home.jsx`.

**Controllo nuovo in `npm run home-spiegazione`**: tre verticali sotto «Nuova» (2 px dal
bordo sinistro della pillola, centro, 2 px dal bordo destro), dal centro della pillola fino
all'ultimo pixel della card, `elementFromPoint` un pixel alla volta: tutti i punti devono
andare a «Nuova». Poi 8 pixel subito sotto la card: nessuno deve andare a «Nuova» (il
bersaglio non deve uscire). Gira in tutti gli 8 formati, it ed en, stati `libera` e `tutte`
(i tre formati della decisione, 320x700, 360x640 e 390x844, sono compresi).

Punti della colonna che vanno a «Nuova» (stato `libera`; `tutte` identico):

| Formato | Card libera | Acceso it | Spento it | Acceso en | Spento en | Bersaglio verticale acceso / spento |
|---|---|---|---|---|---|---|
| 320x700 | it 68, en 52 | **126/126** | 90/126 | 102/102 | 90/102 | it 58 / 46, en 50 / 46 |
| 360x640 | 52 | **102/102** | 90/102 | 102/102 | 90/102 | 50 / 46 |
| 390x844 | 52 | **102/102** | 90/102 | 102/102 | 90/102 | 50 / 46 |
| 360x800, 375x667, 1366x768 | 52 | 105/105 | 90/105 | 105/105 | 90/105 | 51 / 46 |
| 412x915, 1280x800 | 52 | 102/102 | 90/102 | 102/102 | 90/102 | 50 / 46 |

Spento, i punti che non vanno a «Nuova» vanno tutti a «Riprendi ›»: a it 320x700 sono
12 px per verticale (la metà bassa della riga di spiegazione, come nel collaudo); negli
altri formati gli ultimi 4–5 px della card. Acceso: 0, e 0 punti sotto la card.

- Acceso: **verde**, uscita 0.
- Spento: **rosso**, uscita 1, **32 errori**, tutti «sotto «Nuova» … non vanno a «Nuova»
  (PO-023, O1)» (16 formati×lingue × 2 stati).

## 3. O2 — «gioca» nel nome accessibile della sfida da fare

**Che cosa cambia**: con la sfida di oggi da fare (pillola «Gioca ›») `nomeSfida` in
`Home.jsx` diventa «Sfida del giorno, gioca la sfida di oggi», nella stessa forma degli
altri due stati («…, riprendi la sfida in corso», «…, Record N»). Chiave nuova
`home.giocaSfida`: it «gioca la sfida di oggi», en «play today's challenge» (quindi
«Daily challenge, play today's challenge», minuscola dopo la virgola come
`home.riprendiSfida` «resume the challenge in progress»). Il testo visibile non cambia.
I selettori dei test che cercano `/^Sfida del giorno/` restano validi; `npm test`
(parità delle chiavi e lessico compresi) è verde: 45 file, 650 test.

Interruttore: `NOME_SFIDA_CON_GIOCA` in `src/ui/schermate/Home.jsx`.

**Controllo nuovo in `home-spiegazione`**: negli stati con la sfida da fare il nome
accessibile deve essere esattamente quello sopra.

- Acceso: **verde**.
- Spento: **rosso**, uscita 1, **48 errori**, tutti «il nome accessibile della sfida è
  «Sfida del giorno» invece di «Sfida del giorno, gioca la sfida di oggi»» (8 formati × 2
  lingue × 3 stati con la sfida da fare: `nuova`, `libera`, `livello`).

Comando vocale vero non provato: che «tocca Gioca» ora trovi la card **non posso
confermarlo**; posso solo dire che il nome contiene la parola.

## 4. Niente altro cambia a schermo, la home non scorre

- `home-spiegazione`, acceso: in tutti i formati, stati e lingue la home non scorre
  (colonna «scorre» 0) e lo spazio avanzato è **identico** a quello con gli interruttori
  spenti (es. it 320x700 `libera` 6 px, en 22, 360x640 32, 390x844 155).
- Schermate a confronto, acceso contro spento (`NUOVA_FINO_AL_BORDO` e
  `NOME_SFIDA_CON_GIOCA` insieme), it ed en a 320x700, 360x640, 390x844, libera in corso:
  home ferma, fuoco su «Nuova», fuoco su «Riprendi ›». Due corse accese sono identiche
  byte per byte (la prova è ripetibile). Fra acceso e spento i pixel diversi sono 16–21
  nella home (angoli arrotondati della pillola «Nuova») e fino a ~3700 con il fuoco, ma la
  differenza massima è **7 su 255** per canale e nessun pixel supera 8: sfumature
  dell'antialiasing dovute al taglio, non un cambio che si vede. L'anello del fuoco su
  «Riprendi ›» è nello stesso posto (guardato a occhio sulle schermate ingrandite).
  Lo script delle schermate era temporaneo, in `store/prove/` (non versionato).

## 5. Gate

- `npm run build`: riuscita (`dist/assets/index-BYTOEY_9.js` 368.71 kB, `index-C4005dNo.css`
  66.95 kB).
- `npm run verifica -- --veloce`: vedi l'ultima riga riportata sotto.

(in corso al momento di questo commit: l'ultima riga arriva nel commit successivo)

## Scelte aperte (per il PO)

1. **«Riprova» nel menu del livello**: il pulsante che ha aperto la domanda sparisce con
   il menu.
   - **A (consigliata, fatta)**: il fuoco va al pulsante «Menu», che riapre il menu dove
     stava «Riprova».
   - B: alla chiusura senza scelta il menu si riapre con il fuoco su «Riprova»: più
     preciso, ma è un cambio visibile (la decisione 4 lo esclude).
   - C: lasciare `<body>` in questo solo caso.
2. **Indietro di Android**: la restituzione del fuoco vale anche lì.
   - **A (consigliata, fatta)**: tenerla, è lo stesso caso di Escape.
   - B: solo Escape e velo, come scritto nella decisione (serve un controllo in più nel
     componente).
3. **Il menu del gioco** (`.pl-menu`): in `src/` non c'è nessun `focus()` alla sua
   chiusura (cercato con `grep`), quindi probabilmente ha lo stesso difetto di D1. **Non
   l'ho misurato: non posso confermarlo.**
   - **A (consigliata)**: una voce nuova dopo il collaudo, con un caso in `e2e-po008`.
   - B: lasciare così.
4. **Changelog**: la versione non cambia, quindi niente voce. Testo proposto per la
   prossima: «Accessibilità: chiusa una domanda senza scegliere, il fuoco torna al
   pulsante che l'ha aperta; tutta la colonna sotto "Nuova" apre "Nuova"; la card della
   sfida da fare si chiama "Sfida del giorno, gioca la sfida di oggi" (PO-023).»
5. **O3** del collaudo (la riga della libera letta due volte da un lettore di schermo) non
   era in questa voce: non toccata.
