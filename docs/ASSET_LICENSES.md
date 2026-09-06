# Registro degli asset e delle licenze

Questo file è un **registro**, non una dichiarazione di intenti. Ogni risorsa che entra nel
progetto va scritta qui **prima** di essere usata, con la sua origine e la sua licenza. Se una
risorsa è nel repository e non è in questa tabella, è un errore da correggere.

> Verifica del 6 settembre 2026, fatta leggendo `package.json` e il contenuto di `public/` e
> `src/`.

## Stato attuale

Il progetto **non usa nessun asset di terze parti**: nessuna immagine scaricata, nessun font
esterno, nessun suono, nessuna icona presa da una libreria. Un `grep` su `src/` e `index.html`
non trova nessun riferimento a un dominio esterno (l'unico URL presente è un commento in
`src/config/progetto.js` che spiega dove il proprietario dovrà creare il proprio link di
donazione). In particolare **non c'è nessuna `<link>` a Google Fonts**: la tipografia usa solo
i font di sistema, dichiarati in `src/styles/tokens.css`
(`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …`).

Non è una scelta estetica ma di privacy: zero richieste verso domini di terzi significa zero
occasioni di tracciamento del giocatore, prima ancora che meno peso da scaricare.

### Asset grafici e sonori

| Asset | Tipo | Origine | Licenza | Note |
| --- | --- | --- | --- | --- |
| `public/icon.svg` | icona SVG | originale del progetto | del progetto | 4 rettangoli disegnati a mano nei colori di `tokens.css`; nessun tracciato importato |
| `src/ui/Logo.jsx` | marchio SVG inline | originale del progetto | del progetto | disegnato in codice, non è un font e non è un file immagine |
| — suoni — | — | — | — | **nessuno**: `src/audio/` è vuota |
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
3. **Suoni generati proceduralmente quando possibile.** La Web Audio API permette di sintetizzare
   i suoni del gioco senza nessun file: è la strada da tentare per prima, sia per il peso sia
   perché elimina in radice la questione delle licenze audio. Un campione registrato si
   introduce solo se la sintesi non regge.
4. **Nessuna risorsa caricata da un dominio esterno a runtime.** Niente CDN, niente font
   remoti, niente immagini via URL. Ciò che serve sta nel bundle; è una regola di privacy e va
   trattata come vincolo, non come preferenza.
5. **Niente asset generati da terzi senza una licenza chiara e verificabile**, incluse le
   risorse di provenienza incerta trovate in raccolte "gratuite".
6. **Le dipendenze npm si contano come asset**: aggiungerne una richiede di aggiungere una riga
   alla tabella qui sopra, con la sua licenza.
