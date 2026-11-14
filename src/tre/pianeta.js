// pianeta.js — UN PIANETA COME CORPO VERO, per il motore 3D (nucleo.js).
//
// Non è un disco con una carta sopra: è una sfera schiacciata dalla sua rotazione, col suo rilievo vero a dettaglio
// continuo, il mare, l'aria che diffonde la luce della sua stella, le nuvole portate dal vento, il giorno e la notte.
// Niente è inventato qui: ogni cosa viene dai moduli che la calcolano, e qui la si mette nello spazio.
//   · IL RILIEVO: le quote di geologia.js (la superficie intera 256×128 e le sue tessere sempre più fini, fino a ~10 m),
//     preparate in un filo a parte (tessere.worker.js). La sfera è divisa in pezze (un albero a quattro rami sulla
//     carta longitudine-latitudine, la stessa delle tessere): ogni pezza è una griglia di 32×16 maglie che si spezza in
//     quattro quando sullo schermo le sue maglie diventano troppo grosse. Ogni pezza prende quote e colori dalla
//     tessera più fine che è già arrivata (e chiede la successiva): si vede il grosso finché il fine non arriva.
//     I vertici si calcolano nel riferimento della pezza (est, nord, su al suo centro) con formule che non perdono
//     cifre, e il centro della pezza rispetto all'occhio in doppia precisione: a due metri dal suolo non trema niente.
//     Tra pezze di grossezza diversa non restano fessure: ogni pezza ha un orlo che scende.
//   · IL MARE E I LAGHI: una superficie sola. La riva la decide ogni punto dello schermo, non la griglia né i vertici: il
//     SEGNO dei punti della tessera attorno (bagnato o asciutto) interpolato con la B-spline cubica, come la costa delle
//     tessere figlie di geologia.js (che interpola il segno delle celle madri). Il colore dell'acqua è la riflettanza di
//     mare.js (coloraMare: assorbimento e diffusione dell'acqua, del fango, del ferro, il fondo dove si vede; tolta
//     l'esposizione della carta: tessere.worker.js); le onde sono le sue (le stesse lunghezze, direzioni e fasi, alte
//     quanto dice lo spettro di quel punto: ondeNelPunto), come spostamento della superficie e come pendenza per i riflessi.
//   · I MATERIALI: le riflettanze delle rocce per classe, del sedimento, della neve e del ghiaccio (tessere.worker.js).
//   · LA LUCE: quella della stella, attenuata e arrossata dall'aria che attraversa per arrivare lì (di più al tramonto),
//     sul pendio vero (le normali dalle pendenze della tessera, punto per punto), tolta dove la stella sta dietro
//     l'orizzonte del punto (otto orizzonti per punto calcolati nel filo delle tessere: le ombre proprie del rilievo, con la
//     penombra del disco della stella), più quella del cielo (l'irradianza del cielo vero, diffusione semplice e multipla)
//     per la parte di cielo che il punto vede. Il rilievo è in scala vera: nessuna esagerazione.
//   · L'ARIA: diffusione di Rayleigh e foschia calcolate lungo ogni raggio dell'occhio (una passata sull'immagine
//     intera): i coefficienti vengono dai gas veri e dalla pressione (P.atmosfera, P.clima), lo spessore dalla scala
//     d'altezza R·T/(M·g); la luce diffusa più volte dalla tabella di Hillaire (2020), fatta una volta per pianeta.
//     Cielo, orizzonte, alba, l'alone al bordo, l'ombra del pianeta nell'aria: escono dal conto.
//   · LE NUVOLE: uno strato alla quota dove l'aria è scesa a metà; quanta parte del cielo coprono lo dice meteo.js
//     (cl.meteo.nuvole, nella stagione di quel momento), la forma minuta è un rumore che il vento (cl.meteo.u, v) trascina.
//   · IL MOTO: il pianeta gira attorno al suo asse inclinato (P.giorno, P.obliquita, retrogrado, o bloccato con la
//     stessa faccia alla stella) e attorno alla stella (P.anno): le stagioni vengono da sé. Le lune girano col loro periodo.
//
// uso:  const pianeta = creaPianeta(N, { P, stella, via, superficie: () => superficieDi(via) });
//       N.attacca(pianeta.corpo, { distanza: 3 * P.raggioM });
//       pianeta.info(lon, lat) → { quota, acqua, profondita }   pianeta.statistiche()   pianeta.libera()
import { V, GLSL_PROFONDITA_V, GLSL_PROFONDITA_F, coloreCorpoNero } from './nucleo.js';
import { semeEvento } from '../camera/cosmo.js';
import { sorgente } from '../camera/eventi.js';
import { accumuloAttivo } from './accumulo.js';

const TW = 256, TH = 128, TWB = TW + 2, THB = TH + 2, MX = 32, MY = 16, LMAX = 7, DMAX = 2 * LMAX + 3;
const RAD = Math.PI / 180, K_B = 1.380649e-23, R_GAS = 8.314;
// i gas: massa molare (kg/mol) e quanto diffondono la luce rispetto all'azoto (dal quadrato della rifrattività)
const GAS = { N2: [0.028, 1], O2: [0.032, 0.86], CO2: [0.044, 2.4], H2O: [0.018, 0.72], H2: [0.002, 0.22], He: [0.004, 0.014], CH4: [0.016, 2.2], NH3: [0.017, 1.6], Ar: [0.04, 0.9], CO: [0.028, 1.3], SO2: [0.064, 4.9], C2H6: [0.03, 6.5] };

// ---------- il pezzo di GLSL dell'aria, comune al suolo (la luce che arriva) e al cielo (la luce diffusa)
const GLSL_ARIA = `
uniform vec4 u_atm;    // raggio del pianeta (m), scala d'altezza del gas, scala d'altezza della foschia, quota dove l'aria finisce
uniform vec3 u_betaR;  // diffusione di Rayleigh al suolo (1/m): rosso, verde, blu
uniform vec4 u_betaM;  // foschia: diffusione al suolo (1/m) in x; g della sua funzione di fase in y
float chapman(float X, float c) { float k = sqrt(1.5707963 * X); return k / ((k - 1.0) * c + 1.0); }
// quanta aria c'è dal punto a raggio r nella direzione col coseno mu rispetto alla verticale (in unità di «aria al suolo
// per scala d'altezza»): la funzione di Chapman; sotto l'orizzonte il cammino passa da un punto più basso, o nel pianeta
float spessore(float r, float mu, float Hs) {
  float R = u_atm.x, rho = exp(clamp(-(r - R) / Hs, -40.0, 8.0));
  if (mu >= 0.0) return rho * chapman(r / Hs, mu);
  float rt = r * sqrt(max(0.0, 1.0 - mu * mu));
  if (rt < R) return 1e7;
  return 2.0 * exp(-(rt - R) / Hs) * chapman(rt / Hs, 0.0) - rho * chapman(r / Hs, -mu);
}
vec3 luceCheArriva(float r, float mu) {
  if (u_atm.w <= 0.0) return vec3(mu > -0.001 || r * sqrt(max(0.0, 1.0 - mu * mu)) > u_atm.x ? 1.0 : 0.0);
  return exp(-(u_betaR * (u_atm.y * spessore(r, mu, u_atm.y)) + vec3(u_betaM.x * 1.1 * u_atm.z * spessore(r, mu, u_atm.z))));
}
// la luce diffusa più di una volta (Hillaire 2020: Ψ = L₂/(1 − f), calcolata una volta sulla CPU, per quota e altezza
// della stella; per unità di irradianza della stella) e l'irradianza del cielo su un suolo orizzontale (rispetto a quella
// della stella fuori dall'aria): vedi tabelleAria
uniform sampler2D u_ms, u_cieloT;
vec3 multipla(float r, float mus) { float h = clamp((r - u_atm.x) / max(u_atm.w, 1.0), 0.0, 1.0); return texture(u_ms, vec2((0.5 + (clamp(mus, -1.0, 1.0) * 0.5 + 0.5) * 31.0) / 32.0, (0.5 + sqrt(h) * 31.0) / 32.0)).rgb; }
vec3 cieloSu(float mus) { return texture(u_cieloT, vec2((0.5 + (clamp(mus, -1.0, 1.0) * 0.5 + 0.5) * 31.0) / 32.0, 0.5)).rgb; }`;
// quanta nuvola c'è in un punto dello strato (0…1): la copertura di meteo.js, col rumore trascinato dal vento per un
// periodo e poi ricominciato sfumando (due copie sfasate di mezzo periodo)
const GLSL_NUVOLE = `
uniform sampler2D u_meteo;
uniform vec4 u_nuv;      // quota delle nuvole (m), tempo (s), periodo del trascinamento (s), quanto coprono (0: niente nuvole)
float nuvola(vec3 p, float fine) {
  vec3 q = normalize(p); float lon = atan(-q.z, q.x), lat = asin(clamp(q.y, -1.0, 1.0));
  vec4 m = texture(u_meteo, vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927));
  vec3 est = normalize(vec3(-q.z, 0.0, -q.x) + 1e-6), nord = cross(q, est), vento = (est * m.g + nord * m.b) / (u_atm.x + u_nuv.x);
  float f1 = fract(u_nuv.y / u_nuv.z), f2 = fract(u_nuv.y / u_nuv.z + 0.5);
  vec3 a = (q - vento * ((f1 - 0.5) * u_nuv.z)) * 36.0, b = (q - vento * ((f2 - 0.5) * u_nuv.z)) * 36.0 + 11.3;
  float n = (fine > 0.5 ? frattale(a) : frattale3(a)) * (1.0 - abs(1.0 - 2.0 * f1)) + (fine > 0.5 ? frattale(b) : frattale3(b)) * (1.0 - abs(1.0 - 2.0 * f2));
  // (il rumore sta attorno a 0,5 con scarto ~0,1: la soglia è messa perché la parte di cielo coperta sia quella di meteo.js)
  float soglia = 0.5 + 0.235 * (1.0 - 2.0 * clamp(m.r * u_nuv.w, 0.0, 1.0));
  return smoothstep(soglia - 0.03, soglia + 0.11, 0.62 * n + 0.38 * frattale3(q * 5.0 + 4.0));
}`;
export const GLSL_RUMORE = `
float caso3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float rumore(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(caso3(i), caso3(i + vec3(1, 0, 0)), f.x), mix(caso3(i + vec3(0, 1, 0)), caso3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(caso3(i + vec3(0, 0, 1)), caso3(i + vec3(1, 0, 1)), f.x), mix(caso3(i + vec3(0, 1, 1)), caso3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float frattale3(vec3 p) { return 0.57 * rumore(p) + 0.29 * rumore(p * 2.03 + 7.1) + 0.14 * rumore(p * 4.01 + 3.7); }
float frattale(vec3 p) { return 0.5 * rumore(p) + 0.25 * rumore(p * 2.03 + 7.1) + 0.125 * rumore(p * 4.01 + 3.7) + 0.0625 * rumore(p * 8.05 + 1.3) + 0.035 * rumore(p * 16.1 + 5.9) + 0.0275 * rumore(p * 33.0 + 2.2); }`;

// ---------- la superficie: una pezza
const N_ONDE = 16;
const V_SUOLO = `
in vec3 a_griglia;        // x, y da 0 a 1 nella pezza; z: 1 se il vertice è dell'orlo che scende
uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_fc;
uniform vec3 u_C;         // il centro della pezza rispetto all'occhio (m, assi del mondo)
uniform mat3 u_base;      // est, nord, su al centro della pezza (colonne), negli assi del mondo, con lo schiacciamento
uniform vec4 u_geo;       // ampiezza in longitudine e in latitudine (radianti), latitudine del centro, raggio del pianeta
uniform vec4 u_tess;      // dove sta la pezza nella sua tessera: origine (x, y) e ampiezza (x, y), in frazioni della tessera
uniform vec3 u_orlo;      // di quanto scende l'orlo (m); quanto vale l'esagerazione del rilievo; tempo delle onde (s)
uniform float u_lon0;     // la longitudine del centro della pezza (radianti): le onde si contano in X = R·cos(lat)·lon, Y = R·lat come in mare.js
uniform sampler2D u_alt, u_altM;  // quota del terreno e livello dell'acqua (m), con un punto di bordo: della tessera e di sua madre (più grossa)
uniform vec4 u_tessM;     // dove sta la pezza nella tessera madre
uniform vec2 u_sfuma;     // tra queste due distanze dall'occhio i dati passano da quelli della tessera a quelli della madre: così dove comincia
                          // la tessera più grossa la superficie è già la sua, e tra un livello e l'altro non ci sono scalini
uniform vec4 u_onda[${N_ONDE}];   // le onde che muovono la superficie: numero d'onda verso est e verso nord (1/m), ampiezza (m), fase al centro della pezza
uniform float u_pulsa[${N_ONDE}]; // la loro pulsazione (rad/s)
uniform int u_nOnde;
out vec3 v_su; out vec3 v_est; out vec3 v_rel; out vec4 v_dati; out vec2 v_uv; out vec3 v_uvM; out vec2 v_en; out float v_w;
vec2 quote(sampler2D u_img, vec2 f) { // interpolazione a mano tra i quattro punti vicini (le immagini a 32 bit non si interpolano da sole)
  vec2 p = f * vec2(${TW}.0, ${TH}.0) + 0.5; ivec2 i = ivec2(floor(p)); vec2 w = p - vec2(i); ivec2 a = clamp(i, ivec2(0), ivec2(${TWB - 1}, ${THB - 1})), b = clamp(i + 1, ivec2(0), ivec2(${TWB - 1}, ${THB - 1}));
  return mix(mix(texelFetch(u_img, a, 0).rg, texelFetch(u_img, ivec2(b.x, a.y), 0).rg, w.x), mix(texelFetch(u_img, ivec2(a.x, b.y), 0).rg, texelFetch(u_img, b, 0).rg, w.x), w.y);
}
void main() {
  vec2 g = a_griglia.xy;
  // (l'orlo scende e sporge di un quarto di maglia sotto la pezza vicina: visto dritto dall'alto un orlo che scende soltanto
  // non copre niente, e tra due pezze — ognuna coi suoi conti — resterebbero forellini)
  if (a_griglia.z > 0.5) g += (step(vec2(0.9999), g) - step(g, vec2(0.0001))) * vec2(${(0.25 / MX).toFixed(6)}, ${(0.25 / MY).toFixed(6)});
  vec2 f = u_tess.xy + g * u_tess.zw, fM = u_tessM.xy + g * u_tessM.zw; vec2 q = quote(u_alt, f);
  float dl = (g.x - 0.5) * u_geo.x, df = (0.5 - g.y) * u_geo.y, fi0 = u_geo.z, fi = fi0 + df, R = u_geo.w;
  float cf = cos(fi), s0 = sin(fi0), c0 = cos(fi0), sl2 = sin(0.5 * dl), sf2 = sin(0.5 * df), k = 2.0 * sl2 * sl2;
  // il versore del punto nel riferimento della pezza (est, nord, su), scritto in modo da non perdere cifre vicino al centro
  vec3 su = vec3(cf * sin(dl), sin(df) + cf * s0 * k, 1.0 - 2.0 * sf2 * sf2 - cf * c0 * k);
  vec3 est = vec3(cos(dl), s0 * sin(dl), -c0 * sin(dl));
  float sfuma = 0.0;
  if (u_sfuma.y > 0.0) { // quanto è lontano il punto (contato con la quota della tessera: basta)
    float h0 = max(q.x, q.y) * u_orlo.y; sfuma = smoothstep(u_sfuma.x, u_sfuma.y, length(u_C + u_base * vec3((R + h0) * su.x, (R + h0) * su.y, (R + h0) * (su.z - 1.0) + h0)));
    if (sfuma > 0.0) { vec2 qm = quote(u_altM, fM); q = vec2(mix(q.x, qm.x, sfuma), (q.y > -9e4 && qm.y > -9e4) ? mix(q.y, qm.y, sfuma) : (sfuma < 0.5 ? q.y : qm.y)); } }
  float terra = q.x * u_orlo.y, livello = q.y > -9e4 ? q.y * u_orlo.y : -1e5, h = max(terra, livello);
  vec2 en = vec2(R * (cf * dl - u_lon0 * 2.0 * sin(fi0 + 0.5 * df) * sf2), R * df); // X e Y delle onde, contati dal centro della pezza
  if (livello > terra && a_griglia.z < 0.5) { // l'acqua si muove: la somma delle onde che questa pezza risolve
    float fondo = clamp((livello - terra) * 0.5, 0.0, 1.0);
    for (int i = 0; i < u_nOnde; i++) h += fondo * u_onda[i].z * cos(dot(u_onda[i].xy, en) + u_onda[i].w - u_pulsa[i] * u_orlo.z);
  }
  h -= a_griglia.z * u_orlo.x;
  vec3 loc = vec3((R + h) * su.x, (R + h) * su.y, (R + h) * (su.z - 1.0) + h);
  vec3 rel = u_C + u_base * loc;
  v_su = su; v_est = est; v_rel = rel; v_dati = vec4(terra, livello, R + h, a_griglia.z); v_uv = f; v_uvM = vec3(fM, sfuma); v_en = en;
  gl_Position = u_proj * vec4(u_vista * rel, 1.0);${GLSL_PROFONDITA_V}
}`;
const F_SUOLO = `
in vec3 v_su; in vec3 v_est; in vec3 v_rel; in vec4 v_dati; in vec2 v_uv; in vec3 v_uvM; in vec2 v_en; in float v_w;
uniform float u_fc; uniform mat3 u_normali; // dal riferimento della pezza agli assi del mondo, per le normali
uniform sampler2D u_alt, u_altM;               // quota e livello dell'acqua (per la riva, punto per punto)
uniform sampler2D u_pend, u_terra, u_acqua, u_pendM, u_terraM, u_acquaM; // della tessera e di sua madre
uniform sampler2D u_oriz1, u_oriz2, u_oriz1M, u_oriz2M; // gli orizzonti in otto direzioni (tessere.worker.js)
uniform vec3 u_sole, u_luce;   // verso la stella (assi del mondo); il suo colore (1 = bianco in pieno sole)
uniform float u_disco;         // il raggio angolare della stella (rad): la penombra delle ombre del rilievo
uniform vec4 u_espo;           // esposizione; c'è l'immagine dell'acqua; c'è quella della madre; luce di notte
uniform vec4 u_ondaF[${N_ONDE}]; uniform float u_pulsaF[${N_ONDE}]; uniform int u_nOndeF; uniform vec4 u_mare; // tempo, increspatura fine (pendenza quadratica media), schiuma, longitudine × seno della latitudine (X dipende anche dal nord)
uniform float u_orma;          // quanto è largo un punto dello schermo a distanza 1 (1 / fuoco)
uniform mat3 u_tondo; uniform vec3 u_centro, u_soleC; // dagli assi del mondo allo spazio in cui il pianeta è tondo; il suo centro rispetto all'occhio; la stella in quello spazio
${GLSL_ARIA}
${GLSL_RUMORE}
${GLSL_NUVOLE}
// l'ombra delle nuvole: dove il raggio verso la stella attraversa il loro strato
float ombraNuvole(vec3 rel) {
  if (u_nuv.w <= 0.0) return 1.0; vec3 p = u_tondo * (rel - u_centro); float Rn = u_atm.x + u_nuv.x, b = dot(p, u_soleC), c = dot(p, p) - Rn * Rn;
  if (c > 0.0) return 1.0; return 1.0 - 0.78 * nuvola(p + u_soleC * (-b + sqrt(b * b - c)), 0.0);
}
// LA RIVA: il segno dei punti vicini (+1 asciutto, −1 bagnato) interpolato, come la costa delle tessere figlie in
// geologia.js (che interpola il segno delle quattro celle madri); qui con la B-spline cubica sui sedici punti attorno
// invece che in linea retta tra quattro: la costa passa per gli stessi punti di mezzo tra una cella asciutta e una bagnata,
// ma gli spigoli della griglia si arrotondano invece di restare a gradini. E la profondità (0 sui punti asciutti).
vec4 bspline(float t) { float s = 1.0 - t; return vec4(s * s * s, 4.0 - 6.0 * t * t + 3.0 * t * t * t, 4.0 - 6.0 * s * s + 3.0 * s * s * s, t * t * t) / 6.0; }
vec2 riva(sampler2D img, vec2 f) {
  vec2 p = f * vec2(${TW}.0, ${TH}.0) + 0.5; ivec2 i = ivec2(floor(p)); vec2 w = p - vec2(i); vec4 wx = bspline(w.x), wy = bspline(w.y);
  float sigma = 0.0, fondo = 0.0;
  for (int y = 0; y < 4; y++) for (int x = 0; x < 4; x++) {
    vec2 q = texelFetch(img, clamp(i + ivec2(x - 1, y - 1), ivec2(0), ivec2(${TWB - 1}, ${THB - 1})), 0).rg; float pw = wx[x] * wy[y], d = q.y - q.x;
    sigma += pw * (d > 1e-6 ? -1.0 : 1.0); fondo += pw * max(d, 0.0); }
  return vec2(sigma, fondo);
}
// LE OMBRE DEL RILIEVO: la stella (s: est, nord, su) è dietro l'orizzonte in quella direzione? (con la penombra del suo disco)
float rilievo(vec3 s, vec4 a, vec4 b) {
  float f = mod(atan(s.y, s.x) * 1.2732395, 8.0); int k0 = min(int(f), 7); float w = f - float(k0);
  float o[8] = float[8](a.x, a.y, a.z, a.w, b.x, b.y, b.z, b.w), h = mix(o[k0], o[(k0 + 1) % 8], w);
  return smoothstep(h * h - u_disco, h * h + u_disco, s.z / max(length(s), 1e-6));
}
out vec4 o_col;
vec3 lineare(vec3 c) { return c * (c * (c * 0.305306011 + 0.682171111) + 0.012522878); }
void main() {
  vec3 su = normalize(v_su), est = normalize(v_est - su * dot(v_est, su)), nord = cross(su, est);
  vec3 suM = normalize(u_normali * su), occhio = normalize(-v_rel);
  float muS = dot(suM, u_sole), r = v_dati.z;
  vec3 arriva = u_luce * luceCheArriva(max(r, u_atm.x), muS) * smoothstep(-0.02, 0.03, muS);
  if (muS > 0.0) arriva *= ombraNuvole(v_rel);
  // la luce del cielo: l'irradianza del cielo vero (diffusione semplice e multipla) su un suolo orizzontale
  vec3 ambiente = u_luce * cieloSu(muS) + vec3(u_espo.w);
  vec2 rv = riva(u_alt, v_uv); if (v_uvM.z > 0.002) rv = mix(rv, riva(u_altM, v_uvM.xy), v_uvM.z);
  // (la riva passa dentro il punto dello schermo: i due colori pesati per quanto ne copre)
  float asciutto = clamp(0.5 + rv.x / max(fwidth(rv.x), 1e-5), 0.0, 1.0);
  vec3 colA = vec3(0.0), colT = vec3(0.0);
  if (asciutto < 1.0) { // ACQUA
    float fondo = rv.y;
    vec2 pend = vec2(0.0);
    // (ogni onda conta solo se è più lunga di qualche punto dello schermo, lì dove la si guarda: più lontano, o più di striscio, sfuma)
    float orma = length(v_rel) * u_orma / max(0.06, dot(suM, occhio));
    for (int i = 0; i < u_nOndeF; i++) pend += u_ondaF[i].xy * (u_ondaF[i].z * smoothstep(3.0, 9.0, 6.2831853 / (length(u_ondaF[i].xy) * orma)) * sin(dot(u_ondaF[i].xy, v_en) + u_ondaF[i].w - u_pulsaF[i] * u_mare.x));
    pend.y -= u_mare.w * pend.x; pend *= clamp(fondo * 0.5, 0.0, 1.0);
    vec3 n = normalize(u_normali * (su + est * pend.x + nord * pend.y));
    // la riflettanza dell'acqua (mare.js, senza la sua esposizione: tessere.worker.js); la luce che entra è quella che arriva su un piano
    vec3 base = u_espo.y > 0.5 ? lineare(texture(u_acqua, v_uv).rgb) : vec3(0.004, 0.012, 0.03);
    if (v_uvM.z > 0.002) base = mix(base, u_espo.z > 0.5 ? lineare(texture(u_acquaM, v_uvM.xy).rgb) : vec3(0.004, 0.012, 0.03), v_uvM.z);
    float nv = max(dot(n, occhio), 0.02), fres = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
    // il riflesso della stella: tanto più largo quanto più il mare è increspato (ciò che è più piccolo di un punto dello schermo)
    vec3 hv = normalize(u_sole + occhio); float nh = max(dot(n, hv), 0.0), a2 = max(u_mare.y, 2e-4), d = nh * nh * (a2 - 1.0) + 1.0;
    float lampo = a2 / (3.14159 * d * d) * 0.25 / max(0.05, max(dot(occhio, hv), 0.0));
    // (il cielo riflesso: la sua radianza media, che sullo schermo vale quanto la sua irradianza)
    colA = base * (arriva * max(muS, 0.0) + ambiente) * (1.0 - fres) + u_luce * cieloSu(muS) * fres + arriva * min(lampo * (0.02 + 0.98 * pow(1.0 - max(dot(occhio, hv), 0.0), 5.0)), 40.0);
    float spuma = (1.0 - smoothstep(0.0, 0.6, fondo)) * 0.5 + u_mare.z * smoothstep(0.35, 1.0, length(pend) * 2.5); // la schiuma: sulla riva e dove le onde sono ripide
    colA = mix(colA, vec3(0.8) * (arriva * max(muS, 0.0) + ambiente), clamp(spuma, 0.0, 1.0));
  }
  if (asciutto > 0.0) { // TERRA (o ghiaccio)
    vec3 p = texture(u_pend, v_uv).rgb, base = lineare(texture(u_terra, v_uv).rgb); vec4 o1 = texture(u_oriz1, v_uv), o2 = texture(u_oriz2, v_uv);
    if (v_uvM.z > 0.002) { p = mix(p, texture(u_pendM, v_uvM.xy).rgb, v_uvM.z); base = mix(base, lineare(texture(u_terraM, v_uvM.xy).rgb), v_uvM.z); o1 = mix(o1, texture(u_oriz1M, v_uvM.xy), v_uvM.z); o2 = mix(o2, texture(u_oriz2M, v_uvM.xy), v_uvM.z); }
    vec3 n = normalize(u_normali * (su - est * p.x - nord * p.y));
    vec3 sp = transpose(u_normali) * u_sole, sLoc = vec3(dot(sp, est), dot(sp, nord), dot(sp, su));
    // la stella sul pendio (se non è dietro l'orizzonte), e il cielo che il punto vede (p.z), su un pendio che ne guarda una parte
    colT = base * (arriva * max(dot(n, u_sole), 0.0) * rilievo(sLoc, o1, o2) + ambiente * p.z * (0.5 + 0.5 * dot(n, suM)));
  }
  o_col = vec4(mix(colA, colT, asciutto) * u_espo.x, 1.0);${GLSL_PROFONDITA_F}
}`;

// ---------- l'aria e le nuvole: una passata sull'immagine intera
// La passata può scrivere, invece del colore, le due cose di cui il colore è fatto — colore = scena·Tot + Add (Tot:
// quanta luce della scena passa, nuvole comprese; Add: la luce che l'aria e le nuvole aggiungono): a camera ferma si
// calcolano una volta e si compongono con la scena di ogni fotogramma (vedi lo strato). u_sfasa resta per sfasare i passi.
const F_ARIA = (passi) => `
in vec2 v_uv; layout(location = 0) out vec4 o_col; layout(location = 1) out vec4 o_tot;
uniform vec3 u_sfasa;    // lo sfasamento dei passi (quanto, ampiezza); z: 1 = si scrivono Add e Tot invece del colore
uniform sampler2D u_col, u_prof;
uniform vec3 u_occhio;   // l'occhio rispetto al centro del pianeta, nello spazio in cui il pianeta è tondo (m)
uniform mat3 u_raggi;    // dagli assi dell'occhio a quello spazio
uniform vec3 u_soleC;    // verso la stella, in quello spazio
uniform vec4 u_cam;      // tangenti di metà campo, costante della profondità, esposizione
uniform vec3 u_E;        // l'irradianza della stella (π × il suo colore)
${GLSL_ARIA}
${GLSL_RUMORE}
${GLSL_NUVOLE}
// la luce diffusa lungo un tratto del raggio: restituisce la luce aggiunta e (in tra) quanta ne passa
float gPasso = 0.5;
vec3 tratto(vec3 o, vec3 d, float t0, float t1, out vec3 tra) {
  float ds = (t1 - t0) / ${passi}.0, odR = 0.0, odM = 0.0; vec3 sR = vec3(0.0), sM = vec3(0.0), sMS = vec3(0.0);
  for (int i = 0; i < ${passi}; i++) {
    vec3 p = o + d * (t0 + (float(i) + gPasso) * ds); float r = length(p), h = r - u_atm.x;
    float rR = exp(clamp(-h / u_atm.y, -40.0, 8.0)), rM = exp(clamp(-h / u_atm.z, -40.0, 8.0));
    odR += rR * ds * 0.5; odM += rM * ds * 0.5;
    float mus = dot(p, u_soleC) / r; vec3 Te = exp(-(u_betaR * odR + vec3(u_betaM.x * 1.1 * odM))), T = luceCheArriva(r, mus) * Te;
    sR += rR * T * ds; sM += rM * T * ds; sMS += (u_betaR * rR + vec3(u_betaM.x * rM)) * multipla(r, mus) * Te * ds; odR += rR * ds * 0.5; odM += rM * ds * 0.5;
  }
  float mu = dot(d, u_soleC), g = u_betaM.y, fR = 0.0596831 * (1.0 + mu * mu), fM = 0.0795775 * (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5);
  tra = exp(-(u_betaR * odR + vec3(u_betaM.x * 1.1 * odM)));
  return u_E * (u_betaR * fR * sR + vec3(u_betaM.x * fM) * sM + sMS);
}
void esce(vec3 scena, vec3 Tot, vec3 Add, float dist) { if (u_sfasa.z > 0.5) { o_col = vec4(Add, dist); o_tot = vec4(Tot, dist); } else { o_col = vec4(scena * Tot + Add, 1.0); o_tot = vec4(0.0); } }
void main() {
  vec3 scena = texture(u_col, v_uv).rgb; float prof = texture(u_prof, v_uv).r;
  vec3 dO = vec3((v_uv * 2.0 - 1.0) * u_cam.xy, -1.0), de = u_raggi * dO; float lung = length(de); vec3 d = de / lung, o = u_occhio;
  float wP = exp2(prof * 2.0 / u_cam.z) - 1.0, fino = prof < 1.0 ? wP * lung : 1e30, dist = prof < 1.0 ? wP * length(dO) : 0.0; // (dist: metri veri lungo il raggio; 0: il cielo)
  gPasso = 0.5 + (fract(fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) + u_sfasa.x) - 0.5) * u_sfasa.y;
  float Rt = u_atm.x + u_atm.w, b = -dot(o, d), disc = b * b - dot(o, o) + Rt * Rt;
  if (disc <= 0.0 || u_atm.w <= 0.0) { esce(scena, vec3(1.0), vec3(0.0), dist); return; }
  float sq = sqrt(disc), t0 = max(0.0, b - sq), t1 = min(b + sq, fino);
  if (t1 <= t0) { esce(scena, vec3(1.0), vec3(0.0), dist); return; }
  // le nuvole: dove il raggio attraversa il loro strato, davanti a ciò che c'è dietro
  float Rn = u_atm.x + u_nuv.x, dn = b * b - dot(o, o) + Rn * Rn, tn = -1.0;
  if (u_nuv.w > 0.0 && dn > 0.0) { float s = sqrt(dn); tn = b - s > 0.0 ? b - s : b + s; if (tn <= t0 || tn >= t1) tn = -1.0; }
  vec3 tra, luce;
  if (tn > 0.0) {
    vec3 p = o + d * tn; float c = nuvola(p, 1.0), r = length(p), muS = dot(p, u_soleC) / r;
    vec3 dT = vec3(1.0), dA = vec3(0.0); // (ciò che c'è dietro la nuvola = scena·dT + dA)
    if (c < 0.995 && t1 - tn > 1.0) { vec3 tr2; vec3 l2 = tratto(o, d, tn, t1, tr2); dT = tr2; dA = l2 * u_cam.w; }
    if (c > 0.003) {
      float ombra = nuvola(p + u_soleC * 2500.0, 0.0); // quanto la nuvola si fa ombra da sé verso la stella
      vec3 sole = (u_E / 3.14159) * luceCheArriva(r, muS) * smoothstep(-0.05, 0.1, muS);
      vec3 bianco = 0.82 * sole * (0.45 + 0.55 * clamp(muS, 0.0, 1.0)) * (1.0 - 0.45 * ombra * c) + 0.82 * (u_E / 3.14159) * cieloSu(muS); // (più la luce del cielo, quella vera)
      float k = clamp(c * 1.15, 0.0, 1.0); dT *= 1.0 - k; dA = dA * (1.0 - k) + bianco * u_cam.w * k;
    }
    luce = tratto(o, d, t0, tn, tra); esce(scena, dT * tra, dA * tra + luce * u_cam.w, dist);
  } else { luce = tratto(o, d, t0, t1, tra); esce(scena, tra, luce * u_cam.w, dist); }
}`;

// ---------- le sfere lontane (la stella, le lune): un quadratino e la sfera calcolata nel frammento
export const V_SFERA = `
in vec2 a_angolo;
uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_fc; uniform vec4 u_sfera; // centro rispetto all'occhio (assi del mondo) e raggio
uniform vec2 u_minimo;   // lato minimo in unità dello schermo (perché un corpo lontanissimo resti un punto visibile)
out vec3 v_q; out vec3 v_c; out float v_w;
void main() {
  vec3 c = u_vista * u_sfera.xyz; float r = u_sfera.w, d = length(c);
  vec3 w = c / d, u = normalize(cross(w, vec3(0.0, 1.0, 0.0))), v = cross(u, w);
  float lato = max(r * d / sqrt(max(d * d - r * r, 1e-9 * d * d)), d * u_minimo.x);
  vec3 q = c + (a_angolo.x * u + a_angolo.y * v) * lato; v_q = q; v_c = c;
  gl_Position = u_proj * vec4(q, 1.0);${GLSL_PROFONDITA_V}
}`;
export const F_SFERA = `
in vec3 v_q; in vec3 v_c; in float v_w;
uniform mat3 u_vista; uniform float u_fc; uniform vec4 u_sfera; uniform vec3 u_sole, u_luce; uniform vec4 u_tinta; // colore; w > 0: brilla di suo (quanto)
uniform vec4 u_ombra;    // il corpo che può farle ombra: centro rispetto all'occhio (assi del mondo) e raggio
uniform vec2 u_minimo; uniform float u_espo; uniform vec4 u_asse; // l'asse del corpo (assi del mondo) e quanto è a fasce (i giganti gassosi)
${GLSL_RUMORE}
out vec4 o_col;
void main() {
  vec3 d = normalize(v_q); float r = u_sfera.w, b = dot(d, v_c), disc = b * b - dot(v_c, v_c) + r * r;
  float lontano = length(v_c) * u_minimo.x;
  if (disc < 0.0) { // più piccola di un punto dello schermo: un dischetto con la stessa luce in tutto
    float fuori = length(v_q - v_c) / max(lontano, 1e-9); if (r > lontano || fuori > 1.0 || r < 0.35 * lontano) discard; // (ancora più piccola: non copre niente; la si vede dal suo punto di luce)
    float area = (r * r) / (lontano * lontano); vec3 c = u_tinta.w > 0.0 ? u_tinta.rgb * u_tinta.w : u_tinta.rgb * u_luce * 0.5;
    o_col = vec4(c * area * u_espo * (1.0 - smoothstep(0.5, 1.0, fuori)), 1.0); gl_FragDepth = log2(max(1e-6, 1.0 + length(v_c))) * u_fc * 0.5; return;
  }
  float t = b - sqrt(disc); if (t < 0.0) discard;
  vec3 p = d * t, n = (p - v_c) / r, nM = transpose(u_vista) * n; vec3 col;
  if (u_tinta.w > 0.0) { float mu = max(dot(n, -d), 0.0); col = u_tinta.rgb * u_tinta.w * (0.4 + 0.6 * pow(mu, 0.6)); } // la stella: più scura al bordo
  else {
    vec3 pM = transpose(u_vista) * p - u_ombra.xyz; float bb = dot(pM, u_sole), cc = dot(pM, pM) - u_ombra.w * u_ombra.w; // l'ombra del pianeta sulla luna
    float luce = (bb < 0.0 && bb * bb - cc > 0.0) ? 0.0 : 1.0;
    float lat = dot(nM, u_asse.xyz), macchie = mix(0.75 + 0.5 * frattale(nM * 6.0 + u_tinta.rgb * 20.0), 0.8 + 0.35 * sin(lat * 23.0 + 3.0 * frattale3(nM * 3.0 + u_tinta.rgb * 9.0) + 2.0 * sin(lat * 7.0)), u_asse.w);
    col = u_tinta.rgb * macchie * u_luce * max(dot(nM, u_sole), 0.0) * luce + u_tinta.rgb * 0.0008;
  }
  o_col = vec4(col * u_espo, 1.0);
  gl_FragDepth = log2(max(1e-6, 1.0 - p.z)) * u_fc * 0.5;
}`;
// le stelle di fondo: punti (un segnaposto finché non arrivano le stelle vere della galassia)
const V_STELLE = `in vec4 a_stella; uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_dens; out float v_l;
void main() { vec4 p = u_proj * vec4(u_vista * a_stella.xyz, 1.0); gl_Position = vec4(p.xy, 0.0, p.w); gl_PointSize = u_dens * (1.0 + 1.5 * a_stella.w); v_l = a_stella.w; }`;
const F_STELLE = `in float v_l; uniform float u_espo; out vec4 o_col;
void main() { vec2 q = gl_PointCoord - 0.5; float a = 1.0 - smoothstep(0.1, 0.5, length(q)); o_col = vec4(vec3(0.004 + 0.05 * v_l * v_l) * a * min(u_espo, 60.0), 1.0); }`;
// gli anelli: una corona nel piano dell'equatore; quanto è fitta a ogni raggio lo dice una riga di colori
export const V_ANELLI = `
in vec2 a_angolo;         // x: 0 bordo interno, 1 esterno; y: angolo (0…1)
uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_fc; uniform vec3 u_C; uniform mat3 u_piano; uniform vec2 u_raggi; // centro del pianeta rispetto all'occhio; i due assi del piano (colonne 0 e 1) e la normale; raggio interno ed esterno (m)
out vec3 v_p; out float v_r; out float v_w;
void main() { float a = a_angolo.y * 6.2831853, r = mix(u_raggi.x, u_raggi.y, a_angolo.x); vec3 p = u_piano * vec3(r * cos(a), r * sin(a), 0.0); v_p = p; v_r = a_angolo.x;
  gl_Position = u_proj * vec4(u_vista * (u_C + p), 1.0);${GLSL_PROFONDITA_V} }`;
export const F_ANELLI = `
in vec3 v_p; in float v_r; in float v_w;
uniform float u_fc; uniform sampler2D u_riga; uniform vec3 u_sole, u_luce, u_C; uniform mat3 u_piano; uniform vec4 u_pianeta; // raggio all'equatore, 1 − schiacciamento, esposizione
out vec4 o_col;
void main() {
  vec4 q = texture(u_riga, vec2(v_r, 0.5)); if (q.a < 0.003) discard;
  // l'ombra del pianeta (un ellissoide: si conta nello spazio in cui è tondo)
  vec3 n = u_piano[2], p = v_p + n * (dot(v_p, n) * (1.0 / u_pianeta.y - 1.0)), s = normalize(u_sole + n * (dot(u_sole, n) * (1.0 / u_pianeta.y - 1.0)));
  float b = dot(p, s), ombra = (b < 0.0 && b * b - dot(p, p) + u_pianeta.x * u_pianeta.x > 0.0) ? 0.03 : 1.0;
  // i grani diffondono la luce: di più verso chi guarda dalla parte della stella, un po' anche attraverso
  vec3 occhio = normalize(-(u_C + v_p)); float lato = dot(n, u_sole) * dot(n, occhio), spesso = q.a / max(0.08, abs(dot(n, occhio)));
  float alfa = 1.0 - exp(-spesso * 2.5), luce = (lato > 0.0 ? 0.75 : 0.25 * exp(-spesso)) * (0.35 + 0.65 * abs(dot(n, u_sole)) / (abs(dot(n, u_sole)) + abs(dot(n, occhio)) + 1e-3) * 2.0);
  o_col = vec4(q.rgb * u_luce * luce * ombra * u_pianeta.z * alfa, alfa);${GLSL_PROFONDITA_F}
}`;

// Con `corpi: { pianeta, stella }` il pianeta usa corpi già fatti (quelli del sistema: sistema.js, da spazio3d.js
// `corpiSistema`): stessa orbita, stesso asse, stesso giro; allora la stella e le lune le disegna il sistema.
// gli anelli di un pianeta, pronti da disegnare: una corona di 256 spicchi e una riga di 512 colori che dice quanto è
// fitta (e che colore ha) a ogni raggio; disegna(S, { centro (rispetto all'occhio), A (assetto), sole, luce, espo, schiaccia })
export function fabbricaAnello(N, P) {
  const gl = N.gl, A = P.anello, R = P.raggioM, n = 512, riga = new Uint8Array(4 * n), col = A.colore || [220, 210, 190];
  for (let i = 0; i < n; i++) { const r = A.interno + ((i + 0.5) / n) * (A.esterno - A.interno), d = Math.max(0, Math.min(1, A.densita(r))), tau = typeof A.spessoreOttico === 'function' ? A.spessoreOttico(r) : d; riga.set([col[0], col[1], col[2], Math.round(255 * Math.max(0, Math.min(1, isFinite(tau) ? Math.max(tau, d * 0.6) : d)))], 4 * i); }
  const v = []; for (let k = 0; k <= 256; k++) v.push(0, k / 256, 1, k / 256);
  const vao = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  const tex = N.immagine(n, 1, 'rgba8', riga), u9 = new Float32Array(9); let prg = null;
  return { interno: A.interno * R, esterno: A.esterno * R,
    disegna(S, { centro, A: M, sole, luce, espo, schiaccia = 1 }) {
      if (!prg) prg = N.programma(V_ANELLI, F_ANELLI, { a_angolo: 0 }); const u = prg.u; gl.useProgram(prg.p); gl.bindVertexArray(vao);
      gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform3f(u.u_C, centro[0], centro[1], centro[2]);
      const cols = [V.mv(M, [1, 0, 0]), V.mv(M, [0, 0, 1]), V.mv(M, [0, 1, 0])]; for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) u9[3 * c + r] = cols[c][r];
      gl.uniformMatrix3fv(u.u_piano, false, u9); gl.uniform2f(u.u_raggi, A.interno * R, A.esterno * R);
      S.lega(0, tex, u.u_riga); gl.uniform3fv(u.u_sole, sole); gl.uniform3fv(u.u_luce, luce); gl.uniform4f(u.u_pianeta, R, schiaccia, espo, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 514); gl.bindVertexArray(null);
    },
    libera() { gl.deleteTexture(tex); gl.deleteBuffer(b); gl.deleteVertexArray(vao); } };
}
export function creaPianeta(N, { P, stella = {}, via = null, superficie = () => null, opzioni = {}, corpi = null } = {}) {
  const gl = N.gl, O = { magliePerPixel: 7, puntiPerPixel: 2.6, errorePixel: 1.0, massimoTessere: 110, fili: 0, passiAria: 12, nuvole: 1, onde: 1, rilievo: 1, lune: true, anelli: true, ...opzioni };
  const R = P.raggioM, schiaccia = 1 - Math.min(0.3, P.schiacciamento || 0), grav = P.clima?.g || (6.674e-11 * P.massaKg) / (R * R);
  // ---------- i corpi: la stella al centro, il pianeta che le gira attorno e gira su sé stesso, le lune
  const Tstella = stella.T || 5772, raggioStella = Math.sqrt((P.Lw || 3.8e26) / (4 * Math.PI * 5.670374e-8 * Tstella ** 4));
  const nero = coloreCorpoNero(Tstella), coloreLuce = nero.map((c) => 0.45 + 0.55 * c); // (l'occhio si adatta in parte al colore della stella)
  const corpoStella = corpi ? corpi.stella : N.corpo({ nome: 'stella', luogo: via ? `cosmo ${via.cosmo}/galassia ${via.galassia}/stella ${via.stella}` : null, raggio: raggioStella, luce: { colore: coloreLuce, T: Tstella } });
  const anno = P.anno || 3.15e7, f0 = (P.fase || 0) / (2 * Math.PI), eps = (P.obliquita || 0) * RAD, verso = P.retrogrado ? -1 : 1, giorno = P.giorno || 86400, inclina = V.giro([0, 0, 1], -eps);
  const frazioneAnno = (t) => { const f = t / anno + f0; return f - Math.floor(f); };
  // verso la stella (assi inerziali): la declinazione della stella è ε·sin(2π·f), come nel clima di geologia.js
  const versoStella = (t, o = [0, 0, 0]) => { const a = 2 * Math.PI * frazioneAnno(t); o[0] = Math.sin(a); o[1] = 0; o[2] = Math.cos(a); return o; };
  const suolo3d = {
    posizione: (t, o) => { versoStella(t, o); const d = -(P.aM || 1.5e11); o[0] *= d; o[1] *= d; o[2] *= d; return o; },
    // (se è bloccato mostra alla stella sempre la longitudine 0, come nel clima)
    assetto: (t) => { const a = P.bloccato ? 2 * Math.PI * frazioneAnno(t) - Math.PI / 2 : verso * 2 * Math.PI * ((t / giorno) % 1); return V.mm(inclina, V.giro([0, 1, 0], a)); } };
  const terreno = {
    quota: (dir) => quotaLungo(dir), colpisci: (o, d) => colpisci(o, d),
    // la verticale di un punto (la normale dell'ellissoide), la sua longitudine e latitudine sulla carta, e il punto a una quota data
    verticale: (p) => V.norma([p[0], p[1] / (schiaccia * schiaccia), p[2]]), lonLat: (p) => lonLat(tondo(p)),
    punto: (lon, lat, h) => { const cl = Math.cos(lat), q = [cl * Math.cos(lon), Math.sin(lat), -cl * Math.sin(lon)], [a, l] = leggi(lon, lat), r = R + Math.max(a, l), n = V.norma([q[0], q[1] / schiaccia, q[2]]); return [q[0] * r + n[0] * h, q[1] * r * schiaccia + n[1] * h, q[2] * r + n[2] * h]; } };
  const corpoPianeta = corpi ? Object.assign(corpi.pianeta, terreno) : N.corpo({ nome: P.nome || 'pianeta', luogo: via ? `pianeta ${via.pianeta}` : null, periodi: { giro: P.bloccato ? 0 : giorno, orbita: anno }, genitore: corpoStella, raggio: R, ...suolo3d, ...terreno });
  const lune = (O.lune && !corpi ? P.lune || [] : []).map((L) => {
    const fase0 = via ? (semeEvento('fase luna', via.cosmo, via.galassia, via.stella, via.pianeta, L.id) / 4294967296) * 2 * Math.PI : L.id * 2.4, a = L.aM, e = L.eccentricita || 0;
    const ghiaccio = L.composizione?.ghiaccio ?? 0.3, tinta = [0.18 + 0.5 * ghiaccio, 0.17 + 0.5 * ghiaccio, 0.16 + 0.52 * ghiaccio];
    return { L, tinta, corpo: N.corpo({ nome: `luna ${L.id}`, luogo: `luna ${L.id}`, periodi: { orbita: L.periodo || 0 }, genitore: corpoPianeta, raggio: L.raggioM, posizione: (t, o) => { const f = fase0 + ((L.retrograda ? -1 : 1) * 2 * Math.PI * t) / L.periodo, r = (a * (1 - e * e)) / (1 + e * Math.cos(f)); return V.mv(inclina, [r * Math.cos(f), 0, -r * Math.sin(f)], o); } }) };
  });

  // a che punto dell'anno si è (0…1, come nel clima di geologia.js: la declinazione della stella è ε·sin(2π·f)), dalla
  // geometria vera: l'asse del pianeta e la direzione della stella in quell'istante
  const _s = [0, 0, 0];
  function stagione(t) {
    if (eps < 0.02) return 0; const decl = (tt) => { const A = corpoPianeta.assetto(tt, new Array(9)), s = V.norma(N.tra(corpoPianeta, corpoStella, tt, _s)); return Math.asin(Math.max(-1, Math.min(1, A[1] * s[0] + A[4] * s[1] + A[7] * s[2]))); };
    const d = decl(t), x = Math.asin(Math.max(-1, Math.min(1, d / eps))) / (2 * Math.PI), sale = decl(t + anno / 400) > d, f = sale ? x : 0.5 - x; return f - Math.floor(f);
  }
  // ---------- l'aria: dai gas veri e dalla pressione
  const aria = (() => {
    const p = P.clima?.pressione || 0, gas = P.atmosfera?.gas || null; if (!(p > 1) || !isFinite(p)) return null;
    let M = 0, diff = 0, tot = 0; for (const [nome, x] of Object.entries(gas || { N2: 1 })) { const g = GAS[nome] || [0.03, 1]; M += x * g[0]; diff += x * g[1]; tot += x; } M /= tot || 1; diff /= tot || 1;
    const T = P.clima.Taria || P.clima.T || 250, H = (R_GAS * T) / (M * grav), densita = p / (K_B * T) / 2.547e25; // molecole rispetto all'aria della Terra al suolo (2,55·10²⁵ per m³)
    // Rayleigh dell'aria terrestre al suolo: 5,8 · 13,5 · 33,1 per milione di metri (680, 550, 440 nm)
    const betaR = [5.8e-6, 13.5e-6, 33.1e-6].map((b) => b * densita * diff), foschia = 2.5e-6 * Math.min(40, densita) * (1 + 12 * (P.atmosfera?.fuliggine || 0) + 40 * (gas?.H2O || 0));
    return { H, HM: Math.max(600, 0.15 * H), cima: Math.min(0.6 * R, H * Math.max(8, 4 + Math.log(Math.max(1, densita * diff)) * 2.5 + 6)), betaR, betaM: foschia, pressione: p, T, M };
  })();
  // LA LUCE DIFFUSA PIÙ VOLTE E LA LUCE DEL CIELO SUL SUOLO. Il conto lungo i raggi (F_ARIA) segue la luce diffusa una volta
  // sola; dove l'aria è spessa (su questo genere di mondi lo spessore ottico nel blu arriva a 3) la luce diffusa più volte
  // è la parte maggiore: senza, l'aria spessa toglie il blu e non lo rende, e il pianeta esce scuro e arrossato.
  // Qui, una volta per pianeta, la tabella di Hillaire (2020, «A Scalable and Production Ready Sky and Atmosphere Rendering
  // Technique», EGSR): in ogni punto (quota × altezza della stella, 32 × 32) la luce diffusa due volte che arriva da tutte
  // le direzioni (L₂, con 64 direzioni e il suolo che rimanda la luce con l'albedo del clima) e la parte f che l'aria
  // ridiffonde: tutte le volte successive valgono L₂/(1 − f). E l'irradianza del cielo su un suolo orizzontale (semplice +
  // multipla, 256 direzioni) per 32 altezze della stella: la luce del cielo sul suolo e sulle nuvole, e il cielo riflesso
  // dal mare. Gli stessi coefficienti, la stessa funzione di Chapman, la stessa foschia del conto sulla scheda.
  const tabelle = (() => {
    const NM = 32, ms = new Float32Array(4 * NM * NM), cieloT = new Float32Array(4 * NM); if (!aria) return { ms, cieloT };
    const { H, HM, cima, betaR, betaM } = aria, Rt = R + cima, albedo = Math.max(0.02, Math.min(0.9, P.clima?.albedo ?? 0.3)), g = 0.76;
    const chap = (X, c) => { const k = Math.sqrt(1.5707963 * X); return k / ((k - 1) * c + 1); };
    const spess = (r, mu, Hs) => { const rho = Math.exp(Math.max(-40, Math.min(8, -(r - R) / Hs))); if (mu >= 0) return rho * chap(r / Hs, mu); const rt = r * Math.sqrt(Math.max(0, 1 - mu * mu)); if (rt < R) return 1e7; return 2 * Math.exp(-(rt - R) / Hs) * chap(rt / Hs, 0) - rho * chap(r / Hs, -mu); };
    const sole = (r, mu, o) => { const a = spess(r, mu, H) * H, b = betaM * 1.1 * HM * spess(r, mu, HM); for (let c = 0; c < 3; c++) o[c] = Math.exp(-(betaR[c] * a + b)); return o; };
    const dirs = (n) => { const d = []; for (let i = 0; i < n; i++) { const y = 1 - (2 * (i + 0.5)) / n, q = Math.sqrt(1 - y * y), a = i * 2.39996323; d.push([q * Math.cos(a), y, q * Math.sin(a)]); } return d; };
    const Ts = [0, 0, 0];
    // lungo un raggio dal punto (0, r, 0): chiama f(rp, mus, Te, ds, ρR, ρM) a ogni passo; restituisce [Te alla fine, μ della stella al suolo] o null
    const marcia = (r, d, s, f) => { const b = r * d[1], disc = b * b - r * r + R * R, aTerra = disc > 0 && -b - Math.sqrt(disc) > 0, fine = aTerra ? -b - Math.sqrt(disc) : -b + Math.sqrt(Math.max(0, b * b - r * r + Rt * Rt)), NS = 24, ds = fine / NS, od = [0, 0, 0], Te = [1, 1, 1];
      for (let k = 0; k < NS; k++) { const t = (k + 0.5) * ds, px = d[0] * t, py = r + d[1] * t, pz = d[2] * t, rp = Math.hypot(px, py, pz), h = rp - R, rR = Math.exp(-h / H), rM = Math.exp(-h / HM);
        for (let c = 0; c < 3; c++) { od[c] += (betaR[c] * rR + betaM * 1.1 * rM) * ds * 0.5; Te[c] = Math.exp(-od[c]); }
        f(rp, (px * s[0] + py * s[1] + pz * s[2]) / rp, Te, ds, rR, rM, d);
        for (let c = 0; c < 3; c++) od[c] += (betaR[c] * rR + betaM * 1.1 * rM) * ds * 0.5; }
      if (!aTerra) return null; const pz = [d[0] * fine, r + d[1] * fine, d[2] * fine]; for (let c = 0; c < 3; c++) Te[c] = Math.exp(-od[c]); return [Te, (pz[0] * s[0] + pz[1] * s[1] + pz[2] * s[2]) / R]; };
    const D64 = dirs(64), D256 = dirs(256).filter((d) => d[1] > 0);
    for (let ih = 0; ih < NM; ih++) for (let im = 0; im < NM; im++) {
      const r = R + Math.max(1, cima * (ih / (NM - 1)) ** 2), mu = -1 + (2 * im) / (NM - 1), s = [Math.sqrt(1 - mu * mu), mu, 0], L2 = [0, 0, 0], fm = [0, 0, 0];
      for (const d of D64) {
        const suolo = marcia(r, d, s, (rp, mus, Te, ds, rR, rM) => { sole(rp, mus, Ts); for (let c = 0; c < 3; c++) { const sc = betaR[c] * rR + betaM * rM; L2[c] += (Te[c] * sc * Ts[c] * ds) / (4 * Math.PI); fm[c] += Te[c] * sc * ds; } });
        if (suolo && suolo[1] > 0) { sole(R, suolo[1], Ts); for (let c = 0; c < 3; c++) L2[c] += (suolo[0][c] * Ts[c] * suolo[1] * albedo) / Math.PI; } }
      for (let c = 0; c < 3; c++) { const v = L2[c] / 64 / Math.max(0.05, 1 - fm[c] / 64); ms[4 * (ih * NM + im) + c] = Number.isFinite(v) ? v : 0; }
      ms[4 * (ih * NM + im) + 3] = 1; }
    const psi = (rp, mus, c) => { const x = Math.max(0, Math.min(NM - 1.001, (mus * 0.5 + 0.5) * (NM - 1))), y = Math.max(0, Math.min(NM - 1.001, Math.sqrt(Math.max(0, Math.min(1, (rp - R) / cima))) * (NM - 1))), i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, q = (jj, ii) => ms[4 * (jj * NM + ii) + c];
      return (q(j, i) * (1 - u) + q(j, i + 1) * u) * (1 - v) + (q(j + 1, i) * (1 - u) + q(j + 1, i + 1) * u) * v; };
    for (let im = 0; im < NM; im++) { const mu = -1 + (2 * im) / (NM - 1), s = [Math.sqrt(1 - mu * mu), mu, 0], E = [0, 0, 0];
      for (const d of D256) { const cosS = d[0] * s[0] + d[1] * s[1], fR = (3 / (16 * Math.PI)) * (1 + cosS * cosS), fM = (1 - g * g) / (4 * Math.PI * Math.pow(1 + g * g - 2 * g * cosS, 1.5)), w = (2 * Math.PI) / D256.length;
        marcia(R + 1, d, s, (rp, mus, Te, ds, rR, rM) => { sole(rp, mus, Ts); for (let c = 0; c < 3; c++) E[c] += w * d[1] * Te[c] * ds * (betaR[c] * rR * fR * Ts[c] + betaM * rM * fM * Ts[c] + (betaR[c] * rR + betaM * rM) * psi(rp, mus, c)); }); }
      cieloT.set([E[0], E[1], E[2], 1], 4 * im); }
    return { ms, cieloT };
  })();
  const texMS = N.immagine(32, 32, 'rgba16fDaFloat', tabelle.ms), texCielo = N.immagine(32, 1, 'rgba16fDaFloat', tabelle.cieloT);
  // il raggio angolare della stella vista dal pianeta: la penombra delle ombre del rilievo
  const discoStella = () => Math.max(1e-3, Math.min(0.2, (corpoStella.raggio || raggioStella) / Math.max(1, stato.dStella)));

  // ---------- le tessere: chieste al filo a parte, tenute finché servono
  const tessere = new Map(), coda = [], fili = [], base = { pronta: false, k: null };
  let S0 = null, uso = 0, richieste = 0, arrivate = 0, msTessere = 0;
  const chiave = (L, tx, ty) => L * 1e10 + ty * 1e5 + tx;
  const liscio = { L: -1, alt: N.immagine(2, 2, 'rg32f', new Float32Array([0, -1e5, 0, -1e5, 0, -1e5, 0, -1e5]), { filtro: gl.NEAREST }), pend: N.immagine(1, 1, 'rgba16fDaFloat', new Float32Array([0, 0, 1, 0])), terra: N.immagine(1, 1, 'rgba8', new Uint8Array([...(P.colore || [150, 140, 120]), 255])), acqua: null, oriz1: null, oriz2: null, hMin: 0, hMax: 0, altLiv: null };
  const trasparente = N.immagine(1, 1, 'rgba8', new Uint8Array([0, 0, 0, 0])); liscio.oriz1 = liscio.oriz2 = trasparente;
  function avviaFili() {
    S0 = superficie(); if (!S0 || base.pronta) return; base.pronta = true; base.k = S0.k;
    const quanti = O.fili || Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
    for (let i = 0; i < quanti; i++) {
      const w = new Worker(new URL('./tessere.worker.js', import.meta.url), { type: 'module' }), f = { w, libero: true };
      w.onmessage = (e) => { f.libero = true; arrivata(e.data); distribuisci(); };
      w.onerror = (e) => { console.error('mondo3d: il filo delle tessere si è fermato:', e.message); f.libero = true; };
      w.postMessage({ tipo: 'base', k: S0.k, se: S0.se, cl: S0.cl, mare: S0.mare, seme: S0.seme, T: P.clima.T, raggioM: R }); fili.push(f);
    }
    chiedi(0, 0, 0, 0); preparaMeteo();
  }
  function chiedi(L, tx, ty, priorita) {
    const k = chiave(L, tx, ty); let t = tessere.get(k);
    if (!t) { t = { k, L, tx, ty, pronta: false, inCoda: true, priorita, uso }; tessere.set(k, t); coda.push(t); richieste++; }
    else if (t.inCoda) t.priorita = Math.min(t.priorita, priorita);
    t.uso = uso; return t;
  }
  function distribuisci() {
    for (const f of fili) { if (!f.libero || !coda.length) continue;
      let m = 0; for (let i = 1; i < coda.length; i++) if (coda[i].priorita < coda[m].priorita) m = i;
      const t = coda.splice(m, 1)[0]; t.inCoda = false;
      if (uso - t.uso > 30) { tessere.delete(t.k); continue; } // nessuno la guarda più
      f.libero = false; f.w.postMessage({ tipo: 'tessera', n: t.k, L: t.L, tx: t.tx, ty: t.ty }); }
    for (const t of coda) t.priorita = Infinity; // le priorità si rifanno a ogni fotogramma
  }
  function arrivata(d) {
    const t = tessere.get(d.n); if (!t || d.k !== base.k) return; arrivate++;
    if (d.errore) { console.error('mondo3d: tessera non riuscita:', d.errore); tessere.delete(d.n); return; }
    msTessere += d.ms;
    Object.assign(t, { pronta: true, alt: N.immagine(TWB, THB, 'rg32f', d.altLiv, { filtro: gl.NEAREST }), pend: N.immagine(TW, TH, 'rgba16fDaFloat', d.pend, { mip: true }), terra: N.immagine(TW, TH, 'rgba8', d.terra, { mip: true }), acqua: d.acqua ? N.immagine(TW, TH, 'rgba8', d.acqua, { mip: true }) : null, oriz1: N.immagine(TW, TH, 'rgba8', d.oriz1, { mip: true }), oriz2: N.immagine(TW, TH, 'rgba8', d.oriz2, { mip: true }), altLiv: d.altLiv, hMin: d.hMin, hMax: d.hMax, haAcqua: d.haAcqua });
    if (t.L === 0) { hMinTutto = d.hMin; hMaxTutto = d.hMax; }
    // la memoria è limitata: si buttano quelle che da più tempo nessuno guarda (mai il livello 0)
    if (tessere.size > O.massimoTessere) { const v = [...tessere.values()].filter((x) => x.pronta && x.L > 0 && x.uso < uso - 2).sort((a, b) => a.uso - b.uso); for (const x of v.slice(0, tessere.size - O.massimoTessere)) butta(x); }
    N.cambia();
  }
  function butta(t) { for (const k of ['alt', 'pend', 'terra', 'acqua', 'oriz1', 'oriz2']) if (t[k]) gl.deleteTexture(t[k]); tessere.delete(t.k); }
  let hMinTutto = 0, hMaxTutto = 0;
  // la tessera pronta più fine che contiene un punto (u, v da 0 a 1), al più del livello dato
  function migliore(u, v, Lvoluto) { for (let L = Lvoluto; L >= 0; L--) { const n = 4 ** L, t = tessere.get(chiave(L, Math.min(n - 1, Math.floor(u * n)), Math.min(n - 1, Math.floor(v * n)))); if (t && t.pronta) return t; } return null; }
  // la quota (m sopra il raggio di riferimento) del terreno e dell'acqua in un punto: dalla tessera più fine che c'è
  function leggi(lon, lat) {
    let u = lon / (2 * Math.PI) + 0.5; u -= Math.floor(u); const v = Math.max(0, Math.min(0.999999, 0.5 - lat / Math.PI)), t = migliore(u, v, LMAX); if (!t) return [0, -1e5];
    const n = 4 ** t.L, px = (u * n - t.tx) * TW + 0.5, py = (v * n - t.ty) * TH + 0.5, i = Math.max(0, Math.min(TWB - 2, Math.floor(px))), j = Math.max(0, Math.min(THB - 2, Math.floor(py))), a = Math.max(0, Math.min(1, px - i)), b = Math.max(0, Math.min(1, py - j)), q = 2 * (j * TWB + i), A = t.altLiv;
    const bil = (o) => (A[q + o] * (1 - a) + A[q + 2 + o] * a) * (1 - b) + (A[q + 2 * TWB + o] * (1 - a) + A[q + 2 * TWB + 2 + o] * a) * b;
    return [bil(0) * O.rilievo, bil(1) > -9e4 ? bil(1) * O.rilievo : -1e5];
  }
  // dagli assi del corpo allo spazio in cui il pianeta è tondo, e ritorno
  const tondo = (p, o = [0, 0, 0]) => { o[0] = p[0]; o[1] = p[1] / schiaccia; o[2] = p[2]; return o; };
  const lonLat = (q) => { const r = V.lungo(q); return [Math.atan2(-q[2], q[0]), Math.asin(Math.max(-1, Math.min(1, q[1] / r)))]; };
  function quotaLungo(dir) { const q = V.norma(tondo(dir)), [lon, lat] = lonLat(q), [h, l] = leggi(lon, lat), r = R + Math.max(h, l); return Math.hypot(q[0] * r, q[1] * r * schiaccia, q[2] * r); }
  // dove un raggio tocca il suolo: si avanza di quanto si è alti sopra il terreno, finché lo si tocca
  function colpisci(o, d) {
    const oq = tondo(o), dq = tondo(d), ld = V.lungo(dq), dn = V.per(dq, 1 / ld), Rm = R + Math.max(0, hMaxTutto * O.rilievo) + 10, b = -V.scal(oq, dn), disc = b * b - V.scal(oq, oq) + Rm * Rm; if (disc < 0) return Infinity;
    let t = Math.max(0, b - Math.sqrt(disc)); const fine = b + Math.sqrt(disc);
    for (let i = 0; i < 200 && t < fine; i++) { const p = [oq[0] + dn[0] * t, oq[1] + dn[1] * t, oq[2] + dn[2] * t], r = V.lungo(p), [lon, lat] = lonLat(p), [h, l] = leggi(lon, lat), sopra = r - R - Math.max(h, l); if (sopra < Math.max(0.3, 2e-4 * t)) return t / ld; t += Math.max(0.5, sopra * 0.6); }
    return Infinity;
  }

  // ---------- la griglia di una pezza (uguale per tutte): 33 × 17 vertici più l'orlo
  const griglia = (() => {
    const v = [], idx = [], nx = MX + 1, ny = MY + 1; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v.push(i / MX, j / MY, 0);
    for (let j = 0; j < MY; j++) for (let i = 0; i < MX; i++) { const a = j * nx + i; idx.push(a, a + nx, a + 1, a + 1, a + nx, a + nx + 1); }
    // l'orlo: per ogni lato, i vertici del bordo ripetuti e abbassati
    const orlo = (lista) => { const da = v.length / 3; for (const [i, j] of lista) v.push(i / MX, j / MY, 1); for (let k = 0; k + 1 < lista.length; k++) { const a = lista[k][1] * nx + lista[k][0], b = lista[k + 1][1] * nx + lista[k + 1][0]; idx.push(a, da + k, b, b, da + k, da + k + 1, a, b, da + k, b, da + k + 1, da + k); } }; // (da tutte e due le facce: l'orlo si vede da fuori della pezza, e su due lati su quattro il verso sarebbe quello sbagliato)
    const riga = (n, f) => Array.from({ length: n + 1 }, (_, k) => f(k));
    orlo(riga(MX, (k) => [k, 0])); orlo(riga(MX, (k) => [k, MY])); orlo(riga(MY, (k) => [0, k])); orlo(riga(MY, (k) => [MX, k]));
    const vao = gl.createVertexArray(), bv = gl.createBuffer(), bi = gl.createBuffer(); gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, bv); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bi); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW); gl.bindVertexArray(null);
    return { vao, bv, bi, n: idx.length };
  })();
  const quadrato = (() => { const vao = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); return { vao, b }; })();
  const prgSuolo = N.programma(V_SUOLO, F_SUOLO, { a_griglia: 0 }), prgSfera = N.programma(V_SFERA, F_SFERA, { a_angolo: 0 });
  let prgAria = null, prgStelle = null;

  // ---------- le onde del mare: le stesse componenti di mare.js (16 lunghezze per 12 direzioni, con le loro fasi: sono
  // eventi del pianeta), alte quanto dice lo spettro del punto in cui si è
  let onde = null, ondeQui = null, ondeDove = null;
  function componentiOnde() {
    if (onde || !S0?.mare?.esiste) return onde; const st = S0.mare, ev = sorgente(`${st.radice}/onde`), n = 16 * 12, g = st.gravita || grav;
    onde = { n, k: new Float64Array(n), cx: new Float64Array(n), cy: new Float64Array(n), fase: new Float64Array(n), om: new Float64Array(n), lam: new Float64Array(n), amp: new Float64Array(n), g };
    for (let j = 0; j < 16; j++) for (let a = 0; a < 12; a++) { const q = j * 12 + a, lam = 0.02 * Math.pow(10, (j + 0.6 * (ev(`lunghezza ${j}/${a}`) - 0.5)) / 3), az = ((a + 0.7 * (ev(`direzione ${j}/${a}`) - 0.5)) * 2 * Math.PI) / 12;
      onde.lam[q] = lam; onde.k[q] = (2 * Math.PI) / lam; onde.cx[q] = Math.cos(az); onde.cy[q] = Math.sin(az); onde.fase[q] = 2 * Math.PI * ev(`fase ${j}/${a}`); onde.om[q] = Math.sqrt(g * onde.k[q] + 7.4e-5 * onde.k[q] ** 3); }
    return onde;
  }
  // le ampiezze in un punto: lo spettro di Pierson e Moskowitz col picco dal periodo e la somma dall'altezza, sparso
  // attorno al vento (cos²) e, per il mare lungo, stretto attorno alla sua direzione (lo stesso conto di mare.js)
  function ampiezzeOnde(m) {
    const co = onde, out = co.amp; out.fill(0);
    for (const [Hs, Tp, dx, dy, punta] of [[m.H, m.T, m.ax, m.ay, 2], [m.Hl, m.Tl, m.lx, m.ly, 10]]) { if (!(Hs > 1e-4) || !(Tp > 0)) continue; const kp = (2 * Math.PI / Tp) ** 2 / co.g, D = new Float64Array(12);
      for (let j = 0; j < 16; j++) { let somma = 0; for (let a = 0; a < 12; a++) { const q = j * 12 + a, cs = Math.max(0, co.cx[q] * dx + co.cy[q] * dy); D[a] = Math.pow(cs, punta); somma += D[a]; }
        const r = kp / co.k[j * 12], E = ((Hs * Hs) / 16) * 5 * r * r * Math.exp(-1.25 * r * r) * (Math.LN10 / 3); if (!(somma > 0)) continue;
        for (let a = 0; a < 12; a++) { const q = j * 12 + a; out[q] = Math.sqrt(out[q] * out[q] + (2 * E * D[a]) / somma); } } }
    return out;
  }
  let ondeNelPunto = null; import('../camera/mare.js').then((m) => { ondeNelPunto = m.ondeNelPunto; }).catch(() => {});
  function aggiornaOnde(lon, lat) {
    if (!componentiOnde() || !ondeNelPunto || !O.onde) { ondeQui = null; return; }
    if (ondeDove && Math.abs(ondeDove[0] - lon) < 2e-4 && Math.abs(ondeDove[1] - lat) < 2e-4 && ondeQui) return;
    ondeDove = [lon, lat]; const m = ondeNelPunto(S0.mare, lon / RAD, lat / RAD); ampiezzeOnde(m); ondeQui = m;
  }

  // ---------- le nuvole: la copertura e i venti di meteo.js in un'immagine (rifatta quando la stagione cambia)
  let meteoTex = null, meteoStagione = -9, nuvoleMedie = 0;
  function preparaMeteo(t = 0) {
    const m = S0?.cl?.meteo; if (!m || !m.nuvole || !aria) return; const st = Array.isArray(m.stagioni) && m.stagioni.length > 1 ? m.stagioni : null;
    const x = st ? stagione(t) * st.length - 0.5 : 0; if (meteoTex && Math.abs(x - meteoStagione) < 0.04) return; meteoStagione = x;
    const n = m.W * m.H, dati = new Float32Array(4 * n), i0 = st ? ((Math.floor(x) % st.length) + st.length) % st.length : 0, i1 = st ? (i0 + 1) % st.length : 0, f = st ? x - Math.floor(x) : 0, A = st ? st[i0] : m, B = st ? st[i1] : m; let somma = 0;
    for (let k = 0; k < n; k++) { dati[4 * k] = A.nuvole[k] * (1 - f) + B.nuvole[k] * f; dati[4 * k + 1] = A.u[k] * (1 - f) + B.u[k] * f; dati[4 * k + 2] = A.v[k] * (1 - f) + B.v[k] * f; dati[4 * k + 3] = 1; somma += dati[4 * k]; }
    nuvoleMedie = somma / n; if (meteoTex) gl.deleteTexture(meteoTex); meteoTex = N.immagine(m.W, m.H, 'rgba16fDaFloat', dati, { ripeti: 'x' });
  }

  // ---------- quali pezze disegnare: si scende nell'albero finché le maglie sono abbastanza piccole sullo schermo
  let lista = [], pezze = 0, triangoli = 0, fotogramma = 0;
  const stato = { A: null, Ap: null, versoC: [0, 0, 0], occhioCorpo: [0, 0, 0], assi: null, sole: [1, 0, 0], dStella: 1, E: 1, quota: 0 };
  const Lstella = () => corpoStella.luminosita || P.Lw || 3.8e26, espo = (S) => (N.opzioni.esposizione > 0 ? N.opzioni.esposizione : S.espo(stato.E));
  // quanto il terreno di una pezza si scosta dal piano tra i suoi angoli (m): 5 × 5 punti letti dalla tessera
  function ruvido(t, u0, v0, du) {
    if (!t || !t.altLiv) return 0; const n = 4 ** t.L, A = t.altLiv, x0 = (u0 * n - t.tx) * TW + 1, y0 = (v0 * n - t.ty) * TH + 1, w = du * n * TW, h = du * n * TH, q = new Array(25);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const x = Math.max(0, Math.min(TWB - 1, Math.round(x0 + (w * i) / 4 - 0.5))), y = Math.max(0, Math.min(THB - 1, Math.round(y0 + (h * j) / 4 - 0.5))), k = 2 * (y * TWB + x); q[5 * j + i] = Math.max(A[k], A[k + 1]); }
    let r = 0; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) { const a = i / 4, b = j / 4, piano = (q[0] * (1 - a) + q[4] * a) * (1 - b) + (q[20] * (1 - a) + q[24] * a) * b; r = Math.max(r, Math.abs(q[5 * j + i] - piano)); }
    return r * O.rilievo;
  }
  const striscio = (dist) => Math.max(0.3, Math.min(1, Math.sqrt(Math.max(1, stato.quota) / dist)));
  // la distanza a cui il livello L di tessera lascia il posto al livello sopra (la stessa regola di `visita`, rovesciata)
  function distanzaLivello(L, S) {
    const D0 = (S.fuoco * R * Math.PI) / (TH * O.puntiPerPixel * Math.pow(4, L - 0.5)), h = Math.max(1, stato.quota); if (D0 <= h) return D0;
    const D1 = Math.pow(D0 * Math.sqrt(h), 2 / 3); return Math.sqrt(h / D1) >= 0.3 ? D1 : 0.3 * D0;
  }
  function visita(d, ix, iy, S) {
    const n = 2 ** d, du = 1 / n, u0 = ix * du, v0 = iy * du, lon0 = (u0 + du / 2 - 0.5) * 2 * Math.PI, lat0 = (0.5 - (v0 + du / 2)) * Math.PI, dLon = du * 2 * Math.PI, dLat = du * Math.PI;
    // la tessera più fine, tra quelle arrivate, che contiene tutta la pezza
    const t = base.pronta ? migliore(u0 + du / 2, v0 + du / 2, Math.min(LMAX, d >> 1)) : null, hm = t ? ((t.hMin + t.hMax) / 2) * O.rilievo : 0, hd = t ? (t.hMax - t.hMin) * O.rilievo : 0;
    const cl = Math.cos(lat0), c0 = [cl * Math.cos(lon0), Math.sin(lat0), -cl * Math.sin(lon0)];
    // il centro nello spazio del corpo (schiacciato), rispetto all'occhio
    const pc = [c0[0] * (R + hm), c0[1] * (R + hm) * schiaccia, c0[2] * (R + hm)], dx = pc[0] - stato.occhioCorpo[0], dy = pc[1] - stato.occhioCorpo[1], dz = pc[2] - stato.occhioCorpo[2];
    const lato = R * dLat, raggio = d === 0 ? R * 1.6 : 0.5 * Math.hypot(lato * 2 * Math.max(0.05, Math.cos(Math.max(0, Math.abs(lat0) - dLat / 2))), lato) + hd * 0.5 + 50, dist = Math.hypot(dx, dy, dz);
    if (d > 0) {
      // sotto l'orizzonte?
      const ro = V.lungo(stato.occhioTondo), cosA = (c0[0] * stato.occhioTondo[0] + c0[1] * stato.occhioTondo[1] + c0[2] * stato.occhioTondo[2]) / ro, Rb = R + Math.min(0, hMinTutto * O.rilievo) - 200;
      const orizzonte = Math.acos(Math.min(1, Rb / Math.max(ro, Rb))) + Math.acos(Math.min(1, Rb / (R + Math.max(0, hMaxTutto * O.rilievo) + 200))) + (0.75 * Math.hypot(dLon, dLat));
      if (Math.acos(Math.max(-1, Math.min(1, cosA))) > orizzonte) return;
      // fuori dal campo?
      const e = V.tv(stato.assiCorpo, [dx, dy, dz]), lx = Math.hypot(1, S.tanX), ly = Math.hypot(1, S.tanY);
      if (e[2] - raggio > 0 || (e[0] + e[2] * S.tanX) / lx > raggio || (-e[0] + e[2] * S.tanX) / lx > raggio || (e[1] + e[2] * S.tanY) / ly > raggio || (-e[1] + e[2] * S.tanY) / ly > raggio) return;
    }
    const vicino = Math.max(dist - raggio, stato.quota * 0.9, 1), pxPerMetro = S.fuoco / vicino, maglia = (lato / MY) * pxPerMetro;
    // il livello di tessera che questa distanza chiede: i suoi punti grandi circa `puntiPerPixel` sullo schermo
    // (visto di striscio il terreno è schiacciato sullo schermo: a `dist` da un occhio alto `quota` di un fattore quota/dist
    // lungo lo sguardo; si conta la media delle due direzioni, mai sotto 0,3: senza, guardando l'orizzonte da bassi
    // ogni livello chiederebbe decine di tessere)
    const Lv = Math.max(0, Math.min(LMAX, Math.round(Math.log((R * Math.PI * pxPerMetro * striscio(vicino)) / (TH * O.puntiPerPixel)) / Math.log(4))));
    // si spezza: se la pezza è più grande della tessera che le serve; se il suo terreno è troppo mosso per le sue maglie;
    // (sull'acqua) se è abbastanza vicina perché le onde lunghe muovano i vertici
    let spezza = d < 2 || d < 2 * Lv;
    if (!spezza && d < DMAX && maglia > 2.5) { const r = ruvido(t, u0, v0, du); spezza = r * 0.06 * pxPerMetro > O.errorePixel || (maglia > O.magliePerPixel * 4) || (r < 0.5 && t && t.haAcqua && maglia > 14 && dist < 6000); }
    if (spezza && d < DMAX) { for (let q = 0; q < 4; q++) visita(d + 1, 2 * ix + (q & 1), 2 * iy + (q >> 1), S); return; }
    // se la tessera che servirebbe manca, si chiede la prima che manca scendendo da quella che c'è
    if (base.pronta) { const La = t ? t.L : -1, Lq = Math.min(Lv, d >> 1); if (La < Lq) { const L = La + 1, m = 4 ** L; chiedi(L, Math.min(m - 1, Math.floor((u0 + du / 2) * m)), Math.min(m - 1, Math.floor((v0 + du / 2) * m)), vicino * (1 + L)); } if (t) t.uso = uso; }
    // (per disegnare, mai una tessera più fine di quella che la distanza chiede: i suoi punti sarebbero più piccoli di quelli dello schermo)
    const td = t && t.L > Lv ? migliore(u0 + du / 2, v0 + du / 2, Lv) || t : t; if (td) td.uso = uso;
    lista.push({ d, u0, v0, du, lon0, lat0, dLon, dLat, c0, t: td || liscio, dist: vicino });
  }

  // ---------- lo strato del suolo e del mare
  const u9 = new Float32Array(9), ondaV = new Float32Array(4 * N_ONDE), pulsaV = new Float32Array(N_ONDE), ondaF = new Float32Array(4 * N_ONDE), pulsaF = new Float32Array(N_ONDE);
  const mat3 = (cols, out = u9) => { for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) out[3 * c + r] = cols[c][r]; return out; };
  const suolo = {
    nome: 'suolo',
    aggiorna(S) {
      uso++; fotogramma++; if (!base.pronta) avviaFili(); else preparaMeteo(S.t);
      const A = S.assetto(corpoPianeta), versoC = S.versoCorpo(corpoPianeta, stato.versoC), At = V.trasposta(A);
      stato.A = A; stato.occhioCorpo = V.mv(At, V.per(versoC, -1)); stato.occhioTondo = tondo(stato.occhioCorpo); stato.assiCorpo = V.mm(At, S.assi);
      stato.quota = V.lungo(stato.occhioCorpo) - quotaLungo(V.norma(stato.occhioCorpo));
      lista = []; visita(0, 0, 0, S); distribuisci();
      lista.sort((a, b) => (a.t.k || 0) - (b.t.k || 0) || a.dist - b.dist); pezze = lista.length; triangoli = pezze * (griglia.n / 3);
      const [lon, lat] = lonLat(stato.occhioTondo); stato.lon = lon; stato.lat = lat; aggiornaOnde(lon, lat);
      const vs = N.tra(corpoPianeta, corpoStella, S.t); stato.dStella = V.lungo(vs); stato.sole = V.norma(vs); stato.E = Lstella() / (4 * Math.PI * stato.dStella ** 2);
      // quanta luce c'è dove si è: in orbita quella del giorno; vicino al suolo quella del posto (di notte l'occhio si apre)
      const sole = V.tv(A, stato.sole), mu = V.scal(V.norma(stato.occhioCorpo), sole), giorno = Math.max(0, Math.min(1, (mu + 0.12) / 0.3)), vicino = Math.max(0, Math.min(1, 1 - stato.quota / (0.25 * R)));
      // la luce che l'occhio chiede: quella della stella qui, meno di notte vicino al suolo (se si è lontanissimi dal pianeta non si chiede niente)
      if (V.lungo(stato.occhioCorpo) < 400 * R) S.proponiLuce(stato.E * (1 - vicino * (1 - Math.max(0.01, giorno))));
    },
    disegna(S, passata) {
      if (passata !== 'solido') return; const P_ = prgSuolo, u = P_.u, A = stato.A; gl.useProgram(P_.p); gl.bindVertexArray(griglia.vao); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc);
      gl.uniform3fv(u.u_sole, stato.sole); gl.uniform3fv(u.u_luce, coloreLuce); gl.uniform1f(u.u_orma, 1 / S.fuoco); gl.uniform1f(u.u_disco, discoStella());
      S.lega(13, texCielo, u.u_cieloT); S.lega(14, texMS, u.u_ms);
      impostaAria(u); impostaNuvole(u, S);
      { const At = V.trasposta(A), M = At.slice(); for (let j = 0; j < 3; j++) M[3 + j] /= schiaccia; gl.uniformMatrix3fv(u.u_tondo, false, [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]]); gl.uniform3f(u.u_centro, stato.versoC[0], stato.versoC[1], stato.versoC[2]); const sc = V.norma(tondo(V.mv(At, stato.sole))); gl.uniform3f(u.u_soleC, sc[0], sc[1], sc[2]); }
      let tess = null, madre = null; const tOnde = S.t % 3600, co = onde, m = ondeQui;
      for (const z of lista) {
        const t = z.t;
        if (t !== tess) { tess = t; madre = t.L > 0 ? tessere.get(chiave(t.L - 1, t.tx >> 2, t.ty >> 2)) : null; if (madre && !madre.pronta) madre = null; const m2 = madre || t;
          S.lega(0, t.alt, u.u_alt); S.lega(1, t.pend, u.u_pend); S.lega(2, t.terra, u.u_terra); S.lega(3, t.acqua || trasparente, u.u_acqua); S.lega(4, t.oriz1, u.u_oriz1); S.lega(10, t.oriz2, u.u_oriz2);
          S.lega(6, m2.alt, u.u_altM); S.lega(7, m2.pend, u.u_pendM); S.lega(8, m2.terra, u.u_terraM); S.lega(9, m2.acqua || trasparente, u.u_acquaM); S.lega(11, m2.oriz1, u.u_oriz1M); S.lega(12, m2.oriz2, u.u_oriz2M); gl.uniform4f(u.u_espo, espo(S), t.acqua ? 1 : 0, m2.acqua ? 1 : 0, 0.0006);
          // (il livello L serve fino alla distanza D; negli ultimi due quinti di D i dati sfumano in quelli della madre)
          const D = madre ? distanzaLivello(t.L, S) : 0; gl.uniform2f(u.u_sfuma, 0.55 * D, 0.95 * D); if (madre) madre.uso = uso; }
        // il centro della pezza rispetto all'occhio, in doppia precisione; poi i tre assi della pezza negli assi del mondo
        const sl = Math.sin(z.lon0), cl = Math.cos(z.lon0), sf = Math.sin(z.lat0), cf = Math.cos(z.lat0), c0 = z.c0, E = [-sl, 0, -cl], Nn = [-sf * cl, cf, sf * sl];
        const C = V.mv(A, [c0[0] * R, c0[1] * R * schiaccia, c0[2] * R]); gl.uniform3f(u.u_C, C[0] + stato.versoC[0], C[1] + stato.versoC[1], C[2] + stato.versoC[2]);
        const sq = (v) => V.mv(A, [v[0], v[1] * schiaccia, v[2]]), nq = (v) => V.mv(A, [v[0], v[1] / schiaccia, v[2]]);
        gl.uniformMatrix3fv(u.u_base, false, mat3([sq(E), sq(Nn), sq(c0)])); gl.uniformMatrix3fv(u.u_normali, false, mat3([nq(E), nq(Nn), nq(c0)]));
        gl.uniform4f(u.u_geo, z.dLon, z.dLat, z.lat0, R);
        if (t.L >= 0) { const n = 4 ** t.L; gl.uniform4f(u.u_tess, z.u0 * n - t.tx, z.v0 * n - t.ty, z.du * n, z.du * n); if (madre) { const nm = n / 4; gl.uniform4f(u.u_tessM, z.u0 * nm - madre.tx, z.v0 * nm - madre.ty, z.du * nm, z.du * nm); } } else gl.uniform4f(u.u_tess, 0, 0, 0, 0);
        const passo = (R * z.dLat) / MY; gl.uniform3f(u.u_orlo, Math.max(2, passo * 3 + (z.d < 3 ? R * 0.02 : 0)), O.rilievo, tOnde);
        // le onde di questa pezza: quelle che le sue maglie risolvono muovono i vertici; quelle più corte, fino a ciò
        // che un punto dello schermo distingue, piegano solo la luce; ciò che è ancora più piccolo allarga il riflesso
        let nV = 0, nF = 0, fine = 0.0012, schiuma = 0;
        if (t.haAcqua && co && m) {
          const pxM = z.dist / S.fuoco, X0 = R * cf * z.lon0, Y0 = R * z.lat0, scelteF = [];
          for (let q = 0; q < co.n; q++) { const a = co.amp[q]; if (a * co.k[q] < 2e-3) continue; const lam = co.lam[q];
            // (troppo corta per lo schermo, o troppo svelta per il tempo che corre — meno di quattro fotogrammi per periodo —: non la si
            // disegna, la sua pendenza va nell'increspatura media del mare)
            if (lam < 3 * pxM || S.passo * 4 * co.om[q] > 2 * Math.PI) { fine += 0.5 * (a * co.k[q]) ** 2; continue; }
            scelteF.push(q); }
          scelteF.sort((a, b) => co.amp[b] * co.k[b] - co.amp[a] * co.k[a]);
          for (const q of scelteF) { const lam = co.lam[q], a = co.amp[q], ke = co.k[q] * co.cx[q], kn = co.k[q] * co.cy[q], f0 = (ke * X0 + kn * Y0 + co.fase[q] - co.om[q] * (S.t - tOnde)) % (2 * Math.PI);
            // (la fase al centro della pezza si conta in doppia precisione: X = R·cos(lat)·lon, Y = R·lat, come in mare.js; dentro la pezza conta lo scarto in metri)
            if (lam > 4 * passo && nV < N_ONDE && z.dist < 4e5) { ondaV.set([ke, kn, a, f0], 4 * nV); pulsaV[nV++] = co.om[q]; }
            if (nF < N_ONDE) { ondaF.set([ke, kn, a, f0], 4 * nF); pulsaF[nF++] = co.om[q]; } else fine += 0.5 * (a * co.k[q]) ** 2; }
          schiuma = Math.min(1, (m.creste || 0) * 30);
        }
        gl.uniform1i(u.u_nOnde, nV); if (nV) { gl.uniform4fv(u.u_onda, ondaV); gl.uniform1fv(u.u_pulsa, pulsaV); }
        gl.uniform1i(u.u_nOndeF, nF); if (nF) { gl.uniform4fv(u.u_ondaF, ondaF); gl.uniform1fv(u.u_pulsaF, pulsaF); }
        gl.uniform4f(u.u_mare, tOnde, fine, schiuma, z.lon0 * sf); gl.uniform1f(u.u_lon0, z.lon0);
        gl.drawElements(gl.TRIANGLES, griglia.n, gl.UNSIGNED_SHORT, 0);
      }
      gl.disable(gl.CULL_FACE); gl.bindVertexArray(null);
    },
  };
  // (il rumore delle nuvole è trascinato dal vento per un periodo e poi ricomincia sfumando: il periodo dura almeno sei
  // secondi di chi guarda, anche quando il tempo corre)
  function impostaNuvole(u, S) {
    const periodo = Math.max(6 * 3600, Math.abs(N.tempo.velocita) * 6); S.lega(5, meteoTex || trasparente, u.u_meteo);
    gl.uniform4f(u.u_nuv, aria ? Math.min(0.7 * aria.H, 9000) : 0, S.t % (periodo * 64), periodo, aria && meteoTex && O.nuvole ? O.nuvole : 0);
  }
  function impostaAria(u) {
    if (aria) { gl.uniform4f(u.u_atm, R, aria.H, aria.HM, aria.cima); gl.uniform3fv(u.u_betaR, aria.betaR); gl.uniform4f(u.u_betaM, aria.betaM, 0.76, 0, 0); }
    else { gl.uniform4f(u.u_atm, R, 1, 1, 0); gl.uniform3f(u.u_betaR, 0, 0, 0); gl.uniform4f(u.u_betaM, 0, 0, 0, 0); }
  }

  // ---------- lo strato dell'aria e delle nuvole
  // A CAMERA FERMA (con N.vista.accumulo): l'aria si calcola una volta sola. Il colore è scena·Tot + Add (vedi F_ARIA):
  // al primo fotogramma fermo la passata scrive Tot e Add sulle immagini sue (e compone), ai seguenti si compone soltanto
  // con la scena di adesso. È lo stesso conto di prima (gli stessi passi, a metà di ogni tratto), non una media: qui la
  // media di passi sfasati, provata, convergeva peggio dei passi a metà (l'aria è liscia) e in moto non faceva risparmiare.
  // In moto, o col tempo che corre più di un secondo per fotogramma, si calcola tutto ogni volta, come senza accumulo.
  let acA = null, prgComponi = null, primaRif = null, primaIndice = -2, primaE0 = 1, pronte = false;
  function componi(S, da, dove, k) {
    if (!prgComponi) prgComponi = N.programma(N.V_SCHERMO, `in vec2 v_uv; out vec4 o; uniform sampler2D u_col, u_add, u_tot; uniform float u_k; void main() { o = vec4(texture(u_col, v_uv).rgb * texture(u_tot, v_uv).rgb + texture(u_add, v_uv).rgb * u_k, 1.0); }`);
    gl.bindFramebuffer(gl.FRAMEBUFFER, dove); gl.viewport(0, 0, S.W, S.H); gl.useProgram(prgComponi.p); S.lega(0, da.col, prgComponi.u.u_col); S.lega(1, acA.add, prgComponi.u.u_add); S.lega(2, acA.tot, prgComponi.u.u_tot); gl.uniform1f(prgComponi.u.u_k, k); S.schermo(); return true;
  }
  // la camera è dov'era al fotogramma prima (negli assi del corpo, che girano con lui) e il mondo è quasi fermo?
  function ferma(S) { const o = stato.occhioCorpo, a = stato.assiCorpo, p = primaRif, r = V.lungo(o) + 1e-30; let si = !!p && S.indice === primaIndice + 1 && Math.abs(S.dt) <= 1 && p.tan === S.tanY && p.W === S.W && p.H === S.H;
    if (si) { for (let i = 0; i < 3; i++) if (Math.abs(o[i] - p.o[i]) > 1e-9 * r) si = false; for (let i = 0; i < 9; i++) if (Math.abs(a[i] - p.a[i]) > 1e-7) si = false; }
    primaRif = { o: o.slice(), a: a.slice(), tan: S.tanY, W: S.W, H: S.H }; primaIndice = S.indice; return si; }
  const cielo3d = {
    libera() { if (acA) { gl.deleteTexture(acA.add); gl.deleteTexture(acA.tot); gl.deleteFramebuffer(acA.f); acA = null; } if (prgComponi) gl.deleteProgram(prgComponi.p); prgComponi = null; },
    nome: 'aria',
    dopo(S, da) {
      if (!aria) return false; const acc = accumuloAttivo(N), fermo = acc && ferma(S), dove = gl.getParameter(gl.FRAMEBUFFER_BINDING);
      if (fermo && pronte) return componi(S, da, dove, primaE0 / S.E0); // (Add è una luce: la si riporta all'E0 di adesso)
      if (!prgAria || prgAria.n !== O.passiAria) { if (prgAria) gl.deleteProgram(prgAria.p); prgAria = { ...N.programma(N.V_SCHERMO, F_ARIA(O.passiAria)), n: O.passiAria }; } const u = prgAria.u, A = stato.A, At = V.trasposta(A); gl.useProgram(prgAria.p);
      S.lega(0, da.col, u.u_col); S.lega(1, da.prof, u.u_prof); S.lega(2, texMS, u.u_ms); S.lega(3, texCielo, u.u_cieloT); impostaNuvole(u, S);
      const o = stato.occhioTondo; gl.uniform3f(u.u_occhio, o[0], o[1], o[2]);
      // dagli assi dell'occhio allo spazio tondo del corpo: (1/schiacciamento sull'asse) · Aᵀ · assi
      const M = V.mm(At, S.assi); for (let j = 0; j < 3; j++) M[3 + j] /= schiaccia; gl.uniformMatrix3fv(u.u_raggi, false, [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]]);
      const s = V.norma(tondo(V.mv(At, stato.sole))); gl.uniform3f(u.u_soleC, s[0], s[1], s[2]);
      gl.uniform4f(u.u_cam, S.tanX, S.tanY, S.fc, espo(S)); gl.uniform3f(u.u_E, Math.PI * coloreLuce[0], Math.PI * coloreLuce[1], Math.PI * coloreLuce[2]);
      impostaAria(u); gl.uniform3f(u.u_sfasa, 0, 0, fermo ? 1 : 0);
      if (!fermo) { pronte = false; S.schermo(); return true; }
      const W = S.W, H = S.H;
      if (!acA || acA.W !== W || acA.H !== H) { if (acA) { gl.deleteTexture(acA.add); gl.deleteTexture(acA.tot); gl.deleteFramebuffer(acA.f); } const add = N.immagine(W, H, 'rgba16f', null, { filtro: gl.NEAREST }), tot = N.immagine(W, H, 'rgba16f', null, { filtro: gl.NEAREST }), f = N.telaio(add, null); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, tot, 0); acA = { W, H, add, tot, f }; }
      gl.bindFramebuffer(gl.FRAMEBUFFER, acA.f); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]); gl.viewport(0, 0, W, H); S.schermo(); gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      pronte = true; primaE0 = S.E0; return componi(S, da, dove, 1);
    },
  };

  // ---------- lo strato dei corpi lontani: la stella, le lune, le stelle di fondo, gli anelli
  const stelle = (() => { const n = 2600, d = new Float32Array(4 * n), ev = sorgente('mondo3d/stelle di fondo'); let s = ev.seme('semi'); const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < n; i++) { const z = 2 * r() - 1, a = 2 * Math.PI * r(), q = Math.sqrt(1 - z * z); d.set([q * Math.cos(a), q * Math.sin(a), z, Math.pow(r(), 4)], 4 * i); }
    const vao = gl.createVertexArray(), b = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, d, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null); return { vao, b, n }; })();
  // gli anelli: una corona di 256 spicchi; una riga di 512 colori dice quanto è fitta e che colore ha a ogni raggio
  const anello = O.anelli && !corpi && P.anello && typeof P.anello.densita === 'function' ? fabbricaAnello(N, P) : null;
  const lontani = {
    nome: 'corpi lontani',
    disegna(S, passata) {
      if (passata === 'fondo') {
        if (!prgStelle) prgStelle = N.programma(V_STELLE, F_STELLE, { a_stella: 0 }); gl.useProgram(prgStelle.p); gl.bindVertexArray(stelle.vao);
        gl.uniformMatrix4fv(prgStelle.u.u_proj, false, S.proj); gl.uniformMatrix3fv(prgStelle.u.u_vista, false, S.vista); gl.uniform1f(prgStelle.u.u_dens, Math.max(1, S.H / 700)); gl.uniform1f(prgStelle.u.u_espo, espo(S));
        gl.drawArrays(gl.POINTS, 0, stelle.n); gl.bindVertexArray(null); return;
      }
      if (passata === 'solido') {
        const u = prgSfera.u; gl.useProgram(prgSfera.p); gl.bindVertexArray(quadrato.vao);
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform3fv(u.u_sole, stato.sole); gl.uniform3fv(u.u_luce, coloreLuce); gl.uniform1f(u.u_espo, espo(S));
        gl.uniform4f(u.u_asse, 0, 1, 0, 0); gl.uniform2f(u.u_minimo, (1.6 * S.tanY * 2) / S.H, 0); gl.uniform4f(u.u_ombra, stato.versoC[0], stato.versoC[1], stato.versoC[2], R);
        const sfera = (c, raggio, tinta, brilla) => { const v = S.versoCorpo(c); gl.uniform4f(u.u_sfera, v[0], v[1], v[2], raggio); gl.uniform4f(u.u_tinta, tinta[0], tinta[1], tinta[2], brilla); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
        // la stella: la sua superficie è (distanza / raggio)² volte più luminosa di un foglio bianco che illumina
        sfera(corpoStella, raggioStella, nero, Math.min(3e5, ((P.aM || 1.5e11) / raggioStella) ** 2));
        for (const l of lune) sfera(l.corpo, l.L.raggioM, l.tinta, 0);
        gl.bindVertexArray(null); return;
      }
      if (passata === 'velato' && anello) anello.disegna(S, { centro: stato.versoC, A: stato.A, sole: stato.sole, luce: coloreLuce, espo: espo(S), schiaccia });
    },
  };
  if (!corpi) N.aggiungi(lontani); N.aggiungi(suolo); N.aggiungi(cielo3d);

  function libera() {
    for (const f of fili) f.w.terminate(); fili.length = 0; coda.length = 0;
    for (const t of [...tessere.values()]) if (t.pronta) butta(t); tessere.clear(); gl.deleteTexture(texMS); gl.deleteTexture(texCielo);
    for (const s of [lontani, suolo, cielo3d]) N.togli(s);
    if (corpi) for (const k of Object.keys(terreno)) corpoPianeta[k] = null;
  }
  return {
    corpo: corpoPianeta, stella: corpoStella, lune, aria, cielo3d, coloreLuce, anello: !!anello, opzioni: O, libera, stagione,
    // che cosa c'è in un punto: quota del terreno (m), se c'è acqua e quanto è profonda
    info: (lon, lat) => { const [h, l] = leggi(lon, lat); return { quota: h, acqua: l > h, profondita: l > h ? l - h : 0, livello: l }; },
    pronto: () => base.pronta && !!tessere.get(chiave(0, 0, 0))?.pronta,
    statistiche: () => { let pronte = 0; for (const t of tessere.values()) if (t.pronta) pronte++; return { pezze, triangoli, tessere: pronte, inAttesa: coda.length + fili.filter((f) => !f.libero).length, richieste, arrivate, msPerTessera: arrivate ? msTessere / arrivate : 0, memoriaMB: (pronte * (TWB * THB * 8 * 2 + TW * TH * (4 + 4 + 4 + 8))) / 1e6, nuvoleMedie, onde: ondeQui ? { H: ondeQui.H, T: ondeQui.T, vento: ondeQui.U } : null }; },
  };
}
