# Rapporto PO-039 — ricarica su una Sfida del giorno finita

Figlia, 30 ottobre 2026, ramo `po039-sfida-ricarica` (da `po038-fine-partita` a `fa9dd11`: `main`
1.21.27 più la pausa a fine partita). Niente su `main`, nessun cambio di versione, `android/` non
toccato. Fonti: `docs/sviluppo/RAPPORTO-PO-038.md` (scelta 3, «E1»), ultime righe di
`docs/DECISIONI.md`. In `docs/BACKLOG.md` di questo ramo la voce PO-039 **non c'è** (l'ultima è
PO-038): l'ho presa dal compito della madre. Chromium di prova: `/opt/pw-browsers/chromium`, headless.

## In breve

| richiesta | fatto | come si prova |
|---|---|---|
| sfida finita → ricarica → home | **sì**, nella pausa e dal risultato | `npm run archivio` 5b e 7; `npm run e2e` passo 8 |
| salvataggio della sfida assente dopo la ricarica | **sì** | idem |
| esito del giorno nell'archivio intatto | **sì** (`best` e `partite` uguali prima e dopo la ricarica) | `npm run archivio` 5b e 7 |
| sfida a metà → ricarica → riprende | **sì** (63 blocchi, 1234 punti, ancora al suo posto) | `npm run archivio` 8 |
| archivio: rigiocare un giorno passato | invariato | `npm run archivio` 4–7 |
| «Gioca ancora» dal risultato | rimette l'ancora; ricaricando si riprende la sfida nuova | `npm run archivio` 7b |
| scheda condivisibile «la stessa sfida» | invariata: il giorno viene da `partita.seedLabel` (`App.jsx`, `giornoSfida`), l'indirizzo da `origin` + `pathname` (`src/ui/Condividi.jsx:50`), mai dall'ancora | `npm run condivisione` verde |
| tasto Indietro di Android | invariato | `npm run indietro` verde, passo 8 di `npm run e2e` (salti con Indietro) verde |

Interruttore: `export const ANCORA_VIA_A_SFIDA_FINITA = true;` in `src/ui/App.jsx`, con commento.

## Misura prima di correggere (build di produzione, `vite preview`)

Casi nuovi di `tests/e2e/archivio.mjs`, eseguiti sul codice di `po038-fine-partita` senza correzione
(sfida del 29 ottobre riaperta dall'archivio a una mossa dalla fine):

```
5b. ricarica nella pausa: ancora prima "#/sfida/2026-10-29", dopo "#/sfida/2026-10-29" | home 0, plancia 1 |
    salvataggio della sfida PRESENTE (punti 0, mosse 0) | esito del 2026-10-29: {"best":1235,"partite":1}
7.  ricarica dal risultato: (uguale) ... salvataggio della sfida PRESENTE (punti 0, mosse 0) |
    esito del 2026-10-29: {"best":1235,"partite":2}
8.  sfida a meta' ricaricata: ancora "#/sfida/2026-10-29" -> "#/sfida/2026-10-29", 63 blocchi, punti salvati 1234
```

Quindi il difetto è confermato in tutti e due i momenti; l'esito già registrato **non** veniva
toccato (la sfida nuova da zero non era finita), ma la home mostrava poi «Riprendi la sfida» di una
partita mai chiesta. La sfida a metà già si riprendeva.

## Causa

Due strade rimettevano l'ancora, e servono tutte e due:

1. L'ancora `#/sfida/<giorno>` è scritta all'apertura della sfida (`apriSfida`) e tolta solo da
   `tornaAllaHome` o dalla libera: a sfida finita restava sulla voce corrente.
2. La pausa di PO-038 è un gradino di cronologia (`pushState`, che copia l'indirizzo con l'ancora).
   Quando finisce, `useTastoIndietro` fa `go(-1)` e chiama `normalizza`, che per
   `ANCORA_SFIDA_DOPO_INDIETRO` riscriveva `rottaSfida(partita.seedLabel)` perché si è ancora nella
   schermata `gioco` in modalità `sfida`.

Misura della seconda: togliendo solo la riga in `normalizza` (correzione a metà), 5b diventa verde
ma 7 resta rosso («ricarica dal risultato: ... salvataggio della sfida PRESENTE (punti 0, mosse 0)»).

## Correzione

`src/ui/App.jsx`:

- `sfidaFinita = schermata === 'gioco' && modalita === 'sfida' && finita`; un effetto toglie
  l'ancora (`scriviRotta('')`) quando diventa vera;
- in `normalizza` (terzo argomento di `useTastoIndietro`), a sfida finita si toglie l'ancora invece
  di rimetterla.

`scriviRotta` usa `replaceState`, che non manda `hashchange`: lo stato `rotta` resta quello di
prima e l'effetto che apre la sfida non riparte. «Gioca ancora» passa da `apriSfida`, che riscrive
l'ancora; la partita nuova è `playing`, quindi l'effetto non la ritoglie (caso 7b).

## Rosso / verde

Interruttore spento e riacceso con la stessa sed
(`s/^export const ANCORA_VIA_A_SFIDA_FINITA = true;/... = false;/` e ritorno), build ricostruita
ogni volta, prove contro `vite preview`:

| prova | acceso | spento |
|---|---|---|
| `npm run archivio` | verde (5b, 7, 7b, 8) | **4 problemi**: 5b e 7 «non si torna alla home» e «c'e' una sfida salvata viva (punti 0)» |
| `npm run e2e` passo 8 (stretto in questo ramo) | verde: «ricarica durante la pausa (sfida): plancia 0, home 1, salvataggio assente, posto assente, ancora ""» | **1 problema**: «plancia 1, home 0, ancora "#/sfida/2026-10-30", salvataggio presente» |

Dopo la riaccensione `git diff` sul file è vuoto.

Il passo 8 di `tests/e2e/partita.mjs` (PO-038) per la sfida controllava solo che la partita finita
non tornasse viva, proprio perché l'ancora ne apriva una nuova: ora chiede home e salvataggio
assente come per la libera.

## Prove vicine (build di produzione, codice corretto)

`indietro`, `condivisione`, `ripresa`, `ripresa-livello`, `correzioni`, `partita`: tutte uscita 0.

## Gate

- `npm run build`: ok.
- `npm test`: **45 file, 655 test su 655**.
- `npm run verifica -- --veloce`: la corsia veloce è stata **negata** («non risulta nessun giro
  completo passato su questa macchina»), quindi è girato il gate **completo**, cento livelli compresi,
  in 2629 s: **31 su 33**. Rossi solo i due noti dei container (`docs/TESTING.md`):
  `e2e-quadri` «FINE LIVELLO (vittoria): a 320x700 bisogna scorrere di 2 px» e `recensione` «a
  360x640 l invito finisce 10px sotto la barra dei pulsanti». Verdi fra gli altri «archivio delle
  sfide nel browser», «tasto Indietro di Android», «scheda condivisibile», «tutti e cento i livelli».
- Il gate è girato **prima** del terzo commit (`4b8a1ea`, solo la prova `partita.mjs` stretta e
  TESTING): quella prova l'ho rieseguita da sola sulla build, verde acceso e rossa spenta (sopra).
  Il verdetto che conta resta quello della CI.

## Testo per il changelog (versione da decidere alla pubblicazione)

```
### Corretto

- **Ricaricando su una Sfida del giorno finita si torna alla home** (PO-039). Finita la sfida,
  l'indirizzo teneva `#/sfida/<giorno>`: ricaricando la pagina (nell'app succede da solo dopo
  un secondo piano), sul risultato o durante la pausa sulla plancia, si apriva una sfida nuova
  da zero dello stesso giorno, con una partita salvata a 0 punti e la home che proponeva
  «Riprendi la sfida». Ora, come per la partita libera, si torna alla home; il risultato del
  giorno nell'archivio non cambia, una sfida lasciata a metà si riprende come prima e «Gioca
  ancora» apre di nuovo la sfida. Misurato sulla build di produzione: salvataggio a 0 punti
  prima, assente dopo. Interruttore `ANCORA_VIA_A_SFIDA_FINITA`; casi 5b, 7, 7b e 8 in
  `npm run archivio`, passo 8 di `npm run e2e`.
```

Aiuto (`ComeSiGioca.jsx`): non toccato, nessuna regola né numero cambia; `tests/aiuto-aggiornato.test.js` verde.

## Scelte aperte (la consigliata per prima, ed è quella fatta)

1. **Come.** A: togliere l'ancora quando la sfida finisce (fatta, decisione della madre; il
   collegamento resta un punto d'ingresso e niente di più). B: renderla innocua all'avvio (se il
   giorno ha già un esito e non c'è una sfida salvata, home): toglierebbe anche la possibilità di
   rigiocare un giorno già giocato aprendo il collegamento di un amico. C: ricordare il risultato
   e mostrarlo dopo la ricarica: oggi non lo fa nessuna partita (`RAPPORTO-PO-038.md`, scelta 3).
2. **Collegamento allo stesso giorno aperto dal risultato.** Dal codice: con la scheda già sul
   risultato di una sfida, un collegamento `#/sfida/<stesso giorno>` cade nella guardia «già dentro
   quella sfida» (`src/ui/App.jsx`, effetto della rotta: `modalita === 'sfida' && partita?.seedLabel
   === rotta.giorno`) e non apre niente, lasciando l'ancora nell'indirizzo. La guardia c'era già
   prima di questo ramo. **Non l'ho misurato**: non posso confermare che cosa succede in quel caso
   ricaricando. A: lasciare (caso raro, non è il difetto chiesto). B: misurarlo in una voce a parte.
3. Nota: la corsia veloce del gate è negata in ogni contenitore nuovo; chi lancia `--veloce` in una
   figlia deve prevedere ~45 minuti, non ~10.
