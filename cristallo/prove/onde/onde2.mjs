import { scriviPNG } from '../../src/png.js';
const T = 360, M = 3, W = T * M, H = T * 2, img = new Uint8Array(W * H);
const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
const REC = { esa: [[1, 1 / Math.sqrt(3)], [0, 2 / Math.sqrt(3)]], qua: [[1, 0], [0, 1]] };
// orbita sotto le sole rotazioni (niente specchi): fase φ comune → motivo chirale che «gira»
function orbita(tipo, h, k) { const [b1, b2] = REC[tipo], G = [h * b1[0] + k * b2[0], h * b1[1] + k * b2[1]], n = tipo === 'esa' ? 6 : 4; return Array.from({ length: n }, (_, i) => rot(G, (2 * Math.PI * i) / n)); }
// livelli: linee a f = livelli; fondo a bande alterne tra i livelli
const esempi = [
  ['esa', [[1, 0, 1, 0], [2, 1, 0.8, 1.2]], [0]],
  ['esa', [[1, 0, 1, 0.4], [1, 1, 0.6, 2.0], [3, 1, 0.35, 0.9]], [0]],
  ['qua', [[1, 0, 1, 0], [2, 1, 0.7, 1.4]], [0]],
  ['esa', [[1, 0, 1, 0], [2, 1, 0.6, 0.8]], [-0.9, 0, 0.9]],
  ['qua', [[1, 0, 1, 0.3], [1, 1, 0.5, 0], [3, 1, 0.35, 2.2]], [-0.6, 0.6]],
  ['esa', [[1, 1, 1, 0], [3, 1, 0.55, 1.0], [2, 0, 0.3, 2.5]], [-0.5, 0.5]],
];
esempi.forEach(([tipo, onde, livelli], e) => {
  const termini = onde.flatMap(([h, k, A, ph]) => orbita(tipo, h, k).map((g) => [g[0] * 2 * Math.PI, g[1] * 2 * Math.PI, A, ph]));
  const ox = (e % M) * T, oy = Math.floor(e / M) * T, scala = 2.6;
  for (let j = 0; j < T; j++) for (let i = 0; i < T; i++) {
    const x = (i / T) * scala, y = (j / T) * scala; let f = 0, fx = 0, fy = 0;
    for (const [gx, gy, A, ph] of termini) { const p = gx * x + gy * y + ph; f += A * Math.cos(p); fx -= A * gx * Math.sin(p); fy -= A * gy * Math.sin(p); }
    const g = Math.hypot(fx, fy) + 1e-9; let dmin = 1e9; for (const L of livelli) dmin = Math.min(dmin, (Math.abs(f - L) / g) * (T / scala));
    const linea = Math.max(0, Math.min(1, 1.6 - dmin)); let banda = 0; for (const L of livelli) if (f > L) banda++;
    const fondo = banda % 2 ? 236 : 150;
    img[(oy + j) * W + ox + i] = Math.round(fondo * (1 - linea) + 20 * linea);
  }
  for (let j = 0; j < T; j++) img[(oy + j) * W + ox] = 255; for (let i = 0; i < T; i++) img[oy * W + ox + i] = 255;
});
scriviPNG('./prove/onde/onde2.png', img, W, H);
