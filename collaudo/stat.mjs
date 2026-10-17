// D4 in produzione: media dei punteggi con molte partite, it/en, 360x640 e 390x844.
import { chromium } from 'playwright';
const URL = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const casi = [[1000, 5_000_000, '5000'], [3, 4500, '1500'], [1234, 987_654_321, '800044'], [0, 0, '']];
for (const [l, loc] of [['it','it-IT'],['en','en-US']]) for (const [w,h] of [[360,640],[390,844]]) for (const [n, tot, atteso] of casi) {
  const c = await b.newContext({ viewport:{width:w,height:h}, locale: loc }); const p = await c.newPage();
  await p.goto(URL); await p.evaluate(([l,n,tot])=>{localStorage.clear();localStorage.setItem('plinto:settings',JSON.stringify({versione:2,introVista:true,lingua:l}));
    localStorage.setItem('plinto:statistiche',JSON.stringify({versione:1,partite:n,punteggioTotale:tot,mosseTotali:n*10,gruppiTotali:n,griglieSvuotate:0,tempoTotaleMs:n*60000}));},[l,n,tot]);
  await p.goto(URL); await p.waitForSelector('.pl-home__menu');
  await p.getByRole('button',{name: l==='it'?/Statistiche/:/Statistics|Stats/}).first().click(); await p.waitForTimeout(500);
  const t = (await p.locator('body').innerText()).replace(/\s+/g,' ');
  const m = /(Punteggio medio|Average score)\s+([^\s]+(?: [^\s]+)?)/.exec(t);
  console.log(l, w+'x'+h, 'partite', n, 'totale', tot, '-> media mostrata:', m?.[2] ?? '(assente)', ' attesa', atteso, /NaN|Infinity/.test(t)?'  *** NaN/Infinity ***':'', 'scroll-x:', await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth));
  if (n===1000) await p.screenshot({path:`collaudo/prove/stat-${l}-${w}x${h}.png`});
  await c.close();
}
await b.close();
