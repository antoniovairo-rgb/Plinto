import { useCallback, useMemo, useState } from 'react';
import { usePartita } from '../state/usePartita.js';
import { useImpostazioni } from '../state/useImpostazioni.js';
import { traduttore } from '../i18n/index.js';
import { clearAll } from '../persistence/storage.js';
import { loadStats, loadRecords } from '../persistence/records.js';
import { SchermoGioco } from './SchermoGioco.jsx';
import { SchermoHome } from './schermate/Home.jsx';
import { SchermoFine } from './schermate/Fine.jsx';
import { SchermoStatistiche } from './schermate/Statistiche.jsx';
import { SchermoImpostazioni } from './schermate/Impostazioni.jsx';
import { SchermoInfo } from './schermate/Info.jsx';
import { SchermoSostieni } from './schermate/Sostieni.jsx';

/**
 * Radice dell'applicazione.
 *
 * Niente router: le schermate sono poche e la navigazione e' un valore di stato.
 * Meno dipendenze, avvio piu' rapido, e nessun URL da gestire in un gioco che
 * si apre e si chiude in pochi secondi.
 */
export function App() {
  const [schermata, setSchermata] = useState('home');
  const [menuAperto, setMenuAperto] = useState(false);
  const [statistiche, setStatistiche] = useState(() => loadStats());

  const { impostazioni, cambia, inverti } = useImpostazioni();
  const t = useMemo(() => traduttore(impostazioni.lingua), [impostazioni.lingua]);

  const {
    partita, record, nuoviRecord, pezziMorti, riepilogo,
    nuovaPartita, riprendi, abbandona, gioca, cePartitaSalvata,
  } = usePartita();

  const [salvataggioDisponibile, setSalvataggioDisponibile] = useState(() => cePartitaSalvata());

  const iniziaNuova = useCallback(() => {
    nuovaPartita();
    setSalvataggioDisponibile(false);
    setMenuAperto(false);
    setSchermata('gioco');
  }, [nuovaPartita]);

  const riprendiPartita = useCallback(() => {
    if (riprendi()) setSchermata('gioco');
  }, [riprendi]);

  const tornaAllaHome = useCallback(() => {
    abbandona();
    setStatistiche(loadStats());
    setSalvataggioDisponibile(cePartitaSalvata());
    setMenuAperto(false);
    setSchermata('home');
  }, [abbandona, cePartitaSalvata]);

  const azzeraDati = useCallback(() => {
    clearAll();
    setStatistiche(loadStats());
    setSalvataggioDisponibile(false);
  }, []);

  // Partita finita: si passa automaticamente al riepilogo.
  const inGioco = partita && partita.status === 'playing';
  const finita = partita && partita.status === 'over';

  if (schermata === 'gioco' && finita) {
    return (
      <div className="q-app">
        <SchermoFine
          riepilogo={riepilogo}
          record={record}
          nuoviRecord={nuoviRecord}
          onRigioca={iniziaNuova}
          onHome={tornaAllaHome}
          t={t}
        />
      </div>
    );
  }

  return (
    <div className="q-app">
      {schermata === 'gioco' && inGioco ? (
        <SchermoGioco
          partita={partita}
          record={record}
          pezziMorti={pezziMorti}
          onGioca={gioca}
          onMenu={() => setMenuAperto(true)}
          aiutoVisivo={impostazioni.aiutoVisivo}
          t={t}
        />
      ) : null}

      {schermata === 'home' ? (
        <SchermoHome
          record={record}
          cePartitaSalvata={salvataggioDisponibile}
          onGioca={iniziaNuova}
          onRiprendi={riprendiPartita}
          onVai={setSchermata}
          t={t}
        />
      ) : null}

      {schermata === 'statistiche' ? (
        <SchermoStatistiche
          record={loadRecords()}
          stats={statistiche}
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
        <div className="q-velo" onClick={() => setMenuAperto(false)}>
          <div className="q-menu" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="q-btn q-btn--largo" onClick={() => setMenuAperto(false)}>
              {t('comune.chiudi')}
            </button>
            <button type="button" className="q-btn q-btn--largo" onClick={iniziaNuova}>
              {t('home.nuovaPartita')}
            </button>
            <button type="button" className="q-btn q-btn--fantasma q-btn--largo" onClick={tornaAllaHome}>
              {t('fine.home')}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
