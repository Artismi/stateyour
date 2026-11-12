// splat.js — GLI SPLAT FISICI: lo spazio diviso in campane (gaussiane in tre dimensioni) per fare il conto della luce.
//
// Non è un modo di dipingere (INTRECCIO.md, regola 14): uno splat è un pezzo di materia del modello con la sua forma
// (centro e covarianza), e porta il MATERIALE, non un colore: luce propria (W per canale), sezione d'estinzione (m² per
// canale: ∫κ dV), sezione di diffusione (m²) con la sua funzione di fase (Henyey–Greenstein, g). La luce che lo colpisce
// viene dalle sorgenti vere; ciò che arriva all'occhio è il trasporto lungo il raggio, con l'unità del nucleo (π·I/E0)
// e l'esposizione dell'occhio del motore (S.E0), nient'altro.
//
// ───────────────────────────── DA DOVE VIENE OGNI PEZZO ─────────────────────────────
//  · LA PROIEZIONE della covarianza (Zwicker et al. 2001, «EWA splatting»; Kerbl et al. 2023, 3DGS, arXiv 2308.04079,
//    eq. 5 [R]): Σ' = J·W·Σ·Wᵀ·Jᵀ, J lo jacobiano della prospettiva nel centro. La campana sullo schermo è normalizzata
//    (integra a 1 in pixel): ciò che un pixel riceve è la parte del flusso F = L/(4πr²) che gli tocca, e la radianza è
//    quella parte divisa per l'angolo solido del pixel (cos³θ/f²). Il «filtro» di 3DGS (+0,3 px² sulla diagonale) qui è
//    la varianza di un pixel quadrato, 1/12 px² per asse (un momento, non un numero scelto), e la normalizzazione si rifà
//    con la covarianza dilatata: il flusso si conserva anche per uno splat più piccolo di un pixel.
//  · L'ESTINZIONE in un pixel: τ = σ_est·(densità di colonna della campana) = σ_est·g_px·f²/(r²·cos³θ); un pixel è
//    C ← E·(1−e^−τ)/τ + C·e^−τ (Westover 1990, splatting di volume; Max 1995 per l'emissione-assorbimento [R]). Si
//    compone da dietro in avanti (ordinamento per distanza); per canale, perché la polvere arrossa: tre passate, una per
//    canale (WebGL2 non ha la miscela a due sorgenti). Un insieme che solo emette si somma e non si ordina.
//  · DA DENTRO (l'occhio a meno di 3,3σ): la proiezione non vale; la somma lungo il raggio è in forma chiusa,
//    ∫₀^∞ G(o + s·d) ds = e^(−½(C−B²/A))·√(π/2A)·erfc(−B/√2A)/((2π)^{3/2}·√det Σ), su tutto lo schermo.
//  · LA DIFFUSIONE (singola): la potenza tolta alla luce di una sorgente è P = F·σ_dif (F = L/(4πr²)·e^−τ_ombra), e verso
//    l'occhio va P·Φ(θ) per steradiante. Gli splat rilluminabili (Gao et al. 2023, «Relightable 3D Gaussians», arXiv
//    2311.16043 [R]) portano normale e BRDF; qui un mezzo non ha normale: porta la funzione di fase (Chandrasekhar 1960).
//  · L'OMBRA verso la sorgente: la profondità ottica accumulata lungo il segmento splat → sorgente, su una griglia in cui
//    si depositano le sezioni d'estinzione (nuvola-nella-cella); è l'idea delle «deep shadow maps» (Lokovic & Veach 2000)
//    fatta sulla griglia, come in 3DGRT (Moënne-Loccoz et al. 2024, arXiv 2407.07090 [R]) si traccia il raggio tra le
//    gaussiane. Per sorgenti ferme rispetto all'insieme (la stella di una nebulosa) si calcola una volta, nel lavoratore.
//  · LA GERARCHIA (regola 8: si calcola solo ciò che si guarda, alla scala a cui si guarda): gli splat stanno in un albero
//    (ordine di Morton, otto figli per padre); un padre è la FUSIONE PER MOMENTI dei figli: somma delle quantità additive
//    (luce, sezioni, potenza diffusa), baricentro e secondo momento conservati esattamente (Σ = Σᵢwᵢ(Σᵢ + δᵢδᵢᵀ)/W): da
//    lontano il padre ha la stessa luce, lo stesso centro e la stessa estensione dei figli (regola 4). Ogni fotogramma si
//    scende dall'alto e si apre un nodo solo se sullo schermo è più largo di `pixel` (o contiene l'occhio): i disegnati
//    sono legati ai pixel, non alla quantità di materia, e si ordinano solo loro. Il PESO dei momenti è ciò che si
//    vede (la luce per chi emette, la sezione per chi assorbe e diffonde): è il momento dell'immagine che si conserva.
//    La diffusione si fonde anch'essa per momenti: P = Σ Pᵢ e la direzione media della luce m = Σ Pᵢ·ûᵢ/P; un padre
//    diffonde verso l'occhio P·(1 + 3g·m·ê) (il primo termine di Legendre di HG, esatto al prim'ordine), una foglia
//    P·4π·HG(û·ê).
//  · IL COLORE: il rivelatore è l'occhio, curve CIE 1931 (vuoto_mezzo.js `occhio`, Wyman et al. 2013) → sRGB lineare;
//    i canali sono W × (rgb lineare normalizzato al canale più forte), la convenzione di tutto il motore (luci.js).
//
// ───────────────────────────── L'USO ─────────────────────────────
//   const F = foglie(n)  oppure  daLista([{ pos, cov | { assi, scale }, materiale: { emissione: { W, righe | temperatura
//            | spettro(nm) }, estinzione (m², o [r,g,b]), albedo, fase: { g } }, massa }])
//   const T = albero(F, { peso: 'luce' | 'sezione' | 'massa' })        // (anche in un lavoratore: niente DOM qui)
//   const L = creaSplat(N, { modo: 'emissione' | 'mezzo' });  L.metti([{ albero: T, corpo, scala, periodo, lontano, luce }])
//   strato: L.aggiorna(S); L.disegna(S)  ('emissione' nella passata 'fondo', su un'immagine più piccola; 'mezzo' in 'velato')
// COSTO (N.vista.splat, se è un oggetto): `pixel` (si apre un nodo largo più di tanti pixel: 1σ), `massimo` (quanti splat
// al più), `riduzione` (l'immagine dei soli emettitori). `pixel` è la finezza della divisione: la prova di convergenza
// (prove/splat.html) misura quanto cambia l'immagine dimezzandolo.
// Che cosa NON c'è: diffusione multipla; ombra per sorgenti che si muovono rispetto all'insieme (la stella del nucleo
// illumina senza ombra); l'ordine tra gli splat e i volumi del fondo (vedi universo.js).
import { V, GLSL_PROFONDITA_V, GLSL_PROFONDITA_F } from './nucleo.js';
import { occhio } from '../camera/vuoto_mezzo.js';

const PI = Math.PI, RT = 3.3, ET = Math.exp(-0.5 * RT * RT), PIX2 = 1 / 12; // il taglio della campana (σ); la varianza di un pixel quadrato
const MAX_VICINI = 16, H_PLANCK = 6.62607e-34, C_LUCE = 2.99792458e8, K_B = 1.380649e-23;

// =====================================================================================================
// IL COLORE DAL RIVELATORE: spettri → canali lineari (curve CIE dell'occhio, poi la matrice sRGB)
// =====================================================================================================
const aRGB = (X, Y, Z) => [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
export const planck = (T) => (nm) => { const l = nm * 1e-9; return 1 / (l ** 5 * Math.expm1((H_PLANCK * C_LUCE) / (K_B * T * l))); };
// righe [{ nm, W }], continuo { T | spettro(nm), W, peso(nm) } → { rgb (lineare, il canale più forte = 1), Y }
// (fuori dal triangolo sRGB si desatura verso il grigio di pari luminanza, come coloreVero di vuoto_mezzo.js)
export function canali(righe = [], continuo = null) {
  let X = 0, Y = 0, Z = 0;
  for (const r of righe || []) { if (!(r.W > 0)) continue; const o = occhio(r.nm); X += r.W * o[0]; Y += r.W * o[1]; Z += r.W * o[2]; }
  if (continuo && continuo.W > 0) { const sp = continuo.spettro || planck(continuo.T); let s = 0, sx = 0, sy = 0, sz = 0;
    for (let nm = 385; nm < 780; nm += 10) { const b = sp(nm) * (continuo.peso ? continuo.peso(nm) : 1), o = occhio(nm); s += b; sx += b * o[0]; sy += b * o[1]; sz += b * o[2]; }
    if (s > 0) { X += (continuo.W * sx) / s; Y += (continuo.W * sy) / s; Z += (continuo.W * sz) / s; } }
  let c = aRGB(X, Y, Z); const m0 = Math.min(...c); if (m0 < 0) c = c.map((v) => v + (Y - v) * (m0 / (m0 - Y)));
  const mx = Math.max(...c, 1e-300); return { rgb: c.map((v) => Math.max(0, v) / mx), Y };
}
// quanto vale una legge (λ → numero) in ognuno dei tre canali, per la luce di uno spettro: Σ s·r_c·legge / Σ s·r_c,
// r_c la risposta (positiva) del canale. Serve per l'estinzione per canale: legge = A_λ/A_V della polvere del modello.
export function perCanale(legge, spettro = () => 1) {
  const a = [0, 0, 0], b = [0, 0, 0];
  for (let nm = 385; nm < 780; nm += 5) { const o = occhio(nm), r = aRGB(o[0], o[1], o[2]), s = spettro(nm), q = legge(nm); for (let c = 0; c < 3; c++) { const w = Math.max(0, r[c]) * s; a[c] += w * q; b[c] += w; } }
  return a.map((x, c) => x / (b[c] || 1));
}
// la funzione di fase di Henyey–Greenstein, per steradiante (su tutte le direzioni fa 1); c = coseno dell'angolo di diffusione
export const faseHG = (g, c) => (1 - g * g) / (4 * PI * Math.pow(Math.max(1e-12, 1 + g * g - 2 * g * c), 1.5));

// =====================================================================================================
// LE FOGLIE: gli splat più fini, come li dà un modulo della fisica
// =====================================================================================================
// pos (3n, unità dell'insieme), cov (6n: xx yy zz xy xz yz, unità²), massa (kg o quel che si vuole), emis (3n, W: in doppia,
// la luce di una regione del cosmo supera i 10³⁸ della singola precisione),
// est (3n, m²), dif (3n, m²), g (n), P (3n, W diffusi: potenza tolta alle sorgenti ferme), dir (3n, direzione della luce
// diffusa), chiave (3n, facoltativa: dove sta per l'ordine di Morton, es. la posizione lagrangiana)
export function foglie(n) { return { n, pos: new Float64Array(3 * n), cov: new Float64Array(6 * n), massa: new Float64Array(n), emis: new Float64Array(3 * n), est: new Float32Array(3 * n), dif: new Float32Array(3 * n), g: new Float32Array(n), P: new Float64Array(3 * n), dir: new Float32Array(3 * n), chiave: null }; }
const tre = (x) => (Array.isArray(x) || ArrayBuffer.isView(x) ? [x[0], x[1], x[2]] : [x, x, x]);
// dalla lista di oggetti della fisica (l'ingresso «leggibile»)
export function daLista(lista) {
  const F = foglie(lista.length);
  lista.forEach((s, i) => { const m = s.materiale || {}, c = s.cov;
    for (let k = 0; k < 3; k++) F.pos[3 * i + k] = s.pos[k];
    if (c && c.assi) { const A = c.assi, sc = c.scale; const o = [0, 0, 0, 0, 0, 0]; for (let a = 0; a < 3; a++) { const v = A[a], q = sc[a] * sc[a]; o[0] += q * v[0] * v[0]; o[1] += q * v[1] * v[1]; o[2] += q * v[2] * v[2]; o[3] += q * v[0] * v[1]; o[4] += q * v[0] * v[2]; o[5] += q * v[1] * v[2]; } F.cov.set(o, 6 * i); }
    else if (c && c.length === 9) F.cov.set([c[0], c[4], c[8], c[1], c[2], c[5]], 6 * i); else if (c) F.cov.set(c, 6 * i);
    F.massa[i] = s.massa || 0;
    const e = m.emissione; if (e && e.W > 0) { const rgb = e.rgb || canali(e.righe || [], e.righe ? null : { W: 1, T: e.temperatura, spettro: e.spettro }).rgb; for (let k = 0; k < 3; k++) F.emis[3 * i + k] = e.W * rgb[k]; }
    if (m.estinzione) { const x = tre(m.estinzione), al = tre(m.albedo ?? 0); for (let k = 0; k < 3; k++) { F.est[3 * i + k] = x[k]; F.dif[3 * i + k] = x[k] * al[k]; } }
    F.g[i] = (m.fase && m.fase.g) || 0; });
  return F;
}

// =====================================================================================================
// LA GERARCHIA: fusione per momenti, otto per otto in ordine di Morton
// =====================================================================================================
const allarga = (x) => { x &= 0x3ff; x = (x | (x << 16)) & 0x30000ff; x = (x | (x << 8)) & 0x300f00f; x = (x | (x << 4)) & 0x30c30c3; x = (x | (x << 2)) & 0x9249249; return x; };
function nodi(n) { return { n, pos: new Float64Array(3 * n), cov: new Float64Array(6 * n), w: new Float64Array(n), massa: new Float64Array(n), emis: new Float64Array(3 * n), est: new Float32Array(3 * n), dif: new Float32Array(3 * n), g: new Float32Array(n), P: new Float64Array(3 * n), dir: new Float32Array(3 * n) }; }
const CAMPI = [['pos', 3], ['cov', 6], ['w', 1], ['massa', 1], ['emis', 3], ['est', 3], ['dif', 3], ['g', 1], ['P', 3], ['dir', 3]];
// peso: 'luce' (emissione + potenza diffusa), 'sezione' (estinzione), 'massa'; se per una foglia vale zero si passa al seguente
export function albero(F, { peso = 'luce' } = {}) {
  const pesoDi = (i) => { const e = F.emis[3 * i] + F.emis[3 * i + 1] + F.emis[3 * i + 2] + F.P[3 * i] + F.P[3 * i + 1] + F.P[3 * i + 2], s = F.est[3 * i] + F.est[3 * i + 1] + F.est[3 * i + 2];
    return peso === 'massa' ? F.massa[i] || e || s : peso === 'sezione' ? s || e || F.massa[i] : e || s || F.massa[i]; };
  const tieni = []; for (let i = 0; i < F.n; i++) if (pesoDi(i) > 0) tieni.push(i);
  const n = tieni.length; if (!n) return null;
  // l'ordine di Morton (10 bit per asse) sulla chiave
  const K = F.chiave || F.pos, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const i of tieni) for (let k = 0; k < 3; k++) { const v = K[3 * i + k]; if (v < lo[k]) lo[k] = v; if (v > hi[k]) hi[k] = v; }
  const codice = new Float64Array(F.n); for (const i of tieni) { let c = 0; for (let k = 0; k < 3; k++) c |= allarga(Math.min(1023, Math.floor(((K[3 * i + k] - lo[k]) / (hi[k] - lo[k] || 1)) * 1023.999))) << k; codice[i] = c >>> 0; }
  tieni.sort((a, b) => codice[a] - codice[b]);
  // il livello delle foglie
  let L = nodi(n); for (let j = 0; j < n; j++) { const i = tieni[j]; for (const [c, m] of CAMPI) { if (c === 'w') { L.w[j] = pesoDi(i); continue; } for (let k = 0; k < m; k++) L[c][m * j + k] = F[c][m * i + k]; } }
  const livelli = [L];
  while (L.n > 1) { const m = Math.ceil(L.n / 8), S = nodi(m);
    for (let j = 0; j < m; j++) { const a = 8 * j, b = Math.min(L.n, a + 8); let W = 0, gd = 0, Pt = 0; const mu = [0, 0, 0], cv = [0, 0, 0, 0, 0, 0], dr = [0, 0, 0];
      for (let i = a; i < b; i++) { const w = L.w[i]; W += w; for (let k = 0; k < 3; k++) mu[k] += w * L.pos[3 * i + k]; S.massa[j] += L.massa[i];
        for (let k = 0; k < 3; k++) { S.emis[3 * j + k] += L.emis[3 * i + k]; S.est[3 * j + k] += L.est[3 * i + k]; S.dif[3 * j + k] += L.dif[3 * i + k]; S.P[3 * j + k] += L.P[3 * i + k]; }
        const p = L.P[3 * i] + L.P[3 * i + 1] + L.P[3 * i + 2], d = L.dif[3 * i] + L.dif[3 * i + 1] + L.dif[3 * i + 2]; Pt += p; for (let k = 0; k < 3; k++) dr[k] += p * L.dir[3 * i + k]; gd += d * L.g[i]; }
      for (let k = 0; k < 3; k++) mu[k] /= W;
      for (let i = a; i < b; i++) { const w = L.w[i] / W, dx = L.pos[3 * i] - mu[0], dy = L.pos[3 * i + 1] - mu[1], dz = L.pos[3 * i + 2] - mu[2], c = L.cov;
        cv[0] += w * (c[6 * i] + dx * dx); cv[1] += w * (c[6 * i + 1] + dy * dy); cv[2] += w * (c[6 * i + 2] + dz * dz); cv[3] += w * (c[6 * i + 3] + dx * dy); cv[4] += w * (c[6 * i + 4] + dx * dz); cv[5] += w * (c[6 * i + 5] + dy * dz); }
      S.w[j] = W; S.pos.set(mu, 3 * j); S.cov.set(cv, 6 * j); const dt = S.dif[3 * j] + S.dif[3 * j + 1] + S.dif[3 * j + 2]; S.g[j] = dt > 0 ? gd / dt : 0; if (Pt > 0) S.dir.set(dr.map((x) => x / Pt), 3 * j); }
    livelli.push(S); L = S; }
  // tutto in fila, dall'alto: i figli di un nodo stanno di seguito (figlio, nfigli)
  livelli.reverse(); const off = []; let tot = 0; for (const l of livelli) { off.push(tot); tot += l.n; }
  const T = nodi(tot); T.figlio = new Int32Array(tot).fill(-1); T.nfigli = new Uint8Array(tot); T.traccia = new Float32Array(tot); T.livelli = livelli.length; T.foglie = n; T.inizio = off;
  livelli.forEach((l, h) => { for (const [c, m] of CAMPI) T[c].set(l[c], m * off[h]); if (h < livelli.length - 1) { const sotto = livelli[h + 1].n; for (let j = 0; j < l.n; j++) { T.figlio[off[h] + j] = off[h + 1] + 8 * j; T.nfigli[off[h] + j] = Math.min(8, sotto - 8 * j); } } });
  for (let j = 0; j < tot; j++) T.traccia[j] = T.cov[6 * j] + T.cov[6 * j + 1] + T.cov[6 * j + 2];
  // le radici: il primo livello con almeno 64 nodi (sotto, un nodo copre troppo per decidere da dove si guarda)
  let r = 0; while (r < livelli.length - 1 && livelli[r].n < 64) r++; T.radici = [off[r], off[r] + livelli[r].n];
  return T;
}

// =====================================================================================================
// L'OMBRA E LA LUCE DIFFUSA da sorgenti ferme rispetto all'insieme (si calcola una volta, nel lavoratore)
// =====================================================================================================
// F: le foglie; quali: gli indici delle foglie illuminate da questa sorgente; sorgente: { pos (unità), L: [3] W };
// scala: metri per unità; n: il lato della griglia dell'ombra. Mette in F.P e F.dir la potenza diffusa e la direzione.
// La griglia copre le foglie (±2σ) e la sorgente; vi si depositano le sezioni d'estinzione (nuvola-nella-cella), e per
// ogni foglia si cammina verso la sorgente a passi di mezza cella, sommando κ·ds.
export function illumina(F, quali, sorgente, scala, n = 16) {
  const lo = sorgente.pos.slice(), hi = sorgente.pos.slice();
  for (const i of quali) { const s = 2 * Math.sqrt(Math.max(F.cov[6 * i], F.cov[6 * i + 1], F.cov[6 * i + 2])); for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], F.pos[3 * i + k] - s); hi[k] = Math.max(hi[k], F.pos[3 * i + k] + s); } }
  const lato = Math.max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * 1.0001 || 1, h = lato / n, kap = new Float32Array(3 * n * n * n), vc = h * h * h * scala * scala; // κ per unità di lunghezza (in unità): Σσ/(V_cella·scala²)
  for (const i of quali) { const x = (F.pos[3 * i] - lo[0]) / h - 0.5, y = (F.pos[3 * i + 1] - lo[1]) / h - 0.5, z = (F.pos[3 * i + 2] - lo[2]) / h - 0.5, i0 = Math.floor(x), j0 = Math.floor(y), k0 = Math.floor(z);
    for (let c = 0; c < 8; c++) { const a = i0 + (c & 1), b = j0 + ((c >> 1) & 1), d = k0 + (c >> 2); if (a < 0 || b < 0 || d < 0 || a >= n || b >= n || d >= n) continue; const w = (c & 1 ? x - i0 : 1 - x + i0) * ((c >> 1) & 1 ? y - j0 : 1 - y + j0) * (c >> 2 ? z - k0 : 1 - z + k0), o = 3 * ((d * n + b) * n + a); for (let q = 0; q < 3; q++) kap[o + q] += (w * F.est[3 * i + q]) / vc; } }
  const leggi = (x, y, z, o) => { x = x / h - 0.5; y = y / h - 0.5; z = z / h - 0.5; const i0 = Math.floor(x), j0 = Math.floor(y), k0 = Math.floor(z); o[0] = o[1] = o[2] = 0;
    for (let c = 0; c < 8; c++) { const a = i0 + (c & 1), b = j0 + ((c >> 1) & 1), d = k0 + (c >> 2); if (a < 0 || b < 0 || d < 0 || a >= n || b >= n || d >= n) continue; const w = (c & 1 ? x - i0 : 1 - x + i0) * ((c >> 1) & 1 ? y - j0 : 1 - y + j0) * (c >> 2 ? z - k0 : 1 - z + k0), q = 3 * ((d * n + b) * n + a); o[0] += w * kap[q]; o[1] += w * kap[q + 1]; o[2] += w * kap[q + 2]; } };
  const k3 = [0, 0, 0], sp = sorgente.pos, L = sorgente.L;
  for (const i of quali) { const dx = F.pos[3 * i] - sp[0], dy = F.pos[3 * i + 1] - sp[1], dz = F.pos[3 * i + 2] - sp[2], r = Math.hypot(dx, dy, dz); if (!(r > 0)) continue;
    const passi = Math.max(1, Math.ceil((2 * r) / h)), ds = r / passi, tau = [0, 0, 0];
    for (let s = 0; s < passi; s++) { const f = (s + 0.5) / passi; leggi(sp[0] + dx * f - lo[0], sp[1] + dy * f - lo[1], sp[2] + dz * f - lo[2], k3); for (let q = 0; q < 3; q++) tau[q] += k3[q] * ds; }
    const r2 = (r * scala) ** 2; for (let q = 0; q < 3; q++) F.P[3 * i + q] = ((L[q] / (4 * PI * r2)) * Math.exp(-tau[q])) * F.dif[3 * i + q];
    F.dir[3 * i] = dx / r; F.dir[3 * i + 1] = dy / r; F.dir[3 * i + 2] = dz / r; }
}

// =====================================================================================================
// LO STRATO: il taglio dell'albero, l'ordine, la scheda grafica
// =====================================================================================================
const V_Q = `out vec2 v_uv; void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const F_COPIA = `in vec2 v_uv; uniform sampler2D u_img; out vec4 o_col; void main() { o_col = vec4(texture(u_img, v_uv).rgb, 0.0); }`;
// (i due modi di comporre: 0 si somma; 1 estinzione grigia; 2+c il canale c)
const GLSL_USCITA = `
uniform int u_modo;
vec4 uscita(vec3 E, vec3 tau) {
  if (u_modo == 0) return vec4(E, 0.0);
  vec3 a = 1.0 - exp(-tau), f = mix(vec3(1.0), a / max(tau, vec3(1e-6)), step(1e-4, tau)); // (dentro la campana la luce nata si estingue anch'essa: (1−e^−τ)/τ)
  if (u_modo == 1) return vec4(E * f.g, a.g);
  return vec4(E * f, u_modo == 2 ? a.r : u_modo == 3 ? a.g : a.b);
}`;
const V_SPLAT = `
in vec4 a0, a1, a2, a3;   // a0: centro (assi dell'occhio, unità); a1: Σxx Σyy Σzz Σxy; a2: Σxz Σyz k.r k.g; a3: k.b s.r s.g s.b
uniform vec4 u_cam;       // f (pixel dell'immagine), larghezza, altezza, 0
uniform float u_fc;
out vec2 v_d; out vec3 v_con; out float v_norm, v_r2, v_w; out vec3 v_k, v_s;
void main() {
  vec3 p = a0.xyz; float z = -p.z, f = u_cam.x;
  if (z <= 1e-30) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  mat3 S = mat3(a1.x, a1.w, a2.x, a1.w, a1.y, a2.y, a2.x, a2.y, a1.z);
  vec3 j1 = vec3(f / z, 0.0, f * p.x / (z * z)), j2 = vec3(0.0, f / z, f * p.y / (z * z)), s1 = S * j1, s2 = S * j2;
  float a = dot(j1, s1) + ${PIX2}, b = dot(j1, s2), c = dot(j2, s2) + ${PIX2}, det = max(a * c - b * b, 1e-12);
  float m = 0.5 * (a + c), dd = sqrt(max(0.0, m * m - det)), l1 = m + dd, l2 = max(m - dd, ${PIX2});
  vec2 e1 = abs(b) > 1e-9 * l1 ? normalize(vec2(b, l1 - a)) : (a >= c ? vec2(1.0, 0.0) : vec2(0.0, 1.0)), e2 = vec2(-e1.y, e1.x);
  float lim = 2.0 * max(u_cam.y, u_cam.z); // (oltre due schermi la campana non serve: il quadrato si tronca, la campana no)
  vec2 k = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1)) * 2.0 - 1.0, off = k.x * e1 * min(lim, ${RT} * sqrt(l1)) + k.y * e2 * min(lim, ${RT} * sqrt(l2));
  vec2 pix = vec2(f * p.x / z, f * p.y / z) + off;
  v_d = off; v_con = vec3(c, -b, a) / det; v_norm = 1.0 / (6.2831853 * sqrt(det) * ((1.0 - ${ET}) - ${ET} * ${(RT * RT) / 2}));
  v_r2 = dot(p, p); v_k = vec3(a2.z, a2.w, a3.x); v_s = a3.yzw;
  gl_Position = vec4(pix / (0.5 * u_cam.yz) * z, 0.0, z);
  ${GLSL_PROFONDITA_V}
}`;
const F_SPLAT = `
in vec2 v_d; in vec3 v_con; in float v_norm, v_r2, v_w; in vec3 v_k, v_s; out vec4 o_col;
uniform vec4 u_cam; uniform float u_fc;
${GLSL_USCITA}
void main() {
  float q = v_con.x * v_d.x * v_d.x + 2.0 * v_con.y * v_d.x * v_d.y + v_con.z * v_d.y * v_d.y; if (q > ${RT * RT}) discard;
  float g = (exp(-0.5 * q) - ${ET}) * v_norm;                              // la parte del flusso in questo pixel
  vec3 r = vec3((gl_FragCoord.xy - 0.5 * u_cam.yz) / u_cam.x, -1.0); float c3 = pow(inversesqrt(dot(r, r)), 3.0); // cos³θ: l'angolo solido del pixel
  float fac = g * u_cam.x * u_cam.x / (v_r2 * c3);
  o_col = uscita(v_k * fac, v_s * fac);
  ${GLSL_PROFONDITA_F}
}`;
// da dentro: la somma lungo il raggio in forma chiusa, per i (al più ${MAX_VICINI}) splat che contengono l'occhio
const F_VICINI = `
in vec2 v_uv; out vec4 o_col;
uniform vec4 u_cam; uniform int u_n;
uniform vec4 u_c[${MAX_VICINI}], u_i1[${MAX_VICINI}], u_i2[${MAX_VICINI}], u_k[${MAX_VICINI}], u_s[${MAX_VICINI}]; // centro; Σ⁻¹ (xx yy zz xy | xz yz, norma); k; s
${GLSL_USCITA}
float erfcp(float x) { float t = 1.0 / (1.0 + 0.3275911 * x); return t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * exp(-x * x); }
float erfc_(float x) { return x >= 0.0 ? erfcp(x) : 2.0 - erfcp(-x); }
void main() {
  vec3 d = normalize(vec3((v_uv - 0.5) * u_cam.yz / u_cam.x, -1.0)), E = vec3(0.0), tau = vec3(0.0);
  for (int i = 0; i < ${MAX_VICINI}; i++) { if (i >= u_n) break;
    mat3 Si = mat3(u_i1[i].x, u_i1[i].w, u_i2[i].x, u_i1[i].w, u_i1[i].y, u_i2[i].y, u_i2[i].x, u_i2[i].y, u_i1[i].z); vec3 m = u_c[i].xyz, Sd = Si * d;
    float A = dot(d, Sd), B = dot(m, Sd), C = dot(m, Si * m), I = exp(-0.5 * (C - B * B / A)) * sqrt(3.14159265 / (2.0 * A)) * erfc_(-B / sqrt(2.0 * A)) * u_i2[i].z;
    E += u_k[i].xyz * I; tau += u_s[i].xyz * I; }
  o_col = uscita(E, tau);
}`;

// N.vista.splat: true | { pixel, massimo, riduzione }
export const costoSplat = (N) => { const c = N.vista.splat && typeof N.vista.splat === 'object' ? N.vista.splat : {}; return { pixel: c.pixel ?? 1.5, massimo: c.massimo ?? 150000, riduzione: c.riduzione ?? N.vista.riduzione ?? 2 }; };

// modo: 'emissione' (si sommano: niente ordine, nella passata 'fondo', su un'immagine più piccola) | 'mezzo' (estinguono:
// ordinati da dietro in avanti, in 'velato', sull'immagine intera, dietro ai solidi)
export function creaSplat(N, { modo = 'mezzo' } = {}) {
  const gl = N.gl, stato = { disegnati: 0, vicini: 0, visitati: 0, ms: 0, passate: 0, canali: false }; let insiemi = [];
  let prg = null, prgV = null, prgC = null, vao = null, buf = null, cap = 0, dati = new Float32Array(16 * 4096), chiavi = new Float32Array(4096), ordine = new Uint32Array(4096), appoggio = new Float32Array(0), n = 0;
  let img = null, tel = null, tw = 0, th = 0; const vic = [];
  const u4 = (k) => new Float32Array(4 * MAX_VICINI), U = { c: u4(), i1: u4(), i2: u4(), k: u4(), s: u4() };
  function spazio(m) { if (m * 16 <= dati.length) return; const nd = new Float32Array(Math.max(m, 2 * dati.length / 16) * 16); nd.set(dati); dati = nd; chiavi = new Float32Array(nd.length / 16); }
  // ---- il taglio: dall'alto, si apre un nodo se sullo schermo è più largo di `pixel` (1σ), se contiene l'occhio, finché ci sta
  function taglia(S, ins, C, E0) {
    const T = ins.albero; if (!T) return; const sc = ins.scala, P = ins.periodo || 0, A = S.assi, q = N.quadro(ins.corpo, S.t) || V.identita(), rel = S.versoCorpo(ins.corpo, [0, 0, 0]);
    const e = V.per(V.tv(q, rel), -1 / sc), M = V.mm(V.trasposta(A), q), f = S.fuoco, tX = S.tanX * 1.02, tY = S.tanY * 1.02, lontano = ins.lontano || Infinity;
    const k4 = 1 / (4 * E0 * sc * sc), s2 = 1 / (sc * sc);
    let coda = [], prossima = [];
    // le radici, con le immagini del toro che servono (entro `lontano`)
    for (let j = T.radici[0]; j < T.radici[1]; j++) { const o = [0, 0, 0]; if (P) for (let k = 0; k < 3; k++) o[k] = Math.round((e[k] - T.pos[3 * j + k]) / P) * P;
      if (!P || !ins.immagini) { coda.push(j, o[0], o[1], o[2]); continue; } const R = RT * Math.sqrt(T.traccia[j]);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) { const x = o[0] + a * P, y = o[1] + b * P, z = o[2] + c * P; if (Math.hypot(T.pos[3 * j] + x - e[0], T.pos[3 * j + 1] + y - e[1], T.pos[3 * j + 2] + z - e[2]) - R < lontano) coda.push(j, x, y, z); } }
    let fatti = 0;
    while (coda.length) {
      for (let u = 0; u < coda.length; u += 4) { const j = coda[u], ox = coda[u + 1], oy = coda[u + 2], oz = coda[u + 3]; stato.visitati++;
        const dx = T.pos[3 * j] + ox - e[0], dy = T.pos[3 * j + 1] + oy - e[1], dz = T.pos[3 * j + 2] + oz - e[2], d2 = dx * dx + dy * dy + dz * dz, sg = Math.sqrt(T.traccia[j]), R = RT * sg, d = Math.sqrt(d2);
        const ex = M[0] * dx + M[1] * dy + M[2] * dz, ey = M[3] * dx + M[4] * dy + M[5] * dz, ez = M[6] * dx + M[7] * dy + M[8] * dz, prof = -ez;
        if (prof + R <= 0 || d - R > lontano) continue;
        if (Math.abs(ex) > tX * Math.max(0, prof) + 1.5 * R || Math.abs(ey) > tY * Math.max(0, prof) + 1.5 * R) continue;
        const dentro = d < R, nf = T.nfigli[j];
        if (nf && ((sg * f) / d > C.pixel || dentro) && fatti + coda.length / 4 + prossima.length / 4 + nf < C.massimo) { const c0 = T.figlio[j]; for (let c = 0; c < nf; c++) prossima.push(c0 + c, ox, oy, oz); continue; }
        // la luce verso l'occhio: la propria, più quella diffusa (fusa per momenti: vedi sopra), più la stella del nucleo (senza ombra)
        let L0 = T.emis[3 * j], L1 = T.emis[3 * j + 1], L2 = T.emis[3 * j + 2]; const Pt = T.P[3 * j] + T.P[3 * j + 1] + T.P[3 * j + 2];
        if (Pt > 0) { const g = T.g[j], cs = -(T.dir[3 * j] * dx + T.dir[3 * j + 1] * dy + T.dir[3 * j + 2] * dz) / d, w = nf ? Math.max(0, 1 + 3 * g * cs) : 4 * PI * faseHG(g, cs); L0 += T.P[3 * j] * w; L1 += T.P[3 * j + 1] * w; L2 += T.P[3 * j + 2] * w; }
        if (ins.stella && S.stella && T.dif[3 * j] + T.dif[3 * j + 1] + T.dif[3 * j + 2] > 0) { const Ls = S.stella.luminosita || 0, cs0 = S.coloreStella;
          if (Ls > 0) { const sv = V.per(V.tv(q, V.per(S.versoStella, S.distanzaStella)), 1 / sc), rx = dx - sv[0], ry = dy - sv[1], rz = dz - sv[2], r = Math.hypot(rx, ry, rz), Fq = Ls / (4 * PI * (r * sc) ** 2), cs = -(rx * dx + ry * dy + rz * dz) / (r * d), w = 4 * PI * faseHG(T.g[j], cs);
            L0 += Fq * cs0[0] * T.dif[3 * j] * w; L1 += Fq * cs0[1] * T.dif[3 * j + 1] * w; L2 += Fq * cs0[2] * T.dif[3 * j + 2] * w; } }
        const cono = ins.luce ? ins.luce(d) : 1; if (!(cono > 0) && !(T.est[3 * j] > 0)) continue;
        const kk = k4 * cono, c6 = 6 * j, cv = T.cov;
        // Σ negli assi dell'occhio: M·Σ·Mᵀ
        const xx = cv[c6], yy = cv[c6 + 1], zz = cv[c6 + 2], xy = cv[c6 + 3], xz = cv[c6 + 4], yz = cv[c6 + 5], o = [0, 0, 0, 0, 0, 0];
        const rM = (r) => { const a = M[3 * r], b = M[3 * r + 1], c = M[3 * r + 2]; return [a * xx + b * xy + c * xz, a * xy + b * yy + c * yz, a * xz + b * yz + c * zz]; }, t0 = rM(0), t1 = rM(1), t2 = rM(2), per = (t, s) => t[0] * M[3 * s] + t[1] * M[3 * s + 1] + t[2] * M[3 * s + 2];
        o[0] = per(t0, 0); o[1] = per(t1, 1); o[2] = per(t2, 2); o[3] = per(t0, 1); o[4] = per(t0, 2); o[5] = per(t1, 2);
        if (dentro) { // l'occhio dentro la campana (a meno di 3,3σ di Mahalanobis): la somma lungo il raggio, a parte
          const [a, b, c, dd, ee, ff] = o, i00 = b * c - ff * ff, i01 = ee * ff - dd * c, i02 = dd * ff - b * ee, det = a * i00 + dd * i01 + ee * i02;
          if (det > 0) { const i11 = a * c - ee * ee, i12 = dd * ee - a * ff, i22 = a * b - dd * dd, m2 = (ex * (i00 * ex + i01 * ey + i02 * ez) + ey * (i01 * ex + i11 * ey + i12 * ez) + ez * (i02 * ex + i12 * ey + i22 * ez)) / det;
            if (m2 < RT * RT) { vic.push({ m2, c: [ex, ey, ez], i: [i00 / det, i11 / det, i22 / det, i01 / det, i02 / det, i12 / det, 1 / ((2 * PI) ** 1.5 * Math.sqrt(det))], k: [L0 * kk, L1 * kk, L2 * kk], s: [T.est[3 * j] * s2, T.est[3 * j + 1] * s2, T.est[3 * j + 2] * s2] }); continue; } } }
        spazio(n + 1); const p = 16 * n; dati[p] = ex; dati[p + 1] = ey; dati[p + 2] = ez; dati[p + 3] = 0; dati[p + 4] = o[0]; dati[p + 5] = o[1]; dati[p + 6] = o[2]; dati[p + 7] = o[3]; dati[p + 8] = o[4]; dati[p + 9] = o[5];
        dati[p + 10] = L0 * kk; dati[p + 11] = L1 * kk; dati[p + 12] = L2 * kk; dati[p + 13] = T.est[3 * j] * s2; dati[p + 14] = T.est[3 * j + 1] * s2; dati[p + 15] = T.est[3 * j + 2] * s2;
        if (dati[p + 13] !== dati[p + 14] || dati[p + 14] !== dati[p + 15]) stato.canali = true;
        chiavi[n] = d; n++; fatti++; }
      coda = prossima; prossima = []; }
  }
  // l'ordine da dietro in avanti: conteggio su 16 bit del logaritmo della distanza (lineare nel numero)
  function ordina() {
    if (ordine.length < n) ordine = new Uint32Array(dati.length / 16); let lo = Infinity, hi = -Infinity; for (let i = 0; i < n; i++) { const v = Math.log(chiavi[i] || 1e-30); chiavi[i] = v; if (v < lo) lo = v; if (v > hi) hi = v; }
    const B = 65536, conta = new Uint32Array(B), k = (B - 1) / (hi - lo || 1), kk = new Uint16Array(n); for (let i = 0; i < n; i++) { kk[i] = (B - 1) - Math.floor((chiavi[i] - lo) * k); conta[kk[i]]++; }
    for (let b = 1; b < B; b++) conta[b] += conta[b - 1]; for (let i = n - 1; i >= 0; i--) ordine[--conta[kk[i]]] = i;
    if (appoggio.length < 16 * n) appoggio = new Float32Array(dati.length); for (let i = 0; i < n; i++) appoggio.set(dati.subarray(16 * ordine[i], 16 * ordine[i] + 16), 16 * i); const x = dati; dati = appoggio; appoggio = x;
  }
  function prepara() {
    prg = N.programma(V_SPLAT, F_SPLAT); prgV = N.programma(V_Q, F_VICINI); prgC = N.programma(V_Q, F_COPIA);
    vao = gl.createVertexArray(); buf = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    for (let a = 0; a < 4; a++) { const l = gl.getAttribLocation(prg.p, 'a' + a); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, 4, gl.FLOAT, false, 64, 16 * a); gl.vertexAttribDivisor(l, 1); }
    gl.bindVertexArray(null);
  }
  function passate(S, w, h, f, vicini) {
    const canali = modo === 'mezzo' ? (stato.canali ? [2, 3, 4] : [1]) : [0]; stato.passate = canali.length;
    for (const m of canali) {
      if (m >= 2) gl.colorMask(m === 2, m === 3, m === 4, false);
      if (n) { gl.useProgram(prg.p); gl.uniform4f(prg.u.u_cam, f, w, h, 0); gl.uniform1f(prg.u.u_fc, S.fc); gl.uniform1i(prg.u.u_modo, m); gl.bindVertexArray(vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n); gl.bindVertexArray(null); }
      if (vicini) { gl.disable(gl.DEPTH_TEST); gl.useProgram(prgV.p); gl.uniform4f(prgV.u.u_cam, f, w, h, 0); gl.uniform1i(prgV.u.u_n, vicini); gl.uniform1i(prgV.u.u_modo, m);
        gl.uniform4fv(prgV.u.u_c, U.c); gl.uniform4fv(prgV.u.u_i1, U.i1); gl.uniform4fv(prgV.u.u_i2, U.i2); gl.uniform4fv(prgV.u.u_k, U.k); gl.uniform4fv(prgV.u.u_s, U.s); S.schermo(); if (modo === 'mezzo') gl.enable(gl.DEPTH_TEST); }
    }
    gl.colorMask(true, true, true, true);
  }
  const L = {
    nome: 'splat', stato, insiemi: () => insiemi,
    // insiemi: [{ albero, corpo (il riferimento del nucleo), scala (metri per unità), periodo (unità: lo spazio si richiude),
    //   immagini (con periodo: anche le copie entro `lontano`), lontano (unità), luce(d) (fattore per la distanza in unità:
    //   il cono di luce), stella (la stella del nucleo illumina chi diffonde) }]
    metti(lista) { insiemi = lista.filter((x) => x && x.albero); N.cambia(); },
    aggiorna(S) {
      const t0 = performance.now(), C = costoSplat(N); n = 0; vic.length = 0; stato.visitati = 0; stato.canali = false;
      for (const ins of insiemi) taglia(S, ins, C, S.E0);
      if (modo === 'mezzo' && n > 1) ordina();
      vic.sort((a, b) => a.m2 - b.m2); const nv = Math.min(MAX_VICINI, vic.length);
      for (let i = 0; i < nv; i++) { const v = vic[i]; U.c.set([...v.c, 0], 4 * i); U.i1.set([v.i[0], v.i[1], v.i[2], v.i[3]], 4 * i); U.i2.set([v.i[4], v.i[5], v.i[6], 0], 4 * i); U.k.set([...v.k, 0], 4 * i); U.s.set([...v.s, 0], 4 * i); if (v.s[0] !== v.s[1] || v.s[1] !== v.s[2]) stato.canali = true; }
      stato.vicini = nv; stato.persiVicini = vic.length - nv; stato.disegnati = n;
      if (!prg) prepara(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); if (16 * n > cap) { cap = Math.max(16 * n, 2 * cap); gl.bufferData(gl.ARRAY_BUFFER, cap * 4, gl.DYNAMIC_DRAW); } if (n) gl.bufferSubData(gl.ARRAY_BUFFER, 0, dati, 0, 16 * n);
      stato.ms = performance.now() - t0;
    },
    disegna(S) {
      if (!prg || (!n && !stato.vicini)) return;
      if (modo === 'emissione') { // sull'immagine piccola, poi sommata a ciò che c'è
        const r = Math.max(1, costoSplat(N).riduzione), w = Math.max(8, Math.ceil(S.W / r)), h = Math.max(8, Math.ceil(S.H / r));
        if (w !== tw || h !== th) { if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } tw = w; th = h; img = N.immagine(w, h, 'rgba16f', null); tel = N.telaio(img, null); }
        const prima = gl.getParameter(gl.FRAMEBUFFER_BINDING), dt = gl.isEnabled(gl.DEPTH_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, tel); gl.viewport(0, 0, w, h); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); passate(S, w, h, (S.fuoco * h) / S.H, stato.vicini);
        gl.bindFramebuffer(gl.FRAMEBUFFER, prima); gl.viewport(0, 0, S.W, S.H); gl.useProgram(prgC.p); N.lega(0, img, prgC.u.u_img); S.schermo(); gl.disable(gl.BLEND); if (dt) gl.enable(gl.DEPTH_TEST);
        return; }
      // 'mezzo': sull'immagine intera, da dietro in avanti, dietro ai solidi (la profondità logaritmica del nucleo)
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); passate(S, S.W, S.H, S.fuoco, stato.vicini);
    },
    // l'immagine dei soli emettitori dell'ultimo fotogramma (canali lineari, unità del nucleo): per la prova di convergenza
    immagine() { if (!tel) return null; const prima = gl.getParameter(gl.FRAMEBUFFER_BINDING), d = new Float32Array(4 * tw * th); gl.bindFramebuffer(gl.FRAMEBUFFER, tel); gl.readPixels(0, 0, tw, th, gl.RGBA, gl.FLOAT, d); gl.bindFramebuffer(gl.FRAMEBUFFER, prima); return { w: tw, h: th, dati: d }; },
    libera() { if (prg) { gl.deleteProgram(prg.p); gl.deleteProgram(prgV.p); gl.deleteProgram(prgC.p); gl.deleteBuffer(buf); gl.deleteVertexArray(vao); } if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } },
  };
  return L;
}
// rimettere insieme un albero arrivato da un altro filo
export function alberoDa(m) {
  const T = { pos: new Float64Array(m.pos), cov: new Float64Array(m.cov), w: new Float64Array(m.w), massa: new Float64Array(m.massa), emis: new Float64Array(m.emis), est: new Float32Array(m.est), dif: new Float32Array(m.dif), g: new Float32Array(m.g), P: new Float64Array(m.P), dir: new Float32Array(m.dir), figlio: new Int32Array(m.figlio), nfigli: new Uint8Array(m.nfigli), traccia: new Float32Array(m.traccia), radici: m.radici, foglie: m.foglie, livelli: m.livelli };
  return T;
}
export const alberoPerFilo = (T) => ({ pos: T.pos.buffer, cov: T.cov.buffer, w: T.w.buffer, massa: T.massa.buffer, emis: T.emis.buffer, est: T.est.buffer, dif: T.dif.buffer, g: T.g.buffer, P: T.P.buffer, dir: T.dir.buffer, figlio: T.figlio.buffer, nfigli: T.nfigli.buffer, traccia: T.traccia.buffer, radici: T.radici, foglie: T.foglie, livelli: T.livelli });
