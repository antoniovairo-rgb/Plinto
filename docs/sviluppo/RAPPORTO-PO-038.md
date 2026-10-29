# Rapporto PO-038 — pausa sulla plancia a fine partita

Figlia, 29 ottobre 2026, ramo `po038-fine-partita` (da `origin/main` a `d21d72a`, 1.21.27).
Niente su `main`, nessun cambio di versione, `android/` non toccato.
Fonti: ultime righe di `docs/DECISIONI.md` (29 ottobre, PO-038), `docs/sviluppo/RAPPORTO-PO-037.md`.
Chromium di prova: `/opt/pw-browsers/chromium`, headless su Linux.

## In breve

| richiesta del PO | fatto | come si prova |
|---|---|---|
| pausa ~1,5 s sulla plancia a fine partita (libera, sfida, livello vinto, livello perso) | **sì**, `DURATA_PAUSA_FINE = 1500` | `npm run e2e` passo 8, `npm run e2e-quadri` passi 3, 3d, 8 |
| ultima mossa, eliminazioni e punti visibili | **sì**: la plancia resta montata, effetti e punti volanti girano | schermate in `docs/sviluppo/po038/` |
| «Nessun pezzo entra» / «No piece fits» e pezzi spenti se nessun pezzo entra | **sì**, nella riga sotto la griglia; i pezzi spenti c'erano già (`pl-tray__posto--morto`), solo non si vedevano | idem |
| poi il risultato da solo | **sì** | misurato 1561–1713 ms dall'ultima mossa (tempo di Playwright compreso) |
| un tocco ovunque porta subito al risultato | **sì** (17–40 ms) | passo 8 |
| niente mosse, trascinamenti, menu, attrezzi durante la pausa | **sì**: velo trasparente su tutta la schermata; tocco su «Menu» → risultato, menu non aperto | passo 8 |
| Indietro di Android | va al **risultato** (scelta 2) | passo 8 |
| Invio / Spazio / Esc | portano al risultato | passo 8 |
| animazioni spente: pausa uguale, senza effetti, non più lunga | **sì**: 1565–1568 ms contro 1570–1618 ms con le animazioni | passo 8 (tetto: +200 ms) |
| festa finale e fine dell'atto | funzionano | `e2e-trionfo` verde |
| lettori di schermo | scritta e punteggio finale nell'annuncio esistente (`Annunci`, `role="status"`) | passo 8 legge il testo dell'annuncio |
| ricaricando nella pausa non si trova una partita viva | **sì** per libera e livello; per la sfida vedi E1 (difetto **già presente** sul risultato) | passo 8 |

Interruttore: `export const PAUSA_SULLA_PLANCIA = true;` in `src/ui/App.jsx` (con commento).

## Misura prima di correggere (1.21.27, codice di `origin/main`)

Passo 8 nuovo di `npm run e2e`, eseguito prima di toccare il gioco:

- 250 ms dopo l'ultima mossa: risultato **già a schermo**, plancia 0, pezzi 0, nessuna scritta,
  annuncio vuoto (in tutte e tre le partite: libera, libera senza animazioni, sfida).
- Ricarica sul risultato della **libera**: home, salvataggio e posto assenti.
- Ricarica sul risultato della **sfida**: plancia 1, salvataggio presente con punteggio 0 e 0 mosse,
  ancora `#/sfida/2026-10-29`: una **sfida nuova, viva, da zero** (E1).
- Vibrazioni registrate dopo l'ultima mossa (build di produzione, `navigator.vibrate` sostituito):
  **nessuna** (`[]`). Sul ramo: `["8","90"]`, cioè l'appoggio e la fine partita. Il disegno del
  risultato smontava `SchermoGioco` nello stesso istante, e `useEffettiMossa` non girava per l'ultima
  mossa (`src/feel/useEffettiMossa.js:120-121`: suono e vibrazione di fine partita a 420 ms).
  Il **suono** usa lo stesso timer ma non l'ho misurato: «Non posso confermarlo» con una misura.

## Che cosa cambia nel codice

- `src/ui/App.jsx`: `PAUSA_SULLA_PLANCIA`, `DURATA_PAUSA_FINE`. La fine «in corso» è la partita
  finita (libera/sfida) o `quadri.esito`; `fineMostrata` è quella di cui si è già passati al
  risultato. Finché differiscono si disegna `SchermoGioco` con `fine={{ nessunoEntra, onAvanti }}`.
  Un timer passa al risultato dopo 1500 ms. La pausa conta un gradino in `useTastoIndietro`
  (come il menu) e `passoIndietro` la chiude per prima.
- `src/ui/SchermoGioco.jsx`: prop `fine`. I tasti della partita tacciono (anche al livello vinto, che
  per il motore resta `playing`), il trascinamento è spento, la riga sotto la griglia mostra solo
  «Nessun pezzo entra» (o niente), un velo trasparente `.pl-pausa-fine` prende i tocchi; il tocco
  conta solo se **comincia** sul velo (il dito dell'ultimo pezzo non salta la pausa). Invio, Spazio,
  Esc in cattura con `preventDefault`, ripetizioni ignorate. L'annuncio aggiunge la scritta e
  «Punteggio N».
- `src/styles/app.css`: `.pl-nessuno-entra` (15 px, `--pl-text`, comparsa breve, ferma con le
  animazioni spente o `prefers-reduced-motion`), `.pl-pausa-fine`.
- `src/i18n/it.js`, `en.js`: `fine.nessunoEntra`, `aiuto.fine`.
- `src/ui/schermate/ComeSiGioca.jsx`: una frase sulla pausa (scelta 4).
- Salvataggio **invariato**: la partita si registra e si toglie dalla ripresa quando finisce
  (`usePartita.js`, `useQuadro.js`), non quando finisce la pausa.

## Rosso / verde

Interruttore spento e riacceso con la stessa `sed`
(`s/^export const PAUSA_SULLA_PLANCIA = true;/... = false;/` e ritorno):

| prova | spento | acceso |
|---|---|---|
| `npm run e2e` | rosso, **24** problemi PO-038, nessun altro | verde |
| `npm run e2e-quadri` | rosso, **10** problemi PO-038 + il noto 2 px | solo il noto 2 px |

Prove adeguate perché aspettino l'esito come **elemento** (niente attese fisse): `trionfo`,
`recensione`, `schermi`, `ripresa-livello` (PO-008), `resistenza`, `incitamenti`, `tutti-i-livelli`,
e il passo 6 di `partita`. Gli strumenti fuori dal gate (`tools/schermate.mjs`,
`sonda-fine-livello.mjs`, `video-store.mjs`) aspettano già con tempi di 4–8 s e non li ho toccati.

## Gate

`npm run verifica -- --veloce` (qui **negata** dal gate stesso: nessun giro completo registrato su
questa macchina e cambiati file che decidono il gioco, quindi giro completo): **33 controlli in
2680 s, 31 verdi, 2 rossi**. Cento livelli giocati nell'app: **100/100 vinti** (551 s). Rossi:
`livelli nel browser (vittoria e sconfitta)` («FINE LIVELLO (vittoria): a 320x700 bisogna scorrere
di 2 px») e `Play Store: invito a recensire` («a 360x640 l invito finisce 10px sotto la barra»).
Prima anche `npm run build` e `npm test` (45 file, 655 test) verdi, dentro il gate e da soli.

I due rossi «del font» (`docs/TESTING.md`): verificati **anche sulla base** `origin/main`, build di
produzione servita a parte: `e2e-quadri` «a 320x700 bisogna scorrere di 2 px», `recensione` «a
360x640 l'invito finisce 10px sotto la barra». Non vengono da questo ramo.

## Il tocco e il fling di PO-037

PO-037: dopo trascinamenti veloci Chromium può sopprimere il `click` del primo tocco. Il velo
della pausa non usa `click` ma `pointerdown`/`pointerup`. Misurato col tocco emulato (CDP,
`isMobile`, 360x640), livello 1 vinto col dito «frettoloso» come in `tools/sonda-fine-livello.mjs`,
tocco al centro della griglia: pausa saltata **4 su 4** a 300, 700 e 1100 ms dall'ultimo distacco
(12 su 12; sonda in `scratchpad`, non versionata).
`tools/sonda-fine-livello.mjs` (primo tocco su «Torna ai livelli», 500/1000/1500 ms dopo l'esito,
4 giri): **0 persi su 12 sia sulla base sia sul ramo**. Oggi il difetto di PO-037 qui non si
riproduce nemmeno sulla base, quindi non posso dire se la pausa lo attenua: «Non posso
confermarlo».

## Schermate

`docs/sviluppo/po038/`, build di produzione, `prima-*` = `origin/main`, `dopo-*` = ramo; per ogni
formato (360x640, 640x360) e caso (libera; livello 1 perso perché nessun pezzo entra):
`-0-prima-della-mossa`, `-1-dopo-600ms` (prima: già il risultato; dopo: la pausa con «Nessun pezzo
entra»), `-2-dopo-2200ms` (il risultato).

## Testo per il changelog (it)

> **Fine partita: un momento sulla griglia prima del risultato** (PO-038). Un giocatore ci ha scritto
> che, finita la partita, si saltava subito al risultato: «sfugge il numero raggiunto», e non si
> capiva perché fosse finita. Adesso la griglia resta ferma circa un secondo e mezzo: si vedono
> l'ultima mossa e i punti; se nessun pezzo entra, i pezzi in mano si spengono e sotto la griglia
> compare «Nessun pezzo entra». Poi il risultato arriva da solo; un tocco, Invio, Esc o Indietro
> ci portano subito. Vale per partita libera, sfida e livelli. Misurato: prima il risultato era a
> schermo 250 ms dopo l'ultima mossa, ora arriva dopo 1,5 s (uguale con le animazioni spente).
> L'ultima mossa ora fa anche la sua vibrazione e quella di fine partita, che prima si perdevano.

## Scelte aperte (la consigliata per prima, ed è quella fatta)

1. **Dove sta la scritta.** A: nella riga sotto la griglia, fra la griglia e i pezzi spenti (fatta:
   non copre niente, l'altezza è già riservata). B: al posto del nome della modalità/obiettivo, sopra
   la griglia (copre l'obiettivo, che a livello perso serve). C: un cartello sopra i pezzi (copre
   proprio i pezzi che spiegano il perché).
2. **Indietro nella pausa.** A: al risultato, come un tocco (fatta: la pausa esiste per far leggere
   il numero, e il risultato è dove lo si legge con calma). B: alla home (il record è già salvato,
   ma si salta il risultato). C: ignorato fino alla fine della pausa (sembra un tasto rotto).
3. **E1 — ricarica sulla sfida finita.** Misurato sulla base e sul ramo: ricaricando (anche dal
   risultato, da prima di PO-038) l'ancora `#/sfida/<giorno>` apre una sfida **nuova da zero** dello
   stesso giorno. A: lasciare com'è in questo ramo (fatta: il PO ha chiesto il salvataggio invariato,
   e la pausa non lo peggiora). B: togliere l'ancora quando la sfida finisce (ricaricando → home, come
   la libera); voce nuova. C: ricordare il risultato per mostrarlo dopo la ricarica (oggi non lo fa
   nessuna partita: «trovare il risultato» dopo la ricarica non succede nemmeno sulla libera, si
   trova la home).
4. **Aiuto.** A: una frase in «Come si gioca» (fatta, regola del proprietario sulle novità che si
   sentono; la scritta è presa dalla sua chiave). B: niente, la regola «la partita finisce quando
   nessun pezzo entra» c'era già.
5. **Durata.** A: 1500 ms (fatta, decisione del PO). B: 1750 ms, perché la frase di incitamento di
   un'ultima mossa dura 480 + 1250 = 1730 ms (`src/feel/durate.js`) e oggi perde gli ultimi 230 ms.
6. **Livello perso per le mosse finite.** A: nessuna scritta (fatta: non chiesta; il contatore
   delle mosse a 0 si vede). B: «Mosse finite» nella stessa riga.
7. Nota, non una scelta: `CLAUDE.md` dice «28 file Vitest», oggi sono **45** (655 test). Non l'ho
   corretto: non è di questo ramo.
