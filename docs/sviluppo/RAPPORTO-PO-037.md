# Rapporto PO-037 — il primo tocco perso a fine livello (solo indagine)

Figlia, 27 ottobre 2026, ramo `po037-tocco-fine-livello` (da `main` a `9b370c8`). **Il gioco non è
stato toccato**: sul ramo ci sono solo strumenti (`tools/`) e misure (`docs/sviluppo/po037/`).
Niente su `main`, nessun cambio di versione.
Fonti lette: `docs/sviluppo/COLLAUDO-1.21.26.md` (ramo `collaudo-1.21.26`, O1),
`docs/sviluppo/RAPPORTO-PO-036.md` e `tools/sonda-tocco.mjs`, ultime righe di `docs/DECISIONI.md`.
Chromium di prova: `/opt/pw-browsers/chromium` **153.0.8010.12**, headless su Linux, tocco emulato
con `Input.dispatchTouchEvent` (CDP), `isMobile`, densità 2.
Sorgente di Chromium letto da `chromium.googlesource.com`, ramo `main` al commit `8a78e97`
(27 ottobre 2026): **non** è esattamente il codice della 153 usata nelle prove; le righe citate
sotto valgono per quel commit.

## In breve

| domanda | risposta |
|---|---|
| 1. Si riproduce? | **Sì**, sulla build di produzione (`vite preview`, bundle `index-CSd4AjUk.js`, lo stesso del sito) e **sul sito pubblicato**. Vedi tabella sotto. |
| 2. Perché manca il click? | All'ultimo distacco «frettoloso» Chromium avvia un **fling** (lancio inerziale) nel processo del browser, anche se sotto il dito c'è `touch-action: none`. Il primo tocco che arriva **mentre il fling è ancora vivo** lo ferma (`GestureFlingCancel`) e Chromium **sopprime di proposito** il tap che ha fermato il fling (`FilterTapSuppression`): niente `GestureTap`, quindi niente `click`. Misurato su 268 giri con traccia: click perso **se e solo se** il fling era vivo al tocco (un solo caso di confine, sotto). |
| Perché proprio a fine livello e fino a ~1,5 s? | Non è la fine del livello: sono **i trascinamenti di fila nella stessa direzione**. Il `FlingBooster` di Chromium somma ogni fling al precedente: dopo 14 trascinamenti verso l'alto il fling parte a 5.000–18.000 px/s e dura **fino a 2 s** (tetto della curva su Linux). Dopo un solo trascinamento parte a ~1.000 px/s e dura ~0,5 s: è la «finestra più corta» della partita libera. |
| 3. Pagina minima | **Riprodotto senza PLINTO**: la pagina minima più nuda (riquadro `touch-action: none`, quadrato che segue il dito, pulsante) con 14 trascinamenti a 150 ms perde il click **12 su 12** fino a 1.500 ms, 0 su 4 a 2.500 ms. Schermata di fine, contenitore che scorre, animazioni d'ingresso, `touch-action` della radice: **nessuno cambia l'esito**. |
| 4. Su un telefono vero? | **Non posso confermarlo.** Fatti dal sorgente: su Android la soppressione è accesa e la curva del fling è un'altra (dura di più a parità di velocità). Ipotesi: un dito vero rallenta prima di staccarsi e il fling nasce piccolo o non nasce; non misurato. Serve la prova del PO (in fondo). |

## 1. Riproduzione

Sonda nuova `tools/sonda-fine-livello.mjs`: contesto nuovo per giro, impostazioni scritte in
`localStorage`, «Mappa dei livelli» › livello 1 › «Gioca», la sequenza vincente del motore
(`tools/sequenza-vincente.mjs`) giocata col dito: 12 movimenti e distacco subito («frettoloso»),
150 ms fra una mossa e l'altra; oppure lo stesso ma col dito fermo 300 ms all'ultima mossa
(«fermo-ultima»). Poi attesa dalla comparsa di «Livello superato!», tocco al centro di «Torna ai
livelli», e si guarda se la mappa compare entro 1,5 s. Con `SONDA_TRACCIA=si` registra i gesti
di Chromium (`tools/po037-gesti.mjs`). 4 giri per casella.

Click persi (livello 1 vinto, primo tocco su «Torna ai livelli»):

| dove | formato | dito | 500 ms | 1000 ms | 1500 ms | 2000 ms | 3000 ms |
|---|---|---|---|---|---|---|---|
| build di produzione | 360x640 | frettoloso | **4/4** | **4/4** | **4/4** | 0/4 | 0/4 |
| build di produzione (2ª corsa) | 360x640 | frettoloso | **4/4** | **4/4** | **4/4** | 0/4 | 0/4 |
| build di produzione | 360x640 | fermo-ultima | 0/4 | 0/4 | 0/4 | 0/4 | 0/4 |
| build di produzione | 915x412 | frettoloso | — | **3/4** | **4/4** | 0/4 | 0/4 |
| sito pubblicato | 360x640 | frettoloso | — | **3/4** | **3/4** | 0/4 | 0/4 |
| sito pubblicato | 360x640 | fermo-ultima | — | 0/4 | 0/4 | 0/4 | 0/4 |

Misure in `docs/sviluppo/po037/fine-livello-*.json` (eventi della pagina e riassunto dei gesti,
giro per giro). Il sito serviva `assets/index-CSd4AjUk.js` (letto con `curl` il 27 ottobre), lo
stesso bundle della build locale. Nei giri del sito senza click perso con dito frettoloso, la
traccia dice che l'ultimo distacco **non** aveva prodotto un fling (5 giri) o che il fling era già
finito (5 giri): la variabilità sta nella velocità con cui il tocco emulato si stacca, non nel sito.

## 2. Perché manca il click

### Che cosa dice la traccia (misurato)

Giro perso tipico (360x640, attesa 1.500 ms), eventi `InputLatency::*` e istantanei della
categoria `input`:

1. ultimo `TouchEnd` del trascinamento → `GestureFlingStart`;
   `FlingController::HandlingGestureFling` con velocità `vy` fra −5.100 e −8.400 px/s nei giri persi
   a 360x640 (verso l'alto, da vassoio a griglia; a 915x412 il lancio è orizzontale, `vx`);
2. il `FlingController` produce un `GestureScrollUpdate` ogni ~16,7 ms (93 passi in 1.563 ms);
   nella traccia compaiono istantanei `FilteredForTouchAction` (il filtro del `touch-action` che
   scarta gesti di scorrimento; non ho verificato evento per evento che siano proprio questi) e
   **non scorre niente**: `scrollTop` della fine del livello è 0 al tocco in tutti i giri;
3. tocco su «Torna ai livelli»: `TouchStart` → `GestureFlingCancel`, `GestureScrollEnd`,
   `GestureTapDown`, subito `FilterTapSuppression`; al `TouchEnd` il `GestureTap` nasce ma passa
   di nuovo da `FilterTapSuppression` e **non viene mandato alla pagina**: nessun
   `EventDispatch` di tipo `click`.

Riepilogo su tutti i 268 giri con traccia di questo ramo (tutti i file in `docs/sviluppo/po037/`):

| fling dell'ultimo distacco, al momento del tocco | click arrivato | click perso |
|---|---|---|
| vivo | 1 | **84** |
| finito, o mai partito | **183** | **0** |

Il caso «vivo ma click arrivato» è un giro della partita libera a 500 ms: ultimo passo del fling a
544 ms, tocco a 548 ms, cioè il fling stava finendo in quell'istante.

### Che cosa dice il sorgente di Chromium (letto, commit `8a78e97`)

- `components/input/input_router_impl.cc:170-184`: ogni gesto passa **prima** dal controllore del
  fling (`PassToFlingController`) e **solo dopo** dal filtro del `touch-action`. Per questo il
  fling parte anche sopra `touch-action: none`.
- `components/input/fling_controller.cc:61-114`: un `GestureFlingCancel` che ferma un fling vivo
  avvisa il soppressore dei tap; i gesti di tap seguenti passano da `FilterTapEvent` e, se
  soppressi, la traccia scrive `FilterTapSuppression`.
- `components/input/tap_suppression_controller.cc:21-69`: dopo un cancel che ha fermato un fling,
  il `TapDown` che arriva entro `max_cancel_to_down_time` e il tap che lo segue sono soppressi.
- `ui/events/gesture_detection/gesture_configuration_aura.cc:67` (Linux, le prove) e
  `gesture_configuration_android.cc:67-70` (Android): soppressione **accesa sui touchscreen** in
  entrambi; su Android la finestra è il `TapTimeout` di sistema.
- `ui/events/blink/fling_booster.cc:15-25, 157-205`: un fling nuovo nella stessa direzione,
  mentre il precedente è vivo e sopra 350 px/s, viene **sommato** al precedente. Nelle tracce:
  fra 5 e 13 fling «Boosted» per giro (su 13–14 distacchi).
- Durata: su Linux `ui/events/gestures/physics_based_fling_curve.cc:20, 145-149` (attiva su Linux
  e Windows per `ui/base/ui_base_features.cc:205-211`): durata = velocità / 2.300, al massimo
  **2,0 s**. Misurato: ~1.000 px/s → 0,41–0,53 s; sopra ~4.600 px/s → 1,98–2,01 s. È il
  confine fra 1.500 ms (perso) e 2.000 ms (arrivato).

### Le ipotesi della domanda, una per una (misurato)

| ipotesi | esito |
|---|---|
| la schermata di fine livello scorre sotto il dito | **no**: `scrollTop` 0 al tocco in tutti i giri, anche se il fling è vivo. Per completezza: la fine del livello ha 61 px da scorrere a 360x640 e 238 px a 915x412 (entrambi fuori dalla regola «da 320x700 in su»; non lo chiamo difetto). |
| un elemento che scorre sotto il dito | **no**: nessun evento `scroll` fra la vittoria e il tocco in 88 giri di fine livello. Gli unici 9 `scroll` registrati (915x412) arrivano 30–36 ms **dopo** un tocco riuscito, mentre si apre la mappa. |
| un'animazione sposta il pulsante fra `touchstart` e `touchend` | **no**: `pointerdown`, `touchstart`, `pointerup`, `touchend` arrivano tutti sullo stesso `button.pl-btn` «Torna ai livelli»; e il tap è scartato **nel browser**, prima che la pagina possa decidere qualcosa. |
| React sostituisce il nodo fra `pointerdown` e `pointerup` | **no**, per la stessa ragione: il bersaglio è lo stesso, e il `click` non viene neanche chiesto alla pagina. |

### Partita libera a confronto (`tools/po037-fling.mjs`, 360x640, 4 giri per casella)

| scena | 500 ms | 1000 ms | 1500 ms | 2500 ms | velocità e durata del fling |
|---|---|---|---|---|---|
| libera, **1** trascinamento | 1/4 | 0/4 | 0/4 | 0/4 | 550–1.250 px/s, 0,23–0,54 s, mai spinto |
| libera, **14** trascinamenti a 150 ms | 3/4 | **4/4** | **4/4** | 0/4 | 1.900–18.500 px/s, fino a 2,0 s, 8–13 spinti |

La «finestra più corta» della partita libera (collaudo 1.21.26) è quella del trascinamento singolo
delle sonde. Con i trascinamenti in fila anche la partita libera la allunga fino a ~2 s.

## 3. Pagina minima, pezzo per pezzo (`tools/po037-fling.mjs`)

Ogni scena aggiunge qualcosa alla precedente; trascinamento dal basso verso il centro come nel
livello 1; 4 giri per casella; click persi.

| scena | che cosa c'è | 500 | 1000 | 1500 | 2500 |
|---|---|---|---|---|---|
| m0 | riquadro `touch-action: none`, quadrato che segue il dito, pulsante fisso in alto; **1** trascinamento | 0/4 | 0/4 | 0/4 | 0/4 |
| m1 | + al distacco la schermata diventa una «fine»: colonna flex, area `overflow-y: auto`, pulsanti in fondo | 0/4 | 0/4 | 0/4 | 0/4 |
| m2 | + radice `touch-action: manipulation; overscroll-behavior: none` come PLINTO | 1/4 | 0/4 | 0/4 | 0/4 |
| m3 | + animazioni d'ingresso (salto, coriandoli, barra) | 0/4 | 0/4 | 0/4 | 0/4 |
| m4 | + l'area della fine scorre davvero (900 px in più) | 0/4 | 0/4 | 0/4 | 0/4 |
| m5 | m2 con **14** trascinamenti a 150 ms | **4/4** | **3/4** | **4/4** | 0/4 |
| **m8** | **m0** (niente fine, niente radice) con **14** trascinamenti | **4/4** | **4/4** | **4/4** | 0/4 |

Seconda corsa di m5 (500/1000/1500 ms): 4/4, 4/4, 3/4. L'ingrediente è uno solo: **molti
trascinamenti veloci di fila nella stessa direzione**. Gli altri pezzi della fine del livello sono
esclusi. Perché la pagina minima del collaudo 1.21.26 con 14 trascinamenti non lo riproducesse
**non posso confermarlo**: quello script non è nel repository.

Due varianti per capire che cosa lo toglie (stessa pagina m5, 4 giri):

| variante | 500 | 1000 | 1500 | gesti |
|---|---|---|---|---|
| m6: `preventDefault()` sui `touchmove` del trascinamento (ascoltatore non passivo) | **0/4** | **0/4** | **0/4** | nessun fling in 12 giri |
| m7: `preventDefault()` sul solo `touchend` | 4/4 | 4/4 | 4/4 | fling vivo in 12 giri |

In m6 il trascinamento continua a funzionare (gli eventi `pointer*` arrivano: la fine compare dopo i
14 `pointerup`). Oggi PLINTO ascolta `pointermove` passivo (`src/ui/useTrascinamento.js:173`) e
nessun `touchmove` (cercato in `src/`).

## 4. È plausibile su un telefono vero?

**Fatti** (sorgente, non misura sul telefono):
- nella TWA il motore è Chrome per Android; il codice citato sopra sta in `components/input` e
  `ui/events`, comune alle piattaforme; su Android la soppressione dei tap che fermano un fling è
  accesa (`gesture_configuration_android.cc:67`);
- su Android la curva del fling è un'altra: `MobileScroller` (`components/input/utils.cc:62-63`,
  `ui/events/gestures/blink/web_gesture_curve_impl.cc:36-50`), durata dalla formula di
  `ui/events/mobile_scroller.cc:462-472`. Calcolata con le costanti del file: 1.000 → 0,56 s;
  3.000 → 1,25 s; 5.000 → 1,82 s; 8.000 → 2,57 s. Se quelle velocità siano in px o in dp al
  secondo **non posso confermarlo** (non ho letto chi chiama `Fling`);
- il PO, il 22 ottobre, sul suo telefono: tocco su «Menu» subito dopo aver appoggiato un pezzo,
  «Funziona tutto» (`docs/DECISIONI.md`). Era un trascinamento solo, non una serie.

**Ipotesi** (non misurate):
- un dito vero di solito rallenta prima di staccarsi: il fling nasce piccolo o non nasce, e senza
  fling non c'è niente da sopprimere (qui: col dito fermo all'ultima mossa 0 click persi su 36);
- chi gioca **lanciando** i pezzi (muove svelto e stacca in corsa, tutti verso l'alto) può
  accumulare fling come nelle prove, e allora il primo tocco subito dopo può andare perso: il
  secondo funziona sempre;
- vale per **qualunque** pulsante toccato subito dopo una serie di lanci, non solo «Torna ai
  livelli» (misurato nella partita libera su «Menu»);
- che il revisore di Google l'abbia incontrato, e che possa leggerlo come «non risponde»: **non
  posso confermarlo**.

## Opzioni di correzione (nessuna fatta: la revisione della 11915 è aperta)

1. **(consigliata, dopo l'esito della revisione)** Durante il trascinamento di un pezzo, un
   ascoltatore `touchmove` **non passivo** che chiama `preventDefault()`, agganciato all'elemento su
   cui è cominciato il tocco (il pezzo del vassoio) per la sola durata della presa. È la variante
   m6: niente fling, niente tap soppresso, 0 su 12 contro 11 su 12. Va scritta con un controllo
   nel gate (14 trascinamenti frettolosi e tocco subito, rosso prima e verde dopo) e va verificato
   che non tocchi: il tocco per scegliere un pezzo senza trascinarlo, il piccone, `pointercancel`
   dai gesti di sistema. Attenzione da misurare: il pezzo preso esce dal vassoio quando si appoggia;
   l'ascoltatore deve restare sul nodo di partenza (i `touchmove` vanno a quello), non su `document`.
2. **Pulsanti che rispondono anche al `pointerup`** se il `click` non arriva (solo dove serve,
   p. es. i pulsanti della fine del livello). Toglie il sintomo senza toccare il trascinamento, ma
   duplica l'attivazione dei pulsanti (rischio di doppio scatto, tastiera e lettori di schermo da
   ricontrollare) e lascia il fling vivo per tutto il resto.
3. **Non fare niente.** È un comportamento voluto di Chromium («il tocco che ferma un lancio non è
   un tap»), il secondo tocco funziona sempre e il PO, sul suo telefono, non l'ha visto. Ha senso
   se la prova sul telefono qui sotto dà 0 su 10.

Suggerimento: prima la prova sul telefono; se si presenta anche lì, opzione 1; se no, opzione 3.

## Prova sul telefono vero (per il PO, circa 10 minuti)

Usare l'app da Google Play (o il sito in Chrome). Annotare **modello del telefono, versione di
Android** e se la navigazione è a gesti o a tre pulsanti.

**A — lanci veloci e tocco subito (5 volte)**
1. Apri «Mappa dei livelli» e tocca il livello 1, poi «Gioca».
2. Gioca **lanciando** i pezzi: appoggia il dito sul pezzo, portalo **svelto** sulla griglia e
   **stacca il dito mentre si muove ancora**, senza fermarti.
3. Appena compare «Livello superato!», tocca **subito** (entro un secondo) «Torna ai livelli».
4. Scrivi: si è aperta la mappa al primo tocco? (sì / no, ci è voluto un secondo tocco)
5. Dalla mappa tocca di nuovo il livello 1 e ripeti.

**B — come A, ma con calma (5 volte)**
Porta ogni pezzo sulla griglia, **fermati un attimo** con il dito, poi staccalo. Tocca subito
«Torna ai livelli». Scrivi sì/no come prima.

**C — partita libera (5 volte)**
«Partita libera»: lancia 5 o 6 pezzi di fila verso l'alto come in A, poi tocca **subito** «Menu»
(≡ in alto). Si apre al primo tocco? Chiudi il menu e ripeti.

Basta mandare tre numeri, per esempio «A: 3 su 5 al primo tocco, B: 5 su 5, C: 4 su 5».

## Strumenti e file di questo ramo

- `tools/sonda-fine-livello.mjs` — la sonda della fine del livello (anche contro il sito con
  `PLINTO_E2E_URL`).
- `tools/po037-gesti.mjs` — registra e riassume i gesti di Chromium (tracing CDP, solo gli eventi
  utili: le tracce intere pesano 50 MB a giro).
- `tools/po037-fling.mjs` — partita libera e pagine minime m0–m8.
- `docs/sviluppo/po037/*.json` — le misure di questo rapporto, giro per giro.

Strumenti di misura, **non** registrati nel gate: non sono controlli.
