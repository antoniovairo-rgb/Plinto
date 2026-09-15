---
name: release-checklist
description: Procedura di rilascio di PLINTO. Usala prima di pubblicare una versione (push su main) o di caricare un AAB sul Play Store. Orchestra il gate esistente (npm run verifica), controlla versione, manifest, service worker offline e installazione, e dice cosa NON puo' essere verificato a macchina.
---

# Rilascio di PLINTO

Questa skill NON reimplementa nessun controllo: li esegue quelli che il repo ha gia'
(`tools/verifica-tutto.mjs`, 25 controlli) e aggiunge la procedura intorno, che e' dove
finora si e' sbagliato. Se un controllo manca, si aggiunge al gate, non qui.

## 0. Quando fermarsi prima di cominciare
- E' in corso il conteggio dei 14 giorni di test chiuso su Google Play? Allora
  **si pubblica il sito, ma non si tocca il Play Console** (niente AAB, niente scheda).
  Data prevista di fine: vedi `docs/RELEASE_CHECKLIST.md`, sezione "Da fare dopo".
- C'e' una segnalazione di crash o perdita di dati aperta? Ha la precedenza su tutto.

## 1. Versione, in tre posti
1. `package.json` → `version` (fonte unica: la build la inietta come `__APP_VERSION__`).
2. `android/app/build.gradle` → `versionName` uguale. `tests/android.test.js` lo impone.
3. `docs/CHANGELOG.md` → nuova voce in cima: cosa, perche', cosa e' stato misurato.
   Il changelog e' obbligatorio anche per un cambio di testo.
`versionCode` in `build.gradle` si alza **solo** quando si carica davvero un AAB, e non
si riusa mai: Play brucia i numeri anche delle bozze cancellate.

## 2. Nessun server vecchio acceso
La versione entra nel bundle **all'avvio** del server di sviluppo. Un `vite` rimasto
acceso da prima del punto 1 serve la versione vecchia: il gate misurerebbe un gioco che
non esiste piu' (e' successo: la 1.10.0 e' uscita con un difetto per questo).
- Trova i server con `/proc/<pid>/exe` che punta a node e cmdline con `bin/vite`.
  **Non usare `pkill -f vite`**: il filtro cattura anche la shell che lo lancia.
- Il primo controllo del gate (`npm run versione-servita`) lo verifica comunque: se
  fallisce, spegni e rilancia. Non aggirarlo.

## 3. Il gate
```bash
npm run verifica               # completo, ~65 min: obbligatorio se hai toccato
                               # src/core, src/state, src/config/{rules,quadri}.js,
                               # Plancia/Tray/Pezzo/SchermoGioco, useTrascinamento,
                               # useTastiera, le schermate dei livelli, index.html
npm run verifica -- --veloce   # ~10 min: SOLO testi, docs, App.jsx, componenti fuori
                               # dalla plancia. Decide il diff, non chi lo lancia: se
                               # rifiuta, fa il giro intero e ha ragione lui.
```
Regole di lettura:
- **Un solo rosso = non si pubblica.** Nessuna eccezione per "e' solo un pixel".
- Il gate non si ferma al primo fallimento: leggi TUTTA la tabella finale.
- Non mettere `| tail` o `| grep` sul comando del gate: il codice di uscita diventa
  quello di `tail`. Leggi `verifica.log` dopo.
- Se un controllo nuovo passa al primo colpo, **fallo fallire di proposito** (rompi la
  cosa che controlla, rilancia, ripristina) prima di fidartene.

## 4. Cosa coprono i controlli, per rispondere senza rileggerli
| Domanda | Chi risponde |
| --- | --- |
| Il manifest e' valido per installare? | `installazione.mjs` §5 (icone 192/512, maskable, `display: standalone`); `android.test.js` (orientamento e pacchetto coerenti con l'app Android e con `assetlinks.json`) |
| Il gioco si apre senza rete? | `installazione.mjs` §3, su una build vera servita da una sottocartella |
| Un aggiornamento arriva al giocatore? | `installazione.mjs` §4 (sostituisce i file a caldo e verifica la versione nuova a schermo) |
| Il service worker rispetta la privacy? | `privacy.test.js` (nessun dominio esterno, documento in rete per primo, cache con la versione) |
| La versione e' coerente ovunque? | `android.test.js`, `versione-servita`, `installazione.mjs` §2 |
| Desktop e schermi grandi? | `prova-desktop.mjs` (monitor, portatile basso, tablet, telefoni) |
| Android reale? | **Non a macchina.** Vedi §5 |
| iOS / Safari? | **Non coperto.** Vedi §5 |

## 5. Quello che NESSUN controllo puo' vedere (da fare a mano, e da dichiarare)
- **iOS**: Playwright qui usa solo Chromium. Aggiungere WebKit non basterebbe: il
  comportamento "Aggiungi alla schermata Home" di Safari e la modalita' standalone non
  sono automatizzabili. Stato in `RELEASE_CHECKLIST.md`: "Resta aperto iOS". Se si
  pubblica una modifica che tocca manifest, meta Apple o service worker, va provata su un
  iPhone vero o scritto esplicitamente che non lo e' stata.
- **Il patto TWA** (`assetlinks.json` alla radice del dominio ↔ `assetStatements` in
  Android): se non combacia, Android mostra la barra dell'indirizzo **senza errori**.
  Si vede solo su un telefono vero, dall'app installata dallo store.
- **Lettore di schermo reale** (TalkBack/VoiceOver): gli annunci sono nel DOM, come
  suonano non e' mai stato ascoltato.

## 6. Pubblicare
1. Commit con messaggio che racconta il perche'. Push su `main`.
2. `pages.yml` pubblica su `gh-pages`; `verifica.yml` rifa' il gate completo sul runner.
3. **Aspetta la CI e leggila.** Il gate locale puo' mentire (server vecchio, macchina
   sporca); il runner parte pulito ogni volta. "Pubblicato" si dice solo con la CI verde.
   Se e' rossa e il gate locale era verde, credi alla CI e cerca cosa ha visto lei.
4. Notifica al proprietario del progetto quando e' in produzione.

## 7. Se invece si carica un AAB
Solo dopo la fine del test chiuso. Allora, in ordine: alza `versionCode`, `npm run
icone` se l'icona e' cambiata, compila con Android Studio, carica, **poi** rigenera e
carica le schermate (`npm run schermate`) e l'immagine in evidenza (`npm run
immagine-store`): schermate che mostrano una versione non ancora scaricabile raccontano
un'app che nessuno puo' installare.

## Cosa questa skill non fa
Non installa nulla, non modifica il gioco, non decide il modello da usare. Le decisioni
di prodotto (cosa entra in una versione) restano al proprietario.
