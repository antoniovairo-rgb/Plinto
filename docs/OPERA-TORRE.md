# La Torre — documento di progetto

Stato: **bozza da decidere**. Branch: `opera-torre`. Nessuna riga di codice è ancora cambiata.

La Torre è l'opera che viene dopo il Ponte. Il gioco la promette già: chi finisce i cento
livelli vede «E adesso? La Torre — In lavorazione» (`src/ui/schermate/Trionfo.jsx`).

---

## 1. Decisioni già prese (3 ottobre 2026)

| Domanda | Scelta |
|---|---|
| Quanti livelli | **100**, come il Ponte: livelli dal 101 al 200 |
| Che cosa porta di nuovo | **Una meccanica nuova** (quale: da decidere, vedi sezione 3) |
| Chi può giocarla | **Solo chi ha superato tutto il Ponte**, cioè tutti i livelli da 1 a 100 con la spunta |
| Ritmo delle uscite | Desiderio: un set di livelli ogni 1–2 mesi |

Nota sul ritmo: 100 livelli **più** una meccanica nuova sono il lavoro più grosso fra le
opzioni possibili. La prima uscita, quella che introduce la meccanica, richiederà
probabilmente più di un mese; quanto di più non si può stimare onestamente finché non si
vede quante tarature servono. Le opere successive, se riusano meccaniche esistenti,
rendono il ritmo di 1–2 mesi più realistico.

---

## 2. Vincoli che valgono per qualunque meccanica

Questi punti vengono dal codice di oggi, non da ipotesi.

1. **Il Ponte non si tocca.** Il seme di ogni livello dipende solo dal suo numero
   (`semeDelQuadro` in `src/core/quadro.js`) e i record sono salvati per numero.
   Rigenerare il Ponte cambierebbe livelli che le persone hanno già giocato.
2. **I livelli 101–200 non chiedono migrazioni.** I progressi sono già salvati per
   numero di livello: lo dice il commento su `OPERE` in `src/config/quadri.js`, che è
   già al plurale proprio per questo.
3. **Il generatore va esteso.** Oggi `tools/genera-quadri.mjs` ha `TOTALE = 100` e
   riscrive tutto `src/config/quadri.js`. Deve poter generare **solo** la Torre lasciando
   il Ponte identico, riga per riga.
4. **Il giocatore artificiale deve capire la meccanica.** È lui che tara i bersagli e
   garantisce che ogni livello sia superabile (`src/sim/giocatore-quadri.mjs`). Una
   meccanica che lui non sa giocare produce livelli tarati male.
5. **La meccanica vive solo nella Torre.** Non entra nella partita libera né nella Sfida
   del giorno. E le sue costanti **non** vanno in `src/config/rules.js`: l'impronta delle
   regole (`src/core/impronta.js`) è calcolata da ogni costante numerica di quel file, e
   se cambia il gioco marca tutti i record delle sfide passate come «Ottenuto con una
   versione precedente del gioco» e nasconde il confronto con il giocatore artificiale
   nel profilo. Con un file di configurazione separato per la Torre, niente di questo
   succede.
6. **Interfaccia a più opere.** Oggi mappa, trionfo e scheda condivisa conoscono una sola
   opera (`OPERE[0]`, `TOTALE_QUADRI` = 100 in `Quadri.jsx` e `Trionfo.jsx`). Servono:
   la mappa con due opere, la festa del Ponte che diventa il passaggio alla Torre, e la
   festa finale spostata alla fine della Torre.
7. **Un errore di grammatica da correggere comunque.** Il titolo del trionfo è
   «{opera} è finito»: con la Torre diventerebbe «La Torre è finito».
8. **Testi chiari.** La meccanica entra nella guida e nell'aiuto, con un nome solo, che
   non si scontri con parole già usate (per esempio «pilastri» è già il nome di un atto,
   «colonna» è già una parte della griglia). `tests/lessico.test.js` va aggiornato.
9. **Salvataggi e prove.** Se la meccanica aggiunge un tipo di casella, va gestita nel
   salvataggio della partita, nella ripresa, nella caccia ai difetti
   (`tools/caccia-bug.mjs`) e nel gate di verifica.

---

## 3. Le quattro idee

Per ognuna: la regola in una frase, come si vede, esempi di obiettivi, cosa cambia nel
codice, come si comporta con le meccaniche che esistono già, pro, contro.

### 3.1 I massi

**Regola:** «Un masso conta come pieno, ma non sparisce mai.»

**Come si vede:** caselle grigie, scolpite, già sulla griglia all'inizio del livello. Non
ci si può appoggiare sopra.

**Esempi di obiettivi:** «Chiudi 5 righe che passano su un masso», «Chiudi 3 quadranti
con un masso dentro», più tutti gli obiettivi che esistono già.

**Cosa cambia nel codice:**
- motore: un nuovo valore di casella. `findCompletedGroups` lo conta come pieno,
  `clearGroups` non lo svuota;
- generatore: mette i massi in posizioni che lasciano il livello superabile;
- giocatore artificiale: quasi niente da imparare, perché per lui un masso è una casella
  occupata che però aiuta a chiudere;
- interfaccia: un disegno nuovo per la casella.

**Con le meccaniche esistenti — da decidere:**
- bombe: un'esplosione porta via un masso? (proposta: no, i massi resistono);
- piccone: può togliere un masso? (proposta: no, altrimenti la meccanica si annulla);
- Tinta: un masso non ha colore; conta come casella del colore giusto o no?
  (proposta: non conta, così la Tinta resta più difficile vicino ai massi).

**Pro:** è la più facile da spiegare e da vedere; cambia poco il motore; si presta a una
crescita graduale (pochi massi nei primi atti, molti negli ultimi); ha un senso preciso
nel tema: la struttura che regge la torre.

**Contro:** è vicina alle griglie già occupate degli atti «La roccia» del Ponte. La
differenza (il masso non sparisce mai) va mostrata bene, o sembrerà la stessa cosa.

**Impatto stimato: medio-basso.**

### 3.2 I mattoni rinforzati

**Regola:** «Un mattone rinforzato va eliminato due volte.»

**Come si vede:** caselle già sulla griglia, con un segno di rinforzo. Alla prima
eliminazione si incrinano; alla seconda spariscono.

**Esempi di obiettivi:** «Demolisci 6 mattoni rinforzati», «Svuota la griglia» (che con i
mattoni diventa molto più dura).

**Cosa cambia nel codice:**
- motore: due stati nuovi della casella (intera, incrinata) e un nuovo contatore nelle
  statistiche della partita;
- obiettivi: un tipo nuovo, «demolisci»;
- giocatore artificiale: deve capire che chiudere un gruppo su un mattone intero non
  libera spazio, e quindi pianificare due passaggi;
- interfaccia: due disegni e un'animazione per l'incrinatura.

**Con le meccaniche esistenti — da decidere:**
- una casella all'incrocio fra una riga e una colonna chiuse con la stessa mossa
  (Intreccio): conta come una eliminazione o due? (proposta: una, è una mossa sola);
- bombe: un'esplosione conta come un'eliminazione;
- piccone: incrina o toglie del tutto?

**Pro:** introduce un'idea nuova di pianificazione (tornare due volte sullo stesso
punto); si legge bene; offre un obiettivo nuovo e chiaro.

**Contro:** ci sono più casi limite da decidere (Intreccio, bombe, piccone). La taratura
è più delicata, perché lo stesso livello può bloccarsi del tutto se i mattoni stanno
nei punti sbagliati.

**Impatto stimato: medio.**

### 3.3 Il montacarichi

**Regola:** «Ogni N mosse la griglia sale di una riga.»

**Come si vede:** dopo un certo numero di mosse tutta la griglia scorre in su: la riga in
alto esce e in basso ne entra una nuova, già in parte occupata. Un indicatore mostra fra
quante mosse arriva la prossima salita.

**Esempi di obiettivi:** «Resisti 30 mosse mentre la torre sale», «Chiudi 8 righe prima
della quinta salita».

**Cosa cambia nel codice:**
- motore: un evento nuovo dentro la partita, che sposta tutte le caselle e ne aggiunge;
- anteprima dei prossimi pezzi: va ripensata, perché la griglia cambia anche senza mosse
  del giocatore;
- «Rimetti a posto il pezzo»: cosa succede se la salita arriva subito dopo la mossa da
  annullare?
- generatore e giocatore artificiale: devono prevedere le righe che entreranno;
- interfaccia: l'animazione della salita e l'indicatore.

**Con le meccaniche esistenti:** tocca quasi tutto: Catena, anteprima, rimetti a posto,
condizione di partita bloccata, obiettivo «Resisti N mosse».

**Pro:** è la più spettacolare e la più legata all'idea di torre che cresce; cambia il
ritmo del gioco in modo evidente.

**Contro:** è la più rischiosa. Cambia il ritmo di tutto il gioco, quindi la difficoltà
va ritarata da capo; aggiunge tensione, che il gioco finora ha scelto di non avere (non
ci sono tempo né vite: lo dice l'aiuto, sezione «Nessuna difficoltà nascosta»). La prima
uscita sarebbe la più lunga.

**Impatto stimato: alto.**

### 3.4 La malta

**Regola:** «Un pezzo che resta sulla griglia per 5 mosse fa presa: da lì va eliminato
due volte.»

**Come si vede:** le caselle si scuriscono man mano che si avvicinano alla presa; quando
fanno presa diventano come mattoni rinforzati (idea 3.2).

**Esempi di obiettivi:** «Chiudi 10 gruppi senza far fare presa a più di 3 caselle».

**Cosa cambia nel codice:**
- motore: ogni casella deve ricordare da quante mosse è sulla griglia (un dato in più per
  ogni casella, da salvare e riprendere);
- tutto quello dell'idea 3.2, più il conteggio dell'età delle caselle;
- giocatore artificiale: deve preferire le mosse che chiudono presto.

**Pro:** premia chi gioca pulito e veloce; nasce dentro la partita, senza griglie
preparate.

**Contro:** è la più difficile da spiegare in una frase sola e da vedere a colpo
d'occhio; include tutta la complessità dell'idea 3.2 e aggiunge un contatore per
casella. Rischia di andare contro la regola dei testi chiarissimi.

**Impatto stimato: alto.**

---

## 4. Confronto

| | Massi | Mattoni rinforzati | Montacarichi | Malta |
|---|---|---|---|---|
| Si spiega in una frase | Sì | Sì | Sì | A fatica |
| Si capisce a colpo d'occhio | Sì | Sì | Sì, con l'indicatore | Meno |
| Modifiche al motore | Poche | Medie | Molte | Molte |
| Casi limite da decidere | 3 | 3–4 | Molti | Molti |
| Rischio per la taratura | Basso | Medio | Alto | Alto |
| Tempo per la prima uscita | Il più breve | Medio | Il più lungo | Lungo |

## 5. Raccomandazione (opinione, da confermare)

**I massi.** Sono la meccanica che si spiega meglio, cambiano meno il motore e quindi
lasciano più tempo ai cento livelli, che sono la parte grossa del lavoro. Si prestano a
una crescita graduale nei sette atti della Torre.

I **mattoni rinforzati** sono un'ottima seconda scelta. Potrebbero essere la meccanica
dell'opera successiva, così ogni opera porta una novità sua.

## 6. Dopo la scelta

1. Decidere i casi limite della meccanica scelta (sezione 3).
2. Scrivere la regola nel motore, con le prove automatiche, senza toccare partita libera
   e Sfida del giorno.
3. Insegnarla al giocatore artificiale.
4. Estendere il generatore per i livelli 101–200, lasciando il Ponte identico.
5. Progettare i sette atti della Torre (nomi, temi, curva di difficoltà).
6. Interfaccia: mappa a due opere, passaggio dal Ponte alla Torre, nuova festa finale,
   guida e aiuto aggiornati.
7. Gate di verifica completo, poi pubblicazione.
