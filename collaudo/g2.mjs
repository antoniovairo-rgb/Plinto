// G2: collegamento #/sfida/<giorno> ricevuto con la scheda gia' aperta (stessa pagina, cambia solo l'ancora).
import { chromium } from 'playwright';
const URL = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'it-IT' }); const p = await c.newPage();
await p.goto(URL); await p.evaluate(()=>{localStorage.clear();localStorage.setItem('plinto:settings',JSON.stringify({versione:2,introVista:true,lingua:'it'}));});
await p.goto(URL); await p.waitForSelector('.pl-home__menu');
const s = async e => console.log(e.padEnd(34), await p.evaluate(()=>[document.querySelector('.pl-plancia')?'partita':'home', 'hash='+(location.hash||'-'), 'dialog='+document.querySelectorAll('[role=dialog]').length].join(' ')));
await s('home, nessuna partita');
await p.evaluate(()=>{location.hash='#/sfida/2026-10-10'}); await p.waitForTimeout(1500); await s('dopo cambio ancora (10-10)');
await p.evaluate(()=>{location.hash='#/sfida/2026-10-11'}); await p.waitForTimeout(1500); await s('dopo cambio ancora (10-11)');
await p.screenshot({path:'collaudo/prove/g2.png'});
await b.close();
