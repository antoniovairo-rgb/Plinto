// Voci «Recensisci» e «Scarica l'app»: quando compaiono e dove portano.
import { apri, testo, shot, overflow, LOCALE } from './lib.mjs';
const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const voci = (page) => page.$$eval('.pl-home a, .pl-home button', (n) => n.map((b) => `${b.tagName}:${b.innerText.replace(/\n/g, ' ').trim()}${b.href ? '→' + b.href : ''}${b.target ? ' target=' + b.target : ''}${b.rel ? ' rel=' + b.rel : ''}`).filter((x) => /Recensisci|Review|Scarica|Download|Play/i.test(x)));
const casi = [
  ['desktop senza segnali', {}, ''],
  ['desktop ?origine=play', {}, '?origine=play'],
  ['Android UA browser', { ua: UA_ANDROID }, ''],
  ['Android UA + ?origine=play', { ua: UA_ANDROID }, '?origine=play'],
  ['?origine=altro', {}, '?origine=altro'],
];
for (const [nome, o, q] of casi) {
  for (const vp of [{ width: 360, height: 640 }]) {
    const { browser, page, errori } = await apri({ url: LOCALE + q, viewport: vp, ua: o.ua, storage: { settings: { versione: 1, introVista: true } } });
    console.log(`\n== ${nome}`, JSON.stringify(await voci(page)));
    const sc = await page.evaluate(() => ({ sh: document.documentElement.scrollHeight, ch: innerHeight }));
    console.log('  scorrimento home:', sc.sh, '/', sc.ch, 'overflow:', (await overflow(page)).filter((x) => !/pl-sr/.test(x)));
    await shot(page, 'play-' + nome.replace(/\W+/g, '_'));
    if (q) { await page.goto(LOCALE); await page.waitForTimeout(400); console.log('  ricaricata senza parametro:', JSON.stringify(await voci(page))); }
    console.log('  errori', errori);
    await browser.close();
  }
}
// Invito a recensire a fine atto: pronto con origine=play e 10 livelli superati
const livelli = {}; for (let k = 1; k <= 9; k += 1) livelli[k] = { mosse: 20, punteggio: 100, tentativi: 1 };
const { browser, page, errori } = await apri({ url: LOCALE + '?origine=play', storage: { settings: { versione: 1, introVista: true }, quadri: { versione: 1, livelli } } });
console.log('\n(da fare a mano: vittoria del livello 10 per l\'invito di fine atto)');
await browser.close();
