import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { PLAY_URL, SITO } from '../src/config/progetto.js';

/**
 * L'anteprima che si vede quando qualcuno incolla il link del gioco in una chat.
 *
 * PERCHE' HA BISOGNO DI UNA PROVA. E' l'unica cosa del progetto che non si vede mai
 * usando il gioco: vive nel riquadro che disegna WhatsApp, o Telegram, o Facebook, e
 * la disegnano loro leggendo dei tag nella pagina. Si puo' romperla senza accorgersene
 * per mesi -- basta rinominare un'immagine -- e chi se ne accorge e' una persona a cui
 * e' arrivato un indirizzo nudo invece di un gioco, che non lo dira' mai a nessuno.
 *
 * Il gioco non ha pubblicita' e non ha un budget: se qualcuno lo scopre, e' perche'
 * qualcun altro gliel'ha mandato. Questo riquadro e' letteralmente tutto il marketing.
 */
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

/** Il valore di un tag <meta>, cercato sia per `property` che per `name`. */
function meta(chiave) {
  const rx = new RegExp(`<meta\\s+(?:property|name)="${chiave}"\\s+content="([^"]*)"`, 'i');
  return html.match(rx)?.[1] ?? null;
}

describe('anteprima dei collegamenti', () => {
  it('dichiara titolo, descrizione, immagine e indirizzo', () => {
    for (const chiave of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type']) {
      expect(meta(chiave), chiave).toBeTruthy();
    }
    expect(meta('og:title')).toContain('PLINTO');
  });

  it('gli indirizzi sono ASSOLUTI', () => {
    // Chi legge questi tag e' un server dall'altra parte del mondo, non il browser del
    // giocatore: non ha nessuna pagina da cui contare i "../", e un percorso relativo
    // qui non produce un errore, produce un riquadro senza immagine.
    for (const chiave of ['og:url', 'og:image', 'twitter:image']) {
      expect(meta(chiave), chiave).toMatch(/^https:\/\//);
    }
  });

  it('l immagine dell anteprima esiste davvero dentro il sito', () => {
    // Il difetto piu' facile: rinominare il file e lasciare il tag che punta al vecchio
    // nome. La pagina continua a funzionare, il riquadro no.
    const nome = meta('og:image').split('/').pop();
    expect(existsSync(new URL(`../public/${nome}`, import.meta.url))).toBe(true);
  });

  it('l indirizzo dichiarato e quello del sito', () => {
    expect(meta('og:url')).toBe(SITO);
    expect(meta('og:image').startsWith(SITO)).toBe(true);
  });

  it('la misura dichiarata e quella che gli store pretendono', () => {
    expect(meta('og:image:width')).toBe('1024');
    expect(meta('og:image:height')).toBe('500');
  });

  it('l immagine ha un testo alternativo', () => {
    expect(meta('og:image:alt')).toBeTruthy();
  });
});

describe('il collegamento del Play Store', () => {
  it('se c e, e un indirizzo del Play Store con il nome del pacchetto', () => {
    if (!PLAY_URL) return;                     // vuoto e' legittimo: si condivide il sito
    expect(PLAY_URL).toMatch(/^https:\/\/play\.google\.com\/store\/apps\/details\?id=/);
    const gradle = readFileSync(new URL('../android/app/build.gradle', import.meta.url), 'utf8');
    const pacchetto = gradle.match(/applicationId\s+'([^']+)'/)?.[1];
    // Il nome del pacchetto scritto due volte e' il nome del pacchetto che prima o poi
    // diverge: qui si controlla che il link porti alla scheda di QUESTA applicazione.
    expect(PLAY_URL).toContain(pacchetto);
  });
});
