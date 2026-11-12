// splat.worker.js — gli SPLAT che la fisica dà, preparati fuori dal filo dell'interfaccia (splat.js li disegna).
//
// { tipo: 'ragnatela', n, cosmo, t, D, celle, regione: null | { centro, lato } (m comoventi), kmax, luce, tinta, escludi }
//   → ogni ELEMENTO DI MATERIA (un nodo della griglia lagrangiana celle³: tutti della stessa massa) è uno splat:
//   · dove: x = q + D·Ψ(q) (Zel'dovich), Ψ = −∇φ con ∇²φ = δ; ragnatela.js dà δ e le derivate seconde di φ nei nodi (il
//     tensore di marea); Ψ si risolve con la trasformata (vedi `spostamento`). La luce degli aloni è lo stesso conto di
//     volume.worker.js, qui ripetuto (quella funzione non è esportata — DIFETTO dichiarato, regola 13: un posto solo);
//   · la forma: il cubetto lagrangiano di lato h ha secondo momento h²/12 per asse; ma una fila di campane così strette
//     (σ = 0,29·h) su un reticolo non fa un continuo: resta un'increspatura del 39% (2·e^(−2π²σ²/h²)), che di taglio si
//     vede come righe parallele (le file del reticolo). Il campo letto sul reticolo si ricostruisce interpolando
//     (trilineare, come il deposito del volume): il nucleo a tenda ha varianza h²/6, e l'elemento è il cubetto
//     convoluto con lui: σ² = h²/12 + h²/6 = h²/4 (increspatura 1,4%). È una scelta di DISCRETIZZAZIONE, non di forma:
//     sparisce con h → 0 (la prova di convergenza lo misura). La mappa x(q) ha jacobiano ∂x/∂q = I − D·φ_ij, e
//     l'elemento diventa l'ellissoide di Zel'dovich: Σ = (h²/4)(I − Dφ)². (I padri della gerarchia restano fusioni
//     esatte per momenti dei figli: la ricostruzione si applica una volta, alle foglie.)
//     Dove Dλ > 1 gli strati si sono incrociati e (1 − Dλ)² ricresce: la regione a più flussi di Zel'dovich (vedi sotto);
//   · la luce: quella delle galassie attese in lui (ragnatela.js `aloniAttesi`, Press–Schechter condizionata
//     all'ambiente, gli stessi 64 punti e la stessa interpolazione su δ di volume.worker.js), rapportata alla media:
//     luce di un elemento = luce di tutta la nebbia × (volume della regione) × peso/N.
//   La regione fine (attorno a chi guarda) usa il campo più fine (kmax); la grossa, se `escludi`, toglie gli elementi
//   la cui q sta nella regione fine (la loro massa è là).
// { tipo: 'escludi', n, escludi } → la grana grossa già fatta, senza gli elementi in `escludi` (solo l'albero si rifà).
// { tipo: 'nebulose', n, cosmo, galassia, t, occhio (m), fuoco, pixel, regioneKpc }
//   → gli oggetti di vuoto.js (scenaGalassia().vuoto) come splat, in parsec, nel riferimento della galassia:
//   · ogni oggetto è una sfera uniforme di raggio R (come la dà il modello): un solo splat (σ² = R²/5, il secondo
//     momento della sfera) o, se sullo schermo sarebbe più largo di `pixel`, m³ cubetti dentro la sfera (m fino a 16);
//   · REGIONI H II, PLANETARIE, RESTI (fase radiativa): emettono la luce visibile delle loro righe (W = brillanza·4π²R²),
//     col colore che le righe danno all'occhio (splat.js `canali`);
//   · NEBULOSE A RIFLESSIONE: la polvere della nube madre attorno alla stella che la illumina (al centro). Non si usa la
//     luce già diffusa del modello: si rifà il conto. Profondità ottica dalla luce che il modello dice diffusa,
//     W = vis·albedo·(1 − e^−τ) → τ (vis: la luce visibile della stella, vuoto_mezzo.js `parteDiLuce`); per canale
//     τ_c = τ·⟨A_λ/A_V⟩ sullo spettro della stella (la polvere del modello, `polvere(1).estinzione`); albedo 0,6 (MEZZO,
//     Draine 2003). L'ombra di ogni cubetto verso la stella su una griglia (splat.js `illumina`). La stella è uno splat
//     puntiforme con la sua luce visibile;
//   · NUBI MOLECOLARI: solo estinzione: σ = 0,921·A_V·(2/3)πR² (la stessa colonna media di volume.worker.js), per canale
//     con ⟨A_λ/A_V⟩ su uno spettro piatto. Diffondono anche (albedo 0,6), ma della luce diffusa della galassia, che qui
//     non è una sorgente: non diffondono niente (DIFETTO dichiarato).
import { albero, alberoPerFilo, foglie, illumina, canali, perCanale, planck } from './splat.js';
import { classiSuGriglia, campoDi, raffina, ondeDi, aloniAttesi, dentro as DR } from '../camera/ragnatela.js';
import { galassiaAlTempo } from '../camera/galassie.js';
import { cosmo as cosmoDi } from '../camera/cosmo.js';
import { scenaGalassia, ANNI_OGGI } from '../camera/spazio3d.js';
import { MEZZO, polvere, parteDiLuce } from '../camera/vuoto_mezzo.js';

const PC = 3.0857e16, KPC = 1e3 * PC, PI = Math.PI;
// [R] Draine 2003 (ARA&A 41, 241, fig. 11): ⟨cos θ⟩ dei grani interstellari a 550 nm ≈ 0,54. MANCA in vuoto_mezzo.js
// (MEZZO.albedo c'è, l'asimmetria no): è scritto qui finché non è là (regola 7, una fonte).
const G_POLVERE = 0.54;

// la trasformata di Fourier a tre dimensioni (radice 2, sul posto, righe copiate in un appoggio)
function fft1(re, im, n, inv) {
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
  for (let l = 2; l <= n; l <<= 1) { const a = ((inv ? 2 : -2) * PI) / l, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += l) { let cr = 1, ci = 0; for (let k = 0; k < l / 2; k++) { const u = i + k, v = u + l / 2, xr = re[v] * cr - im[v] * ci, xi = re[v] * ci + im[v] * cr; re[v] = re[u] - xr; im[v] = im[u] - xi; re[u] += xr; im[u] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } }
}
function fft3(re, im, N, inv) { const r = new Float64Array(N), i2 = new Float64Array(N);
  for (const [passo, altri] of [[1, [N, N * N]], [N, [1, N * N]], [N * N, [1, N]]]) for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) { const o = a * altri[0] + b * altri[1]; for (let k = 0; k < N; k++) { r[k] = re[o + k * passo]; i2[k] = im[o + k * passo]; } fft1(r, i2, N, inv); for (let k = 0; k < N; k++) { re[o + k * passo] = r[k]; im[o + k * passo] = i2[k]; } }
  if (inv) { const s = 1 / (N * N * N); for (let k = 0; k < re.length; k++) { re[k] *= s; im[k] *= s; } } }
function spostamento(delta, n, h) {
  const N = 2 * n, N3 = N * N * N, dr = new Float64Array(N3), di = new Float64Array(N3), out = [0, 1, 2].map(() => new Float32Array(n * n * n)), kk = (m) => ((m <= N / 2 ? m : m - N) * 2 * PI) / (N * h);
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) dr[(k * N + j) * N + i] = delta[(k * n + j) * n + i];
  fft3(dr, di, N, false); const re = new Float64Array(N3), im = new Float64Array(N3);
  for (let c = 0; c < 3; c++) { for (let z = 0; z < N; z++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const o = (z * N + y) * N + x, kx = kk(x), ky = kk(y), kz = kk(z), k2 = kx * kx + ky * ky + kz * kz, kc = c === 0 ? kx : c === 1 ? ky : kz;
      if (!(k2 > 0)) { re[o] = im[o] = 0; continue; } re[o] = (-kc * di[o]) / k2; im[o] = (kc * dr[o]) / k2; } // i·k·δ/k²
    fft3(re, im, N, true); for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out[c][(k * n + j) * n + i] = re[(k * N + j) * N + i]; }
  return out;
}

let grossa = null; // { F, q: Float32Array (q in frazioni), meta } l'ultima grana grossa, per rifarne l'albero senza la regione fine

function elementi(d) {
  const C = campoDi(d.cosmo), O = C ? null : ondeDi(d.cosmo), campo = C ? d.cosmo : d.kmax > O.kmax ? raffina(d.cosmo, d.kmax) : O, dettaglio = d.dettaglio || (C && d.regione && d.kmax ? C.toroM / d.kmax : null), TM = (C || O).toroM, reg = d.regione ? { centro: d.regione.centro, lato: d.regione.lato, celle: d.celle } : null;
  const G = classiSuGriglia(campo, reg, { celle: d.celle, dettaglio }), n = G.n, n2 = n * n, Fc = G.campo, h = G.passo;
  // Ψ = −∇φ con ∇²φ = δ, risolta con la trasformata su una griglia doppia riempita di zeri (Ψ_k = i·k·δ_k/k²): la soluzione
  // nello spazio libero della regione, senza l'accumulo d'errore dell'integrazione lungo le file (che in volume.worker.js
  // lascia righe sfasate: con splat sottili si vedono come strisce). Fuori dalla regione il campo è preso nullo: l'errore
  // sta vicino al bordo (DICHIARATO); il campo del modello non si richiude, e nemmeno questa soluzione.
  const P = spostamento(G.delta, n, h), q = (i, j, k) => (k * n + j) * n + i;
  // la luce: le galassie attese (come volume.worker.js)
  let peso = null, legge = null;
  if (d.aloni !== false) try { const forme = cosmoDi(d.cosmo).galassie.map((x) => galassiaAlTempo(x.forma, ANNI_OGGI / 1e9 + (d.t || 0) / (1e9 * 3.15576e7))).filter((x) => x.esiste && x.massaAlone > 0), m0 = Math.min(...forme.map((x) => x.massaAlone)), m1 = Math.max(...forme.map((x) => x.massaAlone));
    const NB = 10, fasce = Array.from({ length: NB }, (_, b) => [m0 * (m1 / m0) ** (b / NB), m0 * (m1 / m0) ** ((b + 1) / NB)]), tab = [], passo = Math.max(1, Math.floor((n * n2) / 64));
    for (let a = Math.floor(passo / 2); a < n * n2; a += passo) { const i = a % n, j = Math.floor(a / n) % n, k = Math.floor(a / n2), r = aloniAttesi(campo, [(G.origine[0] + i * h) * TM, (G.origine[1] + j * h) * TM, (G.origine[2] + k * h) * TM], 0.62 * G.latoCellaM, { fasce, t: d.t || 0 });
      tab.push([G.delta[a], r.fasce.reduce((s, f) => s + f.perMpc3DiMateria * Math.sqrt(f.da * f.a), 0)]); }
    tab.sort((x, y) => x[0] - y[0]); peso = new Float32Array(n * n2); let media = 0;
    for (let a = 0; a < n * n2; a++) { const x = G.delta[a]; let lo = 0, hi = tab.length - 1; if (x <= tab[0][0]) hi = 0; else if (x >= tab[hi][0]) lo = hi; else { while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tab[m][0] <= x) lo = m; else hi = m; } }
      const f = lo === hi || tab[hi][0] === tab[lo][0] ? tab[lo][1] : tab[lo][1] + ((tab[hi][1] - tab[lo][1]) * (x - tab[lo][0])) / (tab[hi][0] - tab[lo][0]); peso[a] = Math.max(0, f); media += peso[a]; }
    media /= n * n2; if (media > 0) for (let a = 0; a < n * n2; a++) peso[a] /= media; else peso = null; legge = { aloniDa: m0, aloniA: m1, punti: tab.length };
  } catch (e) { peso = null; legge = { errore: String(e) }; }
  else legge = { senzaAloni: true }; // (per la prova di convergenza: la luce con la massa, così conta solo la geometria)
  // le foglie: in frazioni del toro (le unità dell'insieme; splat.js le porta in metri con toroM·a)
  const N3 = n * n2, F = foglie(N3), lam = [0, 0, 0]; let crollati = 0; const D = d.D ?? 1, s0 = (h * h) / 4, volume = d.regione ? (n * h) ** 3 : 1, Le = (d.luce * volume) / N3, tinta = d.tinta || [1, 1, 1], Q = new Float32Array(3 * N3); F.chiave = new Float64Array(3 * N3);
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = q(i, j, k), qq = [G.origine[0] + i * h, G.origine[1] + j * h, G.origine[2] + k * h];
    for (let c = 0; c < 3; c++) { F.pos[3 * a + c] = qq[c] + D * P[c][a]; Q[3 * a + c] = qq[c]; F.chiave[3 * a + c] = qq[c]; }
    // J = I − D·φ (simmetrica): Σ = s0·J·J. Dove Dλ > 1 lo strato si è già incrociato: (1 − Dλ)² ricresce, e l'elemento
    // copre la regione a più flussi che Zel'dovich prevede (posizione e forma dalla stessa approssimazione). Rispetto a un
    // calcolo a N corpi la sfoglia così è troppo spessa; il limite opposto (adesione: spessore zero, Gurbatov et al. 1989)
    // con le posizioni di Zel'dovich, che oltrepassano la caustica, dà aghi sparsi che non ci sono (provato). La via
    // giusta sarebbe la Zel'dovich troncata (Coles, Melott & Shandarin 1993): DIFETTO dichiarato.
    DR.autovalori(Fc.xx[a], Fc.yy[a], Fc.zz[a], Fc.xy[a], Fc.xz[a], Fc.yz[a], lam); if (D * lam[0] > 1) crollati++;
    {
    const xx = 1 - D * Fc.xx[a], yy = 1 - D * Fc.yy[a], zz = 1 - D * Fc.zz[a], xy = -D * Fc.xy[a], xz = -D * Fc.xz[a], yz = -D * Fc.yz[a];
    F.cov[6 * a] = s0 * (xx * xx + xy * xy + xz * xz); F.cov[6 * a + 1] = s0 * (xy * xy + yy * yy + yz * yz); F.cov[6 * a + 2] = s0 * (xz * xz + yz * yz + zz * zz);
    F.cov[6 * a + 3] = s0 * (xx * xy + xy * yy + xz * yz); F.cov[6 * a + 4] = s0 * (xx * xz + xy * yz + xz * zz); F.cov[6 * a + 5] = s0 * (xy * xz + yy * yz + yz * zz); }
    F.massa[a] = 1; const w = Le * (peso ? peso[a] : 1); for (let c = 0; c < 3; c++) F.emis[3 * a + c] = w * tinta[c]; }
  return { F, Q, meta: { periodica: !d.regione, D, TM, celle: n, latoCella: h, legge, crollati: crollati / N3, regione: d.regione || null, foglie: N3 } };
}
// togliere (mettere a zero) gli elementi la cui q sta nel cubo `escludi` ({ centro, lato } in frazioni), sul toro
function senza(F, Q, escludi) {
  if (!escludi) return F; const G = { ...F, emis: F.emis.slice(), massa: F.massa.slice() }, c = escludi.centro, l2 = escludi.lato / 2;
  for (let a = 0; a < F.n; a++) { let fuori = false; for (let k = 0; k < 3; k++) { let x = Q[3 * a + k] - c[k]; x -= Math.round(x); if (Math.abs(x) > l2) { fuori = true; break; } } if (!fuori) G.emis[3 * a] = G.emis[3 * a + 1] = G.emis[3 * a + 2] = G.massa[a] = 0; }
  return G;
}
function rispondi(n, tipo, T, meta, altro = {}) { const p = alberoPerFilo(T); self.postMessage({ n, tipo, albero: p, meta, ...altro }, Object.values(p).filter((x) => x instanceof ArrayBuffer)); }

// ---------- le nebulose e le nubi
function nebulose(d) {
  const sg = scenaGalassia(d.cosmo, d.galassia, d.t), Rg = sg.riferimento.raggio, Rk = Rg / KPC, oc = d.occhio, visti = new Map();
  for (const x of sg.vuoto({ centro: [0, 0, 0], raggio: 1.1 * Rk }).volumi) visti.set(x.id, x);
  // vicino a chi guarda, dentro la galassia: anche gli oggetti di una regione attorno a lui (vuoto.js ne elenca al più 400
  // per tipo in una regione: gli altri sono la sua nebbia)
  const rl = d.regioneKpc ?? 1; if (Math.hypot(oc[0], oc[1]) < 1.2 * Rg && Math.abs(oc[2]) < 0.3 * Rg) for (const x of sg.vuoto({ centro: oc.map((v) => v / KPC), raggio: rl }).volumi) visti.set(x.id, x);
  const pol = polvere(1), legge = (nm) => pol.estinzione(nm * 1e-9) / pol.AV, kPiatto = perCanale(legge), albedo = MEZZO.albedo.visibile;
  const em = [], me = [], oggetti = [], luci = []; // em: [pos, cov, emis]; me: [pos, cov, est, dif, g, P, dir]
  for (const x of visti.values()) {
    const R = x.raggio, Rp = R / PC, c = x.pos.map((v) => v / PC), dist = Math.max(R, Math.hypot(x.pos[0] - oc[0], x.pos[1] - oc[1], x.pos[2] - oc[2])), px = (R / dist) * d.fuoco;
    let m = 1; while (m < 16 && (2 * R) / m / 2 / dist * d.fuoco > d.pixel) m *= 2; // il cubetto più fine sotto `pixel` (1σ = h/2)
    // i cubetti dentro la sfera (m = 1: la sfera intera)
    const cubi = []; if (m === 1) cubi.push([c[0], c[1], c[2], (Rp * Rp) / 5]); else { const h = (2 * Rp) / m; /* (σ² = h²/4: il cubetto ricostruito, come per la ragnatela) */ for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) for (let k = 0; k < m; k++) { const a = -Rp + (i + 0.5) * h, b = -Rp + (j + 0.5) * h, e = -Rp + (k + 0.5) * h; if (a * a + b * b + e * e <= Rp * Rp) cubi.push([c[0] + a, c[1] + b, c[2] + e, (h * h) / 4]); } }
    const nc = cubi.length, vis = x.brillanza * 4 * PI * PI * R * R, scheda = { cosa: x.cosa, id: x.id, pos: x.pos, raggio: R, m, cubi: nc, pixel: px };
    if (x.cosa === 'nebulosa a riflessione' && x.stella && x.continuo && x.continuo.W > 0) {
      const st = x.stella, Ls = st.L * parteDiLuce(st.T, 1.59, 3.26), frazione = x.continuo.W / (albedo * Ls), tau = frazione < 1 ? -Math.log(1 - frazione) : 20, kS = perCanale(legge, planck(st.T)), rgbS = canali([], { T: st.T, W: 1 }).rgb, Lc = rgbS.map((v) => Ls * v);
      const sV = (4 / 3) * PI * R * R * tau; // ∫κ dV con κ = τ/R
      em.push([c, 0, Lc]); const prima = me.length;
      for (const q of cubi) me.push([q.slice(0, 3), q[3], kS.map((k) => (sV * k) / nc), kS.map((k) => (albedo * sV * k) / nc), G_POLVERE, null, null]);
      luci.push({ da: prima, a: me.length, pos: c, L: Lc, m, tau, kS }); Object.assign(scheda, { tau, stella: st, luceStella: Ls, diffusaModello: x.continuo.W });
    } else if (x.cosa === 'nube molecolare' && x.estinzione > 0) { const s = 0.921 * x.estinzione * (2 / 3) * PI * R * R; for (const q of cubi) me.push([q.slice(0, 3), q[3], kPiatto.map((k) => (s * k) / nc), kPiatto.map((k) => (albedo * s * k) / nc), G_POLVERE, null, null]); scheda.AV = x.estinzione; }
    else if (vis > 0 && (x.righe?.length || x.continuo)) { const cont = x.continuo && x.continuo.dove !== 'raggi X' ? x.continuo : null, rgb = canali(x.righe || [], cont).rgb; for (const q of cubi) em.push([q.slice(0, 3), q[3], rgb.map((v) => (vis * v) / nc)]); scheda.W = vis; scheda.rgb = rgb; }
    else continue;
    oggetti.push(scheda); }
  const Fe = foglie(em.length); em.forEach(([p, s, L], i) => { Fe.pos.set(p, 3 * i); Fe.cov.set([s, s, s, 0, 0, 0], 6 * i); Fe.emis.set(L, 3 * i); });
  const Fm = foglie(me.length); me.forEach(([p, s, e, f, g], i) => { Fm.pos.set(p, 3 * i); Fm.cov.set([s, s, s, 0, 0, 0], 6 * i); Fm.est.set(e, 3 * i); Fm.dif.set(f, 3 * i); Fm.g[i] = g; });
  // la luce diffusa delle nebulose a riflessione, con l'ombra di ogni cubetto verso la stella (m = 1: la sfera intera, in
  // forma chiusa: la stella al centro, colonna radiale τ: diffonde L·albedo·(1 − e^−τ_c), in media in ogni direzione)
  for (const l of luci) { const quali = []; for (let i = l.da; i < l.a; i++) quali.push(i);
    if (l.m === 1) { for (const i of quali) for (let k = 0; k < 3; k++) Fm.P[3 * i + k] = l.L[k] * albedo * -Math.expm1(-l.tau * l.kS[k]); }
    else illumina(Fm, quali, { pos: l.pos, L: l.L }, PC, Math.min(32, 2 * l.m)); }
  return { Te: albero(Fe, { peso: 'luce' }), Tm: albero(Fm, { peso: 'sezione' }), oggetti, Rg };
}

self.onmessage = (e) => {
  const d = e.data, t0 = performance.now();
  try {
    if (d.tipo === 'ragnatela') { const r = elementi(d), F = d.regione ? r.F : senza(r.F, r.Q, d.escludi); if (!d.regione) grossa = r; const T = albero(F, { peso: 'luce' }); rispondi(d.n, d.tipo, T, { ...r.meta, ms: performance.now() - t0, escluso: !!d.escludi }); }
    else if (d.tipo === 'escludi') { if (!grossa) return; const T = albero(senza(grossa.F, grossa.Q, d.escludi), { peso: 'luce' }); rispondi(d.n, 'ragnatela', T, { ...grossa.meta, ms: performance.now() - t0, escluso: true }); }
    else if (d.tipo === 'nebulose') { const r = nebulose(d), pe = r.Te ? alberoPerFilo(r.Te) : null, pm = r.Tm ? alberoPerFilo(r.Tm) : null, tr = [pe, pm].filter(Boolean).flatMap((p) => Object.values(p).filter((x) => x instanceof ArrayBuffer));
      self.postMessage({ n: d.n, tipo: d.tipo, emettitori: pe, mezzo: pm, oggetti: r.oggetti, meta: { Rg: r.Rg, ms: performance.now() - t0 } }, tr); }
  } catch (err) { self.postMessage({ n: d.n, tipo: d.tipo, errore: String((err && err.stack) || err) }); }
};
