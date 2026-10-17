# Rapporto — PO-008, conferma prima di perdere una partita a metà (1.21.10, ramo `sviluppo/conferma-1.21.10`)

Data: 17 ottobre 2026. Base: `main` a `ad2290a` (1.21.9 più le decisioni).
Decisione del PO applicata: `docs/DECISIONI.md:37`, «Chiedo conferma».
Versione, CHANGELOG e ROADMAP **non** toccati; niente pubblicato su `main`.

## Che cosa cambia per chi gioca

Prima di tre azioni che cancellavano una partita a metà con un tocco solo, adesso il
gioco chiede. Ogni finestra ha un titolo (che cosa è a metà), una riga (che cosa si
perde) e due pulsanti che **dicono che cosa fanno**:

| Azione | Titolo e riga | Pulsante pieno, con il fuoco (non perde niente) | Pulsante trasparente (perde) |
|---|---|---|---|
| E1: livello 2 a metà, «Gioca» sull'obiettivo del livello 1 | «Il livello 2 è a metà.» / «Se giochi il livello 1, perdi le mosse fatte nel livello 2.» | «Riprendi il livello 2» | «Gioca il livello 1» |
| E2: «Riprova» nel menu del livello 1 | «Vuoi ricominciare il livello 1?» / «Le mosse che hai fatto finora si perdono.» | «Torna alla partita» | «Sì, ricomincia da capo» |
| Sfida del 16 ottobre a metà, si apre quella di oggi | «La sfida del 16 ottobre è a metà.» / «Se apri la sfida di oggi, perdi le mosse fatte nella sfida del 16 ottobre.» | «Riprendi la sfida del 16 ottobre» | «Apri la sfida di oggi» (dall'archivio: «Apri la sfida del 12 ottobre») |

Inglese: «Level {n} is in progress.» / «If you play level {altro}, you lose the moves you
made in level {n}.» / «Resume level {n}» / «Play level {altro}»; «Start level {n}
again?» / «The moves you have made so far will be lost.» / «Back to the game» / «Yes,
start again»; «The {giorno} challenge is in progress.» / «If you open today's
challenge, you lose the moves you made in the {giorno} challenge.» / «Resume the
{giorno} challenge» / «Open today's challenge».

**Prima versione scartata.** La prima stesura seguiva alla lettera il testo tipo della
decisione: «Hai la sfida del 16 ottobre a metà: se continui la perdi.» con «Torna alla
sfida del 16 ottobre» / «Continua». Il proprietario, guardando la schermata, ha scritto
«Non è chiaro il messaggio» (17 ottobre 2026). Il difetto: «continui» e «Continua» non
dicono che cosa si sta per fare. È stata sostituita da quella sopra (commit `7853275`).

La domanda compare **solo** se c'è qualcosa da perdere:
- livello (E1): salvataggio leggibile, livello esistente, stato `playing`, **non** fermo
  sulla presentazione dell'obiettivo e con **almeno una mossa** (`useQuadro.js`,
  `livelloAMeta`); se il livello salvato è lo stesso che si sta aprendo, si riprende come
  prima (`App.jsx`, `apriQuadro`, invariato);
- «Riprova» (E2): partita in memoria non finita (`!quadri.esito`) con almeno una mossa;
  dopo un livello perso o vinto «Riprova» non chiede niente;
- sfida: sfida salvata in stato `playing` con almeno una mossa (`usePartita.js`,
  `sfidaAMeta`) e di un giorno **diverso** da quello che si apre; lo stesso giorno si
  riprende come prima.

Il tasto Indietro di Android, Escape e il tocco fuori dalla finestra chiudono la domanda
senza perdere niente (la domanda conta come un gradino in `useTastoIndietro`, come il
menu).

## Casi prima e dopo

Script: `tests/e2e/ripresa-livello.mjs` (`npm run e2e-po008`), casi J, K, L aggiunti a
quelli A–I già esistenti. Ogni caso controlla anche: fuoco sul pulsante sicuro,
Indietro (`page.goBack()`) che chiude la domanda restando dov'eri, il pulsante sicuro che
riporta nella stessa partita (stessa firma: punteggio, obiettivo, mosse), e per K e L che
il pulsante che perde fa davvero l'azione chiesta.

### Sviluppo (`vite` su 5173)

| Caso | Prima (1.21.9, `ad2290a`) | Dopo (`be11cf0`+) |
|---|---|---|
| J livello 2 a metà, «Gioca» sul livello 1 | nessuna domanda; salvato: livello **1** → livello 2 perso | domanda; salvato: livello **2**; «Torna al livello 2» stessa firma |
| K «Riprova» nel menu | nessuna domanda; punteggio 3 → 0 | domanda; Indietro la chiude, firma uguale; «Sì, ricomincia da capo» ricomincia |
| L sfida di ieri a metà, apro quella di oggi | nessuna domanda; sfida salvata: **2026-10-17** → ieri persa | domanda; sfida salvata: **2026-10-16**; «Apri la sfida di oggi» → 2026-10-17 |

A–I restano tutti «Riparte da 0: no» in entrambe le misure.

### Produzione (`npm run build`, `vite preview --port 4173`, `PLINTO_E2E_URL=http://127.0.0.1:4173/`)

| Caso | Con la correzione | Con i tre interruttori spenti |
|---|---|---|
| J | domanda, livello salvato 2 — no | nessuna domanda, livello salvato 1 — **SI** |
| K | domanda, «Sì, ricomincia da capo» ricomincia — no | nessuna domanda — **SI** |
| L | domanda, sfida salvata 2026-10-16 — no | nessuna domanda, sfida salvata 2026-10-17 — **SI** |
| uscita | 0 («Tutto a posto») | 1 (6 problemi) |

Nota onesta sulla prova di produzione: nel primo giro (testi della prima versione) il
`vite preview` della build verde era rimasto acceso e il secondo non era partito; il
rosso era stato servito dal primo server sulla `dist/` già ricostruita. Il giro finale,
sui testi nuovi, ferma il server e aspetta che la porta 4173 sia libera prima di
ricostruire: vedi «Controlli eseguiti».

## Interruttori e prova rosso/verde

In `src/ui/App.jsx`, accanto a quelli di PO-008:

| Interruttore | Conferma | Caso | Spento da solo (sviluppo) |
|---|---|---|---|
| `CONFERMA_ALTRO_LIVELLO` | E1, «Gioca» su un altro livello | J | J rosso (livello salvato 1), K e L verdi; uscita 1 |
| `CONFERMA_RIPROVA` | E2, «Riprova» nel menu | K | K rosso, J e L verdi; uscita 1 |
| `CONFERMA_ALTRA_SFIDA` | sfida di un altro giorno | L | L rosso (sfida salvata 2026-10-17), J e K verdi; uscita 1 |

Ogni interruttore spento fa diventare rosso **solo** il suo caso: i controlli sono
indipendenti. Tutti accesi: verde (uscita 0), in sviluppo e in produzione.

## Schermate a 360×640

- `docs/sviluppo/conferma-livello-it.png`, `docs/sviluppo/conferma-livello-en.png`
  («Riprova» nel menu del livello 1, due mosse fatte: caso E2)
- `docs/sviluppo/conferma-sfida-it.png`, `docs/sviluppo/conferma-sfida-en.png`
  (sfida del 16 ottobre a metà, tocco su «Sfida del giorno» dalla home)

A 360 px l'etichetta «Riprendi la sfida del 16 ottobre» va su due righe dentro il
pulsante; le altre stanno su una riga. Non c'è una schermata del caso E1 (stessa forma,
testi diversi: li riporta lo script, caso J).

## Scelte di dettaglio (con la consigliata, già applicata)

1. **Quando compare la domanda per E1.**
   (a) *Consigliata, applicata:* al tocco di «Gioca» sull'obiettivo dell'altro livello.
   Leggere l'obiettivo non perde niente (già garantito da `NON_COPRE_UN_ALTRO_LIVELLO`),
   ed è l'istante esatto in cui il salvataggio viene sovrascritto.
   (b) All'apertura dalla mappa, prima di vedere l'obiettivo: domanda anche a chi voleva
   solo guardare.
   (c) In tutti e due i momenti: due domande per la stessa cosa.
2. **Che cosa conta come «a metà».**
   (a) *Consigliata, applicata:* stato `playing` con almeno una mossa; un livello fermo
   sull'obiettivo o mai toccato non chiede niente, perché ricomincia identico.
   (b) Qualunque partita salvata e riprendibile, anche a zero mosse: più domande, nessuna
   partita in più salvata.
3. **Testi.**
   (a) *Consigliata, applicata dopo il «Non è chiaro» del proprietario:* titolo + una
   riga + pulsanti che nominano l'azione (tabella in cima). Per «Riprova» il titolo è una
   domanda («Vuoi ricominciare il livello 1?»), perché si è già dentro quel livello.
   (b) Il testo tipo della decisione alla lettera («se continui lo perdi» / «Continua»):
   scartato, il proprietario l'ha trovato poco chiaro.
   (c) Solo pulsanti, senza la riga di spiegazione: più corto, ma non dice che cosa si
   perde.
4. **Aiuto («Come si gioca»).**
   (a) *Consigliata, applicata:* nessuna riga nuova. Non è una meccanica né una costante
   ritarata, e la domanda si spiega da sola.
   (b) Una riga sul salvataggio («una partita a metà resta salvata; prima di perderla il
   gioco te lo chiede»).
5. **Forma della finestra.** Riusa velo e stile di «Azzera i miei dati» (`pl-velo`,
   `pl-azzera`), ma in **un passo** e non due (`ConfermaPerdita`, accanto a
   `ConfermaDoppia` in `src/ui/ConfermaDoppia.jsx`): qui si perde una partita, non mesi di
   gioco. Alternativa scartata: `ConfermaDoppia` con due passi a ogni «Riprova».

## File toccati

- `src/ui/App.jsx` — tre interruttori, stato `conferma`, `avviaQuadro` (E1),
  `riprovaLivello` (E2), domanda in `apriSfida`, Indietro e profondità della cronologia,
  finestra resa nelle tre schermate (obiettivo, livello, resto).
- `src/ui/ConfermaDoppia.jsx` — nuovo `ConfermaPerdita` (un passo, fuoco sul pulsante
  sicuro, Escape e tocco fuori annullano, `role="dialog"`, `aria-modal`).
- `src/state/useQuadro.js` — `livelloAMeta()`.
- `src/state/usePartita.js` — `sfidaAMeta()`.
- `src/i18n/it.js`, `src/i18n/en.js` — sezione `conferma`.
- `src/styles/app.css` — `.pl-azzera__scelte` (pulsanti uno sopra l'altro).
- `tests/e2e/ripresa-livello.mjs` — casi J, K, L.
- `docs/sviluppo/conferma-*.png`, questo rapporto.

Non toccati: `src/ui/schermate/Statistiche.jsx`, versione, CHANGELOG, ROADMAP.

## Controlli eseguiti

Giro finale sul commit `7853275` (testi nuovi), tutti nello stesso container:

| Controllo | Esito |
|---|---|
| `npm test` | 43 file, 638 prove passate |
| `npm run e2e-po008` (sviluppo) | uscita 0, A–L «Riparte da 0: no» |
| `npm run build` | uscita 0 |
| `e2e-po008` su `vite preview` 4173, build con la correzione | uscita 0, J K L con la domanda |
| `e2e-po008` su `vite preview` 4173, build con i tre interruttori spenti (server fermato e porta liberata prima) | uscita 1, J K L «SI» |
| `npm run correzioni` | uscita 0, «le correzioni del collaudo tengono» |
| `npm run indietro` (B6) | uscita 0, «Tutte le verifiche del tasto Indietro sono passate» |
| `npm run impaginazione` | uscita 0, «La home entra su tutti i formati provati» |
| `npm run comunicazioni` | uscita 0, «leggibili in entrambe le lingue» |

La prova con **un interruttore spento alla volta** (tabella sopra) è stata fatta sui
testi della prima versione (commit `be11cf0`); il cambio di testo non tocca gli
interruttori né le condizioni, ma sui testi nuovi è stata rifatta solo con tutti e tre
spenti insieme.

## Non verificato

- **Telefono vero e TWA.** Tutto è misurato in Chromium desktop con Playwright. Il tasto
  Indietro di Android è simulato con `page.goBack()`: non posso confermare il
  comportamento sul dispositivo.
- **Lettori di schermo.** La finestra ha `role="dialog"`, `aria-modal`, `aria-label` e il
  fuoco sul pulsante sicuro (controllato dallo script), ma non è stata provata con
  TalkBack: non posso confermare come viene letta.
- **Il fuoco resta intrappolato?** No: come `ConfermaDoppia`, la finestra non intrappola
  il Tab. Con la tastiera si può uscire dal dialogo verso la pagina sotto.
- **Sfida da collegamento.** Con una sfida a metà, un collegamento `#/sfida/<altro
  giorno>` passa da `apriSfida` e quindi mostra la domanda: è nel codice, ma lo script
  la prova solo dalla home. Se si sceglie Indietro, l'ancora resta nell'indirizzo e una
  ricarica rifà la domanda.
- **Il primo del mese** lo script L sfoglia il calendario al mese precedente per trovare
  «ieri»: oggi (17 ottobre) quel ramo non è stato eseguito.
- **Contrasti** del nuovo pulsante: usa classi esistenti (`pl-btn`, `pl-btn--fantasma`),
  ma `npm run contrasti` non è stato fatto girare.
- `npm run verifica` completo non è stato lanciato, come da istruzioni.
- La «firma» dello script conta «0 piene» anche dopo le mosse (selettore preesistente
  `.pl-cella` con `piena` nel nome): la differenza fra partite si vede da punteggio e
  mosse nella testata. Non l'ho corretto perché fuori da questa voce.

## Commit

Ramo `sviluppo/conferma-1.21.10`, da `ad2290a`:

- `32280ce` casi J, K, L nella prova di ripresa (rossi sulla 1.21.9)
- `be11cf0` conferma prima di perdere una partita a metà (E1, E2, sfida)
- `f9b96b5` schermate del dialogo e prova di L sul pulsante che perde
- `7853275` testi della conferma più chiari, ogni pulsante dice che cosa fa
- il commit di questo rapporto (hash nel log del ramo)
