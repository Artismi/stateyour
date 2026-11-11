// tessere.worker.js — le tessere della superficie di un pianeta preparate per la vista 3D, fuori dal filo dell'interfaccia.
//
// Il rilievo fine non si inventa qui: è quello di geologia.js `tessera(chiave, radice, cl, L, tx, ty, seme)` (ogni
// livello quattro volte più fine del precedente, fino a ~10 m), i colori sono quelli di `immagineSuperficie`, l'acqua
// quella di mare.js `coloraMare`. Qui li si mette nella forma che serve alla scheda grafica:
//   · altLiv  Float32Array(2 · 258 · 130): quota del terreno e livello dell'acqua (m), con un punto di bordo per lato
//             (preso dal bordo che la tessera ha già: così l'interpolazione ai margini continua nella vicina);
//             il livello vale −1e5 dove non c'è acqua vicino; attorno a mari e laghi è esteso di qualche punto, così la
//             riva la decide il terreno punto per punto e non la griglia;
//   · pend    Float32Array(4 · 256 · 128): la pendenza del terreno verso est e verso nord (m/m), per la luce, e quanto
//             il punto è incassato rispetto ai vicini (−1 cresta … +1 fondo di valle: riceve meno luce dal cielo);
//   · terra   Uint8Array(4 · 256 · 128): il colore dei materiali SENZA l'ombra del rilievo che immagineSuperficie
//             aggiunge per la mappa piatta (qui la luce è quella vera della stella): la si toglie rifacendo lo stesso conto;
//   · acqua   Uint8Array(4 · 256 · 128) o null: il colore dell'acqua vista da sopra (col fondo dove è bassa e limpida).
// Messaggi: { tipo: 'base', k, se, cl, mare, seme, T, raggioM } una volta; poi { tipo: 'tessera', n, L, tx, ty }.
import { tessera, immagineSuperficie } from '../camera/geologia.js';
import { coloraMare } from '../camera/mare.js';

let B = null; // la superficie intera del pianeta (il livello 0) e ciò che serve per le tessere
const W = 256, H = 128, WB = W + 2, HB = H + 2;

function prepara(L, tx, ty) {
  const sf = tessera(B.k, B.se, B.cl, L, tx, ty, B.seme), n = 4 ** L, mare = sf.mare, haMare = isFinite(mare), liquido = !!(B.mare && B.mare.esiste);
  // --- quote e laghi col bordo di un punto: dal bordo largo della tessera, o (livello 0) richiudendo in longitudine
  const alt = new Float32Array(WB * HB), lago = new Float32Array(WB * HB), lg = sf.largo && sf.largo.W > W ? sf.largo : null;
  if (lg) { const ox = (lg.W - W) / 2 - 1, oy = (lg.H - H) / 2 - 1; for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const q = (j + oy) * lg.W + i + ox; alt[j * WB + i] = lg.alt[q]; lago[j * WB + i] = lg.lago ? lg.lago[q] : 0; } }
  else for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const q = Math.max(0, Math.min(H - 1, j - 1)) * W + ((i - 1 + W) % W); alt[j * WB + i] = sf.alt[q]; lago[j * WB + i] = sf.lago ? sf.lago[q] : 0; }
  // --- il livello dell'acqua: il mare dove il terreno è sotto, la superficie del lago dove c'è un lago; poi lo si
  // estende ai punti vicini (quattro giri), perché tra un punto bagnato e uno asciutto la superficie resti piana
  const altLiv = new Float32Array(2 * WB * HB); let liv = new Float32Array(WB * HB).fill(NaN), haAcqua = false, hMin = Infinity, hMax = -Infinity;
  for (let c = 0; c < WB * HB; c++) {
    if (lago[c] > 0) liv[c] = alt[c] + lago[c]; else if (haMare && alt[c] < mare) liv[c] = mare;
    if (!isNaN(liv[c])) haAcqua = true;
  }
  if (haAcqua) for (let giro = 0; giro < 4; giro++) { const nuovo = liv.slice();
    for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const c = j * WB + i; if (!isNaN(liv[c])) continue; let m = -Infinity;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const y = j + dj, x = i + di; if (y < 0 || y >= HB || x < 0 || x >= WB) continue; const v = liv[y * WB + x]; if (v > m) m = v; }
      if (m > -Infinity) nuovo[c] = m; }
    liv = nuovo; }
  // (un mare che c'è ma è tutto ghiaccio: la sua superficie è il ghiaccio, piatto, al livello del mare)
  const gelato = haMare && !liquido;
  for (let c = 0; c < WB * HB; c++) {
    let h = alt[c], l = isNaN(liv[c]) ? -1e5 : liv[c]; if (gelato && l > h) { h = l; } if (gelato) l = -1e5;
    altLiv[2 * c] = h; altLiv[2 * c + 1] = l; const s = Math.max(h, l); if (s < hMin) hMin = s; if (s > hMax) hMax = s;
  }
  // --- le pendenze (differenze centrali sul terreno col bordo), in metri su metro
  const pend = new Float32Array(4 * W * H), [, v0, , v1] = sf.rett || [0, 0, 1, 1], passoLat = ((v1 - v0) * Math.PI * B.raggioM) / H;
  for (let j = 0; j < H; j++) { const lat = (0.5 - (v0 + ((j + 0.5) / H) * (v1 - v0))) * Math.PI, passoLon = passoLat * Math.max(0.02, Math.cos(lat));
    for (let i = 0; i < W; i++) { const c = (j + 1) * WB + i + 1, q = 4 * (j * W + i), h = altLiv[2 * c]; pend[q] = (altLiv[2 * (c + 1)] - altLiv[2 * (c - 1)]) / (2 * passoLon); pend[q + 1] = (altLiv[2 * (c - WB)] - altLiv[2 * (c + WB)]) / (2 * passoLat);
      pend[q + 2] = Math.max(-1, Math.min(1, (0.25 * (altLiv[2 * (c + 1)] + altLiv[2 * (c - 1)] + altLiv[2 * (c - WB)] + altLiv[2 * (c + WB)]) - h) / (0.12 * passoLat))); } }
  // --- il colore delle terre, senza l'ombra della mappa piatta (lo stesso conto di immagineSuperficie, tolto)
  const px = immagineSuperficie(sf, B.T, B.cl), terra = new Uint8Array(4 * W * H), divOmbra = Math.max(6, 900 * Math.pow(0.36, sf.livello || 0)), bagnato = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i, h = sf.alt[k]; bagnato[k] = (haMare && h < mare) || (sf.lago && sf.lago[k] > 0) ? 1 : 0;
    const sinistra = lg ? lg.alt[(j + (lg.H - H) / 2) * lg.W + i + (lg.W - W) / 2 - 1] : sf.alt[j * W + ((i + W - 1) % W)], sopra = lg ? lg.alt[(j + (lg.H - H) / 2 - 1) * lg.W + i + (lg.W - W) / 2] : sf.alt[Math.max(0, j - 1) * W + i];
    const ombra = h >= mare ? Math.max(0.6, Math.min(1.25, 1 + (sinistra - h + sopra - h) / divOmbra)) : 1;
    terra[4 * k] = Math.min(255, px[4 * k] / ombra); terra[4 * k + 1] = Math.min(255, px[4 * k + 1] / ombra); terra[4 * k + 2] = Math.min(255, px[4 * k + 2] / ombra); terra[4 * k + 3] = 255; }
  // --- l'acqua vista da sopra (mare.js); dove coloraMare non arriva resta il colore di immagineSuperficie
  let acqua = null;
  if (haAcqua && liquido) { acqua = new Uint8ClampedArray(4 * W * H); coloraMare(B.mare, sf, acqua); for (let k = 0; k < W * H; k++) if (bagnato[k] && !acqua[4 * k + 3]) { acqua[4 * k] = px[4 * k]; acqua[4 * k + 1] = px[4 * k + 1]; acqua[4 * k + 2] = px[4 * k + 2]; acqua[4 * k + 3] = 255; } else if (!bagnato[k]) acqua[4 * k + 3] = 0; }
  // (perché sulla riva i due colori non si mescolino: quello dell'acqua si estende sulla terra vicina e viceversa)
  const estendi = (img, vale) => { let ok = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) ok[k] = vale(k) ? 1 : 0;
    for (let giro = 0; giro < 3; giro++) { const dopo = ok.slice();
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (ok[k]) continue; let r = 0, g = 0, b = 0, m = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const y = j + dj, x = i + di; if (y < 0 || y >= H || x < 0 || x >= W) continue; const q = y * W + x; if (ok[q]) { r += img[4 * q]; g += img[4 * q + 1]; b += img[4 * q + 2]; m++; } }
        if (m) { img[4 * k] = r / m; img[4 * k + 1] = g / m; img[4 * k + 2] = b / m; dopo[k] = 1; } }
      ok = dopo; } };
  if (acqua) { estendi(acqua, (k) => bagnato[k]); estendi(terra, (k) => !bagnato[k]); for (let k = 0; k < W * H; k++) acqua[4 * k + 3] = 255; }
  return { altLiv, pend, terra, acqua: acqua ? new Uint8Array(acqua.buffer) : null, hMin, hMax, haAcqua: haAcqua && liquido, gelato };
}

self.onmessage = (e) => {
  const d = e.data;
  if (d.tipo === 'base') { B = d; return; }
  if (d.tipo !== 'tessera' || !B) return;
  try { const t0 = performance.now(), r = prepara(d.L, d.tx, d.ty);
    self.postMessage({ n: d.n, k: B.k, L: d.L, tx: d.tx, ty: d.ty, ...r, ms: performance.now() - t0 }, [r.altLiv.buffer, r.pend.buffer, r.terra.buffer, ...(r.acqua ? [r.acqua.buffer] : [])]);
  } catch (err) { self.postMessage({ n: d.n, k: B.k, L: d.L, tx: d.tx, ty: d.ty, errore: String((err && err.stack) || err) }); }
};
