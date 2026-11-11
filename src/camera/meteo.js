// meteo.js — LA CIRCOLAZIONE DELL'ARIA E IL CICLO DELL'ACQUA di un pianeta (bozza di lavoro: intestazione in fondo al lavoro)

import { COSTANTI, R_GAS, ANNO } from './leggi.js';
import { pressioneVapore, atmosfera, MOLECOLE } from './chimica.js';

export const PARAMETRI = {
  cdMare: 1.3e-3, cdTerra: 3e-3, // attrito dell'aria sul suolo (coefficiente della formula di massa: misurato)
  ce: 1.3e-3, // lo stesso per l'evaporazione
  raffica: 1, // (m/s) il vento minimo, quello delle raffiche della convezione, quando l'aria è ferma
  secchio: 150, // (kg/m²) quanta acqua tiene il suolo (Manabe 1969)
  stabilitaSecca: 0.8, // un'aria senza vapore: il suo gradiente termico come frazione dell'adiabatico secco
  frazioneCalda: 0.25, // la parte più calda del pianeta, dove la convezione profonda fissa la stratificazione
  tempoPioggia: 4 * 3600, // (s) in quanto tempo l'eccesso di vapore piove
  umiditaPioggia: 0.8, // piove quando il vapore della colonna supera questa frazione della saturazione (Bretherton e altri 2004)
  umiditaNuvole: 0.6,
  vaporeMassimo: 0.1, // il vapore non supera questa frazione della pressione dell'aria: oltre, l'acqua stessa diventa l'atmosfera // sotto questa umidità relativa niente nuvole (Sundqvist)
  viscosita: 0.003, courant: 0.85, coriolis: 0.5, // numerici
  increspatura: 1, // (K) la perturbazione iniziale di un pianeta perfettamente liscio (fissa, non a caso)
  latCritica: 45, // numerico: oltre questa latitudine le onde più corte del passo all'equatore si filtrano
};
const MOLARE_ACQUA = 0.018015, SIGMA = COSTANTI.sigma, DIAMETRO_MOLECOLA = 3.7e-10; // (m) il diametro d'urto di una molecola d'aria

// ---------- la trasformata di Fourier per righe (lati potenze di 2)
function tabellaFft(n) {
  const inv = new Uint16Array(n), co = new Float64Array(n / 2 || 1), si = new Float64Array(n / 2 || 1);
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; inv[i] = j; }
  for (let k = 0; k < n / 2; k++) { co[k] = Math.cos((2 * Math.PI * k) / n); si[k] = Math.sin((2 * Math.PI * k) / n); }
  return { inv, co, si };
}
function fft(re, im, o, n, t, inversa) {
  const { inv, co, si } = t, segno = inversa ? 1 : -1;
  for (let i = 1; i < n; i++) { const j = inv[i]; if (i < j) { let x = re[o + i]; re[o + i] = re[o + j]; re[o + j] = x; x = im[o + i]; im[o + i] = im[o + j]; im[o + j] = x; } }
  for (let len = 2, salto = n >> 1; len <= n; len <<= 1, salto >>= 1) { const m = len >> 1;
    for (let i = 0; i < n; i += len) for (let k = 0, q = 0; k < m; k++, q += salto) {
      const wr = co[q], wi = segno * si[q], a = o + i + k, b = a + m, vr = re[b] * wr - im[b] * wi, vi = re[b] * wi + im[b] * wr;
      re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi;
    } }
}

// ---------- IL MOTORE: due strati d'aria di uguale massa sulla sfera (griglia C: θ e vapore al centro, u a est, v a sud)
function motore(W, H, par, forz) {
  const S = W + 2, N = S * (H + 2), NP = W * H, { a, omega, b, dt, tauRad } = par;
  const dl = (2 * Math.PI) / W, df = Math.PI / H, ry = 1 / (a * df);
  const cc = new Float64Array(H), cfS = new Float64Array(H), cfN = new Float64Array(H), rx = new Float64Array(H), fz = new Float64Array(H);
  for (let j = 0; j < H; j++) { cc[j] = Math.sin((j + 0.5) * df); cfS[j] = j < H - 1 ? Math.sin((j + 1) * df) : 0; cfN[j] = j > 0 ? Math.sin(j * df) : 0; rx[j] = 1 / (a * cc[j] * dl); fz[j] = 2 * omega * Math.cos((j + 1) * df); }
  const nuovo = () => new Float64Array(N);
  const u1 = nuovo(), v1 = nuovo(), u2 = nuovo(), v2 = nuovo(), th1 = nuovo(), th2 = nuovo(), wv = nuovo(), suolo = new Float64Array(NP).fill(0.5 * PARAMETRI.secchio);
  const D1 = nuovo(), D2 = nuovo(), K1 = nuovo(), K2 = nuovo(), q1 = nuovo(), q2 = nuovo(), chi = nuovo(), flE = nuovo(), flS = nuovo();
  const freno = new Float64Array(NP), du1 = nuovo(), dv1 = nuovo(), du2 = nuovo(), dv2 = nuovo(), dt1 = nuovo(), dt2 = nuovo();
  let Nu1 = [nuovo(), nuovo(), nuovo()], Nv1 = [nuovo(), nuovo(), nuovo()], Nu2 = [nuovo(), nuovo(), nuovo()], Nv2 = [nuovo(), nuovo(), nuovo()], Nt1 = [nuovo(), nuovo(), nuovo()], Nt2 = [nuovo(), nuovo(), nuovo()];
  const orlo = (x) => { for (let j = 1; j <= H; j++) { const o = j * S; x[o] = x[o + W]; x[o + W + 1] = x[o + 1]; } };
  // --- il filtro dei poli: vicino ai poli le celle sono strette, e le onde corte lungo il parallelo correrebbero più
  // del passo di tempo. Lì gli incrementi si lisciano lungo il parallelo: x − m·∂²x = incremento (un sistema tridiagonale
  // ciclico per riga), con m tale che nessuna onda vada più veloce di quanto la griglia regge alla latitudine critica
  const cCrit = Math.cos((PARAMETRI.latCritica * Math.PI) / 180), liscia = (c) => {
    if (W < 8 || c >= cCrit) return null; const m = 1 / (16 * (c / cCrit) ** 2), d = 1 + 2 * m, piv = new Float64Array(W), z = new Float64Array(W);
    // Thomas sul sistema aperto (senza i due angoli) con la diagonale ritoccata, e la correzione di Sherman-Morrison
    const d0 = d + m, dn = d + m; let prec = 0; for (let i = 0; i < W; i++) { const dd = i === 0 ? d0 : i === W - 1 ? dn : d; piv[i] = 1 / (dd + m * prec); prec = -m * piv[i]; }
    const ris = (x) => { let p = 0; for (let i = 0; i < W; i++) p = x[i] = (x[i] + m * p) * piv[i]; for (let i = W - 2; i >= 0; i--) x[i] += m * piv[i] * x[i + 1]; };
    for (let i = 0; i < W; i++) z[i] = 0; z[0] = -m; z[W - 1] = -m; ris(z); // u = (−m, 0, …, 0, −m), v = (1, 0, …, 0, 1)
    return { m, piv, z, f: 1 / (1 + z[0] + z[W - 1]) }; };
  const lisciaC = Array.from({ length: H }, (_, j) => liscia(cc[j])), lisciaF = Array.from({ length: H }, (_, j) => (j < H - 1 ? liscia(cfS[j]) : null));
  const filtra = (x, righe) => { for (let j = 0; j < H; j++) { const g = righe[j]; if (!g) continue; const o = (j + 1) * S + 1, { m, piv, z } = g;
    let p = 0; for (let i = 0; i < W; i++) p = x[o + i] = (x[o + i] + m * p) * piv[i]; for (let i = W - 2; i >= 0; i--) x[o + i] += m * piv[i] * x[o + i + 1];
    const k = (x[o] + x[o + W - 1]) * g.f; for (let i = 0; i < W; i++) x[o + i] -= k * z[i]; } };
  // il vapore, che non può diventare negativo, vicino ai poli si media a blocchi di celle (una griglia ridotta)
  const blocco = new Int32Array(H); for (let j = 0; j < H; j++) { let m = 1; while (W >= 8 && m < W / 4 && m * cc[j] < 0.5 * cCrit) m *= 2; blocco[j] = m; }
  // --- la pressione che tiene il moto medio dei due strati senza divergenza (coperchio rigido): Poisson sulla sfera,
  // Fourier in longitudine (dati reali: una trasformata complessa lunga la metà) e un sistema tridiagonale in latitudine
  // per ogni onda
  const M = W >> 1, tf = M > 1 ? tabellaFft(M) : null, zr = new Float64Array(M || 1), zi = new Float64Array(M || 1), sr = new Float64Array((M + 1) * H), si = new Float64Array((M + 1) * H), r2 = (df / dl) ** 2;
  const co = new Float64Array(M + 1), se = new Float64Array(M + 1); for (let k = 0; k <= M; k++) { co[k] = Math.cos((2 * Math.PI * k) / W); se[k] = Math.sin((2 * Math.PI * k) / W); }
  const piv = new Float64Array((M + 1) * H), sup = new Float64Array((M + 1) * H);
  for (let k = 1; k <= M; k++) { const lam = 2 - 2 * co[k]; let cPrec = 0;
    for (let j = 0; j < H; j++) { const d = -(cfN[j] + cfS[j]) - (lam * r2) / cc[j], m = 1 / (d - cfN[j] * cPrec); piv[k * H + j] = m; cPrec = sup[k * H + j] = cfS[j] * m; } }
  const proietta = () => {
    orlo(u1); orlo(u2); // (v ai poli è già zero)
    for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, f = (0.5 * cc[j]) / (ry * ry), cn = (cfN[j] * ry) / cc[j], cs = (cfS[j] * ry) / cc[j], r = rx[j];
      if (W === 1) { const k = o; sr[j] = f * ((v1[k - S] + v2[k - S]) * cn - (v1[k] + v2[k]) * cs); continue; }
      for (let n = 0; n < M; n++) { let k = o + 2 * n; zr[n] = f * ((u1[k] + u2[k] - u1[k - 1] - u2[k - 1]) * r + (v1[k - S] + v2[k - S]) * cn - (v1[k] + v2[k]) * cs); k++; zi[n] = f * ((u1[k] + u2[k] - u1[k - 1] - u2[k - 1]) * r + (v1[k - S] + v2[k - S]) * cn - (v1[k] + v2[k]) * cs); }
      fft(zr, zi, 0, M, tf, false);
      for (let k = 0; k <= M; k++) { const ka = k === M ? 0 : k, kb = k === 0 ? 0 : M - k, er = 0.5 * (zr[ka] + zr[kb]), ei = 0.5 * (zi[ka] - zi[kb]), or = 0.5 * (zi[ka] + zi[kb]), oi = -0.5 * (zr[ka] - zr[kb]);
        sr[k * H + j] = er + co[k] * or + se[k] * oi; si[k * H + j] = ei + co[k] * oi - se[k] * or; } }
    // l'onda zero (la media lungo il parallelo): attraverso ogni parallelo non passa massa
    { let g = 0, x = 0; for (let j = 0; j < H; j++) { const r = sr[j]; sr[j] = x; si[j] = 0; g -= r; if (j < H - 1) x -= g / cfS[j]; } }
    for (let k = 1; k <= M; k++) { const o = k * H;
      let pr = 0, pi = 0; for (let j = 0; j < H; j++) { const m = piv[o + j]; pr = sr[o + j] = (sr[o + j] - cfN[j] * pr) * m; pi = si[o + j] = (si[o + j] - cfN[j] * pi) * m; }
      for (let j = H - 2; j >= 0; j--) { sr[o + j] -= sup[o + j] * sr[o + j + 1]; si[o + j] -= sup[o + j] * si[o + j + 1]; } }
    for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1;
      if (W === 1) { chi[o] = sr[j]; continue; }
      for (let k = 0; k < M; k++) { const xr = sr[k * H + j], xi = si[k * H + j], yr = sr[(M - k) * H + j], yi = -si[(M - k) * H + j]; // X[k] e X[k + M] = coniugato di X[M − k]
        const er = 0.5 * (xr + yr), ei = 0.5 * (xi + yi), dr = 0.5 * (xr - yr), di = 0.5 * (xi - yi), or = dr * co[k] - di * se[k], oi = dr * se[k] + di * co[k];
        zr[k] = er - oi; zi[k] = ei + or; }
      fft(zr, zi, 0, M, tf, true);
      const nM = 1 / M; for (let n = 0; n < M; n++) { chi[o + 2 * n] = zr[n] * nM; chi[o + 2 * n + 1] = zi[n] * nM; } }
    orlo(chi);
    for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, r = rx[j], ult = j === H - 1;
      for (let i = 0; i < W; i++) { const k = o + i, gx = (chi[k + 1] - chi[k]) * r; u1[k] -= gx; u2[k] -= gx; if (!ult) { const gy = (chi[k] - chi[k + S]) * ry; v1[k] -= gy; v2[k] -= gy; } } }
  };
  // --- le grandezze derivate di uno strato: divergenza, energia cinetica, vorticità assoluta
  const derivate = (u, v, D, K, q) => {
    for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, r = rx[j], cn = cfN[j], cs = cfS[j], ic = 1 / cc[j], sotto = j < H - 1, cj = cc[j], cj1 = sotto ? cc[j + 1] : 0, iz = sotto ? 1 / (a * cs) : 0;
      for (let i = 0; i < W; i++) { const k = o + i, ue = u[k], uw = u[k - 1], vn = v[k - S], vs = v[k];
        D[k] = (ue - uw) * r + (vn * cn - vs * cs) * ry * ic;
        K[k] = 0.25 * (ue * ue + uw * uw) + 0.25 * (vn * vn * cn + vs * vs * cs) * ic;
        q[k] = sotto ? fz[j] + ((v[k + 1] - vs) / dl - (ue * cj - u[k + S] * cj1) / df) * iz : 0; } }
    orlo(D); orlo(K); orlo(q);
  };
  const nuX = new Float64Array(H), nuY = par.nu * ry * ry; for (let j = 0; j < H; j++) nuX[j] = par.nu * rx[j] * rx[j] * Math.min(1, (cc[j] / cCrit) ** 2);
  const acc = { n: 0, u1: new Float64Array(NP), v1: new Float64Array(NP), u2: new Float64Array(NP), v2: new Float64Array(NP), th1: new Float64Array(NP), th2: new Float64Array(NP), piove: new Float64Array(NP), evapora: new Float64Array(NP), nuvole: new Float64Array(NP), umidita: new Float64Array(NP), calore: new Float64Array(NP), sale: new Float64Array(NP), scorre: new Float64Array(NP), vapore: new Float64Array(NP) };
  const { t1Eq, t2Eq, wSat, kE, bagnato, cd } = forz, attrito = 2 / par.hs, kRad = dt / tauRad, kSuolo = (dt * 2 * PARAMETRI.ce) / par.hs, kPioggia = 1 - Math.exp(-dt / PARAMETRI.tempoPioggia), u0 = PARAMETRI.umiditaNuvole, { w1, w2, capStrato } = par, latente = par.L / (capStrato * w2);
  const raffica2 = PARAMETRI.raffica ** 2, secchio = PARAMETRI.secchio, { piove: aPiove, evapora: aEvapora, umidita: aUmidita, vapore: aVapore, calore: aCalore, th1: aTh1, th2: aTh2, sale: aSale, nuvole: aNuvole, scorre: aScorre, u1: aU1, v1: aV1, u2: aU2, v2: aV2 } = acc;
  const pX = nuovo(), pY = nuovo(), rc = PARAMETRI.umiditaPioggia;
  let passi = 0;
  // una temperatura portata dal vento del suo strato (la parte che si può estrapolare nel tempo)
  const porta = (th, u, v, D, T0, Ta, Tb, c0, c1, c2, out) => {
    for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, r = rx[j], cn = (cfN[j] * ry) / cc[j], cs = (cfS[j] * ry) / cc[j], nx = nuX[j], yn = nuY * cfN[j] / cc[j], ys = nuY * cfS[j] / cc[j];
      for (let i = 0; i < W; i++) { const k = o + i, t = th[k], te = th[k + 1], tw = th[k - 1], tn = th[k - S], ts = th[k + S];
        const x = -0.5 * ((u[k] * (t + te) - u[k - 1] * (tw + t)) * r + v[k - S] * (tn + t) * cn - v[k] * (t + ts) * cs) + t * D[k] + (te + tw - 2 * t) * nx + (tn - t) * yn - (t - ts) * ys;
        T0[k] = x; out[k] = dt * (c0 * x + c1 * Ta[k] + c2 * Tb[k]); } } };
  const passo = (accumula) => {
    orlo(u1); orlo(u2); orlo(v1); orlo(v2); orlo(th1); orlo(th2); orlo(wv);
    derivate(u1, v1, D1, K1, q1); derivate(u2, v2, D2, K2, q2);
    const [c0, c1, c2] = passi === 0 ? [1, 0, 0] : passi === 1 ? [1.5, -0.5, 0] : [23 / 12, -16 / 12, 5 / 12];
    // (1) LE TEMPERATURE dei due strati: portate dal vento; dove l'aria sale si raffredda (di metà della differenza tra gli strati)
    porta(th1, u1, v1, D1, Nt1[0], Nt1[1], Nt1[2], c0, c1, c2, dt1); porta(th2, u2, v2, D2, Nt2[0], Nt2[1], Nt2[2], c0, c1, c2, dt2);
    for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1; for (let i = 0; i < W; i++) { const k = o + i, x = 0.5 * dt * D1[k] * (th1[k] - th2[k]); dt1[k] -= x; dt2[k] -= x; } }
    filtra(dt1, lisciaC); filtra(dt2, lisciaC);
    // (2) L'ACQUA: il vapore viaggia con il vento basso (a monte), evapora, e dove supera la saturazione piove
    { // le pendenze limitate (van Leer): il vapore non si sparpaglia più di quanto il vento lo porti, e non diventa negativo
      for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, interno = j > 0 && j < H - 1; for (let i = 0; i < W; i++) { const k = o + i, w = wv[k], a = w - wv[k - 1], bb = wv[k + 1] - w; pX[k] = a * bb > 0 ? (2 * a * bb) / (a + bb) : 0; if (interno) { const c = w - wv[k + S], d = wv[k - S] - w; pY[k] = c * d > 0 ? (2 * c * d) / (c + d) : 0; } } }
      orlo(pX);
      for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, cx = dt * rx[j], cy = dt * ry; for (let i = 0; i < W; i++) { const k = o + i, ue = u2[k], vs = v2[k], ce = ue * cx, cs = vs * cy;
        flE[k] = ue * (ue > 0 ? wv[k] + 0.5 * Math.max(0, 1 - ce) * pX[k] : wv[k + 1] - 0.5 * Math.max(0, 1 + ce) * pX[k + 1]);
        flS[k] = vs * (vs > 0 ? wv[k + S] + 0.5 * (1 - cs) * pY[k + S] : wv[k] - 0.5 * (1 + cs) * pY[k]); } }
      orlo(flE);
      for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, r = rx[j], cn = (cfN[j] * ry) / cc[j], cs = (cfS[j] * ry) / cc[j], m = blocco[j];
        for (let i = 0; i < W; i++) { const k = o + i; chi[k] = wv[k] - dt * ((flE[k] - flE[k - 1]) * r + flS[k - S] * cn - flS[k] * cs); }
        if (m > 1) for (let i = 0; i < W; i += m) { let s = 0; for (let x = 0; x < m; x++) s += chi[o + i + x]; s /= m; for (let x = 0; x < m; x++) chi[o + i + x] = s; }
        for (let i = 0; i < W; i++) { const k = o + i, p = j * W + i, ws = wSat[p], uc = 0.5 * (u2[k] + u2[k - 1]), vc = 0.5 * (v2[k] + v2[k - S]), vel = Math.sqrt(uc * uc + vc * vc + raffica2);
          let w = chi[k], ev = 0, pv = 0, evTerra = 0;
          if (ws > 0) {
            const secco = Math.max(0, 1 - w / ws), bg = bagnato[p], pot = kE[p] * vel, beta = Math.min(1, suolo[p] / (0.75 * secchio));
            let aT = (1 - bg) * beta * pot; if (aT * secco * dt > (1 - bg) * suolo[p]) aT = ((1 - bg) * suolo[p]) / (secco * dt);
            const A = bg * pot + aT;
            if (A > 0 && secco > 0) { const wn = (w + dt * A) / (1 + (dt * A) / ws); ev = (wn - w) / dt; evTerra = (ev * aT) / A; w = wn; }
            if (w > rc * ws) { pv = ((w - rc * ws) * kPioggia) / dt; w -= pv * dt; }
            if (bg < 1) { let s = suolo[p] + (dt * (pv * (1 - bg) - evTerra)) / (1 - bg); if (s > secchio) { if (accumula) aScorre[p] += ((s - secchio) * (1 - bg)) / dt; s = secchio; } suolo[p] = s < 0 ? 0 : s; }
          } else w = 0;
          wv[k] = w; freno[p] = dt * attrito * cd[p] * vel;
          // le temperature nuove: il calore latente (di ciò che piove meno ciò che evapora) allo strato basso; lo strato
          // basso scambia calore con la superficie (tanto più quanto più c'è vento) e tutti e due irraggiano; se lo
          // strato basso diventa troppo caldo per quello alto, la convezione li rimescola (conservando l'energia)
          const e1 = t1Eq[p], e2 = t2Eq[p], k2 = kRad + kSuolo * vel;
          let a1 = (th1[k] + dt1[k] + kRad * e1) / (1 + kRad), a2 = (th2[k] + dt2[k] + latente * (pv - ev) * dt + k2 * e2) / (1 + k2);
          if (a1 - a2 < e1 - e2) { const en = w1 * a1 + w2 * a2; a2 = (en - w1 * (e1 - e2)) / (w1 + w2); a1 = a2 + e1 - e2; }
          th1[k] = a1; th2[k] = a2;
          if (accumula) { const rh = ws > 0 ? Math.min(1, w / (rc * ws)) : 0; aPiove[p] += pv; aEvapora[p] += ev; aUmidita[p] += rh; aVapore[p] += w; aCalore[p] += (w1 * kRad * (a1 - e1) + w2 * k2 * (a2 - e2)); aTh1[p] += a1; aTh2[p] += a2; aSale[p] += D1[k];
            if (rh > u0) aNuvole[p] += 1 - Math.sqrt((1 - rh) / (1 - u0)); }
        } }
      orlo(th1); orlo(th2); }
    // (3) IL VENTO: Coriolis e vorticità, energia cinetica, scambio verticale, viscosità (Adams-Bashforth), poi la
    // spinta della temperatura nuova (avanti-indietro), l'attrito al suolo (implicito) e la pressione del coperchio
    { const A1 = Nu1[0], B1 = Nv1[0], A2 = Nu2[0], B2 = Nv2[0], hb = 0.25 * b * dt, A1a = Nu1[1], A1b = Nu1[2], A2a = Nu2[1], A2b = Nu2[2], B1a = Nv1[1], B1b = Nv1[2], B2a = Nv2[1], B2b = Nv2[2];
      for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, r = rx[j], cn = cfN[j], cs = cfS[j], ic = 0.25 / cc[j], sotto = j < H - 1, nx = nuX[j], yn = nuY * cn / cc[j], ys = nuY * cs / cc[j], cj = cc[j], cj1 = sotto ? cc[j + 1] : 0, yv = sotto ? nuY / cs : 0;
        for (let i = 0; i < W; i++) { const k = o + i;
          // u (faccia est)
          const a1 = u1[k], a2 = u2[k], dw = 0.5 * (D1[k] + D1[k + 1]), sc = dw * (a2 - a1);
          let t1 = (q1[k - S] * (v1[k - S] + v1[k - S + 1]) * cn + q1[k] * (v1[k] + v1[k + 1]) * cs) * ic - (K1[k + 1] - K1[k]) * r + (u1[k + 1] + u1[k - 1] - 2 * a1) * nx + (u1[k - S] - a1) * yn - (a1 - u1[k + S]) * ys;
          let t2 = (q2[k - S] * (v2[k - S] + v2[k - S + 1]) * cn + q2[k] * (v2[k] + v2[k + 1]) * cs) * ic - (K2[k + 1] - K2[k]) * r + (u2[k + 1] + u2[k - 1] - 2 * a2) * nx + (u2[k - S] - a2) * yn - (a2 - u2[k + S]) * ys;
          if (dw > 0) t1 += sc; else t2 += sc;
          A1[k] = t1; A2[k] = t2;
          const gx = hb * (th1[k + 1] + th2[k + 1] - th1[k] - th2[k]) * r;
          du1[k] = dt * (c0 * t1 + c1 * A1a[k] + c2 * A1b[k]) - gx; du2[k] = dt * (c0 * t2 + c1 * A2a[k] + c2 * A2b[k]) + gx;
          // v (faccia sud)
          if (sotto) { const b1 = v1[k], b2 = v2[k], dv = 0.5 * (D1[k] + D1[k + S]), sv = dv * (b2 - b1);
            let s1 = -0.25 * (q1[k - 1] * (u1[k - 1] + u1[k - 1 + S]) + q1[k] * (a1 + u1[k + S])) - (K1[k] - K1[k + S]) * ry + (v1[k + 1] + v1[k - 1] - 2 * b1) * nx + ((v1[k - S] - b1) * cj - (b1 - v1[k + S]) * cj1) * yv;
            let s2 = -0.25 * (q2[k - 1] * (u2[k - 1] + u2[k - 1 + S]) + q2[k] * (a2 + u2[k + S])) - (K2[k] - K2[k + S]) * ry + (v2[k + 1] + v2[k - 1] - 2 * b2) * nx + ((v2[k - S] - b2) * cj - (b2 - v2[k + S]) * cj1) * yv;
            if (dv > 0) s1 += sv; else s2 += sv;
            B1[k] = s1; B2[k] = s2;
            const gy = hb * (th1[k] + th2[k] - th1[k + S] - th2[k + S]) * ry;
            dv1[k] = dt * (c0 * s1 + c1 * B1a[k] + c2 * B1b[k]) - gy; dv2[k] = dt * (c0 * s2 + c1 * B2a[k] + c2 * B2b[k]) + gy; }
        } }
      filtra(du1, lisciaC); filtra(du2, lisciaC); filtra(dv1, lisciaF); filtra(dv2, lisciaF);
      for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1, sotto = j < H - 1;
        for (let i = 0; i < W; i++) { const k = o + i, p = j * W + i, ie = i + 1 < W ? p + 1 : p + 1 - W;
          u1[k] += du1[k]; u2[k] = (u2[k] + du2[k]) / (1 + 0.5 * (freno[p] + freno[ie]));
          if (sotto) { v1[k] += dv1[k]; v2[k] = (v2[k] + dv2[k]) / (1 + 0.5 * (freno[p] + freno[p + W])); } } }
      proietta(); }
    // le tendenze vecchie scalano di un posto
    let t = Nu1[2]; Nu1[2] = Nu1[1]; Nu1[1] = Nu1[0]; Nu1[0] = t; t = Nv1[2]; Nv1[2] = Nv1[1]; Nv1[1] = Nv1[0]; Nv1[0] = t;
    t = Nu2[2]; Nu2[2] = Nu2[1]; Nu2[1] = Nu2[0]; Nu2[0] = t; t = Nv2[2]; Nv2[2] = Nv2[1]; Nv2[1] = Nv2[0]; Nv2[0] = t; t = Nt1[2]; Nt1[2] = Nt1[1]; Nt1[1] = Nt1[0]; Nt1[0] = t; t = Nt2[2]; Nt2[2] = Nt2[1]; Nt2[1] = Nt2[0]; Nt2[0] = t;
    passi++;
    if (accumula) { acc.n++; for (let j = 0; j < H; j++) { const o = (j + 1) * S + 1; for (let i = 0; i < W; i++) { const k = o + i, p = j * W + i; aU1[p] += u1[k]; aV1[p] += v1[k]; aU2[p] += u2[k]; aV2[p] += v2[k]; } } }
  };
  const sano = () => { for (let j = 1; j <= H; j++) for (let i = 1; i <= W; i++) { const k = j * S + i; if (!(Math.abs(u1[k]) < 400 && Math.abs(v1[k]) < 400 && Math.abs(u2[k]) < 400 && th1[k] > 0 && th2[k] > 0)) return false; } return true; };
  const vaporeMedio = () => { let s = 0, t = 0; for (let j = 0; j < H; j++) { let r = 0; for (let i = 0; i < W; i++) r += wv[(j + 1) * S + 1 + i]; s += r * cc[j]; t += W * cc[j]; } return s / t; };
  return { S, u1, v1, u2, v2, th1, th2, wv, suolo, acc, passo, sano, vaporeMedio };
}

// ---------- LA TERMODINAMICA DELL'ARIA: dai gas, dalla pressione e dalla gravità
const esAcqua = (T, p) => Math.min(pressioneVapore(T), PARAMETRI.vaporeMassimo * p); // il vapore resta un ospite dell'aria che lo porta (oltre, il modello non vale)
const pendenza = (T) => (Math.log(pressioneVapore(T + 0.5)) - Math.log(pressioneVapore(T - 0.5))); // d ln e_s / dT (Clausius-Clapeyron, dalle tabelle di chimica.js)
export function aria({ pressione, massaMolare = 0.029, gravita, cp = null, Tmedia, Tmin = Tmedia, Tmax = Tmedia, acqua = true }) {
  const R = R_GAS / massaMolare, cpA = cp ?? 3.5 * R, kappa = R / cpA, eps = MOLARE_ACQUA / massaMolare, Rv = R_GAS / MOLARE_ACQUA;
  // l'adiabatica (satura se c'è acqua) da T0 alla superficie fino alla pressione fp·p: la temperatura lassù
  const adiabatica = (T0, fp, umida) => { const n = 24, dl = Math.log(fp) / n; let T = T0, lp = 0;
    const der = (T, lp) => { if (!umida) return kappa * T; const p = pressione * Math.exp(lp), e = esAcqua(T, p), r = (eps * e) / (p - e), L = Rv * T * T * pendenza(T); return (R * T + L * r) / (cpA + (L * L * r * eps) / (R * T * T)); };
    for (let i = 0; i < n; i++) { const m = T + 0.5 * dl * der(T, lp); T += dl * der(m, lp + 0.5 * dl); lp += dl; } return T; };
  // L'EQUILIBRIO sopra una superficie a temperatura T: le temperature potenziali dei due strati (a 3/4 e a 1/4 della
  // pressione) lungo l'adiabatica che parte da lì; un'aria secca resta comunque stabile del minimo misurato
  const w1 = Math.pow(0.25, kappa), w2 = Math.pow(0.75, kappa), es = 1 - PARAMETRI.stabilitaSecca, minimo = Math.pow(0.25, -kappa * es) - Math.pow(0.75, -kappa * es);
  const t0 = Math.floor(Tmin) - 1, nT = Math.ceil(Tmax) + 2 - t0, tab1 = new Float64Array(nT), tab2 = new Float64Array(nT);
  for (let i = 0; i < nT; i++) { const T = t0 + i; tab2[i] = adiabatica(T, 0.75, acqua) / w2; tab1[i] = Math.max(adiabatica(T, 0.25, acqua) / w1, tab2[i] + minimo * T); }
  const equilibrio = (T) => { const x = Math.max(0, Math.min(nT - 1.001, T - t0)), i = Math.floor(x), f = x - i; return [tab1[i] * (1 - f) + tab1[i + 1] * f, tab2[i] * (1 - f) + tab2[i + 1] * f]; };
  // il gradiente termico verticale (K/m): quello dell'adiabatica dalla temperatura media, tra la superficie e metà pressione
  const Tm = adiabatica(Tmedia, 0.5, acqua), gamma = Math.min((Tmedia - Tm) / (((R * 0.5 * (Tmedia + Tm)) / gravita) * Math.LN2), (PARAMETRI.stabilitaSecca * gravita) / cpA);
  const hs = (R * Tmedia) / gravita, b = R * Math.log(3) * Math.pow(0.5, kappa), capStrato = (cpA * 0.5 * pressione) / gravita;
  return { R, cp: cpA, kappa, Rv, gamma, hs, b, capStrato, w1, w2, tauRad: (capStrato * (w1 + w2)) / (4 * SIGMA * Tmedia ** 3), L: Rv * Tmedia * Tmedia * pendenza(Tmedia), equilibrio };
}

// la quota e la parte bagnata di ogni cella del clima, da una carta delle quote uguale o più fine (multipla intera)
function riduci(alt, mare, W, H, lago = null) {
  const quota = new Float64Array(W * H), bagnato = new Float64Array(W * H);
  if (!alt) return { quota, bagnato, zero: 0 };
  const kx = Math.round(Math.sqrt(alt.length / (W * H))), Wf = W * kx; if (kx < 1 || Wf * H * kx !== alt.length) throw new Error('meteo: la carta delle quote deve avere la griglia del clima o una sua multipla intera');
  let zero = mare; if (!isFinite(mare)) { let s = 0, n = 0; for (let j = 0; j < H * kx; j++) { const w = Math.sin(((j + 0.5) / (H * kx)) * Math.PI); for (let i = 0; i < Wf; i++) { s += alt[j * Wf + i] * w; n += w; } } zero = s / n; }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let h = 0, m = 0; for (let y = 0; y < kx; y++) for (let x = 0; x < kx; x++) { const q = (j * kx + y) * Wf + i * kx + x, z = alt[q]; if (z < mare || (lago && lago[q] > 0)) m++; h += Math.max(z, zero) - zero; } quota[j * W + i] = h / (kx * kx); bagnato[j * W + i] = m / (kx * kx); }
  return { quota, bagnato, zero };
}

export function circolazione({ W = 64, H = 32, T, alt = null, mare = -Infinity, lago = null, raggioM, gravita, giorno, bloccato = false, obliquita = 0, pressione, massaMolare = 0.029, cp = null, acqua = true, freddo = null, passi = 1800 } = {}) {
  if (!T || T.length !== W * H) throw new Error('meteo: serve la temperatura T su una griglia W×H');
  if (W & (W - 1) || W < 8 || H < 8 || H % 2) throw new Error('meteo: W deve essere una potenza di 2 (almeno 8) e H pari');
  if (!(raggioM > 0 && gravita > 0 && giorno > 0)) throw new Error('meteo: servono raggioM, gravita e giorno');
  const NP = W * H, df = Math.PI / H, dl = (2 * Math.PI) / W, a = raggioM, peso = (j) => Math.sin((j + 0.5) * df), campo = () => new Float32Array(NP);
  const ris = { W, H, regime: 'senza aria', u: campo(), v: campo(), uAlto: campo(), vAlto: campo(), pioggia: campo(), neve: campo(), evaporazione: campo(), nuvole: campo(), umidita: campo(), vapore: campo(), suolo: campo(), deflusso: campo(),
    trasportoCalore: campo(), salita: campo(), temperaturaAria: Float32Array.from(T), temperaturaQuota: Float32Array.from(T), temperatura: T, celle: 0, celleNord: 0, celleSud: 0, fasce: 0, fasceNord: 0, fasceSud: 0, latitudineAlisei: null, giornoNotte: null,
    diffusivita: 0, scambio: 0, nuvoleMedie: 0, bilancio: { evaporata: 0, piovuta: 0, accumulata: 0 }, psi: new Float64Array(H - 1), ventoZonale: new Float64Array(H), ventoZonaleAlto: new Float64Array(H), aria: null, dt: 0, giorniSimulati: 0, tentativi: 0 };
  let Tm = 0, area = 0, tMin = Infinity, tMax = -Infinity; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const t = T[j * W + i]; Tm += t * peso(j); area += peso(j); tMin = Math.min(tMin, t); tMax = Math.max(tMax, t); } Tm /= area;
  const { quota, bagnato, zero } = riduci(alt, mare, W, H, lago);
  if (typeof acqua === 'number') bagnato.fill(Math.max(0, Math.min(1, acqua))); else if (acqua && typeof acqua === 'object') bagnato.set(acqua); else if (!acqua) bagnato.fill(0); else if (!alt) bagnato.fill(1);
  Object.assign(ris, { quota: Float32Array.from(quota), bagnato: Float32Array.from(bagnato), livelloZero: zero });
  if (!isFinite(pressione)) return Object.assign(ris, { regime: 'senza superficie' }); // un gigante gassoso: non è il mestiere di questo modello
  if (!(pressione > 0)) return ris;
  let bagnatoMedio = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) bagnatoMedio += bagnato[j * W + i] * peso(j); bagnatoMedio /= area;
  const ar = aria({ pressione, massaMolare, gravita, cp, Tmedia: Tm, Tmin: tMin, Tmax: tMax, acqua: bagnatoMedio > 0 }); ris.aria = ar;
  // sotto questa pressione le molecole non si urtano più entro uno spessore d'atmosfera: non è un fluido, non c'è vento
  const camminoLibero = (COSTANTI.kB * Tm) / (Math.SQRT2 * Math.PI * DIAMETRO_MOLECOLA ** 2 * pressione);
  if (camminoLibero > ar.hs) return ris;
  const omega = (2 * Math.PI) / giorno;
  // le forzanti: le temperature a cui la superficie tiene l'aria, il vapore che l'aria può portare, quanto in fretta evapora
  const t1Eq = new Float64Array(NP), t2Eq = new Float64Array(NP), wSat = new Float64Array(NP), kE = new Float64Array(NP), cd = new Float64Array(NP), Tloc = new Float64Array(NP);
  let sMax = 0;
  for (let k = 0; k < NP; k++) { const [e1, e2] = ar.equilibrio(T[k]); t1Eq[k] = e1; t2Eq[k] = e2; sMax = Math.max(sMax, e1 - e2);
    const t = Math.max(30, T[k] - ar.gamma * quota[k]); Tloc[k] = t; const pLoc = pressione * Math.exp(-quota[k] / ar.hs), e = esAcqua(t, pLoc), hq = Math.min(ar.hs, 1 / (ar.gamma * pendenza(t)));
    wSat[k] = bagnatoMedio > 0 ? (e / (ar.Rv * t)) * hq : 0; kE[k] = (PARAMETRI.ce * e) / (ar.Rv * t); cd[k] = bagnato[k] * PARAMETRI.cdMare + (1 - bagnato[k]) * PARAMETRI.cdTerra; }
  const cCrit = Math.cos((PARAMETRI.latCritica * Math.PI) / 180), dxCrit = a * dl * cCrit, dy = a * df, cStima = Math.sqrt(0.25 * ar.b * sMax);
  const medie = (x) => { const m = new Float64Array(H); for (let j = 0; j < H; j++) { let s = 0; for (let i = 0; i < W; i++) s += x[j * W + i]; m[j] = s / W; } return m; };
  const parametri = (dt) => ({ a, omega, b: ar.b, dt, tauRad: ar.tauRad, hs: ar.hs, nu: PARAMETRI.viscosita * cStima * a * dl, L: ar.L, capStrato: ar.capStrato, w1: ar.w1, w2: ar.w2 });
  // (a) IL PIANETA «MEDIO LUNGO I PARALLELI»: una colonna per latitudine, che costa poco e va a regime. Dà lo stato
  // di partenza, e dice quanto sono veloci i venti e le onde, cioè quanto può essere lungo il passo di tempo
  const f1 = { t1Eq: medie(t1Eq), t2Eq: medie(t2Eq), wSat: medie(wSat), kE: medie(kE), bagnato: medie(bagnato), cd: medie(cd) };
  let m1, dt1 = Math.min((0.5 * dy) / (cStima + 20), PARAMETRI.coriolis / (2 * omega)), tentativi = 0;
  for (;;) { m1 = motore(1, H, parametri(dt1), f1); for (let j = 0; j < H; j++) { const o = (j + 1) * 3 + 1; m1.th1[o] = f1.t1Eq[j]; m1.th2[o] = f1.t2Eq[j]; m1.wv[o] = 0.7 * PARAMETRI.umiditaPioggia * f1.wSat[j]; }
    let bene = true; for (let n = 0; n < 2 * passi && bene; n++) { m1.passo(false); if (n % 64 === 63) bene = m1.sano(); }
    if (bene) break; if (++tentativi > 6) throw new Error('meteo: il calcolo non si stabilizza'); dt1 *= 0.7; }
  let cOnde = 0, uMax = 0; for (let j = 0; j < H; j++) { const o = (j + 1) * 3 + 1, stretto = peso(j) < cCrit ? 2 : 1; cOnde = Math.max(cOnde, Math.sqrt(0.25 * ar.b * Math.max(0, m1.th1[o] - m1.th2[o]))); uMax = Math.max(uMax, stretto * Math.abs(m1.u1[o]), stretto * Math.abs(m1.u2[o]), Math.abs(m1.v1[o]) * (dxCrit / dy)); }
  let dt = Math.min((PARAMETRI.courant * dxCrit) / (cOnde + 1.3 * uMax + 10), PARAMETRI.coriolis / (2 * omega));
  // (b) IL PIANETA INTERO, a partire da lì: le differenze lungo i paralleli vengono dai mari, dalle terre, dai rilievi
  // (e, se il pianeta è perfettamente liscio, da un'increspatura fissa). Le medie si prendono sull'ultimo 60% dei passi
  let m2, vaporePrima = 0; const inizio = Math.floor(passi * 0.4);
  for (;;) { m2 = motore(W, H, parametri(dt), { t1Eq, t2Eq, wSat, kE, bagnato, cd });
    for (let j = 0; j < H; j++) { const o1 = (j + 1) * 3 + 1, rh = f1.wSat[j] > 0 ? m1.wv[o1] / f1.wSat[j] : 0; for (let i = 0; i < W; i++) { const k = (j + 1) * m2.S + 1 + i, p = j * W + i; m2.u1[k] = m1.u1[o1]; m2.v1[k] = m1.v1[o1]; m2.u2[k] = m1.u2[o1]; m2.v2[k] = m1.v2[o1]; m2.th1[k] = m1.th1[o1] + (t1Eq[p] - f1.t1Eq[j]);
      m2.th2[k] = m1.th2[o1] + (t2Eq[p] - f1.t2Eq[j]) + PARAMETRI.increspatura * peso(j) * (Math.sin(3 * i * dl) + Math.sin(5 * i * dl + 1) + Math.sin(8 * i * dl + 2)); m2.wv[k] = rh * wSat[p]; } }
    let bene = true; for (let n = 0; n < passi && bene; n++) { if (n === inizio) vaporePrima = m2.vaporeMedio(); m2.passo(n >= inizio); if (n % 64 === 63) bene = m2.sano(); }
    if (bene && m2.sano()) break;
    if (++tentativi > 6) throw new Error('meteo: il calcolo non si stabilizza');
    dt *= 0.7; }
  // i risultati: le medie sul periodo finale
  const acc = m2.acc, n = acc.n, sec = n * dt;
  let ev = 0, pv = 0, nu = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const p = j * W + i, iw = j * W + ((i + W - 1) % W);
    ris.u[p] = (0.5 * (acc.u2[p] + acc.u2[iw])) / n; ris.v[p] = (0.5 * (acc.v2[p] + (j > 0 ? acc.v2[p - W] : 0))) / n;
    ris.uAlto[p] = (0.5 * (acc.u1[p] + acc.u1[iw])) / n; ris.vAlto[p] = (0.5 * (acc.v1[p] + (j > 0 ? acc.v1[p - W] : 0))) / n;
    ris.pioggia[p] = (acc.piove[p] / n) * ANNO; ris.evaporazione[p] = (acc.evapora[p] / n) * ANNO; ris.deflusso[p] = (acc.scorre[p] / n) * ANNO; ris.nuvole[p] = acc.nuvole[p] / n; ris.umidita[p] = acc.umidita[p] / n; ris.vapore[p] = acc.vapore[p] / n; ris.suolo[p] = bagnato[p] < 1 ? m2.suolo[p] : 0;
    ris.neve[p] = ris.pioggia[p] * frazioneNeve(Tloc[p], freddo ? freddo[p] : 0);
    ris.trasportoCalore[p] = (ar.capStrato * acc.calore[p]) / n / dt; ris.salita[p] = acc.sale[p] / n;
    ris.temperaturaAria[p] = T[p] + (acc.th2[p] / n - t2Eq[p]) * ar.w2; ris.temperaturaQuota[p] = (acc.th1[p] / n) * ar.w1;
    ev += ris.evaporazione[p] * peso(j); pv += ris.pioggia[p] * peso(j); nu += ris.nuvole[p] * peso(j); }
  // la prova di conservazione: in tutto il periodo, l'acqua evaporata meno quella piovuta è quella rimasta in più nell'aria
  ris.bilancio = { evaporata: ev / area, piovuta: pv / area, accumulata: ((m2.vaporeMedio() - vaporePrima) / sec) * ANNO }; ris.nuvoleMedie = nu / area;
  // la corrente media in quota attraverso ogni parallelo (kg/s, positiva verso nord) e i venti medi lungo i paralleli
  const psi = ris.psi, uZona = ris.ventoZonale, uAltoZona = ris.ventoZonaleAlto; let psiMax = 0;
  for (let j = 0; j < H - 1; j++) { let s = 0; for (let i = 0; i < W; i++) s += acc.v1[j * W + i]; psi[j] = ((s / n / W) * Math.sin((j + 1) * df) * 2 * Math.PI * a * (0.5 * pressione)) / gravita; psiMax = Math.max(psiMax, Math.abs(psi[j])); }
  for (let j = 0; j < H; j++) { let s = 0, q = 0; for (let i = 0; i < W; i++) { s += ris.u[j * W + i]; q += ris.uAlto[j * W + i]; } uZona[j] = s / W; uAltoZona[j] = q / W; }
  // LE CELLE: i centri di rovesciamento distinti tra l'equatore e il polo. Lungo il meridiano la corrente ψ ha massimi
  // (i centri delle celle); due massimi contano per due se tra loro ψ cambia verso o scende sotto la metà del minore;
  // i massimi sotto il 5% del più grande del pianeta non si contano
  const contaCelle = (da, fino, passo) => { let c = 0, picco = 0, valle = 0, segno = 0; const chiudi = () => { if (picco > 0.05 * psiMax) c++; };
    for (let j = da; j !== fino; j += passo) { const sg = Math.sign(psi[j]), x = Math.abs(psi[j]);
      if (sg !== segno) { chiudi(); segno = sg; picco = valle = x; } else if (x < valle) valle = x; else if (valle < 0.5 * Math.min(picco, x)) { chiudi(); picco = valle = x; } else if (x > picco) picco = valle = x; }
    chiudi(); return c; };
  ris.celleNord = contaCelle(H / 2 - 1, -1, -1); ris.celleSud = contaCelle(H / 2 - 1, H - 1, 1); ris.celle = Math.round((ris.celleNord + ris.celleSud) / 2);
  // LE FASCE DI VENTO al suolo: quante volte il vento medio lungo i paralleli cambia verso (alisei da est, venti da ovest,
  // venti polari da est…), pesato con la distanza dall'asse (è il momento che conta); le fasce sotto il 10% non si contano
  let mMax = 0; for (let j = 0; j < H; j++) mMax = Math.max(mMax, Math.abs(uZona[j]) * peso(j));
  const contaFasce = (da, fino, passo) => { const corse = []; for (let j = da; j !== fino; j += passo) { const m = uZona[j] * peso(j), sg = Math.sign(m), ult = corse[corse.length - 1]; if (ult && ult.sg === sg) ult.picco = Math.max(ult.picco, Math.abs(m)); else corse.push({ sg, picco: Math.abs(m) }); }
    let c = 0, prec = 0; for (const r of corse) if (r.picco > 0.1 * mMax && r.sg !== prec) { c++; prec = r.sg; } return c; };
  ris.fasceNord = contaFasce(H / 2 - 1, -1, -1); ris.fasceSud = contaFasce(H / 2, H, 1); ris.fasce = Math.round((ris.fasceNord + ris.fasceSud) / 2);
  // fin dove arrivano gli alisei: la latitudine a cui il vento al suolo, da est vicino all'equatore, gira da ovest
  const giro = (da, fino, passo) => { for (let j = da; j !== fino - passo; j += passo) if (uZona[j] < 0 && uZona[j + passo] >= 0) { const f = uZona[j] / (uZona[j] - uZona[j + passo]); return Math.abs(90 - ((j + 0.5 + f * passo) * 180) / H); } return null; };
  { const gn = giro(H / 2 - 1, -1, -1), gs = giro(H / 2, H, 1); ris.latitudineAlisei = gn !== null && gs !== null ? 0.5 * (gn + gs) : gn ?? gs; }
  // il flusso dal lato giorno al lato notte (pianeta bloccato: il sole sta fisso sopra longitudine 0, latitudine 0): la
  // componente media del vento che si allontana da quel punto, in quota e al suolo (m/s)
  if (bloccato) { let sa = 0, sb = 0, sw = 0; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const lat = Math.PI / 2 - (j + 0.5) * df, lon = (i + 0.5) * dl - Math.PI, est = Math.sin(lon), nord = Math.sin(lat) * Math.cos(lon), nrm = Math.hypot(est, nord); if (nrm < 0.2) continue; const p = j * W + i, w = peso(j);
      sa += (w * (ris.uAlto[p] * est + ris.vAlto[p] * nord)) / nrm; sb += (w * (ris.u[p] * est + ris.v[p] * nord)) / nrm; sw += w; } ris.giornoNotte = { alto: sa / sw, basso: sb / sw }; }
  // quanto vale, come coefficiente di diffusione di un modello a bilancio di energia (W/m² per K, laplaciano sulla sfera
  // unitaria), il calore che questa circolazione ha davvero portato: il miglior accordo sulle medie lungo i paralleli
  { const zT = medie(T), zF = medie(ris.trasportoCalore); let sFL = 0, sLL = 0; for (let j = 0; j < H; j++) { const cn = j > 0 ? Math.sin(j * df) : 0, cs = j < H - 1 ? Math.sin((j + 1) * df) : 0, lap = (cn * ((j > 0 ? zT[j - 1] : zT[j]) - zT[j]) - cs * (zT[j] - (j < H - 1 ? zT[j + 1] : zT[j]))) / (peso(j) * df * df); sFL += peso(j) * zF[j] * lap; sLL += peso(j) * lap * lap; }
    ris.diffusivita = sLL > 0 ? sFL / sLL : 0; }
  ris.scambio = ar.capStrato * ar.w2 * (1 / ar.tauRad + (2 * PARAMETRI.ce * 5) / ar.hs); // (W/m² per K) quanto forte la superficie è legata all'aria bassa, con 5 m/s di vento
  return Object.assign(ris, { regime: 'aria', dt, giorniSimulati: (passi * dt) / 86400, tentativi });
}

// quanta della precipitazione cade come neve: tutta sotto zero, niente sopra +2 °C (misurato: a +1 °C metà e metà); e
// almeno la parte dell'anno che quel punto passa sotto zero, se il clima la dà
const frazioneNeve = (T, freddo = 0) => Math.max(0, Math.min(1, Math.max((275.15 - T) / 2, freddo)));

// ---------- DI COMODO: dal pianeta, dalla superficie e dal clima come li danno cosmo.js e geologia.js
// i gas: la massa molare media e il calore specifico (per mole: 5/2 R un atomo solo, 7/2 R due atomi, 4 R tre o più: le
// rotazioni, senza le vibrazioni)
export function gasDellAria(gas = {}) {
  let n = 0, massa = 0, cpMol = 0; for (const f in gas) { const m = MOLECOLE[f]; if (!m || !(gas[f] > 0)) continue; const atomi = Object.values(m.atomi).reduce((x, y) => x + y, 0); n += gas[f]; massa += gas[f] * m.massa * 1e-3; cpMol += gas[f] * (atomi === 1 ? 2.5 : atomi === 2 ? 3.5 : 4) * R_GAS; }
  return n > 0 ? { massaMolare: massa / n, cp: cpMol / massa } : { massaMolare: 0.029, cp: null };
}
const memoMeteo = new Map();
export function meteoPianeta(P, sf, cl, { passi = 1800, chiave = null } = {}) {
  if (chiave && memoMeteo.has(chiave)) return memoMeteo.get(chiave);
  if (!(P.giorno > 0)) throw new Error('meteo: al pianeta manca la durata del giorno (P.giorno, in secondi)');
  let gas = P.atmosfera?.gas; if (!gas) { try { gas = atmosfera(P).gas; } catch { gas = {}; } }
  const { massaMolare, cp } = gasDellAria(gas), neve = cl.neve ?? 1;
  const out = circolazione({ W: cl.W, H: cl.H, T: cl.media, alt: sf.alt, mare: sf.mare, lago: sf.lago ?? null, raggioM: P.raggioM, gravita: (COSTANTI.G * P.massaKg) / (P.raggioM * P.raggioM), giorno: P.giorno, bloccato: !!P.bloccato, obliquita: P.obliquita ?? 0,
    pressione: P.tipo === 'gassoso' ? Infinity : P.clima?.pressione ?? 0, massaMolare, cp, acqua: isFinite(sf.mare), freddo: cl.freddo && neve > 0 ? cl.freddo.map((x) => x / neve) : null, passi });
  if (chiave) { memoMeteo.set(chiave, out); if (memoMeteo.size > 6) memoMeteo.delete(memoMeteo.keys().next().value); }
  return out;
}

// un campo del meteo (griglia W×H) portato su una griglia più fine, interpolando tra i centri delle celle; «rett» è il
// pezzo di carta che la griglia fine copre (le tessere di geologia.js), tutta se manca
export function suGrigliaFine(m, x, Wf, Hf, rett = [0, 0, 1, 1]) {
  const { W, H } = m, out = new Float32Array(Wf * Hf), [u0, v0, u1, v1] = rett;
  for (let j = 0; j < Hf; j++) { const y = Math.min(H - 1, Math.max(0, (v0 + ((j + 0.5) / Hf) * (v1 - v0)) * H - 0.5)), y0 = Math.min(H - 2, Math.floor(y)), fy = y - y0;
    for (let i = 0; i < Wf; i++) { const xx = (u0 + ((i + 0.5) / Wf) * (u1 - u0)) * W - 0.5, xf = Math.floor(xx), fx = xx - xf, a0 = ((xf % W) + W) % W, a1 = (a0 + 1) % W;
      out[j * Wf + i] = (x[y0 * W + a0] * (1 - fx) + x[y0 * W + a1] * fx) * (1 - fy) + (x[(y0 + 1) * W + a0] * (1 - fx) + x[(y0 + 1) * W + a1] * fx) * fy; } }
  return out;
}
// la pioggia e la neve (mm/anno) sulla griglia della superficie (256×128, o una tessera): la pioggia interpolata, la
// neve decisa dalla quota vera di ogni punto (più in alto fa più freddo: il gradiente termico dell'aria del pianeta)
export function pioggiaFine(m, sf, cl = null) {
  const { W, H } = sf, pioggia = suGrigliaFine(m, m.pioggia, W, H, sf.rett), neve = new Float32Array(W * H);
  if (m.regime !== 'aria') return { W, H, pioggia, neve };
  const T = suGrigliaFine(m, m.temperatura, W, H, sf.rett), q = suGrigliaFine(m, m.quota, W, H, sf.rett), fr = cl?.freddo ? suGrigliaFine(m, cl.freddo, W, H, sf.rett) : null, nv = cl?.neve ?? 1;
  for (let k = 0; k < W * H; k++) { const h = Math.max(sf.alt[k], m.livelloZero) - m.livelloZero; neve[k] = pioggia[k] * frazioneNeve(T[k] - m.aria.gamma * h, fr && nv > 0 ? fr[k] / nv : 0); }
  return { W, H, pioggia, neve };
}
// la pioggia nelle unità dell'erosione di geologia.js: 1 = mille millimetri l'anno (all'incirca la media della Terra)
export function pioggiaPerErosione(m, sf) { const p = suGrigliaFine(m, m.pioggia, sf.W, sf.H, sf.rett); for (let k = 0; k < p.length; k++) p[k] /= 1000; return p; }
