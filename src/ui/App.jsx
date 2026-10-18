import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePartita } from '../state/usePartita.js';
import { useImpostazioni } from '../state/useImpostazioni.js';
import { traduttore } from '../i18n/index.js';
import { impostaLingua, dataDistesa } from '../i18n/formato.js';
import { impostaAudio, suonoBottone, sbloccaAudio } from '../audio/suoni.js';
import { impostaVibrazione } from '../feel/vibrazione.js';
import { clearAll, RECORD_SEPARATI } from '../persistence/storage.js';
import { deadPieces } from '../core/engine.js';
import { loadStats, loadRecords } from '../persistence/records.js';
import { sfidaDelGiorno, storicoSfide } from '../persistence/sfide.js';
import { SchermoGioco } from './SchermoGioco.jsx';
import { SchermoHome } from './schermate/Home.jsx';
import { SchermoFine } from './schermate/Fine.jsx';
import { SchermoStatistiche } from './schermate/Statistiche.jsx';
import { SchermoImpostazioni } from './schermate/Impostazioni.jsx';
import { SchermoInfo } from './schermate/Info.jsx';
import { SchermoSostieni } from './schermate/Sostieni.jsx';
import { PrimoAvvio } from './schermate/PrimoAvvio.jsx';
import { SchermoQuadri } from './schermate/Quadri.jsx';
import { SchermoArchivio } from './schermate/Archivio.jsx';
import { SchermoProfilo } from './schermate/Profilo.jsx';
import { SchermoComeSiGioca } from './schermate/ComeSiGioca.jsx';
import { SchermoFineQuadro } from './schermate/FineQuadro.jsx';
import { SchermoTrionfo } from './schermate/Trionfo.jsx';
import { AperturaQuadro } from './schermate/AperturaQuadro.jsx';
import { ConfermaPerdita } from './ConfermaDoppia.jsx';
import { useQuadro } from '../state/useQuadro.js';
import { QUADRI, TOTALE_QUADRI, quadroNumero, attoDelQuadro } from '../config/quadri.js';
import {
  quantiSuperati, prossimoQuadro, quadroDopo, riepilogoPercorso, riepilogoAtto,
} from '../persistence/progressi.js';
import { leggiRipresa } from '../persistence/ripresa.js';
import { giornoDiOggi, sfidaGiocabile } from '../core/sfida.js';
import { usaRotta, rottaSfida, scriviRotta } from './rotta.js';
import { useTastoIndietro, GENITORE, PROFONDITA } from './useTastoIndietro.js';

/**
 * PO-008, interruttori per la prova rosso/verde in `tests/e2e/ripresa-livello.mjs`.
 *
 * RIPRENDI_LIVELLO_A_MANO: un livello lasciato a meta' si riprende riaprendolo, dalla
 * mappa o dal pulsante grande della home, che allora dice «Riprendi il livello N». Sulla
 * 1.21.7 la ripresa era solo automatica: oltre le due ore, o dopo essere tornati alla
 * mappa, riaprire il livello lo ricominciava da capo (misurato, casi A e B).
 *
 * RIPRESA_SENZA_GUIDA: la ripresa automatica non aspetta `introVista`. Chi sceglie
 * «Salta per ora» rivede la guida a ogni avvio, ed era proprio la guida a fermare la
 * ripresa: dopo un secondo piano si ritrovava la guida e il livello ricominciava (caso G).
 * Un posto da riprendere esiste solo se si e' gia' giocato, quindi la guida non serve.
 */
export const RIPRENDI_LIVELLO_A_MANO = true;
export const RIPRESA_SENZA_GUIDA = true;
/*
 * PO-008, seconda parte: le tre strade con cui il collaudo 1.21.9 perdeva una partita a
 * meta' con un tocco solo. Decisione del PO (docs/DECISIONI.md): «Chiedo conferma».
 * Interruttori per la prova rosso/verde, casi J, K, L di `tests/e2e/ripresa-livello.mjs`.
 *
 * CONFERMA_ALTRO_LIVELLO (E1): con il livello 3 a meta', «Gioca» sull'obiettivo di un
 * altro livello sovrascriveva il salvataggio, che e' uno solo. Si chiede prima di «Gioca»
 * e non all'apertura: leggere l'obiettivo non costa niente (NON_COPRE_UN_ALTRO_LIVELLO).
 *
 * CONFERMA_RIPROVA (E2): «Riprova» nel menu del livello ricominciava senza chiedere,
 * a un centimetro da «Torna alla partita». Dopo un livello finito non si chiede: li'
 * riprovare e' l'unica cosa che si puo' voler fare.
 *
 * CONFERMA_ALTRA_SFIDA: aprire dall'archivio (o da un collegamento) la sfida di un altro
 * giorno copriva in silenzio quella a meta', perche' anche la sfida ha un salvataggio solo.
 */
export const CONFERMA_ALTRO_LIVELLO = true;
export const CONFERMA_RIPROVA = true;
export const CONFERMA_ALTRA_SFIDA = true;
/*
 * CONFERMA_NUOVA_LIBERA (collaudo 1.21.11, H1; decisione del PO «Conferma come gli
 * altri»): «Nuova partita libera» in home, a 14 px dalla card, cancellava in silenzio la
 * libera in corso, che ha un salvataggio solo. Vale per ogni strada che ne comincia una
 * (home, menu della partita, fine partita, trionfo, profilo, statistiche): la domanda sta
 * in `iniziaNuova` e non nei pulsanti. Libera finita o a zero mosse: niente domanda.
 * Caso N di `tests/e2e/ripresa-livello.mjs`.
 */
export const CONFERMA_NUOVA_LIBERA = true;
// Dopo la domanda aperta dall'archivio la cronologia torna indietro di un gradino e
// l'indirizzo perdeva `#/sfida/<giorno>` (misurato sulla build di produzione: ancora
// vuota con la domanda, `#/sfida/2026-10-15` senza). Rimesso a ogni `popstate` nostro.
const ANCORA_SFIDA_DOPO_INDIETRO = true;
/*
 * ANCORA_VIA_DALLA_LIBERA (collaudo 1.21.12, I1): dentro una sfida, menu -> «Nuova
 * partita» (o «Riprendi la partita» nella domanda) portava alla libera lasciando
 * l'indirizzo `#/sfida/<giorno>`. Al ricaricamento, che nella TWA arriva da solo dopo un
 * secondo piano, l'ancora vinceva sulla ripresa e si ritrovava la sfida al posto della
 * libera che si stava giocando (misurato: libera a 3 punti, dopo la ricarica 9, quelli
 * della sfida). Acceso, entrare in una libera ripulisce l'ancora, anche dopo un Indietro
 * che torna su una voce di cronologia scritta quando si era nella sfida.
 * Spento, torna il difetto: caso O di `tests/e2e/ripresa-livello.mjs` rosso.
 */
export const ANCORA_VIA_DALLA_LIBERA = true;

/**
 * Radice dell'applicazione.
 *
 * Niente router: le schermate sono poche e la navigazione e' un valore di stato.
 * Meno dipendenze, avvio piu' rapido, e nessun URL da gestire in un gioco che si apre e
 * si chiude in pochi secondi.
 *
 * L'unica eccezione e' l'ancora `#/sfida/AAAA-MM-GG` (vedi ui/rotta.js), che serve a una
 * cosa sola: aprire la sfida di un giorno preciso arrivando da un collegamento. Non e'
 * una navigazione, e' un punto d'ingresso.
 */
/** Pezzi che non entrano piu': serve anche ai Quadri, che non passano da usePartita. */
function deadPiecesDi(partita) {
  return partita ? deadPieces(partita) : [];
}

export function App() {
  const [schermata, setSchermata] = useState('home');
  const [menuAperto, setMenuAperto] = useState(false);
  // "Sostieni" si apre da due posti, e il ritorno deve riportare a quello giusto: da
  // Info si torna a Info, dalla home alla home. Senza, il tasto Indietro dalla home
  // porterebbe dentro una schermata che il giocatore non ha mai aperto.
  const [sostieniDa, setSostieniDa] = useState('info');
  /**
   * La guida saltata "per ora": vale per questa sessione e basta.
   *
   * NON si salva. E' esattamente la differenza fra i due pulsanti: "non mostrarmela
   * piu'" scrive `introVista` e vale per sempre, "salta per ora" no e la guida torna al
   * prossimo avvio. Salvare anche questo li renderebbe lo stesso pulsante scritto in
   * due modi.
   */
  const [guidaSaltata, setGuidaSaltata] = useState(false);
  const [statistiche, setStatistiche] = useState(() => loadStats());

  const { impostazioni, cambia, inverti, ricarica: ricaricaImpostazioni } = useImpostazioni();

  // Le preferenze audio e vibrazione vivono in moduli senza React: qui le si tiene
  // allineate, cosi' i componenti non devono passarsele di mano in mano.
  useEffect(() => { impostaLingua(impostazioni.lingua); }, [impostazioni.lingua]);
  useEffect(() => { impostaAudio(impostazioni.audio); }, [impostazioni.audio]);
  useEffect(() => { impostaVibrazione(impostazioni.vibrazione); }, [impostazioni.vibrazione]);
  const t = useMemo(() => traduttore(impostazioni.lingua), [impostazioni.lingua]);

  const {
    partita, modalita, esitoSfida, record, recordLibera, nuoviRecord, pezziMorti, riepilogo,
    nuovaPartita, nuovaSfida, riprendi, abbandona, gioca, cePartitaSalvata,
    siPuoAnnullare, annulla, sfidaInCorsoDi, sfidaAMeta, liberaAMeta, ricaricaRecord,
  } = usePartita();

  const [salvataggioDisponibile, setSalvataggioDisponibile] = useState(() => cePartitaSalvata());
  // Solo la sfida di OGGI lasciata a meta' fa dire «Riprendi la sfida» alla home: quella
  // di un altro giorno non si riprende da li' (collaudo 1.21.6, B4).
  const [sfidaSalvata, setSfidaSalvata] = useState(() => sfidaInCorsoDi(giornoDiOggi()));
  const [sfidaOggi, setSfidaOggi] = useState(() => sfidaDelGiorno());
  const [quadriFatti, setQuadriFatti] = useState(() => quantiSuperati());
  // Il livello a cui il giocatore e' arrivato. Dipende dai progressi salvati, non dal
  // conteggio: un livello puo' essere stato superato fuori ordine tornando indietro.
  const livelloCorrente = useMemo(
    () => prossimoQuadro(TOTALE_QUADRI),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [quadriFatti],
  );

  const quadri = useQuadro();
  /**
   * La domanda prima di perdere una partita a meta' (PO-008): `{ titolo, testo,
   * etichettaTorna, etichettaContinua, onTorna, onContinua }`, oppure null. Una sola per
   * tutta l'app, cosi' il tasto Indietro sa che c'e' e la chiude per prima, come il menu.
   */
  const [conferma, setConferma] = useState(null);
  const chiudiConferma = useCallback(() => setConferma(null), []);

  /**
   * Un collegamento del tipo `#/sfida/2026-09-12` apre quella sfida all'avvio.
   *
   * Aspetta che la presentazione iniziale sia stata vista: buttare un giocatore al
   * primo avvio dentro una partita senza avergli detto le regole e' il modo piu' rapido
   * di fargli chiudere il gioco. Il collegamento non si perde, viene solo servito dopo.
   *
   * Un giorno non giocabile (il futuro, o una data inventata scritta a mano
   * nell'indirizzo) non fa niente e lascia la home: meglio una schermata normale che un
   * messaggio d'errore per una cosa che il giocatore non ha sbagliato.
   */
  const rotta = usaRotta();

  // Niente argomenti di proposito: e' passata come `onClick`, e l'evento del tocco non
  // deve poter valere come «confermato».
  const iniziaNuova = useCallback(() => {
    sbloccaAudio();
    suonoBottone();
    if (CONFERMA_NUOVA_LIBERA && liberaAMeta()) {
      // Dal menu della libera stessa la partita e' gia' a schermo: «Riprendi» chiude e
      // basta, cosi' non si perde nemmeno la mossa da annullare.
      const giaDentro = schermata === 'gioco' && modalita === 'libera' && partita?.status === 'playing';
      setConferma({
        titolo: t('conferma.liberaTitolo'),
        testo: t('conferma.liberaTesto'),
        etichettaTorna: t('conferma.riprendiLibera'),
        etichettaContinua: t('conferma.nuovaLibera'),
        onTorna: () => {
          setConferma(null);
          setMenuAperto(false);
          if (giaDentro || riprendi('libera')) {
            if (ANCORA_VIA_DALLA_LIBERA) scriviRotta('');
            setSchermata('gioco');
          }
        },
        onContinua: () => { setConferma(null); avviaNuovaLibera(); },
      });
      return;
    }
    avviaNuovaLibera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liberaAMeta, riprendi, schermata, modalita, partita?.status, t]);

  function avviaNuovaLibera() {
    if (ANCORA_VIA_DALLA_LIBERA) scriviRotta('');
    nuovaPartita();
    setSalvataggioDisponibile(false);
    setMenuAperto(false);
    setSchermata('gioco');
  }

  const riprendiPartita = useCallback(() => {
    if (riprendi()) setSchermata('gioco');
  }, [riprendi]);

  /**
   * Apre la sfida di un giorno. Senza argomenti e' quella di oggi.
   *
   * Se era rimasta a meta' una partita della sfida, si riprende invece di ricominciare
   * -- ma SOLO se e' dello stesso giorno che si sta aprendo. Con l'archivio le due cose
   * non coincidono piu': riprendere la sfida di ieri quando si chiede quella del 12
   * marzo darebbe al giocatore una partita che non ha chiesto, con il punteggio che
   * finisce nel giorno sbagliato.
   */
  const apriSfida = useCallback((giorno = giornoDiOggi(), confermato = false) => {
    if (!sfidaGiocabile(giorno)) return;
    sbloccaAudio();
    suonoBottone();
    // Quella di un altro giorno a meta' si perderebbe: prima si chiede (PO-008).
    const lasciata = sfidaAMeta();
    if (CONFERMA_ALTRA_SFIDA && !confermato && lasciata && lasciata !== giorno) {
      const quando = dataDistesa(lasciata);
      const nuova = giorno === giornoDiOggi()
        ? t('conferma.sfidaOggi')
        : t('conferma.sfidaDel').replace('{giorno}', dataDistesa(giorno));
      setConferma({
        titolo: t('conferma.sfidaTitolo').replace('{giorno}', quando),
        testo: t('conferma.sfidaTesto').replace('{nuova}', nuova).replace('{giorno}', quando),
        etichettaTorna: t('conferma.riprendiSfida').replace('{giorno}', quando),
        etichettaContinua: t('conferma.apri').replace('{nuova}', nuova),
        onTorna: () => {
          setConferma(null);
          if (!riprendi('sfida')) return;
          scriviRotta(rottaSfida(lasciata));
          setSchermata('gioco');
        },
        onContinua: () => { setConferma(null); apriSfida(giorno, true); },
      });
      return;
    }
    const salvata = cePartitaSalvata('sfida') ? riprendi('sfida') : null;
    if (salvata && salvata.seedLabel === giorno) {
      scriviRotta(rottaSfida(giorno));
      setSchermata('gioco');
      return;
    }
    if (salvata) abbandona();
    if (!nuovaSfida(giorno)) return;
    setSfidaSalvata(false);
    scriviRotta(rottaSfida(giorno));
    setSchermata('gioco');
  }, [cePartitaSalvata, riprendi, nuovaSfida, abbandona, sfidaAMeta, t]);

  useEffect(() => {
    if (!rotta || rotta.nome !== 'sfida') return;
    // Basta essere USCITI dalla guida, non averla conclusa: chi arriva da un
    // collegamento a una sfida e sceglie "salta per ora" deve trovarci la sua sfida,
    // non la home. Il collegamento non si perde, viene solo servito dopo.
    if (!impostazioni.introVista && !guidaSaltata) return;
    // Gia' dentro quella sfida: non si ricomincia da capo a ogni ridisegno.
    if (modalita === 'sfida' && partita?.seedLabel === rotta.giorno) return;
    apriSfida(rotta.giorno);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotta, impostazioni.introVista, guidaSaltata]);

  /**
   * TORNARE DOV'ERAVAMO, se l'assenza e' stata breve.
   *
   * Su Android il gioco vive dentro una Trusted Web Activity: quando l'app va in secondo
   * piano il sistema puo' buttare via la pagina, e alla riapertura la TWA la ricarica da
   * zero. Chi ci gioca lo ha descritto cosi': "mettendo temporaneamente l'app in secondo
   * piano si perde la partita in corso, e' come se scadesse la sessione". La partita in
   * realta' non si perdeva (si salva a ogni mossa), si perdeva il POSTO -- e il livello
   * invece si perdeva sul serio, perche' non veniva salvato affatto.
   *
   * UNA VOLTA SOLA, AL PRIMO MONTAGGIO. Non e' una navigazione che si puo' rifare: se
   * questo effetto girasse di nuovo, riporterebbe dentro la partita chi e' appena uscito
   * per andare al menu. Per questo l'elenco delle dipendenze e' vuoto.
   *
   * LA GUIDA E IL COLLEGAMENTO A UNA SFIDA VENGONO PRIMA. Al primo avvio si spiegano le
   * regole, e un collegamento a una sfida e' un punto d'ingresso esplicito: in tutti e
   * due i casi il giocatore ha chiesto qualcosa, e la ripresa e' solo una comodita'.
   *
   * La finestra di due ore e il perche' stanno in persistence/ripresa.js.
   */
  useEffect(() => {
    if (rotta && rotta.nome === 'sfida') return;
    const dove = leggiRipresa();
    if (!dove) return;
    if (!impostazioni.introVista) {
      if (!RIPRESA_SENZA_GUIDA) return;
      // Vale come «Salta per ora»: per questa sessione e basta, la guida torna al
      // prossimo avvio senza partita in corso.
      setGuidaSaltata(true);
    }

    if (dove.dove === 'quadro') {
      if (quadri.riprendiSalvato()) setSchermata('quadro');
      return;
    }
    const quale = dove.dove === 'sfida' ? 'sfida' : 'libera';
    if (riprendi(quale)) setSchermata('gioco');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tornaAllaHome = useCallback(() => {
    // L'ancora della sfida non deve sopravvivere all'uscita: chi ricarica la pagina
    // dalla home si ritroverebbe dentro una partita che aveva appena abbandonato.
    scriviRotta('');
    abbandona();
    setStatistiche(loadStats());
    setSalvataggioDisponibile(cePartitaSalvata());
    setSfidaSalvata(sfidaInCorsoDi(giornoDiOggi()));
    setSfidaOggi(sfidaDelGiorno());
    setQuadriFatti(quantiSuperati());
    quadri.chiudi();
    setMenuAperto(false);
    setSchermata('home');
  }, [abbandona, cePartitaSalvata, sfidaInCorsoDi, quadri]);

  /**
   * Tutto quello che la home mostra, riletto dall'archivio. Serve dopo un'importazione
   * del salvataggio: la home teneva i numeri di prima («Livello 1», «0 di 100») finche'
   * non si ricaricava la pagina, e il pulsante grande apriva il livello sbagliato
   * (collaudo 1.21.6, B1). Rilegge anche record e impostazioni, che vivono negli hook.
   */
  const rileggiTutto = useCallback(() => {
    setStatistiche(loadStats());
    setSalvataggioDisponibile(cePartitaSalvata());
    setSfidaSalvata(sfidaInCorsoDi(giornoDiOggi()));
    setSfidaOggi(sfidaDelGiorno());
    setQuadriFatti(quantiSuperati());
    ricaricaRecord();
    ricaricaImpostazioni();
  }, [cePartitaSalvata, sfidaInCorsoDi, ricaricaRecord, ricaricaImpostazioni]);

  /**
   * Il giorno cambia anche a home aperta. La card della sfida diceva ancora il risultato
   * di ieri finche' non si ricaricava (collaudo 1.21.6, B3): si ricontrolla ogni minuto
   * e quando il gioco torna in primo piano, e si rilegge solo se il giorno e' cambiato.
   */
  const giornoVisto = useRef(giornoDiOggi());
  useEffect(() => {
    const controlla = () => {
      const oggi = giornoDiOggi();
      if (oggi === giornoVisto.current) return;
      giornoVisto.current = oggi;
      setSfidaOggi(sfidaDelGiorno());
      setSfidaSalvata(sfidaInCorsoDi(oggi));
    };
    const ogniMinuto = window.setInterval(controlla, 60000);
    document.addEventListener('visibilitychange', controlla);
    return () => {
      window.clearInterval(ogniMinuto);
      document.removeEventListener('visibilitychange', controlla);
    };
  }, [sfidaInCorsoDi]);

  const azzeraDati = useCallback(() => {
    clearAll();
    setStatistiche(loadStats());
    setSalvataggioDisponibile(false);
    setSfidaSalvata(false);
    setSfidaOggi(sfidaDelGiorno());
    setQuadriFatti(0);
    // Anche il record: la home mostrava ancora «Record 4.321» a dati azzerati
    // (collaudo 1.21.6, B2).
    ricaricaRecord();
    quadri.chiudi();
  }, [quadri, ricaricaRecord]);

  // --- Quadri --------------------------------------------------------------
  const apriQuadro = useCallback((definizione) => {
    sbloccaAudio();
    suonoBottone();
    // Lo stesso livello lasciato a meta' si riprende, non si ricomincia. Per ricominciare
    // c'e' «Riprova» nel menu del livello.
    const riprende = RIPRENDI_LIVELLO_A_MANO
      && quadri.numeroSalvato() === definizione.numero
      && quadri.riprendiSalvato();
    if (!riprende) quadri.apri(definizione);
    setSchermata('quadro');
  }, [quadri]);

  /** «Gioca» sull'obiettivo: se c'e' un ALTRO livello a meta', prima si chiede (PO-008, E1). */
  const avviaQuadro = useCallback(() => {
    const lasciato = quadri.livelloAMeta();
    if (CONFERMA_ALTRO_LIVELLO && lasciato !== null && lasciato !== quadri.quadro?.numero) {
      const altro = quadri.quadro?.numero;
      setConferma({
        titolo: t('conferma.livelloTitolo').replace('{n}', lasciato),
        testo: t('conferma.livelloTesto').replace('{altro}', altro).replace('{n}', lasciato),
        etichettaTorna: t('conferma.riprendiLivello').replace('{n}', lasciato),
        etichettaContinua: t('conferma.giocaLivello').replace('{altro}', altro),
        onTorna: () => { setConferma(null); quadri.riprendiSalvato(); },
        onContinua: () => { setConferma(null); quadri.avvia(); },
      });
      return;
    }
    quadri.avvia();
  }, [quadri, t]);

  /**
   * «Riprova» dal menu del livello in corso: con almeno una mossa fatta, prima si chiede
   * (PO-008, E2). «Torna al livello» chiude la domanda e lascia la partita com'era.
   */
  const riprovaLivello = useCallback(() => {
    setMenuAperto(false);
    if (CONFERMA_RIPROVA && !quadri.esito && quadri.partita?.stats.moves > 0) {
      const n = quadri.quadro.numero;
      setConferma({
        titolo: t('conferma.riprovaTitolo').replace('{n}', n),
        testo: t('conferma.riprovaTesto'),
        etichettaTorna: t('comune.tornaAllaPartita'),
        etichettaContinua: t('conferma.riprovaSi'),
        onTorna: () => setConferma(null),
        onContinua: () => { setConferma(null); quadri.riprova(); },
      });
      return;
    }
    quadri.riprova();
  }, [quadri, t]);

  const tornaAiQuadri = useCallback(() => {
    setQuadriFatti(quantiSuperati());
    quadri.chiudi();
    setSchermata('quadri');
  }, [quadri]);

  /**
   * Il livello lasciato a meta', da mostrare sul pulsante grande della home. Si rilegge
   * a ogni cambio di schermata: la voce cambia uscendo da un livello, finendolo,
   * importando un salvataggio o azzerando i dati, e tutte queste strade passano da li'.
   */
  const livelloInSospeso = useMemo(
    () => (RIPRENDI_LIVELLO_A_MANO && schermata === 'home' ? quadri.numeroSalvato() : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [schermata, quadri.quadro, quadri.esito],
  );

  /**
   * Il pulsante principale della home: entra direttamente nel livello corrente, oppure
   * riprende quello lasciato a meta' (anche se non e' il corrente: e' la partita aperta,
   * come «Riprendi la partita» per la partita libera).
   */
  const giocaLivelloCorrente = useCallback(() => {
    const livello = quadroNumero(livelloInSospeso ?? livelloCorrente);
    if (livello) apriQuadro(livello);
    else setSchermata('quadri');
  }, [livelloCorrente, livelloInSospeso, apriQuadro]);

  const quadroSuccessivo = useCallback(() => {
    const prossimo = quadroNumero(quadroDopo(quadri.quadro?.numero ?? 0, TOTALE_QUADRI));
    if (prossimo) apriQuadro(prossimo);
    else tornaAiQuadri();
  }, [quadri.quadro, apriQuadro, tornaAiQuadri]);

  /**
   * Il conteggio dei livelli superati va riletto appena un livello finisce.
   *
   * Prima veniva aggiornato solo tornando alla mappa o alla home: bastava, perche'
   * lo leggeva solo la home. Adesso lo legge anche la schermata di vittoria, che deve
   * mostrare l'avanzamento COMPRESO il livello appena superato; con il valore vecchio
   * il giocatore vedrebbe la barra ferma proprio nel momento in cui e' andato avanti.
   */
  useEffect(() => {
    if (quadri.esito?.completato) setQuadriFatti(quantiSuperati());
  }, [quadri.esito]);

  // --- Tasto Indietro di Android -------------------------------------------
  // Un passo indietro alla volta, nello stesso ordine dei pulsanti sullo schermo: prima
  // si chiude il menu se e' aperto, poi si risale di una schermata. Dalla home non si
  // fa niente, e il tasto torna a fare il suo mestiere: uscire dall'app.
  const passoIndietro = useCallback(() => {
    // La domanda di conferma per prima: Indietro la chiude e non perde niente.
    if (conferma) { setConferma(null); return; }
    if (menuAperto) { setMenuAperto(false); return; }
    if (schermata === 'quadro') { tornaAiQuadri(); return; }
    if (schermata === 'gioco') { tornaAllaHome(); return; }
    if (schermata === 'sostieni') { setSchermata(sostieniDa); return; }
    setSchermata(GENITORE[schermata] ?? 'home');
  }, [conferma, menuAperto, schermata, sostieniDa, tornaAiQuadri, tornaAllaHome]);

  useTastoIndietro(
    // Il menu conta come un gradino: si chiude col tasto Indietro senza uscire dalla
    // schermata sotto, come ci si aspetta da qualunque app Android.
    // "Sostieni" sta a due gradini se ci si e' arrivati da Info, a uno se dalla home:
    // la profondita' non e' una proprieta' della schermata, e' del percorso fatto.
    (schermata === 'sostieni' ? (sostieniDa === 'home' ? 1 : 2) : (PROFONDITA[schermata] ?? 1))
      + (menuAperto ? 1 : 0) + (conferma ? 1 : 0),
    passoIndietro,
    // L'ancora della sfida sopravvive nelle voci di cronologia lasciate indietro:
    // qui si ripulisce, prima che qualcuno la rilegga e riapra la sfida.
    useCallback(() => {
      if (schermata === 'home') scriviRotta('');
      else if (ANCORA_VIA_DALLA_LIBERA && schermata === 'gioco' && modalita === 'libera') scriviRotta('');
      else if (ANCORA_SFIDA_DOPO_INDIETRO && schermata === 'gioco' && modalita === 'sfida' && partita?.seedLabel) {
        scriviRotta(rottaSfida(partita.seedLabel));
      }
    }, [schermata, modalita, partita?.seedLabel]),
  );

  const finestraConferma = conferma ? (
    <ConfermaPerdita
      titolo={conferma.titolo}
      testo={conferma.testo}
      etichettaTorna={conferma.etichettaTorna}
      etichettaContinua={conferma.etichettaContinua}
      onTorna={conferma.onTorna}
      onContinua={conferma.onContinua}
      onAnnulla={chiudiConferma}
    />
  ) : null;

  // Partita finita: si passa automaticamente al riepilogo.
  const inGioco = partita && partita.status === 'playing';
  const finita = partita && partita.status === 'over';

  if (schermata === 'gioco' && finita) {
    return (
      <div className="pl-app">
        <SchermoFine
          riepilogo={riepilogo}
          record={record}
          nuoviRecord={nuoviRecord}
          modalita={modalita}
          esitoSfida={esitoSfida}
          // Il giorno serve alla scheda condivisibile: il collegamento in fondo deve
          // aprire LA STESSA sfida, non la home ne' quella di oggi.
          giornoSfida={partita?.seedLabel ?? null}
          onRigioca={modalita === 'sfida'
            // Il giorno e' quello della partita appena finita: dall'archivio si rigioca
            // il 12 marzo, non oggi. Senza la lambda, per giunta, React passerebbe
            // l'evento del click al posto del giorno.
            ? () => apriSfida(partita?.seedLabel ?? giornoDiOggi())
            : iniziaNuova}
          onHome={tornaAllaHome}
          t={t}
        />
      </div>
    );
  }

  /**
   * Presentazione al primo avvio: una volta sola, e chi ha gia' giocato non la vede mai.
   *
   * "INIZIA" PORTA ALLA HOME, e non dentro una partita. Questa riga e' stata sbagliata a
   * lungo, e vale la pena scrivere sia il difetto sia la correzione mancata.
   *
   * Il difetto: "Inizia" avviava la PARTITA LIBERA. Dei tester hanno raccontato di non
   * essersi accorti che esistesse una modalita' a livelli, e di aver creduto che PLINTO
   * fosse solo il gioco senza fine. Il percorso a cento livelli e' il gioco; la partita
   * libera e' l'alternativa.
   *
   * La correzione mancata: farlo entrare nel LIVELLO 1. Cura il sintomo e crea quello
   * speculare -- chi parte dentro un livello non vede la partita libera, ne' la sfida
   * del giorno, ne' l'archivio. Il problema non era in quale modalita' si finiva: era
   * che al primo avvio LA HOME NON LA VEDEVA NESSUNO, cioe' proprio nel momento in cui
   * il giocatore si sta facendo un'idea di che cosa sia questo gioco. Saltarla verso una
   * destinazione diversa resta saltarla.
   *
   * La home e' l'unica schermata che mostra la FORMA del gioco: il percorso col livello
   * a cui sei arrivato nel pulsante piu' grande, la mappa, la partita libera, la sfida
   * di oggi. Costa un tocco, e quel tocco lo sceglie il giocatore.
   *
   * Non si usa `tornaAllaHome`, che sarebbe sembrata la funzione giusta: quella cancella
   * anche l'ancora dell'indirizzo, e chi arriva da un collegamento a una sfida se la
   * vedrebbe buttare via proprio mentre la presentazione gliela stava tenendo da parte.
   * Qui non c'e' niente da abbandonare -- e' il primo avvio -- e basta scegliere dove
   * mostrarsi.
   *
   * `sbloccaAudio` va chiamato QUI perche' questo e' il primo tocco della sessione, e i
   * browser sbloccano l'audio solo dentro un gesto dell'utente. Prima lo faceva
   * `iniziaNuova`, che da questa strada non passa piu'.
   */
  if (!impostazioni.introVista && !guidaSaltata) {
    const esci = (perSempre) => {
      sbloccaAudio();
      suonoBottone();
      if (perSempre) cambia('introVista', true);
      else setGuidaSaltata(true);
      setSchermata('home');
    };
    return (
      <div className="pl-app">
        <PrimoAvvio
          t={t}
          onInizia={() => esci(true)}
          onSaltaPerOra={() => esci(false)}
        />
      </div>
    );
  }

  // --- Quadro in corso, oppure il suo esito --------------------------------
  if (schermata === 'quadro' && quadri.quadro && quadri.partita) {
    if (quadri.esito) {
      // I progressi si leggono DAI PROGRESSI SALVATI, non da `quadriFatti`: quel numero
      // e' uno stato di React aggiornato dopo, e alla prima resa dell'esito racconta
      // ancora il percorso di un istante fa. La festa finale che arriva un livello in
      // ritardo sarebbe il difetto piu' beffardo possibile.
      const appenaVinto = quadri.esito.completato
        ? { numero: quadri.quadro.numero, primaVolta: Boolean(quadri.esito.primaVolta) }
        : null;
      const percorso = riepilogoPercorso(undefined, TOTALE_QUADRI);
      const atto = appenaVinto
        ? riepilogoAtto(attoDelQuadro(quadri.quadro.numero), appenaVinto)
        : null;

      // La festa finale si mostra quando questa vittoria ha CHIUSO il percorso: non
      // basta che il percorso sia completo (lo resta per sempre, e la rivedresti a ogni
      // livello rigiocato), serve che sia questa vittoria ad averlo completato -- cioe'
      // che il livello appena vinto fosse ancora da superare.
      if (percorso.completo && appenaVinto?.primaVolta) {
        return (
          <div className="pl-app">
            <SchermoTrionfo
              riepilogo={percorso}
              animazioni={impostazioni.animazioni}
              onLibera={iniziaNuova}
              onElenco={tornaAiQuadri}
              t={t}
            />
            {finestraConferma}
          </div>
        );
      }

      return (
        <div className="pl-app">
          <SchermoFineQuadro
            quadro={quadri.quadro}
            esito={quadri.esito}
            ultimo={quadri.quadro.numero >= TOTALE_QUADRI}
            superatiTotali={quadriFatti}
            atto={atto}
            percorsoCompleto={percorso.completo}
            animazioni={impostazioni.animazioni}
            onRiprova={quadri.riprova}
            onProssimo={quadroSuccessivo}
            onElenco={tornaAiQuadri}
            t={t}
          />
        </div>
      );
    }
    // Prima di giocare, Plinto dice che cosa chiede questo Quadro e come ottenerlo.
    if (quadri.daPresentare) {
      return (
        <div className="pl-app">
          <AperturaQuadro
            quadro={quadri.quadro}
            onGioca={avviaQuadro}
            onElenco={tornaAiQuadri}
            t={t}
          />
          {finestraConferma}
        </div>
      );
    }

    return (
      <div className="pl-app">
        <SchermoGioco
          partita={quadri.partita}
          siPuoAnnullare={quadri.siPuoAnnullare}
          onAnnulla={quadri.annulla}
          record={recordLibera}
          pezziMorti={deadPiecesDi(quadri.partita)}
          onGioca={quadri.gioca}
          onMenu={() => setMenuAperto(true)}
          animazioni={impostazioni.animazioni}
          quadro={quadri.quadro}
          statoQuadro={quadri.stato}
          attrezzi={quadri.attrezzi}
          suggerimento={quadri.suggerimento}
          onCarriola={quadri.usaCarriola}
          onGessetto={quadri.usaGessetto}
          onPiccone={quadri.usaPiccone}
          onMensola={quadri.usaMensola}
          onRiprendiMensola={quadri.riprendiMensola}
          t={t}
        />
        {menuAperto ? (
          <div className="pl-velo" onClick={() => setMenuAperto(false)}>
            <div className="pl-menu" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="pl-btn pl-btn--largo" onClick={() => setMenuAperto(false)}>
                {t('comune.tornaAllaPartita')}
              </button>
              <button type="button" className="pl-btn pl-btn--largo" onClick={riprovaLivello}>
                {t('quadri.riprova')}
              </button>
              <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={() => { setMenuAperto(false); tornaAiQuadri(); }}>
                {t('quadri.elenco')}
              </button>
            </div>
          </div>
        ) : null}
        {finestraConferma}
      </div>
    );
  }

  return (
    <div className="pl-app">
      {schermata === 'gioco' && inGioco ? (
        <SchermoGioco
          partita={partita}
          siPuoAnnullare={siPuoAnnullare}
          onAnnulla={annulla}
          record={record}
          pezziMorti={pezziMorti}
          onGioca={gioca}
          onMenu={() => setMenuAperto(true)}
          animazioni={impostazioni.animazioni}
          modalita={modalita}
          t={t}
        />
      ) : null}

      {schermata === 'home' ? (
        <SchermoHome
          record={recordLibera}
          cePartitaSalvata={salvataggioDisponibile}
          sfidaOggi={sfidaOggi}
          sfidaInCorso={sfidaSalvata}
          quadriFatti={quadriFatti}
          quadriTotali={TOTALE_QUADRI}
          livelloCorrente={livelloCorrente}
          livelloInSospeso={livelloInSospeso}
          versione={__APP_VERSION__}
          onQuadri={() => setSchermata('quadri')}
          onGiocaLivello={giocaLivelloCorrente}
          onGioca={iniziaNuova}
          onRiprendi={riprendiPartita}
          onSfida={() => apriSfida()}
          onArchivio={() => setSchermata('archivio')}
          onVai={setSchermata}
          onSostieni={() => { setSostieniDa('home'); setSchermata('sostieni'); }}
          t={t}
        />
      ) : null}

      {schermata === 'profilo' ? (
        <SchermoProfilo onIndietro={() => setSchermata('home')} onGioca={iniziaNuova} t={t} />
      ) : null}

      {schermata === 'archivio' ? (
        <SchermoArchivio
          onApri={apriSfida}
          onIndietro={() => setSchermata('home')}
          t={t}
        />
      ) : null}

      {schermata === 'quadri' ? (
        <SchermoQuadri
          onApri={apriQuadro}
          onIndietro={() => setSchermata('home')}
          // Dopo l'azzeramento il conteggio va riletto: la mappa si ridisegna da sola
          // perche' rilegge il salvataggio, ma la home mostrerebbe ancora il vecchio
          // livello sul pulsante principale.
          onAzzerato={() => setQuadriFatti(quantiSuperati())}
          t={t}
        />
      ) : null}

      {schermata === 'statistiche' ? (
        <SchermoStatistiche
          onGioca={iniziaNuova}
          record={loadRecords('libera')}
          recordSfida={RECORD_SEPARATI ? loadRecords('sfida') : null}
          stats={statistiche}
          storicoSfide={storicoSfide()}
          onIndietro={() => setSchermata('home')}
          t={t}
        />
      ) : null}

      {schermata === 'impostazioni' ? (
        <SchermoImpostazioni
          impostazioni={impostazioni}
          cambia={cambia}
          inverti={inverti}
          onAzzera={azzeraDati}
          onImportato={rileggiTutto}
          onIndietro={() => setSchermata('home')}
          t={t}
        />
      ) : null}

      {schermata === 'aiuto' ? (
        <SchermoComeSiGioca onIndietro={() => setSchermata('home')} t={t} />
      ) : null}

      {schermata === 'info' ? (
        <SchermoInfo
          onIndietro={() => setSchermata('home')}
          onSostieni={() => { setSostieniDa('info'); setSchermata('sostieni'); }}
          t={t}
        />
      ) : null}

      {schermata === 'sostieni' ? (
        <SchermoSostieni onIndietro={() => setSchermata(sostieniDa)} t={t} />
      ) : null}

      {menuAperto ? (
        <div className="pl-velo" onClick={() => setMenuAperto(false)}>
          <div className="pl-menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pl-btn pl-btn--largo" onClick={() => setMenuAperto(false)}>
              {t('comune.tornaAllaPartita')}
            </button>
            <button type="button" className="pl-btn pl-btn--largo" onClick={iniziaNuova}>
              {t('home.nuovaPartita')}
            </button>
            <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={tornaAllaHome}>
              {t('fine.home')}
            </button>
          </div>
        </div>
      ) : null}
      {finestraConferma}
    </div>
  );
}
