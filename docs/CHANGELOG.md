# Changelog

Tutte le modifiche degne di nota a PLINTO. Il formato segue una versione semplificata di
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa
[Versionamento Semantico](https://semver.org/lang/it/).

La versione è dichiarata in un solo posto — il campo `version` di `package.json` — e
`vite.config.js` la inietta nel bundle come `__APP_VERSION__`.

## [1.19.4] — 26 settembre 2026

### Corretto

**Tutti i testi del gioco riletti, uno per uno, con una regola sola: chiarissimi per
chiunque, anche per un bambino, e una parola per una cosa sola.** Richiesta del
proprietario dopo la domanda «sono quattro?» sugli attrezzi.

- **Gli attrezzi si usano con i gettoni.** «Usi», introdotto nella 1.19.3, non convinceva:
  adesso quello che si guadagna ogni 5 livelli è un **gettone**, e con ogni gettone usi
  l'attrezzo che scegli tu. Il pannello dice «Hai 2 gettoni», la fine del livello «Hai
  guadagnato 1 gettone per gli attrezzi». In inglese *tokens*.
- **Un numero sbagliato nel profilo.** «Un quadrante vale 27 punti base, una riga o una
  colonna 9»: nelle regole una riga ne vale **18**. Il testo adesso prende i due numeri
  dalle regole, e non può più restare indietro.
- **Un comando da programmatori mostrato ai giocatori.** Il profilo diceva «Si rigenera
  con «npm run catena»». Tolto.
- **Una parola per una cosa sola:** «griglia» e non «tabellone»; «casella» e non
  «quadratino»; «i prossimi tre pezzi» e non «la prossima terna», parola che nessuno
  aveva mai spiegato; «Record» invece di quattro nomi diversi per lo stesso numero;
  «Condividi…» su tutti i pulsanti di condivisione; «Crea / Carica un salvataggio».
  In inglese l'Intreccio si chiamava in tre modi (Interlace, Interlock, Weave): adesso
  solo Interlace, e «grid» invece di «board».
- **Frasi riscritte perché dicessero la cosa com'è:** la Catena «scende se fai due mosse
  di fila senza eliminare niente» (diceva «se stai fermo»); il pezzo si rimette a posto
  «per correggere un tocco sbagliato» (diceva «il dito»); le sfide passate sono «la
  stessa partita di quel giorno» (diceva «ricalcolata»); l'introduzione spiega che i
  pezzi in mano sono tre, prima che la carriola parli di «mano».

`tests/lessico.test.js` adesso fa fallire le parole scartate, il numero scritto a mano e
qualunque comando `npm` nei testi. Nessuna regola di gioco cambia.

Anche la descrizione della scheda Play Store segue lo stesso vocabolario (caselle,
prossimi tre pezzi, gettoni, Interlace). Le schermate sono rigenerate: mostrano
«Prossimi tre pezzi» e «Record».

### Versioni

Il progetto Android passa a 11904 (1.19.4). I testi arrivano a tutti dal sito, senza
caricare un pacchetto nuovo su Play.

## [1.19.3] — 26 settembre 2026

### Corretto

**Il pannello degli attrezzi diceva «Hai 3 attrezzi» e poi ne elencava quattro.** Dal
gruppo dei tester è arrivata la domanda: «sono quattro?». Ed era giusto non capire: la parola «attrezzi»
indicava due cose diverse, i quattro attrezzi (carriola, gessetto, piccone, mensola) e il
numero di volte che si possono usare. Adesso ogni parola indica una cosa sola:

- **attrezzi** sono sempre i quattro strumenti;
- **usi** è quello che si guadagna (1 ogni 5 livelli superati, al massimo 3 da parte) e
  che si spende usando uno qualunque dei quattro.

Il pannello ora dice «Puoi usare gli attrezzi ancora 3 volte. Ogni volta scegli tu quale
ti serve: l'uso si consuma solo se l'attrezzo fa davvero qualcosa.», e quando non ne hai
«Per ora non puoi usare gli attrezzi. Guadagni 1 uso ogni 5 livelli superati, e ne puoi
mettere da parte al massimo 3.». Riscritte con la stessa regola, in italiano e in
inglese, anche le descrizioni dei quattro attrezzi, i messaggi di fine livello («Hai
guadagnato 1 uso degli attrezzi»), la legenda, la guida e l'aiuto. Nessuna regola di
gioco cambia: cambiano solo le parole.

### Versioni

Il progetto Android passa a 11903 (1.19.3). Il testo arriva a tutti dal sito, senza
caricare un pacchetto nuovo su Play.

## [1.19.2] — 25 settembre 2026

### Corretto

**Chi ha il telefono in una lingua che il gioco non ha lo trova in inglese, non più in
italiano.** La lingua della prima apertura si leggeva dal telefono e, se non era né
l'italiano né l'inglese, ricadeva sull'italiano: la lingua di riferimento delle
traduzioni, non quella da offrire a uno sconosciuto. Con il gioco in produzione in 177
paesi, un telefono in spagnolo, tedesco o portoghese si trovava tutto in italiano,
comprese le impostazioni dove si cambia lingua. Adesso si guarda anche l'elenco delle
lingue preferite del telefono, nell'ordine in cui le mette: si prende la prima che il
gioco conosce, e se non ce n'è nessuna l'inglese.

Chi ha già aperto il gioco non vede cambiare niente: la lingua scelta resta salvata nelle
impostazioni. Tre prove nuove in `tests/i18n.test.js`, e quella sulla lingua straniera
fallisce sul codice di prima.

### Versioni

Il progetto Android passa a 11902 (1.19.2). Su Play è in revisione la prima release di
produzione, 11901 (1.19.1): le informazioni dell'app diranno 1.19.1 finché non si carica
il pacchetto nuovo, ma il gioco che si apre è quello del sito, cioè questo.

## [1.19.1] — 23 settembre 2026

### Corretto

**La durata di una partita contava anche il tempo con l'app chiusa.** Era «fine meno
inizio», cioè tempo di orologio: una partita libera ripresa dopo tre giorni risultava lunga
tre giorni. Trovato dal test massivo prima della domanda di accesso alla produzione, e
riprodotto: **cinque minuti giocati, 4.325 registrati**. Il numero sbagliato finiva in tre
posti — la schermata di fine partita, il «Tempo di gioco» delle statistiche e il profilo di
gioco — e nelle statistiche restava per sempre, sommato a tutte le partite successive.

Adesso il motore somma il tempo **mossa per mossa**, e una pausa fra due mosse conta al
massimo due minuti. Chi ci pensa due minuti sta giocando; chi chiude l'app, o la lascia in
secondo piano, no — e dall'interno del gioco le due cose non si distinguono, quindi il tetto
vale per tutte e due. Un orologio spostato indietro a mano vale zero, non un tempo negativo.

**Una partita salvata con la versione precedente si riprende normalmente**: il tempo già
giocato non si può ricostruire (fine meno inizio è proprio il numero sbagliato), quindi si
riparte da zero e si conta da lì. Meglio qualche minuto in meno che tre giorni in più. I
totali già accumulati nelle statistiche **non** vengono corretti: non esiste un modo onesto
di sapere quanta parte di quel numero era gioco.

Il tetto sta in `core/engine.js` e non fra le regole: non cambia nessuna mossa, e lì avrebbe
cambiato l'impronta delle regole, dichiarando vecchio un riferimento misurato con regole
identiche.

### Strumenti

**Gli script di prova non lasciano più acceso il server di sviluppo.** Una ventina di script
avviano `npx vite` quando non trovano un server, e alla fine chiamavano `server.kill()`, che
ferma `npx` ma non `vite`: il server restava acceso a servire la versione di quel momento,
e il giro successivo lo trovava e misurava una versione vecchia. È il motivo per cui il
primo controllo del gate è «il server di prova serve questa versione», e per cui quel
controllo è fallito più di una volta. Visto anche oggi: dopo il gate restavano accesi un
`vite` e un `vite preview`. Adesso tutti e 24 gli script passano da
`tools/server-di-prova.mjs`: il server nasce in un gruppo di processi suo e all'uscita si
chiude il gruppo intero, per la fine normale, per ogni `process.exit` e per Ctrl+C.
Verificato lanciando gli script senza server acceso e interrompendone uno a metà: in
`/proc` non resta niente.

**Lo scenario delle frasi di incitamento non ripartiva mai a fine partita.** Cercava la
schermata finale con `.pl-screen--fine`, una classe che il gioco non ha mai avuto (la radice
di `Fine.jsx` è `.pl-fine`): se la partita libera, che parte da un seme a caso, finiva prima
del tempo, lo scenario girava a vuoto fino all'ultimo giro e dichiarava di non aver mai visto
il pulsante «Rimetti a posto». È fallito così una volta nel gate di questa versione, e 13
esecuzioni isolate dopo erano tutte verdi: un'intermittenza con una causa precisa, non un
caso. Verificato nel browser portando una partita all'ultima mossa: `.pl-fine` presente,
`.pl-screen--fine` assente.

Nella stessa giornata, senza cambiare il gioco: la caccia ai difetti del motore
(`tools/caccia-bug.mjs`, 40.000 partite senza incoerenze) e le schermate della scheda del
Play Store rifatte nel formato che la Play Console accetta. Il cacciatore controlla ora anche
che il tempo giocato non superi mai due minuti per mossa.

## [1.19.0] — 22 settembre 2026

### Tolto

**Il tema chiaro non esiste più.** Era un'opzione nelle impostazioni; adesso il gioco ha un
tema solo, quello scuro. Sono stati tolti la scelta, i suoi token e le sue misure di
contrasto.

**Chi aveva scelto il tema chiaro non resta bloccato**, ed era la parte che contava. Quella
parola stava scritta sul suo dispositivo: senza migrazione se la sarebbe portata dietro per
sempre, con l'interruttore per cambiarla sparito dalle impostazioni — un giocatore chiuso
dentro un tema che il gioco non disegna più e che non può abbandonare. Il documento delle
impostazioni passa alla versione 2 e toglie il campo, quindi alla prima apertura torna allo
scuro come tutti. Verificato aprendo l'app con un documento di versione 1 che diceva
`tema: "chiaro"`: l'attributo sulla radice risulta assente e le impostazioni salvate
tornano senza quel campo.

### Verificato

`tools/contrasti.mjs` misura ora un tema solo, e `tests/e2e/trionfo.mjs` non ripete più le
sue misure su due tavolozze. La ragione per cui quelle prove esistevano resta scritta nel
codice e in `docs/DESIGN_SYSTEM.md`, perché vale per il prossimo tema che qualcuno volesse
aggiungere: il tema chiaro era stato **pubblicato rotto** — punteggio in oro a 1,53:1,
cinque blocchi su sei sotto 3:1 — proprio perché lo strumento guardava solo l'altro. Un
tema si ridefinisce per intero, oppure non si offre.

In `docs/ARCHITECTURE.md` sparisce il debito tecnico «accessibilità del tema chiaro»: non
è stato risolto, è stato tolto l'oggetto.

## [1.18.0] — 21 settembre 2026

### I quadranti si vedono

Riga e colonna si vedono da sole — sono i bordi del tabellone — mentre il **quadrante va
disegnato**, e con obiettivi che dicono «chiudi 4 quadranti» il giocatore deve trovarli a
occhio, anche al sole e anche su uno schermo economico. Le linee che separavano i nove
riquadri erano sottili e di un blu appena distinguibile dal fondo.

Adesso la linea è più chiara e piena, e sotto le caselle passa una **velatura a scacchi**:
i quattro angoli e il centro sono appena più chiari degli altri quattro. Una linea si
perde, un'area no — è così che i tabelloni a nove riquadri si leggono da sempre. La
velatura sta **sotto** le celle e sotto i pezzi, quindi cambia il colore del vuoto e non
tocca il contrasto dei blocchi.

### Le schermate vuote non sono più una frase sospesa nel nero

Statistiche e profilo, prima della prima partita, erano una riga grigia in mezzo a
ottocento pixel di vuoto: sembrava un gioco incompiuto, non un dato che manca. Sono i
primi posti dove va un giocatore curioso, spesso **prima** di giocare. Adesso mostrano
Plinto, che cosa comparirà lì, e il pulsante per farcelo comparire.

### La home

**Le cinque voci di menu erano un elenco interrotto a metà**: stavano in una riga che
andava a capo e uscivano due, due e «Info» spaiata in mezzo. Ora sono una griglia a due
colonne con l'ultima voce a tutta larghezza — lo spaiamento diventa una scelta invece che
un effetto del ritorno a capo — e ognuna ha la sua icona, perché un simbolo si riconosce
prima di leggere la parola.

**Il trattino al posto del punteggio sembrava un valore mancante.** Un «—» accanto a
«Partita libera» si legge come un dato che non è arrivato, non come «non c'è ancora
niente» — e a vederlo è solo chi non ha ancora giocato, cioè chi si fa la prima
impressione. Adesso dicono «Mai giocata» e «Da giocare».

### La Catena spenta adesso dice a cosa serve

A Catena zero la riga era una barra grigia vuota e un «×1.00», cioè un moltiplicatore che
non moltiplica: una riga intera che non diceva niente proprio nel momento in cui il
giocatore ha più bisogno di capirla. Adesso dice «sale a ogni eliminazione», e la frase
sparisce da sola appena la Catena si accende.

### Verificato

- L'icona dell'app ripeteva a mano il vecchio colore dei quadranti: la prova che confronta
  la palette dell'icona con i token del gioco l'ha presa al primo tentativo.
- `tests/e2e/partita.mjs`: l'attesa dei blocchi dopo «Riprendi la partita» veniva
  inghiottita da un `catch` vuoto, e la prova proseguiva accusando «la partita è andata
  persa» quando la verità era «non è arrivata entro cinque secondi». Sono due difetti
  diversi e si cercano in due posti diversi. Adesso il messaggio dice quale dei due è, e
  l'attesa è di quindici secondi.

### Non fatto, e perché

Avevo proposto di spostare l'anteprima della prossima terna nella fascia sotto la plancia,
per usare lo spazio che sembrava vuoto. **Ritirata**: quella fascia contiene la riga del
suggerimento, e la posizione dell'anteprima sotto i pezzi in mano è una scelta già presa e
motivata nel codice — la terna successiva viene **dopo** quella che hai in mano e si legge
nell'ordine in cui arriva. Spostarla sopra avrebbe scambiato un problema con uno peggiore.

## [1.17.1] — 21 settembre 2026

### Corretto

**Mettere l'ultimo pezzo della terna sulla mensola fermava il gioco.** Segnalato giocando:
la mano restava vuota e la terna successiva non arrivava. Non era un blocco totale —
riprendendo il pezzo e giocandolo la mano tornava — ma si restava con **un pezzo giocabile
invece di tre**, e se quell'unico pezzo non fosse entrato da nessuna parte la partita si
sarebbe dichiarata finita mentre non lo era.

La causa è la solita: il rifornimento della mano viveva **dentro** `placePiece`, cioè
dentro l'unico modo che c'era di consumare un pezzo prima che la mensola esistesse. La
mensola lo consuma senza passare di lì. Adesso il rifornimento è una funzione sola che
entrambe le strade chiamano, e se un domani arriverà un terzo modo di svuotare la mano ci
sarà un punto solo da chiamare.

**La mappa contava come superati livelli che non lo erano.** Contava le *voci* salvate,
mentre la spunta sulla singola casella usa il criterio giusto — serve un numero di mosse
registrato. Chi apre un livello per insistenza, dopo otto tentativi falliti, ha una voce
senza mosse: la sua casella restava **senza spunta** e il livello veniva contato lo stesso
in «X di 100», nella barra, nel conteggio dell'atto, nel riquadro delle statistiche e
**nella scheda che si condivide**, che verso l'esterno dichiarava più di quanto era stato
fatto. La schermata si contraddiceva da sola.

### Aggiunto

**Sulla mappa si vede dove si guadagna un attrezzo.** Una cassetta sulla casella che porta
al prossimo, con la legenda sotto la testata.

Il segno **non sta ogni cinque caselle**, e la differenza conta: l'attrezzo matura ogni
cinque livelli *superati*, e per chi ne ha aperto uno per insistenza i due conti divergono.
Un segno fisso sulla quinta casella direbbe una cosa falsa proprio a chi ha già faticato di
più. Si conta quindi come conta la regola: i livelli non ancora superati, in ordine, sono
gli unici che possono far salire il totale, e si segna quello che porta il conto a un
multiplo esatto. È una previsione e si comporta da previsione — se salti un livello il
segno si sposta in avanti da solo.

**L'attrezzo guadagnato si festeggia.** Un messaggio c'era già, ma era una riga da 13,5px
schiacciata fra il titolo e il punteggio: la cosa migliore che succede in quel livello,
detta con il carattere più piccolo della schermata. Adesso è un riquadro con la cassetta,
la frase che festeggia e **quanti attrezzi hai in mano adesso** — il numero che serve per
decidere se usarne uno, e che prima non era scritto da nessuna parte.

### Verificato

- `tests/piccone-mensola.test.js`: la mano si rifà quando l'ultimo pezzo va sulla mensola,
  non si rifà negli altri casi (altrimenti la mensola diventerebbe un modo per cambiare la
  terna), e la partita non si dichiara finita se il pezzo messo da parte entra ancora.
  Verificata capace di fallire rimettendo il difetto: dice «la terna successiva non è
  arrivata».
- `tests/attrezzi.test.js`: il calcolo delle caselle da segnare è una funzione pura e
  provata, compreso il caso del livello saltato. Verificata capace di fallire sostituendola
  con «ogni quinto livello».

## [1.17.0] — 17 settembre 2026

### La curva di difficoltà è diventata una cosa che si misura

Fino a ieri la difficoltà dei cento livelli non era un obiettivo: era la **conseguenza
sperata** di tre leve mosse a mano atto per atto — il percentile del bersaglio, il tetto di
mosse, il margine — più un unico vincolo valido per tutti e cento, «almeno 4 riuscite su
12». Un solo pavimento, nessun soffitto, il livello 3 e il livello 99 con lo stesso
requisito.

Misurata a 24 partite per livello, la curva che ne usciva era questa, in riuscite medie del
giocatore artificiale per gruppo di dieci:

`84 · 85 · 74 · 61 · 57 · 60 · 56 · 54 · 44 · 63`

Quattro inversioni e un rimbalzo in fondo: il punto più duro del gioco cadeva al **livello
90**, e gli ultimi dieci si vincevano il **63%** delle volte contro il **44%** dei dieci
precedenti. Il finale si allentava.

**E non era il bersaglio.** Misurato come rapporto fra ciò che si chiede e ciò che il metro
raggiunge davvero, gli ultimi dieci stavano a 1,09 e i dieci prima a 1,09: identici. Era il
**tetto di mosse** — 26-40 nell'ultimo atto contro 22-32 nel penultimo. Con più tempo lo
stesso bersaglio si raggiunge più spesso.

Il controllo «nessun livello banale» non poteva prenderlo, perché chiede due condizioni
*insieme*: vinto quasi sempre **e** con molto tempo che avanza. Restava scoperto il caso
opposto, il livello vinto quasi sempre al fotofinish — il quadro 96 chiedeva 14 gruppi in 33
mosse, si vinceva 96 volte su 100 e il giocatore artificiale ne usava 30 su 33.

Adesso ogni atto dichiara una **banda di riuscite**, pavimento e soffitto, e il generatore ce
lo porta dentro togliendo o restituendo mosse; il bersaglio si tocca solo quando il tetto ha
finito la corsa. Le bande si sovrappongono di proposito — dentro un atto i livelli devono
variare — ma i due estremi scendono sempre, quindi la curva non può più risalire. La curva
uscita dalla rigenerazione:

| atto | livelli | riuscite | banda |
|---|---|---|---|
| fondamenta | 1-10 | 91% | 75-100% |
| pilastri | 11-24 | 72% | 65-90% |
| roccia | 25-40 | 63% | 55-85% |
| vuoto | 41-58 | 56% | 45-75% |
| strada | 59-76 | 53% | 40-65% |
| arco | 77-92 | 46% | 35-60% |
| ultima pietra | 93-100 | **39%** | 30-50% |

Un livello è rimasto fuori dalla sua banda e il generatore lo dichiara invece di forzarlo: il
**quadro 21** (gruppi 7 in 20 mosse) si vince 12 volte su 20 contro un pavimento di 13, con
il tetto già al massimo che il suo atto concede. Un'unità su venti, dentro il rumore di una
misura a scalini del 5%.

Il generatore ora **stampa la curva che è uscita davvero** e avvisa se risale in un atto: era
il controllo che mancava a tutti gli altri, ognuno dei quali guardava un livello alla volta e
non il percorso.

### Livelli che chiedono due cose insieme

Tredici livelli, dal quarto atto in poi, chiedono **due obiettivi insieme** — «chiudi 4
quadranti e arriva a Catena 2» — e vanno soddisfatti entrambi con le stesse mosse. Motore,
giocatore artificiale e le tre schermate che mostrano l'obiettivo lavoravano su una lista da
sempre: per cento livelli nessuno ne aveva mai avuti due. Ogni metà parte da un percentile
scontato di quindici punti, perché chiedere due cose è strettamente più difficile che
chiederne una e le mosse sono le stesse. Le tredici coppie sono tutte diverse fra loro,
confrontate senza ordine: «3 righe e 400 punti» e «400 punti e 3 righe» sono lo stesso
livello.

### Gli Intrecci da 5 livelli a 15

Erano in due atti soli, quattro dei quali consecutivi nello stesso tratto: una meccanica che
il gioco ha, che il generatore sa tarare come ogni altro cumulo, e che praticamente non
chiedeva mai. Ora sono in cinque atti su sette. La distribuzione dei tipi è più piatta:
gruppi 19, Catena 18, intrecci 15, quadranti 14, punteggio 14, righe 13, celle 11, colonne 9.

### La guida al primo avvio

**Diceva due volte le stesse cose.** Il primo passo elencava quattro regole, e due erano la
Catena e le bombe — che hanno un passo tutto loro, con il disegno e i numeri veri. La stessa
regola due volte in due minuti, in due versioni diverse, senza modo di capire quale fosse
quella completa. Adesso il primo passo dice solo quello che si fa con le mani.

**In quello spazio sono entrate due regole che la guida non diceva da nessuna parte**: che i
pezzi arrivano tre alla volta e i tre dopo arrivano solo quando li hai usati tutti, e che la
partita finisce quando nessuno dei pezzi in mano entra più da nessuna parte. La seconda si
scopriva perdendo, cioè nel momento peggiore per impararla.

**La Catena confondeva due numeri diversi.** Diceva «sale di uno… fino a ×3.25»: di uno sale
il *gradino*, mentre il numero sulla barra è il *moltiplicatore*. Ora la frase li collega, e
tutti e due i numeri vengono dalla funzione che li calcola davvero.

**Il disegno della Catena non somigliava alla cosa che nomina**: una barra gialla e basta,
mentre il testo parla della «barra». Adesso è la riga vera — etichetta, barra e
moltiplicatore — con il numero chiesto alla stessa funzione del gioco.

**L'Intreccio era l'unico passo senza disegno, ed era il più astratto**: chiedeva di
immaginare «due gruppi chiusi con una mossa sola» a chi non ha ancora mai chiuso un gruppo.
Ora mostra la stessa mini-griglia che lo spiega nell'apertura dei livelli.

### Corretto

**«Gruppo» non era spiegato dove viene usato.** È la parola più usata dalle regole —
Intreccio, Tinta, bombe e una dozzina di obiettivi la danno per nota — e per chi leggeva la
guida compariva al terzo passo senza definizione: la spiegazione esisteva solo nella
schermata di apertura di un livello che chiede proprio «chiudi N gruppi». Adesso la dà la
seconda regola di base.

**Due nomi per la stessa cosa.** Il quadratino della griglia era «casella» sedici volte e
«cella» due; in inglese «square» quasi ovunque e «cell» dentro la frase delle bombe, a due
righe da una che diceva «squares».

**In inglese la carriola si chiamava ancora «crane».** La 1.16.7 ha rinominato la gru in
carriola e il dizionario è stato aggiornato in tutte e due le lingue, ma la frase che presenta
il percorso elenca gli attrezzi a mano.

**La frase del premio delle esplosioni era imprecisa**, non solo contorta: «da 4 caselle in su
vale il 25% in più per ogni cella oltre la soglia» — letta alla lettera, a quattro caselle il
premio è zero. Il numero era giusto, la soglia mostrata era spostata di uno.

**«La partita libera non finisce mai»** era falso: finisce quando non entra più un pezzo.

**Il regolamento diceva «Catena» dove intendeva «regola 3».** La terza regola di base
nominava una cosa che nel gioco non c'è: «senza saltare un turno».

**L'apertura di un livello a due obiettivi tagliava l'intestazione.** Quella schermata centra
il contenuto verticalmente, e con due obiettivi il contenuto diventa più alto dello schermo:
`justify-content: center` spinge l'eccedenza fuori da *tutte e due* le estremità, e quella in
cima non si raggiunge nemmeno scorrendo perché `scrollTop` è già zero. Sul quadro 44
sparivano il nome dell'atto, il numero del livello e mezza riga dell'obiettivo. Nello stesso
punto, i due riquadri «COME FARE» uscivano identici uno sotto l'altro.

**Il file generato dei livelli aveva perso una funzione, e l'app non si avviava.**
`operaDelQuadro` — usata dalla scheda condivisibile e dalla schermata di fine livello — era
stata aggiunta **a mano** al file generato e mai rimessa nel modello del generatore: la prima
rigenerazione l'ha cancellata. 563 prove unitarie passavano, perché nessuna la importava e
quella che ne conta le *chiamate* legge il sorgente delle schermate, dove le chiamate c'erano
ancora. Mancava la definizione, non l'uso.

**Lo strumento di taratura non conosceva il tipo di obiettivo `intrecci`.** Aveva il ramo per
`intreccio` — il picco ormai in disuso — e non quello per il conteggio: il giocatore non
veniva mai spinto a chiudere più gruppi insieme, e i cinque livelli a intrecci risultavano i
più duri del gioco (mediana 1 contro un bersaglio di 3) per un difetto del **metro**. Il
generatore il ramo giusto ce l'aveva, quindi i livelli erano tarati bene.

### Verificato

- `tests/progressione.test.js` fissa la forma del percorso — livelli doppi, intrecci in più
  atti, nessun tipo confinato in un punto, nessun livello sotto le otto mosse — e controlla
  che il file generato **esporti ogni nome che l'app gli chiede**.
- `tests/lessico.test.js` scorre i valori dei dizionari e boccia i sinonimi vietati.
- `tests/aiuto-aggiornato.test.js` verifica che le regole di base non anticipino i passi
  successivi, che la guida dica come finisce una partita e che la frase del percorso chiami
  gli attrezzi con il nome che hanno nel dizionario.
- `npm run impaginazione` misura, su tutti i formati, che l'intestazione di un livello a due
  obiettivi si **veda**: con il CSS di prima segnala 8 problemi su 4 formati.
- `tests/e2e/tutti-i-livelli.mjs` cerca la vittoria fra **venti** semi e non più dodici, gli
  stessi su cui il generatore fa la sua promessa.

### Nota per chi sta già giocando

I cento livelli sono stati rigenerati: obiettivi e tetti di mosse sono cambiati quasi
ovunque. **L'avanzamento non si perde** — spunte, frontiera e livelli aperti per insistenza
stanno in `localStorage` indicizzati per numero, non per contenuto — ma i **record di mosse**
già registrati si riferiscono ormai a livelli diversi. I record della sfida del giorno non
sono toccati: le costanti di regolamento non sono cambiate.

## [1.16.8] — 17 settembre 2026

### Corretto

**«Supera il livello precedente» sotto un atto ancora chiuso diceva una cosa falsa.**
Quella frase è scritta per un livello solo — è l'etichetta del suo pulsante, dove «il
precedente» è davvero quello prima — ed era riusata come didascalia di un atto intero.
Sotto L'ULTIMA PIETRA, con il giocatore al livello 79 e l'atto che comincia dal 93,
faceva credere che mancasse **un** livello mentre ne mancavano quattordici. Adesso dice
«Si apre quando arrivi al livello 93»: il numero vero, e vale comunque si arrivi lì.

**Gli atti già finiti rendevano un paragrafo vuoto.** Non dice niente e l'altezza se la
prende lo stesso: su una mappa con sette atti erano cinque buchi. Adesso la didascalia
compare solo quando ha qualcosa da dire.

**Una chiave di traduzione era definita due volte nello stesso blocco.** È il difetto che
ha inghiottito in silenzio la prima stesura di questa correzione: in un oggetto JavaScript
due chiavi con lo stesso nome non sono un errore, **vince l'ultima**. Nella mappa è
comparso «{nome}: completo» — segnaposto grezzo compreso — al posto della frase nuova.

### Verificato

`tests/i18n.test.js` adesso **legge il sorgente dei dizionari** e rifiuta due chiavi con lo
stesso nome nello stesso blocco. Nessuna prova poteva accorgersene guardando l'oggetto: il
dizionario che ne esce è valido, il difetto sta nel file. Verificato capace di fallire
rimettendo il nome duplicato: segnala `it: quadri.attoChiuso`.

## [1.16.7] — 17 settembre 2026

### Cambiato

**La gru diventa la carriola.** Una gru non è un attrezzo da cassetta: è una macchina, e
stonava in fila con gessetto, piccone e mensola, che sono tutti oggetti che si tengono in
mano. La carriola fa anche il gesto giusto: carichi il blocco che non ti va, lo porti via e
torni con un altro.

**L'icona è stata rifatta due volte.** La prima sembrava un aquilone, ed era giusto: la
vasca era un quadrilatero chiuso e il manico scendeva a destra, cioè dalla parte sbagliata.
Quella buona ha la vasca a trapezio **aperta in alto**, i **due manici** all'indietro e in
alto, la ruota davanti e la gamba dietro. Scelta guardando cinque varianti renderizzate a
26, 52 e 88 pixel, non a occhio sul codice: a quella dimensione una sagoma o si riconosce
o non si riconosce, e dal sorgente non si capisce quale delle due.

Cambiano nome e icona, **non il funzionamento**: cambia un pezzo della mano, il pezzo che
arriva entra di sicuro sulla griglia, è diverso da quelli rimasti e non porta mai bombe, e
non costa una mossa.

**Nessun salvataggio si rompe.** Verificato prima di toccare qualsiasi cosa: l'identificativo
dell'attrezzo non compare in nessun dato salvato — il magazzino registra soltanto quanti
attrezzi hai e fino a dove hai riscosso. Quindi il rinomino non chiede nessuna migrazione.

**Le voci di changelog precedenti non sono state riscritte**: dicono ancora «la gru» perché
è quello che il gioco diceva allora, e una storia corretta a posteriori è una storia di cui
non ci si può fidare.

### Verificato

Il rinomino ha una trappola che valeva la pena evitare: `gru` è dentro **gru**ppo e
**gru**ppi, che sono le parole più usate del motore. È stato fatto solo su parola intera, e
le 548 prove — fra cui tutte quelle su Intreccio, Tinta e chiusura dei gruppi — passano
invariate.

## [1.16.6] — 17 settembre 2026

### Corretto

**«1 livelli su 100».** La scheda condivisibile non aveva il singolare, e ci passa ogni
giocatore nuovo: è la prima scheda che si condivide in assoluto. Adesso dice «Il Ponte:
1 livello su 100», in italiano e in inglese.

**Un controllo che fissava la prosa invece del fatto.** «Livelli nel browser» cercava la
scritta `1 di 100` alla lettera e ha bocciato la riga giusta — «Il Ponte: 1 livello su
100» — solo perché la formulazione era cambiata. Adesso guarda i **due numeri** e non le
parole che li circondano, e in più verifica che «1 livelli» non ricompaia.

### Come è andata davvero, perché resti scritto

La 1.16.5 è stata **pubblicata con il gate fallito**. Il gate aveva detto «1 controlli su
27 sono falliti. NON pubblicare»; la lettura dell'esito e il push stavano nello stesso
comando, e il push è partito lo stesso. Il gate ha funzionato: è stato ignorato.

Il controllo che si lamentava era stantìo, ma **aveva ragione su un'altra cosa**: senza di
lui il singolare sbagliato sarebbe passato inosservato. È l'argomento migliore che si possa
avere a favore del non pubblicare mai su un rosso, anche quando si è convinti di sapere
perché è rosso.

## [1.16.5] — 17 settembre 2026

### Corretto

**Anche la scheda di fine livello nomina il Ponte.** Diceva «Percorso 76 di 100», adesso
dice «Il Ponte: 76 livelli su 100».

È lo stesso difetto della 1.16.1, non sistemato fino in fondo: le schede condivisibili
sono **due** — quella presa dalla mappa e quella che compare vincendo un livello — ne avevo
corretta una sola, e l'altra ha continuato a dire «Percorso» per un giorno intero. Due
posti che devono raccontare la stessa cosa sono due posti di cui uno invecchia.

### Verificato

Due prove nuove in `tests/scheda.test.js`, scritte proprio contro questo modo di sbagliare:
la riga del percorso deve avere un posto per il nome dell'opera in tutte e due le lingue, e
**tutte e due** le schede devono chiedere quel nome a `OPERE` invece di scriverlo a mano —
contate le chiamate, devono essere due. Verificato capace di fallire rimettendo la
situazione di ieri, con una sola scheda sistemata: la prova dice «expected 1 to be 2».

## [1.16.4] — 17 settembre 2026

### Corretto

**«Hai 1 attrezzo: scegli quale farne» non era italiano.** Segnalata da chi giocava, ed
era una frase che avevo scritto io il giorno prima. Adesso dice «Hai 1 attrezzo: scegli tu
come usarlo. Lo spendi solo se fa davvero qualcosa», col plurale che cambia di
conseguenza. Rilette tutte le frasi aggiunte in questi giorni: ne è emersa una seconda da
sistemare, nella spiegazione delle bombe («prende un 25% in più» → «vale il 25% in più»).

**Un limite dichiarato.** Il controllo «comunicazioni» passa ogni schermata in tutte e due
le lingue e verifica che i testi ci siano, che non siano tagliati e che non restino chiavi
grezze a schermo: **non** verifica che siano scritti in buon italiano, e non può farlo.
Quella parte resta agli occhi di chi legge, ed è il motivo per cui una segnalazione come
questa vale più di un controllo automatico.

## [1.16.3] — 17 settembre 2026

### Corretto

**Non si capiva quale attrezzo si avesse a disposizione**, e le cause erano due.

La prima: **la pastiglia in partita disegnava la gru**. Guardandola si capiva «ho una gru»,
mentre la verità è che non ne hai uno in particolare — ne hai *tanti quanti* dicono i
pallini, e quale diventa lo decidi al momento di usarlo. Adesso l'icona è una **cassetta
degli attrezzi**: è il magazzino, non uno dei quattro.

La seconda, più seria: **il numero non era scritto da nessuna parte**. Stava
nell'etichetta per i lettori di schermo e nei tre pallini della pastiglia, e i pallini da
soli non dicono *che cosa* contano. Chi apriva il pannello vedeva quattro voci tutte accese
e leggeva «ho tutti e quattro gli attrezzi», mentre ne ha uno e sceglie che cosa farne.
Adesso il pannello lo dice a parole, al singolare e al plurale: «Hai 1 attrezzo: scegli
quale farne. Si paga solo quando fa qualcosa.»

### Verificato

`tests/e2e/attrezzi.mjs` controlla che il pannello riporti il numero di attrezzi davvero
posseduti. Verificato capace di fallire togliendo quella riga.

## [1.16.2] — 16 settembre 2026

### Aggiunto

**Il pannello degli attrezzi vuoto adesso è anche una legenda.** A zero attrezzi si
leggeva solo *come* si guadagnano — «uno ogni 5 livelli superati» — e non *che cosa* sono,
cioè l'unica cosa che poteva far venire voglia di ottenerli. Adesso i quattro attrezzi
sono elencati lo stesso, con nome e spiegazione, ma come **voci e non come pulsanti**: si
vede quello che ti aspetta e non c'è niente da premere per sbaglio. La paura di partenza
era giusta — un pulsante spento che non dice perché è un vicolo cieco — e resta rispettata.

### Corretto

**La pastiglia degli attrezzi si spostava a ogni mossa.** Segnalata con una fotografia:
«il loghetto tende a spostarsi a sinistra». La riga sotto la plancia sta in una colonna
centrata, quindi senza una larghezza sua **si stringe attorno al proprio contenuto** — e
il contenuto cambia in continuazione: «Rimetti a posto il pezzo», «Trascina un pezzo sulla
griglia», oppure niente. La pastiglia è agganciata al bordo destro di quella riga e le
andava dietro. Misurato: riga larga 374 col messaggio lungo e 386 senza, con la pastiglia
che scivolava verso il centro; senza messaggio la riga si riduceva quasi alla sola
pastiglia, ed è il caso della fotografia. Adesso la riga è larga quanto la plancia, come
già la barra della Catena, e la pastiglia sta ferma dove il giocatore l'ha vista l'ultima
volta. Un bersaglio che si sposta da solo è un bersaglio che si sbaglia.

### Verificato

`tests/e2e/attrezzi.mjs` misura dove sta la pastiglia **prima e dopo una mossa**, a quattro
larghezze: deve essere lo stesso pixel. Verificato capace di fallire togliendo la larghezza
alla riga: segnala lo spostamento a 390 e a 412.

`tests/e2e/attrezzi.mjs` controlla che a magazzino vuoto la legenda nomini e spieghi tutti
e quattro gli attrezzi e che **nessuna voce sia premibile**: non si deve poter spendere un
attrezzo che non c'è. L'elenco si disegna da `ATTREZZI`, quindi un quinto attrezzo comparirà
da solo. Verificato capace di fallire rimettendo l'elenco vuoto: segnala nove problemi.

## [1.16.1] — 16 settembre 2026

### Corretto

**Il pulsante «Rimetti a posto il pezzo» finiva sotto la pastiglia degli attrezzi.**
Segnalato da uno schermo vero al livello 73, con il testo tagliato a metà. Misurata dopo:
la sovrapposizione era di **69 pixel**, identica su tutte le larghezze provate da 320 a
412, quindi la vedeva chiunque avesse degli attrezzi e un pezzo da rimettere a posto.

La causa era una scelta fatta apposta e non portata fino in fondo. La pastiglia stava in
posizione assoluta per tenere il messaggio al centro esatto dello schermo: funzionava
finché il messaggio era una frase corta, ma «Rimetti a posto il pezzo» è un pulsante largo
e, centrato sullo schermo, ci arrivava sotto. **Un elemento fuori dal flusso non fa spazio
a nessuno** — è esattamente ciò che significa toglierlo dal flusso, e qui lo si era chiesto
senza accettarne la conseguenza.

Adesso la riga è una griglia di tre colonne (`1fr auto 1fr`): le due laterali sono uguali,
quindi il messaggio resta centrato sullo schermo come prima, e la pastiglia occupa una
colonna sua. Quando lo spazio non basta per entrambi, a cedere è il messaggio, che si
stringe, non la leggibilità. Il messaggio è stato incartato in un elemento suo: alcuni dei
rami di quella riga sono testo nudo, e in una griglia un nodo di testo diventa un elemento
anonimo che il foglio di stile non può collocare.

**La plancia era più piccola di quanto poteva essere.** Misurata: a 390×844 occupava
374 pixel su 390 di schermo, mentre in altezza ne aveva 466 a disposizione — **92 buttati**,
che essendo la plancia quadrata non si recuperano in nessun altro modo che allargandola.
Il tetto in larghezza sale da 96% a 99% dello schermo e i margini laterali scendono da 10
a 2 pixel; sugli schermi bassi, dove a vincolare è l'altezza e non la larghezza, lo stacco
sopra e sotto la riga del messaggio si stringe. Risultato misurato su cinque formati:
346→356, 374→386, 396→408, 270→276, 285→291. La griglia è il fulcro del gioco: ogni pixel
che non prende lei lo prende il vuoto.

**La mensola rimpiccioliva la griglia.** Si prendeva una striscia sua fra la plancia e i
pezzi, e su un telefono quella striscia la paga il tabellone: bastava usare l'attrezzo per
vedersi restringere il tavolo da gioco. Adesso sta nella colonna di sinistra della riga
sotto la plancia — era vuota, serviva solo a bilanciare la pastiglia degli attrezzi a
destra — e non costa un pixel in altezza. Misurato su tre formati: la plancia resta
identica prima e dopo aver messo via un pezzo.

**Gli attrezzi guadagnati e quelli persi non si vedevano.** Il gioco calcolava i due numeri
— li mette nel risultato di fine livello da quando gli attrezzi esistono — e **nessuna
schermata li leggeva**. Chi aggiornava dopo settanta livelli si ritrovava tre attrezzi
comparsi dal nulla e undici spariti in silenzio, senza una parola. Il caso non è teorico:
con 72 livelli già fatti maturano 14 attrezzi in una volta sola, ne entrano 3 e se ne
perdono 11. Perdere qualcosa senza che nessuno te lo dica è il modo più rapido di far
perdere fiducia in un gioco. Adesso la schermata di fine livello lo dice, al singolare e al
plurale, col numero esatto.

**La scheda condivisa nomina l'opera.** Diceva «PLINTO — Il percorso, 73 livelli su 100»,
che non dice a chi la riceve **di che cosa** sono quei livelli. I cento livelli hanno un
nome, il Ponte, ed è metà del motivo per cui esiste un gruppo: si sta costruendo qualcosa.
Il nome si chiede a `OPERE` e non è scritto nella scheda, così quando arriverà la Torre la
scheda lo dirà da sola.

**La plancia diventava un rettangolo bianco dopo un giro in secondo piano.** Segnalato con
una fotografia: al posto del tabellone un rettangolo bianco con l'icona dell'immagine
rotta, e dopo qualche secondo la griglia tornava. Non era un'immagine che non si carica —
in quella schermata non ce n'è nemmeno una, e l'unico elemento che può disegnare quella
icona è il **canvas delle particelle**, che sta sopra la plancia e la copre tutta.

Android lo fa apposta: quando l'app va in secondo piano il sistema recupera memoria, e la
memoria di disegno di un canvas è fra le prime a saltare. Al ritorno il browser non ha più
niente da disegnare e ci mette il segnaposto, che essendo grande quanto la plancia se la
mangia tutta.

Due difese, e servono entrambe. Quando la pagina si nasconde il canvas viene **azzerato**:
niente memoria da buttare via, quindi niente che possa tornare rotto, e al ritorno si
ricostruisce vuoto. Non si perde nulla, perché le particelle di una mossa durano meno di
mezzo secondo. E se la memoria salta lo stesso — succede anche a pagina visibile, sotto
pressione — il browser manda `contextlost`: fermandolo con `preventDefault` si chiede il
ripristino, e su `contextrestored` il contesto viene ripreso. Senza quel `preventDefault`
il canvas resta rotto per sempre.

### Verificato

`tests/e2e/impaginazione.mjs` fissa quanto è grande la plancia, e lo fa con un'invariante
invece che con un numero: essendo quadrata, **o è larga quasi quanto lo schermo, o ha finito
lo spazio in altezza**. Una plancia stretta *e* con l'aria attorno vuol dire che qualcuno le
ha rubato spazio senza accorgersene — che è esattamente com'era arrivata la mensola.
Verificato capace di fallire: riportando il tetto a 80% segnala otto formati.

`tests/e2e/attrezzi.mjs` controlla che usare la mensola non rimpicciolisca la plancia,
su tre formati, e `tests/attrezzi.test.js` fissa i numeri del caso «aggiorno dopo settanta
livelli»: 3 entrati, 11 persi, il conto che non riparte da capo, e il primo che matura dopo
va perso finché non se ne spende uno. Con una prova che la schermata di fine livello legga
davvero quei due numeri.

`tests/e2e/scenografie.mjs` sale a sette passi: finge il giro in secondo piano e controlla
che il canvas resti senza memoria mentre la pagina è nascosta, che al ritorno sia
ricostruito alle misure giuste e vuoto, e — la parte che conta davvero — che **dopo quel
giro gli effetti funzionino ancora**. Una difesa che spegne le particelle per sempre
sarebbe un difetto peggiore di quello che cura. Prova anche che `contextlost` venga
fermato. Verificato capace di fallire: togliendo le due difese segnala due problemi.

`tests/e2e/attrezzi.mjs` misura la sovrapposizione fra i due elementi a **320, 360, 390 e
412 pixel** di larghezza, e controlla anche che il testo del pulsante non venga tagliato.
Adesso i due distano 8 pixel su tutte e quattro. Verificato capace di fallire rimettendo il
posizionamento assoluto: segnala quattro problemi e riporta i 69 pixel di prima.

## [1.16.0] — 16 settembre 2026

### Aggiunto

**Il secondo tempo degli attrezzi: il piccone e la mensola.** La cassetta è completa, e la
scarsità non è cambiata: sempre **un attrezzo ogni 5 livelli superati, massimo 3 da parte**.
Raddoppiare le scelte senza raddoppiare la risorsa è proprio ciò che rende la scelta una
decisione invece di un elenco.

**⛏️ Il piccone toglie una casella già posata, quella che tocchi.** Non dà punti, non tocca
la Catena, non conta come mossa e non muove le statistiche. Non è pigrizia, è la regola
centrale di questo attrezzo: se scavare pagasse sarebbe una macchina da punteggio invece
di un aiuto, e se costasse una mossa sarebbe inutile proprio nei livelli a mosse contate,
cioè dove serve. Toccando una casella già vuota non succede niente e **non si paga**: il
dito storto capita, e un attrezzo perso per un dito storto è il modo più rapido di far
odiare un aiuto. Mentre il piccone è in mano la plancia è messa in evidenza, con lo stesso
richiamo che usano la gru e la mensola quando chiedono «quale?».

**🏗️ La mensola: ci appoggi un pezzo e te lo riprendi quando vuoi.** Appoggiare costa un
attrezzo, riprendere è gratis — un pezzo messo da parte che si deve ricomprare per riaverlo
non è messo da parte, è sequestrato. Il pezzo appoggiato **si vede sopra la mano**, non
dentro un pannello: un pezzo messo da parte che non si vede è un pezzo dimenticato, e un
aiuto dimenticato è un aiuto sprecato. La striscia compare solo quando c'è davvero qualcosa
sopra, perché ogni pixel fra la plancia e i pezzi lo paga il tabellone.

**Se quando lo riprendi la mano è piena, i due si scambiano.** Non è un vezzo: senza lo
scambio esiste un vicolo cieco vero. Appoggi un pezzo, giochi gli altri due, la mano si rifà
con tre pezzi nuovi, e quello sulla mensola non ha più dove tornare — resterebbe lì per
sempre mentre la partita lo conta come giocabile. Costo dichiarato: chi vuole può continuare
a scambiare e tenersi di fatto un quarto posto. È il prezzo di non avere trappole.

**La fine della partita adesso guarda anche la mensola**, e questa è la correzione più
importante di tutta la versione. Prima la partita finiva quando nessuno dei tre pezzi in
mano entrava più: con la mensola, appoggiarci l'ultimo pezzo giocabile avrebbe chiuso la
partita. L'attrezzo che serve a sbloccarsi sarebbe stato il modo più rapido di perdere, e
non è un caso di scuola — è proprio il momento in cui uno la mensola la usa, cioè quando la
mano non gli piace.

### Corretto

**«Come si gioca» diceva che la Tinta arriva a +100%. Ne paga 60.** Il numero veniva da
una formula ricopiata nella schermata (`TINTA_PASSO * 5`), giusta finché la soglia era 5 e
sbagliata dal momento in cui la 1.15.0 l'ha spostata a 7. La stessa formula esisteva anche
nella guida al primo avvio, scritta in un altro modo, e lì era rimasta giusta: è invecchiato
uno dei due posti, che è esattamente il modo in cui questi errori capitano. Adesso il numero
lo chiedono tutte e due alla funzione che assegna i punti, e la formula a mano non c'è più.

È un difetto che nessuno segnala, e vale la pena dire perché: chi apre quella pagina la apre
per imparare, quindi non ha modo di sospettare che sia sbagliata, e chi già sa la risposta
non la apre. Era in produzione dalla 1.15.0.

### Aggiornato l'aiuto, e d'ora in poi è un obbligo verificato

**«Come si gioca» ha due sezioni nuove.** Le esplosioni grosse (quanto valgono e da quante
celle comincia il premio, con i numeri veri presi dal motore) e **gli attrezzi del cantiere**:
come si guadagnano, il tetto, e l'elenco di tutti e quattro con la loro spiegazione. L'elenco
si disegna da `ATTREZZI`, quindi un quinto attrezzo compare da solo invece di essere
dimenticato. C'è anche il perché non ci sono nella sfida del giorno.

**La guida al primo avvio dice che gli attrezzi esistono**, in una riga del passo che parla
dei cento livelli — che è dove si guadagnano. Non un passo in più: la guida deve far
cominciare a giocare in fretta, e al primo avvio di attrezzi se ne hanno zero.

**`tests/aiuto-aggiornato.test.js` è il promemoria che non si dimentica.** Fallisce se
qualcuno ritara una costante senza riaprire l'aiuto, se aggiunge un attrezzo senza
documentarlo, o se rimette una formula scritta a mano al posto della funzione del motore.
Verificato capace di fallire in tutti e tre i modi. La stessa regola è ora scritta in
`CLAUDE.md`, perché una promessa che sta solo nella testa di chi ha scritto il codice non è
una regola.

### Verificato

**Prova che il motore non è cambiato per chi gli attrezzi non li usa.** Duecento partite
giocate dal giocatore artificiale con gli stessi semi, prima e dopo: 59.898 mosse,
1.586.772 punti, 209.619 celle eliminate, 200 partite chiuse. Numeri identici in ogni cifra.
Il campo nuovo nasce vuoto e il giocatore artificiale non lo tocca mai, quindi i cento
livelli si rigiocano uguali — e lo si è verificato invece di darlo per scontato.

**Quindici prove nuove** in `tests/piccone-mensola.test.js`, concentrate su quello che questi
due attrezzi potevano rompere: che lo scavo non sposti punteggio, Catena, mosse, mano o
generatore; che non accenda il «rimetti a posto» né rifaccia la festa dell'eliminazione
precedente; che appoggiare l'ultimo pezzo giocabile non chiuda la partita; e che la partita
finisca comunque quando non entra più niente, mensola compresa. Verificate capaci di
fallire: togliendo la mensola dal controllo di fine partita, la prova che conta fallisce.

**Un salvataggio della 1.15 resta valido.** Il campo nuovo è opzionale e «assente» si legge
«mensola vuota», che è esattamente com'era quella partita: nessuna migrazione, nessun salto
di versione dello stato, e una prova che parte proprio da un salvataggio senza il campo.

`tests/e2e/attrezzi.mjs` sale a dieci passi: il piccone che toglie una casella sola e non ne
tocca altre, il tocco a vuoto che non costa niente e non chiude il modo, lo scavo che non
consuma una mossa (18 → 18 a schermo), la mensola che prende e restituisce il pezzo, la voce
spenta quando la mensola è già occupata, e — su uno schermo basso 412×622 — che con la
mensola piena la mano resti dentro lo schermo e la pagina non diventi scorrevole. Verificato
capace di fallire: facendo pagare lo scavo a vuoto e il ritiro dalla mensola, segnala due
problemi.

## [1.15.0] — 16 settembre 2026

### Cambiato

**La Tinta smette di essere una mancia continua e diventa un premio vero.** Prima
scattava nel 44,9% delle eliminazioni — una ogni 6,1 mosse — e valeva l'1,12% dei punti di
una partita: cioè arrivava di continuo e non si sentiva mai. Ora la soglia è a 7 celle
dello stesso colore (era 5) e ogni cella oltre la soglia vale il 20% in più sul valore del
gruppo (era il 4%). Misurato sulle stesse 400 partite e sulle stesse 121.636 mosse, prima
e dopo: la Tinta scatta nel 10,0% delle eliminazioni, una ogni 27,5 mosse, e vale l'1,28%
dei punti. Nel totale è quasi la stessa cifra, ed è voluto — quello che cambia è che
adesso arriva tutta insieme in un momento riconoscibile invece di sciogliersi in
duecento elemosine da tre punti.

**Le esplosioni grosse valgono più di quelle piccole.** Fino a ieri far saltare due celle
o sette era la stessa cosa moltiplicata. Da 3 celle in su, ogni cella aggiuntiva vale un
25% in più sull'intera esplosione: sette celle non fanno tre volte due celle, ne fanno
quasi cinque. La soglia è 3 e non 4 per una ragione contata: su 5.870 detonazioni, le
esplosioni da 5 celle o più sono il 7,7% — un premio che si incontra una volta ogni
tredici non si impara, si subisce. A 3 scatta nel 19,4% dei casi, una su cinque, mentre la
detonazione MEDIA (2,4 celle) continua a non prendere niente: il premio resta per chi ha
aspettato il momento giusto. Le esplosioni passano dal 6,03% al 6,89% dei punti.

**Conseguenza da dichiarare, perché tocca i record.** Il punteggio medio di una partita
sale dell'1,5%. È poco, e i cento livelli restano vinti tutti e cento nel controllo che li
rigioca nell'app, ma è comunque un metro diverso: i punteggi fatti prima e quelli fatti
dopo non sono confrontabili al centesimo. E siccome cambiare una costante di `rules.js`
cambia l'impronta delle regole, **le Sfide del giorno registrate prima di questa versione
risultano ottenute con regole diverse**, e il confronto con lo stratega nel profilo resta
nascosto per quelle. Non è un difetto: è il meccanismo che impedisce di mettere in fila
punteggi ottenuti con due giochi diversi.

**Tre interruttori in meno nelle impostazioni: Animazioni, «Evidenzia i gruppi che stai
per chiudere» e Attrezzi del cantiere.** Erano tre modi di giocare a un gioco diverso da
quello che giocano tutti gli altri, nascosti in una schermata che quasi nessuno apre:
l'evidenziazione non spiega qualcosa che si potrebbe indovinare, spiega la regola centrale
del gioco, e lasciarla dietro un interruttore voleva dire lasciare al caso se un giocatore
la capisse. Restano accesi Suoni e Vibrazione, che spengono un fastidio e non una regola.

**Il movimento ridotto resta rispettato, ma lo chiede il telefono.** Chi ha attivato
«riduci animazioni» nelle impostazioni di sistema continua a vedere un gioco fermo: la
preferenza viene letta anche da JavaScript, perché le particelle sono disegnate su un
canvas e `prefers-reduced-motion` da solo non le tocca. Chi ha bisogno di meno movimento
lo ha già detto una volta al sistema operativo e non deve ripeterlo qui.

**Chi aveva spento gli attrezzi nella 1.14 se li ritrova accesi.** Quell'impostazione
salvata non ha più effetto, ed è voluto: senza questo, chi aveva abbassato l'interruttore
non avrebbe più avuto nessun modo di rialzarlo. Un controllo nel gate lo verifica proprio
partendo da un vecchio `attrezzi: false` salvato.

### Aggiunto

**Le scenografie della mossa.** Fin qui l'eliminazione aveva le schegge e basta, e le
schegge raccontano QUANTE celle sono saltate ma non DOVE: con quattro gruppi chiusi
insieme il tabellone diventava una nuvola uniforme, e l'intreccio — la cosa più difficile
del gioco — si vedeva meno di una riga singola.

- **L'onda d'urto** parte dal centro di ogni gruppo chiuso, e ha la forma di quello che è
  sparito: larga e schiacciata per una riga, alta e stretta per una colonna, tonda per un
  quadrante. Quattro onde che si allargano insieme si contano a colpo d'occhio.
- **La Tinta ha un alone tutto suo**: i blocchi se ne vanno accesi del proprio colore
  invece di sbiancare come gli altri. Ora che scatta una volta ogni ventisette mosse
  serviva qualcosa che dicesse perché il numero è più grosso, e dirlo nell'istante del
  premio invece che in una schermata di regole che non apre nessuno.
- **Le bombe bruciano** invece di sbriciolarsi: schegge del giallo della miccia, più
  veloci e più grandi, e un anello acceso stretto attorno alla deflagrazione.
- **La griglia svuotata accende un lampo dorato su tutta la plancia.** Era l'evento più
  raro del gioco e l'unico che si sentiva soltanto: c'erano un suono e una vibrazione, e
  niente da vedere. Chi gioca in silenzio, cioè quasi tutti in mobilità, non sapeva
  nemmeno che fosse successo qualcosa di speciale.

Tutto su un canvas solo, come le schegge: nessun nodo animato in più, e il ciclo di
animazione resta acceso solo finché c'è qualcosa da disegnare.

### Verificato

Un controllo nuovo nel gate, che sale a **ventotto**: `tests/e2e/scenografie.mjs` fa una
mossa sola su quattro partite costruite a mano e guarda cosa compare. Ha una metà «al
contrario» — la stessa riga con i colori mescolati NON deve accendere l'alone della Tinta,
e una mossa che non svuota la griglia non deve accendere il lampo — senza la quale
passerebbe anche con gli effetti sempre accesi, cioè senza provare niente. Verifica anche
che a riposo il canvas torni a zero pixel: le onde vivono nello stesso ciclo delle
schegge, e una che non scadesse terrebbe acceso un `requestAnimationFrame` per sempre.
Verificato capace di fallire: spegnendo l'alone della Tinta segnala il problema, spegnendo
il lampo dello svuotamento ne segnala un altro.

`tests/e2e/attrezzi.mjs` guadagna due passi al posto di quello che spegneva l'interruttore:
che un vecchio `attrezzi: false` salvato non faccia più sparire la pastiglia, e che nelle
impostazioni non ricompaia nessuno dei tre interruttori tolti.

Le prove del punteggio non ricalcolano più a mano le formule del motore: chiedono il
fattore alla funzione vera (`fattoreTinta`, `fattoreEsplosione`). Duplicare l'aritmetica
significava che ogni ritocco alla taratura faceva fallire prove che non erano rotte, e la
prova diceva «il motore calcola così» mentre in realtà diceva «io calcolo così».

Il riferimento dello stratega è stato rigenerato con `npm run catena` (impronta e5273fab):
è la misura su cui il profilo confronta la Catena del giocatore, e con regole nuove la
vecchia non valeva più.

## [1.14.0] — 15 settembre 2026

### Aggiunto

**Gli attrezzi del cantiere: si guadagnano giocando, si spendono quando ci si blocca.**
Primo di due tempi, con la gru e il gessetto; piccone e consegna arriveranno dopo, quando
si sarà visto come vengono usati questi.

- **La gru** cambia un pezzo della mano. Il pezzo che arriva rispetta tre regole, e ognuna
  si vede giocando: deve **entrare** sulla griglia di adesso, perché la gru si usa quando
  si è bloccati e riceverne un altro che non entra sarebbe una presa in giro a pagamento;
  deve essere **diverso** da quelli rimasti in mano, altrimenti «cambia un pezzo» è un
  attrezzo speso per niente; e non porta **mai bombe**, altrimenti cambiare pezzi
  diventerebbe il modo per coltivarle. Non costa una mossa: in un livello a mosse contate,
  un attrezzo che ne consuma una ti fa perdere prima, cioè l'opposto di un aiuto.
- **Il gessetto** segna sulla griglia dove conviene appoggiare, con un contorno
  tratteggiato che non si confonde né con un blocco già posato né con l'anteprima del
  pezzo che si sta trascinando.

**Una risorsa sola per tutti e due, un attrezzo ogni 5 livelli superati, massimo 3 da
parte.** Una sola risorsa e non due contatori separati: così la scelta di quale attrezzo
usare è una decisione, invece di spendere quello che avanza. Il tetto fa perdere davvero
quello che matura a magazzino pieno, ed è voluto: tenere il credito in sospeso sembra più
gentile ma svuota il tetto di significato, perché si arriverebbe all'ultimo atto con tre
attrezzi in mano e diciassette in attesa. Chi gioca lo sa prima: la pastiglia mostra i
posti liberi, non solo quelli pieni.

**Niente attrezzi nella Sfida del giorno**, per costruzione: vivono nel gestore dei
livelli, e la Sfida passa da un altro. È la stessa partita per tutti, e due punteggi
ottenuti con un numero diverso di attrezzi non sarebbero più confrontabili.

**Un interruttore nelle impostazioni** li spegne del tutto. Spenti, la pastiglia non
compare, ma si continua a guadagnarli: chi li riaccende dopo trenta livelli ritrova quello
che gli spetta, invece di scoprire che spegnere un aiuto gli è costato dei progressi.

### La trappola del suggeritore

Il cervello che consiglia è lo stesso che nel gate gioca e vince tutti e cento i livelli.
Portarlo dentro l'applicazione aveva un rischio preciso: quella funzione vuole un
generatore di numeri casuali, e passandogli quello della partita **chiedere un consiglio
avrebbe consumato casualità**, cambiando i pezzi in arrivo. Il suggerimento avrebbe
modificato la partita su cui era stato chiesto, e due giocatori nella stessa posizione
avrebbero ricevuto mani diverse a seconda di quanti consigli avevano chiesto. Si usa un
generatore separato, seminato dalla situazione: stessa posizione, stesso consiglio, e la
partita non si muove. Una prova confronta i pezzi che arrivano dopo, con e senza consiglio.

Il consiglio non è indebolito di proposito: un suggerimento volutamente mediocre sarebbe
una bugia verso chi ha speso un attrezzo. Il limite è la scarsità, non la qualità.

### Verificato

Ventuno prove nuove fra `attrezzi`, `gru` e `gessetto`, più un controllo nuovo nel gate che
sale a ventisette: `tests/e2e/attrezzi.mjs` prova il cablaggio nel gioco vero, cioè che
guardare il pannello non costi niente, che la gru cambi il pezzo toccato senza consumare
mosse, che il gessetto segni delle caselle e che l'interruttore spento faccia sparire la
pastiglia. Verificato capace di fallire: staccando la spesa dell'attrezzo dalla gru,
segnala due problemi.

## [1.13.4] — 15 settembre 2026

### Cambiato

**La faccia del livello fallito adesso è dispiaciuta.** È la terza versione in due giorni,
e le prime due sbagliavano in due modi opposti.

`deluso`, con le sopracciglia a V e la bocca all'ingiù, era un personaggio arrabbiato *con*
chi aveva appena perso: la domanda che il progetto si fa da sempre è «quando perdi, ti
sembra colpa tua?», e quella faccia rispondeva di sì. La 1.10.4 l'ha sostituita con
`incoraggia`, che però correggeva troppo: sorriso aperto e sopracciglia distese, cioè un
personaggio contento mentre tu hai perso. Visto sul telefono al livello 73, con l'obiettivo
a 8 su 9, sembrava che la cosa non lo riguardasse.

`dispiaciuto` è l'unica delle tre che guarda il giocatore invece del risultato:
sopracciglia con l'estremo **interno** alzato, che è il segno della dispiacenza ed è il
rovescio esatto della V della rabbia, bocca appena arcuata all'ingiù e pupille un po'
abbassate. Dispiaciuto *per* te, non *di* te.

Le altre due espressioni sono state tolte invece di lasciate nel vocabolario: una faccia
che nessuno usa è codice morto, e una faccia sbagliata rimasta a disposizione è un invito a
rimetterla.

### Corretto

**La barra dell'obiettivo era tagliata a metà riga.** Segnalato guardando la schermata: la
barretta sotto «Chiudi una colonna 0 / 1» finiva a due terzi del riquadro, e il numero
stava appiccicato all'etichetta invece che in fondo alla riga.

La causa, misurata e non ipotizzata: riga larga 350 pixel, colonna interna larga 159. La
regola di base di quella riga è scritta per `flex` e porta con sé `justify-content:
space-between`; quando la riga degli obiettivi è diventata una griglia, nella 1.10.4, quella
proprietà è rimasta addosso. Su una griglia non allarga le tracce, le impacchetta alla
larghezza del contenuto: la barra finiva larga quanto il testo sopra. Adesso la colonna è
dichiarata esplicitamente e prende tutta la riga, 318 pixel su 318 disponibili.

## [1.13.3] — 15 settembre 2026

### Cambiato

**I due modi di portare via i progressi non sono più presentati come pari.** Chiesto da chi
ci gioca: «Scarica il file e Copia il testo producono la stessa cosa, non sono ridondanti?».
Non lo sono, ma la schermata non lo diceva: due pulsanti identici affiancati costringevano a
indovinare quale scegliere.

Il file e il testo finiscono in posti diversi. Il file va nella cartella dei download, dove
quasi nessuno entra e dove il prossimo svuotamento lo porta via. Il testo lo incolli dove
tieni le cose che non vuoi perdere: una nota, un messaggio a te stesso. Su un telefono
quella è spesso l'unica cassaforte che si usa davvero. Adesso «Scarica il file» è il
pulsante pieno, «Copia il testo» sta sotto più discreto, e una riga dice a che cosa serve
invece di lasciarlo capire.

La sezione ha anche due metà dichiarate, «Porta via i progressi» e «Rimetti un salvataggio»:
senza, i quattro pulsanti erano un elenco piatto in cui non si capiva quali due andassero
insieme.

Una nota sulla giustificazione precedente, perché era debole. Il secondo pulsante era stato
scritto come ripiego, nel caso il download fallisse in silenzio dentro l'applicazione
installata. Quel fallimento non è mai stato osservato su un dispositivo vero: era una
supposizione, non un motivo. Il motivo vero è dove finiscono le due cose.

## [1.13.2] — 15 settembre 2026

### Sicurezza dei dati

**«Azzera i miei dati» diceva meno del vero.** L'avviso recitava «Cancella record,
statistiche e partita in corso»: ometteva i livelli superati, il profilo di gioco,
l'archivio delle sfide e le impostazioni. La funzione dietro quel pulsante cancella ogni
cosa che il gioco abbia mai scritto. Chi aveva sessantanove livelli leggeva quella frase e
poteva concludere che fossero al sicuro, e toccare. Non c'è modo di tornare indietro.

Ed era un tocco solo, in fondo a una schermata che si scorre col pollice.

Adesso la conferma è una **finestra sospesa con due passi**, e il primo elenca che cosa
sparisce, voce per voce, con quanto ce n'è: livelli superati, partite giocate, punteggio
record, giorni di Sfida. Le voci a zero non compaiono, perché elencare cose che non
esistono fa sembrare grave una cancellazione che non toglie niente. Sotto, la riga che
copre il resto: profilo di gioco, impostazioni e partita in corso. Il secondo passo dice
l'unica via di ritorno che esiste davvero, cioè il salvataggio esportato, che sta due
pulsanti più su.

### Cambiato

**Le conferme che cancellano sono finestre, e sono una sola cosa.** Ricominciare dal
livello 1 e azzerare i dati usano lo stesso componente: stessa forma, stessi due passi,
stesse regole. Tenerli in due pezzi di codice separati vorrebbe dire che un giorno uno
avrà due conferme e l'altro una sola, e nessuno se ne accorgerà finché qualcuno non perde
qualcosa. Il componente garantisce che i passi siano sempre due e sempre dichiarati
(«Conferma 1 di 2»), che si esca con Escape o toccando fuori, e che **il «No» sia il
pulsante pieno e il «Sì» quello trasparente**: prima era il contrario, cioè la strada che
cancella era anche la più facile da toccare.

Prima erano righe di testo rosso in fondo a schermate lunghe, e si leggevano come un
avviso comparso da solo invece che come una domanda. Una finestra prende lo schermo: non
si può scorrere oltre.

**La sezione del salvataggio si legge.** I due modi di portare via i progressi erano testo
trasparente senza contorno, quindi sembravano collegamenti, e «Scarica il file» andava a
capo in mezzo alla riga. Adesso sono pulsanti pieni e la coppia dice la differenza in una
parola: «Scarica il file» contro «Copia il testo».

### Rimosso

**«Cancella il profilo» non c'è più.** Nata da una domanda di chi ci gioca: «che vuol dire
cancella il profilo?». La domanda era la risposta: in un gioco senza account, «profilo» fa
pensare a un account, mentre lì dentro ci sono solo statistiche su come giochi.

Quella voce non reggeva. L'informativa elenca due modi di cancellare i propri dati, e il
profilo non è mai stato uno di quelli: il primo di quei due lo porta via comunque. Restava
un terzo comando che cancella, in un gioco che ne aveva già due, per un caso d'uso stretto
e su dati che nel gioco non servono a niente. Ogni comando distruttivo in più è un modo in
più di perdere qualcosa per sbaglio. Resta la metà che serve, cioè portarsi via i propri
numeri. Tolta anche la funzione `azzeraProfilo`, rimasta senza chiamanti, e le due prove
che la coprivano.

### Verificato

`tests/e2e/salvataggio.mjs` adesso prova anche l'azzeramento totale, che prima non era
coperto da nessun controllo: le conferme devono essere due, ci si deve poter tirare
indietro a ciascuna senza che niente cambi, e l'elenco deve dire quanti livelli si
perdono. Verificato capace di fallire: collegando il primo «Sì» direttamente alla
cancellazione, segnala che manca la seconda conferma.

Il controllo che verifica le due conferme del «ricomincia dal livello 1» non è stato
ritoccato: le etichette dei pulsanti sono rimaste identiche apposta, e continua a passare.

## [1.13.1] — 15 settembre 2026

### Sicurezza

**Adesso una politica di sicurezza dei contenuti c'è davvero.** Fino a ieri il progetto ne
dichiarava una severa dentro `netlify.toml`: un file che GitHub Pages non legge nemmeno.
Sembrava protetto e non lo era, e nessun controllo poteva accorgersene perché nessun
controllo guardava. Rimosso quel file, restava un gioco senza nessuna politica attiva, né
sul sito né dentro l'applicazione Android.

La politica ora sta in un `<meta>` scritto nella pagina al momento della build, che il
browser applica su qualunque hosting statico. Vieta tutto per impostazione predefinita e
riapre solo quello che il gioco usa davvero: il proprio codice, i propri fogli di stile,
le proprie immagini, il proprio service worker. Nessun dominio esterno è permesso, per
niente. L'audio non compare fra i permessi perché è generato con gli oscillatori: non si
carica nessun file.

**Ogni voce è misurata, non copiata da un esempio.** Si parte da «tutto vietato» e si
aggiunge solo ciò che l'applicazione ha chiesto mentre un controllo la attraversava intera
raccogliendo le violazioni. Risultato: zero violazioni su home, sette schermate, una
partita completa, la registrazione del service worker e il salvataggio esportabile, che
era il punto più a rischio perché crea il file con un indirizzo `blob:` ed è esattamente
il genere di cosa che una politica scritta a occhio blocca in silenzio.

**Due cose dette invece che nascoste.** La politica non è applicata in sviluppo: Vite
inietta codice suo nella pagina per l'aggiornamento a caldo, e una politica severa
impedirebbe al gioco di aprirsi con `npm run dev`. E da un `<meta>` il browser ignora
`frame-ancestors`, `report-uri` e `sandbox`: contro l'essere incorniciati in una pagina
altrui, su questo hosting, non c'è difesa possibile. Un controllo impedisce di dichiarare
quelle tre voci fingendo che funzionino.

### Verificato

Un controllo nuovo nel gate, che sale a ventisei: `tests/e2e/sicurezza.mjs`. Ha due metà, e
la seconda è quella che rende credibile la prima. Il gioco intero non deve produrre nessuna
violazione; poi uno script, un'immagine e una chiamata di rete verso un altro dominio
devono essere bloccati. Senza quella seconda parte, il giorno in cui il `<meta>` sparisse
per sbaglio il controllo direbbe «zero violazioni» e sembrerebbe una buona notizia.
Verificato capace di fallire: togliendo il plugin dalla build, segnala quattro problemi.

## [1.13.0] — 15 settembre 2026

### Cambiato

**I cento livelli sono Il Ponte, e i sette atti hanno nomi da cantiere.** Il nome del gioco
lo diceva già e nessuno lo aveva mai detto: un plinto è il blocco su cui poggia una colonna,
e Plinto è un blocco di pietra squadrato che ha preso vita. Il campo semantico era dentro il
gioco dal primo giorno, semplicemente non era mai stato usato.

| Livelli | Prima | Adesso | In inglese |
|---|---|---|---|
| 1-10 | Le basi | Le fondamenta | Foundations |
| 11-24 | Il ritmo | I pilastri | Pillars |
| 25-40 | Gli ostacoli | La roccia | The Rock |
| 41-58 | La pressione | Il vuoto | The Gap |
| 59-76 | Il mestiere | La strada | The Road |
| 77-92 | La maestria | L'arco | The Arch |
| 93-100 | La vetta | L'ultima pietra | The Last Stone |

Ogni nome dice ancora che cosa chiede quel tratto, solo senza spiegarlo: la roccia è il
terreno duro, cioè i livelli che partono con la griglia già occupata; il vuoto è il tratto
senza appoggi, cioè meno spazio e meno mosse; l'arco è dove non si può sbagliare di un dito.
I nomi possono essere evocativi perché dalla 1.11.0 la descrizione la fa la frase dell'atto:
prima il nome era l'unica cosa che descriveva quel tratto, e doveva essere didascalico.

La schermata dei livelli si intitola **Il Ponte** invece che «Livelli», e la festa finale
dice «Il Ponte è finito» invece di «Li hai finiti tutti».

### Aggiunto

**Le opere: i gruppi di livelli.** Oggi ce n'è una, il Ponte, e sono i cento livelli che
esistono. La struttura è al plurale lo stesso, perché è il punto: aggiungere un gruppo nuovo
deve voler dire aggiungere una voce e i suoi livelli, non rimettere mano a come il gioco è
fatto. I progressi sono già salvati per numero di livello, quindi un secondo gruppo che parte
dal 101 non chiede nessuna migrazione di quello che le persone hanno già fatto.

**La Torre, annunciata alla fine del Ponte.** Chi finisce i cento livelli vede il nome
dell'opera successiva, in lavorazione e senza date. Sta lì e in nessun altro posto: metterla
anche nella mappa vorrebbe dire mostrarla a chi è al livello 3, cioè promettere una cosa che
non esiste a chi non ha ancora finito quella che esiste. Non ha livelli dietro, e finché non
li ha si dice che è in lavorazione, non che sta per arrivare.

### Corretto

**Chi gioca in inglese non legge più l'italiano.** I nomi degli atti stavano scritti nel file
dei livelli, che è generato, e non passavano da nessuna traduzione: un'interfaccia inglese
mostrava «Le basi» e «La vetta». Adesso nel file dei livelli ci sono identificativi stabili
(`fondamenta`, `ultimaPietra`) e le parole visibili stanno nelle traduzioni, in tutte e due
le lingue. Un test controlla che ogni atto e ogni opera abbiano un nome in ogni lingua: se un
giorno il generatore aggiungesse un atto senza il nome, la prova fallisce prima che qualcuno
veda a schermo la chiave grezza.

### Verificato

**Il file dei livelli è stato rigenerato, e i cento livelli non sono cambiati.** Era il rischio
vero di questa modifica: il nome dell'atto stava dentro i dati generati, quindi toglierlo
voleva dire far ricalcolare tutto al generatore. Confronto riga per riga fra il file di prima e
quello di adesso, normalizzando il solo campo che doveva cambiare: cento livelli su cento
identici, bersagli, tetti di mosse e motivi delle griglie compresi.

## [1.12.0] — 15 settembre 2026

### Aggiunto

**Il salvataggio si può portare via, e rimettere.** Fino a ieri tutto quello che il gioco
ricorda stava soltanto nel browser di chi gioca, e l'unica cosa esportabile era il profilo
di gioco, che finiva negli appunti e non si poteva nemmeno reimportare. I cento livelli
superati non avevano nessuna via d'uscita: cancellare i dati del sito, cambiare telefono o
disinstallare l'applicazione li buttava via. Il prezzo cresce con il gioco, e i livelli
sono destinati a diventare di più.

In **Impostazioni → Salvataggio** adesso ci sono due vie in uscita e due in entrata:
scarica un file oppure copia il testo, scegli un file oppure incolla. Due e non una
perché il download non si comporta allo stesso modo ovunque, e dentro un'applicazione
installata può finire in un posto che chi gioca non trova. Il browser non dice se sia
riuscito: meglio due strade visibili che una sola che magari fallisce in silenzio. È la
stessa ragione per cui la scheda condivisibile ha un ripiego sugli appunti.

Nel file finisce quello che costa fatica: livelli superati, record, statistiche, profilo,
archivio delle sfide e impostazioni. Non ci finiscono le partite lasciate a metà né il
segnaposto della ripresa, che sono roba del momento: su un altro dispositivo diventerebbero
un livello a metà che non ricordi di aver cominciato.

**L'importazione unisce, non sostituisce.** È la regola che tutto il resto serve a
proteggere: reimportare un salvataggio vecchio non deve mai cancellare progressi più
recenti. Di ogni livello resta il risultato migliore, con lo stesso criterio che il gioco
usa già per i record (meno mosse; a parità di mosse, più punti), e i tentativi prendono il
valore più alto. Sostituire tutto resta possibile, ma è una scelta esplicita con conferma,
perché è l'unica che può far perdere qualcosa.

Tre decisioni che vale la pena sapere:

- **Niente si somma, si tiene il valore più alto.** Sommare vorrebbe dire che importare due
  volte lo stesso file raddoppia le partite giocate, e un numero che cresce da solo è peggio
  di un numero fermo. Il rovescio, detto chiaro: unendo due dispositivi su cui si è giocato
  davvero, i totali non si addizionano.
- **Le impostazioni viaggiano ma non si applicano unendo.** Tema, lingua e animazioni sono
  di quel dispositivo, non del giocatore: importare i progressi non deve cambiare il tema a
  chi lo sta usando. Si applicano solo scegliendo di sostituire tutto.
- **Il controllo di integrità è contro i file rotti, non contro i furbi.** Un'impronta del
  contenuto fa rifiutare un file troncato o modificato a mano, con un messaggio invece che
  con un salvataggio rovinato. Chi vuole ritoccarsi i record può ricalcolarla, e va bene
  così: il nemico qui è il file corrotto.

Questo non è una sincronizzazione e non va raccontato come tale. Protegge chi si ricorda di
esportare. Una sincronizzazione vera richiederebbe account e server, cioè le due cose che il
gioco dichiara di non avere dalla prima riga del readme.

### Verificato

Dodici prove nuove in `tests/salvataggio.test.js` e un controllo nuovo nel gate,
`tests/e2e/salvataggio.mjs`, che porta i controlli a venticinque. Il controllo nel browser
fa il giro vero: dieci livelli, esporta, cancella, reimporta, e devono tornare. Tutti e due
verificati capaci di fallire: trasformando l'unione in una sostituzione, quattro prove
unitarie su dodici e due controlli nel browser segnalano.

`PRIVACY.md` diceva «non esiste una copia altrove». Adesso una copia può farsela il
giocatore, quindi la frase distingue le due cose: dalla nostra parte non esiste nessuna
copia, e quella che fai tu resta sul tuo dispositivo e non viene mandata da nessuna parte.

## [1.11.0] — 15 settembre 2026

### Aggiunto

**Chiudere un atto non è più sempre la stessa cosa.** Fino alla 1.10.4 le sette fasce di
fine atto erano identiche: cambiavano solo il nome e l'intervallo dei livelli. Chiudere
«Le basi», cioè i primi dieci livelli, e chiudere «La vetta», cioè gli otto più difficili
del percorso, ricevevano lo stesso riquadro. Adesso la fascia cresce con l'atto, in tre
modi che non si sovrappongono.

- **Una frase per atto, e non è un complimento generico.** Ognuna dice che cosa ha chiesto
  davvero quell'atto, e viene da come l'atto è costruito in `tools/genera-quadri.mjs`:
  quali tipi di obiettivo usa, con che griglia di partenza, quante mosse concede, con che
  margine sono tarati i bersagli. «Sedici livelli cominciati con la griglia già occupata»
  per «Gli ostacoli» è il conto dei livelli dal 25 al 40 e l'elenco dei motivi di griglia
  di quell'atto, non un modo di dire.
- **Sette pallini, accesi quanti sono gli atti chiusi.** È la parte che cresce da sola:
  chiudere il sesto atto ne accende sei, e l'importanza si vede senza dichiararla. Contano
  gli atti davvero completi, non quelli raggiunti: chi ha saltato un livello nel primo
  atto vede il primo pallino spento anche mentre chiude il secondo.
- **Tre gradini di intensità, ricavati dalla posizione dell'atto.** I primi tre come
  prima; dal quarto al sesto il riquadro prende un alone d'ottone tenue; l'ultimo ha
  l'alone marcato, Plinto accanto al titolo e la riga che dice quanti livelli restano
  indietro. La scala non è un elenco scritto a mano: se un giorno gli atti fossero sei o
  otto si adatta da sola, e un test controlla che non scenda mai.

Quello che la fascia continua a NON fare è somigliare alla festa dei cento livelli. Resta
un riquadro dentro la pagina: se anche solo l'ultimo atto diventasse una schermata a sé,
la festa finale arriverebbe come la seconda volta che succede la stessa cosa.

### Corretto

**«1 atti su 7 completati» non si legge più.** Le due righe nuove hanno la loro forma
singolare, con la stessa convenzione che gli obiettivi dei Quadri usano già («1 atto su 7
completato», «Resta 1 livello indietro»). È il genere di dettaglio che fa sembrare
tradotto male un gioco che in italiano ci nasce.

### Verificato

Tre prove nuove in `tests/trionfo.test.js`: la scala di importanza segue la posizione e
non scende mai, i pallini contano gli atti chiusi e non quelli raggiunti, ogni atto ha la
sua frase in italiano e in inglese. Verificato che sappiano fallire: forzando l'intensità
a un valore fisso, la prima segnala. In `tests/e2e/trionfo.mjs` la fascia del primo atto
adesso viene contata, non solo letta: sette pallini in tutto, esattamente uno acceso.

## [1.10.4] — 14 settembre 2026

### Cambiato

**La schermata «Livello non superato» incoraggia invece di rimproverare.** Segnalazione
dal test sul telefono, al livello 65 («Arriva a Catena 8», fermi a 3 su 8): il titolo era
rosso, Plinto aveva le sopracciglia a V e la bocca all'ingiù, e l'avviso «il livello
successivo si è aperto lo stesso» stava schiacciato fra il motivo della sconfitta e i
numeri, come un messaggio di sistema. Tre cose cambiate, ognuna con il suo perché:

- **Plinto ha una nuova espressione, `incoraggia`**: sopracciglia distese ad arco e un
  sorriso aperto ma non riempito, perché il sorriso pieno resta quello della vittoria.
  `deluso` non viene più usato da nessuna schermata: un personaggio arrabbiato *con* chi ha
  appena perso rispondeva «sì» alla domanda che il progetto si fa da sempre, «quando perdi,
  ti sembra colpa tua?».
- **Il titolo non è più rosso.** Usa il colore del testo; il verde della vittoria resta.
  Non superare un livello è un'informazione, non un errore.
- **Ogni obiettivo ha una barra di avanzamento** sotto il «3 / 8»: letto di fretta un numero
  è un numero, una barra piena a un terzo è una distanza, e dice che una parte è fatta. La
  cifra di un obiettivo completato è verde con una classe sua, `pl-fine__riga--fatto`.
- **La via d'uscita sta dopo l'obiettivo, in un riquadro col bordo verde**, allineata a
  sinistra: è la notizia buona della schermata e merita un posto suo.

### Corretto

**Un controllo che avrebbe potuto contare una sconfitta come vittoria.** La cifra di un
obiettivo completato portava la classe `pl-quadro-esito--vinto`, la stessa con cui
`tests/e2e/tutti-i-livelli.mjs` riconosce il titolo del livello superato. Oggi ogni
livello ha un solo obiettivo, e completarlo vuol dire vincere: il caso «sconfitta con un
obiettivo chiuso» non esiste ancora. Sarebbe esistito con il primo livello a due
obiettivi, e il controllo lo avrebbe contato vinto senza che nessuno se ne accorgesse.
Adesso la cifra ha una classe sua.

## [1.10.3] — 14 settembre 2026

### Rimosso

**Codice e voci che non servivano più, ognuna con la prova.**

- `ripulisciChiaviAbbandonate` e `CHIAVI_ABBANDONATE` in `storage.js`, con la chiamata
  all'avvio in `App.jsx`. Cancellavano le due chiavi della «partita libera con anteprima»,
  una modalità sparita nella 1.1.0 del 7 settembre. Il test chiuso su Google Play è iniziato
  il 10 settembre con una versione successiva: nessuna installazione dallo store ha mai
  avuto quelle chiavi, e chi le aveva dal sito le ha viste cancellate alla prima apertura
  dopo la 1.1.0. Le migrazioni dei documenti (`documenti.js`, `progressi.js`) restano: quelle
  proteggono progressi veri, questa proteggeva da due voci morte.
- La regola `.pl-home__record` in `app.css`: nessun componente la usa dal commit `096f93f`,
  trovato con `git log -S`.
- Tre voci di `.gitignore` che niente nel repository produce: `dist-ssr/` (non c'è
  rendering lato server), `coverage/` (nessuna copertura configurata), `/tmp-sim/` (nessuno
  script vi scrive). `.prova-sw/` resta: la usa `installazione.mjs`.

### Corretto

**Un colore copiato a mano è tornato a passare dal token.** L'anello della Catena (1.9.3)
usava `rgba(242, 193, 78, 0.22)`, cioè `--pl-brand` ricopiato in decimale: esattamente la
cosa che `DESIGN_SYSTEM.md` dichiarava sparita, e che ignorava il tema chiaro, dove
`--pl-brand` è un altro colore. Ora è `color-mix(in srgb, var(--pl-brand) 22%, transparent)`,
come le altre sei velature del file. La frase del documento torna vera e porta la data del
ricontrollo.

**La documentazione dice i numeri di oggi, non quelli del 6 settembre.** `README.md`
dichiarava il gioco «non ancora pubblicato»: è su GitHub Pages e in test chiuso su Google
Play. `AVVIO-RAPIDO.md` prometteva «100 test in meno di due secondi»: sono 483 in 28 file,
circa venti secondi. `ARCHITECTURE.md` elencava 16 file di test e 7 scenari: sono 28 e 18;
i pesi della build erano quelli di 68 moduli, oggi sono 106. `TESTING.md` contava
«diciannove controlli»: sono ventiquattro. `RELEASE_CHECKLIST.md` diceva che il manifest
non vincola l'orientamento: lo vincola a `portrait`, come l'app Android, e un test impone
che i due coincidano. Le misure di simulazione e di contrasto datate 6 settembre restano
con la loro data, perché non sono state rieseguite e cambiare la data senza rimisurare
sarebbe una bugia.

**Cosa non è stato toccato, e perché.** I due PNG identici (`store/immagine-in-evidenza.png`
e `public/anteprima-social.png`) sono una copia voluta da `immagine-store.mjs`: uno va sullo
store, l'altro è l'anteprima dei collegamenti servita dal sito. `sito-radice/` è il patto
TWA con la radice del dominio. Gli strumenti di misura in `tools/` sono tutti richiamati da
`package.json` e servono alla taratura dei livelli.

## [1.10.2] — 14 settembre 2026

### Cambiato

**Il primo pulsante del menu di pausa adesso dice dove porta: «Torna alla partita».**
Segnalato da un tester: «il *Chiudi* è poco parlante». Aveva ragione, e il motivo è
preciso: in un menu sospeso sopra la partita «Chiudi» non dice **che cosa** chiude, il
menu o il gioco. Sotto c'è «Torna ai livelli», che invece una destinazione la dichiara, e
il contrasto rendeva la prima voce ancora più muta. Cambiato in tutti e due i menu di
pausa — quello dei livelli e quello della partita libera — perché l'ambiguità era la
stessa.

Scartato «Continua», che in un livello si può leggere come «vai al livello successivo», e
«Torna al livello», troppo simile al «Torna ai livelli» che gli sta due voci sotto.

### Verificato

**Il menu di pausa adesso viene letto prima di essere usato.** `npm run comunicazioni`
lo apriva e lo chiudeva subito per tornare alla home, quindi il suo testo non passava da
nessun controllo: una chiave di traduzione sbagliata ci sarebbe comparsa dentro per
intero, in tutte e due le lingue, senza che niente fallisse. Adesso il contenuto del menu
passa dalle stesse trappole di ogni altra schermata. Verificato che il controllo sappia
fallire: storpiando di proposito la chiave, segnala «chiave di traduzione non risolta» sia
in italiano sia in inglese.

## [1.10.1] — 14 settembre 2026

### Corretto

**Mettendo l'app in secondo piano si perdeva il posto, e nei livelli si perdeva la
partita.** Segnalato da chi ci gioca: «è come se scadesse molto velocemente la sessione».
Su Android PLINTO gira dentro una Trusted Web Activity, cioè una pagina di Chrome a tutto
schermo: quando l'app va in secondo piano il sistema può buttare via quella pagina, e alla
riapertura la TWA la ricarica da zero.

Misurato prima di intervenire, perché erano **due difetti diversi**. La partita libera e
la Sfida non si perdevano: si salvano a ogni mossa, e infatti dopo il ricaricamento
`plinto:partita` era ancora lì. Quello che si perdeva era il **posto**: l'app ripartiva
dal menu. Un livello invece spariva davvero, perché `useQuadro` non salvava niente — dopo
il ricaricamento in memoria restava solo `plinto:settings`.

Adesso il livello si salva a ogni mossa come tutto il resto, e all'avvio il gioco torna
dov'era. Il salvataggio copre anche il «rimetti a posto»: sta in un effetto e non dentro
la mossa, altrimenti annullare avrebbe lasciato in memoria una copia che raccontava il
falso.

**Torna dentro solo se l'assenza è stata breve: due ore.** Non è una misura, è una scelta,
e sta scritta in un posto solo (`FINESTRA_RIPRESA` in `src/persistence/ripresa.js`).
Tornare dentro ha senso dopo una telefonata o una notifica; riaprire il gioco il giorno
dopo e ritrovarsi in una partita di ieri, con la griglia a metà e un punteggio che non si
ricorda, è una sorpresa e non una comodità. Passata la finestra il salvataggio **non**
viene buttato via: resta, e «Riprendi la partita» in home continua a funzionare. La
finestra decide soltanto se tornarci da soli.

**Uscire di propria volontà cancella il posto.** Chi torna all'elenco dei livelli ha
deciso di lasciare quel livello: ritrovarcisi dentro al prossimo avvio sarebbe il
contrario di quello che ha chiesto. Stessa cosa per la guida iniziale e per un
collegamento a una sfida, che vengono prima della ripresa: lì il giocatore ha chiesto
qualcosa di preciso.

**La presentazione del livello non si salva.** Chi viene interrotto mentre legge
l'obiettivo riparte dalla home e riapre il livello rileggendolo, invece di trovarsi dentro
una partita di cui non sa lo scopo.

**La home scorreva di 7 pixel su uno schermo da 360×640, e la 1.10.0 è stata pubblicata
così.** Il numero di versione sta nel piè di pagina, in fondo a una riga già piena
(«Sostieni il progetto · Idee e segnalazioni · v1.9.3»). Misurato: con `v1.9.3` la home
stava dentro **per un soffio**, alta esattamente 640 pixel su 640 disponibili, zero di
margine. Con `v1.10.0` — un carattere in più — la riga è andata a capo e la home ha
ripreso a scorrere.

Non è stato corretto stringendo quella riga, che rimanderebbe il problema al prossimo
numero lungo: sotto i 680 pixel di altezza la home recupera una ventina di pixel dai
respiri, così il piè di pagina può andare a capo quanto vuole. I telefoni più alti non
cambiano di una virgola.

**Il gate non se n'era accorto, e il motivo è più importante del difetto.** Il numero di
versione entra nel bundle quando il server di sviluppo **parte**, non a ogni richiesta.
Un server rimasto acceso da prima del cambio di versione continua a servire il numero
vecchio mentre tutto il resto del codice si aggiorna da solo. Il controllo
dell'impaginazione girava contro un server così, vedeva `v1.9.3`, e diceva «entra».

Due contromisure, perché una sola non basta:

1. **`npm run versione-servita`, nuovo e primo controllo del gate.** Se sulla porta di
   prova risponde qualcuno, deve servire la versione di `package.json`, altrimenti il
   gate si ferma subito dicendo cosa fare. Se non risponde nessuno va bene: ogni
   controllo si avvia il server da solo, e uno appena avviato la versione giusta ce l'ha
   per costruzione. Una guardia così esisteva già, ma solo dentro `tools/schermate.mjs`,
   nata dopo che delle schermate per il Play Store avevano dichiarato `v1.6.0` mentre il
   gioco era alla 1.7.0. Era la lezione giusta imparata in un posto solo.
2. **`npm run impaginazione` misura la home due volte:** con la versione vera e con una
   lunga apposta (`v10.20.30`). Un numero di versione che cresce è l'unica cosa certa di
   un progetto: un controllo che dice «entra» finché la versione è corta è un controllo
   che dice il falso a data ignota.

### Verificato

Dieci test unitari sulla decisione (che è pura) e un ventiquattresimo controllo del gate
(`npm run e2e-ripresa`) che simula l'interruzione con un ricaricamento vero — cioè
letteralmente quello che fa la TWA — su quattro casi: la partita libera torna allo stesso
punteggio, il livello torna allo stesso obiettivo e alle stesse mosse rimaste, un'assenza
oltre la finestra **non** riapre niente, e un'uscita volontaria nemmeno. Ognuno dei
quattro è stato fatto fallire di proposito prima di fidarsene.

## [1.10.0] — 13 settembre 2026

### Aggiunto

**La fine del percorso adesso è un momento, non una riga di testo.** Chi supera tutti e
cento i livelli trova una schermata tutta sua: i blocchi del gioco che cadono nei sei
colori, Plinto che salta, i numeri del percorso (livelli superati, mosse spese, quanti
sono caduti al primo colpo, e il livello che ha resistito di più) e la possibilità di
raccontarlo. Prima al centesimo livello compariva una frase: «Hai superato tutti i
livelli.»

**«Completo» vuol dire superati davvero, non «sono arrivato al centesimo».** Al livello
cento si arriva anche per insistenza: dopo otto tentativi falliti il successivo si apre
lo stesso, senza spunta. Chi ci arriva così può vincere il centesimo avendone lasciati
indietro cinque, e festeggiare «li hai superati tutti» sarebbe una bugia detta proprio
nel momento in cui il gioco dovrebbe essere più sincero. La festa guarda quanti ne sono
stati superati, non quale numero porta l'ultimo; a chi è in fondo con dei buchi il gioco
lo dice, e gli indica dove sono.

**L'annuncio dei prossimi livelli è senza date.** «Altri livelli sono in lavorazione. Non
c'è ancora una data: quando ci saranno, li trovi qui.» Una data scritta lì è una promessa
che chi ha appena finito cento livelli tornerebbe a riscuotere. Un test controlla che quel
testo non contenga mesi, anni, «presto» o «settimane», in entrambe le lingue.

**Una festa più piccola a ogni atto chiuso.** I cento livelli sono già raggruppati in
sette atti (Le basi, Il ritmo, Gli ostacoli, La pressione, Il mestiere, La maestria, La
vetta): chiuderne uno adesso mostra una fascia dedicata, dentro la schermata di vittoria.
Non somiglia alla festa finale, ed è voluto: se le somigliasse, quella finale arriverebbe
come la settima volta che succede la stessa cosa. Compare solo quando l'atto si chiude
davvero, mai rigiocando un livello dentro un atto già finito.

### Corretto

**Tenendo premuto su un pezzo si illuminava una casella al centro della griglia.**
Segnalato da chi ci gioca. Era il cursore della tastiera, che si posizionava al centro
appena si sceglieva un pezzo — in qualsiasi modo lo si fosse scelto, anche con un dito.
Mostrava una destinazione che non era nemmeno quella dove il pezzo sarebbe atterrato.
Adesso il cursore compare solo se il pezzo è stato scelto da tastiera, e si riconosce da
`detail === 0` sull'evento del clic, che distingue l'attivazione da tastiera da un tocco
vero.

### Verificato

**Il testo della festa resta leggibile sopra qualunque blocco.** I blocchi cadono dietro
al testo, ed è provato, ma «dietro» non basta: un quadrato pieno dietro una parola la
rende illeggibile lo stesso se i due colori non contrastano. È lo stesso difetto già
trovato con le frasi di incitamento, dove il contrasto scendeva a 1,09:1. Senza il velo
il titolo qui misurava 1,37:1 e il sottotitolo 1,09:1; con il velo stanno a 13,3:1 e
6,01:1 sul tema scuro, 15,21:1 e 6,3:1 sul chiaro. Il controllo calcola il fondo peggiore
componendo il velo sopra ognuno dei sei colori, quindi non dipende da dove si trovava un
blocco nell'istante dello scatto.

**La pioggia non copre né il testo né i tocchi**, e il ventiduesimo controllo del gate
(`npm run e2e-trionfo`) prova tutti e quattro i casi che contano: la festa compare
chiudendo il centesimo, **non** compare con un livello ancora da superare, la fascia
dell'atto compare chiudendolo e **non** torna rigiocando.

## [1.9.3] — 11 settembre 2026

### Cambiato

**L'avviso della Catena lo dice la barra, non una riga di testo rosso.**
Segnalato da chi ci gioca: «il messaggio rosso e' bruttino e non armonioso con il resto
della grafica». Aveva ragione, e il motivo e' preciso: quel rosso e' `--pl-danger`, lo
stesso colore del pulsante che cancella i dati del giocatore. Diceva «stai per perdere
qualcosa di grave» per un moltiplicatore che scende di uno, e ignorava il linguaggio di
colore della Catena, che e' verde-arancio.

Adesso l'avviso sta dove sta gia' l'informazione: la barra prende un anello del colore
della Catena e il riempimento respira lentamente. Nessun rosso, nessuna riga in piu'.

**Il testo resta per chi non vede lo schermo.** Toglierlo dalla vista e' una scelta
grafica; toglierlo anche dall'annuncio vorrebbe dire che un giocatore cieco perde
l'avviso e basta, perche' una barra che pulsa non la sente nessuno. La frase e' la stessa
di prima, in una regione che i lettori di schermo leggono e gli occhi no: verificata
giocando fino a quello stato, presente con `role="status"` e larga un pixel.

**Il respiro si spegne** per chi ha chiesto meno movimento al sistema, ma lo stato resta
visibile: il riempimento rimane acceso invece di tornare normale.

Misurato prima di intervenire: l'avviso faceva crescere la riga della Catena di 22 pixel
ma **non** rimpiccioliva la plancia, che restava a 384 pixel con e senza. Era un problema
di armonia, non di spazio, e valeva la pena saperlo prima di decidere dove metterlo.

## [1.9.2] — 11 settembre 2026

### Corretto

**La frase di incitamento copriva i punti.**
Le due cose arrivavano insieme: la frase al centro della plancia, i punti in volo dalla
casella appena giocata. Quando quella casella era al centro, il riquadro della frase si
metteva davanti al numero. Visto su una schermata dello store: «+198» che si leggeva
«+1 98», con l'etichetta della Tinta tagliata a meta'.

Spostare la frase non risolveva, perche' i punti possono partire da qualunque casella.
Sono stati separati nel TEMPO: la frase entra 480 millisecondi dopo, si sovrappongono per
meno di mezzo secondo mentre il numero sta gia' sbiadendo, e la celebrazione diventa una
sequenza -- prima quanto hai fatto, poi com'e' andata -- invece di due cose che si
contendono lo stesso punto dello schermo.

**La schermata della mappa dei livelli usciva tagliata.**
Il pulsante «Condividi il tuo percorso» finiva sotto l'intestazione. Nel generatore
c'era una riga `window.scrollTo(0, 0)` che era **codice morto**: a scorrere non e' la
finestra ma un contenitore interno, quindi quella riga non ha mai spostato niente.
Sembrava una precauzione presa, e per questo nessuno era andato a guardare il risultato.
Adesso si scorre l'elemento giusto, e un controllo ferma la generazione se un comando
resta sotto la testata.

### Aggiunto

**`npm run video`: il montaggio per la scheda dello store.**
Un minuto, sei parti in un ordine deciso: la home, la mappa dei cento livelli, l'apertura
di un livello con l'obiettivo detto prima di giocare, il livello giocato, la vittoria, e
la partita libera. Il gioco gira per davvero e i pezzi vengono TRASCINATI, non toccati:
la prima stesura usava la modalita' a due tocchi e a video il pezzo spariva dal vassoio
per ricomparire sulla griglia, che sembrava un gioco che scatta. Non era il gioco, era il
modo di filmarlo.

Limiti dichiarati: nessun audio (lo strumento registra solo l'immagine, e il sonoro
legato alla Catena si perde), e chi gioca e' un algoritmo che non esita e non sbaglia
mai.

**I testi della scheda dello Store, riscritti e tradotti.**
`android/SCHEDA-PLAY-STORE.md` era fermo a prima delle bombe, della Tinta, dell'anteprima
della terna, dell'archivio delle sfide, delle statistiche e della condivisione:
raccontava un gioco piu' piccolo di quello che si scarica. I cento livelli sono stati
portati in apertura, e c'e' ora anche la versione inglese, visto che il gioco e' gia'
tradotto dentro.

## [1.9.1] — 11 settembre 2026

### Corretto

**L'icona sul telefono arrivava con gli angoli rasati.**
Segnalato da chi ce l'ha installata, con una schermata della home: «icona tagliata». Il
marchio di PLINTO e' quadrato e occupava quasi tutta la tela, quindi la maschera del
launcher gli mangiava gli angoli. Con una maschera a cerchio, che diversi produttori
usano, i quattro blocchi venivano proprio massacrati.

**La causa e' una misura guardata al posto di un'altra.** Un'icona adattiva Android ha
una tela di 108dp; il sistema ne mostra al massimo 72 centrali, ma la porzione garantita
visibile QUALUNQUE forma scelga il produttore e' un **cerchio** di 66dp su 108. Il
margine era stato scelto sul quadrato visibile invece che sul cerchio garantito, e su un
marchio quadrato la differenza fra le due misure e' esattamente cio' che si perde agli
angoli. Misurato: il marchio arrivava a 187 pixel dal centro su una tela da 432, dove la
zona sicura ne ammette 132. Sporgeva di 55.

Il margine passa da 0,18 a 0,28 per lato: il raggio scende a 129 pixel, dentro i 132. Con
quattro margini provati e guardati sotto le maschere vere (cerchio e squircle), 0,25 era
ancora fuori di 14 pixel. Stessa correzione sull'icona «maskable» del sito, dove la
specifica web ammette un cerchio dell'80% del lato e il marchio ne usava il 91%.

**Il commento nel generatore dichiarava proprio la proprieta' che non valeva.** C'era
scritto che il marchio stava «dentro il cerchio sicuro di Android»: non era una svista di
scrittura, era una misura mai presa. Adesso `npm run icone` misura il raggio sul PNG vero
e si ferma se e' fuori, e un test rilegge quelle misure a ogni rilascio, perche' il gate
non rigenera le icone. Verificato che il controllo fallisca davvero rimettendo i vecchi
margini: si ferma, dicendo di quanti pixel si sporge e dove correggere.

### Corretto anche

**La corsia veloce del gate poteva non vedere un file nuovo.**
L'elenco dei file che decidono come si gioca veniva chiesto a `git ls-files`, che elenca
solo cio' che e' gia' versionato: un file scritto ma non ancora aggiunto era invisibile
all'impronta. E' successo davvero, con `src/core/incitamenti.js`, rimasto fuori dal
registro di un giro completo andato a buon fine.

Quella volta e' finita nel verso innocuo: al giro dopo il file risultava comparso dal
nulla e la corsia veloce e' stata negata, rigiocando i cento livelli. Ma il verso
pericoloso e' l'altro: un file che decide come si gioca e che resta non versionato non
viene visto CAMBIARE, e la corsia veloce salterebbe i cento livelli su codice modificato.
Adesso l'elenco chiede anche i file non versionati, rispettando il `.gitignore`.
Verificato che la differenza esista davvero: con un file finto in `src/core/`, il vecchio
metodo non lo vedeva e quello corretto si'.

### Nota per chi pubblica

La correzione arriva subito a chi usa il sito o l'ha installato dal browser. **L'icona di
chi l'ha presa dal Play Store sta dentro l'app bundle**, quindi cambia solo ricompilando
e ricaricando l'AAB. Il `versionCode` e' gia' pronto a 10307.

## [1.9.0] — 11 settembre 2026

### Aggiunto

**Il gioco dice qualcosa quando fai una bella mossa.**
Fino a ieri PLINTO giudicava ogni mossa e non te lo diceva quasi mai: sopra i punti
compariva una parola sola, in maiuscoletto, e quella parola non passava nemmeno dalla
traduzione — chi gioca in inglese leggeva «ottima», «eccellente». Adesso al centro della
plancia compare una frase, per un secondo e un quarto, e poi svanisce.

**Centosei frasi per lingua, duecentododici in tutto**, distribuite secondo quanto
spesso ogni tipo di mossa capita davvero: trenta per la piu' comune, ventisei per la
seconda, e poche per quelle che in una partita si vedono meno di due volte. La misura del
testo cresce con la rarita' della mossa: la frase piu' comune e' piccola e stretta,
quella piu' rara riempie il tabellone.

**Ma il numero da solo non toglie la ripetizione, e il modo di pescarle conta di piu'.**
In una partita da 240 mosse la frase piu' comune esce 39 volte: sorteggiando ogni volta
fra trenta, il doppione arriva in media dopo sette messaggi e spesso a due di distanza.
Le frasi stanno quindi in un sacchetto e si estraggono SENZA rimetterle dentro: escono
tutte prima che una qualsiasi torni, e la cucitura fra un giro e il successivo e'
sorvegliata perche' l'ultima frase di un giro non sia la prima del giro dopo.

Misurato su una partita simulata di 263 mosse, a parita' di mosse giocate:

| | frasi dette | diverse fra loro | distanza minima fra due ripetizioni |
|---|---|---|---|
| prima (30 frasi, sorteggio) | 95 | 21 | 2 messaggi |
| adesso (212 frasi, sacchetto) | 95 | 76 | 15 messaggi |

Il caso usato per pescare NON e' quello del gioco: `rngState` genera la sequenza dei
pezzi ed e' cio' che rende la sfida del giorno identica per tutti, quindi una frase
decorativa non deve attingerci, altrimenti sposterebbe i pezzi di chi gioca.

Il velo scuro dietro il testo ce l'hanno tutti e quattro i livelli, e non e' una scelta
di gusto. La prima stesura lo toglieva al livello piu' frequente, per farlo pesare meno
sulla griglia; fotografato sopra dei blocchi accesi, non si leggeva. I contrasti misurati
spiegano perche': sopra le sei famiglie cromatiche il testo attenuato sta fra 1,09 e 1,64
e persino il testo pieno arriva al massimo a 3,63, tutti sotto il 4,5 richiesto e quasi
tutti sotto il 3. Nessun colore di testo e' leggibile sopra i blocchi. Sul velo si sale a
7,44 nel tema scuro e 7,12 in quello chiaro. Togliere il velo non alleggeriva il
messaggio, lo cancellava proprio quando capitava sulla parte piena della griglia.

**Tre momenti che prima erano muti adesso parlano.**
La griglia ripulita del tutto (capita una volta ogni 5.017 mosse), la Catena che arriva
in cima, e il recupero: la griglia era quasi chiusa e una mossa l'ha fatta respirare.
Quest'ultimo e' l'unico messaggio che parla piu' a chi fatica che a chi gioca bene, ed e'
voluto: misurato sul simulatore esce una volta ogni 186 mosse per un giocatore capace e
una ogni 49 per chi sta perdendo.

La stessa frase entra anche nell'annuncio per i lettori di schermo. Una funzione che
incoraggia solo chi guarda lo schermo e' una funzione che decide chi merita di essere
incoraggiato.

### Cambiato

**La scala dei giudizi era rotta, non solo severa.**
La formula era `gruppi + catena/3 + esplose/8` con la soglia della «perfetta» a 6. Ma la
Catena si ferma a 9, quindi il suo contributo massimo e' 3, e quattro gruppi in una mossa
capitano una volta su diecimila: il calore massimo raggiungibile in partita era 5. La
«perfetta» non era rara, era **irraggiungibile per costruzione**. Misurata sul
simulatore: 1 volta in 47.263 mosse, e quella volta e' un caso limite.

La scala nuova viene da 75.623 mosse simulate su tre profili di abilita' e da 35.035
combinazioni di pesi e soglie provate. Ma la ricerca a sole percentuali produceva formule
sbagliate nel merito: un intreccio di due gruppi finiva in «buona» mentre una singola
eliminazione con Catena alta diventava «ottima». E' al contrario — l'intreccio capita
nell'1,45% delle mosse ed e' abilita', la Catena si accumula anche da sola. La ricerca e'
stata rifatta imponendo prima il merito, e il risultato ha una proprieta' che vale piu'
della statistica: **la «perfetta» non si ottiene senza un intreccio**, per quanto lunga
sia la Catena e per quante bombe esplodano. Adesso esce una volta ogni 300 mosse circa.

**Il traguardo di Catena si dice una volta per partita, non a ogni risalita.**
La Catena tocca il tetto, cala di un livello alla prima mossa a vuoto e risale subito
dopo. Festeggiare ogni rientro voleva dire, misurato, festeggiare una volta ogni 21
mosse: il traguardo piu' alto del gioco ridotto a sottofondo.

**Il pulsante «Rimetti a posto il pezzo» non sembra piu' un segnaposto.**
Era un contorno sottile senza riempimento. L'intenzione era giusta — e' una correzione,
non un'azione da invitare a fare — ma a schermo sembrava un elemento non finito. Adesso
ha il riempimento delle superfici rialzate, lo stesso dei riquadri dei pezzi, e una
freccia che torna indietro. Nessun colore d'accento: quello lo trasformerebbe in un
invito.

**L'istruzione «trascina un pezzo sulla griglia» sparisce dopo tre mosse.**
Serve finche' non si e' trascinato il primo pezzo. Dopo era peggio che inutile: il
pulsante «rimetti a posto» e' disponibile sul 63% delle mosse, quindi quella riga passava
la partita a rimbalzare fra il pulsante e l'istruzione, una mossa si' e una no. Uno
sfarfallio in mezzo allo schermo per dire una cosa gia' saputa.

### Verifiche

Il gate di rilascio passa da diciannove controlli a venti: `npm run incitamenti` apre il
browser, gioca finche' non capita una eliminazione e verifica che la frase compaia dentro
la plancia, che abbia il velo dietro, che non intercetti il tocco delle caselle, che non
faccia cambiare misura al tabellone e che non si sovrapponga al pulsante. Lo scenario
gioca anche una mossa che di proposito non chiude niente, perche' altrimenti il pulsante
«rimetti a posto» non comparirebbe mai e quella meta' del controllo passerebbe senza aver
provato nulla. E' la stessa famiglia di difetto della
1.8.0 — qualcosa di decorativo davanti a qualcosa che si tocca — e quella volta se ne
accorse un giocatore, non un controllo.

## [1.8.2] — 11 settembre 2026

### Cambiato

**La plancia torna grande, e lo spazio lo pagano i blocchi che ne avevano di avanzo.**
La 1.8.1 aveva rimpicciolito il tabellone da 380 a 310 pixel per farlo stare dentro il
suo riquadro: corretto, ma il prezzo lo aveva pagato tutto la cosa piu' importante dello
schermo. Segnalato da chi ci gioca: «la griglia la riporterei alla grandezza di prima e
ridimensionerei il resto».

Misurata l'altezza blocco per blocco su un telefono da 756px utili, la risposta era
evidente: **i riquadri dei pezzi in mano erano alti 129 pixel per disegnarci dentro un
pezzo da 60**. Quaranta pixel di vuoto per riquadro, e li pagava la plancia. Portati a
91, con il bersaglio da toccare che resta il riquadro intero — cioe' due volte i 44px
raccomandati, non meno.

Il resto viene dai margini: lo spazio fra la barra della Catena, il tabellone e la riga
del suggerimento, e i bordi attorno ai pezzi e alla striscia della prossima terna. Nessun
testo e' stato rimpicciolito, e le celle della prossima terna restano a 11px: erano state
portate a quella misura dopo che un giocatore aveva detto «non vedo l'anteprima», e
tornare indietro sarebbe stato disfare una correzione per farne un'altra.

Risultato su quel telefono: plancia da 310 a **374**, praticamente la misura di prima —
ma stavolta dentro il suo riquadro invece che sopra il pulsante.

## [1.8.1] — 11 settembre 2026

### Corretto

**La plancia copriva il pulsante «Rimetti a posto il pezzo».** Segnalato appena
pubblicata la 1.8.0, con una schermata in cui del pulsante si vedeva solo una fetta sotto
il bordo del tabellone. Difetto mio, e grave: la funzione appena aggiunta era inutilizzabile
su mezzo parco telefoni.

**La causa e' una direzione sbagliata, non una misura sbagliata.** La plancia era scritta
come `width: 100%` piu' `aspect-ratio: 1`: l'altezza era una conseguenza della larghezza,
e in quel verso un `max-height` non la fa rimpicciolire. Il risultato e' che la plancia
sforava il proprio riquadro senza che il blocco che la contiene risultasse sbordare —
misurato sul formato che l'ha trovato: riquadro 312px, plancia 380px, 68 di troppo che
finivano sopra il pulsante.

Adesso si parte dall'altezza: quella e' definita, la larghezza la segue, e `max-width` la
riporta indietro sui riquadri stretti. I due vecchi tetti restano dentro il `min` perche'
servivano a non far diventare enorme la plancia sugli schermi alti, e quel compito ce
l'hanno ancora.

**Conseguenza da dire, non da nascondere: la plancia e' piu' piccola.** Su un telefono
comune passa da 380 a 310 pixel. Non e' una perdita, e' la misura vera: 380 era la misura
che non ci stava, ed era anche la causa della segnalazione precedente — la scritta che
finiva addosso ai pezzi. Lo stesso difetto, visto due volte da due parti diverse.

### Cambiato

**Lo scenario di impaginazione provava lo stato sbagliato, in due modi.**

Provava il livello **appena aperto**, cioe' l'unico istante in cui il pulsante non c'e'
ancora: guardava proprio il fotogramma in cui il difetto non esiste. Adesso fa una mossa
prima di misurare, e verifica anche che il pulsante ci sia — altrimenti lo scenario non
prova quello che dice di provare.

E provava le altezze **nominali** dei telefoni. Su uno schermo vero la barra di stato e
quella di navigazione si prendono un centinaio di pixel, e il gioco ne riceve molti meno:
412x915 passava, 412x805 no. Adesso ogni formato viene provato due volte, con e senza le
barre. Provare la misura della scatola invece di quella dello schermo vuol dire non
provare niente.

Verificato che serva: con il foglio di stile della 1.8.0 il controllo nuovo fallisce su
**otto** formati, con quello corretto passa su tutti e dodici.

## [1.8.0] — 10 settembre 2026

### Aggiunto

**«Rimetti a posto il pezzo».** Non e' un annulla, e' una correzione del dito: hai
lasciato il pezzo una casella piu' in la' di dove volevi, e prima di fare altro lo
riprendi in mano. La partita torna esattamente com'era.

Nasce da chi ci gioca davvero: «sto giocando in equilibrio instabile con un solo dito,
mi e' capitato due o tre volte in una partita». Punire quello non aggiunge profondita',
aggiunge rumore.

**Due condizioni, e ognuna chiude una porta precisa.** La mossa non deve aver eliminato
niente: se non hai chiuso nessun gruppo, tornare indietro non ti fa sapere niente che non
sapessi gia', perche' dove finiva il pezzo lo vedevi durante il trascinamento e la terna
successiva e' mostrata in anteprima. Se invece hai chiuso qualcosa, le conseguenze non
sono piu' prevedibili — una bomba dentro il gruppo ne porta via altre otto e puo'
innescarne altre — e poter provare e disfare vorrebbe dire esplorarle prima di decidere.
E la mossa non deve aver chiuso la partita: altrimenti si annulla, si prova altrove, si
annulla ancora, e il «hai perso» diventa un oracolo per trovare la casella in cui si
sopravvive.

Con queste due, annullare non da' **nessun** vantaggio. Per questo non si guadagna, non
si conta e non ha un limite: e' il tasto che cancella l'ultima lettera.

**Il ripristino e' esatto**, e lo e' perche' il motore e' una funzione pura: lo stato di
prima non era stato toccato, e dentro ci sono anche la posizione del generatore casuale e
la terna in anteprima. La sfida del giorno resta identica per tutti; i punti della posa e
il contatore delle mosse tornano indietro con il resto, quindi un livello «superato in 18
mosse» continua a voler dire diciotto mosse.

**La memoria e' lunga una mossa sola, di proposito.** Una pila sarebbe un'altra cosa: la
possibilita' di riavvolgere la partita, che e' esattamente quello che questo non vuole
essere.

Il pulsante vive nella riga sotto la griglia, che ora riserva sempre l'altezza di un
bersaglio da 44px anche quando mostra solo del testo: se crescesse all'apparire del
pulsante, la plancia si restringerebbe di colpo a meta' partita, e un tabellone che cambia
misura sotto il dito sarebbe peggio del difetto da curare. Ed e' spento — nessun
riempimento, nessun colore acceso — perche' e' una correzione, non un'azione da invitare
a fare.

`npm run annulla` e' il diciannovesimo controllo del gate. La regola sta nei test unitari,
dove costa millisecondi; il browser prova l'altra meta', cioe' che il collegamento fra
regola e schermo funzioni: che il pulsante compaia quando deve, che ripristini blocchi,
mano e punteggio, e che poi sparisca.

### Corretto

**Il tavolo da gioco sbordava sui pezzi in mano.** Nei livelli la scritta «Trascina un
pezzo sulla griglia» finiva addosso ai pezzi. Segnalato da chi giocava, e riprodotto
misurando: su 360×640 il blocco del tavolo era alto 416px in uno spazio di 355, sbordava
di 61 pixel e — essendo centrato — ne colava meta' sopra e meta' sotto.

La causa era che la plancia si limitava con `min(96vw, 58vh)`, cioe' con una frazione
dello schermo, che pero' non sa che cos'altro c'e' sopra: nei livelli ci sono in piu' la
fascia dell'obiettivo e l'avviso della Catena. In partita libera quei due elementi non
esistono e il difetto non si vedeva — ed e' il motivo per cui e' vissuto indisturbato:
chi prova il gioco apre la partita libera, e la schermata che si rompe e' l'altra.

Adesso l'involucro della plancia e' l'elemento che cede quando lo spazio manca, la plancia
lo segue e resta quadrata perche' `aspect-ratio` trasferisce alla larghezza la riduzione
in altezza. Il tetto in `vh` resta come limite massimo dove serviva.

`npm run impaginazione` ha una seconda parte che misura questo su sei formati di telefono.
Verificato che serva: con il foglio di stile vecchio fallisce su due formati (61 e 67
pixel di sbordo, 30 di sovrapposizione), con quello nuovo passa.

## [1.7.4] — 10 settembre 2026

### Cambiato

**L'indirizzo per le segnalazioni non e' piu' personale.** Era quello con nome e cognome
dell'autore, e nel gioco era l'unico posto in cui comparivano in chiaro davanti a chi
gioca — piu' esposto del nome del pacchetto dentro un URL, che non legge nessuno. Adesso
e' lo stesso indirizzo che il profilo sviluppatore mostra gia' sul Play Store, quindi i
due coincidono e non c'e' un secondo dato in giro.

### Aggiunto

**«Come si gioca» dice anche com'e' fatto il gioco.** La pagina spiegava benissimo come
si muovono i pezzi, l'Intreccio, la Catena, la Tinta e le bombe, e non diceva da nessuna
parte che il gioco sono cento livelli, ne' che esistono la partita libera e la sfida del
giorno. Era l'unica informazione che viveva soltanto nell'ultimo passo della guida
iniziale: chi tocca «non mostrarmela piu'» al primo avvio non la leggeva mai piu'.

Sta **in cima**, subito dopo il saluto e prima delle regole. Chi ne ha piu' bisogno e'
proprio il giocatore che ha saltato la guida e non sa che il percorso esista, e in fondo
alla pagina, sotto le bombe, non ci arriverebbe mai. Prima che cos'e' il gioco, poi come
si gioca.

**E la guida NON si puo' riaprire da qui**, che era la prima idea ed era peggiore. Le due
schermate pescano dalle stesse chiavi, quindi un pulsante «rivedi la guida» avrebbe
aggiunto una seconda strada — a passi, con meno contenuto — verso quello che questa
pagina dice gia' meglio. Il wizard serve ad accogliere chi arriva; chi gioca da un mese
non ha bisogno di essere accolto, ha bisogno di controllare una regola. Quello che
mancava non era la strada, era il contenuto, e adesso c'e'.

### Corretto

**Il controllo sull'installazione poteva morire senza dire perche'.** `server.listen()`
senza un gestore di `error` fa uscire il processo con un `throw` di Node: niente porta,
niente motivo. E' successo durante un giro completo — i controlli erano tutti passati e
l'esito diceva che il gioco e' installabile, ma il comando e' uscito diverso da zero e la
pubblicazione si e' fermata. Il gate ha fatto la cosa giusta: un esito buono con un
codice di uscita cattivo e' un fallimento, non una sfumatura.

La causa era transitoria: nel gate girano di fila parecchi script che aprono un server, e
ogni tanto la porta e' ancora occupata da quello prima. Adesso aspetta qualche secondo che
si liberi, e se davvero non si libera scrive quale porta e come vedere chi la tiene.

**La corsia veloce sbagliava domanda.** Confrontava con cio' che e' PUBBLICATO, quindi
dopo un giro completo andato bene bastava correggere una riga in uno script di prova per
dover rigiocare cento livelli gia' verificati su quel medesimo codice: la stessa ora
buttata che la corsia doveva evitare.

Adesso la domanda e' «il codice che decide come si gioca e' ancora quello su cui i cento
livelli sono passati?», e la risposta sono le impronte dei file, una per file. Un giro
completo verde le registra; la corsia si apre solo se sono tutte identiche, e quando
rifiuta elenca quali sono cambiate. Su una macchina dove nessun giro completo e' mai
passato, rifiuta.

## [1.7.3] — 10 settembre 2026

### Corretto

**«Info» restava appoggiato a sinistra.** Il menu della home ha cinque voci su due
colonne, e la quinta occupava la colonna di sinistra da sola: si legge come un errore di
impaginazione, non come una scelta. Adesso una voce spaiata prende tutta la riga e si
centra.

La regola e' `:last-child:nth-child(odd)` e non il solo `:last-child`, cosi' vale anche il
giorno in cui le voci diventano sei senza che nessuno debba ricordarsene: con un numero
pari l'ultima ha la sua vicina e non va toccata.

**E sopra i 460px il difetto c'era lo stesso, dove lo spazio non mancava affatto.** La
regola per gli schermi larghi metteva `repeat(4, auto)`, scritto quando le voci erano
quattro, ed era rimasta indietro: la quinta finiva da sola su una seconda riga. Adesso e'
`auto-fit`, che conta le voci da solo. Il commento sopra la regola diceva ancora
«quattro voci»: e' il tipo di numero scritto a parole che smette di essere vero senza
fare rumore.

### Verifica

Il foglio di stile e' nell'elenco dei file che chiudono la corsia veloce, quindi questa
versione ha rifatto il giro completo: 18 controlli su 18. E' il comportamento voluto —
una regola di impaginazione globale puo' spostare la plancia sotto il dito, e nella 1.7.1
due caratteri di icona in piu' lo avevano gia' fatto.

## [1.7.2] — 10 settembre 2026

### Cambiato

**La barra dell'avanzamento nelle schede condivise e' fatta di quadrati.** Provata su un
telefono vero, la versione con i blocchi pieni si leggeva come una lastra bianca con una
lineetta accanto: forte, e per giunta somigliante alla riga della Catena, che usa proprio
quei caratteri per dire un'altra cosa. Due significati con gli stessi simboli e' il modo
piu' rapido di rendere illeggibili tutti e due. I quadrati si contano a colpo d'occhio e
somigliano alle caselle del gioco.

**Cambiare quei due caratteri ne rompeva un terzo, in silenzio.** Le righe disegnate
della scheda vengono nascoste a chi ascolta, perche' ripetono in simboli quello che le
righe sopra dicono a parole; l'elenco dei caratteri che le riconosce viveva dentro il
componente, e senza i quadrati la barra sarebbe uscita dall'elenco. La riga avrebbe
continuato a comparire uguale, e l'unico ad accorgersene sarebbe stato qualcuno che il
gioco lo ascolta invece di guardarlo. Ora l'elenco sta accanto ai caratteri che disegna,
si chiama `RIGA_DISEGNATA` ed e' provato.

**`npm run verifica --veloce`: una scorciatoia che non si fida di chi la usa.** Il
controllo dei cento livelli e' 56 minuti sui 63 del gate. Per un'icona o due caratteri e'
sproporzionato, e chi rilascia tre volte in un pomeriggio finisce per saltarlo del tutto
— che e' precisamente il modo in cui questo comando e' nato.

Adesso la scorciatoia c'e', ma **decide il diff e non chi lancia il comando**: salta i
cento livelli solo se nessun file cambiato rispetto a cio' che e' pubblicato tocca come
si gioca. Se anche uno solo lo tocca, rifiuta ed elenca i colpevoli; se git non risponde,
rifiuta. L'elenco comprende il foglio di stile, perche' quel controllo prova che i livelli
si vincano toccando pezzi e caselle nell'app vera, e nella 1.7.1 due caratteri di icona in
piu' avevano fatto tornare lo scorrimento della home.

Il riassunto scrive «SALTATO» accanto al controllo non eseguito e avverte che al suo posto
ne e' girato uno piu' debole: un riepilogo che confonde «passato» con «non eseguito» e'
peggio di nessun riepilogo.

Misurato su questa stessa versione: **447 secondi invece di 3776**.

## [1.7.1] — 10 settembre 2026

### Aggiunto

**Due iconcine nel pie' di pagina della home**: una tazza di caffe' accanto a «Sostieni il
progetto», una lampadina che spunta da una busta accanto a «Idee e segnalazioni».

Disegnate a mano in SVG dentro il codice, come il marchio, Plinto e la bomba: nessuna
libreria di icone, nessun file, nessuna licenza da tracciare e nessuna richiesta di rete.
E' anche quello che permette all'informativa di dire che il gioco non contatta nessuno.

**Sono a tratto e non piene**, perche' a dodici pixel una forma piena diventa una
macchia: il tratto tiene aperti i buchi — il manico della tazza, il lembo della busta —
e sono i buchi a far riconoscere l'oggetto. Prendono il colore dal testo accanto con
`currentColor`, cosi' si schiariscono insieme a lui e non c'e' un secondo posto dove
ricordarsi di cambiare il grigio.

**Per le segnalazioni una figura sola, non due.** Due icone separate a quella misura si
leggono come un unico scarabocchio in cui non si riconosce nessuna delle due; una
lampadina che esce da una busta dice la stessa cosa — un'idea che ti arriva per posta — e
si legge alla prima occhiata.

Due cose sono state corrette guardando il disegno ingrandito, non i test. La prima
lampadina era un arco con una riga sotto e si leggeva come un palloncino con lo spago:
mancava lo zoccolo, che e' la parte che dice «si avvita». E le icone erano a 14px: a
quella misura la riga andava a capo su uno schermo da 360 e la home ricominciava a
scorrere, cioe' il difetto che la 1.3.3 aveva appena tolto. `npm run impaginazione` lo ha
ripreso al primo tentativo.

### Corretto

**Le schermate per lo store potevano dichiarare una versione sbagliata.** E' successo:
un server di sviluppo rimasto acceso da prima di un cambio di versione ha prodotto
immagini che dicevano `v1.6.0` mentre il gioco era alla 1.7.0. Il numero viene iniettato
quando il server PARTE e non a ogni richiesta, quindi le modifiche al codice si vedevano
e quella no — il tipo di sbaglio che passa inosservato proprio perche' tutto il resto e'
aggiornato.

Non e' un dettaglio: quelle immagini finiscono sulla scheda del Play Store, e una
schermata che dichiara una versione che non esiste piu' e' l'unica bugia che il negozio
racconterebbe al posto tuo. Adesso `npm run schermate` confronta la versione mostrata con
quella di `package.json` e si ferma, spiegando che quasi sempre basta fermare il server e
rilanciare. Ha bloccato la generazione al primo tentativo utile.

## [1.7.0] — 10 settembre 2026

Il gioco non ha pubblicita' e non ha un budget: se qualcuno lo scopre, e' perche' qualcun
altro gliel'ha mandato. Questa versione lavora su quel passaggio, che finora era rotto in
due punti diversi senza che si vedesse.

### Aggiunto

**Il collegamento del gioco adesso ha un'anteprima.** In `index.html` non c'era nessun
tag Open Graph: chi incollava il link in WhatsApp, in una storia o su Facebook mandava un
indirizzo nudo. Adesso esce un riquadro con l'immagine del tabellone, il nome e una frase
che dice che cos'e'. E' la differenza fra «l'ho mandato» e «l'hanno aperto», e costa una
decina di righe.

L'immagine e' la stessa 1024×500 della scheda del Play Store: la copia in `public/` la fa
`npm run immagine-store`, non una mano. Due copie della stessa immagine tenute allineate
da chi se ne ricorda restano allineate finche' qualcuno se ne ricorda.

Gli indirizzi in quei tag sono **assoluti**, unica eccezione in una pagina che usa
percorsi relativi ovunque perche' il gioco gira anche da una sottocartella. Il motivo e'
che a leggerli non e' il browser del giocatore ma un server dall'altra parte del mondo,
che non ha nessuna pagina da cui contare i `../`.

`tests/anteprima-collegamento.test.js` sorveglia tutto questo, ed e' un controllo che
serve piu' di quanto sembri: quel riquadro e' l'unica cosa del progetto che non si vede
mai usando il gioco. Si puo' romperla rinominando un'immagine, e chi se ne accorge e' una
persona a cui e' arrivato un indirizzo spoglio invece di un gioco, che non lo dira' mai a
nessuno.

### Cambiato

**Le schede da condividere portano al Play Store, non piu' al sito.** Chi riceve un
risultato e ha voglia di provare deve poter INSTALLARE il gioco, non aprirlo una volta nel
browser e dimenticarselo.

**La sfida del giorno e' l'eccezione, e non e' una dimenticanza.** Il suo collegamento
porta scritto il giorno (`#/sfida/2026-09-12`) e serve a far giocare a chi lo riceve la
stessa identica partita: un indirizzo del Play Store non puo' portare quel dato, e
sostituirlo li' non avrebbe migliorato la condivisione, avrebbe cancellato la funzione.

La regola sta in una funzione pura, `collegamentoScheda`, e non dentro il componente.
Sbagliarla non si vedrebbe: la scheda comparirebbe lo stesso, il testo sarebbe giusto, e
l'unico ad accorgersene sarebbe chi riceve il messaggio e non riesce a giocare. Una prova
verifica proprio che il ramo della sfida non venga inghiottito dall'altro.

**Attenzione alla data di questa decisione.** Finche' l'app e' in test chiuso la scheda
del Play Store NON e' pubblica: chi non e' fra i tester iscritti apre il collegamento e
non trova niente. `PLAY_URL` in `config/progetto.js` e' una costante sola, e svuotarla fa
tornare tutto a condividere il sito.

**L'informativa dichiara tre eccezioni invece di due**, e dice una cosa che vale la pena
scrivere: nel collegamento non c'e' nessun codice di invito e nessun parametro di
provenienza. E' lo stesso identico indirizzo per tutti, il che significa anche che non e'
possibile sapere quante persone hanno installato il gioco grazie a te. E' una rinuncia
consapevole: l'alternativa sarebbe tracciare chi gioca.

**Il controllo sulla privacy ha fatto il suo lavoro.** Aggiungendo `play.google.com` alla
configurazione, `tests/privacy.test.js` ha fatto fallire la suite: quel test pretende che
ogni dominio esterno sia dichiarato e confinato nel file di configurazione. Adesso i
domini ammessi sono elencati uno per uno con accanto il motivo, invece di un'unica
eccezione scritta a mano.

## [1.6.0] — 10 settembre 2026

Due riscontri dai tester, e il primo e' il piu' grave che sia arrivato finora.

### Corretto

**Al primo avvio la home non la vedeva nessuno.** Dei tester hanno detto di non essersi
accorti che esistesse una modalita' a livelli, e di aver creduto che PLINTO fosse solo la
partita senza fine. Il percorso a cento livelli e' il gioco; la partita libera e'
l'alternativa.

La causa non era la dimensione dei pulsanti della home, che dal 6 settembre ha il livello
nel pulsante piu' grande. Era una riga sola: dalla presentazione iniziale si usciva
**dentro la partita libera**, quindi la home al primo avvio non si vedeva affatto. La
prima partita di chiunque era la modalita' secondaria, e li' ognuno si faceva l'idea di
che gioco fosse.

Adesso "Inizia" porta alla **home**.

La prima correzione scritta era diversa — far partire il livello 1 — e sarebbe stata
sbagliata: cura il sintomo e crea quello speculare, perche' chi comincia dentro un
livello non vede la partita libera, ne' la sfida del giorno, ne' l'archivio. Il difetto
non era in quale modalita' si finiva. Era che la home veniva saltata **nel momento in cui
il giocatore si sta facendo un'idea di che cosa sia questo gioco**, e saltarla verso una
destinazione diversa resta saltarla. La home e' l'unica schermata che ne mostra la forma
intera, costa un tocco, e quel tocco lo sceglie chi gioca.

Vale la pena scrivere anche il resto: la spiegazione dei livelli era stata scritta,
disegnata e provata, ed era giusta. Il difetto era che non ci arrivava nessuno. Una
funzionalita' che l'utente non incontra non e' fatta a meta': per lui non esiste.

### Aggiunto

**Una guida al primo avvio, in sei passi, che si puo' saltare in due modi diversi.**
Prima era una schermata sola, e il commento nel codice diceva perche': «un corso
introduttivo su un gioco che si capisce guardandolo sarebbe una tassa d'ingresso
inutile». Il ragionamento non era sbagliato, era incompleto, e i primi giocatori veri lo
hanno mostrato in due modi: uno, hanno creduto che PLINTO fosse solo la partita senza
fine e non si sono accorti che esistessero cento livelli; due, hanno dato per scontato
che il colore contasse qualcosa, cioe' hanno immaginato una regola che non c'era. Un
gioco che si capisce guardandolo viene capito, si', ma non e' detto che venga capito
**giusto**.

I sei passi, in quest'ordine: le regole · la Catena · l'Intreccio · la Tinta · la bomba ·
il percorso a cento livelli. Il percorso sta per ultimo di proposito: e' l'informazione
che ai primi tester e' mancata, ed e' anche l'ultima cosa letta prima di giocare.

**Non e' una tassa, e la differenza sta nei due pulsanti in fondo.** «Salta per ora»
porta subito alla home e la guida torna al prossimo avvio, perche' aver fretta oggi non
vuol dire non volerla mai; «non mostrarmela piu'» la chiude per sempre. Sono due
intenzioni diverse e meritano due pulsanti diversi: un solo «Salta» costringerebbe a
scegliere fra rileggerla per sempre e rinunciarci per sempre. Arrivare in fondo vale come
il secondo. E «Come si gioca» resta nel menu della home, perche' una porta che si chiude
alle spalle non e' una scelta.

**I testi non sono scritti due volte.** I sei passi pescano dalle stesse chiavi di «Come
si gioca» e dalle stesse costanti di `rules.js` da cui il gioco calcola davvero i punti.
Una guida che spiega regole diverse da quelle applicate e' peggio di nessuna guida, e
l'unico modo per impedirlo e' non averne due copie. Per la stessa ragione le etichette
«Intreccio», «Catena» e «Tinta» sono uscite dal corpo del testo e vivono in una chiave
sola: erano scritte due volte, e sarebbero diventate due parole diverse per la stessa
cosa.

`npm run guida` e' un controllo nuovo dentro `npm run verifica`, che passa da diciassette
a diciotto. Verifica i sei passi uno per uno, il ritorno indietro, e soprattutto che i due
modi di saltarla si comportino **davvero** in modo diverso: fanno la stessa cosa adesso e
cose opposte domani, e un errore che li rendesse identici non si vedrebbe provando il
gioco per cinque minuti. Questa schermata la vede ogni giocatore nuovo una volta sola: chi
ci trova un difetto e' nuovo, non sa che sia un difetto, e non torna indietro a
raccontarlo.

**Si puo' raccontare anche il percorso.** La scheda condivisibile esisteva solo per la
partita libera e per la sfida, cioe' per le due modalita' secondarie: il core del gioco
era l'unica cosa muta. Adesso ci sono due schede nuove.

**A fine livello**, dopo una vittoria: quale livello, che cosa chiedeva, in quante mosse,
e a che punto sei del percorso. Racconta le MOSSE e non i punti, perche' nel percorso due
giocatori che superano il quadro 47 hanno fatto la stessa cosa e li distingue solo in
quante mosse ci sono riusciti — la scheda della partita libera, che racconta i punti,
qui direbbe la cosa sbagliata.

Sta in fondo all'area che scorre e solo dopo una vittoria. In fondo perche' fra un
livello e il successivo non deve esserci un ostacolo: il pulsante grande resta "Livello
successivo". Solo dopo una vittoria perche' offrire di condividere una sconfitta, nel
momento in cui qualcuno ha appena perso, e' il modo piu' rapido di sembrare sordi.

**Dalla mappa**, in qualunque momento: quanti livelli su cento, con una barra. Esiste
perche' la condivisione a fine livello si puo' cogliere solo nell'istante in cui quel
livello finisce, e chi vuole raccontare a che punto e' arrivato dovrebbe altrimenti
rigiocarne uno apposta. Compare solo dopo il primo livello superato: "0 livelli su 100"
non e' un vanto.

**Il collegamento porta al gioco, non al livello.** Sarebbe stato naturale far aprire a
chi riceve il livello 47; sarebbe stato anche il modo migliore di rovinargli il gioco,
buttandolo dentro il quarantasettesimo problema senza avergli fatto vedere i primi
quarantasei.

**Le tre condivisioni usano un meccanismo solo.** Condividi, altrimenti copia, altrimenti
mostra il testo a schermo: tre copie della stessa scala di ripieghi vorrebbe dire che
prima o poi due si comportano diversamente, e il primo posto in cui accadrebbe e' il ramo
che quasi nessuno vede — quello di chi non puo' nemmeno copiare.

### Cambiato

**Due prove misuravano "il primo pulsante" e da oggi ne trovano un altro.** Lo scenario
sugli schermi grandi cercava `.pl-intro__azioni .pl-btn` per misurare quanto vuoto ci
fosse fra il contenuto e l'azione principale: con la guida a passi il primo pulsante e'
diventato "Indietro", e la misura raccontava la larghezza di quello. Ora chiede il
pulsante PRINCIPALE, che e' quello che stava cercando fin dall'inizio. Un selettore che
dice "il primo" descrive la schermata di ieri.

**Una prova falliva una volta su otto, e non era colpa del codice.** Lo scenario della
partita contava i blocchi appena la plancia compariva, cioe' un istante prima che i
blocchi ci fossero: quando la macchina era lenta usciva zero, e il messaggio accusava il
salvataggio di aver perso una partita che invece era li'. Ora aspetta i blocchi. Se il
salvataggio si rompesse davvero, l'attesa scadrebbe e il difetto verrebbe fuori lo
stesso: l'attesa non nasconde niente, misura la cosa giusta.

## [1.5.0] — 10 settembre 2026

### Cambiato

**L'Intreccio adesso si chiede più volte, non una volta sola.** Cinque livelli (42, 47,
52, 57, 97) chiedevano «chiudi 2 gruppi in una mossa». Sembrava una richiesta crescente e
non lo era: quell'obiettivo leggeva un **picco**, `bestIntreccio`, che sale a 2 la prima
volta che capita e poi non si muove più. Un picco non ha dosaggio. Il livello 47 si
superava con una mossa in un livello che ne concedeva otto, e il controllo di banalità del
generatore lo segnalava a ogni rigenerazione.

Ora il motore conta anche **quante volte** succede (`stats.intrecci`), e i cinque livelli
chiedono 3 Intrecci (42, 47, 52, 97) o 2 (57), con 24-36 mosse per farli. La richiesta è
la stessa di prima ripetuta: costanza, non un colpo fortunato.

**Prima è stata provata la strada sbagliata, e i numeri l'hanno bocciata.** L'idea di
partenza era alzare l'asticella dello stesso picco: «chiudi **3** gruppi in una mossa».
Più pulita da scrivere, e il generatore l'ha rifiutata due volte. Misurata di forza sui
livelli interessati, il giocatore simulato la superava **2 volte su 40** sul livello 47 e
**1 su 40** sul 52, contro il minimo di 4 riuscite su 12 tentativi che il cancello di
superabilità pretende. Il triplo Intreccio richiede tre gruppi a una casella dalla fine
*nello stesso istante*: non è difficile, è quasi impossibile senza il pezzo giusto al
momento giusto.

La lezione, scritta accanto al codice: un obiettivo elegante da leggere non è un obiettivo
raggiungibile finché qualcuno non lo gioca. Qui è stato dichiarato elegante prima di
misurarlo, e la misura ha detto no.

**Il generatore non segnala più nessuna banalità.** Il blocco `ATTENZIONE — livelli
ancora banali col tetto stretto al minimo` è sparito dall'esecuzione, che ora chiude con
«Nessun livello banale da correggere».

**L'impronta delle regole non cambia.** Nessuna costante di `rules.js` è stata toccata:
i punteggi della 1.4.0 restano confrontabili con questi. Cambia cosa i livelli chiedono,
non quanto valgono le mosse.

### Misurato

Comando: `node tools/quadri.mjs 12` — cento livelli, dodici partite ciascuno, giocati dal
giocatore simulato.

| | valore |
|---|---|
| livelli mai superati | **nessuno** |
| i cinque livelli riscritti (42 / 47 / 52 / 57 / 97) | 67% · 67% · 67% · 33% · 83% |
| correlazione posizione ↔ riuscite (rho di Spearman) | **−0,48** |
| coppie di livelli in cui il più avanti è più facile | **28%** |
| riuscite medie | 64,3% |
| livelli banali segnalati dal generatore | **nessuno** (prima: il 47) |

Il livello 47 passava con una mossa sola; ora si supera 8 volte su 12, cioè è diventato un
livello invece di un formalismo. Il 57 sta a 4 su 12, esattamente sul minimo che il
cancello di superabilità pretende: è il più duro dei cinque e resta dalla parte giusta
della soglia, ma senza margine.

**Attenzione a come si leggono questi due numeri.** Il rho e le coppie invertite della
1.3.0 (−0,48 e 31%) erano misurati su **30** partite per livello, questi su **12**: meno
partite vuol dire percentuali più ballerine, quindi i valori si assomigliano ma non sono
la stessa misura. Quello che si può dire con certezza è che la curva non è peggiorata.

### Aggiunto

**Un piè di pagina nella home: sostegno, idee e segnalazioni, versione.** Tutto su una
riga sola, in piccolo e in fondo. Il sostegno stava solo dentro Info, cioè a due schermate
di distanza da chiunque; ora si vede dalla prima, ma sotto tutto il resto e con la voce
più bassa della pagina. La riga singola non è estetica: su uno schermo da 640px un
collegamento su riga propria faceva riapparire lo scorrimento che la 1.3.3 aveva appena
tolto, e `npm run impaginazione` lo ha misurato.

**«Idee e segnalazioni» apre l'applicazione di posta**, con la versione già scritta
nell'oggetto. È un `mailto:`, non un modulo: un modulo vorrebbe dire un servizio di terze
parti, cioè una richiesta di rete verso un altro dominio, cioè l'unica cosa che
l'informativa promette di non fare. Il gioco non sa nemmeno se il messaggio è stato poi
scritto.

L'informativa privacy adesso dichiara **due** eccezioni invece di una — PayPal e la posta
— e spiega che il numero di versione nell'oggetto è l'unico dato che il gioco aggiunge.

**Il tasto Indietro sa da dove si è arrivati a «Sostieni».** Da Info torna a Info, dalla
home torna alla home. La profondità di quella schermata non è una sua proprietà, è del
percorso fatto per arrivarci, e ora il codice la tratta così.

### Corretto

**Il controllo delle comunicazioni scambiava l'indirizzo di posta per un errore.**
Dentro `qualcuno@gmail.com` c'e' `gmail.com`, e la trappola che cerca le chiavi di
traduzione non risolte (`quadri.spiegazioni.righe`) ci vede esattamente la stessa forma:
due parole minuscole separate da un punto. Il gate ha bloccato la pubblicazione della
1.5.0 per questo, il giorno stesso in cui l'indirizzo e' comparso a schermo.

La correzione toglie gli indirizzi di posta dal testo prima di guardarlo, invece di
aggiungere `gmail.com` all'elenco dei domini ammessi. Quell'elenco descriverebbe
l'indirizzo di oggi: il giorno che cambia, il controllo tornerebbe a fallire senza che
niente sia rotto davvero.

**Il giocatore simulato non sapeva cosa fosse un obiettivo a Intrecci ripetuti** e lo
giocava alla cieca: nessuna preferenza, nessuna mira. Un obiettivo che il simulatore non
capisce viene misurato più difficile di quanto sia, e il generatore ci costruisce sopra
bilanciamenti sbagliati. Ora lo insegue, come già faceva per tutti gli altri tipi.

## [1.4.0] — 9 settembre 2026

### Aggiunto

**La Tinta: un gruppo chiuso vale di più se molte delle sue caselle hanno lo stesso
colore.** Da 5 caselle uguali in su comincia a pagare, e a nove uguali arriva a +20%.

L'ha chiesta una tester, ma il motivo per cui è stata fatta non è la richiesta: è che
**due persone su tre hanno dato per scontato che il colore contasse**, e una lo credeva
«fin dall'inizio». Per tre versioni il colore è stato dichiarato «puramente estetico», e
la riga che lo diceva stava in `rules.js`, dove nessun giocatore la legge. Sei colori
accesi su una plancia che si riempie *sembrano* una regola: un gioco che mostra qualcosa
di apparentemente significativo senza che lo sia spreca l'attenzione di chi guarda.

Tre decisioni, tutte scritte accanto alla regola:

**Paga la maggioranza, non il monocromatico.** Il colore dei pezzi lo estrae il
generatore, il giocatore non lo sceglie: premiare solo il gruppo interamente di un colore
premierebbe la fortuna. La maggioranza invece si costruisce decidendo *dove* posare, che
è l'unica leva che il giocatore ha davvero ed è già l'asse su cui si gioca tutto il resto.

**La soglia è 5 e non è arbitraria.** Con sei colori, nove caselle riempite a caso danno
una maggioranza attorno a 3. Far partire il bonus da 5 significa che non scatta mai per
caso: se scatta, è perché qualcuno ci ha pensato.

**Entra nel valore del gruppo, non dopo.** Passa sotto Intreccio e Catena come tutto il
resto. Un bonus che scavalcasse la Catena sarebbe punteggio scollegato dal ritmo della
partita. Una prova verifica proprio questo: che il rapporto fra una mossa con Catena e la
stessa senza resti esattamente il moltiplicatore.

**Si vede.** Sotto i punti che salgono compare `TINTA 7`. Sarebbe stato assurdo correggere
una regola invisibile aggiungendone un'altra invisibile.

**È scritta.** «Come si gioca» ora si chiama «Intreccio, Catena e Tinta».

**Le bombe contano per il loro colore.** Sulla plancia una bomba è un blocco colorato come
gli altri: se non contasse, una riga che *sembra* tutta arancione non pagherebbe, senza
che niente spieghi perché.

### Cambiato

**Ricalibrati i bersagli a punti.** Il generatore ha rimisurato tutti e cento i livelli
giocandoli: **sono cambiati 11 livelli su 100, tutti e soli quelli con obiettivo a punti**
(50, 59, 64, 69, 74, 77, 82, 87, 92, 93, 98). Gli altri 89 sono identici byte per byte —
la prova migliore che la Tinta tocca il punteggio e nient'altro.

I bersagli salgono del 4-5%: è quanto la Tinta regala a chi *non* la cerca, perché il
giocatore artificiale non la insegue e la incassa per caso. Chi mette i colori vicini di
proposito troverà quei livelli un po' più facili di prima, che è il senso di aggiungere
una meccanica.

**L'impronta delle regole è cambiata** (`f4dae600` → `dee85df4`). È il meccanismo che
segnala quando un risultato passato è stato ottenuto con regole diverse, e ha funzionato
da solo: una prova ha fermato la pubblicazione finché il riferimento dello stratega non è
stato rimisurato.

**Le traduzioni sostituiscono i segnaposto.** `t('chiave', { valore })` riempie `{valore}`;
un segnaposto senza valore resta scritto com'è, a vista, perché una frase che mostra
`{quante}` si nota subito mentre una che ha perso un numero in silenzio sembra corretta.

## [1.3.4] — 9 settembre 2026

### Corretto

**Il secondo Indietro chiudeva ancora l'app**, nonostante la 1.3.3. Dal livello si
tornava alla mappa, dalla mappa si usciva. La 1.3.3 rimetteva la voce di cronologia
*durante* il ritorno indietro invece che dopo il ridisegno: sul browser da scrivania
funzionava — e la prova automatica passava — ma sul telefono no, e non è stato possibile
riprodurlo fuori da un dispositivo.

La correzione non è un tempismo migliore: è l'eliminazione del tempismo. Ora il gioco
tiene in cronologia **una voce per ogni livello di profondità**, messa nel momento in cui
si entra. Quando arriva un Indietro, la voce che serve al prossimo c'è già da prima, e
nessun istante conta più.

Regola generale, pagata due volte in un pomeriggio: quando un difetto non si riproduce
sull'ambiente in cui si lavora, la correzione giusta raramente è aggiustare il momento in
cui una cosa succede. È togliere la dipendenza da quel momento.

## [1.3.3] — 9 settembre 2026

Due difetti visti solo sul telefono, subito dopo che la 1.3.2 ne aveva risolto un altro.

### Corretto

**Il secondo Indietro chiudeva ancora l'app.** Dal livello si tornava alla mappa, ma
dalla mappa si usciva invece di arrivare alla home. Sul browser da scrivania la stessa
sequenza funzionava, e la prova automatica passava: la differenza è che in una finestra
di fiducia non c'è nessuna pagina sotto il gioco, e Chrome decide se chiudere
l'applicazione in base a quante voci di cronologia restano — subito, non dopo il
ridisegno. La voce veniva rimessa da un effetto di React, che arriva dopo. Ora si rimette
dentro il gestore dell'evento, prima che finisca.

`npm run indietro` ha una verifica in più che misura proprio questo: quante voci ci sono
nell'istante successivo al passo indietro, non alla fine del ridisegno.

**La home scorreva.** Sette voci più il marchio, e un respiro fra i gruppi proporzionale
all'altezza dello schermo con un tetto troppo alto: su uno schermo da 640px sforava di
una cinquantina di pixel. Si nota di più ora che l'app non ha la barra dell'indirizzo,
perché uno scorrimento di pochi pixel sulla prima schermata sembra un errore.

`npm run impaginazione` misura l'altezza della home su sei formati di telefono, nello
stato più pieno che il gioco possa produrre: partita libera in corso, sfida in corso,
livelli superati, record.

## [1.3.2] — 9 settembre 2026

La prima volta che PLINTO è finito su un telefono vero, in mano a due persone. Tutti e
tre i difetti trovati in quel quarto d'ora erano invisibili alle 382 prove automatiche,
perché riguardano cose che un browser da scrivania non ha: un tasto di sistema, una
maschera per le icone, un orientamento.

### Corretto

**Il tasto Indietro chiudeva il gioco.** Da dentro un livello, dalla mappa dei livelli,
da una partita: premere Indietro non tornava indietro, usciva. PLINTO cambia schermata
con lo stato di React, quindi la cronologia del browser resta ferma su una voce sola e
il tasto trova subito il fondo. Sul sito è un dettaglio; nell'app installata è il gesto
principale per uscire da una schermata.

Ora il gioco tiene una voce fittizia nella cronologia finché c'è qualcosa da cui tornare,
e risale una schermata alla volta seguendo le stesse strade dei pulsanti disegnati sullo
schermo: prima chiude il menu se è aperto, poi torna al livello precedente, poi alla home.
Dalla home il tasto torna a fare il suo mestiere e chiude l'app.

Due cose sono andate storte scrivendolo, ed entrambe le ha trovate `npm run indietro`,
non una persona:

- l'effetto che rimetteva la voce dipendeva solo da «sono dentro o no». Passando da un
  livello alla mappa si resta dentro in entrambi i casi, l'effetto non ripartiva, e il
  secondo Indietro usciva dall'app.
- l'ancora `#/sfida/AAAA-MM-GG` viene scritta sulla voce di cronologia corrente. La voce
  fittizia ne aggiungeva un'altra sopra, e tornando indietro si atterrava su quella
  vecchia, con l'ancora ancora dentro: invece della home si riapriva la sfida.

**L'icona era tagliata sulla schermata home.** Il primo piano dell'icona adattiva
riusava il file «maskable» del web: la specifica web garantisce visibile l'80% della
tela, Android ne mostra 72 su 108, cioè il 66%. Ora `npm run icone` genera un file
dedicato, con il marchio al 64% e senza la piastrella di fondo, che nell'icona adattiva
è compito del livello sotto.

Non è bastato: su MIUI restava tagliata, perché il launcher usa l'icona **classica** e ci
applica una propria maschera. Anche quella ora ha lo stesso margine. Si vedeva mettendo
a confronto due schermate dello stesso telefono: in «Informazioni app» l'icona era
intera, sulla home no.

**L'app si chiudeva all'avvio.** `androidbrowserhelper` attiva all'apertura alcuni
componenti che si aspetta di trovare dichiarati, senza verificare che esistano. Ne
mancava uno, giudicato superfluo. Non è un errore di compilazione né di caricamento
sullo store: è un'app che muore, e l'unico modo di accorgersene era installarla.
`tests/android.test.js` ora controlla il manifest, 19 verifiche.

### Cambiato

**Il gioco è bloccato in verticale.** La plancia è quadrata e i tre pezzi stanno sotto:
in orizzontale non c'è niente al posto giusto. Dichiarato in due file che non si leggono
fra loro — il manifest Android per l'app dello store, quello web per chi installa dal
browser — con un test che verifica che dicano la stessa cosa.

## [1.3.1] — 8 settembre 2026

Preparativi per il Play Store. Nessuna modifica al gioco.

### Aggiunto

**Una pagina pubblica per l'informativa privacy**, a
`https://antoniovairo-rgb.github.io/Plinto/privacy.html`. La Play Console richiede un
indirizzo pubblico che apra l'informativa, e il progetto ne aveva una sola in Markdown dentro
`docs/`.

**È generata, non riscritta** (`npm run privacy`). Copiarla a mano vorrebbe dire avere due
informative: quella vera e quella che legge la gente. Prima o poi ne cambia una sola, e il
documento che il giocatore legge dice una cosa che il codice non fa più — con l'aggravante
che un'informativa privacy inesatta non è un difetto estetico. Un test confronta la pagina
con il Markdown e fallisce se divergono.

**`android/twa-manifest.json` e `android/COME-PUBBLICARE.md`**: la configurazione della TWA e
la sequenza esatta per pubblicare, con le tre trappole silenziose documentate — l'impronta di
firma sbagliata che Bubblewrap propone di default, il `.nojekyll` senza cui GitHub Pages non
serve `.well-known`, e l'identificativo del pacchetto che non si può più cambiare.

**`android/SCHEDA-PLAY-STORE.md`**: i testi della scheda, pronti da incollare.

### Corretto

**Il test dell'informativa non poteva fallire.** Importava lo strumento per confrontare la
pagina con il Markdown, ma importarlo lo eseguiva: rigenerava il file un istante prima di
guardarlo, quindi passava sempre per costruzione. Ora la scrittura avviene solo quando lo
script viene lanciato davvero.

## [1.3.0] — 8 settembre 2026

Domanda di chi gioca: «sei sicuro che la difficoltà sia bilanciata e crescente?». Misurata, la
risposta era **no**, e non di poco: la correlazione fra il numero del livello e quanto è
difficile valeva **−0,05**, cioè nessuna. Il percorso era appena meglio di un ordine casuale.

### Misurato

| | prima | ora |
|---|---|---|
| correlazione posizione ↔ difficoltà (rho di Spearman) | −0,05 | **−0,48** |
| coppie di livelli in cui il più avanti è più facile | 36% | 31% |
| livelli banali (vinti quasi sempre con >45% di mosse avanzate) | 17 | **1** |
| riuscite medie del metro | 86,8% | 64,1% |
| livelli mai superati | nessuno | **nessuno** |
| livelli vinti giocandoli nell'app | 100/100 | **100/100** |

Comando: `npm run quadri 30` e `npm run livelli`.

### Le quattro cause, tutte diverse

**1. La difficoltà la decideva il TIPO di obiettivo, non la posizione.** Misurato su 30
tentativi per livello: intreccio 98%, colonne 94%, righe 93%, gruppi 92%, quadranti 91%,
catena 88%, punteggio 69%, celle 68%. Trenta punti fra il tipo più facile e il più difficile,
ovunque si trovino nel percorso — e i tipi ruotavano con un ciclo fisso dentro ogni atto,
quindi la difficoltà oscillava con il ciclo mentre la curva dei percentili saliva piano. Il
caso peggiore: `celle`, il tipo più duro, stava ai livelli 11-24. Ora i due tipi duri entrano
dal quarto atto in poi.

**2. Il tetto di mosse era una costante dell'atto, uguale per ogni obiettivo.** «Chiudi 1
colonna» e «fai 500 punti» non chiedono lo stesso tempo. Ora si **misura** quante mosse
servono davvero e il tetto è quel numero (70° percentile, non la mediana: dove la varianza è
enorme la mediana dà un tetto da partita fortunata) moltiplicato per il margine dell'atto —
1,30 all'inizio, 1,05 alla fine. È questa la leva che fa salire la difficoltà, e l'unica che
funzioni sugli obiettivi di picco come `intreccio`, dove il bersaglio non ha spazio per
crescere.

**3. Il percorso si RIPETEVA.** È la causa della segnalazione più concreta arrivata da chi
gioca — «il livello 6 è molto banale». Chiedeva «chiudi 1 colonna»: identico ai livelli 2 e
10. E il livello 5 chiedeva «1 riga» dopo che il livello 1 ne aveva chieste 2 — il bersaglio
**scendeva**. In tutto il percorso «intreccio 2» compariva otto volte, «gruppi 5» sei,
«quadranti 8» cinque. Ora, dentro uno stesso tipo, il bersaglio non scende mai e non si
ripete due volte di fila — ma solo fin dove la misura dice che si può arrivare: meglio una
ripetizione onesta di un bersaglio inventato. Il primo atto adesso è una progressione:
righe 2→2→3, colonne 1→2→3, quadranti 3→4.

**Nessuno dei controlli esistenti poteva vedere questo difetto**, perché tutti guardano un
livello alla volta. Che il percorso, letto in fila, si ripeta e a volte torni indietro esiste
solo nella *sequenza*.

**4. C'era il pavimento e non il tetto.** Il generatore si rifiutava di produrre un livello
troppo difficile e non aveva niente da dire su uno banale: la regola era «divertente, non una
tortura» e valeva da un lato solo. Ora un livello vinto oltre l'85% delle volte **e** con più
del 45% di mosse avanzate viene stretto; se il tetto è già al minimo, si alza il bersaglio.

### Corretto

**Il pavimento del tetto di mosse era 4, e produceva monetine invece di livelli.** «325 punti
in 4 mosse» si vinceva sempre alla prima mossa, e chiedendone 350 non ci si arrivava quasi
mai: fra i due valori non c'è una salita, c'è un gradino — in quattro mosse o capita la
catena giusta o non capita. Il pavimento è ora **8 mosse**.

**Il controllo di banalità e quello di superabilità giocavano partite diverse.** Il quadro 55
risultava vinto 12 volte su 12 al primo e meno di 4 su 12 al secondo, sullo **stesso**
bersaglio: non era rumore, erano semi diversi. È la terza volta che questo progetto inciampa
nella stessa lezione — chi decide e chi verifica devono usare lo stesso metro — e stavolta
nel codice scritto poche ore prima, per lo scrupolo di «non riusare lo stesso campione». Due
controlli che devono accordarsi sullo stesso livello non sono due esperimenti indipendenti:
sono due letture della stessa cosa.

### Ancora aperto

**Il livello 47 resta banale per il metro**: chiede «intreccio 2» e il giocatore artificiale
ci arriva sempre entro 8 mosse. Non è stato tolto, ed è una scelta: chiudere due gruppi in
una mossa è la meccanica firma del gioco, e il metro non sa distinguere «banale» da «richiede
di vedere l'unica mossa giusta» — sono la stessa cosa per un risolutore e due cose opposte per
una persona.

**Il percorso è diventato molto più duro** (riuscite medie da 86,8% a 64,1%), ed è l'effetto
inevitabile di aver tolto il tempo in eccesso ovunque. Nessun livello è imbattibile, ma se sia
*giusto* così lo dice solo giocarci.

**L'ultima decina risale** (40% → 61%): è l'atto «La vetta», che ha meno livelli e tipi
diversi. È il punto più debole della curva.

**Le coppie invertite scendono poco** (36% → 31%). La curva sale in generale ma resta
frastagliata da vicino, perché i bersagli restano vincolati a quello che la misura dice
raggiungibile su ciascuna griglia, e griglie diverse hanno tetti diversi.

## [1.2.0] — 8 settembre 2026

Regola nuova, data da chi gioca: **nessun livello dev'essere imbattibile — dev'essere un
gioco divertente, non una tortura.** Non è rimasta un auspicio: è diventata un controllo che
il generatore impone, e tre difetti che nessuno vedeva sono venuti fuori applicandola.

### Aggiunto

**`npm run livelli`: tutti e cento i livelli vinti giocandoli nell'app.** `npm run quadri`
chiama il motore e non tocca l'interfaccia; fra i due ci sono la mano da toccare, la casella
da centrare, il conteggio delle mosse e la schermata di fine. Questa prova calcola con il
motore una sequenza vincente per ogni livello e poi la **rigioca nel browser**, toccando il
pezzo e poi la casella. Misura: **100 livelli su 100, 1620 mosse**, media 16 a livello.
Entra nel cancello di rilascio, che passa da 14 a 15 controlli.

**Il generatore garantisce che ogni livello sia superabile.** Dopo la taratura gioca ogni
livello puntando al suo bersaglio; se non lo supera abbastanza spesso, il bersaglio scende di
un gradino alla volta. Se nemmeno al minimo ci arriva, **la generazione fallisce** nominando
il livello: a quel punto il problema è il progetto — griglia, mosse, tipo di obiettivo — e
nasconderlo con un numero più basso sarebbe la cosa sbagliata.

**Il generatore prova a giocare ogni griglia di ostacoli** prima di usarla, e si rifiuta di
produrre i livelli se su una non si chiude nemmeno un gruppo in trenta mosse.

**Il generatore dichiara i bersagli che non ha misurato**, quelli imposti dal pavimento
dell'arrotondamento anziché da una misura.

**`src/sim/giocatore-quadri.mjs`**: il giocatore che mira all'obiettivo, in un posto solo.

### Corretto

**La Sfida del Giorno non diceva quale sfida fosse.** La striscia sopra la plancia mostrava il
nome della modalità — «Sfida del giorno» — e nient'altro: dentro la partita, la sfida di oggi e
una qualunque riaperta dall'archivio erano **indistinguibili**, e non c'era scritto da nessuna
parte che cosa la sfida chiedesse (a differenza di un livello, che ha il suo obiettivo in alto).
Segnalato da chi gioca. Ora l'intestazione dice il giorno — «Sfida di oggi, 8 settembre» oppure
«Sfida del 6 settembre» — e sotto, in piccolo, che cosa chiede. `npm run archivio` fallisce se
l'intestazione non nomina il giorno che si sta giocando, o se presenta una sfida passata come
quella di oggi.

La riga di spiegazione è **precisa e non ottimista**, e per scriverla ho dovuto correggere un
errore nella documentazione. `docs/GAMEPLAY_RULES.md` diceva che «griglia iniziale e sequenza
dei pezzi coincidono per chiunque giochi quel giorno»: la prima parte è vera, la seconda no. Il
generatore legge la griglia per decidere che cosa estrarre, quindi due persone che giocano
diversamente ricevono pezzi diversi — misurato su due modi di giocare opposti, le prime **sei
mani** coincidono e poi divergono. A schermo c'è scritto «la partita parte uguale per tutti»,
che è vero; «stessi pezzi per tutti» sarebbe stata la frase comoda ed è falsa.

**Due griglie di ostacoli bloccavano la plancia.** `assedio` lasciava i vuoti come celle
singole isolate — colonne 2, 5 e 8 di una riga altrimenti piena — e chiudere quella riga
chiedeva tre pezzi da una cella; `fitto` spezzava ogni quadrante in due domino separati.
Quattro livelli erano imbattibili per questo. **Non era la densità**: `labirinto` riempie 43
celle su 81, il più pieno di tutti, e ci si chiudono 14 gruppi in trenta mosse; quelle due ne
riempivano 36 e ne chiudevano zero. Ridisegnate, ora giocano come le altre.

**Il livello 97 chiedeva una cosa impossibile.** Svuotare completamente la plancia in 40
mosse: misurato con un giocatore che ottimizza *solo* quello, su trenta partite, svuotata zero
volte con 40 mosse, zero con 80, zero con 160, zero con 320 — il riempimento non scende mai
sotto l'11%. Nella partita libera lo svuotamento capita, ma una volta ogni ~2400 mosse di
gioco esperto: in un livello da 40 mosse è un biglietto della lotteria. `pulizia` non è più un
tipo di livello; resta un obiettivo che il motore sa leggere, e resta il bonus più bello del
gioco quando capita.

**Chi tarava e chi verificava usavano due giocatori diversi.** Il generatore evitava sempre di
spezzare la Catena, `npm run quadri` solo su certi obiettivi: così il generatore poteva
promuovere un livello che il verificatore bocciava, ed è successo col quadro 44 (superato una
volta su dieci). Una garanzia rilasciata e controllata con due metri diversi vale solo contro
sé stessa. Ora è lo stesso modulo, e un test guarda il **codice** per impedire che si separino
di nuovo.

**`npm run quadri` usava un solo generatore casuale condiviso**, che avanzava di livello in
livello: il terzo tentativo del quadro 44 dipendeva da quante mosse avevano richiesto i 43
livelli prima. Cambiare un bersaglio qualunque cambiava i risultati di tutti i livelli
successivi. Ora il seme dipende solo dal livello e dal numero del tentativo, ed è lo stesso
che usa il generatore: **il tentativo i-esimo di un livello è la stessa partita** per chi
rilascia la garanzia e per chi la controlla.

### Modificato

**Bersagli ritarati** con le griglie nuove e con il controllo di superabilità. Quattro
abbassati perché sotto la soglia: 44 (325→300), 84 (625→600), 93 (525→450), 97 (135→129).

**La soglia è quattro riuscite su dodici**, e ci sono voluti tre giri per arrivarci. «Una su
quattro» toglieva i muri ma non le torture: restavano livelli superati una volta su dieci.
«Due su sei» sembrava sistemarlo e non lo faceva — con sei prove non si distingue un livello
al 10% da uno al 40%, ed è così che il 44 era passato. «Tre su dodici» **suona** più severo e
non lo è: lascia passare una macina con la stessa frequenza dell'11%. Le probabilità che un
livello con quella riuscita vera passi il criterio:

| criterio | p=0,10 | p=0,20 | p=0,30 | p=0,40 | p=0,60 |
|---|---|---|---|---|---|
| 1 su 4 | 34,4% | 59,0% | 76,0% | 87,0% | 97,4% |
| 2 su 6 | 11,4% | 34,5% | 58,0% | 76,7% | 95,9% |
| 3 su 12 | 11,1% | 44,2% | 74,7% | 91,7% | 99,7% |
| **4 su 12** | **2,6%** | 20,5% | 50,7% | 77,5% | 98,5% |
| 5 su 12 | 0,4% | 7,3% | 27,6% | 56,2% | 94,3% |

Quattro su dodici lascia passare una macina due volte su cento e conserva tre livelli duri su
quattro. Cinque su dodici ne boccerebbe metà, e i livelli duri sono il senso degli ultimi atti.

### Misurato

Verifica indipendente, 12 tentativi per livello:

| | |
|---|---|
| livelli mai superati | **nessuno** |
| livelli sotto il 25% | **nessuno** |
| i tre più duri | 59, 84 e 90, tutti al 33% |
| media su cento livelli | 87,8% |

**Il prezzo, detto senza abbellirlo: la curva si è appiattita.** Prima scendeva da 100% a 69%
fra il primo e l'ultimo atto, adesso va da 96% a 83%. Imporre un pavimento a ogni livello alza
la parte bassa della distribuzione, e la parte bassa era ciò che dava alla curva la sua
pendenza. Non si possono avere entrambe le cose: o si accettano livelli superati una volta su
dieci, o si accetta una salita più dolce.

E questa curva descrive **il giocatore artificiale**, non una persona. La difficoltà che sente
chi gioca viene dai bersagli e dai tetti di mosse, che continuano a salire lungo tutto il
percorso: 14 mosse e bersagli al 14° percentile nel primo atto, 32 mosse e 56° percentile
nell'ultimo.

### La strada non si chiude mai

**Dopo otto tentativi su uno stesso livello, il successivo si apre lo stesso.** Un percorso a
catena ha un difetto che non si vede finché non capita: un solo livello che non riesce non
rende difficile *quel* livello, chiude tutti quelli dopo. Il generatore garantisce che nessun
livello sia imbattibile per il giocatore artificiale — ma quello non è una persona, e la
garanzia copre il progetto dei livelli, non l'incontro fra un livello e chi lo gioca.

Otto: abbastanza da voler dire «ci ho provato davvero» e non «mi è andata male una volta»,
pochi abbastanza da non trasformare la via d'uscita in una seconda tortura. Un livello dura in
media sedici mosse, quindi otto tentativi sono una decina di minuti sullo stesso problema.

**E non racconta bugie mentre apre la porta.** Il livello resta non superato: niente spunta,
fuori dal conteggio, e resta lì da riprendere quando si vuole. Sulla schermata di sconfitta
compare l'avviso e un pulsante secondario per andare avanti — il pulsante grande resta
«Riprova», perché è un permesso, non un invito ad andarsene. Se lo contasse come vinto sarebbe
un premio di consolazione travestito, ed è peggio di un percorso che si blocca.

**E il pulsante «continua» della home riparte da dopo l'ultimo livello superato**, non dal
primo non superato. Sembravano la stessa cosa e lo erano finché un livello si apriva solo
superando il precedente: con la via d'uscita, la vecchia regola avrebbe riportato sul livello
5, a ogni avvio e per sempre, chi il 5 lo ha lasciato e ha poi superato il 6, il 7 e l'8.
Nemmeno «il livello aperto più avanti» andava bene: spingerebbe oltre già all'ottava sconfitta,
mentre chi ha appena perso probabilmente vuole riprovare.

**Un difetto trovato scrivendo il test, non a occhio.** I tentativi ora si contano anche sui
livelli mai superati — prima si tenevano solo per quelli già vinti, cioè proprio quelli che
questa via d'uscita non serve ad aprire. La voce che ne nasce non ha il campo `mosse`, ed è così
che si distingue «ci ha provato N volte» da «superato». Ma il confronto «meno mosse della volta
scorsa» veniva fatto contro una volta scorsa che non esisteva: dava falso, e **vincere dopo aver
perso otto volte non registrava la vittoria**.

## [1.1.0] — 7 settembre 2026

Il fulcro del gioco è la sfida a livelli. Questa versione porta lì l'anteprima della terna
successiva, e per farlo ha dovuto prima rimettere in sesto gli strumenti che la misurano.

### Aggiunto

**L'anteprima della terna successiva è parte dei Quadri.** Un livello è un problema con una
soluzione: obiettivo dichiarato, tetto di mosse, griglia fissa. Su un pezzo che non sai se
arriverà non si può ragionare, e un livello che chiede di ragionare mentre nasconde metà del
problema chiede due cose diverse insieme. La partita libera resta senza: lì non c'è niente da
risolvere, e non sapere cosa arriva è parte di cosa la rende libera.

Non è un'opzione. La decisione sta in un posto solo, `MODALITA_QUADRI` in `src/core/quadro.js`,
e `src/config/quadri.js` dichiara con `MODALITA_TARATURA` la modalità in cui i bersagli sono
stati misurati: un test controlla che le due coincidano. Due modalità avrebbero voluto dire due
tarature dei cento bersagli, e nessuna delle due sarebbe stata quella vera per chi giocava
nell'altra.

**`src/sim/accoglienza.mjs`**: i giocatori artificiali adesso *usano* l'anteprima invece di
subirla. Fra le sequenze quasi equivalenti scelgono quella che lascia la griglia più pronta a
ricevere la terna che vedono arrivare.

**`npm run confronto`**: mette a confronto gli stessi cento livelli con e senza anteprima.

### Modificato

**I cento bersagli sono stati ritarati**, giocando i livelli nella modalità in cui si giocano
davvero (`node tools/genera-quadri.mjs`). Cambiano **56 bersagli su 100** — 26 in su e 30 in
giù — mentre griglie e tetti di mosse restano identici. La taratura è deterministica: due
esecuzioni indipendenti hanno prodotto i cento numeri uguali.

Perché era obbligatorio: vedere avanti cambia l'ordine in cui il generatore legge la griglia,
quindi **lo stesso seme produce un'altra partita**. Con i bersagli vecchi, otto livelli su cento
cambiano completamente esito fra le due modalità (33, 61, 74, 76, 78, 89, 93 da 100% a 0%; il 69
da 0% a 100%). Non erano diventati difficili: erano **altri livelli** con lo stesso numero.

Effetto sulla curva di difficoltà, misurato con `npm run quadri 10` — prima era una riga piatta
al 100% con qualche buco a zero, adesso scende:

| livelli | prima | ora |
|---|---|---|
| 1–10 | 100% | 100% |
| 11–20 | 100% | 90% |
| 21–30 | 100% | 88% |
| 31–40 | 100% | 91% |
| 41–50 | 100% | 83% |
| 51–60 | 100% | 96% |
| 61–70 | 70% | 60% |
| 71–80 | 100% | 73% |
| 81–90 | 90% | 66% |
| 91–100 | 90% | 67% |

**I livelli già superati restano superati.** L'avanzamento non viene toccato.

### Rimosso

**«Partita con anteprima» non è più una modalità della partita libera.** Sparisce dalla home
con le sue stringhe e i suoi record separati. Chi l'aveva giocata si ritroverebbe due voci in
memoria che nessuno legge più — una partita a metà non riprendibile e un record non più
battibile: all'avvio vengono cancellate, invece di restare lì a far dubitare fra un anno se
servano.

### Corretto

**`npm run quadri` non stava misurando niente.** Il pianificatore era completamente
deterministico: dieci tentativi dello stesso livello erano dieci volte la stessa partita, e la
colonna «riuscite» poteva valere solo 0% o 100%. La stessa lezione era già scritta in
`tools/taratura.mjs`, che apposta rompe i pareggi con un pizzico di casualità; a `quadri.mjs`
non era mai stata applicata.

**Lo stesso strumento simulava le posate ignorando le bombe**: pianificava su una griglia
diversa da quella che poi otteneva. Non toccava il gioco — la mossa la applicava il motore vero
— ma falsava i numeri con cui si tarano i bersagli. Le percentuali pubblicate prima della 1.1.0
non sono confrontabili con queste.

**`npm run quadri` e `npm run taratura` di default misuravano la modalità sbagliata.** Adesso
usano quella in cui i Quadri si giocano davvero; `base` resta esplicito, per il confronto.

### Verificato

`npm run prova-desktop` apre ora anche il **livello 1** su quattro telefoni (393×873, 360×800,
360×740, 320×700): un Quadro ha due righe che la partita libera non ha — la barra dell'obiettivo
sopra la plancia e la striscia della terna sotto i pezzi — e il modo più facile di rompere quella
schermata è aggiungere qualcosa in fondo. Su tutti e quattro la plancia resta fra 300 e 373 px e
l'anteprima sta dentro lo schermo.

`npm run anteprima` non prova più una modalità che non esiste: apre un livello, e confronta ciò
che sta sullo schermo con ciò che il **motore** ha estratto, non con se stesso.

### Ancora aperto

**Sei livelli restano imbattibili al giocatore artificiale**: 61, 62, 66, 83, 84, 97. Cinque
usano due griglie di ostacoli a scacchi (`##.##.##.` e `##..##..#`) su cui in 25–30 mosse il
metro non chiude **nemmeno un gruppo**: minimo, mediana e massimo sono zero. Non è un bersaglio
troppo alto — il bersaglio minimo possibile è 1, e neanche quello è raggiungibile. È la griglia,
ed è un problema che esisteva già prima dell'anteprima.

## [1.0.2] — 7 settembre 2026

### Modificato

**L'anteprima della terna è passata sotto i pezzi in mano.** Stava sopra il tabellone, ed
era il posto sbagliato: la terna successiva viene **dopo** quella che hai in mano, e si
legge nell'ordine in cui arriva. Sopra la plancia era lontana dai pezzi di cui parla, e
costringeva a saltare avanti e indietro con lo sguardo per confrontarle.

Suggerito da chi gioca. Verificato che ci stia: su 393×873, 360×800 e 360×740 la striscia
resta dentro lo schermo e la plancia non si accorcia — aggiungere qualcosa in fondo è
anche il modo più facile di spingere fuori schermo ciò che c'era già.

`npm run anteprima` ora controlla anche **dove** sta: sopra il tray, o fuori dallo
schermo, è un errore.

## [1.0.1] — 7 settembre 2026

Due segnalazioni di chi gioca, e in tutti e due i casi il controllo automatico **passava**.

### Corretto

**La home tagliava il logo e la versione.** Su un telefono da 360×800 in giù, con una
partita libera **e** una sfida entrambe in corso, il contenuto superava l'altezza dello
schermo: `justify-content: center` senza scorrimento fa sporgere il contenuto da tutte e
due le parti, e la parte fuori non era solo invisibile — era **irraggiungibile**. Il logo
finiva sotto la barra di stato, la versione sotto il bordo inferiore.

Non è comparso dal nulla: la home è cresciuta di **tre voci in tre versioni** — archivio,
profilo, partita con anteprima — e ognuna, da sola, ci stava. Corretto con tre cose che
servono tutte: `safe center` (il centraggio si comporta da allineamento in alto appena il
contenuto non ci sta), `overflow-y: auto` (se avanza, si scorre) e un `gap` che si stringe
sugli schermi bassi invece di restare a `5vh`.

**L'anteprima della terna c'era e non si vedeva.** Striscia alta 23 px, celle da 6:
presente nel DOM, illeggibile su un telefono. Portata a celle da 11 px contro le 18 del
tray — abbastanza da leggere la forma a colpo d'occhio, abbastanza meno da non confondersi
con la mano vera.

### Le due prove che mancavano

Entrambi i difetti erano **davanti agli occhi** e nessun controllo li vedeva, per la stessa
ragione: verificavano che un elemento **esistesse**, non che qualcuno lo **vedesse**.

- `npm run prova-desktop` ora apre la home anche su **quattro formati di telefono**
  (393×873, 360×800, 360×740, 320×700) nello stato **più affollato possibile** — che è
  l'unico in cui il difetto compare — e fallisce se la testata finisce sopra il bordo, se
  la versione sparisce, se del contenuto resta fuori senza poter scorrere, o se il pulsante
  principale scende sotto i 44 px.
- `npm run anteprima` ora misura la striscia: celle sotto i 9 px o striscia sotto i 34 px
  sono un errore, e lo sono anche celle **non più piccole** di quelle del tray.

Collaudate rimettendo i difetti: la prima accusa il taglio su tre formati su quattro
nominandoli, la seconda dice «celle da 6 px, illeggibili su un telefono».

## [1.0.0] — 7 settembre 2026

Fase 6, l'ultima del piano evolutivo: **l'anteprima della prossima terna**. È l'unica che
tocca il motore, ed è per questo che è arrivata per ultima.

### Aggiunto

**Una modalità in cui vedi la terna successiva** prima di finire quella in mano. Dalla
home, «Partita con anteprima».

Nel gioco base la terna successiva **non esiste** finché non serve: viene estratta quando
la mano si è svuotata. Per mostrarla si può fare una cosa sola in modo onesto — estrarla
nell'istante in cui viene consegnata quella corrente, e non toccarla più. L'alternativa
(mostrarne una e rigenerarla all'uso) farebbe vedere una terna diversa da quella che
arriva, ed è la peggiore funzionalità possibile in un gioco che promette di non nascondere
niente.

### Il prezzo, misurato e scritto

Le reti di sicurezza del generatore leggono la griglia **al momento dell'estrazione**, che
adesso arriva fino a tre mosse prima dell'uso, cioè su una griglia più vuota: **la modalità
anteprima è più dura di quella base**, all'opposto dell'intuizione.

Misurato su **due campioni indipendenti** da 3000 partite ciascuno
(`node src/sim/run.mjs 3000 normale 250 <modalità>`): punteggio medio −1,3% e −2,7%, mosse
medie −1,5% e −1,8%, partite ancora vive al tetto 42,2% → 41,4% e 42,6% → 40,7%. La
direzione è la stessa in entrambi i campioni su tutte le righe, quindi l'effetto è
credibile; **la misura è 1–2%, cioè piccola, e non è stato calcolato nessun intervallo di
confidenza**. La coda che conta — i game over con la griglia sotto il 30%, quelli che si
percepiscono come ingiusti — **non è peggiorata**. La tabella completa è in
`docs/GAMEPLAY_RULES.md`.

### Le altre conseguenze, tutte dichiarate

- **Record separati**: vedere avanti è un vantaggio, e mescolare i punteggi dichiarerebbe
  confrontabili due cose che non lo sono.
- **Semi non compatibili**: estrarre prima cambia l'ordine di consumo del generatore, e lo
  stesso seme produce una partita diversa. La mano iniziale coincide, il resto no.
- **Forme sì, colori no**: il colore è estetico e mostrarlo suggerirebbe che conti. **La
  bomba invece si vede**, perché quella cambia cosa conviene fare.
- **Fuori dal ciclo di Tab**, con il tasto **P** dedicato: quel ciclo si percorre a ogni
  mossa, e allungarlo per un'informazione che si consulta ogni tanto renderebbe più lento
  tutto il resto.
- **Il gioco base non è cambiato di una virgola.** Nessuna estrazione spostata: i 100
  livelli tarati e tutte le sfide passate producono le partite di prima. C'è un test.

### Corretto

**L'impronta delle regole cambiava anche per costanti che non toccano la generazione.**
Aggiungendo a `rules.js` l'elenco dei nomi delle modalità, l'impronta è cambiata — e il
gioco avrebbe marcato come «ottenuti con regole diverse» tutti i risultati passati di chi
gioca da settimane, per una modifica che non ha spostato una sola estrazione. Un avviso
sbagliato mostrato a tutti è peggio di nessun avviso, perché insegna a ignorarlo. Ora
l'impronta copre **solo i valori numerici**: soglie, pesi, probabilità e punteggi sono
numeri, e un'etichetta di testo non ha mai cambiato una partita. **L'ha trovato il test che
avevo scritto per un altro motivo** — «il riferimento è stato misurato con le regole di
adesso».

### Verifiche

- **333 test in 21 file** (erano 321 in 20). Il test che conta: la terna mostrata è
  identica a quella consegnata — forma e bombe — su **oltre mille mani**; ed è lo *stesso
  oggetto*, quindi non c'è nemmeno lo spazio per ricalcolarla.
- **`npm run anteprima`** (quattordicesimo controllo di `npm run verifica`) guarda la
  stessa cosa a schermo. Collaudato rigenerando la terna all'uso: i test unitari falliscono
  e lo scenario stampa quale terna è stata mostrata e quale consegnata.
- **Un difetto era nel mio scenario**: il pilota provava a esaurire la mano cliccando le
  celle finché una accettava il pezzo, e con un blocco 3×3 in mano non ci riusciva —
  accusando il gioco di non consegnare la terna. Ora usa tre pezzi da una cella su griglia
  vuota: esaurire la mano è deterministico.
- `npm run verifica`: **14 controlli su 14 in 349 s**, sulla 1.0.0.

### Perché 1.0.0

Le sei fasi del piano evolutivo sono chiuse. Non vuol dire che il gioco sia finito — le tre
voci aperte del gate di rilascio restano aperte, e sono scritte in
`docs/RELEASE_CHECKLIST.md`: la **verifica professionale del marchio**, la **prova su
dispositivi fisici veri** e il **playtest con persone**. Vuol dire che quello che era stato
pianificato è stato fatto, misurato e dichiarato.

## [0.9.0] — 7 settembre 2026

Fase 5 del piano evolutivo: **il suono dice il livello di Catena**.

### Modificato

**Il sonoro smette di decorare e comincia a dire.** Dieci gradi di una **pentatonica
minore di La**, uno per ogni livello di Catena: si capisce a orecchio se la Catena sta
salendo o scendendo senza guardare la barra. Le frequenze sono **calcolate** dal
temperamento equabile (La4 = 440 Hz), non trascritte: una tabella copiata a mano è una
tabella in cui prima o poi c'è un numero sbagliato, e un numero sbagliato qui non rompe
niente — si limita a stonare, che è il difetto che nessuno segnala.

- **Eliminazione** → la nota del livello di Catena **applicato**.
- **Intreccio da N gruppi** → arpeggio ascendente di N note: chiudere riga + colonna +
  quadrante *suona* diverso da chiudere una riga sola.
- **Catena che scende** → un grado sotto, timbro più spento e volume basso. Perdere la
  Catena è una conseguenza del gioco, non un errore da sottolineare.
- **Svuotamento della griglia** → l'arpeggio sale per tutta la scala e **risolve** sulla
  fondamentale due ottave sopra. È l'evento più raro del gioco e merita l'unico suono
  davvero grosso.

**Il gioco aveva due scale.** Una pentatonica di Do maggiore per le celebrazioni e una per
la Catena: due scale nello stesso gioco stonano fra loro — non abbastanza da far dire «è
sbagliato», abbastanza da far suonare tutto un po' storto. Adesso ce n'è una.

### Aggiunto

**L'ultima chiamata.** Quando il respiro finisce e la Catena è ancora accesa — cioè la
prossima mossa senza eliminazioni la fa calare — due note brevi e riconoscibili. È il
suono più utile del gioco, perché è l'unico che dice qualcosa che non si è ancora visto:
fino a ieri quell'informazione stava **solo** nella barra, cioè solo per chi la stava
guardando in quel momento. Suona una volta sola, quando il respiro finisce: un avviso che
si ripete non è un avviso.

**Silenzio quando la scheda non è in primo piano.** Un gioco che continua a suonare da una
scheda che non guardi più è il modo più rapido di farsi silenziare per sempre.

**Tetto di voci e disconnessione dei nodi.** Ventiquattro voci simultanee al massimo, e
ogni oscillatore viene **scollegato** a fine inviluppo: un oscillatore fermo ma ancora
connesso resta agganciato al grafo audio, ed è una perdita di memoria lenta, invisibile in
una partita di prova. `npm run soak` dopo la modifica: 375 mosse, memoria da 11,8 a
12,6 MB, zero fotogrammi sopra i 50 ms su 2475.

### Trovato per strada

**L'arpeggio scendeva invece di salire, e non me ne sarei accorto.** La scala parte dal La3
e arriva al Sol5, cioè copre già due ottave: riavvolgendola di dodici semitoni, il grado
dopo il Sol5 era il La4 — più **basso** di dove eravamo. Succede solo chiudendo quattro
gruppi con la Catena al massimo, cioè in una delle mosse più rare e più belle del gioco.
L'ha trovato un test scritto prima di ascoltare: nessuno l'avrebbe segnalato, perché
stonare non è un difetto che si racconta.

### Verifiche

- **321 test in 20 file** (erano 300 in 19). 21 nuovi sulla scala, tutti **puri**:
  ogni nota confrontata con la tabella dichiarata, la scala che sale sempre, un livello
  fuori scala che produce comunque una nota della scala, l'arpeggio che resta ascendente
  anche oltre l'ultimo grado.
- **Che il suono esca davvero resta una verifica manuale**, ed è scritto in
  `docs/TESTING.md`: non esiste nessun test automatico che lo provi, e fingere il
  contrario sarebbe peggio che non averlo.
- `npm run verifica`: **13 controlli su 13 in 314 s**, sulla 0.9.0.

## [0.8.0] — 7 settembre 2026

Fase 4 del piano evolutivo: **la scheda del risultato da condividere**.

### Aggiunto

**Sei righe da mandare agli amici**, sotto la schermata di fine partita. È il canale di
crescita di un gioco che non fa pubblicità e non ha un budget: se qualcuno lo scopre, è
perché qualcun altro gliel'ha mandato.

```
PLINTO — Sfida del 2026-09-12
14.820 punti · 96 mosse
Catena max 9 · Intreccio max 3
Righe 11 · Colonne 8 · Quadranti 5
Mossa migliore: 414
▁▃▅▇█▇▅▂▄▆█▇▅▃▁▂
https://antoniovairo-rgb.github.io/Plinto/#/sfida/2026-09-12
```

**L'ultima riga di blocchi è la forma della partita**: il livello di Catena campionato a
intervalli regolari, con il **massimo** di ogni fetta e non la media — un picco di Catena
è un momento della partita, e una media lo cancellerebbe proprio mentre si cerca di
raccontarlo. Due partite con lo stesso punteggio hanno righe diverse.

**Due divieti che vengono prima di tutto il resto.** Niente spoiler: mai la sequenza dei
pezzi né la griglia finale, altrimenti il collegamento che mandi è proprio la cosa che
rovina la sfida a chi lo riceve. E nessun parametro di provenienza nell'indirizzo: il link
è quello della sfida e basta, uguale per tutti.

### La parte che si sbaglia sempre

**Il ripiego sugli appunti non è facoltativo.** `navigator.share` non c'è ovunque — su
desktop manca quasi sempre — e un pulsante che in quel caso non fa niente è peggio di un
pulsante che manca, perché chi lo tocca **crede** di aver condiviso. Tre gradini: si
condivide; se non si può, si copia; se non si può nemmeno copiare, il testo resta a
schermo selezionabile a mano. L'ultimo gradino non può fallire perché non chiede niente a
nessuno. E chi annulla la finestra di condivisione non vede nessun messaggio: annullare
non è un errore.

**La scheda è testo, non un'immagine.** Un'immagine peserebbe di più, non sarebbe
leggibile da un lettore di schermo e non si potrebbe incollare in chat come testo. Quello
che si vede a schermo è **esattamente** quello che viene condiviso.

**La riga di blocchi è decorativa**, e marcata come tale: ogni dato che contiene esiste
anche a parole nelle righe sopra. Chi usa un lettore di schermo non perde niente, e chi ha
un font che disallinea i blocchi nemmeno.

### Modificato

**Il motore registra la Catena mossa per mossa**, in ordine. L'istogramma della Fase 1 dice
*quante* mosse a ciascun livello, non *in che ordine*: da lui si può disegnare una forma
plausibile, non quella vera. Con la serie la riga di blocchi è la cronaca della partita
invece di un suo riassunto riordinato. Se la serie manca — un salvataggio di prima — si
ripiega sull'istogramma, che produce una riga ordinata e quindi visibilmente un riassunto.

### Verifiche

- **300 test in 19 file** (erano 282 in 18). 17 nuovi sulla scheda: che stia sempre
  sotto i 280 caratteri **anche con numeri a sette cifre**, che il collegamento sia sempre
  l'ultima riga, che non compaiano identificativi di forme, che non esistano `undefined`,
  `NaN` o `null` in un messaggio che poi qualcuno manda davvero.
- **`npm run condivisione`** (tredicesimo controllo di `npm run verifica`) **toglie
  `navigator.share`** dal browser e verifica che il testo finisca comunque negli appunti,
  identico a quello mostrato, con la conferma a schermo. Collaudato togliendo il ripiego:
  lo scenario accusa sia la conferma mancante sia gli appunti vuoti.

## [0.7.0] — 7 settembre 2026

Fase 3 del piano evolutivo: **il profilo di gioco**.

### Aggiunto

**Una schermata che dice COME giochi, non quanto hai fatto.** I record dicono il
risultato migliore, le statistiche i totali: nessuno dei due dice il modo, ed è l'unica
cosa che un giocatore non può ricavare da solo — per sapere che chiude quasi solo righe
dovrebbe contarsele partita dopo partita. Dal menu della home, «Il tuo profilo di gioco».

- **Come chiudi i gruppi**: righe, colonne, quadranti, con la quota di ciascuno. È il dato
  che racconta davvero lo stile: un quadrante vale 27 punti base, una riga 9.
- **Dove passi le tue mosse**: la distribuzione della Catena **applicata** — quella che
  avevi prima di muovere, non quella che la mossa ti ha lasciato.
- **Dove appoggi i pezzi**: la mappa 9×9 degli ancoraggi. È l'unica immagine davvero
  personale del gioco: due giocatori con lo stesso punteggio hanno mappe diverse.
- Bombe fatte esplodere, celle portate via, griglie svuotate, mossa migliore.

**Il confronto con lo stratega, quando è onesto mostrarlo.** Il riferimento è **generato**
da `npm run catena`, che ora scrive `src/data/riferimento-catena.json` con distribuzione,
profilo, partite, tetto di mosse, data e **impronta delle regole**. Se quell'impronta non
coincide con quella del gioco, il confronto **non si mostra affatto**: un paragone
sbagliato somiglia troppo a uno giusto. E sotto al grafico c'è scritto per esteso che il
riferimento è un **giocatore artificiale, non una media di persone** — è la differenza fra
«gioco peggio di un programma» e «gioco peggio della gente», e la seconda non la sappiamo.

**Ogni grafico ha il suo equivalente in tabella**, e non è una concessione: un grafico a
barre fatto di `<div>` alti in percentuale, per chi ascolta, è silenzio. La mappa di calore
in particolare — come immagine è una macchia, come tabella 9×9 con intestazioni è leggibile
da chiunque. L'intensità del colore non porta mai da sola un'informazione: **accanto c'è
sempre il numero**.

**Esporta e cancella, in evidenza e non in un sottomenu.** Un gioco senza account che
accumula statistiche deve dare la porta d'uscita senza farla cercare. «Cancella» tocca
**solo** il profilo: record, statistiche, livelli e sfide restano dove sono.

### Scelte dichiarate

**Nel profilo entrano partita libera e Sfida del Giorno, non i livelli.** I livelli partono
da griglie costruite a mano: falserebbero la mappa degli appoggi facendola somigliare al
loro disegno invece che al modo di giocare di chi la guarda. È scritto anche nella
schermata, non solo qui.

**L'aggregazione è un aggregato, non un archivio**: contatori e somme, dimensione costante
nel tempo. L'unica eccezione sono le ultime 20 partite, tenute per l'andamento.

### Corretto

**Il test sull'ortografia italiana accusava «cioè» di essere «cio» senza accento.** In
JavaScript `\b` considera «parola» solo le lettere ASCII, quindi il confine cadeva fra la
«o» e la «è». Sostituito con lookaround su `\p{L}`: adesso il confine cade dove cade in
italiano. Collaudato in tutte e due le direzioni — «cioè» passa, un «piu» senza accento
viene ancora accusato.

### Verifiche

- **282 test in 18 file** (erano 264 in 17). 18 nuovi su `aggrega`: profilo vuoto,
  prima partita, **cento partite** con le invarianti della Fase 1 verificate sull'aggregato,
  partita da zero mosse, riepilogo con campi mancanti (nessun `NaN`), profilo di una
  versione vecchia, istogramma della lunghezza sbagliata, storage che lancia.
- Due test **sul riferimento generato**: che abbia la forma giusta e che sia stato misurato
  con le regole di adesso. Il secondo fallisce con scritto cosa fare — `npm run catena` —
  invece di lasciare che il confronto sparisca in silenzio.
- La schermata è attraversata in entrambe le lingue da `npm run comunicazioni`, con un
  profilo popolato: senza, si sarebbe letta solo la riga di cortesia e nessuna tabella.
- `npm run verifica`: **12 controlli su 12 in 311 s**, sulla 0.7.0.

## [0.6.0] — 7 settembre 2026

Fase 2 del piano evolutivo: **l'archivio delle sfide**.

### Aggiunto

**Ogni giorno passato è ancora giocabile.** Il seme della Sfida del Giorno è la data,
quindi le sfide passate non vanno conservate: si **ricalcolano**. Chi installa il gioco
oggi trova mesi di partite pronte invece di una schermata sola, e non perché qualcuno
abbia salvato qualcosa — in `localStorage` finiscono solo i risultati, mai le partite.

**Un calendario che è una `<table>` vera** (`src/ui/schermate/Archivio.jsx`). Un
calendario *è* una tabella: ogni casella appartiene a un giorno della settimana e a una
settimana, e quelle due appartenenze sono l'informazione. Con dei `<div>` un lettore di
schermo annuncia quaranta numeri di fila senza dire che il 12 è un giovedì. Frecce per
muoversi fra i giorni, PagSu/PagGiu fra i mesi, e una sola casella nel ciclo di Tab
invece di quaranta.

**Quattro stati distinti non dal solo colore**: giorno non giocato (il numero), giocato
(numero, punteggio e un **segno geometrico**), oggi (contorno pieno e la parola «oggi»
nell'etichetta), non apribile (casella spenta che dice **perché** — futura, o precedente
alla prima sfida). Una casella disattivata che non spiega niente è l'unico caso in cui un
giocatore pensa che il gioco sia rotto.

**Un collegamento apre direttamente una sfida**: `#/sfida/2026-09-12`. È nell'àncora e non
nel percorso perché GitHub Pages risponde 404 a qualunque percorso che non sia un file, e
il service worker che rende il gioco installabile va in rete per primo sul documento:
l'àncora invece non arriva nemmeno al server. Meno elegante, e l'unica che funziona da una
sottocartella, offline e da un'applicazione installata.

**L'impronta delle regole** (`src/core/impronta.js`). Il generatore è deterministico: se
cambia un peso delle forme o una costante di regolamento, lo stesso seme produce una
partita diversa, e la sfida del 12 marzo rigiocata dopo un aggiornamento non è più quella
che hanno giocato gli altri. È inevitabile, e va **detto**. L'impronta non è un numero da
alzare a mano — che prima o poi qualcuno dimentica, ed è proprio il caso in cui il dato
diventa una bugia — ma un valore calcolato da tutte le costanti e da tutto il catalogo
delle forme: cambiare un peso la cambia da sola.

### Modificato

**Niente più potatura dello storico.** Fino alla 0.5.2 i risultati venivano tagliati ai 60
giorni più recenti. Con l'archivio quella potatura cancellava esattamente i dati che
l'archivio esiste per mostrare. Misurato invece che supposto: **365 giorni occupano circa
22 kB**, quindi non c'era niente da risparmiare.

**Il punteggio finisce nel giorno giocato, non in oggi.** Prima dell'archivio i due
coincidevano sempre, quindi il codice registrava su `giornoDiOggi()` e non poteva
sbagliare. Adesso può: la partita porta con sé la data che le ha fatto da seme.

### Corretto

**Le chiavi di traduzione non si compongono a runtime.** Tre chiavi dell'archivio erano
costruite al volo (`t(condizione ? 'a' : 'b')`), e il test sull'i18n — che cerca le chiavi
nel sorgente — le segnalava come definite e mai usate. Aveva ragione: quel test è l'unica
cosa che impedisce a una traduzione mancante di arrivare a schermo come testo grezzo, e una
chiave costruita al volo gli sfugge. Riscritte per esteso.

### Verifiche

- **264 test in 17 file**, di cui 18 nuovi sulle date: cambio dell'ora legale attraversato
  un giorno alla volta in marzo e in ottobre, 29 febbraio, passaggi di anno, dieci anni di
  calendario senza un mese che perda giorni, e 3.653 date senza due semi uguali.
- **`npm run archivio`**, dodicesimo controllo di `npm run verifica`: apre l'archivio in un
  browser vero, controlla che il calendario sia una tabella con intestazioni di riga e di
  colonna, che i giorni spenti dicano perché, che le frecce muovano il fuoco, apre un
  giorno passato, lo finisce e verifica che il punteggio finisca **in quel giorno**.
- Collaudato rompendo il codice: registrando il punteggio su oggi invece che sul giorno
  giocato, lo scenario fallisce nominando entrambe le date.
- **Il controllo sulle comunicazioni ha trovato una regressione vera**: aggiungendo la
  voce «Archivio» in home, il passaggio che apriva la Sfida del Giorno prendeva
  *l'ultimo* pulsante della schermata — che adesso è l'archivio. Selettore posizionale
  sostituito con uno per nome, e l'archivio è ora attraversato in entrambe le lingue,
  etichette delle caselle comprese: quelle non compaiono a schermo, le legge solo chi
  ascolta, ed è l'unico posto del gioco in cui un testo può restare rotto senza vedersi.
- **Un difetto era nel mio scenario, non nel gioco**: la partita di prova riempiva la
  griglia lasciando otto righe già complete, quindi la mossa finale svuotava il tabellone
  invece di chiudere la partita. Lo scenario accusava il gioco di non registrare il
  punteggio. Ora la griglia ha due celle libere per ogni riga, colonna e quadrante.

## [0.5.2] — 7 settembre 2026

### Rimosso

**La riga che spiegava il nome del conto PayPal.** L'avevo aggiunta nella 0.5.1 sotto il
pulsante di donazione: «La pagina di PayPal mostrerà "elevoraCPM"…». Tolta su richiesta, e
la richiesta ha ragione per due motivi. Il primo: il nome del conto lo si vede sulla pagina di
PayPal come in **qualunque** donazione a chiunque, e giustificarlo dentro il gioco lo fa
sembrare un problema invece di una normalità. Il secondo: alla pubblicazione sugli store
l'identità del progetto sarà comunque un'altra, quindi era una spiegazione con la scadenza
già scritta sopra.

Resta il pulsante e basta. Il vincolo di PayPal — un solo link per conto, non modificabile —
resta scritto in `src/config/progetto.js`, dove serve a chi legge il codice e non a chi gioca.

## [0.5.1] — 7 settembre 2026

### Aggiunto

**La donazione volontaria è attiva.** `PAYPAL_URL` era vuoto per scelta — nessuno può
inventare l'indirizzo di donazione di qualcun altro — e la schermata «Sostieni il progetto»
dichiarava apertamente che la donazione non era ancora attiva. Ora c'è il link reale, deciso
dal proprietario del progetto, ed era l'ultima voce **BLOCCATA** del gate di rilascio che
dipendesse solo da lui.

**Una riga che spiega il nome che comparirà su PayPal.** Il link è `paypal.me/elevoraCPM`:
«elevoraCPM» è l'identificativo del conto, condiviso con l'altro gioco dello stesso autore,
e non il nome di PLINTO. PayPal consente **un solo link PayPal.Me per conto** e non permette
di modificarlo dopo la creazione, quindi un link dedicato richiederebbe un secondo conto —
scelta rimandata a quando avrà senso. Chi sta per pagare legge sotto il pulsante di che conto
si tratta: senza quella riga, un donatore che vede un nome sconosciuto nella pagina di
pagamento chiude nel dubbio di aver sbagliato destinatario.

**Resta una donazione, non un acquisto.** Il gioco non dà niente in cambio: nessun contenuto,
nessun vantaggio, nessuna comparsa nei ringraziamenti. È la condizione con cui il progetto si
dichiara senza acquisti in-app, ed è scritta nel file di configurazione perché chi un domani
volesse «solo aggiungere un ringraziamento» sappia che sta cambiando categoria di prodotto.

### Corretto

**Il test sulla privacy ammetteva `paypal.com`, ma il link vive su `paypal.me`.** Sono domini
diversi, quindi attivare la donazione faceva fallire il controllo «l'unico dominio esterno è
PayPal, e sta solo nel file di configurazione» — che è esattamente ciò che quel test deve
fare se l'indirizzo compare altrove. Ammessi entrambi i domini, e **solo** in
`config/progetto.js`. Verificato mettendo il link in una schermata: il test lo accusa,
nominando il file.

## [0.5.0] — 7 settembre 2026

Fase 1 del piano evolutivo: fondamenta. **Nessun cambiamento visibile giocando** — e' il
prerequisito di quello che viene dopo (archivio delle sfide, profilo di gioco, scheda
condivisibile). Nessuna regola di gioco e' cambiata: `docs/GAMEPLAY_RULES.md` non ha
avuto bisogno di una riga nuova.

### Aggiunto

**Le tre distribuzioni di una partita (`src/core/distribuzioni.js`)**
- I contatori che il gioco teneva sono massimi e somme: dicono il RISULTATO. Queste
  dicono il MODO, e sono la materia prima del profilo di gioco: quante mosse a ciascun
  livello di Catena, quante mosse hanno chiuso 0/1/2/... gruppi, e una mappa 9x9 di dove
  vengono appoggiati i pezzi.
- L'istogramma della Catena e' indicizzato sulla Catena **applicata** (`chainBefore`),
  non su quella che la mossa lascia dietro. E' la stessa regola di trasparenza del
  punteggio: si misura il moltiplicatore che il giocatore vedeva prima di muovere.
  Indicizzare sull'altra racconterebbe una partita giocata meglio di com'e' andata, e
  c'e' un test che rompe se qualcuno lo cambia.
- **La lunghezza dell'istogramma dell'Intreccio non e' scritta a mano**: e' dedotta dal
  catalogo delle forme provando ogni forma in ogni posizione. L'intuizione qui sbaglia —
  sembra che una mossa possa chiudere tre o quattro gruppi, e invece un blocco 3x3 su un
  incrocio di quadranti ne tocca **dieci** (3 righe + 3 colonne + 4 quadranti). Un array
  dimensionato a occhio avrebbe perso in silenzio proprio le mosse piu' rare.
- Un valore fuori scala viene **limitato agli estremi, mai scartato**: scartarlo
  romperebbe l'invariante che tiene in piedi tutto il resto. Un conteggio nella casella
  sbagliata si nota; un conteggio sparito, no.

**Documenti versionati su localStorage (`src/persistence/documenti.js`)**
- Ogni cosa salvata — record, statistiche, impostazioni, sfide, avanzamento nei livelli —
  porta ora un campo `versione`. Finche' i campi si aggiungono e basta non serviva; il
  primo campo che cambia SIGNIFICATO diventerebbe un difetto silenzioso, con il gioco che
  legge un numero vecchio credendolo nuovo e nessun modo di accorgersene.
- Quattro situazioni, tutte dichiarate e tutte provate: niente in memoria, forma senza
  versione (migrata), versione corrente, e **versione futura** — il dato scritto da una
  versione piu' recente non viene ne' frainteso ne' cancellato da una scheda rimasta
  aperta sulla vecchia.
- Sfide e livelli hanno richiesto un cambio di forma vero: erano mappe nude
  (`{"2026-09-06": {...}}`), e infilarci accanto un campo `versione` avrebbe creato **un
  giorno che si chiama "versione"** e un livello superato che si chiama "versione". Ora i
  dati stanno dentro un contenitore, e la migrazione non perde un solo risultato.

### Verifiche

- **240 test in 16 file** (`npm test`), da 213 in 14.
- Due invarianti nuove su partite intere (`tests/invarianti.test.js`), controllate dopo
  **ogni** mossa di 240 partite giocate fino al game over: la somma dell'istogramma della
  Catena e' il numero di mosse, la somma della mappa degli appoggi e' il numero di pezzi
  appoggiati. Un istogramma sbagliato non rompe niente e non si vede: queste due somme
  sono l'unico segnale che esista.
- `tests/documenti.test.js` prova la migrazione **sui dati veri di chi gioca gia'**:
  record, statistiche, sfide e livelli scritti dalla versione precedente. Un aggiornamento
  che azzera mesi di record e' il danno peggiore che questo progetto possa fare, perche'
  non esiste nessuna copia altrove da cui recuperarli. Prova anche uno storage che
  **lancia**: nessuna eccezione esce dal modulo e la partita continua.
- Tutti e tre i controlli sono stati **collaudati rompendo il codice di proposito**:
  indicizzare sulla Catena sbagliata fa fallire il test della Catena applicata;
  dimenticare di contare le mosse a vuoto fa fallire l'invariante con il messaggio
  giusto; togliere la migrazione fa fallire quattro test, fra cui quelli sui dati veri.

### Trovato per strada

**La prova di resistenza era rotta da due versioni, e nessuno lo sapeva.**
`npm run soak` cercava un pulsante «Gioca» che la home non ha più da quando è stata
ristrutturata: falliva subito, con un timeout, senza misurare niente. Era l'unico
controllo rimasto **fuori** da `npm run verifica`, e questo bastava a renderlo invisibile.
Corretto, e soprattutto **aggiunto all'elenco** — ora i controlli sono undici. Un controllo
che si lancia solo quando qualcuno se lo ricorda è un controllo che prima o poi non si
lancia più. Esito dopo la correzione: 377 mosse valide, memoria da 10,9 a 11,7 MB, zero
particelle rimaste, nessun fotogramma sopra i 50 ms su 2537.

**`npm run verifica` ora scrive tutto anche su `verifica.log`.** Un controllo è fallito una
volta sola durante questo lavoro; il suo messaggio era a schermo, ma l'output era incanalato
in `tail` per leggerne il riassunto, e la diagnosi è andata persa. Non si è più ripresentato
in cinque esecuzioni successive, quindi **resta aperto e non archiviato come "flake"**: non
so cosa fosse. Da adesso il messaggio non si perde più.

**L'integrazione continua eseguiva sei controlli su undici.** Elencava a mano i propri
passi, quindi comunicazioni, livelli nel browser, service worker e resistenza non
giravano mai su GitHub. È lo stesso meccanismo che ha lasciato marcire il soak: due
elenchi che dicono cose diverse invecchiano in modo diverso. Ora il flusso esegue
`npm run verifica` e nient'altro, e se qualcosa fallisce `verifica.log` resta
scaricabile dalla pagina della corsa.

**`node --check` non vede tutto.** Chiudendo male un commento di blocco proprio in
`tools/verifica-tutto.mjs`, l'intero corpo dello script è finito dentro il commento: file
sintatticamente valido, `node --check` soddisfatto, programma che non faceva più niente.
Il limite è ora dichiarato in `docs/TESTING.md` accanto al test che lo usa.

### Nota tecnica

`STATE_VERSION` della partita **resta 1**. `deserializeGame` rifiuta qualunque versione
diversa, quindi alzarla per un'aggiunta compatibile butterebbe via la partita in corso di
ogni giocatore che aggiorna. I salvataggi vecchi ripartono con gli istogrammi a zero, e
c'e' un test che lo verifica.

## [0.4.0] — 6 settembre 2026

### Aggiunto

**Installare PLINTO sul telefono o sul tablet (`public/sw.js`, `src/ui/Installa.jsx`)**
- Chiesto da chi gioca: dalla home mancava un modo per portarsi il gioco sul telefono.
  Ora in home c'è una voce che lo installa come applicazione vera — icona nel cassetto,
  schermo intero, nessuna barra del browser.
- **Le due piattaforme non si comportano allo stesso modo, e fingere di sì avrebbe mentito
  a metà dei giocatori.** Su Android il browser lancia `beforeinstallprompt`: l'evento
  viene catturato e conservato, e il pulsante apre la finestra di installazione vera. Su
  iPhone e iPad quell'evento non esiste e non esisterà: lì il pulsante mostra le parole
  esatte da cercare nel menu Condividi. Dove l'installazione non è possibile — su un
  computer, o in un browser che non la offre — **non compare niente**: un pulsante che non
  fa nulla è peggio di un pulsante che manca. E a gioco già installato la voce sparisce.
- Serviva un **service worker**, perché senza Android non offre affatto l'installazione: il
  manifest e le icone maskable che il progetto aveva già non bastano. `public/sw.js` fa due
  cose sole: rende il gioco installabile e lo fa funzionare **senza rete**. Non manda niente
  a nessuno — le richieste verso altri domini le lascia passare senza toccarle, e
  `tests/privacy.test.js` ora lo verifica riga per riga.
- **La strategia di aggiornamento è la parte pericolosa**, ed è scritta per non ripetere il
  guaio classico: un service worker fatto male lascia il giocatore su una versione vecchia
  *per sempre*. Quindi il documento HTML va **sempre in rete per primo** (la cache serve
  solo quando la rete non c'è), le risorse con l'impronta nel nome si prendono dalla cache,
  e il nome della cache contiene la versione: cambiando versione, all'attivazione le cache
  vecchie vengono cancellate.

### Corretto

**Senza rete il gioco si apriva bianco** — trovato dallo scenario nuovo, non a mente
- Alla **prima** visita il service worker non controlla ancora la pagina: il JavaScript e il
  foglio di stile arrivavano senza passare da lui e non finivano in nessuna cache. Chi
  installava il gioco e provava ad aprirlo in aereo trovava una pagina vuota.
- Corretto precaricando il guscio all'installazione. I nomi dei file cambiano a ogni build,
  quindi **non possono essere scritti a mano**: li scrive la build, con un plugin in
  `vite.config.js` che sostituisce un segnaposto in `dist/sw.js` — e **fallisce la build**
  se il segnaposto non c'è più, invece di produrre in silenzio un service worker che non
  precarica niente.

### Verifiche

**`tests/e2e/installazione.mjs` (`npm run installazione`), decimo controllo di `npm run verifica`**
- Serve la build da `/plinto/` come su GitHub Pages, con la cache HTTP disattivata perché
  ciò che si osserva sia l'effetto del service worker e non quello del browser. Controlla:
  registrazione e **ambito** (un service worker registrato sulla radice del dominio invece
  che sulla sottocartella è un errore che non si nota subito), apertura **senza rete**,
  icone e `display` del manifest, e soprattutto che **dopo un aggiornamento vero** — i file
  serviti vengono sostituiti a caldo — il giocatore veda la versione nuova e non la vecchia.
- Due difetti erano **nel controllo stesso**, non nel codice: il segnale dell'aggiornamento
  era dentro `#root`, che React svuota quando si monta, e lo scenario accusava il gioco di
  un difetto inesistente. Sta ora fuori da `#root`. Provato togliendo il plugin di
  precaricamento: lo scenario fallisce con «senza rete il gioco non si apre», cioè accusa
  la cosa giusta.


## [0.3.0] — 6 settembre 2026

### Aggiunto

**Ricominciare il percorso dal livello 1 (`azzeraProgressi`, mappa dei livelli)**
- Chiesto da chi gioca: arrivato al livello 5, non c'era modo di ripartire da capo.
  Si potevano rigiocare i livelli già superati toccandoli sulla mappa, ma non azzerare
  l'avanzamento.
- Il comando sta **in fondo alla mappa**, dopo tutti i cento livelli: chi lo cerca lo
  trova, chi non lo cerca non ci inciampa. Compare solo se c'è qualcosa da azzerare.
- **Due conferme**, come richiesto. Non è burocrazia: è un'azione che cancella ore di
  gioco, non si può annullare, e sta nella stessa schermata che si apre per scegliere
  un livello — un solo tocco, da un pollice che scorre, la farebbe partire per sbaglio.
  La prima conferma dice **quanti** livelli si perdono; la seconda dice che non si torna
  indietro **e cosa non si perde**, perché il timore ragionevole a quel punto è di stare
  cancellando anche record e statistiche.
- **Azzera solo i livelli.** Record della partita libera, statistiche e Sfida del Giorno
  restano dove sono: chi vuole rigiocare il percorso non sta chiedendo di buttare via
  mesi di partite. Per cancellare tutto c'è già "Azzera i miei dati" nelle impostazioni,
  ed è giusto che siano due cose distinte.
- `npm run e2e-quadri` verifica che servano **due** conferme, che si possa tirarsi
  indietro **a ogni passo** senza che l'avanzamento si muova, e che il record della
  partita libera sopravviva. Provato togliendo una conferma: lo scenario fallisce con il
  messaggio giusto.


## [0.2.9] — 6 settembre 2026

### Corretto

**Perdere un livello spegneva il gioco: schermo nero e blocco**

Segnalato da chi giocava. È il difetto peggiore comparso finora, e la causa è una
**collisione di nomi** fra due funzioni che restituivano un campo chiamato allo stesso
modo ma con due tipi diversi:

- `statoQuadro()` → `progressi` è un **array**: le righe «obiettivo: 3 su 5»;
- `registraTentativo()` → `progressi` era un **oggetto**: la mappa dei livelli salvati.

`useQuadro` costruiva l'esito con `{ ...stato, ...registrazione }`, e il secondo
**sovrascriveva** il primo. La schermata di sconfitta chiamava `.map()` su un oggetto,
React smontava l'intero albero, e il giocatore restava davanti al fondo della pagina
senza un pulsante per uscirne.

**Si vedeva solo perdendo**, perché quelle righe le disegna soltanto il ramo della
sconfitta: vincendo il campo rotto non veniva mai letto. Ed è il motivo per cui nessun
test lo ha visto — le prove nel browser coprivano la vittoria di un livello e mai la
sconfitta.

Corretto in due punti, perché il difetto ne aveva due:
- Il campo di `registraTentativo` si chiama ora **`salvati`**: due nomi uguali per due
  cose diverse non possono più incontrarsi.
- `useQuadro` **elenca i campi che gli servono** invece di riversare nell'esito tutto
  quello che la funzione restituisce. Costa una riga e chiude la categoria, non il
  singolo caso.

### Aggiunto

**Una rete di sicurezza attorno all'applicazione (`src/ui/Salvagente.jsx`)**
- Il difetto qui sopra è stato corretto alla radice, ma la fragilità che lo rendeva
  **catastrofico invece che fastidioso** è un'altra cosa: in React un errore di
  rendering smonta tutto l'albero, e il giocatore vede il fondo e basta.
- Ora un errore mostra un messaggio, il dettaglio tecnico (serve a chi segnala) e un
  pulsante per ricaricare, più la rassicurazione che **record, statistiche e livelli
  superati non si perdono**: stanno in `localStorage` e un errore di disegno non li
  tocca. Nessun invio a servizi esterni: il gioco non parla con nessuno **nemmeno
  quando si rompe**.
- Un difetto in una schermata deve costare quella schermata, non la partita.

**La sconfitta di un livello è provata nel browser**
- `npm run e2e-quadri` ora **perde il livello 2 apposta** — una sequenza calcolata dal
  motore che piazza sempre senza mai chiudere un gruppo — e verifica che la schermata
  compaia, che elenchi gli obiettivi e che ci sia il pulsante per riprovare.
- Verifica anche che **non sia entrata in funzione la rete di sicurezza**: la rete
  evita lo schermo nero al giocatore, ma per una prova resta un fallimento pieno.
  Rimettendo il difetto, lo scenario adesso fallisce subito con un messaggio chiaro
  invece di morire trenta secondi dopo su un pulsante che non esiste più.
- Tre test in più in `tests/quadri.test.js`, fra cui uno che vieta il nome `progressi`
  nel valore di ritorno di `registraTentativo`: se torna il nome, torna il difetto.

### Aggiunto (verifiche)

**`npm run verifica`: un comando solo che esegue tutto (`tools/verifica-tutto.mjs`)**
- I controlli di questo progetto sono nove ed erano nove comandi separati: chi pubblica
  doveva ricordarseli tutti. **Non me li sono ricordati tutti** — ho pubblicato saltando
  `prova-pages`, l'integrazione continua ha bloccato il rilascio, e il difetto era
  proprio nel controllo che non avevo eseguito. Un elenco da ricordare a memoria è un
  elenco che prima o poi si dimentica.
- Nessuna verifica viene saltata quando un'altra fallisce: si arriva sempre in fondo e si
  stampa il quadro completo, perché sapere che tre cose sono rotte è più utile che
  scoprirle una alla volta in tre esecuzioni.

**`npm run comunicazioni`: tutto ciò che il gioco dice, in entrambe le lingue**
- Attraversa **ogni schermata** — presentazione, partita libera, home, le quattro pagine
  secondarie, mappa, apertura di un livello, livello in corso, sfida — e legge il testo
  che finisce **davvero sullo schermo**, cercando: chiavi di traduzione non risolte,
  segnaposto non sostituiti (`{max}`), `undefined`, `NaN`, schermate senza testo, e la
  rete di sicurezza entrata in funzione.
- Ogni trappola cercata è un difetto **già accaduto** in questo progetto, non un'ipotesi.
  Nessuno dei tre rompeva niente: il gioco funzionava benissimo mentre diceva cose
  sbagliate, ed è per questo che servono controlli sul testo e non solo sul comportamento.

### Corretto (metodo)

- **Le pipe mascheravano gli esiti.** Lanciavo le prove come `node prova.mjs | tail -3`:
  il codice di uscita di una pipeline è quello dell'**ultimo** comando, cioè di `tail`,
  sempre 0. Una prova di precisione che segnalava uno scostamento mi risultava passata.
  `npm run verifica` non usa pipe e riporta gli esiti veri.
- **La prova di precisione aspettava troppo poco.** Attendeva fino a 500 ms che il
  salvataggio cambiasse; con la macchina occupata da un altro browser ha segnalato uno
  scostamento inesistente — il pezzo era atterrato benissimo, solo qualche decina di
  millisecondi più tardi. Ora la finestra è di 3 secondi: non costa niente quando le cose
  funzionano, perché si esce al primo cambiamento. Una prova che accusa il codice giusto
  quando la macchina è carica è peggio che inutile, perché insegna a non fidarsi dei
  propri controlli.

### Cambiato

- La schermata di sconfitta scriveva «Chiudi **1 righe**». La forma singolare esisteva
  già ma solo la mappa la usava: ora `descriviObiettivo` è una funzione sola, condivisa
  fra le due schermate.


## [0.2.8] — 6 settembre 2026

### Corretto

**Il pulsante più grande della home portava nel posto sbagliato**

È il difetto che ha reso inutili tre versioni di lavoro, e vale la pena scriverlo per
esteso perché la lezione non sta nel codice.

Il pulsante grande avviava la **partita libera** — il gioco senza fine, senza obiettivi —
mentre il percorso a livelli stava in un pulsante secondario più in basso. Un giocatore ha
aperto il gioco, ha premuto il pulsante grande, si è trovato in una partita senza obiettivo
e ha detto: «già al primo livello non si capisce l'obiettivo».

**Aveva ragione due volte**: non era il livello 1, e non c'era modo di accorgersene. Nel
frattempo la spiegazione dei livelli era stata scritta (0.2.2), arricchita (0.2.6) e
disegnata (0.2.7) — e lui non l'ha mai vista, perché nessuna strada ci portava. Stavo
correggendo con cura una schermata che il giocatore non raggiungeva.

- Il pulsante principale è ora il **livello a cui sei arrivato** («LIVELLO 1») e ci entra
  direttamente, presentazione compresa. Sotto, **Mappa dei livelli** con l'avanzamento.
- La **partita libera** resta a un tocco, ma come alternativa **dichiarata** invece che
  come modalità predefinita non annunciata. Il record che le sta accanto è il suo, e ora
  lo dice: «Record 454» invece di un numero nudo.
- **In partita, la modalità è scritta.** Dove nei livelli c'è l'obiettivo, nelle altre
  modalità c'è il loro nome: `PARTITA LIBERA`, `SFIDA DEL GIORNO`. Prima le si
  distingueva solo per l'**assenza** di una striscia — e un'assenza non si nota.
- `npm run e2e-quadri` verifica ora **la strada, non solo la destinazione**: che il
  pulsante principale nomini un livello e che apra davvero la presentazione di un livello.
  Il difetto era invisibile a test che partivano già dalla schermata giusta.

### Aggiunto

- **Badge della versione sulla home** (`v0.2.8`). Stava solo dentro Info, cioè dove nessuno
  la cerca proprio quando servirebbe: serve a chi segnala un problema e a chi lo deve
  capire, per sapere quale build era sullo schermo. Verificato dallo scenario nel browser,
  formato compreso.
- **Etichette accessibili sui pulsanti a due scritte.** Senza, il nome che arriva a un
  lettore di schermo era la concatenazione delle due — «Partita libera —», che non è una
  frase. Ora è «Partita libera, Record 454». Era anche il motivo per cui i selettori delle
  prove nel browser erano fragili.

### Cambiato

- Il menu in fondo alla home è passato a **due colonne**: con quattro voci in fila «Come si
  gioca» andava a capo su tre righe, e sistemata quella restava «Info» da solo sulla
  seconda. Su schermi larghi torna in fila.


## [0.2.7] — 6 settembre 2026

### Aggiunto

**L'obiettivo di un livello si vede, non solo si legge (`src/ui/MiniGriglia.jsx`)**

Segnalazione da chi giocava: «già al primo livello non si capisce l'obiettivo». La
schermata di apertura c'era, la frase pure — «Chiudi una riga» — e diceva la cosa giusta
**nel modo sbagliato**.

A chi non conosce il genere, *riga* non è un'immagine: è una parola. E il gioco non gli
aveva ancora mostrato una riga chiudersi, quindi non aveva niente a cui agganciarla. La
spiegazione della 0.2.2 partiva dal presupposto che il giocatore sapesse già leggere la
griglia — cioè esattamente il presupposto che non si può fare con chi apre il gioco per la
prima volta.

- Ora l'obiettivo è **disegnato**: una griglia 9×9 in miniatura, con le stesse linee spesse
  a separare i quadranti, e le caselle dell'obiettivo accese in ottone — lo stesso colore
  con cui il gioco evidenzia i gruppi che stai per chiudere, quindi il segno è coerente con
  quello che vedrai giocando. Una parola si può fraintendere, nove caselle accese in fila no.
- Il disegno sta **prima** del consiglio: chi non ha mai visto una riga chiusa non può
  capire un consiglio su come chiuderne una.
- Ogni tipo ha la sua figura: riga, colonna, quadrante, gruppo (una riga *o* una colonna,
  la seconda in tinta più tenue), **Intreccio** (una riga e una colonna che si incrociano —
  il disegno spiega da solo perché l'incrocio è il posto giusto) e pulizia (griglia vuota).
- **Gli obiettivi che non sono una forma non vengono disegnati affatto.** «Fai 300 punti» o
  «arriva a Catena 5» non hanno un disegno onesto sulla griglia, e inventarne uno
  insegnerebbe una cosa falsa a chi non ha modo di accorgersene. Meglio nessuna figura.
- Otto test in `tests/quadri.test.js` verificano che la figura corrisponda alla **geometria
  vera**: nove caselle sulla stessa riga, nove sulla stessa colonna, nove dentro un solo
  riquadro 3×3, e per l'Intreccio che le due figure **si incrocino davvero** (9 + 9 − 1
  casella in comune: se non si incrociassero, il disegno direbbe «due gruppi qualsiasi»
  invece di «due gruppi con una sola mossa»). Più `npm run e2e-quadri`, che conta le caselle
  accese nel browser.


## [0.2.6] — 6 settembre 2026

### Aggiunto

**"Come si gioca": le regole si possono rileggere (`src/ui/schermate/ComeSiGioca.jsx`)**

La presentazione al primo avvio si vede **una volta e poi sparisce per sempre**. Che non
torni va bene — chi ha già giocato non deve rileggerla ogni volta — ma che fosse
**irraggiungibile** no: chi riapriva il gioco dopo un mese, o lo passava a qualcun altro,
non aveva nessun posto dove guardare. Le uniche pagine esistenti parlavano di privacy e di
licenze.

- Nuova voce nel menu della home, **messa per prima** fra le secondarie: è l'unica di cui
  un giocatore nuovo ha bisogno, le altre tre non servono a giocare.
- **Contiene più della presentazione, ed è voluto.** La presentazione deve far cominciare a
  giocare in cinque secondi, quindi dice il minimo; questa pagina la si apre apposta, e può
  spiegare anche:
  - l'**Intreccio** — chiudere più gruppi con una mossa, e dove conviene cercarlo;
  - la **Catena**, con il moltiplicatore massimo e l'avviso prima che cali;
  - i **due modi di muovere** (trascinamento e due tocchi) e il gioco **da tastiera**;
  - le **bombe**, comprese le reazioni a catena fra bombe vicine;
  - e la sezione **"Nessuna difficoltà nascosta"**, che dice per esteso una cosa finora
    scritta solo nella documentazione interna: i pezzi non dipendono da come stai andando,
    e le uniche regole che non vedi servono ad aiutarti.

  Intreccio, due tocchi e tastiera **non erano scritti da nessuna parte**: un giocatore
  poteva scoprirli solo per caso.
- **Niente è ricopiato.** Le quattro regole arrivano dallo stesso `REGOLE_INTRO` della
  presentazione, e i moltiplicatori da `config/rules.js`: le due schermate non possono dire
  cose diverse fra loro, né dire cose diverse dal gioco. Un aiuto che descrive regole
  diverse da quelle vere è peggio di nessun aiuto.
- `npm run e2e` non si limita a verificare che la pagina esista — si svuoterebbe senza che
  niente fallisca. Controlla il **contenuto**: le quattro regole, almeno cinque sezioni,
  l'illustrazione della bomba, la presenza di Intreccio, Catena, tastiera e due tocchi, e
  che nessun segnaposto (`{max}`, `{n}`) arrivi allo schermo non sostituito.


## [0.2.5] — 6 settembre 2026

### Aggiunto

**La bomba è spiegata nella presentazione (`src/ui/schermate/PrimoAvvio.jsx`)**
- Le regole all'avvio erano tre e ora sono quattro. La quarta è la bomba, e la sua assenza
  era un difetto vero: **è l'unica cosa del gioco che non si può dedurre giocando.** Un
  blocco appoggiato si comporta come tutti gli altri finché non lo elimini, e a quel punto
  ne porta via altri otto. Righe, colonne, quadranti e Catena si vedono accadere e si
  capiscono dopo; la bomba no — a chi non la conosce succede e basta.
- Accanto alle parole c'è il disegno: il blocco con il segno, e il quadrato 3x3 che porta
  via. Verificato da `npm run e2e`, che controlla sia le quattro regole sia la presenza
  dell'illustrazione.
- **Il numero delle regole ora ha una fonte sola** (`src/config/intro.js`). Era scritto a
  mano in tre posti — il componente e i due script che pilotano un browser — e aggiungendo
  la quarta ne ho aggiornati due su tre: **la pubblicazione è fallita sul terzo**. È la
  stessa categoria di errore che in questo progetto ha già prodotto una costante dichiarata
  due volte e una palette rimasta indietro nell'icona: una modifica meccanica applicata a
  *quasi* tutti i posti. Adesso i due script importano l'elenco invece di contare a memoria,
  e un test verifica che ogni regola abbia il suo testo in ogni lingua — perché una lista
  può crescere senza che qualcuno scriva la traduzione, e il giocatore leggerebbe
  `intro.cinque` come prima cosa del gioco.

### Corretto

**L'italiano adesso è scritto in italiano**
- Tutto `src/i18n/it.js` era in **ASCII puro**: nessun accento, nessun apostrofo. In
  italiano non è una semplificazione tipografica, **cambia le parole**. Alcuni esempi di
  quello che il giocatore leggeva davvero:
  - «Un gruppo **e** una riga, una colonna o un quadrante completo» — voleva dire «**è**».
  - «Questo gioco **e** gratuito e senza **pubblicita**» — «**è**», «**pubblicità**».
  - «Oggi la partita **e** la stessa per tutti» — «**è**».
  - «Non **c e** niente da chiudere» — «non **c'è**».
  - Il pulsante di conferma diceva «**Si**», che senza accento è un pronome, non «**Sì**».
  - E poi `piu`, `puo`, `finche`, `perche`, `meta` in una dozzina di punti.
- Non rompeva niente e si leggeva lo stesso: faceva solo sembrare tradotto male un gioco
  che in italiano ci nasce. **L'italiano qui è la lingua di riferimento, non una
  traduzione.**
- `tests/i18n.test.js` ora rifiuta le parole che in italiano non esistono senza accento
  (`piu`, `perche`, `puo`, `gia`, `cosi`, `meta`, `citta`, `sara`…), verifica che gli
  accenti ci siano davvero — cioè che il file non torni in ASCII — e controlla il «Sì».
  Non è un correttore ortografico e non pretende di esserlo: è una rete su una categoria
  di errore precisa, già vista e facile da reintrodurre scrivendo in fretta.
- I commenti del codice restano volutamente in ASCII: quelli li leggono gli sviluppatori,
  questi testi li legge chi gioca.


## [0.2.3] — 6 settembre 2026

Tre correzioni nate dallo stesso playtest umano della versione precedente.

### Cambiato

**Il segno della bomba adesso sembra una bomba (`src/ui/Bomba.jsx`)**
- Era un anello bianco al centro della cella. Rispettava la regola giusta — segno
  **geometrico e non cromatico**, così lo vede anche chi non distingue i colori — ma
  sbagliava quella più importante: **non sembrava una bomba.** Un cerchio può essere un
  bersaglio, un bottone, un buco. Un giocatore che non riconosce il simbolo non sa che
  quella cella cambierà l'esito della sua mossa, e allora tanto vale non averlo.
- Adesso è una bomba disegnata: corpo tondo, riflesso, tappo, miccia e **scintilla**.
  Il corpo è quasi nero e regge su tutte e sei le famiglie cromatiche in entrambi i temi;
  la scintilla è l'unica parte accesa **ed è l'unica che si muove**, così l'occhio ci va
  e il resto si legge di conseguenza. Verificata a 26px (tray), 34px (plancia) e 64px.
- È SVG dentro il codice come tutto il resto: nessun file, nessuna licenza, nessuna
  richiesta di rete. Sostituisce lo pseudo-elemento CSS, quindi il segno ora è un
  componente solo (`Bomba`) usato sia dalla plancia sia dal tray, invece di due regole.

**Si chiamano livelli, non "Quadri"**
- Il nome interno era un gioco di parole con la griglia, ma per chi gioca un livello è un
  livello. Rinominato in **tutti** i testi dell'interfaccia, in italiano e in inglese
  (`Stage` → `Level`).
- **Il codice non è stato rinominato**: `quadro.js`, `quadri.js`, `useQuadro` e compagnia
  si chiamano ancora così. È una scelta, non una dimenticanza — un rinomina meccanico su
  dieci file per una parola che compare anche dentro "quadrante" è esattamente il modo in
  cui in questo progetto `QUADRANT_SIZE` è già diventato una volta `PLINTONT_SIZE`. Va
  fatto a parte e con calma. Nel frattempo il vocabolario del prodotto e quello del
  codice divergono, ed è detto qui perché nessuno lo scopra per caso.

### Aggiunto

**Fra un livello e l'altro succede qualcosa (`src/ui/AvanzamentoMappa.jsx`)**

Prima si vinceva, si leggeva "superato" e si premeva un pulsante. Adesso la schermata di
vittoria fa **tre cose, in quest'ordine**:

1. **Festeggia.** Plinto salta una volta, due coriandoli cadono. Una volta sola, non in
   ciclo: un festeggiamento che non finisce smette di essere un festeggiamento.
2. **Mostra dove sei arrivato.** Un pezzo del percorso — la tappa appena superata, quelle
   intorno — con il segno che **si sposta** dalla tappa vecchia a quella nuova e la barra
   che **si allunga** mentre la guardi. Non è la mappa completa: quella è uno strumento
   per orientarsi, questo è un momento. Il progresso si sente quando lo si vede accadere.
3. **Manda al livello nuovo**, che si apre spiegandosi (la schermata della 0.2.2).

- Il conteggio dei livelli superati viene ora riletto **appena un livello finisce**: prima
  si aggiornava solo tornando alla mappa, e la barra sarebbe rimasta ferma proprio nel
  momento in cui il giocatore è andato avanti.
- Con `prefers-reduced-motion` o l'impostazione Animazioni spenta si vede lo stato di
  arrivo, senza ritardo e senza movimento: **la stessa informazione**, non meno.
- `npm run e2e-quadri` verifica nel browser che il percorso compaia, che Plinto si sia
  **spostato sulla tappa successiva** e che il conteggio dica 1 e non 0 — che è il difetto
  più facile da fare qui, mostrare il valore letto prima della vittoria.


## [0.2.2] — 6 settembre 2026

### Aggiunto

**Plinto spiega l'obiettivo all'inizio di ogni Quadro (`src/ui/schermate/AperturaQuadro.jsx`)**

Da un playtest umano — il primo di questo progetto — è emersa una lacuna che nessun test
poteva trovare: **il gioco dice cosa fare ma non spiega mai cosa significhi.** La striscia
sopra la plancia scrive «Chiudi una riga» e un contatore `0/1`; che cosa sia una riga, e come
convenga affrontarla, non è scritto da nessuna parte. La presentazione al primo avvio non
copre il buco: è una schermata sola, si vede una volta e non si può più rileggere.

- Ogni Quadro ora si apre con Plinto che dice, in quest'ordine: **la frase dell'obiettivo**
  (la stessa che resterà sopra la plancia), **che cosa significa**, **un consiglio su come
  ottenerlo** e **quante mosse hai**.
- Il consiglio è un consiglio vero, non un incoraggiamento. «Scegline una e finiscila, invece
  di riempirne tre a metà» è un'informazione; «ce la puoi fare» non lo è.
- Testi scritti per **tutti e dieci** i tipi di obiettivo dichiarati in `OBIETTIVI`, non solo
  per i nove che il percorso usa oggi: chi aggiungerà un Quadro con il decimo non deve
  scoprire da un giocatore che manca la frase.
- **Non si rivede premendo "Riprova"**: dopo un Quadro fallito si vuole ritentare subito, e
  rileggere la stessa schermata a ogni tentativo la trasformerebbe da aiuto in pedaggio.
  Resta raggiungibile tornando all'elenco e riaprendo il Quadro.
- Verificato da `tests/quadri.test.js` (4 test nuovi) e da `npm run e2e-quadri`. I test
  controllano la cosa che si rompe davvero: una spiegazione mancante non fa fallire niente,
  mostra la **chiave di traduzione** al posto della frase — e la mostra proprio a chi sta
  imparando le regole. Lo scenario nel browser verifica anche che la frase dell'apertura e
  quella sopra la plancia siano **la stessa**: se dicessero cose diverse, il giocatore non
  saprebbe a quale credere.

### Noto e non risolto

- **Le bombe non sono spiegate da nessuna parte.** Il giocatore vede un anello bianco al
  centro di un blocco e nessun testo dell'applicazione dice che cosa faccia. È l'unico
  elemento che cambia l'esito di una mossa, e compare già nella prima mano del livello 1.
  *(Risolto nella 0.2.4: è la quarta regola della presentazione, con l'illustrazione.)*
- **Non c'è modo di rileggere le regole.** L'introduzione compare una volta sola e non esiste
  una voce "Come si gioca". Non sono spiegati nemmeno l'Intreccio, la modalità a due tocchi e
  il gioco da tastiera. *(Risolto nella 0.2.6, comprese tutte e tre le omissioni.)*


## [0.2.1] — 6 settembre 2026

Nessuna regola di gioco cambiata. Questa versione chiude difetti trovati riverificando codice e
documentazione riga per riga, e soprattutto **sostituisce affermazioni con controlli**: dove
prima c'era un numero scritto a mano in un commento, ora c'è un comando che lo produce.

Controlli: `npm test` passa con **161 test in 14 file**, `npm run build` riesce, `npm run e2e`
non rileva problemi, `npm run precisione` riporta 201 prove su 41 forme senza scostamenti.

### Corretto

**Contrasti del tema chiaro sotto la soglia WCAG AA**
- `--pl-text-faint` stava a **3.94:1** sul fondo più sfavorevole dell'interfaccia, sotto la
  soglia AA di 4.5 che il commento di `tokens.css` **dichiarava di rispettare**. Sotto soglia
  anche `--pl-brand` (4.45), `--pl-ok` (4.46) e `--pl-danger` (4.25).
- La causa è di metodo: i valori erano dichiarati contro `--pl-ink`, il fondo *più favorevole*
  dei quattro. Misurare sul caso migliore non è misurare. Ora il riferimento è `--pl-ink-2`,
  il peggiore, e i quattro token sono stati scuriti: `#60687a` (4.69), `#7f6628` (4.60),
  `#307469` (4.61), `#a54c64` (4.62).
- **Nuovo `tools/contrasti.mjs` (`npm run contrasti`) e `tests/contrasti.test.js`**: i
  contrasti si ricalcolano leggendo `tokens.css` e la suite fallisce se anche uno solo scende
  sotto soglia. È la terza volta che compare questo difetto: una correzione puntuale non lo
  chiude, un controllo automatico sì.

**Il commento di `CHAIN_GRACE` descriveva una regola che non esiste più**
- Diceva «tolleranza 2 (ora)» e riportava misure (2% / 11% / 24%) della *seconda* versione
  della Catena, mentre la costante vale 1 dalla terza. Il codice era giusto, il commento no.
- Anche qui la correzione non è stata battere altri numeri a mano: **nuovo
  `tools/misura-catena.mjs` (`npm run catena`)**, che fa giocare lo `stratega`, registra la
  sequenza dei gruppi chiusi e la rigioca con la regola attuale e con le quattro varianti
  scartate. Il commento riporta la tabella e il comando che la produce.
- Il limite dello strumento è dichiarato dentro lo strumento: le partite sono giocate con la
  regola attuale e lo stratega guarda la Catena quando sceglie, quindi **solo la riga della
  regola attuale è una misura esatta**; le altre sono controfattuali.

**`tests/durate.test.js` garantiva meno di quanto dichiarasse**
- Il controllo che vieta le durate scritte a mano nelle `animation:` cercava `\d+m?s`, cioè
  solo numeri interi: `1.6s` di `pl-bomba-respira` e `3.2s` di `pl-plinto-respira` non venivano
  nemmeno esaminate. Ora riconosce i decimali, l'elenco delle eccezioni è esplicito e per
  ognuna verifica che il selettore che la porta abbia un `animation: none` sotto
  `prefers-reduced-motion`.

**`public/icon.svg` era rimasto alla palette smorzata**
- Per due versioni l'icona ha usato `#E4B44C`, `#4CB5A5` e `#7B6CE6` mentre il marchio dentro
  il gioco disegnava già le tinte sature. Riallineata, PNG rigenerati con `npm run icone`, e
  **`tests/icona.test.js`** confronta ora l'SVG con i token a ogni `npm test`: la duplicazione
  resta necessaria (un file in `public/` non vede i token) ma non può più divergere in
  silenzio.

**Un elenco di debiti aperti che descriveva difetti già risolti**
- Quattro voci su undici in `DESIGN_SYSTEM.md` erano obsolete: bersagli tattili, stringhe
  italiane nel JSX, `toLocaleString('it-IT')` e `"orientation": "portrait"` nel manifest erano
  già stati corretti. L'elenco è stato riverificato sul codice, voce per voce.

### Aggiunto

**La Catena dice quando sta per calare**
- `respiroRimasto` era esportata e coperta da test ma **non la usava nessun componente**: la
  tolleranza era l'unica regola del gioco che il giocatore poteva soltanto dedurre guardando il
  numero scendere. Ora la barra della Catena mostra un avviso di ultima chiamata quando la
  prossima mossa senza eliminazioni farà calare il moltiplicatore. Una regola invisibile è
  indistinguibile da un capriccio.

**Sei test sulla generazione delle bombe**
- La detonazione era coperta dal primo giorno; la regola che decide **quando** arriva una bomba
  no, ed è quella che porta la promessa di equità. Ora si verifica per misura: mai più di una
  bomba per mano, mai su un pezzo da una cella, indice sempre dentro il pezzo, frequenza pari a
  `BOMBA_PROBABILITA` su 3000 mani e **frequenza invariata con la griglia quasi piena** — cioè
  la prova che le bombe non sono una leva sulla difficoltà.

**`prefers-reduced-motion` arriva anche alle particelle**
- Le particelle sono disegnate su un canvas, dove il CSS non arriva. La preferenza di sistema è
  ora letta da JavaScript e decide il **valore iniziale** dell'impostazione Animazioni. Resta un
  valore iniziale: una scelta esplicita del giocatore, essendo salvata, continua a vincere.

### Rimosso

- `--pl-t-slow`: definito e mai usato da nessuna regola.


## [0.2.0] — 6 settembre 2026

Prima versione pubblicata su GitHub Pages. Raccoglie le modifiche di regole, di palette, di
nome e il percorso dei Quadri.

Stato dei controlli al momento della pubblicazione: `npm test` passava con **150 test in 12
file**, `npm run build` riusciva.


### Cambiato

**Il gioco si chiama PLINTO, non più QUADRA**
- Il nome precedente era già usato da giochi esistenti nello stesso genere. Motivazioni e
  verifica in `docs/DIFFERENZIAZIONE.md`.
- La rinomina è passata anche per i nomi delle costanti. Un passaggio automatico aveva
  trasformato `QUADRANT_SIZE` in `PLINTONT_SIZE`, sostituendo la sottostringa "QUADRA" dentro
  una parola che non c'entrava: **corretto**, la costante si chiama di nuovo `QUADRANT_SIZE` e
  i quadranti restano quadranti. Non restano tracce di "PLINTONT" nel codice né nei documenti.

**La regola della Catena, riscritta due volte perché la misura diceva che non funzionava**

Cronologia, con i numeri del giocatore artificiale forte. Tutte le cifre di questo elenco si
rifanno con **`npm run catena`** (`stratega`, 120 partite, tetto di 250 mosse, 29.825 mosse):

1. *Versione originale.* La Catena saliva di **quanti gruppi** chiudeva la mossa e calava di
   uno a **ogni** mossa che non eliminava nulla. Misurato: Catena ≥ 3 solo nell'**1,3%** delle
   mosse giocate, mai sopra 4. Il moltiplicatore che doveva essere la firma del gioco era
   decorativo.
2. *Seconda versione.* Due mosse di tolleranza prima del calo, crescita ancora pari al numero
   di gruppi. Misurato: **95,4%** delle mosse con Catena ≥ 3, ma **77,4%** giocate al tetto
   massimo. Un moltiplicatore fisso è inutile esattamente quanto uno che non arriva mai.
3. *Versione attuale.* La Catena sale di **uno** per mossa che elimina — non di quanti gruppi,
   perché l'Intreccio li premia già e contarli due volte incollava la Catena al tetto — con
   **una** mossa di tolleranza prima di calare (`CHAIN_STEP_UP = 1`, `CHAIN_GRACE = 1`).
   Misurato: **15,0%** delle mosse al tetto e una distribuzione larga su tutti i livelli 0-9,
   fra il 5,6% e il 15,0% per livello. Nessun livello domina, che è il punto.

Le due correzioni servono **insieme**: con la crescita di uno ma senza tolleranza la Catena
torna a non accendersi (0,4% delle mosse ≥ 3), e con la tolleranza a due si incolla di nuovo al
tetto (74,3%) anche con il passo corretto. La tabella completa, e il limite delle righe
controfattuali, sono in `docs/GAMEPLAY_RULES.md`.

Conseguenze sul codice: `nextChainLevel` è diventata `nextChainState`, che restituisce
livello **e** digiuno; lo stato della partita ha un campo `chainDigiuno` in più, serializzato
e validato; `respiroRimasto` espone la tolleranza residua e la barra della Catena la mostra
come **avviso di ultima chiamata** quando la prossima mossa a vuoto farà calare il
moltiplicatore — prima era una regola che il giocatore poteva solo dedurre.

**Palette dei blocchi: da smorzata a satura**
- Le sei famiglie cromatiche erano coerenti con la direzione minerale ma spente su schermo. I
  blocchi sono l'unica cosa colorata dell'interfaccia: ora sono saturi, con la luminosità
  scelta perché ognuno resti sopra 3:1 sul fondo della plancia **in entrambi i temi**.
  Scuro: `#ff6a2b` `#12e1b0` `#9b4dff` `#ffc212` `#ff3d71` `#2e97ff`.
- **Il tema chiaro è stato ridefinito per intero e misurato.** Prima ridefiniva solo fondali e
  testi: il punteggio in ottone stava a **1.53:1** e **cinque blocchi su sei** sotto 3:1 sulla
  plancia. Ora ha tinte proprie per blocchi, `--pl-brand`, `--pl-brand-deep`, `--pl-ok`,
  `--pl-danger` e `--pl-cella-vuota`, e tutti e sei i blocchi passano (peggiore: 3.31).
- Nuovo token `--pl-danger-fondo` (`#b81f47`): il pulsante che **cancella i dati del
  giocatore** scriveva bianco su `--pl-danger`, cioè **2.94:1**. Adesso 6.32:1. `--pl-danger`
  resta il colore del testo di allarme; il fondo è un token separato.
- `--pl-text-faint` e la tinta delle celle libere: quest'ultima è diventata il token
  `--pl-cella-vuota`, perché un velo bianco trasparente su fondo chiaro è invisibile.

### Aggiunto

**I Quadri: cento livelli con una mappa del percorso (`src/config/quadri.js`,
`src/core/quadro.js`, `src/state/useQuadro.js`, `src/ui/schermate/Quadri.jsx`)**
- Cento livelli in **sette atti** — Le basi (1-10), Il ritmo (11-24), Gli ostacoli (25-40),
  La pressione (41-58), Il mestiere (59-76), La maestria (77-92), La vetta (93-100). Ogni
  Quadro ha uno o più obiettivi, un tetto di mosse (da 12 a 40) e, dal 16° in poi, una griglia
  di partenza già occupata: **85 Quadri su 100** partono da uno di **15 motivi** verificati.
- Nove tipi di obiettivo: righe, colonne, quadranti, gruppi, Catena, Intreccio, punteggio,
  celle e pulizia della griglia. Ruotano per atto, così due Quadri vicini non chiedono la
  stessa cosa.
- **I bersagli non sono inventati: sono calcolati.** `tools/taratura.mjs` (`npm run taratura`)
  fa giocare ogni Quadro al pianificatore artificiale, senza obiettivo, e mette il bersaglio a
  un percentile della distribuzione ottenuta — dal 14° percentile del primo atto al 56° della
  Vetta. È la correzione di un difetto grave della prima stesura, in cui i bersagli erano
  scritti a mano: un livello chiedeva **1500 punti dove in quelle mosse se ne fanno 325**, e
  16 Quadri su 40 erano matematicamente impossibili.
  - Lo strumento di taratura aveva a sua volta un difetto che lo rendeva inutile: il
    pianificatore era completamente deterministico, quindi minimo, mediana e massimo
    coincidevano su ogni Quadro e il percentile non misurava niente. Risolto rompendo i
    pareggi con un pizzico di casualità.
- Due motivi di griglia della prima stesura erano **ingiocabili** (celle isolate che nessun
  pezzo può raggiungere). Il generatore ora valida ogni motivo: niente gruppi già completi
  alla partenza, non più di 48 celle occupate, dimensione 9x9.
- `src/config/quadri.js` è **generato** da `tools/genera-quadri.mjs` e non va modificato a
  mano: il design (atti, rotazione degli obiettivi, motivi, tetti di mosse, percentili) vive
  nel generatore, dove si può leggere come un discorso invece che come una tabella.
- La mappa del percorso mostra gli atti, l'avanzamento e la tappa corrente, e si apre già
  scorrendo al punto giusto. La vittoria di un Quadro si valuta **prima** della sconfitta,
  così vincere all'ultima mossa disponibile conta come vittoria e non come mosse esaurite.
- `tests/quadri.test.js`: 18 test su obiettivi, transizioni di stato, unicità e ordine dei
  Quadri. `tests/e2e/quadri.mjs` (`npm run e2e-quadri`) calcola in Node una sequenza vincente
  e poi la rigioca **trascinando davvero i pezzi** in un browser.

**Plinto, il personaggio (`src/ui/Plinto.jsx`)**
- Un blocco di pietra disegnato in SVG, con cinque espressioni (normale, contento, deluso,
  stupito, addormentato) e un respiro di 3,2 secondi che si ferma con `prefers-reduced-motion`.
  Prende i colori dai token, quindi segue il tema. Nessuna immagine, nessuna dipendenza.

**Le bombe (`src/config/rules.js`, `src/core/grid.js`, `src/core/generator.js`,
`src/core/engine.js`)**
- Ogni tanto una cella di un pezzo è una bomba. Non fa niente sulla plancia: **esplode solo se
  eliminata insieme al gruppo che la contiene**, e allora porta via il quadrato di raggio 1
  attorno a sé. Le bombe colpite detonano a loro volta; quelle a distanza 2 no.
- `BOMBA_PROBABILITA = 0.22`, estratta **una volta per mano**: mai due bombe nella stessa
  terna, mai su un pezzo da una cella. La probabilità è **fissa** e non guarda punteggio,
  Catena o andamento della partita — la stessa dichiarazione di equità del generatore.
  Misurato su 40.697 mani: 22,2%.
- Codifica in **un solo array**: il valore di una cella è il colore (1..6), una bomba è
  colore + 10 (11..16). Salvataggi, copie e simulazioni restano quelli di prima.
- Punteggio: `PUNTI_CELLA_ESPLOSA = 6` per ogni cella portata via oltre al gruppo, moltiplicata
  per la Catena ma non per l'Intreccio. Una detonazione non conta come gruppo chiuso.
- Segno visivo **geometrico e non cromatico**: un anello bianco al centro della cella, visibile
  già nel tray. Il colore in PLINTO non porta informazione, e una bomba segnalata da una tinta
  sarebbe invisibile a chi non distingue i colori.
- `tests/bombe.test.js`: 14 test su codifica, raggio, reazione a catena, bordi, celle vuote,
  punteggio e sopravvivenza al salvataggio.

**Strumenti e controlli automatici**
- `tools/schermate.mjs` (`npm run schermate`), `tools/icone.mjs` (`npm run icone`),
  `tools/prova-sottocartella.mjs` (`npm run prova-pages`), `tools/prova-desktop.mjs`
  (`npm run prova-desktop`), `tools/quadri.mjs` (`npm run quadri`). Descritti in
  `docs/TESTING.md`.
- `tests/e2e/precisione.mjs` (`npm run precisione`) e `tests/e2e/resistenza.mjs`
  (`npm run soak`).
- `tests/privacy.test.js`: la promessa "nessuna richiesta di rete" ora è verificata da un test
  che legge i file del prodotto, invece di essere solo scritta in un documento.
- `tests/script.test.js`: `node --check` su tutti gli script di `tools/`, `tests/e2e/` e
  `src/sim/`, che nessun altro test importa.
- `tests/durate.test.js` e `src/feel/durate.js`: le durate degli effetti vivono per forza in
  CSS e in JavaScript, e ora un test fallisce se qualcuno ne cambia solo una.


## [0.1.0] — non ancora rilasciata

Primo nucleo del progetto: il motore di gioco, il generatore, gli strumenti di misura,
l'interfaccia, il game feel, l'accessibilità e la Sfida del Giorno. Il progetto compilava
(`npm run build`), la suite unitaria di allora — **89 test in 7 file** — passava, e lo scenario
`npm run e2e` guidava un
browser reale attraverso primo avvio, partita con mouse, partita a due tocchi, partita da
tastiera, eliminazione con particelle, ripresa dopo ricarica, game over e Sfida del Giorno.
Restano fuori dalla verifica: dispositivi reali, tocco vero, audio e playtest umano. Da
considerarsi non rilasciabile.

### Aggiunto

**Regole e motore (`src/config/`, `src/core/`)**
- `rules.js`: tutte le costanti di regolamento in un solo file, ognuna commentata.
- `rng.js`: PRNG deterministico mulberry32 a stato esplicito, con derivazione del seed da una
  stringa.
- `shapes.js`: catalogo di 41 forme senza rotazioni, divise in 6 famiglie (punto, linea,
  angolo, tetro, blocco, diagonale) e pesate per l'estrazione (peso totale 183).
- `grid.js`: griglia 9x9 come `Uint8Array`, posizionamento, ricerca di righe/colonne/quadranti
  completi e loro eliminazione con le celle d'incrocio contate una volta sola.
- `scoring.js`: punteggio a tre livelli — celle appoggiate, Intreccio (più gruppi in una
  mossa), Catena (moltiplicatore persistente, senza mai azzerarsi) — più il bonus di
  svuotamento della griglia e il livello di celebrazione `moveTier`. La regola della Catena è
  poi cambiata due volte: vedi "Cambiato" qui sotto.
- `generator.js`: generatore della terna con casualità controllata; pressione da affollamento,
  memoria delle forme recenti e tre reti di sicurezza dichiarate a favore del giocatore.
- `engine.js`: riduttore puro della partita — `createGame`, `placePiece`, rilevamento del game
  over, statistiche, `summarize`, `serializeGame`/`deserializeGame` con rifiuto dei salvataggi
  incompatibili o corrotti.

**Misura (`src/sim/`, `tests/`)**
- `sim/player.mjs`: quattro giocatori artificiali (`casuale`, `normale`, `esperto` e lo
  `stratega` con beam search sull'intera terna).
- `sim/run.mjs`: harness da riga di comando con seed fisso; stampa distribuzione di punteggio
  e mosse, istogramma del riempimento della griglia al game over e confronto fra frequenza
  attesa e osservata di ogni forma.
- Test Vitest su griglia, punteggio, generatore, motore (compresa la robustezza dei
  salvataggi manomessi), parità delle traduzioni, Sfida del Giorno, e un file di **invarianti
  su partite intere** che gioca 240 partite fino al game over controllando dopo ogni mossa che
  lo stato resti possibile.
- **Tetto di mosse nel simulatore** (`node src/sim/run.mjs [partite] [profilo] [tetto]`): mette
  tutti i profili davanti allo stesso numero di occasioni, perché senza, il giocatore più
  bravo segna di più anche solo perché sopravvive più a lungo.
- `tests/e2e/partita.mjs`: scenario in Chromium reale che avvia da solo il server di
  sviluppo, costruisce gli stati difficili con il motore vero e li inietta in `localStorage`.

**Interfaccia (`src/ui/`, `src/state/`, `src/persistence/`, `src/i18n/`, `src/styles/`)**
- Componenti React di plancia, tray, HUD, barra della Catena, logo e otto schermate
  (primo avvio, home, gioco, fine, statistiche, impostazioni, info, sostegno).
- `useTrascinamento`: drag & drop scritto a mano con pointer events — il pezzo si solleva
  sopra il dito, cresce alla scala della griglia, mantiene il punto di presa e si aggancia al
  centro di cella più vicino. Più una modalità alternativa **a due tocchi** per chi non riesce
  a trascinare.
- Anteprima della mossa: dove finirebbe il pezzo, se è legale, e **quali celle sparirebbero**
  (aiuto visivo disattivabile).
- `usePartita` e `useImpostazioni`; salvataggio della partita a ogni mossa.
- `src/persistence/`: wrapper protetto su `localStorage` e registro dei record personali.
- `src/i18n/`: dizionari italiano e inglese con fallback a catena.
- `src/styles/tokens.css` e `app.css`: sistema di design minerale (vedi
  `docs/DESIGN_SYSTEM.md`), tema chiaro su richiesta esplicita, layout orizzontale per il
  telefono coricato e adattamento agli schermi bassi.
- `index.html`, `src/main.jsx`, `src/config/progetto.js`.
- `public/icon.svg` (icona originale in SVG) e `public/manifest.webmanifest`.

**Game feel (`src/audio/`, `src/feel/`)**
- `audio/suoni.js`: **audio interamente sintetizzato** con oscillatori e inviluppi della Web
  Audio API — nessun file audio nel progetto. Scala pentatonica maggiore, così anche una
  raffica di eliminazioni resta consonante; l'arpeggio dell'eliminazione parte da un gradino
  più alto man mano che la Catena sale, quindi il moltiplicatore **si sente** prima di
  leggerlo. Il contesto audio nasce solo dentro un gesto del giocatore.
- `feel/particelle.js`: esplosioni su **un solo canvas** sovrapposto alla plancia, non decine
  di nodi DOM animati; il ciclo di `requestAnimationFrame` esiste solo finché ci sono
  particelle vive, per non consumare batteria mentre il giocatore pensa.
- `feel/useEffettiMossa.js`: unico punto in cui `lastMove` diventa suoni, vibrazioni,
  particelle e animazioni. Il motore resta ignaro del feedback.
- Animazioni: il blocco appoggiato atterra (260 ms); il blocco eliminato viene **ridisegnato
  per 420 ms dopo essere già uscito dallo stato**, altrimenti l'eliminazione sarebbe uno
  scatto invisibile; i punti volano via dalla cella con dimensione e colore legati al valore
  della mossa; il punteggio in testata scatta e la barra della Catena lampeggia quando sale.
- `feel/vibrazione.js`: pattern brevi per `navigator.vibrate`, protetti sui dispositivi che
  non la supportano.
- Una mossa rifiutata ha un suono e una vibrazione propri: in un gioco a trascinamento il
  silenzio si legge come "è rotto".
- Tutto rispetta le impostazioni del giocatore (audio, vibrazione, animazioni).

**Accessibilità**
- **La partita si gioca interamente da tastiera**: Tab sceglie il pezzo, Invio lo prende, le
  frecce (o WASD) muovono un cursore sulla griglia, Invio lo appoggia, Esc annulla. Il cursore
  parte dal centro, cioè dal punto da cui si raggiunge ogni casella in meno pressioni.
- Il cursore da tastiera è un **anello spesso, non una tinta**: non dipende dal colore.
- `ui/Annunci.jsx`: regione `aria-live="polite"` che descrive a parole cosa è successo
  ("2 righe, 1 quadrante eliminate. piu 96 punti. Catena 3."). In `polite` e non `assertive`,
  altrimenti in una raffica di mosse diventerebbe inascoltabile.
- Ogni cella ha un'etichetta con riga, colonna e stato; la barra della Catena è un
  `progressbar` con i valori corretti; gli interruttori sono `role="switch"`.
- **Contrasti misurati, non stimati.** `--pl-text-faint` era `#626b83`, cioè 3.55:1 sul fondo e
  **2.88:1** sui pannelli, sotto la soglia WCAG AA di 4.5 per testo normale: sostituito con
  `#838ca1` (5.60 e 4.54). `--pl-danger` è stato schiarito da `#e4587e` (**4.37:1** sui
  pannelli) a `#ec6d8e` (5.21). I numeri sono scritti nel commento di `tokens.css` così che la
  prossima modifica parta da una misura e non da un'impressione.

**Primo avvio e adattamento allo schermo**
- Presentazione al primo avvio: una schermata, tre righe, un pulsante, e non torna mai più.
  Non è un tutorial e non blocca niente. L'esempio mostrato era sbagliato nella prima stesura
  (3+3 celle per chiudere un quadrante che ne richiede 9); ora usa due pezzi che chiudono
  davvero un 3x3, verificato eseguendo il motore.
- Layout orizzontale: su telefono coricato la plancia va a sinistra, punteggio e pezzi a
  destra, senza cambiare un solo componente. Realizzato con una classe esplicita invece che
  con `:has()`, per non dipendere dal supporto del selettore.

**Sfida del Giorno (`src/persistence/sfide.js`)**
- Il seme della partita è la **data locale** (non UTC: il "giorno" è quello del giocatore),
  quindi nello stesso giorno griglia e sequenza dei pezzi sono identiche per tutti.
- Volutamente povera di meccanica: nessun limite di tentativi, niente da sbloccare, nessuna
  ricompensa, nessuna valuta e **nessuna serie giornaliera da mantenere** — le serie
  funzionano perché fanno paura di perdere qualcosa, e questo gioco non usa la paura per
  farsi riaprire. Nessuna classifica, perché non esiste server e nessun dato lascia il
  dispositivo.
- Slot di salvataggio **separati** per partita libera e sfida (`KEYS.CURRENT_CHALLENGE`):
  aprire la sfida non cancella la partita lasciata a metà.
- Storico dei risultati potato a 60 giorni; della giornata si conserva solo il punteggio
  migliore.
- Nella home è un secondo pulsante con lo stesso peso visivo degli altri comandi: non
  lampeggia e non ha contatori alla rovescia.

**Documentazione**
- `README.md` e i documenti in `docs/`: architettura, regole di gioco, sistema di design,
  test, questo changelog e il registro degli asset.

### Deciso durante lo sviluppo (bilanciamento)

- La prima versione del generatore imponeva che ogni pezzo avesse almeno **4 posizioni valide**
  finché il riempimento era sotto il **50%**. Misurato: la mediana delle mosse per partita è
  salita **da 83 a 191** e la difficoltà si è appiattita. La regola è stata ridotta ad **almeno
  2 posizioni valide, solo sotto il 30% di riempimento** (`MIN_PLACEMENTS_EARLY = 2`,
  `RISKY_PIECE_FILL = 0.3`).
- Il moltiplicatore Catena applicato a una mossa è quello **precedente** alla mossa, cioè
  quello che il giocatore vedeva nell'interfaccia. È una scelta di trasparenza, non di
  bilanciamento.

### Corretto durante lo sviluppo

- **La presa del pezzo veniva misurata sul bottone invece che sul disegno.** L'imbottitura del
  bottone sfasava il posizionamento di quasi una cella: invisibile su griglia vuota,
  paralizzante su griglia piena. Trovato dallo scenario e2e, non da un test unitario.
- **Il file di test delle traduzioni non veniva raccolto.** Importava i dizionari come `it` ed
  `en`, e `it` collide con la funzione di test di Vitest; la suite continuava a dichiarare
  tutti i test verdi pur avendo un file fallito. Ora gli import si chiamano `italiano` e
  `inglese`; l'avvertimento è in `docs/TESTING.md`.
- Commenti del generatore che dichiaravano una soglia di equità del 50% mentre il codice usa
  il 30%, e che elencavano 3 regole su 5.
- `deserializeGame` accettava salvataggi manomessi (punteggio non numerico, stato inventato,
  Catena fuori scala): ora li rifiuta, con cinque test dedicati.
- La durata della partita usava `Date.now()` non iniettabile, unico valore non riproducibile a
  parità di seed: ora è un parametro.

### Noto e non risolto

- I profili di simulazione `esperto` e `normale` producono risultati molto vicini. La domanda
  è però risultata mal posta: confrontarli a partite libere confonde chi gioca *meglio* con chi
  sopravvive *di più*. A parità di occasioni (tetto di mosse) il salto vero è fra scegliere una
  mossa alla volta e pianificare tutta la terna. Vedi `docs/TESTING.md`.
- **Le misure di bilanciamento vanno rifatte a ogni cambio di regole, e non sempre è stato
  fatto subito.** L'arrivo delle bombe e la nuova Catena hanno spostato di molto la durata e il
  punteggio delle partite simulate: i numeri citati nei documenti valgono per la revisione in
  cui sono stati presi, ed è per questo che ognuno riporta profilo, numero di partite e data.
- L'interfaccia è coperta **solo** dallo scenario `npm run e2e`, che è un percorso felice: non
  esistono test unitari sui componenti né un ambiente di test con DOM.
- Lo scenario e2e usa il mouse, quindi il ramo del trascinamento pensato per il tocco (il
  pezzo che si solleva sopra il dito) non viene mai eseguito. Il percorso di Chromium è inoltre
  scritto nel file e va corretto a mano su un'altra macchina.
- `prefers-reduced-motion` riduce le animazioni a fotogrammi chiave e spegne le tre animazioni
  infinite. Le particelle sul canvas non passano dal CSS e restano fuori dalla sua portata: la
  preferenza di sistema è ora letta anche da JavaScript e decide il valore **iniziale**
  dell'impostazione "Animazioni", che le spegne davvero. Chi le vuole comunque le riaccende, e
  la sua scelta salvata vince sulla preferenza di sistema.
- Il link di donazione in `src/config/progetto.js` è volutamente vuoto e va inserito a mano
  dal proprietario del progetto.
- La verifica professionale del nome PLINTO (marchi e negozi di applicazioni) non è stata
  fatta: `docs/DIFFERENZIAZIONE.md` non afferma e non può affermare che il nome sia libero.
- Nessun playtest umano e nessuna prova su un dispositivo fisico. Tutte le misure di questo
  documento vengono da giocatori artificiali e da un browser guidato da script.
