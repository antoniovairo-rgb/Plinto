# Collaudo 1.21.23

Figlia di collaudo, 21 ottobre 2026. Ramo `collaudo-1.21.23`, partito da `main` a `28c280f`
(«ROADMAP: 1.21.23 pubblicata»). Nessun file del gioco toccato, niente su `main`: solo questo
rapporto e le schermate in `docs/sviluppo/collaudo-1.21.23/`. Non ho corretto niente.

Ambiente: container, Chromium `/opt/pw-browsers/chromium` (collegamento a
`chromium-1194/chrome-linux/chrome`), Playwright del progetto dopo `npm ci`, font del
container. Tutte le prove sono contro il sito pubblicato
`https://antoniovairo-rgb.github.io/Plinto/`; nessun server di sviluppo acceso (controllato
con `/proc/<pid>/exe`: l'unico `node` vivo era il mio script). Su un telefono vero, con una
tastiera fisica collegata a un telefono, con TalkBack o su iOS: **non posso confermarlo**.

## Sintesi

| Voce | Classe | In breve |
|---|---|---|
| D1 | **D** | Con un pezzo scelto, scelta la **mensola** (o la **carriola**) dal pannello, Invio o Spazio su un pezzo del vassoio **posano il pezzo scelto prima** invece di metterlo da parte: una mossa spesa (MOSSE 18 → 17) sotto la scritta «Quale pezzo metto da parte?», che resta |
| O1 | O | Durante l'attesa di mensola e carriola Escape non annulla l'attrezzo («Lascia stare» resta), mentre l'aiuto dice «Esc per annullare» |
| O2 | O | Messo un pezzo sulla mensola o ripreso con la tastiera, il fuoco finisce su `<body>` |

Nessun errore grave (E). Le quattro novità funzionano come descritto in tutte le misure e le
due lingue (§ 2). I sei script richiesti sono verdi contro il sito pubblicato (§ 1).

## 0. Che cosa è pubblicato

- `index.html` del sito carica `assets/index-BiMDBRRy.js`; quel bundle contiene la stringa
  `1.21.23` (4 occorrenze, `curl` + `grep -o '1\.21\.[0-9]*'`). È la versione da collaudare.
- `package.json` di `main` a `28c280f`: `"version": "1.21.23"`.

## 1. Script del progetto contro il sito pubblicato

`npm ci` riuscito. Poi, con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`
(tutti e sei gli script leggono questa variabile; con il sito che risponde non avviano un
server loro):

| Script | Uscita | Esito |
|---|---|---|
| `npm run e2e-po008` | 0 | «Tutto a posto.» (casi A–U; S, T, U compresi) |
| `npm run e2e-attrezzi` | 0 | «Nessun problema rilevato.» |
| `npm run home-spiegazione` | 0 | «La riga c'e' in italiano e in inglese, ... "Nuova" sta dentro la card della libera.» |
| `npm run e2e` | 0 | «Nessun problema rilevato.» |
| `npm run indietro` | 0 | «Tutte le verifiche del tasto Indietro sono passate.» |
| `npm run annulla` | 0 | «Il "rimetti a posto" compare quando deve, ripristina esattamente, e poi sparisce.» |

`e2e-quadri` e `recensione` non li ho lanciati (non richiesti). Limite noto non riportato come
difetto: la `firma` di `e2e-po008` (PO-031).

## 2. Prove a mano (Playwright, sito pubblicato)

Script mio, non versionato (scratchpad), un contesto nuovo per ogni prova, `localStorage`
azzerato; per il livello: livelli 1–12 fatti, 3 gettoni, livello 13 (come `e2e-po008`).
Il pezzo si sceglie **con Tab veri** fino al pezzo del vassoio e Invio; si posa portando il
cursore con le frecce finché l'anteprima non è più vietata, poi Invio. Misure: 320x700,
360x640, 390x844, 1366x768; it ed en: **8 combinazioni**.

| Prova | Che cosa | Esito nelle 8 combinazioni |
|---|---|---|
| N1 (PO-027) | libera con 2 mosse, pezzo scelto, **2 Tab** fino a «Menu», Invio / Spazio | menu aperto, fuoco su «Torna alla partita», partita uguale, pezzo ancora scelto; Escape: menu chiuso, fuoco su «Menu», pezzo scelto; poi Tab al vassoio e Invio: **posa** come prima |
| N1 livello | livello 13, pezzo scelto, **5 Tab** fino alla pastiglia, Invio / Spazio | pannello aperto, fuoco su «Torna alla partita», MOSSE uguali, pezzo scelto |
| N2 (PO-028) | pannello aperto col clic, pezzo scelto, fuoco tolto (`<body>`), tasto → ↑ P w Invio Spazio | pannello resta aperto, pezzo scelto, cursore fermo (40 → 40), partita uguale: 6 tasti su 6 |
| N3 (PO-028, fuoco) | pannello aperto con Tab+Invio senza pezzo; chiuso con Escape, «Torna alla partita» (Invio), velo, gessetto | apertura: fuoco su «Torna alla partita» (4 su 4); Escape, «Torna», velo: fuoco sulla pastiglia, gettoni 3; gessetto (raggiunto con 3 Maiusc+Tab): 3 caselle segnate, gettoni 3 → 2, fuoco `<body>` (come prima, da progetto) |
| N4 (PO-029) | libera con 2 mosse → home → sfida, 1 mossa, pezzo 2 scelto col clic / con la tastiera (cursore acceso) → menu → «Nuova partita» → «Riprendi la partita» | nella libera nessun pezzo scelto, nessun cursore, fuoco `<body>`; subito dopo una mossa con la tastiera riesce |
| K | livello 13 solo tastiera: 3 mosse; gessetto (Tab alla pastiglia, Invio, Maiusc+Tab, Invio); mensola senza pezzo scelto (pannello, mensola, Tab al vassoio, Invio); Tab alla mensola, Invio (riprende); 3 mosse | 6 mosse su 6 posate; gessetto: 3 caselle segnate, gettone speso; mensola: pezzo messo da parte (mano 3 → 2), gettone speso; ripreso (mano 2 → 3) |
| L | libera e sfida solo tastiera, 6 mosse ciascuna | 6 su 6 in entrambe |
| M | mensola con un pezzo scelto (§ 3, D1): Tab al vassoio + Invio; «Lascia stare» con Invio; Escape; mensola piena + pezzo scelto, Invio sulla mensola | **Tab al vassoio + Invio: NO in 8 su 8** (D1); «Lascia stare»: attesa chiusa, pezzo ancora scelto, partita uguale; Escape: vedi O1; Invio sulla mensola con pezzo scelto: pezzo ripreso, pezzo scelto e cursore restano, partita uguale |
| R (PO-023/024/026) | menu con pezzo scelto: fuoco d'ingresso, Tab a «Nuova partita», Invio (domanda), Escape, Escape; «Riprendi la partita» con Invio; nel livello «Riprova», Escape | fuoco su «Torna alla partita»; domanda aperta con fuoco su «Riprendi la partita»; 1° Escape chiude solo la domanda (fuoco su «Nuova partita»), 2° chiude il menu (fuoco «Menu», pezzo scelto, partita uguale); «Riprendi la partita»: fuoco su «Menu»; «Riprova» + Escape: fuoco su «Menu» |

Errori di pagina e di console: **zero** in tutte le corse.

Conteggio: **34 OK e 1 NO in ognuna delle 8 combinazioni**; il NO è sempre la prova M «Tab al
vassoio + Invio» (D1). Nota sull'infrastruttura: la prima corsa a 320x700 it si è fermata dopo
20 prove perché la home del sito non è comparsa entro 30 s in un contesto nuovo (timeout di
`waitForSelector`, nessuna schermata presa in quel giro); rilanciata intera, 34 OK e 1 NO, senza
nessun nuovo timeout. La causa del primo timeout (rete o altro): **non posso confermarla**.

## 3. Voci

### D1 — Mensola o carriola in attesa, pezzo scelto: Invio sul vassoio posa il pezzo vecchio

**Riproduzione** (sito pubblicato, livello 13, 390x844 it; uguale a 360x640 en e, con Spazio,
a 1366x768 it; uguale con la **carriola** a 390x844 it; uguale se il pezzo era stato scelto
col **clic** e il cursore acceso con una freccia):

1. pezzo 1 scelto con la tastiera (fuoco sul pezzo, Invio), quattro frecce su;
2. Invio sulla pastiglia, «La mensola» (Invio): sotto la griglia «Quale pezzo metto da
   parte? Lascia stare»; nel vassoio nessun pezzo appare scelto, ma **sulla griglia restano
   il cursore e l'anteprima** del pezzo 1 (schermata
   `collaudo-1.21.23/d1-mensola-in-attesa-390x844-it.png`);
3. fuoco sul pezzo 2 del vassoio, Invio.

| | PUNTEGGIO | MOSSE | caselle occupate | mano | mensola | sotto la griglia | gettoni |
|---|---|---|---|---|---|---|---|
| prima di Invio | 0 | 18 | 8 | pezzi 1, 2, 3 | vuota | «Quale pezzo metto da parte? Lascia stare» | 3 |
| dopo Invio | **3** | **17** | **11** | pezzi 2, 3 | **vuota** | **«Quale pezzo metto da parte? Lascia stare»** (resta) | 3 |

Il pezzo 1 è stato **posato** dov'era il cursore: una mossa spesa, la mensola vuota, la
domanda ancora a schermo (schermata `collaudo-1.21.23/d1-dopo-invio-390x844-it.png`). Un clic
successivo su un pezzo lo mette da parte e spende il gettone (gettoni 3 → 2). Con la
carriola: stessa cosa (MOSSE 18 → 17, «Quale pezzo cambio?» resta). Col solo tocco o mouse
non succede (il clic sul vassoio va a `onTapPezzo`).

**Perché** (lettura del codice, non misurato oltre a quanto sopra): durante l'attesa
(`modoAttrezzo` `mensola`/`carriola`/`scambio`) `velato` è falso (`src/ui/SchermoGioco.jsx:155-157`),
quindi `useTastiera` resta attivo con il pezzo ancora scelto in `useTrascinamento`; il vassoio
lo **nasconde** soltanto (`selezionato={sceltaPezzo ? null : drag.selezionato}`,
`SchermoGioco.jsx:557`). Invio su un pezzo del vassoio non è «un comando fuori»
(`suUnComandoFuori` esclude `.pl-tray`, `src/ui/useTastiera.js:37-41`), quindi
`preventDefault()` e posa (`useTastiera.js:102-110`), e il clic del pulsante non parte.
In 1.21.22 (`0c324e8`) Invio posava da qualunque punto (`git show 0c324e8:src/ui/useTastiera.js`):
il difetto c'era già, la 1.21.23 non l'ha introdotto né tolto. Che la stessa cosa accada con
lo **scambio** (mensola piena, mano piena): **non posso confermarlo**, non l'ho provato.

**Opzioni**
1. **(consigliata)** Quando si sceglie un attrezzo che chiede un pezzo (mensola, carriola,
   scambio) o una casella (piccone), azzerare la scelta del pezzo (`drag.annulla()`): sparisce
   anche l'anteprima che contraddice la domanda, e Invio sul vassoio torna al pulsante.
   Prova: un caso in `e2e-po008` o `e2e-attrezzi` come questo, fatto fallire prima.
2. Contare l'attesa dell'attrezzo in `velato` (tasti della partita muti finché si sceglie):
   più piccola, ma il pezzo resta scelto e nascosto, e l'anteprima resta sulla griglia.
3. Lasciare com'è e scriverlo nell'aiuto: sconsigliata, si perde una mossa senza capirlo.

### O1 — Escape non annulla l'attesa di mensola e carriola

Con «Quale pezzo metto da parte?» a schermo, Escape non toglie la domanda (resta «Lascia
stare») e la partita resta uguale. Se c'era un pezzo scelto, per il codice Escape lo lascia
(`useTastiera.js:83-86`); a schermo **non posso confermarlo**, perché nell'attesa il vassoio
non mostra la scelta (D1) e non ho misurato l'anteprima dopo Escape. L'aiuto
dice «... Invio per appoggiarlo, Esc per annullare» (`aiuto.tastiera`, `src/i18n/it.js:575`)
e il pannello si chiude con Escape (`src/ui/Attrezzi.jsx:155`): per l'attesa non c'è nessun
ascoltatore di Escape (lettura di `SchermoGioco.jsx`, nessuna occorrenza). Misurato nelle 8
combinazioni (prova M, Escape). «Lascia stare» con Tab+Invio funziona.

**Opzioni**
1. **(consigliata)** Escape durante l'attesa fa quello che fa «Lascia stare» (insieme a D1,
   opzione 1, così Escape non ha due significati).
2. Lasciare solo «Lascia stare» e dirlo nell'aiuto.
3. Nessun intervento: la via con Tab esiste.

### O2 — Dopo la mensola il fuoco va su `<body>`

Con la tastiera: messo da parte un pezzo (Invio sul pezzo del vassoio) il fuoco finisce su
`<body>`; ripreso dalla mensola (Invio sul pulsante della mensola) idem (prova K, 8
combinazioni). È coerente con «dopo una scelta il fuoco non si sposta» (PO-028, il pulsante
premuto sparisce), ma il Tab seguente riparte dall'inizio della pagina. Non è una delle
quattro novità e non l'ho visto nella lista dei limiti noti.

**Opzioni**
1. **(consigliata)** Fuoco sul pezzo del vassoio più vicino (dopo «metti da parte») e sul
   pezzo ripreso (dopo «riprendi»), così la mossa successiva è a un Invio.
2. Fuoco alla pastiglia, come la chiusura del pannello senza scelta.
3. Lasciare com'è.

## 4. Limiti noti, non riportati come difetti

Piccone con la tastiera (PO-030), il Tab che esce da menu e pannello, TalkBack, la `firma` di
`e2e-po008` (PO-031). «Riprova» che non azzera la scelta (rapporto PO-027/029, scelta 3): non
provato.

## 5. Che cosa non ho verificato

- Telefono vero, tastiera fisica su Android, TalkBack, iOS: **non posso confermarlo**.
- Lo scambio con la mensola piena e la mano piena insieme a D1: **non posso confermarlo**.
- `e2e-quadri`, `recensione`, `npm run verifica`: non lanciati (non richiesti).
