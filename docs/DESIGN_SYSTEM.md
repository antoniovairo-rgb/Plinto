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
qui. In `app.css` restano però quattordici colori letterali, ed è onesto elencarli invece di
dichiarare una regola che il file non rispetta del tutto:

- `#1a1405` (2 volte), il bruno quasi nero del testo sul giallo del marchio — pulsante
  primario e nastro "nuovo record";
- `#fff` (2 volte), il pallino dell'interruttore e il testo del pulsante di pericolo;
- 8 `rgba()` di bianco o nero usate come velature: fondo tenue delle celle e dei posti del
  tray, le due luci interne del blocco, ombra del pezzo trascinato, velo del menu, ombra del
  testo dei punti volanti, anello scuro dietro il cursore da tastiera. Non esistono token per
  l'opacità;
- **due `rgba(242, 193, 78, …)`, che sono `--pl-brand` riscritto a mano in decimale** perché
  serviva con un canale alfa: l'alone dell'aiuto visivo e lo sfondo del posto selezionato nel
  tray. Un cambio di `--pl-brand` va riportato lì a mano.

### Tema scuro (predefinito, `:root`)

| Token | Valore | A cosa serve |
| --- | --- | --- |
| `--pl-ink` | `#0e1118` | fondo dell'app (`body`), e `theme-color` di `index.html` e del manifest |
| `--pl-ink-2` | `#131722` | fondo della plancia |
| `--pl-surface` | `#181d2a` | pannelli, liste, menu, bottone del menu nell'HUD, sfondo della barra Catena |
| `--pl-surface-2` | `#1f2534` | elementi rialzati: pulsanti normali, segmento attivo, numeri della presentazione |
| `--pl-line` | `#262d3f` | linee sottili, separatori a 1px fra le voci di lista, sfondo della leva spenta |
| `--pl-line-strong` | `#3a4460` | separatori dei nove quadranti 3x3 — la firma del tabellone |
| `--pl-text` | `#e9ecf4` | testo principale; anche il colore del blocco che sta esplodendo e dell'anello del cursore da tastiera |
| `--pl-text-dim` | `#98a0b5` | testo secondario: righe di dettaglio, record, pulsanti fantasma |
| `--pl-text-faint` | `#838ca1` | etichette maiuscole, note, suggerimenti, descrizioni degli interruttori |
| `--pl-brand` | `#f2c14e` | ottone: punteggio, logo, anello di focus, evidenziazione dei gruppi in chiusura, punti volanti |
| `--pl-brand-deep` | `#c9922a` | fondo del gradiente del pulsante primario |
| `--pl-danger` | `#ec6d8e` | bordo della mossa illegale, note di allarme, pulsante di cancellazione dati |
| `--pl-ok` | `#4cb5a5` | conferme: leva accesa, riga "extra" di fine partita, risultato dell'esempio nell'intro |
| `--pl-block-1` | `#e8734a` | terracotta |
| `--pl-block-2` | `#4cb5a5` | verderame (stesso valore di `--pl-ok`) |
| `--pl-block-3` | `#7b6ce6` | indaco |
| `--pl-block-4` | `#e4b44c` | ocra |
| `--pl-block-5` | `#e4587e` | granato |
| `--pl-block-6` | `#4a9be8` | azzurrite |

I colori dei blocchi hanno un secondo uso oltre alla plancia: `--pl-block-2` e `--pl-block-1`
compongono il gradiente della barra della Catena, e i punti volanti delle mosse migliori
passano da `--pl-brand` a `--pl-block-2` (`eccellente`) e a `--pl-block-1` (`perfetta`).

### Tema chiaro (`:root[data-theme='chiaro']`)

Si attiva **solo** su richiesta esplicita del giocatore (Impostazioni → Tema), mai in
automatico: `useImpostazioni` scrive l'attributo `data-theme` sull'elemento radice. Non
esiste nessuna regola `prefers-color-scheme` nel progetto, ed è deliberato — cambiare
l'aspetto del gioco mentre qualcuno sta giocando è peggio di ignorare la preferenza di
sistema.

| Token | Valore chiaro | Note |
| --- | --- | --- |
| `--pl-ink` | `#f3f4f8` | |
| `--pl-ink-2` | `#e9ebf2` | |
| `--pl-surface` | `#ffffff` | |
| `--pl-surface-2` | `#f0f2f7` | |
| `--pl-line` | `#d8dce7` | |
| `--pl-line-strong` | `#a9b1c6` | |
| `--pl-text` | `#171b26` | |
| `--pl-text-dim` | `#4f586d` | |
| `--pl-text-faint` | `#838ca2` | quasi identico al valore scuro (`#838ca1`) |
| `--pl-brand-deep` | `#a8781c` | |
| `--pl-shadow-soft` | `0 2px 10px rgba(20,25,40,0.1)` | |
| `--pl-shadow-lift` | `0 12px 32px rgba(20,25,40,0.18)` | |

Il tema chiaro **non ridefinisce** `--pl-brand`, `--pl-ok`, `--pl-danger` né le sei famiglie
cromatiche dei blocchi: restano quelli del tema scuro. Le conseguenze sono misurate nella
sezione 3 e non sono buone.

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

### Tema scuro: conforme, e verificato

Verificato leggendo `tokens.css`: i valori attuali sono davvero `--pl-text-faint: #838ca1` e
`--pl-danger: #ec6d8e`. I rapporti qui sotto sono ricalcolati su quei valori.

| Token | su `--pl-ink` (`#0e1118`) | su `--pl-surface-2` (`#1f2534`) | Esito |
| --- | --- | --- | --- |
| `--pl-text` `#e9ecf4` | **15.98** | **12.95** | AA e AAA |
| `--pl-text-dim` `#98a0b5` | **7.22** | **5.85** | AA |
| `--pl-text-faint` `#838ca1` | **5.60** | **4.54** | AA, con poco margine |
| `--pl-brand` `#f2c14e` | **11.25** | 9.12 | AA |
| `--pl-ok` `#4cb5a5` | 7.61 | 6.16 | AA |
| `--pl-danger` `#ec6d8e` | 6.42 | **5.21** | AA |

`--pl-surface-2` è il fondo **più chiaro** dell'interfaccia scura, quindi è il caso peggiore:
se un testo passa lì, passa ovunque nel tema scuro.

Blocchi contro il fondo della plancia `--pl-ink-2` (`#131722`), soglia 3:1 per elementi non
testuali:

| Blocco | Valore | Contrasto |
| --- | --- | --- |
| terracotta `--pl-block-1` | `#e8734a` | **5.95** |
| verderame `--pl-block-2` | `#4cb5a5` | **7.21** |
| indaco `--pl-block-3` | `#7b6ce6` | **4.37** |
| ocra `--pl-block-4` | `#e4b44c` | **9.32** |
| granato `--pl-block-5` | `#e4587e` | **5.11** |
| azzurrite `--pl-block-6` | `#4a9be8` | **6.09** |

Il peggiore (indaco, 4.37) supera comunque anche la soglia più severa per il testo normale.
Tutti i valori di questa sezione sono conformi.

### Due token corretti proprio per questo motivo

Sono correzioni reali, fatte nel commit `fe290f7`, non un esempio didattico:

| Token | Valore precedente | Contrasto precedente | Valore attuale | Contrasto attuale |
| --- | --- | --- | --- | --- |
| `--pl-text-faint` | `#626b83` | 3.55 su `--pl-ink`, **2.88** su `--pl-surface-2` → **non conforme** | `#838ca1` | 5.60 / 4.54 |
| `--pl-danger` | `#e4587e` | **4.37** su `--pl-surface-2` → sotto soglia | `#ec6d8e` | 5.21 |

`--pl-text-faint` non è un token marginale: lo usano le etichette maiuscole dell'HUD, il
suggerimento sotto la plancia, il claim della home, il titolo di fine partita, le note e le
descrizioni degli interruttori. Al valore precedente quei testi erano illeggibili sui
pannelli. Il vecchio valore di `--pl-danger` sopravvive comunque nel sistema: è esattamente
`--pl-block-5`, il granato, dove però la soglia da rispettare è 3:1 e non 4.5:1.

### Tema chiaro: NON verificato e non conforme

Va detto senza attenuazioni, perché il commento in `tokens.css` afferma che i contrasti sono
"tutti sopra la soglia WCAG AA" senza precisare che la misura riguarda solo il tema scuro.
Ricalcolati sui valori del blocco `[data-theme='chiaro']`:

| Elemento | Contrasto | Soglia | Esito |
| --- | --- | --- | --- |
| `--pl-text` `#171b26` su `--pl-surface` | 17.20 | 4.5 | conforme |
| `--pl-text-dim` `#4f586d` su `--pl-surface` | 7.12 | 4.5 | conforme |
| `--pl-text-faint` `#838ca2` su `--pl-ink` | **3.06** | 4.5 | **non conforme** |
| `--pl-text-faint` `#838ca2` su `--pl-surface` | **3.37** | 4.5 | **non conforme** |
| `--pl-brand` `#f2c14e` su `--pl-ink` | **1.53** | 4.5 | **non conforme** — è il colore del punteggio nell'HUD e del numerone di fine partita |
| `--pl-ok` `#4cb5a5` su `--pl-surface` | **2.48** | 4.5 | **non conforme** |
| blocchi su `--pl-ink-2` chiaro | da **1.61** (ocra) a **3.44** (indaco) | 3.0 | **cinque su sei sotto soglia** |

C'è inoltre un caso che fallisce in **entrambi** i temi: `.pl-btn--pericolo` scrive `#fff` su
`--pl-danger`, cioè **2.94:1**, sotto la soglia per testo normale. È il pulsante che conferma
la cancellazione dei dati.

Nessuna di queste è stata corretta: il tema chiaro non è mai stato misurato prima di questo
documento.

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
| `--pl-t-base` | 240ms | larghezza del riempimento della barra della Catena |
| `--pl-t-slow` | 420ms | **mai usato tramite il token** — vedi sotto |
| `--pl-ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | tutte le transizioni di sfondo e larghezza; le animazioni `pl-svanisci`, `pl-sali`, `pl-lampo` |
| `--pl-ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | **mai usato** (la pulsazione dell'aiuto visivo usa la parola chiave CSS `ease-in-out`, non il token) |
| `--pl-ease-pop` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | `transform` del pezzo; animazioni `pl-atterra` e `pl-scatta`. È l'unica curva che supera l'1 e "rimbalza" |

### Le animazioni a fotogrammi chiave

Le durate delle `@keyframes` sono **numeri letterali**, non token:

| Animazione | Durata | Curva | Cosa fa |
| --- | --- | --- | --- |
| `pl-atterra` | 260ms | `--pl-ease-pop` | il blocco appena appoggiato parte a scala 1.28 e si assesta |
| `pl-svanisci` | 420ms | `--pl-ease-out` | il blocco eliminato lampeggia (fondo `--pl-text`) e collassa a scala 0.2 |
| `pl-sali` | 950ms | `--pl-ease-out` | i punti volano verso l'alto di 74px e svaniscono |
| `pl-scatta` | 300ms | `--pl-ease-pop` | il punteggio in testata pulsa quando cresce |
| `pl-lampo` | 420ms | `--pl-ease-out` | la barra della Catena lampeggia quando sale di livello |
| `pl-pulsa` | 1s, infinita | `ease-in-out` (parola chiave) | pulsazione delle celle che stanno per essere eliminate |

Le prime tre durate sono **duplicate** in `src/feel/useEffettiMossa.js`
(`DURATA_APPOGGIO = 260`, `DURATA_ESPLOSIONE = 420`, `DURATA_PUNTI = 950`), perché è il
JavaScript a decidere quando togliere la classe. CSS e JS vanno tenuti allineati a mano:
non c'è nulla che lo verifichi.

### `prefers-reduced-motion`: cosa succede davvero

`tokens.css` contiene un blocco `@media (prefers-reduced-motion: reduce)` che porta i quattro
token di durata a `1ms`, con il commento "le riceve ridotte ovunque". **"Ovunque" non è
esatto.** Poiché i token sono usati solo dalle `transition` e mai dalle `animation`, con la
preferenza attiva:

- **diventano istantanee** le transizioni: pressione del pulsante, sfondo del posto del tray,
  larghezza della barra della Catena, leva degli interruttori;
- **restano a durata piena** tutte le animazioni a fotogrammi chiave: atterraggio del blocco
  (260ms), esplosione (420ms), punti volanti (950ms), scatto del punteggio (300ms), lampo
  della Catena (420ms) e la pulsazione infinita dell'aiuto visivo;
- **restano attive** le particelle sul canvas, che non passano affatto dal CSS.

L'unico interruttore che spegne davvero tutto è l'impostazione **Animazioni** del giocatore:
`useEffettiMossa` esce prima di applicare le classi e `CampoParticelle.imposta(false)` svuota
il canvas e ferma il ciclo di `requestAnimationFrame`. Chi dichiara la preferenza a livello
di sistema non la eredita: deve trovare e spegnere l'opzione a mano.

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

### Marchio e icona

`Logo.jsx` disegna in SVG inline e riferisce i colori come `var(--pl-block-*)`, quindi segue i
token. `public/icon.svg` è un file separato e **ripete gli stessi colori in esadecimale**
(`#0E1118`, `#E4B44C`, `#4CB5A5`, `#7B6CE6`, `#3A4460`): un cambio di token va riportato lì a
mano. Le due versioni non hanno la stessa geometria (rettangoli 19px con `rx=5` e tratteggio
`4 3` nel componente, 15px con `rx=4` e tratteggio `3.5 2.5` nell'icona): stesso disegno,
proporzioni diverse.

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

1. Il **tema chiaro non è conforme**: `--pl-brand` sul punteggio scende a 1.53:1, cinque
   blocchi su sei stanno sotto 3:1 sulla plancia chiara, `--pl-text-faint` sta sotto 4.5:1.
2. `.pl-btn--pericolo` scrive bianco su `--pl-danger`: 2.94:1 in entrambi i temi.
3. Il bersaglio tattile del pezzo da una cella è 34 × 34px (29 × 29px su schermi da 360px).
4. `prefers-reduced-motion` non riduce le animazioni a fotogrammi chiave né le particelle.
5. `--pl-t-slow` e `--pl-ease-in-out` sono definiti ma non usati; le durate a cui `--pl-t-slow`
   corrisponde (420ms) sono scritte a mano in tre punti fra CSS e JS.
6. Testi ancora scritti nel JSX invece che nell'i18n: l'etichetta accessibile dei pezzi nel
   tray (`Tray.jsx`), il paragrafo sulle licenze e la nota sul link di donazione mancante in
   `Info.jsx`, la nota corrispondente in `Sostieni.jsx`. Sono in italiano anche per un
   giocatore che ha scelto l'inglese.
7. `toLocaleString('it-IT')` è fisso: i numeri restano formattati all'italiana in inglese.
8. Il manifest dichiara `"orientation": "portrait"`. Il layout orizzontale scritto in
   `app.css` resta quindi raggiungibile solo aprendo il gioco in una scheda del browser: nel
   gioco installato come PWA l'orientamento richiesto dal manifest lo esclude.
