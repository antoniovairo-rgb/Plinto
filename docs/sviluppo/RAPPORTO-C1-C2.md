# Rapporto C1 e C2 (collaudo 1.21.7) — ramo `sviluppo/c1-c2-1.21.8`

Partenza: `rilascio/1.21.8` a `4dc0d4d` (contiene B6, B7, B11 e `docs/DECISIONI.md`).
Versione in `package.json` non toccata (dice ancora 1.21.7), CHANGELOG e ROADMAP non toccati, nulla pubblicato.
`npm run verifica` completo **non** lanciato (lo fa la madre).

| Difetto | Riprodotto | Corretto | Interruttore | Controllo | Rosso a interruttore spento |
|---|---|---|---|---|---|
| C1 home scorre 2 px a 360x640 | sì, sviluppo e produzione | sì | `HOME_STRETTA_COMPATTA` in `src/main.jsx` | `npm run correzioni` (C1) | sì, sviluppo e produzione |
| C2 «NaN» da sfide importate guaste | sì, unitari ed e2e | sì | `VOCI_GUASTE_SCARTATE` in `src/persistence/salvataggio.js` | `tests/salvataggio.test.js` + `npm run correzioni` (C2) | sì, unitari, sviluppo e produzione |

## C1 — la home scorre di 2 px a 360x640

### Misura prima (sviluppo, `npx vite` su 5173, codice di `rilascio/1.21.8`)

Script di misura in Playwright (non versionato), Chromium `/opt/pw-browsers/chromium-1194`. Font di ripiego del container: `fc-match sans-serif` → `Inter`.

```
360x640        {"scorre":2,"scrollH":642,"clientH":640,"pie":32,"testata":68,"azioni":312,"link":[27,27]}
360x640 DejaVu {"scorre":0,"scrollH":640,"clientH":640,"pie":30,"testata":68,"azioni":312,"link":[26,26]}
390x844        {"scorre":0,...,"pie":17,...}
412x915        {"scorre":0,...,"pie":17,...}
```

I figli di `.pl-home` a 360x640: padding 16, testata 68, azioni 312, menu 152, piede 32, padding 16, più tre spazi da 15,36 px (`gap: clamp(8px, 2.4vh, 30px)` della regola `max-height: 680px`): 16+68+312+152+32+16+3×15,36 = 642,08. **Confermato**: a 360 px il piede va a capo su due righe (32 px invece di 17).

Perché dipende dal font (misurato forzando il font su tutta la pagina, codice senza correzione):

```
font            reale scorre/piede
Inter           2/32
DejaVu Sans     0/30
Liberation Sans 0/30
FreeSans        0/16   (non va a capo)
Carlito         0/16
Caladea         0/16
DejaVu Serif    0/30
```

Con Inter ogni riga del piede è alta 16 px, con DejaVu 15: da qui i 2 px che ci sono in un container e non in un altro.

### Correzione

`src/styles/app.css`, subito dopo la regola `max-height: 680px`:

```css
@media (max-width: 380px) and (max-height: 680px) and (orientation: portrait) {
  :root.pl-home-stretta .pl-home__pie { margin-top: -4px; }
}
```

4 px tolti dallo spazio **sopra** il piede, non dai collegamenti: la loro altezza toccabile resta 27 px (B10 chiede ≥ 24). Telefoni più alti di 680 o più larghi di 380: nessun cambiamento (la regola non si applica; misurato 390x844 e 412x915 invariati, `npm run impaginazione` tutto «ok»).

### Interruttore

`src/main.jsx`: `const HOME_STRETTA_COMPATTA = true;` aggiunge la classe `pl-home-stretta` a `<html>` prima del primo disegno. Senza la classe la regola CSS non vale.

### Il controllo, e come è rosso in qualunque container

`tests/e2e/correzioni.mjs`, blocco C1, a 360x640:

1. misura reale: `.pl-home` non deve scorrere;
2. **caso peggiore fabbricato**: interlinea fissa `1.21` su tutta la home (è quella che Inter dà al piede, 16 px su 12 px di corpo), così le altezze non dipendono più dal font; piede forzato su due righe inserendo un `<br>` dopo il primo collegamento. Con questo non deve scorrere;
3. autoprova: si toglie la classe `pl-home-stretta` dalla stessa pagina e la home **deve** scorrere, altrimenti «la prova non prova nulla»;
4. i collegamenti restano alti ≥ 24 px.

Misura del caso peggiore con otto font forzati su tutta la pagina:

```
                senza correzione   con correzione
predefinito     3 px               0
Inter           3                  0
DejaVu Sans     3                  0
Liberation Sans 3                  0
FreeSans        3                  0
Carlito         3                  0
Caladea         3                  0
DejaVu Serif    3                  0
```

Con l'interlinea fissata la scomparsa del font dal conto è misurata qui sopra (otto font, stesso risultato). **Non posso confermarlo** per un font che vada a capo in un punto diverso del titolo o dei pulsanti (cambierebbe il numero di righe, non l'interlinea): non ne ho trovato uno fra quelli installati.

### Prova rosso/verde

Sviluppo (`npm run correzioni`, server su 5173), interruttore acceso:

```
C1. home a 360x640 con il pie di pagina a capo: non scorre, con qualunque font...
   reale 0 px; caso peggiore (pie su 2 righe): 0 px; senza la correzione: 3 px; collegamenti 27, 27 px
Tutto a posto: le correzioni del collaudo tengono.
```

Sviluppo, `HOME_STRETTA_COMPATTA = false` (exit 1):

```
   reale 2 px; caso peggiore (pie su 2 righe): 3 px; senza la correzione: 3 px; collegamenti 27, 27 px
4 problemi:
 - B10: con il bersaglio piu grande la home scorre di 2 px a 360x640
 - C1: con il font di questo container la home scorre di 2 px a 360x640
 - C1: la radice non ha la classe pl-home-stretta (interruttore HOME_STRETTA_COMPATTA spento?)
 - C1: con il pie di pagina a capo la home scorre di 3 px a 360x640
```

Produzione (`npm run build`, `vite preview --port 4173`, `PLINTO_E2E_URL=http://127.0.0.1:4173/ node tests/e2e/correzioni.mjs`): stesso esito in tutti e due i sensi — acceso exit 0 «Tutto a posto», spento exit 1 con gli stessi quattro problemi e le stesse misure (2 / 3 / 3 px).

## C2 — «NaN» da sfide importate guaste

### Misura prima

Test unitari nuovi in `tests/salvataggio.test.js` («sfide e attrezzi guasti in un file importato (collaudo 1.21.7, C2)»), lanciati sul codice di `rilascio/1.21.8`:

```
× Unisci: restano solo i giorni con best e partite numerici
   → expected [ '2026-10-09', '2026-10-10', …(3) ] to deeply equal [ '2026-10-09', '2099-01-01' ]
× Sostituisci: restano solo i giorni con best e partite numerici
× registraSfida non scrive NaN partendo da una voce gia guasta
   → expected NaN to be 80
× degli attrezzi entrano solo interi non negativi
   → expected { versione: 1, disponibili: '2', …(1) } to be null
Tests  4 failed | 18 passed (22)
```

E2E (stesso file del caso «sfide strane» di `collaudo/import-fuzz.mjs`, più un giorno buono, incollato e «Sostituisci tutto»), correzione spenta:

```
 - C2: in Statistiche compare «NaN»: ... ULTIMI GIORNI 12 ott 210 (3) 10 ott NaN (undefined)
 - C2: in Archivio delle sfide compare «NaN»: ...
```

Causa (`src/persistence/salvataggio.js`, `ripulisci`): `soloNumeri` toglieva `best: '99'` e `partite: 'a'` ma teneva il giorno come `{ regole: null }`; Statistiche e Archivio leggevano `best`/`partite` indefiniti. `registraSfida` (`src/persistence/sfide.js`) partiva da quella voce: `Math.max(undefined, punteggio)` = `NaN`.

### Correzione

- `ripulisci`, sfide: un giorno entra solo se `best` **e** `partite` sono numeri finiti ≥ 0 (stesso `numeroBuono` già usato per i record). I giorni futuri **non** si scartano (`2099-01-01` resta, lo controlla il test).
- `ripulisci`, attrezzi (prima non passavano da qui): restano solo `disponibili` e `riscossi` interi ≥ 0, più `versione`; se nessuno dei due è valido il documento si scarta.
- `registraSfida`: `best` e `partite` non numerici della voce precedente valgono 0. Serve a chi ha già importato un file guasto con la 1.21.7: la prima partita di quel giorno ripara la voce.

### Interruttore

`export const VOCI_GUASTE_SCARTATE = true;` in `src/persistence/salvataggio.js`, importato anche da `sfide.js` (nessun ciclo: `salvataggio.js` non importa `sfide.js`).

### Prova rosso/verde

Unitari, `npx vitest run tests/salvataggio.test.js`:
- acceso: `Tests  22 passed (22)`;
- spento: `Tests  4 failed | 18 passed (22)` (i quattro test sopra). Il test «unendo, una voce guasta del file non rovina quella buona di qui» passa in tutti e due i casi: protegge un comportamento che c'era già.

E2E sviluppo e produzione (`npm run correzioni` e build + preview su 4173): acceso exit 0; spento exit 1 con i due «NaN» riportati sopra, identici nei due ambienti.

## Controlli di consegna (interruttori accesi, codice finale)

| Comando | Esito |
|---|---|
| `npm test` | `Test Files 42 passed (42)`, `Tests 629 passed (629)` |
| `npm run build` | `✓ built in 1.50s` |
| `npm run correzioni` | exit 0, «Tutto a posto: le correzioni del collaudo tengono.» (B1–B10, C1, C2) |
| `npm run impaginazione` | exit 0, «La home entra su tutti i formati provati, e nei livelli il tavolo non tocca i pezzi.» |
| `npm run e2e-salvataggio` | exit 0, «Nessun problema rilevato.» |
| build + preview + `correzioni` | exit 0 |

Il controllo C1 e C2 vive dentro `tests/e2e/correzioni.mjs`, già registrato nel gate (`npm run correzioni`): nessuna voce nuova in `tools/verifica-tutto.mjs`.

## File toccati

```
src/main.jsx                   interruttore C1 (classe pl-home-stretta sulla radice)
src/styles/app.css             regola C1 sotto 380x680
src/persistence/salvataggio.js interruttore C2, ripulisci per sfide e attrezzi
src/persistence/sfide.js       registraSfida non parte da numeri guasti
tests/salvataggio.test.js      5 test unitari C2
tests/e2e/correzioni.mjs       blocchi C1 e C2
docs/sviluppo/RAPPORTO-C1-C2.md
```

## Opzioni (le scelte restano alla madre / al PO)

**C1 — quanto margine.**
- (a) **consigliata, fatta**: 4 px sopra il piede, solo sotto 380x680. Nel caso peggiore fabbricato resta 1 px di margine (servono 3, ne do 4).
- (b) 6-8 px (per esempio anche `padding` della home 16 → 14 sotto 380x680): più margine per font con righe ancora più alte di Inter, a costo di una home un po' più stretta in verticale. Basta cambiare il valore in `app.css`.
- (c) interlinea fissa sul piede (`line-height` in px): toglie la dipendenza dal font alla radice, ma cambia l'aspetto su tutti i telefoni e non solo su quelli piccoli.

**C2 — attrezzi con `disponibili` oltre il massimo (3).** Il caso «attrezzi strani» del fuzz (`disponibili: 99`) è un intero valido e oggi passa.
- (a) **consigliata**: limitare a `MASSIMO` (`src/persistence/attrezzi.js`) in `ripulisci`; una riga, ma è una regola nuova sull'importazione, quindi non l'ho fatta senza decisione.
- (b) lasciare com'è: nessun NaN, solo un saldo gonfiato da chi modifica il file a mano.

**C2 — voci guaste già salvate** da chi ha importato con la 1.21.7.
- (a) **consigliata, fatta in parte**: `registraSfida` le ripara alla prima partita di quel giorno; restano visibili come «NaN» in Statistiche/Archivio finché non si rigioca quel giorno.
- (b) filtrare anche in lettura (`caricaSfide`): le nasconde subito, ma tocca un percorso usato da tutte le schermate. Non fatto: fuori da quanto deciso.

## Non verificato

- Su telefono vero (Roboto, Android) la misura di C1 non l'ho fatta: **non posso confermare** quanti px di margine restino lì.
- Il controllo C1 l'ho visto rosso solo in questo container, ma con otto font forzati su tutta la pagina; **non posso confermare** che sia rosso in un container in cui un font diverso faccia andare a capo il titolo o i pulsanti in punti diversi.
- La CI non l'ho fatta girare: il verdetto che conta è quello del gate della madre.
- In un passaggio ho usato un ciclo su `/proc/*/cmdline` per fermare `vite preview`: ha chiuso la mia stessa shell (il caso descritto in CLAUDE.md). Le misure riportate vengono dalle esecuzioni successive, con il PID preso direttamente.
- Fuzz del collaudo (`collaudo/import-fuzz.mjs` e `lib.mjs` presi da `origin/collaudo-1.21.7`, lanciati con `COLLAUDO_URL=http://127.0.0.1:5173/` sul codice corretto): **30 casi su 30 «ok»**, compresi `[Sostituisci tutto] sfide strane` e `[Unisci] sfide strane`, `attrezzi strani`, `attrezzi stringa`. La colonna del messaggio di quello script mostra lo stesso testo generico per ogni caso, quindi da quell'output da solo **non posso confermare** che ogni file sia stato davvero applicato; che l'importazione per incolla arrivi in fondo lo dimostra il blocco C2 di `correzioni` (il giorno buono da 210 punti compare).

## Commit

```
0075fdf C1: a 360x640 il pie' della home si avvicina al menu di 4 px
6ca49cb C2: importando si scartano sfide e attrezzi con numeri guasti
e63a3fa C1, C2: controlli in npm run correzioni
```
più il commit di questo rapporto.
