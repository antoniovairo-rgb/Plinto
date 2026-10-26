# Rapporto PO-002 — La Torre riallineata a `main` (1.21.25)

Figlia della sessione madre, 26 ottobre 2026, ramo `opera-torre`. Niente su `main`, nessun
cambio di versione (la 1.22.0 si fa il giorno dell'uscita). Decisione di riferimento: la
Torre va online solo dopo l'esito della revisione Google del pacchetto 11915
(`docs/DECISIONI.md`, 26 ottobre, PO-002).

## 1. L'unione

`opera-torre` era fermo al 15 ottobre (`5408d61`), 241 commit indietro. Uniti con merge
commit, nessun rebase, nessun force push:

| Commit | Che cosa |
|---|---|
| `6bac614` | unito `origin/rilascio/1.21.25` (`0944481`): `main` + la 1.21.25 |
| `c107dce` | unito `origin/main` (`b59836e`): solo `docs/DECISIONI.md`, `BACKLOG.md`, `ROADMAP.md` |

36 file in conflitto. Regola seguita: si tengono **tutte** le correzioni di `main` e tutto il
contenuto della Torre. Lockfile: nessun conflitto (`package-lock.json` preso da `main`,
dipendenze identiche; `npm ci` pulito).

| File | Come l'ho risolto |
|---|---|
| `package.json`, `android/app/build.gradle` | di `main`: 1.21.25, versionCode 11915. Gli script della Torre (`itch`, `recensione`, `correzioni`) c'erano gia' |
| `CLAUDE.md`, `docs/ITCH.md` | di `main` (33 controlli; testo della Sfida «parte uguale per tutti») |
| `android/app/src/main/AndroidManifest.xml` | di `main`: `DISPLAY_MODE` `default`, `appCategory="game"`. Vedi E/D/O, scelta 1 |
| `src/persistence/progressi.js` | della Torre: `mancantiPerUltimo` e `quadroSbloccato` per opera, primo livello di un'opera che si apre solo con l'opera precedente finita. Il cambio di `main` su `prossimoQuadro` (dall'ultimo livello chiuso si riparte dal primo lasciato indietro) e' gia' coperto dal ripiego della Torre: con il Ponte finito il primo non superato e' dentro l'opera dell'ultimo livello. `tests/quadri.test.js` verde |
| `src/persistence/salvataggio.js`, `src/state/usePartita.js`, `tests/salvataggio.test.js`, `tests/e2e/correzioni.mjs` | di `main` (interruttori D1-D3, B11, C2, `sfidaAMeta`, `liberaAMeta`, B6/B7/C1/C2/D1-D4); la Torre non aveva niente di suo in questi punti |
| `src/ui/App.jsx` | import della Torre (opere) + `sfidaAMeta`, `liberaAMeta` di `main` |
| `src/ui/schermate/Home.jsx` | tutta la home di `main` (PO-009...PO-025) + `operaCorrente` della Torre nel conteggio («La Torre: 5 di 100») |
| `src/ui/schermate/FineQuadro.jsx` | interruttori di `main` (PO-014, PO-015, H2) + `opera`, `successiva`, frase dell'atto per nome della Torre |
| `src/ui/schermate/Quadri.jsx` | testo della scheda chiusa della Torre + `superatiNellOpera` |
| `src/ui/Plancia.jsx` | della Torre (massi, `a11y.cellaMasso`) |
| `src/i18n/it.js`, `en.js` | chiavi della Torre (opere, massi, `percorso` con `{ponte}` e `{torre}`); in `altreModalita` il testo corretto da `main` (F3, «parte uguale per tutti») |
| `src/styles/app.css`, `finiture.css`, `tokens.css` | regole di `main` (PO-014, «il resto del gioco») + la regola della Torre sui pezzi in mano |
| `tools/schermate.mjs`, `tools/immagine-store.mjs`, `tests/e2e/scenografie.mjs`, `tests/quadri.test.js` | della Torre (schermate dalla Torre, massi), con il selettore senza maiuscole di `main` |
| `android/SCHEDA-PLAY-STORE.md` | della Torre (200 livelli, massi): sono i testi per l'uscita |
| `store/*.png`, `public/anteprima-social.png` | della Torre: sono le immagini per l'uscita; si rigenerano il giorno dell'uscita dopo il cambio di versione (`docs/USCITA-TORRE.md`, B3) |
| `docs/CHANGELOG.md` | voci di `main` 1.21.1...1.21.25; il blocco «Non pubblicato — La Torre» spostato in cima, senza la voce dello schermo intero e con lo stato vero |
| `tests/android.test.js` | tolto il test della Torre che chiedeva `sticky-immersive`: contraddiceva quello di `main` (scelta 1) |

## 2. Controlli eseguiti

Build di produzione servita con `vite preview` per le prove mirate; il gate con il proprio
server, come in CI.

| Controllo | Esito |
|---|---|
| `npm test` dopo l'unione | 680 su 680 |
| `npm run build` | verde |
| `e2e-schermi`, casi «orizzontale» (5 formati) e «testo x2» (2 formati), **con il caso nuovo «torre»** (livello 113, massi) | tutto verde |
| stesso, build con `GIOCO_IN_ORIZZONTALE` e `TESTO_GRANDE_VA_A_CAPO` spenti | rosso: «torre» rosso nei 5 formati coricati (griglia 28 px, massi 0 px); vedi O1 per il testo x2 |
| `e2e-po008` | primo giro rosso sul caso N (vedi D1); corretto, verde; con `CONFERMA_NUOVA_LIBERA` spento il caso N e' rosso |
| `e2e-attrezzi`, `home-spiegazione` | verdi |
| mappa con le due opere, a mano con Playwright: home «Mappa dei livelli, La Torre: 5 di 100», la mappa si apre sulla Torre, Tab fino a «Il Ponte» e Invio cambia scheda | funziona; vedi O2 |
| Piccone con la tastiera su un masso (livello 113, build di produzione, Playwright) | piccone scelto dal pannello con Invio, cursore portato con le frecce da (4,4) a (0,0), un masso, Invio: i massi restano 10, il piccone resta in attesa («I massi no: restano dove sono.»). Il codice: `scavaCella` restituisce `null` sul masso (`src/core/engine.js:457`) e il modo si chiude solo se lo scavo riesce (`src/ui/SchermoGioco.jsx:375`), quindi il gettone non si spende |

### Gate completo (`npm run verifica`, 33 controlli), a pezzi

GATE_QUI

## 3. Cose trovate

### D1 — `e2e-po008`, caso N: la prova non arrivava piu' alla festa finale (corretto)

Dopo l'unione il caso «N festa finale» era rosso: «non ci si arriva, il caso non prova
niente». La prova segnava superati i livelli 2-200 e vinceva l'1. Con la Torre la mappa si
apre sull'opera del livello corrente (la Torre, prima tappa il 101), e anche vincendo l'1
la festa sarebbe stata quella del Ponte, che ha «Entra nella Torre» al posto di «Gioca in
partita libera» (`src/ui/schermate/Trionfo.jsx:160-168`). Difetto della PROVA, non del
gioco: la regola H1 (conferma prima di una nuova libera) vale sulla festa finale della
Torre. Opzioni:

1. **(fatta, consigliata)** il caso N vince il primo livello dell'ultima opera con tutto il
   resto superato: prova la festa finale vera. Commit `feb3de3`.
2. Provare anche la festa del Ponte: non ha «Gioca in partita libera», quindi non c'e'
   niente da confermare; non serve.

### Scelta 1 — Schermo intero (Torre) contro schermo normale (`main`)

La Torre aveva `sticky-immersive` e un test che lo esigeva; `main` (1.21.25, scelta del PO
del 22 ottobre) ha `default` e un test che esige quello. Opzioni:

1. **(fatta, consigliata)** tenere `default` e il test di `main`, togliere quello della
   Torre: la decisione del PO dice che l'immersiva torna «in un pacchetto successivo, da
   sola», non con la Torre.
2. Rimettere l'immersiva nel pacchetto della Torre: contraddice la decisione del PO.

### O1 — Il caso «torre» col testo x2 non e' la prova rosso/verde di `TESTO_GRANDE_VA_A_CAPO`

Con l'interruttore spento il livello 13 sporge di 47 px a 360x800 e il 113 di 0: sporgeva
la fila dei prossimi tre pezzi, che dipende dai pezzi estratti (misura con una sonda,
26 ottobre). Il caso resta come controllo (massi visibili, niente sporgenza sulla Torre),
detto nel commento; la prova rosso/verde resta il caso «livello». Opzioni: 1 (fatta) cosi';
2 forzare dei pezzi larghi nel caso «torre» (piu' codice di prova per lo stesso controllo).

### O2 — Le schede della mappa non si cambiano con le frecce

`src/ui/schermate/Quadri.jsx:93-116`: `role="tablist"`/`role="tab"`, ma solo Tab e Invio
cambiano scheda; le frecce no, e mancano `aria-controls` e il pannello `tabpanel`. Il
modello ARIA delle schede si aspetta le frecce. Non e' una regressione dell'unione (c'era
gia' sul ramo). Da ascoltare con TalkBack prima di cambiare. Opzioni:
1. **(consigliata)** frecce sinistra/destra tra le schede, come il modello ARIA, con un caso
   in `e2e-po008`;
2. togliere i ruoli `tab` e lasciare due pulsanti normali;
3. lasciare cosi'.
Non fatta: cambia come si usa la mappa, e' una scelta della madre.

### O3 — Il pacchetto 11916 cambia solo il numero di versione

`android/app` della Torre e' identica a quella della 11915 (diff vuoto rispetto a
`rilascio/1.21.25`): l'icona a gemme e' nei pacchetti dalla 11905. La Torre arriva a chi usa
l'app dal sito, senza AAB. Opzioni: 1 **(consigliata)** caricare la 11916 come previsto, per
«Informazioni app»; 2 non caricarla e lasciare che la prossima sia quella dell'immersiva.
Decide il PO.

### O4 — Note di rilascio e icona della scheda (corretti nei documenti)

- Le note della Torre dicevano «il gioco ha una veste nuova»: e' uscita con la 1.21.0.
  Riscritte, e date per tutte le 8 lingue della scheda (`android/NOTE-DI-RILASCIO.md`).
- `docs/USCITA-TORRE.md` (B8) chiedeva di caricare `icona-512.png`: la decisione PO-006 dice
  `icona-maskable-512.png`, gia' caricata il 17 ottobre. Corretto.

## 4. Cosa resta per il giorno dell'uscita

- Esito della revisione della 11915 (approvata) prima di tutto.
- Se su `main` esce altro prima della Torre, unirlo di nuovo e rifare il gate.
- `docs/USCITA-TORRE.md`, parte B: versione 1.22.0 e versionCode 11916, schermate
  rigenerate dopo il cambio di versione, `opera-torre` su `main`, CI letta.
- Prova del PO sul telefono, anche coricato su un livello della Torre; a schermo normale.
- Non verificabili da qui: TalkBack sulle schede della mappa e sui massi, telefono di fascia
  bassa, iPhone.
