# Collaudo 1.21.27

Figlia di collaudo, 27 ottobre 2026, ramo `collaudo-1.21.27` (da `main` a `4711175`). **In corso**:
questo file viene completato man mano che le prove finiscono.

Oggetto: la 1.21.27 pubblicata su https://antoniovairo-rgb.github.io/Plinto/. Bundle servito
`assets/index-aMWmD0h1.js`, contiene «1.21.27» (4 volte); `last-modified: Tue, 27 Oct 2026 19:00:53 GMT`.

## Le 7 prove richieste contro il sito (prime misure)

`npm ci` verde; poi `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`, una prova alla volta:

| prova | esito | durata |
|---|---|---|
| `npm run e2e-schermi` (completo, con i «lanci») | verde: «Tutto a posto su 13 formati, 5 coricati e 2 col testo x2 e 2 coi lanci»; righe `lanci 360x640` e `lanci 915x412` = ok | 612 s |
| `npm run precisione` | verde, 205 prove su 41 forme, «Nessuno scostamento»; rilascio veloce CPU 4x 3 partite su 3 uguali al motore per 14 mosse | 243 s |
| `npm run e2e` | verde, «Nessun problema rilevato» | 16 s |
| `npm run e2e-attrezzi` | verde, «Nessun problema rilevato» | 40 s |
| `npm run e2e-po008` | verde, «Tutto a posto»; «94 tentate, 0 ritentate, 0 non fatte» | 202 s |
| `npm run guida` | verde: 6 passi; i due pulsanti per saltarla alti 45 px | 14 s |
| `npm run indietro` | verde, «Tutte le verifiche del tasto Indietro sono passate» | 12 s |
