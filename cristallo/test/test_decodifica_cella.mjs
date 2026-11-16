// test_decodifica_cella.mjs — la decodifica della cella su un'immagine sintetica di cui si sa tutto.
// TOLLERANZE (dichiarate prima): il reticolo ritrovato (a meno della scelta della base ridotta) entro 0,3 punti per
// componente; le classi di giro dei tratti chiusi lunghi sono esattamente {(0, 0), (1, 0)}: un cerchio attorno a ogni
// nodo e una retta lungo p₁.
import { decodificaCella, ridotta } from '../src/decodifica_cella.js';
import { prova, vero, sotto, fine, dice } from './prova.mjs';

console.log('decodifica della cella');
prova('reticolo, tessera e classi di giro di un motivo sintetico', () => {
  const W = 400, H = 300, p1 = [31.3, 4.2], p2 = [-7.9, 27.6], g = new Float32Array(W * H).fill(1);
  const det = p1[0] * p2[1] - p1[1] * p2[0];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let f = (x * p2[1] - y * p2[0]) / det, h = (p1[0] * y - p1[1] * x) / det; f -= Math.floor(f); h -= Math.floor(h);
    // nelle coordinate di cella: il cerchio di raggio 0,25 attorno a (0,5, 0,5) e la retta h = 0,1 (lungo p₁)
    const X = (f - 0.5) * p1[0] + (h - 0.5) * p2[0], Y = (f - 0.5) * p1[1] + (h - 0.5) * p2[1], r = Math.hypot(X, Y);
    const dRetta = Math.abs(h - 0.1) * (det / Math.hypot(...p1));
    if (Math.abs(r - 8) < 1.3 || dRetta < 1.3) g[y * W + x] = 0;
  }
  const d = decodificaCella(g, W, H);
  vero(d, 'nessun reticolo');
  const [a, b] = ridotta(p1, p2), err = Math.max(...[...d.p1.map((x, i) => Math.abs(x - a[i])), ...d.p2.map((x, i) => Math.abs(x - b[i]))]);
  const errAlt = Math.max(...[...d.p1.map((x, i) => Math.abs(x + a[i])), ...d.p2.map((x, i) => Math.abs(x + b[i]))]);
  dice('reticolo trovato', d.p1.map((x) => x.toFixed(2)), d.p2.map((x) => x.toFixed(2)), ' atteso', a, b, ' classi', JSON.stringify(d.classi), ' tratti', d.tratti.map((t) => `${t.m}:${t.pixel}${t.chiuso ? '' : '?'}`).join(' '));
  sotto(Math.min(err, errAlt), 0.3, 'reticolo');
  const cl = d.classi.map((m) => m.join(',')).sort();
  // la retta lungo p₁: nella base ridotta trovata la sua classe è quella di p₁ in quella base
  vero(cl.includes('0,0') && cl.length === 2, `classi ${cl}`);
});
fine('decodifica della cella');
