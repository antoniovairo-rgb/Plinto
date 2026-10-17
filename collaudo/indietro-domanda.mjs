// Indietro (popstate, come il tasto di Android) con la domanda aperta, nei tre casi.
import { chromium } from 'playwright';
const URL = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function nuova() { const c = await b.newContext({viewport:{width:390,height:844},locale:'it-IT'}); const p = await c.newPage(); await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('plinto:settings',JSON.stringify({versione:2,introVista:true,lingua:'it'}));}); await p.goto(URL); await p.waitForSelector('.pl-home__menu'); return p; }
const dove = p => p.evaluate(()=>[document.querySelector('.pl-plancia')?'partita':document.querySelector('.pl-apertura')?'obiettivo':document.querySelector('.pl-tappe')?'mappa':'home', 'dialog='+document.querySelectorAll('[role=dialog]').length, location.hash||'-'].join(' '));
async function mossa(p) { const q = await p.evaluate(()=>{const z=document.querySelector('.pl-tray .pl-pezzo');const c=[...document.querySelectorAll('.pl-plancia .pl-cella')];const r=z.getBoundingClientRect(),s=c[40].getBoundingClientRect();return{a:r.left+r.width/2,b:r.top+r.height/2,c:s.left+s.width/2,d:s.top+s.height/2}}); await p.mouse.move(q.a,q.b);await p.mouse.down();await p.mouse.move(q.c,q.d,{steps:5});await p.mouse.up();await p.waitForTimeout(300); }
const salv = p => p.evaluate(()=>['partita-quadro','partita-sfida'].map(k=>k+'='+(localStorage.getItem('plinto:'+k)?'si':'no')).join(' '));
// K: Riprova
{ const p = await nuova(); await p.getByRole('button',{name:/Mappa dei livelli/}).click(); await p.locator('.pl-tappa').first().click(); await p.getByRole('button',{name:/^Gioca$/}).click(); await p.waitForSelector('.pl-plancia .pl-cella'); await mossa(p);
  await p.locator('button[aria-label*="enu"], .pl-btn-menu').first().click().catch(()=>{}); await p.getByRole('button',{name:/Riprova/}).click().catch(e=>console.log('K: Riprova non trovato')); await p.waitForTimeout(300);
  console.log('K domanda aperta   ', await dove(p)); await p.goBack(); await p.waitForTimeout(400); console.log('K dopo 1 Indietro  ', await dove(p), await salv(p));
  await p.goBack(); await p.waitForTimeout(400); console.log('K dopo 2 Indietro  ', await dove(p), await salv(p)); }
await b.close();
