# Collaudo 1.21.23

Figlia di collaudo, 21 ottobre 2026. Ramo `collaudo-1.21.23`, partito da `main` a `28c280f`
(«ROADMAP: 1.21.23 pubblicata»). Nessun file del gioco toccato, niente su `main`: solo questo
rapporto e le schermate in `docs/sviluppo/collaudo-1.21.23/`.

Ambiente: container, Chromium `/opt/pw-browsers/chromium` (collegamento a
`chromium-1194/chrome-linux/chrome`), Playwright del progetto dopo `npm ci`, font del
container. Tutte le prove sono contro il sito pubblicato
`https://antoniovairo-rgb.github.io/Plinto/`. Su un telefono vero, con una tastiera fisica
collegata a un telefono, con TalkBack o su iOS: **non posso confermarlo**.

_Rapporto in corso: le sezioni seguenti vengono completate man mano._

## 0. Che cosa è pubblicato

- `index.html` del sito carica `assets/index-BiMDBRRy.js`; quel bundle contiene la stringa
  `1.21.23` (4 occorrenze, `curl` + `grep -o '1\.21\.[0-9]*'`). È la versione da collaudare.
- `package.json` di `main` a `28c280f`: `"version": "1.21.23"`.
