# QUADRA

Puzzle game a blocchi. Gratuito, **senza pubblicita**, senza account, senza attese.

> Stato: **in sviluppo** (Milestone 1 — prototipo del core). Non ancora giocabile.

## Il gioco in una riga

Ricevi tre pezzi, li appoggi su una griglia 9x9 e li fai sparire completando una
**riga**, una **colonna** o un **quadrante 3x3**. Finisce quando nessun pezzo entra piu'.

## Cosa lo rende QUADRA e non un altro gioco a blocchi

1. **Il quadrante.** Non si eliminano solo righe e colonne: anche i nove riquadri 3x3.
   Una sola mossa puo' chiuderne tre insieme.
2. **La Catena.** Il moltiplicatore non si azzera quando sbagli: **scende di uno**.
   La partita diventa una tensione continua invece di una serie di combo isolate.
3. **Le diagonali.** Forme rare che obbligano a leggere la griglia in un altro modo.
4. **Equita' dichiarata.** Nessuna difficolta' occulta. Le uniche regole nascoste che
   esistono servono ad *aiutare* il giocatore, e sono scritte in chiaro in
   [docs/GAMEPLAY_RULES.md](docs/GAMEPLAY_RULES.md).

## Comandi

```bash
npm install
npm run dev        # server di sviluppo
npm run build      # build di produzione in dist/
npm test           # suite di test
npm run sim        # simulazione di bilanciamento (migliaia di partite)
```

## Documentazione

| File | Contenuto |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Come e' fatto il codice e perche' |
| [docs/GAMEPLAY_RULES.md](docs/GAMEPLAY_RULES.md) | Regole, punteggio, equita' |
| [docs/TESTING.md](docs/TESTING.md) | Test automatici e simulazioni |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Storico delle versioni |

## Modello economico

Gratuito e senza pubblicita di qualunque tipo. L'unica forma di sostegno prevista e'
una **donazione volontaria**, mai obbligatoria e mai legata a vantaggi di gioco.
