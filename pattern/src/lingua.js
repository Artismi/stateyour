// lingua.js — dalla forma decodificata alla sua lingua.
//
// La decodifica riscrive ogni tratto dell'immagine. La lingua capisce la
// struttura: che cosa si ripete, con quale simmetria, dove e come.
//
//   ATOMI        le figure connesse dell'inchiostro
//   SIMMETRIA    per ogni atomo: specchi (D_n) e rotazioni (C_n) attorno al
//                baricentro, misurati sovrapponendo la figura trasformata a
//                sé stessa (quanta parte cade a meno di una tolleranza)
//   PAROLE       atomi uguali a meno di una similitudine (spostamento,
//                rotazione, scala, specchio) sono la stessa parola
//   DOMINIO      di ogni parola si tiene solo la parte fondamentale: metà per
//                uno specchio, uno spicchio per una rotazione; il resto lo
//                genera la simmetria
//   FIGURE       gli atomi vicini formano figure composte, con la loro simmetria
//
// Il seme della lingua è VOCABOLARIO (le parole, ognuna col suo dominio e la
// sua simmetria) + FRASE (dove compare ogni parola e con quale trasformazione).
// Si compila in uno stato fisico come ogni altro seme.

import { componenti, distanza } from './decodifica.js';
import { catena } from './catena.js';
import { MOTIVI } from './motivi.js';
import { trasformaPartitura } from './seme.js';
import { simula } from './motore.js';
import { lineeDaTracce } from './grammatica.js';

// ---------- similitudini: [a, b, c, d, e, f] come in grammatica.js
const comp = (A, B) => [
  A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1],
  A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3],
  A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5],
];
const app = (M, p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
const trasla = (x, y) => [1, 0, 0, 1, x, y];
const ruota = (a) => [Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0];
const specchio = (phi) => [Math.cos(2 * phi), Math.sin(2 * phi), Math.sin(2 * phi), -Math.cos(2 * phi), 0, 0];
const scala = (k) => [k, 0, 0, k, 0, 0];
const attorno = (c, L) => comp(trasla(c[0], c[1]), comp(L, trasla(-c[0], -c[1])));
const ID = [1, 0, 0, 1, 0, 0];
// come leggere una trasformazione: angolo, specchio, scala
function descrivi(M) {
  const det = M[0] * M[3] - M[1] * M[2], k = Math.sqrt(Math.abs(det));
  const ang = Math.atan2(M[1], M[0]) * 180 / Math.PI;
  return { specchio: det < 0, angolo: ((ang % 360) + 360) % 360, scala: k };
}

// ---------- la lingua
export function lingua(ris, opzioni = {}) {
  const { maschera: m, W, H, rit, scala: sc } = ris.interni;
  const H0 = ris.misure.altezza;
  const toll = opzioni.tolleranza ?? 2.5;         // in pixel della maschera
  const soglia = opzioni.soglia ?? 0.8;           // quanto deve combaciare una simmetria
  const sogliaParola = opzioni.sogliaParola ?? 0.78;
  const aMondo = (x, y) => [(x + 0.5) / sc + rit[0], H0 - ((y + 0.5) / sc + rit[1])];
  const aMaschera = (p) => [(p[0] - rit[0]) * sc - 0.5, (H0 - p[1] - rit[1]) * sc - 0.5];

  // 1. atomi
  const { comp: grezzi, etich } = componenti(m, W, H, 1);
  const atomi = [];
  const creaAtomo = (pixel, id) => {
    let x0 = W, y0 = H, x1 = 0, y1 = 0, sx = 0, sy = 0;
    for (const p of pixel) { const x = p % W, y = (p - x) / W; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; sx += x; sy += y; }
    const pad = Math.ceil(toll) + 4;
    const bx = Math.max(0, x0 - pad), by = Math.max(0, y0 - pad), bw = Math.min(W - 1, x1 + pad) - bx + 1, bh = Math.min(H - 1, y1 + pad) - by + 1;
    // distanza dall'inchiostro di QUESTO atomo, nel suo riquadro
    const inv = new Uint8Array(bw * bh).fill(1);
    for (const p of pixel) { const x = p % W, y = (p - x) / W; inv[(y - by) * bw + (x - bx)] = 0; }
    const dt = distanza(inv, bw, bh);
    const passo = Math.max(1, Math.floor(pixel.length / 350));
    const campioni = [];
    for (let i = 0; i < pixel.length; i += passo) { const p = pixel[i], x = p % W, y = (p - x) / W; campioni.push(aMondo(x, y)); }
    return { id: atomi.length, etichetta: id, pixel, n: pixel.length, centro: aMondo(sx / pixel.length, sy / pixel.length), riquadro: [bx, by, bw, bh], dt, campioni, elementi: [] };
  };
  grezzi.forEach((pixel, id) => { if (pixel.length >= 8 * sc * sc) atomi.push(creaAtomo(pixel, id)); });
  const atomoDiEtichetta = new Map(atomi.map((a) => [a.etichetta, a]));

  // quanta parte dei campioni di A, trasformati da M, cade sull'inchiostro di B
  const combacia = (A, M, B) => {
    const [bx, by, bw, bh] = B.riquadro;
    let ok = 0;
    for (const p of A.campioni) {
      const [x, y] = aMaschera(app(M, p));
      const xi = Math.round(x) - bx, yi = Math.round(y) - by;
      if (xi >= 0 && yi >= 0 && xi < bw && yi < bh && B.dt[yi * bw + xi] <= toll) ok++;
    }
    return ok / A.campioni.length;
  };

  // 1b. RETICOLO: una figura grande che si sovrappone a sé stessa spostata è una
  // ripetizione per traslazione. I due spostamenti più corti e non allineati
  // sono i vettori del reticolo; la figura si taglia in celle (con i bordi dove
  // passa meno inchiostro) e ogni cella diventa una figura, decodificata da sola.
  const reticoli = [];
  if (opzioni.reticolo !== false && ris.decodificaMaschera) {
    const minimo = (opzioni.minReticolo ?? 1500) * sc * sc / 4;
    for (const A of atomi.slice()) {
      if (A.n < minimo) continue;
      const [bx, by, bw, bh] = A.riquadro;
      // quanta parte dei campioni, spostati di t, cade sull'inchiostro (solo quelli che restano nel riquadro)
      const sovrappone = (tx, ty) => {
        let dentro = 0, ok = 0;
        for (const p of A.campioni) {
          const [x, y] = aMaschera([p[0] + tx, p[1] + ty]);
          const xi = Math.round(x) - bx, yi = Math.round(y) - by;
          if (xi < 0 || yi < 0 || xi >= bw || yi >= bh) continue;
          dentro++; if (A.dt[yi * bw + xi] <= toll) ok++;
        }
        return dentro >= A.campioni.length * 0.3 ? ok / dentro : 0;
      };
      const larg = bw / sc, alt = bh / sc, minimoT = opzioni.minCella ?? 12;
      const picchi = [];
      for (let ty = 0; ty <= alt * 0.75; ty += 1.5) for (let tx = -larg * 0.75; tx <= larg * 0.75; tx += 1.5) {
        if (Math.hypot(tx, ty) < minimoT || (ty === 0 && tx < 0)) continue;
        const v = sovrappone(tx, ty);
        if (v >= 0.86) picchi.push([tx, ty, v]);
      }
      if (!picchi.length) continue;
      // raffina e tiene i massimi locali
      const affina = ([tx, ty]) => { let best = [tx, ty, sovrappone(tx, ty)]; for (let dy = -1.5; dy <= 1.5; dy += 0.5) for (let dx = -1.5; dx <= 1.5; dx += 0.5) { const v = sovrappone(tx + dx, ty + dy); if (v > best[2]) best = [tx + dx, ty + dy, v]; } return best; };
      picchi.sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
      const v1 = affina(picchi[0]);
      const altro = picchi.find((q) => Math.abs(v1[0] * q[1] - v1[1] * q[0]) > 0.35 * Math.hypot(v1[0], v1[1]) * Math.hypot(q[0], q[1]));
      const v2 = altro ? affina(altro) : null;
      // quante celle ci stanno: almeno due
      const estensione = (v) => { const l = Math.hypot(v[0], v[1]), u = [v[0] / l, v[1] / l]; let mn = Infinity, mx = -Infinity; for (const p of A.campioni) { const d = p[0] * u[0] + p[1] * u[1]; mn = Math.min(mn, d); mx = Math.max(mx, d); } return (mx - mn) / l; };
      if (estensione(v1) < 1.6 && (!v2 || estensione(v2) < 1.6)) continue;
      // coordinate di reticolo di un punto
      const base = v2 ? [v1, v2] : [v1, [-v1[1], v1[0]]];
      const det = base[0][0] * base[1][1] - base[0][1] * base[1][0];
      const coord = (q, o) => { const dx = q[0] - o[0], dy = q[1] - o[1]; return [(dx * base[1][1] - dy * base[1][0]) / det, (base[0][0] * dy - base[0][1] * dx) / det]; };
      // l'origine: i bordi delle celle dove passa meno inchiostro
      const pts = A.pixel.map((p) => { const x = p % W, y = (p - x) / W; return aMondo(x, y); });
      let migliore = null;
      for (let a = 0; a < 1; a += 0.1) for (let b = 0; b < (v2 ? 1 : 0.01); b += 0.1) {
        const o = [A.centro[0] + a * v1[0] + (v2 ? b * v2[0] : 0), A.centro[1] + a * v1[1] + (v2 ? b * v2[1] : 0)];
        let sulBordo = 0;
        for (let i = 0; i < pts.length; i += 3) { const [u, w] = coord(pts[i], o); const fu = u - Math.floor(u), fw = w - Math.floor(w); if (Math.min(fu, 1 - fu) * Math.hypot(...v1) < 1 || (v2 && Math.min(fw, 1 - fw) * Math.hypot(...v2) < 1)) sulBordo++; }
        if (!migliore || sulBordo < migliore.sulBordo) migliore = { o, sulBordo };
      }
      // le celle
      const celle = new Map();
      A.pixel.forEach((p, i) => { const [u, w] = coord(pts[i], migliore.o); const k = `${Math.floor(u)},${v2 ? Math.floor(w) : 0}`; if (!celle.has(k)) celle.set(k, []); celle.get(k).push(p); });
      const nuove = [];
      for (const [chiave, pixel] of celle) {
        if (pixel.length < 8 * sc * sc) continue;
        const C = creaAtomo(pixel, -1);
        const mm = new Uint8Array(W * H); for (const q of pixel) mm[q] = 1;
        C.elementi = ris.decodificaMaschera(mm);
        C.cella = chiave; C.padre = A;
        nuove.push(C);
      }
      if (nuove.length < 2) continue;
      A.diviso = true;
      atomi.splice(atomi.indexOf(A), 1, ...nuove);
      reticoli.push({ atomo: A, v1: v1.slice(0, 2), v2: v2 ? v2.slice(0, 2) : null, celle: nuove.length });
    }
    atomi.forEach((a, i) => { a.id = i; });
  }

  // 2. la simmetria di ogni atomo
  for (const a of atomi) {
    const c = a.centro;
    // specchio: l'asse migliore per il baricentro, poi raffinato
    let best = { s: 0, phi: 0 };
    for (let g = 0; g < 180; g += 2) { const phi = g * Math.PI / 180, s = combacia(a, attorno(c, specchio(phi)), a); if (s > best.s) best = { s, phi }; }
    for (let d = -2; d <= 2; d += 0.25) { const phi = best.phi + d * Math.PI / 180, s = combacia(a, attorno(c, specchio(phi)), a); if (s > best.s) best = { s, phi }; }
    // rotazione: il più grande n che combacia
    let n = 1;
    for (let k = 8; k >= 2; k--) if (combacia(a, attorno(c, ruota(2 * Math.PI / k)), a) >= soglia) { n = k; break; }
    const haSpecchio = best.s >= soglia;
    a.simmetria = haSpecchio ? { tipo: 'D', n, asse: best.phi, punteggio: best.s } : n > 1 ? { tipo: 'C', n } : { tipo: 'id', n: 1 };
  }

  // 3. parole: atomi uguali a meno di una similitudine
  const ordinati = atomi.slice().sort((x, y) => y.n - x.n);
  const parole = [];
  for (const A of ordinati) {
    if (A.parola) continue;
    const parola = { id: parole.length, nome: nomeParola(parole.length), rappresentante: A, istanze: [{ atomo: A, M: ID }] };
    A.parola = parola;
    parole.push(parola);
    for (const B of ordinati) {
      if (B.parola || B === A) continue;
      const r = B.n / A.n;
      if (r < 0.55 || r > 1.8) continue;
      const k0 = Math.sqrt(r);
      const prova = (theta, F, k) => comp(trasla(B.centro[0], B.centro[1]), comp(scala(k), comp(ruota(theta), comp(F ? specchio(0) : ID, trasla(-A.centro[0], -A.centro[1])))));
      let best = { s: 0 };
      for (const F of [false, true]) for (let g = 0; g < 360; g += 3) {
        const th = g * Math.PI / 180, s = combacia(A, prova(th, F, k0), B);
        if (s > best.s) best = { s, th, F, k: k0 };
      }
      if (best.s < sogliaParola * 0.85) continue;
      for (let d = -3; d <= 3; d += 0.5) for (const dk of [0.96, 1, 1.04]) {
        const th = best.th + d * Math.PI / 180, k = best.k * dk, s = combacia(A, prova(th, best.F, k), B);
        if (s > best.s) best = { ...best, s, th, k };
      }
      const M = prova(best.th, best.F, best.k);
      // deve valere nei due sensi
      const inversa = invertiSimilitudine(M);
      const s2 = combacia(B, inversa, A);
      if (Math.min(best.s, s2) >= sogliaParola) { B.parola = parola; parola.istanze.push({ atomo: B, M, punteggio: Math.min(best.s, s2) }); }
    }
  }

  // gli elementi decodificati, ognuno nel suo atomo
  const centroElemento = (e) => {
    if (e.tipo === 'disco') return e.pos;
    if (e.tipo === 'petalo') return [e.pos[0] + e.dir[0] * e.L / 2, e.pos[1] + e.dir[1] * e.L / 2];
    if (e.tipo === 'campitura') return e.inizio;
    const p = e.def.punti; let sx = 0, sy = 0; for (const q of p) { sx += q[0]; sy += q[1]; } return [sx / p.length, sy / p.length];
  };
  const atomoDi = (p) => {
    const [x, y] = aMaschera(p).map(Math.round);
    for (let r = 0; r <= 6; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
      const a = atomoDiEtichetta.get(etich[yy * W + xx]); if (a) return a;
    }
    return null;
  };
  const sciolti = [];
  for (const e of ris.elementi) { const a = atomoDi(centroElemento(e)); if (a && a.diviso) continue; if (a) a.elementi.push(e); else sciolti.push(e); }

  // 4. il dominio fondamentale di ogni parola, e le copie che genera la simmetria
  // Per ORBITE: per ogni elemento si cercano i gemelli dove la simmetria lo
  // porterebbe (stesso tipo, dimensione simile). Ogni gemello trovato è
  // sostituito da una copia trasformata del primo; un elemento senza gemelli
  // resta scritto com'è. Così si comprime solo dove la ripetizione c'è davvero.
  const tollOrbita = opzioni.tolleranzaOrbita ?? 2.5; // unità del mondo
  const dimensione = (e) => {
    if (e.tipo === 'disco') return e.d;
    if (e.tipo === 'petalo') return e.L;
    if (e.tipo === 'campitura') return Math.sqrt(e.area || 1);
    let l = 0; for (let i = 1; i < e.def.punti.length; i++) l += Math.hypot(e.def.punti[i][0] - e.def.punti[i - 1][0], e.def.punti[i][1] - e.def.punti[i - 1][1]);
    return l + 1e-6;
  };
  const dominio = (w, modo = 'settore') => {
    const A = w.rappresentante, s = A.simmetria, c = A.centro;
    const rotazioni = []; for (let k = 0; k < s.n; k++) rotazioni.push(attorno(c, ruota(2 * Math.PI * k / s.n)));
    const riflessioni = s.tipo === 'D' ? rotazioni.map((_, k) => attorno(c, specchio(s.asse + Math.PI * k / s.n))) : [];
    const gruppo = rotazioni.concat(riflessioni);
    w.copie = gruppo;
    w.elementi = [];
    if (s.tipo === 'id') { w.modo = 'letterale'; w.elementi = A.elementi.map((e) => ({ e, copie: [ID] })); return; }
    // SETTORE: prima la struttura, poi la lettura. Si decodifica solo il dominio
    // fondamentale della figura (metà, o uno spicchio, con un filo di margine
    // oltre gli assi); il resto lo genera la simmetria.
    if (modo === 'settore' && ris.decodificaMaschera) {
      const DUE_PI = 2 * Math.PI, settore = s.tipo === 'D' ? Math.PI / s.n : DUE_PI / s.n, base = s.tipo === 'D' ? s.asse : 0;
      const margine = opzioni.margineSettore ?? 1.2;
      const mm = new Uint8Array(W * H);
      for (const p of A.pixel) {
        const x = p % W, y = (p - x) / W, q = aMondo(x, y), dx = q[0] - c[0], dy = q[1] - c[1], r = Math.hypot(dx, dy);
        if (r < 1.5 * margine) { mm[p] = 1; continue; }
        const ang = (((Math.atan2(dy, dx) - base) % DUE_PI) + DUE_PI) % DUE_PI, tol = margine / r;
        if (ang <= settore + tol || ang >= DUE_PI - tol) mm[p] = 1;
      }
      w.modo = 'settore';
      w.elementi = ris.decodificaMaschera(mm).map((e) => ({ e, copie: gruppo }));
      return;
    }
    w.modo = 'orbite';
    const els = A.elementi.map((e) => ({ e, c: centroElemento(e), d: dimensione(e) }));
    // gli elementi più grandi per primi: fanno da rappresentanti delle orbite
    els.sort((x, y) => y.d - x.d);
    const usato = new Set();
    for (const x of els) {
      if (usato.has(x)) continue;
      usato.add(x);
      const copie = [ID];
      for (const g of gruppo.slice(1)) {
        const q = app(g, x.c);
        if (Math.hypot(q[0] - x.c[0], q[1] - x.c[1]) < tollOrbita) continue; // g lo lascia dov'è: niente copia
        let best = null, bd = tollOrbita;
        for (const y of els) {
          if (usato.has(y) || y.e.tipo !== x.e.tipo) continue;
          const r = y.d / x.d; if (r < 0.7 || r > 1.4) continue;
          const dd = Math.hypot(q[0] - y.c[0], q[1] - y.c[1]);
          if (dd < bd) { bd = dd; best = y; }
        }
        if (best) { usato.add(best); copie.push(g); }
      }
      w.elementi.push({ e: x.e, copie });
    }
  };
  parole.forEach((w) => dominio(w, 'orbite'));

  // 4b. VERIFICA: ogni ipotesi di struttura si accetta solo se non perde fedeltà.
  // Per ogni atomo si confronta la copertura del suo inchiostro ottenuta dagli
  // elementi letterali con quella ottenuta dalla lingua (dominio × simmetria ×
  // trasformazione); se la lingua perde più di `delta`, l'ipotesi si scarta.
  const delta = opzioni.delta ?? 0.03;
  const cacheLinee = new Map();
  const scalaDi = (M) => Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2]));
  const trasformaLinee = (ls, M) => { const k = scalaDi(M); return ls.map((l) => l.map((q) => { const [x, y] = app(M, q); return [x, y, (q[2] ?? 0) * k]; })); };
  const lineeDi = (e) => {
    if (!cacheLinee.has(e)) { const { part, P } = partituraElemento(e, 10, 0.01); cacheLinee.set(e, trasformaLinee(lineeDaTracce(simula(part)), P)); }
    return cacheLinee.get(e);
  };
  const iouAtomo = (A, linee) => {
    const [bx, by, bw, bh] = A.riquadro, r = new Uint8Array(bw * bh);
    for (const l of linee) for (let i = 0; i + 1 < l.length; i++) {
      const P = aMaschera(l[i]), Q = aMaschera(l[i + 1]);
      const k = Math.max(1, Math.ceil(Math.hypot(Q[0] - P[0], Q[1] - P[1]) * 1.5));
      for (let j = 0; j <= k; j++) {
        const u = j / k, cx = P[0] + (Q[0] - P[0]) * u - bx, cy = P[1] + (Q[1] - P[1]) * u - by;
        const rr = Math.max(0.7, (((l[i][2] ?? 0) * (1 - u) + (l[i + 1][2] ?? 0) * u) / 2) * sc);
        if (cx < -rr || cy < -rr || cx > bw + rr || cy > bh + rr) continue;
        for (let y = Math.max(0, Math.floor(cy - rr)); y <= Math.min(bh - 1, Math.ceil(cy + rr)); y++)
          for (let x = Math.max(0, Math.floor(cx - rr)); x <= Math.min(bw - 1, Math.ceil(cx + rr)); x++)
            if ((x - cx) ** 2 + (y - cy) ** 2 <= rr * rr) r[y * bw + x] = 1;
      }
    }
    // la forma, non l'allineamento al sotto-pixel: un pixel conta se cade a meno
    // di `tollFedelta` dall'altro insieme; il punteggio è la F di precisione e richiamo
    const tf = opzioni.tollFedelta ?? 1.5;
    const inv = new Uint8Array(bw * bh); for (let i = 0; i < bw * bh; i++) inv[i] = r[i] ? 0 : 1;
    const dr = distanza(inv, bw, bh);
    let ink = 0, inkOk = 0, ric = 0, ricOk = 0;
    for (let i = 0; i < bw * bh; i++) {
      if (A.dt[i] === 0) { ink++; if (dr[i] <= tf) inkOk++; }
      if (r[i]) { ric++; if (A.dt[i] <= tf) ricOk++; }
    }
    const R = ink ? inkOk / ink : 0, P = ric ? ricOk / ric : 0;
    return R + P ? (2 * R * P) / (R + P) : 0;
  };
  const lineeGrezze = (A) => A.elementi.flatMap(lineeDi);
  // le linee di un'istanza: le parti della parola che ha davvero (tutte, per il
  // rappresentante) trasformate, più le sue varianti scritte per esteso
  const lineeParola = (w, M, ist = null) => {
    const out = [];
    w.elementi.forEach(({ e, copie }, i) => copie.forEach((S, j) => { if (!ist || !ist.parti || ist.parti.has(`${i}:${j}`)) out.push(...trasformaLinee(lineeDi(e), comp(M, S))); }));
    if (ist && ist.varianti) for (const e of ist.varianti) out.push(...lineeDi(e));
    return out;
  };
  // quali parti della parola ritrovano un gemello nell'istanza B (portata da M)
  const confronta = (w, ist, raffina = true) => {
    const B = ist.atomo, k = scalaDi(ist.M);
    const els = B.elementi.map((e) => ({ e, c: centroElemento(e), d: dimensione(e) }));
    const usato = new Set(), parti = new Set(), coppie = [];
    w.elementi.forEach(({ e, copie }, i) => {
      const c0 = centroElemento(e), d0 = dimensione(e) * k;
      copie.forEach((S, j) => {
        const q = app(comp(ist.M, S), c0);
        let best = null, bd = tollOrbita * Math.max(1, k);
        for (const y of els) {
          if (usato.has(y) || y.e.tipo !== e.tipo) continue;
          const r = y.d / d0; if (r < 0.7 || r > 1.4) continue;
          const dd = Math.hypot(q[0] - y.c[0], q[1] - y.c[1]);
          if (dd < bd) { bd = dd; best = y; }
        }
        if (best) { usato.add(best); parti.add(`${i}:${j}`); coppie.push([app(S, c0), best.c]); }
      });
    });
    ist.coppie = coppie;
    ist.parti = parti;
    ist.varianti = els.filter((y) => !usato.has(y)).map((y) => y.e);
    // Procuste: la similitudine (con lo specchio già deciso) che porta meglio i
    // centri delle parti sui centri dei loro gemelli; poi si riaccoppia
    if (raffina && ist.coppie && ist.coppie.length >= 2) {
      const det = ist.M[0] * ist.M[3] - ist.M[1] * ist.M[2], F = det < 0 ? specchio(0) : ID;
      const X = ist.coppie.map(([a]) => app(F, a)), Y = ist.coppie.map(([, b]) => b);
      const mx = [X.reduce((t, p) => t + p[0], 0) / X.length, X.reduce((t, p) => t + p[1], 0) / X.length];
      const my = [Y.reduce((t, p) => t + p[0], 0) / Y.length, Y.reduce((t, p) => t + p[1], 0) / Y.length];
      let sa = 0, sb = 0, sxx = 0;
      X.forEach((p, i) => { const x = [p[0] - mx[0], p[1] - mx[1]], y = [Y[i][0] - my[0], Y[i][1] - my[1]]; sa += x[0] * y[0] + x[1] * y[1]; sb += x[0] * y[1] - x[1] * y[0]; sxx += x[0] * x[0] + x[1] * x[1]; });
      if (sxx > 1e-9) {
        const th = Math.atan2(sb, sa), kk = Math.hypot(sa, sb) / sxx;
        const L = comp(scala(kk), ruota(th)), t = app(L, mx);
        const nuovo = comp(trasla(my[0] - t[0], my[1] - t[1]), comp(L, F));
        if (Math.abs(kk / k - 1) < 0.25) { ist.M = nuovo; confronta(w, ist, false); }
      }
    }
  };
  const verificaSimmetria = (w) => {
    const A = w.rappresentante;
    if (A.simmetria.tipo === 'id') return;
    const grezzo = iouAtomo(A, lineeGrezze(A));
    // si prova la simmetria trovata, poi le sue parti più semplici: solo lo
    // specchio, solo la rotazione; per ognuna il settore e poi le orbite
    const originale = A.simmetria, candidate = [originale];
    if (originale.tipo === 'D' && originale.n > 1) candidate.push({ tipo: 'D', n: 1, asse: originale.asse }, { tipo: 'C', n: originale.n });
    for (const sim of candidate) {
      A.simmetria = sim;
      for (const modo of ['settore', 'orbite']) {
        dominio(w, modo);
        const lingua = iouAtomo(A, lineeParola(w, ID));
        A.verifica = { grezzo, lingua, modo };
        if (lingua >= grezzo - delta) return;
      }
    }
    A.simmetria = { tipo: 'id', n: 1, scartata: originale }; dominio(w);
  };
  for (let i = 0; i < parole.length; i++) {
    const w = parole[i];
    verificaSimmetria(w);
    const tenute = [w.istanze[0]];
    for (const ist of w.istanze.slice(1)) {
      const B = ist.atomo, grezzo = iouAtomo(B, lineeGrezze(B));
      // la parola intera, così com'è
      ist.parti = null; ist.varianti = [];
      let lingua = iouAtomo(B, lineeParola(w, ist.M, ist));
      ist.verifica = { grezzo, lingua, modo: 'intera' };
      if (lingua >= grezzo - delta) { tenute.push(ist); continue; }
      // solo le parti che ha, più le sue varianti
      confronta(w, ist);
      lingua = iouAtomo(B, lineeParola(w, ist.M, ist));
      ist.verifica = { grezzo, lingua, modo: 'parti' };
      if (ist.parti.size && lingua >= grezzo - delta) { tenute.push(ist); continue; }
      // la ripetizione non regge: B diventa una parola sua (e la sua simmetria si verifica a sua volta)
      const nuova = { id: parole.length, nome: nomeParola(parole.length), rappresentante: B, istanze: [{ atomo: B, M: ID }] };
      B.parola = nuova; dominio(nuova); parole.push(nuova);
    }
    w.istanze = tenute;
  }
  // le parole senza elementi non dicono nulla
  for (let i = parole.length - 1; i >= 0; i--) if (!parole[i].elementi.length) parole.splice(i, 1);
  parole.forEach((w, i) => { w.id = i; w.nome = nomeParola(i); });

  // 5. figure composte: gli atomi vicini, con la loro simmetria
  const figure = figureComposte(atomi, m, W, H, sc, opzioni, combacia, soglia);

  const conta = {
    decodificati: ris.elementi.length,
    vocabolario: parole.reduce((n, w) => n + w.elementi.length + w.istanze.reduce((m, i) => m + (i.varianti ? i.varianti.length : 0), 0), 0) + sciolti.length,
    istanze: parole.reduce((n, w) => n + w.istanze.length, 0),
  };
  return { atomi, parole, figure, sciolti, reticoli, conta, testo: testoLingua(parole, figure, conta, reticoli) };
}

function invertiSimilitudine(M) {
  const [a, b, c, d, e, f] = M, det = a * d - b * c;
  const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
  return [ia, ib, ic, id, -(ia * e + ic * f), -(ib * e + id * f)];
}

function nomeParola(i) {
  const lettere = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return i < 26 ? lettere[i] : lettere[Math.floor(i / 26) - 1] + lettere[i % 26];
}

function figureComposte(atomi, m, W, H, sc, opzioni, combacia, soglia) {
  // dilatazione: gli atomi a meno di `vicinanza` pixel originali stanno nella stessa figura
  const R = Math.round((opzioni.vicinanza ?? 7) * sc);
  const dil = new Uint8Array(W * H);
  // dilatazione separabile con un quadrato (veloce)
  const tmp = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) { let ultimo = -1e9; for (let x = 0; x < W; x++) { if (m[y * W + x]) ultimo = x; if (x - ultimo <= R) tmp[y * W + x] = 1; } ultimo = 1e9; for (let x = W - 1; x >= 0; x--) { if (m[y * W + x]) ultimo = x; if (ultimo - x <= R) tmp[y * W + x] = 1; } }
  for (let x = 0; x < W; x++) { let ultimo = -1e9; for (let y = 0; y < H; y++) { if (tmp[y * W + x]) ultimo = y; if (y - ultimo <= R) dil[y * W + x] = 1; } ultimo = 1e9; for (let y = H - 1; y >= 0; y--) { if (tmp[y * W + x]) ultimo = y; if (ultimo - y <= R) dil[y * W + x] = 1; } }
  const { etich } = componenti(dil, W, H, 1);
  const gruppi = new Map();
  for (const a of atomi) {
    const [bx, by, bw, bh] = a.riquadro;
    // un pixel d'inchiostro dell'atomo dà la sua figura
    let lab = -1;
    for (let y = by; y < by + bh && lab < 0; y++) for (let x = bx; x < bx + bw; x++) if (m[y * W + x] && a.dt[(y - by) * bw + (x - bx)] === 0) { lab = etich[y * W + x]; break; }
    if (!gruppi.has(lab)) gruppi.set(lab, []);
    gruppi.get(lab).push(a);
  }
  const figure = [];
  for (const membri of gruppi.values()) {
    if (membri.length < 2) continue;
    // la simmetria della figura: si prova lo specchio sul baricentro pesato, con i campioni di tutti
    const tot = membri.reduce((n, a) => n + a.n, 0);
    const c = [membri.reduce((s, a) => s + a.centro[0] * a.n, 0) / tot, membri.reduce((s, a) => s + a.centro[1] * a.n, 0) / tot];
    const unione = { campioni: membri.flatMap((a) => a.campioni) };
    const sovrapposto = (M) => {
      // un campione combacia se cade sull'inchiostro di uno degli atomi della figura
      let ok = 0;
      for (const p of unione.campioni) {
        const q = app(M, p);
        if (membri.some((b) => combacia({ campioni: [p] }, M, b) > 0)) ok++;
        void q;
      }
      return ok / unione.campioni.length;
    };
    let best = { s: 0, phi: 0 };
    const unioneRidotta = { campioni: unione.campioni.filter((_, i) => i % Math.max(1, Math.floor(unione.campioni.length / 300)) === 0) };
    const sovrappostoRidotto = (M) => { let ok = 0; for (const p of unioneRidotta.campioni) if (membri.some((b) => combacia({ campioni: [p] }, M, b) > 0)) ok++; return ok / unioneRidotta.campioni.length; };
    void sovrapposto;
    for (let g = 0; g < 180; g += 3) { const phi = g * Math.PI / 180, s = sovrappostoRidotto(attorno(c, specchio(phi))); if (s > best.s) best = { s, phi }; }
    figure.push({ membri, centro: c, simmetria: best.s >= soglia ? { tipo: 'D', n: 1, asse: best.phi, punteggio: best.s } : { tipo: 'id', n: 1 } });
  }
  return figure;
}

function nomeSimmetria(s) { return s.tipo === 'id' ? 'C1' : `${s.tipo}${s.n}`; }
function nomeTrasformazione(M) {
  const d = descrivi(M), parti = [];
  if (d.specchio) parti.push('specchio');
  const a = Math.round(d.angolo);
  if (!d.specchio && a % 360 !== 0) parti.push(`↻${a}°`);
  if (Math.abs(d.scala - 1) > 0.06) parti.push(`×${d.scala.toFixed(2)}`);
  return parti.join(' ') || 'identica';
}

function testoLingua(parole, figure, conta, reticoli = []) {
  const righe = ['VOCABOLARIO'];
  for (const w of parole) {
    const tipi = {};
    for (const { e } of w.elementi) tipi[e.tipo] = (tipi[e.tipo] || 0) + 1;
    const nomi = { catena: ['catena', 'catene'], petalo: ['petalo', 'petali'], disco: ['disco', 'dischi'], campitura: ['campitura', 'campiture'] };
    const contenuto = Object.entries(tipi).map(([t, n]) => `${n} ${(nomi[t] || [t, t])[n > 1 ? 1 : 0]}`).join(', ') || 'vuota';
    const trasf = {};
    for (const i of w.istanze.slice(1)) { const t = nomeTrasformazione(i.M) + (i.varianti && i.varianti.length ? ` +${i.varianti.length} varianti` : ''); trasf[t] = (trasf[t] || 0) + 1; }
    const comeAppare = w.istanze.length > 1 ? `  ×${w.istanze.length}  (${['1 originale', ...Object.entries(trasf).map(([t, n]) => `${n} ${t}`)].join(', ')})` : '';
    righe.push(`  ${w.nome.padEnd(3)} ${nomeSimmetria(w.rappresentante.simmetria).padEnd(3)} [ ${contenuto} ]${comeAppare}`);
  }
  if (figure.length) {
    righe.push('', 'FIGURE');
    figure.forEach((f, i) => {
      const conteggio = {};
      for (const a of f.membri) conteggio[a.parola.nome] = (conteggio[a.parola.nome] || 0) + 1;
      righe.push(`  ${String(i + 1).padEnd(3)} ${nomeSimmetria(f.simmetria).padEnd(3)} = ${Object.entries(conteggio).map(([n, k]) => (k > 1 ? `${k}·${n}` : n)).join(' + ')}`);
    });
  }
  if (reticoli.length) {
    righe.push('', 'RETICOLI');
    for (const r of reticoli) {
      const celle = {};
      for (const w of parole) for (const i of w.istanze) if (i.atomo.padre === r.atomo) celle[w.nome] = (celle[w.nome] || 0) + 1;
      const v = (x) => `(${x[0].toFixed(1)}, ${x[1].toFixed(1)})`;
      righe.push(`  ${r.v2 ? 'piano' : 'fregio'}  a = ${v(r.v1)}${r.v2 ? `  b = ${v(r.v2)}` : ''}  ${r.celle} celle = ${Object.entries(celle).map(([n, k]) => (k > 1 ? `${k}·${n}` : n)).join(' + ')}`);
    }
  }
  const totale = {};
  for (const w of parole) totale[w.nome] = w.istanze.length;
  righe.push('', `TAVOLA = ${Object.entries(totale).map(([n, k]) => (k > 1 ? `${k}·${n}` : n)).join(' + ')}`);
  righe.push('', `seme: ${conta.decodificati} elementi decodificati → ${conta.vocabolario} nel vocabolario (${(conta.decodificati / Math.max(1, conta.vocabolario)).toFixed(1)} volte più corto), ${conta.istanze} istanze`);
  return righe.join('\n');
}

// ---------- il seme della lingua: vocabolario × frase → stato fisico
function partituraElemento(e, v, precisione) {
  if (e.tipo === 'catena') return { part: catena({ ...e.def, v, precisione }), P: ID };
  if (e.tipo === 'petalo') {
    const a = Math.atan2(e.dir[1], e.dir[0]) - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
    return { part: MOTIVI.petalo({ L: e.L, W: e.W, b: e.b, curva: e.curva }), P: [c, s, -s, c, e.pos[0], e.pos[1]] };
  }
  if (e.tipo === 'campitura') return { part: MOTIVI.campitura({ contorno: e.contorno, buchi: e.buchi, spessore: e.spessore, inizio: e.inizio }), P: ID };
  return { part: MOTIVI.disco({ d: e.d }), P: trasla(e.pos[0], e.pos[1]) };
}
// la lingua senza le figure (maschere, distanze): solo ciò che serve al seme,
// in JSON. Le parti di un'istanza diventano una lista.
export function esportaLingua(L) {
  return {
    parole: L.parole.map((w) => ({
      nome: w.nome, simmetria: { tipo: w.rappresentante.simmetria.tipo, n: w.rappresentante.simmetria.n, asse: w.rappresentante.simmetria.asse, centro: w.rappresentante.centro },
      elementi: w.elementi.map(({ e, copie }) => ({ e, copie })),
      istanze: w.istanze.map((i) => ({ M: i.M, parti: i.parti ? [...i.parti] : null, varianti: i.varianti || [] })),
    })),
    sciolti: L.sciolti, reticoli: (L.reticoli || []).map((r) => ({ v1: r.v1, v2: r.v2, celle: r.celle })), testo: L.testo, conta: L.conta,
  };
}

export function semeDaLingua(L, opzioni = {}) {
  const v = opzioni.v ?? 10, precisione = opzioni.precisione ?? 0.01;
  const conf = { G: 1, limiti: [-1e5, -1e5, 1e5, 1e5], blocchi: [], masse: [], campi: [], interfacce: [], regole: [], emettitori: [], piani: {} };
  let n = 0;
  const metti = (part, M, ruolo) => {
    const pref = `l${n++}`;
    const t = trasformaPartitura(part, M, pref);
    for (const k of ['blocchi', 'masse', 'campi', 'interfacce', 'regole', 'emettitori']) conf[k].push(...t[k]);
    conf.piani[pref] = { ruolo };
  };
  for (const w of L.parole) {
    w.elementi.forEach(({ e, copie }, i) => {
      const { part, P } = partituraElemento(e, v, precisione);
      for (const ist of w.istanze) { const parti = ist.parti ? new Set(ist.parti) : null; copie.forEach((S, j) => { if (!parti || parti.has(`${i}:${j}`)) metti(part, comp(ist.M, comp(S, P)), w.nome); }); }
    });
    for (const ist of w.istanze) for (const e of ist.varianti || []) { const { part, P } = partituraElemento(e, v, precisione); metti(part, P, w.nome); }
  }
  for (const e of L.sciolti) { const { part, P } = partituraElemento(e, v, precisione); metti(part, P, 'sciolto'); }
  return conf;
}
