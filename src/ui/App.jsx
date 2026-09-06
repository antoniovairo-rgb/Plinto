import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePartita } from '../state/usePartita.js';
import { useImpostazioni } from '../state/useImpostazioni.js';
import { traduttore } from '../i18n/index.js';
import { impostaLingua } from '../i18n/formato.js';
import { impostaAudio, suonoBottone, sbloccaAudio } from '../audio/suoni.js';
import { impostaVibrazione } from '../feel/vibrazione.js';
import { clearAll } from '../persistence/storage.js';
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
import { SchermoFineQuadro } from './schermate/FineQuadro.jsx';
import { AperturaQuadro } from './schermate/AperturaQuadro.jsx';
import { useQuadro } from '../state/useQuadro.js';
import { QUADRI, TOTALE_QUADRI, quadroNumero } from '../config/quadri.js';
import { quantiSuperati } from '../persistence/progressi.js';

/**
 * Radice dell'applicazione.
 *
 * Niente router: le schermate sono poche e la navigazione e' un valore di stato.
 * Meno dipendenze, avvio piu' rapido, e nessun URL da gestire in un gioco che
 * si apre e si chiude in pochi secondi.
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

  const quadri = useQuadro();

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

  /** Sfida del Giorno: se ne era rimasta una a meta' oggi, si riprende invece di ricominciare. */
  const apriSfida = useCallback(() => {
    sbloccaAudio();
    suonoBottone();
    if (cePartitaSalvata('sfida') && riprendi('sfida')) { setSchermata('gioco'); return; }
    nuovaSfida();
    setSfidaSalvata(false);
    setSchermata('gioco');
  }, [cePartitaSalvata, riprendi, nuovaSfida]);

  const tornaAllaHome = useCallback(() => {
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
          onRigioca={modalita === 'sfida' ? apriSfida : iniziaNuova}
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
          onQuadri={() => setSchermata('quadri')}
          onGioca={iniziaNuova}
          onRiprendi={riprendiPartita}
          onSfida={apriSfida}
          onVai={setSchermata}
          t={t}
        />
      ) : null}

      {schermata === 'quadri' ? (
        <SchermoQuadri onApri={apriQuadro} onIndietro={() => setSchermata('home')} t={t} />
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
