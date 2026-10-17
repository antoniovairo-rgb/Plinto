# Rapporto B7 — record separati per Partita libera e Sfida del giorno

Ramo: `sviluppo/b7-record-1.21.8`, partito da `main` a `83edf2d`.
Voce PO-004, difetto B7 del collaudo della 1.21.6. Decisione del PO in `docs/DECISIONI.md`:
«Separo i due record»; il record esistente resta alla Partita libera.

## Il difetto, misurato prima di correggere

Prova nuova in `tests/e2e/correzioni.mjs` (blocco «B7»): una Sfida di oggi a una mossa dalla
fine (punteggio 395, la mossa vale 1 punto, totale 396) viene chiusa nel browser; poi si legge
la card «Partita libera» in home. Due casi: (a) archivio vuoto, (b) record di 4321 già salvato.

Prima della correzione (solo il test aggiunto, codice di `main`), `npm run correzioni`:

```
B7. finisco una Sfida del giorno: la Partita libera resta senza record...
   a) card della Partita libera dopo una sola sfida: «Partita libera Record 396»
   b) con un record di 4321 gia' salvato: «Partita libera Record 4.321»
 - B7: dopo una sola Sfida la Partita libera dice «Partita libera Record 396» invece di «Mai giocata»
```

Dopo la correzione:

```
B7. finisco una Sfida del giorno: la Partita libera resta senza record...
   a) card della Partita libera dopo una sola sfida: «Partita libera Mai giocata»
   b) con un record di 4321 gia' salvato: «Partita libera Record 4.321»
```

## La correzione

- `src/persistence/storage.js`: interruttore `RECORD_SEPARATI` in cima al modulo; chiave nuova
  `KEYS.RECORDS_SFIDA = 'records-sfida'`; `chiaveRecord(modalita)` restituisce
  `records-sfida` per la Sfida (se l'interruttore è acceso) e `records` per tutto il resto.
- `src/persistence/records.js`: `loadRecords(modalita)` e `recordGame(summary, modalita)`.
  Le statistiche (`plinto:statistiche`) restano una sola e contano tutte e due le modalità.
- `src/state/usePartita.js`: `record` è quello della modalità in gioco (testata e fine
  partita); `recordLibera` è quello che la home mette accanto a «Partita libera».
- `src/ui/App.jsx`: la home e la testata dei livelli ricevono `recordLibera`; le Statistiche
  ricevono anche `recordSfida`.
- Dove si vede il record della Sfida (seguendo l'interfaccia che c'era):
  - in partita, nella testata «Record» durante una Sfida;
  - in Statistiche, nuova riga «Record della Sfida del giorno» (solo se > 0); la riga che
    prima diceva «Record» ora dice «Record della Partita libera»;
  - la card della Sfida in home e la fine partita della Sfida restano com'erano: mostrano il
    record **di oggi** (dall'archivio `plinto:sfide`), non sono state toccate.
- i18n: `stats.migliore` e `stats.recordSfida` in `it.js` ed `en.js`
  («Free play best score», «Daily challenge best score»).
- `src/persistence/salvataggio.js`, modifica minima (due righe): `KEYS.RECORDS_SFIDA` entra in
  `DOCUMENTI` e nel ramo `soloNumeri` di `ripulisci`.

## Interruttore: prova rosso/verde

Con `RECORD_SEPARATI = false` (`chiaveRecord('sfida')` torna `records`, il record condiviso):

```
$ npm run correzioni
   a) card della Partita libera dopo una sola sfida: «Partita libera Record 396»
 - B7: dopo una sola Sfida la Partita libera dice «Partita libera Record 396» invece di «Mai giocata»

$ npx vitest run tests/record-separati.test.js
   × una Sfida giocata non da' un record alla Partita libera
   × una Partita libera non tocca il record della Sfida
   × il record che c'era resta alla Partita libera, intatto
   × la Sfida parte dal punteggio migliore del suo archivio, senza scrivere niente
   × il salvataggio porta via e rimette anche il record della Sfida
      Tests  5 failed | 3 passed (8)
```

Con `RECORD_SEPARATI = true`: B7 verde in `npm run correzioni`, `Tests 8 passed (8)`.
I tre test che passano anche a interruttore spento (statistiche uniche, `ripulisci`,
azzeramento) controllano cose che devono valere in tutti e due i casi.

## Migrazione dei dati esistenti, provata

- Il record della Partita libera resta nella chiave di sempre, `plinto:records`: **nessuna
  migrazione**, niente viene riscritto. Provato da `tests/record-separati.test.js`
  («il record che c'era resta alla Partita libera, intatto»: il documento resta identico
  byte per byte dopo una Sfida da 5000) e nel browser (caso b: 4321 resta).
- Il record della Sfida, se `plinto:records-sfida` non esiste, si calcola alla lettura dal
  massimo di `best` in `plinto:sfide` e **non si scrive** finché non si chiude una sfida
  (provato: «la Sfida parte dal punteggio migliore del suo archivio, senza scrivere niente»).
- Esportazione/importazione: `records-sfida` viaggia nel file e si ripulisce come `records`
  (provati: andata e ritorno, e un `best: 'abc'` scartato). Un file esportato da una versione
  precedente semplicemente non ha la chiave: la Sfida riparte dall'archivio importato.
- «Azzera i miei dati»: `clearAll()` toglie tutte le chiavi `plinto:`, quindi anche questa
  (provato). La home rilegge `recordLibera` tramite `ricaricaRecord()`.

Effetto da dire nel changelog (lo scrive la madre): il record della Partita libera di chi ha
già giocato **resta com'è, compresi i punteggi fatti in passato nelle Sfide**, perché i due
erano mescolati e non si possono separare all'indietro. È la decisione del PO.

## Opzioni per il record iniziale della Sfida

1. **Massimo dell'archivio delle sfide** (`plinto:sfide`, `best` per giorno) — **consigliata e
   applicata.** Chi ha già giocato sfide non vede sparire un numero che ha guadagnato. Limite:
   l'archivio ha solo il punteggio, quindi catena, mossa e Intreccio della Sfida partono da 0.
   Reversibile: non scrive niente finché non si chiude una sfida, e con l'interruttore spento la
   chiave nuova viene ignorata.
2. **Vuoto (0).** Più semplice; ma chi ha già giocato sfide vede «Record» della Sfida sparire
   e ripartire, anche se l'archivio dice che ha fatto di più.
3. **Copia del record condiviso attuale.** Sconsigliata: rimetterebbe nella Sfida i punteggi
   della Partita libera, cioè lo stesso difetto al contrario.

Altre due scelte aperte, per il PO:
- Le righe «Catena record», «Mossa record», «Intreccio record» delle Statistiche ora sono della
  sola Partita libera, ma l'etichetta non lo dice. Opzioni: (a) lasciarle (applicata, minimo
  cambio); (b) aggiungere «della Partita libera»; (c) mostrarle anche per la Sfida.
- In «Azzera i miei dati» la voce «Record» elenca il record della Partita libera (com'era). Il
  record della Sfida sparisce comunque; non è elencato a parte.

## File toccati

```
src/persistence/storage.js      interruttore, chiave nuova, chiaveRecord(modalita)
src/persistence/records.js      record per modalita', partenza dall'archivio
src/persistence/salvataggio.js  2 righe (DOCUMENTI, ripulisci)
src/state/usePartita.js         record della modalita' + recordLibera
src/ui/App.jsx                  home e livelli con recordLibera, Statistiche con recordSfida
src/ui/schermate/Statistiche.jsx riga «Record della Sfida del giorno»
src/i18n/it.js, src/i18n/en.js  stats.migliore, stats.recordSfida
tests/e2e/correzioni.mjs        prova B7 nel browser
tests/record-separati.test.js   8 test unitari
docs/sviluppo/RAPPORTO-B7.md    questo rapporto
```

## Comandi eseguiti

- `npm test`: `Test Files 42 passed (42)`, `Tests 621 passed (621)`.
- `npm run build`: ok (`dist/assets/index-D8c3TOj0.js 358.30 kB`).
- `npm run comunicazioni`: «Tutte le comunicazioni sono leggibili in entrambe le lingue.»
- `npm run e2e-salvataggio`: «Nessun problema rilevato.»
- `npm run e2e` (partita, home, sfida): «Nessun problema rilevato.»
- `npm run correzioni`: B1–B8 verdi, **B10 rosso**: «con il bersaglio piu grande la home scorre
  di 2 px a 360x640». È rosso **anche su `main` 83edf2d intatto** in questo container (provato
  in un worktree separato): non dipende da questa modifica. Non posso confermare se in CI sia
  verde; il commit `afc52a1` documenta differenze fra il Chromium locale e quello della CI.
- `npm run verifica` **non** eseguito, come da istruzioni.

## Non verificato

- Il gate completo e la CI: non eseguiti.
- B10 nella CI (vedi sopra): non posso confermarlo.
- Il comportamento su un telefono vero e nella TWA: provato solo con Chromium in Playwright.
- `tests/aiuto-aggiornato.test.js` e `tests/lessico.test.js` passano; non ho cambiato
  l'aiuto (`ComeSiGioca.jsx`) perché non cita il record. Se il PO vuole che l'aiuto dica che i
  record sono due, va aggiunto: non posso confermare che serva.
- Unione con il ramo B6/B11 (che tocca `salvataggio.js`): le mie righe sono due, nella lista
  `DOCUMENTI` e nella condizione di `ripulisci`; un conflitto lì è possibile ma piccolo.

## Commit

- `a985bb6` B7: record separati per Partita libera e Sfida del giorno
- `59f58e8` B7: test unitari dei record separati
- il commit di questo rapporto (hash nel log del ramo)
