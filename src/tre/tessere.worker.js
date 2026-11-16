// tessere.worker.js — le tessere della superficie di un pianeta preparate per la vista 3D, fuori dal filo dell'interfaccia.
//
// Il rilievo fine non si inventa qui: è quello di geologia.js `tessera(chiave, radice, cl, L, tx, ty, seme)` (ogni
// livello quattro volte più fine del precedente, fino a ~10 m, condizionato alla cella madre), l'acqua quella di mare.js
// `coloraMare`. Qui li si mette nella forma che serve alla scheda grafica:
//   · altLiv  Float32Array(2 · 258 · 130): quota del terreno e livello dell'acqua (m), con un punto di bordo per lato
//             (preso dal bordo che la tessera ha già: così l'interpolazione ai margini continua nella vicina);
//             il livello vale −1e5 dove non c'è acqua vicino; attorno a mari e laghi è esteso di qualche punto. La riva
//             la decide il frammento: il SEGNO di ogni punto (bagnato o asciutto) interpolato tra i quattro vicini, come
//             fa `tessera` di geologia.js per la costa delle figlie (non la quota interpolata: su una terra spianata fino
//             al mare la quota interpolata mette la costa a ridosso dei centri delle celle di terra, a scalini);
//   · pend    Float32Array(4 · 256 · 128): la pendenza del terreno verso est e verso nord (m/m), per la luce; in z la
//             parte di cielo che il punto vede (sky-view factor, dagli orizzonti qui sotto: 1 − media di sin² dell'orizzonte);
//   · oriz1, oriz2  Uint8Array(4 · 256 · 128): l'ORIZZONTE in otto direzioni (est, nord-est, nord, nord-ovest; ovest,
//             sud-ovest, sud, sud-est): √(seno dell'altezza dell'orizzonte) · 255, contando la curvatura del pianeta
//             (−d/2R). Con quello il frammento sa se la stella, bassa, è dietro un monte: le ombre proprie del rilievo.
//             Si guarda fino a 64 punti lontano (un quarto di tessera; il bordo largo della tessera dà ciò che sta appena fuori);
//   · terra   Uint8Array(4 · 256 · 128): la RIFLETTANZA dei materiali (sRGB del valore lineare, nessuna ombra dentro);
//   · acqua   Uint8Array(4 · 256 · 128) o null: la riflettanza dell'acqua vista da sopra (col fondo dove è bassa e
//             limpida), cioè il colore di coloraMare senza la sua esposizione, la luce della stella e il cielo che ci mette
//             (qui li mettono la luce vera e il riflesso vero).
// Messaggi: { tipo: 'base', k, se, cl, mare, seme, T, raggioM } una volta; poi { tipo: 'tessera', n, L, tx, ty }; e
// { tipo: 'campi', n, L, tx, ty }: i campi grezzi della tessera (quota, laghi, portata, litologia…) per il suolo fine.
//
// LE RIFLETTANZE DELLE ROCCE (albedo nel visibile; la tinta viene dai minerali veri della crosta di geologia.js, mescolati
// da chimica.js `coloreRoccia` con Kubelka-Munk: qui se ne tiene solo la tinta, la luminosità è quella misurata della roccia
// in massa, perché il colore di un minerale è quello della sua polvere, molto più chiara della roccia):
//   basalto e lave 0,08 (USGS Spectral Library, Kokaly e altri 2017, splib07: basalti 0,05–0,10; i mari lunari 0,07);
//   granito e rocce metamorfiche dei continenti 0,24 (splib07 / ASTER, Baldridge e altri 2009: graniti 0,2–0,3);
//   copertura sedimentaria litificata 0,20 (arenarie e argilliti 0,15–0,30, stesse fonti);
//   sedimento sciolto e depositato (sabbie, piane, delta) 0,32 (sabbie secche 0,3–0,4: Sahara ~0,35), con la tinta della
//   sabbia di mare.js; NEVE E GHIACCIO: l'albedo del ghiaccio del clima (leggi.js CLIMA.albedoGhiaccio, la stessa che il
//   clima ha usato), con la forma spettrale della neve a grani di qualche centinaio di micron (Warren 1982, Rev. Geophys.
//   20, 67: qualche per cento in meno nel rosso che nel blu). MANCANO: la grana della neve, l'età della lava (quindi
//   nessuna «lava fresca» distinta dalla vecchia), l'umidità del suolo.
import { tessera } from '../camera/geologia.js';
import { coloraMare } from '../camera/mare.js';
import { CLIMA } from '../camera/leggi.js';

let B = null; // la superficie intera del pianeta (il livello 0) e ciò che serve per le tessere
const W = 256, H = 128, WB = W + 2, HB = H + 2;
const lin = (c) => Math.pow(c / 255, 2.2), srgb = (x) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, x)), 1 / 2.2));
const ALBEDO = { basalto: 0.08, granito: 0.24, copertura: 0.2, sabbia: 0.32 }, SABBIA = [214, 200, 172], FORMA_NEVE = [0.955, 1.0, 1.015];
// la tinta di un colore (lineare, luminanza 1)
const tinta = (c) => { const l = c.map(lin), y = 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2]; return y > 0 ? l.map((x) => x / y) : [1, 1, 1]; };

// gli orizzonti: per ogni punto, in otto direzioni, il seno dell'altezza dell'orizzonte (≥ 0) e la parte di cielo che vede
const PASSI = [1, 2, 3, 4, 6, 8, 11, 16, 22, 32, 45, 64], DIREZIONI = [[1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1]];
function orizzonti(sup, GW, GH, ox, oy, giro, passoLat, v0, v1) {
  const o1 = new Uint8Array(4 * W * H), o2 = new Uint8Array(4 * W * H), cielo = new Float32Array(W * H), R2 = 2 * B.raggioM;
  for (let j = 0; j < H; j++) {
    const lat = (0.5 - (v0 + ((j + 0.5) / H) * (v1 - v0))) * Math.PI, pLon = passoLat * Math.max(0.02, Math.cos(lat));
    for (let i = 0; i < W; i++) {
      const gi = i + ox, gj = j + oy, h0 = sup[gj * GW + gi]; let s2 = 0;
      for (let d = 0; d < 8; d++) { const [dx, dy] = DIREZIONI[d], passo = Math.hypot(dx * pLon, dy * passoLat); let tmax = 0;
        for (const p of PASSI) { let x = gi + dx * p; const y = gj + dy * p; if (y < 0 || y >= GH) break; if (giro) x = ((x % GW) + GW) % GW; else if (x < 0 || x >= GW) break;
          const dist = p * passo, t = (sup[y * GW + x] - h0) / dist - dist / R2; if (t > tmax) tmax = t; }
        const s = tmax / Math.sqrt(1 + tmax * tmax), q = 4 * (j * W + i) + (d & 3); s2 += s * s; (d < 4 ? o1 : o2)[q] = Math.round(255 * Math.sqrt(s)); }
      cielo[j * W + i] = 1 - s2 / 8;
    }
  }
  return { o1, o2, cielo };
}

// LO ZERO DELLE QUOTE. Le quote di geologia.js non sono contate dal raggio del pianeta (P.raggioM, il raggio del corpo
// in nucleo.js): su un mondo d'acqua il livello del mare sta a migliaia di km sopra il loro zero (misurato: +1 711 km su
// g34 s60 p6, +4 709 km su un altro), e il suolo disegnato stava migliaia di km sopra il corpo (la camera posata col
// raggio del corpo finiva sotto il suolo appena arrivava la prima tessera). Qui le quote che vanno alla scheda e a
// `pianeta.info` / `corpo.punto` sono contate dalla superficie media (terra o acqua, pesata per l'area) del livello 0, che
// è il raggio del corpo: prima e dopo l'arrivo delle tessere il suolo resta dov'è (a meno del rilievo vero).
function zeroDi(se) {
  const { W: w, H: h, alt, lago } = se, mare = Number.isFinite(se.mare) ? se.mare : -Infinity; let s = 0, a = 0;
  for (let j = 0; j < h; j++) { const c = Math.cos((0.5 - (j + 0.5) / h) * Math.PI); for (let i = 0; i < w; i++) { const k = j * w + i; let z = Math.max(alt[k], mare); if (lago && lago[k] > 0) z = Math.max(z, alt[k] + lago[k]); s += c * z; a += c; } }
  return a > 0 ? s / a : 0;
}

function prepara(L, tx, ty) {
  const sf = tessera(B.k, B.se, B.cl, L, tx, ty, B.seme), mare = sf.mare, haMare = isFinite(mare), liquido = !!(B.mare && B.mare.esiste);
  // --- quote e laghi col bordo di un punto: dal bordo largo della tessera, o (livello 0) richiudendo in longitudine
  const alt = new Float32Array(WB * HB), lago = new Float32Array(WB * HB), lg = sf.largo && sf.largo.W > W ? sf.largo : null;
  if (lg) { const ox = (lg.W - W) / 2 - 1, oy = (lg.H - H) / 2 - 1; for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const q = (j + oy) * lg.W + i + ox; alt[j * WB + i] = lg.alt[q]; lago[j * WB + i] = lg.lago ? lg.lago[q] : 0; } }
  else for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const q = Math.max(0, Math.min(H - 1, j - 1)) * W + ((i - 1 + W) % W); alt[j * WB + i] = sf.alt[q]; lago[j * WB + i] = sf.lago ? sf.lago[q] : 0; }
  // --- il livello dell'acqua: il mare dove il terreno è sotto, la superficie del lago dove c'è un lago; poi lo si
  // estende ai punti vicini (quattro giri), perché tra un punto bagnato e uno asciutto la superficie resti piana
  const altLiv = new Float32Array(2 * WB * HB); let liv = new Float32Array(WB * HB).fill(NaN), haAcqua = false, hMin = Infinity, hMax = -Infinity;
  for (let c = 0; c < WB * HB; c++) {
    // (un lago il cui pelo sta sotto il livello del mare è mare: senza questo, in mezzo al mare — o alla calotta di un
    // mondo ghiacciato, che copre tutto — si aprirebbero pozzi profondi quanto il fondale)
    if (lago[c] > 0) liv[c] = alt[c] + lago[c]; if (haMare && alt[c] < mare && !(liv[c] >= mare)) liv[c] = mare;
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
    h -= B.zero; if (l > -9e4) l -= B.zero; altLiv[2 * c] = h; altLiv[2 * c + 1] = l; const s = Math.max(h, l); if (s < hMin) hMin = s; if (s > hMax) hMax = s;
  }
  // --- le pendenze (differenze centrali sul terreno col bordo), in metri su metro
  const pend = new Float32Array(4 * W * H), [, v0, , v1] = sf.rett || [0, 0, 1, 1], passoLat = ((v1 - v0) * Math.PI * B.raggioM) / H;
  for (let j = 0; j < H; j++) { const lat = (0.5 - (v0 + ((j + 0.5) / H) * (v1 - v0))) * Math.PI, passoLon = passoLat * Math.max(0.02, Math.cos(lat));
    for (let i = 0; i < W; i++) { const c = (j + 1) * WB + i + 1, q = 4 * (j * W + i); pend[q] = (altLiv[2 * (c + 1)] - altLiv[2 * (c - 1)]) / (2 * passoLon); pend[q + 1] = (altLiv[2 * (c - WB)] - altLiv[2 * (c + WB)]) / (2 * passoLat); } }
  // --- gli orizzonti, sulla superficie che si vede (il terreno, o l'acqua sopra), dal bordo largo se c'è
  { const GW = lg ? lg.W : W, GH = lg ? lg.H : H, A = lg ? lg.alt : sf.alt, Lg = lg ? lg.lago : sf.lago, sup = new Float32Array(GW * GH);
    for (let k = 0; k < GW * GH; k++) { let h = A[k]; if (haMare && h < mare) h = mare; if (Lg && Lg[k] > 0) h = Math.max(h, A[k] + Lg[k]); sup[k] = h; }
    var oriz = orizzonti(sup, GW, GH, lg ? (lg.W - W) / 2 : 0, lg ? (lg.H - H) / 2 : 0, !lg, passoLat, v0, v1); }
  for (let k = 0; k < W * H; k++) pend[4 * k + 2] = oriz.cielo[k];
  // --- la riflettanza delle terre: roccia per classe, sedimento, neve e ghiaccio (vedi in testa)
  const terra = new Uint8Array(4 * W * H), bagnato = new Uint8Array(W * H), cl = B.cl, mat = sf.materiali || {}, [ru0, , ru1] = sf.rett || [0, 0, 1, 1];
  const tCont = tinta(mat.coloreContinente || [150, 140, 124]), tBas = tinta(mat.coloreBasalto || mat.coloreContinente || [84, 80, 76]), tSab = tinta(SABBIA), aGhiaccio = CLIMA.albedoGhiaccio;
  const campo = (arr, i, j) => { const x = (ru0 + ((i + 0.5) / W) * (ru1 - ru0)) * cl.W - 0.5, y = Math.min(cl.H - 1.001, Math.max(0, (v0 + ((j + 0.5) / H) * (v1 - v0)) * cl.H - 0.5)), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, a = (xx, yy) => arr[yy * cl.W + ((xx % cl.W) + cl.W) % cl.W]; return a(x0, y0) * (1 - u) * (1 - v) + a(x0 + 1, y0) * u * (1 - v) + a(x0, y0 + 1) * (1 - u) * v + a(x0 + 1, y0 + 1) * u * v; };
  // LE CLASSI DI ROCCIA SENZA I BLOCCHI DEL LIVELLO 0. `tessera` dà alla figlia la roccia della cella madre che la contiene
  // (copertura, lave, sedimento sciolto, continenti: il valore della madre ripetuto su 4 × 4 punti, e così a ogni livello:
  // le celle di 62 km del livello 0 restano blocchi netti anche a 10 m dal suolo). Disegnati così sono la trama a scacchi.
  // Qui: i continenti sono quelli della superficie intera interpolati tra i centri delle celle; la classe di roccia di un
  // punto, se è ancora quella che la sua cella del livello 0 gli ha passato, vale per le parti delle classi del livello 0
  // interpolate allo stesso modo; se l'erosione di un livello più fine l'ha cambiata (un fiume che scopre il basamento),
  // vale la classe nuova, netta. Il sedimento è quello che l'erosione di questa tessera ha posato (`depositato`, come nella
  // carta), non il «sciolto» ereditato a blocchi.
  const r0 = B.se, x0Di = (i) => (ru0 + ((i + 0.5) / W) * (ru1 - ru0)) * r0.W - 0.5, y0Di = (j) => Math.max(0, Math.min(r0.H - 1.001, (v0 + ((j + 0.5) / H) * (v1 - v0)) * r0.H - 0.5));
  const bil0 = (f, i, j) => { const x = x0Di(i), y = y0Di(j), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, a = (xx, yy) => f(yy * r0.W + ((xx % r0.W) + r0.W) % r0.W); return a(x0, y0) * (1 - u) * (1 - v) + a(x0 + 1, y0) * u * (1 - v) + a(x0, y0 + 1) * (1 - u) * v + a(x0 + 1, y0 + 1) * u * v; };
  const lito = sf.litologia, lito0 = r0.litologia, cella0 = (i, j) => { const u = ru0 + ((i + 0.5) / W) * (ru1 - ru0), v = v0 + ((j + 0.5) / H) * (v1 - v0); return Math.min(r0.H - 1, Math.floor(v * r0.H)) * r0.W + ((Math.floor(u * r0.W) % r0.W) + r0.W) % r0.W; };
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, h = sf.alt[k], suMare = !(haMare && h < mare); bagnato[k] = !suMare || (sf.lago && sf.lago[k] > 0) ? 1 : 0;
    // la roccia: la classe che l'erosione ha lasciato in superficie (basamento, lave, copertura), sulla crosta dei continenti
    // (il basamento è granito) o su quella dei fondali (basalto)
    const fc = r0.cont ? bil0((q) => (r0.cont[q] ? 1 : 0), i, j) : 1, cl0 = lito && lito0 ? lito0[cella0(i, j)] : -1;
    let f1, f2; if (lito && lito0 && L > 0 && lito[k] === cl0) { f1 = bil0((q) => (lito0[q] === 1 ? 1 : 0), i, j); f2 = bil0((q) => (lito0[q] === 2 ? 1 : 0), i, j); } else { f1 = lito && lito[k] === 1 ? 1 : 0; f2 = lito && lito[k] === 2 ? 1 : 0; }
    const f0 = Math.max(0, 1 - f1 - f2);
    const roccia = [0, 1, 2].map((q) => fc * (f1 * ALBEDO.basalto * tBas[q] + f2 * ALBEDO.copertura * tCont[q] + f0 * ALBEDO.granito * tCont[q]) + (1 - fc) * (f2 * ALBEDO.copertura * tCont[q] + (1 - f2) * ALBEDO.basalto * tBas[q]));
    const dep = sf.depositato ? sf.depositato[k] : 0, fs = Math.min(1, Math.max(0, dep) / 3); // (tre metri di sedimento coprono la roccia)
    let c = [0, 1, 2].map((q) => (1 - fs) * roccia[q] + fs * ALBEDO.sabbia * (0.5 * tSab[q] + 0.5 * tCont[q]));
    if (mat.ghiacciato) c = FORMA_NEVE.map((f) => aGhiaccio * f); // una crosta di ghiaccio d'acqua (95% dei minerali di superficie)
    // il gelo: la parte dell'anno che il punto passa sotto lo zero (lo stesso conto della carta: clima e quota, 6,5 °C al km)
    let gelo;
    if (cl && cl.media) { const su = suMare ? (h - Math.max(campo(cl.quota, i, j), mare)) / 1000 : 0, Tloc = campo(cl.media, i, j) - 6.5 * su; gelo = Math.min(1, Math.max(0, campo(cl.freddo, i, j), suMare ? ((cl.neve ?? 1) * (268 - Tloc)) / 12 : 0)); }
    else gelo = B.T - 0.45 * Math.abs(90 - ((v0 + ((j + 0.5) / H) * (v1 - v0)) * 180)) - Math.max(0, h) * 0.0065 < 265 ? 1 : 0;
    if (gelato) gelo = 1; const g = Math.pow(gelo, 0.7);
    for (let q = 0; q < 3; q++) terra[4 * k + q] = srgb(c[q] + (aGhiaccio * FORMA_NEVE[q] - c[q]) * g);
    terra[4 * k + 3] = 255;
  }
  // --- l'acqua vista da sopra (mare.js), senza l'esposizione, la luce e il cielo che coloraMare ci mette: c = 255·(3,5·luce·
  // (R + cielo))^(1/2,2) ⇒ R = (c/255)^2,2 / (3,5·luce) − cielo. R è la riflettanza sotto la superficie (Gordon 1975); sopra ne
  // esce t²/n² ≈ 0,54 (Mobley 1994). Dove coloraMare ha messo ghiaccio o sale (chiaro in tutti i colori: l'acqua, anche torbida,
  // ne assorbe almeno uno) si tiene il colore com'è, che è già una riflettanza.
  let acqua = null;
  if (haAcqua && liquido) { acqua = new Uint8ClampedArray(4 * W * H); coloraMare(B.mare, sf, acqua); const luce = B.mare.luce || [1, 1, 1], CIELO = [0.008, 0.012, 0.018];
    for (let k = 0; k < W * H; k++) { if (!bagnato[k]) { acqua[4 * k + 3] = 0; continue; } if (!acqua[4 * k + 3]) { acqua.set([10, 30, 60, 255], 4 * k); }
      const raw = [0, 1, 2].map((q) => lin(acqua[4 * k + q])), inv = raw.map((x, q) => 0.54 * Math.max(0, x / (3.5 * luce[q]) - CIELO[q])), f = Math.max(0, Math.min(1, (Math.min(...raw) - 0.35) / 0.25));
      for (let q = 0; q < 3; q++) acqua[4 * k + q] = srgb(inv[q] + (raw[q] - inv[q]) * f); } }
  // (perché sulla riva i due colori non si mescolino: quello dell'acqua si estende sulla terra vicina e viceversa)
  const estendi = (img, vale) => { let ok = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) ok[k] = vale(k) ? 1 : 0;
    for (let giro = 0; giro < 3; giro++) { const dopo = ok.slice();
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = j * W + i; if (ok[k]) continue; let r = 0, g = 0, b = 0, m = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const y = j + dj, x = i + di; if (y < 0 || y >= H || x < 0 || x >= W) continue; const q = y * W + x; if (ok[q]) { r += img[4 * q]; g += img[4 * q + 1]; b += img[4 * q + 2]; m++; } }
        if (m) { img[4 * k] = r / m; img[4 * k + 1] = g / m; img[4 * k + 2] = b / m; dopo[k] = 1; } }
      ok = dopo; } };
  if (acqua) { estendi(acqua, (k) => bagnato[k]); estendi(terra, (k) => !bagnato[k]); for (let k = 0; k < W * H; k++) acqua[4 * k + 3] = 255; }
  return { altLiv, pend, terra, oriz1: oriz.o1, oriz2: oriz.o2, acqua: acqua ? new Uint8Array(acqua.buffer) : null, hMin, hMax, haAcqua: haAcqua && liquido, gelato };
}

self.onmessage = (e) => {
  const d = e.data;
  if (d.tipo === 'base') { B = d; B.zero = zeroDi(d.se); return; }
  // (i campi grezzi di una tessera di geologia.js, per il padre del suolo fine: pianeta.js li passa a suolo.js — la stessa tessera
  // che il livello 5 della mappa userà in quel punto, così la finestra del 3D e quella del livello 5 hanno lo stesso padre)
  if (d.tipo === 'campi' && B) { try { const sf = tessera(B.k, B.se, B.cl, d.L, d.tx, d.ty, B.seme), out = { tipo: 'campi', n: d.n, k: B.k, W: sf.W, H: sf.H, rett: sf.rett, mare: sf.mare, livello: sf.livello }, tr = [];
    for (const nome of ['alt', 'lago', 'flusso', 'litologia', 'cont', 'etaCrosta', 'sciolto']) if (sf[nome]) { out[nome] = sf[nome].slice(); tr.push(out[nome].buffer); } self.postMessage(out, tr); } catch (err) { self.postMessage({ tipo: 'campi', n: d.n, k: B.k, errore: String((err && err.stack) || err) }); } return; }
  if (d.tipo !== 'tessera' || !B) return;
  try { const t0 = performance.now(), r = prepara(d.L, d.tx, d.ty);
    self.postMessage({ n: d.n, k: B.k, L: d.L, tx: d.tx, ty: d.ty, ...r, ms: performance.now() - t0 }, [r.altLiv.buffer, r.pend.buffer, r.terra.buffer, r.oriz1.buffer, r.oriz2.buffer, ...(r.acqua ? [r.acqua.buffer] : [])]);
  } catch (err) { self.postMessage({ n: d.n, k: B.k, L: d.L, tx: d.tx, ty: d.ty, errore: String((err && err.stack) || err) }); }
};
