// vuoto_sistema.js — CHE COSA C'È TRA I PIANETI, e ciò che un sistema manda tra le stelle (parti «c» e «d» di vuoto.js:
// leggi lì l'intestazione generale).
//
// Niente qui è messo a mano. Ciò che il disco ha lasciato dove non si sono formati pianeti viene da disco.js
// (formaPianeti: `formazione.orfani`, `formazione.cibo`, `formazione.mIso`; disco(): `sigmaSolidi`, `rOut`), e la sua
// storia (quanto ne resta oggi, quanto è finito in polvere, quanto è stato scagliato fuori, quanti proiettili cadono
// oggi su ogni pianeta) da impatti.js (storiaImpatti: `bilancio`, `attesi`, `popolazione`): È LA STESSA FONTE dei
// crateri (regola 7). Qui si aggiunge: dove stanno le fasce e dove le risonanze le svuotano, la distribuzione delle
// taglie fuori da ciò che impatti.js simula, la nube esterna di comete, le comete attive con chioma e code, la polvere
// che scende a spirale, il vento della stella (risalita.js), e i corpi uno per uno con le loro orbite (orbite.js).
//
// LEGGI DERIVATE QUI [D] (i conti sono accanto alle funzioni):
//   · la pendenza di una cascata di collisioni: dN/dD ∝ D^−p con p = (7 + s/3)/(2 + s/3), s la pendenza della
//     resistenza Q*(D) ∝ D^s. Con s = 0 è il 3,5 di Dohnanyi (1969); con le due pendenze di Benz & Asphaug che
//     impatti.js già usa (IMPATTI.rottura) viene 3,66 sotto qualche centinaio di metri e 3,04 sopra (O'Brien & Greenberg 2003);
//   · la nube esterna: una cometa scagliata da un pianeta diffonde in energia finché la marea della galassia non le
//     alza il perielio fuori dalla portata dei pianeti; dove i due tempi sono uguali comincia la nube; finisce dove la
//     marea vince la stella. Quanta parte ci resta invece di uscire: (1/a_interno)/(calcio del pianeta), al più 1;
//   · quando una cometa si accende: dove metà della luce assorbita al punto sotto la stella va in vapore;
//   · β = spinta della luce / gravità = 3·L·Q/(16π·G·M·c·ρ·a); il tempo di Poynting–Robertson c·r²/(4·G·M·β);
//   · il più vicino, gli incontri tra stelle: n·σ·v con il fuoco gravitazionale.
// DATI MISURATI O PRESI (usati così; i numeri in SISTEMA): il calcio in energia che un pianeta dà a una cometa (Duncan,
// Quinn & Tremaine 1987), i coefficienti delle risonanze (Murray & Dermott 1999), l'albedo di un nucleo di cometa, la
// vita di una molecola d'acqua alla luce del Sole (Huebner et al. 1992), il profilo della nube (r^−3,5: Duncan et al.).
// CHE COSA MANCA (dichiarato; vedi anche vuoto.js):
//   · disco.js non restituisce i corpi rimasti sotto la soglia di «pianeta» (0,02 Terre) né i loro resti: qui la FASCIA
//     ESTERNA è ricostruita come i solidi del disco oltre la striscia dell'ultimo pianeta, e nessuno l'ha macinata
//     (impatti.js segue solo le nubi che incrociano un pianeta): viene troppo pesante;
//   · niente migrazione dei giganti (disco.js lo dichiara): la fascia esterna non è stata svuotata, come la nostra;
//   · impatti.js dà la polvere fatta in tutta la storia, non il ritmo di oggi: la polvere zodiacale usa la media;
//   · le comete periodiche (quelle che i giganti portano dentro dalla fascia esterna) non hanno orbite qui: sono nel
//     flusso dei proiettili di impatti.js, non nell'elenco; la nube esterna non è erosa dalle stelle di passaggio;
//   · le lacune delle risonanze sono tolte con la larghezza di librazione; nella fascia vera alcune risonanze (3:2) sono abitate.
import { COSTANTI, MSOLE, LSOLE, ANNO, UA, massaNascita } from './leggi.js';
import * as ST from './stelle.js';
import { DISCO, MTERRA, formaPianeti, disco as discoDi } from './disco.js';
import { storiaImpatti, IMPATTI } from './impatti.js';
import { MATERIALI } from './lune.js';
import { LEGGI_ANELLI, sublimazione } from './anelli.js';
import { statoKeplero, periodo, assiOrbita, ORBITE } from './orbite.js';
import { ventoStellare, DATI as RISALITA } from './risalita.js';
import { sorgente, logEsatto } from './eventi.js';
import { cinematica, popolazione, ANELLI, dentro as GAL } from './galassie.js';
import { quadro, coloreVero, KPC, PC } from './vuoto_mezzo.js';

const K = COSTANTI, G = K.G, PI = Math.PI, PI4 = 4 * PI, PI2 = 2 * PI;
const stringi = (x, a, b) => Math.max(a, Math.min(b, x));
export const SISTEMA = Object.freeze({
  calcio: 10, // [R] il calcio in energia (1/a) che un pianeta dà a ogni passaggio a una cometa che arriva fin da lui: ~10·(M_p/M★)/a_p (Duncan, Quinn & Tremaine 1987, AJ 94, 1330; Tremaine 1993)
  nube: -3.5, // [R] la densità della nube esterna cala come r^−3,5 (Duncan, Quinn & Tremaine 1987): dN/da ∝ a^−1,5
  densitaSole: (0.1 * MSOLE) / PC ** 3, // [R] la materia attorno al Sole, 0,10 M☉/pc³ (Holmberg & Flynn 2000): SOLO se non si dice in che punto di quale galassia sta il sistema
  // le risonanze di moto medio: [nome, p, q (giri del corpo : giri del pianeta = p:q), ordine, α·f_d]. I coefficienti: Murray & Dermott 1999, tab. 8.5 e app. B [R]; dove mancano (null) si dà solo il posto
  risonanze: [['2:1', 2, 1, 1, 0.75], ['3:2', 3, 2, 1, 1.546], ['4:3', 4, 3, 1, 2.345], ['3:1', 3, 1, 2, 0.2875], ['5:3', 5, 3, 2, 2.33], ['5:2', 5, 2, 3, null], ['7:3', 7, 3, 4, null]],
  cometa: { albedo: 0.04, densita: 500, emissivita: 0.9 }, // [R] i nuclei visitati dalle sonde (1P/Halley, 67P): albedo 0,04, densità ~500 kg/m³
  vitaAcqua: 8.3e4, vitaIone: 1e6, // [R] (s, a 1 UA dal Sole) una molecola d'acqua regge 8·10⁴ s alla luce ultravioletta prima di spezzarsi; uno ione CO⁺ nasce in ~10⁶ s (Huebner, Keady & Lyon 1992)
  righe: { C2: 516.5, COpiu: 426.0 }, // [R] (nm) la banda di Swan del C₂ (il verde della chioma) e la banda più forte del CO⁺ (l'azzurro della coda di ioni)
  granoTipico: 1e-4, pressioneLuce: 1, // (m) il grano che porta la luce zodiacale, ~100 µm (Grün et al. 1985) [R]; Q della pressione di radiazione per un grano grande = 1
  oumuamua: 100, // (m) la taglia di 1I/'Oumuamua (~100–200 m: Meech et al. 2017): la soglia per contare gli oggetti interstellari
});
const SS = SISTEMA;

// ---------- LA CASCATA DI COLLISIONI [D]
// A regime la massa che attraversa ogni taglia è la stessa. Un corpo di diametro D è rotto da proiettili di almeno
// D_p con ½·m_p·v² = Q*(D)·m, cioè D_p ∝ D·Q*^(1/3) ∝ D^(1+s/3). La massa per intervallo logaritmico è ∝ D^(4−p); ogni
// corpo è rotto con ritmo ∝ N(>D_p)·D² ∝ D^((1+s/3)(1−p))·D². Flusso costante: 6 − p + (1+s/3)(1−p) = 0, da cui
// p = (7 + s/3)/(2 + s/3). Con Q* che non dipende dalla taglia (s = 0): 7/2.
export const esponenteCascata = (s = 0) => (7 + s / 3) / (2 + s / 3);
// la distribuzione delle taglie di una fascia di massa M (kg) e materiale dato: i corpi nati grandi (IMPATTI.planetesimo,
// 100 km) e sotto di loro la coda della cascata, con le due pendenze della resistenza di impatti.js e il passaggio dove
// la gravità comincia a tenere insieme i frammenti (dove le due leggi di Q* si incrociano). La massa fissa quanti sono.
export function taglie(massaKg, materiale = 'roccia') {
  const r = IMPATTI.rottura[materiale], rho = MATERIALI[materiale].densita, D0 = IMPATTI.planetesimo, pG = esponenteCascata(r.b), pS = esponenteCascata(r.a);
  const Dt = 2 * 0.01 * Math.pow(r.q0 / (r.B * rho), 1 / (r.b - r.a)), m0 = (PI / 6) * rho * D0 ** 3; // (i raggi di Benz & Asphaug sono in cm)
  // N(>D) = N₀·(D/D₀)^(1−pG) tra Dt e D₀; sotto Dt continua con pS. La massa della coda, in unità di N₀·m₀: [D]
  const coda = ((pG - 1) / (4 - pG)) * (1 - Math.pow(Dt / D0, 4 - pG)) + ((pS - 1) / (4 - pS)) * Math.pow(Dt / D0, 4 - pG), N0 = massaKg / (m0 * (1 + coda)), Nt = N0 * Math.pow(Dt / D0, 1 - pG);
  const sopra = (D) => (D >= D0 ? (D > D0 ? 0 : N0) : D >= Dt ? N0 * Math.pow(D / D0, 1 - pG) : Nt * Math.pow(D / Dt, 1 - pS));
  const diametro = (N) => (N <= N0 ? D0 : N <= Nt ? D0 * Math.pow(N / N0, 1 / (1 - pG)) : Dt * Math.pow(N / Nt, 1 / (1 - pS))); // il diametro sopra il quale ce ne sono N
  return { massaKg, materiale, densita: rho, natiGrandi: N0, D0, passaggio: Dt, pendenze: { forza: pS, gravita: pG, dohnanyi: esponenteCascata(0) }, sopra, diametro, massaDi: (D) => (PI / 6) * rho * D ** 3 };
}

// QUANTO IN FRETTA SI MACINA UNA FASCIA [D]. I corpi più grandi (D₀) sono rotti da chi porta almeno l'energia Q*(D₀) per
// chilo: D_p = D₀·(2Q*/v²)^(1/3), con v = v_K·√(5e²/4 + i²) la velocità con cui si incontrano due corpi di uno sciame
// (Lissauer & Stewart 1993) [R] e Q* quella di impatti.js. Il tempo tra due urti così: volume / (N(>D_p)·sezione·v).
// A regime la massa che i grandi perdono scende lungo la cascata ed esce come polvere: Ṁ = M / t. Se D_p > D₀ nessuno
// è abbastanza grosso e veloce: la fascia è fredda e non si macina.
function macina(f, mu, massaKg = f.oggiKg, ecc = f.e) {
  const tg = massaKg === f.oggiKg ? f.taglie : taglie(massaKg, f.materiale), r = IMPATTI.rottura[f.materiale], vK = Math.sqrt(mu / f.a), inc = ORBITE.ripartizione * ecc, v = vK * Math.sqrt(1.25 * ecc * ecc + inc * inc), cm = 50 * tg.D0, Qs = r.q0 * Math.pow(cm, r.a) + r.B * tg.densita * Math.pow(cm, r.b);
  const V = PI2 * f.a * (f.a2 - f.a1) * 2 * f.a * Math.sin(Math.min(1, inc)), Dp = tg.D0 * Math.cbrt((2 * Qs) / (v * v));
  if (!(Dp < tg.D0) || !(tg.natiGrandi >= 1)) return { volume: V, velocitaUrti: v, tempoUrti: Infinity, polvereKgS: 0 };
  const t = V / (tg.sopra(Dp) * PI * (0.5 * (tg.D0 + Dp)) ** 2 * v); return { volume: V, velocitaUrti: v, tempoUrti: t / ANNO, polvereKgS: massaKg / t };
}

// ---------- IL SISTEMA VISTO DA QUI
const stellaDi = (Sis) => {
  const s = Sis.stella || {}, M = (s.massa || 1) * MSOLE, viva = !s.stato || s.stato === 'in vita' || s.stato === 'gigante rossa', p0 = (Sis.pianeti || [])[0];
  const Lw = p0?.Lw ?? (viva ? ST.stella(s.massa || 1, { Z: s.Z ?? 1, eta: s.eta }).L * LSOLE : 0), T = s.T > 0 ? s.T : viva ? ST.stella(s.massa || 1, { Z: s.Z ?? 1, eta: s.eta }).T : 0;
  return { M, Lw, T, eta: s.eta ?? 4.5e9, Z: s.Z ?? 1, massa: s.massa || 1, massaNascita: s.massaNascita || s.massa || 1, viva };
};
// la storia degli impatti di un pianeta: quella di cosmo.js (p.impatti, calcolata una volta) se c'è; se il sistema è
// fatto a mano (le prove), la stessa funzione con la sorgente del pianeta sotto quella data
const storie = new WeakMap();
function storiaDi(Sis, p, caso) {
  let m = storie.get(Sis); if (!m) storie.set(Sis, (m = new Map())); if (m.has(p)) return m.get(p);
  let v = null; try { v = Object.getOwnPropertyDescriptor(p, 'impatti') ? p.impatti : storiaImpatti(p, Sis, caso.sotto(`pianeta ${p.id}`)); } catch { v = null; }
  m.set(p, v); return v;
}
const schedaPianeta = (p, Mst) => { const aM = p.aM ?? p.aUA * UA, vK = Math.sqrt((G * Mst) / aM), vf = Math.sqrt((2 * G * p.massaKg) / p.raggioM); return { p, aM, aUA: aM / UA, mu: p.massaKg / Mst, vK, vf, fionda: (vf * vf) / (2 * vK * vK), hill: aM * Math.cbrt(p.massaKg / (3 * Mst)) }; };

// ---------- LE RISONANZE di un pianeta dentro una fascia tra a1 e a2 (metri) [D: terza legge di Keplero; larghezza: pendolo]
// La larghezza di librazione: δa/a = √(16·μ·(α f_d)·e^|q| / 3) (Murray & Dermott 1999, eq. 8.76, senza il termine di
// pressione), con e l'eccentricità tipica della fascia. Dove il coefficiente manca: null.
export function risonanzeIn(a1, a2, pianeti, eTipica = 0.1) {
  const out = [];
  for (const s of pianeti) for (const [nome, p, q, ordine, af] of SS.risonanze) for (const dentro of [true, false]) {
    const a = s.aM * Math.pow(dentro ? q / p : p / q, 2 / 3); if (a < a1 || a > a2) continue;
    out.push({ nome: dentro ? nome : `${q}:${p}`, con: s.p.id, aM: a, aUA: a / UA, ordine, larghezza: af == null ? null : a * Math.sqrt((16 * s.mu * af * Math.pow(eTipica, ordine)) / 3), interna: dentro });
  }
  return out.sort((x, y) => x.aM - y.aM);
}

// ---------- LA NUBE ESTERNA DI COMETE [D]
// rho: la densità di materia attorno al sistema (kg/m³: stelle e gas della galassia in quel punto). Per un pianeta che
// scaglia (scheda s): dove comincia la nube e che parte dei corpi scagliati ci resta.
function nubeDa(s, Mst, rho, eta = 4.5e9) {
  const Dx = (SS.calcio * s.mu) / s.aM; // il calcio in 1/a (per metro) a ogni passaggio
  // la cometa diffonde in energia in t_d = P(a)·(1/(a·Dx))²; la marea della galassia le cambia il momento angolare di
  // quanto serve a staccare il perielio dal pianeta in t_q = √(2GM·a_p)/(4πGρ·a²). Uguali a: a = [GM·√(2a_p)·Dx²/(8π²Gρ)]^(2/3)
  // e la marea deve averne avuto il tempo nell'età del sistema: t_q(a) ≤ età → a ≥ √(√(2GM·a_p)/(4πGρ·età)) (un pianeta
  // piccolo dà calci piccoli: la sua cometa sale piano e arriva nella nube tutta, ma solo da dove la marea ha già lavorato)
  const aPari = Math.pow((G * Mst * Math.sqrt(2 * s.aM) * Dx * Dx) / (8 * PI * PI * G * rho), 2 / 3), aEta = Math.sqrt(Math.sqrt(2 * G * Mst * s.aM) / (PI4 * G * rho * eta * ANNO)), aIn = Math.max(aPari, aEta);
  return { aIn, aPari, aEta, calcio: Dx, resta: Math.min(1, 1 / (aIn * Dx)) };
}
// il bordo esterno: dove la marea vince la stella, (M/4πρ)^(1/3); e da dove il «cono di perdita» è sempre pieno (la
// marea sposta il perielio di più di q in un giro): a^3,5 = GM·√(2q)/(8π²Gρ)
const bordoNube = (Mst, rho) => Math.cbrt(Mst / (PI4 * rho));
const conoPieno = (Mst, rho, q) => Math.pow((G * Mst * Math.sqrt(2 * q)) / (8 * PI * PI * G * rho), 1 / 3.5);

// ---------- UNA COMETA ALLA LUCE DELLA STELLA
// la temperatura del punto sotto la stella e quanta acqua sublima lì (kg/m²/s): (1−A)·L/(4πr²) = ε·σ·T⁴ + Z(T)·calore,
// con Z(T) dalla pressione di vapore del ghiaccio (anelli.js `sublimazione`, la stessa legge degli anelli) [D]
export function sublimaA(rM, Lw) {
  const c = SS.cometa, F = ((1 - c.albedo) * Lw) / (PI4 * rM * rM), Zdi = (T) => sublimazione(T) * MATERIALI.ghiaccio.densita; let lo = 20, hi = 600;
  for (let k = 0; k < 50; k++) { const T = 0.5 * (lo + hi); if (c.emissivita * K.sigma * T ** 4 + Zdi(T) * LEGGI_ANELLI.calore < F) lo = T; else hi = T; }
  const T = 0.5 * (lo + hi), Zs = Zdi(T); return { T, flusso: Zs, inVapore: F > 0 ? (Zs * LEGGI_ANELLI.calore) / F : 0 };
}
// la distanza a cui una cometa si accende: dove metà della luce assorbita va in vapore
export function distanzaAttiva(Lw) { let lo = 0.01 * UA, hi = 100 * UA; for (let k = 0; k < 50; k++) { const m = Math.sqrt(lo * hi); if (sublimaA(m, Lw).inVapore > 0.5) lo = m; else hi = m; } return Math.sqrt(lo * hi); }
// β di un grano di raggio a (m) e densità rho attorno a una stella di luminosità Lw e massa Mst [D]
export const betaGrano = (a, Lw, Mst, rho = MATERIALI.roccia.densita, Q = SS.pressioneLuce) => (3 * Lw * Q) / (16 * PI * G * Mst * K.c * rho * a);
// il tempo in cui un grano su un'orbita tonda di raggio r scende a spirale sulla stella (Poynting 1903, Robertson 1937;
// Wyatt & Whipple 1950): t = c·r²/(4·G·M·β) (secondi) [D]
export const tempoPR = (rM, beta, Mst) => (K.c * rM * rM) / (4 * G * Mst * beta);
// dove finisce un grano lasciato da un corpo (stato: pos, vel) dopo tau secondi, se la luce gli toglie la parte β della
// gravità: due corpi con G·M·(1−β), integrati (Runge–Kutta 4) [D]
function granoDopo(stato, tau, mu, beta, passi = 24) {
  const m = mu * (1 - beta), h = tau / passi, acc = (p) => { const r = Math.hypot(p[0], p[1], p[2]), k = -m / (r * r * r); return [k * p[0], k * p[1], k * p[2]]; }; let p = stato.pos.slice(), v = stato.vel.slice();
  const piu = (a, b, s) => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2]];
  for (let i = 0; i < passi; i++) { const a1 = acc(p), p2 = piu(p, v, h / 2), v2 = piu(v, a1, h / 2), a2 = acc(p2), p3 = piu(p, v2, h / 2), v3 = piu(v, a2, h / 2), a3 = acc(p3), p4 = piu(p, v3, h), v4 = piu(v, a3, h), a4 = acc(p4);
    p = [0, 1, 2].map((d) => p[d] + (h / 6) * (v[d] + 2 * v2[d] + 2 * v3[d] + v4[d])); v = [0, 1, 2].map((d) => v[d] + (h / 6) * (a1[d] + 2 * a2[d] + 2 * a3[d] + a4[d])); }
  return p;
}
// la chioma e le code di un nucleo di diametro D (m) nello stato dato (pos, vel rispetto alla stella), al tempo t
export function chiomaECode(D, stato, st, el = null, t = 0) {
  const r = Math.hypot(...stato.pos), s = sublimaA(r, st.Lw), versoStella = stato.pos.map((x) => -x / r), luce = st.Lw / LSOLE / (r / UA) ** 2;
  // quanta acqua: il ritmo al punto sotto la stella per la sezione del nucleo (kg/s); il gas esce alla velocità termica
  const gas = s.flusso * PI * (D / 2) ** 2, vGas = Math.sqrt((8 * K.kB * s.T) / (PI * 18 * K.mp)), attiva = s.inVapore > 0.5;
  if (!attiva) return { attiva: false, T: s.T, acquaKgS: gas, distanza: r };
  // la chioma: fin dove una molecola arriva prima che la luce la spezzi (la vita cala come la luce cresce)
  const chioma = (vGas * SS.vitaAcqua) / luce, vV = RISALITA.VELOCITA_VENTO;
  // la coda di ioni: gli ioni sono presi dal vento della stella (la sua velocità: risalita.js) e portati via dritti,
  // lungo il vento VISTO DALLA COMETA (per questo resta un po' indietro rispetto alla direzione opposta alla stella) [D];
  // `lunghezza` è quanto il vento percorre nella vita di una molecola d'acqua a quella distanza: un ORDINE DI GRANDEZZA,
  // non un bordo (la coda sfuma: dove la si smette di vedere dipende da chi guarda)
  const w = [0, 1, 2].map((d) => -versoStella[d] * vV - stato.vel[d]), wn = Math.hypot(...w), ioni = { direzione: w.map((x) => x / wn), lunghezza: (vV * SS.vitaAcqua) / luce, scarto: (Math.acos(stringi(-(w[0] * versoStella[0] + w[1] * versoStella[1] + w[2] * versoStella[2]) / wn, -1, 1)) * 180) / PI,
    emette: { righe: [{ nome: 'CO⁺', nm: SS.righe.COpiu, W: null }], colore: coloreVero([{ nm: SS.righe.COpiu, W: 1 }]).rgb } };
  // la coda di polvere: grani lasciati nei giorni passati; la luce toglie loro la parte β della gravità e restano
  // indietro su orbite più larghe. Per tre taglie (1, 10, 100 µm) i punti dove stanno i grani lasciati da 1 a 30 giorni fa
  const mu = G * st.M, polvere = [1e-6, 1e-5, 1e-4].map((a) => { const beta = betaGrano(a, st.Lw, st.M), punti = [];
    if (el) for (const giorni of [3, 10, 30]) { const tau = giorni * 86400, prima = statoKeplero(el, t - tau), dove = granoDopo(prima, tau, mu, Math.min(beta, 0.999)); punti.push({ giorni, pos: dove, dalNucleo: Math.hypot(dove[0] - stato.pos[0], dove[1] - stato.pos[1], dove[2] - stato.pos[2]) }); }
    return { raggioGrano: a, beta, soffiato: beta > 0.5, punti }; });
  return { attiva: true, T: s.T, distanza: r, acquaKgS: gas, molecoleS: gas / (18 * K.mp), velocitaGas: vGas, chioma: { raggio: chioma, emette: { righe: [{ nome: 'C₂', nm: SS.righe.C2, W: null }], colore: coloreVero([{ nm: SS.righe.C2, W: 1 }], st.T > 0 ? { T: st.T, W: 0.3 } : null).rgb } },
    codaIoni: ioni, codaPolvere: { grani: polvere, direzione: versoStella.map((x) => -x), colore: st.T > 0 ? coloreVero([], { T: st.T, W: 1 }).rgb : null, emette: 'la luce della stella diffusa dai grani' } };
}

// ---------- IL VENTO DELLA STELLA a una distanza (risalita.js: la stessa legge che toglie l'aria ai pianeti)
export function ventoA(Sis, rM) {
  const st = stellaDi(Sis); if (!st.viva || !(st.Lw > 0)) return { protoni: 0, velocita: 0, flussoMassa: 0 };
  const v = ventoStellare({ stella: { Lw: st.Lw, aM: rM }, etaPianeta: st.eta }, { stella: { massa: st.massa, T: st.T, eta: st.eta } });
  return v ? { protoni: v.flussoMassa / RISALITA.VELOCITA_VENTO / K.mp, velocita: RISALITA.VELOCITA_VENTO, flussoMassa: v.flussoMassa, pressione: v.pressione, perditaStella: v.perditaStella } : { protoni: 0, velocita: 0, flussoMassa: 0 };
}

// =====================================================================================================
// corpiMinori: tutto ciò che gira attorno a una stella e non è un pianeta né una luna
// =====================================================================================================
// Sis: il sistema di cosmo.js (sistema(n, gid, sid): { stella, pianeti, disco }) o uno fatto con le stesse funzioni;
// t: secondi da oggi; opz: { caso (la sorgente del sistema: «cosmo 1/galassia 3/stella 53»), attorno (kg/m³: la materia
// della galassia lì; se manca, quella attorno al Sole, e lo dice), massimo (corpi elencati per fascia), diametroMin (m) }.
// → { fasce: [{ nome, origine, materiale, a1, a2 (m), inizioKg, oggiKg, taglie, risonanze, corpi(n) }], nube, comete,
//     polvere, vento(rM), flusso: [per pianeta], espulso, corpi: [i più grandi di ogni fascia, con orbita e stato a t] }
const fatti = new WeakMap();
export function corpiMinori(Sis, t = 0, { caso = sorgente('sistema'), attorno = null, massimo = 40, diametroMin = 1e3 } = {}) {
  const st = stellaDi(Sis), Mst = st.M, mu = G * Mst, c0 = caso.sotto('vuoto'), rho = attorno ?? SS.densitaSole;
  let F = fatti.get(Sis); if (F && F.rho !== rho) F = null;
  if (!F) { // ---- ciò che non dipende dal tempo: una volta per sistema
    const sk = (Sis.pianeti || []).map((p) => schedaPianeta(p, Mst)), imp = sk.map((s) => storiaDi(Sis, s.p, caso)), fasce = [];
    // (a) LE FASCE ORFANE: i sassi rimasti di un corpo scacciato (formazione.orfani); la massa di oggi è quella che impatti.js
    // ha seguito (bilancio.fasce: «fascia r.k»), se la fascia arriva a un pianeta; se no resta quella iniziale
    const diImpatti = new Map(); for (const b of imp) for (const f of b?.bilancio?.fasce || []) if (!diImpatti.has(f.da)) diImpatti.set(f.da, f);
    sk.forEach((s) => (s.p.formazione?.orfani || []).forEach((o, k) => {
      const nome = `fascia ${s.p.id}.${k}`, f = diImpatti.get(nome), a = o.aUA * UA, vK = Math.sqrt(mu / a), Ro = Math.cbrt((3 * o.massaKg) / (PI4 * MATERIALI[o.ghiaccio > 0.3 ? 'ghiaccio' : 'roccia'].densita)), vf = Math.sqrt((2 * G * o.massaKg) / Ro), fi = (vf * vf) / (2 * vK * vK);
      const inizio = f ? f.inizioKg : (o.ciboKg || 0) + (o.massaKg * fi * fi) / (1 + fi * fi), e = Math.min(DISCO.eMax, vf / vK); // (se impatti.js non l'ha vista: la sua stessa stima, riscritta)
      fasce.push({ nome, origine: `i sassi rimasti orfani di un corpo di ${(o.massaKg / MTERRA).toFixed(2)} Terre che il pianeta ${s.p.id} ha scacciato ${o.dentro ? 'verso la stella' : 'fuori'}`, materiale: o.ghiaccio > 0.3 ? 'ghiaccio' : 'roccia', a: a, a1: a * (1 - e), a2: a * (1 + e), e, inizioKg: inizio, oggiKg: f ? f.oggiKg : inizio, polvereKg: f?.polvereKg ?? 0, seguita: !!f, da: s.p.id });
    }));
    // (b) I RESTI ATTORNO AI PIANETI LENTI: il cibo che un embrione non ha finito (impatti.js: rimastaKg + daRilasciareKg)
    sk.forEach((s, i) => { const b = imp[i]?.bilancio; if (!b) return; const m = (b.rimastaKg || 0) + (b.daRilasciareKg || 0); if (!(m > 0)) return;
      const meta = DISCO.C * s.aM * Math.cbrt((s.p.formazione?.mIso ?? s.p.massaKg) / (3 * Mst)), ghiaccio = s.p.tipo !== 'roccioso';
      fasce.push({ nome: `resti del pianeta ${s.p.id}`, origine: `la striscia di disco che il pianeta ${s.p.id}, cresciuto piano, non ha finito di mangiare`, materiale: ghiaccio ? 'ghiaccio' : 'roccia', a: s.aM, a1: Math.max(0.5 * s.aM, s.aM - meta), a2: s.aM + meta, e: Math.min(DISCO.eMax, s.vf / s.vK), caldaKg: b.rimastaKg || 0 /* la parte che il pianeta ha già rimescolato; il resto (daRilasciareKg) gira ancora tondo, lontano da lui */, inizioKg: b.restiKg || m, oggiKg: m, polvereKg: b.polvereKg || 0, seguita: true, da: s.p.id, popolazione: imp[i].popolazione }); });
    // (c) LA FASCIA ESTERNA: i solidi del disco oltre la striscia dell'ultimo pianeta (disco.js: sigmaSolidi fino a rOut).
    // Lì gli embrioni sono rimasti sotto la soglia di pianeta: disco.js non li restituisce (che cosa manca a monte)
    const D = Sis.disco; if (D && sk.length) { const u = sk[sk.length - 1], r1 = (u.aM + DISCO.C * u.aM * Math.cbrt((u.p.formazione?.mIso ?? u.p.massaKg) / (3 * Mst))) / UA, r2 = D.rOut;
      if (r2 > r1) { let m = 0; const n = 60, h = Math.log(r2 / r1) / n; for (let i = 0; i < n; i++) { const r = r1 * Math.exp((i + 0.5) * h); m += PI2 * r * UA * D.sigmaSolidi(r) * r * UA * h; }
        fasce.push({ nome: 'fascia esterna', origine: 'i solidi del disco oltre l\'ultimo pianeta: corpi rimasti piccoli e ciò che non hanno mangiato', materiale: 'ghiaccio', a: 0.5 * (r1 + r2) * UA, a1: r1 * UA, a2: r2 * UA, e: (0.5 * IMPATTI.planetesimo * Math.sqrt((8 * PI * G * MATERIALI.ghiaccio.densita) / 3)) / Math.sqrt(mu / (0.5 * (r1 + r2) * UA)) /* nessun pianeta la rimescola: solo i suoi corpi più grandi, con la loro velocità di fuga (Safronov) */, inizioKg: m, oggiKg: m, polvereKg: 0, seguita: false, da: null }); } }
    for (const f of fasce) f.taglie = taglie(f.oggiKg, f.materiale);
    const esaurite = fasce.filter((f) => !(f.taglie.sopra(diametroMin) >= 1)).map((f) => ({ nome: f.nome, inizioKg: f.inizioKg, oggiKg: f.oggiKg })); // macinate o spazzate: meno di un corpo sopra la taglia minima
    for (let i = fasce.length - 1; i >= 0; i--) if (!(fasce[i].taglie.sopra(diametroMin) >= 1)) fasce.splice(i, 1);
    for (const f of fasce) { // le taglie, le risonanze, la zona caotica dei pianeti (Wisdom 1980: 1,3·μ^(2/7), lo stesso numero di anelli.js)
      f.risonanze = risonanzeIn(f.a1, f.a2, sk, Math.max(f.e, 0.01));
      f.vuoti = [...f.risonanze.filter((x) => x.larghezza > 0 && x.ordine <= 2).map((x) => [x.aM - x.larghezza, x.aM + x.larghezza, x.nome]), ...sk.filter((s) => f.da !== s.p.id || !f.nome.startsWith('resti')).map((s) => [s.aM * (1 - LEGGI_ANELLI.caotica * Math.pow(s.mu, 2 / 7)), s.aM * (1 + LEGGI_ANELLI.caotica * Math.pow(s.mu, 2 / 7)), `pianeta ${s.p.id}`])];
      f.eFredda = (0.5 * IMPATTI.planetesimo * Math.sqrt((8 * PI * G * MATERIALI[f.materiale].densita) / 3)) / Math.sqrt(mu / f.a); // chi non è rimescolato da un pianeta ha solo la velocità di fuga dei suoi corpi più grandi (Safronov)
      Object.assign(f, f.caldaKg != null ? macina(f, mu, Math.max(f.caldaKg, 1e-300), f.e) : macina(f, mu)); f.sopra1km = f.taglie.sopra(1e3); f.distanzaTraCorpi = f.sopra1km > 0 ? Math.cbrt(f.volume / f.sopra1km) : Infinity;
    }
    // LA NUBE ESTERNA E CIÒ CHE ESCE: ogni pianeta scaglia (impatti.js: scagliataKg); una parte resta nella nube, il resto è perso tra le stelle
    let inNube = 0, fuori = 0, aIn = Infinity; const perPianeta = [];
    sk.forEach((s, i) => { const m = imp[i]?.bilancio?.scagliataKg || 0; if (!(m > 0)) return; const n = nubeDa(s, Mst, rho, st.eta); inNube += m * n.resta; fuori += m * (1 - n.resta); aIn = Math.min(aIn, n.aIn); perPianeta.push({ pianeta: s.p.id, scagliataKg: m, resta: n.resta, aIn: n.aIn }); });
    const aOut = bordoNube(Mst, rho), nube = inNube > 0 && aIn < aOut ? { massaKg: inNube, aIn, aOut, taglie: taglie(inNube, 'ghiaccio'), profilo: SS.nube, perPianeta } : null;
    if (nube) nube.sopra1km = nube.taglie.sopra(1e3);
    // i corpi scacciati interi (pianeti vaganti): quelli che la fionda ha mandato fuori (formazione.orfani, non «dentro»)
    const vaganti = []; sk.forEach((s) => (s.p.formazione?.orfani || []).forEach((o) => { if (!o.dentro) vaganti.push({ massaKg: o.massaKg, daUA: o.aUA, quando: o.t, ghiaccio: o.ghiaccio }); }));
    F = { rho, sk, imp, fasce, esaurite, nube, espulso: { planetesimiKg: fuori, nellaNubeKg: inNube, pianetiVaganti: vaganti, perPianeta, attornoDato: attorno != null }, rAttiva: st.Lw > 0 ? distanzaAttiva(st.Lw) : 0 };
    fatti.set(Sis, F);
  }
  // ---- I CORPI DI UNA FASCIA, dal più grande in giù (lo stesso corpo allo stesso indirizzo, quanti se ne chiedano)
  const corpiDi = (f, quanti = massimo, minimo = diametroMin) => {
    const s = c0.serie(`${f.nome}/quanti`), out = [], tot = f.taglie.sopra(minimo); let Gm = 0;
    for (let j = 0; j < quanti; j++) { Gm += -logEsatto(1 - s(j)); if (Gm >= tot) break; const o = c0.sotto(`${f.nome}/corpo ${j}`), D = f.taglie.diametro(Gm);
      // il semiasse: nella fascia, fuori dalle lacune (fino a 8 tentativi, sempre gli stessi); eccentricità e inclinazione
      // di Rayleigh con lo scarto della fascia (orbite.js: l'inclinazione metà dell'eccentricità)
      const sa = o.serie('semiasse'); let a = f.a1 + sa(0) * (f.a2 - f.a1); for (let q = 1; q < 8 && f.vuoti.some((v) => a > v[0] && a < v[1]); q++) a = f.a1 + sa(q) * (f.a2 - f.a1);
      const ef = f.caldaKg != null && o('rimescolato') >= f.caldaKg / f.oggiKg ? f.eFredda : f.e, e = Math.min(0.9, (ef / ORBITE.rayleigh) * Math.sqrt(-2 * Math.log(1 - o('eccentricità')))), i = Math.min(1.2, ((ORBITE.ripartizione * ef) / ORBITE.rayleigh) * Math.sqrt(-2 * Math.log(1 - o('inclinazione'))));
      const el = { a, e, i, nodo: PI2 * o('nodo'), peri: PI2 * o('pericentro'), M0: PI2 * o('fase'), mu }; el.assi = assiOrbita(el); const stato = statoKeplero(el, t);
      out.push({ tipo: f.materiale === 'ghiaccio' ? 'corpo ghiacciato' : 'asteroide', indirizzo: `${c0.radice}/${f.nome}/corpo ${j}`, fascia: f.nome, diametroM: D, massaKg: f.taglie.massaDi(D), elementi: el, orbita: { attorno: 'stella', a, e, inclinazione: i, assi: el.assi, periodo: periodo(el) }, pos: stato.pos, vel: stato.vel, nellaLacuna: f.vuoti.some((v) => a > v[0] && a < v[1]) }); }
    return out;
  };
  // ---- LE COMETE ATTIVE: dalla nube esterna, dove il cono di perdita è pieno, cadono con perielio a caso; quante
  // all'anno con perielio sotto q: ∫ dN/da·(2q/a)/P(a) da [D: orbite quasi paraboliche con direzioni a caso]
  let comete = null;
  if (F.nube && F.rAttiva > 0) {
    const N = F.nube, q = F.rAttiva, aP = Math.max(N.aIn, conoPieno(Mst, F.rho, q)), nTot = N.taglie.sopra(diametroMin);
    if (aP < N.aOut) { // dN/da ∝ a^−1,5 tra aIn e aOut; il ritmo ∝ a^−1,5·a^−1·a^−1,5 = a^−4
      const norma = nTot / (2 * (Math.pow(N.aIn, -0.5) - Math.pow(N.aOut, -0.5))), ritmo = (norma * 2 * q * Math.sqrt(mu) * (Math.pow(aP, -3) - Math.pow(N.aOut, -3))) / (3 * PI2) * ANNO; // per anno
      const epoca = 10, tA = t / ANNO, attive = []; // epoche di dieci anni: chi passa al perielio in quell'epoca
      for (let ep = Math.floor(tA / epoca) - 1; ep <= Math.floor(tA / epoca) + 1; ep++) {
        const nome = `cometa/epoca ${ep}`, s = c0.serie(nome); let Gm = 0;
        for (let j = 0; j < 100000; j++) { Gm += -logEsatto(1 - s(j)); if (Gm >= ritmo * epoca) break; const o = c0.sotto(`${nome}/${j}`), tPeri = (ep + o('quando')) * epoca * ANNO;
          const a = Math.pow(Math.pow(aP, -3) - o('da dove') * (Math.pow(aP, -3) - Math.pow(N.aOut, -3)), -1 / 3), qq = q * o('perielio'), e = 1 - qq / a, el = { a, e, i: Math.acos(1 - 2 * o('inclinazione')), nodo: PI2 * o('nodo'), peri: PI2 * o('pericentro'), mu };
          el.M0 = -Math.sqrt(mu / a ** 3) * tPeri; el.assi = assiOrbita(el); const stato = statoKeplero(el, t), r = Math.hypot(...stato.pos); if (r > q) continue;
          const D = Math.min(N.taglie.D0, N.taglie.diametro(nTot * Math.max(1e-12, o('taglia')))); attive.push({ tipo: 'cometa', indirizzo: `${c0.radice}/${nome}/${j}`, diametroM: D, elementi: el, orbita: { attorno: 'stella', a, e, perielio: qq, inclinazione: el.i, assi: el.assi, periodo: periodo(el) }, pos: stato.pos, vel: stato.vel, perielioTra: tPeri - t, ...chiomaECode(D, stato, st, el, t) }); }
      }
      comete = { nuoveAllAnno: ritmo, entro: q, daDove: [aP, N.aOut], attive, serbatoio: nTot };
    }
  }
  // ---- LA POLVERE che scende a spirale (luce zodiacale): quanta se ne fa (impatti.js: la polvere di tutta la storia, in
  // media sull'età: MANCA il ritmo di oggi) e quanta ce n'è, se ogni grano scende in un tempo di Poynting–Robertson
  const polvereFatta = F.imp.reduce((s, b) => s + (b?.bilancio?.polvereKg || 0), 0), ritmoPolvere = F.fasce.reduce((s, f) => s + f.polvereKgS, 0), beta = st.Lw > 0 ? betaGrano(SS.granoTipico, st.Lw, Mst) : 0;
  const polvere = { fattaInTuttoKg: polvereFatta /* impatti.js: in tutta la storia */, ritmoKgS: ritmoPolvere /* oggi, dalla cascata delle fasce che restano */, mediaKgS: polvereFatta / (st.eta * ANNO), grano: SS.granoTipico, beta,
    soffiati: st.Lw > 0 ? (3 * st.Lw * SS.pressioneLuce) / (16 * PI * G * Mst * K.c * MATERIALI.roccia.densita * 0.5) : 0 /* i grani più piccoli di così (β > ½) sono soffiati via */, tempoPR: (rM) => (beta > 0 ? tempoPR(rM, beta, Mst) / ANNO : Infinity),
    // a regime la polvere fatta più in fuori attraversa ogni raggio scendendo: ρ(r) = Ṁ/(2πr·2H·v), v = 2GMβ/(c·r), H = r·sen(i) [D]: cala come 1/r.
    // (SEMPLIFICAZIONE: nessun pianeta la ferma per strada; i grani non si rompono tra loro mentre scendono)
    densitaA: (rM) => (beta > 0 ? F.fasce.reduce((s, f) => s + (f.a > rM ? f.polvereKgS / (PI2 * rM * 2 * rM * Math.sin(Math.min(1, ORBITE.ripartizione * f.e)) * ((2 * G * Mst * beta) / (K.c * rM))) : 0), 0) : 0) };
  polvere.graniA = (rM) => polvere.densitaA(rM) / ((PI4 / 3) * MATERIALI.roccia.densita * SS.granoTipico ** 3);
  // ---- IL FLUSSO DEI PROIETTILI su ogni pianeta, OGGI: l'ultima epoca della tabella di impatti.js (la stessa dei crateri)
  const flusso = F.sk.map((s, i) => { const b = F.imp[i]; if (!b?.attesi) return { pianeta: s.p.id, perAnno: () => 0, manca: true };
    const A = b.attesi, nE = A.epoche.length - 1, dt = A.epoche[nE] - A.epoche[nE - 1], perClasse = A.diametroM.map((_, k) => A.perEpoca[k * nE + nE - 1] / dt);
    return { pianeta: s.p.id, diametroM: A.diametroM, perClasse, epoca: [A.epoche[nE - 1], A.epoche[nE]], perAnno: (D) => { let n = 0; for (let k = 0; k < perClasse.length; k++) if (A.diametroM[k] >= D) n += perClasse[k]; return n; }, velocita: A.v }; });
  const corpi = []; for (const f of F.fasce) for (const c of corpiDi(f)) corpi.push(c);
  return { stella: st, fasce: F.fasce.map((f) => ({ ...f, corpi: (n, minimo) => corpiDi(f, n, minimo) })), nube: F.nube, esaurite: F.esaurite, comete, polvere, vento: (rM) => ventoA(Sis, rM), flusso, espulso: F.espulso, corpi, rAttiva: F.rAttiva, attorno: F.rho, attornoDato: attorno != null, t };
}

// =====================================================================================================
// TRA LE STELLE: ciò che i sistemi hanno perso (oggetti interstellari, pianeti vaganti), le stelle di passaggio
// =====================================================================================================
// un sistema fatto con le funzioni di sempre (disco.js) attorno a una stella { massa, Z, eta }: quello che serve a
// impatti.js (gli stessi campi che cosmo.js sistema() dà ai pianeti). caso: la sorgente della stella
export function sistemaDi(st, caso) {
  const cd = caso.sotto('disco'), nati = formaPianeti(st, cd), M = (st.massa || 1) * MSOLE;
  return { stella: { massa: st.massa, massaNascita: st.massa, Z: st.Z ?? 1, eta: st.eta ?? 4.5e9, stato: 'in vita' }, disco: discoDi(st, cd),
    pianeti: nati.map((q, k) => Object.assign({ id: k }, q, { formazione: q.formazione, aM: q.aUA * UA, Mstella: M })) };
}
// che cosa ha perso un sistema: → { planetesimiKg (scagliati fuori per sempre), nellaNubeKg, pianetiVaganti: [...] }
export const espulsoDa = (Sis, caso, attorno = null) => corpiMinori(Sis, 0, { caso, attorno, massimo: 0 }).espulso;
// LA POPOLAZIONE VAGANTE attorno a un punto di una galassia: si fanno `campione` sistemi attorno a stelle estratte con la
// distribuzione delle masse di leggi.js (eventi «vaganti/stella j»), coi metalli dell'anello e l'età media delle stelle
// lì (galassie.js), e si conta ciò che perdono. Costa ~0,1 s a sistema: si fa una volta per anello.
// → { stellePerM3, perStella: { planetesimiKg, pianetiVaganti }, oggetti: { perM3 (se macinati dalla cascata), perM3Minimo
//     (se usciti com'erano nati, tutti da 100 km), perUA3 }, pianetiVaganti: { perM3, perStella }, campione }
const vagantiFatti = new WeakMap();
export function vaganti(forma, r = 8, { campione = 24, caso = sorgente('galassia') } = {}) {
  let k = 0; while (k < ANELLI - 1 && forma.anelli.bordo[k + 1] < r) k++;
  let m = vagantiFatti.get(forma); if (!m) vagantiFatti.set(forma, (m = new Map())); const chiave = `${k}/${campione}/${caso.radice}`; if (m.has(chiave)) return m.get(chiave);
  const Q = quadro(forma), a = Q.anello(k), C = cinematica(forma), P = popolazione(), c0 = caso.sotto(`vuoto/vaganti/anello ${k}`), eta = Math.max(1e8, C.eta[k] * 1e9);
  // quante stelle per m³ a metà del disco: la densità di stelle di galassie.js per le stelle nate per ogni M☉ che resta
  const perMassa = forma.bilancio.nate / forma.massaStelle / P.massaMedia, stellePerM3 = ((a.sigmaStelle / (2 * a.z0)) / MSOLE) * perMassa, attorno = a.sigmaStelle / (2 * a.z0) + a.sigmaGas / (2 * Q.hGas);
  let fuori = 0, nube = 0, nVag = 0, mVag = 0, conPianeti = 0; const masse = [];
  for (let j = 0; j < campione; j++) { const cs = c0.sotto(`stella ${j}`), massa = massaNascita(cs('massa')); masse.push(massa); if (massa > ST.massaMassima({ Z: a.Z }) || ST.stella(massa, { Z: a.Z }).vita < eta) continue; // (le stelle già morte non hanno più il loro sistema: SEMPLIFICAZIONE, ciò che avevano scagliato resta fuori dal conto)
    const Sis = sistemaDi({ massa, Z: a.Z, eta }, cs), e = espulsoDa(Sis, cs, attorno); fuori += e.planetesimiKg; nube += e.nellaNubeKg; nVag += e.pianetiVaganti.length; mVag += e.pianetiVaganti.reduce((s, x) => s + x.massaKg, 0); if (Sis.pianeti.length) conPianeti++; }
  const perStella = { planetesimiKg: fuori / campione, nellaNubeKg: nube / campione, pianetiVaganti: nVag / campione, massaVagantiKg: mVag / campione }, tg = taglie(Math.max(perStella.planetesimiKg, 1e-300), 'ghiaccio');
  const macinati = stellePerM3 * tg.sopra(SS.oumuamua), nati = stellePerM3 * tg.natiGrandi * (1 + 5);
  const out = { anello: k, stellePerM3, stellePerPc3: stellePerM3 * PC ** 3, attorno, perStella, oggetti: { soglia: SS.oumuamua, perM3: macinati, perUA3: macinati * UA ** 3, perM3Minimo: nati, perUA3Minimo: nati * UA ** 3 }, pianetiVaganti: { perM3: stellePerM3 * perStella.pianetiVaganti, perStella: perStella.pianetiVaganti }, campione, conPianeti, masse, eta, Z: a.Z };
  m.set(chiave, out); return out;
}
// LE STELLE DI PASSAGGIO: quante volte, in un milione di anni, un'altra stella passa a meno di b (metri) da un sistema.
// ritmo = n★·⟨v⟩·π·b²·(1 + 2G(M₁+M₂)/(b·v²)) [D: sezione d'urto con fuoco gravitazionale]; ⟨v⟩ = √(16/π)·σ per due stelle
// prese dalla stessa distribuzione di velocità di scarto σ per direzione; σ da galassie.js (cinematica: σ_R, σ_z, e
// σ_φ = σ_R·κ/2Ω dall'epiciclo)
export function incontri(forma, r = 8, b = PC, massa = 1) {
  let k = 0; while (k < ANELLI - 1 && forma.anelli.bordo[k + 1] < r) k++;
  const Q = quadro(forma), a = Q.anello(k), C = cinematica(forma), P = popolazione(), perMassa = forma.bilancio.nate / forma.massaStelle / P.massaMedia, n = ((a.sigmaStelle / (2 * a.z0)) / MSOLE) * perMassa;
  const sR = C.sigR[k] * 1e3, sZ = C.sigZ[k] * 1e3, sF = (sR * C.kappa[k]) / (2 * C.omega[k]), sigma = Math.sqrt((sR * sR + sF * sF + sZ * sZ) / 3), v = Math.sqrt(16 / PI) * sigma;
  const fuoco = 1 + (2 * G * (massa + P.massaMedia) * MSOLE) / (b * v * v), ritmo = n * v * PI * b * b * fuoco * ANNO; // all'anno
  return { stellePerM3: n, velocita: v, sigma, perMilioneDiAnni: ritmo * 1e6, fuoco, ogniAnni: 1 / ritmo, // e la più vicina mai passata in un'età: N(<b) = 1
    piuVicinaIn: (anni) => { let lo = 1e9, hi = 1e18; for (let i = 0; i < 60; i++) { const m = Math.sqrt(lo * hi); if (n * v * PI * m * m * (1 + (2 * G * (massa + P.massaMedia) * MSOLE) / (m * v * v)) * ANNO * anni < 1) lo = m; else hi = m; } return Math.sqrt(lo * hi); } };
}
export const dentroSistema = { macina, stellaDi, nubeDa, bordoNube, conoPieno, granoDopo, schedaPianeta, storiaDi };
