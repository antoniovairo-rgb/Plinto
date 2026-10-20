# PO-020 — «Nuova» dentro la card della Partita libera

Decisione del PO: «Dentro la card». Ramo `nuova-libera-card`, nessun cambio di versione.

## Che cosa cambia

Prima (PO-010): con una partita libera in corso la card era un solo `<button>` con
«Partita libera … Riprendi ›», e sotto c'era un collegamento sottolineato «Nuova partita
libera» (`.pl-home__nuova-libera`, alto 28 px).

Dopo: con la libera in corso la card è un **contenitore** (`<div>`) con lo stesso disegno,
e sulla riga del nome ci sono **due pulsanti fratelli**: «Nuova» (pillola secondaria:
fondo appena chiaro, filo chiaro, testo della card, non sottolineata) e «Riprendi ›»
(la pillola d'ottone di prima, `RIPRENDI_IN_EVIDENZA` + `PILLOLA_ALLINEATA`). Il
collegamento sotto la card non c'è più. Senza partita in corso la card è il pulsante
unico di sempre.

- **HTML valido**: nessun `<button>` dentro un `<button>` (controllato: `button button`
  conta 0 in tutti gli stati e formati).
- **Tocco sulla card = riprendi**: la superficie di «Riprendi ›» (`::after`,
  `position: absolute; inset: 0`) copre tutta la card; «Nuova» le sta sopra (`z-index: 1`).
- **Nome accessibile**: «Riprendi ›» porta `aria-label` «Partita libera, riprendi la
  partita in corso» e `aria-describedby="pl-spiega-libera"`, come la card di prima: i
  selettori `/^Partita libera, riprendi/` dei test restano validi. Il nome visibile della
  card è `aria-hidden` (lo dice già il nome accessibile, altrimenti sarebbe letto due volte).
  «Nuova» ha `aria-label` «Nuova partita libera» (en «New free game»): inizia con la
  scritta visibile, come chiede WCAG 2.5.3.
- **Conferma H1**: «Nuova» chiama lo stesso `onGioca` di prima, cioè `iniziaNuova` in
  `src/ui/App.jsx:184`, che con almeno una mossa apre la conferma «La partita libera è a
  metà» (`CONFERMA_NUOVA_LIBERA`). Provato col tocco vero (sotto).
- **Etichetta**: «Nuova» / «New» (chiave nuova `home.nuovaBreve`). «Nuova partita» non sta
  sulla riga (vedi misure); dentro una card che si chiama «Partita libera» la parola
  «partita» si ripeterebbe. `tests/lessico.test.js` non ha regole su queste parole ed è
  verde.
- **Interruttore**: `NUOVA_DENTRO_LA_CARD` in `src/ui/schermate/Home.jsx`; spento torna il
  collegamento della PO-010.
- L'aiuto (`ComeSiGioca.jsx`) non citava il collegamento: niente da riscrivere.

## Misure (Chromium del container, font di ripiego, `npm run home-spiegazione`)

Larghezza della riga del nome a 16 px (prima prova): nome «Partita libera» ≈ 110-115 px,
«Nuova» 71, «Riprendi ›» 100, spazi 18 → ≈ 304 px, contro 276 disponibili a 360 px e 236
a 320. Il nome andava a capo e la card cresceva a 68 px. Con pillole a 14 px
(padding 0.5em, spazio fra le pillole 6, fra nome e pillole 8): «Nuova» 59.5 × 17 px,
«Riprendi ›» 84.7 × 17, gruppo 150.2 px (it) / 133.7 (en). A 360 px avanzano ≈ 8 px in
italiano. **A 320 px in italiano il nome va comunque su due righe** e la card è alta 68.

Bersaglio di «Nuova»: la pillola è alta 17 px, il `::before` la estende a **46 px**
(misurati con `elementFromPoint` pixel per pixel lungo la verticale), dentro la card.

Spazio verticale avanzato nella home («libero», px; negativo = scorre), stato `libera`:

| formato | prima (collegamento) it / en | dopo (dentro la card) it / en | card libera dopo |
|---|---|---|---|
| 320x700 | **−10 / −26** (scorre) | 6 / 6 | 68 it, 52 en |
| 360x640 | 4 / 4 | 32 / 32 | 52 |
| 360x800 | 83 / 83 | 115 / 115 | 52 |
| 390x844 | 123 / 123 | 155 / 155 | 52 |

Il «prima» è la stessa prova con l'interruttore spento. A 320x700 la forma vecchia
scorreva già (anche nello stato `tutte`, di 10 px); la nuova no. A 320x700 en, stato
`libera`, la card della **Sfida** è alta 68 perché «Daily challenge» + «Not played yet»
vanno a capo: non dipende da questa modifica (c'è uguale con l'interruttore spento).
Font diverso da quello del container → misure diverse di qualche pixel: **non posso
confermarle su un telefono vero**.

## Prova rosso / verde

`tests/e2e/home-spiegazione.mjs`, esteso: formati 320x700 e 360x800 in più; controlli
nuovi: niente collegamento sotto la card, nessun pulsante sottolineato fra le azioni,
«Nuova» e «Riprendi ›» dentro i bordi della card e sulla stessa riga (Nuova a sinistra),
nessun `<button>` annidato, bersaglio di «Nuova» ≥ 44 px, tocco sul nome della card che
arriva a «Riprendi ›», e due tocchi veri: «Nuova» con una mossa fatta apre la conferma H1,
il tocco sul nome riprende la partita.

- Acceso: **verde** (uscita 0), 8 formati × 5 stati × 2 lingue.
- Spento (`NUOVA_DENTRO_LA_CARD = false`): **rosso** (uscita 1, 101 righe di errore:
  «sotto la card c'è ancora il collegamento», «pulsanti sottolineati», «la card non ha il
  pulsante Nuova», e a 320x700 «la home scorre di 10/26 px»).

`tests/e2e/ripresa-livello.mjs` cercava `.pl-home__nuova-libera`: ora cerca
`.pl-sfida-avvio__nuova, .pl-home__nuova-libera` (funziona in tutte e due le forme).

## Schermate

`docs/sviluppo/po020/prima-*.png` e `dopo-*.png`: stati `libera` e `tutte` a 360x640 e
390x844 in italiano, più `libera` en a 360x640.

## Scelte aperte (per il PO)

1. **A 320 px in italiano il nome va su due righe** (card 68 px, la home non scorre).
   - A (consigliata): lasciare così; riguarda solo telefoni larghi 320 px.
   - B: a ≤ 340 px pillole a 13 px e nome a 15 px: probabilmente sta su una riga, ma la
     card diventa diversa dalle altre. Non misurato.
   - C: a ≤ 340 px «Riprendi ›» diventa «›» soltanto: perde la parola che PO-010 ha voluto.
2. **Bersaglio di «Nuova»**: per arrivare a 44 px scende sulla riga di spiegazione, sotto
   la pillola. Un tocco lì comincia una nuova partita, con la conferma se la libera è a
   metà, quindi nessuna mossa si perde senza chiedere.
   - A (consigliata): lasciare così.
   - B: bersaglio alto quanto la sola riga del nome (circa 24 px): niente sovrapposizioni,
     ma sotto i 44 px.
3. **Changelog**: la versione non è cambiata, quindi non c'è la voce. Testo proposto per
   la prossima: «Con una partita libera in corso, "Nuova" sta dentro la card accanto a
   "Riprendi ›", al posto del collegamento sottolineato sotto (PO-020).»

## Effetto su C1 (`tests/e2e/correzioni.mjs`)

C1 prova che i 4 px della correzione `pl-home-stretta` servono: «senza la correzione la
home deve scorrere». Con i 28 px liberati da PO-020 il caso peggiore (pie' su due righe,
libera in corso, 360x640) non scorre più nemmeno senza correzione, e la prova diventava
rossa per «non prova nulla». Ora riempie apposta lo spazio che avanza (misurati 30 px)
con un margine sotto le azioni, controlla che con la correzione resti 0, e poi senza
correzione misura 4 px: verde, e sa ancora fallire.
