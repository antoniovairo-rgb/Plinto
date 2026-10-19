# Rapporto PO-019 — B6 rosso una volta in CI

Ramo `b6-instabile`, 19 ottobre 2026. Voce: nella CI «verifica», corsa 161 (commit
`8fa1d3e`), è fallito solo `npm run correzioni`, caso B6: «dopo una ricarica Indietro fa
«fuori», atteso «mappa > home > fuori»». Corse 162 e 163 verdi sullo stesso codice.

## In breve

- **Causa:** non è la prova, ed è il gioco **solo sul server di sviluppo**. Con
  `<React.StrictMode>` (`src/main.jsx`) React esegue due volte l'effetto di
  `useTastoIndietro` al montaggio. Il primo giro spegneva `primoGiro`; il secondo trovava
  la home (profondità 0) con due voci di cronologia adottate e chiamava `history.go(-2)`,
  cioè proprio ciò che il commento di `primoGiro` vieta. Subito dopo la ripresa del
  livello rimette due voci con `pushState`. Chi arriva prima decide l'esito: se le due
  `pushState` precedono il compimento di `go(-2)`, la cronologia resta sulla voce di
  partenza con quattro voci sopra, e **il primo Indietro esce**: lo stesso messaggio
  della corsa 161.
- **Giocatori:** non toccati. In produzione l'effetto gira una volta (StrictMode raddoppia
  gli effetti solo nelle build di sviluppo) e `go` dopo la ricarica non viene mai
  chiamato: misurato 0 su 30 con la correzione **spenta** sulla build di produzione.
- **Correzione:** interruttore `PRIMO_GIRO_REGGE_IL_DOPPIO_EFFETTO` in
  `src/ui/useTastoIndietro.js`: il primo giro finisce solo quando la profondità cambia
  davvero. In produzione non cambia niente (l'effetto gira solo a profondità cambiata).
- **Prova:** B6 ora conta anche i `history.go` del gioco dopo la ricarica (devono essere
  zero). Spento: rosso. Acceso: verde.

## Dove gira B6 in CI

`.github/workflows/verifica.yml` esegue `npm run verifica`; `tools/verifica-tutto.mjs:81`
lancia `npm run correzioni`. `tests/e2e/correzioni.mjs` usa `PLINTO_E2E_URL` o
`http://localhost:5173/` e, se nessuno risponde, avvia `npx vite` (server di **sviluppo**,
non la build). Quindi in CI B6 gira con StrictMode attivo e doppio effetto.

Registro della corsa 161 letto via API di GitHub (job 117932494835): 33 controlli, l'unico
✗ è «correzioni del collaudo», 13 s. La riga con il messaggio di B6 sta nell'artefatto
`verifica-log`, che **non ho scaricato**: il testo del messaggio lo prendo dalla voce PO-019.

## Prove

Strumenti nella scratchpad della sessione (non versionati): `b6-ripeti.mjs` ripete B6
così com'è e, con `SPIA=1`, registra da dentro la pagina ogni `history.go/pushState/
replaceState` e ogni `popstate` dopo la ricarica, più la cronologia letta via CDP
(`Page.getNavigationHistory`, la stessa che usa `page.goBack` di Playwright 1.63).

### 1. Il `go(-2)` c'è, ad ogni ricarica, sul server di sviluppo

Codice di `main` (prima della correzione), dev server, registro dopo la ricarica (ms dal
caricamento):

```
198 go(-2) len=4 | 209 popstate {"plinto":0} | 227 pushState({"plinto":1}) | 228 pushState({"plinto":2})
```

Il `go(-2)` è compiuto in 11 ms, le `pushState` arrivano 18 ms dopo: localmente la corsa
si vince sempre. Conteggio con l'interruttore nuovo **spento** (stesso comportamento di
`main`): `go(-2)` dopo la ricarica in **30 ricariche su 30**.

### 2. Se l'ordine si inverte, il primo Indietro esce

`ordine.mjs`: stessa cronologia di B6 (`about:blank`, voce 0, 1, 2; indice 3), poi
`history.go(-2); pushState({plinto:1}); pushState({plinto:2})` nello stesso compito,
cioè le voci messe prima che il browser compia il `go`:

```
prima           3/4 [about:blank, ~, ~, ~]
stesso compito  1/6 [about:blank, ~, ~, ~, ~, ~]  history.state = {"plinto":0}
un Indietro ->  about:blank
```

È esattamente «fuori» al primo passo. Non ho trovato un'altra sequenza che lo produca:
`page.goBack` di Playwright va all'indice corrente meno uno della cronologia CDP, e
l'unica voce con un indirizzo diverso dal gioco è `about:blank` all'indice 0.

### 3. La corsa naturale: non riprodotta

Sequenza di B6 originale, codice di `main`, server di sviluppo: verde in **152 ripetizioni
su 152** (20 a CPU piena, 40 con `Emulation.setCPUThrottlingRate` 6x, 60 con un nucleo
occupato da un ciclo infinito, 30 con la spia, 2 tracciate). Un giro con il solo processo
principale di Chromium rallentato è stato interrotto a metà e scartato: il server di
sviluppo aveva già ricaricato il codice corretto.

**Non posso confermare** che nella corsa 161 il `go(-2)` sia arrivato dopo le `pushState`:
non ho la cronologia di quel runner, e non sono riuscito a far perdere la corsa qui. Posso
confermare che il difetto è sempre presente in sviluppo (30/30), che l'ordine inverso dà
proprio quel messaggio, e che non ho trovato altre strade per quel messaggio.

## Correzione e conteggi

| Situazione | Ripetizioni | `go` dopo ricarica | Sequenza di Indietro |
|---|---|---|---|
| dev, interruttore spento | 30 | 30 su 30 (`go(-2)`) | 30 verdi |
| dev, interruttore acceso | 30 | 0 | 30 verdi |
| dev, acceso, CPU 4x | 100 | 0 | 100 verdi |
| build di produzione (`vite preview`), **spento** | 30 | 0 | 30 verdi |
| build di produzione, acceso, CPU 4x | 100 | 0 | 100 verdi |

Con la correzione accesa, dopo la ricarica il gioco non scrive più la cronologia
(registro vuoto): adotta le tre voci che ci sono. Non c'è più nessuna corsa da vincere.

`npm run correzioni`:
- `PRIMO_GIRO_REGGE_IL_DOPPIO_EFFETTO = false`: rosso, «B6: dopo la ricarica il gioco
  chiama history.go(-2): corre contro la ripresa del livello (PO-019)»;
- `= true`: «Tutto a posto: le correzioni del collaudo tengono.»;
- `ADOTTA_VOCI_DOPO_RICARICA = false` (rosso/verde originale di B6, ancora valido): rosso,
  «mappa > home > home > home > fuori».

Altre prove sullo stesso hook, con la correzione: `npm run indietro`, `npm run e2e-po008`,
`npm run e2e-ripresa` verdi.

## Perché la prova controlla il `go` e non solo la sequenza

La sequenza di Indietro perde quasi mai (0 su 152 qui): da sola non sa fallire per questo
difetto. Il `go` dopo la ricarica invece c'è sempre quando il difetto c'è, ed è ciò che il
commento di `primoGiro` dichiara vietato. Il controllo vecchio resta tutto.

## Alternative considerate

1. **Correggere l'hook (scelta, consigliata):** il codice resta sicuro con il doppio
   effetto, come React chiede; in produzione nessun cambiamento.
2. Far girare `correzioni` sulla build (`vite preview`): toglierebbe il sintomo dalla CI
   ma lascerebbe il difetto nel server di sviluppo, e le altre prove e2e girano lì.
3. Togliere `<React.StrictMode>`: cambio di progetto più largo, nasconde anche altri
   effetti non idempotenti. Sconsigliata.

## Cosa non posso confermare

- Che la corsa 161 sia andata esattamente così (vedi §3).
- Il comportamento su telefono o nella TWA: non provato; in produzione però il `go` non
  c'è (misurato su `vite preview` in Chromium desktop).

## Gate

`npm run build`: «✓ built in 1.57s». `npm run verifica -- --veloce`: corsia veloce
**negata** («non risulta nessun giro completo passato su questa macchina»), quindi giro
completo. Ultima riga del riassunto: **«2 controlli su 33 sono falliti. NON pubblicare.»**
(33 controlli in 5012 s; cento livelli verdi; `correzioni` verde).

I due rossi sono quelli noti del container (`docs/TESTING.md`, «Due rossi noti»), con gli
stessi numeri:
- livelli nel browser (`e2e-quadri`): «a 320x700 bisogna scorrere di 2 px»;
- `recensione`: «a 360x640 l invito finisce 10px sotto la barra dei pulsanti».

Rieseguiti entrambi sul ramo e poi con `useTastoIndietro.js` e `correzioni.mjs` di `main`
nello stesso container: rossi uguali, stessi numeri, nei due casi. Non dipendono da questa
correzione. Il verdetto che conta resta quello della CI, che su questo ramo **non è
partita** (`verifica.yml` gira su push a `main` e sulle pull request verso `main`).
