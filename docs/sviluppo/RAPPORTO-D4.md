# Rapporto D4 — il punteggio medio in Statistiche (voce PO-004)

Ramo `sviluppo/d4-1.21.10`, partito da `main` `b4be52c` (1.21.9). Versione, CHANGELOG e
ROADMAP non toccati; niente pubblicato.

## Il difetto

`src/ui/schermate/Statistiche.jsx:30` (su `b4be52c`):

```js
valore={Math.round(stats.punteggioTotale / numero(stats.partite))}
```

`numero()` (`src/i18n/formato.js:22`) restituisce una **stringa** con i separatori della
lingua. Divisa, JavaScript la converte in numero: «1,000» non è un numero (NaN), «10.000»
vale 10.

### Da quali dati viene

- Un solo documento, `plinto:statistiche`, letto da `loadStats()` (`src/persistence/records.js:76`).
- Lo scrive solo `recordGame()` (`records.js:90-116`): `partite += 1` e
  `punteggioTotale += summary.score` per **Partita libera e Sfida del giorno insieme**
  (commento a `records.js:86`: «le statistiche restano una sola, per tutte e due»).
- L'unico chiamante è `src/state/usePartita.js:122`. I livelli non ci entrano: nessun
  altro file chiama `recordGame` (ricerca `grep -rln recordGame src`).

### Cosa dice l'etichetta

- Italiano: «Punteggio medio» (`src/i18n/it.js:139`).
- Inglese: «Average score» (`src/i18n/en.js:111`).
- Le partite accanto: «Partite giocate» / «Games played» (`it.js:138`, `en.js:110`).

## Misure prima

In Node 22.22.0 (`numero()` del gioco, totale = partite × 5000, media attesa 5000):

| lingua | partite | `numero(partite)` | mostrata | attesa |
|---|---|---|---|---|
| it | 4 | "4" | 500* | 500* |
| it | 9 999 | "9999" | 5000 | 5000 |
| it | 10 000 | "10.000" | **5 000 000** | 5000 |
| it | 12 345 | "12.345" | **5 000 000** | 5000 |
| en | 999 | "999" | 500* | 500* |
| en | 1 000 | "1,000" | **NaN** | 5000 |
| en | 12 345 | "12,345" | **NaN** | 5000 |

\* casi con totale 2000 e 499 500, media 500.

Nel browser la soglia italiana è più bassa: Chromium 141.0.7390.37 (quello delle prove)
scrive `(1234).toLocaleString('it')` = «1.234», mentre Node scrive «1234». Quindi nel
browser in italiano la media è già 1000 volte troppo alta da **1000 partite**.

Nel gioco vero, build di produzione con interruttore spento, 12 345 partite e totale
61 725 000 (output di `tests/e2e/correzioni.mjs`, D4):

```
  it: Punteggio medio = 5000000
  en: Average score = NaN
```

## Correzione

`src/ui/schermate/Statistiche.jsx`:

- **interruttore** in cima al modulo: `export const MEDIA_VERA = true;`
- funzione `mediaPunteggio(stats)`: `Math.round(stats.punteggioTotale / stats.partite)`;
  con l'interruttore spento rifà il calcolo vecchio (`/ numero(stats.partite)`).
- la riga «Punteggio medio» usa `mediaPunteggio(stats)`.

Il significato mostrato non cambia: stessa etichetta, stessi dati (libera + sfida), valore
arrotondato all'intero e **ancora senza separatori delle migliaia**, come prima.

## Misure dopo e prova rosso/verde

Prova unitaria nuova `tests/statistiche-media.test.js` (it 4, 10 000, 12 345; en 1000,
12 345 partite, più il controllo che l'interruttore sia acceso).

| | interruttore acceso | interruttore spento |
|---|---|---|
| `npx vitest run tests/statistiche-media.test.js` | 6 passed | **5 failed** («expected 5000000 to be 5000», «expected NaN to be 5000», «expected false to be true») |
| build di produzione + `vite preview --port 4173` + `PLINTO_E2E_URL=http://127.0.0.1:4173/ node tests/e2e/correzioni.mjs` | exit 0, `it: Punteggio medio = 5000`, `en: Average score = 5000`, «Tutto a posto» | **exit 1**, «D4 (it): «Punteggio medio» mostra «5000000», atteso 5000» e «D4 (en): «Average score» mostra «NaN», atteso 5000» |

Con l'interruttore acceso (stato consegnato):

- `npm test`: 44 file, 644 test, tutti passati;
- `npm run build`: riuscita («built in 1.35s»);
- `npm run correzioni` (server di sviluppo): «Tutto a posto: le correzioni del collaudo tengono.»

`npm run verifica` completo **non** è stato lanciato, come richiesto.

## File toccati

- `src/ui/schermate/Statistiche.jsx` — interruttore, `mediaPunteggio`, uso nella riga.
- `tests/statistiche-media.test.js` — nuovo.
- `tests/e2e/correzioni.mjs` — prova D4 (italiano e inglese), già registrata nel gate
  tramite `npm run correzioni` (`tools/verifica-tutto.mjs:81`).
- `docs/sviluppo/RAPPORTO-D4.md` — questo rapporto.

## Opzioni (scelte per il PO, nessuna applicata)

1. **Etichetta.** «Punteggio medio» non dice che mescola Partita libera e Sfida, mentre il
   record subito sopra è separato («Record» / «Record della Sfida del giorno»).
   - (a) **consigliata**: lasciarla così. Anche «Partite giocate», «Mosse totali» ecc.
     contano tutte e due le modalità: la media è coerente con le righe vicine.
   - (b) «Punteggio medio a partita» / «Average score per game»: più esplicita, stesso
     significato. Va aggiunta in `it.js` e `en.js` e controllata con `tests/lessico.test.js`.
   - (c) separare le statistiche per modalità: cambia il significato e il formato del
     salvataggio, fuori dal perimetro di D4.
2. **Separatori delle migliaia nella media.** Oggi la media è l'unica cifra grande senza
   separatori (`5000` accanto a «Record 12.345»).
   - (a) **consigliata**: formattarla con `numero(mediaPunteggio(stats))`, era con ogni
     probabilità l'intento del codice originale (*interpretazione, non verificabile*);
     richiede di adattare la prova D4 che oggi toglie già i separatori.
   - (b) lasciarla com'è (scelta di questo ramo, per non cambiare altro oltre al calcolo).

## Non verificato

- Non posso confermare quanti giocatori reali abbiano 1000+ partite (non c'è telemetria:
  il gioco non usa la rete).
- Non posso confermare il comportamento su browser diversi da Chromium 141.0.7390.37 e da
  Node 22.22.0: il punto in cui `toLocaleString` comincia a raggruppare dipende dai dati
  CLDR del motore (`tests/e2e/correzioni.mjs:80-83` lo documenta già per l'italiano). La
  correzione non dipende più da questo, perché non divide per una stringa.
- La TWA su Android non è stata provata a mano; usa il sito, quindi riceve lo stesso codice.
- La CI del ramo non è stata letta (niente push su `main`, niente pubblicazione).

## Commit

- `386ba26` — D4: il punteggio medio in Statistiche è il totale diviso per le partite.
- il commit di questo rapporto (hash nel messaggio di consegna: `git log -1` sul ramo).
