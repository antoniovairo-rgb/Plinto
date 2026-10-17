# Rapporto 1.21.8 — B6 e B11 (voce PO-004)

Ramo `sviluppo/b6-b11-1.21.8`, partito da `main` a `84d3588`. Versione, CHANGELOG e
ROADMAP non toccati; nessuna pubblicazione; `npm run verifica` completo non lanciato
(lo fa la sessione madre). Difetti dal rapporto del collaudo (`collaudo/RAPPORTO.md`
sul ramo `collaudo-produzione`, righe 74 e 79).

## Esito in breve

| Difetto | Riprodotto | Corretto | Interruttore | Controllo |
|---|---|---|---|---|
| B6 Indietro dopo una ricarica | sì | sì | `ADOTTA_VOCI_DOPO_RICARICA` in `src/ui/useTastoIndietro.js` | B6 in `npm run correzioni` |
| B11 gettoni con «Unisci» | sì (con le funzioni vere, non nell'interfaccia) | sì | `GETTONI_SPESI_NON_TORNANO` in `src/persistence/salvataggio.js` | 3 test in `tests/salvataggio.test.js` |

## B6 — Tasto Indietro dopo una ricarica a metà livello

**Causa (misurata, non solo letta).** Dopo una ricarica la cronologia del browser conserva
le voci `{ plinto: 1 }`, `{ plinto: 2 }` messe prima. L'hook ripartiva con `messe = 0`;
la ripresa (`src/ui/App.jsx`, effetto al montaggio, `setSchermata('quadro')`) riporta
la profondità a 2 e l'hook aggiunge altre due voci. Le due vecchie restano sotto: due
Indietro «a vuoto».

**Correzione.** All'avvio l'hook legge `history.state.plinto` e adotta le voci già
presenti. Al primo giro dell'effetto (che avviene con la home, prima che la ripresa
riporti nel livello) non torna indietro: un `history.go(-n)` lì si incrocerebbe con i
`pushState` della ripresa.

**Prima** (interruttore spento, `npm run correzioni`):
```
B6. ricarico dentro un livello, poi Indietro: mappa, home, fuori...
 - B6: dopo una ricarica Indietro fa «mappa > home > home > home > fuori», atteso «mappa > home > fuori»
```
Coincide con quanto misurato dal collaudo (`mappa > home > home > home > uscito`).

**Dopo** (interruttore acceso, `npm run correzioni`):
```
B6. ricarico dentro un livello, poi Indietro: mappa, home, fuori...
  mappa > home > fuori
```

`npm run indietro` (i quattro percorsi già coperti, senza ricarica) resta verde:
```
  ok  si entra nel livello 1
  ok  da un livello si torna alla mappa, non si esce
  ok  dalla mappa si torna alla home
  ok  dalla home Indietro esce, invece di lasciare il gioco bloccato
  ok  dopo un Indietro resta gia una voce in cronologia (nell app installata: non si chiude)
  ok  Indietro chiude il menu
  ok  chiudere il menu non esce dalla partita
  ok  dalla partita si torna alla home
Tutte le verifiche del tasto Indietro sono passate.
indietro exit 0
```

## B11 — «Unisci» e gettoni degli attrezzi

**Riproduzione prima della correzione** (test temporaneo con `riscuoti`, `usaAttrezzo`,
`componiSalvataggio`, `serializza`, `leggiSalvataggio`, `applicaSalvataggio` veri;
15 livelli superati; il test non è stato tenuto, il suo percorso ora è il primo test B11):
```
prima export { disponibili: 3, riscossi: 3, versione: 1 }
dopo 3 usi { disponibili: 0, riscossi: 3, versione: 1 }
dopo Unisci { disponibili: 3, riscossi: 3, versione: 1 }
```
Il difetto c'è: i 3 gettoni spesi tornano. Nell'interfaccia non l'ho provato: Non posso
confermarlo da un clic reale, ma il percorso usa le stesse funzioni che chiamano le
schermate (`Salvataggio.jsx` → `applicaSalvataggio`).

**Correzione.** `disponibili` è un saldo, non un traguardo: per il documento `attrezzi`
vince quello che ha **riscosso** di più (ha convertito più livelli); a pari riscossione,
il saldo più basso (quello che ha speso). `riscossi` resta il massimo.

**Prova rosso/verde** (`npx vitest run tests/salvataggio.test.js`):
- interruttore spento:
```
   × gli attrezzi unendo (collaudo 1.21.6, B11) > i gettoni spesi dopo l esportazione non tornano reimportando 41ms
   × gli attrezzi unendo (collaudo 1.21.6, B11) > un file vecchio, che ha riscosso meno, non cambia il saldo di qui 3ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected 3 to be +0 // Object.is equality
AssertionError: expected { versione: 1, disponibili: 3, …(1) } to match object { disponibili: 1, riscossi: 4 }
      Tests  2 failed | 15 passed (17)
```
  Il secondo test («un file da un telefono che ha convertito più livelli porta i suoi
  gettoni») passa anche spento: è il caso che il comportamento vecchio già gestiva, e
  serve a non perderlo.
- interruttore acceso: `Tests  17 passed (17)`

### Opzioni per B11 (scelta mia, reversibile con l'interruttore)
1. **(consigliata, applicata)** vince il documento con `riscossi` più alto; a parità il
   `disponibili` più basso. Né un file vecchio né un reimport regalano gettoni.
2. Unendo si tiene sempre il documento locale degli attrezzi; i livelli importati
   vengono pagati da `riscuoti`. Difetto: i gettoni spesi sull'altro telefono per quei
   livelli verrebbero ripagati qui.
3. Sempre il `disponibili` più basso. Difetto: importando da un telefono più avanti si
   possono perdere gettoni guadagnati là.

## Prove eseguite (in questo ramo, con le due correzioni accese)

| Comando | Esito |
|---|---|
| `npm test` | Tests  616 passed (616) (Test Files  41 passed (41)) |
| `npm run build` | riuscita (`built in 1.47s`) |
| `npm run correzioni` | B1–B8 verdi, **B10 rosso** (vedi sotto) |
| `npm run indietro` | tutte passate |
| `npm run e2e-salvataggio` | «Nessun problema rilevato.» |
| `npx vitest run tests/salvataggio.test.js` | 17 passati |

**B10 rosso, preesistente.** `npm run correzioni` fallisce anche su `main` pulito (le mie
modifiche messe da parte con `git stash`), con lo stesso messaggio:
```
 - B10: con il bersaglio piu grande la home scorre di 2 px a 360x640
```
Non dipende da questo ramo e non l'ho toccato. Se fallisca anche in CI: Non posso
confermarlo (non ho letto la CI di `main`). Va guardato dalla madre prima del rilascio.

## File toccati
- `src/ui/useTastoIndietro.js` — B6 (interruttore, adozione delle voci, primo giro).
- `tests/e2e/correzioni.mjs` — prova B6.
- `src/persistence/salvataggio.js` — B11 (interruttore, `fondiAttrezzi`).
- `tests/salvataggio.test.js` — tre test B11.
- `docs/sviluppo/RAPPORTO-1.21.8.md` — questo rapporto.

## Non verificato
- **Telefono reale e TWA** (B6): quando Android riavvia la TWA da zero la cronologia è
  nuova e `history.state` è vuoto, quindi la correzione non cambia niente; quando la TWA
  ricarica la pagina tenendo la cronologia, dovrebbe comportarsi come in Chromium. Non
  posso confermare nessuno dei due casi senza il telefono.
- **B6, ricarica senza ripresa** (per esempio ripresa scaduta, oltre la finestra di
  `persistence/ripresa.js`): il gioco riparte dalla home con voci vecchie sotto; restano
  Indietro a vuoto come prima della correzione, finché non si scende e risale con i
  pulsanti. È un ragionamento sul codice, non una misura.
- **B11 nell'interfaccia**: provato con le funzioni, non cliccando Esporta/Importa.
- Altri browser (Firefox, Safari): non provati.

## Commit
- `17aacad` Unendo un salvataggio i gettoni spesi non tornano (collaudo 1.21.6, B11)
- `5eb0785` Indietro dopo una ricarica in un livello: mappa, home, fuori (collaudo 1.21.6, B6)
- il commit di questo rapporto (hash nel log del ramo)
