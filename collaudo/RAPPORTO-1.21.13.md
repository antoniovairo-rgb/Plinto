# Collaudo 1.21.13 — versione pubblicata

- **Dove:** https://antoniovairo-rgb.github.io/Plinto/ (18 ottobre 2026).
- **Versione:** il bundle pubblicato `assets/index-BywINjbX.js` contiene `"1.21.13"` (3 occorrenze, `curl … | grep -o '"1\.21\.[0-9]*"'`); la home mostra «v1.21.13» (schermate). Commit di riferimento `4d65c5b`.
- **Contenuto:** solo PO-011 (`591d050`): una regola CSS, `.pl-sfida-avvio__esito--evidenza.pl-sfida-avvio__esito--allineata { box-shadow: none; align-self: center; }` (`src/styles/app.css:1787`).

## Esito: PO-011 riconfermato, nessuna regressione trovata in home

Script: `node collaudo/collaudo-1.21.13.mjs` (uscita in `collaudo/uscita-1.21.13.txt`). Per ogni formato e lingua si gioca davvero (3 mosse) nella libera o nella sfida, si torna alla home con Indietro e si misura ogni card: testo dello stato, `box-shadow`, scarto fra bordo destro dello stato e bordo del contenuto della card, bordo destro assoluto, scarto verticale fra centro dello stato e centro del nome.

| Lingua | Formato | In corso | Pillola | Alone | Scarto dal bordo | Bordo dx pillola / altri stati | Centro Y | Scorre in orizzontale |
|---|---|---|---|---|---|---|---|---|
| it | 360x800 | libera | Riprendi › | none | 0 px | 318 / 318, 318 | 0 | no |
| it | 360x800 | sfida | Riprendi › | none | 0 px | 318 / 318, 318 | 0 | no |
| it | 412x915 | libera | Riprendi › | none | 0 px | 370 / 370, 370 | 0 | no |
| it | 412x915 | sfida | Riprendi › | none | 0 px | 370 / 370, 370 | 0 | no |
| en | 360x800 | libera | Resume › | none | 0 px | 318 / 318, 318 | 0 | no |
| en | 360x800 | sfida | Resume › | none | 0 px | 318 / 318, 318 | 0 | no |
| en | 412x915 | libera | Resume › | none | 0 px | 370 / 370, 370 | 0 | no |
| en | 412x915 | sfida | Resume › | none | 0 px | 370 / 370, 370 | 0 | no |

- La pillola non ha alone e il suo bordo destro coincide (scarto 0 px, arrotondato a 0,1) con quello di «Da giocare»/«Mai giocata»/«0 di 100» nelle altre card.
- Errori di pagina: 0 in tutte le otto prove.
- Home: nessuno scorrimento orizzontale; testi degli stati come da dizionario (it: «Da giocare», «Mai giocata», «0 di 100»; en: «Not played yet», «Never played», «0 of 100»). Nelle schermate non ho visto testi tagliati o sovrapposti.
- Schermate: `collaudo/schermate/1.21.13-{it,en}-{360x800,412x915}-{libera,sfida}.png`.

## Difetti
Nessuno nuovo. I1 (collaudo 1.21.12) è ancora presente nella 1.21.13: il rilascio non lo tocca; la correzione è su questo ramo (`docs/sviluppo/RAPPORTO-I1.md`).

## Non verificato
- Android/TWA reale: la prova è in Chromium del container, non su un telefono. Non posso confermarlo sul dispositivo.
- Font: il container può avere font diversi dal telefono; le misure sono relative (bordi nella stessa pagina), ma il rendering esatto sul telefono non posso confermarlo.
- Stato «entrambe in corso» (libera e sfida insieme) e formati diversi da 360x800 e 412x915: non provati in questo collaudo.
- `npm run verifica` non lanciato (come richiesto).
