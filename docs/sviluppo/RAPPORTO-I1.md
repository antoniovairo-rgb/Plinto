# I1 — dopo «Nuova partita» da una sfida, la ricarica riapriva la sfida (per la 1.21.14)

Ramo `sviluppo/i1-1.21.14`, partito da `main` `4d65c5b` (1.21.13). Versione, CHANGELOG e ROADMAP non toccati; niente pubblicato.

## Il difetto
Dal collaudo 1.21.12 (`collaudo/RAPPORTO-1.21.12.md`, ramo `collaudo-1.21.12`): dentro una sfida, menu → «Nuova partita» (oppure «Riprendi la partita» nella domanda di H1) porta alla libera ma l'indirizzo resta `#/sfida/<giorno>`. Alla ricarica l'effetto sulla rotta (`src/ui/App.jsx`, `useEffect` con `rotta.nome !== 'sfida'`) apre la sfida, e la ripresa automatica si ferma (`if (rotta && rotta.nome === 'sfida') return;`). L'ipotesi del collaudo era giusta: `avviaNuovaLibera` e `onTorna` di `iniziaNuova` non chiamavano `scriviRotta('')`.

## La correzione (decisione della madre: opzione 1)
`src/ui/App.jsx`, interruttore **`ANCORA_VIA_DALLA_LIBERA`** (esportato, accanto agli altri):
1. `avviaNuovaLibera`: `scriviRotta('')` prima di `nuovaPartita()`.
2. `onTorna` della domanda di `iniziaNuova`: `scriviRotta('')` quando si entra nella libera.
3. `normalizza` passato a `useTastoIndietro`: con `schermata === 'gioco'` e `modalita === 'libera'` si ripulisce l'ancora. Serve perché, chiudendo menu e domanda, `useTastoIndietro` torna con `history.go(-n)` sulla voce scritta quando si era nella sfida, che porta ancora `#/sfida/<giorno>`; senza questo punto l'ancora tornerebbe dopo la chiusura del menu. **Non l'ho misurato separatamente** dagli altri due punti (l'interruttore li spegne tutti e tre insieme): è una deduzione dal codice di `useTastoIndietro.js` (`window.history.go(-gradini)` e `rimetti.current?.()` sui `popstate` ignorati).

Il testo della domanda non cambia. Nessun testo per il giocatore toccato, quindi niente da aggiornare nell'aiuto.

## Controllo automatico: caso O in `tests/e2e/ripresa-livello.mjs` (`npm run e2e-po008`)
Due strade: (a) sfida con 3 mosse → menu → «Nuova partita» → 2 mosse → ricarica; (b) libera a metà, poi sfida con 3 mosse → menu → «Nuova partita» → domanda → «Riprendi la partita» → ricarica. Dopo la ricarica si controlla quale partita è a schermo (presenza di `.pl-modalita--sfida`, perché il solo punteggio può coincidere fra le due partite: mi è successo durante la scrittura del caso), l'ancora nella libera, e che Indietro dopo la ricarica porti alla home senza ancora.

### Misure prima e dopo
Sonda del collaudo (`collaudo/sonda-indirizzo-1.21.12.mjs`, copiata su questo ramo) sul server di sviluppo, **prima** della correzione:
```
1. in SFIDA         PUNTEGGIO 9 RECORD 0 | hash #/sfida/2026-10-18
2. in LIBERA nuova  PUNTEGGIO 3 RECORD 0 | hash #/sfida/2026-10-18
3. dopo RELOAD      PUNTEGGIO 9 RECORD 0 | hash
```
Dopo la correzione la stessa sonda dà `hash` vuoto già al punto 2 e dopo la ricarica il punteggio della libera (0: in quel giro le mosse della sonda sulla libera non sono andate a segno, la sonda sceglie caselle a caso; per questo la prova vera è il caso O).

### Prova rosso/verde
| Dove | Interruttore | Esito caso O |
|---|---|---|
| sviluppo (`vite`, 5173) | acceso | verde: tutte e due le strade → `libera`, ancora «», Indietro: home «» |
| sviluppo | spento | **rosso**, 5 problemi: «dopo la ricarica si ritrova la SFIDA», «nella libera l'indirizzo e' «#/sfida/2026-10-18»», (b) «si riparte da zero (PUNTEGGIO 2 → PUNTEGGIO 4)» |
| produzione (`npm run build` + `npx vite preview --port 4173`, `PLINTO_E2E_URL=http://127.0.0.1:4173/`) | acceso | verde, `exit 0`, «Tutto a posto.» |
| produzione | spento | **rosso**, `exit 1`, 6 problemi: per tutte e due le strade «si riparte da zero (PUNTEGGIO 3 → PUNTEGGIO 4)», «dopo la ricarica si ritrova la SFIDA, non la libera», «nella libera l'indirizzo e' «#/sfida/2026-10-18»» |

Righe del caso O sulla build di produzione, spento:
```
| O sfida, menu, Nuova partita, ricarico | sfida | SI | ancora prima «#/sfida/2026-10-18», dopo «#/sfida/2026-10-18»; Indietro: home «» |
| O sfida, menu, Riprendi la partita (libera), ricarico | sfida | SI | ancora prima «#/sfida/2026-10-18», dopo «#/sfida/2026-10-18»; Indietro: home «» |
```
acceso:
```
| O sfida, menu, Nuova partita, ricarico | libera | no | ancora prima «», dopo «»; Indietro: home «» |
| O sfida, menu, Riprendi la partita (libera), ricarico | libera | no | ancora prima «», dopo «»; Indietro: home «» |
```
Una stranezza che non so spiegare: in sviluppo con l'interruttore spento la colonna «dopo» diceva ancora «» (vuota) pur riaprendo la sfida, mentre sulla build di produzione dice `#/sfida/2026-10-18`. Il controllo è rosso in tutti e due i casi per le altre ragioni. Non posso confermare da dove venga la differenza.

Dopo la prova la build è stata rifatta con l'interruttore acceso; `git diff` conferma `ANCORA_VIA_DALLA_LIBERA = true`.

### Cosa non si è rotto
- **G1** (`npm run indietro`): «ok G1: dalla home un collegamento alla sfida del 2026-10-10 apre quella sfida e tiene l ancora», «ok G1: dalla partita libera un collegamento alla sfida del 2026-10-11 apre quella sfida».
- **M** (`npm run e2e-po008`): «ancora: «#/sfida/2026-10-17»», verde.
- **B6** (`npm run correzioni`) e **Indietro** (`npm run indietro`): verdi; inoltre nel caso O Indietro dopo la ricarica porta alla home senza ancora.

## Comandi ed esiti (con la correzione, server avviati dagli script)
| Comando | Esito |
|---|---|
| `npm test` | exit 0 — 45 file, 649 test passati |
| `npm run build` | exit 0 |
| `npm run e2e` | exit 0 — «Nessun problema rilevato.» |
| `npm run e2e-scenografie` | exit 0 — «Nessun problema rilevato.» |
| `npm run correzioni` | exit 0 — «Tutto a posto: le correzioni del collaudo tengono.» |
| `npm run e2e-po008` | exit 0 — «Tutto a posto.» (casi A–O) |
| `npm run indietro` | exit 0 — «Tutte le verifiche del tasto Indietro sono passate.» |
| `npm run home-spiegazione` | exit 0 |
| `npm run impaginazione` | exit 0 |
| `npm run comunicazioni` | exit 0 |
| `node tests/e2e/trionfo.mjs` | exit 0 — «Tutto a posto.» |

Nessuna prova rossa, quindi nessun confronto con `main` necessario.

## Scelte lasciate al PO / alla madre
- Il caso O non è registrato come script nuovo in `tools/verifica-tutto.mjs`: vive dentro `ripresa-livello.mjs` (`npm run e2e-po008`), che il gate già esegue — **non ho verificato** la riga del gate; lo deduco dal fatto che i casi J–N sono nello stesso file.
- Dentro una sfida la domanda di H1 parla di «partita libera» e non nomina la sfida lasciata (osservazione già nel collaudo 1.21.12): non toccata, come deciso.

## Non verificato
- Android/TWA reale con ricarica vera da secondo piano: simulata con `page.reload()` in Chromium.
- Il punto 3 della correzione (ripulire in `normalizza`) da solo: non isolato con un interruttore proprio.
- Altre strade che dalla sfida portano alla libera oltre al menu (per esempio la schermata di fine sfida, se ha «Nuova partita»): passano da `iniziaNuova`/`avviaNuovaLibera` secondo il codice, ma **non le ho provate**.
- `npm run verifica` non lanciato (come richiesto).

## Commit
- `I1: entrare nella libera ripulisce l'indirizzo della sfida` (correzione + caso O + sonda copiata)
- `Collaudo 1.21.13: PO-011 riconfermato in produzione`
- questo rapporto (hash finale nella risposta alla madre; `git log -1` sul ramo).
