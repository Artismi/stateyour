// test_preparazione.mjs — la pulizia rende leggibili immagini sporche, negative, a solo colore
import assert from 'node:assert/strict';
import { leggiPNG } from '../strumenti/png.mjs';
import { decodifica, mascheraOriginale } from '../src/decodifica.js';
import { serve, prepara } from '../src/preparazione.js';

const img = leggiPNG(new URL('../esempi/greco_6.png', import.meta.url).pathname), W = img.larghezza, H = img.altezza, C = img.canali;
const rif = decodifica(img), R = mascheraOriginale(rif), rit = rif.misure.ritaglio;
const iou = (a) => { let i = 0, u = 0; for (let y = rit[1]; y < rit[3]; y++) for (let x = rit[0]; x < rit[2]; x++) { const k = y * W + x; if (a[k] && R[k]) i++; if (a[k] || R[k]) u++; } return i / u; };
let seme = 7; const rnd = () => ((seme = (seme * 16807) % 2147483647) / 2147483647);
const copia = (f) => { const d = new Uint8ClampedArray(W * H * 4); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * C, o = (y * W + x) * 4; const [r, g, b] = f(img.dati[i], img.dati[i + 1], img.dati[i + 2], x, y, R[y * W + x]); d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = 255; } return { larghezza: W, altezza: H, canali: 4, dati: d }; };

assert.equal(serve(img).serve, false, 'una tavola già pulita non si tocca');
const casi = {
  // ombra da sinistra a destra, rumore forte, dominante gialla
  foto: [copia((r, g, b, x, y) => { const k = 0.45 + 0.75 * (x / W) * (0.6 + 0.4 * (y / H)); const z = () => (rnd() - 0.5) * 60; return [r * k * 1.05 + z(), g * k + z(), b * k * 0.75 + z()]; }), 0.6],
  // chiaro su scuro
  negativo: [copia((r, g, b) => [255 - r, 255 - g, 255 - b]), 0.75],
  // il disegno ha la stessa luminosità del fondo: cambia solo il colore
  colore: [(() => { let s = [0, 0, 0], n = 0; for (let i = 0; i < W * H; i++) if (!R[i]) { s[0] += img.dati[i * C]; s[1] += img.dati[i * C + 1]; s[2] += img.dati[i * C + 2]; n++; } const L = (0.299 * s[0] + 0.587 * s[1] + 0.114 * s[2]) / n, v = [L * 0.55, L * 1.25, L * 0.55], k = L / (0.299 * v[0] + 0.587 * v[1] + 0.114 * v[2]); return copia((r, g, b, x, y, ink) => (ink ? v.map((c) => c * k) : [r, g, b])); })(), 0.7],
};
for (const [nome, [im, minimo]] of Object.entries(casi)) {
  const s = serve(im);
  assert.ok(s.serve, `${nome}: la pulizia deve scattare`);
  const v = iou(prepara(im).maschera);
  console.log(`  ✓ ${nome}: pulita (${s.motivi.join('; ')}), il disegno ritrovato al ${(v * 100).toFixed(1)}%`);
  assert.ok(v >= minimo, `${nome}: ${v}`);
}
console.log('preparazione: tutto ok');
