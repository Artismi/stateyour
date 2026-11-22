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
// LE RIFLETTANZE DELLE TERRE: vedi `materiali` qui sotto (la roccia nuda dai suoi minerali, il suolo dall'alterazione con gli
// ossidi di ferro, l'acqua che lo bagna, i fiumi dalla portata) e, per la neve e il ghiaccio, l'albedo del ghiaccio del clima
// (leggi.js CLIMA.albedoGhiaccio, la stessa che il clima ha usato) con la forma spettrale della neve a grani di qualche
// centinaio di micron (Warren 1982, Rev. Geophys. 20, 67: qualche per cento in meno nel rosso che nel blu). MANCANO: la grana
// della neve, l'età della lava (nessuna «lava fresca» distinta dalla vecchia), la vita.
import { tessera } from '../camera/geologia.js';
import { coloraMare } from '../camera/mare.js';
import { acquaNelPunto } from '../camera/colore_acqua.js';
import { CLIMA } from '../camera/leggi.js';
import { ricorda } from '../camera/deposito.js';
import { sistema } from '../camera/cosmo.js';
import { finestraSuolo, immagineSuolo, rocciaDelPianeta, granulometria, porositaImpacchettata, SUOLO } from '../camera/suolo.js';
import { EROSIONE } from '../camera/geologia.js';
import { coloreRoccia } from '../camera/chimica.js';
import { PARAMETRI } from '../camera/meteo.js';
import { ottava } from '../camera/eredita.js';

let B = null; // la superficie intera del pianeta (il livello 0) e ciò che serve per le tessere
const W = 256, H = 128, WB = W + 2, HB = H + 2;
const lin = (c) => Math.pow(c / 255, 2.2), srgb = (x) => Math.round(255 * Math.pow(Math.max(0, Math.min(1, x)), 1 / 2.2));
const FORMA_NEVE = [0.955, 1.0, 1.015];
// LA ROCCIA NUDA: la tinta è quella dei suoi minerali (chimica.js coloreRoccia, Kubelka-Munk sulle polveri), la luminosità quella
// della roccia in massa, che dipende da quanti minerali scuri porta: tra il granito (0,24, con ~10% di minerali femici) e il
// basalto (0,08, con ~55%) delle misure della USGS Spectral Library (Kokaly e altri 2017, splib07; ASTER, Baldridge e altri
// 2009), in linea retta sulla parte femica (olivina, pirosseno, biotite, ossidi di ferro, ferro) dei minerali di quel pianeta.
// IL SUOLO: i minerali che restano dopo l'alterazione e l'argilla che lasciano (suolo.js granulometria, con le velocità di
// chimica.js, per il tempo che il suolo passa sotto il cielo: h₀/(P₀·e⁻¹), il bilancio di Heimsath), più gli OSSIDI DI FERRO:
// il ferro dei minerali femici sciolti diventa ferro ferrico dove l'aria ha ossigeno; ematite rossa dove il suolo si asciuga,
// goethite gialla dove resta umido (Kämpf e Schwertmann 1983, Clays Clay Miner. 31, 359; Cornell e Schwertmann 2003, cap. 16:
// il rapporto Hm/(Hm + Gt) scende con l'umidità del suolo), con la tinta della goethite in polvere (Munsell 10YR 6/8). Una
// polvere è il suolo stesso: la sua riflettanza secca è quella della miscela (Kubelka-Munk). LA SOSTANZA ORGANICA: nessuna,
// il modello non ha ancora la vita sulle terre (lavoro 10). BAGNATO, un suolo è più scuro (Lekner e Dorf 1988, Appl. Opt. 27,
// 1278): la luce rimandata dai grani torna indietro dal velo d'acqua per riflessione interna con probabilità x = 1 − (1 − ρ̄)/n²
// (ρ̄ = 0,066 per l'acqua, n = 1,333), quindi A_bagnato = (1 − ρ̄)·A·(1 − x)/(1 − x·A).
const GOETHITE = [196, 142, 58], FEMICI = { olivina: 0.11, pirosseno: 0.1, biotite: 0.2, magnetite: 1.03, 'ferro metallico': 1.43, ematite: 1 }, RHO_E = 0.066, XI = 1 - (1 - RHO_E) / 1.333 ** 2;
const bagnata = (A) => ((1 - RHO_E) * A * (1 - XI)) / (1 - XI * A);
const ACQUA_FIUME = [10, 30, 60].map((c) => Math.pow(c / 255, 2.2) / 3.5); // (la riflettanza dell'acqua limpida e profonda di mare.js, senza la sua esposizione)
const MATERIALI = new Map();
function materiali(Tc, umido) {
  const Tk = Math.round(Tc), chiave = `${B.k}|${Tk}|${umido}`; let M = MATERIALI.get(chiave); if (M) return M;
  if (!B.P) { const v = JSON.parse(B.k); B.P = sistema(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta]; }
  const P = B.P, mt = B.se.materiali || {}, aria = P.atmosfera?.gas || {}, pCO2 = (aria.CO2 || 0) * ((P.clima?.pressione ?? 1e5) / 1e5), ossido = (aria.O2 || 0) > 1e-3 || mt.ossidato;
  const anni = SUOLO.h0 / (EROSIONE.suolo * Math.exp(-1)), uno = (tipo, lista) => {
    if (!lista || !lista.length) lista = [{ nome: 'plagioclasio', frazione: 1, colore: [150, 140, 124] }];
    const R = rocciaDelPianeta(P, { tipo, minerali: lista, Tsup: Tk }), fem = lista.reduce((a, m) => a + (FEMICI[m.nome] !== undefined && m.nome !== 'ematite' ? m.frazione : 0), 0) / Math.max(1e-9, lista.reduce((a, m) => a + m.frazione, 0));
    const A = 0.24 + (0.08 - 0.24) * Math.min(1, Math.max(0, (fem - 0.1) / 0.45)), tR = tinta(coloreRoccia(lista)), roccia = tR.map((x) => A * x);
    const gsd = granulometria(R, { T: Tk, anni, pCO2 }), cls = gsd.classi.map((c) => ({ frazione: c.massa, colore: c.colore }));
    let fe = 0; if (ossido) for (const c of gsd.classi) { const f = FEMICI[c.nome]; if (f && c.sciolto > 0) fe += (c.massa / Math.max(1e-6, 1 - c.sciolto)) * c.sciolto * f; } // (il ferro sciolto, come Fe₂O₃, per unità di massa del suolo)
    if (fe > 1e-5) { cls.push({ frazione: fe * (1 - umido), colore: [152, 62, 42] }); cls.push({ frazione: fe * umido, colore: GOETHITE }); }
    const suolo = coloreRoccia(cls).map((c) => Math.pow(c / 255, 2.2)), rS = (R.rho * (1 - R.phi0)) / (gsd.rhoSolido * (1 - porositaImpacchettata(gsd)));
    return { roccia, suolo, r: rS };
  };
  M = { granito: uno('granito', mt.continente), basalto: uno('basalto', mt.basalto), sedimento: uno('sedimento', mt.continente) };
  MATERIALI.set(chiave, M); if (MATERIALI.size > 64) MATERIALI.delete(MATERIALI.keys().next().value); return M;
}
// i materiali nel punto: tra i due gradini di temperatura di 10 K attorno e tra il suolo secco (ematite) e umido (goethite), in
// linea retta (i gradini fissi, uguali per tutte le tessere: niente salti sul bordo tra due tessere)
function materialiNelPunto(T, u) {
  const x = T / 10, t0 = Math.floor(x), f = x - t0, A = materiali(10 * t0, 0), Bm = materiali(10 * t0, 1), C = materiali(10 * t0 + 10, 0), D = materiali(10 * t0 + 10, 1), out = {};
  for (const k of ['granito', 'basalto', 'sedimento']) { const m = (p) => [0, 1, 2].map((q) => (1 - f) * ((1 - u) * A[k][p][q] + u * Bm[k][p][q]) + f * ((1 - u) * C[k][p][q] + u * D[k][p][q])); out[k] = { roccia: m('roccia'), suolo: m('suolo'), r: (1 - f) * A[k].r + f * C[k].r }; }
  return out;
}
// un campo di meteo.js (griglia m.W × m.H) nel punto (u, v) della carta, interpolato tra i centri delle celle
const campoMeteo = (m, arr, u, v) => { const x = u * m.W - 0.5, y = Math.min(m.H - 1.001, Math.max(0, v * m.H - 0.5)), x0 = Math.floor(x), y0 = Math.floor(y), a = x - x0, b = y - y0, f = (xx, yy) => arr[yy * m.W + ((xx % m.W) + m.W) % m.W]; return f(x0, y0) * (1 - a) * (1 - b) + f(x0 + 1, y0) * a * (1 - b) + f(x0, y0 + 1) * (1 - a) * b + f(x0 + 1, y0 + 1) * a * b; };
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

// L'UMIDITÀ E IL SUOLO DI UNA TESSERA, CONDIZIONATI SULLA MADRE (eredita.js, «il figlio è il padre più una correzione a media
// nulla»). Il campo grezzo del punto (l'umidità del secchio distribuita con l'indice topografico; la parte coperta di suolo dal
// bilancio di Heimsath, per i tre materiali; il sedimento che l'erosione della tessera ha posato) dipende dalla grana: la pendenza e l'area drenata della tessera figlia non sono quelle
// della madre, e la media della figlia sulla cella della madre se ne staccava (padri.mjs: ΔE fino a 6,9 entrando nella figlia).
// Qui la figlia è la PREDIZIONE della madre (due ottave di eredita.js ottava, senza rumore: la predizione di Donoho, che conserva
// le medie delle celle della madre) più lo scarto del campo grezzo dalla sua media su ogni cella della madre (4 × 4 punti): la
// media sulla cella della madre resta quella della madre (a meno del taglio in [0, 1]), il dettaglio è quello della figlia.
// SEMPLIFICAZIONE: oltre il bordo della tessera madre la predizione ripete l'ultima cella (le tessere vicine della madre non si
// calcolano qui): sul bordo tra due madri la pendenza della predizione è presa da una parte sola.
// (la figlia g, nc valori per punto, diventa la predizione della madre Pa più il suo scarto dalla media su ogni cella della madre)
function condiziona(g, Pa, tx, ty, nc, radice) {
  const ox = (tx & 3) * (W / 4), oy = (ty & 3) * (H / 4), nI = W / 4, nJ = H / 4, w1 = 2 * (nI + 4), h1 = 2 * (nJ + 4);
  for (let q = 0; q < nc; q++) {
    const o1 = ottava({ padre: (I, J) => Pa[nc * (Math.max(0, Math.min(H - 1, J)) * W + Math.max(0, Math.min(W - 1, I))) + q], livello: 0, I0: ox - 2, J0: oy - 2, nI: nI + 4, nJ: nJ + 4, radice, nome: 'predizione', sigma: 0 });
    const o2 = ottava({ padre: (I, J) => o1[Math.max(0, Math.min(h1 - 1, J - 2 * (oy - 2))) * w1 + Math.max(0, Math.min(w1 - 1, I - 2 * (ox - 2)))], livello: 1, I0: 2 * ox, J0: 2 * oy, nI: 2 * nI, nJ: 2 * nJ, radice, nome: 'predizione', sigma: 0 });
    for (let J = 0; J < nJ; J++) for (let I = 0; I < nI; I++) { let m = 0; for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) m += g[nc * ((4 * J + b) * W + 4 * I + a) + q]; m /= 16;
      // (il dettaglio stretto quanto serve perché nessun punto esca da [0, 1]: lo stesso fattore per i 16 punti della cella
      // lascia nulla la media dello scarto, e la media della cella resta la predizione, cioè la madre. Tagliare punto per
      // punto, invece, alzava le celle scure — un fiume, un lago nella madre — dove la figlia ha più contrasto della madre)
      let s = 1; for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const k = (4 * J + b) * W + 4 * I + a, p = Math.min(1, Math.max(0, o2[k])), d = g[nc * k + q] - m; if (p + s * d < 0) s = p / -d; else if (p + s * d > 1) s = (1 - p) / d; }
      for (let b = 0; b < 4; b++) for (let a = 0; a < 4; a++) { const k = (4 * J + b) * W + 4 * I + a; g[nc * k + q] = Math.min(1, Math.max(0, o2[k] + s * (g[nc * k + q] - m))); } } }
}
const UMIDI = new Map();
function campoUmido(L, tx, ty, sf = null) {
  const chiave = `${B.k}|${L}|${tx}|${ty}`; let U = UMIDI.get(chiave); if (U) return U;
  sf ??= tessera(B.k, B.se, B.cl, L, tx, ty, B.seme);
  const lg = sf.largo && sf.largo.W > W ? sf.largo : null, alt = new Float32Array(WB * HB);
  if (lg) { const ox = (lg.W - W) / 2 - 1, oy = (lg.H - H) / 2 - 1; for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) alt[j * WB + i] = lg.alt[(j + oy) * lg.W + i + ox]; }
  else for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) alt[j * WB + i] = sf.alt[Math.max(0, Math.min(H - 1, j - 1)) * W + ((i - 1 + W) % W)];
  const cl = B.cl, [ru0, v0, ru1, v1] = sf.rett || [0, 0, 1, 1], passoLat = ((v1 - v0) * Math.PI * B.raggioM) / H, r0 = B.se;
  const campo = (arr, i, j) => { const x = (ru0 + ((i + 0.5) / W) * (ru1 - ru0)) * cl.W - 0.5, y = Math.min(cl.H - 1.001, Math.max(0, (v0 + ((j + 0.5) / H) * (v1 - v0)) * cl.H - 0.5)), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, a = (xx, yy) => arr[yy * cl.W + ((xx % cl.W) + cl.W) % cl.W]; return a(x0, y0) * (1 - u) * (1 - v) + a(x0 + 1, y0) * u * (1 - v) + a(x0, y0 + 1) * (1 - u) * v + a(x0 + 1, y0 + 1) * u * v; };
  const x0Di = (i) => (ru0 + ((i + 0.5) / W) * (ru1 - ru0)) * r0.W - 0.5, y0Di = (j) => Math.max(0, Math.min(r0.H - 1.001, (v0 + ((j + 0.5) / H) * (v1 - v0)) * r0.H - 0.5));
  const bil0 = (f, i, j) => { const x = x0Di(i), y = y0Di(j), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, a = (xx, yy) => f(yy * r0.W + ((xx % r0.W) + r0.W) % r0.W); return a(x0, y0) * (1 - u) * (1 - v) + a(x0 + 1, y0) * u * (1 - v) + a(x0, y0 + 1) * (1 - u) * v + a(x0 + 1, y0 + 1) * u * v; };
  const me = cl?.meteo, secchio = me?.suolo ? (i, j) => Math.min(1, Math.max(0, campoMeteo(me, me.suolo, ru0 + ((i + 0.5) / W) * (ru1 - ru0), v0 + ((j + 0.5) / H) * (v1 - v0)) / PARAMETRI.secchio)) : () => 0.5;
  const suolo0 = (Rk, K, i, j) => { const E = K * bil0((q) => B.AmS[q], i, j); return E >= EROSIONE.suolo * Rk.r ? 0 : Math.min(1, Math.log((EROSIONE.suolo * Rk.r) / Math.max(E, 1e-12))); };
  const dxC = passoLat * Math.max(0.05, Math.cos((0.5 - (v0 + v1) / 2) * Math.PI)), aCella = dxC * passoLat, fl = sf.flusso;
  const grezzo = [0, 1, 2, 3, 4].map(() => new Float32Array(W * H)); // umidità, suolo su granito, su basalto, su sedimento, sedimento posato da questa erosione
  for (let j = 0; j < H; j++) { const lat = (0.5 - (v0 + ((j + 0.5) / H) * (v1 - v0))) * Math.PI, passoLon = passoLat * Math.max(0.02, Math.cos(lat));
    for (let i = 0; i < W; i++) { const k = j * W + i, c = (j + 1) * WB + i + 1, gx = (alt[c + 1] - alt[c - 1]) / (2 * passoLon), gy = (alt[c - WB] - alt[c + WB]) / (2 * passoLat);
      // l'indice topografico di umidità (Beven e Kirkby 1979), contato da quello di una cella senza niente a monte sulla pendenza della superficie intera
      const twi = Math.log((Math.max(1, fl ? fl[k] : 1) * aCella) / dxC / Math.max(1e-4, Math.hypot(gx, gy))), twiRif = Math.log(aCella / dxC / Math.max(1e-4, bil0((q) => B.S0[q], i, j)));
      const M3 = materialiNelPunto(cl && cl.media ? campo(cl.media, i, j) : B.T, secchio(i, j));
      grezzo[0][k] = Math.min(1, secchio(i, j) * Math.exp(Math.min(30, twi - twiRif))); grezzo[1][k] = suolo0(M3.granito, EROSIONE.K.granito, i, j); grezzo[2][k] = suolo0(M3.basalto, EROSIONE.K.vulcanica, i, j); grezzo[3][k] = suolo0(M3.sedimento, EROSIONE.K.granito, i, j); grezzo[4][k] = sf.depositato ? Math.min(1, Math.max(0, sf.depositato[k]) / SUOLO.h0) : 0; } }
  if (L > 0) { const madre = campoUmido(L - 1, tx >> 2, ty >> 2); for (let q = 0; q < 5; q++) condiziona(grezzo[q], madre[q], tx, ty, 1, 'umido'); }
  UMIDI.set(chiave, grezzo); if (UMIDI.size > 48) UMIDI.delete(UMIDI.keys().next().value); return grezzo;
}

// LA TINTA DELLE TERRE DI UNA TESSERA (riflettanza lineare, tre canali per punto), CONDIZIONATA SULLA MADRE come l'umidità e
// il suolo di campoUmido: la predizione della madre (due ottave di eredita.js ottava senza rumore, che conserva le medie delle
// celle della madre) più lo scarto della tinta grezza dalla sua media su ogni cella della madre (4 × 4 punti). Condizionare
// solo l'umidità e il suolo non bastava: le altre parti della tinta cambiano con la grana e non si conservano in media —
// le classi di roccia, dal livello 1 interpolate tra i centri del livello 0 (al livello 0 sono nette: la media
// dell'interpolata su una cella non è il valore della cella, e il contrasto scendeva a 0,52 delle varianze), la parte di
// cella che il letto di un fiume copre (dalla portata della griglia di quel livello), il gelo che segue la quota fine —
// e la figlia si staccava dalla madre fino a ΔE 7,6 e allo scarto del 150 % della sua deviazione (padri.mjs). Così la media
// della figlia sulla cella della madre è quella della madre (a meno del taglio in [0, 1]); il dettaglio resta della figlia.
// (stessa SEMPLIFICAZIONE di campoUmido sul bordo della tessera madre)
const TINTE = new Map();
function tintaTerre(L, tx, ty, sf = null) {
  const chiave = `${B.k}|${L}|${tx}|${ty}`; let tlC = TINTE.get(chiave); if (tlC) return tlC;
  sf ??= tessera(B.k, B.se, B.cl, L, tx, ty, B.seme);
  const mare = sf.mare, haMare = isFinite(mare), liquido = !!(B.mare && B.mare.esiste), gelato = haMare && !liquido, [, v0, , v1] = sf.rett || [0, 0, 1, 1], passoLat = ((v1 - v0) * Math.PI * B.raggioM) / H;
  // --- la riflettanza delle terre: la roccia e il suolo del punto, l'acqua che li bagna, i fiumi, la neve e il ghiaccio (vedi in testa)
  const tl = new Float32Array(3 * W * H), cl = B.cl, mat = sf.materiali || {}, [ru0, , ru1] = sf.rett || [0, 0, 1, 1], aGhiaccio = CLIMA.albedoGhiaccio;
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
  // i materiali al clima del centro della tessera (la temperatura, l'umidità del secchio di meteo.js) e l'umidità dal rilievo
  const Tc = cl && cl.media ? campo(cl.media, W >> 1, H >> 1) : B.T, me = cl?.meteo, secchio = me?.suolo ? (i, j) => Math.min(1, Math.max(0, campoMeteo(me, me.suolo, ru0 + ((i + 0.5) / W) * (ru1 - ru0), v0 + ((j + 0.5) / H) * (v1 - v0)) / PARAMETRI.secchio)) : () => 0.5;
  // (A^m·S della superficie intera, per cella; poi la parte coperta di suolo nel punto, interpolata tra i centri)
  if (!B.AmS) { const { W: w, H: h, alt: a, flusso: f } = r0, out = new Float32Array(w * h), pend0 = new Float32Array(w * h), dy = (Math.PI * B.raggioM) / h;
    for (let jj = 0; jj < h; jj++) { const dx = Math.max(0.05 * dy, (2 * Math.PI * B.raggioM * Math.cos((0.5 - (jj + 0.5) / h) * Math.PI)) / w); for (let ii = 0; ii < w; ii++) { const q = jj * w + ii, e = a[jj * w + ((ii + 1) % w)], o = a[jj * w + ((ii - 1 + w) % w)], n = a[Math.max(0, jj - 1) * w + ii], sd = a[Math.min(h - 1, jj + 1) * w + ii];
      const S0 = Math.hypot((e - o) / (2 * dx), (n - sd) / (2 * dy)); pend0[q] = S0; out[q] = Math.pow(Math.max(1, f ? f[q] : 1) * dx * dy, EROSIONE.m) * S0; } } B.AmS = out; B.S0 = pend0; }
  const suolo0 = (Rk, K, i, j) => { const E = K * bil0((q) => B.AmS[q], i, j); return E >= EROSIONE.suolo * Rk.r ? 0 : Math.min(1, Math.log((EROSIONE.suolo * Rk.r) / Math.max(E, 1e-12))); };
  const M3c = (i, j) => materialiNelPunto(cl && cl.media ? campo(cl.media, i, j) : B.T, secchio(i, j)), dxC = passoLat * Math.max(0.05, Math.cos((0.5 - (v0 + v1) / 2) * Math.PI)), aCella = dxC * passoLat;
  // l'indice topografico di umidità (Beven e Kirkby 1979): ln(a/tan β), a l'area drenata per unità di larghezza, contato da
  // quello di una cella senza niente a monte sulla pendenza della superficie intera (interpolata): le valli e le conche più
  // umide del secchio, i versanti come lui. (Prima: diviso per la media della tessera; ma la media cambia da una tessera
  // all'altra, e sul loro bordo il colore saltava: una retta netta attraverso lo schermo)
  const fl = sf.flusso;
  const U = campoUmido(L, tx, ty, sf); // (l'umidità e il suolo, condizionati sulla tessera madre: vedi campoUmido)
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i, h = sf.alt[k], suMare = !(haMare && h < mare);
    // la roccia: la classe che l'erosione ha lasciato in superficie (basamento, lave, copertura), sulla crosta dei continenti
    // (il basamento è granito) o su quella dei fondali (basalto)
    const fc = r0.cont ? bil0((q) => (r0.cont[q] ? 1 : 0), i, j) : 1, cl0 = lito && lito0 ? lito0[cella0(i, j)] : -1;
    let f1, f2; if (lito && lito0 && L > 0 && lito[k] === cl0) { f1 = bil0((q) => (lito0[q] === 1 ? 1 : 0), i, j); f2 = bil0((q) => (lito0[q] === 2 ? 1 : 0), i, j); } else { f1 = lito && lito[k] === 1 ? 1 : 0; f2 = lito && lito[k] === 2 ? 1 : 0; }
    const f0 = Math.max(0, 1 - f1 - f2), wG = fc * f0, wS = f2, wB = Math.max(0, 1 - wG - wS);
    // IL SUOLO: lo spessore dal bilancio di Heimsath (suolo.js spessoreSuolo): la roccia diventa suolo al più P₀·e^(−h/h₀), il
    // punto si abbassa di E = K·A^m·S (la legge dei fiumi di geologia.js): h = h₀·ln(P₀·r/E); dove E supera P₀·r la roccia è nuda
    // (gli AFFIORAMENTI). La parte coperta: h/h₀ (sotto mezzo metro il suolo lascia vedere la roccia). A e S sono quelli della
    // superficie intera (il livello 0), interpolati: la legge dipende dalla grana della griglia (A^m·S con la cella più fine
    // cambia), e presa a ogni livello faceva cambiare colore alle terre entrando nella tessera figlia (ΔE fino a 14, padri.mjs)
    const M3 = M3c(i, j), sG = U[1][k], sB = U[2][k], sS = U[3][k]; // (la copertura litificata si altera come la roccia: K del sedimento è quello del sedimento SCIOLTO, e con lui la copertura restava sempre nuda — più scura del basamento accanto, a blocchi quanto le celle della madre)
    // L'UMIDITÀ del punto: quella del secchio del suolo di meteo.js (Manabe 1969) lì, distribuita col rilievo come in TOPMODEL
    // (Beven e Kirkby 1979: il deficit locale cresce con la differenza dall'indice medio, in forma esponenziale): più acqua nelle
    // valli e nelle conche, meno sui crinali
    const wet = U[0][k], dep = U[4][k];
    const c = [0, 0, 0]; for (let q = 0; q < 3; q++) { const rG = M3.granito.roccia[q] * (1 - sG) + M3.granito.suolo[q] * sG, rB = M3.basalto.roccia[q] * (1 - sB) + M3.basalto.suolo[q] * sB, rS = M3.sedimento.roccia[q] * (1 - sS) + M3.sedimento.suolo[q] * sS;
      const asciutta = (wG * rG + wB * rB + wS * rS) * (1 - dep) + dep * M3.sedimento.suolo[q]; c[q] = asciutta * (1 - wet) + bagnata(asciutta) * wet; }
    // I FIUMI: la larghezza dalla portata (la geometria idraulica di Leopold e Maddock 1953, w ≈ 7,2·Q^0,5 m con Q in m³/s: Moody e
    // Troutman 2002 sui fiumi del mondo); la parte della cella che il letto copre è acqua (riflettanza dell'acqua profonda
    // vista da sopra, quella di mare.js per l'acqua limpida); i letti larghi più di mezza cella sono acqua (vedi sopra)
    if (suMare && fl) { const Q = (fl[k] * aCella) / 3.15576e7, fr = Math.min(0.5, (7.2 * Math.sqrt(Q)) / Math.max(dxC, passoLat)); if (fr > 0.002) for (let q = 0; q < 3; q++) c[q] = c[q] * (1 - fr) + ACQUA_FIUME[q] * fr; }
    let cc = c; if (mat.ghiacciato) cc = FORMA_NEVE.map((f) => aGhiaccio * f); // una crosta di ghiaccio d'acqua (95% dei minerali di superficie)
    // il gelo: la parte dell'anno che il punto passa sotto lo zero (lo stesso conto della carta: clima e quota, 6,5 °C al km)
    let gelo;
    if (cl && cl.media) { const su = suMare ? (h - Math.max(campo(cl.quota, i, j), mare)) / 1000 : 0, Tloc = campo(cl.media, i, j) - 6.5 * su; gelo = Math.min(1, Math.max(0, campo(cl.freddo, i, j), suMare ? ((cl.neve ?? 1) * (268 - Tloc)) / 12 : 0)); }
    else gelo = B.T - 0.45 * Math.abs(90 - ((v0 + ((j + 0.5) / H) * (v1 - v0)) * 180)) - Math.max(0, h) * 0.0065 < 265 ? 1 : 0;
    if (gelato) gelo = 1; const g = Math.pow(gelo, 0.7);
    for (let q = 0; q < 3; q++) tl[3 * k + q] = Math.min(1, Math.max(0, cc[q] + (aGhiaccio * FORMA_NEVE[q] - cc[q]) * g));
  }
  if (L > 0) condiziona(tl, tintaTerre(L - 1, tx >> 2, ty >> 2), tx, ty, 3, 'tinta');
  TINTE.set(chiave, tl); if (TINTE.size > 48) TINTE.delete(TINTE.keys().next().value); return tl;
}

function prepara(L, tx, ty) {
  const sf = tessera(B.k, B.se, B.cl, L, tx, ty, B.seme), mare = sf.mare, haMare = isFinite(mare), liquido = !!(B.mare && B.mare.esiste);
  // --- quote e laghi col bordo di un punto: dal bordo largo della tessera, o (livello 0) richiudendo in longitudine
  const alt = new Float32Array(WB * HB), lago = new Float32Array(WB * HB), lg = sf.largo && sf.largo.W > W ? sf.largo : null;
  if (lg) { const ox = (lg.W - W) / 2 - 1, oy = (lg.H - H) / 2 - 1; for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const q = (j + oy) * lg.W + i + ox; alt[j * WB + i] = lg.alt[q]; lago[j * WB + i] = lg.lago ? lg.lago[q] : 0; } }
  else for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const q = Math.max(0, Math.min(H - 1, j - 1)) * W + ((i - 1 + W) % W); alt[j * WB + i] = sf.alt[q]; lago[j * WB + i] = sf.lago ? sf.lago[q] : 0; }
  // --- I FIUMI LARGHI quanto mezza cella o più sono acqua: la larghezza w ≈ 7,2·Q^0,5 m e la profondità d ≈ 0,27·Q^0,39 m dalla
  // portata (la geometria idraulica di Leopold e Maddock 1953, coi coefficienti di Moody e Troutman 2002 sui fiumi del mondo; Q
  // dall'area drenata e dalla pioggia: flusso × area della cella, per anno). Così la riva del fiume la fa il frammento, come
  // quella dei laghi; quelli più stretti restano nel colore della terra (vedi sotto, la parte della cella che coprono)
  const fiumeAcqua = new Uint8Array(W * H); { const [, fv0, , fv1] = sf.rett || [0, 0, 1, 1], dyC = ((fv1 - fv0) * Math.PI * B.raggioM) / H, dxC = dyC * Math.max(0.05, Math.cos((0.5 - (fv0 + fv1) / 2) * Math.PI)), aC = dxC * dyC, F = lg ? lg.flusso : sf.flusso;
    if (F) for (let j = 0; j < HB; j++) for (let i = 0; i < WB; i++) { const c = j * WB + i, q = lg ? (j + (lg.H - H) / 2 - 1) * lg.W + i + (lg.W - W) / 2 - 1 : Math.max(0, Math.min(H - 1, j - 1)) * W + ((i - 1 + W) % W); if (haMare && alt[c] < mare) continue;
      const Q = (F[q] * aC) / 3.15576e7; if (7.2 * Math.sqrt(Q) < 0.5 * Math.min(dxC, dyC)) continue; lago[c] = Math.max(lago[c], 0.27 * Math.pow(Q, 0.39)); if (i > 0 && j > 0 && i <= W && j <= H) fiumeAcqua[(j - 1) * W + i - 1] = 1; } }
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
  // --- la riflettanza delle terre (tintaTerre, condizionata sulla madre) e dove la terra è bagnata (mare, laghi, fiumi larghi)
  const bagnato = new Uint8Array(W * H); for (let k = 0; k < W * H; k++) bagnato[k] = (haMare && sf.alt[k] < mare) || (sf.lago && sf.lago[k] > 0) || fiumeAcqua[k] ? 1 : 0;
  const tl = tintaTerre(L, tx, ty, sf), terra = new Uint8Array(4 * W * H);
  for (let k = 0; k < W * H; k++) { for (let q = 0; q < 3; q++) terra[4 * k + q] = srgb(tl[3 * k + q]); terra[4 * k + 3] = 255; }
  // --- l'acqua vista da sopra (mare.js), senza l'esposizione, la luce e il cielo che coloraMare ci mette: c = 255·(3,5·luce·
  // (R + cielo))^(1/2,2) ⇒ R = (c/255)^2,2 / (3,5·luce) − cielo. R è la riflettanza sotto la superficie (Gordon 1975); sopra ne
  // esce t²/n² ≈ 0,54 (Mobley 1994). Dove coloraMare ha messo ghiaccio o sale (chiaro in tutti i colori: l'acqua, anche torbida,
  // ne assorbe almeno uno) si tiene il colore com'è, che è già una riflettanza.
  let acqua = null;
  if (haAcqua && liquido) { acqua = new Uint8ClampedArray(4 * W * H); coloraMare(B.mare, sf, acqua); const luce = B.mare.luce || [1, 1, 1], CIELO = [0.008, 0.012, 0.018];
    for (let k = 0; k < W * H; k++) { if (!bagnato[k]) { acqua[4 * k + 3] = 0; continue; } if (!acqua[4 * k + 3]) { acqua.set([10, 30, 60, 255], 4 * k); }
      const raw = [0, 1, 2].map((q) => lin(acqua[4 * k + q])), f = Math.max(0, Math.min(1, (Math.min(...raw) - 0.35) / 0.25));
      // (l'acqua libera: la stessa ottica in 21 bande, colore_acqua.js, che sa dove coloraMare mette ghiaccio o sale — lì resta il
      // suo colore, scelto come prima dalla sua chiarezza. Prima anche un fondo chiaro e basso, carbonato o sabbia, passava per
      // ghiaccio: la riflettanza «com'è» di coloraMare, con la sua esposizione dentro, fino a 0,9)
      const i = k % W, j = (k - i) / W, d = haMare && sf.alt[k] < mare ? mare - sf.alt[k] : sf.lago && sf.lago[k] > 0 ? sf.lago[k] : 1;
      const ombra = d < 80 ? Math.max(0.55, Math.min(1.5, 1 + (sf.alt[j * W + (i > 0 ? i - 1 : i)] - sf.alt[k] + sf.alt[(j > 0 ? j - 1 : j) * W + i] - sf.alt[k]) / Math.max(2, 0.02 * passoLat))) : 1;
      const [ru0, , ru1] = sf.rett || [0, 0, 1, 1], sp = acquaNelPunto(B.mare, (ru0 + ((i + 0.5) / W) * (ru1 - ru0)) * 360 - 180, 90 - (v0 + ((j + 0.5) / H) * (v1 - v0)) * 180, d, ombra);
      const inv = sp || raw.map((x, q) => 0.54 * Math.max(0, x / (3.5 * luce[q]) - CIELO[q]));
      for (let q = 0; q < 3; q++) acqua[4 * k + q] = srgb(sp ? inv[q] : inv[q] + (raw[q] - inv[q]) * f); } }
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
  // (il SUOLO FINE del 3D, pianeta.js faiFine: il campo della finestra di 256 punti — il rilievo fine, ~1 s — e la tinta da
  // quella di 128, con gli stessi argomenti che pianeta.js darebbe sul filo principale: gli stessi bit)
  if (d.tipo === 'fine' && B) { try { const t0 = performance.now();
    if (!B.S) { const v = JSON.parse(B.k), P = sistema(v.cosmo, v.galassia, v.stella).pianeti[v.pianeta]; B.S = { k: B.k, P, se: B.se, cl: B.cl, seme: B.seme }; }
    const fin = finestraSuolo(B.S, { lon: d.lon, lat: d.lat, latoM: d.lato, N: 256, livello: d.campi.livello, tessera: d.campi });
    if (!fin || fin.acqua) { self.postMessage({ tipo: 'fine', n: d.n, k: B.k, acqua: true }); return; }
    const c = fin.campo, f2 = finestraSuolo(B.S, { lon: d.lon, lat: d.lat, latoM: d.lato, N: 128, livello: d.campi.livello, tessera: d.campi }), px = immagineSuolo(f2, { luce: false });
    const tr = fin.tratto, pa = fin.padre;
    self.postMessage({ tipo: 'fine', n: d.n, k: B.k, lato: d.lato, lon: d.lon, lat: d.lat, N: fin.N, h: fin.h, gx0: fin.gx0, gy0: fin.gy0, x0: fin.x0, y0: fin.y0, L: fin.L, padre: { livello: pa.livello, I: pa.I, J: pa.J }, tratto: { lon: tr.lon, lat: tr.lat, R: tr.R, coslat: tr.coslat, chiave: tr.chiave }, campo: c, px, m: f2.N, ms: performance.now() - t0 }, [px.buffer]); // (il campo si copia: i suoi array possono stare in un buffer solo)
  } catch (err) { self.postMessage({ tipo: 'fine', n: d.n, k: B.k, errore: String((err && err.stack) || err) }); } return; }
  if (d.tipo !== 'tessera' || !B) return;
  tesseraDallaMemoria(d);
};
// LA MEMORIA (camera/deposito.js): la tessera è funzione dell'indirizzo del pianeta, del livello e della posizione, e del codice
// (questo e quello della superficie da cui viene): calcolata una volta si tiene, alla visita dopo si legge (gli stessi bit).
// (la base B arriva una volta sola per filo: le tessere chieste nel frattempo aspettano la stessa B)
const CODICE = [import.meta.url, new URL('../camera/superficie.worker.js', import.meta.url).href];
async function tesseraDallaMemoria(d) {
  const b = B;
  try { const t0 = performance.now(), r = await ricorda('tessera3d', `${b.k}|${d.L}|${d.tx}|${d.ty}`, () => prepara(d.L, d.tx, d.ty), { codice: CODICE });
    self.postMessage({ n: d.n, k: b.k, L: d.L, tx: d.tx, ty: d.ty, ...r, ms: performance.now() - t0 }, [r.altLiv.buffer, r.pend.buffer, r.terra.buffer, r.oriz1.buffer, r.oriz2.buffer, ...(r.acqua ? [r.acqua.buffer] : [])]);
  } catch (err) { self.postMessage({ n: d.n, k: b.k, L: d.L, tx: d.tx, ty: d.ty, errore: String((err && err.stack) || err) }); }
}
