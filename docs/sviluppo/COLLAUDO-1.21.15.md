# Collaudo della 1.21.15 pubblicata

Ramo `collaudo-1.21.15`, partito da `main` a `c908302`. Nessuna correzione al codice del
gioco, versione non toccata, `android/` non toccato, niente pubblicato su `main`.

## Cosa è stato provato e dove

- **Sito pubblicato**: `https://antoniovairo-rgb.github.io/Plinto/`, 18-19 ottobre 2026.
  Il bundle servito è `assets/index-_hp9kYf1.js` e contiene `versione:"1.21.15"`,
  `versioneGioco:"1.21.15"` e `register("./sw.js?v=1.21.15")` (letto con `curl`).
- **Confronto con la 1.21.14**: build locale del commit `dfec9a5` (`package.json`
  `"version": "1.21.14"`), in un worktree, servita con `vite preview` sulla porta 4174.
  Bundle `index-AHS7u5ar.js`, contiene `versione:"1.21.14"`.
- **Browser**: Chromium 141.0.7390.37 del container (`/opt/pw-browsers/chromium-1194`).
- **Font**: il gioco usa i font di sistema (`src/styles/tokens.css:93-94`). Nel container
  Chromium disegna con **Inter** (misurato con `CSS.getPlatformFontsForNode` sul sito
  pubblicato: «Inter», «Inter SemiBold»). Su Android il font di sistema è Roboto e su
  Windows Segoe UI: le misure al pixel possono essere diverse sui dispositivi veri.

Strumenti nuovi, solo misura (non sono nel gate e non falliscono):

- `docs/sviluppo/collaudo-1.21.15/sonda-fine.mjs`: porta la fine del livello in cinque
  casi e la misura a 9 formati. I casi: vittoria normale; vittoria con il **solo
  gettone** (livelli 2-5 superati, vinco l'1: quinto superato, `OGNI_LIVELLI = 5`,
  `src/persistence/attrezzi.js:32`); vittoria con **atto chiuso e gettone** (2-10
  superati); **sconfitta**; sconfitta con la **strada aperta** (7 tentativi sul livello 1,
  l'ottavo apre il 2: riquadro verde e un pulsante in più). Il livello 1 si gioca davvero,
  trascinando, con la sequenza del motore di `tests/e2e/quadri.mjs`.
- `docs/sviluppo/collaudo-1.21.15/sonda-telefono.mjs`: attraversa lo stesso percorso su
  due build e confronta scorrimenti, posizione e misura di ogni pulsante e titolo.
  **Fatta fallire di proposito**: a 1366x768, dove so che le due versioni differiscono,
  segnala la fine del livello (0 contro 6 px, tre pulsanti spostati di 28-35 px).

Le misure grezze sono nella stessa cartella: `misure-1.21.15-pubblicata.jsonl`,
`misure-1.21.14-locale.jsonl`, `telefono-confronto.jsonl` e i registri degli e2e.

## In breve

| # | prova | esito |
|---|---|---|
| 1 | `e2e-schermi` sul sito pubblicato | **verde**, uscita 0, 13 formati + 5 telefoni di riferimento |
| 2 | fine del livello normale su PC e tablet bassi | **corretta**: 0 px da scorrere ovunque (nella 1.21.14: 54, 50, 6, 6 px) |
| 2 | fine col **solo gettone** su PC e tablet bassi | **scorre**: 66, 61, 16, 16 px. **Identica nella 1.21.14**: difetto che c'era già (E1) |
| 2 | fine con atto chiuso e gettone | scorre a 1366x657 (44 px) e 1280x720 (39 px), identica nella 1.21.14 |
| 2 | sconfitta, anche con la strada aperta | non scorre su nessun formato; **Plinto più piccolo** su PC bassi (O1) |
| 2 | telefoni 360x640 e 320x700 | **identici alla 1.21.14** in tutti e cinque i casi |
| 3 | regressioni sul telefono (360x640, 390x844, 412x915) | **nessuna**: 27 schermate su 27 uguali alla 1.21.14, zero errori in console |
| 3 | `e2e-quadri` sul sito pubblicato | **rosso**: 320x700, 2 px. **Identico sulla 1.21.14** |
| 3 | `recensione` sul sito pubblicato | **rosso**: 360x640, invito 10 px sotto. **Identico sulla 1.21.14** |

Difetti nuovi della 1.21.15: **nessuno trovato**. Un difetto che c'era già e che nessuna
prova misura (E1), un effetto collaterale non annunciato (O1), due rossi che dipendono
dall'ambiente (E2).

## 1. `e2e-schermi` sul sito pubblicato

`PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/ node tests/e2e/schermi.mjs`:
uscita 0, «Tutto a posto su 13 formati». Tutte le 15 colonne «ok» su tutti i formati,
compresi 1366x768, 1024x768 (mouse e tocco), 1280x720, 1366x657 e 1920x969. Elenca a parte,
senza fallire, i bersagli sotto i 44 px che sono uguali sul telefono (già nel rapporto
PO-014, P4): «Sostieni il progetto» e «Idee e segnalazioni» 27 px, la pastiglia vuota degli
attrezzi 38 px, i giorni dell'archivio 43 px. Registro: `e2e-schermi-pubblicata.log`.

## 2. Fine del livello: cinque casi, nove formati

`scrollHeight − clientHeight` di `.pl-fine .pl-scroll`, in px. 0 = sta tutta nello schermo.
Fra parentesi la 1.21.14 locale, quando è diversa.

| formato | normale | solo gettone | atto + gettone | sconfitta | sconfitta + strada |
|---|---|---|---|---|---|
| 1366x657 (colonna) | **0** (54) | **66** | **44** | 0 | 0 |
| 1280x720 (cornice 430x662) | **0** (50) | **61** | **39** | 0 | 0 |
| 1366x768 (cornice 430x707) | **0** (6) | **16** | 0 | 0 | 0 |
| 1024x768 (cornice 430x707) | **0** (6) | **16** | 0 | 0 | 0 |
| 1920x969 (cornice 430x891) | 0 | 0 | 0 | 0 | 0 |
| 360x640 | 61 | **83** | 61 | 0 | 0 |
| 320x700 | 2 | **23** | 0 | 0 | 0 |
| 390x844 | 0 | 0 | 0 | 0 | 0 |
| 412x915 | 0 | 0 | 0 | 0 | 0 |

In tutte le 45 misure: **nessuna sovrapposizione** fra il contenuto visibile e i pulsanti
in basso (0 px), **nessun pulsante fuori** dalla cornice o dalla finestra, documento che
non scorre (0 px), **zero errori** in console.

Che cosa resta sotto il bordo quando scorre (figli di `.pl-scroll` oltre il bordo visibile):
sempre e solo il pulsante **«Condividi il risultato»** (`pl-condividi`): 50 px a 1366x657
col gettone, 45 a 1280x720, 67 a 360x640, 7 a 320x700. A 1366x768 e 1024x768 col gettone
**nessun elemento** è oltre il bordo: i 16 px sono spazio vuoto in fondo.

Schermate: `fine-pub-gettone-1366x657.png` (di «Condividi» si vede solo il filo del bordo
sopra «Livello successivo»), `fine-pub-gettone-1280x720.png`, `fine-pub-gettone-1366x768.png`,
`fine-pub-gettone-360x640.png`, `fine-pub-gettone-320x700.png`,
`fine-pub-atto-gettone-1366x657.png`, `fine-pub-normale-1366x768.png` contro
`fine-v14-normale-1366x768.png`.

Le classi e le misure lette sulla pagina confermano che le regole nuove scattano solo
sopra i 720 px di larghezza: numero delle mosse a 50 px e Plinto a 56 px a 1366x657,
1280x720, 1366x768, 1024x768 (nella 1.21.14: 60 e 92); a 1920x969 restano 60 e 92; su
tutti i telefoni le misure sono quelle della 1.21.14.

## 3. Regressioni sul telefono

Sonda di confronto, sito pubblicato contro 1.21.14 locale, telefono col tocco
(`isMobile`, densità 2): home, partita libera, menu della partita, sfida del giorno, mappa,
apertura del livello 1, livello 1 giocato fino alla fine, archivio. 360x640, 390x844,
412x915: **27 schermate su 27 uguali** (stessi scorrimenti, stessi pulsanti e titoli nelle
stesse posizioni e misure), zero errori in console in entrambe. Schermate controllate a
occhio per menu aperto, sfida, fine e archivio.

Scorrimenti presenti uguali nelle due versioni (non sono regressioni): mappa (è una lista),
apertura del livello a 360x640 (177 px), archivio a 360x640 (17 px), fine del livello a
360x640 (61 px, vedi sopra).

### `e2e-quadri` e `recensione`

Entrambi accettano `PLINTO_E2E_URL` (`tests/e2e/quadri.mjs:26`, `tests/e2e/recensione.mjs:33`).

| controllo | sito pubblicato (1.21.15) | 1.21.14 locale (`dfec9a5`) |
|---|---|---|
| `e2e-quadri` | rosso: fine del livello (vittoria) a **320x700, 2 px** | rosso: **320x700, 2 px** e 1366x768, 6 px |
| `recensione` | rosso: a **360x640** l'invito finisce **10 px** sotto la barra dei pulsanti | rosso: identico, **10 px** |

Il rosso è lo stesso nelle due versioni: non viene dalla 1.21.15 (che anzi toglie il
1366x768). Sulla CI la corsa di `verifica` su `main` a `c97017e` (codice del gioco ancora
1.21.14) è **verde** (run 154, 18 ottobre, 21:29-22:38 UTC): quindi sul runner questi due
controlli passano e nel container no. Che la causa sia il font (Inter nel container) è
coerente ma **Non posso confermarlo**: non conosco i font del runner e non ho misurato con
un altro font.

## Difetti e osservazioni

### E1 — La fine del livello col solo gettone scorre (c'era già nella 1.21.14)

**Riproduzione**: superare in ordine i livelli fino al quinto (oppure, per la prova:
progressi con i livelli 2-5 superati, poi vincere il livello 1). La fine del livello mostra
il riquadro del gettone **e** l'avanzamento sulla mappa (le tappe con Plinto e «5 di 100»):
`affollata` è vero (`src/ui/schermate/FineQuadro.jsx:71`), ma l'avanzamento resta perché
l'atto non si è chiuso (`FineQuadro.jsx:183`). Con l'atto chiuso, invece, l'avanzamento
lascia il posto alla fascia, ed è per questo che il caso «atto + gettone» è più corto del
caso «solo gettone».

**Misura**: tabella sopra. Su PC 66 px a 1366x657 e 61 a 1280x720; 16 px a 1366x768 e
1024x768; sul telefono 83 px a 360x640 e 23 a 320x700. Uguale nella 1.21.14.

**Quanto spesso**: giocando in ordine il gettone matura a 5, 10, 15 ... 100 livelli
superati; gli atti si chiudono a 10, 24, 40, 58, 76, 92, 100 (`ATTI` in
`src/config/quadri.js`). Quindi il caso «solo gettone» capita **17 volte** nel percorso
(5, 15, 20, 25, 30, 35, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95), più del caso «atto +
gettone» (3 volte) che è l'unico misurato dal gate.

**Perché nessuna prova lo vede**: `e2e-quadri` misura solo la fine normale
(`tests/e2e/quadri.mjs:122`), `e2e-trionfo` solo atto + gettone
(`tests/e2e/trionfo.mjs:301`), `e2e-schermi` solo la fine normale. Il requisito del
proprietario (commento in `src/styles/app.css:900-903`) dice che la fine del livello deve
stare tutta nello schermo da 320x700 a 1366x768.

**Che cosa perde il giocatore**: solo «Condividi il risultato», che per scelta sta in fondo
all'area che scorre (commento a `FineQuadro.jsx:253-264`). «Livello successivo» resta
sempre visibile. Gravità: bassa (nessun blocco), ma contraria al requisito scritto.

Proposte (cambi di prodotto: non fatti):
- A) Lasciare così e scrivere nel requisito che «Condividi» può restare sotto il bordo.
- B) **(consigliata)** Nella fine col gettone, l'avanzamento sulla mappa in forma ridotta
  (solo la barra «N di 100», senza le tappe con Plinto), con un interruttore come quelli
  della 1.21.15, **e** il caso «solo gettone» aggiunto a `e2e-quadri` o `e2e-trionfo` a
  tutti i formati di questo rapporto, così che la prova sia rossa prima della correzione.
  Quanti px fa risparmiare: **Non posso confermarlo** senza provarlo.
- C) Il riquadro del gettone su una riga sola (icona e «1 gettone in più · ne hai 1»)
  invece di tre righe: tocca un testo per il giocatore, quindi va riletto con la regola
  dei testi chiarissimi e con `tests/lessico.test.js`.

### O1 — Su PC e tablet bassi anche la sconfitta ha Plinto piccolo (non annunciato)

La regola `.pl-fine--compatta-larga .pl-fine__plinto svg { width: 56px; height: 56px; }`
(`src/styles/app.css:948`) vale per ogni fine del livello, non solo per la vittoria: a
1366x657, 1280x720, 1366x768 e 1024x768 Plinto dispiaciuto passa da 92-93 px (1.21.14) a
56-57 px. La sconfitta non scorreva neanche nella 1.21.14 (0 px su tutti i formati), quindi
lì la compattazione non serve. Il CHANGELOG parla solo della fine che scorreva. Schermate:
`fine-pub-sconfitta-1366x768.png` contro `fine-v14-sconfitta-1366x768.png`. Non è un
difetto di funzionamento: niente tagliato, niente sovrapposto.

- A) Lasciare così (aspetto uniforme su PC bassi) e scriverlo nel commento di
  `FINE_COMPATTA_SU_SCHERMO_LARGO_BASSO`.
- B) **(consigliata, insieme alla prossima correzione, non da sola)** Applicare la classe
  `pl-fine--compatta-larga` solo quando si è vinto: la sconfitta torna com'era nella
  1.21.14, misurabile con `sonda-fine.mjs` (caso «sconfitta», deve tornare 92 px e 0 px).
- C) Compattare solo quando serve davvero (misurando l'altezza in JS): più codice e più
  rischio per un guadagno solo estetico. Sconsigliata.

### E2 — `e2e-quadri` e `recensione` rossi nel container, verdi in CI

Sopra, sezione 3. Non sono della 1.21.15. Il problema pratico è che il gate locale nel
container non può mai essere tutto verde, e un rosso vero su quei formati sarebbe
indistinguibile.

- A) Lasciare: il verdetto che conta è quello della CI (CLAUDE.md).
- B) **(consigliata)** Annotare in `docs/TESTING.md` che nel container questi due rossi
  (320x700 2 px; recensione 360x640 10 px) sono noti, con il font misurato (Inter), e
  controllare quali font ha il runner della CI per sapere a quale dispositivo somigliano
  le sue misure.
- C) Installare nel container e nella CI un font con le metriche di Roboto, per misurare
  come su Android: tocca l'ambiente di prova di tutte le prove al pixel; da valutare con
  un giro completo.

## Non posso confermarlo

- **Esito della CI sulla 1.21.15**: alle 00:03 UTC del 19 ottobre le corse di `verifica`
  su `e8dc0e8` (run 155) e `c908302` (run 156) erano ancora **in corso**. Non ho letto il
  loro esito.
- **Dispositivi veri**: tutto è Chromium emulato. Safari/WebKit (iPad), Firefox e l'app
  installata da Google Play non sono provati.
- **Font**: misure fatte con Inter. Con Roboto (Android) o Segoe UI (Windows) i numeri al
  pixel, in particolare i 16 px a 1366x768 e i 2 px a 320x700, possono cambiare in un senso
  o nell'altro.
- **Altezza reale delle finestre su PC** (1366x657, 1920x969): stima di circa 110 px di
  barre, come nel rapporto PO-014.
- **Caso «solo atto chiuso» senza gettone** (livelli 24, 58, 76, 92): non misurato. Ha la
  fascia dell'atto senza il riquadro del gettone, quindi dovrebbe essere più corto di
  «atto + gettone», ma non l'ho verificato.
- **Fine del livello in inglese**: misurata solo in italiano.
- **Data**: la sfida del giorno è stata provata con l'orologio del container (18 ottobre).
