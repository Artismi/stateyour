// nucleo.js — IL MOTORE 3D DEL MONDO: il nucleo che tutti i livelli usano (pianeta, sistema, galassia, cosmo).
//
// L'esplorazione non è una mappa vista da sopra: è uno spazio in cui ci si muove. Qui c'è ciò che serve a qualunque
// scala, e niente che appartenga a un livello solo. WebGL2 scritto a mano, nessuna libreria, nessuno stato globale.
//
// ───────────────────────────── LE IDEE ─────────────────────────────
//  · I CORPI e i loro RIFERIMENTI. Un corpo è { nome, genitore, raggio, posizione(t, out), assetto(t, out) }:
//    `posizione` dà in METRI il vettore dal centro del genitore al suo centro, negli assi inerziali (gli stessi per
//    tutti: non ruotano); `assetto` dà la matrice 3×3 che porta dagli assi del corpo (che gira) a quelli inerziali.
//    Tutto in doppia precisione sulla CPU. La camera è ATTACCATA a un corpo: la sua posizione è riferita a lui, e ne
//    eredita il moto (l'orbita sempre; la rotazione quando è «solidale», cioè vicina al suolo).
//  · L'ORIGINE MOBILE. Alla scheda grafica non arrivano mai coordinate assolute: di ogni cosa si calcola in doppia
//    precisione il vettore occhio → cosa (risalendo l'albero dei corpi fino all'antenato comune), e solo quello diventa
//    un numero a 32 bit. Così un sasso a due metri e una stella a cento miliardi di chilometri stanno nella stessa scena.
//  · LA PROFONDITÀ LOGARITMICA. Il frammento scrive log₂(1 + distanza): la stessa precisione relativa (2 parti su un
//    milione) a un metro e a un miliardo di chilometri; nessun piano vicino o lontano da regolare, nessuno sfarfallio.
//    Chi disegna usa i due pezzi GLSL_PROFONDITA_V / GLSL_PROFONDITA_F.
//  · IL TEMPO è una variabile del mondo: `tempo.t` in secondi veri dell'universo, `tempo.velocita` secondi del mondo
//    per secondo di chi guarda (1, un giorno, un anno…), `tempo.pausa`. Tutto ciò che si muove lo legge da lì.
//  · LA LUCE. Le luminanze sono in unità in cui 1 è un foglio bianco opaco illuminato in pieno dalla stella del corpo a
//    cui si è attaccati; l'immagine si disegna in virgola mobile (una stella vale decine di migliaia, la notte millesimi)
//    e alla fine l'ESPOSIZIONE e una curva di tonalità la portano sullo schermo. L'esposizione segue da sé la luce che
//    c'è (di notte l'occhio si apre), o la si fissa.
//  · GLI STRATI. Chi disegna si aggiunge come strato: { nome, aggiorna(S), disegna(S, passata), dopo(S, da, a), sopra(S),
//    libera() }, tutti facoltativi. Le passate: 'fondo' (il cielo lontano, senza profondità), 'solido' (ciò che copre),
//    'velato' (ciò che è trasparente, mescolato sopra); poi `dopo` può riscrivere l'immagine intera (l'aria: legge
//    colore e profondità di ciò che c'è dietro); infine la tonalità, e `sopra` (scritte, misure).
//
// ───────────────────────────── L'USO ─────────────────────────────
//   const N = creaNucleo(tela, { alCambio });
//   const sole = N.corpo({ nome: 'stella', raggio, posizione: (t, o) => …, luce: { colore: [r, g, b] } });
//   const terra = N.corpo({ nome, genitore: sole, raggio, posizione, assetto, quota: (dir) => raggio del suolo lungo dir,
//                           colpisci: (o, d) => distanza del suolo lungo il raggio,     // (tutto negli assi del corpo)
//                           verticale: (p) => versore, lonLat: (p) => [lon, lat], punto: (lon, lat, quota) => p });  // se è schiacciato
//   N.aggiungi(strato);  N.attacca(terra, { distanza: 3 * raggio });  N.avvia();
//   N.tempo.velocita = 86400;                     // un giorno al secondo
// Lo stato S che ogni strato riceve: { gl, t, dt, W, H, proj, vista (mondo → occhio, 3×3), fc (per la profondità),
//   tanX, tanY, fuoco (pixel), camera, versoCorpo(corpo, out) (occhio → centro, metri, doppia precisione),
//   assetto(corpo) (3×3), stella (il corpo che illumina), versoStella (unitario), esposizione, quota (dal suolo) }.

// ---------- piccola algebra, in doppia precisione (vettori [x, y, z], matrici 3×3 per righe)
export const V = {
  somma: (a, b, o = [0, 0, 0]) => { o[0] = a[0] + b[0]; o[1] = a[1] + b[1]; o[2] = a[2] + b[2]; return o; },
  meno: (a, b, o = [0, 0, 0]) => { o[0] = a[0] - b[0]; o[1] = a[1] - b[1]; o[2] = a[2] - b[2]; return o; },
  per: (a, k, o = [0, 0, 0]) => { o[0] = a[0] * k; o[1] = a[1] * k; o[2] = a[2] * k; return o; },
  scal: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  vett: (a, b, o = [0, 0, 0]) => { const x = a[1] * b[2] - a[2] * b[1], y = a[2] * b[0] - a[0] * b[2], z = a[0] * b[1] - a[1] * b[0]; o[0] = x; o[1] = y; o[2] = z; return o; },
  lungo: (a) => Math.hypot(a[0], a[1], a[2]),
  norma: (a, o = [0, 0, 0]) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; o[0] = a[0] / l; o[1] = a[1] / l; o[2] = a[2] / l; return o; },
  // matrice · vettore, trasposta · vettore, matrice · matrice
  mv: (m, a, o = [0, 0, 0]) => { const x = m[0] * a[0] + m[1] * a[1] + m[2] * a[2], y = m[3] * a[0] + m[4] * a[1] + m[5] * a[2], z = m[6] * a[0] + m[7] * a[1] + m[8] * a[2]; o[0] = x; o[1] = y; o[2] = z; return o; },
  tv: (m, a, o = [0, 0, 0]) => { const x = m[0] * a[0] + m[3] * a[1] + m[6] * a[2], y = m[1] * a[0] + m[4] * a[1] + m[7] * a[2], z = m[2] * a[0] + m[5] * a[1] + m[8] * a[2]; o[0] = x; o[1] = y; o[2] = z; return o; },
  mm: (a, b) => { const o = new Array(9); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o[3 * i + j] = a[3 * i] * b[j] + a[3 * i + 1] * b[3 + j] + a[3 * i + 2] * b[6 + j]; return o; },
  trasposta: (m) => [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]],
  identita: () => [1, 0, 0, 0, 1, 0, 0, 0, 1],
  // la rotazione di un angolo attorno a un asse unitario (formula di Rodrigues)
  giro: (asse, ang) => { const [x, y, z] = asse, c = Math.cos(ang), s = Math.sin(ang), k = 1 - c; return [c + x * x * k, x * y * k - z * s, x * z * k + y * s, y * x * k + z * s, c + y * y * k, y * z * k - x * s, z * x * k - y * s, z * y * k + x * s, c + z * z * k]; },
  // la rotazione più breve che porta il versore a sul versore b
  porta: (a, b) => { const asse = V.vett(a, b), s = V.lungo(asse), c = V.scal(a, b); if (s < 1e-12) return V.identita(); return V.giro(V.per(asse, 1 / s), Math.atan2(s, c)); },
};

// ---------- i pezzi di GLSL per la profondità logaritmica (dopo aver scritto gl_Position; u_fc = 2 / log₂(lontano + 1))
export const GLSL_PROFONDITA_V = `
  v_w = 1.0 + gl_Position.w;
  gl_Position.z = (log2(max(1e-6, v_w)) * u_fc - 1.0) * gl_Position.w;`;
export const GLSL_PROFONDITA_F = `
  gl_FragDepth = log2(max(1e-6, v_w)) * u_fc * 0.5;`;
// (dalla profondità letta nell'immagine alla distanza lungo l'asse dell'occhio: w = 2^(2·d / u_fc) − 1)

// il colore di un corpo nero alla temperatura T (K), in rosso-verde-blu lineari, con il massimo a 1
// (approssimazione del luogo di Planck di Krystek 1985 per la cromaticità, poi la matrice sRGB)
export function coloreCorpoNero(T) {
  const t = Math.max(1000, Math.min(40000, T)), u = (0.860117757 + 1.54118254e-4 * t + 1.28641212e-7 * t * t) / (1 + 8.42420235e-4 * t + 7.08145163e-7 * t * t), v = (0.317398726 + 4.22806245e-5 * t + 4.20481691e-8 * t * t) / (1 - 2.89741816e-5 * t + 1.61456053e-7 * t * t);
  const x = (3 * u) / (2 * u - 8 * v + 4), y = (2 * v) / (2 * u - 8 * v + 4), X = x / y, Z = (1 - x - y) / y;
  const c = [3.2406 * X - 1.5372 - 0.4986 * Z, -0.9689 * X + 1.8758 + 0.0415 * Z, 0.0557 * X - 0.204 + 1.057 * Z].map((q) => Math.max(0, q)), m = Math.max(...c) || 1;
  return c.map((q) => q / m);
}

export function creaNucleo(tela, opzioni = {}) {
  const O = {
    fov: 0.75, // l'angolo di campo verticale (radianti)
    densita: 0, // pixel veri per pixel della pagina (0: quella dello schermo, al più 2)
    esposizione: 0, // 0: si regola da sé sulla luce che c'è; altrimenti il fattore fisso
    quotaSolidale: 1.0, // sotto questa quota (in raggi del corpo) la camera gira col corpo; sopra, lo vede girare
    quotaMinima: 1.8, // metri: la camera non scende sotto questa altezza dal suolo
    interazione: true, alCambio: null, alFuori: null, distanzaFuori: 40, // oltre tanti raggi dal corpo si chiama alFuori
    ...opzioni,
  };
  const gl = tela.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!O.conserva });
  if (!gl) throw new Error('mondo3d: questo programma non riesce a creare un contesto WebGL2');
  const conVirgola = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
  gl.getExtension('OES_texture_float_linear');

  // ---------- attrezzi per chi disegna
  function programma(v, f, posti = {}) {
    const fai = (tipo, src) => { const s = gl.createShader(tipo); gl.shaderSource(s, '#version 300 es\nprecision highp float;\nprecision highp sampler2D;\n' + src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('mondo3d: ' + gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((r, i) => `${i + 1}: ${r}`).join('\n')); return s; };
    const p = gl.createProgram(), sv = fai(gl.VERTEX_SHADER, v), sf = fai(gl.FRAGMENT_SHADER, f); gl.attachShader(p, sv); gl.attachShader(p, sf);
    for (const [nome, i] of Object.entries(posti)) gl.bindAttribLocation(p, i, nome);
    gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('mondo3d: ' + gl.getProgramInfoLog(p));
    gl.deleteShader(sv); gl.deleteShader(sf);
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const nome = gl.getActiveUniform(p, i).name.replace(/\[0\]$/, ''); u[nome] = gl.getUniformLocation(p, nome); }
    return { p, u };
  }
  // un'immagine: formato 'rgba8' | 'rgba16f' | 'rg32f' | 'rg16f' | 'r8' | 'profondita'
  const FORMATI = { rgba8: [gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE], rgba16f: [gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT], rgba16fDaFloat: [gl.RGBA16F, gl.RGBA, gl.FLOAT], rg32f: [gl.RG32F, gl.RG, gl.FLOAT], rg16f: [gl.RG16F, gl.RG, gl.FLOAT], r8: [gl.R8, gl.RED, gl.UNSIGNED_BYTE], profondita: [gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT] };
  function immagine(w, h, formato = 'rgba8', dati = null, { filtro = gl.LINEAR, ripeti = false } = {}) {
    const t = gl.createTexture(), [interno, forma, tipo] = FORMATI[formato]; gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, interno, w, h, 0, forma, tipo, dati);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filtro); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filtro);
    const bordo = ripeti === true ? gl.REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, ripeti === 'x' ? gl.REPEAT : bordo); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, bordo);
    return t;
  }
  const telaio = (colore, profondita) => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colore, 0); if (profondita) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, profondita, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return f; };
  const lega = (unita, t, u) => { gl.activeTexture(gl.TEXTURE0 + unita); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u, unita); };
  // un triangolo che copre lo schermo (per le passate sull'immagine intera): v_uv da 0 a 1
  const V_SCHERMO = `out vec2 v_uv; void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const vuoto = gl.createVertexArray();
  const schermo = () => { gl.bindVertexArray(vuoto); gl.drawArrays(gl.TRIANGLES, 0, 3); };

  // ---------- i corpi
  const corpi = [];
  function corpo(def) {
    const c = { nome: '', genitore: null, raggio: 1, posizione: null, assetto: null, quota: null, colpisci: null, verticale: null, luce: null, ...def, profondita: 0 };
    for (let g = c.genitore; g; g = g.genitore) c.profondita++;
    corpi.push(c); return c;
  }
  const _p = [0, 0, 0];
  // il vettore dal centro di a al centro di b (assi inerziali), risalendo fino all'antenato comune
  function tra(a, b, t, out = [0, 0, 0]) {
    out[0] = out[1] = out[2] = 0; let x = a, y = b;
    while (x !== y) {
      if (x && (!y || x.profondita >= y.profondita)) { if (x.posizione) { x.posizione(t, _p); out[0] -= _p[0]; out[1] -= _p[1]; out[2] -= _p[2]; } x = x.genitore; }
      else { if (y.posizione) { y.posizione(t, _p); out[0] += _p[0]; out[1] += _p[1]; out[2] += _p[2]; } y = y.genitore; }
    }
    return out;
  }

  // ---------- il tempo del mondo
  const tempo = { t: O.t0 || 0, velocita: 1, pausa: false };

  // ---------- la camera: attaccata a un corpo; pos e assi (colonne: destra, su, dietro) nel riferimento del corpo
  // (i suoi assi che girano se «solidale», altrimenti gli assi inerziali centrati su di lui)
  const cam = { corpo: null, solidale: false, pos: [0, 0, 1], assi: V.identita(), fov: O.fov };
  const assettoDi = (c, t) => (c && c.assetto ? c.assetto(t, new Array(9)) : V.identita());
  const quotaSuolo = (c, dirCorpo) => (c.quota ? c.quota(dirCorpo) : c.raggio);
  // la verticale del luogo (per un corpo schiacciato non è la direzione del centro: il corpo la dà con `verticale`)
  const suDi = (p) => (cam.corpo && cam.corpo.verticale ? cam.corpo.verticale(p) : V.norma(p));
  // posizione e assi della camera negli assi del corpo che girano, all'istante t (e ritorno)
  function nelCorpo(t) { if (cam.solidale) return { p: cam.pos.slice(), a: cam.assi.slice() }; const A = assettoDi(cam.corpo, t), At = V.trasposta(A); return { p: V.mv(At, cam.pos), a: V.mm(At, cam.assi) }; }
  function dalCorpo(c, t) { if (cam.solidale) { cam.pos = c.p; cam.assi = c.a; } else { const A = assettoDi(cam.corpo, t); cam.pos = V.mv(A, c.p); cam.assi = V.mm(A, c.a); } }
  // gli assi senza rollio: «su» è la verticale del luogo
  function assiDa(avanti, verticale, destraPrima = null) {
    let d = V.vett(avanti, verticale); if (V.lungo(d) < 1e-6) d = destraPrima || V.vett(avanti, [0, 1, 0]); d = V.norma(d);
    const su = V.vett(d, avanti), ind = V.per(avanti, -1); return [d[0], su[0], ind[0], d[1], su[1], ind[1], d[2], su[2], ind[2]];
  }
  const colonna = (m, k) => [m[k], m[3 + k], m[6 + k]];
  // quando si passa la soglia della quota, la camera cambia riferimento restando dov'è
  function scegliRiferimento(t) {
    const c = cam.corpo; if (!c) return; const solidale = V.lungo(cam.pos) - c.raggio < O.quotaSolidale * c.raggio && !!c.assetto;
    if (solidale === cam.solidale) return; const A = assettoDi(c, t);
    if (solidale) { const At = V.trasposta(A); cam.pos = V.mv(At, cam.pos); cam.assi = V.mm(At, cam.assi); } else { cam.pos = V.mv(A, cam.pos); cam.assi = V.mm(A, cam.assi); }
    cam.solidale = solidale;
  }
  // non si attraversa il suolo
  function sopraIlSuolo(c) { const r = V.lungo(c.p), dir = V.per(c.p, 1 / r), suolo = quotaSuolo(cam.corpo, dir); if (r < suolo + O.quotaMinima) c.p = V.per(dir, suolo + O.quotaMinima); return r - suolo; }
  function attacca(c, { distanza = null, lon = 0, lat = 0, guarda = true } = {}) {
    cam.corpo = c; cam.solidale = false; const d = distanza ?? 3 * c.raggio, cl = Math.cos(lat), dir = [cl * Math.cos(lon), Math.sin(lat), -cl * Math.sin(lon)];
    const A = assettoDi(c, tempo.t); cam.pos = V.mv(A, V.per(dir, d)); if (guarda) cam.assi = assiDa(V.norma(V.per(cam.pos, -1)), V.mv(A, [0, 1, 0])); scegliRiferimento(tempo.t); cambia();
  }
  // il raggio dell'occhio per un punto della tela (pixel della pagina), negli assi del corpo che girano
  function raggio(x, y, c) { const tY = Math.tan(cam.fov / 2), tX = (tY * tela.clientWidth) / Math.max(1, tela.clientHeight), a = ((x / tela.clientWidth) * 2 - 1) * tX, b = (1 - (y / tela.clientHeight) * 2) * tY; return V.norma(V.mv(c.a, [a, b, -1])); }
  // dove il raggio tocca il corpo (assi del corpo): la distanza, o Infinity
  function tocca(o, d) {
    const c = cam.corpo; if (c.colpisci) return c.colpisci(o, d);
    const b = -V.scal(o, d), q = b * b - V.scal(o, o) + c.raggio * c.raggio; return q < 0 || b - Math.sqrt(q) < 0 ? Infinity : b - Math.sqrt(q);
  }
  const quota = () => (cam.corpo ? V.lungo(cam.pos) - quotaSuolo(cam.corpo, V.norma(nelCorpo(tempo.t).p)) : 0);

  // --- i gesti (tutti lavorano negli assi del corpo e poi riportano la camera nel suo riferimento)
  // avvicinarsi (k < 1) o allontanarsi verso il punto sotto il cursore
  function avvicina(x, y, k) {
    const c = nelCorpo(tempo.t), d = raggio(x, y, c), s = tocca(c.p, d), su0 = suDi(c.p);
    let Q; if (isFinite(s)) Q = V.somma(c.p, V.per(d, s)); else { const h = Math.max(V.lungo(c.p) - cam.corpo.raggio, cam.corpo.raggio * 0.05); Q = V.somma(c.p, V.per(d, h)); }
    c.p = V.somma(Q, V.per(V.meno(c.p, Q), k));
    const lim = O.distanzaFuori * cam.corpo.raggio; if (V.lungo(c.p) > lim) { c.p = V.per(V.norma(c.p), lim); if (k > 1 && O.alFuori) O.alFuori(); }
    c.a = V.mm(V.porta(su0, suDi(c.p)), c.a); sopraIlSuolo(c); dalCorpo(c, tempo.t); scegliRiferimento(tempo.t); cambia();
  }
  // trascinare: il punto afferrato segue il cursore (il corpo gira sotto la mano)
  let presa = null;
  function afferra(x, y) { const c = nelCorpo(tempo.t), d = raggio(x, y, c), s = tocca(c.p, d); presa = isFinite(s) ? { c, G: V.somma(c.p, V.per(d, s)), x, y } : { c, G: null, x, y }; }
  function trascina(x, y) {
    if (!presa) return; const c0 = presa.c;
    if (!presa.G) { guarda((x - presa.x) * -0.003, (y - presa.y) * -0.003, presa); presa.x = x; presa.y = y; return; }
    const d = raggio(x, y, c0), R = V.lungo(presa.G), b = -V.scal(c0.p, d), q = b * b - V.scal(c0.p, c0.p) + R * R; if (q < 0) return;
    const G1 = V.somma(c0.p, V.per(d, b - Math.sqrt(q))), M = V.porta(V.norma(G1), V.norma(presa.G)), c = { p: V.mv(M, c0.p), a: V.mm(M, c0.a) };
    sopraIlSuolo(c); dalCorpo(c, tempo.t); cambia();
  }
  // guardarsi attorno: girare la testa (dx) e alzare o abbassare lo sguardo (dy), in radianti
  function guarda(dx, dy) {
    const c = nelCorpo(tempo.t), su = suDi(c.p), av = V.per(colonna(c.a, 2), -1), destra = colonna(c.a, 0);
    let a2 = V.mv(V.giro(su, dx), av); const d2 = V.mv(V.giro(su, dx), destra), alza = Math.asin(Math.max(-1, Math.min(1, V.scal(a2, su))));
    a2 = V.mv(V.giro(d2, Math.max(-1.55 - alza, Math.min(1.55 - alza, dy))), a2); c.a = assiDa(a2, su, d2); dalCorpo(c, tempo.t); cambia();
  }
  // orbitare attorno al punto che sta al centro dello schermo
  function orbita(dx, dy) {
    const c = nelCorpo(tempo.t), av = V.per(colonna(c.a, 2), -1), s = tocca(c.p, av), h = Math.max(1, V.lungo(c.p) - quotaSuolo(cam.corpo, V.norma(c.p)));
    const Q = V.somma(c.p, V.per(av, isFinite(s) ? s : h)), suQ = suDi(Q), destra = colonna(c.a, 0);
    let M = V.giro(suQ, dx); const braccio = V.mv(M, V.meno(c.p, Q)), d2 = V.mv(M, destra), el = Math.asin(Math.max(-1, Math.min(1, V.scal(V.norma(braccio), suQ))));
    const M2 = V.giro(d2, -Math.max(0.02 - el, Math.min(1.55 - el, dy))); M = V.mm(M2, M);
    c.p = V.somma(Q, V.mv(M2, braccio)); c.a = assiDa(V.norma(V.meno(Q, c.p)), suDi(c.p), V.mv(M2, d2)); sopraIlSuolo(c); dalCorpo(c, tempo.t); scegliRiferimento(tempo.t); cambia();
  }
  // volare: avanti, di lato, in su (frazioni della quota al secondo)
  function vola(avanti, lato, su, dt) {
    const c = nelCorpo(tempo.t), su0 = suDi(c.p), h = Math.max(2, V.lungo(c.p) - quotaSuolo(cam.corpo, V.norma(c.p))), passo = h * dt;
    const av = V.per(colonna(c.a, 2), -1), de = colonna(c.a, 0);
    c.p = [c.p[0] + (av[0] * avanti + de[0] * lato + su0[0] * su) * passo, c.p[1] + (av[1] * avanti + de[1] * lato + su0[1] * su) * passo, c.p[2] + (av[2] * avanti + de[2] * lato + su0[2] * su) * passo];
    const lim = O.distanzaFuori * cam.corpo.raggio; if (V.lungo(c.p) > lim) { c.p = V.per(V.norma(c.p), lim); if (O.alFuori) O.alFuori(); }
    c.a = V.mm(V.porta(su0, suDi(c.p)), c.a); sopraIlSuolo(c); dalCorpo(c, tempo.t); scegliRiferimento(tempo.t);
  }
  // mettersi sopra un punto del corpo: longitudine e latitudine (radianti), quota (m), verso cui si guarda e inclinazione
  function vai({ lon, lat, quota: h = 1000, direzione = 0, alza = -0.4 }) {
    const c = cam.corpo, cl = Math.cos(lat), rad = [cl * Math.cos(lon), Math.sin(lat), -cl * Math.sin(lon)], est = [-Math.sin(lon), 0, -Math.cos(lon)];
    // (su un corpo schiacciato longitudine e latitudine sono quelle della sua carta: il punto e la verticale li dà lui)
    const p0 = c.punto ? c.punto(lon, lat, h) : V.per(rad, quotaSuolo(c, rad) + h), su = suDi(p0), nord = V.norma(V.vett(su, est));
    const oriz = [nord[0] * Math.cos(direzione) + est[0] * Math.sin(direzione), nord[1] * Math.cos(direzione) + est[1] * Math.sin(direzione), nord[2] * Math.cos(direzione) + est[2] * Math.sin(direzione)];
    const av = V.norma([oriz[0] * Math.cos(alza) + su[0] * Math.sin(alza), oriz[1] * Math.cos(alza) + su[1] * Math.sin(alza), oriz[2] * Math.cos(alza) + su[2] * Math.sin(alza)]);
    const k = { p: p0, a: assiDa(av, su, V.vett(oriz, su)) }; cam.solidale = !!c.assetto && h < O.quotaSolidale * c.raggio; dalCorpo(k, tempo.t); cambia();
  }
  // dove si è: longitudine, latitudine (radianti), quota dal suolo, direzione dello sguardo
  function dove() { const c = nelCorpo(tempo.t), r = V.lungo(c.p), rad = V.per(c.p, 1 / r), su = suDi(c.p), av = V.per(colonna(c.a, 2), -1), g = cam.corpo.lonLat ? cam.corpo.lonLat(c.p) : [Math.atan2(-rad[2], rad[0]), Math.asin(rad[1])], lon = g[0], lat = g[1], est = [-Math.sin(lon), 0, -Math.cos(lon)], nord = V.vett(su, est);
    return { lon, lat, quota: r - quotaSuolo(cam.corpo, rad), distanza: r, direzione: Math.atan2(V.scal(av, est), V.scal(av, nord)), alza: Math.asin(Math.max(-1, Math.min(1, V.scal(av, su)))) }; }
  // che cosa c'è sotto un punto della tela: { lon, lat, distanza } sul corpo a cui si è attaccati, o null
  function sotto(x, y) { const c = nelCorpo(tempo.t), d = raggio(x, y, c), s = tocca(c.p, d); if (!isFinite(s)) return null; const p = V.somma(c.p, V.per(d, s)), q = V.norma(p), g = cam.corpo.lonLat ? cam.corpo.lonLat(p) : [Math.atan2(-q[2], q[0]), Math.asin(q[1])]; return { lon: g[0], lat: g[1], distanza: s }; }

  // ---------- gli strati e le immagini su cui si disegna
  const strati = []; let imm = null;
  const aggiungi = (s) => { strati.push(s); if (s.prepara) s.prepara(N); cambia(); return s; };
  const togli = (s) => { const i = strati.indexOf(s); if (i >= 0) { strati.splice(i, 1); if (s.libera) s.libera(); } };
  function preparaImmagini() {
    const W = tela.width, H = tela.height; if (imm && imm.W === W && imm.H === H) return;
    if (imm) { for (const k of ['colA', 'colB', 'prof']) gl.deleteTexture(imm[k]); gl.deleteFramebuffer(imm.fA); gl.deleteFramebuffer(imm.fB); }
    const f = conVirgola ? 'rgba16f' : 'rgba8';
    imm = { W, H, colA: immagine(W, H, f, null, { filtro: gl.NEAREST }), colB: immagine(W, H, f, null, { filtro: gl.NEAREST }), prof: immagine(W, H, 'profondita', null, { filtro: gl.NEAREST }) };
    imm.fA = telaio(imm.colA, imm.prof); imm.fB = telaio(imm.colB);
  }
  // la tonalità: dall'immagine in virgola mobile allo schermo (curva filmica di Narkowicz 2015, poi la gamma)
  const prgTono = programma(V_SCHERMO, `in vec2 v_uv; out vec4 o; uniform sampler2D u_col;
    void main() { vec3 x = max(texture(u_col, v_uv).rgb, 0.0); x = clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); o = vec4(pow(x, vec3(1.0 / 2.2)), 1.0); }`);

  // ---------- un fotogramma
  const S = { gl, t: 0, dt: 0, W: 1, H: 1, proj: new Float32Array(16), vista: new Float32Array(9), fc: 1, tanX: 1, tanY: 1, fuoco: 1, camera: cam, stella: null, versoStella: [1, 0, 0], esposizione: 1, quota: 0, luceQui: 1, conVirgola, schermo, lega };
  const _a = new Map(); let occhioInerziale = [0, 0, 0];
  S.assetto = (c) => { let a = _a.get(c); if (!a) { a = assettoDi(c, S.t); _a.set(c, a); } return a; };
  S.versoCorpo = (c, out = [0, 0, 0]) => { tra(cam.corpo, c, S.t, out); out[0] -= occhioInerziale[0]; out[1] -= occhioInerziale[1]; out[2] -= occhioInerziale[2]; return out; };
  const stat = { cpuMs: 0, fotogrammi: 0 }; let esposto = 1, perso = false, ultimoMs = 0, giro = 0, quadro = 0;
  const tasti = new Set();
  function fotogramma(ms = performance.now()) {
    if (perso || !cam.corpo || !tela.width || !tela.height) return;
    const t0 = performance.now(), dtVero = Math.min(0.1, ultimoMs ? (ms - ultimoMs) / 1000 : 0); ultimoMs = ms;
    if (!tempo.pausa) tempo.t += dtVero * tempo.velocita;
    // i tasti del volo: W A S D (o le frecce) avanti e di lato, R e F su e giù, Q ed E girano la testa; maiuscolo: più in fretta
    if (tasti.size && dtVero > 0) {
      const k = (a, b) => (tasti.has(a) || tasti.has(b) ? 1 : 0), svelto = tasti.has('shift') ? 4 : 1;
      const av = k('w', 'arrowup') - k('s', 'arrowdown'), la = k('d', 'arrowright') - k('a', 'arrowleft'), su = k('r', ' ') - k('f', 'c'), gira = k('e') - k('q');
      if (av || la || su) vola(av * 1.2 * svelto, la * 1.2 * svelto, su * 0.9 * svelto, dtVero); if (gira) guarda(-gira * 1.2 * dtVero, 0);
    }
    scegliRiferimento(tempo.t);
    S.t = tempo.t; S.dt = dtVero * (tempo.pausa ? 0 : tempo.velocita); S.dtVero = dtVero; _a.clear();
    preparaImmagini(); const W = S.W = tela.width, H = S.H = tela.height;
    // la camera negli assi inerziali: l'occhio rispetto al centro del suo corpo, e la matrice mondo → occhio
    const A = cam.solidale ? S.assetto(cam.corpo) : V.identita(), assi = cam.solidale ? V.mm(A, cam.assi) : cam.assi; occhioInerziale = cam.solidale ? V.mv(A, cam.pos) : cam.pos.slice();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) S.vista[3 * j + i] = assi[3 * j + i]; // (per colonne, per WebGL: la trasposta degli assi)
    S.assi = assi; S.occhio = occhioInerziale; S.quota = quota(); S.distanza = V.lungo(cam.pos);
    const tY = Math.tan(cam.fov / 2), tX = (tY * W) / H, lontano = O.lontano || 1e13, m = S.proj; m.fill(0); m[0] = 1 / tX; m[5] = 1 / tY; m[10] = -1; m[11] = -1; m[14] = -0.02;
    S.tanX = tX; S.tanY = tY; S.fuoco = H / (2 * tY); S.fc = 2 / Math.log2(lontano + 1);
    // la stella che illumina: quella più in alto nell'albero del corpo a cui si è attaccati
    let st = cam.corpo; while (st && !st.luce) st = st.genitore; S.stella = st || null;
    if (st && st !== cam.corpo) { const v = tra(cam.corpo, st, S.t); S.distanzaStella = V.lungo(v); S.versoStella = V.norma(v); } else { S.versoStella = [0, 1, 0]; S.distanzaStella = 1; }
    S.coloreStella = st && st.luce.colore ? st.luce.colore : [1, 1, 1];
    for (const s of strati) if (s.aggiorna) s.aggiorna(S);
    // l'esposizione: quella fissata, o quella che la luce del posto chiede (gli strati dicono S.luceQui: 1 in pieno giorno)
    const voluta = O.esposizione > 0 ? O.esposizione : 1 / Math.max(0.004, S.luceQui); esposto += (voluta - esposto) * Math.min(1, dtVero > 0 ? dtVero * 2.5 : 1); S.esposizione = esposto;
    gl.bindFramebuffer(gl.FRAMEBUFFER, imm.fA); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 1); gl.clearDepth(1); gl.depthMask(true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    for (const s of strati) if (s.disegna) s.disegna(S, 'fondo');
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true);
    for (const s of strati) if (s.disegna) s.disegna(S, 'solido');
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    for (const s of strati) if (s.disegna) s.disegna(S, 'velato');
    gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    // le passate sull'immagine intera (l'aria), poi la tonalità
    let da = { col: imm.colA, prof: imm.prof, f: imm.fA }, a = { col: imm.colB, prof: imm.prof, f: imm.fB };
    for (const s of strati) if (s.dopo) { gl.bindFramebuffer(gl.FRAMEBUFFER, a.f); gl.viewport(0, 0, W, H); if (s.dopo(S, da, a)) { const x = da; da = a; a = x; } }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(prgTono.p); lega(0, da.col, prgTono.u.u_col); schermo();
    for (const s of strati) if (s.sopra) s.sopra(S);
    gl.bindVertexArray(null);
    stat.cpuMs = performance.now() - t0; stat.fotogrammi++;
  }
  function cambia() { if (O.alCambio) O.alCambio(); else if (!giro && !quadro) quadro = requestAnimationFrame((ms) => { quadro = 0; fotogramma(ms); }); }
  function passo(ms) { if (!giro) return; fotogramma(ms); giro = requestAnimationFrame(passo); }

  // ---------- i gesti: trascinare gira il corpo sotto la mano; col tasto destro (o maiuscolo) si orbita attorno al
  // centro dello schermo; con Ctrl (o il tasto di mezzo) ci si guarda attorno; la rotella avvicina a ciò che sta sotto
  // il cursore; i tasti W A S D R F volano
  const ascolti = [], ascolta = (chi, che, f, o) => { chi.addEventListener(che, f, o); ascolti.push([chi, che, f, o]); };
  const qui = (e) => { const r = tela.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  if (O.interazione) {
    let modo = null, ux = 0, uy = 0;
    ascolta(tela, 'contextmenu', (e) => e.preventDefault());
    ascolta(tela, 'pointerdown', (e) => { const [x, y] = qui(e); modo = e.button === 2 || e.shiftKey ? 'orbita' : e.button === 1 || e.ctrlKey ? 'guarda' : 'afferra'; ux = x; uy = y; if (modo === 'afferra') afferra(x, y); try { tela.setPointerCapture(e.pointerId); } catch { /* il puntatore non c'è più */ } tela.focus?.(); });
    ascolta(tela, 'pointermove', (e) => { if (!modo) return; const [x, y] = qui(e), dx = x - ux, dy = y - uy; ux = x; uy = y; if (modo === 'afferra') trascina(x, y); else if (modo === 'orbita') orbita(-dx * 0.005, dy * 0.005); else guarda(-dx * 0.003, -dy * 0.003); });
    const lascia = () => { modo = null; presa = null; }; ascolta(tela, 'pointerup', lascia); ascolta(tela, 'pointercancel', lascia);
    ascolta(tela, 'wheel', (e) => { e.preventDefault(); const [x, y] = qui(e); avvicina(x, y, Math.exp(Math.max(-0.7, Math.min(0.7, e.deltaY * 0.0016)))); }, { passive: false });
    const giu = (e) => { if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'r', 'f', 'q', 'e', 'c', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { tasti.add(k); if (k !== 'shift') e.preventDefault(); cambia(); } };
    ascolta(window, 'keydown', giu); ascolta(window, 'keyup', (e) => tasti.delete(e.key.toLowerCase())); ascolta(window, 'blur', () => tasti.clear());
  }
  ascolta(tela, 'webglcontextlost', (e) => { e.preventDefault(); perso = true; });
  function ridimensiona() {
    const d = O.densita || Math.min(2, (typeof devicePixelRatio !== 'undefined' && devicePixelRatio) || 1), w = Math.max(1, Math.round((tela.clientWidth || tela.width) * d)), h = Math.max(1, Math.round((tela.clientHeight || tela.height) * d));
    if (tela.width !== w || tela.height !== h) { tela.width = w; tela.height = h; } cambia();
  }
  function libera() {
    if (giro) cancelAnimationFrame(giro); if (quadro) cancelAnimationFrame(quadro); giro = quadro = 0;
    for (const [chi, che, f, o] of ascolti) chi.removeEventListener(che, f, o); ascolti.length = 0;
    for (const s of strati) if (s.libera) s.libera(); strati.length = 0;
    if (!perso) gl.getExtension('WEBGL_lose_context')?.loseContext(); perso = true;
  }
  const N = { gl, tela, opzioni: O, V, tempo, camera: cam, corpo, corpi, tra, attacca, vai, dove, sotto, quota, avvicina, guarda, orbita, vola, afferra, trascina, aggiungi, togli, strati, fotogramma, cambia, ridimensiona, libera, programma, immagine, telaio, lega, schermo, V_SCHERMO, stato: S, statistiche: () => ({ ...stat, tasti: tasti.size }), conVirgola,
    avvia: () => { if (!giro) giro = requestAnimationFrame(passo); }, ferma: () => { if (giro) cancelAnimationFrame(giro); giro = 0; }, tasti };
  ridimensiona();
  return N;
}
