// test_vortici.mjs — i vortici del mare a mesoscala (src/camera/vortici.js) contro le statistiche di Chelton e altri 2011.
// Su un mare finto (tutto acqua, la temperatura che cala verso i poli, la Terra per raggio e rotazione, c₁ = 2,5 m/s): niente
// soglie nuove, si confrontano i numeri del censimento con quelli che l'articolo dà a parte.
import assert from 'node:assert/strict';
import { creaVortici, STATISTICHE_TERRA, CHELTON } from '../src/camera/vortici.js';
let n = 0; const prova = (nome, f) => { f(); n++; console.log(`  ✓ ${nome}`); };
const W = 128, H = 64, T = new Float32Array(W * H); for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) T[j * W + i] = 300 - 30 * Math.abs(90 - ((j + 0.5) * 180) / H) / 90;
const giorno = 86164, Om = (2 * Math.PI) / giorno, R = 6.371e6;
const stato = { esiste: true, raggioM: R, raggioVortici: 2.5 / (Math.SQRT2 * Om), termoclino: 500, Tmedia: 288, temperatura: T, W, H, fine: { W, H, tipo: new Uint8Array(W * H).fill(1) }, radice: 'prova/mare' };
console.log('vortici.js');
prova('la vita media di chi passa le 16 settimane, dalla curva del censimento, è quella dell\'articolo (32 settimane) entro il 5%', () => {
  const { settimane: t, quanti: q } = CHELTON; let s = 0; for (let i = 1; i + 1 < t.length; i++) s += (q[i] - q[i + 1]) / Math.log(q[i] / q[i + 1]) * (t[i + 1] - t[i]); s += q[q.length - 1] / (Math.log(q[4] / q[5]) / (t[5] - t[4]));
  const media = 16 + s / q[1]; assert.ok(Math.abs(media - 32) / 32 < 0.05, `media ${media}`);
  assert.ok(STATISTICHE_TERRA.copertura > 0.1 && STATISTICHE_TERRA.copertura < 0.4);
});
const V = creaVortici(stato, { giorno });
prova('gli stessi vortici da ogni distanza: quelli vicini a un punto sono anche tra quelli di un raggio più grande, uguali', () => {
  const a = V.vicini(0.3, 0.6, 5e5, 1e8, 999), b = V.vicini(0.3, 0.6, 2e6, 1e8, 999), chiave = (e) => `${e.lon.toFixed(9)} ${e.lat.toFixed(9)} ${e.Ls.toFixed(3)}`;
  const sb = new Set(b.map(chiave)); assert.ok(a.length > 0); for (const e of a) assert.ok(sb.has(chiave(e)));
});
prova('U/(β·L_s²) ≥ 1 e L_s ≥ R_d; a 30° la mediana di L_s è circa 2,2 R_d; la parte del mare dentro un vortice è quella della Terra (entro il 30%)', () => {
  const L = V.vicini(0, 30 * Math.PI / 180, 3e6, 2e8, 1e5); let area = 0; const Ls = [];
  for (const e of L) { const fi = V.fisica(e.lat); assert.ok(e.Ls >= fi.Rd * 0.999); if (e.dist < 2e6 && Math.abs(e.lat - 30 * Math.PI / 180) < 0.1) Ls.push(e.Ls / fi.Rd); if (e.dist < 2e6) area += Math.PI * e.Ls * e.Ls; }
  Ls.sort((x, y) => x - y); const med = Ls[Ls.length >> 1]; assert.ok(med > 1.6 && med < 2.8, `mediana ${med}`);
  const cop = area / (Math.PI * 4e12); assert.ok(Math.abs(cop / STATISTICHE_TERRA.copertura - 1) < 0.3, `copertura ${cop}`);
});
prova('vanno verso ovest alla velocità delle onde di Rossby lunghe', () => {
  const a = V.vicini(0, 0.6, 1e6, 1e8, 999), b = V.vicini(0, 0.6, 1e6, 1e8 + 86400 * 10, 999); let k = 0;
  for (const e of a) { const f = b.find((x) => Math.abs(x.Ls / e.Ls - 1) < 1e-3 && Math.abs(x.lat - e.lat) < 1e-3); if (!f) continue; const c = V.fisica(e.lat).c, dx = (f.lon - e.lon) * R * Math.cos(e.lat); assert.ok(Math.abs(dx + c * 864000) < 0.2 * c * 864000, `${dx} ${c}`); k++; }
  assert.ok(k > 0);
});
console.log(`test_vortici: ${n} prove passate`);
