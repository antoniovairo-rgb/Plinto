# Test e simulazioni

> Fotografia del 6 settembre 2026. I conteggi di test sono stati ottenuti eseguendo
> `npm test` e `npx vitest run --reporter=verbose`, non stimati. I risultati di simulazione
> riportati più sotto sono misure reali prodotte da `node src/sim/run.mjs`.

## Come si eseguono

```bash
npm test              # suite unitaria completa, una volta sola (vitest run)
npm run test:watch    # riesecuzione automatica durante lo sviluppo
npm run e2e           # scenario in un browser reale (Chromium via Playwright)
npm run sim           # simulazione con i valori predefiniti: 2000 partite, profilo "normale"
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

`npm test`: **89 test in 7 file, tutti verdi**, durata ~11.7 s. Undici di quei secondi sono
tutti in `invarianti.test.js`, che gioca 240 partite complete: è il costo di quel file, non un
rallentamento della suite.

`npm run e2e`: **11 passaggi in Chromium reale**, esito "Nessun problema rilevato". Sezione
dedicata più sotto.

| File | Test | Aree coperte |
| --- | --- | --- |
| `tests/grid.test.js` | 19 | geometria della griglia e dei quadranti (3); posizionamento — bordi, coordinate negative, sovrapposizioni, immutabilità di `placeShape`, errore su cella occupata, conteggio ed elenco delle posizioni valide (9); eliminazione di riga, colonna e quadrante, i tre tipi insieme, cella d'incrocio svuotata una volta sola, round-trip `gridFromString`/`gridToString` (7) |
| `tests/engine.test.js` | 26 | creazione della partita e determinismo del seed, seed testuale (3); mosse — immutabilità dello stato, rifiuto delle mosse illegali, coerenza fra `canPlaceHandPiece` e `placePiece`, ricarica della mano solo a terna esaurita (4); punteggio in partita — riga, quadrante, decadimento della Catena, bonus di svuotamento, contenuto di `lastMove` (5); fine partita, incluse partite casuali complete senza cicli infiniti (4); serializzazione, ripresa identica e rifiuto dei salvataggi corrotti (3); `summarize` (1); **robustezza dei salvataggi manomessi** — punteggio non numerico, stato inventato, Catena fuori scala, griglia con valori impossibili, stato del generatore mancante (5); determinismo della durata a parità di seed (1) |
| `tests/generator.test.js` | 15 | determinismo e varietà fra seed diversi (2); forma della terna, limite di forme ripetute, unicità degli identificativi (3); pressione da affollamento e memoria dello storico (4); le quattro reti di sicurezza, **compreso un test che verifica che sopra la soglia il game over resti possibile** (4); integrità del catalogo e normalizzazione delle forme (2) |
| `tests/scoring.test.js` | 15 | Catena — crescita, tetto, decadimento di uno, pavimento a zero (5); Intreccio (2); punteggio di una mossa, moltiplicatore "quello che vedevi prima di muovere", bonus di svuotamento, punteggio sempre intero e non negativo (6); livello di celebrazione `moveTier` (2) |
| `tests/i18n.test.js` | 5 | parità delle chiavi fra italiano e inglese; nessuna traduzione vuota; una chiave inesistente restituisce la chiave; una lingua sconosciuta ricade sull'italiano; i segnaposto `{r}` e `{c}` dell'etichetta di cella esistono in tutte le lingue |
| `tests/sfide.test.js` | 6 | Sfida del Giorno — formato della data **locale e non UTC** (compreso il caso delle 23:30, in cui UTC sarebbe già il giorno dopo); stessa partita a parità di giorno e partite diverse fra giorni diversi; conservazione del solo miglior punteggio di giornata; un giorno mai giocato non vale zero per errore; ordinamento dello storico; potatura dello storico a 60 giorni |
| `tests/invarianti.test.js` | 3 | invarianti su partite intere — 240 partite giocate fino al game over con mosse casuali (1); 12 partite in cui **ogni singolo stato attraversato** viene serializzato e ripristinato e confrontato (1); 400 seed in cui la prima mano non è mai già morta (1) |

`tests/sfide.test.js` è l'unico file che tocca la persistenza, e ci riesce costruendo un
`localStorage` finto con `vi.stubGlobal('window', …)` prima di importare il modulo con un
`await import()`. È il modello da riusare se un giorno si vorranno testare anche `storage.js`
e `records.js`.

### Il test delle invarianti, e perché è diverso dagli altri

Gli altri file verificano una regola alla volta su uno scenario costruito a mano.
`invarianti.test.js` gioca partite vere dall'inizio alla fine con mosse scelte a caso fra
quelle legali, e dopo **ogni** mossa controlla ciò che deve essere sempre vero:

- la griglia ha 81 celle e ogni valore sta fra `0` e `COLOR_COUNT`;
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
| 0 | **Primo avvio** | la presentazione mostra esattamente 3 regole; dopo aver premuto "Gioca" e ricaricato, **non ricompare** |
| 1 | **Home** | la pagina carica e ha titolo |
| 2 | **Avvio partita** | premendo "Gioca" compare la plancia |
| 3 | **Trascinamento con mouse** | durante il drag compaiono celle in anteprima; al rilascio il numero di blocchi sulla griglia **aumenta** |
| 3b | **Eliminazione e feedback** | su una griglia con la riga 0 a una cella dalla chiusura: 9 celle preannunciate dall'aiuto visivo, 9 blocchi in animazione di esplosione, il punteggio volante, e **i pixel effettivamente disegnati sul canvas delle particelle** letti con `getImageData`; poi che dopo 600 ms gli elementi temporanei siano stati ripuliti |
| 4 | **Modalità a due tocchi** | il tocco su un pezzo lo marca selezionato; il tocco su una cella lo appoggia |
| 4b | **Partita da tastiera** | Tab + Invio prendono il pezzo, compare il cursore sulla griglia e l'anteprima, le frecce lo muovono, Invio appoggia, Esc annulla; e la regione `role="status"` **non è vuota** dopo una mossa |
| 5 | **Persistenza** | ricaricando la pagina e premendo "Riprendi", punteggio e numero di blocchi coincidono con quelli di prima |
| 6 | **Fine partita** | da uno stato costruito con una sola mossa possibile, la mossa porta alla schermata di riepilogo |
| 6b | **Sfida del Giorno** | la sfida parte da griglia vuota; **aprirla non cancella la partita libera in corso** (slot di salvataggio separati) e la libera si riprende con lo stesso numero di blocchi; la mano della sfida è identica fra due accessi nello stesso giorno |
| 7 | **Schermate secondarie** | Statistiche, Impostazioni e Info mostrano contenuto e il pulsante indietro riporta alla home |

### Limiti dello scenario

- **Usa il mouse, non il tocco.** `page.mouse` produce eventi `pointerType: 'mouse'`, quindi
  il ramo che solleva il pezzo di 1.35 celle sopra il dito — cioè proprio il comportamento
  studiato per il telefono — **non viene mai eseguito**.
- **Il percorso di Chromium è scritto nel file**
  (`/opt/pw-browsers/chromium-1194/chrome-linux/chrome`). Su una macchina diversa lo scenario
  non parte finché quel percorso non viene corretto o reso configurabile.
- **Non verifica l'audio.** Nessuna asserzione tocca la Web Audio API.
- **Non verifica i contrasti né il tema chiaro.**
- Le asserzioni sono `if (...) errori.push(...)`, non un framework: non c'è isolamento fra i
  passaggi e un fallimento a metà lascia lo stato per quelli successivi.

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
- **Contrasti e tema chiaro.** I numeri di `docs/DESIGN_SYSTEM.md` sono calcolati a mano; non
  esiste nessun controllo automatico che impedisca di reintrodurre un colore non conforme.
- **Prestazioni su dispositivo reale.** Mai misurate.
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

### Punteggio

| Profilo | Partite | Media | p10 | Mediana | p90 | Max |
| --- | --- | --- | --- | --- | --- | --- |
| casuale | 1500 | 112 | — | 83 | — | 613 |
| normale | 1200 | 1393 | 270 | 1030 | 3024 | 10281 |
| esperto | 500 | 1443 | — | 1082 | — | 9701 |

### Mosse per partita

| Profilo | Partite | Media | p10 | Mediana | p90 | Max |
| --- | --- | --- | --- | --- | --- | --- |
| casuale | 1500 | 19 | — | 17 | — | 58 |
| normale | 1200 | 110 | 29 | 83 | 226 | 755 |
| esperto | 500 | 113 | — | 86 | — | 698 |

### Altri indicatori (profilo "normale", 1200 partite)

| Indicatore | Valore |
| --- | --- |
| Catena massima raggiunta | mediana 3, massimo 8 (su un tetto teorico di 9) |
| Riempimento al game over | mediana 51%, minimo 25% |
| Partite finite sotto le 15 mosse | 1.5% |
| Partite finite sotto le 8 mosse | 0.00% |
| Svuotamenti completi della griglia | 45 in 1200 partite |

Il riempimento mediano al game over dell'esperto è **51%**, identico a quello del normale.

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

**Il problema.** A partite libere i due profili producevano risultati indistinguibili: media
1393 contro 1443, mediana 1030 contro 1082, mosse mediane 83 contro 86, riempimento mediano al
game over 51% in entrambi i casi. Le due spiegazioni possibili erano che l'euristica
dell'"esperto" non fosse davvero migliore (difetto del simulatore) o che il gioco non premiasse
la strategia (difetto di bilanciamento).

**La misura era viziata.** Confrontare profili a partite libere confonde due cose: il giocatore
più bravo segna di più anche solo perché **sopravvive** più a lungo, e dal punteggio totale non
si distingue chi gioca *meglio* da chi gioca *di più*. Da `f31b2d5` il simulatore accetta un
terzo argomento, il **tetto di mosse**, che mette tutti i profili davanti allo stesso numero di
occasioni:

```bash
node src/sim/run.mjs 100 esperto 150
```

**A 150 mosse, 100 partite per profilo** (misure rieseguite il 6 settembre 2026):

| Profilo | Ancora vivo al tetto | Punteggio mediano | Gruppi chiusi (mediana) |
| --- | --- | --- | --- |
| `casuale` | 0% | 79 | 1 |
| `normale` | 50% | 1906 | 55 |
| `esperto` | 55% | 1934 | 56 |
| `stratega` | 99% | 2142 | 60 |

**Come si legge.** Il divario vero non è fra euristiche diverse — `normale` ed `esperto`
restano a cinque punti percentuali di distanza — ma fra **scegliere una mossa alla volta e
pianificare tutti e tre i pezzi insieme**: lo `stratega` quasi raddoppia la sopravvivenza.
La conclusione è che la profondità strategica di PLINTO esiste già ed è intrinseca alla mano da
tre; non serve aggiungere meccaniche per crearla.

Un dato secondario che conferma la lettura: il riempimento mediano della griglia alla fine
delle 150 mosse scende dal 40% dei due profili avidi al **20%** dello `stratega`. Chi pianifica
non fa solo più punti: tiene la griglia più vuota, ed è per questo che sopravvive.

Tutte e quattro le righe sono state rimisurate eseguendo `node src/sim/run.mjs 100 <profilo>
150` e coincidono con i valori dichiarati dal commit. La serie dello `stratega` è di gran lunga
la più lenta (beam search su ogni terna): va messa in conto qualche minuto.

**Una correzione già fatta, che una versione precedente di questo documento dava ancora per
aperta.** La funzione `nearCompletions` in `src/sim/player.mjs` — quella che misura le
"quasi-chiusure", cioè il peso su cui `normale` ed `esperto` differiscono di più (1 contro 4) —
ignorava i quadranti, cioè era cieca proprio sulla meccanica che distingue PLINTO. **È stata
corretta in `9253cc7`**: il codice attuale scorre righe, colonne **e** i nove quadranti. Quindi
non è quella la spiegazione della vicinanza fra i due profili avidi; la spiegazione, alla luce
dei numeri qui sopra, è che il salto di abilità stia nella pianificazione della terna e non
nella qualità dell'euristica di mossa singola.
