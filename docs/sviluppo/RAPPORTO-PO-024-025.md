# PO-024 e PO-025 — Menu della partita come le domande, angoli della card libera

Decisioni della madre (DECISIONI, 21 ottobre) sulle voci O1 e O2 di
`docs/sviluppo/COLLAUDO-1.21.20.md` (ramo `collaudo-1.21.20`). Ramo `po024-po025`, nessun
cambio di versione, `android/` non toccato, niente su `main`.

Misure fatte nel container: Chromium di `/opt/pw-browsers` (`chromium-1194`), font del
container, `vite` di sviluppo avviato dagli script. Su un telefono vero, con TalkBack o
con un altro font: **non posso confermarlo**.

## 1. PO-025 (O1) — il bersaglio di «Riprendi ›» prende il raggio della card

**Causa** (confermata dal codice): `.pl-sfida-avvio__riprendi::after` ha
`border-radius: inherit` (`src/styles/app.css`, blocco PO-020) e lo eredita dalla pillola,
999px; la card ha `var(--pl-radius-md)` = 14px (`src/styles/tokens.css:88`, tramite
`.pl-btn`). Agli angoli restava la card, un `<div>` senza gestore.

**Che cosa cambia**: con la classe `pl-sfida-avvio--riprendi-angoli` (messa da `Home.jsx`)
il `::after` di «Riprendi ›» ha `border-radius: var(--pl-radius-md)`, lo stesso raggio
della card e dell'anello del fuoco. Il `::after` non ha fondo né bordo: a schermo non
cambia niente. Il bersaglio di «Nuova» (`NUOVA_FINO_AL_BORDO`, PO-023 O1) non è toccato:
la colonna sotto «Nuova» resta 126/126, 102/102 o 105/105 come prima.

Interruttore: `RIPRENDI_ANGOLI_DELLA_CARD` in `src/ui/schermate/Home.jsx`.

**Controllo nuovo in `npm run home-spiegazione`** (punto 8 dell'intestazione): con la
libera in corso, `elementFromPoint` al centro di **ogni pixel** del rettangolo della card;
un punto è della card se cade dentro di essa (fuori dalla curva dell'angolo il browser
restituisce già l'elemento sotto, e quello non conta). Ogni punto della card deve andare a
«Nuova» o a «Riprendi ›». Colonna nuova `morti` nella tabella. Gira negli 8 formati, it ed
en, stati `libera` e `tutte`.

| Formato | Pixel della card it / en | Morti prima (= spento) it / en | Acceso it / en |
|---|---|---|---|
| 320x700 | 18 367 / 14 015 | **744** / 364 | **0** / 0 |
| 360x640 | 16 388 | 386 / 386 | 0 / 0 |
| 360x800 | 16 095 | 364 / 364 | 0 / 0 |
| 375x667 | 16 875 | 364 / 364 | 0 / 0 |
| 390x844 | 17 978 | 386 / 386 | 0 / 0 |
| 412x915 | 19 144 | 386 / 386 | 0 / 0 |
| 1280x800 | 19 992 | 386 / 386 | 0 / 0 |
| 1366x768 | 19 631 | 364 / 364 | 0 / 0 |

(`libera` e `tutte` identici.) Il collaudo aveva misurato 748 e 364–368: la differenza di
pochi pixel viene dal campionamento (qui il centro di ogni pixel), non da un cambio del
gioco.

- Acceso: **verde**, uscita 0. La home non scorre in nessun formato, stato e lingua
  (colonna «scorre» 0), spazio avanzato uguale a prima (es. it 320x700 `libera` 6 px,
  360x640 32, 390x844 155).
- Spento: **rosso**, uscita 1, **32 problemi**, tutti «N pixel della card su M non vanno
  né a «Nuova» né a «Riprendi ›» (PO-025)» (16 formati×lingue × 2 stati). Nessun altro
  errore.
- Interruttore rimesso con la stessa `sed` che l'ha spento.

## 2. PO-024 (O2) — il menu della partita come le domande

**Misura prima** (caso Q nuovo, sul codice della 1.21.20; coincide con il collaudo):

| Chiusura | Si chiude? | Fuoco dopo |
|---|---|---|
| Escape | **no** | «Menu» (mai spostato) |
| tocco sul velo | sì | `<body>` |
| «Torna alla partita» | sì | `<body>` |
| Indietro | sì | «Menu» |

All'apertura il fuoco restava su «Menu», dietro il velo; il menu non aveva `role`.

**Che cosa cambia**: i due menu di `src/ui/App.jsx` (livello; libera e sfida) passano da un
componente solo, `MenuPartita` (`src/ui/MenuPartita.jsx`, nuovo). Stesso markup e stesse
classi di prima (`.pl-velo` > `.pl-menu`, «Torna alla partita» primo pulsante), quindi a
schermo non cambia niente. Acceso:

- **Escape** chiude il menu (come `ConfermaPerdita`).
- All'apertura il fuoco va sul **primo pulsante**, «Torna alla partita» (il pulsante che
  non perde niente, come nelle domande).
- Chiuso **senza scelta** (Escape, velo, «Torna alla partita», Indietro) il fuoco torna al
  pulsante che l'ha aperto, «Menu». La restituzione sta nella pulizia dell'effetto, come in
  `ConfermaPerdita`, quindi vale anche per Indietro, che chiude il menu da `App.jsx`
  (`passoIndietro`). Se il pulsante d'origine è `<body>` (su iOS un tocco non dà il fuoco)
  si ripiega su `.pl-hud__menu`. Non provato su iOS: **non posso confermarlo**.
- **Dopo una scelta** (gli altri pulsanti) il fuoco non viene spostato, come prima.
- **Una domanda sopra il menu**: con la libera a metà, «Nuova partita» del menu apre la
  domanda e il menu resta aperto sotto (codice di prima, `iniziaNuova`). Lì Escape è della
  domanda: il menu ignora Escape finché c'è una domanda (`coperto`). Senza questa guardia
  un Escape chiudeva tutte e due (misurato, vedi sotto). Chiusa la domanda senza scelta, il
  fuoco torna a «Nuova partita» (lo fa `ConfermaPerdita`) e la scelta non conta più: un
  Escape dopo chiude il menu e il fuoco torna a «Menu».
- **`role="dialog"`, `aria-modal="true"`, `aria-label="Menu"`** (en «Menu», `hud.menu`):
  vedi scelta aperta 1. Con TalkBack non l'ho ascoltato: **non posso confermarlo**.
- Nessuna trappola del Tab dentro il menu: non c'è nemmeno nelle domande.

Interruttore: `MENU_COME_LE_DOMANDE` in `src/ui/MenuPartita.jsx`. Spento, il menu è
esattamente quello di prima (niente `role`, niente Escape, niente fuoco).

**Selettori di `e2e-po008` toccati**: il menu ora è anch'esso `[role="dialog"]` e nel DOM
sta prima della domanda; `domanda()`, `finestra()` del caso N e il clic del caso O
cercano ora `.pl-azzera[role="dialog"]` (la classe delle domande). Senza, il caso N
«menu della partita» avrebbe letto il menu al posto della domanda. Gli altri e2e che
cercano `[role=dialog]` (`indietro.mjs` G1, `precisione.mjs` solo nella diagnostica) lo
fanno con il menu chiuso; il gate li fa girare (§3).

**Caso Q nuovo in `npm run e2e-po008`** (`tests/e2e/ripresa-livello.mjs`), menu aperto
sempre con la tastiera (fuoco su «Menu», Invio), 390x844 it:

| Partita | Chiusura | Acceso: fuoco dopo | Spento: fuoco dopo |
|---|---|---|---|
| libera a metà | Escape | «Menu» | menu non si chiude |
| libera a metà | velo (4,4) | «Menu» | `<body>` |
| libera a metà | «Torna alla partita» | «Menu» | `<body>` |
| libera a metà | Indietro | «Menu» | «Menu» |
| libera a metà | «Nuova partita» → domanda, Escape, poi Escape | domanda chiusa, menu aperto; poi «Menu» | il secondo Escape non chiude il menu |
| libera a metà | scelta «Torna alla home» | home, `<body>` (come prima) | home, `<body>` |
| livello 1 | Escape | «Menu» | menu non si chiude |

A ogni apertura il caso controlla anche che il fuoco sia su «Torna alla partita» dentro il
menu e che il menu sia `dialog`/`aria-modal`/«Menu»; a ogni chiusura che il menu sia chiuso
e si sia ancora nella partita; per il velo, che nell'angolo ci sia davvero il velo.

- Acceso: **verde**, «Tutto a posto.», uscita 0 (casi A–Q).
- Spento: **rosso**, uscita 1, **19 problemi**, tutti del caso Q, **identici** a quelli
  della misura sul codice di prima. Gli altri casi verdi.
- Prova in più: tolta solo la guardia `coperto` (Escape del menu anche con la domanda
  sopra), **rosso**, 1 problema: «Q libera: un Escape sulla domanda ha chiuso anche il
  menu». Guardia rimessa con la stessa `sed`.
- Interruttore rimesso con la stessa `sed` che l'ha spento.

## 3. Gate

- `npm run build`: riuscita (`dist/assets/index-DylN7FLi.js` 369.49 kB,
  `index-CdWLMupY.css` 67.14 kB).
- `npm test`: 45 file, 650 test, verdi.
- `npm run verifica -- --veloce`: **corsia veloce negata** («non risulta nessun giro
  completo passato su questa macchina»), quindi giro completo, cento livelli compresi
  (3477 s). Ultima riga:

  > `2 controlli su 33 sono falliti. NON pubblicare.`

  I due rossi sono quelli noti dei container figli (`docs/TESTING.md`, «Due rossi noti»),
  **con gli stessi numeri**: `e2e-quadri` («livelli nel browser») «FINE LIVELLO
  (vittoria): a 320x700 bisogna scorrere di 2 px» e `recensione` («Play Store: invito a
  recensire») «a 360x640 l invito finisce 10px sotto la barra dei pulsanti». Nessuno dei
  due tocca la home o il menu. Gli altri 31 verdi, compresi `e2e-po008` (121 s),
  `home-spiegazione` (167 s), «la home entra nello schermo», «tasto Indietro di Android»,
  sicurezza e `comunicazioni`. Che quei due siano verdi sulla CI **non posso
  confermarlo**: questo ramo non è su `main` e la CI non è girata.
- **Build di produzione** (`npm run build` + `vite preview` su 127.0.0.1:4173, con la CSP
  nel `<meta>`; `PLINTO_E2E_URL`): `home-spiegazione` verde, 0 pixel morti in tutti i 32
  casi, la home non scorre; `e2e-po008` verde («Tutto a posto.»), caso Q con gli stessi
  esiti della tabella. Le prove spento sono state fatte sul server di sviluppo. Server
  fermato per gruppo di processi (PID letto dal file), nessun `vite` rimasto acceso.

## Testo proposto per il changelog

> - **La card della partita libera risponde anche negli angoli** (PO-025, collaudo
>   1.21.20 O1). Con una partita libera in corso, un tocco negli angoli della card non
>   faceva niente: il bersaglio di «Riprendi ›» era arrotondato come la pillola (999px) e
>   non come la card (14px). Ora ogni punto della card va a «Nuova» o a «Riprendi ›».
>   Misurato da `npm run home-spiegazione`: pixel morti da 364–744 a 0 in 8 formati, it
>   ed en; a schermo non cambia niente.
> - **Il menu della partita si usa come le domande** (PO-024, collaudo 1.21.20 O2).
>   Escape lo chiude; all'apertura il fuoco entra su «Torna alla partita»; chiuso senza
>   scegliere (Escape, tocco fuori, «Torna alla partita», Indietro) il fuoco torna al
>   pulsante «Menu» invece di perdersi. Per i lettori di schermo il menu è una finestra
>   («Menu»). Con una domanda aperta sopra il menu, Escape chiude solo la domanda.
>   Controllo: caso Q di `npm run e2e-po008`.

## Scelte aperte

1. **`role="dialog"` e `aria-modal` sul menu** (la decisione chiedeva di valutarli).
   - A **(consigliata, fatta)**: sì, con nome «Menu», come le domande e il pannello degli
     attrezzi (`Attrezzi.jsx`, già `role="dialog" aria-modal`). Il velo copre tutto il
     resto: per chi legge lo schermo il resto non è raggiungibile, ed è vero.
   - B: niente ruolo, solo Escape e fuoco. Nessun cambio per i lettori di schermo.
   - Rischio di A, non misurato: con la libera a metà, «Nuova partita» apre la domanda
     sopra il menu e ci sono due finestre `aria-modal` insieme. Che TalkBack legga solo
     la domanda (l'ultima nel DOM) **non posso confermarlo**: va ascoltato insieme a O3
     di PO-023.
2. **Fuoco dopo una scelta che resta sulla stessa schermata** («Riprova» senza mosse,
   «Nuova partita» senza libera a metà): la partita riparte, il menu si chiude e il fuoco
   va su `<body>`, come prima.
   - A **(consigliata, fatta)**: come prima, come deciso per le domande («dopo una scelta
     il fuoco non viene spostato»).
   - B: anche lì il fuoco torna a «Menu».
3. **L'aiuto** (`aiuto.tastiera`) dice già «Esc per annullare» in generale; non nomina né
   le domande né il menu.
   - A **(consigliata, fatta)**: non si cambia, Escape che chiude un menu è ciò che
     «annullare» promette; `tests/aiuto-aggiornato.test.js` è verde.
   - B: aggiungere «Esc chiude anche il menu e le domande».
4. Il testo del changelog qui sopra.
