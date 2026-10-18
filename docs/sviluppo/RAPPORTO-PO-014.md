# Rapporto PO-014 — collaudo tablet e PC, senza cambiare il prodotto

Ramo `collaudo-schermi`, partito da `main` a `cc90a3b` (1.21.14). Versione non toccata,
CHANGELOG non toccato, `android/` non toccato, niente pubblicato su `main`.

Tutte le misure sono del Chromium del container (`/opt/pw-browsers/chromium-1194`) sulla
**build di produzione** (`npm run build`, `npx vite preview --port 4173`,
`PLINTO_E2E_URL=http://127.0.0.1:4173/ node tests/e2e/schermi.mjs`), con i font di ripiego
del container (`--pl-font` è una pila di font di sistema, `src/styles/tokens.css:93`). Su
un tablet o un PC veri i font possono essere diversi: vedi «Non posso confermarlo».

## In breve

| | cosa | dove |
|---|---|---|
| scenario nuovo | `tests/e2e/schermi.mjs`, `npm run e2e-schermi`, registrato nel gate | `package.json:54`, `tools/verifica-tutto.mjs:107` |
| difetti trovati | **uno**: la fine del livello scorre su PC e tablet bassi dove un telefono delle stesse misure non scorre | sotto, D1 |
| correzione | numero delle mosse a 50 px anche nella cornice bassa e nella colonna senza cornice | interruttore `NUMERO_MISURA_LA_CORNICE`, `src/ui/schermate/FineQuadro.jsx:43`; regola in `src/styles/app.css:926-935` |
| cambi di prodotto | nessuno fatto; cinque proposte per la madre | sotto, «Proposte» |
| CLAUDE.md | «IL GATE: 30 controlli» → 33 (su `main` erano già 32, contati dal gate stesso; con questo 33) | `CLAUDE.md:24` |

## Lo scenario

Formati (`tests/e2e/schermi.mjs`, `FORMATI`):

- tablet 768x1024, 1024x768, 1024x1366, 1366x1024, ognuno **due volte**: col mouse
  (densità 1) e col tocco vero (`hasTouch`, `isMobile`, `deviceScaleFactor: 2`);
- PC col mouse: 1366x768, 1920x1080, 1280x720;
- in più, non richiesti: **1366x768 e 1920x1080 con le barre del browser** (1366x657 e
  1920x969, circa 110 px in meno come i telefoni «con barre» di `impaginazione.mjs`).
  Il 1366x657 è importante: sotto i 720 px di altezza non c'è la cornice ma la colonna
  da 430 px (`src/styles/app.css`, «larghi ma bassi»), un ramo che nessuna prova apriva.

Schermate attraversate su ogni formato: home, partita libera, un pezzo **trascinato**
(col dito via eventi touch del protocollo CDP sui formati col tocco, col mouse sugli
altri), un pezzo appoggiato **da tastiera** (Tab fino ai pezzi, Invio, frecce, Invio),
menu della partita, sfida del giorno, mappa dei livelli, apertura del livello 1, livello 1
**giocato fino alla fine** (sequenza vincente calcolata col motore e rigiocata trascinando,
come `e2e-quadri`), fine del livello, come si gioca, statistiche, archivio.

Controlli su ogni schermata:

| controllo | come |
|---|---|
| nulla tagliato dalla cornice | ogni elemento visibile dentro `#root` e dentro la finestra; esclusi quelli dentro un contenitore che scorre (si raggiungono) e gli strati `position: fixed` (non li ritaglia la cornice, solo la finestra) |
| plancia quadrata e intera | larghezza = altezza ±1 px, 81 caselle, nessuna fuori dalla cornice |
| nessuno scorrimento orizzontale | documento e ogni contenitore che scorre |
| nessuno scorrimento verticale dove sul telefono non c'è | confronto con un **telefono grande quanto la cornice** di quel formato (vedi sotto), tolleranza 1 px |
| testi non sovrapposti | rettangoli veri delle righe di testo (`Range.getClientRects`), ritagliati sui contenitori che scorrono; sotto un velo a tutto schermo si guarda solo il velo |
| bersagli ≥ 44 px | sui formati col tocco; un bersaglio piccolo **anche** sul telefono di riferimento si elenca a parte e non fa fallire (non dipende dalla cornice) |
| errori in console = 0 | `console.error` e `pageerror` |

**Il riferimento è un telefono delle misure della cornice** (`corniceDi`,
`tests/e2e/schermi.mjs:91`): 430x920, 430x706, 430x662, 430x657, 430x891. La domanda della
prova è «la cornice rompe qualcosa che sul telefono funziona?». Il primo giro confrontava
tutto con un 390x844 e accusava la cornice di far scorrere l'apertura del livello a
1280x720 (92 px): falso, un telefono 430x662 scorre degli stessi 92 px (misura:
`scrollHeight` 576, `clientHeight` 484 in entrambi).

`PLINTO_SCHERMI=1366x768,1280x720` restringe il giro mentre si indaga. Durata del giro
completo sulla build: circa 5 minuti nel container.

## Esito: formato × schermata

Giro finale sulla build, interruttore acceso (`finale.log`, uscita 0):

| formato | home | libera | trascina | tastiera | menu | sfida | mappa | apertura | livello | fine livello | come si gioca | statistiche | archivio | console |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| tablet 768x1024 | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |
| tablet 768x1024 tocco | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |
| tablet 1024x768 | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok (prima: NO, 6 px) | ok | ok | ok | ok |
| tablet 1024x768 tocco | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok (prima: NO, 6 px) | ok | ok | ok | ok |
| tablet 1024x1366 | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |
| tablet 1024x1366 tocco | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |
| tablet 1366x1024 | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |
| tablet 1366x1024 tocco | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |
| PC 1366x768 | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok (prima: NO, 6 px) | ok | ok | ok | ok |
| PC 1920x1080 | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |
| PC 1280x720 | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok* (prima: NO, 50 px) | ok | ok | ok | ok |
| PC 1366x768 con barre (1366x657) | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok* (prima: NO, 54 px) | ok | ok | ok | ok |
| PC 1920x1080 con barre (1920x969) | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok | ok |

\* «ok» vuol dire «non peggio del telefono delle stesse misure»: a 1280x720 la fine del
livello scorre ancora di 40 px (telefono 430x662: 39) e a 1366x657 di 44 px (telefono
430x657: 44). È l'altezza, non la cornice: vedi la proposta P1.

## Difetti trovati

### D1 — la fine del livello scorre su PC e tablet bassi

La regola che porta il numero delle mosse da 60 a 50 px sui telefoni bassi
(`src/styles/app.css:923`, `@media (max-height: 720px) and (max-width: 719px)`) guarda la
**finestra**. Su PC e tablet non scatta mai, perché la finestra è larga:

- nella cornice: a 1366x768 la cornice è alta 706 px (92% di 768) come un telefono basso,
  ma la finestra è 768 → numero a 60 px;
- nella colonna senza cornice (finestre larghe e più basse di 720 px): la larghezza è
  1366 → numero a 60 px.

È lo stesso tipo di difetto della plancia tagliata dell'8 ottobre (un'unità che misura la
finestra invece della cornice, commento in `src/styles/app.css` al token
`--pl-plancia-max`).

Misura (sonda che gioca il livello 1 e legge `.pl-fine .pl-scroll`: `scrollHeight −
clientHeight`; altezza di `.pl-fine__numero`):

| formato | prima (numero 60 px) | dopo (numero 50 px) | telefono delle stesse misure |
|---|---|---|---|
| 1366x768 (cornice 430x706) | **6 px** da scorrere | 0 | 430x706: 0 |
| 1024x768 (cornice 430x706) | **6 px** | 0 | 430x706: 0 |
| 1280x720 (cornice 430x662) | **50 px** | 40 | 430x662: 39 |
| 1366x657 (colonna, nessuna cornice) | **54 px** | 44 | 430x657: 44 |
| 1920x969 (cornice 430x891) | 0 | 0 (numero resta a 60) | — |

L'1 px residuo a 1280x720 viene dal `padding-top: 2vh` di `.pl-fine .pl-scroll`
(`app.css:899`), che nella cornice vale 14,4 px invece di 13,2: sotto la tolleranza, non
corretto (correggerlo vorrebbe dire toccare la regola anche sul telefono).

Schermate: `docs/sviluppo/po014/fine-livello-1366x768-prima.png` (sotto il conteggio
«1 di 100» si vede il bordo del riquadro successivo tagliato dal pulsante) e
`…-dopo.png`; `fine-livello-1366x657-prima.png` e `…-dopo.png`.

## Correzione e prova rosso/verde

`NUMERO_MISURA_LA_CORNICE = true` (`src/ui/schermate/FineQuadro.jsx:43`) aggiunge alla fine
del livello la classe `pl-fine--misura-cornice`. La regola (`src/styles/app.css:926-935`):

```css
@media (min-width: 720px) and (min-height: 720px) and (max-height: 782px),
       (min-width: 720px) and (max-height: 720px) {
  .pl-fine--misura-cornice:not(.pl-fine--affollata) .pl-fine__numero { font-size: 50px; }
}
```

- 782 px: la cornice è il 92% della finestra, quindi è alta fino a 720 px per finestre fino
  a 782 px.
- `:not(.pl-fine--affollata)`: la fine affollata ha già il suo numero a 46 px
  (`app.css:928`) e non si tocca.
- **Sotto i 720 px di larghezza la regola non può scattare** (`min-width: 720px` in
  entrambi i rami): il telefono non cambia per costruzione. Misurati ad acceso: telefono
  430x706 0 px, 430x662 39 px, 430x657 44 px, 360x640 61 px, numero a 50 px come prima
  (regola `app.css:923`, che non è stata toccata). A interruttore spento i telefoni non li
  ho rimisurati con la sonda: nel giro spento i riferimenti sono passati senza errori.

| interruttore | `npm run e2e-schermi` sui formati 1024x768, 1366x768, 1280x720, 1366x657 | numeri |
|---|---|---|
| **spento** (`false`) | **rosso**, uscita 1, 5 difetti | 6 / 6 / 6 / 50 / 54 px (1024x768, 1024x768 tocco, 1366x768, 1280x720, 1366x657) |
| **acceso** (`true`) | **verde**, uscita 0 | 0 / 0 / 0 / 40 / 44 px |

Giro completo acceso su tutti i 13 formati: verde, uscita 0.

## La prova sa fallire (CLAUDE.md: «un controllo che non sa fallire non è un controllo»)

Ogni controllo è stato fatto fallire di proposito con CSS o codice **temporanei**, tolti
subito dopo (verificato: `grep -c SABOTAGGIO` = 0 su `app.css` e `main.jsx`).

| controllo | sabotaggio | esito |
|---|---|---|
| scorrimento verticale | interruttore spento | rosso (sopra) |
| tagliato dalla cornice, plancia intera | `--pl-plancia-max: min(99vw, 58vh)` nella cornice, cioè il difetto dell'8 ottobre | rosso a 1920x1080: «div.pl-plancia esce di 155px», «81 caselle, 27 fuori dalla cornice» |
| bersagli ≥ 44 px | `.pl-hud__menu` a 30x30 solo nella cornice | rosso sul tablet col tocco: «bersaglio di 30px: button.pl-hud__menu» |
| scorrimento orizzontale | primo figlio di `.pl-scroll` largo 700 px | rosso: «div.pl-scroll … 310px» su mappa, come si gioca, statistiche, archivio |
| testi sovrapposti | seconda voce del menu della home spostata di −150 px | rosso: «"Come si gioca" su "Statistiche" (52x17px)» |
| trascinamento col mouse | `.pl-tray { pointer-events: none }` nella cornice | rosso: «pezzi in mano 3 -> 3, caselle in anteprima 0»; anche la fine del livello non arriva |
| trascinamento col dito | lo stesso, sul tablet 1024x768 tocco | rosso: «col dito: il pezzo non si appoggia» |
| tastiera | (nessun sabotaggio) | è stata rossa nel primo giro per un errore della prova, vedi sotto |
| errori in console | `console.error(...)` in `src/main.jsx` | rosso su ogni formato |
| un passo che non riesce | la voce spostata copre «Come si gioca» e il clic va in timeout | rosso: «come-si-gioca: non ci si arriva», e il verdetto arriva lo stesso |

**Due controlli erano ciechi e sono stati corretti grazie al sabotaggio**:

1. *Testi sovrapposti*: la prima versione chiedeva a `elementFromPoint` se il testo era
   quello in vista nel suo punto. Di due testi sovrapposti, quello sotto risultava
   «coperto» e si scartava: la coppia non veniva mai confrontata. Ora si scarta solo ciò
   che sta sotto uno strato fisso a tutto schermo (il velo del menu).
2. *Un passo che non riesce* faceva cadere lo script senza tabella né elenco: ora ogni
   schermata è un passo (`passo`, `tests/e2e/schermi.mjs:455`), e un fallimento diventa un
   difetto di quella schermata.

**Falsi rossi del primo giro, corretti nella prova e non nel gioco** (per trasparenza):

- confronto con un 390x844 invece che con un telefono grande quanto la cornice (sopra);
- velo del menu `position: fixed` contato come «tagliato»: copre tutta la finestra, si
  vede, non manca niente;
- tastiera: il cursore si muoveva verso il centro, occupato dal pezzo appena trascinato;
  un Invio su caselle piene non appoggia niente per regola. Ora va nell'angolo in alto a
  sinistra;
- pezzo appoggiato contato dalle caselle piene: la libera parte con la griglia seminata e
  una mossa che chiude un gruppo ne svuota di più (a 430x662 «Griglia pulita!», 715 punti).
  Ora si conta il vassoio;
- testo nascosto in un contenitore che scorre (il paragrafo sotto «Come fare»
  nell'apertura) preso per sovrapposto al pulsante Gioca: ora ogni riga si ritaglia sui
  contenitori.

## Osservazioni che non sono difetti (nessun cambio)

- **Plancia nella cornice** (sonda, partita libera): 426 px nella cornice 430x920 come sul
  telefono 430x920; 403 px a 1366x768 contro 409 su un telefono 430x706; 366 a 1280x720
  contro 374 su 430x662. Quadrata e intera ovunque.
- **Quanto spazio prende la cornice**: 19% della finestra a 1920x1080, 28% a 1024x1366,
  29% a 1366x768, 50% a 768x1024 (schermata `po014/pc-1920x1080-home.png`,
  `po014/tablet-1024x1366-partita.png`). È la scelta documentata in `app.css` («schermi
  grandi»); vedi P2.
- **Velo del menu**: copre tutta la finestra, anche fuori dalla cornice; il pannello resta
  centrato sulla cornice. Vedi P5.
- **Bersagli sotto 44 px anche sul telefono** (non dipendono dalla cornice, la prova li
  elenca senza fallire): «Sostieni il progetto» e «Idee e segnalazioni» nel piè della home
  27 px; la pastiglia vuota degli attrezzi nel livello 38 px; i giorni del calendario
  dell'archivio 43 px. Vedi P4.

## Non posso confermarlo

- **Dispositivi veri**: tutto è misurato in Chromium emulato. iPad (Safari/WebKit) e
  Firefox non sono provati; WebKit non è installato nel container.
- **Font**: il gioco usa i font di sistema; quelli del container non sono quelli di
  Windows, macOS, iPadOS o Android. Le misure al pixel (6 px, 40 px, 44 px) possono
  cambiare.
- **L'altezza vera della finestra su PC**: 1366x657 e 1920x969 sono una stima (circa 110 px
  di barre). Dipende da browser, sistema, barra dei preferiti, scala dello schermo.
- **Scala dello schermo di Windows** (125%, 150%) e zoom del browser: non provati. A 1366x768
  con scala 125% la finestra CSS è circa 1093x614 meno le barre, quindi colonna senza
  cornice: ragionevolmente coperta dal formato 1366x657, ma non misurata.
- **L'app installata da Google Play su un tablet** (TWA) con `orientation: portrait`
  (`public/manifest.webmanifest:8`): come si comporta in orizzontale su un tablet Android
  non si può misurare qui.
- **Rotella del mouse con le barre nascoste** (`#root * { scrollbar-width: none }`): lo
  scorrimento con la rotella non è provato da questo scenario.
- **Un rosso non riprodotto**: nel secondo giro il trascinamento col mouse a 1024x1366 ha
  dato «caselle piene 0 -> 0» una volta. Non si è ripresentato in 3 giri successivi né in
  20 ripetizioni dedicate (sonda: 0 fallimenti su 20). La schermata di quel giro mostrava
  griglia vuota e il pezzo 3x3 nel primo posto. Non so dire se fosse un difetto o un
  effetto della prova (allora contava le caselle).
- **Schermate non coperte**: fine della partita libera, festa finale (Trionfo), profilo,
  impostazioni, info, sostieni, guida al primo avvio su tablet e PC.

## Proposte per la madre (cambi di prodotto: non fatti)

**P1 — La fine del livello scorre su finestre basse (≤ ~700 px), anche su PC.**
Misurato: 40 px a 1280x720, 44 px a 1366x657, cioè un portatile 1366x768 con le barre del
browser, il PC più comune. Il requisito del proprietario (commento in `app.css:900`) dice
«fino al portatile da 1366x768», misurato a finestra intera senza barre.
- A) Lasciare così e scrivere nel requisito che la misura è a finestra intera.
- B) Fine del livello compatta sotto i ~700 px di altezza **ovunque** (Plinto piccolo come
  nella fine affollata, margini più stretti): vale anche per i telefoni bassi, quindi
  cambia l'impaginazione da telefono.
- C) **(consigliata)** La stessa compattazione **solo sopra i 720 px di larghezza**
  (cornice bassa e colonna): risolve il PC senza toccare il telefono, con un interruttore
  come D1. I telefoni bassi restano come oggi, che e2e-quadri accetta fino a 320x700.

**P2 — Su tablet grandi e monitor la cornice è piccola** (19-29% della finestra).
- A) **(consigliata ora)** Lasciarla: il gioco è pubblico, la stabilità viene prima, e la
  cornice funziona su tutti i formati provati.
- B) Ingrandire la cornice in proporzione sugli schermi molto grandi (per esempio fino a
  1,25×), con le stesse distanze relative: da misurare con questo scenario.
- C) Un'impaginazione orizzontale dedicata (plancia grande e pannello a lato): cambia che
  cosa è il gioco su tablet; da progettare.

**P3 — Orientamento** (`public/manifest.webmanifest:8`, `"portrait"`). La pagina in
orizzontale funziona (1024x768 e 1366x1024 verdi), ma l'app installata è bloccata in
verticale.
- A) Lasciare `portrait`.
- B) Passare a `any` per i tablet: le misure del browser dicono che regge, ma il
  comportamento della TWA non è misurato.
- C) **(consigliata)** Provare prima su un tablet Android vero l'app di Google Play in
  orizzontale (con l'attuale `portrait`) e decidere dopo; `android/` non va toccato senza
  questa prova.

**P4 — Bersagli piccoli identici sul telefono** (27, 27, 38, 43 px).
- A) Lasciarli: non sono di PO-014.
- B) **(consigliata)** Una voce a parte: portarli a 44 px misurando con
  `npm run impaginazione` e `npm run home-spiegazione`, perché la home a 360x640 è già al
  limite (vedi `RAPPORTO-PO-010-G1.md`).
- C) Allargare solo l'area toccabile (padding trasparente) senza cambiare il disegno: da
  misurare che non faccia scorrere la home.

**P5 — Il velo del menu copre tutta la finestra su PC.**
- A) **(consigliata)** Lasciarlo: si legge come «il gioco è in pausa», non nasconde niente.
- B) Limitarlo alla cornice (velo dentro `#root`): coerente con la cornice, ma tocca il
  menu anche sul telefono se fatto male; da provare con questo scenario.

## Gate

`npm run build`: verde.

`npm run verifica -- --veloce`: la corsia veloce è stata **negata** dallo strumento
(«non risulta nessun giro completo passato su questa macchina»), quindi è girato il giro
completo, 4935 s. Ultima riga del registro (`verifica.log`, non versionato):

```
2 controlli su 33 sono falliti. NON pubblicare.
```

31 verdi, compresi i cento livelli (3411 s) e il nuovo «tablet e PC: ogni schermata nella
cornice» (441 s, sul server di sviluppo). I due rossi, verificati su `main`:

| controllo | rosso sul ramo | stesso controllo su `main` (`cc90a3b`, build e preview separate in un worktree, stesso container) |
|---|---|---|
| `e2e-quadri` | fine del livello (vittoria) a **320x700**: 2 px da scorrere | 320x700: 2 px **e 1366x768: 6 px** |
| `recensione` | a 360x640 l'invito finisce 10 px sotto la barra dei pulsanti | identico: 360x640, 10 px |

- Entrambi sono su formati da telefono (sotto i 720 px di larghezza), dove la correzione di
  questo ramo non può scattare: c'erano già su `main`. Dipendono dal font del container?
  **Non posso confermarlo** qui: è l'ipotesi del mandato, coerente con il commento di
  `ATTO_CHIUSO_COMPATTO` in `FineQuadro.jsx` («dipende dal font»), ma non l'ho misurato
  con un altro font.
- Su `main` `e2e-quadri` vede **anche** il 1366x768 a 6 px: è D1, trovato da una prova già
  esistente e sparito su questo ramo. Il commento in `app.css:900` dice che a 1366x768 la
  fine del livello entra, ma nel container su `main` non entra.
- Il verdetto che conta è quello della CI (CLAUDE.md): questo ramo non l'ha avuta, perché non
  è su `main`.
