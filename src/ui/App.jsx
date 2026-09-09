import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePartita } from '../state/usePartita.js';
import { useImpostazioni } from '../state/useImpostazioni.js';
import { traduttore } from '../i18n/index.js';
import { impostaLingua } from '../i18n/formato.js';
import { impostaAudio, suonoBottone, sbloccaAudio } from '../audio/suoni.js';
import { impostaVibrazione } from '../feel/vibrazione.js';
import { clearAll, ripulisciChiaviAbbandonate } from '../persistence/storage.js';
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
import { AperturaQuadro } from './schermate/AperturaQuadro.jsx';
import { useQuadro } from '../state/useQuadro.js';
import { QUADRI, TOTALE_QUADRI, quadroNumero } from '../config/quadri.js';
import { quantiSuperati, prossimoQuadro } from '../persistence/progressi.js';
import { giornoDiOggi, sfidaGiocabile } from '../core/sfida.js';
import { usaRotta, rottaSfida, scriviRotta } from './rotta.js';
import { useTastoIndietro, GENITORE } from './useTastoIndietro.js';

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
  const [statistiche, setStatistiche] = useState(() => loadStats());

  const { impostazioni, cambia, inverti } = useImpostazioni();

  // Le preferenze audio e vibrazione vivono in moduli senza React: qui le si tiene
  // allineate, cosi' i componenti non devono passarsele di mano in mano.
  // Una volta sola, all'avvio: via le voci di storage della modalita' con l'anteprima
  // in partita libera, che non esiste piu' (l'anteprima ora e' parte dei Quadri).
  useEffect(() => { ripulisciChiaviAbbandonate(); }, []);

  useEffect(() => { impostaLingua(impostazioni.lingua); }, [impostazioni.lingua]);
  useEffect(() => { impostaAudio(impostazioni.audio); }, [impostazioni.audio]);
  useEffect(() => { impostaVibrazione(impostazioni.vibrazione); }, [impostazioni.vibrazione]);
  const t = useMemo(() => traduttore(impostazioni.lingua), [impostazioni.lingua]);

  const {
    partita, modalita, esitoSfida, record, nuoviRecord, pezziMorti, riepilogo,
    nuovaPartita, nuovaSfida, riprendi, abbandona, gioca, cePartitaSalvata,
  } = usePartita();

  const [salvataggioDisponibile, setSalvataggioDisponibile] = useState(() => cePartitaSalvata());
  const [sfidaSalvata, setSfidaSalvata] = useState(() => cePartitaSalvata('sfida'));
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

  const iniziaNuova = useCallback(() => {
    sbloccaAudio();
    suonoBottone();
    nuovaPartita();
    setSalvataggioDisponibile(false);
    setMenuAperto(false);
    setSchermata('gioco');
  }, [nuovaPartita]);

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
  const apriSfida = useCallback((giorno = giornoDiOggi()) => {
    if (!sfidaGiocabile(giorno)) return;
    sbloccaAudio();
    suonoBottone();
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
  }, [cePartitaSalvata, riprendi, nuovaSfida, abbandona]);

  useEffect(() => {
    if (!rotta || rotta.nome !== 'sfida') return;
    if (!impostazioni.introVista) return;
    // Gia' dentro quella sfida: non si ricomincia da capo a ogni ridisegno.
    if (modalita === 'sfida' && partita?.seedLabel === rotta.giorno) return;
    apriSfida(rotta.giorno);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotta, impostazioni.introVista]);

  const tornaAllaHome = useCallback(() => {
    // L'ancora della sfida non deve sopravvivere all'uscita: chi ricarica la pagina
    // dalla home si ritroverebbe dentro una partita che aveva appena abbandonato.
    scriviRotta('');
    abbandona();
    setStatistiche(loadStats());
    setSalvataggioDisponibile(cePartitaSalvata());
    setSfidaSalvata(cePartitaSalvata('sfida'));
    setSfidaOggi(sfidaDelGiorno());
    setQuadriFatti(quantiSuperati());
    quadri.chiudi();
    setMenuAperto(false);
    setSchermata('home');
  }, [abbandona, cePartitaSalvata, quadri]);

  const azzeraDati = useCallback(() => {
    clearAll();
    setStatistiche(loadStats());
    setSalvataggioDisponibile(false);
    setSfidaSalvata(false);
    setSfidaOggi(sfidaDelGiorno());
    setQuadriFatti(0);
    quadri.chiudi();
  }, [quadri]);

  // --- Quadri --------------------------------------------------------------
  const apriQuadro = useCallback((definizione) => {
    sbloccaAudio();
    suonoBottone();
    quadri.apri(definizione);
    setSchermata('quadro');
  }, [quadri]);

  const tornaAiQuadri = useCallback(() => {
    setQuadriFatti(quantiSuperati());
    quadri.chiudi();
    setSchermata('quadri');
  }, [quadri]);

  /** Il pulsante principale della home: entra direttamente nel livello corrente. */
  const giocaLivelloCorrente = useCallback(() => {
    const livello = quadroNumero(livelloCorrente);
    if (livello) apriQuadro(livello);
    else setSchermata('quadri');
  }, [livelloCorrente, apriQuadro]);

  const quadroSuccessivo = useCallback(() => {
    const prossimo = quadroNumero((quadri.quadro?.numero ?? 0) + 1);
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
  // Restituisce `true` se dopo questo passo c'e' ancora qualcosa da cui tornare: serve
  // a chi lo chiama per rimettere subito la voce in cronologia, senza aspettare il
  // ridisegno. Vedi useTastoIndietro.js.
  const passoIndietro = useCallback(() => {
    if (menuAperto) { setMenuAperto(false); return schermata !== 'home'; }
    if (schermata === 'quadro') { tornaAiQuadri(); return true; }
    if (schermata === 'gioco') { tornaAllaHome(); return false; }
    const genitore = GENITORE[schermata] ?? 'home';
    setSchermata(genitore);
    return genitore !== 'home';
  }, [menuAperto, schermata, tornaAiQuadri, tornaAllaHome]);

  useTastoIndietro(
    menuAperto || schermata !== 'home',
    passoIndietro,
    // L'ancora della sfida sopravvive nelle voci di cronologia lasciate indietro:
    // qui si ripulisce, prima che qualcuno la rilegga e riapra la sfida.
    useCallback(() => { if (schermata === 'home') scriviRotta(''); }, [schermata]),
  );

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

  // Presentazione al primo avvio: una volta sola, e chi ha gia' giocato non la vede mai.
  if (!impostazioni.introVista) {
    return (
      <div className="pl-app">
        <PrimoAvvio
          t={t}
          onInizia={() => { cambia('introVista', true); iniziaNuova(); }}
        />
      </div>
    );
  }

  // --- Quadro in corso, oppure il suo esito --------------------------------
  if (schermata === 'quadro' && quadri.quadro && quadri.partita) {
    if (quadri.esito) {
      return (
        <div className="pl-app">
          <SchermoFineQuadro
            quadro={quadri.quadro}
            esito={quadri.esito}
            ultimo={quadri.quadro.numero >= TOTALE_QUADRI}
            superatiTotali={quadriFatti}
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
            onGioca={quadri.avvia}
            onElenco={tornaAiQuadri}
            t={t}
          />
        </div>
      );
    }

    return (
      <div className="pl-app">
        <SchermoGioco
          partita={quadri.partita}
          record={record}
          pezziMorti={deadPiecesDi(quadri.partita)}
          onGioca={quadri.gioca}
          onMenu={() => setMenuAperto(true)}
          aiutoVisivo={impostazioni.aiutoVisivo}
          animazioni={impostazioni.animazioni}
          quadro={quadri.quadro}
          statoQuadro={quadri.stato}
          t={t}
        />
        {menuAperto ? (
          <div className="pl-velo" onClick={() => setMenuAperto(false)}>
            <div className="pl-menu" onClick={(e) => e.stopPropagation()}>
              <button type="button" className="pl-btn pl-btn--largo" onClick={() => setMenuAperto(false)}>
                {t('comune.chiudi')}
              </button>
              <button type="button" className="pl-btn pl-btn--largo" onClick={() => { setMenuAperto(false); quadri.riprova(); }}>
                {t('quadri.riprova')}
              </button>
              <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={() => { setMenuAperto(false); tornaAiQuadri(); }}>
                {t('quadri.elenco')}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pl-app">
      {schermata === 'gioco' && inGioco ? (
        <SchermoGioco
          partita={partita}
          record={record}
          pezziMorti={pezziMorti}
          onGioca={gioca}
          onMenu={() => setMenuAperto(true)}
          aiutoVisivo={impostazioni.aiutoVisivo}
          animazioni={impostazioni.animazioni}
          modalita={modalita}
          t={t}
        />
      ) : null}

      {schermata === 'home' ? (
        <SchermoHome
          record={record}
          cePartitaSalvata={salvataggioDisponibile}
          sfidaOggi={sfidaOggi}
          sfidaInCorso={sfidaSalvata}
          quadriFatti={quadriFatti}
          quadriTotali={TOTALE_QUADRI}
          livelloCorrente={livelloCorrente}
          versione={__APP_VERSION__}
          onQuadri={() => setSchermata('quadri')}
          onGiocaLivello={giocaLivelloCorrente}
          onGioca={iniziaNuova}
          onRiprendi={riprendiPartita}
          onSfida={() => apriSfida()}
          onArchivio={() => setSchermata('archivio')}
          onVai={setSchermata}
          t={t}
        />
      ) : null}

      {schermata === 'profilo' ? (
        <SchermoProfilo onIndietro={() => setSchermata('home')} t={t} />
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
          record={loadRecords()}
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
          onSostieni={() => setSchermata('sostieni')}
          t={t}
        />
      ) : null}

      {schermata === 'sostieni' ? (
        <SchermoSostieni onIndietro={() => setSchermata('info')} t={t} />
      ) : null}

      {menuAperto ? (
        <div className="pl-velo" onClick={() => setMenuAperto(false)}>
          <div className="pl-menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pl-btn pl-btn--largo" onClick={() => setMenuAperto(false)}>
              {t('comune.chiudi')}
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
    </div>
  );
}
