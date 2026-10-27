# Rapporto PO-037 — correzione del primo tocco perso dopo i lanci

Figlia, 27 ottobre 2026, ramo `po037-correzione` (da `main` a `c88d155`). Niente su `main`,
nessun cambio di versione, `android/` non toccato. Decisione del PO del 27 ottobre
(`docs/DECISIONI.md`, ultima riga): variante m6 del rapporto d'indagine, interruttore, controllo
nel gate. Causa e fonti: `docs/sviluppo/RAPPORTO-PO-037.md` (portato qui dal ramo
`po037-tocco-fine-livello` insieme a `tools/sonda-fine-livello.mjs`, `tools/po037-gesti.mjs`,
`tools/po037-fling.mjs` e alle misure in `docs/sviluppo/po037/`).
Chromium di prova: `/opt/pw-browsers/chromium` 153.0.8010.12, headless, tocco emulato con
`Input.dispatchTouchEvent`, `isMobile`, densità 2.

## Che cosa è cambiato

`src/ui/useTrascinamento.js`, interruttore `NIENTE_LANCIO_DOPO_LA_PRESA = true`:

- in `iniziaTrascinamento` (il `pointerdown` sul pezzo del vassoio), se il puntatore è un dito,
  un ascoltatore `touchmove` **non passivo** che chiama `preventDefault()` viene agganciato a
  `evento.currentTarget` (il pulsante `.pl-pezzo-presa` del vassoio, che contiene il nodo dove il
  tocco è cominciato: i `touchmove` vanno a quello e risalgono). Agganciato subito, nel
  `pointerdown`, e non in un effetto di React, perché il primo `touchmove` può arrivare prima del
  nuovo disegno;
- staccato al `pointerup` (`rilascia`) e al `pointercancel` (`annulla`), e in più da un effetto
  quando `preso` torna `null` per altre strade (`annulla()` del gioco, smontaggio);
- col mouse non si aggancia niente (`pointerType !== 'touch'`); mensola e carriola non passano
  di qui (con un attrezzo che chiede un pezzo `onPointerDownPezzo` è vuoto,
  `src/ui/SchermoGioco.jsx:675`); il piccone tocca la griglia, non il vassoio.

`tools/po037-gesti.mjs`: il riassunto conta anche **tutti** i `GestureFlingStart` della traccia
(prima diceva solo dell'ultimo distacco).

`tests/e2e/schermi.mjs` (già nel gate come «tablet e PC: ogni schermata nella cornice»):
`provaLanci`, vedi sotto.

## Misure prima e dopo (build di produzione, `vite preview`)

Stesse sonde e stessi parametri; 4 giri per casella; traccia dei gesti accesa in tutti i giri.
«Prima» = `main` (bundle `index-CSd4AjUk.js`, lo stesso del sito secondo il rapporto
d'indagine); «dopo» = questo ramo (bundle `index-BTGELjjy.js`).
Fine del livello: `tools/sonda-fine-livello.mjs`, livello 1 giocato con la sequenza del motore
(14 trascinamenti), dito frettoloso, 150 ms fra le mosse, tocco su «Torna ai livelli».
Partita libera: `tools/po037-fling.mjs`, scena `libera14` (14 lanci, poi «Menu»).

Click persi:

| scena | formato | 500 ms prima | 500 ms dopo | 1000 ms prima | 1000 ms dopo | 1500 ms prima | 1500 ms dopo |
|---|---|---|---|---|---|---|---|
| fine del livello 1 | 360x640 | 4/4 | **0/4** | 3/4 | **0/4** | 4/4 | **0/4** |
| partita libera, «Menu» | 360x640 | 4/4 | **0/4** | 3/4 | **0/4** | 4/4 | **0/4** |
| fine del livello 1 | 915x412 | 4/4 | **0/4** | 3/4 | **0/4** | 3/4 | **0/4** |
| partita libera, «Menu» | 915x412 | 4/4 | **0/4** | 4/4 | **0/4** | 4/4 | **0/4** |
| **totale** | | | | | | **44/48 prima** | **0/48 dopo** |

Gesti di Chromium:

- **prima**: nei 44 giri persi il fling dell'ultimo distacco era vivo al tocco (44 su 48); il
  `FlingBooster` aveva sommato fra 5 e 13 fling per giro. Nei 4 giri arrivati il fling era già
  finito (2) o l'ultimo distacco non ne aveva prodotto (2).
- **dopo**: **0 `GestureFlingStart` in tutta la traccia** in 48 giri su 48 (non solo all'ultimo
  distacco), 0 click persi.

File: `docs/sviluppo/po037/fine-livello-{prima,dopo}-{360x640,915x412}.json`,
`docs/sviluppo/po037/fling-{prima,dopo}-libera14-{360x640,915x412}.json`.

## Controllo nel gate: rosso spento, verde acceso

`tests/e2e/schermi.mjs`, `provaLanci`: partita libera a 360x640 e a 915x412, 3 giri ciascuno;
14 lanci dal primo pezzo del vassoio verso il centro della griglia, 12 movimenti e distacco
subito, **senza** `fermaIlDito` (la pausa di `DITO_CHE_SI_FERMA`), 150 ms fra un lancio e
l'altro; poi subito un tocco (`Input.dispatchTouchEvent`) su «Menu» e il menu deve aprirsi
entro 1 s. Se il vassoio si svuota prima di 14 lanci la prova si dichiara rotta.
Si lancia da sola con `PLINTO_SCHERMI=lanci npm run e2e-schermi` (server di sviluppo).

| interruttore | corse | esito |
|---|---|---|
| spento (`sed` sulla riga dell'interruttore) | 3 | **rosso** in 3 corse su 3: menu non aperto in **18 giri su 18** |
| acceso (stessa `sed` al contrario) | 3 | verde in 3 corse su 3 (18 giri su 18 aperti) |

## Che cosa non cambia (misurato)

Sonda usa e getta (non nel repository), build di produzione a 360x640, la stessa sonda con
l'interruttore acceso e spento:

| caso | acceso | spento |
|---|---|---|
| tocco per scegliere un pezzo, con 2 `touchmove` di 1 px, poi tocco su una casella | pezzo scelto, poi appoggiato | uguale |
| trascinamento lento (30 passi a 16 ms, dito fermo 300 ms) | appoggiato; 1 ascoltatore `touchmove` sul vassoio **durante**, 0 dopo | appoggiato; 0 ascoltatori |
| `touchCancel` (diventa `pointercancel`) a metà trascinamento | pezzo non posato, torna in mano, 0 ascoltatori dopo | uguale |
| mouse | appoggiato, 0 ascoltatori | uguale |
| mappa dei livelli, lanci col dito verso l'alto | 1.310 px, in fondo dopo 3 lanci | 3 lanci |
| come si gioca | 2.981 px, in fondo dopo 2 lanci | 3 lanci |
| impostazioni | 233 px, in fondo dopo 1 lancio | 1 lancio |

Gli ascoltatori contati con `DOMDebugger.getEventListeners` su ogni nodo del vassoio. La
differenza 2/3 lanci in «Come si gioca» non viene dalla correzione: quelle schermate non hanno
il vassoio e nessun ascoltatore è agganciato (0 dopo ogni presa); la attribuisco alla
variabilità del fling del tocco emulato, che il rapporto d'indagine ha già misurato — non l'ho
ripetuta per dimostrarlo. Le caselle piene diverse fra acceso e spento vengono dai pezzi della
partita libera, diversi a ogni partita.

Prove del gate già esistenti, con la correzione accesa:

- `npm run precisione`: verde («Nessuno scostamento»);
- `npm run e2e-attrezzi` (piccone, mensola, carriola, scambio): verde;
- `npm run e2e-po008`: verde;
- `npm run e2e-schermi` (completo, con i lanci): verde («Tutto a posto su 13 formati, 5 coricati e 2 col testo x2 e 2 coi lanci»);
- tastiera: coperta da `e2e-schermi` («un pezzo da tastiera») e dal gate (vedi sotto).

## Gate finale

- `npm run build`: bundle `index-BTGELjjy.js`.
- `npm test`: 45 file, 655 test, tutti verdi.
- `npm run verifica -- --veloce`: **corsia veloce NEGATA** dal gate stesso («non risulta nessun
  giro completo passato su questa macchina»), quindi avrebbe fatto il giro intero (~63 min),
  oltre il limite di 60 min dei comandi in background di questo container. Fermato e rifatto **a
  pezzi**, con gli stessi comandi di `tools/verifica-tutto.mjs` uno per uno (senza pipe,
  codice d'uscita di ciascuno):
  - 31 controlli su 33 senza i cento livelli: **29 verdi, 2 rossi**: `e2e-quadri` («a 320x700
    bisogna scorrere di 2 px») e `recensione` («a 360x640 l'invito finisce 10px sotto la
    barra»), cioè esattamente i due rossi del font dei container figli in
    `docs/TESTING.md:313-314`; non toccano il trascinamento. Che siano verdi sulla CI **non posso
    confermarlo** finché la CI non gira.
  - `npm run livelli` (i cento livelli col dito, da solo): **verde**, «vinti nell'app: 100/100», 3.449 s.
  - la misura `geometria` serve solo a decidere la corsia veloce e non è stata eseguita.
- Il verdetto che conta è quello della CI su `main` (CLAUDE.md): **da leggere prima di dire
  «pubblicata»**.

## Testo per il changelog (1.21.27)

```markdown
### Corretto

- **Il primo tocco dopo una serie di lanci non va più perso** (PO-037, collaudo 1.21.26 O1):
  dopo molti pezzi trascinati in fretta e staccati col dito ancora in corsa, Chrome avviava
  un «lancio» invisibile che durava fino a 2 secondi, e il primo tocco che lo fermava non
  premeva il pulsante (per esempio «Torna ai livelli» a fine livello, o «Menu»). Adesso,
  mentre si tiene un pezzo, il dito non può avviare lanci. Misurato sulla build di
  produzione a 360x640 e 915x412: click persi da 44 su 48 a 0 su 48, e nessun lancio di
  Chrome nella traccia. Interruttore `NIENTE_LANCIO_DOPO_LA_PRESA`; controllo nuovo in
  `npm run e2e-schermi` (14 lanci e tocco subito su «Menu»: rosso in 18 giri su 18 con
  l'interruttore spento). Sul telefono vero non è stato provato.
```

## Scelte aperte (per il PO)

1. **Telefono vero.** Che il difetto ci fosse sul telefono e che ora non ci sia: **non posso
   confermarlo**. Le misure sono tutte nel Chromium di prova su Linux (la curva del fling su
   Android è un'altra, rapporto d'indagine § 4). La prova A/B/C in fondo a
   `docs/sviluppo/RAPPORTO-PO-037.md` resta valida per la 1.21.27.
2. **`DITO_CHE_SI_FERMA` in `tests/e2e/schermi.mjs`** curava nella prova lo stesso fling
   (PO-036). Con la correzione forse non serve più; non l'ho spento: toglierlo cambierebbe tutte
   le prove col dito di `e2e-schermi`, ed è fuori da questo incarico.
3. **Aiuto e guida** non toccati: la correzione non cambia niente che il giocatore debba
   imparare.
4. Gli strumenti `tools/sonda-fine-livello.mjs`, `tools/po037-*.mjs` restano strumenti di
   misura, fuori dal gate.
