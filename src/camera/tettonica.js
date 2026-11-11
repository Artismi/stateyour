// tettonica.js — la crosta di un pianeta che EVOLVE nel tempo: deriva dei continenti, oceani che nascono
// e affondano, catene di montagne nate dagli scontri.
//
// Non è una fotografia: si parte da un pianeta senza continenti e lo si lascia vivere per la sua età.
//   1. IL MANTELLO, scaldato dal basso, si organizza da solo in celle (l'equazione di Swift-Hohenberg,
//      come in fluidi.js, in regime a celle: pennacchi caldi che salgono, circondati da una rete di
//      discese fredde). Avanza nel tempo insieme alla crosta. Larghezza delle celle dallo spessore
//      del mantello, vigore dal calore dell'interno. La crosta è trascinata: si allontana da dove il
//      mantello sale e converge dove scende.
//   2. LA CROSTA CONTINENTALE è una quantità che si conserva (uno spessore su griglia), portata da quella
//      velocità. È leggera e non affonda: si raccoglie dove il flusso converge; dove è compressa
//      si ispessisce (le catene), fino a quanto la spinta riesce a reggere, poi si ingorga e il
//      continente si allarga. Nuova crosta si separa lentamente dal mantello, sopra le fosse (gli archi
//      di vulcani), e viene poi raccolta dai continenti. Un continente fa da coperta: il mantello sotto
//      si scalda, la discesa si spegne e diventa una salita, e il continente si spacca (il ciclo dei
//      supercontinenti: nessuno lo impone, viene da questo).
//   3. LA CROSTA OCEANICA nasce alle dorsali (dove la crosta si apre), invecchia allontanandosi, affonda
//      dove il mantello scende. Raffreddandosi si contrae: l'oceano è più profondo dove è più vecchio.
//   4. LE QUOTE vengono dal galleggiamento (isostasia): la crosta spessa sta alta, come un iceberg.
//
// LEGGI EMPIRICHE (misurate sulla Terra e usate così, non derivate): la profondità dell'oceano con l'età
// (2500 m + 350 m·√milioni di anni, fino a 6000 m); quanta crosta continentale si è separata nel tempo
// (crostaAttesa); la velocità delle placche (4 cm/anno sulla Terra, ∝ q²); lo spessore che la
// crosta regge (da 42 a 70 km secondo la spinta); l'erosione (una catena si consuma in ~200 milioni di
// anni); la profondità in più delle fosse (fino a 2500 m). Sono tutte in COSTANTI qui sotto.
// SEMPLIFICAZIONI: la carta è trattata come piana (longitudine periodica, i poli sono muri): vicino ai
// poli le forme sono stirate. La crosta segue il mantello punto per punto: non ci sono placche rigide
// (niente faglie trasformi, niente rotazioni). Il calore q è quello di oggi per tutta la storia.

export const COSTANTI = {
  hMisura: 38e3, // (m) lo spessore con cui si conta «quanta superficie» di continente c'è
  hZero: 35e3, // la crosta spessa così galleggia a quota 0 (il livello di riferimento: all'incirca il mare terrestre)
  hMargine: 25e3, // sopra è continente; sotto è crosta di transizione (archi, altopiani sommersi)
  hLibero: 36e3, hFermo: 40e3, hMassimo: 70e3, // fino a hLibero la crosta si lascia comprimere; oltre resiste; il massimo retto dalla spinta va da hFermo (spinta debole) a hMassimo (Tibet)
  galleggia: 0.15, // 1 − densità della crosta / densità del mantello (2800 / 3300): quanto sporge ciò che galleggia
  dorsale: 2500, raffredda: 350, abisso: 6000, // la profondità dell'oceano (m) con l'età (milioni di anni)
  radice: 5250, // la quota (−m) a cui starebbe un continente senza crosta: così hZero sta a 0
  fossa: 2500, // quanto si piega in giù la crosta oceanica dove affonda
  vTerra: 0.04, qTerra: 0.087, // (m/anno, W/m²) la velocità media delle placche terrestri e il calore che la muove
  qPlacche: 0.05, qVivo: 0.02, // sotto qPlacche (o senz'acqua) la crosta non si rompe; sotto qVivo il mantello è fermo
  erosione: 800, // (m²/anno) quanto in fretta i rilievi si spianano e i sedimenti allargano i continenti
  coesione: 0.9, // quanto forte la crosta robusta tira a sé quella vicina (celle per passo, per unità di differenza)
  inerzia: 4, // in quanti giri di cella il mantello sotto un continente si scalda (o si raffredda quando se ne va)
  coperta: 0.8, // quanto un continente scalda il mantello che ha sotto (nelle unità dell'equazione delle celle)
};
const C = COSTANTI, C_PASSO = 0.3, CEDE = 0.03, PASSI_GROSSI = 2400;

// ---------- la trasformata di Fourier (griglie periodiche, lati potenze di 2)
const tabelle = new Map();
function tabella(n) {
  let t = tabelle.get(n); if (t) return t;
  const inv = new Uint16Array(n), co = new Float64Array(n / 2), si = new Float64Array(n / 2);
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; inv[i] = j; }
  for (let k = 0; k < n / 2; k++) { co[k] = Math.cos((2 * Math.PI * k) / n); si[k] = Math.sin((2 * Math.PI * k) / n); }
  tabelle.set(n, (t = { inv, co, si })); return t;
}
function fft(re, im, n, inversa) {
  const { inv, co, si } = tabella(n), segno = inversa ? 1 : -1;
  for (let i = 1; i < n; i++) { const j = inv[i]; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let len = 2, salto = n >> 1; len <= n; len <<= 1, salto >>= 1) { const m = len >> 1;
    for (let i = 0; i < n; i += len) for (let k = 0, t = 0; k < m; k++, t += salto) {
      const wr = co[t], wi = segno * si[t], a = i + k, b = a + m, vr = re[b] * wr - im[b] * wi, vi = re[b] * wi + im[b] * wr;
      re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi;
    } }
  if (inversa) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}
function fft2(re, im, W, H, inversa) {
  const t = tabella(Math.max(W, H)), r = (t.r ??= new Float64Array(Math.max(W, H))), m = (t.m ??= new Float64Array(Math.max(W, H)));
  for (let y = 0; y < H; y++) { const o = y * W; for (let x = 0; x < W; x++) { r[x] = re[o + x]; m[x] = im[o + x]; } fft(r, m, W, inversa); for (let x = 0; x < W; x++) { re[o + x] = r[x]; im[o + x] = m[x]; } }
  for (let x = 0; x < W; x++) { for (let y = 0; y < H; y++) { r[y] = re[y * W + x]; m[y] = im[y * W + x]; } fft(r, m, H, inversa); for (let y = 0; y < H; y++) { re[y * W + x] = r[y]; im[y * W + x] = m[y]; } }
}

// ---------- IL MANTELLO: ∂u/∂t = εu − (1+∇²)²u + g·u² − u³ + coperta. u > 0 dove sale (caldo), u < 0 dove scende.
// «onde» celle lungo l'equatore; la carta è larga il doppio di quanto è alta. Il caso iniziale è un rumore minuscolo.
function mantello({ onde, epsilon, seme }) {
  const Wm = onde <= 6 ? 64 : 128, Hm = Wm / 2, Nm = Wm * Hm, dk = 1 / onde, g = 1.2;
  let s = seme % 2147483647 || 1; if (s < 0) s += 2147483647; const caso = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const u = new Float64Array(Nm).map(() => 0.05 * (caso() - 0.5)), re = new Float64Array(Nm), im = new Float64Array(Nm), sr = new Float64Array(Nm), si = new Float64Array(Nm), k4 = new Float64Array(Nm);
  for (let y = 0; y < Hm; y++) for (let x = 0; x < Wm; x++) { const kx = (x < Wm / 2 ? x : x - Wm) * dk, ky = (y < Hm / 2 ? y : y - Hm) * 2 * dk; k4[y * Wm + x] = (1 - kx * kx - ky * ky) ** 2; }
  // un passo: la parte che si piega da sé (u², u³) e la coperta in modo esplicito, la diffusione in modo implicito
  const passo = (dt, coperta = null) => {
    for (let i = 0; i < Nm; i++) { const v = u[i]; re[i] = v + dt * (g * v * v - v * v * v + (coperta ? coperta[i] : 0)); im[i] = 0; }
    fft2(re, im, Wm, Hm, false);
    for (let i = 0; i < Nm; i++) { const l = 1 / (1 - dt * (epsilon - k4[i])); re[i] *= l; im[i] *= l; }
    re[0] = 0; im[0] = 0; // la media non cambia: il moto sposta il calore, non lo crea
    sr.set(re); si.set(im); fft2(re, im, Wm, Hm, true); u.set(re);
  };
  // il campo visto su una griglia W×H qualsiasi (centri delle celle): media a blocchi se più grossa,
  // interpolazione esatta (in Fourier) se più fine
  const fine = {}, su = (W, H, out = new Float64Array(W * H)) => {
    if (W === Wm) out.set(u);
    else if (W < Wm) { const r = Wm / W; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let a = 0; for (let b = 0; b < r; b++) for (let c = 0; c < r; c++) a += u[(j * r + b) * Wm + i * r + c]; out[j * W + i] = a / (r * r); } }
    else {
      const R = (fine.R?.length === W * H ? fine.R : (fine.R = new Float64Array(W * H))).fill(0), I = (fine.I?.length === W * H ? fine.I : (fine.I = new Float64Array(W * H))).fill(0), sc = (W * H) / Nm, dx = 0.5 / W - 0.5 / Wm, dy = 0.5 / H - 0.5 / Hm;
      for (let y = 0; y < Hm; y++) { const ky = y < Hm / 2 ? y : y - Hm; if (2 * ky === -Hm) continue;
        for (let x = 0; x < Wm; x++) { const kx = x < Wm / 2 ? x : x - Wm; if (2 * kx === -Wm) continue;
          const f = 2 * Math.PI * (kx * dx + ky * dy), co = Math.cos(f) * sc, se = Math.sin(f) * sc, a = sr[y * Wm + x], b = si[y * Wm + x], k = ((ky + H) % H) * W + ((kx + W) % W);
          R[k] = a * co - b * se; I[k] = a * se + b * co; } }
      fft2(R, I, W, H, true); out.set(R);
    }
    return out;
  };
  // quante celle: i pennacchi che salgono (i massimi del campo)
  const celle = () => { let mx = 0, n = 0; for (const v of u) if (v > mx) mx = v;
    for (let y = 0; y < Hm; y++) for (let x = 0; x < Wm; x++) { const v = u[y * Wm + x]; if (v < 0.35 * mx) continue; let cima = true; for (let b = -1; b <= 1 && cima; b++) for (let a = -1; a <= 1; a++) if ((a || b) && u[((y + b + Hm) % Hm) * Wm + ((x + a + Wm) % Wm)] > v) { cima = false; break; } if (cima) n++; }
    return n; };
  return { Wm, Hm, u, passo, su, celle };
}

// ---------- dalla forma del mantello alla velocità della superficie. La crosta scivola giù dal «colle» caldo
// verso la «valle» fredda, nella direzione di −∇u. Ma la litosfera è RIGIDA: una placca va tutta alla stessa
// velocità, e si deforma solo ai bordi. Perciò dal mantello si prende la direzione, e la velocità è la stessa
// ovunque (c0 celle per passo), salvo spegnersi proprio sopra le dorsali e le fosse, dove cambia verso.
// cx, cy: frazione di cella che attraversa in un passo il lato est e il lato sud (ai poli c'è un muro).
// Dove il flusso converge (conv, 0…1) la spinta regge crosta più spessa (cap).
export function campoDaPotenziale(u, W, H, c0, ca = null) {
  const N = W * H; ca ??= { cx: new Float64Array(N), cy: new Float64Array(N), cap: new Float64Array(N), conv: new Float32Array(N), vx: new Float64Array(N), vy: new Float64Array(N) };
  const { cx, cy, cap, conv, vx, vy } = ca; let s2 = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, a = 0.5 * (u[j * W + ((i + 1) % W)] - u[j * W + ((i + W - 1) % W)]), b = j > 0 && j < H - 1 ? 0.5 * (u[k + W] - u[k - W]) : 0; vx[k] = a; vy[k] = b; s2 += a * a + b * b; }
  const d2 = 0.06 * (s2 / N) + 1e-300; // (sotto un quarto della pendenza media la crosta rallenta: i bordi delle placche)
  for (let k = 0; k < N; k++) { const m = -c0 / Math.sqrt(vx[k] * vx[k] + vy[k] * vy[k] + d2); vx[k] *= m; vy[k] *= m; }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; cx[k] = 0.5 * (vx[k] + vx[j * W + ((i + 1) % W)]); cy[k] = j < H - 1 ? 0.5 * (vy[k] + vy[k + W]) : 0; }
  const is = c0 > 0 ? 1 / c0 : 0; // (conta solo la convergenza netta dei bordi di placca, non quella larga e debole attorno)
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, c = Math.max(0, Math.min(1, ((cx[j * W + ((i + W - 1) % W)] - cx[k] + (j > 0 ? cy[k - W] : 0) - cy[k]) * is - 0.15) / 0.6));
    conv[k] = c; cap[k] = C.hFermo + (C.hMassimo - C.hFermo) * c; // quanto il flusso converge qui (0…1), e la crosta che regge
  }
  ca.c0 = c0; return ca;
}

// la media su una finestra quadrata di lato 2R+1 (in longitudine si fa il giro, ai poli la finestra si accorcia)
function sfoca(src, dst, tmp, W, H, R) {
  for (let j = 0; j < H; j++) { const r = j * W; let s = 0; for (let d = -R; d <= R; d++) s += src[r + ((d + W) % W)]; for (let i = 0; i < W; i++) { tmp[r + i] = s; s += src[r + ((i + R + 1) % W)] - src[r + ((i - R + W) % W)]; } }
  for (let i = 0; i < W; i++) { let s = 0; for (let d = 0; d <= Math.min(R, H - 1); d++) s += tmp[d * W + i]; for (let j = 0; j < H; j++) { dst[j * W + i] = s; if (j + R + 1 < H) s += tmp[(j + R + 1) * W + i]; if (j - R >= 0) s -= tmp[(j - R) * W + i]; } }
}

// quanto è robusta (0…1) la crosta secondo lo spessore: quella dei continenti è una lastra rigida, i veli sottili no
const robusta = (h) => { let f = h / C.hZero; if (f > 1) f = 1; f *= f; return f * f; };

// ---------- la velocità dei CONTINENTI. Un continente è una zattera rigida: non segue il mantello punto per
// punto, ma va tutto insieme, alla media delle spinte che riceve (qui: la media, su una finestra larga R celle,
// della velocità del mantello pesata con quanto è robusta la crosta: quella spessa è molto più forte di quella
// sottile). Perciò un continente tirato da due parti non si assottiglia come una pasta: cede dove è più debole
// e si spacca, e i due pezzi se ne vanno interi. La crosta sottile (veli, archi) segue invece il mantello.
// hx, hy: come cx, cy, ma per la crosta continentale; stretta: dove quella velocità converge (0…1).
export function velocitaCrosta(h, ca, W, H, R) {
  const N = W * H, { vx, vy, c0 } = ca;
  const hx = (ca.hx ??= new Float64Array(N)), hy = (ca.hy ??= new Float64Array(N)), tetto = (ca.tetto ??= new Float64Array(N)), stretta = (ca.stretta ??= new Float32Array(N));
  const A = (ca.A ??= new Float64Array(N)), B = (ca.B ??= new Float64Array(N)), P = (ca.P ??= new Float64Array(N)), p = (ca.p ??= new Float64Array(N)), T = (ca.T ??= new Float64Array(N));
  let c = false; for (let k = 0; k < N; k++) { const f = robusta(h[k]); p[k] = f; A[k] = f * vx[k]; B[k] = f * vy[k]; if (f > 1e-4) c = true; }
  if (c) { sfoca(A, A, T, W, H, R); sfoca(B, B, T, W, H, R); sfoca(p, P, T, W, H, R); for (let k = 0; k < N; k++) { const f = p[k], q = P[k]; if (q > 1e-9) { A[k] = vx[k] + f * (A[k] / q - vx[k]); B[k] = vy[k] + f * (B[k] / q - vy[k]); } else { A[k] = vx[k]; B[k] = vy[k]; } } }
  else { A.set(vx); B.set(vy); }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; hx[k] = 0.5 * (A[k] + A[j * W + ((i + 1) % W)]); hy[k] = j < H - 1 ? 0.5 * (B[k] + B[k + W]) : 0; }
  // la COESIONE: la lastra tiene insieme. La crosta è tirata verso dove, lì attorno (5 × 5 celle), c'è più crosta
  // robusta: così un continente stirato non diventa un velo, ma si strappa in pezzi che restano spessi
  if (c && C.coesione > 0) { sfoca(p, P, T, W, H, 2); const kc = C.coesione * c0 / 0.3;
    for (let j = 0; j < H; j++) { const nj = (Math.min(H - 1, j + 2) - Math.max(0, j - 2) + 1) * 5; for (let i = 0; i < W; i++) P[j * W + i] /= nj; }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; hx[k] += kc * (P[j * W + ((i + 1) % W)] - P[k]); if (j < H - 1) hy[k] += kc * (P[k + W] - P[k]); } }
  const is = c0 > 0 ? 1 / (0.25 * c0) : 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, e = hx[k], o = hx[j * W + ((i + W - 1) % W)], s = hy[k], n = j > 0 ? hy[k - W] : 0;
    const esce = Math.max(e, 0) + Math.max(-o, 0) + Math.max(s, 0) + Math.max(-n, 0);
    tetto[k] = esce > 0.35 ? 0.7 / esce : 2; // da una cella non può uscire più di quello che c'è
    stretta[k] = Math.max(0, Math.min(1, (o - e + n - s) * is));
  }
  return ca;
}

// le vicine di ogni cella: v (a est, o a sud), m (dalla parte opposta), p (oltre v). In longitudine si fa il giro; ai poli ci si ferma
function vicine(W, H) {
  const N = W * H, g = { v: [new Int32Array(N), new Int32Array(N)], m: [new Int32Array(N), new Int32Array(N)], p: [new Int32Array(N), new Int32Array(N)] };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; g.v[0][k] = j * W + ((i + 1) % W); g.m[0][k] = j * W + ((i + W - 1) % W); g.p[0][k] = j * W + ((i + 2) % W); g.v[1][k] = j < H - 1 ? k + W : k; g.m[1][k] = j > 0 ? k - W : k; g.p[1][k] = j < H - 2 ? k + 2 * W : j < H - 1 ? k + W : k; }
  return g;
}

// ---------- UN PASSO DELLA CROSTA. stato = { W, H, h (spessore della crosta continentale, m), a (età della crosta
// oceanica, milioni di anni), sub (quanta crosta oceanica è affondata qui nell'ultimo passo, in frazione di cella) }.
// Tutto è scritto come scambio tra celle vicine: ciò che esce da una entra nell'altra, quindi la crosta
// continentale si conserva esattamente (salvo «apporto», la crosta nuova, distribuita dove l'oceano affonda).
export function passoCrosta(st, ca, { dtMa = 1, kappa = 0, apporto = 0 } = {}) {
  const { W, H, h, a, sub } = st, N = W * H, { cx, cy, hx, hy, cap, tetto, stretta } = ca;
  const dh = (st.dh ??= new Float64Array(N)), dw = (st.dw ??= new Float64Array(N)), dq = (st.dq ??= new Float64Array(N)), fermo = (st.fermo ??= new Float32Array(N)), fermo2 = (st.fermo2 ??= new Float32Array(N));
  const ihw = 1 / C.hMargine, iD = 1 / (C.hFermo - C.hLibero), h0 = C.hZero;
  // lo scambio attraverso ogni lato, tra la cella k e la sua vicina v (velocità > 0: da k a v); prima i lati est, poi
  // i lati sud. m e p: le celle oltre k e oltre v. c: la velocità del mantello (porta la crosta oceanica); ch: quella
  // della crosta continentale
  const geo = (st.geo ??= vicine(W, H));
  for (let verso = 0; verso < 2; verso++) { const vv = geo.v[verso], mm = geo.m[verso], pp = geo.p[verso], cm = verso ? cy : cx, cc = verso ? hy : hx, fine = verso ? N - W : N;
    for (let k = 0; k < fine; k++) { const v = vv[k], c = cm[k], ch = cc[k], hk = h[k], hv = h[v];
      // la crosta oceanica (la parte di cella non coperta dal continente) va col mantello, con la sua età
      if (c !== 0) { const d = c > 0 ? k : v; let wd = 1 - (c > 0 ? hk : hv) * ihw; if (wd > 0) { wd *= c; dw[k] -= wd; dw[v] += wd; wd *= a[d]; dq[k] -= wd; dq[v] += wd; } }
      if (hk <= 0 && hv <= 0) continue;
      let F = 0; const hd = ch > 0 ? hk : hv;
      if (ch !== 0 && hd > 0) {
        // la crosta continentale: quanta ne passa (lo schema tiene netti i bordi dei continenti invece di sfumarli)…
        const d = ch > 0 ? k : v, n = ch > 0 ? v : k, hn = ch > 0 ? hv : hk, D = hn - hd; let f = hd;
        if (D !== 0) { const r = (hd - h[ch > 0 ? mm[k] : pp[k]]) / D; if (r > 0) f += 0.5 * (1 - (ch > 0 ? ch : -ch)) * (r < 0.5 ? 2 * r : r < 1 ? 1 : r < 2 ? r : 2) * D; }
        const t = hd * tetto[d]; if (f > t) f = t;
        // …ma chi la riceve, se è stretto (il flusso gli converge addosso, o chi ha davanti è fermo) ed è già
        // spesso quanto la spinta di lì riesce a reggere, non ne prende più: l'ingorgo, che risale all'indietro
        const J = stretta[n] > fermo[n] ? stretta[n] : fermo[n];
        if (J > 0) { const g = (cap[n] - hn) * iD, b = g <= 0 ? J : g < 1 ? J * (1 - g) : 0; if (b > 0) { f *= 1 - b; if (b > fermo2[d]) fermo2[d] = b; } }
        F = ch * f;
      }
      // l'erosione: ciò che sta sopra il livello di riferimento si consuma e si deposita accanto, più in basso…
      const xk = hk - h0, xv = hv - h0;
      if (xk > 0 || xv > 0) { F += kappa * ((xk > 0 ? xk : 0) - (xv > 0 ? xv : 0));
        // …e la crosta più spessa di quanto la spinta regge cede sotto il proprio peso e si allarga sui lati
        const yk = hk - cap[k], yv = hv - cap[v]; if (yk > 0 || yv > 0) F += CEDE * ((yk > 0 ? yk : 0) - (yv > 0 ? yv : 0)); }
      if (F !== 0) { dh[k] -= F; dh[v] += F; }
    } }
  st.fermo = fermo2; st.fermo2 = fermo; fermo.fill(0);
  // il bilancio di ogni cella. Se dopo il trasporto la crosta oceanica non basta a coprire il fondo, lo spazio
  // si riempie di crosta nuova, di età zero (una dorsale, o il mare che si apre dietro un continente che si
  // spacca); se è troppa, la parte in più affonda nel mantello (una fossa).
  let somma = 0, totale = 0;
  for (let k = 0; k < N; k++) {
    let w0 = 1 - h[k] * ihw; if (w0 < 0) w0 = 0;
    let q = w0 * a[k] + dq[k]; if (q < 0) q = 0; const w1 = w0 + dw[k], s0 = sub[k];
    let hn = h[k] + dh[k] + apporto * s0 * s0; if (hn < 0) hn = 0; h[k] = hn; totale += hn;
    let wt = 1 - hn * ihw; if (wt < 0) wt = 0;
    const s = w1 > wt ? w1 - wt : 0, den = w1 > wt ? w1 : wt; sub[k] = s; somma += s * s;
    a[k] = den > 1e-6 ? q / den + dtMa : 0;
    dh[k] = 0; dw[k] = 0; dq[k] = 0;
  }
  st.sommaSub = somma; st.totale = totale; // (la crosta nuova nasce sopra le fosse più attive: peso s²)
  return st;
}

// passare a una griglia due volte più fine senza cambiare i totali: ogni cella si divide in quattro, con la
// pendenza delle vicine (limitata, per non inventare valori negativi né nuovi massimi)
function raffina(src, W, H) {
  const out = new Float64Array(4 * W * H), mm = (p, q) => (p * q <= 0 ? 0 : Math.abs(p) < Math.abs(q) ? p : q);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, v = src[k], sx = mm(v - src[j * W + ((i + W - 1) % W)], src[j * W + ((i + 1) % W)] - v) / 4, sy = mm(v - src[j > 0 ? k - W : k], src[j < H - 1 ? k + W : k] - v) / 4, o = 2 * j * 2 * W + 2 * i;
    out[o] = v - sx - sy; out[o + 1] = v + sx - sy; out[o + 2 * W] = v - sx + sy; out[o + 2 * W + 1] = v + sx + sy;
  }
  return out;
}

// LEGGE EMPIRICA: quanta crosta continentale si è separata dal mantello dopo t anni, come frazione della
// superficie che coprirebbe se fosse tutta spessa hMisura. In fretta all'inizio, poi sempre più piano
// (sulla Terra: un terzo in 4,5 miliardi di anni).
export const crostaAttesa = (t) => 0.5 * (1 - Math.exp(-Math.max(0, t) / 4e9));

// LEGGE EMPIRICA: la profondità (m) del fondo dell'oceano secondo l'età della crosta (milioni di anni): la
// crosta nuova è calda e alta (la dorsale), raffreddandosi si contrae e scende.
export const profonditaOceano = (etaMa) => Math.min(C.abisso, C.dorsale + C.raffredda * Math.sqrt(Math.max(0, etaMa)));

// ---------- LA STORIA INTERA. nucleo: raggio del nucleo / raggio del pianeta; q: calore interno (W/m²); eta: anni;
// acqua: se la crosta è indebolita dall'acqua (senza, non si rompe in placche); passi: quanti passi sulla griglia
// più fine. Il passato lontano si simula a grana grossa (griglie 4 e 2 volte più larghe: il rimescolamento ne
// cancella comunque i dettagli), il passato recente a grana fine. La velocità è quella vera: se la storia chiede
// più di PASSI_GROSSI passi a grana grossa, il tratto più antico si salta (storia.saltati) e si parte con la
// crosta separata fino a quel momento stesa in un velo uniforme. «placche» forza il regime (true/false).
// Restituisce { W, H, alt, cont, spinta, etaCrosta, celle } più: spessore (m di crosta continentale), fosse (0…1,
// dove la crosta oceanica affonda), regime, bilancio (m di spessore medio: prodotta e presente), storia.
// Se la crosta NON si rompe (q ≤ qPlacche o niente acqua): un COPERCHIO UNICO. Nessuna deriva: cont = 0 ovunque,
// spinta = 0, spessore = 0, etaCrosta = l'età del pianeta; alt = solo i rigonfiamenti sopra i pennacchi del
// mantello (fino a ~1,5 km, come Tharsis o gli altopiani di Venere), o piatto se il mantello è fermo (q ≤ qVivo).
export function evolviTettonica({ W = 256, H = 128, raggioM = 6.371e6, nucleo = 0.546, q = C.qTerra, eta = 4.5e9, acqua = true, seme = 1, passi = 160, placche = null } = {}) {
  if (W !== 2 * H || W < 32 || (W & (W - 1))) throw new Error('tettonica: serve W = 2H, potenza di 2, almeno 32');
  const N = W * H, alt = new Float32Array(N), cont = new Uint8Array(N), spinta = new Float32Array(N), etaCrosta = new Float32Array(N), spessore = new Float32Array(N), fosse = new Float32Array(N);
  // le celle del mantello sono larghe circa una volta e mezza il suo spessore: quante ce ne stanno in un giro
  const Dm = raggioM * (1 - nucleo), onde = Math.max(3, Math.min(11, Math.round((2 * Math.PI * raggioM) / (3 * Dm))));
  const aPlacche = placche ?? (q > C.qPlacche && !!acqua), vivo = q > C.qVivo;
  const man = mantello({ onde, epsilon: Math.max(0.15, Math.min(0.8, 0.35 * (q / C.qTerra))), seme });
  if (vivo) for (let n = 0; n < 80; n++) man.passo(0.5); // il mantello convette da subito: le celle ci sono già quando la crosta comincia a separarsi
  if (!aPlacche) {
    etaCrosta.fill(eta / 1e6);
    if (vivo) { const u = man.su(W, H), A = 1500 * Math.min(1, q / C.qTerra); let mx = 1e-9; for (const v of u) mx = Math.max(mx, Math.abs(v)); for (let k = 0; k < N; k++) alt[k] = (A * u[k]) / mx; }
    return { W, H, alt, cont, spinta, etaCrosta, celle: vivo ? man.celle() : 0, spessore, fosse, regime: vivo ? 'coperchio unico' : 'fermo', bilancio: { prodotta: 0, presente: 0 }, storia: { simulati: 0, saltati: eta, passi: 0, velocita: 0 } };
  }
  // LEGGE DI SCALA (strato limite della convezione): la velocità delle placche cresce come il quadrato del calore che esce
  const V = C.vTerra * (q / C.qTerra) ** 2, tau = Dm / V; // tau: il tempo di un giro di una cella (sulla Terra ~70 milioni di anni): l'orologio del mantello
  // i livelli di griglia e quanti passi su ciascuno, partendo dal presente e andando indietro
  const larghezze = []; for (let w = W; larghezze.length < 3 && w >= Math.min(64, W); w /= 2) larghezze.unshift(w);
  const liv = larghezze.map((w) => ({ W: w, H: w / 2, dt: (C_PASSO * 2 * Math.PI * raggioM) / w / V, n: 0 }));
  let resto = eta, saltati = 0;
  for (let l = liv.length - 1; l >= 0; l--) { const L = liv[l], vuole = Math.ceil(resto / L.dt - 1e-9), n = Math.max(0, Math.min(l > 0 ? passi : PASSI_GROSSI, vuole)); L.n = n; if (n) { if (l === 0 && vuole > n) saltati = resto - n * L.dt; L.dt = Math.min(L.dt, (resto - (l === 0 ? saltati : 0)) / n); resto -= n * L.dt; } }
  const caldo = new Float64Array(man.Wm * man.Hm); // quanto il mantello si è scaldato sotto i continenti (0…1)
  let t = saltati, prodotta = crostaAttesa(t) * C.hMisura, debito = 0, st = null, ca = null, nPassi = 0, c0 = C_PASSO;
  for (let l = 0; l < liv.length; l++) {
    const { W: w, H: hh, dt, n } = liv[l], Nl = w * hh;
    st = st ? { W: w, H: hh, h: raffina(st.h, w / 2, hh / 2), a: raffina(st.a, w / 2, hh / 2), sub: raffina(st.sub, w / 2, hh / 2), sommaSub: st.sommaSub * 4 } : { W: w, H: hh, h: new Float64Array(Nl).fill(prodotta), a: new Float64Array(Nl), sub: new Float64Array(Nl), sommaSub: 0 };
    ca = null; if (!n && l < liv.length - 1) continue;
    c0 = (dt * V * w) / (2 * Math.PI * raggioM);
    const R = Math.max(2, Math.round(w / (4 * onde))), ogni = Math.max(1, Math.min(4, Math.round((0.25 * tau) / dt))), dtM = (ogni * dt) / tau, kappa = Math.min(0.04, (C.erosione * dt) / ((2 * Math.PI * raggioM) / w) ** 2);
    const coperta = new Float64Array(man.Wm * man.Hm), lento = 1 - Math.exp(-dtM / C.inerzia), uL = new Float64Array(Nl), rm = w / man.Wm, ihw = 1 / C.hMargine;
    const aggiorna = (avanza) => {
      // la coperta: quanta parte di ogni cella del mantello sta sotto un continente (rispetto alla media)
      let m = 0;
      for (let j = 0; j < man.Hm; j++) for (let i = 0; i < man.Wm; i++) { let c = 0; if (rm >= 1) { for (let b = 0; b < rm; b++) for (let a = 0; a < rm; a++) c += robusta(st.h[(j * rm + b) * w + i * rm + a]); c /= rm * rm; } else c = robusta(st.h[Math.floor(j * rm) * w + Math.floor(i * rm)]); const k = j * man.Wm + i; caldo[k] += (c - caldo[k]) * lento; m += caldo[k]; }
      m /= coperta.length; for (let i = 0; i < coperta.length; i++) coperta[i] = C.coperta * (caldo[i] - m);
      if (avanza) man.passo(dtM, coperta);
      ca = campoDaPotenziale(man.su(w, hh, uL), w, hh, c0, ca); velocitaCrosta(st.h, ca, w, hh, R);
    };
    for (let p = 0; p < n; p++) {
      if (p % ogni === 0) aggiorna(p > 0 || l > 0);
      // la crosta nuova di questo passo (se non c'è ancora nessuna fossa dove farla nascere, resta in debito)
      const nuova = (crostaAttesa(t + dt) - crostaAttesa(t)) * C.hMisura * Nl + debito; let apporto = 0;
      if (st.sommaSub > 0) { apporto = nuova / st.sommaSub; prodotta += nuova / Nl; debito = 0; } else debito = nuova;
      passoCrosta(st, ca, { dtMa: dt / 1e6, kappa, apporto }); t += dt; nPassi++;
    }
    debito *= 4; // (alla griglia successiva le celle sono quattro volte tante)
    if (!ca) aggiorna(false);
  }
  // ---------- il presente: quote dal galleggiamento, continenti, spinta, fosse
  const { h, a, sub } = st, { conv } = ca, ihw = 1 / C.hMargine; let presente = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, hk = h[k], wo = Math.max(0, 1 - hk * ihw); presente += hk / N;
    spessore[k] = hk; cont[k] = hk >= C.hMargine ? 1 : 0; etaCrosta[k] = wo > 0 ? a[k] : 0;
    spinta[k] = cont[k] ? conv[k] : 0; // dove la crosta dei continenti è compressa oggi: lì i monti crescono
    // la fossa: dove la crosta oceanica affonda in fretta, qui o sotto il bordo del continente accanto
    let s = sub[k]; s = Math.max(s, sub[j * W + ((i + 1) % W)], sub[j * W + ((i + W - 1) % W)], j > 0 ? sub[k - W] : 0, j < H - 1 ? sub[k + W] : 0);
    fosse[k] = wo * Math.max(0, Math.min(1, (s / c0 - 0.3) / 0.5));
    // ISOSTASIA: il fondo (oceano secondo l'età, o la radice fredda del continente) più quanto sporge la crosta leggera
    alt[k] = -(wo * profonditaOceano(a[k]) + (1 - wo) * C.radice) + C.galleggia * hk - C.fossa * fosse[k];
  }
  return { W, H, alt, cont, spinta, etaCrosta, celle: man.celle(), spessore, fosse, regime: 'a placche', bilancio: { prodotta, presente }, storia: { simulati: eta - saltati, saltati, passi: nPassi, velocita: V } };
}
