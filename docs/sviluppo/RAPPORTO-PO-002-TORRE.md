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

Eseguito il 26 ottobre su `opera-torre` (`fa3f4bd`, codice del gioco uguale a `feb3de3`),
gli stessi 33 comandi di `tools/verifica-tutto.mjs`, in sequenza, a pezzi sotto i 60 minuti
(limite dei comandi in background); il controllo dei livelli diviso in quattro tratti con
`node tests/e2e/tutti-i-livelli.mjs DA A`. Tempo totale 8.727 s (circa 2 ore e 25 minuti).
**30 verdi su 33.**

| Controllo | Esito | Tempo |
|---|---|---|
| versione servita, test unitari, contrasti, build, comunicazioni, e2e | verdi | 73 s |
| `e2e-quadri` | **rosso noto**: fine del livello vinta a 320x700 da scorrere di 2 px (font del container, `docs/TESTING.md:312`) | 18 s |
| `e2e-trionfo`, `e2e-ripresa`, `e2e-po008`, `e2e-salvataggio`, `e2e-sicurezza`, `e2e-attrezzi`, `e2e-scenografie`, guida, annulla, incitamenti, archivio, condivisione | verdi | 489 s |
| `recensione` | **rosso noto**: a 360x640 l'invito finisce 10 px sotto la barra (`docs/TESTING.md:313`) | 33 s |
| correzioni, anteprima, indietro, impaginazione, `home-spiegazione`, geometria | verdi | 269 s |
| **tutti i livelli, giocati nell'app** | **200 su 200 vinti**: 1-50 (1.671 s), 51-100 (1.757 s), 101-150 (1.676 s), 151-200 (1.733 s) | 6.837 s |
| precisione, prova da sottocartella, installazione, desktop, resistenza | verdi | 379 s |
| `e2e-schermi` | **rosso, non noto**: «orizzontale 1024x600 / menu: non ci si arriva». Tutto il resto verde, compreso il caso «torre». Vedi D2 | 639 s |

Il gate non e' stato lanciato come `npm run verifica` in un colpo solo, quindi non ha
scritto l'impronta del giro completo (`verifica-livelli.json`): la corsia veloce su questa
macchina resta negata, come deve.

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

### D2 — `e2e-schermi`: a 1024x600 coricato il tocco su «Menu» a volte non apre il menu (non della Torre, non corretto)

Nel gate, caso «menu» dei formati coricati: il pezzo e' appoggiato col dito, si aspetta
1 s, si tocca «Menu» e il menu non si apre (`tests/e2e/schermi.mjs`, passo «menu»).
Misure del 26 ottobre:

- `opera-torre`, server di sviluppo, solo «orizzontale 1024x600»: rosso 2 giri su 5;
- **`rilascio/1.21.25` senza la Torre**, stesso comando: rosso 1 giro su 6. Quindi non nasce
  dall'unione: c'e' gia' nella 1.21.25;
- sonda sulla build di produzione (`vite preview`), 1024x600 col tocco, pezzo trascinato
  col dito, 1,2 s di attesa, tocco su «Menu»: menu non aperto 2 volte su 15. Sul pulsante
  arrivano `pointerdown`, `touchstart`, `pointerup`, `touchend`, ma **nessun `click`**;
- la stessa sonda **senza** il trascinamento prima: 0 su 15.

Il gioco non sopprime click dopo un trascinamento (`src/ui/useTrascinamento.js:158-160`
ascolta solo `pointermove`, `pointerup`, `pointercancel` sulla finestra). Somiglia al «tocco
perso dopo un trascinamento» della scelta 4 di PO-035 (li' entro ~200 ms; qui anche dopo
1,2 s). La causa non posso confermarla: Chromium di prova o gioco. Sul telefono del PO, in
verticale, il tocco su «Menu» subito dopo un pezzo appoggiato funziona (DECISIONI, 22
ottobre); in orizzontale non e' stato provato. La 1.21.25 e' gia' in revisione con questo
codice. Opzioni:

1. **(consigliata)** la madre lo indaga sulla 1.21.25 / `main` (e' li' che nasce, e il gate
   della 1.21.25 puo' trovarlo rosso allo stesso modo), con la sonda di questo rapporto; poi
   si riporta sulla Torre con la prossima unione. Insieme: prova del PO col telefono coricato.
2. Rendere la prova robusta qui (ritoccare «Menu» se il click non arriva): la renderebbe
   verde nascondendo un tocco perso che potrebbe essere vero. Non fatta.
3. Lasciarlo come rosso noto: non consigliato, finche' la causa non e' nota.

Non l'ho corretto sul ramo: senza la causa, una correzione sarebbe un tentativo.

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
- D2 (tocco su «Menu» perso dopo un trascinamento, telefono coricato) da chiudere su `main`.
- Non verificabili da qui: TalkBack sulle schede della mappa e sui massi, telefono di fascia
  bassa, iPhone.
