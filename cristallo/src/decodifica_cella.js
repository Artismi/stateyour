// decodifica_cella.js — dall'immagine di un motivo ripetuto alla sua CELLA: il reticolo, la tessera ripiegata, lo
// scheletro sul toro e i tratti chiusi con la loro classe di giro (m₁, m₂).
//
//   1. la maschera delle linee: soglia di Otsu sul grigio (l'inchiostro è scuro); se l'inchiostro copre più del 35%
//      (tavole a campiture piene) le linee sono il bordo dell'inchiostro;
//   2. il reticolo dall'autocorrelazione (FFT) della maschera sfocata (σ = 2 punti, per non leggere la grana fine:
//      puntini, tratteggi): tra i picchi forti (almeno il 60% del più forte, fuori dal centro) i due più vicini al
//      centro e indipendenti, ridotti alla Lagrange-Gauss; poi rifiniti al sub-pixel cercando i vettori che rendono più
//      nitida la tessera ripiegata (la varianza delle medie), a passi di 0,5, 0,25 e 0,1 punti;
//   3. il ripiegamento: ogni punto dell'immagine si porta nella cella (r mod reticolo) in una griglia G × G di coordinate
//      frazionarie; la media è la tessera pulita, e la soglia 0,5 la sua maschera sul toro;
//   4. lo scheletro di Zhang e Suen, sul toro (i vicini oltre il bordo rientrano dall'altra parte); i passi 4–6 sono
//      quelli di src/decodifica.js della radice, copiati qui e resi periodici;
//   5. il grafo dello scheletro: nodi (estremi e incroci) e archi;
//   6. i tratti chiusi: da ogni arco si prosegue, a ogni incrocio, per la via più diritta (buona continuazione) finché
//      si torna all'arco di partenza; lo spostamento accumulato lungo il tratto, srotolato, diviso per G, è la classe di
//      giro (m₁, m₂): (0, 0) se il tratto si chiude nella cella. Le classi si danno a meno del segno.

// ---------- 1. la maschera
export function otsu(g) {
  const h = new Float64Array(256); for (const v of g) h[Math.max(0, Math.min(255, Math.round(v * 255)))]++;
  const n = g.length; let sum = 0; for (let i = 0; i < 256; i++) sum += i * h[i];
  let sB = 0, wB = 0, best = 0, soglia = 128;
  for (let t = 0; t < 256; t++) { wB += h[t]; if (!wB) continue; const wF = n - wB; if (!wF) break; sB += t * h[t]; const mB = sB / wB, mF = (sum - sB) / wF, v = wB * wF * (mB - mF) ** 2; if (v > best) { best = v; soglia = t; } }
  return soglia / 255;
}
export function mascheraLinee(g, W, H) {
  const s = otsu(g), ink = Uint8Array.from(g, (v) => (v <= s ? 1 : 0));
  let f = 0; for (const v of ink) f += v; f /= ink.length;
  if (f <= 0.35) return { mask: ink, campiture: false };
  const b = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (ink[i] && (!ink[i - 1] || !ink[i + 1] || !ink[i - W] || !ink[i + W])) b[i] = 1; }
  return { mask: b, campiture: true };
}

// ---------- 2. il reticolo
function fft1(re, im, n, passo, o, inv) {
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const a = o + i * passo, c = o + j * passo; [re[a], re[c]] = [re[c], re[a]]; [im[a], im[c]] = [im[c], im[a]]; } }
  for (let l = 2; l <= n; l <<= 1) { const th = ((inv ? 2 : -2) * Math.PI) / l; for (let i = 0; i < n; i += l) for (let j = 0; j < l / 2; j++) { const wr = Math.cos(th * j), wi = Math.sin(th * j), a = o + (i + j) * passo, b = o + (i + j + l / 2) * passo, xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; } }
}
export const ridotta = (u, v) => {
  for (let k = 0; k < 60; k++) { if (u[0] ** 2 + u[1] ** 2 > v[0] ** 2 + v[1] ** 2) [u, v] = [v, u]; const mu = Math.round((u[0] * v[0] + u[1] * v[1]) / (u[0] ** 2 + u[1] ** 2)); if (!mu) break; v = [v[0] - mu * u[0], v[1] - mu * u[1]]; }
  if (u[0] ** 2 + u[1] ** 2 > v[0] ** 2 + v[1] ** 2) [u, v] = [v, u];
  if (u[0] * v[1] - u[1] * v[0] < 0) v = [-v[0], -v[1]]; // base destrorsa
  return [u, v];
};
export function reticolo(mask, W, H) {
  let N = 1; while (N < Math.max(W, H)) N <<= 1; N *= 2; // con il bordo: l'autocorrelazione non si avvolge
  const sf = sfoca(mask, W, H, 2);
  let m = 0; for (const v of sf) m += v; m /= sf.length;
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) re[y * N + x] = sf[y * W + x] - m;
  for (let y = 0; y < N; y++) fft1(re, im, N, 1, y * N, false); for (let x = 0; x < N; x++) fft1(re, im, N, N, x, false);
  for (let i = 0; i < N * N; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; }
  for (let y = 0; y < N; y++) fft1(re, im, N, 1, y * N, true); for (let x = 0; x < N; x++) fft1(re, im, N, N, x, true);
  // l'autocorrelazione normalizzata dalla sovrapposizione (W − |x|)(H − |y|)
  const A = (x, y) => { if (Math.abs(x) >= W * 0.6 || Math.abs(y) >= H * 0.6) return -Infinity; return re[((y + N) % N) * N + ((x + N) % N)] / ((W - Math.abs(x)) * (H - Math.abs(y))); };
  const c = A(0, 0), picchi = [];
  for (let y = -Math.floor(H * 0.5); y <= Math.floor(H * 0.5); y++) for (let x = -Math.floor(W * 0.5); x <= Math.floor(W * 0.5); x++) {
    const r = Math.hypot(x, y); if (r < 5) continue;
    const v = A(x, y); if (!(v > 0.05 * c)) continue;
    let mx = true; for (let dy = -1; dy <= 1 && mx; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && A(x + dx, y + dy) > v) { mx = false; break; }
    if (mx) picchi.push({ x, y, r, v });
  }
  const vmax = Math.max(...picchi.map((p) => p.v)); for (let i = picchi.length - 1; i >= 0; i--) if (picchi[i].v < 0.6 * vmax) picchi.splice(i, 1);
  picchi.sort((a, b) => a.r - b.r);
  const fine = (p) => { // sub-pixel: una parabola per asse
    const v0 = A(p.x, p.y), px = (A(p.x - 1, p.y) - A(p.x + 1, p.y)) / (2 * (A(p.x - 1, p.y) - 2 * v0 + A(p.x + 1, p.y))), py = (A(p.x, p.y - 1) - A(p.x, p.y + 1)) / (2 * (A(p.x, p.y - 1) - 2 * v0 + A(p.x, p.y + 1)));
    return [p.x + (Number.isFinite(px) ? Math.max(-0.5, Math.min(0.5, px)) : 0), p.y + (Number.isFinite(py) ? Math.max(-0.5, Math.min(0.5, py)) : 0)];
  };
  const p1 = picchi[0]; if (!p1) return null;
  const p2 = picchi.find((q) => Math.abs(p1.x * q.y - p1.y * q.x) > 0.3 * p1.r * q.r); if (!p2) return null;
  // la riduzione si fa sui picchi interi (esatta), poi si rifiniscono i due vettori ridotti, che sono picchi anch'essi
  const [u, v] = ridotta([p1.x, p1.y], [p2.x, p2.y]);
  let q = [...fine({ x: u[0], y: u[1] }), ...fine({ x: v[0], y: v[1] })];
  const nitidezza = (q) => { const t = ripiega(mask, W, H, [q[0], q[1]], [q[2], q[3]], 32).media; let a = 0, b = 0; for (const x of t) { a += x; b += x * x; } a /= t.length; return b / t.length - a * a; };
  let best = nitidezza(q);
  for (const passo of [0.5, 0.25, 0.1]) for (let giro = 0, meglio = true; meglio && giro < 20; giro++) {
    meglio = false;
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) { const r = [...q]; r[k] += s * passo; const v2 = nitidezza(r); if (v2 > best) { best = v2; q = r; meglio = true; } }
  }
  return { p1: [q[0], q[1]], p2: [q[2], q[3]], picchi: picchi.length, nitidezza: best };
}

function sfoca(m, W, H, sigma) {
  const r = Math.ceil(3 * sigma), k = []; for (let i = -r; i <= r; i++) k.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  const z = k.reduce((a, b) => a + b, 0), t = new Float64Array(W * H), o = new Float64Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let i = -r; i <= r; i++) { const X = Math.min(W - 1, Math.max(0, x + i)); s += k[i + r] * m[y * W + X]; } t[y * W + x] = s / z; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let s = 0; for (let i = -r; i <= r; i++) { const Y = Math.min(H - 1, Math.max(0, y + i)); s += k[i + r] * t[Y * W + x]; } o[y * W + x] = s / z; }
  return o;
}

// ---------- 3. il ripiegamento
export function ripiega(mask, W, H, p1, p2, G = 64, origine = [0, 0]) {
  const det = p1[0] * p2[1] - p1[1] * p2[0], s = new Float64Array(G * G), n = new Float64Array(G * G);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = x - origine[0], Y = y - origine[1];
    let f = (X * p2[1] - Y * p2[0]) / det, g = (p1[0] * Y - p1[1] * X) / det; f -= Math.floor(f); g -= Math.floor(g);
    const i = Math.min(G - 1, Math.floor(f * G)), j = Math.min(G - 1, Math.floor(g * G));
    s[j * G + i] += mask[y * W + x]; n[j * G + i]++;
  }
  const media = new Float64Array(G * G); for (let i = 0; i < G * G; i++) media[i] = n[i] ? s[i] / n[i] : 0;
  // la soglia: la frazione d'inchiostro della tessera è quella dell'immagine (quantile), così linee sottili non spariscono
  let f = 0; for (const v of mask) f += v; f /= mask.length;
  const ord = Array.from(media).sort((a, b) => b - a), soglia = Math.max(1e-6, ord[Math.min(G * G - 1, Math.floor(f * G * G))]);
  return { media, mask: Uint8Array.from(media, (v) => (v >= soglia && v > 0 ? 1 : 0)), G };
}

// ---------- 4. lo scheletro sul toro (Zhang e Suen, con gli indici che si avvolgono)
const ANELLO = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
export function scheletroToro(m, G) {
  const s = Uint8Array.from(m), at = (x, y) => s[(((y % G) + G) % G) * G + (((x % G) + G) % G)];
  for (let cambiato = true; cambiato;) {
    cambiato = false;
    for (const passo of [0, 1]) {
      const via = [];
      for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
        if (!s[y * G + x]) continue;
        const P = ANELLO.map(([dx, dy]) => at(x + dx, y + dy)), B = P.reduce((a, b) => a + b, 0);
        if (B < 2 || B > 6) continue;
        let A = 0; for (let i = 0; i < 8; i++) if (!P[i] && P[(i + 1) % 8]) A++;
        if (A !== 1) continue;
        const [N, , E, , S, , O] = P;
        if (passo === 0 ? (N * E * S || E * S * O) : (N * E * O || N * S * O)) continue;
        via.push(y * G + x);
      }
      for (const p of via) s[p] = 0;
      if (via.length) cambiato = true;
    }
  }
  return s;
}

// ---------- 5–6. il grafo sul toro e i tratti chiusi con la classe di giro
export function trattiChiusi(s, G) {
  const idx = (x, y) => (((y % G) + G) % G) * G + (((x % G) + G) % G);
  const vic = (p) => { const x = p % G, y = (p - x) / G, out = []; for (const [dx, dy] of ANELLO) { const q = idx(x + dx, y + dy); if (s[q]) out.push({ q, dx, dy }); } return out; };
  const grado = new Uint8Array(G * G); for (let p = 0; p < G * G; p++) if (s[p]) grado[p] = vic(p).length;
  const nodo = (p) => grado[p] !== 2;
  // gli archi: cammini tra nodi (o anelli senza nodi), con lo spostamento srotolato
  const visto = new Set(), archi = [];
  const cammina = (p0, primo) => {
    const pts = [p0]; let prec = p0, cur = primo.q, sx = primo.dx, sy = primo.dy, passi = 0;
    while (!nodo(cur) && cur !== p0 && passi++ < G * G) {
      pts.push(cur);
      const avanti = vic(cur).filter((v) => v.q !== prec);
      if (!avanti.length) break;
      // in croce prima che in diagonale
      const v = avanti.find((a) => !a.dx || !a.dy) ?? avanti[0];
      prec = cur; cur = v.q; sx += v.dx; sy += v.dy;
    }
    pts.push(cur);
    return { pts, da: p0, a: cur, d: [sx, sy] };
  };
  for (let p = 0; p < G * G; p++) {
    if (!s[p] || !nodo(p) || grado[p] === 0) continue;
    for (const v of vic(p)) {
      const chiave = `${p}>${v.q}`; if (visto.has(chiave)) continue;
      const a = cammina(p, v); visto.add(chiave);
      const ul = a.pts.length > 1 ? `${a.a}>${a.pts[a.pts.length - 2]}` : null; if (ul) visto.add(ul);
      archi.push(a);
    }
  }
  // gli anelli senza nodi (tutti di grado 2)
  const usato = new Uint8Array(G * G); for (const a of archi) for (const q of a.pts) usato[q] = 1;
  for (let p = 0; p < G * G; p++) {
    if (!s[p] || usato[p] || grado[p] !== 2) continue;
    const v = vic(p)[0], a = cammina(p, v); for (const q of a.pts) usato[q] = 1;
    if (a.a === p) archi.push({ ...a, anello: true });
  }
  // i tratti: si concatenano gli archi, a ogni nodo per la via più diritta
  const dir = (a, dallaFine) => { const P = a.pts, k = Math.min(4, P.length - 1); const [i, j] = dallaFine ? [P.length - 1 - k, P.length - 1] : [0, k]; const d = (q, r) => { let dx = (r % G) - (q % G), dy = Math.floor(r / G) - Math.floor(q / G); dx -= G * Math.round(dx / G); dy -= G * Math.round(dy / G); return [dx, dy]; }; return d(P[i], P[j]); };
  const tratti = [], fatto = new Set();
  archi.forEach((a0, i0) => {
    if (fatto.has(i0)) return;
    if (a0.anello) { fatto.add(i0); tratti.push({ d: a0.d, pixel: a0.pts.length, chiuso: true }); return; }
    let d = [...a0.d], pix = a0.pts.length, cur = a0, giri = 0, chiuso = false; const usati = [i0];
    while (giri++ < 200) {
      const fine = cur.a, din = dir(cur, true);
      let best = null, bestC = -2;
      archi.forEach((b, j) => {
        if (fatto.has(j) || usati.includes(j) && j !== i0) return;
        for (const verso of [1, -1]) {
          const inizio = verso === 1 ? b.da : b.a; if (inizio !== fine) continue;
          const db = verso === 1 ? dir(b, false) : dir(b, true).map((x) => -x);
          const c = (din[0] * db[0] + din[1] * db[1]) / (Math.hypot(...din) * Math.hypot(...db) || 1);
          if (c > bestC) { bestC = c; best = { b, j, verso }; }
        }
      });
      if (!best) break;
      if (best.j === i0 && best.verso === 1) { chiuso = true; break; }
      if (usati.includes(best.j)) break;
      usati.push(best.j); d = [d[0] + best.verso * best.b.d[0], d[1] + best.verso * best.b.d[1]]; pix += best.b.pts.length;
      cur = best.verso === 1 ? best.b : { ...best.b, a: best.b.da, pts: [...best.b.pts].reverse() };
    }
    for (const j of usati) fatto.add(j);
    tratti.push({ d, pixel: pix, chiuso });
  });
  return tratti.map((t) => { const m = [Math.round(t.d[0] / G), Math.round(t.d[1] / G)]; if (m[0] < 0 || (m[0] === 0 && m[1] < 0)) { m[0] = -m[0]; m[1] = -m[1]; } return { ...t, m: [m[0] || 0, m[1] || 0] }; });
}

// LE CLASSI DI GIRO PER COMPONENTE: ogni pezzo connesso dello scheletro sul toro si percorre in ampiezza con le
// coordinate srotolate; ogni lato che richiude un ciclo dà lo spostamento del ciclo, e (m₁, m₂) = spostamento/G.
// I cicli di una componente generano un sottoreticolo di Z²: se è {0} la componente si chiude nella cella (classe
// (0, 0)); se è generato da un vettore, sono linee parallele di quella classe; se da due, è una rete.
export function classiDiGiro(s, G, minimo = 8) {
  const vis = new Int32Array(G * G).fill(-1), ux = new Float64Array(G * G), uy = new Float64Array(G * G), comp = [];
  for (let p0 = 0; p0 < G * G; p0++) {
    if (!s[p0] || vis[p0] >= 0) continue;
    const id = comp.length, coda = [p0], gen = []; vis[p0] = id; ux[p0] = p0 % G; uy[p0] = Math.floor(p0 / G);
    for (let a = 0; a < coda.length; a++) {
      const p = coda[a], x = p % G, y = (p - x) / G;
      for (const [dx, dy] of ANELLO) {
        const X = (((x + dx) % G) + G) % G, Y = (((y + dy) % G) + G) % G, q = Y * G + X; if (!s[q]) continue;
        const ex = ux[p] + dx, ey = uy[p] + dy;
        if (vis[q] < 0) { vis[q] = id; ux[q] = ex; uy[q] = ey; coda.push(q); }
        else { const m = [Math.round((ex - ux[q]) / G), Math.round((ey - uy[q]) / G)]; if (m[0] || m[1]) gen.push(m); }
      }
    }
    if (coda.length < minimo) continue;
    comp.push({ pixel: coda.length, generatori: baseIntera(gen) });
  }
  return comp;
}
// una base del sottoreticolo di Z² generato da una lista di vettori interi (riduzione di tipo Euclide)
function baseIntera(v) {
  let b = [];
  for (const w0 of v) {
    let w = [...w0];
    b.push(w);
    // riduci: una base di al più due vettori, con la prima componente a gradini (forma di Hermite)
    let a = b.map((x) => [...x]); b = [];
    // prima colonna
    for (;;) { a = a.filter((x) => x[0] || x[1]); const nz = a.filter((x) => x[0]); if (nz.length <= 1) break; nz.sort((p, q) => Math.abs(p[0]) - Math.abs(q[0])); const piv = nz[0]; for (const x of nz.slice(1)) { const k = Math.trunc(x[0] / piv[0]); x[0] -= k * piv[0]; x[1] -= k * piv[1]; } }
    const piv = a.find((x) => x[0]), resto = a.filter((x) => !x[0]).map((x) => Math.abs(x[1])).filter(Boolean);
    let g = 0; const mcd = (p, q) => (q ? mcd(q, p % q) : p); for (const r of resto) g = mcd(g, r);
    if (piv) { const pv = piv[0] < 0 ? [-piv[0], -piv[1]] : [...piv]; if (g) pv[1] = ((pv[1] % g) + g) % g; b.push(pv); }
    if (g) b.push([0, g]);
  }
  return b;
}

// ---------- tutta la decodifica
export function decodificaCella(g, W, H, { G = 64 } = {}) {
  const { mask, campiture } = mascheraLinee(g, W, H), R = reticolo(mask, W, H);
  if (!R) return null;
  const t = ripiega(mask, W, H, R.p1, R.p2, G), sch = scheletroToro(t.mask, G), tr = trattiChiusi(sch, G);
  const lunghi = tr.filter((x) => x.chiuso && x.pixel >= G / 4);
  const classi = [...new Set(lunghi.map((x) => x.m.join(',')))].map((s) => s.split(',').map(Number));
  const componenti = classiDiGiro(sch, G, G / 4);
  return { campiture, ...R, tessera: t, scheletro: sch, tratti: tr, classi, componenti };
}
