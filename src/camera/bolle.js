// bolle.js — PARTIRE DA UNA O PIÙ BOLLE: il primo pezzo calcolabile delle regole 5, 11 e 12 di INTRECCIO.md.
//
// Una bolla è un pezzo di mondo fissato (un luogo, una grandezza, un istante, un contenuto). Fissarla non crea
// niente: vuol dire mettersi tra gli universi che la contengono, e sceglierne uno in proporzione al suo peso.
// Qui ci sono due cose, che si provano da sole:
//
// A. IL CAMPO DEL COSMO CONDIZIONATO A PIÙ PUNTI (esatto). campoCondizionato(cosmo, vincoli).
//    LEGGE: un campo gaussiano condizionato a vincoli lineari è ancora gaussiano, e una sua realizzazione si ottiene
//    da una libera con una correzione lineare (Hoffman e Ribak 1991, ApJ 380, L5):
//        δ_c(x) = δ(x) + ξ_i(x)·C⁻¹_ij·(c_j − δ_j)
//    δ: il campo LIBERO dell'indirizzo; δ_j: quanto vale, lisciato alla scala R_j, nel punto del vincolo j; c_j: quanto
//    deve valere; ξ_i(x) = ⟨δ(x)·δ_i⟩ e C_ij = ⟨δ_i·δ_j⟩ dalla STESSA funzione di correlazione del campo (la somma
//    sulle sue onde, con lo spettro vero di cosmo3d.js: BBKS con il parametro di Sugiyama, normalizzato a σ₈). La
//    correzione è la più piccola che fa passare il campo per i vincoli, e si spegne lontano da loro come ξ.
//    IL PESO del mondo vincolato: χ² = cᵀC⁻¹c; la densità di probabilità di quei valori è ∝ e^(−χ²/2), e la
//    probabilità di un χ² così o più grande è quella della distribuzione χ² con tanti gradi quanti i vincoli.
//    (Roth, Pontzen e Peiris 2016: l'abbondanza relativa del campo vincolato dipende solo dai vincoli.)
//    È FUNZIONE PURA di (indirizzo, vincoli): i vincoli si mettono in un ordine canonico prima di ogni conto (stesso
//    risultato, bit per bit, in qualunque ordine si diano), e il campo si interroga punto per punto senza stato.
//    Per un cosmo della biblioteca il campo libero è quello di cosmo3d.js e i vincoli delle sue galassie (il campo
//    filtrato alle onde lunghe vale l'altezza del picco di ognuna) restano vincoli tra gli altri: con nessuna bolla
//    il risultato è il cosmo di sempre; con le bolle, le galassie restano dove e come sono.
//    Per un indirizzo qualunque («prova 7») il campo libero viene dalla fonte unica (eventi.js): l'ampiezza di
//    un'onda è un evento che dipende dal suo vettore d'onda e non dalla lista, così alzando kmax si aggiunge
//    dettaglio senza cambiare le onde lunghe (regola 4).
//    DICHIARATO: la finestra di lisciatura è gaussiana, W(k) = e^(−k²R²/2) (R = 0: il valore nel punto); due vincoli
//    sono «lo stesso» quando il secondo non aggiunge niente al primo oltre 10⁻¹² (RANGO): se chiedono valori diversi
//    sono incompatibili (lo si dice), se chiedono lo stesso valore uno è di troppo (lo si toglie e lo si dice).
//    COSTI: con n vincoli e N onde, n²·N somme per la matrice e n³/3 per risolverla. Con il campo di cosmo3d
//    (N = 28 888): 4 vincoli più le 77 galassie ~0,3 s; 1000 vincoli ~30 s. Per questo la prova dei mille usa un
//    campo più grosso (kmax = 10, 2 108 onde: ~3 s).
//    CHE COSA NON C'È: i vincoli sono sul contrasto di densità LINEARE (una massa d'alone, una galassia di un certo
//    tipo non sono lineari: lì si campiona, parte B); il campo del cosmo di cosmo3d.js non viene ancora dalla
//    fonte unica (è il generatore di mondo.js con un seme dell'indirizzo): cambiarlo sposterebbe assi e moti di
//    tutte le galassie, e non l'ho fatto qui.
//
// B. CHE COSA CHIEDE UNA BOLLA, E DOVE SI INCONTRANO. Vedi più sotto (bolla, chiede, giudica, incontra, causaComune).

import { sorgente, campana } from './eventi.js';
import { ondeDelToro } from './cosmo3d.js';
import { TORO_M } from './cosmo.js';
import { campoCosmo } from './spazio3d.js';

const PI2 = 2 * Math.PI;
// due vincoli sono lo stesso vincolo quando la parte nuova del secondo è sotto questa frazione della sua varianza
export const RANGO = 1e-12;

// ---------- piccola statistica: la coda della distribuzione χ² (funzione gamma incompleta: serie e frazione continua)
function lnGamma(x) { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const c of g) s += c / ++y; return -t + Math.log((2.5066282746310005 * s) / x); }
// Q(a, x) = Γ(a, x)/Γ(a): la probabilità che un χ² con 2a gradi superi 2x
export function codaGamma(a, x) {
  if (!(x > 0)) return 1; if (!(a > 0)) return 0;
  if (x < a + 1) { let ap = a, d = 1 / a, s = d; for (let n = 0; n < 500; n++) { ap++; d *= x / ap; s += d; if (Math.abs(d) < Math.abs(s) * 1e-15) break; } return 1 - s * Math.exp(-x + a * Math.log(x) - lnGamma(a)); }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d; for (let i = 1; i < 500; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300; c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; const q = d * c; h *= q; if (Math.abs(q - 1) < 1e-15) break; }
  return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}
export const probabilitaChi2 = (chi2, gradi) => (gradi > 0 ? codaGamma(gradi / 2, chi2 / 2) : 1);

// =====================================================================================================
// A. IL CAMPO
// =====================================================================================================
const liste = new Map();
const onde = (toroM, kmax) => { const k = `${toroM}|${kmax}`; if (!liste.has(k)) { if (liste.size > 6) liste.delete(liste.keys().next().value); liste.set(k, ondeDelToro(toroM, kmax)); } return liste.get(k); };
// il numero d'ordine di un'onda: dal suo vettore (kx, ky, kz), non dal posto nella lista (fino a 512 giri per lato)
const numeroOnda = (x, y, z) => (z * 1025 + (y + 512)) * 1025 + (x + 512);

// IL CAMPO LIBERO DI UN INDIRIZZO qualunque: ogni onda ha due ampiezze a campana, quattro estrazioni dell'evento
// «radice/campo libero» numerate dal vettore d'onda. → { radice, toroM, kmax, N, KX, KY, KZ, PK, A, B, fissi: [] }
export function campoLibero(radice, { toroM = TORO_M, kmax = 24, rami = null } = {}) {
  if (!(kmax >= 1 && kmax <= 512)) throw new Error(`kmax deve stare tra 1 e 512 (${kmax})`);
  const O = onde(toroM, kmax), s = sorgente(String(radice), rami).serie('campo libero'), A = new Float64Array(O.N), B = new Float64Array(O.N);
  for (let m = 0; m < O.N; m++) { const k = 4 * numeroOnda(O.KX[m], O.KY[m], O.KZ[m]), a = Math.sqrt(O.PK[m] / 2); A[m] = a * campana(s(k), s(k + 1)); B[m] = a * campana(s(k + 2), s(k + 3)); }
  return { radice: String(radice), toroM, kmax, N: O.N, KX: O.KX, KY: O.KY, KZ: O.KZ, PK: O.PK, A, B, fissi: [] };
}
// il campo libero e i vincoli già presi di un cosmo della biblioteca (cosmo3d.js): le sue galassie
function campoDelCosmo(n, { galassie = true } = {}) {
  const F = campoCosmo(n), o = F.onde;
  const fissi = galassie ? F.pos.map((x, i) => ({ nome: `galassia ${i}`, x, taglio: F.vincoli.taglio, valore: F.vincoli.valori[i] })) : [];
  return { radice: `cosmo ${n}`, toroM: F.toroM, kmax: o.kmax, N: o.n, KX: o.kx, KY: o.ky, KZ: o.kz, PK: o.potenza, A: F.libere.A, B: F.libere.B, fissi };
}
const eUnCosmo = (c) => typeof c === 'number' || /^\d+(#.*)?$/.test(String(c));
const frazione = (v) => v - Math.floor(v);

// IL CAMPO CONDIZIONATO.
//   cosmo    un numero di cosmo («3», o con i suoi rami come lo scrive cosmo.js), oppure un indirizzo qualunque
//            (una stringa: il campo libero viene da eventi.js), oppure un campo già fatto con campoLibero()
//   vincoli  [{ posizione: [x, y, z] in metri sul toro (comoventi, oggi), scala: R in metri (0 = nel punto),
//               valore: il contrasto lisciato che il campo deve avere lì }, …] in numero qualsiasi
//   opz      { toroM, kmax } per un indirizzo qualunque; { galassie: false } per un cosmo senza i vincoli delle galassie
// → se i vincoli si contraddicono: { esiste: false, perche, incompatibili: [i, j] (posti nella lista data) }
// → altrimenti { esiste: true, toroM, sigma (lo scarto del campo), vincoli (in ordine canonico, ognuno con `libero`:
//     quanto valeva lì il campo libero, e `dato`: il suo posto nella lista data), ridondanti, gradi, chi2, probabilita,
//     logPeso (−χ²/2), logDensita, chi2Libero, deltaChi2 (quanto costa rispetto al mondo di partenza),
//     in(p) il campo nel punto p (metri), lisciato(p, R), libero(p) il campo libero, correzione(p),
//     attesa(p, R) → { media, varianza } che la teoria dà per il campo vincolato in p, onde: { A, B, … } }
//   (con le galassie, χ² e gradi sono quelli delle bolle DATE le galassie: il pezzo in più che le bolle costano)
export function campoCondizionato(cosmo, vincoli = [], opz = {}) {
  const base = cosmo && cosmo.A && cosmo.PK ? cosmo : eUnCosmo(cosmo) ? campoDelCosmo(typeof cosmo === 'number' ? cosmo : String(cosmo), opz) : campoLibero(cosmo, opz);
  const { toroM, N, KX, KY, KZ, PK, A: A0, B: B0, kmax } = base, K2 = kmax * kmax, giri = PI2 / toroM;
  // ---- i vincoli in ordine canonico (così l'ordine in cui arrivano non conta)
  const dati = vincoli.map((v, i) => {
    const p = v.posizione, R = v.scala ?? 0;
    if (!Array.isArray(p) || p.length !== 3 || !p.every(Number.isFinite) || !(R >= 0) || !Number.isFinite(v.valore)) throw new Error(`vincolo ${i}: servono posizione [x, y, z] in metri, scala ≥ 0 e valore`);
    return { dato: i, posizione: [...p], scala: R, valore: v.valore, x: p.map((q) => frazione(q / toroM)) };
  }).sort((a, b) => a.x[0] - b.x[0] || a.x[1] - b.x[1] || a.x[2] - b.x[2] || a.scala - b.scala || a.valore - b.valore || a.dato - b.dato);
  const tutti = [...base.fissi, ...dati], n = tutti.length, nf = base.fissi.length;
  // la finestra di ogni vincolo, per ogni |k|² intero: gaussiana per le bolle, taglio netto per le galassie
  const finestra = (v) => { const W = new Float64Array(K2 + 1); if (v.taglio != null) { for (let k2 = 0; k2 <= K2; k2++) W[k2] = k2 <= v.taglio * v.taglio ? 1 : 0; } else { const q = 0.5 * (giri * v.scala) ** 2; for (let k2 = 0; k2 <= K2; k2++) W[k2] = Math.exp(-q * k2); } return W; };
  const Wt = tutti.map(finestra);
  let s2 = 0; for (let m = 0; m < N; m++) s2 += 2 * PK[m];
  // ---- primo giro sulle onde: la matrice C_ij = ⟨δ_i δ_j⟩ e il campo libero nei vincoli
  const C = new Float64Array(n * n), d0 = new Float64Array(n), co = new Float64Array(n), si = new Float64Array(n);
  const X = new Float64Array(n), Y = new Float64Array(n), Z = new Float64Array(n); for (let j = 0; j < n; j++) { X[j] = PI2 * tutti[j].x[0]; Y[j] = PI2 * tutti[j].x[1]; Z[j] = PI2 * tutti[j].x[2]; }
  for (let m = 0; m < N; m++) {
    const kx = KX[m], ky = KY[m], kz = KZ[m], k2 = kx * kx + ky * ky + kz * kz, r = Math.sqrt(2 * PK[m]), a = (2 * A0[m]) / r, b = (2 * B0[m]) / r;
    for (let j = 0; j < n; j++) { const w = Wt[j][k2] * r; if (w === 0) { co[j] = 0; si[j] = 0; continue; } const t = kx * X[j] + ky * Y[j] + kz * Z[j]; co[j] = w * Math.cos(t); si[j] = w * Math.sin(t); d0[j] += a * co[j] - b * si[j]; }
    for (let i = 0; i < n; i++) { const ci = co[i], sn = si[i]; if (ci === 0 && sn === 0) continue; const riga = i * n; for (let j = i; j < n; j++) C[riga + j] += ci * co[j] + sn * si[j]; }
  }
  // ---- Cholesky C = L·Lᵀ nell'ordine canonico (L nel triangolo basso), e insieme L⁻¹ applicato a c, a d0 e a c − d0
  const diag = new Float64Array(n), yc = new Float64Array(n), y0 = new Float64Array(n), vivo = new Uint8Array(n), ridondanti = [];
  for (let j = 0; j < n; j++) {
    const rj = j * n; let s = C[rj + j], ac = tutti[j].valore, a0 = d0[j]; diag[j] = s;
    for (let k = 0; k < j; k++) if (vivo[k]) { const l = C[rj + k]; s -= l * l; ac -= l * yc[k]; a0 -= l * y0[k]; }
    if (!(s > RANGO * diag[j])) { // non aggiunge niente a quelli di prima: o dice la stessa cosa, o li contraddice
      const scala = Math.sqrt(Math.max(diag[j], 1e-300));
      if (Math.abs(ac) > 1e-7 * (Math.abs(tutti[j].valore) + scala)) {
        let con = -1, meglio = 0; for (let k = 0; k < j; k++) { const r = Math.abs(C[k * n + j]) / Math.sqrt(diag[k] * diag[j] || 1); if (r > meglio) { meglio = r; con = k; } } // (C[k][j] con k < j è ancora la correlazione vera: il triangolo alto non si tocca)
        const nome = (q) => (q < nf ? `la ${tutti[q].nome}` : `il vincolo ${tutti[q].dato}`), altro = con >= 0 && meglio > 1 - 1e-9 ? con : -1;
        return { esiste: false, incompatibili: [altro >= nf ? tutti[altro].dato : altro, tutti[j].dato], perche: altro >= 0 ? `${nome(j)} e ${nome(altro)} chiedono allo stesso punto, alla stessa scala, due valori diversi (${tutti[j].valore} e ${tutti[altro].valore}): un campo ha un valore solo in ogni punto` : `${nome(j)} è già deciso dai vincoli che lo precedono (ne è una combinazione), ma chiede un valore diverso di ${ac.toExponential(2)}` };
      }
      ridondanti.push(j < nf ? tutti[j].nome : tutti[j].dato); continue;
    }
    const l = Math.sqrt(s); vivo[j] = 1; C[rj + j] = l; yc[j] = ac / l; y0[j] = a0 / l;
    for (let i = j + 1; i < n; i++) { const ri = i * n; let t = C[rj + i]; for (let k = 0; k < j; k++) if (vivo[k]) t -= C[ri + k] * C[rj + k]; C[ri + j] = t / l; }
  }
  // (sopra: C[rj + i] con i > j è l'elemento originale del triangolo alto; il triangolo basso tiene L)
  // ---- i pesi w = C⁻¹(c − d0): Lᵀ·w = L⁻¹(c − d0)
  const w = new Float64Array(n);
  for (let j = n - 1; j >= 0; j--) { if (!vivo[j]) continue; let t = yc[j] - y0[j]; for (let i = j + 1; i < n; i++) if (vivo[i]) t -= C[i * n + j] * w[i]; w[j] = t / C[j * n + j]; }
  let chi2 = 0, chi2Libero = 0, gradi = 0, logDet = 0; for (let j = nf; j < n; j++) if (vivo[j]) { chi2 += yc[j] * yc[j]; chi2Libero += y0[j] * y0[j]; gradi++; logDet += Math.log(C[j * n + j]); }
  // ---- secondo giro: le ampiezze corrette (la correzione di Hoffman e Ribak, onda per onda)
  const A = Float64Array.from(A0), B = Float64Array.from(B0);
  if (n) for (let m = 0; m < N; m++) {
    const kx = KX[m], ky = KY[m], kz = KZ[m], k2 = kx * kx + ky * ky + kz * kz; let a = 0, b = 0;
    for (let j = 0; j < n; j++) { const q = w[j] * Wt[j][k2]; if (q === 0) continue; const t = kx * X[j] + ky * Y[j] + kz * Z[j]; a += q * Math.cos(t); b -= q * Math.sin(t); }
    A[m] += PK[m] * a; B[m] += PK[m] * b;
  }
  // ---- il campo in un punto: funzione pura (nessuno stato: l'ordine delle domande non conta)
  const valuta = (AA, BB, p, R = 0) => { const x = PI2 * frazione(p[0] / toroM), y = PI2 * frazione(p[1] / toroM), z = PI2 * frazione(p[2] / toroM), q = 0.5 * (giri * R) ** 2; let d = 0;
    for (let m = 0; m < N; m++) { const kx = KX[m], ky = KY[m], kz = KZ[m], t = kx * x + ky * y + kz * z, f = q ? Math.exp(-q * (kx * kx + ky * ky + kz * kz)) : 1; d += f * (AA[m] * Math.cos(t) - BB[m] * Math.sin(t)); }
    return 2 * d; };
  // ciò che la teoria dice del campo vincolato in un punto: media ξᵀC⁻¹c, varianza σ² − ξᵀC⁻¹ξ
  const attesa = (p, R = 0) => { const x = PI2 * frazione(p[0] / toroM), y = PI2 * frazione(p[1] / toroM), z = PI2 * frazione(p[2] / toroM), q = 0.5 * (giri * R) ** 2, xi = new Float64Array(n); let var0 = 0;
    for (let m = 0; m < N; m++) { const kx = KX[m], ky = KY[m], kz = KZ[m], k2 = kx * kx + ky * ky + kz * kz, f = 2 * PK[m] * (q ? Math.exp(-q * k2) : 1), t0 = kx * x + ky * y + kz * z; var0 += f * (q ? Math.exp(-q * k2) : 1); for (let j = 0; j < n; j++) { const wj = Wt[j][k2]; if (wj) xi[j] += f * wj * Math.cos(t0 - (kx * X[j] + ky * Y[j] + kz * Z[j])); } }
    let media = 0, tolta = 0; for (let j = 0; j < n; j++) { if (!vivo[j]) continue; let t = xi[j]; for (let k = 0; k < j; k++) if (vivo[k]) t -= C[j * n + k] * xi[k]; xi[j] = t / C[j * n + j]; media += xi[j] * yc[j]; tolta += xi[j] * xi[j]; }
    return { media, varianza: Math.max(0, var0 - tolta), libera: var0 }; };
  return { esiste: true, radice: base.radice, toroM, kmax, sigma: Math.sqrt(s2),
    vincoli: dati.map((v, i) => ({ dato: v.dato, posizione: v.posizione, scala: v.scala, valore: v.valore, libero: d0[nf + i] })), fissi: nf, ridondanti,
    gradi, chi2, probabilita: probabilitaChi2(chi2, gradi), logPeso: -chi2 / 2, logDensita: -chi2 / 2 - logDet - (gradi / 2) * Math.log(PI2), chi2Libero, deltaChi2: chi2 - chi2Libero,
    in: (p) => valuta(A, B, p), lisciato: (p, R) => valuta(A, B, p, R), libero: (p, R = 0) => valuta(A0, B0, p, R), correzione: (p) => valuta(A, B, p) - valuta(A0, B0, p), attesa,
    onde: { n: N, kx: KX, ky: KY, kz: KZ, A, B, potenza: PK, kmax } };
}
