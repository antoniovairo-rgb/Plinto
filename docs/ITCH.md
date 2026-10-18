# PLINTO su itch.io

La versione browser di PLINTO pubblicata anche su itch.io, accanto al sito (GitHub Pages) e
all'app del Play Store. Stesso gioco, stessa build: cambia solo dove viene servito.

Fonte dei requisiti: la guida ufficiale https://itch.io/docs/creators/html5 (ZIP con
`index.html` in cima, percorsi relativi, al massimo 1.000 file e 500 MB). Le misure della
copertina la guida non le scrive: 630x500 è la misura che itch.io suggerisce nel modulo di
caricamento, da ricontrollare lì.

## Come si prepara

```bash
npm run itch
```

Esce tutto in `dist-itch/` (escluso da git):

- `plinto-itch-<versione>.zip` — da caricare;
- `copertina-630x500.png` — la copertina (`tools/immagine-store.mjs --copertina`);
- `prova-iframe.png` — la prova: lo ZIP riaperto, servito da una sottocartella e giocato
  dentro un iframe di un altro indirizzo, come sulla pagina di itch.io. Se il gioco non
  parte, o la console segnala errori, il comando si ferma.

Ogni volta che esce una versione nuova del gioco, lo ZIP va rifatto e ricaricato: itch.io
non si aggiorna da solo come l'app del Play Store.

## Cose da sapere (dette anche al proprietario)

- **Progressi separati.** Su itch.io il gioco gira su un dominio di itch, quindi salvataggi
  separati dal sito e dall'app. Si spostano con il file di salvataggio (Impostazioni → Salvataggio).
- **Probabilmente un dominio condiviso** fra i giochi HTML di itch.io: un altro gioco
  potrebbe cancellare l'archivio del browser per quel dominio. Non verificato; il
  salvataggio su file resta la garanzia.
- **Senza rete** potrebbe non funzionare: il service worker dentro l'iframe di itch.io non
  è garantito. Se non parte, il gioco va avanti lo stesso.
- **Android**: anche da itch.io la voce «Scarica l'app» del menu porta al Play Store.
- **Privacy**: il gioco non manda niente a nessuno; la pagina di itch.io ha le sue
  statistiche e la sua informativa. Detto in `docs/PRIVACY.md`.

## Checklist di caricamento (proprietario, circa 15 minuti)

1. [ ] itch.io → menu in alto a destra → **Upload new project**.
2. [ ] **Title**: `PLINTO` · **Project URL**: `plinto` (diventa `antoniovairo-rgb.itch.io/plinto`).
3. [ ] **Short description or tagline**: il testo qui sotto.
4. [ ] **Classification**: Games · **Kind of project**: **HTML**.
5. [ ] **Release status**: Released.
6. [ ] **Pricing**: **No payments** (oppure «Donate» se si vogliono le donazioni anche lì).
7. [ ] **Uploads**: carica `plinto-itch-<versione>.zip` e spunta **This file will be played
   in the browser**.
8. [ ] **Embed options**:
   - **Embed in page**, dimensioni **430 × 800**;
   - **Mobile friendly**: sì, orientamento **Portrait** (se il modulo lo chiede);
   - **Fullscreen button**: sì;
   - **Automatically start on page load**: no (resta «Click to play»).
9. [ ] **Details → Description**: il testo inglese qui sotto (e, se si vuole, quello italiano sotto).
10. [ ] **Genre**: Puzzle · **Tags**: `puzzle`, `block-puzzle`, `casual`, `singleplayer`,
    `minimalist`, `offline`, `free`, `no-ads`.
11. [ ] **Cover image**: `copertina-630x500.png`.
12. [ ] **Screenshots**: 3-4 da `store/` (`3-livello.png`, `4-eliminazione.png`,
    `1-mappa-livelli.png`, `7-statistiche.png`).
13. [ ] **Visibility**: prima **Draft**, prova la pagina dal telefono e dal computer, poi **Public**.

## Testi

### Tagline (inglese)

```
A block puzzle where 3×3 quadrants clear too. 100 levels, a daily challenge, no ads.
```

### Descrizione (inglese, principale)

```
PLINTO is a block puzzle with one extra rule: besides rows and columns, you also clear 3×3 quadrants. Three directions instead of two — and a move that closes more than one at once is worth far more.

• 100 levels in seven acts, each with a stated goal and a move limit
• A Daily Challenge: one a day, with the same start for everyone, no streaks to keep
• Free play, for as long as the pieces fit
• Four site tools, earned by playing — never bought
• No ads, no purchases, no account, no data collected

Plays in the browser, on phone and computer. On Android it is also on Google Play:
https://play.google.com/store/apps/details?id=io.github.antoniovairo_rgb.plinto

Your progress stays in your browser. To move it to another device, use Settings → Save file.
```

### Descrizione (italiano, facoltativa, sotto quella inglese)

```
PLINTO è un puzzle a blocchi con una regola in più: oltre a righe e colonne si eliminano anche i quadranti 3×3. Cento livelli, una sfida nuova ogni giorno, partita libera. Niente pubblicità, niente acquisti, niente account.

Su Android c'è anche l'app sul Play Store:
https://play.google.com/store/apps/details?id=io.github.antoniovairo_rgb.plinto
```
