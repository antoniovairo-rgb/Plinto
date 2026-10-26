# Collaudo 1.21.25

Figlia di collaudo, 26 ottobre 2026, ramo `collaudo-1.21.25` (da `main` a `14c6a09`). Oggetto: la
1.21.25 **pubblicata** su https://antoniovairo-rgb.github.io/Plinto/, quella che il revisore di
Google vedrà con il pacchetto 11915 (secondo rifiuto «Unresponsive app: Your app freezes, is
unresponsive, or scrolling doesn't work», PO-017, `docs/DECISIONI.md:135`). Letti
`docs/sviluppo/RAPPORTO-PO-035.md` e `docs/CHANGELOG.md` (voce 1.21.25). Nessun file del gioco
toccato: questo rapporto e le schermate in `docs/sviluppo/collaudo-1.21.25/` sono le sole aggiunte.

## In breve

| | esito |
|---|---|
| Bundle pubblicato | `assets/index-pCaA_udg.js`, contiene «1.21.25» (4 volte); è lo stesso nome di file che la CI ha costruito (log del run 230) |
| Prove richieste contro il sito | 5 verdi su 6; **`e2e-schermi` completo rosso** (1280×620, menu) in 2 corse su 2; verde con `PLINTO_SCHERMI=orizzontale,testo` |
| **CI `verifica` del merge 1.21.25** (run 230, `49c5d77`) | **rossa**, stesso difetto: «orizzontale 1280x620 / menu: non ci si arriva» → **E1** |
| Percorso da revisore col dito, 6 formati | tutto raggiungibile e tutto risponde; livello 1 vinto col dito su 6 formati su 6 (vedi D1 per 360×640 con CPU lenta) |
| Scorrimento **col dito** | 60 casi su 6 formati: dove la schermata scorre, arriva in fondo; la prova sa fallire |
| Long task all'avvio, CPU 4x | **nessuno sopra 200 ms** in 30 aperture; il più lungo 122 ms (in una corsa con altri processi), 84 ms nelle corse da sola |
| Risposta al tocco | mediana 5–6 ms, massimo 66 ms in 256 tocchi misurati (tocco → prima modifica della pagina) |

Classificazione: **E** = blocca secondo le regole del progetto; **D** = difetto misurato; **O** = osservazione.
Per ognuna, opzioni con la consigliata per prima. Non ho corretto niente.

## Che cosa ho fatto

Tutto contro il sito pubblicato, con il Chromium di `/opt/pw-browsers/chromium` (le prove del
gate lo ricevono con `PLINTO_CHROMIUM`, perché il loro percorso predefinito
`/opt/pw-browsers/chromium-1194/...` qui non esiste: `tests/e2e/schermi.mjs:44-46`).

1. `npm ci`, poi con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`:

   | prova | esito | durata |
   |---|---|---|
   | `npm run e2e-schermi` | **rosso**: `orizzontale 1280x620 / menu: non ci si arriva: page.waitForSelector: Timeout 8000ms exceeded` | 602 s |
   | `npm run e2e-schermi` (seconda corsa, da sola) | **rosso**: lo stesso, più `orizzontale 915x412 / console: Failed to load resource: net::ERR_CONNECTION_CLOSED` (una volta, rete del container: vedi O5) | — |
   | `PLINTO_SCHERMI=orizzontale,testo npm run e2e-schermi` | verde, «Tutto a posto su 0 formati, 5 coricati e 2 col testo x2» | 101 s |
   | `npm run e2e` | verde, «Nessun problema rilevato» | 20 s |
   | `npm run e2e-attrezzi` | verde | 49 s |
   | `npm run e2e-po008` | verde, «Tutto a posto» (94 mosse, 0 ritentate) | 229 s |
   | `npm run home-spiegazione` | verde | 174 s |
   | `npm run indietro` | verde | 13 s |

   Nessun rosso di `e2e-quadri` o `recensione`: non erano fra le prove richieste.

2. **Percorso da revisore** (script mio, fuori dal repo): contesto nuovo per ogni formato
   (= installazione pulita), `?origine=play`, `hasTouch`, `isMobile`, densità 2, ogni tocco e ogni
   trascinamento con `Input.dispatchTouchEvent` del protocollo. Passi: guida (6 passi, «Avanti» e
   «Gioca»), home, partita libera (un pezzo col dito, menu, «Torna alla partita», «Torna alla
   home»), sfida del giorno (un pezzo, menu, home), mappa, apertura del livello 1, **livello 1 giocato
   col dito fino a «Livello superato!»** (sequenza vincente calcolata dal motore, come in
   `schermi.mjs`), «Livello successivo», poi livello 13 con due gettoni (progressi scritti in
   `localStorage`, perché da installazione pulita gli attrezzi non ci sono), pannello degli
   attrezzi, la carriola scelta e «Lascia stare», menu del livello, «Torna ai livelli»; dalla home:
   impostazioni, archivio, info, come si gioca, statistiche, profilo, sostieni, ognuna chiusa con
   Indietro. Su ogni schermata: ogni pulsante portato in vista e controllato con
   `elementFromPoint` al centro; ogni contenitore che scorre portato in fondo; sporgenza di lato.
   Su ogni tocco: tempo dal `touchend` alla prima modifica della pagina.
3. **Scorrimento col dito**: su guida, home, mappa, apertura, come si gioca, impostazioni, info,
   archivio, statistiche, pannello degli attrezzi, il dito sale a metà dell'area che scorre finché
   la posizione non cambia più. Prova del fallimento: con `.pl-scroll { touch-action: none }`
   iniettato, 5 schermate su 5 restano a 0.
4. **Long task** con `Emulation.setCPUThrottlingRate` 4 e `PerformanceObserver('longtask')`, prima
   apertura (installazione pulita) e seconda (con il service worker), 3 giri a 360×640, 640×360,
   412×915 e 2 giri a 915×412, 1024×600, 800×1280.

## Risultati per formato (percorso da revisore)

| formato | griglia libera / sfida / livello 1 / livello 13 (lato, casella) | pezzo col dito | livello 1 col dito | comandi non raggiungibili | tocchi: mediana / max |
|---|---|---|---|---|---|
| 360×640 | 356 / 344 / **275** / 287 px (casella 36 / 35 / **27** / 29) | 3 su 3 | superato (prima corsa); **perso** nella corsa con altri processi, vedi D1 | 0 | 6 / 60 ms |
| 412×915 | 408 su tutte (42) | 3 su 3 | superato in 14 mosse | 0 | 6 / 30 ms |
| 640×360 | 348 su tutte (36), 97% dell'altezza | 3 su 3 | superato | 0 | 5 / 29 ms |
| 915×412 | 400 su tutte (41) | 3 su 3 | superato | 0 | 5 / 30 ms |
| 1024×600 | 588 su tutte (62) | 3 su 3 | superato | 0 (vedi E1 per la prima corsa) | 5 / 66 ms |
| 800×1280 | **426** su tutte (44), 53% della larghezza | 3 su 3 | superato | 0 | 6 / 33 ms |

Nessun errore in console in nessun formato. Unici comandi sotto 24 px: «Salta per ora» e «Non
mostrarmela più» della guida, alti 15 px (O4). Ogni schermata che scorre arriva in fondo, col
dito e da programma; le schermate che non scorrono non ne hanno bisogno (contenuto dentro la
finestra).

Scorrimento col dito, schermate che scorrono (corsa in px): a 360×640 guida 92, mappa 1310,
apertura 177, come si gioca 2981, impostazioni 233, info 143, archivio 17; a 640×360 anche la
home (163), il pannello degli attrezzi (216) e tutte le pagine; a 915×412 lo stesso (home 224,
pannello 164); a 1024×600 home 53; a 412×915 e 800×1280 solo mappa e come si gioca. **Tutte
arrivate in fondo.**

Long task con CPU 4x (ms; nessuno sopra 200, nessuno sopra 122):

| formato | prima apertura (guida pronta, ms) | long task prima apertura | seconda apertura | primo tocco su «Avanti» |
|---|---|---|---|---|
| 360×640 | 862–975 | 82, 69, 66, 59, 56, 51 | 0–1 task, max 52 | 15–37 ms |
| 640×360 | 875–926 | 68–79 | nessuno | 19–22 ms |
| 412×915 | 824–903 | 55–84 | max 62 | 23–60 ms |
| 915×412 | 871–913 | 57, 64 | nessuno | 20–26 ms |
| 1024×600 | 847–859 | 65 o nessuno | nessuno | 21–27 ms |
| 800×1280 | 848–1006 | 54–61 | nessuno | 22–25 ms |

Il tempo del primo tocco alla seconda apertura non è stato misurato (il mio script cercava la home,
ma la guida era ancora aperta): manca, non è un difetto. Sono tempi di Chromium desktop rallentato,
in rete attraverso il proxy del container: come si comporti un telefono vero **non posso
confermarlo**.

## E — bloccanti per le regole del progetto

### E1. La CI della 1.21.25 è rossa, e la 1.21.25 è pubblicata

- **Fatto**: il run 230 di `verifica.yml` sul merge `49c5d77` («Merge branch 'rilascio/1.21.25'»),
  finito alle 17:10 UTC del 26 ottobre, chiude con «1 controlli su 33 sono falliti. NON
  pubblicare.»; il controllo rosso è «tablet e PC: ogni schermata nella cornice» con
  `orizzontale 1280x620 / menu: non ci si arriva: page.waitForSelector: Timeout 8000ms exceeded.`
  (log del job 121677234786). Il sito pubblicato serve la 1.21.25 (bundle `index-pCaA_udg.js`,
  stesso nome della build della CI). `CLAUDE.md`, «Rilasciare una versione», punto 4: «Con anche
  un solo rosso non si pubblica».
- **Riprodotto**: contro il sito pubblicato, 2 corse complete su 2, stesso difetto. Con
  `PLINTO_SCHERMI=orizzontale,testo` è verde. Schermata del momento: il pezzo è appoggiato, il
  menu non si è aperto (`10-1280x620-gate-menu-non-aperto.png`).
- **Causa misurata**: è il «tocco perso dopo un trascinamento» già descritto nel rapporto PO-035,
  con un margine che a 1280×620 non basta. Il gate aspetta 1000 ms dopo l'appoggio
  (`tests/e2e/schermi.mjs`, `appoggiaColDito`). Prova isolata (5 tentativi per riga, pezzo
  trascinato col dito con 12 movimenti senza pausa e appoggiato, poi tocco su «Menu»):

  | formato | 200 ms | 500 ms | 1000 ms | 1500 ms |
  |---|---|---|---|---|
  | 360×640 | 0/5 | 5/5 | 5/5 | 5/5 |
  | 915×412 | 1/5 | 3/5 | 5/5 | 5/5 |
  | 1024×600 | 1/5 | 3/5 | **4/5** | 5/5 |
  | 1280×620 | 2/5 | 4/5 | **4/5** | 5/5 |

  Nei tocchi persi arrivano `pointerdown` e `pointerup` sul pulsante del menu (lo stesso nodo,
  attaccato al documento), ma non il `click`.
  **Non è PLINTO**: la stessa sequenza su una pagina minima scritta da me (un `div` con
  `touch-action: none`, un `button`, niente React) perde il click: a 1024×600 0/5 a 200 ms,
  **0/5 a 1000 ms**, 5/5 a 1500 ms; a 360×640 0/5 a 200 ms, 5/5 a 1000 ms. E **sparisce se il dito
  si ferma prima di staccarsi** (6 movimenti nello stesso punto a 50 ms l'uno): pagina minima 5/5
  a 200, 1000, 1500 ms; PLINTO 5/5 a 200 e 1000 ms a 1024×600, 1280×620, 360×640. È un
  comportamento del Chromium di prova verso un rilascio veloce sintetico (più lungo il
  trascinamento, più lunga l'attesa); il mio percorso da revisore, ripetuto a 1024×600 con il dito
  che si ferma, chiude con 0 difetti. Se su un telefono vero un tocco subito dopo un trascinamento
  veloce venga perso **non posso confermarlo**.
- **Perché è E e non O**: per il gioco la misura dice «non è un difetto», ma la regola del progetto
  dice che con la CI rossa non si pubblica, e il verdetto che conta è quello della CI. Finché il
  gate resta così, ogni versione prossima rischia lo stesso rosso.
- **Opzioni**:
  1. **(consigliata)** Nel gate, il dito si ferma sul punto d'arrivo prima del `touchEnd` (la
     stessa pausa misurata qui), in `appoggiaColDito` e nelle due copie di `trascinaColDito` di
     `schermi.mjs`. Prima di fidarsi: far fallire la prova di proposito, per esempio spegnendo
     `GIOCO_IN_ORIZZONTALE`, e rifare la CI.
  2. Portare l'attesa dopo il trascinamento da 1000 a 2000 ms. Più semplice, ma l'attesa dipende
     dalla lunghezza del trascinamento (misurato: 1500 ms bastano oggi, con 5 tentativi soli).
  3. Lasciare il gate com'è e far ripartire la CI. **Sconsigliata**: 3 corse complete su 3 (CI e
     due mie) hanno dato lo stesso rosso.

## D — difetti misurati

### D1. Col dito, rilasciando in fretta su un telefono lento, il pezzo può andare a finire nel posto di prima

- **Misura**: livello 1 a 360×640, giocato col dito con la sequenza vincente, controllando dopo
  ogni mossa che le caselle piene a schermo coincidano con quelle del motore. CPU normale: 4
  partite su 4 superate. **CPU 4x: 1 su 4**; nelle altre la griglia diverge alla mossa 8, 11, 9 (3 o
  6 caselle diverse). CPU 4x col dito che si ferma prima di staccarsi: 3 su 3 superate. CPU 4x a
  640×360 e 412×915 (caselle di 36 e 42 px invece di 27): 3 su 3 per formato. Nella corsa
  completa del percorso da revisore (altri processi in parallelo) il livello 1 a 360×640 è finito
  «Livello non superato» dopo 14 mosse (il mio controllo non l'ha segnalato perché cercava
  `/superato/` e trovava anche «non superato»; corretto dopo).
- **Dove nasce (dal codice)**: `src/ui/useTrascinamento.js:137-145`: al `pointerup` la posizione
  si prende da `presoRef.current`, che si aggiorna solo quando React ridisegna
  (`useTrascinamento.js:73`), non dalle coordinate del `pointerup`. Se l'ultimo `pointermove` non è
  ancora stato disegnato, il pezzo va dove era un movimento prima. Il file non cambia da
  `4746b7d`: **non è una novità della 1.21.25**.
- **Limiti**: i miei movimenti sono 12 salti da 30–40 px; un dito vero manda molti movimenti piccoli
  e quasi sempre rallenta prima di staccarsi. Quanto succeda su un telefono vero **non posso
  confermarlo**. Non è un «non risponde»: il pezzo si appoggia, a volte nel posto sbagliato.
- **Opzioni**:
  1. **(consigliata)** In `rilascia`, calcolare riga e colonna dalle coordinate dell'evento
     `pointerup` (stessa formula di `muovi`), con un test che riproduca il rilascio veloce.
  2. Aggiornare `presoRef.current` dentro `muovi`, insieme a `setPreso`.
  3. Non cambiare niente e provare sul telefono del PO, con un telefono economico, trascinando
     svelto sulle caselle da 27 px di un livello.

### D2. In orizzontale il pannello degli attrezzi si apre già scorso in fondo

- **Misura**: a 640×360 e 915×412 il pannello (alto più dello schermo, quindi ora scorre grazie a
  `VELI_CHE_SCORRONO`) si apre con il contenuto scorso fino in fondo: corsa 216 e 164 px, titolo,
  numero dei gettoni e «La carriola» fuori vista; si vedono gessetto, piccone, mensola e «Torna alla
  partita» (`03-640x360-pannello-attrezzi.png`). Col dito si risale (provato: lo scorrimento
  funziona), e tutti i comandi sono raggiungibili.
- **Dove nasce**: `src/ui/Attrezzi.jsx:161`, `torna.current?.focus()` senza `preventScroll`: il
  browser porta in vista il pulsante che riceve il fuoco, l'ultimo del pannello. In verticale il
  pannello non scorre e non si vede niente. È una conseguenza nuova della 1.21.25, perché prima il
  pannello non scorreva.
- **Opzioni**:
  1. **(consigliata)** `focus({ preventScroll: true })` e pannello che si apre dall'alto; il
     fuoco resta su «Torna alla partita» per chi usa la tastiera.
  2. Dare il fuoco al primo attrezzo invece che a «Torna alla partita» (cambia l'abitudine da
     tastiera fissata con `PANNELLO_COME_IL_MENU`).
  3. Lasciare com'è: chi apre il pannello vede comunque tre attrezzi e può scorrere.

## O — osservazioni

### O1. Tablet verticale 800×1280: griglia di 426 px, metà della larghezza

Il gioco sta nella colonna da 430 px anche a 800×1280 (`06-800x1280-libera.png`): griglia 426
px, casella 44 px, molto vuoto ai lati. È voluto («In verticale, sui tablet e sui PC non cambia
niente», CHANGELOG 1.21.25) e i pezzi si appoggiano. Un revisore su tablet vede un gioco piccolo,
non un gioco fermo.
Opzioni: 1. **(consigliata)** lasciare, e decidere dopo l'esito della revisione; 2. estendere la
griglia larga ai tablet verticali; 3. allargare solo la colonna fino a 600 px.

### O2. Fine del livello in orizzontale: «Mosse» tagliato dal pulsante fisso

A 640×360 la schermata della vittoria scorre (corsa 335 px) e il pulsante «Livello successivo»
copre il riquadro delle mosse alla prima vista (`02-640x360-fine-livello-1.png`); tutto è
raggiungibile scorrendo. Già scritto nel rapporto PO-035, «Cose trovate, non corrette».
Opzioni: 1. **(consigliata)** lasciare finché la revisione è aperta; 2. fine del livello in due
colonne in orizzontale; 3. pulsante non fisso in orizzontale.

### O3. A 360×640 le caselle dei livelli sono di 27–29 px

Partita libera 356 px (casella 36), livello 1 275 px (27), livello 13 287 px (29): la barra
dell'obiettivo e «Prossimi tre pezzi» tolgono altezza. Si gioca (3 pezzi su 3 appoggiati, livello
vinto), ma è il formato in cui nasce D1.
Opzioni: 1. **(consigliata)** nessuna azione ora, misurare di nuovo dopo D1; 2. ridurre la barra
dell'obiettivo sotto i 700 px di altezza; 3. togliere «Prossimi tre pezzi» sotto una certa altezza.

### O4. «Salta per ora» e «Non mostrarmela più» sono alti 15 px

Su tutti e sei i formati, nella guida al primo avvio (`08-360x640-guida-1.png`). Rispondono al
tocco nel mio percorso; sotto i 24 px che il gate usa altrove come soglia. È la prima schermata che
vede un revisore.
Opzioni: 1. **(consigliata)** area toccabile di almeno 44 px con un'imbottitura, senza cambiare
il disegno; 2. trasformarli in pulsanti secondari; 3. lasciare.

### O5. Un errore di rete nella seconda corsa di `e2e-schermi`

`orizzontale 915x412 / console: Failed to load resource: net::ERR_CONNECTION_CLOSED`, una volta
in due corse, solo contro il sito remoto attraverso il proxy del container. Che sia la rete del
container e non GitHub Pages **non posso confermarlo**; nella CI (server locale) non c'è.
Opzioni: 1. **(consigliata)** nessuna; 2. ripetere la prova se ricompare.

### O6. Il gate, contro il sito, cerca un Chromium che qui non c'è

`tests/e2e/schermi.mjs:44-46` usa `/opt/pw-browsers/chromium-1194/...`; in questo container c'è
`chromium-1243` e il collegamento `/opt/pw-browsers/chromium`. Ho passato `PLINTO_CHROMIUM`.
Opzioni: 1. **(consigliata)** provare prima `/opt/pw-browsers/chromium`; 2. lasciare.

## Che cosa non ho potuto verificare

- L'app Android (TWA, pacchetto 11915): niente SDK né emulatore qui. Tutto il collaudo è sul
  sito, in Chromium con tocco emulato.
- La dimensione dei caratteri di Android dentro la TWA (il «testo ×2» del gate è una simulazione).
- Tocco perso e pezzo nel posto sbagliato su un telefono vero (E1, D1).

## Schermate (`docs/sviluppo/collaudo-1.21.25/`)

| file | che cosa |
|---|---|
| `01-640x360-libera.png` | partita libera in orizzontale: griglia a tutta altezza, pezzi a destra |
| `02-640x360-fine-livello-1.png` | vittoria del livello 1 giocato col dito (O2) |
| `03-640x360-pannello-attrezzi.png` | pannello degli attrezzi aperto già in fondo (D2) |
| `04-915x412-livello-1.png` | livello 1 in orizzontale |
| `05-1024x600-livello-13.png` | livello 13 con attrezzi e «Prossimi tre pezzi» |
| `06-800x1280-libera.png` | tablet verticale, colonna da 430 px (O1) |
| `07-640x360-home.png` | home in orizzontale (scorre di 163 px) |
| `08-360x640-guida-1.png` | primo passo della guida, installazione pulita (O4) |
| `09-1024x600-tocco-perso-attrezzi.png` | tocco sugli attrezzi 1 s dopo un appoggio, senza risposta (E1) |
| `10-1280x620-gate-menu-non-aperto.png` | lo stesso nel gate, `e2e-schermi` (E1) |

## Sintesi

**Nel gioco pubblicato non ho trovato niente che un revisore possa leggere come «app che non risponde».** Tutto si apre, tutto scorre col dito fino in fondo, ogni pulsante risponde in meno di 70 ms, nessun long task supera i 200 ms con CPU 4x, e il livello 1 si vince col dito in tutti e sei i formati. L'unico tocco senza risposta (E1) si ripete identico su una pagina minima senza PLINTO, quindi viene dal tocco emulato di Chromium e non dal gioco; su un telefono vero **non posso confermarlo**. Da sistemare prima della prossima versione: la CI della 1.21.25 è rossa (E1), il pezzo può finire nel posto sbagliato su un telefono lento (D1) e il pannello degli attrezzi in orizzontale si apre già in fondo (D2).
