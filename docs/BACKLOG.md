# BACKLOG — richieste del PO

Una voce per richiesta del PO, numerata. Le parole del PO sono riportate tra «». Lo stato
si aggiorna qui; le scelte e il loro motivo stanno in `docs/DECISIONI.md`.

Stati: **aperta** · **in corso** · **in attesa del PO** · **chiusa**.

| Voce | Richiesta | Stato | Dove |
|------|-----------|-------|------|
| PO-001 | Regole di lavoro della sessione madre: verità e misura, registri, sessioni figlie, chi decide, rilasci (messaggio del 17 ottobre 2026) | in corso (regole in vigore) | questo file, `docs/DECISIONI.md`, `docs/ROADMAP.md` |
| PO-002 | Uscita della Torre (1.22.0) sul Play Store: «rilasciamo con la torre!» | aperta: il pacchetto Android esce con la 1.21.8 (PO-006); i livelli della Torre restano per la 1.22.0 | ramo `opera-torre`, `docs/USCITA-TORRE.md` |
| PO-003 | Quarta opera, La Piazza: «Sempre 100 livelli, solo dopo l'arena, valuta tu i casi particolari, ok qualche masso e mattone» | aperta (progetto scritto, sviluppo non avviato) | ramo `opera-quarta`, `docs/OPERA-QUARTA.md` |
| PO-004 | «affida una sessione ramo con sonnet 5.5 o haiku 5.5 un collaudo approfondito per verificare che in produzione non ci siano bug» | chiusa con la 1.21.8: B6, B7, B11 e i difetti C1, C2 del collaudo della 1.21.7 | ramo `collaudo-produzione`, `collaudo/RAPPORTO.md` |
| PO-005 | «avvisami quando è pubblicata» (la 1.21.8) | chiusa (notifica del 17 ottobre) | notifica alla pubblicazione |
| PO-006 | «oggi vorrei rilasciare il pacchetto con la nuova icona e problemi emersi che richiedono altrettanto il pacchetto aggiornato su android»; scelta: «Solo il pacchetto» | chiusa: AAB 11905 caricato dal PO, in revisione Google | `android/`, `docs/CHANGELOG.md` |
| PO-007 | «avvisami quando posso generare l'AAB» | chiusa | notifica dopo la pubblicazione |
| PO-008 | «fai in modo che quando l'app viene messa in background per qualche secondo la partita / missione non deve partire da 0!» | chiusa con la 1.21.9 | `docs/sviluppo/RAPPORTO-PO-008.md` |
| PO-009 | «Nella home del gioco non si capisce bene la distinzione tra partita libera e sfida del giorno, si confonde il player»; scelta: «Riga di spiegazione» | chiusa con la 1.21.10 | `docs/sviluppo/RAPPORTO-PO-009.md` |
| PO-010 | «Non si capisce il riprendeli partita, che cosa riprende... confonde» (schermata della home nell'app, 1.21.10, partita libera in corso); scelta: «Nome fisso + stato» | chiusa con la 1.21.11 | `docs/sviluppo/RAPPORTO-PO-010-G1.md` |
| PO-011 | «Il pulsante riprendi è un po' disallineato» (schermata dal telefono, 1.21.12) | chiusa con la 1.21.13 | `docs/sviluppo/po011/` |
| PO-012 | «avvisami quando è pubblicata» (la 1.21.13) | chiusa | notifica alla pubblicazione |
| PO-013 | «Togli il riprendi livello 20 (esempio), lascia Livello 20 come prima» | chiusa con la 1.21.14 | `src/ui/schermate/Home.jsx` |
| PO-014 | «l'app è già ottimizza anche per Tablet e PC?»; scelta: «1» (collaudo tablet e PC senza cambiare il prodotto) | chiusa con la 1.21.15, confermata dal PO nel questionario (P4, bersagli piccoli, resta da fare) | ramo `collaudo-schermi`, `docs/sviluppo/RAPPORTO-PO-014.md` |
| PO-015 | Fine del livello col gettone che scorre (E1 del collaudo della 1.21.15); scelta del PO: «Mappa ridotta» | chiusa con la 1.21.16 | ramo `fine-gettone`, `docs/sviluppo/RAPPORTO-PO-015.md` |
| PO-016 | (voce della madre) Fine del livello con atto chiuso e gettone che scorre su finestre basse da PC: 44 px a 1366x657, 39 a 1280x720 (proposta 2 del rapporto PO-015) | aperta | `docs/sviluppo/RAPPORTO-PO-015.md` |
| PO-017 | Google Play ha rifiutato l'AAB 11905 (1.21.8): «Broken Functionality — Loading problems: Your app doesn't open or load», area «Version code 11905: In-app experience» (email di Google inoltrata dal PO, 19 ottobre 2026) | in corso: l'APK 11905 si apre sul telefono del PO; resta da vedere cosa hanno visto i dispositivi di Google | `android/`, `docs/DECISIONI.md` |
| PO-018 | (voce della madre) «dal 11» nella fascia dell'atto (T1 del collaudo della 1.21.16) e caso «atto senza gettone» nel gate (O4) | aperta | `docs/sviluppo/COLLAUDO-1.21.16.md` |
| PO-019 | (voce della madre) B6 rosso una volta in CI sulla 1.21.16 (corsa 161), verde nelle corse successive: trovare la causa | chiusa con la 1.21.17 | ramo `b6-instabile`, `docs/sviluppo/RAPPORTO-PO-019.md` |
