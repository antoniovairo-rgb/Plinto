# Rapporto PO-035 — gioco in orizzontale, pacchetto «gioco», testo grande

Figlia `po035-orizzontale`, 22 ottobre 2026. Correzione del secondo rifiuto di Google Play
(PO-017, «Unresponsive app»), dalle decisioni del PO (E1, pacchetto «gioco») e della madre (D1,
O1) del 21 ottobre (`docs/DECISIONI.md`). **Nessun cambio di versione** (`package.json`,
`versionName`, `versionCode` intatti). Base: `main` a `d2deb21` (1.21.24).

## In breve

| | prima (1.21.24) | dopo | interruttore |
|---|---|---|---|
| **E1** griglia in orizzontale, 640×360 … 1280×620 | **28×28 px**, caselle 0 px | **348–608 px**, 97–98% dell'altezza | `GIOCO_IN_ORIZZONTALE` (`src/ui/SchermoGioco.jsx`) |
| E1 attrezzi in orizzontale | pastiglia nascosta (riga degli attrezzi `display: none`) | raggiungibile, pannello si apre e si chiude | stesso |
| **D1** testo ×2, pannello degli attrezzi | da 24 a 1431 px su 800 (360×800), «Torna alla partita» irraggiungibile | dentro il velo, scorre; «Torna alla partita» raggiungibile | `VELI_CHE_SCORRONO` (`src/ui/velo.js`) |
| **O1** testo ×2, sporgenza di lato a 360×800 | guida +25…+58 px, livello 13 +47 px | 0 px | `TESTO_GRANDE_VA_A_CAPO` (`src/main.jsx`) |
| Pacchetto Android | nessuna categoria | `android:appCategory="game"` | — (test in `tests/android.test.js`) |
| Verticale, tablet, 1280×800, PC | — | **impaginazione identica** in 70 scene su 14 formati (vedi «Confronto») | — |

## Come si è misurato

Strumenti nuovi in `docs/sviluppo/po035/` (fuori dal gate, autonomi, Chromium di `/opt/pw-browsers`):

- `misura.mjs` — per formato: partita libera (partita fissa da seme scritto in `localStorage`) e
  suo menu, sfida del giorno, livello 13 (obiettivo, «Prossimi tre pezzi», due gettoni) e pannello
  degli attrezzi. Animazioni spente. Salva schermata, geometria e una **firma** dell'impaginazione:
  il rettangolo di ogni elemento dentro `#root`.
- `confronta.mjs` — confronta le firme di due corse, scena per scena.
- `pixel.mjs` — differenza pixel per pixel fra due cartelle di schermate.

Corse: build di `main` (1.21.24) servita su `:4174` («prima»), build del ramo su `:4173` («dopo»),
entrambe `vite preview`, 22 formati (8 coricati bassi, 6 telefoni verticali, tablet e PC).

Simulazione «testo ×2»: la stessa del rapporto PO-017, ogni `font-size` dei fogli di stile per
due. Come Chrome dentro la TWA applichi la dimensione dei caratteri di Android **non posso
confermarlo**.

## E1 — In orizzontale si gioca

### Dove nasceva (misurato)

`@media (orientation: landscape) and (max-height: 620px)` (`src/styles/app.css`, regola che
resta per l'interruttore spento) metteva la schermata in due colonne con `align-items: center`:
l'area della griglia restava alta quanto il contenuto e la griglia, che si misura in altezza,
collassava a 28 px. In più: le regole del vassoio non lo raggiungevano (è dentro un involucro
senza classe), la riga degli attrezzi era `display: none` (**gli attrezzi erano irraggiungibili in
orizzontale**: «la pastiglia degli attrezzi non si raggiunge» sulla 1.21.24, tutti e 5 i formati),
e sopra i 720 px di larghezza l'app era chiusa nella colonna da 430 px.

### Disegno: opzioni

1. **(consigliata, fatta)** Griglia a sinistra alta quanto lo schermo; a destra, dall'alto:
   punteggio, menu e record; obiettivo (o nome della modalità); Catena; spazio libero; in fondo la
   riga di mensola / «Rimetti a posto il pezzo» / attrezzi e i tre pezzi (dove arriva il pollice);
   sotto, «Prossimi tre pezzi» se c'è. Nessun componente cambiato: area e tavolo diventano
   `display: contents`, gli elementi prendono un posto nella griglia della schermata.
2. Griglia al centro, punteggio e obiettivo a sinistra, pezzi a destra. Simmetrica, ma a 640×360
   lascia circa 130 px per lato: i tre pezzi andrebbero in colonna (posti alti meno di 90 px) e
   l'obiettivo su tre righe.
3. Catena e riga degli attrezzi sopra e sotto la griglia, solo pezzi e punteggio a destra (il
   suggerimento del rapporto PO-017). A 640×360 la griglia avrebbe al massimo 348 − 23 − 44 − 8
   = 273 px, il 76% dell'altezza (calcolato dalle misure, non provato a schermo).

### Misure (griglia, lato in px CSS; `misura.mjs`)

| formato | prima libera / livello 13 | dopo libera / livello 13 | % altezza | sporgenza dopo |
|---|---|---|---|---|
| 640×360 | 28 / 28 | 348 / 348 (casella 35,5) | 97% | 0 |
| 740×360 | 28 / 28 | 348 / 348 | 97% | 0 |
| 800×360 | 28 / 28 | 348 / 348 | 97% | 0 |
| 851×393 | 28 / 28 | 381 / 381 | 97% | 0 |
| 915×412 | 28 / 28 | 400 / 400 (casella 41,3) | 97% | 0 |
| 960×600 | 28 / 28 | 588 / 588 | 98% | 0 |
| 1024×600 | 28 / 28 | 588 / 588 (casella 62,2) | 98% | 0 |
| 1280×620 | 28 / 28 | 608 / 608 | 98% | 0 |

Messa a punto misurata: con i posti del vassoio a `24vh` la colonna di destra del livello 13 a
640×360 superava l'altezza (griglia 357 px, pagina che scorreva di 3 px; «Prossimi tre pezzi»
sporgeva di lato di 15 px). Adesso posti a `clamp(68px, 21vh, 124px)` (76 px a 360 di altezza,
più del doppio dei 44 raccomandati), righe a 2 px, «Prossimi tre pezzi» che va a capo.

### Controllo nel gate: `npm run e2e-schermi`, casi «orizzontale»

Cinque formati della decisione (640×360, 800×360, 915×412, 1024×600, 1280×620), tocco vero
(`hasTouch`, `isMobile`, densità 2). In partita libera, sfida e livello 13: griglia di lato
**≥ 85% dell'altezza della finestra**, quadrata, 81 caselle dentro lo schermo, ogni comando dentro
lo schermo, niente scorrimento; **un pezzo trascinato col dito** (eventi touch del protocollo) e
appoggiato su caselle vuote (il vassoio ne ha uno in meno). Poi menu, pannello degli attrezzi
(«Torna alla partita» raggiungibile e funzionante) e livello 1 giocato fino a «Livello superato!»
con i pulsanti della fine raggiungibili.

**Perché 85%**: il disegno scelto dà 97%; l'opzione 3 arriverebbe al massimo al 76%, il difetto è
al 5–8%. L'85% separa la griglia a tutta altezza da entrambi e lascia 12 punti di margine per
bordi e tacche dei telefoni.

| corsa | esito |
|---|---|
| build della 1.21.24 (`:4174`) | **rosso**, 20 difetti: «griglia di 28x28 px su 360 di altezza (8%, minimo 85%), caselle di 0 px» in libera, sfida e livello su tutti e 5 i formati (5% a 1024×600 e 1280×620); «la pastiglia degli attrezzi non si raggiunge» su tutti e 5 |
| ramo, `GIOCO_IN_ORIZZONTALE = false` | **rosso**, gli stessi 20 difetti |
| ramo, interruttore acceso | **verde**, 7 colonne «ok» su 5 formati |

## D1 e O1 — Testo ×2

- **D1**: il velo (`.pl-velo--scorre`) ha una riga sola alta quanto il velo; la finestra al centro
  (menu, domande, pannello degli attrezzi) ha `max-height: 100%` e scorre dentro di sé. Quattro
  componenti usano lo stesso velo (`ConfermaDoppia`, due volte; `MenuPartita`; `Attrezzi`): la
  classe arriva da `src/ui/velo.js`. Effetto anche in orizzontale: a 640×360 il pannello degli
  attrezzi (alto 528 px) ora sta in 312 e scorre.
- **O1**: colpevoli misurati con «testo ×2» (elementi che escono a destra, i più interni):
  scritta PLINTO del marchio (340 px di larghezza a 360), riga dell'esempio della guida («+ =
  Quadrante chiuso»), «Indietro» e «Avanti» affiancati, striscia «Prossimi tre pezzi». Ora vanno a
  capo quando non ci stanno; PLINTO è una parola sola e ha `font-size: min(34px, 13vw)` (a 320 e
  360 px 13vw vale 42 e 47 px, sopra i 34: a caratteri normali non cambia).

Controllo nel gate: `npm run e2e-schermi`, casi «testo x2» a 360×800 e 412×915: ogni passo della
guida senza sporgenza di lato e con «Avanti» raggiungibile; livello 13 senza sporgenza; «Torna alla
partita» del pannello e i pulsanti del menu raggiungibili («raggiungibile» = portato in vista, il
suo centro è dentro la finestra ed `elementFromPoint` restituisce lui).

| corsa | esito |
|---|---|
| build della 1.21.24 | **rosso**: guida +52/+49/+49/+49/+58/+25 px (360×800), +6 px passi 2–5 (412×915); livello +47 px (360×800); pannello «da 24 a 1431 px su 800» e «da 24 a 1191 px su 915» |
| `VELI_CHE_SCORRONO = false` | **rosso**, 4 difetti: pannello irraggiungibile ai due formati (e quindi menu non apribile, perché il pannello resta aperto) |
| `TESTO_GRANDE_VA_A_CAPO = false` | **rosso**, 11 difetti: guida e livello che sporgono, come la 1.21.24 |
| tutto acceso | **verde** |

Gli interruttori sono stati spenti e riaccesi con la stessa `sed`; `git status` pulito dopo.

## Pacchetto Android

`android:appCategory="game"` sull'`<application>` di `android/app/src/main/AndroidManifest.xml`,
con un commento. Fonte letta il 22 ottobre 2026: developer.android.com, «Behavior changes: Apps
targeting Android 16», sezione «Ignore orientation, resizability, and aspect ratio restrictions»:
per le app con API 36 orientamento, ridimensionabilità e proporzioni non valgono sugli schermi
con larghezza minima ≥ 600 dp; fra le eccezioni «Games (based on the android:appCategory flag)».
`targetSdk 36` è in `android/app/build.gradle:36`. Il resto del pacchetto non è cambiato.
Test nuovo in `tests/android.test.js` («l'app si dichiara gioco…»), fatto fallire rinominando
l'attributo e poi ripristinato. Vale dal prossimo AAB caricato. Se l'eccezione valga per la
finestra del gioco, che è un'Activity di Chrome, **non posso confermarlo**: per questo E1 è
corretto nel sito, che copre anche Custom Tab, Chromebook e browser.

## Confronto prima/dopo fuori dall'orizzontale basso

`confronta.mjs` sulle corse complete (14 formati non coricati bassi × 5 scene = 70 scene:
320×640, 360×640, 360×800, 390×844, 412×915, 412×805, 768×1024, 1024×768, 800×1280, 1280×800,
1280×720, 1366×657, 1366×768, 1920×1080, con libera, menu, sfida, livello 13, pannello):
**identica in tutte e 70** — ogni elemento di `#root` nello stesso rettangolo.

Pixel (`pixel.mjs`): 40 schermate identiche byte per byte, 30 con differenze piccole:
- sfida e livello 13: 1–20 pixel a gruppetti vicino ai pezzi del vassoio. **Rumore**: la stessa
  build 1.21.24 rifatta due volte dà differenze dello stesso tipo (360×800 sfida 17 pixel, livello
  14; 412×915 sfida 10).
- pannello degli attrezzi: 1–98 pixel (57–72 sui telefoni), soprattutto nella colonna delle
  icone, scarto massimo **13 su 765** (somma dei tre canali). Nella ripetizione della 1.21.24 il
  pannello differisce di 7 pixel a 360×800 e di 0 a 412×915: una parte è rumore, il resto
  probabilmente nasce dal pannello che ora è un contenitore che scorre (anti-aliasing delle icone);
  la causa esatta non posso confermarla. Invisibile a occhio; lo scrivo perché non è «identico» in
  senso stretto.

## Schermate (`docs/sviluppo/po035/`)

- `01`–`06`: prima/dopo a 640×360, 915×412, 1024×600, partita libera e livello 13.
- `07`–`09`: pannello degli attrezzi in orizzontale, dopo.
- `10`: fine del livello 1 a 640×360 giocato dal gate, dopo.
- `11`, `12`: testo ×2 a 360×800, pannello degli attrezzi e guida, dopo.

## Prove finali

- `npm run build`: ok.
- `npm test`: 45 file, 651 test, tutti verdi.
- `npm run e2e-schermi` con `PLINTO_SCHERMI=orizzontale,testo` sulla build di produzione
  (`vite preview --port 4173`, `PLINTO_E2E_URL=http://127.0.0.1:4173/`): verde.
- `npm run verifica -- --veloce`: la corsia veloce è stata **negata dal gate** («non risulta
  nessun giro completo passato su questa macchina»), quindi è girato il **gate completo**: 33
  controlli in 5259 s. **31 verdi, 2 rossi, entrambi i rossi noti** di `docs/TESTING.md` per il
  carattere dei contenitori figli, ciascuno con un solo problema:
  - `e2e-quadri`: «a 320x700 bisogna scorrere di 2 px» (fine del livello vinta);
  - `recensione`: «a 360x640 l'invito finisce 10px sotto la barra dei pulsanti».
  Fra i verdi: cento livelli giocati nell'app 100/100, precisione del trascinamento, geometria
  della plancia, «la home entra nello schermo», e `e2e-schermi` completo («Tutto a posto su 13
  formati, 5 coricati e 2 col testo x2»). Il verdetto che conta resta quello della CI.

## Cose trovate, non corrette

- **Tocco perso subito dopo un trascinamento (osservazione).** Nel Chromium di prova un tocco
  su «Menu» entro ~200 ms dalla fine di un trascinamento col dito a volte non produce il `click`
  (arrivano `pointerdown` e `pointerup`, non il `click`): 3 volte su 4 con 200 ms, 0 su 4 con
  1500 ms, **uguale sulla 1.21.24** e in verticale (360×800). Non nasce da questa correzione. Il
  gate aspetta un secondo dopo il trascinamento, con il perché scritto. Se succeda su un telefono
  vero e quale sia la causa **non posso confermarlo**. I pezzi si prendono con `pointerdown`, non
  con `click`, quindi il gioco in sé non ne risente; i pulsanti sì.
- **Fine del livello in orizzontale**: a 640×360 la schermata scorre (il pulsante «Livello
  successivo» resta fisso in basso, sopra il contenuto); tutti i pulsanti si raggiungono (gate
  verde). Non cambiata: non era nel perimetro e non blocca.
- La home in orizzontale scorre (O3): non cambiata, come chiesto.
- L'aiuto (`ComeSiGioca.jsx`, guida) non parla di orientamento: nessun testo da aggiornare.

## Testo proposto per il changelog

```markdown
### Corretto

- **Si gioca anche col telefono coricato** (PO-035, PO-017 E1): con lo schermo in
  orizzontale e alto fino a 620 px la griglia era di 28 px e nei livelli le caselle
  sparivano, e gli attrezzi non si raggiungevano. Adesso la griglia prende tutta l'altezza
  (348 px a 640x360, 588 a 1024x600) e punteggio, obiettivo, Catena, attrezzi e pezzi stanno
  a destra. In verticale, sui tablet e sui PC non cambia niente (impaginazione identica in
  70 scene misurate). Interruttore `GIOCO_IN_ORIZZONTALE`.
- **Con i caratteri molto grandi** (PO-017 D1, O1; misurato con una simulazione a 200%):
  menu, domande e pannello degli attrezzi scorrono invece di uscire dallo schermo, e
  «Torna alla partita» si raggiunge sempre; la guida e il livello non sporgono più di lato.
  Interruttori `VELI_CHE_SCORRONO`, `TESTO_GRANDE_VA_A_CAPO`.

### Android

- Il pacchetto si dichiara gioco (`android:appCategory="game"`): su Android 16 è l'eccezione
  all'orientamento ignorato sui tablet. Vale dal prossimo AAB.

### Prove

- `npm run e2e-schermi`: telefono coricato su cinque formati (griglia almeno all'85%
  dell'altezza, un pezzo trascinato col dito) e testo x2; rossi sulla 1.21.24.
```

## Scelte aperte

1. **Disegno in orizzontale**: fatto l'1 (griglia a sinistra, tutto il resto a destra). Le
   alternative 2 e 3 sono sopra. Mancina/destrorso: con la griglia a sinistra i pezzi stanno sotto
   il pollice destro; specchiarla per i mancini sarebbe un'impostazione nuova (non fatta).
2. **Soglia del gate** a 85%: proposta, motivata sopra.
3. **Orizzontale sopra i 620 px di altezza** (per esempio 1366×657, PC con barre): resta nella
   colonna da 430 px come prima (non toccato, era fuori dalla richiesta). Si può estendere
   l'impaginazione nuova fino a 719 px se il PO lo vuole.
4. **Tocco perso dopo un trascinamento**: da provare sul telefono del PO (trascinare un pezzo e
   toccare subito «Menu»), insieme alla prova di O4.
5. **Manifest web** (`"orientation": "portrait"`): non cambiato. Ora che il gioco funziona in
   orizzontale si potrebbe togliere il blocco, ma il test «il manifest web e quello Android
   bloccano lo stesso orientamento» li lega: decisione del PO.
6. Un AAB nuovo serve per `appCategory` (alzare `versionCode`): non fatto qui, come richiesto.
