// preparazione.js — da un'immagine qualunque a una tavola pulita.
//
// La decodifica legge bene l'inchiostro su un fondo uniforme. Le immagini vere
// non lo sono: fotografie con ombre e vignettature, carta ingiallita, rumore,
// motivi chiari su fondo scuro, motivi che si distinguono dal fondo solo per il
// colore. La preparazione le riporta tutte alla stessa forma:
//
//   1. il fondo     il colore più diffuso (k-medie su quattro gruppi)
//   2. la luce      in ogni zona dell'immagine si misura il colore del fondo
//                   lì; dividendo per quello, ombre e dominanti spariscono
//   3. diversità    ogni pixel vale quanto si allontana dal fondo, in
//                   luminosità o in colore: il disegno è ciò che non è fondo,
//                   chiaro o scuro che sia
//   4. soglia       Otsu sull'istogramma della diversità, dopo una lieve
//                   sfocatura che toglie il rumore
//   5. pulizia      via le briciole e i buchini
//
// Il risultato è un'immagine a due toni (inchiostro nero, fondo bianco) della
// stessa misura, pronta per la decodifica.

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

function kmedie(campioni, k) {
  const ord = campioni.slice().sort((a, b) => lum(...a) - lum(...b));
  let centri = Array.from({ length: k }, (_, j) => ord[Math.floor(((j + 0.5) / k) * (ord.length - 1))].slice());
  let conta = new Array(k).fill(0);
  for (let it = 0; it < 20; it++) {
    const s = centri.map(() => [0, 0, 0]); conta = new Array(k).fill(0);
    for (const p of campioni) {
      let best = 0, bd = Infinity;
      for (let j = 0; j < k; j++) { const c = centri[j], d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; best = j; } }
      s[best][0] += p[0]; s[best][1] += p[1]; s[best][2] += p[2]; conta[best]++;
    }
    centri = centri.map((c, j) => (conta[j] ? s[j].map((v) => v / conta[j]) : c));
  }
  return { centri, conta };
}
function campiona(img, quanti = 20000) {
  const { larghezza: W, altezza: H, canali: C, dati } = img, out = [], passo = Math.max(1, Math.floor((W * H) / quanti));
  for (let i = 0; i < W * H; i += passo) out.push([dati[i * C], dati[i * C + 1], dati[i * C + 2]]);
  return out;
}

// serve prepararla? sì se è sporca (molti colori lontani dai tre principali),
// se la luce non è uniforme, o se il fondo è più scuro del disegno
export function serve(img) {
  const pts = campiona(img, 12000), { centri, conta } = kmedie(pts, 3);
  let r2 = 0;
  for (const p of pts) { let bd = Infinity; for (const c of centri) bd = Math.min(bd, (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2); r2 += bd; }
  const residuo = Math.sqrt(r2 / pts.length);
  // il fondo e il disegno, guardando il centro dell'immagine (i bordi sono spesso cornice)
  const { larghezza: W0, altezza: H0, canali: C0, dati: d0 } = img, centro = [];
  for (let y = Math.floor(H0 * 0.25); y < H0 * 0.75; y += 3) for (let x = Math.floor(W0 * 0.25); x < W0 * 0.75; x += 3) { const i = (y * W0 + x) * C0; centro.push([d0[i], d0[i + 1], d0[i + 2]]); }
  const km = kmedie(centro.length > 50 ? centro : pts, 3), iF = km.conta.indexOf(Math.max(...km.conta)), f0 = km.centri[iF];
  let iD = -1, dd = -1; km.centri.forEach((c, j) => { if (j === iF || km.conta[j] < centro.length * 0.02) return; const d = Math.hypot(c[0] - f0[0], c[1] - f0[1], c[2] - f0[2]); if (d > dd) { dd = d; iD = j; } });
  const disegno = iD >= 0 ? km.centri[iD] : f0;
  const fondoScuro = lum(...disegno) > lum(...f0) + 10;
  const soloColore = dd > 40 && Math.abs(lum(...disegno) - lum(...f0)) < 0.35 * dd;
  // la luce: la luminanza del fondo nei quattro quarti
  const { larghezza: W, altezza: H, canali: C, dati } = img, f = f0, quarti = [[0, 0], [0, 0], [0, 0], [0, 0]];
  for (let y = 0; y < H; y += 3) for (let x = 0; x < W; x += 3) {
    const i = (y * W + x) * C, d = (dati[i] - f[0]) ** 2 + (dati[i + 1] - f[1]) ** 2 + (dati[i + 2] - f[2]) ** 2;
    if (d > 40 * 40) continue;
    const q = (y < H / 2 ? 0 : 2) + (x < W / 2 ? 0 : 1); quarti[q][0] += lum(dati[i], dati[i + 1], dati[i + 2]); quarti[q][1]++;
  }
  const medie = quarti.filter((q) => q[1] > 20).map((q) => q[0] / q[1]);
  const luce = medie.length > 1 ? (Math.max(...medie) - Math.min(...medie)) / Math.max(1, Math.max(...medie)) : 0;
  const motivi = [];
  if (residuo > 30) motivi.push(`immagine sporca o sfumata (scarto ${residuo.toFixed(0)})`);
  if (luce > 0.1) motivi.push(`luce non uniforme (${Math.round(luce * 100)}%)`);
  if (fondoScuro) motivi.push('il disegno è più chiaro del fondo');
  if (soloColore) motivi.push('il disegno si distingue dal fondo solo per il colore');
  return { serve: motivi.length > 0, motivi, residuo, luce, fondoScuro, soloColore };
}

// una sfocatura a scatola, separabile, ripetuta: quasi gaussiana
function sfoca(a, W, H, r, volte = 2) {
  let src = a, tmp = new Float32Array(W * H), dst = new Float32Array(W * H);
  for (let v = 0; v < volte; v++) {
    for (let y = 0; y < H; y++) { let s = 0, n = 0; for (let x = -r; x <= r; x++) if (x >= 0 && x < W) { s += src[y * W + x]; n++; } for (let x = 0; x < W; x++) { tmp[y * W + x] = s / n; const xo = x - r, xi = x + r + 1; if (xo >= 0) { s -= src[y * W + xo]; n--; } if (xi < W) { s += src[y * W + xi]; n++; } } }
    for (let x = 0; x < W; x++) { let s = 0, n = 0; for (let y = -r; y <= r; y++) if (y >= 0 && y < H) { s += tmp[y * W + x]; n++; } for (let y = 0; y < H; y++) { dst[y * W + x] = s / n; const yo = y - r, yi = y + r + 1; if (yo >= 0) { s -= tmp[yo * W + x]; n--; } if (yi < H) { s += tmp[yi * W + x]; n++; } } }
    src = dst; dst = v + 1 < volte ? new Float32Array(W * H) : dst;
  }
  return src;
}
// mediano 3×3
function mediano(a, W, H) {
  const out = new Float32Array(W * H), v = new Float32Array(9);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.min(W - 1, Math.max(0, x + dx)), yy = Math.min(H - 1, Math.max(0, y + dy)); v[n++] = a[yy * W + xx]; }
    for (let i = 1; i < 9; i++) { const t = v[i]; let j = i - 1; while (j >= 0 && v[j] > t) { v[j + 1] = v[j]; j--; } v[j + 1] = t; }
    out[y * W + x] = v[4];
  }
  return out;
}
function otsu(v, max) {
  const B = 256, h = new Float64Array(B);
  for (const x of v) h[Math.min(B - 1, Math.floor((x / max) * (B - 1)))]++;
  let tot = 0, sum = 0; for (let i = 0; i < B; i++) { tot += h[i]; sum += i * h[i]; }
  let wb = 0, sb = 0, best = 0, soglia = B / 2, mB = 0, mA = B - 1;
  for (let i = 0; i < B; i++) {
    wb += h[i]; if (!wb) continue; const wf = tot - wb; if (!wf) break;
    sb += i * h[i]; const mb = sb / wb, mf = (sum - sb) / wf, s = wb * wf * (mb - mf) ** 2;
    if (s > best) { best = s; soglia = i + 0.5; mB = mb; mA = mf; }
  }
  const k = max / (B - 1);
  return { soglia: soglia * k, mediaBassa: mB * k, mediaAlta: mA * k };
}
function componenti(m, W, H, valore) {
  const etich = new Int32Array(W * H).fill(-1), comp = [];
  for (let s = 0; s < W * H; s++) {
    if (m[s] !== valore || etich[s] >= 0) continue;
    const c = [s], id = comp.length; etich[s] = id;
    for (let k = 0; k < c.length; k++) {
      const p = c[k], x = p % W, y = (p - x) / W;
      if (x > 0 && m[p - 1] === valore && etich[p - 1] < 0) { etich[p - 1] = id; c.push(p - 1); }
      if (x < W - 1 && m[p + 1] === valore && etich[p + 1] < 0) { etich[p + 1] = id; c.push(p + 1); }
      if (y > 0 && m[p - W] === valore && etich[p - W] < 0) { etich[p - W] = id; c.push(p - W); }
      if (y < H - 1 && m[p + W] === valore && etich[p + W] < 0) { etich[p + W] = id; c.push(p + W); }
    }
    comp.push(c);
  }
  return comp;
}

export function prepara(img, opzioni = {}) {
  const { larghezza: W, altezza: H, canali: C, dati } = img, N = W * H;
  const croma = (c) => { const t = c[0] + c[1] + c[2] + 30; return [(c[0] + 10) / t, (c[1] + 10) / t]; };
  const dCroma = (a, b) => { const x = croma(a), y = croma(b); return Math.hypot(x[0] - y[0], x[1] - y[1]); };
  // 1–2. il fondo zona per zona: in ogni zona i due colori principali; il fondo
  // è il più diffuso, a meno che l'altro non abbia la tinta del fondo comune
  // (l'ombra cambia la luce, non la tinta)
  const lato = Math.max(10, Math.round(Math.max(W, H) / (opzioni.zone ?? 20)));
  const BW = Math.ceil(W / lato), BH = Math.ceil(H / lato), zone = [];
  for (let by = 0; by < BH; by++) for (let bx = 0; bx < BW; bx++) {
    const pts = [];
    for (let y = by * lato; y < Math.min(H, (by + 1) * lato); y += 2) for (let x = bx * lato; x < Math.min(W, (bx + 1) * lato); x += 2) { const i = (y * W + x) * C; pts.push([dati[i], dati[i + 1], dati[i + 2]]); }
    const { centri, conta } = kmedie(pts, 2);
    zone.push({ centri, conta });
  }
  const mediana3 = (lista) => [0, 1, 2].map((k) => { const v = lista.map((c) => c[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; });
  const maggiori = zone.map((z) => z.centri[z.conta[0] >= z.conta[1] ? 0 : 1]);
  const fondo = mediana3(maggiori);
  let bg = zone.map((z) => {
    const [a, b] = z.conta[0] >= z.conta[1] ? [z.centri[0], z.centri[1]] : [z.centri[1], z.centri[0]];
    // la minoranza ha la tinta del fondo e la maggioranza no: è una zona fitta di disegno
    if (dCroma(a, fondo) > 0.04 && dCroma(b, fondo) < dCroma(a, fondo) * 0.5) return b;
    return a;
  });
  // via le zone strane: mediana 3×3 tra le vicine
  bg = bg.map((_, k) => { const bx = k % BW, by = (k - bx) / BW, v = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = bx + dx, y = by + dy; if (x >= 0 && y >= 0 && x < BW && y < BH) v.push(bg[y * BW + x]); } return mediana3(v); });
  const fondoIn = (x, y) => {
    const fx = Math.min(BW - 1, Math.max(0, x / lato - 0.5)), fy = Math.min(BH - 1, Math.max(0, y / lato - 0.5));
    const x0 = Math.floor(fx), y0 = Math.floor(fy), x1 = Math.min(BW - 1, x0 + 1), y1 = Math.min(BH - 1, y0 + 1), ax = fx - x0, ay = fy - y0;
    const a = bg[y0 * BW + x0], b = bg[y0 * BW + x1], c = bg[y1 * BW + x0], d = bg[y1 * BW + x1];
    return [0, 1, 2].map((k) => a[k] * (1 - ax) * (1 - ay) + b[k] * ax * (1 - ay) + c[k] * (1 - ax) * ay + d[k] * ax * ay);
  };
  // 3. la diversità dal fondo, a luce pareggiata
  const div = new Float32Array(N);
  let max = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * C, f = fondoIn(x, y);
    const r = (dati[i] * fondo[0]) / Math.max(8, f[0]), g = (dati[i + 1] * fondo[1]) / Math.max(8, f[1]), b = (dati[i + 2] * fondo[2]) / Math.max(8, f[2]);
    const d = Math.sqrt((r - fondo[0]) ** 2 + (g - fondo[1]) ** 2 + (b - fondo[2]) ** 2);
    div[y * W + x] = d; if (d > max) max = d;
  }
  // il rumore: quanto varia il fondo pareggiato (mediana delle diversità basse)
  const camp = []; for (let i = 0; i < N; i += 7) camp.push(div[i]); camp.sort((a, b) => a - b);
  const rumore = camp[Math.floor(camp.length * 0.3)];
  // 4. contro il rumore: il mediano (toglie i puntini, rispetta i bordi delle
  // linee sottili), poi una sfocatura minima
  let liscia = mediano(div, W, H);
  if (rumore > 12) liscia = mediano(liscia, W, H);
  liscia = sfoca(liscia, W, H, opzioni.sfocatura ?? 1, 1);
  // il campo: righe e colonne in cui il fondo è almeno un terzo (fuori c'è la cornice)
  const quasiFondo = (i) => liscia[i] < Math.max(25, rumore * 2.5);
  const col = new Float64Array(W), riga = new Float64Array(H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (quasiFondo(y * W + x)) { col[x]++; riga[y]++; }
  const xs = [...col.keys()].filter((x) => col[x] > H * 0.33), ys = [...riga.keys()].filter((y) => riga[y] > W * 0.33);
  let rit = [0, 0, W, H];
  if (opzioni.ritaglio !== false && xs.length > W * 0.3 && ys.length > H * 0.3) rit = [xs[0], ys[0], xs[xs.length - 1] + 1, ys[ys.length - 1] + 1];
  // la soglia: Otsu dentro il campo, poi un po' più vicina al fondo (le linee sottili sono sfocate)
  const dentro = []; for (let y = rit[1]; y < rit[3]; y++) for (let x = rit[0]; x < rit[2]; x++) dentro.push(liscia[y * W + x]);
  const { soglia: so, mediaBassa, mediaAlta } = otsu(dentro, max);
  const soglia = opzioni.soglia ?? Math.min(so, mediaBassa + (opzioni.verso ?? (rumore > 12 ? 0.5 : 0.42)) * (mediaAlta - mediaBassa));
  const m = new Uint8Array(N);
  for (let y = rit[1]; y < rit[3]; y++) for (let x = rit[0]; x < rit[2]; x++) { const i = y * W + x; m[i] = liscia[i] > soglia ? 1 : 0; }
  // 5. via le briciole e i buchini
  const minArea = opzioni.minArea ?? Math.max(4, Math.round(N * 2e-5));
  for (const c of componenti(m, W, H, 1)) if (c.length < minArea) for (const p of c) m[p] = 0;
  for (const c of componenti(m, W, H, 0)) if (c.length < minArea / 2) for (const p of c) m[p] = 1;
  const out = new Uint8ClampedArray(N * 4);
  let inch = 0;
  for (let i = 0; i < N; i++) { const v = m[i] ? 0 : 255; inch += m[i]; out[i * 4] = out[i * 4 + 1] = out[i * 4 + 2] = v; out[i * 4 + 3] = 255; }
  return { img: { larghezza: W, altezza: H, canali: 4, dati: out }, maschera: m, soglia, fondo, rumore, ritaglio: rit, inchiostro: inch / N };
}
