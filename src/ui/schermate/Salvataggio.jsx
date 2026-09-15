import { useRef, useState } from 'react';
import {
  componiSalvataggio, serializza, leggiSalvataggio, applicaSalvataggio,
  quantiLivelli, nomeFile,
} from '../../persistence/salvataggio.js';
import { read, KEYS } from '../../persistence/storage.js';

/**
 * Portare via il salvataggio e rimetterlo.
 *
 * DUE VIE IN USCITA E DUE IN ENTRATA, DICHIARATE. Il file scaricato e' la via normale,
 * ma non funziona ovunque allo stesso modo: dentro un'applicazione installata il download
 * puo' finire in un posto che chi gioca non trova. Invece di indovinare se sia riuscito --
 * il browser non lo dice -- ci sono tutte e due le strade, visibili: scarica il file
 * oppure copia il testo. In entrata, stessa simmetria: scegli un file oppure incolla.
 * E' la stessa ragione per cui la scheda condivisibile ha un ripiego sugli appunti.
 *
 * L'IMPORTAZIONE NON DECIDE DA SOLA. Prima legge il file e dice che cosa contiene --
 * quanti livelli ci sono dentro e quanti ce ne sono adesso -- e solo dopo offre le due
 * azioni. "Unisci" e' quella normale e non toglie mai niente; "Sostituisci tutto" chiede
 * conferma, perche' e' l'unica che puo' far perdere qualcosa.
 */
export function Salvataggio({ t }) {
  const [copiato, setCopiato] = useState(false);
  const [testo, setTesto] = useState('');
  const [mostraIncolla, setMostraIncolla] = useState(false);
  const [letto, setLetto] = useState(null);      // { salvataggio, dentro, ora }
  const [errore, setErrore] = useState(null);    // chiave di traduzione
  const [conferma, setConferma] = useState(false);
  const [fatto, setFatto] = useState(null);      // livelli dopo l'importazione
  const fileInput = useRef(null);

  // __APP_VERSION__ lo inietta vite: dentro il file finisce la versione che l'ha scritto,
  // utile fra un anno per capire da dove viene un salvataggio che non si apre.
  const salvataggioDiAdesso = () => serializza(componiSalvataggio({ versioneGioco: __APP_VERSION__ }));

  function scarica() {
    const blob = new Blob([salvataggioDiAdesso()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeFile();
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Il revoke immediato puo' arrivare prima che il browser abbia finito di leggere il
    // blob: un attimo di attesa costa niente e toglie un difetto che si vede solo su
    // alcuni dispositivi, cioe' il peggior tipo di difetto.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(salvataggioDiAdesso());
      setCopiato(true);
    } catch {
      // Appunti negati: resta il download, che e' li' accanto e non serve annunciarlo.
      setCopiato(false);
    }
  }

  function esamina(contenuto) {
    setFatto(null);
    setConferma(false);
    const esito = leggiSalvataggio(contenuto);
    if (!esito.ok) { setErrore(esito.motivo); setLetto(null); return; }
    setErrore(null);
    setLetto({
      salvataggio: esito.salvataggio,
      dentro: quantiLivelli(esito.salvataggio.dati?.[KEYS.PROGRESS]),
      ora: quantiLivelli(read(KEYS.PROGRESS, null)),
    });
  }

  async function daFile(evento) {
    const file = evento.target.files?.[0];
    evento.target.value = '';
    if (!file) return;
    try { esamina(await file.text()); } catch { setErrore('illeggibile'); }
  }

  function applica(sostituisci) {
    const esito = applicaSalvataggio(letto.salvataggio, { sostituisci });
    setFatto(esito.livelliDopo);
    setLetto(null);
    setTesto('');
    setMostraIncolla(false);
  }

  return (
    <div className="pl-gruppo pl-salva">
      <span className="pl-hud__etichetta">{t('salvataggio.titolo')}</span>
      <p className="pl-nota">{t('salvataggio.nota')}</p>

      <div className="pl-segmenti">
        <button type="button" className="pl-btn" onClick={scarica}>
          {t('salvataggio.scarica')}
        </button>
        <button type="button" className="pl-btn" onClick={copia}>
          {t('salvataggio.copia')}
        </button>
      </div>
      {copiato ? <p className="pl-nota">{t('salvataggio.copiato')}</p> : null}

      <button type="button" className="pl-btn pl-btn--largo"
              onClick={() => fileInput.current?.click()}>
        {t('salvataggio.importa')}
      </button>
      <input ref={fileInput} type="file" accept="application/json,.json"
             onChange={daFile} hidden aria-hidden="true" tabIndex={-1} />

      {mostraIncolla ? (
        <>
          <textarea className="pl-campo" rows={4} value={testo}
                    aria-label={t('salvataggio.incolla')}
                    placeholder={t('salvataggio.incolla')}
                    onChange={(e) => setTesto(e.target.value)} />
          <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo"
                  disabled={!testo.trim()} onClick={() => esamina(testo)}>
            {t('salvataggio.leggi')}
          </button>
        </>
      ) : (
        <button type="button" className="pl-btn pl-btn--fantasma pl-btn--largo" onClick={() => setMostraIncolla(true)}>
          {t('salvataggio.incolla')}
        </button>
      )}

      {errore ? <p className="pl-nota pl-nota--allarme">{t(`salvataggio.errore.${errore}`)}</p> : null}

      {letto ? (
        <>
          <p className="pl-nota">
            {t('salvataggio.trovato', { file: letto.dentro, ora: letto.ora })}
          </p>
          {conferma ? (
            <>
              <p className="pl-nota pl-nota--allarme">{t('salvataggio.sostituisciConferma')}</p>
              <div className="pl-segmenti">
                <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => setConferma(false)}>
                  {t('comune.no')}
                </button>
                <button type="button" className="pl-btn pl-btn--pericolo" onClick={() => applica(true)}>
                  {t('comune.si')}
                </button>
              </div>
            </>
          ) : (
            <div className="pl-segmenti">
              <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => applica(false)}>
                {t('salvataggio.unisci')}
              </button>
              <button type="button" className="pl-btn pl-btn--fantasma" onClick={() => setConferma(true)}>
                {t('salvataggio.sostituisci')}
              </button>
            </div>
          )}
        </>
      ) : null}

      {fatto !== null ? (
        <p className="pl-nota">{t('salvataggio.fatto', { livelli: fatto })}</p>
      ) : null}
    </div>
  );
}
