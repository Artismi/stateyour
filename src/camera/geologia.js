// geologia.js — l'interno e la superficie di un pianeta, che emergono da massa, composizione ed età.
//
// INTERNO. Un pianeta giovane è caldo e fuso: il ferro, pesante, scende e fa il
// nucleo; la roccia resta sopra (mantello); in cima si separa una crosta leggera.
// Le proporzioni vengono dalla composizione. Il calore che esce dall'interno è
// quello del decadimento radioattivo (uranio, torio, potassio: tanti più quanto
// più la stella era ricca di metalli), che cala con l'età.
// LA DINAMO. Il campo magnetico nasce solo se il nucleo è ancora liquido e il
// calore lo rimescola: un pianeta piccolo o vecchio si raffredda, il nucleo si
// ferma e il campo sparisce (Marte). La forza segue la legge di scala delle dinamo
// (Christensen): B ∝ ρ^(1/6)·(flusso)^(1/3), poi cala come (R_nucleo/R)³ fino in
// superficie. Tarata sulla Terra.
// TETTONICA. Se il mantello è abbastanza caldo da spingere e la crosta abbastanza
// debole da rompersi (l'acqua la indebolisce), la crosta si spezza in placche; se
// no resta un coperchio unico. Dove le placche si scontrano si alzano montagne,
// dove si separano si aprono dorsali e vulcani.
// SUPERFICIE. Il rilievo nasce dalle placche; l'acqua che il pianeta ha riempie
// i punti più bassi (mari e laghi emergono da quanta acqua c'è); dove piove l'acqua
// scende lungo la pendenza più ripida e si raccoglie: i fiumi e le loro valli.

const TERRA = { M: 5.97e24, R: 6.371e6, q: 0.087, Rc: 3.48e6, rhoC: 11000 };

export function interno(P, stella) {
  if (P.tipo === 'gassoso') {
    // nei giganti la dinamo è nell'idrogeno metallico: cresce con la massa (Giove ~ 4·10⁻⁴ T)
    const B0 = 4.2e-4 * Math.pow(P.massaKg / 1.9e27, 0.6);
    return { nucleo: 0.1, mantello: 'idrogeno metallico', crosta: 0, q: 5, dinamo: true, B0, tettonica: 'nessuna (è un gas)', vulcani: 0 };
  }
  const ferro = P.composizione.ferro ?? 0.1, eta = stella?.eta ?? (stella?.morta != null ? 5e9 : 4.5e9), Z = stella?.Z ?? 1;
  const M = P.massaKg, R = P.raggioM, rhoMedia = M / ((4 / 3) * Math.PI * R ** 3);
  const Rc = R * Math.cbrt((ferro * rhoMedia) / TERRA.rhoC);
  // il calore: radioattività (più metalli, più calore) che cala con l'età, più il calore iniziale che resta
  const q = TERRA.q * (M / TERRA.M) / (R / TERRA.R) ** 2 * Math.sqrt(Math.max(0.05, Z)) * Math.exp(-(eta - 4.5e9) / 3e9) * Math.pow(M / TERRA.M, 0.3);
  // il nucleo resta liquido se il pianeta è abbastanza grande da non essersi raffreddato (tempo ∝ R²)
  const nucleoLiquido = q > 0.025 && R > 3.5e6;
  const B0 = nucleoLiquido ? 3.1e-5 * Math.pow(q / TERRA.q, 1 / 3) * Math.pow((Rc / R) / (TERRA.Rc / TERRA.R), 3) * Math.pow(Rc / TERRA.Rc, 0.5) : 1e-9;
  const acqua = (P.composizione.acqua ?? 0) > 0.005 || P.tipo === 'ghiacciato';
  const tettonica = q > 0.05 && acqua && M > 0.3 * TERRA.M ? 'a placche' : q > 0.02 ? 'coperchio unico, con vulcani' : 'ferma';
  return { nucleo: Rc / R, crosta: Math.min(0.02, 0.004 * Math.pow(q / TERRA.q, 0.5)), q, dinamo: nucleoLiquido, B0, tettonica, vulcani: q > 0.02 ? Math.round(q / 0.02) : 0 };
}

// ---------- la superficie: una mappa equirettangolare (longitudine × latitudine) di quote in metri
const memo = new Map();
export function superficiePianeta(chiave, P, int, seme, { W = 256, H = 128 } = {}) {
  if (memo.has(chiave)) return memo.get(chiave);
  let s = seme % 2147483647 || 1; const caso = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const sfera = (i, j) => { const lon = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, lat = Math.PI / 2 - ((j + 0.5) / H) * Math.PI; return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)]; };
  const casuale = () => { const z = 2 * caso() - 1, a = caso() * 2 * Math.PI, r = Math.sqrt(1 - z * z); return [r * Math.cos(a), r * Math.sin(a), z]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // le placche: tante quante le celle di convezione del mantello (più il mantello è sottile rispetto al pianeta, più sono)
  const placche = int.tettonica === 'a placche' ? 6 + Math.floor(caso() * 9) : 1;
  const centri = Array.from({ length: placche }, () => ({ c: casuale(), polo: casuale(), v: (0.5 + caso()) * (int.q / 0.087), continente: caso() < 0.4 }));
  const alt = new Float32Array(W * H), quale = new Int16Array(W * H);
  // un rumore liscio (somma di onde sulla sfera) per le irregolarità del terreno
  const onde = Array.from({ length: 24 }, (_, k) => ({ d: casuale(), f: 2 + k * 0.7, fi: caso() * 6.28, a: 1 / (1 + k * 0.35) }));
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const p = sfera(i, j); let b = -1, d1 = -2, d2 = -2, b2 = -1;
    centri.forEach((c, k) => { const d = dot(p, c.c); if (d > d1) { d2 = d1; b2 = b; d1 = d; b = k; } else if (d > d2) { d2 = d; b2 = k; } });
    quale[j * W + i] = b;
    let h = centri[b].continente ? 400 : -3800;
    if (b2 >= 0 && placche > 1) {
      // il moto relativo delle due placche al confine: convergono (montagne) o divergono (dorsali)
      const va = cross(centri[b].polo, p).map((x) => x * centri[b].v), vb = cross(centri[b2].polo, p).map((x) => x * centri[b2].v), n = centri[b2].c.map((x, k) => x - centri[b].c[k]);
      const conv = dot(va.map((x, k) => x - vb[k]), n), vicino = Math.exp(-(d1 - d2) * 60);
      h += vicino * (conv > 0 ? 3500 * Math.min(1.5, conv) * (centri[b].continente || centri[b2].continente ? 1 : 0.6) : 1800 * Math.min(1, -conv));
    }
    let r = 0; for (const o of onde) r += o.a * Math.sin(o.f * dot(p, o.d) * 3 + o.fi); h += r * 260;
    alt[j * W + i] = h;
  }
  // i vulcani: sopra i pennacchi caldi del mantello e lungo i confini che si aprono
  const vulcani = [];
  for (let k = 0; k < int.vulcani; k++) { const p = casuale(), lat = Math.asin(p[2]), lon = Math.atan2(p[1], p[0]); const i = Math.floor(((lon + Math.PI) / (2 * Math.PI)) * W) % W, j = Math.min(H - 1, Math.floor(((Math.PI / 2 - lat) / Math.PI) * H)); vulcani.push([i, j]); for (let dj = -3; dj <= 3; dj++) for (let di = -3; di <= 3; di++) { const jj = j + dj, ii = (i + di + W) % W; if (jj >= 0 && jj < H) alt[jj * W + ii] += 2500 * Math.exp(-(di * di + dj * dj) / 3); } }
  // il mare: l'acqua del pianeta riempie i punti più bassi (si cerca il livello che contiene quel volume)
  const area = (j) => Math.cos(Math.PI / 2 - ((j + 0.5) / H) * Math.PI) * (2 * Math.PI * P.raggioM ** 2 * (Math.PI / H)) / W;
  const volumeAcqua = int.acquaKg / 1000 || 0;
  let lo = -12000, hi = 12000;
  for (let it = 0; it < 40; it++) { const m = (lo + hi) / 2; let v = 0; for (let j = 0; j < H; j++) { const A = area(j); for (let i = 0; i < W; i++) { const h = alt[j * W + i]; if (h < m) v += (m - h) * A; } } if (v > volumeAcqua) hi = m; else lo = m; }
  const mare = volumeAcqua > 0 ? lo : -Infinity;
  // i fiumi: la pioggia scende lungo la pendenza più ripida; dove se ne raccoglie molta c'è un fiume
  const flusso = new Float32Array(W * H).fill(1), ordine = [...alt.keys()].sort((a, b) => alt[b] - alt[a]), giu = new Int32Array(W * H).fill(-1);
  for (const k of ordine) {
    const i = k % W, j = (k - i) / W; let best = -1, bh = alt[k];
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const jj = j + dj; if (jj < 0 || jj >= H || (!di && !dj)) continue; const kk = jj * W + ((i + di + W) % W); if (alt[kk] < bh) { bh = alt[kk]; best = kk; } }
    giu[k] = best; if (best >= 0 && alt[k] > mare) flusso[best] += flusso[k];
  }
  const out = { W, H, alt, mare, flusso, vulcani, placche, quale };
  memo.set(chiave, out); if (memo.size > 6) memo.delete(memo.keys().next().value);
  return out;
}

// i colori: profondità del mare, terre secondo quota e temperatura, ghiaccio dove fa freddo, fiumi
export function immagineSuperficie(sf, T) {
  const { W, H, alt, mare, flusso } = sf, px = new Uint8ClampedArray(W * H * 4);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, h = alt[k], lat = Math.abs(90 - ((j + 0.5) / H) * 180), Tloc = T - 0.45 * lat * (T > 200 ? 1 : 0.3) - Math.max(0, h) * 0.0065;
    let c;
    if (h < mare) { const d = Math.min(1, (mare - h) / 5000); c = Tloc < 271 ? [220, 232, 240] : [20 + 30 * (1 - d), 60 + 60 * (1 - d), 110 + 80 * (1 - d)]; }
    else if (Tloc < 263) c = [235, 238, 242];
    else { const e = Math.min(1, (h - Math.max(0, mare)) / 4000); c = Tloc > 320 ? [190 - 40 * e, 150 - 40 * e, 100 - 20 * e] : [70 + 120 * e, 110 + 60 * e - 30 * e * e, 60 + 70 * e]; if (flusso[k] > 60 && h >= mare) c = [60, 110, 170]; }
    px.set([c[0], c[1], c[2], 255], k * 4);
  }
  for (const [i, j] of sf.vulcani) px.set([200, 60, 30, 255], (j * W + i) * 4);
  return px;
}
