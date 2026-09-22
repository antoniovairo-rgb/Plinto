import { useCallback, useEffect, useState } from 'react';
import { KEYS } from '../persistence/storage.js';
import { leggiDocumento, scriviDocumento } from '../persistence/documenti.js';
import { linguaDelBrowser } from '../i18n/index.js';

/**
 * Il sistema operativo chiede meno movimento?
 *
 * Il CSS lo sa gia' da solo, ma le particelle sono disegnate su un canvas con
 * requestAnimationFrame: `prefers-reduced-motion` non le tocca. L'unico modo per
 * rispettare davvero quella preferenza e' leggerla anche da JavaScript.
 *
 * Da quando l'interruttore delle Animazioni non esiste piu' nelle impostazioni, questa
 * e' l'UNICA cosa che le spegne. Non e' una perdita: chi ha bisogno di meno movimento
 * lo ha gia' chiesto al sistema operativo una volta per tutte, e non deve ripeterlo
 * dentro ogni applicazione. Il campo resta nelle impostazioni salvate perche' le prove
 * automatiche lo forzano per rendere deterministici i controlli nel browser.
 */
function menoMovimento() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Versione del documento delle impostazioni.
 *
 * Alla 1 i campi erano gli stessi della forma senza versione: il documento diceva
 * soltanto da dove veniva.
 *
 * ALLA 2 IL TEMA CHIARO NON ESISTE PIU'. La migrazione toglie il campo, e non e' una
 * pulizia cosmetica: chi aveva scelto "chiaro" ha quella parola scritta sul proprio
 * dispositivo, e senza migrazione se la porterebbe dietro per sempre -- con l'interruttore
 * per cambiarla sparito dalle impostazioni. Sarebbe un giocatore chiuso dentro un tema che
 * il gioco non disegna piu' e che non puo' abbandonare. Togliendo il campo, alla prima
 * apertura torna allo scuro come tutti.
 */
const VERSIONE = 2;

/** Dalla forma con il tema a quella senza. */
function migra(dati) {
  const { tema, ...resto } = dati;
  return resto;
}

/**
 * Impostazioni del giocatore, salvate in locale.
 * Tutte le preferenze partono da un valore che rispetta il giocatore: audio e
 * vibrazione accesi ma disattivabili, aiuto visivo acceso perche' chiarisce le
 * regole invece di nasconderle.
 */
export function useImpostazioni() {
  const [impostazioni, setImpostazioni] = useState(() => leggiDocumento(KEYS.SETTINGS, {
    versione: VERSIONE,
    predefiniti: {
      audio: true,
      vibrazione: true,
      animazioni: !menoMovimento(),
      lingua: linguaDelBrowser(),
      introVista: false,
    },
    migra,
  }));

  useEffect(() => { scriviDocumento(KEYS.SETTINGS, VERSIONE, impostazioni); }, [impostazioni]);

  useEffect(() => {
    const root = document.documentElement;
    // L'attributo si toglie SEMPRE, anche se nessuno lo mette piu': un dispositivo che
    // l'aveva addosso da prima deve perderlo alla prima apertura, non restare dipinto
    // con una tavolozza che il gioco non ha piu'.
    root.removeAttribute('data-theme');
    root.setAttribute('lang', impostazioni.lingua);
  }, [impostazioni.lingua]);

  const cambia = useCallback((chiave, valore) => {
    setImpostazioni((prev) => ({ ...prev, [chiave]: valore }));
  }, []);

  const inverti = useCallback((chiave) => {
    setImpostazioni((prev) => ({ ...prev, [chiave]: !prev[chiave] }));
  }, []);

  return { impostazioni, cambia, inverti, setImpostazioni };
}
