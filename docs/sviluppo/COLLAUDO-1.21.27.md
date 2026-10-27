# Collaudo 1.21.27

Figlia di collaudo, 27 ottobre 2026, ramo `collaudo-1.21.27` (da `main` a `4711175`). Oggetto: la
1.21.27 **pubblicata** su https://antoniovairo-rgb.github.io/Plinto/, il sito che il revisore di
Google vede con il pacchetto 11915 in revisione (PO-017). Letti `docs/sviluppo/RAPPORTO-PO-037-CORREZIONE.md`,
`docs/CHANGELOG.md` (voce 1.21.27) e, per il formato, `docs/sviluppo/COLLAUDO-1.21.26.md` (ramo
`collaudo-1.21.26`). Nessun file del gioco toccato: questo rapporto e le schermate in
`docs/sviluppo/collaudo-1.21.27/` sono le sole aggiunte. Chromium di prova:
`/opt/pw-browsers/chromium` 153.0.8010.12, headless, tocco emulato (`Input.dispatchTouchEvent`),
`isMobile`, `hasTouch`, densità 2.

## In breve

| | esito |
|---|---|
| Bundle pubblicato | `assets/index-aMWmD0h1.js`, contiene «1.21.27» (4 volte) e `touchmove` (2 volte); `last-modified: Tue, 27 Oct 2026 19:00:53 GMT`. La home mostra «v1.21.27» (schermata `360x640-play-home.png`) |
| Le 7 prove richieste contro il sito | **7 verdi su 7** (compresi i «lanci» di `e2e-schermi`) |
| Sonde PO-037 (fine del livello 1 e partita libera con 14 lanci, 500/1000/1500 ms, 360x640 e 915x412) | **0 click persi su 48**; **0 `GestureFlingStart`** nella traccia in 48 giri su 48 |
| Percorso da revisore col dito, 4 formati × 2 avvii | tutto raggiungibile, **0 primi tocchi senza effetto su 240**, livello 1 vinto 8 su 8 (griglia uguale al motore dopo ogni mossa), 0 errori in console, 0 long task, ogni tocco risponde in 73–143 ms |
| Lo stesso percorso sul bundle della 1.21.26 (controprova) | 10 primi tocchi senza effetto su 120, tutti nei punti del PO-037: lo strumento sa fallire |
| Scorrimento col dito di mappa, come si gioca, impostazioni, archivio | in fondo in **8 giri su 8** per ciascuna schermata, con lo stesso numero di colpi della 1.21.26 (una differenza di 1 colpo, vedi sotto) |

Classificazione: **E** = blocca secondo le regole del progetto; **D** = difetto misurato; **O** = osservazione.
**Nessuna E, nessuna D.** Tre O, per ognuna opzioni con la consigliata per prima. Non ho corretto niente.

## Che cosa ho fatto

1. `npm ci` (verde), poi con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`, una prova alla
   volta, niente altro acceso sulla macchina:

   | prova | esito | durata |
   |---|---|---|
   | `npm run e2e-schermi` (completo) | verde: «Tutto a posto su 13 formati, 5 coricati e 2 col testo x2 e 2 coi lanci»; righe `lanci 360x640` e `lanci 915x412` = ok (avvisi non bloccanti: O3) | 612 s |
   | `npm run precisione` | verde, 205 prove su 41 forme, «Nessuno scostamento»; rilascio veloce CPU 4x 3 partite su 3 uguali al motore per 14 mosse; dito che si ferma 1 su 1 | 243 s |
   | `npm run e2e` | verde, «Nessun problema rilevato» | 16 s |
   | `npm run e2e-attrezzi` | verde, «Nessun problema rilevato» | 40 s |
   | `npm run e2e-po008` | verde, «Tutto a posto»; «Mosse di unaMossa: 94 tentate, 0 ritentate, 0 non fatte» | 202 s |
   | `npm run guida` | verde: 6 passi; «Salta per ora» e «Non mostrarmela più» alti 45 px, bordi suoi, a 360x640, 390x844, 640x360 | 14 s |
   | `npm run indietro` | verde, «Tutte le verifiche del tasto Indietro sono passate» | 12 s |

   `e2e-quadri` e `recensione` non erano fra le prove richieste: non girate.

2. **Sonde PO-037** contro il sito, con la traccia dei gesti accesa (`SONDA_TRACCIA=si`):
   `tools/sonda-fine-livello.mjs` (`SONDA_ATTESE=500,1000,1500 SONDA_DITO=frettoloso SONDA_GIRI=4`) e
   `tools/po037-fling.mjs` (`PO037_SCENE=libera14 PO037_ATTESE=500,1000,1500 PO037_GIRI=4`), ciascuna a
   360x640 e 915x412. I file JSON che le sonde scrivono in `docs/sviluppo/po037/` non li ho versionati
   (qui si scrive solo il rapporto): i numeri sono sotto.

3. **Percorso da revisore** (script mio, nella cartella temporanea, fuori dal repository): per ogni
   formato 360x640, 412x915, 640x360, 1024x600 due giri, dall'indirizzo nudo («pulito») e da
   `?origine=play`. Contesto nuovo per giro (installazione pulita, service worker attivo). Ogni tocco con
   `Input.dispatchTouchEvent` (`touchStart`, 60 ms, `touchEnd`, al centro dell'elemento); ogni
   trascinamento col dito frettoloso (12 movimenti senza pausa e distacco subito, **senza**
   `DITO_CHE_SI_FERMA`). Ogni tocco aspetta il suo effetto 3 s; se non arriva si ritocca lo stesso punto e
   si scrive. Prima di ogni tocco l'elemento viene portato in vista con `scrollIntoView({block:'nearest'})`
   (programmatico, non col dito: conta a 640x360 per «Torna alla partita», vedi O2). Passi:
   guida (un «Avanti», poi «Salta per ora»), home, partita libera (un pezzo verso la casella centrale,
   «Menu» **500 ms dopo il distacco**, «Torna alla home»), sfida del giorno (uguale), mappa con
   **scorrimento col dito fino in fondo**, livello 1 **vinto col dito** con la sequenza del motore
   (`tools/sequenza-vincente.mjs`, 150 ms fra le mosse, griglia a schermo confrontata col motore dopo ogni
   mossa), «Torna ai livelli» **500 ms dopo la vittoria**, Indietro; poi livello 13 con 2 gettoni
   (scritti in `localStorage` come fa `tests/e2e/attrezzi.mjs:56-62`), pannello degli attrezzi, «Torna alla
   partita», di nuovo il pannello e **tocco sul velo** in un angolo fuori dal pannello, «Menu», «Torna ai
   livelli», Indietro; dalla home impostazioni, archivio e come si gioca, ognuna **scorsa col dito fino in
   fondo** e chiusa con Indietro. Lo scorrimento: colpi dal 75% al 25% dell'area, 10 movimenti a 16 ms,
   dito fermo 120 ms e staccato, finché `scrollTop` arriva alla corsa (massimo 40 colpi).

4. **Controprova sulla 1.21.26**: `git worktree` al commit `c88d155` (il genitore di `32910f4`, il commit
   della correzione), `vite build` → `index-CSd4AjUk.js`, **lo stesso bundle** che il rapporto PO-037
   indica come quello del sito 1.21.26; `vite preview` su 127.0.0.1:4174; stesso percorso (avvio `play`,
   4 formati). Server fermato per PID, worktree rimosso.

## Sonde PO-037 sul sito pubblicato

| scena | formato | 500 ms | 1000 ms | 1500 ms | `GestureFlingStart` nella traccia |
|---|---|---|---|---|---|
| fine del livello 1 vinto col dito frettoloso, «Torna ai livelli» | 360x640 | 0/4 persi | 0/4 | 0/4 | 0 in 12 giri |
| partita libera, 14 lanci, «Menu» | 360x640 | 0/4 | 0/4 | 0/4 | 0 in 12 giri |
| fine del livello 1, «Torna ai livelli» | 915x412 | 0/4 | 0/4 | 0/4 | 0 in 12 giri |
| partita libera, 14 lanci, «Menu» | 915x412 | 0/4 | 0/4 | 0/4 | 0 in 12 giri |
| **totale** | | | | | **0 click persi su 48**, livello vinto in 24 giri su 24 |

Ogni giro stampa «click si; 0 GestureFlingStart nella traccia; nessun fling dall'ultimo distacco» (48 righe
su 48). Sono gli stessi numeri del «dopo» di `RAPPORTO-PO-037-CORREZIONE.md` (0/48), misurati qui sul sito
e non su `vite preview`.

## Percorso da revisore: risultati

| formato | avvio | primo contenuto | tocchi | primi tocchi senza effetto | tocco più lento | livello 1 col dito | pannello attrezzi (scrollTop / corsa) | velo | console | long task |
|---|---|---|---|---|---|---|---|---|---|---|
| 360x640 | pulito | 518 ms | 30 | **0** | 143 ms | vinto, 14 mosse = motore | 0 / 0 | chiude, 95 ms | 0 | 0 |
| 360x640 | play | 520 ms | 30 | **0** | 116 ms | vinto, 14 = motore | 0 / 0 | 95 ms | 0 | 0 |
| 412x915 | pulito | 473 ms | 30 | **0** | 110 ms | vinto, 14 = motore | 0 / 0 | 110 ms | 0 | 0 |
| 412x915 | play | 543 ms | 30 | **0** | 106 ms | vinto, 14 = motore | 0 / 0 | 98 ms | 0 | 0 |
| 640x360 | pulito | 494 ms | 30 | **0** | 103 ms | vinto, 14 = motore | 0 / 216 | 95 ms | 0 | 0 |
| 640x360 | play | 558 ms | 30 | **0** | 106 ms | vinto, 14 = motore | 0 / 216 | 97 ms | 0 | 0 |
| 1024x600 | pulito | 488 ms | 30 | **0** | 112 ms | vinto, 14 = motore | 0 / 0 | 88 ms | 0 | 0 |
| 1024x600 | play | 538 ms | 30 | **0** | 117 ms | vinto, 14 = motore | 0 / 0 | 84 ms | 0 | 0 |

«Primo contenuto»: dal `goto` alla comparsa di `.pl-guida` o `.pl-home`, rete del container. «Tocco più
lento»: dal `touchStart` all'effetto atteso (include i 60 ms del dito appoggiato); il più veloce 73 ms.
In tutti e 8 i giri: la guida compare al primo avvio e torna al riavvio dopo «Salta per ora»; il pezzo
trascinato in partita libera e in sfida finisce sulla griglia (caselle occupate da 0 a 1–5); dopo il
pannello degli attrezzi il fuoco è su «Torna alla partita». «Recensisci» compare nella home di
`?origine=play` e non in quella pulita (schermate; il mio conteggio con `getByRole('button')` dava 0 in
entrambe, quindi non è un elemento `button`: il dato che vale è la schermata).

**Controprova 1.21.26** (stesso script, bundle `index-CSd4AjUk.js`, avvio `play`): primi tocchi senza
effetto **10 su 120** — «Menu» 500 ms dopo il pezzo in partita libera 4 su 4 formati, in sfida 2 su 4,
«Torna ai livelli» a fine livello 4 su 4 — tutti risolti dal secondo tocco (77–111 ms). Sulla 1.21.27
gli stessi punti: **0 su 120** (avvio `play`) e 0 su 120 (pulito). Lo strumento vede il difetto
quando c'è; sulla 1.21.27 non lo vede.

### Scorrimento col dito: arrivano in fondo come prima

`scrollTop` finale = corsa in tutti i casi. Colpi necessari (1.21.27, uguali nei due avvii; tra parentesi
la 1.21.26):

| schermata | 360x640 | 412x915 | 640x360 | 1024x600 |
|---|---|---|---|---|
| mappa (corsa px) | 5 colpi (5), 1310 px | 3 (3), 963 | 9 (9), 1194 (parte da 55: la mappa si apre centrata sul livello corrente) | 6 (6), 1278 |
| come si gioca | 11 (11), 2981 | 6 (6), 2385 | 16 (16), 2076 | 10 (10), 2520 |
| impostazioni | 1 (1), 233 | non scorre (0) | 4 (4), 465 | 1 (**2**), 257 |
| archivio | 1 (1), 17 | non scorre | 2 (2), 227 | 1 (1), 19 |

L'unica differenza (impostazioni a 1024x600, 1 colpo contro 2 sulla 1.21.26) va nel verso di scorrere
di più; una corsa sola per parte, quindi **non posso dire** se sia stabile. La correzione non tocca lo
scorrimento delle pagine: l'ascoltatore `touchmove` si aggancia solo nel `pointerdown` sul pezzo del
vassoio (`RAPPORTO-PO-037-CORREZIONE.md`, «Che cosa è cambiato»).

**Scorrimento con lancio** (dito staccato mentre si muove, 6 movimenti a 16 ms, 360x640 e 640x360; mappa
e «Come si gioca» 2 corse per versione, «Impostazioni» 1 corsa solo sul sito): «Come si gioca» prosegue
per inerzia (a 360x640 il dito fa 173 px, la pagina ne scorre 284–302 in 2 s; c'è un `GestureFlingStart`
nella traccia), «Impostazioni» anche (arriva in fondo, 233 px, con un colpo); **la mappa no** (scorre
158 px, quanto il dito meno la soglia, e si ferma; nessun `GestureFlingStart`; uguale partendo dal
centro o a 6 px dal bordo sinistro). Identico sulla 1.21.26 → O1.

## O1 — la mappa non prosegue per inerzia dopo un lancio col dito (uguale alla 1.21.26)

**Che cosa.** Nel Chromium di prova un colpo col dito staccato in corsa sulla mappa dei livelli la fa
scorrere solo quanto il dito (158 px per 173 px di dito, 360x640; 74 per 89, 640x360), poi si ferma: la
traccia dei gesti ha `GestureScrollBegin`, 6 `GestureScrollUpdate`, `GestureScrollEnd`, **nessun
`GestureFlingStart`**. Lo stesso identico colpo su «Come si gioca» produce 27 `GestureScrollUpdate`, un
`GestureFlingStart` e un'inerzia (298 px). Uguale sul sito 1.21.27 e sul bundle 1.21.26 (2 corse
ciascuno): **non è una regressione della 1.21.27**. La mappa arriva comunque in fondo col dito (3–9
colpi). Perché la mappa non generi il fling **non posso confermarlo**: in `src/ui/schermate/Quadri.jsx`,
`src/ui/AvanzamentoMappa.jsx` e `src/ui/schermate/Pagina.jsx` non ci sono ascoltatori di tocco o di
scorrimento, e in `src/styles/app.css` non c'è `scroll-snap`; il numero minore di `GestureScrollUpdate`
(6 contro 27) fa pensare a fotogrammi più lenti, ma è un'ipotesi non misurata. Se succeda su un telefono
vero **non posso confermarlo**.

**Perché conta per la revisione.** Poco: la mappa segue il dito e risponde a ogni tocco; un revisore
abituato all'inerzia la sentirebbe «più pesante», non ferma.

Opzioni:
1. **(consigliata)** Niente prima dell'esito della revisione della 11915 (non cambia rispetto alla
   versione già in revisione); al prossimo giro sul telefono vero del PO, un colpo veloce sulla mappa e
   uno su «Come si gioca», per vedere se la differenza c'è anche lì.
2. Una sonda con la traccia completa (`devtools.timeline`) sulla mappa per misurare la durata dei
   fotogrammi durante lo scorrimento e trovare la causa.
3. Lasciarlo e scriverlo in `docs/TESTING.md` come comportamento noto del tocco sintetico sulla mappa.

## O2 — in orizzontale «Torna alla partita» del pannello degli attrezzi è fuori vista all'apertura (come nella 1.21.26)

A 640x360 il pannello si apre dall'alto (`scrollTop` 0, corsa 216 px) con il fuoco su «Torna alla
partita», che sta in fondo e non è in vista (schermata `640x360-play-attrezzi.png`). Il mio percorso lo ha
portato in vista con `scrollIntoView` prima di toccarlo, non col dito. Novità di questo collaudo, che il
collaudo 1.21.26 (O3) chiedeva: **il tocco sul velo** fuori dal pannello lo chiude al primo colpo in
**8 giri su 8** (84–110 ms), su tutti e quattro i formati. Quindi c'è sempre un modo di uscire senza
scorrere.

Opzioni:
1. **(consigliata)** Lasciare così: il velo chiude il pannello al primo tocco e il pannello scorre.
2. Mettere «Torna alla partita» anche in alto, o fisso in fondo al pannello, in orizzontale.
3. Riordinare il pannello in due colonne in orizzontale perché non scorra.

## O3 — bersagli sotto 44 px (avvisi già noti, non bloccanti)

`e2e-schermi` li elenca come «identico sul telefono»: «Sostieni il progetto» e «Idee e segnalazioni»
27 px, pastiglia degli attrezzi vuota 38 px, giorni dell'archivio 43 px (31 voci). Gli stessi del
collaudo 1.21.26 (O4): non cambiano con la 1.21.27.

Opzioni:
1. **(consigliata)** Niente prima della revisione: sono identici alla versione già vista.
2. Portare i due collegamenti in fondo alla home a 44 px con lo stesso trucco di `SALTA_COMODO`.
3. Giorni dell'archivio a 44 px (1 px).

## Che cosa non ho potuto verificare

- Un telefono vero, TalkBack, la TWA installata dal Play Store: non disponibili qui. Che la correzione
  tolga il tocco perso **su un telefono vero** non posso confermarlo: qui il tocco è sintetico.
- Che la WebView/Chrome del revisore si comporti come Chromium 153 headless: non posso confermarlo.
- La CI «verifica» della 1.21.27: non letta in questo collaudo (il commit `4711175` dice «CI 247 verde»;
  da qui **non posso confermarlo**).
- `e2e-quadri` e `recensione`: non richieste, non girate.

## Schermate

In `docs/sviluppo/collaudo-1.21.27/` (densità 2, dal percorso da revisore sul sito pubblicato):
`360x640-play-guida.png`, `360x640-play-home.png` (con «Recensisci» e «v1.21.27»),
`360x640-pulito-livello1-vinto.png`, `412x915-play-mappa.png`, `640x360-play-attrezzi.png`,
`640x360-play-impostazioni.png`, `1024x600-play-libera.png`.

## Sintesi

Sul sito 1.21.27 pubblicato le 7 prove sono verdi, le sonde PO-037 danno 0 click persi su 48 e nessun
fling, e il percorso da revisore col dito risponde al primo tocco ovunque (0 su 240, ≤ 143 ms, zero
errori, zero long task, livello 1 vinto 8 su 8) mentre lo stesso percorso sulla 1.21.26 perdeva 10 tocchi
su 120; mappa, come si gioca, impostazioni e archivio arrivano in fondo col dito come prima. **Non ho
trovato niente che un revisore possa leggere come «app che non risponde»** nel Chromium di prova; su un
telefono vero non posso confermarlo.
