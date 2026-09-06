import { useCallback, useEffect, useState } from 'react';
import { read, write, KEYS } from '../persistence/storage.js';
import { linguaDelBrowser } from '../i18n/index.js';

/**
 * Il sistema operativo chiede meno movimento?
 *
 * Il CSS lo sa gia' da solo, ma le particelle sono disegnate su un canvas con
 * requestAnimationFrame: `prefers-reduced-motion` non le tocca. L'unico modo per
 * rispettare davvero quella preferenza e' leggerla anche da JavaScript e usarla come
 * VALORE INIZIALE dell'impostazione Animazioni. Resta un valore iniziale, non un
 * vincolo: chi vuole le animazioni le riaccende dalle impostazioni e la sua scelta,
 * essendo salvata, vince sulla preferenza di sistema.
 */
function menoMovimento() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

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
    animazioni: !menoMovimento(),
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
