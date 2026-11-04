# Collaudo 1.22.2 — Il livello giusto

Figlia di collaudo, 4 novembre 2026, ramo `collaudo-1.22.2` (da `main` a `4dc9eb6`, merge del
rilascio `bd3ac96`). Codice del prodotto non toccato. Qui ci sono questo rapporto, le schermate
in `collaudo-1.22.2/`, le uscite in `collaudo-1.22.2/uscite/` e gli script delle prove a mano in
`collaudo-1.22.2/script/`. Gli script sono fuori dal gate e importano il motore da
`/home/user/Plinto/src` con percorsi assoluti, come quelli della 1.22.1.

**Sito collaudato:** https://antoniovairo-rgb.github.io/Plinto/.

- Chromium apre il sito senza errori di certificato. In questo container il certificato del
  proxy è già fidato, e la verifica TLS è rimasta accesa.
- Il sito serve `assets/index-EjU1cQwH.js`, che contiene «1.22.2» (3 volte) e `sw.js?v=1.22.2`.
  `last-modified` di `index.html`: 4 novembre 2026, 01:42:37 GMT.
- Ho rifatto la build da `main` (`npm run build`, uscita 0). Esce lo stesso nome di bundle.
  `index.html`, `sw.js`, `manifest.webmanifest` e `assets/index-EjU1cQwH.js` sono identici
  byte per byte a quelli pubblicati (confronto con SHA-256).
- CI su GitHub: «verifica» del merge `bd3ac96` (run 272) è **success**, e così «pubblica su
  Pages» (run 269). «verifica» di `4dc9eb6` (run 273, solo registri) era ancora in corso
  quando ho scritto.
- `npm test` sul sorgente: 51 file, 704 test, tutti verdi.

**Strumenti:** Chromium preinstallato, headless, Playwright di `node_modules`. Il service
worker è bloccato (`serviceWorkers: 'block'`), così leggo sempre il sito appena pubblicato.
Formati: telefono verticale 360x640 e coricato 640x360 (tocco, `isMobile`), tablet 768x1024
(tocco), PC 1366x768 (mouse). Prove in italiano e in inglese. Il tasto Indietro di Android l'ho
simulato con `page.goBack()`, come `tests/e2e/indietro.mjs`.

**Salvataggi finti:** li scrivo come li scrive il gioco, come nella 1.22.1. Le mosse della
partita a metà le gioca il motore vero (3 mosse nelle prove PO-042/043). I file da importare li
esporta il gioco stesso con «Copia il testo». Poi li incollo in «Oppure incolla qui un
salvataggio» → «Leggi» → «Unisci ai miei» oppure «Sostituisci tutto» + «Sì».

## 1. Controlli automatici contro il sito pubblicato

Ho usato `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`. Tutte e sei le prove
leggono la variabile (`const INDIRIZZO = process.env.PLINTO_E2E_URL ?? …`). Prima di
cominciare nessun server era acceso sulle porte 5173 e 4173.

| Comando | Uscita | Durata | Note |
|---|---|---|---|
| `npm run e2e-torre-aperta` | **0** | 54 s | Prima della correzione era rossa sul sito (404, O2 della 1.22.1). Adesso è verde: la lettura da «Copia il testo» (`LEGGI_DA_COPIA`) funziona sul sito |
| `npm run e2e-po041` | **0** | 10 s | D «Livello 11», ricaricando si resta in home, il tocco apre l'11. E it/en «Gioca il livello 101» / «Play level 101» pieno con il fuoco. E2 invariato |
| `npm run e2e-po008` | **0** | 196 s | «94 tentate, 0 ritentate, 0 non fatte» |
| `npm run e2e-ripresa` | **0** | 13 s | «Tutto a posto» |
| `npm run correzioni` | **0** | 36 s | O6 come nella 1.22.1 |
| `npm run e2e-salvataggio` | **0** | 12 s | «Nessun problema rilevato» |

**6 verdi su 6** (`uscite/automatici.txt`).

## 2. PO-043 — «Gioca il livello N» pieno se M è superato

Script `script/po043.mjs`, uscita in `uscite/po043.txt`. Ho provato 4 casi in 4 formati e
2 lingue: **32 combinazioni, 0 problemi, uscita 0**.

| Caso | Salvataggio | Come arrivo alla domanda | Primo (pieno, con il fuoco) | Secondo (trasparente) |
|---|---|---|---|---|
| E | 1-100, il 100 a metà | pulsante grande «Livello 101» → «Gioca» | «Gioca il livello 101» / «Play level 101» | «Riprendi il livello 100» / «Resume level 100» |
| W | 1-110, il 105 della Torre a metà | «Livello 111» → «Gioca» | «Gioca il livello 111» | «Riprendi il livello 105» |
| T | 200 su 200, il 150 a metà | «Livello 200» → «Gioca» | «Gioca il livello 200» | «Riprendi il livello 150» |
| E2 | 1-10 e 12, l'11 a metà **non superato** | mappa → 13 → «Gioca» | «Riprendi il livello 11» (**come prima**) | «Gioca il livello 13» |

Per ogni combinazione ho controllato queste cose:

- **Nome accessibile.** La finestra è `dialog`, `aria-modal="true"`, e il suo nome è il titolo:
  «Il livello 100 è a metà.» / «Level 100 is in progress.». I nomi dei pulsanti sono le
  scritte. Albero a 360x640:
  `dialog "Il livello 100 è a metà." / paragraph / paragraph / button "Gioca il livello 101" / button "Riprendi il livello 100"`.
  La finestra non ha descrizione: vedi O2.
- **Escape, tocco fuori, Indietro.** In tutte e tre le uscite la finestra si chiude e si resta
  sulla presentazione del livello nuovo. La partita salvata non cambia (per esempio
  `100/3 mosse` prima e dopo), e il fuoco torna su «GIOCA» della presentazione. Su 1366x768 il
  «tocco fuori» è un clic del mouse fuori dalla finestra.
- **Tastiera.** A 360x640 ho premuto Spazio sul pulsante con il fuoco, negli altri formati Invio.
  Si apre la plancia del livello nuovo, da zero (`101/0 mosse`). In E2 si riprende l'11 con le
  sue 3 mosse.
- **Il secondo pulsante, toccato.** In E, W e T riprende il livello a metà con le 3 mosse
  (`plancia 100`, voce `100/3m`). In E2 apre il 13 da zero.
- **La finestra sta nello schermo:** 312x228 a 360x640, 360x228 negli altri, sempre dentro.

Schermate: `po043-E-domanda-{360x640,640x360,768x1024,1366x768}-{it,en}.png`,
`po043-{W,T,E2}-domanda-360x640-{it,en}.png`.

**Caso della sfida e della libera:** vedi § 4. Le loro domande non usano `primaContinua` e
restano come prima.

## 3. PO-042 — un livello salvato a metà conta solo se è ancora aperto

Script `script/po042.mjs`, uscita in `uscite/po042.txt`. Ho provato 5 casi in 4 formati e
2 lingue. Il voto finale è **verde**. A 640x360 il primo giro aveva dato un rosso, ma veniva
dallo script e non dal gioco: lo spiego in fondo a questa sezione.

| Caso | Telefono | Importazione | Pulsante dopo | Ricarica | Poi |
|---|---|---|---|---|---|
| R1 | 1-100, il 100 a metà (3 mosse), ripresa sul 100 di 10 minuti prima | Sostituisci con 1-10 («Fatto. Adesso hai 10 livelli superati.») | «Livello 11» / «Level 11» | **resta in home**, anche con la ripresa del 100 ancora valida | mappa: il 100 è `disabled` («Supera prima tutti gli altri livelli») |
| R1, seguito | come sopra | **Sostituisci con 1-100** (ripristino) | «Livello 101» | **ripresa automatica nel 100**, con le sue 3 mosse | la partita ignorata è tornata com'era |
| R2 | 1-100, il 100 a metà | Unisci con 1-10 | «Livello 101» | — | dalla mappa il 100 si riprende con le 3 mosse |
| R3 | 1-10, l'11 **non superato** a metà, ripresa sull'11 di 30 minuti prima | Sostituisci con 1-5 | «Livello 6» | resta in home | ripristino 1-10 → «Livello 11»; ricaricando, ripresa automatica nell'11 con le 3 mosse |
| R4 | 1-110, il 105 a metà | Sostituisci con 1-100 | «Livello 101», il 105 `disabled` | — | ripristino 1-110 → «Livello 111»; dalla mappa il 105 si riprende con le 3 mosse |
| R5 | 1-100, il 100 a metà | Sostituisci con 1-10, poi tocco «Livello 11» (solo la presentazione) e torno indietro | — | — | ripristino 1-100: il 100 **riparte da zero**. Vedi O1 |

Tutte e 8 le combinazioni di formato e lingua danno lo stesso risultato, senza errori in console.
Schermate: `po042-R1-dopo-sostituisci-360x640-{it,en}.png`.

**Rosso dello script, non del gioco.** A 640x360 il primo giro aveva dato R4 rosso:
«il 105 non torna riprendibile». La causa era lo script. `scrollIntoViewIfNeeded` di
Playwright lasciava la tappa 105 sotto le schede fisse, e il tocco cadeva su «Il Ponte».
L'ho verificato con `elementFromPoint` al centro della tappa: c'era
`BUTTON.pl-opere__scheda «Il Ponte»`. Ho corretto lo script: adesso la tappa viene centrata
prima del tocco. Rilanciato a 640x360, R4 è verde (uscita 0). Lo stesso fatto, però, con la
tastiera è un difetto vero: vedi D1.

## 4. Regressioni vicine: le altre domande

Script `script/vicine.mjs`, uscita in `uscite/vicine.txt`. Ho provato 4 domande in 4 formati e
2 lingue: **32 su 32 come prima, uscita 0**.

| Domanda | Primo (pieno, con il fuoco) | Secondo (trasparente) | Escape |
|---|---|---|---|
| «Vuoi ricominciare il livello 4?» (menu → Riprova, 2 mosse) | «Torna alla partita» / «Back to the game» | «Sì, ricomincia da capo» | chiude, 2 mosse intatte |
| «La sfida del 3 novembre è a metà.» (ieri a metà, «Sfida del giorno») | «Riprendi la sfida del 3 novembre» / «Resume the November 3 challenge» | «Apri la sfida di oggi» | chiude, sfida di ieri intatta |
| «La partita libera è a metà.» («Nuova partita libera») | «Riprendi la partita» / «Resume game» | «Nuova partita» / «New game» | chiude, libera intatta |
| «La Torre» (avviso, Ponte finito) | «Entra nella Torre» / «Enter the Tower» | «Non ora» | — |

Schermate: `vicine-{R,S,N,T}-360x640-{it,en}.png`.

## 5. Che cosa ho trovato

Nessun **E** (blocco o dati persi per strade normali).

### D1 — Con la tastiera, a 640x360, la tappa con il fuoco finisce sotto le schede fisse

Questo difetto **non è nato con la 1.22.2**. Viene da `SCHEDE_FISSE`, introdotto con la 1.22.1.

**Passi:** 640x360, livelli 1-110 superati → «Mappa dei livelli» (si apre sulla Torre, con il
111 in vista). Fuoco sul 111, poi Maiusc+Tab.

**Atteso:** la tappa con il fuoco si vede (WCAG 2.2, criterio 2.4.11 «Focus Not Obscured»).

**Visto:** le tappe dal 110 al 101 ricevono il fuoco a `y=65`. Il loro centro è coperto da
`.pl-opere__scheda` o da `.pl-opere__nome`: la fila delle schede è alta circa 74-114 px. Non si
vede quale tappa ha il fuoco. Schermata `d1-fuoco-105-coperto-640x360-it.png`: il fuoco è sul
105, ma sullo schermo c'è solo il 111. Con il Tab in avanti (dalla scheda «La Torre» al 101 e
oltre) le tappe stanno a `y=294` e si vedono. A 360x640 e a 1366x768 le tappe si vedono anche
con Maiusc+Tab, ma «Condividi il tuo percorso» riceve il fuoco a `y=64` / `y=107` ed è coperto
da `.pl-opere`.

**Dove:** `src/styles/app.css:2266-2277` (`.pl-opere-fila { position: sticky; top: 0; … }`).
Nessuna regola `scroll-padding-top` o `scroll-margin-top` tiene conto della fila.

**Quanto pesa:** serve una tastiera. Su telefono e tablet si usa raramente. Su PC l'unico
elemento coperto è «Condividi il tuo percorso». Quante persone giochino con la tastiera
**non posso confermarlo**.

Opzioni:

1. **(consigliata)** Aggiungere `scroll-padding-top` pari all'altezza della fila delle schede
   sul contenitore che scorre (`.pl-scroll` della mappa), con un suo interruttore. Aggiungere
   anche un caso a `e2e-torre-aperta`: Maiusc+Tab sulle tappe in 640x360, 360x640 e 1366x768,
   e `elementFromPoint` al centro della tappa con il fuoco.
2. `scroll-margin-top` sulle `.pl-tappa` e sul pulsante «Condividi il tuo percorso».
3. Lasciare così e scriverlo fra le decisioni.

### O1 — La partita del livello chiuso si perde aprendo solo la presentazione di un altro

Questo limite era già dichiarato nella scelta aperta 1 di `RAPPORTO-PO-042-043.md` (§ 2.4).
Qui l'ho misurato sul sito.

**Passi (R5):** 1-100 superati, il 100 a metà con 3 mosse → «Sostituisci tutto» con 1-10 →
tocco «Livello 11» (si apre solo la presentazione) → Indietro → «Sostituisci tutto» con 1-100 →
mappa → 100.

**Visto:** appena si apre la presentazione dell'11, `plinto:partita-quadro` diventa
`11/0 mosse`. Dopo il ripristino il 100 si apre sulla presentazione con 0 mosse: le 3 mosse sono
perse. Nessuna domanda lo avvisa, perché `livelloAMeta` ignora il livello chiuso. Il motivo è
in `src/state/useQuadro.js:204`, dove `apertoAncora` è dentro `NON_COPRE_UN_ALTRO_LIVELLO`.
Succede in 8 combinazioni su 8. Se invece non si apre nessun livello fra i due «Sostituisci»
(R1, R3, R4), la partita torna riprendibile com'era.

Opzioni (sono quelle del rapporto, confermate dalla misura):

1. **(consigliata)** Lasciare così. Servono due «Sostituisci» e un livello aperto in mezzo, e si
   perde solo la partita di un livello che, nel frattempo, il file stesso aveva chiuso.
2. Togliere `apertoAncora` dal controllo della presentazione (`useQuadro.js:204`). Così la voce
   del livello chiuso resta finché non si fa la prima mossa di un altro livello.
3. Cancellare la voce appena si scopre chiusa: comportamento chiaro, ma irreversibile.

### O2 — Con il fuoco sul pulsante che perde le mosse, la frase che lo dice non è legata alla finestra

**Visto:** nell'albero di accessibilità di Chromium (CDP `Accessibility.getFullAXTree`, caso E,
360x640, it) ci sono: `dialog «Il livello 100 è a metà.»` con descrizione `null`, e
`button «Gioca il livello 101»` con descrizione `null`, `focused: true`. La frase «Se giochi il
livello 101, perdi le mosse fatte nel livello 100.» è un paragrafo dentro la finestra, ma
nessun `aria-describedby` la collega (`src/ui/ConfermaDoppia.jsx:138-145`).

Prima della 1.22.2 il fuoco stava sul pulsante che non perde niente. Con PO-043 sta su quello che
perde le mosse. Così un lettore di schermo che legge solo il nome della finestra e il pulsante
con il fuoco può non dire «perdi le mosse». Che cosa legga davvero TalkBack **non posso
confermarlo**: non l'ho provato su un telefono. Lo stesso vale per `ConfermaDoppia`
(`:40`), ma lì il fuoco non si sposta.

Opzioni:

1. **(consigliata)** Dare un `id` a `.pl-azzera__testo` e collegarlo con `aria-describedby` sulla
   finestra, in `ConfermaPerdita`, con un suo interruttore. Va bene per tutte le domande e non
   cambia niente sullo schermo.
2. Provare prima con TalkBack su un telefono vero e decidere dopo.
3. Lasciare così.

### O3 — La ripresa automatica ricorda il livello chiuso, e dopo il ripristino ci riporta dentro

Questo punto è la scelta aperta 3 del rapporto, qui misurata.

**Visto (R1):** dopo «Sostituisci» con 1-10, `plinto:ripresa` resta
`{"dove":"quadro","quadro":100,…}`. Ricaricando si resta in home, quindi è corretto. Dopo il
ripristino con 1-100, ricaricando entro due ore si entra **da soli nel 100**, con le 3 mosse,
anche se il pulsante grande dice «Livello 101». È lo stesso comportamento che c'era prima
dell'importazione (R1, avvio: ripresa automatica nel 100). È coerente con «ignorare, non
cancellare» e con la finestra di due ore (`src/persistence/ripresa.js`). Lo stesso succede
con l'11 non superato (R3).

Opzioni:

1. **(consigliata)** Lasciare così: riporta dove si era, come prima dell'importazione.
2. Chiamare `dimenticaPosto()` quando la ripresa trova un livello chiuso (`App.jsx:465-467`).
   Così dopo un ripristino si torna in home.

### O4 — `CLAUDE.md` dice «28 file Vitest», ma `npm test` ne esegue 51

**Visto:** in `CLAUDE.md:23` c'è `npm test  # 28 file Vitest, ~25 s`. L'esecuzione dà «Test Files
51 passed (51)», «Tests 704 passed (704)», in 21 s. Non ho toccato `CLAUDE.md`: non rientra in
questo compito.

Opzioni: 1 **(consigliata)** correggere il numero alla prossima voce dei registri; 2 togliere il
numero e lasciare solo la durata.

### Scelta aperta 2 del rapporto: c'è un'altra strada verso un livello chiuso?

Ho cercato in parte e non ho trovato strade nuove. L'unico indirizzo che il gioco riconosce è
`#/sfida/AAAA-MM-GG` (`src/ui/rotta.js:6`), quindi nessun collegamento apre un livello. Dalla
mappa le tappe chiuse sono `disabled` (R1, R4). Che non ci siano strade del tutto diverse
**non posso confermarlo**: non ho letto tutto `App.jsx` con questo scopo.

## 6. Che cosa non ho verificato

- Telefono vero, la TWA del Play Store, TalkBack, iPhone.
- Il **service worker** era bloccato: non ho provato il passaggio dalla 1.22.1 in cache alla
  1.22.2.
- Il caso in cui si vince un livello chiuso. Con la 1.22.2 non ci si arriva più dalle strade che
  ho provato.
- `e2e-schermi`, `e2e-quadri`, `soak` e i 200 livelli non li ho rilanciati: la 1.22.2 non tocca
  la partita, e la CI «verifica» del merge è verde.
- La «verifica» di `4dc9eb6`: era ancora in corso.

## 7. Sintesi

La 1.22.2 è quella pubblicata: la build di `main` è identica al sito, e la CI del merge è verde.
**PO-043** si comporta come descritto in 32 combinazioni su 32: «Gioca il livello N» è pieno,
primo e con il fuoco solo se il livello a metà è superato. Escape, il tocco fuori e Indietro non
perdono niente, e il caso non superato è invariato. **PO-042** funziona in tutti i formati: dopo
un «Sostituisci» più povero il pulsante e la ripresa automatica non aprono il livello chiuso, e
rimettendo il salvataggio completo la partita torna com'era, compresa la ripresa automatica.
L'unica eccezione è quando, nel frattempo, si apre un altro livello (O1, limite già noto). Le
altre domande sono invariate (32 su 32). I comandi automatici sul sito sono 6 verdi su 6, e
`e2e-torre-aperta` ora vale anche contro il sito.

Nessun E. Un D, non nato con questa versione: con la tastiera la tappa con il fuoco può finire
sotto le schede fisse (D1). Quattro O. La più legata a questa versione è O2: adesso il fuoco sta
sul pulsante che perde le mosse, e la frase che lo dice non è collegata alla finestra.
