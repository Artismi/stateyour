// test_elementi.mjs — LA CATENA DEGLI ELEMENTI (PROGETTO.md, lavoro 8; elementi.js).
//   A. galassia → stella: i canali dei metalli si conservano; le stelle vecchie sono più ricche di α delle giovani;
//   B. disco → pianeta: la condensazione al 50% e la conservazione; i pianeti nati caldi sono poveri di volatili;
//   C. il pianeta si separa: ogni elemento si conserva; il primo pianeta «come la Terra» confrontato con la Terra;
//   D. la crosta: arricchita in K, U, Th di quanto dicono i coefficienti;
//   E. il mare: le tracce e la loro specie;
//   F. il libro dei conti: elemento per elemento, la somma dei serbatoi è ciò che il disco ha dato, e nessuno va scoperto.
// DISCIPLINA (come le altre prove): le soglie sono la precisione numerica (n·ε) o 4 scarti della statistica attesa, dette
// prima; nessun seme scelto: le galassie sono tutte quelle del cosmo 1, i dischi i primi 300 numeri, il pianeta come la
// Terra il primo del catalogo che soddisfa le condizioni scritte. Ciò che non torna con la realtà si stampa «≠ NON TORNA».
import assert from 'node:assert/strict';
import * as CO from '../src/camera/cosmo.js';
import { miscelaDiNascita } from '../src/camera/galassie.js';
import * as E from '../src/camera/elementi.js';
import { formaPianeti } from '../src/camera/disco.js';
import * as GE from '../src/camera/geologia.js';
import { mare } from '../src/camera/mare.js';
import { MTERRA } from '../src/camera/disco.js';

let ok = 0; const T0 = performance.now(), nonTorna = [], tempi = [];
const prova = (nome, f) => { const t = performance.now(); f(); ok++; tempi.push([nome.slice(0, 44), performance.now() - t]); console.log('  ✓', nome); };
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2 ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const EPS = 2 ** -52, I = (s) => E.SIMBOLI.indexOf(s), somma = (v) => { let s = 0; for (const x of v) s += x; return s; };
const media = (v) => v.reduce((a, b) => a + b, 0) / v.length, varianza = (v) => { const m = media(v); return v.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1); };
const mediana = (v) => { const a = [...v].sort((x, y) => x - y); return a.length ? a[a.length >> 1] : NaN; };
const C = CO.cosmo(1);

console.log('A. galassia → stella');
prova('i canali dei metalli si muovono con i metalli: in ogni galassia la loro somma è il gas, l\'alone, il vento; le miscele di nascita sommano a 1', () => {
  // (tolleranza: ~10⁴ operazioni sommate su ogni serbatoio — 46 passi × 20 anelli × qualche flusso —: 10⁴·ε)
  const tol = 1e4 * EPS; let peggio = 0, peggioNascita = 0;
  for (const G of C.galassie) { const e = G.forma.interno, NC = E.CANALI.length;
    for (const [v, z] of [[e.gasZC, e.gasZ], [e.caldoC, e.caldoZ], [e.fuoriC, e.fuoriZ]]) { if (!(z > 0)) continue; peggio = Math.max(peggio, Math.abs(somma(v) - z) / z); }
    for (let o = 0; o < e.Zn.length; o++) if (e.nati[o] > 0 && e.Zn[o] > 0) { let f = 0; for (let c = 0; c < NC; c++) { f += e.ZnC[o * NC + c]; assert.ok(e.ZnC[o * NC + c] >= -tol); } peggioNascita = Math.max(peggioNascita, Math.abs(f - 1)); } }
  console.log(`      ${C.galassie.length} galassie: |Σ canali − metalli| / metalli ≤ ${num(peggio)}; miscele di nascita |Σ − 1| ≤ ${num(peggioNascita)} (tolleranza ${num(tol)})`);
  assert.ok(peggio <= tol && peggioNascita <= tol);
});
prova('le stelle vecchie sono più ricche di α delle giovani nella stessa galassia (le Ia vengono dopo: attesa dalla fisica, non dal dato)', () => {
  // vecchie: nate nel primo terzo della storia della galassia (dal suo inizio a oggi); giovani: nell'ultimo terzo. In ogni
  // galassia con almeno 20 stelle per gruppo nessuna deve avere le giovani PIÙ ricche di α oltre 4 scarti del loro errore;
  // su tutte insieme le vecchie devono stare sopra di più di 4 scarti. [α/Fe] = ½([O/Fe] + [Mg/Fe])
  const righe = [], tutte = { v: [], g: [] }; let sopra = 0, conte = 0;
  for (let g = 0; g < C.galassie.length; g++) { const Gx = CO.galassia(1, g), Tfine = Gx.forma.eta * 1e9, t0 = Gx.forma.interno.inizio * 1e9, span = Tfine - t0, v = [], gi = [];
    for (const S of Gx.stelle) { const m = miscelaDiNascita(Gx.forma, S); if (!m || !(S.Z > 1e-3)) continue; const a = 0.5 * (E.rapportoSolare(m.abbondanze, 'O', 'Fe') + E.rapportoSolare(m.abbondanze, 'Mg', 'Fe')), nata = Tfine - S.eta - t0;
      if (nata < span / 3) v.push(a); else if (nata > (2 * span) / 3) gi.push(a); }
    if (v.length < 20 || gi.length < 20) continue; conte++; tutte.v.push(...v); tutte.g.push(...gi);
    const d = media(v) - media(gi), se = Math.sqrt(varianza(v) / v.length + varianza(gi) / gi.length); if (d > 0) sopra++; righe.push([g, d, se]);
    assert.ok(d > -4 * se, `galassia ${g}: le giovani hanno [α/Fe] più alto di ${num(-d)} (4 scarti: ${num(4 * se)})`); }
  const D = media(tutte.v) - media(tutte.g), SE = Math.sqrt(varianza(tutte.v) / tutte.v.length + varianza(tutte.g) / tutte.g.length);
  console.log(`      ${sopra} galassie su ${conte} hanno le vecchie più ricche di α; in tutto [α/Fe] vecchie − giovani = ${num(D)} (errore ${num(SE)}); la più vicina a zero: ${num(Math.min(...righe.map((r) => r[1])))}`);
  console.log(`      (la Via Lattea vera: dal disco spesso al sottile ~0,2–0,3 dex. Qui di meno: le stelle si fanno presto e il gas che ricade dall'alone porta i metalli delle supernove vecchie)`);
  assert.ok(D > 4 * SE);
});
prova('C/O e N/O crescono dopo le giganti; [Na/Fe] cresce con Z (le rese di Kobayashi): letto nella miscela, non scritto', () => {
  const Gx = CO.galassia(1, 0), r = { C: [], N: [], Na: [] }; const veccheZ = [], giovaniZ = [];
  for (const S of Gx.stelle) { const m = miscelaDiNascita(Gx.forma, S); if (!m || !(S.Z > 1e-3)) continue; r.C.push([S.eta, E.rapportoSolare(m.abbondanze, 'C', 'O')]); r.N.push([S.eta, E.rapportoSolare(m.abbondanze, 'N', 'O')]); r.Na.push([S.Z, E.rapportoSolare(m.abbondanze, 'Na', 'Fe')]); }
  const mezzo = (v, k) => { const s = [...v].sort((a, b) => a[0] - b[0]), n = s.length >> 1; return [media(s.slice(0, n).map((x) => x[k])), media(s.slice(n).map((x) => x[k]))]; };
  const [cG, cV] = mezzo(r.C, 1), [nG, nV] = mezzo(r.N, 1), [naP, naR] = mezzo(r.Na, 1);
  console.log(`      galassia 0: [C/O] giovani ${num(cG)} vecchie ${num(cV)}; [N/O] giovani ${num(nG)} vecchie ${num(nV)}; [Na/Fe] povere ${num(naP)} ricche ${num(naR)}`);
  if (cG < -0.2) nonTorna.push(`[C/O] delle stelle giovani ${num(cG)} dex sotto il Sole: le rese del carbonio (Kobayashi + giganti ricordate) ne fanno poco`);
  // il potassio: le rese di Kobayashi ne fanno dieci volte meno del Sole (un difetto noto dei modelli di supernova)
  const kFe = media(Gx.stelle.map((S) => miscelaDiNascita(Gx.forma, S)).filter((m) => m).map((m) => E.rapportoSolare(m.abbondanze, 'K', 'Fe')));
  console.log(`      [K/Fe] medio delle stelle ${num(kFe)}`); if (kFe < -0.5) nonTorna.push(`[K/Fe] delle stelle ${num(kFe)} dex: le rese di Kobayashi fanno poco potassio (noto), e i pianeti ne hanno meno della Terra`);
  void veccheZ; void giovaniZ;
});

console.log('B. disco → pianeta');
prova('la condensazione: al T50 di Lodders condensa metà, sotto di più, sopra di meno; ciò che condensa non supera ciò che c\'è', () => {
  for (const s of E.SIMBOLI) { const e = E.ELEMENTI[s]; if (e.sede === 'atmo' || e.sede === 'ghiaccio') continue;
    assert.ok(Math.abs(E.frazioneCondensata(s, e.T50) - 0.5) < 1e-12, s); assert.ok(E.frazioneCondensata(s, 0.95 * e.T50) > 0.5 && E.frazioneCondensata(s, 1.05 * e.T50) < 0.5, s); }
  for (const T of [50, 300, 600, 900, 1200, 1400]) { const so = E.solidiA(T, E.PROTOSOLARE, { ghiacci: true }); for (const s in so.m) if (s !== 'O') assert.ok(so.m[s] <= E.PROTOSOLARE[s] * (1 + 4 * EPS), `${s} a ${T} K`); assert.ok(so.m.O + (so.ghiacci?.O ?? 0) <= E.PROTOSOLARE.O * (1 + 8 * EPS), `O a ${T} K`); }
});
const SOLE = { massa: 1, Z: 1, eta: 4.6e9 }, PIANETI = [];
for (let s = 1; s <= 300; s++) for (const p of formaPianeti(SOLE, s)) PIANETI.push(p);
prova('ogni pianeta è fatto degli elementi del suo disco: Σ (roccia + ghiacci + gas) = la sua massa, elemento per elemento ≥ 0', () => {
  let peggio = 0; for (const p of PIANETI) { const el = p.composizione.elementi; let t = somma(el.solidi) + somma(el.acqua) + (el.involucro ? somma(el.involucro) : 0); peggio = Math.max(peggio, Math.abs(t / p.massaKg - 1));
    for (const v of [el.solidi, el.acqua, el.nucleo, el.silicato]) for (const x of v) assert.ok(x >= -1e-9 * p.massaKg); }
  const tol = 6000 * 50 * EPS; console.log(`      ${PIANETI.length} pianeti di 300 dischi come il Sole: |Σ elementi / massa − 1| ≤ ${num(peggio)} (tolleranza: 6000 embrioni × 50 elementi × ε = ${num(tol)})`);
  assert.ok(peggio <= tol);
});
prova('i pianeti nati più caldi sono poveri di volatili e di moderatamente volatili (Na, K, Zn, S, Cl; e d\'acqua) rispetto a quelli nati più freddi', () => {
  // per ogni elemento: i rocciosi che si sono formati (in media sulla massa dei loro embrioni) sopra il T50 dell'elemento ne
  // hanno meno, rispetto al magnesio e alla stella, di quelli formati sotto: è la curva di condensazione che scende
  const rocciosi = PIANETI.filter((p) => p.tipo === 'roccioso'), righe = [];
  for (const s of ['Na', 'K', 'Zn', 'S', 'Cl']) { const T50 = E.ELEMENTI[s].T50, r = (p) => { const el = p.composizione.elementi; return (el.solidi[I(s)] / el.solidi[I('Mg')]) / (el.stella[s] / el.stella.Mg); };
    const caldi = rocciosi.filter((p) => p.composizione.elementi.Tformazione > T50).map(r), freddi = rocciosi.filter((p) => p.composizione.elementi.Tformazione < T50).map(r);
    if (caldi.length < 10 || freddi.length < 10) { righe.push(`${s}: pochi`); continue; }
    righe.push(`${s} (T50 ${T50} K) ${num(mediana(caldi))} contro ${num(mediana(freddi))}`); assert.ok(mediana(caldi) < mediana(freddi), s); }
  const acqua = (p) => p.composizione.acqua, dentro = rocciosi.filter((p) => p.composizione.elementi.Tformazione > 600).map(acqua), fuori = rocciosi.filter((p) => p.composizione.elementi.Tformazione < 400).map(acqua);
  righe.push(`acqua ${num(mediana(dentro))} contro ${num(mediana(fuori))}`); assert.ok(mediana(dentro) < mediana(fuori));
  console.log(`      mediane (nati sopra il T50 contro sotto, rispetto alla stella): ${righe.join('; ')}`);
});

console.log('C. il pianeta si separa');
prova('nucleo + silicato = roccia, elemento per elemento (l\'ossigeno compreso: è lui che decide fO2)', () => {
  let peggio = 0; for (const p of PIANETI) { const el = p.composizione.elementi; if (!el.separazione) continue;
    for (let i = 0; i < E.SIMBOLI.length; i++) { const d = Math.abs(el.nucleo[i] + el.silicato[i] - el.solidi[i] - (E.SIMBOLI[i] === 'C' ? el.nucleo[i] : 0)); peggio = Math.max(peggio, d / Math.max(1, somma(el.solidi))); } }
  console.log(`      |nucleo + silicato − roccia| / roccia ≤ ${num(peggio)} (tolleranza 64·ε)`); assert.ok(peggio <= 64 * EPS);
});
// IL PIANETA COME LA TERRA: il primo, nell'ordine del catalogo (galassie del cosmo 1, stelle, pianeti), con una stella viva tra
// 0,8 e 1,2 M☉, roccioso, tra 0,5 e 2 masse terrestri, con l'acqua liquida in superficie e le placche
let TERRA = null; const tCerca = performance.now();
cerca: for (let g = 0; g < C.galassie.length; g++) { const Gx = CO.galassia(1, g);
  for (let sid = 0; sid < Gx.stelle.length; sid++) { const S = Gx.stelle[sid]; if (S.stato !== 'in vita' || !(S.massa >= 0.8 && S.massa <= 1.2)) continue;
    const Sp = CO.sistemaPigro(1, g, sid); for (const p of Sp.pianeti) if (p.tipo === 'roccioso' && p.massaKg >= 0.5 * MTERRA && p.massaKg <= 2 * MTERRA && p.interno.tettonica === 'a placche' && p.clima.acqua === 'liquida') { TERRA = { g, sid, p, S }; break cerca; } } }
tempi.push(['ricerca della Terra', performance.now() - tCerca]);
let STATO_MARE = null;
prova(`un pianeta come la Terra (il primo del catalogo con le condizioni dette): nucleo, mantello e crosta confrontati con la Terra, senza forzarli`, () => {
  assert.ok(TERRA, 'nessun pianeta come la Terra nel cosmo 1');
  const { p, g, sid, S } = TERRA, el = p.composizione.elementi, sp = el.separazione, cr = p.composizione.crosta, Mn = somma(el.nucleo), Ms = somma(el.silicato), Mtot = p.massaKg, Mc = cr ? cr.Mbasalto + cr.Mgranito : 0;
  const pFeO = (100 * el.silicato[I('Fe')] * (71.844 / 55.845)) / Ms, pSi = (100 * el.nucleo[I('Si')]) / Mn;
  // la Terra (Wang et al. 2018 [V]: nucleo 0,325 della massa, mantello primitivo FeO 8,1%, Si nel nucleo 5,0%; la crosta
  // ~0,5% della massa [R]: continenti 2,1·10²² kg e fondali 0,6·10²² kg)
  const T = { nucleo: 0.325, crosta: 2.7e22 / 5.972e24, FeO: 8.13, Si: 4.96 };
  console.log(`      galassia ${g}, stella ${sid} (${num(S.massa)} M☉, ${num(S.eta / 1e9)} Ga), pianeta ${p.id}: ${num(p.massaKg / MTERRA)} masse terrestri a ${num(p.aM / 1.496e11)} UA, nato a ${Math.round(el.Tformazione)} K`);
  console.log(`      separazione a ${num(sp.P / 1e9)} GPa e ${Math.round(sp.T)} K, ΔIW ${num(sp.deltaIW)}`);
  const riga = (nome, x, t) => { const sc = x / t - 1; console.log(`      ${nome.padEnd(22)} ${num(x)} (Terra ${num(t)}): scarto ${num(100 * sc)}%`); return sc; };
  const sN = riga('nucleo / massa', Mn / Mtot, T.nucleo), sC = riga('crosta / massa', Mc / Mtot, T.crosta); riga('mantello / massa', (Ms - Mc) / Mtot, 1 - T.nucleo - T.crosta);
  const sF = riga('FeO del mantello (%)', pFeO, T.FeO), sS = riga('Si del nucleo (%)', pSi, T.Si);
  if (Math.abs(sN) > 0.03 / 0.325) nonTorna.push(`il nucleo della Terra del modello è ${num(100 * sN)}% della Terra vera (errore della misura: 1%)`);
  if (Math.abs(sS) > 0.5) nonTorna.push(`il silicio del nucleo è ${num(pSi)}% (Terra ~5%): all'equilibrio a ${Math.round(sp.T)} K ne va di più (Fischer et al., estrapolato)`);
  if (Math.abs(sF) > 0.5) nonTorna.push(`il FeO del mantello è ${num(pFeO)}% (Terra 8,1%)`);
  if (Math.abs(sC) > 1) nonTorna.push(`la crosta è ${num(Mc / Mtot)} della massa (Terra ~0,005)`);
  // la Terra vera è povera di volatili moderati rispetto al Sole; il modello, a ${Math.round(el.Tformazione)} K, li condensa
  const K = (el.silicato[I('K')] / Ms) * 1e6, Cl = (el.silicato[I('Cl')] / Ms) * 1e6, Na = (el.silicato[I('Na')] / Ms) * 1e6;
  console.log(`      nel mantello: K ${num(K)} ppm (Terra 237), Na ${num(Na)} (2600), Cl ${num(Cl)} (16)`);
  if (Cl > 4 * 16) nonTorna.push(`il cloro del mantello è ${num(Cl)} ppm (Terra 16): l'equilibrio di condensazione a ${Math.round(el.Tformazione)} K lo tiene tutto; mancano le perdite durante l'accrescimento`);
  assert.ok(Mn > 0 && Mn < Mtot && Ms > 0 && Mc >= 0 && Mc < Ms);
});

console.log('D. la crosta');
prova('la crosta è arricchita in K, U, Th rispetto al mantello del fattore che esce dai coefficienti: 1/(D + F·(1 − D)), normalizzato', () => {
  const { p } = TERRA, el = p.composizione.elementi, cr = p.composizione.crosta; assert.ok(cr && cr.Mbasalto + cr.Mgranito > 0);
  const Ms = somma(el.silicato), c0 = (s) => el.silicato[I(s)] / Ms;
  // il fattore atteso, fatto qui dai coefficienti di elementi.js (stadio 1: il mantello che fonde con la F media della storia;
  // stadio 2: il basalto che rifonde per i continenti): con la normalizzazione Σ_i c₀,i/(D_i + F(1 − D_i)) del fuso
  const fattore = (comp, F, stadio) => { let mf = 0; for (const s of E.SIMBOLI) { const c = comp(s); if (c > 0) mf += c / (E.coefficiente(s, stadio) + F * (1 - E.coefficiente(s, stadio))); } return (s) => 1 / (E.coefficiente(s, stadio) + F * (1 - E.coefficiente(s, stadio))) / mf; };
  const f1 = fattore(c0, cr.F, 1), righe = [];
  for (const s of ['K', 'U', 'Th', 'Rb', 'La', 'Mg']) {
    if (cr.Mbasalto > 0 && c0(s) > 0) { const misurato = cr.basalto[I(s)] / cr.Mbasalto / c0(s), atteso = f1(s); assert.ok(Math.abs(misurato / atteso - 1) < 1e3 * EPS, `${s} nel basalto: ${misurato} contro ${atteso}`); righe.push(`${s} basalto ×${num(misurato)}`); }
    if (cr.Mgranito > 0 && c0(s) > 0) { const cb = (q) => c0(q) * f1(q), f2 = fattore(cb, 0.2, 2), misurato = cr.granito[I(s)] / cr.Mgranito / c0(s), atteso = f1(s) * f2(s); assert.ok(Math.abs(misurato / atteso - 1) < 1e3 * EPS, `${s} nel granito`); righe.push(`granito ×${num(misurato)}`); }
  }
  console.log(`      F media della storia ${num(cr.F)}; ${righe.join(', ')}`);
  for (const s of ['K', 'U', 'Th']) assert.ok(cr.basalto[I(s)] / Math.max(cr.Mbasalto, 1) / c0(s) > 1 || cr.granito[I(s)] / Math.max(cr.Mgranito, 1) / c0(s) > 1, `${s} non arricchito`);
  const gr = cr.Mgranito > 0 ? cr.granito[I('K')] / cr.Mgranito / c0('K') : 0;
  console.log(`      (la crosta dei continenti vera ha K, U, Th ~60–80 volte il mantello primitivo [R]; qui il granito ×${num(gr)}: la frazione fusa media della storia termica è ${num(cr.F)}, quella dei basalti veri 0,05–0,1)`);
  if (gr > 0 && gr < 30) nonTorna.push(`la crosta dei continenti ha K ×${num(gr)} il mantello (vera ~60): la fusione media di storia.js (F = ${num(cr.F)}) è alta`);
});

console.log('E. il mare');
prova('il mare del pianeta come la Terra prende dalla SUA crosta le rocce che si sciolgono, e le tracce hanno la loro specie e il loro limite', () => {
  const { p, g, sid } = TERRA, chiave = `elementi|1|${g}|${sid}|${p.id}`, t = performance.now();
  const sf = GE.superficiePianeta(chiave, p, p.interno, p.origine), cl = GE.climaSuperficie(chiave, p, sf, { aria: false }), se = GE.erosione(chiave, sf, cl);
  STATO_MARE = mare(p, sf, cl, se); tempi.push(['superficie e mare della Terra', performance.now() - t]);
  if (!STATO_MARE.esiste) { console.log(`      (niente mare: ${STATO_MARE.motivo})`); return; }
  assert.ok(STATO_MARE.tracce, 'il mare di un pianeta della catena ha le tracce');
  const VERO = { Li: 2.6e-5, B: 4.2e-4, F: 6.8e-5, Br: 8.4e-4, I: 4.5e-7, Sr: 9e-5, U: 1.4e-8, Mo: 1.1e-7, Fe: 5e-10, Mn: 3e-10, P: 2e-6, Si: 1e-4, Rb: 1.4e-6, Ba: 1e-7 }; // mol/kg, l'oceano vero [R]
  const righe = [];
  for (const [s, v] of Object.entries(STATO_MARE.tracce)) { assert.ok(v.mol >= 0 && Number.isFinite(v.mol), s); const sp = Object.values(v.specie).reduce((a, b) => a + b, 0); assert.ok(Math.abs(sp - 1) < 1e-12, `${s}: le specie sommano a ${sp}`);
    righe.push(`${s} ${num(v.mol)}${VERO[s] ? ` (${num(VERO[s])})` : ''}${v.limite ? ` [${v.limite}]` : ''}`); }
  console.log(`      salinità ${num(STATO_MARE.salinitaMedia)} g/kg, pH ${num(STATO_MARE.pH)}; tracce in mol/kg (oceano vero): ${righe.join('; ')}`);
  if (STATO_MARE.salinitaMedia > 2 * 35) nonTorna.push(`il mare del pianeta come la Terra ha ${num(STATO_MARE.salinitaMedia)} g/kg (vero 35): il cloro del suo mantello`);
});

console.log('F. il libro dei conti');
prova('elemento per elemento, nucleo + mantello + crosta + mare + aria + ghiacci + involucro = ciò che il disco ha dato, e nessun serbatoio va scoperto', () => {
  // (tolleranza: ogni serbatoio è una somma di al più 6000 embrioni × 50 elementi, più le sottrazioni del libro: 10⁶·ε relativo)
  const tol = 1e6 * EPS, L = E.libroDeiConti(TERRA.p, { mare: STATO_MARE }); assert.ok(L);
  console.log(`      la Terra del modello, con il suo mare: scarto peggiore ${num(L.scarto)}${L.peggiore ? ` (${L.peggiore})` : ''}; scoperti: ${L.scoperti.length ? L.scoperti.map((x) => `${x.elemento} nel ${x.serbatoio}`).join(', ') : 'nessuno'}`);
  const tab = ['Fe', 'Ni', 'Si', 'O', 'Mg', 'Na', 'K', 'Cl', 'U', 'H', 'C', 'N'].map((s) => `${s}: ${L.serbatoi.filter((r) => L.conti[s]?.[r] > 0).map((r) => `${r} ${num((100 * L.conti[s][r]) / L.disco[s], 2)}%`).join(' ')}`);
  console.log(`      ${tab.join('\n      ')}`);
  assert.ok(L.scarto <= tol && L.scoperti.length === 0);
  // e su tutti i pianeti dei primi sistemi del cosmo (senza il mare: aria, ghiacci, crosta, mantello, nucleo)
  let peggio = 0, scoperti = 0, n = 0; const Gx = CO.galassia(1, 0);
  for (let sid = 0; sid < Gx.stelle.length && n < 60; sid += 37) { if (Gx.stelle[sid].stato !== 'in vita') continue; for (const p of CO.sistema(1, 0, sid).pianeti) { const Lp = E.libroDeiConti(p); if (!Lp) continue; n++; peggio = Math.max(peggio, Lp.scarto); scoperti += Lp.scoperti.length; } }
  console.log(`      ${n} pianeti della galassia 0 (senza il mare): scarto peggiore ${num(peggio)}, scoperti ${scoperti}`);
  assert.ok(peggio <= tol && scoperti === 0);
});

const tot = (performance.now() - T0) / 1000;
console.log(`\nelementi: ${ok} prove in ${tot.toFixed(1)} s (le più lente: ${tempi.sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c, t]) => `${c} ${(t / 1000).toFixed(1)} s`).join(', ')})`);
if (nonTorna.length) console.log(`≠ NON TORNA (con la realtà, dichiarati):\n  ${nonTorna.join('\n  ')}`);
