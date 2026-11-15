// minori.js — I CORPI MINORI di un sistema planetario, per il motore 3D (nucleo.js): lo strato che sistema.js monta
// accanto alla stella e ai pianeti. Ciò che c'è lo dice il mondo (spazio3d.js `scenaSistema(…).vuoto()`: vuoto.js,
// vuoto_sistema.js `corpiMinori`); lo prepara minori.worker.js fuori dal filo dell'interfaccia. Qui lo si disegna com'è,
// con l'esposizione dell'occhio del motore (S.E0) e nient'altro.
//
//  · LA POLVERE (luce zodiacale e polvere fine delle fasce: un campo solo, `polvere.sezione(r, lat)`): un volume che
//    diffonde la luce della stella. Per ogni punto dello schermo si cammina lungo il raggio (passata 'fondo', su
//    un'immagine più piccola) e si somma
//      π·I/E0 = Σ_colonne [L·albedo / (4·σ·√(2π)·E0)] · τ(r) · campana(latitudine; σ) · Φ(θ) · ds/r³      (lunghezze in UA)
//    (sezione dei grani per volume τ(r)·campana/(σ√(2π)·r), luce L/4πr², funzione di fase Φ per steradiante). Lungo il
//    raggio si usa l'angolo φ visto dalla stella (s = b·tan φ): ds/r³ = cos φ·dφ/b² e l'angolo di diffusione è
//    θ = π/2 + φ, così Φ(θ)·cos φ — ciò che cambia in fretta, col lobo in avanti — si somma una volta in una tabella
//    F(θ) e a ogni passo vale F(φ₂) − F(φ₁), esatto; i pochi passi (N.vista.passi.minori) servono alla campana della
//    latitudine e a τ(r), con passi a parte dove il raggio attraversa le fasce (là τ cambia in fretta). `riscontro()`
//    rifà la somma sulla CPU: deve ridare `polvere.luceZodiacale` del mondo. La polvere non toglie luce (τ è piccola).
//  · I CORPI DELLE FASCE: ognuno sulla sua orbita (Keplero, col tempo del motore), un corpo del nucleo (ci si può
//    attaccare). Riflette la luce della stella con l'albedo geometrico e la legge di fase dei dati (H–G; i nuclei
//    delle comete: lineare in magnitudini): da lontano un punto di luce (luci.js) con L = L★·(R/r)²·albedo·fase(α);
//    quando è più largo di un punto dello schermo, la sfera di pianeta.js (di Lambert, con la riflettanza che dà lo
//    stesso albedo geometrico: 3/2 di quello). Un corpo di 50 km si vede solo da vicino: chi è troppo lontano per
//    mandare luce che l'occhio veda non costa niente (lo si scarta dal suo semiasse, senza risolvere l'orbita) e non
//    è un bersaglio.
//  · LE COMETE: il nucleo come gli altri corpi; chioma, coda di ioni e coda di polvere come batuffoli a campana
//    (minori.worker.js), disegnati senza camminare: per un batuffolo lontano la sua proiezione sullo schermo (una campana
//    in due dimensioni che conserva la luce: anche se è più piccolo di un punto); per uno in cui si è dentro, o a meno
//    di 8 delle sue larghezze, la somma lungo il raggio in forma chiusa (∫₀^∞ di una campana: erfc) su un'immagine più
//    piccola. I grani diffondono con la funzione di fase dei dati (molto in avanti), il gas brilla di suo nelle sue
//    righe. Le code girano con la cometa (il loro riferimento la segue: via dalla stella, lungo l'orbita); forma e luce
//    si richiedono al lavoratore quando il tempo è andato avanti. Una cometa la cui luce sta sotto la soglia
//    dell'occhio non si disegna.
// Che cosa NON c'è: l'ombra dei pianeti sulla polvere e la polvere davanti ai pianeti (sta nel fondo); la nube esterna
// (corpi di chilometri a migliaia di UA: non mandano luce che si veda, e non sono elencati uno per uno).
import { V } from './nucleo.js';
import { V_SFERA, F_SFERA } from './pianeta.js';
import { creaPunti } from './luci.js';
import { faseHG } from '../camera/vuoto_sistema.js';

const UA = 1.495978707e11, EL = 18, NB = 12, NT = 512, PASSI_MAX = 48, PI = Math.PI, PI2 = 2 * PI;
const SOGLIA = 4e-5; // sotto questo valore (in «fogli bianchi») una luce diffusa non lascia traccia sullo schermo

// ---------- Keplero: posizione e velocità (rispetto alla stella, assi del sistema) dagli elementi di minori.worker.js
// (E − e·sen E = M risolta senza perdere cifre anche per le comete, e → 1: partenza dalla cubica, Newton sulle forme stabili)
function stato(el, k, t, p, v) {
  const a = el[k], e = el[k + 1], q = 1 - e, n = el[k + 3]; let M = el[k + 2] + n * t; M -= PI2 * Math.round(M / PI2); let E;
  if (e < 0.8) E = M + e * Math.sin(M); else { const m = Math.abs(M); let x = Math.cbrt((6 * m) / e); for (let i = 0; i < 4; i++) x -= ((e * x * x * x) / 6 + q * x - m) / ((e * x * x) / 2 + q); E = Math.min(PI, x) * Math.sign(M); }
  for (let i = 0; i < 30; i++) { const ms = Math.abs(E) < 0.2 ? ((E * E * E) / 6) * (1 - ((E * E) / 20) * (1 - (E * E) / 42)) : E - Math.sin(E), s = Math.sin(E / 2), d = (q * E + e * ms - M) / (q + 2 * e * s * s); E -= d; if (Math.abs(d) < 1e-15 * Math.max(1, Math.abs(E))) break; }
  const sh = Math.sin(E / 2), sE = Math.sin(E), b = Math.sqrt(1 - e * e), x = a * (q - 2 * sh * sh), y = a * b * sE;
  p[0] = x * el[k + 4] + y * el[k + 7]; p[1] = x * el[k + 5] + y * el[k + 8]; p[2] = x * el[k + 6] + y * el[k + 9];
  if (v) { const den = q + 2 * e * sh * sh, vx = (-a * n * sE) / den, vy = (a * n * b * (1 - 2 * sh * sh)) / den; v[0] = vx * el[k + 4] + vy * el[k + 7]; v[1] = vx * el[k + 5] + vy * el[k + 8]; v[2] = vx * el[k + 6] + vy * el[k + 9]; }
  return p;
}
// la funzione di fase dei grani (per steradiante: su tutte le direzioni fa 1): la somma di Henyey–Greenstein dei dati
function faseGrani(g, pesi, theta) { const c = Math.cos(theta); let s = 0; for (let k = 0; k < g.length; k++) s += (pesi[k] * (1 - g[k] * g[k])) / (4 * PI * Math.pow(1 + g[k] * g[k] - 2 * g[k] * c, 1.5)); return s; }
// la legge di fase di un corpo all'angolo di fase alfa (1 a fase zero): H–G (tipo 1, parametro G), lineare in magnitudini
// per grado (tipo 2: i nuclei delle comete), o, se i dati non la danno, quella di una sfera di Lambert
const faseCorpo = (tipo, par, alfa) => (tipo === 1 ? faseHG(alfa, par) : tipo === 2 ? Math.pow(10, -0.4 * par * ((alfa * 180) / PI)) : (Math.sin(alfa) + (PI - alfa) * Math.cos(alfa)) / PI);

const V_Q = `out vec2 v_uv; void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); v_uv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
const F_COPIA = `in vec2 v_uv; uniform sampler2D u_img; uniform vec3 u_tinta; out vec4 o_col; void main() { o_col = vec4(texture(u_img, v_uv).rgb * u_tinta, 0.0); }`;
const NFASE = 256; // la tabella della funzione di fase sommata: θ = π·w², w da 0 a 1 (fitta verso la stella, dove cambia in fretta)
const F_POLVERE = `
in vec2 v_uv; out vec4 o_col;
uniform vec3 u_occhio;     // l'occhio rispetto alla stella, negli assi del sistema, in UA
uniform mat3 u_raggi;      // dagli assi dell'occhio a quelli del sistema
uniform vec4 u_cam;        // tangenti di metà campo; quanti passi dentro le fasce; quanti in ogni tratto che le attraversa
uniform vec4 u_lim;        // (UA) dove i grani evaporano; l'ultima fascia; sen² della latitudine oltre cui non c'è niente; dove cominciano le fasce
uniform vec4 u_k;          // per colonna (una per larghezza in latitudine): L·albedo/(4·σ·√(2π)·UA²·E0)
uniform vec4 u_sig;        // per colonna: 1/(2σ²)
uniform float u_log;       // 1/ln(r_fuori/r_dentro)
uniform sampler2D u_tau;   // τ(r) per colonna, a passo costante nel logaritmo di r
uniform sampler2D u_fase;  // F(θ) = ∫₀^θ Φ·sen θ dθ
float caso(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float sommata(float fi) { float w = sqrt(clamp(0.5 + fi * 0.31830989, 0.0, 1.0)) * ${NFASE - 1}.0, i = min(floor(w), ${NFASE - 2}.0); return mix(texelFetch(u_fase, ivec2(int(i), 0), 0).r, texelFetch(u_fase, ivec2(int(i) + 1, 0), 0).r, w - i); }
vec4 tau(float r) { float x = clamp(log(r / u_lim.x) * u_log, 0.0, 1.0) * ${NT - 1}.0, i = min(floor(x), ${NT - 2}.0); return mix(texelFetch(u_tau, ivec2(int(i), 0), 0), texelFetch(u_tau, ivec2(int(i) + 1, 0), 0), x - i); }
// un tratto del raggio, da ta a tb, in n passi. Con φ l'angolo visto dalla stella (s = b·tan φ): r = b/cos φ,
// ds/r³ = cos φ·dφ/b², θ = π/2 + φ, e il seno della latitudine è (z₀·cos φ + d_z·b·sen φ)/b
float tratto(float ta, float tb, int n, float tc, float b, float zb, float dz, float g) {
  if (tb <= ta || n < 1) return 0.0; float f0 = atan((ta - tc) / b), f1 = atan((tb - tc) / b), prima = f0, somma = 0.0, Fp = sommata(f0);
  for (int i = 0; i < ${PASSI_MAX}; i++) { if (i >= n) break;
    float fi = f0 + (f1 - f0) * (float(i) + 1.0) / float(n), df = fi - prima, fm = prima + df * (0.35 + 0.3 * g), Fn = sommata(fi); prima = fi;
    float sf = sin(fm), cf = max(cos(fm), 1e-4), sl = zb * cf + dz * sf; // (per angoli piccoli la latitudine è il suo seno)
    somma += dot(u_k * tau(b / cf), exp(-sl * sl * u_sig)) * (Fn - Fp); Fp = Fn; }
  return somma;
}
// un tratto dentro il cuneo: se passa sotto il raggio dove cominciano le fasce, in tre pezzi (fasce, dentro, fasce)
float pezzi(float x0, float x1, float tc, float b, float zb, float dz, float g) {
  if (x1 <= x0) return 0.0; int n = int(u_cam.z), nf = int(u_cam.w); float h2 = u_lim.w * u_lim.w - b * b; if (h2 <= 0.0) return tratto(x0, x1, n, tc, b, zb, dz, g);
  float h = sqrt(h2), s0 = tc - h, s1 = tc + h; return tratto(x0, min(x1, s0), nf, tc, b, zb, dz, g) + tratto(max(x0, s0), min(x1, s1), n, tc, b, zb, dz, g) + tratto(max(x0, s1), x1, nf, tc, b, zb, dz, g);
}
void main() {
  vec3 d = normalize(u_raggi * vec3((v_uv * 2.0 - 1.0) * u_cam.xy, -1.0)), o = u_occhio; o_col = vec4(0.0, 0.0, 0.0, 1.0);
  float tc = -dot(o, d); vec3 pc = o + d * tc; float b = max(length(pc), 0.2 * u_lim.x), h2 = u_lim.y * u_lim.y - b * b; if (h2 <= 0.0) return;
  float h = sqrt(h2), t0 = max(0.0, tc - h), t1 = tc + h, a0 = t0, a1 = t1, b0 = 0.0, b1 = -1.0;
  // il cuneo in latitudine: z² ≤ q·r² lungo il raggio, cioè A·t² + 2B·t + C ≤ 0. Un raggio ripido lo attraversa una volta
  // (tra le due radici); uno più radente del cuneo ci sta dentro fuori dalle radici: se parte da fuori entra alla seconda,
  // se parte da dentro esce alla prima e rientra alla seconda (passando sopra la stella): due tratti
  float q = u_lim.z, A = d.z * d.z - q, B = o.z * d.z - q * dot(o, d), C = o.z * o.z - q * dot(o, o), disc = B * B - A * C;
  if (A > 1e-6) { if (disc <= 0.0) return; float s = sqrt(disc); a0 = max(t0, (-B - s) / A); a1 = min(t1, (-B + s) / A); }
  else if (A < -1e-6 && disc > 0.0) { float s = sqrt(disc), r1 = (-B + s) / A, r2 = (-B - s) / A; if (C > 0.0) a0 = max(t0, r2); else if (r1 > 0.0) { a1 = min(t1, r1); b0 = max(t0, r2); b1 = t1; } }
  float g = caso(gl_FragCoord.xy), zb = pc.z / b, somma = pezzi(a0, a1, tc, b, zb, d.z, g); if (b1 > b0) somma += pezzi(b0, b1, tc, b, zb, d.z, g);
  o_col = vec4(vec3(somma / (b * b)), 1.0);
}`;
// i batuffoli delle comete: un quadrato per batuffolo (a istanze)
const V_BLOB = `
in vec3 a_c; in vec3 a_ax; in vec2 a_s; in vec4 a_l;   // centro e asse (riferimento della cometa, metri); σ di traverso e lungo l'asse; luce e classe
uniform vec3 u_C; uniform mat3 u_quadro, u_vista;      // il nucleo rispetto all'occhio; dal riferimento della cometa al mondo; dal mondo all'occhio
uniform vec4 u_cam;        // tangenti di metà campo; fuoco (pixel); u_fc
uniform vec4 u_k;          // 1/(4·E0); la passata (0: i lontani, sull'immagine intera; 1: i vicini, sull'immagine piccola); la soglia; 0
uniform vec2 u_tela;       // lati dell'immagine intera (pixel)
uniform vec3 u_fase;       // 4π × la funzione di fase dei grani all'angolo da cui si guarda la cometa, per la tinta della luce
flat out int v_modo; flat out vec3 v_l, v_con, v_e, v_asse; flat out float v_k; out vec2 v_d;
void main() {
  vec2 ang = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec3 e = u_vista * (u_C + u_quadro * a_c), ax = u_vista * (u_quadro * a_ax); float s1 = a_s.x, s2 = a_s.y, d = length(e), zc = -e.z; int cl = int(a_l.a + 0.5);
  vec3 L = cl == 0 ? a_l.rgb : a_l.rgb * u_fase;
  // l'occhio nella metrica del batuffolo (lunghezze in σ di traverso, l'asse accorciato di σ₁/σ₂): a meno di 8 σ si è «dentro»
  vec3 ep = (e + (s1 / s2 - 1.0) * dot(e, ax) * ax) / s1; bool vicino = dot(ep, ep) < 64.0;
  v_modo = 0; v_l = vec3(0.0); v_con = vec3(0.0); v_e = vec3(0.0); v_asse = ax; v_k = 0.0; v_d = vec2(0.0); gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  if (vicino) { if (u_k.y < 0.5) return; // dentro o quasi: tutto lo schermo, la somma lungo il raggio in forma chiusa
    vec3 amp = L * u_k.x * 0.0634936 / (s1 * s2); if (max(amp.r, max(amp.g, amp.b)) * 2.5066 * s2 / s1 < u_k.z) return;
    v_modo = 1; v_l = amp; v_e = ep; v_k = s1 / s2; gl_Position = vec4(ang, 0.0, 1.0); return; }
  if (u_k.y > 0.5 || zc <= 0.0) return;
  // lontano: la campana proiettata (S = J·Σ·Jᵀ in pixel², più mezzo pixel perché un batuffolo più piccolo di un punto resti un punto con la sua luce)
  float f = u_cam.z / zc, tx = e.x / zc, ty = e.y / zc; vec2 ja = f * vec2(ax.x + ax.z * tx, ax.y + ax.z * ty); float q1 = s1 * s1 * f * f, q2 = s2 * s2 - s1 * s1;
  float sxx = q1 * (1.0 + tx * tx) + q2 * ja.x * ja.x + 0.25, sxy = q1 * tx * ty + q2 * ja.x * ja.y, syy = q1 * (1.0 + ty * ty) + q2 * ja.y * ja.y + 0.25, det = max(sxx * syy - sxy * sxy, 1e-12);
  vec3 amp = L * (u_k.x * u_cam.z * u_cam.z / (d * d * 6.2831853 * sqrt(det))); if (max(amp.r, max(amp.g, amp.b)) < u_k.z) return;
  float mid = 0.5 * (sxx + syy), rad = sqrt(max(mid * mid - det, 0.0)), l1 = mid + rad, l2 = max(mid - rad, 0.25); vec2 v1 = abs(sxy) > 1e-9 * mid ? normalize(vec2(sxy, l1 - sxx)) : (sxx >= syy ? vec2(1.0, 0.0) : vec2(0.0, 1.0));
  vec2 off = 3.3 * (ang.x * sqrt(l1) * v1 + ang.y * sqrt(l2) * vec2(-v1.y, v1.x));
  v_l = amp; v_con = vec3(syy, -sxy, sxx) / det; v_d = off;
  gl_Position = vec4((vec2(tx, ty) * u_cam.z * 2.0 + 2.0 * off) / u_tela, log2(max(1e-6, 1.0 + zc)) * u_cam.w - 1.0, 1.0);
}`;
const F_BLOB = `
flat in int v_modo; flat in vec3 v_l, v_con, v_e, v_asse; flat in float v_k; in vec2 v_d; out vec4 o_col;
uniform vec4 u_cam; uniform vec2 u_telo;   // i lati dell'immagine su cui si disegna (per il raggio di ogni punto, da vicino)
void main() {
  // (la campana è tagliata a 3,3 σ: le si toglie il valore del bordo, così non resta lo spigolo del quadrato)
  if (v_modo == 0) { float q = v_con.x * v_d.x * v_d.x + 2.0 * v_con.y * v_d.x * v_d.y + v_con.z * v_d.y * v_d.y; if (q > 10.89) discard; o_col = vec4(v_l * (exp(-0.5 * q) - 0.00432) * 1.00434, 0.0); return; }
  // ∫₀^∞ exp(−½|e′ − t·d′|²) dt = e^(−½·p²)·√(π/2A)·erfc(B/√(2A)): e′, d′ nella metrica del batuffolo, A = d′·d′, B = −d′·e′,
  // p² = |e′ × d′|²/A la distanza del raggio dal centro (col prodotto vettore: non perde cifre quando il centro è lontano)
  vec3 d = normalize(vec3((gl_FragCoord.xy / u_telo * 2.0 - 1.0) * u_cam.xy, -1.0)), dp = d + (v_k - 1.0) * dot(d, v_asse) * v_asse, cr = cross(v_e, dp);
  float A = dot(dp, dp), B = -dot(dp, v_e), x = B / sqrt(2.0 * A), ax = abs(x), t = 1.0 / (1.0 + 0.3275911 * ax);
  float pol = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * exp(-x * x); // erfc(|x|)
  o_col = vec4(v_l * (exp(-0.5 * dot(cr, cr) / A) * (x >= 0.0 ? pol : 2.0 - pol) * sqrt(1.5707963 / A)), 0.0);
}`;

export function creaMinori(N, { via, nodo, stella, luminosita, raggioStella, T = 0, coloreLuce = [1, 1, 1], opzioni = {} } = {}) {
  const gl = N.gl, O = { passi: 10, passiFasce: 4, massimoComete: 64, ...opzioni }, L = luminosita, limite = 30 * (nodo.influenza || 40 * UA);
  const st = { pronto: false, acceso: true, parti: { polvere: true, corpi: true, comete: true } /* (per le prove: spegnere una parte) */, errore: null, ms: 0, richieste: 0, mancanti: [], polvere: null, nCorpi: 0, nComete: 0, visti: { polvere: false, valorePolvere: 0, corpi: 0, sfere: 0, comete: 0, batuffoli: 0 } };
  if (!(L > 0)) return { stato: st, corpi: [], comete: () => [], libera() {} }; // (una stella spenta non illumina niente)
  let filo = null, inCorso = false, tDati = NaN, ultima = 0, nRichiesta = 0, dati = null;
  // ---------- ciò che si disegna
  const punti = creaPunti(N); let insieme = null, posP = null, luceP = null;
  let prgPolvere = null, prgCopia = null, prgBlob = null, prgSfera = null, quadrato = null;
  const u9 = new Float32Array(9);
  // l'immagine piccola per i volumi (la polvere; i batuffoli in cui si è dentro) e la sua aggiunta a ciò che c'è
  // (la polvere è liscia: la sua è ancora due volte più piccola per lato)
  const immaginePiccola = (ancora) => ({ img: null, tel: null, w: 0, h: 0, prima: null,
    apri(S, pulisci) { const r = Math.max(1, N.vista.riduzione || 2) * ancora, W = Math.max(8, Math.ceil(S.W / r)), H = Math.max(8, Math.ceil(S.H / r)); if (W !== this.w || H !== this.h) { if (this.img) { gl.deleteTexture(this.img); gl.deleteFramebuffer(this.tel); } this.w = W; this.h = H; this.img = N.immagine(W, H, N.conVirgola ? 'rgba16f' : 'rgba8', null); this.tel = N.telaio(this.img, null); }
      this.prima = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, this.tel); gl.viewport(0, 0, this.w, this.h); if (pulisci) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } },
    // (`ritaglio` [x0, y0, x1, y1] da 0 a 1: solo quel rettangolo dello schermo — ciò che si è disegnato sta lì dentro)
    ritaglia(q, W, H) { const x0 = Math.max(0, Math.floor(q[0] * W) - 1), y0 = Math.max(0, Math.floor(q[1] * H) - 1); gl.enable(gl.SCISSOR_TEST); gl.scissor(x0, y0, Math.max(1, Math.min(W, Math.ceil(q[2] * W) + 1) - x0), Math.max(1, Math.min(H, Math.ceil(q[3] * H) + 1) - y0)); },
    chiudi(S, tinta, ritaglio = null) { if (!prgCopia) prgCopia = N.programma(V_Q, F_COPIA); gl.bindFramebuffer(gl.FRAMEBUFFER, this.prima); gl.viewport(0, 0, S.W, S.H); if (ritaglio) this.ritaglia(ritaglio, S.W, S.H); gl.useProgram(prgCopia.p); N.lega(0, this.img, prgCopia.u.u_img); gl.uniform3f(prgCopia.u.u_tinta, tinta[0], tinta[1], tinta[2]); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); S.schermo(); },
    libera() { if (this.img) { gl.deleteTexture(this.img); gl.deleteFramebuffer(this.tel); } } }), piccola = immaginePiccola(1), piccolaPolvere = immaginePiccola(2);
  // una tabella per la scheda grafica: una riga di numeri a 32 bit (quattro per punto), letta punto per punto
  const tabella = (n, v) => { const img = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, img); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, n, 1, 0, gl.RGBA, gl.FLOAT, v); for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, k, gl.NEAREST); for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE); return img; };

  // ---------- la polvere: le tabelle (una volta: il campo non cambia col tempo), e la stessa somma dello shader sulla CPU
  let Pv = null; // { …dati.polvere, rIn, rOut, rFasce (UA), tauImg, faseImg }
  function preparaPolvere(P) {
    if (Pv || !P.n || !(P.albedo > 0)) return; const som = new Float32Array(4 * NFASE), GX = [-0.8611363116, -0.3399810436, 0.3399810436, 0.8611363116], GW = [0.3478548451, 0.6521451549, 0.6521451549, 0.3478548451]; let s = 0;
    // F(θ) = ∫₀^θ Φ·sen θ dθ (θ = π·w²; quattro punti di Gauss per tratto)
    for (let i = 1; i < NFASE; i++) { const ta = PI * ((i - 1) / (NFASE - 1)) ** 2, tb = PI * (i / (NFASE - 1)) ** 2; for (let j = 0; j < 4; j++) { const th = 0.5 * (ta + tb) + 0.5 * (tb - ta) * GX[j]; s += 0.5 * (tb - ta) * GW[j] * Math.sin(th) * faseGrani(P.g, P.pesi, th); } som[4 * i] = s; }
    Pv = { ...P, uIn: P.rIn / UA, uOut: P.rOut / UA, uFasce: P.rFasce / UA, tauImg: tabella(NT, P.tab), faseImg: tabella(NFASE, som), lnr: 1 / Math.log(P.rOut / P.rIn), sMax: Math.max(...P.sigma) };
  }
  // la brillanza (W/m²/sr) lungo un raggio: o (UA, assi del sistema, dalla stella), d (versore); n passi uguali in φ
  function radianza(o, d, n = 40) {
    const P = Pv; if (!P) return 0; const tc = -(o[0] * d[0] + o[1] * d[1] + o[2] * d[2]), pc = [o[0] + d[0] * tc, o[1] + d[1] * tc, o[2] + d[2] * tc], b = Math.max(Math.hypot(pc[0], pc[1], pc[2]), 0.2 * P.uIn), h2 = P.uOut * P.uOut - b * b; if (h2 <= 0) return 0;
    const h = Math.sqrt(h2), t0 = Math.max(0, tc - h), t1 = tc + h; if (t1 <= t0) return 0; const f0 = Math.atan((t0 - tc) / b), df = (Math.atan((t1 - tc) / b) - f0) / n, zb = pc[2] / b; let somma = 0;
    for (let i = 0; i < n; i++) { const fm = f0 + (i + 0.5) * df, cf = Math.cos(fm), r = b / cf; if (r <= P.uIn || r >= P.uOut) continue; const sl = zb * cf + d[2] * Math.sin(fm), x = Math.log(r / P.uIn) * P.lnr * (NT - 1), j = Math.min(NT - 2, Math.floor(x)), fx = x - j; let dens = 0;
      for (let q = 0; q < P.n; q++) dens += ((P.tab[4 * j + q] * (1 - fx) + P.tab[4 * j + 4 + q] * fx) * Math.exp((-sl * sl) / (2 * P.sigma[q] * P.sigma[q]))) / (P.sigma[q] * Math.sqrt(PI2));
      somma += dens * faseGrani(P.g, P.pesi, PI / 2 + fm) * cf * df; }
    return ((L * P.albedo) / (4 * PI * UA * UA)) * (somma / (b * b));
  }

  // ---------- i corpi delle fasce e le comete: corpi del nucleo, figli della stella
  let fasce = null; const corpi = [], comete = new Map(), _p = [0, 0, 0], _pv = [0, 0, 0];
  const corpoDa = (el, k, nome, raggio, periodo) => N.corpo({ nome, genitore: stella, raggio, solido: true, influenza: 0, periodi: periodo > 0 ? { giro: 0, orbita: periodo } : null,
    posizione: (t, out) => stato(el, k, t, out, null), velocita: (t, out) => { stato(el, k, t, _pv, out); return out; } });
  // quanto può mandare al più (W, come sorgente uguale in ogni direzione) un corpo: al pericentro, a fase zero
  const luceMassima = (el, k) => L * (el[k + 10] / (el[k] * (1 - el[k + 1]))) ** 2 * Math.max(el[k + 11], el[k + 12], el[k + 13]);
  function arrivati(d) {
    inCorso = false; if (d.errore) { st.errore = d.errore; console.error('i corpi minori non si sono potuti preparare:', d.errore); return; }
    if (d.n !== nRichiesta) return; dati = d; tDati = d.t; st.pronto = true; st.ms = d.ms; st.mancanti = d.mancanti; st.polvere = d.polvere; preparaPolvere(d.polvere);
    if (d.corpi && !fasce) { fasce = d.corpi; const el = fasce.el; fasce.Lmax = new Float64Array(fasce.n); fasce.scheda = [];
      for (let k = 0; k < fasce.n; k++) { fasce.Lmax[k] = luceMassima(el, k * EL); const c = corpoDa(el, k * EL, `${fasce.cosa[k]} (${fasce.fascia[k]})`, el[k * EL + 10], el[k * EL + 15]); corpi.push(c); fasce.scheda.push({ corpo: c, k: k * EL, el, rel: [0, 0, 0], sole: [1, 0, 0], E: 0, cometa: null }); }
      st.nCorpi = fasce.n; }
    // le comete: quelle nuove nascono, quelle uscite dall'elenco se ne vanno; le altre cambiano forma e luce
    const viste = new Set();
    for (const c of (d.comete.length > O.massimoComete ? [...d.comete].sort((x, y) => y.acquaKgS - x.acquaKgS) : d.comete).slice(0, O.massimoComete)) { viste.add(c.id); let m = comete.get(c.id); // (se sono troppe: le più attive)
      if (!m) { const corpo = corpoDa(c.el, 0, `cometa (${c.id.split('/').slice(-2).join(' ')})`, c.raggio, 0), vao = gl.createVertexArray(), buf = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        for (const [i, n, o] of [[0, 3, 0], [1, 3, 12], [2, 2, 24], [3, 4, 32]]) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 4 * NB, o); gl.vertexAttribDivisor(i, 1); } gl.bindVertexArray(null);
        m = { id: c.id, corpo, el: c.el, k: 0, vao, buf, capienza: 0, rel: [0, 0, 0], sole: [1, 0, 0], E: 0, quadro: new Float32Array(9), fase: [0, 0, 0], disegna: false, cometa: null }; m.cometa = m; m.Lmax = luceMassima(c.el, 0); comete.set(c.id, m); }
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buf); if (c.blob.length > m.capienza) { gl.bufferData(gl.ARRAY_BUFFER, c.blob, gl.DYNAMIC_DRAW); m.capienza = c.blob.length; } else if (c.blob.length) gl.bufferSubData(gl.ARRAY_BUFFER, 0, c.blob);
      m.d = c; m.nb = c.nb; m.fase0 = 4 * PI * faseGrani(c.g, c.pesi, 0); }
    for (const [id, m] of comete) if (!viste.has(id)) { N.togliCorpo(m.corpo); gl.deleteBuffer(m.buf); gl.deleteVertexArray(m.vao); comete.delete(id); }
    st.nComete = comete.size; const quanti = (fasce ? fasce.n : 0) + comete.size;
    if (!insieme || insieme.capienza < quanti) { if (insieme) insieme.libera(); const cap = Math.max(64, 2 * quanti); insieme = punti.insieme(cap); posP = new Float32Array(3 * cap); luceP = new Float32Array(4 * cap); }
    N.cambia();
  }
  function chiedi(t) { if (!filo || inCorso || st.errore) return; inCorso = true; ultima = performance.now(); st.richieste++; filo.postMessage({ n: ++nRichiesta, via: { cosmo: via.cosmo, galassia: via.galassia, stella: via.stella }, t, corpi: !fasce, stella: { L, R: raggioStella, T } }); }
  try { filo = new Worker(new URL('./minori.worker.js', import.meta.url), { type: 'module' }); filo.onmessage = (e) => arrivati(e.data); filo.onerror = (e) => { inCorso = false; st.errore = e.message || 'il lavoratore dei corpi minori non parte'; }; chiedi(N.tempo.t); } catch (e) { st.errore = String(e); }

  // ---------- un fotogramma
  const oSys = [0, 0, 0], oUA = [0, 0, 0], relS = [0, 0, 0], sfere = [], daDisegnare = []; let nPunti = 0, Qs = V.identita(), polv = null, lontano = false, giro = 0, Imax = 0, giroImax = -100;
  // un corpo che si vede (una scheda delle fasce o una cometa): punto di luce o sfera, bersaglio, e la camera gli si può attaccare
  function mostra(S, m, el, k, px) {
    const R = el[k + 10]; S.versoCorpo(m.corpo, m.rel); const d = V.lungo(m.rel) || 1, vs = N.tra(m.corpo, stella, S.t), r2 = V.scal(vs, vs); V.norma(vs, m.sole); m.E = L / (4 * PI * r2);
    S.bersaglio({ p: m.rel, raggio: R, corpo: m.corpo }); if (!m.cometa) m.corpo.influenza = d < 200 * R ? 30 * R : 0;
    if (R / d > 0.56 * px) { sfere.push(m, R, k, el); st.visti.sfere++; return; }
    if (nPunti >= insieme.capienza) return; const alfa = Math.acos(Math.max(-1, Math.min(1, -(m.sole[0] * m.rel[0] + m.sole[1] * m.rel[1] + m.sole[2] * m.rel[2]) / d))), f = ((L * R * R) / r2) * faseCorpo(el[k + 16], el[k + 17], alfa);
    posP.set(m.rel, 3 * nPunti); luceP.set([f * el[k + 11] * coloreLuce[0], f * el[k + 12] * coloreLuce[1], f * el[k + 13] * coloreLuce[2], 1], 4 * nPunti); nPunti++; st.visti.corpi++;
  }
  const _d = [0, 0, 0];
  const strato = {
    nome: 'minori',
    aggiorna(S) {
      const v = st.visti; v.polvere = false; v.corpi = v.sfere = v.comete = v.batuffoli = 0; polv = null; nPunti = 0; sfere.length = 0; daDisegnare.length = 0; giro++;
      if (!st.acceso || !dati) return;
      S.versoCorpo(stella, relS); const dS = V.lungo(relS), px = (2 * S.tanY) / S.H; Qs = N.quadro(stella, S.t) || V.identita(); V.tv(Qs, [-relS[0], -relS[1], -relS[2]], oSys); oUA[0] = oSys[0] / UA; oUA[1] = oSys[1] / UA; oUA[2] = oSys[2] / UA;
      // --- la polvere: la si disegna se è più larga di due punti dello schermo, se è nel campo, e se dove brilla di più (lo
      // si vede provando quindici raggi sparsi sullo schermo: ogni sei fotogrammi) vale più della soglia dell'occhio
      if (Pv && st.parti.polvere && Pv.rOut > 2 * px * dS) { const A = S.assi; let nelCampo = true, ritaglio = null;
        if (dS > 1.05 * Pv.rOut) { const m = S.vista, cx = m[0] * relS[0] + m[3] * relS[1] + m[6] * relS[2], cy = m[1] * relS[0] + m[4] * relS[1] + m[7] * relS[2], cz = -(m[2] * relS[0] + m[5] * relS[1] + m[8] * relS[2]), ro = Math.asin(Pv.rOut / dS) * 1.05 + 2 * px, ax = Math.atan2(cx, cz), ay = Math.atan2(cy, cz);
          if (Math.acos(Math.max(-1, Math.min(1, cz / dS))) - ro > Math.atan(Math.hypot(S.tanX, S.tanY))) nelCampo = false; // (vista da fuori sta in un cerchio: se è fuori dal campo niente; se no solo il rettangolo che lo contiene)
          else if (cz > 0 && Math.abs(ax) + ro < 1.45 && Math.abs(ay) + ro < 1.45) ritaglio = [0.5 + (0.5 * Math.tan(ax - ro)) / S.tanX, 0.5 + (0.5 * Math.tan(ay - ro)) / S.tanY, 0.5 + (0.5 * Math.tan(ax + ro)) / S.tanX, 0.5 + (0.5 * Math.tan(ay + ro)) / S.tanY].map((x) => Math.max(0, Math.min(1, x))); }
        if (nelCampo) { for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = Qs[r] * A[c] + Qs[3 + r] * A[3 + c] + Qs[6 + r] * A[6 + c]; // (dagli assi dell'occhio a quelli del sistema, per colonne)
          if (giro - giroImax >= 6) { giroImax = giro; Imax = 0; const x0 = ritaglio ? ritaglio[0] : 0, x1 = ritaglio ? ritaglio[2] : 1, y0 = ritaglio ? ritaglio[1] : 0, y1 = ritaglio ? ritaglio[3] : 1;
            for (let j = 0; j < 3; j++) for (let i = 0; i < 5; i++) { const ex = ((x0 + ((i + 0.5) / 5) * (x1 - x0)) * 2 - 1) * S.tanX, ey = ((y0 + ((j + 0.5) / 3) * (y1 - y0)) * 2 - 1) * S.tanY, k = 1 / Math.hypot(ex, ey, 1); for (let r = 0; r < 3; r++) _d[r] = (u9[r] * ex + u9[3 + r] * ey - u9[6 + r]) * k; Imax = Math.max(Imax, radianza(oUA, _d, 32)); } }
          v.valorePolvere = (PI * Imax) / S.E0; if (v.valorePolvere > 4 * SOGLIA) { polv = { ritaglio }; v.polvere = true; } } }
      if (dS > limite) { if (!lontano) { lontano = true; for (const c of corpi) c.influenza = 0; for (const m of comete.values()) m.corpo.influenza = 0; } return; } lontano = false;
      // --- quando chiedere di nuovo al lavoratore: il tempo è andato avanti (le comete cambiano in giorni; senza comete, per sapere se ne arrivano)
      const passo = comete.size ? 86400 : 30 * 86400; if (!inCorso && Math.abs(S.t - tDati) > passo && performance.now() - ultima > 300) chiedi(S.t);
      if (!insieme) return;
      // --- i corpi delle fasce: la luce più debole che l'occhio vede in un punto (luci.js: picco ≥ 2·10⁻⁴) dà fin dove
      // un corpo si può vedere; chi sta più lontano di così dal posto dell'occhio (lo dice il semiasse) non si calcola
      const Emin = (S.E0 * 4e-3) / (PI * S.fuoco * S.fuoco), rO = V.lungo(oSys), cam = N.camera.corpo;
      if (fasce && st.parti.corpi) { const el = fasce.el;
        for (let i = 0; i < fasce.n; i++) { const k = i * EL, m = fasce.scheda[i], R = el[k + 10], a = el[k], e = el[k + 1], dVis = Math.max(Math.sqrt(fasce.Lmax[i] / (4 * PI * Emin)), R / (0.5 * px));
          if (m.corpo !== cam) { if (Math.abs(rO - a) > a * e + dVis || Math.abs(oSys[2]) > a * (1 + e) * el[k + 14] + dVis) { m.corpo.influenza = 0; continue; }
            stato(el, k, S.t, _p, null); if (Math.hypot(_p[0] - oSys[0], _p[1] - oSys[1], _p[2] - oSys[2]) > dVis) { m.corpo.influenza = 0; continue; } }
          mostra(S, m, el, k, px); } }
      // --- le comete
      const E0 = S.E0, f2 = S.fuoco * S.fuoco, av = [-S.assi[2], -S.assi[5], -S.assi[8]], mezzoCampo = Math.atan(Math.hypot(S.tanX, S.tanY));
      if (st.parti.comete) for (const m of comete.values()) { const c = m.d, el = m.el, R = c.raggio; m.disegna = false;
        stato(el, 0, S.t, _p, null); const d0 = Math.hypot(_p[0] - oSys[0], _p[1] - oSys[1], _p[2] - oSys[2]), inf = Math.max(30 * R, Math.min(2 * c.chioma, 2e9)); m.corpo.influenza = d0 < 20 * inf || m.corpo === cam ? inf : 0;
        const dVis = Math.max(Math.sqrt(m.Lmax / (4 * PI * Emin)), R / (0.5 * px)), nucleo = d0 < dVis || m.corpo === cam; if (nucleo) mostra(S, m, el, 0, px);
        // chioma e code: se nemmeno al meglio (in controluce, da vicinissimo) arrivano alla soglia dell'occhio, non c'è altro da fare
        if (!c.nb || Math.min((PI * (c.Bem + c.Bp * m.fase0)) / E0, ((c.Lem + c.P * m.fase0) * f2) / (d0 * d0 * E0 * 6.2832)) < SOGLIA) continue;
        if (!nucleo) S.versoCorpo(m.corpo, m.rel);
        // l'angolo di diffusione (stella → cometa → occhio) e la funzione di fase dei grani; poi se la luce arriva alla soglia e se è nel campo
        stato(el, 0, S.t - S.ritardo(m.corpo), _p, null); const r = V.lungo(_p), d = V.lungo(m.rel) || 1, e1 = [_p[0] / r, _p[1] / r, _p[2] / r], e1w = V.mv(Qs, e1), ct = -(e1w[0] * m.rel[0] + e1w[1] * m.rel[1] + e1w[2] * m.rel[2]) / d, fi = 4 * PI * faseGrani(c.g, c.pesi, Math.acos(Math.max(-1, Math.min(1, ct))));
        if (Math.min((PI * (c.Bem + c.Bp * fi)) / E0, ((c.Lem + c.P * fi) * f2) / (d * d * E0 * 6.2832)) < SOGLIA) continue;
        if (Math.acos(Math.max(-1, Math.min(1, (av[0] * m.rel[0] + av[1] * m.rel[1] + av[2] * m.rel[2]) / d))) > mezzoCampo + Math.asin(Math.min(1, c.fuori / d))) continue; // fuori dal campo
        // il riferimento della cometa nel mondo: via dalla stella, lungo l'orbita, la normale
        const W = [el[5] * el[9] - el[6] * el[8], el[6] * el[7] - el[4] * el[9], el[4] * el[8] - el[5] * el[7]], e2 = V.vett(W, e1), e2w = V.mv(Qs, e2), e3w = V.mv(Qs, W);
        m.quadro.set([e1w[0], e1w[1], e1w[2], e2w[0], e2w[1], e2w[2], e3w[0], e3w[1], e3w[2]]); m.fase[0] = fi * c.tintaPolvere[0]; m.fase[1] = fi * c.tintaPolvere[1]; m.fase[2] = fi * c.tintaPolvere[2];
        m.disegna = true; daDisegnare.push(m); v.comete++; v.batuffoli += m.nb; if (!nucleo) S.bersaglio({ p: m.rel, raggio: R, corpo: m.corpo }); }
      if (nPunti) insieme.metti(posP, luceP, nPunti);
    },
    disegna(S, passata) {
      if (!st.acceso || !dati) return;
      if (passata === 'fondo') { if (!polv) return; if (!prgPolvere) prgPolvere = N.programma(V_Q, F_POLVERE); const u = prgPolvere.u, P = Pv, T = piccolaPolvere, k = (L * P.albedo) / (4 * Math.sqrt(PI2) * UA * UA * S.E0), sg = (q) => (q < P.n ? P.sigma[q] : 1);
        T.apri(S, !!polv.ritaglio); if (polv.ritaglio) T.ritaglia(polv.ritaglio, T.w, T.h); gl.disable(gl.BLEND); gl.useProgram(prgPolvere.p); gl.uniform3f(u.u_occhio, oUA[0], oUA[1], oUA[2]); gl.uniformMatrix3fv(u.u_raggi, false, u9);
        gl.uniform4f(u.u_cam, S.tanX, S.tanY, Math.min(PASSI_MAX, (N.vista.passi && N.vista.passi.minori) || O.passi), Math.min(PASSI_MAX, O.passiFasce)); gl.uniform4f(u.u_lim, P.uIn, P.uOut, Math.sin(Math.min(1.5, 3.3 * P.sMax)) ** 2, P.uFasce);
        gl.uniform4f(u.u_k, k / sg(0), k / sg(1), k / sg(2), k / sg(3)); gl.uniform4f(u.u_sig, 0.5 / sg(0) ** 2, 0.5 / sg(1) ** 2, 0.5 / sg(2) ** 2, 0.5 / sg(3) ** 2); gl.uniform1f(u.u_log, P.lnr);
        N.lega(0, P.tauImg, u.u_tau); N.lega(1, P.faseImg, u.u_fase); S.schermo(); T.chiudi(S, P.tinta, polv.ritaglio); gl.disable(gl.BLEND); gl.disable(gl.SCISSOR_TEST); return; }
      if (passata === 'solido') { if (!sfere.length) return; if (!prgSfera) { prgSfera = N.programma(V_SFERA, F_SFERA, { a_angolo: 0 }); const vao = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); quadrato = { vao, b }; }
        const u = prgSfera.u; gl.useProgram(prgSfera.p); gl.bindVertexArray(quadrato.vao); gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform1f(u.u_espo, 1); gl.uniform1f(u.u_notte, (S.luceGalassia || 0) / 4 / S.E0); gl.uniform2f(u.u_minimo, (1.6 * S.tanY * 2) / S.H, 0); gl.uniform4f(u.u_ombra, 0, 0, 0, 0); gl.uniform4f(u.u_asse, 0, 1, 0, 0);
        // (la riflettanza di una superficie di Lambert che dà quell'albedo geometrico: 3/2)
        for (let i = 0; i < sfere.length; i += 4) { const m = sfere[i], R = sfere[i + 1], k = sfere[i + 2], el = sfere[i + 3], e = S.espo(m.E); gl.uniform4f(u.u_sfera, m.rel[0], m.rel[1], m.rel[2], R); gl.uniform4f(u.u_tinta, Math.min(1, 1.5 * el[k + 11]), Math.min(1, 1.5 * el[k + 12]), Math.min(1, 1.5 * el[k + 13]), 0); gl.uniform3f(u.u_luce, coloreLuce[0] * e, coloreLuce[1] * e, coloreLuce[2] * e); gl.uniform3fv(u.u_sole, m.sole); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); }
        gl.bindVertexArray(null); return; }
      if (passata !== 'velato') return;
      if (nPunti) insieme.disegna(S, 1, 1.2);
      if (!daDisegnare.length) return; if (!prgBlob) prgBlob = N.programma(V_BLOB, F_BLOB, { a_c: 0, a_ax: 1, a_s: 2, a_l: 3 }); const u = prgBlob.u;
      const metti = (modo) => { gl.useProgram(prgBlob.p); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform4f(u.u_cam, S.tanX, S.tanY, S.fuoco, S.fc); gl.uniform4f(u.u_k, 1 / (4 * S.E0), modo, SOGLIA / 4, 0); gl.uniform2f(u.u_tela, S.W, S.H); gl.uniform2f(u.u_telo, piccola.w || 1, piccola.h || 1);
        for (const m of daDisegnare) { if (modo && !m.vicina) continue; gl.uniform3f(u.u_C, m.rel[0], m.rel[1], m.rel[2]); gl.uniformMatrix3fv(u.u_quadro, false, m.quadro); gl.uniform3f(u.u_fase, m.fase[0], m.fase[1], m.fase[2]); gl.bindVertexArray(m.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, m.nb); } gl.bindVertexArray(null); };
      // i batuffoli lontani: sull'immagine intera, dietro a ciò che è solido e più vicino
      metti(0);
      // quelli in cui si è dentro (o quasi): sull'immagine piccola, poi aggiunti
      let vicine = 0; for (const m of daDisegnare) { m.vicina = V.lungo(m.rel) < 1.05 * m.d.vicino; if (m.vicina) vicine++; }
      if (vicine) { piccola.apri(S, true); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); metti(1); piccola.chiudi(S, [1, 1, 1]); gl.enable(gl.DEPTH_TEST); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
    },
    libera() {
      if (filo) filo.terminate(); filo = null; for (const m of comete.values()) { gl.deleteBuffer(m.buf); gl.deleteVertexArray(m.vao); N.togliCorpo(m.corpo); } comete.clear(); for (const c of corpi) N.togliCorpo(c); corpi.length = 0;
      punti.libera(); piccola.libera(); piccolaPolvere.libera(); if (Pv) { gl.deleteTexture(Pv.tauImg); gl.deleteTexture(Pv.faseImg); } for (const p of [prgPolvere, prgCopia, prgBlob, prgSfera]) if (p) gl.deleteProgram(p.p); if (quadrato) { gl.deleteBuffer(quadrato.b); gl.deleteVertexArray(quadrato.vao); }
    },
  };
  N.aggiungi(strato);
  return { strato, stato: st, corpi, comete: () => [...comete.values()], dati: () => dati, libera() { N.togli(strato); },
    // PER LE PROVE. La brillanza della polvere (W/m²/sr) vista da rOss (m, nel piano) a un'elongazione dalla stella, nel piano:
    // la somma di qui sulla CPU (fitta), da mettere accanto a `polvere.luceZodiacale` del mondo
    riscontro({ rOss = UA, elongazione = PI / 2 } = {}) { return radianza([rOss / UA, 0, 0], [-Math.cos(elongazione), Math.sin(elongazione), 0], 40000); },
    // …e ciò che la scheda grafica ha messo nel punto di mezzo dell'immagine della polvere nell'ultimo fotogramma (W/m²/sr)
    letta(S = N.stato) { if (!polv || !piccolaPolvere.tel) return null; const px = new Float32Array(4), prima = gl.getParameter(gl.FRAMEBUFFER_BINDING); gl.bindFramebuffer(gl.FRAMEBUFFER, piccolaPolvere.tel); gl.readPixels(piccolaPolvere.w >> 1, piccolaPolvere.h >> 1, 1, 1, gl.RGBA, gl.FLOAT, px); gl.bindFramebuffer(gl.FRAMEBUFFER, prima); return (px[0] * S.E0) / PI; } };
}
