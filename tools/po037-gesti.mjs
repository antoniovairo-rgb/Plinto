/**
 * Traccia dei gesti di Chromium per PO-037 (primo tocco perso a fine livello).
 *
 * `registraGesti(cdp)` avvia il tracing con le categorie dell'ingresso; `fermaGesti()`
 * lo chiude e restituisce solo gli eventi che servono (le tracce intere pesano 50 MB a
 * giro). `riassumi(eventi)` dice, per l'ultimo tocco della traccia: se il distacco
 * precedente ha prodotto un GestureFlingStart, a che velocita', quanto e' durato il
 * fling, se era ancora vivo al tocco e se il tocco e' passato per FilterTapSuppression.
 */
const CATEGORIE = ['input', 'input.latency', 'latencyInfo', 'benchmark', 'rail', 'devtools.timeline', 'toplevel'];
const UTILI = /^InputLatency::(Touch(Start|End)|Gesture(FlingStart|FlingCancel|ScrollBegin|ScrollEnd|ScrollUpdate|TapDown|Tap|TapCancel|ShowPress))$|^FlingController::HandlingGestureFling$|^FilterTapSuppression$|^Allowed TouchAction$|^Boosted$|^No Boost - /;

export async function registraGesti(cdp) {
  const eventi = [];
  cdp.on('Tracing.dataCollected', ({ value }) => {
    for (const e of value) {
      if (!UTILI.test(e.name ?? '') || e.ph === 'e' || e.ph === 'E') continue;
      const tieni = e.name === 'FlingController::HandlingGestureFling' || e.name === 'Allowed TouchAction' || e.name === 'Boosted';
      eventi.push({ ts: e.ts, nome: e.name, ...(tieni ? { args: e.args } : {}) });
    }
  });
  await cdp.send('Tracing.start', { traceConfig: { recordMode: 'recordAsMuchAsPossible', includedCategories: CATEGORIE } });
  return async function fermaGesti() {
    const finita = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
    await cdp.send('Tracing.end');
    await finita;
    return eventi.sort((a, b) => a.ts - b.ts);
  };
}

export function riassumi(e) {
  // Quanti fling sono partiti in tutta la traccia, non solo all'ultimo distacco: con la
  // correzione di PO-037 devono essere zero dopo tutti i trascinamenti.
  const avvii = e.filter((x) => x.nome === 'InputLatency::GestureFlingStart').length;
  return { avvii, ...riassumiUltimo(e) };
}

function riassumiUltimo(e) {
  const iTocco = e.findLastIndex((x) => x.nome === 'InputLatency::TouchStart');
  if (iTocco < 0) return { fling: false };
  const tocco = e[iTocco];
  const iFling = e.slice(0, iTocco).findLastIndex((x) => x.nome === 'InputLatency::GestureFlingStart');
  const iFine = e.slice(0, iTocco).findLastIndex((x) => x.nome === 'InputLatency::TouchEnd');
  const dopo = e.slice(iTocco, iTocco + 40).map((x) => x.nome);
  const soppresso = dopo.includes('FilterTapSuppression');
  const tap = dopo.includes('InputLatency::GestureTap');
  if (iFling < 0 || iFine < 0 || e[iFling].ts < e[iFine].ts) return { fling: false, soppresso, tap };
  const v = e.slice(iFling).find((x) => x.nome === 'FlingController::HandlingGestureFling')?.args ?? {};
  const passi = e.slice(iFling, iTocco).filter((x) => x.nome === 'InputLatency::GestureScrollUpdate');
  const finito = e.slice(iFling, iTocco).some((x) => x.nome === 'InputLatency::GestureScrollEnd');
  // Quante volte, in tutta la traccia, il FlingBooster ha sommato un fling al precedente.
  const spinte = e.filter((x) => x.nome === 'Boosted').length;
  const nonSpinte = e.filter((x) => x.nome.startsWith('No Boost')).map((x) => x.nome.slice(11));
  return {
    fling: true, spinte, nonSpinte: [...new Set(nonSpinte)],
    vx: Math.round(v.vx ?? NaN), vy: Math.round(v.vy ?? NaN),
    durata: passi.length ? Math.round((passi.at(-1).ts - e[iFling].ts) / 1000) : 0,
    passi: passi.length,
    vivo: !finito,
    toccoDopo: Math.round((tocco.ts - e[iFling].ts) / 1000),
    soppresso, tap,
  };
}

export function rigaRiassunto(r) {
  return `${r.avvii ?? '?'} GestureFlingStart nella traccia; ${rigaUltimo(r)}`;
}

function rigaUltimo(r) {
  if (!r.fling) return `nessun fling dall'ultimo distacco${r.soppresso ? ', FilterTapSuppression' : ''}`;
  return `fling v=(${r.vx}, ${r.vy}) px/s, ${r.durata} ms, ${r.passi} passi, ${r.vivo ? 'VIVO' : 'finito'} al tocco `
    + `(tocco a ${r.toccoDopo} ms), fling spinti dal FlingBooster ${r.spinte}${r.soppresso ? ', FilterTapSuppression' : ''}`;
}
