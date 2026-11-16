// cerca_orbite.mjs — cerca, SOLO tra le orbite periodiche (le linee chiuse), i motivi più simili a delle immagini di
// riferimento a linee (per esempio le tavole di Lewis F. Day, che non stanno nel repository).
//
// Uso: node strumenti/cerca_orbite.mjs <cartella dei riferimenti> <cartella d'uscita> [minuti]
//   (i riferimenti come per cerca_riferimenti.mjs: tavole.json e nome.f32, 128 × 128, le linee come intensità)
//
// LA MISURA (dichiarata): la distanza di chamfer tra le immagini a linee, dopo aver allineato reticolo e scala.
//   · Il reticolo del riferimento si legge dall'autocorrelazione della sua immagine a linee: p₁ è il picco più vicino
//     al centro (sopra un quarto del centro, oltre 4 punti), p₂ il più vicino non allineato; poi la riduzione di Gauss.
//   · Il motivo trovato si disegna nelle coordinate del riferimento mandando la sua base ridotta (a₁, a₂) su (p₁, p₂):
//     reticolo e scala coincidono per costruzione; si provano 4 scelte della base (scambi e uno specchio) e 4 × 4
//     traslazioni dentro la cella.
//   · chamfer = media, sui punti di linea di ognuna delle due immagini, della distanza dal punto di linea più vicino
//     dell'altra (distanza esatta in punti, trasformata di distanza a due passate 3-4), divisa per |p₁|;
//   · più 0,3 × la differenza di forma dei reticoli: |ln(rapporto dei lati)| + |differenza degli angoli|/π.
//   Più piccola è, più somiglia.
// I CANDIDATI: cristalli piani a caso dalla fonte del caso («orbite/k»: i 5 reticoli, da 1 a 3 atomi, colline o
// conche, w, l'energia tra il fondo e un po' sopra la cima), il loro catalogo di orbite periodiche (orbite.js), e per
// ogni orbita il motivo da sola e con le sorelle per la simmetria del sito più simmetrico della cella (✴️).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import { sorgente } from '../src/caso.js';
import { reticoloACaso, vincola, creaCristallo, combina } from '../src/reticolo.js';
import { PREDEFINITO, scrivi, POSTI } from '../src/indirizzo.js';
import { catalogo, scriviOrbita, punti, sorelle } from '../src/orbite.js';
import { sitiSpeciali } from '../src/simmetria.js';
import { controcampo } from '../src/linee.js';

const [, , dirRif, dirOut, minuti = '10'] = process.argv;
if (!dirRif || !dirOut) { console.log('uso: node strumenti/cerca_orbite.mjs <riferimenti> <uscita> [minuti]'); process.exit(1); }
mkdirSync(dirOut, { recursive: true });
const N = 128;

// ---------- FFT (radice 2) e autocorrelazione
function fft1(re, im, n, passo, o, inv = false) {
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const a = o + i * passo, c = o + j * passo; [re[a], re[c]] = [re[c], re[a]]; [im[a], im[c]] = [im[c], im[a]]; } }
  for (let l = 2; l <= n; l <<= 1) {
    const th = ((inv ? 2 : -2) * Math.PI) / l;
    for (let i = 0; i < n; i += l) for (let j = 0; j < l / 2; j++) {
      const wr = Math.cos(th * j), wi = Math.sin(th * j), a = o + (i + j) * passo, b = o + (i + j + l / 2) * passo;
      const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
      re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
  }
}
function fft2(re, im, inv = false) { for (let y = 0; y < N; y++) fft1(re, im, N, 1, y * N, inv); for (let x = 0; x < N; x++) fft1(re, im, N, N, x, inv); }
const ridotta = (u, v) => { for (let k = 0; k < 50; k++) { if (u[0] ** 2 + u[1] ** 2 > v[0] ** 2 + v[1] ** 2) [u, v] = [v, u]; const mu = Math.round((u[0] * v[0] + u[1] * v[1]) / (u[0] ** 2 + u[1] ** 2)); if (!mu) break; v = [v[0] - mu * u[0], v[1] - mu * u[1]]; } return (u[0] ** 2 + u[1] ** 2 > v[0] ** 2 + v[1] ** 2) ? [v, u] : [u, v]; };
function reticoloDellImmagine(mask) {
  let m = 0; for (const v of mask) m += v; m /= mask.length;
  const re = Float64Array.from(mask, (v) => v - m), im = new Float64Array(N * N);
  fft2(re, im); for (let i = 0; i < N * N; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; } fft2(re, im, true);
  const A = (x, y) => re[((y + N) % N) * N + ((x + N) % N)], c = A(0, 0), picchi = [];
  for (let y = -N / 2 + 1; y < N / 2; y++) for (let x = -N / 2 + 1; x < N / 2; x++) {
    const r = Math.hypot(x, y); if (r < 4 || r > N / 2.2) continue;
    const v = A(x, y); if (v < 0.25 * c) continue;
    let massimo = true; for (let dy = -1; dy <= 1 && massimo; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && A(x + dx, y + dy) > v) { massimo = false; break; }
    if (massimo) picchi.push([x, y, r]);
  }
  picchi.sort((a, b) => a[2] - b[2]);
  const p1 = picchi[0]; if (!p1) return [[32, 0], [0, 32]];
  const p2 = picchi.find((q) => Math.abs(p1[0] * q[1] - p1[1] * q[0]) > 0.3 * p1[2] * q[2]);
  return ridotta([p1[0], p1[1]], p2 ? [p2[0], p2[1]] : [-p1[1], p1[0]]);
}
// ---------- trasformata di distanza (chamfer 3-4, in punti)
function distanza(mask) {
  const d = new Float32Array(N * N).fill(1e9);
  for (let i = 0; i < N * N; i++) if (mask[i]) d[i] = 0;
  const g = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 1e9 : d[y * N + x]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; d[i] = Math.min(d[i], g(x - 1, y) + 3, g(x, y - 1) + 3, g(x - 1, y - 1) + 4, g(x + 1, y - 1) + 4); }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; d[i] = Math.min(d[i], g(x + 1, y) + 3, g(x, y + 1) + 3, g(x + 1, y + 1) + 4, g(x - 1, y + 1) + 4); }
  for (let i = 0; i < N * N; i++) d[i] /= 3;
  return d;
}
// ---------- il motivo nelle coordinate del riferimento: le linee (in coordinate di cella) mandate con (p₁, p₂)
function disegna(lineeF, p1, p2, c, n = N, s = 1, spessore = 1) {
  const mask = new Uint8Array(n * n), K = Math.ceil((n * 1.5) / Math.min(Math.hypot(...p1), Math.hypot(...p2)) / s) + 2;
  const P = (f0, f1) => [s * (c[0] + f0 * p1[0] + f1 * p2[0]), s * (c[1] + f0 * p1[1] + f1 * p2[1])];
  for (let i = -K; i <= K; i++) for (let j = -K; j <= K; j++) {
    for (const [a0, a1, b0, b1] of lineeF) {
      const A = P(a0 + i, a1 + j), B = P(b0 + i, b1 + j);
      if ((A[0] < -2 && B[0] < -2) || (A[1] < -2 && B[1] < -2) || (A[0] > n + 2 && B[0] > n + 2) || (A[1] > n + 2 && B[1] > n + 2)) continue;
      const L = Math.hypot(B[0] - A[0], B[1] - A[1]), q = Math.max(1, Math.ceil(2 * L));
      for (let t = 0; t <= q; t++) {
        const x = A[0] + ((B[0] - A[0]) * t) / q, y = A[1] + ((B[1] - A[1]) * t) / q;
        for (let dy = -spessore + 1; dy < spessore; dy++) for (let dx = -spessore + 1; dx < spessore; dx++) { const X = Math.floor(x) + dx, Y = Math.floor(y) + dy; if (X >= 0 && Y >= 0 && X < n && Y < n) mask[Y * n + X] = 1; }
      }
    }
  }
  return mask;
}
const media = (mask, dist) => { let s = 0, k = 0; for (let i = 0; i < mask.length; i++) if (mask[i]) { s += dist[i]; k++; } return k ? s / k : 1e9; };

// ---------- i riferimenti
const nomi = JSON.parse(readFileSync(join(dirRif, 'tavole.json'), 'utf8'));
const rif = nomi.map((nome) => {
  const e = new Float32Array(readFileSync(join(dirRif, `${nome}.f32`)).buffer.slice(0)), mask = Uint8Array.from(e, (v) => (v > 0.25 ? 1 : 0));
  const [p1, p2] = reticoloDellImmagine(mask);
  return { nome, mask, dist: distanza(mask), p1, p2, rapporto: Math.hypot(...p2) / Math.hypot(...p1), angolo: Math.acos(Math.max(-1, Math.min(1, (p1[0] * p2[0] + p1[1] * p2[1]) / (Math.hypot(...p1) * Math.hypot(...p2))))) };
});
for (const r of rif) console.log(`${r.nome}: reticolo p₁ = (${r.p1}), p₂ = (${r.p2}), rapporto ${r.rapporto.toFixed(2)}, angolo ${((r.angolo * 180) / Math.PI).toFixed(0)}°`);

// la distanza di un motivo (linee in coordinate di cella, base ridotta a1, a2) da un riferimento
function confronta(lineeF, a1, a2, r) {
  let best = { D: Infinity };
  const varianti = [[a1, a2, 0], [a2, a1, 1], [a1, [-a2[0], -a2[1]], 2], [a2, [-a1[0], -a1[1]], 3]];
  for (const [u, v, quale] of varianti) {
    const rap = Math.hypot(...v) / Math.hypot(...u), ang = Math.acos(Math.max(-1, Math.min(1, (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v)))));
    const forma = Math.abs(Math.log(rap / r.rapporto)) + Math.abs(ang - r.angolo) / Math.PI;
    // le linee nella base (u, v): le coordinate di cella del motivo sono rispetto a (a1, a2); le si riscrive
    const det = u[0] * v[1] - u[1] * v[0], conv = (f0, f1) => { const x = f0 * a1[0] + f1 * a2[0], y = f0 * a1[1] + f1 * a2[1]; return [(x * v[1] - y * v[0]) / det, (u[0] * y - u[1] * x) / det]; };
    const lf = lineeF.map(([a, b, c, d]) => [...conv(a, b), ...conv(c, d)]);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const c = [64 + (i / 4) * r.p1[0] + (j / 4) * r.p2[0], 64 + (i / 4) * r.p1[1] + (j / 4) * r.p2[1]];
      const m = disegna(lf, r.p1, r.p2, c);
      const ch = (media(m, r.dist) + media(r.mask, distanza(m))) / 2 / Math.hypot(...r.p1);
      const D = ch + 0.3 * forma;
      if (D < best.D) best = { D, ch, forma, c, quale, lf };
    }
  }
  return best;
}

// ---------- i candidati
function cristalloACaso(k) {
  const c = sorgente(`orbite/${k}`), ret = { ...vincola({ ...reticoloACaso(c.sotto('reticolo'), true), piano: true }), piano: true };
  const posti = POSTI.filter((x) => x[2] === 0).map((x) => [...x]), atomi = [];
  for (let i = 0, n = 1 + c.intero('atomi', 3); i < n && posti.length; i++) { const [q] = posti.splice(c.intero(`posto ${i}`, posti.length), 1); atomi.push({ p: q, s: c(`segno ${i}`) < 0.6 ? 1 : -1 }); }
  const w = c.tra('w', 0.12, 0.3), cr = creaCristallo({ ...ret, atomi, w });
  let Vmin = Infinity, Vmax = -Infinity;
  for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) { const r = combina([i / 12, j / 12, 0], cr.A), V = cr.campo(r[0], r[1], 0, null); Vmin = Math.min(Vmin, V); Vmax = Math.max(Vmax, V); }
  const E = Vmin + 0.05 + (Vmax - Vmin) * 1.2 * c('energia');
  return { ret, atomi, w, cr, E };
}
// le linee di un insieme di orbite, in coordinate della base ridotta del piano
function lineeDi(cr, orbite) {
  const P2 = [cr.primitiva[0], cr.primitiva[1]].map((v) => [v[0], v[1]]), [a1, a2] = ridotta(P2[0], P2[1]), det = a1[0] * a2[1] - a1[1] * a2[0];
  const fr = (x, y) => [(x * a2[1] - y * a2[0]) / det, (a1[0] * y - a1[1] * x) / det], linee = [];
  for (const o of orbite) { const { P } = punti(cr, o, [0, 0, 0]); for (let k = 1; k < P.length; k += 2) { const q = P[Math.min(P.length - 1, k + 1)]; linee.push([...fr(P[k - 1][0], P[k - 1][1]), ...fr(q[0], q[1])]); } }
  return { linee, a1, a2 };
}

const fine = Date.now() + Number(minuti) * 60000, migliori = rif.map(() => null), belli = [];
let k = 0, provati = 0;
while (Date.now() < fine) {
  const C = cristalloACaso(k++);
  const L = catalogo(C.cr, C.E, [0, 0, 0], { semi: 24, celle: 5, max: 6, tempoMax: 400, radice: `orbite/${k}/semi` });
  if (!L.length) continue;
  const siti = sitiSpeciali(C.cr).sort((a, b) => b.elementi - a.elementi), sito = siti[0];
  for (const o of L.slice(0, 4)) {
    for (const conSorelle of [false, true]) {
      if (conSorelle && !sito) continue;
      const orb = conSorelle ? sorelle(o, sito.gruppo, sito.x) : [o];
      if (orb.length > 12) continue;
      const { linee, a1, a2 } = lineeDi(C.cr, orb);
      const p = { ...structuredClone(PREDEFINITO), reticolo: C.ret, atomi: C.atomi, w: C.w, r0: conSorelle ? sito.x : [...o.x0, 0], v0: [o.v0[0], o.v0[1], 0], sorgente: conSorelle ? 1 : 0, orbite: [scriviOrbita(o)] };
      p.finestra = { ...p.finestra, C: [0, 0, 0], R: Infinity, n: [0, 0, 1] };
      provati++;
      rif.forEach((r, i) => {
        if (Date.now() > fine) return;
        const b = confronta(linee, a1, a2, r);
        if (!migliori[i] || b.D < migliori[i].D) migliori[i] = { ...b, testo: scrivi(p), sorelle: orb.length, stabile: o.stabile };
      });
      if (conSorelle && orb.length >= 4) belli.push({ testo: scrivi(p), linee, a1, a2, n: orb.length, stabile: o.stabile, T: o.T });
    }
  }
}
console.log(`cristalli ${k}, motivi provati ${provati}`);

// ---------- PNG minimo (grigi)
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let q = 0; q < 8; q++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
const pezzo = (t, d) => { const T = Buffer.from(t), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(d.length); c.writeUInt32BE(crc(Buffer.concat([T, d]))); return Buffer.concat([l, T, d, c]); };
function png(grigi, n, nome) {
  const righe = Buffer.alloc(n * (n + 1)); for (let y = 0; y < n; y++) { righe[y * (n + 1)] = 0; for (let x = 0; x < n; x++) righe[y * (n + 1) + 1 + x] = grigi[y * n + x]; }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(n, 0); ih.writeUInt32BE(n, 4); ih[8] = 8; ih[9] = 0;
  writeFileSync(nome, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pezzo('IHDR', ih), pezzo('IDAT', deflateSync(righe)), pezzo('IEND', Buffer.alloc(0))]));
}
// il motivo a 384 punti: linee nere su carta chiara, e il controcampo in due toni
function quadro(lf, p1, p2, c, nome) {
  const n = 384, m = disegna(lf, p1, p2, c, n, 3, 2), cc = controcampo(m, n, n), g = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i++) g[i] = m[i] ? 20 : cc[i] === 2 ? 150 : 238;
  png(g, n, nome);
}
const ris = { cristalli: k, motivi: provati, riferimenti: [], perCaso: [] };
rif.forEach((r, i) => {
  const b = migliori[i]; if (!b) return;
  quadro(b.lf, r.p1, r.p2, b.c, join(dirOut, `linee_${r.nome}.png`));
  ris.riferimenti.push({ nome: r.nome, distanza: +b.D.toFixed(3), chamfer: +b.ch.toFixed(3), forma: +b.forma.toFixed(3), sorelle: b.sorelle, stabile: b.stabile, indirizzo: b.testo });
  console.log(`${r.nome}: D ${b.D.toFixed(3)} (chamfer ${b.ch.toFixed(3)}, forma ${b.forma.toFixed(3)}, ${b.sorelle} orbite)`);
});
// trovati per caso: le stelle di orbite sorelle stabili, dalle più ricche (misura che non guarda i riferimenti)
belli.sort((a, b) => (b.stabile - a.stabile) || (b.n - a.n) || (a.T - b.T));
const usati = new Set();
for (const x of belli) {
  if (ris.perCaso.length >= 3) break; const chiave = x.testo.split(' orbite=')[0]; if (usati.has(chiave)) continue; usati.add(chiave);
  const s = 40, p1 = [x.a1[0] * s, x.a1[1] * s], p2 = [x.a2[0] * s, x.a2[1] * s];
  quadro(x.linee, p1, p2, [64, 64], join(dirOut, `linee_per_caso_${ris.perCaso.length + 1}.png`));
  ris.perCaso.push({ n: ris.perCaso.length + 1, orbite: x.n, stabile: x.stabile, indirizzo: x.testo });
}
writeFileSync(join(dirOut, 'risultati_linee.json'), JSON.stringify(ris, null, 1));
