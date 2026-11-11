// cosmo3d.js — il cosmo in tre dimensioni e nel tempo: il campo di densità con lo spettro vero, le galassie dentro,
// i loro moti, l'espansione.
//
// cosmo.js dà il cosmo visto dall'alto: un toro a due dimensioni, con le galassie sui picchi di un campo fatto di poche
// onde lunghe (troppo forti: le velocità che ne venivano erano di mille km/s). Quel disegno resta la carta d'identità
// delle galassie (dove stanno in x e y, quanto è alto il loro picco: da lì il loro alone e tutta la loro storia, che
// NON cambiano). Qui il cosmo diventa quello che la carta proietta:
//   · UN TORO A TRE DIMENSIONI, lato TORO_M: alle due coordinate di ogni galassia si aggiunge la profondità z (un
//     evento, uniforme: l'universo non ha un piano preferito);
//   · IL CAMPO è gaussiano, con lo SPETTRO DI POTENZA VERO della materia (quello di galassie.js: forma BBKS con il
//     parametro di Sugiyama, normalizzato a σ₈ di leggi.js), fatto di tutte le onde che entrano nel toro fino a un
//     numero d'onda massimo (kmax giri per lato). Non è un campo qualunque: è una REALIZZAZIONE VINCOLATA (Hoffman &
//     Ribak 1991), cioè il campo casuale più la correzione minima che lo fa valere, filtrato alle onde lunghe, proprio
//     l'altezza del picco di ogni galassia nel punto dove sta. Così le galassie stanno dove il campo dice;
//   · I MOTI vengono dalla teoria lineare: la materia cade verso dove ce n'è di più, v_k = i·H·f·δ_k·k/k², con
//     f = dlnD/dlna (≈ Ωm^0,55) dalla crescita di galassie.js. Con lo spettro vero le velocità sono quelle vere;
//   · L'ESPANSIONE: le coordinate sul toro sono comoventi; la distanza vera è quella per il fattore di scala a(t) della
//     cosmologia di leggi.js. Nel tempo ogni punto si sposta dalla sua posizione iniziale di D(t)·Ψ (approssimazione
//     di Zel'dovich: lo spostamento cresce come le fluttuazioni), con Ψ = v/(H·f) di oggi;
//   · L'ASSE DI OGNI GALASSIA viene dalla teoria delle coppie mareali in tre dimensioni: L_i ∝ ε_ijk·T_jl·I_lk, con T
//     il tensore di marea del campo in quel punto e I l'inerzia del proto-alone, la cui forma è quella del picco (gli
//     assi lunghi dove la densità filtrata cala più piano: l'inverso dell'hessiano).
// LA NEBBIA (regola 9): le galassie segnate sono un CAMPIONE. Nel volume del toro gli aloni pesanti almeno quanto il
// più piccolo dei loro sono milioni (li conta la funzione di massa di Press & Schechter 1974 con lo stesso σ(M)):
// `peso` dice quante galassie vere rappresenta ognuna.
//
// COSTI (misurati): kmax = 24 → 28 888 onde; costruire il campo vincolato ~40–70 ms; la griglia 64³ (a richiesta: una
// trasformata di Fourier) ~50 ms; velocità delle galassie (a richiesta: somma diretta delle onde) ~100–150 ms; maree e
// assi ~100–140 ms. In memoria: le onde 1,4 MB, la griglia 1 MB.
// CHE COSA NON C'È: le onde più corte di L/kmax (50 Mpc: filamenti e vuoti grandi sì, i singoli ammassi no: per
// quelli servirebbe un campo più fine, condizionato a questo, nella regione che si guarda); le galassie non sono
// obbligate a stare su un massimo esatto del campo; i moti sono lineari (niente orbite negli ammassi); la carta
// piatta di cosmo.js (la rete disegnata sulla mappa) non è la proiezione di questo campo: è il disegno di prima.

import { COSMO } from './leggi.js';
import { sorgente, campana } from './eventi.js';
import { COSMOLOGIA as U, SIGMA_CAMPO } from './galassie.js';

const MPC = 3.0857e22, PI2 = 2 * Math.PI;
// la trasformata di Fourier (potenze di 2), sul posto, lungo una riga di passo `s` che parte da `o`
function fft(re, im, n, o, s, inversa) {
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const a = o + i * s, c = o + j * s; let t = re[a]; re[a] = re[c]; re[c] = t; t = im[a]; im[a] = im[c]; im[c] = t; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inversa ? 1 : -1) * PI2) / len, wr = Math.cos(ang), wi = Math.sin(ang), h = len >> 1;
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < h; k++) { const a = o + (i + k) * s, b = a + h * s, xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
// LE ONDE DEL TORO: mezzo spazio (le altre sono le coniugate), |k| ≤ kmax giri per lato, ognuna con la sua potenza
// vera ⟨|δ_k|²⟩ = Δ²(k)/(4π·k³). La lista è la stessa per chiunque faccia un campo su questo toro (bolle.js).
export function ondeDelToro(toroM, kmax) {
  const L = toroM / MPC, kx = [], ky = [], kz = [], P = [];
  for (let z = 0; z <= kmax; z++) for (let y = -kmax; y <= kmax; y++) for (let x = -kmax; x <= kmax; x++) {
    if (z === 0 && (y < 0 || (y === 0 && x <= 0))) continue; const k2 = x * x + y * y + z * z; if (k2 > kmax * kmax) continue;
    const k = Math.sqrt(k2); kx.push(x); ky.push(y); kz.push(z); P.push(U.potenza((PI2 * k) / L) / (4 * Math.PI * k2 * k)); // k in giri per lato
  }
  return { N: P.length, KX: Int16Array.from(kx), KY: Int16Array.from(ky), KZ: Int16Array.from(kz), PK: Float64Array.from(P) };
}
// IL CAMPO LIBERO DI UN INDIRIZZO: le due ampiezze (parte reale e immaginaria) di ogni onda, a campana, con varianza
// metà della sua potenza. Ogni onda è UN EVENTO con il suo nome, dal suo vettore d'onda: «radice/campo/onda 3,-2,7»
// (quattro estrazioni: due per campana). Così il campo non dipende dall'ordine in cui lo si genera né da quante onde
// si prendono (alzando kmax le onde lunghe restano le stesse: regola 4), è identico al bit su ogni macchina (campana
// di eventi.js: logaritmo e coseno esatti), e un ramo su un'onda cambia quell'onda sola (regola 3).
// O: ciò che dà ondeDelToro. → { A, B }
export function ampiezzeLibere(radice, rami, O) {
  const c = sorgente(`${radice}/campo`, rami), A = new Float64Array(O.N), B = new Float64Array(O.N);
  for (let m = 0; m < O.N; m++) { const s = c.serie(`onda ${O.KX[m]},${O.KY[m]},${O.KZ[m]}`), a = Math.sqrt(O.PK[m] / 2); A[m] = a * campana(s(0), s(1)); B[m] = a * campana(s(2), s(3)); }
  return { A, B };
}
const campi = new WeakMap();
// IL COSMO IN 3D. C: cosmo(n) di cosmo.js (le galassie con pos [x, y] e peso); radice e rami: l'indirizzo del cosmo
// («cosmo 1») e i suoi rami; toroM: il lato. → vedi i campi restituiti in fondo.
export function cosmo3d(C, radice, rami = null, { toroM = 3.7e25, onde = 9, kmax = 24, celle = 64 } = {}) {
  let F = campi.get(C); if (F) return F;
  const L = toroM / MPC;
  // ---- le onde (ondeDelToro) e le loro ampiezze libere (ampiezzeLibere: un evento per onda)
  const O = ondeDelToro(toroM, kmax), { N, KX, KY, KZ, PK } = O, { A, B } = ampiezzeLibere(radice, rami, O);
  const A0 = Float64Array.from(A), B0 = Float64Array.from(B); // il campo LIBERO di questo indirizzo, prima di ogni vincolo (per bolle.js)
  // ---- le galassie: x, y dalla carta; z un evento di ognuna
  const G = C.galassie, ng = G.length, pos = G.map((g) => [g.pos[0], g.pos[1], sorgente(`${radice}/galassia ${g.id}`, rami)('profondità')]);
  // ---- il vincolo: il campo filtrato alle onde lunghe (|k| ≤ onde) vale peso·σ nel punto di ogni galassia
  const lunghe = []; for (let i = 0; i < N; i++) if (KX[i] ** 2 + KY[i] ** 2 + KZ[i] ** 2 <= onde * onde) lunghe.push(i);
  const sigmaOnde = SIGMA_CAMPO(toroM, onde), co = new Float64Array(ng), si = new Float64Array(ng), xi = new Float64Array(ng * ng), resto = new Float64Array(ng); let s2 = 0;
  for (let i = 0; i < ng; i++) resto[i] = (G[i].peso ?? 0) * sigmaOnde;
  const valori = Float64Array.from(resto); // ciò che il campo filtrato deve valere in ogni galassia
  for (const m of lunghe) {
    s2 += 2 * PK[m];
    for (let i = 0; i < ng; i++) { const t = PI2 * (KX[m] * pos[i][0] + KY[m] * pos[i][1] + KZ[m] * pos[i][2]); co[i] = Math.cos(t); si[i] = Math.sin(t); resto[i] -= 2 * (A[m] * co[i] - B[m] * si[i]); }
    for (let i = 0; i < ng; i++) for (let j = i; j < ng; j++) xi[i * ng + j] += 2 * PK[m] * (co[i] * co[j] + si[i] * si[j]);
  }
  for (let i = 0; i < ng; i++) { for (let j = 0; j < i; j++) xi[i * ng + j] = xi[j * ng + i]; xi[i * ng + i] *= 1 + 1e-9; }
  // (si risolve ξ·w = resto: eliminazione di Gauss con il perno più grande)
  const w = Float64Array.from(resto); { const M = Float64Array.from(xi);
    for (let p = 0; p < ng; p++) { let b = p; for (let r = p + 1; r < ng; r++) if (Math.abs(M[r * ng + p]) > Math.abs(M[b * ng + p])) b = r; if (b !== p) { for (let q = 0; q < ng; q++) { const t = M[p * ng + q]; M[p * ng + q] = M[b * ng + q]; M[b * ng + q] = t; } const t = w[p]; w[p] = w[b]; w[b] = t; }
      const d = M[p * ng + p] || 1e-300; for (let r = p + 1; r < ng; r++) { const f = M[r * ng + p] / d; if (f) { for (let q = p; q < ng; q++) M[r * ng + q] -= f * M[p * ng + q]; w[r] -= f * w[p]; } } }
    for (let p = ng - 1; p >= 0; p--) { let s = w[p]; for (let q = p + 1; q < ng; q++) s -= M[p * ng + q] * w[q]; w[p] = s / (M[p * ng + p] || 1e-300); } }
  for (const m of lunghe) { let a = 0, b = 0; for (let j = 0; j < ng; j++) { const t = PI2 * (KX[m] * pos[j][0] + KY[m] * pos[j][1] + KZ[m] * pos[j][2]); a += w[j] * Math.cos(t); b -= w[j] * Math.sin(t); } A[m] += PK[m] * a; B[m] += PK[m] * b; }
  // ---- le grandezze in un punto (coordinate sul toro, 0…1), per somma diretta delle onde
  const f0 = Math.log(U.D(1.01) / U.D(0.99)) / Math.log(1.01 / 0.99), kV = (COSMO.H0 * f0 * L) / PI2; // km/s per unità di δ·k/k² (k in giri)
  const somma = (x, quali, fa) => { const n = quali ? quali.length : N; for (let q = 0; q < n; q++) { const m = quali ? quali[q] : q, t = PI2 * (KX[m] * x[0] + KY[m] * x[1] + KZ[m] * x[2]), cs = Math.cos(t), sn = Math.sin(t); fa(m, 2 * (A[m] * cs - B[m] * sn), 2 * (A[m] * sn + B[m] * cs)); } };
  const densita = (x) => { let d = 0; somma(x, null, (m, re) => { d += re; }); return d; };
  const densitaLunga = (x) => { let d = 0; somma(x, lunghe, (m, re) => { d += re; }); return d; };
  const velocita = (x) => { const v = [0, 0, 0]; somma(x, null, (m, re, im) => { const q = (-kV * im) / (KX[m] ** 2 + KY[m] ** 2 + KZ[m] ** 2); v[0] += q * KX[m]; v[1] += q * KY[m]; v[2] += q * KZ[m]; }); return v; };
  // il tensore di marea (∂²φ/∂x∂x in unità di 4πGρ̄: la sua traccia è δ) e l'hessiano del campo filtrato (per unità di (2π/L)²)
  const marea = (x) => { const T = [0, 0, 0, 0, 0, 0], H = [0, 0, 0, 0, 0, 0]; somma(x, null, (m, re) => { const a = KX[m], b = KY[m], cz = KZ[m], k2 = a * a + b * b + cz * cz, r = re / k2, h = k2 <= onde * onde ? -re : 0; T[0] += r * a * a; T[1] += r * b * b; T[2] += r * cz * cz; T[3] += r * a * b; T[4] += r * a * cz; T[5] += r * b * cz; if (h) { H[0] += h * a * a; H[1] += h * b * b; H[2] += h * cz * cz; H[3] += h * a * b; H[4] += h * a * cz; H[5] += h * b * cz; } }); return { T, H }; };
  // ---- ciò che costa, a richiesta
  let grigliaFatta = null, moti = null, assi = null;
  const griglia = () => {
    if (grigliaFatta) return grigliaFatta;
    const n = celle, re = new Float64Array(n * n * n), im = new Float64Array(n * n * n), dove = (x, y, z) => ((z + n) % n) * n * n + ((y + n) % n) * n + ((x + n) % n);
    for (let m = 0; m < N; m++) { if (Math.abs(KX[m]) >= n / 2 || Math.abs(KY[m]) >= n / 2 || KZ[m] >= n / 2) continue; const a = dove(KX[m], KY[m], KZ[m]), b = dove(-KX[m], -KY[m], -KZ[m]); re[a] = A[m]; im[a] = B[m]; re[b] = A[m]; im[b] = -B[m]; }
    for (let z = 0; z < n; z++) for (let y = 0; y < n; y++) fft(re, im, n, z * n * n + y * n, 1, true);
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) fft(re, im, n, z * n * n + x, n, true);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) fft(re, im, n, y * n + x, n * n, true);
    let v = 0; const d = new Float32Array(n * n * n); for (let i = 0; i < d.length; i++) { d[i] = re[i]; v += re[i] * re[i]; }
    return (grigliaFatta = { n, delta: d, sigma: Math.sqrt(v / d.length), latoCellaM: toroM / n }); // delta[z·n² + y·n + x]: la sovradensità lineare di oggi al centro… all'angolo (x/n, y/n, z/n) della cella
  };
  const motiGalassie = () => moti || (moti = pos.map((x) => velocita(x)));
  const assiGalassie = () => assi || (assi = pos.map((x, i) => {
    const { T, H } = marea(x), sim = (S) => [[S[0], S[3], S[4]], [S[3], S[1], S[5]], [S[4], S[5], S[2]]], Tm = sim(T), Hm = sim(H.map((v) => -v));
    // l'inerzia del proto-alone ∝ l'inverso dell'hessiano (cambiato di segno): gli assi lunghi dove il picco è più piatto
    const d = Hm[0][0] * (Hm[1][1] * Hm[2][2] - Hm[1][2] ** 2) - Hm[0][1] * (Hm[0][1] * Hm[2][2] - Hm[1][2] * Hm[0][2]) + Hm[0][2] * (Hm[0][1] * Hm[1][2] - Hm[1][1] * Hm[0][2]);
    const I = [[Hm[1][1] * Hm[2][2] - Hm[1][2] ** 2, Hm[0][2] * Hm[1][2] - Hm[0][1] * Hm[2][2], Hm[0][1] * Hm[1][2] - Hm[0][2] * Hm[1][1]], [0, Hm[0][0] * Hm[2][2] - Hm[0][2] ** 2, Hm[0][1] * Hm[0][2] - Hm[0][0] * Hm[1][2]], [0, 0, Hm[0][0] * Hm[1][1] - Hm[0][1] ** 2]]; I[1][0] = I[0][1]; I[2][0] = I[0][2]; I[2][1] = I[1][2];
    const TI = [0, 1, 2].map((a) => [0, 1, 2].map((b) => (Tm[a][0] * I[0][b] + Tm[a][1] * I[1][b] + Tm[a][2] * I[2][b]) / (d || 1)));
    // L_i = ε_ijk·(T·I)_jk: la parte antisimmetrica del prodotto (nulla se marea e forma sono allineate)
    let J = [TI[1][2] - TI[2][1], TI[2][0] - TI[0][2], TI[0][1] - TI[1][0]]; const n = Math.hypot(...J);
    if (!(n > 1e-12)) { const cg = sorgente(`${radice}/galassia ${G[i].id}`, rami), z = 2 * cg('asse/z') - 1, fi = PI2 * cg('asse/fi'), r = Math.sqrt(1 - z * z); J = [r * Math.cos(fi), r * Math.sin(fi), z]; return { asse: J, coppia: 0, picco: d > 0 }; }
    return { asse: J.map((v) => v / n), coppia: n, picco: Hm[0][0] > 0 && d > 0 };
  }));
  // quante galassie vere rappresenta ognuna di quelle segnate: gli aloni del toro pesanti almeno quanto il più piccolo dei loro
  const mMin = Math.min(...G.map((g) => g.forma?.alone?.massa ?? Infinity)), vere = isFinite(mMin) ? U.aloni(mMin) * L ** 3 : NaN;
  // ---- nel tempo (t in Ga dall'inizio; oggi U.tempo(1)): il fattore di scala, la crescita, dove sta e come va ogni galassia
  const crescita = (a) => ({ a, D: U.D(a), f: Math.log(U.D(a * 1.01) / U.D(a * 0.99)) / Math.log(1.01 / 0.99), H: COSMO.H0 * U.E(a) });
  const alTempo = (tGa) => {
    const a = U.scala(Math.max(tGa, 1e-4)), g = crescita(a), V = motiGalassie(), k = (a * g.H * g.f * g.D) / (COSMO.H0 * f0); // quanto vale la velocità peculiare rispetto a oggi
    const comoventi = pos.map((x, i) => [0, 1, 2].map((d) => x[d] - ((1 - g.D) * V[i][d]) / (COSMO.H0 * f0 * L))); // Zel'dovich: x(t) = x₀ − (1 − D)·Ψ, Ψ = v/(H₀·f₀)
    return { a, z: 1 / a - 1, D: g.D, H: g.H, latoM: a * toroM, comoventi, velocita: V.map((v) => v.map((q) => q * k)) };
  };
  F = { toroM, latoMpc: L, onde: { n: N, kx: KX, ky: KY, kz: KZ, A, B, potenza: PK, kmax }, libere: { A: A0, B: B0 }, vincoli: { taglio: onde, valori }, sigmaOnde, sigmaLunghe: Math.sqrt(s2), pos, densita, densitaLunga, velocita, marea, griglia, motiGalassie, assiGalassie, alTempo, crescita, f0, vere, peso: vere / ng, massaMinima: mMin, oggiGa: U.tempo(1) };
  campi.set(C, F); return F;
}
