# Uscita della Torre — checklist

Preparata il 9 ottobre 2026, aggiornata il 27 ottobre 2026. **La Torre va online solo dopo
l'esito della revisione Google del pacchetto 11915** (decisione del PO del 26 ottobre,
`docs/DECISIONI.md`): l'app del Play Store carica il sito pubblicato, e il revisore deve
vedere il gioco misurato di `main` (la 11915 e' la 1.21.25). Fino ad allora niente su `main`. Il ramo `opera-torre` ha gia': 100 livelli nuovi (101-200) con i massi, la
grafica «cantiere di notte», l'icona e il logo a gemme, le animazioni (onda, scie,
Intreccio, atterraggio), l'immagine in evidenza nuova.

Chi fa cosa: **[C]** = Claude, nel repository · **[P]** = proprietario, su Play Console o
Android Studio (Claude non ha accesso a nessuno dei due).

## A. Qualche giorno prima

- [x] **[C]** Portare sulla Torre tutto cio' che e' uscito su `main` nel frattempo: fatto il
      26 ottobre, unito `rilascio/1.21.25` (main fino alla 1.21.25: orizzontale PO-035,
      testo grande, `appCategory="game"`, `DISPLAY_MODE` `default`, accessibilita' e
      tastiera PO-023...PO-034) e poi `main` (solo documenti). Conflitti e prove in
      `docs/sviluppo/RAPPORTO-PO-002-TORRE.md`. Il 27 ottobre unito di nuovo `main` con la
      1.21.27 (1.21.26 e 1.21.27: rilascio dove il dito si stacca, pannello dall'alto,
      «Salta per ora» comodo, niente lancio dopo la presa), rapporto § 5. **Se su `main`
      esce altro prima della Torre, va unito di nuovo** e il gate rifatto.
- [ ] **[C]** Portare poi la Torre sull'Arena (`opera-arena`).
- [ ] **[C]** Gate completo sulla Torre: `npm run verifica`, 33 controlli, tutti i 200
      livelli rigiocati nell'app. Supera le 2 ore: si fa a pezzi, come il 9 ottobre.
      Giro del 26 ottobre: 30 su 33. Giro del 27 ottobre, dopo l'unione della 1.21.27:
      **31 su 33, 200 livelli su 200 vinti**; rossi solo `e2e-quadri` (2 px) e `recensione`
      (10 px), i due noti del font del container; `e2e-schermi` verde (D2 chiuso su `main`).
      Va rifatto dopo ogni nuova unione di `main`; il verdetto della CI arriva solo con
      `opera-torre` su `main` (parte B).
- [x] **[C]** Testi della scheda (`android/SCHEDA-PLAY-STORE.md`), italiano e inglese:
      «cento livelli» diventa 200 (il Ponte e la Torre), si spiegano i massi e la regola
      dell'ultimo livello di ogni opera, si toglie o si riscrive la frase degli «otto
      tentativi». Rispettare i limiti: nome 30, breve 80, completa 4000 caratteri.
- [x] **[C]** Note di rilascio («Novita'») in italiano e inglese, entro 500 caratteri.
- [x] **[C]** Rigenerare le otto schermate con la grafica nuova (`npm run schermate`) e
      aggiornare la tabella delle schermate nella scheda (la prima parla di «cento livelli»).
- [ ] **[C]** Facoltativo: video nuovo (`npm run video`), da caricare su YouTube.
- [ ] **[P]** Decidere come provare la Torre su un telefono vero PRIMA dell'uscita.
      L'app del Play Store mostra il sito pubblicato, quindi non basta un APK: serve una
      pagina di prova a parte (da decidere dove), oppure si accetta di provarla il giorno
      stesso.
- [x] **[P]** L'ultimo **versionCode** caricato sara' **11915** (1.21.25, in revisione per la
      produzione): la Torre usera' **11916**. Se prima della Torre si carica un altro
      pacchetto (per esempio quello che rimette l'immersiva), la Torre prende il numero
      dopo: Play rifiuta un versionCode gia' visto.

## B. Il giorno dell'uscita

1. [ ] **[P]** Dare il via.
0. [ ] **[P]** Esito della revisione della 11915 arrivato (approvata). Se e' rifiutata, la
       Torre aspetta: prima si capisce il rifiuto.
2. [ ] **[C]** Versione **1.22.0** (contenuto nuovo): `package.json`, `versionName`,
       `versionCode` **11916** (ultimo caricato + 1); nel CHANGELOG il blocco «Non pubblicato
       — La Torre» diventa «1.22.0» con la data.
3. [ ] **[C]** Rigenerare le schermate (`npm run schermate`), DOPO il cambio di versione: quelle pronte dicono
       v1.20.1 nella home di riserva, e lo strumento si ferma se la versione non torna.
4. [ ] **[C]** `opera-torre` su `main`, push. La pubblicazione del sito e' automatica e
       **arriva subito anche a chi gioca dall'app del Play Store**, perche' l'app mostra il sito.
5. [ ] **[C]** Controllo che il sito pubblicato serva la 1.22.0 e che la CI sia verde; avviso.
6. [ ] **[P]** Android Studio → *Build → Generate Signed App Bundle* → release, con la
       chiave di sempre (`android/COME-PUBBLICARE.md`, passo 1). L'icona di avvio nuova e'
       gia' nei pacchetti dalla 11905 e la cartella `android/app` della Torre e' identica a
       quella della 11915: questo pacchetto cambia solo il numero di versione mostrato in
       «Informazioni app». Il gioco nuovo arriva comunque dal sito (vedi il rapporto, O3).
7. [ ] **[P]** Play Console → Produzione → nuova release → carica l'AAB → incolla le note
       di rilascio → invia in revisione.
8. [ ] **[P]** Play Console → Scheda dello store:
       - icona 512×512: gia' cambiata il 17 ottobre con `public/icone/icona-maskable-512.png`
         (decisione PO-006: `icona-512.png` ha la cornice d'oro che Play taglia); non va
         ricaricata;
       - immagine in evidenza 1024×500: `store/immagine-in-evidenza.png`;
       - le otto schermate da `store/`, nell'ordine della scheda;
       - descrizione breve e completa, italiano e inglese;
       - video, se rifatto.
9. [ ] **[P]** Provare sul proprio telefono, dall'app del Play Store (il sito si aggiorna
       da solo, non serve aspettare l'AAB): home, mappa con le due schede, un livello con
       un masso, un Intreccio; anche col telefono **coricato** (la griglia a sinistra a
       tutta altezza, i pezzi a destra) su un livello della Torre.
       Nella home deve esserci la sesta voce «Recensisci» (l'app avvia il gioco con
       `?origine=play`); toccandola deve aprirsi la scheda di PLINTO nell'app Play Store.
       Se la voce manca, l'avvio non passa il parametro: dirlo a Claude.
       Lo **schermo intero e' stato tolto** per la revisione della 11915 (decisione del PO
       del 22 ottobre): l'app si apre a schermo normale, con l'ora in alto e i pulsanti di
       Android in basso, ed e' giusto cosi'. Torna in un pacchetto successivo, da solo, per
       sapere se era lui la causa dei rifiuti; non insieme alla Torre.

## C. Dopo

- [ ] **[C]** Testi e immagini per i social, come al lancio.
- [ ] **[C]** Controllo di statistiche e recensioni, se lo si vuole di nuovo pianificato.
- [ ] **[C]** Riallineare `opera-arena` a `main`.
- [ ] **[P]** Restano aperti da prima, non bloccanti: prova su iPhone, prova su un
      telefono di fascia bassa (le animazioni nuove pesano di piu'), ascolto con un
      lettore di schermo vero.

## Da sapere

- **Nessuno resta bloccato**: la Torre si apre solo a chi ha finito tutto il Ponte, chi e'
  a meta' continua come prima.
- **Le modifiche alla scheda passano dalla revisione di Google** come la release: possono
  uscire in momenti diversi. Meglio inviarle insieme.
- **assetlinks** non cambia: stessa chiave e stesso sito.
