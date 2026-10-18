/**
 * La sequenza di mosse che supera un Quadro, calcolata con il motore vero. Era dentro
 * `tests/e2e/trionfo.mjs`; sta qui perche' serve anche al caso N di
 * `tests/e2e/ripresa-livello.mjs`, che deve arrivare alla festa finale.
 */
import { iniziaQuadro, statoQuadro, giocaNelQuadro } from '../src/core/quadro.js';
import { allPlacements, placeShape, findCompletedGroups, fillRatio, idx } from '../src/core/grid.js';
import { createRng } from '../src/core/rng.js';

/** Le celle vuote senza vicine vuote: un pezzo non ci entrera' mai. */
function buchi(grid) {
  let n = 0;
  for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
    if (grid[idx(r, c)] !== 0) continue;
    const vicine = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      .filter(([y, x]) => y >= 0 && y < 9 && x >= 0 && x < 9);
    if (vicine.every(([y, x]) => grid[idx(y, x)] !== 0)) n += 1;
  }
  return n;
}

/** La sequenza che supera il Quadro, calcolata con il motore vero. */
export function sequenzaVincente(quadro, tentativi = 40) {
  for (let prova = 0; prova < tentativi; prova += 1) {
    const rng = createRng(1000 + prova);
    let partita = iniziaQuadro(quadro, { now: 0 });
    const mosse = [];
    let guardia = 0;
    while (guardia < (quadro.maxMosse ?? 60)) {
      if (statoQuadro(quadro, partita).finito) break;
      let migliore = null, valore = -1e9;
      partita.hand.forEach((pezzo, i) => {
        if (!pezzo) return;
        for (const [r, c] of allPlacements(partita.grid, pezzo.shape)) {
          const { grid: dopo } = placeShape(partita.grid, pezzo.shape, r, c, 1);
          const gruppi = findCompletedGroups(dopo);
          const v = gruppi.length * 400 + (gruppi.length ? 200 : 0)
            - buchi(dopo) * 16 - fillRatio(dopo) * 60 + rng.float() * 40;
          if (v > valore) { valore = v; migliore = { handIndex: i, row: r, col: c }; }
        }
      });
      if (!migliore) break;
      mosse.push(migliore);
      partita = giocaNelQuadro(quadro, partita, migliore.handIndex, migliore.row, migliore.col, guardia * 1000);
      guardia += 1;
    }
    if (statoQuadro(quadro, partita).completato) return mosse;
  }
  return null;
}

/** Dove premere e dove lasciare per giocare `mossa` sulla pagina (Playwright). */
export async function posizioneMossa(page, mossa) {
  return page.evaluate(({ handIndex, row, col }) => {
    const posto = document.querySelectorAll('.pl-tray .pl-tray__posto')[handIndex];
    const pezzo = posto?.querySelector('.pl-pezzo');
    if (!pezzo) return null;
    const rp = pezzo.getBoundingClientRect();
    const cellaTray = pezzo.firstElementChild.getBoundingClientRect();
    const celle = document.querySelectorAll('.pl-plancia .pl-cella');
    const c0 = celle[0].getBoundingClientRect();
    const passoX = (celle[8].getBoundingClientRect().left - c0.left) / 8;
    const passoY = (celle[72].getBoundingClientRect().top - c0.top) / 8;
    const px = rp.left + rp.width / 2, py = rp.top + rp.height / 2;
    const presaX = (px - rp.left) / cellaTray.width, presaY = (py - rp.top) / cellaTray.height;
    return { px, py, cx: c0.left + col * passoX + presaX * c0.width, cy: c0.top + row * passoY + presaY * c0.height };
  }, mossa);
}
