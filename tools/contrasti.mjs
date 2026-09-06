/**
 * Verifica dei contrasti dichiarati in src/styles/tokens.css.
 *
 * I numeri scritti nei commenti dei token non sono decorazione: sono la prova che il
 * tema chiaro e quello scuro rispettano WCAG AA. Un commento sbagliato e' peggio di
 * nessun commento, perche' fa passare per verificato cio' che non lo e' — ed e' gia'
 * successo due volte in questo file. Questo strumento rimisura tutto leggendo il CSS,
 * cosi' i numeri si possono rifare con un comando invece che a mente.
 *
 * Soglie WCAG 2.1: 4.5:1 per il testo normale, 3:1 per grafica e componenti.
 *
 * Uso: node tools/contrasti.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const QUI = dirname(fileURLToPath(import.meta.url));
const CSS = readFileSync(join(QUI, '..', 'src', 'styles', 'tokens.css'), 'utf8');

/** Luminanza relativa secondo WCAG 2.1. */
function luminanza(hex) {
  const canali = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * canali[0] + 0.7152 * canali[1] + 0.0722 * canali[2];
}

/** Rapporto di contrasto fra due colori esadecimali. */
export function contrasto(a, b) {
  const x = luminanza(a);
  const y = luminanza(b);
  const [alto, basso] = x > y ? [x, y] : [y, x];
  return (alto + 0.05) / (basso + 0.05);
}

/** Estrae i token esadecimali di un blocco di regole CSS. */
function tokenDi(selettore) {
  const inizio = CSS.indexOf(selettore);
  if (inizio === -1) throw new Error(`selettore non trovato: ${selettore}`);
  const apre = CSS.indexOf('{', inizio);
  const chiude = CSS.indexOf('}', apre);
  const corpo = CSS.slice(apre + 1, chiude);
  const token = {};
  for (const [, nome, valore] of corpo.matchAll(/(--pl-[\w-]+)\s*:\s*(#[0-9a-fA-F]{6})/g)) {
    token[nome] = valore.toLowerCase();
  }
  return token;
}

const TEMI = [
  { nome: 'scuro',  token: tokenDi(':root {') },
  { nome: 'chiaro', token: tokenDi(":root[data-theme='chiaro']") },
];

let fallito = false;

for (const { nome, token } of TEMI) {
  console.log(`\n  tema ${nome}`);
  console.log('  ' + '-'.repeat(72));

  // Il testo va misurato sul fondo che gli e' PIU' SFAVOREVOLE fra quelli su cui
  // puo' capitare: nel tema scuro il piu' chiaro, nel tema chiaro il piu' scuro.
  const fondali = ['--pl-ink', '--pl-ink-2', '--pl-surface', '--pl-surface-2']
    .map((k) => token[k]).filter(Boolean);
  const peggiore = fondali.reduce((acc, f) => (
    nome === 'scuro'
      ? (luminanza(f) > luminanza(acc) ? f : acc)
      : (luminanza(f) < luminanza(acc) ? f : acc)
  ));
  console.log(`  fondo di riferimento per i testi: ${peggiore}`);

  for (const chiave of ['--pl-text', '--pl-text-dim', '--pl-text-faint']) {
    const r = contrasto(token[chiave], peggiore);
    const ok = r >= 4.5;
    if (!ok) fallito = true;
    console.log(`  ${chiave.padEnd(18)} ${token[chiave]}  ${r.toFixed(2).padStart(6)}  ${ok ? 'ok' : 'SOTTO 4.5'}`);
  }

  // Blocchi: elementi grafici, soglia 3:1 sul fondo della plancia.
  console.log(`  blocchi su ${token['--pl-ink-2']} (soglia 3.0)`);
  for (let i = 1; i <= 6; i += 1) {
    const chiave = `--pl-block-${i}`;
    const r = contrasto(token[chiave], token['--pl-ink-2']);
    const ok = r >= 3;
    if (!ok) fallito = true;
    console.log(`  ${chiave.padEnd(18)} ${token[chiave]}  ${r.toFixed(2).padStart(6)}  ${ok ? 'ok' : 'SOTTO 3.0'}`);
  }

  // Accenti testuali.
  for (const chiave of ['--pl-brand', '--pl-ok', '--pl-danger']) {
    if (!token[chiave]) continue;
    const r = contrasto(token[chiave], peggiore);
    const ok = r >= 4.5;
    if (!ok) fallito = true;
    console.log(`  ${chiave.padEnd(18)} ${token[chiave]}  ${r.toFixed(2).padStart(6)}  su ${peggiore}  ${ok ? 'ok' : 'SOTTO 4.5'}`);
  }

  if (token['--pl-danger-fondo']) {
    const r = contrasto('#ffffff', token['--pl-danger-fondo']);
    console.log(`  bianco su --pl-danger-fondo ${token['--pl-danger-fondo']}  ${r.toFixed(2).padStart(6)}  ${r >= 4.5 ? 'ok' : 'SOTTO 4.5'}`);
    if (r < 4.5) fallito = true;
  }
}

console.log('');
if (fallito) {
  console.error('  Almeno un contrasto e\' sotto soglia.\n');
  process.exit(1);
}
console.log('  Tutti i contrasti sono sopra soglia.\n');
