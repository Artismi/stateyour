// cerca_tessere.mjs — il confronto TESSERA CON TESSERA sul toro.
//
// Uso: node strumenti/cerca_tessere.mjs <cartella dei riferimenti> <uscita> [minuti]
//   (la cartella ha grigi.json: [[nome, W, H], …] e nome.grigio, i grigi grezzi in Float32)
//
// 1. Si decodifica la cella del riferimento (decodifica_cella.js): reticolo (p₁, p₂), tessera ripiegata, scheletro
//    sul toro, classi di giro per componente.
// 2. Il cristallo di Cristallo sta nella STESSA cella, normalizzata per affinità: a = 1, b = |p₂|/|p₁|, γ = l'angolo
//    tra p₁ e p₂ (quadrato, esagonale o rettangolare se ci si è entro 0,05 nel rapporto e 3° nell'angolo, altrimenti
//    obliquo). Così le coordinate di cella del cristallo e quelle del riferimento coincidono.
// 3. LA DISTANZA, sul toro: le linee in coordinate di cella su una griglia G × G che si avvolge; chamfer simmetrico
//    d = ½·(media sulle linee di A della distanza dalle linee di B + il viceversa)/G: una linea in più pesa quanto una
//    linea che manca. Il minimo sulle traslazioni della tessera (16 × 16) e sulla rotazione di mezzo giro.
// 4. LA RICERCA, solo tra le orbite periodiche (orbite.js, senza le librazioni) con la classe di giro (m₁, m₂) nel
//    sottoreticolo delle classi del riferimento (o (0, 0) se il riferimento ha solo tratti chiusi nella cella); ogni
//    orbita da sola e con le sorelle per la simmetria del sito più simmetrico.
//    Prima l'esplorazione: cristalli a caso nella cella data (da 1 a 3 atomi, altezze tra −1,5 e 1,5, w, energia).
//    Poi il passo INVERSO: una strategia (1+1) senza gradiente sulle posizioni e le altezze degli atomi (da 1 a 4),
//    su w e sull'energia, che minimizza la distanza; a parità vince il più semplice (0,003 per atomo).
//    (La larghezza w è una sola per tutti gli atomi: le larghezze diverse per atomo non ci sono ancora.)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodificaCella, ripiega, scheletroToro, classiDiGiro } from '../src/decodifica_cella.js';
import { creaCristallo, vincola } from '../src/reticolo.js';
import { catalogo, punti, sorelle, scriviOrbita } from '../src/orbite.js';
import { sitiSpeciali } from '../src/simmetria.js';
import { controcampo } from '../src/linee.js';
import { PREDEFINITO, scrivi } from '../src/indirizzo.js';
import { sorgente } from '../src/caso.js';
import { scriviPNG } from '../src/png.js';

const [, , dir, out, minuti = '10'] = process.argv;
mkdirSync(out, { recursive: true });
const G = 64;

// ---------- il toro: distanza (chamfer 3-4) con l'avvolgimento, su una griglia 3 × 3 di tessere
function distanzaToro(m) {
  const N = 3 * G, d = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) d[y * N + x] = m[(y % G) * G + (x % G)] ? 0 : 1e9;
  const g = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 1e9 : d[y * N + x]);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; d[i] = Math.min(d[i], g(x - 1, y) + 3, g(x, y - 1) + 3, g(x - 1, y - 1) + 4, g(x + 1, y - 1) + 4); }
  for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; d[i] = Math.min(d[i], g(x + 1, y) + 3, g(x, y + 1) + 3, g(x + 1, y + 1) + 4, g(x - 1, y + 1) + 4); }
  const c = new Float32Array(G * G); for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) c[y * G + x] = d[(y + G) * N + x + G] / 3;
  return c;
}
const pixel = (m) => { const l = []; for (let i = 0; i < G * G; i++) if (m[i]) l.push(i); return l; };
function distanzaTessere(A, B) {
  // A, B: { px: indici dei punti di linea, dt: distanza sul toro }
  let best = Infinity;
  for (const ruota of [false, true]) for (let sy = 0; sy < G; sy += 4) for (let sx = 0; sx < G; sx += 4) {
    const mappa = (i) => { let x = i % G, y = (i - x) / G; if (ruota) { x = G - 1 - x; y = G - 1 - y; } return ((y + sy) % G) * G + ((x + sx) % G); };
    const inversa = (j) => { let x = j % G, y = (j - x) / G; x = (x - sx + G) % G; y = (y - sy + G) % G; if (ruota) { x = G - 1 - x; y = G - 1 - y; } return y * G + x; };
    let a = 0; for (const i of B.px) a += A.dt[mappa(i)]; a /= B.px.length;
    if (a / G > best * 2) continue;
    let b = 0; for (const j of A.px) b += B.dt[inversa(j)]; b /= A.px.length;
    best = Math.min(best, (a + b) / 2 / G);
  }
  return best;
}
// le linee di un insieme di orbite sulla griglia del toro (coordinate di cella del cristallo)
function tesseraDi(cr, orbite) {
  const m = new Uint8Array(G * G), Ar = cr.Ar;
  for (const o of orbite) {
    const { P } = punti(cr, o, [0, 0, 0]);
    for (let k = 1; k < P.length; k++) {
      const a = P[k - 1], b = P[k], q = Math.max(1, Math.ceil(2 * G * Math.hypot(b[0] - a[0], b[1] - a[1])));
      for (let t = 0; t <= q; t++) {
        const x = a[0] + ((b[0] - a[0]) * t) / q, y = a[1] + ((b[1] - a[1]) * t) / q;
        let f = x * Ar[0][0] + y * Ar[0][1], g = x * Ar[1][0] + y * Ar[1][1]; f -= Math.floor(f); g -= Math.floor(g);
        m[Math.min(G - 1, Math.floor(g * G)) * G + Math.min(G - 1, Math.floor(f * G))] = 1;
      }
    }
  }
  return m;
}
// la classe m è nel sottoreticolo generato da gen (o è (0, 0) se gen è vuoto)?
function nelReticolo(m, gens) {
  if (!gens.length) return !m[0] && !m[1];
  if (!m[0] && !m[1]) return false;
  const [g1, g2] = gens;
  if (!g2) { const c = g1[0] ? m[0] / g1[0] : m[1] / g1[1]; return Number.isInteger(c) && m[0] === c * g1[0] && m[1] === c * g1[1]; }
  const det = g1[0] * g2[1] - g1[1] * g2[0], a = (m[0] * g2[1] - m[1] * g2[0]) / det, b = (g1[0] * m[1] - g1[1] * m[0]) / det;
  return Math.abs(a - Math.round(a)) < 1e-9 && Math.abs(b - Math.round(b)) < 1e-9;
}

// ---------- la cella del cristallo dalla cella del riferimento
function cellaDi(p1, p2) {
  const r = Math.hypot(...p2) / Math.hypot(...p1), ang = (Math.acos((p1[0] * p2[0] + p1[1] * p2[1]) / (Math.hypot(...p1) * Math.hypot(...p2))) * 180) / Math.PI;
  const vicino = (a, b, e) => Math.abs(a - b) < e;
  if (vicino(r, 1, 0.05) && vicino(ang, 90, 3)) return { sistema: 'quadrato', b: 1, gamma: 90 };
  if (vicino(r, 1, 0.05) && vicino(ang, 120, 3)) return { sistema: 'esagonale', b: 1, gamma: 120 };
  if (vicino(ang, 90, 3)) return { sistema: 'rettangolare', b: r, gamma: 90 };
  return { sistema: 'obliquo', b: r, gamma: ang };
}

// ---------- un cristallo (atomi con altezza, w, energia) → la migliore orbita (o famiglia di sorelle) e la sua distanza
function valuta(cella, x, rif) {
  const cr = creaCristallo({ ...vincola({ ...cella, centratura: 'P', piano: true, a: 1, c: 10, alfa: 90, beta: 90 }), atomi: x.atomi.map((a) => ({ p: [a.u, a.v, 0], s: Math.sign(a.h) || 1, ampiezza: a.h })), w: x.w });
  const L = catalogo(cr, x.E, [0, 0, 0], { semi: 18, celle: 4, max: 8, tempoMax: 200, radice: `tessere/${x.E}/${x.w}` });
  const sito = sitiSpeciali(cr).sort((a, b) => b.elementi - a.elementi)[0];
  let best = { d: Infinity };
  for (const o of L) {
    if (!rif.gens.some((g) => nelReticolo(o.m, g))) continue;
    for (const insieme of [[o], sito ? sorelle(o, sito.gruppo, sito.x) : null]) {
      if (!insieme || insieme.length > 12) continue;
      const m = tesseraDi(cr, insieme), px = pixel(m); if (px.length < 8) continue;
      const d = distanzaTessere(rif.T, { px, dt: distanzaToro(m) }) + 0.003 * x.atomi.length;
      if (d < best.d) best = { d, orbite: insieme, o, m, cr, sorelle: insieme.length > 1 };
    }
  }
  return best;
}
function aCaso(c) {
  const n = 1 + c.intero('n', 3), atomi = [];
  for (let i = 0; i < n; i++) atomi.push({ u: c(`u${i}`), v: c(`v${i}`), h: c.tra(`h${i}`, -1.5, 1.5) });
  return { atomi, w: c.tra('w', 0.1, 0.3), E: c.tra('E', -0.5, 1.5) };
}
function vicino(x, c) {
  const y = structuredClone(x), N = (k) => c.normale(k);
  for (const [i, a] of y.atomi.entries()) { a.u = (a.u + 0.04 * N(`u${i}`) + 1) % 1; a.v = (a.v + 0.04 * N(`v${i}`) + 1) % 1; a.h += 0.15 * N(`h${i}`); }
  y.w = Math.min(0.35, Math.max(0.07, y.w * Math.exp(0.12 * N('w')))); y.E += 0.08 * N('E');
  const r = c('struttura');
  if (r < 0.08 && y.atomi.length < 4) y.atomi.push({ u: c('nu'), v: c('nv'), h: c.tra('nh', -1.5, 1.5) });
  else if (r < 0.16 && y.atomi.length > 1) y.atomi.splice(c.intero('via', y.atomi.length), 1);
  return y;
}

// ---------- via
const voci = JSON.parse(readFileSync(join(dir, 'grigi.json'), 'utf8')), rif = [];
for (const [nome, W, H] of voci) {
  const g = new Float32Array(readFileSync(join(dir, `${nome}.grigio`)).buffer.slice(0)), d = decodificaCella(g, W, H, { G });
  if (!d) { console.log(`${nome}: nessun reticolo, non si cerca`); continue; }
  let { p1, p2 } = d; const cella = cellaDi(p1, p2);
  // con l'esagonale la base si prende a 120°
  const ang = (Math.acos((p1[0] * p2[0] + p1[1] * p2[1]) / (Math.hypot(...p1) * Math.hypot(...p2))) * 180) / Math.PI;
  let t = d.tessera, sch = d.scheletro, comp = d.componenti;
  if (cella.sistema === 'obliquo' && Math.abs(Math.hypot(...p2) / Math.hypot(...p1) - 1) < 0.05 && Math.abs(ang - 60) < 3) {
    p2 = [p2[0] - p1[0], p2[1] - p1[1]]; Object.assign(cella, { sistema: 'esagonale', b: 1, gamma: 120 });
    const { mask } = await import('../src/decodifica_cella.js').then((M) => M.mascheraLinee(g, W, H));
    t = ripiega(mask, W, H, p1, p2, G); sch = scheletroToro(t.mask, G); comp = classiDiGiro(sch, G, G / 4);
  }
  const gens = comp.length ? comp.map((c) => c.generatori) : [[]];
  rif.push({ nome, p1, p2, cella, T: { px: pixel(sch), dt: distanzaToro(sch) }, sch, media: t.media, gens });
  console.log(`${nome}: cella ${cella.sistema} (b ${cella.b.toFixed(3)}, γ ${cella.gamma.toFixed(1)}°), classi ${JSON.stringify(gens)}`);
}
const budget = (Number(minuti) * 60000) / rif.length, ris = [];
for (const r of rif) {
  const t0 = Date.now(), c = sorgente(`tessere/${r.nome}`);
  let best = { d: Infinity }, x = null, k = 0;
  while (Date.now() - t0 < 0.4 * budget) { const y = aCaso(c.sotto(`caso ${k++}`)), b = valuta(r.cella, y, r); if (b.d < best.d) { best = b; x = y; } }
  let j = 0;
  while (x && Date.now() - t0 < budget) { const y = vicino(x, c.sotto(`vicino ${j++}`)), b = valuta(r.cella, y, r); if (b.d <= best.d) { best = b; x = y; } }
  if (!x || !Number.isFinite(best.d)) { console.log(`${r.nome}: nessuna orbita della classe giusta (${k} cristalli, ${j} vicini)`); ris.push({ nome: r.nome, trovato: false }); continue; }
  // l'indirizzo
  const p = structuredClone(PREDEFINITO);
  p.reticolo = { ...vincola({ ...r.cella, centratura: 'P', piano: true, a: 1, c: 10, alfa: 90, beta: 90 }), piano: true };
  p.atomi = x.atomi.map((a) => ({ p: [a.u, a.v, 0], s: Math.sign(a.h) || 1 })); p.w = x.w;
  p.orbite = [scriviOrbita(best.o)]; p.sorgente = best.sorelle ? 1 : 0; p.finestra = { ...p.finestra, R: Infinity, n: [0, 0, 1] };
  // le immagini: la tessera trovata (3 × 3, in coordinate di cella) e il motivo ripetuto nella geometria del riferimento,
  // col controcampo
  const T3 = new Uint8Array(9 * G * G), R3 = new Uint8Array(9 * G * G);
  for (let y = 0; y < 3 * G; y++) for (let xx = 0; xx < 3 * G; xx++) { const i = (y % G) * G + (xx % G); T3[y * 3 * G + xx] = best.m[i] ? 0 : 255; R3[y * 3 * G + xx] = r.sch[i] ? 0 : Math.round(255 - 160 * r.media[i]); }
  scriviPNG(join(out, `tessera_trovata_${r.nome}.png`), T3, 3 * G, 3 * G);
  scriviPNG(join(out, `tessera_rif_${r.nome}.png`), R3, 3 * G, 3 * G);
  const n = 384, M = new Uint8Array(n * n), s = 160 / Math.hypot(...r.p1) * 1, P1 = r.p1.map((v) => v * s), P2 = r.p2.map((v) => v * s);
  for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
    const X = xx - n / 2, Y = y - n / 2, det = P1[0] * P2[1] - P1[1] * P2[0];
    let f = (X * P2[1] - Y * P2[0]) / det, g = (P1[0] * Y - P1[1] * X) / det; f -= Math.floor(f); g -= Math.floor(g);
    M[y * n + xx] = best.m[Math.min(G - 1, Math.floor(g * G)) * G + Math.min(G - 1, Math.floor(f * G))];
  }
  const cc = controcampo(M, n, n), img = new Uint8Array(n * n); for (let i = 0; i < n * n; i++) img[i] = M[i] ? 15 : cc[i] === 2 ? 150 : 240;
  scriviPNG(join(out, `motivo_${r.nome}.png`), img, n, n);
  const v = { nome: r.nome, distanza: +best.d.toFixed(4), cella: r.cella.sistema, classi: r.gens, m: best.o.m, sorelle: best.orbite.length, atomi: x.atomi.length, cristalli: k, vicini: j, indirizzo: scrivi(p) };
  ris.push(v); console.log(`${r.nome}: d = ${v.distanza} (classe ${best.o.m}, ${v.sorelle} orbite, ${v.atomi} atomi; ${k} cristalli + ${j} vicini)`);
}
writeFileSync(join(out, 'risultati_tessere.json'), JSON.stringify(ris, null, 1));
