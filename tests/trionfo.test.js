/**
 * La fine del percorso: il riepilogo dei cento livelli, la chiusura di un atto e la
 * scheda che si manda agli amici.
 *
 * Tutto quello che si prova qui e' PURO: nessun browser, nessun DOM. Le tre regole che
 * contano -- "completo" non e' "ho vinto il centesimo", un atto si festeggia una volta
 * sola, e la scheda non gonfia i numeri -- stanno in funzioni che si possono interrogare
 * direttamente, ed e' il motivo per cui sono state scritte cosi'.
 */
import { describe, it, expect, vi } from 'vitest';
import { formattaSchedaTrionfo, FIRMA_TRIONFO, RIGA_DISEGNATA, LIMITE } from '../src/core/scheda.js';
import { ATTI, OPERE, TOTALE_QUADRI, attoDelQuadro } from '../src/config/quadri.js';
import { traduttore, LINGUE } from '../src/i18n/index.js';

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
const { riepilogoPercorso, riepilogoAtto } = await import('../src/persistence/progressi.js');

/** Una mappa di progressi finta: livelli superati con le voci nella forma vera. */
function superati(numeri, tentativi = 1) {
  const p = {};
  for (const n of numeri) p[n] = { mosse: 12, punteggio: 300, tentativi };
  return p;
}
const daA = (da, a) => Array.from({ length: a - da + 1 }, (_, i) => da + i);

describe('riepilogo del percorso', () => {
  it('conta i livelli superati davvero, non il numero piu alto raggiunto', () => {
    // Il caso che questa funzione esiste per non sbagliare: si e' arrivati al centesimo
    // per insistenza, lasciandone indietro cinque. Il percorso NON e' completo.
    const conBuchi = superati(daA(1, 100).filter((n) => ![7, 23, 41, 66, 89].includes(n)));
    const r = riepilogoPercorso(conBuchi, TOTALE_QUADRI);
    expect(r.superati).toBe(95);
    expect(r.completo).toBe(false);
  });

  it('e completo solo con tutti e cento', () => {
    expect(riepilogoPercorso(superati(daA(1, 100)), TOTALE_QUADRI).completo).toBe(true);
  });

  it('non e mai completo se non gli si dice quanti sono i livelli', () => {
    // `totale` a zero vuol dire "non lo so": rispondere "completo" sarebbe un si' detto
    // senza aver capito la domanda, ed e' la strada piu' corta a una festa immotivata.
    expect(riepilogoPercorso(superati(daA(1, 100))).completo).toBe(false);
  });

  it('i tentativi contano anche quelli dei livelli mai superati', () => {
    const p = superati([1, 2]);
    p[3] = { tentativi: 6 };            // voce senza `mosse`: provato, mai vinto
    const r = riepilogoPercorso(p, 100);
    expect(r.superati).toBe(2);
    expect(r.tentativiTotali).toBe(8);
  });

  it('al primo colpo conta solo chi ha vinto al primo tentativo', () => {
    const p = { ...superati([1, 2], 1), ...superati([3], 4) };
    const r = riepilogoPercorso(p, 3);
    expect(r.alPrimoColpo).toBe(2);
    expect(r.piuOstinato).toEqual({ numero: 3, tentativi: 4 });
  });

  it('non nomina il livello piu ostinato se nessuno ha resistito', () => {
    expect(riepilogoPercorso(superati([1, 2, 3]), 3).piuOstinato).toBe(null);
  });
});

describe('chiusura di un atto', () => {
  const atto = { id: 'fondamenta', da: 1, a: 10 };

  it('si chiude quando cade l ultimo livello che mancava', () => {
    const r = riepilogoAtto(atto, { numero: 10, primaVolta: true }, superati(daA(1, 10)));
    expect(r.completo).toBe(true);
    expect(r.appenaChiuso).toBe(true);
  });

  it('NON si rifesteggia rigiocando un livello di un atto gia chiuso', () => {
    // La regola per cui esiste `primaVolta`: senza, chi rigioca il livello 3 per
    // migliorare le mosse si vedrebbe annunciare di nuovo un traguardo di mesi prima.
    const r = riepilogoAtto(atto, { numero: 3, primaVolta: false }, superati(daA(1, 10)));
    expect(r.completo).toBe(true);
    expect(r.appenaChiuso).toBe(false);
  });

  it('non si chiude con un buco in mezzo', () => {
    const r = riepilogoAtto(atto, { numero: 10, primaVolta: true }, superati(daA(1, 10).filter((n) => n !== 4)));
    expect(r.completo).toBe(false);
    expect(r.appenaChiuso).toBe(false);
  });

  it('non attribuisce la chiusura a una vittoria fuori dall atto', () => {
    const r = riepilogoAtto(atto, { numero: 15, primaVolta: true }, superati(daA(1, 10)));
    expect(r.appenaChiuso).toBe(false);
  });

  it('l importanza della chiusura segue la posizione, non un elenco scritto a mano', () => {
    const gradini = ATTI.map((a) => riepilogoAtto(a, null, superati([])).intensita);
    // I sette atti di oggi. Se un giorno fossero otto questa riga fallisce, ed e' voluto:
    // cambiare il percorso vuol dire ricontrollare anche le frasi, non solo i numeri.
    expect(gradini).toEqual([1, 1, 1, 2, 2, 2, 3]);
    // Una scala che scende non e' una scala: l'atto dopo non puo' pesare meno di quello
    // prima, altrimenti chiudere "La maestria" varrebbe meno che chiudere "Le basi".
    for (let i = 1; i < gradini.length; i += 1) {
      expect(gradini[i], `atto ${i + 1}`).toBeGreaterThanOrEqual(gradini[i - 1]);
    }
    expect(riepilogoAtto(ATTI[0], null, superati([])).indice).toBe(1);
    expect(riepilogoAtto(ATTI[ATTI.length - 1], null, superati([])).indice).toBe(ATTI.length);
  });

  it('conta gli atti gia chiusi e i livelli lasciati indietro', () => {
    const r = riepilogoAtto(ATTI[1], { numero: ATTI[1].a, primaVolta: true }, superati(daA(1, ATTI[1].a)));
    expect(r.attiChiusi).toBe(2);
    expect(r.mancanti).toBe(TOTALE_QUADRI - ATTI[1].a);
    // Un buco dentro il primo atto lo riapre. I pallini accesi devono dire il vero: se
    // contassero gli atti "raggiunti" invece che chiusi, mostrerebbero un traguardo mai
    // fatto proprio a chi un livello lo ha saltato.
    const conBuco = superati(daA(1, ATTI[1].a).filter((n) => n !== 5));
    expect(riepilogoAtto(ATTI[1], null, conBuco).attiChiusi).toBe(1);
  });

  it('ogni atto e ogni opera hanno un nome in tutte e due le lingue', () => {
    // I nomi sono usciti dai dati generati e sono finiti nelle traduzioni. Se un giorno
    // il generatore aggiungesse un atto senza che nessuno scriva il nome, a schermo
    // comparirebbe "atti.qualcosa": questa prova lo ferma prima.
    for (const lingua of Object.keys(LINGUE)) {
      const dizionario = LINGUE[lingua].strings;
      for (const atto of ATTI) {
        expect(typeof dizionario.atti?.[atto.id], `${lingua}: atti.${atto.id}`).toBe('string');
        expect(dizionario.atti[atto.id].trim().length).toBeGreaterThan(2);
      }
      for (const opera of OPERE) {
        expect(typeof dizionario.opere?.[opera.id], `${lingua}: opere.${opera.id}`).toBe('string');
      }
      // La Torre non ha livelli, ma il suo nome si vede nella festa finale.
      expect(typeof dizionario.opere?.torre).toBe('string');
    }
  });

  it('le opere coprono tutti i livelli, e gli atti stanno dentro un opera', () => {
    const coperti = OPERE.reduce((n, o) => n + (o.a - o.da + 1), 0);
    expect(coperti).toBe(TOTALE_QUADRI);
    for (const atto of ATTI) {
      const dentro = OPERE.filter((o) => atto.da >= o.da && atto.a <= o.a);
      expect(dentro.length, `atto ${atto.id}`).toBe(1);
    }
  });

  it('ogni atto ha la sua frase in tutte e due le lingue', () => {
    for (const lingua of Object.keys(LINGUE)) {
      const frasi = LINGUE[lingua].strings.quadri.attoFrasi;
      expect(frasi.length, lingua).toBe(ATTI.length);
      for (const f of frasi) expect(f.trim().length, `${lingua}: "${f}"`).toBeGreaterThan(10);
    }
  });

  it('gli atti coprono tutti i livelli senza buchi ne sovrapposizioni', () => {
    // Se un livello non appartenesse a nessun atto, la sua vittoria non potrebbe mai
    // chiuderne uno: la festa di meta' strada sparirebbe in silenzio.
    for (let n = 1; n <= TOTALE_QUADRI; n += 1) {
      const dentro = ATTI.filter((a) => n >= a.da && n <= a.a);
      expect(dentro.length, `livello ${n}`).toBe(1);
      expect(attoDelQuadro(n)).toBe(dentro[0]);
    }
  });
});

describe('la scheda di chi ha finito', () => {
  const dati = { totale: 100, mosseTotali: 1297, alPrimoColpo: 75 };

  it('sta nel limite di una chat', () => {
    const testo = formattaSchedaTrionfo(dati, { indirizzo: 'https://example.org/plinto/' });
    expect(testo.length).toBeLessThanOrEqual(LIMITE);
  });

  it('dice i numeri veri e non ne inventa', () => {
    const testo = formattaSchedaTrionfo(dati, {});
    expect(testo).toContain('100');
    expect(testo).toContain('1297');
    expect(testo).toContain('75');
  });

  it('tace sui numeri che non ha invece di scrivere zero', () => {
    // "0 al primo colpo" non e' un dato, e' un rimprovero: la riga non deve comparire.
    const testo = formattaSchedaTrionfo({ totale: 100, mosseTotali: 0, alPrimoColpo: 0 }, {});
    expect(testo).not.toMatch(/\b0\b/);
  });

  it('la firma colorata e riconosciuta come riga disegnata', () => {
    // Se non lo fosse, un lettore di schermo leggerebbe sei nomi di emoji di fila.
    expect(RIGA_DISEGNATA.test(FIRMA_TRIONFO)).toBe(true);
  });

  it('sacrifica la firma, non le parole, quando il testo e troppo lungo', () => {
    const lunghissimo = 'https://example.org/' + 'x'.repeat(LIMITE);
    const testo = formattaSchedaTrionfo(dati, { indirizzo: lunghissimo });
    expect(testo).not.toContain(FIRMA_TRIONFO);
    expect(testo).toContain('1297');
  });
});

describe('i testi della fine del percorso', () => {
  it('esistono in tutte le lingue e non promettono date', () => {
    for (const lingua of Object.keys(LINGUE)) {
      const t = traduttore(lingua);
      for (const chiave of [
        'trionfo.titolo', 'trionfo.sotto', 'trionfo.livelli', 'trionfo.mosse',
        'trionfo.primoColpo', 'trionfo.ostinato', 'trionfo.prossimiTitolo',
        'trionfo.prossimiTesto', 'trionfo.libera',
        'quadri.attoChiuso', 'quadri.attoFatti', 'quadri.finitoConBuchi',
        'scheda.condividiTrionfo', 'scheda.trionfoTitolo', 'scheda.tuttiILivelli',
        'scheda.mosseInTutto', 'scheda.alPrimoColpo',
      ]) {
        const testo = t(chiave);
        expect(testo, `${lingua}: ${chiave}`).toBeTruthy();
        expect(testo, `${lingua}: ${chiave}`).not.toBe(chiave);
      }
      // L'annuncio dei prossimi livelli NON deve contenere un mese, un anno o una
      // stagione: una data scritta qui e' una promessa che qualcuno verra' a riscuotere.
      const annuncio = t('trionfo.prossimiTesto').toLowerCase();
      expect(annuncio).not.toMatch(/\b(20\d\d|gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre|january|february|march|april|may|june|july|august|september|october|november|december|presto|soon|settiman|week|mes[ei]|month)\b/);
    }
  });

  it('i segnaposto dei testi sono quelli che il codice sostituisce', () => {
    for (const lingua of Object.keys(LINGUE)) {
      const t = traduttore(lingua);
      expect(t('trionfo.sotto')).toContain('{totale}');
      expect(t('trionfo.ostinato')).toContain('{n}');
      expect(t('trionfo.ostinato')).toContain('{tentativi}');
      expect(t('quadri.attoChiuso')).toContain('{nome}');
      expect(t('quadri.attoFatti')).toContain('{da}');
      expect(t('quadri.attoFatti')).toContain('{a}');
    }
  });
});
