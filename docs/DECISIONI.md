# DECISIONI

Le decisioni del PO e della sessione madre, con data e motivo. Le più recenti in fondo.

| Data | Chi | Voce | Decisione | Motivo |
|------|-----|------|-----------|--------|
| 2026-10-17 | PO | PO-001 | Adottate le regole di lavoro (registri, figlie, chi decide, rilasci). Ogni nuova correzione ha un interruttore per spegnerla e un controllo verde con la correzione e rosso senza. | Messaggio del PO del 17 ottobre 2026 |
| 2026-10-17 | madre | PO-001 | Il «[NOME]» del messaggio è stato letto come PLINTO, unico progetto di questa sessione. | Il messaggio conteneva il segnaposto non compilato |
| 2026-10-17 | madre | PO-001 | La regola dell'interruttore vale dalle correzioni nuove. Le correzioni della 1.21.7, uscite prima, non la seguono. Non vengono riscritte. | Sono già pubblicate e coperte da `npm run correzioni`. Riscriverle costa senza ridurre rischi misurati |
| 2026-10-17 | madre | PO-004 | B6 (Indietro dopo una ricarica): si corregge. | Comportamento atteso già deciso (mappa › home › uscita); è un difetto, non una scelta di prodotto |
| 2026-10-17 | madre | PO-004 | B11 (gettoni degli attrezzi dopo «Unisci»): prima si misura; se si riproduce, si corregge. | Il codice dichiara già la regola («mai la somma», `src/persistence/salvataggio.js`); il difetto è solo da lettura del codice |
| 2026-10-17 | madre | PO-004 | B7 (record della Partita libera condiviso con la Sfida): portato al PO. | Separarli cambia i dati e ciò che il giocatore vede: è una scelta di prodotto non ancora presa |
| 2026-10-17 | PO | PO-004 | B7: i record della Partita libera e della Sfida si separano. Il record esistente resta alla Partita libera. | Scelta del PO tra tre opzioni («Separo i due record») |
| 2026-10-17 | PO | PO-002 | La Torre (1.22.0) esce dopo la 1.21.8, con dentro le sue correzioni. | Scelta del PO («Dopo la 1.21.8») |
| 2026-10-17 | madre | PO-004 | B7 va a una figlia a parte (ramo `sviluppo/b7-record-1.21.8`). | Le figlie nel cloud non ricevono messaggi dalla madre; un filone per figlia |
| 2026-10-17 | madre | PO-004 | B11: unendo i salvataggi vince il documento degli attrezzi con più gettoni riscossi, e a parità quello con meno disponibili (opzione 1 della figlia). | Così i gettoni spesi non tornano e quelli guadagnati altrove non si perdono. Le opzioni 2 e 3 perdevano l'una o l'altra cosa |
| 2026-10-17 | madre | PO-004 | B7: all'inizio il record della Sfida è il punteggio più alto già nell'archivio delle sfide, senza scrivere niente. Le etichette di catena, mossa e intreccio restano come sono. «Azzera» non elenca a parte il record della Sfida. | Opzioni consigliate dalla figlia; nessuna cambia il prodotto oltre la decisione del PO |
| 2026-10-17 | madre | PO-004 | B6 è stato misurato anche sulla build di produzione (vite preview, senza StrictMode): «mappa > home > fuori» con la correzione, «mappa > home > home > home > fuori» senza. | La lettura del rapporto segnalava che la prova girava solo sul server di sviluppo, dove StrictMode esegue due volte gli effetti |
| 2026-10-17 | madre | PO-004 | Le correzioni si uniscono sul ramo `rilascio/1.21.8`, non su main. | Ogni push su main pubblica il sito: main si muove solo a gate verde |
| 2026-10-17 | madre | collaudo 1.21.7 | C1 (la home scorre di 2 px a 360x640, dipende dal font): si corregge con l'opzione (a), 2-4 px in meno sotto i 380 px. | La promessa «la home non scorre» è già decisa (`src/styles/app.css`, `npm run correzioni` B10) |
| 2026-10-17 | madre | collaudo 1.21.7 | C2 (NaN da sfide importate guaste): si scartano le voci senza `best` e `partite` numerici. I giorni futuri non si scartano. Si ripulisce anche il documento degli attrezzi importato (numeri interi non negativi). | Scartare i giorni futuri sarebbe una regola nuova di prodotto, con rischio se l'orologio del telefono è indietro: senza una decisione del PO non si fa. Gli attrezzi non passavano da `ripulisci` (rischio segnalato su B11) |
