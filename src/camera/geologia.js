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
export function immagineSuperficie(sf, T, cl = null) {
  const { W, H, alt, mare, flusso } = sf, px = new Uint8ClampedArray(W * H * 4);
  // il clima (a risoluzione più bassa) interpolato dolcemente sulla mappa
  const campo = (arr, i, j) => { if (!cl) return null; const x = ((i + 0.5) / W) * cl.W - 0.5, y = Math.min(cl.H - 1.001, Math.max(0, ((j + 0.5) / H) * cl.H - 0.5)), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, a = (xx, yy) => arr[yy * cl.W + ((xx % cl.W) + cl.W) % cl.W]; return a(x0, y0) * (1 - u) * (1 - v) + a(x0 + 1, y0) * u * (1 - v) + a(x0, y0 + 1) * (1 - u) * v + a(x0 + 1, y0 + 1) * u * v; };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, h = alt[k], lat = Math.abs(90 - ((j + 0.5) / H) * 180);
    const Tloc = cl ? campo(cl.media, i, j) : T - 0.45 * lat - Math.max(0, h) * 0.0065, gelo = cl ? Math.min(1, Math.max(0, campo(cl.freddo, i, j))) : Tloc < 265 ? 1 : 0;
    let c;
    if (h < mare) { const d = Math.min(1, (mare - h) / 5000); c = [20 + 30 * (1 - d), 60 + 60 * (1 - d), 110 + 80 * (1 - d)]; }
    else { const e = Math.min(1, (h - Math.max(0, mare)) / 4000); c = Tloc > 310 ? [190 - 40 * e, 150 - 40 * e, 100 - 20 * e] : [70 + 120 * e, 110 + 60 * e - 30 * e * e, 60 + 70 * e]; if (flusso[k] > 60 && gelo < 0.5) c = [60, 110, 170]; }
    // il ghiaccio copre in proporzione a quanta parte dell'anno quel punto passa sotto lo zero: bordi sfumati
    const g = Math.pow(gelo, 0.7), ice = [232, 238, 244];
    px.set([c[0] + (ice[0] - c[0]) * g, c[1] + (ice[1] - c[1]) * g, c[2] + (ice[2] - c[2]) * g, 255], k * 4);
  }
  for (const [i, j] of sf.vulcani) px.set([200, 60, 30, 255], (j * W + i) * 4);
  return px;
}

// ---------- IL CLIMA come equilibrio di energia che evolve nel tempo (modello di Budyko-Sellers, su una
// griglia sulla sfera). In ogni punto: C·∂T/∂t = luce assorbita − luce irradiata + calore portato dai vicini.
//   · la luce: quella della stella a quella latitudine e in quella stagione (l'asse è inclinato); se il
//     pianeta è bloccato, sempre la stessa faccia al sole e mai le stagioni;
//   · irradiata: σT⁴, trattenuta dall'effetto serra della sua atmosfera;
//   · il ghiaccio riflette più luce dell'acqua e della roccia: dove fa freddo si raffredda ancora (il
//     ghiaccio si fa avanzare da sé); il mare si scalda e si raffredda lentamente, la terra in fretta;
//   · il calore scorre dal caldo al freddo, tanto più quanto più l'atmosfera è densa.
// Si parte caldo, come un pianeta appena nato, e si lascia evolvere per molti anni: quello che resta è il suo clima
// (se il ghiaccio, riflettendo, prende il sopravvento, il pianeta scivola in una glaciazione totale).
const memoClima = new Map();
export function climaSuperficie(chiave, P, sf, { W = 64, H = 32, anni = 14, passiAnno = 240 } = {}) {
  if (memoClima.has(chiave)) return memoClima.get(chiave);
  const sigma = 5.67e-8, S0 = P.Lw / (4 * Math.PI * P.aM * P.aM), tau = isFinite(P.clima.pressione) ? 0.8 * Math.pow(P.clima.pressione / 1e5, 0.6) : 2;
  const D = isFinite(P.clima.pressione) ? 0.6 * Math.pow(Math.max(1e-4, P.clima.pressione / 1e5), 0.5) : 1, kx = sf.W / W, ky = sf.H / H;
  const terra = new Uint8Array(W * H), quota = new Float32Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let h = 0; for (let b = 0; b < ky; b++) for (let a = 0; a < kx; a++) h += sf.alt[(j * ky + b) * sf.W + i * kx + a]; h /= kx * ky; quota[j * W + i] = h; terra[j * W + i] = h >= sf.mare ? 1 : 0; }
  const lat = (j) => Math.PI / 2 - ((j + 0.5) / H) * Math.PI, dphi = Math.PI / H, dlam = (2 * Math.PI) / W;
  // un pianeta nasce caldo (gli urti che l'hanno formato) e si raffredda: si parte da lì, non dal freddo
  const T = new Float32Array(W * H).fill(Math.max(P.clima.Teq, 310)), nuovo = new Float32Array(W * H), freddo = new Float32Array(W * H), media = new Float32Array(W * H);
  const C = (k) => (terra[k] ? 1e7 : 1e8), anno = P.anno, dt = anno / passiAnno, eps = (P.obliquita * Math.PI) / 180;
  // il ghiaccio ha bisogno di acqua: su un pianeta senza mari al freddo resta solo un po' di brina;
  // dove c'è acqua che evapora e un'atmosfera che la tiene si formano le nuvole, che riflettono la luce
  let mareFraz = 0; for (let k = 0; k < W * H; k++) mareFraz += 1 - terra[k]; mareFraz /= W * H;
  const acquaPerGhiaccio = Math.min(1, 0.15 + 2.5 * mareFraz), nuvole = mareFraz > 0.02 && isFinite(P.clima.pressione) && P.clima.pressione > 1e4 ? 0.5 * Math.min(1, mareFraz * 2 + 0.3) : 0;
  const albedo = (k, t) => { const ghiaccio = acquaPerGhiaccio * 0.5 * (1 - Math.tanh((t - (terra[k] ? 268 : 266)) / 4)), suolo = ghiaccio * 0.62 + (1 - ghiaccio) * (terra[k] ? 0.25 : 0.08), caldo = t > 268 ? nuvole : nuvole * 0.4; return suolo + caldo * 0.55 * (1 - suolo); };
  const luce = (j, i, f) => {
    const ph = lat(j);
    if (P.bloccato) { const lon = ((i + 0.5) / W) * 2 * Math.PI - Math.PI, cz = Math.cos(ph) * Math.cos(lon); return S0 * Math.max(0, cz); }
    const del = eps * Math.sin(2 * Math.PI * f), x = -Math.tan(ph) * Math.tan(del), h0 = x >= 1 ? 0 : x <= -1 ? Math.PI : Math.acos(x);
    return (S0 / Math.PI) * (h0 * Math.sin(ph) * Math.sin(del) + Math.cos(ph) * Math.cos(del) * Math.sin(h0));
  };
  const totale = anni * passiAnno;
  for (let n = 0; n < totale; n++) {
    const f = (n % passiAnno) / passiAnno, ultimo = n >= totale - passiAnno;
    for (let j = 0; j < H; j++) {
      const ph = lat(j), cj = Math.max(0.25, Math.cos(ph)), jn = Math.max(0, j - 1), js = Math.min(H - 1, j + 1), cn = Math.max(0.25, Math.cos(lat(j) + dphi / 2)), cs = Math.max(0.25, Math.cos(lat(j) - dphi / 2));
      for (let i = 0; i < W; i++) {
        const k = j * W + i, t = T[k], ie = (i + 1) % W, iw = (i + W - 1) % W;
        const lap = (cn * (T[jn * W + i] - t) + cs * (T[js * W + i] - t)) / (cj * dphi * dphi) + (T[j * W + ie] + T[j * W + iw] - 2 * t) / (cj * cj * dlam * dlam);
        const dT = (luce(j, i, f) * (1 - albedo(k, t)) - (sigma * t ** 4) / (1 + 0.75 * tau) + D * lap) / C(k);
        nuovo[k] = Math.max(3, t + dt * Math.max(-50 / dt, Math.min(50 / dt, dT)));
        if (ultimo) { media[k] += nuovo[k] / passiAnno; if (nuovo[k] < (terra[k] ? 268 : 271)) freddo[k] += acquaPerGhiaccio / passiAnno; }
      }
    }
    T.set(nuovo);
  }
  // in montagna fa più freddo (6,5 °C ogni chilometro sopra il mare)
  for (let k = 0; k < W * H; k++) if (terra[k]) { const su = Math.max(0, quota[k] - Math.max(0, sf.mare)) / 1000; media[k] -= 6.5 * su; if (su > 0) freddo[k] = Math.min(1, freddo[k] + su * 0.25); }
  let gm = 0, gg = 0, a = 0; for (let j = 0; j < H; j++) { const w = Math.cos(lat(j)); for (let i = 0; i < W; i++) { gm += media[j * W + i] * w; gg += freddo[j * W + i] * w; a += w; } }
  const out = { W, H, media, freddo, Tglobale: gm / a, ghiaccio: gg / a };
  memoClima.set(chiave, out); if (memoClima.size > 6) memoClima.delete(memoClima.keys().next().value);
  return out;
}
