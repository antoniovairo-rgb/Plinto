# Test e simulazioni

> Fotografia del 6 settembre 2026. I conteggi di test sono stati ottenuti eseguendo
> `npm test`, non stimati. I risultati di simulazione riportati più sotto sono misure reali
> prodotte da `node src/sim/run.mjs`.

## Come si eseguono

```bash
npm test              # suite completa, una volta sola (vitest run)
npm run test:watch    # riesecuzione automatica durante lo sviluppo
npm run sim           # simulazione con i valori predefiniti: 2000 partite, profilo "normale"
```

Il simulatore accetta due argomenti posizionali — **numero di partite** e **profilo** — nella
forma `node src/sim/run.mjs [partite] [profilo]`. Attraverso npm servono i due trattini:

```bash
node src/sim/run.mjs 1200 normale
npm run sim -- 500 esperto
npm run sim -- 1500 casuale
```

Un profilo sconosciuto fa uscire il programma con un errore che elenca quelli disponibili.

## Stato attuale della suite

`npm test`: **75 test in 4 file, tutti verdi** (durata circa 0.7 s).

`npm run e2e`: scenario in browser reale, 7 passaggi, vedi sezione dedicata piu' sotto.

| File | Test | Aree coperte |
| --- | --- | --- |
| `tests/grid.test.js` | 19 | geometria della griglia e dei quadranti (3); posizionamento — bordi, coordinate negative, sovrapposizioni, immutabilità di `placeShape`, conteggio ed elenco delle posizioni valide (9); eliminazione di riga, colonna e quadrante, i tre tipi insieme, cella d'incrocio svuotata una volta sola, round-trip `gridFromString`/`gridToString` (7) |
| `tests/engine.test.js` | 20 | creazione della partita e determinismo del seed, seed testuale (3); mosse — immutabilità dello stato, rifiuto delle mosse illegali, coerenza fra `canPlaceHandPiece` e `placePiece`, ricarica della mano solo a terna esaurita (4); punteggio in partita — riga, quadrante, decadimento della Catena, bonus di svuotamento, contenuto di `lastMove` (5); fine partita, incluse 25 partite complete senza cicli infiniti (4); serializzazione, ripresa identica e rifiuto dei salvataggi corrotti (3); `summarize` (1) |
| `tests/generator.test.js` | 15 | determinismo e varietà fra seed diversi (2); forma della terna, limite di forme ripetute, unicità degli identificativi (3); pressione da affollamento e memoria dello storico (4); le quattro reti di sicurezza, **compreso un test che verifica che sopra il 50% di riempimento il game over resti possibile** (4); integrità del catalogo e normalizzazione delle forme (2) |
| `tests/scoring.test.js` | 15 | Catena — crescita, tetto, decadimento di uno, pavimento a zero (5); Intreccio (2); punteggio di una mossa, moltiplicatore "quello che vedevi prima di muovere", bonus di svuotamento, punteggio sempre intero e non negativo (6); livello di celebrazione `moveTier` (2) |

## Cosa NON è coperto

Non per dimenticanza: **non esiste ancora il codice da testare**.

- **Interfaccia.** I componenti di `src/ui/` e gli hook di `src/state/` esistono e il progetto
  compila (`npm run build` riesce), ma **non c'è nessun test di rendering né di componente**, e
  non c'è nemmeno un ambiente di test con DOM: `vite.config.js` non definisce alcuna sezione
  `test`, quindi Vitest gira in Node puro. `playwright` è comparso fra le dipendenze di
  sviluppo ma **non esiste alcun test che lo usi**: nessun file di configurazione, nessuna
  cartella `e2e`, nessuno `spec`.
- **Drag & drop.** `src/ui/useTrascinamento.js` esiste; nessuna delle sue costanti di game feel
  è verificata da un test, e nessuna è stata tarata su utenti reali.
- **Audio.** `src/audio/` è vuota.
- **Game feel.** `src/feel/` è vuota; esiste solo il contratto d'ingresso (`lastMove`), che è
  coperto da un test del motore.
- **Persistenza.** `src/persistence/storage.js` e `records.js` esistono ma **non hanno test**:
  richiedono `window.localStorage`.
- **i18n.** `src/i18n/` esiste e non ha test: non è verificato automaticamente che italiano e
  inglese abbiano le stesse chiavi.
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

### La questione aperta della Milestone 4: esperto ≈ normale

I due profili producono risultati praticamente indistinguibili: media 1393 contro 1443,
mediana 1030 contro 1082, mosse mediane 83 contro 86, riempimento mediano al game over 51%
in entrambi i casi. La differenza è nel rumore.

**Non sappiamo perché.** Le due spiegazioni possibili sono:

- **(a)** l'euristica del profilo "esperto" non è realmente migliore di quella "normale" — nel
  qual caso il problema è nel simulatore, non nel gioco;
- **(b)** il gioco non premia abbastanza la strategia — nel qual caso è un difetto di design
  del bilanciamento.

È in corso una misura con il profilo **`stratega`**, che pianifica l'intera terna invece di una
mossa alla volta ed è pensato proprio come discriminante: se nemmeno lui stacca gli altri due,
l'ipotesi (b) diventa quella probabile. **Il risultato non è ancora disponibile** e non va dato
per scontato in nessuna direzione.

Un elemento che vale la pena esaminare in quella indagine, notato leggendo il codice: la
funzione `nearCompletions` in `src/sim/player.mjs` — quella che misura le "quasi-chiusure",
cioè il peso su cui i due profili differiscono di più (1 contro 4) — conta **solo righe e
colonne, non i quadranti**, nonostante il suo commento dica il contrario. Se i quadranti sono
la meccanica che distingue QUADRA, un'euristica cieca sui quadranti potrebbe essere parte della
spiegazione (a). Da verificare, non da dare per acquisito.
