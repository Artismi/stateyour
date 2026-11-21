// onde_cascata.js — IL MARE DEL 3D IN TESSERE DI TESSENDORF, A CASCATA (per pianeta.js).
//
// Prima il 3D muoveva il mare con 192 onde sinusoidali fisse (16 lunghezze per 12 direzioni) e ne disegnava le 16 più ripide
// di ogni pezza: sedici onde sole interferiscono in un reticolo che si ripete, e da 20 km a 20 m il mare era un motivo a
// righe. Qui le onde sono quelle dello SPETTRO del punto (finestra.js `spettro`: Elfouhaily e altri 1997 con la direzione
// di Mitsuyasu e altri 1975, la dispersione con la tensione superficiale di quell'acqua, il mare lungo a parte) sommate per
// trasformata di Fourier su QUATTRO TESSERE PERIODICHE (Tessendorf 2001, «Simulating Ocean Water», SIGGRAPH course notes):
//   · i lati sono L_c = L₀·e^(−1,7·c): rapporti trascendenti, mai razionali, quindi nessuna coppia di tessere ha un periodo
//     comune e la somma non si ripete mai; ogni tessera è anche girata di c volte l'angolo aureo (π·(3 − √5)), così i
//     reticoli delle quattro non si allineano;
//   · ogni modo di Fourier sta in UNA tessera sola: la tessera c prende i numeri d'onda tra 4 e 4·e^1,7 ≈ 21,9 volte 2π/L_c
//     (la prima anche quelli più lunghi). Sotto 4 un anello ha meno di 50 modi e le poche onde piane si vedrebbero come
//     righe; sopra 21,9 c'è già la tessera dopo. Lo spettro intero è così diviso senza buchi e senza doppioni;
//   · L₀ = 8 volte la lunghezza d'onda del picco più lungo dello spettro (mare di vento o mare lungo): il picco sta al
//     modo 8 della prima tessera, dove l'anello ha ~200 modi. Ciò che è più corto dell'ultima banda (L₀·e^−5,1/21,9 ≈
//     L₀/3600) è l'increspatura sotto la tessera: va nella pendenza quadratica media che allarga il riflesso (Cox e Munk 1954);
//   · le ampiezze: ĥ₀(k) = (ξ₁ + iξ₂)/√2 · √(F(k)·Δk²), ξ gaussiane dall'indirizzo del pianeta («…/onde/cascata c»); nel
//     tempo ĥ(k, t) = ĥ₀(k)·e^(iωt) + ĥ₀*(−k)·e^(−iωt), con la ω di finestra.js (gravità e capillarità di quell'acqua);
//   · per ogni tessera si calcolano, in due trasformate (due campi reali per trasformata complessa): la pendenza verso est e
//     verso nord, la quota, e l'accelerazione verticale (−ω²·ĥ) per i frangenti.
// I FRANGENTI E LA SCHIUMA CHE DURA. La schiuma sta dove l'accelerazione verso il basso delle onde di vento supera una
// soglia (Longuet-Higgins 1969), e la parte di mare coperta è quella di Monahan e O'Muircheartaigh (1980) dal vento del
// punto (la soglia la mette pianeta.js, punto per punto, col vento della carta). Una cresta che frange lascia schiuma che
// si disfa in qualche secondo (lo «stadio B» di Monahan e Lu 1990; decadimento esponenziale, tempo τ_B ≈ 4 s, dichiarato
// come ordine di grandezza: le note di ricerca non l'hanno verificato su fonte): qui la memoria m(t) = max(z(t),
// m(t − dt)·e^(−dt/τ_B)) dell'accelerazione normalizzata z = −a/σ_a, portata al suo rango (0…1, uniforme per costruzione)
// così che il frammento possa mettere la soglia che dà proprio la copertura di Monahan: rango > 1 − W.
// SCELTE DICHIARATE (discretizzazione, classe b): 64 × 64 punti per tessera; quattro tessere; i valori nell'immagine a 8
// bit per canale, scalati sul massimo di ogni tessera (la quota a 1/127 del suo massimo).
import { gaussiane } from '../camera/finestra.js';
import { serie } from '../camera/eredita.js';

export const CASCATA = Object.freeze({ N: 64, n: 4, passoLn: 1.7, kMin: 4, picchi: 8, tauB: 4 });
const DUE_PI = 2 * Math.PI, AUREO = Math.PI * (3 - Math.sqrt(5));

// la trasformata di Fourier veloce (radice 2, sul posto) di righe e colonne di un campo complesso N × N, verso +i (l'inversa
// senza 1/N); gli scambi dei bit e i fattori di rotazione si calcolano una volta
function preparaFFT(N) {
  const rev = new Int32Array(N); for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; rev[i] = j; }
  const wr = new Float64Array(N / 2), wi = new Float64Array(N / 2); for (let k = 0; k < N / 2; k++) { wr[k] = Math.cos((DUE_PI * k) / N); wi[k] = Math.sin((DUE_PI * k) / N); }
  function fft1(re, im, o, p) {
    for (let i = 1; i < N; i++) { const j = rev[i]; if (i < j) { const a = o + i * p, c = o + j * p; let t = re[a]; re[a] = re[c]; re[c] = t; t = im[a]; im[a] = im[c]; im[c] = t; } }
    for (let len = 2, passo = N >> 1; len <= N; len <<= 1, passo >>= 1) for (let i = 0; i < N; i += len) for (let j = 0, h = len >> 1; j < h; j++) {
      const a = o + (i + j) * p, b = a + h * p, cr = wr[j * passo], ci = wi[j * passo], xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr; re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi; }
  }
  return (re, im) => { for (let r = 0; r < N; r++) fft1(re, im, r * N, 1); for (let c = 0; c < N; c++) fft1(re, im, c, N); };
}

// la cascata di un pianeta: radice = l'indirizzo del suo mare (per le fasi)
export function creaCascata(radice) {
  const { N, n } = CASCATA, M = N * N;
  // (i numeri di ogni tessera: la sua serie con nome, «…/onde/cascata», «tessera c»)
  const generatore = (c) => { const u = serie(`${radice}/onde/cascata`, `tessera ${c}`); let k = 0; return () => u(k++); };
  const C = Array.from({ length: n }, (_, c) => ({ c, L: 0, angolo: c * AUREO, h0r: new Float64Array(M), h0i: new Float64Array(M), kx: new Float64Array(M), ky: new Float64Array(M), om: new Float64Array(M), rompe: new Float64Array(M),
    mss: 0, sH: 1, sS: 1, sA: 1, memoria: new Float32Array(M), rango: new Float32Array(M) }));
  const fft2 = preparaFFT(N), reA = new Float64Array(M), imA = new Float64Array(M), reB = new Float64Array(M), imB = new Float64Array(M);
  const dati = new Uint8Array(4 * M * n);
  let pronta = false, tPrima = null, L0 = 0, mssCoda = 0;
  // lo spettro: sp (finestra.js spettro), om(k) la dispersione, lamPicco la lunghezza d'onda del picco più lungo (m)
  function prepara(sp, om, lamPicco) {
    L0 = CASCATA.picchi * lamPicco; const r = Math.exp(CASCATA.passoLn);
    for (const T of C) {
      const L = L0 * Math.exp(-CASCATA.passoLn * T.c), dk = DUE_PI / L, ca = Math.cos(T.angolo), sa = Math.sin(T.angolo), gen = generatore(T.c); T.L = L;
      let mss = 0, vh = 0, va = 0;
      const Fq = new Float64Array(M); T.h0r.fill(0); T.h0i.fill(0); T.om.fill(0); T.rompe.fill(0); const attivi = [];
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const q = j * N + i, m = i < N / 2 ? i : i - N, nn = j < N / 2 ? j : j - N, kk = Math.hypot(m, nn), [g1, g2] = gaussiane(gen);
        const kxl = m * dk, kyl = nn * dk, kx = ca * kxl - sa * kyl, ky = sa * kxl + ca * kyl, k = kk * dk; T.kx[q] = kx; T.ky[q] = ky;
        if (!(kk >= (T.c === 0 ? 1 : CASCATA.kMin) && kk < CASCATA.kMin * r) || i === N / 2 || j === N / 2) continue;
        // (E|ĥ₀|² = F·Δk²/2: con il coniugato in −k la varianza del campo è ∬F)
        const F = Math.max(0, sp.F(kx, ky)) || 0, a = Math.sqrt((F * dk * dk) / 4); T.h0r[q] = a * g1; T.h0i[q] = a * g2; T.om[q] = om(k); Fq[q] = F; attivi.push(q);
        // (la parte che frange: la lunga del mare di vento, Frange di finestra.js; l'accelerazione si conta solo su quella)
        const Fr = sp.Frange ? Math.max(0, sp.Frange(kx, ky)) || 0 : 0; T.rompe[q] = F > 0 ? Math.min(1, Fr / F) : 0;
      }
      T.attivi = Int32Array.from(attivi);
      // (la parte che frange, resa simmetrica in ±k perché l'accelerazione resti un campo reale) e le varianze della tessera
      for (const q of attivi) { const i = q % N, j = (q - i) / N, qm = ((N - j) % N) * N + ((N - i) % N); if (qm > q) { const x = 0.5 * (T.rompe[q] + T.rompe[qm]); T.rompe[q] = T.rompe[qm] = x; } }
      for (const q of attivi) { const F = Fq[q]; if (!(F > 0)) continue; mss += F * dk * dk * (T.kx[q] ** 2 + T.ky[q] ** 2); vh += F * dk * dk; va += F * dk * dk * T.om[q] ** 4 * T.rompe[q] ** 2; }
      T.mss = mss; T.sH = Math.sqrt(vh) || 1e-9; T.sS = Math.sqrt(mss / 2) || 1e-9; T.sA = Math.sqrt(va) || 1e-12; T.memoria.fill(0);
    }
    // l'increspatura più corta dell'ultima banda: la pendenza quadratica media dello spettro oltre (fino a 40 numeri d'onda capillari)
    const kc = (DUE_PI / C[n - 1].L) * CASCATA.kMin * r; mssCoda = sp.mss(kc, Math.max(kc * 1e3, 40 * (sp.km || kc)));
    pronta = true; tPrima = null;
  }
  // il campo all'istante t (s): riempie `dati` (RGBA8 per tessera: pendenza est, pendenza nord, quota, rango della schiuma)
  function aggiorna(t) {
    if (!pronta) return false; const dt = tPrima == null ? 0 : Math.max(0, Math.min(10, t - tPrima)); tPrima = t; const dec = Math.exp(-dt / CASCATA.tauB);
    for (const T of C) {
      // ĥ(k,t) e il suo coniugato in −k: le due trasformate (pendenze; quota + i·accelerazione); fuori dalla banda zero
      reA.fill(0); imA.fill(0); reB.fill(0); imB.fill(0);
      for (const q of T.attivi) {
        const i = q % N, j = (q - i) / N, qm = ((N - j) % N) * N + ((N - i) % N), w = T.om[q], c1 = Math.cos(w * t), s1 = Math.sin(w * t); // (ω(−k) = ω(k))
        // h = ĥ₀(k)·e^{iωt} + ĥ₀*(−k)·e^{−iωt}
        const hr = (T.h0r[q] + T.h0r[qm]) * c1 - (T.h0i[q] + T.h0i[qm]) * s1, hi = (T.h0r[q] - T.h0r[qm]) * s1 + (T.h0i[q] - T.h0i[qm]) * c1;
        const kx = T.kx[q], ky = T.ky[q];
        // pendenze: i·kx·h + i·(i·ky·h) = (−kx·hi − ky·hr) + i·(kx·hr − ky·hi)
        reA[q] = -kx * hi - ky * hr; imA[q] = kx * hr - ky * hi;
        // quota + i·accelerazione della parte che frange: h + i·(−ω²·r·h)
        const wq = -w * w * T.rompe[q]; reB[q] = hr - wq * hi; imB[q] = hi + wq * hr;
      }
      fft2(reA, imA); fft2(reB, imB);
      const o = 4 * M * T.c, sS = 4 * T.sS, sH = 4 * T.sH, mem = T.memoria;
      for (let q = 0; q < M; q++) {
        dati[o + 4 * q] = Math.max(0, Math.min(255, Math.round(127.5 + (127.5 * reA[q]) / sS)));
        dati[o + 4 * q + 1] = Math.max(0, Math.min(255, Math.round(127.5 + (127.5 * imA[q]) / sS)));
        dati[o + 4 * q + 2] = Math.max(0, Math.min(255, Math.round(127.5 + (127.5 * reB[q]) / sH)));
        const z = -imB[q] / T.sA; mem[q] = Math.max(z, mem[q] * dec);
      }
      // il rango della memoria (0…1): la soglia del frammento diventa la copertura cercata (solo nelle due tessere più lunghe,
      // dove sta il mare di vento che frange; nelle altre 0)
      if (T.c > 1) { for (let q = 0; q < M; q++) dati[o + 4 * q + 3] = 0; continue; }
      { let lo = Infinity, hi = -Infinity; for (let q = 0; q < M; q++) { const v = mem[q]; if (v < lo) lo = v; if (v > hi) hi = v; } const NB = 1024, isto = new Uint32Array(NB + 1), sc = hi > lo ? NB / (hi - lo) : 0;
        for (let q = 0; q < M; q++) isto[Math.min(NB, Math.floor((mem[q] - lo) * sc))]++; let acc = 0; for (let b = 0; b <= NB; b++) { const x = isto[b]; isto[b] = acc + (x >> 1); acc += x; } // (il rango a metà del proprio cassetto)
        for (let q = 0; q < M; q++) dati[o + 4 * q + 3] = Math.round((255 * isto[Math.min(NB, Math.floor((mem[q] - lo) * sc))]) / (M - 1)); }
    }
    return true;
  }
  return { C, dati, prepara, aggiorna, get pronta() { return pronta; }, get L0() { return L0; }, get mssCoda() { return mssCoda; } };
}
