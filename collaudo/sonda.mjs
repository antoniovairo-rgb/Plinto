// Sonda esplorativa sulla produzione: incroci tra partita libera, sfida e livello.
import { chromium } from 'playwright';
const URL = process.env.PLINTO_E2E_URL ?? 'https://antoniovairo-rgb.github.io/Plinto/';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const OUT = process.env.OUT ?? 'collaudo/prove/sonda';
import { mkdirSync } from 'node:fs'; mkdirSync(OUT, { recursive: true });
async function nuova(lingua='it', w=390, h=844) {
  const c = await b.newContext({ viewport: { width: w, height: h }, locale: lingua==='it'?'it-IT':'en-US' });
  const p = await c.newPage(); p.on('pageerror', e => console.log('PAGEERROR', e.message));
  await p.goto(URL); await p.evaluate((l)=>{localStorage.clear();localStorage.setItem('plinto:settings',JSON.stringify({versione:2,introVista:true,lingua:l}));}, lingua);
  await p.goto(URL); await p.waitForSelector('.pl-home__menu'); return p;
}
const dove = p => p.evaluate(() => document.querySelector('.pl-plancia') ? 'partita' : document.querySelector('.pl-apertura') ? 'obiettivo' : document.querySelector('.pl-tappe') ? 'mappa' : document.querySelector('.pl-home') ? 'home' : '?');
const info = async (p, e) => console.log(e.padEnd(58), await dove(p), '|', await p.evaluate(()=>location.hash), '|', await p.evaluate(()=>(document.querySelector('.pl-hud')?.innerText||'').replace(/\s+/g,' ').slice(0,40)), '|dialog:', await p.locator('[role=dialog],[role=alertdialog]').count());
async function mossa(p) {
  const q = await p.evaluate(() => { const z=document.querySelector('.pl-tray .pl-pezzo'); const c=[...document.querySelectorAll('.pl-plancia .pl-cella')]; if(!z) return null; const v=c.filter(x=>!x.className.includes('piena')); const r=z.getBoundingClientRect(), s=(v[Math.floor(v.length/2)]??c[40]).getBoundingClientRect(); return {a:r.left+r.width/2,b:r.top+r.height/2,c:s.left+s.width/2,d:s.top+s.height/2}; });
  if (!q) return; await p.mouse.move(q.a,q.b); await p.mouse.down(); await p.mouse.move(q.c,q.d,{steps:5}); await p.mouse.up(); await p.waitForTimeout(200);
}
const lib = p => p.locator('.pl-sfida-avvio--libera').click();
const sfi = p => p.locator('.pl-sfida-avvio--sfida').click();
const salvati = p => p.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('plinto:')).map(k=>k.slice(7)+':'+localStorage.getItem(k).length).join(' '));
const S = process.argv[2] ?? 'tutti';

if (S==='1'||S==='tutti') { console.log('--- 1 libera -> home -> sfida -> home: la libera resta?');
  const p = await nuova(); await lib(p); await p.waitForSelector('.pl-plancia .pl-cella'); for (let i=0;i<3;i++) await mossa(p); await info(p,'libera 3 mosse');
  await p.goBack(); await p.waitForTimeout(500); await info(p,'Indietro'); console.log(await salvati(p));
  console.log('home testo:', (await p.locator('.pl-home__menu').innerText()).replace(/\s+/g,' '));
  await sfi(p); await p.waitForSelector('.pl-plancia .pl-cella'); await info(p,'sfida aperta (nessuna domanda attesa?)'); await mossa(p); await mossa(p);
  await p.goBack(); await p.waitForTimeout(500); await info(p,'Indietro dalla sfida'); console.log(await salvati(p));
  console.log('home testo:', (await p.locator('.pl-home__menu').innerText()).replace(/\s+/g,' '));
  await p.screenshot({path:OUT+'/1-home.png'});
  await lib(p); await p.waitForSelector('.pl-plancia .pl-cella'); await info(p,'riapro libera: 3 mosse conservate?'); console.log('piene', await p.evaluate(()=>[...document.querySelectorAll('.pl-plancia .pl-cella')].filter(c=>c.className.includes('piena')).length));
}
if (S==='2'||S==='tutti') { console.log('--- 2 sfida di oggi in corso + hash diretto a un altro giorno (reload)');
  const p = await nuova(); await sfi(p); await p.waitForSelector('.pl-plancia .pl-cella'); await mossa(p); await mossa(p); await info(p,'sfida oggi 2 mosse');
  await p.goto(URL+'#/sfida/2026-10-10'); await p.reload(); await p.waitForTimeout(1200); await info(p,'dopo reload su #/sfida/2026-10-10'); console.log(await salvati(p));
  await p.screenshot({path:OUT+'/2-hash.png'});
  await p.evaluate(()=>{location.hash='#/sfida/2026-10-11'}); await p.waitForTimeout(800); await info(p,'cambio hash a 10-11 con partita in corso');
  await p.screenshot({path:OUT+'/2b-hash.png'});
}
if (S==='3'||S==='tutti') { console.log('--- 3 domanda aperta: Indietro, reload, doppio click');
  const p = await nuova(); await p.getByRole('button',{name:/Mappa dei livelli/}).click(); await p.locator('.pl-tappa').first().click(); await p.getByRole('button',{name:/^Gioca$/}).click(); await p.waitForSelector('.pl-plancia .pl-cella'); await mossa(p); await mossa(p);
  await p.goBack(); await p.waitForTimeout(400); await info(p,'mappa');
  const t = p.locator('.pl-tappa'); console.log('tappe', await t.count());
  await t.nth(1).click().catch(e=>console.log('click tappa2 fallito', e.message.slice(0,80))); await p.waitForTimeout(400); await info(p,'tappa 2 (bloccata?)');
  await p.screenshot({path:OUT+'/3-mappa.png'});
}
if (S==='4'||S==='tutti') { console.log('--- 4 Statistiche: media con dati grandi/en');
  for (const l of ['it','en']) { const p = await nuova(l); await p.evaluate(()=>{ const k=Object.keys(localStorage).filter(x=>x.includes('stat')); console.log(k)}); console.log(l, await salvati(p)); }
}
await b.close();
