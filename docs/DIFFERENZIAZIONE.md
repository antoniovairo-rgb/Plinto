# Audit di differenziazione

> Ricerca svolta il 6 settembre 2026 tramite motore di ricerca. **Non è una verifica
> legale.** Le pagine degli store (`apps.apple.com`, `play.google.com`) non sono
> raggiungibili dall'ambiente in cui è stata fatta questa ricerca: i dati qui sotto
> vengono dai risultati di ricerca e dalle loro descrizioni, non dalle schede prodotto
> lette direttamente. Nessun registro di marchi è stato consultato.
>
> **Nessuna affermazione di questo documento va usata come garanzia legale.**

## Riepilogo: due problemi seri

### 1. Il nome QUADRA era già usato nel nostro stesso genere — RISOLTO

| Prodotto | Piattaforma | Note |
| --- | --- | --- |
| *Plinto – Block Puzzles* (XSGames) | Google Play | Puzzle a piastrelle, stesso genere |
| *Plinto – A Puzzle Game* (XSGames) | App Store | Stesso prodotto della riga sopra |
| *Plinto* | Steam | Puzzle a blocchi tipo Tetris, originariamente di Ludus Design, open source dal 2000 |
| *Plinto Tangle: Tetra Twist* | Google Play | Puzzle a blocchi con tetramini |
| *Quadrablock* | App Store | Puzzle a blocchi |

Un nome identico, nella stessa categoria di prodotto, su entrambi gli store dove
andremmo a pubblicare. È il caso peggiore: non serve un contenzioso perché il problema
si manifesti, basta il rifiuto della scheda o la confusione dell'utente in ricerca.

**Deciso il 6 settembre 2026: il gioco è stato rinominato in PLINTO** (il blocco di
pietra alla base di una colonna — si aggancia alla direzione artistica minerale già
scelta e descrive letteralmente ciò che il giocatore appoggia).

Nomi valutati e scartati:

| Nome | Perché scartato |
| --- | --- |
| Tessello | Esiste *Tessella*, puzzle game in uscita sugli stessi store: una lettera di differenza è peggio di un nome diverso |
| Kubiko | Esiste già un puzzle game con questo nome (playkubiko.com) |
| Onice, Ennea | Nessuna collisione trovata, ma meno legati all'identità visiva |

Su PLINTO la ricerca non ha prodotto collisioni nella categoria puzzle.
**Questo non basta**: resta la voce aperta della verifica professionale di anteriorità,
vedi `RELEASE_CHECKLIST.md`.

### 2. La meccanica 9x9 con riga/colonna/quadrante non è nostra — ACCETTATO CONSAPEVOLMENTE

Quando è stata scelta, era stata verificata solo la differenza rispetto a *Block Blast!*
(8x8, solo righe e colonne). Era vero, ma insufficiente: la combinazione
"griglia 9x9 + eliminazione di righe, colonne **e riquadri 3x3**" è la formula di un
sotto-genere già affollato.

| Prodotto | Note |
| --- | --- |
| **Blockudoku** (Easybrain) | Il titolo di riferimento del sotto-genere: 9x9, righe, colonne e quadrati |
| *Block Puzzle 9x9* | 9x9, righe, colonne e riquadri 3x3 in stile sudoku |
| *bloxed: 9x9 Block Puzzle* | Riga, colonna o sezione 3x3 |
| *Nine Blocks* | 9x9, linee e quadrati |

Le meccaniche di gioco in genere non sono protette dal diritto d'autore (lo è
l'espressione: grafica, testi, suoni, codice), quindi questo **non è di per sé un
problema legale**. È però un problema di posizionamento: presentare la regola del
quadrante come l'elemento distintivo del prodotto sarebbe scorretto verso l'utente e
verso noi stessi.

**Deciso il 6 settembre 2026: la meccanica resta.** Le simulazioni dicono che il nucleo
funziona (pianificare la mano raddoppia la sopravvivenza, le morti cadono per il 91%
fra il 40% e il 70% di riempimento), e rifarlo significherebbe buttare un
bilanciamento misurato per inseguire una novità che il brief stesso sconsiglia.
Cambia invece **il messaggio**: la regola del quadrante non va comunicata come
elemento distintivo. Gli elementi su cui costruire la comunicazione sono la Catena,
l'assenza totale di pubblicità e di meccanismi manipolatori, e l'accessibilità.

## Cosa resta effettivamente nostro

| Elemento | Stato |
| --- | --- |
| **Catena** — moltiplicatore persistente che *cala di uno* invece di azzerarsi | Non ho trovato traccia di un sistema uguale. Non posso però affermare che sia unico: assenza di prove non è prova di assenza |
| Pezzi diagonali nel catalogo | Insoliti nel genere; non verificato in modo esaustivo |
| Direzione artistica, marchio, palette, tipografia | Originali, prodotti per questo progetto |
| Audio interamente sintetizzato a runtime | Nessun campione di terzi; scelta non comune |
| Partita completa da tastiera + annunci vocali | Raro nel genere |
| Regole di equità del generatore pubblicate in chiaro | Non ho trovato precedenti |
| Nessuna pubblicità, nessun acquisto, nessuna serie giornaliera da mantenere | Sceltа di posizionamento, verificabile dal codice |

## Cosa NON è stato copiato

Verificato leggendo il codice, non per dichiarazione: nel progetto non esiste nessun
asset di terze parti. Nessuna immagine importata, nessun font esterno, nessun file
audio, nessuna richiesta di rete verso domini di terzi. Grafica e marchio sono SVG
scritti a mano; i suoni sono generati da oscillatori. Vedi `ASSET_LICENSES.md`.

## Raccomandazioni

1. **Cambiare nome.** Prima della pubblicazione, e prima di spendere in materiali di
   presentazione. Vedi la sezione seguente.
2. **Far verificare il nome scelto a un professionista** (ricerca di anteriorità sui
   marchi nelle classi pertinenti, più una ricerca sugli store). Questo documento non
   sostituisce quella verifica.
3. **Non comunicare la regola del quadrante come elemento distintivo.** L'elemento su
   cui costruire il messaggio è la Catena, insieme all'assenza di pubblicità e di
   meccanismi manipolatori.
4. **Rivalutare se rafforzare la meccanica** con qualcosa che il sotto-genere non ha
   già, oppure accettare consapevolmente di essere "un altro gioco del genere fatto
   bene, senza pubblicità e accessibile". Sono due prodotti diversi e la scelta non è
   tecnica.

## Criteri per il nome nuovo

- Non deve comparire in nessuno store nella categoria puzzle.
- Meglio una parola **coniata** che una parola comune: una parola inventata è più
  facile da proteggere e più difficile da rivendicare da parte di altri.
- Deve funzionare in italiano e in inglese.
- Non deve finire in `-tris` né richiamare marchi esistenti.
- Va verificato prima di essere adottato, non dopo.
