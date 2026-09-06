import { useCallback, useEffect, useState } from 'react';
import { read, write, KEYS } from '../persistence/storage.js';
import { linguaDelBrowser } from '../i18n/index.js';

/**
 * Impostazioni del giocatore, salvate in locale.
 * Tutte le preferenze partono da un valore che rispetta il giocatore: audio e
 * vibrazione accesi ma disattivabili, aiuto visivo acceso perche' chiarisce le
 * regole invece di nasconderle.
 */
export function useImpostazioni() {
  const [impostazioni, setImpostazioni] = useState(() => ({
    audio: true,
    vibrazione: true,
    animazioni: true,
    aiutoVisivo: true,
    tema: 'scuro',
    lingua: linguaDelBrowser(),
    introVista: false,
    ...(read(KEYS.SETTINGS, {}) ?? {}),
  }));

  useEffect(() => { write(KEYS.SETTINGS, impostazioni); }, [impostazioni]);

  useEffect(() => {
    const root = document.documentElement;
    if (impostazioni.tema === 'chiaro') root.setAttribute('data-theme', 'chiaro');
    else root.removeAttribute('data-theme');
    root.setAttribute('lang', impostazioni.lingua);
  }, [impostazioni.tema, impostazioni.lingua]);

  const cambia = useCallback((chiave, valore) => {
    setImpostazioni((prev) => ({ ...prev, [chiave]: valore }));
  }, []);

  const inverti = useCallback((chiave) => {
    setImpostazioni((prev) => ({ ...prev, [chiave]: !prev[chiave] }));
  }, []);

  return { impostazioni, cambia, inverti, setImpostazioni };
}
