// stelle.js — PROTOTIPO in costruzione (vedi intestazione finale)
import { COSTANTI, MSOLE, RSOLE, LSOLE, ANNO } from './leggi.js';

const K = COSTANTI;
export const ALFA = 1 / 137.036;
const A_RAD = (4 * K.sigma) / K.c, MB = K.mp, MEV = 1e6 * K.e, KEVB = 1e3 * K.e * 1e-28;
const E2 = ALFA * K.hbar * K.c; // e²/(4πε₀)
const SIGMA_T = ((8 * Math.PI) / 3) * (E2 / (K.me * K.c * K.c)) ** 2;
const PI4 = 4 * Math.PI;

// ---------- DATI
export const DATI = {
  S11: [4.01e-22 * KEVB, 4.49e-24 * 1e-28, 0], // J·m², m², m²/J
  S114: [1.66 * KEVB, -3.3e-3 * 1e-28, (4.4e-5 * 1e-28) / (1e3 * K.e)],
  Q4: 26.731 * MEV, nuPP: 2 * 0.265 * MEV, nuCNO: 1.71 * MEV,
  Cbf: 4.34e21, ghigliottina: [0.708, 0.2],
  Hmeno: 7.9e-34, molecole: 1e-11,
  ZSOLE: 0.0142, YSOLE: 0.2703, YPRIMO: 0.247, CN: 0.257,
  H2: { D0: 4.478 * K.e, rot: 85.4, vib: 6332 }, alfaConv: Infinity,
};
export const OPZ = { H2: true, schermo: true, ghig: true, mol: true };

// ---------- Lane-Emden: il polìtropo di indice n, integrato (Runge-Kutta 4). Serve per i controlli e per le costanti.
export function laneEmden(n, h = 0.005) {
  let x = h, y = 1 - (x * x) / 6 + (n * x ** 4) / 120, z = -x / 3 + (n * x ** 3) / 30;
  const f = (x, y, z) => -Math.pow(Math.max(y, 0), n) - (2 * z) / x;
  for (;;) {
    const k1y = z, k1z = f(x, y, z), k2y = z + 0.5 * h * k1z, k2z = f(x + 0.5 * h, y + 0.5 * h * k1y, k2y);
    const k3y = z + 0.5 * h * k2z, k3z = f(x + 0.5 * h, y + 0.5 * h * k2y, k3y), k4y = z + h * k3z, k4z = f(x + h, y + h * k3y, k4y);
    const y1 = y + (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y), z1 = z + (h / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    if (y1 <= 0) { const t = y / (y - y1), xi1 = x + t * h, d = z + t * (z1 - z); return { n, xi1, m1: -xi1 * xi1 * d }; }
    x += h; y = y1; z = z1;
  }
}

// ---------- LA STRUTTURA DI PROVA. Dentro (zona radiativa): il modello standard di Eddington, P ∝ T⁴ (polìtropo
// n = 3), ma con la densità che segue il peso molecolare guscio per guscio: ρ ∝ μ(m)·T³. Fuori, da dove
// T/T_c = c, un involucro adiabatico (P ∝ ρ^5/3: la zona convettiva). c = 1: tutta convettiva; c = 0: niente
// involucro. Si integra l'equilibrio idrostatico (Runge-Kutta 4) nelle variabili di Lane-Emden:
//   dθ/dξ = −μ̃·m̃/ξ²,  dm̃/dξ = ξ²·μ̃·θ³   (dentro);   ds/dξ = −(8ρ̃f/5P̃f)·m̃/ξ²,  dm̃/dξ = ξ²·ρ̃f·s^3/2   (fuori)
const NG = 40; // gusci di massa (uguali per tutte le stelle: la composizione vive lì)
const QB = Float64Array.from({ length: NG + 1 }, (_, k) => Math.sin((Math.PI * k) / (2 * NG)) ** 2);
const QC = Float64Array.from({ length: NG }, (_, k) => Math.sin((Math.PI * (k + 0.5)) / (2 * NG)) ** 2);
const CS = [0, 0.006, 0.012, 0.02, 0.03, 0.04, 0.055, 0.07, 0.09, 0.11, 0.135, 0.165, 0.2, 0.24, 0.29, 0.35, 0.42, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
export const C_MIN = CS[1];
const HX = 0.04, NP = 1200, IX = new Float64Array(NP), IM = new Float64Array(NP), IZ = new Float64Array(NP), IP = new Float64Array(NP), ID = new Float64Array(NP);
const MS0 = new Float64Array(CS.length).fill(2.018); // m̃ totale: l'ultimo valore trovato per ogni c (punto di partenza)
export const CONTA = { valuta: 0, membri: 0 };
function membro(mu, jc) { // mu: μ(guscio)/μ(centro), oppure null se la composizione è uniforme
  const c = CS[jc]; let h = HX, ms = MS0[jc], np = 0, nf = 0, xfit = 0, muf = 1, qf = 1, pf = 0, df = 0;
  CONTA.membri++;
  let msA = 0, gA = 0; // per la secante sulla massa totale (un autovalore: la composizione è data in frazione di massa)
  for (let giro = 0; giro < (mu ? 12 : 1); giro++) {
    let g = 0; // μ̃ alla massa m̃ (interpolata tra i centri dei gusci)
    const mut = mu ? (m) => { const q = m / ms; while (g < NG - 2 && QC[g + 1] < q) g++; while (g > 0 && QC[g] > q) g--; if (q <= QC[0]) return mu[0]; if (q >= QC[NG - 1]) return mu[NG - 1]; const u = (q - QC[g]) / (QC[g + 1] - QC[g]); return mu[g] + u * (mu[g + 1] - mu[g]); } : () => 1;
    np = 0; IX[0] = 0; IM[0] = 0; IP[0] = 1; ID[0] = 1; np = 1;
    let x = 0, th = 1, m = 0;
    if (c < 1) { // il nucleo radiativo, fino a θ = c
      h = HX; x = h; th = 1 - (x * x) / 6 + x ** 4 / 40; m = x ** 3 / 3 - x ** 5 / 10;
      for (;;) {
        h = HX * Math.max(1, x / 6);
        const u0 = mut(m); IX[np] = x; IM[np] = m; IP[np] = th ** 4; ID[np] = u0 * th ** 3; np++;
        if (np > NP - 3 || !(th > 0)) throw new Error(`membro: nucleo senza fine (c=${c}, np=${np}, th=${th}, x=${x}, m=${m}, ms=${ms}, u0=${u0})`);
        const a1 = (-u0 * m) / (x * x), b1 = x * x * u0 * th ** 3, xm = x + h / 2, m2 = m + (h / 2) * b1, t2 = th + (h / 2) * a1, u2 = mut(m2), a2 = (-u2 * m2) / (xm * xm), b2 = xm * xm * u2 * t2 ** 3;
        const m3 = m + (h / 2) * b2, t3 = th + (h / 2) * a2, a3 = (-u2 * m3) / (xm * xm), b3 = xm * xm * u2 * t3 ** 3, xe = x + h, m4 = m + h * b3, t4 = Math.max(th + h * a3, 0), a4 = (-u2 * m4) / (xe * xe), b4 = xe * xe * u2 * t4 ** 3;
        const t1 = th + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), m1 = m + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
        if (t1 <= c) { const t = (th - c) / (th - t1); x += t * h; m += t * (m1 - m); th = c; muf = mut(m); IX[np] = x; IM[np] = m; IP[np] = c ** 4; ID[np] = muf * c ** 3; np++; break; }
        x = xe; th = t1; m = m1;
      }
    }
    nf = np - 1; xfit = x;
    if (c > 0) { // l'involucro adiabatico
      const Pf = c ** 4, Df = muf * c ** 3, a = (8 * Df) / (5 * Pf); let w = 1;
      if (x === 0) { h = HX; x = h; w = 1 - (4 / 15) * x * x; m = x ** 3 / 3 - (2 / 25) * x ** 5; IX[np] = x; IM[np] = m; IP[np] = w * w * Math.sqrt(w); ID[np] = w * Math.sqrt(w); np++; }
      const fm = (x, w) => (w > 0 ? x * x * Df * w * Math.sqrt(w) : 0);
      for (;;) {
        h = HX * Math.max(1, x / 6);
        const a1 = (-a * m) / (x * x), b1 = fm(x, w), xm = x + h / 2, a2 = (-a * (m + (h / 2) * b1)) / (xm * xm), b2 = fm(xm, w + (h / 2) * a1);
        const a3 = (-a * (m + (h / 2) * b2)) / (xm * xm), b3 = fm(xm, w + (h / 2) * a2), xe = x + h, a4 = (-a * (m + h * b3)) / (xe * xe), b4 = fm(xe, w + h * a3);
        const w1 = w + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), m1 = m + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
        if (w1 <= 0) { const t = w / (w - w1); IX[np] = x + t * h; IM[np] = m + t * (m1 - m); IP[np] = 0; ID[np] = 0; np++; break; }
        if (np > NP - 3 || !(w1 === w1)) throw new Error(`membro: involucro senza fine (c=${c}, np=${np}, w=${w})`);
        x = xe; w = w1; m = m1; IX[np] = x; IM[np] = m; IP[np] = Pf * w * w * Math.sqrt(w); ID[np] = Df * w * Math.sqrt(w); np++;
      }
      pf = Pf; df = Df;
    }
    const g1 = IM[np - 1] - ms; if (!mu || Math.abs(g1) < 3e-5 * ms) { ms = IM[np - 1]; break; }
    let pross = giro === 0 || g1 === gA ? IM[np - 1] : ms - (g1 * (ms - msA)) / (g1 - gA);
    if (!(pross > 0.3 * ms && pross < 3 * ms)) pross = IM[np - 1];
    msA = ms; gA = g1; ms = pross;
  }
  MS0[jc] = ms; qf = c >= 1 ? 0 : c <= 0 ? 1 : IM[nf] / ms;
  const xs = IX[np - 1], dU = xs ** 3 / (PI4 * ms), pU = xs ** 4 / (16 * Math.PI * ms * ms);
  const pc = new Float64Array(NG), dc = new Float64Array(NG), pb = new Float64Array(NG + 1);
  for (let i = 0; i < np; i++) IZ[i] = Math.cbrt(IM[i] * IM[i]); // vicino al centro P e ρ sono lineari in m^(2/3)
  let j = 0;
  const at = (q, A) => { const t = Math.cbrt((q * ms) ** 2); while (j < np - 2 && IZ[j + 1] < t) j++; const u = (t - IZ[j]) / (IZ[j + 1] - IZ[j]); return A[j] + u * (A[j + 1] - A[j]); };
  for (let k = 0; k < NG; k++) { pb[k] = at(QB[k], IP) * pU; pc[k] = at(QC[k], IP) * pU; dc[k] = at(QC[k], ID) * dU; }
  pb[0] = pU; pb[NG] = 0;
  return { c, qf, pf: pf * pU, df: df * dU, p0: pU, d0: dU, rf: c >= 1 ? 0 : xfit / xs, pc, dc, pb };
}
// una famiglia: i membri si calcolano solo quando servono
const famiglia = (mu = null) => ({ mu, m: new Array(CS.length).fill(null) });
const FAM_U = famiglia();
const membroDi = (fam, j) => fam.m[j] || (fam.m[j] = membro(fam.mu, j));

// ---------- gli elettroni: gas di Fermi non relativistico, a qualunque degenerazione
// D = nₑλ³/2; G = Pₑ/(nₑkT); se = entropia per elettrone / k_B
const FD = (() => {
  const fd = (eta) => {
    if (eta > 40) { const e2 = (Math.PI / eta) ** 2; return [(4 / (3 * Math.sqrt(Math.PI))) * eta ** 1.5 * (1 + e2 / 8 + (7 / 640) * e2 * e2), (8 / (15 * Math.sqrt(Math.PI))) * eta ** 2.5 * (1 + (5 / 8) * e2 - (7 / 384) * e2 * e2)]; }
    const tmax = Math.sqrt(Math.max(eta, 0) + 45), n = 1200, h = tmax / n; let a = 0, b = 0;
    for (let i = 1; i <= n; i++) { const t = i * h, t2 = t * t, w = (i === n ? 1 : i % 2 ? 4 : 2) / (Math.exp(t2 - eta) + 1); a += w * t2; b += w * t2 * t2; }
    return [((2 / Math.sqrt(Math.PI)) * 2 * a * h) / 3, ((4 / (3 * Math.sqrt(Math.PI))) * 2 * b * h) / 3];
  };
  const es = [], lD = [], Gs = [];
  for (let eta = -8; eta <= 160; eta += eta < 12 ? 0.1 : eta < 40 ? 0.5 : 4) { const [f1, f3] = fd(eta); es.push(eta); lD.push(Math.log(f1)); Gs.push(f3 / f1); }
  const L0 = -7, L1 = 7, dL = 0.05, n = Math.round((L1 - L0) / dL) + 1, G = new Float64Array(n), E = new Float64Array(n);
  for (let i = 0, j = 0; i < n; i++) { const l = L0 + i * dL; while (j < lD.length - 2 && lD[j + 1] < l) j++; const u = (l - lD[j]) / (lD[j + 1] - lD[j]); G[i] = Gs[j] + u * (Gs[j + 1] - Gs[j]); E[i] = es[j] + u * (es[j + 1] - es[j]); }
  return { L0, L1, dL, n, G, E };
})();
// G, dG/dlnD, η
const elG = [0, 0, 0];
function elettroni(lnD) {
  if (lnD <= FD.L0) { const D = Math.exp(lnD); elG[0] = 1 + D / 5.656854; elG[1] = D / 5.656854; elG[2] = lnD + D / 2.828427; return elG; }
  if (lnD >= FD.L1) { const eta = Math.pow(0.75 * Math.sqrt(Math.PI) * Math.exp(lnD), 2 / 3); elG[0] = 0.4 * eta; elG[1] = (0.8 / 3) * eta; elG[2] = eta; return elG; }
  const t = (lnD - FD.L0) / FD.dL, i = Math.min(FD.n - 2, t | 0), u = t - i;
  elG[1] = (FD.G[i + 1] - FD.G[i]) / FD.dL; elG[0] = FD.G[i] + u * (FD.G[i + 1] - FD.G[i]); elG[2] = FD.E[i] + u * (FD.E[i + 1] - FD.E[i]); return elG;
}
const LQE = 1.5 * Math.log((2 * Math.PI * K.hbar * K.hbar) / (K.me * K.kB)); // ln λ³ = LQE − 1,5 ln T
const lnQ = (m, T) => 1.5 * Math.log((m * K.kB * T) / (2 * Math.PI * K.hbar * K.hbar)); // ln della concentrazione quantica

// ---------- lo stato della materia: T da P e ρ (ioni perfetti + elettroni di Fermi + radiazione)
export function temperatura(P, rho, X, Zm) {
  const Y = 1 - X - Zm, n = rho / MB, ni = n * (X + Y / 4 + Zm / 16), ne = n * (X + Y / 2 + Zm / 2);
  let T = P / ((ni + ne) * K.kB);
  const lne = Math.log(ne / 2) + LQE;
  for (let it = 0; it < 30; it++) {
    const g = elettroni(lne - 1.5 * Math.log(T)), pr = (A_RAD * T ** 4) / 3;
    const f = (ni + ne * g[0]) * K.kB * T + pr - P, d = (ni + ne * (g[0] - 1.5 * g[1])) * K.kB + (4 * pr) / T, dT = f / d;
    T -= dT; if (Math.abs(dT) < 1e-10 * T) break;
  }
  return T;
}

// ---------- le reazioni: il picco di Gamow integrato numericamente
function sigmaV(T, Z1, Z2, A1, A2, S) {
  const mr = ((A1 * A2) / (A1 + A2)) * MB, kT = K.kB * T, EG = 2 * mr * K.c ** 2 * (Math.PI * ALFA * Z1 * Z2) ** 2;
  const E0 = Math.pow((Math.sqrt(EG) * kT) / 2, 2 / 3), D = 4 * Math.sqrt((E0 * kT) / 3), a = Math.max(E0 * 1e-3, E0 - 3 * D), b = E0 + 5 * D, n = 128, h = (b - a) / n;
  const tau = (3 * E0) / kT; let s = 0;
  for (let i = 0; i <= n; i++) { const E = a + i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * (S[0] + S[1] * E + 0.5 * S[2] * E * E) * Math.exp(tau - E / kT - Math.sqrt(EG / E)); }
  return [Math.sqrt(8 / (Math.PI * mr)) * kT ** -1.5 * ((s * h) / 3), tau]; // ⟨σv⟩·e^τ, τ
}
const LT0 = Math.log(3e5), LT1 = Math.log(5e9), NT = 400, DLT = (LT1 - LT0) / (NT - 1);
const TAB = { pp: new Float64Array(NT), cno: new Float64Array(NT) };
for (let i = 0; i < NT; i++) {
  const T = Math.exp(LT0 + i * DLT);
  let r = sigmaV(T, 1, 1, 1, 1, DATI.S11); TAB.pp[i] = Math.log(r[0]) - r[1];
  r = sigmaV(T, 1, 7, 1, 14, DATI.S114); TAB.cno[i] = Math.log(r[0]) - r[1];
}
const QPP = (DATI.Q4 - DATI.nuPP) / 2, QCNO = DATI.Q4 - DATI.nuCNO;
export const QH = (DATI.Q4 - DATI.nuPP) / (4 * MB); // J per kg di idrogeno bruciato (catena pp)
const eps = [0, 0];
export function energia(rho, T, X, Zm) {
  const lt = (Math.log(T) - LT0) / DLT;
  if (lt < 0 || X <= 0) { eps[0] = eps[1] = 0; return eps; }
  const i = Math.min(NT - 2, lt | 0), u = lt - i, Y = 1 - X - Zm, n = rho / MB, np = n * X, kT = K.kB * T;
  let h1 = 0, h14 = 0;
  if (OPZ.schermo) {
    const ne = n * (X + Y / 2 + Zm / 2), z2 = n * (X + Y + 4 * Zm) + ne, hw = (E2 / kT) * Math.sqrt((PI4 * E2 * z2) / kT), hs = ((0.9 * E2) / kT) * Math.cbrt((PI4 * ne) / 3);
    h1 = Math.min(hw, 1.1748 * hs); h14 = Math.min(7 * hw, 5.385 * hs);
  }
  eps[0] = (0.5 * np * np * Math.exp(TAB.pp[i] + u * (TAB.pp[i + 1] - TAB.pp[i]) + h1) * QPP) / rho;
  eps[1] = (np * ((n * DATI.CN * Zm) / 14) * Math.exp(TAB.cno[i] + u * (TAB.cno[i + 1] - TAB.cno[i]) + h14) * QCNO) / rho;
  return eps;
}

// ---------- l'opacità dell'interno: elettroni liberi (Thomson), frenamento (Kramers), fotoionizzazione dei metalli
const C_FF = (() => { // media di Rosseland della formula di Kramers (fattore di Gaunt 1): tutto dalle costanti
  const C = ((4 * E2 ** 3) / (3 * K.me * 2 * Math.PI * K.hbar * K.c)) * Math.sqrt((2 * Math.PI) / (3 * K.kB * K.me));
  let i1 = 0, i0 = 0; const n = 4000, h = 60 / n;
  for (let i = 1; i < n; i++) { const x = i * h, e = Math.exp(-x), w = (x ** 4 * e) / (1 - e) ** 2; i0 += w; i1 += (w * x ** 3) / (1 - e); }
  return (C * ((2 * Math.PI * K.hbar) / K.kB) ** 3 * i0) / i1 / (2 * MB * MB);
})();
export const C_ES = SIGMA_T / (2 * MB);
export function opacita(rho, T, X, Zm) {
  const t35 = rho / (T ** 3 * Math.sqrt(T)), g = OPZ.ghig ? DATI.ghigliottina[0] * Math.pow(rho * (1 + X), DATI.ghigliottina[1]) : 1;
  return (1 + X) * (C_ES + (C_FF * (1 - Zm) + (DATI.Cbf * Zm) / g) * t35);
}

// ---------- la fotosfera: dove la stella diventa trasparente (profondità ottica 2/3)
const opFoto = (rho, T, Zm) => (DATI.Hmeno * (Zm / 0.02) * Math.sqrt(rho) * T ** 9 + (OPZ.mol ? DATI.molecole * (Zm / DATI.ZSOLE) * Math.cbrt(rho * rho) * T ** 3 : 0));
// entropia per unità di massa (in k_B/m_B) del gas neutro (atomi H, He; con H₂ se richiesto)
const fotoOut = [0, 0, 0];
function entropiaFoto(T, g, X, Zm) {
  const Y = 1 - X - Zm, kTm = (K.kB * T) / MB, lq1 = lnQ(MB, T), th = DATI.H2.vib / T, ex = Math.exp(-th), zi = ((T / DATI.H2.rot) * 2) / (1 - ex);
  // equilibrio 2H ⇌ H₂: n₁²/n₂ = Keq
  const Keq = OPZ.H2 ? Math.exp(2 * lq1 - lnQ(2 * MB, T) + Math.log(16 / zi) - DATI.H2.D0 / (K.kB * T)) : Infinity, lg = Math.log((2 * g) / 3);
  let lr = fotoOut[1] > 0 ? Math.log(fotoOut[1]) : -9, f = 0, mu = 1, rho = 0;
  for (let it = 0; it < 40; it++) { // ρ: P = ρkT/(μ m) = 2g/(3κ)
    rho = Math.exp(lr);
    const nH = (X * rho) / MB, y = (8 * nH) / Keq; f = y < 1e-9 ? 0 : 1 - (Math.sqrt(1 + y) - 1) / (y / 2) ; mu = 1 / (X * (1 - f / 2) + Y / 4);
    const hm = DATI.Hmeno * (Zm / 0.02) * Math.sqrt(rho) * T ** 9, mo = OPZ.mol ? DATI.molecole * (Zm / DATI.ZSOLE) * Math.cbrt(rho * rho) * T ** 3 : 0, k = hm + mo;
    const F = lr + Math.log((kTm / mu) * k) - lg, dF = 1 + (0.5 * hm + (2 / 3) * mo) / k + 0.25 * f * X * mu, d = F / dF;
    lr -= Math.abs(d) > 2 ? 2 * Math.sign(d) : d; if (Math.abs(d) < 1e-8) break;
  }
  const n = rho / MB, n1 = n * X * (1 - f), n2 = (n * X * f) / 2; let s = 0;
  if (n1 > 0) s += X * (1 - f) * (2.5 + lq1 + Math.log(4 / n1));
  if (n2 > 1e-300) s += ((X * f) / 2) * (2.5 + lnQ(2 * MB, T) + Math.log(zi / n2) + 1 + (th * ex) / (1 - ex));
  if (Y > 0) s += (Y / 4) * (2.5 + lnQ(4 * MB, T) - Math.log((n * Y) / 4));
  if (isFinite(DATI.alfaConv)) { // lo strato dove la convezione è inefficiente (lunghezza di mescolamento, una zona)
    const cp = 2.5 / mu + (X * f) / 2, F = K.sigma * T ** 4, v = Math.sqrt(kTm / mu);
    s += cp * Math.pow((4 * Math.SQRT2 * F) / (DATI.alfaConv ** 2 * rho * cp * (K.kB / MB) * T * v), 2 / 3);
  }
  fotoOut[0] = s; fotoOut[1] = rho; fotoOut[2] = f; return fotoOut;
}
// entropia per unità di massa (in k_B/m_B) del gas ionizzato dell'interno
function entropiaInterno(rho, T, X, Zm) {
  const Y = 1 - X - Zm, n = rho / MB, ne = n * (X + Y / 2 + Zm / 2), g = elettroni(Math.log(ne / 2) + LQE - 1.5 * Math.log(T));
  let s = (X + Y / 2 + Zm / 2) * (2.5 * g[0] - g[2]);
  if (X > 0) s += X * (2.5 + lnQ(MB, T) + Math.log(2 / (n * X)));
  if (Y > 0) s += (Y / 4) * (2.5 + lnQ(4 * MB, T) - Math.log((n * Y) / 4));
  return s;
}
// ---------- una stella: massa, profilo di idrogeno, raggio, indice n e raccordo c → i bilanci
const B = { p: new Float64Array(NG), d: new Float64Array(NG), pb: new Float64Array(NG + 1), T: new Float64Array(NG), e: new Float64Array(NG), ec: new Float64Array(NG), k: new Float64Array(NG), l: new Float64Array(NG + 1), dn: new Float64Array(NG), y: new Float64Array(NG) };
export function valuta(M, Xp, Zm, R, c, fam = FAM_U) {
  // la struttura di prova, interpolata nella famiglia
  let j = 0; while (j < CS.length - 2 && CS[j + 1] <= c) j++;
  const u = Math.min(1, Math.max(0, (c - CS[j]) / (CS[j + 1] - CS[j]))), F0 = membroDi(fam, u < 1 ? j : j + 1), F1 = u > 0 && u < 1 ? membroDi(fam, j + 1) : F0, mix = (a, b) => a + u * (b - a);
  const dU = M / R ** 3, pU = (K.G * M * M) / R ** 4;
  const qf = mix(F0.qf, F1.qf), pf = mix(F0.pf, F1.pf) * pU, df = mix(F0.df, F1.df) * dU, p0 = mix(F0.p0, F1.p0) * pU, d0 = mix(F0.d0, F1.d0) * dU;
  CONTA.valuta++;
  let L = 0, Lpp = 0;
  B.l[0] = 0;
  for (let i = 0; i < NG; i++) {
    const P = mix(F0.pc[i], F1.pc[i]) * pU, rho = mix(F0.dc[i], F1.dc[i]) * dU, X = Xp[i];
    const T = temperatura(P, rho, X, Zm), e = energia(rho, T, X, Zm), dm = (QB[i + 1] - QB[i]) * M;
    B.p[i] = P; B.d[i] = rho; B.T[i] = T; B.e[i] = e[0] + e[1]; B.ec[i] = e[1]; B.k[i] = opacita(rho, T, X, Zm);
    Lpp += e[0] * dm; L += (e[0] + e[1]) * dm; B.l[i + 1] = L; B.pb[i] = mix(F0.pb[i], F1.pb[i]) * pU;
  }
  B.pb[NG] = 0;
  const Tc = temperatura(p0, d0, Xp[0], Zm);
  // il gradiente che la radiazione richiederebbe, guscio per guscio, e il nucleo convettivo (criterio di Schwarzschild)
  const cc = 16 * Math.PI * A_RAD * K.c * K.G;
  let ic = 0, qcc = 0, Pin = p0, Tin = Tc;
  for (let i = 0; i < NG; i++) {
    const beta = 1 - (A_RAD * B.T[i] ** 4) / (3 * B.p[i]), nad = (8 - 6 * beta) / (32 - 24 * beta - 3 * beta * beta);
    B.y[i] = (B.k[i] * 0.5 * (B.l[i] + B.l[i + 1])) / (QC[i] * M);
    B.dn[i] = (3 * B.y[i] * B.p[i]) / (cc * B.T[i] ** 4) - nad;
  }
  if (B.dn[0] > 0) {
    ic = 1; while (ic < NG && B.dn[ic] > 0) ic++;
    if (ic < NG) { const t = B.dn[ic - 1] / (B.dn[ic - 1] - B.dn[ic]); qcc = QC[ic - 1] + t * (QC[ic] - QC[ic - 1]); Pin = B.p[ic - 1] + t * (B.p[ic] - B.p[ic - 1]); Tin = B.T[ic - 1] + t * (B.T[ic] - B.T[ic - 1]); }
    else qcc = 1;
  }
  // il trasporto per radiazione tra il nucleo convettivo e il raccordo: ∫κ·(l/m)·dP/(4πcG) = ΔP_rad
  let I = 0;
  const Pout = c <= 0 ? 0 : pf;
  for (let i = 0; i < NG; i++) {
    const a = Math.min(B.pb[i], Pin), b = Math.max(B.pb[i + 1], Pout);
    if (a > b) I += B.y[i] * (a - b);
  }
  I /= PI4 * K.c * K.G;
  const Xe = Xp[NG - 1], conv = c >= 1, Xf = conv ? Xp[0] : Xe, Tf = c <= 0 ? 0 : temperatura(pf, df, Xf, Zm);
  const dPr = (A_RAD / 3) * (Tin ** 4 - Tf ** 4);
  const resB = conv ? NaN : Pin > Pout && dPr > 0 ? Math.log(I / dPr) : NaN;
  // Schwarzschild alla base dell'involucro: ∇rad = ∇ad
  let resS = NaN;
  if (c > 0 && !conv) { const kf = opacita(df, Tf, Xf, Zm); resS = Math.log((3 * kf * L * pf) / (cc * qf * M * Tf ** 4) / 0.4); }
  // la superficie: l'adiabatica dell'involucro convettivo raccordata alla fotosfera
  const Teff = Math.pow(L / (PI4 * R * R * K.sigma), 0.25); let resA = NaN;
  if (c > 0) resA = L > 0 ? entropiaFoto(Math.max(Teff, 300), (K.G * M) / (R * R), Xe, Zm)[0] - entropiaInterno(df, Tf, Xf, Zm) : -1e3;
  return { L, Lpp, Teff, resA, resB, resS, Tc, rhoc: d0, qcc, qf, ic, Tf, rf: mix(F0.rf, F1.rf), nradc: B.dn[0] + (8 - 6 * (1 - (A_RAD * B.T[0] ** 4) / (3 * B.p[0]))) / (32 - 24 * (1 - (A_RAD * B.T[0] ** 4) / (3 * B.p[0])) - 3 * (1 - (A_RAD * B.T[0] ** 4) / (3 * B.p[0])) ** 2), c, R };
}
export const _B = B, _CS = CS, _QC = QC, _QB = QB, _C = { C_FF, C_ES, SIGMA_T, A_RAD, QPP, QCNO };
export { entropiaFoto, entropiaInterno, opFoto, elettroni, sigmaV, membro, famiglia };
export function composizione(Z = 1) { const Zm = Z * DATI.ZSOLE, Y = DATI.YPRIMO + ((DATI.YSOLE - DATI.YPRIMO) / DATI.ZSOLE) * Zm; return { X: 1 - Y - Zm, Y, Zm }; }

// ---------- il risolutore
function zero(f, a, b, fa, fb, tol = 1e-6) { // regula falsi (Illinois) su un intervallo che contiene la radice
  let lato = 0;
  for (let it = 0; it < 60; it++) {
    const c = Math.abs(fb - fa) > 1e-300 ? (a * fb - b * fa) / (fb - fa) : 0.5 * (a + b), fc = f(c);
    if (fc === 0) return c;
    if (fc * fb < 0) { a = b; fa = fb; lato = 0; } else if (lato === -1) fa *= 0.5; else lato = -1;
    b = c; fb = fc;
    if (Math.abs(b - a) < tol) return c;
  }
  return 0.5 * (a + b);
}
// R dove chiude un residuo che cala al crescere di R (ramo stabile, non degenere); si parte da R0 e si allarga a passi
function raggio(res, R0, passo = 0.1) {
  let b = Math.log(R0), fb = res(b), a, fa;
  if (fb > 0) { a = b; fa = fb; for (let i = 0; i < 80; i++) { b = a + passo; fb = res(b); if (fb <= 0) break; a = b; fa = fb; } if (fb > 0) return NaN; }
  else { let su = 0; for (let i = 0; i < 100; i++) { a = b - passo; fa = res(a); if (fa > 0) break; if (fa < fb) { if (++su > 4) return NaN; } else su = 0; b = a; fb = fa; } if (!(fa > 0)) return NaN; }
  return Math.exp(zero(res, a, b, fa, fb));
}
const raggioA = (M, Xp, Zm, c, R0, fam, passo) => raggio((u) => valuta(M, Xp, Zm, Math.exp(u), c, fam).resA, R0, passo);
const raggioB = (M, Xp, Zm, R0, fam, passo) => raggio((u) => { const r = valuta(M, Xp, Zm, Math.exp(u), 0, fam).resB; return isNaN(r) ? 50 : r; }, R0, passo);
// la struttura di equilibrio: tutta convettiva (c = 1: chiude la superficie), con nucleo radiativo e involucro
// convettivo (0 < c < 1: superficie e trasporto insieme), o senza involucro (c = 0: chiude il trasporto)
export function equilibrio(M, Xp, Zm, prima = null, fam = FAM_U) {
  let R, c, v;
  const R0 = prima?.R ?? RSOLE * Math.pow(M / MSOLE, 0.8), passo = prima ? 0.03 : 0.1;
  if (prima && prima.c > C_MIN && prima.c < 1) { // tentativo rapido: Newton in (ln R, c) dalla soluzione vicina
    let u = Math.log(prima.R); c = prima.c;
    for (let it = 0; it < 8; it++) {
      const v0 = valuta(M, Xp, Zm, Math.exp(u), c, fam), A0 = v0.resA, B0 = v0.resB;
      if (!isFinite(A0) || !isFinite(B0)) break;
      if (Math.abs(A0) < 1e-5 && Math.abs(B0) < 1e-5) return v0;
      const du = 1e-3, dc = c > 0.5 ? -2e-3 : 2e-3 * Math.max(c, 0.05), v1 = valuta(M, Xp, Zm, Math.exp(u + du), c, fam), v2 = valuta(M, Xp, Zm, Math.exp(u), c + dc, fam);
      const a11 = (v1.resA - A0) / du, a21 = (v1.resB - B0) / du, a12 = (v2.resA - A0) / dc, a22 = (v2.resB - B0) / dc, det = a11 * a22 - a12 * a21;
      if (!isFinite(det) || Math.abs(det) < 1e-12) break;
      let su = -(A0 * a22 - B0 * a12) / det, sc = -(a11 * B0 - a21 * A0) / det; const lim = Math.max(Math.abs(su) / 0.2, Math.abs(sc) / (0.5 * c), 1); su /= lim; sc /= lim;
      u += su; c += sc; if (c <= C_MIN || c >= 0.999) break;
    }
  }
  if (prima && prima.c <= 0 && prima.Teff > 9000) { R = raggioB(M, Xp, Zm, R0, fam, passo); if (!isNaN(R)) { v = valuta(M, Xp, Zm, R, 0, fam); if (v.Teff > 9000) return v; } }
  // la via sicura. Tutta convettiva?
  R = raggioA(M, Xp, Zm, 1, R0, fam, passo);
  if (!isNaN(R)) { v = valuta(M, Xp, Zm, R, 1, fam); if (v.nradc >= 0.25) return v; }
  // c'è un nucleo radiativo: c dove il trasporto chiude, lungo la curva della superficie
  let Rg = isNaN(R) ? R0 : R;
  const g = (x) => { const r = raggioA(M, Xp, Zm, x, Rg, fam); if (isNaN(r)) return NaN; Rg = r; return valuta(M, Xp, Zm, r, x, fam).resB; };
  const g0 = g(C_MIN);
  if (!(g0 > 0)) { R = raggioB(M, Xp, Zm, Rg, fam); return isNaN(R) ? null : valuta(M, Xp, Zm, R, 0, fam); } // niente involucro convettivo: solo radiazione
  const R1 = Rg; Rg = isNaN(R) ? R0 : R; const g1 = g(0.98);
  if (!(g1 < 0)) return isNaN(R) ? null : valuta(M, Xp, Zm, R, 1, fam);
  Rg = R1; c = zero(g, C_MIN, 0.98, g0, g1, 1e-5); R = raggioA(M, Xp, Zm, c, Rg, fam);
  return valuta(M, Xp, Zm, R, c, fam);
}

// ---------- la vita in sequenza principale: l'idrogeno diventa elio, guscio per guscio
const PASSI = [1, 0.86, 0.72, 0.58, 0.44, 0.31, 0.19, 0.1, 0.04, 0.012];
const KPP = (4 * MB) / (DATI.Q4 - DATI.nuPP), KCNO = (4 * MB) / (DATI.Q4 - DATI.nuCNO);
export function traccia(Msol, Z = 1, passi = PASSI, prima0 = null) {
  const { X: X0, Zm } = composizione(Z), M = Msol * MSOLE, Xp = new Float64Array(NG).fill(X0), r = new Float64Array(NG), mu = new Float64Array(NG), stati = [];
  let prima = prima0, t = 0, rc0 = 0, xc0 = X0, s = 0, uniforme = true;
  for (let k = 0; k < passi.length; k++) {
    let fam = FAM_U;
    if (!uniforme) { const m0 = 1 / (2 * Xp[0] + 0.75 * (1 - Xp[0] - Zm) + 0.5 * Zm); for (let i = 0; i < NG; i++) mu[i] = 1 / (2 * Xp[i] + 0.75 * (1 - Xp[i] - Zm) + 0.5 * Zm) / m0; fam = famiglia(mu); }
    const e = equilibrio(M, Xp, Zm, prima, fam); if (!e) break; prima = e;
    // il ritmo a cui cala l'idrogeno in ogni guscio; le zone convettive si mescolano
    for (let i = 0; i < NG; i++) r[i] = (B.e[i] - B.ec[i]) * KPP + B.ec[i] * KCNO;
    const xarr = Xp[0];
    const mescola = (i0, i1) => { let sr = 0, sx = 0, sm = 0; for (let i = i0; i < i1; i++) { const dm = QB[i + 1] - QB[i]; sr += r[i] * dm; sx += Xp[i] * dm; sm += dm; } if (sm > 0) for (let i = i0; i < i1; i++) { r[i] = sr / sm; Xp[i] = sx / sm; } };
    let i1 = 0; while (i1 < NG && QC[i1] < e.qcc) i1++; if (i1 > 1) mescola(0, i1);
    if (e.c >= 1) mescola(0, NG); else if (e.c > 0) { let i0 = 0; while (i0 < NG && QC[i0] < e.qf) i0++; if (i0 > i1) mescola(i0, NG); }
    const rc = r[0], xc = Xp[0];
    // il tempo del passo appena fatto: il ritmo è cambiato strada facendo (legge di potenza tra l'inizio e la fine)
    if (k > 0 && s > 0) { const f = xarr / xc0, p = Math.log(rc / rc0) / Math.log(f); t += (s * (Math.abs(p - 1) < 1e-3 ? Math.log(1 / f) : (Math.pow(f, 1 - p) - 1) / (p - 1))) / (1 - f); }
    let mHe = 0; for (let i = 0; i < NG; i++) if (Xp[i] < 0.1 * X0) mHe = QB[i + 1]; // la massa del nucleo dove l'idrogeno è finito
    stati.push({ t: t / ANNO, L: e.L / LSOLE, R: e.R / RSOLE, T: e.Teff, Tc: e.Tc, rhoc: e.rhoc, Xc: xc, qcc: e.qcc, qf: e.qf, c: e.c, rf: e.rf, cno: 1 - e.Lpp / e.L, mHe });
    rc0 = rc; xc0 = xc;
    if (k + 1 < passi.length) { s = (xc - passi[k + 1] * X0) / rc; if (!(s > 0)) s = 0; for (let i = 0; i < NG; i++) Xp[i] = Math.max(0, Xp[i] - r[i] * s); uniforme = e.c >= 1; }
  }
  return stati;
}
