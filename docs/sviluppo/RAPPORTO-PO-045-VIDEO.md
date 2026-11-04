# Rapporto PO-045 — il video dello store con la Torre in apertura

Ramo `video-torre`, partito da `main` a `f33f337` (1.22.2 pubblicata). 4 novembre 2026.
Nessun file di `src/` toccato. Il video **non** è nel repository (`store/video/` è
ignorata da git): lo genera e lo consegna la madre.

## Che cosa chiedeva il PO

Circa 90 secondi; nei **primi 30** (gli unici che la Play Console fa partire da soli) la
mappa sulla scheda «La Torre» e un livello della Torre con i massi giocato fino alla
vittoria; dopo, il resto del racconto di prima, accorciato. Ritmo calmo, tante
animazioni (richiesta del 10 ottobre).

## L'ordine

### Scelto (consigliato): Torre, guida, resto

| Da | Parte | Durata |
|---|---|---|
| 0,0 s | home di chi è al livello 115 («La Torre: 14 di 100») | 2,2 s |
| 2,2 s | mappa sulla scheda «La Torre»; tocco su «Il Ponte» (100 di 100, tutto spuntato) e ritorno; scorsa verso gli atti chiusi | 7,2 s |
| 9,4 s | apertura del 115: «Arriva a Catena 2», i massi spiegati, 14 mosse | 3,1 s |
| 12,5 s | il 115 giocato: un istante sulla griglia con i nove massi, poi cinque mosse | 12,2 s |
| 24,7 s | vittoria: «Livello superato!», gettone guadagnato, record di mosse | 3,0 s |
| 27,7 s | di nuovo la mappa: 115 spuntato, Plinto sul 116 | 2,6 s |
| 30,4 s | la guida del primo avvio, sei passi | 11,0 s |
| 41,3 s | Sfida del giorno, quattro mosse scelte nel browser | 9,6 s |
| 51,0 s | archivio delle sfide | 3,1 s |
| 54,1 s | partita libera, sette mosse (la prima è un Intreccio da quattro gruppi) | 17,5 s |
| 71,5 s | statistiche | 3,9 s |
| 75,5 s | «Come si gioca», scorsa lenta | 7,9 s |
| 83,3 s | home, chiusura («Livello 116») | 3,5 s |

Perché questo: tutto ciò che il PO ha chiesto nei primi 30 secondi c'è e finisce a
30,4 s, compresa la mappa con il livello spuntato, che chiude il racconto della Torre
(«ho vinto, si va avanti»). La guida subito dopo spiega le regole a chi ha appena visto
giocare e continua a guardare.

**Come è fatto.** La guida del primo avvio si apre solo quando nasce la pagina; per
mostrarla a metà video bisognerebbe ricaricare la pagina, e un ricaricamento lasciava due
secondi di schermo nero (è scritto nello script dal 10 ottobre). Quindi la guida si
**registra per prima** e il montaggio mette i tratti nell'ordine della costante
`ORDINE = ['torre', 'guida', 'resto']`: i fotogrammi hanno l'istante in cui il browser li
ha disegnati, quindi spostare un tratto non richiede di rifare niente. Fra un tratto e
l'altro c'è un taglio netto. Il tratto della guida si chiude sull'ultimo passo, **prima**
della home: la home vista lì è quella di prima del livello («Livello 115»), e la prima
prova passava in mezzo secondo da «115» a «116».

### Alternativa B: guida in apertura, Torre subito dopo

Guida (≈11 s), poi home, mappa della Torre, livello vinto. È l'ordine di prima e non ha
tagli, ma la vittoria cadrebbe intorno ai 36 s: fuori dai 30 secondi richiesti, a meno di
accorciare la guida a due o tre passi. Scartata per questo.

### Alternativa C: Torre, poi resto senza guida

Come la scelta, ma senza la guida: niente tagli da registrazione spostata, e le regole le
racconta «Come si gioca» alla fine. Il video scenderebbe a circa 76 s, quindi andrebbero
allungate altre parti per stare sui 90. Scartata perché il PO ha chiesto di tenere la guida.

## Il livello della Torre: il 115

Ricerca in Node con il motore vero (`iniziaQuadro`/`giocaNelQuadro`, come si faceva per
il 46), lo stesso giocatore dello script (`migliorPosa`: la posa che chiude più gruppi,
al quadrato, con un po' di caso dal seme). Livelli 101-125 (atti «basamento», «mura» e
l'inizio di «chiocciola», i più leggibili), 2000 semi per livello (1000-2999), voto =
3·eliminazioni + 4·Intrecci − 2·mosse, solo partite vinte.

| Livello | Seme | Mosse | Gruppi per mossa | Eliminazioni | Intrecci | Massi | Obiettivo |
|---|---|---|---|---|---|---|---|
| **115** | **1090** | **5** | 0,0,0,1,2 | **2** | **1** | **9** (diagonale) | Catena 2 |
| 120 | 1225 | 5 | 0,0,0,1,1 | 2 | 0 | 9 (cuori) | Catena 2 |
| 125 | 1956 | 16 | 0,0,0,0,0,0,2,0,0,0,0,1,2,0,0,2 | 4 | 3 | 11 | 7 gruppi |
| 111 | 1500 | 15 | 0,0,0,1,1,0,0,0,0,2,0,0,1,0,1 | 5 | 1 | 9 | 6 gruppi |

Scelto il **115**: è il più corto, ha un Intreccio e nove massi ben visibili sulla
diagonale; i due gruppi dell'Intreccio finale passano sopra i massi, che restano al loro
posto, e la griglia rimasta con i soli massi conta come svuotata: il gioco lo festeggia
con una delle sue frasi a caso («Griglia vuota!», «Non è rimasto niente!»...). La regola
dei massi («contano come pieni, ma non spariscono mai») si vede senza spiegarla.

**Il limite, detto chiaro.** Il PO chiedeva «poche mosse e molte eliminazioni». Nella
Torre le due cose non stanno insieme: le griglie partono vuote salvo i massi, quindi le
prime mosse servono a riempire. Con 5 mosse si arriva al massimo a 2 eliminazioni; i
livelli con più eliminazioni ne chiedono 15-16, cioè oltre 25 secondi di sole mosse, e
non starebbero nei 30 secondi insieme alla mappa. Le eliminazioni grosse il video le
mostra nella partita libera (Intreccio da quattro gruppi).

La ricerca non è rifatta a ogni generazione: lo script tiene `LIVELLO = 115` e
`SEME_LIVELLO = 1090`, e verifica in Node che il seme vinca prima di registrare (se no si
ferma con un errore). L'intestazione dello script riporta la ricerca e il risultato.

Il giocatore ripreso ha superato 114 livelli (tutto il Ponte e i primi 14 della Torre),
con i gettoni coerenti (22 riscossi, 2 tenuti), come nelle schermate dello store (che si
fermano al 113).

## Misure (ultima generazione, 4 novembre 2026, in questo container)

Uscita dello script:

```
780x1688 a 30 fotogrammi al secondo, durata 86.8s, 3850 fotogrammi catturati
(0 scartati perche' non a piena misura), pausa piu' lunga fra due fotogrammi 3539 ms
(a 72.0s del video: ...)
Fotogrammi diversi arrivati dal browser dentro i tratti: 3747, cioe' 43.2 al secondo
Livello 115 superato in 5 mosse; la vittoria compare a 24.7s (dentro i primi 30 secondi)
Livello 115: gruppi chiusi mossa per mossa 0, 0, 0, 1, 2
Partita libera: gruppi chiusi mossa per mossa 4, 1, 1, 0, 0, 0, 1
Nessun errore nella pagina.
```

- **Durata**: 86,8 s secondo lo script; l'ffmpeg di Playwright, rileggendo il file, dice
  `Duration: 00:01:26.83`. Flusso: `vp8, yuv420p, 780x1688, 30 fps`. File di circa 26 MB.
- **Fotogrammi al secondo**: il file è a 30 fissi; il browser ne ha mandati 43,2 diversi
  al secondo in media dentro i tratti, quindi nelle animazioni non se ne perdono.
- **Pausa più lunga** fra due fotogrammi del browser: 3,5 s, a 72 s, cioè sulle
  statistiche, che sono una schermata ferma (il browser non manda niente se niente
  cambia). Non è un blocco della registrazione.
- **Fotogrammi guardati** sul video finale (estratti con l'ffmpeg di Playwright e messi
  in un foglio): 0,5, 4, 5,5, 11, 13,5, 23,3, 24,2, 26, 29, 30,6, 40,8, 41,2, 41,6, 45, 52,
  60, 73, 80, 86,5 s. Nessuna schermata vuota o nera. A 4 s la scheda «La Torre» aperta sul
  115, a 5,5 s «Il Ponte» con 100 di 100, a 11 s l'apertura con i massi spiegati, a 13,5 s
  la griglia con i nove massi, a 23,3 s «INTRECCIO ×2!», a 24,2 s la griglia con i soli
  massi e la scritta della griglia vuota, a 26 s «Livello superato!», a 29 s la mappa con
  il 116 di turno, a 30,6 s il passo 1 della guida, a 40,8 s il passo 6, a 41,6 s la home
  «Livello 116». I due tagli (30,4 s e 41,3 s) passano da una schermata intera a
  un'altra intera. Le generazioni precedenti, guardate allo stesso modo, hanno portato
  alla correzione del taglio dopo la guida (sopra).

### Un difetto trovato nel gioco (non corretto: `src/` non si tocca da qui)

Ogni generazione stampa quattro volte l'avviso di React in sviluppo «Encountered two
children with the same key, `5`», da `Plancia`. La causa, letta nel codice:
`src/ui/Plancia.jsx:135` monta il lampo dello svuotamento con `key={svuotata}`, e
`svuotata` è il numero della mossa (`src/feel/useEffettiMossa.js:266`,
`setSvuotata(lastMove.moveNumber)`). Le caselle, fratelle del lampo nello stesso
contenitore, hanno `key={i}` da 0 a 80 (`Plancia.jsx:64`). Quindi **ogni volta che la
griglia si svuota a una mossa fra la 0 e la 80**, il lampo ha la stessa chiave di una
casella. Qui succede alla quinta mossa del 115 (restano solo i massi, che per la regola
contano come griglia vuota).

Effetto per il giocatore: non posso confermarlo. React avverte solo in sviluppo, e dice
che con chiavi doppie gli elementi «possono essere duplicati o omessi». Nei fotogrammi
del video non vedo né caselle mancanti né lampi doppi. La correzione ovvia sarebbe una
chiave che non può coincidere (per esempio `` key={`lampo${svuotata}`} ``), da decidere
e provare sul ramo giusto: segnalo, non tocco.

Lo script ora separa gli **avvisi di React** (stampati, non fermano) dagli **errori veri**
della pagina (eccezioni ed errori della console, che fanno uscire con codice 1).

## Comando per rifarlo

```bash
# nessun vite vecchio acceso: lo script ne avvia uno suo se la 5173 non risponde
npm run video
# uscita: store/video/plinto-montaggio.webm
```

Variabili facoltative, già presenti prima: `PLINTO_CHROMIUM` (percorso del browser; senza,
lo script prova `/opt/pw-browsers/chromium`), `PLINTO_FFMPEG` (senza, l'ffmpeg di
Playwright in `/opt/pw-browsers/ffmpeg-1011/`), `PLINTO_VIDEO_DENSITA` (2 di serie),
`PLINTO_E2E_URL`. In questo container è servito solo `npm run video`, così com'è: circa
1 min 40 s.

Le mosse sono le stesse a ogni generazione (semi fissi: livello 115 seme 1090, partita
libera seme 17671). Variano di qualche decimo i tempi, perché sono pause vere, e la Sfida
del giorno, che cambia ogni giorno (le sue mosse le sceglie il browser con la stessa
regola).

## La conversione in MP4 H.264 per YouTube (proposta, non aggiunta)

L'ffmpeg di Playwright scrive solo VP8/WebM. Proposta: il pacchetto npm
**`ffmpeg-static`** (espone il percorso di un binario ffmpeg), usato **solo come
strumento**, installato **fuori dal progetto**, senza toccare `package.json`:

```bash
npm install --prefix /tmp/conv ffmpeg-static
"$(node -e "process.stdout.write(require('/tmp/conv/node_modules/ffmpeg-static'))")" \
  -i store/video/plinto-montaggio.webm -c:v libx264 -preset slow -crf 18 \
  -pix_fmt yuv420p -movflags +faststart store/video/plinto-montaggio.mp4
```

oppure lo stesso comando con un ffmpeg di sistema (`apt install ffmpeg`,
`brew install ffmpeg`).

**Non posso confermarlo**: in questo container l'installazione di `ffmpeg-static` è
stata bloccata dai permessi della sessione, e anche l'elenco dei codificatori dell'ffmpeg
di Playwright. Non ho verificato che il binario di `ffmpeg-static` contenga `libx264`, né
che il comando sopra giri. Va provato su una macchina dove si può installare, e il
risultato va guardato prima del caricamento.

## Gate

| Controllo | Esito |
|---|---|
| `npm test` | 51 file, 704 test, tutti verdi (21 s) |
| `npm run build` | riuscita |
| `npm run video` | uscita 0, «Nessun errore nella pagina», 4 avvisi di React (vedi sopra) |
| controlli di `tools/verifica-tutto.mjs` sugli strumenti dello store | **nessuno**: il gate non registra né `video` né `schermate` (cercato «store», «scheda», «video» nel file) |

`npm run verifica` completo non l'ho lanciato: questo ramo tocca solo uno strumento e due
documenti, e nessun controllo del gate esegue `tools/video-store.mjs`.

## Che cosa non ho potuto verificare

- **Non posso confermarlo**: come la Play Console e YouTube mostrino davvero questo
  video (Short o no, taglio dell'anteprima, i 30 secondi che partono da soli). Non ho
  accesso né all'una né all'altro.
- **Non posso confermarlo**: la conversione in H.264 (vedi sopra).
- **Non posso confermarlo**: l'effetto del difetto delle chiavi doppie in produzione.
- Il video l'ho guardato **solo a fotogrammi** (19 istanti sul file finale), non
  riprodotto: la fluidità vista da un occhio umano la giudica chi lo guarda intero.
- I tempi dipendono dalla macchina: su un'altra generazione la vittoria può spostarsi di
  qualche decimo. Lo script stampa a che secondo compare e se è dentro i 30.
