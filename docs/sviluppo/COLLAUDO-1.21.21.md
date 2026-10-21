# Collaudo 1.21.21 (PO-024, PO-025)

Ramo `collaudo-1.21.21`, 21 ottobre 2026. In corso: questo file viene aggiornato a ogni passo.

## 0. Che cosa è stato collaudato

- Sito: `https://antoniovairo-rgb.github.io/Plinto/`. L'HTML carica `assets/index-K6eW_1CD.js`;
  nel bundle «1.21.21» compare 4 volte, nessun'altra versione 1.21.x.
- `npm run build` sul commit `3a7d879` (punta di `main`) produce lo stesso nome,
  `dist/assets/index-K6eW_1CD.js`: il sito pubblicato è la build di questo commit.
- CI su `main` (letta con l'API di GitHub alle ~05:5x UTC): «pubblica su Pages» verde per
  `3a7d879`; «verifica» (run 199) ancora **in corso**. Il suo esito: da aggiornare.

## 1. Script del progetto contro il sito pubblicato

`npm ci` riuscito. Tutti con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/`,
Chromium di `/opt/pw-browsers` (`chromium-1194`), font del container, uno dopo l'altro.

| Script | Uscita | Durata | Ultima riga / esito |
|---|---|---|---|
| `npm run home-spiegazione` | 0 | 165 s | «La riga c'e' in italiano e in inglese, … «Nuova» sta dentro la card della libera.» |
| `npm run e2e-po008` | 0 | 110 s | «Tutto a posto.» (casi A–Q) |
| `npm run e2e` | 0 | 20 s | «Nessun problema rilevato.» |
| `npm run indietro` | 0 | 13 s | «Tutte le verifiche del tasto Indietro sono passate.» |
| `npm run annulla` | 0 | 6 s | «Il "rimetti a posto" compare quando deve, ripristina esattamente, e poi sparisce.» |
| `npm run e2e-attrezzi` | 0 | 43 s | «Nessun problema rilevato.» |

- `home-spiegazione`: colonna `morti` **0** in tutti gli stati `libera` e `tutte`, 8 formati,
  it ed en, con gli stessi pixel di card del rapporto PO-024/025 (it 320x700 `0/18367`,
  en 320x700 `0/14015`, 360x640 `0/16388`, 390x844 `0/17978`, 1366x768 `0/19631`…);
  colonna «Nuova» `102/102` o `105/105` come prima (PO-023 invariato); colonna «scorre» 0
  ovunque.
- `e2e-po008` caso Q: «libera Escape: Menu; libera velo: Menu; libera Torna alla partita:
  Menu; libera Indietro: Menu; domanda sopra, poi Esc: Menu; Torna alla home: home, fuoco
  <body>; livello Escape: Menu». Caso P (PO-023): «home Esc: Nuova partita libera; home
  velo: Nuova partita libera; … Riprova Esc: Menu; Gioca velo: Gioca».
- `e2e-quadri` e `recensione` (i due rossi noti dei container figli) non lanciati: non
  erano nell'elenco.
