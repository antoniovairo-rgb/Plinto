# Collaudo 1.22.0 — La Torre

Figlia di collaudo, 2 novembre 2026, ramo `collaudo-1.22.0`. Codice non toccato; qui solo
questo rapporto e le schermate in `collaudo-1.22.0/`.

**Sito collaudato:** https://antoniovairo-rgb.github.io/Plinto/. Il bundle servito
(`assets/index-9k5tVovN.js`) contiene «1.22.0» (4 volte); la home mostra «v1.22.0».
`icon.svg`, `manifest.webmanifest`, `icone/favicon-32.png`, `icone/icona-apple-180.png` e
`anteprima-social.png` pubblicati sono identici byte per byte a quelli di `main` (`90919fa`,
confronto SHA-256).

**Strumenti:** Chromium `/opt/pw-browsers/chromium`. Prove a mano con Playwright,
`hasTouch` e `isMobile`. I pezzi sono trascinati col dito vero, cioè con eventi touch del
protocollo (`Input.dispatchTouchEvent`): la mira si corregge guardando l'anteprima sulla
griglia, poi il dito si ferma e si stacca. I pulsanti si toccano con `touchscreen.tap`.
Formati: 360x640, 412x915, 640x360 e 1024x600, in italiano e in inglese. Le mosse vincenti
dei livelli le calcola lo stesso giocatore artificiale di `tests/e2e/tutti-i-livelli.mjs`
(gli stessi semi), dal sorgente di `main`. Il gioco pubblicato mostra gli stessi massi e
le stesse mosse massime del sorgente (113: 10 massi e 19 mosse; 120: 9 e 14; 150: 9 e 23;
200: 13 e 26).

**Salvataggi finti:** li ho scritti come li scrive il gioco:
`plinto:quadri = {"versione":1,"livelli":{"1":{"mosse":…,"punteggio":…,"tentativi":…},…}}`
(`src/persistence/progressi.js:50`, `src/persistence/storage.js:12`), più
`plinto:settings` con `introVista`.

## 1. Controlli automatici contro il sito pubblicato

`npm ci` pulito. Variabile `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`.

| Comando | Esito | Durata |
|---|---|---|
| `npm run e2e` | verde, «Nessun problema rilevato» (passo 8: pausa 1.562 ms sulla sfida; salto con tocco, Invio, Esc in 27-42 ms) | 49 s |
| `npm run e2e-quadri` | **rosso noto**: «FINE LIVELLO (vittoria): a 320x700 bisogna scorrere di 2 px» (font del container, `docs/TESTING.md`). Il resto è verde, compreso PO-038 perso per mosse (1.647 ms) e perso perché bloccato (1.670 ms, «Nessun pezzo entra» 1) | 22 s |
| `npm run e2e-trionfo` | verde; «festa finale della Torre: mostrata, con l'annuncio senza date» | 49 s |
| `npm run archivio` | verde; 5b e 7 (ricarica nella pausa e dal risultato) vanno alla home senza salvataggio della sfida | 16 s |
| `npm run e2e-schermi` | verde: «Tutto a posto su 13 formati, 5 coricati e 2 col testo x2 e 2 coi lanci» | 758 s |
| `npm run e2e-po008` | verde: «94 tentate, 0 ritentate, 0 non fatte» | 223 s |
| `npm run indietro` | verde | 13 s |
| `npm run guida` | verde («Non mostrarmela più» 45 px anche a 640x360) | 16 s |

**Totale: 7 verdi su 8.** L'unico rosso è quello noto, già annunciato nella consegna.

## 2. Prove a mano

### 2.1 Utente che aggiorna: il Ponte finito, 100 su 100

Il salvataggio ha i livelli 1-100 con la spunta. Ho ricaricato la pagina in 8 combinazioni
(4 formati × it/en), e poi ricaricato una seconda volta.

| Domanda | Risposta misurata |
|---|---|
| La scheda della Torre è aperta? | **Sì**, in 8 combinazioni su 8: niente lucchetto e scheda scelta all'apertura della mappa. La tappa 101 è aperta, le altre 99 sono chiuse. La home dice «LIVELLO 101» e «Mappa dei livelli, La Torre: 0 di 100» (in inglese «LEVEL 101», «The Tower: 0 of 100»). |
| La festa del Ponte compare? | **No**: nessun `.pl-trionfo` né alla prima apertura né dopo la seconda ricarica, in 8 combinazioni su 8. Vedi O1. |
| I progressi del Ponte sono intatti? | **Sì**: la mappa `livelli` è identica byte per byte prima e dopo le due ricariche, in 8 combinazioni su 8. |
| Errori in console | 0 |

Schermate: `s1-ponte-finito-{home,mappa,scheda-torre}-<formato>-<lingua>.png`.

### 2.2 Utente a metà Ponte

Misure a 360x640, in it e in en; il caso dei 57 livelli anche negli altri 3 formati.

| Salvataggio | Home | Scheda Torre (toccata) | Numero giusto? |
|---|---|---|---|
| 1-57 superati | «LIVELLO 58», «Il Ponte: 57 di 100» | lucchetto; «… Te ne mancano 43.» / «43 to go.» | sì (100−57) |
| 1-49 e 51-99 superati, il 50 con 8 tentativi | «LIVELLO 50», «98 di 100» | «Te ne mancano 2.» / «2 to go.» | sì (manca il 50, e il 100 che resta chiuso) |
| nessun livello | «LIVELLO 1», «0 di 100» | «Te ne mancano 100.» | sì |

La scheda chiusa si può toccare. Mostra le tappe della Torre spente e il riquadro
«La Torre si apre quando hai superato tutti i livelli del Ponte, ognuno con la spunta.»
Non ho trovato nessun caso in cui la Torre si apra prima del tempo. Vedi O2 e O3.

### 2.3 Un livello della Torre vinto col dito, con la pausa

| Livello | Formato | Mosse | Pausa: dopo 250 ms | Risultato dopo | Salvato |
|---|---|---|---|---|---|
| 113 (10 massi) | 360x640 it | 17 di 19 | velo della pausa sì, risultato no; «Nessun pezzo entra» assente (giusto, è una vittoria) | 1.527 ms | `{mosse:17, punteggio:279, tentativi:1}` |
| 113 | 412x915 en | 17 | uguale | 1.805 ms | uguale |
| 150 (9 massi) | 640x360 it | 20 di 23 | uguale | 1.632 ms | `{20, 340, 1}` |
| 120 (9 massi) | 1024x600 en | 11 di 14 | uguale | 1.707 ms | `{11, 149, 1}` |

Tutte le mosse sono state accettate al primo trascinamento. L'esito sta nello schermo senza
scorrere in tutti e quattro i formati. Le misure comprendono il tempo della cattura dello
schermo e sono state prese con altre prove in corso sulla macchina. Schermate:
`s3-vinci-*-{inizio,pausa,esito}.png`.

### 2.4 Un livello perso: «Nessun pezzo entra»

La sequenza che blocca la griglia l'ho cercata col motore e poi giocata col dito.

| Livello | Formato | Dopo 250 ms | Salto | Esito |
|---|---|---|---|---|
| 113 | 360x640 it | pausa sì; «Nessun pezzo entra» sotto la griglia; 1 pezzo spento; annuncio «… Partita finita. Nessun pezzo entra. Punteggio 42.» | attesa: risultato dopo 2.006 ms | «Livello non superato · Nessun pezzo entra più sulla griglia.» |
| 150 | 412x915 en | uguale («No piece fits») | tocco sulla griglia: 141 ms | «Level failed · No piece fits on the grid any more.» |
| 101 | 640x360 it | uguale | tocco: 35 ms | «Livello non superato …» |

Schermata: `s3-perdi-113-360x640-it-pausa.png`. Il valore di 2.006 ms supera di 500 ms la
durata della pausa (`DURATA_PAUSA_FINE = 1500`, `src/ui/App.jsx:138`). È stato misurato
con il carico di altre prove in parallelo, e `e2e-quadri` lo stesso caso lo misura
1.670 ms. Che sia solo il carico **non posso confermarlo**.

### 2.5 Il pannello degli attrezzi su un livello della Torre

| Formato | Pannello | Scorrimento all'apertura | Fuoco | Chiusura |
|---|---|---|---|---|
| 640x360 it (113) | 24-336 px, largo 340 | `scrollTop` 0 di una corsa di 232 px (544−312) | «Torna alla partita» | con il tocco, chiuso |
| 640x360 en (150) | 24-336 px | 0 (corsa 222 px) | «Back to the game» | chiuso |
| 1024x600 it (113) | 28-572 px | niente da scorrere | «Torna alla partita» | chiuso |
| 360x640 it (113) | 30-610 px | niente da scorrere | «Torna alla partita» | chiuso |

Il testo del piccone dice «tranne i massi». Schermate: `s3-attrezzi-*-pannello{,-fondo}.png`.

### 2.6 L'ultimo livello (200) e la festa finale

Salvataggio: livelli 1-199 superati. Il 200 l'ho vinto col dito (25 mosse di 26) a
360x640 it, 412x915 en e 640x360 it.

- La pausa c'è (risultato dopo 1.523-1.664 ms), poi arriva la festa finale: «La Torre è
  finita. 100 livelli, dal primo all'ultimo.» (in inglese «The Tower is finished.»).
  Mostra i numeri, «E adesso? Altri livelli sono in lavorazione…» e i pulsanti
  «Condividi il traguardo», «Gioca in partita libera», «Torna ai livelli». Il 200 è salvato
  come `{mosse:25, punteggio:637, tentativi:1}`.
- Ricaricando, la festa non torna e la home dice «LIVELLO 200».
- A 640x360 la festa si vede solo in parte: vedi O4.

### 2.7 La festa del Ponte, dal livello 100

Salvataggio: livelli 1-99 superati. Il 100 l'ho vinto col dito a 360x640 it e a
1024x600 en.

- Compare «Il Ponte è finito.» con «Entra nella Torre» / «Enter the Tower». Toccandolo si
  apre la presentazione del livello 101, «Il basamento».
- Con Indietro si torna alla mappa della Torre, non alla festa. Ricaricando, la festa non
  torna e la home dice «LIVELLO 101». **La festa compare una volta sola.**

### 2.8 Partita libera e sfida: pausa, salto, ricarica

Partite giocate col dito fino a «nessun pezzo entra»: la sequenza l'ho calcolata dallo
stato salvato all'avvio, con lo stesso motore.

| Modo | Formato | Pausa (250 ms) | Come finisce | Dopo la ricarica |
|---|---|---|---|---|
| libera | 360x640 it | pausa sì, «Nessun pezzo entra», pezzi spenti 2 su 2 | tocco: 40 ms, menu non aperto | home, nessuna plancia |
| libera | 412x915 en | sì | attesa: 1.787 ms | home |
| libera | 640x360 it | sì | tocco: 46 ms | home |
| libera | 1024x600 en | sì | tocco: 111 ms | home |
| sfida | 360x640 it | sì; ancora `#/sfida/2026-11-02` durante la partita, vuota già nella pausa | tocco: 43 ms | **home**, ancora vuota, `plinto:partita-sfida` assente, «Sfida del giorno, Record 46», archivio (`plinto:sfide`) identico |
| sfida | 412x915 en | sì | attesa: 1.636 ms | home, come sopra |
| sfida | 1024x600 en | sì | tocco: 77 ms | home, come sopra |
| sfida | 640x360 it e 360x640 en | sì | **ricarica durante la pausa** | home, nessuna plancia, nessun risultato, ancora vuota |

La home dopo la sfida finita non propone «Riprendi la sfida». Errori in console in tutte le
prove a mano: 0.

## 3. Che cosa ho trovato

Nessun **E** (crash, blocco, perdita di dati): non ne ho trovati.

### D1 — L'anteprima dei collegamenti dice ancora «Cento livelli»

`index.html:35` (`og:description`) e `index.html:44` (`twitter:description`), serviti così
dal sito pubblicato: «Cento livelli, ognuno con il suo obiettivo…». Nello stesso riquadro
l'immagine `anteprima-social.png` (pubblicata) dice «200 livelli e una sfida ogni giorno».
Chi incolla il link su WhatsApp o Telegram legge due numeri diversi. Opzioni:

1. **(consigliata)** Riscrivere le due descrizioni con «Duecento livelli» o senza numero
   (per esempio «Livelli con un obiettivo ciascuno…»). Poi la prova `npm run anteprima`
   con il testo nuovo, e un controllo che il numero nel testo venga dal totale dei livelli.
2. Togliere il numero solo dal testo e lasciarlo nell'immagine.
3. Lasciare così: no, perché il testo pubblico smentisce l'immagine.

Le anteprime già salvate da WhatsApp/Facebook si aggiornano quando decidono loro: **non
posso confermarlo** da qui.

### O1 — Chi aveva già finito il Ponte non vede mai la festa che apre la Torre

Misurato al § 2.1: con 100 su 100 nel salvataggio, nessuna festa né all'apertura né dopo.
È voluto dal codice: la festa si mostra solo se l'ultima vittoria ha completato l'opera
(`percorso.completo && appenaVinto?.primaVolta`, `src/ui/App.jsx:741`). A chi aggiorna la
novità la dicono solo «LIVELLO 101» e «La Torre: 0 di 100» in home. Non ho trovato una
decisione scritta su questo caso, né in `docs/DECISIONI.md` né in `docs/USCITA-TORRE.md`
(solo «Nessuno resta bloccato», riga 96). Quanti giocatori abbiano il Ponte finito **non
posso confermarlo**. Opzioni:

1. **(consigliata)** Un avviso, una volta sola, in home o all'apertura della mappa per chi
   ha il Ponte finito e 0 livelli della Torre: «La Torre è aperta: altri cento livelli e
   una regola nuova, i massi.» (il testo c'è già, `trionfo.aperta.torre`,
   `src/i18n/it.js:350`), con un pulsante «Entra nella Torre».
2. Mostrare una volta la festa del Ponte intera al primo avvio dopo l'aggiornamento.
   Rischio: festeggiare una cosa fatta settimane prima, senza l'ultima mossa davanti.
3. Lasciare così, e scriverlo come decisione.

### O2 — Nella mappa le schede delle opere non si vedono all'apertura

All'apertura la mappa scorre al livello corrente (`src/ui/schermate/Quadri.jsx:85`,
`scrollIntoView({ block: 'center' })`). Le schede e il riquadro «Te ne mancano N» restano
sopra lo schermo. Misura con 57 livelli superati: schede a −741 px (360x640), −532 px
(412x915), −647 px (640x360), −689 px (1024x600). Con il Ponte finito, a 640x360 sono a
−53 px. Chi è a metà Ponte non vede che la Torre esiste, né quanto manca, se non scorre
fino in cima. Opzioni:

1. **(consigliata)** Lasciare lo scorrimento al livello corrente e fissare la fila delle
   schede in alto (`position: sticky`), con il conteggio «Te ne mancano N» dentro la
   scheda chiusa.
2. Aprire la mappa dall'alto e scorrere solo toccando «vai al livello corrente».
3. Lasciare così.

### O3 — Sulla Torre chiusa due condizioni diverse una sotto l'altra

Con la Torre chiusa, sotto il riquadro «… ognuno con la spunta. Te ne mancano 43.»,
l'atto «Il basamento» dice «Si apre quando arrivi al livello 101» (`quadri.attoDaAprire`,
`src/ui/schermate/Quadri.jsx:240`). Schermata: `s1-meta-57-scheda-torre-360x640-it.png`.
Sono due regole in due parole diverse, e per un bambino «arrivi al 101» non dice che
servono tutte le spunte. Opzioni:

1. **(consigliata)** Sull'opera chiusa non scrivere la riga sotto gli atti: basta il
   riquadro.
2. Una frase per l'atto di un'opera chiusa: «Si apre con la Torre».
3. Lasciare così.

### O4 — La festa finale coricata (640x360): all'apertura si vede solo il titolo

`s3-festa-200-640x360-it-esito.png`. La parte che scorre (`.pl-trionfo__dentro`) è alta
204 px; i pulsanti ne prendono 156 (204-360). I numeri cominciano a 231 px, quindi sotto i
pulsanti. Il riquadro del titolo è tagliato in basso. Col dito, nella parte alta, scorre
(`scrollTop` 272 di 392, `s3-festa-200-640x360-it-scorsa.png`); se il dito parte sui
pulsanti, non scorre niente. A 360x640 l'area è di 484 px e i numeri sono a 231-319 px:
si vedono. La festa del Ponte coricata non l'ho misurata. Opzioni:

1. **(consigliata)** In orizzontale mettere i pulsanti a destra, come la plancia nei
   livelli coricati, e lasciare il riepilogo a sinistra a tutta altezza. Aggiungere il
   caso coricato a `e2e-trionfo`.
2. Pulsanti più bassi e più compatti in orizzontale.
3. Lasciare così: si legge scorrendo.

### O5 — Annunci per il lettore di schermo: tre errori di lingua (non nati con la 1.22.0)

Visti nell'annuncio della pausa (`[role="status"]`):

- «1 riga eliminate», «1 riga, 1 quadrante eliminate»: la parola `a11y.eliminate` è unica
  per singolare e plurale (`src/ui/Annunci.jsx:47`, `src/i18n/it.js:655`);
- «più 1 punti», «più 2 punti»: `a11y.punti` sempre plurale (`Annunci.jsx:50`);
- «Eccellente!. 1 riga…»: il punto si aggiunge dopo il punto esclamativo (`Annunci.jsx:55`).

Opzioni:

1. **(consigliata)** Le forme singolari («eliminata», «punto») e niente punto dopo «!»,
   con un caso in un test unitario.
2. Riscrivere l'annuncio senza accordo («Eliminati: 1 riga»).
3. Lasciare così.

Da quale versione ci siano questi errori **non l'ho verificato**.

### O6 — Messaggio dei gettoni che si contraddice (solo col mio salvataggio finto)

Con un salvataggio che ha 112 livelli superati e nessun documento `plinto:attrezzi`, al
113 vinto l'esito dice: «Hai guadagnato 3 gettoni per gli attrezzi. Adesso hai 3 gettoni.
Avevi già il massimo di 3 gettoni, quindi 19 gettoni appena guadagnati sono andati
persi.» Viene da `riscuoti` (`src/persistence/attrezzi.js`), che paga tutti i livelli non
ancora convertiti. Con un salvataggio realistico (gettoni già riscossi) non succede. Un
giocatore vero lo vede solo con un salvataggio importato da un altro dispositivo: **non
posso confermarlo**. Opzioni: 1 **(consigliata)** controllare il caso importazione nel
collaudo del salvataggio e, se si riproduce, una frase sola («Ne hai già 3, il massimo:
gli altri 19 sono andati persi»); 2 lasciare così.

## 4. Che cosa non ho verificato

- Il **service worker**: nelle prove a mano l'ho bloccato (`serviceWorkers: 'block'`) per
  leggere sempre il sito appena pubblicato. Il passaggio da una 1.21.x in cache alla 1.22.0
  su un telefono vero **non l'ho provato**.
- Telefono vero, la TWA del Play Store, TalkBack, iPhone.
- Le misure dei tempi sono state prese con altre prove in parallelo sulla stessa macchina.
- La festa del Ponte in 640x360 e in 412x915 (provata solo a 360x640 it e a 1024x600 en).

## 5. Sintesi

La Torre, la pausa a fine partita e il ritorno alla home a sfida finita funzionano sul sito
pubblicato. Gli automatici sono 7 verdi su 8, con il rosso noto di `e2e-quadri`; nessun E,
un D (anteprima dei collegamenti «Cento livelli»), sei O; la più importante è O1: chi aveva
già finito il Ponte non riceve nessuna festa né avviso della Torre.
