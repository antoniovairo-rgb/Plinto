# Collaudo 1.21.22 (PO-026)

Ramo `collaudo-1.21.22`, 21 ottobre 2026. Nessuna correzione: solo misure. Classi: **E** errore
grave, **D** difetto, **O** osservazione. Per ogni voce le opzioni, la consigliata per prima.

*In corso.*

## 0. Che cosa è stato collaudato

- Sito: `https://antoniovairo-rgb.github.io/Plinto/`. L'HTML carica `assets/index-CSCcVQz9.js`;
  nel bundle «1.21.22» compare 4 volte, nessun'altra versione 1.21.2x.
- `npm run build` sul commit `7430d69` (punta di `main`, ramo `collaudo-1.21.22` partito da
  lì) produce lo stesso nome, `dist/assets/index-CSCcVQz9.js`: il sito pubblicato è la build
  di questo commit (la 1.21.22 è entrata con il merge `2d9e4ca`).
- CI su `main` (API di GitHub, lettura delle ~11:50 UTC): «pubblica su Pages» verde per
  `7430d69` (run 200) e `2d9e4ca` (run 199); «verifica» run 203 (`7430d69`) e 202
  (`2d9e4ca`) **in corso**. Il loro esito: **non posso confermarlo**. L'ultima «verifica»
  conclusa su `main` è la run 201 (`d7cab9a`, prima della 1.21.22), verde.
- Ambiente: container figlio, Chromium `/opt/pw-browsers/chromium` (`chromium-1194`), font
  del container, rete verso GitHub Pages attraverso il proxy. Nessun telefono vero, nessuna
  tastiera fisica su un telefono, nessun TalkBack/VoiceOver, nessun iOS.

## 1. Script del progetto contro il sito pubblicato

`npm ci` riuscito. Tutti con `PLINTO_E2E_URL=https://antoniovairo-rgb.github.io/Plinto/` (il
sito risponde, quindi nessuno script ha avviato un server locale), uno dopo l'altro.

| Script | Uscita | Durata | Ultima riga / esito |
|---|---|---|---|
| `npm run e2e-po008` | 0 | 134 s | «Tutto a posto.» (24 righe, casi A–R) |
| `npm run home-spiegazione` | 0 | 160 s | «La riga c'e' in italiano e in inglese, … «Nuova» sta dentro la card della libera.» |
| `npm run e2e` | 0 | 18 s | «Nessun problema rilevato.» |
| `npm run indietro` | 0 | 13 s | «Tutte le verifiche del tasto Indietro sono passate.» |
| `npm run annulla` | 0 | 5 s | «Il "rimetti a posto" compare quando deve, ripristina esattamente, e poi sparisce.» |
| `npm run e2e-attrezzi` | 0 | 41 s | «Nessun problema rilevato.» |

- `e2e-po008` caso R (la novità): «menu Invio: pezzo scelto, fuoco Menu; menu Spazio: pezzo
  scelto, fuoco Menu; menu Escape: pezzo scelto, fuoco Menu; domanda sopra il menu Escape:
  pezzo scelto, fuoco menu: Nuova partita; domanda sopra il menu Invio: pezzo scelto, fuoco
  Menu; domanda sopra il menu Spazio: pezzo scelto, fuoco Menu; Riprova Invio: pezzo scelto,
  fuoco Menu; Riprova Escape: pezzo scelto, fuoco Menu; tastiera a menu chiuso: pezzo
  posato». Casi P e Q (PO-023, PO-024) come nel collaudo 1.21.21.
- `e2e-quadri` e `recensione` (i due rossi noti dei container figli) non lanciati: non erano
  nell'elenco.
