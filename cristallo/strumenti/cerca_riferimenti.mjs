// cerca_riferimenti.mjs — cerca nella biblioteca di Cristallo i motivi più simili a delle immagini di riferimento
// (per esempio le tavole di Lewis F. Day, «Pattern Design», 1903: non stanno nel repository).
//
// Uso: node strumenti/cerca_riferimenti.mjs <cartella dei riferimenti> <cartella d'uscita> [minuti]
//   la cartella dei riferimenti ha tavole.json (la lista dei nomi) e, per ogni nome, nome.f32: 128 × 128 numeri a 32
//   bit, le linee del riferimento come intensità (per esempio il modulo del gradiente della tavola, normalizzato).
//
// LA MISURA DI SOMIGLIANZA (dichiarata):
//   · lo spettro di potenza dell'immagine (indipendente dalle traslazioni), con la finestra di Hann, letto in
//     coordinate log-polari: 32 raggi in scala logaritmica tra 2 e 60 cicli per immagine, 32 angoli in [0, π), di
//     log(1 + P), con media nulla e norma 1. Una rotazione è uno spostamento negli angoli, un cambio di scala uno
//     spostamento nei raggi: la correlazione si prende al suo massimo su tutti gli spostamenti angolari e su quelli
//     radiali entro ±8 (un fattore 2,8 di scala). È il metodo di Fourier-Mellin;
//   · l'ordine di simmetria dello spettro: la forza delle armoniche angolari 4 e 6 del profilo angolare (lo spettro di
//     potenza ha sempre il 2, e un 3 vi appare come 6); l'ordine è 4 o 6 se la sua forza supera 0,15, altrimenti 2;
//   · la densità delle linee: la frazione dei punti sopra il 20% del massimo.
//   punteggio = correlazione − 0,25·[ordini diversi] − 0,25·|ln(densità₁/densità₂)|.
// LA RICERCA: un campionamento casuale dalla fonte del caso («cerca/k»: piano o spazio, tutti i reticoli, atomi,
// pallina o sorgente ✴️ sul sito simmetrico più vicino, magnete, finestra parallela o in prospettiva), poi
// l'affinamento sui vicini dei 4 migliori di ogni riferimento, entro il tempo dato.
// Esce, per ogni riferimento, il migliore con il suo indirizzo e il punteggio (risultati.json) e la sua immagine PNG;
// e 3 motivi «trovati per caso», scelti con una misura che non guarda i riferimenti: la forza della simmetria
// (armonica 4 o 6) con la densità vicina a 0,2.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';
import { sorgente } from '../src/caso.js';
import { reticoloACaso, vincola, vettoriCella, combina, creaCristallo, punto, versore } from '../src/reticolo.js';
import { PREDEFINITO, scrivi, leggi, POSTI, direzioneUniforme } from '../src/indirizzo.js';
import { creaSorgente } from '../src/motore.js';
import { creaFinestra, creaProiettore } from '../src/finestra.js';
import { sitoVicino } from '../src/simmetria.js';

const [, , dirRif, dirOut, minuti = '12'] = process.argv;
if (!dirRif || !dirOut) { console.log('uso: node strumenti/cerca_riferimenti.mjs <riferimenti> <uscita> [minuti]'); process.exit(1); }
mkdirSync(dirOut, { recursive: true });
const N = 128;

// ---------- il disegno: i tratti dell'immagine su una griglia, ogni tratto campionato ogni mezzo punto
export function rasterizza(s, L, n = N) {
  const img = new Float32Array(n * n), k = n / L;
  for (let q = 0; q < s.length; q += 6) {
    const x0 = (s[q] + L / 2) * k, y0 = (L / 2 - s[q + 1]) * k, x1 = (s[q + 2] + L / 2) * k, y1 = (L / 2 - s[q + 3]) * k;
    const passi = Math.max(1, Math.ceil(2 * Math.hypot(x1 - x0, y1 - y0))), l = s[q + 4] / passi * Math.hypot(x1 - x0, y1 - y0);
    for (let i = 0; i < passi; i++) {
      const t = (i + 0.5) / passi, x = Math.floor(x0 + t * (x1 - x0)), y = Math.floor(y0 + t * (y1 - y0));
      if (x >= 0 && x < n && y >= 0 && y < n) img[y * n + x] += l;
    }
  }
  return img;
}
// ---------- la FFT 2D (radice 2)
function fft1(re, im, n, passo, o) {
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { const a = o + i * passo, c = o + j * passo; [re[a], re[c]] = [re[c], re[a]]; [im[a], im[c]] = [im[c], im[a]]; } }
  for (let l = 2; l <= n; l <<= 1) {
    const th = (-2 * Math.PI) / l;
    for (let i = 0; i < n; i += l) for (let j = 0; j < l / 2; j++) {
      const wr = Math.cos(th * j), wi = Math.sin(th * j), a = o + (i + j) * passo, b = o + (i + j + l / 2) * passo;
      const xr = re[b] * wr - im[b] * wi, xi = re[b] * wi + im[b] * wr;
      re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
    }
  }
}
export function caratteristiche(img) {
  let m = 0, mx = 0; for (const v of img) { m += v; mx = Math.max(mx, v); } m /= img.length;
  const re = new Float64Array(N * N), im = new Float64Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const w = (0.5 - 0.5 * Math.cos((2 * Math.PI * (x + 0.5)) / N)) * (0.5 - 0.5 * Math.cos((2 * Math.PI * (y + 0.5)) / N));
    re[y * N + x] = (img[y * N + x] - m) * w;
  }
  for (let y = 0; y < N; y++) fft1(re, im, N, 1, y * N);
  for (let x = 0; x < N; x++) fft1(re, im, N, N, x);
  const P = (u, v) => { const i = ((v + N) % N) * N + ((u + N) % N); return re[i] * re[i] + im[i] * im[i]; };
  const R = 32, A = 32, lp = new Float64Array(R * A), ang = new Float64Array(64);
  for (let r = 0; r < R; r++) for (let a = 0; a < A; a++) {
    const rho = 2 * Math.pow(30, r / (R - 1)), th = (Math.PI * a) / A, u = rho * Math.cos(th), v = rho * Math.sin(th);
    const u0 = Math.floor(u), v0 = Math.floor(v), fu = u - u0, fv = v - v0;
    const p = (1 - fu) * (1 - fv) * P(u0, v0) + fu * (1 - fv) * P(u0 + 1, v0) + (1 - fu) * fv * P(u0, v0 + 1) + fu * fv * P(u0 + 1, v0 + 1);
    lp[r * A + a] = Math.log1p(p);
  }
  for (let v = -N / 2 + 1; v < N / 2; v++) for (let u = -N / 2 + 1; u < N / 2; u++) {
    const rho = Math.hypot(u, v); if (rho < 3 || rho > 50) continue;
    let th = Math.atan2(v, u); if (th < 0) th += Math.PI; ang[Math.min(63, Math.floor((th / Math.PI) * 64))] += P(u, v);
  }
  let s = 0; for (const x of lp) s += x; s /= lp.length; let q = 0; for (let i = 0; i < lp.length; i++) { lp[i] -= s; q += lp[i] * lp[i]; } q = Math.sqrt(q) || 1; for (let i = 0; i < lp.length; i++) lp[i] /= q;
  // le armoniche angolari (sul giro intero l'angolo θ di [0, π) conta due volte: l'armonica m del giro è la m/2 qui)
  const forza = (mm) => { let c = 0, d = 0, t = 0; ang.forEach((x, i) => { const th = ((i + 0.5) / 64) * Math.PI; c += x * Math.cos(mm * th); d += x * Math.sin(mm * th); t += x; }); return Math.hypot(c, d) / (t || 1); };
  const f4 = forza(4), f6 = forza(6), ordine = Math.max(f4, f6) > 0.15 ? (f4 > f6 ? 4 : 6) : 2;
  let pieni = 0; for (const v of img) if (v > 0.2 * mx) pieni++;
  return { lp, ordine, f4, f6, densita: Math.max(1e-3, pieni / img.length) };
}
export function somiglianza(a, b) {
  const R = 32, A = 32; let best = -1;
  for (let dr = -8; dr <= 8; dr++) for (let da = 0; da < A; da++) {
    let c = 0;
    for (let r = Math.max(0, -dr); r < Math.min(R, R - dr); r++) for (let t = 0; t < A; t++) c += a.lp[r * A + t] * b.lp[(r + dr) * A + ((t + da) % A)];
    if (c > best) best = c;
  }
  return best - 0.25 * (a.ordine !== b.ordine ? 1 : 0) - 0.25 * Math.abs(Math.log(a.densita / b.densita));
}

// ---------- i candidati
function base() { return structuredClone(PREDEFINITO); }
export function candidato(k) {
  const c = sorgente(`cerca/${k}`), p = base(), piano = c('piano') < 0.6;
  p.reticolo = { ...vincola({ ...reticoloACaso(c.sotto('reticolo'), piano), piano }), piano };
  const A = vettoriCella(vincola(p.reticolo)), posti = POSTI.filter((x) => !piano || x[2] === 0).map((x) => [...x]);
  p.atomi = [];
  for (let i = 0, n = 1 + c.intero('atomi', 3); i < n && posti.length; i++) { const [q] = posti.splice(c.intero(`posto ${i}`, posti.length), 1); p.atomi.push({ p: q, s: c(`segno ${i}`) < 0.65 ? 1 : -1 }); }
  p.w = c.tra('w', 0.08, 0.25);
  const E = 0.2 * Math.pow(30, c('energia')), v = Math.sqrt(2 * E);
  let d = direzioneUniforme(c('cos'), c('fi')); if (piano) { const l = Math.hypot(d[0], d[1]) || 1; d = [d[0] / l, d[1] / l, 0]; }
  p.v0 = d.map((x) => x * v);
  p.r0 = combina([c('x'), c('y'), piano ? 0 : c('z')], A);
  p.sorgente = c('sorgente') < 0.6 ? 1 : 0;
  if (c('magnete') < 0.4) { const raggio = 0.15 * Math.pow(15, c('raggio')), b = piano ? [0, 0, 1] : direzioneUniforme(c('Bc'), c('Bf')); p.B = b.map((x) => (x * v) / raggio); }
  p.tempo = 3 + 30 * c('tempo');
  const n = piano ? [0, 0, 1] : direzioneUniforme(c('nc'), c('nf'));
  p.finestra = { C: [0, 0, 0], R: piano || c('lontano') < 0.7 ? Infinity : 2 + 6 * c('R'), n, psi: 2 * Math.PI * c('psi'), L: 2.5 + 4 * c('L'), D: piano ? 1 : 0.3 + 1.2 * c('D'), h: 0.3, modo: 'prospettiva' };
  return sistema(p);
}
// la sorgente sul sito simmetrico più vicino, la finestra centrata lì
function sistema(p) {
  if (p.sorgente) {
    const cr = creaCristallo({ ...vincola(p.reticolo), atomi: p.atomi, w: p.w });
    p.r0 = sitoVicino(cr, p.r0).x; p.finestra.C = [...p.r0];
  }
  return p;
}
// un vicino: piccole spinte alle manopole, dalla fonte del caso («vicino/k/j»)
function vicino(p0, k, j) {
  const c = sorgente(`vicino/${k}/${j}`), p = structuredClone(p0), g = (n) => 1 + 0.25 * (2 * c(n) - 1);
  const th = 0.25 * (2 * c('giro') - 1), cs = Math.cos(th), sn = Math.sin(th), v = p.v0;
  p.v0 = [cs * v[0] - sn * v[1], sn * v[0] + cs * v[1], p.reticolo.piano ? 0 : v[2]].map((x) => x * g('energia'));
  p.w = Math.min(0.3, Math.max(0.06, p.w * g('w')));
  p.B = p.B.map((x) => x * g('B'));
  p.tempo = Math.max(2, p.tempo * g('tempo'));
  p.finestra = { ...p.finestra, L: p.finestra.L * g('L'), psi: p.finestra.psi + 0.3 * (2 * c('psi') - 1) };
  if (!p.reticolo.piano && c('n') < 0.5) p.finestra.n = versore(p.finestra.n.map((x, i) => x + 0.15 * (2 * c(`n${i}`) - 1)));
  return p;
}

// ---------- un candidato: corsa, proiezione, immagine, caratteristiche (al più ~200 palline·tempo)
function valuta(p, n = N) {
  const q = structuredClone(p);
  const S = creaSorgente({ ...q, tempo: q.tempo });
  const balls = S.sessioni.length; if (balls * q.tempo > 200) { q.tempo = 200 / balls; return valuta({ ...p, tempo: q.tempo }, n); }
  const f = creaFinestra(q.finestra), P = creaProiettore(f, S.sessioni[0].cristallo, true, 400000);
  let img = new Float32Array(n * n);
  for (const s of S.sessioni) {
    while (!s.finito) s.avanza(2e4);
    const t = P.proietta(s.tessera.s, s.tessera.vel, 0, s.tessera.n), r = rasterizza(t, f.L, n);
    for (let i = 0; i < img.length; i++) img[i] += r[i];
  }
  return { img, palline: balls, p: q };
}

// ---------- PNG minimo (grigi, 8 bit)
const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
const crc = (b) => { let c = -1; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function pezzo(tipo, dati) { const t = Buffer.from(tipo), l = Buffer.alloc(4), c = Buffer.alloc(4); l.writeUInt32BE(dati.length); c.writeUInt32BE(crc(Buffer.concat([t, dati]))); return Buffer.concat([l, t, dati, c]); }
export function png(img, n, nome) {
  let mx = 0; const ord = Array.from(img).filter((x) => x > 0).sort((a, b) => a - b); mx = ord[Math.floor(ord.length * 0.98)] || 1;
  const righe = Buffer.alloc(n * (n + 1));
  for (let y = 0; y < n; y++) { righe[y * (n + 1)] = 0; for (let x = 0; x < n; x++) righe[y * (n + 1) + 1 + x] = Math.round(255 * (1 - Math.exp(-2.2 * img[y * n + x] / mx))); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(n, 0); ih.writeUInt32BE(n, 4); ih[8] = 8; ih[9] = 0;
  writeFileSync(nome, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), pezzo('IHDR', ih), pezzo('IDAT', deflateSync(righe)), pezzo('IEND', Buffer.alloc(0))]));
}

// ---------- la ricerca
const nomi = JSON.parse(readFileSync(join(dirRif, 'tavole.json'), 'utf8'));
const rif = nomi.map((nome) => ({ nome, c: caratteristiche(new Float32Array(readFileSync(join(dirRif, `${nome}.f32`)).buffer.slice(0))) }));
for (const r of rif) console.log(`riferimento ${r.nome}: ordine ${r.c.ordine} (f4 ${r.c.f4.toFixed(2)}, f6 ${r.c.f6.toFixed(2)}), densità ${r.c.densita.toFixed(3)}`);
const fine = Date.now() + Number(minuti) * 60000, metaTempo = Date.now() + Number(minuti) * 36000;
const migliori = rif.map(() => []), bellezza = [];
function considera(p, chiave) {
  let v; try { v = valuta(p); } catch (e) { return; }
  const c = caratteristiche(v.img);
  if (!(c.densita > 0.01)) return;
  const testo = scrivi(v.p);
  rif.forEach((r, i) => {
    const s = somiglianza(r.c, c), l = migliori[i];
    if (l.some((x) => x.testo === testo)) return;
    l.push({ s, testo, chiave }); l.sort((a, b) => b.s - a.s); if (l.length > 4) l.pop();
  });
  bellezza.push({ b: Math.max(c.f4, c.f6) - 0.3 * Math.abs(Math.log(c.densita / 0.2)), testo, ordine: c.ordine });
}
let k = 0;
while (Date.now() < metaTempo) considera(candidato(k), k++);
console.log(`campionati ${k} candidati`);
let j = 0;
while (Date.now() < fine) {
  for (let i = 0; i < rif.length && Date.now() < fine; i++) for (const m of [...migliori[i]]) { considera(vicino(leggi(m.testo), m.chiave, j), m.chiave); }
  j++;
}
console.log(`affinati ${j} giri`);
// i risultati e le immagini (a 384 punti)
const ris = { riferimenti: [], perCaso: [] };
rif.forEach((r, i) => {
  const m = migliori[i][0], v = valuta(leggi(m.testo), 384);
  png(v.img, 384, join(dirOut, `trovato_${r.nome}.png`));
  ris.riferimenti.push({ nome: r.nome, punteggio: +m.s.toFixed(3), indirizzo: m.testo, palline: v.palline });
  console.log(`${r.nome}: ${m.s.toFixed(3)}  ${m.testo}`);
});
const usati = new Set(ris.riferimenti.map((x) => x.indirizzo));
bellezza.sort((a, b) => b.b - a.b);
for (const x of bellezza) {
  if (ris.perCaso.length >= 3) break;
  if (usati.has(x.testo) || ris.perCaso.some((y) => y.ordine === x.ordine && Math.abs(y.b - x.b) < 1e-3)) continue;
  const n = ris.perCaso.length + 1, v = valuta(leggi(x.testo), 384);
  png(v.img, 384, join(dirOut, `per_caso_${n}.png`));
  ris.perCaso.push({ n, misura: +x.b.toFixed(3), ordine: x.ordine, indirizzo: x.testo });
}
writeFileSync(join(dirOut, 'risultati.json'), JSON.stringify({ candidati: k, giriVicini: j, ...ris }, null, 1));
void punto;
