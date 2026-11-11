// mezzo.js — CIÒ CHE STA TRA LE STELLE di una galassia, come si vede: i volumi di vuoto.js (`scenaGalassia().vuoto`).
//
// · I volumi che EMETTONO (regioni H II rosa della riga Hα, nebulose planetarie verde-azzurre di [O III], riflessione
//   blu, resti di supernova): ognuno è una palla di gas sottile, larga quanto è larga davvero, con la brillanza vera
//   (`brillanza`, W/m²/sr: la sua luce visibile su 4π²R²) e il colore delle sue righe; sullo schermo vale π·B/E0 volte
//   un foglio bianco (l'unità del nucleo), più al centro che al bordo (la corda attraverso una sfera). Più piccolo di
//   un punto dello schermo, la sua luce resta quella (meno brillante quanto più piccolo). Con la luce vera quasi tutti
//   sono più deboli della luce diffusa della galassia: da lontano si vedono solo le grandi regioni H II; gli altri
//   compaiono avvicinandosi, quando l'occhio si apre.
// · Le NUBI OSCURE (`estinzione`, magnitudini attraverso il centro): tolgono luce a ciò che sta dietro, di
//   10^(−0,4·A_V·colonna), con la colonna che cala verso il bordo più in fretta della corda di una sfera piena (una nube
//   è più densa al centro: (1 − q²)^1,5, SCELTO: i dati danno il raggio e l'estinzione al centro, non il profilo). Qui tolgono luce a tutto ciò che è già disegnato in quel punto dello schermo (anche a ciò che
//   starebbe davanti alla nube: la galassia non è ordinata in profondità) — dichiarato.
// PIGRO: i volumi si chiedono una volta, quando ci si avvicina alla galassia (meno di otto raggi), in un momento di
// quiete; per una galassia grande a pezzi (sfere di un terzo del raggio, una per volta), senza doppioni (per indirizzo).
// Che cosa NON c'è: la polvere continua del disco come colonna lungo lo sguardo (`polvere.in`: nella luce diffusa di
// universo.js conta solo come «più buio dove ce n'è»); il chiarore di una nebulosa per chi ci sta dentro; il moto
// dei volumi col tempo (stanno dov'erano quando li si è chiesti).
const V_MEZZO = `
in vec4 a_p; in vec4 a_l;   // posizione nel riferimento della galassia e raggio (m); colore lineare × brillanza (W/m²/sr), e A_V attraverso il centro
uniform mat4 u_proj; uniform mat3 u_vista, u_quadro; uniform float u_fc; uniform vec3 u_C;
uniform vec4 u_k;           // π/E0; fuoco (pixel); lato massimo (pixel); 0: emissione, 1: estinzione
out vec4 v_c;
void main() {
  vec3 rel = u_C + u_quadro * a_p.xyz, es = u_vista * rel * 1e-15; float ds = max(length(es), 1e-12), lato = 2.0 * a_p.w * 1e-15 * u_k.y / ds, visto = clamp(lato, 1.5, u_k.z), parte = min(1.0, (lato * lato) / (visto * visto));
  v_c = u_k.w < 0.5 ? vec4(a_l.rgb * u_k.x * parte, 0.0) : vec4(vec3(a_l.a), parte);
  v_c.rgb *= u_k.w < 0.5 ? 1.0 - smoothstep(0.5 * u_k.z, u_k.z, lato) : 1.0;
  vec4 pr = u_proj * vec4(es, 0.0); float wv = pr.w * 1e15; bool c = u_k.w < 0.5 ? dot(a_l.rgb, vec3(1.0)) > 0.0 : a_l.a > 0.0;
  gl_Position = pr.w > 0.0 && c && lato < 2.0 * u_k.z ? vec4(pr.xy / pr.w, log2(max(1e-6, 1.0 + wv)) * u_fc - 1.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = visto;
}`;
const F_MEZZO = `
in vec4 v_c; uniform vec4 u_k; out vec4 o_col;
void main() { float q = length(gl_PointCoord - 0.5) * 2.0; if (q > 1.0) discard; float corda = sqrt(1.0 - q * q), colonna = (1.0 - q * q) * corda;
  // emissione: gas sottile, la luce va con la corda (media 2/3: ×1,5 perché la media sul disco resti la brillanza data);
  // estinzione: ciò che resta della luce di dietro è 10^(−0,4·A_V·corda) (qui si scrive quanto se ne toglie)
  if (u_k.w < 0.5) o_col = vec4(v_c.rgb * corda * 1.5, 0.0); else { float via = 1.0 - pow(10.0, -0.4 * v_c.r * colonna); o_col = vec4(vec3(via * v_c.a), 0.0); } }`;
const KPC = 3.0857e19, lin = (c) => (c / 255) ** 2.2;

// scena: () → la scena della galassia (con `vuoto(regione)`); raggioM: il raggio della galassia
export function creaMezzo(N, { scena, raggioM, opzioni = {} } = {}) {
  const gl = N.gl, O = { emissione: 1, estinzione: 1, ...opzioni }, massimo = Math.min(256, Math.floor(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]));
  let prg = null, vao = null, buf = null, n = 0, stato = 'da chiedere'; const visti = new Set(), dati = [], conta = {}, info = { volumi: 0, ms: 0, pezzi: 0, conta };
  const Rk = raggioM / KPC, pezzi = Rk < 25 ? [{ centro: [0, 0, 0], raggio: Rk * 1.05 }] : (() => { const out = [], r = Rk / 3; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) out.push({ centro: [i * r * 1.3, j * r * 1.3, 0], raggio: r }); return out; })();
  function carica() {
    const sc = scena(); if (!sc || typeof sc.vuoto !== 'function') { stato = 'non c\'è'; return; } const p = pezzi.shift(); if (!p) { stato = 'pronto'; return; }
    const t0 = performance.now(); let v = null; try { v = sc.vuoto(p); } catch (e) { console.warn('il mezzo tra le stelle non si è potuto leggere:', e); stato = 'errore'; return; }
    for (const x of v.volumi) { if (visti.has(x.id)) continue; visti.add(x.id); conta[x.cosa] = (conta[x.cosa] || 0) + 1; const c = x.colore, B = x.brillanza > 0 && c ? x.brillanza : 0; dati.push(x.pos[0], x.pos[1], x.pos[2], x.raggio, B ? lin(c[0]) * B : 0, B ? lin(c[1]) * B : 0, B ? lin(c[2]) * B : 0, x.estinzione > 0 ? x.estinzione : 0); }
    n = dati.length / 8; info.volumi = n; info.ms += performance.now() - t0; info.pezzi++;
    if (!vao) { vao = gl.createVertexArray(); buf = gl.createBuffer(); } gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(dati), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16); gl.bindVertexArray(null);
    stato = pezzi.length ? 'da chiedere' : 'pronto'; N.cambia();
  }
  const u9 = new Float32Array(9);
  return {
    info, stato: () => stato,
    // distanza: quanto è lontano il centro della galassia; li si chiede (un pezzo per volta, a riposo) quando si è abbastanza vicini
    aggiorna(S, distanza) { if (stato === 'da chiedere' && distanza < 8 * raggioM) { stato = 'in arrivo'; setTimeout(carica, 30); } },
    // centro: il centro della galassia rispetto all'occhio; quadro: i suoi assi nel mondo (3×3 per righe)
    disegna(S, centro, quadro) {
      if (!n) return; if (!prg) prg = N.programma(V_MEZZO, F_MEZZO, { a_p: 0, a_l: 1 }); const u = prg.u; gl.useProgram(prg.p); gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform3f(u.u_C, centro[0], centro[1], centro[2]);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = quadro[3 * r + c]; gl.uniformMatrix3fv(u.u_quadro, false, u9);
      if (O.estinzione) { gl.blendFunc(gl.ZERO, gl.ONE_MINUS_SRC_COLOR); gl.uniform4f(u.u_k, 0, S.fuoco, massimo, 1); gl.drawArrays(gl.POINTS, 0, n); }
      if (O.emissione) { gl.blendFunc(gl.ONE, gl.ONE); gl.uniform4f(u.u_k, (Math.PI / S.E0) * O.emissione, S.fuoco, massimo, 0); gl.drawArrays(gl.POINTS, 0, n); }
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.bindVertexArray(null);
    },
    libera() { if (buf) gl.deleteBuffer(buf); if (vao) gl.deleteVertexArray(vao); if (prg) gl.deleteProgram(prg.p); },
  };
}
