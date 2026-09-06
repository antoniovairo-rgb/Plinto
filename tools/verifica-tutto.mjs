/**
 * Esegue TUTTE le verifiche, in ordine, e riassume l'esito.
 *
 * Perche' esiste. I controlli di questo progetto sono nove, e sono comandi separati:
 * chi pubblica deve ricordarseli tutti. Non me li sono ricordati tutti — ho pubblicato
 * saltando `prova-pages`, l'integrazione continua ha bloccato il rilascio, e il difetto
 * era proprio nel controllo che non avevo eseguito. Un elenco da ricordare a memoria e'
 * un elenco che prima o poi si dimentica: qui e' scritto una volta sola, e il comando
 * fallisce se anche uno solo dei nove fallisce.
 *
 * L'ordine non e' casuale: prima i controlli che costano secondi e trovano gli errori
 * piu' grossolani, poi quelli che aprono un browser. Chi ha rotto la sintassi lo scopre
 * in cinque secondi e non in cinque minuti.
 *
 * Nessuna verifica viene saltata quando un'altra fallisce: si arriva sempre in fondo e
 * si stampa il quadro completo, perche' sapere che tre cose sono rotte e' piu' utile
 * che scoprirle una alla volta in tre esecuzioni.
 *
 * Uso: npm run verifica
 */

import { spawn } from 'node:child_process';

const VERIFICHE = [
  { nome: 'test unitari', comando: 'npm', argomenti: ['test'] },
  { nome: 'contrasti WCAG', comando: 'npm', argomenti: ['run', 'contrasti'] },
  { nome: 'build di produzione', comando: 'npm', argomenti: ['run', 'build'] },
  { nome: 'comunicazioni (ogni schermata, ogni lingua)', comando: 'npm', argomenti: ['run', 'comunicazioni'] },
  { nome: 'partita completa nel browser', comando: 'npm', argomenti: ['run', 'e2e'] },
  { nome: 'livelli nel browser (vittoria e sconfitta)', comando: 'npm', argomenti: ['run', 'e2e-quadri'] },
  { nome: 'precisione del trascinamento', comando: 'npm', argomenti: ['run', 'precisione'] },
  { nome: 'build servita da una sottocartella', comando: 'npm', argomenti: ['run', 'prova-pages'] },
  { nome: 'aspetto su schermi grandi', comando: 'npm', argomenti: ['run', 'prova-desktop'] },
];

/** Esegue un comando mostrandone l'output dal vivo. @returns {Promise<boolean>} */
function esegui({ comando, argomenti }) {
  return new Promise((risolvi) => {
    const p = spawn(comando, argomenti, { stdio: 'inherit', shell: process.platform === 'win32' });
    p.on('close', (codice) => risolvi(codice === 0));
    p.on('error', () => risolvi(false));
  });
}

const inizio = Date.now();
const esiti = [];

for (const verifica of VERIFICHE) {
  const da = Date.now();
  console.log(`\n[1m▶ ${verifica.nome}[0m`);
  const ok = await esegui(verifica);
  esiti.push({ ...verifica, ok, secondi: Math.round((Date.now() - da) / 1000) });
}

const falliti = esiti.filter((e) => !e.ok);

console.log(`\n${'='.repeat(60)}`);
console.log(`VERIFICA COMPLETA — ${esiti.length} controlli in ${Math.round((Date.now() - inizio) / 1000)}s\n`);
for (const e of esiti) {
  console.log(`  ${e.ok ? '✓' : '✗'}  ${e.nome.padEnd(46)} ${String(e.secondi).padStart(4)}s`);
}
console.log('');

if (falliti.length > 0) {
  console.error(`${falliti.length} controlli su ${esiti.length} sono falliti. NON pubblicare.\n`);
  process.exit(1);
}
console.log('Tutti i controlli sono passati.\n');
