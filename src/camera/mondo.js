// mondo.js — una sezione di spaziotempo con poche leggi vere.
//
// Il pattern è la fotografia di un evento possibile, in uno dei tanti universi
// possibili: quello in cui le masse, i campi e i mezzi stanno esattamente dove
// servono. Le leggi sono cinque, e sono quelle del nostro universo:
//
//   1. GRAVITÀ   le MASSE stanno ferme e curvano lo spazio intorno a sé. Chi
//                passa segue la curvatura ma non sposta la massa (è un corpo di
//                prova: niente problema a molti corpi, niente traiettorie folli).
//                · una particella con massa cade con a = G·M/r², la stessa per
//                  tutte, leggere o pesanti (principio di equivalenza): la
//                  traiettoria è una proprietà dello spazio, non di chi passa;
//                · la luce si piega il doppio, come se attraversasse un vetro con
//                  indice n = 1 + 2·G·M/(r·c²): la deflessione della relatività
//                  generale in campo debole. Gravità e rifrazione sono la stessa
//                  cosa. Chi tocca il corpo della massa (raggio R) ci cade dentro.
//   2. MAGNETISMO nei domini con campo B (perpendicolare al piano) una carica
//                gira con ω = q·B/m (B·q > 0: antiorario). Più massa o più
//                velocità: curva più larga, r = m·v/(|q|·|B|).
//   3. MATERIA   nei domini con densità K una carica perde energia (Bethe):
//                dv/dt = −K·q²/(m·v²). Più lenta, frena più in fretta: si ferma
//                dopo una gittata finita m·v⁴/(4·K·q²) e la curva si stringe in
//                spirale fino all'occhio.
//   4. LUCE E MEZZI la luce va a c/n, dove n è l'indice del dominio; al confine
//                tra due mezzi si rifrange (Snell) o si riflette tutta; gli
//                SPECCHI (segmenti) riflettono chiunque, le pareti nere assorbono.
//   5. DECADIMENTO dopo la sua vita una particella si divide nelle figlie
//                previste dalla sua specie (direzione, quota di quantità di moto).
//                Un fotone che si converte in una coppia elettrone-positrone è
//                l'esempio più comune nelle camere a bolle.
//
// La PELLICOLA registra le cariche come bolle: lo spessore è proporzionale alla
// carica e cresce quando la particella rallenta, w = w0·|q|·min(saturazione,
// vRif/v); in fondo resta una macchia tonda (il picco di Bragg). La luce lascia
// un filo sottile (come un raggio nella nebbia). Le particelle neutre con massa
// non si vedono, a meno che la specie non dica "visibile".
//
// Il passo è esatto dentro un dominio senza masse: la velocità ruota di ω·dt, la
// velocità scalare segue Bethe in forma chiusa, la posizione avanza lungo la
// corda dell'arco. Vicino alle masse la gravità entra con mezzi calci (Verlet).

const DUE_PI = 2 * Math.PI;

// ---------- geometria dei domini
export function dentro(forma, x, y) {
  switch (forma.tipo) {
    case 'tutto': return true;
    case 'cerchio': { const dx = x - forma.centro[0], dy = y - forma.centro[1]; return dx * dx + dy * dy <= forma.r * forma.r; }
    case 'anello': {
      const dx = x - forma.centro[0], dy = y - forma.centro[1], r2 = dx * dx + dy * dy;
      if (r2 < forma.r[0] * forma.r[0] || r2 > forma.r[1] * forma.r[1]) return false;
      if (forma.ampiezza == null) return true;
      let a = Math.atan2(dy, dx) - forma.da; a = ((a % DUE_PI) + DUE_PI) % DUE_PI;
      return a <= forma.ampiezza;
    }
    case 'poligono': {
      const P = forma.punti; let d = false;
      for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
        if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) d = !d;
      }
      return d;
    }
    default: return false;
  }
}
// distanza dal bordo e normale uscente nel punto del bordo più vicino
function bordoForma(forma, x, y) {
  if (forma.tipo === 'cerchio' || forma.tipo === 'anello') {
    const dx = x - forma.centro[0], dy = y - forma.centro[1], r = Math.hypot(dx, dy) || 1e-12, u = [dx / r, dy / r];
    if (forma.tipo === 'cerchio') return { d: Math.abs(r - forma.r), n: u };
    const d0 = Math.abs(r - forma.r[0]), d1 = Math.abs(r - forma.r[1]);
    return d0 < d1 ? { d: d0, n: [-u[0], -u[1]] } : { d: d1, n: u };
  }
  if (forma.tipo === 'poligono') {
    const P = forma.punti; let best = { d: Infinity, n: [1, 0] };
    let area = 0; for (let i = 0, j = P.length - 1; i < P.length; j = i++) area += (P[j][0] - P[i][0]) * (P[j][1] + P[i][1]);
    const verso = area > 0 ? 1 : -1;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const ax = P[j][0], ay = P[j][1], sx = P[i][0] - ax, sy = P[i][1] - ay, l2 = sx * sx + sy * sy || 1e-12;
      const u = Math.max(0, Math.min(1, ((x - ax) * sx + (y - ay) * sy) / l2)), d = Math.hypot(x - ax - u * sx, y - ay - u * sy);
      if (d < best.d) { const l = Math.sqrt(l2); best = { d, n: [(verso * sy) / l, (-verso * sx) / l] }; }
    }
    return best;
  }
  return { d: Infinity, n: [1, 0] };
}
function riquadro(forma) {
  if (forma.tipo === 'cerchio') return [forma.centro[0] - forma.r, forma.centro[1] - forma.r, forma.centro[0] + forma.r, forma.centro[1] + forma.r];
  if (forma.tipo === 'anello') return [forma.centro[0] - forma.r[1], forma.centro[1] - forma.r[1], forma.centro[0] + forma.r[1], forma.centro[1] + forma.r[1]];
  if (forma.tipo === 'poligono') { const xs = forma.punti.map((p) => p[0]), ys = forma.punti.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
  return [-Infinity, -Infinity, Infinity, Infinity];
}

// una griglia per trovare in fretta i domini che contengono un punto
function indiceDomini(domini, larghezza, altezza) {
  const N = 48, cw = larghezza / N, ch = altezza / N, celle = Array.from({ length: N * N }, () => []), ovunque = [];
  domini.forEach((d, i) => {
    const [x0, y0, x1, y1] = riquadro(d.forma);
    if (!isFinite(x0)) { ovunque.push(i); return; }
    const a = Math.max(0, Math.floor(x0 / cw)), b = Math.min(N - 1, Math.floor(x1 / cw)), c = Math.max(0, Math.floor(y0 / ch)), e = Math.min(N - 1, Math.floor(y1 / ch));
    if (a > N - 1 || b < 0 || c > N - 1 || e < 0) { ovunque.push(i); return; }
    for (let gy = c; gy <= e; gy++) for (let gx = a; gx <= b; gx++) celle[gy * N + gx].push(i);
  });
  return (x, y) => {
    const gx = Math.floor(x / cw), gy = Math.floor(y / ch);
    const lista = gx >= 0 && gy >= 0 && gx < N && gy < N ? celle[gy * N + gx] : [];
    let best = -1;
    for (const i of ovunque) if (i > best && dentro(domini[i].forma, x, y)) best = i;
    for (const i of lista) if (i > best && dentro(domini[i].forma, x, y)) best = i;
    return best;
  };
}

// le specie si possono scrivere per nome: mondo.specie = { elettrone: {...}, ... }
export function risolviSpecie(s, catalogo = {}) {
  if (typeof s === 'string') { const o = catalogo[s]; if (!o) throw new Error(`specie sconosciuta: ${s}`); return { nome: s, ...o }; }
  return s;
}

// ---------- la simulazione di un'esposizione
// mondo = { larghezza, altezza, bordo: 'aperto'|'periodico'|'specchio', G, c,
//           fondo: { B, K, n }, domini: [{ forma, B, K, n }],
//           masse: [{ pos, M, R }], pareti: [{ a, b, tipo: 'specchio'|'assorbe' }],
//           pellicola: { w0, saturazione, vRif }, tempo,
//           specie: { nome: { q, m, luce, vita, visibile, figli: [{ specie, angolo, quota }] } },
//           sorgenti: [{ pos, dir, v, t0, specie }] }
// angolo delle figlie in gradi, relativo alla direzione della madre. Per la luce
// m è la sua energia (in unità di massa): la sua quantità di moto è m·c.
export function simulaMondo(mondo, opzioni = {}) {
  const W = mondo.larghezza, H = mondo.altezza, T = mondo.tempo ?? 200;
  const G = mondo.G ?? 1, C = mondo.c ?? 30;
  const fondo = { B: 0, K: 0, n: 1, ...(mondo.fondo || {}) };
  const domini = mondo.domini || [], pareti = mondo.pareti || [], masse = mondo.masse || [];
  const catalogo = mondo.specie || {};
  const pel = { w0: 1, saturazione: 4, vRif: 10, ...(mondo.pellicola || {}) };
  const bordo = mondo.bordo || 'aperto';
  const quale = indiceDomini(domini, W, H);
  const campoIn = (x, y) => {
    const i = quale(x, y);
    return i < 0 ? { B: fondo.B, K: fondo.K, n: fondo.n, i } : { B: domini[i].B ?? fondo.B, K: domini[i].K ?? fondo.K, n: domini[i].n ?? fondo.n, i };
  };
  // la gravità delle masse: accelerazione di caduta e distanza dalla superficie più vicina
  const gravita = (x, y) => {
    let gx = 0, gy = 0;
    for (const s of masse) { const dx = s.pos[0] - x, dy = s.pos[1] - y, r2 = dx * dx + dy * dy + 1e-9, k = (G * s.M) / (r2 * Math.sqrt(r2)); gx += k * dx; gy += k * dy; }
    return [gx, gy];
  };
  const superficie = (x, y) => { let d = Infinity, chi = -1; masse.forEach((s, j) => { const e = Math.hypot(x - s.pos[0], y - s.pos[1]) - (s.R ?? 0); if (e < d) { d = e; chi = j; } }); return { d, chi }; };
  const lontano = (x, y) => { let d = Infinity; for (const s of masse) d = Math.min(d, Math.hypot(x - s.pos[0], y - s.pos[1])); return d; };
  const passoMax = opzioni.passo ?? Math.max(W, H) / 500;
  const maxParticelle = opzioni.maxParticelle ?? 20000;
  const tracce = [], decadimenti = [];
  const coda = (mondo.sorgenti || []).map((s, i) => {
    const specie = risolviSpecie(s.specie, catalogo), v = specie.luce ? C / campoIn(...s.pos).n : s.v;
    return { pos: s.pos.slice(), vel: [Math.cos(s.dir ?? 0) * v, Math.sin(s.dir ?? 0) * v], t: s.t0 ?? 0, specie, nascita: s.t0 ?? 0, sorgente: i, generazione: 0, madre: null };
  });
  let nate = 0;

  while (coda.length && nate < maxParticelle) {
    const p = coda.shift(); nate++;
    const sp = p.specie, luce = !!sp.luce, q = luce ? 0 : sp.q ?? 0, m = sp.m ?? 1, vita = sp.vita ?? Infinity;
    const visibile = sp.visibile ?? (luce || q !== 0);
    const larghezza = (v) => (!visibile ? 0 : q ? pel.w0 * Math.abs(q) * Math.min(pel.saturazione, pel.vRif / Math.max(v, 1e-9)) : pel.w0 * 0.35);
    let [x, y] = p.pos, [vx, vy] = p.vel, t = p.t;
    let c = campoIn(x, y);
    // il nome della legge che agisce in un punto, per colorare e per spiegare
    const legge = (cc, gx, gy, v) => {
      const parti = [];
      if (masse.length) { const gp = Math.abs(gx * vy - gy * vx) / (v || 1); if ((gp * (luce ? 2 : 1)) / ((v * v) || 1) > 1 / (6 * Math.max(W, H))) parti.push('gravita'); }
      if (luce) { parti.push('luce'); return parti.join('+'); }
      if (q && cc.B) parti.push('magnetico');
      if (q && cc.K) parti.push('materia');
      return parti.length ? parti.join('+') : 'libero';
    };
    const g0 = gravita(x, y);
    const punti = [[x, y, visibile, t, larghezza(Math.hypot(vx, vy)), legge(c, g0[0], g0[1], Math.hypot(vx, vy))]];
    let fine = 'tempo', guardia = 0;
    while (t < T && guardia++ < 200000) {
      const v = Math.hypot(vx, vy);
      if (v < 1e-9) { fine = 'ferma'; break; }
      if (t >= p.nascita + vita) { fine = 'decade'; break; }
      const w = q ? (q * c.B) / m : 0, kq = q ? (c.K * q * q) / m : 0;
      // l'accelerazione di gravità: per la luce solo la parte trasversale, doppia, divisa per n²
      const accel = (px, py, ux, uy) => {
        if (!masse.length) return [0, 0];
        const [gx, gy] = gravita(px, py);
        if (!luce) return [gx, gy];
        const k = 2 / (c.n * c.n), par = gx * ux + gy * uy;
        return [k * (gx - par * ux), k * (gy - par * uy)];
      };
      const [ax, ay] = accel(x, y, vx / v, vy / v);
      // il passo: piccolo abbastanza per la svolta, per il rallentamento, vicino alle masse
      let dt = Math.min(passoMax / v, T - t, p.nascita + vita - t);
      if (masse.length) { const L = lontano(x, y), a = Math.hypot(ax, ay) + 1e-12; dt = Math.min(dt, (0.02 * L) / v, 0.1 * Math.sqrt(L / a)); }
      if (w) dt = Math.min(dt, 0.06 / Math.abs(w));
      if (kq) dt = Math.min(dt, (0.15 * v * v * v) / (3 * kq) + 1e-12);
      const avanza = (h) => {
        // mezzo calcio di gravità, poi rotazione esatta, Bethe esatto e corda
        // dell'arco, poi l'altro mezzo calcio (velocity Verlet)
        let wx = vx + (ax * h) / 2, wy = vy + (ay * h) / 2;
        const v0 = Math.hypot(wx, wy) || 1e-12;
        const fi = w * h, v3 = v0 * v0 * v0 - 3 * kq * h, v1 = kq ? (v3 > 0 ? Math.cbrt(v3) : 0) : v0;
        const vm = (v0 + v1) / 2, fattore = Math.abs(fi) > 1e-9 ? Math.sin(fi / 2) / (fi / 2) : 1;
        const ux = wx / v0, uy = wy / v0, cm = Math.cos(fi / 2), sm = Math.sin(fi / 2);
        const nx = x + vm * h * fattore * (ux * cm - uy * sm), ny = y + vm * h * fattore * (ux * sm + uy * cm);
        const cf = Math.cos(fi), sf = Math.sin(fi);
        wx = v1 * (ux * cf - uy * sf); wy = v1 * (ux * sf + uy * cf);
        if (masse.length) { const u = Math.hypot(wx, wy) || 1e-12, [bx, by] = accel(nx, ny, wx / u, wy / u); wx += (bx * h) / 2; wy += (by * h) / 2; }
        if (luce) { const u = Math.hypot(wx, wy) || 1e-12, s = C / c.n / u; wx *= s; wy *= s; }
        return { x: nx, y: ny, vx: wx, vy: wy, ferma: kq > 0 && v3 <= 0 };
      };
      let s = avanza(dt);
      // si attraversa un confine di dominio: si accorcia il passo fino al confine
      let c1 = campoIn(s.x, s.y), confine = null;
      if (c1.i !== c.i) {
        let lo = 0, hi = dt;
        for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2, r = avanza(mid); if (campoIn(r.x, r.y).i === c.i) lo = mid; else hi = mid; }
        dt = hi; s = avanza(dt); c1 = campoIn(s.x, s.y);
        confine = { prima: avanza(lo) };
      }
      // le pareti: la prima toccata lungo la corda
      let colpo = null;
      for (const pa of pareti) {
        const rx = s.x - x, ry = s.y - y, sx = pa.b[0] - pa.a[0], sy = pa.b[1] - pa.a[1];
        const den = rx * sy - ry * sx; if (Math.abs(den) < 1e-14) continue;
        const qx = pa.a[0] - x, qy = pa.a[1] - y, u = (qx * sy - qy * sx) / den, z = (qx * ry - qy * rx) / den;
        if (u > 1e-9 && u <= 1 && z >= -1e-9 && z <= 1 + 1e-9 && (!colpo || u < colpo.u)) colpo = { u, pa, sx, sy };
      }
      if (colpo) {
        const hx = x + (s.x - x) * colpo.u, hy = y + (s.y - y) * colpo.u, th = t + dt * colpo.u;
        const svx = vx + (s.vx - vx) * colpo.u, svy = vy + (s.vy - vy) * colpo.u;
        punti.push([hx, hy, visibile, th, larghezza(Math.hypot(svx, svy)), 'specchio']);
        if (colpo.pa.tipo === 'assorbe') { fine = 'assorbita'; t = th; break; }
        const l = Math.hypot(colpo.sx, colpo.sy), nx = -colpo.sy / l, ny = colpo.sx / l, d = svx * nx + svy * ny;
        // un filo di distanza dalla parete, per non toccarla di nuovo
        x = hx + nx * Math.sign(-d) * 1e-7; y = hy + ny * Math.sign(-d) * 1e-7; vx = svx - 2 * d * nx; vy = svy - 2 * d * ny; t = th;
        c = campoIn(x, y);
        continue;
      }
      // la luce al confine tra due mezzi: Snell, o riflessione totale
      if (confine && luce && c1.n !== c.n) {
        const cand = [c.i, c1.i].filter((i) => i >= 0).map((i) => bordoForma(domini[i].forma, s.x, s.y)).sort((a, b) => a.d - b.d)[0];
        const u = Math.hypot(s.vx, s.vy), d = [s.vx / u, s.vy / u];
        let N = cand ? cand.n : [-d[0], -d[1]];
        let ci = -(N[0] * d[0] + N[1] * d[1]); if (ci < 0) { N = [-N[0], -N[1]]; ci = -ci; }
        const eta = c.n / c1.n, k = 1 - eta * eta * (1 - ci * ci);
        if (k < 0) {
          // riflessione totale: si resta nel mezzo di prima
          const r = [d[0] + 2 * ci * N[0], d[1] + 2 * ci * N[1]], vv = C / c.n;
          x = confine.prima.x; y = confine.prima.y; t += dt; vx = r[0] * vv; vy = r[1] * vv;
          punti.push([x, y, visibile, t, larghezza(vv), 'rifrazione']);
          continue;
        }
        const e = eta * ci - Math.sqrt(k), r = [eta * d[0] + e * N[0], eta * d[1] + e * N[1]], rl = Math.hypot(r[0], r[1]), vv = C / c1.n;
        x = s.x; y = s.y; t += dt; vx = (r[0] / rl) * vv; vy = (r[1] / rl) * vv; c = c1;
        punti.push([x, y, visibile, t, larghezza(vv), 'rifrazione']);
        continue;
      }
      x = s.x; y = s.y; vx = s.vx; vy = s.vy; t += dt;
      // il corpo di una massa: chi lo tocca ci cade dentro
      if (masse.length) {
        const { d, chi } = superficie(x, y);
        if (d <= 0) {
          const mm = masse[chi], dx = x - mm.pos[0], dy = y - mm.pos[1], r = Math.hypot(dx, dy) || 1, R = mm.R ?? 0;
          x = mm.pos[0] + (dx / r) * R; y = mm.pos[1] + (dy / r) * R;
          punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), punti[punti.length - 1][5]]);
          fine = 'caduta'; break;
        }
      }
      // il bordo del mondo
      if (x < 0 || y < 0 || x > W || y > H) {
        if (bordo === 'periodico') {
          punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), punti[punti.length - 1][5]]);
          x = ((x % W) + W) % W; y = ((y % H) + H) % H;
          punti.push([x, y, false, t, 0, 'libero']);
        } else if (bordo === 'specchio') {
          if (x < 0 || x > W) { vx = -vx; x = Math.max(0, Math.min(W, x)); }
          if (y < 0 || y > H) { vy = -vy; y = Math.max(0, Math.min(H, y)); }
        } else { fine = 'fuori'; punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), punti[punti.length - 1][5]]); break; }
      }
      c = campoIn(x, y);
      const gg = masse.length ? gravita(x, y) : [0, 0];
      punti.push([x, y, visibile, t, larghezza(Math.hypot(vx, vy)), legge(c, gg[0], gg[1], Math.hypot(vx, vy))]);
      if (s.ferma) { fine = 'ferma'; vx = 0; vy = 0; break; }
    }
    if (visibile && punti.length > 1) tracce.push({ id: tracce.length, punti, fine, specie: sp, sorgente: p.sorgente, generazione: p.generazione, madre: p.madre });
    // il decadimento: le figlie partono da qui, ora
    if (fine === 'decade' && sp.figli) {
      const v = Math.hypot(vx, vy), dir = Math.atan2(vy, vx), P = luce ? m * C : m * v;
      for (const f of sp.figli) {
        const fs = risolviSpecie(f.specie, catalogo), a = dir + ((f.angolo ?? 0) * Math.PI) / 180, mf = fs.m ?? 1;
        const vf = fs.luce ? C / c.n : f.v != null ? f.v : ((f.quota ?? 0.5) * (P || m * pel.vRif)) / mf;
        coda.push({ pos: [x, y], vel: [Math.cos(a) * vf, Math.sin(a) * vf], t, nascita: t, specie: fs, sorgente: p.sorgente, generazione: p.generazione + 1, madre: { specie: sp.nome, t } });
      }
      decadimenti.push({ pos: [x, y], t, specie: sp.nome, sorgente: p.sorgente, generazione: p.generazione });
    }
  }
  tracce.decadimenti = decadimenti;
  return tracce;
}

// ---------- le forze in un punto, separate per legge (per vederle)
// Restituisce le accelerazioni che ogni legge dà a una particella di quella
// specie che passa in (x, y) con velocità (vx, vy), e il dominio dove si trova.
export function forze(mondo, specie, x, y, vx, vy) {
  const fondo = { B: 0, K: 0, n: 1, ...(mondo.fondo || {}) }, G = mondo.G ?? 1;
  let d = { ...fondo, i: -1 };
  (mondo.domini || []).forEach((dm, i) => { if (dentro(dm.forma, x, y)) d = { B: dm.B ?? fondo.B, K: dm.K ?? fondo.K, n: dm.n ?? fondo.n, i }; });
  const sp = risolviSpecie(specie, mondo.specie), luce = !!sp.luce, q = luce ? 0 : sp.q ?? 0, m = sp.m ?? 1;
  const v = Math.hypot(vx, vy) || 1e-12, ux = vx / v, uy = vy / v, out = { dominio: d, v };
  let gx = 0, gy = 0;
  for (const s of mondo.masse || []) { const dx = s.pos[0] - x, dy = s.pos[1] - y, r2 = dx * dx + dy * dy + 1e-9, k = (G * s.M) / (r2 * Math.sqrt(r2)); gx += k * dx; gy += k * dy; }
  if (luce) { const k = 2 / (d.n * d.n), par = gx * ux + gy * uy; gx = k * (gx - par * ux); gy = k * (gy - par * uy); }
  if (gx || gy) out.gravita = [gx, gy];
  if (q && d.B) { const w = (q * d.B) / m; out.magnetico = [-w * vy, w * vx]; }
  if (q && d.K) { const a = (d.K * q * q) / (m * v * v); out.materia = [-a * ux, -a * uy]; }
  return out;
}

// ---------- un esperimento: più esposizioni sovrapposte sulla stessa lastra
export function simulaEsperimento(esp, opzioni = {}) {
  const out = [];
  for (const [k, mondo] of (esp.esposizioni || []).entries()) {
    for (const tr of simulaMondo({ larghezza: esp.larghezza, altezza: esp.altezza, ...mondo }, opzioni)) out.push({ ...tr, esposizione: k });
  }
  return out;
}

// ---------- utilità fisiche per chi progetta un esperimento
// raggio di curvatura: r = m·v / (|q|·|B|)
export const raggio = (specie, v, B) => ((specie.m ?? 1) * v) / (Math.abs(specie.q) * Math.abs(B));
// gittata nella materia: m·v⁴ / (4·K·q²)
export const gittata = (specie, v, K) => ((specie.m ?? 1) * v ** 4) / (4 * K * specie.q * specie.q);
// la velocità che dà una certa gittata
export const velocitaPerGittata = (specie, R, K) => Math.pow((4 * K * specie.q * specie.q * R) / (specie.m ?? 1), 0.25);
// il tempo per fermarsi: m·v³ / (3·K·q²)
export const tempoDiArresto = (specie, v, K) => ((specie.m ?? 1) * v ** 3) / (3 * K * specie.q * specie.q);
// velocità dell'orbita circolare attorno a una massa: √(G·M/r)
export const velocitaOrbitale = (G, M, r) => Math.sqrt((G * M) / r);
// deflessione della luce che passa a distanza b: 4·G·M/(b·c²)
export const deflessioneLuce = (G, M, b, c) => (4 * G * M) / (b * c * c);
