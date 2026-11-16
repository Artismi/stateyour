// toro.js — le immagini a linee sulla tessera (il toro G × G in coordinate di cella) e la loro distanza.
// Lo usano strumenti/cerca_tessere.mjs e strumenti/cerca_valli.mjs.
import { punti } from './orbite.js';

export const G = 64;
// ---------- il toro: distanza (chamfer 3-4) con l'avvolgimento, su una griglia 3 × 3 di tessere
export function distanzaToro(m) {
  const N = 3 * G, d = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) d[y * N + x] = m[(y % G) * G + (x % G)] ? 0 : 1e9;
  const g = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 1e9 : d[y * N + x]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; d[i] = Math.min(d[i], g(x - 1, y) + 3, g(x, y - 1) + 3, g(x - 1, y - 1) + 4, g(x + 1, y - 1) + 4); }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; d[i] = Math.min(d[i], g(x + 1, y) + 3, g(x, y + 1) + 3, g(x + 1, y + 1) + 4, g(x - 1, y + 1) + 4); }
  const c = new Float32Array(G * G); for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) c[y * G + x] = d[(y + G) * N + x + G] / 3;
  return c;
}
export const pixel = (m) => { const l = []; for (let i = 0; i < G * G; i++) if (m[i]) l.push(i); return l; };
export function distanzaTessere(A, B) {
  // A, B: { px: indici dei punti di linea, dt: distanza sul toro }
  let best = Infinity;
  for (const ruota of [false, true]) for (let sy = 0; sy < G; sy += 4) for (let sx = 0; sx < G; sx += 4) {
    const mappa = (i) => { let x = i % G, y = (i - x) / G; if (ruota) { x = G - 1 - x; y = G - 1 - y; } return ((y + sy) % G) * G + ((x + sx) % G); };
    const inversa = (j) => { let x = j % G, y = (j - x) / G; x = (x - sx + G) % G; y = (y - sy + G) % G; if (ruota) { x = G - 1 - x; y = G - 1 - y; } return y * G + x; };
    let a = 0; for (const i of B.px) a += A.dt[mappa(i)]; a /= B.px.length;
    if (a / G > best * 2) continue;
    let b = 0; for (const j of A.px) b += B.dt[inversa(j)]; b /= A.px.length;
    best = Math.min(best, (a + b) / 2 / G);
  }
  return best;
}
// le linee di un insieme di orbite sulla griglia del toro (coordinate di cella del cristallo)
export function tesseraDi(cr, orbite) {
  const m = new Uint8Array(G * G), Ar = cr.Ar;
  for (const o of orbite) {
    const { P } = punti(cr, o, [0, 0, 0]);
    for (let k = 1; k < P.length; k++) {
      const a = P[k - 1], b = P[k], q = Math.max(1, Math.ceil(2 * G * Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let t = 0; t <= q; t++) {
        const x = a[0] + ((b[0] - a[0]) * t) / q, y = a[1] + ((b[1] - a[1]) * t) / q;
        let f = x * Ar[0][0] + y * Ar[0][1], g = x * Ar[1][0] + y * Ar[1][1]; f -= Math.floor(f); g -= Math.floor(g);
        m[Math.min(G - 1, Math.floor(g * G)) * G + Math.min(G - 1, Math.floor(f * G))] = 1;
      }
    }
  }
  return m;
}
// la classe m è nel sottoreticolo generato da gen (o è (0, 0) se gen è vuoto)?
export function nelReticolo(m, gens) {
  if (!gens.length) return !m[0] && !m[1];
  if (!m[0] && !m[1]) return false;
  const [g1, g2] = gens;
  if (!g2) { const c = g1[0] ? m[0] / g1[0] : m[1] / g1[1]; return Number.isInteger(c) && m[0] === c * g1[0] && m[1] === c * g1[1]; }
  const det = g1[0] * g2[1] - g1[1] * g2[0], a = (m[0] * g2[1] - m[1] * g2[0]) / det, b = (g1[0] * m[1] - g1[1] * m[0]) / det;
  return Math.abs(a - Math.round(a)) < 1e-9 && Math.abs(b - Math.round(b)) < 1e-9;
}

// ---------- la cella del cristallo dalla cella del riferimento
export function cellaDi(p1, p2) {
  const r = Math.hypot(...p2) / Math.hypot(...p1), ang = (Math.acos((p1[0] * p2[0] + p1[1] * p2[1]) / (Math.hypot(...p1) * Math.hypot(...p2))) * 180) / Math.PI;
  const vicino = (a, b, e) => Math.abs(a - b) < e;
  if (vicino(r, 1, 0.05) && vicino(ang, 90, 3)) return { sistema: 'quadrato', b: 1, gamma: 90 };
  if (vicino(r, 1, 0.05) && vicino(ang, 120, 3)) return { sistema: 'esagonale', b: 1, gamma: 120 };
  if (vicino(ang, 90, 3)) return { sistema: 'rettangolare', b: r, gamma: 90 };
  return { sistema: 'obliquo', b: r, gamma: ang };
}

