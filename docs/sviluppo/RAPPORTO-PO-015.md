# Rapporto PO-015 — Fine del livello col gettone («Mappa ridotta»)

Ramo `fine-gettone`, partito da `main` a `8528ac4`. Versione **non** cambiata (1.21.15),
niente su `main`, `android/` non toccato. Nessun testo per il giocatore cambiato: si toglie
solo un blocco (le tappe e il nome dell'atto) nella fine col gettone, quindi
`tests/lessico.test.js` e le due lingue non sono coinvolti.

Tutte le misure: build di produzione (`npm run build`, `npx vite preview --port 4173`),
Chromium 1194 in `/opt/pw-browsers`, font **Inter** nel container. Sonda:
`docs/sviluppo/po015/sonda-fine.mjs` (copia di quella del collaudo 1.21.15 con in più lo
spazio libero); misure grezze in `docs/sviluppo/po015/misure-*.jsonl`.

## Che cosa è cambiato

| voce | dove | cosa |
|---|---|---|
| E1 | `src/ui/schermate/FineQuadro.jsx` (interruttore `MAPPA_RIDOTTA_COL_GETTONE`), `src/ui/AvanzamentoMappa.jsx` (prop `ridotto`) | col gettone guadagnato e l'atto **non** chiuso l'avanzamento è solo «N di 100» con la barra (che si allunga ancora): niente tappe con Plinto, niente nome dell'atto. Tutte le altre fini sono come prima |
| O1 | `FineQuadro.jsx` (interruttore `VITTORIA_SOLA_COMPATTA_SU_SCHERMO_LARGO`) | la classe `pl-fine--compatta-larga` si applica solo dopo una vittoria: la sconfitta torna come nella 1.21.14 |
| prova E1 | `tests/e2e/trionfo.mjs`, passo «3 bis» | superati 2..`OGNI_LIVELLI`, si vince l'1: riquadro del gettone presente, nessuna fascia d'atto, **0 tappe**, barra a 5, e nessuno scorrimento a 390x844, 360x800, 360x740, 320x700, 1920x1080, 1366x768 |
| prova E1 + O1 | `tests/e2e/schermi.mjs`, colonne `fine-gettone` e `fine-sconfitta` | solo sui formati larghi e bassi (stessa formula delle media query della fine compatta: 1024x768 mouse e tocco, 1366x768, 1280x720, 1366x657): la fine col solo gettone non scorre; nella sconfitta Plinto è almeno 88 px (nominale 92) |
| E2 | `docs/TESTING.md`, «Due rossi noti nei container delle sessioni figlie» | la nota richiesta |

Il caso «solo gettone» è in `e2e-trionfo` e non in `e2e-quadri` perché `trionfo.mjs` ha già
`preparaEGioca()` che scrive i progressi in memoria e gioca il livello 1: in `quadri.mjs`
il percorso parte da zero e serve proprio così.

## Misure prima / dopo

`scrollHeight − clientHeight` di `.pl-fine .pl-scroll`, px (0 = sta tutta nello schermo).
«Prima» = build di `main` a `8528ac4`; «dopo» = build di `fine-gettone`.

| formato | solo gettone prima | **solo gettone dopo** | spazio libero dopo | sconfitta prima (Plinto) | **sconfitta dopo (Plinto)** |
|---|---|---|---|---|---|
| 1366x657 | 66 | **0** | 43 | 0 (57 px) | **0 (93 px)** |
| 1280x720 | 61 | **0** | 48 | 0 (57 px) | **0 (93 px)** |
| 1366x768 | 16 | **0** | 93 | 0 (56 px) | **0 (93 px)** |
| 1024x768 | 16 | **0** | 93 | 0 (56 px) | **0 (92 px)** |
| 1920x969 | 0 | 0 | — | 0 (92 px) | 0 (92 px) |
| 360x640 | 83 | **0** | 26 | 0 (92 px) | 0 (92 px) |
| 320x700 | 23 | **0** | 86 | 0 (93 px) | 0 (93 px) |
| 360x800 | 0 | 0 | 186 | 0 | 0 |
| 390x844 | 0 | 0 | 230 | 0 | 0 |
| 412x915 | 0 | 0 | — | 0 | 0 |

«Spazio libero» = altezza della colonna meno ciò che la occupa: quanti px servirebbero in
più (per esempio da un font più largo) prima che la fine col gettone torni a scorrere.

Le altre fini, invariate prima/dopo (stessi numeri in `misure-prima.jsonl` e
`misure-dopo.jsonl`): **normale** 0 ovunque tranne 360x640 (61) e 320x700 (2, il rosso noto
E2); **atto + gettone** 44 a 1366x657, 39 a 1280x720, 61 a 360x640, 0 altrove;
**sconfitta + strada** 0 ovunque, Plinto 92-93 px dopo (56-57 prima sui formati larghi
bassi). In tutte le 50 misure dopo: nessuna sovrapposizione col blocco dei pulsanti, nessun
pulsante fuori dalla cornice, zero errori in console.

La mappa ridotta da sola basta su tutti i formati del requisito: non servono altri cambi.

## Interruttori: prova rosso / verde

| prova | build di `main` | `fine-gettone`, tutto acceso | `MAPPA_RIDOTTA_COL_GETTONE = false` | `VITTORIA_SOLA_COMPATTA_SU_SCHERMO_LARGO = false` |
|---|---|---|---|---|
| `e2e-trionfo` | **rosso**, 3 problemi: 4 tappe; 320x700 23 px; 1366x768 16 px | **verde** («Tutto a posto») | **rosso**, gli stessi 3 | — |
| `e2e-schermi` (5 formati larghi bassi) | **rosso**, 10 difetti: `fine-gettone` 16/16/16/61/66 px, `fine-sconfitta` Plinto 57 px ×5 | **verde** | **rosso**, 5 difetti `fine-gettone` (16/16/16/61/66) | **rosso**, 5 difetti `fine-sconfitta` (Plinto 57 px) |
| `e2e-schermi` completo, 13 formati | — | **verde**, «Tutto a posto su 13 formati» | — | — |

Un primo giro del controllo della sconfitta in `e2e-schermi` era sbagliato: cercava
«superato» e lo trovava dentro «Livello **non** superato», quindi segnalava ogni sconfitta
come vittoria. Corretto prima del commit (ora cerca «non superato»), e il rosso sopra è
quello del controllo corretto.

## Altre prove nel container

- `npm test`: 45 file, 651 test, tutti verdi.
- `e2e-quadri` sulla build nuova: rosso **solo** per la fine normale a 320x700, **2 px**: è
  il rosso noto E2, identico su `main` (colonna «prima», fine normale 320x700 = 2 px).
- `recensione` sulla build nuova: rosso **solo** a 360x640, invito **10 px** sotto la barra:
  il rosso noto E2. Questa prova non passa dalla fine col solo gettone.
- Gate: vedi in fondo.

## Non posso confermarlo

- **Font**: tutto misurato con Inter. Con Roboto (Android) o Segoe UI (Windows) i numeri
  cambiano; lo spazio libero dopo (minimo 43 px sui formati del requisito, 26 a 360x640)
  fa pensare che resti margine, ma **Non posso confermarlo** senza misurare con quei font.
- **Dispositivi veri**: solo Chromium emulato; Safari/WebKit, Firefox e l'app da Google
  Play non provati.
- **CI**: l'esito di `verifica` sul runner per questo ramo non l'ho letto (la CI gira su
  `main`, e questo ramo non va su `main` da me).
- **Causa dei rossi E2** (font): coerente, non dimostrata (come nel collaudo).

## Proposte (scelte aperte, non fatte)

1. **Il nome dell'atto nella fine col gettone.** Ho letto «solo la barra "N di 100"» alla
   lettera e ho tolto anche il nome dell'atto (riga da 25 px, misurata). Lo spazio libero
   dopo è di almeno 26 px su ogni formato misurato, quindi starebbe anche con il nome.
   - A) **(consigliata)** lasciare così: è quello che dice la decisione, e tiene 25 px di
     margine in più contro i font più larghi.
   - B) rimettere il nome dell'atto sopra la barra: 0 px di scorrimento ancora su tutti i
     formati del requisito (spazio libero minimo 43 − 25 = 18 px stimati; a 360x640
     26 − 25 = 1 px, **Non posso confermarlo** senza misurarlo).
2. **Atto + gettone su PC bassi** (44 px a 1366x657, 39 a 1280x720: «Condividi» sotto il
   bordo). Fuori da questa voce, ma è la stessa famiglia: 3 volte nel percorso.
   - A) **(consigliata)** voce a parte nel backlog, da misurare con la sonda;
   - B) lasciare così e scrivere nel requisito che il caso atto + gettone su finestre sotto
     i 720 px può scorrere;
   - C) estendere qui la regola ai 1366x657 / 1280x720 senza decisione: sconsigliata
     (cambio visibile non deciso).
3. **CHANGELOG**: nessuna voce scritta, perché la versione non cambia. Alla pubblicazione
   va aggiunta (cosa: mappa ridotta col gettone e sconfitta non compatta; perché: E1 e O1
   del collaudo 1.21.15; misure: la tabella qui sopra).

## Gate

`npm run build`: verde. `npm run verifica -- --veloce`: **corsia veloce NEGATA** («non
risulta nessun giro completo passato su questa macchina»), quindi giro completo, 33
controlli in 5057 s. Ultima riga del riassunto:

> 2 controlli su 33 sono falliti. NON pubblicare.

I due rossi sono esattamente quelli noti (E2), con gli stessi numeri:

- «livelli nel browser (vittoria e sconfitta)» (`e2e-quadri`): «FINE LIVELLO (vittoria): a
  320x700 bisogna scorrere di 2 px»;
- «Play Store: invito a recensire» (`recensione`): «a 360x640 l invito finisce 10px sotto
  la barra dei pulsanti».

Gli altri 31 sono verdi, compresi «fine del percorso: festa finale e atti chiusi»
(`e2e-trionfo`, col caso nuovo), «tablet e PC: ogni schermata nella cornice»
(`e2e-schermi`, con le colonne nuove) e «tutti e cento i livelli, giocati nell app».

**Controllato su `main`** nello stesso container (build di `origin/main` a `8528ac4`,
`vite preview`): `e2e-quadri` rosso con lo stesso unico problema (320x700, 2 px) e
`recensione` rosso con lo stesso unico problema (360x640, 10 px). Quindi non vengono da
questo ramo. Il verdetto che conta resta quello della CI, che su questo ramo **Non posso
confermarlo**.
