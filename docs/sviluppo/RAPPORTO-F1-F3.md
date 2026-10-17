# Rapporto F1-F3 — home senza scorrimento, stato della Sfida, testi veri sulla Sfida

Voci PO-004 e PO-009. Ramo `sviluppo/f1-f3-1.21.11`, partito da `main` `e126983` (1.21.10).
Versione non toccata, CHANGELOG e ROADMAP non toccati, niente pubblicato.

Tutte le misure sono del Chromium del container (`/opt/pw-browsers/chromium-1194`), con i
font di ripiego del container. Su un telefono vero i font possono essere diversi: vedi
«Non verificato».

## In breve

| | difetto | correzione | interruttore | controllo |
|---|---|---|---|---|
| F1 | con una partita libera in corso la home scorre (−60 px a 360x640) | la riga «Nuova partita» esce dalla home; si ricomincia dal menu della partita, dove c'era già | `NUOVA_PARTITA_SOLO_NEL_MENU` in `src/ui/schermate/Home.jsx` | `npm run home-spiegazione` (5 stati) e `npm run impaginazione` (partite vere invece dei segnaposto) |
| F2 | la card della Sfida dice «Riprendi la sfida» e «Da giocare» insieme | con la sfida di oggi in corso e nessuna partita finita lo stato dice «In corso» / «In progress» | `STATO_SFIDA_IN_CORSO` in `src/ui/schermate/Home.jsx` | `npm run home-spiegazione` |
| F3 | schermata di fine, guida e aiuto dicono che la Sfida è la stessa partita, con gli stessi pezzi nello stesso ordine | riscritti: «parte uguale per tutti», come la home | nessuno (testi; consentito dal mandato) | `tests/sfida-testi.test.js` |

## F1 — la home scorre con una partita libera in corso

### Misura prima di correggere

Script di misura su `main` (codice di `e126983`, server di sviluppo), cinque stati, sei
formati, italiano e inglese. `libero` = pixel verticali che avanzano fra il primo e
l'ultimo blocco della home (negativo = la home scorre); `scorre` = `scrollHeight −
clientHeight`. Valori **identici in italiano e in inglese**.

Stati: **nessuna** (primo avvio); **libera** (record, 10 livelli, partita libera in corso);
**sfida** (record, 10 livelli, sfida di oggi in corso); **livello** (record, 10 livelli,
livello 11 lasciato a metà); **tutte** (libera + sfida + livello).

L'elenco dei blocchi misurati spiega la causa. A 360x640 le azioni sono, con altezza:
`LIVELLO 11:64 ; Mappa dei livelli:52 ; Riprendi la partita:52 ; Nuova partita:52 ;
Sfida del giorno:52 ; Archivio delle sfide`. Negli stati senza partita libera la riga
«Nuova partita» non c'è e **nessun'altra riga cambia altezza** (il pulsante «Riprendi il
livello 11» resta alto 64 come «Livello 11»). La riga in più costa 52 px + 10 di spazio
fra le righe (`.pl-home__azioni { gap: 10px }` sotto i 680 px di altezza in verticale, `app.css:1673-1676`):
62 px, contro i 2 px che avanzano negli altri stati → −60.

| formato | nessuna | libera PRIMA | sfida | livello | tutte PRIMA | libera DOPO | tutte DOPO |
|---|---|---|---|---|---|---|---|
| 360x640 | 2 | **−60** | 2 | 2 | **−60** | 2 | 2 |
| 375x667 | 28 | **−34** (scorre 35) | 28 | 28 | **−34** | 28 | 28 |
| 390x844 | 155 | 91 | 155 | 155 | 91 | 155 | 155 |
| 412x915 | 234 | 170 | 234 | 234 | 170 | 234 | 234 |
| 1280x800 | 66 | 2 | 66 | 66 | 2 | 66 | 66 |
| 1366x768 | 39 | **−25** | 39 | 39 | **−25** | 39 | 39 |

DOPO, tutti e cinque gli stati hanno lo stesso `libero` del primo avvio in ogni formato
(colonne nessuna/sfida/livello invariate). Fonte: tabella di `npm run home-spiegazione`
con la correzione (colonne `libero`, `scorre`, `azioni`: 5 blocchi d'azione in tutti gli
stati invece di 6).

Nota: le misure 390x844 del rapporto PO-009 dicevano 170/106; oggi lo stesso controllo
misura 155/91 nello stesso container. Lo scarto di 15 px c'è anche nello stato
`nessuna`, che F1 non tocca. Non posso confermare da che cosa nasca (font o versione
della 1.21.10); non cambia nessun verdetto.

**A 360x640 il margine resta di 2 px** in tutti gli stati, come era già per il primo
avvio: F1 riporta lo stato «libera» al livello degli altri, non crea spazio in più.

### Correzione e opzioni

Il mandato chiede di non scegliere al posto del PO: ho implementato la consigliata, dietro
interruttore, e le altre restano possibili.

| | opzione | altezza a 360x640 | pro | contro |
|---|---|---|---|---|
| **A (consigliata, implementata)** | togliere la riga «Nuova partita» dalla home. La card «Riprendi la partita» riprende; per ricominciare: card → «Menu» → «Nuova partita» (`App.jsx`, menu della partita, già presente) | −62 px: la home torna come negli altri stati | una card per modalità, nessuna riga che compare e scompare; meno cose da distinguere, che è proprio il problema di PO-009 | ricominciare costa due tocchi in più (entrare e aprire il menu) |
| B | «Nuova partita» e «Archivio delle sfide» affiancati su una riga di due pulsanti | −62 px | il comando resta a un tocco | mette sulla stessa riga un comando della libera e uno della Sfida: accosta proprio le due modalità che il PO dice si confondono |
| C | ricompattare (spazi fra le righe, altezze) solo quando c'è la partita libera | servirebbero 60 px: con 6 spazi da 10 px e card da 52 px si scende sotto i 44 px minimi dei bersagli tattili o si azzerano gli spazi | il comando resta a un tocco | la home cambia ritmo a seconda dello stato; i 44 px sono un vincolo già preso (`home-spiegazione`, punto 3) |

L'aiuto (`ComeSiGioca.jsx`, `intro.js`) non cita il pulsante «Nuova partita» della home
(cercato: nessuna occorrenza), quindi non va riaperto per F1.

### Perché le prove non lo vedevano, e che cosa provano adesso

- `tests/e2e/impaginazione.mjs:92` metteva in `plinto:partita` e `plinto:partita-sfida`
  un `{ segnaposto: true }` che la home non riconosce come partita: provava la home di
  chi non ha niente in corso. Adesso mette partite vere (`serializeGame(createGame(...))`)
  per libera, sfida e un livello a metà.
- `tests/e2e/home-spiegazione.mjs` escludeva lo stato «libera» dal controllo «la home non
  scorre». Adesso prova cinque stati (nessuna, sfida, libera, livello, tutte) in sei
  formati e due lingue, senza eccezioni, anche con un numero di versione lungo.

## F2 — «Riprendi la sfida» accanto a «Da giocare»

Prima (`Home.jsx` di `main`): lo stato a destra era `sfidaTesto || t('home.daGiocare')`,
dove `sfidaTesto` c'è solo se oggi è finita almeno una partita. Con la sfida di oggi
cominciata e mai finita la card diceva «Riprendi la sfida · Da giocare» (inglese
«Resume challenge · Not played yet»): misurato negli stati `sfida` e `tutte`, vedi lo
screenshot «prima».

| | opzione | testo it / en | altezza |
|---|---|---|---|
| **A (consigliata, implementata)** | «In corso» al posto di «Da giocare» quando la sfida di oggi è in corso e non c'è ancora un record di giornata | **In corso** / **In progress** | 0 px: stessa posizione e stessa riga dello stato di prima (card 52 px in tutte le misure) |
| B | nessuno stato a destra in quel caso | — | 0 px, ma la card diventa l'unica senza stato e sembra un dato mancante (stesso motivo per cui «—» era stato sostituito da «Mai giocata», commento in `Home.jsx`) |
| C | il punteggio della partita in corso («Ora 1.240») | da scrivere | 0 px, ma richiede di leggere la partita salvata nella home e una chiave nuova; più codice per lo stesso risultato |

Quando oggi c'è già un record, la card dice «Riprendi la sfida · Record 4.120», come
prima: «Record» non contraddice «Riprendi». Chiave nuova `home.inCorso` in `it.js` e
`en.js`; nessuna chiave rinominata. `tests/lessico.test.js` verde.

## F3 — testi che dicono la Sfida identica per tutti

La regola vera: `docs/GAMEPLAY_RULES.md:665-676` — il seme è la data, griglia iniziale e
primi pezzi coincidono; il generatore legge la griglia, e su due modi di giocare opposti
le prime **sei mani** coincidono, poi divergono.

Cercato in `src/i18n/it.js` ed `en.js` ogni «stess*/same/identic*/uguale/everyone». Testi
che il giocatore legge, cambiati:

| chiave | dove si legge | vecchio | nuovo |
|---|---|---|---|
| it `sfida.spiegazione` | fine partita della Sfida (`Fine.jsx:55`) | Oggi la partita è la stessa per tutti: stessa griglia, stessi pezzi, nello stesso ordine. | Oggi la partita parte uguale per tutti: stessa griglia, stessi primi pezzi. Poi i pezzi cambiano secondo come giochi. |
| en `sfida.spiegazione` | idem | Today everyone plays the same game: same grid, same pieces, same order. | Today the game starts the same for everyone: same grid, same first pieces. Then the pieces change with how you play. |
| it `guida.altreModalita` | Come si gioca (`ComeSiGioca.jsx:99`) e primo avvio (`PrimoAvvio.jsx:196`) | … e la Sfida del giorno: la stessa identica partita per tutti, una al giorno. | … e la Sfida del giorno: una al giorno, parte uguale per tutti. |
| en `guida.altreModalita` | idem | … and the Daily challenge: the exact same game for everyone, once a day. | … and the Daily challenge: one a day, with the same start for everyone. |
| it `aiuto.attrezziSfida` | Come si gioca (`ComeSiGioca.jsx:174`) | … ed è voluto: è la stessa partita per tutti, e due punteggi … | … ed è voluto: la partita parte uguale per tutti, e due punteggi … |
| en `aiuto.attrezziSfida` | idem | … on purpose: it is the same game for everyone, and two scores … | … on purpose: the game starts the same for everyone, and two scores … |
| it `modo.sfidaCosaPassata` | sopra la griglia, sfida di un giorno passato (`SchermoGioco.jsx:55`) | La stessa partita di quel giorno. Fai più punti che puoi. | Parte come quel giorno. Fai più punti che puoi. |
| en `modo.sfidaCosaPassata` | idem | The same game as that day. Score as much as you can. | It starts the same as on that day. Score as much as you can. |
| en `modo.sfidaCosa` | sopra la griglia, sfida di oggi | Today everyone starts from the same game. Score as much as you can. | Today the game starts the same for everyone. Score as much as you can. |

L'ultima riga inglese non era falsa («starts from»), ma diceva «the same game»; allineata
all'italiano (`Oggi la partita parte uguale per tutti.`, invariato) e alla home.

«Parte come quel giorno» per le sfide passate: il seme è la data
(`docs/GAMEPLAY_RULES.md:677-680`, archivio ricalcolato), quindi l'inizio coincide con
quello di quel giorno; il seguito diverge come per oggi.

Il controllo `tests/sfida-testi.test.js` scorre tutti i valori dei due dizionari e
fallisce su «stessa partita», «stessi pezzi», «stesso ordine», «identica partita» /
«same game», «same pieces», «same order»; poi verifica che i testi della Sfida dicano
«parte uguale per tutti» / «starts the same for everyone». Prova di rosso: con i
dizionari di `e126983` (`git stash push src/i18n`) **3 test falliti su 3**; con i nuovi
3 su 3 verdi.

### Non cambiati (non li legge il giocatore)

Commenti nel sorgente che usano ancora la formula «la stessa partita per tutti»:
`src/persistence/attrezzi.js:22`, `src/persistence/sfide.js:12`,
`src/state/useQuadro.js:67`, `src/state/usePartita.js:142`, `src/core/engine.js:703`,
`src/core/incitamenti.js:20`, `src/core/rng.js:5`. Non cambiano niente a schermo; li
segnalo per chi li tocca la prossima volta. `docs/TESTING.md:176` («stessa partita a
parità di giorno») descrive cosa prova `sfide.test.js` (stesso seme), non una promessa
al giocatore.

### Testi pubblici da cambiare (non toccati: li cambia il PO)

- `android/SCHEDA-PLAY-STORE.md:74` (it) «Ogni giorno la partita parte uguale per tutti.»
  e `:137` (en) «Every day the game starts the same for everyone.»: **già veri**,
  nessuna modifica necessaria.
- `docs/ITCH.md:78`: «• A Daily Challenge: the same game for everyone, every day, no
  streaks to keep» — **falso** per lo stesso motivo. Proposta: «• A Daily Challenge:
  the same start for everyone, every day, no streaks to keep». Non posso confermare se
  questo testo sia già pubblicato sulla pagina itch.io.
- Schermate dello Store: `store/riserva-home.png` (v1.21.1) mostra la home senza
  «Nuova partita» e senza «Riprendi la sfida», quindi né F1 né F2 la rendono falsa.
  Le altre schermate (`store/1-…8-…png`) non le ho riaperte una per una: vedi «Non
  verificato».

## Interruttori e prova rosso/verde

Interruttori in `src/ui/schermate/Home.jsx`: `NUOVA_PARTITA_SOLO_NEL_MENU` (F1) e
`STATO_SFIDA_IN_CORSO` (F2), accanto a `SPIEGAZIONE_MODI` di PO-009.

### Server di sviluppo (`localhost:5173`)

| interruttore spento | `home-spiegazione` | `impaginazione` |
|---|---|---|
| `NUOVA_PARTITA_SOLO_NEL_MENU` | **rosso**, 12 problemi: «la home scorre di 60px» (360x640), 35 (375x667), 25 (1366x768), stati `libera` e `tutte`, it ed en | **rosso**: «Android di base 360x640 SCORRE di 60px» |
| `STATO_SFIDA_IN_CORSO` | **rosso**, 24 problemi: «con la sfida in corso la card dice «Da giocare» invece di «In corso» (F2)», stati `sfida` e `tutte`, 6 formati, it ed en | — |
| nessuno (tutto acceso) | **verde** | **verde** |

### Build di produzione (`npm run build`, `vite preview --port 4173`, `PLINTO_E2E_URL=http://127.0.0.1:4173/`)

Ricostruita e riavviata a ogni posizione degli interruttori.

| interruttore spento | `home-spiegazione` | `impaginazione` |
|---|---|---|
| `NUOVA_PARTITA_SOLO_NEL_MENU` | **rosso**, 12 problemi, gli stessi dello sviluppo (60 / 35 / 25 px, stati `libera` e `tutte`, it ed en) | **rosso**: «Android di base 360x640 SCORRE di 60px» |
| `STATO_SFIDA_IN_CORSO` | **rosso**, 24 problemi, gli stessi dello sviluppo («Da giocare» invece di «In corso») | — |
| nessuno (tutto acceso) | **verde** | **verde** |

Un primo giro in produzione è stato scartato: due esecuzioni dello script di prova si
sono sovrapposte (una interrotta era sopravvissuta come processo figlio) e si
contendevano interruttori e server. Il giro riportato qui è stato rifatto da solo, dopo
aver verificato da `/proc` che nient'altro girasse.

## Screenshot 360x640, partita libera in corso

In `docs/sviluppo/f1-f3/`. «Prima» = build di `main` `e126983`; «dopo» = build di questo
ramo. `libera` = solo partita libera in corso; `libera-sfida` = anche la sfida di oggi in
corso (mostra F2).

| | prima | dopo |
|---|---|---|
| it, libera | `prima-360x640-libera-it.png` (home 700/640) | `dopo-360x640-libera-it.png` (640/640) |
| en, libera | `prima-360x640-libera-en.png` (700/640) | `dopo-360x640-libera-en.png` (640/640) |
| it, libera + sfida | `prima-360x640-libera-sfida-it.png` (700/640) | `dopo-360x640-libera-sfida-it.png` (640/640) |
| en, libera + sfida | `prima-360x640-libera-sfida-en.png` (700/640) | `dopo-360x640-libera-sfida-en.png` (640/640) |

Le schermate «prima» mostrano la home tagliata in basso (pie' di pagina fuori schermo) e,
in quelle con la sfida, «Riprendi la sfida · Da giocare».

## Controlli eseguiti prima della consegna

COMANDI

## Non verificato

- **Telefoni veri.** Tutte le misure sono di Chromium nel container, con i font di
  ripiego. A 360x640 restano 2 px di margine in tutti gli stati (come già al primo avvio
  su `main`): con un font più largo il margine potrebbe sparire. Non posso confermarlo
  senza un dispositivo.
- **WebView della TWA.** Non provata: le prove girano su Chromium desktop con viewport
  da telefono.
- **Gradimento di A per F1.** Che due tocchi in più per ricominciare una partita libera
  vadano bene ai giocatori è una scelta di prodotto, non una misura.
- **Schermate dello Store** `store/1-…8-…png`: non riaperte una per una; non posso
  confermare che nessuna mostri «Nuova partita» sotto la card della libera o «Da
  giocare» accanto a «Riprendi la sfida».
- **Pagina itch.io**: non posso confermare se il testo di `docs/ITCH.md:78` sia online.
- `npm run verifica` completo: non lanciato, come da mandato.

## Commit

COMMIT
