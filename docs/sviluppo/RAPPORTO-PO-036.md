# Rapporto PO-036 — correzioni dal collaudo 1.21.25 (per la 1.21.26, solo sito)

Figlia `session_01S3DCrwjDZyMqvJz4FHadNb`, 26 ottobre 2026, ramo `po036-collaudo-1.21.25` (da
`main` a `60de715`). Fonti lette: `docs/sviluppo/COLLAUDO-1.21.25.md` (ramo `collaudo-1.21.25`),
sezione D2 di `docs/sviluppo/RAPPORTO-PO-002-TORRE.md` (ramo `opera-torre`), ultime righe di
`docs/DECISIONI.md`. Nessun cambio di versione, `android/` non toccato, niente su `main`.
Chromium di prova: `/opt/pw-browsers/chromium` (153.0.8010.12), headless, tocco emulato.

## In breve

| voce | che cosa | esito |
|---|---|---|
| E1 | il tocco perso dopo un trascinamento è **della prova**, non del gioco: la pagina minima senza PLINTO lo perde più di PLINTO | prove col dito che si ferma prima di staccarsi; rosso della CI riprodotto (1 su 3), verde 3 giri completi di fila; rosso spegnendo `GIOCO_IN_ORIZZONTALE` |
| O6 | le prove cercano `/opt/pw-browsers/chromium` prima del percorso vecchio | 36 file |
| D1 | `rilascia` calcola la casella dalle coordinate del `pointerup` (`RILASCIO_DOVE_SI_STACCA`) | rosso spento 3 partite su 3, verde acceso 3 su 3; dito lento e mouse verdi in entrambi |
| D2 | pannello degli attrezzi aperto dall'alto (`PANNELLO_DALL_ALTO`) | spento: scorso di 216/216/164 px a 640x360/800x360/915x412; acceso: 0 |
| O4 | «Salta per ora» e «Non mostrarmela più» da 15 a 45 px (`SALTA_COMODO`) | spento rosso, acceso verde; schermate prima/dopo identiche **pixel per pixel** |

## E1 — prima: è il gioco?

Sonda nuova, `tools/sonda-tocco.mjs` (quella del rapporto della Torre non era nel repository:
l'ho riscritta seguendone la descrizione). Per ogni giro: contesto nuovo, `isMobile`, densità 2,
pezzo trascinato col dito con `Input.dispatchTouchEvent` (12 movimenti senza pausa, come
`schermi.mjs`), con o senza 6 movimenti fermi a 50 ms prima del `touchEnd`, attesa, tocco al
centro del pulsante. PLINTO: build di produzione (`vite preview`, stesso bundle
`index-pCaA_udg.js` del sito), partita libera, primo pezzo sulla casella centrale, tocco su
«Menu». Pagina minima: un riquadro a tutto schermo con `touch-action: none`, un quadrato che
segue il dito, un `button`; niente React, niente PLINTO. La sonda controlla anche che il pezzo
sia stato davvero appoggiato (in tutti i giri lo era).

Click persi su 15 giri:

| formato | pagina | attesa 1200 ms, senza pausa | 1200 ms, con pausa | 500 ms, senza pausa | 500 ms, con pausa |
|---|---|---|---|---|---|
| 1024x600 | PLINTO | 0 | 0 | 8 | 0 |
| 1024x600 | minima | 0 | 0 | **15** | 0 |
| 1280x620 | PLINTO | 1 | 0 | 7 | 0 |
| 1280x620 | minima | **3** | 0 | **15** | 0 |

In ogni giro perso arrivano al pulsante `pointerdown touchstart pointerup touchend`, mai il
`click` (come nel collaudo e nel rapporto della Torre). **Il tocco non si perde solo in
PLINTO**: la pagina minima lo perde di più; col dito che si ferma non si perde mai (0 su 120).
Quindi è un comportamento del Chromium di prova verso un rilascio sintetico ancora in corsa.
Perché Chromium lo faccia **non posso confermarlo** (non ho letto il suo codice); se succeda su
un telefono vero **non posso confermarlo**.

### Correzione della prova

`tests/e2e/schermi.mjs`: interruttore di prova `DITO_CHE_SI_FERMA` e funzione `fermaIlDito`,
chiamata nelle due copie di `trascinaColDito` (quindi anche da `appoggiaColDito`) fra l'ultimo
movimento e il `touchEnd`: 6 movimenti nello stesso punto a 50 ms. L'attesa di 1 s dopo
l'appoggio resta, con il commento aggiornato. Solo `schermi.mjs` usa `Input.dispatchTouchEvent`
fra le prove (cercato in `tests/` e `tools/`); `precisione.mjs` ora lo usa per D1, apposta senza
pausa.

| prova (`PLINTO_SCHERMI=orizzontale` salvo dove detto) | esito |
|---|---|
| `DITO_CHE_SI_FERMA = false`, giro 1 | **rosso**: `orizzontale 1280x620 / menu: non ci si arriva: page.waitForSelector: Timeout 8000ms exceeded.` — lo stesso della CI 230 |
| `DITO_CHE_SI_FERMA = false`, giri 2 e 3 | verdi (il difetto è intermittente, come in CI: 230 rossa, 231–234 verdi) |
| `DITO_CHE_SI_FERMA = true`, `npm run e2e-schermi` **completo**, 3 giri di fila | verdi tutti e tre: «Tutto a posto su 13 formati, 5 coricati e 2 col testo x2» |
| `GIOCO_IN_ORIZZONTALE = false` (src/ui/SchermoGioco.jsx) | **rosso**: griglia 28x28 px, caselle 0 px, nessuna anteprima, pastiglia non raggiungibile, su tutti e 5 i formati coricati |

Non ho rifatto la CI: lo farà il merge. Che la prova sia verde **sempre** non posso
confermarlo con 3 giri; 0 click persi su 120 giri della sonda col dito fermo è la misura più
forte che ho.

### O6

In 36 script (`tests/e2e/*.mjs`, `tools/*.mjs`) la riga
`const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;` è diventata
`[PLINTO_CHROMIUM, '/opt/pw-browsers/chromium', PERCORSO_NOTO].find(esiste)`; se nessuno esiste
(CI) decide Playwright come prima. Aggiornato `docs/TESTING.md` («Limiti dello scenario»). Tutte
le prove di questo rapporto sono girate senza `PLINTO_CHROMIUM`.

## D1 — il pezzo un movimento indietro

`src/ui/useTrascinamento.js`, interruttore `RILASCIO_DOVE_SI_STACCA`: in `rilascia` x e y si
calcolano da `e.clientX`/`e.clientY` con la formula di `muovi` (presa e sollevamento), invece che
da `presoRef.current`. Col mouse e col dito che rallenta le coordinate del `pointerup` coincidono
con quelle dell'ultimo movimento disegnato.

Caso nuovo in `tests/e2e/precisione.mjs` (già nel gate, «precisione del trascinamento»):
360x640 col tocco, `Emulation.setCPUThrottlingRate` 4, livello 1 con la sequenza vincente del
motore (14 mosse), dopo ogni mossa le caselle «occupata» a schermo confrontate con la griglia del
motore, all'ultima mossa «Livello superato». Tre partite col rilascio veloce, una col dito che si
ferma. `PLINTO_PRECISIONE_SOLO_VELOCE=1` salta le 201 prove col mouse.

Prima versione del caso (ultimo movimento atteso, poi il distacco), interruttore spento: in una
corsa rossa in 1 partita su 3 (mossa 12, 6 caselle diverse), nella corsa dopo **verde 3 su 3**:
non sapeva fallire in modo affidabile. Corretta: l'ultimo movimento e il `touchEnd` partono insieme (`Promise.all`), cioè nello
stesso fotogramma.

| interruttore | rilascio veloce (3 partite) | dito che si ferma | prove col mouse (201) |
|---|---|---|---|
| spento | **rosso 3 su 3**: alla mossa 1, 4 caselle diverse dal motore | verde, 14 mosse | — (non girate in questa corsa) |
| acceso | verde 3 su 3, 14 mosse uguali al motore | verde | verdi nella corsa completa: «Nessuno scostamento» (205 prove) |

Col mouse: le 201 prove esistenti verdi con l'interruttore acceso. Quanto D1 succeda su un
telefono vero **non posso confermarlo** (vale il limite scritto nel collaudo).

## D2 — pannello degli attrezzi aperto in fondo

`src/ui/Attrezzi.jsx`, interruttore `PANNELLO_DALL_ALTO`: `focus({ preventScroll: true })` su
«Torna alla partita». Il fuoco resta su quel pulsante. Controllo nuovo nel caso «attrezzi» dei
formati coricati di `tests/e2e/schermi.mjs`: 150 ms dopo l'apertura `scrollTop` del pannello
deve essere 0 e `document.activeElement` deve essere «Torna alla partita».

| interruttore | 640x360 | 800x360 | 915x412 | 1024x600, 1280x620 |
|---|---|---|---|---|
| spento | **rosso**: scorso di 216 px (corsa 216) | **rosso**: 216 (216) | **rosso**: 164 (164) | verdi (il pannello non scorre) |
| acceso | verde | verde | verde | verde |

Il fuoco su «Torna alla partita» è verificato verde negli stessi giri. Che un lettore di schermo
annunci il pulsante anche se fuori vista **non posso confermarlo** (nessun TalkBack qui).

## O4 — «Salta per ora» e «Non mostrarmela più»

`src/ui/schermate/PrimoAvvio.jsx`, interruttore `SALTA_COMODO`, classe `pl-guida__link--comodo` in
`src/styles/app.css`: `padding: 12px 0 18px; margin: -12px 0 -18px`. Sopra 12 px perché tanti ne
separano la riga da «Avanti» (margine di `.pl-guida__salta`); sotto 18, dentro i 20 di
`.pl-intro__azioni`. Controllo nuovo in `tests/e2e/guida.mjs` (passo 7, già nel gate): a 360x640,
390x844 e 640x360 col tocco, ogni pulsante alto almeno 44 px, i suoi bordi suoi
(`elementFromPoint`), il fondo di «Avanti» ancora di «Avanti».

| interruttore | altezze | esito |
|---|---|---|
| spento | 15 px tutti e sei | **rosso** (6 problemi) |
| acceso | 45 px tutti e sei, bordi propri, «Avanti» intero | verde |

Schermate del primo passo della guida, interruttore spento e acceso, a 360x640, 640x360, 390x844
(densità 2): **differenza nulla pixel per pixel** (PIL `ImageChops.difference`, `getbbox()` =
None). In repository: `docs/sviluppo/po036/guida-360x640-prima.png` e `-dopo.png`. Non cambiato:
l'anello del fuoco da tastiera ora circonda l'area più alta (non misurato a schermo).

## Comandi finali

| comando | esito |
|---|---|
| `npm run build` | verde, `dist/assets/index-aJeAVcRR.js` |
| `npm test` | 45 file, 652 su 652 |
| `npm run verifica -- --veloce` | GATE |

## Testo per il changelog (1.21.26)

> ### 1.21.26 — solo sito
> **Cosa.** Col dito, rilasciando in fretta su un telefono lento, il pezzo va dove il dito si
> stacca e non un movimento prima. In orizzontale il pannello degli attrezzi si apre dall'alto.
> «Salta per ora» e «Non mostrarmela più» nella guida si prendono meglio col dito (area di 45 px
> invece di 15, disegno uguale). Nelle prove il dito si ferma prima di staccarsi, e le prove
> trovano il Chromium della macchina anche dopo un aggiornamento di Playwright.
> **Perché.** Collaudo 1.21.25: D1, D2, O4; la CI 230 della 1.21.25 era rossa per un tocco perso
> dopo un trascinamento sintetico, che si ripete su una pagina senza PLINTO (E1).
> **Misurato.** Click persi su 15 giri a 500 ms dopo il trascinamento: pagina minima 15, PLINTO
> 7–8; col dito fermo 0 su 120. D1: livello 1 a 360x640 col dito, CPU 4x: griglia diversa dal
> motore alla prima mossa in 3 partite su 3 senza la correzione, uguale in 3 su 3 con. D2:
> pannello aperto scorso di 216/216/164 px a 640x360/800x360/915x412, ora 0. O4: 15 → 45 px.
> Il pacchetto Android non cambia.

## Scelte aperte

1. **CI del merge.** Il verdetto vero è la CI: dopo l'unione in `main` vanno lette le prossime
   corse di «verifica» (la 230 era rossa una volta su cinque corse sullo stesso codice).
   Consigliata: non dire «risolto» prima di almeno 3 corse verdi.
2. **Quando pubblicare la 1.21.26.** Il sito che il revisore vede con la 11915 è la 1.21.25.
   Opzioni: (a) **(consigliata)** pubblicarla dopo l'esito della revisione, come la Torre: sono
   correzioni piccole e nessuna è un «non risponde»; (b) subito, perché D1 e D2 toccano il
   gioco col dito; decide il PO.
3. **Portare queste correzioni su `opera-torre`** alla prossima unione: il rosso «1024x600 /
   menu» del rapporto della Torre è lo stesso di E1.
4. **D1 su un telefono vero.** Provare col telefono del PO, trascinando svelto sulle caselle da
   27 px del livello 1 a 360 di larghezza: non verificabile qui.
