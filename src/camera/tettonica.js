// tettonica.js — la crosta di un pianeta che EVOLVE nel tempo: deriva dei continenti, oceani che nascono
// e affondano, catene di montagne nate dagli scontri.
//
// Non è una fotografia: si parte da un pianeta senza continenti e lo si lascia vivere per la sua età.
//   1. IL MANTELLO, scaldato dal basso, si organizza da solo in celle (l'equazione di Swift-Hohenberg,
//      come in fluidi.js, in regime a celle: discese fredde concentrate, circondate da una rete di
//      salite larghe, come in un mantello scaldato da dentro), e avanza nel tempo insieme alla crosta. La larghezza delle celle viene dallo
//      spessore del mantello, il vigore dal calore dell'interno. Trascina la crosta: via da dove sale,
//      verso dove scende. La litosfera è rigida: ogni placca va tutta alla stessa velocità, e le dorsali
//      e le fosse sono i bordi stretti dove quella velocità cambia verso.
//   2. LA CROSTA CONTINENTALE è una quantità che si conserva (uno spessore su griglia). È leggera e non
//      affonda. Nasce a poco a poco sopra le fosse (gli archi di vulcani), il mantello la raccoglie dove
//      converge, e lì si salda in continenti. Un continente è una zattera rigida e coesa: va tutto insieme,
//      e tirato da due parti non si assottiglia ma si strappa. Dove è compresso si ispessisce (le catene)
//      finché la spinta lo regge; poi si ingorga, e si allarga. I fiumi consumano ciò che sporge e lo
//      depositano sulle coste, che così avanzano. Sotto un continente che resta fermo a lungo il mantello,
//      coperto, si scalda: la discesa si spegne, diventa una salita, e il continente si spacca. I pezzi
//      vanno alla deriva e si scontrano altrove (il ciclo dei supercontinenti: nessuno lo impone).
//   3. LA CROSTA OCEANICA nasce alle dorsali e dietro i continenti che si separano, invecchia
//      allontanandosi, affonda nelle fosse. Raffreddandosi si contrae: l'oceano è più profondo dove è
//      più vecchio.
//   4. LE QUOTE vengono dal galleggiamento (isostasia): la crosta spessa sta alta, come un iceberg.
//
// LEGGI EMPIRICHE (misurate sulla Terra e usate così, non derivate; i numeri sono in COSTANTI):
//   · la profondità dell'oceano con l'età: 2500 m + 350 m·√(milioni di anni), fino a 6000 m (profonditaOceano);
//   · quanta crosta continentale si è separata dal mantello nel tempo (crostaAttesa);
//   · la velocità delle placche: 4 cm/anno sulla Terra, e cresce come q² (legge di scala della convezione);
//   · lo spessore che la crosta regge sotto spinta: da 39 km (spinta debole) a 70 km (il Tibet);
//   · l'erosione: i pendii si spianano (una catena larga 300 km in ~10 milioni di anni, se nulla la sostiene) e i
//     fiumi portano alle coste ciò che sporge dal livello di riferimento (lo dimezzano in ~100 milioni di anni);
//   · la fossa: il fondo si piega in giù, fino a 2500 m, dove la crosta oceanica affonda.
// PARAMETRI LIBERI (non misurati: scelti guardando il risultato, perché i continenti restino interi, si spacchino
// e si riuniscano): quanto è larga la zattera rigida, la coesione, quanto e in quanto tempo un continente scalda
// il mantello che ha sotto (rigida, coesione, coperta, inerzia).
// SEMPLIFICAZIONI: la carta è trattata come piana (longitudine periodica, i poli sono muri): vicino ai
// poli le forme sono stirate. La rigidità delle placche è approssimata (velocità uguale in modulo ovunque,
// continenti rigidi entro un ottavo di cella del mantello): niente faglie trasformi né rotazioni. Il calore
// q è quello di oggi per tutta la storia. Il mantello è un'equazione delle celle, non le equazioni dei fluidi.
// I sedimenti dei fiumi non seguono i fiumi uno per uno: si spargono sulle coste di tutto il pianeta.

import { comeSorgente } from './eventi.js';

export const COSTANTI = {
  hMisura: 38e3, // (m) lo spessore con cui si conta «quanta superficie» di continente c'è
  hZero: 35e3, // la crosta spessa così galleggia a quota 0 (il livello di riferimento: all'incirca il mare terrestre)
  hMargine: 25e3, // sopra è continente; sotto è crosta di transizione (archi, altopiani sommersi)
  hFermo: 39e3, hMassimo: 70e3, // lo spessore massimo che la spinta riesce a reggere: da hFermo (spinta debole o nulla) a hMassimo (uno scontro: il Tibet)
  galleggia: 0.15, // 1 − densità della crosta / densità del mantello (2800 / 3300): quanto sporge ciò che galleggia
  dorsale: 2500, raffredda: 350, abisso: 6000, // la profondità dell'oceano (m) con l'età (milioni di anni)
  radice: 5250, // la quota (−m) a cui starebbe un continente senza crosta: così hZero sta a 0
  fossa: 2500, // quanto si piega in giù la crosta oceanica dove affonda
  vTerra: 0.04, qTerra: 0.087, // (m/anno, W/m²) la velocità media delle placche terrestri e il calore che la muove
  qPlacche: 0.05, qVivo: 0.02, // sotto qPlacche (o senz'acqua) la crosta non si rompe; sotto qVivo il mantello è fermo
  fiumi: 130e6, // (anni) il tempo con cui i fiumi consumano ciò che sporge dal livello di riferimento (si riduce a 1/e)
  erosione: 800, // (m²/anno) quanto in fretta i pendii si spianano: ciò che è alto scivola sulla cella accanto
  rigida: 0.12, // fin dove un continente va tutto insieme: il raggio della finestra, come frazione di una cella del mantello
  coesione: 0.5, // quanto forte la crosta robusta tira a sé quella vicina (celle per passo, per unità di differenza)
  Tmetamorfismo: 573, Tsuolo: 288, conducibilita: 3, // (K, K, W/m/K) dove un sedimento sepolto diventa roccia metamorfica, la superficie, la conducibilità della roccia
  inerzia: 4, // in quanti giri di cella il mantello sotto un continente si scalda (o si raffredda quando se ne va)
  coperta: 2.5, // quanto un continente scalda il mantello che ha sotto (nelle unità dell'equazione delle celle)
};
const C = COSTANTI, C_PASSO = 0.3, CEDE = 0.03, GIRI = 2, PASSI_GROSSI = 2400;

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
// «onde» celle lungo l'equatore. La carta (Wm × Hm, larga il doppio di quanto è alta) è la metà di un quadrato
// periodico, l'altra metà è la sua immagine allo specchio: così ai poli il mantello non attraversa il bordo (come la
// crosta, che lì trova un muro).
// LO STATO INIZIALE. Se è data «impronta» è l'anomalia termica lasciata dagli urti della formazione (impatti.js,
// improntaMantello: caldo dove sono caduti gli urti più grandi e più tardi): una mappa lon × lat larga il doppio di
// quanto è alta (un Float32Array di qualunque grana, o una funzione (W, H) → mappa), portata sulla griglia del
// mantello, a media zero, e scalata perché il suo massimo valga 0,025 (la stessa ampiezza del rumore che sostituisce:
// l'equazione parte piccola e cresce da sé; conta la forma, non la misura). Se manca, o è tutta uguale (un pianeta
// che nessun urto ha segnato), resta il ripiego: un rumore minuscolo tirato da «seme», che sta per le irregolarità
// del mantello appena solidificato che qui non si calcolano (in cosmo.js è un numero legato all'indirizzo del pianeta).
function mantello({ onde, epsilon, seme, impronta = null }) {
  const Wm = onde <= 8 ? 64 : 128, Hm = Wm / 2, Nm = Wm * Hm, Nq = Wm * Wm, dk = 1 / onde, g = -1.2; // g < 0: il mantello è scaldato soprattutto da DENTRO (il decadimento radioattivo) e raffreddato da sopra, perciò le discese fredde sono concentrate e le salite sono larghe e formano una rete (le dorsali)
  const caso = comeSorgente(seme, 'mantello').serie('irregolarità'); // (un evento solo, «mantello seme/irregolarità»: l'estrazione k è quella della cella k, in qualunque ordine la si chieda)
  const u = new Float64Array(Nm).map((_, k) => 0.05 * (caso(k) - 0.5)), re = new Float64Array(Nq), im = new Float64Array(Nq), k4 = new Float64Array(Nq);
  let daUrti = false;
  if (impronta) {
    const src = typeof impronta === 'function' ? impronta(Wm, Hm) : impronta, Ws = Math.round(Math.sqrt(2 * src.length)), Hs = Ws / 2, v = new Float64Array(Nm);
    if (Ws * Hs !== src.length) throw new Error('tettonica: l\'impronta deve essere una mappa larga il doppio di quanto è alta');
    // sulla griglia del mantello: la media delle celle dell'impronta che cadono in ogni cella (se è più grossa, quella in cui cade il centro)
    let media = 0, massimo = 0;
    for (let y = 0; y < Hm; y++) for (let x = 0; x < Wm; x++) { const i0 = Math.floor((x * Ws) / Wm), i1 = Math.max(i0 + 1, Math.floor(((x + 1) * Ws) / Wm)), j0 = Math.floor((y * Hs) / Hm), j1 = Math.max(j0 + 1, Math.floor(((y + 1) * Hs) / Hm)); let a = 0;
      for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) a += src[j * Ws + i]; v[y * Wm + x] = a / ((i1 - i0) * (j1 - j0)); media += v[y * Wm + x] / Nm; }
    for (let k = 0; k < Nm; k++) { v[k] -= media; massimo = Math.max(massimo, Math.abs(v[k])); }
    if (massimo > 0 && Number.isFinite(massimo)) { for (let k = 0; k < Nm; k++) u[k] = (0.025 * v[k]) / massimo; daUrti = true; }
  }
  for (let y = 0; y < Wm; y++) for (let x = 0; x < Wm; x++) { const kx = (x < Wm / 2 ? x : x - Wm) * dk, ky = (y < Wm / 2 ? y : y - Wm) * dk; k4[y * Wm + x] = (1 - kx * kx - ky * ky) ** 2; }
  // un passo: la parte che si piega da sé (u², u³) e la coperta in modo esplicito, la diffusione in modo implicito
  const passo = (dt, coperta = null) => {
    for (let y = 0; y < Hm; y++) for (let x = 0; x < Wm; x++) { const i = y * Wm + x, v = u[i], f = v + dt * (g * v * v - v * v * v + (coperta ? coperta[i] : 0)); re[i] = f; re[(Wm - 1 - y) * Wm + x] = f; }
    im.fill(0); fft2(re, im, Wm, Wm, false);
    for (let i = 0; i < Nq; i++) { const l = 1 / (1 - dt * (epsilon - k4[i])); re[i] *= l; im[i] *= l; }
    re[0] = 0; im[0] = 0; // la media non cambia: il moto sposta il calore, non lo crea
    fft2(re, im, Wm, Wm, true);
    for (let y = 0; y < Hm; y++) for (let x = 0; x < Wm; x++) u[y * Wm + x] = 0.5 * (re[y * Wm + x] + re[(Wm - 1 - y) * Wm + x]);
  };
  // il campo visto su una griglia W×H qualsiasi (centri delle celle): media a blocchi se è più grossa,
  // interpolazione liscia (cubica, prima lungo x poi lungo y) se è più fine
  const tmp = {}, su = (W, H, out = new Float64Array(W * H)) => {
    if (W === Wm) out.set(u);
    else if (W < Wm) { const r = Wm / W; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { let a = 0; for (let b = 0; b < r; b++) for (let c = 0; c < r; c++) a += u[(j * r + b) * Wm + i * r + c]; out[j * W + i] = a / (r * r); } }
    else {
      const r = W / Wm, T = (tmp[W] ??= new Float64Array(W * Hm)), pesi = (t) => [(-t + 2 * t * t - t * t * t) / 2, (2 - 5 * t * t + 3 * t * t * t) / 2, (t + 4 * t * t - 3 * t * t * t) / 2, (-t * t + t * t * t) / 2];
      for (let i = 0; i < W; i++) { const x = (i + 0.5) / r - 0.5, x0 = Math.floor(x), [a, b, c, d] = pesi(x - x0), i0 = (x0 - 1 + Wm) % Wm, i1 = (x0 + Wm) % Wm, i2 = (x0 + 1) % Wm, i3 = (x0 + 2) % Wm;
        for (let y = 0; y < Hm; y++) { const o = y * Wm; T[y * W + i] = a * u[o + i0] + b * u[o + i1] + c * u[o + i2] + d * u[o + i3]; } }
      const sp = (y) => (y < 0 ? -1 - y : y >= Hm ? 2 * Hm - 1 - y : y) * W;
      for (let j = 0; j < H; j++) { const y = (j + 0.5) / r - 0.5, y0 = Math.floor(y), [a, b, c, d] = pesi(y - y0), o0 = sp(y0 - 1), o1 = sp(y0), o2 = sp(y0 + 1), o3 = sp(y0 + 2);
        for (let i = 0; i < W; i++) out[j * W + i] = a * T[o0 + i] + b * T[o1 + i] + c * T[o2 + i] + d * T[o3 + i]; }
    }
    return out;
  };
  // quante celle: le discese concentrate (i minimi del campo)
  const celle = () => { let mx = 0, n = 0; for (const v of u) if (-v > mx) mx = -v;
    for (let y = 0; y < Hm; y++) for (let x = 0; x < Wm; x++) { const v = -u[y * Wm + x]; if (v < 0.35 * mx) continue; let cima = true; for (let b = -1; b <= 1 && cima; b++) for (let a = -1; a <= 1; a++) { const yy = y + b; if ((a || b) && yy >= 0 && yy < Hm && -u[yy * Wm + ((x + a + Wm) % Wm)] > v) { cima = false; break; } } if (cima) n++; }
    return n; };
  return { Wm, Hm, u, passo, su, celle, daUrti };
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
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, a = 0.5 * (u[j * W + ((i + 1) % W)] - u[j * W + ((i + W - 1) % W)]), b = 0.5 * (u[j < H - 1 ? k + W : k] - u[j > 0 ? k - W : k]); vx[k] = a; vy[k] = b; s2 += a * a + b * b; }
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
// hx, hy: come cx, cy, ma per la crosta continentale.
export function velocitaCrosta(h, ca, W, H, R) {
  const N = W * H, { vx, vy, c0 } = ca;
  const hx = (ca.hx ??= new Float64Array(N)), hy = (ca.hy ??= new Float64Array(N)), tetto = (ca.tetto ??= new Float64Array(N));
  const A = (ca.A ??= new Float64Array(N)), B = (ca.B ??= new Float64Array(N)), P = (ca.P ??= new Float64Array(N)), p = (ca.p ??= new Float64Array(N)), Q = (ca.Q ??= new Float64Array(N)), T = (ca.T ??= new Float64Array(N));
  let c = false; for (let k = 0; k < N; k++) { const f = robusta(h[k]); p[k] = f; A[k] = f * vx[k]; B[k] = f * vy[k]; if (f > 1e-4) c = true; }
  if (c) {
    // quanto è robusta la lastra attorno a ogni cella (5 × 5 celle: una lastra non ha crepe larghe una cella sola)
    for (let giro = 0; giro < 2; giro++) { sfoca(giro ? Q : p, Q, T, W, H, 1); for (let j = 0; j < H; j++) { const nj = (Math.min(H - 1, j + 1) - Math.max(0, j - 1) + 1) * 3; for (let i = 0; i < W; i++) Q[j * W + i] /= nj; } }
    sfoca(A, A, T, W, H, R); sfoca(B, B, T, W, H, R); sfoca(p, P, T, W, H, R);
    for (let k = 0; k < N; k++) { const f = Q[k], q = P[k]; if (q > 1e-9) { A[k] = vx[k] + f * (A[k] / q - vx[k]); B[k] = vy[k] + f * (B[k] / q - vy[k]); } else { A[k] = vx[k]; B[k] = vy[k]; } }
  } else { A.set(vx); B.set(vy); Q.fill(0); }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; hx[k] = 0.5 * (A[k] + A[j * W + ((i + 1) % W)]); hy[k] = j < H - 1 ? 0.5 * (B[k] + B[k + W]) : 0; }
  // la COESIONE: la lastra tiene insieme. La crosta è tirata verso dove, lì attorno, c'è più crosta robusta, finché
  // lì la crosta è più sottile del normale (c'è posto): così un continente stirato non diventa un velo, ma si
  // strappa in pezzi che restano spessi. Su un continente intero non fa nulla: non lo frena e non lo schiaccia
  if (c && C.coesione > 0) { const kc = (C.coesione * c0) / 0.3, ip = 1 / (C.hZero - C.hMargine), posto = (k) => { const f = (C.hZero - h[k]) * ip; return f <= 0 ? 0 : f < 1 ? f : 1; };
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, e = j * W + ((i + 1) % W), gx = kc * (Q[e] - Q[k]); if (gx !== 0) hx[k] += gx * posto(gx > 0 ? e : k);
      if (j < H - 1) { const gy = kc * (Q[k + W] - Q[k]); if (gy !== 0) hy[k] += gy * posto(gy > 0 ? k + W : k); } } }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, esce = Math.max(hx[k], 0) + Math.max(-hx[j * W + ((i + W - 1) % W)], 0) + Math.max(hy[k], 0) + Math.max(j > 0 ? -hy[k - W] : 0, 0);
    tetto[k] = esce > 0.35 ? 0.7 / esce : 2; // da una cella non può uscire più di quello che c'è
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
// continentale si conserva esattamente (salvo «apporto», la crosta nuova, distribuita dove l'oceano affonda; ciò che
// i fiumi portano via resta in viaggio un passo, in stato.fango, e si deposita al passo dopo). campo = quello fatto
// da campoDaPotenziale e poi velocitaCrosta. dtMa: milioni di anni del passo; kappa, fiumi: erosione per passo.
export function passoCrosta(st, ca, { dtMa = 1, kappa = 0, apporto = 0, fiumi = 0 } = {}) {
  const { W, H, h, a, sub } = st, N = W * H, { cx, cy, hx, hy, cap, tetto, Q } = ca;
  const dh = (st.dh ??= new Float64Array(N)), dw = (st.dw ??= new Float64Array(N)), dq = (st.dq ??= new Float64Array(N));
  const ihw = 1 / C.hMargine, h0 = C.hZero;
  // CIÒ CHE SI SEGUE SENZA CAMBIARE NIENTE (solo se lo stato li porta: st.cop, st.conto). cop: quanta della crosta di ogni
  // cella è COPERTURA SEDIMENTARIA (m): viaggia con la crosta, cresce di ciò che i fiumi e i pendii posano, cala di ciò
  // che consumano (la copertura sta sopra: se ne va per prima; sotto c'è il basamento), e non supera copMax: più giù il
  // sedimento è già roccia metamorfica, cioè basamento. conto: le somme, sulla finestra che chi chiama decide, di quanto
  // la crosta si è ISPESSITA PERCHÉ COMPRESSA (stretta: −h·∇·v, con v la velocità vera della crosta, ingorgo compreso;
  // lo spostarsi di un continente intero non conta: lì v è uguale ovunque), di quanto ha ceduto ai lati sotto il proprio
  // peso (dentro stretta, col segno), della crosta nuova degli archi (arco), e di quanto fiumi e pendii hanno tolto e posato
  const cop = st.cop || null, copMax = st.copMax ?? Infinity, dc = cop ? (st.dc ??= new Float64Array(N)) : null, via = cop ? (st.via ??= new Float64Array(N)) : null, conto = st.conto || null;
  // lo scambio attraverso ogni lato, tra la cella k e la sua vicina v (velocità > 0: da k a v); prima i lati est, poi
  // i lati sud. m e p: le celle oltre k e oltre v. c: la velocità del mantello (porta la crosta oceanica); ch: quella
  // della crosta continentale
  const geo = (st.geo ??= vicine(W, H)), FF = (st.FF ??= new Float64Array(2 * N)), entra = (st.entra ??= new Float64Array(N)), esce = (st.esce ??= new Float64Array(N)), passa = (st.passa ??= new Float64Array(N).fill(1));
  for (let verso = 0; verso < 2; verso++) { const vv = geo.v[verso], mm = geo.m[verso], pp = geo.p[verso], cm = verso ? cy : cx, cc = verso ? hy : hx, fine = verso ? N - W : N, o = verso * N;
    for (let k = 0; k < fine; k++) { const v = vv[k], c = cm[k], ch = cc[k], hk = h[k], hv = h[v];
      // la crosta oceanica (la parte di cella non coperta dal continente) va col mantello, con la sua età
      if (c !== 0) { const d = c > 0 ? k : v; let wd = 1 - (c > 0 ? hk : hv) * ihw; if (wd > 0) { wd *= c; dw[k] -= wd; dw[v] += wd; wd *= a[d]; dq[k] -= wd; dq[v] += wd; } }
      const hd = ch > 0 ? hk : hv; let F = 0;
      if (ch !== 0 && hd > 0) {
        // la crosta continentale: quanta ne passerebbe (guardando anche la cella a monte, per non sfumare i bordi dei continenti)
        const d = ch > 0 ? k : v, n = ch > 0 ? v : k, D = (ch > 0 ? hv : hk) - hd; let f = hd;
        if (D !== 0) { const r = (hd - h[ch > 0 ? mm[k] : pp[k]]) / D; if (r > 0) f += 0.5 * (1 - (ch > 0 ? ch : -ch)) * ((2 * r) / (1 + r)) * D; }
        const t = hd * tetto[d]; if (f > t) f = t;
        F = ch * f; f = F > 0 ? F : -F; entra[n] += f; esce[d] += f * passa[n];
      }
      FF[o + k] = F;
    } }
  // …ma la crosta non si lascia comprimere oltre lo spessore che la spinta di lì riesce a reggere: in una cella
  // ne entra solo quanta ne esce (per quel che chi le sta davanti lasciava passare un attimo fa), più lo spazio
  // che resta. È l'ingorgo, che risale all'indietro: il continente si ferma e si allarga invece di accartocciarsi
  for (let giro = 0; giro < GIRI; giro++) {
    if (giro) { esce.fill(0); for (let verso = 0; verso < 2; verso++) { const vv = geo.v[verso], fine = verso ? N - W : N, o = verso * N; for (let k = 0; k < fine; k++) { const F = FF[o + k]; if (F > 0) esce[k] += F * passa[vv[k]]; else if (F < 0) esce[vv[k]] -= F * passa[k]; } } }
    for (let k = 0; k < N; k++) { const e = entra[k]; if (e > 0) { const spazio = cap[k] - h[k], q = ((spazio > 0 ? spazio : 0) + esce[k]) / e; passa[k] = q < 1 ? q : 1; } else passa[k] = 1; }
  }
  entra.fill(0); esce.fill(0);
  for (let verso = 0; verso < 2; verso++) { const vv = geo.v[verso], cc = verso ? hy : hx, fine = verso ? N - W : N, o = verso * N;
    for (let k = 0; k < fine; k++) { const v = vv[k], hk = h[k], hv = h[v]; if (hk <= 0 && hv <= 0) continue;
      let F = FF[o + k]; if (F !== 0) F *= passa[F > 0 ? v : k];
      let Ft = F, Fe = 0, Fc = 0; // (la parte delle placche e quella dell'erosione, per i traccianti: F resta lo stesso numero di prima)
      // l'erosione: ciò che sta sopra il livello di riferimento si consuma e si deposita accanto, più in basso…
      const xk = hk - h0, xv = hv - h0;
      if (xk > 0 || xv > 0) { Fe = kappa * ((xk > 0 ? xk : 0) - (xv > 0 ? xv : 0)); F += Fe;
        // …e la crosta più spessa di quanto la spinta regge cede sotto il proprio peso e si allarga sui lati
        const yk = hk - cap[k], yv = hv - cap[v]; if (yk > 0 || yv > 0) { Fc = CEDE * ((yk > 0 ? yk : 0) - (yv > 0 ? yv : 0)); F += Fc; Ft += Fc; } }
      if (F !== 0) { dh[k] -= F; dh[v] += F; }
      if (cop) {
        // la copertura va con la crosta che si sposta (in proporzione a quanta ne ha la cella che cede)…
        if (Ft !== 0) { const hd = Ft > 0 ? hk : hv, q = hd > 0 ? (Ft * cop[Ft > 0 ? k : v]) / hd : 0; dc[k] -= q; dc[v] += q; }
        // …e ciò che i pendii tolgono a una cella si posa, sedimento, su quella accanto
        if (Fe > 0) { via[k] += Fe; dc[v] += Fe; if (conto) conto.posato[v] += Fe; } else if (Fe < 0) { via[v] -= Fe; dc[k] -= Fe; if (conto) conto.posato[k] -= Fe; }
        // la velocità vera attraverso il lato (frazione di cella per passo; l'ingorgo la frena) e ciò che cede di lato
        if (conto && Fc !== 0) { conto.stretta[k] -= Fc; conto.stretta[v] += Fc; }
      }
    } }
  // (per il conto) QUANTO LA CROSTA È STRETTA: lungo ciascun asse, in una cella attraversata dal moto entra F da monte ed
  // esce a valle alla velocità u': se la cella andasse rigida con chi le sta dietro uscirebbe quanto entra; la differenza,
  // F·(1 − u'/u), è crosta che si accumula (o si stira, se è negativa). Dove il moto entra dai due lati si somma tutto
  // (uno scontro), dove esce dai due lati si toglie tutto (uno strappo). Le velocità sono quelle vere, ingorgo compreso:
  // la deriva di un continente intero non ispessisce niente, e nemmeno un continente fermo contro cui affonda un oceano
  if (conto) { const sx = conto.stretta;
    for (let verso = 0; verso < 2; verso++) { const vv = geo.v[verso], mm = geo.m[verso], cc = verso ? hy : hx, o = verso * N;
      for (let k = 0; k < N; k++) { const m = mm[k], v = vv[k]; if (h[k] <= 0 && h[m] <= 0 && h[v] <= 0) continue;
        // il lato a monte (tra m e k) e quello a valle (tra k e v); ai poli non c'è lato
        let F1 = 0, u1 = 0, F2 = 0, u2 = 0;
        if (m !== k) { const c = cc[m]; if (c !== 0) { u1 = c * passa[c > 0 ? k : m]; F1 = FF[o + m] * passa[FF[o + m] > 0 ? k : m]; } }
        if (v !== k && !(verso && k >= N - W)) { const c = cc[k]; if (c !== 0) { u2 = c * passa[c > 0 ? v : k]; F2 = FF[o + k] * passa[FF[o + k] > 0 ? v : k]; } }
        if (u1 > 0 && u2 > 0) sx[k] += F1 * (1 - u2 / u1); else if (u1 < 0 && u2 < 0) sx[k] -= F2 * (1 - u1 / u2); else sx[k] += F1 - F2;
      } } }
  // il bilancio di ogni cella. Se dopo il trasporto la crosta oceanica non basta a coprire il fondo, lo spazio
  // si riempie di crosta nuova, di età zero (una dorsale, o il mare che si apre dietro un continente che si
  // spacca); se è troppa, la parte in più affonda nel mantello (una fossa).
  const sete = (st.sete ??= new Float64Array(N)), deposito = st.sommaSete > 0 ? (st.fango ?? 0) / st.sommaSete : 0; let somma = 0, totale = 0, fango = deposito > 0 ? 0 : st.fango ?? 0, sete2 = 0;
  for (let k = 0; k < N; k++) {
    let w0 = 1 - h[k] * ihw; if (w0 < 0) w0 = 0;
    let q = w0 * a[k] + dq[k]; if (q < 0) q = 0; const w1 = w0 + dw[k], s0 = sub[k];
    const posa = deposito * sete[k]; let hn = h[k] + dh[k] + apporto * s0 * s0 + posa, e = 0; if (hn < 0) hn = 0;
    // i FIUMI: ciò che sta sopra il livello di riferimento è terra emersa, e l'acqua la porta via…
    if (hn > h0) { e = fiumi * (hn - h0); hn -= e; fango += e; sete[k] = 0; } else { const s = Q[k] * (h0 - hn); sete[k] = s; sete2 += s; } // …fino alle coste, dove si deposita
    h[k] = hn; totale += hn;
    if (cop) { // il bilancio della copertura: quella che c'era e che è arrivata, più ciò che si è posato, meno ciò che è stato tolto
      let c = cop[k] + dc[k] + posa - via[k] - e; if (c > hn) c = hn; if (c > copMax) c = copMax; if (!(c > 0)) c = 0; cop[k] = c;
      if (conto) { conto.arco[k] += apporto * s0 * s0; conto.tolto[k] += via[k] + e; conto.posato[k] += posa; }
      dc[k] = 0; via[k] = 0; }
    let wt = 1 - hn * ihw; if (wt < 0) wt = 0;
    const s = w1 > wt ? w1 - wt : 0, den = w1 > wt ? w1 : wt; sub[k] = s; somma += s * s;
    a[k] = den > 1e-6 ? q / den + dtMa : 0;
    dh[k] = 0; dw[k] = 0; dq[k] = 0;
  }
  st.sommaSub = somma; st.totale = totale; st.fango = fango; st.sommaSete = sete2; // (la crosta nuova nasce sopra le fosse più attive: peso s²)
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

// ---------- LA STORIA INTERA. raggioM: raggio del pianeta; nucleo: raggio del nucleo / raggio del pianeta (il
// resto è mantello); q: calore interno oggi (W/m²; Terra 0,087); eta: età in anni; acqua: se la crosta è indebolita
// dall'acqua (senza, non si rompe in placche); passi: quanti passi sulla griglia finale; impronta: lo stato iniziale
// del mantello, l'anomalia termica lasciata dagli urti (vedi mantello: una mappa lon × lat o una funzione (W, H) → mappa);
// seme: il ripiego, se l'impronta manca o è piatta (storia.impronta dice quale dei due ha deciso: 'urti' o 'seme').
// IL TEMPO. La velocità è quella vera, e in un passo la crosta non può fare più di un terzo di cella: quindi il
// passato lontano si simula a grana grossa (griglie larghe 64, 128… celle: tanto il rimescolamento ne cancella i
// dettagli) e solo gli ultimi «passi» passi su ogni griglia più fine, fino a W×H (sulla Terra, con 160 passi: fino
// a 560 milioni di anni fa a 64, poi a 128, e gli ultimi 190 a 256: vedi storia.livelli). Se la storia chiede più
// di PASSI_GROSSI passi sulla griglia più grossa (pianeti molto caldi, o piccoli, o molto vecchi), il tratto più
// antico si salta (storia.saltati) e si parte con la crosta separata fino a quel momento, stesa in un velo uniforme.
// RESTITUISCE { W, H, alt, cont, spinta, etaCrosta, celle } e in più { spessore, fosse, regime, bilancio, storia }:
//   alt        Float32Array, metri rispetto al livello a cui galleggia la crosta normale (35 km): circa il mare terrestre
//   cont       Uint8Array, 1 dove c'è crosta continentale (spessore ≥ 25 km)
//   spinta     Float32Array 0…1, dove oggi la crosta dei continenti è compressa: lì i monti stanno crescendo
//   etaCrosta  Float32Array, milioni di anni della crosta oceanica (0 sui continenti)
//   celle      quanti pennacchi del mantello salgono oggi
//   salite     Float32Array, il campo del mantello oggi (> 0 dove sale, caldo: lì stanno i vulcani; < 0 dove scende); null se è fermo
//   spessore   Float32Array, metri di crosta continentale (anche i veli sottili fuori dai continenti)
//   fosse      Float32Array 0…1, dove la crosta oceanica sta affondando (lì alt è più fonda, fino a 2500 m)
//   velEst, velSud  Float32Array, m/anno: la velocità della crosta oggi (la zattera a cui la cella appartiene)
//   sollevamento    Float32Array, m/anno: di quanto la superficie sale (o scende, se < 0) OGGI perché la crosta sotto si
//              ispessisce: galleggia × (ciò che le placche stringono + ciò che cede di lato + la crosta nuova degli
//              archi), in media su storia.finestra anni. È il sollevamento senza erosione: se l'erosione toglie E metri di
//              roccia la superficie risale di altri (1 − galleggia)·E per isostasia (lo conta chi erode: geologia.js)
//   regge      Float32Array, m: di quanto la superficie può ancora salire prima che la crosta superi lo spessore che la
//              spinta di lì regge (cap): oltre, cede e si allarga invece di alzarsi
//   copertura  Float32Array, m: quanta della crosta è copertura sedimentaria (ciò che fiumi e pendii hanno posato nella
//              storia e nessuno ha più tolto, fino alla profondità dove diventa roccia metamorfica); 0 = basamento a nudo
//   arco       Float32Array, m/anno di crosta nuova che nasce oggi sopra le fosse (gli archi di vulcani)
//   consumata, posata  Float32Array, m/anno di crosta che l'erosione DELLA TETTONICA (le sue due leggi empiriche: fiumi e
//              pendii) toglie e posa oggi in ogni cella: una seconda fonte della denudazione, a grana grossa, da
//              confrontare con erosione() di geologia.js (test_erosione lo stampa)
//   regime     'a placche' | 'coperchio unico' | 'fermo'
//   bilancio   { prodotta, presente, inViaggio }: metri di spessore medio di crosta continentale: quanta ne è nata,
//              quanta ce n'è, quanta è sedimento portato dai fiumi nell'ultimo passo (prodotta = presente + inViaggio)
//   storia     { simulati, saltati (anni), passi, velocita (m/anno), livelli: [{ W, passi, anni }], impronta: 'urti' | 'seme', finestra (anni) }
// SE LA CROSTA NON SI ROMPE (q ≤ 0,05 o niente acqua; «placche» true/false forza la scelta, per esempio per
// seguire interno() di geologia.js, che guarda anche la massa): un COPERCHIO UNICO. Nessuna deriva: cont = 0,
// spinta = 0, spessore = 0, fosse = 0 (e così velocità, sollevamento, copertura), etaCrosta = l'età del pianeta ovunque; alt = solo i rigonfiamenti sopra i
// pennacchi del mantello (fino a 1,5 km, come Tharsis o gli altopiani di Venere), o piatta (tutta 0) se anche il
// mantello è fermo (q ≤ 0,02).
export function evolviTettonica({ W = 256, H = 128, raggioM = 6.371e6, nucleo = 0.546, q = C.qTerra, eta = 4.5e9, acqua = true, seme = 1, passi = 160, placche = null, impronta = null } = {}) {
  if (W !== 2 * H || W < 32 || (W & (W - 1))) throw new Error('tettonica: serve W = 2H, potenza di 2, almeno 32');
  const N = W * H, alt = new Float32Array(N), cont = new Uint8Array(N), spinta = new Float32Array(N), etaCrosta = new Float32Array(N), spessore = new Float32Array(N), fosse = new Float32Array(N), copertura = new Float32Array(N), sollevamento = new Float32Array(N), regge = new Float32Array(N), arco = new Float32Array(N), consumata = new Float32Array(N), posata = new Float32Array(N), velEst = new Float32Array(N), velSud = new Float32Array(N);
  // le celle del mantello sono larghe circa una volta e mezza il suo spessore: quante ce ne stanno in un giro
  const Dm = raggioM * (1 - nucleo), onde = Math.max(3, Math.min(11, Math.round((2 * Math.PI * raggioM) / (3 * Dm))));
  const aPlacche = placche ?? (q > C.qPlacche && !!acqua), vivo = q > C.qVivo;
  const man = mantello({ onde, epsilon: Math.max(0.15, Math.min(0.8, 0.35 * (q / C.qTerra))), seme, impronta }), origine = man.daUrti ? 'urti' : 'seme';
  if (vivo) for (let n = 0; n < 80; n++) man.passo(0.5); // il mantello convette da subito: le celle ci sono già quando la crosta comincia a separarsi
  if (!aPlacche) {
    etaCrosta.fill(eta / 1e6);
    if (vivo) { const u = man.su(W, H), A = 1500 * Math.min(1, q / C.qTerra); let mx = 1e-9; for (const v of u) mx = Math.max(mx, Math.abs(v)); for (let k = 0; k < N; k++) alt[k] = (A * u[k]) / mx; }
    return { W, H, alt, cont, spinta, etaCrosta, celle: vivo ? man.celle() : 0, salite: vivo ? Float32Array.from(man.su(W, H)) : null, spessore, fosse, copertura, sollevamento, regge, arco, consumata, posata, velEst, velSud, regime: vivo ? 'coperchio unico' : 'fermo', bilancio: { prodotta: 0, presente: 0, inViaggio: 0 }, storia: { simulati: 0, saltati: eta, passi: 0, velocita: 0, livelli: [], impronta: origine, finestra: 0 } };
  }
  // LEGGE DI SCALA (strato limite della convezione): la velocità delle placche cresce come il quadrato del calore che esce
  const V = C.vTerra * (q / C.qTerra) ** 2, tau = Dm / V; // tau: il tempo di un giro di una cella (sulla Terra ~70 milioni di anni): l'orologio del mantello
  // i livelli di griglia e quanti passi su ciascuno, partendo dal presente e andando indietro
  const larghezze = []; for (let w = W; w >= Math.min(64, W); w /= 2) larghezze.unshift(w);
  const liv = larghezze.map((w) => ({ W: w, H: w / 2, dt: (C_PASSO * 2 * Math.PI * raggioM) / w / V, n: 0 }));
  let resto = eta, saltati = 0;
  for (let l = liv.length - 1; l >= 0; l--) { const L = liv[l], vuole = Math.ceil(resto / L.dt - 1e-9), n = Math.max(0, Math.min(l > 0 ? passi : PASSI_GROSSI, vuole)); L.n = n; if (n) { if (l === 0 && vuole > n) saltati = resto - n * L.dt; L.dt = Math.min(L.dt, (resto - (l === 0 ? saltati : 0)) / n); resto -= n * L.dt; } }
  const copMax = ((C.Tmetamorfismo - C.Tsuolo) * C.conducibilita) / q; // (m) più giù di così un sedimento è già roccia metamorfica: basamento
  const caldo = new Float64Array(man.Wm * man.Hm); // quanto il mantello si è scaldato sotto i continenti (0…1)
  let t = saltati, prodotta = crostaAttesa(t) * C.hMisura, debito = 0, st = null, ca = null, nPassi = 0, c0 = C_PASSO, finestra = 0;
  for (let l = 0; l < liv.length; l++) {
    const { W: w, H: hh, dt, n } = liv[l], Nl = w * hh;
    st = st ? { W: w, H: hh, h: raffina(st.h, w / 2, hh / 2), a: raffina(st.a, w / 2, hh / 2), sub: raffina(st.sub, w / 2, hh / 2), sommaSub: st.sommaSub * 4, fango: (st.fango ?? 0) * 4, cop: raffina(st.cop, w / 2, hh / 2), copMax } : { W: w, H: hh, h: new Float64Array(Nl).fill(prodotta), a: new Float64Array(Nl), sub: new Float64Array(Nl), sommaSub: 0, cop: new Float64Array(Nl), copMax };
    ca = null; if (!n && l < liv.length - 1) continue;
    c0 = (dt * V * w) / (2 * Math.PI * raggioM);
    const R = Math.max(2, Math.round((C.rigida * w) / onde)), ogni = Math.max(1, Math.min(4, Math.round((0.25 * tau) / dt))), dtM = (ogni * dt) / tau, kappa = Math.min(0.04, (C.erosione * dt) / ((2 * Math.PI * raggioM) / w) ** 2);
    const coperta = new Float64Array(man.Wm * man.Hm), lento = 1 - Math.exp(-dtM / C.inerzia), uL = new Float64Array(Nl), rm = w / man.Wm;
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
      // OGGI: da quando le velocità sono state calcolate l'ultima volta (gli ultimi «ogni» passi della griglia più fine) si
      // tiene il conto di quanto la crosta è stretta, di quanta ne nasce agli archi e di quanto fiumi e pendii tolgono e posano
      if (l === liv.length - 1 && p === Math.max(0, n - ogni)) { st.conto = { stretta: new Float64Array(Nl), arco: new Float64Array(Nl), tolto: new Float64Array(Nl), posato: new Float64Array(Nl) }; finestra = (n - p) * dt; }
      // la crosta nuova di questo passo (se non c'è ancora nessuna fossa dove farla nascere, resta in debito)
      const nuova = (crostaAttesa(t + dt) - crostaAttesa(t)) * C.hMisura * Nl + debito; let apporto = 0;
      if (st.sommaSub > 0) { apporto = nuova / st.sommaSub; prodotta += nuova / Nl; debito = 0; } else debito = nuova;
      passoCrosta(st, ca, { dtMa: dt / 1e6, kappa, apporto, fiumi: 1 - Math.exp(-dt / C.fiumi) }); t += dt; nPassi++;
    }
    debito *= 4; // (alla griglia successiva le celle sono quattro volte tante)
    if (!ca) aggiorna(false);
  }
  // ---------- il presente: quote dal galleggiamento, continenti, spinta, fosse
  const { h, a, sub } = st, { conv } = ca, ihw = 1 / C.hMargine, metriAnno = liv[liv.length - 1].dt > 0 ? (2 * Math.PI * raggioM) / W / liv[liv.length - 1].dt : 0; let presente = 0;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, hk = h[k], wo = Math.max(0, 1 - hk * ihw); presente += hk / N;
    spessore[k] = hk; cont[k] = hk >= C.hMargine ? 1 : 0; etaCrosta[k] = wo > 0 ? a[k] : 0;
    spinta[k] = cont[k] ? conv[k] : 0; // dove la crosta dei continenti è compressa oggi: lì i monti crescono
    // la fossa: dove la crosta oceanica affonda in fretta, qui o sotto il bordo del continente accanto
    let s = sub[k]; s = Math.max(s, sub[j * W + ((i + 1) % W)], sub[j * W + ((i + W - 1) % W)], j > 0 ? sub[k - W] : 0, j < H - 1 ? sub[k + W] : 0);
    fosse[k] = wo * Math.max(0, Math.min(1, (s / c0 - 0.1) / 0.35));
    // ISOSTASIA: il fondo (oceano secondo l'età, o la radice fredda del continente) più quanto sporge la crosta leggera
    alt[k] = -(wo * profonditaOceano(a[k]) + (1 - wo) * C.radice) + C.galleggia * hk - C.fossa * fosse[k];
    copertura[k] = st.cop[k];
    regge[k] = C.galleggia * Math.max(0, ca.cap[k] - hk);
    if (finestra > 0) { const cn = st.conto; arco[k] = cn.arco[k] / finestra; consumata[k] = cn.tolto[k] / finestra; posata[k] = Math.max(0, cn.posato[k]) / finestra; sollevamento[k] = (C.galleggia * (cn.stretta[k] + cn.arco[k])) / finestra; }
    velEst[k] = ca.A[k] * metriAnno; velSud[k] = ca.B[k] * metriAnno;
  }
  return { W, H, alt, cont, spinta, etaCrosta, celle: man.celle(), salite: Float32Array.from(man.su(W, H)), spessore, fosse, copertura, sollevamento, regge, arco, consumata, posata, velEst, velSud, regime: 'a placche', bilancio: { prodotta, presente, inViaggio: (st.fango ?? 0) / N }, storia: { simulati: eta - saltati, saltati, passi: nPassi, velocita: V, livelli: liv.map((L) => ({ W: L.W, passi: L.n, anni: L.n * L.dt })), impronta: origine, finestra } };
}
