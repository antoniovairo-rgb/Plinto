/**
 * Le frasi di incitamento, viste dal browser.
 *
 * La SCELTA del messaggio e' provata senza browser in tests/incitamenti.test.js, dove
 * costa millisecondi. Qui si prova l'altra meta', quella che un test unitario non puo'
 * vedere: che la frase compaia davvero sopra la griglia, che non copra il tocco delle
 * caselle, che non faccia cambiare misura alla plancia, e che non si presenti mai
 * insieme al pulsante "rimetti a posto", con cui divide la stessa zona di schermo.
 *
 * Uso: npm run incitamenti
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const RITRATTI = new URL('../../store/prove/', import.meta.url).pathname;

async function serverRisponde() {
  try {
    const r = await fetch(INDIRIZZO, { signal: AbortSignal.timeout(1500) });
    return r.ok;
  } catch { return false; }
}

let server = null;
if (!(await serverRisponde())) {
  const { spawn } = await import('node:child_process');
  server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '5173'], {
    cwd: new URL('../..', import.meta.url).pathname, stdio: 'ignore', detached: false,
  });
  for (let i = 0; i < 30 && !(await serverRisponde()); i += 1) {
    await new Promise((r) => setTimeout(r, 1000));
  }
  if (!(await serverRisponde())) {
    console.error('Impossibile avviare il server di sviluppo su', INDIRIZZO);
    process.exit(1);
  }
}

const errori = [];
const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 400, height: 756 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
// La console va ascoltata, come negli altri controlli nel browser. Senza, questo
// scenario e' passato mentre l'elemento nuovo condivideva la chiave React con i punti
// volanti: 591 avvisi, tre ALTRI controlli caduti, e questo -- che guardava proprio
// quell'elemento -- che diceva "tutto bene". Un controllo che non sente gli avvisi
// certifica il pezzo di schermo che sta rompendo.
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
await page.evaluate(() => {
  window.localStorage.clear();
  window.localStorage.setItem('plinto:settings', JSON.stringify({
    introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
  }));
});
await page.reload({ waitUntil: 'networkidle' });
await page.locator('.pl-home__azioni .pl-sfida-avvio').nth(1).click();
await page.waitForSelector('.pl-plancia');

const misuraPlancia = async () => page.evaluate(() => {
  const r = document.querySelector('.pl-plancia').getBoundingClientRect();
  return { l: Math.round(r.width), a: Math.round(r.height) };
});

/**
 * Posa il pezzo `i` toccando la casella `n`, con i DUE TOCCHI e non col trascinamento.
 *
 * Trascinando, dove il pezzo atterra dipende da dove lo si e' preso col dito: prenderlo
 * al centro e lasciarlo su una casella non lo mette con l'angolo li'. Coi due tocchi la
 * regola e' una formula sola, `origineDaCella`, e si puo' puntare la casella esatta.
 * E' anche il modo in cui gioca chi non trascina, quindi non e' una scorciatoia da
 * controllo: e' una delle due strade vere per giocare.
 */
async function prova(i, n) {
  const prima = await page.locator('.pl-plancia .pl-blocco').count();
  const pezzo = page.locator('.pl-tray .pl-pezzo').nth(i);
  if (!(await pezzo.count())) return false;
  await pezzo.click();
  await page.locator('.pl-plancia .pl-cella').nth(n).click();
  await page.waitForTimeout(90);
  const dopo = await page.locator('.pl-plancia .pl-blocco').count();
  return dopo !== prima;
}

/**
 * Sceglie una mossa leggendo la griglia e le forme dei pezzi dalla pagina.
 *
 * PERCHE' NON SI TIRA A INDOVINARE. La prima stesura provava a trascinare i pezzi su
 * caselle scelte a caso e teneva quelle che attaccavano. Piazzando a caso pero' la
 * partita muore dopo undici pose e le eliminazioni sono rarissime: in quattrocento
 * tentativi non ne usciva nessuna, cioe' il controllo girava a lungo per non provare
 * niente. La seconda provava le caselle libere in ordine, una per una, col mouse: le
 * eliminazioni arrivavano ma ogni mossa costava decine di trascinamenti e il controllo
 * non finiva piu'.
 *
 * La forma di un pezzo e' leggibile dal DOM -- il riquadro e' una griglia CSS e le celle
 * piene contengono un blocco -- e cosi' la griglia. Quindi dove un pezzo entra si puo'
 * CALCOLARE, e di trascinamenti ne basta uno per mossa. Fra le pose possibili si
 * preferisce quella che chiude qualcosa: e' quella che fa comparire la frase, cioe' la
 * cosa che questo controllo deve guardare.
 */
const scegliMossa = (cercaChiusura = true) => page.evaluate((cerca) => {
  const LATO = 9;
  const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
  if (celle.length !== LATO * LATO) return null;
  const pieno = celle.map((c) => !!c.querySelector('.pl-blocco'));

  const forme = [...document.querySelectorAll('.pl-tray .pl-pezzo')].map((nodo) => {
    const colonne = getComputedStyle(nodo).gridTemplateColumns.split(' ').filter(Boolean).length;
    const riquadro = [...nodo.children];
    const punti = [];
    riquadro.forEach((c, i) => {
      if (c.querySelector('.pl-blocco')) punti.push([Math.floor(i / colonne), i % colonne]);
    });
    return { colonne, righe: riquadro.length / colonne, punti };
  });

  const quadrante = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

  /** Quante righe, colonne e quadranti si chiuderebbero con questa posa. */
  function chiusure(dopo) {
    let n = 0;
    for (let r = 0; r < LATO; r += 1) {
      let tutta = true;
      for (let c = 0; c < LATO; c += 1) if (!dopo[r * LATO + c]) { tutta = false; break; }
      if (tutta) n += 1;
    }
    for (let c = 0; c < LATO; c += 1) {
      let tutta = true;
      for (let r = 0; r < LATO; r += 1) if (!dopo[r * LATO + c]) { tutta = false; break; }
      if (tutta) n += 1;
    }
    for (let q = 0; q < LATO; q += 1) {
      let tutto = true;
      const r0 = Math.floor(q / 3) * 3; const c0 = (q % 3) * 3;
      for (let r = r0; r < r0 + 3 && tutto; r += 1) {
        for (let c = c0; c < c0 + 3; c += 1) if (!dopo[r * LATO + c]) { tutto = false; break; }
      }
      if (tutto) n += 1;
    }
    return n;
  }

  let migliore = null;
  forme.forEach((forma, iPezzo) => {
    for (let r = 0; r + forma.righe <= LATO; r += 1) {
      for (let c = 0; c + forma.colonne <= LATO; c += 1) {
        const bersagli = forma.punti.map(([dr, dc]) => (r + dr) * LATO + (c + dc));
        if (bersagli.some((i) => pieno[i])) continue;
        const dopo = pieno.slice();
        bersagli.forEach((i) => { dopo[i] = true; });
        const quante = chiusure(dopo);
        // A parita' di chiusure si sta in alto a sinistra: la griglia si riempie in
        // ordine e le righe si completano da sole, invece di sparpagliarsi e morire.
        // Con `cerca` si punta alla mossa che chiude di piu'; senza, a quella che non
        // chiude niente. Serve il secondo caso per far comparire il "rimetti a posto":
        // giocando solo bene il pulsante non si vede mai, e la parte di scenario che lo
        // riguarda passerebbe senza aver provato nulla.
        const voto = (cerca ? quante : -quante) * 1000 - (r * LATO + c);
        if (!migliore || voto > migliore.voto) {
          // `origineDaCella` in useTrascinamento.js centra il pezzo sulla casella
          // toccata: per farlo atterrare con l'angolo in (r, c) va toccata la casella
          // spostata di mezza forma. La formula e' ricopiata da li'.
          const tr = r + Math.floor((forma.righe - 1) / 2);
          const tc = c + Math.floor((forma.colonne - 1) / 2);
          migliore = { voto, pezzo: iPezzo, chiude: quante, tocco: tr * LATO + tc };
        }
      }
    }
  });
  return migliore;
}, cercaChiusura);

/**
 * Gioca una mossa. Un solo trascinamento: il punto di rilascio e' la casella che
 * ricevera' la PRIMA cella del pezzo, che e' anche quella che il dito tiene.
 */
async function unaMossa(cercaChiusura = true) {
  const scelta = await scegliMossa(cercaChiusura);
  if (!scelta) return false;
  return prova(scelta.pezzo, scelta.tocco);
}

/** Se la partita e' finita, ne comincia un'altra. */
async function riparti() {
  if (!(await page.locator('.pl-screen--fine').count())) return false;
  await page.locator('.pl-fine__azioni button').first().click();
  await page.waitForSelector('.pl-plancia');
  return true;
}

const plunaPrima = await misuraPlancia();
let visti = 0;
let sovrapposizioni = 0;
let primoRitratto = false;
const fraseViste = new Set();
const livelliVisti = new Set();

/**
 * Si gioca a caso finche' non capita una eliminazione.
 *
 * DOPO OGNI FRASE SI ASPETTA CHE SPARISCA. La prima stesura non lo faceva e rileggeva
 * sei volte lo STESSO elemento ancora acceso -- la frase dura 1250ms, il giro del ciclo
 * 70 -- concludendo che il gioco ripeteva sempre la stessa parola. Non era vero: era il
 * controllo a guardare sempre la stessa. Un test che conta due volte la stessa cosa non
 * misura di piu', misura un'altra cosa.
 */
for (let giro = 0; giro < 160 && visti < 8; giro += 1) {
  if (await riparti()) continue;
  if (!(await unaMossa())) continue;

  // La frase entra dopo i punti, non insieme (ATTESA_INCITAMENTO in src/feel/durate.js):
  // leggerla subito dopo la mossa significherebbe leggere lo schermo prima che compaia,
  // e concludere che non compare mai.
  await page.waitForSelector('.pl-incitamento', { timeout: 1500 }).catch(() => {});

  const stato = await page.evaluate(() => {
    const nodo = document.querySelector('.pl-incitamento');
    if (!nodo) return { c: false };
    const s = getComputedStyle(nodo);
    const r = nodo.getBoundingClientRect();
    const p = document.querySelector('.pl-plancia').getBoundingClientRect();
    const b = document.querySelector('.pl-annulla')?.getBoundingClientRect() ?? null;
    return {
      c: true,
      testo: nodo.textContent.trim(),
      tocco: s.pointerEvents,
      // Il velo dietro il testo. Non e' un gusto: sopra i blocchi nessun colore di
      // testo arriva al contrasto richiesto (misurato: da 1,09 a 3,63), quindi senza
      // fondo la frase sparisce proprio quando capita sulla parte piena della griglia.
      fondo: s.backgroundColor,
      livello: (/--l(\d)/.exec(nodo.className) ?? [])[1] ?? '?',
      dentro: r.left >= p.left - 1 && r.right <= p.right + 1
              && r.top >= p.top - 1 && r.bottom <= p.bottom + 1,
      larghezza: Math.round(r.width), altezza: Math.round(r.height),
      // La frase sta sulla plancia e il pulsante sotto: convivono senza problemi, ma
      // se un giorno si toccassero sarebbe di nuovo il difetto della 1.8.0, cioe' un
      // comando coperto da qualcosa di decorativo.
      addosso: b ? !(r.right < b.left || r.left > b.right || r.bottom < b.top || r.top > b.bottom) : false,
    };
  });
  if (!stato.c) continue;

  visti += 1;
  fraseViste.add(stato.testo);
  livelliVisti.add(stato.livello);
  console.log(`  "${stato.testo}"  livello ${stato.livello}  ${stato.larghezza}x${stato.altezza}px  dentro la plancia: ${stato.dentro}  tocco: ${stato.tocco}  velo: ${stato.fondo}`);

  const trasparente = /rgba\(0,\s*0,\s*0,\s*0\)|transparent/.test(stato.fondo ?? '');
  if (trasparente) {
    errori.push(`La frase "${stato.testo}" non ha il velo dietro (${stato.fondo}): sopra i blocchi diventa illeggibile`);
  }
  if (stato.tocco !== 'none') {
    errori.push(`La frase intercetta il tocco (pointer-events: ${stato.tocco}): copre le caselle sotto`);
  }
  if (!stato.dentro) {
    errori.push(`La frase "${stato.testo}" esce dai bordi della plancia (${stato.larghezza}x${stato.altezza})`);
  }
  if (stato.addosso) sovrapposizioni += 1;

  const ora = await misuraPlancia();
  if (ora.l !== plunaPrima.l || ora.a !== plunaPrima.a) {
    errori.push(`La plancia cambia misura quando compare la frase: ${plunaPrima.l}x${plunaPrima.a} -> ${ora.l}x${ora.a}`);
  }

  if (!primoRitratto) {
    mkdirSync(RITRATTI, { recursive: true });
    await page.screenshot({ path: `${RITRATTI}incitamento.png` });
    primoRitratto = true;
  }

  // Si aspetta che la frase si spenga, cosi' il giro dopo ne guarda una nuova.
  await page.waitForSelector('.pl-incitamento', { state: 'detached', timeout: 4000 })
    .catch(() => errori.push('La frase non sparisce da sola entro quattro secondi'));
}

console.log(`\nfrasi viste: ${visti}  |  diverse fra loro: ${fraseViste.size}  |  livelli: ${[...livelliVisti].sort().join(', ')}`);
console.log(`frasi sovrapposte al pulsante: ${sovrapposizioni}`);
if (visti < 4) errori.push(`Solo ${visti} frasi in 160 mosse: lo scenario non prova quello che dice`);
if (sovrapposizioni > 0) errori.push(`La frase si e sovrapposta al pulsante "rimetti a posto" ${sovrapposizioni} volte`);
// Con quattro frasi della stessa categoria, vederle tutte uguali vorrebbe dire che il
// sorteggio delle varianti non gira: e' il difetto che rende un complimento un tic.
if (visti >= 4 && fraseViste.size < 2) {
  errori.push(`Tutte e ${visti} le frasi erano identiche ("${[...fraseViste][0]}"): le varianti non vengono sorteggiate`);
}

// Il pulsante, fotografato: e' l'altra meta' di questa riga di schermo.
let pulsanteVisto = false;
for (let giro = 0; giro < 40 && !pulsanteVisto; giro += 1) {
  if (await riparti()) continue;
  if (!(await unaMossa(false))) continue;    // una mossa che non chiude niente
  await page.waitForTimeout(2100);           // l'eventuale frase entra e se ne va
  if (!(await page.locator('.pl-annulla').count())) continue;
  pulsanteVisto = true;
  mkdirSync(RITRATTI, { recursive: true });
  await page.screenshot({ path: `${RITRATTI}rimetti-a-posto.png` });
  const segno = await page.locator('.pl-annulla__segno').count();
  const frase = await page.locator('.pl-incitamento').count();
  console.log(`pulsante fotografato, con il suo segno: ${segno === 1}, frase a schermo: ${frase}`);
  if (segno !== 1) errori.push('Il pulsante non mostra il suo simbolo');
}
if (!pulsanteVisto) {
  errori.push('Il pulsante "rimetti a posto" non e mai comparso: questa parte dello scenario non ha provato niente');
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error('\nPROBLEMI:');
  errori.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('\nOk: le frasi compaiono sulla plancia, non coprono il tocco e non si scontrano col pulsante.');
