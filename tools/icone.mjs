/**
 * Genera le icone PNG dall'unica fonte, public/icon.svg.
 *
 * Gli store e i sistemi operativi vogliono PNG a dimensioni fisse, ma tenere sei file
 * PNG disegnati a mano significa che prima o poi cinque saranno aggiornati e uno no.
 * Qui l'SVG resta l'originale e i PNG sono un prodotto rigenerabile con un comando.
 *
 * L'icona "maskable" ha un margine interno perche' i sistemi ritagliano l'icona in forme
 * diverse a seconda del produttore: senza margine, gli angoli del marchio spariscono.
 *
 * ATTENZIONE: "maskable" del web e "adaptive icon" di Android NON sono la stessa cosa,
 * e per una versione hanno condiviso lo stesso file. La specifica web garantisce visibile
 * l'80% della tela; Android ne mostra 72 su 108, cioe' il 66%, e la zona davvero sicura e'
 * un cerchio di 66 su 108. Il marchio disegnato per l'80% sta in mezzo alle due misure:
 * sul sito si vedeva intero, sul telefono arrivava tagliato. Da qui il file separato, con
 * il margine calcolato su Android e lo sfondo trasparente, perche' il colore lo mette il
 * livello di sotto dell'icona adattiva.
 *
 * Uso: npm run icone
 */

import { chromium } from 'playwright';
import { readFileSync, copyFileSync } from 'node:fs';
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

/**
 * Lo stesso marchio senza la piastrella scura di fondo, ritagliato sui quattro riquadri.
 *
 * In un'icona adattiva il fondo e' un livello a parte: se lo si disegna anche nel primo
 * piano, il marchio deve rimpicciolirsi per far posto a un colore che c'e' gia'.
 *
 * Le due sostituzioni sono verificate: se un giorno `icon.svg` cambia forma, questo
 * strumento si ferma invece di produrre in silenzio un'icona senza marchio.
 */
const FONDO = '<rect width="48" height="48" rx="11" fill="#0e1118"/>';
const VISTA = 'viewBox="0 0 48 48"';
if (!svg.includes(FONDO) || !svg.includes(VISTA)) {
  throw new Error('public/icon.svg e\' cambiato: il ritaglio per Android va rifatto');
}
const svgSoloMarchio = svg.replace(FONDO, '').replace(VISTA, 'viewBox="3 3 42 42"');

/** Dimensioni richieste dalle piattaforme, con la ragione di ciascuna. */
const MISURE = [
  { nome: 'icona-192.png', lato: 192, margine: 0, uso: 'PWA, elenco applicazioni' },
  { nome: 'icona-512.png', lato: 512, margine: 0, uso: 'PWA, schermata iniziale' },
  { nome: 'icona-maskable-512.png', lato: 512, margine: 0.12, uso: 'Android, ritaglio adattivo' },
  { nome: 'icona-apple-180.png', lato: 180, margine: 0, uso: 'iOS, aggiunta alla schermata home' },
  { nome: 'icona-1024.png', lato: 1024, margine: 0, uso: 'schede degli store' },
  { nome: 'favicon-32.png', lato: 32, margine: 0, uso: 'scheda del browser' },
  // 432 = 108dp alla densita' xxxhdpi, la tela di un'icona adattiva. Margine 0,20 per
  // lato lascia il marchio al 60% della tela, dentro il cerchio sicuro di Android.
  {
    nome: 'icona-android-primopiano-432.png',
    lato: 432,
    // 0,18 per lato lascia il marchio al 64% della tela: sta dentro i 72dp su 108 che
    // Android garantisce visibili, e sfiora il cerchio sicuro invece di perdersi al centro.
    margine: 0.18,
    trasparente: true,
    uso: 'Android, primo piano dell\'icona adattiva',
  },
];

await mkdir(USCITA, { recursive: true });
const browser = await chromium.launch({ executablePath: ESEGUIBILE });

for (const { nome, lato, margine, trasparente = false } of MISURE) {
  const page = await browser.newPage({ viewport: { width: lato, height: lato } });
  const inserto = Math.round(lato * margine);
  await page.setContent(`
    <style>
      html, body { margin: 0; padding: 0; background: ${trasparente ? 'transparent' : '#0E1118'}; }
      .cornice { width: ${lato}px; height: ${lato}px; display: grid; place-items: center; }
      .cornice svg { width: ${lato - inserto * 2}px; height: ${lato - inserto * 2}px; }
    </style>
    <div class="cornice">${trasparente ? svgSoloMarchio : svg}</div>
  `);
  await page.screenshot({ path: `${USCITA}${nome}`, omitBackground: trasparente });
  await page.close();
}

await browser.close();

// Il progetto Android non tiene una copia da aggiornare a mano: la riceve da qui. Due
// file uguali in due cartelle diverse restano uguali finche' qualcuno se ne ricorda.
const ANDROID = new URL('../android/app/src/main/res/mipmap-xxxhdpi/', import.meta.url).pathname;
copyFileSync(`${USCITA}icona-android-primopiano-432.png`, `${ANDROID}ic_launcher_foreground.png`);
copyFileSync(`${USCITA}icona-512.png`, `${ANDROID}ic_launcher.png`);

console.log(`\nIcone generate in public/icone/ da public/icon.svg:`);
MISURE.forEach(({ nome, lato, uso }) => console.log(`  ${nome.padEnd(34)} ${lato}px  ${uso}`));
console.log('\nCopiate nel progetto Android: ic_launcher_foreground.png, ic_launcher.png');
