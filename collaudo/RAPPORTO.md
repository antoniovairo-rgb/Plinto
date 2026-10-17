# Rapporto di collaudo — PLINTO 1.21.6 (produzione)

Data: 15 ottobre 2026. Commit collaudato: `916ae22` (`main`). Ambiente: container Linux, Chromium 1194 (Playwright 1.63), Node 22. Nessun file di `src/`, `public/`, `android/`, `tools/`, `tests/` è stato modificato.

## 1. Sintesi

- **Bug trovati e riprodotti: 11** → bloccanti **0**, alti **0**, medi **3**, bassi **8** (B11 è solo da lettura del codice). Più un'anomalia del gate (sezione 2) non confermata dalla CI.
- Nessuna eccezione JavaScript, nessuna schermata vuota, nessun errore di console (a parte un avviso del browser sull'`AudioContext`) in tutti i percorsi provati.
- Il sito pubblicato serve lo stesso bundle del `main` locale (`assets/index-BVW6mWdX.js`, stesso hash della mia build). Il collaudo interattivo l'ho fatto sul build locale; sul sito pubblicato ho solo ripetuto il primo avvio/guida a 4 formati × 2 lingue, senza errori di console.
- I tre più importanti:
  1. **B1 (media)** — dopo aver importato un salvataggio dalle Impostazioni, la home continua a mostrare i dati vecchi (`LIVELLO 1`, `0 di 100`, nessun Record) finché non si ricarica la pagina.
  2. **B5 (media)** — un `pointercancel` durante il trascinamento (gesto di sistema, bordo schermo) **appoggia comunque il pezzo**: mossa involontaria.
  3. **B4 (media)** — «Riprendi la sfida» il giorno dopo avvia una sfida **nuova** (altra griglia) e butta via in silenzio la partita lasciata a metà.

## 2. Esito del gate `npm run verifica` (4589 s, eseguito in locale)

| # | Controllo | Esito | Tempo |
|---|---|---|---|
| 1 | il server di prova serve questa versione | ✓ | 1 s |
| 2 | test unitari | ✓ | 47 s |
| 3 | contrasti WCAG | ✓ | 0 s |
| 4 | build di produzione | ✓ | 3 s |
| 5 | comunicazioni (ogni schermata, ogni lingua) | ✓ | 19 s |
| 6 | partita completa nel browser | ✓ | 27 s |
| 7 | livelli nel browser (vittoria e sconfitta) | **✗** | 21 s |
| 8 | fine del percorso: festa finale e atti chiusi | **✗** | 35 s |
| 9 | ripresa dopo l'interruzione | ✓ | 20 s |
| 10 | salvataggio: esce, rientra, non cancella niente | ✓ | 22 s |
| 11 | politica di sicurezza attiva | ✓ | 31 s |
| 12 | attrezzi del cantiere | ✓ | 59 s |
| 13 | scenografie della mossa | ✓ | 21 s |
| 14 | guida al primo avvio | ✓ | 16 s |
| 15 | rimetti a posto il pezzo | ✓ | 10 s |
| 16 | frasi di incitamento | ✓ | 54 s |
| 17 | archivio delle sfide | ✓ | 11 s |
| 18 | scheda condivisibile e ripiego sugli appunti | ✓ | 11 s |
| 19 | Play Store: invito a recensire e Scarica | **✗** | 39 s |
| 20 | anteprima della terna | ✓ | 43 s |
| 21 | tasto Indietro di Android | ✓ | 13 s |
| 22 | la home entra nello schermo | **✗** | 74 s |
| 23 | geometria della plancia e dei tocchi | ✓ | 12 s |
| 24 | tutti e cento i livelli giocati nell'app | ✓ | 3585 s |
| 25 | precisione del trascinamento | ✓ | 246 s |
| 26 | build servita da una sottocartella | ✓ | 6 s |
| 27 | installabile, senza rete e aggiornabile | ✓ | 38 s |
| 28 | aspetto su schermi grandi | ✓ | 49 s |
| 29 | resistenza: memoria e fluidità | ✓ | 76 s |

Log completo: `collaudo/prove/verifica-gate.log`.

**I 4 rossi sono tutti scostamenti di pochi pixel di impaginazione:**

| Controllo | Messaggio |
|---|---|
| e2e-quadri | fine livello (vittoria): a 320x700 si scorre di 2 px; a 1366x768 di 6 px |
| e2e-trionfo | fine livello con atto chiuso: a 320x700 si scorre di 1 px |
| recensione | 360x640: l'invito finisce 10 px sotto la barra dei pulsanti; con «Scarica l'app» la home scorre di 2 px |
| impaginazione | Android di base 360x640: la home scorre di 2 px |

- Li ho **rieseguiti a macchina scarica**, sia sul server di sviluppo sia sulla build di produzione: **si ripetono identici**, quindi non dipendono dal carico (durante il gate ho girato altre prove in parallelo, il che ha allungato il controllo dei cento livelli).
- **La CI di GitHub sullo stesso commit (workflow `verifica`, run 132) è `success`** e CLAUDE.md dice che conta quella. Ipotesi (non verificata): le differenze dipendono dal font. Lo stack in `src/styles/tokens.css:93` è `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` e qui `fc-match sans-serif` risolve su **Inter**, diverso dal runner CI e da Roboto di Android. Se sul telefono reale 360x640 la home scorra di qualche pixel: **non verificato**.

## 3. Bug

Percorsi relativi alla radice del repo. Gli script sono in `collaudo/`, le prove in `collaudo/prove/`.

| ID | Gravità | Dove | Passi per riprodurre | Atteso vs ottenuto | Prova | Causa probabile |
|---|---|---|---|---|---|---|
| B1 | media | Impostazioni → importa salvataggio → home | `node collaudo/importa.mjs`: profilo vuoto → Impostazioni → scegli file con 12 livelli e Record 4321 → «Unisci» → freccia indietro | Atteso: home aggiornata. Ottenuto: `LIVELLO 1 \| 0 di 100`, nessun Record; dopo ricarica `LIVELLO 13 \| 12 di 100 \| Record 4.321`. Con i dati vecchi il pulsante grande apre il livello 1 invece del 13 | output dello script; `prove/importa-2-home-dopo.png` | `src/ui/App.jsx:554`: Impostazioni torna con `setSchermata('home')` e non con `tornaAllaHome` (che rilegge le variabili, `App.jsx:200-211`); `quadriFatti` (`:89`), `statistiche` (`:69`), `sfidaOggi` (`:88`) e `record` di `usePartita.js:29` restano quelli di prima. Con «Sostituisci tutto» anche le impostazioni importate non si applicano finché non si ricarica |
| B2 | bassa | Impostazioni → «Azzera i miei dati» → home | `node collaudo/azzera.mjs` | Atteso: Record sparito. Ottenuto: dopo l'azzeramento (localStorage vuoto) la home mostra ancora `Record 4.321`; le Statistiche invece sono azzerate | output dello script | `azzeraDati` (`App.jsx:214`) non riporta a zero `record` di `usePartita` (`usePartita.js:29`) |
| B3 | bassa | Home lasciata aperta oltre la mezzanotte | `node collaudo/sfida-mezzanotte.mjs Europe/Rome 2026-10-15T23:58:30+02:00` | Atteso: «Sfida del giorno / Da giocare» dopo mezzanotte. Ottenuto: resta `Record 395` (di ieri) senza ricaricare | output (`CARD senza ricaricare (giorno 16): ... Record 395`) | `sfidaOggi` calcolato una volta in `App.jsx:88`; si rilegge solo in `tornaAllaHome` |
| B4 | media | «Riprendi la sfida» il giorno dopo | `node collaudo/sfida-notte.mjs`: sfida del 15 con 4 mosse → home → il 16 → tocca la card | Atteso: riprendere la partita (o avvisare). Ottenuto: la card dice «Riprendi la sfida», ma parte una sfida nuova del 16 (`PUNTEGGIO 0`, `mosse 0`) e la partita di ieri (punteggio 14) è persa senza avviso. Vale anche aprendo un altro giorno dall'archivio | output dello script | `App.jsx:140-146`: `if (salvata) abbandona()` se `seedLabel !== giorno`; l'etichetta (`Home.jsx:41`) dipende solo da `sfidaInCorso` |
| B5 | media | Trascinamento col dito | `node collaudo/cancel-tocco.mjs`: tocco su un pezzo, trascina sulla griglia, `touchCancel` | Atteso: gesto annullato = nessuna mossa. Ottenuto: `caselle piene prima=0 dopo=6`, pezzi in mano 3→2, punteggio 0→6 | output dello script | `src/ui/useTrascinamento.js:150`: `pointercancel` è collegato allo stesso gestore di `pointerup` (`rilascia`, `:137`) che chiama `onPosiziona`. Da verificare su telefono se i gesti di sistema (swipe di bordo, palmo) generino davvero `pointercancel` sul pezzo |
| B6 | bassa | Tasto Indietro dopo una ricarica | `node collaudo/indietro.mjs`: livello 1 → ricarica (ripresa) → Indietro ripetuto | Atteso: mappa › home › uscita. Ottenuto dopo ricarica: `mappa > home > home > home > uscito`, cioè due Indietro «a vuoto» per ogni ricarica a metà livello (uno per la partita libera) | output dello script | `src/ui/useTastoIndietro.js`: `messe` riparte da 0 a ogni montaggio ma le voci di cronologia di prima restano e l'effetto ne aggiunge altre. In una TWA ripartita da zero la cronologia è nuova: impatto sul telefono **non verificato** |
| B7 | bassa | Home, voce «Partita libera» | `node collaudo/record-condiviso.mjs`: gioca solo una Sfida → home | Atteso: «Partita libera / Mai giocata». Ottenuto: «Partita libera / Record 395» (punteggio della Sfida) | output dello script | Record condiviso fra libera e sfida (`src/persistence/storage.js`, `chiaveRecord`) ma mostrato come record della sola partita libera (`Home.jsx:40`; il commento in `Home.jsx` dice «è il suo») |
| B8 | bassa | Barra dell'obiettivo in partita, livelli con due obiettivi | `node collaudo/obiettivi-tagliati.mjs`. Es. livello 100 a 360x640: `Arriva a Catena 3 + Fai 450 p...` | Atteso: frase intera. Ottenuto: troncata con «…» (la schermata di apertura la mostra intera). Almeno 11 livelli a 360 px (44, 48, 52, 56, 66, 70, 74, 80, 88, 92, 100 in IT/EN), 3-4 a 390 px | `prove/livello-s360-it-100-gioco.png`; elenco in `prove/obiettivi-tagliati.txt` | `src/styles/app.css:1974`, `.pl-obiettivo__frase`. Lo script ha dato anche falsi «home senza pulsante primario» (ripresa automatica del mio harness): scartati, quindi l'elenco può essere incompleto |
| B9 | bassa | Importazione: file con busta valida e contenuto strano | `node collaudo/import-fuzz.mjs` (15 casi × «Unisci» e «Sostituisci») | Atteso: file rifiutato o campi ripuliti. Ottenuto: `records.best:"abc"` → Record in partita `NaN`; `statistiche.punteggioTotale:"x"` → «Punteggio medio NaN»; `sfide` con date finte o array → «Invalid Date», «NaN (undefined)» nelle Statistiche. Nessun crash. Serve un file modificato a mano con impronta ricalcolata: un file solo corrotto lo ferma l'impronta | output dello script | `leggiSalvataggio` (`salvataggio.js`) valida solo la busta; `applicaSalvataggio` scrive i documenti così come sono o con `fondiNumeri` (`:140`) |
| B10 | bassa | Home: «Sostieni il progetto» e «Idee e segnalazioni» | `node collaudo/a11y.mjs` a 360x640 | Atteso: bersaglio ≥ 24×24 (WCAG 2.2 AA, 2.5.8; meglio 44). Ottenuto: 134×15 e 136×15 px | output dello script | `src/styles/app.css:856-880` |
| B11 | bassa (da codice) | Importa salvataggio → gettoni degli attrezzi | **Non riprodotto nell'interfaccia.** Dalla lettura: esporta con 3 gettoni, spendili, reimporta il file con «Unisci» | Atteso: «mai la somma» (commento in `salvataggio.js`). Previsto: `fondiNumeri` tiene il valore più alto, quindi i gettoni spesi tornano | lettura di `salvataggio.js:140-160` | Il documento `attrezzi` si fonde come numeri comuni. Non verificato |

Altro, senza numero:

- Console: `The AudioContext was not allowed to start...` (avviso del browser, comparso nei test del service worker). Informativo.
- `tipoDiGiorno` (`src/core/sfida.js`) dà «oggi» prima di controllare la «preistoria»: con l'orologio del dispositivo al 5 settembre 2026 la sfida di quel giorno è giocabile. Irrilevante senza manomettere l'orologio.

## 4. Verificato senza trovare problemi

- Primo avvio e guida (6 passi) a 360x640, 390x844, 412x915 e 1280x800, IT/EN, locale e **sito pubblicato**: nessun overflow né errore (`primo-avvio.mjs`).
- Tutte le schermate raggiungibili dalla home (home, mappa, partita libera, sfida, archivio, aiuto, statistiche, profilo, impostazioni, info, sostieni) a 4 formati × 2 lingue (`layout.mjs`): nessuno scorrimento orizzontale, nessun testo tagliato reale (solo elementi `.pl-sr` per lettori di schermo), nessun errore.
- Partita libera da 400 mosse (tocco-tocco e trascinamento alternati, ricarica ogni 25 mosse): punteggio e griglia coincidono con il salvataggio, la ricarica riporta lo stesso stato (`partita.mjs`). Partita fino alla fine: schermata di fine, record e statistiche scritti, nessuna ripresa residua.
- Trascinamento con eventi touch veri (360x640 e 412x915): piazzamento esatto con il sollevamento di 1,35 caselle; rilascio fuori dalla griglia non fa nulla (`tocco.mjs`).
- Fine livello, fine atto (livello 10), sconfitta e festa finale a 360x640, IT/EN: nessun overflow (`fine-livello.mjs`).
- Apertura dei livelli 1, 2, 11, 21, 41, 61, 81, 100 a 360 e 412 px, IT/EN (`livelli-vista.mjs`): ok, tranne B8.
- Archivio: 7 casi di data (primo giorno, 29 febbraio 2028, fine anno a Los Angeles, UTC+14, UTC−11, ora legale): calendario e giorni abilitati coerenti (`archivio-date.mjs`). Cambio di giorno a mezzanotte: il seme della partita nuova è del giorno nuovo, il risultato finisce nel giorno giusto.
- Service worker: dopo il primo caricamento il gioco si apre offline (anche con query e ancora `#/sfida/...`); pubblicando una 1.21.7 sullo stesso indirizzo, dopo il ricaricamento passa a `v1.21.7` e la cache vecchia sparisce (`sw.mjs`).
- «Recensisci» e «Scarica l'app»: compaiono solo con `?origine=play` / UA Android, in modo persistente; link verso `play.google.com`, `target=_blank rel="noopener noreferrer"` (`play.mjs`).
- Importazione: file valido, impronta sbagliata, formato ignoto, versione futura, `__proto__`: nessun crash (B9 a parte).
- Accessibilità: `lang` del documento segue la lingua; nessun pulsante senza nome; focus visibile (outline 2 px) su tutti gli elementi raggiunti con Tab.
- Il sito pubblicato: nessuna violazione di CSP né errore di console nella guida.

## 5. Non verificato

- **Telefono reale e TWA**: font reale di Android (Roboto), gesti di sistema (B5), cronologia dopo il riavvio della TWA (B6), `display-mode: standalone` nella TWA, vibrazione, audio reale.
- **«Recensisci» nell'app pubblicata**: in `android/` non compare nessun `origine` (ricerca vuota): il parametro `?origine=play` non è nel pacchetto attuale e il segnale dipende dal referrer `android-app://`, che il CHANGELOG 1.21.2 dà come non garantito. Se non arriva, l'invito non compare mai nell'app. Non verificabile da qui.
- Le 4 anomalie di impaginazione del gate sul telefono reale (sezione 2).
- Prove interattive sul sito pubblicato oltre il primo avvio (partite, livelli, importazione, service worker): fatte sul build locale, che ha lo stesso bundle.
- Riduzione del movimento, condivisione reale (`navigator.share`), Safari/iOS, Firefox. Tema chiaro/scuro: le Impostazioni non lo offrono.
- Cambio d'ora legale dentro una partita in corso (provato solo il calendario).
- I livelli 5 e 100 non li ho vinti io (il mio risolutore non ha trovato la sequenza); l'ultimo livello è coperto dal gate (controllo 24).

## 6. Script e prove

Tutti in `collaudo/` (`lib.mjs` e `gioco.mjs` sono le utilità). Screenshot in `collaudo/prove/`, log del gate in `collaudo/prove/verifica-gate.log`. Per rieseguire: `npm run build`, `npm run preview -- --port 4180`, poi `node collaudo/<script>.mjs`.
