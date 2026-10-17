# Rapporto di collaudo — PLINTO 1.21.9 (produzione)

Sito: https://antoniovairo-rgb.github.io/Plinto/ — commit `b4be52c`. Chromium 1194 (Playwright), senza `playwright install`.
Data: 17 ottobre 2026.

## Riepilogo

| Gravità | Difetti |
|---|---|
| Crash / bloccante | 0 |
| Alta | 0 |
| Media | 1 (E1) |
| Bassa | 1 (E2) |

Nessun caso in cui una partita (libera, sfida o livello) riparte da zero in modo non voluto è stato trovato negli scenari provati. Nessun errore di pagina (`pageerror`) in nessuna prova. E1 ed E2 sono scelte di progetto che il PO può trovare sorprendenti, non rotture: li segnalo perché toccano proprio PO-008.

## Versione servita

Il bundle `assets/index-BEh_Lckk.js` (scaricato dal sito) contiene la stringa `1.21.9` 4 volte e nessun'altra `1.21.x`. Verifica: `curl -s .../assets/index-BEh_Lckk.js | grep -o '1\.21\.[0-9]*' | sort | uniq -c`.

## Riconferma delle correzioni (in produzione)

Le prove del repository sono state lanciate contro il sito pubblicato (`PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`). Output in `collaudo/`.

| Voce | Prova | Esito | Misura |
|---|---|---|---|
| PO-008 casi A–I | `tests/e2e/ripresa-livello.mjs` → `out-po008-prod.txt` | Confermata, uscita 0 | A: Indietro porta alla mappa, salvato `true`, firma identica alla riapertura. B: oltre 2 h la home dice «RIPRENDI IL LIVELLO 1». C: salvato durante la presentazione `true`, ricarica riporta all'obiettivo. D–F: secondo piano, ricarica, `?origine=play` → stessa partita. G, H: `introVista` falso, ripresa lo stesso. I: guardare l'obiettivo di un altro livello lascia salvato il livello 2. |
| D1 | `tests/e2e/correzioni.mjs` → `out-correzioni-prod.txt` | Confermata | Unendo un file con record Sfida 100 su archivio con 900: `records-sfida.best = 900`, Statistiche mostra 900. |
| D2 | idem | Confermata | Dopo «Sostituisci tutto» restano solo `records` (50) e `settings`. |
| D3 | idem | Confermata | Statistiche con dati guasti: nessun «NaN»/«undefined» (dato buono 210 presente). |
| Ripresa | `ripresa.mjs`, `indietro.mjs`, `salvataggio.mjs` | Tutte con uscita 0 | `out-ripresa-prod.txt`, `out-indietro-prod.txt`, `out-salvataggio-prod.txt` |

## Regressioni cercate (nessuna trovata)

Script `collaudo/e1-scenari.mjs` → `out-e1-scenari.txt`:
- Home con livello in sospeso, IT/EN, 360x640, 412x915, 1280x800: etichetta «RIPRENDI IL LIVELLO 1» / «RESUME LEVEL 1», nessuno scorrimento orizzontale, nessuna scrittura tagliata, home non scorre (scrollH = clientH).
- Partita libera e livello a meta' insieme: la home mostra «Riprendi il livello 1» e «Riprendi la partita», entrambe conservate.
- Sfida a meta': la ricarica la riporta identica (punteggio 4 → 4); Indietro → home; ricarica dalla home resta in home.
- Livello: ricarica identica; Indietro dopo ricarica → mappa → home.

Script `collaudo/e2-livelli.mjs` → `out-e2-livelli.txt` (livelli 1–2 già superati, livello 3 giocato):
- Fine del livello: il salvataggio e il posto sono cancellati (`nessuno / null`), nessun livello fantasma; ricarica sulla schermata di fine porta alla home.
- «Riprova» dalla schermata di fine: riparte da zero (voluto), e dopo una mossa e una ricarica la partita si ritrova (punteggio 2, mosse 11).

## Difetti

### E1 — Media — Aprire e giocare un altro livello sostituisce in silenzio il livello a metà
- **Dove**: mappa → altro livello → «Gioca».
- **Riproduzione**: `node collaudo/e2-livelli.mjs`, scenario T1. Livello 3 con 3 mosse; Indietro; apro il livello 1 (già superato), guardo l'obiettivo (il salvataggio del 3 resta: corretto); premo «Gioca» e faccio una mossa.
- **Atteso**: non perdere il livello 3 senza avvisare (PO-008: «la partita / missione non deve partire da 0»).
- **Ottenuto**: salvato `liv3` → `liv1`; la home dice «RIPRENDI IL LIVELLO 1»; il livello 3 è perso senza avviso.
- **Prova**: `collaudo/out-e2-livelli.txt`, righe T1.
- **Ipotesi**: c'è un solo posto di salvataggio (`KEYS.CURRENT_LEVEL`). `src/state/useQuadro.js:163` protegge l'altro livello solo mentre `daPresentare`; dopo «Gioca» l'effetto scrive sopra. Il CHANGELOG lo dichiara («si perde solo ... aprendone un altro»), quindi è una scelta dichiarata, non verificata come desiderata dal PO. Non posso confermare l'intenzione.
- **Opzioni**: (a) **consigliata**: avviso prima di «Gioca» quando esiste un altro livello a metà («Hai il livello 3 a metà. Se continui lo perdi»), con «Torna al 3»; (b) un salvataggio per livello; (c) lasciare così e dirlo nell'aiuto.

### E2 — Bassa — «Riprova» nel menu del livello azzera senza conferma
- **Dove**: menu del livello → «Riprova».
- **Riproduzione**: `collaudo/e2-livelli.mjs`, scenario T2: livello 3 con 4 mosse, menu → Riprova.
- **Atteso**: conferma prima di buttare il progresso (stessa logica di PO-008).
- **Ottenuto**: un solo tocco, punteggio 16 → 0, nessuna finestra (`conferma? 0`), il salvataggio viene sovrascritto subito.
- **Prova**: `out-e2-livelli.txt`, righe T2.
- **Ipotesi**: `src/ui/App.jsx:545` chiama `quadri.riprova()` direttamente. Non verificato se sia una regressione della 1.21.9 o preesistente.
- **Opzioni**: (a) **consigliata**: conferma a due passi, oppure «Annulla» disponibile dopo il Riprova; (b) distanziare il pulsante da «Torna alla partita»; (c) lasciare così.

## Non verificato

- Il vero background su Android/TWA (freeze del processo): provato solo `visibilitychange`, `pagehide` e freeze CDP di 3 s (casi D di `ripresa-livello.mjs`). Non posso confermarlo sul telefono.
- Vittoria di un livello a metà e poi «Prossimo livello» in pratica: la fine provata è una sconfitta (gioco a caso, 68 mosse); la vittoria non è stata raggiunta.
- Statistiche in inglese con dati guasti: coperte solo in italiano da `correzioni.mjs`.
- D4 escluso come richiesto.
- Scenari non coperti: sfida di un giorno diverso dall'odierno (archivio), rotazione schermo, installazione PWA offline.
- Script non eseguiti: `npm run verifica` (vietato).

## Commit

- `64c2829` — script e output delle prove (ramo `collaudo-1.21.9`, da `main` = `b4be52c`).
- Questo rapporto: commit successivo sullo stesso ramo.
