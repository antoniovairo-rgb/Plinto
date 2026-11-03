# Rapporto PO-040 — dopo la Torre (collaudo 1.22.0: O1–O6, D1)

Figlia, 3 novembre 2026, ramo `po040-dopo-torre` (da `main` a `f00775e`, la 1.22.0 pubblicata).
Niente su `main`, nessun cambio di versione, `android/` non toccato. Fonti:
`docs/sviluppo/COLLAUDO-1.22.0.md` (ramo `collaudo-1.22.0`) e le righe del 3 novembre di
`docs/DECISIONI.md` (O1 e O2 del PO; D1, O3, O4, O5, O6 della madre). Chromium di prova:
`/opt/pw-browsers/chromium`, headless. Le prove nel browser girano sul server di sviluppo (Vite),
salvo quelle del gate che costruiscono e servono la build da sole.

## In breve

| punto | fatto | interruttore | controllo | spento | acceso |
|---|---|---|---|---|---|
| **O1** avviso della Torre a chi ha il Ponte finito | finestra in home, una volta sola | `AVVISO_TORRE` (`src/ui/App.jsx`) | `npm run e2e-torre-aperta` (nuovo) | rosso, 4 problemi | verde |
| **O2** schede «Ponte / Torre» ferme in cima | `position: sticky`, conteggio nella scheda chiusa, frecce | `SCHEDE_FISSE` (`src/ui/schermate/Quadri.jsx`) | `npm run e2e-torre-aperta`, 24 formati | rosso, 77 problemi | verde |
| **O3** niente riga sotto gli atti dell'opera chiusa | sì | `ATTI_SENZA_RIGA_SE_CHIUSA` (`Quadri.jsx`) | `npm run e2e-torre-aperta` | rosso, 1 problema (7 atti) | verde |
| **O4** festa coricata | pulsanti a destra, riepilogo a tutta altezza | `TRIONFO_CORICATO` (`src/ui/schermate/Trionfo.jsx`) | `npm run e2e-trionfo`, caso coricato nuovo | rosso, 20 problemi | verde |
| **O5** annunci: singolari e «!» | sì | `ANNUNCI_ACCORDATI` (`src/ui/Annunci.jsx`) | `tests/annunci.test.js` (nuovo) | rosso, 6 su 6 | verde |
| **O6** gettoni con salvataggio importato | **riprodotto** col flusso vero; frase unica | `GETTONI_PERSI_IN_UNA_FRASE` (`src/ui/schermate/FineQuadro.jsx`) | `tests/gettoni-persi.test.js` (nuovo), `npm run correzioni` (caso O6 nuovo) | rosso: 2 su 4 e 4 problemi | verde |
| **D1** anteprima dei collegamenti | «200 livelli» in `og:description` e `twitter:description` | — (testo puro) | `tests/anteprima-collegamento.test.js` (3 casi nuovi) | rosso col testo di prima, 2 su 2 | verde |

«Spento» vuol dire l'interruttore a `false` con tutto il resto uguale (per O4 la misura «prima» è
stata presa prima di scrivere la regola, che equivale; per D1 col testo vecchio).

## O1 — La Torre è aperta (decisione del PO)

**Dove: tre opzioni, ho fatto la prima.**

1. **(fatta, consigliata) Una finestra sopra la home**, alla prima apertura della home in cui le
   condizioni valgono. È la stessa finestra delle conferme (`ConfermaPerdita`): fuoco sul pulsante
   pieno, Esc, tocco fuori e Indietro di Android la chiudono. Due pulsanti: «Entra nella Torre»
   (apre la mappa sulla scheda della Torre) e «Non ora». Pregio decisivo: **non allunga la home**,
   che a 360x640 non deve scorrere (`npm run impaginazione`, `npm run home-spiegazione`); chi preme
   subito «Livello 101» la vede comunque, perché la home è la prima schermata.
2. Un riquadro dentro la home sopra le card: più discreto, ma a 360x640 la home scorrerebbe
   proprio per chi lo deve leggere (la home è al limite, `HOME_BASSA_COMPATTA` in `Home.jsx`).
3. Un riquadro in cima alla mappa, all'apertura: non lo vede chi entra nel 101 dal pulsante grande
   della home senza passare dalla mappa.

**Quando compare:** Ponte finito (`quadroSbloccato(101)`), nessun livello della Torre superato
(`superatiNellOpera(torre) === 0`), guida già vista o saltata, nessun'altra finestra aperta,
`impostazioni.avvisoTorre` falso. Si segna come visto **nel momento in cui si mostra** («una volta
sola» anche se si chiude senza scegliere).

**Testo:** titolo «La Torre» (`opere.torre`), testo «La Torre è aperta: altri cento livelli e una
regola nuova, i massi.» (`avvisoTorre.testo`, nuova chiave: quella esistente
`trionfo.aperta.torre` comincia con «È aperta:» perché nella festa segue il nome dell'opera),
pulsante «Entra nella Torre» (`trionfo.vai.torre`, la stessa della festa), «Non ora» (nuova). In
inglese «The Tower is open: a hundred more levels and a new rule, the boulders.», «Enter the
Tower», «Not now». «cento» è scritto in lettere come voleva il PO; `tests/avviso-torre.test.js`
(nuovo) controlla che la parola in lettere, in `avvisoTorre.testo` e in `trionfo.aperta.torre`, it ed
en, sia `livelliDellOpera(torre)`. Che sappia fallire lo prova un suo caso («duecento» → 200); non
l'ho fatto fallire cambiando il numero dei livelli.

**Dove si ricorda:** `plinto:settings`, campo `avvisoTorre` (predefinito `false` in
`src/state/useImpostazioni.js`). Compatibile all'indietro: un documento di una versione precedente
non ha il campo e lo legge come «non ancora» (`leggiDocumento` fonde sopra i predefiniti); una 1.22.0
che legge un documento col campo lo conserva (stessa funzione, campi sconosciuti mantenuti).
Esportazione: il campo esce nel file con le impostazioni. Importazione: con «Sostituisci tutto»
arriva (provato nel browser: file con `avvisoTorre: true` e Ponte finito → nessuna finestra); con
«Unisci» le impostazioni restano quelle del telefono, come già per lingua e audio
(`SOLO_SE_SOSTITUISCI`, `src/persistence/salvataggio.js`).

**Chi finisce il Ponte giocando:** la festa del Ponte chiama `onMostrata` e scrive
`avvisoTorre: true`. Provato vincendo il 100 col trascinamento: festa sì, poi in home nessuna
finestra, né subito né ricaricando.

**Misure (`npm run e2e-torre-aperta`, 360x640):** it e en: finestra presente, testo giusto, fuoco su
«Entra nella Torre», tocco → mappa con la scheda «La Torre» scelta; ricarica → nessuna finestra.
«Non ora» → chiusa, e non torna andando in mappa e tornando. Nessuna finestra con 101 superato, con
99 su 100, con 0 livelli. Schermate: `po040/o1-prima-home-ponte-finito-360x640-it.png`,
`po040/o1-dopo-avviso-360x640-{it,en}.png`, `po040/o1-dopo-mappa-torre-360x640-it.png`.

**Effetto da sapere:** chi ha finito il Ponte giocando **sulla 1.22.0** (dal 2 novembre) ha visto la
festa, ma il campo non esisteva: se non ha ancora superato il 101 vedrà anche la finestra, una
volta. Quanti siano **non posso confermarlo**.

## O2 — Le schede in vista (decisione del PO)

- `.pl-opere-fila` (nuovo involucro della `tablist`) è `position: sticky; top: 0` dentro
  `.pl-scroll`, da bordo a bordo, con fondo `--pl-ink` all'88% e sfocatura 10 px. Il primo
  tentativo con fondo pieno dentro i margini di 20 px si leggeva come un riquadro scuro appoggiato
  sul fondo della pagina (visto in schermata): l'ho allargato a barra.
- La scheda chiusa ha una seconda riga piccola: «mancano 43 livelli» / «manca 1 livello» (en «43
  levels to go» / «1 level to go»), lo stesso conto del riquadro sotto le schede.
- Tastiera: le schede seguono il modello ARIA (che c'era già come `role="tablist"`/`"tab"`, ma
  senza frecce): una sola scheda nel giro del Tab (`tabIndex` 0 sulla scelta, −1 sulle altre),
  frecce sinistra/destra, Inizio e Fine cambiano scheda e spostano il fuoco.
- **Trovato durante il lavoro e corretto:** con le schede ferme, «La Torre» si tocca anche dal
  livello 58, e la Torre si apriva scorsa a metà: il riquadro «Te ne mancano 43» era a −609 px.
  Adesso cambiando scheda si va al livello corrente se sta in quell'opera, altrimenti in cima
  (controllo nuovo; senza l'effetto rosso, con l'effetto verde).

**Misure, 57 livelli superati, mappa appena aperta** (schede, in px dall'alto della finestra):

| formato | prima (`SCHEDE_FISSE` spento) | dopo | testata | tappa corrente (dopo) |
|---|---|---|---|---|
| telefono 360x640 | −745 / −697 | 70 / 118 | 64 | 329–375 |
| telefono 412x915 | −536 / −488 | 70 / 118 | 64 | 466–512 |
| telefono 320x700 | −823 / −775 | 70 / 118 | 64 | 359–405 |
| telefono 375x667 | −714 / −666 | 70 / 118 | 64 | 342–388 |
| tablet 768x1024 (mouse e tocco) | −481 / −433 | 122 / 170 | 116 | 521–567 |
| tablet 1024x768 (mouse e tocco) | −609 / −561 | 101 / 149 | 95 | 393–439 |
| tablet 1024x1366 (mouse e tocco) | −310 / −262 | 293 / 341 | 287 | 692–738 |
| tablet 1366x1024 (mouse e tocco) | −481 / −433 | 122 / 170 | 116 | 521–567 |
| PC 1366x768 | −609 / −561 | 101 / 149 | 95 | 393–439 |
| PC 1920x1080 | −453 / −405 | 150 / 198 | 144 | 549–595 |
| PC 1280x720 | −633 / −585 | 99 / 147 | 93 | 369–415 |
| PC 1366x657 (con barre) | −665 / −617 | 70 / 118 | 64 | 337–383 |
| PC 1920x969 (con barre) | −509 / −461 | 109 / 157 | 103 | 493–539 |
| orizzontale 640x360 | −651 / −603 | 70 / 118 | 64 | 189–235 |
| orizzontale 800x360 | −813 / −765 | 70 / 118 | 64 | 189–235 |
| orizzontale 915x412 | −787 / −739 | 70 / 118 | 64 | 215–261 |
| orizzontale 1024x600 | −693 / −645 | 70 / 118 | 64 | 309–355 |
| orizzontale 1280x620 | −683 / −635 | 70 / 118 | 64 | 319–365 |
| testo x2 360x800 | −936 / −861 | 70 / 200 | 64 | 409–455 |
| testo x2 412x915 | −731 / −683 | 70 / 167 | 64 | 467–513 |

Sono i 13 formati di `e2e-schermi`, i suoi 5 coricati e i 2 «testo x2» (stessa simulazione: ogni
`font-size` per due), più 4 telefoni. In tutti: schede sotto la testata e dentro lo schermo, tappa
corrente non coperta, nessuna sporgenza di lato, schede ancora in cima con la mappa scorsa fino in
fondo. Col testo x2 a 360x800 la fila è alta 130 px (la scheda della Torre va su quattro righe):
si legge, ma è un ottavo dello schermo. Schermate `po040/o2-{prima,dopo}-*.png`.

## O3 — Opera chiusa senza la riga sotto gli atti

Sull'opera chiusa la didascalia «Si apre quando arrivi al livello N» non si scrive; resta il
riquadro «La Torre si apre quando hai superato tutti i livelli del Ponte, ognuno con la spunta. Te
ne mancano 43.». Sull'opera aperta gli atti ancora chiusi la dicono come prima (controllato: con il
Ponte finito, gli atti chiusi della Torre la mostrano). Spento: «7 atti dicono ancora "Si apre
quando arrivi al livello 101"». Schermate `po040/o3-{prima,dopo}-torre-chiusa-360x640.png`.

## O4 — La festa coricata

In orizzontale basso (`orientation: landscape` e `max-height: 620px`, la soglia dei livelli
coricati) `.pl-trionfo--coricabile` è una griglia a due colonne: riepilogo a sinistra a tutta
altezza, pulsanti a destra (220–300 px) in basso. La colonna da 430 px degli schermi larghi e bassi
si toglie con `:has`, come per la partita coricata. Vale per la festa del Ponte e per quella finale.

Caso nuovo in `tests/e2e/trionfo.mjs` (`controllaCoricata`), con la festa già a schermo girata in
5 formati; vuole pulsanti a destra del riepilogo, riepilogo ≥ 90% dell'altezza, pulsanti dentro lo
schermo, numeri interi all'apertura, nessuna sporgenza.

| formato | prima: riepilogo alto / pulsanti | dopo: riepilogo / pulsanti | numeri (dopo) |
|---|---|---|---|
| 640x360 | 204 px, pulsanti sotto (x 110–530) | 0–340, alto 360 / 340–640 | 231–319 |
| 800x360 | 204 px, sotto | 0–500, 360 / 500–800 | 231–304 |
| 915x412 | 256 px, sotto | 0–615, 412 / 615–915 | 231–304 |
| 1024x600 | 444 px, sotto | 0–724, 600 / 724–1024 | 231–304 |
| 1280x620 | 464 px, sotto | 0–980, 620 / 980–1280 | 231–304 |

Uguale per Ponte e Torre. Prima: 20 problemi; dopo: verde. Schermate
`po040/o4-{prima,dopo}-festa-{ponte,torre}-640x360.png`.

## O5 — Annunci per il lettore di schermo

`frasePerMossa` (`src/ui/Annunci.jsx`): il participio si accorda (una riga o colonna → «eliminata»,
un quadrante → «eliminato»; al plurale «eliminate», «eliminati» se c'è un quadrante); «punto» con
1; le frasi si uniscono senza aggiungere il punto dopo «!», «?», «.» o «…». Chiavi nuove
`a11y.eliminata/eliminato/eliminati/punto` in it ed en (in inglese «cleared» resta invariato).
Esempio: «Eccellente! 1 riga eliminata. più 1 punto.». Il «più» minuscolo dopo il punto c'era già:
non l'ho toccato (scelte aperte). `tests/annunci.test.js`: 6 casi, spento 6 rossi, acceso 6 verdi.

## O6 — Gettoni con un salvataggio importato

**Riprodotto col flusso vero.** `npm run correzioni`, caso O6 nuovo: file con 112 livelli superati e
senza `plinto:attrezzi`, scelto con «Scegli un file» in Impostazioni, poi «Unisci ai miei» e, in
un secondo giro, «Sostituisci tutto»; poi il 113 vinto trascinando i pezzi (17 mosse; stesso
giocatore e stessi semi di `npm run livelli`). In tutti e due i modi, prima della correzione:

> Hai guadagnato 3 gettoni per gli attrezzi. Adesso hai 3 gettoni. Avevi già il massimo di 3
> gettoni, quindi 19 gettoni appena guadagnati sono andati persi. Usa un attrezzo per fare posto.

(`plinto:attrezzi` prima della vittoria: assente; dopo: `{disponibili: 3, riscossi: 22}`.) Dopo:

> Hai guadagnato 3 gettoni per gli attrezzi. Adesso hai 3 gettoni. Puoi tenerne al massimo 3: gli
> altri 19 sono andati persi.

La frase nuova (`attrezzi.persiOltre` / `persoOltre`, il 3 viene da `MASSIMO`) vale solo quando
nella stessa vittoria se ne guadagnano e se ne perdono; con il magazzino già pieno resta la frase
di prima, che lì è vera. `riscuoti` non l'ho toccata: pagare tutto alla prima vittoria è voluto
(commento in `src/persistence/attrezzi.js`).

Lo stesso caso, senza importare, può capitare a chi aveva molti livelli superati prima che
esistessero gli attrezzi e vince il primo livello dopo l'aggiornamento: lo deduco dal codice
(`riscuoti` parte da `riscossi: 0`), **non l'ho provato**.

## D1 — L'anteprima dei collegamenti

`index.html:35` e `:44`: «200 livelli, ognuno con il suo obiettivo. …» (in cifre come
nell'immagine «200 livelli»). Il controllo **non è in `npm run anteprima`**: quel comando
(`tests/e2e/anteprima.mjs`) prova l'anteprima della terna nei livelli, non quella dei collegamenti.
L'ho messo dove già si provano i meta dell'anteprima, `tests/anteprima-collegamento.test.js`
(dentro `npm test`): ogni numero davanti a «livelli» nelle due descrizioni, in cifre o in lettere
(cento…quattrocento), deve essere `TOTALE_QUADRI`; un terzo caso prova che sa riconoscere «Cento».
Rosso col testo vecchio (2 su 2), verde col nuovo. Le anteprime già salvate da WhatsApp e simili si
aggiornano quando decidono loro: **non posso confermarlo**.

## Gate a pezzi

GATE_PLACEHOLDER

## Testo per il changelog (proposta, non scritto in `docs/CHANGELOG.md`)

```
## 1.22.1 — Dopo la Torre

Correzioni dal collaudo della 1.22.0 (docs/sviluppo/COLLAUDO-1.22.0.md, rapporto
docs/sviluppo/RAPPORTO-PO-040.md). Solo sito: nessun AAB.

- **La Torre annunciata a chi aveva già finito il Ponte** (O1, scelta del PO). Chi aveva 100 livelli
  su 100 prima della 1.22.0 non vedeva nessuna festa né avviso. Adesso la home mostra una volta
  «La Torre è aperta: altri cento livelli e una regola nuova, i massi.» con «Entra nella Torre».
  Il ricordo sta nelle impostazioni (`avvisoTorre`); la festa del Ponte lo segna, quindi chi finisce
  il Ponte giocando non la vede due volte.
- **Mappa: le schede «Il Ponte / La Torre» restano in cima** (O2, scelta del PO). Misurate a −745 px
  a 360x640 con 57 livelli; adesso a 70 px in 24 formati. La scheda chiusa dice quanti livelli
  mancano; le frecce cambiano scheda.
- **Opera chiusa**: niente più «Si apre quando arrivi al livello 101» sotto gli atti (O3).
- **Festa coricata**: pulsanti a destra, riepilogo a tutta altezza (O4). A 640x360 il riepilogo
  passa da 204 a 360 px e i numeri si vedono all'apertura.
- **Lettore di schermo**: «1 riga eliminata», «più 1 punto», niente «!.» (O5).
- **Gettoni**: guadagnati e persi nella stessa vittoria (salvataggio importato) una frase sola,
  «Puoi tenerne al massimo 3: gli altri 19 sono andati persi.» (O6).
- **Anteprima dei collegamenti**: «200 livelli», come l'immagine (D1).

Misurato: npm test, gate a pezzi (vedi il rapporto), prove rosso/verde di ogni interruttore.
```

## Scelte aperte

1. **O1, titolo della finestra.** «La Torre» sopra «La Torre è aperta: …» ripete il nome. Alternative:
   nessun titolo visibile (ma la finestra ha bisogno di un nome accessibile) o «Novità». Ho lasciato
   «La Torre» perché il testo del PO è stato preso alla lettera.
2. **O1, «cento» in lettere.** Il PO l'ha scritto così, e così è `trionfo.aperta.torre`. La regola
   di `CLAUDE.md` vuole i numeri dalle regole: qui la parola resta scritta a mano, ma un test la lega
   al numero vero. In alternativa «altri {n} livelli» con il numero in cifre.
3. **O1, chi ha finito il Ponte sulla 1.22.0** vedrà la finestra una volta, dopo la festa (sopra).
4. **O2, testo x2:** la fila delle schede alta 130 px a 360x800. Se pesa, la riga «mancano N
   livelli» si può togliere sotto una certa larghezza.
5. **O5:** «più» minuscolo dopo un punto («… eliminata. più 1 punto.»), c'era già.
6. **D1:** `og:image:alt` dice «Il tabellone di PLINTO…»: «tabellone» è una parola scartata dal
   lessico del gioco (`CLAUDE.md`); `tests/lessico.test.js` non guarda `index.html`. Non l'ho toccato
   perché fuori dal compito.
7. **Aiuto:** nessuna di queste modifiche cambia una regola o un numero del gioco, quindi
   `ComeSiGioca.jsx` non l'ho toccato; `tests/aiuto-aggiornato.test.js` è verde.

## Che cosa non ho verificato

- Telefono vero, la TWA, TalkBack (gli annunci di O5 sono provati come testo, non ascoltati).
- Il service worker: le prove nel browser girano senza.
- Il caso O6 senza importazione (aggiornamento da una versione senza attrezzi): dedotto dal codice.
