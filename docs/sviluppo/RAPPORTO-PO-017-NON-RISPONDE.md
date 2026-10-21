# Rapporto PO-017 — «Unresponsive app» (rifiuto della 11907, 21 ottobre 2026)

Figlia `po017-non-risponde`. **Solo misura: nessuna correzione**, nessun cambio di versione.
Misure del 21 ottobre 2026 su tre siti:

| etichetta | che cosa | versione |
|---|---|---|
| **pubblicato** | `https://antoniovairo-rgb.github.io/Plinto/` (quello che la TWA carica oggi) | 1.21.23 |
| **locale** | `npm run build` di questo ramo servito con `vite preview` | 1.21.23 |
| **v1.21.17** | build del commit `12cd5b1` (quello da cui è stato generato l'AAB 11907, `docs/DECISIONI.md`) | 1.21.17 |
| **v1.19.1** | build del commit `a17118e` (sito dell'epoca della 11901, approvata) | 1.19.1 |

**Attenzione al confronto (punto 5 della richiesta).** La revisione di Google era sul *pacchetto*
11907, ma il pacchetto non contiene il gioco: apre il sito pubblicato
(`android/app/src/main/res/values/strings.xml`, `urlAvvio`). Quindi il revisore ha visto **il sito
del giorno della revisione** (fra il 20 e il 21 ottobre: una 1.21.1x–1.21.2x; quale esattamente,
non posso confermarlo), non la 1.21.17. La build della 1.21.17 qui serve solo a dire se i fatti
trovati c'erano già allora: per quelli misurati, sì.

## In breve

1. **E1 — In orizzontale, con l'altezza fino a 620 px, la griglia sparisce.** Nella partita libera e
   nella sfida la griglia è di **28×28 px**; in un livello le caselle sono **0×0 px**. Il gioco si
   apre, i pezzi si vedono, i pulsanti rispondono, ma non si può giocare: un revisore che trascina un
   pezzo «e non succede niente» descriverebbe esattamente «the app freezes / is unresponsive».
   Vale su sito pubblicato, 1.21.17 e anche 1.19.1. Formati colpiti: 640×360, 740×360, 800×360,
   851×393, 915×412, 960×600, **1024×600**, 1280×620. Non colpiti: tutti i verticali, 1280×800,
   800×1280. Schermate: `po017-non-risponde/01…05`.
   **Ipotesi (non verificabile da qui):** che il revisore abbia visto il gioco in orizzontale. Il
   pacchetto chiede il verticale (`AndroidManifest.xml:66-68`), ma Android 16 per le app che
   puntano all'API 36 **ignora l'orientamento sugli schermi con larghezza minima ≥ 600 dp**
   (fonte: developer.android.com, «Behavior changes: Apps targeting Android 16», sezione
   «orientation, resizability, and aspect ratio restrictions»; eccezione: app con
   `android:appCategory="game"`, che il manifest non dichiara). Un tablet da 1024×600 (7")
   in orizzontale cade proprio nella fascia rotta. Chi apra davvero la finestra del gioco (è
   un'Activity di Chrome, non di questa app) e quale `targetSdk` conti in quel caso, **non posso
   confermarlo**.
2. Su **tutti i formati verticali** (320×640 … 412×915), tablet (800×1280, 1280×800), zoom testo
   130%, in **italiano e inglese**: ogni schermata raggiungibile si percorre col dito, **ogni
   contenitore che scorre arriva in fondo**, **nessun elemento coperto** da veli o elementi
   trasparenti, tutti i tocchi del percorso producono una reazione. Nessun fatto che spieghi
   «scrolling doesn't work».
3. **Thread principale**: nessun long task oltre **224 ms** (CPU 6×, 1.21.17) e nessuno oltre
   200 ms sulla 1.21.23; niente che si avvicini ai 5 s di un ANR. Avvio a freddo con CPU 6×:
   0,52–0,99 s. Senza rete, dopo il primo avvio, il gioco si riapre (service worker) e si gioca.
4. Con **caratteri al 200%** (simulazione) il pannello degli attrezzi supera lo schermo e il suo
   pulsante «Torna alla partita» non si raggiunge (D1); si esce toccando la striscia ai lati.
5. Android: senza un browser che supporti la TWA il gioco si apre in una **Custom Tab** (con barra
   dell'indirizzo, senza schermo intero); senza nessun browser compare la finestra «App non
   disponibile» e l'app si chiude. Nessun ripiego WebView configurato.

## Come si è misurato

Script in `docs/sviluppo/po017-non-risponde/` (fuori dal gate, autonomi, Chromium di
`/opt/pw-browsers`):

- `misura.mjs` — il percorso del revisore. Contesto Playwright **pulito** a ogni formato
  (`hasTouch: true`, `isMobile: true`, `deviceScaleFactor` 2–3,9, user agent Android), URL
  `?origine=play` come la TWA. Gesti **col dito**: scorrimenti e trascinamenti con CDP
  `Input.dispatchTouchEvent`, tocchi con `page.touchscreen.tap` (mai rotellina né clic).
  Su ogni schermata: contenitori che scorrono (documento ed elementi `overflow: auto|scroll`);
  per ognuno, scorrimenti col dito prima verso l'alto e poi verso il basso finché la posizione
  si ferma (al massimo 80); a ogni passo, per ogni elemento toccabile (`button`, `a[href]`,
  `[role=button]`, `[role=switch]`, ecc.) si controlla con `elementFromPoint` al centro se è
  toccabile; «mai toccabile» = mai, in tutto lo scorrimento. Se c'è un velo (`.pl-velo` o
  `[aria-modal]`), contano solo gli elementi del velo in cima. Il punto di partenza dello
  scorrimento si sceglie fuori da elementi con `touch-action` che vieta il `pan-y`, e lo script
  segnala se non ne trova (non è mai successo). Reazione al tocco = prima modifica del DOM
  (MutationObserver) entro 1,5 s.
- `avvio-cpu.mjs` — avvio a freddo, otto transizioni e ricarica con CPU 1×, 4×, 6×
  (`Emulation.setCPUThrottlingRate`), long task (`PerformanceObserver`), poi `setOffline(true)`
  e ricarica.
- `latenza-mappa.mjs` — tempo fra tocco e reazione su mappa/livello con 0 e 99 livelli superati.
- `griglia-orizzontale.mjs` — dimensioni di griglia, area e pezzi nella partita libera su 14 formati.

Simulazioni dichiarate: **«testo130/200»** moltiplica tutte le `font-size` dei fogli di stile
(simula lo zoom del solo testo); **«zoom130/200»** riduce la finestra CSS a parità di schermo
fisico (360×800 → 277×615 e 180×400, simula lo zoom di pagina). Come Chrome in una TWA applichi
la dimensione dei caratteri di Android **non posso confermarlo**: per questo le due varianti.

Percorso (in ogni formato): guida al primo avvio passo per passo (6 passi, «Avanti» fino a
«Inizia») e i suoi due modi di saltarla («Salta per ora», «Non mostrarmela più»); home; partita
libera (un pezzo trascinato col dito, menu, «Torna alla partita», ultima voce del menu e la sua
domanda); sfida del giorno (un pezzo trascinato, tasto Indietro di sistema); mappa; apertura del
livello 1; livello 1 (pannello attrezzi, menu) giocato fino alla vittoria con 14 trascinamenti;
fine livello; archivio; come si gioca; statistiche; profilo; impostazioni (primo passo
dell'azzeramento); informazioni → sostieni; sostieni; fine partita libera e condivisione; fine del
primo atto **con l'invito a recensire** (`?origine=play`); mappa completa e festa finale; tasto
Indietro dalla home su una scheda nuova.

## Tabella schermata × formato (build locale = sito pubblicato, lingua it)

Legenda: **fermo** = il contenuto sta nello schermo, non serve scorrere; **S→fondo** = scorre e
col dito si arriva in fondo; **✗n** = n elementi toccabili mai raggiungibili; **↔n** = la pagina
sporge in orizzontale di n px; **n.m.** = non misurata (il percorso si è fermato prima: in
orizzontale per E1). In tutte le celle senza ✗ **ogni pulsante usato ha risposto al tocco**.

| schermata | 320x640 | 360x640 | 360x800 | 412x915 | 640x360 | 800x360 | 915x412 | 800x1280 | 1280x800 | 360x800 testo130 | 360x800 testo200 | 412x915 testo200 | 360x800 zoom130 | 360x800 zoom200 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| guida-1 | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo ↔52 | S→fondo | S→fondo | S→fondo ✗1 ↔91 |
| guida-2 | fermo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | S→fondo ↔52 | S→fondo | S→fondo | S→fondo ✗2 ↔91 |
| guida-3 | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | S→fondo ↔52 | S→fondo | S→fondo | S→fondo ✗2 ↔91 |
| guida-4 | S→fondo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | S→fondo ↔52 | S→fondo | S→fondo | S→fondo ✗2 ↔91 |
| guida-5 | fermo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | S→fondo ↔52 | S→fondo | fermo | S→fondo ✗2 ↔91 |
| guida-6 | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo ↔28 | S→fondo | S→fondo | S→fondo ↔79 |
| home | fermo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | S→fondo |
| partita libera | fermo | fermo | fermo | fermo | **griglia 28 px** | **griglia 28 px** | **griglia 28 px** | fermo | fermo | fermo | fermo | fermo | fermo | fermo ↔26 |
| menu della partita | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo ↔26 |
| home con partita in corso | fermo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo |
| sfida del giorno | fermo | fermo | fermo | fermo | **griglia 28 px** | **griglia 28 px** | **griglia 28 px** | fermo | fermo | fermo | fermo | fermo | fermo | fermo ↔26 |
| mappa | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo |
| apertura livello | S→fondo | S→fondo | S→fondo | fermo | S→fondo | S→fondo | S→fondo | fermo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo |
| livello | fermo | fermo | fermo | fermo | **caselle 0×0** | **caselle 0×0** | **caselle 0×0** | fermo | fermo | fermo | fermo ↔35 | fermo | fermo | n.m. |
| pannello attrezzi | fermo | fermo | fermo | fermo | n.m. | n.m. | n.m. | fermo | fermo | fermo | fermo ✗1 ↔35 | fermo ✗1 | fermo | n.m. |
| menu del livello | fermo | fermo | fermo | fermo | n.m. | n.m. | n.m. | fermo | fermo | fermo | fermo ↔35 | fermo | fermo | n.m. |
| fine livello | S→fondo | S→fondo | fermo | fermo | n.m. | n.m. | n.m. | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | n.m. |
| archivio | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | S→fondo ✗7 |
| come si gioca | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo |
| statistiche | fermo | fermo | fermo | fermo | S→fondo | S→fondo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | S→fondo |
| profilo | fermo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | fermo | fermo | fermo | S→fondo |
| impostazioni | S→fondo | S→fondo | S→fondo | fermo | S→fondo | S→fondo | S→fondo | fermo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo ↔12 |
| impostazioni, azzera (passo 1) | S→fondo | S→fondo | S→fondo | fermo | S→fondo | S→fondo | S→fondo | fermo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo ↔12 |
| informazioni | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo |
| sostieni (da informazioni e da home) | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | fermo | S→fondo |
| fine partita libera + condividi | S→fondo | S→fondo | fermo | fermo | S→fondo | S→fondo | S→fondo | fermo | fermo | fermo | S→fondo | S→fondo | S→fondo | S→fondo |
| fine atto con «Recensisci» | S→fondo | S→fondo | fermo | fermo | n.m. | n.m. | n.m. | fermo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | n.m. |
| mappa completa | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo |
| festa finale | S→fondo | S→fondo | fermo | fermo | n.m. | n.m. | n.m. | fermo | S→fondo | S→fondo | S→fondo | S→fondo | S→fondo | n.m. |

- **Inglese**: 320×640, 360×640, 360×800, 412×915, 640×360, 800×360, 915×412 misurati anche in
  `en`: stesse celle dell'italiano (nessuna ✗, nessuno sporgere orizzontale), stessi 4 arresti in
  orizzontale.
- **Sito pubblicato** (360×640, 360×800, 412×915, 640×360, 800×1280, 1280×800, 360×800 testo200,
  it): stesse celle della build locale.
- **1.21.17** (360×800 e 640×360, it): stesse celle della 1.21.23; a 640×360 gli stessi 4
  arresti per la griglia di 28 px (`griglia-orizzontale.mjs` lo conferma su tutti i formati).
- Nella guida in verticale «Salta per ora» e «Non mostrarmela più» portano alla home su tutti i
  formati; tasto Indietro di sistema dalla sfida → home; dalla home appena aperta su scheda nuova
  → esce (`about:blank`), cioè non trattiene l'utente.

### Griglia nella partita libera (`griglia-orizzontale.mjs`, px CSS)

| formato | 1.19.1 | 1.21.17 | pubblicato 1.21.23 |
|---|---|---|---|
| 320×640, 360×640, 360×800, 412×915 | 317, 356, 356, 408 | uguale | uguale |
| 800×1280 | 583 | 426 | 426 |
| 1280×800 | 428 | 426 | 426 |
| 640×360 | **28** | **28** | **28** |
| 740×360, 800×360, 851×393, 915×412 | **28** | **28** | **28** |
| 960×600, 1024×600, 1280×620 | **28** | **28** | **28** |
| zoom 200% (180×400) | n.m. | n.m. | 104 (locale) |

## Thread principale, avvio, rete

`avvio-cpu.mjs`, 360×640 e 640×360, ms (massimo dei long task fra parentesi):

| sito | CPU | avvio a freddo | transizione più lenta | ricarica | senza rete |
|---|---|---|---|---|---|
| pubblicato | 1× | 578 (71) | 117 | 113 | home in 70 ms, partita si apre |
| pubblicato | 4× | 729 (118) | 188 | 270 | 198 ms, partita si apre |
| pubblicato | 6× | 990 (176) | 280 | 419 | 334 ms, partita si apre |
| locale | 6× | 546 (182) | 287 | 288 | 421 ms, partita si apre |
| locale 640×360 | 6× | 523 (200) | 349 | 416 | partita si apre (griglia 28 px) |
| v1.21.17 | 6× | 554 (224) | 329 | 449 | 384 ms, partita si apre |

- Nessun long task > 224 ms in nessuna prova; nessuna attesa vicina ai 5 s di un ANR. L'avvio
  del pubblicato include la rete vera (GitHub Pages) da questo contenitore.
- Il service worker è «pronto» e controlla la pagina alla prima ricarica in tutte le prove.
- `latenza-mappa.mjs` (360×800): tocco → prima reazione ≤ 192 ms e schermata pronta ≤ 243 ms
  con CPU 6×, sia con 0 sia con 99 livelli superati.
- **Rumore dello strumento, non del gioco** (scritto per non rileggerlo come difetto): nel
  percorso lungo, dopo il tocco su «Recensisci» (che apre una scheda nuova, `target="_blank"`,
  `src/ui/Recensisci.jsx:29`) i tocchi successivi reagivano in 0,9–1,5 s o «senza reazione»
  entro 1,5 s. Nella prova dedicata `latenza-mappa.mjs`, senza quella scheda in primo piano, le
  stesse transizioni reagiscono in ≤ 192 ms. Ipotesi: la pagina era in una scheda di sfondo e
  Chromium ne rallenta i timer. Anche la «durata degli eventi» (`PerformanceObserver` `event`) dava
  valori di decine di secondi senza senso in Chromium senza schermo: scartata.
- `pointercancel` durante i trascinamenti: compare solo quando il dito parte da uno slot vuoto
  dei pezzi (il browser avvia uno scorrimento); dai pezzi (`touch-action: none`,
  `src/styles/app.css:402`) mai. Nessun effetto sul gioco.

## Cose trovate

Classi: **E** = errore che blocca o rende inservibile; **D** = difetto con via d'uscita; **O** =
osservazione.

### E1 — Griglia di 28 px (caselle 0×0 nei livelli) in orizzontale fino a 620 px di altezza

- **Fatto misurato**: tabella sopra; schermate `po017-non-risponde/01-pubblicato-libera-640x360.png`,
  `02-pubblicato-libera-1024x600.png`, `03-locale-livello1-640x360.png`,
  `04-v1.19.1-libera-640x360.png`, `05-v1.21.17-libera-915x412.png`; verticale e 1280×800 per
  confronto in `06` e `07`. I pezzi si trascinano e (puntando con precisione al centro dei 28 px)
  si appoggiano anche: il gioco non è bloccato, è **ingiocabile**.
- **Dove nasce (misurato, non corretto)**: la regola
  `@media (orientation: landscape) and (max-height: 620px)` (`src/styles/app.css:1643-1671`)
  mette la schermata di gioco in una griglia a due colonne con `align-items: center`; l'area
  della griglia (`.pl-plancia-area`, `app.css:210`) prende allora l'altezza del contenuto
  (182×77 px misurati), e la griglia, che si misura in altezza (`height: min(100%, …)`,
  `app.css:256`), collassa. Iniettando in memoria solo
  `.pl-screen--gioco .pl-plancia-area { align-self: stretch }` la griglia passa da 28 a 123 px
  (640×360), 130 (915×412), 223 (1024×600): conferma il punto, ma da sola non basta. Sopra i
  720 px di larghezza e sotto i 720 di altezza l'app è anche chiusa in una colonna da 430 px
  (`app.css:1957-1962`), che a 800×360 lascia alla griglia una metà di 430 px.
- **Chi lo vede nell'app del Play Store** — ipotesi, da verificare su dispositivo:
  (a) tablet o pieghevoli con larghezza minima ≥ 600 dp tenuti in orizzontale, se Android 16
  ignora l'orientamento chiesto (vedi «In breve», punto 1); (b) Chromebook, finestra libera;
  (c) la Custom Tab di ripiego (punto 4 sotto), dove l'orientamento della TWA non si applica;
  (d) finestre divise/ridimensionate più larghe che alte. Sui telefoni in verticale non si vede.
- **Perché la 11901 è passata con lo stesso difetto**: non posso confermarlo (dispositivo del
  revisore diverso? controllo diverso?). Il fatto misurato è solo che il difetto c'era già.
- **Opzioni**:
  1. *(consigliata)* Correggere l'impaginazione orizzontale bassa: area della griglia che si
     allunga (`align-self: stretch`), catena e suggerimento che non le rubano altezza, e la
     colonna da 430 px che in orizzontale non si applica alla schermata di gioco; poi aggiungere
     al gate (`tests/e2e/schermi.mjs` o `impaginazione.mjs`) 640×360, 800×360, 915×412, 1024×600
     e 1280×620 con una soglia minima sulla griglia (per esempio il lato ≥ 85% dell'altezza
     disponibile), fatta fallire di proposito sul codice di oggi. Copre TWA, Custom Tab,
     Chromebook e browser.
  2. In orizzontale basso mostrare una schermata «Gira il telefono» al posto del gioco. Meno
     lavoro, ma su un Chromebook o un tablet bloccato in orizzontale il gioco resta inutilizzabile:
     un revisore potrebbe leggerlo di nuovo come «non risponde».
  3. Solo lato Android: dichiarare `android:appCategory="game"` (eccezione documentata di
     Android 16) e/o la proprietà `PROPERTY_COMPAT_ALLOW_RESTRICTED_RESIZABILITY`. Richiede un
     AAB nuovo, non copre Chromebook né Custom Tab, e se la finestra del gioco è di Chrome
     potrebbe non avere effetto (non posso confermarlo).

### D1 — Caratteri al 200%: «Torna alla partita» del pannello attrezzi irraggiungibile

- **Fatto** (schermata `po017-non-risponde/08-…`): 360×800 e 412×915 con testo ×2 (simulazione): il pannello (`.pl-attrezzi__pannello`)
  va da 24 a 1153 px su 915; né il pannello né il velo scorrono (`overflow-y: visible`). Toccando
  la striscia di velo ai lati il pannello si chiude (misurato), quindi c'è un'uscita, ma non è
  quella scritta. Al 130% e al 160% il pannello sta nello schermo (132–783, 71–844 px).
- **Opzioni**: 1. *(consigliata)* `max-height: 100%` e `overflow-y: auto` sul pannello (e sugli altri
  `.pl-velo` con contenuto lungo: menu, domande), con un caso «testo ×2» nel gate; 2. pulsante di
  chiusura fisso in cima al pannello; 3. lasciare com'è e scriverlo come limite noto.

### O1 — Caratteri al 200%: la pagina sporge in orizzontale

- 360×800 testo ×2: guida +52 px, livello +35 px. Si scorre di lato anche se il gioco non lo
  prevede. **Opzioni**: 1. *(consigliata)* individuare gli elementi a larghezza fissa e lasciarli
  andare a capo, con lo stesso caso nel gate di D1; 2. `overflow-x: hidden` sulla radice (nasconde
  invece di risolvere); 3. nessuna azione.

### O2 — Zoom di pagina 200% (finestra 180×400): guida e archivio con pulsanti mai toccabili

- Schermata `po017-non-risponde/09-…`. Guida: «Avanti» al passo 1, «Indietro» e «Salta per ora» ai passi 2–5 fuori schermo
  (sporgenza orizzontale +91 px); archivio: sette giorni mai toccabili. Il percorso dei livelli
  non si è completato in questa simulazione (n.m.). Formato estremo: se Chrome nella TWA lo
  produca davvero, **non posso confermarlo**. **Opzioni**: 1. *(consigliata)* tenerlo come caso
  limite da guardare solo se la verifica su telefono di D1/O1 mostra che Chrome nella TWA usa lo
  zoom di pagina; 2. aggiungerlo subito al gate; 3. nessuna azione.

### O3 — La home in orizzontale scorre

- 640×360: +163 px, 800×360: +271 px; col dito si arriva in fondo e ogni voce è toccabile. Non è
  un blocco; è coerente con il commento «la home non deve mai tagliare niente»
  (`app.css:777-799`). **Opzioni**: 1. *(consigliata)* nessuna azione finché E1 non è risolto; 2.
  impaginazione a due colonne in orizzontale; 3. ridurre i respiri anche in orizzontale.

### O4 — Lo strumento non sa dire niente su «sticky-immersive» e sui gesti di sistema

- **Ipotesi da verificare su telefono**: in `sticky-immersive` (`AndroidManifest.xml:76-78`)
  uno scorrimento che parte dal bordo dello schermo mostra prima le barre di sistema; con la
  navigazione a gesti, un trascinamento che parte dal bordo sinistro/destro diventa «Indietro».
  Il vassoio dei pezzi va da 0 a 360 px a 360×800 (misura `griglia-orizzontale.mjs`): i
  pezzi di sinistra e di destra stanno vicino ai bordi. Se il revisore ha trascinato un pezzo partendo dal
  bordo, potrebbe aver visto un gesto di sistema invece di un trascinamento. **Non posso
  confermarlo**: Chromium qui non ha barre né gesti di sistema. **Opzioni**: 1. *(consigliata)*
  prova su telefono vero, in schermo intero, con navigazione a gesti: trascinare il pezzo di
  sinistra e quello di destra partendo dal loro bordo esterno; 2. tornare a `DISPLAY_MODE`
  `default` per la prossima revisione (AAB nuovo) e vedere se il rifiuto cambia; 3. margine
  laterale al vassoio.

## Android: cosa succede se Chrome manca, è vecchio o disattivato

Fonti: il manifest (`android/app/src/main/AndroidManifest.xml`), `android/app/build.gradle`
(libreria `androidbrowserhelper` **2.7.3**, riga 68; `minSdk 24`, `targetSdk 36`, righe 33 e
36) e il codice della libreria. Non c'è `twa-manifest.json` (progetto scritto a mano). Ho letto
il sorgente del ramo `main` di `GoogleChrome/android-browser-helper` e **confermato sul
bytecode della 2.7.3** (AAR da `dl.google.com`, `javap`) le parti citate qui.

1. **Scelta del browser** (`TwaProviderPicker`): il primo browser che offre la TWA
   (`androidx.browser.trusted.category.TrustedWebActivities`) → TWA a schermo intero; se nessuno,
   il primo che offre le Custom Tabs → **Custom Tab**; se nessuno, il primo browser qualsiasi.
   Stringhe di log presenti nella 2.7.3: «Found TWA provider, finishing search», «Found no TWA
   providers, using first Custom Tabs provider», «Found no TWA providers, using first browser».
2. **Ripiego** (`LauncherActivity.getFallbackStrategy`, bytecode 2.7.3): il manifest non dichiara
   `android.support.customtabs.trusted.FALLBACK_STRATEGY` né `LAUNCHING_BROWSER`, quindi si usa
   `CCT_FALLBACK_STRATEGY`: Custom Tab con la barra dell'indirizzo, senza schermo intero né
   orientamento bloccato (quelle sono funzioni della TWA). **Nessun ripiego WebView**
   (`WEBVIEW_FALLBACK_STRATEGY` si usa solo con `FALLBACK_STRATEGY = webview`).
3. **Nessun browser per le Custom Tabs** (per esempio Chrome disattivato e nessun altro browser):
   `CCT_FALLBACK_STRATEGY` chiama `CustomTabsClient.getPackageName`; se è nullo mostra la finestra
   «App non disponibile» / «Questa app non è disponibile.» (stringhe `provider_unavailable_*`
   della 2.7.3, anche in italiano) e alla chiusura termina l'Activity. Il gioco non si apre.
4. **Chrome vecchio**: la TWA richiede un Chrome che la offra (un commento nel sorgente `main`
   di `TwaProviderPicker`, riga 296, cita Chrome 72-74 come primi con supporto; i commenti non
   sono nel bytecode, quindi questo dettaglio per la 2.7.3 non posso confermarlo); con uno più vecchio si ricade nel punto 1 (Custom Tab).
   Quale versione abbiano i dispositivi di Google, non posso confermarlo.
5. **Primo avvio di Chrome**: misura già fatta dal PO sull'emulatore (`docs/DECISIONI.md`, voce
   del 19 ottobre, Pixel 8, Android 17): Logcat `TWAProviderPicker Found TWA provider:
   com.android.chrome`, `TwaLauncher Launching Trusted Web Activity`, poi **Chrome mostra la sua
   prima configurazione**, e dopo «Use without an account» il gioco. Il revisore, da telefono
   nuovo, passa con buona probabilità da quella schermata di Chrome prima del gioco (ipotesi).
6. **Orientamento**: `SCREEN_ORIENTATION portrait` (`AndroidManifest.xml:66-68`) lo applica il
   browser alla TWA. Su schermi ≥ 600 dp con Android 16 vedi E1 (ipotesi).

## Cosa NON si può misurare da qui

- Un telefono o tablet Android vero, l'app installata dal Play Store, Chrome dentro una TWA: nel
  contenitore non ci sono SDK Android né emulatore. Tutto il gioco è stato misurato in Chromium
  con emulazione di telefono, non nella finestra di fiducia.
- I dispositivi e il percorso del revisore di Google (né dispositivo né schermata nel rifiuto;
  nessun report pre-lancio e nessun dato di Android vitals per la 11907, `docs/DECISIONI.md`).
- Barre di sistema, `sticky-immersive`, gesti di navigazione, rotazione vera, schermi pieghevoli,
  multi-finestra di Android, Chromebook.
- Come Chrome nella TWA applica la dimensione dei caratteri e lo zoom di Android (qui due
  simulazioni).
- Se Android 16 ignori l'orientamento della TWA sui tablet: dipende dall'Activity di Chrome.
- La versione esatta del sito al momento della revisione.

## Riprodurre

```bash
npm run build && npx vite preview --port 4173 --strictPort &   # spegnerlo dopo, per PID
PO017_OUT=/tmp/po017 PO017_FOTO=1 node docs/sviluppo/po017-non-risponde/misura.mjs http://localhost:4173/ locale "360x800,640x360" it
node docs/sviluppo/po017-non-risponde/griglia-orizzontale.mjs https://antoniovairo-rgb.github.io/Plinto/ pubblicato
node docs/sviluppo/po017-non-risponde/avvio-cpu.mjs https://antoniovairo-rgb.github.io/Plinto/ pubblicato
node docs/sviluppo/po017-non-risponde/latenza-mappa.mjs http://localhost:4173/ locale
```

Un percorso completo dura 4–11 minuti per formato. I JSON grezzi non sono versionati (si
rigenerano); i risultati delle prove di avvio sono in `po017-non-risponde/avvio-cpu-*.jsonl`. In
`avvio-cpu-360x640-tre-siti.jsonl` le righe 640×360 sono arresti della prima versione dello
script (toccava la voce della home senza farla scorrere in vista); la prova corretta in
orizzontale è `avvio-cpu-640x360-locale.jsonl`.
