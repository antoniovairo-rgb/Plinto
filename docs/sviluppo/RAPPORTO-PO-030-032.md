# Rapporto PO-030, PO-031, PO-032 — attrezzi con la tastiera e prova

Figlia, 21 ottobre 2026. Ramo `po030-032-attrezzi`, partito da `main` a `dc8f871`
(«DECISIONI, BACKLOG, ROADMAP: collaudo 1.21.23, PO-032 nuova»). Niente su `main`, nessun
cambio di versione (`package.json` resta `1.21.23`), `android/` non toccato.

Commit, in ordine:

| Commit | Voce | File |
|---|---|---|
| `20fb453` | PO-031 (solo la prova) | `tests/e2e/ripresa-livello.mjs` |
| `44a9dbb` | PO-032 | `src/ui/SchermoGioco.jsx`, `src/ui/useTastiera.js`, `tests/e2e/ripresa-livello.mjs` |
| `7640772` | PO-030 | `src/ui/SchermoGioco.jsx`, `src/ui/useTastiera.js`, `src/ui/Attrezzi.jsx`, `src/i18n/it.js`, `src/i18n/en.js`, `tests/e2e/ripresa-livello.mjs` |

Ambiente: container, Chromium `/opt/pw-browsers/chromium` (`PLINTO_CHROMIUM`), build di
produzione (`npm run build`), servita da `npx vite preview --port 4173 --strictPort`, prove
con `PLINTO_E2E_URL=http://127.0.0.1:4173/`. Ogni misura sotto viene da `npm run e2e-po008`
su quella build, 390x844, italiano, livello 13 con dodici livelli fatti e tre gettoni (la
preparazione di `livello13()` dello script). `vite preview` fermato per PID (`kill`), dopo
aver letto i PID da `/proc/<pid>/exe`. Telefono vero, tastiera fisica su Android, TalkBack,
iOS: **non posso confermarlo**.

## 1. PO-031 — la firma di `e2e-po008` (solo la prova)

### Che cosa c'era

- La `firma` contava `.pl-cella` con la classe `piena`, che le caselle non hanno
  (`src/ui/Plancia.jsx:51-56`: le classi sono `pl-cella`, `--cursore`, `--anteprima`,
  `--vietata`, `--incandidata`, `--segnata`; la casella occupata ha dentro un `.pl-blocco`).
- `unaMossa` puntava «la casella di mezzo fra le vuote», con la stessa classe: sempre la 40.
- **In più, trovato qui**: la `firmaPiena` dei casi S, T, U contava bene i blocchi ma leggeva
  l'obiettivo da `.pl-barra-obiettivo`, classe che non esiste (`src/ui/BarraObiettivo.jsx:15`:
  è `.pl-obiettivo`). Le MOSSE del livello non entravano in quella firma: «mosse uguali» nei
  casi S e T reggeva solo sul conteggio dei blocchi e sul punteggio.

### Che cosa ho cambiato

- Le caselle occupate si leggono dall'etichetta della griglia (`, occupata` / `, filled`),
  che nasce da `grid[i] !== 0` (`Plancia.jsx:66-69`): non conta l'anteprima né i blocchi che
  stanno sparendo.
- `unaMossa` legge la forma dal disegno del pezzo (`Pezzo.jsx`, griglia `repeat(w, Npx)`),
  le caselle libere dalla griglia, sceglie il posto libero più vicino al centro e porta il
  puntatore dove `rilascia` di `useTrascinamento.js` fa cadere l'origine della forma.
  Restituisce se la griglia è cambiata; una mossa non fatta rende rossa la corsa.
- `firmaPiena` di S, T, U ora è la stessa `firma`.
- Caso **V** nuovo: libera con due mosse, si cambia solo la griglia salvata (una casella
  libera diventa occupata, punteggio uguale), si ricarica: la firma deve cambiare.

### Prove

| Prova | Esito |
|---|---|
| Firma vecchia (copia temporanea dello script con il conteggio di `piena`) | **rosso**: «V: la firma non vede una griglia diversa con lo stesso punteggio ("PUNTEGGIO 10 RECORD 0 /  / 0 occupate")» |
| `unaMossa` vecchia, con il controllo nuovo delle mosse | **rosso**: 51 mosse non fatte su 92 |
| Firma e `unaMossa` nuove | **verde**, A–U e V: «"PUNTEGGIO 7 RECORD 0 /  / 7 occupate" -> "... / 8 occupate"» |

Le copie temporanee sono state cancellate dopo la prova (`git status` pulito).

**Una cosa non spiegata.** Con `unaMossa` nuova, 3 corse su 14 (prima del ritentativo) hanno
avuto **una** mossa non fatta su 92; 2 delle 3 con più corse insieme sulla stessa macchina.
Una schermata presa nel momento mostra la partita libera con 41 punti e un pezzo nel
vassoio; la causa **non posso confermarla** (non riprodotta in 9 corse successive con la
sonda accesa). Ho aggiunto **un** ritentativo, contato e stampato («Mosse di unaMossa: N
tentate, R ritentate, M non fatte»). Dopo: 3 corse su 10 con 1 ritentata, 0 non fatte in
tutte.

## 2. PO-032 — mensola, carriola e scambio con un pezzo scelto

### Misura prima della correzione (caso W, codice di `main`)

| Prova | Prima |
|---|---|
| pezzo 1 scelto da tastiera, 4 frecce su, pastiglia (Invio), «La mensola» (Invio) | cursore e **3 caselle di anteprima** restano sotto «Quale pezzo metto da parte?» |
| poi Invio sul pezzo 2 del vassoio | **pezzo 1 posato**: MOSSE 18 → 17, caselle occupate 8 → 11, punteggio 0 → 3; mensola vuota, domanda ancora a schermo, fuoco su «Pezzo 2» |
| uguale con «La carriola» | MOSSE 18 → 17, 8 → 11, «Quale pezzo cambio?» resta |
| **scambio** (mensola piena e mano piena; pezzo 1 scelto da tastiera, Invio sulla mensola, Invio sul pezzo 3) | **anche qui**: cursore e 3 caselle di anteprima sotto «La mano è piena…», poi pezzo posato: MOSSE 16 → 15, caselle occupate 15 → 18, domanda resta |
| Escape nell'attesa (mensola, carriola, mensola con pezzo scelto, piccone) | la domanda resta in tutti e quattro |
| ripreso dalla mensola con un posto libero (Invio sulla mensola) | fuoco su `<body>` |

### Correzioni (`src/ui/SchermoGioco.jsx`)

| Interruttore | Che cosa fa |
|---|---|
| `SCELTA_AZZERATA_CON_L_ATTREZZO` | scegliere mensola, carriola o piccone dal pannello, o entrare nello scambio dalla mensola, chiama `drag.annulla()`: via la scelta, il cursore e l'anteprima. Il gessetto no (si applica subito) |
| `ESCAPE_LASCIA_STARE` | durante l'attesa (mensola, carriola, scambio, piccone) Escape fa `setModoAttrezzo('chiuso')`, come «Lascia stare»; tace se c'è il menu o una domanda sopra; in `useTastiera` (`escapeAltrove`) Escape nell'attesa non lascia anche il pezzo |
| `FUOCO_SUL_VASSOIO_DOPO_LA_MENSOLA` | dopo «metti da parte» il fuoco va sul pezzo del vassoio più vicino (prima quello dopo, poi quello prima); dopo «riprendi» e dopo lo scambio sul pezzo ripreso. Solo se il pulsante è stato premuto da tastiera (`detail === 0`) |

### Prove rosso/verde (build di produzione, `e2e-po008`)

| Stato | Esito |
|---|---|
| tutti accesi | **verde**, «Tutto a posto.»; W: mensola «mosse uguali, gettoni 3 -> 2, fuoco Pezzo 3»; carriola «mosse uguali, gettoni 3 -> 2»; scambio «mosse uguali, fuoco Pezzo 3»; riprendi «fuoco Pezzo 1»; Escape: «domanda chiusa» quattro su quattro |
| `SCELTA_AZZERATA_CON_L_ATTREZZO` spento | **rosso**, solo W: 8 problemi (mensola e carriola: anteprima, pezzo posato MOSSE 18 → 17, domanda resta…) + 3 dello scambio (MOSSE 16 → 15) in una seconda corsa col caso scambio reso indipendente |
| `ESCAPE_LASCIA_STARE` spento | **rosso**, solo W: 4 problemi (la domanda resta) |
| `FUOCO_SUL_VASSOIO_DOPO_LA_MENSOLA` spento | **rosso**, solo W: 3 problemi (fuoco su `<body>`) |

Interruttori rimessi con la stessa `sed` che li spegne; build rifatta.

## 3. PO-030 — il piccone con la tastiera

### Misura prima (caso X, codice dopo PO-032)

| Prova | Prima |
|---|---|
| pastiglia (Invio), «Il piccone» (Invio) | «Quale casella svuoto?»; **nessun cursore** sulla griglia |
| frecce, poi Invio (e, a parte, Spazio) | cursore assente, caselle occupate **8 → 8**, la domanda resta |
| col tocco (clic sulla pastiglia, sul piccone, su una casella occupata) | 8 → 7, gettoni 3 → 2, nessun cursore |

### Correzione

`SCAVO_CON_LA_TASTIERA` (`SchermoGioco.jsx`) e `useTastiera.js` (`scavo`, `scavoDaTastiera`,
`onScava`):

- nello scavo le frecce muovono il cursore anche senza un pezzo scelto;
- Invio o Spazio svuotano la casella sotto il cursore, chiamando lo stesso `onPiccone` del
  tocco: su una casella libera non succede niente e lo scavo resta, come col tocco;
- scelto il piccone dalla tastiera (`detail === 0` sul pulsante del pannello: per questo
  `Attrezzi.jsx` passa l'evento a `onScegli`) il cursore compare al centro; scelto col tocco
  non compare, e il primo Invio senza cursore lo fa comparire invece di scavare alla cieca;
- con il fuoco su un pulsante (anche un pezzo del vassoio) Invio resta del pulsante: si
  scava dalla griglia o da `<body>`;
- Escape: `ESCAPE_LASCIA_STARE` (§ 2).

### Prove rosso/verde

| Stato | Esito |
|---|---|
| acceso | **verde**: Invio «occupate 8 -> 7, gettoni 3 -> 2, cursore all'ingresso sì»; Spazio uguale; casella libera: niente cambia, lo scavo resta; tocco «8 -> 7, gettoni 3 -> 2, cursore no»; dopo lo scavo nessun cursore, MOSSE uguali |
| spento | **rosso**, solo X: 8 problemi (nessun cursore, frecce ferme, 8 → 8, la domanda resta; per Invio e per Spazio) |

`npm run e2e-attrezzi` sulla stessa build: «Nessun problema rilevato.» dopo PO-032 e dopo
PO-030.

## 4. Testo nuovo dell'aiuto (`aiuto.tastiera`)

Aggiunta una frase, prima dell'ultima; parità delle chiavi invariata (nessuna chiave nuova).

- it: «Si gioca anche da tastiera: Tab per scegliere il pezzo, Invio per prenderlo, le frecce
  per muoverti sulla griglia, Invio per appoggiarlo, Esc per annullare. **Col piccone le
  frecce scelgono la casella e Invio la svuota.** Ogni mossa viene descritta a voce ai
  lettori di schermo.»
- en: «You can also play from the keyboard: Tab to choose a piece, Enter to pick it up, arrows
  to move on the grid, Enter to drop it, Esc to cancel. **With the pickaxe, the arrows choose
  the square and Enter empties it.** Every move is announced to screen readers.»

Lessico: «casella» / «square», come vuole `tests/lessico.test.js`; `npm test` verde.

## 5. Testo proposto per il changelog

> **Gli attrezzi con la tastiera.**
> - Il piccone si usa anche con la tastiera: scelto il piccone, le frecce portano il cursore
>   sulla casella e Invio (o Spazio) la svuota. Escape, come «Lascia stare», lo rimette via.
>   Col tocco non cambia niente. L'aiuto lo dice in una frase.
> - Con un pezzo scelto dalla tastiera, scegliere la mensola, la carriola o il piccone (o lo
>   scambio dalla mensola) lascia il pezzo: Invio sul vassoio ora fa l'attrezzo e non posa
>   più il pezzo di prima. Prima si perdeva una mossa (livello 13: mosse 18 → 17).
> - Escape durante «Quale pezzo metto da parte?», «Quale pezzo cambio?», lo scambio e lo
>   scavo fa quello che fa «Lascia stare».
> - Messo un pezzo sulla mensola o ripreso con la tastiera, il fuoco resta sui pezzi: sul
>   più vicino, o su quello ripreso.
>
> Perché: collaudo 1.21.22 (O2) e 1.21.23 (D1, O1, O2), decisioni PO-030 e PO-032.
> Misurato sulla build di produzione con `e2e-po008` (casi W e X): ogni interruttore spento
> fa rosso il suo caso, acceso tutto verde. Nella prova, la firma della partita ora conta le
> caselle occupate davvero (PO-031, caso V: con la firma vecchia rosso).

## 6. Risultati finali

- `npm run build`: riuscita.
- `npm test`: 45 file, 650 prove, tutte verdi.
- `npm run verifica -- --veloce`: la corsia veloce è stata **negata** («non risulta nessun giro
  completo passato su questa macchina»), quindi è andato il giro completo: **31 su 33**, 5182 s,
  «tutti e cento i livelli, giocati nell'app» verde. Rossi i due noti dei container delle
  figlie (`docs/TESTING.md`), con gli stessi numeri: «livelli nel browser» (`e2e-quadri`,
  «FINE LIVELLO (vittoria): a 320x700 bisogna scorrere di 2 px») e «Play Store» (`recensione`,
  «a 360x640 l'invito finisce 10px sotto la barra dei pulsanti»). Nessun altro rosso. Il
  verdetto che conta è quello della CI, che su questo ramo non ho.

## 7. Scelte aperte

1. **Fuoco dopo la carriola** (misurato: `<body>`; la decisione (c) parla solo di mensola).
   - A **(consigliata)**: fuoco sul pezzo nuovo nello stesso posto, come dopo lo scambio.
   - B: lasciare com'è.
   Non fatto: fuori dalla decisione.
2. **Fuoco dopo Escape o «Lascia stare» nell'attesa, e dopo lo scavo** (misurato: `<body>`).
   - A **(consigliata)**: fuoco alla pastiglia, come la chiusura del pannello senza scelta.
   - B: lasciare com'è (oggi «dopo una scelta il fuoco non si sposta»).
   Non fatto: la decisione (b) dice «fa quello che fa “Lascia stare”», e «Lascia stare» oggi
   lascia il fuoco su `<body>`.
3. **«Riprendi» dalla mensola con un pezzo già scelto e un posto libero**: non chiede un pezzo,
   quindi la scelta resta (come misurato nel collaudo 1.21.23, prova M). Con il fuoco portato
   sul pezzo ripreso, Invio posa il pezzo scelto prima (è la regola PO-027: fuoco sul vassoio
   e pezzo scelto, Invio posa). **Misurato** (sonda sulla build di produzione, livello 13): pezzo
   1 sulla mensola, pezzo scelto da tastiera, 4 frecce su, Invio sulla mensola → mano 3, pezzo
   ancora scelto, cursore acceso, fuoco «Pezzo 1»; Invio → **MOSSE 18 → 17**, caselle 8 → 11.
   Non nasce da `FUOCO_SUL_VASSOIO_DOPO_LA_MENSOLA`: prima il fuoco andava su `<body>`, dove
   Invio posa lo stesso (regola PO-027); ma ora chi vede il fuoco sul pezzo ripreso si aspetta
   di sceglierlo.
   - A **(consigliata)**: anche «riprendi» azzera la scelta, se la scelta era da tastiera.
   - B: lasciare com'è.
4. **Il ritentativo di `unaMossa`** (§ 1): causa non trovata. A **(consigliata)**: tenerlo,
   contato e stampato; B: toglierlo e cercare la causa con una sonda in CI.
5. **La firma legge l'etichetta in italiano o in inglese** (`, occupata` / `, filled`): se un
   giorno l'etichetta cambia, la firma torna a 0 senza dirlo… ma il caso V allora diventa
   rosso, ed è quello che deve fare.

## 8. Che cosa non ho verificato

- Telefono vero, tastiera fisica su Android, TalkBack, iOS: **non posso confermarlo**.
- Misure diverse da 390x844 e lingua inglese per i casi W e X: non provate (il codice nuovo
  non dipende da testi né da misure, ma non l'ho misurato).
- Che `:focus-visible` non si accenda col tocco dopo la mensola: col tocco il fuoco non viene
  spostato affatto (`detail === 0`), quindi non c'è niente da accendere; non misurato a schermo.
- Il Tab che esce da menu e pannello, TalkBack: fuori da questa voce.
