// volumi.js — I VOLUMI ATTRAVERSATI DALLO SGUARDO: la galassia e la ragnatela cosmica non sono fatte di figurine, sono
// densità nello spazio; per ogni punto dello schermo si cammina lungo il raggio dentro il volume e si sommano la luce che
// nasce lungo la strada e, per la galassia, la polvere che la toglie (e la arrossa) a ciò che sta dietro.
//
// I dati li prepara volume.worker.js (lì è scritto da quali leggi vengono) e stanno in un'immagine a tre dimensioni.
// LA GALASSIA: griglia cilindrica (angolo × raggio × quota, fitta vicino al piano): luce per colore e polvere (A_V per
//   raggio della galassia). Lungo il raggio: C += T·j·ds, T ·= 10^(−0,4·A_λ·ds), con A_λ/A_V = 0,79 (rosso), 1 (verde),
//   1,31 (blu) — la curva di estinzione media della Via Lattea (Cardelli, Clayton & Mathis 1989, R_V = 3,1 [R]): la
//   polvere arrossa. I passi sono fitti dove il raggio attraversa il piano (uniformi in asinh(z/h)) o, se corre nel
//   piano, fitti vicino all'occhio. I bracci girano col loro passo (l'angolo della griglia segue la fase di adesso).
// LA RAGNATELA: griglia cubica di ρ/ρ̄ dopo lo spostamento di Zel'dovich (tutto il toro, che si ripete, più una regione
//   fine attorno a chi guarda); luce ∝ massa: j = (luce di tutto il cosmo / volume)·ρ/ρ̄; lungo il raggio, col cono di
//   luce, ogni tratto vale (a_e/a_o)² (la tabella che dà universo.js).
// Quanto si vede: il valore è π·I/E0 (I la radianza sommata), l'unità del nucleo; l'esposizione la sceglie chi chiama.
// QUALITÀ (N.vista): `passi.galassia`, `passi.ragnatela` (quanti campioni per raggio, a ogni fotogramma), `riduzione` (il
// volume si disegna su un'immagine più piccola di tanto per lato e si aggiunge al fondo), `accumulo` (accumulo.js: i
// fotogrammi si sommano, ognuno coi passi sfasati in modo diverso; a camera ferma la media è quella di tanti più passi),
// `vuoto` (il salto del vuoto, sotto). Sono il costo: sono regolabili.
// IL SALTO DEL VUOTO (galassia). Dalla griglia si fa, una volta, una carta grossolana di dove c'è materia: per ogni anello
// della griglia la quota oltre la quale (a qualunque angolo) la luce è sotto `vista.vuoto` volte la più forte di
// quell'anello e la polvere sotto `vista.vuoto` per raggio della galassia (allargata di una cella: il campione è interpolato),
// e da quella, per ogni intervallo di anelli, la quota massima (una tabella nr × nr). Il raggio si taglia in 16 tratti;
// per ogni tratto si sa in un colpo (da dove passa più vicino e più lontano dall'asse, e dalla quota più bassa) se può
// toccare materia: i tratti vuoti si saltano, e i passi si stendono solo tra il primo e l'ultimo tratto pieno. Un
// raggio che non tocca niente costa 16 letture invece dei passi.
import { creaStoria, accumuloAttivo, sfasatura } from './accumulo.js';
const PASSI_MAX = 160, NSEG = 16;
const V_Q = `out vec2 v_uv; void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
// (un numero a caso per punto dello schermo, senza trama: sposta l'inizio dei passi; quello «interlacciato» di prima, dove contavano pochi passi, lasciava un retino.
// Con l'accumulo vi si somma lo sfasamento del fotogramma (u_sfasa.x) e lo spostamento copre tutto il passo (u_sfasa.y = 1); senza, resta vicino al mezzo come prima (0,3))
const GLSL_CASO = `uniform vec2 u_sfasa; float caso(vec2 p) { return fract(fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453) + u_sfasa.x); }
float dentroPasso(float g) { return 0.5 + (g - 0.5) * u_sfasa.y; }`;
const F_GALASSIA = `
precision highp sampler3D;
in vec2 v_uv; out vec4 o_col;
uniform sampler3D u_vol;
uniform vec3 u_occhio;     // l'occhio nel riferimento della galassia, in raggi della galassia
uniform mat3 u_raggi;      // dagli assi dell'occhio a quelli della galassia
uniform vec4 u_cam;        // tangenti di metà campo; quanti passi; l'angolo di cui i bracci sono girati da quando si è fatta la griglia
uniform vec4 u_k;          // L/(4·Rg²·E0) (da somma lungo il raggio a «fogli bianchi»); Rmax; zmax; estinzione (1: vera)
uniform sampler2D u_occ;   // il salto del vuoto: la quota (Rg) sotto cui può esserci materia, per intervallo di anelli [i, j] nel punto (j, i)
uniform vec2 u_occN;       // quanti anelli; 1: il salto c'è
${GLSL_CASO}
void main() {
  vec3 d = normalize(u_raggi * vec3((v_uv * 2.0 - 1.0) * u_cam.xy, -1.0)), o = u_occhio; float Rm = u_k.y, zm = u_k.z;
  // dove il raggio sta dentro il cilindro (raggio Rmax, quota ±zmax)
  float t0 = 0.0, t1 = 1e9;
  if (abs(d.z) > 1e-6) { float a = (-zm - o.z) / d.z, b = (zm - o.z) / d.z; t0 = max(t0, min(a, b)); t1 = min(t1, max(a, b)); } else if (abs(o.z) > zm) { o_col = vec4(0.0); return; }
  float A = dot(d.xy, d.xy), B = dot(o.xy, d.xy), Cc = dot(o.xy, o.xy) - Rm * Rm;
  if (A > 1e-9) { float disc = B * B - A * Cc; if (disc <= 0.0) { o_col = vec4(0.0); return; } float s = sqrt(disc); t0 = max(t0, (-B - s) / A); t1 = min(t1, (-B + s) / A); } else if (Cc > 0.0) { o_col = vec4(0.0); return; }
  if (t1 <= t0) { o_col = vec4(0.0); return; }
  // il salto del vuoto: quali dei 16 tratti possono toccare materia
  float tS = t0, dT = (t1 - t0) / ${NSEG}.0; uint pieni = 0xffffu;
  if (u_occN.y > 0.5) { pieni = 0u; int primo = ${NSEG}, ultimo = -1, nr = int(u_occN.x);
    for (int k = 0; k < ${NSEG}; k++) { float ta = tS + dT * float(k), tb = ta + dT; vec3 a = o + d * ta, b = o + d * tb;
      float tc = A > 1e-12 ? clamp(-B / A, ta, tb) : ta, Rlo = length((o + d * tc).xy), Rhi = max(length(a.xy), length(b.xy)), zlo = a.z * b.z <= 0.0 ? 0.0 : min(abs(a.z), abs(b.z));
      int ilo = clamp(int(Rlo / Rm * float(nr)), 0, nr - 1), ihi = clamp(int(Rhi / Rm * float(nr)), 0, nr - 1);
      if (zlo <= texelFetch(u_occ, ivec2(ihi, ilo), 0).r) { pieni |= 1u << uint(k); primo = min(primo, k); ultimo = k; } }
    if (ultimo < 0) { o_col = vec4(0.0); return; }
    t0 = tS + dT * float(primo); t1 = tS + dT * float(ultimo + 1); }
  int n = int(u_cam.z); float h = 0.03 * zm, z0 = o.z + d.z * t0, z1 = o.z + d.z * t1, u0 = asinh(z0 / h), u1 = asinh(z1 / h), g = caso(gl_FragCoord.xy);
  bool piano = abs(d.z) < 0.04 || abs(u1 - u0) < 0.5; // il raggio corre (quasi) nel piano: passi fitti vicino all'inizio
  vec3 C = vec3(0.0), T = vec3(1.0); float prima = t0, sw = 0.0, st = 0.0;
  for (int i = 0; i < ${PASSI_MAX}; i++) { if (i >= n) break;
    float f = (float(i) + 1.0) / float(n), t = piano ? t0 + (t1 - t0) * f * f : (h * sinh(mix(u0, u1, f)) - o.z) / d.z, ds = t - prima, tm = prima + ds * dentroPasso(g); prima = t;
    if (((pieni >> uint(clamp(int((tm - tS) / dT), 0, ${NSEG - 1}))) & 1u) == 0u) continue;
    vec3 p = o + d * tm; float R = length(p.xy), fi = atan(p.y, p.x) - u_cam.w;
    vec4 c = texture(u_vol, vec3(fi * 0.15915494, R / Rm, 0.5 + 0.5 * sign(p.z) * sqrt(min(1.0, abs(p.z) / zm))));
    vec3 tau = c.a * ds * 0.921 * u_k.w * vec3(0.79, 1.0, 1.31), via = exp(-tau);
    vec3 dC = T * c.rgb * ds * mix(vec3(1.0), (1.0 - via) / max(tau, vec3(1e-5)), step(1e-4, tau)); C += dC; T *= via;
    float l = dC.r + dC.g + dC.b; sw += l; st += l * tm; // (la distanza media pesata con la luce: per riportare la storia)
    if (max(T.r, max(T.g, T.b)) < 0.003) break; }
  o_col = vec4(C * u_k.x, sw > 0.0 ? st / sw : 0.0);
}`;
const NT = 16;
const F_RETE = `
precision highp sampler3D;
in vec2 v_uv; out vec4 o_col;
uniform sampler3D u_grossa, u_fine;
uniform vec3 u_occhio;     // l'occhio in lati del toro (0…1)
uniform mat3 u_raggi; uniform vec4 u_cam; // dagli assi dell'occhio a quelli del toro; tangenti, passi, quanto è lunga la strada (in lati)
uniform vec4 u_fine0;      // la regione fine: origine (lati del toro) e lato (0: non c'è)
uniform vec4 u_k;          // (luce/volume)·lato·a/(4·E0)… da somma lungo il raggio a fogli bianchi; strada vicina (fitta) in lati; 0; 0
uniform float u_tab[${NT}]; // (a_e/a_o)² lungo la strada
${GLSL_CASO}
void main() {
  vec3 d = normalize(u_raggi * vec3((v_uv * 2.0 - 1.0) * u_cam.xy, -1.0)); int n = int(u_cam.z); float lungo = u_cam.w, g = caso(gl_FragCoord.xy), somma = 0.0, prima = 0.0, st = 0.0;
  for (int i = 0; i < ${PASSI_MAX}; i++) { if (i >= n) break;
    float f = (float(i) + 1.0) / float(n), t = lungo * f * f, ds = t - prima, tm = prima + ds * dentroPasso(g); prima = t; // passi fitti vicino, radi lontano
    vec3 p = u_occhio + d * tm;
    vec3 rel = fract(p - u_fine0.xyz + 0.5) - 0.5; // (rispetto al centro della regione fine, nell'immagine più vicina del toro)
    float rho; if (u_fine0.w > 0.0 && max(abs(rel.x), max(abs(rel.y), abs(rel.z))) < 0.5 * u_fine0.w * 0.94) rho = texture(u_fine, rel / u_fine0.w + 0.5).r; else rho = texture(u_grossa, fract(p)).r;
    float x = clamp(tm / lungo, 0.0, 1.0) * ${NT - 1}.0; int k = int(min(floor(x), ${NT - 2}.0));
    float dl = rho * ds * mix(u_tab[k], u_tab[k + 1], x - float(k)); somma += dl; st += dl * tm; }
  o_col = vec4(vec3(somma * u_k.x), somma > 0.0 ? st / somma : 0.0);
}`;
const F_COPIA = `in vec2 v_uv; uniform sampler2D u_img; uniform vec3 u_tinta; out vec4 o_col; void main() { o_col = vec4(texture(u_img, v_uv).rgb * u_tinta, 0.0); }`;

// l'immagine piccola su cui si disegna un volume, e la sua aggiunta al fondo
// (con l'accumulo, `chiudi` riceve dove sta l'occhio nel riferimento del volume e somma il fotogramma alla storia)
function teloPiccolo(N) {
  const gl = N.gl; let img = null, tel = null, w = 0, h = 0, prgCopia = null; const storia = creaStoria(N);
  return { get w() { return w; }, get h() { return h; }, storia, get immagine() { return img; },
    // lo sfasamento dei passi in questo fotogramma (u_sfasa): [quanto, su che ampiezza del passo]
    // (in moto la storia è corta: lo spostamento resta vicino al mezzo del passo, come senza accumulo — meno grana, un
    // poco di errore del passo —; a camera ferma copre tutto il passo e la media va al conto pieno)
    sfasa(S, u) { const acc = accumuloAttivo(N); gl.uniform2f(u, acc ? sfasatura(S.indice || 0)[0] : 0, acc && !this.inMoto ? 1 : 0.3); },
    apri(S) { const r = Math.max(1, N.vista.riduzione || 2), W = Math.max(8, Math.ceil(S.W / r)), H = Math.max(8, Math.ceil(S.H / r)); if (W !== w || H !== h) { if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } w = W; h = H; img = N.immagine(w, h, 'rgba16f', null); tel = N.telaio(img, null); }
      this.prima = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, tel); gl.viewport(0, 0, w, h); gl.disable(gl.BLEND); },
    // a camera ferma (accumulo.js): quanti passi in questo fotogramma (× `passiFerma` dopo quattro fotogrammi fermi), o null se la
    // storia è già piena e il fotogramma non si calcola (allora `tieni` la rimette sul fondo)
    passi(S, n, rif, mondoFermo = true) { if (!accumuloAttivo(N)) return Math.min(PASSI_MAX, n); const k = storia.ferma(S, rif, mondoFermo); this.inMoto = k === 0; if (k > (N.vista.accumulo.ferma || 64) + 4) return null; return Math.min(PASSI_MAX, k >= 4 ? (N.vista.accumulo.passiFerma || 1) * n : n); },
    tieni(S, tinta = [1, 1, 1]) { const t = storia.tieni(S); this.prima = gl.getParameter(gl.FRAMEBUFFER_BINDING); this.copia(S, t.img, tinta.map((x) => x * t.scala)); },
    chiudi(S, tinta = [1, 1, 1], rif = null) { const da = rif && accumuloAttivo(N) ? storia.risolvi(S, img, w, h, rif) : img; if (!(rif && accumuloAttivo(N))) storia.azzera(); this.copia(S, da, tinta); },
    copia(S, da, tinta) { if (!prgCopia) prgCopia = N.programma(V_Q, F_COPIA);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.prima); gl.viewport(0, 0, S.W, S.H); gl.useProgram(prgCopia.p); N.lega(0, da, prgCopia.u.u_img); gl.uniform3f(prgCopia.u.u_tinta, tinta[0], tinta[1], tinta[2]); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); S.schermo(); gl.disable(gl.BLEND); },
    // PER LE PROVE: il fotogramma di adesso (rgb, distanza), w × h × 4
    leggi() { const px = new Float32Array(w * h * 4), salvata = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, tel); gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, px); gl.bindFramebuffer(gl.FRAMEBUFFER, salvata); return px; },
    libera() { if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } if (prgCopia) gl.deleteProgram(prgCopia.p); storia.libera(); } };
}
function immagine3d(gl, w, h, d, canali, dati, ripetiX) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_3D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  if (canali === 4) gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA16F, w, h, d, 0, gl.RGBA, gl.FLOAT, dati); else gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F, w, h, d, 0, gl.RED, gl.FLOAT, dati);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, ripetiX ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, ripetiX === 'tutti' ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, ripetiX === 'tutti' ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_3D, null); return t;
}
const lega3d = (gl, unita, t, u) => { gl.activeTexture(gl.TEXTURE0 + unita); gl.bindTexture(gl.TEXTURE_3D, t); gl.uniform1i(u, unita); };
// la carta del vuoto della galassia (vedi in cima): dalla griglia (nf × nr × nz, luce rgb e polvere) la tabella nr × nr
// della quota (in Rg) sotto cui, in un intervallo di anelli [i, j], può esserci materia (−1: in nessun punto)
function cartaDelVuoto({ dati, nf, nr, nz }, zmax, soglia) {
  // (la soglia della luce è relativa alla più forte DELLO STESSO ANELLO: il centro è migliaia di volte più chiaro del bordo, e
  // una soglia sulla più forte di tutte toglierebbe il disco esterno; quella della polvere è assoluta, A_V per raggio)
  const lm = new Float64Array(nr); for (let jz = 0; jz < nz; jz++) for (let jr = 0; jr < nr; jr++) { const b = 4 * (jz * nr + jr) * nf; for (let jf = 0; jf < nf; jf++) { const k = b + 4 * jf; lm[jr] = Math.max(lm[jr], dati[k], dati[k + 1], dati[k + 2]); } }
  const eA = soglia, pieno = new Uint8Array(nr * nz);
  for (let jz = 0; jz < nz; jz++) for (let jr = 0; jr < nr; jr++) { const b = 4 * (jz * nr + jr) * nf, eL = soglia * lm[jr]; for (let jf = 0; jf < nf; jf++) { const k = b + 4 * jf; if (dati[k] > eL || dati[k + 1] > eL || dati[k + 2] > eL || dati[k + 3] > eA) { pieno[jz * nr + jr] = 1; break; } } }
  // la quota del centro della cella più in fuori che il campione può ancora sentire (quella dopo una piena)
  const quota = (jz) => { const sz = (2 * (jz + 0.5)) / nz - 1; return zmax * sz * sz; }, zq = new Float32Array(nr).fill(-1);
  for (let jr = 0; jr < nr; jr++) for (let jz = 0; jz < nz; jz++) if (pieno[jz * nr + jr]) { const fuori = (2 * (jz + 0.5)) / nz - 1 >= 0 ? Math.min(nz - 1, jz + 1) : Math.max(0, jz - 1); zq[jr] = Math.max(zq[jr], quota(fuori), quota(jz)); }
  const zd = new Float32Array(nr); for (let jr = 0; jr < nr; jr++) zd[jr] = Math.max(zq[jr], jr > 0 ? zq[jr - 1] : -1, jr < nr - 1 ? zq[jr + 1] : -1); // (allargata di un anello)
  const M = new Float32Array(nr * nr).fill(-1); for (let i = 0; i < nr; i++) { let m = -1; for (let j = i; j < nr; j++) { m = Math.max(m, zd[j]); M[i * nr + j] = m; } }
  let vuote = 0; for (const v of pieno) vuote += 1 - v; return { M, nr, vuote: vuote / pieno.length };
}

// ---------- la galassia: { cosmo, galassia } → { pronto(), disegna(S, occhio (in Rg, nel riferimento della galassia), quadro, giro), stato }
export function creaVolumeGalassia(N, { cosmo, galassia, opzioni = {} } = {}) {
  const gl = N.gl, O = { nf: 160, nr: 96, nz: 48, estinzione: 1, ...opzioni }, telo = teloPiccolo(N), stato = { pronto: false, ms: 0, nebulose: 0, errore: null, meta: null };
  let prg = null, vol = null, senza = null, filo = null, copia = null, occ = null, occChiave = null; const u9 = new Float32Array(9); // (senza: il volume senza nebulose e nubi, per N.vista.splat che le disegna a parte)
  try { filo = new Worker(new URL('./volume.worker.js', import.meta.url), { type: 'module' });
    filo.onmessage = (e) => { const d = e.data; if (d.errore) { stato.errore = d.errore; console.error('il volume della galassia non si è potuto calcolare:', d.errore); return; }
      if (vol && vol !== senza) gl.deleteTexture(vol); vol = immagine3d(gl, d.nf, d.nr, d.nz, 4, d.dati, true); if (!d.nebulose) { if (senza) gl.deleteTexture(senza); senza = vol; } copia = { dati: d.dati, nf: d.nf, nr: d.nr, nz: d.nz }; telo.storia.azzera(); stato.meta = { Rmax: d.Rmax, zmax: d.zmax, raggioM: d.raggioM, luce: d.luce, t: d.t }; stato.pronto = true; stato.ms = d.ms; stato.nebulose = d.nebulose; N.cambia(); };
    filo.onerror = (e) => { stato.errore = e.message; };
    filo.postMessage({ tipo: 'galassia', n: 1, cosmo, galassia, t: N.tempo.t, nf: O.nf, nr: O.nr, nz: O.nz });
  } catch (e) { stato.errore = String(e); }
  return { stato, telo, pronto: () => stato.pronto, dati: () => copia, // (dati: la griglia sulla CPU, per gli splat di splat.js che stanno dentro il volume)
    // quanta luce passa da un punto all'altro della galassia (m, nel suo riferimento; `giro`: l'angolo dei bracci): la
    // stessa polvere del volume, sommata lungo il segmento (24 tratti, la cella più vicina) → [rosso, verde, blu]
    trasparenza(a, b, giro, out = [1, 1, 1]) {
      if (!copia) { out[0] = out[1] = out[2] = 1; return out; } const m = stato.meta, Rg = m.raggioM, { dati, nf, nr, nz } = copia, N = 24, dx = (b[0] - a[0]) / Rg, dy = (b[1] - a[1]) / Rg, dz = (b[2] - a[2]) / Rg, ds = Math.hypot(dx, dy, dz) / N; let av = 0;
      for (let k = 0; k < N; k++) { const f = (k + 0.5) / N, x = a[0] / Rg + dx * f, y = a[1] / Rg + dy * f, z = a[2] / Rg + dz * f, R = Math.hypot(x, y); if (R >= m.Rmax || Math.abs(z) >= m.zmax) continue;
        let fi = (Math.atan2(y, x) - giro) / (2 * Math.PI); fi -= Math.floor(fi); const jf = Math.min(nf - 1, Math.floor(fi * nf)), jr = Math.min(nr - 1, Math.floor((R / m.Rmax) * nr)), sz = Math.sign(z) * Math.sqrt(Math.abs(z) / m.zmax), jz = Math.min(nz - 1, Math.floor(((sz + 1) / 2) * nz)); av += dati[4 * ((jz * nr + jr) * nf + jf) + 3] * ds; }
      const tau = 0.921 * av * O.estinzione; out[0] = Math.exp(-0.79 * tau); out[1] = Math.exp(-tau); out[2] = Math.exp(-1.31 * tau); return out; },
    // occhio: [x, y, z] nel riferimento della galassia (m); quadro: i suoi assi nel mondo (3×3 per righe); giro: di quanto sono girati i bracci (rad)
    disegna(S, occhio, quadro, giro, frazione = 1) {
      if (!vol) return; if (!prg) prg = N.programma(V_Q, F_GALASSIA); const u = prg.u, m = stato.meta, Rg = m.raggioM;
      // la carta del vuoto: rifatta quando cambiano i dati o la soglia
      const soglia = N.vista.vuoto || 0, chiave = soglia > 0 ? [copia, soglia] : null;
      if (chiave && !(occChiave && occChiave[0] === copia && occChiave[1] === soglia)) { const c = cartaDelVuoto(copia, m.zmax, soglia); if (occ) gl.deleteTexture(occ); occ = N.immagine(c.nr, c.nr, 'rgba32f', (() => { const q = new Float32Array(4 * c.nr * c.nr); for (let i = 0; i < c.M.length; i++) q[4 * i] = c.M[i]; return q; })(), { filtro: gl.NEAREST }); occChiave = chiave; stato.vuote = c.vuote; }
      // per la storia: l'occhio e gli assi nel riferimento che gira coi bracci (lì la griglia sta ferma), in Rg
      const A = S.assi, cg = Math.cos(giro), sg = Math.sin(giro), rz = [cg, sg, 0, -sg, cg, 0, 0, 0, 1], M = new Array(9);
      for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) M[3 * r + k] = quadro[r] * A[k] + quadro[3 + r] * A[3 + k] + quadro[6 + r] * A[6 + k];
      const rif = { occhio: N.V.mv(rz, [occhio[0] / Rg, occhio[1] / Rg, occhio[2] / Rg]), raggi: N.V.mm(rz, M) }, np = telo.passi(S, (N.vista.passi && N.vista.passi.galassia) || 64, rif);
      if (np === null) return telo.tieni(S);
      telo.apri(S); gl.useProgram(prg.p); lega3d(gl, 0, N.vista.splat && senza ? senza : vol, u.u_vol); gl.uniform3f(u.u_occhio, occhio[0] / Rg, occhio[1] / Rg, occhio[2] / Rg);
      if (chiave && occ) { N.lega(1, occ, u.u_occ); gl.uniform2f(u.u_occN, copia.nr, 1); } else { N.lega(1, occ || (occ = N.immagine(1, 1, 'rgba32f', new Float32Array(4), { filtro: gl.NEAREST })), u.u_occ); gl.uniform2f(u.u_occN, 1, 0); } telo.sfasa(S, u.u_sfasa);
      // dagli assi dell'occhio a quelli della galassia: quadroᵀ·assi (per colonne, come vuole WebGL)
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = quadro[r] * A[c] + quadro[3 + r] * A[3 + c] + quadro[6 + r] * A[6 + c];
      gl.uniformMatrix3fv(u.u_raggi, false, u9); gl.uniform4f(u.u_cam, S.tanX, S.tanY, np, giro);
      gl.uniform4f(u.u_k, (m.luce * frazione) / (4 * Rg * Rg * S.E0), m.Rmax, m.zmax, O.estinzione); S.schermo(); telo.chiudi(S, [1, 1, 1], rif);
    },
    libera() { if (filo) filo.terminate(); if (occ) gl.deleteTexture(occ); if (vol) gl.deleteTexture(vol); if (senza && senza !== vol) gl.deleteTexture(senza); telo.libera(); if (prg) gl.deleteProgram(prg.p); } };
}

// ---------- la ragnatela: { cosmo, luce (W di tutta la nebbia), tinta, toroM } → { aggiorna(occhioCom, D), disegna(S, …), stato }
export function creaVolumeRete(N, { cosmo, luce, tinta = [1, 0.9, 0.8], toroM, opzioni = {} } = {}) {
  const gl = N.gl, O = { celle: 96, griglia: 128, celleFine: 64, grigliaFine: 96, latoFine: 0.2, kmaxFine: 72, media: 0.05, ...opzioni }, telo = teloPiccolo(N), stato = { pronto: false, fine: false, ms: 0, msFine: 0, errore: null, D: 1 };
  let prg = null, grossa = null, fine = null, fineReg = null, filo = null, inCorso = 0, n = 0, chiesta = null, vuota = null; const u9 = new Float32Array(9), tab = new Float32Array(NT);
  const chiedi = (m) => { inCorso++; filo.postMessage({ tipo: 'ragnatela', n: ++n, cosmo, t: N.tempo.t, ...m }); };
  try { filo = new Worker(new URL('./volume.worker.js', import.meta.url), { type: 'module' });
    filo.onmessage = (e) => { const d = e.data; inCorso--; if (d.errore) { stato.errore = d.errore; console.error('il volume della ragnatela non si è potuto calcolare:', d.errore); return; }
      if (d.periodica) { if (grossa) gl.deleteTexture(grossa); grossa = immagine3d(gl, d.griglia, d.griglia, d.griglia, 1, d.dati, 'tutti'); stato.pronto = true; stato.ms = d.ms; stato.D = d.D; stato.legge = d.legge; }
      else { if (fine) gl.deleteTexture(fine); fine = immagine3d(gl, d.griglia, d.griglia, d.griglia, 1, d.dati, false); fineReg = { centro: d.origine.map((v) => (v + d.latoM / 2) / toroM), lato: d.latoM / toroM, D: d.D }; stato.fine = true; stato.msFine = d.ms; }
      telo.storia.azzera(); N.cambia(); };
    filo.onerror = (e) => { stato.errore = e.message; };
  } catch (e) { stato.errore = String(e); }
  let Dchiesta = NaN;
  return { stato, telo, pronto: () => stato.pronto, opzioni: O,
    // occhio: comovente (m); D: la crescita di adesso; cono(χ) → (a_e/a_o)²; chiMax: fin dove si cammina (m comoventi)
    aggiorna(S, occhio, a, D, cono, chiMax) {
      if (!filo || stato.errore) return 0; this._occhio = occhio; this._a = a; this._chiMax = chiMax; for (let k = 0; k < NT; k++) tab[k] = cono((k * chiMax) / (NT - 1));
      // la grana grossa si rifà quando la crescita è cambiata del 2% (il tempo corre); la fine quando ci si è spostati di un quinto del suo lato
      if (!inCorso && !(Math.abs(D - Dchiesta) < 0.02 * D)) { Dchiesta = D; chiedi({ regione: null, celle: O.celle, griglia: O.griglia, kmax: 0, D }); chiesta = null; fineReg = null; }
      else if (!inCorso && stato.pronto && O.celleFine > 0) { const lato = O.latoFine * toroM; let lontano = Infinity; if (chiesta) { lontano = 0; for (let k = 0; k < 3; k++) { let x = occhio[k] - chiesta[k]; x -= Math.round(x / toroM) * toroM; lontano = Math.max(lontano, Math.abs(x)); } }
        if (lontano > lato / 5) { chiesta = occhio.slice(); chiedi({ regione: { centro: occhio.slice(), lato }, celle: O.celleFine, griglia: O.grigliaFine, kmax: O.kmaxFine, D }); } }
      // la luce che l'occhio chiede: la nebbia in media vale `media` (irradianza media = luce/volume × strada)
      return ((luce / (toroM * a) ** 3) * chiMax * a) / (4 * O.media);
    },
    disegna(S, forza = 1) {
      if (!grossa || !this._occhio) return; if (!prg) prg = N.programma(V_Q, F_RETE); if (!vuota) vuota = immagine3d(gl, 1, 1, 1, 1, new Float32Array([1]), false); const u = prg.u, oc = this._occhio, a = this._a;
      const rif = { occhio: [oc[0] / toroM, oc[1] / toroM, oc[2] / toroM], raggi: S.assi }, np = telo.passi(S, (N.vista.passi && N.vista.passi.ragnatela) || 56, rif, Math.abs(S.dt) < 3.15e9); // (il mondo è fermo se in un fotogramma passano meno di cent'anni)
      if (np === null) return telo.tieni(S, tinta);
      telo.apri(S); gl.useProgram(prg.p); lega3d(gl, 0, grossa, u.u_grossa); lega3d(gl, 1, fine && fineReg ? fine : vuota, u.u_fine); gl.uniform3f(u.u_occhio, oc[0] / toroM, oc[1] / toroM, oc[2] / toroM);
      const A = S.assi; for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = A[3 * r + c]; gl.uniformMatrix3fv(u.u_raggi, false, u9); telo.sfasa(S, u.u_sfasa);
      gl.uniform4f(u.u_cam, S.tanX, S.tanY, np, this._chiMax / toroM);
      if (fine && fineReg) gl.uniform4f(u.u_fine0, fineReg.centro[0], fineReg.centro[1], fineReg.centro[2], fineReg.lato); else gl.uniform4f(u.u_fine0, 0, 0, 0, 0);
      // π·I/E0 con I = ∫ j ds/(4π), j = (luce/volume vero)·ρ/ρ̄, ds = lato vero × passo: (luce/(L·a)³)·(L·a)/(4·E0)
      gl.uniform4f(u.u_k, ((luce * forza) / (toroM * a) ** 2) / (4 * S.E0), 0, 0, 0); gl.uniform1fv(u.u_tab, tab); S.schermo(); telo.chiudi(S, tinta, rif);
    },
    libera() { if (filo) filo.terminate(); for (const t of [grossa, fine, vuota]) if (t) gl.deleteTexture(t); telo.libera(); if (prg) gl.deleteProgram(prg.p); } };
}
