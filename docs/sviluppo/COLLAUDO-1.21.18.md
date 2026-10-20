# Collaudo della 1.21.18 — «Nuova» dentro la card (PO-020) e «Gioca ›» (PO-021)

Sessione figlia di collaudo, 20 ottobre 2026, ramo `collaudo-1.21.18`. Nessuna modifica al
codice del gioco, ad `android/` o alla versione.

## In breve

- **Verde.** `home-spiegazione` e le quattro regressioni passano contro il sito pubblicato;
  200 prove a mano (180 con un esito atteso, 20 solo per misurare): nessuna è andata male.
- **Nessun difetto nuovo.** Un difetto **preesistente** di accessibilità (D1: chiusa la
  conferma, il fuoco va su `<body>`; identico sulla 1.21.17).
- **Tre osservazioni** per il PO: O1 (a 320x700 in italiano la riga sotto «Nuova» è metà
  «Nuova» e metà «Riprendi»), O2 («Gioca ›» non è nel nome accessibile), O3 (riga di
  spiegazione forse letta due volte).
- **Non confermato**: il verdetto della CI sulla 1.21.18 (ancora in corso alle 22:13 UTC).

## Che cosa ho collaudato

- **Il sito pubblicato** `https://antoniovairo-rgb.github.io/Plinto/`. Il Chromium del
  container accetta il certificato del proxy: non è servita la build locale come ripiego.
- Il bundle pubblicato è `assets/index-D7Fyc7j4.js` e contiene la stringa `1.21.18`
  (4 occorrenze, `grep -o` sul file scaricato) e `Gioca ›`.
- La build locale di `main` (`5e84573`, `npx vite build`) produce **lo stesso nome di
  file**, `index-D7Fyc7j4.js`: il contenuto che ho provato è quello di `main`.
- Container: Chromium 1194 in `/opt/pw-browsers`, Playwright 1.63.0, font di sistema
  **Inter** (`fc-match sans-serif`). Le misure al pixel valgono per questo font: vedi
  docs/TESTING.md, «Due rossi noti nei container delle sessioni figlie».
- CI su `main` al momento del collaudo (GitHub Actions, letta alle 21:58 e di nuovo alle 22:13 UTC): «pubblica su
  Pages» **verde** su `40f906f` e `5e84573`; «verifica» **ancora in corso** su tutti e due
  (avviate alle 21:34 e 21:36 UTC). Verde su `65f96d6` (PO-021). Il verdetto della CI sulla
  1.21.18 **non posso confermarlo** da qui: non era ancora finita.

## 1. `npm run home-spiegazione` contro il sito pubblicato

`PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/ npm run home-spiegazione` →
**verde** (uscita 0), 80 righe di tabella: 8 formati × 5 stati × 2 lingue.

| Misura | Esito |
|---|---|
| La home scorre? | 0 px in tutti gli 80 casi |
| Spazio libero minimo | **6 px**: it 320x700, stati `libera` e `tutte` (la card della libera è alta 68) |
| Altezza card libera con «Nuova» | 52 px ovunque, tranne **68 px** in it 320x700 (il nome va su due righe, già scritto in RAPPORTO-PO-020, scelta aperta 1) |
| «Nuova»: pillola / bersaglio | 17 / 46 px in tutti i formati |
| Contrasto della riga di spiegazione | 6.35 e 8.097 (minimo richiesto 4.5) |
| Collegamenti in fondo | 27 e 27 px (B10 chiede 24) |
| Stato della sfida senza partita | «Gioca ›» / «Play ›» |

Nota: il tocco su «Nuova» e sul nome della card in questo script è un **clic del mouse**
(`page.mouse.click`). Le prove col dito sono al punto 2.

## 2. Prove a mano (col tocco)

Script: `docs/sviluppo/collaudo-1.21.18/prove-a-mano.mjs` (risultati grezzi in
`prove-a-mano.json`, 200 casi). Telefoni: `isMobile`, `hasTouch`, `deviceScaleFactor 2`,
tocco con `page.touchscreen.tap`. PC: 1366x768, mouse. Ogni caso parte da una pagina
nuova con `localStorage` preparato. «Riprende» vuol dire: schermata di gioco **con lo
stesso seme e le stesse caselle piene** della partita salvata; «nuova» vuol dire seme
diverso.

### 2a. «Nuova», «Riprendi ›», conferma

| Caso | it 320 | it 360 | it 390 | it 412 | it PC | en (5 formati) |
|---|---|---|---|---|---|---|
| «Nuova» a 0 mosse | nuova partita, senza conferma | = | = | = | = | = |
| «Nuova» con 1 mossa | conferma «La partita libera è a metà.» + «Se inizi una nuova partita, perdi le mosse fatte in quella a metà.»; fuoco su «Riprendi la partita» | = | = | = | = | = (testo inglese, fuoco su «Resume game») |
| conferma → «Riprendi la partita» | riprende | = | = | = | = | = |
| conferma → «Nuova partita» | nuova partita | = | = | = | = | = |
| tocco sulla pillola «Riprendi ›» | riprende | = | = | = | = | = |
| tocco sul nome «Partita libera» | riprende | = | = | = | = | = |
| tocco nello spazio fra nome e «Nuova» | riprende | = | = | = | = | = |

«=» significa: lo stesso esito della prima colonna. **40 casi su 40 come atteso.**

### 2b. La riga di spiegazione: dove arriva il tocco?

| Punto toccato | it 320x700 | it 360/390/412, PC | en (5 formati) |
|---|---|---|---|
| riga, a sinistra (sotto il nome) | riprende | riprende | riprende |
| riga, sotto «Riprendi ›» | riprende | riprende | riprende |
| **riga, sotto «Nuova»** (centro della riga) | **riprende** | **conferma della nuova partita** | **conferma della nuova partita** |
| bordo basso della card (2 px sopra), sotto «Nuova» | riprende | riprende | riprende |

Scansione verticale (ogni 2 px, `elementFromPoint`) sulla colonna di «Nuova»:

| Formato | Card (y, altezza) | Riga di spiegazione (y) | Fascia che va a «Nuova» | Fascia che va a «Riprendi ›» sotto |
|---|---|---|---|---|
| it 360x640 | 243, 52 | 272–287 | 245–289 | 291–295 |
| en 320x700 | 266, 52 | 295–310 | 268–312 | 314–318 |
| **it 320x700** | 258, **68** | **305–320** | 268–312 | **314–326** |

A it 320x700 la card è alta 68 ma il bersaglio di «Nuova» è fisso (`inset: -7px -3px
-21px`, `src/styles/app.css`): copre solo la **metà alta** della riga di spiegazione sotto
la pillola. Il resto della riga, sotto la stessa parola, riprende. Vedi O1.

### 2c. Tastiera

Ordine dei fuochi con Tab dall'inizio della pagina (uguale in tutti i formati e nelle due
lingue; ogni fuoco con `:focus-visible`):

> Livello 1 → Mappa dei livelli, 0 di 100 → **Nuova partita libera** → **Partita libera,
> riprendi la partita in corso** → Sfida del giorno → Archivio delle sfide → Come si gioca →
> Statistiche → Il tuo profilo di gioco → Impostazioni → Info → Sostieni il progetto

| Caso | Esito (10 combinazioni) |
|---|---|
| Invio su «Nuova» (1 mossa) | conferma; fuoco su «Riprendi la partita» |
| Esc sulla conferma | si chiude, resta la home; **il fuoco va su `<body>`** (vedi D1) |
| Invio su «Riprendi ›» | riprende; anello del fuoco sul `::after` (la card intera): `outline-style: solid` |

### 2d. Lettore di schermo (albero di accessibilità, `ariaSnapshot`)

it 360x640, libera a metà (identico negli altri formati):

```
- button "Livello 1"
- button "Mappa dei livelli, 0 di 100": Mappa dei livelli 0 di 100
- button "Nuova partita libera": Nuova
- button "Partita libera, riprendi la partita in corso": Riprendi ›
- text: "Senza livelli: gioca finché i pezzi entrano"
- button "Sfida del giorno": Sfida del giorno Gioca › Nuova ogni giorno, parte uguale per tutti
- button "Archivio delle sfide"
```

en: `"New free game": New`, `"Free play, resume the game in progress": Resume ›`,
`"Daily challenge": Daily challenge Play › …`. La descrizione (`aria-describedby`) di
«Riprendi ›» è la riga di spiegazione. Il nome «Partita libera» visibile è `aria-hidden`
e arriva solo dentro il nome di «Riprendi ›»; la riga di spiegazione compare **sia** come
descrizione **sia** come testo a sé (un lettore la può leggere due volte: non l'ho
ascoltata con un lettore vero, **non posso confermarlo**). Il nome accessibile della card
della sfida da fare è solo «Sfida del giorno»: **non contiene «Gioca»** (vedi O2).

### 2e. Sfida del giorno

| Caso | Esito (it e en, 5 formati) |
|---|---|
| Nessuna sfida: la card | «Gioca ›» / «Play ›», pillola (classe `--riprendi --evidenza --gioca`) |
| Tocco su «Gioca ›» | schermata di gioco; partita salvata con `seedLabel` **2026-10-20** (oggi); in testa «Sfida di oggi, 20 ottobre» |
| Aperta senza mosse, poi Indietro | home, la card dice «Riprendi ›» |
| Iniziata (partita salvata a metà) | «Riprendi ›»; nome «Sfida del giorno, riprendi la sfida in corso» |
| **Finita** (ultima mossa giocata davvero, fine partita) | registrata `{best: 754, partite: 1}`; la card dice «Record 754» / «Best 754», **testo e non pillola** (classe `pl-sfida-avvio__esito` sola, fondo `rgba(0, 0, 0, 0)`); nome «Sfida del giorno, Record 754» |

Come ho finito la sfida: in Node ho giocato la sfida di oggi col motore (primo posto
libero) fino alla fine, ho salvato lo stato **prima dell'ultima mossa** e l'ultima mossa
l'ho trascinata nel browser. Il trascinamento è col **mouse anche nei formati telefono**:
il mio primo tentativo col dito (eventi touch del protocollo, mira calcolata come in
`tests/e2e/schermi.mjs` per il mouse) non ha appoggiato il pezzo (punteggio fermo a 751).
Non ho indagato: è quasi certamente la mia mira, non il gioco (il trascinamento col dito è
coperto da `npm run e2e-schermi`), ma **non posso confermarlo**.

## 3. Regressioni (contro il sito pubblicato)

Tutte con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`, una dopo l'altra,
nessun `vite` acceso.

| Controllo | Esito | Durata | Ultima riga |
|---|---|---|---|
| `npm run e2e-po008` | **verde** (uscita 0) | 97 s | «Tutto a posto.» |
| `npm run correzioni` | **verde** (uscita 0) | 25 s | «Tutto a posto: le correzioni del collaudo tengono.» (C1: 0 px; senza correzione 4 px) |
| `npm run impaginazione` | **verde** (uscita 0) | 59 s | «La home entra su tutti i formati provati…» (18 righe «ok») |
| `npm run e2e-schermi` | **verde** (uscita 0) | 522 s | «Tutto a posto su 13 formati.» |

Contro il sito pubblicato i casi B6 di `correzioni` e O di `e2e-po008`, quelli del doppio
effetto del server di sviluppo (PO-019), girano sulla build di produzione: non provano il
caso del server di sviluppo. Quello lo prova la CI.

## Difetti

Nessun difetto **nuovo** della 1.21.18: tutto ciò che PO-020 e PO-021 promettono si
comporta come scritto, col dito, col mouse e con la tastiera, in italiano e in inglese.

### D1 (preesistente, accessibilità, minore) — chiusa la conferma, il fuoco finisce su `<body>`

- **Riproduzione**: home con una libera a metà; Tab fino a «Nuova», Invio: si apre la
  conferma, fuoco su «Riprendi la partita» (corretto). Esc, oppure clic sul velo: la
  conferma si chiude e `document.activeElement` è `<body>`. Il Tab successivo riparte da
  «Livello 1», non da «Nuova».
- **Misura**: identico sulla **1.21.17** (build di `12cd5b1` servita con `vite preview`,
  partendo dal collegamento «Nuova partita libera» di allora) e sulla 1.21.18 pubblicata:
  non è una regressione. `ConfermaPerdita` (`src/ui/ConfermaDoppia.jsx:91`) mette il fuoco
  sul pulsante sicuro all'apertura ma non lo restituisce alla chiusura.
- **Peso**: chi usa la tastiera o un lettore di schermo perde il punto in cui era; nessuna
  mossa si perde.
- **Opzioni**:
  - **A (consigliata)**: alla chiusura senza scelta (Esc, velo) il fuoco torna al
    pulsante che ha aperto la conferma. Vale per tutte le conferme che usano
    `ConfermaPerdita`; si prova aggiungendo il caso a `npm run e2e-po008`.
  - B: lasciare così, fino a un giro sull'accessibilità di tutte le finestre.
  - C: correggere solo per «Nuova» della home.

## Osservazioni (non difetti, decisioni del PO)

### O1 — A 320x700 in italiano la riga di spiegazione sotto «Nuova» è divisa a metà

- **Misura** (tabella 2b): la card è alta 68 (nome su due righe, scelta aperta 1 di
  RAPPORTO-PO-020), ma il bersaglio di «Nuova» scende sempre di 21 px. Sulla riga
  «Senza livelli: gioca finché i pezzi entrano», sotto la parola «Nuova», i primi ~8 px
  aprono la conferma della nuova partita e gli ultimi ~7 px riprendono. Negli altri nove
  casi tutta la riga sotto «Nuova» va a «Nuova», e solo gli ultimi 4–6 px della card
  riprendono.
- **Peso**: basso. In nessun caso si perde una partita senza domanda: con almeno una mossa
  c'è la conferma, a zero mosse non c'è niente da perdere. Ma lo stesso punto della riga
  fa due cose diverse a seconda del millimetro.
- **Opzioni** (si legano alla scelta aperta 2 di RAPPORTO-PO-020):
  - **A (consigliata)**: lasciare così finché il PO non decide sulla scelta 2; se sceglie
    la A di quel rapporto, questa è una conseguenza accettata e va scritta lì.
  - B: bersaglio di «Nuova» che arriva fino al bordo basso della card (in tutti i formati):
    tutta la colonna sotto «Nuova» fa la stessa cosa.
  - C: bersaglio solo sulla riga del nome (la B di quel rapporto): la riga di spiegazione
    riprende sempre, ma «Nuova» scende sotto i 44 px.

### O2 — «Gioca ›» non è nel nome accessibile della card della sfida

- **Misura** (2d): nome «Sfida del giorno»; il testo visibile è «Sfida del giorno Gioca ›».
  Con la sfida iniziata il nome dice invece «…, riprendi la sfida in corso», e con la libera
  in corso «…, riprendi la partita in corso». Era così anche con «Da giocare» (stesso
  `nomeSfida` in `src/ui/schermate/Home.jsx`), ma ora «Gioca ›» è disegnato come un
  pulsante: chi usa il comando vocale e dice «tocca Gioca» non lo trova. Non l'ho provato
  con un comando vocale vero: **non posso confermarlo**.
- **Opzioni**:
  - **A (consigliata)**: con la sfida da fare il nome diventa «Sfida del giorno, gioca la
    sfida di oggi» (stessa forma degli altri due stati); va in `home-spiegazione`.
  - B: lasciare così: il nome attuale contiene già la parte principale dell'etichetta.

### O3 — La riga di spiegazione della libera è sia descrizione sia testo

Con la libera in corso la riga è `aria-describedby` di «Riprendi ›» e resta anche un
testo a sé nell'albero (2d). Un lettore di schermo può leggerla due volte. Non l'ho
ascoltata: **non posso confermarlo**. Proposta: A (consigliata) verificarlo con TalkBack
sul telefono prima di cambiare qualcosa; B renderla `aria-hidden` lasciandola come
descrizione.

## Che cosa non posso confermare

- **Il verdetto della CI** sulla 1.21.18: alle 22:13 UTC «verifica» era ancora in corso su
  `40f906f` e `5e84573`.
- **Telefoni veri, TalkBack, comando vocale**: ho usato Chromium con l'emulazione del tocco
  (`isMobile`, `hasTouch`); niente dispositivo, niente lettore di schermo che parla.
- **L'app Android (TWA)**: non provata; secondo il changelog riceve il sito da sola.
- **Le misure al pixel con altri font**: qui il font è Inter. La card a 68 px in it 320x700
  è coerente col RAPPORTO-PO-020 (misurato con un altro font del container), ma su un
  telefono con un altro font il nome potrebbe stare su una riga sola o no.
- **Perché il mio trascinamento col dito non ha appoggiato l'ultimo pezzo** (2e).

## Schermate

In `docs/sviluppo/collaudo-1.21.18/`: `home-libera-it-320x700.png` (nome su due righe),
`home-libera-it-360x640.png`, `home-libera-en-360x640.png`, `home-libera-it-PC1366x768.png`,
`conferma-360x640.png`, `home-sfida-finita-360x640.png` («Record 754» come testo).
