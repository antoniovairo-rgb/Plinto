# Rapporto D1–D3 (dopo la 1.21.8)

I tre difetti vengono dal collaudo della 1.21.8 (`collaudo/RAPPORTO-1.21.8.md` sul ramo `collaudo-1.21.8`). Per tutti e tre si è applicata l'opzione (a), già decisa.

- Ramo: `sviluppo/d1-d3-1.21.9`, partito da `main` @ `a14a25b`.
- Versione, CHANGELOG e ROADMAP: non toccati.
- Pubblicazione: nessuna.
- I file dell'altra figlia (`useQuadro.js`, `App.jsx`, `Home.jsx`, i18n) non sono stati toccati.

## In breve

| Difetto | Correzione | Interruttore (`src/persistence/salvataggio.js`) | Unitari: spento → acceso | Browser (dev e build di produzione): spento → acceso |
|---|---|---|---|---|
| **D1** | Unendo, il record della Sfida non scende sotto il massimo dell'archivio | `RECORD_SFIDA_DALL_ARCHIVIO` (riga 45) | 2 rossi → verdi | 2 errori → 0 |
| **D2** | «Sostituisci tutto» toglie i `DOCUMENTI` locali che il file non contiene | `SOSTITUISCI_TOGLIE_ASSENTI` (riga 55) | 1 rosso → verde | 3 errori → 0 |
| **D3** | Record, statistiche e sfide guasti si ripuliscono quando si leggono | `LETTURA_RIPULITA` (riga 63) | 1 rosso → verde | 1 errore → 0 |

C'è anche un difetto nuovo, **D4**, che **non è stato corretto**: vedi «Opzioni».

## Misure prima della correzione (`main` @ `a14a25b`)

Il test nuovo `tests/correzioni-d1-d3.test.js` è stato scritto prima delle correzioni e fatto girare sul codice di `main`:

```
× D1 … senza documento locale, il record resta al massimo dell archivio (900), non al file (100)
  AssertionError: expected 100 to be 900
× D1 … un archivio importato piu alto del record rialza il record
  AssertionError: expected { best: 200, bestChain: 3, … } to match object { best: 900, bestChain: 3 }
× D2 … toglie i documenti locali che il file non contiene, e lascia il resto
  AssertionError: expected { versione: 1, best: 5000 } to be null
× D3 … record, statistiche e sfide si leggono senza valori che non sono numeri
  AssertionError: expected { best: 'x', bestChain: 4, … } to match object { best: +0, … }
Tests  4 failed | 2 passed (6)
```

Nel browser si vedono gli stessi difetti: è l'output di `tests/e2e/correzioni.mjs` con ciascun interruttore spento, cioè con il comportamento di `main` (sezione successiva):

- **D1**: `records-sfida dopo Unisci: {"best":100,…}` e Statistiche «Record della Sfida del giorno: 100», mentre prima di unire l'archivio aveva 900.
- **D2**: dopo «Sostituisci tutto» restano `records-sfida` (best 5000), `sfide` (10 e 11 ottobre) e `statistiche` (4 partite).
- **D3**: Statistiche mostra «Record della Partita libera NaN» e «Punteggio medio NaN».

Le misure coincidono con quelle del collaudo (`collaudo/uscite/dati.txt`, `azzera-guasti.txt`).

## Le correzioni

### D1: il record della Sfida unendo

In `applicaSalvataggio`, quando il documento `records-sfida` non esiste e l'archivio ha un massimo maggiore di 0, il valore locale da fondere non è più `null` ma `loadRecords('sfida')`, cioè il massimo dell'archivio.

Dopo il ciclo, se il documento `records-sfida` esiste e il suo `best` è minore del massimo dell'archivio (già fuso), il `best` viene alzato a quel massimo. Questo succede in tutte e due le modalità.

Per farlo, `recordSfidaIniziale` (`records.js:42`) è ora esportata.

**Una deviazione dalla lettera della decisione.** `loadRecords('sfida')` si usa solo se il documento manca **e** l'archivio ha un massimo maggiore di 0. Usarlo sempre rompeva `tests/record-separati.test.js` («un record della Sfida rovinato a mano si ripulisce come gli altri»): il documento risultante avrebbe avuto `best: 0, bestMove: 0…` dove prima quei campi mancavano. Il valore letto è identico, cambia solo la forma del documento salvato. Con il documento già presente, la fusione resta quella di prima.

### D2: «Sostituisci tutto»

In modalità sostituisci, ogni documento di `DOCUMENTI` per cui il file non porta niente di utilizzabile viene tolto con `remove()`. «Niente di utilizzabile» vuol dire che `ripulisci` restituisce null: il documento manca dal file, oppure è tutto guasto. Fanno eccezione le impostazioni (`SOLO_SE_SOSTITUISCI`).

Il valore restituito da `applicaSalvataggio` ha ora anche `rimossi`. L'unico chiamante, `Salvataggio.jsx:83`, non lo usa.

**Che cosa contiene `DOCUMENTI`** (`salvataggio.js:86`):

| Chiave | Contenuto |
|---|---|
| `quadri` | livelli superati |
| `attrezzi` | gettoni |
| `records` | record della Partita libera, da `chiaveRecord()` |
| `records-sfida` | record della Sfida |
| `statistiche` | statistiche |
| `profilo` | profilo di gioco |
| `sfide` | archivio delle sfide |
| `settings` | impostazioni |

- **Si possono togliere**: le prime sette.
- **Non si toccano**:
  - `settings`;
  - tutte le chiavi che non sono in `DOCUMENTI`: `partita`, `partita-sfida`, `partita-quadro`, `ripresa`, `origine`, `recensione` e le altre di `KEYS` (`storage.js:82`).

Il test unitario lo verifica per `settings`, `partita` e `origine`.

### D3: dati guasti in lettura

- `loadRecords` e `loadStats` (`records.js`, funzione `ripulito` alla riga 66): ogni campo dei valori predefiniti che non passa `numeroBuono` (`salvataggio.js:257`, ora esportata) torna al suo valore iniziale. I campi sconosciuti restano.
- `caricaSfide` (`sfide.js:69`): una voce senza `best` e `partite` che passano `numeroBuono` non viene letta. È lo stesso criterio di C2 all'importazione.
  - Il dato guasto resta in localStorage finché `registraSfida` non riscrive l'archivio. A quel punto la voce guasta sparisce per sempre, come succede già importando.
- **Il nome del giorno non si controlla in lettura.** L'avevo provato con `giornoValido`, ma rompeva `tests/sfide.test.js` («NIENTE viene potato»), che scrive 80 giorni con date finte come `2026-01-32`. Un giorno con un nome guasto già in localStorage può quindi ancora mostrare «Invalid Date». Il collaudo non ha misurato quel caso.

## Prova rosso/verde

### Test unitari: `npx vitest run tests/correzioni-d1-d3.test.js`

| Interruttore spento | Esito |
|---|---|
| `RECORD_SFIDA_DALL_ARCHIVIO` | `2 failed \| 4 passed` (i due test D1) |
| `SOSTITUISCI_TOGLIE_ASSENTI` | `1 failed \| 5 passed` (D2) |
| `LETTURA_RIPULITA` | `1 failed \| 5 passed` (D3) |
| nessuno (tutti accesi) | `6 passed` |

### Browser: `tests/e2e/correzioni.mjs`, scenari nuovi D1, D2 e D3

Per ogni combinazione di interruttori:

1. `npm run build`;
2. `npx vite preview --port 4173`, poi `PLINTO_E2E_URL=http://127.0.0.1:4173/ node tests/e2e/correzioni.mjs`;
3. lo stesso script anche sul server di sviluppo.

| Interruttore spento | Produzione (4173) | Sviluppo (5173) |
|---|---|---|
| nessuno | exit 0, «Tutto a posto» | exit 0 |
| `RECORD_SFIDA_DALL_ARCHIVIO` | exit 1: `D1: dopo Unisci records-sfida.best = 100, atteso 900`; `D1: Statistiche mostra il record della Sfida «100», atteso 900` | exit 1, stessi 2 |
| `SOSTITUISCI_TOGLIE_ASSENTI` | exit 1: restano `records-sfida`, `sfide`, `statistiche` (3 problemi) | exit 1, stessi 3 |
| `LETTURA_RIPULITA` | exit 1: `D3: in Statistiche compare «NaN»` | exit 1, stesso |

Con tutti gli interruttori accesi, in produzione:

- **D1**: `records-sfida dopo Unisci: {"best":900,…}` e Statistiche «900».
- **D2**: `dopo Sostituisci: {"r":50,"settings":true}`.
- **D3**: Statistiche «Record della Partita libera 0 … Punteggio medio 0 … Catena record 2», con il giorno buono «210 (3)».

Ogni scenario ha un controllo che garantisce che la prova provi qualcosa:

- D1 controlla che il record valga 900, non solo che manchi un errore;
- D2 controlla che il record del file arrivi (50) e che le impostazioni restino;
- D3 controlla che la voce buona compaia ancora.

## Controlli finali (tutti gli interruttori accesi)

| Comando | Esito |
|---|---|
| `npm test` | exit 0: 43 file, 637 test passati |
| `npm run build` | exit 0 |
| `npm run correzioni` | exit 0: «Tutto a posto: le correzioni del collaudo tengono.» |
| `npm run e2e-salvataggio` | exit 0: «Nessun problema rilevato.» |

`npm run verifica` non è stato lanciato, come richiesto.

## File toccati

| File | Modifica |
|---|---|
| `src/persistence/salvataggio.js` | tre interruttori; `numeroBuono` esportata; `applicaSalvataggio` (D1, D2); import di `records.js` |
| `src/persistence/records.js` | `recordSfidaIniziale` esportata; `ripulito` in `loadRecords` e `loadStats` (D3) |
| `src/persistence/sfide.js` | filtro delle voci guaste in `caricaSfide` (D3) |
| `tests/correzioni-d1-d3.test.js` | nuovo: 6 test |
| `tests/e2e/correzioni.mjs` | scenari D1, D2, D3 e intestazione |
| `docs/sviluppo/RAPPORTO-D1-D3.md` | questo rapporto |

Ora `salvataggio.js` importa `records.js`, che importa `sfide.js`, che importa `salvataggio.js`: le importazioni formano un ciclo. Funziona perché i valori incrociati si usano solo quando le funzioni vengono chiamate, mai mentre i moduli si caricano. Lo provano la build e tutti i test verdi.

## Opzioni da decidere

1. **D4 (nuovo, non corretto): il punteggio medio in Statistiche è sbagliato con molte partite.**
   - Dove: `Statistiche.jsx:30`, `Math.round(stats.punteggioTotale / numero(stats.partite))`. `numero()` restituisce una stringa formattata.
   - Misura in Node 22: `Number(1000).toLocaleString('en')` = `"1,000"`, e la media viene **NaN**. In italiano `10000` diventa `"10.000"`, che come numero vale 10: la media viene **1000 volte troppo alta** (5 000 000 invece di 5000).
   - Opzioni:
     - (a) **consigliata**: dividere per `stats.partite`, il numero, con un interruttore e una prova;
     - (b) lasciarlo: serve almeno 1000 partite in inglese o 10 000 in italiano;
     - (c) togliere la riga del punteggio medio.
2. **D2: un documento che nel file c'è ma è tutto guasto.** Oggi, sostituendo, viene tolto anche quello locale, perché per il gioco «nel file non c'è niente di buono». Esempio: `attrezzi: {disponibili:'x'}`.
   - Opzioni:
     - (a) **consigliata**: tenere così, coerente con la promessa «resta solo quello che c'è nel salvataggio»;
     - (b) togliere solo i documenti assenti dal file e lasciare quelli locali quando la voce del file è guasta.
3. **D3: giorni con un nome guasto già in localStorage** (per esempio `pippo`).
   - Opzioni:
     - (a) **consigliata**: lasciare così (caso non misurato, e C2 lo impedisce già all'importazione);
     - (b) filtrare anche con `giornoValido` in lettura e aggiornare `tests/sfide.test.js` con date vere.
4. **D1 in modalità sostituisci.** Il rialzo al massimo dell'archivio vale anche lì: un file con `records-sfida` 100 e un archivio con 900 dà 900.
   - Opzioni:
     - (a) **consigliata**: tenere così (regola B7 sempre valida);
     - (b) limitare il rialzo a «Unisci».

## Non verificato

- **D4**: misurato in Node (ICU di Node 22), non nel browser. Che Chromium o i telefoni reali diano la stessa stringa: **non posso confermarlo**. Il collaudo 1.21.7 riporta che il Chromium della CI e quello locale formattano «4321» in modo diverso.
- Solo Chromium su Linux. Nessun telefono reale, nessun Safari, nessun Firefox, e il pacchetto Android non è stato provato.
- L'importazione nel browser è stata provata solo incollando il testo («Oppure incolla»), non con il campo file.
- `npm run verifica` (il gate da 30 controlli) non è stato eseguito: il verdetto che conta resta quello della CI (`CLAUDE.md`).
- Quanti giocatori reali abbiano dati guasti in localStorage (D3) o un archivio senza `records-sfida` (D1): **non posso confermarlo**.
- L'aiuto (`ComeSiGioca.jsx`) non è stato riaperto: nessuna delle tre correzioni cambia una meccanica o un numero citato. Il testo della conferma di «Sostituisci tutto» (`it.js:393`) ora corrisponde al comportamento e non è stato modificato.

## Commit

- `24c070c`: D1-D3 (record Sfida unendo, Sostituisci tutto, dati guasti in lettura), più i test unitari
- `6d6e88e`: prove nel browser in `correzioni.mjs`
- il commit di questo rapporto è indicato nella consegna
