/**
 * Il salvataggio che si porta via e si rimette.
 *
 * La regola che questi test esistono per difendere e' UNA: reimportare un file vecchio
 * non deve mai cancellare progressi piu' recenti. Tutto il resto -- l'impronta, i formati
 * rifiutati, le impostazioni che non viaggiano -- serve a non farla saltare per una strada
 * laterale. E' l'unica funzionalita' del gioco che puo' distruggere mesi di partite, e va
 * provata come tale.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

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
  componiSalvataggio, serializza, leggiSalvataggio, applicaSalvataggio,
  quantiLivelli, impronta, FORMATO, nomeFile,
} = await import('../src/persistence/salvataggio.js');

const scrivi = (chiave, valore) => memoria.set(`plinto:${chiave}`, JSON.stringify(valore));
const leggi = (chiave) => JSON.parse(memoria.get(`plinto:${chiave}`) ?? 'null');
const livelli = (voci) => ({ versione: 1, livelli: voci });
const vinto = (mosse, punteggio = 100, tentativi = 1) => ({ mosse, punteggio, tentativi });

beforeEach(() => memoria.clear());

describe('il file del salvataggio', () => {
  it('quello che esce rientra identico', () => {
    scrivi('quadri', livelli({ 1: vinto(9), 2: vinto(14) }));
    scrivi('records', { versione: 1, best: 4200 });
    const testo = serializza(componiSalvataggio({ versioneGioco: '1.12.0' }));
    const esito = leggiSalvataggio(testo);
    expect(esito.ok).toBe(true);
    expect(esito.salvataggio.dati.quadri.livelli[1].mosse).toBe(9);
    expect(esito.salvataggio.dati.records.best).toBe(4200);
  });

  it('non porta via le partite lasciate a meta', () => {
    scrivi('quadri', livelli({ 1: vinto(9) }));
    scrivi('partita', { grid: [1, 2, 3] });
    scrivi('partita-quadro', { quadro: 7 });
    scrivi('ripresa', { dove: 'gioco' });
    const dentro = componiSalvataggio().dati;
    expect(dentro.quadri).toBeTruthy();
    // Roba del momento: su un altro telefono sarebbe un livello a meta' mai cominciato.
    expect(dentro.partita).toBeUndefined();
    expect(dentro['partita-quadro']).toBeUndefined();
    expect(dentro.ripresa).toBeUndefined();
  });

  it('rifiuta un file di un altro gioco, uno rovinato e un formato piu nuovo', () => {
    scrivi('quadri', livelli({ 1: vinto(9) }));
    const buono = componiSalvataggio();

    expect(leggiSalvataggio('{ questo non e json').motivo).toBe('illeggibile');
    expect(leggiSalvataggio(JSON.stringify({ ...buono, gioco: 'altro' })).motivo).toBe('altroGioco');
    expect(leggiSalvataggio(JSON.stringify({ ...buono, formato: FORMATO + 1 })).motivo).toBe('formatoIgnoto');

    // Il caso vero: qualcuno ritocca un numero e lascia l'impronta com'era.
    const manomesso = JSON.parse(serializza(buono));
    manomesso.dati.quadri.livelli[1].mosse = 1;
    expect(leggiSalvataggio(JSON.stringify(manomesso)).motivo).toBe('rovinato');
  });

  it('l impronta non dipende dall ordine delle chiavi', () => {
    expect(impronta({ a: 1, b: { c: 2, d: 3 } })).toBe(impronta({ b: { d: 3, c: 2 }, a: 1 }));
    expect(impronta({ a: 1 })).not.toBe(impronta({ a: 2 }));
  });

  it('il nome del file e ordinabile e senza caratteri strani', () => {
    expect(nomeFile(Date.UTC(2026, 8, 14))).toBe('plinto-salvataggio-2026-09-14.json');
  });
});

describe('rimettere il salvataggio', () => {
  /** Un file costruito da uno stato, senza lasciarlo nella memoria. */
  function fileDa(stato) {
    memoria.clear();
    for (const [k, v] of Object.entries(stato)) scrivi(k, v);
    const testo = serializza(componiSalvataggio());
    memoria.clear();
    return leggiSalvataggio(testo).salvataggio;
  }

  it('UNENDO, un file vecchio non cancella progressi piu recenti', () => {
    // La regola. Il file ha tre livelli, il telefono ne ha dieci: dopo devono essere dieci.
    const vecchio = fileDa({ quadri: livelli({ 1: vinto(12), 2: vinto(15), 3: vinto(20) }) });
    const adesso = {};
    for (let n = 1; n <= 10; n += 1) adesso[n] = vinto(10 + n);
    scrivi('quadri', livelli(adesso));

    const esito = applicaSalvataggio(vecchio, { sostituisci: false });
    expect(esito.livelliPrima).toBe(10);
    expect(esito.livelliDopo).toBe(10);
    expect(quantiLivelli(leggi('quadri'))).toBe(10);
  });

  it('UNENDO, di ogni livello resta il risultato migliore', () => {
    const file = fileDa({ quadri: livelli({ 1: vinto(9, 100, 3), 2: vinto(30, 500), 3: vinto(11) }) });
    scrivi('quadri', livelli({ 1: vinto(20, 100, 5), 2: vinto(30, 200) }));

    applicaSalvataggio(file, { sostituisci: false });
    const dopo = leggi('quadri').livelli;
    expect(dopo[1].mosse).toBe(9);            // meno mosse vince
    expect(dopo[1].tentativi).toBe(5);        // i tentativi prendono il massimo
    expect(dopo[2].punteggio).toBe(500);      // a parita' di mosse vince il punteggio
    expect(dopo[3].mosse).toBe(11);           // un livello che c'era solo nel file arriva
  });

  it('UNENDO, un livello mai superato non scalza quello superato', () => {
    const file = fileDa({ quadri: livelli({ 1: { tentativi: 8 } }) });
    scrivi('quadri', livelli({ 1: vinto(9, 100, 2) }));
    applicaSalvataggio(file, { sostituisci: false });
    expect(leggi('quadri').livelli[1].mosse).toBe(9);
    expect(leggi('quadri').livelli[1].tentativi).toBe(8);
  });

  it('UNENDO, i numeri non si sommano: importare due volte non raddoppia niente', () => {
    const file = fileDa({ statistiche: { versione: 1, partite: 40, mosseTotali: 900 } });
    scrivi('statistiche', { versione: 1, partite: 40, mosseTotali: 900 });
    applicaSalvataggio(file, { sostituisci: false });
    applicaSalvataggio(file, { sostituisci: false });
    expect(leggi('statistiche').partite).toBe(40);
    expect(leggi('statistiche').mosseTotali).toBe(900);
  });

  it('UNENDO, le impostazioni restano quelle di questo dispositivo', () => {
    const file = fileDa({ settings: { tema: 'chiaro', lingua: 'en' } });
    scrivi('settings', { tema: 'scuro', lingua: 'it' });
    applicaSalvataggio(file, { sostituisci: false });
    // Importare i progressi di un altro telefono non deve cambiare il tema a chi lo usa.
    expect(leggi('settings').tema).toBe('scuro');
    expect(leggi('settings').lingua).toBe('it');
  });

  it('SOSTITUENDO, resta solo quello che c era nel file, impostazioni comprese', () => {
    const file = fileDa({
      quadri: livelli({ 1: vinto(12), 2: vinto(15) }),
      settings: { tema: 'chiaro', lingua: 'en' },
    });
    const adesso = {};
    for (let n = 1; n <= 10; n += 1) adesso[n] = vinto(10 + n);
    scrivi('quadri', livelli(adesso));
    scrivi('settings', { tema: 'scuro', lingua: 'it' });

    const esito = applicaSalvataggio(file, { sostituisci: true });
    expect(esito.livelliPrima).toBe(10);
    expect(esito.livelliDopo).toBe(2);
    expect(leggi('settings').tema).toBe('chiaro');
  });

  it('un campo che il file non conosce non sparisce unendo', () => {
    // Un file esportato da una versione precedente non deve togliere quello che il gioco
    // ha imparato a salvare dopo: si parte sempre da quello che c'e' adesso.
    const file = fileDa({ records: { versione: 1, best: 100 } });
    scrivi('records', { versione: 2, best: 90, bestChain: 9 });
    applicaSalvataggio(file, { sostituisci: false });
    expect(leggi('records').best).toBe(100);
    expect(leggi('records').bestChain).toBe(9);
  });
});
