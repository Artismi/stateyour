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
//     l'esposizione della carta: tessere.worker.js); le onde sono quelle dello spettro del punto (finestra.js, dal vento di
//     mare.js) più il mare lungo che vi arriva dalle tempeste lontane (mare_lungo.js), in quattro tessere di Tessendorf a lati
//     incommensurabili (onde_cascata.js), come spostamento della superficie e come pendenza per i riflessi (il cielo riflesso
//     nella direzione speculare: la forma di Rayleigh, la media della tabella del cielo); il vento della carta con le raffiche
//     dello strato limite cambia punto per punto le onde corte, il riflesso (Cox e Munk) e la schiuma (Monahan, che dura e si
//     raccoglie nelle righe di Langmuir): vedi il frammento. I VORTICI di mesoscala (vortici.js: le statistiche di Chelton e
//     altri 2011 come processo di punti per indirizzo) girano l'acqua: la temperatura del mare si avvolge in bracci e filamenti
//     fino alla larghezza della sottomesoscala, il fango che l'acqua porta viene da dove l'acqua è venuta, e il vento che alza
//     le onde corte è quello relativo alla corrente. Il colore dell'acqua libera è in 21 bande (colore_acqua.js, nel filo).
//   · I FALSI COLORI DELLA TEMPERATURA (lo strumento del visore, strumenti.js: opzioni.falsiColori = 'temperatura'): la
//     temperatura della superficie nella scala Turbo (falsi_colori.js), senza l'aria davanti, con la scala che si adatta a ciò
//     che si guarda (scalaFalsi; in opzioni.scalaTemperatura).
//   · I MATERIALI: le riflettanze delle rocce per classe, del sedimento, della neve e del ghiaccio (tessere.worker.js).
//   · IL SUOLO FINE (suolo.js, PROGETTO.md lavoro 9): a pochi metri dal suolo, sotto l'occhio, la finestra del suolo di quel
//     punto (20 m in 256 punti quando lo schermo è largo meno di 20 m sul suolo, 200 m fino a 200 m), calcolata solo lì con la legge di suolo.js e con lo stesso indirizzo
//     della finestra del livello 5 della mappa: il padre è la tessera di geologia.js che il 3D sta disegnando lì (i suoi campi
//     grezzi li manda il filo delle tessere, e suolo.js li ricorda per mappa.js: la stessa cella, lo stesso tratto, gli stessi
//     punti). Nelle pezze che la toccano, dentro la finestra: la luce sul pendio della tessera PIÙ il pendio del RILIEVO
//     AUTO-AFFINE di suolo.js (il suo gradiente esatto sui punti della finestra, scala vera), e la tinta del suolo (immagineSuolo
//     senza la sua luce, riportata alla riflettanza media della tessera lì: la luminosità resta quella della carta, il suolo ne
//     dà le variazioni). DICHIARATO: il rilievo fine entra come luce e non sposta i vertici (le pezze ne hanno uno ogni 5–10 m;
//     una pezza sua coi vertici sui punti, provata, raddoppiava i ms per fotogramma: si disegnava due volte lo schermo). Si
//     rifà quando ci si sposta di un quarto della finestra (o cambia la tessera), fuori dal fotogramma (statistiche().suoloFine).
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
//     (cl.meteo.nuvole, nella stagione di quel momento); dentro la cella della carta un campo con lo spettro di Kolmogorov
//     (k^−5/3, misurato sulle nubi) che il vento (cl.meteo.u, v) trascina, sommato fino al punto dello schermo: lo spessore
//     ottico, e la luce che rimandano da quello (vedi GLSL_NUVOLE). La copertura media non cambia con lo zoom.
//   · IL MOTO: il pianeta gira attorno al suo asse inclinato (P.giorno, P.obliquita, retrogrado, o bloccato con la
//     stessa faccia alla stella) e attorno alla stella (P.anno): le stagioni vengono da sé. Le lune girano col loro periodo.
//
// uso:  const pianeta = creaPianeta(N, { P, stella, via, superficie: () => superficieDi(via) });
//       N.attacca(pianeta.corpo, { distanza: 3 * P.raggioM });
//       pianeta.info(lon, lat) → { quota, acqua, profondita }   pianeta.statistiche()   pianeta.libera()
import { V, GLSL_PROFONDITA_V, GLSL_PROFONDITA_F, coloreCorpoNero, luminanzaUno } from './nucleo.js';
import { semeEvento } from '../camera/cosmo.js';
import { serie } from '../camera/eredita.js';
import { accumuloAttivo } from './accumulo.js';
import { luogoDi } from './bolla.js';
import { creaCascata, CASCATA } from './onde_cascata.js';
import { mareLungo } from '../camera/mare_lungo.js';
import { creaVortici } from '../camera/vortici.js';
import { GLSL_TURBO } from './falsi_colori.js';

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
// quanta nuvola c'è in un punto dello strato (0…1). La COPERTURA è quella di meteo.js (cl.meteo.nuvole: la parte del cielo
// coperta, in media, nella stagione di quel momento, sulla sua carta); dentro una cella della carta le nuvole sono un campo
// che il vento trascina (due copie sfasate di mezzo periodo, che si danno il cambio sfumando).
// LO SPETTRO DEL CAMPO non è un rumore a mano: l'acqua delle nubi ha lo spettro di Kolmogorov, E(k) ∝ k^(−5/3), dalla
// decina di metri alle centinaia di km (Cahalan e Snider 1989, Remote Sens. Environ. 28, 95: le nubi di FIRE; Davis e altri
// 1996, J. Atmos. Sci. 53, 1538), e i contorni delle nubi hanno dimensione 1,35 da 1 a 10⁶ km² (Lovejoy 1982, Science 216,
// 185): ogni ottava ha l'ampiezza della precedente per 2^(−1/3). La scala più grande è la cella della carta di meteo.js; la più
// piccola è il punto dello schermo (o la penombra della stella, per le ombre). Prima: sei ottave fisse da 1/36 di raggio
// con l'ampiezza dimezzata a ogni ottava (uno spettro k^(−3), liscio): da vicino una nuvola era una sfumatura uniforme.
// LA COPERTURA NON CAMBIA CON LO ZOOM: il campo, sommato su tutte le ottave, è quasi gaussiano con scarto σ_T; la soglia è
// quella che lascia sopra di sé la parte «copertura» (σ_T·Φ⁻¹, con Φ la logistica di scala 1,702: Bowling e altri 2009).
// Le ottave più fini del punto dello schermo non si sommano, ma la loro varianza resta (σ_o): ciò che conta nel punto è
// la media di (v − soglia)⁺ sulle ottave che mancano (per una gaussiana: la «softplus» di scala 0,58·σ_o). Così la media
// su un'area non dipende da quanto la si guarda da vicino, e avvicinandosi le ottave nuove entrano sfumando (l'ultima
// pesa la parte frazionaria): niente salti tra le scale.
// LO SPESSORE OTTICO: τ = κ·(v − soglia)⁺, con κ = 4,6/σ_T, perché a metà copertura la nube media abbia τ ≈ 3,7, lo
// spessore ottico medio delle nubi della Terra (ISCCP: Rossow e Schiffer 1999, BAMS 80, 2261). Dentro una coltre le nubi
// non sono più tutte uguali: la luce che riflettono è quella di uno strato che diffonde senza assorbire, a due flussi,
// R = (1 − g)·τ / (2 + (1 − g)·τ) con g = 0,85 delle gocce d'acqua (Bohren 1987, Am. J. Phys. 55, 524); ciò che non
// riflettono passa (1 − R). Prima: una parte coperta (0…1) bianca all'82%, uguale per una velatura e per un cumulonembo.
const GLSL_NUVOLE = `
uniform sampler2D u_meteo;
uniform vec4 u_nuv;      // quota delle nuvole (m), tempo (s), periodo del trascinamento (s), quanto coprono (0: niente nuvole)
uniform vec2 u_nuvL;     // la scala più grande del campo (m: la cella della carta di meteo.js) e il raggio dello strato (m)
uniform float u_notte;   // la luce di notte su una superficie orizzontale (un quarto della luce diffusa della galassia), nell'unità della stella
const float N_SIG = 0.1847, N_RAP2 = 0.62996, N_LOG = 1.702; // scarto del rumore a valori (misurato); 2^(−2/3); la logistica come Φ
const mat3 N_GIRO = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64); // (ogni ottava girata: il reticolo non si allinea)
float campoNuvole(vec3 x, int n, float ultima) { float v = 0.0, a = 1.0;
  for (int i = 0; i < 18; i++) { if (i >= n) break; v += a * (i == n - 1 ? ultima : 1.0) * (rumore(x) - 0.5); x = N_GIRO * x * 2.0 + vec3(7.1, 3.7, 1.3); a *= 0.7937005; }
  return v; }
float nuvola(vec3 p, float orma) { // lo spessore ottico della nube in quel punto dello strato
  vec3 q = normalize(p); float lon = atan(-q.z, q.x), lat = asin(clamp(q.y, -1.0, 1.0));
  vec4 m = texture(u_meteo, vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927));
  float cop = clamp(m.r * u_nuv.w, 0.0, 1.0); if (cop < 1e-4) return 0.0;
  vec3 est = normalize(vec3(-q.z, 0.0, -q.x) + 1e-6), nord = cross(q, est), vento = (est * m.g + nord * m.b) / u_nuvL.y;
  float f1 = fract(u_nuv.y / u_nuv.z), f2 = fract(u_nuv.y / u_nuv.z + 0.5), k = u_nuvL.y / u_nuvL.x;
  vec3 a = (q - vento * ((f1 - 0.5) * u_nuv.z)) * k, b = (q - vento * ((f2 - 0.5) * u_nuv.z)) * k + 11.3;
  // quante ottave: dalla cella della carta fino al punto dello schermo (la parte frazionaria pesa l'ultima)
  float nf = clamp(log2(u_nuvL.x / max(orma, 1.0)) + 1.0, 1.0, 18.0); int n = int(ceil(nf)); float w = nf - float(n - 1);
  float w1 = 1.0 - abs(1.0 - 2.0 * f1), w2 = 1.0 - abs(1.0 - 2.0 * f2);
  float v = (w1 * campoNuvole(a, n, w) + w2 * campoNuvole(b, n, w)) / sqrt(max(w1 * w1 + w2 * w2, 1e-6));
  float vT = N_SIG * N_SIG / (1.0 - N_RAP2), rn = pow(N_RAP2, float(n - 1)), vR = N_SIG * N_SIG * ((1.0 - rn) / (1.0 - N_RAP2) + w * w * rn);
  float sT = sqrt(vT), sO = sqrt(max(vT - vR, 4e-4 * vT)), c = clamp(cop, 1e-3, 0.999), soglia = -sT * log(c / (1.0 - c)) / N_LOG, s = 0.576 * sO, x = (v - soglia) / s;
  return (4.6 / sT) * s * (x > 30.0 ? x : log(1.0 + exp(x)));
}
float rifNuvola(float tau) { return 0.15 * tau / (2.0 + 0.15 * tau); } // (la luce che uno strato di spessore τ rimanda indietro: vedi sopra)`;
export const GLSL_RUMORE = `
float caso3(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float rumore(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(caso3(i), caso3(i + vec3(1, 0, 0)), f.x), mix(caso3(i + vec3(0, 1, 0)), caso3(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(caso3(i + vec3(0, 0, 1)), caso3(i + vec3(1, 0, 1)), f.x), mix(caso3(i + vec3(0, 1, 1)), caso3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float caso2(highp ivec2 i) { highp uvec2 u = uvec2(i & 4095); highp uint h = u.x * 374761393u + u.y * 668265263u; h = (h ^ (h >> 13u)) * 1274126177u; return float((h ^ (h >> 16u)) & 65535u) / 65535.0; }
float rum2(vec2 p) { vec2 f = fract(p); highp ivec2 i = ivec2(floor(p)); f = f * f * (3.0 - 2.0 * f); return mix(mix(caso2(i), caso2(i + ivec2(1, 0)), f.x), mix(caso2(i + ivec2(0, 1)), caso2(i + ivec2(1, 1)), f.x), f.y); } // (periodico ogni 4096 celle: la pezza vi aggiunge il suo spostamento)
float frattale3(vec3 p) { return 0.57 * rumore(p) + 0.29 * rumore(p * 2.03 + 7.1) + 0.14 * rumore(p * 4.01 + 3.7); }
float frattale(vec3 p) { return 0.5 * rumore(p) + 0.25 * rumore(p * 2.03 + 7.1) + 0.125 * rumore(p * 4.01 + 3.7) + 0.0625 * rumore(p * 8.05 + 1.3) + 0.035 * rumore(p * 16.1 + 5.9) + 0.0275 * rumore(p * 33.0 + 2.2); }`;

// ---------- la superficie: una pezza
const CASC_N = CASCATA.N;
const GLSL_ONDE = `
// LE TESSERE SENZA RIPETIZIONE (Heitz e Neyret 2018, «High-Performance By-Example Noise using a Histogram-Preserving Blending
// Operator», HPG): una tessera periodica, vista da lontano, ripete il suo motivo (a 2 km di schermo la tessera più lunga sta
// cinque volte: autocorrelazione 0,68 al suo periodo). Il piano si copre di triangoli larghi un terzo di tessera; ogni vertice
// legge la tessera da un punto suo (uno spostamento dal reticolo con nome); in ogni punto le tre letture si sommano coi pesi
// baricentrici divisi per √(Σw²), così la varianza resta quella della tessera e lo spettro non cambia (gli spostamenti sono solo
// traslazioni: direzioni e lunghezze delle onde restano quelle del vento). La schiuma: la media pesata (Σw = 1) delle tre
// soglie, che lascia la parte coperta quella cercata. Le coordinate stanno entro 4096 tessere (lo spostamento della pezza).
float casoT(ivec2 i, int c) { highp uvec2 u = uvec2(i & 4095); highp uint h = u.x * 73856093u ^ u.y * 19349663u ^ uint(c + 1) * 83492791u; h = (h ^ (h >> 13u)) * 1274126177u; return float((h ^ (h >> 16u)) & 65535u) / 65535.0; }
vec4 ondaStoc(vec2 uv, int c, vec2 dx, vec2 dy, float soglia) {
  vec2 sk = mat2(1.0, 0.0, -0.57735027, 1.15470054) * (uv * 3.4641016); highp ivec2 b = ivec2(floor(sk)); vec2 f = fract(sk); float z = 1.0 - f.x - f.y;
  vec3 w; highp ivec2 v1, v2, v3; if (z > 0.0) { w = vec3(z, f.y, f.x); v1 = b; v2 = b + ivec2(0, 1); v3 = b + ivec2(1, 0); } else { w = vec3(-z, 1.0 - f.y, 1.0 - f.x); v1 = b + ivec2(1, 1); v2 = b + ivec2(1, 0); v3 = b + ivec2(0, 1); }
  vec4 a1 = textureGrad(u_ondeT, vec3(uv + vec2(casoT(v1, c), casoT(v1 + 7, c)), float(c)), dx, dy), a2 = textureGrad(u_ondeT, vec3(uv + vec2(casoT(v2, c), casoT(v2 + 7, c)), float(c)), dx, dy), a3 = textureGrad(u_ondeT, vec3(uv + vec2(casoT(v3, c), casoT(v3 + 7, c)), float(c)), dx, dy);
  float n = inversesqrt(max(dot(w, w), 1e-6)); vec3 s = (w.x * (a1.rgb * 2.0 - 1.0) + w.y * (a2.rgb * 2.0 - 1.0) + w.z * (a3.rgb * 2.0 - 1.0)) * n;
  float sc = soglia > 0.998 ? 0.0 : w.x * smoothstep(soglia, soglia + 0.002, a1.a) + w.y * smoothstep(soglia, soglia + 0.002, a2.a) + w.z * smoothstep(soglia, soglia + 0.002, a3.a);
  return vec4(s, sc); }`;
const V_SUOLO = `
in vec3 a_griglia;        // x, y da 0 a 1 nella pezza; z: 1 se il vertice è dell'orlo che scende
uniform mat4 u_proj; uniform mat3 u_vista; uniform float u_fc;
uniform vec3 u_C;         // il centro della pezza rispetto all'occhio (m, assi del mondo)
uniform mat3 u_base;      // est, nord, su al centro della pezza (colonne), negli assi del mondo, con lo schiacciamento
uniform vec4 u_geo;       // ampiezza in longitudine e in latitudine (radianti), latitudine del centro, raggio del pianeta
uniform vec4 u_tess;      // dove sta la pezza nella sua tessera: origine (x, y) e ampiezza (x, y), in frazioni della tessera
uniform vec3 u_orlo;      // di quanto scende l'orlo (m); quanto vale l'esagerazione del rilievo; tempo delle onde (s)
uniform float u_lon0;     // la longitudine del centro della pezza meno quella di riferimento delle onde (radianti): le onde si contano in
                          // X = R·cos(lat)·(lon − lon_rif), Y = R·lat (lon_rif è vicina all'occhio: così la carta non si storce, vedi aggiornaOnde)
uniform sampler2D u_alt, u_altM;  // quota del terreno e livello dell'acqua (m), con un punto di bordo: della tessera e di sua madre (più grossa)
uniform vec4 u_tessM;     // dove sta la pezza nella tessera madre
uniform vec2 u_sfuma;     // tra queste due distanze dall'occhio i dati passano da quelli della tessera a quelli della madre: così dove comincia
                          // la tessera più grossa la superficie è già la sua, e tra un livello e l'altro non ci sono scalini
// LE ONDE: le quattro tessere di Tessendorf di onde_cascata.js (pendenza est, pendenza nord, quota, rango della schiuma), una
// per strato di un'immagine a strati; per ognuna: la matrice che porta (X, Y) in metri alle coordinate della tessera (girata e
// divisa per il lato), lo spostamento della pezza (la parte frazionaria di (X₀, Y₀) del centro della pezza, contata in doppia
// precisione), e (pendenza quadratica media della sua banda, 4·σ pendenza, 4·σ quota, lato in m)
uniform highp sampler2DArray u_ondeT;
uniform vec4 u_cM[4]; uniform vec2 u_cO[4]; uniform vec4 u_cS[4];
uniform float u_ondeSi;   // 1 se le onde ci sono
uniform vec4 u_cAtt;      // 1 per le tessere rifatte in questo fotogramma (le altre sono sotto il punto dello schermo dappertutto: aggiornaTessereOnde)
${GLSL_ONDE}
uniform vec4 u_fineG;     // IL SUOLO FINE: dove sta la pezza nelle coordinate della finestra (0…1, da sud-ovest): il suo centro e la sua ampiezza
out vec3 v_su; out vec3 v_est; out vec3 v_rel; out vec4 v_dati; out vec2 v_uv; out vec3 v_uvM; out vec2 v_en; out float v_w; out vec2 v_fw;
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
  v_fw = u_fineG.xy + vec2((g.x - 0.5) * u_fineG.z, (0.5 - g.y) * u_fineG.w);
  float terra = q.x * u_orlo.y, livello = q.y > -9e4 ? q.y * u_orlo.y : -1e5, h = max(terra, livello);
  vec2 en = vec2(R * (cf * dl - u_lon0 * 2.0 * sin(fi0 + 0.5 * df) * sf2), R * df); // X e Y delle onde, contati dal centro della pezza
  if (livello > terra && a_griglia.z < 0.5 && u_ondeSi > 0.5) { // l'acqua si muove: la quota delle quattro tessere, mediata sulla maglia della pezza
    float fondo = clamp((livello - terra) * 0.5, 0.0, 1.0), passo = u_geo.y * R / ${MY}.0;
    for (int c = 0; c < 4; c++) { if (u_cAtt[c] < 0.5 || u_cS[c].w < 2.0 * passo) continue; // (una tessera più corta di due maglie si legge al suo ultimo livello: la sua media, zero)
      vec2 uv = vec2(dot(u_cM[c].xy, en), dot(u_cM[c].zw, en)) + u_cO[c]; float lod = log2(max(1.0, 2.0 * passo * ${CASC_N}.0 / u_cS[c].w));
      vec2 g = vec2(exp2(lod) / ${CASC_N}.0, 0.0); h += fondo * ondaStoc(uv, c, g, g.yx, 1.0).b * u_cS[c].z; }
  }
  h -= a_griglia.z * u_orlo.x;
  vec3 loc = vec3((R + h) * su.x, (R + h) * su.y, (R + h) * (su.z - 1.0) + h);
  vec3 rel = u_C + u_base * loc;
  v_su = su; v_est = est; v_rel = rel; v_dati = vec4(terra, livello, R + h, a_griglia.z); v_uv = f; v_uvM = vec3(fM, sfuma); v_en = en;
  gl_Position = u_proj * vec4(u_vista * rel, 1.0);${GLSL_PROFONDITA_V}
}`;
const F_SUOLO = `
in vec3 v_su; in vec3 v_est; in vec3 v_rel; in vec4 v_dati; in vec2 v_uv; in vec3 v_uvM; in vec2 v_en; in float v_w; in vec2 v_fw;
uniform vec4 u_fine; uniform vec3 u_fineMedia; // IL SUOLO FINE: x 1 se la pezza tocca la finestra (allora u_pendM è il pendio fine, u_terraM la tinta del suolo, u_fineMedia la sua media), y il suo N
uniform float u_fc; uniform mat3 u_normali; // dal riferimento della pezza agli assi del mondo, per le normali
uniform sampler2D u_alt, u_altM;               // quota e livello dell'acqua (per la riva, punto per punto)
uniform sampler2D u_pend, u_terra, u_acqua, u_pendM, u_terraM, u_acquaM; // della tessera e di sua madre
uniform sampler2D u_oriz1, u_oriz2, u_oriz1M, u_oriz2M; // gli orizzonti in otto direzioni (tessere.worker.js)
uniform vec3 u_sole, u_luce;   // verso la stella (assi del mondo); il suo colore (1 = bianco in pieno sole)
uniform float u_disco;         // il raggio angolare della stella (rad): la penombra delle ombre del rilievo
uniform vec4 u_espo;           // esposizione; c'è l'immagine dell'acqua; c'è quella della madre; luce di notte
uniform highp sampler2DArray u_ondeT; uniform vec4 u_cM[4]; uniform vec2 u_cO[4]; uniform vec4 u_cS[4]; uniform float u_ondeSi; uniform vec4 u_cAtt; // le tessere delle onde (vedi V_SUOLO)
${GLSL_ONDE}
uniform vec4 u_tess, u_tessM, u_geo; // (vedi V_SUOLO: per portare uno spostamento in metri nelle coordinate delle tessere)
// I VORTICI (vortici.js), i più vicini all'occhio: A longitudine, latitudine (rad), L_s (m), peso; B velocità di rotazione U col
// verso (m/s, antiorario positivo), angolo di cui hanno girato l'acqua al raggio L_s (rad), gradiente della temperatura del mare
// (K/m, est e nord); C lo spostamento del nucleo da dove l'acqua è venuta (m, est e nord). u_Lm la larghezza della sottomesoscala.
uniform vec4 u_vA[32], u_vB[32], u_vC[32]; uniform int u_nv; uniform float u_Lm;
uniform vec3 u_falsi;  // I FALSI COLORI della temperatura (strumenti.js): x 1 se accesi; y, z la scala (K, rispetto alla temperatura di riferimento)
${GLSL_TURBO}
uniform vec4 u_mare;   // vento dove sta l'occhio (m/s, quello delle tessere), increspatura sotto l'ultima tessera (pendenza quadratica media), parte libera dal ghiaccio, (lon − lon_rif) × seno della latitudine (X dipende anche dal nord)
uniform vec4 u_aria;   // lo strato limite dell'aria h (m) e quello rimescolato del mare h_m (m) dove sta l'occhio; lo spostamento della pezza nel rumore delle raffiche (in unità di 3h)
uniform vec2 u_lang;   // lo spostamento della pezza nelle righe di Langmuir (in unità della loro spaziatura)
uniform float u_orma;          // quanto è largo un punto dello schermo a distanza 1 (1 / fuoco)
uniform mat3 u_tondo; uniform vec3 u_centro, u_soleC; // dagli assi del mondo allo spazio in cui il pianeta è tondo; il suo centro rispetto all'occhio; la stella in quello spazio
${GLSL_ARIA}
${GLSL_RUMORE}
${GLSL_NUVOLE}
// l'ombra delle nuvole: dove il raggio verso la stella attraversa il loro strato
float ombraNuvole(vec3 rel) {
  if (u_nuv.w <= 0.0) return 1.0; vec3 p = u_tondo * (rel - u_centro); float Rn = u_atm.x + u_nuv.x, b = dot(p, u_soleC), c = dot(p, p) - Rn * Rn;
  // (il campo si legge alla grandezza del punto dello schermo, ma mai più fine della penombra: la stella non è un punto)
  if (c > 0.0) return 1.0; float s = -b + sqrt(b * b - c); return 1.0 - rifNuvola(nuvola(p + u_soleC * s, max(length(rel) * u_orma, s * u_disco)));
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
  // (la parte del disco della stella sopra l'orizzonte: il segmento di un disco di raggio angolare u_disco — prima una
  // sfumatura a mano tra −0,02 e 0,03 — e la luce che passa lungo l'orizzonte per la parte che c'è)
  float hS = clamp(muS / max(u_disco, 1e-6), -1.0, 1.0), discoSu = (acos(-hS) + hS * sqrt(1.0 - hS * hS)) / 3.14159265;
  vec3 arriva = u_luce * luceCheArriva(max(r, u_atm.x), max(muS, 0.0)) * discoSu;
  if (muS > 0.0) arriva *= ombraNuvole(v_rel);
  // la luce del cielo: l'irradianza del cielo vero (diffusione semplice e multipla) su un suolo orizzontale
  // (e di notte la luce diffusa della galassia, uguale da ogni parte: su un suolo orizzontale un quarto di quella che arriva
  // da tutte le direzioni — u_espo.w, nell'unità della stella; prima 0,0006 a mano)
  vec3 ambiente = u_luce * cieloSu(muS) + vec3(u_espo.w);
  vec2 rv = riva(u_alt, v_uv); if (v_uvM.z > 0.002) rv = mix(rv, riva(u_altM, v_uvM.xy), v_uvM.z);
  // (la riva passa dentro il punto dello schermo: i due colori pesati per quanto ne copre)
  float asciutto = clamp(0.5 + rv.x / max(fwidth(rv.x), 1e-5), 0.0, 1.0);
  vec3 colA = vec3(0.0), colT = vec3(0.0); float TvF = 0.0;
  if (asciutto < 1.0) { // ACQUA
    float fondo = rv.y;
    // IL VENTO DEL PUNTO: quello della carta di meteo.js (il vento al suolo della stagione), più le RAFFICHE dello strato
    // limite. Sul mare la deviazione del vento lungo il vento è σ_u ≈ 2,5·u* (Panofsky e Dutton 1984, strato superficiale
    // neutro), con u* = √C_d·U e C_d = 1,3·10⁻³: σ_u/U ≈ 0,09. La varianza sta per ottave come vuole Kolmogorov (E(k) ∝ k^(−5/3):
    // ogni ottava 2^(−2/3) della precedente); la più grande sono i RULLI dello strato limite, allineati al vento, con
    // lunghezza d'onda ≈ 3 volte lo spessore h dello strato (Etling e Brown 1993, Boundary-Layer Meteorol. 65, 215: rapporto
    // tipico 2–4). Le ottave si fermano al punto dello schermo. Dal vento con le raffiche vengono la pendenza delle onde corte
    // (Cox e Munk 1954: σ² = 0,003 + 5,12·10⁻³·U), la schiuma (Monahan e O'Muircheartaigh 1980: W = 3,84·10⁻⁶·U^3,41): le
    // bande e le strisce del vento si vedono nel riflesso e nelle creste bianche, senza essere disegnate.
    float orma = length(v_rel) * u_orma / max(0.06, dot(suM, occhio));
    vec3 pq = normalize(u_tondo * (v_rel - u_centro)); float lonP = atan(-pq.z, pq.x), latP = asin(clamp(pq.y, -1.0, 1.0));
    vec4 mt = texture(u_meteo, vec2(lonP / 6.2831853 + 0.5, 0.5 - latP / 3.1415927));
    // I VORTICI (vortici.js). Ognuno gira l'acqua attorno a sé con v(r) = U·(r/L_s)·e^((1 − r²/L_s²)/2): l'acqua che sta qui è
    // venuta dal punto ruotato indietro di θ(r) = θ₀·e^((1 − r²/L_s²)/2) attorno al centro, e il nucleo l'ha portata da
    // dove il vortice è passato (C·e^(−r²/2L_s²)). La temperatura è quella di là: T′ = ∇T̄·(x_orig − x) — il gradiente medio
    // avvolto in bracci e filamenti. I bracci si stringono quanto più il vortice gira (la loro lunghezza d'onda è 2π/|dθ/dr|):
    // sotto la larghezza della sottomesoscala (u_Lm: lì lo strato rimescolato instabile rimescola, Boccaletti e altri 2007) e
    // sotto il punto dello schermo si confondono nella loro media, e il fondo del vortice resta alla temperatura del centro.
    vec2 corr = vec2(0.0), xi = vec2(0.0);
    for (int i = 0; i < 32; i++) { if (i >= u_nv) break; vec4 A = u_vA[i], B = u_vB[i];
      float dl = lonP - A.x; dl -= 6.2831853 * floor(dl / 6.2831853 + 0.5); vec2 d = u_atm.x * vec2(cos(latP) * dl, latP - A.y); float q = dot(d, d) / (A.z * A.z); if (q > 36.0) continue;
      float e = exp(0.5 * (1.0 - q)), th = B.y * e, kr = abs(th) * sqrt(q) / A.z, att = exp(-0.5 * (u_Lm * u_Lm + orma * orma) * kr * kr);
      vec2 rd = vec2(cos(th) * d.x + sin(th) * d.y, -sin(th) * d.x + cos(th) * d.y), dis = A.w * ((att * rd - d) - u_vC[i].xy * exp(-0.5 * q));
      corr += A.w * B.x * e * vec2(-d.y, d.x) / A.z; xi += dis; TvF += dot(B.zw, dis); }
    // IL VENTO CHE ALZA LE ONDE CORTE (il riflesso, la schiuma) sente i vortici in due modi: è quello relativo alla
    // corrente della superficie (Pacanowski 1987, JPO 17, 2085); e sull'acqua più calda l'aria è meno stabile e porta giù più
    // vento: +0,3 m/s per grado di temperatura del mare in più (l'accoppiamento misurato dai satelliti sui vortici e sui
    // fronti, tra 0,2 e 0,5 m/s per °C: Small e altri 2008, Dyn. Atmos. Oceans 45, 274; O'Neill, Chelton ed Esbensen 2012,
    // J. Climate 25, 5916 — l'intervallo è dalla memoria delle rassegne, il testo non è stato letto: da verificare; si prende
    // 0,3, dichiarato: dipende dallo strato limite, e qui è quello della Terra). Così i vortici si vedono nella rugosità.
    vec2 v0 = u_nuv.w > 0.0 ? mt.gb : vec2(u_mare.x, 0.0), vv = v0 * max(0.1, 1.0 + 0.3 * TvF / max(length(v0), 0.3)) - corr; float Ul = max(length(vv), 0.3); vec2 dv = vv / Ul, pv = vec2(-dv.y, dv.x);
    float lr = 3.0 * u_aria.x; vec2 pr = v_en / lr + u_aria.zw;
    float nOtt = clamp(log2(lr / max(2.0 * orma, 1e-3)), 0.0, 7.0), G = 0.0, aO = 0.6086; // (0,6086² = 1 − 2^(−2/3): la parte della varianza nell'ottava più grande)
    G += aO * 1.4142 * cos(6.2831853 * dot(pr, pv) + 3.0 * (rum2(pr * 0.5) - 0.5)) * clamp(nOtt, 0.0, 1.0);
    vec2 po = pr * 2.0; for (int i = 1; i < 7; i++) { aO *= 0.7937005; float w = clamp(nOtt - float(i), 0.0, 1.0); if (w <= 0.0) break; G += aO * w * (rum2(po + float(i) * 17.3) - 0.5) * 4.8; po *= 2.0; }
    float Ue = Ul * clamp(1.0 + 0.09 * G, 0.2, 2.0);
    float cmL = 0.003 + 5.12e-3 * Ue, cmO = 0.003 + 5.12e-3 * max(u_mare.x, 0.3), aU = sqrt(cmL / cmO);
    // LE ONDE: la somma delle quattro tessere (con la media sul punto dello schermo che fa la scheda grafica); le onde corte
    // (tessere dalla seconda) seguono il vento del punto; ciò che il punto non risolve va nella pendenza media sotto il punto
    // (la soglia della schiuma: vedi sotto)
    float W = clamp(u_mare.z * 3.84e-6 * pow(Ue, 3.41), 0.0, 0.5);
    vec2 pl = v_en / (2.5 * u_aria.y) + u_lang; float riga = 0.5 + 0.5 * cos(6.2831853 * dot(pl, pv) + 4.0 * (rum2(pl * vec2(0.37, 0.11) + 3.1) - 0.5));
    float vedeRighe = clamp(2.5 * u_aria.y / (6.0 * orma) - 0.5, 0.0, 1.0), Wr = W * mix(1.0, 0.4 + 2.2 * riga * riga * riga, 0.5 * vedeRighe), soglia = sqrt(max(1.0 - Wr, 0.0));
    vec2 pend = vec2(0.0); float s2 = u_mare.y * cmL / cmO, f0 = 0.0, f1 = 0.0, wRis = 0.0;
    if (u_ondeSi > 0.5) for (int c = 0; c < 4; c++) {
      float a = c > 0 ? aU : 1.0, ris = clamp(log(u_cS[c].w / (8.0 * orma)) / 1.7, 0.0, 1.0); // (la parte della banda — da L/4 a L/21,9 — più lunga di due punti)
      // (una tessera più corta di due punti dello schermo si legge al suo penultimo livello o oltre: la media di quasi tutto il
      // periodo, zero; le sue onde stanno già tutte nella pendenza sotto il punto. Non la si legge: tre letture in meno)
      if (u_cAtt[c] < 0.5 || u_cS[c].w < 2.0 * orma) { s2 += u_cS[c].x * a * a; continue; }
      vec2 uv = vec2(dot(u_cM[c].xy, v_en), dot(u_cM[c].zw, v_en)) + u_cO[c]; vec4 tx = ondaStoc(uv, c, dFdx(uv), dFdy(uv), soglia);
      pend += tx.rg * u_cS[c].y * a; s2 += (1.0 - ris) * u_cS[c].x * a * a;
      if (c == 0) f0 = tx.a; if (c == 1) { f1 = tx.a; wRis = clamp(u_cS[c].w / ${CASC_N}.0 / orma - 0.5, 0.0, 1.0); }
    }
    pend.y -= u_mare.w * pend.x; pend *= clamp(fondo * 0.5, 0.0, 1.0);
    vec3 n = normalize(u_normali * (su + est * pend.x + nord * pend.y));
    // la riflettanza dell'acqua (mare.js, senza la sua esposizione: tessere.worker.js); la luce che entra è quella che arriva su un piano
    // (ciò che l'acqua porta — il fango — viene da dove l'acqua è venuta: lo spostamento dei vortici; non oltre l'orlo della tessera)
    vec2 mx = xi / max(u_atm.x * vec2(u_geo.x * cos(latP), -u_geo.y), vec2(1.0, -1e30)), uvS = v_uv + mx * u_tess.zw, uvSM = v_uvM.xy + mx * u_tessM.zw;
    uvS = mix(v_uv, uvS, clamp(64.0 * min(min(uvS.x, 1.0 - uvS.x), min(uvS.y, 1.0 - uvS.y)), 0.0, 1.0)); uvSM = mix(v_uvM.xy, uvSM, clamp(64.0 * min(min(uvSM.x, 1.0 - uvSM.x), min(uvSM.y, 1.0 - uvSM.y)), 0.0, 1.0));
    vec3 base = u_espo.y > 0.5 ? lineare(texture(u_acqua, uvS).rgb) : vec3(0.004, 0.012, 0.03);
    if (v_uvM.z > 0.002) base = mix(base, u_espo.z > 0.5 ? lineare(texture(u_acquaM, uvSM).rgb) : vec3(0.004, 0.012, 0.03), v_uvM.z);
    float nv = max(dot(n, occhio), 0.02), fres = 0.02 + 0.98 * pow(1.0 - nv, 5.0);
    // IL RIFLESSO DELLA STELLA (Cox e Munk 1954): le pendenze che il punto non risolve hanno una distribuzione gaussiana di
    // varianza s² (per asse s²/2); la radianza riflessa è ρ·E·p(z)/(4·μ_occhio·cos⁴β), β l'inclinazione della faccetta che
    // riflette la stella verso l'occhio rispetto alla normale risolta n
    vec3 hv = normalize(u_sole + occhio); float s2c = max(s2, 2e-4), cb = max(dot(n, hv), 1e-3), t2 = (1.0 - cb * cb) / (cb * cb);
    float lampo = exp(-t2 / s2c) / (3.14159265 * s2c) / (4.0 * nv * cb * cb * cb * cb);
    // il cielo riflesso nella direzione speculare: la sua forma è quella di un'aria di Rayleigh a diffusione semplice
    // (Chandrasekhar: L ∝ P(γ)·μ₀/(μ₀ − μ)·(e^(−τ/μ₀) − e^(−τ/μ)), τ = β_R·H di quest'aria), la sua media quella della tabella
    // del cielo (diffusione multipla): prima il cielo riflesso era uniforme, e le onde da sopra non si vedevano
    vec3 rif = reflect(-occhio, n); float muR = max(dot(rif, suM), 1e-3), mu0 = max(muS, 0.02), cg = dot(rif, u_sole);
    vec3 tauR = u_betaR * u_atm.y, eR = exp(-tauR / muR), e0 = exp(-tauR / mu0);
    vec3 forma = abs(mu0 - muR) > 1e-4 ? (mu0 / (mu0 - muR)) * (e0 - eR) : (tauR / mu0) * e0;
    vec3 cieloRif = u_luce * cieloSu(muS) * (0.25 * 0.75 * (1.0 + cg * cg) * forma) / max(0.5 * mu0 * (1.0 - e0), vec3(1e-6)) * step(0.0, dot(rif, suM));
    colA = base * (arriva * max(muS, 0.0) + ambiente) * (1.0 - fres) + cieloRif * fres + arriva * min(lampo * (0.02 + 0.98 * pow(1.0 - max(dot(occhio, hv), 0.0), 5.0)), 40.0);
    // LA SCHIUMA: la parte di mare che Monahan e O'Muircheartaigh (1980) dicono coperta, dal vento del punto con le raffiche.
    // Dove le creste si risolvono sta dove le onde di vento frangono e dove hanno franto da poco (il rango della memoria delle
    // due tessere più lunghe, onde_cascata.js: con due tessere indipendenti la soglia √(1 − W) dà proprio W); la schiuma
    // vecchia il vento e le onde la raccolgono nelle righe di LANGMUIR, allineate al vento, distanti ≈ 2,5 volte lo strato
    // rimescolato (Leibovich 1983, Annu. Rev. Fluid Mech. 15, 391; Thorpe 2004); da lontano è la sua media, W. La riflettanza
    // efficace della schiuma 0,22 (Koepke 1984); sulla riva (a mano) la risacca.
    float cresta = 1.0 - (1.0 - f0) * (1.0 - f1); // (le due tessere sono indipendenti: coperto se lo è in una delle due; la soglia √(1 − W) dà W. Il rango sta in 8 bit: sotto due millesimi le creste non si distinguono, resta la media)
    float spuma = mix(W, cresta, wRis * u_ondeSi), risacca = (1.0 - smoothstep(0.0, 0.6, fondo)) * 0.5;
    colA = mix(colA, vec3(0.22) * (arriva * max(muS, 0.0) + ambiente), clamp(spuma, 0.0, 1.0));
    colA = mix(colA, vec3(0.8) * (arriva * max(muS, 0.0) + ambiente), risacca);
  }
  if (asciutto > 0.0) { // TERRA (o ghiaccio)
    vec3 p = texture(u_pend, v_uv).rgb, base = lineare(texture(u_terra, v_uv).rgb); vec4 o1 = texture(u_oriz1, v_uv), o2 = texture(u_oriz2, v_uv);
    if (u_fine.x > 0.5 && all(greaterThanEqual(v_fw, vec2(0.0))) && all(lessThanEqual(v_fw, vec2(1.0)))) { vec2 tc = (v_fw * (u_fine.y - 1.0) + 0.5) / u_fine.y; p.xy += texture(u_pendM, tc).xy; base *= lineare(texture(u_terraM, tc).rgb) / max(u_fineMedia, vec3(1e-4)); }
    else if (v_uvM.z > 0.002) { p = mix(p, texture(u_pendM, v_uvM.xy).rgb, v_uvM.z); base = mix(base, lineare(texture(u_terraM, v_uvM.xy).rgb), v_uvM.z); o1 = mix(o1, texture(u_oriz1M, v_uvM.xy), v_uvM.z); o2 = mix(o2, texture(u_oriz2M, v_uvM.xy), v_uvM.z); }
    vec3 n = normalize(u_normali * (su - est * p.x - nord * p.y));
    vec3 sp = transpose(u_normali) * u_sole, sLoc = vec3(dot(sp, est), dot(sp, nord), dot(sp, su));
    // la stella sul pendio (se non è dietro l'orizzonte), e il cielo che il punto vede (p.z), su un pendio che ne guarda una parte
    colT = base * (arriva * max(dot(n, u_sole), 0.0) * rilievo(sLoc, o1, o2) + ambiente * p.z * (0.5 + 0.5 * dot(n, suM)));
  }
  o_col = vec4(mix(colA, colT, asciutto) * u_espo.x, 1.0);
  // I FALSI COLORI DELLA TEMPERATURA: la temperatura della superficie (la carta di preparaMeteo: il mare di mare.js, la terra di
  // meteo.js), più quella che i vortici portano sul mare, nella scala Turbo tra il più freddo e il più caldo attorno all'occhio (scalaFalsi);
  // come una superficie chiara sotto la stella alta, di giorno e di notte (è una mappa, non una vista)
  if (u_falsi.x > 0.5) { vec3 pf = normalize(u_tondo * (v_rel - u_centro)); float lf = atan(-pf.z, pf.x), af = asin(clamp(pf.y, -1.0, 1.0));
    // (la carta letta con la B-spline cubica, quattro letture bilineari: in linea retta tra le celle la pendenza salta sul
    // loro bordo, e con la scala stretta della termocamera i bordi delle celle si vedevano come righe)
    vec2 ts = vec2(textureSize(u_meteo, 0)), pc = vec2(lf / 6.2831853 + 0.5, 0.5 - af / 3.1415927) * ts - 0.5, fc = fract(pc), w0 = (1.0 - fc) * (1.0 - fc) * (1.0 - fc) / 6.0, w1 = (4.0 - 6.0 * fc * fc + 3.0 * fc * fc * fc) / 6.0, w3 = fc * fc * fc / 6.0, w2 = 1.0 - w0 - w1 - w3;
    vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (floor(pc) - 0.5 + w1 / g0) / ts, h1 = (floor(pc) + 1.5 + w3 / g1) / ts;
    float Tf = g0.y * (g0.x * texture(u_meteo, h0).a + g1.x * texture(u_meteo, vec2(h1.x, h0.y)).a) + g1.y * (g0.x * texture(u_meteo, vec2(h0.x, h1.y)).a + g1.x * texture(u_meteo, h1).a) + (1.0 - asciutto) * TvF;
    o_col = vec4(lineare(turbo((Tf - u_falsi.y) / max(u_falsi.z - u_falsi.y, 1e-6))) * 0.6 * u_espo.x, 1.0); }
${GLSL_PROFONDITA_F}
}`;

// ---------- l'aria e le nuvole: una passata sull'immagine intera
// La passata può scrivere, invece del colore, le due cose di cui il colore è fatto — colore = scena·Tot + Add (Tot:
// quanta luce della scena passa, nuvole comprese; Add: la luce che l'aria e le nuvole aggiungono): a camera ferma si
// calcolano una volta e si compongono con la scena di ogni fotogramma (vedi lo strato). u_sfasa resta per sfasare i passi.
const F_ARIA = (passi) => `
in vec2 v_uv; layout(location = 0) out vec4 o_col; layout(location = 1) out vec4 o_tot;
uniform vec3 u_sfasa;    // lo sfasamento dei passi (quanto, ampiezza); z: 1 = si scrivono Add e Tot invece del colore; 2 = si compone con Add e Tot già fatti
uniform sampler2D u_col, u_prof;
uniform sampler2D u_cAdd, u_cTot; // (z = 2) Add e Tot di un fotogramma fermo, con la distanza (m) per cui valgono
uniform vec2 u_cK;       // (z = 2) E0 di allora / E0 di adesso (Add è una luce); scarto relativo di distanza oltre cui Add e Tot non valgono più
uniform vec3 u_occhio;   // l'occhio rispetto al centro del pianeta, nello spazio in cui il pianeta è tondo (m)
uniform mat3 u_raggi;    // dagli assi dell'occhio a quello spazio
uniform vec3 u_soleC;    // verso la stella, in quello spazio
uniform vec4 u_cam;      // tangenti di metà campo, costante della profondità, esposizione
uniform vec3 u_E;        // l'irradianza della stella (π × il suo colore)
uniform float u_orma;    // quanto è largo un punto dello schermo a distanza 1 (1 / fuoco)
uniform float u_falsiA;  // 1 con i falsi colori della temperatura (strumenti.js)
uniform float u_cima;    // dove il cammino entra nell'aria (m sopra il suolo): sopra, lo spessore ottico è sotto 10⁻³ anche di striscio (vedi impostaAria)
${GLSL_ARIA}
${GLSL_RUMORE}
${GLSL_NUVOLE}
// la luce diffusa lungo un tratto del raggio: restituisce la luce aggiunta e (in tra) quanta ne passa
// (lo spessore ottico verticale dell'aria sopra il raggio r, in logaritmo: il gas nel suo colore più diffuso, e la foschia)
float gOtt(float r) { float h = r - u_atm.x; return log(max(1e-30, max(u_betaR.x, max(u_betaR.y, u_betaR.z)) * u_atm.y * exp(clamp(-h / u_atm.y, -80.0, 80.0)) + 1.1 * u_betaM.x * u_atm.z * exp(clamp(-h / u_atm.z, -80.0, 80.0)))); }
// LA MISURA DEI PASSI lungo il raggio, da 0 (in t0) a 1 (in t1): la media di due — √((t − t0)/L), che mette i passi
// vicino all'occhio, e la parte della variazione di gOtt fatta fin lì (scende fino al punto più vicino al centro, tc, poi
// risale), che li mette dove lo spessore ottico cambia —: le densità di passi delle due regole si sommano
float misuraPassi(float t, float t0, float L, vec3 o, vec3 d, float tc, float g0, float gc, float Vg) {
  float g = gOtt(length(o + d * t)), fo = t <= tc ? (g - g0) / Vg : ((gc - g0) + (gc - g)) / Vg;
  return 0.5 * (sqrt(clamp((t - t0) / L, 0.0, 1.0)) + clamp(fo, 0.0, 1.0)); }
float gPasso = 0.5;
vec3 tratto(vec3 o, vec3 d, float t0, float t1, out vec3 tra) {
  float L = t1 - t0, odR = 0.0, odM = 0.0; vec3 sR = vec3(0.0), sM = vec3(0.0), sMS = vec3(0.0);
  // (I CONFINI DEI TRATTI: due regole insieme (le loro densità di passi si sommano: misuraPassi) — t ∝ f², fitta vicino all'occhio, dove
  // un'aria spessa vista da dentro fa quasi tutta la sua luce in pochi chilometri; e passi uguali nel logaritmo dello
  // SPESSORE OTTICO VERTICALE dell'aria che sta sopra (gas e foschia, ognuno con la sua scala d'altezza): ogni fattore e di
  // spessore ottico ha i suoi passi anche dove l'aria densa sta lontano dall'occhio, come guardando un pianeta da fuori — lì,
  // con t ∝ f² soltanto, su un'aria di migliaia di bar il disco veniva ad anelli finché i passi non erano centinaia)
  float tc = clamp(-dot(o, d), t0, t1), g0 = gOtt(length(o + d * t0)), gc = gOtt(length(o + d * tc)), Vg = max((gc - g0) + (gc - gOtt(length(o + d * t1))), 1e-6), tPrima = t0;
  // (la misura in 65 punti del raggio, fitti all'inizio; i confini si leggono interpolando: la misura cresce)
  float TM[65], FM[65]; int jM = 0; for (int j = 0; j <= 64; j++) { float u = float(j) / 64.0; TM[j] = t0 + L * u * u; FM[j] = misuraPassi(TM[j], t0, L, o, d, tc, g0, gc, Vg); }
  // (ogni tratto: l'aria del suo punto — la densità, la luce della stella che le arriva — e la parte di luce che esce dal
  // tratto sommata in modo esatto per un tratto uniforme: ∫₀^ds e^(−σs)ds = (1 − e^(−σ·ds))/σ, con la trasparenza dal suo
  // inizio. Prima la trasparenza era quella a metà del tratto per tutto il tratto: dove un tratto è otticamente spesso —
  // nel blu, sull'orizzonte di un'aria di qualche bar — la luce dell'aria vicina si perdeva, e l'immagine non convergeva
  // ai passi dell'app: test_vista)
  for (int i = 0; i < ${passi}; i++) {
    // (i tratti sono fitti vicino all'occhio e radi lontano — t ∝ f² —: la luce dell'aria vicina, che sull'orizzonte di
    // un'aria spessa è quasi tutta, cambia in pochi chilometri; quella lontana arriva già attenuata)
    float fb = float(i + 1) / ${passi}.0, ta = i == 0 ? t0 : tPrima; while (jM < 64 && FM[jM + 1] < fb) jM++; float tb = i == ${passi} - 1 ? t1 : mix(TM[jM], TM[jM + 1], clamp((fb - FM[jM]) / max(FM[jM + 1] - FM[jM], 1e-9), 0.0, 1.0)), ds = tb - ta; tPrima = tb;
    vec3 p = o + d * (ta + gPasso * ds); float r = length(p), h = r - u_atm.x;
    float rR = exp(clamp(-h / u_atm.y, -40.0, 8.0)), rM = exp(clamp(-h / u_atm.z, -40.0, 8.0));
    vec3 sig = u_betaR * rR + vec3(u_betaM.x * 1.1 * rM), Te = exp(-(u_betaR * odR + vec3(u_betaM.x * 1.1 * odM))), tau = sig * ds;
    vec3 w = Te * mix(vec3(ds), (1.0 - exp(-tau)) / max(sig, vec3(1e-30)), step(vec3(1e-4), tau));
    float mus = dot(p, u_soleC) / r; vec3 T = luceCheArriva(r, mus) * w;
    sR += rR * T; sM += rM * T; sMS += (u_betaR * rR + vec3(u_betaM.x * rM)) * multipla(r, mus) * w; odR += rR * ds; odM += rM * ds;
  }
  float mu = dot(d, u_soleC), g = u_betaM.y, fR = 0.0596831 * (1.0 + mu * mu), fM = 0.0795775 * (1.0 - g * g) / pow(1.0 + g * g - 2.0 * g * mu, 1.5);
  tra = exp(-(u_betaR * odR + vec3(u_betaM.x * 1.1 * odM)));
  return u_E * (u_betaR * fR * sR + vec3(u_betaM.x * fM) * sM + sMS);
}
void esce(vec3 scena, vec3 Tot, vec3 Add, float dist) { if (u_sfasa.z > 0.5 && u_sfasa.z < 1.5) { o_col = vec4(Add, dist); o_tot = vec4(Tot, dist); } else { o_col = vec4(scena * Tot + Add, 1.0); o_tot = vec4(0.0); } }
void main() {
  vec3 scena = texture(u_col, v_uv).rgb; scena = any(isnan(scena)) ? vec3(65504.0) : min(scena, vec3(65504.0)); float prof = texture(u_prof, v_uv).r; // (Inf·0 farebbe NaN)
  vec3 dO = vec3((v_uv * 2.0 - 1.0) * u_cam.xy, -1.0), de = u_raggi * dO; float lung = length(de); vec3 d = de / lung, o = u_occhio;
  float wP = exp2(prof * 2.0 / u_cam.z) - 1.0, fino = prof < 1.0 ? wP * lung : 1e30, dist = prof < 1.0 ? wP * length(dO) : 0.0; // (dist: metri veri lungo il raggio; 0: il cielo)
  if (u_falsiA > 0.5 && dist > 0.0) { esce(scena, vec3(1.0), vec3(0.0), dist); return; } // (i falsi colori: la superficie senza l'aria e le nuvole davanti)
  gPasso = 0.5 + (fract(fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) + u_sfasa.x) - 0.5) * u_sfasa.y;
  // (a camera ferma: Add e Tot già calcolati valgono solo se dietro il punto c'è ancora ciò che c'era — la stessa distanza
  // entro la precisione della profondità e dell'immagine che li tiene —; dove la scena è cambiata — una tessera arrivata,
  // il suolo che allora non c'era — si rifà il conto qui)
  if (u_sfasa.z > 1.5) { ivec2 q = ivec2(gl_FragCoord.xy); vec4 cA = texelFetch(u_cAdd, q, 0), cT = texelFetch(u_cTot, q, 0);
    if ((dist <= 0.0 && cA.a <= 0.0) || (dist > 0.0 && abs(cA.a - dist) <= u_cK.y * dist)) { o_col = vec4(scena * cT.rgb + cA.rgb * u_cK.x, 1.0); o_tot = vec4(0.0); return; } }
  float Rt = u_atm.x + u_cima, b = -dot(o, d), disc = b * b - dot(o, o) + Rt * Rt;
  if (disc <= 0.0 || u_atm.w <= 0.0) { esce(scena, vec3(1.0), vec3(0.0), dist); return; }
  float sq = sqrt(disc), t0 = max(0.0, b - sq), t1 = min(b + sq, fino);
  if (t1 <= t0) { esce(scena, vec3(1.0), vec3(0.0), dist); return; }
  // le nuvole: dove il raggio attraversa il loro strato, davanti a ciò che c'è dietro
  float Rn = u_atm.x + u_nuv.x, dn = b * b - dot(o, o) + Rn * Rn, tn = -1.0;
  if (u_nuv.w > 0.0 && dn > 0.0) { float s = sqrt(dn); tn = b - s > 0.0 ? b - s : b + s; if (tn <= t0 || tn >= t1) tn = -1.0; }
  vec3 tra, luce;
  if (tn > 0.0) {
    vec3 p = o + d * tn; float r = length(p), muS = dot(p, u_soleC) / r, tau = nuvola(p, tn * u_orma / sqrt(max(0.05, abs(dot(d, p) / r)))), R = rifNuvola(tau); // (il punto dello schermo sullo strato: di striscio è più lungo)
    vec3 dT = vec3(1.0), dA = vec3(0.0); // (ciò che c'è dietro la nuvola = scena·dT + dA)
    if (R < 0.995 && t1 - tn > 1.0) { vec3 tr2; vec3 l2 = tratto(o, d, tn, t1, tr2); dT = tr2; dA = l2 * u_cam.w; }
    if (tau > 0.01) {
      float ombra = rifNuvola(nuvola(p + u_soleC * 2500.0, max(tn * u_orma, 500.0))); // quanto la nuvola si fa ombra da sé verso la stella
      vec3 sole = (u_E / 3.14159) * luceCheArriva(r, muS) * smoothstep(-0.05, 0.1, muS);
      vec3 bianco = sole * (0.45 + 0.55 * clamp(muS, 0.0, 1.0)) * (1.0 - 0.45 * ombra) + (u_E / 3.14159) * cieloSu(muS) + vec3(u_notte); // (più la luce del cielo, quella vera, e di notte quella della galassia: prima mancava, e una coltre di nuvole di notte era nero puro — il 3D nero del seme 12345)
      dT *= 1.0 - R; dA = dA * (1.0 - R) + bianco * u_cam.w * R;
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
uniform vec2 u_minimo; uniform float u_espo; uniform vec4 u_asse; uniform float u_notte; // u_notte: la luce di notte (un quarto della luce diffusa della galassia), nell'unità di u_luce  // l'asse del corpo (assi del mondo) e quanto è a fasce (i giganti gassosi)
${GLSL_RUMORE}
out vec4 o_col;
void main() {
  vec3 d = normalize(v_q); float r = u_sfera.w, b = dot(d, v_c), disc = b * b - dot(v_c, v_c) + r * r;
  float lontano = length(v_c) * u_minimo.x;
  if (disc < 0.0) { // più piccola di un punto dello schermo: un dischetto con la stessa luce in tutto
    float fuori = length(v_q - v_c) / max(lontano, 1e-9); if (r > lontano || fuori > 1.0 || r < 0.35 * lontano) discard; // (ancora più piccola: non copre niente; la si vede dal suo punto di luce)
    float area = (r * r) / (lontano * lontano); vec3 c = u_tinta.w > 0.0 ? u_tinta.rgb * u_tinta.w : u_tinta.rgb * (u_luce * 0.5 + u_notte);
    o_col = vec4(c * area * u_espo * (1.0 - smoothstep(0.5, 1.0, fuori)), 1.0); gl_FragDepth = log2(max(1e-6, 1.0 + length(v_c))) * u_fc * 0.5; return;
  }
  float t = b - sqrt(disc); if (t < 0.0) discard;
  vec3 p = d * t, n = (p - v_c) / r, nM = transpose(u_vista) * n; vec3 col;
  // la stella: più scura al bordo con la legge dell'atmosfera grigia di Eddington, I(μ) = I(1)·(2 + 3μ)/5, e la luce che
  // esce (π∫I·2μdμ = 0,8·πI(1)) uguale al flusso vero: u_tinta.w = F/E0 → π·I(μ)/E0 = u_tinta.w·(0,5 + 0,75μ)
  // (prima: 0,4 + 0,6·μ^0,6, a mano, e senza conservare il flusso)
  if (u_tinta.w > 0.0) { float mu = max(dot(n, -d), 0.0); col = u_tinta.rgb * u_tinta.w * (0.5 + 0.75 * mu); }
  else {
    vec3 pM = transpose(u_vista) * p - u_ombra.xyz; float bb = dot(pM, u_sole), cc = dot(pM, pM) - u_ombra.w * u_ombra.w; // l'ombra del pianeta sulla luna
    float luce = (bb < 0.0 && bb * bb - cc > 0.0) ? 0.0 : 1.0;
    float lat = dot(nM, u_asse.xyz), macchie = mix(0.75 + 0.5 * frattale(nM * 6.0 + u_tinta.rgb * 20.0), 0.8 + 0.35 * sin(lat * 23.0 + 3.0 * frattale3(nM * 3.0 + u_tinta.rgb * 9.0) + 2.0 * sin(lat * 7.0)), u_asse.w);
    col = u_tinta.rgb * macchie * u_luce * max(dot(nM, u_sole), 0.0) * luce + u_tinta.rgb * u_notte; // (di notte la luce della galassia: prima 0,0008 a mano, e il lato in ombra di un gigante era nero)
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
// ---------- l'aria di un pianeta: dai gas veri e dalla pressione (P: il pianeta; R: il suo raggio; grav: la gravità al suolo)
export function ariaDi(P, R, grav) {
  const p = P.clima?.pressione || 0, gas = P.atmosfera?.gas || null; if (!(p > 1) || !isFinite(p)) return null;
  let M = 0, diff = 0, tot = 0; for (const [nome, x] of Object.entries(gas || { N2: 1 })) { const g = GAS[nome] || [0.03, 1]; M += x * g[0]; diff += x * g[1]; tot += x; } M /= tot || 1; diff /= tot || 1;
  const T = P.clima.Taria || P.clima.T || 250, H = (R_GAS * T) / (M * grav), densita = p / (K_B * T) / 2.547e25; // molecole rispetto all'aria della Terra al suolo (2,55·10²⁵ per m³)
  // Rayleigh dell'aria terrestre al suolo: 5,8 · 13,5 · 33,1 per milione di metri (680, 550, 440 nm)
  const betaR = [5.8e-6, 13.5e-6, 33.1e-6].map((b) => b * densita * diff), foschia = 2.5e-6 * Math.min(40, densita) * (1 + 12 * (P.atmosfera?.fuliggine || 0) + 40 * (gas?.H2O || 0));
  return { H, HM: Math.max(600, 0.15 * H), cima: Math.min(0.6 * R, H * Math.max(8, 4 + Math.log(Math.max(1, densita * diff)) * 2.5 + 6)), betaR, betaM: foschia, pressione: p, T, M };
}

// LA LUCE DIFFUSA PIÙ VOLTE E LA LUCE DEL CIELO SUL SUOLO. Il conto lungo i raggi (F_ARIA) segue la luce diffusa una volta
// sola; dove l'aria è spessa (su questo genere di mondi lo spessore ottico nel blu arriva a 3) la luce diffusa più volte
// è la parte maggiore: senza, l'aria spessa toglie il blu e non lo rende, e il pianeta esce scuro e arrossato.
// Qui, una volta per pianeta, la tabella di Hillaire (2020, «A Scalable and Production Ready Sky and Atmosphere Rendering
// Technique», EGSR): in ogni punto (quota × altezza della stella, 32 × 32) la luce diffusa due volte che arriva da tutte
// le direzioni (L₂, con 64 direzioni e il suolo che rimanda la luce con l'albedo del clima) e la parte f che l'aria
// ridiffonde: tutte le volte successive valgono L₂/(1 − f). E l'irradianza del cielo su un suolo orizzontale (semplice +
// multipla, 256 direzioni) per 32 altezze della stella: la luce del cielo sul suolo e sulle nuvole, e il cielo riflesso
// dal mare. Gli stessi coefficienti, la stessa funzione di Chapman, la stessa foschia del conto sulla scheda.
// (ND, NC: direzioni per la luce diffusa due volte e per l'irradianza del cielo; NS: passi lungo ogni raggio — le
// discretizzazioni di cui test_vista prova la convergenza)
export const TABELLE_GREZZE = { ND: 16, NC: 32, NS: 16 };
export function tabelleAria(aria, R, albedoClima, { ND = 64, NC = 256, NS = 48 } = {}) {
  const NM = 32, ms = new Float32Array(4 * NM * NM), cieloT = new Float32Array(4 * NM); if (!aria) return { ms, cieloT };
  const { H, HM, cima, betaR, betaM } = aria, Rt = R + cima, albedo = Math.max(0.02, Math.min(0.9, albedoClima ?? 0.3)), g = 0.76;
  const chap = (X, c) => { const k = Math.sqrt(1.5707963 * X); return k / ((k - 1) * c + 1); };
  const spess = (r, mu, Hs) => { const rho = Math.exp(Math.max(-40, Math.min(8, -(r - R) / Hs))); if (mu >= 0) return rho * chap(r / Hs, mu); const rt = r * Math.sqrt(Math.max(0, 1 - mu * mu)); if (rt < R) return 1e7; return 2 * Math.exp(-(rt - R) / Hs) * chap(rt / Hs, 0) - rho * chap(r / Hs, -mu); };
  const sole = (r, mu, o) => { const a = spess(r, mu, H) * H, b = betaM * 1.1 * HM * spess(r, mu, HM); for (let c = 0; c < 3; c++) o[c] = Math.exp(-(betaR[c] * a + b)); return o; };
  const dirs = (n) => { const d = []; for (let i = 0; i < n; i++) { const y = 1 - (2 * (i + 0.5)) / n, q = Math.sqrt(1 - y * y), a = i * 2.39996323; d.push([q * Math.cos(a), y, q * Math.sin(a)]); } return d; };
  const Ts = [0, 0, 0];
  // lungo un raggio dal punto (0, r, 0): chiama f(rp, mus, Te, ds, ρR, ρM) a ogni passo; restituisce [Te alla fine, μ della stella al suolo] o null
  const marcia = (r, d, s, f) => { const b = r * d[1], disc = b * b - r * r + R * R, aTerra = disc > 0 && -b - Math.sqrt(disc) > 0, fine = aTerra ? -b - Math.sqrt(disc) : -b + Math.sqrt(Math.max(0, b * b - r * r + Rt * Rt)), od = [0, 0, 0], Te = [1, 1, 1];
    // (tratti fitti all'inizio — t ∝ f², come nel frammento —: la luce che arriva dall'aria vicina al punto)
    for (let k = 0; k < NS; k++) { const ta = fine * (k / NS) ** 2, ds = fine * ((k + 1) / NS) ** 2 - ta, t = ta + 0.5 * ds, px = d[0] * t, py = r + d[1] * t, pz = d[2] * t, rp = Math.hypot(px, py, pz), h = rp - R, rR = Math.exp(-h / H), rM = Math.exp(-h / HM);
      // (come nel frammento: la trasparenza dall'inizio del tratto per ∫e^(−σs)ds sul tratto, esatto per un tratto uniforme;
      // a f va questo «Te·ds» pesato, al posto della trasparenza a metà per ds)
      for (let c = 0; c < 3; c++) { const sig = betaR[c] * rR + betaM * 1.1 * rM, tau = sig * ds; Te[c] = Math.exp(-od[c]) * (tau > 1e-4 ? -Math.expm1(-tau) / sig : ds); od[c] += tau; }
      f(rp, (px * s[0] + py * s[1] + pz * s[2]) / rp, Te, 1, rR, rM, d); }
    if (!aTerra) return null; const pz = [d[0] * fine, r + d[1] * fine, d[2] * fine]; for (let c = 0; c < 3; c++) Te[c] = Math.exp(-od[c]); return [Te, (pz[0] * s[0] + pz[1] * s[1] + pz[2] * s[2]) / R]; };
  const D64 = dirs(ND), D256 = dirs(NC).filter((d) => d[1] > 0);
  for (let ih = 0; ih < NM; ih++) for (let im = 0; im < NM; im++) {
    const r = R + Math.max(1, cima * (ih / (NM - 1)) ** 2), mu = -1 + (2 * im) / (NM - 1), s = [Math.sqrt(1 - mu * mu), mu, 0], L2 = [0, 0, 0], fm = [0, 0, 0];
    for (const d of D64) {
      const suolo = marcia(r, d, s, (rp, mus, Te, ds, rR, rM) => { sole(rp, mus, Ts); for (let c = 0; c < 3; c++) { const sc = betaR[c] * rR + betaM * rM; L2[c] += (Te[c] * sc * Ts[c] * ds) / (4 * Math.PI); fm[c] += Te[c] * sc * ds; } });
      if (suolo && suolo[1] > 0) { sole(R, suolo[1], Ts); for (let c = 0; c < 3; c++) L2[c] += (suolo[0][c] * Ts[c] * suolo[1] * albedo) / Math.PI; } }
    for (let c = 0; c < 3; c++) { const v = L2[c] / ND / Math.max(0.05, 1 - fm[c] / ND); ms[4 * (ih * NM + im) + c] = Number.isFinite(v) ? v : 0; }
    ms[4 * (ih * NM + im) + 3] = 1; }
  const psi = (rp, mus, c) => { const x = Math.max(0, Math.min(NM - 1.001, (mus * 0.5 + 0.5) * (NM - 1))), y = Math.max(0, Math.min(NM - 1.001, Math.sqrt(Math.max(0, Math.min(1, (rp - R) / cima))) * (NM - 1))), i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, q = (jj, ii) => ms[4 * (jj * NM + ii) + c];
    return (q(j, i) * (1 - u) + q(j, i + 1) * u) * (1 - v) + (q(j + 1, i) * (1 - u) + q(j + 1, i + 1) * u) * v; };
  for (let im = 0; im < NM; im++) { const mu = -1 + (2 * im) / (NM - 1), s = [Math.sqrt(1 - mu * mu), mu, 0], E = [0, 0, 0];
    for (const d of D256) { const cosS = d[0] * s[0] + d[1] * s[1], fR = (3 / (16 * Math.PI)) * (1 + cosS * cosS), fM = (1 - g * g) / (4 * Math.PI * Math.pow(1 + g * g - 2 * g * cosS, 1.5)), w = (2 * Math.PI) / D256.length;
      marcia(R + 1, d, s, (rp, mus, Te, ds, rR, rM) => { sole(rp, mus, Ts); for (let c = 0; c < 3; c++) E[c] += w * d[1] * Te[c] * ds * (betaR[c] * rR * fR * Ts[c] + betaM * rM * fM * Ts[c] + (betaR[c] * rR + betaM * rM) * psi(rp, mus, c)); }); }
    cieloT.set([E[0], E[1], E[2], 1], 4 * im); }
  // L'ARIA SPESSA: la serie Ψ = L₂/(1 − f) suppone che ogni ordine di diffusione abbia la forma del secondo, nello stesso
  // punto; dove l'aria è otticamente spessa la luce arriva in basso DIFFONDENDO dagli strati sopra (il fascio diretto non
  // c'è più), e la serie — troncata a 1/(1 − f) ≤ 20 — non lo vede: misurato su un mondo di 34 bar (τ ≈ 10 nel verde, 26 nel
  // blu) la luce del cielo al suolo usciva 1,7·10⁻⁴ di quella della stella nel verde e 5·10⁻¹¹ nel blu, quando uno strato che
  // diffonde senza assorbire ne lascia passare ~1/(1 + ¾τ) ≈ 10% (il suolo e l'aria bassa erano neri: la vista vuota da
  // vicino). Qui il trasporto vero lungo la verticale: i due flussi (Eddington; Toon e altri 1989, J. Geophys. Res. 94,
  // 16287, con ω = 1: γ₁ = ¾(1 − g), la parte del fascio diretto che va in su γ₃ = ½ − ¾·g·μ₀), strato per strato (δτ ≤ 0,02;
  // al più 80·NS strati: su un'aria di migliaia di bar ognuno è spesso, e lo si prende omogeneo)
  // col metodo dell'addizione, il suolo che rimanda con l'albedo del clima e il fascio diretto attenuato come nel frammento
  // (Chapman). Ne escono la luce diffusa che scende sul suolo (la luce del cielo) e, a ogni quota, quella che va in su e in
  // giù: la radianza media del campo diffuso, J = (F↓ + F↑)/2π, è ciò che l'aria di lì ridiffonde dopo il primo ordine
  // (Ψ). Si tiene il più grande dei due conti: la serie, che conosce la forma angolare, può soltanto mancare luce dove
  // l'aria è spessa; dove è sottile i due conti si accordano (su un'aria come quella della Terra la serie resta sopra).
  { const tauV = (h, c) => betaR[c] * H * Math.exp(-h / H) + betaM * 1.1 * HM * Math.exp(-h / HM), tMax = Math.max(tauV(0, 0), tauV(0, 1), tauV(0, 2));
    const n = Math.min(80 * NS, Math.ceil(tMax / 0.02) + 64), hL = new Float64Array(n + 1), tc = (h) => Math.max(tauV(h, 0), tauV(h, 1), tauV(h, 2));
    // (i livelli: uguali nello spessore ottico del colore più diffuso, dalla cima al suolo)
    for (let k = 0; k <= n; k++) { const obiettivo = tc(cima) + (tMax - tc(cima)) * (k / n); let a = 0, b = cima; for (let i = 0; i < 60; i++) { const m = 0.5 * (a + b); if (tc(m) > obiettivo) a = m; else b = m; } hL[k] = 0.5 * (a + b); }
    hL[0] = cima; hL[n] = 0;
    const al = new Float64Array(n + 1), be = new Float64Array(n + 1), Dn = new Float64Array(n + 1), S = new Float64Array(n + 1), S3 = new Float64Array(3 * (n + 1)), rL = new Float64Array(n), gL = new Float64Array(n), T3 = [0, 0, 0];
    for (let im = 0; im < NM; im++) { const mu = -1 + (2 * im) / (NM - 1); if (!(mu > 0.002)) continue;
      for (let k = 0; k <= n; k++) { sole(R + hL[k], mu, T3); S3[3 * k] = mu * T3[0]; S3[3 * k + 1] = mu * T3[1]; S3[3 * k + 2] = mu * T3[2]; }
      for (let c = 0; c < 3; c++) {
        for (let k = 0; k <= n; k++) S[k] = S3[3 * k + c];
        for (let k = 0; k < n; k++) { const dR = betaR[c] * H * (Math.exp(-hL[k + 1] / H) - Math.exp(-hL[k] / H)), dM = betaM * 1.1 * HM * (Math.exp(-hL[k + 1] / HM) - Math.exp(-hL[k] / HM)), dt = dR + dM, gE = dt > 0 ? (dM * g) / dt : 0; const g1 = 0.75 * (1 - gE) * dt; rL[k] = g1 / (1 + g1); gL[k] = gE; } // (uno strato omogeneo che diffonde senza assorbire, a due flussi: R = γ₁τ/(1 + γ₁τ), esatto anche dove lo strato è spesso)
        // dal suolo in su: F↑ = α·F↓ + β a ogni livello; poi dalla cima in giù
        al[n] = albedo; be[n] = albedo * S[n];
        for (let k = n - 1; k >= 0; k--) { const r = rL[k], t = 1 - r, sc = S[k] - S[k + 1], su = sc * (0.5 - 0.75 * gL[k] * mu), giu = sc - su, q = 1 / (1 - r * al[k + 1]);
          al[k] = r + t * t * al[k + 1] * q; be[k] = t * be[k + 1] + su + t * al[k + 1] * (r * be[k + 1] + giu) * q; }
        Dn[0] = 0; for (let k = 0; k < n; k++) { const r = rL[k], t = 1 - r, sc = S[k] - S[k + 1], giu = sc - sc * (0.5 - 0.75 * gL[k] * mu); Dn[k + 1] = (t * Dn[k] + r * be[k + 1] + giu) / (1 - r * al[k + 1]); }
        if (Dn[n] > cieloT[4 * im + c]) cieloT[4 * im + c] = Dn[n];
        // Ψ alle quote della tabella (interpolando tra i livelli)
        for (let ih = 0; ih < NM; ih++) { const h = Math.max(1, cima * (ih / (NM - 1)) ** 2); let lo = 0, hi = n; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (hL[m] > h) lo = m; else hi = m; }
          const w = hL[lo] > hL[hi] ? (hL[lo] - h) / (hL[lo] - hL[hi]) : 0, J = ((1 - w) * (Dn[lo] + al[lo] * Dn[lo] + be[lo]) + w * (Dn[hi] + al[hi] * Dn[hi] + be[hi])) / (2 * Math.PI), q = 4 * (ih * NM + im) + c;
          if (J > ms[q]) ms[q] = J; } } } }
  return { ms, cieloT };
}

export function creaPianeta(N, { P, stella = {}, via = null, superficie = () => null, opzioni = {}, corpi = null } = {}) {
  const gl = N.gl, O = { magliePerPixel: 7, puntiPerPixel: 2.6, errorePixel: 1.0, massimoTessere: 110, fili: 0, passiAria: 48, nuvole: 1, onde: 1, vortici: 1, rilievo: 1, suoloFine: 1, lune: true, anelli: true, ...opzioni };
  const R = P.raggioM, schiaccia = 1 - Math.min(0.3, P.schiacciamento || 0), grav = P.clima?.g || (6.674e-11 * P.massaKg) / (R * R);
  // ---------- i corpi: la stella al centro, il pianeta che le gira attorno e gira su sé stesso, le lune
  const Tstella = stella.T || 5772, raggioStella = Math.sqrt((P.Lw || 3.8e26) / (4 * Math.PI * 5.670374e-8 * Tstella ** 4));
  const nero = coloreCorpoNero(Tstella), coloreLuce = luminanzaUno(nero); // (il colore vero della luce, a luminanza 1: l'occhio che vi si adatta è in nucleo.js, OCCHIO)
  const corpoStella = corpi ? corpi.stella : N.corpo({ nome: 'stella', luogo: via ? luogoDi({ cosmo: via.cosmo, galassia: via.galassia, stella: via.stella }) : null, raggio: raggioStella, luce: { colore: coloreLuce, T: Tstella } });
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
  const aria = ariaDi(P, R, grav);
  // la luce della stella che arriva a raggio r con la stella a coseno mu dalla verticale (la stessa luceCheArriva del frammento)
  const luceDiretta = (r, mu) => { const ch = (X, c) => { const k = Math.sqrt(1.5707963 * X); return k / ((k - 1) * c + 1); };
    const sp = (Hs) => { const rho = Math.exp(Math.max(-40, Math.min(8, -(r - R) / Hs))); if (mu >= 0) return rho * ch(r / Hs, mu); const rt = r * Math.sqrt(Math.max(0, 1 - mu * mu)); if (rt < R) return 1e7; return 2 * Math.exp(-(rt - R) / Hs) * ch(rt / Hs, 0) - rho * ch(r / Hs, -mu); };
    if (!aria) return [1, 1, 1]; const a = sp(aria.H) * aria.H, m = aria.betaM * 1.1 * aria.HM * sp(aria.HM); return aria.betaR.map((b) => Math.exp(-(b * a + m))); };
  // (le tabelle costano un secondo e mezzo: sul filo dell'interfaccia se ne fanno subito di GREZZE — 16 direzioni, 32 per
  // il cielo, 16 passi: 80 ms, ~8% dalle fini —, le FINI le fa volume.worker.js e arrivano dopo; `ariaFine` dice quando)
  let texMS = null, texCielo = null, ariaFine = !aria, filoAria = null, tabCPU = null;
  const metti = (t) => { tabCPU = t; if (texMS) { gl.deleteTexture(texMS); gl.deleteTexture(texCielo); } texMS = N.immagine(32, 32, 'rgba16fDaFloat', t.ms); texCielo = N.immagine(32, 1, 'rgba16fDaFloat', t.cieloT); };
  if (aria && typeof Worker !== 'undefined') {
    metti(tabelleAria(aria, R, P.clima?.albedo, TABELLE_GREZZE));
    try { filoAria = new Worker(new URL('./volume.worker.js', import.meta.url), { type: 'module' });
      filoAria.onmessage = (e) => { const d = e.data; if (filoAria) filoAria.terminate(); filoAria = null; if (d.errore) { console.error('le tabelle fini dell\'aria non si sono potute fare:', d.errore); metti(tabelleAria(aria, R, P.clima?.albedo)); } else metti(d); ariaFine = true; cielo3d.libera?.(); N.cambia(); };
      filoAria.postMessage({ tipo: 'aria', aria, R, albedo: P.clima?.albedo });
    } catch (e) { filoAria = null; metti(tabelleAria(aria, R, P.clima?.albedo)); ariaFine = true; } }
  else { metti(tabelleAria(aria, R, P.clima?.albedo)); ariaFine = true; }
  // il raggio angolare della stella vista dal pianeta: la penombra delle ombre del rilievo
  const discoStella = () => Math.max(1e-3, Math.min(0.2, (corpoStella.raggio || raggioStella) / Math.max(1, stato.dStella)));

  // ---------- le tessere: chieste al filo a parte, tenute finché servono
  const tessere = new Map(), coda = [], fili = [], base = { pronta: false, k: null };
  let S0 = null, uso = 0, richieste = 0, arrivate = 0, msTessere = 0;
  const chiave = (L, tx, ty) => L * 1e10 + ty * 1e5 + tx;
  const liscio = { L: -1, alt: N.immagine(2, 2, 'rg32f', new Float32Array([0, -1e5, 0, -1e5, 0, -1e5, 0, -1e5]), { filtro: gl.NEAREST }), pend: N.immagine(1, 1, 'rgba16fDaFloat', new Float32Array([0, 0, 1, 0])), terra: N.immagine(1, 1, 'rgba8', new Uint8Array([...(P.colore || [150, 140, 120]), 255])), acqua: null, oriz1: null, oriz2: null, hMin: 0, hMax: 0, altLiv: null };
  const trasparente = N.immagine(1, 1, 'rgba8', new Uint8Array([0, 0, 0, 0])), neutro = N.immagine(1, 1, 'rgba8', new Uint8Array([255, 255, 255, 255])); liscio.oriz1 = liscio.oriz2 = trasparente;
  function avviaFili() {
    S0 = superficie(); if (!S0 || base.pronta) return; base.pronta = true; base.k = S0.k;
    const quanti = O.fili || Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 4) - 1));
    for (let i = 0; i < quanti; i++) {
      const w = new Worker(new URL('./tessere.worker.js', import.meta.url), { type: 'module' }), f = { w, libero: true };
      w.onmessage = (e) => { if (e.data?.tipo === 'campi') { campiArrivati(e.data); return; } if (e.data?.tipo === 'fine') { fineArrivato(e.data); return; } f.libero = true; arrivata(e.data); distribuisci(); };
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


  // ---------- IL SUOLO FINE (suolo.js): la finestra del suolo sotto l'occhio, a pochi metri (vedi in cima)
  let SU = null; import('../camera/suolo.js').then((m) => { SU = m; }).catch(() => {});
  const fine = { campi: new Map(), chiesti: new Set(), fin: null, attiva: false, inCorso: false, ms: 0, quante: 0, tex: null };
  function campiArrivati(d) { if (d.k !== base.k) return; if (d.errore) { console.error('mondo3d: i campi della tessera non sono arrivati:', d.errore); return; } fine.campi.set(d.n, d); if (fine.campi.size > 6) fine.campi.delete(fine.campi.keys().next().value); N.cambia(); }
  // a ogni fotogramma: serve una finestra? quella che c'è basta ancora? (il calcolo, se serve, si fa fuori dal fotogramma)
  function aggiornaFine(S) {
    if (!SU || !O.suoloFine || !base.pronta || !S0 || !fili.length || !(stato.quota < 400) || !(stato.quota > 0)) { fine.attiva = false; return; }
    // quanto è largo lo schermo sul suolo (al centro, alla distanza vera: lo sguardo può essere di striscio)
    const sot = N.sotto ? N.sotto(S.W / 2, S.H / 2) : null, largo = (S.W * (sot?.distanza ?? stato.quota)) / S.fuoco; fine.largo = largo;
    // la griglia della finestra è quella delle finestre del livello 5 (10 m in 128 punti: 7,8 cm), lunga il doppio (256 punti), così
    // copre lo schermo fin dove il 3D lascia il posto al livello 5 (lo schermo largo ~12 m); più in alto quella di 100 m in 128
    const lato5 = largo <= 20 ? 10 : largo <= 200 ? 100 : 0; if (!lato5) { fine.attiva = false; return; }
    let u = stato.lon / (2 * Math.PI) + 0.5; u -= Math.floor(u); const v = Math.max(0, Math.min(0.999999, 0.5 - stato.lat / Math.PI)), t = migliore(u, v, LMAX);
    if (!t || t.L < 1) { fine.attiva = false; return; } // (senza una tessera la cella sarebbe di ~100 km: non si fa)
    const lato = 2 * lato5, kc = t.k, campi = fine.campi.get(kc);
    if (!campi) { if (!fine.chiesti.has(kc)) { fine.chiesti.add(kc); fili[0].w.postMessage({ tipo: 'campi', n: kc, L: t.L, tx: t.tx, ty: t.ty }); } return; }
    const f = fine.fin; if (f && f.kc === kc && f.lato === lato && !f.fin) { fine.attiva = false; if (f.lon === undefined || Math.hypot(f.lonC - stato.lon, f.latC - stato.lat) * R < lato / 4) return; } // (lì è acqua: si riprova solo spostandosi)
    if (f && f.kc === kc && f.lato === lato && f.fin) { const [x, y] = SU.nelTrattoSuolo(f.fin.tratto, stato.lon / RAD, stato.lat / RAD), cx = f.fin.x0 + f.fin.L / 2, cy = f.fin.y0 + f.fin.L / 2; if (Math.abs(x - cx) < lato / 4 && Math.abs(y - cy) < lato / 4) { fine.attiva = !!fine.tex; return; } }
    if (fine.inCorso && fine.attesa && performance.now() - fine.t0 > 20000) { fine.attesa = null; fine.inCorso = false; } // (il filo non ha risposto)
    if (fine.inCorso) return; fine.inCorso = true; const lon = stato.lon / RAD, lat = stato.lat / RAD;
    setTimeout(() => { let fuori = false; try { fuori = faiFine(campi, lon, lat, lato, kc); } catch (err) { console.warn('mondo3d: il suolo fine non si è potuto calcolare:', err); fine.fin = { kc, lato, fin: null, lon, lat, lonC: lon * RAD, latC: lat * RAD }; } finally { if (!fuori) fine.inCorso = false; } }, 0); // (nel filo: inCorso finché non torna)
  }
  // FUORI DAL FILO PRINCIPALE (tessere.worker.js, { tipo: 'fine' }): il padre e il rilievo (la finestra di 256 punti, la griglia del
  // livello 5: il campo fine costa ~1 s) e la tinta del suolo, da una finestra dello stesso lato in 128 punti (immagineSuolo costa
  // ~1 ms ogni cento punti; la tinta è la nebbia dei granelli, la statistica di ogni punto, e le crepe). Il filo usa le stesse
  // funzioni con gli stessi argomenti (gli stessi bit); qui restano le pendenze, la posizione e le immagini per la scheda grafica.
  // Se il filo non risponde (o non c'è) si fa qui come prima, fuori dal fotogramma.
  function faiFine(campi, lon, lat, lato, kc) {
    SU.ricordaTessera(S0.k, campi); fine.t0 = performance.now();
    if (fili.length) { fine.attesa = { kc, lato, lon, lat, campi }; fili[0].w.postMessage({ tipo: 'fine', n: kc, lon, lat, lato, campi }); return true; }
    faiFineQui(campi, lon, lat, lato, kc); return false;
  }
  function fineArrivato(d) {
    const a = fine.attesa; fine.attesa = null; fine.inCorso = false; if (!a || d.k !== base.k || d.n !== a.kc || d.lato !== a.lato || d.lon !== a.lon || d.lat !== a.lat) return;
    if (d.errore) { console.warn('mondo3d: il suolo fine nel filo non è riuscito, lo si fa qui:', d.errore); try { faiFineQui(a.campi, a.lon, a.lat, a.lato, a.kc); } catch (err) { console.warn(err); } return; }
    const { kc, lato, lon, lat } = a;
    if (d.acqua) { fine.fin = { kc, lato, fin: null, lon, lat, lonC: lon * RAD, latC: lat * RAD }; fine.attiva = false; liberaFine(); return; }
    // (la finestra, leggera: ciò che di lei si usa qui e in suoloFine; il campo è quello calcolato nel filo)
    const fin = { N: d.N, h: d.h, gx0: d.gx0, gy0: d.gy0, x0: d.x0, y0: d.y0, L: d.L, padre: d.padre, tratto: d.tratto, campo: d.campo };
    mettiFine(fin, kc, lato, lon, lat); const F = fine.fin; fine.ms = performance.now() - fine.t0;
    mettiTinta(F, d.px, d.m, performance.now());
  }
  function faiFineQui(campi, lon, lat, lato, kc) {
    const t0 = performance.now();
    const fin = SU.finestraSuolo(S0, { lon, lat, latoM: lato, N: 256, livello: campi.livello, tessera: campi });
    if (!fin || fin.acqua) { fine.fin = { kc, lato, fin: null, lon, lat, lonC: lon * RAD, latC: lat * RAD }; fine.attiva = false; liberaFine(); return; }
    mettiFine(fin, kc, lato, lon, lat); const F = fine.fin; fine.ms = performance.now() - t0;
    setTimeout(() => { if (fine.fin !== F || !fine.tex) return; try { const t1 = performance.now(), f2 = SU.finestraSuolo(S0, { lon, lat, latoM: lato, N: 128, livello: campi.livello, tessera: campi }); mettiTinta(F, SU.immagineSuolo(f2, { luce: false }), f2.N, t1); } catch (err) { console.warn('mondo3d: la tinta del suolo fine non si è potuta calcolare:', err); } }, 0);
  }
  function mettiFine(fin, kc, lato, lon, lat) {
    const n = fin.N, Z = fin.campo.Z, h = fin.h, g4 = new Float32Array(4 * n * n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const q = j * n + i, ia = Math.max(0, i - 1), ib = Math.min(n - 1, i + 1), ja = Math.max(0, j - 1), jb = Math.min(n - 1, j + 1);
      g4[4 * q] = (Z[j * n + ib] - Z[j * n + ia]) / ((ib - ia) * h); g4[4 * q + 1] = (Z[jb * n + i] - Z[ja * n + i]) / ((jb - ja) * h); }
    // dove sta: i punti estremi della finestra in longitudine e latitudine (lineari nel tratto)
    const tr = fin.tratto, [lonA, latA] = SU.dalTrattoSuolo(tr, (fin.gx0 + 0.5) * h, (fin.gy0 + 0.5) * h), [lonB, latB] = SU.dalTrattoSuolo(tr, (fin.gx0 + n - 0.5) * h, (fin.gy0 + n - 0.5) * h);
    liberaFine(); fine.tex = { G: N.immagine(n, n, 'rgba16fDaFloat', g4), A: null };
    let rms = 0; for (let q = 0; q < n * n; q++) rms += Z[q] * Z[q]; rms = Math.sqrt(rms / (n * n));
    fine.fin = { kc, lato, fin, n, lonA: lonA * RAD, latA: latA * RAD, dLon: (lonB - lonA) * RAD, dLat: (latB - latA) * RAD, media: [1, 1, 1], rms, lon, lat };
    fine.attiva = true; fine.quante++; N.cambia();
  }
  function mettiTinta(F, px, m, t1) {
    if (fine.fin !== F || !fine.tex) return; const a4 = new Uint8Array(4 * m * m), media = [0, 0, 0], lin = (c) => Math.pow(c / 255, 2.2);
    for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) { const q = j * m + i, o = 4 * ((m - 1 - j) * m + i); for (let c = 0; c < 3; c++) { a4[4 * q + c] = px[o + c]; media[c] += lin(px[o + c]); } a4[4 * q + 3] = 255; } // (l'immagine ha il nord in alto: qui la riga j è quella del tratto, da sud)
    fine.tex.A = N.immagine(m, m, 'rgba8', a4); F.media = media.map((x) => x / (m * m)); fine.msTinta = performance.now() - t1; N.cambia();
  }
  function liberaFine() { if (fine.tex) { for (const k of ['G', 'A']) if (fine.tex[k]) gl.deleteTexture(fine.tex[k]); fine.tex = null; } }
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

  // ---------- le onde del mare: lo SPETTRO del punto dove sta l'occhio (finestra.js: il mare di vento di quel vento, Elfouhaily
  // e altri 1997 con la direzione di Mitsuyasu e altri 1975) più il MARE LUNGO che vi arriva in quell'istante dalle tempeste
  // lontane (mare_lungo.js: le bande di periodo, ognuna con la sua direzione), in quattro tessere di Tessendorf a lati
  // incommensurabili (onde_cascata.js), rifatte a ogni fotogramma nel tempo delle onde e messe in un'immagine a strati.
  // Il punto si rifà quando l'occhio si sposta di un millesimo di radiante, o dopo dieci minuti del mondo (il mare lungo cambia
  // con le tempeste che lo mandano). L₀ va a passi di √2 (con un margine), perché le tessere non cambino a ogni passo.
  // LA LONGITUDINE DI RIFERIMENTO: le onde si contano in X = R·cos(lat)·(lon − lon_rif), Y = R·lat. Con lon_rif = 0 (prima) la
  // carta lontano dal meridiano zero si storce (dX/dlat = −R·sin(lat)·lon: a 30° di latitudine e 2 radianti di longitudine le
  // onde erano inclinate di 45°); lon_rif sta vicina all'occhio, a passi di 0,05 radianti (lì la storcitura resta sotto il 2,5%).
  let onde = null, ondeQui = null, ondeDove = null, ondeT0 = -Infinity, ondeTex = null, tOndeAcc = 0, tOndePrima = null, lonRif = 0, L0passo = 0;
  let FI = null; import('../camera/finestra.js').then((m) => { FI = m; }).catch(() => {});
  function aggiornaOnde(lon, lat, t) {
    if (!S0?.mare?.esiste || !FI || !O.onde) { ondeQui = null; return; }
    if (!onde) onde = creaCascata(S0.mare.radice);
    if (ondeDove && Math.abs(ondeDove[0] - lon) < 1e-3 && Math.abs(ondeDove[1] - lat) < 1e-3 && Math.abs(t - ondeT0) < 600 && ondeQui) return;
    ondeDove = [lon, lat]; ondeT0 = t; const P = FI.padreMare(S0.mare, lon / RAD, lat / RAD, { acqua: true }); if (!P) { ondeQui = null; return; }
    const treni = mareLungo(S0.mare, lon / RAD, lat / RAD, t).slice(0, 3), spV = FI.spettro({ ...P, Hl: 0 }), spL = treni.map((x) => FI.spettro({ ...P, U: 0, Hs: 0, Hl: x.H, Tl: x.T, lx: x.lx, ly: x.ly })).filter((x) => x && x.parti.length);
    const tutti = [spV, ...spL].filter((x) => x && x.parti.length); if (!tutti.length) { ondeQui = { P, treni, U: P.U, H: P.Hs, T: P.Tp }; return; }
    const sp = { F: (kx, ky) => { let v = 0; for (const x of tutti) v += x.F(kx, ky); return v; }, Frange: spV.parti.length ? spV.Frange : null, mss: (a, b) => { let v = 0; for (const x of tutti) v += x.mss(a, b); return v; }, km: P.km };
    const lam = 2 * Math.PI / Math.min(...tutti.map((x) => x.kp)), passo = Math.log2(CASCATA.picchi * lam) * 2; if (!L0passo || Math.abs(passo - L0passo) > 0.75) L0passo = Math.round(passo);
    onde.prepara(sp, (k) => FI.omega({ ...P, d: Infinity }, k), 2 ** (L0passo / 2) / CASCATA.picchi); msOnde = 0; nOnde = 0;
    ondeQui = { P, treni, U: P.U, H: P.Hs, T: P.Tp, L0: onde.L0, Hlungo: treni[0]?.H || 0, Tlungo: treni[0]?.T || 0 };
    const nuovo = Math.round(lon / 0.05) * 0.05; if (Math.abs(nuovo - lonRif) > 0.05) lonRif = nuovo;
  }
  // il campo delle tessere nel tempo delle onde (che corre col mondo, ma mai più di un quarto di secondo per fotogramma: oltre,
  // le onde corte farebbero più di un giro tra due fotogrammi e si vedrebbero ferme o all'indietro)
  // LE TESSERE CHE SERVONO: una tessera più corta di due punti dello schermo, là dove i punti sono più piccoli (sotto l'occhio:
  // quota/fuoco), non si legge in nessun punto (il frammento e i vertici la saltano: vedi u_cAtt), e non la si rifà. Il costo
  // in ms della CPU per fotogramma (le trasformate e il rango della schiuma) è in statistiche().onde.ms.
  const ondeAttive = new Float32Array(4).fill(1); let msOnde = 0, nOnde = 0;
  function aggiornaTessereOnde(S) {
    if (!onde || !onde.pronta || !ondeQui) return; tOndeAcc += Math.max(0, Math.min(0.25, S.dt || 0));
    const ormaMin = Math.max(0.01, stato.quota) / S.fuoco; for (const T of onde.C) ondeAttive[T.c] = T.L >= 2 * ormaMin || O.ondeTutte || N.opzioni.ondeTutte ? 1 : 0; // (ondeTutte: per misurare quanto si risparmia)
    if (tOndePrima === tOndeAcc && ondeTex) return; tOndePrima = tOndeAcc; const t0 = performance.now(); onde.aggiorna(tOndeAcc, ondeAttive); msOnde += performance.now() - t0; nOnde++;
    const n = CASCATA.N; gl.activeTexture(gl.TEXTURE15); if (!ondeTex) { ondeTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, ondeTex); gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1 + Math.log2(n), gl.RGBA8, n, n, CASCATA.n);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR); }
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, ondeTex); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, n, n, CASCATA.n, gl.RGBA, gl.UNSIGNED_BYTE, onde.dati); gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  }
  // lo strato limite dell'aria e quello rimescolato del mare, dal vento e dalla rotazione: h ≈ 0,3·u*/|f| (lo strato di Ekman
  // neutro: Rossby e Montgomery 1935, Zilitinkevich 1972, con c tra 0,2 e 0,4), u* = √C_d·U (C_d = 1,3·10⁻³) nell'aria e
  // u*·√(ρ_aria/ρ_acqua) nell'acqua; vicino all'equatore (f → 0) non più di 3 km nell'aria e 300 m nel mare
  function strati(U, lat) { const f = Math.max(1e-6, Math.abs(2 * (2 * Math.PI / Math.max(1, Math.abs(P.giorno || 86400))) * Math.sin(lat))), us = Math.sqrt(1.3e-3) * Math.max(U, 0.5), rr = ondeQui?.P ? Math.sqrt(ondeQui.P.rhoAria / ondeQui.P.rho) : 0.035;
    return [Math.min(3000, (0.3 * us) / f), Math.min(300, Math.max(2, (0.3 * us * rr) / f))]; }
  // ---------- i vortici del mare (vortici.js): quelli vivi attorno all'occhio, rifatti quando ci si sposta di un ventesimo del
  // raggio in cui si cercano o passa un'ora del mondo. Il raggio: quattro volte la quota, almeno una cella del processo, al più
  // 3000 km; i 32 più vicini, col peso che sfuma verso il più lontano (oltre, lo schermo li mostra piccoli: il loro effetto
  // è sotto il punto). Coordinate: longitudine e latitudine del pianeta.
  let vort = null, vortDove = null; const vA = new Float32Array(128), vB = new Float32Array(128), vC = new Float32Array(128); let vN = 0, vLm = 0, msVortici = 0;
  function aggiornaVortici(lon, lat, t) {
    if (!S0?.mare?.esiste || !O.vortici) { vN = 0; return; } if (!vort) vort = creaVortici(S0.mare, { giorno: P.giorno }); if (!vort) { vN = 0; return; }
    const D = Math.min(3e6, Math.max(4 * stato.quota, vort.lato));
    if (vortDove && Math.hypot(R * Math.cos(lat) * (lon - vortDove[0]), R * (lat - vortDove[1])) < D / 20 && Math.abs(t - vortDove[2]) < 3600 && Math.abs(Math.log(D / vortDove[3])) < 0.2) return;
    const t0 = performance.now(); vortDove = [lon, lat, t, D]; const L = vort.vicini(lon, lat, D, t, 32), lim = L.length === 32 ? L[31].dist : Infinity; vN = L.length;
    L.forEach((e, i) => { const w = Number.isFinite(lim) ? Math.min(1, Math.max(0, (lim - e.dist) / (0.25 * lim))) : 1; vA.set([e.lon, e.lat, e.Ls, w], 4 * i); vB.set([e.U, e.theta, e.Gx, e.Gy], 4 * i); vC.set([e.De, e.Dn, 0, 0], 4 * i); });
    vLm = vort.sottomesoscala(lat, strati(ondeQui ? ondeQui.U : 0, lat)[1]); msVortici = performance.now() - t0;
  }
  const falsiAccesi = () => N.opzioni.falsiColori === 'temperatura';
  // ---------- le nuvole: la copertura e i venti di meteo.js in un'immagine (rifatta quando la stagione cambia)
  let meteoTex = null, meteoStagione = -9, nuvoleMedie = 0, meteoH = 32, scalaT = [0, 1], tSup = null; const Tref = P.clima?.T || 288;
  // LA SCALA DEI FALSI COLORI si adatta a ciò che si guarda, come una termocamera: dal più freddo al più caldo della carta
  // entro due quote dall'occhio (almeno una cella della carta), allargata di quanto i vortici lì vicino possono spostare la
  // temperatura (|∇T̄|·(L_s·min(θ, 2) + |Δ|) per vortice): così si leggono i vortici sul mare e i continenti dall'orbita.
  // La scala è scritta in opzioni.scalaTemperatura (K) per la legenda di strumenti.js.
  function scalaFalsi(lon, lat) {
    if (!tSup) return; const D = Math.max(2 * stato.quota, (Math.PI * R) / tSup.H), W = tSup.W, H = tSup.H; let a = Infinity, b = -Infinity;
    for (let j = 0; j < H; j++) { const la = (0.5 - (j + 0.5) / H) * Math.PI; if (Math.abs(la - lat) * R > D + (Math.PI * R) / H) continue;
      for (let i = 0; i < W; i++) { const lo = ((i + 0.5) / W - 0.5) * 2 * Math.PI, c = Math.sin(lat) * Math.sin(la) + Math.cos(lat) * Math.cos(la) * Math.cos(lo - lon); if (Math.acos(Math.max(-1, Math.min(1, c))) * R > D + (Math.PI * R) / H) continue; const x = tSup.T[j * W + i]; if (x < a) a = x; if (x > b) b = x; } }
    if (!(a <= b)) { a = tSup.min; b = tSup.max; } let A = 0; for (let i = 0; i < vN; i++) A = Math.max(A, Math.hypot(vB[4 * i + 2], vB[4 * i + 3]) * (vA[4 * i + 2] * Math.min(Math.abs(vB[4 * i + 1]), 2) + Math.hypot(vC[4 * i], vC[4 * i + 1])));
    scalaT = [a - A, b + A]; N.opzioni.scalaTemperatura = { min: Tref + scalaT[0], max: Tref + scalaT[1] };
  }
  function preparaMeteo(t = 0) {
    const m = S0?.cl?.meteo; if (!m || !m.nuvole || !aria) return; const st = Array.isArray(m.stagioni) && m.stagioni.length > 1 ? m.stagioni : null;
    const x = st ? stagione(t) * st.length - 0.5 : 0; if (meteoTex && Math.abs(x - meteoStagione) < 0.04) return; meteoStagione = x;
    meteoH = m.H; const n = m.W * m.H, dati = new Float32Array(4 * n), i0 = st ? ((Math.floor(x) % st.length) + st.length) % st.length : 0, i1 = st ? (i0 + 1) % st.length : 0, f = st ? x - Math.floor(x) : 0, A = st ? st[i0] : m, B = st ? st[i1] : m; let somma = 0;
    // (in alfa la TEMPERATURA DELLA SUPERFICIE per i falsi colori, meno quella di riferimento del pianeta, perché i 16 bit bastino
    // anche a un mare che varia di decimi di grado: sul mare quella di mare.js, sulla terra quella di meteo.js della stagione,
    // pesate con la parte bagnata della cella)
    const Tm = S0.mare?.esiste ? S0.mare.temperatura : null, mW = S0.mare?.W, mH = S0.mare?.H, TA = A.temperatura || m.temperatura, TB = B.temperatura || m.temperatura; let tMin = Infinity, tMax = -Infinity;
    for (let k = 0; k < n; k++) { dati[4 * k] = A.nuvole[k] * (1 - f) + B.nuvole[k] * f; dati[4 * k + 1] = A.u[k] * (1 - f) + B.u[k] * f; dati[4 * k + 2] = A.v[k] * (1 - f) + B.v[k] * f; somma += dati[4 * k];
      const i = k % m.W, j = (k - i) / m.W, Tl = TA ? TA[k] * (1 - f) + TB[k] * f : Tref, b = Tm ? Math.min(1, Math.max(0, m.bagnato ? m.bagnato[k] : 0)) : 0;
      let Ts = Tl; if (b > 0) { const x = ((i + 0.5) / m.W) * mW - 0.5, y = Math.min(mH - 1.001, Math.max(0, ((j + 0.5) / m.H) * mH - 0.5)), x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, q = (a, c) => Tm[c * mW + (((a % mW) + mW) % mW)];
        Ts = b * ((q(x0, y0) * (1 - u) + q(x0 + 1, y0) * u) * (1 - v) + (q(x0, y0 + 1) * (1 - u) + q(x0 + 1, y0 + 1) * u) * v) + (1 - b) * Tl; }
      dati[4 * k + 3] = Ts - Tref; tMin = Math.min(tMin, Ts - Tref); tMax = Math.max(tMax, Ts - Tref); }
    tSup = { T: Float32Array.from({ length: n }, (_, k) => dati[4 * k + 3]), W: m.W, H: m.H, min: tMin, max: tMax };
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
  const u9 = new Float32Array(9);
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
      const [lon, lat] = lonLat(stato.occhioTondo); stato.lon = lon; stato.lat = lat; aggiornaOnde(lon, lat, S.t); aggiornaTessereOnde(S); aggiornaVortici(lon, lat, S.t); if (falsiAccesi()) scalaFalsi(lon, lat); aggiornaFine(S);
      const vs = N.tra(corpoPianeta, corpoStella, S.t); stato.dStella = V.lungo(vs); stato.sole = V.norma(vs); stato.E = Lstella() / (4 * Math.PI * stato.dStella ** 2);
      // quanta luce c'è dove si è: in orbita quella del giorno; vicino al suolo quella del posto (di notte l'occhio si apre)
      const sole = V.tv(A, stato.sole), mu = V.scal(V.norma(stato.occhioCorpo), sole), giorno = Math.max(0, Math.min(1, (mu + 0.12) / 0.3)), vicino = Math.max(0, Math.min(1, 1 - stato.quota / (0.25 * R)));
      // la luce che l'occhio chiede: quella della stella qui, meno di notte vicino al suolo (se si è lontanissimi dal pianeta non si chiede niente)
      if (V.lungo(stato.occhioCorpo) < 400 * R) S.proponiLuce(stato.E * (1 - vicino * (1 - Math.max(0.01, giorno))));
      // IL BIANCO DEL LUOGO (nucleo.js, OCCHIO): il colore della luce su un piano orizzontale dove sta l'occhio — la stella
      // passata dall'aria sopra di lui (Chapman, come nel frammento) più la luce diffusa di lì, π·Ψ (la tabella: la radianza
      // media del campo diffuso, presa uguale in tutte le direzioni). In orbita è la stella; sul fondo di un'aria spessa è
      // la luce arrossata e quella blu del cielo: chi sta lì si adatta a quella (prima: sempre alla stella fuori dall'aria,
      // e sotto 34 bar il suolo usciva rosso pieno).
      if (aria && tabCPU && V.lungo(stato.occhioCorpo) < 400 * R) { const ro = V.lungo(stato.occhioTondo), so = V.norma(tondo(sole)), mus = (stato.occhioTondo[0] * so[0] + stato.occhioTondo[1] * so[1] + stato.occhioTondo[2] * so[2]) / ro;
        const x = Math.max(0, Math.min(30.999, (Math.max(-1, Math.min(1, mus)) * 0.5 + 0.5) * 31)), y = Math.max(0, Math.min(30.999, Math.sqrt(Math.max(0, Math.min(1, (ro - R) / aria.cima))) * 31)), i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, M = tabCPU.ms;
        const psi = (c) => (M[4 * (j * 32 + i) + c] * (1 - u) + M[4 * (j * 32 + i + 1) + c] * u) * (1 - v) + (M[4 * ((j + 1) * 32 + i) + c] * (1 - u) + M[4 * ((j + 1) * 32 + i + 1) + c] * u) * v;
        const dir = luceDiretta(ro, mus), b = [0, 1, 2].map((c) => coloreLuce[c] * (Math.max(0, mus) * dir[c] + Math.PI * psi(c)));
        if (b[0] + b[1] + b[2] > 1e-6 * (coloreLuce[0] + coloreLuce[1] + coloreLuce[2])) S.proponiBianco(b); }
    },
    disegna(S, passata) {
      if (passata !== 'solido') return; const P_ = prgSuolo, u = P_.u, A = stato.A; gl.useProgram(P_.p); gl.bindVertexArray(griglia.vao); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc);
      gl.uniform3fv(u.u_sole, stato.sole); gl.uniform3fv(u.u_luce, coloreLuce); gl.uniform1f(u.u_orma, 1 / S.fuoco); gl.uniform1f(u.u_disco, discoStella());
      S.lega(13, texCielo, u.u_cieloT); S.lega(14, texMS, u.u_ms);
      impostaAria(u); impostaNuvole(u, S);
      { const At = V.trasposta(A), M = At.slice(); for (let j = 0; j < 3; j++) M[3 + j] /= schiaccia; gl.uniformMatrix3fv(u.u_tondo, false, [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]]); gl.uniform3f(u.u_centro, stato.versoC[0], stato.versoC[1], stato.versoC[2]); const sc = V.norma(tondo(V.mv(At, stato.sole))); gl.uniform3f(u.u_soleC, sc[0], sc[1], sc[2]); }
      let tess = null, madre = null; const co = onde && onde.pronta && ondeTex && ondeQui ? onde : null, m = ondeQui;
      // (le onde: l'immagine a strati sull'unità 15, e quello che vale per tutte le pezze; poi, pezza per pezza, il suo spostamento)
      const cM = new Float32Array(16), cS = new Float32Array(16), cO = new Float32Array(8);
      if (co) { gl.activeTexture(gl.TEXTURE15); gl.bindTexture(gl.TEXTURE_2D_ARRAY, ondeTex); gl.uniform1i(u.u_ondeT, 15); for (const T of co.C) { const c = Math.cos(T.angolo) / T.L, sn = Math.sin(T.angolo) / T.L; cM.set([c, sn, -sn, c], 4 * T.c); cS.set([T.mss, 4 * T.sS, 4 * T.sH, T.L], 4 * T.c); }
        gl.uniform4fv(u.u_cM, cM); gl.uniform4fv(u.u_cS, cS); }
      gl.uniform1f(u.u_ondeSi, co ? 1 : 0); gl.uniform4fv(u.u_cAtt, ondeAttive); gl.uniform1i(u.u_ondeT, 15);
      gl.uniform1i(u.u_nv, vN); if (vN) { gl.uniform4fv(u.u_vA, vA); gl.uniform4fv(u.u_vB, vB); gl.uniform4fv(u.u_vC, vC); } gl.uniform1f(u.u_Lm, vLm);
      gl.uniform3f(u.u_falsi, falsiAccesi() ? 1 : 0, scalaT[0], scalaT[1]); // (sempre: lasciata a 0 leggerebbe l'unità delle quote, di un altro tipo)
      const [hAria, hMare] = strati(m ? m.U : 0, stato.lat || 0), coda = co ? co.mssCoda : 0, libero = m?.P ? m.P.calma : 1;
      // (il suolo fine: c'è, e c'è la tessera su cui sta? allora le pezze hanno il buco e la finestra si disegna dopo)
      const FF = fine.attiva && fine.tex && fine.fin?.fin ? fine.fin : null, FT = fine.tex; gl.uniform4f(u.u_fine, 0, 0, 0, 0); gl.uniform4f(u.u_fineG, -9, -9, 0, 0); let toccava = false; // («fine», nel giro qui sotto, è l'increspatura)
      for (const z of lista) {
        const t = z.t;
        if (t !== tess) { tess = t; madre = t.L > 0 ? tessere.get(chiave(t.L - 1, t.tx >> 2, t.ty >> 2)) : null; if (madre && !madre.pronta) madre = null; const m2 = madre || t;
          S.lega(0, t.alt, u.u_alt); S.lega(1, t.pend, u.u_pend); S.lega(2, t.terra, u.u_terra); S.lega(3, t.acqua || trasparente, u.u_acqua); S.lega(4, t.oriz1, u.u_oriz1); S.lega(10, t.oriz2, u.u_oriz2);
          S.lega(6, m2.alt, u.u_altM); S.lega(7, m2.pend, u.u_pendM); S.lega(8, m2.terra, u.u_terraM); S.lega(9, m2.acqua || trasparente, u.u_acquaM); S.lega(11, m2.oriz1, u.u_oriz1M); S.lega(12, m2.oriz2, u.u_oriz2M); gl.uniform4f(u.u_espo, espo(S), t.acqua ? 1 : 0, m2.acqua ? 1 : 0, (S.luceGalassia || 0) / 4 / stato.E); // (la stessa luce di notte di u_notte)
          // (il livello L serve fino alla distanza D; negli ultimi due quinti di D i dati sfumano in quelli della madre)
          const D = madre ? distanzaLivello(t.L, S) : 0; gl.uniform2f(u.u_sfuma, 0.55 * D, 0.95 * D); if (madre) madre.uso = uso; }
        // il centro della pezza rispetto all'occhio, in doppia precisione; poi i tre assi della pezza negli assi del mondo
        const sl = Math.sin(z.lon0), cl = Math.cos(z.lon0), sf = Math.sin(z.lat0), cf = Math.cos(z.lat0), c0 = z.c0, E = [-sl, 0, -cl], Nn = [-sf * cl, cf, sf * sl];
        const C = V.mv(A, [c0[0] * R, c0[1] * R * schiaccia, c0[2] * R]); gl.uniform3f(u.u_C, C[0] + stato.versoC[0], C[1] + stato.versoC[1], C[2] + stato.versoC[2]);
        const sq = (v) => V.mv(A, [v[0], v[1] * schiaccia, v[2]]), nq = (v) => V.mv(A, [v[0], v[1] / schiaccia, v[2]]);
        gl.uniformMatrix3fv(u.u_base, false, mat3([sq(E), sq(Nn), sq(c0)])); gl.uniformMatrix3fv(u.u_normali, false, mat3([nq(E), nq(Nn), nq(c0)]));
        gl.uniform4f(u.u_geo, z.dLon, z.dLat, z.lat0, R);
        if (t.L >= 0) { const n = 4 ** t.L; gl.uniform4f(u.u_tess, z.u0 * n - t.tx, z.v0 * n - t.ty, z.du * n, z.du * n); if (madre) { const nm = n / 4; gl.uniform4f(u.u_tessM, z.u0 * nm - madre.tx, z.v0 * nm - madre.ty, z.du * nm, z.du * nm); } } else gl.uniform4f(u.u_tess, 0, 0, 0, 0);
        const passo = (R * z.dLat) / MY; gl.uniform3f(u.u_orlo, Math.max(2, passo * 3 + (z.d < 3 ? R * 0.02 : 0)), O.rilievo, 0);
        // le onde di questa pezza: dove sta il suo centro nelle tessere e nei rumori del vento (la parte frazionaria, contata in
        // doppia precisione; dentro la pezza conta lo scarto in metri, v_en)
        let dl0 = z.lon0 - lonRif; dl0 -= 2 * Math.PI * Math.round(dl0 / (2 * Math.PI)); const X0 = R * cf * dl0, Y0 = R * z.lat0;
        if (co && t.haAcqua) { for (const T of co.C) { const c = Math.cos(T.angolo) / T.L, sn = Math.sin(T.angolo) / T.L, x = c * X0 + sn * Y0, y = -sn * X0 + c * Y0; cO[2 * T.c] = x - 4096 * Math.floor(x / 4096) + 0.5 / CASCATA.N; cO[2 * T.c + 1] = y - 4096 * Math.floor(y / 4096) + 0.5 / CASCATA.N; } gl.uniform2fv(u.u_cO, cO); }
        { const mo = (x, p) => x - p * Math.floor(x / p), lr = 3 * hAria, ll = 2.5 * hMare; gl.uniform4f(u.u_aria, hAria, hMare, mo(X0 / lr, 4096), mo(Y0 / lr, 4096)); gl.uniform2f(u.u_lang, mo(X0 / ll, 4096), mo(Y0 / ll, 4096)); }
        gl.uniform4f(u.u_mare, m ? m.U : 0, coda, libero, dl0 * sf); gl.uniform1f(u.u_lon0, dl0);
        // (la pezza tocca la finestra del suolo fine? allora al posto della madre le immagini della finestra, e niente sfumatura:
        // queste pezze stanno sotto l'occhio, ben più vicine di dove la madre comincia)
        if (FF) { let dl = z.lon0 - FF.lonA - FF.dLon / 2; dl -= 2 * Math.PI * Math.round(dl / (2 * Math.PI)); const cx = 0.5 + dl / FF.dLon, cy = 0.5 + (z.lat0 - FF.latA - FF.dLat / 2) / FF.dLat, sx = z.dLon / FF.dLon, sy = z.dLat / FF.dLat, tocca = Math.abs(cx - 0.5) < 0.5 + sx / 2 && Math.abs(cy - 0.5) < 0.5 + sy / 2;
          if (tocca) { S.lega(7, FT.G, u.u_pendM); S.lega(8, FT.A || neutro, u.u_terraM); gl.uniform2f(u.u_sfuma, 0, 0); const md = FT.A ? FF.media : [1, 1, 1]; gl.uniform3f(u.u_fineMedia, md[0], md[1], md[2]); gl.uniform4f(u.u_fine, 1, FF.n, 0, 0); gl.uniform4f(u.u_fineG, cx, cy, sx, sy); tess = null; toccava = true; }
          else if (toccava) { gl.uniform4f(u.u_fine, 0, 0, 0, 0); gl.uniform4f(u.u_fineG, -9, -9, 0, 0); toccava = false; } }
        gl.drawElements(gl.TRIANGLES, griglia.n, gl.UNSIGNED_SHORT, 0);
      }
      gl.disable(gl.CULL_FACE); gl.bindVertexArray(null);
    },
  };
  // (il rumore delle nuvole è trascinato dal vento per un periodo e poi ricomincia sfumando: il periodo dura almeno sei
  // secondi di chi guarda, anche quando il tempo corre)
  function impostaNuvole(u, S) {
    const periodo = Math.max(6 * 3600, Math.abs(N.tempo.velocita) * 6); S.lega(5, meteoTex || trasparente, u.u_meteo);
    const hn = aria ? Math.min(0.7 * aria.H, 9000) : 0; gl.uniform4f(u.u_nuv, hn, S.t % (periodo * 64), periodo, aria && meteoTex && O.nuvole ? O.nuvole : 0);
    gl.uniform2f(u.u_nuvL, (Math.PI * (R + hn)) / meteoH, R + hn); gl.uniform1f(u.u_orma, 1 / S.fuoco); // (la cella della carta di meteo.js, in metri sullo strato)
    gl.uniform1f(u.u_notte, (S.luceGalassia || 0) / 4 / stato.E);
  }
  // (dove comincia l'aria che conta: la quota sopra cui lo spessore ottico che resta, anche preso di striscio — per il
  // fattore di Chapman all'orizzonte, √(πR/2H) —, è sotto 10⁻³: ciò che sta sopra cambia la luce di meno di un millesimo,
  // molto sotto la soglia dell'occhio di test_vista; la si prende per il gas e per la foschia, e al più la cima)
  const cimaOttica = !aria ? 0 : Math.min(aria.cima, Math.max(...[[Math.max(...aria.betaR), aria.H], [1.1 * aria.betaM, aria.HM]].map(([b, Hs]) => Hs * Math.log(Math.max(1, (b * Hs * Math.sqrt((Math.PI * R) / (2 * Hs))) / 1e-3))), 0));
  function impostaAria(u) {
    if (u.u_cima) gl.uniform1f(u.u_cima, cimaOttica);
    if (u.u_falsiA) gl.uniform1f(u.u_falsiA, falsiAccesi() ? 1 : 0);
    if (aria) { gl.uniform4f(u.u_atm, R, aria.H, aria.HM, aria.cima); gl.uniform3fv(u.u_betaR, aria.betaR); gl.uniform4f(u.u_betaM, aria.betaM, 0.76, 0, 0); }
    else { gl.uniform4f(u.u_atm, R, 1, 1, 0); gl.uniform3f(u.u_betaR, 0, 0, 0); gl.uniform4f(u.u_betaM, 0, 0, 0, 0); }
  }

  // ---------- lo strato dell'aria e delle nuvole
  // A CAMERA FERMA (con N.vista.accumulo): l'aria si calcola una volta sola. Il colore è scena·Tot + Add (vedi F_ARIA):
  // al primo fotogramma fermo la passata scrive Tot e Add sulle immagini sue (con la distanza della scena per cui valgono),
  // ai seguenti la stessa passata compone con la scena di adesso, punto per punto, SOLO dove dietro c'è ancora la stessa
  // distanza (entro la precisione della profondità, «2 parti su un milione», e dell'immagine che la tiene); dove la scena
  // è cambiata rifà il conto. È lo stesso conto di prima (gli stessi passi, a metà di ogni tratto), non una media: qui la
  // media di passi sfasati, provata, convergeva peggio dei passi a metà (l'aria è liscia) e in moto non faceva risparmiare.
  // In moto, col tempo che corre più di un secondo per fotogramma, o quando la scena del pianeta è cambiata (una tessera
  // arrivata, le pezze rifatte), si calcola tutto ogni volta, come senza accumulo, e al fotogramma fermo dopo si rifanno
  // Add e Tot. (Prima la composizione non guardava la distanza: Add e Tot fatti al primo fotogramma fermo valevano per
  // sempre, e se quel fotogramma era sbagliato — le immagini nuove legate sull'unità che il programma leggeva, il disegno
  // rifiutato, Tot = 0 — l'aria restava nera finché non ci si muoveva: il 3D nero del punto a caso.)
  const preciso = !!gl.getExtension('EXT_color_buffer_float'), FORMATO_AT = preciso ? 'rgba32f' : 'rgba16f', SCARTO_AT = Math.max(4e-6, 2 * (preciso ? 2 ** -23 : 2 ** -10));
  let acA = null, primaRif = null, primaIndice = -2, primaE0 = 1, pronte = false, firmaAT = '';
  // la camera è dov'era al fotogramma prima (negli assi del corpo, che girano con lui) e il mondo è quasi fermo?
  function ferma(S) { const o = stato.occhioCorpo, a = stato.assiCorpo, p = primaRif, r = V.lungo(o) + 1e-30; let si = !!p && S.indice === primaIndice + 1 && Math.abs(S.dt) <= 1 && p.tan === S.tanY && p.W === S.W && p.H === S.H;
    if (si) { for (let i = 0; i < 3; i++) if (Math.abs(o[i] - p.o[i]) > 1e-9 * r) si = false; for (let i = 0; i < 9; i++) if (Math.abs(a[i] - p.a[i]) > 1e-7) si = false; }
    primaRif = { o: o.slice(), a: a.slice(), tan: S.tanY, W: S.W, H: S.H }; primaIndice = S.indice; return si; }
  const cielo3d = {
    libera() { if (acA) { gl.deleteTexture(acA.add); gl.deleteTexture(acA.tot); gl.deleteFramebuffer(acA.f); acA = null; } pronte = false; },
    nome: 'aria',
    get pronte() { return pronte; }, // (per le prove)
    dopo(S, da) {
      if (!aria) return false; const acc = accumuloAttivo(N), firma = `${arrivate}|${pezze}|${base.pronta}`, fermo = acc && ferma(S) && firma === firmaAT, dove = gl.getParameter(gl.FRAMEBUFFER_BINDING); firmaAT = firma;
      const W = S.W, H = S.H, rifai = fermo && !pronte;
      // (le immagini di Add e Tot si fanno PRIMA di legare quelle che il programma legge)
      if (rifai && (!acA || acA.W !== W || acA.H !== H)) { if (acA) { gl.deleteTexture(acA.add); gl.deleteTexture(acA.tot); gl.deleteFramebuffer(acA.f); } const add = N.immagine(W, H, FORMATO_AT, null, { filtro: gl.NEAREST }), tot = N.immagine(W, H, FORMATO_AT, null, { filtro: gl.NEAREST }), f = N.telaio(add, null); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, tot, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, dove); acA = { W, H, add, tot, f }; }
      if (!prgAria || prgAria.n !== O.passiAria) { if (prgAria) gl.deleteProgram(prgAria.p); prgAria = { ...N.programma(N.V_SCHERMO, F_ARIA(O.passiAria)), n: O.passiAria }; } const u = prgAria.u, A = stato.A, At = V.trasposta(A); gl.useProgram(prgAria.p);
      S.lega(0, da.col, u.u_col); S.lega(1, da.prof, u.u_prof); S.lega(2, texMS, u.u_ms); S.lega(3, texCielo, u.u_cieloT); impostaNuvole(u, S);
      const componi = fermo && pronte; S.lega(6, componi ? acA.add : trasparente, u.u_cAdd); S.lega(7, componi ? acA.tot : trasparente, u.u_cTot); gl.uniform2f(u.u_cK, componi ? primaE0 / S.E0 : 1, SCARTO_AT);
      const o = stato.occhioTondo; gl.uniform3f(u.u_occhio, o[0], o[1], o[2]);
      // dagli assi dell'occhio allo spazio tondo del corpo: (1/schiacciamento sull'asse) · Aᵀ · assi
      const M = V.mm(At, S.assi); for (let j = 0; j < 3; j++) M[3 + j] /= schiaccia; gl.uniformMatrix3fv(u.u_raggi, false, [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]]);
      const s = V.norma(tondo(V.mv(At, stato.sole))); gl.uniform3f(u.u_soleC, s[0], s[1], s[2]);
      gl.uniform4f(u.u_cam, S.tanX, S.tanY, S.fc, espo(S)); gl.uniform3f(u.u_E, Math.PI * coloreLuce[0], Math.PI * coloreLuce[1], Math.PI * coloreLuce[2]);
      impostaAria(u); gl.uniform3f(u.u_sfasa, 0, 0, componi ? 2 : rifai ? 1 : 0); cielo3d.modo = componi ? 'componi' : rifai ? 'rifai' : 'tutto'; // (per le prove)
      if (!fermo) { pronte = false; S.schermo(); return true; }
      if (componi) { S.schermo(); return true; } // (Add è una luce: la si riporta all'E0 di adesso, u_cK.x)
      gl.bindFramebuffer(gl.FRAMEBUFFER, acA.f); gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]); gl.viewport(0, 0, W, H); S.schermo(); gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
      pronte = true; primaE0 = S.E0;
      // e subito la composizione di questo fotogramma, con la stessa passata
      gl.bindFramebuffer(gl.FRAMEBUFFER, dove); gl.viewport(0, 0, W, H); S.lega(6, acA.add, u.u_cAdd); S.lega(7, acA.tot, u.u_cTot); gl.uniform2f(u.u_cK, 1, SCARTO_AT); gl.uniform3f(u.u_sfasa, 0, 0, 2); S.schermo(); return true;
    },
  };

  // ---------- lo strato dei corpi lontani: la stella, le lune, le stelle di fondo, gli anelli
  const stelle = (() => { const n = 2600, d = new Float32Array(4 * n), u = serie('mondo3d', 'stelle di fondo'); let c = 0; const r = () => u(c++); // (una serie con nome, non un generatore aritmetico)
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
        gl.uniformMatrix4fv(u.u_proj, false, S.proj); gl.uniformMatrix3fv(u.u_vista, false, S.vista); gl.uniform1f(u.u_fc, S.fc); gl.uniform3fv(u.u_sole, stato.sole); gl.uniform3fv(u.u_luce, coloreLuce); gl.uniform1f(u.u_espo, espo(S)); gl.uniform1f(u.u_notte, (S.luceGalassia || 0) / 4 / stato.E);
        gl.uniform4f(u.u_asse, 0, 1, 0, 0); gl.uniform2f(u.u_minimo, (1.6 * S.tanY * 2) / S.H, 0); gl.uniform4f(u.u_ombra, stato.versoC[0], stato.versoC[1], stato.versoC[2], R);
        const sfera = (c, raggio, tinta, brilla) => { const v = S.versoCorpo(c); gl.uniform4f(u.u_sfera, v[0], v[1], v[2], raggio); gl.uniform4f(u.u_tinta, tinta[0], tinta[1], tinta[2], brilla); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
        // la stella: la sua superficie è (distanza / raggio)² volte più luminosa di un foglio bianco che illumina
        sfera(corpoStella, raggioStella, nero, Math.min(6.5e4, ((P.aM || 1.5e11) / raggioStella) ** 2)); // (al più quanto l'immagine a 16 bit tiene)
        for (const l of lune) sfera(l.corpo, l.L.raggioM, l.tinta, 0);
        gl.bindVertexArray(null); return;
      }
      if (passata === 'velato' && anello) anello.disegna(S, { centro: stato.versoC, A: stato.A, sole: stato.sole, luce: coloreLuce, espo: espo(S), schiaccia });
    },
  };
  if (!corpi) N.aggiungi(lontani); N.aggiungi(suolo); N.aggiungi(cielo3d);

  function libera() {
    for (const f of fili) f.w.terminate(); fili.length = 0; coda.length = 0;
    for (const t of [...tessere.values()]) if (t.pronta) butta(t); tessere.clear(); if (filoAria) { filoAria.terminate(); filoAria = null; } gl.deleteTexture(texMS); gl.deleteTexture(texCielo); if (ondeTex) gl.deleteTexture(ondeTex); ondeTex = null; liberaFine();
    for (const s of [lontani, suolo, cielo3d]) N.togli(s);
    if (corpi) for (const k of Object.keys(terreno)) corpoPianeta[k] = null;
  }
  return {
    corpo: corpoPianeta, stella: corpoStella, lune, aria, cielo3d, coloreLuce, anello: !!anello, opzioni: O, libera, stagione, get ariaFine() { return ariaFine; }, // (ariaFine: le tabelle fini dell'aria sono arrivate)
    // che cosa c'è in un punto: quota del terreno (m), se c'è acqua e quanto è profonda
    info: (lon, lat) => { const [h, l] = leggi(lon, lat); return { quota: h, acqua: l > h, profondita: l > h ? l - h : 0, livello: l }; },
    pronto: () => base.pronta && !!tessere.get(chiave(0, 0, 0))?.pronta,
    // il suolo fine che si vede ora (per le prove: la finestra di suolo.js con la sua griglia, e quanto è costata)
    suoloFine: () => { const F = fine.fin; if (!fine.attiva || !F?.fin) return null; const f = F.fin; return { lato: F.lato, N: f.N, h: f.h, gx0: f.gx0, gy0: f.gy0, livello: f.padre.livello, I: f.padre.I, J: f.padre.J, lon: F.lon, lat: F.lat, rms: F.rms, Z: Array.from(f.campo.Z), ms: fine.ms, msTinta: fine.msTinta, quante: fine.quante, chiaveTratto: f.tratto.chiave }; },
    statistiche: () => { let pronte = 0; for (const t of tessere.values()) if (t.pronta) pronte++; const livelli = {}; for (const z of lista) { const k = `${z.t.L}`; livelli[k] = (livelli[k] || 0) + 1; } return { pezze, livelli, triangoli, tessere: pronte, inAttesa: coda.length + fili.filter((f) => !f.libero).length, richieste, arrivate, msPerTessera: arrivate ? msTessere / arrivate : 0, memoriaMB: (pronte * (TWB * THB * 8 * 2 + TW * TH * (4 + 4 + 4 + 8))) / 1e6, nuvoleMedie, suoloFine: fine.attiva ? { lato: fine.fin?.lato, msCalcolo: fine.ms, msTinta: fine.msTinta, quante: fine.quante } : null, suoloFineStato: { quota: stato.quota, largo: fine.largo, campi: fine.campi.size, chiesti: fine.chiesti.size, inCorso: fine.inCorso, finestra: !!fine.fin?.fin, attiva: fine.attiva, tex: !!fine.tex, quante: fine.quante }, onde: ondeQui ? { H: ondeQui.H, T: ondeQui.T, vento: ondeQui.U, L0: ondeQui.L0, Hlungo: ondeQui.Hlungo, Tlungo: ondeQui.Tlungo, tessere: !!(onde && onde.pronta && ondeTex), ms: nOnde ? msOnde / nOnde : 0, msSomma: msOnde, n: nOnde, attive: Array.from(ondeAttive) } : null, vortici: vort ? { quanti: vN, ms: msVortici, Lm: vLm, c1: vort.c1, primo: vN ? { Ls: vA[2], U: vB[0], theta: vB[1] } : null } : null }; },
  };
}
