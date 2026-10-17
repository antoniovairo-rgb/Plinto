# Collaudo della 1.21.7 in produzione

- Sito: https://antoniovairo-rgb.github.io/Plinto/ (commit `4050d98`)
- Data: 17 ottobre 2026. Ramo: `collaudo-1.21.7`.
- **Versione servita**: il bundle `assets/index-Da1HQiC8.js` contiene `1.21.7` (4 occorrenze, nessun'altra `1.21.x`); `package.json` dice `1.21.7`. Verificato con `curl` + `grep -o '1\.21\.[0-9]*'`.
- Ambiente: Chromium 1194 headless (Playwright) dal container, fuso `Europe/Rome`, schermi 360x640, 390x844, 412x915, desktop 1280x800. Gli script sono in `collaudo/`, gli output in `collaudo/prove/*-1.21.7.txt`. Escluso B6, B7, B11 come richiesto.

## Riepilogo

| Gravità | Quanti | Id |
|---|---|---|
| Bloccante / alta / media | 0 | – |
| Bassa | 2 | C1, C2 |

Nessun crash, nessuna eccezione di pagina, nessun errore in console nei percorsi provati (primo avvio, partita libera con 400 mosse, sfida, impostazioni, importazione). Le correzioni B1-B5 e B8-B10 **tengono in produzione**, con un'eccezione parziale: la correzione di B10 lascia 2 px di scorrimento (C1). Nell'importazione ripulita resta un buco nelle sfide (C2).

## Difetti

### C1 — bassa — La home scorre di 2 px a 360x640 (residuo di B10)

| Campo | Contenuto |
|---|---|
| Dove | Home, 360x640, italiano e inglese, primo avvio senza dati |
| Riproduzione | `COLLAUDO_URL=https://antoniovairo-rgb.github.io/Plinto/ node collaudo/home-scroll.mjs` oppure `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/ node tests/e2e/correzioni.mjs` |
| Atteso | `.pl-home` non scorre (il test B10 di `tests/e2e/correzioni.mjs:200-201` lo richiede: `scrollHeight - clientHeight` ≤ 0) |
| Ottenuto | `scrollHeight=642`, `clientHeight=640`, quindi 2 px. A 390x844, 412x915 e 1280x800: 0 px. Stessa cosa sulla build locale (`npm run build` + `vite preview`): il test fallisce con «B10: con il bersaglio piu grande la home scorre di 2 px a 360x640» |
| Prova | `collaudo/prove/home-scroll.txt`, `collaudo/prove/correzioni-produzione.txt` |
| Ipotesi di causa | Il piede (`.pl-home__pie`) vale 32 px a 360 e 17 px a 390 (misurato), mentre testata (68) e azioni (312) si comprimono solo in parte: la somma fa 642. **Non posso confermare** la riga CSS: non ho letto i fogli di stile. Attenzione: in questo container il font di ripiego è Inter (`fc-match sans-serif`), non Roboto; sul telefono la misura può cambiare. Non posso confermare se la CI la vede |
| Opzioni | (a) **consigliata**: togliere 2-4 px dalla testata o dal margine del piede a ≤ 380 px, dove già esiste la regola compatta; (b) lasciare ai collegamenti 24 px di altezza invece di 32 con il padding verticale ridotto; (c) accettare 2 px e allentare il test (sconsigliata: il test dice una promessa del changelog) |
| Gravità | Bassa: un trascinamento di 2 px, nessuna perdita di contenuto |

### C2 — bassa — Una sfida importata con numeri non validi resta nell'archivio e mostra «NaN»

| Campo | Contenuto |
|---|---|
| Dove | Importazione («Unisci» e «Sostituisci tutto»), poi Statistiche («Ultimi giorni») e Archivio delle sfide |
| Riproduzione | `COLLAUDO_URL=https://antoniovairo-rgb.github.io/Plinto/ node collaudo/import-fuzz.mjs` (caso «sfide strane»: `giorni` con `'2026-10-10': {best:'99', partite:'a'}`, `'2099-01-01': {best:1, partite:1}`, `'2026-13-45'`, `x`), busta con impronta valida |
| Atteso | Nessun «NaN» e nessun «undefined» (era il criterio di B9) |
| Ottenuto | Statistiche: `ULTIMI GIORNI | 1 gen | 1 (1) | 10 ott | NaN (undefined)`. Archivio: «NaN». Storage dopo l'importazione: `{"2026-10-10":{"regole":null},"2099-01-01":{"best":1,"partite":1,...}}`. Altri 28 casi su 30 (15 file × 2 modi): nessun problema |
| Prova | `collaudo/prove/import-fuzz-1.21.7.txt` |
| Ipotesi di causa | `src/persistence/salvataggio.js:213-217`: se il giorno e la voce sono validi, `soloNumeri(voce)` scarta i valori non numerici ma la voce si scrive lo stesso, senza `best` né `partite`. Chi legge, `src/ui/schermate/Archivio.jsx:199` (`numero(esito.best)`) e la lista di `Statistiche.jsx` (alimentata da `storicoSfide()`, `App.jsx:585`), non si aspetta una voce senza `best`. In più `giornoValido` (`src/core/sfida.js:73-79`) controlla solo che la data esista, perciò `2099-01-01` entra e compare in «Ultimi giorni» (1 gen) |
| Opzioni | (a) **consigliata**: in `ripulisci` saltare la voce se `best` e `partite` non sono entrambi numeri buoni (`if (!numeroBuono(voce.best) \|\| !numeroBuono(voce.partite)) continue;`) e scartare i giorni oltre oggi; (b) riempire i campi mancanti con 0 (la voce resta, ma una sfida con record 0 e «giocata» è falsa); (c) difendere solo chi legge (`numero(esito.best ?? 0)`): non pulisce il dato e sposta il problema |
| Gravità | Bassa: richiede un file modificato a mano con l'impronta ricalcolata |

## Riconferma di B1-B5 e B8-B10 in produzione

Eseguito `tests/e2e/correzioni.mjs` contro il sito pubblico (output: `prove/correzioni-produzione.txt`) più i miei script dal rapporto precedente.

| Id | Esito | Misura |
|---|---|---|
| B1 importare aggiorna la home | ✓ | `importa.mjs`: home prima «LIVELLO 1 \| 0 di 100»; dopo «Unisci» e ritorno senza ricarica «LIVELLO 13 \| 12 di 100 \| Record 4.321»; identica dopo ricarica (`prove/importa-1.21.7.txt`) |
| B2 azzera toglie il record dalla home | ✓ | `azzera.mjs`: prima «LIVELLO 7 \| 6 di 100 \| Record 4.321», dopo «LIVELLO 1 \| 0 di 100», `localStorage` vuoto |
| B3 mezzanotte | ✓ | `sfida-mezzanotte.mjs Europe/Rome 2026-10-15T21:58:30Z`: giorno 15 «Record 395», dopo `fastForward` di 5 min senza ricaricare «Da giocare», seed `2026-10-16` (`prove/sfida-mezzanotte-1.21.7.txt`). Provato solo `Europe/Rome` |
| B4 «Riprendi la sfida» solo di oggi | ✓ | `sfida-notte.mjs`: giorno 15 «Riprendi la sfida», dopo 3 ore e ricarica (giorno 16) «Sfida del giorno», parte una sfida nuova a 0 mosse |
| B5 `pointercancel` non posa il pezzo | ✓ | `tocco.mjs`: `touchCancel` caselle piene 38→38 (360x640) e 41→41 (412x915), pezzi in mano 3; rilascio fuori griglia: invariato |
| B8 frase a 360 px | ✓ parziale | `correzioni.mjs` passa B8. La scansione di tutti i 100 livelli × 2 lingue × 2 schermi (`obiettivi-tagliati.mjs`) non è terminata in tempo: **non confermata sui 100 livelli** |
| B9 file modificato a mano | ✗ in parte | 28/30 casi puliti ma vedi **C2** |
| B10 bersaglio ≥ 24 px | ✓ per l'altezza, ✗ per lo scorrimento | collegamenti alti 27 px (`a11y.mjs`: 138x27 e 140x27), ma la home scorre di 2 px: **C1** |

## Altri controlli (nessun difetto trovato)

- Primo avvio, 6 passi, IT/EN × 4 schermi: `primo-avvio.mjs` senza errori (`prove/primo-avvio-1.21.7.txt`).
- Partita libera con 400 mosse (`partita.mjs`) e visita delle schermate: `PROBLEMI [] ERRORI []`.
- Fine livello a 360 px, IT/EN: festa finale, fine atto, sconfitta (`fine-livello.mjs`), nessun overflow se non due blocchi della «pioggia» decorativa (`pl-pioggia__blocco`, `l=-1 r=15`), ignorati perché animazione.
- Invito Play Store: «Scarica l'app» con UA Android, «Recensisci» con `?origine=play`, nulla con `?origine=altro` (`play.mjs`).
- Tasto Indietro: gli errori `sessionStorage … Access is denied` in `indietro.mjs` vengono dalla pagina `about:blank` dopo l'uscita dal gioco, non dal gioco. Il comportamento dopo la ricarica è B6 (noto, escluso).
- Il tocco a 360x640 segnala «mossa 9: piene 37→32»: è compatibile con righe svuotate dal pezzo; **non posso confermarlo** come difetto né come normale (non ho letto la mossa).
- `record-condiviso.mjs` mostra il record condiviso tra Partita libera e Sfida: è B7, noto.

## Non verificato

- Telefono reale, font Roboto, barre di sistema, gesti reali e vibrazione: tutto simulato con Chromium headless.
- Trusted Web Activity / `.aab` / Play Store: non toccato.
- Audio sintetizzato e vibrazione.
- Cambio di giorno solo in `Europe/Rome`; altri fusi non provati.
- La frase dell'obiettivo sui 100 livelli e la vittoria di tutti i livelli: non rieseguite (lo fa il gate, ~65 min).
- Service worker e uso senza rete: `sw.mjs` richiedeva un server locale su `4190`, non eseguito.
- Esito della CI sul commit `4050d98`: non letto.
- Spiegazione del 2 px (C1) a livello di CSS: non verificata.

## Commit

Vedi `git log collaudo-1.21.7`: il primo commit contiene gli script e le prove della riconferma; l'ultimo contiene questo rapporto e le prove di importazione e fuzz.
