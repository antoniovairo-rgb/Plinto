# Collaudo 1.21.26 — sito pubblicato (in corso)

Figlia di collaudo, 27 ottobre 2026, ramo `collaudo-1.21.26` (da `main` a `ce3e8fe`).
Bersaglio: `https://antoniovairo-rgb.github.io/Plinto/`, bundle `assets/index-CSd4AjUk.js`
(contiene «1.21.26» 4 volte; `last-modified: Tue, 27 Oct 2026 02:37:49 GMT`).
Chromium di prova: `/opt/pw-browsers/chromium`, headless.

Rapporto in scrittura: le sezioni si riempiono man mano.

| prova | esito |
|---|---|
| `npm run precisione` | verde, 205 prove, «Nessuno scostamento» (rilascio veloce CPU 4x: 3 su 3 uguali al motore) |
| `npm run guida` | verde: 6 passi; «Salta per ora» e «Non mostrarmela più» alti 45 px, bordi suoi, a 360x640, 390x844, 640x360 |
| `npm run e2e-schermi` | verde: «Tutto a posto su 13 formati, 5 coricati e 2 col testo x2» (550 s) |
| `npm run e2e` | verde: «Nessun problema rilevato» |
| `npm run e2e-attrezzi` | verde: «Nessun problema rilevato» |
| `npm run e2e-po008` | verde: «Tutto a posto»; «Mosse di unaMossa: 94 tentate, 2 ritentate, 0 non fatte» |
| `npm run indietro` | verde: «Tutte le verifiche del tasto Indietro sono passate» |
