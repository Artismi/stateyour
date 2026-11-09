// decodifica.js — dall'immagine al seme.
//
// Legge un'immagine di ornamento e la riscrive nel linguaggio fisico del
// progetto: catene per punti di ancoraggio con volute e rami, petali,
// dischi. Il risultato è una codifica che si compila in uno stato di
// spaziotempo e si fa crescere con una sola simulazione.
//
// I passi:
//   1. colori      tre gruppi di colore (k-medie): l'inchiostro è il più
//                  scuro, il fondo è il più frequente al centro; si ritaglia
//                  il campo del fondo
//   2. maschera    ogni pixel tra inchiostro e fondo, ingrandito e poi
//                  sogliato: bordi più lisci; via le briciole e i buchini
//   3. distanza    la trasformata di distanza euclidea: lo spessore locale
//   4. scheletro   assottigliamento di Zhang e Suen, poi via i pixel ridondanti
//   5. grafo       estremi, nodi, tratti; via i rametti spuri
//   6. tratti      dagli estremi si cammina scegliendo a ogni nodo la via più
//                  diritta (buona continuazione); ciò che resta sono rami
//   7. figure      un tratto corto che si allarga verso la punta è un petalo;
//                  una macchia tonda è un disco; il resto è una catena
//   8. codifica    per ogni catena: ancoraggi (Douglas e Peucker), tangenti,
//                  profilo di spessore, rami agganciati ai loro nodi
//   9. residuo     si fa crescere il seme, si toglie dall'inchiostro ciò che
//                  è già coperto, e quel che resta diventa CAMPITURE: il suo
//                  contorno è uno specchio chiuso e dentro una particella con
//                  spessore rimbalza fino a riempirlo (un biliardo)
//
// Funziona nel browser e in Node: l'immagine è { larghezza, altezza, canali, dati }.

import { catena } from './catena.js';
import { MOTIVI } from './motivi.js';
import { trasformaPartitura } from './seme.js';
import { simula } from './motore.js';
import { lineeDaTracce } from './grammatica.js';

// ---------- 1. colori
function kmedie(img, k = 3, campioni = 20000) {
  const { larghezza: W, altezza: H, canali: C, dati } = img;
  const pts = [];
  const passo = Math.max(1, Math.floor((W * H) / campioni));
  for (let i = 0; i < W * H; i += passo) pts.push([dati[i * C], dati[i * C + 1], dati[i * C + 2]]);
  // partenza: il più scuro, il più chiaro, la mediana della luminanza
  const lum = (p) => 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2];
  const ord = pts.slice().sort((a, b) => lum(a) - lum(b));
  let centri = [ord[Math.floor(ord.length * 0.02)], ord[Math.floor(ord.length * 0.5)], ord[Math.floor(ord.length * 0.98)]].slice(0, k).map((p) => p.slice());
  for (let it = 0; it < 25; it++) {
    const somme = centri.map(() => [0, 0, 0, 0]);
    for (const p of pts) {
      let best = 0, bd = Infinity;
      centri.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } });
      const s = somme[best]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    centri = somme.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : centri[j]));
  }
  return centri;
}

// ---------- utilità di immagine
export function componenti(maschera, W, H, valore = 1) {
  const etich = new Int32Array(W * H).fill(-1), comp = [];
  const coda = new Int32Array(W * H);
  for (let s = 0; s < W * H; s++) {
    if (maschera[s] !== valore || etich[s] >= 0) continue;
    const id = comp.length; let a = 0, b = 0; coda[b++] = s; etich[s] = id;
    const pixel = [];
    while (a < b) {
      const p = coda[a++]; pixel.push(p);
      const x = p % W, y = (p - x) / W;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        if (valore === 0 && dx && dy) continue; // il fondo è 4-connesso
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const q = yy * W + xx;
        if (maschera[q] === valore && etich[q] < 0) { etich[q] = id; coda[b++] = q; }
      }
    }
    comp.push(pixel);
  }
  return { etich, comp };
}

// trasformata di distanza euclidea esatta (Felzenszwalb e Huttenlocher)
export function distanza(maschera, W, H) {
  const INF = 1e20, f = new Float64Array(Math.max(W, H)), d = new Float64Array(W * H);
  const dt1 = (f, n, out) => {
    const v = new Int32Array(n), z = new Float64Array(n + 1); let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) ** 2 + f[v[k]]; }
  };
  const tmp = new Float64Array(Math.max(W, H));
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = maschera[y * W + x] ? INF : 0;
    dt1(f, H, tmp);
    for (let y = 0; y < H; y++) d[y * W + x] = tmp[y];
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = d[y * W + x];
    dt1(f, W, tmp);
    for (let x = 0; x < W; x++) d[y * W + x] = Math.sqrt(tmp[x]);
  }
  return d;
}

// ---------- 4. scheletro
const ANELLO = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]; // N, NE, E, SE, S, SO, O, NO
function zhangSuen(m, W, H) {
  const s = Uint8Array.from(m);
  const vicini = (x, y) => ANELLO.map(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < W && yy < H ? s[yy * W + xx] : 0; });
  let cambiato = true;
  while (cambiato) {
    cambiato = false;
    for (const passo of [0, 1]) {
      const via = [];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
        if (!s[y * W + x]) continue;
        const P = vicini(x, y); // P2..P9 = N, NE, E, SE, S, SO, O, NO
        const B = P.reduce((a, b) => a + b, 0);
        if (B < 2 || B > 6) continue;
        let A = 0; for (let i = 0; i < 8; i++) if (!P[i] && P[(i + 1) % 8]) A++;
        if (A !== 1) continue;
        const [N, , E, , S, , O] = P;
        if (passo === 0 ? (N * E * S || E * S * O) : (N * E * O || N * S * O)) continue;
        via.push(y * W + x);
      }
      for (const p of via) s[p] = 0;
      if (via.length) cambiato = true;
    }
  }
  // via i pixel ridondanti: se i vicini restano un solo gruppo connesso e il
  // pixel non è un estremo, toglierlo non cambia la forma dello scheletro
  let tolti = true;
  while (tolti) {
    tolti = false;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (!s[y * W + x]) continue;
      const P = ANELLO.map(([dx, dy]) => s[(y + dy) * W + x + dx]);
      const n = P.reduce((a, b) => a + b, 0);
      if (n < 2) continue;
      // gruppi nell'anello: adiacenti se consecutivi, o a distanza 2 attraverso un angolo
      const padre = [0, 1, 2, 3, 4, 5, 6, 7];
      const trova = (i) => (padre[i] === i ? i : (padre[i] = trova(padre[i])));
      for (let i = 0; i < 8; i++) {
        if (!P[i]) continue;
        const j = (i + 1) % 8; if (P[j]) padre[trova(i)] = trova(j);
        if (i % 2 === 0) { const k2 = (i + 2) % 8; if (P[k2]) padre[trova(i)] = trova(k2); }
      }
      const gruppi = new Set(); for (let i = 0; i < 8; i++) if (P[i]) gruppi.add(trova(i));
      if (gruppi.size === 1 && n <= 4) { s[y * W + x] = 0; tolti = true; }
    }
  }
  return s;
}

// ---------- 5. grafo dello scheletro
function grafo(s, W, H) {
  const grado = new Uint8Array(W * H);
  const vic = (p) => { const x = p % W, y = (p - x) / W, out = []; for (const [dx, dy] of ANELLO) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H && s[yy * W + xx]) out.push(yy * W + xx); } return out; };
  const px = [];
  for (let p = 0; p < W * H; p++) if (s[p]) { grado[p] = vic(p).length; px.push(p); }
  // i nodi: estremi (grado 1) e incroci (grado ≥ 3, i pixel vicini si fondono in un nodo)
  const nodoDi = new Int32Array(W * H).fill(-1), nodi = [];
  for (const p of px) {
    if (grado[p] === 2 || nodoDi[p] >= 0) continue;
    const id = nodi.length, membri = [p]; nodoDi[p] = id;
    if (grado[p] >= 3) {
      for (let i = 0; i < membri.length; i++) for (const q of vic(membri[i])) if (grado[q] >= 3 && nodoDi[q] < 0) { nodoDi[q] = id; membri.push(q); }
    }
    let sx = 0, sy = 0; for (const q of membri) { sx += q % W; sy += Math.floor(q / W); }
    nodi.push({ id, membri, pos: [sx / membri.length, sy / membri.length], grado: grado[p] === 0 ? 0 : grado[p] === 1 ? 1 : 3, archi: [] });
  }
  // gli archi: da ogni pixel di nodo si cammina lungo i pixel di grado 2
  const visto = new Uint8Array(W * H), archi = [];
  for (const n of nodi) {
    for (const m of n.membri) {
      for (const q0 of vic(m)) {
        if (nodoDi[q0] === n.id || visto[q0]) continue;
        const pts = [m];
        let prec = m, cur = q0, fine = -1;
        while (true) {
          if (nodoDi[cur] >= 0) { fine = nodoDi[cur]; pts.push(cur); break; }
          visto[cur] = 1; pts.push(cur);
          const avanti = vic(cur).filter((q) => q !== prec && !visto[q] && !(pts.length === 2 && nodoDi[q] === n.id && q === m));
          if (!avanti.length) { const nn = vic(cur).find((q) => nodoDi[q] >= 0 && q !== prec && nodoDi[q] !== n.id); if (nn != null) { fine = nodoDi[nn]; pts.push(nn); } break; }
          // preferisci un nodo, poi un vicino in croce, poi in diagonale
          const nodoQ = avanti.find((q) => nodoDi[q] >= 0);
          const cx = cur % W, cy = (cur - cx) / W;
          const croce = avanti.find((q) => { const x = q % W, y = (q - x) / W; return x === cx || y === cy; });
          prec = cur; cur = nodoQ ?? croce ?? avanti[0];
        }
        if (fine < 0 && pts.length < 3) continue;
        const a = { id: archi.length, da: n.id, a: fine, pixel: pts };
        archi.push(a); n.archi.push(a.id); if (fine >= 0 && fine !== n.id) nodi[fine].archi.push(a.id); else if (fine === n.id) n.archi.push(a.id);
      }
    }
  }
  // gli anelli chiusi senza nodi
  for (const p of px) {
    if (grado[p] !== 2 || visto[p] || nodoDi[p] >= 0) continue;
    const pts = [p]; visto[p] = 1; let prec = -1, cur = p;
    while (true) {
      const avanti = vic(cur).filter((q) => q !== prec && !visto[q]);
      if (!avanti.length) break;
      prec = cur; cur = avanti[0]; visto[cur] = 1; pts.push(cur);
    }
    if (pts.length > 6) { pts.push(p); archi.push({ id: archi.length, da: -1, a: -1, pixel: pts, chiuso: true }); }
  }
  return { nodi, archi };
}

// ---------- geometria dei tratti
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function liscia(pts, sigma) {
  if (pts.length < 5 || sigma <= 0) return pts.map((p) => p.slice());
  const r = Math.ceil(2.5 * sigma), pesi = [];
  for (let i = -r; i <= r; i++) pesi.push(Math.exp(-(i * i) / (2 * sigma * sigma)));
  return pts.map((p, i) => {
    if (i === 0 || i === pts.length - 1) return p.slice();
    // vicino agli estremi la finestra si accorcia simmetrica, così gli estremi non si muovono
    const rr = Math.min(r, i, pts.length - 1 - i);
    let sx = 0, sy = 0, sw = 0, sp = 0;
    for (let j = -rr; j <= rr; j++) { const q = pts[i + j], w = pesi[j + r]; sx += q[0] * w; sy += q[1] * w; sp += (q[2] ?? 0) * w; sw += w; }
    return [sx / sw, sy / sw, sp / sw];
  });
}
function lunghezza(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i], pts[i - 1]); return s; }
function douglasPeucker(pts, eps, obbligati = new Set()) {
  const tieni = new Uint8Array(pts.length); tieni[0] = 1; tieni[pts.length - 1] = 1;
  for (const i of obbligati) tieni[i] = 1;
  const pila = [];
  // spezza ai punti obbligati
  const fissi = [...tieni.keys()].filter((i) => tieni[i]);
  for (let k = 1; k < fissi.length; k++) pila.push([fissi[k - 1], fissi[k]]);
  while (pila.length) {
    const [a, b] = pila.pop();
    let dmax = 0, imax = -1;
    const A = pts[a], B = pts[b], L = dist(A, B) || 1e-9;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((B[0] - A[0]) * (A[1] - pts[i][1]) - (A[0] - pts[i][0]) * (B[1] - A[1])) / L;
      if (d > dmax) { dmax = d; imax = i; }
    }
    if (dmax > eps && imax > 0) { tieni[imax] = 1; pila.push([a, imax], [imax, b]); }
  }
  return [...tieni.keys()].filter((i) => tieni[i]);
}
function tangente(pts, i, finestra = 3) {
  const a = pts[Math.max(0, i - finestra)], b = pts[Math.min(pts.length - 1, i + finestra)];
  const l = dist(a, b) || 1; return [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
}
function svoltaTotale(pts) {
  let s = 0;
  for (let i = 2; i < pts.length; i++) {
    const u = [pts[i - 1][0] - pts[i - 2][0], pts[i - 1][1] - pts[i - 2][1]], w = [pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]];
    s += Math.atan2(u[0] * w[1] - u[1] * w[0], u[0] * w[0] + u[1] * w[1]);
  }
  return s;
}
const mediana = (a) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

// ---------- contorni: il bordo di una regione, percorso in senso orario (Moore)
const MOORE = [[-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1]];
function traccia(fg, W, H, inizio) {
  const pts = [inizio];
  const dentro = (p) => p >= 0 && p < W * H && fg(p);
  let p = inizio, cerca = 0, primo = -1, giri = 0;
  while (giri++ < 4 * W * H) {
    const x = p % W, y = (p - x) / W;
    let d = -1;
    for (let k = 0; k < 8; k++) {
      const dd = (cerca + k) % 8, xx = x + MOORE[dd][0], yy = y + MOORE[dd][1];
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && dentro(yy * W + xx)) { d = dd; break; }
    }
    if (d < 0) break; // un pixel solo
    const q = (y + MOORE[d][1]) * W + x + MOORE[d][0];
    if (p === inizio && d === primo) break;
    if (primo < 0) primo = d;
    p = q; pts.push(p); cerca = (d + 5) % 8;
  }
  pts.pop();
  return pts;
}

// ---------- la decodifica
export function decodifica(img, opzioni = {}) {
  const scala = opzioni.scala ?? 2;
  const { larghezza: W0, altezza: H0, canali: C, dati } = img;

  // 1. colori e ritaglio
  const centri = kmedie(img);
  const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const iInk = centri.map(lum).indexOf(Math.min(...centri.map(lum)));
  const vicino = (p) => { let best = 0, bd = Infinity; centri.forEach((c, j) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } }); return best; };
  const conta = centri.map(() => 0);
  for (let y = Math.floor(H0 * 0.25); y < H0 * 0.75; y += 2) for (let x = Math.floor(W0 * 0.25); x < W0 * 0.75; x += 2) {
    const i = (y * W0 + x) * C; conta[vicino([dati[i], dati[i + 1], dati[i + 2]])]++;
  }
  conta[iInk] = -1;
  const iFondo = conta.indexOf(Math.max(...conta));
  let rit = [0, 0, W0, H0];
  if (opzioni.ritaglio === undefined || opzioni.ritaglio === 'auto') {
    // le righe e le colonne in cui il fondo è almeno un terzo
    const col = new Float64Array(W0), riga = new Float64Array(H0);
    for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
      const i = (y * W0 + x) * C; if (vicino([dati[i], dati[i + 1], dati[i + 2]]) === iFondo) { col[x]++; riga[y]++; }
    }
    const xs = [...col.keys()].filter((x) => col[x] > H0 * 0.33), ys = [...riga.keys()].filter((y) => riga[y] > W0 * 0.33);
    if (xs.length > W0 * 0.3 && ys.length > H0 * 0.3) rit = [xs[0] + 2, ys[0] + 2, xs[xs.length - 1] - 1, ys[ys.length - 1] - 1];
  } else if (Array.isArray(opzioni.ritaglio)) rit = opzioni.ritaglio;
  const [rx0, ry0, rx1, ry1] = rit, Wr = rx1 - rx0, Hr = ry1 - ry0;

  // 2. maschera: quanto ogni pixel sta dalla parte dell'inchiostro (0..1), ingrandito
  const ink = centri[iInk], fondo = centri[iFondo];
  const dir = [fondo[0] - ink[0], fondo[1] - ink[1], fondo[2] - ink[2]], dd = dir[0] ** 2 + dir[1] ** 2 + dir[2] ** 2;
  const t = new Float32Array(Wr * Hr);
  for (let y = 0; y < Hr; y++) for (let x = 0; x < Wr; x++) {
    const i = ((y + ry0) * W0 + x + rx0) * C;
    t[y * Wr + x] = ((dati[i] - ink[0]) * dir[0] + (dati[i + 1] - ink[1]) * dir[1] + (dati[i + 2] - ink[2]) * dir[2]) / dd;
  }
  const W = Wr * scala, H = Hr * scala, m = new Uint8Array(W * H);
  const soglia = opzioni.soglia ?? 0.5;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const fx = Math.min(Wr - 1.001, Math.max(0, (x + 0.5) / scala - 0.5)), fy = Math.min(Hr - 1.001, Math.max(0, (y + 0.5) / scala - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
    const v = t[y0 * Wr + x0] * (1 - ax) * (1 - ay) + t[y0 * Wr + x0 + 1] * ax * (1 - ay) + t[(y0 + 1) * Wr + x0] * (1 - ax) * ay + t[(y0 + 1) * Wr + x0 + 1] * ax * ay;
    m[y * W + x] = v < soglia ? 1 : 0;
  }
  // bordo vuoto, via briciole e buchini
  for (let x = 0; x < W; x++) { m[x] = 0; m[(H - 1) * W + x] = 0; }
  for (let y = 0; y < H; y++) { m[y * W] = 0; m[y * W + W - 1] = 0; }
  const minArea = (opzioni.minArea ?? 6) * scala * scala;
  for (const c of componenti(m, W, H, 1).comp) if (c.length < minArea) for (const p of c) m[p] = 0;
  for (const c of componenti(m, W, H, 0).comp) if (c.length < minArea * 0.5) for (const p of c) m[p] = 1;

  // passi 3–8: leggere una maschera e codificarla
  const leggi = (m) => {
  // 3. distanza
  const D = distanza(m, W, H);
  // 4. scheletro
  const S = zhangSuen(m, W, H);
  // 5. grafo
  const G = grafo(S, W, H);
  const pos = (p) => [p % W, Math.floor(p / W)];

  // via i rametti spuri: un arco da un estremo a un nodo più corto dello spessore lì
  const vivo = G.archi.map(() => true);
  for (let giro = 0; giro < 3; giro++) {
    for (const a of G.archi) {
      if (!vivo[a.id] || a.chiuso) continue;
      const nA = G.nodi[a.da], nB = a.a >= 0 ? G.nodi[a.a] : null;
      const gradoVivo = (n) => n.archi.filter((id) => vivo[id]).length;
      const estremo = nA.grado === 1 && nB && gradoVivo(nB) >= 3 ? nB : nB && nB.grado === 1 && gradoVivo(nA) >= 3 ? nA : null;
      if (!estremo) continue;
      const pn = estremo.membri[0];
      // spurio: resta dentro il disco del nodo (una gobba del bordo), non ne esce come un vero ramo
      if (a.pixel.length < Math.max(2 * scala, D[pn] + 1.0 * scala)) vivo[a.id] = false;
    }
  }

  // 6. tratti per buona continuazione
  const archiVivi = G.archi.filter((a) => vivo[a.id]);
  const usato = new Set();
  // la direzione con cui un arco lascia un nodo, presa qualche pixel più in là
  const uscita = (a, n) => {
    const pts = a.da === n ? a.pixel : a.pixel.slice().reverse();
    const i = Math.min(pts.length - 1, Math.max(3, Math.round(4 * scala)));
    const p0 = pos(pts[0]), p1 = pos(pts[i]); const l = dist(p0, p1) || 1;
    return [(p1[0] - p0[0]) / l, (p1[1] - p0[1]) / l];
  };
  const archiDi = (n) => G.nodi[n].archi.filter((id) => vivo[id]).map((id) => G.archi[id]);
  const tratti = [];
  const cammina = (a0, nStart, padre = null) => {
    // un tratto: sequenza di pixel e nodi attraversati
    const pixel = [], nodiAttraversati = [];
    let a = a0, n = nStart;
    while (a && !usato.has(a.id)) {
      usato.add(a.id);
      const pts = a.da === n ? a.pixel : a.pixel.slice().reverse();
      if (pixel.length) pts.shift();
      pixel.push(...pts);
      const altro = a.da === n ? a.a : a.da;
      if (altro < 0 || G.nodi[altro].grado !== 3) break;
      nodiAttraversati.push({ nodo: altro, indice: pixel.length - 1 });
      // continua sull'arco più diritto, se non svolta troppo
      const entrata = uscita(a, altro).map((v) => -v);
      let best = null, bc = Math.cos(Math.PI * 0.42);
      for (const b of archiDi(altro)) {
        if (b.id === a.id || usato.has(b.id)) continue;
        const u = uscita(b, altro), c = u[0] * entrata[0] + u[1] * entrata[1];
        if (c > bc) { bc = c; best = b; }
      }
      a = best; n = altro;
    }
    const t = { id: tratti.length, pixel, nodi: nodiAttraversati, padre };
    tratti.push(t);
    return t;
  };
  // prima dagli estremi, i tratti più spessi per primi
  const estremi = G.nodi.filter((n) => n.grado === 1).sort((a, b) => D[b.membri[0]] - D[a.membri[0]]);
  for (const n of estremi) for (const a of archiDi(n.id)) if (!usato.has(a.id)) cammina(a, n.id);
  // poi i rami: archi non usati che partono da un nodo già attraversato
  let ancora = true;
  while (ancora) {
    ancora = false;
    for (const t of tratti.slice()) for (const { nodo } of t.nodi) for (const a of archiDi(nodo)) {
      if (usato.has(a.id)) continue;
      cammina(a, nodo, t.id); ancora = true;
    }
    for (const a of archiVivi) if (!usato.has(a.id) && !a.chiuso) { cammina(a, a.da >= 0 ? a.da : a.a); ancora = true; }
  }
  for (const a of archiVivi) if (a.chiuso && !usato.has(a.id)) { usato.add(a.id); tratti.push({ id: tratti.length, pixel: a.pixel, nodi: [], padre: null, chiuso: true }); }

  // dai pixel al mondo: unità = pixel dell'immagine originale, y verso l'alto
  const mondo = (p) => { const [x, y] = pos(p); return [(x + 0.5) / scala + rx0, (H0 - ((y + 0.5) / scala + ry0)), 2 * D[p] / scala]; };

  // 7. figure: dischi (macchie tonde), petali, catene
  const elementi = [];
  const { comp: macchie, etich } = componenti(m, W, H, 1);
  const trattiPer = macchie.map(() => []);
  for (const t of tratti) if (t.pixel.length) trattiPer[etich[t.pixel[0]]].push(t);
  const dischi = new Set();
  macchie.forEach((c, id) => {
    let pm = c[0]; for (const p of c) if (D[p] > D[pm]) pm = p;
    const r = D[pm], area = c.length;
    const lung = Math.max(0, ...trattiPer[id].map((t) => t.pixel.length));
    if (area / (Math.PI * r * r) < 1.5 && lung < 2.2 * r) {
      const [x, y] = mondo(pm);
      elementi.push({ tipo: 'disco', pos: [x, y], d: 2 * (r + 0.5) / scala });
      dischi.add(id);
    }
  });
  const pxMondo = 1 / scala;
  const codificati = new Map();
  // vicino ai nodi la distanza dal bordo si gonfia (le forme si fondono):
  // lì lo spessore non si misura, si ricava dai campioni vicini
  const vicinoNodo = new Uint8Array(W * H);
  for (const n of G.nodi) {
    if (n.grado !== 3) continue;
    for (const q of n.membri) {
      const r = Math.ceil(D[q] * 1.6) + 1, qx = q % W, qy = (q - qx) / W;
      for (let y = Math.max(0, qy - r); y <= Math.min(H - 1, qy + r); y++) for (let x = Math.max(0, qx - r); x <= Math.min(W - 1, qx + r); x++) {
        if ((x - qx) ** 2 + (y - qy) ** 2 <= r * r) vicinoNodo[y * W + x] = 1;
      }
    }
  }
  const spessoreAffidabile = (pixel, pts) => {
    const ok = pixel.map((p) => !vicinoNodo[p]);
    const idx = [...ok.keys()].filter((i) => ok[i]);
    if (!idx.length) { const m = mediana(pts.map((p) => p[2])); return pts.map((p) => [p[0], p[1], m * 0.8]); }
    return pts.map((p, i) => {
      if (ok[i]) return p;
      // interpolazione tra il campione buono precedente e il successivo
      let a = -1, b = -1;
      for (let j = i - 1; j >= 0; j--) if (ok[j]) { a = j; break; }
      for (let j = i + 1; j < pts.length; j++) if (ok[j]) { b = j; break; }
      const w = a < 0 ? pts[b][2] : b < 0 ? pts[a][2] : pts[a][2] + (pts[b][2] - pts[a][2]) * (i - a) / (b - a);
      return [p[0], p[1], w];
    });
  };
  for (const t of tratti) {
    if (!t.pixel.length || dischi.has(etich[t.pixel[0]])) continue;
    let pts = liscia(spessoreAffidabile(t.pixel, t.pixel.map(mondo)), (opzioni.sigma ?? 1.2) * scala);
    if (pts.length < 2) continue;
    const L = lunghezza(pts);
    const larghezze = pts.map((p) => p[2]);
    const Wmax = Math.max(...larghezze);
    if (L < 1.2 * pxMondo * 2) continue;
    // un petalo: corto, senza rami, che si allarga verso una delle punte
    const n5 = Math.max(1, Math.floor(pts.length / 5));
    const testa = mediana(larghezze.slice(0, n5)), coda = mediana(larghezze.slice(-n5));
    const libero = !tratti.some((u) => u.padre === t.id) && !t.chiuso;
    // la larghezza deve crescere con regolarità da un capo all'altro
    const s_ = pts.map((_, i) => i), mx = (pts.length - 1) / 2, my = larghezze.reduce((a, b) => a + b, 0) / larghezze.length;
    let sxy = 0, sxx = 0, syy = 0; s_.forEach((i) => { sxy += (i - mx) * (larghezze[i] - my); sxx += (i - mx) ** 2; syy += (larghezze[i] - my) ** 2; });
    const corr = Math.abs(sxy) / Math.sqrt(sxx * syy || 1);
    if (libero && L < 4.5 * Wmax && Wmax < 0.8 * L && corr > 0.75 && Math.max(testa, coda) > 1.8 * Math.min(testa, coda) && Wmax > 1.5 * pxMondo) {
      if (testa > coda) pts = pts.reverse();
      const base = pts[0], dirB = tangente(pts, 0, Math.max(2, Math.floor(pts.length / 4)));
      // la punta tonda sporge di mezza larghezza oltre lo scheletro
      elementi.push({ tipo: 'petalo', pos: [base[0], base[1]], dir: dirB, L: L + Wmax / 2, W: Wmax, b: Math.max(Math.min(testa, coda), 0.5 * pxMondo), curva: svoltaTotale(pts) });
      codificati.set(t.id, { petalo: true });
      continue;
    }
    // una catena: ancoraggi, tangenti, spessore
    const obbligati = new Set();
    const figli = tratti.filter((u) => u.padre === t.id);
    // gli indici dei nodi da cui partono i figli devono essere ancoraggi
    const nodoIdx = new Map(t.nodi.map(({ nodo, indice }) => [nodo, indice]));
    for (const f of figli) {
      const n0 = G.archi.find((a) => usato.has(a.id) && (a.pixel[0] === f.pixel[0] || a.pixel[a.pixel.length - 1] === f.pixel[0]));
      void n0;
    }
    const nodoDelFiglio = (f) => {
      // il nodo da cui parte il figlio: quello di t più vicino al suo primo pixel
      let best = null, bd = Infinity;
      for (const { indice } of t.nodi) { const d = dist(pos(t.pixel[indice]), pos(f.pixel[0])); if (d < bd) { bd = d; best = indice; } }
      return best;
    };
    const attacchi = figli.map((f) => ({ f, i: nodoDelFiglio(f) })).filter((x) => x.i != null);
    for (const { i } of attacchi) obbligati.add(Math.min(pts.length - 1, i));
    void nodoIdx;
    const eps = (opzioni.tolleranza ?? 0.35);
    let idx = douglasPeucker(pts, eps, obbligati);
    // ancoraggi troppo vicini confondono i biarchi: via quelli a meno di 1.5 px, tranne gli obbligati
    idx = idx.filter((i, k) => k === 0 || k === idx.length - 1 || obbligati.has(i) || dist(pts[i], pts[idx[k - 1]]) > 1.5 * pxMondo * scala * 0.5);
    const punti = idx.map((i) => [pts[i][0], pts[i][1]]);
    const tangenti = idx.map((i) => tangente(pts, i, Math.max(2, Math.round(1.5 * scala))));
    const larghezzaInizio = mediana(larghezze.slice(0, n5)), larghezzaFine = mediana(larghezze.slice(-n5));
    const profilo = idx.map((i) => Math.max(pts[i][2], 0.5 * pxMondo));
    codificati.set(t.id, { punti, tangenti, idx, attacchi, larghezzaInizio, larghezzaFine, profilo, chiuso: !!t.chiuso });
  }
  // le catene con i loro rami: i figli diventano rami agganciati all'ancoraggio
  const defCatena = (t) => {
    const c = codificati.get(t.id);
    if (!c || c.petalo) return null;
    const def = {
      punti: c.punti, tangenti: c.tangenti,
      spessore: c.profilo[0], profilo: c.profilo, esponente: 0, cedeSpessore: false,
      fascia: 1.5,
    };
    const rami = [];
    for (const { f, i } of c.attacchi) {
      const sub = defCatena(f);
      if (!sub) continue;
      const da = c.idx.indexOf(i);
      if (da < 0) continue;
      // il ramo parte dall'ancoraggio della madre: il suo primo punto è quello
      rami.push({ da, spessore: sub.spessore, catena: { ...sub, punti: sub.punti.slice(1), tangenti: [sub.tangenti[0], ...sub.tangenti.slice(1)], profilo: sub.profilo } });
    }
    if (rami.length) def.rami = rami;
    return def;
  };
  for (const t of tratti) {
    if (t.padre != null && codificati.get(t.padre) && !codificati.get(t.padre).petalo) continue; // è un ramo
    const def = defCatena(t);
    if (def && def.punti.length >= 2) elementi.push({ tipo: 'catena', def });
  }

    return { elementi, S, D, G, tratti };
  };

  // tutte le passate su una maschera qualunque (della stessa misura): la prima
  // legge i tratti, le altre riempiono il residuo
  function passateSu(mm) {
    const prima = leggi(mm);
    let elementi = prima.elementi;
    const S = Uint8Array.from(prima.S);
    const passate = opzioni.passate ?? 3;
    let residuoTotale = 0;
    for (let n = 1; n < passate; n++) {
      // il residuo: l'inchiostro che la ricostruzione non copre ancora
      const linee = lineeDaTracce(simula(semeDaCodifica({ elementi })));
      const coperto = new Uint8Array(W * H);
      const timbro = (cx, cy, rr) => {
        for (let y = Math.max(0, Math.floor(cy - rr)); y <= Math.min(H - 1, Math.ceil(cy + rr)); y++)
          for (let x = Math.max(0, Math.floor(cx - rr)); x <= Math.min(W - 1, Math.ceil(cx + rr)); x++)
            if ((x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) coperto[y * W + x] = 1;
      };
      const aMaschera = (q) => [(q[0] - rx0) * scala - 0.5, (H0 - q[1] - ry0) * scala - 0.5, (q[2] ?? 0) * scala / 2];
      for (const l of linee) for (let i = 0; i + 1 < l.length; i++) {
        const A = aMaschera(l[i]), B = aMaschera(l[i + 1]);
        const k = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) * 2));
        for (let j = 0; j <= k; j++) { const u = j / k; timbro(A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, Math.max(0.7, A[2] + (B[2] - A[2]) * u)); }
      }
      const r = new Uint8Array(W * H);
      for (let i = 0; i < W * H; i++) r[i] = mm[i] && !coperto[i] ? 1 : 0;
      // via i bordini: restano le macchie abbastanza spesse e abbastanza grandi
      const Dr = distanza(r, W, H);
      for (const c of componenti(r, W, H, 1).comp) {
        let dmax = 0; for (const q of c) dmax = Math.max(dmax, Dr[q]);
        if (dmax < 0.9 * scala || c.length < minArea * 1.5) for (const q of c) r[q] = 0;
      }
      let quanti = 0; for (let i = 0; i < W * H; i++) quanti += r[i];
      if (!quanti) break;
      residuoTotale += quanti;
      if ((opzioni.residuo ?? 'campiture') === 'tratti') {
        const dopo = leggi(r);
        elementi = elementi.concat(dopo.elementi);
        for (let i = 0; i < W * H; i++) if (dopo.S[i]) S[i] = 1;
      } else {
        elementi = elementi.concat(campiture(r));
      }
    }
    return { elementi, S, prima, residuoTotale };
  }
  const tutto = passateSu(m);
  const prima = tutto.prima, S = tutto.S, residuoTotale = tutto.residuoTotale;
  let elementi = tutto.elementi;
  const D = prima.D, G = prima.G, tratti = prima.tratti;

  // il residuo come CAMPITURE: ogni regione spessa diventa un biliardo. Il suo
  // contorno, rientrato di mezza penna, è uno specchio chiuso; i buchi pure;
  // dentro una particella con spessore rimbalza fino a riempirla.
  function campiture(r) {
    const penna = opzioni.penna ?? 0.9; // in pixel originali
    const Dr = distanza(r, W, H);
    const er = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) er[i] = r[i] && Dr[i] >= (penna / 2) * scala ? 1 : 0;
    const out = [];
    const aMondo = (p) => { const x = p % W, y = (p - x) / W; return [(x + 0.5) / scala + rx0, H0 - ((y + 0.5) / scala + ry0)]; };
    for (const c of componenti(er, W, H, 1).comp) {
      if (c.length < 3) continue;
      const set = new Set(c);
      let inizio = c[0], pm = c[0];
      for (const p of c) { if (p < inizio) inizio = p; if (Dr[p] > Dr[pm]) pm = p; }
      const bordo = traccia((p) => set.has(p), W, H, inizio);
      if (bordo.length < 3) continue;
      const poligono = (pix) => {
        const pts = pix.map(aMondo);
        // un poligono chiuso: lo si spezza anche nel punto più lontano dall'inizio,
        // altrimenti la corda di riferimento ha lunghezza zero
        let lontano = 0, dmax = -1;
        pts.forEach((q, i) => { const d = dist(q, pts[0]); if (d > dmax) { dmax = d; lontano = i; } });
        const idx = douglasPeucker(pts.concat([pts[0]]), 0.35, new Set([lontano])).filter((i) => i < pts.length);
        return idx.map((i) => pts[i]);
      };
      const contorno = poligono(bordo);
      if (contorno.length < 3) continue;
      // i buchi: il fondo nel riquadro che non tocca il bordo del riquadro
      let x0 = W, y0 = H, x1 = 0, y1 = 0;
      for (const p of c) { const x = p % W, y = (p - x) / W; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      const bw = x1 - x0 + 3, bh = y1 - y0 + 3, loc = new Uint8Array(bw * bh);
      for (const p of c) { const x = p % W, y = (p - x) / W; loc[(y - y0 + 1) * bw + (x - x0 + 1)] = 1; }
      const fuori = new Uint8Array(bw * bh), coda = [0]; fuori[0] = 1;
      while (coda.length) { const q = coda.pop(), x = q % bw, y = (q - x) / bw; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= bw || yy >= bh) continue; const k = yy * bw + xx; if (!loc[k] && !fuori[k]) { fuori[k] = 1; coda.push(k); } } }
      const buco = new Uint8Array(bw * bh); let ci = false;
      for (let i = 0; i < bw * bh; i++) if (!loc[i] && !fuori[i]) { buco[i] = 1; ci = true; }
      const buchi = [];
      if (ci) for (const h of componenti(buco, bw, bh, 1).comp) {
        if (h.length < 2) continue;
        let s0 = h[0]; for (const p of h) if (p < s0) s0 = p;
        const hs = new Set(h), bordoH = traccia((p) => hs.has(p), bw, bh, s0);
        const glob = bordoH.map((p) => { const x = p % bw, y = (p - x) / bw; return (y + y0 - 1) * W + (x + x0 - 1); });
        if (glob.length >= 3) { const pol = poligono(glob); if (pol.length >= 3) buchi.push(pol); }
      }
      out.push({ tipo: 'campitura', contorno, buchi, spessore: penna, inizio: aMondo(pm), area: c.length / (scala * scala) });
    }
    return out;
  }

  return {
    elementi,
    misure: { larghezza: W0, altezza: H0, ritaglio: rit, scala, colori: { inchiostro: ink, fondo }, tratti: tratti.length, nodi: G.nodi.length, residuo: residuoTotale / (scala * scala) },
    interni: { maschera: m, scheletro: S, distanza: D, W, H, rit, scala },
    // per la lingua: decodificare solo una parte (il dominio fondamentale di una figura)
    decodificaMaschera: (mm) => passateSu(mm).elementi,
  };
}

// ---------- dalla codifica al seme
// ogni elemento diventa lo stato fisico che lo genera, nel proprio piano
export function semeDaCodifica(codifica, opzioni = {}) {
  const v = opzioni.v ?? 10;
  const conf = { G: 1, limiti: [-1e5, -1e5, 1e5, 1e5], blocchi: [], masse: [], campi: [], interfacce: [], regole: [], emettitori: [], piani: {} };
  const aggiungi = (part, M, prefisso, tipo) => {
    const t = trasformaPartitura(part, M, prefisso);
    for (const k of ['blocchi', 'masse', 'campi', 'interfacce', 'regole', 'emettitori']) conf[k].push(...t[k]);
    conf.piani[prefisso] = { ruolo: tipo };
  };
  codifica.elementi.forEach((e, n) => {
    const prefisso = `e${n}`;
    if (e.tipo === 'catena') {
      aggiungi(catena({ ...e.def, v, precisione: opzioni.precisione ?? 0.01 }), [1, 0, 0, 1, 0, 0], prefisso, 'catena');
    } else if (e.tipo === 'petalo') {
      // il petalo nasce lungo +y: lo si ruota sulla sua direzione e lo si porta alla base
      const a = Math.atan2(e.dir[1], e.dir[0]) - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      aggiungi(MOTIVI.petalo({ L: e.L, W: e.W, b: e.b, curva: e.curva }), [c, s, -s, c, e.pos[0], e.pos[1]], prefisso, 'petalo');
    } else if (e.tipo === 'disco') {
      aggiungi(MOTIVI.disco({ d: e.d }), [1, 0, 0, 1, e.pos[0], e.pos[1]], prefisso, 'disco');
    } else if (e.tipo === 'campitura') {
      aggiungi(MOTIVI.campitura({ contorno: e.contorno, buchi: e.buchi, spessore: e.spessore, inizio: e.inizio }), [1, 0, 0, 1, 0, 0], prefisso, 'campitura');
    }
  });
  return conf;
}

// ---------- quanto somiglia: si rasterizzano le linee con il loro spessore
export function rasterizza(linee, W, H, scala = 1) {
  // linee nel mondo (y verso l'alto, altezza H in unità del mondo); maschera W·scala × H·scala
  const Ws = Math.round(W * scala), Hs = Math.round(H * scala), m = new Uint8Array(Ws * Hs);
  const timbro = (x, y, r) => {
    const cx = x * scala, cy = (H - y) * scala, rr = Math.max(r * scala, 0.5);
    for (let yy = Math.floor(cy - rr); yy <= Math.ceil(cy + rr); yy++) for (let xx = Math.floor(cx - rr); xx <= Math.ceil(cx + rr); xx++) {
      if (xx < 0 || yy < 0 || xx >= Ws || yy >= Hs) continue;
      if ((xx + 0.5 - cx) ** 2 + (yy + 0.5 - cy) ** 2 <= rr * rr) m[yy * Ws + xx] = 1;
    }
  };
  for (const l of linee) for (let i = 0; i < l.length; i++) {
    const a = l[i], b = l[Math.min(i + 1, l.length - 1)];
    const n = Math.max(1, Math.ceil(dist(a, b) * scala * 2));
    for (let k = 0; k < n; k++) { const u = k / n; timbro(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, ((a[2] ?? 0) * (1 - u) + (b[2] ?? 0) * u) / 2); }
  }
  return { m, W: Ws, H: Hs };
}
export function somiglianza(a, b) {
  let inter = 0, ua = 0, ub = 0;
  for (let i = 0; i < a.length; i++) { if (a[i] && b[i]) inter++; if (a[i]) ua++; if (b[i]) ub++; }
  return { iou: inter / Math.max(1, ua + ub - inter), richiamo: inter / Math.max(1, ua), precisione: inter / Math.max(1, ub) };
}
// la maschera d'inchiostro alla risoluzione originale, sull'intera immagine
export function mascheraOriginale(ris) {
  const { maschera, W, H, rit, scala } = ris.interni;
  const W0 = ris.misure.larghezza, H0 = ris.misure.altezza, m = new Uint8Array(W0 * H0);
  for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
    const X = Math.floor((x - rit[0] + 0.5) * scala), Y = Math.floor((y - rit[1] + 0.5) * scala);
    if (X >= 0 && Y >= 0 && X < W && Y < H) m[y * W0 + x] = maschera[Y * W + X];
  }
  return m;
}
