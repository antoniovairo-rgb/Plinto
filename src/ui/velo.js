/*
 * VELI_CHE_SCORRONO (PO-035, D1 del rapporto PO-017; decisione della madre del 21 ottobre
 * 2026): con i caratteri al 200% (simulazione: ogni `font-size` per due) il pannello degli
 * attrezzi andava da 24 a 1153 px su 915 di schermo, e ne' lui ne' il velo scorrevano:
 * «Torna alla partita» non si raggiungeva (si usciva solo toccando la striscia di velo ai
 * lati). Lo stesso vale per il menu e per le domande, che hanno la stessa forma. Acceso, il
 * velo ha la classe `pl-velo--scorre`: la finestra al centro non supera l'altezza del velo
 * e, se il contenuto e' piu' alto, scorre dentro di se'. A caratteri normali entra tutto e
 * non cambia niente a schermo. Spento, torna il difetto: il caso «testo x2» di
 * `npm run e2e-schermi` e' rosso.
 */
export const VELI_CHE_SCORRONO = true;

/** La classe del velo scuro sotto menu, domande e pannello degli attrezzi. */
export const CLASSE_VELO = VELI_CHE_SCORRONO ? 'pl-velo pl-velo--scorre' : 'pl-velo';
