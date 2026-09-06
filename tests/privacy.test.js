import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guardia sulla promessa di privacy.
 *
 * docs/PRIVACY.md dichiara che il gioco non fa NESSUNA richiesta di rete e non usa
 * risorse di terze parti. Una promessa del genere, senza un controllo automatico,
 * regge finche' qualcuno non aggiunge in buona fede una libreria da CDN o un pixel
 * di analitica. Questo test fallisce prima che accada.
 *
 * La cartella sim/ e' esclusa: gira solo in Node per il bilanciamento e non finisce
 * nel prodotto. Anche i test e2e sono fuori: usano la rete per parlare col browser.
 */

const RADICE = new URL('../src/', import.meta.url).pathname;
const ESCLUSE = new Set(['sim']);

function fileDelProdotto() {
  const trovati = [];
  const visita = (cartella) => {
    for (const voce of readdirSync(cartella, { withFileTypes: true })) {
      if (voce.isDirectory()) {
        if (!ESCLUSE.has(voce.name)) visita(join(cartella, voce.name));
        continue;
      }
      if (/\.(jsx?|css)$/.test(voce.name)) trovati.push(join(cartella, voce.name));
    }
  };
  visita(RADICE);
  return trovati;
}

/** Rimuove commenti e stringhe: cosi' una parola citata in un commento non fa falso allarme. */
function soloCodice(testo) {
  return testo
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

const VIETATI = [
  [/\bfetch\s*\(/, 'fetch()'],
  [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
  [/\bnew\s+WebSocket\b/, 'WebSocket'],
  [/\bnavigator\.sendBeacon\b/, 'sendBeacon'],
  [/\bnew\s+EventSource\b/, 'EventSource'],
  [/\bimportScripts\s*\(/, 'importScripts()'],
];

describe('promessa di privacy', () => {
  const file = fileDelProdotto();

  it('esaminа davvero dei file (il test non deve passare a vuoto)', () => {
    expect(file.length).toBeGreaterThan(15);
  });

  it('nessun file del prodotto apre una connessione di rete', () => {
    const colpevoli = [];
    for (const percorso of file) {
      const codice = soloCodice(readFileSync(percorso, 'utf8'));
      for (const [regola, nome] of VIETATI) {
        if (regola.test(codice)) colpevoli.push(`${percorso.replace(RADICE, '')}: ${nome}`);
      }
    }
    expect(colpevoli).toEqual([]);
  });

  it('l unico dominio esterno e PayPal, e sta solo nel file di configurazione', () => {
    // Un font da Google, una libreria da un CDN, un'immagine remota: tutti casi in cui
    // il browser del giocatore contatterebbe un terzo senza che lui lo sappia.
    // L'informativa dichiara UNA sola eccezione, il collegamento alla donazione, che
    // per giunta non parte da solo: deve essere il giocatore a toccarlo. Questo test
    // verifica che l'eccezione resti una sola e resti confinata dove e' dichiarata.
    const fuoriPosto = [];
    for (const percorso of file) {
      const relativo = percorso.replace(RADICE, '');
      const testo = readFileSync(percorso, 'utf8');
      for (const m of testo.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
        const dominio = m[1].toLowerCase();
        if (dominio === 'www.w3.org') continue;                 // spazio dei nomi SVG
        if (dominio.endsWith('paypal.com') && relativo === 'config/progetto.js') continue;
        fuoriPosto.push(`${relativo}: ${dominio}`);
      }
    }
    expect(fuoriPosto).toEqual([]);
  });

  it('la pagina non carica font o fogli di stile esterni', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url).pathname, 'utf8');
    expect(html).not.toMatch(/<link[^>]+href=["']https?:/i);
    expect(html).not.toMatch(/<script[^>]+src=["']https?:/i);
    expect(html).not.toMatch(/@import\s+url\(["']?https?:/i);
  });

  it('tutte le chiavi salvate stanno sotto un unico prefisso dichiarato', () => {
    // L'informativa dice al giocatore quali chiavi cercare per cancellare i dati:
    // una chiave fuori dal prefisso sarebbe un dato che lui non sa di avere.
    const storage = readFileSync(join(RADICE, 'persistence/storage.js'), 'utf8');
    expect(storage).toMatch(/const PREFIX = 'plinto:'/);
    const usiDiretti = [];
    for (const percorso of file) {
      if (percorso.endsWith('persistence/storage.js')) continue;
      const codice = readFileSync(percorso, 'utf8');
      if (/localStorage|sessionStorage|indexedDB/.test(soloCodice(codice))) {
        usiDiretti.push(percorso.replace(RADICE, ''));
      }
    }
    expect(usiDiretti).toEqual([]);
  });
});
