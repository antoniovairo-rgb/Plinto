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

export default defineConfig({
  // Percorsi RELATIVI invece che assoluti: cosi' la stessa build funziona sia servita
  // dalla radice di un dominio, sia da una sottocartella come
  // https://utente.github.io/plinto/. Con i percorsi assoluti la pagina si aprirebbe
  // bianca su GitHub Pages, cercando /assets/... alla radice del dominio.
  base: './',
  plugins: [react(), precaricaNelServiceWorker()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
  },
});
