# Collaudo di PLINTO 1.21.8 in produzione (PO-001)

Sito: https://antoniovairo-rgb.github.io/Plinto/ — commit del codice collaudato `a14a25b`.
Data: 17 ottobre 2026. Browser: Chromium (`/opt/pw-browsers`), via proxy del container, **senza** problemi di certificato (non è stato necessario servire `dist/` in locale).
Tutti gli script sono in `collaudo/`, gli output in `collaudo/uscite/`. Nessun file del gioco è stato modificato.

**Versione servita**: `index.html` rimanda a `assets/index-XQGDPcjP.js`; nel bundle `1.21.8` compare 4 volte e nessun altro `1.21.x` (comando: `curl … | grep -o '1\.21\.[0-9]*' | sort | uniq -c`). Confermato.

## Riepilogo

| Gravità | N | Id |
|---|---|---|
| Bloccante / alta | 0 | — |
| Media | 1 | D2 |
| Bassa | 2 | D1, D3 |
| Informativi (non difetti) | 3 | I1–I3 |

Le cinque correzioni (B6, B7, B11, C1, C2) sono **riconfermate** nei casi misurati. Nessun errore di console/`pageerror` in nessuno scenario.

## Riconferma delle correzioni

| Voce | Esito | Misura (output in `uscite/`) |
|---|---|---|
| **B6** Indietro dopo ricarica | Confermata | Livello 1, una mossa, 2 ricariche di fila: ancora nel livello. Poi Indietro → mappa → home → fuori (`about:blank`). A 390x844 e 360x640. `b6-indietro.txt` |
| **B7** record separati | Confermata | Seed: libera 500, archivio sfide con max 900. Home: «Partita libera, Record 500»; Statistiche: «Record della Partita libera 500» / «Record della Sfida del giorno 900» (IT) e «Free play best score 500» / «Daily challenge best score 900» (EN). Finita una Sfida (1235): `records.best` resta 500, `records-sfida.best`=1235. Finita una libera (701): `records.best`=701, `records-sfida` invariato. `dati.txt`, `stat-*.png`, `fine-*.png` |
| **B11** gettoni unendo | Confermata | locale 1/2 + file 2/2 → 1; locale 3/4 + file 0/5 → 0 (riscossi 5); locale 0/5 + file 3/4 → 0 (nessun gettone regalato). Formato «disponibili/riscossi». `dati.txt` |
| **C1** home senza scorrimento | Confermata | scrollHeight = clientHeight, nessun contenitore scorrevole, a 360x640, 375x667, 412x915, IT e EN (`c1-home.txt`, `home-*.png`). Vedi I1 per misure fuori dall'intervallo |
| **C2** niente NaN da file guasti | Confermata **per l'importazione** | File con `best:'99'`, `best:null`, giorno `pippo`, attrezzi `'tre'`/`-1`, record `'x'`/NaN: Unisci e Sostituisci → Statistiche senza NaN/undefined/Invalid (`dati.txt`). Per i dati **già** in localStorage vedi D3 |
| **Android** (solo file) | Coerente | `android/app/build.gradle:42` `versionCode 11905`, `:47` `versionName '1.21.8'` (uguale a `package.json`); `AndroidManifest.xml:78` `sticky-immersive`; `strings.xml:20` `…/Plinto/?origine=play`. In produzione `?origine=play` mostra «Recensisci» e scrive `plinto:origine="play"`, senza il parametro no (`origine.txt`). `assetlinks.json` alla radice del dominio: HTTP 200, identico a `sito-radice/.well-known/assetlinks.json` (`assetlinks-prod.txt`) |

Regressioni cercate e **non trovate**: record in home / fine partita / Statistiche in IT e EN; esportazione (file reale scaricato: contiene `records` e `records-sfida`, impronta valida) e importazione Unisci/Sostituisci su telefono vergine (record 500/1500, attrezzi 2 riportati); «Azzera i miei dati» (doppia conferma, IT e EN: dopo «Sì, azzera tutto» in localStorage non resta nessuna chiave, la home dopo ricarica riparte dalla guida di primo avvio); tasto Indietro; home alle tre misure.

## Difetti

### D1 — Bassa — «Unisci» può abbassare il record della Sfida sotto il massimo dell'archivio
- **Dove**: Impostazioni › Carica un salvataggio › «Unisci ai miei».
- **Riproduzione** (`collaudo/dati.mjs`, sezione «B7 x import»): telefono con `sfide` (max 900) e **senza** documento `records-sfida` (cioè chi era sulla 1.21.7 e non ha ancora chiuso una Sfida con la 1.21.8; Statistiche mostra 900). Importare con Unisci un file con solo `records-sfida: {best:100}`.
- **Atteso**: il record della Sfida resta ≥ 900 (la regola B7 dice «parte dal massimo dell'archivio»). **Ottenuto**: `records-sfida.best = 100`; Statistiche passa da 900 a 100.
- **Prova**: `uscite/dati.txt` (riga «records-sfida dopo unisci»).
- **Ipotesi**: `salvataggio.js:292` fonde con `read(chiave, null)`, cioè `null` quando il documento non esiste, invece del valore derivato da `recordSfidaIniziale()` (`records.js:41`); quindi vince il file.
- **Opzioni**: (a) **consigliata**: in `applicaSalvataggio`, per `records-sfida` usare `loadRecords('sfida')` come locale e, dopo la fusione degli archivi, rialzare `best` al massimo dell'archivio risultante; (b) lasciare com'è (caso raro: serve un file con record Sfida più basso dell'archivio); (c) calcolare il record Sfida sempre come max(documento, archivio) in lettura.

### D2 — Media — «Sostituisci tutto» non toglie i documenti locali che il file non contiene
- **Dove**: stessa schermata, «Sostituisci tutto» (testo: «…resta solo quello che c'è nel salvataggio», `it.js:393`).
- **Riproduzione** (`dati.mjs`, stessa sezione): telefono con `records-sfida` 5000 e archivio sfide; sostituire con un file che contiene solo `records` e `quadri` (per esempio un salvataggio esportato con la 1.21.7, che non conosce `records-sfida`).
- **Atteso**: dopo la sostituzione non resta niente di quello che non è nel file. **Ottenuto**: restano `records-sfida` (best 5000), `sfide` (giorni 10 e 11 ott) e `statistiche` locali, mescolati ai record importati (libera 50).
- **Prova**: `uscite/dati.txt`, righe «dopo sostituisci con file senza records-sfida» e le due «NO».
- **Ipotesi**: `salvataggio.js:289` `if (!entrante) continue;` salta i documenti assenti dal file anche in modalità `sostituisci`, senza cancellare quello locale. Non posso confermare se sia voluto: il commento in testa a `applicaSalvataggio` parla di «butta via quello che c'è adesso» (`salvataggio.js` ~riga 278).
- **Opzioni**: (a) **consigliata**: in modalità `sostituisci`, prima di scrivere, rimuovere tutti i `DOCUMENTI` tranne quelli del file (lasciando `partita*`/`ripresa` fuori dall'elenco come ora); (b) cambiare il testo di conferma per dire che restano i dati non presenti nel file; (c) niente, accettando che dopo un ripristino da file vecchio compaiano record misti.

### D3 — Bassa — Dati già salvati in modo guasto continuano a mostrare «NaN» / «undefined» in Statistiche
- **Dove**: Statistiche; riguarda solo chi ha già in localStorage valori non numerici (per esempio da un import fatto con una versione precedente alla 1.21.8: la correzione C2 agisce solo all'importazione).
- **Riproduzione**: `collaudo/azzera-guasti.mjs`, ultima sezione: seed con `records.best:'x'`, `statistiche.partite:'a'`, un giorno sfida `{best:'99', regole:null}`.
- **Atteso**: nessun «NaN»/«undefined». **Ottenuto**: «Record della Partita libera NaN», «Punteggio medio NaN», «Partite giocate a», «Mossa record -5», «10 ott 99 (undefined)».
- **Prova**: `uscite/azzera-guasti.txt`, `uscite/stat-guasta.png`.
- **Ipotesi**: `Statistiche.jsx:22`, `:30` e `:50` mostrano il dato letto da `leggiDocumento`, che non valida i tipi (`documenti.js`, `leggiDocumento`). Quanti utenti reali siano in questo stato: **non posso confermarlo** (serve un file modificato a mano e importato con la 1.21.7 o precedente).
- **Opzioni**: (a) **consigliata**: ripulire in lettura (`numeroBuono`) i documenti di record, statistiche e sfide, come già fa l'importazione; (b) nessuna azione, dato il caso raro; (c) pulsante «Azzera» come unica via (già disponibile).

## Informativi

- **I1**: la home scorre di 35 px a 360x600 e di 66 px a 320x568 (`c1-home.txt`, `scroll:["pl-screen pl-home:…"]`). Il CHANGELOG promette l'assenza di scorrimento solo da 360x640 a 380x680, quindi non è una regressione; lo scorrimento resta interno alla schermata, nessuna sovrapposizione misurata.
- **I2**: l'elenco di «Che cosa sparisce» in «Azzera i miei dati» mostra «Record 500» (solo libera) e non cita il record della Sfida (`azzera-guasti.txt`). Il dato viene comunque cancellato (verificato). Cosmetico.
- **I3**: in Statistiche le righe Catena/Mossa/Intreccio mostrano solo la Partita libera; quelle della Sfida vengono salvate (`records-sfida.bestChain` ecc.) ma non si vedono mai. Può essere voluto: **non posso confermarlo**.

## Non verificato

- Il pacchetto Android non è stato costruito né installato: `sticky-immersive` è verificato solo nel file; che la libreria TWA accetti quel valore **non posso confermarlo** (libreria non presente nel repo/container).
- Installazione PWA, funzionamento offline del service worker, sicurezza CSP (`npm run e2e-sicurezza`) e gli altri controlli del gate non sono stati rieseguiti (esclusi per tempo/consegna).
- Solo Chromium su Linux, nessun telefono reale, nessun Safari/Firefox; tocco e Indietro di sistema Android simulati con `history.back`.
- Importazione provata con il campo file (`setInputFiles`) e non con il tasto «Copia/incolla».
- I cento livelli non sono stati rigiocati. PO-008 (perdita livello con Indietro / oltre 2 ore) escluso come richiesto.
- Cambio di giorno (mezzanotte) e fuso orario non provati.

## Commit
Ramo `collaudo-1.21.8` (da `main` @ `a14a25b`). Hash dell'ultimo commit al momento della stesura: vedi `git log` sul ramo; l'hash finale è riportato nella risposta di consegna.
