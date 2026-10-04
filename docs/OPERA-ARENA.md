# L'Arena — documento di progetto

Stato: **progetto, in attesa del via**. Branch: `opera-arena` (parte da `opera-torre`).

L'Arena e' la terza opera: livelli dal 201 al 300, dopo il Ponte e la Torre.

## 1. Decisioni prese (4 ottobre 2026)

| Domanda | Scelta |
|---|---|
| Che cosa si costruisce | **L'Arena** (un anfiteatro: griglie ad anello) |
| Quanti livelli | 100, dal 201 al 300 |
| Che cosa porta di nuovo | **I mattoni rinforzati** |
| Quando esce | Uno o due mesi dopo la Torre |
| Chi la gioca | Proposta: solo chi ha finito tutta la Torre, come la Torre dopo il Ponte |

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
