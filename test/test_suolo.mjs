// test_suolo.mjs — LAVORO 9 di PROGETTO.md, IL SUOLO: la finestra a ogni distanza sulla terra (src/camera/suolo.js).
// INTRECCIO.md, regole 4, 8, 9, 14.
//
// A ogni distanza si calcola, con la legge di quella grana, solo la finestra inquadrata, come campione della cella della mappa;
// riassunta, la finestra ridà il padre (M∘μ = I). Il mondo: il primo mare con il vento del catalogo (mare_col_vento.mjs), il
// punto: la terra asciutta più ripida scendendo di tessera in tessera fino a quella del padre (terra_asciutta.mjs). Nessun seme.
//   A. il padre: la roccia di quel pianeta (φ₀ e L di Athy, le crepe), lo spettro del rilievo (la sua ampiezza ridà la pendenza
//      della cella), il suolo, la colonna;
//   B. due finestre sovrapposte vedono lo stesso suolo (le tessere e le celle hanno l'indirizzo nel tratto);
//   C. lo spettro del rilievo riassunto ridà la varianza della cella (le finestre contro i modi, i modi contro lo spettro);
//   D. la porosità media di una colonna di 10 m ridà quella del padre (che la calcola sull'insieme delle curvature);
//   E. la portata di Darcy ridà la ricarica del clima (la sezione del versante: ciò che esce nel fiume) e l'età di ciò che esce
//      è il volume dei pori diviso la ricarica (Eriksson); la colonna di Dupuit contro la sezione (si stampa);
//   F. l'acqua dei pori conserva gli atomi (il libro: entra = esce, elemento per elemento, e la carica);
//   G. a nanometri la superficie del minerale con l'acqua dei pori sopra;
//   H. il costo.
// LE TOLLERANZE, dichiarate prima: 4 scarti del campionamento (4·sd/√K) per ciò che si conta su K campioni indipendenti
// (punti o finestre più lontani di due tessere dell'ottava più lunga: non hanno tessere in comune); 4 volte la differenza tra
// la quadratura 4×4 e la 8×8 per i modi contro lo spettro continuo (come test_finestre); ZERO per le finestre sovrapposte
// (la stessa aritmetica sugli stessi punti); per Darcy il residuo vero del risolutore (la somma dei bilanci delle celle) e,
// per l'età, quel residuo per l'età più grande della sezione (il limite rigoroso dell'identità di Eriksson discreta); per gli
// atomi l'aritmetica, 64·ε per la somma dei moli che entrano ed escono. I confronti con la natura si stampano e non fermano.
import assert from 'node:assert/strict';
import { mareColVento } from './mare_col_vento.mjs';
import { terraAsciutta } from './terra_asciutta.mjs';
import * as SU from '../src/camera/suolo.js';

const T0 = performance.now(); let ok = 0; const tempi = [], nonTorna = [], confronti = [];
const prova = (nome, f) => { const t = performance.now(); f(); ok++; tempi.push([nome.slice(0, 60), performance.now() - t]); console.log('  ✓', nome); };
const num = (x, c = 3) => (!Number.isFinite(x) ? String(x) : x === 0 ? '0' : Math.abs(x) >= 1e4 || Math.abs(x) < 1e-2 ? x.toExponential(c - 1).replace('.', ',') : String(+x.toPrecision(c)).replace('.', ','));
const EPS = 2 ** -52, QUATTRO = 4, ANNO = 3.156e7;
const media = (a) => a.reduce((x, y) => x + y, 0) / a.length, scarto = (a) => { const m = media(a); return Math.sqrt(a.reduce((x, y) => x + (y - m) ** 2, 0) / (a.length - 1)); };

const M = mareColVento(); assert.ok(M, 'nessun mare con il vento nei primi pianeti del catalogo'); const tMondo = performance.now() - T0;
const S = { k: JSON.stringify(M.via), P: M.P, se: M.se, cl: M.cl, seme: M.P.origine };
let t1 = performance.now(); const PT = terraAsciutta(S); const tPunto = performance.now() - t1; assert.ok(PT, 'nessuna terra asciutta fino alla tessera del padre');
console.log(`il mondo: cosmo 1, galassia ${M.via.galassia}, stella ${M.via.stella}, pianeta ${M.via.pianeta} (${num(tMondo / 1000)} s); il punto ${num(PT.lon, 6)}°, ${num(PT.lat, 5)}° (livello ${PT.livello}, trovato in ${num(tPunto / 1000)} s)`);
nonTorna.push(`geologia.js: nelle tessere del primo livello solo il ${num(100 * PT.asciuttePrimoLivello)}% delle terre resta asciutto (le conche diventano laghi: la madre ne ha 10 su 3067 celle di terra); il suolo c'è solo dove la tessera è asciutta`);

// =====================================================================================================================
console.log('A. il padre: la cella della mappa e la roccia di quel pianeta');
t1 = performance.now(); const PA = SU.padreSuolo(S, PT.lon, PT.lat); const tPadre = performance.now() - t1; assert.ok(PA, 'il punto è asciutto');
const R = PA.roccia, su = PA.suolo, col = PA.colonna, sp = PA.spettro;
prova('la roccia: φ₀ dalla contrazione termica, L di Athy dalla chiusura delle crepe (lo stesso volume di pori), la permeabilità della legge cubica', () => {
  // L = ∫φ dz/φ₀ della chiusura vera: col doppio dei passi cambia meno di 10⁻⁶
  const zMax = ((R.KIC / Math.sqrt((Math.PI * R.lMin) / 2)) / ((R.rho - 1000) * R.g)) * 1.0001; let s = 0; const n = 8000; for (let i = 0; i < n; i++) s += R.aperte(((i + 0.5) * zMax) / n); s *= zMax / n;
  assert.ok(Math.abs(s - R.L) <= 1e-6 * R.L, `L ${R.L} contro ${s}`); assert.ok(R.phi0 > 0 && R.phi0 < 0.2 && R.k0 > 0);
  console.log(`      ${PA.tipo} di questo pianeta: ${R.minerali.map((m) => `${m.nome} ${num(100 * m.v, 2)}%`).join(', ')}; E ${num(R.E / 1e9)} GPa, ν ${num(R.nu)}, K_IC ${num(R.KIC / 1e6)} MPa√m, α_V ${num(R.aV)} 1/K, ρ ${num(R.rho)} kg/m³, cristalli ${num(R.grano * 1000)} mm`);
  console.log(`      φ₀ ${num(R.phi0)} (da ${num(R.Tfuso - 273.15)} °C a ${num(R.Tsup - 273.15)} °C), L ${num(R.L)} m (g ${num(R.g)} m/s²), crepe di 1 m aperte ${num(R.apertura(1) * 1e6)} µm, k₀ ${num(R.k0)} m²; per tipo [R] erano φ₀ ${R.confronto.phi0} e L ${R.confronto.L} m (${R.confronto.fonte})`);
  if (R.phi0 < R.confronto.phi0 / 2 || R.phi0 > 2 * R.confronto.phi0 || R.L < R.confronto.L / 2 || R.L > 2 * R.confronto.L) nonTorna.push(`φ₀ e L del ${PA.tipo} di questo pianeta (${num(R.phi0)}, ${num(R.L)} m) contro quelli della Terra per tipo [R] (${R.confronto.phi0}, ${R.confronto.L} m): ${R.base === 'basalto' ? 'mancano le vescicole e le brecce delle lave; ' : ''}le crepe del grano si chiudono solo a ${num(R.KIC / Math.sqrt((Math.PI * R.lMin) / 2) / 1e6)} MPa`);
});
prova('lo spettro del rilievo fine: la sua funzione di struttura alla lag della cella ridà la pendenza della cella (S²Δ²/2); H dalle pendenze, ℓ_c dai pendii contro i fiumi', () => {
  const forma = (k) => Math.pow(k, -2 - 2 * PA.H) / (1 + (k * PA.lc) ** 2) ** 2, V = (n) => { const a = 1e-7 / PA.D, b = 1e5 / PA.D, L = Math.log(b / a); let s = 0; for (let i = 0; i < n; i++) { const k = a * Math.exp(((i + 0.5) * L) / n); s += forma(k) * k * (1 - SU.J0(k * PA.D)) * k; } return (4 * Math.PI * sp.C * s * L) / n; };
  const v1 = V(4800), v2 = V(9600), atteso = (PA.S * PA.D) ** 2 / 2; assert.ok(Math.abs(v2 - atteso) <= QUATTRO * Math.abs(v1 - v2) + 1e-12 * atteso, `V(Δ) ${v2} contro ${atteso}`);
  console.log(`      cella ${num(PA.D)} m, pendenza ${num(100 * PA.S)}% (la mappa intera ${num(100 * PA.Sradice)}% su ${num(PA.Dradice / 1000)} km) → H ${num(PA.H)}; ${PA.classe}: K ${num(PA.Kf)}, pioggia ${num(PA.pioggia)} m/anno → ℓ_c ${num(PA.lc)} m; scarto sotto la cella ${num(Math.sqrt(sp.sigma2) * 1000)} mm, curvatura lisciata ${num(Math.sqrt(sp.sigma2k))} 1/m`);
  console.log(`      il suolo: ${num(su.h)} m (Heimsath; la cella si abbassa ${num(PA.Ecella * 1e6)} m/Ma, i grani ci restano ${num(su.tSuolo)} anni), ${su.gsd.classi.map((c) => `${c.nome} ${num(100 * c.massa, 2)}%`).join(', ')}; pori ${num(su.phi)}, k ${num(su.k)} m²; falda ${num(su.falda)} m; ricarica ${num(PA.ricarica)} m/anno su ${num(PA.pioggia)} di pioggia`);
});

// =====================================================================================================================
console.log('B. due finestre sovrapposte vedono lo stesso suolo');
const F1 = SU.finestraSuolo(S, { lon: PT.lon, lat: PT.lat, latoM: 1 }), tr = F1.tratto, [xc, yc] = SU.nelTrattoSuolo(tr, PT.lon, PT.lat);
prova('il rilievo fine, lo spessore del suolo e i granelli nella parte in comune: scarto zero (le stesse tessere, le stesse celle, gli stessi punti)', () => {
  const [lo2, la2] = SU.dalTrattoSuolo(tr, xc + 0.37, yc - 0.21), F2 = SU.finestraSuolo(S, { lon: lo2, lat: la2, latoM: 1 }); assert.equal(F2.tratto, tr);
  const C1 = F1.campo, C2 = F2.campo; let d = 0, dh = 0, n = 0, s = 0;
  for (let j = 0; j < F1.N; j++) for (let i = 0; i < F1.N; i++) { const gi = F1.gx0 + i - F2.gx0, gj = F1.gy0 + j - F2.gy0; if (gi < 0 || gj < 0 || gi >= F2.N || gj >= F2.N) continue; const a = j * F1.N + i, b = gj * F2.N + gi; d = Math.max(d, Math.abs(C1.Z[a] - C2.Z[b])); dh = Math.max(dh, Math.abs(C1.h[a] - C2.h[b])); s += C1.Z[a] ** 2; n++; }
  // i granelli di una finestra larga quattro grani della classe più grossa e di una spostata di un grano: gli stessi nella parte in comune
  const Lg = 4 * Math.max(...su.gsd.classi.map((c) => c.d50)), G1f = SU.finestraSuolo(S, { tratto: tr, centro: [xc, yc], latoM: Lg }), G2f = SU.finestraSuolo(S, { tratto: tr, centro: [xc + Lg / 4, yc + Lg / 8], latoM: Lg });
  const dentro = (f, g) => g.x >= f.x0 && g.x < f.x0 + f.L && g.y >= f.y0 && g.y < f.y0 + f.L, G1 = SU.granelli(G1f).lista, G2 = SU.granelli(G2f).lista, chiave = (g) => `${g.minerale}|${g.x}|${g.y}|${g.d}`;
  const comuni1 = new Set(G1.filter((g) => dentro(G1f, g) && dentro(G2f, g)).map(chiave)), comuni2 = new Set(G2.filter((g) => dentro(G1f, g) && dentro(G2f, g)).map(chiave)); let diversi = 0; for (const k of comuni1) if (!comuni2.has(k)) diversi++; for (const k of comuni2) if (!comuni1.has(k)) diversi++;
  console.log(`      1 m: ${n} punti in comune, scarto massimo della quota ${num(d)} m (rms del rilievo ${num(Math.sqrt(s / n))} m), del suolo ${num(dh)} m; ${num(Lg * 1000)} mm: ${comuni1.size} granelli in comune, ${diversi} diversi`);
  assert.ok(n > 1000 && d === 0 && dh === 0 && diversi === 0 && comuni1.size > 0);
});

// =====================================================================================================================
console.log('C. lo spettro riassunto ridà la varianza della cella');
let CURV = null; const bande = SU.bandeSuolo(tr), Ttop = bande[bande.length - 1].T, PASSO = 2 * Ttop;
prova('la varianza della quota fine (e della curvatura lisciata) su punti indipendenti contro Σs dei modi, e Σs contro l\'integrale dello spettro sotto la cella', () => {
  const K = 256, Q = [], Kq = [];
  for (let q = 0; q < K; q++) { const r = SU.rilievoEsatto(tr, xc + (q % 16) * PASSO + 0.123, yc + Math.floor(q / 16) * PASSO - 0.071, bande); Q.push(r.z * r.z); Kq.push(r.kappa * r.kappa); }
  const discreto = bande.reduce((a, B) => a + B.varianza, 0), discretoK = bande.reduce((a, B) => a + B.curvatura, 0), m = media(Q), tol = (QUATTRO * scarto(Q)) / Math.sqrt(K), mk = media(Kq), tolk = (QUATTRO * scarto(Kq)) / Math.sqrt(K);
  SU.RILIEVO.quadratura = 8; tr.bande.clear(); const b8 = SU.bandeSuolo(tr), d8 = b8.reduce((a, B) => a + B.varianza, 0), d8k = b8.reduce((a, B) => a + B.curvatura, 0); SU.RILIEVO.quadratura = 4; tr.bande.clear(); SU.bandeSuolo(tr);
  const tolQ = QUATTRO * Math.abs(d8 - discreto), tolQk = QUATTRO * Math.abs(d8k - discretoK); CURV = { d4: discretoK, d8: d8k };
  console.log(`      ${bande.length} ottave (${bande[0].b}…${bande[bande.length - 1].b}); quota: ${K} punti ${num(m)} m² contro Σs ${num(discreto)} ± ${num(tol)}; Σs contro ∫P ${num(sp.sigma2)} ± ${num(tolQ)} (4×4 contro 8×8)`);
  console.log(`      curvatura lisciata: ${num(mk)} contro Σs·k⁴ ${num(discretoK)} ± ${num(tolk)}; contro ∫P·k⁴ ${num(sp.sigma2k)} ± ${num(tolQk)}`);
  assert.ok(Math.abs(m - discreto) <= tol, 'le finestre contro i modi'); assert.ok(Math.abs(discreto - sp.sigma2) <= tolQ + 1e-8 * sp.sigma2, 'i modi contro lo spettro');
  assert.ok(Math.abs(mk - discretoK) <= tolk, 'curvatura: le finestre contro i modi'); assert.ok(Math.abs(discretoK - sp.sigma2k) <= tolQk + 1e-8 * sp.sigma2k, 'curvatura: i modi contro lo spettro');
});

// =====================================================================================================================
console.log('D. la porosità media di una colonna ridà quella del padre');
prova('64 finestre di 10 m indipendenti: la porosità dei primi 10 m (suolo di Heimsath sulla curvatura del punto, poi Athy) contro la media del padre sull\'insieme delle curvature', () => {
  const K = 64, Q = []; let sotto = 0, vista = 0, hMin = Infinity, hMax = 0;
  for (let q = 0; q < K; q++) { const f = SU.finestraSuolo(S, { tratto: tr, centro: [xc + (q % 8) * PASSO, yc + Math.floor(q / 8) * PASSO], latoM: 10 }); Q.push(media(Array.from(f.campo.porosita))); sotto = Math.max(sotto, f.curvaturaSotto); vista = f.curvaturaVista; for (const h of f.campo.h) { hMin = Math.min(hMin, h); hMax = Math.max(hMax, h); } }
  const phiCol = (h) => SU.porositaColonna(PA, h, 10), padreVisto = SU.mediaSuCurvatura(PA, phiCol, 1601, vista), padre = su.porositaColonna10, padre2 = SU.mediaSuCurvatura(PA, phiCol, 3201);
  // (le tolleranze: il campionamento delle finestre; per il padre la quadratura dei modi — la curvatura 4×4 contro 8×8 di C — e i trapezi sulle curvature, 1601 contro 3201 punti)
  const m = media(Q), tol = (QUATTRO * scarto(Q)) / Math.sqrt(K) || 64 * EPS * padre, tolQ = QUATTRO * (Math.abs(SU.mediaSuCurvatura(PA, phiCol, 1601, CURV.d4) - SU.mediaSuCurvatura(PA, phiCol, 1601, CURV.d8)) + Math.abs(padre2 - padre)) + 64 * EPS * padre;
  console.log(`      finestre ${num(m, 6)} ± ${num(tol)} contro il padre con la curvatura che le finestre vedono ${num(padreVisto, 6)}; il padre (∫P) ${num(padre, 6)} ± ${num(tolQ)} (la quadratura dei modi e delle curvature); curvatura sotto il punto ${num(sotto)} contro ${num(vista)}`);
  console.log(`      lo spessore del suolo nelle finestre va da ${num(hMin)} a ${num(hMax)} m (il padre: ${num(su.h)} m in media)`);
  assert.ok(Math.abs(m - padreVisto) <= tol + 64 * EPS * padre, 'le finestre contro il padre'); assert.ok(sotto <= 1e-9 * vista, 'la curvatura che il suolo sente sta tutta nelle ottave della finestra'); assert.ok(Math.abs(padreVisto - padre) <= tolQ, 'il padre visto contro il padre');
});

// =====================================================================================================================
console.log('E. Darcy: la portata ridà la ricarica del clima, e l\'età di ciò che esce');
let SV = null;
prova('la sezione del versante (dal crinale al fiume, con la K della colonna): ciò che esce nel fiume è la ricarica del deflusso di meteo.js; l\'età media di ciò che esce è il volume dei pori diviso la ricarica', () => {
  t1 = performance.now(); SV = SU.sezioneVersante(col, { ell: PA.lc }); const ms = performance.now() - t1, tol = SV.residuo + 64 * EPS * SV.ricarica;
  const tolEta = ((SV.residuo * SV.etaMassima) / SV.uscita + 1e3 * EPS * SV.tempoDiRicambio);
  console.log(`      ricarica ${num(PA.ricarica * 1000)} mm/anno (deflusso del secchio di meteo.js) × ℓ ${num(PA.lc)} m = ${num(SV.ricarica)} m²/s; nel fiume ${num(SV.uscita)} m²/s ± ${num(tol)} (residuo vero; ${SV.iterazioni} iterazioni, ${num(ms)} ms)`);
  console.log(`      età di ciò che esce ${num(SV.etaUscita / ANNO, 8)} anni contro V/Q ${num(SV.tempoDiRicambio / ANNO, 8)} ± ${num(tolEta / ANNO)} (Eriksson; l'età più grande della sezione ${num(SV.etaMassima / ANNO)} anni)`);
  assert.ok(Math.abs(SV.uscita - SV.ricarica) <= tol, 'portata'); assert.ok(Math.abs(SV.etaUscita - SV.tempoDiRicambio) <= tolEta, 'età');
  // la colonna (Dupuit regionale) contro la sezione del versante (il sistema locale): quanta acqua scende sotto z
  const righe = [5, 20, 35, 50].map((k) => `${num(SV.z[k])} m: sezione ${num(SV.qz[k] * ANNO * 1000)}, colonna ${num(col.flusso(SV.z[k]) * 1000)} mm/anno`);
  confronti.push(`acqua che scende sotto z (la sezione locale di ℓ = ${num(PA.lc)} m contro la colonna di Dupuit, che è il sistema regionale): ${righe.join('; ')}`);
  const k = 50; if (SV.qz[k] * ANNO < col.flusso(SV.z[k]) / 3) nonTorna.push(`la colonna usa la partizione di Dupuit (il sistema regionale); il versante da solo manda sotto ${num(SV.z[k])} m ${num(col.flusso(SV.z[k]) / (SV.qz[k] * ANNO))} volte meno acqua: il tempo di residenza in profondità dipende da quanto sono lunghi i sistemi regionali, che la mappa non dice`);
  console.log(`      tempo di residenza della colonna: ${[1, 10, 100, 1000, 3000].map((z) => `${z} m ${num(col.residenza(z))} anni`).join(', ')}; ${num(col.temperatura(1000) - 273.15)} °C a 1 km`);
});

// =====================================================================================================================
console.log('F. l\'acqua dei pori conserva gli atomi');
const ACQUE = [];
prova('la pioggia con la CO₂ dell\'aria scioglie la roccia del pianeta nel tempo di residenza: il libro degli atomi (entra = esce) elemento per elemento, e la carica', () => {
  for (const z of [su.h / 2, 100, 1000]) { const A = SU.acquaDelPunto(PA, z); ACQUE.push(A); let peggio = 0, qual = '';
    for (const e of new Set([...Object.keys(A.libro.entra), ...Object.keys(A.libro.esce)])) { if (e === 'q') continue; const a = A.libro.entra[e] || 0, b = A.libro.esce[e] || 0, tol = 64 * EPS * (a + b); assert.ok(Math.abs(a - b) <= tol, `${e} a ${z} m: entra ${a}, esce ${b}`); const r = a + b > 0 ? Math.abs(a - b) / (a + b) : 0; if (r > peggio) { peggio = r; qual = e; } }
    const qs = Object.entries(A.ioni).reduce((s, [f, c]) => s + Math.abs(c) * (f.includes('2') ? 2 : 1), 0); assert.ok(Math.abs(A.carica) <= 64 * EPS * qs + 1e-300, `carica ${A.carica}`);
    console.log(`      ${num(z)} m (${A.aperto ? 'aperta all\'aria' : 'chiusa'}, ${num(A.anni)} anni, ${num(A.T - 273.15)} °C): pH ${num(A.pH)}, ${Object.entries(A.ioni).filter(([f, c]) => c > 1e-7 && f !== 'H+' && f !== 'OH-').map(([f, c]) => `${f} ${num(c * 1000)}`).join(', ')} mmol/kg, silice ${num(A.neutri.H4SiO4 * 1000)}; nati ${Object.entries(A.solidi).filter(([, x]) => x > 0).map(([f, x]) => `${f} ${num(x * 1000)}`).join(', ') || 'niente'} mmol/kg; il peggiore ${qual} ${num(peggio)}; carica ${num(A.carica)}`);
    console.log(`         saturazione (log Ω): ${Object.entries(A.saturazione).map(([m, x]) => `${m} ${num(x)}`).join(', ')}`); }
});

// =====================================================================================================================
console.log('G. a nanometri: la superficie del minerale con l\'acqua dei pori sopra');
prova('la scena: il reticolo del minerale sotto, l\'acqua liquida fitta (mW) alla sua densità sopra, ogni ione della composizione nel suo numero', () => {
  t1 = performance.now(); const sc = SU.scenaSuolo(PA, { latoM: 6e-9 }); const ms = performance.now() - t1, nA = sc.atomi.pos.length / 3, minerale = sc.parti[0];
  assert.ok(minerale.a > 0 && sc.conteggi.acqua > 0 && nA > minerale.a);
  console.log(`      ${sc.descrizione} — ${minerale.a} atomi di ${sc.minerale}, ${nA} in tutto, ${num(ms)} ms`);
});

// =====================================================================================================================
console.log('H. il costo');
prova('il padre (la tessera e la cella), le finestre dai 10 m al decimo di millimetro (create quando le si guarda, con l\'immagine), la sezione, l\'acqua dei pori', () => {
  const righe = [`il padre ${num(tPadre)} ms (con le tessere fino al livello ${PA.livello})`];
  for (const L of [10, 1, 0.1, 0.01, 1e-3, 1e-4]) { const t = performance.now(), f = SU.finestraSuolo(S, { lon: PT.lon + 1e-7, lat: PT.lat, latoM: L }), t2 = performance.now(); const px = SU.immagineSuolo(f); assert.equal(px.length, 4 * f.N * f.N); righe.push(`${num(L)} m ${num(t2 - t)} + ${num(performance.now() - t2)} ms`); }
  console.log(`      ${righe.join('; ')}`);
});

console.log(`\nCONFRONTI (si stampano, non fermano):`); for (const x of confronti) console.log(`  · ${x}`);
console.log(`\nNON TORNA dichiarati (${nonTorna.length}):`); for (const x of nonTorna) console.log(`  · ${x}`);
console.log(`\nsuolo: ${ok} prove in ${num((performance.now() - T0) / 1000)} s (il mondo ${num(tMondo / 1000)} s; ${tempi.filter(([, t]) => t > 500).map(([n, t]) => `${n}… ${num(t / 1000)} s`).join('; ')})`);
