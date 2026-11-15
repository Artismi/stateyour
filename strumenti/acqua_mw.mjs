// acqua_mw.mjs — genera src/camera/acqua_mw.js: una scatola periodica di ACQUA LIQUIDA all'equilibrio, dalla sua legge.
//
// LA LEGGE: il potenziale mW (Molinero e Moore 2009, J. Phys. Chem. B 113, 4008): l'acqua come un sito solo per molecola,
// con un termine a due corpi e uno a tre corpi di Stillinger e Weber (1985) che premia gli angoli tetraedrici. Con tre
// parametri tarati su misure (energia di coesione, densità, temperatura di fusione) dà la struttura del liquido: la
// funzione di distribuzione radiale ossigeno-ossigeno, i quattro vicini tetraedrici, il massimo di densità.
//   φ2(r) = A·ε·[B·(σ/r)⁴ − 1]·exp(σ/(r − aσ))                              (r < aσ)
//   φ3 = λ·ε·(cos θ_jik − cos θ₀)²·exp(γσ/(r_ij − aσ))·exp(γσ/(r_ik − aσ))
//   ε = 6,189 kcal/mol, σ = 2,3925 Å, a = 1,8, λ = 23,15, γ = 1,2, cos θ₀ = −1/3, A = 7,049556277, B = 0,6022245584.
// IL METODO: Monte Carlo di Metropolis a numero, volume e temperatura fissi (1000 molecole alla densità misurata
// dell'acqua a 25 °C, 0,997 g/cm³; 298,15 K), partendo da un reticolo cubico fuso a 450 K. Lo spostamento massimo si
// adatta perché ne passi metà. Le esiti a caso vengono dalla fonte degli eventi («acqua mW/monte carlo»).
// Si lancia a mano (node strumenti/acqua_mw.mjs): ~1 minuto. La prova (test/test_finestre.mjs) rilegge la scatola,
// ne misura la funzione di distribuzione radiale e controlla che qualche passo di Monte Carlo in più non la sposti.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sorgente } from '../src/camera/eventi.js';

export const MW = { eps: 6.189, sigma: 2.3925, a: 1.8, lambda: 23.15, gamma: 1.2, cos0: -1 / 3, A: 7.049556277, B: 0.6022245584 };
const KCAL = 0.0019872041; // kcal/mol/K
const rc = MW.a * MW.sigma;
export function phi2(r) { if (r >= rc) return 0; const s = MW.sigma / r, s4 = s * s * s * s; return MW.A * MW.eps * (MW.B * s4 - 1) * Math.exp(MW.sigma / (r - rc)); }
const e3 = (r) => (r >= rc ? 0 : Math.exp((MW.gamma * MW.sigma) / (r - rc)));

// il sistema: posizioni (Å), lato, liste dei vicini (raggio rc + pelle)
export function creaSistema(pos, L) { return { pos, L, N: pos.length / 3, pelle: 0.8, liste: null, rif: null }; }
function dist(S, i, j, xi, yi, zi) { let x = S.pos[3 * j] - xi, y = S.pos[3 * j + 1] - yi, z = S.pos[3 * j + 2] - zi; const L = S.L; x -= L * Math.round(x / L); y -= L * Math.round(y / L); z -= L * Math.round(z / L); return [x, y, z]; }
export function rifaiListe(S) {
  const { N, L, pos } = S, R = rc + S.pelle, nc = Math.max(3, Math.floor(L / R)), cel = L / nc, testa = new Int32Array(nc ** 3).fill(-1), dopo = new Int32Array(N);
  const cella = (i) => { const a = ((Math.floor(pos[3 * i] / cel) % nc) + nc) % nc, b = ((Math.floor(pos[3 * i + 1] / cel) % nc) + nc) % nc, c = ((Math.floor(pos[3 * i + 2] / cel) % nc) + nc) % nc; return [a, b, c]; };
  for (let i = 0; i < N; i++) { const [a, b, c] = cella(i), k = (c * nc + b) * nc + a; dopo[i] = testa[k]; testa[k] = i; }
  S.liste = []; for (let i = 0; i < N; i++) { const [a, b, c] = cella(i), l = []; const visti = new Set();
    for (let dc = -1; dc <= 1; dc++) for (let db = -1; db <= 1; db++) for (let da = -1; da <= 1; da++) { const k = ((((c + dc) % nc) + nc) % nc * nc + (((b + db) % nc) + nc) % nc) * nc + (((a + da) % nc) + nc) % nc; if (visti.has(k)) continue; visti.add(k);
      for (let j = testa[k]; j >= 0; j = dopo[j]) { if (j === i) continue; const [x, y, z] = dist(S, i, j, pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]); if (x * x + y * y + z * z < R * R) l.push(j); } }
    S.liste.push(Int32Array.from(l)); }
  S.rif = Float64Array.from(pos);
}
// l'energia di tutto ciò che tocca la molecola i, con i messa in (xi, yi, zi)
function energiaLocale(S, i, xi, yi, zi) {
  const li = S.liste[i], vic = [], vv = []; let E = 0;
  for (const j of li) { const d = dist(S, i, j, xi, yi, zi), r = Math.hypot(d[0], d[1], d[2]); if (r < rc) { vic.push(j); vv.push([d[0], d[1], d[2], r]); E += phi2(r); } }
  // i al centro
  for (let p = 0; p < vic.length; p++) for (let q = p + 1; q < vic.length; q++) { const a = vv[p], b = vv[q], c = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (a[3] * b[3]) - MW.cos0; E += MW.lambda * MW.eps * c * c * e3(a[3]) * e3(b[3]); }
  // i a un capo, il centro j
  for (let p = 0; p < vic.length; p++) { const j = vic[p], a = vv[p], ax = -a[0], ay = -a[1], az = -a[2], ea = e3(a[3]), xj = S.pos[3 * j], yj = S.pos[3 * j + 1], zj = S.pos[3 * j + 2];
    for (const k of S.liste[j]) { if (k === i) continue; const b = dist(S, j, k, xj, yj, zj), rb = Math.hypot(b[0], b[1], b[2]); if (rb >= rc) continue; const c = (ax * b[0] + ay * b[1] + az * b[2]) / (a[3] * rb) - MW.cos0; E += MW.lambda * MW.eps * c * c * ea * e3(rb); } }
  return E;
}
export function energiaTotale(S) { let E2 = 0, E3 = 0; const { N, pos } = S;
  for (let i = 0; i < N; i++) { const vic = []; for (const j of S.liste[i]) { const d = dist(S, i, j, pos[3 * i], pos[3 * i + 1], pos[3 * i + 2]), r = Math.hypot(...d); if (r < rc) { if (j > i) E2 += phi2(r); vic.push([...d, r]); } }
    for (let p = 0; p < vic.length; p++) for (let q = p + 1; q < vic.length; q++) { const a = vic[p], b = vic[q], c = (a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) / (a[3] * b[3]) - MW.cos0; E3 += MW.lambda * MW.eps * c * c * e3(a[3]) * e3(b[3]); } }
  return (E2 + E3) / N; }
// passate di Monte Carlo (una passata = N tentativi); r(): esiti in (0, 1)
export function montecarlo(S, passate, T, r, { passo = 0.3, adatta = true } = {}) {
  const kT = KCAL * T, { N, pos, L } = S; let prove = 0, accettate = 0;
  if (!S.liste) rifaiListe(S);
  for (let ps = 0; ps < passate; ps++) {
    let acc = 0;
    for (let t = 0; t < N; t++) { const i = Math.floor(r() * N), x = pos[3 * i], y = pos[3 * i + 1], z = pos[3 * i + 2];
      const nx = x + passo * (2 * r() - 1), ny = y + passo * (2 * r() - 1), nz = z + passo * (2 * r() - 1), E0 = energiaLocale(S, i, x, y, z), E1 = energiaLocale(S, i, nx, ny, nz), dE = E1 - E0;
      if (dE <= 0 || r() < Math.exp(-dE / kT)) { pos[3 * i] = ((nx % L) + L) % L; pos[3 * i + 1] = ((ny % L) + L) % L; pos[3 * i + 2] = ((nz % L) + L) % L; acc++; } else r(); }
    prove += N; accettate += acc;
    if (adatta) passo *= acc / N > 0.5 ? 1.05 : 0.95;
    // le liste si rifanno quando qualcuno si è mosso più di metà della pelle
    let m = 0; for (let i = 0; i < N; i++) { const d = dist(S, i, i, S.rif[3 * i], S.rif[3 * i + 1], S.rif[3 * i + 2]); m = Math.max(m, d[0] * d[0] + d[1] * d[1] + d[2] * d[2]); }
    if (Math.sqrt(m) > S.pelle / 2) rifaiListe(S);
  }
  return { passo, accettate: accettate / Math.max(1, prove) };
}
export function generatoreMC(nome) { const c = sorgente(nome); let s = c.seme('monte carlo') >>> 0; return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return (((t ^ (t >>> 14)) >>> 0) + 0.5) / 4294967296; }; }

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const N1 = 10, N = N1 ** 3, rho = (0.997 / 18.015) * 6.02214076e23 * 1e-24, L = Math.cbrt(N / rho), a = L / N1, r = generatoreMC('acqua mW/monte carlo'), pos = new Float64Array(3 * N);
  for (let k = 0, q = 0; k < N1; k++) for (let j = 0; j < N1; j++) for (let i = 0; i < N1; i++) { pos[q++] = (i + 0.5) * a + 0.3 * (r() - 0.5); pos[q++] = (j + 0.5) * a + 0.3 * (r() - 0.5); pos[q++] = (k + 0.5) * a + 0.3 * (r() - 0.5); }
  const S = creaSistema(pos, L), t0 = performance.now(); rifaiListe(S);
  let m = montecarlo(S, 150, 450, r); console.log(`fuso a 450 K: ${((performance.now() - t0) / 1000).toFixed(1)} s, energia ${energiaTotale(S).toFixed(3)} kcal/mol, passo ${m.passo.toFixed(3)} Å, accettate ${(100 * m.accettate).toFixed(0)}%`);
  const blocchi = []; for (let b = 0; b < 20; b++) { m = montecarlo(S, 75, 298.15, r, { passo: m.passo }); blocchi.push(energiaTotale(S)); console.log(`298,15 K, blocco ${b + 1}: energia ${blocchi[b].toFixed(3)} kcal/mol, passo ${m.passo.toFixed(3)} Å, accettate ${(100 * m.accettate).toFixed(0)}%`); }
  const q = new Int16Array(3 * N); for (let i = 0; i < 3 * N; i++) q[i] = Math.max(-32768, Math.min(32767, Math.round((((pos[i] % L) + L) % L) / L * 65536 - 32768)));
  const b64 = Buffer.from(q.buffer).toString('base64');
  const testo = `// acqua_mw.js — GENERATO da strumenti/acqua_mw.mjs (non si scrive a mano): una scatola periodica di acqua liquida
// all'equilibrio col potenziale mW (Molinero e Moore 2009), ${N} molecole alla densità dell'acqua a 25 °C (0,997 g/cm³),
// 298,15 K, Monte Carlo di Metropolis (eventi: «acqua mW/monte carlo»). Le posizioni degli ossigeni, in 65536-esimi
// del lato (Int16, base64): la scatola è periodica. Energia per molecola alla fine: ${blocchi[blocchi.length - 1].toFixed(3)} kcal/mol
// (Molinero e Moore 2009: entalpia di vaporizzazione 10,65 kcal/mol a 298 K, cioè −(10,65 − RT) = −10,06 kcal/mol); energie degli ultimi blocchi: ${blocchi.slice(-6).map((x) => x.toFixed(3)).join(', ')}.
export const TEMPLATE_MW = { nome: 'acqua mW', fonte: 'Molinero e Moore 2009; strumenti/acqua_mw.mjs', T: 298.15, N: ${N}, latoNm: ${(L / 10).toFixed(6)}, energia: ${blocchi[blocchi.length - 1].toFixed(4)},
  posizioni: '${b64}' };
`;
  fs.writeFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/camera/acqua_mw.js'), testo);
  console.log(`scritto src/camera/acqua_mw.js (${(b64.length / 1024).toFixed(1)} kB) in ${((performance.now() - t0) / 1000).toFixed(1)} s`);
}
