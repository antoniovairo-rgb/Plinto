# Rapporto PO-042 e PO-043 (1.22.2)

Figlia della sessione madre, ramo `po042-po043` (da `main` a `4dad456`). Decisioni già
prese in `docs/DECISIONI.md` (righe del 3 novembre: PO-042 D1 → opzione 1, O2 → opzione 1;
PO-043 «101 evidenziato»). Fonte dei difetti: `docs/sviluppo/COLLAUDO-1.22.1.md`, § 5.
Non pubblicato, nessuna PR: rosso/verde e rilascio sono della madre.

## 1. Che cosa ho cambiato

| Punto | File:riga | Interruttore |
|---|---|---|
| D1: un livello salvato conta solo se ancora aperto (`quadroSbloccato`) | `src/state/useQuadro.js:40-61` (interruttore e `apertoAncora`), `:131` (`riprendiSalvato`), `:147` (`numeroSalvato`), `:163` (`livelloAMeta`), `:204` (presentazione che non copre un altro livello) | `RIPRENDI_SOLO_SE_APERTO` (`useQuadro.js:58`) |
| PO-043: «Gioca il livello N» pieno, primo e con il fuoco se il livello a metà è già superato | `src/ui/App.jsx:87-97` (interruttore), `:565` (`avviaQuadro`), `:700`; `src/ui/ConfermaDoppia.jsx:101-109`, `:147` (`primaContinua` in `ConfermaPerdita`) | `GIOCA_PIENO_SE_SUPERATO` (`App.jsx:97`) |
| O2: `e2e-torre-aperta` legge l'esportazione da «Copia il testo» | `tests/e2e/torre-aperta.mjs:68-75`, `:187` | `LEGGI_DA_COPIA` (`torre-aperta.mjs:75`) |
| Prove nuove: casi D, E (it, en), E2 | `tests/e2e/pulsante-livello.mjs:141` (D), `:189-` (E, E2) | — |
| Versione 1.22.2 | `package.json:3`, `package-lock.json:3,9`, `android/app/build.gradle:47` (`versionName`; `versionCode` resta 11916), `docs/CHANGELOG.md` (voce 1.22.2) | — |
| Nome del controllo nel gate | `tools/verifica-tutto.mjs:53` (stesso comando `e2e-po041`, nessun comando nuovo) | — |

### D1: dove sta il controllo, e perché lì

Il compito indicava tre strade in `App.jsx` (pulsante, ripresa automatica, `apriQuadro`).
Tutte e tre leggono il salvataggio attraverso `useQuadro`: il pulsante con
`numeroSalvato` (`App.jsx:613`), la ripresa automatica con `riprendiSalvato`
(`App.jsx:466`), `apriQuadro` con tutte e due (`App.jsx:546`). Ho messo il controllo una
volta sola in `useQuadro.js`, così copre anche la domanda di PO-008 (`livelloAMeta`): senza,
aprendo l'11 il gioco avrebbe chiesto «Il livello 100 è a metà…» per un livello che non si
può più giocare.

### D1: cancellare o ignorare? Ignorare

La partita del livello chiuso **si ignora, non si cancella**. Motivo: si chiude solo con un
«Sostituisci» più povero, e chi rimette il salvataggio completo riapre il livello; ignorata,
la partita torna riprendibile com'era, cancellata no (irreversibile). Finché il livello
resta chiuso la voce non va sul pulsante, non si riprende, non fa chiedere niente.

Limite, da sapere: la voce resta solo finché non si apre un altro livello. Con
`apertoAncora` dentro il controllo della presentazione (`useQuadro.js:204`) basta aprire la
presentazione dell'11 perché il salvataggio dell'11 prenda il posto di quello del 100
(misura in § 2.4).

### PO-043

`avviaQuadro` passa `primaContinua: GIOCA_PIENO_SE_SUPERATO && quadroSuperato(lasciato)`.
`ConfermaPerdita` con `primaContinua` scambia l'ordine: primo, pieno (`pl-btn`) e con il
fuoco (`ref={sicuro}`) è «continua»; secondo, trasparente (`pl-btn--fantasma`) è «torna».
Escape, tocco fuori e Indietro restano «chiudi senza perdere niente». Le etichette non
cambiano (`conferma.giocaLivello`, `conferma.riprendiLivello`), quindi `lessico.test.js` e la
parità it/en non sono toccati. L'aiuto (`src/ui/schermate/ComeSiGioca.jsx`) non parla della
domanda né della ripresa del livello: non c'era niente da aggiornare.

## 2. Rosso/verde misurato

Le uscite complete sono state salvate nello scratchpad della sessione; qui le righe che contano.

### 2.1 Prima di correggere (codice di `main`, prova nuova)

`npm run e2e-po041` → **uscita 1**:

```
D. Sostituisci con 1-10, 100 a meta' e chiuso: il pulsante dice «Livello 100» (atteso «Livello 11»)
D. ricaricando con la ripresa del 100 ancora valida si resta in home: false
E (it). … [{"nome":"Riprendi il livello 100","pieno":true,"fuoco":true},{"nome":"Gioca il livello 101","pieno":false,"fuoco":false}]
E2 (it). … [{"nome":"Riprendi il livello 11","pieno":true,"fuoco":true},{"nome":"Gioca il livello 13","pieno":false,"fuoco":false}]
E (en). … [{"nome":"Resume level 100","pieno":true,"fuoco":true},{"nome":"Play level 101","pieno":false,"fuoco":false}]
PROBLEMA - D: il pulsante dice «Livello 100» invece di «Livello 11»
PROBLEMA - D: ricaricando si e' riaperto da solo un livello chiuso: «PUNTEGGIO 0 RECORD 0 LIVELLO 100 …»
PROBLEMA - E it: il primo pulsante e' «Riprendi il livello 100» invece di «Gioca il livello 101»
PROBLEMA - E it: Invio sul pulsante pieno non gioca il 101 (salvato: 100)
PROBLEMA - E en: … (stessi tre)
```

Il difetto D1 del collaudo è riprodotto (pulsante «Livello 100», ricarica che riapre il 100).

### 2.2 Con le correzioni

`npm run e2e-po041` → **uscita 0**: A, B, C come prima; D «Livello 11», ricaricando si resta
in home, il tocco apre l'11; E it `[{"nome":"Gioca il livello 101","pieno":true,"fuoco":true},{"nome":"Riprendi il livello 100","pieno":false,"fuoco":false}]`,
E en `[{"nome":"Play level 101",…pieno:true,fuoco:true},{"nome":"Resume level 100",…}]`, Invio sul
pulsante pieno salva il 101; E2 it/en invariato («Riprendi il livello 11» pieno con il fuoco).

### 2.3 Ciascun interruttore spento (gli altri accesi)

- `RIPRENDI_SOLO_SE_APERTO = false` → **uscita 1**; solo D rosso («Livello 100», ricarica nel 100); E, E2 verdi.
- `GIOCA_PIENO_SE_SUPERATO = false` → **uscita 1**; solo E it ed E en rossi (6 problemi); D ed E2 verdi.
- `LEGGI_DA_COPIA = false`, contro il sito (`PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`) → **uscita 1**,
  unico problema `console: Failed to load resource: the server responded with a status of 404 ()`.
  Identico alla misura prima della correzione.
- `LEGGI_DA_COPIA = true` contro il sito → **uscita 0**; in sviluppo → **uscita 0**.
- Il controllo nuovo sa fallire: togliendo per prova `avvisoTorre` dalle impostazioni
  esportate (`componiSalvataggio`, ripristinato subito) → **uscita 1**,
  «O1 salvataggio: il file esportato non porta «avvisoTorre»: {"audio":true,…}».
  Con il vecchio import quel caso sul sito sarebbe passato in silenzio (`.catch(() => null)`).

Nota: la prova contro il sito usa la 1.22.1 pubblicata; il percorso di «Copia il testo» non
cambia nella 1.22.2.

### 2.4 Che fine fa la partita del livello chiuso

Misura con uno script a parte (server di sviluppo su un'altra porta, poi spento): livelli
1-10 superati e il 100 salvato a metà, come dopo il «Sostituisci» del caso D.

```
home: salvato 100 | pulsante Livello 11
presentazione dell 11: salvato 11 | domanda? 0
dopo «Gioca» sull 11: salvato 11 | domanda? 0
```

La partita del 100 resta in memoria finché si sta in home. Si perde, senza domanda, appena
si apre la presentazione dell'11 (scelta aperta 1).

## 3. Gate a pezzi

`npm run verifica` supera le due ore dei comandi in background: ho eseguito i comandi di
`tools/verifica-tutto.mjs` uno per uno, nello stesso ordine, con `livelli -- 1 100` e
`livelli -- 101 200` al posto di `livelli`. Commit misurato: `e35fab6` (versione 1.22.2). Nessun server
rimasto acceso prima di cominciare (porta 5173: nessuna risposta).

| # | Comando | Uscita | Durata |
|---|---|---|---|
| 1 | `npm run versione-servita` | 0 | 0s |
| 2 | `npm test` | 0 | 22s |
| 3 | `npm run contrasti` | 0 | 0s |
| 4 | `npm run build` | 0 | 1s |
| 5 | `npm run comunicazioni` | 0 | 9s |
| 6 | `npm run e2e` | 0 | 45s |
| 7 | `npm run e2e-quadri` | 1 | 21s |
| 8 | `npm run e2e-trionfo` | 0 | 49s |
| 9 | `npm run e2e-torre-aperta` | 0 | 52s |
| 10 | `npm run e2e-po041` | 0 | 12s |
| 11 | `npm run e2e-ripresa` | 0 | 14s |
| 12 | `npm run e2e-po008` | 0 | 203s |
| 13 | `npm run e2e-salvataggio` | 0 | 14s |
| 14 | `npm run e2e-sicurezza` | 0 | 28s |
| 15 | `npm run e2e-attrezzi` | 0 | 42s |
| 16 | `npm run e2e-scenografie` | 0 | 14s |
| 17 | `npm run guida` | 0 | 17s |
| 18 | `npm run annulla` | 0 | 6s |
| 19 | `npm run incitamenti` | 0 | 53s |
| 20 | `npm run archivio` | 0 | 16s |
| 21 | `npm run condivisione` | 0 | 9s |
| 22 | `npm run recensione` | 1 | 35s |
| 23 | `npm run correzioni` | 0 | 36s |
| 24 | `npm run anteprima` | 0 | 37s |
| 25 | `npm run indietro` | 0 | 13s |
| 26 | `npm run impaginazione` | 0 | 50s |
| 27 | `npm run home-spiegazione` | 0 | 140s |
| 28 | `npm run geometria` | 0 | 6s |
| 29 | `npm run livelli -- 1 100` | 0 | 465s |
| 30 | `npm run livelli -- 101 200` | 0 | 468s |
| 31 | `npm run precisione` | 0 | 255s |
| 32 | `npm run prova-pages` | 0 | 3s |
| 33 | `npm run installazione` | 0 | 35s |
| 34 | `npm run prova-desktop` | 0 | 31s |
| 35 | `npm run e2e-schermi` | 0 | 702s |
| 36 | `npm run soak` | 0 | 69s |

Esito: **34 comandi su 36 con uscita 0, 2 con uscita 1**:

- `e2e-quadri`: «PROBLEMA - FINE LIVELLO (vittoria): a 320x700 bisogna scorrere di 2 px».
- `recensione`: «APP: a 360x640 l invito finisce 10px sotto la barra dei pulsanti: non si
  vede senza scorrere».

**Non nascono da questo ramo.** Rilanciati da soli sul ramo, stessi due rossi con gli stessi
numeri; rilanciati su `main` a `4dad456` (worktree temporaneo, poi tolto), **stessi due rossi,
stessi numeri** (uscita 1 e 1). I file che toccano (`FineQuadro.jsx`, l'invito alla
recensione) non sono cambiati qui. Sul commit `d883866` il gate a pezzi della madre era verde
e la CI del merge `215f721` pure (`docs/DECISIONI.md`, riga del 3 novembre). Quindi dipende da
questo container: un'ipotesi sono i font installati, che cambiano l'altezza del testo, ma
**non posso confermarlo**, perché non l'ho misurato. Il verdetto che conta è quello della CI
(`CLAUDE.md`).


## 4. Scelte rimaste aperte

0. **I due rossi di impaginazione del gate (§ 3), uguali su `main`.** Opzioni:
   1. **(consigliata)** Leggere la CI «verifica» del ramo o del merge: se lì sono verdi, sono
      di questo container.
   2. Rifare `e2e-quadri` e `recensione` nel container della madre prima del rilascio.
   3. Se anche la CI è rossa, aprire un difetto a parte: non riguarda PO-042/043.

1. **La partita del livello chiuso dura fino al primo livello aperto.** Opzioni:
   1. **(consigliata)** Lasciare così: il caso è raro (serve un «Sostituisci» più povero con
      un livello a metà) e la voce non fa danni finché resta.
   2. Togliere `apertoAncora` dal controllo della presentazione (`useQuadro.js:204`): la voce
      del livello chiuso resta finché non si gioca la prima mossa di un altro livello. Costo:
      chi esce durante la presentazione dell'11 non la ritrova.
   3. Cancellarla subito quando si scopre chiusa: pulito, ma irreversibile.
2. **`apriQuadro` con una definizione di un livello chiuso apre comunque il livello da capo**
   (`App.jsx:546-551`: senza ripresa si fa `quadri.apri`). Non l'ho cambiato perché le strade
   che conosco non ci arrivano: dalla mappa una tappa chiusa è `disabled`
   (`src/ui/schermate/Quadri.jsx`, `disabled={!aperto}`), il pulsante della home ora va sul
   corrente, «Livello successivo» compare solo se il successivo è aperto (`App.jsx:846`,
   `FineQuadro.jsx:335`). Che non ce ne siano altre (collegamenti, Indietro) **non posso
   confermarlo**: non l'ho cercato a fondo. Opzioni: 1 **(consigliata)** lasciare e
   guardarlo nel prossimo collaudo; 2 aggiungere in `apriQuadro` un ripiego sulla mappa se
   `!quadroSbloccato(numero)`, con un suo interruttore.
3. **La voce `plinto:ripresa` di un livello chiuso resta** (finestra di due ore,
   `src/persistence/ripresa.js`): la ripresa la ignora perché `riprendiSalvato` dà null.
   Opzioni: 1 **(consigliata)** lasciare; 2 chiamare `dimenticaPosto()` in quel ramo.
