// buconero.js — IL BUCO NERO COME SI VEDE: per ogni punto dello schermo si segue all'indietro la geodetica della luce.
//
// Uno strato del nucleo (nucleo.js: { nome, aggiorna, disegna, dopo, libera }). Per ogni pixel il frammento integra il
// raggio nello spaziotempo di Schwarzschild e guarda dove finisce: sotto l'orizzonte (nero: l'OMBRA), sul DISCO di
// accrescimento (che allora si vede anche da sopra e da sotto, piegato attorno all'ombra, e ancora nell'ANELLO DI
// FOTONI dei raggi che hanno fatto mezzo giro o più), o lontano (il CIELO, deformato: ogni sorgente compare due
// volte, e ciò che sta proprio dietro diventa un anello di Einstein).
//
// LE LEGGI (tutte in src/camera/relativita.js, dove hanno fonte, marca e stato sperimentale):
//   · il raggio: nel piano dell'orbita l'equazione di Binet u″ + u = 3u² (unità r_g = GM/c² = 1) equivale a
//     d²x/dλ² = −3h²·x/r⁵, h = |x × v| — la STESSA forma, con le stesse costanti del passo (`PASSO_RAGGIO`), di
//     relativita.js `tracciaRaggio`, che test_relativita prova contro l'integrale esatto della deflessione;
//   · chi guarda sta FERMO a r_o (un osservatore statico: sopra l'orizzonte), o si muove rispetto a quello fermo lì con
//     velocità β (`betaCamera`): aberrazione e Doppler della relatività ristretta, esatti;
//   · il disco: sottile, opaco, nel piano dell'equatore, da 6 r_g (l'ultima orbita stabile) a `raggioEsterno`; la sua
//     temperatura è quella di Novikov & Thorne / Page & Thorne per a = 0 (relativita.js `discoSottile`, la stessa
//     formula scritta qui in GLSL): T(r) = T*·[x²Q/((x³ − 3x)·r³)]^(1/4), T* = (3GMṀ/(8πσr_g³))^(1/4);
//   · ogni punto del disco è un corpo nero; la sua luce arriva spostata di g = ν_oss/ν_em = √(1 − 3/r) /
//     (√(1 − 2/r_o)·(1 − Ω·b_z)) (gravità + Doppler dell'orbita: relativita.js `fattoreDisco`), e un corpo nero
//     spostato di g è un corpo nero a g·T con l'intensità per g⁴ (I_ν/ν³ è invariante): l'amplificazione relativistica
//     non è un fattore in più, è questa;
//   · IL COLORE È VERO: per ogni temperatura la tavola `tavolaCorpoNero` dà la luce che un corpo nero manda nel
//     visibile (Planck integrato sulle curve dell'occhio CIE 1931 nella forma analitica di Wyman, Sloan & Shirley
//     2013 [R], poi la matrice sRGB), in assoluto: un disco a 10⁵ K è bianco-azzurro e abbagliante, uno a 2000 K rosso
//     cupo. L'unità è quella del nucleo: 1 = un foglio bianco sotto l'irradianza S.E0 di una stella come il Sole.
//   · il cielo oltre il raggio è una carta (longitudine, latitudine) in luce vera; la sua luce arriva più blu di
//     1/√(1 − 2/r_o) (per g⁴) a chi sta vicino al buco.
//
// PARAMETRI LIBERI (dichiarati):
//   · `raggioEsterno` (30 r_g): dove si smette di disegnare il disco. Il disco vero continua, sempre più freddo, fin
//     dove la sua stessa gravità lo spezza: qui non è calcolato;
//   · le MACCHIE (`macchie`, `grana`): il disco di Novikov & Thorne è liscio e stazionario, e un disco liscio che
//     ruota non si vede ruotare. Il disco vero è turbolento (instabilità magnetorotazionale: Balbus & Hawley 1991) e
//     qui la turbolenza NON è simulata: si mettono `macchie` zone più calde (ognuna un evento con indirizzo: dove,
//     quando), trascinate e stirate dalla rotazione di Keplero vera, Ω = r^(−3/2)·c/r_g. Quante, quanto larghe e quanto
//     calde (`grana`) è scelto da noi; con grana = 0 il disco è quello della legge, fermo all'occhio.
//
// CHE COSA NON C'È (dichiarato):
//   · la rotazione del buco (Kerr): lo strato è Schwarzschild; in relativita.js Kerr c'è (orizzonte, ombra di
//     Bardeen, raggi in forma di Kerr–Schild) ma non è ancora portato nello shader;
//   · il ritardo della luce attraverso il disco (ogni punto è disegnato all'istante t, non t − percorso/c);
//   · l'atmosfera del disco: emissione uguale in ogni direzione (niente oscuramento al bordo, niente diffusione degli
//     elettroni che ne alza la temperatura di colore), niente spessore, niente getto, niente corona;
//   · sotto l'1% di Eddington il disco sottile non è il flusso vero (e nel cosmo 1 del modello, oggi, nessun buco
//     centrale lo supera): chi chiama decide se disegnarlo, e la pagina di prova lo dice;
//   · il colore del cielo non viene spostato (solo l'intensità), e le stelle sono macchie di una carta: ingrandite
//     dalla lente si allargano invece di restare punti più brillanti (la luce totale è giusta);
//   · nel modo 'scena' (dentro universo.js) si deforma solo ciò che è già sullo schermo: quello che la lente
//     porterebbe in vista da fuori campo non c'è (resta nero, o la carta `cielo` se chi chiama la dà: da vicino è
//     gran parte dell'immagine; da lontano, quando il buco è largo pochi pixel, quasi niente).
import { V } from './nucleo.js';
import { COSTANTI } from '../camera/leggi.js';
import { PASSO_RAGGIO, raggioGravitazionale, discoSottile } from '../camera/relativita.js';
import { sorgente } from '../camera/eventi.js';
import { creaStoria, accumuloAttivo } from './accumulo.js';

// ---------- IL COLORE VERO DI UN CORPO NERO, in assoluto
// le curve dell'occhio (CIE 1931, 2°) come somme di campane asimmetriche (Wyman, Sloan & Shirley 2013, JCGT 2(2) [R])
const campana = (l, mu, s1, s2) => { const t = (l - mu) / (l < mu ? s1 : s2); return Math.exp(-0.5 * t * t); };
const occhio = (nm) => [1.056 * campana(nm, 599.8, 37.9, 31.0) + 0.362 * campana(nm, 442.0, 16.0, 26.7) - 0.065 * campana(nm, 501.1, 20.4, 26.2), 0.821 * campana(nm, 568.8, 46.9, 40.5) + 0.286 * campana(nm, 530.9, 16.3, 31.1), 1.217 * campana(nm, 437.0, 11.8, 36.0) + 0.681 * campana(nm, 459.0, 26.0, 13.8)];
// ∫B_λ(T)·(x̄, ȳ, z̄)dλ da 380 a 780 nm (W/m²/sr), poi rosso-verde-blu lineari (matrice sRGB, bianco D65)
export function corpoNeroVisibile(T) {
  const { hbar, c, kB } = COSTANTI, h = 2 * Math.PI * hbar; let X = 0, Y = 0, Z = 0; const dl = 5e-9;
  for (let nm = 382.5; nm < 780; nm += 5) { const l = nm * 1e-9, e = (h * c) / (l * kB * T), B = e > 700 ? 0 : (2 * h * c * c) / (l ** 5 * Math.expm1(e)), o = occhio(nm); X += B * o[0] * dl; Y += B * o[1] * dl; Z += B * o[2] * dl; }
  return [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z, Y];
}
// la parte della luce di un corpo nero che l'occhio vede, rispetto a tutta: κ(T) = π∫B_λȳdλ/(σT⁴)
const T_SOLE = 5772; // K: la temperatura efficace del Sole (UAI 2015, valore nominale [R]): fissa l'unità «foglio bianco al sole»
const KAPPA_SOLE = (Math.PI * corpoNeroVisibile(T_SOLE)[3]) / (COSTANTI.sigma * T_SOLE ** 4);
// LA TAVOLA: n temperature in scala logaritmica tra 10^LT0 e 10^LT1 K → rosso, verde, blu (il massimo vale 1) e in
// quarta il log₁₀ della radianza (W/m²/sr «come se fosse luce del Sole»: divisa per κ☉), cioè ciò che moltiplicato per
// π/E0 è il valore nell'unità del nucleo
export const LT0 = 2.5, LT1 = 10;
export function tavolaCorpoNero(n = 512) {
  const d = new Float32Array(4 * n);
  for (let i = 0; i < n; i++) { const T = 10 ** (LT0 + ((LT1 - LT0) * i) / (n - 1)), c = corpoNeroVisibile(T), r = Math.max(0, c[0]), g = Math.max(0, c[1]), b = Math.max(0, c[2]), m = Math.max(r, g, b);
    if (m > 0) { d[4 * i] = r / m; d[4 * i + 1] = g / m; d[4 * i + 2] = b / m; d[4 * i + 3] = Math.max(-60, Math.log10(m / KAPPA_SOLE)); } else { d[4 * i] = 1; d[4 * i + 3] = -60; } }
  return d;
}
// la radianza visibile (nella stessa unità della tavola) di un corpo nero a T: per decidere l'esposizione
export const radianzaVisibile = (T) => { const c = corpoNeroVisibile(T); return Math.max(0, c[0], c[1], c[2]) / KAPPA_SOLE; };

// ---------- IL CIELO: una carta (longitudine, latitudine) della luce che arriva da lontano
// sorgenti: [{ dir: [x, y, z] (versore, assi del mondo), flusso (W/m²), colore: [r, g, b] lineari (massimo 1),
//              largo (radianti: lo scarto di una macchia diffusa; 0 o assente: un punto) }]
// → { w, h, dati: Float32Array(4wh) (radianza in unità di `unita` W/m²/sr), unita }
export function cieloDa(sorgenti, { w = 2048, h = 1024 } = {}) {
  const dati = new Float32Array(4 * w * h), px = Math.PI / h; let massimo = 0;
  for (const s of sorgenti) {
    const d = s.dir, lat = Math.asin(Math.max(-1, Math.min(1, d[2]))), lon = Math.atan2(d[1], d[0]), sg = Math.max(s.largo || 0, 0.6 * px), lim = 3 * sg, L = s.flusso / (2 * Math.PI * sg * sg);
    const j0 = Math.max(0, Math.floor((lat - lim + Math.PI / 2) / px)), j1 = Math.min(h - 1, Math.ceil((lat + lim + Math.PI / 2) / px));
    for (let j = j0; j <= j1; j++) { const la = (j + 0.5) * px - Math.PI / 2, cl = Math.cos(la), sl = Math.sin(la), semi = cl > 1e-3 && lim / cl < Math.PI ? Math.ceil(lim / cl / px) : w / 2, i0 = Math.floor(((lon + Math.PI) / (2 * Math.PI)) * w);
      for (let q = -semi; q <= semi; q++) { const i = (((i0 + q) % w) + w) % w, lo = ((i + 0.5) / w) * 2 * Math.PI - Math.PI, cs = cl * Math.cos(lo) * d[0] + cl * Math.sin(lo) * d[1] + sl * d[2], th2 = 2 * (1 - Math.min(1, cs)); if (th2 > lim * lim) continue;
        const v = L * Math.exp(-th2 / (2 * sg * sg)), k = 4 * (j * w + i); dati[k] += v * s.colore[0]; dati[k + 1] += v * s.colore[1]; dati[k + 2] += v * s.colore[2]; if (dati[k] > massimo) massimo = dati[k]; if (dati[k + 1] > massimo) massimo = dati[k + 1]; if (dati[k + 2] > massimo) massimo = dati[k + 2]; } }
  }
  // (la scheda grafica tiene numeri a 16 bit: si porta il massimo a 30000 e si ricorda l'unità)
  const unita = massimo > 0 ? massimo / 30000 : 1; if (massimo > 0) for (let k = 0; k < dati.length; k++) dati[k] /= unita;
  return { w, h, dati, unita };
}

// ---------- IL FRAMMENTO
const NM = 16; // quante macchie al più
const F_BUCO = `
in vec2 v_uv; out vec4 o_col;
uniform vec3 u_occhio;          // dove sta l'occhio rispetto al buco (assi del mondo), in r_g
uniform mat3 u_assi, u_disco;   // gli assi di chi guarda (colonne: destra, alto, dietro); quelli del disco (due nel piano, la normale)
uniform vec2 u_tan;
uniform vec4 u_d;               // disco: raggio interno, esterno (r_g; esterno 0: niente disco), T* (K), π/E0
uniform vec4 u_c;               // cielo: unità·π/E0; modo (0: la carta; 1: la scena già disegnata); grana; numero di macchie
uniform vec3 u_beta;            // la velocità di chi guarda rispetto a chi sta fermo lì, in unità di c
uniform vec4 u_p;               // il passo: k, minimo, raggio di uscita, numero di passi
uniform vec4 u_macchie[${NM}];  // raggio, angolo all'istante di adesso al suo raggio, età (r_g/c), quanto è accesa (0…1)
uniform sampler2D u_nero, u_cielo, u_scena;
uniform vec4 u_sub;             // l'intreccio (accumulo.js): quale pixel del blocco 2×2 (x, y) e i lati dell'immagine intera; z = 0: niente intreccio
const float PI = 3.141592653589793;
// la luce visibile di un corpo nero a T (già nell'unità del nucleo, a meno di π/E0)
vec3 nero(float T) { float u = (log(max(T, 1.0)) / 2.302585093 - ${LT0.toFixed(1)}) / ${(LT1 - LT0).toFixed(1)}; if (u <= 0.0) return vec3(0.0); vec4 q = texture(u_nero, vec2(clamp(u, 0.0, 1.0), 0.5)); return q.rgb * pow(10.0, q.a); }
vec3 acc(vec3 p, float h2) { float r2 = dot(p, p); return p * (-3.0 * h2 / (r2 * r2 * sqrt(r2))); }
void main() {
  // la direzione dello sguardo, negli assi del mondo; il fotone che arriva viaggia nel verso opposto
  vec2 uv = u_sub.z > 0.0 ? (2.0 * floor(gl_FragCoord.xy) + u_sub.xy + 0.5) / u_sub.zw : v_uv;
  vec3 d = normalize(u_assi * vec3((uv * 2.0 - 1.0) * u_tan, -1.0)); float dopp = 1.0;
  float b2 = dot(u_beta, u_beta);
  if (b2 > 0.0) { // chi guarda si muove: dal suo riferimento a quello di chi sta fermo lì (aberrazione), e ν_sua/ν_fermo
    float g = inversesqrt(1.0 - b2); vec3 np = -d; float bn = dot(u_beta, np); vec3 n = (np + ((g - 1.0) / b2 * bn + g) * u_beta) / (g * (1.0 + bn)); d = -normalize(n); dopp = 1.0 / (g * (1.0 + bn)); }
  vec3 x = u_occhio; float ro = length(x), A0 = sqrt(max(1e-6, 1.0 - 2.0 / ro)); vec3 rad = x / ro;
  // chi sta fermo a r_o misura le lunghezze radiali più lunghe di 1/√(1 − 2/r_o): la direzione nelle coordinate
  vec3 v = d + (A0 - 1.0) * dot(d, rad) * rad; vec3 hv = cross(x, v); float h2 = dot(hv, hv);
  vec3 nd = u_disco[2]; float bz = -dot(hv, nd) / A0; // L_z/E del fotone (che va all'opposto del raggio seguito)
  vec3 colore = vec3(0.0); bool fuori = false; int np_ = int(u_p.w);
  for (int i = 0; i < np_; i++) {
    float r = length(x); if (r < 2.02) break; if (r > u_p.z && dot(x, v) > 0.0) { fuori = true; break; }
    float dl = max(u_p.y, u_p.x * r) / length(v);
    vec3 a1 = acc(x, h2), x2 = x + 0.5 * dl * v, v2 = v + 0.5 * dl * a1, a2 = acc(x2, h2), x3 = x + 0.5 * dl * v2, v3 = v + 0.5 * dl * a2, a3 = acc(x3, h2), x4 = x + dl * v3, v4 = v + dl * a3, a4 = acc(x4, h2);
    vec3 xn = x + dl / 6.0 * (v + 2.0 * v2 + 2.0 * v3 + v4), vn = v + dl / 6.0 * (a1 + 2.0 * a2 + 2.0 * a3 + a4);
    float y0 = dot(x, nd), y1 = dot(xn, nd);
    if (u_d.y > 0.0 && y0 * y1 < 0.0) { // attraversa il piano del disco
      vec3 p = mix(x, xn, y0 / (y0 - y1)); float rr = length(p);
      if (rr > u_d.x && rr < u_d.y) {
        float s = sqrt(rr), s0 = sqrt(u_d.x), q3 = 1.7320508, Q = s - s0 + 0.5 * q3 * log((s + q3) * (s0 - q3) / ((s - q3) * (s0 + q3)));
        float F = max(0.0, s * s * Q / (s * s * s - 3.0 * s)) / (rr * rr * rr), om = 1.0 / (rr * s);
        float calda = 0.0, fi = atan(dot(p, u_disco[1]), dot(p, u_disco[0])); int nm = int(u_c.w);
        for (int k = 0; k < nm; k++) { vec4 m = u_macchie[k]; float dr = (rr - m.x) / (0.16 * m.x), df = fi - m.y - (om - 1.0 / (m.x * sqrt(m.x))) * m.z; df = atan(sin(df), cos(df)); calda += m.w * exp(-dr * dr - df * df / 0.09); }
        float T = u_d.z * pow(F * (1.0 + u_c.z * calda), 0.25);
        float g = sqrt(1.0 - 3.0 / rr) / (A0 * (1.0 - om * bz)) * dopp;
        colore = nero(g * T) * u_d.w; fuori = false; x = vec3(0.0); break;
      }
    }
    x = xn; v = vn;
  }
  if (fuori) {
    vec3 dir = normalize(v); float gc = dopp / A0, g4 = gc * gc * gc * gc;
    if (u_c.y < 0.5) colore = textureLod(u_cielo, vec2(atan(dir.y, dir.x) / (2.0 * PI) + 0.5, asin(clamp(dir.z, -1.0, 1.0)) / PI + 0.5), 0.0).rgb * u_c.x * g4;
    else { vec3 q = transpose(u_assi) * dir; vec2 uv = q.xy / (-q.z * u_tan) * 0.5 + 0.5; if (q.z < 0.0 && uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) colore = textureLod(u_scena, uv, 0.0).rgb * g4;
      // (fuori campo la scena non c'è: se chi chiama ha dato anche una carta del cielo si prende quella, altrimenti resta nero)
      else colore = textureLod(u_cielo, vec2(atan(dir.y, dir.x) / (2.0 * PI) + 0.5, asin(clamp(dir.z, -1.0, 1.0)) / PI + 0.5), 0.0).rgb * u_c.x * g4; }
  }
  o_col = vec4(colore, 1.0);
}`;

// ---------- LO STRATO
// N: il nucleo. Opzioni:
//   corpo            il corpo del nucleo che sta nel centro del buco (se manca lo si crea: `genitore`, `posizione`, `luogo`)
//   massaKg          la massa (da galassie.js `forma.buco.M`, o da stelle.fine)
//   accrescimento    kg/s (0: niente disco)
//   asse             la normale al disco, negli assi in cui sta il corpo ([0, 0, 1]: il piano della galassia)
//   raggioEsterno    in r_g (LIBERO: 30)
//   cielo            { w, h, dati, unita } da `cieloDa` (modo 'cielo'), o niente
//   modo             'cielo': lo strato disegna tutto (fondo); 'scena': deforma ciò che gli altri strati hanno disegnato (dopo)
//   macchie, grana   LIBERI (vedi sopra); radice: l'indirizzo sotto cui stanno gli eventi delle macchie (col cosmo di base),
//                    rami: i rami del cosmo parallelo (cosmo.js ramiCosmo), passati alla fonte
//   luce             'disco' | 'cielo' | un numero (W/m²: l'irradianza che vale 1); su che cosa si regola l'esposizione
//   betaCamera       (S) → [βx, βy, βz] la velocità di chi guarda rispetto a chi sta fermo lì (assi del mondo), o niente
//   sogliaPixel      nel modo 'scena': sotto tanti pixel di raggio dell'ombra lo strato non fa niente (non si calcola ciò che non si vede)
// Con N.vista.accumulo (accumulo.js, modo 'intreccio'): a ogni fotogramma si seguono le geodetiche di un pixel su quattro
// (un'immagine di metà lato; il pixel del blocco 2×2 gira), gli altri tre vengono dai fotogrammi prima, riportati come se
// tutto stesse alla distanza del buco; a camera ferma dopo quattro fotogrammi è il conto pieno, pixel per pixel. Dove la
// storia non si può riportare si prende il pixel calcolato adesso nel blocco. Costa un quarto; in moto, e col tempo che
// corre (il disco gira), i tre pixel vecchi sono indietro fino a tre fotogrammi.
export function creaBucoNero(N, opzioni = {}) {
  const O = { corpo: null, genitore: null, posizione: null, luogo: null, massaKg: 0, accrescimento: 0, asse: [0, 0, 1], raggioEsterno: 30, cielo: null, modo: 'cielo', macchie: 12, grana: 1.5, radice: 'buco nero', luce: 'disco', betaCamera: null, sogliaPixel: 1.5, passi: PASSO_RAGGIO.passi, ...opzioni };
  const gl = N.gl, rg = raggioGravitazionale(O.massaKg), tg = rg / COSTANTI.c; // r_g (m) e r_g/c (s)
  // il corpo: «solido» fino a 2,5 r_g (chi sta fermo esiste solo sopra l'orizzonte; lì sotto lo strato non sa disegnare)
  const corpo = O.corpo || N.corpo({ nome: 'buco nero', luogo: O.luogo, genitore: O.genitore, posizione: O.posizione, raggio: 2.5 * rg, solido: true });
  const disco = O.accrescimento > 0 ? discoSottile(O.massaKg, O.accrescimento, 0) : null;
  const Tstella = disco ? Math.pow((3 * COSTANTI.G * O.massaKg * O.accrescimento) / (8 * Math.PI * COSTANTI.sigma * rg ** 3), 0.25) : 0;
  const prg = N.programma(N.V_SCHERMO, F_BUCO);
  const tNero = N.immagine(512, 1, 'rgba16fDaFloat', tavolaCorpoNero(512));
  let tCielo = null, unitaCielo = 0, mediaCielo = 0;
  function mettiCielo(c) { if (tCielo) gl.deleteTexture(tCielo); tCielo = null; unitaCielo = 0; if (!c) return; tCielo = N.immagine(c.w, c.h, 'rgba16fDaFloat', c.dati, { ripeti: 'x' }); unitaCielo = c.unita;
    // (per l'esposizione sul cielo: la radianza media dei punti più luminosi, uno su mille)
    const v = []; for (let k = 0; k < c.dati.length; k += 4 * 97) v.push(Math.max(c.dati[k], c.dati[k + 1], c.dati[k + 2])); v.sort((a, b) => a - b); mediaCielo = (v[Math.floor(v.length * 0.999)] || 1) * c.unita; }
  mettiCielo(O.cielo); const vuoto = N.immagine(1, 1, 'rgba8', new Uint8Array([0, 0, 0, 255]));
  // LE MACCHIE: ogni posto k ha una vita lunga `giri` orbite al suo raggio; finita quella, ne nasce un'altra altrove.
  // Dove e quando è un evento con indirizzo («…/macchia k/generazione j/raggio»): lo stesso disco a ogni visita.
  const caso = sorgente(`${O.radice}/disco`, O.rami), uMacchie = new Float32Array(4 * NM), nMacchie = disco ? Math.min(NM, Math.max(0, O.macchie | 0)) : 0, rin = disco ? disco.interno / rg : 6, GIRI = 1.5;
  function macchie(t) { const tt = t / tg; // (tempo in r_g/c, in doppia precisione: alla scheda vanno solo numeri piccoli)
    for (let k = 0; k < nMacchie; k++) { const r0 = rin * Math.pow(O.raggioEsterno / rin, (k + 0.5) / nMacchie), vita = GIRI * 2 * Math.PI * r0 ** 1.5, sfasa = caso(`macchia ${k}/fase`) * vita, j = Math.floor((tt + sfasa) / vita), eta = tt + sfasa - j * vita;
      const r = r0 * (0.85 + 0.3 * caso(`macchia ${k}/generazione ${j}/raggio`)), fi0 = 2 * Math.PI * caso(`macchia ${k}/generazione ${j}/angolo`), fi = fi0 + eta / r ** 1.5;
      uMacchie[4 * k] = r; uMacchie[4 * k + 1] = Math.atan2(Math.sin(fi), Math.cos(fi)); uMacchie[4 * k + 2] = eta; uMacchie[4 * k + 3] = Math.sin((Math.PI * eta) / vita) ** 2; } }
  const _v = [0, 0, 0], stato = { distanza: 0, raggioPixel: 0, attivo: false, gMassimo: 1 };
  const mat = (m) => new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]); // (3×3 per righe → per colonne, come vuole WebGL)
  function uniformi(S, modo, scena) {
    const u = prg.u, q = N.quadro(corpo.genitore, S.t), n = V.norma(q ? V.mv(q, O.asse) : O.asse), e1 = V.norma(V.vett(Math.abs(n[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0], n)), e2 = V.vett(n, e1);
    gl.useProgram(prg.p); gl.uniform3f(u.u_occhio, -_v[0] / rg, -_v[1] / rg, -_v[2] / rg); gl.uniformMatrix3fv(u.u_assi, false, mat(S.assi)); gl.uniformMatrix3fv(u.u_disco, false, new Float32Array([...e1, ...e2, ...n])); gl.uniform2f(u.u_tan, S.tanX, S.tanY);
    gl.uniform4f(u.u_d, rin, disco ? O.raggioEsterno : 0, Tstella, Math.PI / S.E0); gl.uniform4f(u.u_c, (unitaCielo * Math.PI) / S.E0, modo, O.grana, nMacchie);
    const b = O.betaCamera ? O.betaCamera(S) : null; gl.uniform3f(u.u_beta, b ? b[0] : 0, b ? b[1] : 0, b ? b[2] : 0);
    gl.uniform4f(u.u_p, PASSO_RAGGIO.k, PASSO_RAGGIO.minimo, Math.max(60, PASSO_RAGGIO.lontano * stato.distanza, 1.2 * O.raggioEsterno), O.passi); if (nMacchie) gl.uniform4fv(u.u_macchie, uMacchie);
    N.lega(0, tNero, u.u_nero); N.lega(1, tCielo || vuoto, u.u_cielo); N.lega(2, scena || vuoto, u.u_scena); gl.uniform4f(u.u_sub, 0, 0, 0, 0);
  }
  // l'intreccio: il conto su metà lato, poi la storia (un'immagine intera), poi la copia dove andava il disegno
  const storia = creaStoria(N), ORDINE = [0, 3, 1, 2]; let mezza = null, telMezza = null, mw = 0, mh = 0, prgCopia = null;
  function intrecciato(S, modo, scena) {
    const W = S.W, H = S.H, w = Math.ceil(W / 2), h = Math.ceil(H / 2), q = ORDINE[(S.indice || 0) % 4], dove = gl.getParameter(gl.FRAMEBUFFER_BINDING);
    if (w !== mw || h !== mh) { if (mezza) { gl.deleteTexture(mezza); gl.deleteFramebuffer(telMezza); } mw = w; mh = h; mezza = N.immagine(w, h, 'rgba16f', null, { filtro: gl.NEAREST }); telMezza = N.telaio(mezza, null); }
    // (a camera ferma e col tempo fermo, dopo quattro fotogrammi ogni pixel è il conto pieno: non si rifà niente)
    const rif = { occhio: [-_v[0] / rg, -_v[1] / rg, -_v[2] / rg], raggi: S.assi, modo: 'intreccio', quale: q, distanza: stato.distanza }; let fatto, scala = 1;
    if (storia.ferma(S, rif, S.dt === 0) > 4) { const t = storia.tieni(S); fatto = t.img; scala = t.scala; }
    else { gl.bindFramebuffer(gl.FRAMEBUFFER, telMezza); gl.viewport(0, 0, w, h); uniformi(S, modo, scena); gl.uniform4f(prg.u.u_sub, q & 1, q >> 1, W, H); S.schermo(); fatto = storia.risolvi(S, mezza, W, H, rif); }
    if (!prgCopia) prgCopia = N.programma(N.V_SCHERMO, `in vec2 v_uv; out vec4 o; uniform sampler2D u_img; uniform float u_k; void main() { o = vec4(texture(u_img, v_uv).rgb * u_k, 1.0); }`);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dove); gl.viewport(0, 0, W, H); gl.useProgram(prgCopia.p); N.lega(0, fatto, prgCopia.u.u_img); gl.uniform1f(prgCopia.u.u_k, scala); S.schermo();
  }
  const strato = {
    nome: 'buco nero', corpo, disco, stato, raggioGravitazionale: rg, opzioni: O, mettiCielo,
    aggiorna(S) {
      S.versoCorpo(corpo, _v); const d = V.lungo(_v); stato.distanza = d / rg; // l'ombra sullo schermo: √27 r_g/d (da lontano), in pixel
      stato.raggioPixel = d > 0 ? (Math.sqrt(27) * rg / d) * S.fuoco : Infinity; stato.attivo = d > 2.02 * rg && (O.modo === 'cielo' || stato.raggioPixel > O.sogliaPixel);
      S.bersaglio({ p: _v.slice(), raggio: (disco ? O.raggioEsterno : 6) * rg, corpo }); if (disco) macchie(S.t);
      // l'esposizione: sul disco (il suo punto più caldo, visto con lo spostamento di chi sta a questa distanza), o sul cielo
      if (typeof O.luce === 'number') S.proponiLuce(O.luce);
      else if (O.luce === 'disco' && disco) { const A0 = Math.sqrt(Math.max(1e-6, 1 - 2 / stato.distanza)); S.proponiLuce((Math.PI * radianzaVisibile(disco.Tmax / A0)) / 0.7); }
      else if (O.modo === 'cielo' && mediaCielo > 0) S.proponiLuce((Math.PI * mediaCielo) / 6);
    },
    disegna(S, passata) { if (passata !== 'fondo' || O.modo !== 'cielo' || !stato.attivo) return; if (accumuloAttivo(N)) return intrecciato(S, 0, null); storia.azzera(); uniformi(S, 0, null); S.schermo(); },
    dopo(S, da) { if (O.modo !== 'scena' || !stato.attivo) return false; if (accumuloAttivo(N)) intrecciato(S, 1, da.col); else { storia.azzera(); uniformi(S, 1, da.col); S.schermo(); } return true; },
    storia, // (per le prove)
    libera() { storia.libera(); if (mezza) { gl.deleteTexture(mezza); gl.deleteFramebuffer(telMezza); } if (prgCopia) gl.deleteProgram(prgCopia.p); gl.deleteProgram(prg.p); gl.deleteTexture(tNero); gl.deleteTexture(vuoto); if (tCielo) gl.deleteTexture(tCielo); },
  };
  N.aggiungi(strato); return strato;
}
