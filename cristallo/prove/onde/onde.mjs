// onde stazionarie in un cristallo: f(r) = Σ_orbite A Σ_{G in orbita} cos(G·r); linea nodale f=0 e segno = controcampo
import { scriviPNG } from '../../src/png.js';
const T = 360, M = 3, W = T * M, H = T * 2, img = new Uint8Array(W * H);
const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
// reticolo reciproco: esagonale b1=(1,1/√3), b2=(0,2/√3) (·2π); quadrato b1=(1,0), b2=(0,1)
const REC = { esa: [[1, 1 / Math.sqrt(3)], [0, 2 / Math.sqrt(3)]], qua: [[1, 0], [0, 1]] };
function orbita(tipo, h, k) { const [b1, b2] = REC[tipo], G = [h * b1[0] + k * b2[0], h * b1[1] + k * b2[1]], n = tipo === 'esa' ? 6 : 4, out = [];
  for (let s of [1, -1]) for (let i = 0; i < n; i++) { const g = rot([G[0], s * G[1]], (2 * Math.PI * i) / n); if (!out.some((q) => Math.hypot(q[0] - g[0], q[1] - g[1]) < 1e-9)) out.push(g); } return out; }
const esempi = [
  ['esa', [[1, 0, 1]]], ['esa', [[1, 0, 1], [1, 1, -0.7]]], ['esa', [[1, 0, 1], [2, 0, 0.55]]],
  ['qua', [[1, 0, 1], [1, 1, 0.6]]], ['qua', [[1, 0, 1], [2, 1, -0.45]]], ['esa', [[1, 1, 1], [2, 0, 0.5], [1, 0, -0.35]]],
];
esempi.forEach(([tipo, onde], e) => {
  const termini = onde.flatMap(([h, k, A]) => orbita(tipo, h, k).map((g) => [g[0] * 2 * Math.PI, g[1] * 2 * Math.PI, A]));
  const ox = (e % M) * T, oy = Math.floor(e / M) * T, scala = 3.2; // celle per riquadro
  for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
    const x = (i / T) * scala, y = (j / T) * scala; let f = 0, fx = 0, fy = 0;
    for (const [gx, gy, A] of termini) { const p = gx * x + gy * y; f += A * Math.cos(p); fx -= A * gx * Math.sin(p); fy -= A * gy * Math.sin(p); }
    const d = Math.abs(f) / (Math.hypot(fx, fy) + 1e-9) * (T / scala); // distanza in pixel dalla linea nodale
    const linea = Math.max(0, Math.min(1, 1.6 - d)); const fondo = f > 0 ? 236 : 150;
    img[(oy + j) * W + ox + i] = Math.round(fondo * (1 - linea) + 20 * linea);
  }
  for (let j = 0; j < T; j++) img[(oy + j) * W + ox] = 255; for (let i = 0; i < T; i++) img[oy * W + ox + i] = 255;
});
scriviPNG('./prove/onde/onde.png', img, W, H);
console.log('fatto');
