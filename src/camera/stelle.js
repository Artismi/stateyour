// stelle.js — le stelle calcolate dalla loro struttura, al posto delle formule L = M⁴, R = M^0,8 di leggi.js.
//
// Una stella è una palla di gas che sta ferma perché tre bilanci tornano insieme:
//   1. IL PESO: in ogni punto la pressione (gas + elettroni degeneri + luce) regge gli strati di sopra;
//   2. IL CALORE CHE ESCE: dove basta la luce, i fotoni diffondono verso l'esterno frenati dall'opacità; dove non
//      basta (il gradiente supererebbe quello adiabatico: criterio di Schwarzschild) il gas ribolle e porta lui il calore;
//   3. IL CALORE CHE NASCE: al centro i protoni attraversano la barriera di Coulomb per effetto tunnel e si fondono
//      (catena protone-protone, ciclo CNO); a regime, quel che nasce è quel che esce.
// Di qui escono, per ogni massa e composizione: luminosità, raggio, temperatura della superficie e del centro, quanto
// vive, chi porta il calore dentro, la massa sotto cui l'idrogeno non si accende, che cosa resta alla fine.
//
// IL METODO (leggero: una tabella calcolata al primo uso — 4 metallicità × 25 masse × 8 età, ~300 ms — poi si
// interpola in microsecondi). Non si integrano le quattro equazioni
// della struttura punto per punto: si sceglie una STRUTTURA DI PROVA con pochi numeri liberi e li si fissa imponendo
// i bilanci in forma integrale.
//   · La struttura: dove il calore lo porta la luce, il modello standard di Eddington (P ∝ T⁴, cioè il polìtropo di
//     Lane-Emden n = 3), con la densità che segue il peso molecolare guscio per guscio (ρ ∝ μ·T³: così, quando al
//     centro l'idrogeno diventa elio, il centro si addensa); fuori, da un punto di raccordo in poi, un involucro
//     adiabatico (P ∝ ρ^5/3, polìtropo n = 3/2: la zona convettiva). L'equilibrio idrostatico è integrato
//     numericamente (Runge-Kutta 4) per ogni profilo di composizione. Due numeri liberi: il raggio R e il raccordo
//     c = T(raccordo)/T(centro) (c = 1: tutta convettiva; c = 0: niente involucro convettivo).
//   · Il bilancio del TRASPORTO: l'equazione della diffusione dei fotoni, dP_rad/dP = κ·l/(4πcG·m), integrata su
//     tutta la zona radiativa: il salto di pressione di radiazione della struttura deve valere ∫κ·(l/m)·dP/(4πcG),
//     con l(m) l'energia nucleare prodotta dentro m. È «energia prodotta = energia che esce».
//   · Il bilancio della SUPERFICIE: la zona convettiva è adiabatica, quindi la sua entropia è quella della fotosfera
//     (dove la profondità ottica è 2/3: P = 2g/3κ). L'entropia si calcola dai principi (Sackur-Tetrode: atomi H e
//     He e molecole H₂ in equilibrio di dissociazione in superficie; protoni, nuclei di elio ed elettroni di Fermi
//     dentro): così le zone di ionizzazione sono attraversate senza integrarle. In cima c'è uno strato dove la
//     convezione è inefficiente e l'entropia salta (teoria della lunghezza di mescolamento, stimata in una zona).
//   · La VITA: l'idrogeno cala guscio per guscio al ritmo delle reazioni; le zone convettive si mescolano; il nucleo
//     convettivo non rientra dove il gas sopra è più leggero (Ledoux); la struttura si ricalcola a ogni passo (8
//     passi fino all'1% dell'idrogeno al centro: lì finisce la sequenza principale).
//
// CHE COSA EMERGE (non è scritto da nessuna parte: esce dai bilanci e dalle costanti G, c, ħ, k_B, σ, mₑ, m_p, α):
//   · L, R, T, T_centro, la vita, in funzione di massa, metalli ed età; la pendenza massa–luminosità (≈ 4);
//   · la sezione d'urto di Thomson e l'opacità di frenamento (Kramers, media di Rosseland calcolata dalle costanti);
//   · il picco di Gamow (integrato numericamente) e con lui la ripidezza delle reazioni; lo schermo degli elettroni;
//   · il gas di elettroni a qualunque degenerazione (integrali di Fermi-Dirac calcolati numericamente);
//   · chi è tutta convettiva (sotto ≈ 0,55 M☉), chi ha il nucleo convettivo (dove vince il CNO), chi perde
//     l'involucro convettivo (sopra ≈ 1,1 M☉);
//   · la MASSA MINIMA (0,076 M☉ con i metalli del Sole, 0,094 con cento volte meno): sotto, stringendosi, la stella
//     diventa degenere prima che l'idrogeno pareggi le perdite; e come si raffredda una nana bruna;
//   · il Sole che cresce di luminosità invecchiando; le stelle povere di metalli più calde e luminose;
//   · il nucleo di elio che resta, e con lui il confine nana bianca / supernova (dove supera la massa di
//     Chandrasekhar: ≈ 10 M☉) e la massa dei buchi neri.
//
// DATI DI LABORATORIO E LEGGI MISURATE (usati così, non derivati; i numeri sono in DATI):
//   · i fattori astrofisici delle due reazioni lente: p+p→d, S(0) = 4,01·10⁻²² keV·b (calcolato dalla teoria debole:
//     è troppo lenta per misurarla), e ¹⁴N(p,γ)¹⁵O, S(0) = 1,66 keV·b (misurato, LUNA), con le loro derivate
//     (Adelberger et al. 2011, «Solar fusion cross sections II», Rev. Mod. Phys. 83, 195, tabella I);
//   · l'energia di 4 ¹H → ⁴He (26,731 MeV, dalle masse) e quella che portano via i neutrini (0,53 MeV nella catena
//     pp, 1,71 MeV nel ciclo CN);
//   · l'opacità di fotoionizzazione dei metalli: legge di Kramers, 4,34·10²⁵·Z(1+X)·ρ·T^-3,5 cm²/g diviso per il
//     fattore di ghigliottina t/g ∝ (ρ(1+X))^0,2 (Schwarzschild 1958; Carroll & Ostlie, cap. 9);
//   · l'opacità della fotosfera: ione H⁻, 2,5·10⁻³¹·(Z/0,02)·ρ^½·T⁹ cm²/g (Hansen, Kawaler & Trimble 2004; vale tra
//     3000 e 6000 K), e molecole, 10⁻⁸·ρ^⅔·T³ cm²/g (Bell & Lin 1994; è noto che sottostima tra 1500 e 3000 K);
//   · la molecola H₂: energia di legame 4,478 eV, temperature di rotazione 85,4 K e di vibrazione 6332 K;
//   · la composizione: il Sole alla nascita (X = 0,7155, Y = 0,2703, Z = 0,0142: Asplund et al. 2009), l'elio del
//     Big Bang (0,247), e quanta parte dei metalli è carbonio e azoto (il combustibile del ciclo CN);
//   · α = 1/137,036 (leggi.js ha la carica e, ma non ε₀);
//   · la massa delle nane bianche in funzione della massa iniziale (Cummings et al. 2018, ApJ 866, 21, relazione
//     con i modelli MIST: tre rette tra 0,83 e 7,2 M☉; fuori è estrapolata): dipende da quanta massa la stella
//     perde da gigante, cosa che qui non si calcola;
//   · il confine stella di neutroni / buco nero: nucleo di elio sopra 7 M☉ (dalle simulazioni di collasso e dal
//     fatto che non si vedono supernove da stelle sopra ≈ 20 M☉: Smartt 2015; Sukhbold et al. 2016). L'esplosione
//     non si sa ancora far emergere dai principi.
// PARAMETRI LIBERI (non misurati; scelti guardando il Sole, come fanno tutti i modelli solari con l'elio e la
// lunghezza di mescolamento):
//   · il coefficiente del fattore di ghigliottina: 3,29 invece dello 0,708 dei libri, TARATO perché il Sole a 4,57
//     miliardi di anni abbia la sua luminosità. Non corregge solo l'opacità: assorbe l'errore della struttura di
//     prova (nel Sole vero il centro è più caldo di quanto dà n = 3). Con 0,708 il Sole avrebbe 0,38 L☉;
//   · la lunghezza di mescolamento, 1,8 altezze di scala (il valore tipico dei modelli solari): decide quanto è
//     spesso l'involucro convettivo e, con lui, il raggio. Con 1,8 il Sole ha raggio 0,93 e 6000 K, ma un involucro
//     convettivo troppo sottile (0,07% della massa: quello vero è il 2,4%); con convezione perfetta (∞) l'involucro
//     viene giusto (2,9%) ma il raggio 0,80. Le due cose insieme questa struttura non le dà.
// SEMPLIFICAZIONI E CRITERI SCELTI:
//   · la zona radiativa è un polìtropo n = 3 anche dove il gradiente vero è diverso; per questo il nucleo radiativo
//     compare a 0,55 M☉ invece che a 0,35, e compare di colpo (un gradino del 30% in luminosità);
//   · della catena pp si contano l'energia e i neutrini del ramo I, a regime; del ciclo solo CN (non l'ossigeno);
//   · niente rotazione, campi, perdita di massa, sovrasconfinamento del nucleo convettivo, contrazione iniziale;
//   · la massa di un barione è m_p; gli elettroni non sono mai relativistici; niente correzioni di Coulomb;
//   · la MASSA MASSIMA è un criterio, non un muro: in un modello fermo la luminosità si avvicina al limite di
//     Eddington senza mai superarlo. Si prende la massa a cui, al centro, la pressione della luce uguaglia quella
//     del gas (≈ 137 M☉): oltre, la stella è tenuta insieme a stento. (stella() dà L/L_Eddington: 0,3 a 60 M☉.)
//   · la fine: è nana bianca se il nucleo di elio rimasto è sotto la massa di Chandrasekhar; la stella di neutroni
//     ha la massa di Chandrasekhar meno l'energia di legame (3/5·GM²/R); il buco nero ha la massa del nucleo di elio
//     (l'involucro di idrogeno si disperde);
//   · sotto la massa minima: nane brune che si raffreddano; sotto ≈ 1500 K la fotosfera qui descritta non vale più.
// CHE COSA NON TORNA (misurato nei test): le stelle tra 1,2 e 5 M☉ vengono troppo luminose (+25–80%), troppo
// piccole e calde (T +15–20%) e vivono circa la metà: è il prezzo della taratura sul Sole (l'opacità di Kramers
// vera, negli involucri, è più alta) e dell'assenza dei picchi di opacità. Il CNO supera il pp a 1,7 M☉ (non 1,3).
// Il Sole giovane è più debole del 17% (quello vero del 28%). Le giganti blu a fine sequenza si gonfiano troppo.
//
// La forma dei dati è quella di leggi.js: stella() → { L, R, T, vita, … }, fine() → { tipo, massa, raggio, B, supernova }.
import { COSTANTI, MSOLE, RSOLE, LSOLE, ANNO, etaUniverso, massaChandrasekhar, massaMassimaNeutroni, raggioNanaBianca, raggioNeutroni } from './leggi.js';

const K = COSTANTI;
export const ALFA = 1 / 137.036; // la costante di struttura fine (misurata): e²/(4πε₀) = α·ħ·c
const A_RAD = (4 * K.sigma) / K.c, MB = K.mp, MEV = 1e6 * K.e, KEVB = 1e3 * K.e * 1e-28, PI4 = 4 * Math.PI;
const E2 = ALFA * K.hbar * K.c; // e²/(4πε₀)
const SIGMA_T = ((8 * Math.PI) / 3) * (E2 / (K.me * K.c * K.c)) ** 2; // la sezione d'urto di Thomson

// ---------- I DATI: ciò che qui non si deriva (vedi l'intestazione)
export const DATI = {
  // fattori astrofisici S(0), S'(0), S''(0) (Adelberger et al. 2011, tabella I), in J·m², m², m²/J
  S11: [4.01e-22 * KEVB, 4.49e-24 * 1e-28, 0],
  S114: [1.66 * KEVB, -3.3e-3 * 1e-28, (4.4e-5 * 1e-28) / (1e3 * K.e)],
  Q4: 26.731 * MEV, nuPP: 2 * 0.265 * MEV, nuCNO: 1.71 * MEV, // 4 ¹H → ⁴He, e ciò che si portano via i neutrini
  Cbf: 4.34e21, // Kramers per la fotoionizzazione dei metalli (m²/kg, con ρ in kg/m³)
  ghigliottina: [3.29, 0.2, 0.708], // il fattore di ghigliottina t/g = 3,29·(ρ(1+X))^0,2: PARAMETRO LIBERO, tarato sul Sole (nei libri: 0,708)
  Hmeno: 7.9e-34, molecole: 1e-11, // l'opacità della fotosfera: ione H⁻ e molecole (m²/kg)
  ZSOLE: 0.0142, YSOLE: 0.2703, YPRIMO: 0.247, // la composizione del Sole alla nascita e l'elio del Big Bang
  CN: 0.257, // quanto ¹⁴N (in massa, per unità di Z) quando il ciclo CN è a regime: 14·(C/12 + N/14) con la miscela solare
  H2: { D0: 4.478 * K.e, rot: 85.4, vib: 6332 }, // la molecola H₂: energia di legame, temperature di rotazione e vibrazione (K)
  alfaConv: 1.8, // la lunghezza di mescolamento, in altezze di scala di pressione: PARAMETRO LIBERO
  elioBucoNero: 7, // (masse solari) sopra, il nucleo di elio non esplode: resta un buco nero
  massaFinale: [[2.85, 0.08, 0.489], [3.6, 0.187, 0.184], [Infinity, 0.107, 0.471]], // nane bianche: M_f = a·M_i + b (Cummings et al. 2018)
};

// ---------- Lane-Emden: il polìtropo di indice n, integrato (Runge-Kutta 4). Serve per i controlli e per le costanti.
function laneEmden(n, h = 0.005) {
  let x = h, y = 1 - (x * x) / 6 + (n * x ** 4) / 120, z = -x / 3 + (n * x ** 3) / 30;
  const f = (x, y, z) => -Math.pow(Math.max(y, 0), n) - (2 * z) / x;
  for (;;) {
    const k1y = z, k1z = f(x, y, z), k2y = z + 0.5 * h * k1z, k2z = f(x + 0.5 * h, y + 0.5 * h * k1y, k2y);
    const k3y = z + 0.5 * h * k2z, k3z = f(x + 0.5 * h, y + 0.5 * h * k2y, k3y), k4y = z + h * k3z, k4z = f(x + h, y + h * k3y, k4y);
    const y1 = y + (h / 6) * (k1y + 2 * k2y + 2 * k3y + k4y), z1 = z + (h / 6) * (k1z + 2 * k2z + 2 * k3z + k4z);
    if (y1 <= 0) { const t = y / (y - y1), xi1 = x + t * h, d = z + t * (z1 - z); return { n, xi1, m1: -xi1 * xi1 * d }; }
    x += h; y = y1; z = z1;
  }
}

// ---------- LA STRUTTURA DI PROVA. Dentro (zona radiativa): il modello standard di Eddington, P ∝ T⁴ (polìtropo
// n = 3), ma con la densità che segue il peso molecolare guscio per guscio: ρ ∝ μ(m)·T³. Fuori, da dove
// T/T_c = c, un involucro adiabatico (P ∝ ρ^5/3: la zona convettiva). c = 1: tutta convettiva; c = 0: niente
// involucro. Si integra l'equilibrio idrostatico (Runge-Kutta 4) nelle variabili di Lane-Emden:
//   dθ/dξ = −μ̃·m̃/ξ²,  dm̃/dξ = ξ²·μ̃·θ³   (dentro);   ds/dξ = −(8ρ̃f/5P̃f)·m̃/ξ²,  dm̃/dξ = ξ²·ρ̃f·s^3/2   (fuori)
const NG = 32; // gusci di massa (uguali per tutte le stelle: la composizione vive lì), più fitti verso il centro
const QB = Float64Array.from({ length: NG + 1 }, (_, k) => (k / NG) ** 2);
const QC = Float64Array.from({ length: NG }, (_, k) => ((k + 0.5) / NG) ** 2);
const ZB = QB.map((q) => Math.cbrt(q * q)), ZC = QC.map((q) => Math.cbrt(q * q));
const CS = [0, 0.006, 0.012, 0.02, 0.03, 0.04, 0.055, 0.07, 0.09, 0.11, 0.135, 0.165, 0.2, 0.24, 0.29, 0.35, 0.42, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
const C_MIN = CS[1];
const HX = 0.1, TOL_MS = 1e-3, NP = 1200, IX = new Float64Array(NP), IM = new Float64Array(NP), IZ = new Float64Array(NP), IP = new Float64Array(NP), ID = new Float64Array(NP);
const CONTA = { valuta: 0, membri: 0 }; // quante strutture si sono valutate (per misurare)
function membro(mu, jc, ms0) { // mu: μ(guscio)/μ(centro), oppure null se la composizione è uniforme; ms0: m̃ totale di partenza
  const c = CS[jc], c3 = c * c * c, QN = QC[NG - 1], Q0 = QC[0]; let h = HX, ms = ms0, np = 0, nf = 0, xfit = 0, muf = 1, pf = 0, df = 0, g = 0;
  CONTA.membri++;
  // μ̃ alla massa m̃ (interpolata tra i centri dei gusci)
  const mut = (m) => { const q = m / ms; if (q <= Q0) return mu[0]; if (q >= QN) return mu[NG - 1]; while (QC[g + 1] < q) g++; while (QC[g] > q) g--; return mu[g] + ((q - QC[g]) / (QC[g + 1] - QC[g])) * (mu[g + 1] - mu[g]); };
  let msA = 0, gA = 0; // per la secante sulla massa totale (un autovalore: la composizione è data in frazione di massa)
  for (let passata = 0; passata < (mu ? 10 : 1); passata++) {
    IX[0] = 0; IM[0] = 0; IP[0] = 1; ID[0] = 1; np = 1; g = 0;
    let x = 0, th = 1, m = 0;
    if (c < 1) { // il nucleo radiativo, fino a θ = c
      x = HX; th = 1 - (x * x) / 6 + (x * x * x * x) / 40; m = (x * x * x) / 3 - x ** 5 / 10;
      for (;;) {
        h = x > 6 ? (HX * x) / 6 : HX;
        const u0 = mu ? mut(m) : 1, th3 = th * th * th; IX[np] = x; IM[np] = m; IP[np] = th3 * th; ID[np] = u0 * th3; np++;
        if (np > NP - 3 || !(th > 0)) throw new Error(`membro: nucleo senza fine (c=${c}, np=${np}, th=${th}, x=${x}, m=${m}, ms=${ms}, u0=${u0})`);
        const a1 = (-u0 * m) / (x * x), b1 = x * x * u0 * th3, xm = x + h / 2, m2 = m + (h / 2) * b1, t2 = th + (h / 2) * a1, u2 = mu ? mut(m2) : 1, a2 = (-u2 * m2) / (xm * xm), b2 = xm * xm * u2 * t2 * t2 * t2;
        const m3 = m + (h / 2) * b2, t3 = th + (h / 2) * a2, a3 = (-u2 * m3) / (xm * xm), b3 = xm * xm * u2 * t3 * t3 * t3, xe = x + h, m4 = m + h * b3, t4 = Math.max(th + h * a3, 0), a4 = (-u2 * m4) / (xe * xe), b4 = xe * xe * u2 * t4 * t4 * t4;
        const t1 = th + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), m1 = m + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
        if (t1 <= c) { const t = (th - c) / (th - t1); x += t * h; m += t * (m1 - m); th = c; muf = mu ? mut(m) : 1; IX[np] = x; IM[np] = m; IP[np] = c3 * c; ID[np] = muf * c3; np++; break; }
        x = xe; th = t1; m = m1;
      }
    }
    nf = np - 1; xfit = x;
    if (c > 0) { // l'involucro adiabatico
      const Pf = c3 * c, Df = muf * c3, a = (8 * Df) / (5 * Pf); let w = 1;
      if (x === 0) { x = HX; w = 1 - (4 / 15) * x * x; m = (x * x * x) / 3 - (2 / 25) * x ** 5; IX[np] = x; IM[np] = m; IP[np] = w * w * Math.sqrt(w); ID[np] = w * Math.sqrt(w); np++; }
      for (;;) {
        h = x > 6 ? (HX * x) / 6 : HX;
        const xm = x + h / 2, xe = x + h, a1 = (-a * m) / (x * x), b1 = x * x * Df * w * Math.sqrt(w), w2 = w + (h / 2) * a1, a2 = (-a * (m + (h / 2) * b1)) / (xm * xm), b2 = w2 > 0 ? xm * xm * Df * w2 * Math.sqrt(w2) : 0;
        const w3 = w + (h / 2) * a2, a3 = (-a * (m + (h / 2) * b2)) / (xm * xm), b3 = w3 > 0 ? xm * xm * Df * w3 * Math.sqrt(w3) : 0, w4 = w + h * a3, a4 = (-a * (m + h * b3)) / (xe * xe), b4 = w4 > 0 ? xe * xe * Df * w4 * Math.sqrt(w4) : 0;
        const w1 = w + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), m1 = m + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4);
        if (w1 <= 0) { const t = w / (w - w1); IX[np] = x + t * h; IM[np] = m + t * (m1 - m); IP[np] = 0; ID[np] = 0; np++; break; }
        if (np > NP - 3 || !(w1 === w1)) throw new Error(`membro: involucro senza fine (c=${c}, np=${np}, w=${w})`);
        x = xe; w = w1; m = m1; const sw = Math.sqrt(w); IX[np] = x; IM[np] = m; IP[np] = Pf * w * w * sw; ID[np] = Df * w * sw; np++;
      }
      pf = Pf; df = Df;
    }
    const g1 = IM[np - 1] - ms; if (!mu || Math.abs(g1) < TOL_MS * ms) { ms = IM[np - 1]; break; }
    let pross = passata === 0 || g1 === gA ? IM[np - 1] : ms - (g1 * (ms - msA)) / (g1 - gA);
    if (!(pross > 0.3 * ms && pross < 3 * ms)) pross = IM[np - 1];
    msA = ms; gA = g1; ms = pross;
  }
  const qf = c >= 1 ? 0 : c <= 0 ? 1 : IM[nf] / ms, xs = IX[np - 1], dU = xs ** 3 / (PI4 * ms), pU = xs ** 4 / (16 * Math.PI * ms * ms);
  const pc = new Float64Array(NG), dc = new Float64Array(NG), pb = new Float64Array(NG + 1);
  for (let i = 0; i < np; i++) IZ[i] = Math.cbrt(IM[i] * IM[i]); // vicino al centro P e ρ sono lineari in m^(2/3)
  let j = 0; const z1 = Math.cbrt(ms * ms);
  for (let k = 0; k < NG; k++) {
    let t = ZB[k] * z1; while (j < np - 2 && IZ[j + 1] < t) j++; let u = (t - IZ[j]) / (IZ[j + 1] - IZ[j]); pb[k] = (IP[j] + u * (IP[j + 1] - IP[j])) * pU;
    t = ZC[k] * z1; while (j < np - 2 && IZ[j + 1] < t) j++; u = (t - IZ[j]) / (IZ[j + 1] - IZ[j]); pc[k] = (IP[j] + u * (IP[j + 1] - IP[j])) * pU; dc[k] = (ID[j] + u * (ID[j + 1] - ID[j])) * dU;
  }
  pb[0] = pU; pb[NG] = 0;
  return { c, ms, qf, pf: pf * pU, df: df * dU, p0: pU, d0: dU, rf: c >= 1 ? 0 : xfit / xs, pc, dc, pb };
}
// una famiglia (una per ogni profilo di composizione): i membri si calcolano solo quando servono. La massa totale
// di partenza di ogni membro viene dalla famiglia di prima (il passo precedente della stessa stella) o da quella uniforme.
const FAM_U = { mu: null, m: new Array(CS.length).fill(null), prima: null };
const famiglia = (mu, prima = null) => ({ mu, m: new Array(CS.length).fill(null), prima });
function membroDi(fam, j) {
  if (fam.m[j]) return fam.m[j];
  const p = fam.prima && fam.prima.m[j] ? fam.prima.m[j] : fam === FAM_U ? null : membroDi(FAM_U, j);
  return (fam.m[j] = membro(fam.mu, j, p ? p.ms : 2.018));
}

// ---------- gli elettroni: gas di Fermi non relativistico, a qualunque degenerazione
// D = nₑλ³/2; G = Pₑ/(nₑkT); se = entropia per elettrone / k_B
const FD = (() => {
  const fd = (eta) => {
    if (eta > 40) { const e2 = (Math.PI / eta) ** 2; return [(4 / (3 * Math.sqrt(Math.PI))) * eta ** 1.5 * (1 + e2 / 8 + (7 / 640) * e2 * e2), (8 / (15 * Math.sqrt(Math.PI))) * eta ** 2.5 * (1 + (5 / 8) * e2 - (7 / 384) * e2 * e2)]; }
    const tmax = Math.sqrt(Math.max(eta, 0) + 45), n = 1200, h = tmax / n; let a = 0, b = 0;
    for (let i = 1; i <= n; i++) { const t = i * h, t2 = t * t, w = (i === n ? 1 : i % 2 ? 4 : 2) / (Math.exp(t2 - eta) + 1); a += w * t2; b += w * t2 * t2; }
    return [((2 / Math.sqrt(Math.PI)) * 2 * a * h) / 3, ((4 / (3 * Math.sqrt(Math.PI))) * 2 * b * h) / 3];
  };
  const es = [], lD = [], Gs = [];
  for (let eta = -8; eta <= 160; eta += eta < 12 ? 0.1 : eta < 40 ? 0.5 : 4) { const [f1, f3] = fd(eta); es.push(eta); lD.push(Math.log(f1)); Gs.push(f3 / f1); }
  const L0 = -7, L1 = 7, dL = 0.05, n = Math.round((L1 - L0) / dL) + 1, G = new Float64Array(n), E = new Float64Array(n);
  for (let i = 0, j = 0; i < n; i++) { const l = L0 + i * dL; while (j < lD.length - 2 && lD[j + 1] < l) j++; const u = (l - lD[j]) / (lD[j + 1] - lD[j]); G[i] = Gs[j] + u * (Gs[j + 1] - Gs[j]); E[i] = es[j] + u * (es[j + 1] - es[j]); }
  return { L0, L1, dL, n, G, E };
})();
// G, dG/dlnD, η
const elG = [0, 0, 0];
function elettroni(lnD) {
  if (lnD <= FD.L0) { const D = Math.exp(lnD); elG[0] = 1 + D / 5.656854; elG[1] = D / 5.656854; elG[2] = lnD + D / 2.828427; return elG; }
  if (lnD >= FD.L1) { const eta = Math.pow(0.75 * Math.sqrt(Math.PI) * Math.exp(lnD), 2 / 3); elG[0] = 0.4 * eta; elG[1] = (0.8 / 3) * eta; elG[2] = eta; return elG; }
  const t = (lnD - FD.L0) / FD.dL, i = Math.min(FD.n - 2, t | 0), u = t - i;
  elG[1] = (FD.G[i + 1] - FD.G[i]) / FD.dL; elG[0] = FD.G[i] + u * (FD.G[i + 1] - FD.G[i]); elG[2] = FD.E[i] + u * (FD.E[i + 1] - FD.E[i]); return elG;
}
const LQE = 1.5 * Math.log((2 * Math.PI * K.hbar * K.hbar) / (K.me * K.kB)), EQE = Math.exp(LQE); // ln λ³ = LQE − 1,5 ln T
const lnQ = (m, T) => 1.5 * Math.log((m * K.kB * T) / (2 * Math.PI * K.hbar * K.hbar)); // ln della concentrazione quantica

// ---------- lo stato della materia: T da P e ρ (ioni perfetti + elettroni di Fermi + radiazione)
function temperatura(P, rho, X, Zm) {
  const Y = 1 - X - Zm, n = rho / MB, ni = n * (X + Y / 4 + Zm / 16), ne = n * (X + Y / 2 + Zm / 2);
  let T = P / ((ni + ne) * K.kB); // gas perfetto: è il massimo possibile, e da lì il metodo di Newton scende senza oscillare
  const cD = 0.5 * ne * EQE;
  for (let it = 0; it < 30; it++) {
    const D = cD / (T * Math.sqrt(T)), pr = (A_RAD * T ** 4) / 3; let G, dG;
    if (D < 0.3) { G = 1 + D * (0.1767767 - 0.0033001 * D); dG = D * (0.1767767 - 0.0066002 * D); } // poco degeneri: lo sviluppo in serie
    else { const g = elettroni(Math.log(D)); G = g[0]; dG = g[1]; }
    const f = (ni + ne * G) * K.kB * T + pr - P, d = (ni + ne * (G - 1.5 * dG)) * K.kB + (4 * pr) / T, dT = f / d;
    T -= dT; if (Math.abs(dT) < 1e-7 * T) break;
  }
  return T;
}

// ---------- le reazioni: il picco di Gamow integrato numericamente
function sigmaV(T, Z1, Z2, A1, A2, S) {
  const mr = ((A1 * A2) / (A1 + A2)) * MB, kT = K.kB * T, EG = 2 * mr * K.c ** 2 * (Math.PI * ALFA * Z1 * Z2) ** 2;
  const E0 = Math.pow((Math.sqrt(EG) * kT) / 2, 2 / 3), D = 4 * Math.sqrt((E0 * kT) / 3), a = Math.max(E0 * 1e-3, E0 - 3 * D), b = E0 + 5 * D, n = 128, h = (b - a) / n;
  const tau = (3 * E0) / kT; let s = 0;
  for (let i = 0; i <= n; i++) { const E = a + i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2; s += w * (S[0] + S[1] * E + 0.5 * S[2] * E * E) * Math.exp(tau - E / kT - Math.sqrt(EG / E)); }
  return [Math.sqrt(8 / (Math.PI * mr)) * kT ** -1.5 * ((s * h) / 3), tau]; // ⟨σv⟩·e^τ, τ
}
const LT0 = Math.log(3e5), LT1 = Math.log(5e9), NT = 400, DLT = (LT1 - LT0) / (NT - 1);
const TAB = { pp: new Float64Array(NT), cno: new Float64Array(NT) };
for (let i = 0; i < NT; i++) {
  const T = Math.exp(LT0 + i * DLT);
  let r = sigmaV(T, 1, 1, 1, 1, DATI.S11); TAB.pp[i] = Math.log(r[0]) - r[1];
  r = sigmaV(T, 1, 7, 1, 14, DATI.S114); TAB.cno[i] = Math.log(r[0]) - r[1];
}
const QPP = (DATI.Q4 - DATI.nuPP) / 2, QCNO = DATI.Q4 - DATI.nuCNO;
const eps = [0, 0];
function energia(rho, T, X, Zm) {
  const lt = (Math.log(T) - LT0) / DLT;
  if (lt < 0 || X <= 0) { eps[0] = eps[1] = 0; return eps; }
  const i = Math.min(NT - 2, lt | 0), u = lt - i, Y = 1 - X - Zm, n = rho / MB, np = n * X, kT = K.kB * T;
  let h1 = 0, h14 = 0;
  { // lo schermo degli elettroni attorno ai nuclei: Debye (debole) o sfera ionica (forte), il minore dei due
    const ne = n * (X + Y / 2 + Zm / 2), z2 = n * (X + Y + 4 * Zm) + ne, hw = (E2 / kT) * Math.sqrt((PI4 * E2 * z2) / kT), hs = ((0.9 * E2) / kT) * Math.cbrt((PI4 * ne) / 3);
    h1 = Math.min(hw, 1.1748 * hs); h14 = Math.min(7 * hw, 5.385 * hs);
  }
  eps[0] = (0.5 * np * np * Math.exp(TAB.pp[i] + u * (TAB.pp[i + 1] - TAB.pp[i]) + h1) * QPP) / rho;
  eps[1] = (np * ((n * DATI.CN * Zm) / 14) * Math.exp(TAB.cno[i] + u * (TAB.cno[i + 1] - TAB.cno[i]) + h14) * QCNO) / rho;
  return eps;
}

// ---------- l'opacità dell'interno: elettroni liberi (Thomson), frenamento (Kramers), fotoionizzazione dei metalli
const C_FF = (() => { // media di Rosseland della formula di Kramers (fattore di Gaunt 1): tutto dalle costanti
  const C = ((4 * E2 ** 3) / (3 * K.me * 2 * Math.PI * K.hbar * K.c)) * Math.sqrt((2 * Math.PI) / (3 * K.kB * K.me));
  let i1 = 0, i0 = 0; const n = 4000, h = 60 / n;
  for (let i = 1; i < n; i++) { const x = i * h, e = Math.exp(-x), w = (x ** 4 * e) / (1 - e) ** 2; i0 += w; i1 += (w * x ** 3) / (1 - e); }
  return (C * ((2 * Math.PI * K.hbar) / K.kB) ** 3 * i0) / i1 / (2 * MB * MB);
})();
const C_ES = SIGMA_T / (2 * MB);
function opacita(rho, T, X, Zm) {
  const t35 = rho / (T ** 3 * Math.sqrt(T)), g = DATI.ghigliottina[0] * Math.pow(rho * (1 + X), DATI.ghigliottina[1]);
  return (1 + X) * (C_ES + (C_FF * (1 - Zm) + (DATI.Cbf * Zm) / g) * t35);
}

// ---------- la fotosfera: dove la stella diventa trasparente (profondità ottica 2/3)
const opFoto = (rho, T, Zm) => DATI.Hmeno * (Zm / 0.02) * Math.sqrt(rho) * T ** 9 + DATI.molecole * (Zm / DATI.ZSOLE) * Math.cbrt(rho * rho) * T ** 3;
// entropia per unità di massa (in k_B/m_B) del gas neutro (atomi H, He; con H₂ se richiesto)
const fotoOut = [0, 0, 0];
function entropiaFoto(T, g, X, Zm) {
  const Y = 1 - X - Zm, kTm = (K.kB * T) / MB, lq1 = lnQ(MB, T), th = DATI.H2.vib / T, ex = Math.exp(-th), zi = ((T / DATI.H2.rot) * 2) / (1 - ex);
  // equilibrio 2H ⇌ H₂: n₁²/n₂ = Keq
  const Keq = Math.exp(2 * lq1 - lnQ(2 * MB, T) + Math.log(16 / zi) - DATI.H2.D0 / (K.kB * T)), lg = Math.log((2 * g) / 3);
  let lr = (2 / 3) * (lg - Math.log(kTm * 0.77 * DATI.Hmeno * (Zm / 0.02) * T ** 9)), f = 0, mu = 1, rho = 0; // si parte dal solo H⁻
  for (let it = 0; it < 40; it++) { // ρ: P = ρkT/(μ m) = 2g/(3κ)
    rho = Math.exp(lr);
    const nH = (X * rho) / MB, y = (8 * nH) / Keq; f = y < 1e-9 ? 0 : 1 - (Math.sqrt(1 + y) - 1) / (y / 2) ; mu = 1 / (X * (1 - f / 2) + Y / 4);
    const hm = DATI.Hmeno * (Zm / 0.02) * Math.sqrt(rho) * T ** 9, mo = DATI.molecole * (Zm / DATI.ZSOLE) * Math.cbrt(rho * rho) * T ** 3, k = hm + mo;
    const F = lr + Math.log((kTm / mu) * k) - lg, dF = 1 + (0.5 * hm + (2 / 3) * mo) / k + 0.25 * f * X * mu, d = F / dF;
    lr -= Math.abs(d) > 2 ? 2 * Math.sign(d) : d; if (Math.abs(d) < 1e-8) break;
  }
  const n = rho / MB, n1 = n * X * (1 - f), n2 = (n * X * f) / 2; let s = 0;
  if (n1 > 0) s += X * (1 - f) * (2.5 + lq1 + Math.log(4 / n1));
  if (n2 > 1e-300) s += ((X * f) / 2) * (2.5 + lnQ(2 * MB, T) + Math.log(zi / n2) + 1 + (th * ex) / (1 - ex));
  if (Y > 0) s += (Y / 4) * (2.5 + lnQ(4 * MB, T) - Math.log((n * Y) / 4));
  if (isFinite(DATI.alfaConv)) { // lo strato dove la convezione è inefficiente (lunghezza di mescolamento, una zona)
    const cp = 2.5 / mu + (X * f) / 2, F = K.sigma * T ** 4, v = Math.sqrt(kTm / mu);
    s += cp * Math.pow((4 * Math.SQRT2 * F) / (DATI.alfaConv ** 2 * rho * cp * (K.kB / MB) * T * v), 2 / 3);
  }
  fotoOut[0] = s; fotoOut[1] = rho; fotoOut[2] = f; return fotoOut;
}
// entropia per unità di massa (in k_B/m_B) del gas ionizzato dell'interno
function entropiaInterno(rho, T, X, Zm) {
  const Y = 1 - X - Zm, n = rho / MB, ne = n * (X + Y / 2 + Zm / 2), g = elettroni(Math.log(ne / 2) + LQE - 1.5 * Math.log(T));
  let s = (X + Y / 2 + Zm / 2) * (2.5 * g[0] - g[2]);
  if (X > 0) s += X * (2.5 + lnQ(MB, T) + Math.log(2 / (n * X)));
  if (Y > 0) s += (Y / 4) * (2.5 + lnQ(4 * MB, T) - Math.log((n * Y) / 4));
  return s;
}
// ---------- UNA STELLA: massa, profilo di idrogeno, raggio R e raccordo c → i due bilanci.
//   resA (la superficie): l'entropia della fotosfera meno quella dell'involucro convettivo (zero se la convezione
//        porta su il calore senza sprechi; lo strato inefficiente in cima è già contato in entropiaFoto);
//   resB (il trasporto): ln di ∫κ·(l/m)·dP/(4πcG) sulla zona radiativa, diviso per il salto di pressione di radiazione
//        che la struttura ha davvero: è l'equazione della diffusione dei fotoni, integrata.
const B = { p: new Float64Array(NG), T: new Float64Array(NG), e: new Float64Array(NG), ec: new Float64Array(NG), pb: new Float64Array(NG + 1), l: new Float64Array(NG + 1), dn: new Float64Array(NG), y: new Float64Array(NG) };
const CC = 16 * Math.PI * A_RAD * K.c * K.G;
function valuta(M, Xp, Zm, R, c, fam = FAM_U, qmax = 2) {
  // la struttura di prova, interpolata nella famiglia
  let j = 0; while (j < CS.length - 2 && CS[j + 1] <= c) j++;
  const u = Math.min(1, Math.max(0, (c - CS[j]) / (CS[j + 1] - CS[j]))), F0 = membroDi(fam, u < 1 ? j : j + 1), F1 = u > 0 && u < 1 ? membroDi(fam, j + 1) : F0;
  const dU = M / R ** 3, pU = (K.G * M * M) / R ** 4;
  const qf = F0.qf + u * (F1.qf - F0.qf), pf = (F0.pf + u * (F1.pf - F0.pf)) * pU, df = (F0.df + u * (F1.df - F0.df)) * dU, p0 = (F0.p0 + u * (F1.p0 - F0.p0)) * pU, d0 = (F0.d0 + u * (F1.d0 - F0.d0)) * dU;
  CONTA.valuta++;
  let L = 0, Lpp = 0, nad0 = 0.4;
  B.l[0] = 0;
  for (let i = 0; i < NG; i++) {
    const P = (F0.pc[i] + u * (F1.pc[i] - F0.pc[i])) * pU, rho = (F0.dc[i] + u * (F1.dc[i] - F0.dc[i])) * dU, X = Xp[i];
    const T = temperatura(P, rho, X, Zm), e = energia(rho, T, X, Zm), dm = (QB[i + 1] - QB[i]) * M, lp = L;
    B.p[i] = P; B.T[i] = T; B.e[i] = e[0] + e[1]; B.ec[i] = e[1];
    Lpp += e[0] * dm; L += (e[0] + e[1]) * dm; B.l[i + 1] = L; B.pb[i] = (F0.pb[i] + u * (F1.pb[i] - F0.pb[i])) * pU;
    // il gradiente che la radiazione richiederebbe (∇rad) meno quello adiabatico: dove è positivo c'è convezione
    const beta = 1 - (A_RAD * T ** 4) / (3 * P), nad = (8 - 6 * beta) / (32 - 24 * beta - 3 * beta * beta);
    B.y[i] = (opacita(rho, T, X, Zm) * 0.5 * (lp + L)) / (QC[i] * M);
    B.dn[i] = (3 * B.y[i] * P) / (CC * T ** 4) - nad; if (i === 0) nad0 = nad;
  }
  B.pb[NG] = 0;
  const Tc = temperatura(p0, d0, Xp[0], Zm);
  // il nucleo convettivo (criterio di Schwarzschild sulla struttura di prova), fin dove il peso molecolare lo lascia arrivare
  let qcc = 0, Pin = p0, Tin = Tc;
  if (B.dn[0] > 0 && qmax > QC[0]) {
    let ic = 1; while (ic < NG && B.dn[ic] > 0 && QC[ic] < qmax) ic++;
    if (ic >= NG) qcc = 1;
    else { const t = B.dn[ic] > 0 ? (qmax - QC[ic - 1]) / (QC[ic] - QC[ic - 1]) : Math.min(B.dn[ic - 1] / (B.dn[ic - 1] - B.dn[ic]), (qmax - QC[ic - 1]) / (QC[ic] - QC[ic - 1])); qcc = QC[ic - 1] + t * (QC[ic] - QC[ic - 1]); Pin = B.p[ic - 1] + t * (B.p[ic] - B.p[ic - 1]); Tin = B.T[ic - 1] + t * (B.T[ic] - B.T[ic - 1]); }
  }
  // il trasporto per radiazione tra il nucleo convettivo e il raccordo
  let I = 0;
  const Pout = c <= 0 ? 0 : pf;
  for (let i = 0; i < NG; i++) { const a = Math.min(B.pb[i], Pin), b = Math.max(B.pb[i + 1], Pout); if (a > b) I += B.y[i] * (a - b); }
  I /= PI4 * K.c * K.G;
  const Xe = Xp[NG - 1], conv = c >= 1, Xf = conv ? Xp[0] : Xe, Tf = c <= 0 ? 0 : temperatura(pf, df, Xf, Zm), dPr = (A_RAD / 3) * (Tin ** 4 - Tf ** 4);
  const resB = conv ? NaN : Pin > Pout && dPr > 0 ? Math.log(I / dPr) : NaN;
  // la superficie
  const Teff = Math.pow(L / (PI4 * R * R * K.sigma), 0.25); let resA = NaN, sF = NaN;
  if (c > 0) { sF = entropiaInterno(df, Tf, Xf, Zm); resA = L > 0 ? entropiaFoto(Math.max(Teff, 300), (K.G * M) / (R * R), Xe, Zm)[0] - sF : -1e3; }
  return { L, Lpp, Teff, resA, resB, Tc, rhoc: d0, qcc, qf, rf: F0.rf + u * (F1.rf - F0.rf), nradc: B.dn[0] + nad0, c, R, sF, pend: 0, J: null };
}
// quanto sono degeneri gli elettroni: D = nₑλ³/2 (sopra 1 il principio di Pauli conta più del calore)
const degenerazione = (rho, T, X, Zm) => Math.exp(Math.log(((rho / MB) * (1 + X)) / 4) + LQE - 1.5 * Math.log(T));

// ---------- IL RISOLUTORE: R (e c) che chiudono i bilanci
function zero(f, a, b, fa, fb, tol = 1e-6) { // regula falsi (Illinois) su un intervallo che contiene la radice
  let lato = 0;
  for (let it = 0; it < 60; it++) {
    const c = Math.abs(fb - fa) > 1e-300 ? (a * fb - b * fa) / (fb - fa) : 0.5 * (a + b), fc = f(c);
    if (fc === 0) return c;
    if (fc * fb < 0) { a = b; fa = fb; lato = 0; } else if (lato === -1) fa *= 0.5; else lato = -1;
    b = c; fb = fc;
    if (Math.abs(b - a) < tol) return c;
  }
  return 0.5 * (a + b);
}
// R dove si annulla un residuo che cala al crescere di R (il ramo stabile: se la stella si stringe produce più di
// quanto perde, e si riallarga). Si parte da R0 e si allarga l'intervallo a passi. Se stringendo il residuo, ancora
// negativo, torna a calare, la contrazione non accende più niente: `giro` lo segnala (è la degenerazione).
let giro = false;
function raggio(res, R0, passo = 0.1) {
  let b = Math.log(R0), fb = res(b), a, fa; giro = false;
  if (fb > 0) { a = b; fa = fb; for (let i = 0; i < 80; i++) { b = a + passo; fb = res(b); if (fb <= 0) break; a = b; fa = fb; } if (fb > 0) return NaN; }
  else { let su = 0; for (let i = 0; i < 120; i++) { a = b - passo; fa = res(a); if (fa > 0) break; if (fa <= fb) { if (++su > 4) { giro = true; return NaN; } } else su = 0; b = a; fb = fa; } if (!(fa > 0)) return NaN; }
  return Math.exp(zero(res, a, b, fa, fb));
}
const raggioA = (M, Xp, Zm, c, R0, fam, qmax, passo) => raggio((u) => valuta(M, Xp, Zm, Math.exp(u), c, fam, qmax).resA, R0, passo);
const raggioB = (M, Xp, Zm, R0, fam, qmax, passo) => raggio((u) => { const r = valuta(M, Xp, Zm, Math.exp(u), 0, fam, qmax).resB; return isNaN(r) ? 50 : r; }, R0, passo);
const TOL_A = 4e-3, TOL_B = 1e-3;
// la via rapida, da una soluzione vicina: un residuo solo (secante in ln R)…
function unaVariabile(M, Xp, Zm, c, chiave, tol, prima, fam, qmax) {
  let u = Math.log(prima.R), v = valuta(M, Xp, Zm, Math.exp(u), c, fam, qmax), f = v[chiave], pend = prima.c === c ? prima.pend : 0;
  for (let it = 0; it < 12 && isFinite(f); it++) {
    if (Math.abs(f) < tol) { v.pend = pend; return v; }
    const du = pend ? Math.max(-0.2, Math.min(0.2, -f / pend)) : f > 0 ? 0.02 : -0.02, v1 = valuta(M, Xp, Zm, Math.exp(u + du), c, fam, qmax), p1 = (v1[chiave] - f) / du;
    if (!(p1 < 0)) return null; // non è il ramo stabile
    pend = p1; u += du; v = v1; f = v1[chiave];
  }
  return null;
}
// …o tutti e due (Newton con la matrice aggiornata alla Broyden, in ln R e ln c)
function dueVariabili(M, Xp, Zm, prima, fam, qmax) {
  let u = Math.log(prima.R), w = Math.log(prima.c), sporco = false;
  const f = (u, w) => valuta(M, Xp, Zm, Math.exp(u), Math.exp(w), fam, qmax);
  let v = f(u, w), A = v.resA, Bv = v.resB, J = prima.J ? prima.J.slice() : null;
  const jac = () => { const d = 2e-3, v1 = f(u + d, w), v2 = f(u, w + d); J = [(v1.resA - A) / d, (v2.resA - A) / d, (v1.resB - Bv) / d, (v2.resB - Bv) / d]; sporco = true; return isFinite(J[0] + J[1] + J[2] + J[3]); };
  if (!isFinite(A) || !isFinite(Bv) || (!J && !jac())) return null;
  for (let it = 0; it < 16; it++) {
    if (Math.abs(A) < TOL_A && Math.abs(Bv) < TOL_B) { if (sporco) v = f(u, w); v.J = J; return v; }
    const det = J[0] * J[3] - J[1] * J[2]; if (!(Math.abs(det) > 1e-9)) return null;
    let su = -(A * J[3] - Bv * J[1]) / det, sw = -(J[0] * Bv - J[2] * A) / det; const lim = Math.max(Math.abs(su) / 0.15, Math.abs(sw) / 0.5, 1); su /= lim; sw /= lim;
    const w1 = w + sw; if (w1 <= Math.log(C_MIN) || w1 >= Math.log(0.995)) return null;
    const v1 = f(u + su, w1); sporco = false; if (!isFinite(v1.resA) || !isFinite(v1.resB)) return null;
    const n2 = su * su + sw * sw, rA = (v1.resA - A - J[0] * su - J[1] * sw) / n2, rB = (v1.resB - Bv - J[2] * su - J[3] * sw) / n2;
    J[0] += rA * su; J[1] += rA * sw; J[2] += rB * su; J[3] += rB * sw;
    const peggio = Math.abs(v1.resA) / TOL_A + Math.abs(v1.resB) / TOL_B > Math.abs(A) / TOL_A + Math.abs(Bv) / TOL_B;
    u += su; w = w1; v = v1; A = v1.resA; Bv = v1.resB;
    if ((peggio || it % 5 === 4) && !jac()) return null;
  }
  return null;
}
// la via sicura, senza sapere niente
function sicura(M, Xp, Zm, R0, fam, qmax) {
  // tutta convettiva?
  let R = raggioA(M, Xp, Zm, 1, R0, fam, qmax), v, c;
  if (!isNaN(R)) { v = valuta(M, Xp, Zm, R, 1, fam, qmax); if (v.nradc >= 0.25) return v; }
  else if (giro) return null; // la degenerazione ferma la contrazione prima che l'idrogeno basti: nana bruna
  // c'è un nucleo radiativo: c dove il trasporto chiude, lungo la curva della superficie
  let Rg = isNaN(R) ? R0 : R;
  const g = (x) => { const r = raggioA(M, Xp, Zm, x, Rg, fam, qmax); if (isNaN(r)) return NaN; Rg = r; return valuta(M, Xp, Zm, r, x, fam, qmax).resB; };
  const g0 = g(C_MIN);
  if (!(g0 > 0)) { R = raggioB(M, Xp, Zm, Rg, fam, qmax); return isNaN(R) ? null : valuta(M, Xp, Zm, R, 0, fam, qmax); } // niente involucro convettivo
  const R1 = Rg; Rg = isNaN(R) ? R0 : R; const g1 = g(0.98);
  if (!(g1 < 0)) return isNaN(R) ? null : valuta(M, Xp, Zm, R, 1, fam, qmax);
  Rg = R1; c = zero(g, C_MIN, 0.98, g0, g1, 1e-5); R = raggioA(M, Xp, Zm, c, Rg, fam, qmax);
  return isNaN(R) ? null : valuta(M, Xp, Zm, R, c, fam, qmax);
}
// la struttura di equilibrio: tutta convettiva (c = 1: chiude la superficie), con nucleo radiativo e involucro
// convettivo (0 < c < 1: superficie e trasporto insieme), o senza involucro (c = 0: chiude il trasporto).
// L'ultima chiamata a valuta() è sempre quella della soluzione: i ritmi guscio per guscio restano in B.
function equilibrio(M, Xp, Zm, prima = null, fam = FAM_U, qmax = 2) {
  if (prima) { // le vie rapide, dalla soluzione vicina (la stessa stella un passo prima, o la massa accanto)
    let v = null;
    const radiativa = (R) => { // senza involucro: chiude il trasporto; e la fotosfera non deve chiedere una zona convettiva più fonda di C_MIN
      let x = unaVariabile(M, Xp, Zm, 0, 'resB', TOL_B, { R, c: 0, pend: prima.c <= 0 ? prima.pend : 0 }, fam, qmax);
      if (!x || x.Teff > 9000) return x;
      const pend = x.pend; if (valuta(M, Xp, Zm, x.R, C_MIN, fam, qmax).resA < 0) return null;
      x = valuta(M, Xp, Zm, x.R, 0, fam, qmax); x.pend = pend; return x;
    };
    if (prima.c >= 1) {
      v = unaVariabile(M, Xp, Zm, 1, 'resA', TOL_A, prima, fam, qmax);
      if (v) { if (v.nradc >= 0.25) return v; v = dueVariabili(M, Xp, Zm, { R: v.R, c: 0.75, J: null }, fam, qmax); if (v) return v; } // è nato un nucleo radiativo
    } else if (prima.c <= 0) { v = radiativa(prima.R); if (v) return v; }
    else {
      v = dueVariabili(M, Xp, Zm, prima, fam, qmax); if (v) return v;
      if (prima.c < 0.06) { v = radiativa(prima.R); if (v) return v; } // l'involucro convettivo si è assottigliato fino a sparire
    }
  }
  const v = sicura(M, Xp, Zm, prima?.R ?? RSOLE * Math.pow(M / MSOLE, 0.8), fam, qmax);
  return v && v.L > 0 && v.Teff > 1000 ? v : null; // sotto i 1000 K la fotosfera che sappiamo descrivere non c'è più
}

// ---------- LA VITA IN SEQUENZA PRINCIPALE: l'idrogeno diventa elio, guscio per guscio. A ogni passo l'idrogeno del
// centro cala di una quota; gli altri gusci calano in proporzione al loro ritmo; le zone convettive si mescolano;
// la struttura si ricalcola con la nuova composizione (più elio: gas più pesante, centro più denso e più caldo).
const PASSI = [1, 0.84, 0.67, 0.5, 0.33, 0.18, 0.07, 0.01];
const KPP = (4 * MB) / (DATI.Q4 - DATI.nuPP), KCNO = (4 * MB) / (DATI.Q4 - DATI.nuCNO); // kg di idrogeno per joule
function traccia(Msol, Z = 1, prima0 = null, passi = PASSI) {
  const { X: X0, Zm } = composizione(Z), M = Msol * MSOLE, Xp = new Float64Array(NG).fill(X0), r = new Float64Array(NG), n = passi.length;
  const tr = { M: Msol, Z, n: 0, t: new Float64Array(n), lL: new Float64Array(n), lR: new Float64Array(n), lTc: new Float64Array(n), lrho: new Float64Array(n), cno: new Float64Array(n), qcc: new Float64Array(n), qenv: new Float64Array(n), Xc: new Float64Array(n), vita: 0, mHe: 0, zams: null };
  let prima = prima0, prima2 = null, fam = FAM_U, t = 0, rc0 = 0, xc0 = X0, s = 0, uniforme = true, qmax = 2;
  for (let k = 0; k < n; k++) {
    if (!uniforme) { const mu = new Float64Array(NG), m0 = 2 * Xp[0] + 0.75 * (1 - Xp[0] - Zm) + 0.5 * Zm; for (let i = 0; i < NG; i++) mu[i] = m0 / (2 * Xp[i] + 0.75 * (1 - Xp[i] - Zm) + 0.5 * Zm); fam = famiglia(mu, fam === FAM_U ? null : fam); if (fam.prima) fam.prima.prima = null; }
    else fam = FAM_U;
    // il punto di partenza: la soluzione di prima, spinta avanti come si è mossa nell'ultimo passo
    let parto = prima;
    if (prima && prima2 && prima.c === prima2.c || (prima && prima2 && prima.c > 0 && prima.c < 1 && prima2.c > 0 && prima2.c < 1)) parto = { ...prima, R: prima.R * Math.min(1.3, Math.max(0.77, prima.R / prima2.R)), c: prima.c > 0 && prima.c < 1 ? Math.min(0.99, Math.max(1.2 * C_MIN, prima.c * Math.min(1.5, Math.max(0.67, prima.c / prima2.c)))) : prima.c };
    const e = equilibrio(M, Xp, Zm, parto, fam, qmax) || (parto !== prima ? equilibrio(M, Xp, Zm, prima, fam, qmax) : null); if (!e) break;
    prima2 = k === 0 ? null : prima; prima = e; if (k === 0) tr.zams = e;
    // il ritmo a cui cala l'idrogeno in ogni guscio (kg di H per kg e per secondo)
    for (let i = 0; i < NG; i++) r[i] = (B.e[i] - B.ec[i]) * KPP + B.ec[i] * KCNO;
    const xarr = Xp[0];
    const mescola = (i0, i1) => { let sr = 0, sx = 0, sm = 0; for (let i = i0; i < i1; i++) { const dm = QB[i + 1] - QB[i]; sr += r[i] * dm; sx += Xp[i] * dm; sm += dm; } if (sm > 0) for (let i = i0; i < i1; i++) { r[i] = sr / sm; Xp[i] = sx / sm; } };
    let i1 = 0; while (i1 < NG && QC[i1] < e.qcc) i1++; if (i1 > 1) mescola(0, i1);
    if (e.c >= 1) mescola(0, NG); else if (e.c > 0) { let i0 = 0; while (i0 < NG && QC[i0] < e.qf) i0++; if (i0 > i1) mescola(i0, NG); }
    const rc = r[0], xc = Xp[0];
    // il tempo del passo appena fatto: il ritmo è cambiato strada facendo (legge di potenza tra l'inizio e la fine)
    if (k > 0 && s > 0) { const f = xarr / xc0, p = Math.log(rc / rc0) / Math.log(f); t += (s * (Math.abs(p - 1) < 1e-3 ? Math.log(1 / f) : (Math.pow(f, 1 - p) - 1) / (p - 1))) / (1 - f); }
    tr.t[k] = t / ANNO; tr.lL[k] = Math.log(e.L / LSOLE); tr.lR[k] = Math.log(e.R / RSOLE); tr.lTc[k] = Math.log(e.Tc); tr.lrho[k] = Math.log(e.rhoc); tr.cno[k] = 1 - e.Lpp / e.L;
    tr.qcc[k] = e.qcc; tr.qenv[k] = e.c >= 1 ? 1 : e.c > 0 ? 1 - e.qf : 0; tr.Xc[k] = xc; tr.n = k + 1;
    rc0 = rc; xc0 = xc;
    // dopo che il centro ha cominciato a bruciare, il nucleo convettivo non può più allargarsi: sopra di lui il gas è
    // più leggero (criterio di Ledoux)
    qmax = e.qcc;
    if (k + 1 < n) { s = (xc - passi[k + 1] * X0) / rc; if (!(s > 0)) s = 0; for (let i = 0; i < NG; i++) Xp[i] = Math.max(0, Xp[i] - r[i] * s); uniforme = e.c >= 1; }
  }
  if (!tr.n) return null;
  tr.vita = tr.t[tr.n - 1];
  // il nucleo di elio che resta: fin dove l'idrogeno è finito (sotto un decimo di quello iniziale)
  let i = 0; while (i < NG && Xp[i] < 0.1 * X0) i++;
  tr.mHe = i === 0 ? 0 : i >= NG ? 1 : QC[i - 1] + ((0.1 * X0 - Xp[i - 1]) / (Xp[i] - Xp[i - 1])) * (QC[i] - QC[i - 1]);
  return tr;
}

// ---------- LE NANE BRUNE: sotto la massa minima la stella non trova l'equilibrio; si stringe e si raffredda,
// irradiando l'energia di gravità (teorema del viriale per un polìtropo n = 3/2: E = −(3/7)·G·M²/R), finché gli
// elettroni degeneri la reggono. La luce che esce è quella della fotosfera con l'entropia dell'interno.
function raffreddamento(Msol, Z) {
  const { X: X0, Zm } = composizione(Z), M = Msol * MSOLE, Xp = new Float64Array(NG).fill(X0), t = [], lL = [], lR = [];
  let R = RSOLE * Math.cbrt(Msol / 0.05), tt = 0, inv0 = 0;
  for (let k = 0; k < 60; k++) {
    const v = valuta(M, Xp, Zm, R, 1), g = (K.G * M) / (R * R);
    let a = Math.log(250), b = Math.log(9000); // la temperatura della fotosfera che ha l'entropia dell'interno
    for (let it = 0; it < 16; it++) { const m = 0.5 * (a + b); if (entropiaFoto(Math.exp(m), g, X0, Zm)[0] < v.sF) a = m; else b = m; }
    const T = Math.exp(0.5 * (a + b)), Ls = PI4 * R * R * K.sigma * T ** 4, netto = Ls - v.L;
    if (!(netto > 0)) break;
    if (k > 0) tt += ((3 / 7) * K.G * M * M * (1 / R - 1 / (R / 0.88))) * 0.5 * (inv0 + 1 / netto);
    t.push(tt / ANNO); lL.push(Math.log(Ls / LSOLE)); lR.push(Math.log(R / RSOLE)); inv0 = 1 / netto;
    if (tt > 3e11 * ANNO || T < 300) break;
    R *= 0.88;
  }
  return { M: Msol, t, lL, lR };
}

// ---------- LA TABELLA: per ogni metallicità (una riga, calcolata al primo uso) le tracce di un po' di masse,
// dalla massa minima in su. stella() interpola tra le tracce.
const Z_NODI = [0.01, 0.1, 1, 3.5], LZ = Z_NODI.map(Math.log);
const M_NODI = [0.1, 0.14, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.8, 2.3, 3.2, 5, 8, 13, 22, 40, 80, 150];
const RIGHE = new Array(Z_NODI.length).fill(null);
// la massa minima: scendendo a piccoli passi finché l'idrogeno, acceso, pareggia ancora ciò che la superficie perde
function cercaMinima(Z) {
  const { X: X0, Zm } = composizione(Z), Xp = new Float64Array(NG).fill(X0);
  let ok = 0.14, e = equilibrio(ok * MSOLE, Xp, Zm), no = 0;
  if (!e) { ok = 0.3; e = equilibrio(ok * MSOLE, Xp, Zm); if (!e) return { M: NaN, e: null }; }
  for (let m = ok / 1.1; m > 0.02; m /= 1.1) { const v = equilibrio(m * MSOLE, Xp, Zm, e); if (!v) { no = m; break; } ok = m; e = v; }
  for (let it = 0; it < 3 && no > 0; it++) { const m = Math.sqrt(ok * no), v = equilibrio(m * MSOLE, Xp, Zm, e); if (v) { ok = m; e = v; } else no = m; }
  return { M: ok, e };
}
function riga(iz) {
  if (RIGHE[iz]) return RIGHE[iz];
  const Z = Z_NODI[iz], min = cercaMinima(Z), masse = [min.M, ...M_NODI.filter((m) => m > 1.05 * min.M)], tr = [];
  let prima = min.e;
  for (const m of masse) { const x = traccia(m, Z, prima); if (x) { tr.push(x); prima = x.zams; } }
  const brune = [0.3, 0.6, 0.97].map((f) => raffreddamento(f * min.M, Z));
  return (RIGHE[iz] = { Z, Mmin: min.M, lnM: Float64Array.from(tr, (x) => Math.log(x.M)), tr, brune });
}
// (per i test e per misurare i tempi) calcola tutte le righe; restituisce i millisecondi impiegati
export function preparaTabella() { const t0 = Date.now(); for (let i = 0; i < Z_NODI.length; i++) riga(i); return Date.now() - t0; }

// una traccia a una frazione τ della sua vita: [ln L, ln R, ln Tc, ln ρc, CNO, nucleo conv., involucro conv., X centro]
const NQ = 8;
function aTau(tr, tau, peso, out) {
  const t = tau * tr.vita, n = tr.n; let k = 0; while (k < n - 2 && tr.t[k + 1] < t) k++;
  const u = n > 1 ? Math.min(1, Math.max(0, (t - tr.t[k]) / (tr.t[k + 1] - tr.t[k]))) : 0, k1 = Math.min(n - 1, k + 1), a = (A) => A[k] + u * (A[k1] - A[k]);
  out[0] += peso * a(tr.lL); out[1] += peso * a(tr.lR); out[2] += peso * a(tr.lTc); out[3] += peso * a(tr.lrho); out[4] += peso * a(tr.cno); out[5] += peso * a(tr.qcc); out[6] += peso * a(tr.qenv); out[7] += peso * a(tr.Xc);
}
const posto = (A, x) => { let i = 0; const n = A.length; while (i < n - 2 && A[i + 1] < x) i++; return i; };
function pesiZ(Z) {
  const lz = Math.log(Math.min(Z_NODI[Z_NODI.length - 1], Math.max(Z_NODI[0], Z))), iz = posto(LZ, lz), uz = (lz - LZ[iz]) / (LZ[iz + 1] - LZ[iz]);
  return uz <= 0 ? [[riga(iz), 1]] : uz >= 1 ? [[riga(iz + 1), 1]] : [[riga(iz), 1 - uz], [riga(iz + 1), uz]];
}
const MEZZA_ETA = 0.5 * etaUniverso() / ANNO;

// ---------- CIÒ CHE SI USA DA FUORI

// la massa più piccola che accende l'idrogeno (in masse solari), a una metallicità (in unità solari)
export function massaMinima({ Z = 1 } = {}) { let s = 0; for (const [r, w] of pesiZ(Z)) s += w * Math.log(r.Mmin); return Math.exp(s); }

// la massa più grande: dove al centro la pressione della luce uguaglia quella del gas (nel modello di Eddington la
// massa fissa da sola questo rapporto: M ∝ √(1−β)/(μ²β²)·(ħc/G)^3/2/m_p²). Oltre, la stella è tenuta insieme a stento.
export function massaMassima({ Z = 1 } = {}) {
  const { X, Zm } = composizione(Z), mu = 1 / (2 * X + 0.75 * (1 - X - Zm) + 0.5 * Zm), beta = 0.5;
  const Kp = Math.cbrt((3 * (1 - beta)) / A_RAD) * Math.pow(K.kB / (beta * mu * MB), 4 / 3);
  return (PI4 * laneEmden(3, 0.01).m1 * Math.pow(Kp / (Math.PI * K.G), 1.5)) / MSOLE;
}

// UNA STELLA in sequenza principale. Msol: massa in masse solari; Z: metalli in unità solari; eta: anni dalla nascita
// (se manca: a metà della vita, o a metà dell'età dell'universo se vive di più).
// → L, R in unità solari, T in K, vita in anni (come la vecchia stella() di leggi.js), e in più: Tc (K), densitaCentro
// (kg/m³), cno (frazione di L dal ciclo CNO), nucleoConvettivo e involucroConvettivo (frazioni di massa), struttura,
// idrogenoCentro, eddington (L/L_Eddington), eta (quella usata), finita (ha esaurito l'idrogeno al centro), nanaBruna.
export function stella(Msol, { Z = 1, eta = null } = {}) {
  const righe = pesiZ(Z), lm = Math.log(Math.min(Msol, 300));
  let lmin = 0; for (const [r, w] of righe) lmin += w * Math.log(r.Mmin);
  if (lm < lmin - 1e-9) return nanaBruna(Msol, righe, eta);
  // la vita, interpolata tra le tracce vicine (in logaritmo, su massa e metalli)
  let lv = 0; const vicini = [];
  for (const [r, w] of righe) {
    const x = Math.max(lm, r.lnM[0]), i = posto(r.lnM, x), u = (x - r.lnM[i]) / (r.lnM[i + 1] - r.lnM[i]);
    lv += w * ((1 - u) * Math.log(r.tr[i].vita) + u * Math.log(r.tr[i + 1].vita)); vicini.push(r.tr[i], w * (1 - u), r.tr[i + 1], w * u);
  }
  const vita = Math.exp(lv), anni = eta ?? Math.min(0.5 * vita, MEZZA_ETA), tau = Math.min(1, Math.max(0, anni / vita)), o = new Float64Array(NQ);
  let vic = vicini[0], pmax = -1;
  for (let i = 0; i < vicini.length; i += 2) { if (vicini[i + 1] !== 0) aTau(vicini[i], tau, vicini[i + 1], o); if (vicini[i + 1] > pmax) { pmax = vicini[i + 1]; vic = vicini[i]; } }
  const L = Math.exp(o[0]), R = Math.exp(o[1]), T = Math.pow((L * LSOLE) / (PI4 * (R * RSOLE) ** 2 * K.sigma), 0.25), qe = aUno(vic, tau, 'qenv');
  return {
    L, R, T, vita, Tc: Math.exp(o[2]), densitaCentro: Math.exp(o[3]), cno: o[4], nucleoConvettivo: o[5], involucroConvettivo: o[6], idrogenoCentro: o[7],
    struttura: qe >= 1 ? 'tutta convettiva' : qe > 0 ? 'nucleo radiativo, involucro convettivo' : aUno(vic, tau, 'qcc') > 0 ? 'nucleo convettivo, involucro radiativo' : 'radiativa',
    eddington: (L * LSOLE * C_ES * (1 + composizione(Z).X)) / (PI4 * K.c * K.G * Msol * MSOLE), eta: anni, finita: anni >= vita, nanaBruna: false,
  };
}
const aUno = (tr, tau, chiave) => { const t = tau * tr.vita; let k = 0; while (k < tr.n - 2 && tr.t[k + 1] < t) k++; return t - tr.t[k] < tr.t[Math.min(tr.n - 1, k + 1)] - t ? tr[chiave][k] : tr[chiave][Math.min(tr.n - 1, k + 1)]; };
function nanaBruna(Msol, righe, eta) {
  const anni = eta ?? MEZZA_ETA; let lL = 0, lR = 0;
  for (const [r, w] of righe) {
    const lm = Math.log(Msol), ms = r.brune.map((b) => Math.log(b.M)), i = posto(ms, lm), u = Math.min(1, Math.max(0, (lm - ms[i]) / (ms[i + 1] - ms[i])));
    for (const [b, p] of [[r.brune[i], w * (1 - u)], [r.brune[i + 1], w * u]]) {
      const n = b.t.length, lt = Math.log(Math.max(anni, 1)); let k = 1; while (k < n - 2 && Math.log(b.t[k + 1]) < lt) k++;
      const q = n > 2 ? Math.min(1, Math.max(0, (lt - Math.log(b.t[k])) / (Math.log(b.t[k + 1]) - Math.log(b.t[k])))) : 0, k1 = Math.min(n - 1, k + 1);
      lL += p * (b.lL[k] + q * (b.lL[k1] - b.lL[k])); lR += p * (b.lR[k] + q * (b.lR[k1] - b.lR[k]));
    }
  }
  const L = Math.exp(lL), R = Math.exp(lR);
  return { L, R, T: Math.pow((L * LSOLE) / (PI4 * (R * RSOLE) ** 2 * K.sigma), 0.25), vita: Infinity, Tc: NaN, densitaCentro: NaN, cno: 0, nucleoConvettivo: 1, involucroConvettivo: 1, idrogenoCentro: NaN, struttura: 'tutta convettiva', eddington: 0, eta: anni, finita: false, nanaBruna: true };
}

// il nucleo di elio che la stella si ritrova quando al centro l'idrogeno finisce (in masse solari)
export function nucleoElio(Msol, { Z = 1 } = {}) {
  let s = 0; const lm = Math.log(Msol);
  for (const [r, w] of pesiZ(Z)) { const x = Math.max(lm, r.lnM[0]), i = posto(r.lnM, x), u = (x - r.lnM[i]) / (r.lnM[i + 1] - r.lnM[i]); s += w * ((1 - u) * r.tr[i].mHe + u * r.tr[i + 1].mHe); }
  return Math.min(1, Math.max(0, s)) * Msol;
}

// CHE COSA DIVENTA quando muore, e quanto è forte il suo campo (il flusso magnetico si conserva mentre si contrae:
// B·R² costante). Stessa forma della vecchia fine() di leggi.js, più nucleoElio.
export function fine(Msol, B0 = 1e-4, { Z = 1 } = {}) {
  const Rs = stella(Msol, { Z }).R * RSOLE, Mc = massaChandrasekhar() / MSOLE, He = nucleoElio(Msol, { Z });
  if (He < Mc) { // il nucleo può farsi reggere dagli elettroni degeneri: perde gli strati esterni e resta una nana bianca
    const seg = DATI.massaFinale.find((s) => Msol < s[0]), Mr = Math.min(Msol, 0.98 * Mc, seg[1] * Msol + seg[2]), R = raggioNanaBianca(Mr * MSOLE);
    return { tipo: 'nana bianca', massa: Mr, raggio: R, B: B0 * (Rs / R) ** 2, supernova: false, nucleoElio: He };
  }
  if (He < DATI.elioBucoNero) { // il nucleo brucia fino al ferro e collassa: una supernova, e resta una stella di neutroni
    // la massa: quella di Chandrasekhar (il nucleo di ferro cede quando la supera), meno l'energia di legame
    // gravitazionale che se ne va in neutrini (3/5·G·M²/R, sfera omogenea)
    const Mb = Mc * MSOLE, R = raggioNeutroni(Mb), Mg = Mb * (1 - (0.6 * K.G * Mb) / (R * K.c ** 2));
    return { tipo: Mg < massaMassimaNeutroni() ? 'stella di neutroni' : 'buco nero', massa: Mg / MSOLE, raggio: raggioNeutroni(Mg), B: B0 * (Rs / raggioNeutroni(Mg)) ** 2, supernova: true, nucleoElio: He };
  }
  // l'esplosione non riesce a liberarsi del nucleo: ricade tutto, e resta un buco nero con la massa del nucleo di elio
  return { tipo: 'buco nero', massa: He, raggio: (2 * K.G * He * MSOLE) / K.c ** 2, B: 0, supernova: true, nucleoElio: He };
}

// la composizione di una stella che nasce con Z metalli (in unità solari): l'elio cresce con i metalli, dal valore del
// Big Bang a quello del Sole (le stelle che fanno i metalli fanno anche elio)
export function composizione(Z = 1) { const Zm = Z * DATI.ZSOLE, Y = DATI.YPRIMO + ((DATI.YSOLE - DATI.YPRIMO) / DATI.ZSOLE) * Zm; return { X: 1 - Y - Zm, Y, Zm }; }

// i pezzi, per i test e per chi vuole guardare dentro
export const dentro = { valuta, equilibrio, traccia, raffreddamento, cercaMinima, riga, temperatura, energia, opacita, entropiaFoto, entropiaInterno, elettroni, sigmaV, membro, degenerazione, laneEmden, C_ES, C_FF, SIGMA_T, A_RAD, NG, Z_NODI, M_NODI, B, CONTA };
