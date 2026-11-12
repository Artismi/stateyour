// volume.worker.js — i VOLUMI che lo sguardo attraversa, calcolati fuori dal filo dell'interfaccia.
//
// { tipo: 'galassia', n, cosmo, galassia, t, nf, nr, nz } → la galassia come campo in coordinate cilindriche:
//   una griglia (angolo φ × raggio R × quota z) con, in ogni cella, quanta luce nasce lì (rosso, verde, blu) e quanta
//   polvere c'è (estinzione per unità di lunghezza). Tutto da galassie.js `densitaGalassia(forma).in3d` (disco
//   esponenziale ad anelli, bracci con la loro fase, sferoide di Hernquist, gas e polvere = gas × metalli) e da vuoto.js:
//   · la LUCE va con la massa delle stelle; il colore con la popolazione: lo sferoide e il disco tra i bracci sono stelle
//     vecchie (un corpo nero a 4300 K), dove il braccio addensa le stelle ne nascono di nuove (9500 K) — la parte
//     giovane è l'eccesso sulla media dell'anello, e vale in luce `GIOVANI` volte la sua massa (LIBERO: 3; le stelle
//     giovani rendono più luce per chilo). La somma su tutto il volume è la luminosità della galassia;
//   · la POLVERE: A_V per metro = κ × densità di polvere, con κ letto da vuoto.js (`polvere.in`, una volta);
//   · le NEBULOSE e le NUBI di vuoto.js (`scenaGalassia().vuoto`) depositate nella cella dove stanno: la loro luce
//     visibile col colore delle loro righe, la loro estinzione come colonna media della cella (secondo messaggio).
//   Unità (perché stiano in 16 bit): lunghezze in raggi della galassia Rg; la luce di una cella è j·Rg³/L (L la luminosità
//   di tutta la galassia: l'integrale sul volume, in Rg³, fa 1); la polvere è A_V per Rg.
//   z non è uniforme: z = zmax·s·|s| con s da −1 a 1 (fitto vicino al piano, dove stanno disco e polvere).
// { tipo: 'ragnatela', … } → vedi sotto.
import { scenaGalassia } from '../camera/spazio3d.js';
import { densitaGalassia } from '../camera/galassie.js';
import { galassia } from '../camera/cosmo.js';
import { coloreCorpoNero } from './nucleo.js';
import { classiSuGriglia, raffina, ondeDi, dentro } from '../camera/ragnatela.js';

const KPC = 3.0857e19, MSOLE = 1.989e30, GIOVANI = 3, lin = (c) => (c / 255) ** 2.2;

function volumeGalassia(d, manda) {
  const sg = scenaGalassia(d.cosmo, d.galassia, d.t), F = galassia(d.cosmo, d.galassia).forma, D = densitaGalassia(F), Rg = sg.riferimento.raggio, Rk = Rg / KPC, tG = d.t / (1e9 * 3.15576e7);
  const { nf, nr, nz } = d, Rmax = 1.15, zmax = 0.8, dati = new Float32Array(4 * nf * nr * nz), vecchio = coloreCorpoNero(4300), giovane = coloreCorpoNero(9500);
  const sf = D.sferoide, sferoide = (R, z) => { const r3 = Math.hypot(R, z) || 1e-6; return sf.massa > 0 ? (sf.massa * sf.scala) / (2 * Math.PI * (sf.schiacciata || 1) * r3 * (r3 + sf.scala) ** 3) : 0; };
  // κ: A_V per metro per kg/m³ di polvere, da vuoto.js (in un punto del piano dove c'è polvere)
  let kappa = 0; try { const pv = sg.vuoto({ centro: [0, 0, 0], raggio: 0.2 }).polvere; for (const r of [0.3, 0.15, 0.5, 0.05]) { const q = pv.in(r * Rg, 0, 0); if (q.densita > 0) { kappa = q.AVperMetro / q.densita; break; } } } catch { kappa = 0; }
  const u = MSOLE / KPC ** 3, riga = new Float64Array(nf), volCella = (jr, jz) => { const r0 = (jr / nr) * Rmax, r1 = ((jr + 1) / nr) * Rmax, s0 = (jz / nz) * 2 - 1, s1 = ((jz + 1) / nz) * 2 - 1; return (Math.PI * (r1 * r1 - r0 * r0) / nf) * Math.abs(zmax * (s1 * Math.abs(s1) - s0 * Math.abs(s0))); };
  let somma = 0;
  for (let jz = 0; jz < nz; jz++) { const s = ((jz + 0.5) / nz) * 2 - 1, z = zmax * s * Math.abs(s) * Rk;
    for (let jr = 0; jr < nr; jr++) { const R = Math.max(1e-3, ((jr + 0.5) / nr) * Rmax * Rk), sfe = sferoide(R, z); let media = 0;
      for (let jf = 0; jf < nf; jf++) { const q = D.in3d(R, z, ((jf + 0.5) / nf) * 2 * Math.PI, tG); riga[jf] = q.stelle - sfe; media += riga[jf]; const o = 4 * ((jz * nr + jr) * nf + jf); dati[o + 3] = kappa * q.polvere * u * Rg; }
      media /= nf; const v = volCella(jr, jz);
      for (let jf = 0; jf < nf; jf++) { const disco = Math.max(0, riga[jf]), nuove = Math.max(0, disco - media), o = 4 * ((jz * nr + jr) * nf + jf), a = sfe + disco - nuove, b = GIOVANI * nuove;
        for (let c = 0; c < 3; c++) dati[o + c] = a * vecchio[c] + b * giovane[c]; somma += (a + b) * v; } } }
  // (galassie.js dà il disco ad anelli: la densità cambia a scalini da un anello all'altro, e di faccia si vedrebbero
  // cerchi che non ci sono: lungo il raggio si passa due volte una media 1-2-1, larga quanto un anello non è)
  for (let giro = 0; giro < 3; giro++) { const prima = dati.slice(); for (let jz = 0; jz < nz; jz++) for (let jr = 1; jr < nr - 1; jr++) for (let jf = 0; jf < nf; jf++) { const o = 4 * ((jz * nr + jr) * nf + jf), m = 4 * nf; for (let c = 0; c < 4; c++) dati[o + c] = 0.25 * prima[o - m + c] + 0.5 * prima[o + c] + 0.25 * prima[o + m + c]; } }
  // (verso il bordo della griglia la luce sfuma a zero: lo sferoide vero continua, qui lo si taglia senza spigolo)
  for (let jz = 0; jz < nz; jz++) { const s = Math.abs(((jz + 0.5) / nz) * 2 - 1), fz = Math.min(1, (1 - s * s) / 0.35); for (let jr = 0; jr < nr; jr++) { const fr = Math.min(1, (1 - (jr + 0.5) / nr) / 0.2), f = fz * fr; if (f >= 1) continue; for (let jf = 0; jf < nf; jf++) { const o = 4 * ((jz * nr + jr) * nf + jf); dati[o] *= f; dati[o + 1] *= f; dati[o + 2] *= f; } } }
  // (la somma sul volume della luce deve fare 1)
  const k = somma > 0 ? 1 / somma : 0; for (let o = 0; o < dati.length; o += 4) { dati[o] *= k; dati[o + 1] *= k; dati[o + 2] *= k; }
  const meta = { nf, nr, nz, Rmax, zmax, raggioM: Rg, luce: sg.daLontano.luminosita, kappa, t: d.t };
  manda({ n: d.n, tipo: 'galassia', dati: dati.slice(), ...meta, nebulose: 0 });
  // secondo messaggio: con le nebulose e le nubi di vuoto.js depositate nelle loro celle
  try { const v = sg.vuoto({ centro: [0, 0, 0], raggio: Rk * 1.1 }); let messe = 0;
    for (const x of v.volumi) { const R = Math.hypot(x.pos[0], x.pos[1]) / Rg, z = x.pos[2] / Rg; if (R >= Rmax || Math.abs(z) >= zmax) continue; let fi = Math.atan2(x.pos[1], x.pos[0]) / (2 * Math.PI); fi -= Math.floor(fi);
      const jf = Math.min(nf - 1, Math.floor(fi * nf)), jr = Math.min(nr - 1, Math.floor((R / Rmax) * nr)), s = Math.sign(z) * Math.sqrt(Math.abs(z) / zmax), jz = Math.min(nz - 1, Math.floor(((s + 1) / 2) * nz)), o = 4 * ((jz * nr + jr) * nf + jf), vc = volCella(jr, jz);
      if (x.brillanza > 0 && x.colore) { const L = (x.brillanza * 4 * Math.PI * Math.PI * x.raggio * x.raggio) / sg.daLontano.luminosita / vc, m = Math.max(lin(x.colore[0]), lin(x.colore[1]), lin(x.colore[2])) || 1; for (let c = 0; c < 3; c++) dati[o + c] += (L * lin(x.colore[c])) / m; messe++; }
      if (x.estinzione > 0) { dati[o + 3] += (x.estinzione * (2 / 3) * Math.PI * (x.raggio / Rg) ** 2) / vc; messe++; } }
    manda({ n: d.n, tipo: 'galassia', dati, ...meta, nebulose: messe });
  } catch (e) { /* senza vuoto.js resta il volume delle stelle e della polvere */ }
}

// { tipo: 'ragnatela', n, cosmo, regione: null | { centro, lato } (m comoventi), celle, griglia, kmax, D }
// → la densità ρ/ρ̄ su una griglia (griglia³, Float32) DOPO lo spostamento di Zel'dovich: ogni elemento di materia (i nodi
//   di una griglia celle³: tutti della stessa massa) è portato da q a x = q + D·Ψ(q) e depositato nelle otto celle
//   vicine. Ψ = −∇φ con ∇²φ = δ: ragnatela.js dà le derivate seconde di φ (il tensore di marea) nei nodi; le prime si
//   ricavano da lì integrando lungo le file della griglia (∂ψ_x/∂x = −φ_xx …: trapezi; su tutto il toro, che si
//   richiude, la media di Ψ è zero; in una regione resta ignota una traslazione di tutta la regione, che non cambia
//   la forma dei filamenti ma la sposta di qualche Mpc rispetto alla grana grossa — dichiarato).
function volumeRagnatela(d, manda) {
  const O = ondeDi(d.cosmo), campo = d.kmax > O.kmax ? raffina(d.cosmo, d.kmax) : O, reg = d.regione ? { centro: d.regione.centro, lato: d.regione.lato, celle: d.celle } : null;
  const G = classiSuGriglia(campo, reg, { celle: d.celle }), n = G.n, n2 = n * n, F = G.campo, h = G.passo; // (h: il passo in frazioni del toro; le λ sono in quelle unità: Ψ in frazioni del toro)
  // Ψ per integrazione: lungo x da (0, j, k), con il punto di partenza di ogni fila ottenuto lungo y da (0, 0, k) e quello lungo z da (0, 0, 0)
  const P = [new Float32Array(n * n2), new Float32Array(n * n2), new Float32Array(n * n2)], T = [[F.xx, F.xy, F.xz], [F.xy, F.yy, F.yz], [F.xz, F.yz, F.zz]], q = (i, j, k) => (k * n + j) * n + i;
  for (let c = 0; c < 3; c++) { const [tx, ty, tz] = T[c], p = P[c];
    for (let k = 1; k < n; k++) p[q(0, 0, k)] = p[q(0, 0, k - 1)] - 0.5 * h * (tz[q(0, 0, k)] + tz[q(0, 0, k - 1)]);
    for (let k = 0; k < n; k++) for (let j = 1; j < n; j++) p[q(0, j, k)] = p[q(0, j - 1, k)] - 0.5 * h * (ty[q(0, j, k)] + ty[q(0, j - 1, k)]);
    for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 1; i < n; i++) p[q(i, j, k)] = p[q(i - 1, j, k)] - 0.5 * h * (tx[q(i, j, k)] + tx[q(i - 1, j, k)]);
    let m = 0; for (let a = 0; a < p.length; a++) m += p[a]; m /= p.length; for (let a = 0; a < p.length; a++) p[a] -= m; }
  // il deposito: griglia g³ sulla stessa regione (tutto il toro: periodica), nuvola-nella-cella (otto celle vicine)
  const g = d.griglia, rho = new Float32Array(g * g * g), per = !reg, lato = per ? 1 : n * h, o0 = per ? [0, 0, 0] : G.origine.map((v) => v - 0.5 * h), D = d.D ?? 1, massa = (g / n) ** 3;
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = q(i, j, k), X = [G.origine[0] + i * h + D * P[0][a], G.origine[1] + j * h + D * P[1][a], G.origine[2] + k * h + D * P[2][a]].map((v, c) => ((v - o0[c]) / lato) * g - 0.5);
    const i0 = Math.floor(X[0]), j0 = Math.floor(X[1]), k0 = Math.floor(X[2]), fx = X[0] - i0, fy = X[1] - j0, fz = X[2] - k0;
    for (let dk = 0; dk < 2; dk++) for (let dj = 0; dj < 2; dj++) for (let di = 0; di < 2; di++) { let x = i0 + di, y = j0 + dj, z = k0 + dk; if (per) { x = ((x % g) + g) % g; y = ((y % g) + g) % g; z = ((z % g) + g) % g; } else if (x < 0 || y < 0 || z < 0 || x >= g || y >= g || z >= g) continue;
      rho[(z * g + y) * g + x] += massa * (di ? fx : 1 - fx) * (dj ? fy : 1 - fy) * (dk ? fz : 1 - fz); } }
  manda({ n: d.n, tipo: 'ragnatela', dati: rho, griglia: g, periodica: per, origine: o0.map((v) => v * O.toroM), latoM: lato * O.toroM, toroM: O.toroM, kmax: campo.kmax, D });
}

self.onmessage = (e) => {
  const d = e.data, t0 = performance.now(), manda = (m) => self.postMessage({ ...m, ms: performance.now() - t0 }, [m.dati.buffer]);
  try { if (d.tipo === 'galassia') volumeGalassia(d, manda); else if (d.tipo === 'ragnatela') volumeRagnatela(d, manda); }
  catch (err) { self.postMessage({ n: d.n, tipo: d.tipo, errore: String((err && err.stack) || err) }); }
};
