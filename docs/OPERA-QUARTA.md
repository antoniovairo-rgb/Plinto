# La Piazza (quarta opera) — documento di progetto

Stato: **decisa, lavoro non ancora iniziato** (si comincia dopo l'uscita dell'Arena).
Branch: `opera-quarta` (parte da `opera-arena`). Opera: **La Piazza**. Regola: **il pavimento**.
Scritto l'11 ottobre 2026 su richiesta del proprietario («Nuova opera»).

La quarta opera viene dopo il Ponte (1-100), la Torre (101-200, i massi) e l'Arena
(201-300, i mattoni rinforzati). Questo documento propone che cosa costruire e quale regola
nuova portare, con i rischi di ciascuna scelta. Le stime sono opinioni, non misure: la
Torre e l'Arena hanno insegnato che le tarature si contano solo dopo aver generato i primi
livelli.

---

## 1. Decisioni

Prese dal proprietario l'11 ottobre 2026:

| Domanda | Scelta |
|---|---|
| Che regola nuova porta | **Il pavimento** (sezione 3.1) |
| Che cosa si costruisce | **La Piazza** |
| Quando si comincia | **Dopo l'uscita dell'Arena** |

Ancora da decidere (proposte, opinione):

| Domanda | Proposta |
|---|---|
| Quanti livelli | 100, dal 301 al 400, come le altre opere |
| Chi la gioca | Solo chi ha finito tutta l'Arena, come per le opere precedenti |
| Massi e mattoni | Nei primi atti no; negli ultimi, forse, insieme alla regola nuova (sezione 5) |
| Quando esce | Uno o due mesi dopo l'Arena |

---

## 2. Vincoli (gli stessi della Torre e dell'Arena, dal codice di oggi)

1. **Le opere uscite non si toccano**: ogni livello ha un seme che dipende dal suo numero
   (`semeDelQuadro` in `src/core/quadro.js`); il generatore deve produrre solo 301-400.
2. **La regola vive solo nella sua opera**: niente in `src/config/rules.js`, la cui
   impronta segna come «vecchi» i record delle sfide. Partita libera e Sfida del giorno
   restano uguali.
3. **Il giocatore artificiale deve saperla giocare**: e' lui che tara i livelli
   (`src/sim/giocatore-quadri.mjs`).
4. **Nessuna tensione nuova**: niente tempo, niente vite. L'aiuto lo promette («Nessuna
   difficoltà nascosta») e la regola dei livelli lo dice: si perde solo finendo le mosse o
   restando senza mosse.
5. **Una frase sola, e un nome che non si scontra** con parole del gioco (righe, colonne,
   quadranti, pilastri, roccia, arco, massi, mattoni...). `tests/lessico.test.js` lo
   controlla.
6. **Salvataggio, ripresa, caccia ai difetti e gate** per ogni dato nuovo della partita.

---

## 3. Le idee

### 3.1 Il pavimento (nuova)

**Regola:** «Sotto alcune caselle c'è una piastrella da posare: la posi chiudendo una
riga, una colonna o un quadrante che passa sopra quella casella.»

**Come si vede:** le caselle da pavimentare hanno il disegno della piastrella, in
trasparenza, sotto quello che c'e' sopra; quando il gruppo si chiude la piastrella si
accende e resta. Un contatore dice quante ne mancano.

**Esempi di obiettivi:** «Posa 12 piastrelle», «Posa tutto il pavimento» (livelli con
pochi riquadri da coprire), più gli obiettivi che esistono gia'.

**Cosa cambia nel codice (stima, da verificare):**
- motore: un **secondo strato** della griglia, accanto alle caselle, che dice dove c'e'
  una piastrella da posare e dove e' gia' posata. La chiusura dei gruppi lo aggiorna.
  E' il punto piu' delicato: oggi la griglia e' un solo elenco di valori (`src/core/grid.js`),
  quindi lo strato nuovo va salvato, ripreso e controllato a parte;
- un contatore nuovo e l'obiettivo «Posa N piastrelle»;
- giocatore artificiale: deve preferire i gruppi che passano sulle piastrelle;
- interfaccia: il disegno della piastrella sotto i blocchi.

**Casi limite da decidere:**
1. **Bombe**: l'esplosione posa le piastrelle sotto le caselle che fa sparire? (Proposta:
   sì, come un gruppo chiuso.)
2. **Piccone**: no, come oggi non conta per «Elimina N caselle».
3. **Intreccio**: una piastrella all'incrocio si posa una volta sola.
4. **Pezzo posato sopra una piastrella gia' posata**: non succede niente, resta posata.

**Pro:** si spiega in una frase e si vede a colpo d'occhio; e' un obiettivo, non una
minaccia, quindi non aggiunge tensione; nel tema del cantiere e' naturale (si pavimenta una
piazza). Rispetto a massi e mattoni porta un'idea diversa: non *dove* sono i blocchi ma
*dove* chiudi i gruppi.

**Contro:** e' la prima regola che ha bisogno di un secondo strato della griglia, quindi
tocca salvataggio e ripresa piu' di massi e mattoni. Va disegnata bene: la piastrella deve
vedersi anche sotto un blocco colorato.

**Impatto stimato: medio.**

### 3.2 Il montacarichi (dal documento della Torre, sezione 3.3)

**Regola:** «Ogni N mosse la griglia sale di una riga.»

**Pro:** la piu' spettacolare. **Contro:** la piu' rischiosa; aggiunge una pressione che
il gioco ha scelto di non avere (vincolo 4), e tocca quasi tutto: Catena, anteprima dei
pezzi, «Rimetti a posto il pezzo», partita bloccata.

**Impatto stimato: alto.** Sconsigliata, per il vincolo 4.

### 3.3 La malta (dal documento della Torre, sezione 3.4)

**Regola:** «Un pezzo che resta sulla griglia per 5 mosse fa presa: da lì va eliminato
due volte.»

**Pro:** premia chi gioca pulito. **Contro:** difficile da dire in una frase e da vedere;
somma la complessita' dei mattoni a un contatore per ogni casella; e' anche lei una forma
di pressione.

**Impatto stimato: alto.**

### 3.4 Nessuna regola nuova: massi e mattoni insieme

**Regola:** nessuna. La novita' sono le griglie che mescolano massi (Torre) e mattoni
(Arena), che finora non sono mai stati insieme.

**Pro:** la piu' veloce e la meno rischiosa: il motore e il giocatore artificiale sanno
gia' tutto; rende realistico il ritmo di un'opera ogni 1-2 mesi (lo diceva gia' il
documento della Torre).
**Contro:** per chi gioca e' «piu' difficile», non «nuovo»: e' l'opzione che si racconta
peggio sullo store e sui social.

**Impatto stimato: basso.**

---

## 4. Confronto

| | Pavimento | Montacarichi | Malta | Massi + mattoni |
|---|---|---|---|---|
| Si spiega in una frase | Sì | Sì | A fatica | Non serve |
| Si vede a colpo d'occhio | Sì, se disegnato bene | Sì | Meno | Sì |
| Aggiunge tensione | No | Sì | Un po' | No |
| Modifiche al motore | Medie (secondo strato) | Molte | Molte | Quasi nessuna |
| Rischio per la taratura | Medio | Alto | Alto | Basso |
| Novità da raccontare | Alta | Alta | Media | Bassa |

## 5. Raccomandazione (opinione, da confermare)

**Il pavimento**, con **La Piazza** come opera: e' l'unica regola nuova che non aggiunge
pressione e che si spiega da sola, e cambia il modo di pensare la mossa (dove chiudere,
non solo quanto). Negli ultimi atti si potrebbero aggiungere massi o mattoni gia'
conosciuti, per un finale piu' ricco senza un'altra regola.

Se invece conta di piu' il ritmo delle uscite, **massi e mattoni insieme** (3.4) e' la
strada piu' corta, e il pavimento puo' diventare la regola della quinta opera.

Altri nomi possibili per l'opera, se non si sceglie il pavimento: Il Faro, L'Acquedotto,
La Cattedrale. (Controllati contro le parole del gioco: nessuno si scontra con i nomi
degli atti o delle opere esistenti.)

## 6. Dopo la scelta

1. Decidere i casi limite (sezione 3).
2. Regola nel motore con le prove automatiche, fuori da `rules.js`.
3. Insegnarla al giocatore artificiale.
4. Generatore per i livelli 301-400, lasciando identiche le opere precedenti.
5. Sette atti: nomi, griglie, curva di difficolta'.
6. Interfaccia: quarta scheda nella mappa, la festa dell'Arena che apre la nuova opera,
   festa finale spostata, guida, aiuto e regole in italiano e inglese.
7. Gate completo, poi pubblicazione dopo l'Arena.
