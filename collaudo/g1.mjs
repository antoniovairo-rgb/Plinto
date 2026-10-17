// Sfida di oggi a meta' + collegamento a un altro giorno: che cosa vede il giocatore?
import { chromium } from 'playwright';
const URL = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const c = await b.newContext({ viewport: { width: 390, height: 844 }, locale: 'it-IT' });
const p = await c.newPage();
await p.goto(URL); await p.evaluate(()=>{localStorage.clear();localStorage.setItem('plinto:settings',JSON.stringify({versione:2,introVista:true,lingua:'it'}));});
await p.goto(URL); await p.waitForSelector('.pl-home__menu');
await p.locator('.pl-sfida-avvio--sfida').click(); await p.waitForSelector('.pl-plancia .pl-cella');
for (let i=0;i<2;i++){ const q=await p.evaluate((i)=>{const z=document.querySelector('.pl-tray .pl-pezzo');const c=[...document.querySelectorAll('.pl-plancia .pl-cella')];const r=z.getBoundingClientRect(),s=c[40+i*3||40].getBoundingClientRect();return{a:r.left+r.width/2,b:r.top+r.height/2,c:s.left+s.width/2,d:s.top+s.height/2}},i); await p.mouse.move(q.a,q.b);await p.mouse.down();await p.mouse.move(q.c,q.d,{steps:5});await p.mouse.up();await p.waitForTimeout(300);}
const stato = async (e)=>console.log(e.padEnd(40), await p.evaluate(()=>[location.hash, document.querySelector('.pl-plancia')?'partita':document.querySelector('.pl-home')?'home':'?', document.querySelectorAll('[role=dialog]').length, 'sfida salvata:', (JSON.parse(localStorage.getItem('plinto:partita-sfida')||'null')||{}).seedLabel].join(' | ')));
await stato('sfida oggi, 2 mosse');
// apro un nuovo documento con il collegamento (come cliccare un link ricevuto)
const q = await c.newPage(); await q.goto(URL+'#/sfida/2026-10-10'); await q.waitForTimeout(2500);
console.log('NUOVA SCHEDA:', await q.evaluate(()=>[location.hash, document.querySelector('.pl-plancia')?'partita':document.querySelector('.pl-home')?'home':'?', document.querySelectorAll('[role=dialog]').length, document.querySelector('[role=dialog]')?.innerText.replace(/\s+/g,' ')].join(' | ')));
await q.screenshot({path:'collaudo/prove/g1-nuova-scheda.png'});
await p.reload(); await p.waitForTimeout(1500); await stato('reload scheda vecchia (hash 17)');
await p.evaluate(()=>{location.hash='#/sfida/2026-10-10'}); await p.waitForTimeout(1500); await stato('hashchange a 10-10');
await p.screenshot({path:'collaudo/prove/g1-hashchange.png'});
await b.close();
