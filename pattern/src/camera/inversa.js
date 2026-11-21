// inversa.js — la decodifica fisica: da un'immagine alle condizioni iniziali.
//
// Per ogni tratto letto dalla decodifica si cerca la particella che lo
// percorre davvero, con le leggi della camera:
//
//   · il tratto si divide in PEZZI a curvatura costante: ognuno è l'arco che
//     una carica descrive in un campo magnetico uniforme. Si parte dallo stato
//     della particella (dove è, verso dove va) e si allunga il pezzo finché
//     l'arco resta entro mezzo pixel dal disegno; il pezzo dopo parte dallo
//     stato in cui il primo finisce. La traccia è quindi continua e liscia
//     come quella di una particella vera.
//   · ogni pezzo diventa un CORRIDOIO di campo lungo l'arco (un settore di
//     anello, o un rettangolo se è dritto) con B = κ·m·v/q;
//   · lo SPESSORE diventa la carica (la pellicola ingrossa con |q|);
//   · alla fine del tratto la particella DECADE in neutri invisibili: la sua
//     vita è proprio il tempo che impiega a percorrerlo;
//   · un PETALO è una carica che frena nella materia: si allarga verso la
//     punta e si ferma lì (picco di Bragg); un DISCO è una carica pesante che
//     si ferma subito; una CAMPITURA è una SAGOMA: un corpo opaco appoggiato
//     sulla lastra, impresso da un lampo di luce all'istante zero (un
//     fotogramma, come una radiografia): esatta, piena, istantanea.
//
// I corridoi di due tratti che si incrociano non possono stare nello stesso
// mondo (il campo è uno solo per punto): si mettono in ESPOSIZIONI diverse
// della stessa lastra, come nelle camere a bolle vere.

import { simulaMondo } from '../../../src/camera/mondo.js';

let OPZ = {}; // le opzioni dell'ultima chiamata (per i campioni)
const V = 10; // la velocità di tutte le cariche dei tratti
const PELLICOLA = { w0: 1, saturazione: 4, vRif: V };

// ---------- geometria
function ricampiona(P, h) {
  const out = [P[0]];
  let resto = 0;
  for (let i = 1; i < P.length; i++) {
    const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 1e-9) continue;
    let s = h - resto;
    while (s <= L) { const u = s / L; out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]); s += h; }
    resto = L - (s - h);
  }
  const u = P[P.length - 1], z = out[out.length - 1];
  if (Math.hypot(u[0] - z[0], u[1] - z[1]) > h * 0.3) out.push(u);
  return out;
}
const angolo = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// l'arco da (p, θ) che passa per Q: curvatura, lunghezza, direzione d'arrivo
function arcoVerso(p, th, Q) {
  const dx = Q[0] - p[0], dy = Q[1] - p[1], c = Math.hypot(dx, dy);
  if (c < 1e-9) return { k: 0, L: 0, th };
  const fi = angolo(Math.atan2(dy, dx) - th);
  if (Math.abs(fi) > Math.PI * 0.95) return null;
  const k = (2 * Math.sin(fi)) / c, L = Math.abs(fi) < 1e-9 ? c : (fi * c) / Math.sin(fi);
  return { k, L, th: th + 2 * fi };
}
// quanto i punti Q[i0..i1] stanno lontani dall'arco
function scarto(p, th, k, Q, i0, i1) {
  let m = 0;
  if (Math.abs(k) < 1e-7) {
    const ux = Math.cos(th), uy = Math.sin(th);
    for (let i = i0; i <= i1; i++) m = Math.max(m, Math.abs((Q[i][0] - p[0]) * uy - (Q[i][1] - p[1]) * ux));
  } else {
    const R = 1 / k, cx = p[0] - Math.sin(th) * R, cy = p[1] + Math.cos(th) * R, Ra = Math.abs(R);
    for (let i = i0; i <= i1; i++) m = Math.max(m, Math.abs(Math.hypot(Q[i][0] - cx, Q[i][1] - cy) - Ra));
  }
  return m;
}

// un tratto (punti [x, y, spessore], y verso il basso) diventa: partenza, direzione, pezzi { k, L }
export function adattaTratto(P, opzioni = {}) {
  const h = opzioni.passo ?? 0.75, eps = opzioni.tolleranza ?? 0.5;
  const Q = ricampiona(P, h);
  if (Q.length < 3) return null;
  const n0 = Math.min(Q.length - 1, 3);
  let p = [Q[0][0], Q[0][1]], th = Math.atan2(Q[n0][1] - Q[0][1], Q[n0][0] - Q[0][0]);
  const inizio = { pos: p.slice(), dir: th }, pezzi = [];
  let i = 0;
  while (i < Q.length - 1) {
    // il pezzo più lungo che resta entro la tolleranza (ricerca per raddoppio, poi binaria)
    const prova = (j) => { const a = arcoVerso(p, th, Q[j]); if (!a || Math.abs(a.k * a.L) > 1.6 * Math.PI) return null; return scarto(p, th, a.k, Q, i + 1, j) <= eps ? a : null; };
    let buono = i + 1, passo = 2;
    while (buono + passo <= Q.length - 1 && prova(buono + passo)) { buono += passo; passo *= 2; }
    let lo = buono, hi = Math.min(Q.length - 1, buono + passo);
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (prova(mid)) lo = mid; else hi = mid; }
    if (hi <= Q.length - 1 && hi > lo && prova(hi)) lo = hi;
    const a = arcoVerso(p, th, Q[lo]) || { k: 0, L: Math.hypot(Q[lo][0] - p[0], Q[lo][1] - p[1]), th };
    pezzi.push({ k: a.k, L: a.L, i0: i, i1: lo });
    p = [Q[lo][0], Q[lo][1]]; th = a.th; i = lo;
  }
  const larghezze = Q.map((q) => q[2]).sort((a, b) => a - b);
  return { Q, inizio, pezzi, fine: { pos: p, dir: th }, larghezza: larghezze[Math.floor(larghezze.length / 2)], lunghezza: pezzi.reduce((s, z) => s + z.L, 0) };
}

// ---------- dai pezzi ai corridoi di campo
// lo spazio libero intorno a ogni pezzo: la distanza dalle altre parti della
// stessa linea (lontane lungo il percorso). Il corridoio non deve toccarle,
// altrimenti la particella cambierebbe campo nel posto sbagliato.
function spazioLibero(fit, mezza) {
  const Q = fit.Q, s = [0];
  for (let i = 1; i < Q.length; i++) s.push(s[i - 1] + Math.hypot(Q[i][0] - Q[i - 1][0], Q[i][1] - Q[i - 1][1]));
  return fit.pezzi.map(({ i0, i1 }) => {
    let d = Infinity;
    const a = s[i0] - 3 * mezza, b = s[i1] + 3 * mezza;
    for (let i = i0; i <= i1; i++) for (let j = 0; j < Q.length; j++) {
      if (s[j] >= a && s[j] <= b) continue;
      const e = Math.hypot(Q[i][0] - Q[j][0], Q[i][1] - Q[j][1]); if (e < d) d = e;
    }
    return d;
  });
}
function corridoi(fit, q, m, mezzaLarghezza) {
  const out = [], liberi = spazioLibero(fit, mezzaLarghezza);
  let p = fit.inizio.pos.slice(), th = fit.inizio.dir;
  // ogni corridoio entra un poco nel successivo (che prevale): niente fessure;
  // il primo sborda anche all'indietro, per contenere la sorgente
  const extra = 0.6;
  fit.pezzi.forEach(({ k, L }, n) => {
    const B = (k * m * V) / q, R = Math.abs(k) > 1e-9 ? 1 / Math.abs(k) : Infinity;
    const hw = Math.max(0.9, Math.min(mezzaLarghezza, 0.45 * liberi[n], 0.75 * R));
    if (Math.abs(k) * L < 1e-3 || Math.abs(k) < 1e-5) {
      const ux = Math.cos(th), uy = Math.sin(th), nx = -uy * hw, ny = ux * hw, Le = L + extra, indietro = n === 0 ? extra : 0, sx = p[0] - ux * indietro, sy = p[1] - uy * indietro;
      out.push({ forma: { tipo: 'poligono', punti: [[sx + nx, sy + ny], [p[0] + ux * Le + nx, p[1] + uy * Le + ny], [p[0] + ux * Le - nx, p[1] + uy * Le - ny], [sx - nx, sy - ny]].map((v) => v.map(cifre)) }, B: 0, K: 0 });
      p = [p[0] + ux * L, p[1] + uy * L];
    } else {
      const s = Math.sign(k), cx = p[0] - Math.sin(th) * R * s, cy = p[1] + Math.cos(th) * R * s;
      const a0 = Math.atan2(p[1] - cy, p[0] - cx), sweep = Math.abs(k) * L, ext = extra / R;
      const dietro = n === 0 ? ext : 0, da = s > 0 ? a0 - dietro : a0 - sweep - ext;
      out.push({ forma: { tipo: 'anello', centro: [cifre(cx), cifre(cy)], r: [cifre(Math.max(0, R - hw)), cifre(R + hw)], da: cifre(da), ampiezza: cifre(Math.min(2 * Math.PI, sweep + ext + dietro)) }, B: cifre(B), K: 0 });
      const a1 = a0 + s * sweep;
      p = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
      th += k * L;
    }
  });
  return { domini: out, fine: { pos: p, dir: th } };
}
const arr = (x) => Math.round(x * 1000) / 1000;
const cifre = (x) => +x.toPrecision(7);
const quarto = (x) => Math.round(x * 4) / 4; // le cariche a quarti: poche specie
function riquadroForma(f) {
  if (f.tipo === 'poligono') { const xs = f.punti.map((q) => q[0]), ys = f.punti.map((q) => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
  const r = Array.isArray(f.r) ? f.r[1] : f.r; return [f.centro[0] - r, f.centro[1] - r, f.centro[0] + r, f.centro[1] + r];
}
const tocca = (a, b) => a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

// ---------- il campo liscio: la mappa più dolce che piega ogni particella sulla sua linea
// I campioni lungo il percorso: dove passa la particella, e il campo che serve lì (B = κ·m·v/q)
function campioniTratto(fit, q, m, passo = 0.5, tubo = [0], sigma = OPZ.sigma ?? 1.2) {
  // la curvatura lungo il percorso, a passi fini, ammorbidita (l'integrale, cioè l'angolo
  // di ogni svolta, resta lo stesso): una traiettoria vera ha la curvatura continua
  const ds = 0.25, kap = [];
  for (const { k, L } of fit.pezzi) for (let n = Math.max(1, Math.round(L / ds)), i = 0; i < n; i++) kap.push(k * (L / n) / ds);
  const R = Math.ceil((3 * sigma) / ds), g = []; let gs = 0;
  for (let i = -R; i <= R; i++) { const w = Math.exp(-0.5 * ((i * ds) / sigma) ** 2); g.push(w); gs += w; }
  const liscia = kap.map((_, i) => { let v = 0, w = 0; for (let j = -R; j <= R; j++) { const t = i + j; if (t < 0 || t >= kap.length) continue; v += kap[t] * g[j + R]; w += g[j + R]; } return v / w; });
  // si rifà la traccia con la curvatura ammorbidita
  const asse = []; let x = fit.inizio.pos[0], y = fit.inizio.pos[1], th = fit.inizio.dir;
  liscia.forEach((k, i) => {
    asse.push([x, y, th, k, i * ds]);
    const fi = k * ds, f = Math.abs(fi) > 1e-9 ? Math.sin(fi / 2) / (fi / 2) : 1;
    x += ds * f * Math.cos(th + fi / 2); y += ds * f * Math.sin(th + fi / 2); th += fi;
  });
  asse.push([x, y, th, liscia[liscia.length - 1] ?? 0, liscia.length * ds]);
  // lo spazio libero intorno, per il tubo
  const pts = asse.map((a) => a), libero = (i) => { let d = Infinity; const a = pts[i]; for (let j = 0; j < pts.length; j += 2) { if (Math.abs(pts[j][4] - a[4]) < 6) continue; d = Math.min(d, Math.hypot(pts[j][0] - a[0], pts[j][1] - a[1])); } return d; };
  const out = [], ogni = Math.max(1, Math.round(passo / ds));
  for (let i = 0; i < asse.length; i += ogni) {
    const [ax, ay, ath, k, s] = asse[i], b = (k * m * V) / q, nx = -Math.sin(ath), ny = Math.cos(ath);
    const lim = Math.min(0.7 / Math.max(Math.abs(k), 1e-9), 0.45 * libero(i));
    for (const d of tubo.filter((d) => Math.abs(d) <= lim + 1e-9)) out.push([ax + nx * d, ay + ny * d, b, s, d, Math.max(1.2, Math.min(1.6, lim))]);
  }
  return out;
}
// minimi quadrati con levigatezza: dati lungo i tratti, il campo altrove il più dolce
// possibile e che si spegne lontano (gradiente coniugato, senza matrici)
function mappaLiscia(campioni, opzioni = {}, partenza = null) {
  const h = opzioni.griglia ?? 1.5, lam = opzioni.levigatezza ?? 0.15, mu = opzioni.spegnimento ?? 2e-3, margine = 5 * h;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of campioni) { x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); x1 = Math.max(x1, c[0]); y1 = Math.max(y1, c[1]); }
  x0 = Math.floor((x0 - margine) / h) * h; y0 = Math.floor((y0 - margine) / h) * h;
  const nx = Math.ceil((x1 + margine - x0) / h) + 1, ny = Math.ceil((y1 + margine - y0) / h) + 1, N = nx * ny, S = campioni.length;
  const idx = new Int32Array(S * 4), pes = new Float64Array(S * 4), dati = new Float64Array(S);
  campioni.forEach((c, k) => {
    const fx = (c[0] - x0) / h, fy = (c[1] - y0) / h, i = Math.min(nx - 2, Math.floor(fx)), j = Math.min(ny - 2, Math.floor(fy)), u = fx - i, v = fy - j;
    idx.set([j * nx + i, j * nx + i + 1, (j + 1) * nx + i, (j + 1) * nx + i + 1], 4 * k);
    pes.set([(1 - u) * (1 - v), u * (1 - v), (1 - u) * v, u * v], 4 * k);
    dati[k] = c[2];
  });
  const A = (x, y) => {
    y.fill(0);
    for (let k = 0; k < S; k++) { let s = 0; for (let r = 0; r < 4; r++) s += pes[4 * k + r] * x[idx[4 * k + r]]; for (let r = 0; r < 4; r++) y[idx[4 * k + r]] += pes[4 * k + r] * s; }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const n = j * nx + i; let d = 0, sum = 0;
      if (i > 0) { d++; sum += x[n - 1]; } if (i < nx - 1) { d++; sum += x[n + 1]; } if (j > 0) { d++; sum += x[n - nx]; } if (j < ny - 1) { d++; sum += x[n + nx]; }
      y[n] += lam * (d * x[n] - sum) + mu * x[n];
    }
  };
  const b = new Float64Array(N);
  for (let k = 0; k < S; k++) for (let r = 0; r < 4; r++) b[idx[4 * k + r]] += pes[4 * k + r] * dati[k];
  const x = new Float64Array(N), Ax = new Float64Array(N);
  if (partenza && partenza.nx === nx && partenza.ny === ny && partenza.x0 === x0 && partenza.y0 === y0) x.set(partenza.B);
  A(x, Ax);
  const r = b.map((v, n) => v - Ax[n]), p = r.slice(), Ap = new Float64Array(N);
  let rr = r.reduce((a, v) => a + v * v, 0); const r0 = rr;
  for (let it = 0; it < (opzioni.iterazioni ?? 600) && rr > 1e-16 * r0; it++) {
    A(p, Ap); let pAp = 0; for (let n = 0; n < N; n++) pAp += p[n] * Ap[n];
    const a = rr / pAp; let rr2 = 0;
    for (let n = 0; n < N; n++) { x[n] += a * p[n]; r[n] -= a * Ap[n]; rr2 += r[n] * r[n]; }
    const be = rr2 / rr; rr = rr2;
    for (let n = 0; n < N; n++) p[n] = r[n] + be * p[n];
  }
  return { x0, y0, h, nx, ny, B: Array.from(x, (v) => +v.toPrecision(5)) };
}

// il campo per costruzione: ogni nodo vicino a una traccia prende il campo del punto di
// traccia più vicino (uniforme di traverso: stabile), e sfuma con continuità a zero
// fuori dal tubo. Un campo continuo, senza spigoli: un fascio di flusso.
function mappaTubi(campioni, opzioni = {}) {
  const h = opzioni.griglia ?? 0.75, sfuma = opzioni.sfumatura ?? 2, margine = 3 + sfuma;
  const asse = campioni.filter((c) => !c[4]);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of asse) { x0 = Math.min(x0, c[0]); y0 = Math.min(y0, c[1]); x1 = Math.max(x1, c[0]); y1 = Math.max(y1, c[1]); }
  x0 = Math.floor((x0 - margine) / h) * h; y0 = Math.floor((y0 - margine) / h) * h;
  const nx = Math.ceil((x1 + margine - x0) / h) + 1, ny = Math.ceil((y1 + margine - y0) / h) + 1, B = new Float64Array(nx * ny), Kq = new Float64Array(nx * ny), dist = new Float64Array(nx * ny).fill(Infinity);
  for (const c of asse) {
    const r0 = c[5] ?? 1.5, r1 = r0 + sfuma, i0 = Math.max(0, Math.floor((c[0] - r1 - x0) / h)), i1 = Math.min(nx - 1, Math.ceil((c[0] + r1 - x0) / h)), j0 = Math.max(0, Math.floor((c[1] - r1 - y0) / h)), j1 = Math.min(ny - 1, Math.ceil((c[1] + r1 - y0) / h));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const n = j * nx + i, d = Math.hypot(x0 + i * h - c[0], y0 + j * h - c[1]);
      if (d >= dist[n]) continue;
      dist[n] = d;
      const w = d <= r0 ? 1 : d >= r1 ? 0 : 0.5 + 0.5 * Math.cos((Math.PI * (d - r0)) / sfuma);
      B[n] = c[2] * w; Kq[n] = (c[6] ?? 0) * w;
    }
  }
  const comprimi = (A) => { const out = []; let ultimo = -1; for (let n = 0; n < A.length; n++) if (A[n]) { out.push(n - ultimo, +A[n].toPrecision(4)); ultimo = n; } return out; };
  const sparsaK = comprimi(Kq);
  return { x0: +x0.toFixed(3), y0: +y0.toFixed(3), h, nx, ny, sparsa: comprimi(B), ...(sparsaK.length ? { sparsaK } : {}) };
}

// i ginocchi: dove il tratto piega di colpo, la particella decade e la figlia riparte nella
// nuova direzione (come un pione che diventa muone). Il tratto si spezza in segmenti lisci;
// l'arco brevissimo dello spigolo diventa un angolo vivo, nel punto dove si incontrano le tangenti.
function spezzaAiGinocchi(fit, opzioni = {}) {
  const angoloMin = opzioni.ginocchio ?? 0.35, lungMax = opzioni.ginocchioLungo ?? 2.5;
  const segmenti = []; let corrente = { inizio: { ...fit.inizio, pos: fit.inizio.pos.slice() }, pezzi: [], s0: 0 };
  let p = fit.inizio.pos.slice(), th = fit.inizio.dir, sTot = 0;
  for (const z of fit.pezzi) {
    const fi = z.k * z.L, f = Math.abs(fi) > 1e-9 ? Math.sin(fi / 2) / (fi / 2) : 1;
    const fine = [p[0] + z.L * f * Math.cos(th + fi / 2), p[1] + z.L * f * Math.sin(th + fi / 2)];
    if (Math.abs(fi) >= angoloMin && z.L <= lungMax && Math.abs(fi) < 2.6) {
      // la tangente lunga R·tan(φ/2): fin lì dritto, poi l'angolo, poi dritto fino alla fine dell'arco
      const t = Math.abs(Math.tan(fi / 2) / z.k), spigolo = [p[0] + t * Math.cos(th), p[1] + t * Math.sin(th)];
      corrente.pezzi.push({ k: 0, L: t });
      segmenti.push(corrente);
      corrente = { inizio: { pos: spigolo, dir: th + fi }, pezzi: [{ k: 0, L: t }], s0: sTot + z.L / 2 };
    } else corrente.pezzi.push(z);
    p = fine; th += fi; sTot += z.L;
  }
  segmenti.push(corrente);
  return segmenti.filter((g) => g.pezzi.reduce((a, z) => a + z.L, 0) > 0.5).map((g) => ({ ...g, lunghezza: g.pezzi.reduce((a, z) => a + z.L, 0), larghezza: fit.larghezza }));
}

// ---------- lo spessore: la particella frena nella materia
// La lastra ingrossa la traccia quando la particella rallenta: w = q·V/v (sotto la
// velocità di riferimento V). Per avere lo spessore w(s) lungo il percorso la
// velocità deve essere v(s) = q·V/w(s), e dunque w deve crescere: la particella va
// dall'estremo sottile a quello spesso. Bethe (dv/ds = −K·q²/(m·v³)) dice quanta
// materia serve: K(s) = m·q²·V⁴·w'/w⁵. Il campo che la piega, più lenta, è
// B(s) = κ·m·v(s)/q. Un tratto sottile ai capi e spesso in mezzo diventa due
// particelle che partono dalle punte e si incontrano nel punto più spesso.
function particelleSpesse(g, wDi, opzioni = {}) {
  const ds = 0.25, sigma = opzioni.sigma ?? 1.2, sat = PELLICOLA.saturazione;
  // la curvatura lungo il segmento, ammorbidita (l'angolo di ogni svolta si conserva)
  const kap = [];
  for (const { k, L } of g.pezzi) for (let n = Math.max(1, Math.round(L / ds)), i = 0; i < n; i++) kap.push(k * (L / n) / ds);
  const liscio = (arr, sg) => { const R = Math.ceil((3 * sg) / ds), gk = []; for (let i = -R; i <= R; i++) gk.push(Math.exp(-0.5 * ((i * ds) / sg) ** 2)); return arr.map((_, i) => { let v = 0, w = 0; for (let j = -R; j <= R; j++) { const t = i + j; if (t < 0 || t >= arr.length) continue; v += arr[t] * gk[j + R]; w += gk[j + R]; } return v / w; }); };
  const kl = liscio(kap, sigma);
  const asse = []; let x = g.inizio.pos[0], y = g.inizio.pos[1], th = g.inizio.dir;
  kl.forEach((k, i) => { asse.push([x, y, th, k, i * ds]); const fi = k * ds, f = Math.abs(fi) > 1e-9 ? Math.sin(fi / 2) / (fi / 2) : 1; x += ds * f * Math.cos(th + fi / 2); y += ds * f * Math.sin(th + fi / 2); th += fi; });
  asse.push([x, y, th, kl[kl.length - 1] ?? 0, kl.length * ds]);
  // lo spessore lungo il segmento, ammorbidito
  const w = liscio(asse.map((a) => Math.max(0.5, wDi(g.s0 + a[4]))), opzioni.sigmaSpessore ?? 2.5);
  // i tratti monotoni: tra un minimo e un massimo dello spessore (le piccole oscillazioni non contano)
  const tolleranza = opzioni.spessoreTolleranza ?? 0.12, giri = [0];
  let verso = 0, estremo = 0;
  for (let i = 1; i < w.length; i++) {
    if (verso >= 0 && w[i] > w[estremo]) estremo = i;
    if (verso <= 0 && w[i] < w[estremo]) estremo = i;
    const d = w[i] - w[estremo];
    if (verso >= 0 && d < -tolleranza * w[estremo]) { if (verso > 0) giri.push(estremo); verso = -1; estremo = i; }
    else if (verso <= 0 && d > tolleranza * w[estremo]) { if (verso < 0) giri.push(estremo); verso = 1; estremo = i; }
  }
  giri.push(w.length - 1);
  const libero = (i) => { let d = Infinity; const a = asse[i]; for (let j = 0; j < asse.length; j += 2) { if (Math.abs(asse[j][4] - a[4]) < 6) continue; d = Math.min(d, Math.hypot(asse[j][0] - a[0], asse[j][1] - a[1])); } return d; };
  const tubo = opzioni.tubo ?? [0, -0.8, 0.8, -1.6, 1.6], out = [];
  for (let r = 0; r + 1 < giri.length; r++) {
    let a = giri[r], b = giri[r + 1];
    if (b - a < 2) continue;
    const cresce = w[b] >= w[a];
    const idx = []; if (cresce) for (let i = a; i <= b; i++) idx.push(i); else for (let i = b; i >= a; i--) idx.push(i);
    // la carica: lo spessore all'estremo sottile (a quarti); lo spessore cresce fino a sat·q
    const q = quarto(Math.max(0.5, Math.min(w[idx[0]], w[idx[idx.length - 1]] / sat)));
    const ww = idx.map((i) => Math.min(sat * q, Math.max(q, w[i])));
    const v = ww.map((x) => (q * V) / x);
    let tempo = 0;
    const campioni = [];
    idx.forEach((i, n) => {
      const A = asse[i], k = cresce ? A[3] : -A[3], dirA = cresce ? A[2] : A[2] + Math.PI;
      // la materia che serve per rallentare così: K = m·q²·V⁴·w'/w⁵ (w' lungo il verso di marcia)
      const n2 = Math.min(idx.length - 1, n + 1), n1 = Math.max(0, n - 1), dw = (ww[n2] - ww[n1]) / (((n2 - n1) || 1) * ds);
      const K = Math.max(0, (q * q * V ** 4 * dw) / ww[n] ** 5), b = (k * v[n]) / q;
      if (n) tempo += ds / ((v[n] + v[n - 1]) / 2);
      if (n % 2 === 0) {
        const nx = -Math.sin(dirA), ny = Math.cos(dirA), lim = Math.min(0.7 / Math.max(Math.abs(k), 1e-9), 0.45 * libero(i));
        for (const d of tubo.filter((d) => Math.abs(d) <= lim + 1e-9)) campioni.push([A[0] + nx * d, A[1] + ny * d, b, n * ds, d, Math.max(1.2, Math.min(1.6, lim)), K]);
      }
    });
    const A0 = asse[idx[0]];
    out.push({ campioni, q, vita: tempo, lunghezza: idx.length * ds, inizio: { pos: [A0[0], A0[1]], dir: cresce ? A0[2] : A0[2] + Math.PI }, v0: v[0] });
  }
  return out;
}

// ---------- l'intera immagine
// ris: il risultato di decodifica() (coordinate del mondo con y verso l'alto)
export function tracciaFisica(ris, opzioni = {}) {
  opzioni = { distanza: 10, separa: false, griglia: 0.4, ginocchio: 0.2, ginocchioLungo: 4, tolleranza: 0.15, sigma: 0.6, ...opzioni };
  OPZ = opzioni;
  const W = ris.misure.larghezza, H = ris.misure.altezza, giu = (p) => [p[0], H - p[1], p[2] ?? 0];
  const oggetti = [], specie = {}, sagome = [];
  const nomeSpecie = (q, m, extra = '') => { const n = `${extra || 'tratto'} ${arr(q)}`; if (!specie[n]) specie[n] = { q: arr(q), m }; return n; };
  let pezzi = 0, ginocchi = 0;
  // i tratti
  for (const l of ris.linee || []) {
    const fit = adattaTratto(l.punti.map(giu), opzioni);
    if (!fit || fit.lunghezza < 1) continue;
    const q = Math.max(0.5, Math.round(fit.larghezza * 4) / 4), hw = Math.max(2, q * 0.6 + 1.5);
    const liscio = opzioni.campo !== 'corridoi';
    if (liscio) {
      // segmenti lisci tra un ginocchio e l'altro: ognuno una particella, nata dal decadimento della precedente
      // lo spessore lungo il tratto, dalla decodifica
      const Sq = [0]; for (let i = 1; i < fit.Q.length; i++) Sq.push(Sq[i - 1] + Math.hypot(fit.Q[i][0] - fit.Q[i - 1][0], fit.Q[i][1] - fit.Q[i - 1][1]));
      const wDi = (sx) => { let i = 0; while (i < Sq.length - 2 && Sq[i + 1] < sx) i++; const u = Math.max(0, Math.min(1, (sx - Sq[i]) / ((Sq[i + 1] - Sq[i]) || 1))); return fit.Q[i][2] + (fit.Q[Math.min(i + 1, fit.Q.length - 1)][2] - fit.Q[i][2]) * u; };
      spezzaAiGinocchi(fit, opzioni).forEach((g, n) => {
        if (opzioni.spessore === false) {
          const campioni = campioniTratto(g, q, 1, 0.5, opzioni.tubo ?? [0, -0.8, 0.8, -1.6, 1.6]);
          oggetti.push({ tipo: 'tratto', domini: [], campioni, pareti: [], ginocchio: n > 0, sorgenti: [{ pos: g.inizio.pos.map(cifre), dir: cifre(g.inizio.dir), v: V, vita: cifre(g.lunghezza / V), specie: nomeSpecie(q, 1) }], tempo: g.lunghezza / V + 1, pezzi: g.pezzi.length });
        } else for (const pt of particelleSpesse(g, wDi, opzioni)) {
          oggetti.push({ tipo: 'tratto', domini: [], campioni: pt.campioni, pareti: [], ginocchio: n > 0, sorgenti: [{ pos: pt.inizio.pos.map(cifre), dir: cifre(pt.inizio.dir), v: cifre(pt.v0), vita: cifre(pt.vita), specie: nomeSpecie(pt.q, 1) }], tempo: pt.vita + 1, pezzi: g.pezzi.length });
        }
        ginocchi += n > 0 ? 1 : 0;
      });
      pezzi += fit.pezzi.length;
      continue;
    }
    const domini = corridoi(fit, q, 1, hw).domini, campioni = null;
    // alla fine del tratto la particella decade: la sua vita è il tempo per percorrerlo
    oggetti.push({ tipo: 'tratto', domini, campioni, pareti: [], sorgenti: [{ pos: fit.inizio.pos.map(cifre), dir: cifre(fit.inizio.dir), v: V, vita: cifre(fit.lunghezza / V), specie: nomeSpecie(q, 1) }], tempo: fit.lunghezza / V + 1, pezzi: fit.pezzi.length });
    pezzi += fit.pezzi.length;
  }
  for (const e of ris.elementi) {
    if (e.tipo === 'petalo') {
      // una carica che frena nella materia: parte larga b, si ferma dopo L
      const base = giu(e.pos), dir = Math.atan2(-e.dir[1], e.dir[0]), q = quarto(Math.max(0.5, e.b)), L = Math.max(1, e.L - e.W / 2);
      const K = (V ** 4) / (4 * q * q * L), hw = e.W;
      const ux = Math.cos(dir), uy = Math.sin(dir), nx = -uy * hw, ny = ux * hw;
      const forma = { tipo: 'poligono', punti: [[base[0] + nx - ux, base[1] + ny - uy], [base[0] + ux * (L + 2) + nx, base[1] + uy * (L + 2) + ny], [base[0] + ux * (L + 2) - nx, base[1] + uy * (L + 2) - ny], [base[0] - nx - ux, base[1] - ny - uy]].map((v) => v.map(arr)) };
      oggetti.push({ tipo: 'petalo', domini: [{ forma, B: 0, K: arr(K) }], pareti: [], sorgenti: [{ pos: base.slice(0, 2).map(arr), dir: arr(dir), v: V, specie: nomeSpecie(q, 1, 'petalo') }], tempo: L / V * 3 + 1, pezzi: 1 });
    } else if (e.tipo === 'disco') {
      // una carica pesante che si ferma quasi subito: resta la macchia tonda
      const c = giu(e.pos), q = quarto(Math.max(0.5, e.d / PELLICOLA.saturazione)), v = 1, K = (v ** 4) / (4 * q * q * 0.2);
      oggetti.push({ tipo: 'disco', domini: [{ forma: { tipo: 'cerchio', centro: c.slice(0, 2).map(arr), r: arr(e.d) }, B: 0, K: arr(K) }], pareti: [], sorgenti: [{ pos: c.slice(0, 2).map(arr), dir: 0, v, specie: nomeSpecie(q, 1, 'goccia') }], tempo: 2, pezzi: 1 });
    } else if (e.tipo === 'campitura') {
      // una sagoma: un corpo appoggiato sulla lastra, impresso dal lampo all'istante zero
      sagome.push({ contorno: e.contorno.map((a) => giu(a).slice(0, 2).map(arr)), buchi: (e.buchi || []).map((h) => h.map((a) => giu(a).slice(0, 2).map(arr))) });
    }
  }
  // le esposizioni: due oggetti che si toccano vanno su lastre diverse
  for (const o of oggetti) {
    const sc = [];
    // un tratto col campo liscio occupa una striscia intorno ai suoi campioni
    if (o.campioni) for (let i = 0; i < o.campioni.length; i += 12) { const g = o.campioni.slice(i, i + 13), m = opzioni.distanza ?? 8; sc.push([Math.min(...g.map((c) => c[0])) - m, Math.min(...g.map((c) => c[1])) - m, Math.max(...g.map((c) => c[0])) + m, Math.max(...g.map((c) => c[1])) + m]); }
    o.scatole = [...sc, ...o.domini.map((d) => riquadroForma(d.forma)), ...o.pareti.map((p) => [Math.min(p.a[0], p.b[0]) - 0.5, Math.min(p.a[1], p.b[1]) - 0.5, Math.max(p.a[0], p.b[0]) + 0.5, Math.max(p.a[1], p.b[1]) + 0.5])];
    o.tutto = o.scatole.reduce((t, b) => [Math.min(t[0], b[0]), Math.min(t[1], b[1]), Math.max(t[2], b[2]), Math.max(t[3], b[3])], [Infinity, Infinity, -Infinity, -Infinity]);
  }
  const lastre = [];
  const conflitto = (a, b) => tocca(a.tutto, b.tutto) && a.scatole.some((x) => tocca(x, b.tutto) && b.scatole.some((y) => tocca(x, y)));
  oggetti.sort((a, b) => b.scatole.length - a.scatole.length);
  for (const o of oggetti) {
    let lastra = lastre.find((L) => !L.oggetti.some((u) => conflitto(o, u)));
    if (!lastra) { lastra = { oggetti: [] }; lastre.push(lastra); }
    lastra.oggetti.push(o);
  }
  const espone = (L) => {
    const campioni = L.oggetti.flatMap((o) => o.campioni || []);
    return {
      domini: L.oggetti.flatMap((o) => o.domini), pareti: L.oggetti.flatMap((o) => o.pareti), sorgenti: L.oggetti.flatMap((o) => o.sorgenti),
      tempo: Math.max(...L.oggetti.map((o) => o.tempo)),
      ...(campioni.length ? { mappa: opzioni.campo === 'minimi' ? mappaLiscia(campioni, { ...opzioni, ...(L.fine ? { griglia: opzioni.grigliaFine ?? 0.75 } : {}) }) : mappaTubi(campioni, opzioni) } : {}),
    };
  };
  let esposizioni = lastre.map(espone);
  // quanto ogni particella di una lastra si scosta dal suo tratto
  const scostamenti = (e) => {
    const L = lastre[e], out = new Map(); if (!esposizioni[e].mappa) return out;
    const tr = simulaMondo({ larghezza: W, altezza: H, c: 30, G: 1, tempo: esposizioni[e].tempo, specie, pellicola: { ...PELLICOLA }, sorgenti: esposizioni[e].sorgenti, domini: esposizioni[e].domini, mappa: esposizioni[e].mappa });
    for (const t of tr) {
      const o = L.oggetti[t.sorgente]; if (!o || !o.campioni) continue;
      const C = o.campioni.filter((c) => !c[4]), P = t.punti; let j = 0, peggio = 0;
      for (let k = 0; k < C.length; k += 2) {
        const tt = P[0][3] + C[k][3] / V; while (j < P.length - 2 && P[j + 1][3] < tt) j++;
        const a = P[j], b = P[j + 1] || a, u = b[3] > a[3] ? Math.min(1, Math.max(0, (tt - a[3]) / (b[3] - a[3]))) : 0;
        peggio = Math.max(peggio, Math.hypot(a[0] + (b[0] - a[0]) * u - C[k][0], a[1] + (b[1] - a[1]) * u - C[k][1]));
      }
      out.set(o, peggio);
    }
    return out;
  };
  // i tratti che non vengono seguiti vanno da soli, su una lastra loro con una mappa più fine
  if (opzioni.campo !== 'corridoi' && opzioni.separa !== false) {
    const soli = [];
    lastre.forEach((L, e) => { const sc = scostamenti(e); if (L.oggetti.length < 2) return; L.oggetti = L.oggetti.filter((o) => { if ((sc.get(o) ?? 0) > (opzioni.soglia ?? 1.5)) { soli.push(o); return false; } return true; }); });
    for (const o of soli) lastre.push({ oggetti: [o], fine: true });
    esposizioni = lastre.filter((L) => L.oggetti.length).map(espone);
    for (let i = lastre.length - 1; i >= 0; i--) if (!lastre[i].oggetti.length) lastre.splice(i, 1);
  }
  // la mira: si simula, si misura quanto ogni particella si scosta dal disegno,
  // si corregge il campo poco prima di dove si scosta, si rifà la mappa
  const giri = opzioni.campo === 'corridoi' ? 0 : opzioni.correzioni ?? 0, guadagno = opzioni.guadagno ?? 0.8, avanti = opzioni.anticipo ?? 6;
  const scarti = [];
  for (let giro = 0; giro <= giri; giro++) {
    let peggio = 0, somma = 0, n = 0;
    lastre.forEach((L, e) => {
      if (!esposizioni[e].mappa) return;
      const tr = simulaMondo({ larghezza: W, altezza: H, c: 30, G: 1, tempo: esposizioni[e].tempo, specie, pellicola: { ...PELLICOLA }, sorgenti: esposizioni[e].sorgenti, domini: esposizioni[e].domini, mappa: esposizioni[e].mappa });
      let cambiato = false;
      for (const t of tr) {
        const o = L.oggetti[t.sorgente]; if (!o || !o.campioni) continue;
        const C = o.campioni.filter((c) => !c[4]), P = t.punti, q = specie[o.sorgenti[0].specie].q, err = new Float64Array(C.length);
        let j = 0;
        for (let k = 0; k < C.length; k++) {
          const tt = P[0][3] + C[k][3] / V; while (j < P.length - 2 && P[j + 1][3] < tt) j++;
          const a = P[j], b = P[j + 1] || a, u = b[3] > a[3] ? Math.min(1, Math.max(0, (tt - a[3]) / (b[3] - a[3]))) : 0;
          const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u;
          const k2 = Math.min(C.length - 1, k + 1), k1 = Math.max(0, k - 1), tx = C[k2][0] - C[k1][0], ty = C[k2][1] - C[k1][1], tl = Math.hypot(tx, ty) || 1;
          err[k] = (tx * (y - C[k][1]) - ty * (x - C[k][0])) / tl; // a sinistra: positivo
          peggio = Math.max(peggio, Math.abs(err[k])); somma += Math.abs(err[k]); n++;
        }
        if (giro === giri) continue;
        // a sinistra del disegno: la curva verso sinistra era troppa poco prima
        const D = Math.round(avanti / 0.5);
        for (let k = 0; k < C.length; k++) { const e2 = err[Math.min(C.length - 1, k + D)]; if (Math.abs(e2) > 0.05) { C[k][2] -= (guadagno * e2 * V) / (q * avanti * avanti); cambiato = true; } }
      }
      if (cambiato && giro < giri) esposizioni[e].mappa = mappaTubi(L.oggetti.flatMap((o) => o.campioni || []), opzioni);
    });
    scarti.push({ giro, peggio: +peggio.toFixed(2), medio: +(somma / Math.max(1, n)).toFixed(3) });
  }
  // la lastra è materia densa: i corridoi sono canali vuoti. Una particella
  // che sfugge al suo canale si ferma subito, invece di tirare una riga
  const cella = { larghezza: W, altezza: H, c: 30, G: 1, bordo: 'aperto', tempo: Math.max(1, ...esposizioni.map((e) => e.tempo)), fondo: { B: 0, K: opzioni.campo === 'corridoi' ? 40000 : 0 }, domini: [], masse: [], pareti: [], sorgenti: [], pellicola: { ...PELLICOLA }, specie, esposizioni, sagome };
  const numeri = esposizioni.reduce((n, e) => n + e.domini.length * 6 + e.pareti.length * 4 + e.sorgenti.length * 4 + (e.mappa ? (e.mappa.sparsa ? e.mappa.sparsa.length / 2 : e.mappa.B.filter((v) => Math.abs(v) > 1e-4).length) : 0), 0) + sagome.reduce((n, g) => n + 2 * (g.contorno.length + g.buchi.reduce((m, h) => m + h.length, 0)), 0);
  const conta = { tratti: oggetti.filter((o) => o.tipo === 'tratto').length, petali: oggetti.filter((o) => o.tipo === 'petalo').length, dischi: oggetti.filter((o) => o.tipo === 'disco').length, campiture: sagome.length, pezzi, ginocchi, esposizioni: esposizioni.length, numeri };
  return { cella, conta, scarti };
}

// riempie dei poligoni (pari e dispari: i buchi restano vuoti)
function riempi(m, W, H, anelli) {
  let y0 = Infinity, y1 = -Infinity;
  for (const a of anelli) for (const p of a) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.max(0, Math.floor(y0)); y <= Math.min(H - 1, Math.ceil(y1)); y++) {
    const yc = y + 0.5, xs = [];
    for (const a of anelli) for (let i = 0, j = a.length - 1; i < a.length; j = i++) { const p = a[i], q = a[j]; if ((p[1] > yc) !== (q[1] > yc)) xs.push(p[0] + ((yc - p[1]) * (q[0] - p[0])) / (q[1] - p[1])); }
    xs.sort((u, v) => u - v);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.max(0, Math.ceil(xs[k] - 0.5)); x <= Math.min(W - 1, Math.floor(xs[k + 1] - 0.5)); x++) m[y * W + x] = 1;
  }
}

// quanto la fisica rifà l'immagine: le tracce rasterizzate contro l'inchiostro
export function fedelta(tracce, maschera, W, H, ritaglio = [0, 0, W, H]) {
  const m = new Uint8Array(W * H);
  const timbro = (cx, cy, r) => {
    for (let y = Math.max(0, Math.floor(cy - r)); y <= Math.min(H - 1, Math.ceil(cy + r)); y++) for (let x = Math.max(0, Math.floor(cx - r)); x <= Math.min(W - 1, Math.ceil(cx + r)); x++)
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) m[y * W + x] = 1;
  };
  for (const t of tracce) if (t.sagoma) riempi(m, W, H, [t.contorno, ...t.buchi]);
  for (const t of tracce) if (!t.sagoma) for (let i = 1; i < t.punti.length; i++) {
    const a = t.punti[i - 1], b = t.punti[i]; if (!a[2] || !b[2]) continue;
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2));
    for (let k = 0; k <= n; k++) { const u = k / n; timbro(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, Math.max(0.5, (a[4] + (b[4] - a[4]) * u) / 2)); }
  }
  let i = 0, ua = 0, ub = 0;
  for (let y = ritaglio[1]; y < ritaglio[3]; y++) for (let x = ritaglio[0]; x < ritaglio[2]; x++) { const k = y * W + x; if (m[k] && maschera[k]) i++; if (maschera[k]) ua++; if (m[k]) ub++; }
  return { iou: i / Math.max(1, ua + ub - i), richiamo: i / Math.max(1, ua), precisione: i / Math.max(1, ub), maschera: m };
}
