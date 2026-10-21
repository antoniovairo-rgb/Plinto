# Collaudo 1.21.21 (PO-024, PO-025)

Ramo `collaudo-1.21.21`, 21 ottobre 2026. In corso: questo file viene aggiornato a ogni passo.

## 0. Che cosa è stato collaudato

- Sito: `https://antoniovairo-rgb.github.io/Plinto/`. L'HTML carica `assets/index-K6eW_1CD.js`;
  nel bundle «1.21.21» compare 4 volte, nessun'altra versione 1.21.x.
- `npm run build` sul commit `3a7d879` (punta di `main`) produce lo stesso nome,
  `dist/assets/index-K6eW_1CD.js`: il sito pubblicato è la build di questo commit.
- CI su `main` (letta con l'API di GitHub alle ~05:5x UTC): «pubblica su Pages» verde per
  `3a7d879`; «verifica» (run 199) ancora **in corso**. Il suo esito: da aggiornare.
