# Sistema di design di PLINTO

> Fotografia del **6 settembre 2026**, scritta leggendo `src/styles/tokens.css`,
> `src/styles/app.css`, i componenti di `src/ui/` e `public/`. I rapporti di contrasto
> sono calcolati sui valori esadecimali reali dei token; le misure in pixel della sezione 5
> sono state prese in un browser reale (Chromium, viewport 390x844 e 360x640) e non stimate.
> Dove una cosa non è implementata è scritto che non lo è.

La fonte di verità è `src/styles/tokens.css`. Questo documento la spiega: se i due
divergono, il file CSS ha ragione e il documento è da correggere.

## 1. Direzione artistica

**Minerale.** Le superfici sono opache come pietra levigata, non plastica lucida; i bordi
sono netti e i separatori sottili; l'unica luce della schermata viene dai blocchi, che sono
gli unici elementi saturi su un fondo che resta scuro e desaturato.

Su un punto la direzione è stata corretta dopo averla vista su schermo: **le sei famiglie
cromatiche dei blocchi erano smorzate anche loro**, coerenti con il resto ma spente. I blocchi
sono l'unica cosa colorata dell'interfaccia e devono cantare, quindi le sei tinte sono state
portate alla saturazione massima utile, scegliendo la luminosità in modo che ognuna resti
sopra 3:1 sul fondo della plancia **in entrambi i temi**. Il fondo resta minerale; i blocchi
no. La misura è nella sezione 3.

Ne discendono tre conseguenze concrete, verificabili nel CSS:

- **Nessun gradiente decorativo sui fondali.** I gradienti esistono in tre punti soltanto e
  hanno tutti una funzione: il pulsante primario (`.pl-btn--primario`), il riempimento della
  barra della Catena (`.pl-catena__riempimento`) e le linee dei quadranti, che sono gradienti
  usati come righelli e non come sfumature.
- **Rilievo per luce interna, non per ombre esterne.** Il blocco (`.pl-blocco`) non ha
  `box-shadow` esterna: ha due `inset`, una luce bianca al 28% sul bordo alto e un'ombra al
  22% sul bordo basso. È tutto il volume che il gioco si concede.
- **Il colore non ha regole.** Le sei famiglie cromatiche dei blocchi sono identità visiva
  del pezzo e nient'altro (`COLOR_COUNT = 6` in `src/config/rules.js`); nessuna meccanica le
  legge. Sono scelte distinte **per tonalità e per luminosità**, così restano separabili
  anche da chi non distingue bene i colori.

## 2. Token colore

Tutti i valori sono presi da `tokens.css`. Ogni colore usato nell'interfaccia deve venire da
qui. In `app.css` restano però tredici colori letterali (conteggio del 6 settembre 2026), ed è
onesto elencarli invece di dichiarare una regola che il file non rispetta del tutto:

- `#1a1405` (2 volte), il bruno quasi nero del testo sul giallo del marchio — pulsante
  primario e nastro "nuovo record" (10.92:1 su `--pl-brand`);
- `#fff` (2 volte), il pallino dell'interruttore e il testo del pulsante di pericolo;
- `#06231d` (1 volta), il verde quasi nero del numero di un livello completato, su `--pl-ok`;
- alcune `rgba()` di bianco o nero usate come velature: le due luci interne del blocco, ombra
  del pezzo trascinato, velo del menu, ombra del testo dei punti volanti, anello scuro dietro
  il cursore da tastiera, ombra del pannello. Non esistono token per l'opacità. Il segno della
  bomba **non è più fra queste**: dalla 0.2.3 passa dai token `--pl-bomba-*`.

Due velature che c'erano in una versione precedente — `rgba(242, 193, 78, …)`, cioè
`--pl-brand` ricopiato a mano in decimale — non ci sono più; la tinta delle celle libere,
che prima era un bianco trasparente scritto a mano, è diventata il token `--pl-cella-vuota`
proprio perché su fondo chiaro un velo bianco è invisibile.

### Tema scuro (predefinito, `:root`)

| Token | Valore | A cosa serve |
| --- | --- | --- |
| `--pl-ink` | `#0e1118` | fondo dell'app (`body`), e `theme-color` di `index.html` e del manifest |
| `--pl-ink-2` | `#131722` | fondo della plancia |
| `--pl-surface` | `#181d2a` | pannelli, liste, menu, bottone del menu nell'HUD, sfondo della barra Catena |
| `--pl-surface-2` | `#1f2534` | elementi rialzati: pulsanti normali, segmento attivo, numeri della presentazione |
| `--pl-line` | `#262d3f` | linee sottili, separatori a 1px fra le voci di lista, sfondo della leva spenta |
| `--pl-line-strong` | `#3a4460` | separatori dei nove quadranti 3x3 — la firma del tabellone |
| `--pl-cella-vuota` | `rgba(255,255,255,0.03)` | tinta delle celle libere e dei posti vuoti del tray |
| `--pl-text` | `#e9ecf4` | testo principale; anche il colore del blocco che sta esplodendo e dell'anello del cursore da tastiera |
| `--pl-text-dim` | `#98a0b5` | testo secondario: righe di dettaglio, record, pulsanti fantasma |
| `--pl-text-faint` | `#838ca1` | etichette maiuscole, note, suggerimenti, descrizioni degli interruttori |
| `--pl-brand` | `#f2c14e` | ottone: punteggio, logo, anello di focus, evidenziazione dei gruppi in chiusura, punti volanti |
| `--pl-brand-deep` | `#c9922a` | fondo del gradiente del pulsante primario |
| `--pl-danger` | `#ec6d8e` | bordo della mossa illegale, note di allarme, testo di allarme |
| `--pl-danger-fondo` | `#b81f47` | **fondo** dei comandi distruttivi, cioè `.pl-btn--pericolo` |
| `--pl-ok` | `#4cb5a5` | conferme: leva accesa, riga "extra" di fine partita, risultato dell'esempio nell'intro |
| `--pl-block-1` | `#ff6a2b` | arancio |
| `--pl-block-2` | `#12e1b0` | verde |
| `--pl-block-3` | `#9b4dff` | viola |
| `--pl-block-4` | `#ffc212` | oro |
| `--pl-block-5` | `#ff3d71` | rosa |
| `--pl-block-6` | `#2e97ff` | azzurro |

`--pl-danger` e `--pl-danger-fondo` sono due token distinti proprio perché servono due
mestieri diversi: uno è un colore di **testo** su fondo scuro, l'altro un colore di **fondo**
sotto testo bianco. Un solo token non può passare entrambe le soglie (vedi sezione 3).

I colori dei blocchi hanno un secondo uso oltre alla plancia: il gradiente della barra della
Catena va da `--pl-block-2` a `--pl-brand` a `--pl-block-1`, e i punti volanti delle mosse
migliori passano da `--pl-brand` a `--pl-block-2` (`eccellente`) e a `--pl-block-1`
(`perfetta`). Da quando i blocchi sono saturi, `--pl-block-2` **non** coincide più con
`--pl-ok`: erano lo stesso `#4cb5a5`, adesso sono due tinte diverse.

### Tema chiaro (`:root[data-theme='chiaro']`)

Si attiva **solo** su richiesta esplicita del giocatore (Impostazioni → Tema), mai in
automatico: `useImpostazioni` scrive l'attributo `data-theme` sull'elemento radice. Non
esiste nessuna regola `prefers-color-scheme` nel progetto, ed è deliberato — cambiare
l'aspetto del gioco mentre qualcuno sta giocando è peggio di ignorare la preferenza di
sistema.

| Token | Valore chiaro | Note |
| --- | --- | --- |
| `--pl-ink` | `#f3f4f8` | |
| `--pl-ink-2` | `#e9ebf2` | fondo della plancia |
| `--pl-surface` | `#ffffff` | |
| `--pl-surface-2` | `#f0f2f7` | |
| `--pl-line` | `#d8dce7` | |
| `--pl-line-strong` | `#a9b1c6` | |
| `--pl-text` | `#171b26` | |
| `--pl-text-dim` | `#4f586d` | |
| `--pl-text-faint` | `#60687a` | scurito rispetto al tema scuro (`#838ca1`) |
| `--pl-brand` | `#7f6628` | ottone scurito: sul chiaro il giallo del tema scuro era illeggibile |
| `--pl-brand-deep` | `#6d5622` | |
| `--pl-ok` | `#307469` | |
| `--pl-danger` | `#a54c64` | |
| `--pl-block-1` | `#d94500` | arancio |
| `--pl-block-2` | `#00926d` | verde |
| `--pl-block-3` | `#7a1fe0` | viola |
| `--pl-block-4` | `#9c7400` | oro |
| `--pl-block-5` | `#e00048` | rosa |
| `--pl-block-6` | `#0072d6` | azzurro |
| `--pl-cella-vuota` | `rgba(23,27,38,0.05)` | |
| `--pl-shadow-soft` | `0 2px 10px rgba(20,25,40,0.1)` | |
| `--pl-shadow-lift` | `0 12px 32px rgba(20,25,40,0.18)` | |

**Il tema chiaro è stato riscritto per intero.** La versione precedente ridefiniva solo
fondali e testi e lasciava accenti e blocchi del tema scuro: il risultato era un tema
inutilizzabile e mai misurato (il punteggio in ottone stava a 1.53:1 sul fondo e cinque
blocchi su sei sotto 3:1 sulla plancia). Adesso ridefinisce anche `--pl-brand`,
`--pl-brand-deep`, `--pl-ok`, `--pl-danger`, tutte e sei le famiglie cromatiche e
`--pl-cella-vuota`. La lezione, scritta anche nel commento di `tokens.css`: **un tema va
ridefinito per intero, oppure non va offerto.**

Restano del tema scuro, perché non sono ridefiniti nel blocco chiaro, i token dei tempi,
della geometria, della tipografia e `--pl-danger-fondo` (che regge il testo bianco in
entrambi i temi allo stesso rapporto).

### Ombre

| Token | Valore | Uso |
| --- | --- | --- |
| `--pl-shadow-soft` | `0 2px 10px rgba(0,0,0,0.35)` | plancia |
| `--pl-shadow-lift` | `0 12px 32px rgba(0,0,0,0.5)` | pulsante primario, pannello del menu |

## 3. Contrasti

Soglie WCAG 2.1 AA: **4.5:1** per il testo normale, **3:1** per il testo grande (≥ 18.66px
in grassetto o ≥ 24px) e per gli **elementi non testuali** che devono essere distinguibili
(bordi di controlli, grafica portatrice di informazione — i blocchi sulla plancia
rientrano qui).

Tutti i rapporti di questa sezione sono stati **ricalcolati il 6 settembre 2026** dai valori
esadecimali di `tokens.css`, con la formula WCAG 2.1 (verifica della funzione usata:
nero su bianco = 21.00, `#777` su bianco = 4.48). Coincidono con i numeri scritti nei
commenti di `tokens.css`, tranne dove è detto esplicitamente il contrario.

### Tema scuro: conforme

| Token | su `--pl-ink` (`#0e1118`) | su `--pl-surface-2` (`#1f2534`) | Esito |
| --- | --- | --- | --- |
| `--pl-text` `#e9ecf4` | **15.98** | **12.95** | AA e AAA |
| `--pl-text-dim` `#98a0b5` | **7.22** | **5.85** | AA |
| `--pl-text-faint` `#838ca1` | **5.60** | **4.54** | AA, con poco margine |
| `--pl-brand` `#f2c14e` | **11.25** | 9.12 | AA |
| `--pl-ok` `#4cb5a5` | 7.61 | 6.16 | AA |
| `--pl-danger` `#ec6d8e` | 6.42 | **5.21** | AA |
| `#fff` su `--pl-danger-fondo` `#b81f47` | — | **6.32** | AA |

`--pl-surface-2` è il fondo **più chiaro** dell'interfaccia scura, quindi è il caso peggiore:
se un testo passa lì, passa ovunque nel tema scuro.

Blocchi contro il fondo della plancia `--pl-ink-2` (`#131722`), soglia 3:1 per elementi non
testuali:

| Blocco | Valore | Contrasto |
| --- | --- | --- |
| arancio `--pl-block-1` | `#ff6a2b` | **6.26** |
| verde `--pl-block-2` | `#12e1b0` | **10.59** |
| viola `--pl-block-3` | `#9b4dff` | **4.18** |
| oro `--pl-block-4` | `#ffc212` | **11.06** |
| rosa `--pl-block-5` | `#ff3d71` | **5.25** |
| azzurro `--pl-block-6` | `#2e97ff` | **5.95** |

Il peggiore (viola, 4.18) supera comunque anche la soglia più severa per il testo normale.

### Tema chiaro: misurato sul fondo peggiore, e conforme

Il tema chiaro è stato ridefinito per intero e **misurato**, cosa che prima non era mai
successa. Le quattro superfici su cui può capitare del testo sono `--pl-surface` `#ffffff`,
`--pl-ink` `#f3f4f8`, `--pl-surface-2` `#f0f2f7` e `--pl-ink-2` `#e9ebf2`.

Il fondo di riferimento è **il più sfavorevole dei quattro**, cioè `--pl-ink-2`. Non è un
dettaglio di metodo: la prima stesura di questa tabella dichiarava i contrasti su `--pl-ink`,
il fondo più *favorevole*, e faceva così passare per conforme un token che sugli altri fondi
non lo era. Misurare sul caso migliore non è misurare.

| Elemento | su `--pl-surface` | su `--pl-ink` | su `--pl-surface-2` | su `--pl-ink-2` (riferimento) |
| --- | --- | --- | --- | --- |
| `--pl-text` `#171b26` | 17.20 | 15.65 | 15.35 | **14.44** |
| `--pl-text-dim` `#4f586d` | 7.12 | 6.48 | 6.36 | **5.98** |
| `--pl-text-faint` `#60687a` | 5.59 | 5.08 | 4.99 | **4.69** |
| `--pl-brand` `#7f6628` | 5.48 | 4.98 | 4.89 | **4.60** |
| `--pl-ok` `#307469` | 5.49 | 4.99 | 4.90 | **4.61** |
| `--pl-danger` `#a54c64` | 5.50 | 5.00 | 4.91 | **4.62** |
| `#fff` su `--pl-danger-fondo` `#b81f47` | — | — | — | **6.32** |

Tutti conformi ad AA (4.5:1) **sul fondo peggiore**, quindi conformi ovunque.

Blocchi contro la plancia chiara `--pl-ink-2` (`#e9ebf2`), soglia 3:1 perché sono elementi
grafici e non testo:

| Blocco | Valore chiaro | Contrasto |
| --- | --- | --- |
| arancio `--pl-block-1` | `#d94500` | **3.67** |
| verde `--pl-block-2` | `#00926d` | **3.31** |
| viola `--pl-block-3` | `#7a1fe0` | **5.69** |
| oro `--pl-block-4` | `#9c7400` | **3.59** |
| rosa `--pl-block-5` | `#e00048` | **4.14** |
| azzurro `--pl-block-6` | `#0072d6` | **4.03** |

**Tutti e sei passano.** Prima erano cinque su sei sotto soglia: è la correzione più
sostanziosa della palette.

**Come si rifanno questi numeri.** `npm run contrasti` (`tools/contrasti.mjs`) legge
`tokens.css`, ricalcola ogni riga di queste tabelle e termina con errore se anche un solo
valore scende sotto soglia; `tests/contrasti.test.js` lo esegue dentro `npm test`. Nessuno di
questi numeri va più copiato a mano, ed è deliberato: la stessa affermazione sbagliata — un
commento che dichiarava contrasti mai misurati — era già stata corretta una volta ed era
tornata. Un controllo automatico chiude la categoria; una correzione puntuale no.

### Le correzioni già fatte, e perché

Sono correzioni reali sul codice, non esempi didattici:

| Token | Valore precedente | Contrasto precedente | Valore attuale | Contrasto attuale |
| --- | --- | --- | --- | --- |
| `--pl-text-faint` (scuro) | `#626b83` | 3.55 su `--pl-ink`, **2.88** su `--pl-surface-2` → non conforme | `#838ca1` | 5.60 / 4.54 |
| `--pl-danger` (scuro) | `#e4587e` | **4.37** su `--pl-surface-2` → sotto soglia | `#ec6d8e` | 5.21 |
| fondo di `.pl-btn--pericolo` | `--pl-danger` | bianco sopra: **2.94** → non conforme | `--pl-danger-fondo` `#b81f47` | bianco sopra: **6.32** |
| blocchi (scuro) | tinte smorzate | il peggiore a 4.37 | tinte sature | il peggiore a 4.18 |
| blocchi (chiaro) | uguali allo scuro | **cinque su sei sotto 3:1** | sei tinte dedicate | il peggiore a 3.31 |
| `--pl-text-faint` (chiaro) | `#6b7488` | **3.94** sul fondo peggiore → sotto soglia, mentre il commento dichiarava 4.5 | `#60687a` | 4.69 |
| `--pl-brand` (chiaro) | `#876c2b` | 4.45 sul fondo peggiore → sotto soglia | `#7f6628` | 4.60 |
| `--pl-ok` (chiaro) | `#337b70` | 4.46 sul fondo peggiore → sotto soglia | `#307469` | 4.61 |
| `--pl-danger` (chiaro) | `#ae5069` | 4.25 sul fondo peggiore → sotto soglia | `#a54c64` | 4.62 |

Il pulsante di pericolo merita una riga in più: è quello che **cancella i dati del giocatore**,
ed era l'unico caso che falliva in entrambi i temi. La correzione non è stata schiarire il
testo ma **separare i due mestieri del colore**: `--pl-danger` resta il rosa che si legge su
fondo scuro, `--pl-danger-fondo` è il fondo che regge il bianco.

## 4. Tipografia

Due stack, entrambi di soli font di sistema:

| Token | Valore |
| --- | --- |
| `--pl-font` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif` |
| `--pl-font-num` | `ui-rounded, 'SF Pro Rounded', -apple-system, 'Segoe UI', Roboto, sans-serif` |

**Perché nessun font esterno.** È una scelta di privacy prima che di peso: un `<link>` a
Google Fonts è una richiesta HTTP verso un dominio di terzi a ogni apertura del gioco, cioè
un'occasione di tracciamento del giocatore. PLINTO non fa **nessuna** richiesta di rete
(vedi `docs/ASSET_LICENSES.md`), e la tipografia non è l'eccezione che rovina la regola. Il
guadagno secondario è che il testo si vede al primo fotogramma, senza sfarfallio da
caricamento del font.

Il costo va detto: `ui-rounded` e `SF Pro Rounded` esistono solo su piattaforme Apple.
Altrove `--pl-font-num` ricade sullo stesso font di `--pl-font`, quindi il carattere
"arrotondato" dei numeri è un di più su iOS/macOS e non un elemento su cui il design possa
contare.

**Come si ottiene comunque un aspetto caratterizzato**, senza un font disegnato apposta:

1. **Maiuscoletto e spaziatura fra lettere.** Ogni etichetta di servizio è
   `text-transform: uppercase` con `letter-spacing` fra `0.06em` e `0.22em`. Le etichette
   dell'HUD sono a `0.14em` su 10px, il logo a `0.22em` su 34px, il pulsante primario a
   `0.06em`. È la spaziatura, non il disegno delle lettere, a dare il tono.
2. **Contrasto di peso, non di famiglia.** Si usano solo tre pesi — 600 per i controlli, 700
   per i titoli di pagina, 800 per numeri e logo — e la gerarchia nasce dal salto fra 15px di
   testo e 30px (punteggio) o 60px (numero di fine partita).
3. **Cifre tabellari.** `font-variant-numeric: tabular-nums` su tutto ciò che è un numero che
   cambia: punteggio, record, moltiplicatore della Catena, righe di statistiche. Senza,
   il punteggio "balla" a ogni mossa perché le cifre hanno larghezze diverse.
4. **Formattazione localizzata dei numeri.** `toLocaleString('it-IT')` in HUD, Fine,
   Statistiche e Home. Da notare due incoerenze: la locale dei **numeri** è **fissa a
   `it-IT`** anche quando la lingua scelta è l'inglese, quindi un giocatore inglese legge
   `4.321` dove si aspetta `4,321`; le **date** dello storico delle sfide usano invece
   `toLocaleDateString()` senza argomenti, cioè la locale del browser. Due politiche diverse
   nello stesso schermo.

## 5. Geometria e spaziature

### Raggi

| Token | Valore | Uso |
| --- | --- | --- |
| `--pl-radius-cell` | `22%` | blocchi e celle. È una **percentuale**: il raggio scala con la cella, quindi la forma dei blocchi resta identica su ogni schermo |
| `--pl-radius-sm` | `8px` | anello di focus |
| `--pl-radius-md` | `14px` | pulsanti, liste, posti del tray, pannelli piccoli |
| `--pl-radius-lg` | `22px` | plancia, pannello del menu |

### Gap e spaziature

`--pl-gap-cell: 2px` è l'unico gap tokenizzato, ed è condiviso da tre punti che **devono**
coincidere: le celle della plancia, il disegno del pezzo nel tray e il pezzo trascinato sotto
il dito. Le altre spaziature sono valori letterali in `app.css` e seguono una scala informale
di 4/6/8/10/12/14/16/18/20/24 px; non esiste un token di spaziatura e i valori non sono
verificati da nulla.

Tutti i contenitori a piena pagina rispettano `env(safe-area-inset-*)`: il `.pl-app` su tutti
e quattro i lati, tray e blocchi di azioni aggiungono l'inset inferiore alla propria
imbottitura.

### Bersagli tattili

Valori dichiarati nel CSS:

| Elemento | Regola | Valore |
| --- | --- | --- |
| `.pl-btn` | `min-height` | **52px** |
| `.pl-btn--primario` | `min-height` | **64px** |
| `.pl-segmento` (tema, lingua) | `min-height` | **46px** |
| `.pl-hud__menu` (menu e indietro) | `width`/`height` | **44 × 44px** |
| `.pl-tray__posto` | `height` | `clamp(96px, 17vh, 152px)`; `clamp(84px, 14vh, 110px)` sotto i 700px di altezza; `clamp(70px, 26vh, 110px)` in orizzontale |
| `.pl-interruttore` | nessun `min-height` | ~58px effettivi (leva da 30px + 2×14px di imbottitura) |

**Attenzione: il posto del tray non è il bersaglio.** Il posto è solo un contenitore; a
ricevere il tocco è il bottone `.pl-pezzo-presa` interno, che misura il **disegno del pezzo
più 8px di imbottitura per lato**. La dimensione della cella del pezzo è calcolata a runtime
in `Tray.jsx` e limitata a `[11px, 28px]`, quindi un pezzo di **una sola cella** produce un
bersaglio piccolo. Misurato in Chromium:

| Viewport | Cella del tray | Bersaglio del pezzo da 1 cella | Bersaglio di una linea da 5 |
| --- | --- | --- | --- |
| 390 × 844 | 18px | **34 × 34px** | 114 × 34px |
| 360 × 640 | 13px | **29 × 29px** | 89 × 29px |

Sotto i 44px raccomandati. Non è un problema teorico: `p1`, il pezzo da una cella, è
proprio quello che si usa nei momenti in cui la griglia è quasi piena e sbagliare costa la
partita. Non è stato corretto.

### Dimensione della plancia

`.pl-plancia` è `max-width: min(96vw, 58vh)` con `aspect-ratio: 1` — in orizzontale diventa
`min(92vh, 46vw)`. Misurata: 370 × 370px su viewport 390 × 844 (cella da 38px), 340 × 340px
su 360 × 640 (cella da 34.7px). La barra della Catena condivide lo stesso `max-width` così da
restare allineata al bordo del tabellone.

## 6. Movimento

### Durate ed easing definiti

| Token | Valore | Dove è usato davvero (`var(--…)` in `app.css`) |
| --- | --- | --- |
| `--pl-t-instant` | 90ms | `transform` del pulsante premuto (`.pl-btn:active` scala a 0.97) |
| `--pl-t-fast` | 160ms | sfondo del pulsante; sfondo del posto del tray; `transform` del pezzo; sfondo e pallino dell'interruttore |
| `--pl-t-base` | 240ms | larghezza del riempimento della barra della Catena; animazione `pl-scatta` |
| `--pl-t-atterraggio` | 260ms | animazione `pl-atterra` |
| `--pl-t-esplosione` | 420ms | animazioni `pl-svanisci`, `pl-lampo`, `pl-salta` |
| `--pl-t-punti` | 950ms | animazione `pl-sali` |
| `--pl-t-festa` | 900ms | festeggiamento fra un livello e l'altro: coriandoli, salto di Plinto, barra dell'avanzamento |
| `--pl-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | tutte le transizioni di sfondo e larghezza; le animazioni `pl-svanisci`, `pl-sali`, `pl-lampo`, `pl-salta` |
| `--pl-ease-pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `transform` del pezzo; animazioni `pl-atterra` e `pl-scatta`. È l'unica curva che supera l'1 e "rimbalza" |

I tre token `--pl-t-atterraggio`, `--pl-t-esplosione` e `--pl-t-punti` esistono perché quelle
durate servono **anche** al JavaScript, che decide quando togliere dallo stato l'elemento
temporaneo. Sono dichiarate in `src/feel/durate.js` (`DURATA_ATTERRAGGIO`, `DURATA_ESPLOSIONE`,
`DURATA_PUNTI`) e in `tokens.css`, e `tests/durate.test.js` legge i due file e **fallisce se
qualcuno ne cambia uno solo**. Prima erano numeri scritti a mano in entrambi i posti, senza
niente che li tenesse insieme.

### Le animazioni a fotogrammi chiave

| Animazione | Durata | Curva | Cosa fa |
| --- | --- | --- | --- |
| `pl-atterra` | `--pl-t-atterraggio` (260ms) | `--pl-ease-pop` | il blocco appena appoggiato parte a scala 1.28 e si assesta |
| `pl-svanisci` | `--pl-t-esplosione` (420ms) | `--pl-ease-out` | il blocco eliminato lampeggia (fondo `--pl-text`) e collassa a scala 0.2 |
| `pl-sali` | `--pl-t-punti` (950ms) | `--pl-ease-out` | i punti volano verso l'alto e svaniscono |
| `pl-scatta` | `--pl-t-base` (240ms) | `--pl-ease-pop` | il punteggio in testata pulsa quando cresce |
| `pl-lampo` | `--pl-t-esplosione` (420ms) | `--pl-ease-out` | la barra della Catena lampeggia quando sale di livello |
| `pl-salta` | `--pl-t-esplosione` (420ms) | `--pl-ease-out` | la cella portata via da una **bomba**: ruota, si illumina e collassa |
| `pl-pulsa` | 1s, infinita | `ease-in-out` (parola chiave) | pulsazione delle celle che stanno per essere eliminate |
| `pl-bomba-respira` | 1.6s, infinita | `ease-in-out` (parola chiave) | la scintilla sulla miccia della bomba, che si stringe e ruota |
| `pl-plinto-respira` | 3.2s, infinita | `ease-in-out` (parola chiave) | il respiro di Plinto: 2,5% di traslazione verticale, nient'altro |
| `pl-coriandolo` | `--pl-t-festa` (900ms) | `--pl-ease-out` | due coriandoli cadono dietro Plinto quando si supera un livello |
| `pl-salta-gioia` | `--pl-t-festa` (900ms) | `--pl-ease-pop` | Plinto rimbalza **una volta sola** all'esito vinto |

Le uniche durate ancora scritte a mano sono le tre animazioni **infinite**, che non hanno una
controparte in JavaScript. `tests/durate.test.js` verifica anche questo, cioè che nessuna
`animation:` dichiari una durata letterale fuori da quell'elenco di tre.

Il controllo aveva una falla ed è stata chiusa: l'espressione regolare riconosceva solo durate
intere (`\d+m?s`), quindi `1.6s` e `3.2s` le sfuggivano e il test garantiva meno di quanto
dichiarasse. Ora riconosce anche i decimali, l'elenco delle eccezioni è esplicito, e per ognuna
verifica che il selettore che la porta ricompaia con `animation: none` dentro un blocco
`prefers-reduced-motion` — l'elenco delle eccezioni non è più un permesso, è un contratto.

### `prefers-reduced-motion`: cosa succede davvero

Adesso funziona, ed è cambiato rispetto a prima. `tokens.css` porta a `1ms` **tutti e sette** i
token di durata (`--pl-t-slow` è stato rimosso: non lo usava nessuno), e poiché le
`@keyframes` degli effetti di mossa usano quei token, con la preferenza attiva:

- **diventano istantanee** sia le transizioni (pressione del pulsante, sfondo del posto del
  tray, larghezza della barra della Catena, leva degli interruttori) sia le animazioni di
  mossa: atterraggio, esplosione, punti volanti, scatto del punteggio, lampo della Catena e
  cella saltata dalla bomba;
- le tre animazioni **infinite** vengono spente a parte, in `app.css`:
  `.pl-cella--incandidata::after`, `.pl-bomba__scintilla` e `.pl-plinto--vivo` ricevono
  `animation: none`, e una regola generica porta `animation-iteration-count` a 1 su tutto.
  Il festeggiamento fra un livello e l'altro è spento allo stesso modo;
  Non è più una convenzione da ricordare: `tests/durate.test.js` fallisce se una di queste
  animazioni perde il suo interruttore;
- **le particelle sul canvas non passano affatto dal CSS**, quindi il CSS non può spegnerle.

Per quelle serve l'impostazione **Animazioni** del giocatore, che è anche l'unico interruttore
che ferma tutto in blocco — `useEffettiMossa` esce prima di applicare le classi e
`CampoParticelle.imposta(false)` svuota il canvas e ferma il ciclo di `requestAnimationFrame`.
Perché la preferenza di sistema conti anche lì, `src/state/useImpostazioni.js` legge
`matchMedia('(prefers-reduced-motion: reduce)')` e la usa come **valore iniziale**
dell'impostazione. Chi chiede meno movimento al sistema operativo trova quindi il gioco già
senza particelle, senza dover cercare l'interruttore; e chi le vuole comunque le riaccende,
perché una scelta esplicita e salvata batte una preferenza dedotta.

## 7. Componenti

Componenti riutilizzabili e loro unica responsabilità:

| Componente | File | Responsabilità |
| --- | --- | --- |
| `Logo` | `src/ui/Logo.jsx` | marchio: quattro tessere SVG (tre piene, una tratteggiata) più la parola PLINTO |
| `Pezzo` | `src/ui/Pezzo.jsx` | disegna una forma come griglietta di celle; l'unico parametro che cambia fra tray, trascinamento e schermata introduttiva è la dimensione della cella |
| `Plancia` | `src/ui/Plancia.jsx` | disegna le 81 celle, i livelli sovrapposti (linee dei quadranti, canvas delle particelle) e le classi di stato; **non contiene logica di gioco** |
| `Hud` | `src/ui/Hud.jsx` | punteggio, record e accesso al menu |
| `BarraCatena` | `src/ui/Hud.jsx` | barra e moltiplicatore esatto della Catena, come `progressbar` accessibile |
| `Tray` | `src/ui/Tray.jsx` | i tre pezzi disponibili, con la dimensione delle celle ricalcolata sulla larghezza reale dello slot |
| `Annunci` | `src/ui/Annunci.jsx` | regione `aria-live="polite"` per i lettori di schermo; `frasePerMossa()` costruisce la frase |
| `Pagina` | `src/ui/schermate/Pagina.jsx` | impalcatura delle pagine secondarie: testata con titolo e pulsante indietro |
| `Voce` | `src/ui/schermate/Pagina.jsx` | riga etichetta/valore di una lista |
| `Interruttore` | `src/ui/schermate/Pagina.jsx` | acceso/spento con `role="switch"` e `aria-checked` |

Schermate (una per file in `src/ui/schermate/`, più `SchermoGioco.jsx`): `PrimoAvvio`,
`SchermoHome`, `SchermoGioco`, `SchermoFine`, `SchermoStatistiche`, `SchermoImpostazioni`,
`SchermoInfo`, `SchermoSostieni`. `SchermoFine` ha due varianti a seconda che la partita sia
libera o una Sfida del Giorno, ma è lo stesso componente e lo stesso stile.

L'unico modificatore che non appartiene a un componente riutilizzabile è `.pl-sfida-avvio`
nella home: è un `.pl-btn` normale con il contenuto allineato agli estremi e il risultato di
giornata in `--pl-font-num`. È deliberato che non abbia peso visivo proprio — la Sfida del
Giorno è un secondo pulsante, non un richiamo: niente animazione, niente contatore alla
rovescia, niente badge.

Hook e moduli di supporto che il sistema di design presuppone: `useTrascinamento`
(pointer events e modalità a due tocchi), `useTastiera` (cursore sulla griglia),
`useEffettiMossa` (traduce `lastMove` in classi e suoni), `CampoParticelle`
(`src/feel/particelle.js`, un solo canvas).

### Il segno della bomba

`src/ui/Bomba.jsx`, SVG inline in un `viewBox` 100x100, usato identico dalla plancia e dal
tray. Corpo tondo quasi nero (`--pl-bomba-corpo`), alone chiaro dietro, riflesso, tappo,
miccia e **scintilla** in oro (`--pl-bomba-scintilla`).

**La prima versione era sbagliata, ed è istruttivo perché.** Era un anello bianco cerchiato di
scuro al centro della cella. Rispettava la regola giusta — segno **geometrico e non cromatico**,
così lo vede anche chi non distingue bene i colori — e infatti era passata da tutte le
revisioni. Sbagliava però quella più importante: **non sembrava una bomba.** Un cerchio può
essere un bersaglio, un bottone, un buco. Un simbolo che rispetta ogni regola di accessibilità
e non comunica la cosa che deve comunicare non è accessibile, è solo conforme.

Tre scelte, e la ragione di ciascuna:

1. **È geometrico, non cromatico.** Il colore in PLINTO non porta informazione, e una bomba
   segnalata da una tinta diversa sarebbe invisibile a chi non distingue bene i colori —
   proprio sull'unico elemento che cambia l'esito di una mossa. La forma si vede a prescindere
   dalla percezione cromatica, e lascia intatto il colore del blocco.
2. **Il corpo è quasi nero, l'alone chiarissimo.** Insieme reggono su tutte e sei le famiglie
   cromatiche in entrambi i temi, compreso il viola, che è la più scura: senza l'alone il nero
   su viola perderebbe i contorni.
3. **Si muove solo la scintilla.** È l'unica parte accesa e l'unica animata
   (`pl-bomba-respira`, 1.6s): l'occhio va lì e il resto si legge di conseguenza. Animare
   tutto il simbolo lo renderebbe un elemento che pulsa, non una bomba con la miccia accesa.

Verificato a **26px** (tray), **34px** (plancia) e **64px**: riconoscibile a tutte e tre.

### Plinto, il personaggio### Plinto, il personaggio

`src/ui/Plinto.jsx`, SVG inline in un `viewBox` 100x100.

**Perché è un blocco e non un animale.** Plinto è la stessa forma che il giocatore appoggia
sulla plancia cento volte a partita: un blocco squadrato con lo stesso raggio d'angolo dei
pezzi. Un personaggio che non c'entra con il gioco va poi giustificato ogni volta che compare;
questo si spiega da solo. Prende i colori dai token (`--pl-brand` per il corpo,
`--pl-brand-deep` per i piedini), quindi segue il tema chiaro senza una riga in più.

**Cinque espressioni, ognuna con un compito:** `normale` (mappa e attesa), `contento` (livello
superato), `deluso` (livello fallito), `stupito` (qualcosa di grosso), `dorme`. Cambiano solo
occhi, sopracciglia e bocca — il corpo è sempre lo stesso, così l'identità non oscilla.

L'animazione `pl-plinto-respira` è deliberatamente minima: 3,2 secondi, 2,5% di traslazione
verticale, `transform-origin` sui piedi. Fermo del tutto sembrerebbe un'illustrazione; di più
ruberebbe attenzione alla plancia. Si spegne con `prefers-reduced-motion`.

Nessuna immagine, nessun file, nessuna licenza da tracciare, nessuna richiesta di rete: è la
stessa regola che vale per il logo e per le icone dell'interfaccia.

### Marchio e icona

`Logo.jsx` disegna in SVG inline e riferisce i colori come `var(--pl-block-*)`, quindi segue i
token. `public/icon.svg` è un file separato e **ripete i colori in esadecimale**: un cambio di
token va riportato lì a mano.

Per due versioni non è stato riportato: l'icona ha continuato a contenere `#E4B44C`,
`#4CB5A5` e `#7B6CE6`, cioè i valori *smorzati* di `--pl-block-4`, `--pl-block-2` e
`--pl-block-3`, mentre il componente disegnava già `#ffc212`, `#12e1b0` e `#9b4dff`. Il marchio
dentro il gioco e l'icona sulla schermata iniziale erano di due colori diversi, e nessuno se ne
era accorto perché niente li confrontava.

Ora l'icona è riallineata (`#0e1118`, `#ffc212`, `#12e1b0`, `#9b4dff`, `#3a4460`, cioè
`--pl-ink` e i tre blocchi del tema scuro più `--pl-line-strong`) e la stessa geometria del
componente — rettangoli da 19px, `rx=5`, tratteggio `4 3`. Soprattutto: **`tests/icona.test.js`
confronta l'SVG con i token a ogni `npm test`**, quindi la duplicazione resta ma non può più
divergere in silenzio. I PNG in `public/icone/` si rigenerano dall'SVG con `npm run icone`.

`manifest.webmanifest` dichiara `background_color` e `theme_color` a `#0E1118`, cioè
`--pl-ink`, e `index.html` ripete lo stesso valore nel meta `theme-color`. Nessuno dei tre
cambia quando il giocatore sceglie il tema chiaro.

## 8. Regole del sistema

Da rispettare quando si aggiunge interfaccia.

1. **Ogni colore viene da un token.** Nessun esadecimale nuovo in `app.css` o nei componenti.
   Se serve una tinta che non esiste, si aggiunge un token in `tokens.css` **con il suo
   rapporto di contrasto misurato scritto accanto**, non si scrive il valore nel punto d'uso.
2. **Nessuna risorsa esterna, di nessun tipo.** Niente font remoti, niente CDN, niente
   immagini via URL, niente iframe. È un vincolo di privacy (vedi `docs/ASSET_LICENSES.md`),
   non una preferenza: una sola richiesta verso un dominio di terzi rende falso il testo sulla
   privacy che il gioco mostra nella schermata Info.
3. **Ogni testo passa dall'i18n**, con la chiave presente in **entrambe** le lingue. Il test
   `tests/i18n.test.js` verifica la parità delle chiavi e che nessuna traduzione sia vuota,
   ma non può accorgersi di una stringa scritta direttamente nel JSX: quella va evitata a
   mano. (Oggi ce ne sono ancora alcune — vedi in fondo.)
4. **Bersagli tattili di almeno 44px** sul lato più corto per qualunque cosa si tocchi. I
   pulsanti rispettano già la regola tramite `min-height`; il tray no, ed è un debito noto.
5. **Il movimento è funzionale.** Un'animazione esiste per far capire *cosa è successo*
   (un blocco è atterrato, una riga è sparita, la Catena è salita), mai per decorare. Se si
   aggiunge un'animazione a fotogrammi chiave, va disattivata anche quando l'impostazione
   Animazioni è spenta — il CSS da solo non basta, perché `prefers-reduced-motion` non tocca
   le `@keyframes` (sezione 6).
6. **L'informazione non passa mai dal solo colore.** Il cursore da tastiera è un anello
   spesso e non una tinta; l'anteprima illegale è un bordo; le sei famiglie cromatiche sono
   distinte anche per luminosità. Il colore di un pezzo non ha nessun significato di gioco e
   non deve acquisirne.
7. **Nessuna nuova dipendenza per l'interfaccia.** Le dipendenze di produzione sono `react` e
   `react-dom`; icone e forme si disegnano in SVG inline.

### Debiti aperti di questo sistema, in ordine di gravità

Questo elenco è stato riverificato riga per riga sul codice al 6 settembre 2026, dopo che la
versione precedente si è rivelata **parzialmente obsoleta**: quattro voci su undici descrivevano
difetti già corretti. Un elenco di debiti che non viene ricontrollato invecchia come qualsiasi
altra documentazione, con l'aggravante che fa perdere tempo a chi prova a risolvere qualcosa
che è già risolto.

1. `prefers-reduced-motion` non può spegnere le particelle: sono disegnate su un canvas con
   `requestAnimationFrame`, dove il CSS non arriva. Da questa versione la preferenza di sistema
   è letta anche da JavaScript e decide il **valore iniziale** dell'impostazione Animazioni
   (`src/state/useImpostazioni.js`), che le spegne davvero. Resta un valore iniziale: una
   scelta esplicita del giocatore, essendo salvata, continua a vincere.
2. Il rapporto di contrasto dei sei blocchi nel tema chiaro è misurato sul fondo della plancia
   e sta fra 3.31 e 5.69: sopra la soglia di 3:1 per gli elementi grafici, ma il più basso ha
   poco margine. Verificabile in qualsiasi momento con `npm run contrasti`.

**Chiuse rispetto alla versione precedente di questo elenco** (verificate nel codice, non
dedotte): il bersaglio tattile dei pezzi — `.pl-pezzo-presa` occupa tutto il posto del tray con
`min-width`/`min-height` di 48px; `--pl-text-faint` e gli accenti del tema chiaro, ora misurati
sul fondo **più sfavorevole** e tutti sopra 4.5:1; il commento dei contrasti in `tokens.css`,
che dichiarava numeri più ottimisti della misura; `public/icon.svg`, riallineato alla palette
satura e ora sorvegliato da `tests/icona.test.js`; `--pl-t-slow`, rimosso perché non usato da
nessuno; la falla dell'espressione regolare in `tests/durate.test.js`; le stringhe italiane
scritte nel JSX, passate all'i18n; `toLocaleString('it-IT')`, sostituito da `src/i18n/formato.js`
che segue la lingua scelta; e l'`"orientation": "portrait"` del manifest, che non c'è più.

I contrasti non sono più un'affermazione scritta in un commento: `tools/contrasti.mjs`
(`npm run contrasti`) li rimisura leggendo `tokens.css`, ed esce con errore se anche uno solo
scende sotto soglia. `tests/contrasti.test.js` lo esegue a ogni `npm test`, quindi la promessa
di accessibilità di questo documento è controllata dalla stessa suite che controlla le regole
del gioco. È la risposta diretta a un difetto ripetuto due volte: dichiarare contrasti mai
misurati.

