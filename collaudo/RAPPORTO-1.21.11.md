# Rapporto di collaudo — PLINTO 1.21.11 in produzione

Sito: https://antoniovairo-rgb.github.io/Plinto/ · commit di riferimento `8e89542` · data: 18 ottobre 2026
Ramo: `collaudo-1.21.11` (da `main`). Il codice del gioco non è stato toccato: solo `collaudo/`.

## Riepilogo
- **Gravità alta/critica: 0.**
- **Media: 1** (H1, «Nuova partita libera» butta una partita a metà senza chiedere).
- **Bassa: 1** (H2, a 320x700 la fine del livello con l'atto chiuso scorre di 1 px; presente anche nella 1.21.10, non è una regressione).
- Tutte le riconferme (PO-010, F1, F3, G1) sono verdi in produzione. Le prove `partita.mjs` e `scenografie.mjs`, quelle rimaste rosse alla prima pubblicazione, sono **verdi** sul sito pubblicato.

## Versione servita
`index.html` → `assets/index-DGx-CW6A.js`; nel bundle la stringa `1.21.11` compare 4 volte e nessun'altra `1.21.x`. Anche l'interfaccia mostra «v1.21.11» in fondo alla home (screenshot). Il numero di versione dell'URL di `sw.js` non l'ho letto: **Non posso confermarlo**.

## Riconferme (tutte contro il sito pubblicato, `PLINTO_E2E_URL`)
| Voce | Prova | Esito |
|---|---|---|
| F1 – la home non scorre | `tests/e2e/home-spiegazione.mjs`, 5 stati × 6 formati (360x640, 375x667, 390x844, 412x915, 1280x800, 1366x768) × it/en = 60 righe; output in `prove/home-spiegazione.txt` | eccesso di scorrimento 0 in tutte le righe; il programma conclude «la home non scorre in nessuno dei cinque stati» |
| PO-010 – nome fisso, «Riprendi ›», «Nuova partita libera» | stessa prova + `riconferma.mjs` | titoli «Partita libera» / «Sfida del giorno» fissi; a destra «Riprendi ›» (it) / «Resume ›» (en); nome accessibile «Partita libera, riprendi la partita in corso»; collegamento sotto la libera presente solo con partita libera in corso |
| Pillola in evidenza e leggibile | `riconferma.mjs` | fondo `rgb(242,193,78)`, testo `rgb(20,22,28)`, **contrasto 10,78:1** (soglia 4,5); corpo 16 px, peso 800; pillola 100×20 px (it) e 97×20 px (en) in una card alta 52 px; vale per libera e sfida |
| Ripresa dalla home | `riconferma.mjs` | un tocco sulla card «Partita libera» apre la partita senza dialoghi; il salvataggio `plinto:partita` è identico byte per byte prima e dopo; Invio da tastiera sulla card (en) apre la partita; Indietro riporta alla home con la pillola ancora presente |
| F3 – testi sulla Sfida | screenshot 360x640 it/en: «Nuova ogni giorno, parte uguale per tutti» / «New every day, same start for everyone» | conformi |
| G1 – `#/sfida/<giorno>` a gioco aperto | `riconferma.mjs` | con la partita libera aperta, impostando `#/sfida/2026-10-18` si apre «SFIDA DI OGGI, 18 OTTOBRE», senza errori di pagina o console |
| Screenshot 360x640 | `collaudo/schermate/360x640-{it,en}-{libera+sfida,libera,nuova}.png` | home intera visibile, nessuno scorrimento (misura 0 px in 4 casi) |

## Regressioni cercate (prove del repo eseguite sul sito pubblicato)
Tutte `exit=0`: `partita`, `scenografie`, `ripresa`, `ripresa-livello` (casi A–M, conferme e `#/sfida` dopo Indietro), `indietro`, `archivio`, `salvataggio`, `annulla`, `attrezzi`, `comunicazioni`, `correzioni`, `guida`, `impaginazione`, `precisione`, `condivisione`, `incitamenti`. Output in `collaudo/prove/*.txt`.
Eccezione: `trionfo` → `exit=1` (vedi H2). Errori di pagina/console nei miei script: nessuno.

## Difetti

| id | gravità | dove | riproduzione | atteso / ottenuto | prova | ipotesi | opzioni |
|---|---|---|---|---|---|---|---|
| **H1** | media | Home, collegamento «Nuova partita libera» | Salvataggio con una partita libera con almeno 1 mossa; in home toccare «Nuova partita libera». | **Atteso:** una domanda di conferma, come per le altre perdite (PO-008: altro livello, «Riprova», sfida di un altro giorno). **Ottenuto:** nessuna domanda; `plinto:partita` sostituito subito da una partita nuova. Il collegamento è alto 28 px e a ~14 px dalla card «Riprendi ›»: un tocco sbagliato perde la partita. | `node collaudo/nuova-con-mosse.mjs` → `prove/nuova-con-mosse.txt` («dialog … : 0», «partita salvata cambiata: true»); `collaudo/schermate/nuova-con-mosse.png` | `src/ui/schermate/Home.jsx:160` (`onClick={onGioca}`) → `src/ui/App.jsx:701` (`onGioca={iniziaNuova}`) → `iniziaNuova` `App.jsx:162-169`, senza confronto con `conferma` come fanno `apriSfida` (`App.jsx:184-199`) e le conferme dei livelli (`App.jsx:360-384`). Il collegamento è comparso con PO-010 ma il pulsante «Nuova partita» esisteva già. Non posso confermare che l'omissione sia voluta: `docs/DECISIONI.md` non elenca questo caso tra le conferme. | **A (consigliata)** riusare la finestra di conferma di PO-008 anche qui, solo se la partita ha mosse (stesso stile e testi; **cambia ciò che il giocatore vede in modo nuovo: nuova domanda**). B: lasciare com'è e documentare la scelta in `DECISIONI.md`. C: spostare il collegamento lontano dalla card (cambia il layout della home già misurato). |
| **H2** | bassa | Fine livello con atto chiuso, 320x700 | `PLINTO_E2E_URL=<sito> node tests/e2e/trionfo.mjs` | **Atteso:** nessuno scorrimento (richiesta del proprietario 8 ottobre). **Ottenuto:** 1 px di scorrimento a 320x700; gli altri 5 formati stanno nello schermo. | `prove/trionfo.txt` (produzione), `prove/trionfo-locale.txt` (main), `prove/trionfo-1.21.10.txt` (commit `965ae83`): stesso 1 px in tutti e tre → **non è una regressione della 1.21.11** | `tests/e2e/trionfo.mjs:362-368` (formato 320x700 nella lista). Causa nel layout non cercata: **Non posso confermarla**. Potrebbe dipendere dai font di questo Chromium: non ho confrontato con la CI. | **A (consigliata)** guardare l'esito di `trionfo` nella CI sull'ultimo commit; se è verde qui è un artefatto d'ambiente, nessuna azione. B: compattare la fine livello sotto i 720 px di altezza (come F1 per la home; cambia il layout). C: togliere 320x700 dalla prova (nasconde il difetto). |

## Non verificato
- Dispositivo reale / app Android TWA: ho usato solo Chromium headless; nessun test su telefono.
- Contenuto del `sw.js` pubblicato e installazione offline: non ho eseguito `installazione.mjs` né provato l'offline.
- `sicurezza.mjs` (CSP) e `tutti-i-livelli.mjs`/gate completo: non lanciati (richiesto di non eseguire `npm run verifica`).
- Statistiche con dati reali dopo più partite e archivio con molti giorni: coperti solo dalle prove del repo (`archivio`, `salvataggio`), non da casi miei.
- Il comportamento di «Nuova partita libera» dentro il menu di gioco non è stato provato.
- Se la CI del repo sul commit `8e89542` fosse verde: non l'ho letta.

## File
`collaudo/riconferma.mjs`, `collaudo/nuova-con-mosse.mjs`, `collaudo/prove/`, `collaudo/schermate/`.
