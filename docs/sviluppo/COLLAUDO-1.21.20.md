# Collaudo 1.21.20

Ramo `collaudo-1.21.20`, 21 ottobre 2026. Collaudo del sito **pubblicato**
(`https://antoniovairo-rgb.github.io/Plinto/`), non di una build locale. Codice del gioco
non toccato; `main` non toccato.

Ambiente: container figlio, Chromium 1194 di `/opt/pw-browsers` (headless), font del
container. Su un telefono vero, con TalkBack, con il tasto Indietro vero della TWA o con
un altro font: **non posso confermarlo**.

## 0. Versione pubblicata

- `index.html` del sito carica `assets/index-DRouSDD9.js`; il bundle contiene la stringa
  `1.21.20` (4 occorrenze, `grep -o '1\.21\.[0-9]*'`), nessun'altra `1.21.x`.
- `package.json` del ramo (da `main`, `e77570c`): `"version": "1.21.20"`.

## 1. Controlli automatici contro il sito pubblicato

Tutti con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`, dopo `npm ci`.

| Comando | Esito | Ultima riga |
|---|---|---|
| `npm run home-spiegazione` | **verde**, uscita 0 | «La riga c'e' in italiano e in inglese, … «Nuova» sta dentro la card della libera.» |
| `npm run e2e-po008` | **verde**, uscita 0 | «Tutto a posto.» (casi A–P) |
| `npm run e2e` | verde, uscita 0 | «Nessun problema rilevato.» |
| `npm run annulla` | verde, uscita 0 | «Il "rimetti a posto" compare quando deve, …» |
| `npm run archivio` | verde, uscita 0 | «Archivio: calendario accessibile, …» |
| `npm run indietro` | verde, uscita 0 | «Tutte le verifiche del tasto Indietro sono passate.» |
| `npm run impaginazione` | verde, uscita 0 | «La home entra su tutti i formati provati, …» |
| `npm run e2e-attrezzi` | verde, uscita 0 | «Nessun problema rilevato.» |

Caso P di `e2e-po008` sul sito: «home Esc: Nuova partita libera; home velo: Nuova partita
libera; Tab dopo: Partita libera, riprendi la partita in corso; Riprova Esc: Menu; Gioca
velo: Gioca».

`e2e-quadri` e `recensione` (i due rossi noti dei container figli, `docs/TESTING.md`)
**non li ho lanciati**: non toccano le novità di questa versione.

## 2. Prove a mano (Playwright sul sito pubblicato)

Script temporaneo in `store/prove/` (non versionato). Formati 320x700, 360x640, 390x844,
1366x768; lingue it ed en; 8 combinazioni. Ogni combinazione parte da `localStorage`
pulito con lo stato seminato (partite vere create con il motore, una mossa fatta).
Errori di pagina o di console: **0** in tutte.

### 2.1 D1 `FUOCO_TORNA_A_CHI_APRE` — dove va il fuoco quando la domanda si chiude senza scelta

«Indietro» qui è `page.goBack()` (cronologia del browser, che il gioco usa per il tasto
Indietro di Android); il tasto vero della TWA: **non posso confermarlo**.

| Domanda | Aperta da | Escape | Tocco sul velo (4,4) | Indietro |
|---|---|---|---|---|
| libera a metà | clic su «Nuova» | «Nuova partita libera» | «Nuova partita libera» | «Nuova partita libera» |
| libera a metà | tastiera su «Nuova» + Invio | «Nuova partita libera» | — | — |
| Riprova | clic su «Riprova» nel menu del livello | «Menu» | «Menu» | «Menu» |
| altro livello (livello 2 a metà, «Gioca» sul 1) | clic su «Gioca» dell'obiettivo | «Gioca» | «Gioca» | «Gioca» |
| altra sfida (ieri a metà, card della sfida di oggi) | clic sulla card | «Sfida del giorno, gioca la sfida di oggi» | idem | idem |

- Identico in tutte le 8 combinazioni (in en: «New free game», «Menu», «Play», «Daily
  challenge, play today's challenge»).
- All'apertura il fuoco è sul pulsante sicuro («Riprendi la partita» / «Resume game»).
- Dopo la chiusura, il Tab va su «Partita libera, riprendi la partita in corso»
  (en «Free play, resume the game in progress»): il pulsante dopo «Nuova».
- Dopo Riprova chiusa si resta nella partita; dopo «altro livello» chiusa si resta
  sull'obiettivo; la sfida di ieri resta salvata (`2026-10-20`, 1 mossa).
- Non provato su iOS (dove un tocco non dà il fuoco): **non posso confermarlo**.

### 2.2 O1 `NUOVA_FINO_AL_BORDO` — la colonna sotto «Nuova»

`elementFromPoint` un pixel alla volta su tre verticali (2 px dal bordo sinistro della
pillola, centro, 2 px dal bordo destro), dal centro della pillola all'ultimo pixel della
card; poi 8 px sotto la card.

| Formato | Card libera (alt.) it / en | Colonna → «Nuova» it | en | Sotto la card → «Nuova» |
|---|---|---|---|---|
| 320x700 | 68 / 52 | 126/126 | 102/102 | 0 |
| 360x640 | 52 / 52 | 102/102 | 102/102 | 0 |
| 390x844 | 52 / 52 | 102/102 | 102/102 | 0 |
| 1366x768 | 52 / 52 | 105/105 | 105/105 | 0 |

Clic vero (mouse) sul centro della colonna, all'ultimo pixel in basso della card: apre la
domanda «La partita libera è a metà.» (en «Your free game is in progress.») in tutte le
8 combinazioni. Coincide con il rapporto PO-023 (`docs/sviluppo/RAPPORTO-PO-023.md`, §2).

Anello del fuoco (schermate a 2x in `docs/sviluppo/collaudo-1.21.20/`, guardate a occhio
quella it 320x700): su «Nuova» l'anello è attorno alla pillola; su «Riprendi ›» l'anello
è attorno a tutta la card, intero, non tagliato (`outline: solid 2px`, `offset 2px` sulla
card, misurato con `getComputedStyle`).

### 2.3 O2 `NOME_SFIDA_CON_GIOCA` — nome accessibile della sfida da fare

- `aria-label` della card: «Sfida del giorno, gioca la sfida di oggi» / «Daily challenge,
  play today's challenge», in tutte le 8 combinazioni; `getByRole('button', { name, exact })`
  trova esattamente 1 pulsante. Pillola visibile: «Gioca ›» / «Play ›».
- Con la sfida di **ieri** a metà la card di oggi ha lo stesso nome (è ancora «da fare»):
  coerente con la pillola «Gioca ›» che si vede.
- Comando vocale vero («tocca Gioca»): **non posso confermarlo**.

### 2.4 1.21.19 `PILLOLE_STESSA_MISURA`

Tutte le pillole d'azione della home (`.pl-sfida-avvio__nuova`, `.pl-sfida-avvio__esito--riprendi`):
**14px di carattere, 17 px di altezza**, in tutte le 8 combinazioni e in tutti gli stati
provati («Nuova», «Riprendi ›», «Gioca ›»; en «New», «Resume ›», «Play ›»).

### 2.5 La home non scorre

`scrollHeight − clientHeight` della `.pl-home` e del documento: **0 / 0** negli stati
«nuovo giocatore», «libera a metà» e «tutte» (libera + sfida di ieri + livello 2 a metà),
in tutte le 8 combinazioni. `home-spiegazione` (8 formati × 2 lingue × 5 stati): colonna
«scorre» 0 ovunque.

### 2.6 Gioco

Le prove di gioco sono quelle degli e2e del §1 (`e2e`, `annulla`, `e2e-attrezzi`,
`indietro`, `archivio`), tutte verdi sul sito pubblicato. Dalle prove a mano: dopo un clic
nella card libera si entra nella partita (it 320x700, clic a 3 px dal bordo sinistro).

## 3. Risultati

Nessuna **E** (errore grave). Nessun **D** nelle novità della 1.21.20.

### O1 — Gli angoli della card libera non rispondono al tocco (pre-esistente, PO-020)

**Misura.** Nella card della libera con la partita a metà ci sono pixel che non vanno né a
«Nuova» né a «Riprendi»: `elementFromPoint` restituisce la card, che è un `<div>` senza
gestore. Un clic vero a (sinistra + 10, basso − 2) non fa niente (nessuna domanda, nessuna partita, in
tutte le 8 combinazioni).

| | it 320x700 (card 68) | gli altri 7 (card 52) |
|---|---|---|
| pixel della card | 18 376 | 14 024 – 19 630 |
| pixel morti | 748 | 364 – 368 |
| profondità sulla diagonale dall'angolo | 9 px | 7 px |

**Causa** (dal codice): `.pl-sfida-avvio__riprendi::after` ha `border-radius: inherit`
(`src/styles/app.css:1848-1853`) e lo eredita dalla pillola, cioè 999px
(`getComputedStyle(..., '::after')` = `999px`); la card ha 14px (`--pl-radius-md`,
`src/styles/tokens.css:88`). Il bersaglio di «Riprendi» è uno stadio dentro un rettangolo
arrotondato: gli angoli restano fuori. Le righe vengono da `7ae7f9f` (PO-020, 1.21.18):
**non** è una regressione della 1.21.20. Che fosse identico sulla 1.21.18 pubblicata non
l'ho misurato: non posso confermarlo.

Peso: piccolo (2–4 % della card, solo negli angoli), ma un tocco lì è un tocco perso.

Opzioni:
1. **(consigliata)** Dare al `::after` di «Riprendi» il raggio della card
   (`var(--pl-radius-md)`) invece di `inherit`, come fa già l'anello del fuoco alla
   riga 1856; aggiungere a `home-spiegazione` il conteggio dei pixel morti (deve essere 0).
2. Mettere il gestore del tocco «Riprendi» sul contenitore stesso (tutta la card riprende
   tranne «Nuova», che ferma la propagazione).
3. Lasciare così: angoli piccoli, nessuno se n'è lamentato.

### O2 — Il menu del gioco non si chiude con Escape e non restituisce il fuoco (pre-esistente)

È la scelta aperta 3 del rapporto PO-023 («non l'ho misurato»). Misurato ora sul sito,
partita libera, 390x844 it, menu aperto con la tastiera dal pulsante «Menu»:

| Chiusura | Il menu si chiude? | Fuoco dopo |
|---|---|---|
| Escape | **no** | «Menu» (non si è mai spostato) |
| tocco sul velo | sì | `<body>` |
| Indietro | sì | «Menu» |
| «Torna alla partita» | sì | `<body>` |

Inoltre all'apertura il fuoco **resta su «Menu»**, dietro il velo: non entra nel menu.
Nel codice il menu (`src/ui/App.jsx:705-707`, `.pl-velo` > `.pl-menu`) non ha né
`role="dialog"` né un gestore di Escape: `grep -n Escape` in `src/ui/` trova solo
`Attrezzi.jsx`, `ConfermaDoppia.jsx` e `useTastiera.js` (quest'ultimo solo con un pezzo in
mano). Non è una novità della 1.21.20.

Opzioni:
1. **(consigliata)** Una voce nuova dopo questo collaudo: il menu come le domande
   (Escape chiude, fuoco sul primo pulsante all'apertura, ritorno a «Menu» alla chiusura
   senza scelta), con un caso in `e2e-po008`.
2. Solo Escape che chiude, senza toccare il fuoco.
3. Lasciare così: il gioco si usa soprattutto col dito.

### O3 — La sfida di ieri a metà non si vede nella card di oggi

Con la sfida di ieri a metà la card di oggi dice «Gioca ›» e il nome è «…, gioca la sfida
di oggi»; la domanda arriva solo al tocco. È coerente (la sfida di **oggi** è da fare) e
la domanda protegge la partita di ieri, quindi non lo considero un difetto; lo segnalo
perché il giocatore non ha nessun segno, prima del tocco, che ieri è rimasto a metà.

Opzioni:
1. **(consigliata)** Lasciare così: la domanda c'è e dice tutto.
2. Una riga o un'icona nell'archivio sul giorno a metà (non nella home, che non deve scorrere).

## 4. Che cosa non ho verificato

- Telefono vero, TalkBack, comando vocale, tasto Indietro della TWA, iOS: **non posso
  confermarlo**.
- `e2e-quadri`, `recensione` e il gate completo (`npm run verifica`): non lanciati.
- O3 del collaudo 1.21.18 (riga della libera letta due volte): non riguardata.

## Sintesi

1.21.20 pubblicata e verificata: le quattro novità (D1, O1, O2, pillole) funzionano come
dichiarato in it ed en a 320x700, 360x640, 390x844 e 1366x768, la home non scorre,
`home-spiegazione`, `e2e-po008` e sei e2e di regressione sono verdi sul sito; nessun E né
D, tre O di cui due pre-esistenti (angoli morti della card libera, menu senza Escape).
