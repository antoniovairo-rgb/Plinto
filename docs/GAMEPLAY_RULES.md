# Regole di PLINTO

> Documento di riferimento sulle regole. Ogni numero qui dentro è stato letto in
> `src/config/rules.js`, `src/core/grid.js`, `src/core/scoring.js`,
> `src/core/generator.js` e `src/core/shapes.js`, e ogni esempio numerico è stato
> ricalcolato eseguendo il codice. Fotografia del 6 settembre 2026.
>
> Avvertenza: quello che segue descrive il **motore**, coperto da 75 test unitari.
> L'interfaccia è stata provata in un browser reale (Chromium, viewport 390x844) con lo
> scenario automatico `npm run e2e`, che verifica trascinamento, anteprima, modalità a due
> tocchi, salvataggio, ripresa, fine partita e navigazione. Non è ancora stata provata da
> persone vere né su un telefono fisico.

## Le regole in cinque righe

1. Hai una griglia **9x9** e ricevi **tre pezzi** alla volta.
2. Appoggi un pezzo su celle libere: non si ruota e non si sposta più.
3. Quando una **riga**, una **colonna** o un **quadrante 3x3** è piena, sparisce e fa punti.
4. I tre pezzi non si rinnovano uno alla volta: la nuova terna arriva **solo dopo che hai
   appoggiato tutti e tre**.
5. La partita finisce quando nessuno dei pezzi che ti restano entra più da nessuna parte.

## La griglia e i gruppi

`GRID_SIZE = 9`, `PLINTONT_SIZE = 3`: 81 celle, 9 righe, 9 colonne e 9 quadranti 3x3
non sovrapposti (numerati 0..8 da sinistra a destra e dall'alto in basso).

Un pezzo si appoggia con l'angolo alto-sinistra del proprio riquadro in una cella (riga,
colonna). È valido solo se **tutte** le sue celle stanno dentro la griglia e sono libere.
Nessuna rotazione, nessuno spostamento dopo l'appoggio: `placeShape` lancia un errore se una
cella è già occupata, e `placePiece` rifiuta la mossa restituendo lo stato invariato.

### Regola di eliminazione

`findCompletedGroups` (in `src/core/grid.js`) controlla **tutte e tre le famiglie insieme**,
sulla griglia com'è dopo l'appoggio:

- ogni riga completa → un gruppo di tipo `row`;
- ogni colonna completa → un gruppo di tipo `col`;
- ogni quadrante 3x3 completo → un gruppo di tipo `quadrant`.

Una sola mossa può chiuderne più di uno, anche di tipi diversi. `clearGroups` poi svuota le
celle di tutti i gruppi trovati usando un `Set`: **una cella che sta su un incrocio viene
svuotata e contata una volta sola**. Un test lo verifica su riga 0 + colonna 0: 9 + 9 celle
con un incrocio in comune danno 17 celle eliminate, non 18.

Questo non ha effetto sul punteggio, perché il punteggio premia i **gruppi**, non le celle
eliminate: non serve nessuna correzione anti-doppio-conteggio.

## Punteggio

### La formula esatta

Da `scoreMove` in `src/core/scoring.js`:

```
catena    = 1 + 0.25 * livelloCatenaPRIMAdellaMossa      (CHAIN_STEP)
intreccio = 1 + 0.5  * (numeroGruppi - 1)                (INTRECCIO_STEP), 0 se nessun gruppo
sommaBase = somma dei punti base dei gruppi chiusi

punti = celleAppoggiate * 1                                   (POINTS_PER_CELL)
      + [se numeroGruppi > 0]  round(sommaBase * intreccio * catena)
      + [se numeroGruppi > 0 e griglia rimasta vuota]  300     (BOARD_CLEAR_BONUS)
```

L'arrotondamento è **uno solo**, applicato al prodotto intero: `Math.round(sommaBase *
intreccio * catena)`. I punti delle celle appoggiate e il bonus di svuotamento sono già interi
e non vengono moltiplicati da nulla.

Punti base per gruppo (`GROUP_BASE_POINTS`):

| Tipo | Punti base | Perché |
| --- | --- | --- |
| Riga (`row`) | 18 | |
| Colonna (`col`) | 18 | |
| Quadrante (`quadrant`) | **27** | è più difficile da chiudere |

### Esempi numerici

Calcolati a mano e verificati chiamando `scoreMove`.

| Mossa | Conto | Punti |
| --- | --- | --- |
| Pezzo da 3 celle, nessuna eliminazione, Catena 0 | `3` | **3** |
| 1 cella, chiude una riga, Catena 0 | `1 + round(18 × 1 × 1)` | **19** |
| 3 celle, chiude una riga, Catena 4 (×2) | `3 + round(18 × 1 × 2)` | **39** |
| 5 celle, chiude riga + colonna, Catena 2 (×1.5) | `5 + round(36 × 1.5 × 1.5)` = `5 + 81` | **86** |
| 4 celle, chiude riga + colonna + quadrante, Catena 0 | `4 + round(63 × 2 × 1)` | **130** |
| 4 celle, riga + colonna + quadrante, Catena 9 (×3.25) | `4 + round(63 × 2 × 3.25)` = `4 + round(409.5)` | **414** |
| 6 celle, due quadranti, Catena 3 (×1.75) | `6 + round(54 × 1.5 × 1.75)` = `6 + 142` | **148** |
| 1 cella, chiude una riga e svuota la griglia, Catena 0 | `1 + 18 + 300` | **319** |

Il punteggio di una mossa è sempre un intero e non è mai negativo (verificato da un test su
tutte le combinazioni di Catena 0..9 e 0..4 gruppi).

## La Catena

Il moltiplicatore persistente. Vive nel campo `state.chain`, parte da 0 ed è governato da
`nextChainLevel`:

- **sale** di **quanti gruppi hai chiuso in quella mossa** (chiuderne tre la fa salire di 3),
  fino a un massimo di `CHAIN_MAX = 9`;
- **scende di 1** — `CHAIN_DECAY = 1` — dopo ogni mossa che non elimina nulla;
- non scende sotto 0 e **non si azzera mai di colpo**.

| Livello | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Moltiplicatore | ×1 | ×1.25 | ×1.5 | ×1.75 | ×2 | ×2.25 | ×2.5 | ×2.75 | ×3 | ×3.25 |

Perché non si azzera: una singola mossa a vuoto — che in un gioco a blocchi capita di
continuo, anche giocando bene — non deve cancellare il lavoro di dieci mosse. Con il
decadimento di 1 la partita diventa una tensione continua ("non lasciare che scenda") invece
di una serie di combo isolate, e senza aggiungere una sola regola sul tabellone.

**Il moltiplicatore applicato è quello PRIMA della mossa**, cioè quello che il giocatore vede
nell'interfaccia mentre decide. L'aumento vale dalla mossa successiva. È una scelta di
trasparenza, non di bilanciamento: nessun calcolo nascosto fra quello che leggi e quello che
incassi. In `lastMove` sono esposti sia `chainBefore` (quello usato) sia `chainAfter`.

## L'Intreccio

Chiudere più gruppi con **una sola mossa**. Moltiplicatore
`1 + 0.5 × (gruppi − 1)` (`INTRECCIO_STEP = 0.5`):

| Gruppi chiusi | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- |
| Moltiplicatore | ×1 | ×1.5 | ×2 | ×2.5 | ×3 |

Intreccio e Catena si moltiplicano fra loro. È qui che il quadrante cambia il gioco: la stessa
mossa può chiudere una riga, una colonna e il quadrante in cui cadono, e quei tre gruppi
valgono `(18+18+27) × 2 = 126` invece di 63.

## Il bonus di svuotamento

`BOARD_CLEAR_BONUS = 300`, una tantum per ogni volta che accade. Condizione esatta, letta in
`engine.js` e `scoring.js`: **la mossa ha chiuso almeno un gruppo** *e* dopo l'eliminazione la
griglia è completamente vuota. Non viene moltiplicato né dalla Catena né dall'Intreccio.

La doppia condizione serve a un caso limite reale: se la griglia è già vuota e appoggi un
pezzo che non chiude niente, non stai svuotando nulla e non prendi il bonus.

Ordine di grandezza: 300 punti sono più del doppio della mossa da 130 punti dell'esempio qui
sopra. Nelle simulazioni con il profilo "normale" è successo 45 volte in 1200 partite.

## Il catalogo delle forme

**41 forme**, nessuna rotazione in partita: le varianti ruotate sono forme distinte del
catalogo. La scelta è di comodità sul telefono — ruotare un pezzo richiede un gesto in più e
rompe il "prendi e appoggia".

Peso totale del sacchetto: **183**. La percentuale in tabella è la probabilità **base**, cioè
su griglia vuota e senza storico; il generatore la modifica (vedi "Equità").

| Famiglia | Forme | Peso | Quota base | Celle |
| --- | --- | --- | --- | --- |
| punto | 1 | 6 | 3.28% | 1 |
| linea | 8 | 58 | 31.69% | 2, 3, 4, 5 |
| angolo | 8 | 44 | 24.04% | 3, 5 |
| tetro (L/J, T, S/Z) | 16 | 48 | 26.23% | 4 |
| blocco | 4 | 21 | 11.48% | 4, 6, 9 |
| diagonale | 4 | 6 | 3.28% | 2, 3 |
| **totale** | **41** | **183** | **100%** | |

### Tabella completa dei pesi

| id | Famiglia | Celle | Ingombro (L×A) | Peso | Quota base |
| --- | --- | --- | --- | --- | --- |
| `p1` | punto | 1 | 1×1 | 6 | 3.28% |
| `h2` | linea | 2 | 2×1 | 10 | 5.46% |
| `v2` | linea | 2 | 1×2 | 10 | 5.46% |
| `h3` | linea | 3 | 3×1 | 10 | 5.46% |
| `v3` | linea | 3 | 1×3 | 10 | 5.46% |
| `h4` | linea | 4 | 4×1 | 6 | 3.28% |
| `v4` | linea | 4 | 1×4 | 6 | 3.28% |
| `h5` | linea | 5 | 5×1 | 3 | 1.64% |
| `v5` | linea | 5 | 1×5 | 3 | 1.64% |
| `b22` | blocco | 4 | 2×2 | 9 | 4.92% |
| `b23` | blocco | 6 | 3×2 | 5 | 2.73% |
| `b32` | blocco | 6 | 2×3 | 5 | 2.73% |
| `b33` | blocco | 9 | 3×3 | 2 | 1.09% |
| `a3ne` `a3nw` `a3se` `a3sw` | angolo | 3 | 2×2 | 8 ciascuna | 4.37% ciascuna |
| `a5ne` `a5nw` `a5se` `a5sw` | angolo | 5 | 3×3 | 3 ciascuna | 1.64% ciascuna |
| `l4a`…`l4h` (8 forme) | tetro L/J | 4 | 2×3 / 3×2 | 3 ciascuna | 1.64% ciascuna |
| `t4n` `t4s` `t4e` `t4w` | tetro T | 4 | 3×2 / 2×3 | 4 ciascuna | 2.19% ciascuna |
| `s4h` `z4h` `s4v` `z4v` | tetro S/Z | 4 | 3×2 / 2×3 | 2 ciascuna | 1.09% ciascuna |
| `d2a` `d2b` | diagonale | 2 | 2×2 | 2 ciascuna | 1.09% ciascuna |
| `d3a` `d3b` | diagonale | 3 | 3×3 | 1 ciascuna | 0.55% ciascuna |

Note leggibili dai pesi: il **punto** (`p1`) è la valvola di sfogo — è sempre piazzabile
finché resta una casella libera; le **S/Z** e le **diagonali** sono le forme più rare del
gioco; il **3x3 pieno** (`b33`) ha il peso più basso fra i blocchi.

Le diagonali (`d2a`, `d2b`, `d3a`, `d3b`) sono la firma del catalogo: celle non adiacenti che
obbligano a leggere la griglia in un modo che le forme ortogonali non richiedono. Sono anche
le più rare: insieme valgono il 3.28% del sacchetto.

Il **colore** dei pezzi (6 famiglie cromatiche, `COLOR_COUNT = 6`) è puramente estetico: non
esiste una sola regola che lo guardi.

---

# EQUITÀ

Questa è la sezione che conta. PLINTO dichiara per intero le proprie regole nascoste.

**Dichiarazione, verificabile nel sorgente.** `generateHand(grid, rngState, history)` in
`src/core/generator.js` riceve tre soli argomenti: la griglia, lo stato del generatore
pseudo-casuale e l'elenco delle forme uscite di recente. **Non riceve, e quindi non può
guardare, il punteggio, la Catena, il numero di mosse, la durata della partita, i record del
giocatore o quante partite ha giocato.** Non esiste nel codice una sola regola che renda il
gioco più difficile in funzione di quanto bene sta andando il giocatore. Non c'è difficoltà
occulta, non ci sono falsi quasi-successi, non c'è nessun pezzo scelto apposta per farti
perdere. Il file è breve e ispezionabile: si legge in dieci minuti.

Le regole nascoste che esistono sono **cinque**, e sono tutte a favore del giocatore.

### 1. Pressione da affollamento — le forme grandi diventano più rare quando la griglia si riempie

Sopra `CROWD_PRESSURE_START = 0.45` di riempimento, il peso di una forma viene moltiplicato
per `0.55 ^ (pressione × celle_in_eccesso)`, dove `pressione` cresce da 0 a 1 fra il 45% e il
100% di riempimento e `celle_in_eccesso` è quanto la forma supera le `CROWD_NEUTRAL_SIZE = 3`
celle. Le forme da 1, 2 e 3 celle **non sono mai penalizzate**.

Peso effettivo al variare del riempimento (calcolato eseguendo `effectiveWeight`):

| Forma | 0–45% | 60% | 75% | 90% |
| --- | --- | --- | --- | --- |
| `p1` (1 cella), `h3` (3) | invariato | invariato | invariato | invariato |
| `b22` (4 celle), base 9 | 9.00 | 7.65 | 6.50 | 5.52 |
| `h5` (5 celle), base 3 | 3.00 | 2.17 | 1.56 | 1.13 |
| `b23` (6 celle), base 5 | 5.00 | 3.07 | 1.88 | 1.15 |
| `b33` (9 celle), base 2 | 2.00 | 0.75 | 0.28 | 0.11 |

*A chi giova:* al giocatore. Quando lo spazio manca, arrivano più spesso pezzi che ci stanno.
Non esiste la regola simmetrica: **non c'è nessun caso in cui il generatore aumenti il peso
delle forme grandi perché la griglia è vuota o perché stai andando bene.**

### 2. Memoria — meno ripetizioni

Il generatore ricorda le ultime `HISTORY_SIZE = 6` forme uscite; una forma presente in quello
storico vede il proprio peso moltiplicato per `HISTORY_PENALTY = 0.45` (esempio verificato:
`h3` passa da 10 a 4.5). Inoltre la stessa forma non compare più di
`MAX_SAME_SHAPE_IN_HAND = 2` volte nella stessa terna.

*A chi giova:* al giocatore. Alza la varietà percepita senza rendere la sequenza prevedibile.
È neutra rispetto alla difficoltà: penalizza allo stesso modo i pezzi comodi e quelli scomodi.

### 3. Clemenza iniziale, parte A — niente pezzi "senza casa" a inizio partita

Sotto `RISKY_PIECE_FILL = 0.30` di riempimento, un pezzo che ha **meno di
`MIN_PLACEMENTS_EARLY = 2` posizioni valide** sulla griglia attuale viene sostituito (fino a
`MERCY_ATTEMPTS = 12` tentativi per slot) con una forma che ne ha almeno 2.

*Perché:* un pezzo con una sola casa possibile su una griglia quasi vuota diventa un game over
a sorpresa appena il giocatore appoggia gli altri due. Non è difficoltà, è sfortuna.

*A chi giova:* al giocatore. **Sopra il 30% di riempimento questa regola non interviene più**:
lo spazio che resta è quello che il giocatore si è costruito, e le forme scomode sono parte
della sfida.

### 4. Clemenza iniziale, parte B — nessuna terna morta in partenza sotto metà griglia

Sotto `EARLY_MERCY_FILL = 0.50`, se **nessuno** dei tre pezzi è piazzabile, la terna viene
riestratta fino a `MERCY_ATTEMPTS = 12` volte. Se dopo 12 tentativi è ancora morta, il terzo
pezzo viene rimpiazzato d'ufficio con una forma che ha almeno una posizione valida (se ne
esiste una).

*A chi giova:* al giocatore. Morire con la griglia mezza vuota per pura sfortuna non è
difficoltà, è un difetto di design.

*Il limite è dichiarato:* **sopra il 50% di riempimento questa rete non esiste più.** Un test
lo verifica di proposito su una griglia frammentata oltre metà, e si assicura che le terne
impiazzabili siano ancora possibili: il game over deve restare un esito reale.

### 5. Rete di sicurezza a griglia molto piena — almeno un pezzo piccolo

A partire da `CROWDED_FILL_RATIO = 0.60` di riempimento, se nessuno dei tre pezzi ha al più
`SMALL_PIECE_MAX_CELLS = 4` celle, l'ultimo pezzo viene sostituito con una forma piccola
(32 forme su 41 rientrano nella soglia).

*A chi giova:* al giocatore. Attenzione a cosa **non** promette: garantisce un pezzo *piccolo*,
non un pezzo *piazzabile*. Con la griglia a buchi isolati anche una forma da 2 celle può non
entrare da nessuna parte. La rete riduce le morti gratuite, non le elimina — e non deve.

### Cosa il generatore non fa, punto per punto

- Non guarda il punteggio, la Catena, i record, il tempo di gioco.
- Non riduce mai la probabilità di un pezzo *perché sarebbe utile*.
- Non aumenta mai la probabilità di un pezzo *perché sarebbe scomodo*.
- Non toglie mai una terna già consegnata, e non la cambia dopo che l'hai vista.
- Non ha nessuna modalità "il giocatore è troppo bravo".

### L'evidenza misurata

L'indicatore che rende la dichiarazione controllabile è il **riempimento della griglia al game
over**. Una partita che finisce con la griglia quasi vuota è quella che il giocatore percepisce
come ingiusta: significa che gli sono arrivati pezzi che non entravano mentre lo spazio c'era.

Profilo "normale", 1200 partite simulate (`node src/sim/run.mjs 1200 normale`):

| Riempimento al game over | Quota partite |
| --- | --- |
| < 30% | 0.9% |
| 30–40% | 7.6% |
| 40–50% | 37.8% |
| 50–60% | 40.6% |
| 60–70% | 12.8% |
| ≥ 70% | 0.3% |

Mediana 51%, minimo 25%. Partite finite sotto le 15 mosse: **1.5%**. Sotto le 8 mosse:
**0.00%** (nessuna). Le partite finiscono dove devono finire: con la griglia intasata, non
mezza vuota.

Nota onesta su questi numeri: sono prodotti da un **giocatore artificiale**, non da esseri
umani. Misurano l'equità del generatore, non l'esperienza reale. Nessun playtest umano
strutturato è stato ancora fatto.

---

## Come finisce una partita

Il controllo è in `placePiece`, subito dopo l'appoggio e l'eventuale eliminazione. In ordine:

1. Il pezzo viene appoggiato e la sua casella in mano diventa vuota.
2. Si cercano e si eliminano i gruppi completi.
3. **Se e solo se tutti e tre gli slot sono vuoti**, viene generata una nuova terna sulla
   griglia com'è ora.
4. Si guarda se esiste almeno un pezzo — fra quelli rimasti in mano, o fra i tre appena
   arrivati — che entri **da qualche parte** sulla griglia.
5. Se non ce n'è nessuno, `status` passa a `'over'`, viene registrato `endedAt` e
   `lastMove.gameOver` è `true`. Da quel momento ogni ulteriore chiamata a `placePiece`
   restituisce lo stato invariato.

Non esiste nessun altro modo di perdere: niente tempo, niente vite, niente mosse contate.
Non esiste nemmeno un modo di **vincere**: la partita è a punteggio aperto, senza traguardo
finale. L'unica progressione prevista sono i record personali (`src/persistence/records.js`).

Conseguenza di cui vale la pena essere consapevoli: siccome la terna si rinnova solo quando è
esaurita, **l'ordine con cui appoggi i tre pezzi conta**, e l'ultimo pezzo di una terna è
quello che uccide, perché va appoggiato sulla griglia più piena.

A fine partita `summarize()` restituisce: punteggio, mosse, durata, gruppi chiusi (totali e
divisi per riga/colonna/quadrante), Catena massima raggiunta, mossa migliore, Intreccio
massimo, numero di svuotamenti totali e celle ancora piene.
