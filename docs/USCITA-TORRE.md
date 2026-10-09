# Uscita della Torre — checklist

Preparata il 9 ottobre 2026. Uscita prevista: fra circa un mese, **solo dopo il via del
proprietario**. Il ramo `opera-torre` ha gia': 100 livelli nuovi (101-200) con i massi, la
grafica «cantiere di notte», l'icona e il logo a gemme, le animazioni (onda, scie,
Intreccio, atterraggio), l'immagine in evidenza nuova.

Chi fa cosa: **[C]** = Claude, nel repository · **[P]** = proprietario, su Play Console o
Android Studio (Claude non ha accesso a nessuno dei due).

## A. Qualche giorno prima

- [ ] **[C]** Portare sulla Torre tutto cio' che e' uscito su `main` nel frattempo, e poi
      la Torre sull'Arena.
- [ ] **[C]** Gate completo sulla Torre: `npm run verifica`, 28 controlli, tutti i 200
      livelli rigiocati nell'app. Supera le 2 ore: si fa a pezzi, come il 9 ottobre.
- [ ] **[C]** Testi della scheda (`android/SCHEDA-PLAY-STORE.md`), italiano e inglese:
      «cento livelli» diventa 200 (il Ponte e la Torre), si spiegano i massi e la regola
      dell'ultimo livello di ogni opera, si toglie o si riscrive la frase degli «otto
      tentativi». Rispettare i limiti: nome 30, breve 80, completa 4000 caratteri.
- [ ] **[C]** Note di rilascio («Novita'») in italiano e inglese, entro 500 caratteri.
- [ ] **[C]** Rigenerare le otto schermate con la grafica nuova (`npm run schermate`) e
      aggiornare la tabella delle schermate nella scheda (la prima parla di «cento livelli»).
- [ ] **[C]** Facoltativo: video nuovo (`npm run video`), da caricare su YouTube.
- [ ] **[P]** Decidere come provare la Torre su un telefono vero PRIMA dell'uscita.
      L'app del Play Store mostra il sito pubblicato, quindi non basta un APK: serve una
      pagina di prova a parte (da decidere dove), oppure si accetta di provarla il giorno
      stesso.
- [ ] **[P]** Dire a Claude l'ultimo **versionCode** caricato su Play Console: il
      repository e' a 11904, ma non e' verificato quale numero sia gia' stato usato.

## B. Il giorno dell'uscita

1. [ ] **[P]** Dare il via.
2. [ ] **[C]** Versione **1.21.0** (contenuto nuovo): `package.json`, `versionName`,
       `versionCode` = ultimo caricato + 1; nel CHANGELOG il blocco «Non pubblicato — La
       Torre» diventa «1.21.0» con la data.
3. [ ] **[C]** `opera-torre` su `main`, push. La pubblicazione del sito e' automatica e
       **arriva subito anche a chi gioca dall'app del Play Store**, perche' l'app mostra il sito.
4. [ ] **[C]** Controllo che il sito pubblicato serva la 1.21.0 e che la CI sia verde; avviso.
5. [ ] **[P]** Android Studio → *Build → Generate Signed App Bundle* → release, con la
       chiave di sempre (`android/COME-PUBBLICARE.md`, passo 1). Serve per la nuova icona
       sui telefoni e per il numero di versione in «Informazioni app».
6. [ ] **[P]** Play Console → Produzione → nuova release → carica l'AAB → incolla le note
       di rilascio → invia in revisione.
7. [ ] **[P]** Play Console → Scheda dello store:
       - icona 512×512: `public/icone/icona-512.png`;
       - immagine in evidenza 1024×500: `store/immagine-in-evidenza.png`;
       - le otto schermate da `store/`, nell'ordine della scheda;
       - descrizione breve e completa, italiano e inglese;
       - video, se rifatto.
8. [ ] **[P]** Provare sul proprio telefono: home, mappa con le due schede, un livello
       con un masso, un Intreccio.

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
