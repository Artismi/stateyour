// casi.mjs — le situazioni delle prove (punto 8), scritte come indirizzi completi.
import { PREDEFINITO } from '../src/indirizzo.js';

export function config(cambi = {}) {
  const p = structuredClone(PREDEFINITO);
  for (const [k, v] of Object.entries(cambi)) {
    if (k === 'reticolo' || k === 'finestra') p[k] = { ...p[k], ...v }; else p[k] = structuredClone(v);
  }
  return p;
}
const piano = (sistema, centratura = 'P') => ({ sistema, centratura, piano: true, a: 1, b: 1, c: 10, alfa: 90, beta: 90, gamma: sistema === 'esagonale' ? 120 : 90 });
const giu = { C: [0, 0, 0], R: Infinity, n: [0, 0, 1], psi: 0, L: 4, D: 3 };
const dir = (gradi, v) => [v * Math.cos((gradi * Math.PI) / 180), v * Math.sin((gradi * Math.PI) / 180), 0];

export const CASI = {
  // L1, energia alta, lancio lungo una fila: la pallina tra due file di colline (y = 0 e y = 1), a 3° dall'asse x
  canale: config({ reticolo: piano('quadrato'), atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.15, r0: [0, 0.5, 0], v0: dir(3, Math.sqrt(2 * 5)), finestra: giu, tempo: 60 }),
  // L1, energia appena sopra le colline: il biliardo di Sinai morbido (colline larghe, w = 0,3; E = 0,6 U₀ in tutto)
  caos: config({ reticolo: piano('esagonale'), atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.3, r0: [0.5, 0.2886751345948129, 0], v0: dir(17, 0.9), finestra: giu, tempo: 300 }),
  // L1, conche, energia bassa: la pallina resta nella sua conca e gira
  conche: config({ reticolo: piano('quadrato'), atomi: [{ p: [0, 0, 0], s: -1 }], w: 0.15, r0: [0.06, 0, 0], v0: [0, 0.55, 0], finestra: giu, tempo: 120 }),
  // L2 da sola: cerchi (raggio v/Ω = 0,5)
  magnete: config({ reticolo: piano('quadrato'), atomi: [], r0: [0, 0, 0], v0: [1, 0, 0], B: [0, 0, 2], finestra: giu, tempo: 60 }),
  // L1 + L2: cerchi che toccano le colline
  rosette: config({ reticolo: piano('quadrato'), atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.12, r0: [0.5, 0.5, 0], v0: [1.4, 0, 0], B: [0, 0, 4], finestra: giu, tempo: 120 }),
  // nello spazio: cubico a facce centrate, colline, lancio obliquo
  spazio: config({ reticolo: { sistema: 'cubico', centratura: 'F' }, atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.15, r0: [0.25, 0.25, 0.1], v0: [2.2, 0.9, 0.4], tempo: 100 }),
  // nello spazio, caldo
  caldo: config({ reticolo: { sistema: 'cubico', centratura: 'I' }, atomi: [{ p: [0, 0, 0], s: 1 }], w: 0.15, r0: [0.25, 0.1, 0.1], v0: [2.4, 0.5, 0.2], T: 0.01, difetti: 0.01, tempo: 100 }),
};
export { piano, dir };
