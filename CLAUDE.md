# CLAUDE.md — PLINTO

Briefing per Claude Code. Leggilo prima di toccare il progetto. Quando una regola qui e
il codice non concordano, vince il codice: correggi questo file.

## Cos'e'
Puzzle a blocchi su griglia 9x9 (righe, colonne E quadranti 3x3), gratuito, senza
pubblicita', senza account, senza rete. Web app installabile (PWA) e, su Google Play,
una **Trusted Web Activity** senza codice nativo. E' **in test chiuso su Google Play**:
la stabilita' viene prima di qualunque funzionalita' nuova.

## Stack
- React 18 + Vite 5, JSX puro, ESM (`"type": "module"`). **Niente TypeScript.**
- Nessun router, nessuna libreria di stato, nessun CSS framework, **nessun linter**.
- Dipendenze di produzione: solo `react` e `react-dom`. Non aggiungerne senza discuterne.
- Test: Vitest (unitari) e Playwright con Chromium (browser). Node 20+; la CI usa 22.

## Comandi
```bash
npm install
npm run dev                    # http://localhost:5173, anche dal telefono in Wi-Fi
npm run build                  # dist/ — inietta la versione e precarica il service worker
npm test                       # 28 file Vitest, ~25 s
npm run verifica               # IL GATE: 24 controlli, ~65 min (cento livelli rigiocati)
npm run verifica -- --veloce   # ~10 min: salta i cento livelli SOLO se il diff lo permette
```
Gli altri script di `package.json` sono singoli controlli o strumenti (`schermate`,
`icone`, `video`, `sim`, `contrasti`...). Il gate li elenca in `tools/verifica-tutto.mjs`.

## Struttura
```
src/core/         motore PURO: niente DOM, niente React, niente timer. Riduttore
                  (stato, azione) -> stato; seed riproducibile; lastMove verso il feel
src/config/       rules.js (costanti di regolamento), quadri.js (100 livelli, GENERATO
                  da tools/genera-quadri.mjs), progetto.js (link e contatti)
src/state/        hook che avvolgono motore e persistenza (usePartita, useQuadro...)
src/persistence/  localStorage con prefisso `plinto:` (storage.js e' l'unico accesso)
src/ui/           componenti e schermate (ui/schermate/), App.jsx e' la radice
src/feel/ audio/  effetti, particelle, vibrazione, audio sintetizzato (nessun file audio)
src/i18n/         it.js, en.js: parita' di chiavi sotto test
src/styles/       tokens.css (design system, contrasti misurati) + app.css
src/sim/          giocatori artificiali e simulazioni in Node (bilanciamento)
public/           manifest.webmanifest, sw.js, icone, privacy.html
android/          progetto TWA scritto a mano (no Bubblewrap). Niente codice: solo
                  manifest, risorse, build.gradle
sito-radice/      assetlinks.json per la RADICE del dominio (vive in un altro repo)
tests/            *.test.js (Vitest) e e2e/*.mjs (Playwright, uno script per scenario)
tools/            gate, misure, generatori, materiali per gli store
docs/             ARCHITECTURE, GAMEPLAY_RULES, DESIGN_SYSTEM, TESTING, PRIVACY,
                  RELEASE_CHECKLIST, CHANGELOG (una voce per versione, obbligatoria)
store/            schermate e immagini per il Play Store, generate dal gioco vero
```
Il dettaglio dei layer e di chi puo' importare chi e' in `docs/ARCHITECTURE.md`.

## Come funziona la PWA
- `index.html` collega `manifest.webmanifest` e i meta Apple; `src/main.jsx` registra
  `sw.js?v=<versione>` **solo in produzione** (`import.meta.env.PROD`).
- La versione arriva da `package.json` via `__APP_VERSION__` in `vite.config.js`:
  cambiandola cambia l'URL del service worker, che si reinstalla e cancella le cache
  vecchie. E' l'intero meccanismo di aggiornamento: non aggiungerne altri.
- `public/sw.js`: il documento HTML va **in rete per primo** (cache solo offline); gli
  `assets/` con impronta nel nome vanno **cache per prima**. Il plugin
  `precaricaNelServiceWorker` in `vite.config.js` scrive in `dist/sw.js` l'elenco degli
  asset da precaricare al posto di `/* PRECARICA */`: senza, il gioco non si apre offline
  alla prima installazione.
- `base: './'` nella build: la stessa `dist/` funziona dalla radice e da una sottocartella
  (GitHub Pages serve da `/Plinto/`).
- Il service worker non intercetta richieste verso altri domini: `tests/privacy.test.js`
  lo impone.

## Build e deploy
- Push su `main` → `.github/workflows/pages.yml` fa test, build, prova la build da una
  sottocartella e spinge `dist/` sul branch `gh-pages`. Sito:
  `https://antoniovairo-rgb.github.io/Plinto/`. Il branch `gh-pages` non si tocca a mano.
- In parallelo `.github/workflows/verifica.yml` esegue `npm run verifica` **completo**.
  **Il verdetto che conta e' quello della CI**, non del gate locale: sul runner non
  possono esistere server di sviluppo rimasti accesi con una versione vecchia (e' gia'
  successo qui, e ha fatto passare un difetto).
- Il deploy e' **solo** GitHub Pages. `netlify.toml` e' stato tolto nel settembre 2026:
  il proprietario del progetto non usa Netlify per PLINTO, e il file dichiarava una
  configurazione che non veniva applicata da nessuna parte.
- **La CSP sta in un `<meta>` iniettato nella build** (plugin `politicaDiSicurezza` in
  `vite.config.js`, `apply: 'build'`). Non nelle intestazioni, perche' GitHub Pages non
  permette di metterne di proprie; non in sviluppo, perche' Vite inietta codice suo e la
  politica lo bloccherebbe. Da un `<meta>` il browser IGNORA `frame-ancestors`,
  `report-uri` e `sandbox`: contro l'essere incorniciati in una pagina altrui qui non
  c'e' difesa, e un controllo impedisce di dichiararli fingendo che funzionino.
  `npm run e2e-sicurezza` attraversa il gioco costruito e fallisce a ogni violazione, poi
  prova a caricare roba da un altro dominio per dimostrare che la politica e' davvero
  attiva: senza quella seconda meta', il giorno in cui il `<meta>` sparisse il controllo
  direbbe "zero violazioni" e sembrerebbe tutto a posto.
- Android: l'`.aab` si ricarica sullo store solo se cambiano icona, nome o permessi.
  Il sito si aggiorna da solo dentro l'app. `versionCode` va alzato a OGNI caricamento.

## Rilasciare una versione
1. Alza `version` in `package.json` **e** `versionName` in `android/app/build.gradle`
   (un test controlla che coincidano). `versionCode` solo se carichi l'AAB.
2. Scrivi la voce in `docs/CHANGELOG.md`: cosa, **perche'**, cosa e' stato misurato.
3. Spegni ogni `vite` rimasto acceso (la versione si inietta all'avvio del server).
4. `npm run verifica` (o `-- --veloce` se hai toccato solo testi, docs o file che il gate
   classifica come "disegnano"). Con anche un solo rosso **non si pubblica**.
5. Commit e push su `main`. Poi **aspetta la CI** e leggila prima di dire "pubblicato".
6. La skill `release-checklist` guida questi passi.

## Convenzioni osservate nel codice
- **Lingua: italiano** per identificatori, commenti, test e messaggi di commit.
  Nei commenti del sorgente gli accenti sono apostrofi (`e'`, `perche'`, `piu'`);
  nelle stringhe per il giocatore e nei documenti sono accenti veri.
- I commenti spiegano **il perche'**, non il cosa, e citano il difetto o la misura da cui
  nasce la regola. Mantieni questo stile: e' la memoria del progetto.
- Il motore e' puro e riproducibile: **mai** consumare `rngState` per cose decorative
  (cambierebbe la Sfida del Giorno). Le costanti di gioco in `config/rules.js` entrano
  nell'impronta delle regole: una costante di sola taratura NON va li'.
- Uno script e2e per scenario, autonomo, che avvia da solo il server se non c'e'.
  Ogni controllo nuovo va registrato in `tools/verifica-tutto.mjs`, cosi' gira in CI.
- Un test nuovo va **fatto fallire di proposito** prima di fidarsene: un controllo che non
  sa fallire non e' un controllo.
- Per trovare processi usa `/proc/<pid>/exe`, non `pkill -f`/`pgrep -f` sul testo del
  comando: il filtro cattura anche se stesso (ha ucciso la shell, e cicli di attesa
  sono rimasti appesi per ore). Un hook in `.claude/settings.json` li **blocca**: se un
  comando viene rifiutato per questo, non e' un errore dello strumento, e' la regola.
- Non versionare: `verifica.log`, `geometria.json`, `verifica-livelli.json`, `store/prove/`.

## Regole di lavoro
- Priorita' finche' e' in test: crash > difetti > regressioni > stabilita' > resto.
- Prima di modifiche non banali, spiega il piano e attendi conferma.
- Un commit per funzionalita' o correzione, con il messaggio che racconta il perche'.
- **Ogni novita' che il giocatore sente va scritta anche nell'aiuto**: `src/ui/schermate/
  ComeSiGioca.jsx` e, se cambia che gioco e', la guida al primo avvio
  (`src/ui/schermate/PrimoAvvio.jsx` + `src/config/intro.js`). Vale per una meccanica
  nuova e anche per una costante ritarata, perche' l'aiuto cita dei numeri. I numeri non
  si ricalcolano a mano: si chiedono alla funzione del motore che li usa. Pagato una
  volta: la 1.15.0 ha spostato la soglia della Tinta e l'aiuto ha continuato a dire
  "+100%" mentre il gioco ne pagava 60. Il promemoria e' `tests/aiuto-aggiornato.test.js`,
  che fallisce se cambi la taratura o aggiungi un attrezzo senza riaprire l'aiuto.
- **I testi del gioco devono essere chiarissimi**, per chiunque, anche per un bambino
  (regola del proprietario, 26 settembre 2026). Frasi brevi, parole di tutti i giorni, e
  **una parola per una cosa sola**: se due cose diverse si chiamano allo stesso modo, il
  giocatore le confonde. Pagato una volta: il pannello diceva «Hai 3 attrezzi» e ne
  elencava quattro, perche' "attrezzi" indicava sia i quattro strumenti sia quante volte
  si possono usare. Adesso gli **attrezzi** sono i quattro strumenti e i **gettoni** sono
  quello che si guadagna e si spende (in inglese *tools* e *tokens*; «usi» e' stato
  scartato dal proprietario). Il vocabolario fissato: griglia (non tabellone), casella
  (non cella, non quadratino), i prossimi tre pezzi (non terna), Record, Sfida del
  giorno, Intreccio (in inglese Interlace). `tests/lessico.test.js` fa fallire i
  sinonimi scartati: se ne aggiungi uno al gioco, aggiungilo li'. Un numero delle regole
  dentro un testo si prende dalle regole, non si scrive a mano. Prima di scrivere un
  testo nuovo chiediti: chi lo legge per la prima volta, senza sapere niente del codice,
  capisce che cosa fare?
- **I cento livelli non si modificano a mano.** `src/config/quadri.js` e' generato: si
  cambia la ricetta in `tools/genera-quadri.mjs` (atti, tipi, motivi, percentili, margini,
  bande di riuscita) e si rigenera. Una generazione intera dura ore, quindi si prova prima
  a vuoto su un tratto: `QUADRI_PROVA=41-58 node tools/genera-quadri.mjs 8` non scrive
  niente. La difficolta' non e' una speranza: ogni atto ha una BANDA di riuscite del
  giocatore artificiale (pavimento e soffitto), il generatore ce lo porta dentro togliendo
  o restituendo mosse, e alla fine stampa la curva che e' uscita davvero. Se la curva
  risale in un atto, il generatore lo dice: non pubblicare senza averlo guardato.
  Rigenerare NON azzera l'avanzamento di chi gioca -- i progressi stanno in
  `localStorage` per numero di livello, non per contenuto -- ma i record di mosse gia'
  registrati si riferiscono a livelli diversi, e va scritto nel changelog.
- Non modificare `docs/` di altri progetti, ne' il progetto in `../` : si lavora qui.
- Non committare `.env` ne' chiavi. Il `.gitignore` le esclude gia'.
- Il test chiuso e' finito e l'accesso alla produzione e' stato concesso (25 settembre
  2026). Lo stato della Play Console e le cose da caricare sono in
  `docs/RELEASE_CHECKLIST.md`.
