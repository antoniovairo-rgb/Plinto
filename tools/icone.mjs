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
import { readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { existsSync, writeFileSync } from 'node:fs';
import { MISURE, REGISTRO } from './misure-icone.js';

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

await mkdir(USCITA, { recursive: true });
const browser = await chromium.launch({ executablePath: ESEGUIBILE });

/**
 * Quanto lontano dal centro arriva il pixel dipinto piu' esterno, in frazione del lato.
 *
 * SI MISURA IL PNG, NON SI CALCOLA DALL'SVG. Fra le due cose c'e' il rendering vero, con
 * i suoi arrotondamenti e l'antialiasing, ed e' il PNG quello che finisce nel telefono.
 * La soglia sull'alfa esclude il velo dell'antialiasing, che altrimenti farebbe sembrare
 * il marchio piu' grande di quanto si veda.
 *
 * Sulle icone con il fondo dipinto si ignora il colore del fondo: li' il "marchio" sono
 * i blocchi, non la piastrella che li porta.
 */
async function raggioDelMarchio(percorso, lato, conFondo) {
  const page = await browser.newPage({ viewport: { width: 8, height: 8 } });
  const dati = `data:image/png;base64,${readFileSync(percorso).toString('base64')}`;
  const raggio = await page.evaluate(async ([src, L, fondo]) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = L; c.height = L;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, L, L);
    const p = ctx.getImageData(0, 0, L, L).data;
    const centro = L / 2;
    let massimo = 0;
    for (let y = 0; y < L; y += 1) {
      for (let x = 0; x < L; x += 1) {
        const i = (y * L + x) * 4;
        if (p[i + 3] < 24) continue;
        if (fondo) {
          const vicino = Math.abs(p[i] - 14) + Math.abs(p[i + 1] - 17) + Math.abs(p[i + 2] - 24);
          if (vicino < 24) continue;
        }
        const d = Math.hypot(x - centro + 0.5, y - centro + 0.5);
        if (d > massimo) massimo = d;
      }
    }
    return massimo / L;
  }, [dati, lato, conFondo]);
  await page.close();
  return raggio;
}

for (const { nome, lato, margine, trasparente = false, soloMarchio = false } of MISURE) {
  const page = await browser.newPage({ viewport: { width: lato, height: lato } });
  const inserto = Math.round(lato * margine);
  await page.setContent(`
    <style>
      html, body { margin: 0; padding: 0; background: ${trasparente ? 'transparent' : '#0E1118'}; }
      .cornice { width: ${lato}px; height: ${lato}px; display: grid; place-items: center; }
      .cornice svg { width: ${lato - inserto * 2}px; height: ${lato - inserto * 2}px; }
    </style>
    <div class="cornice">${trasparente || soloMarchio ? svgSoloMarchio : svg}</div>
  `);
  await page.screenshot({ path: `${USCITA}${nome}`, omitBackground: trasparente });
  await page.close();
}

// --- la verifica, sui file appena scritti ------------------------------------------
// Non e' una formalita': l'icona che si e' dovuta correggere aveva un commento che
// dichiarava proprio questa proprieta'. Un numero misurato vale piu' di una frase.
const misurate = [];
const fuori = [];
for (const { nome, lato, margine, zonaSicura, trasparente = false, soloMarchio = false } of MISURE) {
  if (!zonaSicura) continue;
  const raggio = await raggioDelMarchio(`${USCITA}${nome}`, lato, !trasparente || soloMarchio);
  misurate.push({ nome, lato, margine, zonaSicura, raggio: Number(raggio.toFixed(5)) });
  if (raggio > zonaSicura) {
    fuori.push(`${nome}: il marchio arriva a ${Math.round(raggio * lato)}px dal centro, `
      + `la zona sicura ne ammette ${Math.round(zonaSicura * lato)}px `
      + `(sporge di ${Math.round((raggio - zonaSicura) * lato)}px). Aumenta il margine in tools/misure-icone.js.`);
  }
}
writeFileSync(REGISTRO, `${JSON.stringify({ misurate }, null, 2)}\n`);

await browser.close();

if (fuori.length) {
  console.error('\nIl marchio esce dalla zona sicura e il launcher lo taglierebbe:');
  fuori.forEach((r) => console.error(`  - ${r}`));
  process.exit(1);
}

// Il progetto Android non tiene una copia da aggiornare a mano: la riceve da qui. Due
// file uguali in due cartelle diverse restano uguali finche' qualcuno se ne ricorda.
const ANDROID = new URL('../android/app/src/main/res/mipmap-xxxhdpi/', import.meta.url).pathname;
const SPLASH = new URL('../android/app/src/main/res/drawable-xxxhdpi/', import.meta.url).pathname;
copyFileSync(`${USCITA}icona-android-primopiano-432.png`, `${ANDROID}ic_launcher_foreground.png`);
copyFileSync(`${USCITA}icona-android-classica-432.png`, `${ANDROID}ic_launcher.png`);
mkdirSync(SPLASH, { recursive: true });
copyFileSync(`${USCITA}icona-splash-768.png`, `${SPLASH}splash.png`);

console.log(`\nIcone generate in public/icone/ da public/icon.svg:`);
MISURE.forEach(({ nome, lato, uso }) => console.log(`  ${nome.padEnd(34)} ${lato}px  ${uso}`));
console.log('\nCopiate nel progetto Android: ic_launcher_foreground.png, ic_launcher.png, drawable-xxxhdpi/splash.png');
console.log('\nMarchio dentro la zona sicura:');
misurate.forEach(({ nome, lato, raggio, zonaSicura }) => console.log(
  `  ${nome.padEnd(34)} raggio ${String(Math.round(raggio * lato)).padStart(4)}px `
  + `su ${Math.round(zonaSicura * lato)}px ammessi`));
