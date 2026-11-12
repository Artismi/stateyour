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
// QUALITÀ (N.vista): `passi.galassia`, `passi.ragnatela` (quanti campioni per raggio), `riduzione` (il volume si
// disegna su un'immagine più piccola di tanto per lato e si aggiunge al fondo). Sono il costo: sono regolabili.
const PASSI_MAX = 160;
const V_Q = `out vec2 v_uv; void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
// (un numero a caso per punto dello schermo, senza trama: sposta di poco l'inizio dei passi; quello «interlacciato» di prima, dove contavano pochi passi, lasciava un retino)
const GLSL_CASO = `float caso(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }`;
const F_GALASSIA = `
precision highp sampler3D;
in vec2 v_uv; out vec4 o_col;
uniform sampler3D u_vol;
uniform vec3 u_occhio;     // l'occhio nel riferimento della galassia, in raggi della galassia
uniform mat3 u_raggi;      // dagli assi dell'occhio a quelli della galassia
uniform vec4 u_cam;        // tangenti di metà campo; quanti passi; l'angolo di cui i bracci sono girati da quando si è fatta la griglia
uniform vec4 u_k;          // L/(4·Rg²·E0) (da somma lungo il raggio a «fogli bianchi»); Rmax; zmax; estinzione (1: vera)
${GLSL_CASO}
void main() {
  vec3 d = normalize(u_raggi * vec3((v_uv * 2.0 - 1.0) * u_cam.xy, -1.0)), o = u_occhio; float Rm = u_k.y, zm = u_k.z;
  // dove il raggio sta dentro il cilindro (raggio Rmax, quota ±zmax)
  float t0 = 0.0, t1 = 1e9;
  if (abs(d.z) > 1e-6) { float a = (-zm - o.z) / d.z, b = (zm - o.z) / d.z; t0 = max(t0, min(a, b)); t1 = min(t1, max(a, b)); } else if (abs(o.z) > zm) { o_col = vec4(0.0); return; }
  float A = dot(d.xy, d.xy), B = dot(o.xy, d.xy), Cc = dot(o.xy, o.xy) - Rm * Rm;
  if (A > 1e-9) { float disc = B * B - A * Cc; if (disc <= 0.0) { o_col = vec4(0.0); return; } float s = sqrt(disc); t0 = max(t0, (-B - s) / A); t1 = min(t1, (-B + s) / A); } else if (Cc > 0.0) { o_col = vec4(0.0); return; }
  if (t1 <= t0) { o_col = vec4(0.0); return; }
  int n = int(u_cam.z); float h = 0.03 * zm, z0 = o.z + d.z * t0, z1 = o.z + d.z * t1, u0 = asinh(z0 / h), u1 = asinh(z1 / h), g = caso(gl_FragCoord.xy);
  bool piano = abs(d.z) < 0.04 || abs(u1 - u0) < 0.5; // il raggio corre (quasi) nel piano: passi fitti vicino all'inizio
  vec3 C = vec3(0.0), T = vec3(1.0); float prima = t0;
  for (int i = 0; i < ${PASSI_MAX}; i++) { if (i >= n) break;
    float f = (float(i) + 1.0) / float(n), t = piano ? t0 + (t1 - t0) * f * f : (h * sinh(mix(u0, u1, f)) - o.z) / d.z, ds = t - prima, tm = prima + ds * (0.35 + 0.3 * g); prima = t;
    vec3 p = o + d * tm; float R = length(p.xy), fi = atan(p.y, p.x) - u_cam.w;
    vec4 c = texture(u_vol, vec3(fi * 0.15915494, R / Rm, 0.5 + 0.5 * sign(p.z) * sqrt(min(1.0, abs(p.z) / zm))));
    vec3 tau = c.a * ds * 0.921 * u_k.w * vec3(0.79, 1.0, 1.31), via = exp(-tau);
    C += T * c.rgb * ds * mix(vec3(1.0), (1.0 - via) / max(tau, vec3(1e-5)), step(1e-4, tau)); T *= via;
    if (max(T.r, max(T.g, T.b)) < 0.003) break; }
  o_col = vec4(C * u_k.x, T.g);
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
  vec3 d = normalize(u_raggi * vec3((v_uv * 2.0 - 1.0) * u_cam.xy, -1.0)); int n = int(u_cam.z); float lungo = u_cam.w, g = caso(gl_FragCoord.xy), somma = 0.0, prima = 0.0;
  for (int i = 0; i < ${PASSI_MAX}; i++) { if (i >= n) break;
    float f = (float(i) + 1.0) / float(n), t = lungo * f * f, ds = t - prima, tm = prima + ds * (0.35 + 0.3 * g); prima = t; // passi fitti vicino, radi lontano
    vec3 p = u_occhio + d * tm;
    vec3 rel = fract(p - u_fine0.xyz + 0.5) - 0.5; // (rispetto al centro della regione fine, nell'immagine più vicina del toro)
    float rho; if (u_fine0.w > 0.0 && max(abs(rel.x), max(abs(rel.y), abs(rel.z))) < 0.5 * u_fine0.w * 0.94) rho = texture(u_fine, rel / u_fine0.w + 0.5).r; else rho = texture(u_grossa, fract(p)).r;
    float x = clamp(tm / lungo, 0.0, 1.0) * ${NT - 1}.0; int k = int(min(floor(x), ${NT - 2}.0));
    somma += rho * ds * mix(u_tab[k], u_tab[k + 1], x - float(k)); }
  o_col = vec4(vec3(somma * u_k.x), 1.0);
}`;
const F_COPIA = `in vec2 v_uv; uniform sampler2D u_img; uniform vec3 u_tinta; out vec4 o_col; void main() { o_col = vec4(texture(u_img, v_uv).rgb * u_tinta, 0.0); }`;

// l'immagine piccola su cui si disegna un volume, e la sua aggiunta al fondo
function teloPiccolo(N) {
  const gl = N.gl; let img = null, tel = null, w = 0, h = 0, prgCopia = null;
  return { get w() { return w; }, get h() { return h; },
    apri(S) { const r = Math.max(1, N.vista.riduzione || 2), W = Math.max(8, Math.ceil(S.W / r)), H = Math.max(8, Math.ceil(S.H / r)); if (W !== w || H !== h) { if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } w = W; h = H; img = N.immagine(w, h, 'rgba16f', null); tel = N.telaio(img, null); }
      this.prima = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, tel); gl.viewport(0, 0, w, h); gl.disable(gl.BLEND); },
    chiudi(S, tinta = [1, 1, 1]) { if (!prgCopia) prgCopia = N.programma(V_Q, F_COPIA); gl.bindFramebuffer(gl.FRAMEBUFFER, this.prima); gl.viewport(0, 0, S.W, S.H); gl.useProgram(prgCopia.p); N.lega(0, img, prgCopia.u.u_img); gl.uniform3f(prgCopia.u.u_tinta, tinta[0], tinta[1], tinta[2]); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); S.schermo(); gl.disable(gl.BLEND); },
    libera() { if (img) { gl.deleteTexture(img); gl.deleteFramebuffer(tel); } if (prgCopia) gl.deleteProgram(prgCopia.p); } };
}
function immagine3d(gl, w, h, d, canali, dati, ripetiX) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_3D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  if (canali === 4) gl.texImage3D(gl.TEXTURE_3D, 0, gl.RGBA16F, w, h, d, 0, gl.RGBA, gl.FLOAT, dati); else gl.texImage3D(gl.TEXTURE_3D, 0, gl.R16F, w, h, d, 0, gl.RED, gl.FLOAT, dati);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_S, ripetiX ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_T, ripetiX === 'tutti' ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_3D, gl.TEXTURE_WRAP_R, ripetiX === 'tutti' ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_3D, null); return t;
}
const lega3d = (gl, unita, t, u) => { gl.activeTexture(gl.TEXTURE0 + unita); gl.bindTexture(gl.TEXTURE_3D, t); gl.uniform1i(u, unita); };

// ---------- la galassia: { cosmo, galassia } → { pronto(), disegna(S, occhio (in Rg, nel riferimento della galassia), quadro, giro), stato }
export function creaVolumeGalassia(N, { cosmo, galassia, opzioni = {} } = {}) {
  const gl = N.gl, O = { nf: 160, nr: 96, nz: 48, estinzione: 1, ...opzioni }, telo = teloPiccolo(N), stato = { pronto: false, ms: 0, nebulose: 0, errore: null, meta: null };
  let prg = null, vol = null, senza = null, filo = null, copia = null; const u9 = new Float32Array(9); // (senza: il volume senza nebulose e nubi, per N.vista.splat che le disegna a parte)
  try { filo = new Worker(new URL('./volume.worker.js', import.meta.url), { type: 'module' });
    filo.onmessage = (e) => { const d = e.data; if (d.errore) { stato.errore = d.errore; console.error('il volume della galassia non si è potuto calcolare:', d.errore); return; }
      if (vol && vol !== senza) gl.deleteTexture(vol); vol = immagine3d(gl, d.nf, d.nr, d.nz, 4, d.dati, true); if (!d.nebulose) { if (senza) gl.deleteTexture(senza); senza = vol; } copia = { dati: d.dati, nf: d.nf, nr: d.nr, nz: d.nz }; stato.meta = { Rmax: d.Rmax, zmax: d.zmax, raggioM: d.raggioM, luce: d.luce, t: d.t }; stato.pronto = true; stato.ms = d.ms; stato.nebulose = d.nebulose; N.cambia(); };
    filo.onerror = (e) => { stato.errore = e.message; };
    filo.postMessage({ tipo: 'galassia', n: 1, cosmo, galassia, t: N.tempo.t, nf: O.nf, nr: O.nr, nz: O.nz });
  } catch (e) { stato.errore = String(e); }
  return { stato, pronto: () => stato.pronto, dati: () => copia, // (dati: la griglia sulla CPU, per gli splat di splat.js che stanno dentro il volume)
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
      telo.apri(S); gl.useProgram(prg.p); lega3d(gl, 0, N.vista.splat && senza ? senza : vol, u.u_vol); gl.uniform3f(u.u_occhio, occhio[0] / Rg, occhio[1] / Rg, occhio[2] / Rg);
      // dagli assi dell'occhio a quelli della galassia: quadroᵀ·assi (per colonne, come vuole WebGL)
      const A = S.assi; for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = quadro[r] * A[c] + quadro[3 + r] * A[3 + c] + quadro[6 + r] * A[6 + c];
      gl.uniformMatrix3fv(u.u_raggi, false, u9); gl.uniform4f(u.u_cam, S.tanX, S.tanY, Math.min(PASSI_MAX, (N.vista.passi && N.vista.passi.galassia) || 64), giro);
      gl.uniform4f(u.u_k, (m.luce * frazione) / (4 * Rg * Rg * S.E0), m.Rmax, m.zmax, O.estinzione); S.schermo(); telo.chiudi(S);
    },
    libera() { if (filo) filo.terminate(); if (vol) gl.deleteTexture(vol); if (senza && senza !== vol) gl.deleteTexture(senza); telo.libera(); if (prg) gl.deleteProgram(prg.p); } };
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
      N.cambia(); };
    filo.onerror = (e) => { stato.errore = e.message; };
  } catch (e) { stato.errore = String(e); }
  let Dchiesta = NaN;
  return { stato, pronto: () => stato.pronto, opzioni: O,
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
      telo.apri(S); gl.useProgram(prg.p); lega3d(gl, 0, grossa, u.u_grossa); lega3d(gl, 1, fine && fineReg ? fine : vuota, u.u_fine); gl.uniform3f(u.u_occhio, oc[0] / toroM, oc[1] / toroM, oc[2] / toroM);
      const A = S.assi; for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = A[3 * r + c]; gl.uniformMatrix3fv(u.u_raggi, false, u9);
      gl.uniform4f(u.u_cam, S.tanX, S.tanY, Math.min(PASSI_MAX, (N.vista.passi && N.vista.passi.ragnatela) || 56), this._chiMax / toroM);
      if (fine && fineReg) gl.uniform4f(u.u_fine0, fineReg.centro[0], fineReg.centro[1], fineReg.centro[2], fineReg.lato); else gl.uniform4f(u.u_fine0, 0, 0, 0, 0);
      // π·I/E0 con I = ∫ j ds/(4π), j = (luce/volume vero)·ρ/ρ̄, ds = lato vero × passo: (luce/(L·a)³)·(L·a)/(4·E0)
      gl.uniform4f(u.u_k, ((luce * forza) / (toroM * a) ** 2) / (4 * S.E0), 0, 0, 0); gl.uniform1fv(u.u_tab, tab); S.schermo(); telo.chiudi(S, tinta);
    },
    libera() { if (filo) filo.terminate(); for (const t of [grossa, fine, vuota]) if (t) gl.deleteTexture(t); telo.libera(); if (prg) gl.deleteProgram(prg.p); } };
}
