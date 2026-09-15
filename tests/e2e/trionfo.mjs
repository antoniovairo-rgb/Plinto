/**
 * La fine del percorso, provata nel browser.
 *
 * Le regole di quando festeggiare sono gia' provate da tests/trionfo.test.js, che le
 * interroga pure. Questo file prova la cosa che quei test non possono vedere: che il
 * gioco vero, con i progressi veri nella memoria del browser, DISEGNI la schermata
 * giusta al momento giusto. Fra una funzione che risponde "completo: true" e una festa
 * che compare c'e' tutto il cablaggio, ed e' li' che si sbaglia.
 *
 * Il metodo e' quello di tests/e2e/quadri.mjs: la sequenza vincente si calcola in Node
 * con il motore vero e si RIGIOCA trascinando i pezzi. I livelli che non si giocano si
 * scrivono direttamente nella memoria: giocarne novantanove per arrivare al centesimo
 * non proverebbe niente di piu' e ci metterebbe un'ora.
 *
 * Uso: npm run e2e-trionfo
 */

import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { quadroNumero, TOTALE_QUADRI, ATTI } from '../../src/config/quadri.js';
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../../src/core/grid.js';
import { createRng } from '../../src/core/rng.js';

const PERCORSO_NOTO = process.env.PLINTO_CHROMIUM
  ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const ESEGUIBILE = existsSync(PERCORSO_NOTO) ? PERCORSO_NOTO : undefined;
const INDIRIZZO = process.env.PLINTO_E2E_URL ?? 'http://localhost:5173/';
const OUT = process.env.PLINTO_E2E_OUT ?? '/tmp/plinto-trionfo';
await mkdir(OUT, { recursive: true });

const errori = [];

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

/** Le celle vuote senza vicine vuote: un pezzo non ci entrera' mai. */
function buchi(grid) {
  let n = 0;
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (grid[idx(r, c)] !== 0) continue;
    const vicine = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([y, x]) => y >= 0 && y < 9 && x >= 0 && x < 9);
    if (vicine.every(([y, x]) => grid[idx(y, x)] !== 0)) n += 1;
  }
  return n;
}

/** La sequenza che supera il Quadro, calcolata con il motore vero. */
function sequenzaVincente(quadro, tentativi = 40) {
  for (let prova = 0; prova < tentativi; prova += 1) {
    const rng = createRng(1000 + prova);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    let guardia = 0;
    while (guardia < (quadro.maxMosse ?? 60)) {
      if (statoQuadro(quadro, partita).finito) break;
      let migliore = null, valore = -1e9;
      partita.hand.forEach((pezzo, i) => {
        if (!pezzo) return;
        for (const [r, c] of allPlacements(partita.grid, pezzo.shape)) {
          const { grid: dopo } = placeShape(partita.grid, pezzo.shape, r, c, 1);
          const gruppi = findCompletedGroups(dopo);
          const v = gruppi.length * 400 + (gruppi.length ? 200 : 0)
            - buchi(dopo) * 16 - fillRatio(dopo) * 60 + rng.float() * 40;
          if (v > valore) { valore = v; migliore = { handIndex: i, row: r, col: c }; }
        }
      });
      if (!migliore) break;
      mosse.push(migliore);
      partita = giocaNelQuadro(quadro, partita, migliore.handIndex, migliore.row, migliore.col, guardia * 1000);
      guardia += 1;
    }
    if (statoQuadro(quadro, partita).completato) return mosse;
  }
  return null;
}

const browser = await chromium.launch({ executablePath: ESEGUIBILE });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
page.on('pageerror', (e) => errori.push(`errore di pagina: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errori.push(`console: ${m.text()}`); });

async function posizioneMossa(mossa) {
  return page.evaluate(({ handIndex, row, col }) => {
    const posto = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex];
    const pezzo = posto?.querySelector('.pl-pezzo');
    if (!pezzo) return null;
    const rp = pezzo.getBoundingClientRect();
    const cellaTray = pezzo.firstElementChild.getBoundingClientRect();
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const c0 = celle[0].getBoundingClientRect();
    const passoX = (celle[8].getBoundingClientRect().left - c0.left) / 8;
    const passoY = (celle[72].getBoundingClientRect().top - c0.top) / 8;
    const px = rp.left + rp.width / 2, py = rp.top + rp.height / 2;
    const presaX = (px - rp.left) / cellaTray.width, presaY = (py - rp.top) / cellaTray.height;
    return { px, py, cx: c0.left + col * passoX + presaX * c0.width, cy: c0.top + row * passoY + presaY * c0.height };
  }, mossa);
}

/**
 * Prepara i progressi e apre il livello 1 gia' in gioco.
 *
 * `superati` sono i numeri dei livelli da scrivere come gia' vinti. Il livello 1 resta
 * sempre fuori: e' quello che si gioca davvero, ed e' il piu' corto.
 */
async function preparaEGioca(superati) {
  await page.goto(INDIRIZZO, { waitUntil: 'networkidle' });
  await page.evaluate(({ numeri }) => {
    window.localStorage.clear();
    window.localStorage.setItem('plinto:settings', JSON.stringify({
      introVista: true, lingua: 'it', tema: 'scuro', animazioni: true, aiutoVisivo: true,
    }));
    const livelli = {};
    for (const n of numeri) livelli[n] = { mosse: 12, punteggio: 300, tentativi: 1 };
    window.localStorage.setItem('plinto:quadri', JSON.stringify({ versione: 1, livelli }));
  }, { numeri: superati });
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /^Mappa dei livelli/ }).click();
  await page.waitForSelector('.pl-tappe');
  await page.locator('.pl-tappa').nth(0).click();
  // L'apertura del Quadro spiega l'obiettivo: si parte da li'.
  const gioca = page.getByRole('button', { name: /^Gioca/ });
  if (await gioca.count() > 0) await gioca.first().click();
  await page.waitForSelector('.pl-plancia .pl-cella');
}

/** Rigioca la sequenza vincente sul livello 1 e restituisce l'esito letto a schermo. */
async function vinciIlPrimo() {
  const quadro = quadroNumero(1);
  const sequenza = sequenzaVincente(quadro);
  if (!sequenza) { errori.push('il motore non riesce a superare il livello 1: il controllo non prova nulla'); return false; }
  for (const mossa of sequenza) {
    const punti = await posizioneMossa(mossa);
    if (!punti) break;
    await page.mouse.move(punti.px, punti.py);
    await page.mouse.down();
    await page.mouse.move(punti.cx, punti.cy, { steps: 5 });
    await page.mouse.up();
    await page.waitForTimeout(45);
    if (await page.locator('.pl-quadro-esito, .pl-trionfo').count() > 0) break;
  }
  await page.waitForTimeout(400);
  return true;
}

const tutti = Array.from({ length: TOTALE_QUADRI }, (_, i) => i + 1);

// ---------- 1. Novantanove su cento: l'ultimo che manca fa la festa ----------
console.log('1. tutti i livelli superati tranne il primo: lo vinco e mi aspetto la festa finale...');
await preparaEGioca(tutti.filter((n) => n !== 1));
if (await vinciIlPrimo()) {
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/1-trionfo.png` });

  const feste = await page.locator('.pl-trionfo').count();
  if (feste !== 1) {
    errori.push(`TRIONFO: chiudendo il centesimo livello la schermata di festa non compare (trovate ${feste})`);
  } else {
    const testo = await page.locator('.pl-trionfo').innerText();

    // I numeri devono essere quelli veri. Il percorso qui e': 99 livelli scritti a 12
    // mosse + il primo giocato davvero. Non si controlla il totale esatto (dipende dalla
    // partita), si controlla che sia PLAUSIBILE e non uno zero o un NaN.
    const mosse = Number((testo.match(/(\d+)\s*\n?\s*mosse spese/i) ?? [])[1] ?? NaN);
    if (!Number.isFinite(mosse) || mosse < 99 * 12) {
      errori.push(`TRIONFO: le mosse totali a schermo sono "${mosse}", e i soli livelli scritti ne valgono ${99 * 12}`);
    }
    const livelli = Number((testo.match(/(\d+)\s*\n?\s*livelli superati/i) ?? [])[1] ?? NaN);
    if (livelli !== TOTALE_QUADRI) {
      errori.push(`TRIONFO: dice ${livelli} livelli superati invece di ${TOTALE_QUADRI}`);
    }

    // L'annuncio dei prossimi livelli c'e' e non promette date.
    if (!/in lavorazione/i.test(testo)) {
      errori.push('TRIONFO: manca l annuncio dei prossimi livelli');
    }
    if (/\b(20\d\d|presto|settiman|mes[ei])\b/i.test(testo)) {
      errori.push(`TRIONFO: la schermata promette una data. Testo: "${testo.replace(/\n/g, ' | ')}"`);
    }

    // La pioggia NON deve passare DAVANTI al testo. E' il difetto che questa schermata
    // rischia per costruzione: ventiquattro quadrati opachi che attraversano l'area dove
    // stanno il titolo e i numeri.
    //
    // COME SI MISURA, E PERCHE' NON BASTA `elementFromPoint` COSI' COM'E'. La pioggia ha
    // `pointer-events: none`, ed `elementFromPoint` quella proprieta' la RISPETTA: salta
    // l'elemento e restituisce quello sotto. Un controllo scritto in modo diretto non
    // troverebbe mai la pioggia sopra niente -- passerebbe sempre, anche con la pioggia
    // disegnata davanti a tutto. (Provato: con `pointer-events: none` il punto sul titolo
    // restituisce il titolo anche quando il velo lo copre per intero.)
    //
    // Quindi si riattiva `pointer-events` SOLO per la durata della misura: la prova di
    // collisione segue l'ordine di disegno, che e' esattamente la cosa da controllare.
    // Il tocco vero si prova subito sotto, con la regola rimessa a posto.
    const stile = await page.addStyleTag({
      content: '.pl-pioggia, .pl-pioggia__blocco { pointer-events: auto !important; }',
    });
    const davanti = [];
    for (let giro = 0; giro < 12; giro += 1) {
      davanti.push(...await page.evaluate(() => {
        const fuori = [];
        for (const sel of ['.pl-trionfo__titolo', '.pl-trionfo__sotto', '.pl-trionfo__numero']) {
          for (const el of document.querySelectorAll(sel)) {
            const r = el.getBoundingClientRect();
            for (let i = 1; i <= 9; i += 1) {
              const sopra = document.elementFromPoint(r.left + (r.width * i) / 10, r.top + r.height / 2);
              if (sopra?.closest('.pl-pioggia')) fuori.push(sel);
            }
          }
        }
        return fuori;
      }));
      await page.waitForTimeout(120);
    }
    await stile.evaluate((n) => n.remove());
    if (davanti.length) {
      errori.push(`TRIONFO: la pioggia passa DAVANTI al testo (${[...new Set(davanti)].join(', ')}): il titolo diventa illeggibile`);
    }

    // IL TESTO DEVE RESTARE LEGGIBILE SOPRA UN BLOCCO QUALSIASI.
    //
    // "La pioggia sta dietro" non basta, ed e' la lezione gia' pagata con le frasi di
    // incitamento: un quadrato pieno DIETRO una parola la rende illeggibile lo stesso se
    // i due colori non contrastano. Li' il contrasto misurato scendeva a 1,09.
    //
    // Qui non si misurano i pixel, si calcola: il velo dietro il titolo ha un'opacita'
    // nota, i sei colori dei blocchi pure, quindi il fondo peggiore possibile e' una
    // composizione esatta e il rapporto di contrasto si ricava da quella. Un calcolo non
    // dipende da dove stava un blocco nell'istante dello scatto -- cioe' non passa per
    // fortuna, che e' il difetto di ogni controllo campionato.
    const misuraLeggibilita = () => page.evaluate(() => {
      const rgba = (s) => (s.match(/[\d.]+/g) ?? []).map(Number);
      const lum = ([r, g, b]) => {
        const f = (v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const rapporto = (a, b) => {
        const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
        return (x + 0.05) / (y + 0.05);
      };
      const sopra = (fg, bg) => {
        const a = fg[3] ?? 1;
        return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)));
      };
      const radice = getComputedStyle(document.documentElement);
      const blocchi = [1, 2, 3, 4, 5, 6].map((n) => {
        const v = radice.getPropertyValue(`--pl-block-${n}`).trim();
        const m = /^#([0-9a-f]{6})$/i.exec(v);
        return m ? [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)) : null;
      }).filter(Boolean);

      const velo = rgba(getComputedStyle(document.querySelector('.pl-trionfo__intestazione')).backgroundColor);
      const peggiori = [];
      for (const sel of ['.pl-trionfo__titolo', '.pl-trionfo__sotto']) {
        const testo = rgba(getComputedStyle(document.querySelector(sel)).color);
        let peggio = Infinity, colore = null;
        for (const b of blocchi) {
          const r = rapporto(testo, sopra(velo, b));
          if (r < peggio) { peggio = r; colore = b; }
        }
        peggiori.push({ sel, rapporto: Math.round(peggio * 100) / 100, colore, velo: velo[3] ?? 1 });
      }
      return peggiori;
    });

    // SI MISURA IN TUTTI E DUE I TEMI. Il velo e i colori dei blocchi cambiano entrambi
    // fra scuro e chiaro: un velo che salva il testo sul fondo scuro non dice niente su
    // quello chiaro, e il tema chiaro in questo progetto e' gia' stato rotto una volta
    // (punteggio a 1,53:1) proprio perche' si misurava solo l'altro.
    for (const tema of ['scuro', 'chiaro']) {
      await page.evaluate((quale) => {
        if (quale === 'chiaro') document.documentElement.setAttribute('data-theme', 'chiaro');
        else document.documentElement.removeAttribute('data-theme');
      }, tema);
      for (const m of await misuraLeggibilita()) {
        console.log(`   [${tema}] ${m.sel}: contrasto peggiore sopra un blocco ${m.rapporto}:1 (velo ${m.velo})`);
        // 4.5 e' la soglia WCAG AA per il testo normale. Il titolo e' grande e potrebbe
        // cavarsela con 3, ma il sottotitolo no: si chiede la stessa cosa a entrambi.
        if (m.rapporto < 4.5) {
          errori.push(`TRIONFO [tema ${tema}]: ${m.sel} sopra un blocco arriva a ${m.rapporto}:1, sotto la soglia AA di 4.5`);
        }
      }
    }
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

    // E i tocchi devono attraversarla. Qui la regola vera e' `pointer-events: none` sulla
    // pioggia: si controlla quella, e poi si preme davvero il pulsante per vedere che la
    // pressione arrivi a destinazione. Una delle due da sola non basterebbe: la proprieta'
    // senza la pressione non dice che il pulsante funziona, la pressione senza la
    // proprieta' passerebbe anche se Playwright aggirasse un ostacolo che una dita non
    // aggira.
    const passaAttraverso = await page.evaluate(() => {
      const pioggia = document.querySelector('.pl-pioggia');
      if (!pioggia) return 'assente';
      return getComputedStyle(pioggia).pointerEvents;
    });
    if (passaAttraverso !== 'none') {
      errori.push(`TRIONFO: la pioggia intercetta i tocchi (pointer-events: ${passaAttraverso})`);
    }

    // E la condivisione deve esserci: chiudere cento livelli e' la cosa che si racconta.
    if (await page.getByRole('button', { name: /li hai finiti|racconta/i }).count() === 0) {
      errori.push('TRIONFO: manca il pulsante per condividere la fine del percorso');
    }

    // Il pulsante grande porta davvero in partita libera, premuto con la pioggia addosso.
    const bottone = page.getByRole('button', { name: /partita libera/i });
    if (await bottone.count() === 0) {
      errori.push('TRIONFO: manca il pulsante per la partita libera');
    } else {
      await bottone.first().click();
      await page.waitForTimeout(400);
      if (await page.locator('.pl-trionfo').count() > 0) {
        errori.push('TRIONFO: premendo "partita libera" non succede niente: la pioggia si e mangiata il tocco');
      }
      await page.goBack().catch(() => {});
    }
    console.log('   festa finale: mostrata, con i numeri del percorso e l annuncio.');
  }
}

// ---------- 2. Un percorso con dei buchi NON fa la festa ----------
// E' il controllo che protegge dalla bugia: al centesimo si arriva anche per insistenza.
console.log('2. novantotto livelli su cento: vinco il primo e la festa NON deve comparire...');
await preparaEGioca(tutti.filter((n) => n !== 1 && n !== 55));
if (await vinciIlPrimo()) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/2-niente-festa.png` });
  if (await page.locator('.pl-trionfo').count() > 0) {
    errori.push('TRIONFO: la festa finale compare con un livello ancora da superare. E una bugia.');
  }
  if (await page.locator('.pl-quadro-esito').count() === 0) {
    errori.push('TRIONFO: senza festa non compare nemmeno la schermata di esito normale');
  }
}

// ---------- 3. La fascia dell'atto chiuso ----------
const primoAtto = ATTI[0];
console.log(`3. tutto il primo atto ("${primoAtto.nome}") tranne il primo livello: mi aspetto la fascia...`);
await preparaEGioca(tutti.filter((n) => n > 1 && n <= primoAtto.a));
if (await vinciIlPrimo()) {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/3-atto-chiuso.png` });
  const fasce = await page.locator('.pl-atto-chiuso').count();
  if (fasce !== 1) {
    errori.push(`ATTO: chiudendo "${primoAtto.nome}" la fascia non compare (trovate ${fasce})`);
  } else {
    const testo = await page.locator('.pl-atto-chiuso').innerText();
    if (!testo.includes(primoAtto.nome)) {
      errori.push(`ATTO: la fascia non nomina l atto. Dice: "${testo.replace(/\n/g, ' | ')}"`);
    }
    console.log(`   fascia dell atto: "${testo.replace(/\n/g, ' | ')}"`);

    // I pallini degli atti. Chiudendo il PRIMO ne deve essere acceso esattamente uno:
    // se ne accendesse sette, la fascia direbbe a chi ha appena finito i primi dieci
    // livelli che ha finito tutto il percorso.
    const pallini = await page.locator('.pl-atto-chiuso__pallino').count();
    const accesi = await page.locator('.pl-atto-chiuso__pallino--acceso').count();
    if (pallini !== ATTI.length) {
      errori.push(`ATTO: i pallini degli atti sono ${pallini}, gli atti sono ${ATTI.length}`);
    }
    if (accesi !== 1) {
      errori.push(`ATTO: chiudendo il primo atto i pallini accesi sono ${accesi} invece di 1`);
    }
    // La frase dell'atto c'e' e non e' la chiave grezza.
    if (/quadri\.attoFrasi/.test(testo)) {
      errori.push(`ATTO: la fascia mostra la chiave di traduzione invece della frase: "${testo}"`);
    }
    if (await page.locator('.pl-atto-chiuso__frase').count() !== 1) {
      errori.push('ATTO: manca la frase che dice che cosa ha chiesto l atto');
    }
  }
  if (await page.locator('.pl-trionfo').count() > 0) {
    errori.push('ATTO: chiudere un atto mostra la festa finale. Sono due traguardi diversi.');
  }
}

// ---------- 4. Rigiocare dentro un atto gia chiuso non rifesteggia ----------
console.log('4. rigioco il primo livello con l atto gia chiuso: la fascia NON deve tornare...');
await preparaEGioca(tutti.filter((n) => n <= primoAtto.a));
if (await vinciIlPrimo()) {
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/4-niente-bis.png` });
  const fasce = await page.locator('.pl-atto-chiuso').count();
  if (fasce !== 0) {
    errori.push('ATTO: la fascia torna rigiocando un livello di un atto gia chiuso. Non e successo niente di nuovo.');
  }
}

await browser.close();
if (server) server.kill();

if (errori.length) {
  console.error(`\n${errori.length} problemi:`);
  errori.forEach((e) => console.error(` - ${e}`));
  process.exit(1);
}
console.log(`\nTutto a posto. Immagini in ${OUT}`);
