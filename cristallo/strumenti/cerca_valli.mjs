// cerca_valli.mjs — LE LINEE DI DAY SONO LE VALLI DEL CRISTALLO.
//
// Uso: node strumenti/cerca_valli.mjs <cartella dei riferimenti> <uscita> [minuti]
//
// 1. DALLA TESSERA AGLI ATOMI. Si decodifica la cella del riferimento (decodifica_cella.js). Lo scheletro divide la
//    tessera in regioni (le facce del grafo sul toro). Al centro di ognuna, nel punto più lontano dalle linee (il
//    massimo della trasformata di distanza), va una collina: altezza 1, larghezza w = 0,55·r, con r il raggio
//    inscritto (la distanza massima, in lati di cella: punti/G × √(area della cella)). Al più 12 colline (le più grandi).
//    LE VALLI: i punti dove V è un minimo lungo almeno una delle quattro direzioni (orizzontale, verticale, diagonali),
//    assottigliati con Zhang e Suen; la loro distanza dalla tessera (chamfer sul toro, come in cerca_tessere.mjs) dice
//    quanto il fondo delle valli è vicino al disegno.
// 2. LE ORBITE NELLE VALLI. L'energia è poco sopra le selle: E = V_sella + 0,1·(V_max − V_sella), con V_sella il
//    massimo di V lungo le valli. Il catalogo delle orbite periodiche (senza librazioni), con le classi di giro del
//    riferimento (se nessuna ha quella classe, il vincolo si rilassa a tutte, e il risultato lo dice); ogni orbita da sola e con le sorelle per la simmetria del sito più simmetrico.
//    LA COPERTURA GREEDY (matching pursuit): a ogni passo si aggiunge l'orbita (o la famiglia di sorelle) che fa scendere
//    di più la distanza dalla tessera; ci si ferma quando scende meno di 0,002 (soglia dichiarata) o dopo 6 passi.
// 3. IL PASSO INVERSO: una strategia (1+1) senza gradiente su posizioni, altezze e larghezze (una per atomo) delle
//    colline e sull'energia, partendo dagli atomi del punto 1, minimizzando la distanza della copertura.
// LE CAMPITURE PIENE (superfici nere) non si fanno: qui una tavola a campiture si legge dal bordo dell'inchiostro.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { decodificaCella, ripiega, scheletroToro, classiDiGiro, mascheraLinee } from '../src/decodifica_cella.js';
import { creaCristallo, vincola } from '../src/reticolo.js';
import { catalogo, sorelle, scriviOrbita } from '../src/orbite.js';
import { sitiSpeciali } from '../src/simmetria.js';
import { controcampo } from '../src/linee.js';
import { PREDEFINITO, scrivi } from '../src/indirizzo.js';
import { sorgente } from '../src/caso.js';
import { scriviPNG } from '../src/png.js';
import { G, distanzaToro, pixel, distanzaTessere, tesseraDi, nelReticolo, cellaDi } from '../src/toro.js';

const [, , dir, out, minuti = '10'] = process.argv;
mkdirSync(out, { recursive: true });
const SOGLIA = 0.002;

// le regioni dello sfondo sul toro (lo scheletro ingrossato di un punto le separa) e il loro punto più interno
function colline(sch, area) {
  const ing = new Uint8Array(G * G), at = (x, y) => ((y + G) % G) * G + ((x + G) % G);
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (sch[y * G + x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) ing[at(x + dx, y + dy)] = 1;
  const dt = distanzaToro(sch), lab = new Int32Array(G * G).fill(-1), ris = [];
  for (let p = 0; p < G * G; p++) {
    if (ing[p] || lab[p] >= 0) continue;
    const coda = [p]; lab[p] = ris.length; let best = p;
    for (let a = 0; a < coda.length; a++) {
      const q = coda[a], x = q % G, y = (q - x) / G; if (dt[q] > dt[best]) best = q;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r = at(x + dx, y + dy); if (!ing[r] && lab[r] < 0) { lab[r] = ris.length; coda.push(r); } }
    }
    const rc = (dt[best] / G) * Math.sqrt(area);
    ris.push({ u: ((best % G) + 0.5) / G, v: (Math.floor(best / G) + 0.5) / G, h: 1, w: Math.max(0.04, 0.55 * rc), punti: coda.length });
  }
  return ris.filter((c) => c.punti >= 6).sort((a, b) => b.punti - a.punti).slice(0, 12);
}
const cristallo = (cella, x) => creaCristallo({ ...vincola({ ...cella, centratura: 'P', piano: true, a: 1, c: 10, alfa: 90, beta: 90 }), atomi: x.atomi.map((a) => ({ p: [a.u, a.v, 0], s: 1, ampiezza: a.h, w: a.w })), w: 0.1 });
// le valli e la sella
function valli(cr) {
  const V = new Float64Array(G * G);
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const f = [(i + 0.5) / G, (j + 0.5) / G]; V[j * G + i] = cr.campo(f[0] * cr.A[0][0] + f[1] * cr.A[1][0], f[0] * cr.A[0][1] + f[1] * cr.A[1][1], 0, null); }
  const at = (x, y) => V[((y + G) % G) * G + ((x + G) % G)], m = new Uint8Array(G * G);
  let sella = -Infinity, vmax = -Infinity;
  for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
    const v = at(x, y); vmax = Math.max(vmax, v);
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) if (v < at(x + dx, y + dy) && v < at(x - dx, y - dy)) { m[y * G + x] = 1; break; }
  }
  const s = scheletroToro(m, G); for (let i = 0; i < G * G; i++) if (s[i]) sella = Math.max(sella, V[i]);
  return { mask: s, sella, vmax };
}
// il catalogo e la copertura greedy
function copertura(cr, E, rif) {
  const L = catalogo(cr, E, [0, 0, 0], { semi: 50, celle: 6, max: 16, tempoMax: 1500, radice: `valli/${E}` });
  const sito = sitiSpeciali(cr).sort((a, b) => b.elementi - a.elementi)[0], cand = [];
  // prima le sole orbite con la classe del riferimento; se non ce n'è nessuna, il vincolo si rilassa (e si dice)
  let rilassato = false;
  for (const giro of [0, 1]) {
    for (const o of L) {
      if (!giro && !rif.gens.some((g) => nelReticolo(o.m, g))) continue;
      for (const ins of [[o], sito ? sorelle(o, sito.gruppo, sito.x) : null]) if (ins && ins.length <= 12) cand.push({ ins, m: tesseraDi(cr, ins), o });
    }
    if (cand.length) break; rilassato = true;
  }
  let scelte = [], unione = new Uint8Array(G * G), d = Infinity;
  for (let passo = 0; passo < 6 && cand.length; passo++) {
    let best = null;
    for (const c of cand) {
      const u = Uint8Array.from(unione, (x, i) => x | c.m[i]), px = pixel(u); if (px.length < 8) continue;
      const dd = distanzaTessere(rif.T, { px, dt: distanzaToro(u) }); if (!best || dd < best.d) best = { d: dd, c, u };
    }
    if (!best || d - best.d < SOGLIA) break;
    d = best.d; unione = best.u; scelte.push(best.c);
  }
  return { d, unione, scelte, orbite: L.length, candidati: cand.length, rilassato };
}
function vicino(x, c) {
  const y = structuredClone(x), N = (k) => c.normale(k);
  for (const [i, a] of y.atomi.entries()) { a.u = (a.u + 0.02 * N(`u${i}`) + 1) % 1; a.v = (a.v + 0.02 * N(`v${i}`) + 1) % 1; a.h = Math.max(0.2, a.h + 0.1 * N(`h${i}`)); a.w = Math.min(0.4, Math.max(0.03, a.w * Math.exp(0.1 * N(`w${i}`)))); }
  y.dE += 0.03 * N('E');
  return y;
}

// ---------- via
const voci = JSON.parse(readFileSync(join(dir, 'grigi.json'), 'utf8')), rif = [];
for (const [nome, W, H] of voci) {
  const g = new Float32Array(readFileSync(join(dir, `${nome}.grigio`)).buffer.slice(0)), d = decodificaCella(g, W, H, { G });
  if (!d) { console.log(`${nome}: nessun reticolo, non si cerca`); continue; }
  let { p1, p2 } = d; const cella = cellaDi(p1, p2), ang = (Math.acos((p1[0] * p2[0] + p1[1] * p2[1]) / (Math.hypot(...p1) * Math.hypot(...p2))) * 180) / Math.PI;
  let t = d.tessera, sch = d.scheletro, comp = d.componenti;
  if (cella.sistema === 'obliquo' && Math.abs(Math.hypot(...p2) / Math.hypot(...p1) - 1) < 0.05 && Math.abs(ang - 60) < 3) {
    p2 = [p2[0] - p1[0], p2[1] - p1[1]]; Object.assign(cella, { sistema: 'esagonale', b: 1, gamma: 120 });
    const { mask } = mascheraLinee(g, W, H); t = ripiega(mask, W, H, p1, p2, G); sch = scheletroToro(t.mask, G); comp = classiDiGiro(sch, G, G / 4);
  }
  rif.push({ nome, p1, p2, cella, sch, media: t.media, T: { px: pixel(sch), dt: distanzaToro(sch) }, gens: comp.length ? comp.map((c) => c.generatori) : [[]] });
}
const budget = (Number(minuti) * 60000) / rif.length, ris = [];
for (const r of rif) {
  const t0 = Date.now(), c = sorgente(`valli/${r.nome}`), area = r.cella.b * Math.sin((r.cella.gamma * Math.PI) / 180);
  let x = { atomi: colline(r.sch, area), dE: 0.1 };
  const prova = (x) => { const cr = cristallo(r.cella, x), vv = valli(cr), E = vv.sella + x.dE * (vv.vmax - vv.sella), cop = copertura(cr, E, r); return { ...cop, cr, vv, E, dValli: distanzaTessere(r.T, { px: pixel(vv.mask), dt: distanzaToro(vv.mask) }) }; };
  let best = prova(x); const iniziale = { d: best.d, dValli: best.dValli, atomi: x.atomi.length };
  let j = 0;
  while (Date.now() - t0 < budget) { const y = vicino(x, c.sotto(`vicino ${j++}`)), b = prova(y); if (b.d <= best.d) { best = b; x = y; } }
  // le immagini
  const tile = (m, sfondo = null) => { const o = new Uint8Array(9 * G * G); for (let y = 0; y < 3 * G; y++) for (let xx = 0; xx < 3 * G; xx++) { const i = (y % G) * G + (xx % G); o[y * 3 * G + xx] = m[i] ? 0 : sfondo ? Math.round(255 - 160 * sfondo[i]) : 255; } return o; };
  scriviPNG(join(out, `valli_${r.nome}.png`), tile(best.vv.mask), 3 * G, 3 * G);
  scriviPNG(join(out, `tessera_trovata_${r.nome}.png`), tile(best.unione), 3 * G, 3 * G);
  scriviPNG(join(out, `tessera_rif_${r.nome}.png`), tile(r.sch, r.media), 3 * G, 3 * G);
  const n = 384, M = new Uint8Array(n * n), s = 160 / Math.hypot(...r.p1), P1 = r.p1.map((v) => v * s), P2 = r.p2.map((v) => v * s), det = P1[0] * P2[1] - P1[1] * P2[0];
  for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) { const X = xx - n / 2, Y = y - n / 2; let f = (X * P2[1] - Y * P2[0]) / det, g = (P1[0] * Y - P1[1] * X) / det; f -= Math.floor(f); g -= Math.floor(g); M[y * n + xx] = best.unione[Math.min(G - 1, Math.floor(g * G)) * G + Math.min(G - 1, Math.floor(f * G))]; }
  const cc = controcampo(M, n, n), img = new Uint8Array(n * n); for (let i = 0; i < n * n; i++) img[i] = M[i] ? 15 : cc[i] === 2 ? 150 : 240;
  scriviPNG(join(out, `motivo_${r.nome}.png`), img, n, n);
  const p = structuredClone(PREDEFINITO);
  p.reticolo = { ...vincola({ ...r.cella, centratura: 'P', piano: true, a: 1, c: 10, alfa: 90, beta: 90 }), piano: true };
  p.atomi = x.atomi.map((a) => ({ p: [a.u, a.v, 0], s: 1, ampiezza: a.h, w: a.w })); p.orbite = best.scelte.map((s2) => scriviOrbita(s2.o)); p.finestra = { ...p.finestra, R: Infinity, n: [0, 0, 1] };
  const v = { nome: r.nome, cella: r.cella.sistema, classi: r.gens, colline: x.atomi.length, distanzaValli: +best.dValli.toFixed(4), distanza: +best.d.toFixed(4), iniziale, orbiteScelte: best.scelte.map((s2) => ({ m: s2.o.m, sorelle: s2.ins.length })), classeRilassata: best.rilassato, catalogo: best.orbite, candidati: best.candidati, vicini: j,
    atomi: x.atomi.map((a) => ({ u: +a.u.toFixed(4), v: +a.v.toFixed(4), h: +a.h.toFixed(3), w: +a.w.toFixed(4) })), indirizzo: scrivi(p) };
  ris.push(v);
  console.log(`${r.nome}: ${v.colline} colline; valli d = ${v.distanzaValli}; copertura d = ${v.distanza} (all'inizio ${iniziale.d.toFixed(4)}), orbite ${JSON.stringify(v.orbiteScelte)}${v.classeRilassata ? ' (classe rilassata)' : ''}, ${j} vicini`);
}
writeFileSync(join(out, 'risultati_valli.json'), JSON.stringify(ris, null, 1));
