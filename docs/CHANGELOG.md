# Changelog

Tutte le modifiche degne di nota a PLINTO. Il formato segue una versione semplificata di
[Keep a Changelog](https://keepachangelog.com/it/1.1.0/); il progetto usa
[Versionamento Semantico](https://semver.org/lang/it/).

La versione è dichiarata in un solo posto — il campo `version` di `package.json` — e
`vite.config.js` la inietta nel bundle come `__APP_VERSION__`.

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
