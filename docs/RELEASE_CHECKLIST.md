# Gate di rilascio — PLINTO

Stato all'**11 settembre 2026**. Il gioco **è pubblicato in test chiuso** sul Google Play
Store (canale Alpha, versione approvata e installata su telefoni veri). Non è ancora in
produzione: Play chiede 12 tester per 14 giorni consecutivi prima di consentirlo, e quel
conteggio non è ancora completo. Le voci aperte restano elencate per prime, senza
addolcirle.

Legenda: **FATTO** verificato eseguendo qualcosa · **FATTO, in parte** / **FATTO, in corso** una parte è verificata e la nota dice quale pezzo manca · **APERTO** da fare · **BLOCCATO** dipende da una decisione o da un dato che non abbiamo · **DA VERIFICARE FUORI** richiede una competenza che questo progetto non ha.

---

## Bloccanti: senza queste non si pubblica

| Voce | Stato | Nota |
| --- | --- | --- |
| Link PayPal per la donazione | **FATTO** | `PAYPAL_URL = 'https://paypal.me/elevoraCPM'`, deciso dal proprietario del progetto. Il nome del link è l'identificativo del conto ed è condiviso con l'altro gioco dello stesso autore: PayPal consente **un solo link PayPal.Me per conto** e non permette di modificarlo dopo la creazione ([FAQ PayPal.Me](https://www.paypal.com/us/cshelp/article/paypalme-frequently-asked-questions-help432)), quindi un link dedicato richiederebbe un secondo conto. Scelta consapevole: nel gioco non compare nessuna spiegazione, perché il nome del conto lo si vede sulla pagina di PayPal come in qualunque donazione, e all'uscita sugli store l'identità sarà comunque un'altra. Resta una donazione **esterna e senza nulla in cambio**: nessun acquisto in-app |
| Verifica di anteriorità sul nome PLINTO | **DA VERIFICARE FUORI** | La ricerca fatta (vedi `DIFFERENZIAZIONE.md`) non ha trovato collisioni nella categoria puzzle, ma **non è una verifica legale**: non è stato consultato nessun registro di marchi e le schede degli store non erano raggiungibili. Serve una ricerca professionale nelle classi pertinenti |
| Prova su dispositivi fisici | **FATTO, in parte** | Il gioco gira su telefoni Android veri, installato dal Play Store come applicazione (finestra di fiducia). Quel primo quarto d'ora ha trovato sei difetti che 382 prove automatiche non potevano vedere — un blocco all'avvio, l'icona tagliata dalla maschera del sistema, l'avvio a schermo intero sbagliato, il tasto Indietro che chiudeva l'app, la home che scorreva, la barra dell'indirizzo visibile — corretti nelle 1.3.2, 1.3.3 e 1.3.4. **Resta aperto iOS**: nessuna prova su iPhone |
| Playtest con persone reali | **FATTO, in corso** | Le prime persone hanno giocato. Il primo riscontro ha già cambiato il gioco: due su tre davano per scontato che il colore contasse qualcosa, e da lì è nata la Tinta (1.4.0). Il test chiuso è aperto e il numero di tester sta salendo: "è divertente" e "ho voglia di rigiocare" hanno ora un modo di ricevere risposta |

## Prodotto

| Voce | Stato | Nota |
| --- | --- | --- |
| Nucleo di gioco stabile | **FATTO** | 240 test in 16 file; invarianti verificate a ogni mossa su 240 partite complete |
| Nessun difetto critico noto | **FATTO** | Nessuno aperto al momento di questa revisione |
| Bilanciamento misurato | **FATTO** | Simulazioni su migliaia di partite, quattro profili di abilità, `npm run sim` |
| Equità verificata con numeri | **FATTO** | Il 91% delle partite finisce con la griglia fra il 40% e il 70%; sotto il 30% è lo 0,7% |
| Fine partita informativa | **FATTO** | Dice il motivo, mostra i numeri, il pulsante per rigiocare è il primo sotto il pollice |
| Nessuna pubblicità di alcun tipo | **FATTO** | Verificato dal test di privacy: nessuna rete, nessun dominio esterno |
| Nessun acquisto, energia, vite, timer | **FATTO** | Non esistono nel codice |
| Nessuna serie giornaliera da mantenere | **FATTO** | Scelta esplicita: le serie funzionano facendo paura di perdere qualcosa |

## Interfaccia e accessibilità

| Voce | Stato | Nota |
| --- | --- | --- |
| Contrasti conformi WCAG AA | **FATTO** | Misurati sul fondo più sfavorevole di ciascun tema e documentati in `DESIGN_SYSTEM.md`. Non è più una verifica manuale: `npm run contrasti` li ricalcola dai token e `tests/contrasti.test.js` lo esegue a ogni `npm test`, quindi una regressione fa fallire la suite |
| Partita completa da tastiera | **FATTO** | Verificata dallo scenario e2e |
| Annunci per lettori di schermo | **FATTO** | Verificati dallo scenario e2e |
| Bersagli tattili ≥ 44 px | **FATTO** | Portati a 48 px minimi dopo averli misurati a 34 px |
| Rispetto di prefers-reduced-motion | **FATTO** | Token e cicli continui, non solo le transizioni |
| Layout verticale e orizzontale | **FATTO** | Verificato in Chromium, non su dispositivi fisici |
| Traduzioni italiano e inglese | **FATTO** | Parità di chiavi, assenza di chiavi orfane e inventate: tutto sotto test |
| Prova su lettore di schermo reale (VoiceOver, TalkBack) | **APERTO** | Gli annunci sono corretti nel DOM; come suonino davvero non è stato ascoltato |

## Prestazioni

| Voce | Stato | Nota |
| --- | --- | --- |
| Fluidità in sessione lunga | **FATTO** | `npm run soak`: 377 mosse valide su 400 tentativi, fotogramma mediano 16,7 ms, nessuno oltre 50 ms su 2537, memoria da 10,9 a 11,7 MB, zero particelle rimaste. La prova era rimasta rotta per due versioni perché era l'unico controllo fuori da `npm run verifica`: ora ne fa parte |
| Nessuna perdita di memoria | **FATTO** | Memoria piatta a fine sessione; canvas ripulito a riposo |
| Peso del pacchetto | **FATTO** | Circa 63 kB compressi in totale |
| Prestazioni su dispositivo lento reale | **APERTO** | Misurato solo su un contenitore, non su un telefono di fascia bassa |

## Legale e conformità

| Voce | Stato | Nota |
| --- | --- | --- |
| Licenze delle risorse | **FATTO** | Nessuna risorsa di terze parti: nessuna immagine, nessun font, nessun file audio. Registro in `ASSET_LICENSES.md` |
| Audio senza campioni di terzi | **FATTO** | Generato a runtime da oscillatori |
| Informativa privacy | **FATTO** | `PRIVACY.md`, coerente col codice e protetta da un test automatico |
| Audit di differenziazione | **FATTO** | `DIFFERENZIAZIONE.md`, con i limiti della ricerca dichiarati |
| Revisione legale del prodotto | **DA VERIFICARE FUORI** | Nessuno può dichiarare "legalmente sicuro" senza un professionista, e questo documento non lo fa |
| Informativa pubblicata in una pagina raggiungibile | **FATTO** | `public/privacy.html`, pubblicata insieme al gioco e collegata dalla scheda del Play Store |

## Materiali di pubblicazione

| Voce | Stato | Nota |
| --- | --- | --- |
| Icona | **FATTO** | SVG originale, coerente con il marchio |
| Manifest PWA | **FATTO** | Nome, colori, icona; vincolo di orientamento rimosso perché esiste il layout orizzontale |
| Schermate per gli store | **FATTO, in parte** | Generate da `npm run schermate`, dal gioco vero, e rigenerate a ogni versione. **Quelle in linea sulla scheda del Play Store sono però più vecchie**: mostrano una home senza «Sostieni il progetto» e «Idee e segnalazioni» (arrivate con la 1.7.x) e nessuna frase di incitamento (1.9.0). Vanno ricaricate, vedi «Da fare dopo i 14 giorni» |
| Icona in PNG alle dimensioni richieste dagli store | **FATTO** | `npm run icone` le genera tutte dall'SVG, compresi il primo piano adattivo, l'icona classica e quella di avvio per Android, copiate nel progetto Android dallo stesso comando |
| Schermata di avvio | **FATTO** | Generata da `npm run icone` e dichiarata nel manifest Android; sta in una cartella qualificata per densità, altrimenti Android la moltiplica per la densità dello schermo e la mostra gigante |
| Descrizione del prodotto | **FATTO** | Scritta e pubblicata sulla scheda del Play Store, insieme alle schermate e all'immagine in evidenza 1024×500 (`npm run immagine-store`) |
| Account sviluppatore sugli store | **FATTO** | Account Google Play attivo e verificato, nome del pacchetto registrato, firma dell'app gestita da Play |

## Da fare dopo i 14 giorni di test chiuso

Queste due cose sono pronte nel repository e **volutamente non ancora caricate**. Il
motivo è uno solo: finché il conteggio dei 14 giorni consecutivi con 12 tester non è
completo, non si tocca nulla sul Play Console che non sia necessario. Le fonti di terze
parti dicono che un nuovo rilascio non azzera il contatore, ma la pagina ufficiale di
Google non è stata letta direttamente, e il rischio è asimmetrico: si guadagnano giorni
di estetica, se ne perdono settimane di attesa.

| Voce | Stato | Nota |
| --- | --- | --- |
| Caricare l'AAB con l'icona corretta | **APERTO** | Il `versionCode` è già a 10307 e `versionName` a 1.9.1. L'icona del launcher sta dentro l'app bundle: chi ha installato dal Play Store continua a vedere quella vecchia finché non si ricompila e ricarica. Per chi usa il sito o l'ha installata dal browser la correzione è già in linea dalla 1.9.1 |
| Attualizzare le schermate sulla scheda | **APERTO** | Quelle in linea precedono la 1.7.x. Le nuove si generano con `npm run schermate` e stanno in `store/`, già aggiornate alla versione corrente. Da rifare **dopo** aver caricato l'AAB, così mostrano l'app che si scarica davvero |

Nota su cosa richiede cosa: il caricamento delle schermate è una modifica alla **scheda**,
non un rilascio, quindi non ha bisogno di un AAB nuovo. Si fanno comunque in
quest'ordine, perché delle schermate che mostrano una versione non ancora distribuita
raccontano un'app che nessuno può ancora installare.

---

## Come si legge questo documento

Una voce è **FATTO** solo se esiste qualcosa che si può rieseguire per dimostrarlo:
un test, uno script, un numero misurato. "Sembra funzionare" non è uno stato.
