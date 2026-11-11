// molecole_energia.js — L'ENERGIA di una molecola qualsiasi: entalpia, entropia, energia libera, in gas e in acqua
// (vedi molecole.js per l'intestazione con le fonti).
//
// LEGGI:
//   · ENTALPIA DI FORMAZIONE (gas, 298 K) = Σ entalpie degli atomi liberi − Σ termini di legame. I termini sono: uno per
//     ogni legame (per elementi e ordine: C–H, C=O, C≡N, aromatico…), uno per ogni coppia di vicini pesanti sullo stesso
//     atomo (le interazioni «1,3» di Allen 1959: è lì che stanno la ramificazione, la stabilizzazione di un C=O da parte
//     di un alchile, la risonanza di acidi, esteri e ammidi, i doppi legami cumulati della CO2), e la tensione degli
//     anelli piccoli. I valori dei termini NON sono scritti: si ricavano ai minimi quadrati dalle entalpie MISURATE di un
//     insieme di molecole di riferimento (RIFERIMENTI, dichiarato qui sotto). Per un legame che i riferimenti non coprono
//     vale la regola di Pauling (media geometrica dei legami tra atomi uguali + 96,5·Δχ²): la «riserva»;
//   · ENTROPIA dalla meccanica statistica: traslazione (Sackur e Tetrode, dalla massa), rotazione (dai momenti
//     d'inerzia della forma e dal numero di simmetria), vibrazioni (un oscillatore per modo: gli stiramenti dalla regola
//     di Gordy 1946, i piegamenti da numeri d'onda caratteristici), rotazioni interne attorno ai legami semplici (rotore
//     libero o frenato, il minore dei due), degenerazione elettronica dei radicali;
//   · H e S a un'altra temperatura dalle stesse funzioni di partizione; G = H − T·S + RT·ln(P/1 bar);
//   · IN ACQUA: ΔG di idratazione per siti (cavità, carbonio apolare, donatori e accettori di legami a idrogeno), con i
//     coefficienti ricavati da energie di idratazione misurate (IDRATAZIONE); ioni semplici: Born; acidi e basi: pKa per
//     classe di sito + effetto induttivo dei sostituenti (ρ = 9,8 a due legami, ×0,4 a ogni legame in più) e tutti gli
//     stati di protonazione insieme (l'energia «trasformata» a un pH: è quella che decide le reazioni in acqua).
// Unità: kJ/mol, J/(mol·K), K, Pa.

import { atomo, raggioDiBorn, SIMBOLI, NUMERO } from './molecole_atomi.js';
import { molecola, chiave, anelli, grezzo, coppieSolitarie, viciniSigma, sommaLegami, carica as caricaDi, conta } from './molecole_grafo.js';
import { forma, inerzia, numeroDiSimmetria, lunghezzaLegame, dominio } from './molecole_forma.js';

export const R = 8.314462618e-3; // kJ/(mol·K)
const KB = 1.380649e-23, HP = 6.62607015e-34, NA = 6.02214076e23, UMA = 1.66053907e-27, HC_K = 1.438777; // (h·c/k in cm·K)
const LN10 = Math.LN10;

// ---------- DATI: le molecole di riferimento (ΔHf gas, 298 K, kJ/mol)
// Fonte: NIST Chemistry WebBook (SRD 69), valori di rassegna (Pedley 1994, CODATA, NIST-JANAF, Chase 1998); letti dal
// sito l'11-11-2026. Dove il WebBook elenca più misure si è preso il valore di rassegna.
export const RIFERIMENTI = [
  ['O', -241.83], ['C', -74.6], ['CC', -84.0], ['CCC', -104.7], ['CCCC', -125.6], ['CC(C)C', -134.2], ['CC(C)(C)C', -167.9], ['CCCCCC', -167.1],
  ['C1CCCCC1', -123.4], ['C1CC1', 53.3], ['C1CCC1', 28.4], ['C1CCCC1', -76.4], ['C=C', 52.47], ['CC=C', 20.41], ['CC=CC', -10.8], ['CC(C)=C', -17.9], ['C=CC=C', 108.8],
  ['C#C', 226.73], ['CC#C', 185.4], ['c1ccccc1', 82.9], ['Cc1ccccc1', 50.1],
  ['CO', -201.0], ['CCO', -234.8], ['CC(C)O', -272.8], ['CCCO', -256.0], ['COC', -184.1], ['C1CCOC1', -184.2], ['C1CO1', -52.64], ['OCCO', -389.0],
  ['C=O', -108.6], ['CC=O', -166.2], ['CC(C)=O', -217.1], ['CCC=O', -188.7], ['O=CC=O', -212.0],
  ['OC=O', -378.6], ['CC(=O)O', -433.0], ['COC(C)=O', -410.0], ['O=C=O', -393.51], ['[C-]#[O+]', -110.53],
  ['N', -45.94], ['CN', -22.5], ['CNC', -18.8], ['CN(C)C', -23.7], ['CCN', -47.5],
  ['C#N', 135.14], ['CC#N', 74.04], ['N#CC#N', 309.07], ['N#CCC#N', 266.3], ['C=N', 69.0],
  ['NC=O', -186.0], ['CC(N)=O', -238.33], ['CNC(C)=O', -248.0], ['NC(N)=O', -235.5], ['C=CC#N', 180.6], ['C=CC=O', -77.6],
  ['S', -20.6], ['CS', -22.9], ['CSC', -37.5], ['CSSC', -24.1], ['O=S=O', -296.81], ['O=S(=O)=O', -395.77], ['CS(C)=O', -150.5], ['O=C=S', -138.41], ['S=C=S', 116.94], ['S=S', 128.6],
  ['Cl', -92.31], ['CCl', -81.9], ['ClC(Cl)(Cl)Cl', -95.7], ['F', -273.3], ['CF', -234.3],
  ['OO', -136.11], ['NN', 95.35], ['[N]=O', 91.3], ['[N-]=[N+]=O', 82.05], ['O[N+](=O)[O-]', -134.31], ['C[N+](=O)[O-]', -74.3], ['[O-][O+]=O', 142.67], ['ON=O', -76.73],
  ['c1ccncc1', 140.2], ['Nc1ccccc1', 87.03], ['Oc1ccccc1', -96.4], ['c1cc[nH]c1', 108.3], ['c1c[nH]cn1', 132.9], ['c1ccoc1', -34.8], ['c1ccsc1', 115.0], ['c1cncnc1', 195.8],
  ['P', 5.47], ['[SiH4]', 34.31], ['OC=C', -128.0],
];
// legami semplici tra atomi uguali (kJ/mol): Huheey, Keiter e Keiter 1993, app. E; per i metalli l'energia della
// molecola biatomica nel vapore [ricordati: servono solo alla regola di riserva, il cui errore è più grande del loro]
const OMO = { H: 436, Li: 105, Be: 208, B: 293, C: 346, N: 167, O: 142, F: 155, Na: 72, Mg: 129, Al: 186, Si: 222, P: 201, S: 266, Cl: 240, K: 49, Ca: 105, Sc: 163, Ti: 118, V: 269, Cr: 152, Mn: 61, Fe: 118, Co: 167, Ni: 204, Cu: 201, Zn: 22, Ga: 106, Ge: 188, As: 146, Se: 172, Br: 190, Mo: 436 };
const OMO_MULTIPLI = { C: [614, 839], N: [418, 945.36], O: [498.36, 0], S: [425, 0], P: [310, 490], Si: [310, 0] };
// lo stato di riferimento di questi elementi È la molecola biatomica: il suo legame vale due volte l'entalpia dell'atomo
const BIATOMICI = { 'H-H': 1, 'N#N': 7, 'O=O': 8, 'F-F': 9, 'Cl-Cl': 17 };

// ---------- i termini di una molecola
const nomeAtomo = (m, k) => { const a = m.atomi[k]; return SIMBOLI[a.Z] + (a.q > 0 ? '+' : a.q < 0 ? '-' : ''); };
// (un eteroatomo aromatico che dà all'anello la sua coppia solitaria: l'azoto del pirrolo, l'ossigeno del furano)
const coppieNelAnello = (m, k) => !m.vic[k].some((v) => m.legami[v.k].t === 'c' && m.legami[v.k].o === 2);
export function termini(x) {
  const m = molecola(x); if (m._termini) return m._termini;
  const t = {}, piu = (k, n = 1) => { t[k] = (t[k] || 0) + n; }, nomi = m.atomi.map((_, k) => nomeAtomo(m, k));
  m.atomi.forEach((a, k) => { if (a.h) piu(a.Z === 1 ? 'H-H' : `${nomi[k]}-H`, a.h); });
  // i legami aromatici: tra semplice e doppio, nella proporzione dei doppi legami che il sistema ha davvero (benzene
  // 3 su 6, naftalene 5 su 11): non dipende da quale forma di Kekulé è scritta
  const sistema = new Map(), fraz = [];
  m.legami.forEach((l, k) => { if (!l.ar || sistema.has(k)) return; const q = fraz.length, pila = [k]; let tot = 0, doppi = 0; sistema.set(k, q);
    while (pila.length) { const u = pila.pop(), lu = m.legami[u]; tot++; if (lu.o === 2) doppi++; for (const at of [lu.a, lu.b]) for (const v of m.vic[at]) if (m.legami[v.k].ar && !sistema.has(v.k)) { sistema.set(v.k, q); pila.push(v.k); } }
    fraz.push(doppi / tot); });
  m.legami.forEach((l, k) => { if (l.t === 'i') return; const [p, q] = m.atomi[l.a].Z < m.atomi[l.b].Z || (m.atomi[l.a].Z === m.atomi[l.b].Z && nomi[l.a] <= nomi[l.b]) ? [l.a, l.b] : [l.b, l.a];
    if (l.t === 'd') piu(`${nomi[l.a]}>${nomi[l.b]}`); else if (l.ar) { const f = fraz[sistema.get(k)]; piu(`${nomi[p]}-${nomi[q]}`, 1 - f); piu(`${nomi[p]}=${nomi[q]}`, f); } else piu(`${nomi[p]}${l.o === 3 ? '#' : l.o === 2 ? '=' : '-'}${nomi[q]}`); });
  // le coppie di vicini sullo stesso atomo. Le classi del vicino: C carbonio saturo, c carbonio insaturo legato con un
  // legame semplice (coniugazione), X eteroatomo, d =C, D =O/=N/=S, t legame triplo, a aromatico
  const insaturo = (j) => m.atomi[j].ar || m.vic[j].some((v) => m.legami[v.k].t === 'c' && m.legami[v.k].o >= 2);
  m.atomi.forEach((a, k) => { const cl = [];
    for (const v of m.vic[k]) { const l = m.legami[v.k]; if (l.t !== 'c') continue; const C = m.atomi[v.j].Z === 6; cl.push(l.ar ? 'a' : l.o === 3 ? 't' : l.o === 2 ? (C ? 'd' : 'D') : C ? (insaturo(v.j) ? 'c' : 'C') : 'X'); }
    for (let i = 0; i < cl.length; i++) for (let j = i + 1; j < cl.length; j++) { if (cl[i] === 'a' && cl[j] === 'a') continue; piu(`g${a.Z === 6 ? 'C' : SIMBOLI[a.Z]}:${[cl[i], cl[j]].sort().join('')}`); } });
  for (const r of anelli(m)) { if (r.every((k) => m.atomi[k].ar)) piu(`aromatico${r.length}`); else if (r.length <= 5) piu(`anello${r.length}`); }
  Object.defineProperty(m, '_termini', { value: t, enumerable: false });
  return t;
}
// la regola di riserva per un termine di legame (Pauling), 0 per le correzioni
function riserva(k) {
  const mm = /^([A-Z][a-z]?)[+*-]*([-=#:>])([A-Z][a-z]?)[+*-]*$/.exec(k); if (!mm) return 0;
  const [, a, tipo, b] = mm, A = atomo(a), B = atomo(b), dchi = A.chi != null && B.chi != null ? Math.abs(A.chi - B.chi) : 0, ion = 96.5 * dchi * dchi;
  const semplice = Math.sqrt((OMO[a] ?? 100) * (OMO[b] ?? 100)) + ion;
  const multiplo = (n) => { const ma = OMO_MULTIPLI[a]?.[n - 2] || (OMO[a] ?? 100) * (n === 2 ? 1.6 : 2.2), mb = OMO_MULTIPLI[b]?.[n - 2] || (OMO[b] ?? 100) * (n === 2 ? 1.6 : 2.2); return (ma + mb) / 2 + n * ion; };
  return tipo === '-' ? semplice : tipo === '=' ? multiplo(2) : tipo === '#' ? multiplo(3) : tipo === ':' ? (semplice + multiplo(2)) / 2 + 15 : 0.5 * semplice;
}
const fisso = (k) => (BIATOMICI[k] ? 2 * atomo(BIATOMICI[k]).HfAtomo : null);
const atomizzazione = (m) => { let s = 0; for (const a of m.atomi) s += atomo(a.Z).HfAtomo + a.h * atomo(1).HfAtomo; return s; };

// i termini ricavati dai riferimenti (una volta sola): minimi quadrati, tenuti vicino alla riserva dove i dati non dicono
let TERMINI = null;
export function termochimica({ escludi = null } = {}) {
  if (TERMINI && !escludi) return TERMINI;
  const righe = RIFERIMENTI.filter(([s]) => !escludi || !escludi.includes(s)).map(([s, dH]) => { const m = molecola(s); return { s, t: termini(m), y: atomizzazione(m) - dH }; });
  const nomi = [...new Set(righe.flatMap((r) => Object.keys(r.t)))].filter((k) => fisso(k) == null).sort(), K = nomi.length, pos = new Map(nomi.map((k, i) => [k, i]));
  const p0 = nomi.map(riserva), sigma = 3, sigmaP = nomi.map((k) => (k[0] === 'g' || k.startsWith('anello') || k.startsWith('aromatico') ? 60 : 120));
  const N = nomi.map(() => new Array(K + 1).fill(0));
  for (const r of righe) { let y = r.y; const riga = new Array(K).fill(0); for (const k in r.t) { const f = fisso(k); if (f != null) y -= f * r.t[k]; else riga[pos.get(k)] = r.t[k]; }
    for (let i = 0; i < K; i++) { if (!riga[i]) continue; for (let j = 0; j < K; j++) N[i][j] += (riga[i] * riga[j]) / (sigma * sigma); N[i][K] += (riga[i] * y) / (sigma * sigma); } }
  for (let i = 0; i < K; i++) { N[i][i] += 1 / (sigmaP[i] * sigmaP[i]); N[i][K] += p0[i] / (sigmaP[i] * sigmaP[i]); }
  const x = risolvi(N), valori = Object.fromEntries(nomi.map((k, i) => [k, x[i]]));
  const out = { valori, riserva: Object.fromEntries(nomi.map((k, i) => [k, p0[i]])), riferimenti: righe.length };
  if (!escludi) TERMINI = out;
  return out;
}
// eliminazione di Gauss con perno (matrice aumentata n × (n+1))
export function risolvi(G) { const n = G.length;
  for (let j = 0; j < n; j++) { let p = j; for (let k = j + 1; k < n; k++) if (Math.abs(G[k][j]) > Math.abs(G[p][j])) p = k; [G[j], G[p]] = [G[p], G[j]]; const piv = G[j][j] || 1e-300;
    for (let k = j + 1; k < n; k++) { const f = G[k][j] / piv; if (f) for (let l = j; l <= n; l++) G[k][l] -= f * G[j][l]; } }
  const x = new Array(n); for (let j = n - 1; j >= 0; j--) { let s = G[j][n]; for (let k = j + 1; k < n; k++) s -= G[j][k] * x[k]; x[j] = s / (G[j][j] || 1e-300); } return x; }

// ---------- ioni in fase gas (dati [ricordati], servono poco: in acqua si passa dal pKa)
const ION2 = { Be: [18.211], Mg: [15.035], Ca: [11.872], Al: [18.829, 28.448], Sc: [12.80, 24.76], Ti: [13.576, 27.49], V: [14.618, 29.31], Cr: [16.486, 30.96], Mn: [15.640, 33.67], Fe: [16.199, 30.651], Co: [17.084, 33.50], Ni: [18.169, 35.19], Cu: [20.292, 36.84], Zn: [17.964], Mo: [16.16, 27.13] }; // 2ª e 3ª ionizzazione (eV): NIST Atomic Spectra Database
const EV = 96.485, HF_PROTONE = 1536.2; // ΔHf di H⁺ gas a 298 K: 218,0 + 1312,0 + 6,2 (convenzione dell'elettrone termico)
const AFFINITA_PROTONE = { 7: [854, 899, 930, 949], 8: [691, 754, 792], 16: [705, 773, 831], 15: [785, 850, 900] }; // per numero di sostituenti di carbonio: Hunter e Lias 1998
const AFFINITA_RADICALE = { 1: 0.754, 6: 0.08, 7: 0.77, 8: 1.83, 9: 3.40, 15: 1.27, 16: 2.31, 17: 3.61, 35: 3.36 }; // eV: OH, NH2, CH3, SH…
function entalpiaIone(m) {
  if (m.atomi.length === 1 && !m.atomi[0].h) { const a = m.atomi[0], A = atomo(a.Z); let h = A.HfAtomo;
    if (a.q > 0) { const ie = [A.ionizzazione, ...(ION2[A.simbolo] || [])]; for (let i = 0; i < a.q; i++) h += EV * (ie[i] ?? A.ionizzazione * (i + 1) * 1.9) + 6.2; } else h -= (EV * (A.affinita ?? 0) + 6.2) * -a.q;
    return { H: h, stima: 'ione semplice' }; }
  const k = m.atomi.findIndex((a) => a.q !== 0), a = m.atomi[k], g = grezzo(m);
  if (a.q > 0 && a.h > 0) { g.atomi[k].h--; g.atomi[k].q--; const base = molecola(g), nC = viciniSigma(m, k).filter((v) => m.atomi[v.j].Z === 6).length, doppio = m.vic[k].some((v) => m.legami[v.k].o === 2);
    const pa = (AFFINITA_PROTONE[a.Z] || [750])[Math.min(nC, 3)] ?? 900; return { H: entalpiaGas(base).H + HF_PROTONE - (doppio ? pa + 20 : pa), stima: 'ione: affinità protonica per classe' }; }
  if (a.q < 0 && a.Z !== 1) { g.atomi[k].h++; g.atomi[k].q++; let acido; try { acido = molecola(g); } catch { acido = null; }
    if (acido && !acido.atomi[k].r) { const osso = viciniSigma(m, k).reduce((s, v) => s + m.vic[v.j].filter((w) => m.legami[w.k].o === 2 && m.atomi[w.j].Z !== 6).length, 0), tv = termochimica().valori;
      const bde = tv[`${SIMBOLI[a.Z]}-H`] ?? riserva(`${SIMBOLI[a.Z]}-H`), ea = EV * ((AFFINITA_RADICALE[a.Z] ?? 1) + 1.4 * Math.min(osso, 1));
      return { H: entalpiaGas(acido).H + bde + 1318.2 - ea - HF_PROTONE, stima: 'ione: acidità in gas per classe' }; } }
  return null;
}
// entalpia di formazione in fase gas a 298 K → { H, stima: 'riferimenti' | 'riserva' (qualche termine dalla regola di Pauling) | 'ione…', riservati: [termini] }
export function entalpiaGas(x) {
  const m = molecola(x); if (m._hf) return m._hf;
  let out = null;
  if (m.atomi.some((a) => a.q !== 0) && m.atomi.reduce((s, a) => s + a.q, 0) !== 0) out = entalpiaIone(m);
  if (!out) { const tv = termochimica().valori, t = termini(m), riservati = []; let H = atomizzazione(m);
    for (const k in t) { const f = fisso(k); let e = f ?? tv[k]; if (e == null) { e = riserva(k); if (e) riservati.push(k); } H -= e * t[k]; }
    // i legami ionici: attrazione di Coulomb alla distanza dei raggi (1389,35 kJ·Å/mol)
    for (const l of m.legami) if (l.t === 'i') H += (1389.35 * m.atomi[l.a].q * m.atomi[l.b].q) / (atomo(m.atomi[l.a].Z).raggioCovalente + atomo(m.atomi[l.b].Z).raggioCovalente);
    out = { H, stima: riservati.length ? 'riserva' : 'riferimenti', riservati }; }
  Object.defineProperty(m, '_hf', { value: out, enumerable: false });
  return out;
}

// ---------- entropia e funzioni termiche (meccanica statistica)
// i modi di vibrazione (cm⁻¹) e i rotori interni di una molecola, dalla sua forma
function modi(m) {
  if (m._modi) return m._modi;
  const f = forma(m), n = f.n, nu = [], rotori = [];
  const { massa, momenti } = inerzia(f), lineare = n === 2 || (n > 2 && momenti[0] < 1e-3 * momenti[2]);
  const out = { f, n, massa, momenti, lineare, sigma: numeroDiSimmetria(f), nu, rotori, elettronica: 1 };
  if (n === 1) { out.elettronica = m.atomi[0].r ? m.atomi[0].r + 1 : 1; Object.defineProperty(m, '_modi', { value: out, enumerable: false }); return out; }
  // la molteplicità: un elettrone spaiato raddoppia gli stati; O2 e S2 hanno due elettroni spaiati (regola di Hund, non deducibile dal grafo: dato)
  const spaiati = m.atomi.reduce((s, a) => s + a.r, 0); out.elettronica = spaiati + 1;
  if (m.atomi.length === 2 && m.legami.length === 1 && m.legami[0].o === 2 && m.atomi.every((a) => (a.Z === 8 || a.Z === 16) && !a.q && !a.h)) out.elettronica = 3;
  // stiramenti: uno per legame; costante di forza dalla regola di Gordy (1946): k = 1,67·N·(χa·χb/d²)^¾ + 0,30 mdyn/Å
  const chi = (Z) => atomo(Z).chi ?? 2.5;
  for (const [i, j, o] of f.legami) { if (!o) continue; const d = Math.hypot(f.pos[3 * i] - f.pos[3 * j], f.pos[3 * i + 1] - f.pos[3 * j + 1], f.pos[3 * i + 2] - f.pos[3 * j + 2]);
    const k = 1.67 * o * Math.pow((chi(f.Z[i]) * chi(f.Z[j])) / (d * d), 0.75) + 0.30, mi = atomo(f.Z[i]).massa, mj = atomo(f.Z[j]).massa; nu.push(1302.8 * Math.sqrt((k * (mi + mj)) / (mi * mj))); }
  // piegamenti: per ogni atomo con d vicini, 2d − 3 (2 se in linea). Numeri d'onda caratteristici (spettri infrarossi:
  // H–X–H 1450, H–X–Y 1200, Y–X–Y 420 su un centro tetraedrico, 550 su uno piano, 620 su uno in linea; i più pesanti
  // del carbonio più lenti, come la radice della massa)
  const vicini = Array.from({ length: n }, () => []); for (const [i, j, o] of f.legami) if (o) { vicini[i].push(j); vicini[j].push(i); }
  for (let k = 0; k < m.atomi.length; k++) { const d = vicini[k].length; if (d < 2) continue; const h = vicini[k].filter((j) => f.Z[j] === 1).length, x = d - h, dm = dominio(m, k);
    const pes = vicini[k].filter((j) => f.Z[j] !== 1).map((j) => atomo(f.Z[j]).massa), lento = pes.length ? Math.sqrt(12 / (pes.reduce((a, b) => a + b, 0) / pes.length)) : 1, centro = Math.sqrt(Math.min(1, 14 / atomo(f.Z[k]).massa));
    if (d === 2 && dm.sn <= 2) { nu.push(620 * (h ? 1.1 : lento), 620 * (h ? 1.1 : lento)); continue; }
    const tot = 2 * d - 3, nXX = Math.min(tot, x >= 2 ? 2 * x - 3 : 0), nHH = Math.min(tot - nXX, h >= 2 ? 2 * h - 3 : 0), nHX = tot - nXX - nHH;
    for (let i = 0; i < nXX; i++) nu.push((dm.sn === 3 ? 550 : 420) * Math.min(1.2, lento) * centro); for (let i = 0; i < nHH; i++) nu.push(1450 * centro); for (let i = 0; i < nHX; i++) nu.push(1200 * centro); }
  // rotazioni interne: i legami semplici fuori dagli anelli con qualcosa da tutte e due le parti
  const inAnello = new Set(); for (const r of anelli(m)) for (let i = 0; i < r.length; i++) inAnello.add(`${Math.min(r[i], r[(i + 1) % r.length])},${Math.max(r[i], r[(i + 1) % r.length])}`);
  for (const l of m.legami) { if (l.t !== 'c' || l.o !== 1 || l.ar || inAnello.has(`${Math.min(l.a, l.b)},${Math.max(l.a, l.b)}`)) continue; if (vicini[l.a].length < 2 || vicini[l.b].length < 2) continue;
    const da = dominio(m, l.a), db = dominio(m, l.b); if (da.sn <= 2 || db.sn <= 2) continue;
    // i momenti d'inerzia delle due parti attorno all'asse del legame
    const lato = new Set([l.b]), pila = [l.b]; while (pila.length) { const u = pila.pop(); for (const v of vicini[u]) if (!lato.has(v) && !(u === l.b && v === l.a)) { lato.add(v); pila.push(v); } }
    const o = [f.pos[3 * l.a], f.pos[3 * l.a + 1], f.pos[3 * l.a + 2]], ax = [f.pos[3 * l.b] - o[0], f.pos[3 * l.b + 1] - o[1], f.pos[3 * l.b + 2] - o[2]], la = Math.hypot(...ax); let I1 = 0, I2 = 0;
    for (let i = 0; i < n; i++) { const v = [f.pos[3 * i] - o[0], f.pos[3 * i + 1] - o[1], f.pos[3 * i + 2] - o[2]], pr = (v[0] * ax[0] + v[1] * ax[1] + v[2] * ax[2]) / la, r2 = Math.max(0, v[0] * v[0] + v[1] * v[1] + v[2] * v[2] - pr * pr); if (lato.has(i)) I2 += atomo(f.Z[i]).massa * r2; else I1 += atomo(f.Z[i]).massa * r2; }
    const I = (I1 * I2) / (I1 + I2 || 1); if (!(I > 1e-6)) continue;
    // la barriera (regole di UFF, kJ/mol): sp³–sp³ √(Vi·Vj); con un atomo piano 4,2; tra due piani coniugati (ammide, estere) 5·√(Ui·Uj)·(1 + 4,18·ln 1,4) ≈ 84
    const sp3 = (dd) => dd.sn === 4, piano = (k, dd) => dd.sn === 3, V = sp3(da) && sp3(db) ? 4.184 * Math.sqrt(Math.max(0.05, atomo(m.atomi[l.a].Z).uff.V || (m.atomi[l.a].Z === 8 ? 2 : 0.5)) * Math.max(0.05, atomo(m.atomi[l.b].Z).uff.V || (m.atomi[l.b].Z === 8 ? 2 : 0.5))) : piano(l.a, da) && piano(l.b, db) ? (da.piano || db.piano ? 84 : 20) : 4.2;
    const pieghe = sp3(da) && sp3(db) ? 3 : piano(l.a, da) && piano(l.b, db) ? 2 : 6, simm = [l.a, l.b].some((k) => { const vv = vicini[k].filter((j) => j !== l.a && j !== l.b); return vv.length === 3 && vv.every((j) => f.Z[j] === f.Z[vv[0]] && vicini[j].length === 1); }) ? 3 : 1;
    rotori.push({ I, V, pieghe, simm }); }
  // ciò che manca per arrivare a 3n − 6 modi (deformazioni degli anelli): 400 cm⁻¹
  const attesi = 3 * n - (lineare ? 5 : 6); while (nu.length + rotori.length < attesi) nu.push(400); nu.sort((a, b) => b - a); while (nu.length + rotori.length > attesi && nu.length) nu.pop();
  Object.defineProperty(m, '_modi', { value: out, enumerable: false });
  return out;
}
// → { S (J/mol/K a T e P), Htermica (kJ/mol: energia termica + RT, da 0 K), Cp }
export function termica(x, T = 298.15, P = 1e5) {
  const m = molecola(x), q = modi(m), RJ = R * 1000; let S = 0, E = 0;
  const mk = q.massa * UMA; S += RJ * (Math.log(Math.pow((2 * Math.PI * mk * KB * T) / (HP * HP), 1.5) * ((KB * T) / P)) + 2.5); E += 2.5 * R * T; // traslazione (+ PV)
  if (q.n > 1) { const conv = UMA * 1e-20, th = (I) => (8 * Math.PI * Math.PI * I * conv * KB * T) / (HP * HP);
    if (q.lineare) { S += RJ * (Math.log(th(q.momenti[2]) / q.sigma) + 1); E += R * T; } else { S += RJ * (Math.log((Math.sqrt(Math.PI * th(q.momenti[0]) * th(q.momenti[1]) * th(q.momenti[2]))) / q.sigma) + 1.5); E += 1.5 * R * T; } }
  for (const nu of q.nu) { const xx = (HC_K * nu) / T, e = Math.exp(-xx); S += RJ * ((xx * e) / (1 - e) - Math.log(1 - e)); E += (R * T * xx * e) / (1 - e); }
  for (const r of q.rotori) { const libero = RJ * (0.5 + Math.log(Math.sqrt(8 * Math.PI ** 3 * r.I * UMA * 1e-20 * KB * T) / (r.simm * HP)));
    const nu = (r.pieghe / (2 * Math.PI)) * Math.sqrt((r.V * 1000) / NA / (2 * r.I * UMA * 1e-20)) / 2.99792458e10, xx = (HC_K * nu) / T, e = Math.exp(-xx), frenato = RJ * ((xx * e) / (1 - e) - Math.log(1 - e));
    if (libero < frenato) { S += libero; E += 0.5 * R * T; } else { S += frenato; E += (R * T * xx * e) / (1 - e);
      // un rotore a tre buche non simmetrico ha tre conformeri (anti e due gauche, questi 3,3 kJ/mol più su: il butano, dato): si mescolano
      if (r.pieghe === 3 && r.simm === 1) { const g = 2 * Math.exp(-3.3 / (R * T)); S += RJ * (Math.log(1 + g) + (g / (1 + g)) * (3.3 / (R * T))); E += (3.3 * g) / (1 + g); } } }
  S += RJ * Math.log(q.elettronica);
  // un centro chirale non assegnato è una miscela delle due forme
  return { S, Htermica: E };
}
export const entropiaGas = (x, T = 298.15, P = 1e5) => termica(x, T, P).S;

// ---------- in acqua: l'idratazione dei neutri
// DATI: energie libere di idratazione misurate (kcal/mol, da gas 1 M a soluzione 1 M): banca FreeSolv 0.52 (Mobley e
// Guthrie 2014, J. Comput.-Aided Mol. Des. 28, 711; letta l'11-11-2026); per i gas piccoli dalle costanti di Henry
// (Sander 2015, Atmos. Chem. Phys. 15, 4399) con ΔG = −RT·ln(K_H·RT).
export const IDRATAZIONE = [
  ['C', 2.00], ['CC', 1.83], ['CCC', 2.0], ['CCCCCC', 2.48], ['CCCCCCCC', 2.88], ['C1CCCCC1', 1.23], ['CCC=C', 1.38], ['c1ccccc1', -0.9], ['Cc1ccccc1', -0.9], ['c1ccc2ccccc2c1', -2.4],
  ['CO', -5.1], ['CCO', -5.0], ['CCCO', -4.85], ['CCCCO', -4.72], ['CCCCCCCCO', -4.09], ['CCCCCCCCCCO', -3.64], ['CC(C)O', -4.74], ['CC(C)(C)O', -4.47], ['Oc1ccccc1', -6.6], ['OCC(O)CO', -13.43],
  ['COC', -1.91], ['CCOCC', -1.59], ['C1CCOC1', -3.47], ['C1COCCO1', -5.06], ['CC=O', -3.5], ['CCC=O', -3.43], ['CCCC=O', -3.18], ['CC(C)=O', -3.8], ['CCCC(C)=O', -3.52], ['C=O', -2.75],
  ['CC(=O)O', -6.69], ['CCCCC(=O)O', -6.16], ['CCCCCC(=O)O', -6.21], ['COC=O', -2.78], ['COC(C)=O', -3.13], ['CCC(=O)OC', -2.93], ['CCCCCC(=O)OC', -2.49],
  ['N', -4.29], ['CN', -4.55], ['CCN', -4.5], ['CCCN', -4.39], ['CCCCN', -4.24], ['CNC', -4.29], ['CN(C)C', -3.2], ['C1CCNCC1', -5.11], ['C1CCNC1', -5.48], ['C1COCCN1', -7.17], ['Nc1ccccc1', -5.49], ['NN', -9.3],
  ['CC(N)=O', -9.71], ['CNC(C)=O', -10.0], ['NC(=O)c1ccccc1', -11.0], ['CC#N', -3.88], ['c1ccncc1', -4.69], ['CS', -1.2], ['CCS', -1.14], ['CSC', -1.61], ['S', -0.7], ['C[N+](=O)[O-]', -4.02], ['CCl', -0.55],
  ['O', -6.32], ['[HH]', 2.34], ['N#N', 2.45], ['O=O', 2.03], ['[C-]#[O+]', 2.20], ['O=C=O', 0.11], ['C#N', -3.2], ['C=C', 1.27], ['C#C', 0.0], ['[N]=O', 1.82], ['O=S=O', -2.0],
];
function caratteriAcqua(m) {
  const c = { costante: 1, carbonio: 0, aromatico: 0, OH: 0, etere: 0, carbonile: 0, NH: 0, ammina: 0, azotoPi: 0, zolfo: 0, coniugato: 0, alogeno: 0, multiplo: 0 };
  m.atomi.forEach((a, k) => { const doppi = m.vic[k].filter((v) => m.legami[v.k].t === 'c' && m.legami[v.k].o >= 2 && !m.legami[v.k].ar);
    if (a.Z === 6) { if (a.ar) c.aromatico++; else c.carbonio++; if (doppi.some((v) => m.atomi[v.j].Z === 6 && v.j > k)) c.multiplo++;
      if (doppi.some((v) => m.atomi[v.j].Z === 8) && m.vic[k].some((v) => m.legami[v.k].o === 1 && (m.atomi[v.j].Z === 8 || m.atomi[v.j].Z === 7))) c.coniugato++; }
    else if (a.Z === 8) { if (a.h) c.OH += a.h; else if (doppi.length || a.q < 0) c.carbonile++; else c.etere++; }
    else if (a.Z === 7) { c.NH += a.h; if (a.q > 0) return; if (doppi.length || a.ar) { if (coppieSolitarie(m, k) > 0 && !(a.ar && coppieNelAnello(m, k))) c.azotoPi++; } else c.ammina++; }
    else if (a.Z === 16 || a.Z === 15) c.zolfo++; else if ([9, 17, 35].includes(a.Z)) c.alogeno++; });
  return c;
}
let IDRO = null;
function idratazioneFit() {
  if (IDRO) return IDRO;
  const righe = IDRATAZIONE.map(([s, kcal]) => ({ c: caratteriAcqua(molecola(s)), y: kcal * 4.184 })), nomi = Object.keys(righe[0].c), K = nomi.length, N = nomi.map(() => new Array(K + 1).fill(0));
  for (const r of righe) for (let i = 0; i < K; i++) { const ci = r.c[nomi[i]]; if (!ci) continue; for (let j = 0; j < K; j++) N[i][j] += ci * r.c[nomi[j]]; N[i][K] += ci * r.y; }
  for (let i = 0; i < K; i++) N[i][i] += 1e-3;
  const x = risolvi(N); return (IDRO = Object.fromEntries(nomi.map((k, i) => [k, x[i]])));
}
// ΔG di idratazione di una molecola neutra (kJ/mol, da gas 1 M a soluzione 1 M: convenzione di Ben-Naim)
export function idratazione(x) { const m = molecola(x), w = idratazioneFit(), c = caratteriAcqua(m); let g = 0; for (const k in c) g += w[k] * c[k]; return g; }
// ΔG per passare dal gas a un liquido apolare (l'interno di una micella, di una membrana, di una proteina): solo
// dispersione. LEGGE EMPIRICA dai coefficienti di ripartizione aria-esadecano degli alcani (Abraham 1987, log L16:
// metano −0,32, etano 0,49, propano 1,05, butano 1,62 [ricordati]): 5,0 − 3,2 kJ/mol per atomo pesante.
export const inOlio = (x) => 5.0 - 3.2 * molecola(x).atomi.filter((a) => a.Z > 1).length;

// ---------- acidi e basi: il pKa di ogni sito
// σ induttiva di un atomo visto attraverso i legami (Charton 1981, σ_I dei gruppi, ridotte agli atomi): dato
const SIGMA_I = (m, j) => { const a = m.atomi[j], d = m.vic[j].some((v) => m.legami[v.k].o === 2 && !m.legami[v.k].ar), t = m.vic[j].some((v) => m.legami[v.k].o === 3);
  const el = a.Z === 9 ? 0.52 : a.Z === 17 ? 0.47 : a.Z === 35 ? 0.45 : a.Z === 8 ? (d ? 0.72 : 0.28) : a.Z === 7 ? (t ? 1.4 : d ? 0.5 : 0.15) : a.Z === 16 ? 0.26 : a.Z === 15 ? 0.2 : 0; return el + 0.6 * a.q; };
const RHO = 9.8, SMORZA = 0.4;
const ossoDi = (m, A) => m.vic[A].filter((v) => m.legami[v.k].t === 'c' && ((m.legami[v.k].o === 2 && m.atomi[v.j].Z !== 6) || (m.legami[v.k].o === 1 && m.atomi[v.j].q < 0 && m.atomi[A].q > 0 && m.atomi[v.j].Z === 8))).map((v) => v.j);
// il pKa dell'idrogeno sull'atomo k (com'è nel grafo): valore di base della classe (DATI: tabelle di pKa in acqua a
// 25 °C: CRC Handbook; Perrin, Dempsey e Serjeant 1981) + effetto induttivo. → { pKa, classe } o null
export function pKaSito(m, k) {
  const a = m.atomi[k]; if (!a.h) return null;
  const vic = viciniSigma(m, k).map((v) => v.j), nucleo = new Set([k]); let base = null, classe = '';
  const nC = vic.filter((j) => m.atomi[j].Z === 6).length, piAccanto = (j) => m.atomi[j].ar || m.vic[j].some((v) => m.legami[v.k].t === 'c' && m.legami[v.k].o >= 2 && v.j !== k);
  if (a.Z === 8 && a.q === 0) {
    if (!vic.length) { base = 14.0; classe = 'acqua'; }
    else { const A = vic[0], ZA = m.atomi[A].Z, osso = ossoDi(m, A); nucleo.add(A); osso.forEach((j) => nucleo.add(j));
      if (ZA === 6) { if (osso.length) { const sost = viciniSigma(m, A).map((v) => v.j).filter((j) => j !== k && !osso.includes(j)); base = sost.some((j) => m.atomi[j].Z === 6) ? 4.76 : 3.75; classe = 'acido carbossilico'; if (osso.some((j) => m.atomi[j].Z === 16)) base -= 1.4; }
        else if (m.atomi[A].ar) { base = 10.0; classe = 'fenolo'; } else if (piAccanto(A)) { base = 10.5; classe = 'enolo'; } else { base = 16.0; classe = 'alcol'; } }
      else if (ZA === 15) { base = osso.length ? 2.15 : 8; classe = 'acido del fosforo'; } else if (ZA === 16) { base = [11, 1.9, -3][Math.min(2, osso.length)]; classe = 'acido dello zolfo'; }
      else if (ZA === 7) { base = osso.length >= 2 ? -1.4 : osso.length ? 3.3 : 13.7; classe = 'acido dell\'azoto'; } else if (ZA === 14) { base = 9.8; classe = 'acido silicico'; } else if (ZA === 5) { base = 9.2; classe = 'acido borico'; }
      else if (ZA === 8) { base = 11.6; classe = 'perossido'; } else if (atomo(ZA).metallo) { base = 14 - 1.5 * Math.max(0, m.atomi[A].q) ** 2; classe = 'idrossido di metallo'; } else { base = 8 - 5 * osso.length; classe = 'ossiacido (regola di Pauling)'; } } }
  else if (a.Z === 8 && a.q === 1) { if (!vic.length) { base = 0; classe = 'idrossonio'; } else { const A = vic[0], dop = m.vic[k].some((v) => m.legami[v.k].o === 2); nucleo.add(A); base = dop ? (m.vic[A].some((v) => m.atomi[v.j].Z === 7 && m.legami[v.k].o === 1) ? -0.5 : -7) : -2; classe = 'ossonio'; } }
  else if (a.Z === 7 && a.q === 1) { const dop = m.vic[k].find((v) => m.legami[v.k].t === 'c' && m.legami[v.k].o === 2), tri = m.vic[k].some((v) => m.legami[v.k].o === 3);
    if (tri) { base = -10; classe = 'nitrilio'; }
    else if (a.ar) { const r = anelli(m).find((rr) => rr.includes(k) && rr.length === 5); base = r && r.some((j) => j !== k && m.atomi[j].Z === 7) ? 7.0 : 5.2; classe = r ? 'imidazolio' : 'piridinio'; if (r) r.forEach((j) => nucleo.add(j)); }
    else if (dop) { const C = dop.j, altriN = m.vic[C].filter((v) => v.j !== k && m.atomi[v.j].Z === 7 && m.legami[v.k].o === 1); nucleo.add(C); altriN.forEach((v) => nucleo.add(v.j)); base = altriN.length >= 2 ? 13.6 : altriN.length ? 12.4 : 7.0; classe = altriN.length ? 'amidinio' : 'imminio'; }
    else if (vic.some((j) => m.atomi[j].Z === 6 && ossoDi(m, j).length)) { base = -8; classe = 'ammide protonata sull\'azoto'; }
    else if (vic.some((j) => m.atomi[j].ar)) { base = 4.6; classe = 'anilinio'; } else if (vic.some((j) => m.atomi[j].Z === 7)) { base = 8.1; classe = 'idrazinio'; nucleo.add(vic.find((j) => m.atomi[j].Z === 7)); } else if (vic.some((j) => m.atomi[j].Z === 8)) { base = 6.0; classe = 'idrossilammonio'; nucleo.add(vic.find((j) => m.atomi[j].Z === 8)); }
    else { base = [9.25, 10.64, 10.73, 9.80][Math.min(nC, 3)]; classe = 'ammonio'; } }
  else if (a.Z === 7 && a.q === 0) { const acili = vic.filter((j) => ossoDi(m, j).length);
    if (a.ar) { const r = anelli(m).find((rr) => rr.includes(k)); const altri = r ? r.filter((j) => j !== k && m.atomi[j].Z === 7).length : 0, acil = vic.filter((j) => m.vic[j].some((v) => m.legami[v.k].o === 2 && m.atomi[v.j].Z === 8)).length; base = acil >= 2 ? 9.5 : acil ? 11.5 : altri ? 14.5 - 2.3 * (anelli(m).filter((rr) => rr.includes(k) || rr.some((j) => r.includes(j))).length - 1) : 17.5; classe = 'NH aromatico'; r?.forEach((j) => nucleo.add(j)); }
    else if (acili.length) { base = acili.length >= 2 ? 9.6 : 15.1; classe = 'ammide'; acili.forEach((j) => { nucleo.add(j); ossoDi(m, j).forEach((o) => nucleo.add(o)); }); }
    else if (vic.some((j) => m.vic[j].some((v) => m.legami[v.k].o === 3))) { base = 10.3; classe = 'cianammide'; } else { base = 35; classe = 'ammina'; } }
  else if (a.Z === 16 && a.q === 0) { if (!vic.length) { base = 7.0; classe = 'idrogeno solforato'; } else { const A = vic[0]; nucleo.add(A); base = ossoDi(m, A).length ? 3.3 : m.atomi[A].ar ? 6.6 : 10.5; classe = 'tiolo'; } }
  else if (a.Z === 6 && a.q === 0) { const tripN = m.vic[k].some((v) => m.legami[v.k].o === 3 && m.atomi[v.j].Z === 7), acc = vic.filter((j) => ossoDi(m, j).length || m.vic[j].some((v) => m.legami[v.k].o === 3 && m.atomi[v.j].Z === 7));
    if (tripN) { base = 9.21; classe = 'acido cianidrico'; } else if (m.vic[k].some((v) => m.legami[v.k].o === 3)) { base = 25; classe = 'alchino'; }
    else if (acc.length) { const nitro = acc.some((j) => m.atomi[j].Z === 7), ald = acc.some((j) => m.atomi[j].Z === 6 && m.atomi[j].h > 0 && ossoDi(m, j).length), est = acc.every((j) => m.vic[j].some((v) => m.legami[v.k].o === 1 && (m.atomi[v.j].Z === 8 || m.atomi[v.j].Z === 7)) || m.vic[j].some((v) => m.legami[v.k].o === 3));
      base = nitro ? 10.2 : (est ? 24.5 : ald ? 16.7 : 19.3) - 9 * (acc.length - 1); classe = 'carbonio α'; acc.forEach((j) => { nucleo.add(j); ossoDi(m, j).forEach((o) => nucleo.add(o)); m.vic[j].forEach((v) => { if (m.legami[v.k].o === 3 || (est && m.legami[v.k].o === 1 && m.atomi[v.j].Z !== 6)) nucleo.add(v.j); }); }); }
    else { base = 50; classe = 'alcano'; } }
  else if (a.Z === 9) { base = 3.17; classe = 'HF'; } else if (a.Z === 17) { base = -7; classe = 'HCl'; } else if (a.Z === 35) { base = -9; classe = 'HBr'; } else if (a.Z === 34) { base = 3.9; classe = 'H2Se'; } else if (a.Z === 15) { base = 27; classe = 'fosfina'; } else return null;
  // l'effetto induttivo: gli eteroatomi e le cariche a due o più legami di distanza
  const dist = new Map([[k, 0]]); let fronte = [k], ind = 0;
  for (let d = 1; d <= 5 && fronte.length; d++) { const poi = []; for (const u of fronte) for (const v of m.vic[u]) { if (dist.has(v.j) || m.legami[v.k].t === 'i') continue; dist.set(v.j, d); poi.push(v.j); if (d >= 2 && !nucleo.has(v.j)) ind += SIGMA_I(m, v.j) * SMORZA ** (d - 2); } fronte = poi; }
  return { pKa: base - RHO * ind, classe };
}
// la forma neutra di riferimento: gli acidi con il loro idrogeno, le basi senza
export function neutra(x) {
  const m = molecola(x); if (!m.atomi.some((a) => a.q)) return m; if (m._neutra) return m._neutra;
  const g = grezzo(m);
  m.atomi.forEach((a, k) => { const A = atomo(a.Z); if (A.metallo || !m.vic[k].length && !a.h && a.Z !== 8 && a.Z !== 16 && a.Z !== 17 && a.Z !== 9 && a.Z !== 35) return;
    if (a.q < 0 && [6, 7, 8, 9, 16, 17, 35].includes(a.Z) && !m.vic[k].some((v) => m.atomi[v.j].q > 0)) { g.atomi[k].h -= a.q; g.atomi[k].q = 0; }
    else if (a.q > 0 && a.h >= a.q && [7, 8, 15, 16].includes(a.Z) && !m.vic[k].some((v) => m.atomi[v.j].q < 0 && m.legami[v.k].t === 'c')) { g.atomi[k].h -= a.q; g.atomi[k].q = 0; } });
  const out = molecola(g); Object.defineProperty(m, '_neutra', { value: out, enumerable: false }); return out;
}
// i siti che contano in acqua: acidi (pKa < 20) e basi (pKa dell'acido coniugato > −3) della forma neutra
export function sitiAcidoBase(x) {
  const m = neutra(x); if (m._siti) return m._siti;
  const siti = [];
  m.atomi.forEach((a, k) => {
    if (a.h && !a.q && a.Z !== 1) { const p = pKaSito(m, k); if (p && p.pKa < 20) siti.push({ atomo: k, tipo: 'acido', pKa: p.pKa, classe: p.classe }); }
    if (a.Z === 7 && !a.q && coppieSolitarie(m, k) > 0 && !(a.ar && coppieNelAnello(m, k))) { const g = grezzo(m); g.atomi[k].h++; g.atomi[k].q = 1; let p = null; try { p = pKaSito(molecola(g), k); } catch { p = null; } if (p && p.pKa > -3) siti.push({ atomo: k, tipo: 'base', pKa: p.pKa, classe: p.classe }); } });
  // l'accoppiamento tra due siti carichi (in unità di pK): ρ·0,6·0,4^(d−2), d i legami tra i due atomi
  const W = siti.map(() => siti.map(() => 0));
  for (let i = 0; i < siti.length; i++) { const dist = new Map([[siti[i].atomo, 0]]); let fronte = [siti[i].atomo];
    for (let d = 1; d <= 7 && fronte.length; d++) { const poi = []; for (const u of fronte) for (const v of m.vic[u]) if (!dist.has(v.j)) { dist.set(v.j, d); poi.push(v.j); } fronte = poi; }
    for (let j = 0; j < siti.length; j++) { if (i === j) continue; const d = dist.get(siti[j].atomo); if (d != null) W[i][j] = RHO * 0.6 * SMORZA ** (Math.max(d, 1) - 2) * (siti[i].tipo === siti[j].tipo ? 1 : -1); } }
  const out = { m, siti, W }; Object.defineProperty(m, '_siti', { value: out, enumerable: false }); return out;
}
// tutti gli stati di protonazione a un pH → { dG (kJ/mol: di quanto l'insieme sta sotto la forma neutra), carica (media),
// stato: [sito ionizzato sì/no] del più popolato, pKa: i pKa apparenti (macroscopici) in ordine }
export function speciazione(x, pH = 7, T = 298.15) {
  const { m, siti, W } = sitiAcidoBase(x), n = siti.length; if (!n) return { dG: 0, carica: caricaDi(m), stato: [], siti, neutra: m };
  // i siti lontani non si sentono: si sommano gli stati a gruppi (qui: tutti insieme fino a 14 siti, poi a uno a uno)
  const esp = (i) => (siti[i].tipo === 'acido' ? pH - siti[i].pKa : siti[i].pKa - pH);
  if (n > 14) { let ln = 0, q = 0; const stato = []; for (let i = 0; i < n; i++) { const e = esp(i), p = 1 / (1 + 10 ** -e); ln += Math.log(1 + 10 ** e); q += p * (siti[i].tipo === 'acido' ? -1 : 1); stato.push(p > 0.5); } return { dG: -R * T * ln, carica: caricaDi(m) + q, stato, siti, neutra: m }; }
  let Zs = 0, qm = 0, meglio = -Infinity, statoM = 0;
  for (let s = 0; s < 1 << n; s++) { let e = 0, q = 0; for (let i = 0; i < n; i++) { if (!((s >> i) & 1)) continue; e += esp(i); q += siti[i].tipo === 'acido' ? -1 : 1; for (let j = i + 1; j < n; j++) if ((s >> j) & 1) e -= W[i][j]; }
    const w = 10 ** e; Zs += w; qm += w * q; if (e > meglio) { meglio = e; statoM = s; } }
  return { dG: -R * T * Math.log(Zs), carica: caricaDi(m) + qm / Zs, stato: siti.map((_, i) => !!((statoM >> i) & 1)), siti, neutra: m };
}
// la molecola nello stato di protonazione più popolato a quel pH (per la forma, le cariche, il disegno)
export function alPH(x, pH = 7) { const sp = speciazione(x, pH), g = grezzo(sp.neutra); sp.siti.forEach((s, i) => { if (!sp.stato[i]) return; if (s.tipo === 'acido') { g.atomi[s.atomo].h--; g.atomi[s.atomo].q--; } else { g.atomi[s.atomo].h++; g.atomi[s.atomo].q++; } }); return molecola(g); }
// i pKa apparenti: i pH a cui la carica media passa per i mezzi interi
export function pKaApparenti(x) { const { siti } = sitiAcidoBase(x); if (!siti.length) return []; const out = []; let prima = speciazione(x, -4).carica;
  for (let pH = -4; pH <= 18; pH += 0.02) { const q = speciazione(x, pH).carica; if (Math.floor(prima + 0.5) !== Math.floor(q + 0.5)) out.push(+pH.toFixed(2)); prima = q; } return out; }

// ---------- l'energia a T e P, in gas o in acqua
// l'acqua liquida rispetto al suo vapore a 1 bar: ΔG = RT·ln(p_vapore/1 bar), con Clausius e Clapeyron (ΔH di
// evaporazione 44,0 kJ/mol a 298 K, 40,65 a 373 K: dati; bolle a 373,15 K)
const EVAP = (T) => 44.0 - 0.0447 * (T - 298.15);
export const condensaAcqua = (T) => { const a = 44.0 + 0.0447 * 298.15, b = 0.0447, Tb = 373.15; return T * (a * (1 / Tb - 1 / T) + b * Math.log(Tb / T)) + R * T * Math.log(1.01325); };
const DS_SOLUTO = -0.085; // kJ/mol/K: ciò che un soluto perde entrando in acqua dal gas (regola di Barclay e Butler 1938: dato)
// energia(molecola, { T, P, solvente: null | 'acqua', pH, attivitaAcqua }) →
//   { H, S, G (alla T e P date; gas: stato 1 bar corretto a P; in acqua: soluto 1 M, già sommato sugli stati di protonazione a quel pH),
//     Hf298, S298, stima, in acqua anche: idratazione, carica, protonazione (ΔG degli stati), fase }
export function energia(x, { T = 298.15, P = 1e5, solvente = null, pH = 7, attivitaAcqua = 1 } = {}) {
  const m0 = molecola(x), acqua = solvente === 'acqua', m = acqua ? neutra(m0) : m0;
  const mono = m.atomi.length === 1 && !m.atomi[0].h && m.atomi[0].q !== 0;
  if (acqua && m.atomi.length === 1 && m.atomi[0].Z === 1 && m.atomi[0].q === 1) return { H: 0, S: 0, G: -R * T * LN10 * pH, fase: 'acqua', stima: 'convenzione: H⁺(aq) = 0', carica: 1, Hf298: 0, S298: 0 };
  const hf = entalpiaGas(m), t298 = termica(m, 298.15, 1e5), tT = T === 298.15 ? t298 : termica(m, T, 1e5);
  const H = hf.H + tT.Htermica - t298.Htermica, S = tT.S;
  if (!acqua) return { H, S: S - 1000 * R * Math.log(P / 1e5), G: H - (T * S) / 1000 + R * T * Math.log(P / 1e5), fase: 'gas', stima: hf.stima, riservati: hf.riservati, Hf298: hf.H, S298: t298.S };
  if (chiave(m) === 'O') { const g = condensaAcqua(T); return { H: H - EVAP(T), S: S - (1000 * (EVAP(T) + g)) / T, G: H - (T * S) / 1000 + g + R * T * Math.log(Math.max(attivitaAcqua, 1e-12)), fase: 'acqua (solvente)', stima: hf.stima, carica: 0, Hf298: hf.H, S298: t298.S }; }
  if (mono) { // ione semplice: Born, nella convenzione H⁺(aq) = 0
    const a = m.atomi[0], eps = 87.74 * Math.exp(-0.0046 * (T - 273.15)), born = (-694.65 * a.q * a.q * (1 - 1 / eps)) / raggioDiBorn(a.Z, a.q);
    // (la scala: ΔG di idratazione assoluta di H⁺ −1056 kJ/mol, Marcus 1991, la stessa su cui sono tarati i raggi di Latimer; S di H⁺ gas 108,9 J/mol/K)
    const G = H - (T * S) / 1000 + born - a.q * (HF_PROTONE - T * 0.1089 - 1056);
    return { H, S, G, fase: 'acqua', stima: 'ione semplice: Born', idratazione: born, carica: a.q, Hf298: hf.H, S298: t298.S }; }
  const idr = idratazione(m) + R * 298.15 * Math.log(24.465), sp = speciazione(m, pH, T); // (da gas a 1 bar a soluzione 1 M)
  const Gn = H - (T * S) / 1000 + idr - (T - 298.15) * DS_SOLUTO;
  return { H: H + idr + 298.15 * DS_SOLUTO, S: S + 1000 * DS_SOLUTO, G: Gn + sp.dG, Gneutra: Gn, fase: 'acqua', stima: hf.stima, riservati: hf.riservati, idratazione: idr, protonazione: sp.dG, carica: sp.carica, Hf298: hf.H, S298: t298.S };
}
export { caricaDi, conta, NUMERO, lunghezzaLegame, sommaLegami };
