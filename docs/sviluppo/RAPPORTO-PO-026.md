# PO-026 — I tasti della partita sotto il menu e le domande

Decisioni della madre (DECISIONI, 21 ottobre, PO-026) sulle voci D1 e O1 di
`docs/sviluppo/COLLAUDO-1.21.21.md` (ramo `collaudo-1.21.21`). Ramo `po026-tastiera-menu`,
nessun cambio di versione, `android/` non toccato, niente su `main`.

Misure fatte nel container: Chromium di `/opt/pw-browsers`, 390x844, it, font del
container, build di produzione servita da `npx vite preview --port 4173 --strictPort`
(`PLINTO_E2E_URL=http://127.0.0.1:4173/`), poi fermata per PID. Su un telefono vero, con
una tastiera fisica collegata a un telefono, con TalkBack o su iOS: **non posso
confermarlo**.

## 1. Misura prima della correzione (1.21.21, `815adc8`)

Script a parte, non versionato. Partita con due mosse; pezzo scelto col clic nel vassoio,
cursore portato in cima con quattro frecce (al centro c'erano già le mosse e il pezzo
sarebbe stato rifiutato); poi la finestra; poi un tasto. Un contesto nuovo per ogni riga.

| Finestra aperta | Invio | Spazio | Escape | Freccia destra |
|---|---|---|---|---|
| nessuna (controllo) | pezzo posato (4 → 8 punti) | pezzo posato | pezzo lasciato | — |
| menu della libera | **pezzo posato** sotto il velo (4 → 10), menu resta aperto | **pezzo posato** (2 → 4) | pezzo lasciato **e** menu chiuso | anteprima mossa sotto il velo |
| domanda «Nuova partita» sopra il menu | **pezzo posato** (3 → 6), domanda e menu restano aperti | pezzo lasciato (lì non entrava: rifiutato) | pezzo lasciato **e** domanda chiusa | anteprima mossa |
| domanda di «Riprova» del livello (menu già chiuso) | **pezzo posato** (3 → 7), domanda resta aperta | **pezzo posato** (3 → 7) | pezzo lasciato **e** domanda chiusa | anteprima mossa |

Risposta alla domanda della madre: **sì, il difetto c'è anche con una domanda aperta
sopra la partita** («Riprova»), e con la domanda sopra il menu.

Una nota sul solo Escape col menu: in due giri della misura su tre e in 12+12 giri di una
seconda misura il pezzo veniva lasciato; nel caso R con l'interruttore spento invece è
rimasto scelto (1 volta su 1). Ipotesi dal codice, **non provata**: `useTastiera` toglie e
rimette il suo ascoltatore a ogni disegno di `SchermoGioco` (`onPosiziona` è una funzione
nuova a ogni disegno, `src/ui/SchermoGioco.jsx`), quindi l'ordine fra il suo ascoltatore e
quello del menu su `window` dipende da quando è avvenuto l'ultimo disegno; se il menu
ascolta per primo, React ridisegna fra i due ascoltatori e quello della partita viene
tolto prima di ricevere il tasto. Invio e Spazio invece hanno posato in tutti i giri.

## 2. D1 — `TASTI_TACCIONO_SOTTO_IL_VELO` (`src/ui/SchermoGioco.jsx`)

`App.jsx` passa a `SchermoGioco` la proprietà nuova `coperto = menuAperto || !!conferma`
(nei due punti in cui disegna la partita: livello e libera/sfida). Con l'interruttore
acceso e `coperto` vero:

- `useTastiera` riceve `attivo` falso: niente ascoltatore, quindi niente
  `preventDefault()`. Invio e Spazio arrivano al pulsante che ha il fuoco; Escape lo
  ascoltano solo il menu (`MenuPartita.jsx`) e la domanda (`ConfermaDoppia.jsx`).
- anche il tasto P (porta il fuoco sull'anteprima dei prossimi tre pezzi, solo in modalità
  anteprima) tace: altrimenti il fuoco uscirebbe dalla finestra aperta. È un tasto della
  partita, ma il collaudo non l'aveva misurato: l'ho incluso per coerenza con la decisione
  («i tasti della partita tacciono»); vedi scelta aperta 3.

Il pezzo scelto resta scelto: chiusa la finestra, la partita riprende da dove era (un
secondo Escape lo lascia, Invio lo posa). Non cambia niente a schermo né a menu chiuso.

## 3. O1 — `RIPRENDI_TORNA_A_MENU` (`src/ui/App.jsx`)

In `iniziaNuova`, quando la domanda è aperta dal menu della libera stessa (`giaDentro`),
«Riprendi la partita» porta il fuoco su `.pl-hud__menu` (lo stesso ripiego di «Riprova»,
`App.jsx`, `ripiego` di `riprovaLivello`). Il pulsante «Menu» resta a schermo sotto il velo,
quindi il fuoco si dà subito nel gestore del clic; le pulizie di `ConfermaPerdita` e di
`MenuPartita` non lo spostano perché per tutte e due è stata una scelta (`scelto`).

**Trovato dal caso nuovo**: «Torna alla partita» nella domanda di «Riprova» del livello
aveva lo stesso difetto (fuoco su `<body>`: 2 giri su 2, il primo giro del caso R prima di
estendere la correzione e il giro con l'interruttore spento). Si
resta nello stesso livello com'era, come per «Riprendi la partita»: l'ho messo sotto lo
stesso interruttore (scelta aperta 1).

**Non toccato**: da una sfida, menu → «Nuova partita» con la libera a metà → «Riprendi la
partita» porta nella libera (un'altra partita) e il fuoco va su `<body>` (3 su 3, misura a
parte sulla build di produzione corretta). La decisione dice «quando lascia la stessa
schermata»: qui cambia partita, quindi resta com'era (scelta aperta 2).

## 4. Caso R di `npm run e2e-po008` (`tests/e2e/ripresa-livello.mjs`)

Pezzo scelto col clic, cursore in cima, poi la finestra e un tasto. Per ogni tasto
controlla: il pezzo è ancora scelto (il segno che il tasto non è arrivato alla partita:
Invio lascia il pezzo anche quando lo rifiuta), la firma della partita non è cambiata,
quali finestre restano aperte, dove va il fuoco.

| Sotto-caso | Atteso |
|---|---|
| menu, Invio / Spazio («Torna alla partita») | menu chiuso, fuoco «Menu», pezzo scelto |
| menu, Escape | menu chiuso, fuoco «Menu», pezzo scelto; poi un secondo Escape lascia il pezzo |
| domanda sopra il menu, Escape | domanda chiusa, menu aperto, fuoco «Nuova partita» del menu, pezzo scelto |
| domanda sopra il menu, Invio / Spazio («Riprendi la partita», O1) | tutte e due chiuse, fuoco «Menu», pezzo scelto, partita uguale |
| «Riprova» del livello, Invio («Torna alla partita») / Escape | domanda chiusa, fuoco «Menu», pezzo scelto |
| tastiera a menu chiuso | fuoco sul primo pezzo, Invio lo sceglie, frecce, Invio lo posa al centro (griglia vuota: entra sempre); Escape lascia il pezzo scelto |

**Prova rosso/verde** (build di produzione, `e2e-po008` intero ogni volta, interruttori
spenti e rimessi con la stessa `sed`, mai `git checkout`):

| Stato | Esito | Problemi |
|---|---|---|
| tutto acceso | **verde** («Tutto a posto», casi A–R) | 0 |
| `TASTI_TACCIONO_SOTTO_IL_VELO = false` | **rosso** | 24, tutti del caso R: Invio e Spazio posano sotto il velo (es. «PUNTEGGIO 4 → 7» col menu, «MOSSE 13 → 12» con «Riprova»), Escape sulla domanda lascia anche il pezzo; nessun altro caso rosso |
| `RIPRENDI_TORNA_A_MENU = false` | **rosso** | 3, tutti del caso R: fuoco su `<body>` dopo «Riprendi la partita» (Invio, Spazio) e dopo «Torna alla partita» di «Riprova» |

Con D1 spento il sotto-caso «menu, Escape» non è risultato rosso in quel giro (vedi § 1,
nota): il caso resta rosso comunque per Invio e Spazio, che hanno posato in tutti i giri.

## 5. Controlli finali

- `npm run build`: riuscita.
- `npm test`: 45 file, 650 test, verdi.
- `npm run verifica -- --veloce`: la corsia veloce è stata **negata** dal gate («non
  risulta nessun giro completo passato su questa macchina»), quindi è stato un giro
  completo: **31/33 in 5512 s**. I due rossi sono quelli noti dei container figli
  (`docs/TESTING.md:312-313`, font): «livelli nel browser» (`e2e-quadri`, fine del
  livello vinta a 320x700 da scorrere **2 px**) e «Play Store» (`recensione`, a 360x640
  l'invito finisce **10 px** sotto la barra). Tutti gli altri verdi, compresi PO-008 (con
  il caso R, sul server di sviluppo), `correzioni`, Indietro di Android e i cento livelli.
  Un primo giro era stato fermato dal limite di 60 minuti dei comandi in background al
  livello 75, con lo stesso rosso `recensione` fino a lì.
- Build di produzione: vedi § 4 (caso R e tutti gli altri casi di `e2e-po008` verdi).

## 6. Testo proposto per il changelog

```
- **Con il menu o una domanda aperti, la tastiera non muove più la partita sotto**
  (PO-026, collaudo 1.21.21 D1): con un pezzo scelto, Invio e Spazio posavano il pezzo
  sotto il velo invece di premere il pulsante, ed Escape lasciava il pezzo e chiudeva
  anche il menu con un tasto solo. Succedeva anche con le domande sopra la partita
  («Riprova»). Ora, finché la finestra è aperta, Invio e Spazio premono il pulsante e
  Escape chiude solo la finestra; il pezzo resta scelto. A menu chiuso la tastiera
  funziona come prima. Interruttore `TASTI_TACCIONO_SOTTO_IL_VELO`.
- **«Riprendi la partita» riporta il fuoco su «Menu»** (PO-026, collaudo 1.21.21 O1):
  dalla domanda aperta con «Nuova partita» nel menu della libera, e da «Torna alla
  partita» nella domanda di «Riprova», il fuoco finiva fuori dalla pagina e il Tab
  ripartiva dall'inizio. Ora torna su «Menu», come «Torna alla partita» del menu.
  Interruttore `RIPRENDI_TORNA_A_MENU`. Controllo: caso R di `npm run e2e-po008`.
```

L'aiuto (`aiuto.tastiera`, `src/i18n/it.js`) resta vero così com'è: non parla del menu.

## 7. Scelte aperte

1. **«Torna alla partita» nella domanda di «Riprova»** (stesso difetto di O1, trovato dal
   caso R).
   - A **(consigliata, fatta)**: stesso interruttore di O1, fuoco su «Menu». Si resta
     nello stesso livello, è la stessa situazione che la decisione descrive.
   - B: interruttore separato.
   - C: lasciare com'era e scriverlo.
2. **Da una sfida, «Riprendi la partita» della libera** (fuoco su `<body>`, 3 su 3).
   - A **(consigliata, fatta: niente)**: lasciare com'è; si cambia partita, come dopo
     «Nuova partita» («dopo una scelta il fuoco non si sposta», PO-024 scelta 2).
   - B: fuoco su «Menu» anche lì (il pulsante esiste anche nella libera).
3. **Il tasto P sotto il velo**.
   - A **(consigliata, fatta)**: tace con gli altri tasti della partita.
   - B: lasciarlo com'era (porta il fuoco sull'anteprima dietro il velo).
4. **Solo tastiera, pezzo scelto, Tab su «Menu» e Invio**: il menu non si apre, Invio posa
   il pezzo (collaudo 1.21.21, D1, ultima riga della misura). È fuori dalla decisione (lì
   il menu non è ancora aperto) e la correzione non lo cambia: rimisurato sulla build di
   produzione corretta, 3 su 3 il menu non si apre, il pezzo viene posato (0 → 3 o 4
   punti). Opzioni:
   - A **(consigliata)**: voce a parte; Invio e Spazio posano solo se il fuoco non è su un
     pulsante fuori dal vassoio, con un caso in `e2e-po008`.
   - B: lasciare com'è (con un pezzo in mano Invio vuol dire «posa»), scriverlo nei
     limiti noti.
5. Fuori da questa voce e non toccati: O2 (il Tab esce dal menu) e TalkBack.
