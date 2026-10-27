# Collaudo 1.21.26

Figlia di collaudo, 27 ottobre 2026, ramo `collaudo-1.21.26` (da `main` a `ce3e8fe`). Oggetto: la
1.21.26 **pubblicata** su https://antoniovairo-rgb.github.io/Plinto/, il sito che il revisore di
Google vedrà con il pacchetto 11915 in revisione (PO-017, «Unresponsive app»). Letti
`docs/sviluppo/RAPPORTO-PO-036.md`, `docs/CHANGELOG.md` (voce 1.21.26) e, per il formato,
`docs/sviluppo/COLLAUDO-1.21.25.md` (ramo `collaudo-1.21.25`). Nessun file del gioco toccato:
questo rapporto e le schermate in `docs/sviluppo/collaudo-1.21.26/` sono le sole aggiunte.
Chromium di prova: `/opt/pw-browsers/chromium`, headless, tocco emulato.

## In breve

| | esito |
|---|---|
| Bundle pubblicato | `assets/index-CSd4AjUk.js`, contiene «1.21.26» (4 volte); `last-modified: Tue, 27 Oct 2026 02:37:49 GMT`. Nel bundle c'è `pl-guida__link--comodo`; nel CSS pubblicato `.pl-guida__link--comodo{padding:12px 0 18px;margin:-12px 0 -18px}` |
| Le 7 prove richieste contro il sito | **7 verdi su 7** |
| Percorso da revisore col dito, 6 formati × 2 avvii (pulito e `?origine=play`) | tutto raggiungibile, livello 1 vinto col dito 12 su 12, nessun errore in console, nessun long task, ogni tocco andato a segno risponde in ≤ 170 ms |
| «Salta per ora» e «Non mostrarmela più» toccati sui 4 bordi | 45 px di altezza su 6 formati su 6; 96 tocchi sui bordi su 96 vanno a segno al primo colpo |
| Livello 1, 360x640, CPU 4x, rilascio veloce | griglia uguale al motore in **13 partite su 13** (3 nel gate + 10 in una corsa a parte) |
| Unica cosa vista che somiglia a «non risponde» | il **primo** tocco dopo un trascinamento veloce a volte non produce il click (il secondo sì) → **O1** |

Classificazione: **E** = blocca secondo le regole del progetto; **D** = difetto misurato; **O** = osservazione.
**Nessuna E, nessuna D.** Per ogni O, opzioni con la consigliata per prima. Non ho corretto niente.

## Che cosa ho fatto

1. `npm ci` (verde), poi con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/` e
   `PLINTO_CHROMIUM=/opt/pw-browsers/chromium`, una prova alla volta:

   | prova | esito | durata |
   |---|---|---|
   | `npm run precisione` | verde, 205 prove, «Nessuno scostamento»; rilascio veloce CPU 4x 3 partite su 3 uguali al motore per 14 mosse, dito che si ferma 1 su 1 | 263 s |
   | `npm run guida` | verde: 6 passi; «Salta per ora» e «Non mostrarmela più» alti 45 px, bordi suoi, a 360x640, 390x844, 640x360 | 15 s |
   | `npm run e2e-schermi` | verde: «Tutto a posto su 13 formati, 5 coricati e 2 col testo x2» (avvisi non bloccanti: O4) | 550 s |
   | `npm run e2e` | verde, «Nessun problema rilevato» | 17 s |
   | `npm run e2e-attrezzi` | verde, «Nessun problema rilevato» | 41 s |
   | `npm run e2e-po008` | verde, «Tutto a posto»; «Mosse di unaMossa: 94 tentate, **2 ritentate**, 0 non fatte» (O2) | 214 s |
   | `npm run indietro` | verde, «Tutte le verifiche del tasto Indietro sono passate» | 12 s |

   `e2e-quadri` e `recensione` non erano fra le prove richieste: non girate.

2. **Percorso da revisore** (script mio, fuori dal repository): per ogni formato 360x640,
   412x915, 640x360, 915x412, 1024x600, 800x1280 due giri, uno dall'indirizzo nudo e uno con
   `?origine=play` (l'indirizzo d'avvio dell'app, `android/app/src/main/res/values/strings.xml:20`).
   Contesto nuovo per giro (= installazione pulita, service worker attivo), `hasTouch`, `isMobile`,
   densità 2; **ogni tocco e ogni trascinamento con `Input.dispatchTouchEvent`** (tocco: `touchStart`,
   60 ms, `touchEnd`, al centro dell'elemento; trascinamento: 12 movimenti senza pausa e distacco
   subito, cioè il dito frettoloso, *senza* la pausa di `DITO_CHE_SI_FERMA`). Ogni tocco aspetta il
   suo effetto per 3 s; se non arriva si tocca una seconda volta lo stesso punto, come farebbe una
   persona, e si scrive. Passi:
   guida (un «Avanti»; poi «Salta per ora» toccato a 2 px dentro dai quattro bordi, ogni volta
   riavvio e la guida deve tornare; poi «Non mostrarmela più» sui quattro bordi, ogni volta riavvio e
   la guida non deve tornare; poi dal centro), home, partita libera (un pezzo col dito, menu,
   «Torna alla home»), sfida del giorno (uguale), mappa, livello 1 aperto e **vinto col dito** con
   la sequenza vincente del motore (`tools/sequenza-vincente.mjs`), confrontando dopo ogni mossa le
   caselle occupate a schermo con il motore, «Torna ai livelli», Indietro; poi livello 13 con due
   gettoni (scritti in `localStorage`: da installazione pulita, dopo il livello 1,
   `plinto:attrezzi` è `null`), pannello degli attrezzi, «Torna alla partita», menu, «Torna ai
   livelli»; dalla home impostazioni e archivio, chiusi con Indietro. Raccolti: errori di console
   ed eccezioni, long task (`PerformanceObserver`), tempo dal tocco all'effetto, sporgenze.

3. **Sonde sul tocco perso** (O1): `tools/sonda-tocco.mjs` del PO-036 contro il sito pubblicato,
   più quattro sonde mie (stessa geometria del percorso, fine livello, pagina minima in tre varianti).

## Percorso da revisore: risultati

| formato | avvio | primo contenuto | guida | home | livello 1 col dito | pannello attrezzi (scrollTop / corsa) | tocchi | tocco più lento | primo tocco senza effetto | console | long task |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 360x640 | pulito | 564 ms | sì | non scorre | vinto, 14 mosse = motore | 0 / 0 | 36 | 146 ms | 3 | 0 | 0 |
| 360x640 | play | 513 ms | sì | non scorre, «Recensisci» presente | vinto | 0 / 0 | 36 | 126 ms | 3 | 0 | 0 |
| 412x915 | pulito | 526 ms | sì | non scorre | vinto | 0 / 0 | 35 | 123 ms | 2 | 0 | 0 |
| 412x915 | play | 516 ms | sì | non scorre | vinto | 0 / 0 | 36 | 124 ms | 3 | 0 | 0 |
| 640x360 | pulito | 532 ms | sì | non scorre | vinto | **0** / 216 | 36 | 116 ms | 3 | 0 | 0 |
| 640x360 | play | 612 ms | sì | non scorre | vinto | **0** / 216 | 36 | 123 ms | 3 | 0 | 0 |
| 915x412 | pulito | 507 ms | sì | non scorre | vinto | **0** / 164 | 36 | 120 ms | 3 | 0 | 0 |
| 915x412 | play | 527 ms | sì | non scorre | vinto | **0** / 164 | 36 | 124 ms | 3 | 0 | 0 |
| 1024x600 | pulito | 519 ms | sì | non scorre | vinto | 0 / 0 | 36 | 130 ms | 3 | 0 | 0 |
| 1024x600 | play | 505 ms | sì | non scorre | vinto | 0 / 0 | 35 | 143 ms | 2 | 0 | 0 |
| 800x1280 | pulito | 493 ms | sì | non scorre | vinto | 0 / 0 | 35 | 153 ms | 2 | 0 | 0 |
| 800x1280 | play | 505 ms | sì | non scorre | vinto | 0 / 0 | 34 | 170 ms | 1 | 0 | 0 |

«Primo contenuto»: dal `goto` alla comparsa di `.pl-guida` o `.pl-home`, rete del container. «Tocco
più lento»: fra i tocchi andati a segno, dal `touchStart` all'effetto atteso (include i 60 ms del
dito appoggiato). «Recensisci» c'è nella home di `?origine=play` e non in quella pulita
(schermate `360x640-play-home.png` e, fuori dal repository, la pulita). Dopo ogni pannello degli
attrezzi il fuoco è su «Torna alla partita» in 12 giri su 12.

**Primo tocco senza effetto, dove**: sempre e solo nel primo tocco dopo un trascinamento — «Menu»
toccato 500 ms dopo aver appoggiato un pezzo in partita libera (12 su 12) e in sfida (9 su 12), e
«Torna ai livelli» toccato a fine livello 1 dopo l'ultima mossa (10 su 12; non a 800x1280). In
tutti e 31 i casi il secondo tocco nello stesso punto ha funzionato (≤ 121 ms).
Nessun altro tocco perso: guida, home, mappa, pannello, impostazioni, archivio, Indietro.

### «Salta per ora» e «Non mostrarmela più» (`SALTA_COMODO`)

| formato | «Salta per ora» | «Non mostrarmela più» |
|---|---|---|
| tutti e 6 | 72x45 px | 119x45 px |

Tocchi a 2 px dentro dai bordi sopra, sotto, sinistra, destra: il punto appartiene al pulsante
(`elementFromPoint`) e il tocco porta alla home **48 su 48** per ciascuno dei due pulsanti (6 formati ×
2 avvii × 4 bordi), tutti al primo colpo, 84–146 ms. Dopo «Salta per ora» la guida torna al riavvio
48 su 48; dopo «Non mostrarmela più» non torna 48 su 48. A 640x360 la riga sta in vista senza
scorrere (schermata `640x360-play-guida.png`).

### Livello 1, 360x640, CPU 4x, rilascio veloce (`RILASCIO_DOVE_SI_STACCA`)

`PLINTO_PRECISIONE_SOLO_VELOCE=1 PLINTO_PRECISIONE_VELOCI=10 node tests/e2e/precisione.mjs` contro il
sito: **10 partite su 10 uguali al motore per 14 mosse** (l'ultimo movimento e il distacco inviati
insieme, `tests/e2e/precisione.mjs:276-282`), più 1 su 1 col dito che si ferma. Con le 3 del gate:
13 su 13. Nel percorso da revisore (CPU normale, dito frettoloso) il livello 1 è uguale al motore
dopo ogni mossa in 12 giri su 12. Che valga su un telefono vero **non posso confermarlo**.

### Pannello degli attrezzi in orizzontale (`PANNELLO_DALL_ALTO`)

640x360 e 915x412: `scrollTop` 0 all'apertura (corsa 216 e 164 px, gli stessi numeri che il PO-036
misurava come «scorso» prima della correzione). Vedi O3 per «Torna alla partita».

## O1 — il primo tocco dopo un trascinamento veloce a volte non produce il click

**Che cosa.** Nel Chromium di prova, dopo un trascinamento col dito che si stacca ancora in corsa,
il tocco seguente su un pulsante riceve `pointerdown touchstart pointerup touchend` ma non `click`
(registrato sul pulsante); il secondo tocco funziona. È la stessa firma di E1 del collaudo 1.21.25.

**Misure** (10 giri per riga, contesto nuovo per giro, sito pubblicato):

| sonda | formato | attesa dopo il distacco | PLINTO perso | pagina minima persa |
|---|---|---|---|---|
| `tools/sonda-tocco.mjs`, dito frettoloso | 360x640 | 500 ms | 3/10 | 0/10 |
| idem | 915x412 | 500 ms | 6/10 | **10/10** |
| idem | 360x640, 915x412 | 1500 ms | 0/10, 0/10 | 0/10, 0/10 |
| idem | 360x640, 915x412 | 3000 ms | 0/10, 0/10 | 0/10, 0/10 |
| idem, dito che si ferma | tutti | 500, 1500, 3000 ms | 0 su 60 | 0 su 60 |
| mia, geometria del percorso (pezzo → centro griglia, «Menu»), 8 giri | 360x640 | 500 ms | 2/8 | **8/8** |
| idem | 360x640 | 2000, 4000 ms | 0/8, 0/8 | 0/8, 0/8 |

Fino a qui vale la conclusione del PO-036: la pagina minima lo perde quanto o più di PLINTO, e
sparisce col dito che si ferma.

**Il caso che il PO-036 non copriva: fine del livello.** Livello 1 vinto col dito frettoloso, 150 ms
fra una mossa e l'altra, poi «Torna ai livelli» (4 giri per riga, 360x640):

| dito | attesa dopo la comparsa della vittoria | PLINTO: tocco perso |
|---|---|---|
| frettoloso | 1000 ms | **4/4** |
| frettoloso | 1500 ms | **4/4** |
| frettoloso | 2000 ms | 0/4 |
| frettoloso | 2500, 3000 ms | 0/4, 0/4 |
| frettoloso, 700 ms fra le mosse | 2000, 5000 ms | 0/4, 0/4 |
| fermo solo all'ultima mossa | 1500, 2000, 3000, 5000 ms | 0 su 16 |
| fermo a ogni mossa | 2000, 5000 ms | 0 su 8 |

Ho provato a ripeterlo **senza PLINTO**: pagina minima con 14 trascinamenti a 150 ms e tocco a
1500/3000 ms (0/4, 0/4); la stessa con una schermata animata di 300 elementi che compare
all'ultimo distacco (0/4, 0/4); la stessa con la radice `touch-action: manipulation` e il campo
`touch-action: none` come PLINTO (`src/styles/app.css:16`, `:268`, `:402`, `:762`) (0/4, 0/4).
**Fuori da PLINTO non l'ho riprodotto**: in questo caso non posso dire che sia «della
prova». Nel codice non c'è niente che scarti un click dopo un trascinamento (cercati in `src/`
`addEventListener('click'`, `onClickCapture`, `touchstart`, `touchend`: l'unico `onClickCapture` è
`src/ui/MenuPartita.jsx:66`, che non blocca). Perché Chromium non generi il click **non posso
confermarlo** (non ho letto il suo codice); se succeda su un telefono vero, dove il dito rallenta
prima di staccarsi, **non posso confermarlo**: qui, col dito che si ferma anche solo all'ultima
mossa, non è successo in nessuno dei 24 giri di fine livello.

**Perché conta per la revisione.** Un revisore che vince il livello 1 trascinando in fretta e tocca
«Torna ai livelli» entro ~1,5 s potrebbe vedere un tocco senza effetto; il secondo funziona. Non è
un blocco (nessuna attesa, nessun errore, il gioco risponde subito al tocco dopo), ma è l'unica
cosa misurata in questo collaudo che si può leggere come «non ha risposto».

Opzioni:
1. **(consigliata)** Non toccare il gioco prima dell'esito della revisione della 11915; affidare a
   una figlia la **sonda sul telefono vero del PO** (vincere il livello 1 trascinando svelto e
   toccare subito «Torna ai livelli», 10 volte), e in parallelo una sonda nel Chromium che registri
   gli eventi gesto (`Input`/tracing) per capire se il click sparisce per un *fling* non ancora
   finito o per altro. Solo dopo decidere.
2. Se il telefono vero lo ripete: indagare in PLINTO che cosa allunga la finestra a fine livello
   (in partita libera la finestra si chiude prima di 1500 ms, a fine livello dopo 1500 ms).
3. Lasciarlo com'è e scriverlo in `docs/TESTING.md` come limite noto del tocco sintetico, esteso
   alla fine del livello.

## O2 — `e2e-po008`: 2 mosse ritentate su 94

Verde, ma con «2 ritentate» (il collaudo 1.21.25 ne contava 0). Il commento in
`tests/e2e/ripresa-livello.mjs:213-216` dice che la prima mossa a volte non arriva «solo con tre
corse insieme sulla stessa macchina»: qui la prova girava **da sola** (le altre prove erano finite
o non ancora partite; il mio percorso da revisore è partito dopo). La prova usa il mouse, non il
tocco. Causa **non posso confermarla**: una corsa sola.

Opzioni:
1. **(consigliata)** Guardare il numero nelle prossime corse della CI «verifica»: se resta sopra 0 da
   sola, aprire un'indagine.
2. Rifare `npm run e2e-po008` tre volte da sola qui e contare.
3. Niente: la prova è verde e il ritentativo è previsto.

## O3 — in orizzontale «Torna alla partita» del pannello degli attrezzi è fuori vista all'apertura

A 640x360 e 915x412 il pannello si apre dall'alto (`scrollTop` 0, la correzione D2 funziona) e il
fuoco è su «Torna alla partita», che però sta in fondo: per toccarlo il mio percorso ha dovuto
scorrere il pannello (12 giri su 12 in questi due formati; schermata `640x360-play-attrezzi.png`).
Il velo intorno chiude il pannello (`src/ui/Attrezzi.jsx:185`, `onClick={onChiudi}`): **letto nel
codice, non misurato col dito** in questo collaudo. Il PO-036 lo sapeva («Che un lettore di
schermo annunci il pulsante anche se fuori vista non posso confermarlo»).

Opzioni:
1. **(consigliata)** Lasciare così: un pannello che scorre e si chiude toccando fuori non è un
   blocco; misurare col dito il tocco sul velo nel prossimo collaudo.
2. Mettere «Torna alla partita» anche in alto, o fisso in fondo al pannello, in orizzontale.
3. Riordinare il pannello in due colonne in orizzontale perché non scorra.

## O4 — bersagli sotto 44 px (avvisi già noti, non bloccanti)

`e2e-schermi` li elenca come «identico sul telefono»: «Sostieni il progetto» e «Idee e
segnalazioni» 27 px, pastiglia degli attrezzi vuota 38 px, giorni dell'archivio 43 px (31 voci).
Non cambiano con la 1.21.26.

Opzioni:
1. **(consigliata)** Niente prima della revisione: sono identici alla versione già vista.
2. Portare i due collegamenti in fondo alla home a 44 px con lo stesso trucco di `SALTA_COMODO`
   (area più alta, disegno uguale).
3. Giorni dell'archivio a 44 px (1 px).

## Che cosa non ho potuto verificare

- Un telefono vero, TalkBack, la TWA installata dal Play Store: non disponibili qui.
- Il tocco sul velo del pannello degli attrezzi (O3): non misurato.
- La CI «verifica» della 1.21.26: non letta in questo collaudo (il commit `ce3e8fe` dice «CI 240
  verde»; **non posso confermarlo** da qui).

## Schermate

In `docs/sviluppo/collaudo-1.21.26/` (densità 2, dal percorso da revisore):
`360x640-play-guida.png`, `360x640-play-home.png`, `360x640-pulita-livello1-vinto.png`,
`412x915-play-sfida.png`, `640x360-play-guida.png`, `640x360-play-attrezzi.png`,
`640x360-play-impostazioni.png`, `915x412-play-attrezzi.png`, `1024x600-play-libera.png`,
`800x1280-play-mappa.png`.

## Sintesi

Sul sito 1.21.26 pubblicato le 7 prove sono verdi e il percorso da revisore col dito risponde
ovunque (≤ 170 ms, zero errori, zero long task, livello 1 vinto 12 su 12, griglia uguale al motore
anche a CPU 4x 13 su 13); **l'unica cosa che un revisore potrebbe leggere come «app che non
risponde» è O1**: nel Chromium di prova il primo tocco entro ~1,5 s da un trascinamento staccato in
corsa a volte non fa niente (il secondo sì), e a fine livello questo non l'ho riprodotto fuori da
PLINTO; su un telefono vero non posso confermarlo.
