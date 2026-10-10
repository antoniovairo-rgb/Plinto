---
name: materiali-store
description: Rigenera i materiali di PLINTO per gli store e i social — schermate Play Store, immagine in evidenza, video del montaggio, MP4 per YouTube e reel per Instagram. Usala quando una versione cambia l'aspetto del gioco o quando servono materiali per scheda, YouTube, Facebook o Instagram.
disable-model-invocation: true
---

# Materiali per gli store e i social

Tutto si genera dal gioco vero con gli script di `tools/`: niente mockup, niente ritocchi a
mano. Questa skill non reimplementa gli script: dice in che ordine usarli, dove finiscono i
file e le trappole già incontrate. Se un parametro cambia, si cambia nello script (che ne
spiega il perché nei commenti) e poi qui.

## 0. Prima di cominciare
- Su quale ramo? Il Ponte (`main`) mostra 100 livelli; la Torre (`opera-torre`) 200, con
  icona e logo a gemme. I materiali vanno fatti sul ramo della versione che si pubblica.
- Gli script avviano da soli un server vite se non ne trovano uno acceso, e lo spengono
  all'uscita (`tools/server-di-prova.mjs`). Se un server è già acceso, deve servire la
  versione corrente: un vite vecchio rimasto acceso fotografa la versione sbagliata.
- Per fermare processi rimasti appesi: per PID (`readlink /proc/PID/exe`), mai `pkill -f`
  (lo blocca anche l'hook in `.claude/settings.json`).

## 1. Schermate — `npm run schermate`
- Escono in `store/`: otto da 1236×2196 (412×732 a densità 3, cioè 9:16) più
  `riserva-home.png`. Il numero nel nome del file è l'ordine di caricamento in Play Console.
- Lo script si ferma da solo se un'immagine non è caricabile (lato lungo oltre il doppio
  del corto).
- `SUPERATI` (in `tools/schermate.mjs`) decide quanti livelli risultano superati: 23 sul
  Ponte, 112 sulla Torre.
- Le animazioni si congelano con l'orologio finto di Playwright: `clock.install`, poi
  `pauseAt` e `runFor`. Senza `pauseAt` l'orologio finto corre in tempo reale e lo scatto
  perde l'animazione (successo con la schermata dell'Intreccio).
- **Guardale una per una** prima di consegnarle: lo script controlla le misure, non il
  contenuto.

## 2. Immagine in evidenza — `npm run immagine-store`
- Esce in `store/immagine-in-evidenza.png`, 1024×500. I colori si leggono da
  `src/styles/tokens.css`, non sono ricopiati.
- Il testo dei livelli («100» sul Ponte, «200» sulla Torre) e il logo (piatto sul Ponte, a
  gemme sulla Torre) devono corrispondere al ramo.

## 3. Video del montaggio — `npm run video`
- Esce in `store/video/plinto-montaggio.webm`: 780×1688 (390×844 a densità 2), 30 fps,
  circa 90 secondi, senza audio. Scaletta e semi sono in testa a `tools/video-store.mjs`
  (livello 46, `SEME_LIVELLO` 1004, `SEME_LIBERA` 17671): il video si rifà identico.
- Densità 2, non 3: a densità 3 il browser di registrazione perdeva fotogrammi proprio
  negli Intrecci. Si cambia con `PLINTO_VIDEO_DENSITA` solo per prove.
- Fra una scena e l'altra si naviga **dentro l'app**: un `page.goto` lascia secondi di
  schermo nero.
- Prima di ogni scena che dipende dal salvataggio, l'ordine conta: va pulito
  `localStorage` PRIMA di scrivere il salvataggio della scena, non dopo.
- Prima di consegnare, estrai alcuni fotogrammi e guardali (inizio, Intreccio, vittoria,
  fine): un fotogramma nero o una mossa a vuoto si vedono solo così.
- La durata e il ritmo li decide il proprietario: le ultime indicazioni sono «panoramica,
  un minuto e mezzo, ritmo calmo, partita vinta, tante animazioni».

## 4. MP4 per YouTube e reel per Instagram
L'ffmpeg di Playwright scrive solo VP8 e non decodifica PNG: per H.264 serve un ffmpeg
completo. Senza installare nulla nel sistema, si prende quello del pacchetto
`imageio-ffmpeg`, in una cartella vuota dello scratchpad:

```bash
mkdir -p "$SCRATCH/ffmpeg-pkg" && cd "$SCRATCH/ffmpeg-pkg"
pip download imageio-ffmpeg --no-deps -d . -q
unzip -q imageio_ffmpeg-*.whl -d estratto
B=$(ls estratto/imageio_ffmpeg/binaries/ffmpeg-linux-*)
```

Conversione del montaggio per YouTube (il file finisce nello scratchpad, non nel repo):

```bash
"$B" -hide_banner -loglevel error -y -i store/video/plinto-montaggio.webm \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high \
  -movflags +faststart -an "$SCRATCH/plinto-montaggio.mp4"
```

- Reel Instagram: stessi parametri (`-r 30` incluso), tagliando con `-ss`/`-t` o
  `-filter_complex` dal montaggio; finora ne sono stati fatti due, da 33 e da 90 secondi.
- Miniatura YouTube: un fotogramma del video estratto con lo stesso ffmpeg, non uno
  screenshot a parte: è il metodo che ha dato la miniatura giusta.
- Gli MP4 e i reel **non si committano**: sono derivati, si consegnano al proprietario.

## 5. Testi e documentazione
- I testi della scheda, le note di rilascio e i requisiti della Play Console (video, schermate,
  immagine) stanno in `android/SCHEDA-PLAY-STORE.md`: aggiornali nello stesso commit delle
  immagini. Per la Torre vale anche `docs/USCITA-TORRE.md`.
- Testi per i social (post, didascalie): brevi. Il proprietario ha chiesto esplicitamente
  testi sintetici («la gente si rompe di leggere»).
- Mai inventare numeri nei testi: livelli, mosse, durata vanno letti dagli script o
  misurati sul file prodotto.

## 6. Prima di consegnare
- `npm run verifica` (o almeno `--veloce`) se hai toccato codice o script; per i soli
  materiali basta che gli script siano finiti senza errori.
- Commit delle immagini in `store/` e della scheda; push sul ramo giusto. Niente
  pubblicazione in Play Console: la fa il proprietario.
