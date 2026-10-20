# Collaudo della 1.21.18 — «Nuova» dentro la card (PO-020) e «Gioca ›» (PO-021)

Sessione figlia di collaudo, 20 ottobre 2026, ramo `collaudo-1.21.18`. Nessuna modifica al
codice del gioco, ad `android/` o alla versione.

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
- CI su `main` al momento del collaudo (GitHub Actions, letta alle 22:0x UTC): «pubblica su
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

REGRESSIONI

## Difetti

DIFETTI

## Osservazioni (non difetti, decisioni del PO)

OSSERVAZIONI

## Che cosa non posso confermare

NONCONF

## Schermate

In `docs/sviluppo/collaudo-1.21.18/`: `home-libera-it-320x700.png` (nome su due righe),
`home-libera-it-360x640.png`, `home-libera-en-360x640.png`, `home-libera-it-PC1366x768.png`,
`conferma-360x640.png`, `home-sfida-finita-360x640.png` («Record 754» come testo).
