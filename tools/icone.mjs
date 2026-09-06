/**
 * Genera le icone PNG dall'unica fonte, public/icon.svg.
 *
 * Gli store e i sistemi operativi vogliono PNG a dimensioni fisse, ma tenere sei file
 * PNG disegnati a mano significa che prima o poi cinque saranno aggiornati e uno no.
 * Qui l'SVG resta l'originale e i PNG sono un prodotto rigenerabile con un comando.
 *
 * L'icona "maskable" ha un margine interno perche' Android ritaglia l'icona in forme
 * diverse a seconda del produttore: senza margine, gli angoli del marchio spariscono.
 *
 * Uso: npm run icone
 */

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

/**
 * Percorso del browser.
 *
 * In questo ambiente di sviluppo Chromium e' preinstallato in una posizione fissa;
 * in integrazione continua e sulle macchine altrui lo installa Playwright, e quel
 * percorso non esiste. Se il percorso noto non c'e', si lascia decidere a Playwright
 * passando `undefined`: cosi' gli stessi script girano ovunque senza modifiche.
 */
const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;


const USCITA = new URL('../public/icone/', import.meta.url).pathname;
const svg = readFileSync(new URL('../public/icon.svg', import.meta.url).pathname, 'utf8');

/** Dimensioni richieste dalle piattaforme, con la ragione di ciascuna. */
const MISURE = [
  { nome: 'icona-192.png', lato: 192, margine: 0, uso: 'PWA, elenco applicazioni' },
  { nome: 'icona-512.png', lato: 512, margine: 0, uso: 'PWA, schermata iniziale' },
  { nome: 'icona-maskable-512.png', lato: 512, margine: 0.12, uso: 'Android, ritaglio adattivo' },
  { nome: 'icona-apple-180.png', lato: 180, margine: 0, uso: 'iOS, aggiunta alla schermata home' },
  { nome: 'icona-1024.png', lato: 1024, margine: 0, uso: 'schede degli store' },
  { nome: 'favicon-32.png', lato: 32, margine: 0, uso: 'scheda del browser' },
];

await mkdir(USCITA, { recursive: true });
const browser = await chromium.launch({ executablePath: ESEGUIBILE });

for (const { nome, lato, margine } of MISURE) {
  const page = await browser.newPage({ viewport: { width: lato, height: lato } });
  const inserto = Math.round(lato * margine);
  await page.setContent(`
    <style>
      html, body { margin: 0; padding: 0; background: #0E1118; }
      .cornice { width: ${lato}px; height: ${lato}px; display: grid; place-items: center; }
      .cornice svg { width: ${lato - inserto * 2}px; height: ${lato - inserto * 2}px; }
    </style>
    <div class="cornice">${svg}</div>
  `);
  await page.screenshot({ path: `${USCITA}${nome}`, omitBackground: false });
  await page.close();
}

await browser.close();
console.log(`\nIcone generate in public/icone/ da public/icon.svg:`);
MISURE.forEach(({ nome, lato, uso }) => console.log(`  ${nome.padEnd(26)} ${lato}px  ${uso}`));
