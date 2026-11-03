# Collaudo 1.22.1 — Dopo la Torre

Figlia di collaudo, 3 novembre 2026, ramo `collaudo-1.22.1` (da `main` a `8ce31f4`). Codice
non toccato; qui solo questo rapporto, le schermate in `collaudo-1.22.1/` e gli script delle
prove a mano in `collaudo-1.22.1/script/` (fuori dal gate; importano il motore da
`/home/user/Plinto/src` con percorsi assoluti, quindi vanno adattati per rilanciarli altrove).

**Sito collaudato:** https://antoniovairo-rgb.github.io/Plinto/. Il sito serve
`assets/index-Ce2BJDIo.js`, che contiene «1.22.1» (4 volte); la home mostra «v1.22.1» (anche
nell'oggetto della mail «Idee e segnalazioni»). Ho ricostruito la build da `main` con
`npm run build`: lo stesso nome di bundle, e il bundle è identico byte per byte (SHA-256
`34e3921fd55fb796…`). Sono identici anche `index.html`, `sw.js`, `manifest.webmanifest` e
`anteprima-social.png`. `index.html` pubblicato dice «200 livelli, ognuno con il suo
obiettivo…» in `og:description` e `twitter:description`, e `og:image:alt` dice «La griglia di
PLINTO con i blocchi colorati e il nome del gioco.».

**Strumenti:** Chromium preinstallato, headless, Playwright di `node_modules`. Service worker
bloccato (`serviceWorkers: 'block'`), così leggo sempre il sito appena pubblicato. Formati:
telefono verticale 360x640 e coricato 640x360 (tocco, `isMobile`), tablet 768x1024 (tocco), PC
1366x768 (mouse). Prove in italiano e in inglese. Sui formati col tocco i pulsanti si toccano con
`touchscreen.tap`.

**Salvataggi finti:** li ho scritti come li scrive il gioco. Progressi in `plinto:quadri`
(`{"versione":1,"livelli":{…}}`). Il livello a metà in `plinto:partita-quadro`
(`{numero, partita: serializeGame(...), presentazione:false}`, come `tests/e2e/pulsante-livello.mjs`).
Le mosse della partita a metà sono vere: le ha giocate il motore del sorgente
(`placePiece`), 1 o 3 mosse a seconda del caso. Impostazioni in `plinto:settings` con
`introVista: true` e, salvo dove serve il contrario, `avvisoTorre: true`.

## 1. Controlli automatici contro il sito pubblicato

Variabile `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`, nessun `vite` acceso.

| Comando | Esito | Durata |
|---|---|---|
| `npm run e2e-po041` | verde (A «Livello 101» e apre il 101; B e C «Livello 11») | 5 s |
| `npm run e2e-torre-aperta` | **rosso, ma per un limite della prova**: «console: Failed to load resource: … 404». Tutti gli altri passi sono verdi, misure delle schede uguali a quelle di RAPPORTO-PO-040 nei 24 formati. Vedi O2 | 50 s |
| `npm run e2e-trionfo` | verde, compreso il caso coricato in 5 formati per Ponte e Torre | 47 s |
| `npm run correzioni` | verde; caso O6: «Puoi tenerne al massimo 3: gli altri 19 sono andati persi.» con «Unisci» e con «Sostituisci» | 35 s |
| `npm run e2e-ripresa` | verde | 14 s |
| `npm run e2e-po008` | verde: «94 tentate, 0 ritentate, 0 non fatte» | 201 s |
| `npm run archivio` | verde | 15 s |
| `npm run indietro` | verde | 11 s |
| `npm run e2e` | verde, «Nessun problema rilevato» | 41 s |
| `npm run guida` | verde | 14 s |
| `npm run e2e-salvataggio` | verde | 13 s |

**10 verdi su 11.** L'unico rosso viene dalla prova, non dal gioco (O2).
In più, sul sorgente di `main`: `tests/annunci.test.js`, `tests/gettoni-persi.test.js`,
`tests/avviso-torre.test.js` e `tests/anteprima-collegamento.test.js` sono verdi
(4 file, 25 test).

Il riquadro `e2e-schermi` (13 minuti) e `e2e-quadri` non li ho rilanciati: la 1.22.1 non tocca
la partita, e la madre li ha fatti girare nel gate (`docs/DECISIONI.md`, 3 novembre).

## 2. PO-041 — il pulsante grande della home

Script `po041.mjs`, 360x640, 12 casi per 2 lingue. Per ogni caso ho letto la scritta del
pulsante e il suo nome accessibile, poi l'ho toccato. Se si apriva la presentazione, ho toccato
anche «Gioca».

| Caso | Salvataggio | Pulsante (it / en) | Il tocco apre | Dopo «Gioca» |
|---|---|---|---|---|
| A | 1-100, il 100 a metà (1 mossa) | «Livello 101» / «Level 101» | presentazione del 101 | domanda «Il livello 100 è a metà.», vedi O1 |
| A0 | 1-100, il 100 aperto senza mosse | «Livello 101» | presentazione del 101 | nessuna domanda |
| T1 | **200 su 200**, il 150 a metà | «Livello 200» | presentazione del 200 | domanda sul 150 |
| T2 | 200 su 200, il 200 a metà | «Livello 200» | **il 200 ripreso** (plancia) | — |
| T3 | 200 su 200, l'1 a metà | «Livello 200» | presentazione del 200 | domanda sull'1 |
| W1 | 1-110, il **105 della Torre** (superato) a metà | «Livello 111» | presentazione del 111 | domanda sul 105 |
| W2 | 1-110, il 101 a metà | «Livello 111» | presentazione del 111 | domanda sul 101 |
| I1 | 1-4, il 5 con 8 tentativi e senza spunta, il **6 aperto per insistenza** a metà | «Livello 6» | il 6 ripreso | — |
| I2 | 1-4, il 5 con 8 tentativi, 6-7 superati, il **5** a metà | «Livello 5» | il 5 ripreso | — |
| I3 | come I2, ma a metà c'è il 6 (superato) | «Livello 8» | presentazione dell'8 | domanda sul 6 |
| I4 | 1-98, il 99 con 8 tentativi, il 99 a metà | «Livello 99» | il 99 ripreso | — |
| N | 1-57, niente a metà | «Livello 58» | presentazione del 58 | nessuna domanda |

- **24 casi su 24 come atteso**, in italiano e in inglese. Il livello aperto è sempre quello
  scritto sul pulsante. Errori in console: 0.
- La partita lasciata a metà non si perde. Nei casi A, T1, W1, W2 e I3, `plinto:partita-quadro`
  ha ancora lo stesso livello dopo il tocco. Nel caso A0 viene sovrascritta dal 101, ma non
  c'erano mosse da perdere.
- **Nome accessibile:** il pulsante non ha `aria-label`. Il nome è la scritta stessa, «Livello
  101» / «Level 101» (albero di accessibilità di Chromium, `ariaSnapshot`). La mappa dice «Mappa
  dei livelli, La Torre: 0 di 100», e con 200 su 200 «La Torre: 100 di 100».
- **Ripresa dalla mappa (PO-008), caso A con 3 mosse**, nei 4 formati: la mappa si apre sulla
  scheda «La Torre». Si passa al Ponte, si tocca il 100 e il livello si riapre sulla plancia con
  le mosse fatte: punteggio 29, «MOSSE 21», `stats.moves` 3. Con Indietro si torna alla mappa e
  il salvataggio del 100 resta. Schermata: `po008-ripresa-100-dalla-mappa-360x640-it.png`.
- **Nella domanda del caso A:** «Riprendi il livello 100» riprende il 100 con le sue 3 mosse.
  «Gioca il livello 101» apre il 101 da zero, e il 100 a metà si perde come dice la domanda
  (`plinto:partita-quadro` passa al 101, 0 mosse).
- Schermate: `po041-{A,T1,W1,I2}-home-360x640-it.png`, `po041-A-dopo-gioca-360x640-it.png`.

### 2.1 Importazione di un salvataggio con un livello a metà

Script `importa.mjs`. I file li ho esportati dal gioco stesso con «Copia il testo», da un
browser preparato con quei progressi. Poi li ho incollati con «incolla qui» → «Leggi» →
«Unisci» o «Sostituisci tutto» (+ «Sì»), sul telefono con un livello a metà. Esportare non porta
con sé `plinto:partita-quadro` (`DOCUMENTI`, `src/persistence/salvataggio.js:86-95`), quindi il
livello a metà è sempre quello del telefono.

| Caso | Telefono | File, modo | Pulsante dopo | Il tocco apre | Dopo una ricarica |
|---|---|---|---|---|---|
| M1 | 1-10, l'11 a metà | 1-100, Unisci | «Livello 101» | presentazione del 101 | «Livello 101» |
| M2 | 1-10, l'11 a metà | 1-100, Sostituisci | «Livello 101» | presentazione del 101 | «Livello 101» |
| M3 | 1-100, il 100 a metà | 1-10, Sostituisci | **«Livello 100»** | **il 100, chiuso** | si apre da solo il livello 100 |
| M4 | 1-100, il 100 a metà | vuoto, Sostituisci | **«Livello 100»** | **il 100, chiuso** | si apre da solo il livello 100 |
| M5 | 1-110, il 105 a metà | 1-100, Sostituisci | **«Livello 105»** | **il 105, chiuso** | si apre da solo il livello 105 |

M1 e M2 vanno bene: il pulsante si aggiorna senza ricaricare (`rileggiTutto`). Per M3-M5 vedi D1.

## 3. PO-040

### O1 — Avviso della Torre (`AVVISO_TORRE`)

Salvataggio 1-100, `avvisoTorre: false`, 4 formati × 2 lingue (`po040.mjs`):

| Domanda | Risultato misurato |
|---|---|
| La finestra compare? | sì, 8 su 8. Nome accessibile «La Torre» / «The Tower» |
| Testo | «La Torre è aperta: altri cento livelli e una regola nuova, i massi.» con «Entra nella Torre» e «Non ora». In inglese «The Tower is open: a hundred more levels and a new rule, the boulders.» con «Enter the Tower» e «Not now» |
| Fuoco | su «Entra nella Torre» / «Enter the Tower», 8 su 8 |
| Sta nello schermo? | sì, 8 su 8 (anche a 640x360) |
| «Entra nella Torre» | apre la mappa con la scheda «La Torre» scelta, 8 su 8 |
| Ricaricando | nessuna finestra, 8 su 8; `avvisoTorre` è già `true` mentre la finestra è aperta |
| «Non ora», poi mappa e ritorno | nessuna finestra |
| 101 superato / 99 su 100 / nessun livello | nessuna finestra |
| Guida non vista | prima la guida («Passo 1 di 6»); saltata la guida, la finestra della Torre compare |
| Esportazione | `settings.avvisoTorre: true` nel file copiato (`versioneGioco` 1.22.1) |

Schermate: `o1-avviso-{360x640,640x360,768x1024,1366x768}-it.png`, `o1-avviso-360x640-en.png`.

### O2 e O3 — Schede della mappa (`SCHEDE_FISSE`, `ATTI_SENZA_RIGA_SE_CHIUSA`)

Salvataggi con 57, 99 e 100 livelli; mappa aperta dalla home; 4 formati × 2 lingue (24 aperture).

- Schede appena aperta la mappa, in px dall'alto: 74-114 a 360x640 e a 640x360, 126-166 a
  768x1024, 105-145 a 1366x768. Sono sempre dentro lo schermo e la pagina non sporge di lato.
  Le misure di `e2e-torre-aperta`, prese su 24 formati sul sito pubblicato, sono uguali a quelle
  di RAPPORTO-PO-040.
- Scheda chiusa: con 57 livelli dice «La Torre · mancano 43 livelli» / «43 levels to go», con 99
  «manca 1 livello» / «1 level to go». Con il Ponte finito non c'è nessuna seconda riga, e la
  mappa si apre sulla Torre.
- Toccando la Torre chiusa: «La Torre si apre quando hai superato tutti i livelli del Ponte,
  ognuno con la spunta. Te ne mancano 43.». In nessuno dei 16 casi con la Torre chiusa compare
  «Si apre quando arrivi al livello» o «Opens when you reach level».
- Tastiera: dalla scheda scelta, la freccia sinistra porta il fuoco sull'altra scheda e la
  sceglie (`aria-selected` true). Una sola scheda ha `tabIndex` 0.

Schermate: `o2o3-torre-chiusa-{57,99}-{360x640,640x360}-{it,en}.png`,
`o2-mappa-ponte-finito-{360x640,640x360}-{it,en}.png`. Vedi O3 di questo rapporto.

### O4 — Festa coricata (`TRIONFO_CORICATO`)

Misurata da `e2e-trionfo` sul sito pubblicato, per la festa del Ponte e per quella della Torre:
640x360 riepilogo 0-340 (alto 360) e pulsanti 340-640; 800x360, 915x412, 1024x600 e 1280x620
con il riepilogo a tutta altezza e i pulsanti a destra; i numeri da 231 a 304-319 px.
Schermate: `o4-festa-ponte-640x360.png`, `o4-festa-torre-640x360.png` (copiate dall'uscita della
prova). A 640x360 «Entra nella Torre» si vede subito e i tre numeri sono interi. Sotto i numeri
il riquadro «E adesso?» è tagliato dal fondo dello schermo. Che scorrendo si legga intero
**non l'ho provato** su questa versione.

### O5 — Annunci al singolare (`ANNUNCI_ACCORDATI`)

Giocati con il mouse sulla partita libera del sito (1366x768), da una griglia preparata con la
prima riga piena tranne una casella e tre pezzi da una casella (`annunci.mjs`). Testo letto da
`[role="status"]`:

| Mossa | it | en |
|---|---|---|
| un pezzo senza eliminare niente | «più 1 punto.» | «plus 1 point.» |
| chiude la prima riga | «Bene. 1 riga eliminata. più 26 punti. Catena 1.» | «Nice. 1 row cleared. plus 26 points. Chain 1.» |

Il caso «!.» non l'ho riprodotto sul sito: serve una mossa grande, che faccia comparire
«Eccellente!». Lo copre `tests/annunci.test.js`, verde. Sul sito **non posso confermarlo**.

### O6 — Gettoni guadagnati e persi

`npm run correzioni`, caso O6, sul sito pubblicato: «Hai guadagnato 3 gettoni per gli
attrezzi. Adesso hai 3 gettoni. Puoi tenerne al massimo 3: gli altri 19 sono andati persi.» con
«Unisci» e con «Sostituisci». In magazzino `{disponibili: 3, riscossi: 22}`.

### Anteprima dei collegamenti

Vedi l'intestazione: «200 livelli» in tutte e due le descrizioni, «griglia» nell'`og:image:alt`.
Che cosa mostrino WhatsApp e Telegram con le anteprime già salvate **non posso confermarlo**.

## 4. Regressioni vicine

| Cosa | Come | Esito |
|---|---|---|
| Ripresa del livello (PO-008) | `e2e-po008`, `e2e-ripresa` e la ripresa del 100 dalla mappa (§ 2) | verde |
| «Riprendi la partita» della libera | 4 formati: avviata dalla home, Indietro del browser, home | il pulsante si chiama «Partita libera, riprendi la partita in corso» (accanto c'è «Nuova partita libera»); il tocco riapre la plancia. Che sia la stessa partita lo prova `e2e-ripresa` (stessi punti prima e dopo); io il seme non l'ho confrontato |
| Sfida del giorno | 4 formati, come sopra | «Sfida del giorno, riprendi la sfida in corso»; il tocco riapre «Sfida di oggi, 3 novembre». `archivio` e `e2e` verdi, compresa la ricarica durante la pausa |
| Mappa | § 3 | come sopra |
| Tasto Indietro | `npm run indietro` | verde; dal livello ripreso Indietro va alla mappa |
| Lettore di schermo, home | `ariaSnapshot` in it ed en: nuovo giocatore, Ponte finito col 100 a metà, 200 su 200 | nomi: «Livello N», «Mappa dei livelli, <opera>: X di 100», «Partita libera», «Sfida del giorno, gioca la sfida di oggi», «Archivio delle sfide», poi «Come si gioca», «Statistiche», «Il tuo profilo di gioco», «Impostazioni», «Info», «Sostieni il progetto», il collegamento «Idee e segnalazioni». Nessun nome vuoto, nessuna concatenazione |

Errori in console nelle prove a mano: 0, salvo il 404 di O2.

## 5. Che cosa ho trovato

Nessun **E** (blocco o dati persi): non ne ho trovati.

### D1 — Dopo «Sostituisci tutto» il pulsante grande apre un livello chiuso

**Passi:** telefono con il Ponte finito e il livello 100 lasciato a metà. Impostazioni →
«incolla qui» → un salvataggio con i livelli 1-10 (o vuoto) → «Leggi» → «Sostituisci tutto» →
«Sì» → Indietro.

**Atteso:** «Livello 11» (o «Livello 1»), perché il 100 adesso è chiuso.

**Visto:** il pulsante dice «Livello 100» (`po041-import-M3-home-360x640-it.png`). Toccandolo si
apre il 100 sulla plancia, con la mossa fatta («Punteggio 23»). Nella mappa (stesso stato scritto
direttamente: 1-10 superati e il 100 a metà) la tappa 100 è chiusa e non si può
toccare: `disabled`, «Livello 100: Supera prima tutti gli altri livelli.»
(`d1-tappa-100-chiusa-360x640-it.png`). Ricaricando la pagina si riapre da solo il livello 100.
Succede lo stesso con il 105 e un file con il solo Ponte (M5). È un livello vietato dalla regola
«l'ultimo livello si guadagna per intero» (`src/persistence/progressi.js:134`).

**Dove:** `livelloInSospeso`, `src/ui/App.jsx:597-607`. Toglie dal pulsante il livello salvato
solo se è *superato*; un livello salvato che *non è più aperto* resta sul pulsante.
`numeroSalvato` (`src/state/useQuadro.js:121-126`) non guarda se è aperto. `apriQuadro`
(`App.jsx:529-539`) riprende senza controllare. «Sostituisci» non tocca `plinto:partita-quadro`,
che non è tra i `DOCUMENTI` (`src/persistence/salvataggio.js:86-95`).

**Non è nato con la 1.22.1.** Prima di `d883866` il pulsante prendeva sempre il livello salvato
(diff di `d883866` su `App.jsx`). Lo deduco dal codice: la 1.22.0 non l'ho provata. Il varco però
sta nella stessa regola di PO-041. Che cosa succeda vincendo il 100 chiuso (spunta sul 100 con
gli altri livelli mancanti) lo deduco dal codice: `registraTentativo`
(`src/persistence/progressi.js:226`) non guarda se il livello è aperto. **Non l'ho provato.** Per arrivarci serve un «Sostituisci» con un file più povero mentre un
livello è a metà: quanto capiti **non posso confermarlo**.

Opzioni:

1. **(consigliata)** Il livello salvato va sul pulsante, e si riprende (pulsante, ripresa
   automatica, `apriQuadro`), solo se `quadroSbloccato(numero)`. Un livello chiuso ricomincia
   dal livello corrente; la sua partita si cancella o si ignora. Aggiungere il caso «D» a
   `npm run e2e-po041`: telefono con il Ponte finito e il 100 a metà, Sostituisci con 1-10,
   atteso «Livello 11».
2. «Sostituisci tutto» cancella anche `plinto:partita-quadro` e la ripresa, come chi ripristina
   un telefono. Si chiude la strada dell'importazione, non le altre eventuali.
3. Lasciare così e scriverlo come decisione, perché il caso è raro.

### O1 — Il caso del PO, passo dopo: la domanda propone di tornare al 100

Con il Ponte finito e il 100 a metà *con delle mosse* (caso A), il pulsante dice giustamente
«Livello 101». Toccando «Gioca» nella presentazione del 101 compare però «Il livello 100 è a
metà. Se giochi il livello 101, perdi le mosse fatte nel livello 100.». Il pulsante pieno, con il
fuoco, è «Riprendi il livello 100»; «Gioca il livello 101» è il pulsante fantasma
(`po041-A-dopo-gioca-360x640-it.png`; `ConfermaDoppia.jsx:140`; `CONFERMA_ALTRO_LIVELLO`,
`App.jsx:85`, `avviaQuadro` `App.jsx:542`). È il comportamento voluto da PO-008 E1 e dice il
vero. Ma chi tocca d'istinto il pulsante evidenziato torna nel 100, cioè dove il PO non voleva
finire. Uguale con 200 su 200 (domanda sul 150, sull'1) e nella Torre (domanda sul 105). Opzioni:

1. **(consigliata)** Lasciare così e scriverlo nella decisione PO-041: la domanda protegge le
   mosse, e dice in chiaro di quale livello si tratta.
2. Se il livello a metà è già superato, fare di «Gioca il livello 101» il pulsante pieno: si
   perde solo una rigiocata.
3. Se il livello a metà è già superato, non chiedere niente. Le mosse si perdono in silenzio:
   sconsigliata.

### O2 — `e2e-torre-aperta` è rossa contro il sito pubblicato, per un limite della prova

`tests/e2e/torre-aperta.mjs:176-179` fa `import('/src/persistence/salvataggio.js')` dentro la
pagina. Quel file esiste solo con il server di sviluppo: sul sito risponde
`404 https://antoniovairo-rgb.github.io/src/persistence/salvataggio.js` (visto con un
ascoltatore delle risposte su una copia temporanea della prova, poi cancellata). Il 404 finisce
tra gli errori della console e la prova esce con 1. Il controllo che voleva fare (l'esportazione
porta `avvisoTorre`) con il `.catch(() => null)` salta in silenzio. L'ho rifatto a mano con
«Copia il testo» ed è vero (§ 3). Nel gate la prova avvia da sola il server di sviluppo (`npx vite`,
`tests/e2e/torre-aperta.mjs`), che serve anche `/src/…`: lì è verde (gate a pezzi della madre
tutto a 0, CI del merge verde, `docs/DECISIONI.md`, riga del 3 novembre). Opzioni:

1. **(consigliata)** Leggere l'esportazione dal pulsante «Copia il testo», come
   `tests/e2e/salvataggio.mjs`. Così vale sia in sviluppo sia sul sito.
2. Saltare quel passo quando è impostato `PLINTO_E2E_URL`, e dirlo nell'uscita.

### O3 — «Te ne manca uno.» accanto a «manca 1 livello»

Con 99 livelli, nella stessa schermata, la scheda dice «manca 1 livello» e il riquadro «Te ne
manca uno.» (`src/i18n/it.js:470` e `:474`; in inglese «One to go.» e «1 level to go»,
`en.js:393`, `:395`). Schermata `o2o3-torre-chiusa-99-360x640-it.png`. Dicono la stessa cosa, una
in lettere e una in cifre. Opzioni: 1 **(consigliata)** lasciare: non confonde; 2 «Te ne manca 1.»
per uniformità.

### O4 — Annunci: frase che comincia in minuscolo

«… 1 riga eliminata. più 26 punti.» e «plus 1 point.» da solo. La frase comincia minuscola dopo
un punto, o all'inizio. C'era già prima: è la scelta aperta 5 di RAPPORTO-PO-040. Per il lettore
di schermo non cambia la pronuncia. Che lo faccia con TalkBack **non posso confermarlo**. Opzioni:
1 **(consigliata)** lasciare; 2 maiuscola all'inizio di ogni frase.

## 6. Che cosa non ho verificato

- Telefono vero, la TWA del Play Store, TalkBack, iPhone.
- Il **service worker**: era bloccato. Il passaggio da una 1.22.0 in cache alla 1.22.1 non l'ho
  provato.
- Le feste vinte col dito: le misure della festa coricata vengono da `e2e-trionfo`; io non ho
  vinto il 100 o il 200 a mano.
- La 1.22.0 non l'ho provata: che D1 ci fosse già lo dico leggendo il diff.
- `e2e-schermi`, `e2e-quadri`, `soak`, i 200 livelli: non rilanciati (vedi § 1).

## 7. Sintesi

PO-041 funziona sul sito pubblicato: 24 casi su 24, compresi il tutto finito, la Torre già
superata, i livelli aperti per insistenza e l'importazione con «Unisci». Il tocco apre sempre il
livello scritto. PO-040 (O1-O6 e l'anteprima) è come descritto, in 4 formati e 2 lingue.
Automatici: 10 verdi su 11; il rosso è un limite della prova (O2). Nessun E. Un D, non nato con
questa versione: dopo «Sostituisci tutto» con un salvataggio più povero, il pulsante grande e la
ripresa automatica aprono un livello che la mappa dice chiuso (D1). Quattro O; la più vicina al
PO è O1: dopo «Livello 101» → «Gioca», il pulsante evidenziato è «Riprendi il livello 100».
