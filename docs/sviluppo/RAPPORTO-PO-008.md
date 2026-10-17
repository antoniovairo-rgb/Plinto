# PO-008 — la partita o il livello non ripartono da zero dopo il secondo piano

Richiesta del PO: «fai in modo che quando l'app viene messa in background per qualche
secondo la partita / missione non deve partire da 0!».

Ramo `sviluppo/ripresa-po008`, partito da `rilascio/1.21.8` (`0ed49bd`; `package.json`
dice ancora 1.21.7, non l'ho toccato).

## Casi: misura prima e dopo

Script: `tests/e2e/ripresa-livello.mjs` (`npm run e2e-po008`). In ogni caso il
giocatore entra nel livello 1 (o nella partita libera), fa qualche mossa, viene
interrotto e poi prova a tornare dentro da solo o come farebbe lui: mappa, pulsante
grande della home, «Salta per ora». Si confronta la firma della partita (testo del
punteggio, testo dell'obiettivo, caselle piene) prima e dopo. Se cambia, il livello è
ripartito da zero.

| Caso | Prima, sviluppo | Prima, produzione | Dopo, sviluppo | Dopo, produzione |
|---|---|---|---|---|
| A. Indietro dal livello, poi riapro il livello dalla mappa | **da 0** (salvataggio cancellato) | **da 0** | ripreso | ripreso |
| B. Oltre 2 ore, poi pulsante grande della home | **da 0** (pulsante «LIVELLO 1») | **da 0** | ripreso (pulsante «RIPRENDI IL LIVELLO 1») | ripreso |
| C. Esco mentre leggo l'obiettivo, poi ricarico | **perso**: nessun salvataggio, si apre la home | **perso** | salvato, si torna all'obiettivo | salvato, si torna all'obiettivo |
| D. Secondo piano: `visibilitychange`, `pagehide`, `freeze`, poi CDP `Page.setWebLifecycleState` frozen per 3 s | ripreso | ripreso | ripreso | ripreso |
| E. Ricarica (il sistema butta via la pagina) | rientro automatico | rientro automatico | rientro automatico | rientro automatico |
| F. Nuova navigazione a `?origine=play` | rientro automatico | rientro automatico | rientro automatico | rientro automatico |
| G. `introVista` falso, livello, ricarica | **da 0** (si apre la guida; poi «Livello 1» lo ricomincia) | **da 0** | rientro automatico | rientro automatico |
| H. `introVista` falso, partita libera, ricarica | non perso, ma si apre la guida (poi «Riprendi la partita») | uguale | rientro automatico | rientro automatico |

Il «prima» in produzione è la build di `origin/rilascio/1.21.8` servita da
`vite preview --port 4173`; il «dopo» è la build di questo ramo. Lo sviluppo usa
`vite` sulla 5173, quindi con StrictMode.

Nota sul caso D: il secondo piano da solo non ha mai fatto perdere niente, né prima né
dopo, perché la pagina resta in memoria. Su Android il livello si perdeva quando il
sistema buttava via la pagina (caso E) e il gioco si riapriva da un'altra strada: la
guida (G), la home dopo due ore (B) o la mappa dopo Indietro (A). Questo collegamento
viene dalla lettura del codice. Sul telefono non l'ho verificato.

## Correzioni e interruttori

Ogni interruttore è una costante esportata in cima al modulo. Come per B6 e C1, per
spegnerlo si cambia `true` in `false`.

| Interruttore | File | Cosa fa |
|---|---|---|
| `CONSERVA_ALL_USCITA` | `src/state/useQuadro.js` | `chiudi` (Indietro o «Elenco livelli») non cancella più `plinto:partita-quadro`; cancella solo il posto (`plinto:ripresa`), così al prossimo avvio si vede il menu e non si rientra da soli. |
| `SALVA_IN_PRESENTAZIONE` | `src/state/useQuadro.js` | Il livello si salva dal primo istante, anche durante la presentazione dell'obiettivo, insieme a `presentazione: true`. La ripresa riporta a quella schermata e non dentro la partita, così l'obiettivo non viene saltato. |
| `RIPRENDI_LIVELLO_A_MANO` | `src/ui/App.jsx` | Riaprire dalla mappa lo stesso livello salvato lo riprende invece di ricominciarlo. Il pulsante grande della home diventa «Riprendi il livello N» e lo riprende. |
| `RIPRESA_SENZA_GUIDA` | `src/ui/App.jsx` | La ripresa automatica (entro 2 ore) avviene anche con `introVista` falso. Vale come «Salta per ora» per quella sessione: la guida torna al prossimo avvio senza partita in corso. |

Il livello salvato si perde solo se il giocatore:
- lo finisce, vincendo o perdendo (come prima, `useQuadro.js`, effetto su `esito`);
- sceglie «Riprova»;
- apre un livello diverso: il salvataggio dei livelli è uno solo.

Anche l'azzeramento dei dati lo cancella.

### Prova rosso/verde (`npm run e2e-po008`)

Sviluppo (5173) e produzione (build, poi `vite preview --port 4173`, poi
`PLINTO_E2E_URL=http://127.0.0.1:4173/`). Gli esiti sono identici nei due ambienti:

| Configurazione | Uscita | Problemi segnalati |
|---|---|---|
| tutti accesi | 0 «Tutto a posto» | nessuno |
| `CONSERVA_ALL_USCITA` spento | 1 | A: si riparte da zero |
| `SALVA_IN_PRESENTAZIONE` spento | 1 | C: non salvato durante la presentazione; dopo la ricarica si apre la home |
| `RIPRENDI_LIVELLO_A_MANO` spento | 1 | A e B: si riparte da zero (pulsante «LIVELLO 1») |
| `RIPRESA_SENZA_GUIDA` spento | 1 | G e H: si apre la guida invece di rientrare |

Lo script è registrato nel gate (`tools/verifica-tutto.mjs`, accanto a `e2e-ripresa`)
e in `package.json` come `e2e-po008`.

## Controlli eseguiti (codice finale, interruttori accesi)

| Comando | Esito |
|---|---|
| `npm test` | 42 file, 630 test passati |
| `npm run build` | ok |
| `npm run correzioni` | exit 0 in sviluppo e in produzione (B6 compreso) |
| `npm run indietro` | exit 0 in sviluppo e in produzione |
| `npm run e2e-ripresa` | exit 0 in sviluppo e in produzione (caso 4 aggiornato, vedi sotto) |
| `npm run e2e-po008` | exit 0 in sviluppo e in produzione |
| `npm run e2e-quadri` | **exit 1** in sviluppo: «FINE LIVELLO (vittoria): a 320x700 bisogna scorrere di 2 px» e «a 1366x768 … 6 px». **Esistono già senza questa modifica**: con le mie modifiche messe da parte (`git stash`) lo stesso script dà gli stessi due problemi con gli stessi px. Riguardano l'impaginazione della schermata di vittoria, che non ho toccato. Non posso confermare se compaiano anche nella CI: potrebbero dipendere dai font di questo container. |

`npm run verifica` completo non l'ho lanciato: lo fa la madre.

### Due controlli esistenti cambiati, e perché

- `tests/e2e/ripresa.mjs`, caso 4: prima pretendeva che uscendo dal livello sparissero
  sia il posto sia il salvataggio. Adesso pretende che sparisca il posto (dopo la
  ricarica si vede la home, controllo invariato) e che il salvataggio **resti**. È
  proprio il comportamento chiesto da PO-008.
- `tests/e2e/quadri.mjs`, passo 0b: apriva la presentazione del livello 1 dalla home e
  poi ricaricava aspettandosi la home. Con `SALVA_IN_PRESENTAZIONE` la ricarica riporta,
  giustamente, alla presentazione. Adesso esce con il pulsante «Elenco livelli» della
  presentazione prima di ricaricare.

## File toccati

```
src/state/useQuadro.js        interruttori CONSERVA_ALL_USCITA, SALVA_IN_PRESENTAZIONE; numeroSalvato()
src/ui/App.jsx                interruttori RIPRENDI_LIVELLO_A_MANO, RIPRESA_SENZA_GUIDA; apriQuadro,
                              livelloInSospeso, giocaLivelloCorrente, effetto di ripresa
src/ui/schermate/Home.jsx     prop livelloInSospeso: testo del pulsante grande
src/i18n/it.js, src/i18n/en.js  quadri.riprendiLivello
tests/e2e/ripresa-livello.mjs nuovo: misura e controllo PO-008
tests/e2e/ripresa.mjs         caso 4 aggiornato
tests/e2e/quadri.mjs          passo 0b aggiornato
tools/verifica-tutto.mjs      registrato e2e-po008
package.json                  script e2e-po008 (versione non toccata)
docs/sviluppo/RAPPORTO-PO-008.md
```

`android/`, CHANGELOG e ROADMAP non sono stati toccati.

## Scelte di interfaccia: opzioni

**Dove si riprende il livello**
1. **(consigliata, implementata)** Il pulsante grande della home cambia testo in
   «Riprendi il livello N», e toccare quel livello sulla mappa lo riprende. È lo stesso
   schema della partita libera («Partita libera» diventa «Riprendi la partita»). Non
   aggiunge righe alla home, che a 360x640 non deve scorrere (C1). Svantaggio: se il
   livello lasciato a metà non è quello corrente (uno vecchio rigiocato), il pulsante
   grande porta a quello e non al livello corrente. Il corrente resta raggiungibile
   dalla mappa.
2. Un pulsante secondario «Riprendi il livello N» sotto il pulsante grande, che resta
   «Livello M». È più esplicito, ma aggiunge una riga alla home: andrebbe rimisurato
   `correzioni` C1 a 360x640.
3. Solo un segno sulla tappa della mappa (per esempio «in corso»), senza cambiare la
   home. È il meno visibile: chi torna dopo ore dalla home non sa che il livello c'è
   ancora.

**Testo**
1. **(consigliato, implementato)** it «Riprendi il livello {n}», en «Resume level {n}»:
   ricalca «Riprendi la partita» / «Resume game».
2. it «Continua il livello {n}», en «Continue level {n}».
3. it «Torna al livello {n}», en «Back to level {n}».

**Ricominciare da capo un livello salvato.** Oggi si fa con «Riprova» nel menu del
livello. Non ho aggiunto un «Ricomincia» in home accanto a «Riprendi il livello»
(l'equivalente di «Nuova partita» della partita libera), per lo stesso vincolo di
altezza. Se il PO lo vuole, è una riga in `Home.jsx`.

**Aiuto.** `ComeSiGioca.jsx` non parla della ripresa, né per la partita libera né per
i livelli, e non l'ho aggiunta. Da decidere se la regola «ogni novità che il giocatore
sente va nell'aiuto» (CLAUDE.md) si applica anche a questo.

## Non verificato

- **Telefono reale e TWA: non posso confermarlo.** Tutte le misure sono di Chromium
  con Playwright in questo container. Non so se e quando Android butta via la pagina
  della TWA in secondo piano: lo simulo con la ricarica (caso E), che è anche il modo
  in cui lo simula `ripresa.mjs`.
- **Riapertura dall'icona.** Secondo il sorgente di androidbrowserhelper riporta in primo
  piano la TWA esistente, ma non l'ho verificato. Il manifest Android non ha
  `launchMode` né flag e non l'ho toccato. Se sul telefono riaprire dall'icona
  ricaricasse sempre la pagina, il gioco rientra comunque da solo entro 2 ore (caso F,
  `?origine=play`) e oltre offre «Riprendi il livello» (caso B). La misura non indica
  che serva una modifica Android. Se il telefono dicesse il contrario, le opzioni sono:
  1. `android:launchMode="singleTask"` sull'activity di avvio;
  2. lasciare com'è, perché lato web il livello non si perde più.
  Le scrivo solo come opzioni, non le ho provate.
- **Il freeze vero di Android** (Page Lifecycle `frozen`/`discarded`) l'ho simulato con
  CDP `Page.setWebLifecycleState` ed eventi sintetici. Non posso confermare che sul
  telefono si comporti allo stesso modo.
- **Il ritorno oltre le 2 ore** l'ho simulato spostando indietro `quando` in
  `plinto:ripresa`, come fa `ripresa.mjs`. Non ho aspettato due ore.
- I due rossi di `e2e-quadri` sull'impaginazione della vittoria esistono già senza
  questa modifica (vedi sopra). Non so se compaiano nella CI.

## Commit

- `6335ef1`: PO-008, misura dei casi in cui un livello riparte da zero
- `eab0fd6`: PO-008, un livello lasciato a metà non riparte più da zero
- il commit di questo rapporto (hash nel log del ramo)
