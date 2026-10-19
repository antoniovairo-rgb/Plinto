# Collaudo della 1.21.16

19 ottobre 2026, ramo `collaudo-1.21.16`. Solo misure e rapporto: nessuna modifica al
codice del gioco, ad `android/` o alla versione.

## Cosa è stato provato davvero

- **Sito pubblicato** `https://antoniovairo-rgb.github.io/Plinto/`: il bundle
  `assets/index-D_2abUzO.js` contiene «1.21.16» (4 occorrenze, `curl` + `grep`),
  `last-modified: Mon, 19 Oct 2026 07:06:08 GMT`. Chromium del container (proxy con CA
  propria) apre il sito: HTTP 200. **Tutte le prove dei punti 1 e 2 sono contro il sito
  pubblicato**, non contro una build locale.
- La build locale di `main` (`44bc0bf`) produce lo **stesso file** `index-D_2abUzO.js`:
  la 1.21.16 locale usata nel punto 3 è byte per byte il bundle pubblicato (stesso nome
  con impronta del contenuto).
- **1.21.15**: build locale del commit `e8dc0e8` (`vite build` + `vite preview`), bundle
  con «1.21.15».
- Browser: Chromium 1194 del container, font del container (Inter, vedi
  `docs/TESTING.md`). Niente dispositivi veri.

## 1. `e2e-trionfo` ed `e2e-schermi` sul sito pubblicato

| prova | esito | dettaglio |
|---|---|---|
| `PLINTO_E2E_URL=<sito> npm run e2e-trionfo` | **verde**, «Tutto a posto», exit 0 | festa finale, 98/100 senza festa, atto chiuso a 6 formati, solo gettone a 6 formati («5 di 100», 0 tappe), atto già chiuso non ritorna |
| `PLINTO_E2E_URL=<sito> npm run e2e-schermi` | **verde**, «Tutto a posto su 13 formati», exit 0 | 13 formati × 17 colonne tutte `ok`, comprese `fine-gettone` e `fine-sconfitta` sui formati larghi bassi; console `ok` ovunque |

Gli avvisi di `e2e-schermi` (bersagli sotto 44 px: «Sostieni il progetto» e «Idee e
segnalazioni» 27 px, pastiglia degli attrezzi 38 px, giorni dell'archivio 43 px) sono
quelli già noti di PO-014 P4 (`docs/DECISIONI.md`, 2026-10-18), identici sul telefono.
Log completi: `collaudo-1.21.16/e2e-trionfo.log`, `collaudo-1.21.16/e2e-schermi.log`.

## 2. Tutte le fini del livello (sonda)

Sonda: `docs/sviluppo/collaudo-1.21.16/sonda-fine.mjs`, copia adattata di
`po015/sonda-fine.mjs`. Cosa cambia e perché:

- **Atto chiuso senza gettone** (livelli 24, 58, 76, 92, mai misurato prima): superati
  1..N−1, si vince N. I superati diventano N, che non è multiplo di 5, quindi nessun
  gettone. Il documento `plinto:attrezzi` è scritto con `riscossi = ⌊(N−1)/5⌋`: senza,
  `riscuoti()` (`src/persistence/attrezzi.js:57`) paga tutti i gettoni «arretrati» e il caso
  diventa atto + gettone. Ogni riga registra cosa è comparso (`premio/atto/uscita`), così un
  caso non si scambia per un altro: nei quattro atti risulta `0/1/0` (atto sì, gettone no).
- La linea vincente viene dal giocatore di `src/sim/giocatore-quadri.mjs` (lo stesso di
  `e2e-tutti-i-livelli`): il giocatore «goloso» della sonda di PO-015 **non vince** i livelli
  24, 76 e 92 in 400 semi (misurato).
- Italiano e inglese; arrivo a 390x844 e poi ridimensionamento a ogni formato, come la sonda
  di PO-015. **Controllo**: rigiocando 5 casi arrivando già al formato (`SONDA_DIRETTO=1`, 6
  formati) i numeri sono **identici** (`misure-fine-arrivo-diretto.jsonl`).

Valore: `scrollHeight − clientHeight` di `.pl-fine .pl-scroll` in px (0 = non scorre); tra
parentesi lo spazio libero nella colonna (negativo = quanto scorre). In grassetto ciò che
scorre.

| caso | lingua | 320x700 | 360x640 | 390x844 | 412x915 | 1366x768 | 1366x657 | 1280x720 | 1024x768 |
|---|---|---|---|---|---|---|---|---|---|
| normale | it | **2** (−2) | **61** (−61) | 0 (129) | 0 (199) | 0 (57) | 0 (7) | 0 (12) | 0 (57) |
| normale | en | **2** (−2) | **61** (−61) | 0 (129) | 0 (199) | 0 (57) | 0 (7) | 0 (12) | 0 (57) |
| solo gettone | it | 0 (86) | 0 (26) | 0 (230) | 0 (301) | 0 (93) | 0 (43) | 0 (48) | 0 (93) |
| solo gettone | en | 0 (103) | 0 (43) | 0 (247) | 0 (318) | 0 (110) | 0 (60) | 0 (65) | 0 (110) |
| atto senza gettone, 24 / 58 / 76 / 92 | it | 0 (82) | 0 (16) | 0 (220) | 0 (291) | 0 (83) | 0 (33) | 0 (38) | 0 (83) |
| atto senza gettone, 24 / 58 / 76 / 92 | en | 0 (82) | 0 (16) | 0 (220) | 0 (291) | 0 (83) | 0 (33) | 0 (38) | 0 (83) |
| atto + gettone | it | 0 (5) | **61** (−61) | 0 (143) | 0 (214) | 0 (6) | **44** (−44) | **39** (−39) | 0 (6) |
| atto + gettone | en | 0 (22) | **44** (−44) | 0 (160) | 0 (231) | 0 (23) | **27** (−27) | **22** (−22) | 0 (23) |
| sconfitta | it / en | 0 (258) | 0 (199) | 0 (399) | 0 (469) | 0 (264) | 0 (216) | 0 (220) | 0 (264) |
| sconfitta + strada | it / en | 0 (77) | 0 (38) | 0 (238) | 0 (308) | 0 (103) | 0 (55) | 0 (59) | 0 (103) |

I quattro atti danno gli stessi numeri fra loro e nelle due lingue: i testi hanno
lunghezze diverse ma vanno a capo nello stesso numero di righe (testi letti nelle righe
JSON, campo `testo`). Atto + gettone è stato misurato due volte: con `riscossi: 1` (come
nel gioco vero, «1 gettone… Adesso hai 2 gettoni») e senza (2 gettoni, come la sonda di
PO-015): stessi numeri.

In tutte le 144 misure (più 16 e 30 di controllo):
- **sovrapposizioni** fra contenuto visibile e pulsanti: 0;
- **pulsanti fuori** dalla cornice o dalla finestra: 0;
- **errori in console** o `pageerror`: 0;
- Plinto nella sconfitta: 92-93 px su tutti i formati (O1 corretto);
- pulsanti: «Livello successivo · Torna ai livelli» nelle vittorie, «Riprova · Torna ai
  livelli» nella sconfitta, «Riprova · Livello successivo · Torna ai livelli» con la strada
  aperta (stessi in inglese).

Dove scorre, l'unica cosa sotto il bordo è sempre «Condividi il risultato» (`sottoBordo`:
`pl-condividi`), i pulsanti principali restano visibili.

### Lettura rispetto alle novità della 1.21.16

- **Mappa ridotta col gettone**: funziona come deciso. Col solo gettone 0 px ovunque,
  spazio libero minimo 26 px (360x640, it); a schermo c'è solo «5 di 100» con la barra
  (schermata `pub-en-gettone-1366x657.png`). Numeri uguali a quelli «dopo» di
  `RAPPORTO-PO-015.md`.
- **Sconfitta non compatta su PC bassi**: Plinto 93 px, nessuno scorrimento.
- **Atto chiuso senza gettone** (nuovo): 0 px ovunque, spazio libero minimo **16 px** a
  360x640, 33 px a 1366x657 (schermata `pub-it-atto-24-360x640.png`).
- **Atto + gettone**: scorre come già registrato in PO-016 (44 px a 1366x657, 39 a 1280x720,
  61 a 360x640). In inglese scorre di meno (27 / 22 / 44).
- **Normale**: 61 px a 360x640 e 2 px a 320x700, come nella 1.21.15 e in PO-015 («invariate
  prima/dopo»). Il 2 px a 320x700 è il rosso noto E2 del font del container
  (`docs/TESTING.md`).

## 3. Regressioni sul telefono: 1.21.15 (`e8dc0e8`) contro 1.21.16

Sonda `collaudo-1.21.16/sonda-telefono.mjs` (tocco, `isMobile`, densità 2, animazioni
spente, `Math.random` con seme fisso così la partita libera è la stessa nelle due build),
confronto `confronta-telefono.mjs`. Schermate: home, libera, sfida, mappa, apertura del
livello 1, livello in corso, **livello 1 giocato fino alla fine**, archivio; a 360x640,
390x844, 412x915. Tabella completa: `collaudo-1.21.16/confronto-telefono.md`.

| | 360x640 | 390x844 | 412x915 |
|---|---|---|---|
| scorrimenti uguali fra le due build | sì (8/8) | sì (8/8) | sì (8/8) |
| geometria di pulsanti, titoli, plancia, vassoio | identica (8/8) | identica (8/8) | identica (8/8) |
| pixel diversi, massimo | 130 (0,01 %) | 102 (0,01 %) | 91 (0,01 %) |
| errori in console | 0 | 0 | 0 |

Da dove vengono i pochi pixel diversi (riquadro delle differenze calcolato):
- **home**: x 200-206, y 596-605 a 360x640, cioè la cifra finale di «v1.21.16» nel piè di
  pagina. Atteso.
- **mappa, apertura, fine**: zona di Plinto. Ripetendo la sonda **due volte sulla stessa
  build 1.21.16** le differenze sono dello stesso ordine (fino a 343 px, 0,04 %): è
  l'animazione di Plinto, non un cambiamento fra versioni.

Scorrimenti presenti in **entrambe** le versioni (non regressioni): mappa (lista lunga,
voluto), apertura del livello a 360x640 (177 px), fine del livello a 360x640 (61 px),
archivio a 360x640 (17 px). Il «sovrapposto Condividi / Livello successivo» che la sonda
segnala a 360x640 è lo stesso nelle due build ed è un falso positivo: «Condividi» è dentro
l'area che scorre, tagliato dal suo bordo (si vede solo una striscia del bordo superiore
sopra il blocco dei pulsanti), non coperto.

**Nessuna regressione misurata sul telefono.**

## Difetti

Nessun difetto nuovo della 1.21.16. Una cosa vecchia emersa misurando un caso nuovo:

### T1 (testo, minore, c'era già nella 1.21.15): «dal 11»

Riproduzione: superati i livelli 11-23, vinci il 24. La fascia dell'atto dice «Tutti i
livelli **dal 11** al 24, superati.» (schermata `pub-it-atto-24-360x640.png`). In italiano
davanti a un numero che si legge con vocale ci vuole l'apostrofo: «dall'11», «dall'1». Il
testo è `src/i18n/it.js:442` (`attoFatti: 'Tutti i livelli dal {da} al {a}, superati.'`),
introdotto in `c65fe9e` (17 ottobre), identico nella 1.21.15. Capita a 2 atti su 7 (inizio
1 e 11); gli altri iniziano a 25, 41, 59, 77, 93 e «dal» è corretto. L'inglese
(«Every level from 11 to 24») è corretto.

Opzioni:
- A) **(consigliata)** scegliere la preposizione in base al numero (`dall'` per 1, 8, 11,
  18, 80-89…; per gli inizi di atto reali bastano 1 e 11), con una prova in
  `tests/lessico.test.js` o accanto, fatta fallire prima sul testo attuale.
- B) riformulare senza preposizione articolata: «Livelli da {da} a {a}: tutti superati.»
  Nessuna regola grammaticale da mantenere; cambia una frase che il giocatore vede.
- C) lasciare così (errore piccolo, 2 volte nel percorso).

## Osservazioni (non difetti)

- **O1 — margini sottili dentro il requisito.** Il requisito è «la fine del livello non
  scorre da 320x700 al portatile 1366x768» (`src/styles/app.css:901`). Fra i formati del
  requisito, atto + gettone in italiano ha solo **5 px** di spazio libero a 320x700 e
  **6 px** a 1366x768 e 1024x768; la fine normale **7 px** a 1366x657. Con un font più largo
  di Inter (Roboto su Android, Segoe UI su Windows) questi casi potrebbero scorrere.
  **Non posso confermarlo** senza misurare con quei font. Opzioni: A) **(consigliata)**
  aggiungerlo a PO-016, che riguarda proprio atto + gettone, e misurare con un font più
  largo (per esempio forzando Roboto nella sonda) prima di decidere; B) lasciare così.
- **O2 — atto + gettone a 360x640 scorre di 61 px** (44 in inglese) e la fine normale a
  360x640 di 61 px. 360x640 è sotto i 700 px del requisito: fuori dalla promessa, invariato
  dalla 1.21.15. Lo segnalo perché 360x640 è il formato più piccolo che il progetto prova
  altrove («la home non scorre a 360x640», `docs/DECISIONI.md`). Opzioni: A)
  **(consigliata)** nessuna azione ora, scriverlo in PO-016 come caso noto; B) estendere la
  regola della fine affollata ai telefoni bassi: cambio visibile, va deciso dal PO.
- **O3 — la sonda di PO-015 misurava atto + gettone con 2 gettoni**, un caso che nel gioco
  vero non capita (chi ha superato 2..10 ha già riscosso un gettone). Misurato: i numeri
  non cambiano. Nessuna azione sul gioco; la nuova sonda misura entrambi.
- **O4 — il gate non prova l'atto chiuso senza gettone**: `e2e-trionfo` prova l'atto 1
  (che col gettone coincide sempre: 10 superati) e il solo gettone. Il caso «atto senza
  gettone» (24, 58, 76, 92) oggi passa con 16 px di margine minimo, ma nessun controllo lo
  sorveglia. Opzioni: A) **(consigliata)** aggiungere a `e2e-trionfo` il caso atto 24 a
  320x700 e 360x640 (vincere il 24 richiede il giocatore di `src/sim`, come in questa
  sonda), registrato nel gate; B) lasciarlo alla sonda di collaudo; C) niente.

## Non posso confermarlo

- **Font e dispositivi veri**: tutto con Chromium del container e Inter. Android
  (Roboto, app da Google Play), Safari/WebKit, Firefox e Windows non provati.
- **Telefoni con le barre del browser**: i formati del telefono sono finestre intere, non
  ridotte dalle barre.
- **Livelli 58 e 76-92 giocati col dito**: la sonda trascina col mouse; il tocco vero è
  provato da `e2e-schermi` solo sul livello 1.
- **CI della 1.21.16**: letto da GitHub Actions durante il collaudo. «pubblica su Pages»
  è `success` per `8fa1d3e` (run 158) e `44bc0bf` (run 159). `verifica` (il gate completo)
  era ancora **in corso** per entrambi (run 161 e 162, partiti alle 07:04 e 07:06 UTC), e
  anche per `5db33a0` (run 160, partito alle 06:37). Il verdetto della CI sulla 1.21.16
  quindi **non posso confermarlo**: va riletto prima di chiudere il collaudo.

## File

- `collaudo-1.21.16/sonda-fine.mjs`, `sonda-telefono.mjs`, `confronta-telefono.mjs`: le
  sonde (non sono nel gate).
- `misure-fine.jsonl` (144 righe, sito pubblicato), `misure-fine-atto-gettone-reale.jsonl`,
  `misure-fine-arrivo-diretto.jsonl`, `confronto-telefono.md`, log delle due prove e2e.
- Schermate: `pub-it-atto-24-360x640.png`, `pub-it-atto+gettone-1366x657.png`,
  `pub-en-gettone-1366x657.png`.
