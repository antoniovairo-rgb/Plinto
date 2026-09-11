import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { MISURE, REGISTRO } from '../tools/misure-icone.js';

/**
 * L'icona in public/ non puo' usare i token CSS: e' un file statico servito prima
 * dell'applicazione. I suoi colori sono quindi scritti a mano in esadecimale, ed e'
 * esattamente il tipo di duplicazione che si scolla senza che nessuno se ne accorga:
 * quando la palette e' passata da smorzata a satura, il marchio nell'applicazione e'
 * cambiato e l'icona della scheda del browser e' rimasta indietro per due versioni.
 *
 * Qui si verifica che ogni colore dell'icona sia ancora uno dei token del tema scuro.
 */

const tokens = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const icona = readFileSync(new URL('../public/icon.svg', import.meta.url), 'utf8');

function token(nome) {
  const trovato = new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`).exec(tokens);
  expect(trovato, `token ${nome} non trovato`).toBeTruthy();
  return trovato[1].toLowerCase();
}

describe('icona statica', () => {
  it('usa gli stessi colori del marchio nel tema scuro', () => {
    const attesi = [
      token('pl-ink'),
      token('pl-block-4'),
      token('pl-block-2'),
      token('pl-block-3'),
      token('pl-line-strong'),
    ];
    const usati = [...icona.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6})"/g)]
      .map((m) => m[1].toLowerCase());
    expect(usati).toEqual(attesi);
  });

  it('mantiene la geometria del logo (quarto riquadro tratteggiato e vuoto)', () => {
    expect(icona).toContain('stroke-dasharray="4 3"');
    expect((icona.match(/rx="5"/g) ?? []).length).toBe(4);
  });
});

/**
 * La zona sicura: che il marchio non finisca sotto la maschera del launcher.
 *
 * PERCHE' NON BASTAVA IL COMMENTO. Il generatore dichiarava che il marchio stava "dentro
 * il cerchio sicuro di Android". Misurato dopo una segnalazione ("icona tagliata"): il
 * marchio aveva raggio 187 pixel su una tela da 432, dove il cerchio sicuro ne ammette
 * 132. Sporgeva di 55 pixel e gli angoli dei blocchi arrivavano rasati sul telefono.
 *
 * L'errore di partenza era guardare la misura sbagliata: il quadrato visibile (72 su
 * 108) invece del CERCHIO garantito (66 su 108). Su un marchio quadrato come questo la
 * differenza fra le due e' esattamente cio' che si perde agli angoli.
 *
 * I numeri qui sotto vengono da `npm run icone`, che li misura sui PNG veri e si ferma
 * se sono fuori. Questo test li rilegge perche' il gate non rigenera le icone: senza,
 * la garanzia varrebbe solo per chi si ricorda di lanciare quel comando.
 */
describe('zona sicura delle icone', () => {
  const registro = JSON.parse(readFileSync(REGISTRO, 'utf8'));

  it('il marchio sta dentro la zona sicura di ogni piattaforma', () => {
    const conZona = MISURE.filter((m) => m.zonaSicura);
    expect(registro.misurate.length, 'icone misurate').toBe(conZona.length);

    for (const misura of registro.misurate) {
      const px = (v) => Math.round(v * misura.lato);
      expect(
        misura.raggio,
        `${misura.nome}: il marchio arriva a ${px(misura.raggio)}px dal centro, `
        + `la zona sicura ne ammette ${px(misura.zonaSicura)}px`,
      ).toBeLessThanOrEqual(misura.zonaSicura);
    }
  });

  it('le misure registrate sono quelle dichiarate adesso, non di due margini fa', () => {
    // Il registro e' un'istantanea: se qualcuno cambia un margine e non rigenera, i PNG
    // sono vecchi quanto il registro e la verifica sopra starebbe certificando dei file
    // che non esistono piu'. Qui si confrontano i due, e a divergere basta un numero.
    for (const misura of registro.misurate) {
      const dichiarata = MISURE.find((m) => m.nome === misura.nome);
      expect(dichiarata, `${misura.nome} non e piu' fra le misure dichiarate`).toBeTruthy();
      expect(dichiarata.margine, `${misura.nome}: margine`).toBe(misura.margine);
      expect(dichiarata.lato, `${misura.nome}: lato`).toBe(misura.lato);
      expect(dichiarata.zonaSicura, `${misura.nome}: zona sicura`).toBe(misura.zonaSicura);
    }
  });
});
