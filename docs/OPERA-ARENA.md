# L'Arena — documento di progetto

Stato: **in sviluppo** (via del proprietario il 4 ottobre 2026). Branch: `opera-arena` (parte da `opera-torre`).

L'Arena e' la terza opera: livelli dal 201 al 300, dopo il Ponte e la Torre.

## 1. Decisioni prese (4 ottobre 2026)

| Domanda | Scelta |
|---|---|
| Che cosa si costruisce | **L'Arena** (un anfiteatro: griglie ad anello) |
| Quanti livelli | 100, dal 201 al 300 |
| Che cosa porta di nuovo | **I mattoni rinforzati** |
| Quando esce | Uno o due mesi dopo la Torre |
| Chi la gioca | Solo chi ha finito tutta la Torre, ogni livello con la spunta |
| Massi nell'Arena | No: solo mattoni rinforzati e blocchi normali |
| Disegno del masso | Diventa una pietra grigia puntinata; la crepa resta al mattone incrinato |
| Nomi degli atti | Il tracciato, Gli ingressi, Le gradinate, I portici, Le volte, Il velario, La tribuna |

## 2. La regola

«Un mattone rinforzato va eliminato due volte.»

Alcune caselle partono come mattoni rinforzati. Contano come piene. La prima volta che
il loro gruppo si chiude le altre caselle spariscono e il mattone **si incrina** ma resta;
la seconda volta sparisce come un blocco qualunque.

Casi decisi:
1. **Intreccio**: un mattone all'incrocio di due gruppi chiusi con la stessa mossa conta
   **una** eliminazione.
2. **Bombe**: un'esplosione conta come un'eliminazione (intatto → incrinato, incrinato →
   sparisce).
3. **Piccone**: vale come un'eliminazione (intatto → incrinato, incrinato → tolto).
4. **Tinta**: il mattone ha un colore e conta per la Tinta.

## 3. Il piano (proposta)

**Motore** (`src/core/grid.js`, fuori da `rules.js` come il masso, per non toccare
l'impronta delle sfide):
- due valori nuovi di casella, «intatto» e «incrinato», ciascuno con il suo colore;
- chiusura dei gruppi: un passo per mossa per ogni mattone toccato, anche se e' in due
  gruppi;
- un contatore nuovo, `mattoniDemoliti` (quelli fatti sparire); l'incrinatura non conta
  fra le caselle eliminate, perche' la casella non sparisce;
- «Svuota la griglia»: finche' resta un mattone, la griglia non e' vuota;
- salvataggio e ripresa della partita, caccia ai difetti, prove automatiche.

**Obiettivo nuovo**: «Demolisci N mattoni».

**Giocatore artificiale**: va istruito. Deve capire che chiudere un gruppo su un mattone
intatto non libera quella casella, e preferire i gruppi con mattoni gia' incrinati.

**Griglie e atti**: griglie ad anello (il centro libero, la cornice occupata), con
mattoni rinforzati e blocchi normali, in crescita. Proposta: **niente massi** nell'Arena,
per non sommare due regole. Sette atti, nomi proposti: Il tracciato, Gli ingressi, Le
gradinate, I portici, Le volte, Il velario, La tribuna. (Evitati i nomi gia' usati o che
si scontrano con parole del gioco: arco, pilastri, colonne, roccia, pietra.)

**Disegno**: il mattone intatto ha il suo colore e due fasce di ferro; l'incrinato ha
una crepa. Il masso della Torre oggi ha una crepa: per non confondere le due cose, il
masso passerebbe a una pietra grigia puntinata. La Torre non e' ancora pubblicata, quindi
si puo' cambiare senza disturbare nessuno.

**Interfaccia**: terza scheda nella mappa; la festa della Torre apre l'Arena (come quella
del Ponte apre la Torre); festa finale alla fine dell'Arena; regola spiegata nella
presentazione dei livelli e nelle regole; testi in italiano e in inglese.

**Verifica**: impronta del Ponte e della Torre bloccate da prove, gate completo, livelli
giocati nel browser.

## 4. Stima

Piu' lavoro della Torre: ci sono piu' casi limite e il giocatore artificiale va cambiato.
Non si puo' stimare onestamente quante tarature serviranno prima di vedere i primi
livelli generati.

## 5. Come e' stata fatta e verificata (4-5 ottobre 2026)

- **Motore**: valori 41-46 (intatto) e 51-56 (incrinato) in `src/core/grid.js`, fuori da
  `rules.js`. Un passo per mossa per mattone. 11 prove in `tests/mattoni.test.js`.
  Trovato e corretto per strada: la Tinta calcolava il colore con una formula sua, che
  ignorava i mattoni; ora usa `coloreDi`.
- **Piccone** (decisione presa in sviluppo, da confermare): incrina o toglie come
  previsto, ma un mattone tolto col piccone NON conta per «Demolisci N mattoni», come le
  caselle tolte col piccone non contano per «Elimina N caselle».
- **Giocatore artificiale**: premia incrinature e demolizioni e cerca i gruppi che
  contengono un mattone. «Demolisci 4» in 25 mosse: da 3 a 12 vittorie su 12.
- **Livelli**: 16 griglie, sette atti, «Demolisci» in ogni atto (23 livelli su 100). Nella
  griglia dei primi livelli che chiedono di demolire due mattoni partono gia' incrinati.
  Curva: 80, 75, 60, 50, 43, 38, 35%; tutti i livelli nella banda del loro atto.
- **Disegno**: muro di mattoncini, scelto fra cinque proposte; crepa bianca quando e'
  incrinato. Il masso della Torre e' diventato una pietra puntinata (12 puntini
  irregolari: con 5 sembrava un dado).
- **Verifica**: prove automatiche 633/633, caccia ai difetti pulita (con griglie di
  mattoni e controlli propri), gate completo 28/28 (la prova della festa ora usa il
  giocatore condiviso), 300 livelli su 300 vinti giocandoli nell'app.
