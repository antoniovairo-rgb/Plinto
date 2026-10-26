# Gate di rilascio — PLINTO

Stato al **6 ottobre 2026**. **PLINTO è pubblico sul Google Play Store dal 5 ottobre
2026**: la pagina pubblica risponde dalle 17:54 UTC di quel giorno, con titolo «PLINTO -
puzzle a blocchi» e sviluppatore korward.devteam (verificato scaricandola senza account).
Prima release di produzione in 177 paesi. L'accesso alla produzione era stato concesso il
25 settembre; dopo oltre sette giorni di attesa l'assistenza di Google Play ha passato la
revisione al team con priorità. Il test chiuso è stato messo in pausa il 5 ottobre. Le voci
aperte restano elencate per prime, senza addolcirle.

Storia: il 24 settembre la Play Console aveva segnato completati i tre requisiti per la
produzione (release di test chiuso, almeno 12 tester, 14 giorni) e la domanda di accesso
era stata inviata lo stesso giorno.

**Il questionario inviato**: sei risposte libere da **300 caratteri al massimo** ciascuna (il
limite si scopre solo nel modulo: la guida di Google non lo dice) e due a scelta multipla. Le
risposte brevi effettivamente preparate sono nella conversazione del 24 settembre; la bozza
lunga, utile come fonte, è l'artefatto «Accesso alla produzione — PLINTO».

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
| Nucleo di gioco stabile | **FATTO** | 522 test in 32 file; invarianti verificate a ogni mossa su 240 partite complete; i cento livelli rigiocati nell'app a ogni giro completo del gate |
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
| Manifest PWA | **FATTO** | Nome, colori, icone (192, 512, maskable, SVG), `display: standalone`, `orientation: portrait` come nell'app Android: `tests/android.test.js` impone che i due manifest blocchino lo stesso orientamento, `tests/e2e/installazione.mjs` verifica che con questo manifest il gioco si installi e si apra senza rete |
| Schermate per gli store | **FATTO** | Generate da `npm run schermate`, dal gioco vero, e rigenerate a ogni versione: otto da 1236×2196 in `store/`. Il proprietario ha confermato il 5 ottobre che la scheda era già aggiornata; quali schermate siano in linea non si legge dalla pagina pubblica, quindi questa conferma è sua |
| Icona in PNG alle dimensioni richieste dagli store | **FATTO** | `npm run icone` le genera tutte dall'SVG, compresi il primo piano adattivo, l'icona classica e quella di avvio per Android, copiate nel progetto Android dallo stesso comando |
| Schermata di avvio | **FATTO** | Generata da `npm run icone` e dichiarata nel manifest Android; sta in una cartella qualificata per densità, altrimenti Android la moltiplica per la densità dello schermo e la mostra gigante |
| Descrizione del prodotto | **FATTO, in revisione** (5 ottobre) | Scritta e pubblicata sulla scheda del Play Store, insieme alle schermate e all'immagine in evidenza 1024×500 (`npm run immagine-store`). Il 5 ottobre la pagina pubblica mostrava ancora due testi vecchi: il paragrafo italiano sugli attrezzi (prima dei gettoni) e la descrizione completa inglese (ferma a prima della 1.17). Sostituiti con quelli della 1.19.4 di `android/SCHEDA-PLAY-STORE.md` e inviati in revisione lo stesso giorno. Da ricontrollare sulla pagina pubblica quando Google li approva |
| Classificazione dei contenuti (IARC) | **FATTO** (5 ottobre) | Avviso IARC «Live Rating Notice» del 5 ottobre: classificazioni attive su Google Play, PEGI 3 in Europa. Global Rating ID `9c349c8f-a9f6-8818-8ef0-3fa31370d3ac`, utile solo per pubblicare su un altro store che usa IARC. Va rifatto il questionario solo se l'app aggiunge pubblicità, acquisti, interazione fra giocatori o raccolta di dati: massi e mattoni rinforzati non lo richiedono |
| Account sviluppatore sugli store | **FATTO** | Account Google Play attivo e verificato, nome del pacchetto registrato, firma dell'app gestita da Play |

## Dopo l'uscita (5 ottobre 2026)

| Voce | Stato | Nota |
| --- | --- | --- |
| Pagina pubblica sul Play Store | **FATTO** (5 ottobre) | Controllata ogni tre ore dal 4 ottobre: risponde dalle 17:54 UTC del 5 ottobre. Chi era tester vede «(beta)» accanto al nome finché non esce dal programma beta (Play Store → profilo → Gestisci app e dispositivo → Beta); il pubblico vede il nome normale |
| Mettere in pausa il test chiuso | **FATTO** (5 ottobre) | Play Console → Test chiusi → Gestisci canale → Metti in pausa il canale. I tester tengono l'app e ricevono gli aggiornamenti di produzione |
| Annuncio del lancio | **FATTO, in corso** | Testi e grafiche preparati per gruppo dei tester, WhatsApp, Facebook, Instagram, LinkedIn, reel e volantino con QR code. Verificato dal proprietario: nello stato di WhatsApp il link nella didascalia di un'immagine si tocca. Su Instagram i link in didascalia non sono cliccabili: link nella bio e adesivo «Link» nelle storie |
| Prima correzione dopo l'uscita | **FATTO** (6 ottobre) | 1.19.5: «Livello successivo» dopo un livello recuperato portava su uno già superato. Pubblicata sul sito, quindi anche nell'app del Play Store senza un pacchetto nuovo |
| Caricare un AAB nuovo | **APERTO, senza fretta** | Il repository è a versionCode 11904, versionName 1.19.5. Serve solo per l'icona del launcher dentro il pacchetto e per il numero mostrato in «Informazioni app»: il gioco è quello del sito. Google aveva chiesto di non inviare versioni nuove durante la revisione, che ora è conclusa |
| La Torre (livelli 101-200) | **APERTO** | Pronta sul branch `opera-torre`. Il proprietario ha deciso di pubblicarla circa un mese dopo l'uscita, intorno al 5 novembre 2026; l'Arena (`opera-arena`) uno o due mesi dopo la Torre |

## Da fare dopo i 14 giorni di test chiuso (storico)

Queste due cose sono pronte nel repository e **volutamente non ancora caricate**. Il
motivo è uno solo: finché il conteggio dei 14 giorni consecutivi con 12 tester non è
completo, non si tocca nulla sul Play Console che non sia necessario. Le fonti di terze
parti dicono che un nuovo rilascio non azzera il contatore, ma la pagina ufficiale di
Google non è stata letta direttamente, e il rischio è asimmetrico: si guadagnano giorni
di estetica, se ne perdono settimane di attesa.

| Voce | Stato | Nota |
| --- | --- | --- |
| Caricare l'AAB con l'icona corretta | **FATTO** (in linea dal 5 ottobre): prima release di produzione, pacchetto **11901 (1.19.1)**, implementazione al 100%, compilato in Android Studio con la chiave di caricamento di sempre. | Il repository è già a 11902 (1.19.2), pronto per il prossimo caricamento: Play mostrerà «1.19.1» nelle informazioni dell'app finché non lo si carica, ma il gioco è quello del sito. Non c'è fretta: il 11902 non cambia niente nel pacchetto, solo il numero. L'icona del launcher sta dentro l'app bundle: chi ha installato dal Play Store continua a vedere quella vecchia finché non si ricompila e ricarica. Per chi usa il sito o l'ha installata dal browser la correzione è già in linea dalla 1.9.1 |
| Attualizzare le schermate sulla scheda | **FATTO** (confermato dal proprietario il 5 ottobre) | Quelle in linea precedono la 1.7.x. Le nuove si generano con `npm run schermate` e stanno in `store/`, rigenerate alla 1.19.0: **otto** immagini da 1236×2196 (9:16). Le versioni precedenti dello strumento ne producevano nove da 1170×2532, e la Play Console non le avrebbe accettate: la sua guida ammette al massimo otto schermate per tipo di dispositivo e un lato lungo non oltre il doppio del corto (2532/1170 = 2,16). Adesso lo strumento controlla i file prodotti e si ferma se non sono caricabili. Da rifare **dopo** aver caricato l'AAB, così mostrano l'app che si scarica davvero |

Nota su cosa richiede cosa: il caricamento delle schermate è una modifica alla **scheda**,
non un rilascio, quindi non ha bisogno di un AAB nuovo. Si fanno comunque in
quest'ordine, perché delle schermate che mostrano una versione non ancora distribuita
raccontano un'app che nessuno può ancora installare.

## L'avviso «API deprecate per l'edge-to-edge»: deciso di non intervenire

Il Play Console segnala che l'app usa API deprecate in Android 15
(`Window.setStatusBarColor`, `Window.setNavigationBarColor`, e dentro la libreria
`EdgeToEdgeController.setStatusBarColor` / `setNavigationBarColor`, richiamate da
`PwaWrapperSplashScreenStrategy.customizeStatusAndNavBarDuringSplashScreen`). È
etichettato **«Esperienza utente»**: non blocca né la pubblicazione né gli aggiornamenti.

**Da dove nasce.** PLINTO su Android non ha una riga di codice nativo: è una Trusted Web
Activity e l'unica Activity la fornisce `androidbrowserhelper`. Quelle chiamate sono
della libreria, ma a farle eseguire sono tre nostre dichiarazioni nel manifest:
`STATUS_BAR_COLOR`, `NAVIGATION_BAR_COLOR` e `SPLASH_IMAGE_DRAWABLE`.

**Perché non si tocca, per ora.** Su Android 15 e oltre quei due setter non hanno già
alcun effetto — è il motivo per cui sono deprecati — quindi lì dichiararli è inutile. Ma
su Android 7-14 servono ancora: colorano la barra di stato e quella di navigazione
durante la schermata d'avvio, e `minSdk` è 24. Toglierli zittirebbe un avviso sui telefoni
nuovi peggiorando l'avvio su quelli vecchi, e senza garanzia: quell'analisi Play la fa sul
bundle caricato, quindi l'esito si saprebbe solo dopo averlo caricato.

**Cosa lo risolverebbe davvero:** una versione di `androidbrowserhelper` che non chiami
più quelle API. Per noi sarebbe cambiare un numero in `android/app/build.gradle`, dove la
dipendenza è fissata a `2.7.3`. Le versioni disponibili si leggono su
<https://github.com/GoogleChrome/android-browser-helper/releases>.

**Nota di fatto:** la release che l'avviso nomina è la **10305 (1.3.4)**, quella oggi in
test chiuso. Caricare la 10307 non lo farebbe sparire, perché monta la stessa `2.7.3`.

---

## Come si legge questo documento

Una voce è **FATTO** solo se esiste qualcosa che si può rieseguire per dimostrarlo:
un test, uno script, un numero misurato. "Sembra funzionare" non è uno stato.
