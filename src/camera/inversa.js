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

// ---------- l'intera immagine
// ris: il risultato di decodifica() (coordinate del mondo con y verso l'alto)
export function tracciaFisica(ris, opzioni = {}) {
  const W = ris.misure.larghezza, H = ris.misure.altezza, giu = (p) => [p[0], H - p[1], p[2] ?? 0];
  const oggetti = [], specie = {}, sagome = [];
  const nomeSpecie = (q, m, extra = '') => { const n = `${extra || 'tratto'} ${arr(q)}`; if (!specie[n]) specie[n] = { q: arr(q), m }; return n; };
  let pezzi = 0;
  // i tratti
  for (const l of ris.linee || []) {
    const fit = adattaTratto(l.punti.map(giu), opzioni);
    if (!fit || fit.lunghezza < 1) continue;
    const q = Math.max(0.5, Math.round(fit.larghezza * 4) / 4), hw = Math.max(2, q * 0.6 + 1.5);
    const { domini, fine } = corridoi(fit, q, 1, hw);
    // alla fine del tratto la particella decade: la sua vita è il tempo per percorrerlo
    void fine;
    oggetti.push({ tipo: 'tratto', domini, pareti: [], sorgenti: [{ pos: fit.inizio.pos.map(cifre), dir: cifre(fit.inizio.dir), v: V, vita: cifre(fit.lunghezza / V), specie: nomeSpecie(q, 1) }], tempo: fit.lunghezza / V + 1, pezzi: fit.pezzi.length });
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
    o.scatole = [...o.domini.map((d) => riquadroForma(d.forma)), ...o.pareti.map((p) => [Math.min(p.a[0], p.b[0]) - 0.5, Math.min(p.a[1], p.b[1]) - 0.5, Math.max(p.a[0], p.b[0]) + 0.5, Math.max(p.a[1], p.b[1]) + 0.5])];
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
  const esposizioni = lastre.map((L) => ({
    domini: L.oggetti.flatMap((o) => o.domini), pareti: L.oggetti.flatMap((o) => o.pareti), sorgenti: L.oggetti.flatMap((o) => o.sorgenti),
    tempo: Math.max(...L.oggetti.map((o) => o.tempo)),
  }));
  // la lastra è materia densa: i corridoi sono canali vuoti. Una particella
  // che sfugge al suo canale si ferma subito, invece di tirare una riga
  const cella = { larghezza: W, altezza: H, c: 30, G: 1, bordo: 'aperto', tempo: Math.max(1, ...esposizioni.map((e) => e.tempo)), fondo: { B: 0, K: 40000, n: 1 }, domini: [], masse: [], pareti: [], sorgenti: [], pellicola: { ...PELLICOLA }, specie, esposizioni, sagome };
  const numeri = esposizioni.reduce((n, e) => n + e.domini.length * 6 + e.pareti.length * 4 + e.sorgenti.length * 4, 0) + sagome.reduce((n, g) => n + 2 * (g.contorno.length + g.buchi.reduce((m, h) => m + h.length, 0)), 0);
  const conta = { tratti: oggetti.filter((o) => o.tipo === 'tratto').length, petali: oggetti.filter((o) => o.tipo === 'petalo').length, dischi: oggetti.filter((o) => o.tipo === 'disco').length, campiture: sagome.length, pezzi, esposizioni: esposizioni.length, numeri };
  return { cella, conta };
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
