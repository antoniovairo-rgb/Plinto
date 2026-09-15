/**
 * Il salvataggio che esce e rientra, provato nel browser vero.
 *
 * Le regole di fusione sono gia' provate da tests/salvataggio.test.js, che le interroga
 * direttamente. Qui si prova la cosa che quei test non possono vedere: che premendo i
 * pulsanti veri, in una pagina vera, il giro completo funzioni. Fra una funzione che
 * restituisce l'oggetto giusto e un salvataggio che torna indietro ci sono il campo da
 * incollare, la lettura del file, la conferma e la scrittura -- ed e' li' che si sbaglia.
 *
 * IL GIRO CHE CONTA: si superano dei livelli, si esporta, si cancella tutto come farebbe
 * chi svuota i dati del browser, si reimporta, e i livelli devono tornare. E' esattamente
 * la situazione per cui questa funzionalita' esiste.
 *
 * Uso: npm run e2e-salvataggio
 */
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-salvataggio';
await mkdir(OUT, { recursive: true });

const errori = [];
const controlla = (cosa, condizione) => { if (!condizione) errori.push(cosa); };

async function serverRisponde() {
  try { return (await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) })).ok; }
  catch { return false; }
}
let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore',
  });
  const scadenza = Date.now() + 30000;
  while (Date.now() < scadenza && !(await serverRisponde())) await new Promise((r) => setTimeout(r, 400));
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

/** Scrive dei progressi finti e apre le impostazioni. */
async function preparaEApri(livelli) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(({ voci }) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: false, aiutoVisivo: true,
    }));
    const l = {};
    for (const [n, mosse] of voci) l[n] = { mosse, punteggio: 100 + n, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli: l }));
  }, { voci: livelli });
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Impostazioni/ }).click();
  await page.waitForSelector('.pl-lista');
}

const quantiSuperati = () => page.evaluate(() => {
  const d = JSON.parse(window.localStorage.getItem('plinto:quadri') ?? '{}');
  return Object.values(d.livelli ?? {}).filter((v) => Number.isFinite(v?.mosse)).length;
});

// ---------- 1. Il giro completo: esporta, cancella, reimporta ----------
console.log('1. dieci livelli, esporto, cancello tutto, reimporto...');
await preparaEApri([[1, 9], [2, 10], [3, 11], [4, 12], [5, 13], [6, 14], [7, 15], [8, 16], [9, 17], [10, 18]]);

// Si usa la via degli appunti perche' e' quella che si puo' leggere da qui: il download
// finisce in un file che il browser di prova gestisce a parte. Il pulsante che scarica ha
// il suo controllo piu' sotto.
await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
await page.getByRole('button', { name: /^Copia il testo$/ }).click();
await page.waitForTimeout(200);
const esportato = await page.evaluate(() => navigator.clipboard.readText());
controlla('la copia negli appunti non ha prodotto niente', esportato.length > 100);
controlla('il salvataggio copiato non e un file di PLINTO', /"gioco"\s*:\s*"plinto"/.test(esportato));

await page.screenshot({ path: `${OUT}/1-impostazioni.png` });

// Come chi ha svuotato i dati del sito: nessun livello. La guida del primo avvio, che
// una cancellazione vera farebbe ricomparire, qui si salta: non e' quello che si sta
// provando, e ha gia' il suo controllo tutto suo.
await preparaEApri([]);
controlla('dopo la cancellazione risultano ancora dei livelli', (await quantiSuperati()) === 0);

await page.getByRole('button', { name: /incolla qui/i }).click();
await page.locator('textarea').fill(esportato);
await page.getByRole('button', { name: /^Leggi$/ }).click();
await page.waitForTimeout(200);
const riassunto = await page.locator('.pl-nota').allInnerTexts();
controlla(`il riassunto non dice quanti livelli ci sono nel file: ${riassunto.join(' | ')}`,
  riassunto.some((r) => /10 livelli superati/.test(r)));
await page.screenshot({ path: `${OUT}/2-letto.png` });

await page.getByRole('button', { name: /^Unisci/ }).click();
await page.waitForTimeout(200);
controlla(`dopo l importazione i livelli non sono tornati (${await quantiSuperati()})`,
  (await quantiSuperati()) === 10);
await page.screenshot({ path: `${OUT}/3-tornati.png` });

// ---------- 2. Un file vecchio NON cancella progressi piu recenti ----------
console.log('2. importo un file con tre livelli su un telefono che ne ha dieci...');
await preparaEApri([[1, 20], [2, 21], [3, 22]]);
await page.getByRole('button', { name: /^Copia il testo$/ }).click();
await page.waitForTimeout(200);
const fileCorto = await page.evaluate(() => navigator.clipboard.readText());

await preparaEApri([[1, 9], [2, 10], [3, 11], [4, 12], [5, 13], [6, 14], [7, 15], [8, 16], [9, 17], [10, 18]]);
await page.getByRole('button', { name: /incolla qui/i }).click();
await page.locator('textarea').fill(fileCorto);
await page.getByRole('button', { name: /^Leggi$/ }).click();
await page.getByRole('button', { name: /^Unisci/ }).click();
await page.waitForTimeout(200);
controlla(`unendo un file piu povero i livelli sono scesi a ${await quantiSuperati()}`,
  (await quantiSuperati()) === 10);
const mosseUno = await page.evaluate(() => JSON.parse(window.localStorage.getItem('plinto:quadri')).livelli[1].mosse);
controlla(`del livello 1 non e rimasto il risultato migliore (${mosseUno} invece di 9)`, mosseUno === 9);

// ---------- 3. Un file rovinato viene rifiutato, e lo dice ----------
console.log('3. incollo un salvataggio manomesso...');
await preparaEApri([[1, 9]]);
await page.getByRole('button', { name: /incolla qui/i }).click();
await page.locator('textarea').fill(fileCorto.replace(/"mosse":\s*20/, '"mosse": 1'));
await page.getByRole('button', { name: /^Leggi$/ }).click();
await page.waitForTimeout(200);
const allarme = await page.locator('.pl-nota--allarme').count();
controlla('un salvataggio manomesso non viene segnalato', allarme > 0);
controlla('un salvataggio manomesso e stato importato lo stesso', (await quantiSuperati()) === 1);
await page.screenshot({ path: `${OUT}/4-rifiutato.png` });

// ---------- 4. Azzerare tutto chiede DUE conferme, e dice che cosa cancella ----------
// E' l'azione piu' distruttiva del gioco: toglie livelli, record, statistiche, profilo,
// archivio delle sfide e partita in corso. Stava dietro un tocco solo, e l'avviso
// ometteva proprio i livelli.
console.log('4. azzera i miei dati: due conferme e l elenco di cosa sparisce...');
await preparaEApri([[1, 9], [2, 10], [3, 11]]);
await page.getByRole('button', { name: /^Azzera i miei dati$/ }).click();
await page.waitForTimeout(200);

controlla('la conferma non compare come finestra sospesa', await page.locator('.pl-velo .pl-azzera').count() === 1);
const elenco = await page.locator('.pl-azzera__voce').allInnerTexts();
controlla(`l elenco non dice quanti livelli si perdono: ${elenco.join(' / ')}`,
  elenco.some((r) => /Livelli superati/.test(r) && /\b3\b/.test(r)));
await page.screenshot({ path: `${OUT}/5-azzera-1.png` });

// Ci si tira indietro al primo passo: non deve succedere niente.
await page.getByRole('button', { name: /^No$/ }).click();
await page.waitForTimeout(150);
controlla('annullando al primo passo i livelli sono spariti lo stesso', (await quantiSuperati()) === 3);

// Secondo passo, e ci si tira indietro anche li'.
await page.getByRole('button', { name: /^Azzera i miei dati$/ }).click();
await page.getByRole('button', { name: /^Sì$/ }).click();
await page.waitForTimeout(150);
const secondo = await page.getByRole('button', { name: /^Sì, azzera tutto$/ }).count();
controlla('manca la SECONDA conferma: basta un tocco per cancellare tutto', secondo === 1);
await page.screenshot({ path: `${OUT}/6-azzera-2.png` });
if (secondo === 1) {
  await page.getByRole('button', { name: /^No$/ }).click();
  await page.waitForTimeout(150);
  controlla('annullando alla seconda conferma i livelli sono spariti lo stesso', (await quantiSuperati()) === 3);

  // E adesso fino in fondo.
  await page.getByRole('button', { name: /^Azzera i miei dati$/ }).click();
  await page.getByRole('button', { name: /^Sì$/ }).click();
  await page.getByRole('button', { name: /^Sì, azzera tutto$/ }).click();
  await page.waitForTimeout(300);
  controlla(`dopo l azzeramento restano ${await quantiSuperati()} livelli`, (await quantiSuperati()) === 0);
}

// ---------- 5. Il pulsante che scarica produce davvero un file ----------
console.log('5. il pulsante che scarica...');
await preparaEApri([[1, 9]]);
const scaricato = await Promise.race([
  page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
  page.getByRole('button', { name: /^Scarica il file$/ }).click().then(() => null),
]) ?? await page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
controlla('il pulsante non avvia nessun download', scaricato !== null);
if (scaricato) {
  controlla(`il file scaricato ha un nome strano: ${scaricato.suggestedFilename()}`,
    /^plinto-salvataggio-\d{4}-\d{2}-\d{2}\.json$/.test(scaricato.suggestedFilename()));
}

await browser.close();
if (server) server.kill();

console.log('\n================ ESITO ================');
if (errori.length) {
  console.log(`${errori.length} problemi:`);
  for (const e of errori) console.log(`  - ${e}`);
  process.exit(1);
}
console.log('Nessun problema rilevato.');
