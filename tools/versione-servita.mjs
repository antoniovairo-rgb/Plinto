/**
 * Il server di prova sta servendo QUESTA versione?
 *
 * PERCHE' E' UN CONTROLLO A SE', E IL PRIMO DI TUTTI.
 *
 * Il numero di versione entra nel bundle quando il server di sviluppo PARTE, non a ogni
 * richiesta: `vite.config.js` lo legge da `package.json` e lo inietta come
 * `__APP_VERSION__`. Un server rimasto acceso da prima di un cambio di versione continua
 * quindi a servire il numero vecchio, mentre tutto il resto del codice si aggiorna da
 * solo. E' il tipo di sbaglio che passa inosservato proprio perche' tutto il resto e'
 * giusto.
 *
 * NON E' UN'IPOTESI, E' GIA' COSTATO DUE VOLTE.
 *
 * La prima: schermate per il Play Store che dichiaravano `v1.6.0` mentre il gioco era
 * alla 1.7.0. Da li' e' nata la guardia dentro `tools/schermate.mjs`.
 *
 * La seconda, peggiore: il numero di versione sta nel pie' di pagina della home, in fondo
 * a una riga gia' piena. Con `v1.9.3` la riga entrava per un soffio (misurato: home alta
 * esattamente 640 pixel su 640 disponibili); con `v1.10.0`, un carattere in piu', andava
 * a capo e la home scorreva di 7 pixel. Il controllo dell'impaginazione girava contro un
 * server acceso da prima del cambio di versione, vedeva `v1.9.3`, e diceva "entra". Il
 * gate e' passato, la 1.10.0 e' stata pubblicata con il difetto dentro.
 *
 * Da qui la regola: se qualcuno risponde sulla porta di prova, deve servire la versione
 * giusta, altrimenti non si verifica niente. Se non risponde nessuno va bene: ogni
 * controllo si avvia il server da solo, e uno appena avviato la versione giusta ce l'ha
 * per costruzione.
 */

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;

const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const attesa = `v${pkg.version}`;

let risponde = false;
try {
  risponde = (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok;
} catch { risponde = false; }

if (!risponde) {
  console.log(`Nessun server su ${INDIRIZZO}: ogni controllo se ne avvia uno suo, aggiornato per costruzione.`);
  process.exit(0);
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
// La home compare solo dopo la presentazione iniziale: la si dichiara gia' vista, che e'
// anche lo stato da cui parte ogni altro controllo.
await page.evaluate(() => {
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true,
  }));
  window.localStorage.removeItem('plinto:ripresa');
});
await page.reload({ waitUntil: 'networkidle' });
const mostrata = (await page.locator('.pl-home__versione').innerText().catch(() => '')).trim();
await browser.close();

if (mostrata !== attesa) {
  console.error(
    `Il server su ${INDIRIZZO} serve "${mostrata || '(niente)'}" invece di "${attesa}".\n`
    + 'Quasi sempre e\' un server di sviluppo rimasto acceso da prima del cambio di\n'
    + 'versione: il numero si inietta all\'avvio, quindi il codice si aggiorna e lui no.\n'
    + 'Fermalo e rilancia: i controlli che seguono starebbero misurando un gioco vecchio.',
  );
  process.exit(1);
}
console.log(`Il server su ${INDIRIZZO} serve ${mostrata}: e' la versione di package.json.`);
