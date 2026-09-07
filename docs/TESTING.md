# Test e simulazioni

> Fotografia del 6 settembre 2026. I conteggi di test sono stati ottenuti eseguendo
> `npm test` e `npx vitest run --reporter=json`, non stimati. I risultati di simulazione
> riportati più sotto sono misure reali prodotte da `node src/sim/run.mjs` o da script
> equivalenti. Gli script che pilotano un browser (`e2e`, `precisione`, `soak`, `schermate`,
> `icone`, `prova-pages`, `prova-desktop`) **non sono stati rieseguiti in questa revisione**:
> dove si riportano loro risultati, è detto da dove vengono.

## Prima di pubblicare: un comando solo

```bash
npm run verifica       # esegue TUTTI i controlli, in ordine, e riassume l'esito
```

Tredici controlli, un comando — **lo stesso che gira in integrazione continua**: `.github/workflows/verifica.yml` esegue `npm run verifica` e nient'altro, così l'elenco è uno solo e non può divergere. Aggiungere un controllo qui lo fa girare anche in CI. Esiste perché i comandi separati vanno ricordati, e ricordarli
tutti non ha funzionato: una pubblicazione è stata bloccata dall'integrazione continua
proprio sul controllo che non era stato eseguito in locale. Non si ferma al primo
fallimento — arriva in fondo e stampa il quadro completo, perché sapere che tre cose sono
rotte è più utile che scoprirle una alla volta.

**Attenzione alle pipe.** Lanciare una prova come `node prova.mjs | tail -3` restituisce il
codice di uscita di `tail`, non quello della prova: è sempre 0, e un fallimento passa
inosservato. È già successo. `npm run verifica` non usa pipe.

## Come si eseguono

```bash
npm test               # suite unitaria completa, una volta sola (vitest run)
npm run test:watch     # riesecuzione automatica durante lo sviluppo
npm run e2e            # scenario in un browser reale (Chromium via Playwright)
npm run precisione     # precisione del trascinamento, forma per forma
npm run soak           # sessione lunga: fluidità, memoria, residui
npm run sim            # simulazione con i valori predefiniti: 2000 partite, profilo "normale"
npm run quadri         # difficoltà misurata di ogni Quadro
npm run schermate      # immagini per gli store, generate dal gioco vero
npm run icone          # icone PNG rigenerate da public/icon.svg
npm run prova-pages    # build servita da una sottocartella (caso GitHub Pages)
npm run prova-desktop  # aspetto su schermi grandi
npm run contrasti      # rimisura i contrasti WCAG leggendo tokens.css
npm run catena         # distribuzione della Catena, e confronto con le regole scartate
npm run comunicazioni  # ogni schermata, in ogni lingua: i testi che il giocatore legge
npm run installazione  # service worker: installabile, senza rete, e che si aggiorna
npm run soak           # centinaia di mosse di fila: memoria, nodi, fluidita'
npm run archivio       # archivio delle sfide: calendario, tastiera, giorno giusto
npm run condivisione   # la scheda da mandare agli amici, e il ripiego sugli appunti
npm run taratura       # ricalcola i bersagli dei Quadri facendoli giocare
```

Il simulatore accetta tre argomenti posizionali — **numero di partite**, **profilo** e
**tetto di mosse** — nella forma `node src/sim/run.mjs [partite] [profilo] [tetto]`.
Attraverso npm servono i due trattini:

```bash
node src/sim/run.mjs 1200 normale
npm run sim -- 500 esperto
npm run sim -- 1500 casuale
npm run sim -- 100 stratega 150   # tutti i profili davanti allo stesso numero di occasioni
```

Il terzo argomento è facoltativo e vale `Infinity` se omesso; quando è presente, il simulatore
stampa in fondo anche quante partite erano **ancora vive** al raggiungimento del tetto. Serve a
confrontare profili di abilità diversa senza che il più bravo sembri migliore solo perché
sopravvive di più. Un profilo sconosciuto fa uscire il programma con un errore che elenca
quelli disponibili.

## Stato attuale della suite

`npm test`: **321 test in 20 file, tutti verdi**, durata ~12.5 s (misurato il 6 settembre
2026). Undici e mezzo di quei secondi sono tutti in `invarianti.test.js`, che gioca 240
partite complete: è il costo di quel file, non un rallentamento della suite.

`npm run e2e`: **11 passaggi in Chromium reale** (0, 1, 2, 3, 3b, 4, 4b, 5, 6, 6b, 7). Il
numero e la sequenza sono stati riletti nel file; l'esito riportato più sotto viene
dall'ultima esecuzione registrata e non da questa revisione.

| File | Test | Aree coperte |
| --- | --- | --- |
| `tests/grid.test.js` | 19 | geometria della griglia e dei quadranti (3); posizionamento — bordi, coordinate negative, sovrapposizioni, immutabilità di `placeShape`, errore su cella occupata, conteggio ed elenco delle posizioni valide (9); eliminazione di riga, colonna e quadrante, i tre tipi insieme, cella d'incrocio svuotata una volta sola, round-trip `gridFromString`/`gridToString` (7) |
| `tests/engine.test.js` | 31 | creazione della partita e determinismo del seed, seed testuale (3); mosse — immutabilità dello stato, rifiuto delle mosse illegali, coerenza fra `canPlaceHandPiece` e `placePiece`, ricarica della mano solo a terna esaurita (4); punteggio in partita — riga, quadrante, decadimento della Catena, bonus di svuotamento, contenuto di `lastMove` (5); fine partita, incluse partite casuali complete senza cicli infiniti (4); serializzazione, ripresa identica e rifiuto dei salvataggi corrotti (3); `summarize` (1); **robustezza dei salvataggi manomessi** — punteggio non numerico, stato inventato, Catena fuori scala, griglia con valori impossibili, stato del generatore mancante (5); determinismo della durata a parità di seed (1) |
| `tests/generator.test.js` | 15 | determinismo e varietà fra seed diversi (2); forma della terna, limite di forme ripetute, unicità degli identificativi (3); pressione da affollamento e memoria dello storico (4); le reti di sicurezza, **compreso un test che verifica che sopra la soglia il game over resti possibile** (4); integrità del catalogo e normalizzazione delle forme (2) |
| `tests/scoring.test.js` | 19 | Catena — crescita di **uno** per mossa che elimina e non per gruppo chiuso, tetto, tolleranza di una mano, azzeramento del digiuno dopo un'eliminazione, calo di uno invece dell'azzeramento, pavimento a zero, `respiroRimasto` (9); Intreccio (2); punteggio di una mossa, moltiplicatore "quello che vedevi prima di muovere", bonus di svuotamento, punteggio sempre intero e non negativo (6); livello di celebrazione `moveTier` (2) |
| `tests/bombe.test.js` | 20 | codifica colore+10 nella griglia, andata e ritorno fra colore e bomba (3); detonazione — quadrato 3x3, bombe adiacenti che si innescano, **bombe a distanza 2 che NON si innescano**, ritaglio sul bordo, celle vuote non toccate, nessuna bomba nessun effetto (6); in partita — una bomba appoggiata non esplode, una bomba eliminata con la riga porta via i vicini, i punti delle celle saltate seguono la Catena, celebrazione più alta, sopravvivenza a salvataggio e ripristino (5); **generazione** — mai più di una bomba per mano, mai su un pezzo da una cella, indice sempre dentro il pezzo, frequenza osservata pari a `BOMBA_PROBABILITA` su 3000 mani, **frequenza invariata con la griglia quasi piena** (cioè non è una leva sulla difficoltà) e sequenza identica a parità di seme (6) |
| `tests/durate.test.js` | 4 | i tre token di durata di `tokens.css` coincidono con le costanti di `src/feel/durate.js`; nessuna `animation:` del foglio di stile scrive una durata a mano fuori dalle tre animazioni infinite dichiarate, e per ognuna di quelle il selettore che la porta deve ricomparire con `animation: none` sotto `prefers-reduced-motion`. La falla precedente — l'espressione regolare vedeva solo durate intere, quindi `1.6s` e `3.2s` le sfuggivano — è chiusa |
| `tests/privacy.test.js` | 11 | nessun file del prodotto apre una connessione di rete; l'unico dominio esterno è PayPal e sta solo nel file di configurazione; la pagina non carica font o fogli di stile esterni; tutte le chiavi salvate stanno sotto un unico prefisso dichiarato; più un test che verifica che il controllo esamini davvero dei file; e sei test sul **service worker**, che è codice che vede passare le richieste: nessun dominio esterno, il controllo esplicito sull'origine ancora al suo posto, nessun `sendBeacon` o WebSocket, il documento preso dalla rete per primo e il nome della cache legato alla versione |
| `tests/script.test.js` | 19 | `node --check` su ogni script di `tools/`, `tests/e2e/` e `src/sim/` — cioè su tutto il codice eseguibile che **nessun altro test importa**; più un test che verifica che l'elenco non sia vuoto |
| `tests/quadri.test.js` | 33 | definizione dei Quadri (griglie iniziali ben formate, nessun gruppo già completo, almeno un pezzo piazzabile) e svolgimento del percorso (sblocco progressivo, conservazione del risultato migliore, conteggio dei tentativi); più i testi e il **disegno** della schermata di apertura — che la miniatura corrisponda alla geometria vera (nove caselle sulla stessa riga, nove dentro un solo riquadro 3x3, le due figure dell'Intreccio che si incrociano davvero) e che gli obiettivi senza una forma sulla griglia non vengano disegnati affatto —, oltre ai testi — **ogni** tipo di obiettivo, in **ogni** lingua, deve avere spiegazione e consiglio. Quest'ultimo controllo esiste perché la frase è costruita a runtime: se manca, non fallisce niente e il giocatore vede la chiave di traduzione al posto della spiegazione, proprio mentre sta imparando le regole |
| `tests/distribuzioni.test.js` | 9 | le tre distribuzioni di una partita: che la lunghezza dell'istogramma dell'Intreccio copra il **massimo teorico dedotto dal catalogo** (ricalcolato dal test in modo indipendente: oggi 10, un blocco 3x3 su un incrocio di quadranti); che una mossa venga contata sulla Catena **applicata** e non su quella successiva; che gli array in ingresso non vengano mutati; che un valore fuori scala venga limitato e non scartato, perche' scartarlo romperebbe l'invariante delle somme |
| `tests/archivio.test.js` | 18 | le date, che si rompono sempre negli stessi quattro punti e mai quando le provi: il **cambio dell'ora legale** attraversato un giorno alla volta in marzo e in ottobre, il 29 febbraio, i passaggi di anno, dieci anni di calendario senza un mese che perda giorni. Più il contratto su cui si regge l'archivio: 3.653 date consecutive, 3.653 semi distinti, zero collisioni |
| `tests/profilo.test.js` | 18 | `aggrega`, che è pura e quindi è la parte più facile da sbagliare in silenzio: profilo vuoto, prima partita, **cento partite** con le invarianti della Fase 1 verificate sull'aggregato, partita da zero mosse, riepilogo con campi mancanti (nessun `NaN` deve uscirne), profilo di una versione precedente che si completa da solo, istogramma della lunghezza sbagliata che non contamina il totale. Più il salvataggio: che azzerare il profilo **non** tocchi record, statistiche, livelli e sfide, e che uno storage che lancia non faccia uscire nessuna eccezione. E due test sul **riferimento generato**: forma giusta, e misurato con le regole di adesso — se non lo è, il test dice cosa fare (`npm run catena`) invece di lasciare sparire il confronto in silenzio |
| `tests/scheda.test.js` | 17 | il testo che il giocatore manda agli amici: lunghezza sempre sotto i 280 caratteri **anche con numeri a sette cifre** (oltre, la messaggistica taglia proprio il collegamento), il collegamento sempre come ultima riga, nessun identificativo di forma (sarebbe uno spoiler della sfida che stai mandando), nessun parametro di tracciamento, e mai `undefined`/`NaN`/`null` — che in un messaggio da inoltrare è il difetto che si vede di più |
| `tests/scala.test.js` | 21 | le note del gioco, tutte **pure**: ogni grado confrontato con la tabella dichiarata (La3…Sol5, temperamento equabile), la scala che sale sempre, un livello fuori scala che produce comunque una nota della scala, l'arpeggio dell'Intreccio che resta **ascendente** anche oltre l'ultimo grado. Quest'ultimo ha trovato un difetto vero: la scala copre due ottave, e riavvolgendola di una sola l'arpeggio scendeva a metà della raffica. **Che il suono esca davvero non lo prova nessun test**: serve un orecchio, ed è una verifica manuale dichiarata |
| `tests/documenti.test.js` | 13 | i documenti versionati su `localStorage`: le quattro situazioni (assente, forma senza versione, versione corrente, versione **futura** scritta da un aggiornamento piu' recente) e la migrazione provata **sui dati veri di chi gioca gia'** — record, statistiche di vita, sfide e livelli nella forma precedente. Piu' uno storage che **lancia** a ogni accesso: nessuna eccezione esce dal modulo e la partita continua. Un aggiornamento che azzera mesi di record e' il danno peggiore possibile qui, perche' non esiste nessuna copia altrove |
| `tests/i18n.test.js` | 35 | parità delle chiavi fra italiano e inglese; nessuna traduzione vuota; una chiave inesistente restituisce la chiave; una lingua sconosciuta ricade sull'italiano; i segnaposto `{r}` e `{c}` dell'etichetta di cella esistono in tutte le lingue; **nessuna chiave definita e mai usata**; **nessuna chiave usata e mai definita**; più l'**ortografia italiana**: nessun testo può contenere le parole che in italiano non esistono senza accento (`piu`, `perche`, `puo`, `gia`, `cosi`, `meta`, `citta`, `sara`…), gli accenti devono esserci davvero e la risposta affermativa deve essere «Sì». Nasce da un difetto reale: tutto il dizionario italiano era in ASCII puro, e «un gruppo **e** una riga» significa un'altra cosa da «un gruppo **è** una riga» |
| `tests/sfide.test.js` | 11 | Sfida del Giorno — formato della data **locale e non UTC** (compreso il caso delle 23:30, in cui UTC sarebbe già il giorno dopo); stessa partita a parità di giorno e partite diverse fra giorni diversi; conservazione del solo miglior punteggio di giornata; un giorno mai giocato non vale zero per errore; ordinamento dello storico; potatura dello storico a 60 giorni |
| `tests/contrasti.test.js` | 1 | esegue `tools/contrasti.mjs`, che rimisura **tutti** i contrasti WCAG leggendo `tokens.css` ed esce con errore se anche uno solo scende sotto soglia (4.5:1 per il testo, 3:1 per i blocchi), su entrambi i temi e sul fondo più sfavorevole di ciascuno. Nasce da un difetto ripetuto due volte: contrasti dichiarati in un commento e mai misurati |
| `tests/icona.test.js` | 2 | `public/icon.svg` usa gli stessi colori del marchio disegnato nel gioco e ne conserva la geometria. L'icona è un file statico e non vede i token: senza questo controllo la sua palette resta indietro in silenzio, come è già successo per due versioni |
| `tests/invarianti.test.js` | 3 | invarianti su partite intere — 240 partite giocate fino al game over con mosse casuali, e dopo **ogni** mossa anche le due somme delle distribuzioni: la somma dell'istogramma della Catena e' il numero di mosse, la somma della mappa degli appoggi e' il numero di pezzi appoggiati. Un istogramma sbagliato non rompe niente e non si vede giocando: quelle due somme sono l'unico segnale che esista (1); 12 partite in cui **ogni singolo stato attraversato** viene serializzato e ripristinato e confrontato (1); 400 seed in cui la prima mano non è mai già morta (1) |

`tests/sfide.test.js` è l'unico file che tocca la persistenza, e ci riesce costruendo un
`localStorage` finto con `vi.stubGlobal('window', …)` prima di importare il modulo con un
`await import()`. È il modello da riusare se un giorno si vorranno testare anche `storage.js`
e `records.js`.

Tre file non verificano il gioco ma **le promesse che il progetto fa su se stesso**, ed è la
categoria di test che invecchia peggio se non esiste:

- `privacy.test.js` legge i sorgenti del prodotto (esclusa `src/sim/`, che gira solo in Node)
  e fallisce se qualcuno introduce una `fetch`, un font remoto o un dominio esterno diverso da
  PayPal. La promessa "nessuna richiesta di rete" di `docs/PRIVACY.md` regge finché qualcuno
  non aggiunge in buona fede una libreria da CDN: adesso quel qualcuno lo scopre subito.
- `script.test.js` esegue `node --check` su tutti gli script eseguibili che nessun test
  importa — quelli di `tools/`, `tests/e2e/` e `src/sim/`. Costa millisecondi e chiude una
  categoria di errore reale: una costante dichiarata due volte dopo una modifica meccanica su
  più file, scoperta solo in integrazione continua perché in locale ne era stato rilanciato
  uno solo.
  **Limite dichiarato, misurato sul posto**: `node --check` vede la sintassi, non il
  significato. Chiudendo male un commento di blocco in `tools/verifica-tutto.mjs` l'intero
  corpo dello script è finito dentro il commento — file perfettamente valido, `node --check`
  soddisfatto, programma che non fa più niente. Se ne è accorto solo un'esecuzione vera.
- `durate.test.js` confronta i token di durata di `tokens.css` con le costanti di
  `src/feel/durate.js`. Se si scollano, un effetto sparisce prima della fine
  dell'animazione o resta appeso dopo: due file diversi, due numeri che sembrano entrambi
  giusti, e nessuno se ne accorge leggendo il codice.

### Il test delle invarianti, e perché è diverso dagli altri

Gli altri file verificano una regola alla volta su uno scenario costruito a mano.
`invarianti.test.js` gioca partite vere dall'inizio alla fine con mosse scelte a caso fra
quelle legali, e dopo **ogni** mossa controlla ciò che deve essere sempre vero:

- la griglia ha 81 celle e ogni valore è **o** 0, **o** un colore `1..COLOR_COUNT`, **o** una
  bomba `VALORE_BOMBA+1 .. VALORE_BOMBA+COLOR_COUNT`. L'intervallo non è dichiarato come un
  unico "da 0 a 16": un valore fra 7 e 10 sarebbe un colore inesistente, e verrebbe disegnato
  come un blocco senza tinta invece di far fallire il test;
- la mano ha sempre `HAND_SIZE` posizioni e ogni pezzo ha una forma esistente nel catalogo;
- punteggio intero, non negativo e **mai in calo**; Catena intera fra `0` e `CHAIN_MAX`;
- **`status === 'playing'` se e solo se esiste davvero una mossa possibile.** È la coerenza
  più importante: se salta, il giocatore o resta bloccato davanti a una partita che non
  finisce, o si sente dichiarare finita una partita che poteva continuare;
- il bilancio delle celle torna: piene prima + posate − eliminate = piene dopo;
- ogni cella dichiarata eliminata in `lastMove` è davvero vuota;
- la mano si ricarica solo quando è stata svuotata del tutto.

È la rete che prende i difetti che nessuno ha pensato di cercare.

## Lo scenario end-to-end (`npm run e2e`)

File unico: `tests/e2e/partita.mjs`. Non usa un test runner: è uno script Node che apre
**Chromium reale** con Playwright su un viewport da telefono (390 × 844, `deviceScaleFactor`
2, locale `it-IT`), esegue una sequenza di passaggi, accumula i problemi in un array e alla
fine stampa l'esito uscendo con codice 1 se ne ha trovato almeno uno.

Tre cose che lo rendono comodo:

1. **Avvia da solo il server di sviluppo.** Prima fa una `fetch` su `http://localhost:5173/`;
   se nessuno risponde, lancia `npx vite` e aspetta fino a 30 secondi che risponda, per poi
   ucciderlo alla fine. Non serve ricordarsi di aprire un altro terminale.
2. **Costruisce gli stati difficili con il motore vero.** Le situazioni che sarebbero
   lunghissime da raggiungere giocando (una griglia quasi piena, una riga a una cella dalla
   chiusura) vengono create importando `createGame`/`serializeGame`/`gridFromString` e
   iniettate in `localStorage` alla chiave `plinto:partita`; poi la pagina si ricarica e si
   preme "Riprendi".
3. **Cattura gli errori del browser.** Ogni `console.error` e ogni `pageerror` finisce fra i
   problemi, quindi un'eccezione in React fa fallire lo scenario anche se le asserzioni
   passerebbero.

Le schermate vengono salvate in `/tmp/plinto-e2e` (o in `PLINTO_E2E_OUT`).

### Cosa copre, passo per passo

| # | Passo | Cosa verifica davvero |
| --- | --- | --- |
| 0 | **Primo avvio** | la presentazione mostra tante regole quante ne dichiara `REGOLE_INTRO` (non un numero scritto a mano: era la fonte di una pubblicazione fallita), **nomina la bomba** e la illustra; dopo aver premuto "Gioca" e ricaricato, **non ricompare** |
| 1 | **Home** | la pagina carica e ha titolo |
| 2 | **Avvio partita** | premendo "Gioca" compare la plancia |
| 3 | **Trascinamento con mouse** | durante il drag compaiono celle in anteprima; al rilascio il numero di blocchi sulla griglia **aumenta** |
| 3b | **Eliminazione e feedback** | su una griglia con la riga 0 a una cella dalla chiusura: 9 celle preannunciate dall'aiuto visivo, 9 blocchi in animazione di esplosione, il punteggio volante, e **i pixel effettivamente disegnati sul canvas delle particelle** letti con `getImageData`; poi che dopo 600 ms gli elementi temporanei siano stati ripuliti |
| 4 | **Modalità a due tocchi** | il tocco su un pezzo lo marca selezionato; il tocco su una cella lo appoggia |
| 4b | **Partita da tastiera** | Tab + Invio prendono il pezzo, compare il cursore sulla griglia e l'anteprima, le frecce lo muovono, Invio appoggia, Esc annulla; e la regione `role="status"` **non è vuota** dopo una mossa |
| 5 | **Persistenza** | ricaricando la pagina e premendo "Riprendi", punteggio e numero di blocchi coincidono con quelli di prima |
| 6 | **Fine partita** | da uno stato costruito con una sola mossa possibile, la mossa porta alla schermata di riepilogo |
| 6b | **Sfida del Giorno** | la sfida parte da griglia vuota; **aprirla non cancella la partita libera in corso** (slot di salvataggio separati) e la libera si riprende con lo stesso numero di blocchi; la mano della sfida è identica fra due accessi nello stesso giorno |
| 7 | **Schermate secondarie** | Come si gioca, Statistiche, Impostazioni e Info mostrano contenuto e il pulsante indietro riporta alla home |
| 7b | **"Come si gioca"** | non che la pagina esista — si svuoterebbe senza che niente fallisca — ma che **spieghi davvero**: le stesse regole della presentazione, almeno cinque sezioni, l'illustrazione della bomba, e la presenza di Intreccio, Catena, tastiera e due tocchi. Più che nessun segnaposto (`{max}`, `{n}`) arrivi allo schermo non sostituito: i moltiplicatori vengono da `config/rules.js` e devono essere numeri, non parentesi graffe |

### Limiti dello scenario

- **Usa il mouse, non il tocco.** `page.mouse` produce eventi `pointerType: 'mouse'`, quindi
  il ramo che solleva il pezzo di 1.35 celle sopra il dito — cioè proprio il comportamento
  studiato per il telefono — **non viene mai eseguito**.
- **Il percorso di Chromium è scritto nel file**
  (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`). Su una macchina diversa lo scenario
  non parte finché quel percorso non viene corretto o reso configurabile.
- **Non verifica l'audio.** Nessuna asserzione tocca la Web Audio API.
- **Non verifica i contrasti né il tema chiaro.** Per i contrasti c'è `npm run contrasti`,
  che però misura i token e non quello che il browser disegna davvero.
- Le asserzioni sono `if (...) errori.push(...)`, non un framework: non c'è isolamento fra i
  passaggi e un fallimento a metà lascia lo stato per quelli successivi.

## Le altre prove in browser

Oltre a `partita.mjs` ci sono quattro script in `tests/e2e/`, con la stessa impalcatura (Chromium
via Playwright, server di sviluppo avviato da soli, problemi accumulati in un array, uscita
con codice 1):

| Script | Comando | Che domanda risponde |
| --- | --- | --- |
| `tests/e2e/precisione.mjs` | `npm run precisione` | il pezzo atterra **esattamente** dove è stato lasciato? Verifica cella per cella, per ogni forma del catalogo e in più punti della griglia. È il gesto che il giocatore ripete centinaia di volte: se il pezzo cade una cella più in là, il gioco sembra rotto anche con tutte le regole giuste |
| `tests/e2e/comunicazioni.mjs` | `npm run comunicazioni` | attraversa **ogni schermata in entrambe le lingue** e legge il testo che finisce davvero sullo schermo: chiavi di traduzione non risolte, segnaposto non sostituiti (`{max}`), `undefined`, `NaN`, schermate senza testo, e la rete di sicurezza entrata in funzione. Ogni trappola cercata è un difetto **già accaduto** qui, non un'ipotesi. Nessuna di quelle rompeva niente: il gioco funzionava mentre diceva cose sbagliate |
| `tests/e2e/quadri.mjs` | `npm run e2e-quadri` | percorre i Quadri in un browser vero: mappa, **apertura con la spiegazione di Plinto**, partita, esito, sblocco del Quadro successivo e avanzamento conservato dopo una ricarica. La sequenza vincente viene calcolata in Node e poi **rigiocata trascinando i pezzi**, quindi verifica anche che il motore e il gioco nel browser siano lo stesso gioco. Controlla inoltre che la frase dell'apertura e quella sopra la plancia coincidano, e che nessuna chiave di traduzione arrivi allo schermo non risolta |
| `tests/e2e/archivio.mjs` | `npm run archivio` | l'archivio in un browser vero: che il calendario sia una **tabella** con intestazioni di riga e di colonna, che i giorni spenti dicano **perché** nella loro etichetta, che le frecce muovano il fuoco e PagSu cambi mese (o non lo cambi, quando non c'è un mese dove andare). Poi apre un giorno passato, lo finisce e controlla che il punteggio finisca **in quel giorno e non in oggi** — un punteggio nel giorno sbagliato non rompe niente, non genera nessun errore, e falsifica in silenzio l'unica cosa che l'archivio racconta |
| `tests/e2e/condivisione.mjs` | `npm run condivisione` | **toglie `navigator.share`** dal browser e verifica che la condivisione ripieghi sugli appunti, con lo stesso testo e una conferma a schermo. È la situazione di chiunque giochi da un computer, ed è quella in cui un pulsante rotto non sembra rotto: chi lo tocca crede di aver condiviso |
| `tests/e2e/installazione.mjs` | `npm run installazione` | il gioco si installa, si apre **senza rete** e — soprattutto — un giocatore che ha già installato la versione vecchia riceve quella nuova? Serve la build da `/plinto/` come su GitHub Pages, con la cache HTTP disattivata perché ciò che si misura sia l'effetto del service worker e non quello del browser; poi **sostituisce i file serviti a caldo** e ricarica. Un service worker che serve per sempre la versione vecchia è il difetto peggiore che possa avere, e provando una volta sola sembra funzionare benissimo. Ha già trovato un difetto vero: alla prima visita il service worker non controlla ancora la pagina, quindi JavaScript e CSS non finivano in cache e senza rete il gioco si apriva bianco |
| `tests/e2e/resistenza.mjs` | `npm run soak` (o `node tests/e2e/resistenza.mjs [mosse]`) | dopo centinaia di mosse il gioco è ancora fluido? Ha accumulato memoria, nodi DOM, timer o cicli di animazione lasciati per strada? Sono i difetti che non si vedono in una partita di prova da dieci mosse. **Era rimasto fuori da `npm run verifica`, e si è rotto in silenzio**: cercava un pulsante «Gioca» che la home non aveva più da due versioni. Ora fa parte dell'elenco, perché un controllo che si lancia solo quando qualcuno se lo ricorda è un controllo che prima o poi non si lancia più |

Nessuno di questi è un test unitario e nessuno gira in `npm test`: vanno lanciati a
mano. `tests/script.test.js` garantisce almeno che siano sintatticamente validi.

## Gli strumenti di misura in `tools/`

Non sono test: non dicono "giusto" o "sbagliato" su una regola. Sono strumenti che producono
**materiale** (immagini, icone) o **misure** su cose che nessun test unitario può guardare —
l'aspetto su uno schermo diverso, la difficoltà di un livello, il comportamento della build
servita da un percorso diverso. Tutti quelli che aprono un browser cercano Chromium prima nel
percorso di questo ambiente di sviluppo e, se non c'è, lasciano decidere a Playwright: girano
quindi anche su un'altra macchina senza modifiche (variabile `PLINTO_CHROMIUM` per forzarlo).

| Strumento | Comando | Cosa fa |
| --- | --- | --- |
| `tools/schermate.mjs` | `npm run schermate` | genera le sei immagini per gli store in `store/` (home, partita, eliminazione, fine partita, statistiche, impostazioni) su viewport 390 × 844 a densità 3, cioè 1170 × 2532. **Non sono mockup**: ogni immagine è il gioco vero, con lo stato costruito importando il motore perché mostri qualcosa di significativo invece di una griglia a caso. Rifarle dopo una modifica all'interfaccia costa un comando |
| `tools/icone.mjs` | `npm run icone` | rigenera in `public/icone/` i sei PNG richiesti dalle piattaforme (192, 512, maskable 512 con margine del 12%, apple 180, 1024 per le schede degli store, favicon 32) a partire dall'**unica** fonte `public/icon.svg`. Tenere sei PNG disegnati a mano significa che prima o poi cinque saranno aggiornati e uno no |
| `tools/prova-sottocartella.mjs` | `npm run prova-pages` | fa `npm run build`, serve `dist/` da `/plinto/` con un server HTTP scritto sul posto e verifica che il gioco funzioni **da una sottocartella** e non solo dalla radice di un dominio. Controlla presentazione, 81 celle, una mossa vera col mouse, `manifest.webmanifest`, `icon.svg` e `icone/icona-192.png` raggiungibili, e che **nessuna richiesta finisca alla radice del dominio**. È un caso che si rompe in silenzio: con i percorsi assoluti la pagina si apre bianca su GitHub Pages e nessun test che gira in locale se ne accorge |
| `tools/prova-desktop.mjs` | `npm run prova-desktop` | apre il gioco su quattro schermi grandi (1631 × 1030, 1920 × 1200, 1440 × 700, 820 × 1180) e misura una cosa concreta e non opinabile: **quanti pixel di vuoto** restano fra la fine del contenuto della presentazione e il pulsante GIOCA. Oltre 180 px è un errore. Poi entra in partita e controlla che la plancia non sia più bassa di 240 px. Salva una schermata per ciascuno |
| `tools/contrasti.mjs` | `npm run contrasti` | ricalcola **tutti** i rapporti di contrasto WCAG leggendo `src/styles/tokens.css`, su entrambi i temi e sul fondo più sfavorevole di ciascuno, ed esce con codice 1 se anche uno solo scende sotto soglia (4.5:1 per il testo, 3:1 per i blocchi). Lo esegue anche `tests/contrasti.test.js`, quindi gira a ogni `npm test`. Esiste perché lo stesso difetto — contrasti dichiarati in un commento e mai misurati — si era già presentato due volte |
| `tools/misura-catena.mjs` | `npm run catena [partite] [tetto]` | fa giocare lo `stratega` e registra, mossa per mossa, quanti gruppi ha chiuso; poi **rigioca quella stessa sequenza** con la regola attuale della Catena e con le quattro varianti scartate, e ne stampa la distribuzione dei livelli. Produce i numeri citati nei commenti di `CHAIN_GRACE` e `CHAIN_STEP_UP` e nella sezione "Le tre versioni" di `GAMEPLAY_RULES.md`. **Limite dichiarato nel file stesso**: le partite sono giocate con la regola attuale e lo stratega guarda il livello di Catena quando sceglie, quindi solo la riga della regola attuale è una misura esatta; le altre sono controfattuali |
| `tools/quadri.mjs` | `npm run quadri [tentativi]` | misura la **difficoltà reale** di ogni Quadro facendolo giocare più volte a un giocatore artificiale che conosce l'obiettivo del livello e ci mira. Stampa per ogni quadro la percentuale di riuscite, le mosse medie e il motivo dei fallimenti; in fondo, i quadri mai superati, quelli sempre superati oltre i primi sei e la curva delle riuscite per gruppi di dieci. Serve a leggere la **curva**, non a stabilire una verità assoluta |

Una nota sul metro di `tools/quadri.mjs`, perché è una lezione riusabile: la prima versione
usava il giocatore generico delle simulazioni di bilanciamento, che chiude qualunque gruppo gli
venga comodo. Risultato: "chiudi una riga in 12 mosse" risultava impossibile e "chiudi un
quadrante in 12 mosse" riusciva in tre tentativi. Non era il quadro a essere sbagliato: era il
metro. Un giocatore a cui è stato detto "fai una riga" punta alla riga.

## Avvertimento: `it` come nome di import in un file Vitest

Vale la pena tenerlo a mente, perché è già successo ed è costato una suite verde che verde
non era.

`tests/i18n.test.js` importa i dizionari **come `italiano` e `inglese`**, non come `it` ed
`en`. Il motivo è che `it` è anche il nome della funzione di test di Vitest: un
`import it from '../src/i18n/it.js'` collide con l'`it` importato da `vitest`. Quando è
successo, il file **non veniva nemmeno raccolto** — e la suite continuava a dichiarare
tutti i test verdi pur avendo un file fallito. Un conteggio che non cala e un esito che resta
verde sono esattamente i segnali che non fanno scattare nessun allarme.

Regola pratica: in un file di test non chiamare mai un import `it`, `test`, `describe`,
`expect`, `beforeEach` o `vi`. E quando si aggiunge un file di test, **controllare che il
numero totale di test sia salito**, non solo che l'esito sia verde.

## Cosa NON è coperto

- **Test unitari di componenti e hook.** Non esistono, e non esiste nemmeno un ambiente con
  DOM: `vite.config.js` non definisce alcuna sezione `test`, quindi Vitest gira in Node puro.
  L'interfaccia è verificata **solo** dallo scenario e2e, che è un percorso felice e non una
  copertura.
- **Drag & drop su tocco reale.** Vedi i limiti dello scenario: l'e2e usa il mouse.
- **Audio.** `src/audio/suoni.js` esiste ed è usato, ma nessun test verifica che un suono
  venga prodotto.
- **Vibrazione.** `navigator.vibrate` non esiste in Chromium headless e non è verificato.
- **Persistenza, per metà.** `src/persistence/sfide.js` è coperto da `tests/sfide.test.js`,
  ma `storage.js` e `records.js` non hanno test propri: sono verificati solo di rimbalzo, dai
  test della sfida e dai passi 5 e 6b dell'e2e.
- **Contrasti e tema chiaro.** I numeri di `docs/DESIGN_SYSTEM.md` sono calcolati eseguendo la
  formula WCAG sui valori dei token, ma **fuori dalla suite**: non esiste nessun controllo
  automatico che impedisca di reintrodurre un colore non conforme. È l'unica promessa del
  progetto che non abbia un test a guardia, dopo che privacy, durate e sintassi degli script
  ne hanno preso uno.
- **La frequenza delle bombe.** `forseUnaBomba` non ha test unitari: `tests/bombe.test.js`
  copre la codifica, la detonazione e il punteggio, ma la probabilità del 22% e il vincolo
  "mai su un pezzo da una cella" sono verificati solo per simulazione.
- **Prestazioni su dispositivo reale.** Mai misurate. `npm run soak` misura una sessione lunga
  in Chromium su una macchina da sviluppo, che non è la stessa cosa.
- **Playtest umano.** Mai fatto. Tutti i numeri di questo documento vengono da giocatori
  artificiali.

## I profili del simulatore

Definiti in `src/sim/player.mjs`. Il simulatore non è un test di regressione: è lo strumento
di **bilanciamento**. Ne esistono **quattro**.

| Profilo | Come sceglie | A cosa serve |
| --- | --- | --- |
| `casuale` | mossa legale a caso | limite inferiore assoluto: quanto fa chi non guarda la griglia |
| `normale` | punteggio euristico di una mossa alla volta, pesi `{gruppi 100, catena 0, buchi 6, riempimento 20, quasi-chiusure 1}` | approssima il giocatore che vede le eliminazioni ovvie e non ama i buchi |
| `esperto` | stessa euristica, pesi `{gruppi 120, catena 14, buchi 14, riempimento 45, quasi-chiusure 4}` | approssima chi valuta anche la Catena e la compattezza |
| `stratega` | pesi dell'esperto **più `lookahead`**: beam search (larghezza 8) che pianifica tutti i pezzi della terna insieme | non è un giocatore realistico: è il **metro del tetto di abilità** |

L'euristica valuta ogni mossa su: gruppi chiusi, Catena corrente (solo se la mossa chiude
qualcosa), celle vuote isolate create, riempimento risultante e "quasi-chiusure". Al punteggio
di ogni mossa viene sommato un rumore casuale in `[0, 0.5)` per rompere i pareggi.

## Risultati misurati

Ottenuti con `node src/sim/run.mjs`. Il seed dell'harness è fisso (`20260906`), quindi le serie
sono ripetibili.

**Tutte le serie qui sotto sono state rieseguite il 6 settembre 2026**, cioè dopo l'arrivo
delle bombe e della Catena attuale. I valori precedenti erano molto più bassi (mediana 1030
punti e 83 mosse per il profilo `normale`) e vanno considerati superati: le due modifiche
insieme hanno allungato molto le partite. È il motivo per cui ogni tabella di questo documento
porta profilo, numero di partite e data.

### Punteggio

| Profilo | Partite | Media | p10 | Mediana | p90 | Max |
| --- | --- | --- | --- | --- | --- | --- |
| casuale | 1500 | 119 | 46 | 86 | 239 | 748 |
| normale | 1200 | 7289 | 863 | 4652 | 17200 | 64101 |
| esperto | 500 | 7178 | 818 | 4327 | 17519 | 66378 |

### Mosse per partita

| Profilo | Partite | Media | p10 | Mediana | p90 | Max |
| --- | --- | --- | --- | --- | --- | --- |
| casuale | 1500 | 19 | 13 | 17 | 26 | 65 |
| normale | 1200 | 289 | 59 | 205 | 629 | 2243 |
| esperto | 500 | 285 | 56 | 187 | 656 | 2360 |

### Altri indicatori (profilo "normale", 1200 partite)

| Indicatore | Valore |
| --- | --- |
| Catena massima raggiunta | mediana **9**, cioè il tetto (prima della modifica: mediana 3, massimo 8) |
| Riempimento al game over | mediana 51%, minimo 25% |
| Partite finite sotto le 15 mosse | 0.3% (3 partite su 1200) |
| Partite finite sotto le 8 mosse | 0.00% |
| Svuotamenti completi della griglia | 46 in 1200 partite |

Il riempimento mediano al game over dell'esperto è **51%**, identico a quello del normale: su
questo indicatore le due euristiche restano indistinguibili.

**Un numero da leggere con attenzione: la Catena massima ha mediana 9.** Vuol dire che in più
di metà delle partite il giocatore artificiale tocca il tetto almeno una volta. Non è la stessa
cosa che *giocare* al tetto — la distribuzione mossa per mossa è più sotto — ma è un indizio
che, con partite tanto più lunghe, il tetto di 9 sia meno lontano di quanto fosse pensato.

### La Catena e le bombe

Il simulatore `run.mjs` non stampa la distribuzione della Catena mossa per mossa né le
statistiche delle bombe: le misure riportate in `docs/GAMEPLAY_RULES.md` sono state ottenute
con script separati che pilotano lo stesso `chooseMove` di `src/sim/player.mjs`, contando la
Catena **applicata** a ogni mossa (cioè `state.chain` prima della mossa) e leggendo
`lastMove.bombeDetonate` e `state.stats`. Chi le rifà deve dichiarare profilo e numero di
partite: **le serie prodotte da profili diversi non sono confrontabili cifra per cifra.**

Due serie misurate il 6 settembre 2026, entrambe contando la Catena **applicata** alla mossa:

| Serie | Mosse | Catena ≥ 1 | Catena ≥ 3 | Al tetto (9) |
| --- | --- | --- | --- | --- |
| `stratega`, 120 partite, tetto 250 mosse, **`npm run catena`** | 29.825 | 94.4% | 75.4% | **15.0%** |
| `stratega`, 120 partite, tetto 250 mosse, script estemporaneo, altro seme | 29.884 | 94.6% | 77.6% | 13.6% |
| `esperto`, 300 partite, senza tetto | 90.827 | 95.2% | 84.1% | 17.8% |

Distribuzione completa della prima serie, che ora è la **fonte riproducibile**: la produce
`tools/misura-catena.mjs` con un seme fisso, quindi chiunque riesegua `npm run catena` ottiene
queste cifre e non altre.

| Livello | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quota mosse | 5.6% | 9.9% | 9.1% | 8.8% | 8.3% | 8.2% | 8.8% | 11.8% | 14.4% | **15.0%** |

**Le prime due righe misurano la stessa cosa su semi diversi**, e la differenza fra 13.6% e
15.0% al tetto è utile proprio per questo: dice quanta variazione ci si deve aspettare fra due
campioni da 120 partite. Una differenza di un punto e mezzo su questo indicatore **non è un
cambio di comportamento del gioco**, ed è la ragione per cui una regola non va scelta su uno
scarto di quell'ordine. Le conclusioni della sezione "Le tre versioni" di `GAMEPLAY_RULES.md`
poggiano invece su differenze da 0,4% a 77%, che nessun seme può produrre per caso.

Non si riproduce invece il valore di "mosse con Catena attiva" che circolava insieme alla
misura originale (79,5%): con la soglia ≥ 1 viene 94.4%, con la soglia ≥ 3 viene 75.4%. Le due
cifre contavano presumibilmente cose diverse — ed è la ragione per cui qui la soglia è sempre
dichiarata.

Bombe, profilo `normale`, 400 partite (40.697 mani, 121.636 mosse):

| Indicatore | Valore |
| --- | --- |
| Mani con una bomba | 22.2% (costante dichiarata: 22%) |
| Mosse che fanno detonare almeno una bomba | 6.5% |
| Bombe detonate per partita | 21.6 |
| Celle saltate oltre al gruppo, per partita | 35.2 |
| Bombe per mossa con detonazione | 1.09 |

L'ultimo numero è quello che ridimensiona la reazione a catena: nel gioco reale una
detonazione ne innesca un'altra di rado.

## L'istogramma del riempimento al game over

È l'ultimo blocco stampato prima della distribuzione delle forme, e per il bilanciamento è
l'indicatore più importante che il simulatore produca.

Profilo "normale", 1200 partite:

| Riempimento al game over | Quota partite |
| --- | --- |
| < 30% | 0.9% |
| 30–40% | 7.6% |
| 40–50% | 37.8% |
| 50–60% | 40.6% |
| 60–70% | 12.8% |
| ≥ 70% | 0.3% |

**Come si legge.** Ogni partita contribuisce con una sola osservazione: quanto era piena la
griglia nell'istante in cui nessun pezzo entrava più. La coda **sinistra** è quella da
sorvegliare: una partita che muore con la griglia al 25% è una partita in cui lo spazio c'era e
i pezzi non ci stavano lo stesso. È esattamente ciò che un giocatore chiama "ingiusto", ed è il
sintomo che un generatore sleale produrrebbe in massa.

Oggi quella coda pesa lo 0.9%, e le partite sotto le 8 mosse sono zero. La massa sta fra il 40%
e il 60%: le partite finiscono con la griglia intasata, cioè per uno spazio che il giocatore si
è costruito da solo.

La coda **destra** dice l'opposto: quasi nessuna partita arriva oltre il 70% di riempimento,
perché a quel punto è quasi impossibile che uno dei tre pezzi entri ancora. È un limite del
gioco, non un problema.

Due avvertenze:

1. l'istogramma misura il **generatore**, non il divertimento. Un generatore perfettamente equo
   può comunque produrre un gioco noioso;
2. il giocatore è artificiale. Un umano crea buchi diversi da un'euristica, e non sappiamo
   ancora quanto la forma della distribuzione cambierebbe.

## Cosa dicono e non dicono questi numeri

### Il caso risolto: la regola dei 4 piazzamenti

Una prima versione del generatore imponeva che **ogni pezzo** avesse almeno **4 posizioni
valide** finché il riempimento era sotto il **50%**. Effetto misurato: la mediana delle mosse
per partita è salita **da 83 a 191** e la curva di difficoltà si è appiattita — il gioco
smetteva di stringere. La regola è stata ridotta a **almeno 2 posizioni valide, e solo sotto il
30% di riempimento** (`MIN_PLACEMENTS_EARLY = 2`, `RISKY_PIECE_FILL = 0.3`). È l'esempio di
perché il simulatore esiste: la versione generosa sembrava ovviamente migliore, e stava
rovinando il gioco.

### Il caso chiuso: "esperto ≈ normale", e perché la domanda era mal posta

**Il problema.** A partite libere i due profili producono risultati indistinguibili. Con le
misure rifatte il 6 settembre 2026: media 7289 contro 7178, mediana 4652 contro 4327, mosse
mediane 205 contro 187, riempimento mediano al game over 51% in entrambi i casi. (Prima delle
bombe e della Catena attuale i valori assoluti erano molto più bassi — mediana 1030 contro
1082 — ma la vicinanza fra i due profili era la stessa.) Le due spiegazioni possibili erano che
l'euristica dell'"esperto" non fosse davvero migliore (difetto del simulatore) o che il gioco
non premiasse la strategia (difetto di bilanciamento).

**La misura era viziata.** Confrontare profili a partite libere confonde due cose: il giocatore
più bravo segna di più anche solo perché **sopravvive** più a lungo, e dal punteggio totale non
si distingue chi gioca *meglio* da chi gioca *di più*. Da `f31b2d5` il simulatore accetta un
terzo argomento, il **tetto di mosse**, che mette tutti i profili davanti allo stesso numero di
occasioni:

```bash
node src/sim/run.mjs 100 esperto 150
```

**A 150 mosse, 100 partite per profilo**, misure rieseguite il 6 settembre 2026 con
`node src/sim/run.mjs 100 <profilo> 150`:

| Profilo | Ancora vivo al tetto | Punteggio mediano | Gruppi chiusi (mediana) | Riemp. mediano a fine serie |
| --- | --- | --- | --- | --- |
| `casuale` | 0% | 92 | 1 | 63% |
| `normale` | 56% | 2947 | 55 | 37% |
| `esperto` | 53% | 2978 | 55 | 38% |
| `stratega` | **99%** | 3519 | 59 | **17%** |

**Come si legge.** Il divario vero non è fra euristiche diverse — `normale` ed `esperto` sono
ormai indistinguibili anche qui, e l'`esperto` sopravvive perfino un po' meno — ma fra
**scegliere una mossa alla volta e pianificare tutti e tre i pezzi insieme**: lo `stratega`
quasi raddoppia la sopravvivenza. La conclusione è che la profondità strategica di PLINTO
esiste già ed è intrinseca alla mano da tre; non serve aggiungere meccaniche per crearla.

Un dato secondario che conferma la lettura: il riempimento mediano della griglia alla fine
delle 150 mosse scende dal 37-38% dei due profili avidi al **17%** dello `stratega`. Chi
pianifica non fa solo più punti: tiene la griglia più vuota, ed è per questo che sopravvive.

La serie dello `stratega` è di gran lunga la più lenta (beam search su ogni terna): le 100
partite da 150 mosse hanno richiesto **circa 7 minuti e mezzo**, contro i 3,5 secondi
dell'`esperto` e i 130 millisecondi del `casuale`. Va messo in conto.

**Una correzione già fatta, che una versione precedente di questo documento dava ancora per
aperta.** La funzione `nearCompletions` in `src/sim/player.mjs` — quella che misura le
"quasi-chiusure", cioè il peso su cui `normale` ed `esperto` differiscono di più (1 contro 4) —
ignorava i quadranti, cioè era cieca proprio sulla meccanica che distingue PLINTO. **È stata
corretta in `9253cc7`**: il codice attuale scorre righe, colonne **e** i nove quadranti. Quindi
non è quella la spiegazione della vicinanza fra i due profili avidi; la spiegazione, alla luce
dei numeri qui sopra, è che il salto di abilità stia nella pianificazione della terna e non
nella qualità dell'euristica di mossa singola.
