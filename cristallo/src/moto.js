// moto.js — la pallina: l'integratore, il viaggio e la tessera.
//
// L1 (solo il cristallo): Verlet a velocità, a passo fisso. È simplettico: l'energia oscilla ma non deriva.
// L2 (il magnete, B uniforme in una direzione data): il passo di Boris. La velocità sta a metà passo; il passo è
//   mezza spinta della forza, una rotazione attorno a B, l'altra mezza spinta, poi lo spostamento. La rotazione
//   v' = v⁻ + v⁻×t, v⁺ = v⁻ + v'×s con t = qB·dt/2m, s = 2t/(1 + t²) conserva |v| esattamente (a meno dell'ultimo
//   bit). Con F = 0 l'orbita è un cerchio di raggio (v/Ω)·√(1 + (Ω·dt/2)²), Ω = qB/m.
// La pallina ha massa 1 e carica 1 (le unità del progetto).

export const DUE_PI = 2 * Math.PI;

// stato: { x: [3], v: [3], t, F: [3] (la forza in x) }
export function creaPallina(cristallo, r0, v0) {
  const F = [0, 0, 0];
  cristallo.campo(r0[0], r0[1], r0[2], F);
  return { x: [...r0], v: [...v0], t: 0, F };
}

// n passi di Verlet; se «traccia» è data, vi aggiunge ogni posizione
export function passiVerlet(cristallo, s, dt, n, traccia = null) {
  const x = s.x, v = s.v, F = s.F, campo = cristallo.campo, h = dt / 2;
  for (let i = 0; i < n; i++) {
    v[0] += h * F[0]; v[1] += h * F[1]; v[2] += h * F[2];
    x[0] += dt * v[0]; x[1] += dt * v[1]; x[2] += dt * v[2];
    campo(x[0], x[1], x[2], F);
    v[0] += h * F[0]; v[1] += h * F[1]; v[2] += h * F[2];
    if (traccia) traccia(x, v);
  }
  s.t += n * dt;
}

// n passi di Boris con B = (Bx, By, Bz) (carica e massa 1)
export function passiBoris(cristallo, s, dt, n, B, traccia = null) {
  const x = s.x, v = s.v, F = s.F, campo = cristallo.campo, h = dt / 2;
  const tx = B[0] * h, ty = B[1] * h, tz = B[2] * h, k = 2 / (1 + tx * tx + ty * ty + tz * tz), sx = k * tx, sy = k * ty, sz = k * tz;
  for (let i = 0; i < n; i++) {
    const mx = v[0] + h * F[0], my = v[1] + h * F[1], mz = v[2] + h * F[2];
    const px = mx + (my * tz - mz * ty), py = my + (mz * tx - mx * tz), pz = mz + (mx * ty - my * tx);
    const qx = mx + (py * sz - pz * sy), qy = my + (pz * sx - px * sz), qz = mz + (px * sy - py * sx);
    v[0] = qx + h * F[0]; v[1] = qy + h * F[1]; v[2] = qz + h * F[2];
    x[0] += dt * v[0]; x[1] += dt * v[1]; x[2] += dt * v[2];
    campo(x[0], x[1], x[2], F);
    if (traccia) traccia(x, v);
  }
  s.t += n * dt;
}
// nota: con il magnete la velocità tenuta è quella di metà passo (v_{n+½}); con F = 0 è la sola rotazione, e |v|
// resta quello del lancio all'ultimo bit.

export const haMagnete = (B) => !!B && (B[0] !== 0 || B[1] !== 0 || B[2] !== 0);
// (col magnete, al primo passo la velocità del lancio v₀ si porta a metà passo prima: v_{−½} = v₀ − (dt/2)·(F + v₀×B),
// così il metodo resta del secondo ordine anche nella condizione iniziale)
export function avanza(cristallo, s, dt, n, B, traccia = null) {
  if (n <= 0) return;
  if (haMagnete(B)) {
    if (!s.mezzo) {
      const v = s.v, F = s.F, h = dt / 2;
      const c = [v[1] * B[2] - v[2] * B[1], v[2] * B[0] - v[0] * B[2], v[0] * B[1] - v[1] * B[0]];
      for (let k = 0; k < 3; k++) v[k] -= h * (F[k] + c[k]);
      s.mezzo = true;
    }
    passiBoris(cristallo, s, dt, n, B, traccia);
  } else passiVerlet(cristallo, s, dt, n, traccia);
}

export function energia(cristallo, s) {
  return 0.5 * (s.v[0] * s.v[0] + s.v[1] * s.v[1] + s.v[2] * s.v[2]) + cristallo.campo(s.x[0], s.x[1], s.x[2], null);
}

// ---------- il viaggio: una polilinea 3D che cresce
// punti in un Float64Array (x, y, z), con accanto la velocità di ogni punto (per il colore)
export function creaViaggio(capienza = 4096) {
  const v = { n: 0, p: new Float64Array(3 * capienza), vel: new Float32Array(capienza) };
  v.aggiungi = (x, sp) => {
    if (v.n * 3 + 3 > v.p.length) {
      const p = new Float64Array(v.p.length * 2); p.set(v.p); v.p = p;
      const q = new Float32Array(v.vel.length * 2); q.set(v.vel); v.vel = q;
    }
    v.p[3 * v.n] = x[0]; v.p[3 * v.n + 1] = x[1]; v.p[3 * v.n + 2] = x[2]; v.vel[v.n] = sp; v.n++;
  };
  v.punti = () => v.p.subarray(0, 3 * v.n);
  return v;
}

// ---------- la tessera: il viaggio ripiegato nella cella (r mod reticolo)
// Il tratto tra due punti si porta nella cella del primo; se esce dalla cella, si taglia esattamente sulla faccia
// (coordinate frazionarie in [0, 1]) e il pezzo che segue riparte, ripiegato, dalla faccia opposta. Esce una lista di
// tratti 3D (x1, y1, z1, x2, y2, z2) dentro la cella convenzionale, con la velocità del tratto.
export function creaTessera(cristallo) {
  const A = cristallo.A, Ar = cristallo.Ar;
  const t = { n: 0, s: new Float64Array(6 * 4096), vel: new Float32Array(4096) };
  const metti = (f, g, sp) => {
    if (t.n * 6 + 6 > t.s.length) {
      const s = new Float64Array(t.s.length * 2); s.set(t.s); t.s = s;
      const q = new Float32Array(t.vel.length * 2); q.set(t.vel); t.vel = q;
    }
    const o = 6 * t.n;
    for (let k = 0; k < 3; k++) {
      t.s[o + k] = f[0] * A[0][k] + f[1] * A[1][k] + f[2] * A[2][k];
      t.s[o + 3 + k] = g[0] * A[0][k] + g[1] * A[1][k] + g[2] * A[2][k];
    }
    t.vel[t.n] = sp; t.n++;
  };
  const fr = (p) => [p[0] * Ar[0][0] + p[1] * Ar[0][1] + p[2] * Ar[0][2], p[0] * Ar[1][0] + p[1] * Ar[1][1] + p[2] * Ar[1][2], p[0] * Ar[2][0] + p[1] * Ar[2][1] + p[2] * Ar[2][2]];
  // aggiunge il tratto p→q (punti 3D del viaggio)
  t.aggiungi = (p, q, sp) => {
    const a = fr(p), b = fr(q), cella = a.map(Math.floor);
    let f = a.map((x, k) => x - cella[k]), d = b.map((x, k) => x - a[k]);
    for (let giri = 0; giri < 8; giri++) {
      // fin dove il tratto resta nella cella [0, 1]³
      let tf = 1, faccia = -1, verso = 0;
      for (let k = 0; k < 3; k++) {
        if (d[k] > 0) { const s = (1 - f[k]) / d[k]; if (s < tf) { tf = s; faccia = k; verso = 1; } }
        else if (d[k] < 0) { const s = -f[k] / d[k]; if (s < tf) { tf = s; faccia = k; verso = -1; } }
      }
      const g = f.map((x, k) => x + tf * d[k]);
      if (faccia >= 0) g[faccia] = verso > 0 ? 1 : 0; // esattamente sulla faccia
      metti(f, g, sp);
      if (faccia < 0) return;
      d = d.map((x) => x * (1 - tf));
      f = g; f[faccia] = verso > 0 ? 0 : 1;
    }
  };
  return t;
}
