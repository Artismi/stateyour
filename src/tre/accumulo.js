// accumulo.js — L'ACCUMULO NEL TEMPO: gli strati che costano (i volumi, la luce zodiacale, il buco nero) non fanno
// tutto il conto in un fotogramma. Ne fanno un pezzo, ogni volta un pezzo diverso, e lo sommano a ciò che avevano già
// fatto nei fotogrammi prima, riportato dove si vede adesso. A camera ferma l'immagine converge allo stesso valore del
// conto pieno (regola 14: è un modo di calcolare la stessa soluzione, non aggiunge niente); in moto si rinuncia alla
// storia dove non si può riportare.
//
// DUE MODI.
//  · 'media' (i volumi, la luce zodiacale): ogni fotogramma cammina lungo il raggio con pochi passi, con l'inizio dei
//    passi spostato di una quantità che cambia a ogni fotogramma (per pixel: un numero a caso fisso più il passo della
//    successione di Kronecker col rapporto aureo, `sfasatura(k)`: così i fotogrammi riempiono l'intervallo di ogni passo in
//    modo uniforme, senza lasciare buchi né doppioni). La media su n fotogrammi è la stessa somma che si farebbe con n
//    volte più passi: per la luce che nasce lungo il raggio la media è esatta (è la somma di Riemann stratificata
//    dell'integrale); dove c'è anche la polvere che la toglie resta il piccolo errore del passo, misurato in prove.
//    La storia vale (n−1)/n, il nuovo 1/n; n cresce di uno a ogni fotogramma fino a `vista.accumulo.ferma` a camera
//    ferma, e scende fino a `vista.accumulo.moto` quanto più l'immagine scorre (pixel per fotogramma).
//  · 'intreccio' (il buco nero: un conto deterministico, ogni raggio una geodetica): ogni fotogramma si calcola un pixel
//    su quattro (un'immagine di metà lato, il pixel del blocco 2×2 cambia a ogni fotogramma); gli altri tre vengono dalla
//    storia riportata. A camera ferma dopo quattro fotogrammi ogni pixel è il conto pieno, identico; in moto, dove la
//    storia non si può riportare, si prende il pixel calcolato adesso nello stesso blocco (l'immagine di metà lato).
//
// LA RIPROIEZIONE. Ogni strato dà, per pixel, una distanza rappresentativa lungo il raggio (nel canale alfa: per i
// volumi la distanza media pesata con la luce; 0 = all'infinito, conta solo la rotazione) e, a ogni fotogramma, dove
// sta l'occhio e come è girato nel SUO riferimento (le unità sue: raggi della galassia, lati del toro, UA, r_g): la
// differenza tra l'occhio di adesso e quello di prima si fa in doppia precisione sulla CPU. Il punto visto adesso,
// portato nell'occhio di prima, dà dove leggere la storia; la si scarta se cade fuori dall'immagine o se la distanza
// che la storia ricorda non combacia (oltre `vista.accumulo.tolleranza`, relativa) con quella che dovrebbe avere.
// La luce della storia si riporta all'unità di adesso (E0 di prima / E0 di adesso: l'occhio che si adatta).
//
// QUALITÀ (N.vista.accumulo): { attivo, ferma, moto, tolleranza }. Non sono fisica: sono quanto si aspetta e quanto si
// accetta di vedere strisciare.
const V_Q = `out vec2 v_uv; void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const F_RISOLVI = `
layout(location = 0) out vec4 o_a; layout(location = 1) out vec4 o_b;
uniform sampler2D u_cor, u_stA, u_stB; // adesso (rgb, distanza); la storia (rgb, distanza) e (quanti fotogrammi)
uniform mat3 u_ora, u_primaT;         // dagli assi dell'occhio a quelli dello strato, adesso; da quelli dello strato all'occhio di prima
uniform vec3 u_sposta;                // occhio di adesso − occhio di prima (unità dello strato)
uniform vec4 u_tan;                   // tangenti di metà campo, adesso (xy) e prima (zw)
uniform vec4 u_q;                     // storia massima a camera ferma; in moto; tolleranza della distanza; E0 prima / E0 adesso
uniform vec4 u_m;                     // modo (0: media, 1: intreccio); quale pixel del blocco (0…3); c'è la storia; distanza fissa (>0: per tutti i pixel)
uniform vec2 u_lati;                  // pixel dell'immagine che si scrive
void main() {
  ivec2 px = ivec2(gl_FragCoord.xy); vec2 uv = (vec2(px) + 0.5) / u_lati; vec4 c; bool nuovo = true;
  if (u_m.x < 0.5) c = texelFetch(u_cor, px, 0);
  else { c = texelFetch(u_cor, px >> 1, 0); int k = int(u_m.y); nuovo = (px.x & 1) == (k & 1) && (px.y & 1) == (k >> 1); }
  float s = u_m.w > 0.0 ? u_m.w : c.a;
  vec3 d = normalize(u_ora * vec3((uv * 2.0 - 1.0) * u_tan.xy, -1.0));
  vec3 q = u_primaT * (s > 0.0 ? d * s + u_sposta : d); vec2 uvp = q.xy / (-q.z * u_tan.zw) * 0.5 + 0.5;
  bool dentro = u_m.z > 0.5 && q.z < 0.0 && all(greaterThanEqual(uvp, vec2(0.0))) && all(lessThanEqual(uvp, vec2(1.0)));
  vec4 h = dentro ? texture(u_stA, uvp) : vec4(0.0); float sh = u_m.w > 0.0 ? u_m.w : h.a, e = s > 0.0 ? length(d * s + u_sposta) : 0.0;
  bool combacia = dentro && ((s <= 0.0 && sh <= 0.0) || (s > 0.0 && sh > 0.0 && abs(sh - e) <= u_q.z * e));
  float vel = length((uvp - uv) * u_lati);
  if (u_m.x > 0.5) { // l'intreccio: il pixel calcolato adesso, o la storia, o (se non c'è) il pixel nuovo del blocco
    vec4 r = (nuovo || !combacia) ? vec4(c.rgb, s) : vec4(h.rgb * u_q.w, sh); o_a = r; o_b = vec4(1.0); return; }
  float n = combacia ? min(texture(u_stB, uvp).r, mix(u_q.x, u_q.y, smoothstep(0.05, 1.0, vel))) + 1.0 : 1.0, w = 1.0 / n;
  o_a = vec4(mix(h.rgb * u_q.w, c.rgb, w), combacia ? mix(sh, s, w) : s); o_b = vec4(n, 0.0, 0.0, 1.0);
}`;

// lo sfasamento del fotogramma k: la successione additiva col rapporto aureo (nella prima componente) e la R2 di Roberts
// (la generalizzazione a due dimensioni, nella seconda)
export const sfasatura = (k) => [(0.5 + k * 0.6180339887498949) % 1, (0.5 + k * 0.7548776662466927) % 1, (0.5 + k * 0.5698402909980532) % 1];
export const accumuloAttivo = (N) => !!(N.vista.accumulo && N.vista.accumulo.attivo && N.stato.conVirgola);

// una storia: due coppie d'immagini (si legge dall'una e si scrive sull'altra)
export function creaStoria(N) {
  const gl = N.gl; let prg = null, w = 0, h = 0, cur = 0, piena = false, prima = null; const A = [null, null], B = [null, null], F = [null, null];
  const fmt = gl.getExtension('OES_texture_float_linear') ? 'rgba32f' : 'rgba16f';
  const u9 = new Float32Array(9), u9p = new Float32Array(9);
  function prepara(W, H) {
    if (W === w && H === h && A[0]) return; libera(); w = W; h = H; piena = false;
    for (let i = 0; i < 2; i++) { A[i] = N.immagine(w, h, fmt, null); B[i] = N.immagine(w, h, fmt, null, { filtro: gl.NEAREST }); F[i] = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, F[i]); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, A[i], 0); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, B[i], 0); }
  }
  function libera() { for (let i = 0; i < 2; i++) { if (A[i]) gl.deleteTexture(A[i]); if (B[i]) gl.deleteTexture(B[i]); if (F[i]) gl.deleteFramebuffer(F[i]); A[i] = B[i] = F[i] = null; } w = h = 0; piena = false; }
  return {
    get w() { return w; }, get h() { return h; }, get immagine() { return A[cur]; },
    azzera() { piena = false; },
    // img: l'immagine di adesso (rgb, distanza); W, H: i lati della storia (per 'intreccio' il doppio di quelli di img);
    // occhio: [x, y, z] (doppia precisione) e raggi (3×3 per righe, dagli assi dell'occhio a quelli dello strato), nel
    // riferimento dello strato; quale: il pixel del blocco calcolato adesso; distanza: > 0 per dare a tutti la stessa
    risolvi(S, img, W, H, { occhio, raggi, modo = 'media', quale = 0, distanza = 0 }) {
      const Q = N.vista.accumulo || {}; prepara(W, H); if (!prg) prg = N.programma(V_Q, F_RISOLVI); const u = prg.u, leggi = cur, scrivi = 1 - cur, salvata = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = raggi[3 * r + c]; // (per colonne)
      let sposta = [0, 0, 0], tanP = [S.tanX, S.tanY], scala = 1, c = piena && prima;
      if (c) { sposta = [occhio[0] - prima.occhio[0], occhio[1] - prima.occhio[1], occhio[2] - prima.occhio[2]]; for (let i = 0; i < 9; i++) u9p[i] = prima.raggi[i]; tanP = prima.tan; scala = prima.E0 / S.E0; if (!(isFinite(sposta[0] + sposta[1] + sposta[2]) && isFinite(scala))) c = false; }
      // (u_primaT: la trasposta degli assi di prima, per colonne = gli assi di prima per righe)
      gl.bindFramebuffer(gl.FRAMEBUFFER, F[scrivi]); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]); gl.viewport(0, 0, w, h); gl.disable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.SCISSOR_TEST);
      gl.useProgram(prg.p); N.lega(0, img, u.u_cor); N.lega(1, A[leggi], u.u_stA); N.lega(2, B[leggi], u.u_stB);
      gl.uniformMatrix3fv(u.u_ora, false, u9); gl.uniformMatrix3fv(u.u_primaT, false, c ? u9p : u9.map((_, i) => raggi[i]));
      gl.uniform3f(u.u_sposta, sposta[0], sposta[1], sposta[2]); gl.uniform4f(u.u_tan, S.tanX, S.tanY, tanP[0], tanP[1]);
      gl.uniform4f(u.u_q, Math.max(1, Q.ferma || 64) - 1, Math.max(1, Q.moto || 4) - 1, Q.tolleranza || 0.15, scala);
      gl.uniform4f(u.u_m, modo === 'intreccio' ? 1 : 0, quale, c ? 1 : 0, distanza); gl.uniform2f(u.u_lati, w, h); S.schermo();
      gl.drawBuffers([gl.COLOR_ATTACHMENT0]); gl.bindFramebuffer(gl.FRAMEBUFFER, salvata);
      prima = { occhio: occhio.slice(), raggi: raggi.slice(), tan: [S.tanX, S.tanY], E0: S.E0 }; piena = true; cur = scrivi; return A[cur];
    },
    // PER LE PROVE: ciò che la storia contiene adesso (rgb, distanza), w × h × 4
    leggi() { const px = new Float32Array(w * h * 4), salvata = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, F[cur]); gl.readBuffer(gl.COLOR_ATTACHMENT0); gl.readPixels(0, 0, w, h, gl.RGBA, gl.FLOAT, px); gl.bindFramebuffer(gl.FRAMEBUFFER, salvata); return px; },
    libera() { libera(); if (prg) gl.deleteProgram(prg.p); prg = null; },
  };
}
