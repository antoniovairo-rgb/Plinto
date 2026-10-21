# PO-027, PO-028, PO-029 — La tastiera fuori dal vassoio, il pannello degli attrezzi, il cambio di partita

Decisioni della madre (DECISIONI, 21 ottobre: PO-027 dal rapporto PO-026 scelta 4; PO-028 e
PO-029 dal collaudo 1.21.22, D1, O3 e O1). Ramo `po027-029-tastiera`, partito da `main` a
`0c324e8`. Nessun cambio di versione, `android/` non toccato, niente su `main`.

Misure fatte nel container: Chromium `/opt/pw-browsers/chromium-1194`, 390x844, it, font del
container, build di produzione (`npm run build`) servita da
`npx vite preview --port 4173 --strictPort`, `PLINTO_E2E_URL=http://127.0.0.1:4173/`, poi
fermata per PID (609, 621, 622). Su un telefono vero, con una tastiera fisica collegata a un
telefono, con TalkBack o su iOS: **non posso confermarlo**.

## 1. Misura prima della correzione (`0c324e8`, 1.21.22)

La build di `0c324e8` produce `dist/assets/index-CSCcVQz9.js`, lo stesso nome del bundle
pubblicato (collaudo 1.21.22, § 0). Script a parte, non versionato (nello scratchpad), un
contesto nuovo per ogni riga. Pezzo scelto **con la tastiera** (fuoco sul pezzo, Invio) e
cursore portato in cima con quattro frecce (casella 4 = riga 1, colonna 5).

**PO-027** (libera con due mosse; livello 13 con dodici livelli fatti e 3 gettoni):

| Fuoco | Tasto | Esito |
|---|---|---|
| «Menu», raggiunto con **3 Tab** dal pezzo scelto | Invio | pezzo **posato** (4 → 8 punti, 4 → 8 caselle occupate), menu **non aperto**, fuoco resta su «Menu» |
| «Menu» | Spazio | pezzo **posato** (2 → 5), menu non aperto |
| pastiglia degli attrezzi (livello 13) | Invio | pezzo **posato**, **mosse 18 → 17**, pannello non aperto |
| pastiglia | Spazio | uguale: mosse 18 → 17 |

**PO-028** (livello 13, pannello aperto con un **clic** sulla pastiglia, fuoco all'apertura:
`<body>` in tutti i giri):

| Tasto | Esito |
|---|---|
| Invio | pezzo **posato** sotto il pannello (8 → 11 caselle occupate, **mosse 18 → 17**), pannello resta aperto |
| Spazio | uguale (mosse 18 → 17) |
| Freccia destra | cursore spostato sotto il pannello (4 → 5) |
| P | fuoco su «Prossimi tre pezzi», dietro il velo |
| Escape | pannello chiuso, pezzo scelto, fuoco `<body>` |

Pannello aperto con Tab+Invio sulla pastiglia (nessun pezzo): fuoco `<body>`; chiuso con
Escape, con «Torna alla partita» o col velo: fuoco `<body>` (3 su 3).

**PO-029** (libera con due mosse, «Torna alla home», sfida con una mossa, pezzo nel secondo
posto pieno del vassoio scelto, menu → «Nuova partita» → «Riprendi la partita»):

| Pezzo scelto | Nella libera |
|---|---|
| col clic | posto 3 del vassoio **scelto**, nessun cursore, fuoco `<body>` |
| con la tastiera | posto 3 **scelto**, **cursore** nella stessa casella della sfida (4), **anteprima** di 3 caselle |

**Ipotesi della madre su PO-029: confermata per quello che si può misurare.** La scelta vive
nello stato di `useTrascinamento` (`src/ui/useTrascinamento.js:66`, chiamato da
`src/ui/SchermoGioco.jsx`) e il cursore in quello di `useTastiera`
(`src/ui/useTastiera.js`): che restino uguali dopo il cambio di partita vuol dire che React
ha tenuto la stessa istanza di `SchermoGioco` (libera e sfida, stessa posizione in
`src/ui/App.jsx`, nessuna `key`). La prova diretta è il caso U con l'interruttore spento (§ 5):
azzerando lo stato al cambio di seme il difetto sparisce.

Una nota sullo script `e2e-po008`: la `firma` della partita (`tests/e2e/ripresa-livello.mjs:119`)
conta le caselle con la classe `piena`, che le caselle della griglia non hanno (in
`src/ui/Plancia.jsx` le classi sono `pl-cella`, `--cursore`, `--anteprima`, ...; la casella
occupata ha dentro un `.pl-blocco`). Quel numero è sempre 0: la firma regge sul punteggio e
sull'obiettivo. Non l'ho cambiata (fuori da questa voce, vedi scelta aperta 4); i casi nuovi
usano una firma loro che conta i blocchi.

## 2. PO-027 — `INVIO_PREME_I_PULSANTI` (`src/ui/useTastiera.js`)

`useTastiera` ascolta `window` e, con un pezzo scelto, chiamava `preventDefault()` su Invio e
Spazio da qualunque punto. Acceso, prima di posare guarda il bersaglio del tasto: se è dentro
un comando (`button`, `a[href]`, `input`, `select`, `textarea`, `summary`, `[role="button"]`)
che **non** sta nel vassoio (`.pl-tray`) né nella griglia (`.pl-plancia`), esce senza
`preventDefault()` e il browser preme il pulsante. Restano a posare:

- il fuoco sul pezzo del vassoio (da cui si è appena scelto con Invio): è la strada
  dell'aiuto («Tab per scegliere il pezzo, Invio per prenderlo, ... Invio per appoggiarlo»,
  `aiuto.tastiera`, `src/i18n/it.js:575`), che resta vera;
- il fuoco su `<body>` o su un elemento che non è un comando (es. l'anteprima `#pl-anteprima`,
  che ha `tabIndex={-1}` ed è un contenitore).

Premono il pulsante: «Menu», la pastiglia degli attrezzi, la mensola, «Lascia stare»,
«Rimetti a posto» (quest'ultimo non è a schermo con un pezzo scelto). Le frecce ed Escape
non cambiano.

## 3. PO-028 — `TASTI_TACCIONO_SOTTO_IL_PANNELLO` (`src/ui/SchermoGioco.jsx`) e `PANNELLO_COME_IL_MENU` (`src/ui/Attrezzi.jsx`)

**Tasti.** `tastiAttivi` ora guarda `velato`, che è vero con `coperto` (menu o domanda, come
in PO-026) **oppure** con `modoAttrezzo === 'scelta'` (pannello aperto). Lo stesso `velato`
spegne il tasto P. Il pezzo resta scelto; Escape lo ascolta solo il pannello
(`src/ui/Attrezzi.jsx`), che si chiude.

**Fuoco.** Il pannello come `MenuPartita.jsx`: all'apertura il fuoco va su «Torna alla
partita»; chiuso senza una scelta (Escape, velo, «Torna alla partita») torna alla pastiglia;
dopo una scelta il fuoco non si sposta (come prima: con il gessetto finisce su `<body>`). La
pastiglia sparisce mentre il pannello è aperto (`conAttrezzi && modoAttrezzo === 'chiuso'`) e
torna nello stesso disegno che toglie il pannello: la pulizia dell'effetto del pannello la
trova già a schermo e le dà il fuoco. «Scelta» = clic su un pulsante del pannello che non è
«Torna alla partita» (`onClickCapture`, come nel menu).

Perché **«Torna alla partita»** e non il primo attrezzo: vedi scelta aperta 1.

Due interruttori invece di uno: i tasti e il fuoco sono due difetti diversi del collaudo (D1 e
O3), e così ognuno ha la sua prova rosso/verde, come D1 e O1 in PO-026 (scelta aperta 2).

## 4. PO-029 — `SCELTA_AZZERATA_CAMBIANDO_PARTITA` (`src/ui/SchermoGioco.jsx`)

`SchermoGioco` calcola quale partita ha a schermo, `${modalita}|${quadro?.numero ?? ''}|${partita.seed}`,
e quando cambia chiama `drag.annulla()`: il pezzo non è più scelto e `useTastiera` toglie il
cursore (lo fa già quando la scelta torna a `null`). Il seme da solo distingue libera e sfida;
modo e numero del livello ci sono perché la stessa istanza può passare anche da un livello
alla libera (stessa posizione nei due `return` di `App.jsx`).

Non toccati: «Riprova» del livello (stesso livello, stesso seme: la scelta non si azzera; vedi
scelta aperta 3), il modo dell'attrezzo (`modoAttrezzo`, che esiste solo nei livelli), il
fuoco dopo «Riprendi la partita» dalla sfida (`<body>`, scelta aperta 2 di PO-026, invariata).

## 5. Casi S, T, U di `npm run e2e-po008` e prova rosso/verde

| Caso | Che cosa prova |
|---|---|
| S | Tab **vero** dal pezzo scelto fino a «Menu», Invio e Spazio: menu aperto, partita uguale, pezzo scelto. Livello 13, fuoco sulla pastiglia, Invio: pannello aperto, mosse uguali. Posare come prima: fuoco sul pezzo del vassoio e fuoco su `<body>`, Invio posa |
| T | pezzo scelto, pannello aperto col clic: fuoco su «Torna alla partita»; Invio, Spazio (chiudono, fuoco alla pastiglia), freccia destra, P (pannello aperto, fuoco dentro), Escape (fuoco alla pastiglia): pezzo scelto, cursore fermo, partita uguale. Fuoco su `<body>` a pannello aperto, Invio e Spazio: partita uguale (il caso del collaudo). Senza pezzo, Tab+Invio: fuoco su «Torna alla partita»; velo: fuoco alla pastiglia; gessetto: il fuoco non va alla pastiglia |
| U | dalla sfida, menu → «Nuova partita» → «Riprendi la partita», con il pezzo scelto col clic e con la tastiera: nella libera nessun pezzo scelto e nessun cursore |

Build di produzione, `e2e-po008` intero ogni volta, interruttori spenti e rimessi con la
stessa `sed` (`s/export const NOME = true;/.../false;/` e ritorno), mai `git checkout`;
dopo ogni giro `git status` pulito sui sorgenti.

| Stato | Esito | Problemi |
|---|---|---|
| tutto acceso | **verde** («Tutto a posto.», casi A–U), 2 giri | 0 |
| `INVIO_PREME_I_PULSANTI = false` | **rosso** | 8, tutti del caso S: «Menu» Invio e Spazio posano (4 → 6, 2 → 5 punti) e il menu non si apre; pastiglia Invio posa (8 → 11 caselle) e il pannello non si apre |
| `TASTI_TACCIONO_SOTTO_IL_PANNELLO = false` | **rosso** | 6, tutti del caso T: freccia destra muove il cursore (4 → 5), P porta il fuoco su «Prossimi tre pezzi», con il fuoco su `<body>` Invio e Spazio posano (0 → 3 punti, 8 → 11 caselle) |
| `PANNELLO_COME_IL_MENU = false` | **rosso** | 15, tutti del caso T: fuoco su `<body>` all'apertura (7 volte), dopo Escape e velo; Invio e Spazio non chiudono il pannello (il fuoco non è su «Torna alla partita») |
| `SCELTA_AZZERATA_CAMBIANDO_PARTITA = false` | **rosso** | 3, tutti del caso U: pezzo scelto nella libera (clic e tastiera), cursore della sfida (tastiera) |

**Trovato strada facendo**: al primo giro con `TASTI_TACCIONO_SOTTO_IL_PANNELLO` spento il
caso T era rosso solo per freccia e P (2 problemi), perché con il fuoco su «Torna alla
partita» Invio e Spazio vanno al pulsante anche senza quell'interruttore. Ho aggiunto il
sotto-caso con il fuoco su `<body>` (come nel collaudo, pannello aperto e fuoco fuori dai
pulsanti), che fa vedere il difetto originale: 6 problemi.

Nessun altro caso rosso in nessun giro. `npm run e2e-attrezzi` sulla build di produzione
corretta: «Nessun problema rilevato.»

Misura dopo la correzione con lo stesso script del § 1: «Menu» Invio/Spazio → menu aperto,
fuoco su «Torna alla partita», partita e pezzo uguali; pastiglia Invio/Spazio → pannello
aperto, mosse 18 → 18; pannello Invio/Spazio → pannello chiuso, mosse 18 → 18, cursore 4 → 4,
fuoco sulla pastiglia; freccia e P → niente; PO-029 → nessun pezzo scelto, nessun cursore
(clic e tastiera). Nessun errore di pagina né di console.

## 6. Controlli finali

- `npm run build`: riuscita.
- `npm test`: 45 file, 650 test, verdi.
- `npm run verifica -- --veloce`: vedi § 6.1.

### 6.1 Gate

ESITO_GATE

## 7. Testo proposto per il changelog

```
- **Con un pezzo scelto, Invio su «Menu» apre il menu** (PO-027, rapporto PO-026 scelta 4):
  giocando con la sola tastiera, Invio e Spazio posavano il pezzo da qualunque punto della
  pagina, anche con il fuoco su «Menu» o sulla pastiglia degli attrezzi (nel livello si
  perdeva una mossa). Ora premono il pulsante che ha il fuoco; con il fuoco sul pezzo, Invio
  lo posa come prima. Interruttore `INVIO_PREME_I_PULSANTI`.
- **Con il pannello degli attrezzi aperto, la tastiera non muove più la partita sotto**
  (PO-028, collaudo 1.21.22 D1 e O3): con un pezzo scelto, Invio e Spazio posavano il pezzo
  sotto il pannello, e nel livello costava una mossa che non si vedeva. Ora vale la stessa
  regola del menu: i tasti della partita tacciono, il pezzo resta scelto. E il pannello si
  comporta come il menu: all'apertura il fuoco va su «Torna alla partita», chiuso senza
  scegliere torna alla pastiglia. Interruttori `TASTI_TACCIONO_SOTTO_IL_PANNELLO` e
  `PANNELLO_COME_IL_MENU`.
- **Passando dalla sfida alla libera non resta più scelto un pezzo** (PO-029, collaudo
  1.21.22 O1): con «Riprendi la partita» dalla sfida, nella libera compariva scelto un pezzo
  mai scelto (e, con la tastiera, il cursore). Ora scelta e cursore si azzerano quando
  cambia la partita. Interruttore `SCELTA_AZZERATA_CAMBIANDO_PARTITA`. Controllo: casi S, T
  e U di `npm run e2e-po008`.
```

L'aiuto (`aiuto.tastiera`, `src/i18n/it.js:575` e `en.js`) resta vero così com'è: dice
«Invio per appoggiarlo» nel giro Tab → pezzo → Invio → frecce → Invio, che funziona come
prima (caso S, fuoco sul vassoio).

## 8. Scelte aperte

1. **Dove entra il fuoco all'apertura del pannello.**
   - A **(consigliata, fatta)**: «Torna alla partita». È il pulsante su cui entra il menu
     (PO-024), quindi un'abitudine sola; ed è l'unico che non spende: il gessetto si applica
     subito (`usaGessetto` chiama `usaAttrezzo()` appena scelto, `src/state/useQuadro.js:269`), e un Invio di troppo (doppio Invio,
     tasto ripetuto) su un attrezzo costerebbe un gettone. Costo: «Torna alla partita» è
     l'ultimo del pannello, per arrivare agli attrezzi serve Maiusc+Tab (o Tab, che però esce
     dal pannello: è O2 del collaudo 1.21.21, fuori da questa voce).
   - B: il primo attrezzo abilitato (con zero gettoni non ce ne sono, si va su «Torna alla
     partita»): Tab scorre gli attrezzi in ordine, ma un Invio di troppo spende.
   - C: il pannello stesso (`tabIndex=-1` sul contenitore), così il lettore di schermo legge
     tutto e nessun pulsante è sotto il dito.
2. **Un interruttore o due per PO-028.**
   - A **(consigliata, fatta)**: due (`TASTI_TACCIONO_SOTTO_IL_PANNELLO`,
     `PANNELLO_COME_IL_MENU`), ognuno con la sua prova rosso/verde (§ 5), come D1 e O1 di
     PO-026.
   - B: uno solo, come chiede alla lettera «un interruttore per ciascuna».
3. **«Riprova» del livello e la scelta del pezzo.** Stesso livello, stesso seme: la scelta non
   si azzera (non misurato se resta scelto dopo «Riprova»: **non posso confermarlo**).
   - A **(consigliata, fatta: niente)**: lasciare com'è; la decisione dice «modo o seme», e
     il vassoio dopo «Riprova» è lo stesso del primo giro.
   - B: azzerare anche a ogni nuova partita con lo stesso seme (servirebbe un contatore della
     partita, non c'è nello stato del motore).
4. **La `firma` di `e2e-po008` che conta una classe che non esiste** (§ 1, nota).
   - A **(consigliata)**: voce a parte: contare i blocchi come fanno i casi S, T, U, e far
     scegliere a `unaMossa` una casella davvero vuota (oggi prende la casella di mezzo fra
     tutte, `tests/e2e/ripresa-livello.mjs:129`). Va fatto fallire di proposito prima.
   - B: lasciarla, il punteggio basta a distinguere quasi sempre.

## 9. Che cosa non è stato verificato

- Telefono vero, tastiera fisica collegata a un telefono, TalkBack, VoiceOver, iOS: **non
  posso confermarlo**. In particolare il fuoco che entra nel pannello con TalkBack.
- Formati diversi da 390x844 e lingua inglese per i casi nuovi: non provati (il codice nuovo
  non dipende da testi né da misure, ma non l'ho misurato).
- La mensola con la tastiera (con un pezzo scelto ora Invio sulla mensola la preme invece di
  posare): non provata a mano.
