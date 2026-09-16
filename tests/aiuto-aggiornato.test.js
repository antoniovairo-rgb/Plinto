import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
// Attenzione: NON importarle come `it`/`en`: `it` collide con la funzione di test di
// Vitest e il file non viene nemmeno raccolto.
import testiIt from '../src/i18n/it.js';
import testiEn from '../src/i18n/en.js';
import { ATTREZZI } from '../src/persistence/attrezzi.js';
import { fattoreTinta, fattoreEsplosione } from '../src/core/scoring.js';
import { GRID_SIZE, ESPLOSIONE_SOGLIA } from '../src/config/rules.js';

/**
 * L'AIUTO DEVE INVECCHIARE INSIEME AL GIOCO.
 *
 * Questa famiglia di difetti non la vede nessuno: cambi una costante, il gioco funziona,
 * tutte le prove passano, e la pagina "Come si gioca" continua a raccontare le regole di
 * ieri. Nessuno apre quella pagina sapendo gia' la risposta, quindi nessuno si accorge
 * che e' sbagliata -- tranne chi la legge per imparare, cioe' esattamente la persona che
 * non ha modo di sospettarlo.
 *
 * E' successo davvero: la 1.15.0 ha spostato la soglia della Tinta, e l'aiuto ha
 * continuato a dire "+100%" mentre il gioco ne pagava 60. La formula era scritta a mano
 * in due file e ne e' invecchiato uno solo.
 *
 * Queste prove non giudicano la prosa: guardano che i NUMERI e gli ELENCHI dell'aiuto
 * vengano dal gioco e non da una copia. Quando aggiungi una meccanica o ritari una
 * costante, e' questo file che ti ricorda di riaprire l'aiuto.
 */
describe('l aiuto racconta il gioco di adesso', () => {
  const leggi = (nome) => readFileSync(new URL(`../src/ui/schermate/${nome}`, import.meta.url), 'utf8');
  /**
   * Il codice senza i commenti. Serve perche' la prova qui sotto vieta una formula
   * scritta a mano, e il commento che RACCONTA quella formula -- cioe' la spiegazione
   * del difetto, che vale la pena tenere -- la conterrebbe alla lettera. Una prova che
   * costringe a cancellare la storia di un errore per passare e' una prova che peggiora
   * il codice invece di proteggerlo.
   */
  const soloCodice = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
  const aiuto = leggi('ComeSiGioca.jsx');
  const guida = leggi('PrimoAvvio.jsx');

  it('i numeri della Tinta arrivano dalla funzione che assegna i punti, non da una formula ricopiata', () => {
    // Il segno di riconoscimento del difetto: un'aritmetica sulle costanti dentro la
    // schermata. Finche' l'aiuto chiama `fattoreTinta`, non puo' dire un numero diverso
    // da quello che il giocatore incassa.
    for (const [nome, sorgente] of [['aiuto', soloCodice(aiuto)], ['guida', soloCodice(guida)]]) {
      expect(sorgente, `${nome}: la Tinta va chiesta a fattoreTinta`).toMatch(/fattoreTinta\(/);
      expect(sorgente, `${nome}: c'e ancora una formula della Tinta scritta a mano`)
        .not.toMatch(/TINTA_PASSO\s*\*/);
    }
  });

  it('il massimo della Tinta e quello vero: nove caselle uguali', () => {
    // Se qualcuno cambia soglia o passo senza riaprire l'aiuto, questo numero si muove
    // e la prova lo dice. 60 non e' un numero magico: e' fattoreTinta(9) di oggi.
    expect(Math.round(fattoreTinta(GRID_SIZE) * 100)).toBe(60);
  });

  it('le esplosioni grosse sono spiegate, con la soglia vera', () => {
    for (const testi of [testiIt, testiEn]) {
      expect(testi.aiuto.bombeGrandi).toBeTruthy();
      expect(testi.aiuto.bombeGrandi).toContain('{soglia}');
      expect(testi.aiuto.bombeGrandi).toContain('{premio}');
    }
    expect(aiuto).toMatch(/fattoreEsplosione\(/);
    // La prima esplosione premiata e' quella appena sopra la soglia.
    expect(fattoreEsplosione(ESPLOSIONE_SOGLIA)).toBe(1);
    expect(fattoreEsplosione(ESPLOSIONE_SOGLIA + 1)).toBeGreaterThan(1);
  });

  it('ogni attrezzo esistente e nominato e spiegato, in tutte e due le lingue', () => {
    // E' il controllo che si accorge del quinto attrezzo aggiunto senza documentarlo:
    // l'elenco nell'aiuto si disegna da ATTREZZI, quindi la voce compare da sola, ma
    // senza i testi comparirebbe vuota.
    for (const [lingua, testi] of [['it', testiIt], ['en', testiEn]]) {
      for (const nome of ATTREZZI) {
        expect(testi.attrezzi[nome], `${lingua}: manca il nome di ${nome}`).toBeTruthy();
        expect(testi.attrezzi[`${nome}Spiega`], `${lingua}: manca la spiegazione di ${nome}`).toBeTruthy();
      }
    }
    expect(aiuto, 'l elenco degli attrezzi nell aiuto deve venire da ATTREZZI').toMatch(/ATTREZZI\.map/);
  });

  it('la guida al primo avvio dice che gli attrezzi esistono', () => {
    // Non un passo in piu' -- la guida deve far cominciare a giocare in fretta -- ma una
    // riga nel passo che parla dei livelli, che e' dove gli attrezzi si guadagnano.
    for (const [lingua, testi] of [['it', testiIt], ['en', testiEn]]) {
      expect(testi.guida.percorso, `${lingua}: il passo del percorso non nomina gli attrezzi`)
        .toContain('{attrezziOgni}');
    }
    expect(guida).toMatch(/attrezziOgni/);
  });
});
