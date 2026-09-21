/**
 * Testi italiani. Lingua di riferimento del progetto: le altre traducono da qui.
 *
 * ACCENTI E APOSTROFI VANNO SCRITTI. Per parecchie versioni questo file e' stato in
 * ASCII puro, e in italiano non e' una semplificazione tipografica: cambia le parole.
 * "Un gruppo e una riga" significa "un gruppo E una riga"; quello che si voleva dire
 * era "un gruppo E' una riga". Lo stesso valeva per "il gioco e gratuito", "la partita
 * e la stessa per tutti" e per il pulsante "Si", che senza accento e' un pronome.
 * Un gioco scritto in italiano che sbaglia gli accenti sembra tradotto male, e qui
 * l'italiano e' la lingua di riferimento, non una traduzione.
 *
 * I commenti del codice restano in ASCII di proposito: quelli li leggono gli sviluppatori.
 * Questi testi li legge chi gioca. tests/i18n.test.js impedisce di tornare indietro.
 */
export default {
  gioco: {
    claim: 'Riga, colonna, quadrante.',
  },
  home: {
    gioca: 'Gioca',
    riprendi: 'Riprendi la partita',
    partitaLibera: 'Partita libera',
    mappa: 'Mappa dei livelli',
    nuovaPartita: 'Nuova partita',
    record: 'Record',
    maiGiocata: 'Mai giocata',
    daGiocare: 'Da giocare',
    statistiche: 'Statistiche',
    impostazioni: 'Impostazioni',
    info: 'Info',
    sostieni: 'Sostieni il progetto',
    feedback: 'Idee e segnalazioni',
  },
  hud: {
    punteggio: 'Punteggio',
    record: 'Record',
    catena: 'Catena',
    catenaRiposo: 'sale a ogni eliminazione',
    respiroFinito: 'la prossima mossa a vuoto la fa calare',
    menu: 'Menu',
  },
  modo: {
    libera: 'Partita libera',
    sfida: 'Sfida del giorno',
    sfidaOggi: 'Sfida di oggi, {giorno}',
    sfidaDelGiorno: 'Sfida del {giorno}',
    sfidaCosa: 'Oggi la partita parte uguale per tutti. Fai più punti che puoi.',
    sfidaCosaPassata: 'La partita di quel giorno, ricalcolata. Fai più punti che puoi.',
  },
  gioca: {
    annulla: 'Rimetti a posto il pezzo',
    tinta: 'TINTA {quante}',
    trascina: 'Trascina un pezzo sulla griglia',
    tocca: 'Tocca un pezzo, poi tocca dove metterlo',
  },
  /**
   * Le frasi che il gioco dice dopo una mossa riuscita.
   *
   * PIU' D'UNA PER CATEGORIA, E NON PER SFIZIO. La "buona" esce una mossa ogni sei:
   * con una frase sola, in una partita da duecento mosse la si legge trenta volte, e
   * alla terza non e' piu' un complimento ma un tic. Quante piu' varianti dove il
   * messaggio e' frequente, poche dove e' raro.
   *
   * CORTE PERCHE' LO SPAZIO E' QUELLO. Stanno nella riga sotto la plancia, alta 44
   * pixel e larga quanto lo schermo meno i margini: su un telefono stretto ci stanno
   * poco piu' di trenta caratteri. Una frase che va a capo fa saltare la riga, e con
   * lei la plancia.
   */
  incita: {
    buona: [
      'Bene', 'Via una', 'Pulito', 'Giusto', 'Bene così', 'Avanti così',
      'Ci sta', 'Fatta', 'Una in meno', 'Ordine', 'Si respira', 'Un po\' di spazio',
      'Netto', 'Tutto a posto', 'Continua così', 'Va bene', 'Spazio guadagnato',
      'Come si deve', 'Senza sbavature', 'Mossa pulita', 'Quella ci voleva',
      'Un passo avanti', 'Niente da dire', 'Buon posto', 'Piano e bene',
      'Così si tiene', 'Sempre così', 'Ecco', 'Al posto giusto', 'Pulita',
    ],
    ottima: [
      'Bella mossa', 'Così si fa', 'Bel colpo', 'Mossa precisa', 'Ottima',
      'Che pulizia', 'Proprio lì', 'Colpo secco', 'Mossa giusta', 'Molto bene',
      'Bella chiusura', 'Da manuale', 'Ben vista', 'Che occhio', 'Bel taglio',
      'Niente sprechi', 'Mossa da tenere', 'Così si gioca', 'Bella pulita',
      'Gran posto', 'Centrata', 'Bel ragionamento', 'Ottima scelta',
      'Non era facile', 'Bella trovata', 'Tutto liscio',
    ],
    eccellente: [
      'Eccellente!', 'Che mossa!', 'Gran colpo!', 'Notevole!', 'Bellissima!',
      'Che pulizia!', 'Colpo magistrale!', 'Che occhio!', 'Roba da applausi!',
      'Mossa superba!', 'Grandissima!', 'Che classe!', 'Niente male davvero!',
      'Che spettacolo!',
    ],
    perfetta: [
      'Combinazione perfetta!', 'Perfetta!', 'Capolavoro!', 'Da incorniciare!',
      'Incredibile!', 'Che intreccio!', 'Roba da fuoriclasse!', 'Mossa perfetta!',
    ],
    catenaMassima: [
      'Catena al massimo!', 'Catena piena!', 'Catena in cima!', 'Non si sale più!',
      'Catena al limite!', 'Massimo raggiunto!',
    ],
    catena: [
      'Catena {quanti}!', 'Sei a Catena {quanti}!', 'Catena {quanti}, si sale!',
      'Ecco Catena {quanti}!', 'Catena {quanti} agganciata!', 'Su fino a {quanti}!',
    ],
    recupero: [
      'Che recupero!', 'Bel salvataggio!', 'Ci voleva!', 'Che respiro!',
      'Proprio in tempo!', 'Tabellone salvo!', 'Si torna a giocare!',
      'Rimessa in piedi!', 'Che uscita!', 'Riaperta!',
    ],
    svuotata: [
      'Griglia pulita!', 'Tabellone vuoto!', 'Tutto pulito!', 'Non è rimasto niente!',
      'Ripulita tutta!', 'Tabellone azzerato!',
    ],
  },
  fine: {
    titolo: 'Partita finita',
    motivo: 'Nessuno dei pezzi rimasti entra più sulla griglia.',
    punteggio: 'Punteggio',
    nuovoRecord: 'Nuovo record!',
    recordCatena: 'Nuovo record di Catena!',
    recordMossa: 'La tua mossa migliore di sempre!',
    rigioca: 'Gioca ancora',
    home: 'Torna alla home',
    mosse: 'Mosse',
    gruppi: 'Gruppi chiusi',
    catenaMax: 'Catena massima',
    mossaMigliore: 'Mossa migliore',
    durata: 'Durata',
    griglieSvuotate: 'Griglie svuotate',
  },
  stats: {
    titolo: 'Statistiche',
    partite: 'Partite giocate',
    mediaPunteggio: 'Punteggio medio',
    migliore: 'Miglior punteggio',
    mosseTotali: 'Mosse totali',
    gruppiTotali: 'Gruppi chiusi',
    griglieSvuotate: 'Griglie svuotate',
    tempoTotale: 'Tempo di gioco',
    recordCatena: 'Catena record',
    recordMossa: 'Mossa record',
    recordIntreccio: 'Intreccio record',
    vuoto: 'Non hai ancora giocato nessuna partita.',
    vuotoInvito: 'Gioca una partita',
  },
  impostazioni: {
    titolo: 'Impostazioni',
    audio: 'Suoni',
    vibrazione: 'Vibrazione',
    tema: 'Tema',
    temaScuro: 'Scuro',
    temaChiaro: 'Chiaro',
    lingua: 'Lingua',
    azzera: 'Azzera i miei dati',
    // DICEVA MENO DEL VERO. "Cancella record, statistiche e partita in corso" ometteva
    // proprio la cosa che costa di piu': i livelli superati. Chi ne aveva sessantanove
    // leggeva quella frase e poteva concludere che fossero al sicuro.
    // L'elenco dice COSA sparisce e QUANTO ce n'e': "livelli superati 69" si capisce
    // in un colpo, "cancella i tuoi dati" no. Le voci a zero non compaiono: elencare
    // cose che non esistono fa sembrare grave una cancellazione che non toglie niente.
    azzeraElenco: 'Che cosa sparisce',
    voceLivelli: 'Livelli superati',
    vocePartite: 'Partite giocate',
    voceRecord: 'Punteggio record',
    voceSfide: 'Giorni di Sfida',
    azzeraConferma: 'Spariscono anche il profilo di gioco, le impostazioni e la partita in corso.',
    azzeraSicuro: 'Sei sicuro? Non si può annullare.',
    azzeraResta: 'Se hai esportato un salvataggio, quel file resta dov\'è: è l\'unico modo di tornare indietro.',
    azzeraDavvero: 'Sì, azzera tutto',
    azzeraFatto: 'Dati cancellati.',
  },
  info: {
    titolo: 'Info',
    versione: 'Versione',
    privacyTitolo: 'Privacy',
    privacy:
      'PLINTO non raccoglie nulla. Nessun account, nessuna registrazione, nessun tracciamento, '
      + 'nessuna pubblicità. Record e impostazioni restano nel tuo dispositivo e non vengono mai inviati altrove.',
    licenzeTitolo: 'Risorse e licenze',
  },
  sostieni: {
    titolo: 'Sostieni il progetto',
    testo:
      'Questo gioco è gratuito e senza pubblicità. Se ti sta piacendo e vuoi contribuire, '
      + 'puoi lasciare una piccola donazione. Non sblocca niente: il gioco resta identico.',
    bottone: 'Dona con PayPal',
    noGrazie: 'Magari più avanti',
  },
  anteprima: {
    titolo: 'Prossima terna',
    nessuna: 'Prossima terna: non ancora estratta',
    conBomba: 'con bomba',
    spiegazione: 'Nei livelli vedi la terna successiva prima di finire quella che hai in mano. Un livello è un problema con una soluzione: ha un obiettivo dichiarato, un tetto di mosse e una griglia fissa, e su un pezzo che non sai se arriverà non si può ragionare. Nella partita libera invece non c\'è niente da risolvere — si dura finché si dura, e non sapere cosa arriva è parte di cosa la rende libera.',
    tasto: 'Premi P per leggere la prossima terna',
  },
  scheda: {
    condividi: 'Condividi il risultato',
    copiato: 'Copiato negli appunti: incollalo dove vuoi.',
    condiviso: 'Condiviso.',
    copiaAMano: 'Il browser non ha permesso di copiare: seleziona il testo qui sotto.',
    anteprima: 'Il testo che verrà condiviso',
    sfidaDel: 'Sfida del',
    partitaLibera: 'Partita libera',
    punti: 'punti',
    mosse: 'mosse',
    catenaMax: 'Catena max',
    intrecciMax: 'Intreccio max',
    righe: 'Righe',
    colonne: 'Colonne',
    quadranti: 'Quadranti',
    mossaMigliore: 'Mossa migliore',
    separatoreMigliaia: '.',
    // La scheda dei livelli racconta le MOSSE, non i punti: nel percorso due giocatori
    // che superano lo stesso quadro hanno fatto la stessa cosa, e li distingue quello.
    condividiQuadro: 'Racconta come è andata',
    condividiPercorso: 'Condividi il tuo percorso',
    livello: 'Livello {n}',
    superatoIn: 'Superato in {mosse} mosse',
    record: 'record personale',
    percorso: '{opera}: {fatti} livelli su {totale}',
    percorsoUno: '{opera}: 1 livello su {totale}',
    livelliSu: '{fatti} livelli su {totale}',
    livelliSuUno: '1 livello su {totale}',
    condividiTrionfo: 'Racconta che li hai finiti',
    trionfoTitolo: 'Percorso completato',
    tuttiILivelli: 'Tutti i {totale} livelli superati',
    mosseInTutto: '{mosse} mosse in tutto',
    alPrimoColpo: '{quanti} al primo colpo',
  },
  profilo: {
    titolo: 'Il tuo profilo di gioco',
    vuoto: 'Qui comparirà come giochi: quali gruppi chiudi, dove appoggi i pezzi, quanto tieni viva la Catena. Serve almeno una partita finita.',
    qualiPartite: 'Contano la partita libera e la Sfida del Giorno. I livelli no: partono da griglie costruite a mano, e falserebbero la mappa degli appoggi.',
    insieme: 'Nell\'insieme',
    partite: 'Partite',
    mosse: 'Mosse',
    migliorPunteggio: 'Punteggio migliore',
    migliorMossa: 'Mossa migliore',
    svuotamenti: 'Griglie svuotate',
    bombe: 'Bombe esplose',
    celleEsplose: 'Caselle portate via',
    comeChiudi: 'Come chiudi i gruppi',
    comeChiudiSpiega: 'Un quadrante vale 27 punti base, una riga o una colonna 9. Se chiudi quasi solo righe, stai lasciando sul tavolo la parte più redditizia del tabellone.',
    gruppo: 'Gruppo',
    quanti: 'Quanti',
    quota: 'Quota',
    righe: 'Righe',
    colonne: 'Colonne',
    quadranti: 'Quadranti',
    catena: 'Dove passi le tue mosse',
    catenaSpiega: 'A quale moltiplicatore hai giocato, mossa per mossa. È la Catena che avevi PRIMA di muovere, cioè quella che ti è stata applicata davvero.',
    livello: 'Moltiplicatore',
    tue: 'Tu',
    stratega: 'Stratega',
    riferimento: 'Il confronto è con un GIOCATORE ARTIFICIALE, non con una media di persone: {partite} partite simulate, {mosse} mosse, tetto di {tetto} mosse, misurate il {data}. Si rigenera con «npm run catena».',
    senzaRiferimento: 'Il confronto con il giocatore artificiale non viene mostrato: è stato misurato con una versione diversa delle regole, e un paragone sbagliato somiglia troppo a uno giusto.',
    mappa: 'Dove appoggi i pezzi',
    mappaSpiega: 'Quante volte hai ancorato un pezzo in ogni casella. È l\'unica immagine davvero tua del gioco: due giocatori con lo stesso punteggio hanno mappe diverse.',
    mappaDidascalia: 'Mappa degli appoggi, nove righe per nove colonne',
    riga: 'Riga',
    tuoiDati: 'I tuoi dati',
    tuoiDatiSpiega: 'Questi numeri stanno solo qui, sul tuo dispositivo. Puoi portarteli via quando vuoi, senza chiedere il permesso a nessuno. Per cancellarli c\'è «Azzera i miei dati» nelle impostazioni.',
    esporta: 'Copia i miei dati',
    esportato: 'Copiati negli appunti, in formato JSON.',
  },
  archivio: {
    titolo: 'Archivio delle sfide',
    spiegazione:
      'Ogni giorno passato ha la sua sfida, e si può ancora giocare: non sono partite '
      + 'salvate, vengono ricalcolate dalla data. Il futuro no, quello si aspetta.',
    giorni: 'L,M,M,G,V,S,D',
    mesi: 'gennaio,febbraio,marzo,aprile,maggio,giugno,luglio,agosto,settembre,ottobre,novembre,dicembre',
    mesePrecedente: 'Mese precedente',
    meseSuccessivo: 'Mese successivo',
    settimana: 'Settimana',
    settimanaN: 'Settimana {n}',
    didascalia: 'Sfide di {mese}: scegli un giorno da giocare',
    oggi: 'La sfida di oggi',
    tuoPunteggio: 'Il tuo record: {punti}',
    regoleDiverse: 'Ottenuto con una versione precedente del gioco',
    nonAncora: 'Non ancora: è un giorno futuro',
    troppoIndietro: 'Prima di questa data la sfida non esisteva',
    riepilogo: 'Hai giocato {giocati} giorni di {mese}.',
    orologio:
      'Il gioco si fida dell\'orologio del telefono: senza un server non può verificarlo. '
      + 'Non c\'è nessuna classifica da proteggere, quindi spostarlo avanti serve solo a '
      + 'rovinarsi la sorpresa da soli.',
    daQuando: 'La prima sfida è quella del {giorno}: prima non esisteva.',
  },
  // La fine del percorso: l'unico momento in cui il gioco alza la voce.
  trionfo: {
    // Il traguardo ha un nome: non "li hai finiti tutti", ma l'opera che hai costruito.
    titolo: '{opera} è finito.',
    sotto: '{totale} livelli, dal primo all\'ultimo. Il percorso è chiuso.',
    livelli: 'livelli superati',
    mosse: 'mosse spese',
    primoColpo: 'al primo colpo',
    ostinato: 'Il livello {n} ha resistito {tentativi} volte. Alla fine è caduto anche quello.',
    prossimiTitolo: 'E adesso?',
    // Senza date, per scelta. Vedi il commento in testa a ui/schermate/Trionfo.jsx.
    // L'opera successiva si annuncia per nome e come lavoro in corso. Niente date, niente
    // "presto": sono le parole che fanno sembrare imminente una cosa che non ha una data,
    prossimiTesto: 'In lavorazione. Non c\'è ancora una data: quando ci sarà, la trovi qui.',
    libera: 'Gioca in partita libera',
  },

  /**
   * I nomi degli atti e delle opere. Stanno QUI e non nel file dei livelli, che e'
   * generato: li' erano scritti in italiano e non passavano da nessuna traduzione, quindi
   * chi giocava in inglese leggeva "Le basi" dentro un'interfaccia inglese.
   *
   * Il campo semantico e' il cantiere, e viene dal nome del gioco: un plinto e' il blocco
   * su cui poggia una colonna, e Plinto e' un blocco di pietra squadrato. Ogni nome dice
   * anche che cosa chiede quel tratto: la roccia e' il terreno duro, cioe' i livelli che
   * partono con la griglia gia' occupata; il vuoto e' il tratto senza appoggi, cioe' meno
   * spazio e meno mosse; l'arco e' dove non si puo' sbagliare di un dito.
   */
  attrezzi: {
    titolo: 'Attrezzi del cantiere',
    su: 'su',
    carriola: 'La carriola',
    carriolaSpiega: 'Cambia un pezzo della mano. Non costa una mossa.',
    carriolaScegli: 'Quale pezzo cambio?',
    gessetto: 'Il gessetto',
    gessettoSpiega: 'Segna dove conviene appoggiare.',
    piccone: 'Il piccone',
    picconeSpiega: 'Toglie una casella già posata. Non costa una mossa.',
    picconeScegli: 'Quale casella tolgo?',
    mensola: 'La mensola',
    mensolaSpiega: 'Ci appoggi un pezzo e te lo riprendi quando vuoi.',
    mensolaScegli: 'Quale pezzo metto da parte?',
    mensolaRiprendi: 'Riprendi il pezzo dalla mensola',
    mensolaScambia: 'La mano è piena: con quale pezzo lo scambio?',
    lasciaStare: 'Lascia stare',
    quantiHaiUno: 'Hai 1 attrezzo: scegli tu come usarlo. Lo spendi solo se fa davvero qualcosa.',
    quantiHai: 'Hai {n} attrezzi: scegli tu quale usare. Ne spendi uno solo se fa davvero qualcosa.',
    comeSiGuadagnano: 'Non hai attrezzi. Ne guadagni uno ogni {n} livelli superati, e puoi tenerne al massimo tre.',
    guadagnato: 'Hai guadagnato un attrezzo.',
    guadagnatiTanti: 'Hai guadagnato {n} attrezzi.',
    oraNeHai: 'Adesso ne hai {n}.',
    oraNeHaiUno: 'Adesso ne hai uno.',
    perso: 'Magazzino pieno: un attrezzo appena maturato è andato perso. Usane uno per fare posto.',
    persiTanti: 'Magazzino pieno: {n} attrezzi maturati sono andati persi. Se ne tengono al massimo tre: usane uno per fare posto.',
  },

  atti: {
    fondamenta: 'Le fondamenta',
    pilastri: 'I pilastri',
    roccia: 'La roccia',
    vuoto: 'Il vuoto',
    strada: 'La strada',
    arco: 'L\'arco',
    ultimaPietra: 'L\'ultima pietra',
  },

  opere: {
    ponte: 'Il Ponte',
    torre: 'La Torre',
  },

  salvataggio: {
    titolo: 'Salvataggio',
    // Si dice come stanno le cose, non "fai il backup": la ragione per cui questa schermata
    // esiste e' che i progressi stanno in un posto solo, e chi gioca non ha modo di saperlo.
    nota: 'I tuoi progressi stanno soltanto su questo dispositivo. Esportali se non vuoi perderli cambiando telefono o cancellando i dati del browser.',
    portaVia: 'Porta via i progressi',
    rimetti: 'Rimetti un salvataggio',
    scarica: 'Scarica il file',
    copia: 'Copia il testo',
    // Il testo non e' un ripiego del file: finisce in un posto diverso. Il file va nella
    // cartella dei download, dove quasi nessuno entra e dove il prossimo svuotamento lo
    // porta via; il testo lo incolli dove tieni le cose che non vuoi perdere. Detto qui,
    // perche' due pulsanti che sembrano fare la stessa cosa costringono a indovinare.
    copiaSpiega: 'Comodo per incollarlo in una nota o in un messaggio a te stesso.',
    copiato: 'Copiato. Incollalo dove vuoi tenerlo al sicuro.',
    importa: 'Scegli un file da importare',
    incolla: 'Oppure incolla qui un salvataggio',
    leggi: 'Leggi',
    trovato: 'Nel salvataggio ci sono {file} livelli superati. Adesso ne hai {ora}.',
    unisci: 'Unisci ai miei',
    sostituisci: 'Sostituisci tutto',
    sostituisciConferma: 'Sostituendo perdi quello che hai adesso e resta solo quello che c\'è nel salvataggio. Vuoi continuare?',
    fatto: 'Fatto. Adesso hai {livelli} livelli superati.',
    errore: {
      illeggibile: 'Questo file non si riesce a leggere.',
      altroGioco: 'Questo salvataggio non è di PLINTO.',
      formatoIgnoto: 'Questo salvataggio è stato scritto da una versione più recente del gioco.',
      rovinato: 'Il salvataggio è incompleto o è stato modificato: non lo importo, per non rovinare quello che hai già.',
    },
  },

  quadri: {
    avanzamento: '{fatti} di {totale}',
    legendaAttrezzo: 'La cassetta segna il livello che ti fa guadagnare un attrezzo: uno ogni {n} livelli superati.',
    quiAttrezzo: 'Superandolo guadagni un attrezzo',
    superato: 'Superato',
    attoDaAprire: 'Si apre quando arrivi al livello {n}',
    bloccato: 'Supera il livello precedente',
    quadro: 'Livello {n}',
    mosse: 'Mosse',
    tuoRecord: 'Il tuo record: {mosse} mosse',
    riprova: 'Riprova',
    apertoPerInsistenza: 'Il livello successivo si è aperto lo stesso: ci hai provato abbastanza. Questo resta da superare, quando vorrai.',
    prossimo: 'Livello successivo',
    elenco: 'Torna ai livelli',
    vinto: 'Livello superato!',
    perso: 'Livello non superato',
    persoMosse: 'Hai finito le mosse.',
    persoBloccato: 'Nessun pezzo entra più sulla griglia.',
    nuovoRecord: 'Nuovo record: {mosse} mosse',
    // Ultimo livello raggiunto, ma con dei buchi indietro: al centesimo si arriva anche
    // per insistenza, e dire "li hai superati tutti" a chi ne ha lasciati cinque e' la
    // bugia piu' facile da dire e la piu' facile da scoprire.
    finitoConBuchi: 'Sei in fondo al percorso, ma qualche livello è ancora da superare: li trovi in elenco senza la spunta.',
    attoChiuso: '{nome}: completo',
    attoFatti: 'Tutti i livelli dal {da} al {a}, superati.',
    // Una frase per atto, nell'ordine del percorso. Dice che cosa ha chiesto DAVVERO
    // quell'atto, e ogni riga viene da come l'atto e' costruito in tools/genera-quadri.mjs
    // (tipi di obiettivo, motivi della griglia di partenza, mosse concesse, margine di
    // taratura). Non sono complimenti: sono il motivo per cui quei livelli erano diversi
    // dai precedenti, e per cui chiuderli vuol dire qualcosa.
    attoFrasi: [
      'Righe, colonne e quadranti: le mosse che reggono tutto il resto.',
      'I primi livelli che chiedono la Catena, non solo righe e quadranti.',
      'Sedici livelli cominciati con la griglia già occupata.',
      'Meno spazio e meno mosse, e li hai superati lo stesso.',
      'Obiettivi che non si vincono con un colpo solo, ma costruendo.',
      'Qui i bersagli hanno smesso di lasciare margine.',
      'Gli otto livelli più difficili del percorso.',
    ],
    attiChiusi: '{n} atti su {totale} completati.',
    // Le forme al singolare. "1 atti su 7 completati" e' il genere di dettaglio che fa
    // sembrare tradotto male un gioco scritto in italiano, ed e' la stessa regola che
    // gli obiettivi dei Quadri seguono gia' con le loro chiavi "...Uno".
    attiChiusiUno: '1 atto su {totale} completato.',
    restanoIndietro: 'Restano {n} livelli indietro, in elenco senza la spunta.',
    restanoIndietroUno: 'Resta 1 livello indietro, in elenco senza la spunta.',
    ricomincia: 'Ricomincia dal livello 1',
    // La posta in gioco si dice con il NUMERO in evidenza, non annegato in una frase:
    // "69" letto di colpo pesa quanto merita, "i 69 livelli che hai superato" scorre via.
    ricominciaAvviso: 'Ripartirai dal livello 1. Vuoi continuare?',
    ricominciaSicuro: 'Sei sicuro? Questa cosa non si può annullare.',
    ricominciaResta: 'Restano il record della partita libera, le statistiche e la Sfida del giorno: si azzerano solo i livelli.',
    ricominciaConferma: 'Sì, ricomincia',
    consiglio: 'Come fare',
    hai: 'Hai {n} mosse. Se le finisci senza riuscirci, il livello ricomincia da capo.',
    senzaLimite: 'Nessun limite di mosse: giochi finché i pezzi entrano.',
    didascalie: {
      righe: 'Una riga: nove caselle così.',
      colonne: 'Una colonna: nove caselle così.',
      quadranti: 'Un quadrante: uno dei nove riquadri.',
      gruppi: 'Un gruppo: una riga, una colonna o un quadrante.',
      intreccio: 'Una riga e una colonna chiuse con la stessa mossa.',
      intrecci: 'Due gruppi chiusi con la stessa mossa: questo, più volte.',
      pulizia: 'La griglia deve restare così: vuota.',
    },
    spiegazioni: {
      righe: 'Una riga sono nove caselle in fila da sinistra a destra. Riempila tutta e sparisce.',
      colonne: 'Una colonna sono nove caselle una sopra l\'altra, dall\'alto in basso.',
      quadranti: 'Un quadrante è uno dei nove riquadri 3x3 separati dalle linee più chiare. Nove caselle anche lui.',
      gruppi: 'Un gruppo è una riga, una colonna o un quadrante completo: vale qualunque dei tre.',
      celle: 'Contano le caselle che spariscono, non le mosse che fai. Una riga chiusa ne vale nove.',
      punteggio: 'I punti arrivano dalle eliminazioni, non da quanti pezzi appoggi.',
      catena: 'La Catena sale di uno ogni volta che elimini qualcosa, e cala se stai fermo due mosse di fila.',
      intreccio: 'Qui non basta chiudere più gruppi: devi chiuderli con UNA SOLA mossa.',
      intrecci: 'Un Intreccio è chiudere due o più gruppi con UNA SOLA mossa. Qui non ne basta uno: devi rifarlo il numero di volte richiesto.',
      pulizia: 'Devi arrivare a lasciare la griglia completamente vuota.',
      sopravvivi: 'Non c\'è niente da chiudere: devi solo riuscire a piazzare pezzi per tutte le mosse richieste.',
    },
    consigli: {
      righe: 'Scegline una e finiscila, invece di riempirne tre a metà. E non lasciare buchi da una casella sola: poi serve esattamente il pezzo giusto.',
      colonne: 'I pezzi alti e stretti sono i tuoi amici. Tieni libera la colonna che stai costruendo.',
      quadranti: 'Spesso è la strada più corta: un quadrante lo riempi da tre lati invece che da uno solo.',
      gruppi: 'Non sceglierne uno in anticipo: prendi ogni volta quello che si chiude prima.',
      celle: 'Chiudere due gruppi insieme fa salire il conto in fretta: nove caselle diventano diciotto in una mossa.',
      punteggio: 'Tieni viva la Catena: con il moltiplicatore alto le stesse eliminazioni valgono il doppio.',
      catena: 'Meglio eliminare poco ma quasi a ogni mossa, che tanto ogni tre. Guarda l\'avviso sotto la barra.',
      intreccio: 'Porta due gruppi a una casella dal completarsi, poi cerca il pezzo che li tocca entrambi. Gli incroci fra una riga e un quadrante sono il posto giusto.',
      intrecci: 'Non chiudere i gruppi appena sono pronti: lasciane due a una casella dalla fine e aspetta il pezzo che li tocca entrambi. Costa qualche mossa e ne vale la pena.',
      pulizia: 'Verso la fine conta ogni casella: non appoggiare niente che non serva a chiudere qualcosa.',
      sopravvivi: 'Non fare punti a tutti i costi: tieni la griglia sgombra, perché qui perdere significa restare senza spazio.',
    },
    obiettivi: {
      punteggio: 'Fai {n} punti',
      gruppi: 'Chiudi {n} gruppi',
      righe: 'Chiudi {n} righe',
      colonne: 'Chiudi {n} colonne',
      quadranti: 'Chiudi {n} quadranti',
      celle: 'Elimina {n} caselle',
      catena: 'Arriva a Catena {n}',
      intreccio: 'Chiudi {n} gruppi in una mossa',
      intrecci: 'Fai {n} Intrecci',
      intrecciUno: 'Fai un Intreccio',
      gruppiUno: 'Chiudi un gruppo',
      righeUno: 'Chiudi una riga',
      colonneUno: 'Chiudi una colonna',
      quadrantiUno: 'Chiudi un quadrante',
      pulizia: 'Svuota la griglia',
      sopravvivi: 'Resisti {n} mosse',
    },
  },
  sfida: {
    titolo: 'Sfida del giorno',
    breve: 'Sfida del giorno',
    spiegazione: 'Oggi la partita è la stessa per tutti: stessa griglia, stessi pezzi, nello stesso ordine.',
    tuoRecordOggi: 'Il tuo record di oggi',
    tentativi: 'Tentativi',
    nuovoRecordOggi: 'Nuovo record di giornata!',
    storico: 'Ultimi giorni',
    riprendi: 'Riprendi la sfida',
  },
  intro: {
    uno: 'Trascina i pezzi sulla griglia. Non si ruotano: entrano come sono.',
    due: 'Riempi tutta una riga, tutta una colonna o un quadrante 3x3: sparisce e ti fa punti. Riga, colonna e quadrante si chiamano gruppi.',
    tre: 'I pezzi arrivano tre alla volta, e i tre dopo arrivano solo quando li hai usati tutti e tre.',
    quattro: 'La partita finisce quando nessuno dei pezzi che hai in mano entra più da nessuna parte.',
    esempio: 'quadrante chiuso',
    esempioBomba: 'nove caselle via',
  },
  guida: {
    passo: 'Passo {n} di {totale}',
    avanti: 'Avanti',
    indietro: 'Indietro',
    // Due intenzioni diverse: "ho fretta adesso" e "ho deciso". Con un solo pulsante
    // si costringerebbe a scegliere fra rileggerla per sempre e rinunciarci per sempre.
    saltaPerOra: 'Salta per ora',
    nonMostrare: 'Non mostrarmela più',
    catenaTitolo: 'La Catena',
    intreccioTitolo: 'L\'Intreccio',
    tintaTitolo: 'La Tinta',
    percorsoTitolo: 'Il percorso',
    percorso: 'Il gioco vero sono {n} livelli. Ognuno ha il suo obiettivo e un numero di mosse per riuscirci, e prima di cominciare ti spiega che cosa devi fare. Più avanti qualche livello ne chiede due insieme — tre righe e quattrocento punti, per dire — e allora servono tutti e due, con le stesse mosse. Ogni {attrezziOgni} livelli superati guadagni un attrezzo da usare quando ti blocchi: la carriola, il gessetto, il piccone o la mensola.',
    altreModalita: 'Ci sono anche la partita libera, che va avanti finché entra un pezzo e serve solo a fare punti, e la sfida del giorno: la stessa identica partita per tutti, una al giorno.',
  },
  aiuto: {
    titolo: 'Come si gioca',
    intro: 'Le regole stanno tutte qui. Non ce ne sono altre nascoste: quello che leggi è tutto quello che succede.',
    baseTitolo: 'Le regole',
    muovereTitolo: 'Due modi per muovere',
    trascinare: 'Trascina il pezzo dove vuoi metterlo. Mentre lo muovi vedi in anteprima dove finirà, e se non ci sta te lo dice prima che tu lo lasci.',
    dueTocchi: 'Oppure tocca il pezzo una volta per prenderlo, poi tocca la casella dove appoggiarlo. Comodo con una mano sola.',
    tastiera: 'Si gioca anche da tastiera: Tab per scegliere il pezzo, Invio per prenderlo, le frecce per muoverti sulla griglia, Invio per appoggiarlo, Esc per annullare. Ogni mossa viene descritta a voce ai lettori di schermo.',
    rimetti: 'Se lasci il pezzo dove non volevi, sotto la griglia compare "Rimetti a posto il pezzo": la partita torna esattamente com\'era. Funziona solo se quella mossa non ha eliminato niente e non ha chiuso la partita, e serve a correggere il dito, non a ripensarci.',
    punteggioTitolo: 'Intreccio, Catena e Tinta',
    intreccio: 'Un Intreccio è chiudere due o più gruppi con una sola mossa, e moltiplica i punti di quella mossa: tre gruppi insieme valgono ×{n}. Il modo più semplice è il punto in cui una riga e una colonna si incrociano: un pezzo solo può chiuderle tutte e due.',
    catena: 'Ogni volta che elimini qualcosa la Catena sale di un gradino, e ogni gradino alza il moltiplicatore che vedi sulla barra: si parte da ×{base} e si arriva a ×{max}. Quel moltiplicatore vale su tutti i punti della mossa. Se passi {n} mosse di fila senza eliminare niente la Catena scende, e la barra te lo dice prima che succeda.',
    tinta: 'Un gruppo è fatto di nove caselle. Quando almeno {soglia} di quelle nove hanno lo stesso colore, il gruppo vale di più; con tutte e nove uguali arriva a +{massimo}%. I colori dei pezzi non li scegli, ma scegli dove appoggiarli: la maggioranza si costruisce così.',
    bombeTitolo: 'Le bombe',
    bombe: 'La bomba è una casella segnata dentro un pezzo, e capita ogni tanto. Appoggiata sulla griglia non fa niente: esplode quando viene eliminata insieme al suo gruppo, e allora porta via anche le otto caselle intorno.',
    bombeCatena: 'Due bombe che si toccano si innescano a vicenda: tre in fila portano via quindici caselle. Se fra l\'una e l\'altra c\'è una casella libera, non succede. Le caselle fatte saltare fanno punti e seguono la Catena.',
    bombeGrandi: 'Ogni casella fatta saltare vale {punti} punti. E le esplosioni grandi rendono di più: oltre le {soglia} caselle, ogni casella in più fa valere un {premio}% in più tutta l\'esplosione, non solo quella casella. Per questo a volte conviene aspettare il momento buono invece di usare la bomba appena arriva.',
    attrezzi: 'Gli attrezzi sono aiuti che si guadagnano giocando: ne arriva uno ogni {ogni} livelli superati e puoi tenerne al massimo {massimo}. Non sono quattro scorte separate: il numero è uno solo, e sei tu a decidere in quale attrezzo spenderlo. Aprire il pannello per guardarli è gratis: un attrezzo si consuma solo quando fa davvero qualcosa.',
    attrezziSfida: 'Nella sfida del giorno non ci sono, ed è voluto: è la stessa partita per tutti, e due punteggi ottenuti con un numero diverso di attrezzi non sarebbero più confrontabili.',
    equitaTitolo: 'Nessuna difficoltà nascosta',
    equita: 'I pezzi che ricevi non dipendono da come stai andando: il gioco non ti manda pezzi scomodi perché stai vincendo, né pezzi comodi perché stai perdendo. Il moltiplicatore che leggi sulla barra è esattamente quello che ti verrà applicato, senza calcoli nascosti fra quello che leggi e quello che incassi. Le uniche regole che non vedi servono ad aiutarti: a inizio partita il gioco evita di darti tre pezzi che non entrano da nessuna parte, e con la griglia molto piena ti garantisce almeno un pezzo piccolo. Non ci sono vite, non c\'è tempo, non c\'è niente da comprare.',
  },
  a11y: {
    riga: 'riga', righe: 'righe',
    colonna: 'colonna', colonne: 'colonne',
    quadrante: 'quadrante', quadranti: 'quadranti',
    eliminate: 'eliminate',
    piu: 'più',
    punti: 'punti',
    grigliaVuota: 'Griglia completamente svuotata',
    cella: 'Casella riga {r} colonna {c}',
    cellaLibera: 'libera',
    cellaOccupata: 'occupata',
    istruzioni: 'Usa Tab per scegliere un pezzo, Invio per prenderlo, le frecce per muoverti sulla griglia e Invio per appoggiarlo. Esc annulla.',
  },
  varie: {
    licenzeTesto: 'Grafica, suoni e testi sono realizzati per questo progetto. Nessun font esterno, nessuna risorsa caricata da domini di terze parti.',
    donazioneNonAttiva: 'Il link di donazione non è ancora stato configurato.',
    pezzo: 'Pezzo {n}, {celle} caselle',
    pezzoMorto: 'non entra più sulla griglia',
  },
  errore: {
    titolo: 'Qualcosa si è rotto',
    testo: 'Il gioco si è fermato per un errore. Non è colpa tua e non hai perso niente.',
    ricarica: 'Ricarica il gioco',
    dati: 'Record, statistiche e livelli superati sono al sicuro: restano sul tuo dispositivo.',
  },
  installa: {
    azione: 'Installa sul telefono',
    apple: 'Tocca il pulsante Condividi in basso, poi «Aggiungi alla schermata Home». Il gioco si apre come un\'app, a schermo intero e anche senza connessione.',
  },
  comune: {
    /* «Chiudi» non diceva CHE COSA chiude: il menu o il gioco? Segnalato da un tester.
       In un menu sospeso sopra la partita l'ambiguita' pesa, perche' la voce sotto
       («Torna ai livelli») una destinazione la dichiara, e il contrasto rende la prima
       ancora piu' muta. Adesso dice dove porta. */
    tornaAllaPartita: 'Torna alla partita',
    indietro: 'Indietro',
    si: 'Sì',
    no: 'No',
    // Usata da TUTTE le conferme in due passi: una sola stringa, cosi' non possono
    // divergere fra una schermata e l'altra.
    passoConferma: 'Conferma {n} di 2',
  },
};
