# Registro degli asset e delle licenze

Questo file è un **registro**, non una dichiarazione di intenti. Ogni risorsa che entra nel
progetto va scritta qui **prima** di essere usata, con la sua origine e la sua licenza. Se una
risorsa è nel repository e non è in questa tabella, è un errore da correggere.

> Verifica del 6 settembre 2026, rifatta dopo l'introduzione del sistema audio (commit
> `ee7b452`) leggendo `package.json`, `index.html` e il contenuto di `public/` e `src/`.

## Stato attuale

Il progetto **non usa nessun asset di terze parti**: nessuna immagine scaricata, nessun font
esterno, nessun campione sonoro, nessuna icona presa da una libreria. Verificato:

- in `src/` e `public/` non esiste **nessun file binario** — zero immagini raster, zero file
  audio, zero font (`find` su `.png .jpg .webp .wav .mp3 .ogg .m4a .woff .woff2 .ttf`);
- nessuna stringa `base64` nel sorgente, quindi nessun asset nascosto dentro un data URI;
- l'unico `http://` presente fuori da `src/config/progetto.js` è lo **spazio dei nomi XML**
  di `public/icon.svg` (`xmlns="http://www.w3.org/2000/svg"`), che è un identificatore e non
  una richiesta di rete. In `progetto.js` c'è un commento che spiega dove il proprietario
  dovrà creare il proprio link di donazione; la costante è vuota.

In particolare **non c'è nessuna `<link>` a Google Fonts**: la tipografia usa solo i font di
sistema, dichiarati in `src/styles/tokens.css`
(`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …`).

Non è una scelta estetica ma di privacy: zero richieste verso domini di terzi significa zero
occasioni di tracciamento del giocatore, prima ancora che meno peso da scaricare.

### L'audio esiste, e non usa nessun file

È il punto che interessa di più a chi controlla le licenze, quindi va detto per esteso invece
di lasciarlo dedurre.

Dal commit `ee7b452` il gioco ha un sistema audio completo — nove voci: presa del pezzo,
appoggio, mossa rifiutata, eliminazione, grande combo, griglia svuotata, nuovo record, fine
partita, tocco di interfaccia — e **non contiene un solo file audio**. Ogni suono viene
**generato a runtime** in `src/audio/suoni.js` con oscillatori (`createOscillator`), inviluppi
di guadagno (`createGain`) e, per i suoni percussivi, un breve buffer di rumore riempito con
`Math.random()` e filtrato passa-basso: tutte primitive della **Web Audio API** del browser.

Conseguenze per questo registro:

- **nessun campione di terzi**, quindi nessuna licenza audio da verificare, attribuire o
  rinegoziare al momento della pubblicazione;
- **zero byte di asset audio** nel bundle, e nessun file da distribuire insieme al gioco;
- l'unica dipendenza è un'API standard del browser, che non è un asset.

Le note usate stanno su una scala pentatonica maggiore in Do, presente nel sorgente come
array di frequenze in hertz: sono numeri, non una registrazione.

### Asset grafici e sonori

| Asset | Tipo | Origine | Licenza | Note |
| --- | --- | --- | --- | --- |
| `public/icon.svg` | icona SVG | originale del progetto | del progetto | 4 rettangoli disegnati a mano nei colori di `tokens.css`; nessun tracciato importato |
| `src/ui/Logo.jsx` | marchio SVG inline | originale del progetto | del progetto | disegnato in codice, non è un font e non è un file immagine |
| icone di interfaccia (menu a tre righe, freccia indietro) | SVG inline | originale del progetto | del progetto | `<rect>` e `<path>` scritti a mano in `Hud.jsx` e `Pagina.jsx`; **nessuna libreria di icone** |
| suoni del gioco | **nessun file** | sintetizzati a runtime in `src/audio/suoni.js` | non applicabile | oscillatori e rumore filtrato della Web Audio API; vedi la sezione qui sopra |
| — font — | — | — | — | **nessuno esterno**: solo stack di sistema |
| — immagini raster — | — | — | — | **nessuna** |

### Dipendenze software

Sono l'unica cosa di terzi che il progetto usa. Nessuna di esse porta con sé asset (font,
immagini, suoni) che finiscano nel bundle.

| Pacchetto | Ruolo | Tipo | Licenza |
| --- | --- | --- | --- |
| `react` ^18.3.1 | libreria di vista | dipendenza di produzione | MIT |
| `react-dom` ^18.3.1 | rendering nel DOM | dipendenza di produzione | MIT |
| `vite` ^5.4.11 | bundler e dev server | sviluppo | MIT |
| `@vitejs/plugin-react` ^4.3.4 | supporto JSX/Fast Refresh | sviluppo | MIT |
| `vitest` ^2.1.8 | test runner | sviluppo | MIT |
| `playwright` ^1.63.0 | automazione browser | sviluppo | Apache-2.0 |

Le licenze indicate sono quelle dichiarate dai rispettivi progetti; vanno riverificate quando
si aggiorna una dipendenza maggiore. `playwright` è usato da `tests/e2e/partita.mjs`, lo
scenario che guida un browser reale attraverso una partita completa (`npm run e2e`); non
entra nel bundle di produzione.

## Regole che il progetto si dà

1. **Solo asset originali, o con licenza compatibile e documentata.** Nessuna risorsa entra
   "per ora, poi vediamo". Se non si sa da dove viene, non entra.
2. **Ogni asset va registrato in questo file prima di essere usato**, con origine (URL o
   autore), licenza esatta e, se la licenza lo richiede, il testo di attribuzione da mostrare.
3. **Suoni generati proceduralmente. Regola applicata, non più un'intenzione.** La sintesi via
   Web Audio elimina in radice la questione delle licenze audio, ed è la strada che il progetto
   ha effettivamente preso (`src/audio/suoni.js`). Un campione registrato si introduce solo se
   la sintesi non regge, e in quel caso va prima registrato qui con origine e licenza esatte.
4. **Nessuna risorsa caricata da un dominio esterno a runtime.** Niente CDN, niente font
   remoti, niente immagini via URL. Ciò che serve sta nel bundle; è una regola di privacy e va
   trattata come vincolo, non come preferenza.
5. **Niente asset generati da terzi senza una licenza chiara e verificabile**, incluse le
   risorse di provenienza incerta trovate in raccolte "gratuite".
6. **Le dipendenze npm si contano come asset**: aggiungerne una richiede di aggiungere una riga
   alla tabella qui sopra, con la sua licenza.
