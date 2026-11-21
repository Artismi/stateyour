// luci.js — LE SORGENTI DI LUCE VISTE DA LONTANO: punti con il loro alone (una stella, le stelle di una galassia, le
// galassie del cosmo). Di ognuna si sa la luminosità vera (watt) e il colore; quanto brilla sullo schermo lo decide la
// distanza (flusso = L / 4πd²) e l'esposizione del momento (S.E0, vedi nucleo.js): una sorgente che manda sull'occhio
// l'irradianza E, raccolta in un punto dello schermo, vale π·(E/E0)·fuoco² volte un foglio bianco; qui la si sparge come
// la sparge l'occhio (la diffusione della CIE, sotto), largo fin dove vale ancora qualcosa. Così la stessa regola
// fa di una stella un punto appena visibile di notte da un pianeta e un bagliore accecante da vicino.
// Le posizioni arrivano già riferite all'occhio (la sottrazione si fa in doppia precisione, fuori di qui).
import { V } from './nucleo.js';

// LA DIFFUSIONE DELL'OCCHIO (la funzione di diffusione del punto: quanto della luce di un punto finisce a un angolo θ da lui).
// La luce velante della CIE per un occhio giovane (Vos & van den Berg, CIE 135/1-6, 1999 [R]: la formula generale con età
// 25 anni e pigmento 0,5): L_velo/E = 10/θ³ + 5/θ² + 0,05/θ + 0,00125 per steradiante, θ in gradi, misurata da 0,1° a 100°.
// Ciò che non va oltre 0,1° (il 72,5%: 1 − ∫G dΩ da 0,1° a 90°, qui sotto) resta nel cuore, una campana larga un pixel (o
// quanto 0,1° se è di più). La luce si conserva: sul quadratino la somma è E (quella che arriva all'occhio), salvo ciò che
// cade oltre il suo lato massimo. Una stella è bianca dove la sua luce velante supera il foglio bianco dell'esposizione
// (π·E·G(θ)/E0 > 1): un disco largo come (10·π·E/E0)^⅓ gradi, che cresce con la luce vera e si stringe quando l'occhio
// si adatta a lei. (Prima: un alone 1/(1 + r²) con il cuore bianco largo sempre metà del quadratino, cioè 80 pixel.)
const G_CIE = (t) => 10 / t ** 3 + 5 / t ** 2 + 0.05 / t + 0.00125, T_CUORE = 0.1, T_MAX = 90;
const SPARSA = 2 * Math.PI * (Math.PI / 180) ** 2 * (10 * (1 / T_CUORE - 1 / T_MAX) + 5 * Math.log(T_MAX / T_CUORE) + 0.05 * (T_MAX - T_CUORE) + 0.000625 * (T_MAX ** 2 - T_CUORE ** 2)); // ∫G dΩ oltre 0,1° (≈ 0,275)
export const DIFFUSIONE_OCCHIO = { G: G_CIE, cuore: T_CUORE, sparsa: SPARSA };
const GLSL_G = `float gCIE(float t) { return 10.0 / (t * t * t) + 5.0 / (t * t) + 0.05 / t + 0.00125; }`;
const V_PUNTI = `
in vec3 a_p; in vec4 a_l;   // posizione rispetto all'occhio (assi del mondo); luminosità per colore (in unità di u_k.x watt), e in a quanto pesa
uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_fc;
uniform vec4 u_k;           // unità delle luminosità / (4π·E0); fuoco (pixel per radiante); lato massimo in pixel; alone minimo
uniform vec3 u_peso;        // quante sorgenti vere rappresenta ogni punto visto da lontano (un campione: nebbia.js), e tra quali distanze (in 10¹⁵ m) si passa da una a tutte
out vec3 v_k; out vec3 v_q; // v_k: π·E/E0 per colore; v_q: (raggio del quadratino, gradi per pixel, σ del cuore in pixel)
void main() {
  // (le distanze vanno da metri a 10²⁶ m: il loro quadrato non sta in un numero a 32 bit; si conta in unità di 10¹⁵ m,
  // e la costante u_k.x arriva già divisa per 10³⁰)
  vec3 e = u_vista * a_p, es = e * 1e-15; float d2 = max(dot(es, es), 1e-36);
  vec3 K = a_l.rgb * (3.14159265 * u_k.x / d2) * (1.0 + (u_peso.x - 1.0) * smoothstep(u_peso.y, u_peso.z, sqrt(d2))); float k = max(K.r, max(K.g, K.b));
  float gpp = 57.29578 / u_k.y, sc = max(0.6, 0.5 * ${T_CUORE.toFixed(3)} / gpp), cuore = (1.0 - ${SPARSA.toFixed(5)}) * k * u_k.y * u_k.y / (6.2831853 * sc * sc);
  // fin dove la luce velante vale ancora 1/500 del foglio bianco (il termine più forte a quell'angolo), e almeno il cuore
  const float EPS = 0.002; float t = max(pow(10.0 * k / EPS, 1.0 / 3.0), max(sqrt(5.0 * k / EPS), 0.05 * k / EPS));
  float r = clamp(max(t / gpp, 3.0 * sc * sqrt(max(0.0, log(max(cuore / EPS, 1.0)) / 4.5))), u_k.w, u_k.z);
  v_k = K; v_q = vec3(r, gpp, sc);
  vec4 pr = u_proj * vec4(es, 0.0); float wv = pr.w * 1e15; // (le coordinate dello schermo si danno già divise: numeri come 10²⁵ farebbero traboccare i conti di chi ritaglia)
  gl_Position = pr.w > 0.0 ? vec4(pr.xy / pr.w, log2(max(1e-6, 1.0 + wv)) * u_fc - 1.0, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
  gl_PointSize = 2.0 * r + 1.0; if (cuore < 2e-4 || a_l.a <= 0.0) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const F_PUNTI = `
in vec3 v_k; in vec3 v_q; out vec4 o_col; uniform vec4 u_k;
${GLSL_G}
void main() { float r = v_q.x, q = length(gl_PointCoord - 0.5) * (2.0 * r + 1.0); if (q > r + 0.5) discard;
  float t = q * v_q.y, sc = v_q.z, f2 = u_k.y * u_k.y;
  // il cuore (la parte che resta entro 0,1°) e la luce velante oltre, in unità del foglio bianco: π·E/E0 × (densità per pixel)
  float cuore = (1.0 - ${SPARSA.toFixed(5)}) * f2 / (6.2831853 * sc * sc) * exp(-0.5 * q * q / (sc * sc)), velo = t > ${T_CUORE.toFixed(3)} ? gCIE(t) : 0.0; // (G è per steradiante: π·L/E0 = (π·E/E0)·G)
  o_col = vec4(v_k * (cuore + velo) * (1.0 - smoothstep(0.85 * r, r + 0.5, q)), 0.0); }`;
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
      disegna(S, unita = 1, minimo = 1, peso = null) {
        if (!o.n) return; if (!prg) prg = N.programma(V_PUNTI, F_PUNTI, { a_p: 0, a_l: 1 }); const u = prg.u; gl.useProgram(prg.p); gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc);
        gl.uniform4f(u.u_k, (unita * 1e-30) / (4 * Math.PI * S.E0), S.fuoco, massimo / 2 - 1, minimo); gl.uniform3f(u.u_peso, peso ? peso[0] : 1, peso ? peso[1] * 1e-15 : 0, peso ? peso[2] * 1e-15 : 1);
        gl.drawArrays(gl.POINTS, 0, o.n); gl.bindVertexArray(null);
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
      // (un batuffolo è largo al più 40 pixel: decine di migliaia più larghi riempirebbero lo schermo migliaia di volte;
      // chi li vuole più larghi — piu.lato — ne disegna meno — piu.quanti, i primi: sono in ordine a caso — e più forti — piu.forza)
      disegna(S, centro, quadro, unita, opacita = 1, toro = 0, piu = null) {
        if (!prgN) prgN = N.programma(V_NUBI, F_NUBI, { a_p: 0, a_l: 1 }); const u = prgN.u; gl.useProgram(prgN.p); gl.bindVertexArray(vao);
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform3f(u.u_C, centro[0], centro[1], centro[2]);
        const q = quadro || V.identita(); for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = q[3 * r + c]; gl.uniformMatrix3fv(u.u_quadro, false, u9);
        gl.uniform1f(u.u_toro, toro); const latoMax = Math.min(massimo, (piu && piu.lato) || 40 * Math.max(1, S.H / 800)), quanti = Math.max(1, Math.min(o.n, Math.round((piu && piu.quanti) || o.n))), forza = (piu && piu.forza) || 1;
        gl.uniform4f(u.u_k, unita > 0 ? (unita * forza * 1e-30) / (4 * Math.PI * S.E0) : 0, S.fuoco, latoMax, opacita);
        gl.drawArrays(gl.POINTS, 0, quanti); gl.bindVertexArray(null);
      },
      libera() { gl.deleteBuffer(b); gl.deleteVertexArray(vao); } };
    libere.push(o); return o;
  }
  return { insieme, nube, massimo, libera() { for (const o of libere) o.libera(); libere.length = 0; } };
}
