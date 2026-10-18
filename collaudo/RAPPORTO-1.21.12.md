# Rapporto di collaudo — PLINTO 1.21.12 (PO-001 / PO-008)

Data: 18 ottobre 2026. Sito: https://antoniovairo-rgb.github.io/Plinto/ — commit `f0d659a`.
Ramo: `collaudo-1.21.12` (da `f0d659a`, cioè `main`). Il codice del gioco non è stato toccato.

**Versione servita.** `assets/index-DjXsbOPd.js` contiene la stringa `1.21.12` 4 volte e nessun'altra `1.21.1x`; la home mostra «1.21.12» (R0).

## Riepilogo

| Gravità | Difetti |
|---|---|
| Alta | — |
| Media | **I1** |
| Bassa | — |

Un solo difetto, **non introdotto dalla 1.21.12** (presente anche nella 1.21.11, `15d9504`). Le due correzioni della 1.21.12 (H1, H2) sono riconfermate in produzione. Nessun errore di pagina in nessuna prova (`errori di pagina: 0`, it e en).

## Difetti

### I1 — Dopo «Nuova partita» dal menu di una sfida, un ricaricamento riapre la SFIDA e non la libera in corso
- **Gravità:** media (colpisce proprio lo scenario di PO-008: app in secondo piano → pagina ricaricata dalla TWA → la partita che il giocatore stava giocando non è quella che trova).
- **Dove:** menu della partita dentro una sfida → «Nuova partita» (o, con una libera a metà, «Riprendi la partita»).
- **Riproduzione:** `node collaudo/sonda-indirizzo-1.21.12.mjs` (produzione). Passi: apri la Sfida del giorno, 4 mosse → menu → «Nuova partita» → 2 mosse sulla libera → ricarica.
- **Atteso:** dopo il ricaricamento si ritrova la libera (punteggio 4).
- **Ottenuto:** si ritrova la sfida (punteggio 9). Misure:
  ```
  2. in LIBERA nuova  PUNTEGGIO 4 | hash #/sfida/2026-10-18
     salvate [libera, sfida]: ["LIBERA punti=4 mosse=2","2026-10-18 punti=9 mosse=3"]
  3. dopo RELOAD      PUNTEGGIO 9 | hash #/sfida/2026-10-18
  ```
  Stesso comportamento sulla 1.21.11 (`collaudo/uscita-i1-1.21.11.txt`: dopo reload punteggio 9). Anche con «Riprendi la partita» scelto nella domanda di H1 l'indirizzo resta quello della sfida (`collaudo/uscita-sonde.txt`, S1). La libera non va persa: è nel salvataggio (`plinto:partita`), ma il giocatore non la vede finché non esce e la riprende dalla home.
- **Prova:** `collaudo/uscita-i1.txt`, `collaudo/uscita-i1-1.21.11.txt`, screenshot `collaudo/schermate/i1-dopo-reload-it.png`.
- **Ipotesi (non provata con una correzione):** `avviaNuovaLibera` (`src/ui/App.jsx:198-203`) e `onTorna` di `iniziaNuova` (`src/ui/App.jsx:185-188`) non chiamano `scriviRotta('')`; l'indirizzo viene ripulito solo in `tornaAllaHome` (`App.jsx:312`). Al caricamento l'effetto sulla rotta (`App.jsx`, «useEffect … rotta.nome !== 'sfida'») apre la sfida, e vince sulla ripresa (`if (rotta && rotta.nome === 'sfida') return;`).
- **Opzioni:**
  1. **(consigliata)** Ripulire l'indirizzo in `avviaNuovaLibera` e quando «Riprendi la partita» porta a una libera. Il giocatore non vede niente di nuovo: ritrova la partita che stava giocando.
  2. Far sì che il menu «Nuova partita» dentro una sfida non esista (o riporti alla home). **Cambia ciò che il giocatore vede** (sparisce una voce di menu): serve decisione del PO.
  3. Ripulire l'indirizzo e salvare «ripresa = libera» a ogni mossa: più ampio, tocca il meccanismo di ripresa di PO-008; sconsigliata.

## Riconferme in produzione (1.21.12)

Misure da `collaudo/uscita-it.txt` e `collaudo/uscita-en.txt` (24 OK, 0 KO ciascuno), screenshot in `collaudo/schermate/`.

| Controllo | Italiano | Inglese |
|---|---|---|
| H1 libera a metà → nuova libera da **home, menu, profilo, statistiche** | domanda «La partita libera è a metà. Se inizi una nuova partita, perdi le mosse fatte in quella a metà.» con «Riprendi la partita» / «Nuova partita»; fuoco su «Riprendi la partita» | «Your free game is in progress. If you start a new game, you lose the moves you made in this one.» «Resume game» / «New game»; fuoco su «Resume game» |
| Indietro con la domanda aperta | la chiude, resta dov'era (4 strade su 4) | idem |
| «Riprendi la partita» dalla home | stessa partita (`PUNTEGGIO 4` = `4`) | idem (`SCORE 3` = `3`) |
| Libera finita (portata a fine con il motore vero, 14 / 17 mosse) | salvataggio libera = `null`; «Gioca ancora» → nessuna domanda, nuova partita | idem |
| Home dopo libera finita | nessun link «Nuova partita libera» (0), nessuna domanda | idem |
| Libera a 0 mosse → «Nuova partita libera» | nessuna domanda, parte la partita | idem |
| H2 home 320x700 | `scrollHeight 700 = innerHeight 700`, `scrollWidth 320` | idem |
| H2 fine livello 1 a 320x700 | `scrollHeight 700`, scroll interno 0, fondo dei pulsanti a 680 px | — |
| Ripresa: ricarica / background simulato 3 s (visibilitychange + pagehide) | partita invariata | invariata |
| Indietro dalla partita | porta in home, indirizzo ripulito | idem |

Nota sul testo inglese: «Your free game is in progress» e «Resume game» sono nuovi in en; non ho rilevato testi non tradotti nelle schermate controllate.

## Menu «Nuova partita» dentro una sfida (punto 3)
- Senza libera a metà: nessuna domanda; parte una libera nuova; la sfida resta salvata (`mosse 1` prima e dopo). Menu: «Torna alla partita», «Nuova partita», «Torna alla home».
- Con libera a metà: compare la domanda di H1; «Riprendi la partita» porta alla libera (non alla sfida) e la sfida resta salvata. In home le due card dicono entrambe «Riprendi ›». Il comportamento è coerente con il codice (`iniziaNuova`, `App.jsx:173-196`), a parte I1.
- Osservazione, non difetto: dentro una sfida la domanda parla di «partita libera» e non nomina la sfida che si sta lasciando. **Non posso confermare** se per il PO sia un problema; è una scelta di testo.

## Non verificato
- **H2 con l'atto davvero chiuso**: ho provato il fine livello 1 a 320x700, non il livello che chiude un atto (la sonda S3 non lo raggiunge). Il caso con l'atto chiuso è nei test del repository, che non ho rieseguito.
- Festa finale (H1 da «Gioca in partita libera»): non rieseguita da me; è nel caso N di `tests/e2e/ripresa-livello.mjs`.
- Android/TWA reale, background di sistema vero (freeze/kill): ho simulato visibilitychange/pagehide e ricaricamento, non un'app Android.
- Font del container: nessuna prova rossa, quindi nessun confronto necessario oltre I1.
- `npm run verifica` non lanciato (come richiesto).
- Archivio sfide e altri formati/lingue oltre 390x844 e 320x700: non esplorati.
- Rimasto un file vuoto-innocuo `/b.js` nella radice del container (mio scarto di un download di prova); non incide sul repository.

## Come rieseguire
```
node collaudo/collaudo-1.21.12.mjs it   # e: en
node collaudo/sonde-1.21.12.mjs
node collaudo/sonda-indirizzo-1.21.12.mjs
```
(`PLINTO_E2E_URL` cambia il sito provato.)

## Commit
Vedi `git log collaudo-1.21.12`; hash nell'ultima riga della risposta di consegna.
