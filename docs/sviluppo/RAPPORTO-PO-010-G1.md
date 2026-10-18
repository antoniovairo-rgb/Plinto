# Rapporto PO-010 e G1 — nome fisso delle card, «Nuova partita libera», ancora con la scheda aperta

Ramo `sviluppo/po010-g1-1.21.11`, partito da `sviluppo/f1-f3-1.21.11` (`40f5173`).
Versione non toccata (resta 1.21.10), CHANGELOG e ROADMAP non toccati, niente pubblicato.
`npm run verifica` completo non lanciato, come da mandato.

Tutte le misure sono del Chromium del container (`/opt/pw-browsers/chromium-1194`), con i
font di ripiego del container. Su un telefono vero i font possono essere diversi: vedi
«Non verificato».

## In breve

| | difetto | correzione | interruttore | controllo |
|---|---|---|---|---|
| PO-010 testi | con una partita in corso la card cambia nome («Riprendi la partita · Record 1.836», «Riprendi la sfida · In corso») e non dice che cosa riprende | nome fisso «Partita libera» / «Sfida del giorno»; a destra «Riprendi ›» al posto dello stato; nome accessibile «Partita libera, riprendi la partita in corso»; sotto la libera in corso il collegamento «Nuova partita libera» | `NOME_FISSO_E_STATO` in `src/ui/schermate/Home.jsx` | `npm run home-spiegazione` (punti 5 e 6) |
| PO-010 impaginazione | il collegamento (28 px) farebbe scorrere la home bassa: a 360x640 avanzavano 2 px | sotto i 680 px di altezza in verticale, in tutti gli stati: spazi fra le azioni 10→8, Archivio 52→44, spazi del menu 10→8, marchio–motto 8→6, respiri fra i gruppi 2.4vh→2vh | `HOME_BASSA_COMPATTA` in `src/ui/schermate/Home.jsx` (classe `pl-home--compatta`) | `npm run home-spiegazione`, `npm run impaginazione` |
| G1 | `#/sfida/<giorno>` aperto con la scheda già aperta non fa niente (dalla home l'ancora sparisce, dalla partita si torna alla home) | opzione 1 del collaudo: un `popstate` su una voce senza `plinto` è un cambio d'ancora, non un Indietro; si adotta e si lascia agire `hashchange` | `ANCORA_NON_E_INDIETRO` in `src/ui/useTastoIndietro.js` (usato anche da `src/ui/rotta.js`) | `npm run indietro` (caso 5, nuovo) |
| ITCH | `docs/ITCH.md:78` diceva «the same game for everyone» | «one a day, with the same start for everyone», come `guida.altreModalita` in `en.js` (F3) | nessuno (testo di un documento) | — |

F2 (`STATO_SFIDA_IN_CORSO`, chiave `home.inCorso`) e F1 (`NUOVA_PARTITA_SOLO_NEL_MENU`)
sono **tolti**: PO-010 li sostituisce (decisione del PO e della madre).

## PO-010 — testi

| chiave | it | en | dove |
|---|---|---|---|
| `home.partitaLibera` (esistente) | Partita libera | Free play | nome della card, sempre |
| `sfida.breve` (esistente) | Sfida del giorno | Daily challenge | nome della card, sempre |
| `home.riprendiStato` (nuova) | Riprendi › | Resume › | a destra, con una partita in corso |
| `home.nuovaLibera` (nuova) | Nuova partita libera | New free game | collegamento sotto la libera in corso |
| `home.riprendiLibera` (nuova) | riprendi la partita in corso | resume the game in progress | nome accessibile: «Partita libera, riprendi la partita in corso» |
| `home.riprendiSfida` (nuova) | riprendi la sfida in corso | resume the challenge in progress | nome accessibile: «Sfida del giorno, riprendi la sfida in corso» |
| `home.inCorso` | *(tolta)* | *(tolta)* | era F2 |

Senza partita in corso la card dice a destra quello che diceva prima («Record 1.836»,
«Mai giocata», «Da giocare») e il collegamento non c'è: la card stessa comincia una
partita. Le chiavi `home.riprendi` e `sfida.riprendi` restano: le usa l'interruttore spento.

Testi letti dalla home costruita (`npm run build` + `vite preview`), 360x640, record 1.836:

| stato | lingua | card libera (testo visibile) | card sfida | nome accessibile | collegamento |
|---|---|---|---|---|---|
| PRIMA libera | it | Riprendi la partita · Record 1.836 | Sfida del giorno · Da giocare | «Riprendi la partita, Record 1.836» | — |
| PRIMA sfida | it | Partita libera · Record 1.836 | Riprendi la sfida · In corso | «Riprendi la sfida» | — |
| PRIMA libera | en | Resume game · Best 1.836 | Daily challenge · Not played yet | «Resume game, Best 1.836» | — |
| PRIMA sfida | en | Free play · Best 1.836 | Resume challenge · In progress | «Resume challenge» | — |
| DOPO libera | it | Partita libera · **Riprendi ›** | Sfida del giorno · Da giocare | «Partita libera, riprendi la partita in corso» | Nuova partita libera |
| DOPO sfida | it | Partita libera · Record 1.836 | Sfida del giorno · **Riprendi ›** | «Sfida del giorno, riprendi la sfida in corso» | — |
| DOPO libera | en | Free play · **Resume ›** | Daily challenge · Not played yet | «Free play, resume the game in progress» | New free game |
| DOPO sfida | en | Free play · Best 1.836 | Daily challenge · **Resume ›** | «Daily challenge, resume the challenge in progress» | — |

L'aiuto (`ComeSiGioca.jsx`, `PrimoAvvio.jsx`, `intro.js`) non cita né «Riprendi» né il
collegamento della home (cercato con `grep -i "riprend\|nuova partita"`: nessuna
occorrenza), quindi non è stato riaperto. `tests/lessico.test.js` verde (dentro `npm test`).

## PO-010 — misure prima e dopo

`libero` = pixel verticali che avanzano nella home fra il primo e l'ultimo blocco
(negativo = scorre); tutte le righe hanno `scorre` = 0 sia prima sia dopo. **PRIMA** =
build di `40f5173` (F1: niente collegamento); **DOPO** = build di questo ramo. Fonte:
tabella di `npm run home-spiegazione` sulle due build di produzione
(`PLINTO_E2E_URL=http://127.0.0.1:4180/` e `:4173/`). Valori **identici in italiano e in
inglese**. Stati: nuova (primo avvio), sfida (sfida di oggi in corso), libera (libera in
corso), livello (livello 11 a metà), tutte (libera + sfida + livello).

| formato | nuova P→D | sfida P→D | libera P→D | livello P→D | tutte P→D |
|---|---|---|---|---|---|
| 360x640 | 2 → 32 | 2 → 32 | 2 → **4** | 2 → 32 | 2 → **4** |
| 375x667 | 28 → 58 | 28 → 58 | 28 → 30 | 28 → 58 | 28 → 30 |
| 390x844 | 155 → 155 | 155 → 155 | 155 → 123 | 155 → 155 | 155 → 123 |
| 412x915 | 234 → 234 | 234 → 234 | 234 → 202 | 234 → 234 | 234 → 202 |
| 1280x800 | 66 → 66 | 66 → 66 | 66 → 34 | 66 → 66 | 66 → 34 |
| 1366x768 | 39 → 39 | 39 → 39 | 39 → **7** | 39 → 39 | 39 → **7** |

- **La home non scorre in nessuno stato e in nessun formato**, anche con un numero di
  versione lungo (`v10.20.30`, controllo già presente). Margine minimo: **4 px** a
  360x640 e **7 px** a 1366x768, negli stati con la libera in corso.
- Il collegamento costa 32 px (28 di altezza + 8 di spazio − 4 di margine negativo sopra
  e sotto della griglia: misurato come differenza «libera» − «nuova» a 390x844 e sui
  desktop, dove la compattazione non agisce).
- Card: 52 px in tutti gli stati e formati (minimo 44). Collegamento «Nuova partita
  libera»: 28 px (minimo 24). Collegamenti in fondo: 27 px. Archivio sotto i 680 px di
  altezza: 44 px (prima 52). Contrasto della riga di spiegazione invariato: 6.35 / 8.097.
- La compattazione vale solo in verticale sotto i 680 px (360x640, 375x667 fra i formati
  provati): 390x844, 412x915 e i desktop non cambiano negli stati senza collegamento.
- `npm run impaginazione` (13 formati, home e tavolo) verde sulla build.

## Interruttori e prova rosso/verde

Ogni interruttore spento a mano, ricostruito con `npm run build`, servito con
`npx vite preview` e provato con `PLINTO_E2E_URL=http://127.0.0.1:<porta>/`. Lo stesso
risultato si ha sul server di sviluppo (provato prima, stessi numeri).

| interruttore | controllo | acceso (build) | spento (build) |
|---|---|---|---|
| tutti accesi | `home-spiegazione`, `indietro`, `impaginazione` | verdi (exit 0) | — |
| `NOME_FISSO_E_STATO` | `npm run home-spiegazione` | verde | **rosso**, 168 errori: in tutti i formati e lingue, stati libera/sfida/tutte: «con la libera in corso lo stato e «Record 18.740» invece di «Riprendi ›»», «manca «Nuova partita libera»», «il nome accessibile della libera e «Riprendi la partita, Record 18.740»…», idem per la sfida |
| `HOME_BASSA_COMPATTA` | `npm run home-spiegazione` | verde | **rosso**: «la home scorre di 28px» a 360x640 e «di 3px» a 375x667, stati libera e tutte, it ed en |
| `HOME_BASSA_COMPATTA` | `npm run impaginazione` | verde | **rosso**: «Android di base (360x640): la home scorre di 28px» |
| `ANCORA_NON_E_INDIETRO` | `npm run indietro` | verde | **rosso**: «G1 dalla home: schermata home, ancora vuota» e «G1 dalla partita libera: schermata home, ancora vuota», cioè il difetto del collaudo |

Prima di cambiare i controlli, `npm run correzioni` era rosso su C1 («anche senza la
correzione la home non scorre: la prova non prova nulla»): con la compattazione la home
del primo avvio ha 32 px di margine e C1 non sapeva più fallire. C1 ora usa la home con
la libera in corso, che è la più alta: senza `HOME_STRETTA_COMPATTA` scorre di 2 px,
con 0 (verde).

## G1 — l'ancora cambiata con la scheda aperta

### Misura prima di correggere

`npm run indietro`, caso 5 nuovo, con `ANCORA_NON_E_INDIETRO` spento (= codice di prima):

```
G1 dalla home: {"schermata":"home","ancora":"","domanda":0,"seme":null}
G1 dalla partita libera: {"schermata":"home","ancora":"","domanda":0,"seme":null}
```

Riproduce il collaudo (`collaudo/g1.mjs`, `g2.mjs`): l'ancora sparisce e dalla partita si
torna alla home.

### Perché la decisione non bastava alla lettera

Il mandato dice: un cambio d'ancora è «uno stato senza `plinto`». Nel codice di prima
**anche la voce di partenza non ha `plinto`** (è la voce su cui si apre la pagina), e
`scriviRotta` (`src/ui/rotta.js`) riscriveva lo stato della voce con `null`. Ignorare
ogni `popstate` senza `plinto` avrebbe quindi rotto il ritorno alla home da qualunque
schermata (home → mappa → Indietro arriva proprio sulla voce di partenza). Per rendere
vera la definizione della decisione, con lo stesso interruttore:

1. al primo giro di `useTastoIndietro` la voce di partenza riceve `{ plinto: 0 }` (o il
   gradino adottato dopo una ricarica, B6);
2. `scriviRotta` conserva lo stato della voce invece di metterlo a `null`;
3. un `popstate` su una voce senza `plinto` (e non provocato da noi, `daIgnorare = 0`)
   non è un Indietro: la voce prende il gradino corrente (`{ plinto: messe }`), `messe`
   non cambia, `normalizza` e `passoIndietro` non si chiamano. Decide `hashchange` /
   `usaRotta`.

### Dopo

```
G1 dalla home: {"schermata":"gioco","ancora":"#/sfida/2026-10-10","domanda":0,"seme":"2026-10-10"}
ok  G1: da quella sfida Indietro torna alla home, senza ancora
G1 dalla partita libera: {"schermata":"gioco","ancora":"#/sfida/2026-10-11","domanda":0,"seme":"2026-10-11"}
ok  G1: da li Indietro torna alla home
```

`npm run indietro` (casi 1-4 invariati e verdi), `npm run e2e-po008` (casi A-M, compreso
M «`#/sfida/<giorno>` dopo la domanda») e `npm run correzioni` (B6 compreso) verdi.

### Residuo, non corretto

Dopo un cambio d'ancora c'è una voce di cronologia in più (quella che il browser
aggiunge per l'ancora). Nel caso 5, tornati alla home, il primo Indietro **resta sulla
home** invece di uscire (`ancora sulla home dopo Indietro: true`), e serve un Indietro in
più. Succede **identico anche con l'interruttore spento** (misurato, stessa riga nel
rosso), quindi non è introdotto da G1. Non ho aggiunto un controllo rosso su questo:
non era chiesto e toglierlo vorrebbe dire consumare voci della cronologia che ha messo
il browser.

| | opzione | effetto |
|---|---|---|
| **A (consigliata)** | lasciarlo: il caso (collegamento incollato con la scheda aperta) è raro, e un Indietro in più è meno grave di un'uscita imprevista dal gioco | nessun codice |
| B | adottare la voce dell'ancora al gradino corrente **più uno**, così che Indietro da lì torni dov'eri | il primo Indietro dopo il collegamento riporta alla schermata di prima e non alla home; va pensato con la domanda di conferma di J/K/L |
| C | `history.go(-1)` dopo l'adozione, per togliere la voce | riaccende proprio il tempismo che `useTastoIndietro` ha eliminato (vedi il commento sull'app installata) |

## Opzioni di PO-010, con la consigliata

La decisione del PO è presa («Nome fisso + stato»); le scelte che restavano a me:

| tema | opzione | stato |
|---|---|---|
| spazio per il collegamento a 360x640 | **A (consigliata, implementata)**: compattare la home bassa in tutti gli stati (spazi, Archivio a 44 px) | margine 4 px; la home non cambia ritmo fra gli stati |
| | B: compattare solo con la libera in corso | stesso margine, ma la home si muove quando si comincia o si finisce una partita (era l'opzione C scartata in F1) |
| | C: collegamento affiancato all'Archivio su una riga | accosta un comando della libera e uno della Sfida: il problema di PO-009 |
| aspetto di «Riprendi ›» | **A (implementata)**: stessa posizione e stesso ottone del record, carattere del testo | nessuna altezza in più |
| | B: «Riprendi ›» come pillola colorata | più evidente, ma da misurare per altezza e contrasto |

## Screenshot

In `docs/sviluppo/po010-g1/`, 360x640, build di produzione, record 1.836:

- prima: `prima-360x640-libera-it.png`, `prima-360x640-libera-en.png`,
  `prima-360x640-sfida-it.png`, `prima-360x640-sfida-en.png`
- dopo: `dopo-360x640-libera-it.png`, `dopo-360x640-libera-en.png`,
  `dopo-360x640-sfida-it.png`, `dopo-360x640-sfida-en.png`

## Controlli finali

| comando | esito |
|---|---|
| `npm test` | verde: 45 file, 648 prove |
| `npm run build` | verde |
| `npm run correzioni` | verde (dopo G1) |
| `npm run impaginazione` | verde (build) |
| `npm run home-spiegazione` | verde (sviluppo e build) |
| `npm run comunicazioni` | verde |
| `npm run e2e-po008` | verde |
| `npm run indietro` | verde (sviluppo e build) |

Selettori aggiornati al nuovo nome accessibile (non fatti girare, salvo
`ripresa-livello.mjs` = `e2e-po008`): `tests/e2e/partita.mjs`, `precisione.mjs`,
`tools/schermate.mjs`, `tools/video-store.mjs`.

## Non verificato

- Non posso confermare l'aspetto su un telefono vero: tutte le misure sono di Chromium
  con i font del container. Con altri font le altezze possono cambiare di qualche pixel;
  il margine a 360x640 con la libera in corso è di 4 px.
- Non posso confermare il comportamento di G1 dentro l'app Android (TWA): provato solo in
  Chromium con `location.hash`. Come arrivi un collegamento `#/sfida/…` all'app già
  aperta dipende da Android e da Chrome.
- Non ho fatto girare `npm run partita`, `precisione`, `resistenza`, `anteprima`,
  `condivisione`, `schermate`, `video` né `npm run verifica` (escluso dal mandato): i
  selettori cambiati lì sono stati controllati solo leggendoli.
- Non ho misurato la home in orizzontale sui telefoni.
- La comprensione del PO dei testi nuovi non è verificabile a macchina.

## Commit

- `48a93ae` PO-010: card della home con nome fisso e «Riprendi ›», torna «Nuova partita libera»
- `ceb7d4a` G1: un cambio d'ancora con la scheda aperta non e' un Indietro
- commit di questo rapporto, ITCH e screenshot: vedi `git log` del ramo (hash finale
  riportato nella consegna).
