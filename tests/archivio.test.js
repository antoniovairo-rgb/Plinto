import { describe, it, expect } from 'vitest';
import {
  PRIMA_SFIDA, giornoDiOggi, giornoValido, semeDaData, tipoDiGiorno, sfidaGiocabile,
  giornoPiu, meseDi, primoDelMese, giorniNelMese, settimaneDelMese, mesePiu, meseHaSfide,
} from '../src/core/sfida.js';
import { createGame } from '../src/core/engine.js';

/**
 * L'archivio delle sfide.
 *
 * Il grosso di questo file sono date, ed e' voluto: le funzioni sulle date si rompono
 * sempre negli stessi quattro punti -- cambio dell'ora, anno bisestile, passaggio di
 * anno, e il fuso orario che trasforma le 23:30 di oggi nel giorno dopo. Nessuno di
 * questi si nota provando il gioco un pomeriggio qualsiasi: si notano una volta l'anno,
 * addosso a chi sta giocando.
 */

describe('il giorno locale', () => {
  it('non usa il fuso UTC', () => {
    expect(giornoDiOggi(new Date(2026, 8, 6))).toBe('2026-09-06');
    // Alle 23:30 del 6, in un fuso a est di Greenwich, UTC sarebbe gia' il 7.
    expect(giornoDiOggi(new Date(2026, 8, 6, 23, 30))).toBe('2026-09-06');
    expect(giornoDiOggi(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31');
  });

  it('riconosce le date che non esistono', () => {
    expect(giornoValido('2026-09-06')).toBe(true);
    expect(giornoValido('2028-02-29'), '2028 e bisestile').toBe(true);
    expect(giornoValido('2027-02-29'), '2027 non lo e').toBe(false);
    expect(giornoValido('2026-02-30')).toBe(false);
    expect(giornoValido('2026-13-01')).toBe(false);
    expect(giornoValido('2026-00-10')).toBe(false);
    expect(giornoValido('6 settembre')).toBe(false);
    expect(giornoValido('')).toBe(false);
    expect(giornoValido(null)).toBe(false);
    expect(giornoValido('2026-9-6'), 'senza zeri non e il formato dichiarato').toBe(false);
  });
});

describe('il seme di una sfida', () => {
  it('stesso giorno, stesso seme, sempre', () => {
    expect(semeDaData('2026-09-06')).toBe(semeDaData('2026-09-06'));
  });

  it('giorni adiacenti danno semi diversi', () => {
    expect(semeDaData('2026-09-06')).not.toBe(semeDaData('2026-09-07'));
    expect(semeDaData('2026-09-30')).not.toBe(semeDaData('2026-10-01'));
    expect(semeDaData('2026-12-31')).not.toBe(semeDaData('2027-01-01'));
  });

  it('in dieci anni di date non esistono due giorni con lo stesso seme', () => {
    // Una collisione vorrebbe dire due giorni con la partita identica: non un difetto
    // grave, ma una promessa non mantenuta. Meglio misurarlo che sperarlo.
    const visti = new Map();
    let giorno = '2020-01-01';
    let collisioni = 0;
    while (giorno < '2030-01-01') {
      const seme = semeDaData(giorno);
      if (visti.has(seme)) collisioni += 1;
      visti.set(seme, giorno);
      giorno = giornoPiu(giorno, 1);
    }
    expect(visti.size).toBe(3653);
    expect(collisioni).toBe(0);
  });

  it('la partita di un giorno e davvero la stessa per tutti', () => {
    const a = createGame({ seed: '2026-09-06' });
    const b = createGame({ seed: '2026-09-06' });
    expect(a.seed).toBe(b.seed);
    expect(a.hand.map((p) => p.shapeId)).toEqual(b.hand.map((p) => p.shapeId));
    expect(createGame({ seed: '2026-09-07' }).seed).not.toBe(a.seed);
  });
});

describe('quali giorni si possono giocare', () => {
  const oggi = '2026-09-20';

  it('oggi si, il passato si, il futuro no', () => {
    expect(tipoDiGiorno(oggi, oggi)).toBe('oggi');
    expect(tipoDiGiorno('2026-09-19', oggi)).toBe('archivio');
    expect(tipoDiGiorno('2026-09-21', oggi), 'domani non si apre').toBe('futura');
    expect(sfidaGiocabile('2026-09-21', oggi)).toBe(false);
    expect(sfidaGiocabile(oggi, oggi)).toBe(true);
    expect(sfidaGiocabile('2026-09-19', oggi)).toBe(true);
  });

  it('prima della prima sfida non c e niente da giocare', () => {
    expect(tipoDiGiorno(PRIMA_SFIDA, oggi)).toBe('archivio');
    expect(tipoDiGiorno(giornoPiu(PRIMA_SFIDA, -1), oggi)).toBe('preistoria');
    expect(sfidaGiocabile('2026-01-01', oggi)).toBe(false);
  });

  it('una data inventata non e giocabile', () => {
    expect(tipoDiGiorno('2026-02-30', oggi)).toBe('malformata');
    expect(tipoDiGiorno('domani', oggi)).toBe('malformata');
    expect(sfidaGiocabile('', oggi)).toBe(false);
  });
});

describe('spostarsi fra i giorni', () => {
  it('attraversa mesi e anni', () => {
    expect(giornoPiu('2026-09-30', 1)).toBe('2026-10-01');
    expect(giornoPiu('2026-10-01', -1)).toBe('2026-09-30');
    expect(giornoPiu('2026-12-31', 1)).toBe('2027-01-01');
    expect(giornoPiu('2027-01-01', -1)).toBe('2026-12-31');
    expect(giornoPiu('2028-02-28', 1), '2028 e bisestile').toBe('2028-02-29');
    expect(giornoPiu('2028-02-29', 1)).toBe('2028-03-01');
    expect(giornoPiu('2027-02-28', 1), '2027 non lo e').toBe('2027-03-01');
  });

  it('il cambio dell ora non fa saltare ne ripetere un giorno', () => {
    // In Italia l'ora legale scatta l'ultima domenica di marzo e finisce l'ultima di
    // ottobre. Sono le due notti in cui un giorno dura 23 o 25 ore, ed e' dove le
    // funzioni sulle date sbagliano: sommando 24 ore si resta sullo stesso giorno o se
    // ne salta uno. Qui si passa per quelle notti un giorno alla volta.
    const marzo = ['2026-03-27', '2026-03-28', '2026-03-29', '2026-03-30', '2026-03-31'];
    for (let i = 0; i < marzo.length - 1; i += 1) {
      expect(giornoPiu(marzo[i], 1), `dal ${marzo[i]}`).toBe(marzo[i + 1]);
      expect(giornoPiu(marzo[i + 1], -1), `indietro dal ${marzo[i + 1]}`).toBe(marzo[i]);
    }
    const ottobre = ['2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27'];
    for (let i = 0; i < ottobre.length - 1; i += 1) {
      expect(giornoPiu(ottobre[i], 1), `dal ${ottobre[i]}`).toBe(ottobre[i + 1]);
      expect(giornoPiu(ottobre[i + 1], -1), `indietro dal ${ottobre[i + 1]}`).toBe(ottobre[i]);
    }
  });

  it('un anno intero avanti e indietro torna al punto di partenza', () => {
    let giorno = '2026-01-01';
    for (let i = 0; i < 365; i += 1) giorno = giornoPiu(giorno, 1);
    expect(giorno).toBe('2027-01-01');
    for (let i = 0; i < 365; i += 1) giorno = giornoPiu(giorno, -1);
    expect(giorno).toBe('2026-01-01');
  });
});

describe('il calendario del mese', () => {
  it('conta i giorni giusti, febbraio compreso', () => {
    expect(giorniNelMese(2026, 9)).toBe(30);
    expect(giorniNelMese(2026, 2)).toBe(28);
    expect(giorniNelMese(2028, 2), 'bisestile').toBe(29);
    expect(giorniNelMese(2026, 12)).toBe(31);
  });

  it('le settimane cominciano di lunedi e contengono ogni giorno una volta sola', () => {
    const settimane = settimaneDelMese(2026, 9);
    expect(settimane.every((s) => s.length === 7), 'righe da sette caselle').toBe(true);
    const giorni = settimane.flat().filter(Boolean);
    expect(giorni).toHaveLength(30);
    expect(new Set(giorni).size, 'nessun giorno ripetuto').toBe(30);
    expect(giorni[0]).toBe('2026-09-01');
    expect(giorni[29]).toBe('2026-09-30');
    // Il 1 settembre 2026 e' un martedi': la prima casella della settimana (lunedi')
    // deve restare vuota.
    expect(settimane[0][0]).toBe(null);
    expect(settimane[0][1]).toBe('2026-09-01');
  });

  it('un mese che comincia di lunedi non ha caselle vuote in testa', () => {
    // Il 1 giugno 2026 e' un lunedi'.
    expect(settimaneDelMese(2026, 6)[0][0]).toBe('2026-06-01');
  });

  it('nessun mese perde giorni, su dieci anni', () => {
    for (let anno = 2020; anno < 2030; anno += 1) {
      for (let mese = 1; mese <= 12; mese += 1) {
        const giorni = settimaneDelMese(anno, mese).flat().filter(Boolean);
        expect(giorni, `${anno}-${mese}`).toHaveLength(giorniNelMese(anno, mese));
      }
    }
  });

  it('si sposta di mese attraversando l anno', () => {
    expect(mesePiu(2026, 12, 1)).toEqual({ anno: 2027, mese: 1 });
    expect(mesePiu(2026, 1, -1)).toEqual({ anno: 2025, mese: 12 });
    expect(mesePiu(2026, 9, 4)).toEqual({ anno: 2027, mese: 1 });
    expect(meseDi('2026-09-06')).toEqual({ anno: 2026, mese: 9 });
    expect(primoDelMese(2026, 9)).toBe('2026-09-01');
  });

  it('sa quali mesi hanno almeno una sfida', () => {
    const oggi = '2026-09-20';
    expect(meseHaSfide(2026, 9, oggi)).toBe(true);
    expect(meseHaSfide(2026, 10, oggi), 'mese futuro').toBe(false);
    expect(meseHaSfide(2026, 8, oggi), 'prima della prima sfida').toBe(false);
    expect(meseHaSfide(2026, 12, '2026-12-01'), 'il mese in corso conta').toBe(true);
  });
});
