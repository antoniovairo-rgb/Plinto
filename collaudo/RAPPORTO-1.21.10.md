# Rapporto di collaudo — PLINTO 1.21.10 (PO-001)

Sito: https://antoniovairo-rgb.github.io/Plinto/ — commit del codice collaudato `e126983`.
Data: 17 ottobre 2026. Ambiente: Chromium 1194 (Playwright), produzione, nessun dato toccato fuori dal contesto di prova.

## Riepilogo

| Gravità | Difetti |
|---|---|
| Alta / media | nessuno trovato |
| Bassa | **G1** (collegamento `#/sfida/<giorno>` ignorato a scheda già aperta) |

Esclusi come da incarico: F1, F2, F3. Tutte le riconferme sono andate a buon fine.

## 0. Versione servita

`assets/index-DY2mMK2c.js` contiene `1.21.10` (4 occorrenze) e nessun'altra stringa `1.21.x`; la home mostra «v1.21.10» (screenshot `prove/home-spiegazione/*.png`, `prove/g1-hashchange.png`).
Non posso confermarlo dal `sw.js`: la ricerca `v=` non ha dato risultati (la versione arriva dall'URL di registrazione in `main.jsx`, non dal file).

## 1. Tabella dei difetti

### G1 — Un collegamento alla sfida, aperto a scheda già aperta, non fa niente (bassa)

- **Dove**: `src/ui/rotta.js` (`usaRotta`, ascolto di `hashchange`) + `src/ui/App.jsx` (callback `normalizza` passata a `useTastoIndietro`, ~r. 462-467) + `src/ui/useTastoIndietro.js` (`suIndietro`).
- **Riproduzione**: `node collaudo/g2.mjs` (home, nessuna partita; si cambia l'ancora in `#/sfida/2026-10-10`). Variante con sfida di oggi a metà: `node collaudo/g1.mjs`.
- **Atteso**: il commento di `rotta.js` («un collegamento a una sfida ricevuto e aperto con la scheda già viva non ricarica la pagina, cambia solo l'ancora») dice che la sfida si apre (o compare la domanda di conferma se c'è una sfida di un altro giorno a metà).
- **Ottenuto**: resta la home, l'ancora sparisce, nessuna domanda (`prove/g2.txt`). Con la sfida di oggi a metà e partita aperta, il giocatore viene riportato alla home senza domanda (`prove/g1.txt`, `prove/g1-hashchange.png`); la sfida resta salvata (nessuna perdita di dati). Aperto in una **scheda nuova** invece funziona e compare la domanda corretta (`prove/g1.txt`, riga «NUOVA SCHEDA»).
- **Ipotesi (non provata con una modifica al codice)**: cambiando l'ancora il browser emette `popstate`; `suIndietro` lo tratta come un Indietro, chiama la normalizzazione che dalla home fa `scriviRotta('')` (cancella l'ancora prima che `hashchange` la legga) e, dalla partita, `passoIndietro` → `tornaAllaHome`.
- **Regressione della 1.21.10?** Non posso confermarlo: non ho confrontato con la 1.21.9.
- **Opzioni**:
  1. *(consigliata)* Distinguere nel gestore di `popstate` un cambio d'ancora (`event.state` senza `plinto`) dal vero Indietro e non toccare né la schermata né l'ancora. Nessun cambiamento visibile se non che il collegamento funziona.
  2. Leggere l'ancora anche in `popstate` prima di normalizzarla. Stesso effetto, più fragile.
  3. Non fare niente: il caso (link incollato nella barra con l'app già aperta) è raro. **Cambia ciò che il giocatore vede** solo se si sceglie 1 o 2 (compare la sfida/domanda invece di niente).

## 2. Esito delle riconferme (produzione)

Eseguiti gli script del repo contro la produzione con `PLINTO_E2E_URL`; output in `collaudo/prove/*.txt`.

| Voce | Esito | Prova |
|---|---|---|
| Riga di spiegazione (PO-009), it/en, 360x640 e 390x844 | OK: la riga c'è, home non scorre (`scorre 0`), card alte 52 px, contrasto 6.35 / 8.097 | `home-spiegazione.txt`, screenshot `home-{it,en}-{360x640,390x844}.png` |
| Stato «libera» a 360x640 | Scorre di 60 px: è F1, escluso | `home-spiegazione.txt` righe 2, 20 |
| Conferme: altro livello (J), Riprova (K), altra sfida (L) | OK: la domanda compare con le mosse a rischio, il livello resta salvato | `ripresa-livello.txt` |
| `#/sfida/<giorno>` dopo la domanda (M) | OK: `#/sfida/2026-10-16` | `ripresa-livello.txt` |
| Ripresa dopo secondo piano / ricarica / oltre 2 ore (PO-008) | OK, nessuna partenza da zero (casi A-I) | `ripresa-livello.txt`, `ripresa.txt` |
| D4 media punteggi | OK: 5.000.000/1000 → 5000; 4500/3 → 1500; 987654321/1234 → 800368, in it e en, due formati, nessun NaN, nessuno scroll orizzontale | `stat.txt`, `stat-*.png` |
| Indietro con la domanda aperta («Riprova») | OK: il 1° Indietro chiude la domanda e il livello resta (`partita-quadro=si`); il 2° porta alla mappa | `indietro-domanda.txt` |
| Tasto Indietro, archivio, salvataggi | OK | `indietro.txt`, `archivio.txt`, `salvataggio.txt` |
| Partita libera e sfida convivono | OK: aprire la sfida non cancella la libera (punteggio 3 ritrovato), Indietro dalla sfida lascia entrambe salvate | `node collaudo/sonda.mjs 1` (output a video, non allegato) |

## 3. Testi contro le regole

| Testo | Fonte | Esito |
|---|---|---|
| «Senza livelli: gioca finché i pezzi entrano» / «No levels: play until no piece fits» (`it.js:34`, `en.js:21`) | `it.js:552` («va avanti finché entra un pezzo… serve solo a fare punti»); `GAMEPLAY_RULES.md:747` («si dura finché si dura») | Coerente |
| «Nuova ogni giorno, parte uguale per tutti» / «New every day, same start for everyone» (`it.js:35`, `en.js:22`) | `sfida.js:3-6` (stessa griglia e stessa sequenza di pezzi per data); `GAMEPLAY_RULES.md:663-666` | Coerente («parte uguale»; l'«identica» di altri testi è F3, escluso) |

## 4. Non verificato

- App Android (TWA) reale e tasto Indietro fisico: ho usato `history.back()`/`goBack()` di Chromium, non un telefono.
- Il caso «sfida di un altro giorno dall'archivio» con Indietro a domanda aperta: la domanda e l'ancora sono coperte da `ripresa-livello.txt` (L, M), ma il mio script per Indietro-con-domanda copre solo «Riprova».
- Safari/iOS e Firefox.
- Se G1 esisteva prima della 1.21.10.
- Il bundle non è stato confrontato byte per byte con `dist/` costruito da `e126983`.
- `npm run verifica` completo: non lanciato, come da incarico.

## 5. Script e prove

`collaudo/g1.mjs`, `g2.mjs`, `stat.mjs`, `indietro-domanda.mjs`, `sonda.mjs`; output e screenshot in `collaudo/prove/`.
