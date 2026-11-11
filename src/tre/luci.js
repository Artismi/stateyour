// luci.js — LE SORGENTI DI LUCE VISTE DA LONTANO: punti con il loro alone (una stella, le stelle di una galassia, le
// galassie del cosmo). Di ognuna si sa la luminosità vera (watt) e il colore; quanto brilla sullo schermo lo decide la
// distanza (flusso = L / 4πd²) e l'esposizione del momento (S.E0, vedi nucleo.js): una sorgente che manda sull'occhio
// l'irradianza E, raccolta in un punto dello schermo, vale π·(E/E0)·fuoco² volte un foglio bianco; qui la si sparge in
// un alone 1/(1 + r²) (r in pixel) che conserva la somma, largo fin dove vale ancora qualcosa. Così la stessa regola
// fa di una stella un punto appena visibile di notte da un pianeta e un bagliore accecante da vicino.
// Le posizioni arrivano già riferite all'occhio (la sottrazione si fa in doppia precisione, fuori di qui).
import { V } from './nucleo.js';

const V_PUNTI = `
in vec3 a_p; in vec4 a_l;   // posizione rispetto all'occhio (assi del mondo); luminosità per colore (in unità di u_k.x watt), e in a quanto pesa
uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_fc;
uniform vec4 u_k;           // unità delle luminosità / (4π·E0); π·fuoco²/20 (da irradianza a valore di picco); lato massimo in pixel; alone minimo
out vec3 v_c; out float v_r;
void main() {
  // (le distanze vanno da metri a 10²⁶ m: il loro quadrato non sta in un numero a 32 bit; si conta in unità di 10¹⁵ m,
  // e la costante u_k.x arriva già divisa per 10³⁰)
  vec3 e = u_vista * a_p, es = e * 1e-15; float d2 = max(dot(es, es), 1e-36);
  vec3 picco = a_l.rgb * (u_k.x / d2) * u_k.y; float f = max(picco.r, max(picco.g, picco.b));
  float r = clamp(sqrt(f / 0.006), u_k.w, u_k.z);
  // (una sorgente fortissima: il suo alone non può uscire dal quadratino; resta un cuore bianco largo metà del raggio, che poi sfuma)
  v_c = picco * min(1.0, 0.5 * (1.0 + 0.25 * r * r) / max(f, 1e-20)); v_r = r;
  vec4 pr = u_proj * vec4(es, 0.0); float wv = pr.w * 1e15; // (le coordinate dello schermo si danno già divise: numeri come 10²⁵ farebbero traboccare i conti di chi ritaglia)
  gl_Position = pr.w > 0.0 ? vec4(pr.xy / pr.w, log2(max(1e-6, 1.0 + wv)) * u_fc - 1.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  gl_PointSize = 2.0 * r + 1.0; if (f < 2e-4 || a_l.a <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const F_PUNTI = `
in vec3 v_c; in float v_r; out vec4 o_col;
void main() { float q = length(gl_PointCoord - 0.5) * (2.0 * v_r + 1.0); if (q > v_r + 0.5) discard;
  o_col = vec4(v_c * (1.0 / (1.0 + q * q)) * (1.0 - smoothstep(0.55 * v_r, v_r + 0.5, q)), 0.0); }`;
// le nubi: batuffoli larghi (la luce diffusa di una galassia, la rete del cosmo): ognuno ha una taglia vera (metri) e
// una luminosità; sullo schermo è un disco sfumato grande quanto la sua taglia (al più il lato massimo di un punto)
const V_NUBI = `
in vec4 a_p; in vec4 a_l;   // posizione (nel riferimento della nube) e taglia (m); luminosità per colore (unità u_k.x) oppure colore fisso
uniform mat4 u_proj; uniform mat3 u_vista, u_quadro; uniform float u_fc; uniform vec3 u_C;
uniform vec4 u_k;           // unità / (4π·E0) (0: il colore è già quello dello schermo); fuoco in pixel; lato massimo; opacità
uniform float u_toro;       // se lo spazio si richiude (il cosmo): il suo lato; ogni batuffolo si vede nell'immagine più vicina all'occhio
out vec3 v_c;
void main() {
  vec3 rel = u_C + u_quadro * a_p.xyz; if (u_toro > 0.0) rel = mod(rel + 0.5 * u_toro, u_toro) - 0.5 * u_toro;
  vec3 e = u_vista * rel, es = e * 1e-15; float ds = max(length(es), 1e-18), lato = (a_p.w * 1e-15) * u_k.y / ds, visto = clamp(lato, 1.5, u_k.z); // (distanze in unità di 10¹⁵ m, come sopra)
  // la luce di un batuffolo sparsa sul suo disco: L/(4πd²·E0) per unità d'angolo solido, rispetto al foglio bianco (E0/π)
  v_c = u_k.x > 0.0 ? a_l.rgb * (u_k.x / (ds * ds)) * (4.0 * u_k.y * u_k.y / (visto * visto)) : a_l.rgb * u_k.w * min(1.0, (lato * lato) / (visto * visto));
  vec4 pr = u_proj * vec4(es, 0.0); float wv = pr.w * 1e15; // (le coordinate dello schermo si danno già divise: numeri come 10²⁵ farebbero traboccare i conti di chi ritaglia)
  gl_Position = pr.w > 0.0 ? vec4(pr.xy / pr.w, log2(max(1e-6, 1.0 + wv)) * u_fc - 1.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  v_c *= 1.0 - smoothstep(0.45 * u_k.z, u_k.z, lato); // da vicino un batuffolo svanisce: ci si è dentro, la sua luce è tutta intorno
  gl_PointSize = visto; if (lato > u_k.z) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const F_NUBI = `
in vec3 v_c; out vec4 o_col;
void main() { float q = length(gl_PointCoord - 0.5) * 2.0; if (q > 1.0) discard; float a = 1.0 - q * q; o_col = vec4(v_c * a * a, 0.0); }`;

export function creaPunti(N) {
  const gl = N.gl, massimo = Math.min(256, Math.floor(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1]));
  let prg = null, prgN = null; const libere = [];
  // un insieme di punti che cambiano a ogni fotogramma (posizioni riferite all'occhio)
  function insieme(capienza) {
    const vao = gl.createVertexArray(), bp = gl.createBuffer(), bl = gl.createBuffer(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferData(gl.ARRAY_BUFFER, capienza * 12, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bl); gl.bufferData(gl.ARRAY_BUFFER, capienza * 16, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
    const o = { vao, bp, bl, n: 0, capienza,
      // pos: Float32Array(3n) rispetto all'occhio; luce: Float32Array(4n) (r, g, b in unità di `unita` watt; a > 0: c'è)
      metti(pos, luce, n) { o.n = n; gl.bindBuffer(gl.ARRAY_BUFFER, bp); gl.bufferSubData(gl.ARRAY_BUFFER, 0, pos, 0, 3 * n); if (luce) { gl.bindBuffer(gl.ARRAY_BUFFER, bl); gl.bufferSubData(gl.ARRAY_BUFFER, 0, luce, 0, 4 * n); } },
      disegna(S, unita = 1, minimo = 1) {
        if (!o.n) return; if (!prg) prg = N.programma(V_PUNTI, F_PUNTI, { a_p: 0, a_l: 1 }); const u = prg.u; gl.useProgram(prg.p); gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc);
        gl.uniform4f(u.u_k, (unita * 1e-30) / (4 * Math.PI * S.E0), (Math.PI * S.fuoco * S.fuoco) / 20, massimo / 2 - 1, minimo); gl.drawArrays(gl.POINTS, 0, o.n); gl.bindVertexArray(null);
      },
      libera() { gl.deleteBuffer(bp); gl.deleteBuffer(bl); gl.deleteVertexArray(vao); } };
    libere.push(o); return o;
  }
  // una nube di batuffoli fermi nel loro riferimento: dati = Float32Array(8n): x, y, z, taglia, r, g, b, 1
  function nube(dati, n) {
    const vao = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, dati, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16); gl.bindVertexArray(null);
    const u9 = new Float32Array(9), o = { n,
      aggiorna(d) { gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferSubData(gl.ARRAY_BUFFER, 0, d); },
      // centro: il riferimento della nube rispetto all'occhio; quadro: i suoi assi nel mondo (3×3 per righe); unita: watt per unità (0: colori già da schermo, con `opacita`)
      disegna(S, centro, quadro, unita, opacita = 1, toro = 0) {
        if (!prgN) prgN = N.programma(V_NUBI, F_NUBI, { a_p: 0, a_l: 1 }); const u = prgN.u; gl.useProgram(prgN.p); gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform3f(u.u_C, centro[0], centro[1], centro[2]);
        const q = quadro || V.identita(); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = q[3 * r + c]; gl.uniformMatrix3fv(u.u_quadro, false, u9);
        if (!o._detto) { o._detto = 1; console.log('NUBE', o.n, JSON.stringify({ centro: Array.from(centro).map((x) => x.toExponential(2)), q: Array.from(u9).map((x) => +x.toFixed(2)), unita, E0: S.E0, kx: unita > 0 ? (unita * 1e-30) / (4 * Math.PI * S.E0) : 0, fuoco: S.fuoco, toro, u: Object.keys(u) })); }
        gl.uniform1f(u.u_toro, toro); gl.uniform4f(u.u_k, unita > 0 ? (unita * 1e-30) / (4 * Math.PI * S.E0) : 0, S.fuoco, Math.min(massimo, 40 * Math.max(1, S.H / 800)), opacita); // (un batuffolo è largo al più 40 pixel: decine di migliaia più larghi riempirebbero lo schermo migliaia di volte) gl.drawArrays(gl.POINTS, 0, o.n); gl.bindVertexArray(null);
      },
      libera() { gl.deleteBuffer(b); gl.deleteVertexArray(vao); } };
    libere.push(o); return o;
  }
  return { insieme, nube, massimo, libera() { for (const o of libere) o.libera(); libere.length = 0; } };
}
