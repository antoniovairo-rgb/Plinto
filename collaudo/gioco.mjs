// Giocatore di prova: legge la plancia dal DOM, trova una mossa valida e la fa con tocco-tocco o trascinamento.
export async function leggi(page) {
  return page.evaluate(() => {
    const celle = [...document.querySelectorAll('.pl-plancia .pl-cella')];
    const griglia = Array.from({ length: 9 }, () => Array(9).fill(0));
    for (const c of celle) {
      const r = +c.dataset.riga, k = +c.dataset.colonna;
      const piena = /piena|occupat/i.test(c.className) || /occupat|piena/i.test(c.getAttribute('aria-label') || '');
      griglia[r][k] = piena ? 1 : 0;
    }
    const pezzi = [...document.querySelectorAll('.pl-tray .pl-pezzo-presa')].map((b, i) => {
      const p = b.querySelector('.pl-pezzo');
      if (!p) return null;
      const cols = +(p.style.gridTemplateColumns.match(/repeat\((\d+)/)?.[1] ?? 0);
      const kids = [...p.children];
      const forma = kids.map((k, j) => ({ r: Math.floor(j / cols), c: j % cols, pieno: !!k.querySelector('.pl-blocco') }));
      return { i, cols, celle: forma.filter((f) => f.pieno), disabled: b.disabled, label: b.getAttribute('aria-label') };
    });
    return { griglia, pezzi, hud: document.querySelector('.pl-hud__punteggio .pl-hud__valore')?.innerText };
  });
}
export function mosseValide(stato) {
  const out = [];
  stato.pezzi.forEach((p) => {
    if (!p) return;
    for (let r = 0; r < 9; r += 1) for (let c = 0; c < 9; c += 1) {
      if (p.celle.every((f) => { const rr = r + f.r, cc = c + f.c; return rr < 9 && cc < 9 && !stato.griglia[rr][cc]; })) out.push({ pezzo: p.i, r, c, n: p.celle.length });
    }
  });
  return out;
}
const centro = async (page, sel) => { const b = await page.locator(sel).first().boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
export async function tocca2(page, m, stato) {
  // Con due tocchi la casella toccata e' il CENTRO del pezzo (origineDaCella): si converte l'origine in casella.
  const p = stato ? stato.pezzi[m.pezzo] : null;
  const alt = p ? Math.max(...p.celle.map((f) => f.r)) + 1 : 1, lar = p ? Math.max(...p.celle.map((f) => f.c)) + 1 : 1;
  const rr = m.r + Math.floor((alt - 1) / 2), cc = m.c + Math.floor((lar - 1) / 2);
  await page.locator('.pl-tray .pl-pezzo-presa').nth(m.pezzo).click();
  await page.locator(`.pl-cella[data-riga="${rr}"][data-colonna="${cc}"]`).click();
  await page.waitForTimeout(80);
}
export async function trascina(page, m, passi = 6, { tocco = false } = {}) {
  // Si afferra il centro del primo blocco pieno del pezzo e si rilascia sul centro della casella corrispondente.
  const st = await leggi(page);
  const f = st.pezzi[m.pezzo].celle[0];
  const blocco = page.locator('.pl-tray .pl-pezzo-presa').nth(m.pezzo).locator('.pl-pezzo__cella').nth(f.r * st.pezzi[m.pezzo].cols + f.c);
  const pb = await blocco.boundingBox();
  const cb = await page.locator(`.pl-cella[data-riga="${m.r + f.r}"][data-colonna="${m.c + f.c}"]`).boundingBox();
  const sollevamento = tocco ? 1.35 * cb.width : 0;
  await page.mouse.move(pb.x + pb.width / 2, pb.y + pb.height / 2);
  await page.mouse.down();
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2 + sollevamento, { steps: passi });
  await page.mouse.up();
  await page.waitForTimeout(150);
}
export async function pieneCount(page) { const s = await leggi(page); return s.griglia.flat().reduce((a, b) => a + b, 0); }

// Sceglie una buona mossa: premia righe/colonne/quadranti completati e l'adiacenza.
export function migliore(stato, val) {
  const g = stato.griglia;
  let best = null, bs = -1e9;
  for (const m of val) {
    const p = stato.pezzi[m.pezzo];
    const tmp = g.map((r) => r.slice());
    for (const f of p.celle) tmp[m.r + f.r][m.c + f.c] = 1;
    let gruppi = 0;
    for (let i = 0; i < 9; i += 1) {
      if (tmp[i].every(Boolean)) gruppi += 1;
      if (tmp.every((r) => r[i])) gruppi += 1;
    }
    for (let qr = 0; qr < 3; qr += 1) for (let qc = 0; qc < 3; qc += 1) {
      let ok = true; for (let a = 0; a < 3; a += 1) for (let b = 0; b < 3; b += 1) if (!tmp[qr * 3 + a][qc * 3 + b]) ok = false;
      if (ok) gruppi += 1;
    }
    let adj = 0;
    for (const f of p.celle) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const rr = m.r + f.r + dr, cc = m.c + f.c + dc;
      if (rr < 0 || cc < 0 || rr > 8 || cc > 8 || g[rr][cc]) adj += 1;
    }
    const sc = gruppi * 20 + adj + Math.random() * 0.5;
    if (sc > bs) { bs = sc; best = m; }
  }
  return best;
}

// Trascinamento con VERO tocco (eventi touch via CDP): il pezzo si solleva di 1,35 caselle sopra il dito.
export async function trascinaTocco(page, m, { passi = 8, annulla = false } = {}) {
  const cdp = page._cdp ?? (page._cdp = await page.context().newCDPSession(page));
  const st = await leggi(page);
  const f = st.pezzi[m.pezzo].celle[0];
  const blocco = page.locator('.pl-tray .pl-pezzo-presa').nth(m.pezzo).locator('.pl-pezzo__cella').nth(f.r * st.pezzi[m.pezzo].cols + f.c);
  const pb = await blocco.boundingBox();
  const cb = await page.locator(`.pl-cella[data-riga="${m.r + f.r}"][data-colonna="${m.c + f.c}"]`).boundingBox();
  const x0 = pb.x + pb.width / 2, y0 = pb.y + pb.height / 2;
  const x1 = cb.x + cb.width / 2, y1 = cb.y + cb.height / 2 + 1.35 * cb.width;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0 }] });
  for (let i = 1; i <= passi; i += 1) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / passi, y: y0 + (y1 - y0) * i / passi }] });
  await cdp.send('Input.dispatchTouchEvent', { type: annulla ? 'touchCancel' : 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(150);
}
