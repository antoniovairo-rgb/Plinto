/**
 * Gli attrezzi: come si guadagnano, come si spendono, e cosa NON deve succedere.
 *
 * Le due regole che questi test difendono sono quelle che un giocatore noterebbe subito
 * se saltassero: non si guadagna due volte per lo stesso livello, e non si spende un
 * attrezzo che non c'e'.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
// Attenzione: NON importarle come `it`/`en`: `it` collide con la funzione di test.
import testiIt from '../src/i18n/it.js';
import testiEn from '../src/i18n/en.js';

const memoria = new Map();
vi.stubGlobal('window', {
  localStorage: {
    getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
    setItem: (k, v) => memoria.set(k, String(v)),
    removeItem: (k) => memoria.delete(k),
    key: (i) => [...memoria.keys()][i] ?? null,
    get length() { return memoria.size; },
  },
});

const {
  caricaAttrezzi, riscuoti, usaAttrezzo, quantiAttrezzi, magazzinoPieno,
  OGNI_LIVELLI, MASSIMO, ATTREZZI,
} = await import('../src/persistence/attrezzi.js');

beforeEach(() => memoria.clear());

describe('guadagnare attrezzi', () => {
  it('uno ogni cinque livelli superati', () => {
    expect(riscuoti(4).guadagnati).toBe(0);
    expect(quantiAttrezzi()).toBe(0);
    expect(riscuoti(5).guadagnati).toBe(1);
    expect(quantiAttrezzi()).toBe(1);
    expect(riscuoti(9).guadagnati).toBe(0);
    expect(riscuoti(10).guadagnati).toBe(1);
    expect(quantiAttrezzi()).toBe(2);
  });

  it('NON si guadagna due volte per gli stessi livelli', () => {
    // Il caso vero: `riscuoti` viene chiamata a ogni apertura della schermata.
    riscuoti(10);
    for (let i = 0; i < 20; i += 1) riscuoti(10);
    expect(quantiAttrezzi()).toBe(2);
  });

  it('un salvataggio importato porta con se i livelli mai convertiti', () => {
    // Su questo dispositivo non si era mai giocato: arrivano trenta livelli in blocco.
    const esito = riscuoti(30);
    expect(esito.guadagnati).toBe(MASSIMO);
    expect(esito.persi).toBe(6 - MASSIMO);
  });

  it('a magazzino pieno quello che matura si perde, e si sa quanti', () => {
    riscuoti(15);
    expect(quantiAttrezzi()).toBe(3);
    expect(magazzinoPieno()).toBe(true);
    const esito = riscuoti(25);
    expect(esito.guadagnati).toBe(0);
    expect(esito.persi).toBe(2);
    expect(quantiAttrezzi()).toBe(3);
  });

  it('dopo averne speso uno, i livelli gia contati non ne regalano altri', () => {
    // La prova che il tetto conta davvero: se i crediti restassero in sospeso, qui
    // il magazzino tornerebbe pieno da solo e il tetto non vorrebbe dire niente.
    riscuoti(50);
    expect(quantiAttrezzi()).toBe(3);
    usaAttrezzo();
    expect(quantiAttrezzi()).toBe(2);
    riscuoti(50);
    expect(quantiAttrezzi()).toBe(2);
  });

  it('livelli negativi o strani non rompono niente', () => {
    expect(riscuoti(-10).guadagnati).toBe(0);
    expect(quantiAttrezzi()).toBe(0);
  });
});

describe('spendere attrezzi', () => {
  it('spendere ne toglie uno', () => {
    riscuoti(10);
    expect(usaAttrezzo()).toBe(true);
    expect(quantiAttrezzi()).toBe(1);
  });

  it('a magazzino vuoto non si spende, e non si scrive niente', () => {
    expect(usaAttrezzo()).toBe(false);
    expect(quantiAttrezzi()).toBe(0);
    expect(caricaAttrezzi().disponibili).toBe(0);
  });

  it('la cassetta e completa: carriola, gessetto, piccone e mensola', () => {
    // L'ordine non e' un dettaglio: e' l'ordine in cui il pannello li mostra, e va dal
    // piu' semplice da capire al piu' strategico.
    expect(ATTREZZI).toEqual(['carriola', 'gessetto', 'piccone', 'mensola']);
    // La scarsita' NON e' cambiata aggiungendo due attrezzi: sempre uno ogni cinque
    // livelli, sempre tre al massimo. Raddoppiare le scelte senza raddoppiare la
    // risorsa e' proprio cio' che rende la scelta una decisione invece di un elenco.
    expect(OGNI_LIVELLI).toBe(5);
    expect(MASSIMO).toBe(3);
  });
});

/**
 * QUANDO GLI ATTREZZI ARRIVANO TUTTI INSIEME, E PERCHE' VA DETTO.
 *
 * Chi aggiorna dopo aver gia' giocato non ha mai riscosso niente: al primo livello vinto
 * dopo l'aggiornamento il gioco converte in un colpo solo TUTTI i livelli gia' superati.
 * Con settanta livelli fatti sono quattordici attrezzi maturati, tre che entrano e undici
 * persi per il tetto.
 *
 * Non e' un difetto -- lasciare a zero chi ha fatto settanta livelli sarebbe peggio -- ma
 * successo in silenzio lo e': tre attrezzi comparsi dal nulla e undici spariti senza una
 * parola. Segnalato da chi giocava, con la domanda "perche' ho tutti questi attrezzi?".
 *
 * Queste prove fissano i due numeri e il fatto che la schermata di fine livello li dica.
 */
describe('gli attrezzi arretrati di chi aggiorna a meta strada', () => {
  it('settantadue livelli gia fatti danno tre attrezzi e undici persi', () => {
    const esito = riscuoti(72);
    expect(esito.guadagnati).toBe(3);
    expect(esito.persi).toBe(11);
    expect(esito.attrezzi.disponibili).toBe(MASSIMO);
    // Il conto NON riparte da capo: i livelli gia' convertiti restano convertiti, e
    // vincere il 73esimo o il 74esimo non regala niente. Senza questo, ogni livello
    // vinto ne darebbe un altro.
    expect(riscuoti(73).guadagnati).toBe(0);
    expect(riscuoti(74).guadagnati).toBe(0);
    // Al 75esimo ne matura uno, ma il magazzino e' pieno: va perso, e il gioco lo dice.
    // E' la conseguenza diretta della conversione in blocco -- si arriva al tetto subito
    // -- ed e' il motivo per cui il messaggio "magazzino pieno" doveva esistere.
    expect(riscuoti(75)).toMatchObject({ guadagnati: 0, persi: 1 });
    // Speso uno, il posto si libera e il prossimo entra davvero.
    usaAttrezzo();
    expect(riscuoti(80)).toMatchObject({ guadagnati: 1, persi: 0 });
  });

  it('la schermata di fine livello mostra sia i guadagnati sia i persi', () => {
    // Il gioco questi due numeri li calcolava gia' e non li mostrava a nessuno: erano
    // nel risultato del livello da quando gli attrezzi esistono, e nessuna schermata li
    // leggeva. Questa prova e' il promemoria che non si perda di nuovo per strada.
    const schermata = readFileSync(
      new URL('../src/ui/schermate/FineQuadro.jsx', import.meta.url), 'utf8',
    );
    expect(schermata).toMatch(/esito\.attrezzoGuadagnato/);
    expect(schermata).toMatch(/esito\.attrezzoPerso/);
    for (const [lingua, testi] of [['it', testiIt], ['en', testiEn]]) {
      for (const chiave of ['guadagnato', 'guadagnatiTanti', 'perso', 'persiTanti']) {
        expect(testi.attrezzi[chiave], `${lingua}: manca attrezzi.${chiave}`).toBeTruthy();
      }
      // Il plurale deve poter dire QUANTI: un messaggio che dice "alcuni attrezzi sono
      // andati persi" non e' un'informazione, e' un dispiacere generico.
      expect(testi.attrezzi.guadagnatiTanti).toContain('{n}');
      expect(testi.attrezzi.persiTanti).toContain('{n}');
    }
  });
});
