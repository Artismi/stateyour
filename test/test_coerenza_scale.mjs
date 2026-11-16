// test_coerenza_scale.mjs — LAVORO 5 di PROGETTO.md: LA COERENZA TRA LE SCALE (LINGUA.md, condizioni C6 e C8).
//
// Per ogni passaggio di scala che il programma fa davvero (il campo del cosmo e i suoi livelli, il campo e le galassie, la
// galassia e le sue stelle, la stella del campione e le stelle vere, la stella e il suo disco, il disco e i pianeti, il
// pianeta e la sua superficie, la superficie e le tessere, la tessera e la roccia, la roccia e i suoi grani, il grano e i
// suoi atomi, l'atomo e la scala quantistica) si legge la grandezza che il PADRE dichiara e quella che il RIASSUNTO dei
// FIGLI (M applicato al raffinamento μ) ridà: C6 chiede M∘μ = I. Dove a due grane c'è un'evoluzione con soglie o
// approssimazioni di comodo si misura il difetto di commutazione M∘T_fine − T_grossa∘M (C8).
//
// LA TOLLERANZA viene sempre dal modello, ed è scritta accanto: l'errore di campionamento atteso (4 scarti: Poisson,
// multinomiale, χ² al livello di 4 scarti, p = 6,3·10⁻⁵), il numero dei figli (un arrotondamento a interi: mezzo figlio per
// figlio), la precisione numerica (ε = 2⁻⁵² per il numero di operazioni; il passo di una bisezione; la stima di Richardson di
// una quadratura). Mai un numero scelto a occhio, mai un seme scelto: i luoghi vengono dalla fonte degli eventi o sono i
// primi del catalogo che hanno ciò che serve (la prova è strutturale: non dipende dai numeri di un universo).
// ESITI: TORNA · NON TORNA · misurato (C8 dove il modello non dà un limite al difetto: si stampa) · manca M / manca μ (il
// passaggio c'è ma il riassunto o il raffinamento non è definito: lo si dice, non lo si inventa).
// Una riga NON TORNA che è un'incoerenza NOTA (descritta, con il posto nel codice: `nota`) è stampata e non ferma la
// catena; una NON TORNA non dichiarata fa fallire la prova. Una nota che torna lo dice: va tolta dalle note.

import * as CO from '../src/camera/cosmo.js';
import { campoCosmo } from '../src/camera/spazio3d.js';
import * as P from '../src/camera/campo_pigro.js';
import * as GA from '../src/camera/galassie.js';
import * as LG from '../src/camera/leggi.js';
import * as ST from '../src/camera/stelle.js';
import * as LI from '../src/camera/lingua.js';
import * as DI from '../src/camera/disco.js';
import * as GE from '../src/camera/geologia.js';
import * as RO from '../src/camera/rocce.js';
import * as GR from '../src/camera/grani.js';
import * as MA from '../src/camera/materia.js';
import * as A3 from '../src/camera/atomi3d.js';
import * as Q from '../src/camera/quanti.js';
import * as EL from '../src/camera/elementi.js';
import { mare as mareDi } from '../src/camera/mare.js';
import { probabilitaChi2 } from '../src/camera/bolle.js';
import { sorgente, contatore } from '../src/camera/eventi.js';
import * as FI from '../src/camera/finestra.js';
import * as RE from '../src/camera/reazioni.js';
import { mareColVento } from './mare_col_vento.mjs';

const T0 = performance.now(), EPS = 2 ** -52, MPC = 3.0857e22, { UA, MSOLE } = LG;
const P4 = probabilitaChi2(16, 1); // il livello di quattro scarti per un χ²: 6,3·10⁻⁵
const num = (x, c = 4) => (x == null ? '—' : typeof x === 'string' ? x : !Number.isFinite(x) ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e5 || Math.abs(x) < 1e-3 ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const somma = (v) => v.reduce((a, b) => a + b, 0);
const tempi = [];
const tempo = (che, f) => { const t = performance.now(), r = f(); tempi.push([che, performance.now() - t]); return r; };

// ---------- LE RIGHE
const RIGHE = [];
// { c: 'C6' | 'C8', passaggio, grandezza, padre, figli, scarto (se manca: figli − padre), tol, da (da dove viene la tolleranza),
//   esito (se si vuole forzare: 'misurato', 'manca M', 'manca μ'), nota: { perche, dove } (incoerenza nota), unita }
function riga(r) {
  if (!r.esito) { const s = r.scarto ?? r.figli - r.padre; r.scarto = s; r.esito = Number.isFinite(s) && Math.abs(s) <= r.tol ? 'TORNA' : 'NON TORNA'; }
  RIGHE.push(r); return r;
}
const manca = (c, passaggio, grandezza, quale, perche) => riga({ c, passaggio, grandezza, esito: `manca ${quale}`, da: perche });

// ---------- i luoghi: il cosmo 1 (il primo del catalogo), galassie sparse per indice, i primi sistemi che hanno ciò che serve
const N_COSMO = 1, C = tempo('cosmo', () => CO.cosmo(N_COSMO)), NG = C.galassie.length;
const GAL = [...new Set([0, Math.floor(NG / 4), Math.floor(NG / 2), Math.floor((3 * NG) / 4), NG - 1])];
const fonte = sorgente('coerenza scale');

// =====================================================================================================
// 1. IL CAMPO DEL COSMO: i livelli (campo_pigro.js) e le galassie (cosmo3d.js)
// =====================================================================================================
const F = tempo('campo del cosmo vincolato', () => campoCosmo(N_COSMO));
{ // C6: guardare più fine (due livelli in più) e riassumere (lisciare a 200 Mpc) ridà il campo di prima
  const L0 = F.libero, J = P.livelloPer(50 * MPC), filtro = { ...P.FILTRI.gaussiana(200 * MPC), kTop: null };
  let peggio = 0, tol = Infinity; const n = 12, celle = (4 / 3) * Math.PI * P.PIGRO.raggio ** 3;
  for (let i = 0; i < n; i++) {
    const p = [0, 1, 2].map((d) => F.toroM * fonte(`campo/punto ${i}/${d}`)), a = L0.delta(p, { filtro, livello: J, soglia: 0 }), b = L0.delta(p, { filtro, livello: J + 2, soglia: 0 });
    // (somma di Σ_livelli (celle nel raggio) termini: l'arrotondamento è al più n·ε per il più grande dei termini, ≤ |δ| + σ)
    const termini = L0.livelliUtili({ filtro, livello: J + 2, soglia: 0 }).length * celle, t = termini * EPS * (Math.abs(a) + Math.sqrt(L0.varianza({ filtro, livello: J + 2 })));
    if (Math.abs(b - a) - t > peggio - tol || i === 0) { peggio = Math.abs(b - a); tol = t; }
  }
  riga({ c: 'C6', passaggio: 'campo: livello J → J+2 (campo_pigro.js)', grandezza: 'δ lisciato a 200 Mpc, 12 punti (il peggiore)', padre: 0, figli: peggio, tol, da: `precisione: (livelli × ${Math.round(celle)} celle per livello)·ε·(|δ| + σ)` });
}
{ // C6: le galassie (i figli) dicono l'altezza del loro picco; il campo vincolato (il padre) lisciato a R_eq nel loro posto deve ridarla
  let peggio = -Infinity, scelto = null; const n = F.vincoliGalassie.length, sig = F.sigmaLunghe;
  tempo('vincoli delle galassie', () => { for (const v of F.vincoliGalassie) {
    // (δ è una somma di (livelli × celle nel raggio) termini: la stessa precisione della riga sopra; più la varianza che la teoria lascia)
    const d = F.campo.delta(v.posizione, { scala: v.scala }), a = F.campo.attesa(v), termini = F.campo.livelliUtili({ scala: v.scala }).length * (4 / 3) * Math.PI * P.PIGRO.raggio ** 3;
    const t = 4 * Math.sqrt(a.varianza) + termini * EPS * (Math.abs(v.valore) + sig), z = Math.abs(d - v.valore) / t;
    if (z > peggio) { peggio = z; scelto = { d, c: v.valore, t }; } } });
  riga({ c: 'C6', passaggio: 'campo → galassie (cosmo3d.js, Hoffman-Ribak)', grandezza: `δ lisciato a R_eq nel posto di ${n} galassie (il peggiore)`, padre: scelto.c, figli: scelto.d, tol: scelto.t, da: 'precisione: (livelli × 905 celle)·ε·(|δ| + σ), + 4·√(varianza che la teoria del campo vincolato lascia lì)' });
}
{ // C6: quante galassie vere: ognuna del campione ne rappresenta N (lingua.galassieVere, cosmo3d.js peso)
  const V = LI.galassieVere(N_COSMO);
  riga({ c: 'C6', passaggio: 'galassie del campione → galassie vere', grandezza: 'numero di aloni ≥ M_min nel toro', padre: V.vere, figli: V.perGalassia * V.campione, tol: V.campione / 2, da: `numero dei figli: N intero, mezzo alone per ognuna delle ${V.campione} galassie del campione` });
  riga({ c: 'C6', passaggio: 'galassie del campione → galassie vere', grandezza: 'lo stesso numero: lingua.js contro cosmo3d.js', padre: F.vere, figli: V.vere, tol: 8 * EPS * F.vere, da: 'precisione: la stessa formula (Press-Schechter) con il lato del toro scritto due volte' });
  // la massa: le vere sono uguali al campione in tutto (galassiaVera), quindi la massa negli aloni vista dai figli è Σ M_g·N;
  // quella del padre è la funzione di massa di Press-Schechter sopra M_min (la stessa di U.aloni). Se il campione fosse un
  // campione equo per numero degli aloni sopra M_min, lo scarto atteso sarebbe CV/√n_g
  const U = GA.COSMOLOGIA, rho = U.Om * U.rhoC * 1e9, mom = [0, 0, 0], l0 = Math.log(V.massaMinima), l1 = Math.log(1e17), K = 600, dl = (l1 - l0) / K;
  for (let i = 0; i < K; i++) { const m = Math.exp(l0 + (i + 0.5) * dl), sg = U.sigma(m), p = -(Math.log(U.sigma(m * 1.05)) - Math.log(U.sigma(m / 1.05))) / (2 * Math.log(1.05)), nu = 1.686 / sg, dn = Math.sqrt(2 / Math.PI) * (rho / m) * nu * p * Math.exp(-nu * nu / 2) * dl; for (let k = 0; k < 3; k++) mom[k] += dn * m ** k; }
  const Vt = (CO.TORO_M / MPC) ** 3, media = mom[1] / mom[0], cv = Math.sqrt(mom[2] / mom[0] - media * media) / media, campione = somma(C.galassie.map((G) => G.forma.alone.massa));
  riga({ c: 'C6', passaggio: 'galassie del campione → galassie vere', grandezza: 'massa negli aloni ≥ M_min (M☉)', padre: mom[1] * Vt, figli: campione * V.perGalassia, tol: 4 * cv * mom[1] * Vt / Math.sqrt(V.campione), da: `campionamento: 4·CV/√n, CV = ${num(cv, 3)} della funzione di massa sopra M_min` });
}
manca('C6', 'galassia del campione → galassia vera k', 'il posto nel toro', 'μ', 'tre eventi uniformi: le correlazioni tra aloni non sono seguite (lingua.js galassiaVera; aloniIn di ragnatela.js le dà solo regione per regione)');

// =====================================================================================================
// 2. LA GALASSIA E LE SUE STELLE (galassie.js stelleGalassia: il campione; lingua.js stellaVera: le stelle vere)
// =====================================================================================================
// la funzione di massa di Kroupa di leggi.js (massaNascita è la sua inversa): densità ∝ 2m^−1,3 sotto 0,5 M☉, m^−2,3 sopra, da
// 0,08 a 100 M☉. I momenti esatti, anche dentro una classe di massa [m1, m2)
const KR = [[0.08, 0.5, 2, -1.3], [0.5, 100, 1, -2.3]];
const momentoKroupa = (k, m1 = 0.08, m2 = 100) => { let s = 0; for (const [a, b, c, al] of KR) { const lo = Math.max(a, m1), hi = Math.min(b, m2); if (hi > lo) s += (c * (hi ** (k + al + 1) - lo ** (k + al + 1))) / (k + al + 1); } return s; };
const mediaKroupa = (m1, m2) => momentoKroupa(1, m1, m2) / momentoKroupa(0, m1, m2), varianzaKroupa = (m1, m2) => momentoKroupa(2, m1, m2) / momentoKroupa(0, m1, m2) - mediaKroupa(m1, m2) ** 2;
const EK = mediaKroupa(0.08, 100), VK = varianzaKroupa(0.08, 100);
{ // C6 (precisione): la massa media che galassie.js usa per dire quante stelle vere fa una massa nata, contro quella esatta
  const POP = GA.popolazione(), quadr = (N) => { let mm = 0, ww = 0; for (let i = 0; i < N; i++) { const s = ((i + 0.5) * 15) / N, w = Math.exp(-s); mm += w * LG.massaNascita(1 - w); ww += w; } return mm / ww; };
  const q1 = quadr(360), q2 = quadr(720), coda = 100 * Math.exp(-15); // (la stessa regola a passo doppio e metà: Richardson; la coda tagliata a u = 1 − e^−15)
  riga({ c: 'C6', passaggio: 'galassia → stelle: la popolazione (galassie.js)', grandezza: 'massa media alla nascita (M☉)', padre: EK, figli: POP.massaMedia, tol: (4 / 3) * Math.abs(q1 - q2) + coda * EK, da: 'precisione: Richardson della quadratura (360 contro 720 punti) + la coda oltre u = 1 − e⁻¹⁵' });
}
const CAMPIONI = tempo('galassie del campione', () => GAL.map((gid) => ({ gid, Gx: CO.galassia(N_COSMO, gid) })));
{ // C6: la massa nata nella storia della galassia (il padre) e quella delle stelle del campione per il loro peso (i figli)
  let padre = 0, figli = 0, v = 0, chi2 = 0, gradi = 0, tolNum = 0;
  const POP = GA.popolazione(), { T0: TT, DT } = GA.dentro, NR = GA.ANELLI;
  for (const { Gx } of CAMPIONI) {
    const e = Gx.forma.interno, perPasso = new Float64Array(e.nt + 1); let tot = 0;
    for (let i = 1; i <= e.nt; i++) { let m = e.est[i]; for (let k = 0; k < NR; k++) m += e.nati[i * NR + k]; perPasso[i] = m; tot += m; }
    const S = Gx.stelle.filter((s) => s.supernova == null), n = S.length, peso = Gx.pesoCampione;
    padre += tot; figli += peso * somma(S.map((s) => s.massaNascita ?? s.massa)); v += peso * peso * n * VK; tolNum += tot * Math.abs(POP.massaMedia / EK - 1);
    // quando sono nate: le stelle del campione per passo, raggruppate in sei gruppi di passi con la stessa massa nata
    const gruppo = new Int32Array(e.nt + 1), attesi = new Float64Array(6), visti = new Float64Array(6); let c = 0;
    for (let i = 1; i <= e.nt; i++) { gruppo[i] = Math.min(5, Math.floor((6 * (c + perPasso[i] / 2)) / tot)); c += perPasso[i]; attesi[gruppo[i]] += (n * perPasso[i]) / tot; }
    for (const s of S) { const nascita = TT - s.eta / 1e9, i = Math.max(1, Math.min(e.nt, Math.floor(nascita / DT) + 1)); visti[gruppo[i]]++; }
    for (let g = 0; g < 6; g++) if (attesi[g] > 0) { chi2 += (visti[g] - attesi[g]) ** 2 / attesi[g]; gradi++; } gradi--;
  }
  riga({ c: 'C6', passaggio: `galassia → stelle del campione (${CAMPIONI.length} galassie)`, grandezza: 'massa nata in tutta la storia (M☉)', padre, figli, tol: 4 * Math.sqrt(v) + tolNum, da: '4·peso·√(n·Var Kroupa) (campionamento) + l\'errore numerico della massa media' });
  riga({ c: 'C6', passaggio: `galassia → stelle del campione (${CAMPIONI.length} galassie)`, grandezza: `quando sono nate: χ² su 6 gruppi di passi (${gradi} gradi)`, padre: gradi, figli: chi2, scarto: probabilitaChi2(chi2, gradi) >= P4 ? 0 : Infinity, tol: 0, da: `p(χ²) = ${num(probabilitaChi2(chi2, gradi), 3)} ≥ ${num(P4, 2)} (quattro scarti)` });
}
{ // C8: due evoluzioni della stessa popolazione. T_grossa: la storia della galassia a passi (la massa resa al gas e i collassi
  // per generazione, galassie.js popolazione); T_fine: ogni stella del campione evolve da sola con stelle.js fino alla sua età.
  let padre = 0, figli = 0, v = 0, storia = 0, esplose = 0, pesoEsplose = 0;
  for (const { Gx } of CAMPIONI) {
    const F2 = Gx.forma, S = Gx.stelle.filter((s) => s.supernova == null), peso = Gx.pesoCampione, m = S.map((s) => s.massa), mm = somma(m) / m.length;
    padre += F2.massaStelle; figli += peso * somma(m); v += peso * peso * somma(m.map((x) => (x - mm) ** 2));
    for (let j = 1; j <= GA.PASSI; j++) storia += F2.storia.collasso[j] * F2.storia.dt * 1e9;
    // (le stelle venute con le fusioni sono esplose, quasi tutte, nella galassia da cui venivano: la storia di questa non le conta)
    const e = S.filter((s) => (s.stato === 'stella di neutroni' || s.stato === 'buco nero') && !s.venuta).length; esplose += e; pesoEsplose += e * peso * peso;
  }
  const nExpl = somma(CAMPIONI.map(({ Gx }) => Gx.stelle.filter((s) => s.supernova == null && (s.stato === 'stella di neutroni' || s.stato === 'buco nero') && !s.venuta).length * Gx.pesoCampione));
  riga({ c: 'C8', passaggio: 'galassia → stelle: l\'evoluzione', grandezza: 'massa in stelle oggi (vive + resti, M☉): storia a passi contro stelle una per una', padre, figli, tol: 4 * Math.sqrt(v), da: '4 scarti di campionamento (varianza delle masse di oggi nel campione)' });
  riga({ c: 'C8', passaggio: 'galassia → stelle: l\'evoluzione', grandezza: 'collassi in tutta la storia: ritmo della storia contro stelle di neutroni e buchi neri del campione', padre: storia, figli: nExpl, tol: 4 * Math.sqrt(pesoEsplose), da: `Poisson: 4·peso·√n (${esplose} resti nel campione)` });
}
{ // C8: la soglia di comodo «gigante a 0,9 della vita, T ≤ 4200 K» del catalogo (la grana della galassia) contro stelle.js
  const d = [];
  for (const { Gx } of CAMPIONI) for (const s of Gx.stelle) if (s.stato === 'gigante rossa') { const v = ST.stella(s.massa, { Z: s.Z, eta: s.eta }); d.push((s.T - v.T) / v.T); }
  const med = d.length ? somma(d.map(Math.abs)) / d.length : NaN;
  riga({ c: 'C8', passaggio: 'galassia → stella: la gigante del catalogo', grandezza: `temperatura delle giganti: catalogo − stelle.js, |media relativa| su ${d.length}`, padre: 0, figli: med, esito: 'misurato', da: 'soglia di comodo dichiarata (grandezze.js SOGLIE, galassie.js «eta > 0.9 * vita»): nessun limite dal modello' });
}
{ // C6: la stella del campione (il padre: classe di massa, passo di nascita, massa) e le sue stelle vere (lingua.stellaVera)
  const { Gx } = CAMPIONI[0], gid = CAMPIONI[0].gid, scelte = [], K = 40;
  for (let s = 0; scelte.length < 8 && s < Gx.stelle.length; s += 97) if (LI.stelleVereDi(Gx.stelle[s]) > K) scelte.push(s);
  let fuori = 0, somma1 = 0, attesa = 0, v = 0, quante = 0;
  tempo('stelle vere', () => { for (const s of scelte) for (let k = 0; k < K; k++) {
    const V = LI.stellaVera(`cosmo ${N_COSMO}/galassia ${gid}/stella ${s}/vera ${k}`), m = V.massaNascita;
    if (!(m >= V.classe.da && m < V.classe.a * (1 + 4 * EPS)) || !(V.campione.massaNascita ?? V.campione.massa) || !((V.campione.massaNascita ?? V.campione.massa) >= V.classe.da)) fuori++;
    const nascita = GA.dentro.T0 - V.eta / 1e9; if (!(nascita >= V.passo.da && nascita <= V.passo.a)) fuori++;
    somma1 += m; attesa += mediaKroupa(V.classe.da, V.classe.a); v += varianzaKroupa(V.classe.da, V.classe.a); quante++; } });
  riga({ c: 'C6', passaggio: 'stella del campione → stelle vere (lingua.js)', grandezza: `classe di massa e passo di nascita: vere fuori da quelli del campione (${quante})`, padre: 0, figli: fuori, tol: 0, da: 'esatto: la classe e il passo sono del padre' });
  riga({ c: 'C6', passaggio: 'stella del campione → stelle vere (lingua.js)', grandezza: `massa media di ${quante} vere contro Kroupa nella classe (M☉)`, padre: attesa / quante, figli: somma1 / quante, tol: (4 * Math.sqrt(v)) / quante, da: '4·√(Σ Var(m | classe))/n (campionamento)' });
  // la massa della galassia vista dal campione (peso·m) e dalle vere (N·⟨m | classe⟩): in media uguali, perché la massa del
  // campione è estratta dalla stessa legge (E[E[m | classe]] = E[m]); lo scarto è quello dentro le classi più l'arrotondamento di N
  let pad = 0, fig = 0, vv = 0, arr = 0;
  for (const s of Gx.stelle) { if (s.supernova != null) continue; const m0 = s.massaNascita ?? s.massa, g = LI.OPZIONI.granaMassa, j = Math.min(Math.ceil(Math.log10(100 / 0.08) / g) - 1, Math.floor(Math.log10(m0 / 0.08) / g + 1e-12)), a = 0.08 * 10 ** (j * g), b = Math.min(100, 0.08 * 10 ** ((j + 1) * g)), N = LI.stelleVereDi(s);
    pad += s.peso * m0; fig += N * mediaKroupa(a, b); vv += s.peso * s.peso * varianzaKroupa(a, b); arr += Math.abs(N - s.peso) * b; }
  riga({ c: 'C6', passaggio: `stella del campione → stelle vere (galassia ${gid})`, grandezza: 'massa nata: peso·m del campione contro N·⟨m | classe⟩ delle vere (M☉)', padre: pad, figli: fig, tol: 4 * Math.sqrt(vv) + arr, da: '4·√(Σ peso²·Var(m | classe)) + Σ|N − peso|·m_max (N intero)' });
}
manca('C6', 'stella del campione → stelle vere', 'il sistema dei pianeti, il luogo', 'μ', 'le N stelle vere hanno il sistema e il posto del campione (LINGUA.md § 2, «non torna»: il modello ne calcola uno per stella del campione)');

{ // C6: la catena degli elementi (elementi.js, galassie.js): i metalli del gas di ogni galassia divisi per canale (chi li ha
  // fatti) sommano ai metalli del gas; la miscela di ogni generazione somma a 1
  let peggio = 0; for (const G of C.galassie) { const e = G.forma.interno, z = e.gasZ; if (z > 0) peggio = Math.max(peggio, Math.abs(somma(Array.from(e.gasZC)) - z) / z); }
  riga({ c: 'C6', passaggio: `galassia → canali dei metalli (${NG} galassie, galassie.js)`, grandezza: 'Σ canali / metalli del gas − 1 (il peggiore)', padre: 0, figli: peggio, tol: 1e4 * EPS, da: 'precisione: ~10⁴ operazioni per serbatoio (46 passi × 20 anelli × i flussi)·ε' });
}

// =====================================================================================================
// 3. LA STELLA, IL SUO DISCO, I PIANETI (disco.js)
// =====================================================================================================
const SISTEMI = [];
for (const { gid, Gx } of CAMPIONI) for (let k = 0; k < 12; k++) { const sid = (k * 211 + 7 * gid) % CO.STELLE, S0 = Gx.stelle[sid]; if (S0.stato === 'in vita' || S0.stato === 'gigante rossa' || S0.stato === 'nana bianca') SISTEMI.push({ gid, sid, S0 }); }
{
  let peggioDisco = 0, tolDisco = 0, peggioPianeti = 0, tolPianeti = 0, pianeti = 0, saltati = 0;
  tempo('dischi e pianeti', () => { for (const { gid, sid, S0 } of SISTEMI) {
    const st = { massa: S0.massaNascita || S0.massa, Z: S0.Z ?? 1, eta: S0.eta }, seme = CO.casoDisco(N_COSMO, gid, sid), D = DI.disco(st, seme);
    // la massa del gas: Σ(r) = Σ₀·r^−3/2 da 0 al bordo esterno; con r = s² l'integrando è costante (punto medio esatto)
    const n = 64, ds = Math.sqrt(D.rOut) / n; let m = 0; for (let i = 0; i < n; i++) { const s = (i + 0.5) * ds, r = s * s; m += 2 * Math.PI * r * D.sigmaGas(r) * UA * UA * 2 * s * ds; }
    const z = Math.abs(m - D.massaKg) / D.massaKg; if (z > peggioDisco) peggioDisco = z; tolDisco = 4 * n * EPS;
    // i pianeti: i solidi di ognuno più il cibo non mangiato delle sue strisce sono la massa di isolamento di quelle strisce
    for (const q of DI.formaPianeti(st, seme)) { const f = q.formazione, k = (S0.Z ?? 1) * DI.DISCO.metalliSole;
      const solidi = q.tipo === 'gassoso' ? (q.composizione.pesanti < 0.5 ? (q.massaKg * (q.composizione.pesanti - k)) / (1 - k) : NaN) : q.massaKg * (1 - (q.involucro || 0));
      if (!Number.isFinite(solidi)) { saltati++; continue; } pianeti++;
      const r = Math.abs(solidi + f.cibo - f.mIso) / f.mIso; if (r > peggioPianeti) peggioPianeti = r; }
    tolPianeti = 6000 * 4 * EPS; } });
  riga({ c: 'C6', passaggio: `stella → disco (${SISTEMI.length} sistemi)`, grandezza: 'massa del gas: ∫2πrΣ dr / massa del disco − 1 (il peggiore)', padre: 0, figli: peggioDisco, tol: tolDisco, da: 'precisione: 4·n·ε (punto medio esatto in √r)' });
  riga({ c: 'C6', passaggio: `disco (strisce) → pianeti (${pianeti}${saltati ? `, ${saltati} giganti col tetto ai pesanti saltati` : ''})`, grandezza: '(solidi + cibo non mangiato) / massa di isolamento − 1 (il peggiore)', padre: 0, figli: peggioPianeti, tol: tolPianeti, da: 'precisione: al più 6000 corpi sommati (il tetto di formaPianeti), 4ε per somma' });
}

// =====================================================================================================
// 4. IL PIANETA, LA SUPERFICIE, LE TESSERE (geologia.js)
// =====================================================================================================
let MONDO = null;
tempo('ricerca di un pianeta con il mare', () => { cerca: for (const { gid, sid } of SISTEMI) {
  const S = CO.sistema(N_COSMO, gid, sid);
  for (const p of S.pianeti) if (p.tipo === 'roccioso' && p.clima.acqua === 'liquida' && p.clima.bilancio?.arriva > 0.05 && p.clima.mare > 0.15 && p.clima.mare < 0.85 && p.interno.acquaKg > 0) { MONDO = { gid, sid, p }; break cerca; }
} });
if (!MONDO) {
  for (const g of ['acqua (volume del mare)', 'temperatura media', 'continenti, mare, quota']) manca('C6', 'pianeta → superficie', g, 'μ', `nessun pianeta roccioso con un mare tra il 15 e l'85% nei ${SISTEMI.length} sistemi guardati`);
} else {
  const { p } = MONDO, chiave = `coerenza scale|${N_COSMO}|${MONDO.gid}|${MONDO.sid}|${p.id}`;
  const sf = tempo('superficie', () => GE.superficiePianeta(chiave, p, p.interno, p.origine)), cl = tempo('clima sulla mappa', () => GE.climaSuperficie(chiave, p, sf, { aria: false })), se = tempo('erosione', () => GE.erosione(chiave, sf, cl));
  // C6: l'acqua che l'interno dà alla superficie (il padre) e il volume sotto il livello del mare della mappa (i figli)
  const volume = (m) => { const { W, H, alt, mare } = m, R = p.raggioM; let V = 0, A = 0, lo = Infinity, hi = -Infinity; for (let j = 0; j < H; j++) { const a = (Math.cos(Math.PI / 2 - ((j + 0.5) / H) * Math.PI) * (2 * Math.PI * R * R * (Math.PI / H))) / W; for (let i = 0; i < W; i++) { const h = alt[j * W + i]; A += a; lo = Math.min(lo, h); hi = Math.max(hi, h); if (h < mare) V += (mare - h) * a; } } return { V, A, lo, hi, N: W * H }; };
  for (const [nome, m] of [['superficie', sf], ['superficie erosa', se]]) { const v = volume(m), acqua = p.interno.acquaKg / 1000;
    riga({ c: nome === 'superficie' ? 'C6' : 'C8', passaggio: `pianeta → ${nome} (geologia.js)`, grandezza: 'acqua in superficie (m³)', padre: acqua, figli: v.V, tol: v.A * (v.hi - v.lo) * 2 ** -44 + 4 * v.N * EPS * acqua, da: 'precisione: la bisezione del livello del mare (44 passi) + n·ε' }); }
  // C8: il clima per fasce (la grana del pianeta: clima()) e quello della mappa (64 × 32 celle, terre e mari veri, senza i venti)
  riga({ c: 'C8', passaggio: 'pianeta → superficie: il clima', grandezza: `temperatura media (K): fasce contro mappa (mare ${num(100 * p.clima.mare, 2)}% atteso)`, padre: p.clima.T, figli: cl.Tglobale, esito: 'misurato', da: 'le due grane hanno geografie diverse (la mappa vede dove sono le terre): nessun limite dal modello' })
  // C6: IL LIBRO DEI CONTI (elementi.js, lavoro 8): per ogni elemento la somma dei serbatoi (nucleo, mantello, crosta, mare,
  // aria, ghiacci, involucro) contro ciò che il disco ha dato al pianeta; un serbatoio che chiede più di quanto il suo
  // fornitore ha è uno «scoperto»: non torna anche se la somma torna
  { const st = tempo('mare (per il libro dei conti)', () => mareDi(p, sf, cl, se)), L = EL.libroDeiConti(p, { mare: st });
    if (!L) manca('C6', 'pianeta → serbatoi (elementi.js)', 'massa per elemento', 'μ', 'il pianeta non porta la sua catena degli elementi');
    else riga({ c: 'C6', passaggio: `pianeta → serbatoi (elementi.js, ${Object.keys(L.disco).length} elementi)`, grandezza: `Σ serbatoi / disco − 1, il peggiore${L.peggiore ? ` (${L.peggiore})` : ''}; scoperti ${L.scoperti.length}`, padre: 0, figli: L.scoperti.length ? Infinity : L.scarto, tol: 1e6 * EPS, da: 'precisione: ≤ 6000 embrioni × 50 elementi sommati, più le sottrazioni del libro: 10⁶·ε (uno scoperto non torna mai)' }); };
  // C6: le tessere (L = 1) contro la madre erosa letta come la legge la legge (bilineare sulle celle)
  const { W, H } = se, n = 4, f1 = W / 9, f2 = W / 3.1, N1 = f1 * (f1 / 2), N2 = f2 * (f2 / 2), amp = 260 * 0.36;
  const bil = (fx, fy) => { const x0 = Math.floor(fx), y0 = Math.floor(fy), u = fx - x0, v = fy - y0, ix = (x) => ((x % W) + W) % W, iy = (y) => Math.max(0, Math.min(H - 1, y)), a = iy(y0) * W, b = iy(y0 + 1) * W, P0 = ix(x0), P1 = ix(x0 + 1); return se.alt[a + P0] * (1 - u) * (1 - v) + se.alt[a + P1] * u * (1 - v) + se.alt[b + P0] * (1 - u) * v + se.alt[b + P1] * u * v; };
  let dCont = 0, dMare = 0, tMare = 0, dQuota = 0, tQuota = 0, nT = 0;
  tempo('tessere', () => { for (const [tx, ty] of [[1, 2], [3, 1]]) {
    const t = GE.tessera(chiave, se, cl, 1, tx, ty, p.origine); let mare = 0, mareM = 0, quota = 0, quotaM = 0, cont = 0, contM = 0;
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const c = j * W + i, gu = (tx + (i + 0.5) / W) / n, gv = (ty + (j + 0.5) / H) / n, h = bil(gu * W - 0.5, gv * H - 0.5);
      if (t.alt[c] < t.mare) mare++; if (h < se.mare) mareM++; quota += t.alt[c]; quotaM += h; cont += t.cont[c]; contM += se.cont[Math.min(H - 1, Math.floor(gv * H)) * W + Math.min(W - 1, Math.floor(gu * W))]; }
    const N = W * H, fM = mareM / N; nT++;
    dCont = Math.max(dCont, Math.abs(cont - contM) / N);
    if (Math.abs(mare / N - fM) / (4 * Math.sqrt((fM * (1 - fM)) / N1)) > dMare / (tMare || 1)) { dMare = Math.abs(mare / N - fM); tMare = 4 * Math.sqrt((fM * (1 - fM)) / N1); }
    const tq = 4 * amp * Math.sqrt(1 / 12) * Math.sqrt(1 / N1 + 0.45 ** 2 / N2); if (Math.abs(quota - quotaM) / N / tq > dQuota / (tQuota || 1)) { dQuota = (quota - quotaM) / N; tQuota = tq; } } });
  riga({ c: 'C6', passaggio: `superficie → tessere (${nT} di livello 1)`, grandezza: 'parte di continente: tessera − madre', padre: 0, figli: dCont, tol: 4 * W * H * EPS, da: 'esatto: ogni cella della madre ha 4 × 4 figlie' });
  riga({ c: 'C6', passaggio: `superficie → tessere (${nT} di livello 1)`, grandezza: 'parte di mare: tessera − madre bilineare (la peggiore)', padre: 0, figli: dMare, tol: tMare, da: `campionamento: 4·√(f(1 − f)/N₁), N₁ = ${Math.round(N1)} celle indipendenti del rumore del dettaglio` });
  riga({ c: 'C6', passaggio: `superficie → tessere (${nT} di livello 1)`, grandezza: 'quota media (m): tessera erosa − madre bilineare (la peggiore)', padre: 0, figli: dQuota, tol: tQuota, da: `campionamento: 4·A·σ_U·√(1/N₁ + 0,45²/N₂) del rumore del dettaglio (A = ${num(amp, 3)} m, σ_U = 1/√12)`,
    nota: { perche: 'la quota della tessera non ha la media della madre: la costa condizionata (sulMare) scende in linea retta fino a zero e la costa spostata dal dettaglio costa quota dove il fondale è più fondo di quanto la terra è alta (dichiarato in geologia.js, misurato prima dell\'erosione: +9 m, al più 22); qui in più la tessera è erosa di nuovo per la durata dell\'erosione della madre, che lo era già (M∘T_fine∘μ∘T_grossa contro T_grossa)', dove: 'geologia.js tessera (sulMare, erosione con durata = radice.durataErosione)' } });
  // =====================================================================================================
  // 5. LA TESSERA E LA ROCCIA (rocce.js), LA ROCCIA E I SUOI GRANI (grani.js)
  // =====================================================================================================
  const ricetta = (se.materiali?.continente?.length ? se.materiali.continente : RO.GRANITO).map((m) => ({ nome: m.nome, frazione: m.frazione, colore: m.colore || [128, 128, 128], anisotropia: 1.2 }));
  const ROCCE = tempo('rocce', () => [
    ['continente (raffreddata piano)', RO.cristallizza({ raffreddamento: 0.003, minerali: ricetta, seme: fonte.sotto('roccia/continente') }), 0.04],
    ['basalto (raffreddato in fretta)', RO.cristallizza({ raffreddamento: 0.15, minerali: (se.materiali?.basalto?.length ? se.materiali.basalto : RO.BASALTO).map((m) => ({ ...m, anisotropia: 1.2 })), seme: fonte.sotto('roccia/basalto') }), 0.004],
    ['lava vetrosa (raffreddamento 0,5)', RO.cristallizza({ raffreddamento: 0.5, minerali: RO.BASALTO, seme: fonte.sotto('roccia/vetro') }), 0.004],
  ]);
  // le aree dei grani di una roccia simulata: per l'errore multinomiale della sua composizione
  const multinomiale = (aree, f) => { const A = somma(aree); return Math.sqrt((f * (1 - f) * somma(aree.map((a) => a * a))) / (A * A)); };
  { const [, r] = ROCCE[0], tot = somma(ricetta.map((m) => m.frazione)), aree = new Float64Array(r.nGrani); for (const g of r.grano) if (g >= 0) aree[g]++;
    let peggio = 0, sc = 0, tl = 1; ricetta.forEach((m, k) => { const f = m.frazione / tot, t = 4 * multinomiale(Array.from(aree), f), z = Math.abs(r.frazioni[k] - f) / t; if (z > peggio) { peggio = z; sc = r.frazioni[k] - f; tl = t; } });
    riga({ c: 'C6', passaggio: 'tessera → roccia del continente (mappa.js → rocce.js)', grandezza: `composizione: area di un minerale − la ricetta della crosta (il peggiore, ${r.nGrani} cristalli)`, padre: 0, figli: sc, tol: tl, da: '4 scarti multinomiali sui cristalli (Σa²/(Σa)²)' }); }
  for (const [nome, r, larghezzaM] of ROCCE) {
    if (!(r.nGrani > 0)) { manca('C6', `roccia → grani: ${nome}`, 'densità dei grani', 'μ', 'la roccia è tutta vetro: nessun grano'); continue; }
    const cellaM = larghezzaM / r.N, u = Math.max(cellaM, r.granoMedio * cellaM), X = r.cristallino;
    const campo = GR.campoGrani({ modo: 'tassellatura', granoM: u, cristallino: X, minerali: r.minerali, polarizzata: true }, fonte.sotto(`grani/${nome}`));
    // i grani di un quadrato largo 40 grani medi (più un margine): letti su una griglia di u/8, contati per baricentro
    const L = 40, marg = 4, h = 1 / 8, nn = Math.round((L + 2 * marg) / h), visti = new Map(); let pieni = 0, dentro = 0;
    tempo(`grani: ${nome}`, () => { for (let j = 0; j < nn; j++) for (let i = 0; i < nn; i++) { const x = -marg + (i + 0.5) * h, y = -marg + (j + 0.5) * h, g = campo.granoIn(x * u, y * u), qui = x >= 0 && x < L && y >= 0 && y < L;
      if (qui) { dentro++; if (g) pieni++; } if (!g) continue; let q = visti.get(g.indirizzo); if (!q) visti.set(g.indirizzo, (q = { sx: 0, sy: 0, n: 0, m: g.minerale })); q.sx += x; q.sy += y; q.n++; } });
    const tutti = [...visti.values()], nostri = tutti.filter((q) => q.sx / q.n >= 0 && q.sx / q.n < L && q.sy / q.n >= 0 && q.sy / q.n < L), atteso = campo.conta(L * L * u * u);
    // (i grani più piccoli della griglia di lettura sfuggono: quelli nati nell'ultimo tratto prima che il fuso si fermi, I·(1 − X)·⅔·h/√π per u²)
    const I = X >= 0.9999 ? Math.pow(4 / Math.PI / GR.AVRAMI_2D, 1.5) : Math.pow((4 / Math.PI) * X / (GR.AVRAMI_2D * GR.natiFinoA(X)), 1.5), persi = L * L * I * Math.max(1 - X, 0) * (2 / 3) * (h / Math.sqrt(Math.PI)) * Math.E;
    riga({ c: 'C6', passaggio: `roccia → grani: ${nome}`, grandezza: `densità dei grani in 40 × 40 grani medi (X = ${num(X, 3)})`, padre: atteso, figli: nostri.length, tol: 4 * Math.sqrt(atteso) + persi, da: 'Poisson 4√N (per eccesso: una tassellatura è più regolare) + i grani più piccoli della griglia di lettura' });
    // la parte cristallina e la composizione: il padre le ha sui suoi cristalli, i figli sui loro
    const areePadre = new Float64Array(r.nGrani); for (const g of r.grano) if (g >= 0) areePadre[g]++;
    // (sopra X = 0,9999 grani.js ferma il fuso a 2,4 tempi di Avrami: resta vetro per e^(−2,4³) = 10⁻⁶, che si legge punto per punto)
    const q = Math.max(1 - X, X >= 0.9999 ? Math.exp(-(2.4 ** 3)) : 0), sigX = Math.sqrt(q * (1 - q) * (1 / Math.max(1, nostri.length) + 1 / r.nGrani));
    riga({ c: 'C6', passaggio: `roccia → grani: ${nome}`, grandezza: 'parte cristallina (il resto è vetro)', padre: X, figli: pieni / dentro, tol: 4 * sigX + (X >= 0.9999 ? q + 4 * Math.sqrt(q / dentro) : 0) + 1 / dentro, da: '4·√(q(1 − q)·(1/n_figli + 1/n_padre)) un grano alla volta, q la parte di vetro (≥ e^(−2,4³) se X = 1: allora Poisson sui punti) + un punto di griglia' });
    let peggio = -1, sc = 0, tl = 0;
    r.minerali.forEach((m, k) => { const fp = r.frazioni[k], aree = tutti.map((q) => q.n), fig = somma(tutti.filter((q) => q.m === m.nome).map((q) => q.n)) / somma(aree), t = 4 * Math.sqrt(multinomiale(aree, fp) ** 2 + multinomiale(Array.from(areePadre), fp) ** 2) + 1 / somma(aree); const z = Math.abs(fig - fp) / t; if (z > peggio) { peggio = z; sc = fig - fp; tl = t; } });
    riga({ c: 'C6', passaggio: `roccia → grani: ${nome}`, grandezza: 'composizione: area di un minerale, grani − roccia (il peggiore)', padre: 0, figli: sc, tol: tl, da: '4 scarti multinomiali, figli e padre (Σa²/(Σa)²)' });
  }
}

// =====================================================================================================
// 6. IL GRANO E I SUOI ATOMI (materia.js reticolo e atomi; atomi3d.js l'acqua)
// =====================================================================================================
{ // C6: un minerale è neutro; la sua cella, contata con le cariche formali degli elementi, deve esserlo per formula
  const OX = { H: 1, Na: 1, K: 1, Mg: 2, Ca: 2, Fe: 2, Al: 3, Si: 4, C: 4, S: 6, O: -2, Cl: -1 }, buoni = [], cattivi = [];
  for (const nome of Object.keys(MA.RETICOLI)) { if (nome === 'ghiaccio') continue; const R = MA.reticolo(nome), q = somma(R.atomi.map((a) => OX[a.el] * a.occ)) / R.formulePerCella; (Math.abs(q) < 1e-9 ? buoni : cattivi).push([nome, q]); }
  riga({ c: 'C6', passaggio: 'grano → atomi: la cella (materia.js)', grandezza: `carica formale per formula: ${buoni.map(([n]) => n).join(', ')}`, padre: 0, figli: Math.max(0, ...buoni.map(([, q]) => Math.abs(q))), tol: 64 * EPS, da: 'esatto (occupazioni e somme: n·ε)' });
  // (le tre celle che si sa non essere neutre: le altre, se ce ne fossero, sarebbero un'incoerenza nuova)
  const NOTI = ['feldspato potassico', 'plagioclasio', 'biotite'];
  for (const [nome, q] of cattivi) riga({ c: 'C6', passaggio: 'grano → atomi: la cella (materia.js)', grandezza: `carica formale per formula: ${nome} (formula ${MA.MATERIALI?.[nome]?.formula ?? ''})`, padre: 0, figli: q, tol: 64 * EPS, da: 'esatto',
    nota: !NOTI.includes(nome) ? null : { perche: nome === 'biotite' ? 'la cella della flogopite ha i 12 ossigeni della formula ma non gli idrogeni degli ossidrili, e mette silicio dove un posto su quattro è alluminio: per formula mancano +1 cariche' : 'la cella mette silicio in tutti i posti tetraedrici (un quarto, nel feldspato, è alluminio) e un solo catione (il plagioclasio vero è Na₀,₆Ca₀,₄): per formula avanza una carica', dove: `materia.js RETICOLI['${nome}'] (dichiarato nella fonte della cella; atomi() non sa ancora mettere due elementi sullo stesso posto)` } });
}
{ // C6: quanti atomi in un campione di quarzo (il padre: la densità della cella) e quanti ne mette atomi() (i figli)
  const latoM = 3e-9, a = MA.atomi('quarzo', { latoM, T: 288 }, fonte.sotto('atomi/quarzo')), R = MA.reticolo('quarzo'), L = latoM * 1e10, s = a.spessoreM * 1e10, perA3 = somma(R.atomi.map((x) => x.occ)) / R.volume;
  const lato = Math.max(R.cella.a, R.cella.b, R.cella.c) + 8 * Math.max(...Object.values(a.agitazione));
  riga({ c: 'C6', passaggio: 'grano → atomi: un campione di quarzo (materia.js atomi)', grandezza: `atomi in ${num(L, 3)} × ${num(L, 3)} × ${num(s, 3)} Å`, padre: perA3 * L * L * s, figli: a.atomi.length, tol: perA3 * 4 * L * s * lato, da: 'geometria: gli atomi di uno strato largo una cella (più 8 scarti dell\'agitazione) lungo il bordo' });
}
const ACQUA = tempo('scena d\'acqua', () => A3.scenaAcqua({ latoNm: 4, salinita: 35 }, fonte.sotto('acqua')));
{ // C6: la salinità che il mare dichiara (35 g/kg) e quella delle molecole e degli ioni della scena
  const u = { H2O: 18.01528, Na: 22.98977, Cl: 35.453 }, ioni = ACQUA.parti.slice(1), mi = (d) => somma(ioni.map((q) => (q.a - q.da + d) * u[q.nome.replace(/[+-]/g, '')])), mw = (d) => (ACQUA.molecole + d) * u.H2O, S = (di, dw) => (1000 * mi(di)) / (mi(di) + mw(dw));
  const tol = Math.max(...[[0.5, -0.5], [-0.5, 0.5]].map(([a, b]) => Math.abs(S(a, b) - S(0, 0))));
  riga({ c: 'C6', passaggio: 'acqua di mare → atomi (atomi3d.js)', grandezza: 'salinità (g/kg)', padre: ACQUA.salinita, figli: S(0, 0), tol, da: `numero dei figli: mezzo ione e mezza molecola d'arrotondamento (${ioni.map((q) => `${q.a - q.da} ${q.nome}`).join(', ')}, ${ACQUA.molecole} H₂O)` });
  riga({ c: 'C6', passaggio: 'acqua di mare → atomi (atomi3d.js)', grandezza: 'ioni messi − ioni chiesti', padre: somma(ACQUA.ioni.map((x) => x.quanti)), figli: somma(ioni.map((q) => q.quanti)), tol: 0, da: 'esatto' });
}

// =====================================================================================================
// 7. L'ATOMO E LA SCALA QUANTISTICA (quanti.js)
// =====================================================================================================
{
  const ioni = ACQUA.parti.filter((q) => Number.isInteger(q.carica)), casi = [];
  for (const q of ioni) { const at = Q.atomoDaScena(ACQUA, q.da), s = Q.statoDi(at); casi.push({ nome: q.nome, Z: at.Z, q: q.carica, e: s.elettroni, s }); }
  for (const x of casi) riga({ c: 'C6', passaggio: 'atomi → scala quantistica (quanti.js)', grandezza: `elettroni dello ione ${x.nome} dell'acqua di mare (Z = ${x.Z})`, padre: x.Z - x.q, figli: x.e, tol: 64 * EPS * x.Z, da: 'esatto (somma dei pesi dei sottogusci: n·ε)' });
  // gli elettroni sono la densità: Σ peso·∫|ψ|² sul componente, radiale (Simpson, Richardson tra M e 2M) per angolare (Gauss-Legendre × φ uniforme)
  const s = casi[0].s, gl = (n) => { const x = [], w = []; for (let i = 1; i <= n; i++) { let z = Math.cos((Math.PI * (i - 0.25)) / (n + 0.5)), dp = 0; for (let it = 0; it < 100; it++) { let p0 = 1, p1 = z; for (let k = 2; k <= n; k++) { const p2 = ((2 * k - 1) * z * p1 - (k - 1) * p0) / k; p0 = p1; p1 = p2; } dp = (n * (z * p1 - p0)) / (z * z - 1); const dz = p1 / dp; z -= dz; if (Math.abs(dz) < 1e-16) break; } x.push(z); w.push(2 / ((1 - z * z) * dp * dp)); } return { x, w }; };
  const G = gl(24), NF = 48, angolare = (Y) => { let a = 0; for (let i = 0; i < G.x.length; i++) { const z = G.x[i], r = Math.sqrt(1 - z * z); for (let k = 0; k < NF; k++) { const f = (2 * Math.PI * (k + 0.5)) / NF; a += G.w[i] * (2 * Math.PI / NF) * Y(r * Math.cos(f), r * Math.sin(f), z) ** 2; } } return a; };
  const radiale = (R, top, M) => { const h = top / M; let t = 0; for (let i = 0; i <= M; i++) { const r = i * h, f = r * r * R(r) ** 2; t += (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) * f; } return (t * h) / 3; };
  let el = 0, err = 0; for (const c of s.componenti) { const o = c.orbitale, top = (2 * (3 * o.n * o.n + 10 * o.n)) / o.Z, a = radiale(o.radiale, top, 4000), b = radiale(o.radiale, top, 8000); el += c.peso * (b + (b - a) / 15) * angolare(o.angolare); err += c.peso * (Math.abs(a - b) / 15 + 1e-12 + 64 * EPS); }
  riga({ c: 'C6', passaggio: 'atomi → scala quantistica (quanti.js)', grandezza: `elettroni dalla densità: Σ peso·∫|ψ|² (${casi[0].nome})`, padre: s.elettroni, figli: el, tol: err + s.elettroni * 1e-12, da: 'precisione: Simpson estrapolato (Richardson, 4000 e 8000 punti), entro la sua stima |I₄₀₀₀ − I₈₀₀₀|/15, + la coda oltre la tabella di orbitale (< 10⁻¹²)' });
  // la misura (regola di Born): la distanza media degli esiti dal nucleo contro ⟨r⟩ della funzione d'onda
  const o = Q.orbitale(2, 1, 0, 1), rnd = contatore('coerenza scale/misure 2p'), n = 4000; let sr = 0; for (let i = 0; i < n; i++) sr += Math.hypot(...o.campiona(rnd));
  riga({ c: 'C6', passaggio: 'stato → misure (quanti.js, regola di Born)', grandezza: `⟨r⟩ di ${n} esiti, idrogeno 2p (a₀)`, padre: Q.rMedio(2, 1, 1), figli: sr / n, tol: 4 * Math.sqrt((Q.r2Medio(2, 1, 1) - Q.rMedio(2, 1, 1) ** 2) / n), da: '4·σ_r/√n (campionamento)' });
  // l'acqua: la molecola guardata (Hartree-Fock) ha gli elettroni dei suoi atomi
  let iO = -1; for (let i = 0; i < ACQUA.atomi.elemento.length && iO < 0; i++) if (ACQUA.atomi.elemento[i] === 8) iO = i;
  const at = Q.atomoDaScena(ACQUA, iO), W = tempo('Hartree-Fock dell\'acqua', () => Q.statoDi(at));
  riga({ c: 'C6', passaggio: 'atomi → scala quantistica (quanti.js)', grandezza: `elettroni della molecola d'acqua (${W.tipo})`, padre: somma(at.molecola.map((a) => a.Z)), figli: W.elettroni, tol: 64 * EPS * 10, da: 'esatto (n·ε)' });
}
{ // il nucleo e i nucleoni: le istantanee (eventi) contro ciò che il nucleo dichiara
  for (const Z of [8, 26]) {
    const nuc = Q.nucleo(Z), K = 120; let p = 0, nn = 0, carica = 0, r2 = 0, r4 = 0;
    tempo(`nucleo Z = ${Z}`, () => { for (let k = 0; k < K; k++) for (const x of Q.istantanea(nuc, `coerenza scale/nucleo ${Z}`, k).nucleoni) { if (x.tipo === 'p') { p++; const q = x.pos[0] ** 2 + x.pos[1] ** 2 + x.pos[2] ** 2; r2 += q; r4 += q * q; } else nn++; for (const qk of x.quark) carica += qk.sapore === 'u' ? 2 : -1; } }); // (la carica in terzi: un intero)
    riga({ c: 'C6', passaggio: `nucleo → nucleoni → quark (Z = ${Z}, ${K} istantanee)`, grandezza: 'protoni, neutroni, carica dei quark: scarto più grande', padre: 0, figli: Math.max(Math.abs(p - K * Z), Math.abs(nn - K * nuc.N), Math.abs(carica / 3 - K * Z)), tol: 0, da: 'esatto (conteggi interi; la carica in terzi di e)' });
    const m2 = r2 / p, s2 = Math.sqrt(r4 / p - m2 * m2) / Math.sqrt(p), ch = (r) => Math.sqrt(r + Q.RP2 + (nuc.N / Z) * Q.RN2);
    riga({ c: 'C6', passaggio: `nucleo → nucleoni (Z = ${Z}, ${nuc.forma.split(' (')[0]})`, grandezza: 'raggio di carica (fm): misurato contro √(⟨r²⟩ dei protoni + r_p² + N/Z·r_n²)', padre: nuc.rCarica, figli: ch(m2), tol: ch(m2 + 4 * s2) - ch(m2), da: '4 scarti di ⟨r²⟩ sulle istantanee (campionamento)' });
  }
}
manca('C8', 'atomi → scala quantistica', 'l\'evoluzione: il moto degli atomi della scena (atomi3d.js scena.tempo) e quello degli elettroni', 'M', 'la scena trema attorno a posti fissi (non è una dinamica), la scala quantistica prepara ogni misura uguale: nessuna evoluzione a due grane da confrontare');

// =====================================================================================================================================
// 8. LA FINESTRA A OGNI DISTANZA (finestra.js, PROGETTO.md lavoro 9): il mare, dal suo spettro ai nanometri
// =====================================================================================================================================
// Il mondo: il primo mare con il vento del catalogo (mare_col_vento.mjs: il primo roccioso con acqua liquida, il mare tra il
// 15 e l'85% e l'aria che circola), nel mare aperto con le onde più alte; il fango nel punto più torbido.
{
  const MV = tempo('il primo mare con il vento', () => mareColVento());
  if (!MV) for (const g of ['varianza delle onde', 'copertura di schiuma', 'torbidità', 'ioni']) manca('C6', 'mare → finestra (finestra.js)', g, 'μ', 'nessun mare con il vento nei primi pianeti del catalogo');
  else {
    const { st: SM, aperto: A0, torbido: TB, P: PM } = MV, opz = { lon: A0.lon, lat: A0.lat, fondoM: A0.fondoM, P: PM }, tr = FI.trattoDi(SM, A0.lon, A0.lat), [xc, yc] = FI.nelTratto(tr, A0.lon, A0.lat), sp = tr.sp;
    // C6: la varianza dell'altezza delle onde che la finestra aggiunge (le ottave da 4 punti al suo lato) = l'integrale dello
    // spettro del padre su quelle corone; K finestre indipendenti (lontane più di una tessera dell'ottava più lunga), legge esatta
    for (const [L, K] of [[1, 24], [0.01, 24]]) tempo(`finestra di ${L} m`, () => {
      const f0 = FI.finestraAcqua(SM, { ...opz, latoM: L }), b1 = Math.floor(Math.log2(L)), bande = f0.bande.filter((B) => B.b <= b1), passo = 4 * 2 ** (b1 + 2), n = 20, Q = [];
      const continuo = bande.reduce((a, B) => a + sp.varianza((2 * Math.PI) / 2 ** B.b, (4 * Math.PI) / 2 ** B.b), 0), discreto = bande.reduce((a, B) => a + B.varianza, 0);
      for (let q = 0; q < K; q++) { const x0 = xc + (q % 8) * passo, y0 = yc + Math.floor(q / 8) * passo; let s2 = 0; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const e = FI.ondeEsatte(tr, x0 + ((i + 0.5) * L) / n, y0 + ((j + 0.5) * L) / n, 1.7 * q, bande).eta; s2 += e * e; } Q.push(s2 / (n * n)); }
      const m = somma(Q) / K, sd = Math.sqrt(somma(Q.map((x) => (x - m) ** 2)) / (K - 1));
      FI.ONDE.quadratura = 8; const t8 = FI.trattoDi(SM, A0.lon, A0.lat), d8 = FI.bandeDelTratto(t8).filter((B) => B.b >= bande[0].b && B.b <= b1).reduce((a, B) => a + B.varianza, 0); FI.ONDE.quadratura = 4; FI.bandeDelTratto(t8);
      riga({ c: 'C6', passaggio: `mare (spettro del vento) → finestra di ${L >= 1 ? `${L} m` : `${L * 100} cm`} (finestra.js)`, grandezza: `varianza dell'altezza (m²) nelle ottave ${bande[0].b}…${b1}: ∫S contro le finestre`, padre: continuo, figli: m, tol: (4 * sd) / Math.sqrt(K) + 4 * Math.abs(d8 - discreto), da: `campionamento: 4·sd/√${K} finestre indipendenti, più la quadratura dei modi (Gauss-Legendre 4×4 contro 8×8 sulle celle)` });
    });
    // C6: la copertura della schiuma (Monahan) contro i punti coperti, su punti indipendenti; e la varianza 1 dell'accelerazione normalizzata
    tempo('schiuma', () => { const bande = FI.bandeDelTratto(tr), K = 1500, passo = 4 * 2 ** (bande[bande.length - 1].b + 1); let s2 = 0, sopra = 0;
      for (let q = 0; q < K; q++) { const X = FI.ondeEsatte(tr, xc + (q % 40) * passo - 20 * passo, yc + Math.floor(q / 40) * passo - 20 * passo, 0.37 * q, bande).X; s2 += X * X; if (X > tr.sogliaSchiuma) sopra++; }
      const W = tr.P.copertura;
      riga({ c: 'C6', passaggio: 'mare (Monahan) → finestra (finestra.js)', grandezza: `copertura di schiuma (vento ${num(tr.P.U, 3)} m/s): W contro la parte dei punti coperti`, padre: W, figli: sopra / K, tol: 4 * Math.sqrt((W * (1 - W)) / K), da: `binomiale: 4·√(W(1 − W)/${K}) su punti indipendenti` });
      riga({ c: 'C6', passaggio: 'mare (Monahan) → finestra (finestra.js)', grandezza: 'varianza dell\'accelerazione che frange, normalizzata (ciò che fa P(schiuma) = W)', padre: 1, figli: s2 / K, tol: 4 * Math.sqrt(2 / K), da: `χ²: 4·√(2/${K})` }); });
    // C6: la torbidità (massa dei granelli e dei fiocchi con la loro legge delle taglie) e le bolle sotto la schiuma
    tempo('popolazioni', () => { const f = FI.finestraAcqua(SM, { lon: TB.lon, lat: TB.lat, fondoM: TB.fondoM, P: PM, latoM: 1e-3 }), c = f.popolazioni.campione; let tot = 0, n = 0; for (const x of f.popolazioni.classi) if (x.kgPerM3 != null && (x.tipo === 'granello' || x.tipo === 'fiocco')) { tot += x.kgPerM3; n++; }
      const pad = c.sospeso.sabbia + c.sospeso.limo + c.sospeso.argilla + c.sospeso.fiocchi;
      riga({ c: 'C6', passaggio: 'mare (torbidità) → finestra di 1 mm (finestra.js)', grandezza: `fango sospeso (kg/m³): mare.js contro le classi con le taglie di Stokes (${n} classi)`, padre: pad, figli: tot, tol: 64 * EPS * pad, da: 'esatto (il numero di ogni classe è quello che dà la massa di mare.js: n·ε)' });
      const g = FI.finestraAcqua(SM, { ...opz, latoM: 1e-2 }), B = g.popolazioni.bolle, cl = g.popolazioni.campione.classi.find((x) => x.tipo === 'bolla'), tutta = new Uint8Array(g.N * g.N).fill(1); let nb = 0, att = 0;
      for (let q = 0; q < 6; q++) { const [lo, la] = FI.dalTratto(tr, xc + q * 0.05, yc), h = FI.finestraAcqua(SM, { ...opz, lon: lo, lat: la, latoM: 1e-2 }); nb += FI.bolleSottoSchiuma(h, tutta).filter((p) => !p.zattera).length; att += h.popolazioni.bolle.n * h.L ** 3; }
      riga({ c: 'C6', passaggio: 'mare (bolle) → finestra di 1 cm sotto la schiuma', grandezza: 'bolle visibili in 6 finestre (Deane e Stokes): attese contro contate', padre: att, figli: nb, tol: 4 * Math.sqrt(att), da: '4·√N (Poisson)' });
      riga({ c: 'C6', passaggio: 'mare (bolle) → finestra (mediata sulla copertura)', grandezza: 'bolle per m³: mare.js contro n sotto la schiuma × W', padre: cl ? cl.perM3 : 0, figli: B ? (B.n * g.padre.copertura) / B.legge.parteSopra(B.dVis) : 0, tol: 64 * EPS * (cl ? cl.perM3 : 0), da: 'esatto (n·ε)' }); });
    // C6: a nanometri, l'acqua alla densità di mare.js e ogni ione nel numero della sua concentrazione (Poisson, scatola neutra)
    tempo('nanometri', () => { const somme = {}, attese = {}; let agg = 0, dens = 0;
      for (let q = 0; q < 6; q++) { const sc = FI.scenaNano(SM, { lon: A0.lon + q * 1e-3, lat: A0.lat, latoM: 6e-9, fondoM: A0.fondoM }); agg += sc.aggiustati; dens = Math.max(dens, Math.abs(sc.ripetizioni ** 3 * sc.modello.N / sc.latoNm ** 3 - sc.densitaNm3) / sc.densitaNm3);
        for (const f in sc.messi) { somme[f] = (somme[f] || 0) + sc.messi[f]; attese[f] = (attese[f] || 0) + (sc.attesi[f] || 0); } }
      riga({ c: 'C6', passaggio: 'mare (densità) → finestra di 6 nm (finestra.js, acqua mW)', grandezza: 'molecole d\'acqua per nm³: (messe + tolte dagli ioni) contro mare.js (lo scarto relativo)', padre: 0, figli: dens, tol: 1e3 * EPS, da: 'esatto (la scatola mW portata alla densità: n·ε)' });
      const f0 = Object.keys(attese).sort((a, b) => attese[b] - attese[a])[0];
      riga({ c: 'C6', passaggio: 'mare (concentrazioni) → finestra di 6 nm (6 scatole)', grandezza: `ioni ${f0} (il più abbondante: liberi e in coppia) contati contro attesi`, padre: attese[f0], figli: somme[f0], tol: 4 * Math.sqrt(attese[f0]) + agg, da: `4·√N (Poisson) + ${agg} ioni aggiunti o tolti per la neutralità` }); });
    // C6 (lavoro 10): la chimica della finestra (reazioni.js). Sei scatole chiuse di 100 nm col padre di finestra.js
    // (campioneAcqua) e le molecole della resa prebiotica, ognuna lasciata andare con Gillespie: gli atomi di carbonio
    // contati dopo la storia contro Ω·Σ ν_C·c del padre (Poisson di ogni specie: varianza Σ ν_C²·Ω·c)
    tempo('chimica della finestra', () => { let C = 0, att = 0, v = 0, ev = 0, sp = 0;
      for (let q = 0; q < 6; q++) { const L = RE.luogoDelMare(SM, { lon: A0.lon + q * 1e-3, lat: A0.lat, latoM: 1e-7, fondoM: A0.fondoM, pianeta: PM }), S = RE.sistema(L, { profondita: 2, atomiMassimi: 4 }), st = RE.storia(S, { V: L.V, tempo: 1, massimo: 2e4, flussi: null, fasi: null });
        C += RE.conservate(S, st.motore, st.N).C; ev += st.eventi; sp = Math.max(sp, S.chiavi.length); const Om = st.motore.Om; for (const k in S.luogo.molecole) { const i = S.idx.get(k); if (i == null) continue; const n = S.contenuto[i].C, mu = S.luogo.molecole[k] * Om; att += n * mu; v += n * n * mu; } }
      riga({ c: 'C6', passaggio: 'mare → finestra chimica di 100 nm (reazioni.js, 6 scatole)', grandezza: `atomi di carbonio dopo la storia (${ev} eventi, fino a ${sp} specie) contro il padre`, padre: att, figli: C, tol: 4 * Math.sqrt(v), da: '4·√(Σ ν_C²·Ω·c) (Poisson di ogni specie; la storia conserva gli atomi)' });
      const F = RE.chimicaDellaFinestra(SM, { lon: A0.lon, lat: A0.lat, latoM: 1e-6, fondoM: A0.fondoM, pianeta: PM }); console.log(`  la riga dell'app (1 µm, ${Math.round(F.ms)} ms): ${F.riga}`); });
  }
}
manca('C6', 'pianeta → regioni della magnetosfera (cosmo.js regione)', 'campo, particelle', 'M', 'le 12 regioni non hanno un riassunto che ridia il pianeta (le bolle dello zoom leggono il dipolo, non lo sommano)');

// =====================================================================================================
// LA TABELLA
// =====================================================================================================
const L1 = (s, n) => { s = String(s); return s.length > n ? `${s.slice(0, n - 1)}…` : s.padEnd(n); }, R1 = (s, n) => String(s).padStart(n);
console.log(`\ncoerenza tra le scale (C6: M∘μ = I; C8: M∘T_fine − T_grossa∘M), cosmo ${N_COSMO}, ${RIGHE.length} righe\n`);
console.log(`${R1('#', 3)}  ${L1('C', 3)} ${L1('passaggio', 50)} ${L1('grandezza', 72)} ${R1('padre', 11)} ${R1('dai figli', 11)} ${R1('scarto', 11)} ${R1('tolleranza', 11)}  esito`);
console.log('─'.repeat(190));
let fallite = 0, noteTornate = 0;
RIGHE.forEach((r, i) => {
  const sc = r.scarto ?? (Number.isFinite(r.figli) && Number.isFinite(r.padre) ? r.figli - r.padre : null);
  let esito = r.esito; if (esito === 'NON TORNA' && r.nota) esito = 'NON TORNA (nota)'; if (esito === 'TORNA' && r.nota) { esito = 'TORNA (era una nota: toglierla)'; noteTornate++; } if (r.esito === 'NON TORNA' && !r.nota) fallite++;
  console.log(`${R1(i + 1, 3)}  ${L1(r.c, 3)} ${L1(r.passaggio, 50)} ${L1(r.grandezza, 72)} ${R1(num(r.padre), 11)} ${R1(num(r.figli), 11)} ${R1(num(sc), 11)} ${R1(num(r.tol), 11)}  ${esito}`);
  console.log(`${' '.repeat(9)}tolleranza: ${r.da}`);
  if (r.nota && r.esito !== 'TORNA') console.log(`${' '.repeat(9)}perché non torna: ${r.nota.perche} [${r.nota.dove}]`);
});
const conta = (e) => RIGHE.filter((r) => r.esito === e || r.esito.startsWith(e)).length;
console.log(`\n${conta('TORNA')} tornano, ${conta('NON TORNA')} non tornano (${RIGHE.filter((r) => r.esito === 'NON TORNA' && r.nota).length} note), ${conta('misurato')} misurate (C8), ${conta('manca')} senza riassunto o raffinamento`);
console.log(`tempi: ${tempi.filter(([, t]) => t > 300).map(([c, t]) => `${c} ${(t / 1000).toFixed(1)} s`).join(', ')}; in tutto ${((performance.now() - T0) / 1000).toFixed(1)} s`);
if (noteTornate) console.log(`${noteTornate} note ora tornano: vanno tolte dalle note e diventano prove`);
if (fallite) { console.log(`\n${fallite} righe NON TORNANO senza essere note: incoerenze nuove`); process.exit(1); }
console.log('coerenza tra le scale: nessuna incoerenza nuova');
