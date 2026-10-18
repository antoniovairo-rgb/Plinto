# Collaudo 1.21.14 — versione pubblicata (PO-001)

- **Dove:** https://antoniovairo-rgb.github.io/Plinto/ (18 ottobre 2026). Commit di riferimento `dfec9a5`.
- **Versione servita:** la home punta a `assets/index-AHS7u5ar.js`; `curl … | grep -o '"1\.21\.[0-9]*"'` trova `"1.21.14"` (3 occorrenze) e nessun'altra versione.
- **Contenuto provato:** PO-013 (`src/ui/schermate/Home.jsx:74,132`, interruttore `LIVELLO_SENZA_RIPRENDI`) e I1 (`src/ui/App.jsx:95,200,213,514`, interruttore `ANCORA_VIA_DALLA_LIBERA`).

## Riepilogo

**Difetti trovati: 0** (critici 0, alti 0, medi 0, bassi 0). Tutte le riconferme sono passate. Nessuna opzione da proporre al PO.

## Esito delle riconferme

| Voce | Prova | Esito |
|---|---|---|
| PO-013 | `collaudo/collaudo-1.21.14.mjs` → `uscita-1.21.14-po013.txt` | OK, 12 casi su 12 |
| I1 in italiano | `tests/e2e/ripresa-livello.mjs`, caso O (due strade) → `uscita-1.21.14-ripresa-livello.txt` | OK |
| I1 in inglese | `collaudo/sonda-i1-en-1.21.14.mjs` → `uscita-1.21.14-i1-en.txt` | OK |
| G1 | `tests/e2e/indietro.mjs` → `uscita-1.21.14-indietro.txt` | OK (2 percorsi) |
| M | `ripresa-livello.mjs`, caso M | OK: indirizzo `#/sfida/2026-10-17` dopo la domanda |
| B6 | `tests/e2e/correzioni.mjs` → `uscita-1.21.14-correzioni.txt` | OK: «mappa > home > fuori» |
| Indietro | `indietro.mjs` (8 controlli base) | OK |
| Altri casi A–N | `ripresa-livello.mjs` | OK: nessun caso riparte da zero |

Le prove esistenti sono state eseguite contro il sito pubblicato con `PLINTO_E2E_URL`, senza modificarle. Uscita 0 per tutte.

### PO-013 — misure (390x844 e 360x640, it e en)

Per ogni caso: si gioca 3 mosse, si torna alla home con Indietro due volte, si legge il pulsante grande, lo si tocca e si confronta la «firma» della partita (livello salvato, punteggio, caselle piene) prima e dopo.

| Caso | Pulsante prima | Pulsante con livello a metà | Dopo il tocco | Firma uguale |
|---|---|---|---|---|
| Livello 1 a metà | Livello 1 / Level 1 | Livello 1 / Level 1 | in partita | sì |
| Livello 2 a metà (1 superato) | Livello 2 / Level 2 | Livello 2 / Level 2 | in partita | sì |
| Livello 1 rigiocato mentre il corrente è il 2 | Livello 2 / Level 2 | **Livello 1 / Level 1** (quello a metà) | in partita, livello 1 | sì |

- Il testo non contiene mai «Riprendi» / «Resume».
- Nessuno scorrimento della home (anche a 360x640) né errori di pagina.
- Schermate della home: `collaudo/schermate/1.21.14-{it,en}-{390x844,360x640}-{L1,L2corrente,L1rigioco}-home.png`. Non le ho riviste una per una: le misure sono sul DOM.
- Nota: il pulsante è in maiuscolo per CSS; `innerText` restituisce «LIVELLO 1», `textContent` «Livello 1». La mia prima versione dello script confrontava l'`innerText` e dava 12 falsi allarmi, corretti usando `textContent`.

## Difetti

| Id | Gravità | Dove | Riproduzione | Atteso / ottenuto | Prova | Ipotesi | Opzioni |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | Nessun difetto trovato |

## Non verificato

- Android/TWA su telefono vero: prove solo in Chromium del container. Non posso confermarlo sul dispositivo.
- Font: il container può avere font diversi dal telefono; il rendering esatto non posso confermarlo.
- Aiuto in gioco (`ComeSiGioca.jsx`) e testo accessibile del pulsante (`aria-label`): non esaminati in questo collaudo.
- Livello a metà dopo più di 2 ore oltre alla riga B di `ripresa-livello.mjs` (pulsante «LIVELLO 1» per l'etichetta): provato solo lì.
- Altri formati e lingue per G1/M/B6: le prove esistenti girano solo in italiano a 390x844.
- La regressione "su versione precedente" non è stata necessaria: nessuna prova rossa.
- `npm run verifica` non lanciato (come richiesto).

## Commit

Vedi `git log collaudo-1.21.14`.
