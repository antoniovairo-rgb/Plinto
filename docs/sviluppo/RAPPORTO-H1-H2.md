# Rapporto H1 e H2 (collaudo 1.21.11)

Ramo `sviluppo/h1-h2-1.21.12`, partito da `main` a `dace2f9` (1.21.11). Versione,
CHANGELOG e ROADMAP non toccati; niente pubblicato; `npm run verifica` completo non
lanciato.

## H1 — nuova partita libera con una libera a metà

**Difetto (rapporto del collaudo):** «Nuova partita libera» in home cancellava la libera
in corso senza chiedere. **Decisione del PO:** «Conferma come gli altri».

**Correzione.** La domanda sta in `iniziaNuova` (`src/ui/App.jsx`), che è la sola
funzione che comincia una libera: così vale per ogni strada che la chiama — home
(collegamento «Nuova partita libera»), menu della partita («Nuova partita»), fine partita
(«Gioca ancora»), festa finale («Gioca in partita libera»), profilo e statistiche vuoti
(«Gioca una partita»). Chiede solo se la libera salvata è in corso **e** ha almeno una
mossa (`liberaAMeta` in `src/state/usePartita.js`, stessa regola di `sfidaAMeta`). Usa lo
stesso dialogo di PO-008 (`ConfermaPerdita`); Indietro lo chiude già senza perdere niente
(`passoIndietro`, `src/ui/App.jsx`). La festa finale ritorna prima della radice comune e
non mostrava il dialogo: aggiunto `{finestraConferma}` anche lì.

Fine partita libera: la partita è finita, il salvataggio è già rimosso
(`usePartita.js`, effetto di salvataggio), quindi «Gioca ancora» non chiede niente — per
costruzione, non c'è un caso e2e dedicato (vedi «Non verificato»).

### Testi

| Chiave `conferma.*` | Italiano | Inglese |
|---|---|---|
| `liberaTitolo` | La partita libera è a metà. | Your free game is in progress. |
| `liberaTesto` | Se inizi una nuova partita, perdi le mosse fatte in quella a metà. | If you start a new game, you lose the moves you made in this one. |
| `riprendiLibera` (evidenziato, con il fuoco) | Riprendi la partita | Resume game |
| `nuovaLibera` (perde) | Nuova partita | New game |

«Riprendi la partita» e «Nuova partita» sono le stesse parole già usate per la libera in
home (`home.riprendi`, `home.nuovaPartita`): una parola per una cosa sola. In inglese
`Your free game is in progress.` segue la forma di `livelloTitolo` («Level {n} is in
progress.»).

### Schermate a 360×640 (build di produzione)

- `docs/sviluppo/conferma-libera-it.png`
- `docs/sviluppo/conferma-libera-en.png`

Libera con due mosse, «Torna alla home», tocco su «Nuova partita libera». Tutte le righe
stanno su una riga tranne il testo (due righe in entrambe le lingue).

## H2 — 1 px di scorrimento a 320×700

**Correzione.** Classe `pl-fine--atto-chiuso` sulla fine del livello quando l'atto è
appena chiuso (`src/ui/schermate/FineQuadro.jsx`) e una regola in `src/styles/app.css`
valida solo con `max-width: 340px` **e** `max-height: 720px`: il margine sopra la fascia
dell'atto passa da 14 a 8 px (6 px recuperati, contro 1 px misurato in eccesso). Altrove
la regola non si applica, quindi l'aspetto non cambia.

### Misure (`node tests/e2e/trionfo.mjs`, `.pl-fine .pl-scroll`, scrollHeight − clientHeight)

| Finestra | Prima (interruttore spento) | Dopo |
|---|---|---|
| 390×844 | sta tutta | sta tutta |
| 360×800 | sta tutta | sta tutta |
| 360×740 | sta tutta | sta tutta |
| **320×700** | **1 px da scorrere** | **sta tutta** |
| 1920×1080 | sta tutta | sta tutta |
| 1366×768 | sta tutta | sta tutta |

Stessi numeri in sviluppo e sulla build di produzione.

## Interruttori e prova rosso/verde

| Interruttore | File | Controllo | Acceso | Spento |
|---|---|---|---|---|
| `CONFERMA_NUOVA_LIBERA` | `src/ui/App.jsx` | caso N di `tests/e2e/ripresa-livello.mjs` (`npm run e2e-po008`) | N: 5 strade «domanda», zero mosse senza domanda; A–M invariati; uscita 0 «Tutto a posto» | N home, menu, profilo, statistiche, festa finale: «Riparte da 0: SI», «nessuna domanda»; uscita 1 (10 problemi) |
| `ATTO_CHIUSO_COMPATTO` | `src/ui/schermate/FineQuadro.jsx` | `tests/e2e/trionfo.mjs` (`npm run e2e-trionfo`), misura a 320×700 | uscita 0 «Tutto a posto» | «ATTO: a 320x700 la fine del livello va scorsa di 1 px»; uscita 1 |

Fatto due volte: in sviluppo (server Vite) e sulla build di produzione (`npm run build`,
`npx vite preview --port 4173 --strictPort`, `PLINTO_E2E_URL=http://127.0.0.1:4173/`),
con risultato identico. Nel giro di produzione il server della build verde è stato
fermato e la porta 4173 era libera prima di ricostruire la rossa (`--strictPort`: un
server rimasto acceso avrebbe fatto fallire l'avvio, non servito la build vecchia).

### Caso N (nuovo, in `tests/e2e/ripresa-livello.mjs`)

Libera con due mosse, poi una nuova libera chiesta da: **home**, **menu della partita**,
**profilo**, **statistiche**, **festa finale** (99 livelli scritti come superati, livello 1
vinto davvero). Per ognuna: la domanda c'è; il fuoco è su «Riprendi la partita»; Indietro
la chiude restando sulla stessa schermata; «Riprendi la partita» riporta nella stessa
partita (firma uguale). Dalla home si prova anche «Nuova partita»: comincia una partita
diversa. In più: libera a zero mosse → nessuna domanda, la nuova partita parte.

## Prove adattate o toccate

- `tests/e2e/ripresa-livello.mjs`: caso N aggiunto (sopra).
- `tests/e2e/trionfo.mjs`: `sequenzaVincente` e `posizioneMossa` spostate in
  `tools/sequenza-vincente.mjs` (servono anche al caso N); comportamento invariato.
- Ricerca in `tests/` e `tools/` di prove che iniziano una nuova libera («Nuova partita»,
  `.pl-home__nuova-libera`, «Gioca ancora», «Gioca in partita libera», «Gioca una
  partita»): `home-spiegazione.mjs` misura il collegamento senza toccarlo;
  `indietro.mjs:141` tocca `/^Nuova partita|^Partita libera/` su storage vuoto (nessuna
  libera a metà); `resistenza.mjs:196` tocca «Gioca ancora» a partita finita. Nessuna
  ha richiesto modifiche: vedi l'esito sotto.

## Controlli eseguiti

<!-- ESITI -->

## Scelte di dettaglio (con la consigliata, già applicata)

1. **Quando chiedere.** (a) *Consigliata, applicata:* libera in corso con almeno una
   mossa, come la sfida (`sfidaAMeta`). (b) Qualunque libera salvata, anche a zero mosse:
   una domanda in più per una partita che ricomincia uguale (seme nuovo, nessuna mossa
   persa).
2. **Dal menu della libera stessa, «Riprendi la partita».** (a) *Consigliata,
   applicata:* chiude la domanda e il menu, la partita resta quella a schermo (si
   conserva anche la mossa da annullare). (b) Ricaricarla dal salvataggio come dalle
   altre strade: stessa partita, ma si perde l'annulla.
3. **Testi.** (a) *Consigliata, applicata:* quelli in tabella, con le parole già usate in
   home. (b) «Inizia una nuova partita» come pulsante che perde: più esplicito ma più
   lungo; la decisione nomina «Nuova partita».
4. **H2.** (a) *Consigliata, applicata:* −6 px sopra la fascia solo sotto 340×720.
   (b) Ridurre `padding-top` dello scorrimento della fine livello: tocca tutte le fini
   livello affollate, non solo quella con l'atto. (c) Ridurre il Plinto da 56 px:
   cambia l'aspetto in modo visibile.
5. **Aiuto («Come si gioca»).** Nessuna riga nuova, come per le altre conferme di PO-008
   (`RAPPORTO-CONFERMA.md`, scelta 4): non è una meccanica né una costante.

## Non verificato

- Su un telefono Android vero (TWA) il tasto Indietro fisico: provato solo con
  `page.goBack()` di Playwright, come i casi J, K, L.
- «Gioca ancora» dalla fine di una partita libera: non chiede per costruzione (il
  salvataggio di una partita finita è rimosso), ma non c'è un caso e2e che lo misuri.
  Non posso confermarlo da una prova.
- H2 con il font del telefono del collaudo: il difetto «dipende dal font del container».
  Misurato solo con il font di questo container; il margine recuperato (6 px) è sei volte
  l'eccesso misurato, ma con un altro font non posso confermarlo.
- Lo spazio libero rimasto a 320×700 dopo la correzione: lo script dice solo «sta
  tutta» (eccesso ≤ 0), non quanti pixel avanzano.

## Commit

<!-- COMMIT -->
