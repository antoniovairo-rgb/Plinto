import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Fonte unica della versione: il campo "version" di package.json.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  // Percorsi RELATIVI invece che assoluti: cosi' la stessa build funziona sia servita
  // dalla radice di un dominio, sia da una sottocartella come
  // https://utente.github.io/plinto/. Con i percorsi assoluti la pagina si aprirebbe
  // bianca su GitHub Pages, cercando /assets/... alla radice del dominio.
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    target: 'es2020',
  },
});
