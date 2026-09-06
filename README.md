# PLINTO

Puzzle game a blocchi. Gratuito, **senza pubblicita**, senza account, senza attese.

> Stato: **giocabile e completo nelle funzioni**, non ancora pubblicato.
> Restano da chiudere le voci del [gate di rilascio](docs/RELEASE_CHECKLIST.md),
> fra cui il collegamento PayPal e la verifica legale del nome.

## Il gioco in una riga

Ricevi tre pezzi, li appoggi su una griglia 9x9 e li fai sparire completando una
**riga**, una **colonna** o un **quadrante 3x3**. Finisce quando nessun pezzo entra piu'.

## Cosa lo rende PLINTO e non un altro gioco a blocchi

1. **Il quadrante.** Non si eliminano solo righe e colonne: anche i nove riquadri 3x3.
   Una sola mossa puo' chiuderne tre insieme.
2. **La Catena.** Il moltiplicatore non si azzera quando sbagli: **scende di uno**.
   La partita diventa una tensione continua invece di una serie di combo isolate.
3. **Le diagonali.** Forme rare che obbligano a leggere la griglia in un altro modo.
4. **Equita' dichiarata.** Nessuna difficolta' occulta. Le uniche regole nascoste che
   esistono servono ad *aiutare* il giocatore, e sono scritte in chiaro in
   [docs/GAMEPLAY_RULES.md](docs/GAMEPLAY_RULES.md).

## Accessibilita'

La partita si gioca **interamente da tastiera** (Tab per scegliere il pezzo, Invio per
prenderlo, frecce per muoversi, Invio per appoggiarlo, Esc per annullare) e ogni mossa
viene descritta a voce ai lettori di schermo. Tutti i contrasti sono misurati e
documentati in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Comandi

```bash
npm install
npm run dev        # server di sviluppo
npm run build      # build di produzione in dist/
npm test           # suite di test unitari
npm run e2e        # partita completa guidata in un browser reale
npm run precisione # precisione del trascinamento su tutte le forme
npm run soak       # sessione lunga: fluidita', memoria, residui
npm run sim        # simulazione di bilanciamento (migliaia di partite)
```

Gli script che usano il browser avviano da soli il server di sviluppo.

## Documentazione

| File | Contenuto |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Come e' fatto il codice e perche' |
| [docs/GAMEPLAY_RULES.md](docs/GAMEPLAY_RULES.md) | Regole, punteggio, equita' |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Colori, contrasti, tipografia, movimento |
| [docs/TESTING.md](docs/TESTING.md) | Test automatici e simulazioni |
| [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md) | Cosa manca prima di pubblicare |
| [docs/ASSET_LICENSES.md](docs/ASSET_LICENSES.md) | Registro delle risorse e delle licenze |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Storico delle versioni |

## Modello economico

Gratuito e senza pubblicita di qualunque tipo. L'unica forma di sostegno prevista e'
una **donazione volontaria**, mai obbligatoria e mai legata a vantaggi di gioco.
