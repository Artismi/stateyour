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

import { G, distanzaToro, pixel, distanzaTessere, tesseraDi, nelReticolo, cellaDi } from '../src/toro.js';

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
