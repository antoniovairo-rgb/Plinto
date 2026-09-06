# PLINTO

Puzzle game a blocchi. Gratuito, **senza pubblicita**, senza account, senza attese.

> Stato: **giocabile e completo nelle funzioni**, non ancora pubblicato.
> Restano da chiudere le voci del [gate di rilascio](docs/RELEASE_CHECKLIST.md),
> fra cui il collegamento PayPal e la verifica legale del nome.

## Il gioco in una riga

Ricevi tre pezzi, li appoggi su una griglia 9x9 e li fai sparire completando una
**riga**, una **colonna** o un **quadrante 3x3**. Finisce quando nessun pezzo entra piu'.

## Cosa lo rende PLINTO e non un altro gioco a blocchi

1. **Il quadrante.** Non si eliminano solo righe e colonne: anche i nove riquadri 3x3.
   Una sola mossa puo' chiuderne tre insieme.
2. **La Catena.** Un moltiplicatore persistente che **sale di uno ogni volta che elimini
   qualcosa** e **scende di uno quando stai fermo**, con una mossa di tolleranza prima di
   iniziare a calare. Non si azzera mai di colpo: la partita diventa una tensione continua
   ("non lasciarla scendere") invece di una serie di combo isolate. La regola e' stata
   riscritta due volte, misurando: con la prima versione la Catena arrivava a 3 solo nel
   2% delle mosse, con la seconda il 59,5% delle mosse si giocava al tetto massimo.
   Entrambi i casi rendono il moltiplicatore un numero fisso. I dettagli e i numeri sono
   in [docs/GAMEPLAY_RULES.md](docs/GAMEPLAY_RULES.md).
3. **Le bombe.** Ogni tanto una cella di un pezzo e' una bomba. Non fa niente finche' sta
   sulla plancia: esplode solo se viene **eliminata** insieme al suo gruppo, e allora porta
   via anche le otto celle intorno — e le altre bombe che tocca. La probabilita' e' fissa e
   non guarda come sta andando la partita.
4. **Le diagonali.** Forme rare che obbligano a leggere la griglia in un altro modo.
5. **Equita' dichiarata.** Nessuna difficolta' occulta. Le uniche regole nascoste che
   esistono servono ad *aiutare* il giocatore, e sono scritte in chiaro in
   [docs/GAMEPLAY_RULES.md](docs/GAMEPLAY_RULES.md).

## Accessibilita'

La partita si gioca **interamente da tastiera** (Tab per scegliere il pezzo, Invio per
prenderlo, frecce per muoversi, Invio per appoggiarlo, Esc per annullare) e ogni mossa
viene descritta a voce ai lettori di schermo. I contrasti sono misurati, non stimati:
`npm run contrasti` li ricalcola leggendo il foglio dei token e fallisce se anche uno solo
scende sotto la soglia WCAG, la suite di test lo esegue a ogni giro, e sono documentati uno
per uno in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md). Nessun testo dell'interfaccia
resta sotto AA in nessuno dei due temi.

Le informazioni non passano mai dal solo colore: il cursore da tastiera e' un anello, la
mossa illegale un bordo, e la bomba si riconosce da un segno geometrico al centro del
blocco e non dalla sua tinta.

## Come e' fatta la home

Il pulsante grande e' il **livello a cui sei arrivato**, e ci entra direttamente. Sotto,
la **mappa dei livelli** con l'avanzamento, la **partita libera** (il gioco senza fine,
con il suo record) e la **sfida del giorno**. In partita, quando non sei in un livello,
la modalita' e' scritta sopra la plancia: cosi' non c'e' modo di non sapere dove sei.

## Le regole si rileggono

Dalla home, voce **"Come si gioca"**: le quattro regole, i due modi di muovere, la tastiera,
l'Intreccio, la Catena, le bombe e la sezione sull'equita' dichiarata. La presentazione al
primo avvio resta breve apposta; questa pagina la si apre quando serve.

## Installarlo sul telefono

Dalla home c'e' una voce che installa PLINTO come applicazione: icona sullo schermo,
schermo intero, e funziona **anche senza connessione**. Su Android il pulsante apre
direttamente la finestra di installazione del browser; su iPhone e iPad, dove quella
finestra non esiste, mostra le parole esatte da cercare nel menu Condividi. Dove
l'installazione non e' possibile non compare niente, invece di un pulsante che non fa
nulla.

## Provarlo

Istruzioni passo passo, telefono compreso: **[AVVIO-RAPIDO.md](AVVIO-RAPIDO.md)**.

## Comandi

```bash
npm install
npm run dev        # server di sviluppo
npm run build      # build di produzione in dist/
npm test           # suite di test unitari
npm run e2e        # partita completa guidata in un browser reale
npm run precisione # precisione del trascinamento su tutte le forme
npm run soak       # sessione lunga: fluidita', memoria, residui
npm run sim        # simulazione di bilanciamento (migliaia di partite)
npm run schermate  # rigenera le immagini per gli store, dal gioco vero
npm run icone      # rigenera le icone PNG da public/icon.svg
npm run prova-pages    # verifica che la build funzioni servita da una sottocartella
npm run prova-desktop  # controlla l'aspetto su schermi grandi
npm run quadri         # misura la difficolta' reale di ogni livello
npm run contrasti      # rimisura i contrasti WCAG leggendo il foglio dei token
npm run catena         # distribuzione della Catena, confrontata con le regole scartate
```

Gli script che usano il browser avviano da soli il server di sviluppo.

## Documentazione

| File | Contenuto |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Come e' fatto il codice e perche' |
| [docs/GAMEPLAY_RULES.md](docs/GAMEPLAY_RULES.md) | Regole, punteggio, equita' |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colori, contrasti, tipografia, movimento |
| [docs/TESTING.md](docs/TESTING.md) | Test automatici e simulazioni |
| [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) | Cosa manca prima di pubblicare |
| [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md) | Registro delle risorse e delle licenze |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Storico delle versioni |

## Modello economico

Gratuito e senza pubblicita di qualunque tipo. L'unica forma di sostegno prevista e'
una **donazione volontaria**, mai obbligatoria e mai legata a vantaggi di gioco.
