import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Fonte unica della versione: il campo "version" di package.json.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

/**
 * Scrive nel service worker l'elenco delle risorse da precaricare.
 *
 * I nomi dei file prodotti contengono un'impronta del contenuto e cambiano a ogni
 * build: non si possono scrivere a mano in public/sw.js. Senza questo passaggio il
 * gioco resta installabile ma NON si apre senza rete, perche' alla prima visita il
 * service worker non controlla ancora la pagina e quei file non passano da lui.
 *
 * Sostituisce un segnaposto invece di generare l'intero file: il service worker resta
 * leggibile e modificabile a mano, che e' il motivo per cui non si usa una libreria.
 */
function precaricaNelServiceWorker() {
  return {
    name: 'plinto-precarica-sw',
    apply: 'build',
    async closeBundle() {
      const { readFile, writeFile, readdir } = await import('node:fs/promises');
      const sw = new URL('./dist/sw.js', import.meta.url);
      const risorse = (await readdir(new URL('./dist/assets', import.meta.url)))
        .filter((n) => /\.(js|css)$/.test(n))
        .map((n) => `'./assets/${n}'`);
      const testo = await readFile(sw, 'utf8');
      if (!testo.includes('/* PRECARICA */')) {
        throw new Error('sw.js non contiene il segnaposto /* PRECARICA */: il gioco non funzionerebbe senza rete');
      }
      await writeFile(sw, testo.replace('/* PRECARICA */', risorse.join(', ')));
    },
  };
}

/**
 * La politica di sicurezza dei contenuti, scritta nella pagina costruita.
 *
 * PERCHE' NELLA PAGINA E NON NELLE INTESTAZIONI. Le intestazioni le mette il server, e
 * GitHub Pages non permette di metterne di proprie. Per anni il progetto ha avuto una
 * CSP severa dentro netlify.toml, cioe' dentro un file che nessuno leggeva: sembrava
 * protetto e non lo era. Un <meta> lo applica il browser, quindi funziona su qualunque
 * hosting statico e anche dentro la TWA, che carica lo stesso sito.
 *
 * COSA IL <meta> NON PUO' FARE, e va detto invece di fingere: `frame-ancestors`,
 * `report-uri` e `sandbox` vengono IGNORATI quando arrivano da un meta. Difendersi
 * dall'essere incorniciati in una pagina altrui richiede una vera intestazione, che qui
 * non si puo' avere. Il resto della politica invece vale per intero.
 *
 * SOLO NELLA BUILD (`apply: 'build'`). In sviluppo Vite inietta codice suo nella pagina
 * per l'aggiornamento a caldo, e una politica severa lo bloccherebbe: il gioco non si
 * aprirebbe piu' con `npm run dev`. Le prove che contano girano sulla pagina costruita.
 *
 * OGNI VOCE E' STATA MISURATA, non copiata da un esempio. Si parte da `default-src
 * 'none'` -- tutto vietato -- e si aggiunge solo cio' che l'applicazione ha davvero
 * chiesto mentre un controllo la attraversava intera raccogliendo le violazioni.
 *   script-src  'self'              il bundle. Nessun inline, nessun eval.
 *   style-src   'self' 'unsafe-inline'  il foglio di stile, il <style> nella pagina che
 *                                   dipinge il fondo prima di React, e gli stili scritti
 *                                   sull'attributo (le barre di avanzamento).
 *   img-src     'self' data:        icone e figure; `data:` per le immagini disegnate.
 *   connect-src 'self'              il service worker; il gioco non parla con nessuno.
 *   manifest-src / worker-src       il manifesto e il service worker.
 *   font-src    'self'              nessun font esterno, e non deve potercene essere.
 *   base-uri / form-action / object-src  chiusi: non servono a niente qui.
 * L'audio non compare perche' e' generato con gli oscillatori: non si carica niente.
 */
const POLITICA = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function politicaDiSicurezza() {
  return {
    name: 'plinto-politica-sicurezza',
    apply: 'build',
    transformIndexHtml(html) {
      if (html.includes('Content-Security-Policy')) return html;
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${POLITICA}" />`,
      );
    },
  };
}

export default defineConfig({
  // Percorsi RELATIVI invece che assoluti: cosi' la stessa build funziona sia servita
  // dalla radice di un dominio, sia da una sottocartella come
  // https://utente.github.io/plinto/. Con i percorsi assoluti la pagina si aprirebbe
  // bianca su GitHub Pages, cercando /assets/... alla radice del dominio.
  base: './',
  plugins: [react(), politicaDiSicurezza(), precaricaNelServiceWorker()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
  },
});
