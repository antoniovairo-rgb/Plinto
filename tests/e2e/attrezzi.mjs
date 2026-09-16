/**
 * Gli attrezzi del cantiere, nel gioco vero.
 *
 * Le regole stanno gia' nelle prove pure (attrezzi, gru, gessetto). Qui si prova il
 * cablaggio, cioe' quello che quelle non possono vedere: che la pastiglia compaia, che il
 * pannello si apra senza costare niente, che la gru cambi davvero il pezzo toccato e che
 * il gessetto segni delle caselle. E due cose che sarebbero difetti silenziosi: guardare
 * il pannello e chiuderlo non deve scalare niente, e spegnendo l'interruttore la pastiglia
 * deve sparire.
 *
 * Uso: npm run e2e-attrezzi
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { ATTREZZI } from '../../src/persistence/attrezzi.js';
import TESTI from '../../src/i18n/it.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-attrezzi';
await mkdir(OUT, { recursive: true });

const errori = [];
const controlla = (cosa, ok) => { if (!ok) errori.push(cosa); };

async function risponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; }
}
let server = null;
if (!(await risponde())) {
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'],
    { cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore' });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await risponde())) await new Promise((r) => setTimeout(r, 400));
}
process.on('exit', () => { try { server?.kill(); } catch { /* gia' morto */ } });

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text().slice(0, 160)}`); });

/** Apre il livello 13 con `quanti` attrezzi in magazzino. */
async function apriPartita(quanti, impostazioniInPiu = {}) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(({ n, extra }) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, ...extra,
    }));
    const v = {};
    for (let k = 1; k <= 12; k += 1) v[k] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: v }));
    window.localStorage.setItem('plinto:attrezzi', JSON.stringify({ versione: 1, disponibili: n, riscossi: 2 }));
  }, { n: quanti, extra: impostazioniInPiu });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  const tappa = page.locator('.pl-tappa').nth(12);
  await tappa.scrollIntoViewIfNeeded();
  await tappa.click();
  const gioca = page.getByRole('button', { name: /^Gioca$/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-plancia');
}

const pieni = () => page.locator('.pl-attrezzi__posto--pieno').count();

console.log('\n1. la pastiglia c e e dice quanti attrezzi hai...');
await apriPartita(2);
controlla('la pastiglia degli attrezzi non compare', await page.locator('.pl-attrezzi__pastiglia').count() === 1);
controlla(`la pastiglia mostra ${await pieni()} attrezzi invece di 2`, (await pieni()) === 2);
await page.screenshot({ path: `${OUT}/1-pastiglia.png` });

console.log('2. guardare il pannello e chiuderlo NON costa niente...');
await page.locator('.pl-attrezzi__pastiglia').click();
await page.waitForSelector('.pl-attrezzi__pannello');
await page.screenshot({ path: `${OUT}/2-pannello.png` });
await page.getByRole('button', { name: /^Torna alla partita$/ }).click();
await page.waitForTimeout(200);
controlla(`chiudere il pannello ha scalato un attrezzo (ne restano ${await pieni()})`, (await pieni()) === 2);

console.log('3. il gessetto segna delle caselle e costa uno...');
await page.locator('.pl-attrezzi__pastiglia').click();
await page.getByRole('button', { name: /Il gessetto/ }).click();
await page.waitForTimeout(300);
const segnate = await page.locator('.pl-cella--segnata').count();
controlla('il gessetto non ha segnato nessuna casella', segnate > 0);
controlla(`dopo il gessetto restano ${await pieni()} attrezzi invece di 1`, (await pieni()) === 1);
await page.screenshot({ path: `${OUT}/3-gessetto.png` });

console.log('4. la gru cambia il pezzo che tocchi, e non costa una mossa...');
const mosseDi = async () => Number((await page.locator('.pl-obiettivo__mosse strong').first().innerText()).trim());
const mossePrima = await mosseDi();
await page.locator('.pl-attrezzi__pastiglia').click();
await page.getByRole('button', { name: /La gru/ }).click();
await page.waitForTimeout(200);
controlla('in modo gru il vassoio non si illumina', await page.locator('.pl-tray-scelta').count() === 1);
await page.screenshot({ path: `${OUT}/4-gru.png` });
const prima = await page.locator('.pl-tray__posto').nth(1).innerHTML();
await page.locator('.pl-tray__posto').nth(1).click();
await page.waitForTimeout(400);
controlla('la gru non ha cambiato il pezzo toccato', prima !== await page.locator('.pl-tray__posto').nth(1).innerHTML());
controlla(`la gru ha consumato una mossa (${mossePrima} -> ${await mosseDi()})`, (await mosseDi()) === mossePrima);
controlla(`dopo la gru restano ${await pieni()} attrezzi invece di 0`, (await pieni()) === 0);
controlla('il segno del gesso non si e cancellato dopo la gru', await page.locator('.pl-cella--segnata').count() === 0);

console.log('5. a magazzino vuoto il pannello spiega come si guadagnano E che cosa sono...');
await page.locator('.pl-attrezzi__pastiglia').click();
await page.waitForSelector('.pl-attrezzi__pannello');
const vuoto = await page.locator('.pl-attrezzi__pannello').innerText();
controlla(`il pannello vuoto non spiega niente: "${vuoto.replace(/\n/g, ' | ')}"`, /5 livelli/.test(vuoto));
// LA LEGENDA. A zero attrezzi si leggeva solo COME ottenerli e non CHE COSA fossero,
// cioe' l'unica cosa che poteva far venire voglia di ottenerli. Adesso l'elenco c'e'
// lo stesso, ma come voci e non come pulsanti: si vede quello che ti aspetta e non
// c'e' niente da premere per sbaglio.
const voci = await page.locator('.pl-attrezzi__scelta').count();
const premibili = await page.locator('button.pl-attrezzi__scelta').count();
console.log(`   legenda: ${voci} voci, ${premibili} premibili`);
controlla(`a magazzino vuoto la legenda mostra ${voci} attrezzi invece di ${ATTREZZI.length}`,
  voci === ATTREZZI.length);
controlla(`a magazzino vuoto ci sono ${premibili} voci premibili: non si deve poter spendere
 un attrezzo che non c'e`, premibili === 0);
for (const nome of ATTREZZI) {
  controlla(`la legenda non nomina ${nome}`, vuoto.includes(TESTI.attrezzi[nome]));
  controlla(`la legenda non spiega ${nome}`, vuoto.includes(TESTI.attrezzi[`${nome}Spiega`]));
}
await page.screenshot({ path: `${OUT}/5-vuoto.png` });
await page.getByRole('button', { name: /^Torna alla partita$/ }).click();

// Gli attrezzi non hanno piu' un interruttore nelle impostazioni (1.15.0): il controllo
// che li spegneva e' diventato il controllo che nessuno possa restare spento. Un vecchio
// `attrezzi: false` salvato esiste davvero sui telefoni di chi ha giocato la 1.14 con
// l'interruttore abbassato: senza questa prova, quelle persone non rivedrebbero mai piu'
// la pastiglia e non avrebbero piu' nessun modo di riaccenderla.
console.log('6. il piccone toglie una casella sola e costa uno...');
await apriPartita(3);
const mosseScavo = await mosseDi();
await page.locator('.pl-attrezzi__pastiglia').click();
await page.getByRole('button', { name: /Il piccone/ }).click();
await page.waitForTimeout(150);
controlla('in modo piccone la plancia non viene messa in evidenza',
  await page.locator('.pl-plancia-scavo').count() === 1);
await page.screenshot({ path: `${OUT}/6-piccone.png` });
const blocchiPrima = await page.locator('.pl-plancia .pl-blocco').count();

// Toccare una casella VUOTA non e uno scavo: non deve costare niente e non deve
// chiudere il modo. E il caso del dito storto, e un attrezzo perso per un dito storto
// e il modo piu rapido di far odiare un aiuto.
const vuota = page.locator('.pl-plancia .pl-cella').filter({ hasNot: page.locator('.pl-blocco') }).first();
await vuota.click();
await page.waitForTimeout(200);
controlla('toccare una casella vuota ha chiuso il modo piccone',
  await page.locator('.pl-plancia-scavo').count() === 1);
controlla('toccare una casella vuota ha tolto qualcosa dalla griglia',
  await page.locator('.pl-plancia .pl-blocco').count() === blocchiPrima);
// La pastiglia si rivede solo fuori dal modo attrezzo: per contare gli attrezzi si esce.
await page.getByRole('button', { name: /^Lascia stare$/ }).click();
await page.waitForTimeout(150);
controlla(`toccare una casella vuota ha scalato un attrezzo (ne restano ${await pieni()})`,
  (await pieni()) === 3);

await page.locator('.pl-attrezzi__pastiglia').click();
await page.getByRole('button', { name: /Il piccone/ }).click();
await page.waitForTimeout(150);
const piena = page.locator('.pl-plancia .pl-cella').filter({ has: page.locator('.pl-blocco') }).first();
await piena.click();
await page.waitForTimeout(250);
const blocchiDopo = await page.locator('.pl-plancia .pl-blocco').count();
controlla(`il piccone ha tolto ${blocchiPrima - blocchiDopo} caselle invece di una`,
  blocchiDopo === blocchiPrima - 1);
controlla('dopo lo scavo la plancia resta in evidenza',
  await page.locator('.pl-plancia-scavo').count() === 0);
controlla(`lo scavo non ha scalato l attrezzo (ne restano ${await pieni()})`, (await pieni()) === 2);
// Uno scavo NON e una mossa: nei livelli a mosse contate e la differenza fra un aiuto
// e una tassa.
controlla(`lo scavo ha consumato una mossa (${mosseScavo} -> ${await mosseDi()})`,
  (await mosseDi()) === mosseScavo);
await page.screenshot({ path: `${OUT}/6b-dopo-scavo.png` });
console.log(`   blocchi ${blocchiPrima} -> ${blocchiDopo}, mosse rimaste ${mosseScavo} -> ${await mosseDi()}`);

console.log('7. la mensola tiene un pezzo e te lo ridà...');
await apriPartita(3);
controlla('la mensola compare anche quando non c e niente sopra',
  await page.locator('.pl-mensola').count() === 0);
const manoPrima = await page.locator('.pl-tray .pl-pezzo-presa').count();
await page.locator('.pl-attrezzi__pastiglia').click();
await page.getByRole('button', { name: /La mensola/ }).click();
await page.waitForTimeout(150);
await page.locator('.pl-tray .pl-pezzo-presa').first().click();
await page.waitForTimeout(250);
controlla('il pezzo appoggiato non compare sulla mensola',
  await page.locator('.pl-mensola').count() === 1);
controlla(`appoggiare non ha scalato l attrezzo (ne restano ${await pieni()})`, (await pieni()) === 2);
controlla('il pezzo e rimasto anche in mano',
  await page.locator('.pl-tray .pl-pezzo-presa').count() === manoPrima - 1);
await page.screenshot({ path: `${OUT}/7-mensola.png` });

// Con la mensola occupata la voce del pannello deve essere spenta: due pezzi su una
// mensola sola non ci stanno, e un pulsante che non fa niente e peggio di uno spento.
await page.locator('.pl-attrezzi__pastiglia').click();
await page.waitForSelector('.pl-attrezzi__pannello');
controlla('con la mensola occupata la voce resta premibile',
  await page.getByRole('button', { name: /La mensola/ }).isDisabled());
await page.getByRole('button', { name: /^Torna alla partita$/ }).click();

await page.locator('.pl-mensola').click();
await page.waitForTimeout(250);
controlla('riprendere il pezzo non svuota la mensola',
  await page.locator('.pl-mensola').count() === 0);
controlla('riprendere il pezzo ha scalato un attrezzo: non deve costare niente',
  (await pieni()) === 2);
controlla('il pezzo ripreso non e tornato in mano',
  await page.locator('.pl-tray .pl-pezzo-presa').count() === manoPrima);
await page.screenshot({ path: `${OUT}/7b-ripreso.png` });

// LA MENSOLA NON DEVE RUBARE NIENTE ALLA PLANCIA.
// Segnalato da uno schermo vero: la prima versione della mensola si prendeva una
// striscia fra la plancia e i pezzi, e su un telefono quella striscia la paga il
// tabellone -- la griglia si rimpiccioliva appena si usava l'attrezzo. Un aiuto che
// come prima cosa ti restringe il tavolo da gioco e' un aiuto che costa.
console.log('8. usare la mensola non rimpicciolisce la plancia...');
for (const [larghezza, altezza] of [[360, 780], [390, 844], [412, 622]]) {
  await page.setViewportSize({ width: larghezza, height: altezza });
  await apriPartita(3);
  const plancia = () => page.evaluate(() => {
    const r = document.querySelector('.pl-plancia').getBoundingClientRect();
    return { largo: Math.round(r.width), alto: Math.round(r.height) };
  });
  const prima = await plancia();
  await page.locator('.pl-attrezzi__pastiglia').click();
  await page.getByRole('button', { name: /La mensola/ }).click();
  await page.locator('.pl-tray .pl-pezzo-presa').first().click();
  await page.waitForTimeout(300);
  const dopo = await plancia();
  const misure = await page.evaluate(() => {
    const tray = document.querySelector('.pl-tray').getBoundingClientRect();
    return {
      trayFino: Math.round(tray.bottom),
      finestra: window.innerHeight,
      scorrimento: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      mensola: document.querySelectorAll('.pl-mensola').length,
    };
  });
  await page.screenshot({ path: `${OUT}/8-mensola-${larghezza}x${altezza}.png` });
  console.log(`   ${larghezza}x${altezza}: plancia ${prima.largo}x${prima.alto} -> ${dopo.largo}x${dopo.alto}`
    + ` | mano fino a ${misure.trayFino} su ${misure.finestra} | scorrimento ${misure.scorrimento}`);
  controlla(`a ${larghezza}x${altezza} la mensola non e comparsa`, misure.mensola === 1);
  controlla(`a ${larghezza}x${altezza} usare la mensola rimpicciolisce la plancia`
    + ` (${prima.largo}x${prima.alto} -> ${dopo.largo}x${dopo.alto})`,
  dopo.largo === prima.largo && dopo.alto === prima.alto);
  controlla(`a ${larghezza}x${altezza} con la mensola piena la mano esce dallo schermo`,
    misure.trayFino <= misure.finestra);
  controlla(`a ${larghezza}x${altezza} con la mensola piena la pagina diventa scorrevole`,
    misure.scorrimento <= 1);
}
await page.setViewportSize({ width: 390, height: 844 });

// SOVRAPPOSIZIONE FRA IL PULSANTE E LA PASTIGLIA.
// Segnalato da uno schermo vero al livello 73: "Rimetti a posto il pezzo" finiva SOTTO
// la pastiglia degli attrezzi, con il testo tagliato a meta'. La pastiglia stava in
// posizione assoluta per tenere il messaggio centrato, e un elemento fuori dal flusso
// non fa spazio a nessuno. Si misura sugli schermi piu' stretti, che sono quelli dove
// i due elementi si contendono davvero i pixel.
console.log('9. il pulsante "Rimetti a posto" e la pastiglia non si sovrappongono...');
/**
 * Appoggia il primo pezzo della mano in una casella libera, provandone diverse finche'
 * una non entra. Su una griglia gia' occupata -- come quella di un livello -- la prima
 * casella vuota spesso non basta: il pezzo ci appoggia l'origine, e il resto deve
 * starci. Serve una mossa che non elimini niente, cosi' compare il "Rimetti a posto".
 */
async function mossaCheNonEliminaNiente() {
  const candidate = await page.evaluate(() => [...document.querySelectorAll('.pl-plancia .pl-cella')]
    .map((c, i) => (c.querySelector('.pl-blocco') ? -1 : i))
    .filter((i) => i >= 0));
  for (const indice of candidate) {
    const g = await page.evaluate((n) => {
      const p = document.querySelectorAll('.pl-tray .pl-pezzo')[0].getBoundingClientRect();
      const c = document.querySelectorAll('.pl-plancia .pl-cella')[n].getBoundingClientRect();
      return {
        px: p.left + p.width / 2, py: p.top + p.height / 2,
        cx: c.left + c.width / 2, cy: c.top + c.height / 2,
      };
    }, indice);
    await page.mouse.move(g.px, g.py);
    await page.mouse.down();
    await page.mouse.move(g.cx, g.cy, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(220);
    if (await page.locator('.pl-annulla').count() > 0) return true;
  }
  return false;
}

for (const larghezza of [320, 360, 390, 412]) {
  await page.setViewportSize({ width: larghezza, height: 844 });
  await apriPartita(3);
  /*
   * LA PASTIGLIA NON SI DEVE SPOSTARE.
   * Segnalata da uno schermo vero: "il loghetto degli attrezzi tende a spostarsi a
   * sinistra". La riga sotto la plancia sta in una colonna centrata, quindi senza una
   * larghezza sua si stringe attorno al proprio contenuto -- e il contenuto cambia a
   * ogni mossa: "Rimetti a posto il pezzo", "Trascina un pezzo sulla griglia", o
   * niente. La pastiglia e' agganciata al bordo destro di quella riga e le andava
   * dietro. Un bersaglio che si sposta da solo e' un bersaglio che si sbaglia.
   */
  const dovEra = await page.evaluate(() => {
    const p = document.querySelector('.pl-attrezzi__pastiglia').getBoundingClientRect();
    return Math.round(p.left);
  });
  if (!(await mossaCheNonEliminaNiente())) {
    errori.push(`SOVRAPPOSIZIONE a ${larghezza}px: non si e riusciti a far comparire il pulsante`);
    continue;
  }
  const misura = await page.evaluate(() => {
    const annulla = document.querySelector('.pl-annulla');
    const pastiglia = document.querySelector('.pl-attrezzi__pastiglia');
    if (!annulla || !pastiglia) return null;
    const a = annulla.getBoundingClientRect();
    const b = pastiglia.getBoundingClientRect();
    return {
      sovrapposizione: Math.round(Math.min(a.right, b.right) - Math.max(a.left, b.left)),
      tagliato: annulla.scrollWidth - Math.ceil(a.width),
    };
  });
  if (!misura) {
    errori.push(`SOVRAPPOSIZIONE a ${larghezza}px: non sono comparsi insieme il pulsante e la pastiglia`);
    continue;
  }
  const dovE = await page.evaluate(() => {
    const p = document.querySelector('.pl-attrezzi__pastiglia')?.getBoundingClientRect();
    return p ? Math.round(p.left) : null;
  });
  await page.screenshot({ path: `${OUT}/9-riga-${larghezza}.png` });
  console.log(`   ${larghezza}px: sovrapposizione ${misura.sovrapposizione}px, testo tagliato ${misura.tagliato}px,`
    + ` pastiglia ${dovEra} -> ${dovE}`);
  controlla(`a ${larghezza}px la pastiglia si sposta quando cambia il messaggio`
    + ` (${dovEra} -> ${dovE})`, dovE === dovEra);
  controlla(`a ${larghezza}px il pulsante e la pastiglia si sovrappongono di ${misura.sovrapposizione}px`,
    misura.sovrapposizione <= 0);
  controlla(`a ${larghezza}px il testo del pulsante e tagliato di ${misura.tagliato}px`,
    misura.tagliato <= 0);
}
await page.setViewportSize({ width: 390, height: 844 });

console.log('10. un vecchio "attrezzi: false" salvato non li spegne piu...');
await apriPartita(3, { attrezzi: false });
controlla('una vecchia impostazione "attrezzi: false" fa ancora sparire la pastiglia',
  await page.locator('.pl-attrezzi__pastiglia').count() === 1);

console.log('11. nelle impostazioni non ci sono piu interruttori per spegnere il gioco...');
await page.evaluate(() => {
  window.localStorage.removeItem('plinto:ripresa');
  window.localStorage.removeItem('plinto:partita');
  window.localStorage.removeItem('plinto:quadro-in-corso');
});
await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /^Impostazioni$/ }).click();
await page.waitForSelector('.pl-lista');
const etichette = await page.locator('.pl-lista').innerText();
await page.screenshot({ path: `${OUT}/7-impostazioni.png` });
controlla(`le impostazioni mostrano ancora un interruttore di troppo: "${etichette.replace(/\n/g, ' | ')}"`,
  !/Animazioni|Evidenzia|Attrezzi/i.test(etichette));

await browser.close();
server?.kill();

console.log('\n================ ESITO ================');
if (errori.length) {
  console.log(`${errori.length} problemi:`);
  for (const e of errori) console.log(`  - ${e}`);
  process.exit(1);
}
console.log('Nessun problema rilevato.');
