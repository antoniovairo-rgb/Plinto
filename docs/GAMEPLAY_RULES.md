# Regole di PLINTO

> Documento di riferimento sulle regole. Ogni numero qui dentro è stato letto in
> `src/config/rules.js`, `src/core/grid.js`, `src/core/scoring.js`,
> `src/core/generator.js`, `src/core/engine.js` e `src/core/shapes.js`, e ogni esempio
> numerico è stato ricalcolato eseguendo il codice. Fotografia del 6 settembre 2026.
>
> Avvertenza: quello che segue descrive il **motore**, coperto dalla suite unitaria
> (150 test in 12 file, tutti verdi).
> L'interfaccia è stata provata in un browser reale (Chromium, viewport 390x844) con lo
> scenario automatico `npm run e2e`, che verifica trascinamento, anteprima, modalità a due
> tocchi, salvataggio, ripresa, fine partita e navigazione. Non è ancora stata provata da
> persone vere né su un telefono fisico.

## Le regole in sei righe

1. Hai una griglia **9x9** e ricevi **tre pezzi** alla volta.
2. Appoggi un pezzo su celle libere: non si ruota e non si sposta più.
3. Quando una **riga**, una **colonna** o un **quadrante 3x3** è piena, sparisce e fa punti.
4. I tre pezzi non si rinnovano uno alla volta: la nuova terna arriva **solo dopo che hai
   appoggiato tutti e tre**.
5. Ogni tanto una cella di un pezzo è una **bomba**: quando viene eliminata insieme al suo
   gruppo porta via anche le celle intorno.
6. La partita finisce quando nessuno dei pezzi che ti restano entra più da nessuna parte.

## La griglia e i gruppi

`GRID_SIZE = 9`, `QUADRANT_SIZE = 3`: 81 celle, 9 righe, 9 colonne e 9 quadranti 3x3
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
      + round(celleEsploseDalleBombe * 6 * catena)            (PUNTI_CELLA_ESPLOSA)
      + [se numeroGruppi > 0 e griglia rimasta vuota]  300     (BOARD_CLEAR_BONUS)
```

Gli arrotondamenti sono **due e separati**: uno sul prodotto dei gruppi (`Math.round(sommaBase
* intreccio * catena)`) e uno sui punti delle celle fatte saltare dalle bombe
(`Math.round(celleEsplose * PUNTI_CELLA_ESPLOSA * catena)`). I punti delle celle appoggiate e
il bonus di svuotamento sono già interi e non vengono moltiplicati da nulla. Le celle esplose
seguono la Catena ma **non** l'Intreccio: il moltiplicatore dell'Intreccio si applica solo
alla somma base dei gruppi.

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
| 1 cella, chiude una riga, 4 celle saltate da una bomba, Catena 0 | `1 + round(18 × 1 × 1) + round(4 × 6 × 1)` | **43** |
| 1 cella, chiude una riga, 8 celle saltate, Catena 4 (×2) | `1 + round(18 × 1 × 2) + round(8 × 6 × 2)` = `1 + 36 + 96` | **133** |

Tutte le righe della tabella sono state rieseguite chiamando `scoreMove` il 6 settembre 2026 e
coincidono. Il caso della Catena 9 merita una nota, perché è l'unico in cui l'arrotondamento
si vede: `63 × 2 × 3.25 = 409.5`, e `Math.round` in JavaScript arrotonda **verso l'alto** i
mezzi esatti, quindi 410 e non 409.

Il punteggio di una mossa è sempre un intero e non è mai negativo (verificato da un test su
tutte le combinazioni di Catena 0..9 e 0..4 gruppi).

## La Catena

Il moltiplicatore persistente, e la meccanica che è stata riscritta più volte di ogni altra.

### La regola attuale

Vive in **due** campi dello stato: `state.chain`, il livello, e `state.chainDigiuno`, quante
mosse consecutive non hanno eliminato niente. Li aggiorna `nextChainState(livello, gruppi,
digiuno)` in `src/core/scoring.js`:

- **sale di uno** (`CHAIN_STEP_UP = 1`) a ogni mossa che chiude **almeno un gruppo**, fino al
  tetto `CHAIN_MAX = 9`. Sale di uno anche se i gruppi chiusi sono tre: **non conta quanti**;
- una mossa che elimina azzera il digiuno;
- **la prima mossa a vuoto non fa scendere niente** (`CHAIN_GRACE = 1`): consuma solo la
  tolleranza;
- dalla **seconda mossa a vuoto consecutiva in poi**, ogni mossa a vuoto fa scendere il
  livello di uno (`CHAIN_DECAY = 1`);
- il livello non scende sotto 0 e **non si azzera mai di colpo**.

| Livello | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Moltiplicatore | ×1 | ×1.25 | ×1.5 | ×1.75 | ×2 | ×2.25 | ×2.5 | ×2.75 | ×3 | ×3.25 |

Una sequenza concreta, ottenuta chiamando `nextChainState` una mossa alla volta a partire da
livello 5 e digiuno 0:

| Mossa | Elimina? | Livello dopo | Digiuno dopo |
| --- | --- | --- | --- |
| 1 | no | 5 | 1 |
| 2 | no | 4 | 2 |
| 3 | no | 3 | 3 |
| 4 | sì (3 gruppi) | 4 | 0 |
| 5 | no | 4 | 1 |
| 6 | sì (1 gruppo) | 5 | 0 |

Si legge in una riga: **la Catena sale di uno ogni volta che elimini e cala di uno ogni volta
che stai fermo, con una mossa di respiro.**

`respiroRimasto(digiuno)` restituisce quante mosse di tolleranza restano, e la barra della
Catena la usa: quando il respiro è finito — cioè quando la prossima mossa senza eliminazioni
farà calare il moltiplicatore — compare un avviso di ultima chiamata sotto la barra. Finché
è stata solo una funzione esportata e testata, la tolleranza era l'unica regola del gioco che
il giocatore poteva soltanto dedurre osservando il numero scendere. Una regola invisibile è
indistinguibile da un capriccio, che è esattamente ciò che questo gioco promette di non fare.

### Perché sale di uno e non di quanti gruppi

Chiudere tre gruppi con una mossa è già premiato dal moltiplicatore Intreccio. Contarli anche
qui li premiava due volte, e faceva schizzare la Catena al tetto dove poi restava: un
moltiplicatore fisso, cioè non un moltiplicatore ma una costante.

### Le tre versioni, con i numeri

La regola è cambiata due volte, e ogni volta perché una misura diceva che non stava
funzionando. I numeri vengono da giocatori artificiali, non da persone.

Si rifanno con **`npm run catena`** (`tools/misura-catena.mjs`): lo strumento fa giocare il
profilo `stratega` e registra, mossa per mossa, quanti gruppi ha chiuso; poi **rigioca quella
stessa sequenza** con la regola attuale e con le varianti scartate. Confrontarle sulle stesse
partite toglie di mezzo il rumore che ci sarebbe rigiocando tutto da capo per ogni variante.

Misura del 6 settembre 2026 — `stratega`, 120 partite, tetto di 250 mosse, **29.825 mosse**
(nessuna partita è finita prima del tetto: lo stratega, a questo livello di abilità, non muore
in 250 mosse):

| Regola | Catena ≥ 3 | Al tetto (9) | Catena media |
| --- | --- | --- | --- |
| **v1** sale di *N* gruppi, nessuna tolleranza | 1.3% | 0.0% | 0.61 |
| **v2** sale di *N* gruppi, due mosse di tolleranza | 95.4% | **77.4%** | 8.21 |
| v3 sale di uno, nessuna tolleranza | 0.4% | 0.0% | 0.48 |
| **v4, attuale** sale di uno, **una** mossa di tolleranza | 75.4% | **15.0%** | 5.15 |
| v5 sale di uno, due mosse di tolleranza | 94.9% | 74.3% | 8.11 |

Distribuzione della Catena **applicata** alla mossa con la regola attuale:

| Livello | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Quota mosse | 5.6% | 9.9% | 9.1% | 8.8% | 8.3% | 8.2% | 8.8% | 11.8% | 14.4% | 15.0% |

- **Versione 1.** Il moltiplicatore che doveva essere la firma del gioco era decorativo: con
  la Catena sopra 2 in poco più di una mossa su cento, il giocatore non aveva niente da
  proteggere. Non arrivava mai sopra 4.
- **Versione 2.** Il problema opposto, e altrettanto grave: **tre mosse su quattro giocate al
  tetto**. Un numero fisso è inutile esattamente quanto un numero che non arriva mai.
- **Versione 3.** Corretta la crescita ma non la tolleranza, la Catena torna a non accendersi:
  le due correzioni servono insieme, non una alla volta.
- **Versione 4, attuale.** Nessun livello supera il 15% e nessuno scende sotto il 5,6%: la
  distribuzione è larga, e la Catena resta qualcosa che si costruisce e si può perdere.
- **Versione 5.** Serve a mostrare che è la *tolleranza*, non il passo, a decidere se la Catena
  si incolla al tetto: con passo 1 e tolleranza 2 si torna al 74,3%.

**Il limite di questa tabella, detto chiaramente.** Le partite sono giocate con la regola
attuale, e lo `stratega` guarda il livello di Catena quando sceglie una mossa. Le righe delle
regole scartate sono quindi **controfattuali**: dicono che cosa avrebbe fatto quella regola su
*queste* partite, non che cosa avrebbe giocato qualcuno che vedeva quella regola. Solo la riga
della regola attuale è una misura esatta. Il confronto resta utile — la differenza fra «non si
accende mai» e «resta incollata al tetto» è troppo grande per dipendere da quel dettaglio — ma
non va spacciato per una simulazione delle vecchie regole.

**Il risultato dipende dal profilo.** Serie prodotte da profili, numero di partite o tetti
diversi non sono confrontabili cifra per cifra: chi le rifà deve dichiarare tutti e tre, come
è fatto qui.

**Una fonte contraddittoria, e come è stata chiusa.** Il commento di `CHAIN_GRACE` in
`src/config/rules.js` ha continuato per due versioni a descrivere la *seconda* regola — diceva
«tolleranza 2 (ora)» e riportava misure (2% / 11% / 24%) che non corrispondevano né alla
costante, che vale **1**, né a questa sezione. Il codice era giusto e il suo commento vecchio.
La correzione non è stata riscrivere il commento con altri numeri battuti a mano: quelli
invecchiano di nuovo. Ora il commento riporta la tabella qui sopra **e il comando che la
produce**, così i numeri si rifanno invece di ricordarli.

### Trasparenza

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
sopra. Resta un evento raro: nelle simulazioni con il profilo "normale" è successo **46 volte
in 1200 partite** (rimisurato il 6 settembre 2026), cioè meno di una partita su venti, e le
bombe non lo hanno reso comune.

## Le bombe

Ogni tanto una delle celle di un pezzo è una **bomba**. Non fa niente finché resta sulla
plancia: esplode **solo** quando viene eliminata insieme al gruppo che la contiene, e allora
porta via anche le celle intorno. È l'unica meccanica del gioco che tocca celle che il
giocatore non ha completato.

### Come finisce in mano

`forseUnaBomba` in `src/core/generator.js`, eseguita come **ultimo** passo di `generateHand`,
cioè dopo tutte le reti di sicurezza:

- una sola estrazione per **mano**, contro `BOMBA_PROBABILITA = 0.22`;
- se passa, **una sola cella di un solo pezzo** della terna diventa una bomba. Non esistono
  due bombe nella stessa mano;
- i candidati sono i pezzi con più di una cella: **la bomba non finisce mai su `p1`**, il
  pezzo da una cella. Una bomba da appoggiare dove capita non è una decisione;
- se nella terna non c'è nessun pezzo con più di una cella, la mano resta senza bomba;
- la cella scelta dentro il pezzo è uniforme fra le sue celle.

**La probabilità è fissa**, ed è la parola importante: `forseUnaBomba` riceve solo il
generatore pseudo-casuale e i pezzi. Non guarda il punteggio, la Catena, l'andamento della
partita né da quanto tempo non ne esce una. Chi sta andando bene non riceve più bombe per
premiarlo né meno per rallentarlo — vale la stessa dichiarazione della sezione Equità.

*Misurato* (400 partite, profilo `normale`, 40.697 mani estratte): **22,2%** delle mani
contiene una bomba, contro il 22% dichiarato dalla costante.

### La codifica nella griglia

Non c'è un secondo array. Il valore di una cella è il colore (1..6); una bomba è
**colore + `VALORE_BOMBA`**, cioè 11..16. Tre funzioni in `src/core/grid.js` bastano a
gestirlo: `coloreDi(valore)`, `eBomba(valore)`, `conBomba(colore)`. La conseguenza pratica è
che salvataggi, copie e simulazioni restano identici a prima: una bomba sopravvive al giro in
JSON senza nessun campo aggiuntivo, e un test lo verifica.

### L'esplosione

`detonaBombe(grid, celleIniziali)` in `src/core/grid.js`, chiamata da `placePiece` **solo se
`groups.length > 0`**, cioè solo se la mossa ha chiuso almeno un gruppo:

- una bomba porta via il quadrato di raggio `BOMBA_RAGGIO = 1` attorno a sé, cioè il 3x3 che
  la contiene. Sul bordo il quadrato viene ritagliato: una bomba nell'angolo elimina 4 celle
  in tutto, non 9;
- **le celle vuote non vengono toccate**: l'esplosione elimina, non scava;
- **reazione a catena**: una bomba dentro il quadrato detona a sua volta, e la propagazione
  continua finché non si aggiunge più nulla. Tre bombe adiacenti in fila portano via 15 celle;
- **due bombe a distanza 2 non si innescano**: il raggio è 1, quindi solo le otto celle
  adiacenti. Un test lo verifica di proposito.

Le celle portate via **oltre** a quelle dei gruppi sono le `esplose`, e sono l'unica cosa che
la bomba aggiunge al punteggio: `PUNTI_CELLA_ESPLOSA = 6` ciascuna, moltiplicate per la
Catena (non per l'Intreccio). Una detonazione **non** aumenta il numero di gruppi chiusi:
quindi non tocca il moltiplicatore Intreccio e non fa salire la Catena più in fretta.

Due conseguenze che si notano giocando:

- una bomba **può** completare uno svuotamento della griglia e quindi far scattare i 300 punti
  di `BOARD_CLEAR_BONUS`, perché il controllo di griglia vuota avviene dopo l'eliminazione;
- `moveTier` conta anche le celle saltate (`gruppi + floor(catena / 3) + floor(celleEsplose / 8)`),
  quindi una mossa con una bomba viene celebrata di più a parità di gruppi chiusi.

### Quanto pesano davvero

*Misurato* su 400 partite del profilo `normale` (121.636 mosse):

| Indicatore | Valore |
| --- | --- |
| Mani con una bomba | 22,2% |
| Mosse che fanno detonare almeno una bomba | 6,5% |
| Bombe detonate per partita | 21,6 |
| Celle saltate (oltre al gruppo) per partita | 35,2 |
| Celle saltate per bomba detonata | 1,63 |
| Bombe per mossa con detonazione | 1,09 |

L'ultima riga è quella che ridimensiona la reazione a catena: nel gioco reale una detonazione
ne innesca un'altra di rado. Anche 1,63 celle saltate per bomba è molto meno del massimo
teorico di 8: quando una bomba salta insieme a una riga, buona parte del quadrato che la
circonda è già dentro il gruppo che sta sparendo, e il resto è spesso vuoto.

Il colore della bomba resta quello del pezzo: come ogni altro colore, non ha nessuna regola.
Il segno che la distingue è geometrico (una bomba disegnata, con la scintilla accesa sulla miccia), è spiegato fra le quattro regole della presentazione al primo avvio ed è documentato in
`docs/DESIGN_SYSTEM.md`.

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
- **Non regola la frequenza delle bombe sull'andamento della partita**: `BOMBA_PROBABILITA`
  è una costante, estratta una volta per mano e nient'altro (vedi "Le bombe").

### L'evidenza misurata

L'indicatore che rende la dichiarazione controllabile è il **riempimento della griglia al game
over**. Una partita che finisce con la griglia quasi vuota è quella che il giocatore percepisce
come ingiusta: significa che gli sono arrivati pezzi che non entravano mentre lo spazio c'era.

Profilo "normale", 1200 partite simulate, rieseguito il 6 settembre 2026
(`node src/sim/run.mjs 1200 normale`):

| Riempimento al game over | Quota partite |
| --- | --- |
| < 30% | 0.3% |
| 30–40% | 9.4% |
| 40–50% | 35.3% |
| 50–60% | 40.4% |
| 60–70% | 13.7% |
| ≥ 70% | 0.9% |

Mediana 51%, minimo 25%. Partite finite sotto le 15 mosse: **0.3%** (3 partite su 1200).
Sotto le 8 mosse: **0.00%** (nessuna). Le partite finiscono dove devono finire: con la griglia
intasata, non mezza vuota.

Questi numeri sono stati rimisurati **dopo** l'arrivo delle bombe e della Catena attuale, e
sono cambiati: nella revisione precedente la coda sotto il 30% pesava lo 0.9% e le partite
sotto le 15 mosse l'1.5%. La direzione è migliorata, ma la lezione da tenere è un'altra: una
misura di equità vale per la revisione in cui è stata presa, e va rifatta a ogni cambio di
regole.

Nota onesta su questi numeri: sono prodotti da un **giocatore artificiale**, non da esseri
umani. Misurano l'equità del generatore, non l'esperienza reale. Nessun playtest umano
strutturato è stato ancora fatto.

---

## I livelli

Un livello è una partita normale con due aggiunte: uno o più **obiettivi** e, quasi sempre, un
**tetto di mosse**. Le regole non cambiano di una virgola: cambia la condizione di vittoria.

Si perde in **due modi soli**, entrambi dichiarati prima di cominciare: finire le mosse, oppure
restare senza mosse possibili. Nessun tempo, nessuna vita, nessuna penalità nascosta. E la
vittoria si valuta **prima** della sconfitta: chi raggiunge l'obiettivo con l'ultima mossa
disponibile ha vinto.

I dieci tipi di obiettivo sono in `OBIETTIVI` (`src/core/quadro.js`): righe, colonne,
quadranti, gruppi (uno qualunque dei tre), celle eliminate, punteggio, Catena, Intreccio,
pulizia della griglia, sopravvivenza.

### Ogni livello si apre spiegando che cosa chiede

`src/ui/schermate/AperturaQuadro.jsx`. Plinto dice la frase dell'obiettivo, che cosa significa,
come conviene affrontarlo e quante mosse ci sono; poi si gioca.

**Perché esiste.** La striscia sopra la plancia dice COSA fare — «Chiudi una riga», `0/1` — ma
non ha mai detto che cosa SIA una riga. Chi conosce il genere lo deduce in un secondo; chi non
lo conosce si trova un contatore e nessun appiglio. È una lacuna emersa dal primo playtest
umano del progetto, e nessun test automatico avrebbe potuto trovarla: il gioco funzionava
perfettamente, semplicemente non si spiegava.

**È coerente con l'equità dichiarata.** Un gioco che promette di non nascondere niente al
giocatore non può poi lasciargli dedurre le regole. Vale per la tolleranza della Catena — che
per due versioni è stata una regola invisibile — e vale per l'obiettivo di un livello.

Il consiglio mostrato è un consiglio vero, non un incoraggiamento: dice dove conviene giocare,
non che ce la puoi fare.

## Come finisce una partita

Il controllo è in `placePiece`, subito dopo l'appoggio e l'eventuale eliminazione. In ordine:

1. Il pezzo viene appoggiato e la sua casella in mano diventa vuota.
2. Si cercano i gruppi completi; se ce n'è almeno uno, le eventuali bombe che contengono
   detonano, e solo allora si svuotano tutte le celle in una volta sola.
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

## La Sfida del Giorno e il suo archivio

Ogni giorno la partita è **la stessa per tutti**: il seme del generatore è la data
(`semeDaData` in `src/core/sfida.js`), quindi griglia iniziale e sequenza dei pezzi
coincidono per chiunque giochi quel giorno. Non c'è nessun limite di tentativi, niente da
sbloccare, nessuna serie da mantenere: saltare un giorno non toglie niente, perché non
c'era niente da perdere.

Da qui discende l'**archivio**: se il seme è la data, anche i giorni passati sono
giocabili, e non perché siano stati salvati — **non esiste nessun archivio di partite** —
ma perché si possono ricalcolare. Chi installa il gioco oggi trova mesi di sfide già
pronte.

### Quattro decisioni dichiarate

**1. Il giorno è quello locale del dispositivo, non UTC.** Chi gioca alle 23:30 sta
giocando la sfida di oggi, non quella di domani. La conversione da data a giorno avviene
in **un solo punto** del codice (`giornoDiOggi`), perché due conversioni scritte in due
posti finiscono sempre per non essere d'accordo su qualche fuso. Il cambio dell'ora legale
non fa saltare né ripetere un giorno: c'è un test che attraversa entrambe le notti, in
marzo e in ottobre, un giorno alla volta.

**2. Il futuro è chiuso, il passato no.** Non si può aprire la sfida di domani: sarebbe un
modo per arrivare preparati al giorno dopo. Il passato è aperto senza limiti fino al
**6 settembre 2026**, giorno in cui la Sfida del Giorno è entrata nel gioco. Prima di quella
data una sfida non è mai esistita, e offrirla sarebbe inventare un passato che non c'è
stato: nessuno l'ha giocata quel giorno, quindi non sarebbe «la stessa partita per tutti».

**3. L'orologio del dispositivo non è verificabile, e non proviamo a verificarlo.** Senza un
server non si può: chiunque può spostare l'orologio avanti e aprire la sfida di domani. Non
esiste nessuna classifica globale da proteggere, quindi l'unico danno che uno si fa è a sé
stesso. È scritto anche nella schermata dell'archivio. Una finta protezione darebbe
l'impressione di una garanzia che non c'è, ed è peggio di nessuna protezione.

**4. Una partita rigiocata dopo un aggiornamento può non essere la stessa.** Il generatore
è deterministico: se cambia un peso in `shapes.js` o una costante in `rules.js`, lo stesso
seme produce una partita diversa. La sfida del 12 marzo rigiocata dopo un aggiornamento non
è più quella che hanno giocato gli altri quel giorno. **È inevitabile, e va detto invece che
nascosto.**

Per poterlo dire, ogni risultato salvato porta l'**impronta delle regole** con cui è stato
ottenuto (`src/core/impronta.js`). Non è un numero di versione da alzare a mano — che prima
o poi qualcuno dimentica di alzare, ed è proprio il caso in cui il dato diventa una bugia —
ma un valore **calcolato** da tutte le costanti di regolamento e da tutto il catalogo delle
forme: cambiare un peso la cambia da sola. Quando l'impronta di un risultato non coincide
con quella corrente, la casella di quel giorno lo dice in una riga, senza allarmismi.

I risultati salvati prima che l'impronta esistesse restano marcati come **sconosciuti**, non
come «diversi»: sono due cose diverse, e confonderle farebbe comparire un avviso su ogni
risultato vecchio di chi gioca da mesi — il modo più rapido di rendere un avviso invisibile.

### Che cosa viene salvato

Una riga per ogni giorno **giocato**: punteggio migliore, numero di tentativi, impronta
delle regole. Nient'altro. Un anno di gioco quotidiano occupa **circa 22 kB** (misurato su
365 giorni in `tests/sfide.test.js`), quindi non c'è nessuna ragione di cancellare niente:
la potatura ai 60 giorni che esisteva fino alla 0.5.2 è stata tolta, perché un archivio che
dimentica dopo due mesi non è un archivio.

Rigiocare un giorno dall'archivio non recupera niente e non sblocca niente: conserva solo il
punteggio migliore di quel giorno, come per la sfida di oggi.

## La modalità con l'anteprima, e quanto costa

Nel gioco base la terna successiva **non esiste** finché serve: viene estratta quando la
mano si è svuotata, sulla griglia com'è in quel momento. Per mostrarla in anticipo si può
fare una cosa sola in modo onesto — **estrarla nell'istante in cui viene consegnata quella
corrente, e non toccarla più**. L'alternativa (estrarla per mostrarla e rigenerarla
all'uso) mostrerebbe una terna diversa da quella che arriva, ed è la peggiore funzionalità
possibile in un gioco che promette di non nascondere niente.

### Il prezzo, misurato

Le cinque reti di sicurezza del generatore leggono la griglia **al momento
dell'estrazione**. Con l'anteprima quel momento arriva fino a tre mosse prima dell'uso,
cioè su una griglia **più vuota**. La rete n. 5 — «sopra il 60% di riempimento almeno un
pezzo piccolo» — può quindi non scattare, perché all'estrazione il riempimento era ancora
sotto soglia. **La modalità anteprima è più dura di quella base**, all'opposto
dell'intuizione.

Misurato con `node src/sim/run.mjs 3000 normale 250 <modalità>`, profilo «normale», tetto
di 250 mosse, su **due campioni indipendenti** (semi 20260906 e 777):

| | base | anteprima | base (2° campione) | anteprima (2° campione) |
|---|---|---|---|---|
| Punteggio medio | 4173,0 | 4118,2 | 4168,8 | 4057,4 |
| Mosse medie | 177,7 | 175,0 | 176,8 | 173,6 |
| Ancora vive a 250 mosse | 42,2% | 41,4% | 42,6% | 40,7% |
| Partite sotto 15 mosse | 6 (0,2%) | 9 (0,3%) | 6 (0,2%) | 11 (0,4%) |
| Game over sotto il 30% di riempimento | 21,9% | 21,9% | 22,4% | 21,8% |

**Cosa dicono questi numeri, senza abbellirli.** L'effetto è nella direzione prevista e la
direzione è la stessa in entrambi i campioni, su tutte le righe: la modalità anteprima è
un po' più dura. La misura è **1–2%**, cioè piccola: due campioni concordi la rendono
credibile, ma non è la stessa cosa di un intervallo di confidenza, e qui non ne è stato
calcolato uno.

**La coda che conta non è peggiorata.** I game over con la griglia sotto il 30% — quelli
che un giocatore percepisce come ingiusti — restano uguali (21,9% contro 21,9%, e 22,4%
contro 21,8% nel secondo campione). La differenza si concentra sulle partite molto corte,
che passano da 6 a 9–11 su 3000: un caso ogni trecento partite circa.

### Le altre conseguenze, tutte dichiarate

- **Record separati.** Vedere avanti è un vantaggio informativo: mettere i due punteggi
  nella stessa classifica vorrebbe dire dichiarare confrontabili due cose che non lo sono.
- **Semi non compatibili.** Estrarre in anticipo cambia l'ordine di consumo del
  generatore, quindi **lo stesso seme produce una partita diversa** nelle due modalità.
  La mano iniziale coincide; tutto quello che viene dopo, no.
- **L'anteprima mostra le forme, non i colori.** Il colore dei pezzi è dichiaratamente
  estetico, e mostrarlo in anticipo suggerirebbe che conti qualcosa. **La bomba invece si
  vede**: quella non è estetica, cambia cosa conviene fare.
- **Il gioco base non è cambiato di una virgola.** Nessuna estrazione è stata spostata: i
  100 livelli tarati e tutte le sfide passate producono esattamente le partite di prima.
  C'è un test che lo verifica.
