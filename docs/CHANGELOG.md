# Changelog

Tutte le modifiche degne di nota a PLINTO. Il formato segue una versione semplificata di
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa
[Versionamento Semantico](https://semver.org/lang/it/).

La versione è dichiarata in un solo posto — il campo `version` di `package.json` — e
`vite.config.js` la inietta nel bundle come `__APP_VERSION__`.

## [0.2.3] — 6 settembre 2026

Tre correzioni nate dallo stesso playtest umano della versione precedente.

### Cambiato

**Il segno della bomba adesso sembra una bomba (`src/ui/Bomba.jsx`)**
- Era un anello bianco al centro della cella. Rispettava la regola giusta — segno
  **geometrico e non cromatico**, così lo vede anche chi non distingue i colori — ma
  sbagliava quella più importante: **non sembrava una bomba.** Un cerchio può essere un
  bersaglio, un bottone, un buco. Un giocatore che non riconosce il simbolo non sa che
  quella cella cambierà l'esito della sua mossa, e allora tanto vale non averlo.
- Adesso è una bomba disegnata: corpo tondo, riflesso, tappo, miccia e **scintilla**.
  Il corpo è quasi nero e regge su tutte e sei le famiglie cromatiche in entrambi i temi;
  la scintilla è l'unica parte accesa **ed è l'unica che si muove**, così l'occhio ci va
  e il resto si legge di conseguenza. Verificata a 26px (tray), 34px (plancia) e 64px.
- È SVG dentro il codice come tutto il resto: nessun file, nessuna licenza, nessuna
  richiesta di rete. Sostituisce lo pseudo-elemento CSS, quindi il segno ora è un
  componente solo (`Bomba`) usato sia dalla plancia sia dal tray, invece di due regole.

**Si chiamano livelli, non "Quadri"**
- Il nome interno era un gioco di parole con la griglia, ma per chi gioca un livello è un
  livello. Rinominato in **tutti** i testi dell'interfaccia, in italiano e in inglese
  (`Stage` → `Level`).
- **Il codice non è stato rinominato**: `quadro.js`, `quadri.js`, `useQuadro` e compagnia
  si chiamano ancora così. È una scelta, non una dimenticanza — un rinomina meccanico su
  dieci file per una parola che compare anche dentro "quadrante" è esattamente il modo in
  cui in questo progetto `QUADRANT_SIZE` è già diventato una volta `PLINTONT_SIZE`. Va
  fatto a parte e con calma. Nel frattempo il vocabolario del prodotto e quello del
  codice divergono, ed è detto qui perché nessuno lo scopra per caso.

### Aggiunto

**Fra un livello e l'altro succede qualcosa (`src/ui/AvanzamentoMappa.jsx`)**

Prima si vinceva, si leggeva "superato" e si premeva un pulsante. Adesso la schermata di
vittoria fa **tre cose, in quest'ordine**:

1. **Festeggia.** Plinto salta una volta, due coriandoli cadono. Una volta sola, non in
   ciclo: un festeggiamento che non finisce smette di essere un festeggiamento.
2. **Mostra dove sei arrivato.** Un pezzo del percorso — la tappa appena superata, quelle
   intorno — con il segno che **si sposta** dalla tappa vecchia a quella nuova e la barra
   che **si allunga** mentre la guardi. Non è la mappa completa: quella è uno strumento
   per orientarsi, questo è un momento. Il progresso si sente quando lo si vede accadere.
3. **Manda al livello nuovo**, che si apre spiegandosi (la schermata della 0.2.2).

- Il conteggio dei livelli superati viene ora riletto **appena un livello finisce**: prima
  si aggiornava solo tornando alla mappa, e la barra sarebbe rimasta ferma proprio nel
  momento in cui il giocatore è andato avanti.
- Con `prefers-reduced-motion` o l'impostazione Animazioni spenta si vede lo stato di
  arrivo, senza ritardo e senza movimento: **la stessa informazione**, non meno.
- `npm run e2e-quadri` verifica nel browser che il percorso compaia, che Plinto si sia
  **spostato sulla tappa successiva** e che il conteggio dica 1 e non 0 — che è il difetto
  più facile da fare qui, mostrare il valore letto prima della vittoria.


## [0.2.2] — 6 settembre 2026

### Aggiunto

**Plinto spiega l'obiettivo all'inizio di ogni Quadro (`src/ui/schermate/AperturaQuadro.jsx`)**

Da un playtest umano — il primo di questo progetto — è emersa una lacuna che nessun test
poteva trovare: **il gioco dice cosa fare ma non spiega mai cosa significhi.** La striscia
sopra la plancia scrive «Chiudi una riga» e un contatore `0/1`; che cosa sia una riga, e come
convenga affrontarla, non è scritto da nessuna parte. La presentazione al primo avvio non
copre il buco: è una schermata sola, si vede una volta e non si può più rileggere.

- Ogni Quadro ora si apre con Plinto che dice, in quest'ordine: **la frase dell'obiettivo**
  (la stessa che resterà sopra la plancia), **che cosa significa**, **un consiglio su come
  ottenerlo** e **quante mosse hai**.
- Il consiglio è un consiglio vero, non un incoraggiamento. «Scegline una e finiscila, invece
  di riempirne tre a metà» è un'informazione; «ce la puoi fare» non lo è.
- Testi scritti per **tutti e dieci** i tipi di obiettivo dichiarati in `OBIETTIVI`, non solo
  per i nove che il percorso usa oggi: chi aggiungerà un Quadro con il decimo non deve
  scoprire da un giocatore che manca la frase.
- **Non si rivede premendo "Riprova"**: dopo un Quadro fallito si vuole ritentare subito, e
  rileggere la stessa schermata a ogni tentativo la trasformerebbe da aiuto in pedaggio.
  Resta raggiungibile tornando all'elenco e riaprendo il Quadro.
- Verificato da `tests/quadri.test.js` (4 test nuovi) e da `npm run e2e-quadri`. I test
  controllano la cosa che si rompe davvero: una spiegazione mancante non fa fallire niente,
  mostra la **chiave di traduzione** al posto della frase — e la mostra proprio a chi sta
  imparando le regole. Lo scenario nel browser verifica anche che la frase dell'apertura e
  quella sopra la plancia siano **la stessa**: se dicessero cose diverse, il giocatore non
  saprebbe a quale credere.

### Noto e non risolto

- **Le bombe non sono spiegate da nessuna parte.** Il giocatore vede un anello bianco al
  centro di un blocco e nessun testo dell'applicazione dice che cosa faccia. È l'unico
  elemento che cambia l'esito di una mossa, e compare già nella prima mano del Quadro 1.
- **Non c'è modo di rileggere le regole.** L'introduzione compare una volta sola e non esiste
  una voce "Come si gioca". Non sono spiegati nemmeno l'Intreccio, la modalità a due tocchi e
  il gioco da tastiera.


## [0.2.1] — 6 settembre 2026

Nessuna regola di gioco cambiata. Questa versione chiude difetti trovati riverificando codice e
documentazione riga per riga, e soprattutto **sostituisce affermazioni con controlli**: dove
prima c'era un numero scritto a mano in un commento, ora c'è un comando che lo produce.

Controlli: `npm test` passa con **161 test in 14 file**, `npm run build` riesce, `npm run e2e`
non rileva problemi, `npm run precisione` riporta 201 prove su 41 forme senza scostamenti.

### Corretto

**Contrasti del tema chiaro sotto la soglia WCAG AA**
- `--pl-text-faint` stava a **3.94:1** sul fondo più sfavorevole dell'interfaccia, sotto la
  soglia AA di 4.5 che il commento di `tokens.css` **dichiarava di rispettare**. Sotto soglia
  anche `--pl-brand` (4.45), `--pl-ok` (4.46) e `--pl-danger` (4.25).
- La causa è di metodo: i valori erano dichiarati contro `--pl-ink`, il fondo *più favorevole*
  dei quattro. Misurare sul caso migliore non è misurare. Ora il riferimento è `--pl-ink-2`,
  il peggiore, e i quattro token sono stati scuriti: `#60687a` (4.69), `#7f6628` (4.60),
  `#307469` (4.61), `#a54c64` (4.62).
- **Nuovo `tools/contrasti.mjs` (`npm run contrasti`) e `tests/contrasti.test.js`**: i
  contrasti si ricalcolano leggendo `tokens.css` e la suite fallisce se anche uno solo scende
  sotto soglia. È la terza volta che compare questo difetto: una correzione puntuale non lo
  chiude, un controllo automatico sì.

**Il commento di `CHAIN_GRACE` descriveva una regola che non esiste più**
- Diceva «tolleranza 2 (ora)» e riportava misure (2% / 11% / 24%) della *seconda* versione
  della Catena, mentre la costante vale 1 dalla terza. Il codice era giusto, il commento no.
- Anche qui la correzione non è stata battere altri numeri a mano: **nuovo
  `tools/misura-catena.mjs` (`npm run catena`)**, che fa giocare lo `stratega`, registra la
  sequenza dei gruppi chiusi e la rigioca con la regola attuale e con le quattro varianti
  scartate. Il commento riporta la tabella e il comando che la produce.
- Il limite dello strumento è dichiarato dentro lo strumento: le partite sono giocate con la
  regola attuale e lo stratega guarda la Catena quando sceglie, quindi **solo la riga della
  regola attuale è una misura esatta**; le altre sono controfattuali.

**`tests/durate.test.js` garantiva meno di quanto dichiarasse**
- Il controllo che vieta le durate scritte a mano nelle `animation:` cercava `\d+m?s`, cioè
  solo numeri interi: `1.6s` di `pl-bomba-respira` e `3.2s` di `pl-plinto-respira` non venivano
  nemmeno esaminate. Ora riconosce i decimali, l'elenco delle eccezioni è esplicito e per
  ognuna verifica che il selettore che la porta abbia un `animation: none` sotto
  `prefers-reduced-motion`.

**`public/icon.svg` era rimasto alla palette smorzata**
- Per due versioni l'icona ha usato `#E4B44C`, `#4CB5A5` e `#7B6CE6` mentre il marchio dentro
  il gioco disegnava già le tinte sature. Riallineata, PNG rigenerati con `npm run icone`, e
  **`tests/icona.test.js`** confronta ora l'SVG con i token a ogni `npm test`: la duplicazione
  resta necessaria (un file in `public/` non vede i token) ma non può più divergere in
  silenzio.

**Un elenco di debiti aperti che descriveva difetti già risolti**
- Quattro voci su undici in `DESIGN_SYSTEM.md` erano obsolete: bersagli tattili, stringhe
  italiane nel JSX, `toLocaleString('it-IT')` e `"orientation": "portrait"` nel manifest erano
  già stati corretti. L'elenco è stato riverificato sul codice, voce per voce.

### Aggiunto

**La Catena dice quando sta per calare**
- `respiroRimasto` era esportata e coperta da test ma **non la usava nessun componente**: la
  tolleranza era l'unica regola del gioco che il giocatore poteva soltanto dedurre guardando il
  numero scendere. Ora la barra della Catena mostra un avviso di ultima chiamata quando la
  prossima mossa senza eliminazioni farà calare il moltiplicatore. Una regola invisibile è
  indistinguibile da un capriccio.

**Sei test sulla generazione delle bombe**
- La detonazione era coperta dal primo giorno; la regola che decide **quando** arriva una bomba
  no, ed è quella che porta la promessa di equità. Ora si verifica per misura: mai più di una
  bomba per mano, mai su un pezzo da una cella, indice sempre dentro il pezzo, frequenza pari a
  `BOMBA_PROBABILITA` su 3000 mani e **frequenza invariata con la griglia quasi piena** — cioè
  la prova che le bombe non sono una leva sulla difficoltà.

**`prefers-reduced-motion` arriva anche alle particelle**
- Le particelle sono disegnate su un canvas, dove il CSS non arriva. La preferenza di sistema è
  ora letta da JavaScript e decide il **valore iniziale** dell'impostazione Animazioni. Resta un
  valore iniziale: una scelta esplicita del giocatore, essendo salvata, continua a vincere.

### Rimosso

- `--pl-t-slow`: definito e mai usato da nessuna regola.


## [0.2.0] — 6 settembre 2026

Prima versione pubblicata su GitHub Pages. Raccoglie le modifiche di regole, di palette, di
nome e il percorso dei Quadri.

Stato dei controlli al momento della pubblicazione: `npm test` passava con **150 test in 12
file**, `npm run build` riusciva.


### Cambiato

**Il gioco si chiama PLINTO, non più QUADRA**
- Il nome precedente era già usato da giochi esistenti nello stesso genere. Motivazioni e
  verifica in `docs/DIFFERENZIAZIONE.md`.
- La rinomina è passata anche per i nomi delle costanti. Un passaggio automatico aveva
  trasformato `QUADRANT_SIZE` in `PLINTONT_SIZE`, sostituendo la sottostringa "QUADRA" dentro
  una parola che non c'entrava: **corretto**, la costante si chiama di nuovo `QUADRANT_SIZE` e
  i quadranti restano quadranti. Non restano tracce di "PLINTONT" nel codice né nei documenti.

**La regola della Catena, riscritta due volte perché la misura diceva che non funzionava**

Cronologia, con i numeri del giocatore artificiale forte. Tutte le cifre di questo elenco si
rifanno con **`npm run catena`** (`stratega`, 120 partite, tetto di 250 mosse, 29.825 mosse):

1. *Versione originale.* La Catena saliva di **quanti gruppi** chiudeva la mossa e calava di
   uno a **ogni** mossa che non eliminava nulla. Misurato: Catena ≥ 3 solo nell'**1,3%** delle
   mosse giocate, mai sopra 4. Il moltiplicatore che doveva essere la firma del gioco era
   decorativo.
2. *Seconda versione.* Due mosse di tolleranza prima del calo, crescita ancora pari al numero
   di gruppi. Misurato: **95,4%** delle mosse con Catena ≥ 3, ma **77,4%** giocate al tetto
   massimo. Un moltiplicatore fisso è inutile esattamente quanto uno che non arriva mai.
3. *Versione attuale.* La Catena sale di **uno** per mossa che elimina — non di quanti gruppi,
   perché l'Intreccio li premia già e contarli due volte incollava la Catena al tetto — con
   **una** mossa di tolleranza prima di calare (`CHAIN_STEP_UP = 1`, `CHAIN_GRACE = 1`).
   Misurato: **15,0%** delle mosse al tetto e una distribuzione larga su tutti i livelli 0-9,
   fra il 5,6% e il 15,0% per livello. Nessun livello domina, che è il punto.

Le due correzioni servono **insieme**: con la crescita di uno ma senza tolleranza la Catena
torna a non accendersi (0,4% delle mosse ≥ 3), e con la tolleranza a due si incolla di nuovo al
tetto (74,3%) anche con il passo corretto. La tabella completa, e il limite delle righe
controfattuali, sono in `docs/GAMEPLAY_RULES.md`.

Conseguenze sul codice: `nextChainLevel` è diventata `nextChainState`, che restituisce
livello **e** digiuno; lo stato della partita ha un campo `chainDigiuno` in più, serializzato
e validato; `respiroRimasto` espone la tolleranza residua e la barra della Catena la mostra
come **avviso di ultima chiamata** quando la prossima mossa a vuoto farà calare il
moltiplicatore — prima era una regola che il giocatore poteva solo dedurre.

**Palette dei blocchi: da smorzata a satura**
- Le sei famiglie cromatiche erano coerenti con la direzione minerale ma spente su schermo. I
  blocchi sono l'unica cosa colorata dell'interfaccia: ora sono saturi, con la luminosità
  scelta perché ognuno resti sopra 3:1 sul fondo della plancia **in entrambi i temi**.
  Scuro: `#ff6a2b` `#12e1b0` `#9b4dff` `#ffc212` `#ff3d71` `#2e97ff`.
- **Il tema chiaro è stato ridefinito per intero e misurato.** Prima ridefiniva solo fondali e
  testi: il punteggio in ottone stava a **1.53:1** e **cinque blocchi su sei** sotto 3:1 sulla
  plancia. Ora ha tinte proprie per blocchi, `--pl-brand`, `--pl-brand-deep`, `--pl-ok`,
  `--pl-danger` e `--pl-cella-vuota`, e tutti e sei i blocchi passano (peggiore: 3.31).
- Nuovo token `--pl-danger-fondo` (`#b81f47`): il pulsante che **cancella i dati del
  giocatore** scriveva bianco su `--pl-danger`, cioè **2.94:1**. Adesso 6.32:1. `--pl-danger`
  resta il colore del testo di allarme; il fondo è un token separato.
- `--pl-text-faint` e la tinta delle celle libere: quest'ultima è diventata il token
  `--pl-cella-vuota`, perché un velo bianco trasparente su fondo chiaro è invisibile.

### Aggiunto

**I Quadri: cento livelli con una mappa del percorso (`src/config/quadri.js`,
`src/core/quadro.js`, `src/state/useQuadro.js`, `src/ui/schermate/Quadri.jsx`)**
- Cento livelli in **sette atti** — Le basi (1-10), Il ritmo (11-24), Gli ostacoli (25-40),
  La pressione (41-58), Il mestiere (59-76), La maestria (77-92), La vetta (93-100). Ogni
  Quadro ha uno o più obiettivi, un tetto di mosse (da 12 a 40) e, dal 16° in poi, una griglia
  di partenza già occupata: **85 Quadri su 100** partono da uno di **15 motivi** verificati.
- Nove tipi di obiettivo: righe, colonne, quadranti, gruppi, Catena, Intreccio, punteggio,
  celle e pulizia della griglia. Ruotano per atto, così due Quadri vicini non chiedono la
  stessa cosa.
- **I bersagli non sono inventati: sono calcolati.** `tools/taratura.mjs` (`npm run taratura`)
  fa giocare ogni Quadro al pianificatore artificiale, senza obiettivo, e mette il bersaglio a
  un percentile della distribuzione ottenuta — dal 14° percentile del primo atto al 56° della
  Vetta. È la correzione di un difetto grave della prima stesura, in cui i bersagli erano
  scritti a mano: un livello chiedeva **1500 punti dove in quelle mosse se ne fanno 325**, e
  16 Quadri su 40 erano matematicamente impossibili.
  - Lo strumento di taratura aveva a sua volta un difetto che lo rendeva inutile: il
    pianificatore era completamente deterministico, quindi minimo, mediana e massimo
    coincidevano su ogni Quadro e il percentile non misurava niente. Risolto rompendo i
    pareggi con un pizzico di casualità.
- Due motivi di griglia della prima stesura erano **ingiocabili** (celle isolate che nessun
  pezzo può raggiungere). Il generatore ora valida ogni motivo: niente gruppi già completi
  alla partenza, non più di 48 celle occupate, dimensione 9x9.
- `src/config/quadri.js` è **generato** da `tools/genera-quadri.mjs` e non va modificato a
  mano: il design (atti, rotazione degli obiettivi, motivi, tetti di mosse, percentili) vive
  nel generatore, dove si può leggere come un discorso invece che come una tabella.
- La mappa del percorso mostra gli atti, l'avanzamento e la tappa corrente, e si apre già
  scorrendo al punto giusto. La vittoria di un Quadro si valuta **prima** della sconfitta,
  così vincere all'ultima mossa disponibile conta come vittoria e non come mosse esaurite.
- `tests/quadri.test.js`: 18 test su obiettivi, transizioni di stato, unicità e ordine dei
  Quadri. `tests/e2e/quadri.mjs` (`npm run e2e-quadri`) calcola in Node una sequenza vincente
  e poi la rigioca **trascinando davvero i pezzi** in un browser.

**Plinto, il personaggio (`src/ui/Plinto.jsx`)**
- Un blocco di pietra disegnato in SVG, con cinque espressioni (normale, contento, deluso,
  stupito, addormentato) e un respiro di 3,2 secondi che si ferma con `prefers-reduced-motion`.
  Prende i colori dai token, quindi segue il tema. Nessuna immagine, nessuna dipendenza.

**Le bombe (`src/config/rules.js`, `src/core/grid.js`, `src/core/generator.js`,
`src/core/engine.js`)**
- Ogni tanto una cella di un pezzo è una bomba. Non fa niente sulla plancia: **esplode solo se
  eliminata insieme al gruppo che la contiene**, e allora porta via il quadrato di raggio 1
  attorno a sé. Le bombe colpite detonano a loro volta; quelle a distanza 2 no.
- `BOMBA_PROBABILITA = 0.22`, estratta **una volta per mano**: mai due bombe nella stessa
  terna, mai su un pezzo da una cella. La probabilità è **fissa** e non guarda punteggio,
  Catena o andamento della partita — la stessa dichiarazione di equità del generatore.
  Misurato su 40.697 mani: 22,2%.
- Codifica in **un solo array**: il valore di una cella è il colore (1..6), una bomba è
  colore + 10 (11..16). Salvataggi, copie e simulazioni restano quelli di prima.
- Punteggio: `PUNTI_CELLA_ESPLOSA = 6` per ogni cella portata via oltre al gruppo, moltiplicata
  per la Catena ma non per l'Intreccio. Una detonazione non conta come gruppo chiuso.
- Segno visivo **geometrico e non cromatico**: un anello bianco al centro della cella, visibile
  già nel tray. Il colore in PLINTO non porta informazione, e una bomba segnalata da una tinta
  sarebbe invisibile a chi non distingue i colori.
- `tests/bombe.test.js`: 14 test su codifica, raggio, reazione a catena, bordi, celle vuote,
  punteggio e sopravvivenza al salvataggio.

**Strumenti e controlli automatici**
- `tools/schermate.mjs` (`npm run schermate`), `tools/icone.mjs` (`npm run icone`),
  `tools/prova-sottocartella.mjs` (`npm run prova-pages`), `tools/prova-desktop.mjs`
  (`npm run prova-desktop`), `tools/quadri.mjs` (`npm run quadri`). Descritti in
  `docs/TESTING.md`.
- `tests/e2e/precisione.mjs` (`npm run precisione`) e `tests/e2e/resistenza.mjs`
  (`npm run soak`).
- `tests/privacy.test.js`: la promessa "nessuna richiesta di rete" ora è verificata da un test
  che legge i file del prodotto, invece di essere solo scritta in un documento.
- `tests/script.test.js`: `node --check` su tutti gli script di `tools/`, `tests/e2e/` e
  `src/sim/`, che nessun altro test importa.
- `tests/durate.test.js` e `src/feel/durate.js`: le durate degli effetti vivono per forza in
  CSS e in JavaScript, e ora un test fallisce se qualcuno ne cambia solo una.


## [0.1.0] — non ancora rilasciata

Primo nucleo del progetto: il motore di gioco, il generatore, gli strumenti di misura,
l'interfaccia, il game feel, l'accessibilità e la Sfida del Giorno. Il progetto compilava
(`npm run build`), la suite unitaria di allora — **89 test in 7 file** — passava, e lo scenario
`npm run e2e` guidava un
browser reale attraverso primo avvio, partita con mouse, partita a due tocchi, partita da
tastiera, eliminazione con particelle, ripresa dopo ricarica, game over e Sfida del Giorno.
Restano fuori dalla verifica: dispositivi reali, tocco vero, audio e playtest umano. Da
considerarsi non rilasciabile.

### Aggiunto

**Regole e motore (`src/config/`, `src/core/`)**
- `rules.js`: tutte le costanti di regolamento in un solo file, ognuna commentata.
- `rng.js`: PRNG deterministico mulberry32 a stato esplicito, con derivazione del seed da una
  stringa.
- `shapes.js`: catalogo di 41 forme senza rotazioni, divise in 6 famiglie (punto, linea,
  angolo, tetro, blocco, diagonale) e pesate per l'estrazione (peso totale 183).
- `grid.js`: griglia 9x9 come `Uint8Array`, posizionamento, ricerca di righe/colonne/quadranti
  completi e loro eliminazione con le celle d'incrocio contate una volta sola.
- `scoring.js`: punteggio a tre livelli — celle appoggiate, Intreccio (più gruppi in una
  mossa), Catena (moltiplicatore persistente, senza mai azzerarsi) — più il bonus di
  svuotamento della griglia e il livello di celebrazione `moveTier`. La regola della Catena è
  poi cambiata due volte: vedi "Cambiato" qui sotto.
- `generator.js`: generatore della terna con casualità controllata; pressione da affollamento,
  memoria delle forme recenti e tre reti di sicurezza dichiarate a favore del giocatore.
- `engine.js`: riduttore puro della partita — `createGame`, `placePiece`, rilevamento del game
  over, statistiche, `summarize`, `serializeGame`/`deserializeGame` con rifiuto dei salvataggi
  incompatibili o corrotti.

**Misura (`src/sim/`, `tests/`)**
- `sim/player.mjs`: quattro giocatori artificiali (`casuale`, `normale`, `esperto` e lo
  `stratega` con beam search sull'intera terna).
- `sim/run.mjs`: harness da riga di comando con seed fisso; stampa distribuzione di punteggio
  e mosse, istogramma del riempimento della griglia al game over e confronto fra frequenza
  attesa e osservata di ogni forma.
- Test Vitest su griglia, punteggio, generatore, motore (compresa la robustezza dei
  salvataggi manomessi), parità delle traduzioni, Sfida del Giorno, e un file di **invarianti
  su partite intere** che gioca 240 partite fino al game over controllando dopo ogni mossa che
  lo stato resti possibile.
- **Tetto di mosse nel simulatore** (`node src/sim/run.mjs [partite] [profilo] [tetto]`): mette
  tutti i profili davanti allo stesso numero di occasioni, perché senza, il giocatore più
  bravo segna di più anche solo perché sopravvive più a lungo.
- `tests/e2e/partita.mjs`: scenario in Chromium reale che avvia da solo il server di
  sviluppo, costruisce gli stati difficili con il motore vero e li inietta in `localStorage`.

**Interfaccia (`src/ui/`, `src/state/`, `src/persistence/`, `src/i18n/`, `src/styles/`)**
- Componenti React di plancia, tray, HUD, barra della Catena, logo e otto schermate
  (primo avvio, home, gioco, fine, statistiche, impostazioni, info, sostegno).
- `useTrascinamento`: drag & drop scritto a mano con pointer events — il pezzo si solleva
  sopra il dito, cresce alla scala della griglia, mantiene il punto di presa e si aggancia al
  centro di cella più vicino. Più una modalità alternativa **a due tocchi** per chi non riesce
  a trascinare.
- Anteprima della mossa: dove finirebbe il pezzo, se è legale, e **quali celle sparirebbero**
  (aiuto visivo disattivabile).
- `usePartita` e `useImpostazioni`; salvataggio della partita a ogni mossa.
- `src/persistence/`: wrapper protetto su `localStorage` e registro dei record personali.
- `src/i18n/`: dizionari italiano e inglese con fallback a catena.
- `src/styles/tokens.css` e `app.css`: sistema di design minerale (vedi
  `docs/DESIGN_SYSTEM.md`), tema chiaro su richiesta esplicita, layout orizzontale per il
  telefono coricato e adattamento agli schermi bassi.
- `index.html`, `src/main.jsx`, `src/config/progetto.js`.
- `public/icon.svg` (icona originale in SVG) e `public/manifest.webmanifest`.

**Game feel (`src/audio/`, `src/feel/`)**
- `audio/suoni.js`: **audio interamente sintetizzato** con oscillatori e inviluppi della Web
  Audio API — nessun file audio nel progetto. Scala pentatonica maggiore, così anche una
  raffica di eliminazioni resta consonante; l'arpeggio dell'eliminazione parte da un gradino
  più alto man mano che la Catena sale, quindi il moltiplicatore **si sente** prima di
  leggerlo. Il contesto audio nasce solo dentro un gesto del giocatore.
- `feel/particelle.js`: esplosioni su **un solo canvas** sovrapposto alla plancia, non decine
  di nodi DOM animati; il ciclo di `requestAnimationFrame` esiste solo finché ci sono
  particelle vive, per non consumare batteria mentre il giocatore pensa.
- `feel/useEffettiMossa.js`: unico punto in cui `lastMove` diventa suoni, vibrazioni,
  particelle e animazioni. Il motore resta ignaro del feedback.
- Animazioni: il blocco appoggiato atterra (260 ms); il blocco eliminato viene **ridisegnato
  per 420 ms dopo essere già uscito dallo stato**, altrimenti l'eliminazione sarebbe uno
  scatto invisibile; i punti volano via dalla cella con dimensione e colore legati al valore
  della mossa; il punteggio in testata scatta e la barra della Catena lampeggia quando sale.
- `feel/vibrazione.js`: pattern brevi per `navigator.vibrate`, protetti sui dispositivi che
  non la supportano.
- Una mossa rifiutata ha un suono e una vibrazione propri: in un gioco a trascinamento il
  silenzio si legge come "è rotto".
- Tutto rispetta le impostazioni del giocatore (audio, vibrazione, animazioni).

**Accessibilità**
- **La partita si gioca interamente da tastiera**: Tab sceglie il pezzo, Invio lo prende, le
  frecce (o WASD) muovono un cursore sulla griglia, Invio lo appoggia, Esc annulla. Il cursore
  parte dal centro, cioè dal punto da cui si raggiunge ogni casella in meno pressioni.
- Il cursore da tastiera è un **anello spesso, non una tinta**: non dipende dal colore.
- `ui/Annunci.jsx`: regione `aria-live="polite"` che descrive a parole cosa è successo
  ("2 righe, 1 quadrante eliminate. piu 96 punti. Catena 3."). In `polite` e non `assertive`,
  altrimenti in una raffica di mosse diventerebbe inascoltabile.
- Ogni cella ha un'etichetta con riga, colonna e stato; la barra della Catena è un
  `progressbar` con i valori corretti; gli interruttori sono `role="switch"`.
- **Contrasti misurati, non stimati.** `--pl-text-faint` era `#626b83`, cioè 3.55:1 sul fondo e
  **2.88:1** sui pannelli, sotto la soglia WCAG AA di 4.5 per testo normale: sostituito con
  `#838ca1` (5.60 e 4.54). `--pl-danger` è stato schiarito da `#e4587e` (**4.37:1** sui
  pannelli) a `#ec6d8e` (5.21). I numeri sono scritti nel commento di `tokens.css` così che la
  prossima modifica parta da una misura e non da un'impressione.

**Primo avvio e adattamento allo schermo**
- Presentazione al primo avvio: una schermata, tre righe, un pulsante, e non torna mai più.
  Non è un tutorial e non blocca niente. L'esempio mostrato era sbagliato nella prima stesura
  (3+3 celle per chiudere un quadrante che ne richiede 9); ora usa due pezzi che chiudono
  davvero un 3x3, verificato eseguendo il motore.
- Layout orizzontale: su telefono coricato la plancia va a sinistra, punteggio e pezzi a
  destra, senza cambiare un solo componente. Realizzato con una classe esplicita invece che
  con `:has()`, per non dipendere dal supporto del selettore.

**Sfida del Giorno (`src/persistence/sfide.js`)**
- Il seme della partita è la **data locale** (non UTC: il "giorno" è quello del giocatore),
  quindi nello stesso giorno griglia e sequenza dei pezzi sono identiche per tutti.
- Volutamente povera di meccanica: nessun limite di tentativi, niente da sbloccare, nessuna
  ricompensa, nessuna valuta e **nessuna serie giornaliera da mantenere** — le serie
  funzionano perché fanno paura di perdere qualcosa, e questo gioco non usa la paura per
  farsi riaprire. Nessuna classifica, perché non esiste server e nessun dato lascia il
  dispositivo.
- Slot di salvataggio **separati** per partita libera e sfida (`KEYS.CURRENT_CHALLENGE`):
  aprire la sfida non cancella la partita lasciata a metà.
- Storico dei risultati potato a 60 giorni; della giornata si conserva solo il punteggio
  migliore.
- Nella home è un secondo pulsante con lo stesso peso visivo degli altri comandi: non
  lampeggia e non ha contatori alla rovescia.

**Documentazione**
- `README.md` e i documenti in `docs/`: architettura, regole di gioco, sistema di design,
  test, questo changelog e il registro degli asset.

### Deciso durante lo sviluppo (bilanciamento)

- La prima versione del generatore imponeva che ogni pezzo avesse almeno **4 posizioni valide**
  finché il riempimento era sotto il **50%**. Misurato: la mediana delle mosse per partita è
  salita **da 83 a 191** e la difficoltà si è appiattita. La regola è stata ridotta ad **almeno
  2 posizioni valide, solo sotto il 30% di riempimento** (`MIN_PLACEMENTS_EARLY = 2`,
  `RISKY_PIECE_FILL = 0.3`).
- Il moltiplicatore Catena applicato a una mossa è quello **precedente** alla mossa, cioè
  quello che il giocatore vedeva nell'interfaccia. È una scelta di trasparenza, non di
  bilanciamento.

### Corretto durante lo sviluppo

- **La presa del pezzo veniva misurata sul bottone invece che sul disegno.** L'imbottitura del
  bottone sfasava il posizionamento di quasi una cella: invisibile su griglia vuota,
  paralizzante su griglia piena. Trovato dallo scenario e2e, non da un test unitario.
- **Il file di test delle traduzioni non veniva raccolto.** Importava i dizionari come `it` ed
  `en`, e `it` collide con la funzione di test di Vitest; la suite continuava a dichiarare
  tutti i test verdi pur avendo un file fallito. Ora gli import si chiamano `italiano` e
  `inglese`; l'avvertimento è in `docs/TESTING.md`.
- Commenti del generatore che dichiaravano una soglia di equità del 50% mentre il codice usa
  il 30%, e che elencavano 3 regole su 5.
- `deserializeGame` accettava salvataggi manomessi (punteggio non numerico, stato inventato,
  Catena fuori scala): ora li rifiuta, con cinque test dedicati.
- La durata della partita usava `Date.now()` non iniettabile, unico valore non riproducibile a
  parità di seed: ora è un parametro.

### Noto e non risolto

- I profili di simulazione `esperto` e `normale` producono risultati molto vicini. La domanda
  è però risultata mal posta: confrontarli a partite libere confonde chi gioca *meglio* con chi
  sopravvive *di più*. A parità di occasioni (tetto di mosse) il salto vero è fra scegliere una
  mossa alla volta e pianificare tutta la terna. Vedi `docs/TESTING.md`.
- **Le misure di bilanciamento vanno rifatte a ogni cambio di regole, e non sempre è stato
  fatto subito.** L'arrivo delle bombe e la nuova Catena hanno spostato di molto la durata e il
  punteggio delle partite simulate: i numeri citati nei documenti valgono per la revisione in
  cui sono stati presi, ed è per questo che ognuno riporta profilo, numero di partite e data.
- L'interfaccia è coperta **solo** dallo scenario `npm run e2e`, che è un percorso felice: non
  esistono test unitari sui componenti né un ambiente di test con DOM.
- Lo scenario e2e usa il mouse, quindi il ramo del trascinamento pensato per il tocco (il
  pezzo che si solleva sopra il dito) non viene mai eseguito. Il percorso di Chromium è inoltre
  scritto nel file e va corretto a mano su un'altra macchina.
- `prefers-reduced-motion` riduce le animazioni a fotogrammi chiave e spegne le tre animazioni
  infinite. Le particelle sul canvas non passano dal CSS e restano fuori dalla sua portata: la
  preferenza di sistema è ora letta anche da JavaScript e decide il valore **iniziale**
  dell'impostazione "Animazioni", che le spegne davvero. Chi le vuole comunque le riaccende, e
  la sua scelta salvata vince sulla preferenza di sistema.
- Il link di donazione in `src/config/progetto.js` è volutamente vuoto e va inserito a mano
  dal proprietario del progetto.
- La verifica professionale del nome PLINTO (marchi e negozi di applicazioni) non è stata
  fatta: `docs/DIFFERENZIAZIONE.md` non afferma e non può affermare che il nome sia libero.
- Nessun playtest umano e nessuna prova su un dispositivo fisico. Tutte le misure di questo
  documento vengono da giocatori artificiali e da un browser guidato da script.
